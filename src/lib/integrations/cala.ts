/**
 * Cala data enrichment.
 *
 * Given a company name, fetch structured, SOURCED facts about that company
 * (public info only — never personal data about an individual). We use the
 * results to auto-fill "What do they do?" and to enrich Prime lyrics context.
 *
 * The Cala endpoint shape is configurable via CALA_API_BASE. On any failure we
 * return source:"fallback" with no facts so callers degrade gracefully.
 */

const CALA_API_BASE = process.env.CALA_API_BASE ?? "https://api.cala.ai";

export type CompanyFact = { text: string; source?: string | null };

export type CalaResult = {
  company: string;
  summary: string | null;
  facts: CompanyFact[];
  source: "cala" | "fallback";
  note?: string;
};

const CALA_KEY = () => process.env.CALA_API_KEY?.trim();

export async function enrichCompany(company: string): Promise<CalaResult> {
  const name = company.trim();
  if (!name) {
    return { company, summary: null, facts: [], source: "fallback", note: "no company" };
  }
  const key = CALA_KEY();
  if (!key) {
    return {
      company: name,
      summary: null,
      facts: [],
      source: "fallback",
      note: "CALA_API_KEY not set",
    };
  }

  try {
    const res = await fetch(`${CALA_API_BASE}/v1/enrich/company`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ company: name, scope: "public" }),
    });
    if (!res.ok) {
      return {
        company: name,
        summary: null,
        facts: [],
        source: "fallback",
        note: `Cala HTTP ${res.status}`,
      };
    }
    const json = await res.json();
    const data = json?.data ?? json;
    const summary: string | null =
      data?.summary ?? data?.description ?? data?.whatTheyDo ?? null;
    const rawFacts: unknown[] = data?.facts ?? data?.sources ?? [];
    const facts: CompanyFact[] = (Array.isArray(rawFacts) ? rawFacts : [])
      .map((f) => {
        if (typeof f === "string") return { text: f, source: null };
        const obj = f as { text?: string; fact?: string; source?: string; url?: string };
        return {
          text: obj.text ?? obj.fact ?? "",
          source: obj.source ?? obj.url ?? null,
        };
      })
      .filter((f) => f.text);

    return { company: name, summary, facts, source: "cala" };
  } catch (e) {
    return {
      company: name,
      summary: null,
      facts: [],
      source: "fallback",
      note: `Cala error: ${(e as Error).message}`,
    };
  }
}
