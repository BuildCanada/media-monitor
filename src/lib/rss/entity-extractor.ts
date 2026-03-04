export interface EntityResult {
  entityType: "person" | "organization" | "location" | "topic";
  entityValue: string;
  confidence: number;
}

interface GlinerResponse {
  people: Array<{ value: string; confidence: number }>;
  organizations: Array<{ value: string; confidence: number }>;
  locations: Array<{ value: string; confidence: number }>;
  topics: Array<{ value: string; confidence: number }>;
}

const MAX_INPUT_CHARS = 4000;

export async function extractEntities(
  container: { fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> },
  title: string,
  text: string,
): Promise<EntityResult[]> {
  const truncatedText = text.length > MAX_INPUT_CHARS
    ? text.substring(0, MAX_INPUT_CHARS)
    : text;

  const response = await container.fetch("http://container/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, text: truncatedText }),
  });

  if (!response.ok) {
    throw new Error(`GLiNER2 extraction failed: ${response.status}`);
  }

  const data = (await response.json()) as GlinerResponse;

  const results: EntityResult[] = [];

  for (const p of data.people) {
    results.push({ entityType: "person", entityValue: p.value, confidence: p.confidence });
  }
  for (const o of data.organizations) {
    results.push({ entityType: "organization", entityValue: o.value, confidence: o.confidence });
  }
  for (const l of data.locations) {
    results.push({ entityType: "location", entityValue: l.value, confidence: l.confidence });
  }
  for (const t of data.topics) {
    results.push({ entityType: "topic", entityValue: t.value, confidence: t.confidence });
  }

  return results;
}
