"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang } from "@/lib/translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)["es"];
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  // Resolve initial language: ?lang= query param wins, then localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("lang");
    const stored = localStorage.getItem("n3-lang");
    const initial = fromQuery === "en" || fromQuery === "es" ? fromQuery : stored;
    if (initial === "en" || initial === "es") {
      setLangState(initial);
      document.documentElement.lang = initial;
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("n3-lang", l);
    document.documentElement.lang = l;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
