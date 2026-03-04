export interface ExtractedContent {
  title: string | null;
  author: string | null;
  published: string | null;
  description: string | null;
  domain: string | null;
  wordCount: number;
  content: string;
}

export async function extractContent(articleUrl: string): Promise<ExtractedContent> {
  // defuddle.md expects the URL without the protocol prefix
  const urlWithoutProtocol = articleUrl.replace(/^https?:\/\//, "");
  const defuddleUrl = `https://defuddle.md/${urlWithoutProtocol}`;

  const response = await fetch(defuddleUrl, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`defuddle.md failed for ${articleUrl}: ${response.status}`);
  }

  const text = await response.text();

  // Response is markdown with YAML frontmatter (--- delimited)
  const { frontmatter, body } = parseFrontmatter(text);

  if (!body.trim()) {
    throw new Error(`defuddle.md returned no content for ${articleUrl}`);
  }

  return {
    title: (frontmatter.title as string) || null,
    author: (frontmatter.author as string) || null,
    published: (frontmatter.published as string) || null,
    description: (frontmatter.description as string) || null,
    domain: (frontmatter.domain as string) || null,
    wordCount: (frontmatter.word_count as number) || body.split(/\s+/).length,
    content: body,
  };
}

function parseFrontmatter(text: string): {
  frontmatter: Record<string, string | number | null>;
  body: string;
} {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: text };
  }

  const frontmatter: Record<string, string | number | null> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value: string | number = line.slice(idx + 1).trim();
    // Strip surrounding quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    // Parse numbers
    if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }
    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2] };
}
