import type { Entity, PromptType } from "./types.ts";

/**
 * Catálogo fijo de industrias en México: marcas reales con su dominio verificado y las preguntas
 * que haría un cliente. Sirve para el demo público y para armar un scan sin pedirle nada a una IA.
 *
 * Ninguna pregunta nombra a una marca: así cualquier marca de la industria puede ser "la tuya"
 * en el demo, y lo que se mide es si la IA la recomienda sin que se la pidan.
 * `{lugar}` se reemplaza por la ciudad o el país del estudio.
 */
export type Industry = {
  id: string;
  label: string;
  /** Una frase: qué compara la medición. */
  about: string;
  /** Palabras que delatan la industria en el texto de un sitio (sin acentos, en minúsculas). */
  keywords: string[];
  brands: Entity[];
  prompts: { type: PromptType; text: string }[];
};

const q = (type: PromptType) => (text: string) => ({ type, text });
const cat = q("category");
const pro = q("problem");
const cmp = q("comparison");

export const INDUSTRIES: Industry[] = [
  {
    id: "autos",
    label: "Autos",
    about: "Marcas de autos nuevos que la IA recomienda a quien quiere comprar coche en México.",
    keywords: ["autos", "auto nuevo", "vehiculos", "camionetas", "suv", "sedan", "pickup", "agencia", "concesionario", "prueba de manejo", "versiones", "motor", "hibrido"],
    brands: [
      { name: "Nissan", aliases: ["Nissan México"], domains: ["nissan.com.mx"] },
      { name: "Chevrolet", aliases: ["Chevrolet México"], domains: ["chevrolet.com.mx"] },
      { name: "Volkswagen", aliases: ["VW"], domains: ["vw.com.mx"] },
      { name: "Toyota", aliases: ["Toyota México"], domains: ["toyota.mx"] },
      { name: "Kia", aliases: ["Kia México"], domains: ["kia.com"] },
      { name: "Mazda", aliases: ["Mazda México"], domains: ["mazda.mx"] },
      { name: "Honda", aliases: ["Honda México"], domains: ["honda.mx"] },
      { name: "MG", aliases: ["MG Motor"], domains: ["mgmotor.com.mx"] },
      { name: "BYD", aliases: [], domains: ["byd.com"] },
    ],
    prompts: [
      cat("¿Cuáles son las mejores marcas de autos para comprar en {lugar}?"),
      cat("¿Qué auto nuevo me recomiendas comprar en {lugar} con un presupuesto de 350 mil pesos?"),
      cat("¿Cuál es la SUV más confiable que se vende en {lugar}?"),
      cat("¿Qué marcas de autos tienen el mejor servicio postventa en {lugar}?"),
      cat("¿Cuáles son los autos más vendidos en {lugar} este año?"),
      cat("¿Qué auto híbrido o eléctrico conviene comprar en {lugar}?"),
      cat("¿Cuál es el mejor auto familiar en {lugar} por menos de 500 mil pesos?"),
      cat("¿Qué marcas de autos tienen refacciones más baratas en {lugar}?"),
      cat("¿Qué pickup me recomiendas para trabajo en {lugar}?"),
      cat("¿Cuál es el auto más económico de mantener en {lugar}?"),
      cat("¿Qué marca de autos tiene el mejor financiamiento en {lugar}?"),
      cat("¿Cuál es el primer auto ideal para un joven en {lugar}?"),
      pro("Gasto mucho en gasolina con mi coche actual. ¿Qué auto rinde más por litro en {lugar}?"),
      pro("Necesito un auto seguro para mi familia, con buenas bolsas de aire y frenos. ¿Cuál me recomiendas en {lugar}?"),
      pro("Mi coche ya tiene 10 años y quiero cambiarlo. ¿Qué marca me da menos problemas mecánicos?"),
      pro("Voy a comprar mi primer auto a crédito en {lugar}. ¿Qué marca y modelo me conviene?"),
      pro("Manejo mucho en carretera por trabajo. ¿Qué auto me recomiendas en {lugar}?"),
      pro("Quiero un auto que no pierda tanto valor al revenderlo en {lugar}. ¿Cuál me recomiendas?"),
      pro("Tengo tres hijos y necesito una camioneta de siete pasajeros en {lugar}. ¿Cuál me recomiendas?"),
      pro("Me preocupa el robo de autos en {lugar}. ¿Qué marcas y modelos se roban menos?"),
      pro("Quiero pasarme a un auto eléctrico pero no sé si hay dónde cargarlo en {lugar}. ¿Qué me recomiendas?"),
      pro("Busco un auto para usar en plataformas de transporte en {lugar}. ¿Cuál conviene más?"),
      cmp("¿Conviene más comprar un auto japonés, coreano, alemán o chino en {lugar}?"),
      cmp("¿Qué es mejor en {lugar}: comprar un auto nuevo a crédito o uno seminuevo de contado?"),
      cmp("¿Conviene comprar un auto híbrido o uno de gasolina en {lugar}?"),
      cmp("¿Las marcas de autos chinas son buena opción en {lugar} frente a las tradicionales?"),
    ],
  },
  {
    id: "bancos",
    label: "Bancos",
    about: "Bancos que la IA recomienda para abrir cuenta, sacar tarjeta o pedir crédito en México.",
    keywords: ["banco", "cuenta de debito", "tarjeta de credito", "credito hipotecario", "prestamo personal", "banca movil", "cajeros", "inversion", "cat promedio", "condusef", "ipab"],
    brands: [
      { name: "BBVA", aliases: ["BBVA México", "Bancomer"], domains: ["bbva.mx"] },
      { name: "Banorte", aliases: [], domains: ["banorte.com"] },
      { name: "Santander", aliases: ["Santander México"], domains: ["santander.com.mx"] },
      { name: "Banamex", aliases: ["Citibanamex"], domains: ["banamex.com"] },
      { name: "HSBC", aliases: ["HSBC México"], domains: ["hsbc.com.mx"] },
      { name: "Nu", aliases: ["Nu México", "Nubank"], domains: ["nu.com.mx"] },
      { name: "Banco Azteca", aliases: [], domains: ["bancoazteca.com.mx"] },
      { name: "Scotiabank", aliases: ["Scotiabank México"], domains: ["scotiabank.com.mx"] },
    ],
    prompts: [
      cat("¿Cuál es el mejor banco en {lugar}?"),
      cat("¿Qué banco me recomiendas para abrir una cuenta de nómina en {lugar}?"),
      cat("¿Cuál es la mejor tarjeta de crédito para empezar en {lugar}?"),
      cat("¿Qué banco tiene la mejor app en {lugar}?"),
      cat("¿Qué banco da el mejor crédito hipotecario en {lugar}?"),
      cat("¿Cuál es la mejor cuenta de ahorro con rendimiento en {lugar}?"),
      cat("¿Qué banco cobra menos comisiones en {lugar}?"),
      cat("¿Cuál es el mejor banco para una pequeña empresa en {lugar}?"),
      cat("¿Qué tarjeta de crédito da más beneficios y puntos en {lugar}?"),
      cat("¿Dónde conviene pedir un préstamo personal en {lugar}?"),
      cat("¿Qué banco tiene mejor atención al cliente en {lugar}?"),
      cat("¿Cuáles son los bancos más seguros de {lugar}?"),
      pro("Me cobran muchas comisiones en mi banco actual. ¿A qué banco me cambio en {lugar}?"),
      pro("Nunca he tenido tarjeta de crédito y quiero empezar mi historial en {lugar}. ¿Qué me recomiendas?"),
      pro("Quiero comprar mi primera casa en {lugar}. ¿Qué banco me conviene para el crédito?"),
      pro("Me hicieron un cargo que no reconozco y mi banco no me ayudó. ¿Qué banco tiene mejor protección contra fraudes en {lugar}?"),
      pro("Soy freelance y no tengo nómina. ¿Qué banco me da tarjeta en {lugar}?"),
      pro("Tengo mis ahorros en una cuenta que no me da nada. ¿Dónde los pongo a rendir en {lugar}?"),
      pro("Tengo un negocio pequeño y necesito una terminal para cobrar con tarjeta. ¿Qué banco me recomiendas en {lugar}?"),
      pro("Tengo deudas en varias tarjetas. ¿Qué banco me puede ayudar a consolidarlas en {lugar}?"),
      pro("Me voy a mudar a otra ciudad de {lugar}. ¿Qué banco tiene más sucursales y cajeros?"),
      pro("Quiero mandar dinero a mi familia dentro de {lugar} sin pagar comisión. ¿Qué banco uso?"),
      cmp("¿Conviene más un banco digital o un banco tradicional en {lugar}?"),
      cmp("¿Qué es mejor para ahorrar en {lugar}: un banco, Cetes o una fintech?"),
      cmp("¿Conviene más una tarjeta de crédito sin anualidad o una con recompensas en {lugar}?"),
      cmp("¿Es mejor pedir crédito hipotecario al banco o con Infonavit en {lugar}?"),
    ],
  },
  {
    id: "seguros",
    label: "Seguros",
    about: "Aseguradoras que la IA recomienda para seguro de auto, gastos médicos y vida en México.",
    keywords: ["seguro", "aseguradora", "poliza", "cotiza tu seguro", "gastos medicos mayores", "seguro de vida", "seguro de auto", "deducible", "coaseguro", "siniestro", "prima"],
    brands: [
      { name: "GNP", aliases: ["GNP Seguros", "Grupo Nacional Provincial"], domains: ["gnp.com.mx"] },
      { name: "AXA", aliases: ["AXA Seguros", "AXA México"], domains: ["axa.mx"] },
      { name: "Quálitas", aliases: ["Qualitas"], domains: ["qualitas.com.mx"] },
      { name: "MAPFRE", aliases: ["MAPFRE México"], domains: ["mapfre.com.mx"] },
      { name: "MetLife", aliases: ["MetLife México"], domains: ["metlife.com.mx"] },
      { name: "HDI", aliases: ["HDI Seguros"], domains: ["hdi.com.mx"] },
      { name: "Seguros Monterrey New York Life", aliases: ["Seguros Monterrey", "SMNYL"], domains: ["mnyl.com.mx"] },
    ],
    prompts: [
      cat("¿Cuál es la mejor aseguradora de autos en {lugar}?"),
      cat("¿Qué seguro de gastos médicos mayores me recomiendas en {lugar}?"),
      cat("¿Cuál es el mejor seguro de vida en {lugar}?"),
      cat("¿Qué aseguradora paga más rápido los siniestros en {lugar}?"),
      cat("¿Cuál es el seguro de auto más barato con buena cobertura en {lugar}?"),
      cat("¿Qué aseguradoras tienen mejor atención al cliente en {lugar}?"),
      cat("¿Cuál es el mejor seguro de gastos médicos para una familia en {lugar}?"),
      cat("¿Qué aseguradora me recomiendas para asegurar mi casa en {lugar}?"),
      cat("¿Cuáles son las aseguradoras más grandes y confiables de {lugar}?"),
      cat("¿Qué seguro de auto tiene la mejor asistencia en carretera en {lugar}?"),
      cat("¿Cuál es el mejor seguro para el retiro en {lugar}?"),
      cat("¿Qué aseguradora tiene la red de hospitales más amplia en {lugar}?"),
      pro("Choqué y mi aseguradora tardó semanas en pagar. ¿A cuál me cambio en {lugar}?"),
      pro("Tengo 40 años y no tengo seguro de gastos médicos. ¿Cuál me conviene contratar en {lugar}?"),
      pro("Acabo de comprar un auto nuevo en {lugar}. ¿Qué seguro le pongo?"),
      pro("Tengo una enfermedad preexistente. ¿Qué aseguradora me puede cubrir en {lugar}?"),
      pro("Quiero proteger a mi familia si me pasa algo. ¿Qué seguro de vida me recomiendas en {lugar}?"),
      pro("Me subieron mucho el precio de la renovación de mi seguro. ¿Qué otra aseguradora me recomiendas en {lugar}?"),
      pro("Tengo una pequeña empresa y quiero darles seguro médico a mis empleados. ¿Qué aseguradora me recomiendas en {lugar}?"),
      pro("Uso mi auto para trabajar en plataformas de transporte. ¿Qué aseguradora me cubre en {lugar}?"),
      pro("Me van a operar y quiero saber qué seguro cubre bien hospitales privados en {lugar}."),
      pro("Quiero un seguro de auto que pueda contratar en línea en minutos en {lugar}. ¿Cuál me recomiendas?"),
      cmp("¿Conviene más contratar el seguro de auto con la agencia, con un agente o en línea en {lugar}?"),
      cmp("¿Qué es mejor en {lugar}: seguro de gastos médicos mayores o un plan de salud con un hospital?"),
      cmp("¿Conviene un seguro de vida temporal o uno con ahorro en {lugar}?"),
      cmp("¿Es mejor una aseguradora grande o una digital para el seguro de auto en {lugar}?"),
    ],
  },
  {
    id: "retail",
    label: "Tiendas y compras en línea",
    about: "Tiendas que la IA recomienda para comprar en línea y en tienda en México.",
    keywords: ["tienda en linea", "envio gratis", "meses sin intereses", "carrito", "departamental", "ofertas", "comprar en linea", "devoluciones", "pago contra entrega", "click and collect"],
    brands: [
      { name: "Liverpool", aliases: [], domains: ["liverpool.com.mx"] },
      { name: "Amazon", aliases: ["Amazon México"], domains: ["amazon.com.mx"] },
      { name: "Mercado Libre", aliases: ["MercadoLibre"], domains: ["mercadolibre.com.mx"] },
      { name: "Walmart", aliases: ["Walmart México"], domains: ["walmart.com.mx"] },
      { name: "Coppel", aliases: [], domains: ["coppel.com"] },
      { name: "El Palacio de Hierro", aliases: ["Palacio de Hierro"], domains: ["elpalaciodehierro.com"] },
      { name: "Sears", aliases: ["Sears México"], domains: ["sears.com.mx"] },
    ],
    prompts: [
      cat("¿Cuál es la mejor tienda para comprar en línea en {lugar}?"),
      cat("¿Dónde conviene comprar electrónicos en {lugar}?"),
      cat("¿Qué tienda en línea tiene los envíos más rápidos en {lugar}?"),
      cat("¿Dónde comprar una pantalla con meses sin intereses en {lugar}?"),
      cat("¿Cuál es la mejor tienda departamental de {lugar}?"),
      cat("¿Dónde comprar ropa de marca original en línea en {lugar}?"),
      cat("¿Qué tienda tiene las mejores ofertas del Buen Fin en {lugar}?"),
      cat("¿Dónde conviene comprar una lavadora o un refrigerador en {lugar}?"),
      cat("¿Cuál es el sitio más confiable para comprar en internet en {lugar}?"),
      cat("¿Dónde hago el súper en línea en {lugar}?"),
      cat("¿Qué tienda tiene la mejor mesa de regalos para boda en {lugar}?"),
      cat("¿Dónde comprar muebles en línea con entrega a domicilio en {lugar}?"),
      pro("Compré algo en línea y nunca llegó. ¿En qué tienda es más seguro comprar en {lugar}?"),
      pro("No tengo tarjeta de crédito. ¿Dónde puedo comprar a pagos en {lugar}?"),
      pro("Quiero comprar un celular nuevo y que sea original. ¿Dónde lo compro en {lugar}?"),
      pro("Necesito devolver productos fácilmente si no me quedan. ¿Qué tienda tiene mejores devoluciones en {lugar}?"),
      pro("Vivo lejos de la ciudad. ¿Qué tienda en línea sí entrega en zonas alejadas de {lugar}?"),
      pro("Busco regalos de Navidad con buen precio. ¿Dónde compro en {lugar}?"),
      pro("Quiero amueblar mi departamento completo. ¿Dónde me conviene comprar en {lugar}?"),
      pro("Me da desconfianza pagar con tarjeta en internet. ¿Qué tienda en línea es más segura en {lugar}?"),
      pro("Necesito una laptop para la escuela de mi hijo, barata y buena. ¿Dónde la compro en {lugar}?"),
      pro("Quiero vender mis productos en línea en {lugar}. ¿En qué plataforma me conviene?"),
      cmp("¿Conviene más comprar en un marketplace o directo en la tienda de la marca en {lugar}?"),
      cmp("¿Qué es mejor en {lugar}: comprar a meses sin intereses o de contado con descuento?"),
      cmp("¿Conviene comprar en tienda física o en línea en {lugar}?"),
      cmp("¿Son confiables las tiendas en línea de otros países frente a las de {lugar}?"),
    ],
  },
  {
    id: "telecom",
    label: "Telefonía e internet",
    about: "Compañías que la IA recomienda para plan de celular e internet en casa en México.",
    keywords: ["plan de celular", "prepago", "pospago", "internet en casa", "fibra optica", "megas", "cobertura", "portabilidad", "recarga", "paquete triple play", "5g"],
    brands: [
      { name: "Telcel", aliases: [], domains: ["telcel.com"] },
      { name: "AT&T", aliases: ["AT&T México", "ATT"], domains: ["att.com.mx"] },
      { name: "Movistar", aliases: ["Movistar México"], domains: ["movistar.com.mx"] },
      { name: "Telmex", aliases: ["Infinitum"], domains: ["telmex.com"] },
      { name: "Izzi", aliases: [], domains: ["izzi.mx"] },
      { name: "Totalplay", aliases: ["Total Play"], domains: ["totalplay.com.mx"] },
      { name: "Megacable", aliases: [], domains: ["megacable.com.mx"] },
    ],
    prompts: [
      cat("¿Cuál es la compañía de celular con mejor cobertura en {lugar}?"),
      cat("¿Cuál es el mejor internet para casa en {lugar}?"),
      cat("¿Qué plan de celular me recomiendas en {lugar}?"),
      cat("¿Cuál es el internet de fibra óptica más rápido en {lugar}?"),
      cat("¿Qué compañía de internet tiene mejor servicio al cliente en {lugar}?"),
      cat("¿Cuál es el plan de celular más barato con datos ilimitados en {lugar}?"),
      cat("¿Qué paquete de internet, TV y teléfono conviene en {lugar}?"),
      cat("¿Qué compañía tiene la mejor red 5G en {lugar}?"),
      cat("¿Cuál es la mejor recarga prepago en {lugar}?"),
      cat("¿Qué internet es mejor para jugar en línea en {lugar}?"),
      cat("¿Qué compañía de celular es mejor para viajar a Estados Unidos desde {lugar}?"),
      cat("¿Cuál es el mejor internet para una oficina pequeña en {lugar}?"),
      pro("Mi internet se cae todo el tiempo. ¿A qué compañía me cambio en {lugar}?"),
      pro("Trabajo desde casa y necesito internet estable para videollamadas. ¿Cuál contrato en {lugar}?"),
      pro("No tengo señal de celular dentro de mi casa. ¿Qué compañía tiene mejor cobertura en {lugar}?"),
      pro("Pago mucho por mi plan de celular. ¿Qué opción más barata hay en {lugar}?"),
      pro("Me voy a mudar y necesito contratar internet rápido. ¿Qué compañía instala más rápido en {lugar}?"),
      pro("Viajo mucho por carretera y pierdo la señal. ¿Qué compañía tiene más cobertura en {lugar}?"),
      pro("Quiero cambiarme de compañía y conservar mi número. ¿Cuál me conviene en {lugar}?"),
      pro("En mi casa somos cinco y todos usamos streaming. ¿Qué internet necesito en {lugar}?"),
      pro("Vivo en una zona rural. ¿Qué opciones de internet tengo en {lugar}?"),
      pro("Quiero un plan para mi hijo adolescente con control de gastos. ¿Qué compañía me recomiendas en {lugar}?"),
      cmp("¿Conviene más un plan de celular de prepago o de pospago en {lugar}?"),
      cmp("¿Qué es mejor en {lugar}: internet por fibra óptica, por cable o satelital?"),
      cmp("¿Conviene contratar internet, TV y teléfono en paquete o por separado en {lugar}?"),
      cmp("¿Las compañías de celular virtuales son buena opción frente a las grandes en {lugar}?"),
    ],
  },
];

