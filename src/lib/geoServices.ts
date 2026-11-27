// Contenido de /servicios-geo y /articulos-geo (ES/EN). Editar aqui, no en los componentes.

export type Lang2 = "es" | "en";

export const WA_NUMBER = "525529050452";
export const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export type Weight = { pct: number; title: string; desc: string; tags?: string[] };
export type Service = { id: string; title: string; desc: string; ctas?: { label: string; href: string; external?: boolean }[] };

type ServicesCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  weightsTitle: string;
  weightsSub: string;
  weights: Weight[];
  weightsFoot: [string, string];
  weightsModel: string;
  servicesTitle: string;
  servicesLead: string;
  services: Service[];
  ctaTitle: string;
  ctaSub: string;
  ctaBtn: string;
  ctaMsg: string;
};

export const geoServices: Record<Lang2, ServicesCopy> = {
  es: {
    eyebrow: "GEO · Posicionamiento en IAs",
    title: "Servicios GEO",
    lead: "Primero, cómo piensan las IAs: esto es lo que pesa en que ChatGPT, Claude, Gemini, Perplexity o Copilot te recomienden. Después, cómo lo trabajamos contigo.",
    weightsTitle: "¿Qué hace que una IA te recomiende?",
    weightsSub: "Peso de cada actividad en tu visibilidad ante ChatGPT, Claude, Gemini, Perplexity y Copilot.",
    weights: [
      { pct: 40, title: "Menciones de marca en sitios de terceros", desc: "Consenso y validación externa: la “verdad fáctica” con la que la IA compara marcas y fundamenta recomendaciones (Reddit, medios, reseñas)." },
      { pct: 25, title: "Sitio web oficial · arquitectura semántica", desc: "Ground truth: especificaciones, precios, catálogo y JSON-LD que la IA corrobora tras detectarte en terceros." },
      { pct: 15, title: "CDN con agente inteligente", desc: "Ingestión en el borde: Markdown limpio en milisegundos, sin timeouts ni sobrecarga de JS/CSS/banners." },
      { pct: 12, title: "Contenido de marca en Redes Sociales", desc: "Indexación contextual: lo que la marca dice y publica en redes abiertas.", tags: ["YouTube: mucho peso · transcripciones para Gemini/ChatGPT", "LinkedIn: clave en B2B · Bing/Copilot"] },
      { pct: 8, title: "Contenido de empleados (Employee Advocacy)", desc: "Autoridad técnica en el grafo de conocimiento.", tags: ["+8% autoridad técnica y metodologías", "0% juicio vs. competidores (sesgo de parte interesada)"] },
    ],
    weightsFoot: ["100% · ecosistema balanceado", "Credibilidad + infraestructura + contenido"],
    weightsModel: "Modelo de ponderación N3 Labs",
    servicesTitle: "Lo que hacemos por tu marca",
    servicesLead: "Cinco servicios, del diagnóstico a la implementación.",
    services: [
      { id: "a", title: "Diagnóstico de marca o sitio web en GEO", desc: "Medimos qué tan legible y recomendable eres para cada IA. Empieza gratis: haz el test y mira dónde estás hoy.", ctas: [
        { label: "Hacer el test gratis (Geo Scan)", href: "/geotest.html" },
        { label: "N3 GeoTool · herramienta completa", href: "/demo-geo" },
      ] },
      { id: "b", title: "Rankings vs competencia", desc: "Cómo apareces frente a tus competidores en las respuestas de cada IA: quién es citado, quién es recomendado y por qué." },
      { id: "c", title: "Optimización de CDN con Markdown y “agente anfitrión”", desc: "Entregamos a las IAs una versión limpia de tu sitio en Markdown desde el borde, y un agente anfitrión que recibe a los agentes que te visitan y les da la información correcta." },
      { id: "d", title: "G3olink", desc: "Tus empleados y ejecutivos publican en LinkedIn, blog, Substack y redes con educación GEO, con ranking de embajadores. Es la capa de employee advocacy del modelo." },
      { id: "e", title: "Implementación y capacitación con Neuroescritura, en alianza con Banshee", desc: "Aprende a escribir para personas y modelos de IA a la vez, e impleméntalo en tu contenido con el apoyo editorial de Banshee.", ctas: [
        { label: "Conocer Banshee", href: "https://banshee.digital", external: true },
      ] },
    ],
    ctaTitle: "¿Hablamos de tu estrategia de Transformación Digital?",
    ctaSub: "Escríbeme por WhatsApp y platicamos cómo transformar tu negocio con fundamento científico.",
    ctaBtn: "Consultoría por WhatsApp",
    ctaMsg: "Engel, me interesa transformar mi negocio con fundamento científico.",
  },
  en: {
    eyebrow: "GEO · Positioning in AIs",
    title: "GEO services",
    lead: "First, how AIs think: this is what weighs in ChatGPT, Claude, Gemini, Perplexity or Copilot recommending you. Then, how we work on it with you.",
    weightsTitle: "What makes an AI recommend you?",
    weightsSub: "Weight of each activity in your visibility across ChatGPT, Claude, Gemini, Perplexity and Copilot.",
    weights: [
      { pct: 40, title: "Brand mentions on third-party sites", desc: "Consensus and external validation: the “factual truth” AI uses to compare brands and ground its recommendations (Reddit, media, reviews)." },
      { pct: 25, title: "Official website · semantic architecture", desc: "Ground truth: specifications, prices, catalog and JSON-LD that AI corroborates after detecting you on third-party sites." },
      { pct: 15, title: "CDN with an intelligent agent", desc: "Ingestion at the edge: clean Markdown in milliseconds, with no timeouts or JS/CSS/banner overload." },
      { pct: 12, title: "Brand content on social media", desc: "Contextual indexing: what the brand says and publishes on open networks.", tags: ["YouTube: heavy weight · transcripts for Gemini/ChatGPT", "LinkedIn: key in B2B · Bing/Copilot"] },
      { pct: 8, title: "Employee content (Employee Advocacy)", desc: "Technical authority in the knowledge graph.", tags: ["+8% technical authority and methodologies", "0% judgment vs. competitors (interested-party bias)"] },
    ],
    weightsFoot: ["100% · balanced ecosystem", "Credibility + infrastructure + content"],
    weightsModel: "N3 Labs weighting model",
    servicesTitle: "What we do for your brand",
    servicesLead: "Five services, from diagnosis to implementation.",
    services: [
      { id: "a", title: "GEO diagnosis of your brand or website", desc: "We measure how readable and recommendable you are to each AI. Start for free: take the test and see where you stand today.", ctas: [
        { label: "Take the free test (Geo Scan)", href: "/geotest-en.html" },
        { label: "N3 GeoTool · full tool", href: "/demo-geo" },
      ] },
      { id: "b", title: "Rankings vs. competitors", desc: "How you show up against your competitors in each AI’s answers: who is cited, who is recommended, and why." },
      { id: "c", title: "CDN optimization with Markdown and a “host agent”", desc: "We deliver a clean Markdown version of your site to AIs from the edge, plus a host agent that receives the agents visiting you and gives them the right information." },
      { id: "d", title: "G3olink", desc: "Your employees and executives publish on LinkedIn, blogs, Substack and social media with GEO training, with an ambassador ranking. It is the employee-advocacy layer of the model." },
      { id: "e", title: "Implementation and training in Neurowriting (Neuroescritura), in partnership with Banshee", desc: "Learn to write for people and AI models at the same time, and implement it in your content with Banshee’s editorial support.", ctas: [
        { label: "Meet Banshee", href: "https://banshee.digital", external: true },
      ] },
    ],
    ctaTitle: "Shall we talk about your Digital Transformation strategy?",
    ctaSub: "Message me on WhatsApp and let’s talk about how to transform your business on a scientific foundation.",
    ctaBtn: "Consulting on WhatsApp",
    ctaMsg: "Engel, I want to transform my business on a scientific foundation.",
  },
};

