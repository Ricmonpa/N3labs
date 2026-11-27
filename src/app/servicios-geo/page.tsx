import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import GeoServicesView from "@/components/GeoServicesView";
import Footer from "@/components/Footer";
import { geoServices } from "@/lib/geoServices";
import { SITE_URL, jsonLdScript, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Servicios GEO · Diagnóstico, rankings, CDN con Markdown, G3olink y Neuroescritura",
  description:
    "Servicios GEO de N3 Labs: diagnóstico de marca o sitio web, rankings vs competencia, optimización de CDN con Markdown y agente anfitrión, G3olink y capacitación en Neuroescritura con Banshee.",
  path: "/servicios-geo",
});

function resolve(value: string | undefined): Lang | null {
  return value === "en" || value === "es" ? value : null;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const initialLang: Lang =
    resolve(sp.lang) ?? resolve(cookieStore.get("n3-lang")?.value) ?? resolve(cookieStore.get("n3-geo")?.value) ?? "es";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: geoServices[initialLang].title,
    itemListElement: geoServices[initialLang].services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "Service", name: s.title, description: s.desc, provider: { "@type": "Organization", name: "N3 Thinktech · IA Laboratory", url: SITE_URL } },
    })),
  };

  return (
    <LanguageProvider initialLang={initialLang}>
      <main className="min-h-screen bg-[#06060c]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
        <Nav />
        <GeoServicesView />
        <Footer />
      </main>
    </LanguageProvider>
  );
}
