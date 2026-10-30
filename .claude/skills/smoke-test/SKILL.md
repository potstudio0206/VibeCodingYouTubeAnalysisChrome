---
name: "smoke-test"
description: "実際のYouTube配信アーカイブでin Chrome版が動くかを確かめ、運用記録を残す手順（保守運用課）。定期実行で使う。"
---

# 実配信での動作確認（スモークテスト）

※ YouTube に繋ぐ作業なので、このPC（Windows）でしか実行できません。

部長は、保守運用課長（chrome-ops-kacho）に次を依頼します。

1. ops/smoke-urls.txt から、前回の次のURLを1本選ぶ（前回の記録は docs/07_ops/logs/ の最新）。URLが1本も無ければ、社長に追加を頼む判断待ちIssueを立てて終わる。
2. 実行する：Claude in Chrome で配信アーカイブを開き、パネルの「このアーカイブを解析」を押す
   - Claude in Chrome が使えるセッション（`claude --chrome`）で、URLを開き、右下の「見どころ」→「このアーカイブを解析」を押し、完了の表示と候補の数を確かめる。グラフのクリックで動画がジャンプするかも確かめる。
   - Claude in Chrome が使えない場合は、E2Eテスト（python -m unittest discover -s tests/e2e -v）だけ実行し、「実配信は未確認」と記録する。
   - 拡張機能を読み込み直したばかりのときは、YouTube のタブを再読み込みしてから操作する。
3. 記録する：docs/07_ops/logs/YYYY-MM-DD.md に、日時・URL・結果（成功/失敗）・コメント数・所要時間・見どころの数・エラーの文言を書き、前回と比べる。
4. 失敗・大きな変化があれば、不具合として部長に報告する（部長が /bugfix-pipeline を回す）。
