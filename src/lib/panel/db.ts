import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";

// Local development only: send queries to a Neon-compatible HTTP endpoint (e.g. a local proxy).
if (process.env.NODE_ENV !== "production" && process.env.NEON_LOCAL_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_FETCH_ENDPOINT;
}

export class NotConfiguredError extends Error {}

let client: ReturnType<typeof neon> | null = null;
let schemaReady: Promise<void> | null = null;

function connectionString() {
  // The Vercel ↔ Neon integration sets DATABASE_URL (and POSTGRES_URL on older setups).
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
}

export function dbConfigured() {
  return !!connectionString();
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS geo_studies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data jsonb NOT NULL,
    created_by text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS geo_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id uuid NOT NULL REFERENCES geo_studies(id) ON DELETE CASCADE,
    study jsonb NOT NULL,
    engines text[] NOT NULL,
    runs int NOT NULL,
    simulated boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'running',
    total int NOT NULL,
    report jsonb,
    share_token text UNIQUE,
    lease_until timestamptz,
    created_by text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz
  )`;
  await sql`CREATE INDEX IF NOT EXISTS geo_runs_study_idx ON geo_runs (study_id, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS geo_responses (
    run_id uuid NOT NULL REFERENCES geo_runs(id) ON DELETE CASCADE,
    key text NOT NULL,
    ok boolean NOT NULL,
    record jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (run_id, key)
  )`;
  // Public scans from /geo: who asked, for which site, and the run that answers it.
  await sql`CREATE TABLE IF NOT EXISTS geo_scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL,
    status text NOT NULL DEFAULT 'preparing',
    run_id uuid REFERENCES geo_runs(id) ON DELETE SET NULL,
    error text,
    domain text NOT NULL,
    url text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    ip text NOT NULL,
    lang text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS geo_scans_recent_idx ON geo_scans (created_at DESC)`;
}

/** Tagged-template SQL client; creates the tables on first use. */
export async function db() {
  const url = connectionString();
  if (!url) throw new NotConfiguredError("DATABASE_URL no está configurada");
  client ??= neon(url);
  schemaReady ??= ensureSchema(client).catch((err) => {
    schemaReady = null;
    throw err;
  });
  await schemaReady;
  return client;
}
