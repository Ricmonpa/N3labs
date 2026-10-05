import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { ARTICLES, formatDate, getArticle, type Block } from "@/lib/news";
import { jsonLdScript, pageMetadata, SITE_URL } from "@/lib/site";
import { ENGEL_CALENDLY } from "@/components/Calendly";
import NewsShell from "../shell";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return {};
  const meta = pageMetadata({ title: `${article.title} · N3`, description: article.dek, path: `/noticias/${article.slug}` });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: article.published, authors: [article.author] } };
}

const REPO = "https://github.com/Ricmonpa/N3labs/tree/main/";

function Content({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-12 mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-red-500">{block.text}</h2>;
    case "p":
      return <p className="mt-4 text-zinc-300 text-base leading-relaxed">{block.text}</p>;
    case "ol":
    case "ul": {
      const List = block.type;
      return (
        <List className={`mt-4 space-y-2 pl-5 text-zinc-300 leading-relaxed ${block.type === "ol" ? "list-decimal" : "list-disc"} marker:text-red-500`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </List>
      );
    }
    case "finding":
      return (
        <div className="mt-4 glass rounded-xl border border-white/[0.06] p-5">
          <p className="text-white font-semibold">{block.title}</p>
          <p className="mt-1.5 text-zinc-400 text-sm leading-relaxed">{block.text}</p>
        </div>
      );
    case "table":
      return (
        <figure className="mt-4">
          <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  {block.head.map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 align-bottom">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row[0]} className="border-t border-white/[0.06]">
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="px-4 py-3 text-left font-semibold text-white">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className={`px-4 py-3 align-top ${i === 1 ? "font-mono text-white tabular-nums" : "text-zinc-300"}`}>
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && <figcaption className="mt-2 text-xs text-zinc-500">{block.caption}</figcaption>}
        </figure>
      );
  }
}

export default async function ArticlePage({ params }: PageProps<"/noticias/[slug]">) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const url = `${SITE_URL}/noticias/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.dek,
    datePublished: article.published,
    dateModified: article.published,
    inLanguage: "es-MX",
    url,
    mainEntityOfPage: url,
    author: { "@type": "Person", "@id": `${SITE_URL}/#ricardo-moncada`, name: article.author },
    publisher: { "@id": `${SITE_URL}/#organization` },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };

  return (
    <NewsShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <article className="relative px-6 pt-32 pb-24 grid-bg">
        <div className="relative z-10 max-w-3xl mx-auto">
          <Link href="/noticias" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft size={14} /> Noticias
          </Link>
          <p className="mt-8 text-xs font-semibold tracking-[0.15em] uppercase text-red-400">{article.kicker}</p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-black text-white leading-tight text-balance">{article.title}</h1>
          <p className="mt-4 text-lg text-zinc-300 font-light leading-relaxed">{article.dek}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <span className="text-zinc-300">Por {article.author}</span>
            <span aria-hidden>·</span>
            <span>N3 Thinktech IA Laboratory</span>
            <span aria-hidden>·</span>
            <time dateTime={article.published}>{formatDate(article.published)}</time>
          </p>

          <div className="mt-6 border-t border-white/[0.06]">
            {article.body.map((block, i) => (
              <Content key={i} block={block} />
            ))}
          </div>

          {article.dataPath && (
            <p className="mt-10 text-xs text-zinc-500">
              Datos completos de la revisión:{" "}
              <a href={`${REPO}${article.dataPath}`} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline underline-offset-2">
                resultados en GitHub
              </a>
              .
            </p>
          )}

          <div className="mt-10 rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-950/30 to-transparent p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white">¿Cómo sale tu marca?</h2>
            <p className="mt-1.5 text-zinc-400 text-sm leading-relaxed">
              Revisamos si las IAs pueden leer tu sitio y le hacemos las preguntas que haría tu cliente, para ver si te recomiendan a ti o a tu competencia.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={ENGEL_CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-3 transition-colors"
              >
                <Calendar size={15} /> Agendar una llamada
              </a>
              <Link
                href="/geotest.html"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 hover:border-red-500/50 text-zinc-300 text-sm font-semibold px-6 py-3 transition-colors"
              >
                Probar el Scan GEO
              </Link>
            </div>
          </div>
        </div>
      </article>
    </NewsShell>
  );
}
