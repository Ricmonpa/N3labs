// Glosario GEO: se muestra en /glosario y alimenta el JSON-LD (DefinedTermSet) de esa página.
// Agregar o quitar un término = un objeto en cada idioma.

export type GlossaryTerm = { term: string; sub: string; def: string; n3?: string };

export const glossary: Record<"es" | "en", { title: string; intro: string; placeholder: string; none: string; n3: string; propose: { title: string; btn: string; msg: string }; terms: GlossaryTerm[] }> = {
  es: {
    title: "Glosario GEO",
    intro: "Los términos que verás cuando se hable de visibilidad en IA, explicados en corto.",
    placeholder: "Buscar un término…",
    none: "Sin resultados.",
    n3: "En N3",
    propose: { title: "¿Falta un término?", btn: "Proponer un término por WhatsApp", msg: "te recomiendo agregar el término: " },
    terms: [
      { term: "GEO", sub: "Generative Engine Optimization", def: "Optimizar tu marca y tu contenido para que las IA generativas (ChatGPT, Gemini, Claude, Perplexity, Copilot) te citen, mencionen y recomienden en sus respuestas. Es la evolución del SEO.", n3: "No hay un solo GEO sino un GEO sistémico: cada IA piensa distinto (SPA), así que se trabaja motor por motor." },
      { term: "SEO", sub: "Search Engine Optimization", def: "Optimizar tu sitio para aparecer en la lista de resultados de Google o Bing. Sigue siendo la base, pero cada vez más búsquedas terminan sin un solo clic." },
      { term: "AIO", sub: "AI Optimization · IAO", def: "Término amplio para ajustar tu contenido a que los sistemas de IA lo entiendan y lo usen. Incluye al GEO y al AEO." },
      { term: "AEO", sub: "Answer Engine Optimization", def: "Preparar tu contenido para ser la respuesta directa que dan los buscadores con IA, asistentes y snippets: preguntas claras, respuestas cortas y verificables." },
      { term: "Fan-outs", sub: "Query fan-out", def: "Cuando una IA recibe una pregunta, la descompone y lanza varias búsquedas internas en paralelo antes de responder. Tu marca no compite por una palabra clave, sino por varias sub-preguntas.", n3: "El N3 GeoTool mide qué busca cada IA por dentro antes de contestar." },
      { term: "CDN", sub: "Content Delivery Network", def: "Red de servidores que entrega tu sitio rápido desde puntos cercanos al visitante. También puede servir a los agentes de IA una versión más legible de tu sitio.", n3: "En el modelo GEO de N3, un CDN con agente inteligente pesa 15% en la recomendación." },
      { term: "Markdown", sub: "Texto con estructura simple", def: "Formato de texto plano con marcas sencillas (#, -, **) para títulos, listas y énfasis. Las IA lo procesan con mucha menos fricción que un HTML recargado." },
      { term: "Tokens", sub: "Unidad de texto de la IA", def: "Fragmentos en que una IA divide el texto para leerlo y escribirlo (aprox. 3 a 4 caracteres). Se cobra y se limita por tokens: menos tokens, respuesta más barata y rápida." },
      { term: "Mapa LLM (llms.txt)", sub: "Mapa de tu sitio para IA", def: "Archivo de texto en la raíz de tu sitio (tusitio.com/llms.txt) que resume qué contiene y dónde está lo importante, para que las IA lo encuentren. Es una propuesta abierta: no todos los motores lo leen aún." },
      { term: "Agente", sub: "Agente de IA", def: "Sistema de IA que no solo responde: decide pasos y usa herramientas (buscar, leer, escribir, ejecutar) para cumplir un objetivo." },
      { term: "Agente orquestador", sub: "Coordinador de agentes", def: "Agente que dirige a otros agentes especializados: reparte tareas, junta resultados y decide el siguiente paso.", n3: "En las presentaciones de N3 se le llama AGO." },
      { term: "LLM", sub: "Large Language Model", def: "Modelo de lenguaje entrenado con enormes cantidades de texto, el motor detrás de ChatGPT, Gemini o Claude." },
      { term: "Prompt", sub: "Instrucción a la IA", def: "La pregunta o instrucción que le das a una IA. Cómo la formulas cambia la calidad de la respuesta." },
      { term: "Schema · JSON-LD", sub: "Datos estructurados", def: "Etiquetas invisibles en tu página que describen quién eres, qué ofreces y dónde estás, en un formato que las máquinas entienden sin adivinar." },
      { term: "E-E-A-T", sub: "Experiencia, Especialización, Autoridad, Confianza", def: "Criterios con los que buscadores e IA juzgan si eres una fuente confiable. Las menciones de terceros pesan mucho.", n3: "En el modelo GEO de N3, las menciones de terceros son el factor más grande: 40%." },
      { term: "SPH · SPA", sub: "Sistemas de pensamiento", def: "SPH: tu Sistema de Pensamiento Humano (cómo piensas). SPA: el Sistema de Pensamiento Artificial, cómo una IA prioriza, filtra y reacciona. La IA rinde más cuando tu SPH la guía." },
    ],
  },
  en: {
    title: "GEO glossary",
    intro: "The terms you will meet when visibility in AI comes up, explained briefly.",
    placeholder: "Search a term…",
    none: "No results.",
    n3: "At N3",
    propose: { title: "Missing a term?", btn: "Suggest a term on WhatsApp", msg: "I recommend adding the term: " },
    terms: [
      { term: "GEO", sub: "Generative Engine Optimization", def: "Optimizing your brand and content so generative AIs (ChatGPT, Gemini, Claude, Perplexity, Copilot) cite, mention and recommend you in their answers. It is the evolution of SEO.", n3: "There is no single GEO but a systemic GEO: each AI thinks differently (ATS), so it is worked engine by engine." },
      { term: "SEO", sub: "Search Engine Optimization", def: "Optimizing your site to appear in Google or Bing result lists. Still the foundation, but more and more searches end without a single click." },
      { term: "AIO", sub: "AI Optimization", def: "A broad term for adjusting your content so AI systems understand and use it. It includes GEO and AEO." },
      { term: "AEO", sub: "Answer Engine Optimization", def: "Preparing your content to be the direct answer given by AI search, assistants and snippets: clear questions, short and verifiable answers." },
      { term: "Fan-outs", sub: "Query fan-out", def: "When an AI receives a question, it breaks it down and runs several internal searches in parallel before answering. Your brand does not compete for one keyword but for several sub-questions.", n3: "The N3 GeoTool measures what each AI searches for internally before replying." },
      { term: "CDN", sub: "Content Delivery Network", def: "A network of servers that delivers your site quickly from points close to the visitor. It can also serve AI agents a more readable version of your site.", n3: "In N3’s GEO model, a CDN with an intelligent agent weighs 15% in the recommendation." },
      { term: "Markdown", sub: "Simply structured text", def: "A plain-text format with simple marks (#, -, **) for headings, lists and emphasis. AIs process it with far less friction than heavy HTML." },
      { term: "Tokens", sub: "An AI’s unit of text", def: "Pieces an AI splits text into to read and write it (about 3 to 4 characters). Pricing and limits are per token: fewer tokens, a cheaper and faster answer." },
      { term: "LLM map (llms.txt)", sub: "A map of your site for AI", def: "A text file at the root of your site (yoursite.com/llms.txt) summarizing what it contains and where the important parts are, so AIs can find them. It is an open proposal: not every engine reads it yet." },
      { term: "Agent", sub: "AI agent", def: "An AI system that does more than answer: it decides steps and uses tools (search, read, write, run) to reach a goal." },
      { term: "Orchestrator agent", sub: "Agent coordinator", def: "An agent that directs other specialized agents: it assigns tasks, gathers results and decides the next step.", n3: "In N3 presentations it is called AGO." },
      { term: "LLM", sub: "Large Language Model", def: "A language model trained on huge amounts of text, the engine behind ChatGPT, Gemini or Claude." },
      { term: "Prompt", sub: "Instruction to the AI", def: "The question or instruction you give an AI. How you phrase it changes the quality of the answer." },
      { term: "Schema · JSON-LD", sub: "Structured data", def: "Invisible tags on your page that describe who you are, what you offer and where you are, in a format machines understand without guessing." },
      { term: "E-E-A-T", sub: "Experience, Expertise, Authoritativeness, Trust", def: "Criteria search engines and AIs use to judge whether you are a reliable source. Third-party mentions weigh a lot.", n3: "In N3’s GEO model, third-party mentions are the biggest factor: 40%." },
      { term: "HTS · ATS", sub: "Thinking systems", def: "HTS: your Human Thinking System (how you think). ATS: the Artificial Thinking System, how an AI prioritizes, filters and reacts. AI performs best when your HTS guides it." },
    ],
  },
};
