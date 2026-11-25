import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import GlossaryView from "@/components/GlossaryView";
import Footer from "@/components/Footer";
import { glossary } from "@/lib/glossary";
import { SITE_URL, jsonLdScript, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Glosario GEO · GEO, SEO, AEO, Fan-outs, CDN, Tokens y más",
  description:
    "Glosario de N3 Labs: qué es GEO, SEO, AIO, AEO, fan-outs, CDN, Markdown, tokens, llms.txt, agentes y agentes orquestadores, explicado en corto.",
  path: "/glosario",
});

function resolve(value: string | undefined): Lang | null {
  return value === "en" || value === "es" ? value : null;
}

export default async function GlosarioPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const initialLang: Lang =
    resolve(sp.lang) ?? resolve(cookieStore.get("n3-lang")?.value) ?? resolve(cookieStore.get("n3-geo")?.value) ?? "es";

  const g = glossary[initialLang];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: g.title,
    url: `${SITE_URL}/glosario`,
    inLanguage: initialLang,
    hasDefinedTerm: g.terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.def,
      inDefinedTermSet: `${SITE_URL}/glosario`,
    })),
  };

  return (
    <LanguageProvider initialLang={initialLang}>
      <main className="min-h-screen bg-[#06060c]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
        <Nav />
        <GlossaryView />
        <Footer />
      </main>
    </LanguageProvider>
  );
}
