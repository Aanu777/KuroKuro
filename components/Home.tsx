"use client";

import Link from "next/link";
import { ArrowUpRight, Command, EyeOff } from "lucide-react";
import SearchBox from "@/components/SearchBox";
import InstallAppButton from "@/components/InstallAppButton";
import { useI18n } from "@/components/I18nProvider";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="page-shell home-shell">
      <div className="home-ambient home-ambient-one" aria-hidden="true" />
      <div className="home-ambient home-ambient-two" aria-hidden="true" />

      <header className="home-topbar">
        <Link href="/" className="home-mini-brand" aria-label="Kurokuro home">
          <span className="home-brand-mark">K</span>
          <span>KUROKURO</span>
        </Link>
        <nav className="home-top-links" aria-label={t("utilities")}>
          <Link href="/history">{t("history")}</Link>
          <Link href="/bookmarks">{t("bookmarks")}</Link>
          <InstallAppButton />
          <Link href="/settings" className="home-settings-link">
            {t("settings")} <ArrowUpRight size={14} />
          </Link>
        </nav>
      </header>

      <main className="home-main">
        <div className="home-inner">
          <div className="home-wordmark-wrap">
            <div className="wordmark">KUROKURO<span className="wordmark-period">.</span></div>
          </div>

          <p className="tagline">{t("tagline")}</p>

          <div className="home-search-panel">
            <SearchBox />
            <div className="home-search-foot">
              <span><Command size={12} /> <kbd>/</kbd> to focus search</span>
              <span className="home-search-foot-note">One search. A wider web.</span>
            </div>
          </div>

          <p className="privacy-note">
            <EyeOff size={13} strokeWidth={1.8} />
            {t("privacyNote")}
          </p>
        </div>
      </main>

      <footer className="home-footer home-footer-new">
        <span>© {new Date().getFullYear()} KUROKURO</span>
        <Link href="/settings">PRIVACY & SETTINGS <ArrowUpRight size={12} /></Link>
      </footer>
    </div>
  );
}
