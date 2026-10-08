"use client";

import { Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { SearchCategory } from "@/lib/search";

const categories: Array<{ label: string; value: SearchCategory }> = [
  { label: "Web", value: "general" },
  { label: "Images", value: "images" },
  { label: "Videos", value: "videos" },
  { label: "News", value: "news" },
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
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);

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
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    window.location.href = `/search?q=${encodeURIComponent(clean)}&category=${category}`;
  }

  return (
    <>
      <form className={`search-form ${compact ? "header-search" : ""}`} onSubmit={submit}>
        <input
          id="kurokuro-search"
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the web"
          aria-label="Search the web"
          autoComplete="off"
        />
        <button className="search-submit" aria-label="Search" type="submit">
          <Search size={compact ? 15 : 19} strokeWidth={1.8} />
        </button>
      </form>
      {!compact && (
        <div className="tabs" aria-label="Search categories">
          {categories.map((item) => (
            <button
              className={`tab ${category === item.value ? "active" : ""}`}
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
