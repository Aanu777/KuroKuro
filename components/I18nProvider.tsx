"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getDictionary, LOCALE_KEY, normalizeLocale, type Locale } from "@/lib/i18n";

type I18nContextValue = { locale: Locale; t: (key: string) => string };

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const apply = () => {
      const next = normalizeLocale(localStorage.getItem(LOCALE_KEY));
      setLocale(next);
      document.documentElement.lang = next;
      document.documentElement.dir = ["ur", "ar", "fa", "he"].includes(next) ? "rtl" : "ltr";
    };
    apply();
    const onChange = () => apply();
    window.addEventListener("kurokuro-language-change", onChange);
    return () => window.removeEventListener("kurokuro-language-change", onChange);
  }, []);

  const value = useMemo(() => {
    const dictionary = getDictionary(locale);
    return { locale, t: (key: string) => dictionary[key] || getDictionary("en")[key] || key };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function setKurokuroLanguage(value: string) {
  localStorage.setItem(LOCALE_KEY, value);
  window.dispatchEvent(new Event("kurokuro-language-change"));
}
