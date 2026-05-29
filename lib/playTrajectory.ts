import { scoreTagsKeywordOnly } from "./classifyPlayResponse";
import type { LayerId, TagScore } from "./labels";
import { layerLabels, layerOrder } from "./labels";

export type LabelAggregate = {
  label: string;
  layer: LayerId;
  totalScore: number;
  hitCount: number;
};

export type LayerWeatherItem = {
  layer: LayerId;
  layerName: string;
  label: string | null;
  score: number;
  mood: string;
};

export function startOfWeek(date: Date): Date {
  const cloned = new Date(date);
  const day = cloned.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  cloned.setDate(cloned.getDate() + diff);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

export function startOfMonth(date: Date): Date {
  const cloned = new Date(date.getFullYear(), date.getMonth(), 1);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

export function startOfPreviousWeek(date: Date): Date {
  const thisWeek = startOfWeek(date);
  const prev = new Date(thisWeek);
  prev.setDate(prev.getDate() - 7);
  return prev;
}

export function isDateInRange(dateStr: string, start: Date, endExclusive: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d < endExclusive;
}

/** 回答ごとにキーワード判定し、ラベルごとにスコアを合算（API不要） */
export function aggregateLabelsFromEntries(
  entries: { textAnswer: string }[]
): LabelAggregate[] {
  const map = new Map<string, LabelAggregate>();
  for (const entry of entries) {
    const tags = scoreTagsKeywordOnly([entry]);
    for (const tag of tags) {
      const existing = map.get(tag.label);
      if (existing) {
        existing.totalScore += tag.score;
        existing.hitCount += 1;
      } else {
        map.set(tag.label, {
          label: tag.label,
          layer: tag.layer,
          totalScore: tag.score,
          hitCount: 1,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.totalScore - a.totalScore);
}

export function topRegularLabels(
  entries: { textAnswer: string }[],
  limit = 5
): LabelAggregate[] {
  return aggregateLabelsFromEntries(entries).slice(0, limit);
}

function moodFromScore(score: number): string {
  if (score >= 0.55) return "☀️";
  if (score >= 0.38) return "🌤️";
  if (score > 0) return "🌥️";
  return "—";
}

/** ③ レイヤー別の「天気」— 各レイヤーでいちばん強いタグ1つ */
export function layerWeatherFromScores(scores: TagScore[]): LayerWeatherItem[] {
  const byLayer: Record<LayerId, TagScore[]> = {
    state: [],
    motivation: [],
    relationship: [],
    spacetime: [],
    attitude: [],
  };
  scores.forEach((s) => byLayer[s.layer].push(s));
  return layerOrder.map((layer) => {
    const sorted = [...byLayer[layer]].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    return {
      layer,
      layerName: layerLabels[layer],
      label: top?.label ?? null,
      score: top?.score ?? 0,
      mood: top ? moodFromScore(top.score) : "—",
    };
  });
}

/** ④ 先週 vs 今週の一行ストーリー */
export function buildTrajectoryStory(
  thisWeekScores: TagScore[],
  lastWeekScores: TagScore[]
): string {
  if (thisWeekScores.length === 0) {
    return "今週の回答がたまると、遊び感の一行ストーリーが見えてきます。";
  }
  const thisTop = thisWeekScores[0];
  if (lastWeekScores.length === 0) {
    return `今週は「${thisTop.label}」の感覚が目立っています。先週ぶんがたまると、変化の一行が見えてきます。`;
  }
  const lastTop = lastWeekScores[0];
  if (thisTop.label === lastTop.label) {
    return `先週も今週も「${thisTop.label}」が続いています。いまのあなたの遊び感の軸になりそうです。`;
  }
  const thisLabels = new Set(thisWeekScores.slice(0, 3).map((s) => s.label));
  const lastLabels = new Set(lastWeekScores.slice(0, 3).map((s) => s.label));
  const appeared = [...thisLabels].filter((l) => !lastLabels.has(l));
  if (appeared.length > 0) {
    return `先週は「${lastTop.label}」、今週は「${thisTop.label}」が強く出ています。新しく「${appeared[0]}」も混ざり始めています。`;
  }
  return `先週は「${lastTop.label}」、今週は「${thisTop.label}」が強く出ています。遊び感の行き来が動き始めています。`;
}
