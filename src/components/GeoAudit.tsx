"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  ArrowRight,
  CheckCircle2,
  Printer,
  RotateCcw,
  Loader2,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { sendLead, emailRe } from "@/lib/leads";
import type { AuditReport } from "@/lib/geo/audit";
import type { Report } from "@/lib/geo-visibility/report.ts";
import ReportView from "@/components/panel/ReportView";
import Readability from "@/components/geo/Readability";
import { ENGEL_CALENDLY } from "./Calendly";

const ACCESS_KEY = "n3-geo-access";
const PROMPTER_KEY = "n3-prompter-access";
/** The last diagnosis, so a reload (or a phone that dropped the tab) picks it back up. */
const LAST_KEY = "n3-geo-last";
const POLL_MS = 3000;

type ScanRef = { id: string; token: string };
type ScanState =
  | { status: "starting" }
  | { status: "preparing" }
  | { status: "running"; answered: number; total: number }
  | { status: "done"; report: Report }
  | { status: "failed"; reason?: string };

const copy = {
  es: {
    badge: "Diagnóstico GEO completo · N3",
    title: "¿Las IAs pueden leer tu sitio? ¿Y te recomiendan?",
    subtitle:
      "En un solo paso revisamos tu página en vivo —si ChatGPT, Claude, Perplexity y Google pueden entrar y entenderla— y le hacemos a Gemini las preguntas que haría tu cliente, para ver si te recomienda a ti o a tu competencia.",
    urlLabel: "Tu sitio",
    placeholder: "tuempresa.com",
    name: "Nombre",
    email: "Correo de trabajo",
    cta: "Hacer mi diagnóstico completo",
    privacy: "Te enviamos solo lo relacionado con tu diagnóstico. Gratis.",
    running: "Revisando tu sitio…",
    runningHint: "Descargamos la página y su robots.txt, y la pedimos como lo haría cada bot. Toma entre 5 y 20 segundos.",
    whatTitle: "Qué incluye",
    what: [
      ["Acceso de bots de IA", "Qué bots permite tu robots.txt y si tu servidor o Cloudflare los rechaza."],
      ["Contenido sin JavaScript", "Cuánto texto llega en el HTML inicial, que es lo que ven muchos bots."],
      ["Entidad y datos estructurados", "JSON-LD página por página: portada, fichas de producto, servicios, contacto y artículos, con lo que falta en cada una."],
      ["¿Te recomienda la IA?", "Preguntas reales de clientes a Gemini, con búsqueda en Google: si te menciona, si enlaza tu sitio y a quién recomienda en tu lugar."],
    ],
    resultFor: "Diagnóstico de",
    part1: "Parte 1 · ¿Te pueden leer?",
    part2: "Parte 2 · ¿Te recomiendan?",
    scanStarting: "Arrancando el estudio…",
    scanPreparing: "Leyendo tu sitio y armando las preguntas que haría tu cliente…",
    scanPreparingHint: "Buscamos en la web qué vendes y quién es tu competencia. Menos de un minuto.",
    scanRunning: "Preguntándole a Gemini lo que preguntaría tu cliente",
    scanRunningHint: "Cada pregunta va tres veces, porque la IA no siempre responde igual. Puedes quedarte aquí: el resultado aparece solo.",
    answers: "respuestas",
    buildingTitle: "Estamos armando tu diagnóstico",
    buildingHint: "Las dos partes se entregan juntas, para que veas el panorama completo. Le hacemos 78 preguntas reales a la IA, así que toma entre 4 y 7 minutos.",
    buildingStep1: "Revisión técnica de tu sitio",
    buildingStep1Done: "Lista",
    buildingStep2: "Qué responde la IA sobre ti",
    buildingLeave: "Puedes cerrar esta página y volver al mismo link: el estudio sigue corriendo en nuestro servidor.",
    scanFailed: "Esta parte no pudo correr ahora.",
    scanFailedHint: "Ya tenemos tus datos: el equipo de N3 la corre y te escribe con el resultado.",
    scanReasons: {
      rate_limited: "Ya hiciste varios diagnósticos hoy.",
      busy: "Hoy tuvimos muchos diagnósticos.",
    } as Record<string, string>,
    sampleNote:
      "Muestra con un motor (Gemini): 26 preguntas, tres veces cada una. Es una foto de hoy, no un promedio, y por eso cada número trae su rango probable.",
    nextTitle: "Mídelo en los cuatro motores, cada mes",
    nextText:
      "El estudio de N3 mide ChatGPT, Claude, Perplexity y Gemini con más preguntas y repeticiones, te dice qué fuentes consulta la IA antes de responder y te entrega el plan para aparecer.",
    nextCta: "Agendar una llamada",
    print: "Guardar como PDF",
    again: "Revisar otro sitio",
    invalidUrl: "Escribe la dirección de tu sitio, por ejemplo tuempresa.com.",
    invalidName: "Escribe tu nombre.",
    invalidEmail: "Escribe un correo válido.",
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
    badge: "Full GEO audit · N3",
    title: "Can AI read your website? And does it recommend you?",
    subtitle:
      "In one step we check your page live —whether ChatGPT, Claude, Perplexity and Google can get in and understand it— and ask Gemini the questions your customers would, to see whether it recommends you or your competitors.",
    urlLabel: "Your website",
    placeholder: "yourcompany.com",
    name: "Name",
    email: "Work email",
    cta: "Run my full audit",
    privacy: "We'll only send you what relates to your audit. Free.",
    running: "Checking your site…",
    runningHint: "We're downloading the page and its robots.txt, and requesting it the way each bot would. It takes 5 to 20 seconds.",
    whatTitle: "What's included",
    what: [
      ["AI bot access", "Which bots your robots.txt allows, and whether your server or Cloudflare rejects them."],
      ["Content without JavaScript", "How much text arrives in the initial HTML, which is what many bots see."],
      ["Entity and structured data", "JSON-LD page by page: home, product pages, services, contact and articles, with what each one is missing."],
      ["Does AI recommend you?", "Real customer questions to Gemini, with Google Search: whether it mentions you, links your site, and who it recommends instead."],
    ],
    resultFor: "Audit of",
    part1: "Part 1 · Can AI read you?",
    part2: "Part 2 · Does AI recommend you?",
    scanStarting: "Starting the study…",
    scanPreparing: "Reading your site and writing the questions your customers would ask…",
    scanPreparingHint: "We search the web for what you sell and who you compete with. Under a minute.",
    scanRunning: "Asking Gemini what your customers would ask",
    scanRunningHint: "Each question runs three times, because AI doesn't always answer the same way. You can stay here: the result shows up on its own.",
    answers: "answers",
    buildingTitle: "We're putting your audit together",
    buildingHint: "Both parts are delivered together, so you see the whole picture. We ask AI 78 real questions, so it takes 4 to 7 minutes.",
    buildingStep1: "Technical check of your site",
    buildingStep1Done: "Done",
    buildingStep2: "What AI says about you",
    buildingLeave: "You can close this page and come back to the same link: the study keeps running on our server.",
    scanFailed: "This part couldn't run right now.",
    scanFailedHint: "We have your details: the N3 team will run it and email you the result.",
    scanReasons: {
      rate_limited: "You've already run several audits today.",
      busy: "We've had a lot of audits today.",
    } as Record<string, string>,
    sampleNote:
      "A sample with one engine (Gemini): 26 questions, three times each. A snapshot of today, not an average, which is why every number comes with its likely range.",
    nextTitle: "Measure it on all four engines, every month",
    nextText:
      "N3's study measures ChatGPT, Claude, Perplexity and Gemini with more questions and repetitions, shows which sources the AI checks before answering, and gives you the plan to show up.",
    nextCta: "Book a call",
    print: "Save as PDF",
    again: "Check another site",
    invalidUrl: "Enter your website, e.g. yourcompany.com.",
    invalidName: "Enter your name.",
    invalidEmail: "Enter a valid email.",
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

type Copy = (typeof copy)["es"];

const inputCls =
  "w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/60 disabled:opacity-60";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Mientras corre el estudio: una sola pantalla, para que nadie crea que ya terminó. */
function Building({ scan, c }: { scan: ScanState; c: Copy }) {
  const running = scan.status === "running";
  const ratio = running && scan.total ? scan.answered / scan.total : 0;
  return (
    <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06]" aria-live="polite">
      <h2 className="text-lg font-bold text-white">{c.buildingTitle}</h2>
      <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{c.buildingHint}</p>

      <div className="mt-6 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-white text-sm font-semibold">{c.buildingStep1}</p>
          <p className="text-zinc-500 text-sm">{c.buildingStep1Done}</p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <Loader2 size={18} className="animate-spin text-red-500 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-semibold">{c.buildingStep2}</p>
          <p className="text-zinc-400 text-sm mt-0.5 leading-relaxed">
            {running ? c.scanRunningHint : scan.status === "preparing" ? c.scanPreparingHint : c.scanStarting}
          </p>
          <div className="mt-4 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full bg-red-600 transition-all duration-700 ${running ? "" : "w-1/12 animate-pulse"}`}
              style={running ? { width: `${Math.max(ratio * 100, 4)}%` } : undefined}
            />
          </div>
          {running && (
            <p className="mt-2 text-xs text-zinc-500 tabular-nums">
              {scan.answered} / {scan.total} {c.answers}
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-zinc-500 leading-relaxed">{c.buildingLeave}</p>
    </div>
  );
}

function PartHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-red-500">{children}</h2>;
}

function Visibility({ scan, c }: { scan: ScanState; c: Copy }) {
  if (scan.status === "done") {
    return (
      <>
        <ReportView report={scan.report} audience="client" />
        <p className="mt-3 text-xs text-zinc-500 leading-relaxed">{c.sampleNote}</p>
      </>
    );
  }

  if (scan.status === "failed") {
    return (
      <div className="glass rounded-2xl p-6 sm:p-8 border border-amber-500/25">
        <p className="text-amber-300 font-semibold text-sm">{c.scanFailed}</p>
        <p className="text-zinc-300 text-sm mt-1 leading-relaxed">
          {scan.reason && c.scanReasons[scan.reason] ? `${c.scanReasons[scan.reason]} ` : ""}
          {c.scanFailedHint}
        </p>
      </div>
    );
  }

  const running = scan.status === "running";
  const ratio = running && scan.total ? scan.answered / scan.total : 0;
  return (
    <div className="glass rounded-2xl p-6 sm:p-8 border border-white/[0.06]" aria-live="polite">
      <p className="text-white font-semibold text-sm flex items-center gap-2">
        <Loader2 size={15} className="animate-spin text-red-500" />
        {running ? c.scanRunning : scan.status === "preparing" ? c.scanPreparing : c.scanStarting}
      </p>
      <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{running ? c.scanRunningHint : c.scanPreparingHint}</p>
      <div className="mt-5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full bg-red-600 transition-all duration-700 ${running ? "" : "w-1/12 animate-pulse"}`}
          style={running ? { width: `${Math.max(ratio * 100, 4)}%` } : undefined}
        />
      </div>
      {running && (
        <p className="mt-2 text-xs text-zinc-500 tabular-nums">
          {scan.answered} / {scan.total} {c.answers}
        </p>
      )}
    </div>
  );
}

export default function GeoAudit({ scanCode, invite }: { scanCode?: string; invite?: string } = {}) {
  const { lang } = useLanguage();
  const c = copy[lang];

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [scanRef, setScanRef] = useState<ScanRef | null>(null);
  const [scan, setScan] = useState<ScanState | null>(null);
  // Las dos partes se entregan juntas: mientras el estudio corre, no se muestra nada del informe.
  const waiting = !!scan && scan.status !== "done" && scan.status !== "failed";

  // Prefill from an earlier sign-up and pick up the last diagnosis after a reload.
  useEffect(() => {
    const lead = readJson<{ name?: string; email?: string }>(ACCESS_KEY) ?? readJson<{ name?: string; email?: string }>(PROMPTER_KEY);
    if (lead?.name) setName(lead.name);
    if (lead?.email) setEmail(lead.email);
    const last = readJson<{ report: AuditReport; scan: ScanRef | null }>(LAST_KEY);
    if (last?.report) {
      setReport(last.report);
      if (last.scan) {
        setScanRef(last.scan);
        setScan({ status: "starting" });
      }
    }
  }, []);

  // Poll the visibility study until it's done.
  useEffect(() => {
    if (!scanRef) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/geo/scan/${scanRef.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: scanRef.token }),
        });
        if (stopped) return;
        if (res.status === 404) return setScan({ status: "failed" });
        if (res.ok) {
          const data = (await res.json()) as ScanState;
          setScan(data);
          if (data.status === "done" || data.status === "failed") return;
        }
      } catch {
        /* network blip: try again */
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [scanRef]);

  const startScan = async (auditedUrl: string): Promise<ScanRef | null> => {
    setScan({ status: "starting" });
    try {
      const res = await fetch("/api/geo/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auditedUrl, name, email, lang, code: scanCode, invite }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScan({ status: "failed", reason: data.error });
        return null;
      }
      setScanRef(data as ScanRef);
      return data as ScanRef;
    } catch {
      setScan({ status: "failed" });
      return null;
    }
  };

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) return setError(c.invalidUrl);
    if (!name.trim()) return setError(c.invalidName);
    if (!emailRe.test(email.trim())) return setError(c.invalidEmail);

    setReport(null);
    setScan(null);
    setScanRef(null);
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
        return;
      }
      const audit = data as AuditReport;
      setReport(audit);
      window.scrollTo({ top: 0, behavior: "smooth" });

      const lead = await sendLead({
        name,
        email,
        lang,
        source: "geo-audit",
        auditedUrl: audit.finalUrl,
        score: audit.score === null ? "parcial" : String(audit.score),
      });
      writeJson(ACCESS_KEY, lead);

      const ref = await startScan(audit.finalUrl);
      writeJson(LAST_KEY, { report: audit, scan: ref });
    } catch {
      setError(c.errors.unreachable);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReport(null);
    setScan(null);
    setScanRef(null);
    setUrl("");
    setError("");
    try {
      localStorage.removeItem(LAST_KEY);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

            <form onSubmit={run} noValidate className="mt-8 glass rounded-2xl p-4 sm:p-6 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="geo-url" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  {c.urlLabel}
                </label>
                <input
                  id="geo-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={c.placeholder}
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  disabled={loading}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="geo-name" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  {c.name}
                </label>
                <input id="geo-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" disabled={loading} className={inputCls} />
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
                  autoCapitalize="none"
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3.5 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {c.cta}
              </button>
              <p className="sm:col-span-2 text-center text-[11px] text-zinc-500">{c.privacy}</p>
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

        {report && waiting && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium">
              <Radar size={12} className="text-red-500" />
              {c.badge}
            </span>
            <p className="mt-4 text-sm text-zinc-400">{c.resultFor}</p>
            <p className="font-mono text-lg text-white break-all mb-6">{report.finalUrl}</p>
            <Building scan={scan!} c={c} />
          </motion.div>
        )}

        {report && !waiting && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium">
              <Radar size={12} className="text-red-500" />
              {c.badge}
            </span>
            <p className="mt-4 text-sm text-zinc-400">{c.resultFor}</p>
            <p className="font-mono text-lg text-white break-all">{report.finalUrl}</p>

            <PartHeading>{c.part1}</PartHeading>
            <Readability report={report} lang={lang} />

            {scan && (
              <>
                <PartHeading>{c.part2}</PartHeading>
                <Visibility scan={scan} c={c} />
              </>
            )}

            <div className="mt-8 rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-950/30 to-transparent p-6 sm:p-8 print:hidden">
              <h2 className="text-lg font-bold text-white">{c.nextTitle}</h2>
              <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{c.nextText}</p>
              <a
                href={ENGEL_CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-3 transition-colors"
              >
                <Calendar size={15} />
                {c.nextCta}
              </a>
            </div>

            <div className="flex flex-wrap gap-3 mt-5 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
              >
                <Printer size={15} />
                {c.print}
              </button>
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
      </div>
    </section>
  );
}
