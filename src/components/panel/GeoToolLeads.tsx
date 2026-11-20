import type { GeoToolLead } from "@/lib/panel/geotool";

/** Quién se registró para usar el N3 GeoTool, y si luego midió su marca. */
export default function GeoToolLeads({ leads }: { leads: GeoToolLead[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Registros del N3 GeoTool</h2>
      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-400">
          Todavía nadie se ha registrado. Aquí aparece cada persona que entra al N3 GeoTool.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="px-4 py-2.5 font-medium">Persona</th>
                <th className="px-4 py-2.5 font-medium">Empresa</th>
                <th className="px-4 py-2.5 font-medium">WhatsApp</th>
                <th className="px-4 py-2.5 font-medium">Midió su marca</th>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const wa = l.whatsapp?.replace(/[^\d]/g, "");
                return (
                  <tr key={l.id} className="border-t border-white/[0.06] align-top">
                    <td className="px-4 py-2.5">
                      <span className="block text-white">{l.name}</span>
                      <a href={`mailto:${l.email}`} className="block text-xs text-zinc-400 hover:text-red-300">
                        {l.email}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-200">{l.company}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {wa ? (
                        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                          {l.whatsapp}
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs">{l.scans > 0 ? <span className="text-emerald-400">Sí · {l.scans}</span> : <span className="text-zinc-500">Todavía no</span>}</td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
