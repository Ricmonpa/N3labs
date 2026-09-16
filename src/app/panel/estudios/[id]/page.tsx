import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Gate from "@/components/panel/Gate";
import StudyEditor, { EMPTY_STUDY } from "@/components/panel/StudyEditor";
import NewRunForm from "@/components/panel/NewRunForm";
import { RunList } from "@/components/panel/RunList";
import { engineAvailability } from "@/lib/geo-visibility/engines/index.ts";
import { UUID } from "@/lib/panel/http";
import { getStudy, listRuns, MAX_CALLS_PER_RUN } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

async function StudyPage({ id }: { id: string }) {
  if (id === "nuevo") {
    return (
      <>
        <h1 className="text-2xl font-black text-white mb-5">Nuevo estudio</h1>
        <StudyEditor id={null} initial={EMPTY_STUDY} />
      </>
    );
  }
  const study = UUID.test(id) ? await getStudy(id) : null;
  if (!study) notFound();
  const runs = await listRuns(id);
  const engines = engineAvailability().map(({ id, label, model, hasKey }) => ({ id, label, model, hasKey }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-white">{study.data.name}</h1>
      <NewRunForm studyId={id} promptCount={study.data.prompts.length} defaultRuns={study.data.runs} engines={engines} maxCalls={MAX_CALLS_PER_RUN} />
      {runs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Corridas</h2>
          <RunList runs={runs} />
        </section>
      )}
      <section>
        <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Configuración del estudio</h2>
        <StudyEditor key={study.updated_at} id={id} initial={study.data} />
      </section>
    </div>
  );
}

export default async function Page({ params }: PageProps<"/panel/estudios/[id]">) {
  const { id } = await params;
  return (
    <Gate>
      <Link href="/panel" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4">
        <ArrowLeft size={14} /> Estudios
      </Link>
      <StudyPage id={id} />
    </Gate>
  );
}
