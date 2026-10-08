import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import { useI18n } from "@/components/I18nProvider";
import { useEffect } from "react";

export default function Home() {
  return (
    <div className="page-shell">
      <main className="home-main">
        <div className="home-inner">
          <div className="wordmark">KUROKURO</div>
          <p className="tagline">{t("tagline")}</p>
          <SearchBox />
          <p className="privacy-note">{t("privacyNote")}</p>
        </div>
      </main>
      <footer className="home-footer">
        <Link href="/history">{t("history")}</Link>
        <Link href="/bookmarks">{t("bookmarks")}</Link>
        <Link href="/settings">{t("settings")}</Link>
      </footer>
    </div>
  );
}
