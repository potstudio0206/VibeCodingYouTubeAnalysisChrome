---
id: QA-0001
title: /live/<ID> 形式URLへの対応 テスト結果報告
status: approved
result: 合格
author: chrome-qa-kacho
reviewer: chrome-qa-kacho
test_spec: TS-0001
updated: 2026-10-30
---
# QA-0001 /live/<ID> 形式URLへの対応 テスト結果報告

関連：INC-0001、TS-0001。対象は /watch?v= と /live/<ID>（/shorts/・/embed/ は対象外、部長決定）。
注：課長が直接実施した（係長への依頼なし）。コミット前の作業ツリー（ブランチ fix/live-url-support、基点 c892075）で実行。

## 結果の要約
自動テストはすべて合格。コードの確認でも、既存の /watch 動作への退行、SPA遷移の不具合、manifest の権限変更は見つからなかった。実配信での確認は保守運用課が後で行う（今回の範囲外）。

## ケースごとの結果
| ID | 結果 | 備考 |
|---|---|---|
| TS-0001-VM01〜VM10 | 合格（10件） | `node --test "tests/unit/*.test.js"` 全体 31件中 31件合格、fail 0 |
| TS-0001-V01 | 合格 | test_live_url_shows_fab_and_analyzes：/live/<VID> で .hlx-fab 表示、解析 done、「見どころ候補」あり、pageerror なし |
| TS-0001-V02 | 合格 | test_panel_analysis_and_video_sync（既存の /watch 回帰）合格 |
| 共通指標仕様 | 合格 | `python shared/reference/metrics_ref.py --check` →「一致しています」（終了コード 0） |
| 重いテスト全体 | 合格 | `python -m unittest discover -s tests/e2e -v` 2件 OK（4.4秒） |

TS の全ケース（自動12件）を実行済み。手動ケースはなし。未実施のケースはなし。

## 受け入れ基準ごとの合否
| 受け入れ基準 | 結果 | 根拠 |
|---|---|---|
| /watch?v=<ID> でボタンが出て解析できる | 合格 | VM01、V02 |
| /live/<ID> でボタンが出て解析できる | 合格 | VM02〜VM04、V01 |
| 対象外URL・不正IDではボタンを出さない | 合格 | VM05〜VM09（null を返し、onNav で fab 非表示） |

## コード確認（退行・SPA・権限）
- content.js 31行目のみの置換。currentVid の利用箇所は 442行（onNav）と 511行（hlx-toggle メッセージ）。どちらも「動画IDまたは null」を期待しており、戻り値の型は従来と同じ。
- 従来の `?v=` は URLSearchParams で取っていたが、新しい正規表現は先頭または `&` 区切りの `v=` を取り、ID を `[A-Za-z0-9_-]+` に限定。YouTube の11文字IDは範囲内。`?v=` 空は null（従来は空文字で偽値扱い、挙動同じ）。
- SPA遷移：onNav は yt-navigate-finish と 1秒ごとの location.href 比較で呼ばれ、currentVid を毎回呼ぶ。/live/ ⇔ /watch ⇔ トップの切替でも fab の表示・S.vid の更新・パネルを閉じる処理は従来と同じ経路。コード上の問題なし（SPA遷移そのものの専用テストはなく、コード読みでの確認）。
- fetcher.js は常に `/watch?v=<ID>` を取得するため、/live/ ページでも取得先は変わらない。background.js は URL に依存しない。
- manifest.json の差分は content_scripts.js への "viewmodel/videoid.js" の追加（content.js より前）のみ。matches（https://www.youtube.com/*）、permissions（storage, unlimitedStorage）、version（1.2.0）は変更なし。matches が /* のため /live/ も既に対象。
- videoid.js は DOM・location に触れない純粋関数で、MVVM の ViewModel 層（extension/viewmodel/）に置かれている。グローバル関数名 hlxVideoIdFromUrl は他ファイルと衝突しない（分析済み範囲：analyzer.js・fetcher.js・content.js）。

## 不合格のケース
なし。

## 残る留意点（不合格ではない）
- 詳細設計書：なし（INC-0001 は設計書を作らない。部長決定）。
- 実配信（本物の /live/<ID>）での確認は保守運用課が行う。
- 保守運用書：/live/ URL 対応の運用手順への反映は今回の依頼の範囲外。必要なら保守運用書係に依頼する。

## 環境
Windows 11 Home 10.0.26200、Node v26.13.0、Python 3.13.14、Playwright Chromium（拡張機能読み込み、headless）。2026-10-30。
