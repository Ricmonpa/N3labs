"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Play } from "lucide-react";
import type { EngineId } from "@/lib/geo-visibility/types.ts";
import { api, inputClass, labelClass, primaryButton } from "./api";

export type EngineStatus = { id: EngineId; label: string; model: string; hasKey: boolean };

/**
 * One-click "measure now" with the engines that have keys; options are tucked away.
 * `ensureStudy` lets the wizard save the study first and run it in the same click.
 */
export default function NewRunForm({
  studyId,
  ensureStudy,
  promptCount,
  defaultRuns,
  engines,
  maxCalls,
  secondary,
}: {
  studyId?: string;
  ensureStudy?: () => Promise<string>;
  promptCount: number;
  defaultRuns: number;
  engines: EngineStatus[];
  maxCalls: number;
  secondary?: React.ReactNode;
}) {
  const router = useRouter();
  const withKey = engines.filter((e) => e.hasKey);
  const [selected, setSelected] = useState<EngineId[]>(withKey.map((e) => e.id));
  const [runs, setRuns] = useState(defaultRuns);
  const [limit, setLimit] = useState("");
  const [simulated, setSimulated] = useState(withKey.length === 0);
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const prompts = limit ? Math.min(Number(limit) || 0, promptCount) : promptCount;
  const usable = selected.filter((id) => simulated || engines.find((e) => e.id === id)?.hasKey);
  const calls = prompts * usable.length * runs;
  const tooMany = calls > maxCalls;
  const names = usable.map((id) => engines.find((e) => e.id === id)!.label).join(", ");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const sid = studyId ?? (await ensureStudy!());
      const { id } = await api<{ id: string }>(`/api/panel/studies/${sid}/runs`, {
        body: { engines: usable, runs, limit: limit ? Number(limit) : null, simulated },
      });
      router.push(`/panel/corridas/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (promptCount === 0) return <p className="text-sm text-zinc-400">Agrega preguntas para poder medir.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={start} disabled={busy || calls === 0 || tooMany} className={`${primaryButton} px-6 py-3 text-base`}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          {simulated ? "Probar en simulación" : "Medir ahora"}
        </button>
        {secondary}
        <button type="button" onClick={() => setShowOptions((v) => !v)} className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
          Opciones <ChevronDown size={14} className={showOptions ? "rotate-180 transition" : "transition"} />
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        {calls > 0 ? (
          <>
            {prompts} preguntas × {runs} repeticiones en {names || "—"} = <strong className="text-zinc-300">{calls} consultas</strong>
            {simulated ? " simuladas, sin costo." : " reales a las APIs."}
          </>
        ) : (
          "Elige al menos un motor en Opciones."
        )}
        {tooMany && <span className="text-red-400"> Excede el máximo de {maxCalls} por corrida.</span>}
        {!simulated && withKey.length < engines.length && (
          <span> Sin llave todavía: {engines.filter((e) => !e.hasKey).map((e) => e.label).join(", ")}.</span>
        )}
      </p>

      {showOptions && (
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 space-y-4">
          <fieldset>
            <legend className={labelClass}>Motores</legend>
            <div className="flex flex-wrap gap-2">
              {engines.map((e) => {
                const disabled = !e.hasKey && !simulated;
                const on = selected.includes(e.id) && !disabled;
                return (
                  <button
                    key={e.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelected((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]))}
                    title={disabled ? "Falta la llave en el servidor" : e.model}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${on ? "border-red-500 bg-red-600/20 text-white" : "border-white/10 text-zinc-400"} disabled:opacity-40`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label htmlFor="run-runs" className={labelClass}>Repeticiones por pregunta</label>
              <input id="run-runs" type="number" min={1} max={10} value={runs} onChange={(e) => setRuns(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="run-limit" className={labelClass}>Probar con N preguntas</label>
              <input id="run-limit" type="number" min={1} max={promptCount} placeholder={`Todas (${promptCount})`} value={limit} onChange={(e) => setLimit(e.target.value)} className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={simulated} onChange={(e) => setSimulated(e.target.checked)} className="accent-red-600" />
            Simulación (respuestas inventadas, sin costo)
          </label>
        </div>
      )}
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
    </div>
  );
}
