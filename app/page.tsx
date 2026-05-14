"use client";

import { useEffect, useMemo, useState } from "react";
import { dailyQuestions } from "./dailyQuestions";

type MemberProfile = {
  id: string;
  name: string;
};

type Entry = {
  id: string;
  member: string;
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

const defaultMembers: MemberProfile[] = [
  { id: "monaca-a", name: "もなかA" },
  { id: "monaca-b", name: "もなかB" },
];

const storageKey = "asobi-sense-entries-v1";
const membersStorageKey = "asobi-sense-members-v1";

function loadMembersFromStorage(): MemberProfile[] {
  if (typeof window === "undefined") return defaultMembers;
  const raw = window.localStorage.getItem(membersStorageKey);
  if (!raw) return defaultMembers;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultMembers;
    const cleaned = parsed
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
        const rawName = typeof r.name === "string" ? r.name.trim() : "";
        const name = rawName.length > 0 ? rawName : "（名前未設定）";
        if (!id) return null;
        return { id, name };
      })
      .filter((m): m is MemberProfile => m !== null);
    return cleaned.length > 0 ? cleaned : defaultMembers;
  } catch {
    return defaultMembers;
  }
}
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

function buildTeamInsight(scores: TagScore[], memberCount: number): string {
  if (scores.length === 0) {
    if (memberCount <= 1) {
      return "メンバーが複数になると、チームとしての共通観が見えてきます。";
    }
    return `${memberCount}人の回答がそろうほど、チームのあそび観が見えてきます。`;
  }
  if (scores.length === 1) {
    return `チームの共通感覚は「${scores[0].label}」です。`;
  }
  return `チームの共通感覚は「${scores[0].label}」と「${scores[1].label}」です。`;
}

