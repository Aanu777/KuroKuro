"use client";

import Link from "next/link";
import { ArrowUpRight, Command, EyeOff, Layers3, Sparkles } from "lucide-react";
import SearchBox from "@/components/SearchBox";
import { useI18n } from "@/components/I18nProvider";

const highlights = [
  {
    icon: EyeOff,
    title: "Search with more privacy",
    description: "A calmer search experience, without building your profile around every query.",
  },
  {
    icon: Layers3,
    title: "Explore beyond one source",
    description: "Web pages, images, videos, news, files and research in one place.",
  },
  {
    icon: Sparkles,
    title: "Stay in your flow",
    description: "Helpful suggestions, keyboard shortcuts and a clean interface that gets out of the way.",
  },
];

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
          <Link href="/settings" className="home-settings-link">
            {t("settings")} <ArrowUpRight size={14} />
          </Link>
        </nav>
      </header>

      <main className="home-main">
        <div className="home-inner">
          <div className="home-eyebrow">
            <span className="home-eyebrow-dot" />
            PRIVATE BY DESIGN <span className="home-eyebrow-separator">/</span> OPEN WEB
          </div>

          <div className="home-wordmark-wrap">
            <div className="wordmark">KUROKURO<span className="wordmark-period">.</span></div>
            <div className="home-wordmark-caption">YOUR WINDOW TO THE WEB</div>
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

          <div className="home-scroll-cue" aria-hidden="true">
            <span />
            BUILT FOR CURIOSITY
          </div>
        </div>
      </main>

      <section className="home-highlights" aria-label="Kurokuro features">
        {highlights.map(({ icon: Icon, title, description }, index) => (
          <article className="home-highlight" key={title}>
            <div className="home-highlight-top">
              <span className="home-highlight-icon"><Icon size={17} strokeWidth={1.7} /></span>
              <span className="home-highlight-index">0{index + 1}</span>
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <footer className="home-footer home-footer-new">
        <span>© {new Date().getFullYear()} KUROKURO</span>
        <span className="home-footer-center">LESS NOISE. MORE DISCOVERY.</span>
        <Link href="/settings">PRIVACY & SETTINGS <ArrowUpRight size={12} /></Link>
      </footer>
    </div>
  );
}
