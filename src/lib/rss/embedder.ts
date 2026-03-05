interface AiBinding {
  run(
    model: string,
    input: { text: string[] },
  ): Promise<{ data: Array<{ values: number[] }> }>;
}

const BATCH_SIZE = 100;

export async function embedTexts(
  ai: AiBinding,
  texts: string[],
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const result = await ai.run("@cf/baai/bge-m3", { text: batch });

    // Workers AI returns { data: [number[]] } — each element is the embedding directly
    const data = result.data as unknown[];
    for (const item of data) {
      if (Array.isArray(item)) {
        // Direct array of numbers (newer API shape)
        allEmbeddings.push(item as number[]);
      } else if (item && typeof item === "object" && "values" in item) {
        // { values: number[] } shape
        allEmbeddings.push((item as { values: number[] }).values);
      } else {
        console.error("[embedder] Unexpected embedding shape:", JSON.stringify(item)?.slice(0, 200));
        throw new Error("Unexpected embedding response shape from Workers AI");
      }
    }
  }

  return allEmbeddings;
}
