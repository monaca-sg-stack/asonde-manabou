# AI Mentor Bot

## Overview

教育プログラム受講者をチャット上で能動的に伴走するMentor Bot。
単なるQ&A Botではなく、進捗停滞・未提出・離脱兆候を検知して温度のある声かけを行う。

## Tech Stack

- Runtime: Firebase Cloud Functions v2 (Node.js 20, TypeScript)
- DB: Firestore
- Chat: Bolt for JavaScript (ExpressReceiver + processBeforeResponse)
- AI: OpenAI API (gpt-4o-mini)
- Code Review: GitHub App (Read-Only: contents + metadata)
- Test: vitest

## Commands

```bash
cd functions
npm test              # Run tests (20 files, 120 tests)
npm run build         # TypeScript compile → lib/
npm run seed:emulator # Seed Firestore via emulator (localhost:8080)
npm run seed          # Seed Firestore (requires production credentials)
```

## Development Workflow

### ローカル開発

```bash
# 1. エミュレータ起動（プロジェクトルートで）
firebase emulators:start

# 2. シードデータ投入（functions/ ディレクトリで）
npm run seed:emulator

# 3. テスト実行
npm test
```

### デプロイ

```bash
# Secret設定（初回のみ）
firebase functions:secrets:set CHAT_BOT_TOKEN
firebase functions:secrets:set CHAT_SIGNING_SECRET
firebase functions:secrets:set OPENAI_API_KEY

# デプロイ
firebase deploy --only functions,firestore
```

## Architecture

- **LLMファースト設計**: 判断はLLMに委ね、コードは決定論的な制御のみ
- **単一エージェント**: 複数Agent + Orchestratorではなく、単一プロンプトで全役割カバー
- **3パターンのLLM呼び出し**: 対話応答 / プロアクティブ / レビュー
- **コスト制御**: LLM呼び出し前にコードでフィルタリング + 日次/月次予算管理

### Cloud Functions

| 関数 | トリガー | 用途 |
|---|---|---|
| `chat` | onRequest (HTTP) | Chat Events / Commands / Interactions |
| `proactiveScan` | onSchedule (60分毎) | 非活動ユーザーへのプロアクティブDM |

### Key Directories

- `functions/src/types/` — Firestore型定義
- `functions/src/repositories/` — Firestoreリポジトリ（インターフェース+実装）
- `functions/src/services/` — ビジネスロジック（7サービス）
- `functions/src/handlers/` — イベント/コマンド/インタラクションハンドラ
- `functions/src/views/` — UIビルダー（純関数）
- `functions/src/prompts/` — LLMプロンプトテンプレート
- `functions/src/scheduled/` — スケジュールFunction
- `docs/` — 設計書（14カテゴリ）

## Test Strategy

- **services/**: リポジトリインターフェースをモック注入してユニットテスト
- **handlers/**: vi.mock() でリポジトリ/サービスをモック化
- **views/**: 純関数なのでモック不要
- **repositories/**: エミュレータ統合テスト（別途実施）

## Secrets (defineSecret)

- CHAT_BOT_TOKEN
- CHAT_SIGNING_SECRET
- OPENAI_API_KEY
- GITHUB_APP_ID (optional)
- GITHUB_APP_PRIVATE_KEY (optional)

## Firestore Collections

| コレクション | ドキュメントID | 用途 |
|---|---|---|
| `profiles` | 自動ID | ユーザー基本情報 |
| `learner_states` | profileId | 学習進捗 |
| `learner_activity_events` | 自動ID | 行動ログ |
| `proactive_actions` | 自動ID | プロアクティブDM履歴 |
| `submissions` | 自動ID | 提出物・レビュー結果 |
| `llm_usage_logs` | 自動ID | LLM使用量ログ |
| `llm_usage_daily` | `YYYY-MM-DD` | 日次コスト集計 |
