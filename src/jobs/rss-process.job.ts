import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { rssEntities, rssFeeds, rssItems } from "@/db/schema/private";
import { chunkMarkdown } from "@/lib/rss/chunker";
import { extractContent } from "@/lib/rss/content-extractor";
import { embedTexts } from "@/lib/rss/embedder";
import { extractEntities } from "@/lib/rss/entity-extractor";
import { type ArticleChunkVector, upsertChunks } from "@/lib/rss/turbopuffer";

import type { Job, JobEnv } from "./runner";
import { register } from "./runner";

export const RssProcessJob: Job<{ rssItemId: number; jobId: number }> = {
  type: "rss-process",

  async perform(env: JobEnv, payload) {
    const { rssItemId } = payload;
    const { db } = env;

    const [item] = await db
      .select()
      .from(rssItems)
      .where(eq(rssItems.id, rssItemId))
      .limit(1);

    if (!item) {
      throw new Error(`RSS item ${rssItemId} not found`);
    }

    const [feed] = await db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.id, item.feedId))
      .limit(1);

    try {
      // Step 1: Extract content
      console.log(`[rss-processor] Extracting content for item ${rssItemId}: ${item.title}`);
      await db
        .update(rssItems)
        .set({ processingStatus: "extracting" })
        .where(eq(rssItems.id, rssItemId));

      const extracted = await extractContent(item.link);
      const contentHash = createHash("sha256").update(extracted.content).digest("hex");

      await db
        .update(rssItems)
        .set({
          contentMarkdown: extracted.content,
          contentHash,
          defuddleTitle: extracted.title,
          defuddleAuthor: extracted.author,
          defuddleDescription: extracted.description,
          defuddleDomain: extracted.domain,
          defuddlePublished: extracted.published,
          defuddleWordCount: extracted.wordCount,
        })
        .where(eq(rssItems.id, rssItemId));

      // Step 2: Check content hash dedup
      const [duplicate] = await db
        .select({ id: rssItems.id })
        .from(rssItems)
        .where(eq(rssItems.contentHash, contentHash))
        .limit(1);

      if (duplicate && duplicate.id !== rssItemId) {
        console.log(`[rss-processor] Duplicate content detected for item ${rssItemId}, skipping`);
        await db
          .update(rssItems)
          .set({ processingStatus: "completed", processedAt: new Date() })
          .where(eq(rssItems.id, rssItemId));
        return;
      }

      // Step 3: Chunk content
      await db
        .update(rssItems)
        .set({ processingStatus: "embedding" })
        .where(eq(rssItems.id, rssItemId));

      const chunks = chunkMarkdown(extracted.content);
      console.log(`[rss-processor] Created ${chunks.length} chunks for item ${rssItemId}`);

      // Step 4: Embed chunks
      const ai = env.ai as {
        run: (model: string, input: { text: string[] }) => Promise<{ data: Array<{ values: number[] }> }>;
      };
      const embeddings = await embedTexts(ai, chunks.map((c) => c.text));

      // Step 5: Extract entities (skipped if GLiNER container not available)
      let entities: Awaited<ReturnType<typeof extractEntities>> = [];
      const glinerContainer = env.glinerContainer as {
        fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
      } | null;

      if (glinerContainer) {
        entities = await extractEntities(glinerContainer, item.title, extracted.content);
      } else {
        console.log(`[rss-processor] Skipping entity extraction (no GLiNER container) for item ${rssItemId}`);
      }

      // Step 6: Save entities to PostgreSQL
      if (entities.length > 0) {
        await db.insert(rssEntities).values(
          entities.map((e) => ({
            rssItemId,
            entityType: e.entityType,
            entityValue: e.entityValue,
            confidence: String(e.confidence),
          })),
        );
      }

      // Step 7: Upsert to Turbopuffer
      const people = entities.filter((e) => e.entityType === "person").map((e) => e.entityValue);
      const orgs = entities.filter((e) => e.entityType === "organization").map((e) => e.entityValue);
      const locations = entities.filter((e) => e.entityType === "location").map((e) => e.entityValue);
      const topics = entities.filter((e) => e.entityType === "topic").map((e) => e.entityValue);

      const vectorChunks: ArticleChunkVector[] = chunks.map((chunk, i) => ({
        rssItemId,
        chunkSeq: chunk.seq,
        vector: embeddings[i],
        title: item.title,
        author: item.author,
        publication: feed?.publicationName || "Unknown",
        pubDate: item.pubDate?.toISOString() || null,
        category: feed?.category || null,
        articleUrl: item.link,
        chunkText: chunk.text,
        entitiesPeople: people,
        entitiesOrganizations: orgs,
        entitiesLocations: locations,
        entitiesTopics: topics,
      }));

      await upsertChunks(env.turbopufferApiKey!, env.turbopufferNamespace!, vectorChunks);

      // Step 8: Mark completed
      await db
        .update(rssItems)
        .set({ processingStatus: "completed", processedAt: new Date() })
        .where(eq(rssItems.id, rssItemId));

      console.log(`[rss-processor] Completed item ${rssItemId}: ${item.title}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[rss-processor] Failed item ${rssItemId}:`, errorMessage);
      await db
        .update(rssItems)
        .set({
          processingStatus: "failed",
          processingError: errorMessage,
        })
        .where(eq(rssItems.id, rssItemId));
      throw new Error(`RSS processing failed for item ${rssItemId}: ${errorMessage}`);
    }
  },
};

register(RssProcessJob);
