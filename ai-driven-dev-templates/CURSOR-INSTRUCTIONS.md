# Cursor エージェントへの指示書

このファイルは、Cursor（または他のAIエージェント）に設計ドキュメント作成を依頼する際の指示書です。

## あなたの役割

あなたはソフトウェアプロジェクトの設計ドキュメントを作成するアシスタントです。
以下のテンプレートと実例を参考に、プロジェクトに適した設計ドキュメントを作成してください。

## 作業手順

### Phase 1: CLAUDE.md の作成

1. `templates/CLAUDE-md-template.md` をテンプレートとして使用
2. `examples/CLAUDE-md-example.md` を品質の参考にする
3. プロジェクトのコードベースを読み、以下を記述:
   - Overview（プロジェクト概要）
   - Tech Stack（技術スタック）
   - Commands（開発コマンド）
   - Development Workflow（開発フロー）
   - Architecture（設計思想・ディレクトリ構造）
   - Test Strategy（テスト方針）

### Phase 2: 最低4カテゴリの要件定義書

1. `templates/product-requirements-template.md` → プロダクト要件
2. `templates/user-journey-template.md` → ユーザージャーニー
3. `templates/ai-architecture-template.md` → AIアーキテクチャ
4. `templates/security-privacy-template.md` → セキュリティ

### Phase 3: ADR（技術選定の判断記録）

1. `templates/adr-template.md` をテンプレートとして使用
2. 主要な技術選定（フレームワーク、DB、認証方式等）ごとにADRを作成

### Phase 4: 追加ドキュメント（任意）

プロジェクトの規模に応じて:
- `templates/cost-estimation-template.md` → LLMコスト設計（AI機能がある場合）
- `templates/skill-template.md` → Skill定義（上級者向け）

## 品質基準

- **運用的であること**: 読み物ではなく、AIが参照して行動できる情報を書く
- **具体的であること**: 「Reactを使っています」ではなく「React 18 + TypeScript 5.x」
- **スコープ外を明記すること**: やらないことを明確にする
- **判断軸を含めること**: 設計思想や方針を記述する
- **機密情報を含めないこと**: APIキー、パスワード等は絶対に書かない

## 出力先

- CLAUDE.md → プロジェクトルート
- 要件定義書 → `docs/` ディレクトリ
- ADR → `docs/adr/` ディレクトリ
