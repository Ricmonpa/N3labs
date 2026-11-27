"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { glossary } from "@/lib/glossary";
import { waLink } from "@/lib/geoServices";

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

      <div className="mt-10 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/[0.07] p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-white font-semibold">{g.propose.title}</p>
        <a
          href={waLink(g.propose.msg)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#03230f] hover:bg-[#1ebe5a] transition-colors"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {g.propose.btn}
        </a>
      </div>
    </section>
  );
}
