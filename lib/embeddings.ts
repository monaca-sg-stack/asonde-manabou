export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small" as const;

type EmbeddingsResponse = {
  data: { embedding: number[]; index: number }[];
};

/**
 * Calls OpenAI Embeddings API. `input` may be a single string or a batch.
 * @see https://platform.openai.com/docs/api-reference/embeddings/create
 */
export async function createEmbeddings(
  input: string | string[],
  apiKey: string,
  model: string = OPENAI_EMBEDDING_MODEL
): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as EmbeddingsResponse;
  const sorted = [...json.data].sort((a, b) => a.index - b.index);
  return sorted.map((row) => row.embedding);
}

export async function createEmbedding(
  text: string,
  apiKey: string,
  model?: string
): Promise<number[]> {
  const vectors = await createEmbeddings(text, apiKey, model);
  const first = vectors[0];
  if (!first) throw new Error("OpenAI embeddings returned no vector");
  return first;
}
