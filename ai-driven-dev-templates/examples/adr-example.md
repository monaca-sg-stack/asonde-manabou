# ADR-001: LLMサービスにOpenAI API（gpt-4o-mini）を選定

## Status

Accepted

## Context

Mentor BotにはLLM機能が必要。以下の3パターンで使用する:
1. 対話応答 — 受講者のDMに対するカリキュラム文脈を踏まえた応答
2. プロアクティブメッセージ生成 — 停滞検知時の声かけDM
3. レビュー生成 — 提出コードに対するAIレビュー

検討した選択肢:
1. OpenAI API（gpt-4o-mini）
2. Anthropic Claude API（claude-3-haiku）
3. Google Gemini API（gemini-1.5-flash）

## Decision

OpenAI API（gpt-4o-mini）を採用する。

## Rationale

- **コストパフォーマンス**: gpt-4o-miniは入力$0.15/1Mトークン、出力$0.60/1Mトークンで、3つの選択肢中最も安価
- **予算適合**: 受講者50名規模で月額コスト$50以下に収まる見積もり
- **SDK成熟度**: OpenAI SDKは最も広く使われており、ドキュメント・コミュニティが充実
- **日本語品質**: gpt-4o-miniの日本語生成品質は教育用途に十分
- **レスポンス速度**: 対話応答の3秒以内要件を満たす

## Trade-offs

- Claude APIの方が日本語の自然さは高い可能性があるが、コスト差が2〜3倍
- Gemini APIはGoogle Cloud統合が優れるが、SDK・ドキュメントの成熟度が劣る
- gpt-4o-miniはgpt-4oと比べて推論能力が低いが、教育伴走用途には十分
- 将来的にモデル切り替えが必要になった場合のため、LLMサービス層を抽象化しておく

## Consequences

- OpenAI SDKに依存する（ただしサービス層で抽象化）
- プロンプトはOpenAI向けに最適化する
- 月次コストモニタリングを実装する（llm_usage_daily コレクション）
- 日次/月次予算上限を設定し、超過時はLLM呼び出しを停止する
- 6ヶ月後にモデルの進化とコスト変動を踏まえて再評価する
