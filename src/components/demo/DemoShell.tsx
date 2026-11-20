import Link from "next/link";
import { Calendar, KeyRound, Radar } from "lucide-react";
import { LanguageProvider } from "@/context/LanguageContext";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ENGEL_CALENDLY } from "@/components/Calendly";
import GeoToolGate from "./GeoToolGate";

/** Marco de las páginas del N3 GeoTool: navegación, fondo y registro antes de entrar. */
export default function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider initialLang="es">
      <main className="min-h-screen bg-[#06060c]">
        <Nav />
        <div className="relative px-4 sm:px-6 pt-28 pb-16">
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-[520px] max-w-full h-[380px] rounded-full blur-[140px] pointer-events-none"
            style={{ background: "rgba(220, 38, 38, 0.08)" }}
          />
          <div className="relative z-10 mx-auto max-w-5xl">
            <GeoToolGate>{children}</GeoToolGate>
          </div>
        </div>
        <Footer />
      </main>
    </LanguageProvider>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium">
      <Radar size={12} className="text-red-500" />
      N3 GeoTool · medición real
    </span>
  );
}

export function DemoCta() {
  return (
    <section className="mt-8 rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-950/40 to-transparent p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-black text-white">¿Y tu marca?</h2>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400 leading-relaxed">
        Hacemos esta misma medición con las preguntas de tus clientes, frente a tu competencia real, en ChatGPT, Gemini,
        Claude y Perplexity. Puedes medir con tus propias llaves de API y repetirla cada semana o cada mes para ver si
        avanzas.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={ENGEL_CALENDLY}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-3 transition-colors"
        >
          <Calendar size={15} />
          Agendar 25 minutos
        </a>
        <Link
          href="/scan-geo?modo=llave"
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 hover:border-red-500 text-white text-sm font-semibold px-6 py-3 transition-colors"
        >
          <KeyRound size={15} />
          Medir con mi llave de API
        </Link>
        <Link
          href="/demo-geo"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 hover:border-red-500/50 text-zinc-300 text-sm font-semibold px-6 py-3 transition-colors"
        >
          Ver otras industrias
        </Link>
      </div>
    </section>
  );
}
