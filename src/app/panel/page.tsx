import Link from "next/link";
import { Plus } from "lucide-react";
import Gate from "@/components/panel/Gate";
import { RunList } from "@/components/panel/RunList";
import { listRuns, listStudies } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

async function Dashboard() {
  const [studies, runs] = await Promise.all([listStudies(), listRuns(undefined, 10)]);
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
              <Link key={s.id} href={`/panel/estudios/${s.id}`} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-red-500/40 transition-colors">
                <p className="font-bold text-white">{s.data.name}</p>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">{s.data.brand.domains.join(", ")}</p>
                <p className="text-xs text-zinc-400 mt-3">
                  {s.data.prompts.length} preguntas · {s.data.competitors.length} competidores · {s.runs_count} corridas
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

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
