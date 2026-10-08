"use client";

import Link from "next/link";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
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
  { label: "Maps", value: "map" },
  { label: "Files", value: "files" },
  { label: "Science", value: "science" },
];

const timeRanges = [
  { label: "Any time", value: "" },
  { label: "Past day", value: "day" },
  { label: "Past week", value: "week" },
  { label: "Past month", value: "month" },
  { label: "Past year", value: "year" },
];

type HistoryEntry = { id: string; query: string; createdAt: string };
type BookmarkEntry = { id: string; title: string; url: string; query: string; createdAt: string };

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getImageCandidates(result: SearchResult) {
  return Array.from(
    new Set([result.thumbnail_src, result.thumbnail, result.img_src].filter(isHttpUrl)),
  );
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getDisplaySource(result: SearchResult) {
  return result.source || result.engine || getHostname(result.url) || "Web result";
}

function getSourceDomain(result: SearchResult) {
  return getHostname(result.url) || getDisplaySource(result);
}

function getSourceInitial(result: SearchResult) {
  const source = getSourceDomain(result).trim();
  return source ? source.charAt(0).toUpperCase() : "W";
}

function SourceBadge({ result }: { result: SearchResult }) {
  const domain = getSourceDomain(result);
  return (
    <span className="source-badge" title={domain}>
      <span className="source-badge-mark">{getSourceInitial(result)}</span>
      <span>{domain}</span>
    </span>
  );
}

function getImageUrl(result: SearchResult) {
  return getImageCandidates(result)[0] || null;
}

function getImageAspect(result: SearchResult) {
  const width = Number(result.width);
  const height = Number(result.height);
  if (width > 0 && height > 0) return width / height;
  return 4 / 3;
}

function getMediaLabel(result: SearchResult) {
  return result.img_format ? String(result.img_format).toUpperCase() : "";
}

function getVideoHost(result: SearchResult) {
  return getHostname(result.url) || getDisplaySource(result);
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

function MediaImage({
  result,
  alt,
  className,
}: {
  result: SearchResult;
  alt: string;
  className?: string;
}) {
  const candidates = getImageCandidates(result);
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  if (!src) return <div className="media-placeholder"><ImageIcon size={24} /></div>;

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIndex((current) => current + 1)}
    />
  );
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

function WebResult(props: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
}) {
  const { result, query, saved, copied, onSave, onCopy } = props;
  const image = getImageUrl(result);

  return (
    <article className="result result-web">
      <div className="result-body">
        <div className="result-source-line"><SourceBadge result={result} /></div>
        <a className="result-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
        {result.content && <div className="result-content">{result.content}</div>}
        <div className="result-subline">
          {result.engine && <span>via {result.engine}</span>}
          {result.author && <span>by {result.author}</span>}
          {getPublishedDate(result) && <span>{getPublishedDate(result)}</span>}
        </div>
        <ResultActions result={result} query={query} saved={saved} copied={copied} onSave={onSave} onCopy={onCopy} />
      </div>
      {image && (
        <a className="result-thumb result-thumb-web" href={result.url} target="_blank" rel="noreferrer">
          <MediaImage result={result} alt="" />
        </a>
      )}
    </article>
  );
}

function NewsResult(props: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
}) {
  const { result, query, saved, copied, onSave, onCopy } = props;
  const image = getImageUrl(result);

  return (
    <article className="news-result">
      {image && (
        <a className="news-image" href={result.url} target="_blank" rel="noreferrer">
          <MediaImage result={result} alt="" />
        </a>
      )}
      <div className="news-body">
        <div className="result-subline news-meta">
          <SourceBadge result={result} />
          {getPublishedDate(result) && <span>{getPublishedDate(result)}</span>}
        </div>
        <a className="news-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
        {result.content && <div className="result-content">{result.content}</div>}
        <ResultActions result={result} query={query} saved={saved} copied={copied} onSave={onSave} onCopy={onCopy} />
      </div>
    </article>
  );
}

