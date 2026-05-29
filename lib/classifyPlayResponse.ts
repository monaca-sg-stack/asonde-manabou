import { cosineSimilarity } from "./cosineSimilarity";
import { createEmbedding, createEmbeddings } from "./embeddings";
import type { PlayLabelDefinition, TagScore } from "./labels";
import { playLabelDefinitions } from "./labels";

const LABEL_VECTOR_CACHE = new Map<string, number[]>();

export const DEFAULT_SIMILARITY_THRESHOLD = 0.28;
export const DEFAULT_KEYWORD_WEIGHT = 0.4;
export const DEFAULT_EMBEDDING_WEIGHT = 0.6;
export const DEFAULT_TOP_K = 3;

/** 回答断片とラベルベクトルの最低コサイン類似度（これ未満は理由の引用に含めない） */
export const REASON_SEGMENT_SIM_THRESHOLD = 0.18;

const REASON_MAX_SEGMENTS = 20;
const REASON_SEGMENT_MAX_LEN = 80;

export type ClassifyPlayResponseOptions = {
  apiKey: string;
  definitions?: PlayLabelDefinition[];
  /** Cosine similarity below this → embedding term is 0 (keyword term still applies). */
  similarityThreshold?: number;
  keywordWeight?: number;
  embeddingWeight?: number;
  /** Number of top labels to return (sorted by final score descending). */
  topK?: number;
};

function normalizeText(value: string): string {
  return value.toLowerCase();
}

function labelCacheKey(def: PlayLabelDefinition): string {
  return `${def.label}::${def.description}`;
}

async function getLabelEmbeddingVectors(
  definitions: PlayLabelDefinition[],
  apiKey: string
): Promise<number[][]> {
  const missing: PlayLabelDefinition[] = [];
  for (const def of definitions) {
    const key = labelCacheKey(def);
    if (!LABEL_VECTOR_CACHE.has(key)) {
      missing.push(def);
    }
  }
  if (missing.length > 0) {
    const inputs = missing.map((d) => d.description);
    const batch = await createEmbeddings(inputs, apiKey);
    missing.forEach((def, i) => {
      const vec = batch[i];
      if (vec) LABEL_VECTOR_CACHE.set(labelCacheKey(def), vec);
    });
  }
  return definitions.map((def) => {
    const v = LABEL_VECTOR_CACHE.get(labelCacheKey(def));
    if (!v) throw new Error(`Missing cached embedding for label: ${def.label}`);
    return v;
  });
}

function keywordScoreNormalized(def: PlayLabelDefinition, textBlob: string): number {
  const maxKw = Math.max(def.keywords.length, 1);
  const hits = def.keywords.reduce((sum, keyword) => {
    return sum + (textBlob.includes(normalizeText(keyword)) ? 1 : 0);
  }, 0);
  return Math.min(1, hits / maxKw);
}

function splitUserSegments(original: string): string[] {
  const parts = original
    .split(/[\n\r。．.!?？]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p.length > REASON_SEGMENT_MAX_LEN ? p.slice(0, REASON_SEGMENT_MAX_LEN) + "…" : p);
    if (out.length >= REASON_MAX_SEGMENTS) break;
  }
  if (out.length === 0) {
    const t = original.trim();
    return t.length > 0 ? [t.length > REASON_SEGMENT_MAX_LEN ? t.slice(0, REASON_SEGMENT_MAX_LEN) + "…" : t] : [];
  }
  return out;
}

function buildReasonBlock(
  textBlob: string,
  def: PlayLabelDefinition,
  labelVec: number[],
  segmentTexts: string[],
  segmentVecs: number[][],
  topThreeLabelNames: string[]
): string {
  const quoted: string[] = [];
  const seen = new Set<string>();

  for (const kw of def.keywords) {
    if (textBlob.includes(normalizeText(kw))) {
      const line = `「${kw}」`;
      if (!seen.has(line)) {
        seen.add(line);
        quoted.push(line);
      }
    }
  }

  if (segmentTexts.length > 0 && segmentVecs.length === segmentTexts.length) {
    const ranked = segmentTexts
      .map((text, i) => ({
        text,
        sim: cosineSimilarity(segmentVecs[i]!, labelVec),
      }))
      .sort((a, b) => b.sim - a.sim);

    for (const row of ranked) {
      if (row.sim < REASON_SEGMENT_SIM_THRESHOLD) break;
      const short = row.text.length > 42 ? row.text.slice(0, 39) + "…" : row.text;
      const line = `「${short}」`;
      if (!seen.has(line)) {
        seen.add(line);
        quoted.push(line);
      }
      if (quoted.length >= 5) break;
    }
  }

  if (quoted.length === 0) {
    quoted.push("「（このラベルに直結する表現を、回答からは拾いにくい状態でした）」");
  }

  const footer = `という感覚が、${topThreeLabelNames.join("・")}に近い。`;
  return `理由:\n${quoted.join("\n")}\n\n${footer}`;
}

