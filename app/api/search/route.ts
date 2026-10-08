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

    const ranked = results
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

        for (const phrase of phraseMatches) {
          if (title.includes(phrase)) score += 42;
          if (content.includes(phrase)) score += 14;
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
          if (content.includes(term)) score += 2;
        }

        if (queryTerms.length > 1) {
          const titleTerms = queryTerms.filter((term) => title.includes(term)).length;
          if (titleTerms === queryTerms.length) score += 24;
        }

        for (const excluded of excludedTerms) {
          if (title.includes(excluded)) score -= 60;
          if (content.includes(excluded)) score -= 18;
        }

        return { result, score, originalIndex };
      })
      .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
      .map(({ result }) => result);

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
