import Link from "next/link";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";
import type { RunSummary } from "@/lib/panel/store";

const pct = (x: number) => `${Math.round(x * 100)}%`;

const STATUS: Record<RunSummary["status"], { label: string; className: string }> = {
  running: { label: "En curso", className: "text-sky-300 bg-sky-500/10" },
  done: { label: "Terminada", className: "text-emerald-300 bg-emerald-500/10" },
  cancelled: { label: "Detenida", className: "text-zinc-300 bg-white/5" },
};

export function RunList({ runs, showStudy = false }: { runs: RunSummary[]; showStudy?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-white/[0.02]">
          <tr className="text-left text-xs text-zinc-500">
            <th className="px-4 py-2.5 font-medium">Fecha</th>
            {showStudy && <th className="px-4 py-2.5 font-medium">Estudio</th>}
            <th className="px-4 py-2.5 font-medium">Motores</th>
            <th className="px-4 py-2.5 font-medium">Avance</th>
            <th className="px-4 py-2.5 font-medium">Menciona sin nombre</th>
            <th className="px-4 py-2.5 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-t border-white/[0.06] hover:bg-white/[0.02]">
              <td className="px-4 py-2.5">
                <Link href={`/panel/corridas/${r.id}`} className="text-white hover:text-red-400">
                  {new Date(r.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" })}
                </Link>
                {r.simulated && <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-400">simulación</span>}
              </td>
              {showStudy && <td className="px-4 py-2.5 text-zinc-300">{r.study_name}</td>}
              <td className="px-4 py-2.5 text-zinc-400">{r.engines.map((e) => ENGINE_LABEL[e]).join(", ")}</td>
              <td className="px-4 py-2.5 text-zinc-400 tabular-nums">
                {r.answered}/{r.total}
                {r.failed > 0 && <span className="text-amber-400"> ({r.failed} fallidas)</span>}
              </td>
              <td className="px-4 py-2.5 text-white tabular-nums">{r.headline ? pct(r.headline.mention) : "—"}</td>
              <td className="px-4 py-2.5">
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS[r.status].className}`}>{STATUS[r.status].label}</span>
                {r.share_token && <span className="ml-2 text-xs text-zinc-500">compartida</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
