"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Entry={id:string;title:string;url:string;query:string;createdAt:string;notes?:string;folder?:string;tags?:string[]};
const FOLDER_KEY="kurokuro-bookmark-folders";

export default function BookmarksPage(){
  const { t } = useI18n();
  const [items,setItems]=useState<Entry[]>([]),[folders,setFolders]=useState<string[]>([]),[filter,setFilter]=useState(""),[folder,setFolder]=useState("all"),[editing,setEditing]=useState<string|null>(null),[draft,setDraft]=useState<Entry|null>(null);
  useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("kurokuro-bookmarks")||"[]"))}catch{} try{setFolders(JSON.parse(localStorage.getItem(FOLDER_KEY)||"[]"))}catch{}},[]);
  function persist(next:Entry[]){setItems(next);localStorage.setItem("kurokuro-bookmarks",JSON.stringify(next))}
  function remove(id:string){persist(items.filter(i=>i.id!==id));if(editing===id){setEditing(null);setDraft(null)}}
  function saveEdit(){if(!draft)return;persist(items.map(i=>i.id===draft.id?{...draft,tags:(draft.tags||[]).map(t=>t.trim()).filter(Boolean)}:i));setEditing(null);setDraft(null)}
  function createFolder(){const name=window.prompt(t("folderName"))?.trim();if(!name||folders.includes(name))return;const next=[...folders,name].sort();setFolders(next);localStorage.setItem(FOLDER_KEY,JSON.stringify(next))}
  const filtered=useMemo(()=>{const term=filter.trim().toLowerCase();return items.filter(i=>(folder==="all"||(i.folder||"")===folder)&&(!term||[i.title,i.url,i.query,i.notes||"",...(i.tags||[])].join(" ").toLowerCase().includes(term)))},[items,filter,folder]);

  return <main className="page"><div className="page-inner">
    <div className="page-nav"><Link href="/" className="back">← {t("back")}</Link><div className="page-nav-links"><Link href="/history" className="back">{t("history")}</Link><Link href="/settings" className="back">{t("settings")}</Link></div></div>
    <h1 className="page-title">{t("bookmarks")}</h1><p className="page-subtitle">{t("bookmarksSubtitle")}</p>
    <div className="bookmark-toolbar"><input className="text-field history-search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t("searchBookmarks")} aria-label={t("searchBookmarks")}/><select className="select" value={folder} onChange={e=>setFolder(e.target.value)}><option value="all">{t("allFolders")}</option>{folders.map(f=><option key={f} value={f}>{f}</option>)}</select><button className="small-action" onClick={createFolder}>{t("newFolder")}</button></div>
    <div className="panel page-panel">{filtered.length===0?<div className="empty">{items.length?t("noBookmarksMatch"):t("nothingSaved")}</div>:filtered.map(item=><div className="bookmark-item" key={item.id}>
      <div className="bookmark-content"><a className="history-query" href={item.url} target="_blank" rel="noreferrer">{item.title||item.url}</a><div className="bookmark-url">{item.url}</div><div className="history-date">Saved {new Date(item.createdAt).toLocaleString()}{item.query?` · ${t("foundVia")} “${item.query}”`:""}</div>
      {(item.folder||item.tags?.length||item.notes)&&<div className="bookmark-meta">{item.folder&&<span className="bookmark-chip">{item.folder}</span>}{(item.tags||[]).map(t=><span className="bookmark-chip" key={t}>{t}</span>)}{item.notes&&<span className="bookmark-note">{item.notes}</span>}</div>}
      {editing===item.id&&draft&&<div className="bookmark-editor"><input className="text-field" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder={t("title")}/><select className="select" value={draft.folder||""} onChange={e=>setDraft({...draft,folder:e.target.value})}><option value="">{t("noFolder")}</option>{folders.map(f=><option key={f} value={f}>{f}</option>)}</select><input className="text-field" value={(draft.tags||[]).join(", ")} onChange={e=>setDraft({...draft,tags:e.target.value.split(",")})} placeholder={t("tags")}/><textarea className="text-area" value={draft.notes||""} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder={t("notes")} rows={3}/><div className="editor-actions"><button className="small-action" onClick={saveEdit}>{t("saveChanges")}</button><button className="small-action" onClick={()=>{setEditing(null);setDraft(null)}}>{t("cancel")}</button></div></div>}</div>
      <div className="bookmark-actions"><button className="small-action" onClick={()=>{setEditing(item.id);setDraft({...item})}}>{t("edit")}</button><button className="small-action danger" onClick={()=>remove(item.id)}>{t("delete")}</button></div>
    </div>)}</div>
  </div></main>
}
