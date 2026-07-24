import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import AttributionTracker from "@/components/Attribution";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "N3 Thinktech · IA Laboratory",
  description: "Construimos sistemas de inteligencia artificial para empresas que no pueden permitirse quedarse atrás.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("n3-lang")?.value ?? cookieStore.get("n3-geo")?.value;
  const lang = cookieLang === "en" ? "en" : "es";

  return (
    <html lang={lang} className={inter.variable}>
      <body className="antialiased">
        <AttributionTracker />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
