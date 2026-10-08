"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setKurokuroLanguage, useI18n } from "@/components/I18nProvider";

const K = {
  safeSearch: "kurokuro-safesearch", language: "kurokuro-language", region: "kurokuro-region",
  category: "kurokuro-default-category", history: "kurokuro-history-enabled",
  autoClear: "kurokuro-history-autoclear", theme: "kurokuro-theme",
};

export default function SettingsPage() {
  const { t } = useI18n();
  const [history, setHistory] = useState(true);
  const [autoClear, setAutoClear] = useState("off");
  const [safeSearch, setSafeSearch] = useState("1");
  const [language, setLanguage] = useState("all");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("general");
  const [theme, setTheme] = useState("system");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHistory(localStorage.getItem(K.history) !== "false");
    setAutoClear(localStorage.getItem(K.autoClear) || "off");
    setSafeSearch(localStorage.getItem(K.safeSearch) || "1");
    setLanguage(localStorage.getItem(K.language) || "all");
    setRegion(localStorage.getItem(K.region) || "all");
    setCategory(localStorage.getItem(K.category) || "general");
    const storedTheme = localStorage.getItem(K.theme) || "system";
    setTheme(storedTheme);
    document.documentElement.dataset.theme = storedTheme;
  }, []);

  function save(key: string, value: string) {
    localStorage.setItem(key, value);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1000);
  }

  function setHistoryValue(value: boolean) {
    setHistory(value);
    save(K.history, String(value));
    if (!value) localStorage.removeItem("kurokuro-history");
  }

  function clearLocalData() {
    ["kurokuro-history", "kurokuro-bookmarks", "kurokuro-bookmark-folders"].forEach((key) => localStorage.removeItem(key));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1000);
  }

  function setThemeValue(value: string) {
    setTheme(value);
    save(K.theme, value);
    document.documentElement.dataset.theme = value;
  }

  function setLanguageValue(value: string) {
    setLanguage(value);
    setKurokuroLanguage(value);
    save(K.language, value);
  }

  return (
    <main className="page">
      <div className="page-inner">
        <div className="page-nav">
          <Link href="/" className="back">← {t("back")}</Link>
          <div className="page-nav-links">
            <Link href="/history" className="back">{t("history")}</Link>
            <Link href="/bookmarks" className="back">{t("bookmarks")}</Link>
          </div>
        </div>

        <h1 className="page-title">{t("settings")}</h1>
        <p className="page-subtitle">{t("localPreferences")}</p>
        {saved && <div className="save-indicator">{t("savedLocally")}</div>}

        <section className="settings-section">
          <h2 className="settings-heading">{t("searchSection")}</h2>
          <div className="panel">
            <div className="panel-row">
              <div><div className="panel-label">{t("safesearch")}</div><div className="panel-help">{t("safeSearchHelp")}</div></div>
              <select className="select" value={safeSearch} onChange={(e) => { setSafeSearch(e.target.value); save(K.safeSearch, e.target.value); }}>
                <option value="1">{t("moderate")}</option><option value="2">{t("strict")}</option><option value="0">{t("off")}</option>
              </select>
            </div>

            <div className="panel-row">
              <div><div className="panel-label">{t("searchLanguage")}</div><div className="panel-help">{t("searchLanguageHelp")}</div></div>
              <select className="select language-select" value={language} onChange={(e) => setLanguageValue(e.target.value)}>
                <option value="all">{t("languageAll")}</option>
                <optgroup label={t("southAsia")}><option value="ur">Urdu</option><option value="hi">Hindi</option><option value="bn">Bengali</option><option value="pa">Punjabi</option><option value="gu">Gujarati</option><option value="mr">Marathi</option><option value="ta">Tamil</option><option value="te">Telugu</option></optgroup>
                <optgroup label={t("europe")}><option value="en">English</option><option value="en-US">English — US</option><option value="en-GB">English — UK</option><option value="de">German</option><option value="fr">French</option><option value="es">Spanish</option><option value="it">Italian</option><option value="pt">Portuguese</option><option value="nl">Dutch</option><option value="pl">Polish</option><option value="ru">Russian</option><option value="uk">Ukrainian</option><option value="tr">Turkish</option></optgroup>
                <optgroup label={t("eastAsia")}><option value="zh">Chinese</option><option value="zh-CN">Chinese — Simplified</option><option value="zh-TW">Chinese — Traditional</option><option value="ja">Japanese</option><option value="ko">Korean</option></optgroup>
                <optgroup label={t("middleEast")}><option value="ar">Arabic</option><option value="fa">Persian</option><option value="he">Hebrew</option></optgroup>
                <optgroup label={t("other")}><option value="vi">Vietnamese</option><option value="id">Indonesian</option><option value="ms">Malay</option><option value="th">Thai</option><option value="sv">Swedish</option><option value="da">Danish</option><option value="no">Norwegian</option><option value="fi">Finnish</option><option value="cs">Czech</option><option value="ro">Romanian</option></optgroup>
              </select>
            </div>

            <div className="panel-row">
              <div><div className="panel-label">{t("region")}</div><div className="panel-help">{t("regionHelp")}</div></div>
              <select className="select" value={region} onChange={(e) => { setRegion(e.target.value); save(K.region, e.target.value); }}>
                <option value="all">{t("global")}</option><option value="PK">Pakistan</option><option value="US">United States</option><option value="GB">United Kingdom</option>
              </select>
            </div>

            <div className="panel-row">
              <div><div className="panel-label">{t("defaultCategory")}</div><div className="panel-help">{t("defaultCategoryHelp")}</div></div>
              <select className="select" value={category} onChange={(e) => { setCategory(e.target.value); save(K.category, e.target.value); }}>
                <option value="general">{t("web")}</option><option value="images">{t("images")}</option><option value="videos">{t("videos")}</option><option value="news">{t("news")}</option><option value="map">{t("maps")}</option><option value="files">{t("files")}</option><option value="science">{t("science")}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-heading">{t("privacy")}</h2>
          <div className="panel">
            <div className="panel-row">
              <div><div className="panel-label">{t("historyLabel")}</div><div className="panel-help">{t("historyHelp")}</div></div>
              <input type="checkbox" checked={history} onChange={(e) => setHistoryValue(e.target.checked)} />
            </div>
            <div className="panel-row">
              <div><div className="panel-label">{t("automaticDeletion")}</div><div className="panel-help">{t("olderRemoved")}</div></div>
              <select className="select" value={autoClear} onChange={(e) => { setAutoClear(e.target.value); save(K.autoClear, e.target.value); }} disabled={!history}>
                <option value="off">{t("never")}</option><option value="7">{t("after7")}</option><option value="30">{t("after30")}</option><option value="90">{t("after90")}</option>
              </select>
            </div>
            <div className="panel-row">
              <div><div className="panel-label">{t("clearLocalData")}</div><div className="panel-help">{t("clearLocalDataHelp")}</div></div>
              <button className="small-action danger" onClick={clearLocalData}>{t("clear")}</button>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-heading">{t("appearance")}</h2>
          <div className="panel">
            <div className="panel-row">
              <div><div className="panel-label">{t("theme")}</div><div className="panel-help">{t("themeHelp")}</div></div>
              <select className="select" value={theme} onChange={(e) => setThemeValue(e.target.value)}>
                <option value="system">{t("system")}</option><option value="light">{t("light")}</option><option value="dark">{t("dark")}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-heading">{t("aboutPrivacy")}</h2>
          <div className="privacy-panel"><strong>{t("privacyHeadline")}</strong><p>{t("privacyBody")}</p></div>
        </section>
      </div>
    </main>
  );
}
