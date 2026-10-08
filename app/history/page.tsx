"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = { id: string; query: string; createdAt: string };

export default function HistoryPage() {
  const [items, setItems] = useState<Entry[]>([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem("kurokuro-history") || "[]"));
    setEnabled(localStorage.getItem("kurokuro-history-enabled") !== "false");
  }, []);

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    localStorage.setItem("kurokuro-history", JSON.stringify(next));
  }

  function clear() {
    setItems([]);
    localStorage.removeItem("kurokuro-history");
  }

  function toggle(value: boolean) {
    setEnabled(value);
    localStorage.setItem("kurokuro-history-enabled", String(value));
    if (!value) clear();
  }

  return (
    <main className="page">
      <div className="page-inner">
        <div className="page-nav"><Link href="/" className="back">← Kurokuro</Link><Link href="/settings" className="back">Settings</Link></div>
        <h1 className="page-title">Search history</h1>
        <p className="page-subtitle">Stored locally in this browser. No account required.</p>
        <div className="panel" style={{ marginTop: 28 }}>
          <div className="panel-row">
            <div><div className="panel-label">Search history</div><div className="panel-help">Keep searches on this device so you can find and re-run them later.</div></div>
            <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
          </div>
          {items.length === 0 ? <div className="empty">No saved searches.</div> : items.map((item) => (
            <div className="history-item" key={item.id}>
              <div><Link className="history-query" href={`/search?q=${encodeURIComponent(item.query)}`}>{item.query}</Link><div className="history-date">{new Date(item.createdAt).toLocaleString()}</div></div>
              <button className="small-action danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          ))}
        </div>
        {items.length > 0 && <button className="small-action danger" style={{ marginTop: 12 }} onClick={clear}>Clear all history</button>}
      </div>
    </main>
  );
}
