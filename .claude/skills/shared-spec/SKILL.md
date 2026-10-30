---
name: "shared-spec"
description: "両部の共通指標仕様（shared/）を変えるときの手順。コメント量・加速度・同一コメント率の定義を変える必要があるときに使う。"
argument-hint: "[変えたい内容]"
---

# 共通指標仕様（shared/）の変更

変更: $ARGUMENTS

shared/ は、このリポジトリと相手のリポジトリ（VibeCodingYouTubeAnalysisApp）で完全に同じ内容を保ちます。

1. 要件定義課長（chrome-req-kacho）に、変更案の要件定義書（REQ）を依頼する。両部の実装への影響を書いてもらう。
2. /escalate で社長判断にする（ラベル「共通仕様」「部門間」）。相手の部長への共有として、相手リポジトリにも同じ件のIssueを立てるか、日報で知らせる。必要なら社長に `scripts\team.bat cross "..."` を提案する。
3. 承認されたら、要件定義係が次を行う：
   - shared/metrics-spec.md を直し、VERSION を上げ、変更履歴に追記する
   - 必要なら shared/reference/cases.py にケースを足す
   - `python shared/reference/metrics_ref.py --write-golden` で基準データを作り直す
4. 開発課が実装を直し、適合テストを通す（in App版：python -m unittest discover -s tests、in Chrome版：node --test "tests/unit/*.test.js"）。
5. 両リポジトリにPRを作る。本文に相手のPRの番号を書き合う。両方の準備ができてから、続けてマージする。
6. マージ後：`python scripts/check_shared_sync.py` で一致を確かめる。
