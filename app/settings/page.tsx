"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const K = {
  safeSearch: "kurokuro-safesearch", language: "kurokuro-language", region: "kurokuro-region",
  category: "kurokuro-default-category", history: "kurokuro-history-enabled",
  autoClear: "kurokuro-history-autoclear", theme: "kurokuro-theme",
};

export default function SettingsPage() {
  const [history,setHistory]=useState(true), [autoClear,setAutoClear]=useState("off");
  const [safeSearch,setSafeSearch]=useState("1"), [language,setLanguage]=useState("all");
  const [region,setRegion]=useState("all"), [category,setCategory]=useState("general"), [theme,setTheme]=useState("system");
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    setHistory(localStorage.getItem(K.history)!=="false");
    setAutoClear(localStorage.getItem(K.autoClear)||"off");
    setSafeSearch(localStorage.getItem(K.safeSearch)||"1");
    setLanguage(localStorage.getItem(K.language)||"all");
    setRegion(localStorage.getItem(K.region)||"all");
    setCategory(localStorage.getItem(K.category)||"general");
    setTheme(localStorage.getItem(K.theme)||"system");
    document.documentElement.dataset.theme=localStorage.getItem(K.theme)||"system";
  },[]);

  function save(key:string,value:string){ localStorage.setItem(key,value); setSaved(true); window.setTimeout(()=>setSaved(false),1000); }
  function setHistoryValue(value:boolean){ setHistory(value); save(K.history,String(value)); if(!value)localStorage.removeItem("kurokuro-history"); }
  function clearLocalData(){ ["kurokuro-history","kurokuro-bookmarks","kurokuro-bookmark-folders"].forEach(k=>localStorage.removeItem(k)); setSaved(true); window.setTimeout(()=>setSaved(false),1000); }
  function setThemeValue(value:string){ setTheme(value); save(K.theme,value); document.documentElement.dataset.theme=value; }

  return (
    <main className="page"><div className="page-inner">
      <div className="page-nav"><Link href="/" className="back">← Kurokuro</Link><div className="page-nav-links"><Link href="/history" className="back">History</Link><Link href="/bookmarks" className="back">Bookmarks</Link></div></div>
      <h1 className="page-title">Settings</h1><p className="page-subtitle">Local preferences. No account required.</p>
      {saved && <div className="save-indicator">Saved locally</div>}

      <section className="settings-section"><h2 className="settings-heading">Search</h2><div className="panel">
        <div className="panel-row"><div><div className="panel-label">SafeSearch</div><div className="panel-help">Protection level sent to the search backend.</div></div><select className="select" value={safeSearch} onChange={e=>{setSafeSearch(e.target.value);save(K.safeSearch,e.target.value)}}><option value="1">Moderate</option><option value="2">Strict</option><option value="0">Off</option></select></div>
        <div className="panel-row"><div><div className="panel-label">Search language</div><div className="panel-help">Filters the search toward the selected language. Results are not automatically translated.</div></div><select className="select language-select" value={language} onChange={e=>{setLanguage(e.target.value);save(K.language,e.target.value)}}>
  <option value="all">All languages</option>
  <optgroup label="South Asia"><option value="ur">Urdu</option><option value="hi">Hindi</option><option value="bn">Bengali</option><option value="pa">Punjabi</option><option value="gu">Gujarati</option><option value="mr">Marathi</option><option value="ta">Tamil</option><option value="te">Telugu</option></optgroup>
  <optgroup label="Europe"><option value="en">English</option><option value="en-US">English — US</option><option value="en-GB">English — UK</option><option value="de">German</option><option value="fr">French</option><option value="es">Spanish</option><option value="it">Italian</option><option value="pt">Portuguese</option><option value="nl">Dutch</option><option value="pl">Polish</option><option value="ru">Russian</option><option value="uk">Ukrainian</option><option value="tr">Turkish</option></optgroup>
  <optgroup label="East Asia"><option value="zh">Chinese</option><option value="zh-CN">Chinese — Simplified</option><option value="zh-TW">Chinese — Traditional</option><option value="ja">Japanese</option><option value="ko">Korean</option></optgroup>
  <optgroup label="Middle East"><option value="ar">Arabic</option><option value="fa">Persian</option><option value="he">Hebrew</option></optgroup>
  <optgroup label="Other"><option value="vi">Vietnamese</option><option value="id">Indonesian</option><option value="ms">Malay</option><option value="th">Thai</option><option value="sv">Swedish</option><option value="da">Danish</option><option value="no">Norwegian</option><option value="fi">Finnish</option><option value="cs">Czech</option><option value="ro">Romanian</option></optgroup>
</select></div>
        <div className="panel-row"><div><div className="panel-label">Region</div><div className="panel-help">Preference passed to the Kurokuro search layer; provider support varies.</div></div><select className="select" value={region} onChange={e=>{setRegion(e.target.value);save(K.region,e.target.value)}}><option value="all">Global</option><option value="PK">Pakistan</option><option value="US">United States</option><option value="GB">United Kingdom</option></select></div>
        <div className="panel-row"><div><div className="panel-label">Default category</div><div className="panel-help">Category used for new searches.</div></div><select className="select" value={category} onChange={e=>{setCategory(e.target.value);save(K.category,e.target.value)}}><option value="general">Web</option><option value="images">Images</option><option value="videos">Videos</option><option value="news">News</option><option value="map">Maps</option><option value="files">Files</option><option value="science">Science</option></select></div>
      </div></section>

      <section className="settings-section"><h2 className="settings-heading">Privacy</h2><div className="panel">
        <div className="panel-row"><div><div className="panel-label">Search history</div><div className="panel-help">Keep searches only in this browser.</div></div><input type="checkbox" checked={history} onChange={e=>setHistoryValue(e.target.checked)}/></div>
        <div className="panel-row"><div><div className="panel-label">Automatic history deletion</div><div className="panel-help">Remove old local history when it is next opened.</div></div><select className="select" value={autoClear} onChange={e=>{setAutoClear(e.target.value);save(K.autoClear,e.target.value)}} disabled={!history}><option value="off">Never</option><option value="7">After 7 days</option><option value="30">After 30 days</option><option value="90">After 90 days</option></select></div>
        <div className="panel-row"><div><div className="panel-label">Clear local data</div><div className="panel-help">Delete history, bookmarks and bookmark folders from this browser.</div></div><button className="small-action danger" onClick={clearLocalData}>Clear</button></div>
      </div></section>

      <section className="settings-section"><h2 className="settings-heading">Appearance</h2><div className="panel"><div className="panel-row"><div><div className="panel-label">Theme</div><div className="panel-help">Use the system preference or force light/dark mode.</div></div><select className="select" value={theme} onChange={e=>setThemeValue(e.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div></div></section>

      <section className="settings-section"><h2 className="settings-heading">About privacy</h2><div className="privacy-panel"><strong>Kurokuro controls your instance, not the entire internet.</strong><p>History and bookmarks stay local unless synchronization is deliberately added. Search requests still travel through SearXNG to the external providers your instance uses, so those providers may see information required to answer a request.</p></div></section>
    </div></main>
  );
}
