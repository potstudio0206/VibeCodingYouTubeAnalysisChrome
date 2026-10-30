---
name: "doc-refactor-plan"
description: "リファクタリング計画書（RF）のテンプレートと書き方。リファクタリングを計画するときに使う。"
user-invocable: false
---

# リファクタリング計画書（RF）の書き方

- 置き場所：docs/04_refactoring/RF-xxxx-<英語の短い名前>.md
- 振る舞いを変えないことが絶対条件。1段階＝1回のPRで済む大きさにする。

```markdown
---
id: RF-0000
title:
status: draft
author: chrome-refactor-analyze
reviewer:
updated: YYYY-MM-DD
---
# RF-0000 （対象）リファクタリング計画

## 1. 対象と目的
## 2. 今の構造（モジュール・役割・依存）
## 3. 目標の構造（MVVM）
## 4. 段階
| 段階 | 内容 | 守る振る舞い（テスト） | 完了条件 |
|---|---|---|---|
## 5. 振る舞いを守るテスト（既存・追加）
## 6. ファイルの持ち場の変更案（.claude/hooks/ownership.json）
## 7. リスクと戻し方
```