export const industryById = (id: string) => INDUSTRIES.find((i) => i.id === id);

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Fills `{lugar}` and returns the prompt list for a market. */
export function industryPrompts(industry: Industry, where: string) {
  return industry.prompts.map((p) => ({ type: p.type, text: p.text.replaceAll("{lugar}", where) }));
}

/**
 * Industria de un sitio, sin IA: primero por dominio (si es una marca del catálogo),
 * luego por palabras clave en su texto. Devuelve null si no hay una coincidencia clara.
 */
export function classifySite(domain: string, text: string): { industry: Industry; brand?: Entity } | null {
  const host = domain.toLowerCase().replace(/^www\./, "");
  for (const industry of INDUSTRIES) {
    const brand = industry.brands.find((b) => b.domains.some((d) => host === d || host.endsWith(`.${d}`)));
    if (brand) return { industry, brand };
  }
  const hay = norm(text);
  const scored = INDUSTRIES.map((industry) => ({
    industry,
    hits: industry.keywords.filter((k) => hay.includes(k)).length,
  })).sort((a, b) => b.hits - a.hits);
  const [best, second] = scored;
  // Al menos 3 palabras distintas y claramente más que la siguiente industria.
  if (!best || best.hits < 3 || (second && best.hits - second.hits < 2)) return null;
  return { industry: best.industry };
}
