import { NextRequest, NextResponse } from "next/server";
import type { SearchResponse } from "@/lib/search";

export const dynamic = "force-dynamic";

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";
const SEARCH_TIMEOUT_MS = 8500;

export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams;
  const q = incoming.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  const params = new URLSearchParams({
    q,
    format: "json",
    pageno: incoming.get("pageno") || "1",
    safesearch: incoming.get("safesearch") || "1",
  });

  const categories = incoming.get("categories");
  const language = incoming.get("language");
  const timeRange = incoming.get("time_range");
  const region = incoming.get("region");

  if (categories) params.set("categories", categories);
  if (language) params.set("language", language);
  if (timeRange) params.set("time_range", timeRange);
  if (region && region !== "all") params.set("region", region);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${SEARXNG_URL.replace(/\/$/, "")}/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate, br",
        },
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `SearXNG returned ${response.status}.`, detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = (await response.json()) as SearchResponse;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? "Search timed out. Try again or use a more specific query."
          : "Kurokuro could not reach SearXNG. Start the search backend and try again.",
      },
      { status: timedOut ? 504 : 503 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
