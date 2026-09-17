"use client";

import { useState } from "react";
import { Globe, MapPin, X } from "lucide-react";
import type { PromptType, Study } from "@/lib/geo-visibility/types.ts";
import { cardClass } from "./api";

const GROUPS: { type: PromptType; title: string; hint: string }[] = [
  { type: "category", title: "Buscan proveedores", hint: "sin decir tu nombre" },
  { type: "problem", title: "Tienen un problema", hint: "y piden a quién acudir" },
  { type: "comparison", title: "Comparan opciones", hint: "" },
  { type: "brand", title: "Preguntan por la marca", hint: "no cuenta para la cifra principal" },
];

const SHOWN = 4;

/** Read-only view of a study; with `onChange`, items can be removed in place. */
export default function StudySummary({ study, onChange }: { study: Study; onChange?: (s: Study) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const place = [study.market.city, study.market.country].filter(Boolean).join(", ");

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4">
      <div className="space-y-4">
        <section className={cardClass}>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-500">Marca</p>
          <p className="mt-1 text-xl font-black text-white">{study.brand.name}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400">
            <Globe size={14} /> {study.brand.domains.join(", ")}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <MapPin size={14} /> {place}
          </p>
          {(study.brand.aliases?.length ?? 0) > 0 && <p className="mt-3 text-xs text-zinc-500">También se detecta como: {study.brand.aliases!.join(", ")}</p>}
        </section>

        <section className={cardClass}>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-500">Competidores · {study.competitors.length}</p>
          {study.competitors.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Sin competidores: el informe no tendrá comparación.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {study.competitors.map((c, i) => (
                <li key={c.name + i} className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-3 pr-1.5 py-1 text-sm">
                  <span className="text-white">{c.name}</span>
                  <span className="text-xs font-mono text-zinc-500">{c.domains[0]}</span>
                  {onChange && (
                    <button
                      type="button"
                      aria-label={`Quitar ${c.name}`}
                      onClick={() => onChange({ ...study, competitors: study.competitors.filter((_, j) => j !== i) })}
                      className="rounded-full p-0.5 text-zinc-500 hover:bg-white/10 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={cardClass}>
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-500">Preguntas que haremos · {study.prompts.length}</p>
        <div className="mt-3 space-y-4">
          {GROUPS.map((g) => {
            const items = study.prompts.filter((p) => p.type === g.type);
            if (!items.length) return null;
            const expanded = open[g.type] || items.length <= SHOWN + 1;
            return (
              <div key={g.type}>
                <p className="text-sm font-semibold text-white">
                  {g.title} <span className="font-normal text-zinc-500">· {items.length}{g.hint && ` · ${g.hint}`}</span>
                </p>
                <ul className="mt-1.5 space-y-1">
                  {(expanded ? items : items.slice(0, SHOWN)).map((p) => (
                    <li key={p.id} className="group flex items-start gap-2 rounded-md px-2 py-1 -mx-2 hover:bg-white/[0.03]">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                      <span className="flex-1 text-sm text-zinc-300">{p.text}</span>
                      {onChange && (
                        <button
                          type="button"
                          aria-label="Quitar pregunta"
                          onClick={() => onChange({ ...study, prompts: study.prompts.filter((x) => x.id !== p.id) })}
                          className="rounded p-0.5 text-zinc-600 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {!expanded && (
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [g.type]: true }))} className="mt-1 text-xs text-red-400 hover:text-red-300">
                    Ver las {items.length}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
