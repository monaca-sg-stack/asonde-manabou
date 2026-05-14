import Link from "next/link";

export default function StarsPage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="tag">ほしコレクション</p>
        <h1>きょうのほし</h1>
        <p className="lead">がんばったぶんだけ、ほしがふえるよ！</p>
      </section>

      <section className="result-card">
        <p className="stars">⭐ ⭐ ⭐</p>
        <p className="lead">すごい！ 3このほしをゲット！</p>
      </section>

      <section className="actions">
        <Link href="/quiz" className="primary-button link-button">
          クイズにちょうせん
        </Link>
        <Link href="/" className="link-button">
          トップにもどる
        </Link>
      </section>
    </main>
  );
}