export default function Home() {
  const [members, setMembers] = useState<MemberProfile[]>(() => loadMembersFromStorage());
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
            typeof entry.member === "string" &&
            entry.member.length > 0 &&
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
  const [selectedMember, setSelectedMember] = useState<string>(() => {
    const initial = loadMembersFromStorage();
    return initial[0]?.id ?? "monaca-a";
  });
  const [textAnswer, setTextAnswer] = useState("");
  const [error, setError] = useState("");

  const today = useMemo(() => new Date(), []);
  const todayDate = useMemo(() => formatDate(today), [today]);
  const todayQuestion = useMemo(() => getQuestionForDate(today), [today]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    window.localStorage.setItem(membersStorageKey, JSON.stringify(members));
  }, [members]);

  const activeMemberId = useMemo(() => {
    if (members.length === 0) return "";
    return members.some((m) => m.id === selectedMember) ? selectedMember : members[0].id;
  }, [members, selectedMember]);

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
    () => weeklyEntries.filter((entry) => entry.member === activeMemberId),
    [weeklyEntries, activeMemberId]
  );

  const teamSummary = useMemo(() => {
    return members.map((member) => ({
      id: member.id,
      member: member.name,
      count: weeklyEntries.filter((entry) => entry.member === member.id).length,
    }));
  }, [weeklyEntries, members]);

  const personalTagScores = useMemo(
    () => scoreTagsFromEntries(personalEntries),
    [personalEntries]
  );

  const teamTagScores = useMemo(
    () => scoreTagsFromEntries(weeklyEntries),
    [weeklyEntries]
  );

  const personalLayered = useMemo(() => groupByLayer(personalTagScores), [personalTagScores]);
  const teamLayered = useMemo(() => groupByLayer(teamTagScores), [teamTagScores]);

  const sharedAndDiff = useMemo(() => {
    if (members.length === 0) {
      return { shared: [] as string[], perMember: [] as { id: string; name: string; labels: string[] }[] };
    }
    const perMemberSets = members.map((m) => {
      const weekForMember = weeklyEntries.filter((entry) => entry.member === m.id);
      if (weekForMember.length === 0) {
        return { id: m.id, name: m.name, labels: null as Set<string> | null };
      }
      const scores = scoreTagsFromEntries(weekForMember);
      return {
        id: m.id,
        name: m.name,
        labels: new Set(scores.map((s) => s.label)),
      };
    });

    const active = perMemberSets.filter(
      (row): row is { id: string; name: string; labels: Set<string> } => row.labels !== null
    );

    let shared: string[] = [];
    if (active.length > 0) {
      shared = [...active[0].labels];
      for (let i = 1; i < active.length; i++) {
        shared = shared.filter((label) => active[i].labels.has(label));
      }
    }

    const perMember = perMemberSets.map((ms) => {
      if (ms.labels === null) {
        return { id: ms.id, name: ms.name, labels: [] as string[], hasWeekData: false };
      }
      return {
        id: ms.id,
        name: ms.name,
        labels: [...ms.labels].filter((l) => !shared.includes(l)).slice(0, 6),
        hasWeekData: true,
      };
    });
    return { shared, perMember };
  }, [members, weeklyEntries]);

  const saveEntry = () => {
    setError("");
    if (members.length === 0) {
      setError("メンバーを1人以上登録してください。");
      return;
    }
    if (!activeMemberId) {
      setError("回答するメンバーを選んでください。");
      return;
    }
    if (textAnswer.trim().length === 0) {
      setError("テキスト回答を入力してください。");
      return;
    }

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      member: activeMemberId,
      question: todayQuestion,
      date: todayDate,
      textAnswer: textAnswer.trim(),
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setTextAnswer("");
  };

  const updateMemberName = (id: string, name: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
  };

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: `メンバー${prev.length + 1}` },
    ]);
  };

  const removeMember = (id: string) => {
    setMembers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((m) => m.id !== id);
    });
  };

  return (
    <main className="page">
      <section className="hero">
        <p className="tag">あそび感覚ログ / チーム版MVP</p>
        <h1>1日1問で、個人観とチーム観を育てる</h1>
        <p className="lead">
          思想ではなく、その人の「あそび感覚」を毎日少しずつ積み上げます。
        </p>
      </section>

      <section className="result-card left-card member-panel">
        <h2>メンバー</h2>
        <p className="lead">表示名を編集したり、人数を増やせます（ブラウザに保存されます）。</p>
        <div className="member-rows">
          {members.map((member) => (
            <div key={member.id} className="member-row">
              <input
                className="input member-name-input"
                value={member.name}
                onChange={(event) => updateMemberName(member.id, event.target.value)}
                aria-label={`${member.name}の表示名`}
              />
              <button
                type="button"
                className="chip danger-chip"
                disabled={members.length <= 1}
                onClick={() => removeMember(member.id)}
              >
                削除
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="chip add-member-chip" onClick={addMember}>
          メンバーを追加
        </button>
      </section>

      <section className="result-card left-card">
        <h2>今日の問い（{todayDate}）</h2>
        <p className="lead question">{todayQuestion}</p>

        <div className="member-switch">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`chip ${activeMemberId === member.id ? "active" : ""}`}
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
            {members.find((member) => member.id === activeMemberId)?.name}の記録:
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
          <p className="lead">メンバーごとの回答数と、今日の回答を並べます。</p>
          <div className="stack">
            <div className="insight-box">
              <p className="mini-date">チームの共通あそび観</p>
              <p className="mini-answer">{buildTeamInsight(teamTagScores, members.length)}</p>
              <div className="mini-card">
                <p className="mini-date">共通タグ（今週回答がある人全員に出たタグ）</p>
                <p className="mini-answer">
                  {sharedAndDiff.shared.length > 0
                    ? sharedAndDiff.shared.slice(0, 6).join(" / ")
                    : "まだ共通タグなし"}
                </p>
                <p className="mini-date">差分タグ（誰かにだけ出ているもの）</p>
                {sharedAndDiff.perMember.map((row) => (
                  <p key={row.id} className="mini-answer diff-line">
                    {row.name}:{" "}
                    {!row.hasWeekData
                      ? "今週の回答なし"
                      : row.labels.length > 0
                        ? row.labels.join(" / ")
                        : "なし"}
                  </p>
                ))}
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
              <p key={summary.id} className="lead">
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
