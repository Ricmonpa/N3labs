import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Radar, Calendar } from "lucide-react";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import GeoAudit from "@/components/GeoAudit";
import Footer from "@/components/Footer";
import { ENGEL_CALENDLY } from "@/components/Calendly";
import { scanAllowed, scanOpenToEveryone } from "@/lib/panel/scan";

const TITLE = "Scan GEO completo · N3";
const DESCRIPTION =
  "Medimos si ChatGPT, Gemini, Claude y Perplexity recomiendan tu marca frente a tu competencia, con la evidencia de cada respuesta.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/scan-geo" },
  robots: { index: false, follow: false },
  openGraph: { type: "website", siteName: "N3 Thinktech · IA Laboratory", locale: "es_MX", url: "/scan-geo", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const dynamic = "force-dynamic";

function resolve(value: string | undefined): Lang | null {
  return value === "en" || value === "es" ? value : null;
}

/** Shown when the link has no valid code: what it is, and how to get it. */
function Invitation() {
  return (
    <section className="relative px-6 pt-32 pb-24 grid-bg">
      <div
        className="absolute top-24 left-1/2 -translate-x-1/2 w-[520px] h-[380px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(220, 38, 38, 0.08)" }}
      />
      <div className="relative z-10 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium mb-5">
          <Radar size={12} className="text-red-500" />
          Scan GEO · N3
        </span>
        <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black text-white leading-tight mb-4">
          ¿Las IAs recomiendan tu marca, o a tu competencia?
        </h1>
        <p className="text-zinc-400 text-base font-light leading-relaxed max-w-2xl">
          El Scan GEO le hace a la IA las preguntas que haría tu cliente y mide qué tan seguido apareces, quién aparece
          en tu lugar y qué sitios consulta antes de responder. Cada número viene con la respuesta que lo respalda.
        </p>

        <div className="mt-8 glass rounded-2xl p-6 sm:p-8 border border-red-500/25">
          <h2 className="text-lg font-bold text-white">Este diagnóstico es con invitación</h2>
          <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">
            Si alguien de N3 te compartió un link, ábrelo tal cual te llegó: trae el código de acceso. Si llegaste aquí
            por tu cuenta, agenda una llamada de 25 minutos y lo corremos contigo.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={ENGEL_CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-3 transition-colors"
            >
              <Calendar size={15} />
              Agendar una llamada
            </a>
            <Link
              href="/geotest.html"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 hover:border-red-500/50 text-zinc-300 text-sm font-semibold px-6 py-3 transition-colors"
            >
              Ver el ejercicio orientativo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function ScanGeoPage({ searchParams }: PageProps<"/scan-geo">) {
  const sp = await searchParams;
  const cookieStore = await cookies();

  const initialLang: Lang =
    resolve(typeof sp.lang === "string" ? sp.lang : undefined) ??
    resolve(cookieStore.get("n3-lang")?.value) ??
    resolve(cookieStore.get("n3-geo")?.value) ??
    "es";

  const code = typeof sp.c === "string" ? sp.c : "";
  const allowed = scanAllowed(code);

  return (
    <LanguageProvider initialLang={initialLang}>
      <main className="min-h-screen bg-[#06060c]">
        <Nav />
        {allowed ? <GeoAudit scanCode={scanOpenToEveryone() ? undefined : code} /> : <Invitation />}
        <Footer />
      </main>
    </LanguageProvider>
  );
}
