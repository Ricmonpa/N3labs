import type { Metadata } from "next";

export const SITE_URL = "https://n3labs.potenttial.site";
export const SITE_NAME = "N3 Thinktech · IA Laboratory";
export const SITE_DESCRIPTION =
  "Construimos sistemas de inteligencia artificial para empresas que no pueden permitirse quedarse atrás.";

// Official N3 profiles (LinkedIn, Instagram, YouTube, Wikidata…).
// They become `sameAs` in the Organization JSON-LD. Only add real URLs.
export const SAME_AS: string[] = [];

// The shared card comes from src/app/opengraph-image.tsx (1200×630, generated).
// Metadata here must not set `images`, or it would override that file.

/** Per-page metadata with canonical URL and complete Open Graph (page fields replace the layout's). */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "es_MX",
      url: path,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "N3 Thinktech IA Laboratory",
      alternateName: ["N3 Labs", "N3 Thinktech"],
      url: SITE_URL,
      logo: `${SITE_URL}/n3-logo.png`,
      description: SITE_DESCRIPTION,
      knowsAbout: [
        "Inteligencia artificial",
        "Generative Engine Optimization",
        "IA física",
        "Automatización con IA",
      ],
      ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
      founder: [
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#engel-fonseca`,
          name: "Engel Fonseca",
          sameAs: ["https://www.linkedin.com/in/engelfonseca/"],
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#ricardo-moncada`,
          name: "Ricardo Moncada",
          sameAs: ["https://www.linkedin.com/in/rmp08/"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ["es", "en"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

/** Serializes JSON-LD for a <script> tag, escaping "<" so content can't close the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, String.fromCharCode(92) + "u003c");
}
