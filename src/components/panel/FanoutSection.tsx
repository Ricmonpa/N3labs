"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { FanoutInsights, QueryKind } from "@/lib/geo-visibility/insights.ts";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";
import { Bar, Chip, ENGINE_COLOR, num, pct, range, Section, Stat, Swatch } from "./report-ui";

const KIND: Record<QueryKind, { label: string; hint: string }> = {
  site: { label: "Directo a un sitio", hint: "Busca dentro de un dominio con site:" },
  quoted: { label: "Frase exacta", hint: "Busca una frase entre comillas" },
  open: { label: "Abierta", hint: "Búsqueda normal en la web" },
};

type Filter = "all" | "brand" | "others" | "site";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "brand", label: "Te buscan por nombre" },
  { id: "others", label: "Buscan a otros" },
  { id: "site", label: "Directo a un sitio" },
];

const PAGE = 15;

/** Las búsquedas que hacen las IAs por dentro antes de responder. */
export default function FanoutSection({ fanout, brand }: { fanout: FanoutInsights; brand: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);
  if (!fanout.total) return null;

  const rows = fanout.top.filter((q) =>
    filter === "brand" ? q.brand : filter === "others" ? q.names.length > 0 && !q.brand : filter === "site" ? q.kind === "site" : true,
  );
  const searchedForBrand = fanout.searchedFor[0];
  const maxEntity = Math.max(1, ...fanout.entities.map((e) => e.queries));
  const maxPerAnswer = Math.max(0.1, ...fanout.perEngine.map((e) => e.perAnswer));
  const maxSite = Math.max(1, ...fanout.sites.map((s) => s.count));
  const kindTotal = fanout.kinds.reduce((n, k) => n + k.count, 0);

  return (
    <Section
      eyebrow="Lo que la IA busca antes de responder"
      title="Búsquedas internas de las IAs"
      intro="Antes de contestar, cada IA hace sus propias búsquedas en la web. Ahí se ve qué páginas va a buscar, a qué marcas busca por nombre y qué palabras usa. Si la IA busca una página tuya y no la puede leer, responde con lo que encuentre en otro lado."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Búsquedas hechas" value={num(fanout.total, 0)} foot={`en ${fanout.answers} respuestas · ${num(fanout.unique, 0)} distintas`} />
        <Stat
          label="Búsquedas por respuesta"
          value={num(fanout.answers ? fanout.total / fanout.answers : 0)}
          foot="promedio, sumando todas las IAs"
        />
        <Stat
          label={`Buscan a ${brand} sin que se la pidan`}
          value={searchedForBrand?.rate.n ? pct(searchedForBrand.rate.rate) : "—"}
          foot={
            searchedForBrand?.rate.n
              ? `${searchedForBrand.rate.hits} de ${searchedForBrand.rate.n} respuestas a preguntas sin tu nombre · rango ${range(searchedForBrand.rate)}`
              : "Sin búsquedas en preguntas sin tu nombre"
          }
        />
        <Stat
          label="Van directo a un sitio"
          value={kindTotal ? pct((fanout.kinds.find((k) => k.kind === "site")?.count ?? 0) / kindTotal) : "—"}
          foot="de las búsquedas usan site: para leer un dominio"
        />
      </div>

      <div className="mt-7 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-7">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">¿A qué marcas busca por nombre?</h3>
          <p className="text-xs text-zinc-500 mb-3">Búsquedas que nombran a cada marca o a su dominio.</p>
          {fanout.entities.map((e, i) => (
            <Bar
              key={e.name}
              label={e.name}
              value={e.queries}
              max={maxEntity}
              display={num(e.queries, 0)}
              color={i === 0 ? "#dc2626" : "#64748b"}
              note={`${e.name}: ${e.queries} búsquedas (${pct(e.share)} del total)`}
            />
          ))}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">¿Cuánto busca cada IA?</h3>
          <p className="text-xs text-zinc-500 mb-3">Búsquedas por respuesta, y en qué parte de las respuestas buscó algo.</p>
          {fanout.perEngine.map((e) => (
            <Bar
              key={e.engine}
              label={
                <span className="inline-flex items-center gap-2">
                  <Swatch color={ENGINE_COLOR[e.engine]} /> {ENGINE_LABEL[e.engine]}
                </span>
              }
              value={e.perAnswer}
              max={maxPerAnswer}
              display={num(e.perAnswer)}
              color={ENGINE_COLOR[e.engine]}
              note={`${ENGINE_LABEL[e.engine]}: ${e.queries} búsquedas en ${e.answers} respuestas; buscó en ${pct(e.searched.rate)} de ellas`}
            />
          ))}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            {fanout.kinds.map((k) => (
              <span key={k.kind} title={KIND[k.kind].hint}>
                {KIND[k.kind].label}: <span className="text-zinc-300 tabular-nums">{kindTotal ? pct(k.count / kindTotal) : "—"}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white mr-2">Las búsquedas más repetidas</h3>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setShown(PAGE);
              }}
              aria-pressed={filter === f.id}
              className={`rounded-full px-3 py-1 text-xs border transition-colors print:hidden ${
                filter === f.id ? "border-red-500/60 bg-red-500/15 text-white" : "border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Ninguna búsqueda con este filtro.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-2 pr-3 font-medium w-8">#</th>
                  <th className="py-2 pr-3 font-medium">Búsqueda</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">IAs</th>
                  <th className="py-2 pr-3 font-medium text-right">Veces</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, shown).map((q, i) => (
                  <tr key={q.query} className="border-t border-white/[0.06] align-top print:border-zinc-200">
                    <td className="py-2 pr-3 text-zinc-600 tabular-nums">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <span className="font-mono text-[13px] text-zinc-200 break-words print:text-zinc-800">{q.query}</span>
                      {q.names.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {q.names.map((n) => (
                            <Chip key={n} tone={n === brand ? "red" : "zinc"}>
                              {n}
                            </Chip>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-zinc-400 whitespace-nowrap" title={KIND[q.kind].hint}>
                      {KIND[q.kind].label}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="flex gap-1">
                        {q.engines.map((e) => (
                          <span key={e} title={ENGINE_LABEL[e]} className="inline-flex items-center">
                            <Swatch color={ENGINE_COLOR[e]} />
                            <span className="sr-only">{ENGINE_LABEL[e]}</span>
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-white">{q.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > shown && (
          <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="mt-3 text-xs text-red-400 hover:text-red-300 print:hidden">
            Ver más ({rows.length - shown} restantes)
          </button>
        )}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          {fanout.perEngine.map((e) => (
            <span key={e.engine} className="inline-flex items-center gap-1.5">
              <Swatch color={ENGINE_COLOR[e.engine]} /> {ENGINE_LABEL[e.engine]}
            </span>
          ))}
        </p>
      </div>

      {(fanout.sites.length > 0 || fanout.phrases.length > 0) && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-7">
          {fanout.sites.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Sitios que la IA va a leer directo</h3>
              <p className="text-xs text-zinc-500 mb-3">Dominios que busca con site:. Estas páginas tienen que poder leerse.</p>
              {fanout.sites.map((s) => (
                <Bar
                  key={s.host}
                  label={
                    <span className="font-mono">
                      {s.host}
                      {s.entity && <span className={`ml-2 font-sans text-[10px] uppercase tracking-wider ${s.entity === brand ? "text-red-400" : "text-zinc-500"}`}>{s.entity}</span>}
                    </span>
                  }
                  value={s.count}
                  max={maxSite}
                  display={num(s.count, 0)}
                  color={s.entity === brand ? "#dc2626" : "#64748b"}
                />
              ))}
            </div>
          )}
          {fanout.phrases.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Palabras que más repite al buscar</h3>
              <p className="text-xs text-zinc-500 mb-3">Pares de palabras en sus búsquedas. Así describe tu categoría.</p>
              <ul className="flex flex-wrap gap-2">
                {fanout.phrases.map((p) => (
                  <li key={p.phrase} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm">
                    <Search size={12} className="text-zinc-500" />
                    <span className="text-zinc-200">{p.phrase}</span>
                    <span className="text-xs text-zinc-500 tabular-nums">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
