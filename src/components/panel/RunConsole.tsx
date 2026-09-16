"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Link2, Loader2, Printer, RotateCcw, Square, Trash2 } from "lucide-react";
import { renderMarkdown } from "@/lib/geo-visibility/markdown.ts";
import type { Report } from "@/lib/geo-visibility/report.ts";
import { api, cardClass, secondaryButton } from "./api";

type Status = "running" | "done" | "cancelled";
type StepResult = { busy: boolean; status: Status; total: number; answered: number; failed: number };

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
  initial: { status: Status; total: number; answered: number; failed: number };
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

  // Drive the run from the browser: each call to /step answers one batch on the server.
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
          setState({ status: r.status, total: r.total, answered: r.answered, failed: r.failed });
          if (r.status !== "running") {
            router.refresh();
            return;
          }
          // Another tab holds the run; check back shortly.
          if (r.busy) await new Promise((res) => setTimeout(res, 5000));
        } catch (err) {
          failures++;
          setError(`${(err as Error).message} Reintentando…`);
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
      if (action === "retry") setState((s) => ({ ...s, status: "running", answered: s.answered - s.failed, failed: 0 }));
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
            Mantén esta página abierta mientras corre. Si la cierras, se pausa y continúa al volver a abrirla.
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
          {state.status === "cancelled" && state.answered < state.total && (
            <button type="button" onClick={() => act("retry")} className={secondaryButton}>
              <RotateCcw size={14} /> Continuar
            </button>
          )}
          {report && (
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

      {shareUrl && state.status !== "running" && (
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
