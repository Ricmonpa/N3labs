import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import Prompter from "@/components/Prompter";
import LeadGate from "@/components/LeadGate";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Prompter by N3 · Constructor de prompts gratis",
  description:
    "Herramienta gratuita de N3 Thinktech: responde unos campos y arma el prompt perfecto para ChatGPT, Gemini, Claude, Meta AI o Copilot.",
  path: "/prompter",
});

function resolve(value: string | undefined): Lang | null {
  return value === "en" || value === "es" ? value : null;
}

export default async function PrompterPage({
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
        <LeadGate>
          <Prompter />
        </LeadGate>
        <Footer />
      </main>
    </LanguageProvider>
  );
}
