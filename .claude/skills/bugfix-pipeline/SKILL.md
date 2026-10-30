---
name: "bugfix-pipeline"
description: "不具合を、再現→修正→確認→PRの順に直す部長の手順。不具合の報告を受けたときに使う。"
argument-hint: "[症状 または Issue番号]"
---

# 不具合修正の流れ（部長が使う）

症状: $ARGUMENTS

1. 作業ブランチを作る：`git switch main && git pull && git switch -c fix/<短い英語名>`
2. 保守運用課長（chrome-ops-kacho）に再現を依頼する。再現手順・ログ・影響範囲を docs/07_ops/incidents/INC-xxxx-*.md に残してもらう。
   - YouTube の実配信が必要な再現は、このPC（Windows）でしかできない。
3. 1回の調査で原因が分からない、または両部にまたがる場合は、ここで止めて社長に「エージェントチームでの究明」を提案する（`scripts\team.bat bug "症状"`）。
4. 開発課長（chrome-dev-kacho）に修正を依頼する。直す前に、不具合を再現する回帰テストを書いてもらう。
5. 品質保証課長（chrome-qa-kacho）に確認を依頼する。不合格なら4へ戻す。
6. PRを作る（本文に INC 番号、原因、修正、テスト結果）。外部仕様や共通指標仕様に影響しなければ部長がマージしてよい。影響するなら /escalate。
7. 品質保証課の保守運用書係に、再発防止の手順を保守運用書へ反映してもらう。
8. 不具合のIssueに結果をコメントしてクローズする。
