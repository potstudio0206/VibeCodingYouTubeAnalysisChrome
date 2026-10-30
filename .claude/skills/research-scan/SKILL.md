---
name: "research-scan"
description: "JavaScriptライブラリとChrome拡張機能API（Manifest V3）の動向の動向調査とライブラリ仕分け表の更新を、研究課に依頼する部長の手順。週1回の定期実行で使う。"
argument-hint: "[特に調べたいテーマ（任意）]"
---

# 動向調査（週1回）

テーマ: $ARGUMENTS

1. 研究課長（chrome-research-kacho）に依頼する：
   - 動向調査係：前回以降の変化（採用中ライブラリ・APIの新版、廃止予定、YouTube側の変化）を docs/01_research/trends/YYYY-MM-DD.md に
   - 仕分け係：docs/01_research/library-catalog.md の更新
   - 研究課長：製品に関係する提案があれば、提案の形でまとめる
2. 報告に「/deep-research 推奨」のテーマがあれば、部長が `/deep-research <問い>` を実行し、結果を研究課長に渡して研究レポート（RS）にしてもらう。
   （/deep-research はメインのセッションでしか動きません）
3. 製品に入れたい提案があれば、要件定義課長に渡して /feature-pipeline の工程3から回す。費用・ライセンスに関わるものは /escalate。
4. 依存の更新が急ぎ必要（壊れる・脆弱性）なら、保守運用課長に依頼する。
