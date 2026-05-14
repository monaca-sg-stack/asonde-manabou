# あそんでまなぼう！(MVP)

子どもと一緒に、遊びながら学べるアプリの最小版です。  
現在はMVPの主要画面を実装しています。

## できること（現時点）

- トップ画面（3導線）
- クイズ3問（正誤表示あり）
- 結果画面（正解数と星表示）
- きょうのミッション画面
- ほしコレクション画面

## 設計ドキュメント

- 開発ガイド: `CLAUDE.md`
- 要件: `docs/product-requirements.md`
- ユーザージャーニー: `docs/user-journey.md`
- AI設計: `docs/ai-architecture.md`
- セキュリティ設計: `docs/security-privacy.md`
- ADR: `docs/adr/`

## 開発サーバー起動

1. パッケージをインストール

```bash
npm install
```

2. 開発サーバー起動

```bash
npm run dev
```

3. ブラウザで開く

`http://localhost:3000`
