import Link from "next/link";
import type { ScanLead } from "@/lib/panel/scan";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";

const STATUS: Record<string, string> = {
  preparing: "Preparando",
  running: "Midiendo",
  done: "Listo",
  failed: "Falló",
};

/** Quién pidió su diagnóstico: los datos del prospecto, su sitio y su resultado. */
export default function LeadList({ leads }: { leads: ScanLead[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Prospectos</h2>
      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-400">
          Todavía nadie ha pedido su diagnóstico. Aquí aparece cada persona que mide su marca desde el demo o el scan.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="px-4 py-2.5 font-medium">Persona</th>
                <th className="px-4 py-2.5 font-medium">Sitio</th>
                <th className="px-4 py-2.5 font-medium">Pagó</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium text-right">Visibilidad</th>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-white/[0.06] align-top">
                  <td className="px-4 py-2.5">
                    <span className="block text-white">{l.name}</span>
                    <a href={`mailto:${l.email}`} className="block text-xs text-zinc-400 hover:text-red-300">
                      {l.email}
                    </a>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="block font-mono text-[13px] text-zinc-200">{l.domain}</span>
                    <span className="block text-[11px] text-zinc-500">{l.country}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {l.own_keys ? (
                      <span className="text-emerald-400">Su llave</span>
                    ) : (
                      <span className="text-zinc-400">N3</span>
                    )}
                    {l.engines && <span className="block text-[11px] text-zinc-500">{l.engines.map((e) => ENGINE_LABEL[e]).join(", ")}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-300">{STATUS[l.status] ?? l.status}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-white">{l.visibility != null ? `${Math.round(l.visibility * 100)}%` : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" })}
                  </td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                    {l.run_id && (
                      <Link href={`/panel/corridas/${l.run_id}`} className="text-red-400 hover:text-red-300">
                        Ver resultado
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
