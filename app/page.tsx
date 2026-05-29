"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dailyQuestions } from "./dailyQuestions";
import {
  DEFAULT_SIMILARITY_THRESHOLD,
  scoreTagsKeywordOnly,
} from "@/lib/classifyPlayResponse";
import type { LayerId, TagScore } from "@/lib/labels";
import { layerLabels, layerOrder } from "@/lib/labels";
import {
  buildTrajectoryStory,
  isDateInRange,
  layerWeatherFromScores,
  startOfMonth,
  startOfPreviousWeek,
  startOfWeek,
  topRegularLabels,
} from "@/lib/playTrajectory";

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

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
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
    grouped[layer].sort((a, b) => b.score - a.score);
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

  const [semanticPersonal, setSemanticPersonal] = useState<TagScore[] | null>(null);
  const [semanticTeam, setSemanticTeam] = useState<TagScore[] | null>(null);
  const [semanticByMember, setSemanticByMember] = useState<Record<string, TagScore[]>>({});
  const classifyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const personalTextKey = useMemo(
    () => personalEntries.map((e) => e.textAnswer).join("\u0001"),
    [personalEntries]
  );
  const teamTextKey = useMemo(
    () => weeklyEntries.map((e) => e.textAnswer).join("\u0001"),
    [weeklyEntries]
  );
  const memberIdsKey = useMemo(() => members.map((m) => m.id).join(","), [members]);

  const keywordPersonalScores = useMemo(
    () => scoreTagsKeywordOnly(personalEntries),
    [personalEntries]
  );
  const keywordTeamScores = useMemo(
    () => scoreTagsKeywordOnly(weeklyEntries),
    [weeklyEntries]
  );

  const personalTagScores =
    semanticPersonal !== null ? semanticPersonal : keywordPersonalScores;
  const teamTagScores = semanticTeam !== null ? semanticTeam : keywordTeamScores;

  const personalLayered = useMemo(() => groupByLayer(personalTagScores), [personalTagScores]);
  const teamLayered = useMemo(() => groupByLayer(teamTagScores), [teamTagScores]);

  const personalTrajectory = useMemo(() => {
    if (!activeMemberId) {
      return {
        top5Month: [],
        weather: layerWeatherFromScores([]),
        story: buildTrajectoryStory([], []),
        monthCount: 0,
      };
    }
    const weekStart = startOfWeek(today);
    const prevWeekStart = startOfPreviousWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const memberEntries = entries.filter((e) => e.member === activeMemberId);
    const monthEntries = memberEntries.filter((e) =>
      isDateInRange(e.date, monthStart, monthEnd)
    );
    const lastWeekEntries = memberEntries.filter((e) =>
      isDateInRange(e.date, prevWeekStart, weekStart)
    );
    const lastWeekScores = scoreTagsKeywordOnly(lastWeekEntries);

    return {
      top5Month: topRegularLabels(monthEntries, 5),
      weather: layerWeatherFromScores(personalTagScores),
      story: buildTrajectoryStory(personalTagScores, lastWeekScores),
      monthCount: monthEntries.length,
    };
  }, [entries, activeMemberId, today, personalTagScores]);

  useEffect(() => {
    if (classifyDebounceRef.current) clearTimeout(classifyDebounceRef.current);
    classifyDebounceRef.current = setTimeout(() => {
      void (async () => {
        const fetchScores = async (text: string): Promise<TagScore[]> => {
          if (!text.trim()) return [];
          const res = await fetch("/api/play-labels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
            }),
          });
          if (!res.ok) throw new Error(String(res.status));
          const data = (await res.json()) as { scores?: TagScore[] };
          return Array.isArray(data.scores) ? data.scores : [];
        };

        try {
          const personalText = personalEntries.map((e) => e.textAnswer).join("\n");
          const teamText = weeklyEntries.map((e) => e.textAnswer).join("\n");

          const [pScores, tScores] = await Promise.all([
            fetchScores(personalText),
            fetchScores(teamText),
          ]);
          setSemanticPersonal(pScores);
          setSemanticTeam(tScores);

          const byMember: Record<string, TagScore[]> = {};
          await Promise.all(
            members.map(async (m) => {
              const t = weeklyEntries
                .filter((e) => e.member === m.id)
                .map((e) => e.textAnswer)
                .join("\n");
              byMember[m.id] = await fetchScores(t);
            })
          );
          setSemanticByMember(byMember);
        } catch {
          setSemanticPersonal(null);
          setSemanticTeam(null);
          setSemanticByMember({});
        }
      })();
    }, 450);

    return () => {
      if (classifyDebounceRef.current) clearTimeout(classifyDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 回答本文とメンバー構成は textKey / memberIdsKey で追跡
  }, [personalTextKey, teamTextKey, memberIdsKey]);

  const sharedAndDiff = useMemo(() => {
    if (members.length === 0) {
      return {
        shared: [] as string[],
        perMember: [] as { id: string; name: string; labels: string[]; hasWeekData: boolean }[],
      };
    }
    const perMemberSets = members.map((m) => {
      const weekForMember = weeklyEntries.filter((entry) => entry.member === m.id);
      if (weekForMember.length === 0) {
        return { id: m.id, name: m.name, labels: null as Set<string> | null };
      }
      const scores =
        m.id in semanticByMember
          ? semanticByMember[m.id]!
          : scoreTagsKeywordOnly(weekForMember);
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
  }, [members, weeklyEntries, semanticByMember]);

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
              <p className="mini-date">遊び感の軌跡（②③④）</p>
              <p className="trajectory-story">{personalTrajectory.story}</p>

              <p className="mini-date">③ レイヤー別の天気（今週）</p>
              <div className="weather-grid">
                {personalTrajectory.weather.map((row) => (
                  <div key={row.layer} className="weather-cell">
                    <span className="weather-mood" aria-hidden>
                      {row.mood}
                    </span>
                    <span className="weather-layer">{row.layerName}</span>
                    <span className="weather-label">
                      {row.label ?? "まだ薄い"}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mini-date">
                ② 今月の常連ラベル（{personalTrajectory.monthCount}件の回答から）
              </p>
              {personalTrajectory.top5Month.length > 0 ? (
                <div className="top5-list">
                  {personalTrajectory.top5Month.map((row, index) => {
                    const max = personalTrajectory.top5Month[0]?.totalScore || 1;
                    const widthPct = Math.round((row.totalScore / max) * 100);
                    return (
                      <div key={row.label} className="top5-row">
                        <span className="top5-rank">{index + 1}</span>
                        <span className="top5-label">{row.label}</span>
                        <div className="top5-bar-track">
                          <div
                            className="top5-bar-fill"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="lead">今月の回答がたまると、常連ラベルが見えてきます。</p>
              )}

              <p className="mini-date">いま見えているあそび観</p>
              <p className="mini-answer">{buildPersonalInsight(personalTagScores)}</p>
              {layerOrder.map((layer) => (
                <div key={layer} className="layer-row">
                  <p className="layer-title">{layerLabels[layer]}</p>
                  <div className="tag-list">
                    {personalLayered[layer].slice(0, 2).map((tag) => (
                      <span key={`${layer}-${tag.label}`} className="sense-tag">
                        {tag.label} ({tag.score})
                      </span>
                    ))}
                    {personalLayered[layer].length === 0 ? (
                      <span className="sense-tag muted-tag">まだ検出なし</span>
                    ) : null}
                  </div>
                </div>
              ))}
              {personalTagScores.length > 0 ? (
                <div className="reason-stack" aria-label="上位ラベルと理由">
                  {personalTagScores.slice(0, 3).map((tag) => (
                    <div key={`reason-${tag.label}`} className="reason-card">
                      <p className="reason-head">
                        {tag.label} {tag.score}
                      </p>
                      <div className="reason-body">{tag.reason}</div>
                    </div>
                  ))}
                </div>
              ) : null}
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
                        {tag.label} ({tag.score})
                      </span>
                    ))}
                    {teamLayered[layer].length === 0 ? (
                      <span className="sense-tag muted-tag">まだ検出なし</span>
                    ) : null}
                  </div>
                </div>
              ))}
              {teamTagScores.length > 0 ? (
                <div className="reason-stack" aria-label="チーム上位ラベルと理由">
                  {teamTagScores.slice(0, 3).map((tag) => (
                    <div key={`team-reason-${tag.label}`} className="reason-card">
                      <p className="reason-head">
                        {tag.label} {tag.score}
                      </p>
                      <div className="reason-body">{tag.reason}</div>
                    </div>
                  ))}
                </div>
              ) : null}
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
