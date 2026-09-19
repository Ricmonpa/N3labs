/**
 * Apps Script detrás de NEXT_PUBLIC_LEADS_ENDPOINT (src/lib/leads.ts).
 * Archivo: "PROMPTER LEADS" (Drive de ricardo.m@potenttial.com).
 *
 * Los leads del Prompter siguen cayendo en "Hoja 1" exactamente igual que antes.
 * Los del diagnóstico GEO van a su propia pestaña "GEO LEADS" (se crea sola la
 * primera vez) y además nos avisan por correo a los dos.
 *
 * Instalación (una sola vez):
 *   1. Hoja → Extensiones → Apps Script.
 *   2. Reemplaza todo el contenido de Código.gs por este.
 *   3. Guardar (Ctrl+S).
 *   4. Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar.
 *      (La MISMA implementación, para que la URL /exec no cambie.)
 *   5. Ejecuta la función probar(): autoriza el envío de correo, se crea la
 *      pestaña GEO LEADS y les llega el aviso a los dos. Borra esa fila de prueba.
 */

/** A quién le avisamos de cada registro GEO. */
var NOTIFICAR = ["rmmoncada5@gmail.com", "e.fonseca@potenttial.com"];

var HOJA_GEO = "GEO LEADS";

var COLUMNAS_GEO = [
  "Fecha", "Nombre", "Correo", "Sitio", "Puntaje",
  "Idioma", "Procedencia", "Campaña", "Referrer", "Landing", "Timestamp"
];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (d.source === "geo-audit") {
      guardarGeo(d);
      avisar(d);
    } else {
      // Los leads del Prompter: tal cual se guardaban antes.
      SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
        .appendRow([new Date(), d.name, d.email, d.lang, d.source, d.ts]);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function guardarGeo(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_GEO);

  if (!sheet) {
    // Al final, para que "Hoja 1" siga siendo la primera pestaña.
    sheet = ss.insertSheet(HOJA_GEO, ss.getNumSheets());
    sheet.getRange(1, 1, 1, COLUMNAS_GEO.length).setValues([COLUMNAS_GEO]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),
    d.name || "",
    d.email || "",
    d.auditedUrl || "",
    d.score || "",
    d.lang || "",
    d.origin || "",
    campana(d),
    d.referrer || "",
    d.landing || "",
    d.ts || ""
  ]);
}

function campana(d) {
  return [d.utmSource, d.utmMedium, d.utmCampaign].filter(String).join(" / ");
}

function avisar(d) {
  var quien = d.name || "(sin nombre)";

  var lineas = [
    "Alguien pidió el diagnóstico completo en n3labs.potenttial.site/geo",
    "",
    "Nombre:   " + quien,
    "Correo:   " + (d.email || ""),
    "Sitio:    " + (d.auditedUrl || "—"),
    "Puntaje:  " + (d.score || "—"),
    "Idioma:   " + (d.lang || ""),
    "Origen:   " + (d.origin || "directo"),
    "Campaña:  " + (campana(d) || "—"),
    "Referrer: " + (d.referrer || "—"),
    "Landing:  " + (d.landing || "—"),
    "Fecha:    " + (d.ts || new Date().toISOString())
  ];

  MailApp.sendEmail({
    to: NOTIFICAR.join(","),
    replyTo: d.email || undefined,
    subject: "Nuevo registro GEO: " + quien + " · " + (d.auditedUrl || ""),
    body: lineas.join("\n")
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecuta esta función desde el editor para crear la pestaña y probar el aviso. */
function probar() {
  doPost({
    postData: {
      contents: JSON.stringify({
        name: "PRUEBA aviso GEO",
        email: "prueba@n3test.com",
        lang: "es",
        source: "geo-audit",
        auditedUrl: "https://ejemplo.com",
        score: "62",
        origin: "prueba manual",
        ts: new Date().toISOString()
      })
    }
  });
}
