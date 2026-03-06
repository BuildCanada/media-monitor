import { eq } from "drizzle-orm";

import type { Db } from "@/db";
import { rssEntities, rssFeeds, rssItems, socialSuggestions } from "@/db/schema/private";

import { embedTexts } from "./embedder";
import { searchArticles } from "./turbopuffer";

interface AiBinding {
  run(
    model: string,
    input: { text: string[] },
  ): Promise<{ data: Array<{ values: number[] }> }>;
  run(
    model: string,
    input: { messages: Array<{ role: string; content: string }> },
  ): Promise<{ response: string }>;
}

const BUILD_CANADA_PUBLICATION = "Build Canada";
const TEXT_GEN_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_CONTENT_LENGTH = 3000;

export async function matchMemosForArticle(
  db: Db,
  ai: AiBinding,
  turbopufferApiKey: string,
  turbopufferNamespace: string,
  rssItemId: number,
): Promise<void> {
  // Load the article
  const [item] = await db
    .select()
    .from(rssItems)
    .where(eq(rssItems.id, rssItemId))
    .limit(1);

  if (!item) {
    console.log(`[memo-matcher] Item ${rssItemId} not found, skipping.`);
    return;
  }

  // Skip Build Canada's own memos — no self-matching
  const [feed] = await db
    .select({ publicationName: rssFeeds.publicationName })
    .from(rssFeeds)
    .where(eq(rssFeeds.id, item.feedId))
    .limit(1);

  if (feed?.publicationName === BUILD_CANADA_PUBLICATION) {
    console.log(`[memo-matcher] Item ${rssItemId} is a Build Canada memo, skipping.`);
    return;
  }

  // Build search query from title + extracted topics/entities
  const entities = await db
    .select({ entityType: rssEntities.entityType, entityValue: rssEntities.entityValue })
    .from(rssEntities)
    .where(eq(rssEntities.rssItemId, rssItemId));

  const topics = entities
    .filter((e) => e.entityType === "topic")
    .map((e) => e.entityValue);
  const orgs = entities
    .filter((e) => e.entityType === "organization")
    .map((e) => e.entityValue);

  const queryParts = [item.title, ...topics.slice(0, 5), ...orgs.slice(0, 3)];
  const searchQuery = queryParts.join(" ");

  console.log(`[memo-matcher] Searching memos for item ${rssItemId}: "${item.title}"`);

  // Embed the query and search for matching Build Canada memos
  const [queryVector] = await embedTexts(ai, [searchQuery]);

  const results = await searchArticles(turbopufferApiKey, turbopufferNamespace, {
    query: searchQuery,
    queryVector,
    mode: "hybrid",
    filters: { publication: BUILD_CANADA_PUBLICATION },
    limit: 3,
  });

  if (results.length === 0) {
    console.log(`[memo-matcher] No memo matches for item ${rssItemId}.`);
    return;
  }

  const bestMatch = results[0];
  console.log(
    `[memo-matcher] Best match for item ${rssItemId}: "${bestMatch.title}" (score: ${bestMatch.score.toFixed(4)})`,
  );

  // Load the full memo content for LLM evaluation
  const [memo] = await db
    .select({
      title: rssItems.title,
      link: rssItems.link,
      contentMarkdown: rssItems.contentMarkdown,
    })
    .from(rssItems)
    .where(eq(rssItems.id, bestMatch.rssItemId))
    .limit(1);

  if (!memo?.contentMarkdown) {
    console.log(`[memo-matcher] Memo ${bestMatch.rssItemId} has no content, skipping.`);
    return;
  }

  // LLM evaluation: verify match quality and generate social media comment
  const articleContent = (item.contentMarkdown || item.description || "").slice(0, MAX_CONTENT_LENGTH);
  const memoContent = memo.contentMarkdown.slice(0, MAX_CONTENT_LENGTH);

  const llmResult = await evaluateAndSuggest(ai, {
    articleTitle: item.title,
    articleContent,
    memoTitle: memo.title,
    memoContent,
    matchedChunkText: bestMatch.chunkText,
  });

  if (!llmResult) {
    console.log(`[memo-matcher] LLM rejected match for item ${rssItemId} — not relevant enough.`);
    return;
  }

  // Store the suggestion
  await db.insert(socialSuggestions).values({
    rssItemId,
    memoRssItemId: bestMatch.rssItemId,
    searchQuery,
    matchScore: bestMatch.score.toFixed(4),
    matchedChunkText: bestMatch.chunkText,
    articleTitle: item.title,
    memoTitle: memo.title,
    memoUrl: memo.link,
    suggestedComment: llmResult.comment,
  });

  console.log(`[memo-matcher] Created social suggestion for item ${rssItemId} → memo "${memo.title}"`);
}

async function evaluateAndSuggest(
  ai: AiBinding,
  input: {
    articleTitle: string;
    articleContent: string;
    memoTitle: string;
    memoContent: string;
    matchedChunkText: string;
  },
): Promise<{ comment: string } | null> {
  const systemPrompt = `You are Build Canada's social media strategist. Build Canada is a policy organization at the intersection of technology and Canadian public policy. The tone is analytical, evidence-based, and pro-growth — never sensational, partisan, or clickbait. Think: credible policy commentary that connects current news to deeper analysis.

Your job: Determine if a news article is directly relevant to a Build Canada memo, and if so, draft a short social media post to re-promote the memo.

STRICT RELEVANCE CRITERIA — the article must:
- Cover the SAME specific policy topic, dataset, or issue as the memo
- Not merely share a vague theme (e.g. "technology" or "government spending" is too broad)
- Have a clear, direct connection that a reader would immediately understand

If the match does NOT meet this bar, respond with exactly: NOT_RELEVANT

If the match IS strong, respond with ONLY the social media post text (no preamble, no explanation). The post should:
- Be 1-3 sentences, suitable for Twitter/LinkedIn
- Reference the news development and connect it to Build Canada's existing analysis
- Link naturally to the memo (use [memo] as a placeholder for the URL)
- Sound like a knowledgeable policy analyst sharing timely context, not a marketer`;

  const userPrompt = `NEWS ARTICLE:
Title: ${input.articleTitle}
Content: ${input.articleContent}

BUILD CANADA MEMO:
Title: ${input.memoTitle}
Matched section: ${input.matchedChunkText}
Full memo excerpt: ${input.memoContent}

Is this article directly relevant to this memo? If yes, draft the social post. If not, respond NOT_RELEVANT.`;

  const response = await ai.run(TEXT_GEN_MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.response?.trim();

  if (!text || text.includes("NOT_RELEVANT")) {
    return null;
  }

  return { comment: text };
}
