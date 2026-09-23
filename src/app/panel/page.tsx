import Link from "next/link";
import { Plus } from "lucide-react";
import Gate from "@/components/panel/Gate";
import { RunList } from "@/components/panel/RunList";
import DeleteStudyButton from "@/components/panel/DeleteStudyButton";
import InviteLinks from "@/components/panel/InviteLinks";
import { listInvites } from "@/lib/panel/invites";
import { listRuns, listStudies } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

async function Dashboard() {
  const [studies, runs, invites] = await Promise.all([listStudies(), listRuns(undefined, 10), listInvites()]);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Estudios de visibilidad en IA</h1>
          <p className="text-sm text-zinc-400 mt-1">Pregunta a ChatGPT, Claude, Perplexity y Gemini como lo haría un cliente, y mide si recomiendan la marca.</p>
        </div>
        <Link href="/panel/estudios/nuevo" className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-4 py-2">
          <Plus size={16} /> Nuevo estudio
        </Link>
      </div>

      <section>
        <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Clientes</h2>
        {studies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-white font-semibold">Todavía no hay estudios</p>
            <p className="text-sm text-zinc-400 mt-1">Crea uno con la marca, su sitio, sus competidores y las preguntas que haría un cliente.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {studies.map((s) => (
              <div key={s.id} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-red-500/40 transition-colors">
                <Link href={`/panel/estudios/${s.id}`} className="block p-5 pr-14">
                  <p className="font-bold text-white">{s.data.name}</p>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">{s.data.brand.domains.join(", ")}</p>
                  <p className="text-xs text-zinc-400 mt-3">
                    {s.data.prompts.length} preguntas · {s.data.competitors.length} competidores ·{" "}
                    {s.runs_count === 1 ? "1 medición" : `${s.runs_count} mediciones`}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Creado por {s.created_by} · {new Date(s.created_at).toLocaleDateString("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" })}
                  </p>
                </Link>
                <div className="absolute right-3 top-3">
                  <DeleteStudyButton id={s.id} name={s.data.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <InviteLinks invites={invites} />

      {runs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Corridas recientes</h2>
          <RunList runs={runs} showStudy />
        </section>
      )}
    </div>
  );
}

export default function PanelHome() {
  return (
    <Gate>
      <Dashboard />
    </Gate>
  );
}
