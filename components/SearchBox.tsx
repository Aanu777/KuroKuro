"use client";

import { Search, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { SearchCategory } from "@/lib/search";
import { useI18n } from "@/components/I18nProvider";

const categories: Array<{ key: string; value: SearchCategory }> = [
  { key: "web", value: "general" }, { key: "images", value: "images" }, { key: "videos", value: "videos" },
  { key: "news", value: "news" }, { key: "maps", value: "map" }, { key: "files", value: "files" }, { key: "science", value: "science" },
];

export default function SearchBox({
  initialQuery = "",
  initialCategory = "general",
  compact = false,
}: {
  initialQuery?: string;
  initialCategory?: SearchCategory;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preferred = localStorage.getItem("kurokuro-default-category") as SearchCategory | null;
    if (!initialQuery && preferred && categories.some((item) => item.value === preferred)) setCategory(preferred);

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.key === "/" && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        document.getElementById("kurokuro-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [initialQuery]);

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setSelected(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json();
        const next = Array.isArray(payload.suggestions)
          ? payload.suggestions.filter((item: unknown): item is string => typeof item === "string").slice(0, 8)
          : [];
        setSuggestions(next);
        setSelected(-1);
        setOpen(next.length > 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
        setOpen(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = (selected >= 0 ? suggestions[selected] : query).trim();
    if (!clean) return;
    setOpen(false);
    window.location.href = `/search?q=${encodeURIComponent(clean)}&category=${category}`;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setSelected(-1);
    } else if (event.key === "Enter" && selected >= 0) {
      event.preventDefault();
      setQuery(suggestions[selected]);
      setOpen(false);
      window.location.href = `/search?q=${encodeURIComponent(suggestions[selected])}&category=${category}`;
    }
  }

  return (
    <>
      <div className="search-box-wrap">
        <form className={`search-form ${compact ? "header-search" : ""}`} onSubmit={submit}>
          <input
            ref={inputRef}
            id="kurokuro-search"
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder={t("searchWeb")}
            aria-label={t("searchWeb")}
            aria-autocomplete="list"
            aria-expanded={open}
            autoComplete="off"
          />
          <button className="search-submit" aria-label={t("search")} type="submit">
            <Search size={compact ? 15 : 19} strokeWidth={1.8} />
          </button>
        </form>

        {open && (
          <div className="suggestion-menu" role="listbox" aria-label={t("searchSuggestions")}>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                className={`suggestion-item ${selected === index ? "active" : ""}`}
                type="button"
                role="option"
                aria-selected={selected === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(suggestion);
                  setOpen(false);
                  window.location.href = `/search?q=${encodeURIComponent(suggestion)}&category=${category}`;
                }}
              >
                <Search size={14} />
                <span>{suggestion}</span>
                {selected === index && <CornerDownLeft size={13} />}
              </button>
            ))}
            <div className="suggestion-help">
              <span><ArrowUp size={11} /><ArrowDown size={11} /> {t("navigate")}</span>
              <span><CornerDownLeft size={11} /> {t("search")}</span>
              <span>Esc {t("close")}</span>
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <div className="tabs" aria-label={t("searchCategories")}>
          {categories.map((item) => (
            <button
              className={`tab ${category === item.value ? "active" : ""}`}
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
