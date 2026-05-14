# 設計書インデックス — AI Mentor Bot

## 14カテゴリ構成

プロダクトの全側面をカバーする設計書体系。
すべてを最初から書く必要はなく、プロジェクトの進行に合わせて拡充する。

| # | カテゴリ | 内容 | MVP必須 |
|---|---|---|---|
| 01 | Product | プロダクト定義・スコープ・ユーザー体験 | **必須** |
| 02 | Persona & Tone | キャラクター・人格・トーン設計 | |
| 03 | Proactive Mentor | 能動伴走・ヘルススコア・検知ロジック | |
| 04 | Curriculum & Materials | カリキュラム・教材設計 | |
| 05 | Chat App | チャットUI・コマンド・チャンネル設計 | |
| 06 | AI Agents | 内部AI Agent構成・プロンプト設計 | **必須** |
| 07 | Data Model | DB設計・イベント設計 | |
| 08 | API & Integration | API設計・外部連携 | |
| 09 | Review & Submission | 提出・レビュー・フィードバック | |
| 10 | Admin & Ops | 管理画面・運営ダッシュボード | |
| 11 | Security & Privacy | セキュリティ・プライバシー | **必須** |
| 12 | Implementation | MVPロードマップ・タスク分解 | |
| 13 | AI Build Instructions | AI構築エージェント向け指示書 | |
| 14 | Cost Management | LLMコスト管理・予算設計 | |

## 推奨作成順序

### Phase 1（開発開始前）
1. **01_Product** — 何を作るか
2. **06_AI Agents** — AIをどう使うか
3. **11_Security** — 安全にどう作るか

### Phase 2（MVP開発中）
4. **07_Data Model** — データ構造
5. **05_Chat App** — UI設計
6. **12_Implementation** — タスク分解

### Phase 3（MVP完成後）
7. **02_Persona & Tone** — キャラクター設計
8. **03_Proactive Mentor** — 能動伴走の詳細設計
9. **14_Cost Management** — コスト最適化

### Phase 4（運用開始後）
10. **10_Admin & Ops** — 運営ダッシュボード
11. **04_Curriculum** — カリキュラム改善
12. 残りのカテゴリ

## ディレクトリ構造

```
docs/
├── README.md                    # このファイル
├── 01_product/
│   └── product_requirements.md
├── 02_persona_tone/
│   ├── persona.md
│   └── tone_presets.md
├── 03_proactive_mentor/
│   ├── health_score.md
│   └── proactive_rules.md
├── 04_curriculum_materials/
│   └── curriculum_structure.md
├── 05_chat_app/
│   ├── commands.md
│   └── ui_components.md
├── 06_ai_agents/
│   ├── agent_architecture.md
│   └── prompt_design.md
├── 07_data_model/
│   └── firestore_schema.md
├── 08_api_integration/
│   └── api_design.md
├── 09_review_submission/
│   └── review_flow.md
├── 10_admin_ops/
│   └── dashboard.md
├── 11_security_privacy/
│   └── security.md
├── 12_implementation/
│   └── mvp_roadmap.md
├── 13_ai_build_instructions/
│   └── build_guide.md
└── 14_cost_management/
    └── cost_estimation.md
```
