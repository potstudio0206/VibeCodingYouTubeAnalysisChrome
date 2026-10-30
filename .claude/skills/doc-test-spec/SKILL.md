---
name: "doc-test-spec"
description: "テスト仕様書（TS）のテンプレートと書き方。実装と一緒にテスト仕様書を書くときに使う。"
user-invocable: false
---

# テスト仕様書（TS）の書き方

- 置き場所：docs/05_dev/test-spec/TS-xxxx-<英語の短い名前>.md（番号は詳細設計書と同じ）
- 3つの係が同じ TS に、自分の担当のケースを追記する（IDは層ごとに TS-xxxx-M01 / VM01 / V01）。

```markdown
---
id: TS-0000
title:
status: draft
detail_design: DD-0000
updated: YYYY-MM-DD
---
# TS-0000 （機能名）テスト仕様書

## テストケース
| ID | 層 | 担当 | 前提 | 手順 | 期待結果 | 自動/手動 | テストファイル |
|---|---|---|---|---|---|---|---|
## 受け入れ基準との対応
| 受け入れ基準 | テストケースID |
|---|---|
## 実行方法
- 速いテスト：node --test "tests/unit/*.test.js"
- 重いテスト：python -m unittest discover -s tests/e2e -v
```
