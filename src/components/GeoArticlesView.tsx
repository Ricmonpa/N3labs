"use client";

import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { geoArticles } from "@/lib/geoServices";

export default function GeoArticlesView() {
  const { lang } = useLanguage();
  const c = geoArticles[lang];
  // Primero los artículos en el idioma de quien lee.
  const items = [...geoArticles.items].sort((a, b) => Number(b.lang === lang) - Number(a.lang === lang));

  return (
    <section className="max-w-3xl mx-auto px-6 pt-32 pb-20">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-red-400 mb-3">GEO</p>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{c.title}</h1>
      <p className="text-zinc-400 mb-10">{c.lead}</p>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.url}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 hover:border-red-500/50 hover:bg-white/[0.05] transition-colors"
            >
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
                {c.inLang[a.lang]} · {a.author}
              </p>
              <h2 className="text-lg md:text-xl font-semibold text-white leading-snug">{a.title}</h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{a.summary[lang]}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-red-400">
                {c.read}
                <ArrowUpRight size={14} aria-hidden="true" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
