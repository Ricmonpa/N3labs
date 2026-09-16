import type { Report, Rate } from "@/lib/geo-visibility/report.ts";
import { ENGINE_LABEL, TYPE_LABEL } from "@/lib/geo-visibility/report.ts";
import { METHOD_NOTES } from "@/lib/geo-visibility/markdown.ts";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const range = (r: Rate) => (r.n ? `${pct(r.low)}–${pct(r.high)}` : "—");

function Section({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-7 break-inside-avoid print:border-zinc-300 print:bg-white">
      {eyebrow && <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-500 mb-1.5">{eyebrow}</p>}
      <h2 className="text-lg sm:text-xl font-bold text-white print:text-black">{title}</h2>
      {intro && <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed max-w-3xl print:text-zinc-600">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Kpi({ label, rate, hint }: { label: string; rate: Rate; hint: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 sm:p-5 print:border-zinc-300 print:bg-white">
      <p className="text-xs font-semibold text-zinc-400 print:text-zinc-600">{label}</p>
      <p className="mt-1 text-4xl sm:text-5xl font-black text-white tabular-nums print:text-black">{rate.n ? pct(rate.rate) : "—"}</p>
      <p className="mt-1.5 text-xs text-zinc-500 tabular-nums">
        {rate.hits} de {rate.n} respuestas · rango probable {range(rate)}
      </p>
      <p className="mt-2 text-xs text-zinc-400 leading-relaxed print:text-zinc-600">{hint}</p>
    </div>
  );
}

/** Horizontal bar with the 95% interval drawn as a thin whisker. */
function RateBar({ label, rate, emphasis = true }: { label: string; rate: Rate; emphasis?: boolean }) {
  const tip = rate.n ? `${label}: ${pct(rate.rate)} (${rate.hits}/${rate.n}), rango probable ${range(rate)}` : `${label}: sin datos`;
  return (
    <div className="grid grid-cols-[7.5rem_1fr_3.5rem] sm:grid-cols-[9rem_1fr_4rem] items-center gap-3 py-1.5 group" title={tip}>
      <span className="text-sm text-zinc-300 truncate print:text-zinc-800">{label}</span>
      <div className="relative h-5 rounded-md bg-white/[0.05] print:bg-zinc-100" role="img" aria-label={tip}>
        {rate.n > 0 && (
          <>
            <div
              className={`absolute inset-y-0 left-0 rounded-md ${emphasis ? "bg-red-600" : "bg-slate-500"} group-hover:brightness-125 transition`}
              style={{ width: `max(${rate.rate * 100}%, ${rate.hits ? "4px" : "0px"})` }}
            />
            <div
              className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-white/50 print:bg-zinc-500"
              style={{ left: `${rate.low * 100}%`, width: `${(rate.high - rate.low) * 100}%` }}
            />
          </>
        )}
      </div>
      <span className="text-sm font-semibold text-white tabular-nums text-right print:text-black">{rate.n ? pct(rate.rate) : "—"}</span>
    </div>
  );
}

function CountBar({ label, value, max, tag }: { label: string; value: number; max: number; tag?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,12rem)_1fr_2.5rem] items-center gap-3 py-1" title={`${label}: ${value} respuestas`}>
      <span className="text-sm text-zinc-300 truncate font-mono print:text-zinc-800">
        {label}
        {tag && <span className="ml-2 font-sans text-[10px] uppercase tracking-wider text-amber-400">{tag}</span>}
      </span>
      <div className="relative h-3.5 rounded bg-white/[0.05] print:bg-zinc-100">
        <div className="absolute inset-y-0 left-0 rounded bg-slate-400" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-sm text-zinc-300 tabular-nums text-right print:text-zinc-800">{value}</span>
    </div>
  );
}

function Legend() {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-4 rounded-sm bg-red-600" /> porcentaje
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-[2px] w-4 bg-white/60 print:bg-zinc-500" /> rango probable (95%)
      </span>
    </p>
  );
}

