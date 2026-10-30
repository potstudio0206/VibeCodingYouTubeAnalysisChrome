---
name: "doc-requirements"
description: "要件定義書（REQ）のテンプレートと書き方。要件定義書を書くときに使う。"
user-invocable: false
---

# 要件定義書（REQ）の書き方

- 置き場所：docs/02_requirements/REQ-xxxx-<英語の短い名前>.md（番号は最大番号＋1）
- 推測で書かない。今の動きは現状仕様書とコードで確かめる。
- 受け入れ基準は「〜のとき〜になる」の形で、確かめ方（自動テスト／手動）も書く。

```markdown
---
id: REQ-0000
title: （機能名）
status: draft            # draft → review → approved（課長が承認） / rejected
author: chrome-req-define
reviewer:
source: （社長指示 #Issue番号 / FB-xxxx / RS-xxxx）
president_decision: 不要   # 不要 / 必要（#Issue番号） / 承認済み（#Issue番号）
updated: YYYY-MM-DD
---
# REQ-0000 （機能名）

## 1. 背景と目的
## 2. 利用場面（切り抜き師がどう使うか）
## 3. 機能要件
| No | 要件 | 優先度（必須/推奨） |
|---|---|---|
## 4. 非機能要件
（Windowsで動く、無料、処理時間、YouTubeの制約、既存機能を壊さない など）
## 5. 受け入れ基準
| No | 条件（〜のとき〜になる） | 確かめ方 |
|---|---|---|
## 6. 影響範囲
- 共通指標仕様（shared/）への影響：なし / あり（内容）
- 相手の部（アプリケーション部）への影響：
- 既存機能への影響：
## 7. 社長判断が必要な点
## 8. 未決事項
```
