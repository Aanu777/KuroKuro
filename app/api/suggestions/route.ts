import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";
const TIMEOUT_MS = 2200;

function cleanSuggestions(value: unknown, query: string) {
  if (!Array.isArray(value)) return [];

  const normalized = query.trim().toLowerCase();
  const seen = new Set<string>();

  return value
    .map((item) =>
      typeof item === "string"
        ? item
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/[\u0000-\u001f]/g, "")
            .trim()
        : ""
    )
    .filter((item) => {
      if (!item || item.toLowerCase() === normalized || seen.has(item.toLowerCase())) return false;
      seen.add(item.toLowerCase());
      return true;
    })
    .slice(0, 8);
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // SearXNG remains the primary provider so autocomplete follows the
    // instance's configured privacy/search policy.
    const searxResponse = await fetchWithTimeout(
      `${SEARXNG_URL.replace(/\/$/, "")}/autocompleter?q=${encodeURIComponent(q)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    if (searxResponse.ok) {
      const payload = await searxResponse.json();
      const suggestions = cleanSuggestions(
        Array.isArray(payload) ? payload : payload?.suggestions,
        q,
      );

      if (suggestions.length > 0) {
        return NextResponse.json(
          { suggestions },
          { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" } },
        );
      }
    }

    // Fallback: Google's lightweight autocomplete endpoint. This is only used
    // when the local SearXNG autocomplete provider returns nothing.
    const googleResponse = await fetchWithTimeout(
      `https://www.google.com/complete/search?client=gws-wiz&q=${encodeURIComponent(q)}&hl=en`,
      {
        headers: {
          Accept: "application/json,text/plain,*/*",
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      },
    );

    if (googleResponse.ok) {
      const text = await googleResponse.text();
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      if (start >= 0 && end > start) {
        try {
          const parsed = JSON.parse(text.slice(start, end + 1));
          const raw = Array.isArray(parsed?.[0])
            ? parsed[0].map((item: unknown) => Array.isArray(item) ? item[0] : item)
            : [];
          const suggestions = cleanSuggestions(raw, q);

          if (suggestions.length > 0) {
            return NextResponse.json(
              { suggestions },
              { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" } },
            );
          }
        } catch {
          // Fall through to an empty response.
        }
      }
    }

    return NextResponse.json(
      { suggestions: [] },
      { headers: { "Cache-Control": "private, max-age=10" } },
    );
  } catch {
    return NextResponse.json(
      { suggestions: [] },
      { headers: { "Cache-Control": "private, max-age=10" } },
    );
  }
}
