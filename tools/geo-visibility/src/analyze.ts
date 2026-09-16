import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { firstMention, citesEntity, hostOf, hostMatches, wilson } from "./match.ts";
import type { EngineId, Entity, PromptType, RunRecord, Study } from "./types.ts";

type Rate = { hits: number; n: number; rate: number; low: number; high: number };

const ENGINE_LABEL: Record<EngineId, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
};

const TYPE_LABEL: Record<PromptType, string> = {
  category: "Categoría",
  problem: "Problema",
  comparison: "Comparación",
  brand: "Marca",
};

function rate(hits: number, n: number): Rate {
  return { hits, n, ...wilson(hits, n) };
}

function pct(r: Rate): string {
  if (!r.n) return "—";
  const p = (x: number) => `${Math.round(x * 100)}%`;
  return `${p(r.rate)} (${p(r.low)}–${p(r.high)})`;
}

type Scored = {
  rec: RunRecord;
  mentioned: boolean[];
  cited: boolean[];
  sourced: boolean[];
  /** 1-based rank of the brand among mentioned entities, by order of first mention. */
  brandRank: number | null;
};

function score(rec: RunRecord, entities: Entity[]): Scored {
  const a = rec.answer!;
  const positions = entities.map((e) => firstMention(a.text, e));
  const mentioned = positions.map((p) => p >= 0);
  const order = positions
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p >= 0)
    .sort((x, y) => x.p - y.p);
  const rankIdx = order.findIndex((x) => x.i === 0);
  return {
    rec,
    mentioned,
    cited: entities.map((e) => citesEntity(a.citations, e)),
    sourced: entities.map((e) => citesEntity(a.sources, e)),
    brandRank: rankIdx >= 0 ? rankIdx + 1 : null,
  };
}

/** Keeps the latest successful attempt per key; failures only count if the key never succeeded. */
function latestRecords(lines: RunRecord[]): { ok: RunRecord[]; failed: RunRecord[] } {
  const ok = new Map<string, RunRecord>();
  const failed = new Map<string, RunRecord>();
  for (const r of lines) {
    if (r.ok) ok.set(r.key, r);
    else failed.set(r.key, r);
  }
  for (const k of ok.keys()) failed.delete(k);
  return { ok: [...ok.values()], failed: [...failed.values()] };
}

