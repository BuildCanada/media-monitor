import { eq } from "drizzle-orm";

import type { Db } from "@/db";
import { publications } from "@/db/schema/media-monitor";
import { publicationSyncLog } from "@/db/schema/private";
import type { PressReaderClient } from "@/lib/pressreader";
import { toPublicationInsert } from "@/lib/pressreader";

const PAGE_SIZE = 50;

export async function syncCatalog(db: Db, client: PressReaderClient): Promise<void> {
  console.log("[catalog-sync] Starting publication catalog sync...");

  let offset = 0;
  let totalFound = 0;
  let newAdded = 0;
  let updated = 0;

  while (true) {
    const response = await client.getPublications(offset, PAGE_SIZE);
    const pubs = response.publications ?? [];
    totalFound = response.totalCount ?? totalFound;

    if (pubs.length === 0) break;

    for (const pub of pubs) {
      const data = toPublicationInsert(pub);

      const [existing] = await db
        .select({ id: publications.id })
        .from(publications)
        .where(eq(publications.cid, pub.cid))
        .limit(1);

      if (existing) {
        await db
          .update(publications)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(publications.cid, pub.cid));
        updated++;
      } else {
        await db.insert(publications).values({ ...data, enabled: false });
        newAdded++;
      }
    }

    offset += pubs.length;
    console.log(`[catalog-sync] Processed ${offset} of ${totalFound} publications`);

    if (offset >= totalFound) break;
  }

  await db.insert(publicationSyncLog).values({ totalFound, newAdded, updated });
  console.log(
    `[catalog-sync] Complete: ${totalFound} found, ${newAdded} new, ${updated} updated`,
  );
}
