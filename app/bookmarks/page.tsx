"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = { id: string; title: string; url: string; query: string; createdAt: string };

export default function BookmarksPage() {
  const [items, setItems] = useState<Entry[]>([]);
  useEffect(() => setItems(JSON.parse(localStorage.getItem("kurokuro-bookmarks") || "[]")), []);

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    localStorage.setItem("kurokuro-bookmarks", JSON.stringify(next));
  }

  return (
    <main className="page">
      <div className="page-inner">
        <div className="page-nav"><Link href="/" className="back">← Kurokuro</Link><Link href="/settings" className="back">Settings</Link></div>
        <h1 className="page-title">Bookmarks</h1>
        <p className="page-subtitle">Saved locally in this browser.</p>
        <div className="panel" style={{ marginTop: 28 }}>
          {items.length === 0 ? <div className="empty">Nothing saved yet. Use Save on a search result.</div> : items.map((item) => (
            <div className="history-item" key={item.id}>
              <div><a className="history-query" href={item.url} target="_blank" rel="noreferrer">{item.title}</a><div className="history-date">{item.url} · found via “{item.query}”</div></div>
              <button className="small-action danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
