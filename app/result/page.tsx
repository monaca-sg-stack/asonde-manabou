import Link from "next/link";

type ResultPageProps = {
  searchParams: Promise<{
    correct?: string;
    total?: string;
  }>;
};

function toSafeNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;
  const total = toSafeNumber(params.total, 3);
  const correct = Math.min(toSafeNumber(params.correct, 0), total);
  const stars = correct;

  return (
    <main className="page">
      <section className="hero">
        <p className="tag">けっか</p>
        <h1>よくがんばったね！</h1>
        <p className="lead">
          {total}もん中 {correct}もん せいかい！
        </p>
      </section>

      <section className="result-card" aria-label="結果">
        <h2>もらえたほし</h2>
        <p className="stars" aria-label={`星${stars}個`}>
          {"⭐".repeat(stars) || "⭐"}
        </p>
      </section>

      <section className="actions">
        <Link href="/quiz" className="primary-button link-button">
          もう1回あそぶ
        </Link>
        <Link href="/" className="link-button">
          トップにもどる
        </Link>
      </section>
    </main>
  );
}
