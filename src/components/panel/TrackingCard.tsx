"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2 } from "lucide-react";
import type { EngineId } from "@/lib/geo-visibility/types.ts";
import { api, cardClass, inputClass, labelClass, primaryButton, secondaryButton } from "./api";

type Every = "weekly" | "monthly";
export type TrackingValue = { every: Every; engines: EngineId[]; runs: number } | null;
export type TrackingEngine = { id: EngineId; label: string; clientKey: boolean; serverKey: boolean };

const EVERY: Record<Every, string> = { weekly: "Cada semana", monthly: "Cada mes" };

/** Prende el seguimiento automático: el estudio se vuelve a medir solo y arma la tendencia. */
export default function TrackingCard({
  studyId,
  initial,
  engines,
  promptCount,
  maxCalls,
  lastRun,
}: {
  studyId: string;
  initial: TrackingValue;
  engines: TrackingEngine[];
  promptCount: number;
  maxCalls: number;
  lastRun: string | null;
}) {
  const router = useRouter();
  const usable = engines.filter((e) => e.clientKey || e.serverKey);
  const [every, setEvery] = useState<Every>(initial?.every ?? "weekly");
  const [selected, setSelected] = useState<EngineId[]>(initial?.engines ?? usable.map((e) => e.id));
  const [runs, setRuns] = useState(initial?.runs ?? 3);
  const [editing, setEditing] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const chosen = usable.filter((e) => selected.includes(e.id));
  const calls = promptCount * chosen.length * runs;
  const paidByN3 = chosen.filter((e) => !e.clientKey);
  const days = every === "weekly" ? 7 : 30;
  const next = initial && lastRun ? new Date(new Date(lastRun).getTime() + (initial.every === "weekly" ? 7 : 30) * 86_400_000) : null;

  async function save(off = false) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/panel/studies/${studyId}/tracking`, { method: "PUT", body: off ? { every: null } : { every, engines: chosen.map((e) => e.id), runs } });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="flex items-start gap-3">
        <CalendarClock size={18} className="mt-0.5 text-red-500 shrink-0" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-white">Seguimiento automático</h2>
          {initial && !editing ? (
            <>
              <p className="mt-1 text-sm text-zinc-300">
                <span className="font-semibold text-emerald-400">Activo</span> · {EVERY[initial.every].toLowerCase()} en{" "}
                {initial.engines.map((id) => engines.find((e) => e.id === id)?.label ?? id).join(", ")} · {initial.runs} repeticiones
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {next ? `Próxima medición: a partir del ${next.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}` : "La primera medición sale en la próxima revisión diaria"}
                {" · "}se revisa una vez al día, a las 6:00 de la mañana (hora del centro de México).
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setEditing(true)} className={secondaryButton}>
                  Cambiar
                </button>
                <button type="button" disabled={busy} onClick={() => save(true)} className={secondaryButton}>
                  Apagar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                El estudio se vuelve a medir solo y la gráfica de tendencia se llena con cada medición. Así el cliente ve si sube o baja, y si el cambio es real o cabe en el margen.
              </p>
              {usable.length === 0 ? (
                <p className="mt-3 text-sm text-amber-300">Pon al menos una llave (del cliente o de N3) para poder medir.</p>
              ) : (
                <div className="mt-4 grid sm:grid-cols-[auto_1fr_auto] gap-4 items-end">
                  <div>
                    <span className={labelClass}>Cada cuánto</span>
                    <div className="flex gap-1.5">
                      {(Object.keys(EVERY) as Every[]).map((k) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={every === k}
                          onClick={() => setEvery(k)}
                          className={`rounded-lg border px-3 py-2 text-sm ${every === k ? "border-red-500/60 bg-red-500/15 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}
                        >
                          {EVERY[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>Motores</span>
                    <div className="flex flex-wrap gap-1.5">
                      {usable.map((e) => (
                        <label key={e.id} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected.includes(e.id)}
                            onChange={(ev) => setSelected((s) => (ev.target.checked ? [...s, e.id] : s.filter((x) => x !== e.id)))}
                            className="accent-red-600"
                          />
                          {e.label}
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{e.clientKey ? "cliente" : "N3"}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="tracking-runs" className={labelClass}>
                      Repeticiones
                    </label>
                    <input id="tracking-runs" type="number" min={1} max={10} value={runs} onChange={(ev) => setRuns(Number(ev.target.value) || 1)} className={`${inputClass} w-20`} />
                  </div>
                </div>
              )}
              {usable.length > 0 && (
                <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
                  {calls.toLocaleString("es-MX")} respuestas cada {days === 7 ? "semana" : "mes"} ({promptCount} preguntas × {chosen.length} motores × {runs}).{" "}
                  {paidByN3.length
                    ? `Las de ${paidByN3.map((e) => e.label).join(", ")} se cobran a la cuenta de N3.`
                    : "Todas se cobran a la cuenta del cliente."}
                  {calls > maxCalls && <span className="text-red-400"> Pasa del límite de {maxCalls} por medición.</span>}
                </p>
              )}
              {usable.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <button type="button" disabled={busy || !chosen.length || calls > maxCalls} onClick={() => save()} className={primaryButton}>
                    {busy && <Loader2 size={14} className="animate-spin" />} {initial ? "Guardar cambios" : "Activar seguimiento"}
                  </button>
                  {initial && (
                    <button type="button" onClick={() => setEditing(false)} className={secondaryButton}>
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </section>
  );
}
