---
name: "daily-report"
description: "その日の到達点・課題・判断待ちをまとめ、GitHubの日報Issueにコメントする部長の手順（部長会議の代わり）。毎日の定期実行で使う。"
---

# 日報（部長会議の代わり）

## 1. 材料を集める
- 課長・係長の活動記録：.claude/state/activity.jsonl の直近24時間
- 進捗ボード：docs/00_status/board.md
- コミット：`git log --all --since="24 hours ago" --oneline`
- PR：`gh pr list --state all --limit 20`
- 判断待ち・社長指示：`gh issue list --label 社長判断 --state open`、`gh issue list --label 社長指示 --state open`
- CI：`gh run list --limit 10`
- 相手の部の最新の日報：`gh issue list -R potstudio0206/VibeCodingYouTubeAnalysisApp --label 日報 --limit 1` の後、`gh issue view <番号> -R potstudio0206/VibeCodingYouTubeAnalysisApp --comments`
- 共通指標仕様のずれ：`python scripts/check_shared_sync.py`

## 2. 日報を書く（短く、結論から）
```
## Chrome拡張機能部 日報 YYYY-MM-DD
### 要対応（あれば先頭に）
### できたこと
### 課題・ボトルネック（手戻りの状況を含む）
### 明日の予定
### 相手の部（アプリケーション部）への共有
### 社長の判断待ち

— Chrome拡張機能部 部長（Claude）
```

## 3. 投稿する
- 今月の日報Issue（タイトル「📋 日報 YYYY年MM月（Chrome拡張機能部）」、ラベル「日報」）を探す：`gh issue list --label 日報 --state open --search "YYYY年MM月"`
- 無ければ作る：`gh issue create --title "📋 日報 YYYY年MM月（Chrome拡張機能部）" --label 日報 --body "毎日の日報をコメントで追記します。"`
- 日報をコメントする：`gh issue comment <番号> --body-file <ファイル>`
- 前の月の日報Issueが開いていればクローズする。

## 4. 滞留を見つけたら
- 判断待ちが3日以上止まっている、同じ工程の手戻りが3回を超えた、CIの失敗が放置されている、共通指標仕様がずれている → 日報の「要対応」に書く。社長判断が必要なら /escalate。
