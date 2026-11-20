import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DemoShell, { DemoBadge, DemoCta } from "@/components/demo/DemoShell";
import BrandSearch from "@/components/demo/BrandSearch";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";
import { demoIndustries, demoReport, slugOf } from "@/lib/demo";
import { pct, range } from "@/components/panel/report-ui";

const TITLE = "N3 GeoTool: ¿a qué marcas recomiendan las IAs en México?";
const DESCRIPTION =
  "Medición real de qué marcas de autos, bancos, seguros, tiendas y telefonía recomiendan las IAs en México, con su muestra y rango probable.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/demo-geo" },
  robots: { index: false, follow: true },
  openGraph: { type: "website", siteName: "N3 Thinktech · IA Laboratory", locale: "es_MX", url: "/demo-geo", title: TITLE, description: DESCRIPTION },
};

export const dynamic = "force-static";

/** Las tarjetas de ranking por industria distraen de lo principal; se guardan apagadas hasta decidir dónde van. */
const SHOW_INDUSTRY_RANKINGS = false;

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const longDate =(iso: string) => new Date(iso).toLocaleDateString("es-MX", { dateStyle: "long" });

export default function DemoIndex() {
  const industries = demoIndustries().flatMap((industry) => {
    const first = industry.brands[0];
    const data = first ? demoReport(industry.id, slugOf(first.name)) : null;
    return data ? [{ industry, report: data.report }] : [];
  });

  return (
    <DemoShell>
      <DemoBadge />
      <h1 className="mt-5 text-[clamp(2rem,5vw,3.2rem)] font-black text-white leading-tight">
        ¿A qué marcas recomiendan las IAs en México?
      </h1>
      <p className="mt-4 max-w-2xl text-zinc-400 leading-relaxed">
        Le preguntamos a la IA lo que preguntaría un cliente que todavía no ha elegido marca, y medimos a quién recomienda.
        Busca tu marca o mídela con tu propia llave de API.
      </p>

      {industries.length > 0 && (
        <BrandSearch
          brands={industries.flatMap(({ industry, report }) =>
            report.shareOfVoice.map((r) => {
              const ent = industry.brands.find((b) => b.name === r.name)!;
              return {
                name: r.name,
                terms: [r.name, ...(ent.aliases ?? []), ...ent.domains].map((t) => norm(t)),
                industry: industry.id,
                industryLabel: industry.label,
                href: `/demo-geo/${industry.id}/${slugOf(r.name)}`,
                visibility: pct(r.overall.rate),
              };
            }),
          )}
        />
      )}

      {/* Rankings por industria: guardados, no se muestran hasta decidir dónde van (SHOW_INDUSTRY_RANKINGS). */}
      {SHOW_INDUSTRY_RANKINGS && industries.length > 0 && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {industries.map(({ industry, report }) => {
            const ranking = [...report.shareOfVoice].sort((a, b) => b.overall.rate - a.overall.rate);
            const max = Math.max(0.01, ...ranking.map((r) => r.overall.high));
            return (
              <section key={industry.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-bold text-white">{industry.label}</h2>
                  <Link href={`/demo-geo/${industry.id}/${slugOf(ranking[0].name)}`} className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 whitespace-nowrap">
                    Informe completo <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{industry.about}</p>
                <ol className="mt-4 space-y-1">
                  {ranking.map((r, i) => (
                    <li key={r.name}>
                      <Link
                        href={`/demo-geo/${industry.id}/${slugOf(r.name)}`}
                        className="grid grid-cols-[1.25rem_minmax(0,7.5rem)_1fr_3rem] items-center gap-2 rounded-md px-1 py-1 hover:bg-white/[0.04]"
                        title={`${r.name}: aparece en ${pct(r.overall.rate)} de las respuestas (${r.overall.hits} de ${r.overall.n}), rango probable ${range(r.overall)}`}
                      >
                        <span className="text-xs text-zinc-600 tabular-nums">{i + 1}</span>
                        <span className={`text-sm truncate ${i === 0 ? "font-semibold text-white" : "text-zinc-300"}`}>{r.name}</span>
                        <span className="relative h-3 rounded bg-white/[0.05]">
                          <span
                            className={`absolute inset-y-0 left-0 rounded ${i === 0 ? "bg-red-600" : "bg-slate-500"}`}
                            style={{ width: `max(${(r.overall.rate / max) * 100}%, ${r.overall.hits ? "3px" : "0px"})` }}
                          />
                          <span
                            className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-white/40"
                            style={{ left: `${(r.overall.low / max) * 100}%`, width: `${((r.overall.high - r.overall.low) / max) * 100}%` }}
                          />
                        </span>
                        <span className="text-sm text-white tabular-nums text-right">{pct(r.overall.rate)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
                  Visibilidad: respuestas que mencionan la marca · {report.shareOfVoice[0]?.overall.n ?? 0} respuestas de{" "}
                  {report.engines.map((e) => ENGINE_LABEL[e.id]).join(", ")} · {longDate(industry.measuredAt)}. La línea blanca es el rango
                  probable.
                </p>
              </section>
            );
          })}
        </div>
      )}

      {SHOW_INDUSTRY_RANKINGS && (
        <>
          <p className="mt-6 text-xs text-zinc-500 leading-relaxed max-w-3xl">
            Medición independiente de N3 Thinktech. Ninguna de estas marcas la pidió ni la pagó, y N3 no tiene relación con
            ellas. Las respuestas de las IAs cambian con el tiempo: cada cifra vale para su fecha y su muestra.
          </p>
          <DemoCta />
        </>
      )}
    </DemoShell>
  );
}
