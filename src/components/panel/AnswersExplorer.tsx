"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import type { EngineId, Source, StudyPrompt } from "@/lib/geo-visibility/types.ts";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";
import { api, cardClass, inputClass, secondaryButton } from "./api";

type Answer = {
  key: string;
  engine: EngineId;
  promptId: string;
  run: number;
  ok: boolean;
  error?: string;
  model?: string;
  text: string;
  citations: Source[];
  searchQueries: string[];
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Lets the team read the exact answers behind every number. */
export default function AnswersExplorer({ runId, prompts, brandTerms }: { runId: string; prompts: StudyPrompt[]; brandTerms: string[] }) {
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [engine, setEngine] = useState<EngineId | "">("");

  async function load() {
    setLoading(true);
    try {
      setAnswers(await api<Answer[]>(`/api/panel/runs/${runId}?answers=1`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const terms = brandTerms.map(norm);
  const shown = (answers ?? []).filter((a) => a.promptId === promptId && (!engine || a.engine === engine)).sort((a, b) => a.engine.localeCompare(b.engine) || a.run - b.run);
  const engines = [...new Set((answers ?? []).map((a) => a.engine))];

  return (
    <section className={`${cardClass} print:hidden`}>
      <h2 className="text-lg font-bold text-white">Respuestas completas</h2>
      <p className="text-sm text-zinc-400 mt-1">Lo que respondió cada IA, para revisar cualquier número del informe.</p>
      {!answers ? (
        <button type="button" onClick={load} disabled={loading} className={`${secondaryButton} mt-4`}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />} Ver respuestas
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid sm:grid-cols-[1fr_12rem] gap-2">
            <select value={promptId} onChange={(e) => setPromptId(e.target.value)} className={inputClass} aria-label="Pregunta">
              {prompts.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">
                  {p.id} · {p.text}
                </option>
              ))}
            </select>
            <select value={engine} onChange={(e) => setEngine(e.target.value as EngineId | "")} className={inputClass} aria-label="Motor">
              <option value="" className="bg-zinc-900">Todos los motores</option>
              {engines.map((e) => (
                <option key={e} value={e} className="bg-zinc-900">{ENGINE_LABEL[e]}</option>
              ))}
            </select>
          </div>
          {shown.length === 0 && <p className="text-sm text-zinc-500">Sin respuestas para este filtro.</p>}
          {shown.map((a) => {
            const mentioned = terms.some((t) => norm(a.text).includes(t));
            return (
              <details key={a.key} className="rounded-lg border border-white/[0.07] bg-black/20 open:bg-black/30">
                <summary className="cursor-pointer list-none px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-white">{ENGINE_LABEL[a.engine]}</span>
                  <span className="text-zinc-500">repetición {a.run}</span>
                  {!a.ok ? (
                    <span className="text-red-400">falló</span>
                  ) : (
                    <>
                      <span className={mentioned ? "text-emerald-400" : "text-zinc-500"}>{mentioned ? "menciona la marca" : "no la menciona"}</span>
                      <span className="text-zinc-500">· {a.citations.length} fuentes · {a.searchQueries.length} búsquedas</span>
                    </>
                  )}
                </summary>
                <div className="px-4 pb-4 text-sm">
                  {a.ok ? (
                    <>
                      <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed max-h-[28rem] overflow-y-auto">{a.text}</p>
                      {a.citations.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {a.citations.map((c) => (
                            <li key={c.url}>
                              <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-block rounded bg-white/[0.06] px-2 py-0.5 text-xs font-mono text-zinc-300 hover:text-white">
                                {hostOf(c.url)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {a.searchQueries.length > 0 && <p className="mt-3 text-xs text-zinc-500">Buscó: {a.searchQueries.join(" · ")}</p>}
                    </>
                  ) : (
                    <p className="text-red-300 font-mono text-xs">{a.error}</p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}