function ImageResult(props: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
  onPreview: () => void;
}) {
  const { result, query, saved, copied, onSave, onCopy, onPreview } = props;
  const image = getImageUrl(result);

  return (
    <article className="media-card image-card">
      <button
        type="button"
        className="media-preview image-preview image-preview-button"
        style={{ aspectRatio: getImageAspect(result) }}
        onClick={onPreview}
        aria-label={`Preview ${result.title}`}
      >
        {image ? <MediaImage result={result} alt={result.title} /> : (
          <div className="media-placeholder"><ImageIcon size={24} /></div>
        )}
        <span className="image-preview-hint">Preview</span>
      </button>
      <div className="media-info">
        <a className="media-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
        <div className="media-source"><SourceBadge result={result} />{result.resolution ? ` · ${result.resolution}` : ""}{getMediaLabel(result) ? ` · ${getMediaLabel(result)}` : ""}</div>
        <ResultActions result={result} query={query} saved={saved} copied={copied} onSave={onSave} onCopy={onCopy} />
      </div>
    </article>
  );
}

function VideoResult(props: {
  result: SearchResult;
  query: string;
  saved: boolean;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
  playing: boolean;
  onPlay: () => void;
}) {
  const { result, query, saved, copied, onSave, onCopy, playing, onPlay } = props;
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
          <button className="video-poster" onClick={embed ? onPlay : () => window.open(result.url, "_blank", "noopener,noreferrer")} aria-label={embed ? `Play ${result.title}` : "Open video"}>
            {image ? <MediaImage result={result} alt="" /> : (
              <div className="media-placeholder"><Play size={28} /></div>
            )}
            <span className="play-button"><Play size={17} fill="currentColor" /></span>
            {result.length && <span className="video-duration">{result.length}</span>}
          </button>
        )}
      </div>
      <div className="media-info">
        <a className="media-title" href={result.url} target="_blank" rel="noreferrer">{result.title}</a>
        <div className="media-source">
          <SourceBadge result={result} />
          {result.views ? ` · ${result.views} views` : ""}
        </div>
        <div className="video-secondary-meta">
          <span>{getVideoHost(result)}</span>
          {result.length && <span>{result.length}</span>}
        </div>
        {result.content && <div className="media-description">{result.content}</div>}
        <ResultActions result={result} query={query} saved={saved} copied={copied} onSave={onSave} onCopy={onCopy} />
      </div>
    </article>
  );
}

