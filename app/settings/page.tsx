"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [history, setHistory] = useState(true);
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    setHistory(localStorage.getItem("kurokuro-history-enabled") !== "false");
    setTheme(localStorage.getItem("kurokuro-theme") || "system");
  }, []);

  function setHistoryValue(value: boolean) {
    setHistory(value);
    localStorage.setItem("kurokuro-history-enabled", String(value));
    if (!value) localStorage.removeItem("kurokuro-history");
  }

  function setThemeValue(value: string) {
    setTheme(value);
    localStorage.setItem("kurokuro-theme", value);
  }

  return (
    <main className="page">
      <div className="page-inner">
        <div className="page-nav"><Link href="/" className="back">← Kurokuro</Link><Link href="/history" className="back">History</Link></div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Simple controls. No account required.</p>

        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 14, margin: "0 0 10px" }}>Privacy</h2>
          <div className="panel">
            <div className="panel-row"><div><div className="panel-label">Search history</div><div className="panel-help">Keep searches locally in this browser.</div></div><input type="checkbox" checked={history} onChange={(e) => setHistoryValue(e.target.checked)} /></div>
            <div className="panel-row"><div><div className="panel-label">Clear local data</div><div className="panel-help">Delete Kurokuro history and bookmarks from this browser.</div></div><button className="small-action danger" onClick={() => { localStorage.removeItem("kurokuro-history"); localStorage.removeItem("kurokuro-bookmarks"); }}>Clear</button></div>
          </div>
        </section>

        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 14, margin: "0 0 10px" }}>Appearance</h2>
          <div className="panel">
            <div className="panel-row"><div><div className="panel-label">Theme</div><div className="panel-help">Theme persistence is wired now; visual variants come next.</div></div><select className="select" value={theme} onChange={(e) => setThemeValue(e.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
          </div>
        </section>
      </div>
    </main>
  );
}
