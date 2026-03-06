import { matchMemosForArticle } from "@/lib/rss/memo-matcher";

import type { Job, JobEnv } from "./runner";
import { register } from "./runner";

export const MemoMatchJob: Job<{ rssItemId: number }> = {
  type: "memo-match",

  async perform(env: JobEnv, payload) {
    const { rssItemId } = payload;

    if (!env.turbopufferApiKey || !env.turbopufferNamespace) {
      console.log(`[memo-match] Missing Turbopuffer config, skipping item ${rssItemId}.`);
      return;
    }

    await matchMemosForArticle(
      env.db,
      env.ai as Parameters<typeof matchMemosForArticle>[1],
      env.turbopufferApiKey,
      env.turbopufferNamespace,
      rssItemId,
    );
  },
};

register(MemoMatchJob);
