---
name: "doc-basic-design"
description: "基本設計書（BD）のテンプレートと書き方。基本設計書を書くときに使う。"
user-invocable: false
---

# 基本設計書（BD）の書き方

- 置き場所：docs/03_design/basic/BD-xxxx-<英語の短い名前>.md（番号は要件定義書と同じ）
- 各機能を Model / ViewModel / View のどこに置くかを、モジュール単位で決める（層の分け方は CLAUDE.md）。

```markdown
---
id: BD-0000
title:
status: draft
author: chrome-design-basic
reviewer:
requirement: REQ-0000
updated: YYYY-MM-DD
---
# BD-0000 （機能名）基本設計

## 1. 要件との対応
| 受け入れ基準 | 設計での対応 |
|---|---|
## 2. 全体構成（MVVM）
| 機能のまとまり | 層 | モジュール・ファイル |
|---|---|---|
## 3. 処理の流れ
## 4. 画面・出力
## 5. データ（入力・出力・保存）
## 6. 外部依存（ライブラリ・YouTube・OS）
## 7. 詳細設計係への申し送り
```
