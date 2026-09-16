import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Gate from "@/components/panel/Gate";
import RunConsole from "@/components/panel/RunConsole";
import ReportView from "@/components/panel/ReportView";
import AnswersExplorer from "@/components/panel/AnswersExplorer";
import { UUID } from "@/lib/panel/http";
import { getRun, progress } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

async function RunPage({ id }: { id: string }) {
  const run = UUID.test(id) ? await getRun(id) : null;
  if (!run) notFound();
  const { answered, failed, errors } = await progress(id);
  const report = run.report?.responses.ok ? run.report : null;
  const date = new Date(run.created_at).toISOString().slice(0, 10);
  const fileName = `${run.study.name}-${date}`.replace(/[^\p{L}\p{N}-]+/gu, "-");

  return (
    <div className="space-y-5">
      <Link href={`/panel/estudios/${run.study_id}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white print:hidden">
        <ArrowLeft size={14} /> {run.study.name}
      </Link>
      <RunConsole
        key={run.status}
        runId={id}
        studyId={run.study_id}
        initial={{ status: run.status, total: run.total, answered, failed, errors }}
        shareToken={run.share_token}
        report={report}
        fileName={fileName}
      />
      {report ? (
        <ReportView report={report} />
      ) : (
        run.status !== "running" && <p className="text-sm text-zinc-400">Esta corrida no tiene respuestas válidas todavía, así que no hay informe.</p>
      )}
      {answered > 0 && (
        <AnswersExplorer
          runId={id}
          prompts={run.study.prompts}
          brandTerms={[run.study.brand.name, ...(run.study.brand.aliases ?? [])]}
        />
      )}
    </div>
  );
}

export default async function Page({ params }: PageProps<"/panel/corridas/[id]">) {
  const { id } = await params;
  return (
    <Gate>
      <RunPage id={id} />
    </Gate>
  );
}
