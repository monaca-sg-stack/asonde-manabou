export type LayerId = "state" | "motivation" | "relationship" | "spacetime" | "attitude";

export type PlayLabelDefinition = {
  layer: LayerId;
  label: string;
  keywords: string[];
  meaning: string;
  /** 埋め込み用の説明文（セマンティック類似度の参照テキスト） */
  description: string;
};

/**
 * 分類結果（キーワード + 埋め込み）。`layer` / `meaning` はレイヤーUI・インサイト用。
 */
export type TagScore = {
  label: string;
  score: number;
  keywordScore: number;
  similarityScore: number;
  /** 「理由:」からまとめ文まで含む複数行テキスト */
  reason: string;
  layer: LayerId;
  meaning: string;
};

export const layerLabels: Record<LayerId, string> = {
  state: "状態",
  motivation: "動機",
  relationship: "関係性",
  spacetime: "空間・時間",
  attitude: "態度・価値観",
};

export const layerOrder: LayerId[] = [
  "state",
  "motivation",
  "relationship",
  "spacetime",
  "attitude",
];

type RawLabel = Omit<PlayLabelDefinition, "description">;

const rawPlayLabels: RawLabel[] = [
  { layer: "state", label: "没頭", keywords: ["夢中", "集中", "時間を忘れる", "ハマる", "はまる"], meaning: "自我を忘れるほど入り込む" },
  { layer: "state", label: "高揚", keywords: ["ワクワク", "わくわく", "テンション", "盛り上がる"], meaning: "感情エネルギーが上がる" },
  { layer: "state", label: "静けさ", keywords: ["ぼーっと", "落ち着く", "穏やか"], meaning: "静かな遊び状態" },
  { layer: "state", label: "漂流", keywords: ["ふらふら", "流れ", "気まま", "偶然"], meaning: "目的なく流れる" },
  { layer: "state", label: "リズム", keywords: ["ノリ", "テンポ", "繰り返し"], meaning: "反復の快楽" },
  { layer: "state", label: "めまい", keywords: ["ぐるぐる", "スリル", "ジェットコースター"], meaning: "感覚を揺さぶる遊び" },
  { layer: "motivation", label: "自由", keywords: ["のびのび", "気にしない", "無駄", "自由"], meaning: "役に立たなさの自由" },
  { layer: "motivation", label: "好奇心", keywords: ["知りたい", "気になる", "見てみたい"], meaning: "未知への欲求" },
  { layer: "motivation", label: "挑戦", keywords: ["試す", "チャレンジ", "難しい"], meaning: "難しさを超えたい" },
  { layer: "motivation", label: "発見", keywords: ["気づき", "偶然", "ひらめき"], meaning: "思いがけない出会い" },
  { layer: "motivation", label: "変身", keywords: ["なりきり", "ごっこ", "演じる"], meaning: "別の存在になりたい" },
  { layer: "motivation", label: "収集", keywords: ["集める", "並べる", "コレクション"], meaning: "世界を手元に集積したい" },
  { layer: "motivation", label: "破壊", keywords: ["壊す", "崩す", "解体"], meaning: "既存を壊して確かめる" },
  { layer: "relationship", label: "つながり", keywords: ["一緒", "共有", "笑う"], meaning: "共にいる楽しさ" },
  { layer: "relationship", label: "共鳴", keywords: ["通じる", "ノリ", "息が合う"], meaning: "感覚が同期する" },
  { layer: "relationship", label: "競争", keywords: ["勝負", "ライバル", "勝ち負け"], meaning: "競い合う快楽" },
  { layer: "relationship", label: "ケア", keywords: ["見守る", "安心", "支える"], meaning: "安全だから遊べる" },
  { layer: "relationship", label: "いたずら", keywords: ["茶化す", "冗談", "ツッコミ"], meaning: "ズラしによる笑い" },
  { layer: "relationship", label: "儀式", keywords: ["お約束", "合図", "順番"], meaning: "共有ルールが場を作る" },
  { layer: "spacetime", label: "余白", keywords: ["寄り道", "空白", "休む"], meaning: "急がない時間" },
  { layer: "spacetime", label: "境界", keywords: ["ここだけ", "秘密", "特別"], meaning: "日常から切り離された場" },
  { layer: "spacetime", label: "祭り", keywords: ["ハレ", "イベント", "非日常"], meaning: "特別な時間" },
  { layer: "spacetime", label: "探検", keywords: ["冒険", "行ってみる", "未知"], meaning: "知らない場所へ向かう" },
  { layer: "spacetime", label: "漂着", keywords: ["偶然見つけた", "迷い込む"], meaning: "計画外の出会い" },
  { layer: "attitude", label: "実験", keywords: ["試行錯誤", "検証", "やってみる"], meaning: "完成より試行" },
  { layer: "attitude", label: "創造", keywords: ["作る", "生み出す", "描く"], meaning: "世界を編集する" },
  { layer: "attitude", label: "編集", keywords: ["組み合わせ", "改造", "アレンジ"], meaning: "既存を遊び直す" },
  { layer: "attitude", label: "無目的", keywords: ["なんとなく", "意味ない", "遊び半分"], meaning: "役立ちから自由になる" },
  { layer: "attitude", label: "身体性", keywords: ["触る", "動く", "踊る"], meaning: "身体で考える" },
  { layer: "attitude", label: "美意識", keywords: ["かわいい", "センス", "心地いい"], meaning: "好きな感覚を追う" },
];

function buildDescription(def: RawLabel): string {
  const layerJa = layerLabels[def.layer];
  return `${layerJa}の観点「${def.label}」: ${def.meaning}。関連語: ${def.keywords.join("、")}。`;
}

export const playLabelDefinitions: PlayLabelDefinition[] = rawPlayLabels.map((def) => ({
  ...def,
  description: buildDescription(def),
}));
