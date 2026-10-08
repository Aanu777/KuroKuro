"use client";

import Link from "next/link";
import { Bookmark, Check, Copy, ExternalLink, History, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SearchCategory, SearchResponse } from "@/lib/search";

const categories: Array<{ label: string; value: SearchCategory }> = [
  { label: "Web", value: "general" },
  { label: "Images", value: "images" },
  { label: "Videos", value: "videos" },
  { label: "News", value: "news" },
];

type HistoryEntry = { id: string; query: string; createdAt: string };
type BookmarkEntry = { id: string; title: string; url: string; query: string; createdAt: string };

export default function ResultsClient({ query, category }: { query: string; category: SearchCategory }) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const apiCategory = useMemo(() => category === "general" ? "general" : category, [category]);

  useEffect(() => {
    let alive = true;
    async function run() {
      setData(null);
      setError("");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&categories=${encodeURIComponent(apiCategory)}&safesearch=1`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Search failed.");
        if (alive) setData(payload);

        const enabled = localStorage.getItem("kurokuro-history-enabled") !== "false";
        if (enabled) {
          const current = JSON.parse(localStorage.getItem("kurokuro-history") || "[]") as HistoryEntry[];
          const next = [{ id: crypto.randomUUID(), query, createdAt: new Date().toISOString() }, ...current.filter((item) => item.query !== query)].slice(0, 100);
          localStorage.setItem("kurokuro-history", JSON.stringify(next));
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Search failed.");
      }
    }
    run();
    return () => { alive = false; };
  }, [query, apiCategory]);

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    window.setTimeout(() => setCopied(null), 1200);
  }

  function saveResult(result: NonNullable<SearchResponse["results"]>[number]) {
    const current = JSON.parse(localStorage.getItem("kurokuro-bookmarks") || "[]") as BookmarkEntry[];
    if (current.some((item) => item.url === result.url)) {
      setSaved(result.url);
      return;
    }
    const entry: BookmarkEntry = {
      id: crypto.randomUUID(),
      title: result.title,
      url: result.url,
      query,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("kurokuro-bookmarks", JSON.stringify([entry, ...current]));
    setSaved(result.url);
  }

  return (
    <div className="results-shell">
      <header className="results-header">
        <div className="results-header-inner">
          <Link href="/" className="results-wordmark">KUROKURO</Link>
          <form className="search-form header-search" action="/search">
            <input className="search-input" name="q" defaultValue={query} aria-label="Search the web" autoComplete="off" />
            <input type="hidden" name="category" value={category} />
            <button className="search-submit" type="submit" aria-label="Search"><span>⌕</span></button>
          </form>
          <nav className="header-links" aria-label="Utilities">
            <Link className="icon-link" href="/history" aria-label="History"><History size={17} /></Link>
            <Link className="icon-link" href="/bookmarks" aria-label="Bookmarks"><Bookmark size={17} /></Link>
            <Link className="icon-link" href="/settings" aria-label="Settings"><Settings size={17} /></Link>
          </nav>
        </div>
        <div className="category-row">
          {categories.map((item) => (
            <Link key={item.value} className={`category ${category === item.value ? "active" : ""}`} href={`/search?q=${encodeURIComponent(query)}&category=${item.value}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="results-main">
        <div className="results-column">
          {error && <div className="error">{error}</div>}
          {!error && !data && <div className="state">Searching…</div>}
          {data && (
            <>
              <div className="result-meta">Results for <strong>{data.query}</strong>{typeof data.number_of_results === "number" ? ` · ${data.number_of_results.toLocaleString()} found` : ""}</div>
              {data.results.length === 0 ? <div className="state">No results found.</div> : data.results.map((result, index) => (
                <article className="result" key={`${result.url}-${index}`}>
                  <div className="result-url">{result.url}</div>
                  <a className="result-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
                  {result.content && <div className="result-content">{result.content}</div>}
                  {result.engine && <div className="result-source">via {result.engine}</div>}
                  <div className="result-actions">
                    <button className="small-action" onClick={() => saveResult(result)}>{saved === result.url ? "Saved" : "Save"}</button>
                    <button className="small-action" onClick={() => copyLink(result.url)}>{copied === result.url ? "Copied" : "Copy link"}</button>
                    <a className="small-action" href={result.url} target="_blank" rel="noreferrer"><ExternalLink size={11} /> Open</a>
                    {saved === result.url && <Check size={13} />}
                    {copied === result.url && <Copy size={11} />}
                  </div>
                </article>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
