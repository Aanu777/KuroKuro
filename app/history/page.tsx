"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

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
  const { t } = useI18n();
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
          <Link href="/" className="back">← {t("back")}</Link>
          <div className="page-nav-links"><Link href="/bookmarks" className="back">{t("bookmarks")}</Link><Link href="/settings" className="back">{t("settings")}</Link></div>
        </div>
        <h1 className="page-title">{t("searchHistory")}</h1>
        <p className="page-subtitle">{t("searchHistoryLives")}</p>

        <div className="panel page-panel">
          <div className="panel-row">
            <div><div className="panel-label">{t("searchHistory")}</div><div className="panel-help">{t("rememberSearches")}</div></div>
            <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
          </div>
          <div className="panel-row">
            <div><div className="panel-label">{t("automaticDeletion")}</div><div className="panel-help">{t("olderRemoved")}</div></div>
            <select className="select" value={autoClear} onChange={(e) => changeAutoClear(e.target.value)} disabled={!enabled}>
              <option value="off">{t("never")}</option><option value="7">{t("after7")}</option><option value="30">{t("after30")}</option><option value="90">{t("after90")}</option>
            </select>
          </div>
        </div>

        {enabled && items.length > 0 && (
          <div className="history-toolbar">
            <input className="text-field history-search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("filterHistory")} aria-label={t("filterHistory")} />
            <button className="small-action danger" onClick={clear}>{t("clearAll")}</button>
          </div>
        )}

        <div className="panel page-panel">
          {!enabled ? <div className="empty">{t("historyDisabled")}</div> :
           filtered.length === 0 ? <div className="empty">{items.length ? t("noHistoryMatch") : t("noSavedSearches")}</div> :
           filtered.map((item) => (
            <div className="history-item" key={item.id}>
              <div className="history-main">
                <Link className="history-query" href={`/search?q=${encodeURIComponent(item.query)}`}>{item.query}</Link>
                <div className="history-date">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <button className="small-action danger" onClick={() => remove(item.id)}>{t("delete")}</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
