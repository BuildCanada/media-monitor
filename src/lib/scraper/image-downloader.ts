import type { PressReaderClient } from "@/lib/pressreader";

export async function downloadAndStoreImage(
  client: PressReaderClient,
  r2: R2Bucket,
  regionKey: string,
  cid: string,
  issueDate: string,
): Promise<string | null> {
  try {
    const imageData = await client.downloadImage(regionKey);
    if (!imageData) return null;

    // Extract a usable filename from the regionKey
    const safeKey = regionKey.replace(/[^a-zA-Z0-9_-]/g, "_");
    const r2Key = `images/${cid}/${issueDate}/${safeKey}.jpg`;

    await r2.put(r2Key, imageData, {
      httpMetadata: { contentType: "image/jpeg" },
    });

    return r2Key;
  } catch (error) {
    console.error(`[image-downloader] Failed to download image ${regionKey}:`, error);
    return null;
  }
}
