import { NextRequest, NextResponse } from "next/server";
import type { SearchResponse } from "@/lib/search";

export const dynamic = "force-dynamic";

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";

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

  if (categories) params.set("categories", categories);
  if (language) params.set("language", language);
  if (timeRange) params.set("time_range", timeRange);

  try {
    const response = await fetch(`${SEARXNG_URL.replace(/\/$/, "")}/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `SearXNG returned ${response.status}.`, detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = (await response.json()) as SearchResponse;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Kurokuro could not reach SearXNG. Start the search backend and try again." },
      { status: 503 },
    );
  }
}
