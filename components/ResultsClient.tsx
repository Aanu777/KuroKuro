"use client";

import Link from "next/link";
import {
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  History,
  Image as ImageIcon,
  Play,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { SearchCategory, SearchResponse, SearchResult } from "@/lib/search";

const categories: Array<{ label: string; value: SearchCategory }> = [
  { label: "Web", value: "general" },
  { label: "Images", value: "images" },
  { label: "Videos", value: "videos" },
  { label: "News", value: "news" },
];

type HistoryEntry = { id: string; query: string; createdAt: string };
type BookmarkEntry = { id: string; title: string; url: string; query: string; createdAt: string };

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getImageUrl(result: SearchResult) {
  const candidates = [result.thumbnail_src, result.thumbnail, result.img_src];
  return candidates.find(isHttpUrl) || null;
}

function getVideoEmbedUrl(result: SearchResult) {
  return isHttpUrl(result.iframe_src) ? result.iframe_src : null;
}

function getPublishedDate(result: SearchResult) {
  const value = result.publishedDate || result.pubdate;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function ResultActions({
  result,
  query,
  saved,
  copied,
  onSave,
  onCopy,
}: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="result-actions">
      <button className="small-action" onClick={onSave}>{saved ? "Saved" : "Save"}</button>
      <button className="small-action" onClick={onCopy}>{copied ? "Copied" : "Copy link"}</button>
      <a className="small-action" href={result.url} target="_blank" rel="noreferrer">
        <ExternalLink size={11} /> Open
      </a>
      {saved && <Check size={13} />}
      {copied && <Copy size={11} />}
      <span className="sr-only">{query}</span>
    </div>
  );
}

function WebResult({
  result,
  query,
  saved,
  copied,
  onSave,
  onCopy,
}: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
}) {
  const image = getImageUrl(result);

  return (
    <article className="result result-web">
      <div className="result-body">
        <div className="result-url">{result.url}</div>
        <a className="result-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
        {result.content && <div className="result-content">{result.content}</div>}
        <div className="result-subline">
          {result.engine && <span>via {result.engine}</span>}
          {getPublishedDate(result) && <span>{getPublishedDate(result)}</span>}
        </div>
        <ResultActions result={result} query={query} saved={saved} copied={copied} onSave={onSave} onCopy={onCopy} />
      </div>
      {image && (
        <a className="result-thumb result-thumb-web" href={result.url} target="_blank" rel="noreferrer">
          <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
        </a>
      )}
    </article>
  );
}

function ImageResult({
  result,
  query,
  saved,
  copied,
  onSave,
  onCopy,
}: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
}) {
  const image = getImageUrl(result);

  return (
    <article className="media-card image-card">
      <a className="media-preview image-preview" href={result.url} target="_blank" rel="noreferrer">
        {image ? (
          <img src={image} alt={result.title} loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="media-placeholder"><ImageIcon size={24} /></div>
        )}
      </a>
      <div className="media-info">
        <a className="media-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
        <div className="media-source">{result.source || result.engine || "Image result"}{result.resolution ? ` · ${result.resolution}` : ""}</div>
        <ResultActions result={result} query={query} saved={saved} copied={copied} onSave={onSave} onCopy={onCopy} />
      </div>
    </article>
  );
}

function VideoResult({
  result,
  query,
  saved,
  copied,
  onSave,
  onCopy,
  playing,
  onPlay,
}: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
  playing: boolean;
  onPlay: () => void;
}) {
  const image = getImageUrl(result);
  const embed = getVideoEmbedUrl(result);

  return (
    <article className="media-card video-card">
      <div className="video-preview">
        {playing && embed ? (
          <iframe
            src={embed}
            title={result.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button className="video-poster" onClick={embed ? onPlay : undefined} aria-label={embed ? `Play ${result.title}` : "Open video"}>
            {image ? (
              <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <div className="media-placeholder"><Play size={28} /></div>
            )}
            <span className="play-button"><Play size={17} fill="currentColor" /></span>
          </button>
        )}
      </div>
      <div className="media-info">
        <a className="media-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
        <div className="media-source">
          {result.engine || "Video result"}
          {result.views ? ` · ${result.views} views` : ""}
          {result.length ? ` · ${result.length}` : ""}
        </div>
        {result.content && <div className="media-description">{result.content}</div>}
        <ResultActions result={result} query={query} saved={saved} copied={copied} onSave={onSave} onCopy={onCopy} />
      </div>
    </article>
  );
}

export default function ResultsClient({ query, category }: { query: string; category: SearchCategory }) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    async function run() {
      setData(null);
      setError("");
      setPlaying(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&categories=${encodeURIComponent(category)}&safesearch=1`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Search failed.");
        if (!alive) return;

        setData(payload);

        const enabled = localStorage.getItem("kurokuro-history-enabled") !== "false";
        if (enabled) {
          const current = JSON.parse(localStorage.getItem("kurokuro-history") || "[]") as HistoryEntry[];
          const next = [
            { id: crypto.randomUUID(), query, createdAt: new Date().toISOString() },
            ...current.filter((item) => item.query !== query),
          ].slice(0, 100);
          localStorage.setItem("kurokuro-history", JSON.stringify(next));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (alive) setError(err instanceof Error ? err.message : "Search failed.");
      }
    }

    run();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [query, category]);

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    window.setTimeout(() => setCopied(null), 1200);
  }

  function saveResult(result: SearchResult) {
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

  const isMedia = category === "images" || category === "videos";

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
            <Link
              key={item.value}
              className={`category ${category === item.value ? "active" : ""}`}
              href={`/search?q=${encodeURIComponent(query)}&category=${item.value}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="results-main">
        <div className={`results-column ${isMedia ? "results-media-column" : ""}`}>
          {error && <div className="error">{error}</div>}
          {!error && !data && (
            <div className="loading-state">
              <span className="loading-dot" />
              <span>Searching</span>
              <span className="loading-ellipsis">…</span>
            </div>
          )}

          {data && (
            <>
              <div className="result-meta">
                Results for <strong>{data.query}</strong>
                {typeof data.number_of_results === "number" ? ` · ${data.number_of_results.toLocaleString()} found` : ""}
              </div>

              {data.results.length === 0 ? (
                <div className="state">No results found.</div>
              ) : category === "images" ? (
                <div className="image-grid">
                  {data.results.map((result, index) => (
                    <ImageResult
                      key={`${result.url}-${index}`}
                      result={result}
                      query={query}
                      saved={saved === result.url}
                      copied={copied === result.url}
                      onSave={() => saveResult(result)}
                      onCopy={() => copyLink(result.url)}
                    />
                  ))}
                </div>
              ) : category === "videos" ? (
                <div className="video-grid">
                  {data.results.map((result, index) => (
                    <VideoResult
                      key={`${result.url}-${index}`}
                      result={result}
                      query={query}
                      saved={saved === result.url}
                      copied={copied === result.url}
                      playing={playing === result.url}
                      onPlay={() => setPlaying(result.url)}
                      onSave={() => saveResult(result)}
                      onCopy={() => copyLink(result.url)}
                    />
                  ))}
                </div>
              ) : (
                data.results.map((result, index) => (
                  <WebResult
                    key={`${result.url}-${index}`}
                    result={result}
                    query={query}
                    saved={saved === result.url}
                    copied={copied === result.url}
                    onSave={() => saveResult(result)}
                    onCopy={() => copyLink(result.url)}
                  />
                ))
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
