import { NextRequest, NextResponse } from "next/server";
import type { SearchResponse } from "@/lib/search";

export const dynamic = "force-dynamic";

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";
const SEARCH_TIMEOUT_MS = 5500;

export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams;
  const q = incoming.get("q")?.trim();

  if (!q) return NextResponse.json({ error: "Missing search query." }, { status: 400 });

  const params = new URLSearchParams({
    q,
    format: "json",
    pageno: incoming.get("pageno") || "1",
    safesearch: incoming.get("safesearch") || "1",
  });

  const categories = incoming.get("categories");
  const language = incoming.get("language");
  const timeRange = incoming.get("time_range");

  if (categories) params.set("categories", categories);
  if (language) params.set("language", language);
  if (timeRange) params.set("time_range", timeRange);
  if (categories === "images" || categories === "videos") params.set("image_proxy", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${SEARXNG_URL.replace(/\/$/, "")}/search?${params.toString()}`, {
      headers: { Accept: "application/json", "Accept-Encoding": "gzip, deflate, br" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json({ error: `SearXNG returned ${response.status}.`, detail: detail.slice(0, 500) }, { status: 502 });
    }

    const data = (await response.json()) as SearchResponse;
    const seen = new Set<string>();
    const results = (data.results || []).filter((result) => {
      const raw = typeof result.url === "string" ? result.url : "";
      if (!raw) return false;
      try {
        const url = new URL(raw);
        url.hash = "";
        for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"]) url.searchParams.delete(key);
        const canonical = url.toString().replace(/\/$/, "").toLowerCase();
        if (seen.has(canonical)) return false;
        seen.add(canonical);
        return true;
      } catch {
        const fallback = raw.replace(/\/$/, "").toLowerCase();
        if (seen.has(fallback)) return false;
        seen.add(fallback);
        return true;
      }
    });

    // Re-rank aggregated results with lightweight local relevance signals.
    // Search operators are treated as constraints rather than ordinary terms.
    const normalizedQuery = q
      .replace(/^:[a-z-]+\s+/i, "")
      .trim()
      .toLowerCase();

    const siteMatch = normalizedQuery.match(/(?:^|\s)site:([^\s]+)/i);
    const filetypeMatch = normalizedQuery.match(/(?:^|\s)filetype:([^\s]+)/i);
    const excludedTerms = [...normalizedQuery.matchAll(/(?:^|\s)-([a-z0-9][\w-]*)/gi)]
      .map((match) => match[1].toLowerCase());

    const phraseMatches = [...normalizedQuery.matchAll(/"([^"]+)"/g)].map((match) => match[1].toLowerCase());
    const cleanedQuery = normalizedQuery
      .replace(/site:[^\s]+/gi, " ")
      .replace(/filetype:[^\s]+/gi, " ")
      .replace(/(?:^|\s)-[a-z0-9][\w-]*/gi, " ")
      .replace(/"([^"]+)"/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    const queryTerms = cleanedQuery
      .split(/\s+/)
      .map((term) => term.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ""))
      .filter((term) => term.length >= 2);

    const siteTarget = siteMatch?.[1]?.toLowerCase().replace(/^www\./, "");
    const filetypeTarget = filetypeMatch?.[1]?.toLowerCase().replace(/^\./, "");

    const trustedDomains = new Set([
      "wikipedia.org", "github.com", "stackoverflow.com", "developer.mozilla.org",
      "docs.python.org", "nodejs.org", "npmjs.com", "arxiv.org", "ieee.org",
      "acm.org", "microsoft.com", "apple.com", "google.com", "cloudflare.com",
      "mozilla.org", "linux.org", "ubuntu.com", "redhat.com",
    ]);

    const freshnessWeight = timeRange ? 1.35 : 1;
    const queryWordCount = queryTerms.length;

    type RankedResult = {
      result: (typeof results)[number];
      score: number;
      originalIndex: number;
      hostname: string;
      intent: "official" | "docs" | "tutorial" | "community" | "news" | "academic" | "general";
    };

    const intentSignals = {
      docs: /docs?|documentation|reference|api|developer|readme|\/reference\//i,
      tutorial: /tutorial|guide|how[- ]to|learn|course|lesson|example|\/learn\//i,
      community: /stackoverflow|reddit|forum|discussion|issue|questions?|answers?/i,
      news: /news|\/news\//i,
      academic: /arxiv|doi|research|paper|journal|study|proceedings?/i,
      official: /official|\/official\//i,
    };

    const queryIntent = {
      docs: /\b(docs?|documentation|api|reference|sdk)\b/i.test(cleanedQuery),
      tutorial: /\b(how|tutorial|guide|learn|example|examples|course)\b/i.test(cleanedQuery),
      community: /\b(error|errors|issue|problem|fix|broken|not working|stackoverflow|question)\b/i.test(cleanedQuery),
      academic: /\b(paper|research|study|algorithm|academic|journal|thesis)\b/i.test(cleanedQuery),
      news: /\b(news|latest|today|current|recent|update|updates)\b/i.test(cleanedQuery) || Boolean(timeRange),
    };

    function classifyIntent(result: (typeof results)[number], hostname: string): RankedResult["intent"] {
      const title = String(result.title || "");
      const content = String(result.content || "");
      const url = String(result.url || "");
      const haystack = `${title} ${url} ${content}`;

      if (String(result.category || "").toLowerCase() === "news" || intentSignals.news.test(haystack)) return "news";
      if (String(result.category || "").toLowerCase() === "science" || intentSignals.academic.test(haystack)) return "academic";
      if (intentSignals.community.test(haystack)) return "community";
      if (intentSignals.docs.test(haystack)) return "docs";
      if (intentSignals.tutorial.test(haystack)) return "tutorial";
      if (trustedDomains.has(hostname) || intentSignals.official.test(haystack)) return "official";
      return "general";
    }

    const ranked: RankedResult[] = results
      .map((result, originalIndex) => {
        const title = String(result.title || "").toLowerCase();
        const content = String(result.content || "").toLowerCase();
        let hostname = "";
        try {
          hostname = new URL(result.url).hostname.toLowerCase().replace(/^www\./, "");
        } catch {
          hostname = "";
        }

        let score = Math.max(0, 100 - originalIndex * 0.35);
        const intent = classifyIntent(result, hostname);

        // Title matches matter much more than generic snippet matches.
        for (const phrase of phraseMatches) {
          if (title.includes(phrase)) score += 48;
          if (content.includes(phrase)) score += 12;
        }

        // Reward complete query coverage and exact title starts.
        const matchedTerms = queryTerms.filter((term) => title.includes(term)).length;
        if (queryWordCount > 0) {
          score += (matchedTerms / queryWordCount) * 28;
          if (matchedTerms === queryWordCount) score += 18;
        }
        if (queryTerms.length > 0 && title.startsWith(queryTerms[0])) score += 10;

        // Give established technical/reference domains a modest boost without
        // overwhelming actual relevance.
        const baseDomain = hostname.replace(/^.*?([^.]+\.[^.]+)$/, "$1");
        if (trustedDomains.has(baseDomain)) score += 7;

        // Prefer fresh results when the user explicitly chose a time range.
        if (freshnessWeight > 1 && (result.publishedDate || result.pubdate)) {
          const published = new Date(String(result.publishedDate || result.pubdate)).getTime();
          if (Number.isFinite(published)) {
            const ageDays = Math.max(0, (Date.now() - published) / 86400000);
            score += Math.max(0, 14 - Math.min(14, ageDays / 2)) * freshnessWeight;
          }
        }

        if (siteTarget) {
          score += hostname === siteTarget ? 55 : hostname.endsWith(`.${siteTarget}`) ? 40 : -80;
        }

        if (filetypeTarget) {
          const pathname = hostname + (result.url.split("?")[0] || "").toLowerCase();
          score += pathname.endsWith(`.${filetypeTarget}`) ? 45 : 0;
        }

        if (hostname && queryTerms.some((term) => hostname.includes(term))) score += 8;

        for (const term of queryTerms) {
          if (title.includes(term)) score += 12;
          if (content.includes(term)) score += 3;
        }

        // Penalize results that only match one term in a multi-term query.
        if (queryTerms.length >= 3 && matchedTerms === 0) score -= 12;
        if (queryTerms.length >= 3 && matchedTerms === 1) score -= 5;

        if (queryTerms.length > 1) {
          const titleTerms = queryTerms.filter((term) => title.includes(term)).length;
          if (titleTerms === queryTerms.length) score += 24;
        }

        for (const excluded of excludedTerms) {
          if (title.includes(excluded)) score -= 60;
          if (content.includes(excluded)) score -= 18;
        }

        // Match the user's apparent intent, but keep these boosts modest so
        // generic relevance still wins when the signal is weak.
        if (queryIntent.docs && intent === "docs") score += 14;
        if (queryIntent.tutorial && intent === "tutorial") score += 14;
        if (queryIntent.community && intent === "community") score += 14;
        if (queryIntent.academic && intent === "academic") score += 16;
        if (queryIntent.news && intent === "news") score += 12;

        return { result, score, originalIndex, hostname, intent };
      })
      .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);

    // Broad searches should not become a wall of results from one domain.
    // Explicit site: searches and highly constrained filetype: searches keep
    // their natural source concentration.
    const diversityEnabled = !siteTarget && !filetypeTarget;
    const diversityStrength = String(categories || "").toLowerCase() === "news" ? 1.35 : 1;
    const selected: RankedResult[] = [];
    const remaining = [...ranked];
    const domainCounts = new Map<string, number>();
    const intentCounts = new Map<RankedResult["intent"], number>();

    while (remaining.length) {
      let bestIndex = 0;
      let bestAdjustedScore = Number.NEGATIVE_INFINITY;

      for (let i = 0; i < remaining.length; i += 1) {
        const candidate = remaining[i];
        const domainCount = domainCounts.get(candidate.hostname) || 0;
        const intentCount = intentCounts.get(candidate.intent) || 0;

        let adjustedScore = candidate.score;
        if (diversityEnabled && candidate.hostname) {
          if (domainCount === 1) adjustedScore -= 10 * diversityStrength;
          else if (domainCount === 2) adjustedScore -= 20 * diversityStrength;
          else if (domainCount >= 3) adjustedScore -= 32 * diversityStrength;
        }

        // For broad queries, gently prefer different result types too. This
        // never overrides a strong relevance advantage.
        if (diversityEnabled && queryWordCount <= 2 && intentCount >= 1) {
          adjustedScore -= 4;
        }

        if (adjustedScore > bestAdjustedScore) {
          bestAdjustedScore = adjustedScore;
          bestIndex = i;
        }
      }

      const [picked] = remaining.splice(bestIndex, 1);
      selected.push(picked);
      domainCounts.set(picked.hostname, (domainCounts.get(picked.hostname) || 0) + 1);
      intentCounts.set(picked.intent, (intentCounts.get(picked.intent) || 0) + 1);
    }

    const rankedResults = selected.map(({ result }) => result);

    function normalizeText(value: unknown) {
      return String(value || "")
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function makeSmartSnippet(content: unknown, terms: string[], phrases: string[]) {
      const text = String(content || "").replace(/\s+/g, " ").trim();
      if (!text || text.length <= 220) return text;

      const lower = text.toLowerCase();
      const anchors = [...phrases, ...terms]
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

      const hit = anchors
        .map((anchor) => ({ anchor, index: lower.indexOf(anchor) }))
        .filter((item) => item.index >= 0)
        .sort((a, b) => a.index - b.index)[0];

      const center = hit?.index ?? 0;
      const windowSize = 220;
      let start = Math.max(0, center - 70);
      let end = Math.min(text.length, start + windowSize);

      if (end - start < windowSize) start = Math.max(0, end - windowSize);

      if (start > 0) {
        const nextSpace = text.indexOf(" ", start);
        if (nextSpace > start && nextSpace < start + 35) start = nextSpace + 1;
      }
      if (end < text.length) {
        const previousSpace = text.lastIndexOf(" ", end);
        if (previousSpace > start + 160) end = previousSpace;
      }

      return (start > 0 ? "… " : "") + text.slice(start, end).trim() + (end < text.length ? " …" : "");
    }

    const withSnippets = ranked.map((result) => {
      if (!["general", "news", "files", "science"].includes(String(result.category || ""))) return result;
      return {
        ...result,
        content: makeSmartSnippet(result.content, queryTerms, phraseMatches),
      };
    });

    // Collapse near-duplicates that escaped URL canonicalization. We only
    // compare results from the same hostname, so different sites are preserved.
    const duplicateBuckets = new Map<string, Array<{ title: string; content: string }>>();
    const deduped = withSnippets.filter((result) => {
      let hostname = "";
      try {
        hostname = new URL(result.url).hostname.toLowerCase().replace(/^www\./, "");
      } catch {
        return true;
      }

      const title = normalizeText(result.title);
      const content = normalizeText(result.content).slice(0, 320);
      if (!hostname || !title) return true;

      const bucket = duplicateBuckets.get(hostname) || [];
      const isDuplicate = bucket.some((existing) => {
        if (existing.title === title) return true;

        const a = new Set(title.split(" ").filter(Boolean));
        const b = new Set(existing.title.split(" ").filter(Boolean));
        const intersection = [...a].filter((word) => b.has(word)).length;
        const titleSimilarity = intersection / Math.max(1, Math.min(a.size, b.size));
        if (titleSimilarity >= 0.9) return true;

        if (!content || !existing.content) return false;
        const contentWords = new Set(content.split(" ").filter((word) => word.length > 3));
        const existingWords = new Set(existing.content.split(" ").filter((word) => word.length > 3));
        if (contentWords.size < 8 || existingWords.size < 8) return false;

        const overlap = [...contentWords].filter((word) => existingWords.has(word)).length;
        return overlap / Math.max(1, Math.min(contentWords.size, existingWords.size)) >= 0.88;
      });

      if (isDuplicate) return false;
      bucket.push({ title, content });
      duplicateBuckets.set(hostname, bucket);
      return true;
    });

    const normalized: SearchResponse = {
      ...data,
      results: deduped,
      number_of_results: deduped.length,
    };

    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json({
      error: timedOut ? "Search timed out. Try again or use a more specific query." : "Kurokuro could not reach SearXNG. Start the search backend and try again.",
    }, { status: timedOut ? 504 : 503 });
  } finally {
    clearTimeout(timeout);
  }
}
