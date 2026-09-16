"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileJson, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import type { Entity, PromptType, Study, StudyPrompt } from "@/lib/geo-visibility/types.ts";
import { TYPE_LABEL } from "@/lib/geo-visibility/report.ts";
import { api, cardClass, inputClass, labelClass, primaryButton, secondaryButton } from "./api";

const PREFIX: Record<PromptType, string> = { category: "c", problem: "p", comparison: "x", brand: "b" };

const TYPE_HELP: Record<PromptType, string> = {
  category: "Busca proveedores en general: “¿mejores agencias de … en México?”",
  problem: "Describe un problema y pide a quién acudir.",
  comparison: "Compara opciones o enfoques.",
  brand: "Incluye el nombre de la marca (no cuenta para la cifra principal).",
};

export const COUNTRIES = [
  { code: "MX", name: "México", tz: "America/Mexico_City", lang: "es-MX" },
  { code: "US", name: "Estados Unidos", tz: "America/New_York", lang: "en-US" },
  { code: "CO", name: "Colombia", tz: "America/Bogota", lang: "es-CO" },
  { code: "AR", name: "Argentina", tz: "America/Argentina/Buenos_Aires", lang: "es-AR" },
  { code: "CL", name: "Chile", tz: "America/Santiago", lang: "es-CL" },
  { code: "PE", name: "Perú", tz: "America/Lima", lang: "es-PE" },
  { code: "ES", name: "España", tz: "Europe/Madrid", lang: "es-ES" },
];

export const EMPTY_STUDY: Study = {
  name: "",
  brand: { name: "", aliases: [], domains: [] },
  competitors: [],
  market: { country: "MX", city: "Ciudad de México", region: "Ciudad de México", timezone: "America/Mexico_City", language: "es-MX" },
  runs: 3,
  engines: ["openai", "anthropic", "perplexity", "gemini"],
  prompts: [],
};

const splitList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

const cleanDomain = (d: string) =>
  d
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

function nextId(prompts: StudyPrompt[], type: PromptType) {
  const prefix = PREFIX[type];
  const used = new Set(prompts.map((p) => p.id));
  let n = 1;
  while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

function ListInput({ id, value, onChange, placeholder, transform }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; transform?: (s: string) => string }) {
  // Keep the raw text while typing so commas don't get eaten.
  const [text, setText] = useState(value.join(", "));
  return (
    <input
      id={id}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(splitList(e.target.value).map(transform ?? ((s) => s)));
      }}
      className={inputClass}
    />
  );
}

function EntityRow({ index, entity, onChange, onRemove }: { index: number; entity: Entity; onChange: (e: Entity) => void; onRemove: () => void }) {
  return (
    <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
      <input aria-label="Nombre del competidor" placeholder="Nombre" value={entity.name} onChange={(e) => onChange({ ...entity, name: e.target.value })} className={inputClass} />
      <ListInput id={`competitor-${index}-domains`} value={entity.domains} transform={cleanDomain} placeholder="dominio.com" onChange={(domains) => onChange({ ...entity, domains })} />
      <ListInput id={`competitor-${index}-aliases`} value={entity.aliases ?? []} placeholder="Otros nombres (opcional)" onChange={(aliases) => onChange({ ...entity, aliases })} />
      <button type="button" onClick={onRemove} className={secondaryButton} aria-label="Quitar competidor">
        <X size={14} />
      </button>
    </div>
  );
}