function ImagePreviewModal({
  results,
  index,
  onClose,
  onNavigate,
}: {
  results: SearchResult[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const result = results[index];
  if (!result) return null;

  const image = getImageUrl(result);
  const previousIndex = index > 0 ? index - 1 : results.length - 1;
  const nextIndex = index < results.length - 1 ? index + 1 : 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && results.length > 1) onNavigate(previousIndex);
      if (event.key === "ArrowRight" && results.length > 1) onNavigate(nextIndex);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, onNavigate, previousIndex, nextIndex, results.length]);

  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close preview">×</button>
      {results.length > 1 && (
        <>
          <button type="button" className="lightbox-nav lightbox-prev" onClick={() => onNavigate(previousIndex)} aria-label="Previous image">‹</button>
          <button type="button" className="lightbox-nav lightbox-next" onClick={() => onNavigate(nextIndex)} aria-label="Next image">›</button>
        </>
      )}
      <div className="lightbox-panel">
        <div className="lightbox-media">
          {image ? <MediaImage result={result} alt={result.title} className="lightbox-image" /> : (
            <div className="lightbox-empty"><ImageIcon size={30} /><span>Preview unavailable</span></div>
          )}
        </div>
        <div className="lightbox-info">
          <div className="lightbox-title">{result.title}</div>
          <div className="lightbox-source"><SourceBadge result={result} /></div>
          <div className="lightbox-actions">
            <a className="small-action" href={result.url} target="_blank" rel="noreferrer"><ExternalLink size={11} /> Open original</a>
            <span className="lightbox-counter">{index + 1} / {results.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function LoadingSkeleton({ category }: { category: SearchCategory }) {
  if (category === "images") {
    return <div className="image-grid loading-grid" aria-label="Loading images">
      {Array.from({ length: 8 }).map((_, index) => <div className="skeleton-media-card" key={index}>
        <div className="skeleton skeleton-image" />
        <div className="skeleton-lines"><span className="skeleton skeleton-line wide" /><span className="skeleton skeleton-line short" /></div>
      </div>)}
    </div>;
  }
  if (category === "videos") {
    return <div className="video-grid loading-grid" aria-label="Loading videos">
      {Array.from({ length: 4 }).map((_, index) => <div className="skeleton-media-card" key={index}>
        <div className="skeleton skeleton-video" />
        <div className="skeleton-lines"><span className="skeleton skeleton-line wide" /><span className="skeleton skeleton-line medium" /></div>
      </div>)}
    </div>;
  }
  return <div className="skeleton-results" aria-label="Loading search results">
    {Array.from({ length: 6 }).map((_, index) => <div className="skeleton-result" key={index}>
      <span className="skeleton skeleton-source" /><span className="skeleton skeleton-line title" />
      <span className="skeleton skeleton-line wide" /><span className="skeleton skeleton-line medium" />
    </div>)}
  </div>;
}

function Pagination({ query, category, page, timeRange }: { query: string; category: SearchCategory; page: number; timeRange: string }) {
  const makeUrl = (nextPage: number) => {
    const params = new URLSearchParams({ q: query, category, pageno: String(nextPage) });
    if (timeRange) params.set("time_range", timeRange);
    return `/search?${params.toString()}`;
  };

  return (
    <nav className="pagination" aria-label="Search results pages">
      {page > 1 ? (
        <Link className="page-button" href={makeUrl(page - 1)}><ChevronLeft size={15} /> Previous</Link>
      ) : <span className="page-button disabled"><ChevronLeft size={15} /> Previous</span>}
      <span className="page-number">Page {page}</span>
      <Link className="page-button" href={makeUrl(page + 1)}>Next <ChevronRight size={15} /></Link>
    </nav>
  );
}

export default function ResultsClient({
  query,
  category,
  page,
  timeRange,
}: {
  query: string;
  category: SearchCategory;
  page: number;
  timeRange: string;
}) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [safeSearch, setSafeSearch] = useState("1");

  useEffect(() => {
    const stored = localStorage.getItem("kurokuro-safesearch");
    if (stored === "0" || stored === "1" || stored === "2") setSafeSearch(stored);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.key === "/" && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".results-header .search-input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    async function run() {
      setData(null);
      setError("");
      setPlaying(null);
      setPreviewIndex(null);

      try {
        const language = localStorage.getItem("kurokuro-language") || "all";
        const params = new URLSearchParams({
          q: query,
          categories: category,
          pageno: String(page),
          safesearch: safeSearch,
        });

        // SearXNG accepts both the language API parameter and its :lang
        // search syntax. The explicit syntax helps engines that do not fully
        // honor the global language filter.
        if (language !== "all") {
          params.set("language", language);
          params.set("q", `:${language} ${query}`);
        }
        if (timeRange) params.set("time_range", timeRange);

        const response = await fetch(`/api/search?${params.toString()}`, {
          // Allow the browser to reuse a recent identical search; the API
          // response is still private and short-lived.
          cache: "default",
          signal: controller.signal,
        });
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
  }, [query, category, page, timeRange, safeSearch]);

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

  function changeTimeRange(value: string) {
    const params = new URLSearchParams({ q: query, category });
    if (value) params.set("time_range", value);
    window.location.href = `/search?${params.toString()}`;
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

        <div className="filter-row">
          <span className="filter-label">Filters</span>
          <div className="filter-group">
            {timeRanges.map((range) => (
              <Link
                key={range.value || "any"}
                className={`filter-chip ${timeRange === range.value ? "active" : ""}`}
                href={(() => {
                  const params = new URLSearchParams({ q: query, category });
                  if (range.value) params.set("time_range", range.value);
                  return `/search?${params.toString()}`;
                })()}
              >
                {range.label}
              </Link>
            ))}
          </div>
          <label className="filter-label filter-label-secondary" htmlFor="safe-search">SafeSearch</label>
          <select
            id="safe-search"
            className="filter-select"
            value={safeSearch}
            onChange={(event) => {
              const value = event.target.value;
              setSafeSearch(value);
              localStorage.setItem("kurokuro-safesearch", value);
            }}
          >
            <option value="0">Off</option>
            <option value="1">Moderate</option>
            <option value="2">Strict</option>
          </select>
        </div>
      </header>

      <main className="results-main">
        <div className={`results-column ${isMedia ? "results-media-column" : ""}`}>
          {error && <div className="error">{error}</div>}
          {!error && !data && (
            <LoadingSkeleton category={category} />
          )}

          {data && (
            <>
              <div className="result-toolbar">
                <div className="result-meta">
                  Results for <strong>{data.query}</strong>
                  {typeof data.number_of_results === "number" ? ` · ${data.number_of_results.toLocaleString()} found` : ""}
                </div>
                <span className="result-status"><span className="status-dot" /> Aggregated search</span>
              </div>


          <details className="power-search">
            <summary>Power search</summary>
            <div className="power-search-body">
              <div className="power-search-copy">
                Use SearXNG operators directly in the search box. Kurokuro passes them through unchanged.
              </div>
              <div className="power-search-examples">
                <code>site:github.com cybersecurity</code>
                <code>site:edu machine learning</code>
                <code>filetype:pdf networking</code>
                <code>"exact phrase"</code>
                <code>security -malware</code>
                <code>!wp quantum computing</code>
                <code>:ur پاکستان</code>
              </div>
            </div>
          </details>

              {data.suggestions && data.suggestions.length > 0 && (
                <div className="suggestions">
                  <span className="suggestions-label">Related</span>
                  {data.suggestions.slice(0, 6).map((suggestion) => (
                    <Link key={suggestion} className="suggestion" href={`/search?q=${encodeURIComponent(suggestion)}&category=${category}`}>
                      {suggestion}
                    </Link>
                  ))}
                </div>
              )}

              {data.results.length === 0 ? (
                <div className="state">No results found.</div>
              ) : category === "images" ? (
                (() => {
                  const imageResults = data.results.filter((result) => Boolean(getImageUrl(result)));
                  return imageResults.length === 0 ? (
                    <div className="state media-empty">
                      <ImageIcon size={24} />
                      <strong>No previewable images found.</strong>
                      <span>Try a broader search or open the Web tab.</span>
                    </div>
                  ) : (
                    <div className="image-grid">
                      {imageResults.map((result, index) => (
                        <ImageResult
                          key={`${result.url}-${index}`}
                          result={result}
                          query={query}
                          saved={saved === result.url}
                          copied={copied === result.url}
                          onSave={() => saveResult(result)}
                          onCopy={() => copyLink(result.url)}
                          onPreview={() => setPreviewIndex(index)}
                        />
                      ))}
                    </div>
                  );
                })()
              ) : category === "videos" ? (
                <div className="video-grid">
                  {data.results.map((result, index) => (
                    <VideoResult key={`${result.url}-${index}`} result={result} query={query} saved={saved === result.url} copied={copied === result.url} playing={playing === result.url} onPlay={() => setPlaying(result.url)} onSave={() => saveResult(result)} onCopy={() => copyLink(result.url)} />
                  ))}
                </div>              ) : category === "news" ? (
                <div className="news-list">
                  {data.results.map((result, index) => (
                    <NewsResult key={`${result.url}-${index}`} result={result} query={query} saved={saved === result.url} copied={copied === result.url} onSave={() => saveResult(result)} onCopy={() => copyLink(result.url)} />
                  ))}
                </div>
              ) : (
                data.results.map((result, index) => (
                  <WebResult key={`${result.url}-${index}`} result={result} query={query} saved={saved === result.url} copied={copied === result.url} onSave={() => saveResult(result)} onCopy={() => copyLink(result.url)} />
                ))
              )}

              <Pagination query={query} category={category} page={page} timeRange={timeRange} />
              {category === "images" && previewIndex !== null && (
                <ImagePreviewModal
                  results={data.results.filter((result) => Boolean(getImageUrl(result)))}
                  index={previewIndex}
                  onClose={() => setPreviewIndex(null)}
                  onNavigate={setPreviewIndex}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
