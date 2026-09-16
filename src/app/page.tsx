import { cookies } from "next/headers";
import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, pageMetadata } from "@/lib/site";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Artifacts from "@/components/Artifacts";
import IAFisica from "@/components/IAFisica";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const metadata: Metadata = pageMetadata({ title: SITE_NAME, description: SITE_DESCRIPTION, path: "/" });

function resolve(value: string | undefined): Lang | null {
  return value === "en" || value === "es" ? value : null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();

  // Priority: ?lang= link → user's toggle choice → geo default → Spanish
  const initialLang: Lang =
    resolve(sp.lang) ??
    resolve(cookieStore.get("n3-lang")?.value) ??
    resolve(cookieStore.get("n3-geo")?.value) ??
    "es";

  return (
    <LanguageProvider initialLang={initialLang}>
      <main className="min-h-screen bg-[#06060c]">
        <Nav />
        <Hero />
        <Services />
        <Artifacts />
        <IAFisica />
        <Process />
        <Contact />
        <Footer />
      </main>
    </LanguageProvider>
  );
}
