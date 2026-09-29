import { CheckCircle2, AlertTriangle, XCircle, Info, MinusCircle, ChevronDown } from "lucide-react";
import type { AuditReport, BotPurpose, Check, Status } from "@/lib/geo/audit";
import type { PageKind, StructuredReport } from "@/lib/geo/structured";

/**
 * "¿Te pueden leer?": la revisión técnica del sitio. La usan el Scan GEO público y el panel,
 * para que el cliente y el equipo vean exactamente lo mismo.
 */

type Lang = "es" | "en";

const copy = {
  es: {
    scoreLabel: "Preparación técnica para IA",
    partial: "Evaluación parcial",
    partialText:
      "Tu servidor bloqueó nuestra visita, así que no pudimos leer el contenido y no mostramos una calificación que sería engañosa. Revisa el acceso de bots abajo: suele ser un firewall o Cloudflare.",
    audited: "Revisado",
    topIssues: "Lo más urgente",
    noIssues: "No encontramos fallas graves.",
    details: "Ver el detalle técnico con evidencia",
    fullTitle: "Detalle por revisión",
    botsTitle: "Qué bots pueden entrar",
    botsNote:
      "Según tu robots.txt, para esta página. Los de búsqueda deciden si te pueden citar; los de entrenamiento son una decisión de negocio y no restan puntos.",
    purpose: { search: "Búsqueda y citas", user: "Visita a pedido del usuario", training: "Entrenamiento" } as Record<BotPurpose, string>,
    allowed: "Permitido",
    blocked: "Bloqueado",
    unknown: "Sin confirmar",
    points: "pts",
    na: "no evaluable",
    sdTitle: "Datos estructurados, página por página",
    sdIntro:
      "El JSON-LD es la ficha que las máquinas leen para saber quién eres, qué vendes, a qué precio y dónde estás. Revisamos la portada y páginas de cada tipo de tu sitio. No suma a la calificación: es el detalle para corregir.",
    sdSitemap: (n: number) => `Elegidas de las ${n.toLocaleString("es-MX")} direcciones de tu sitemap y de los links de tu portada.`,
    sdNoSitemap: "Elegidas de los links de tu portada (no encontramos sitemap).",
    sdNotFound: "No encontramos páginas de:",
    sdNone: "sin JSON-LD",
    sdSample: "Ver el bloque tal como está",
    sdUnreadable: "no se pudo leer",
    kinds: {
      home: "Portada",
      product: "Ficha de producto",
      service: "Servicio",
      contact: "Contacto",
      about: "Nosotros",
      article: "Artículo",
    } as Record<PageKind, string>,
    kindsPlural: {
      home: "portada",
      product: "fichas de producto",
      service: "servicios",
      contact: "contacto",
      about: "nosotros",
      article: "artículos",
    } as Record<PageKind, string>,
  },
  en: {
    scoreLabel: "Technical AI readiness",
    partial: "Partial audit",
    partialText:
      "Your server blocked our visit, so we couldn't read the content and we don't show a score that would be misleading. Check bot access below: it's usually a firewall or Cloudflare.",
    audited: "Audited",
    topIssues: "Most urgent",
    noIssues: "No serious problems found.",
    details: "See the technical detail with evidence",
    fullTitle: "Detail by check",
    botsTitle: "Which bots can get in",
    botsNote:
      "Per your robots.txt, for this page. Search bots decide whether you can be cited; training bots are a business decision and don't cost points.",
    purpose: { search: "Search & citations", user: "User-requested visit", training: "Training" } as Record<BotPurpose, string>,
    allowed: "Allowed",
    blocked: "Blocked",
    unknown: "Unconfirmed",
    points: "pts",
    na: "not assessable",
    sdTitle: "Structured data, page by page",
    sdIntro:
      "JSON-LD is the card machines read to know who you are, what you sell, at what price and where. We check your home page and a page of each type on your site. It isn't scored: it's the detail to fix.",
    sdSitemap: (n: number) => `Picked from the ${n.toLocaleString("en-US")} addresses in your sitemap and the links on your home page.`,
    sdNoSitemap: "Picked from the links on your home page (no sitemap found).",
    sdNotFound: "We found no pages for:",
    sdNone: "no JSON-LD",
    sdSample: "See the block as it is",
    sdUnreadable: "couldn't be read",
    kinds: {
      home: "Home page",
      product: "Product page",
      service: "Service",
      contact: "Contact",
      about: "About",
      article: "Article",
    } as Record<PageKind, string>,
    kindsPlural: {
      home: "home page",
      product: "product pages",
      service: "services",
      contact: "contact",
      about: "about",
      article: "articles",
    } as Record<PageKind, string>,
  },
};

