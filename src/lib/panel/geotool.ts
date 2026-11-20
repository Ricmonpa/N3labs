import "server-only";
import { db } from "./db";

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PER_IP_PER_DAY = 20;

export class RegisterError extends Error {
  constructor(public code: "invalid_name" | "invalid_email" | "invalid_company" | "rate_limited") {
    super(code);
  }
}

/** Guarda el registro de quien quiere usar el N3 GeoTool. */
export async function registerGeoTool(input: { name: string; email: string; company: string; whatsapp: string; ip: string; lang: string; origin: string }) {
  const name = input.name.trim().slice(0, 120);
  const email = input.email.trim().toLowerCase().slice(0, 200);
  const company = input.company.trim().slice(0, 160);
  const whatsapp = input.whatsapp.replace(/[^\d+\s()-]/g, "").trim().slice(0, 30) || null;
  if (!name) throw new RegisterError("invalid_name");
  if (!EMAIL.test(email)) throw new RegisterError("invalid_email");
  if (!company) throw new RegisterError("invalid_company");

  const sql = await db();
  const [usage] = (await sql`
    SELECT count(*)::int AS n FROM geo_tool_leads WHERE ip = ${input.ip} AND created_at > now() - interval '24 hours'`) as { n: number }[];
  if (usage.n >= PER_IP_PER_DAY) throw new RegisterError("rate_limited");
  await sql`
    INSERT INTO geo_tool_leads (name, email, company, whatsapp, ip, lang, origin)
    VALUES (${name}, ${email}, ${company}, ${whatsapp}, ${input.ip}, ${input.lang}, ${input.origin.slice(0, 300) || null})`;
}

export type GeoToolLead = {
  id: string;
  name: string;
  email: string;
  company: string;
  whatsapp: string | null;
  origin: string | null;
  created_at: string;
  /** Veces que midió su marca con el scan (mismo correo). */
  scans: number;
};

export async function listGeoToolLeads(limit = 100): Promise<GeoToolLead[]> {
  const sql = await db();
  return (await sql`
    SELECT l.id, l.name, l.email, l.company, l.whatsapp, l.origin, l.created_at,
           (SELECT count(*)::int FROM geo_scans s WHERE s.email = l.email) AS scans
    FROM geo_tool_leads l
    ORDER BY l.created_at DESC LIMIT ${limit}`) as GeoToolLead[];
}
