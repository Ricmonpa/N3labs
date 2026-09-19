/**
 * Apps Script detrás de NEXT_PUBLIC_LEADS_ENDPOINT (src/lib/leads.ts).
 *
 * Qué hace con cada registro que llega del sitio:
 *   1. lo agrega como fila en la hoja (creando los encabezados la primera vez);
 *   2. nos avisa por correo a los dos.
 *
 * Cómo actualizarlo (una sola vez):
 *   1. Abre la hoja de leads → Extensiones → Apps Script.
 *   2. Reemplaza todo el contenido del archivo por este.
 *   3. Guardar (Ctrl+S).
 *   4. Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar.
 *      (Usa la MISMA implementación para que la URL /exec no cambie.)
 *   5. La primera vez te pedirá autorizar el envío de correo: acepta.
 */

/** A quién le avisamos de cada registro nuevo. */
var NOTIFICAR = ["rmmoncada5@gmail.com", "e.fonseca@potenttial.com"];

/** Solo avisar de estos orígenes; deja [] para que avise de todos. */
var AVISAR_SOLO_DE = ["geo-audit"];

/** Si el script NO está pegado dentro de la hoja, pon aquí el id de la hoja. */
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

/** Agrega la fila respetando los encabezados que ya existan; añade columna si llega un campo nuevo. */
function guardar(lead) {
  var sheet = hoja();
  var ancho = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, ancho).getValues()[0].filter(String);

  if (headers.length === 0) {
    headers = Object.keys(lead);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  } else {
    var nuevas = Object.keys(lead).filter(function (k) {
      return headers.indexOf(k) === -1;
    });
    if (nuevas.length) {
      sheet.getRange(1, headers.length + 1, 1, nuevas.length).setValues([nuevas]).setFontWeight("bold");
      headers = headers.concat(nuevas);
    }
  }

  sheet.appendRow(
    headers.map(function (h) {
      return lead[h] === undefined ? "" : lead[h];
    })
  );
}

function avisar(lead) {
  var quien = lead.name || "(sin nombre)";
  var asunto = "Nuevo registro GEO: " + quien + " · " + (lead.auditedUrl || lead.source || "");

  var lineas = [
    "Alguien pidió el diagnóstico completo en n3labs.potenttial.site/geo",
    "",
    "Nombre:   " + quien,
    "Correo:   " + (lead.email || ""),
    "Sitio:    " + (lead.auditedUrl || "—"),
    "Puntaje:  " + (lead.score || "—"),
    "Idioma:   " + (lead.lang || ""),
    "Origen:   " + (lead.origin || "directo"),
    "Campaña:  " + [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(String).join(" / "),
    "Referrer: " + (lead.referrer || "—"),
    "Landing:  " + (lead.landing || "—"),
    "Fecha:    " + (lead.ts || new Date().toISOString()),
    "",
    "Herramienta: " + (lead.source || ""),
  ];

  MailApp.sendEmail({
    to: NOTIFICAR.join(","),
    replyTo: lead.email || undefined,
    subject: asunto,
    body: lineas.join("\n"),
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Para probar sin tocar el sitio: ejecuta esta función desde el editor. */
function probar() {
  doPost({
    postData: {
      contents: JSON.stringify({
        name: "Prueba N3",
        email: "prueba@ejemplo.com",
        lang: "es",
        source: "geo-audit",
        auditedUrl: "https://ejemplo.com",
        score: "62",
        ts: new Date().toISOString(),
        origin: "prueba manual",
      }),
    },
  });
}
