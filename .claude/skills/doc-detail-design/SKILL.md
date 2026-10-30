---
name: "doc-detail-design"
description: "詳細設計書（DD）のテンプレートと書き方（MVVM）。詳細設計書を書くときに使う。"
user-invocable: false
---

# 詳細設計書（DD）の書き方（MVVM）

- 置き場所：docs/03_design/detail/DD-xxxx-<英語の短い名前>.md（番号は基本設計書と同じ）
- 開発課の Model係・ViewModel係・View係が、それぞれ自分の持ち場のファイルだけで実装できるように書く。
- 1つのファイルを複数の係に割り当てない。関数の入出力には必ず例を付ける。

```markdown
---
id: DD-0000
title:
status: draft
author: chrome-design-detail
reviewer:
basic_design: BD-0000
updated: YYYY-MM-DD
---
# DD-0000 （機能名）詳細設計

## 1. 変更するファイルと担当
| ファイル | 層 | 担当（係） | 変更の内容 |
|---|---|---|---|
## 2. Model
| 関数・データ | 入力 | 出力 | 説明（例） |
|---|---|---|---|
## 3. ViewModel
（状態、操作（コマンド）、表示用データの形）
## 4. View
（描くもの、使う値、操作とコマンドの対応）
## 5. 層の間の受け渡し
## 6. エラー処理・境界値
## 7. テストの観点（開発課がテスト仕様書を書く材料）
| 観点 | 層 | 自動/手動 |
|---|---|---|
## 8. 前提となるリファクタリング（あれば RF 番号）
## 9. 共通指標仕様（shared/）への影響
```
