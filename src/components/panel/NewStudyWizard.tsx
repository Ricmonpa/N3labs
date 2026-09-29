"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, Globe, ListChecks, Loader2, PencilLine, Play, Sparkles } from "lucide-react";
import type { Study } from "@/lib/geo-visibility/types.ts";
import StudyEditor, { COUNTRIES, EMPTY_STUDY } from "./StudyEditor";
import StudySummary from "./StudySummary";
import NewRunForm, { type EngineStatus } from "./NewRunForm";
import { api, cardClass, inputClass, labelClass, primaryButton } from "./api";

type Suggestion = { study: Study; summary: string; source: "ai" | "template"; warnings: string[] };

const STAGES = ["Leyendo el sitio…", "Investigando la marca en la web…", "Buscando competidores reales…", "Escribiendo preguntas como las haría un cliente…", "Verificando dominios…"];
/** El clic único además revisa la legibilidad y arranca la medición. */
const QUICK_STAGES = [
  "Leyendo el sitio…",
  "Revisando si las IAs lo pueden leer…",
  "Investigando la marca y sus competidores…",
  "Escribiendo preguntas como las haría un cliente…",
  "Arrancando la medición…",
];

type Quick = { runId: string; studyId: string } | { draft: Suggestion };

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
  const [busy, setBusy] = useState<false | "quick" | "review">(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Suggestion | null>(null);
  const [blank, setBlank] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 8000);
    return () => clearInterval(t);
  }, [busy]);

  const withKey = engines.filter((e) => e.hasKey);
  const market = COUNTRIES.find((x) => x.code === country)!;
  const input = () => ({ url, notes, city, country, language: market.lang, timezone: market.tz });

  /** Un clic: estudio armado, legibilidad revisada y medición corriendo. */
  async function measure(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !withKey.length) return;
    setBusy("quick");
    setStage(0);
    setError("");
    try {
      const r = await api<Quick>("/api/panel/studies/quick", { body: input() });
      if ("runId" in r) {
        router.push(`/panel/corridas/${r.runId}`);
        return;
      }
      // La IA no pudo armar las preguntas: se revisan antes de gastar en preguntas genéricas.
      setDraft(r.draft);
      setStudy(r.draft.study);
      setBusy(false);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  /** El camino de antes: armar el estudio, revisarlo y medir después. */
  async function generate() {
    if (!url.trim()) return;
    setBusy("review");
    setStage(0);
    setError("");
    try {
      const d = await api<Suggestion>("/api/panel/suggest", { body: input() });
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

  const stages = busy === "quick" ? QUICK_STAGES : STAGES;
  const names = withKey.map((e) => e.label).join(", ");
  return (
    <form onSubmit={measure} className={`${cardClass} max-w-2xl space-y-5`}>
      <div>
        <h2 className="text-lg font-bold text-white">¿Qué sitio medimos?</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {aiAvailable
            ? "Pega el sitio y aprieta Medir. En un clic armamos el estudio (marca, competidores reales y las preguntas que haría un cliente), revisamos si las IAs pueden leer el sitio y arrancamos la medición."
            : "Escribe su sitio y armamos una plantilla con preguntas base para que la ajustes."}
        </p>
      </div>
      <div>
        <label htmlFor="wiz-url" className={labelClass}>Sitio web del cliente</label>
        <div className="relative">
          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input id="wiz-url" required autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="cliente.com" disabled={!!busy} className={`${inputClass} pl-9 py-2.5 text-base`} />
        </div>
      </div>

      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          Mercado y notas: <span className="text-zinc-300">{market.name}{city.trim() ? ` · ${city.trim()}` : ""}</span>
          <ChevronDown size={14} className="transition group-open:rotate-180" />
        </summary>
        <div className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wiz-country" className={labelClass}>País donde vende</label>
              <select id="wiz-country" value={country} onChange={(e) => setCountry(e.target.value)} disabled={!!busy} className={inputClass}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="wiz-city" className={labelClass}>Ciudad (opcional)</label>
              <input id="wiz-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Todo el país" disabled={!!busy} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="wiz-notes" className={labelClass}>¿Qué vende y a quién? (opcional, mejora la propuesta)</label>
            <textarea id="wiz-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Agencia de marketing digital para hoteles y destinos turísticos" disabled={!!busy} className={inputClass} />
          </div>
        </div>
      </details>

      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button type="submit" disabled={!!busy || !url.trim() || !withKey.length || !aiAvailable} className={`${primaryButton} px-6 py-3 text-base`}>
          {busy === "quick" ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          {busy === "quick" ? stages[stage] : "Medir"}
        </button>
        {!busy && (
          <>
            <button type="button" onClick={generate} disabled={!url.trim()} className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white disabled:opacity-50">
              <ListChecks size={14} /> Revisar preguntas antes de medir
            </button>
            <button type="button" onClick={() => setBlank(true)} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
              <PencilLine size={14} /> Llenarlo a mano
            </button>
          </>
        )}
        {busy === "review" && (
          <span className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <Loader2 size={15} className="animate-spin text-red-500" /> {stages[stage]}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500">
        {busy
          ? "Tarda entre 20 y 60 segundos."
          : !aiAvailable
            ? "Sin llave de Gemini en el servidor: usa “Revisar preguntas antes de medir” para armar una plantilla."
            : withKey.length
              ? `Mide en ${names}: unas 26 preguntas × 3 repeticiones = ${78 * withKey.length} consultas reales, más la revisión de legibilidad (sin costo).`
              : "No hay motores con llave: usa “Revisar preguntas antes de medir” para probar en simulación."}
      </p>
    </form>
  );
}
