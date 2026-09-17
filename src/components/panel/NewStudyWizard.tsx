"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Globe, Loader2, PencilLine, Sparkles } from "lucide-react";
import type { Study } from "@/lib/geo-visibility/types.ts";
import StudyEditor, { COUNTRIES, EMPTY_STUDY } from "./StudyEditor";
import StudySummary from "./StudySummary";
import NewRunForm, { type EngineStatus } from "./NewRunForm";
import { api, cardClass, inputClass, labelClass, primaryButton } from "./api";

type Suggestion = { study: Study; summary: string; source: "ai" | "template"; warnings: string[] };

const STAGES = ["Leyendo el sitio…", "Investigando la marca en la web…", "Buscando competidores reales…", "Escribiendo preguntas como las haría un cliente…", "Verificando dominios…"];

export default function NewStudyWizard({ aiAvailable, engines, maxCalls }: { aiAvailable: boolean; engines: EngineStatus[]; maxCalls: number }) {
  const router = useRouter();
  const [study, setStudy] = useState<Study | null>(null);
  const [editing, setEditing] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
      const d = await api<Suggestion>("/api/panel/suggest", { body: { url, notes, city, country, language: c.lang, timezone: c.tz } });
      setDraft(d);
      setStudy(d.study);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    // Save again if the user tweaked the study after a failed start.
    if (savedId) {
      await api(`/api/panel/studies/${savedId}`, { method: "PUT", body: study });
      return savedId;
    }
    const created = await api<{ id: string }>("/api/panel/studies", { body: study });
    setSavedId(created.id);
    return created.id;
  }

  if (blank) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setBlank(false)} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft size={14} /> Volver
        </button>
        <StudyEditor id={null} initial={EMPTY_STUDY} />
      </div>
    );
  }

  if (draft && study) {
    const reset = () => (setDraft(null), setStudy(null), setEditing(false), setSavedId(null));
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-white">
              <Sparkles size={18} className="text-red-500" />
              {draft.source === "ai" ? "Listo. Esto es lo que vamos a medir" : "Plantilla lista"}
            </p>
            {draft.summary && <p className="mt-1 max-w-3xl text-sm text-zinc-400">{draft.summary}</p>}
            {draft.warnings.map((w) => (
              <p key={w} className="mt-1 flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}
              </p>
            ))}
          </div>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft size={14} /> Otro sitio
          </button>
        </div>

        <div className={`${cardClass} border-red-500/25 bg-red-950/10`}>
          <NewRunForm
            ensureStudy={save}
            promptCount={study.prompts.length}
            defaultRuns={study.runs}
            engines={engines}
            maxCalls={maxCalls}
            secondary={
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      router.push(`/panel/estudios/${await save()}`);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="text-sm text-zinc-300 hover:text-white"
                >
                  Solo guardar
                </button>
                <button type="button" onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
                  <PencilLine size={14} /> {editing ? "Cerrar edición" : "Ajustar a mano"}
                </button>
              </>
            }
          />
        </div>

        {editing ? (
          <StudyEditor id={null} initial={study} onChange={setStudy} />
        ) : (
          <StudySummary study={study} onChange={setStudy} />
        )}
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
