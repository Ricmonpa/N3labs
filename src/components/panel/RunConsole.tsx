"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Link2, Loader2, Printer, RotateCcw, Square, Trash2 } from "lucide-react";
import { renderMarkdown } from "@/lib/geo-visibility/markdown.ts";
import { ENGINE_LABEL, type Report } from "@/lib/geo-visibility/report.ts";
import type { EngineId } from "@/lib/geo-visibility/types.ts";
import { api, cardClass, secondaryButton } from "./api";

type Status = "running" | "done" | "cancelled";
type RunError = { engine: EngineId; error: string; count: number };
type Progress = { status: Status; total: number; answered: number; failed: number; errors: RunError[] };
type StepResult = Progress & { busy: boolean };

const KEY_NAME: Record<EngineId, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  gemini: "GEMINI_API_KEY",
};

/** Plain-language next step for the most common provider errors. */
function hint(e: RunError) {
  const m = e.error.toLowerCase();
  if (/api key|api_key|401|403|unauthori|permission|invalid.*key|falta la llave/.test(m))
    return `Revisa ${KEY_NAME[e.engine]} en Vercel (Settings → Environment Variables): pega solo la llave, sin comillas ni espacios, y vuelve a desplegar.`;
  if (/429|quota|rate|exhausted|billing|credit|insufficient/.test(m))
    return "La cuenta del proveedor llegó a su límite o no tiene saldo. Revisa su facturación y vuelve a intentar.";
  if (/model|not found|404/.test(m)) return "El modelo configurado no está disponible para esta llave.";
  return "Vuelve a intentar; si se repite, revisa la cuenta del proveedor.";
}

export default function RunConsole({
  runId,
  studyId,
  initial,
  shareToken,
  report,
  fileName,
}: {
  runId: string;
  studyId: string;
  initial: Progress;
  shareToken: string | null;
  report: Report | null;
  fileName: string;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [error, setError] = useState("");
  const [token, setToken] = useState(shareToken);
  const [copied, setCopied] = useState(false);
  const stopped = useRef(false);

  // The server works through the run on its own; this only polls progress (and restarts
  // the server's chain if it ever stopped).
  useEffect(() => {
    if (state.status !== "running") return;
    stopped.current = false;
    let failures = 0;
    (async () => {
      while (!stopped.current) {
        try {
          const r = await api<StepResult>(`/api/panel/runs/${runId}/step`, { body: {} });
          failures = 0;
          setError("");
          setState({ status: r.status, total: r.total, answered: r.answered, failed: r.failed, errors: r.errors });
          if (r.status !== "running") {
            router.refresh();
            return;
          }
          await new Promise((res) => setTimeout(res, 3000));
        } catch {
          failures++;
          // Phones drop requests when the screen locks; the run keeps going on the server.
          if (failures > 2) setError("Sin conexión con el panel; la medición sigue en el servidor. Reintentando…");
          await new Promise((res) => setTimeout(res, Math.min(30_000, 3000 * failures)));
        }
      }
    })();
    return () => {
      stopped.current = true;
    };
    // Restart the loop only when the run goes back to running (e.g. after "retry").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === "running", runId]);

  async function act(action: string) {
    setError("");
    try {
      const r = await api<{ token?: string | null }>(`/api/panel/runs/${runId}`, { body: { action } });
      if (action === "share" || action === "unshare") setToken(r.token ?? null);
      if (action === "retry") setState((s) => ({ ...s, status: "running", answered: s.answered - s.failed, failed: 0, errors: [] }));
      if (action === "cancel") {
        stopped.current = true;
        setState((s) => ({ ...s, status: "cancelled" }));
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove() {
    if (!confirm("¿Borrar esta corrida? No se puede deshacer.")) return;
    stopped.current = true;
    await api(`/api/panel/runs/${runId}`, { method: "DELETE" });
    router.push(`/panel/estudios/${studyId}`);
  }

  function downloadMarkdown() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([renderMarkdown(report)], { type: "text/markdown;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.md` });
    a.click();
    URL.revokeObjectURL(url);
  }

  const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/informe/${token}` : null;
  const pctDone = state.total ? Math.round((state.answered / state.total) * 100) : 0;

  return (
    <section className={`${cardClass} print:hidden`}>
      {state.status === "running" ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-white font-semibold">
              <Loader2 size={16} className="animate-spin text-red-500" /> Corriendo… {state.answered} de {state.total}
            </p>
            <button type="button" onClick={() => act("cancel")} className={secondaryButton}>
              <Square size={13} /> Detener
            </button>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden" role="progressbar" aria-valuenow={pctDone} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-red-600 transition-all" style={{ width: `${pctDone}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Corre en el servidor: puedes cerrar esta página o bloquear el teléfono y volver después.
            {state.failed > 0 && <span className="text-amber-400"> {state.failed} fallidas hasta ahora.</span>}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm text-zinc-300">
            {state.status === "done" ? "Terminada" : "Detenida"} · {state.answered - state.failed} respuestas
            {state.failed > 0 && <span className="text-amber-400"> · {state.failed} fallidas</span>}
          </p>
          {state.failed > 0 && (
            <button type="button" onClick={() => act("retry")} className={secondaryButton}>
              <RotateCcw size={14} /> Reintentar fallidas
            </button>
          )}
          {state.status === "cancelled" && state.failed === 0 && state.answered < state.total && (
            <button type="button" onClick={() => act("retry")} className={secondaryButton}>
              <RotateCcw size={14} /> Continuar
            </button>
          )}
          {report && report.responses.ok > 0 && (
            <>
              <button type="button" onClick={() => window.print()} className={secondaryButton}>
                <Printer size={14} /> PDF
              </button>
              <button type="button" onClick={downloadMarkdown} className={secondaryButton}>
                <Download size={14} /> Markdown
              </button>
              <button type="button" onClick={() => act(token ? "unshare" : "share")} className={secondaryButton}>
                <Link2 size={14} /> {token ? "Desactivar link" : "Link para el cliente"}
              </button>
            </>
          )}
          <button type="button" onClick={remove} className="p-2 text-zinc-500 hover:text-red-400" aria-label="Borrar corrida">
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {state.errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm" role="alert">
          <p className="font-semibold text-amber-200">
            {state.answered === state.failed ? "Ninguna pregunta se pudo contestar." : `${state.failed} preguntas no se pudieron contestar.`}
            {state.status === "cancelled" && state.answered === state.failed && " La corrida se detuvo para no seguir fallando."}
          </p>
          <ul className="mt-2 space-y-2">
            {state.errors.map((e) => (
              <li key={e.engine + e.error}>
                <p className="text-zinc-200">
                  <strong>{ENGINE_LABEL[e.engine]}</strong> ({e.count}): <span className="font-mono text-xs text-zinc-400 break-all">{e.error}</span>
                </p>
                <p className="text-zinc-400">{hint(e)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-zinc-500 text-xs">Cuando lo corrijas, usa “Reintentar fallidas”.</p>
        </div>
      )}

      {shareUrl && report && state.status !== "running" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
          <span className="text-xs text-emerald-300">Link privado del cliente:</span>
          <code className="flex-1 min-w-0 truncate text-xs text-zinc-200">{shareUrl}</code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={secondaryButton}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
    </section>
  );
}