export async function analyzeDir(dir: string) {
  const study = JSON.parse(await readFile(path.join(dir, "study.json"), "utf8")) as Study;
  const lines = (await readFile(path.join(dir, "responses.jsonl"), "utf8"))
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as RunRecord);
  const { ok, failed } = latestRecords(lines);
  const simulated = lines.some((l) => l.simulated);
  const entities = [study.brand, ...study.competitors];
  const scored = ok.map((r) => score(r, entities));
  const engines = [...new Set(ok.map((r) => r.engine))] as EngineId[];
  const models = Object.fromEntries(
    engines.map((e) => [e, [...new Set(ok.filter((r) => r.engine === e).map((r) => r.answer!.model))].join(", ")]),
  );

  const summarize = (rows: Scored[], i = 0) => ({
    mention: rate(rows.filter((s) => s.mentioned[i]).length, rows.length),
    citation: rate(rows.filter((s) => s.cited[i]).length, rows.length),
    source: rate(rows.filter((s) => s.sourced[i]).length, rows.length),
  });

  const byEngine = Object.fromEntries(engines.map((e) => [e, summarize(scored.filter((s) => s.rec.engine === e))]));
  const overall = summarize(scored);

  const shareOfVoice = entities.map((ent, i) => {
    const perEngine = Object.fromEntries(
      engines.map((e) => [e, rate(scored.filter((s) => s.rec.engine === e && s.mentioned[i]).length, scored.filter((s) => s.rec.engine === e).length)]),
    );
    const mentions = scored.filter((s) => s.mentioned[i]).length;
    return { name: ent.name, perEngine, mentions };
  });
  const totalMentions = shareOfVoice.reduce((n, x) => n + x.mentions, 0);

  const ranks = scored.map((s) => s.brandRank).filter((r): r is number => r !== null);
  const avgRank = ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : null;

  const types = [...new Set(study.prompts.map((p) => p.type))];
  const byType = types.map((t) => ({
    type: t,
    perEngine: Object.fromEntries(engines.map((e) => [e, summarize(scored.filter((s) => s.rec.engine === e && s.rec.promptType === t))])),
  }));

  const byPrompt = study.prompts.map((p) => ({
    id: p.id,
    text: p.text,
    perEngine: Object.fromEntries(engines.map((e) => [e, summarize(scored.filter((s) => s.rec.engine === e && s.rec.promptId === p.id))])),
  }));

  const knownDomains = entities.flatMap((e) => e.domains);
  const countDomains = (rows: Scored[]) => {
    const map = new Map<string, { runs: number; engines: Set<string>; competitor: boolean }>();
    for (const s of rows) {
      const hosts = new Set(s.rec.answer!.citations.map((c) => hostOf(c.url)).filter((h): h is string => !!h));
      for (const h of hosts) {
        if (hostMatches(h, study.brand.domains)) continue;
        const row = map.get(h) ?? { runs: 0, engines: new Set<string>(), competitor: hostMatches(h, knownDomains) };
        row.runs++;
        row.engines.add(ENGINE_LABEL[s.rec.engine]);
        map.set(h, row);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1].runs - a[1].runs)
      .slice(0, 20)
      .map(([domain, v]) => ({ domain, runs: v.runs, engines: [...v.engines], competitor: v.competitor }));
  };
  const citedInstead = countDomains(scored.filter((s) => !s.cited[0]));
  const topCited = countDomains(scored);

  const costs = ok.map((r) => r.answer!.costUsd).filter((c): c is number => typeof c === "number");

  const report = {
    study: study.name,
    simulated,
    generatedAt: new Date().toISOString(),
    market: study.market,
    engines: engines.map((e) => ({ id: e, model: models[e] })),
    prompts: study.prompts.length,
    runsPerPrompt: study.runs,
    responses: { ok: ok.length, failed: failed.length },
    overall,
    byEngine,
    shareOfVoice: shareOfVoice.map((x) => ({ ...x, share: totalMentions ? x.mentions / totalMentions : 0 })),
    averageBrandRank: avgRank,
    byType,
    byPrompt,
    citedWhenBrandIsNot: citedInstead,
    topCitedDomains: topCited,
    knownCostUsd: costs.length ? costs.reduce((a, b) => a + b, 0) : null,
    failures: failed.map((f) => ({ key: f.key, error: f.error })),
  };
  await writeFile(path.join(dir, "report.json"), JSON.stringify(report, null, 2));

  // ---------- Markdown ----------
  const md: string[] = [];
  const head = (cols: string[]) => [`| ${cols.join(" | ")} |`, `|${cols.map(() => "---").join("|")}|`];
  const b = study.brand.name;

  md.push(`# Visibilidad en IA · ${study.name}`, "");
  if (simulated) {
    md.push(
      "> ⚠️ **SIMULACIÓN.** Estas respuestas son inventadas para probar el flujo. Ningún número de este informe describe a un motor real.",
      "",
    );
  }
  md.push(
    `**Marca:** ${b} (${study.brand.domains.join(", ")})  `,
    `**Mercado:** ${[...new Set([study.market.city, study.market.region, study.market.country].filter(Boolean))].join(", ")} · ${study.market.language}  `,
    `**Motores:** ${engines.map((e) => `${ENGINE_LABEL[e]} (${models[e]})`).join(" · ")}  `,
    `**Muestra:** ${study.prompts.length} preguntas × ${study.runs} repeticiones · ${ok.length} respuestas válidas${failed.length ? `, ${failed.length} fallidas` : ""}  `,
    `**Fecha:** ${report.generatedAt.slice(0, 10)}`,
    "",
    "Los porcentajes llevan entre paréntesis el intervalo de confianza del 95%: con muestras chicas, el rango importa tanto como el número.",
    "",
    `## ¿Las IAs mencionan y citan a ${b}?`,
    "",
    ...head(["Motor", "Menciona la marca", "Cita el sitio (link)", "Sitio entre las fuentes", "Respuestas"]),
    ...engines.map((e) => `| ${ENGINE_LABEL[e]} | ${pct(byEngine[e].mention)} | ${pct(byEngine[e].citation)} | ${pct(byEngine[e].source)} | ${byEngine[e].mention.n} |`),
    `| **Total** | **${pct(overall.mention)}** | **${pct(overall.citation)}** | **${pct(overall.source)}** | **${overall.mention.n}** |`,
    "",
    "- **Menciona:** el nombre de la marca aparece en la respuesta.",
    "- **Cita:** la respuesta enlaza a un dominio de la marca.",
    "- **Fuentes:** el motor reporta haber consultado el sitio, aunque no lo enlace. Gemini solo expone lo que cita.",
    "",
  );

  if (study.competitors.length) {
    md.push(
      "## Participación frente a la competencia",
      "",
      ...head(["Marca", ...engines.map((e) => ENGINE_LABEL[e]), "Participación de voz"]),
      ...report.shareOfVoice.map(
        (x, i) =>
          `| ${i === 0 ? `**${x.name}**` : x.name} | ${engines.map((e) => pct(x.perEngine[e])).join(" | ")} | ${Math.round(x.share * 100)}% |`,
      ),
      "",
      avgRank !== null
        ? `Cuando aparece, ${b} es en promedio la marca **#${avgRank.toFixed(1)}** en ser mencionada.`
        : `${b} no apareció en ninguna respuesta.`,
      "",
    );
  }

  md.push(
    "## Por tipo de pregunta",
    "",
    ...head(["Tipo", ...engines.map((e) => `${ENGINE_LABEL[e]} (menciona / cita)`)]),
    ...byType.map(
      (t) =>
        `| ${TYPE_LABEL[t.type]} | ${engines
          .map((e) => `${t.perEngine[e].mention.hits}/${t.perEngine[e].mention.n} · ${t.perEngine[e].citation.hits}/${t.perEngine[e].citation.n}`)
          .join(" | ")} |`,
    ),
    "",
    "## Por pregunta",
    "",
    ...head(["#", "Pregunta", ...engines.map((e) => ENGINE_LABEL[e])]),
    ...byPrompt.map(
      (p) =>
        `| ${p.id} | ${p.text.replace(/\|/g, "\\|")} | ${engines
          .map((e) => `${p.perEngine[e].mention.hits}/${p.perEngine[e].mention.n} · ${p.perEngine[e].citation.hits}/${p.perEngine[e].citation.n}`)
          .join(" | ")} |`,
    ),
    "",
    "_Cada celda: veces que menciona / total · veces que cita / total._",
    "",
    `## Fuentes que citan cuando ${b} no aparece`,
    "",
    "Estas son las páginas en las que el motor ya confía para tu categoría. Conseguir presencia ahí suele pesar más que cambiar tu propio sitio.",
    "",
    ...head(["Dominio", "Respuestas", "Motores", ""]),
    ...citedInstead.map((d) => `| ${d.domain} | ${d.runs} | ${d.engines.join(", ")} | ${d.competitor ? "competidor" : ""} |`),
    "",
    "## Método y limitaciones",
    "",
    "- Cada pregunta se envió tal cual, sin instrucciones adicionales, con la búsqueda web del motor activada y, donde el API lo permite, la ubicación del mercado.",
    "- Se usan las APIs de cada proveedor. La app que ve el usuario puede responder distinto: personaliza, usa memoria y cambia de modelo.",
    "- Las respuestas cambian entre corridas; por eso se repite cada pregunta y se reportan rangos.",
    "- Google AI Overviews / AI Mode y Copilot no tienen API para esto y no están incluidos.",
    "- La detección de menciones busca el nombre y los alias exactos (sin distinguir mayúsculas ni acentos). Todas las respuestas crudas están en `responses.jsonl` para auditarlas.",
  );
  if (report.knownCostUsd !== null) md.push(`- Costo reportado por los proveedores que lo informan: US$${report.knownCostUsd.toFixed(2)}.`);
  if (failed.length) {
    md.push("", "## Llamadas fallidas", "", ...failed.map((f) => `- \`${f.key}\`: ${f.error}`));
  }

  await writeFile(path.join(dir, "report.md"), md.join("\n") + "\n");
  console.log(`\nInforme: ${path.join(dir, "report.md")}`);
  console.log(
    `${b} · menciona ${pct(overall.mention)} · cita ${pct(overall.citation)} · ${ok.length} respuestas${simulated ? "  [SIMULACIÓN]" : ""}`,
  );
  return report;
}

if (import.meta.main) {
  const dir = process.argv[2];
  if (!dir) {
    console.log("Uso: npm run analyze -- out/<estudio>/<fecha>");
    process.exit(1);
  }
  analyzeDir(dir).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
