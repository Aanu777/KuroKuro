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

    // Re-rank the aggregated results using lightweight local relevance signals.
    // SearXNG still decides which engines contribute; Kurokuro only improves the
    // final ordering so strong title/domain matches rise above noisy matches.
    const normalizedQuery = q
      .replace(/^:[a-z-]+\\s+/i, "")
      .trim()
      .toLowerCase();

    const exactPhrase = normalizedQuery.replace(/^"(.*)"$/, "$1").trim();
    const queryTerms = exactPhrase
      .split(/\\s+/)
      .map((term) => term.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ""))
      .filter((term) => term.length >= 2);

    const ranked = results
      .map((result, originalIndex) => {
        const title = String(result.title || "").toLowerCase();
        const content = String(result.content || "").toLowerCase();
        let hostname = "";
        try {
          hostname = new URL(result.url).hostname.toLowerCase().replace(/^www\\./, "");
        } catch {
          hostname = "";
        }

        let score = Math.max(0, 100 - originalIndex * 0.35);

        if (exactPhrase && title.includes(exactPhrase)) score += 38;
        if (exactPhrase && content.includes(exactPhrase)) score += 12;
        if (normalizedQuery && hostname.includes(normalizedQuery.replace(/\\s+/g, ""))) score += 16;

        for (const term of queryTerms) {
          if (title.includes(term)) score += 11;
          if (content.includes(term)) score += 2;
          if (hostname.includes(term)) score += 5;
        }

        const titleTerms = queryTerms.filter((term) => title.includes(term)).length;
        if (queryTerms.length > 1 && titleTerms === queryTerms.length) score += 20;

        return { result, score, originalIndex };
      })
      .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
      .map(({ result }) => result);

    const normalized: SearchResponse = {
      ...data,
      results: ranked,
      number_of_results: typeof data.number_of_results === "number" ? data.number_of_results : ranked.length,
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