export type Article = { url: string; lang: Lang2; title: string; author: string; summary: Record<Lang2, string> };

export const geoArticles: { es: { title: string; lead: string; read: string; inLang: Record<Lang2, string> }; en: { title: string; lead: string; read: string; inLang: Record<Lang2, string> }; items: Article[] } = {
  es: { title: "Artículos de interés", lead: "Lecturas de Engel Fonseca en Neurona Magazine.", read: "Leer artículo", inLang: { es: "Artículo en español", en: "Artículo en inglés" } },
  en: { title: "Articles of interest", lead: "Reading by Engel Fonseca in Neurona Magazine.", read: "Read article", inLang: { es: "Article in Spanish", en: "Article in English" } },
  items: [
    {
      url: "https://neuronamagazine.com/solo-el-11-de-las-empresas-configuran-el-futuro-con-ia/",
      lang: "es",
      title: "Solo el 11% de las empresas configuran el futuro desde el presente con la IA",
      author: "Engel Fonseca",
      summary: {
        es: "Según un estudio de NTT DATA e IAB México, el 69% de las empresas latinoamericanas usa la IA para contenidos y diseño, pero solo el 11% la aplica a modelos predictivos. La inteligencia, argumenta el autor, es prevenir y elegir el futuro desde el presente.",
        en: "According to an NTT DATA and IAB México study, 69% of Latin American companies use AI for content and design, yet only 11% apply it to predictive models. Intelligence, the author argues, is preventing and choosing the future from the present.",
      },
    },
    {
      url: "https://neuronamagazine.com/only-11-of-companies-configure-the-future-with-ai/",
      lang: "en",
      title: "Only 11% of Companies Configure the Future from the Present with AI",
      author: "Engel Fonseca",
      summary: {
        es: "A partir de un estudio de 2026 de NTT DATA e IAB México, el artículo señala que la mayoría de las marcas latinoamericanas usa la IA para contenido y productividad, y solo cerca del 11% para modelos predictivos. Propone usarla para anticipar futuros probables y no solo reaccionar.",
        en: "Citing a 2026 NTT DATA and IAB México study, the article notes that most Latin American brands use AI mainly for content and productivity, while only about 11% use it for predictive models. It argues for anticipating probable futures instead of only reacting.",
      },
    },
  ],
};
