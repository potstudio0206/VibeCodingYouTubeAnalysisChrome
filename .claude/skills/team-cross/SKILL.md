---
name: "team-cross"
description: "エージェントチームで両部にまたがる判断をする手順（scripts/team.bat cross で起動したセッションのリーダーが使う）。"
argument-hint: "[決めたいこと]"
---

# エージェントチームでの部をまたぐ判断

決めたいこと: $ARGUMENTS

このセッションは社長が `scripts\team.bat cross` で起動したチームのリーダー（部長）です。相手のリポジトリ（../VibeCodingYouTubeAnalysisApp）も読めます。

1. 論点を整理し、必要な役をチームメイトとして起こす（3〜4人まで）：
   - この部：「chrome-req-kacho の種別でチームメイト "当部要件" を起こす」「chrome-design-kacho の種別で "当部設計"」
   - 相手の部：相手リポジトリの .claude/agents/ の課長の定義ファイルと CLAUDE.md を読んでから、その役で振る舞うよう指示したチームメイト
2. 各自に、自部への影響・案・懸念を出させ、互いに質問・反論させる。
3. 合意案を決定メモにまとめる（docs/00_status/decisions/YYYY-MM-DD-<件名>.md）：論点、案の比較、合意案、各部の作業、社長判断が必要な点。
4. 社長判断が必要なら、両方のリポジトリに判断待ちIssueを立てる（ラベル「社長判断」「部門間」）。
5. チームメイトを全員終了させ、社長に報告する。
