---
name: "refactor-pipeline"
description: "振る舞いを変えずにコードの構造を直す（MVVMへの移行など）部長の手順。"
argument-hint: "[対象 または RF番号]"
---

# リファクタリングの流れ（部長が使う）

対象: $ARGUMENTS

1. 作業ブランチを作る：`git switch main && git pull && git switch -c refactor/<短い英語名>`
2. 開発課長に、同じファイルを触る開発が進んでいないか確かめる。進んでいれば時期をずらす。
3. リファクタリング課長（chrome-refactor-kacho）に計画書（RF）を依頼する。構造分析係が、現状→目標（MVVM）、段階、振る舞いを守るテストを書く。
4. 設計課長（chrome-design-kacho）に、目標の構造が詳細設計と矛盾しないかのレビューを依頼する。
5. リファクタリング課長に移行を依頼する。移行係が段階ごとに実行し、各段階で速いテスト（node --test "tests/unit/*.test.js"）、最後に重いテスト（python -m unittest discover -s tests/e2e -v）と共通指標仕様の適合テストが通ること。
6. ファイルの構成が変わったら、.claude/hooks/ownership.json（持ち場）の変更案を受け取り、社長の許可を得て部長が更新する（.claude/ の編集は確認が出ます）。CLAUDE.md の「MVVM の層の分け方」も合わせて直す。
7. 品質保証課長に確認を依頼し、PRを作る。振る舞いが変わっていなければ部長がマージしてよい。
