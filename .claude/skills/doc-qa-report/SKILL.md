---
name: "doc-qa-report"
description: "テスト結果報告書（QA）のテンプレートと書き方。テストを実行して結果を報告するときに使う。"
user-invocable: false
---

# テスト結果報告書（QA）の書き方

- 置き場所：docs/06_qa/reports/QA-xxxx-<英語の短い名前>.md（番号は詳細設計書と同じ）

```markdown
---
id: QA-0000
title:
result: 合格 / 不合格
author: chrome-qa-test
reviewer:
test_spec: TS-0000
updated: YYYY-MM-DD
---
# QA-0000 （機能名）テスト結果報告

## 結果の要約
## ケースごとの結果
| ID | 結果（合格/不合格/未実施） | 備考（ログ・スクリーンショット） |
|---|---|---|
## 受け入れ基準ごとの合否
## 不合格のケース（再現手順・ログ・期待との違い）
## 環境（OS、Python・Node の版、日時）
```
