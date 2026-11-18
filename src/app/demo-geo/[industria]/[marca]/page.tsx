import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DemoShell, { DemoBadge, DemoCta } from "@/components/demo/DemoShell";
import ReportView from "@/components/panel/ReportView";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";
import { demoIndustries, demoReport, slugOf } from "@/lib/demo";
import { pct } from "@/components/panel/report-ui";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return demoIndustries().flatMap((i) => i.brands.map((b) => ({ industria: i.id, marca: slugOf(b.name) })));
}

export async function generateMetadata({ params }: PageProps<"/demo-geo/[industria]/[marca]">): Promise<Metadata> {
  const { industria, marca } = await params;
  const data = demoReport(industria, marca);
  const industry = demoIndustries().find((i) => i.id === industria);
  if (!data || !industry) return {};
  const title = `${data.study.brand.name} en las respuestas de IA · ${industry.label} en México · Demo N3`;
  return {
    title,
    description: `Qué tan seguido recomiendan ChatGPT, Gemini, Claude o Perplexity a ${data.study.brand.name} frente a su competencia. Medición real con muestra y rango probable.`,
    alternates: { canonical: `/demo-geo/${industria}/${marca}` },
    robots: { index: false, follow: true },
  };
}

const longDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { dateStyle: "long" });

export default async function DemoReport({ params }: PageProps<"/demo-geo/[industria]/[marca]">) {
  const { industria, marca } = await params;
  const industries = demoIndustries();
  const industry = industries.find((i) => i.id === industria);
  const data = demoReport(industria, marca);
  if (!industry || !data) notFound();
  const { report } = data;
  const ranking = [...report.shareOfVoice].sort((a, b) => b.overall.rate - a.overall.rate);
  const engines = report.engines.map((e) => ENGINE_LABEL[e.id]).join(", ");

  return (
    <DemoShell>
      <DemoBadge />
      <h1 className="mt-5 text-[clamp(1.8rem,4.5vw,2.8rem)] font-black text-white leading-tight">
        Así ven las IAs a las marcas de {industry.label.toLowerCase()} en México
      </h1>
      <p className="mt-3 max-w-3xl text-sm text-zinc-400 leading-relaxed">
        {industry.about} Este informe está armado desde el lado de <strong className="text-white">{report.brand.name}</strong>:
        elige otra marca para verlo como si fuera la tuya.
      </p>

      <nav aria-label="Industrias" className="mt-6 flex flex-wrap gap-2">
        {industries.map((i) => (
          <Link
            key={i.id}
            href={`/demo-geo/${i.id}/${slugOf(i.brands[0].name)}`}
            aria-current={i.id === industry.id ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm border transition-colors ${
              i.id === industry.id ? "border-red-500/60 bg-red-500/15 text-white" : "border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {i.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4">
        <p className="text-xs text-zinc-500 mb-2">Ver como:</p>
        <div className="flex flex-wrap gap-2">
          {ranking.map((r) => {
            const slug = slugOf(r.name);
            const active = slug === marca;
            return (
              <Link
                key={r.name}
                href={`/demo-geo/${industry.id}/${slug}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                  active ? "border-red-500/60 bg-red-500/15 text-white" : "border-white/10 text-zinc-300 hover:border-white/25"
                }`}
              >
                {r.name}
                <span className={`text-xs tabular-nums ${active ? "text-red-200" : "text-zinc-500"}`}>{pct(r.overall.rate)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-zinc-400 leading-relaxed">
        Medición independiente de N3 hecha el {longDate(industry.measuredAt)} con {engines}: {report.prompts} preguntas sin nombrar
        ninguna marca, {report.runsPerPrompt} veces cada una ({report.responses.ok} respuestas). Ninguna marca la pidió ni la pagó, y N3
        no tiene relación con ellas.
        {report.sources.withCitations.hits === 0 && report.fanout.total === 0 && (
          <span className="mt-2 block text-amber-300">
            Dato de esta industria: {engines} contestó las {report.responses.ok} preguntas de memoria, sin buscar en la web ni citar
            fuentes. Por eso no hay secciones de búsquedas ni de fuentes: lo que dice sale de lo que aprendió al entrenarse.
          </span>
        )}
      </p>

      <div className="mt-6">
        <ReportView report={report} audience="client" />
      </div>

      <DemoCta />
    </DemoShell>
  );
}
