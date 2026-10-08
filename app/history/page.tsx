"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Entry = { id: string; query: string; createdAt: string };

const AUTO_CLEAR: Record<string, number | null> = { off: null, "7": 7, "30": 30, "90": 90 };

function readHistory(): Entry[] {
  try { return JSON.parse(localStorage.getItem("kurokuro-history") || "[]") as Entry[]; }
  catch { return []; }
}

function applyAutoClear(items: Entry[], mode: string) {
  const days = AUTO_CLEAR[mode] ?? null;
  if (!days) return items;
  const cutoff = Date.now() - days * 86400000;
  return items.filter((item) => Date.parse(item.createdAt) >= cutoff);
}

export default function HistoryPage() {
  const [items, setItems] = useState<Entry[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [autoClear, setAutoClear] = useState("off");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const storedEnabled = localStorage.getItem("kurokuro-history-enabled") !== "false";
    const storedAutoClear = localStorage.getItem("kurokuro-history-autoclear") || "off";
    const next = applyAutoClear(readHistory(), storedAutoClear);
    setEnabled(storedEnabled);
    setAutoClear(storedAutoClear);
    setItems(storedEnabled ? next : []);
    if (storedEnabled) localStorage.setItem("kurokuro-history", JSON.stringify(next));
  }, []);

  function persist(next: Entry[]) {
    setItems(next);
    localStorage.setItem("kurokuro-history", JSON.stringify(next));
  }

  function remove(id: string) { persist(items.filter((item) => item.id !== id)); }
  function clear() { persist([]); }

  function toggle(value: boolean) {
    setEnabled(value);
    localStorage.setItem("kurokuro-history-enabled", String(value));
    if (!value) {
      localStorage.removeItem("kurokuro-history");
      setItems([]);
    }
  }

  function changeAutoClear(value: string) {
    setAutoClear(value);
    localStorage.setItem("kurokuro-history-autoclear", value);
    persist(applyAutoClear(items, value));
  }

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return term ? items.filter((item) => item.query.toLowerCase().includes(term)) : items;
  }, [filter, items]);

  return (
    <main className="page">
      <div className="page-inner">
        <div className="page-nav">
          <Link href="/" className="back">← Kurokuro</Link>
          <div className="page-nav-links"><Link href="/bookmarks" className="back">Bookmarks</Link><Link href="/settings" className="back">Settings</Link></div>
        </div>
        <h1 className="page-title">Search history</h1>
        <p className="page-subtitle">Your search history lives in this browser. It is never required for searching.</p>

        <div className="panel page-panel">
          <div className="panel-row">
            <div><div className="panel-label">Search history</div><div className="panel-help">Remember searches locally so they can be found and re-run later.</div></div>
            <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
          </div>
          <div className="panel-row">
            <div><div className="panel-label">Automatic deletion</div><div className="panel-help">Older entries are removed when this page is opened.</div></div>
            <select className="select" value={autoClear} onChange={(e) => changeAutoClear(e.target.value)} disabled={!enabled}>
              <option value="off">Never</option><option value="7">After 7 days</option><option value="30">After 30 days</option><option value="90">After 90 days</option>
            </select>
          </div>
        </div>

        {enabled && items.length > 0 && (
          <div className="history-toolbar">
            <input className="text-field history-search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter history" aria-label="Filter history" />
            <button className="small-action danger" onClick={clear}>Clear all</button>
          </div>
        )}

        <div className="panel page-panel">
          {!enabled ? <div className="empty">History is disabled. New searches will not be stored.</div> :
           filtered.length === 0 ? <div className="empty">{items.length ? "No history matches that filter." : "No saved searches yet."}</div> :
           filtered.map((item) => (
            <div className="history-item" key={item.id}>
              <div className="history-main">
                <Link className="history-query" href={`/search?q=${encodeURIComponent(item.query)}`}>{item.query}</Link>
                <div className="history-date">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <button className="small-action danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
