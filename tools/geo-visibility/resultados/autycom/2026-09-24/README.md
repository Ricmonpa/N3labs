# Autycom · diagnóstico GEO · 24 sep 2026

Diagnóstico para la reunión con Autycom (autycom.com). Todo es real: nada simulado.

- `diagnostico.html`: el informe para el cliente (abrir en el navegador).
- `report.md` / `report.json`: estudio de visibilidad en Gemini, 26 preguntas × 3 = 78 respuestas.
- `responses.jsonl`: cada respuesta cruda, para auditar cualquier cifra.
- `study.json`: preguntas, marca y competidores con que se corrió (igual a `studies/autycom.json`).
- `revision-tecnica.json`: la revisión técnica del Scan GEO (`src/lib/geo/audit.ts`), 69/100.
- `muestra-fichas.json`: las 60 fichas de producto revisadas a mano (título, foto, descripción, texto corrupto).
- `sitio-viejo-primer-mapa.txt`: las 1,000 direcciones del primer mapa de autycom.com.mx probadas en el sitio nuevo (código HTTP).
- `sitio-viejo-muestra.txt`: una de cada 50 de las 24,764 direcciones del sitio viejo, probadas igual.

Para repetir la medición el próximo mes:

```bash
npm run run -- --study studies/autycom.json --yes
```
