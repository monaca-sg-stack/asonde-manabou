# ADR-001: Next.js App Router を採用する

## Status

Accepted

## Context

子ども向け学習アプリのMVPを短期間で安全に作る必要がある。  
画面追加を少ない学習コストで進めたい。

- 小さな画面を段階追加したい
- TypeScriptで型安全に保守したい

検討した選択肢:
1. Next.js App Router
2. React + Vite
3. Remix

## Decision

フレームワークとして Next.js App Router を採用する。

## Rationale

- ファイルベースルーティングで画面追加が簡単
- React/TypeScript との相性がよく情報量も多い
- 将来、認証やAPIルートを追加しやすい

## Trade-offs

- フレームワーク依存が増える
- バージョン更新時の追従が必要

## Consequences

- `app/` 配下に画面を追加する方針を統一
- 初学者でもルーティングを把握しやすい
- 将来の拡張（認証、保存機能）を載せやすい

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
