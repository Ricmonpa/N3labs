import { cookies } from "next/headers";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/** Nav and footer around the news pages, in the visitor's language. */
export default async function NewsShell({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get("n3-lang")?.value;
  const initialLang: Lang = saved === "en" ? "en" : "es";
  return (
    <LanguageProvider initialLang={initialLang}>
      <main className="min-h-screen bg-[#06060c]">
        <Nav />
        {children}
        <Footer />
      </main>
    </LanguageProvider>
  );
}