function buildReasonKeywordOnly(
  textBlob: string,
  def: PlayLabelDefinition,
  topThreeLabelNames: string[]
): string {
  const quoted: string[] = [];
  const seen = new Set<string>();
  for (const kw of def.keywords) {
    if (textBlob.includes(normalizeText(kw))) {
      const line = `「${kw}」`;
      if (!seen.has(line)) {
        seen.add(line);
        quoted.push(line);
      }
    }
  }
  if (quoted.length === 0) {
    quoted.push("「（キーワード一致なし）」");
  }
  const footer = `という感覚が、${topThreeLabelNames.join("・")}に近い。`;
  return `理由:\n${quoted.join("\n")}\n\n${footer}`;
}

/**
 * 従来のキーワード一致のみ（API 失敗時やオフライン想定のフォールバック）。
 */
export function scoreTagsKeywordOnly(entries: { textAnswer: string }[]): TagScore[] {
  const definitions = playLabelDefinitions;
  const joined = entries.map((entry) => entry.textAnswer).join("\n");
  const textBlob = normalizeText(joined);

  const rows = definitions
    .map((definition) => {
      const hits = definition.keywords.reduce((sum, keyword) => {
        return sum + (textBlob.includes(normalizeText(keyword)) ? 1 : 0);
      }, 0);
      const maxKw = Math.max(definition.keywords.length, 1);
      const keywordScore = Math.min(1, hits / maxKw);
      return { definition, hits, keywordScore };
    })
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.keywordScore - a.keywordScore || b.hits - a.hits);

  const topThree = rows.slice(0, 3).map((r) => r.definition.label);

  return rows.map((row) => {
    const kw = Math.round(row.keywordScore * 1000) / 1000;
    return {
      label: row.definition.label,
      score: kw,
      keywordScore: kw,
      similarityScore: 0,
      reason: buildReasonKeywordOnly(textBlob, row.definition, topThree),
      layer: row.definition.layer,
      meaning: row.definition.meaning,
    };
  });
}

/**
 * キーワード（40%）と埋め込みコサイン類似度（60%）を組み合わせ、上位 `topK` ラベルを返す。
 */
export async function classifyPlayResponse(
  userText: string,
  options: ClassifyPlayResponseOptions
): Promise<TagScore[]> {
  const trimmed = userText.trim();
  if (!trimmed) return [];

  const definitions = options.definitions ?? playLabelDefinitions;
  const similarityThreshold = options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
  const keywordWeight = options.keywordWeight ?? DEFAULT_KEYWORD_WEIGHT;
  const embeddingWeight = options.embeddingWeight ?? DEFAULT_EMBEDDING_WEIGHT;
  const topK = options.topK ?? DEFAULT_TOP_K;

  const textBlob = normalizeText(trimmed);
  const segmentTexts = splitUserSegments(trimmed);

  const [labelVectors, userVector, segmentVecs] = await Promise.all([
    getLabelEmbeddingVectors(definitions, options.apiKey),
    createEmbedding(trimmed, options.apiKey),
    segmentTexts.length > 0
      ? createEmbeddings(segmentTexts, options.apiKey)
      : Promise.resolve([] as number[][]),
  ]);

  const scored = definitions.map((def, index) => {
    const kw = keywordScoreNormalized(def, textBlob);
    const rawSim = cosineSimilarity(userVector, labelVectors[index]!);
    const simForBlend = rawSim >= similarityThreshold ? rawSim : 0;
    const finalScore = kw * keywordWeight + simForBlend * embeddingWeight;
    return {
      def,
      index,
      keywordScore: Math.round(kw * 1000) / 1000,
      similarityScore: Math.round(rawSim * 1000) / 1000,
      score: Math.round(finalScore * 1000) / 1000,
      _final: finalScore,
    };
  });

  scored.sort((a, b) => b._final - a._final);
  const topSlice = scored.slice(0, topK);
  const topThreeNames = topSlice.map((row) => row.def.label);

  return topSlice.map((row) => {
    const labelVec = labelVectors[row.index]!;
    const reason = buildReasonBlock(
      textBlob,
      row.def,
      labelVec,
      segmentTexts,
      segmentVecs,
      topThreeNames
    );
    return {
      label: row.def.label,
      score: row.score,
      keywordScore: row.keywordScore,
      similarityScore: row.similarityScore,
      reason,
      layer: row.def.layer,
      meaning: row.def.meaning,
    };
  });
}
