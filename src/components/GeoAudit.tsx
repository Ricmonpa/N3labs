"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Radar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  MinusCircle,
  Lock,
  Printer,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { sendLead, emailRe } from "@/lib/leads";
import type { AuditReport, Check, Status, BotPurpose } from "@/lib/geo/audit";

const ACCESS_KEY = "n3-geo-access";
const PROMPTER_KEY = "n3-prompter-access";

const copy = {
  es: {
    badge: "Diagnóstico GEO · N3",
    title: "¿Las IAs pueden leer tu sitio?",
    subtitle:
      "Revisamos tu página en vivo: si ChatGPT, Claude, Perplexity y Google tienen permiso y acceso, si el contenido se ve sin JavaScript, y si tus datos estructurados dicen quién eres. Cada resultado viene con su evidencia.",
    placeholder: "tuempresa.com o una página específica",
    cta: "Revisar mi sitio",
    running: "Revisando tu sitio…",
    runningHint:
      "Estamos descargando la página, su robots.txt y pidiéndola como lo haría cada bot. Toma entre 5 y 20 segundos.",
    whatTitle: "Qué revisamos",
    what: [
      ["Acceso de bots de IA", "Qué bots permite tu robots.txt y si tu servidor o Cloudflare los rechaza."],
      ["Contenido sin JavaScript", "Cuánto texto llega en el HTML inicial, que es lo que ven muchos bots."],
      ["Entidad y datos estructurados", "JSON-LD, identidad de la marca y perfiles oficiales (sameAs)."],
      ["Estructura y frescura", "Título, encabezados, canonical, sitemap y fechas legibles por máquina."],
    ],
    scoreLabel: "Preparación técnica para IA",
    partial: "Evaluación parcial",
    partialText:
      "Tu servidor bloqueó nuestra visita, así que no pudimos leer el contenido y no mostramos una calificación que sería engañosa. Revisa el acceso de bots abajo: suele ser un firewall o Cloudflare.",
    audited: "Revisado",
    topIssues: "Lo más urgente",
    noIssues: "No encontramos fallas graves.",
    gateTitle: "Ve el informe completo con evidencia",
    gateText:
      "Cada revisión con la regla exacta de tu robots.txt, las respuestas del servidor a cada bot y qué corregir. Gratis.",
    name: "Nombre",
    email: "Correo de trabajo",
    unlock: "Ver informe completo",
    invalidName: "Escribe tu nombre.",
    invalidEmail: "Escribe un correo válido.",
    fullTitle: "Informe completo",
    botsTitle: "Qué bots pueden entrar",
    botsNote:
      "Según tu robots.txt, para esta página. Los de búsqueda deciden si te pueden citar; los de entrenamiento son una decisión de negocio y no restan puntos.",
    purpose: { search: "Búsqueda y citas", user: "Visita a pedido del usuario", training: "Entrenamiento" } as Record<BotPurpose, string>,
    allowed: "Permitido",
    blocked: "Bloqueado",
    unknown: "Sin confirmar",
    points: "pts",
    na: "no evaluable",
    print: "Guardar como PDF",
    again: "Revisar otro sitio",
    limitsTitle: "Qué mide esta herramienta y qué no",
    limits: [
      "Mide si tu sitio está técnicamente listo para que las IAs lo lean. No mide si hoy te citan.",
      "No inventa números: si una página no existe o no responde, te lo decimos.",
      "Saber si ChatGPT, Gemini o Perplexity te mencionan requiere correr preguntas reales en cada motor, varias veces, y comparar contra tu competencia. Ese estudio de visibilidad lo hacemos en N3.",
    ],
    limitsCta: "Quiero el estudio de visibilidad",
    errors: {
      invalid_url: "Escribe una dirección web válida, por ejemplo tuempresa.com.",
      not_found: "Ese dominio no existe o no resuelve. Revisa que esté bien escrito.",
      blocked_target: "Esa dirección no se puede revisar (solo sitios públicos).",
      unreachable: "No pudimos conectar con el sitio. Puede estar caído o tardar demasiado.",
      http_error: "El sitio respondió con un error",
      rate_limited: "Hiciste varias revisiones seguidas. Espera unos minutos e intenta de nuevo.",
    } as Record<string, string>,
  },
  en: {
    badge: "GEO Audit · N3",
    title: "Can AI read your website?",
    subtitle:
      "We check your page live: whether ChatGPT, Claude, Perplexity and Google are allowed in and can reach it, whether content shows without JavaScript, and whether your structured data says who you are. Every result comes with its evidence.",
    placeholder: "yourcompany.com or a specific page",
    cta: "Check my site",
    running: "Checking your site…",
    runningHint:
      "We're downloading the page and its robots.txt, and requesting it the way each bot would. It takes 5 to 20 seconds.",
    whatTitle: "What we check",
    what: [
      ["AI bot access", "Which bots your robots.txt allows, and whether your server or Cloudflare rejects them."],
      ["Content without JavaScript", "How much text arrives in the initial HTML, which is what many bots see."],
      ["Entity and structured data", "JSON-LD, brand identity and official profiles (sameAs)."],
      ["Structure and freshness", "Title, headings, canonical, sitemap and machine-readable dates."],
    ],
    scoreLabel: "Technical AI readiness",
    partial: "Partial audit",
    partialText:
      "Your server blocked our visit, so we couldn't read the content and we don't show a score that would be misleading. Check bot access below: it's usually a firewall or Cloudflare.",
    audited: "Audited",
    topIssues: "Most urgent",
    noIssues: "No serious problems found.",
    gateTitle: "See the full report with evidence",
    gateText:
      "Every check with the exact robots.txt rule, the server's response to each bot, and what to fix. Free.",
    name: "Name",
    email: "Work email",
    unlock: "See full report",
    invalidName: "Enter your name.",
    invalidEmail: "Enter a valid email.",
    fullTitle: "Full report",
    botsTitle: "Which bots can get in",
    botsNote:
      "Per your robots.txt, for this page. Search bots decide whether you can be cited; training bots are a business decision and don't cost points.",
    purpose: { search: "Search & citations", user: "User-requested visit", training: "Training" } as Record<BotPurpose, string>,
    allowed: "Allowed",
    blocked: "Blocked",
    unknown: "Unconfirmed",
    points: "pts",
    na: "not assessable",
    print: "Save as PDF",
    again: "Check another site",
    limitsTitle: "What this tool measures and what it doesn't",
    limits: [
      "It measures whether your site is technically ready for AI to read it. It doesn't measure whether you're cited today.",
      "It doesn't make up numbers: if a page doesn't exist or doesn't respond, we tell you.",
      "Knowing whether ChatGPT, Gemini or Perplexity mention you requires running real questions on each engine, several times, and comparing against competitors. N3 runs that visibility study.",
    ],
    limitsCta: "I want the visibility study",
    errors: {
      invalid_url: "Enter a valid web address, e.g. yourcompany.com.",
      not_found: "That domain doesn't exist or doesn't resolve. Check the spelling.",
      blocked_target: "That address can't be checked (public sites only).",
      unreachable: "We couldn't connect to the site. It may be down or too slow.",
      http_error: "The site responded with an error",
      rate_limited: "You ran several checks in a row. Wait a few minutes and try again.",
    } as Record<string, string>,
  },
};

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

