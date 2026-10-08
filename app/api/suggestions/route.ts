import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";
const TIMEOUT_MS = 2500;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${SEARXNG_URL.replace(/\/$/, "")}/autocompleter?q=${encodeURIComponent(q)}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const payload = await response.json();
    const suggestions = Array.isArray(payload)
      ? payload.filter((item): item is string => typeof item === "string").slice(0, 8)
      : [];

    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json({ suggestions: [] });
  } finally {
    clearTimeout(timeout);
  }
}
