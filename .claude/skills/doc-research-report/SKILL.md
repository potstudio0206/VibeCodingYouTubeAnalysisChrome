---
name: "doc-research-report"
description: "研究レポート（RS）と動向レポートのテンプレートと書き方。調査・試作の結果をまとめるときに使う。"
user-invocable: false
---

# 研究レポート（RS）・動向レポートの書き方

- 研究レポート：docs/01_research/RS-xxxx-<英語の短い名前>.md
- 動向レポート：docs/01_research/trends/YYYY-MM-DD.md（前回からの変化・製品への影響・対応期限・出典）
- 出典URLと確認日を必ず書く。事実と推測を分ける。

```markdown
---
id: RS-0000
title:
status: draft
author: chrome-research-fusion
reviewer:
updated: YYYY-MM-DD
---
# RS-0000 （テーマ）

## 1. 問い・仮説
## 2. 候補の比較
| 名前 | 版 | ライセンス | 最終更新 | Windows | オフライン | 長所 | 短所 |
|---|---|---|---|---|---|---|---|
## 3. 試作・計測（手順・結果）
## 4. 製品に入れる場合の影響（依存・サイズ・速度・保守）
## 5. 推奨と根拠
## 6. 出典
```
