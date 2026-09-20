import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import GeoAudit from "@/components/GeoAudit";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Diagnóstico GEO completo · ¿Las IAs te leen y te recomiendan? | N3",
  description:
    "Diagnóstico gratuito de N3: revisa en vivo si ChatGPT, Claude, Perplexity y Google pueden leer tu sitio, y si Gemini te recomienda frente a tu competencia.",
  path: "/geo",
});

function resolve(value: string | undefined): Lang | null {
  return value === "en" || value === "es" ? value : null;
}

export default async function GeoPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();

  const initialLang: Lang =
    resolve(sp.lang) ??
    resolve(cookieStore.get("n3-lang")?.value) ??
    resolve(cookieStore.get("n3-geo")?.value) ??
    "es";

  return (
    <LanguageProvider initialLang={initialLang}>
      <main className="min-h-screen bg-[#06060c]">
        <Nav />
        <GeoAudit />
        <Footer />
      </main>
    </LanguageProvider>
  );
}
