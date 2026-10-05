/** Noticias del laboratorio: artículos y reportes de N3, en /noticias. */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ol" | "ul"; items: string[] }
  | { type: "finding"; title: string; text: string }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string };

export type Article = {
  slug: string;
  title: string;
  kicker: string;
  dek: string;
  author: string;
  /** ISO date (YYYY-MM-DD). */
  published: string;
  /** Repo folder with the raw results, so every number can be audited. */
  dataPath?: string;
  body: Block[];
};

export const ARTICLES: Article[] = [
  {
    slug: "ranking-n3-geo-automotriz-legibilidad",
    kicker: "Ranking N3 GEO · Sector automotriz en México",
    title: "¿Las IAs pueden leer a las marcas de autos?",
    dek: "Revisamos los sitios de 16 marcas en México. Solo 2 le dicen a una máquina cuánto cuesta su auto.",
    author: "Ricardo Moncada",
    published: "2026-10-05",
    dataPath: "tools/geo-visibility/resultados/ranking-automotriz/2026-10-05",
    body: [
      {
        type: "p",
        text: "Cada vez más personas le preguntan a una inteligencia artificial antes de comprar un auto: qué SUV conviene, qué pickup aguanta más, cuál cuesta menos mantener. La IA responde con nombres de marcas y modelos. La pregunta que nos interesa es simple: ¿qué marcas está recomendando, y por qué?",
      },
      {
        type: "p",
        text: "El Ranking N3 GEO mide eso en dos partes. La segunda, que publicaremos después, mide a quién recomiendan las IAs cuando un comprador pregunta sin nombrar ninguna marca. Esta primera entrega mide algo que viene antes: si las IAs pueden leer los sitios de las marcas y entender qué venden, a qué precio y quién está detrás. Una marca que la IA no puede leer bien depende de lo que digan otros sitios sobre ella.",
      },
      { type: "h2", text: "Cómo lo medimos" },
      { type: "p", text: "Revisamos en vivo el sitio oficial en México de 16 marcas, el 5 de octubre de 2026. En cada uno:" },
      {
        type: "ol",
        items: [
          "Pedimos la portada como lo hacen los bots de búsqueda de ChatGPT, Perplexity y Claude, para ver si el servidor los deja entrar o los rechaza.",
          "Revisamos si la portada se puede leer sin ejecutar código, si dice claramente de qué trata y si declara quién es la empresa en datos estructurados (el formato que las máquinas leen para entender una marca).",
          "Revisamos la página de un modelo de su catálogo actual, tomado de su propio menú, para ver si le dice a una máquina qué auto es, de qué marca y a qué precio.",
        ],
      },
      {
        type: "p",
        text: "Con lo primero y lo segundo damos una calificación técnica de 0 a 100. Lo tercero lo reportamos aparte, porque es lo que más pesa cuando alguien pregunta por un modelo concreto.",
      },
      { type: "h2", text: "Los resultados" },
      {
        type: "table",
        head: ["Marca", "Calificación técnica (portada)", "Bots de IA en su servidor", "Empresa declarada", "Página de modelo revisada"],
        rows: [
          ["Jeep", "100", "Los deja entrar", "Sí", "Compass: sin datos estructurados"],
          ["Nissan", "98", "Los deja entrar", "Sí", "X-Trail: declara el producto con precio en pesos"],
          ["Volkswagen", "98", "Los deja entrar", "Sí", "Tiguan: declara el auto, sin precio"],
          ["Chirey", "97", "Los deja entrar", "Sí", "Tiggo 7 Pro: datos de la empresa, no del auto"],
          ["Hyundai", "95", "Los deja entrar", "Sí", "Tucson: datos de la página, no del auto"],
          ["Renault", "94", "Los deja entrar", "Sí", "Duster: datos de la empresa, no del auto"],
          ["Suzuki", "89", "Los deja entrar", "Sí", "Fronx: declara el auto con precio en pesos"],
          ["Chevrolet", "83", "Rechaza a ChatGPT, Perplexity y Claude", "Sí", "Tracker: sin datos estructurados"],
          ["Mazda", "83", "Los deja entrar", "No", "CX-5: solo ruta de navegación, no del auto"],
          ["Honda", "83", "Los deja entrar", "No", "CR-V: sin datos estructurados"],
          ["Kia", "81", "Los deja entrar", "No", "Sportage: sin datos estructurados"],
          ["Mitsubishi", "81", "Los deja entrar", "No", "Outlander: sin datos estructurados"],
          ["MG", "81", "Los deja entrar", "No", "ZS: sin datos estructurados"],
          ["Ford", "70", "Rechaza a ChatGPT, Perplexity y Claude", "No", "Territory: tiene precio, pero el código está roto y los buscadores lo ignoran"],
          ["Toyota", "63", "Rechaza a ChatGPT y Perplexity", "No", "RAV4 híbrida: sin datos estructurados"],
          ["BYD", "57", "Los deja entrar", "No", "Song Plus: sin datos estructurados"],
        ],
        caption: "Revisión del 5 de octubre de 2026. Suzuki se midió en autos.suzuki.com.mx, su sitio de autos.",
      },
      { type: "h2", text: "Lo que encontramos" },
      {
        type: "finding",
        title: "Solo 2 de 16 marcas le dicen a una máquina cuánto cuesta su auto.",
        text: "Nissan (X-Trail) y Suzuki (Fronx) declaran el modelo con su precio en pesos. Volkswagen declara el Tiguan, pero sin precio. Las otras 13 dejan que la IA saque el precio de donde pueda: comparadores, reseñas o sitios de seminuevos.",
      },
      {
        type: "finding",
        title: "Ford lo intentó y lo rompió.",
        text: "La página de la Territory trae su ficha con precio y existencia, pero el código tiene un error que la vuelve ilegible, así que los buscadores la descartan completa.",
      },
      {
        type: "finding",
        title: "Tres de las marcas más grandes le cierran la puerta a la IA.",
        text: "Chevrolet, Ford y Toyota permiten a los bots de IA en sus reglas de acceso, pero su servidor los rechaza cuando llegan. Es una señal fuerte, aunque no definitiva: los bots reales también se identifican por su dirección de red, y eso no lo podemos replicar.",
      },
      { type: "finding", title: "La mitad no dice quién es.", text: "8 de las 16 marcas no declaran en su portada quién es la empresa detrás del sitio." },
      {
        type: "finding",
        title: "Una buena portada no basta.",
        text: "Jeep saca 100 en la portada, pero la página de su Compass no tiene ningún dato estructurado. La IA llega a la marca, pero no al auto.",
      },
      { type: "h2", text: "Límites que reconocemos" },
      {
        type: "ul",
        items: [
          "Es una foto del 5 de octubre de 2026. Los sitios cambian.",
          "Revisamos una página de modelo por marca, no todo el catálogo.",
          "Esta entrega no mide si las IAs recomiendan a cada marca: eso es la segunda parte del ranking.",
          "Ninguna marca pagó por aparecer ni puede pagar por subir.",
          "Todos los resultados están guardados y se pueden auditar.",
        ],
      },
      { type: "h2", text: "Qué sigue" },
      {
        type: "p",
        text: "En la segunda entrega le haremos a las IAs las preguntas que hace un comprador de auto en México, varias veces cada una, y mediremos qué marcas aparecen, cuáles enlazan a su sitio y en qué lugar las nombran. Cada cifra irá con su rango probable: si dos marcas quedan dentro del margen, las reportaremos como empatadas.",
      },
    ],
  },
];

export function getArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });
}