export default function StudyEditor({ id, initial }: { id: string | null; initial: Study }) {
  const router = useRouter();
  const [study, setStudy] = useState<Study>(initial);
  const [bulkType, setBulkType] = useState<PromptType>("category");
  const [bulk, setBulk] = useState("");
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  // Remount list inputs after an import so their text matches the new data.
  const [version, setVersion] = useState(0);

  const set = (patch: Partial<Study>) => {
    setSaved(false);
    setStudy((s) => ({ ...s, ...patch }));
  };

  function addPrompts() {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const prompts = [...study.prompts];
    for (const text of lines) prompts.push({ id: nextId(prompts, bulkType), type: bulkType, text });
    set({ prompts });
    setBulk("");
  }

  function importJson() {
    try {
      const data = JSON.parse(importText) as Study;
      setStudy({ ...EMPTY_STUDY, ...data, market: { ...EMPTY_STUDY.market, ...data.market } });
      setVersion((v) => v + 1);
      setShowImport(false);
      setImportText("");
      setError("");
    } catch {
      setError("El JSON no es válido.");
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const body = { ...study, name: study.name.trim() || study.brand.name.trim() };
      if (id) {
        await api(`/api/panel/studies/${id}`, { method: "PUT", body });
        setSaved(true);
        router.refresh();
      } else {
        const created = await api<{ id: string }>("/api/panel/studies", { body });
        router.push(`/panel/estudios/${created.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !confirm("¿Borrar este estudio y todas sus corridas? No se puede deshacer.")) return;
    await api(`/api/panel/studies/${id}`, { method: "DELETE" });
    router.push("/panel");
  }

  const country = COUNTRIES.find((c) => c.code === study.market.country);
  const counts = study.prompts.reduce<Record<string, number>>((acc, p) => ((acc[p.type] = (acc[p.type] ?? 0) + 1), acc), {});

  return (
    <div className="space-y-5" key={version}>
      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">Marca</h2>
          {!id && !initial.prompts.length && (
            <button type="button" onClick={() => setShowImport((v) => !v)} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
              <FileJson size={12} /> Importar JSON (avanzado)
            </button>
          )}
        </div>
        {showImport && (
          <div className="mt-4 space-y-2">
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={6} placeholder='{"name": "...", "brand": {...}, "prompts": [...]}' className={`${inputClass} font-mono text-xs`} />
            <button type="button" onClick={importJson} className={secondaryButton}>Cargar</button>
          </div>
        )}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="brand-name" className={labelClass}>Nombre de la marca</label>
            <input id="brand-name" value={study.brand.name} onChange={(e) => set({ brand: { ...study.brand, name: e.target.value } })} placeholder="Potenttial Group" className={inputClass} />
          </div>
          <div>
            <label htmlFor="study-name" className={labelClass}>Nombre del estudio (opcional)</label>
            <input id="study-name" value={study.name} onChange={(e) => set({ name: e.target.value })} placeholder={study.brand.name || "Igual que la marca"} className={inputClass} />
          </div>
          <div>
            <label htmlFor="brand-domains" className={labelClass}>Dominios del sitio (separados por coma)</label>
            <ListInput id="brand-domains" value={study.brand.domains} transform={cleanDomain} placeholder="potenttial.com" onChange={(domains) => set({ brand: { ...study.brand, domains } })} />
          </div>
          <div>
            <label htmlFor="brand-aliases" className={labelClass}>Otras formas de escribir el nombre</label>
            <ListInput id="brand-aliases" value={study.brand.aliases ?? []} placeholder="Potenttial, Potential Group" onChange={(aliases) => set({ brand: { ...study.brand, aliases } })} />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold text-white">Mercado</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label htmlFor="country" className={labelClass}>País</label>
            <select
              id="country"
              value={study.market.country}
              onChange={(e) => {
                const c = COUNTRIES.find((x) => x.code === e.target.value)!;
                set({ market: { ...study.market, country: c.code, timezone: c.tz, language: c.lang } });
              }}
              className={inputClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-zinc-900">{c.name}</option>
              ))}
              {!country && <option value={study.market.country}>{study.market.country}</option>}
            </select>
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>Ciudad</label>
            <input id="city" value={study.market.city ?? ""} onChange={(e) => set({ market: { ...study.market, city: e.target.value, region: e.target.value } })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="language" className={labelClass}>Idioma de las preguntas</label>
            <input id="language" value={study.market.language} onChange={(e) => set({ market: { ...study.market, language: e.target.value } })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="runs" className={labelClass}>Repeticiones por pregunta</label>
            <input id="runs" type="number" min={1} max={10} value={study.runs} onChange={(e) => set({ runs: Number(e.target.value) })} className={inputClass} />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold text-white">Competidores</h2>
        <p className="text-sm text-zinc-400 mt-1">Marcas reales con su dominio. Sin competidores no hay comparación ni participación de voz.</p>
        <div className="mt-4 space-y-2">
          {study.competitors.map((c, i) => (
            <EntityRow
              key={`${i}-${study.competitors.length}`}
              index={i}
              entity={c}
              onChange={(e) => set({ competitors: study.competitors.map((x, j) => (j === i ? e : x)) })}
              onRemove={() => set({ competitors: study.competitors.filter((_, j) => j !== i) })}
            />
          ))}
          <button type="button" onClick={() => set({ competitors: [...study.competitors, { name: "", domains: [], aliases: [] }] })} className={secondaryButton}>
            <Plus size={14} /> Agregar competidor
          </button>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold text-white">Preguntas</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Escríbelas como las haría un cliente. Para un estudio serio usa de 30 a 100.{" "}
          <span className="text-zinc-500">
            {study.prompts.length} en total
            {Object.keys(counts).length > 0 && ` · ${(Object.keys(counts) as PromptType[]).map((t) => `${TYPE_LABEL[t]}: ${counts[t]}`).join(" · ")}`}
          </span>
        </p>

        <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PREFIX) as PromptType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBulkType(t)}
                className={`rounded-full px-3 py-1 text-xs border transition-colors ${bulkType === t ? "border-red-500 bg-red-600/20 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">{TYPE_HELP[bulkType]}</p>
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder="Una pregunta por línea" className={inputClass} aria-label="Nuevas preguntas" />
          <button type="button" onClick={addPrompts} disabled={!bulk.trim()} className={secondaryButton}>
            <Plus size={14} /> Agregar como “{TYPE_LABEL[bulkType]}”
          </button>
        </div>

        {study.prompts.length > 0 && (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {study.prompts.map((p, i) => (
              <li key={p.id} className="py-2 grid grid-cols-[3rem_8rem_1fr_auto] gap-2 items-center">
                <span className="text-xs font-mono text-zinc-500">{p.id}</span>
                <select
                  aria-label={`Tipo de ${p.id}`}
                  value={p.type}
                  onChange={(e) => {
                    const type = e.target.value as PromptType;
                    const others = study.prompts.filter((_, j) => j !== i);
                    set({ prompts: study.prompts.map((x, j) => (j === i ? { ...x, type, id: nextId(others, type) } : x)) });
                  }}
                  className={`${inputClass} py-1.5 text-xs`}
                >
                  {(Object.keys(PREFIX) as PromptType[]).map((t) => (
                    <option key={t} value={t} className="bg-zinc-900">{TYPE_LABEL[t]}</option>
                  ))}
                </select>
                <input
                  aria-label={`Texto de ${p.id}`}
                  value={p.text}
                  onChange={(e) => set({ prompts: study.prompts.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
                  className={`${inputClass} py-1.5`}
                />
                <button type="button" onClick={() => set({ prompts: study.prompts.filter((_, j) => j !== i) })} className="p-2 text-zinc-500 hover:text-red-400" aria-label={`Quitar ${p.id}`}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={primaryButton}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {id ? "Guardar cambios" : "Crear estudio"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Guardado</span>}
        {id && (
          <button type="button" onClick={remove} className="ml-auto text-sm text-zinc-500 hover:text-red-400">
            Borrar estudio
          </button>
        )}
      </div>
    </div>
  );
}
