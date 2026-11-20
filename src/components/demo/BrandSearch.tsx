"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Search } from "lucide-react";

export type SearchBrand = { name: string; terms: string[]; industry: string; industryLabel: string; href: string; visibility: string };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();

/** Buscador del demo: encuentra la marca entre las ya medidas, sin llamar a ninguna IA. */
export default function BrandSearch({ brands }: { brands: SearchBrand[] }) {
  const [q, setQ] = useState("");
  const query = norm(q);
  const results = query ? brands.filter((b) => b.terms.some((t) => t.includes(query) || (query.length >= 4 && query.includes(t)))) : [];
  const examples = ["Toyota", "BBVA", "Nu", "Liverpool", "Telcel", "GNP"];

  return (
    <section className="mt-8 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 to-transparent p-5 sm:p-7">
      <h2 className="text-xl sm:text-2xl font-black text-white">Prueba con tu marca</h2>
      <p className="mt-1.5 text-sm text-zinc-400">Escribe el nombre o el sitio de una marca y ve cómo la recomiendan las IAs frente a su competencia.</p>
      <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 focus-within:border-red-500/60">
        <Search size={18} className="text-zinc-500 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej. BBVA o bbva.mx"
          aria-label="Nombre o sitio de la marca"
          className="w-full bg-transparent text-base text-white placeholder:text-zinc-600 outline-none"
          autoComplete="off"
        />
      </label>

      {!query && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          Prueba:
          {examples.map((e) => (
            <button key={e} type="button" onClick={() => setQ(e)} className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300 hover:border-red-500/50 hover:text-white">
              {e}
            </button>
          ))}
        </div>
      )}

      {query && results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.slice(0, 6).map((b) => (
            <li key={b.href}>
              <Link href={b.href} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-red-500/50">
                <span>
                  <span className="block font-semibold text-white">{b.name}</span>
                  <span className="block text-xs text-zinc-500">
                    {b.industryLabel} · aparece en {b.visibility} de las respuestas
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-red-400 whitespace-nowrap">
                  Ver informe <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {query && results.length === 0 && (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
          Esa marca todavía no está en el demo. Aquí están {brands.length} marcas de autos, bancos, seguros, tiendas y telefonía en México.
          Para medir la tuya ahora, usa tu propia llave de API.
        </p>
      )}

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 border-t border-white/10 pt-5">
        <Link
          href="/scan-geo?modo=llave"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-5 py-3 transition-colors"
        >
          <KeyRound size={15} />
          Mide cualquier marca con tu llave de API
        </Link>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Escribes tu sitio, pegas tu llave de Gemini, ChatGPT, Claude o Perplexity y la medición corre con tu cuenta. N3 no cobra nada.
        </p>
      </div>
    </section>
  );
}