export default function ReportView({ report, audience = "team" }: { report: Report; audience?: "team" | "client" }) {
  const b = report.brand.name;
  const engines = report.engines.map((e) => e.id);
  const { unbranded, branded } = report.overall;
  const market = [...new Set([report.market.city, report.market.region, report.market.country].filter(Boolean))].join(", ");
  const maxCited = Math.max(1, ...report.citedWhenBrandIsNot.map((d) => d.runs));

  return (
    <div className="space-y-5">
      {report.simulated && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <strong>Simulación.</strong> Estas respuestas son inventadas para probar el flujo. Ningún número describe a un motor real.
        </div>
      )}

      <header className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-red-950/30 to-transparent p-5 sm:p-7 print:border-zinc-300 print:bg-white">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-500">Estudio de visibilidad en IA</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white print:text-black">{b}</h1>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          {[
            ["Sitio", report.brand.domains.join(", ")],
            ["Mercado", `${market} · ${report.market.language}`],
            ["Motores", report.engines.map((e) => ENGINE_LABEL[e.id]).join(", ")],
            ["Muestra", `${report.prompts} preguntas × ${report.runsPerPrompt} · ${report.responses.ok} respuestas`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-zinc-500">{k}</dt>
              <dd className="text-zinc-200 print:text-zinc-800 break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-zinc-500">Generado el {new Date(report.generatedAt).toLocaleDateString("es-MX", { dateStyle: "long" })}</p>
      </header>

      <Section
        eyebrow="La cifra principal"
        title={`¿Las IAs recomiendan a ${b} cuando el cliente no la nombra?`}
        intro="Preguntas como las haría alguien que busca una solución y todavía no conoce la marca. Es lo que mide si las IAs te traen clientes nuevos."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Kpi label="La menciona en su respuesta" rate={unbranded.mention} hint="El nombre de la marca aparece en lo que responde la IA." />
          <Kpi label="Enlaza su sitio como fuente" rate={unbranded.citation} hint="La respuesta incluye un link a un dominio de la marca." />
        </div>
        {engines.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-white mb-2 print:text-black">Menciones por motor</h3>
            {engines.map((e) => (
              <RateBar key={e} label={ENGINE_LABEL[e]} rate={report.byEngine[e].unbranded.mention} />
            ))}
            <Legend />
          </div>
        )}
      </Section>

      {branded.mention.n > 0 && (
        <Section
          title={`¿Qué saben de ${b} cuando preguntan por ella?`}
          intro="Preguntas que ya incluyen el nombre. Mide si la IA reconoce la marca y usa su sitio como fuente; no mide descubrimiento."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-2 pr-3 font-medium">Motor</th>
                  <th className="py-2 pr-3 font-medium">La reconoce</th>
                  <th className="py-2 pr-3 font-medium">Enlaza su sitio</th>
                </tr>
              </thead>
              <tbody>
                {engines.map((e) => {
                  const r = report.byEngine[e].branded;
                  return (
                    <tr key={e} className="border-t border-white/[0.06] print:border-zinc-200">
                      <td className="py-2 pr-3 text-zinc-300 print:text-zinc-800">{ENGINE_LABEL[e]}</td>
                      <td className="py-2 pr-3 tabular-nums text-white print:text-black">
                        {r.mention.n ? pct(r.mention.rate) : "—"} <span className="text-zinc-500">({r.mention.hits}/{r.mention.n})</span>
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-white print:text-black">
                        {r.citation.n ? pct(r.citation.rate) : "—"} <span className="text-zinc-500">({r.citation.hits}/{r.citation.n})</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {report.competitors.length > 0 && (
        <Section title="Frente a la competencia" intro="Qué tanto menciona cada marca la IA en las preguntas sin nombre.">
          {report.shareOfVoice.map((x, i) => (
            <RateBar key={x.name} label={x.name} rate={x.overall} emphasis={i === 0} />
          ))}
          <Legend />
          <p className="mt-3 text-xs text-zinc-500">
            {report.averageBrandRank !== null
              ? `Cuando aparece, ${b} es en promedio la marca #${report.averageBrandRank.toFixed(1).replace(/\.0$/, "")} en ser mencionada.`
              : `${b} no apareció en ninguna respuesta sin su nombre.`}{" "}
            Participación de voz de {b}: {pct(report.shareOfVoice[0]?.share ?? 0)} de todas las menciones.
          </p>
        </Section>
      )}

      {report.citedWhenBrandIsNot.length > 0 && (
        <Section
          eyebrow="Oportunidad"
          title={`Dónde confían las IAs cuando ${b} no aparece`}
          intro="Sitios que las IAs citan en tu categoría. Estar presente ahí (listas, notas, directorios, reseñas) suele pesar más que cambiar tu propio sitio."
        >
          {report.citedWhenBrandIsNot.map((d) => (
            <CountBar key={d.domain} label={d.domain} value={d.runs} max={maxCited} tag={d.competitor ? "competidor" : undefined} />
          ))}
          <p className="mt-3 text-xs text-zinc-500">Número de respuestas que citan cada sitio.</p>
        </Section>
      )}

      <Section title="Resultado por pregunta" intro="Cada celda: veces que la menciona / veces que enlaza su sitio, sobre el total de repeticiones.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="py-2 pr-3 font-medium">Pregunta</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                {engines.map((e) => (
                  <th key={e} className="py-2 pr-3 font-medium whitespace-nowrap">
                    {ENGINE_LABEL[e]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.byPrompt.map((p) => {
                return (
                  <tr key={p.id} className="border-t border-white/[0.06] align-top print:border-zinc-200">
                    <td className="py-2.5 pr-3 text-zinc-300 print:text-zinc-800">{p.text}</td>
                    <td className="py-2.5 pr-3 text-xs text-zinc-500 whitespace-nowrap">{TYPE_LABEL[p.type]}</td>
                    {engines.map((e) => {
                      const c = p.perEngine[e];
                      const hit = c.mention.hits > 0;
                      return (
                        <td key={e} className="py-2.5 pr-3 whitespace-nowrap tabular-nums">
                          <span className={hit ? "text-white font-semibold print:text-black" : "text-zinc-500"}>
                            {c.mention.hits}/{c.mention.n}
                          </span>
                          <span className="text-zinc-600"> · </span>
                          <span className={c.citation.hits ? "text-white print:text-black" : "text-zinc-500"}>
                            {c.citation.hits}/{c.citation.n}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Método y limitaciones">
        <ul className="space-y-2 text-sm text-zinc-400 leading-relaxed list-disc pl-5 print:text-zinc-700">
          <li>Los porcentajes van con su rango probable (intervalo de confianza del 95%): con muestras chicas, el rango importa tanto como el número.</li>
          {METHOD_NOTES.map((n) => (
            <li key={n}>{n}</li>
          ))}
          {audience === "team" && report.responses.failed > 0 && (
            <li className="text-amber-300">{report.responses.failed} llamadas fallaron y no cuentan en los números.</li>
          )}
          {audience === "team" && (
            <li>Modelos: {report.engines.map((e) => `${ENGINE_LABEL[e.id]} (${e.model})`).join(", ")}.</li>
          )}
        </ul>
      </Section>
    </div>
  );
}
