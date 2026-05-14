# [プロジェクト名]

## Overview

[このプロジェクトは何か？誰のためのものか？1〜3文で記述してください。]

## Tech Stack

- Runtime: [例: Node.js 20, Python 3.12]
- Framework: [例: Next.js 14, FastAPI]
- DB: [例: Firestore, PostgreSQL, Supabase]
- AI: [例: OpenAI API (gpt-4o-mini), Claude API]
- Auth: [例: Firebase Auth, NextAuth]
- Hosting: [例: Firebase Hosting, Vercel]
- Test: [例: vitest, pytest]

## Commands

```bash
# 開発サーバー起動
[記入してください]

# テスト実行
[記入してください]

# ビルド
[記入してください]

# デプロイ
[記入してください]

# その他（シードデータ投入、リント等）
[記入してください]
```

## Development Workflow

### ローカル開発

[ローカル開発の手順を記述してください。例:]
1. [環境構築手順]
2. [開発サーバー起動]
3. [テスト実行]

### デプロイ

[デプロイ手順を記述してください。]

## Architecture

[設計思想を記述してください。例:]
- [設計原則1: 例「LLMファースト設計: 判断はLLMに委ね、コードは決定論的な制御のみ」]
- [設計原則2]

### Key Directories

- `src/` — [役割を記述]
  - `src/services/` — [例: ビジネスロジック]
  - `src/handlers/` — [例: イベントハンドラ]
  - `src/types/` — [例: 型定義]
- `docs/` — [例: 設計書]
- `tests/` — [例: テストファイル]

## Test Strategy

[テスト方針を記述してください。例:]
- **services/**: [例: リポジトリインターフェースをモック注入してユニットテスト]
- **handlers/**: [例: vi.mock() でリポジトリ・サービスをモック化]
- **views/**: [例: 純関数なのでモック不要]

## Secrets

[環境変数・シークレットの一覧。値は書かない。]
- [SECRET_NAME_1]: [用途]
- [SECRET_NAME_2]: [用途]
