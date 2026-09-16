import { ENGINE_LABEL, TYPE_LABEL, pct, type Report } from "./report.ts";

/** The report as Markdown, for files and quick sharing. */
export function renderMarkdown(report: Report): string {
  const md: string[] = [];
  const head = (cols: string[]) => [`| ${cols.join(" | ")} |`, `|${cols.map(() => "---").join("|")}|`];
  const b = report.brand.name;
  const engines = report.engines.map((e) => e.id);
  const { byEngine, overall, market } = report;

  md.push(`# Visibilidad en IA · ${report.study}`, "");
  if (report.simulated) {
    md.push(
      "> ⚠️ **SIMULACIÓN.** Estas respuestas son inventadas para probar el flujo. Ningún número de este informe describe a un motor real.",
      "",
    );
  }
  md.push(
    `**Marca:** ${b} (${report.brand.domains.join(", ")})  `,
    `**Mercado:** ${[...new Set([market.city, market.region, market.country].filter(Boolean))].join(", ")} · ${market.language}  `,
    `**Motores:** ${report.engines.map((e) => `${ENGINE_LABEL[e.id]} (${e.model})`).join(" · ")}  `,
    `**Muestra:** ${report.prompts} preguntas × ${report.runsPerPrompt} repeticiones · ${report.responses.ok} respuestas válidas${report.responses.failed ? `, ${report.responses.failed} fallidas` : ""}  `,
    `**Fecha:** ${report.generatedAt.slice(0, 10)}`,
    "",
    "Los porcentajes llevan entre paréntesis el intervalo de confianza del 95%: con muestras chicas, el rango importa tanto como el número.",
    "",
    `## ¿Las IAs recomiendan a ${b} cuando no la nombran?`,
    "",
    `Preguntas donde el usuario busca una solución sin decir el nombre de la marca (categoría, problema, comparación). **Esta es la cifra que mide si una IA te hace llegar clientes nuevos.**`,
    "",
    ...head(["Motor", "Menciona la marca", "Cita el sitio (link)", "Sitio entre las fuentes", "Respuestas"]),
    ...engines.map((e) => {
      const r = byEngine[e].unbranded;
      return `| ${ENGINE_LABEL[e]} | ${pct(r.mention)} | ${pct(r.citation)} | ${pct(r.source)} | ${r.mention.n} |`;
    }),
    `| **Total** | **${pct(overall.unbranded.mention)}** | **${pct(overall.unbranded.citation)}** | **${pct(overall.unbranded.source)}** | **${overall.unbranded.mention.n}** |`,
    "",
    "- **Menciona:** el nombre de la marca aparece en la respuesta.",
    "- **Cita:** la respuesta enlaza a un dominio de la marca.",
    "- **Fuentes:** el motor reporta haber consultado el sitio, aunque no lo enlace. Gemini solo expone lo que cita.",
    "",
  );
  if (overall.branded.mention.n) {
    md.push(
      `## ¿Qué saben de ${b} cuando preguntan por ella?`,
      "",
      "Preguntas que ya incluyen el nombre. Mide si la IA reconoce la marca y la describe con tu sitio como fuente; no mide descubrimiento.",
      "",
      ...head(["Motor", "Menciona la marca", "Cita el sitio (link)", "Respuestas"]),
      ...engines.map((e) => {
        const r = byEngine[e].branded;
        return `| ${ENGINE_LABEL[e]} | ${pct(r.mention)} | ${pct(r.citation)} | ${r.mention.n} |`;
      }),
      "",
    );
  }

  if (report.competitors.length) {
    md.push(
      "## Participación frente a la competencia",
      "",
      "Solo preguntas que no nombran a la marca.",
      "",
      ...head(["Marca", ...engines.map((e) => ENGINE_LABEL[e]), "Participación de voz"]),
      ...report.shareOfVoice.map(
        (x, i) =>
          `| ${i === 0 ? `**${x.name}**` : x.name} | ${engines.map((e) => pct(x.perEngine[e])).join(" | ")} | ${Math.round(x.share * 100)}% |`,
      ),
      "",
      report.averageBrandRank !== null
        ? `Cuando aparece, ${b} es en promedio la marca **#${report.averageBrandRank.toFixed(1).replace(/\.0$/, "")}** en ser mencionada.`
        : `${b} no apareció en ninguna respuesta sin su nombre.`,
      "",
    );
  }

  const cell = (r: { mention: { hits: number; n: number }; citation: { hits: number; n: number } }) =>
    `${r.mention.hits}/${r.mention.n} · ${r.citation.hits}/${r.citation.n}`;
  md.push(
    "## Por tipo de pregunta",
    "",
    ...head(["Tipo", ...engines.map((e) => `${ENGINE_LABEL[e]} (menciona / cita)`)]),
    ...report.byType.map((t) => `| ${TYPE_LABEL[t.type]} | ${engines.map((e) => cell(t.perEngine[e])).join(" | ")} |`),
    "",
    "## Por pregunta",
    "",
    ...head(["#", "Pregunta", ...engines.map((e) => ENGINE_LABEL[e])]),
    ...report.byPrompt.map((p) => `| ${p.id} | ${p.text.replace(/\|/g, "\\|")} | ${engines.map((e) => cell(p.perEngine[e])).join(" | ")} |`),
    "",
    "_Cada celda: veces que menciona / total · veces que cita / total._",
    "",
    `## Fuentes que citan cuando ${b} no aparece`,
    "",
    "Solo preguntas que no nombran a la marca. Estas son las páginas en las que el motor ya confía para tu categoría. Conseguir presencia ahí suele pesar más que cambiar tu propio sitio.",
    "",
    ...head(["Dominio", "Respuestas", "Motores", ""]),
    ...report.citedWhenBrandIsNot.map((d) => `| ${d.domain} | ${d.runs} | ${d.engines.join(", ")} | ${d.competitor ? "competidor" : ""} |`),
    "",
    "## Método y limitaciones",
    "",
    ...METHOD_NOTES.map((n) => `- ${n}`),
  );
  if (report.knownCostUsd !== null) md.push(`- Costo reportado por los proveedores que lo informan: US$${report.knownCostUsd.toFixed(2)}.`);
  if (report.failures.length) {
    md.push("", "## Llamadas fallidas", "", ...report.failures.map((f) => `- \`${f.key}\`: ${f.error}`));
  }
  return md.join("\n") + "\n";
}

export const METHOD_NOTES = [
  "Cada pregunta se envió tal cual, sin instrucciones adicionales, con la búsqueda web del motor activada y, donde el API lo permite, la ubicación del mercado.",
  "Se usan las APIs de cada proveedor. La app que ve el usuario puede responder distinto: personaliza, usa memoria y cambia de modelo.",
  "Las respuestas cambian entre corridas; por eso se repite cada pregunta y se reportan rangos.",
  "Google AI Overviews / AI Mode y Copilot no tienen API para esto y no están incluidos.",
  "La detección de menciones busca el nombre y los alias exactos, sin distinguir mayúsculas ni acentos. Cada respuesta cruda queda guardada para auditar cualquier número.",
];
