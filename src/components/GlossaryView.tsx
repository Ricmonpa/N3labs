"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { glossary } from "@/lib/glossary";

export default function GlossaryView() {
  const { lang } = useLanguage();
  const g = glossary[lang];
  const [q, setQ] = useState("");
  const v = q.trim().toLowerCase();
  const shown = g.terms.filter((t) => !v || `${t.term} ${t.sub} ${t.def} ${t.n3 ?? ""}`.toLowerCase().includes(v));

  return (
    <section className="max-w-3xl mx-auto px-6 pt-32 pb-20">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-red-400 mb-3">GEO</p>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{g.title}</h1>
      <p className="text-zinc-400 mb-8">{g.intro}</p>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={g.placeholder}
        aria-label={g.placeholder}
        autoComplete="off"
        className="w-full mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/70"
      />

      <dl className="space-y-3">
        {shown.map((t) => (
          <details
            key={t.term}
            open={!!v}
            className="group rounded-xl border border-white/10 bg-white/[0.025] open:bg-white/[0.04]"
          >
            <summary className="cursor-pointer list-none px-4 py-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
              <dt className="text-base font-semibold text-white">{t.term}</dt>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">{t.sub}</span>
              <span className="ml-auto text-zinc-500 group-open:hidden" aria-hidden="true">+</span>
              <span className="ml-auto text-zinc-500 hidden group-open:inline" aria-hidden="true">–</span>
            </summary>
            <dd className="px-4 pb-4 text-sm leading-relaxed text-zinc-300">
              {t.def}
              {t.n3 && (
                <span className="mt-3 block rounded-r-lg border-l-2 border-red-500 bg-red-500/[0.07] px-3 py-2 text-[13px] text-zinc-400">
                  <strong className="text-red-400">{g.n3}:</strong> {t.n3}
                </span>
              )}
            </dd>
          </details>
        ))}
      </dl>
      {shown.length === 0 && <p className="text-sm text-zinc-500 mt-4">{g.none}</p>}
    </section>
  );
}
