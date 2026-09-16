export type EngineId = "openai" | "anthropic" | "perplexity" | "gemini";

export type Market = {
  /** ISO 3166-1 alpha-2, e.g. "MX". */
  country: string;
  city?: string;
  region?: string;
  /** IANA time zone, e.g. "America/Mexico_City". */
  timezone?: string;
  /** Language the prompts are written in, e.g. "es-MX". */
  language: string;
};

export type Entity = {
  name: string;
  /** Other ways the entity is written. Matching ignores case and accents. */
  aliases?: string[];
  /** Domains that count as a citation, e.g. "potenttial.com" (subdomains included). */
  domains: string[];
};

export type PromptType = "category" | "problem" | "comparison" | "brand";

export type StudyPrompt = { id: string; type: PromptType; text: string };

export type Study = {
  name: string;
  brand: Entity;
  competitors: Entity[];
  market: Market;
  runs: number;
  engines: EngineId[];
  prompts: StudyPrompt[];
};

export type Source = { url: string; title?: string };

export type EngineAnswer = {
  model: string;
  text: string;
  /** URLs the answer cites inline. */
  citations: Source[];
  /** Every URL the engine reports consulting (a superset of citations when available). */
  sources: Source[];
  searchQueries: string[];
  costUsd: number | null;
  usage: unknown;
  raw: unknown;
};

export type Engine = {
  id: EngineId;
  label: string;
  /** Environment variable that must hold the API key. */
  envKey: string;
  model: string;
  ask(prompt: string, market: Market): Promise<EngineAnswer>;
};

/** One line of responses.jsonl. */
export type RunRecord = {
  key: string;
  engine: EngineId;
  simulated: boolean;
  promptId: string;
  promptType: PromptType;
  prompt: string;
  run: number;
  at: string;
  ms: number;
  ok: boolean;
  error?: string;
  answer?: EngineAnswer;
};