function CheckRow({ check, c }: { check: Check; c: (typeof copy)["es"] }) {
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

export default function GeoAudit() {
  const { lang } = useLanguage();
  const c = copy[lang];

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);

  // Only read on the client; the gate renders after a report exists, so there's no hydration mismatch.
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!(localStorage.getItem(ACCESS_KEY) || localStorage.getItem(PROMPTER_KEY));
    } catch {
      return false;
    }
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gateError, setGateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return setError(c.errors.invalid_url);
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const res = await fetch("/api/geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = c.errors[data.error] ?? c.errors.unreachable;
        setError(data.error === "http_error" && data.status ? `${msg} (${data.status}).` : msg);
      } else {
        setReport(data as AuditReport);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError(c.errors.unreachable);
    } finally {
      setLoading(false);
    }
  };

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    if (!name.trim()) return setGateError(c.invalidName);
    if (!emailRe.test(email.trim())) return setGateError(c.invalidEmail);
    setSubmitting(true);
    const lead = await sendLead({
      name,
      email,
      lang,
      source: "geo-audit",
      auditedUrl: report?.finalUrl ?? "",
      score: report?.score === null || report?.score === undefined ? "parcial" : String(report.score),
    });
    try {
      localStorage.setItem(ACCESS_KEY, JSON.stringify(lead));
    } catch {
      /* ignore */
    }
    setSubmitting(false);
    setUnlocked(true);
  };

  const reset = () => {
    setReport(null);
    setUrl("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scored = report?.categories.filter((cat) => cat.max > 0) ?? [];
  const topIssues =
    report?.categories
      .flatMap((cat) => cat.checks)
      .filter((ch) => ch.status === "fail" || (ch.status === "warn" && ch.max > 0))
      .sort((a, b) => (b.max - b.earned) - (a.max - a.earned))
      .slice(0, 3) ?? [];

  return (
    <section className="relative px-6 pt-32 pb-24 grid-bg">
      <div
        className="absolute top-24 left-1/2 -translate-x-1/2 w-[520px] h-[380px] rounded-full blur-[140px] pointer-events-none print:hidden"
        style={{ background: "rgba(220, 38, 38, 0.08)" }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        {!report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium mb-5">
              <Radar size={12} className="text-red-500" />
              {c.badge}
            </span>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black text-white leading-tight mb-4">{c.title}</h1>
            <p className="text-zinc-400 text-base font-light leading-relaxed max-w-2xl">{c.subtitle}</p>

            <form onSubmit={run} className="mt-8 glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
              <label htmlFor="geo-url" className="sr-only">
                URL
              </label>
              <input
                id="geo-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={c.placeholder}
                inputMode="url"
                autoComplete="url"
                disabled={loading}
                className="flex-1 min-w-0 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/60"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {c.cta}
              </button>
            </form>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {error}
              </p>
            )}

            {loading && (
              <div className="mt-6 glass rounded-2xl p-5" aria-live="polite">
                <p className="text-white font-semibold text-sm flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin text-red-500" />
                  {c.running}
                </p>
                <p className="text-zinc-400 text-sm mt-1.5">{c.runningHint}</p>
              </div>
            )}

            <div className="mt-12">
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-4">{c.whatTitle}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {c.what.map(([t, d]) => (
                  <div key={t} className="glass rounded-xl p-4 border border-white/[0.05]">
                    <p className="text-white text-sm font-semibold">{t}</p>
                    <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Summary */}
            <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06]">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500">{c.scoreLabel}</p>
              <p className="mt-2 font-mono text-sm text-slate-300 break-all">{report.finalUrl}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {c.audited}: {new Date(report.auditedAt).toLocaleString(lang === "en" ? "en-US" : "es-MX")}
              </p>

              {report.score !== null ? (
                <div className="mt-6 flex items-end gap-3">
                  <span className={`text-6xl font-black leading-none ${scoreColor(report.score)}`}>{report.score}</span>
                  <span className="text-zinc-500 text-lg mb-1">/ 100</span>
                  <span className="ml-2 mb-1.5 text-sm font-semibold text-white">{report.grade}</span>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
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

            {/* Top issues */}
            <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06] mt-5">
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-2">{c.topIssues}</h2>
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

            {/* Gate or full report */}
            {!unlocked ? (
              <div className="glass rounded-2xl p-6 sm:p-8 border border-red-500/25 mt-5 print:hidden">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock size={16} className="text-red-500" />
                  {c.gateTitle}
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5">{c.gateText}</p>
                <form onSubmit={unlock} className="mt-5 grid sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="geo-name" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      {c.name}
                    </label>
                    <input
                      id="geo-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/60"
                    />
                  </div>
                  <div>
                    <label htmlFor="geo-email" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      {c.email}
                    </label>
                    <input
                      id="geo-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/60"
                    />
                  </div>
                  {gateError && (
                    <p role="alert" className="sm:col-span-2 text-sm text-red-400">
                      {gateError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 transition-colors"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {c.unlock}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06] mt-5">
                  <h2 className="text-lg font-bold text-white">{c.botsTitle}</h2>
                  <p className="text-zinc-400 text-sm mt-1">{c.botsNote}</p>
                  <div className="mt-5 overflow-x-auto">
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
                                className={`py-2.5 font-semibold text-right ${
                                  !v ? "text-slate-400" : v.allowed ? "text-emerald-400" : "text-red-500"
                                }`}
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
                </div>

                <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06] mt-5">
                  <h2 className="text-lg font-bold text-white mb-2">{c.fullTitle}</h2>
                  {report.categories.map((cat) => (
                    <div key={cat.id} className="mt-6 first:mt-2">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-red-400">{cat.label}</h3>
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
              </>
            )}

            <div className="flex flex-wrap gap-3 mt-5 print:hidden">
              {unlocked && (
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
                >
                  <Printer size={15} />
                  {c.print}
                </button>
              )}
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 hover:border-red-500/50 text-zinc-300 text-sm font-semibold px-5 py-2.5 transition-colors"
              >
                <RotateCcw size={15} />
                {c.again}
              </button>
            </div>
          </motion.div>
        )}

        {/* Honest limits */}
        <div className="mt-12 rounded-2xl border border-white/[0.07] p-6 sm:p-8 break-inside-avoid">
          <h2 className="text-lg font-bold text-white">{c.limitsTitle}</h2>
          <ul className="mt-3 space-y-2.5">
            {c.limits.map((l) => (
              <li key={l} className="text-zinc-400 text-sm leading-relaxed flex gap-2.5">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/#contacto"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 print:hidden"
          >
            {c.limitsCta}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