type Copy = (typeof copy)["es"];

const statusStyle: Record<Status, { icon: typeof CheckCircle2; cls: string }> = {
  pass: { icon: CheckCircle2, cls: "text-emerald-400" },
  warn: { icon: AlertTriangle, cls: "text-amber-400" },
  fail: { icon: XCircle, cls: "text-red-500" },
  info: { icon: Info, cls: "text-slate-400" },
  na: { icon: MinusCircle, cls: "text-slate-500" },
};

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-500";
}

function barColor(ratio: number) {
  if (ratio >= 0.7) return "bg-emerald-500";
  if (ratio >= 0.4) return "bg-amber-500";
  return "bg-red-600";
}

function CheckRow({ check, c }: { check: Check; c: Copy }) {
  const { icon: Icon, cls } = statusStyle[check.status];
  return (
    <li className="py-4 border-t border-white/[0.06] first:border-t-0 break-inside-avoid">
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${cls} shrink-0 mt-0.5`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-white text-sm font-semibold">{check.label}</p>
            {check.max > 0 && (
              <span className="text-xs font-mono text-slate-400">
                {check.status === "na" ? c.na : `${check.earned}/${check.max} ${c.points}`}
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{check.detail}</p>
          {check.evidence && (
            <p className="mt-2 text-xs font-mono text-slate-300 bg-white/[0.03] border border-white/[0.06] rounded-md px-2.5 py-1.5 break-all">
              {check.evidence}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function pathOf(url: string) {
  try {
    const u = new URL(url);
    return u.pathname + u.search || "/";
  } catch {
    return url;
  }
}

function StructuredData({ data, c }: { data: StructuredReport; c: Copy }) {
  return (
    <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06] mt-5">
      <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500">{c.sdTitle}</h3>
      <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{c.sdIntro}</p>
      <p className="text-zinc-500 text-xs mt-1.5">{data.sitemapUrls !== null ? c.sdSitemap(data.sitemapUrls) : c.sdNoSitemap}</p>

      <ul className="mt-5 space-y-3">
        {data.pages.map((p) => {
          const worst = p.findings.some((f) => f.status === "fail") ? "fail" : p.findings.some((f) => f.status === "warn") ? "warn" : "pass";
          const { icon: Icon, cls } = statusStyle[p.httpStatus && p.httpStatus < 400 ? worst : "na"];
          return (
            <li key={`${p.kind}-${p.url}`} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 break-inside-avoid">
              <div className="flex items-start gap-3">
                <Icon size={18} className={`${cls} shrink-0 mt-0.5`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-white text-sm font-semibold">{c.kinds[p.kind]}</p>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-zinc-500 hover:text-zinc-300 break-all">
                      {pathOf(p.url)}
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.httpStatus === null || p.httpStatus >= 400 ? (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-mono text-slate-400">{c.sdUnreadable}</span>
                    ) : p.types.length ? (
                      p.types.map((t) => (
                        <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-mono text-slate-300">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-mono text-red-300">{c.sdNone}</span>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {p.findings.map((f) => {
                      const s = statusStyle[f.status];
                      return (
                        <li key={f.text} className="flex items-start gap-2 text-sm text-zinc-300">
                          <s.icon size={14} className={`${s.cls} shrink-0 mt-1`} aria-hidden />
                          <span className="leading-relaxed">{f.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {p.sample && (
                    <details className="group mt-3">
                      <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                        {c.sdSample}
                        <ChevronDown size={13} className="transition group-open:rotate-180 print:hidden" />
                      </summary>
                      <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-white/[0.06] bg-black/30 p-3 text-[11px] leading-relaxed font-mono text-slate-300">
                        {p.sample}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {data.notFound.length > 0 && (
        <p className="mt-4 text-xs text-zinc-500">
          {c.sdNotFound} {data.notFound.map((k) => c.kindsPlural[k]).join(", ")}.
        </p>
      )}
    </div>
  );
}

export default function Readability({ report, lang }: { report: AuditReport; lang: Lang }) {
  const c = copy[lang];
  const scored = report.categories.filter((cat) => cat.max > 0);
  const topIssues = report.categories
    .flatMap((cat) => cat.checks)
    .filter((ch) => ch.status === "fail" || (ch.status === "warn" && ch.max > 0))
    .sort((a, b) => b.max - b.earned - (a.max - a.earned))
    .slice(0, 3);

  return (
    <>
      <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06]">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">{c.scoreLabel}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {c.audited}: {new Date(report.auditedAt).toLocaleString(lang === "en" ? "en-US" : "es-MX")}
        </p>

        {report.score !== null ? (
          <div className="mt-5 flex items-end gap-3">
            <span className={`text-6xl font-black leading-none ${scoreColor(report.score)}`}>{report.score}</span>
            <span className="text-zinc-500 text-lg mb-1">/ 100</span>
            <span className="ml-2 mb-1.5 text-sm font-semibold text-white">{report.grade}</span>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-amber-300 font-semibold text-sm">{c.partial}</p>
            <p className="text-zinc-300 text-sm mt-1 leading-relaxed">{c.partialText}</p>
          </div>
        )}

        <div className="mt-7 space-y-3.5">
          {scored.map((cat) => {
            const ratio = cat.max ? cat.earned / cat.max : 0;
            return (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-zinc-300">{cat.label}</span>
                  <span className="font-mono text-slate-400">
                    {cat.earned}/{cat.max}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(ratio)}`} style={{ width: `${ratio * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06] mt-5">
        <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-2">{c.topIssues}</h3>
        {topIssues.length ? (
          <ul>
            {topIssues.map((ch) => (
              <CheckRow key={ch.id} check={{ ...ch, evidence: undefined }} c={c} />
            ))}
          </ul>
        ) : (
          <p className="text-zinc-400 text-sm">{c.noIssues}</p>
        )}
      </div>

      {report.structured && <StructuredData data={report.structured} c={c} />}

      <details className="group glass rounded-2xl border border-white/[0.06] mt-5">
        <summary className="cursor-pointer list-none p-6 sm:px-8 flex items-center justify-between gap-3 text-sm font-semibold text-white">
          {c.details}
          <ChevronDown size={16} className="text-zinc-400 transition group-open:rotate-180 print:hidden" />
        </summary>
        <div className="px-6 sm:px-8 pb-8">
          <h3 className="text-base font-bold text-white">{c.botsTitle}</h3>
          <p className="text-zinc-400 text-sm mt-1">{c.botsNote}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <tbody>
                {report.bots.map((b) => {
                  const v = b.robots;
                  return (
                    <tr key={b.token} className="border-t border-white/[0.06]">
                      <td className="py-2.5 pr-3 font-mono text-white">{b.token}</td>
                      <td className="py-2.5 pr-3 text-zinc-400">{b.owner}</td>
                      <td className="py-2.5 pr-3 text-zinc-500">{c.purpose[b.purpose]}</td>
                      <td
                        className={`py-2.5 font-semibold text-right ${!v ? "text-slate-400" : v.allowed ? "text-emerald-400" : "text-red-500"}`}
                        title={v?.rule ?? undefined}
                      >
                        {!v ? c.unknown : v.allowed ? c.allowed : c.blocked}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-bold text-white mt-8">{c.fullTitle}</h3>
          {report.categories.map((cat) => (
            <div key={cat.id} className="mt-6 first:mt-2">
              <div className="flex justify-between items-baseline">
                <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-red-400">{cat.label}</h4>
                {cat.max > 0 && (
                  <span className="font-mono text-xs text-slate-400">
                    {cat.earned}/{cat.max}
                  </span>
                )}
              </div>
              <ul className="mt-1">
                {cat.checks.map((ch) => (
                  <CheckRow key={ch.id} check={ch} c={c} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
