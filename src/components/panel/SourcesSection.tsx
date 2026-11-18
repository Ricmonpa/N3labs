"use client";

import { useState } from "react";
import type { SourceInsights, SourceType } from "@/lib/geo-visibility/insights.ts";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";
import { Bar, ENGINE_COLOR, num, pct, range, Section, SOURCE_META, Stat, Swatch } from "./report-ui";

const PAGE = 12;

/** De dónde sacan las IAs lo que dicen: tipos de sitio, dominios y cuánto cita cada IA. */
export default function SourcesSection({ sources, brand }: { sources: SourceInsights; brand: string }) {
  const [type, setType] = useState<SourceType | "all">("all");
  const [shown, setShown] = useState(PAGE);
  if (!sources.citations) return null;

  const types = sources.types.filter((t) => t.citations > 0);
  const rows = sources.top.filter((d) => type === "all" || d.type === type);
  const brandRow = sources.top.find((d) => d.type === "brand");
  const brandCitations = sources.types.find((t) => t.type === "brand")?.citations ?? 0;
  const maxCites = Math.max(0.1, ...sources.perEngine.map((e) => e.citationsPerAnswer));

  return (
    <Section
      eyebrow="Fuentes"
      title="¿De dónde sacan las IAs lo que dicen?"
      intro="Cada link que las IAs ponen en sus respuestas, agrupado por tipo de sitio. Si tu categoría se responde con medios, reseñas o tiendas, estar ahí pesa tanto como tu propio sitio."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Links citados" value={num(sources.citations, 0)} foot={`en ${sources.answers} respuestas`} />
        <Stat label="Sitios distintos" value={num(sources.domains, 0)} foot="dominios citados o consultados" />
        <Stat
          label="Respuestas con fuentes"
          value={sources.withCitations.n ? pct(sources.withCitations.rate) : "—"}
          foot={`${sources.withCitations.hits} de ${sources.withCitations.n} · rango ${range(sources.withCitations)}`}
        />
        <Stat
          label={`Links a ${brand}`}
          value={sources.citations ? pct(brandCitations / sources.citations) : "—"}
          foot={brandRow ? `${brandCitations} links a ${brandRow.domain}` : "Ninguna IA enlazó tu sitio"}
        />
      </div>

      <div className="mt-7">
        <h3 className="text-sm font-semibold text-white mb-3">Tipo de sitio que citan</h3>
        <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-md" role="img" aria-label="Reparto de links citados por tipo de sitio">
          {types.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setType(type === t.type ? "all" : t.type)}
              title={`${SOURCE_META[t.type].label}: ${t.citations} links (${pct(t.citations / sources.citations)})`}
              className={`h-full transition first:rounded-l-md last:rounded-r-md hover:brightness-125 ${type !== "all" && type !== t.type ? "opacity-30" : ""}`}
              style={{ width: `${(t.citations / sources.citations) * 100}%`, minWidth: 4, background: SOURCE_META[t.type].color }}
            />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
          {types.map((t) => (
            <li key={t.type}>
              <button
                type="button"
                onClick={() => setType(type === t.type ? "all" : t.type)}
                aria-pressed={type === t.type}
                className={`flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left hover:bg-white/[0.04] ${type === t.type ? "bg-white/[0.06]" : ""}`}
              >
                <span className="mt-1">
                  <Swatch color={SOURCE_META[t.type].color} />
                </span>
                <span>
                  <span className="block text-sm text-zinc-200">{SOURCE_META[t.type].label}</span>
                  <span className="block text-xs text-zinc-500 tabular-nums">
                    {t.citations} · {pct(t.citations / sources.citations)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-x-10 gap-y-7">
        <div>
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <h3 className="text-sm font-semibold text-white">Sitios más citados</h3>
            {type !== "all" && (
              <button type="button" onClick={() => setType("all")} className="text-xs text-red-400 hover:text-red-300">
                {SOURCE_META[type].label} · ver todos
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-2 pr-3 font-medium">Sitio</th>
                  <th className="py-2 pr-3 font-medium text-right" title="Respuestas que ponen un link a este sitio">
                    Lo citan
                  </th>
                  <th className="py-2 pr-3 font-medium text-right" title="Respuestas donde la IA leyó este sitio, lo haya citado o no">
                    Lo leyeron
                  </th>
                  <th className="py-2 pr-3 font-medium">IAs</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, shown).map((d) => (
                  <tr key={d.domain} className="border-t border-white/[0.06] print:border-zinc-200">
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <Swatch color={SOURCE_META[d.type].color} />
                        <span className={`font-mono text-[13px] break-all ${d.type === "brand" ? "text-red-300" : "text-zinc-200 print:text-zinc-800"}`}>{d.domain}</span>
                      </span>
                      <span className="ml-[18px] text-[11px] text-zinc-500">
                        {SOURCE_META[d.type].label}
                        {d.entity && d.type !== "brand" ? ` · ${d.entity}` : ""}
                        {d.urls > 1 ? ` · ${d.urls} páginas` : ""}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-white">{d.cited}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-zinc-400">{d.consulted || "—"}</td>
                    <td className="py-2 pr-3">
                      <span className="flex gap-1">
                        {d.engines.map((e) => (
                          <span key={e} title={ENGINE_LABEL[e]}>
                            <Swatch color={ENGINE_COLOR[e]} />
                            <span className="sr-only">{ENGINE_LABEL[e]}</span>
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="mt-3 text-xs text-red-400 hover:text-red-300 print:hidden">
              Ver más ({rows.length - shown} restantes)
            </button>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Links por respuesta, por IA</h3>
          <p className="text-xs text-zinc-500 mb-3">Cuántas fuentes pone cada IA en promedio.</p>
          {sources.perEngine.map((e) => (
            <Bar
              key={e.engine}
              label={
                <span className="inline-flex items-center gap-2">
                  <Swatch color={ENGINE_COLOR[e.engine]} /> {ENGINE_LABEL[e.engine]}
                </span>
              }
              value={e.citationsPerAnswer}
              max={maxCites}
              display={num(e.citationsPerAnswer)}
              color={ENGINE_COLOR[e.engine]}
              note={`${ENGINE_LABEL[e.engine]}: ${num(e.citationsPerAnswer)} links por respuesta; ${pct(e.withCitations.rate)} de sus respuestas traen fuentes${
                e.consultedReported ? `; lee ${num(e.consultedPerAnswer)} páginas por respuesta` : ""
              }`}
            />
          ))}
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            &quot;Lo leyeron&quot; solo se conoce en las IAs que informan todas las páginas que consultan. Gemini solo informa las que cita.
          </p>
        </div>
      </div>
    </Section>
  );
}
