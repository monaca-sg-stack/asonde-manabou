# AI駆動開発 設計ドキュメント テンプレート集

AI Builder Bootcamp おまけ編「AI駆動開発の設計ドキュメント」の配布テンプレートです。

## 使い方

### Step 1: テンプレートをプロジェクトにコピー

```bash
# プロジェクトルートに docs/ ディレクトリを作成
mkdir -p docs

# テンプレートをコピー
cp templates/* docs/
```

### Step 2: CLAUDE.md を作成

```bash
# プロジェクトルートに CLAUDE.md を作成
cp templates/CLAUDE-md-template.md ./CLAUDE.md
```

### Step 3: AIエージェントに指示

Cursor や Claude Code で以下のように指示してください:

```
CURSOR-INSTRUCTIONS.md を読んで、このプロジェクトの設計ドキュメントを作成してください。
まずは CLAUDE.md から始めて、次に最低4カテゴリの要件定義書を書いてください。
```

## ファイル構成

```
ai-driven-dev-templates/
├── README.md                          # このファイル
├── CURSOR-INSTRUCTIONS.md             # Cursorエージェントへの指示書
├── templates/                         # テンプレート
│   ├── CLAUDE-md-template.md          # CLAUDE.md テンプレート
│   ├── product-requirements-template.md
│   ├── user-journey-template.md
│   ├── ai-architecture-template.md
│   ├── security-privacy-template.md
│   ├── cost-estimation-template.md
│   ├── adr-template.md               # ADR テンプレート
│   └── skill-template.md             # SKILL.md テンプレート（上級者向け）
├── examples/                          # 実例（匿名化済み）
│   ├── CLAUDE-md-example.md
│   ├── product-requirements-example.md
│   ├── adr-example.md
│   └── design-docs-index-example.md
└── guides/
    └── what-to-write-when.md          # いつ何を書くかのガイド
```

## 最低限書くべき4カテゴリ

プロジェクトの規模に関わらず、以下の4つは必ず書いてください:

1. **Product Requirements** — 何を作るのか
2. **User Journey** — ユーザーがどう使うか
3. **AI Architecture** — AIをどう組み込むか
4. **Security & Privacy** — 安全にどう作るか

## 参考

- AI Builder Bootcamp おまけ編スライド
- examples/ フォルダの実例を参考に、自分のプロジェクトに合わせてカスタマイズしてください
