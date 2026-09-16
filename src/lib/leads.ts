import { getAttribution, describeSource } from "@/components/Attribution";

// Google Apps Script web app that appends each lead to our Sheet.
// Public by design (it only accepts writes); override via env var if it changes.
const ENDPOINT =
  process.env.NEXT_PUBLIC_LEADS_ENDPOINT ??
  "https://script.google.com/macros/s/AKfycbz1dH6uvmicCZs2Im7VIttBfcFsE773xVrX4DWT16yYoXik6Ue3jrdlmxyOPB7odh7m/exec";

export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Lead = {
  name: string;
  email: string;
  lang: string;
  source: string;
  ts: string;
  origin: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
  landing: string;
} & Record<string, string>;

/** Builds the lead (with first-touch attribution) and sends it. Never throws. */
export async function sendLead(
  fields: { name: string; email: string; lang: string; source: string } & Record<string, string>,
): Promise<Lead> {
  const attr = getAttribution();
  const lead: Lead = {
    ...fields,
    name: fields.name.trim(),
    email: fields.email.trim().toLowerCase(),
    ts: new Date().toISOString(),
    // Where this visitor originally came from
    origin: describeSource(attr),
    utmSource: attr.utmSource ?? "",
    utmMedium: attr.utmMedium ?? "",
    utmCampaign: attr.utmCampaign ?? "",
    referrer: attr.referrer ?? "",
    landing: attr.landing ?? "",
  };

  // no-cors → fire-and-forget; capture failures must not block the user.
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(lead),
    });
  } catch {
    /* ignore */
  }
  return lead;
}
