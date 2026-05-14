# あそんでまなぼう！ 開発ガイド

## Overview

「あそんでまなぼう！」は、子どもが遊びながら学べるWebアプリのMVPです。  
最初の対象は、親子で一緒に使う未就学〜低学年の子どもです。

## Tech Stack

- Runtime: Node.js 25.x
- Framework: Next.js 16 (App Router) + React 19 + TypeScript 5
- DB: なし（MVP時点）
- AI: なし（MVP時点）
- Auth: なし（MVP時点）
- Hosting: 未定（候補: Vercel / Firebase Hosting）
- Test: 未導入（Phase 2で導入）

## Commands

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm run start

# リント
npm run lint
```

## Development Workflow

### ローカル開発

1. `npm install`
2. `npm run dev`
3. `http://localhost:3000` で確認
4. 1機能ずつ小さく追加（画面→動作→見た目の順）

### デプロイ

1. `npm run build` が通ることを確認
2. ホスティング環境にデプロイ
3. 子ども向け表示（文字サイズ、誤タップしにくさ）を実機確認

## Architecture

- 画面中心のシンプル設計（過度な抽象化を避ける）
- 子ども向けUI優先（大きなボタン、短い文章、肯定的なフィードバック）
- データ保存や認証は後から段階的に追加

### Key Directories

- `app/` — 画面ルーティングとUI
- `docs/` — 要件・設計ドキュメント
- `docs/adr/` — 技術選定の判断記録
- `ai-driven-dev-templates/` — ドキュメント作成テンプレート

## Test Strategy

- UI: 主要フロー（トップ→クイズ→結果）の手動確認を毎回実施
- 将来: `vitest` + `@testing-library/react` で画面単位のテストを追加
- 回帰防止: 仕様変更時は `docs/` と実装を同時更新

## Secrets

MVP時点で必須シークレットはなし。  
将来的に追加予定の例（値は記載しない）:

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase接続設定
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase認証ドメイン
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firestore接続先
