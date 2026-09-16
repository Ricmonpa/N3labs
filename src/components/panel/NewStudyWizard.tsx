"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Globe, Loader2, PencilLine, Sparkles } from "lucide-react";
import type { Study } from "@/lib/geo-visibility/types.ts";
import StudyEditor, { COUNTRIES, EMPTY_STUDY } from "./StudyEditor";
import { api, cardClass, inputClass, labelClass, primaryButton } from "./api";

type Suggestion = { study: Study; summary: string; source: "ai" | "template"; warnings: string[] };

const STAGES = ["Leyendo el sitio…", "Investigando la marca en la web…", "Buscando competidores reales…", "Escribiendo preguntas como las haría un cliente…", "Verificando dominios…"];

export default function NewStudyWizard({ aiAvailable }: { aiAvailable: boolean }) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [country, setCountry] = useState("MX");
  const [city, setCity] = useState("Ciudad de México");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Suggestion | null>(null);
  const [blank, setBlank] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 6000);
    return () => clearInterval(t);
  }, [busy]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const c = COUNTRIES.find((x) => x.code === country)!;
    setBusy(true);
    setStage(0);
    setError("");
    try {
      setDraft(await api<Suggestion>("/api/panel/suggest", { body: { url, notes, city, country, language: c.lang, timezone: c.tz } }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (blank || draft) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => (setDraft(null), setBlank(false))} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft size={14} /> Empezar de nuevo
        </button>
        {draft && (
          <div className={`${cardClass} border-red-500/20`}>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-red-500" />
              {draft.source === "ai" ? "Propuesta lista: revísala y ajusta lo que haga falta" : "Plantilla lista para ajustar"}
            </p>
            {draft.summary && <p className="mt-2 text-sm text-zinc-300">{draft.summary}</p>}
            <p className="mt-2 text-xs text-zinc-500">
              {draft.study.competitors.length} competidores · {draft.study.prompts.length} preguntas. Los competidores y las preguntas son una propuesta: confirma que tengan sentido para el cliente.
            </p>
            {draft.warnings.map((w) => (
              <p key={w} className="mt-2 flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}
              </p>
            ))}
          </div>
        )}
        <StudyEditor id={null} initial={draft?.study ?? EMPTY_STUDY} />
      </div>
    );
  }

  return (
    <form onSubmit={generate} className={`${cardClass} max-w-2xl space-y-5`}>
      <div>
        <h2 className="text-lg font-bold text-white">¿De qué cliente es el estudio?</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {aiAvailable
            ? "Escribe su sitio. Leemos la página, investigamos la marca y proponemos competidores reales y las preguntas que haría un cliente. Tú solo revisas."
            : "Escribe su sitio y armamos una plantilla con preguntas base para que la ajustes."}
        </p>
      </div>
      <div>
        <label htmlFor="wiz-url" className={labelClass}>Sitio web del cliente</label>
        <div className="relative">
          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input id="wiz-url" required autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="cliente.com" className={`${inputClass} pl-9 py-2.5 text-base`} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="wiz-country" className={labelClass}>País donde vende</label>
          <select id="wiz-country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-zinc-900">{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="wiz-city" className={labelClass}>Ciudad (opcional)</label>
          <input id="wiz-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Todo el país" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="wiz-notes" className={labelClass}>¿Qué vende y a quién? (opcional, mejora la propuesta)</label>
        <textarea id="wiz-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Agencia de marketing digital para hoteles y destinos turísticos" className={inputClass} />
      </div>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy || !url.trim()} className={`${primaryButton} px-5 py-2.5`}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {busy ? STAGES[stage] : "Armar estudio"}
        </button>
        {!busy && (
          <button type="button" onClick={() => setBlank(true)} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
            <PencilLine size={14} /> Llenarlo a mano
          </button>
        )}
      </div>
      {busy && <p className="text-xs text-zinc-500">Tarda entre 20 y 60 segundos.</p>}
    </form>
  );
}
