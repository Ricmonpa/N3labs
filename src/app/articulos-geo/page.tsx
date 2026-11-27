import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import GeoArticlesView from "@/components/GeoArticlesView";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Artículos de interés sobre GEO e IA · Engel Fonseca",
  description:
    "Lecturas de Engel Fonseca en Neurona Magazine sobre inteligencia artificial, GEO y cómo configurar el futuro desde el presente.",
  path: "/articulos-geo",
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

  return (
    <LanguageProvider initialLang={initialLang}>
      <main className="min-h-screen bg-[#06060c]">
        <Nav />
        <GeoArticlesView />
        <Footer />
      </main>
    </LanguageProvider>
  );
}
