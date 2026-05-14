"use client";

import { useEffect, useMemo, useState } from "react";
import { dailyQuestions } from "./dailyQuestions";

type Member = "monaca-a" | "monaca-b";

type Entry = {
  id: string;
  member: Member;
  question: string;
  date: string;
  textAnswer: string;
  createdAt: string;
};

type LayerId = "state" | "motivation" | "relationship" | "spacetime" | "attitude";

type TagDefinition = {
  layer: LayerId;
  label: string;
  keywords: string[];
  meaning: string;
};

type TagScore = {
  layer: LayerId;
  label: string;
  count: number;
  meaning: string;
};

const members: { id: Member; name: string }[] = [
  { id: "monaca-a", name: "もなかA" },
  { id: "monaca-b", name: "もなかB" },
];

const storageKey = "asobi-sense-entries-v1";
const questionBlockSizes = [
  25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 15,
] as const;

const layerLabels: Record<LayerId, string> = {
  state: "状態",
  motivation: "動機",
  relationship: "関係性",
  spacetime: "空間・時間",
  attitude: "態度・価値観",
};

const layerOrder: LayerId[] = [
  "state",
  "motivation",
  "relationship",
  "spacetime",
  "attitude",
];

const tagDefinitions: TagDefinition[] = [
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

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const cloned = new Date(date);
  const day = cloned.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  cloned.setDate(cloned.getDate() + diff);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function getQuestionForDate(date: Date): string {
  const base = Date.UTC(2026, 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const elapsedDays = Math.floor((current - base) / (24 * 60 * 60 * 1000));
  const normalizedDay =
    ((elapsedDays % dailyQuestions.length) + dailyQuestions.length) %
    dailyQuestions.length;
  const blockIndex =
    ((elapsedDays % questionBlockSizes.length) + questionBlockSizes.length) %
    questionBlockSizes.length;
  const roundInBlock = Math.floor(normalizedDay / questionBlockSizes.length);
  const offsetInBlock = roundInBlock % questionBlockSizes[blockIndex];
  const startIndex = questionBlockSizes
    .slice(0, blockIndex)
    .reduce((sum, size) => sum + size, 0);
  return dailyQuestions[startIndex + offsetInBlock];
}

function normalizeText(value: string): string {
  return value.toLowerCase();
}

function scoreTagsFromEntries(entries: Entry[]): TagScore[] {
  const textBlob = normalizeText(
    entries.map((entry) => entry.textAnswer).join(" ")
  );

  return tagDefinitions
    .map((definition) => {
      const count = definition.keywords.reduce((sum, keyword) => {
        const matched = textBlob.includes(normalizeText(keyword)) ? 1 : 0;
        return sum + matched;
      }, 0);
      return {
        layer: definition.layer,
        label: definition.label,
        count,
        meaning: definition.meaning,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function groupByLayer(scores: TagScore[]): Record<LayerId, TagScore[]> {
  const grouped: Record<LayerId, TagScore[]> = {
    state: [],
    motivation: [],
    relationship: [],
    spacetime: [],
    attitude: [],
  };
  scores.forEach((score) => {
    grouped[score.layer].push(score);
  });
  layerOrder.forEach((layer) => {
    grouped[layer].sort((a, b) => b.count - a.count);
  });
  return grouped;
}

function buildPersonalInsight(scores: TagScore[]): string {
  if (scores.length === 0) {
    return "テキスト回答が増えるほど、あなたのあそび観が見えてきます。";
  }
  const primary = scores[0];
  return `今週は「${primary.label}」が強めです。${primary.meaning}`;
}

function buildTeamInsight(scores: TagScore[]): string {
  if (scores.length === 0) {
    return "2人の回答がそろうほど、チームのあそび観が見えてきます。";
  }
  if (scores.length === 1) {
    return `2人の共通感覚は「${scores[0].label}」です。`;
  }
  return `2人の共通感覚は「${scores[0].label}」と「${scores[1].label}」です。`;
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Array<Partial<Entry>>;
      return parsed
        .filter(
          (entry): entry is Partial<Entry> &
            Pick<Entry, "id" | "member" | "question" | "date" | "createdAt"> =>
            typeof entry.id === "string" &&
            (entry.member === "monaca-a" || entry.member === "monaca-b") &&
            typeof entry.question === "string" &&
            typeof entry.date === "string" &&
            typeof entry.createdAt === "string"
        )
        .map((entry) => ({
          id: entry.id,
          member: entry.member,
          question: entry.question,
          date: entry.date,
          createdAt: entry.createdAt,
          textAnswer:
            typeof entry.textAnswer === "string"
              ? entry.textAnswer
              : "（テキスト回答なし）",
        }));
    } catch {
      window.localStorage.removeItem(storageKey);
      return [];
    }
  });
  const [selectedMember, setSelectedMember] = useState<Member>("monaca-a");
  const [textAnswer, setTextAnswer] = useState("");
  const [error, setError] = useState("");

  const today = useMemo(() => new Date(), []);
  const todayDate = useMemo(() => formatDate(today), [today]);
  const todayQuestion = useMemo(() => getQuestionForDate(today), [today]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  const todaysEntries = useMemo(
    () => entries.filter((entry) => entry.date === todayDate),
    [entries, todayDate]
  );

  const weeklyEntries = useMemo(() => {
    const weekStart = startOfWeek(today);
    return entries
      .filter((entry) => new Date(entry.date) >= weekStart)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [entries, today]);

  const personalEntries = useMemo(
    () => weeklyEntries.filter((entry) => entry.member === selectedMember),
    [weeklyEntries, selectedMember]
  );

  const teamSummary = useMemo(() => {
    const byMember = members.map((member) => ({
      member: member.name,
      count: weeklyEntries.filter((entry) => entry.member === member.id).length,
    }));
    return byMember;
  }, [weeklyEntries]);

  const personalTagScores = useMemo(
    () => scoreTagsFromEntries(personalEntries),
    [personalEntries]
  );

  const teamTagScores = useMemo(
    () => scoreTagsFromEntries(weeklyEntries),
    [weeklyEntries]
  );

  const memberAScores = useMemo(
    () => scoreTagsFromEntries(weeklyEntries.filter((entry) => entry.member === "monaca-a")),
    [weeklyEntries]
  );
  const memberBScores = useMemo(
    () => scoreTagsFromEntries(weeklyEntries.filter((entry) => entry.member === "monaca-b")),
    [weeklyEntries]
  );
  const personalLayered = useMemo(() => groupByLayer(personalTagScores), [personalTagScores]);
  const teamLayered = useMemo(() => groupByLayer(teamTagScores), [teamTagScores]);
  const sharedAndDiff = useMemo(() => {
    const aSet = new Set(memberAScores.map((score) => score.label));
    const bSet = new Set(memberBScores.map((score) => score.label));
    const shared = [...aSet].filter((label) => bSet.has(label));
    const onlyA = [...aSet].filter((label) => !bSet.has(label));
    const onlyB = [...bSet].filter((label) => !aSet.has(label));
    return { shared, onlyA, onlyB };
  }, [memberAScores, memberBScores]);

  const saveEntry = () => {
    setError("");
    if (textAnswer.trim().length === 0) {
      setError("テキスト回答を入力してください。");
      return;
    }

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      member: selectedMember,
      question: todayQuestion,
      date: todayDate,
      textAnswer: textAnswer.trim(),
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setTextAnswer("");
  };

  return (
    <main className="page">
      <section className="hero">
        <p className="tag">あそび感覚ログ / 2人版MVP</p>
        <h1>1日1問で、個人観とチーム観を育てる</h1>
        <p className="lead">
          思想ではなく、その人の「あそび感覚」を毎日少しずつ積み上げます。
        </p>
      </section>

      <section className="result-card left-card">
        <h2>今日の問い（{todayDate}）</h2>
        <p className="lead question">{todayQuestion}</p>

        <div className="member-switch">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`chip ${selectedMember === member.id ? "active" : ""}`}
              onClick={() => setSelectedMember(member.id)}
            >
              {member.name}
            </button>
          ))}
        </div>

        <textarea
          className="input"
          placeholder="今日の感覚を短く書いてみる"
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          rows={4}
        />

        {error ? <p className="error">{error}</p> : null}

        <button type="button" className="primary-button" onClick={saveEntry}>
          回答を保存する
        </button>
      </section>

      <section className="menu-grid" aria-label="分析ビュー">
        <article className="menu-card">
          <h2>個人観（今週）</h2>
          <p className="lead">
            {members.find((member) => member.id === selectedMember)?.name}の記録:
            {personalEntries.length}件
          </p>
          <div className="stack">
            <div className="insight-box">
              <p className="mini-date">いま見えているあそび観</p>
              <p className="mini-answer">{buildPersonalInsight(personalTagScores)}</p>
              {layerOrder.map((layer) => (
                <div key={layer} className="layer-row">
                  <p className="layer-title">{layerLabels[layer]}</p>
                  <div className="tag-list">
                    {personalLayered[layer].slice(0, 2).map((tag) => (
                      <span key={`${layer}-${tag.label}`} className="sense-tag">
                        {tag.label} ({tag.count})
                      </span>
                    ))}
                    {personalLayered[layer].length === 0 ? (
                      <span className="sense-tag muted-tag">まだ検出なし</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {personalEntries.slice(0, 4).map((entry) => (
              <div key={entry.id} className="mini-card">
                <p className="mini-date">{entry.date}</p>
                <p>{entry.question}</p>
                <p className="mini-answer">{entry.textAnswer}</p>
              </div>
            ))}
            {personalEntries.length === 0 ? (
              <p className="lead">まだ回答がありません。</p>
            ) : null}
          </div>
        </article>

        <article className="menu-card">
          <h2>チーム観（今週）</h2>
          <p className="lead">2人の回答量と今日の並びを見える化します。</p>
          <div className="stack">
            <div className="insight-box">
              <p className="mini-date">2人の共通あそび観</p>
              <p className="mini-answer">{buildTeamInsight(teamTagScores)}</p>
              <div className="mini-card">
                <p className="mini-date">共通タグ</p>
                <p className="mini-answer">
                  {sharedAndDiff.shared.length > 0
                    ? sharedAndDiff.shared.slice(0, 6).join(" / ")
                    : "まだ共通タグなし"}
                </p>
                <p className="mini-date">差分タグ</p>
                <p className="mini-answer">
                  もなかA: {sharedAndDiff.onlyA.slice(0, 4).join(" / ") || "なし"}
                  <br />
                  もなかB: {sharedAndDiff.onlyB.slice(0, 4).join(" / ") || "なし"}
                </p>
              </div>
              {layerOrder.map((layer) => (
                <div key={layer} className="layer-row">
                  <p className="layer-title">{layerLabels[layer]}</p>
                  <div className="tag-list">
                    {teamLayered[layer].slice(0, 2).map((tag) => (
                      <span key={`${layer}-team-${tag.label}`} className="sense-tag">
                        {tag.label} ({tag.count})
                      </span>
                    ))}
                    {teamLayered[layer].length === 0 ? (
                      <span className="sense-tag muted-tag">まだ検出なし</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {teamSummary.map((summary) => (
              <p key={summary.member} className="lead">
                {summary.member}: {summary.count}件
              </p>
            ))}
            <hr className="divider" />
            <p className="lead">今日の回答</p>
            {members.map((member) => {
              const entry = todaysEntries.find((item) => item.member === member.id);
              return (
                <div key={member.id} className="mini-card">
                  <p className="mini-date">{member.name}</p>
                  {entry ? (
                    <p className="mini-answer">{entry.textAnswer}</p>
                  ) : (
                    <p className="mini-answer">未回答</p>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
