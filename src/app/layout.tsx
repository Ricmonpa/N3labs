import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import AttributionTracker from "@/components/Attribution";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, pageMetadata, organizationJsonLd, jsonLdScript } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Site-wide defaults. Canonical and og:url are set per page, so they're left out here.
const defaults = pageMetadata({ title: SITE_NAME, description: SITE_DESCRIPTION, path: "/" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: defaults.title,
  description: defaults.description,
  openGraph: { ...defaults.openGraph, url: undefined },
  twitter: defaults.twitter,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd) }}
        />
        <AttributionTracker />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
