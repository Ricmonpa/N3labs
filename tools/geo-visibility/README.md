# Estudio de visibilidad en IA (v2 del diagnóstico GEO)

Herramienta interna de N3. Hace las preguntas de un cliente a ChatGPT, Claude, Perplexity y Gemini
(con búsqueda web), varias veces, y mide si mencionan y citan a la marca. No es pública: cada
corrida cuesta dinero.

## Preparar

```bash
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
