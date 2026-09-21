# Estudio de visibilidad en IA (v2 del diagnóstico GEO)

Herramienta de N3. Hace las preguntas de un cliente a ChatGPT, Claude, Perplexity y Gemini
(con búsqueda web), varias veces, y mide si mencionan y citan a la marca. El estudio completo es
interno (cada corrida cuesta dinero); al público solo le llega una versión ligera, con topes (ver
"Embudo público").

**El uso normal es el panel en línea: `/panel` del sitio.** Esta carpeta es la versión de terminal,
útil para pruebas. Las dos usan el mismo motor, que vive en `src/lib/geo-visibility/`.

## Panel en línea (Vercel)

Variables de entorno del proyecto en Vercel:

- `DATABASE_URL`: se crea sola al conectar Neon en Vercel → Storage.
- `PANEL_EMAILS`: correos del equipo que pueden entrar, separados por coma.
- `PANEL_PASSWORD`: contraseña del panel (mínimo 12 caracteres).
- `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`: los motores sin llave
  aparecen deshabilitados.
- Opcionales: `PANEL_MAX_CALLS` (tope por corrida, 1500 por defecto), `PANEL_SESSION_SECRET` y los
  `*_MODEL` de `.env.example`.

- Opcional: `GEO_SCAN_DAILY_CAP` (diagnósticos públicos por día para todos, 40 por defecto).

Las tablas se crean solas la primera vez. Las corridas avanzan en el servidor, en tandas que se
encadenan solas: se puede cerrar la página o bloquear el celular y siguen.

## Embudo público

1. **Anzuelo** — `/geotest.html` (página de Engel, link "Scan GEO" del menú). Ejercicio orientativo,
   sin motor real.
2. **Llamada** — el botón "Agendar mi diagnóstico completo" lleva a `/#agendar` (Calendly de Engel o
   Ricardo). El diagnóstico completo se cotiza y se corre desde el panel.

**Apagado desde el 21 sep 2026 (se cobra, no se regala):** `/geo` redirige al anzuelo y el estudio
público solo corre con `GEO_PUBLIC_SCAN=on`. El código se queda por si vuelve. Así funcionaba:

- **Diagnóstico completo gratis** — `/geo`. Un solo formulario: sitio + nombre + correo. Entrega junto:
   - Parte 1, ¿te pueden leer?: revisión técnica en vivo (`src/lib/geo/audit.ts`), en segundos.
   - Parte 2, ¿te recomiendan?: estudio ligero en Gemini (`src/lib/panel/scan.ts`): el panel arma
     marca, competidores y preguntas desde la URL; 12 preguntas (10 sin nombre de marca + 2 con
     nombre) × 2 repeticiones = 24 llamadas, unos US$0.10. Tarda alrededor de un minuto.

   El lead va a la hoja "PROMPTER LEADS", pestaña "GEO LEADS", y avisa por correo a Ricardo y
   Engel (`tools/leads-sheet/Codigo.gs`). El estudio queda en el panel como cualquier otro, con
   autor `scan:<correo>`.

   Topes: 3 diagnósticos por correo o IP al día; `GEO_SCAN_DAILY_CAP` para todos; un sitio ya
   medido en las últimas 24 h devuelve el mismo resultado sin volver a gastar.

Lo que se vende después es el estudio completo desde el panel: cuatro motores, más preguntas,
seguimiento mensual. La llamada se agenda desde el final del diagnóstico.

La propuesta de Avante vive aparte en `public/avante/` (`/avante` y `/avante/demo`, sin indexar).

## Preparar (terminal)

```bash
npm install            # en la raíz del repo: instala los SDKs del motor
cd tools/geo-visibility
npm install
cp .env.example .env   # y pega las llaves
```

Los motores sin llave se omiten con un aviso, así que puedes empezar con uno solo.

## Correr

```bash
# 1. Probar el flujo sin llaves ni costo (respuestas inventadas, el informe lo marca como SIMULACIÓN)
npm run run -- --study studies/potenttial.json --simulate

# 2. Ver cuántas llamadas haría (no gasta nada)
npm run run -- --study studies/potenttial.json

# 3. Prueba real chica: 2 preguntas, 1 repetición
npm run run -- --study studies/potenttial.json --limit 2 --runs 1 --yes

# 4. Estudio completo
npm run run -- --study studies/potenttial.json --yes
```

Resultados en `out/<estudio>/<fecha>/`:

- `report.md`: el informe para el cliente.
- `report.json`: los mismos números para tableros.
- `responses.jsonl`: cada respuesta cruda, para auditar cualquier número.

Si algo falla o se corta, repite el mismo comando: solo vuelve a hacer lo que faltó.
Para recalcular el informe sin llamar a nadie: `npm run analyze -- out/<estudio>/<fecha>`.

## Nuevo cliente

Copia `studies/potenttial.json` y ajusta:

- `brand`: nombre, alias y dominios (los subdominios cuentan).
- `competitors`: marcas reales con sus dominios. Sin competidores no hay participación de voz.
- `market`: país (ISO), ciudad, zona horaria e idioma de las preguntas.
- `prompts`: de 30 a 100 preguntas como las haría un comprador. `type` es `category`, `problem`,
  `comparison` o `brand`.
- `runs`: repeticiones por pregunta (3 es un buen mínimo).

Llamadas totales = preguntas × repeticiones × motores.

## Qué mide

- **Menciona:** el nombre o un alias aparece en la respuesta (sin importar mayúsculas ni acentos).
- **Cita:** la respuesta enlaza a un dominio de la marca.
- **Fuentes:** el motor reporta haber consultado el sitio. Gemini solo expone lo que cita.
- **Fuentes que citan cuando no apareces:** dónde conviene ganar presencia.

Cada porcentaje lleva su intervalo de confianza del 95%.

## Límites

- Usa las APIs, no las apps: la app puede personalizar, usar memoria o cambiar de modelo.
- Google AI Overviews / AI Mode y Copilot no tienen API para esto.
- Gemini no permite fijar la ubicación del usuario.
- Perplexity usa el Agent API (su API de Sonar se retira el 27 de septiembre de 2026).
- Claude corre con `fallbacks: "default"`: si el modelo rechaza una pregunta por política, el API la
  reintenta con otro modelo de Anthropic.
