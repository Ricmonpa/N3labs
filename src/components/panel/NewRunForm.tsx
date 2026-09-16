"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import type { EngineId } from "@/lib/geo-visibility/types.ts";
import { api, cardClass, inputClass, labelClass, primaryButton } from "./api";

export type EngineStatus = { id: EngineId; label: string; model: string; hasKey: boolean };

export default function NewRunForm({
  studyId,
  promptCount,
  defaultRuns,
  engines,
  maxCalls,
}: {
  studyId: string;
  promptCount: number;
  defaultRuns: number;
  engines: EngineStatus[];
  maxCalls: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<EngineId[]>(engines.filter((e) => e.hasKey).map((e) => e.id));
  const [runs, setRuns] = useState(defaultRuns);
  const [limit, setLimit] = useState<string>("");
  const [simulated, setSimulated] = useState(!engines.some((e) => e.hasKey));
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const prompts = limit ? Math.min(Number(limit) || 0, promptCount) : promptCount;
  const usable = selected.filter((id) => simulated || engines.find((e) => e.id === id)?.hasKey);
  const calls = prompts * usable.length * runs;
  const tooMany = calls > maxCalls;
  const canRun = calls > 0 && !tooMany && (simulated || confirmed) && !busy;

  async function start() {
    setBusy(true);
    setError("");
    try {
      const { id } = await api<{ id: string }>(`/api/panel/studies/${studyId}/runs`, {
        body: { engines: usable, runs, limit: limit ? Number(limit) : null, simulated },
      });
      router.push(`/panel/corridas/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="text-lg font-bold text-white">Nueva corrida</h2>
      {promptCount === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">Agrega preguntas al estudio para poder correrlo.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className={labelClass}>Motores</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {engines.map((e) => {
                const disabled = !e.hasKey && !simulated;
                return (
                  <label key={e.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${disabled ? "border-white/5 text-zinc-600" : "border-white/10 text-zinc-200 cursor-pointer hover:border-white/25"}`}>
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={selected.includes(e.id) && !disabled}
                      onChange={(ev) => setSelected((s) => (ev.target.checked ? [...s, e.id] : s.filter((x) => x !== e.id)))}
                      className="accent-red-600"
                    />
                    <span className="flex-1">
                      {e.label}
                      <span className="block text-xs text-zinc-500">{e.hasKey ? e.model : "Falta la llave en el servidor"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label htmlFor="run-runs" className={labelClass}>Repeticiones</label>
              <input id="run-runs" type="number" min={1} max={10} value={runs} onChange={(e) => setRuns(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="run-limit" className={labelClass}>Solo las primeras N preguntas</label>
              <input id="run-limit" type="number" min={1} max={promptCount} placeholder={`Todas (${promptCount})`} value={limit} onChange={(e) => setLimit(e.target.value)} className={inputClass} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={simulated} onChange={(e) => setSimulated(e.target.checked)} className="accent-red-600" />
            Simulación (respuestas inventadas, sin costo, para probar)
          </label>

          <div className="rounded-lg bg-black/25 border border-white/[0.06] px-4 py-3 text-sm">
            <p className="text-white">
              <strong className="tabular-nums">{calls}</strong> llamadas <span className="text-zinc-500">= {prompts} preguntas × {usable.length} motores × {runs} repeticiones</span>
            </p>
            {tooMany && <p className="mt-1 text-red-400">Excede el máximo de {maxCalls} por corrida.</p>}
            {!simulated && calls > 0 && !tooMany && (
              <label className="mt-2 flex items-start gap-2 text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 accent-red-600" />
                Entiendo que son llamadas reales con costo en las cuentas de API.
              </label>
            )}
          </div>

          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          <button type="button" onClick={start} disabled={!canRun} className={primaryButton}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Correr estudio
          </button>
        </div>
      )}
    </section>
  );
}
