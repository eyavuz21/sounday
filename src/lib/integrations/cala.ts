/**
 * Cala data enrichment — "the knowledge layer for AI agents".
 *
 * Given a company name we call Cala's natural-language knowledge search to get a
 * sourced, structured overview (public info only — never personal data about an
 * individual). We use the answer to auto-fill "What do they do?" and the
 * supporting facts to enrich Prime lyrics context.
 *
 * Docs: https://docs.cala.ai — POST /v1/knowledge/search, auth via X-API-KEY.
 */

const CALA_API_BASE = process.env.CALA_API_BASE ?? "https://api.cala.ai";

export type CompanyFact = { text: string; source?: string | null };

export type CalaResult = {
  company: string;
  summary: string | null; // full markdown answer
  description: string | null; // concise plain-text overview for form auto-fill
  facts: CompanyFact[];
  source: "cala" | "fallback";
  note?: string;
};

/** Strip markdown / scrape artifacts to plain text. */
function stripMarkdown(s: string): string {
  return s
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*|\*|`|_/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/-{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Condense to a short, plain-text company description. */
function conciseDescription(markdown: string): string | null {
  const plain = stripMarkdown(markdown).replace(/^Company Overview\s*/i, "");
  if (!plain) return null;
  const sentences = plain.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).trim().length > 220) break;
    out = (out + " " + s).trim();
  }
  return (out || plain).slice(0, 240);
}

const FACT_NOISE = /(log in|sign in|request a free trial|view members|cookie|subscribe|newsletter|©|all rights reserved)/i;

/** Clean a KnowBit into a presentable fact, or null if it's nav/junk. */
function cleanFact(text: string): string | null {
  const t = stripMarkdown(text);
  if (t.length < 30 || FACT_NOISE.test(t)) return null;
  return t.slice(0, 200);
}

const CALA_KEY = () => process.env.CALA_API_KEY?.trim();

type Origin = { source?: { name?: string; url?: string } };
type KnowBit = { content?: string; origins?: Origin[] };
type CalaAnswer = { content?: string; context?: KnowBit[] };

export async function enrichCompany(company: string): Promise<CalaResult> {
  const name = company.trim();
  if (!name) {
    return {
      company,
      summary: null,
      description: null,
      facts: [],
      source: "fallback",
      note: "no company",
    };
  }
  const key = CALA_KEY();
  if (!key) {
    return {
      company: name,
      summary: null,
      description: null,
      facts: [],
      source: "fallback",
      note: "CALA_API_KEY not set",
    };
  }

  try {
    const res = await fetch(`${CALA_API_BASE}/v1/knowledge/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": key,
      },
      body: JSON.stringify({
        input: `Give a concise overview of the company "${name}": what it does, its industry, main products or services, and a few notable public facts. Company information only.`,
        explainability: false,
        return_entities: false,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        company: name,
        summary: null,
        description: null,
        facts: [],
        source: "fallback",
        note: `Cala HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as CalaAnswer;
    const summary = json.content?.trim() || null;
    const facts: CompanyFact[] = [];
    for (const kb of json.context ?? []) {
      const text = cleanFact(kb.content ?? "");
      if (text) facts.push({ text, source: kb.origins?.[0]?.source?.url ?? null });
      if (facts.length >= 5) break;
    }

    const description = summary ? conciseDescription(summary) : null;
    return { company: name, summary, description, facts, source: "cala" };
  } catch (e) {
    return {
      company: name,
      summary: null,
      description: null,
      facts: [],
      source: "fallback",
      note: `Cala error: ${(e as Error).message}`,
    };
  }
}
