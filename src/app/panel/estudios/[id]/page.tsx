import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilLine } from "lucide-react";
import Gate from "@/components/panel/Gate";
import StudyEditor from "@/components/panel/StudyEditor";
import StudySummary from "@/components/panel/StudySummary";
import NewStudyWizard from "@/components/panel/NewStudyWizard";
import NewRunForm from "@/components/panel/NewRunForm";
import { RunList } from "@/components/panel/RunList";
import { engineAvailability } from "@/lib/geo-visibility/engines/index.ts";
import { UUID } from "@/lib/panel/http";
import { getStudy, listRuns, MAX_CALLS_PER_RUN } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

async function StudyPage({ id }: { id: string }) {
  const engines = engineAvailability().map(({ id, label, model, hasKey }) => ({ id, label, model, hasKey }));
  if (id === "nuevo") {
    return (
      <>
        <h1 className="text-2xl font-black text-white mb-5">Nuevo estudio</h1>
        <NewStudyWizard aiAvailable={!!process.env.GEMINI_API_KEY} engines={engines} maxCalls={MAX_CALLS_PER_RUN} />
      </>
    );
  }
  const study = UUID.test(id) ? await getStudy(id) : null;
  if (!study) notFound();
  const runs = await listRuns(id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">{study.data.name}</h1>
      <div className="rounded-2xl border border-red-500/25 bg-red-950/10 p-5 sm:p-6">
        <NewRunForm studyId={id} promptCount={study.data.prompts.length} defaultRuns={study.data.runs} engines={engines} maxCalls={MAX_CALLS_PER_RUN} />
      </div>
      {runs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Mediciones</h2>
          <RunList runs={runs} />
        </section>
      )}
      <StudySummary study={study.data} />
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <PencilLine size={14} /> Editar estudio
        </summary>
        <div className="mt-4">
          <StudyEditor key={study.updated_at} id={id} initial={study.data} />
        </div>
      </details>
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
