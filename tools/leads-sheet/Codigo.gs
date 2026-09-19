/**
 * Apps Script detrás de NEXT_PUBLIC_LEADS_ENDPOINT (src/lib/leads.ts).
 * Hoja: "PROMPTER LEADS" (Drive de ricardo.m@potenttial.com).
 *
 * Qué hace con cada registro que llega del sitio:
 *   1. lo agrega como fila, respetando las columnas que ya tiene la hoja;
 *   2. nos avisa por correo a los dos cuando viene del diagnóstico GEO.
 *
 * Cómo actualizarlo (una sola vez):
 *   1. Abre la hoja → Extensiones → Apps Script.
 *   2. Reemplaza todo el contenido del archivo por este.
 *   3. Guardar (Ctrl+S).
 *   4. Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar.
 *      (Usa la MISMA implementación para que la URL /exec no cambie.)
 *   5. La primera vez te pedirá autorizar el envío de correo: acepta.
 *
 * Columnas: escribe solo en las que ya existen en la fila 1. Hoy son
 * Fecha | Nombre | Correo | Idioma | Origen | Timestamp.
 * Si quieres ver el sitio auditado y el puntaje, agrega a mano los
 * encabezados "Sitio" y "Puntaje" (y si quieres "Campaña", "Referrer",
 * "Landing") y se llenarán solos de ahí en adelante.
 */

/** A quién le avisamos de cada registro nuevo. */
var NOTIFICAR = ["rmmoncada5@gmail.com", "e.fonseca@potenttial.com"];

/** Solo avisar de estos orígenes; deja [] para que avise de todos. */
var AVISAR_SOLO_DE = ["geo-audit"];

/** Si el script NO está pegado dentro de la hoja, pon aquí su id. */
var SHEET_ID = "";

function doPost(e) {
  try {
    var lead = JSON.parse(e.postData.contents);
    guardar(lead);
    if (AVISAR_SOLO_DE.length === 0 || AVISAR_SOLO_DE.indexOf(String(lead.source)) !== -1) {
      avisar(lead);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function hoja() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets()[0];
}

/** Valor para cada encabezado posible. Lo que no esté en la fila 1 se ignora. */
function columnas(lead) {
  return {
    "Fecha": new Date(),
    "Nombre": lead.name || "",
    "Correo": lead.email || "",
    "Idioma": lead.lang || "",
    "Origen": lead.source || "",
    "Timestamp": lead.ts || "",
    "Sitio": lead.auditedUrl || "",
    "Puntaje": lead.score || "",
    "Procedencia": lead.origin || "",
    "Campaña": [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(String).join(" / "),
    "Referrer": lead.referrer || "",
    "Landing": lead.landing || ""
  };
}

var HEADERS_POR_DEFECTO = ["Fecha", "Nombre", "Correo", "Idioma", "Origen", "Timestamp"];

function guardar(lead) {
  var sheet = hoja();
  var headers = HEADERS_POR_DEFECTO;

  if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
    var fila1 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    // La hoja tiene una fila vacía arriba del encabezado real: usa la primera fila con texto.
    if (!fila1.join("")) fila1 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (fila1.join("")) headers = fila1;
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }

  var valores = columnas(lead);
  sheet.appendRow(
    headers.map(function (h) {
      var k = String(h).trim();
      return valores[k] === undefined ? "" : valores[k];
    })
  );
}

function avisar(lead) {
  var quien = lead.name || "(sin nombre)";

  var lineas = [
    "Alguien pidió el diagnóstico completo en n3labs.potenttial.site/geo",
    "",
    "Nombre:   " + quien,
    "Correo:   " + (lead.email || ""),
    "Sitio:    " + (lead.auditedUrl || "—"),
    "Puntaje:  " + (lead.score || "—"),
    "Idioma:   " + (lead.lang || ""),
    "Origen:   " + (lead.origin || "directo"),
    "Campaña:  " + ([lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(String).join(" / ") || "—"),
    "Referrer: " + (lead.referrer || "—"),
    "Landing:  " + (lead.landing || "—"),
    "Fecha:    " + (lead.ts || new Date().toISOString()),
    "",
    "Herramienta: " + (lead.source || "")
  ];

  MailApp.sendEmail({
    to: NOTIFICAR.join(","),
    replyTo: lead.email || undefined,
    subject: "Nuevo registro GEO: " + quien + " · " + (lead.auditedUrl || lead.source || ""),
    body: lineas.join("\n")
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Para probar sin tocar el sitio: ejecuta esta función desde el editor y borra la fila después. */
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
        ts: new Date().toISOString(),
        origin: "prueba manual"
      })
    }
  });
}
