# ADR-002: MVPでは認証とDBを導入しない

## Status

Accepted

## Context

現時点の目標は、子どもが迷わず使える体験の検証である。  
認証・DBを先に入れると実装と運用の複雑さが増える。

- MVPの価値は学習体験のわかりやすさ
- 個人データを扱わないなら法務・運用負荷を下げられる

検討した選択肢:
1. 初期からFirebase Auth + Firestoreを導入
2. MVPは認証/DBなし、Phase 2で導入
3. LocalStorageだけ先に導入

## Decision

MVPでは認証とDBを導入せず、画面内状態のみで動作させる。

## Rationale

- 実装範囲を最小化し、早くユーザー検証できる
- セキュリティ事故のリスクを最初は抑えられる
- 後続フェーズでFirebase導入判断をしやすい

## Trade-offs

- 進捗データを保持できない
- 端末をまたいだ利用ができない

## Consequences

- MVPでは一時的な結果表示のみ提供
- Firebase導入はPhase 2の必須タスクとして管理
- 認証前提の画面設計は今は行わない

## References

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
