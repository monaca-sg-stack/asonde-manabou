import Link from "next/link";

export default function MissionPage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="tag">きょうのミッション</p>
        <h1>いきものの なまえを 3つ いってみよう！</h1>
        <p className="lead">できたら「できた！」をおしてね。</p>
      </section>

      <section className="result-card">
        <h2>ヒント</h2>
        <p className="lead">さかな・いぬ・とり みたいに、なんでもOK！</p>
      </section>

      <section className="actions">
        <Link href="/stars" className="primary-button link-button">
          できた！ ほしをみる
        </Link>
        <Link href="/" className="link-button">
          トップにもどる
        </Link>
      </section>
    </main>
  );
}
