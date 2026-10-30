---
id: QA-0002
title: GitHub 配布の体裁整備 テスト結果報告
status: approved
result: 条件付き合格（自動テスト・文書確認は合格。手動の実機確認と #7 回答待ちの項目は未了）
author: chrome-qa-kacho
reviewer: chrome-qa-kacho
test_spec: TS-0002
updated: 2026-10-30
---
# QA-0002 GitHub 配布の体裁整備 テスト結果報告

対応：REQ-0001／DD-0001／TS-0002
対象：ブランチ feat/github-distribution、コミット 6f7deac。番号は QA-0001 が INC-0001 で使用済みのため 0002。
注：課長が直接実施した。保守運用書の更新だけ保守運用書係に依頼した。

## 結果の要約
- 自動テストはすべて合格（速いテスト 49件、重いテスト 4件、共通指標仕様 一致）。
- 手動 M-1〜M-5・M-7 は実機で未実施（理由は下記）。M-6 は自動テストで代用。
- 受け入れ基準 A-01〜A-23 のうち、A-05・A-23 は #7 回答待ち。A-02・A-03・A-07〜A-10・A-12 の実機部分は未実施。
- 不合格のケースはない。

## 自動テスト
| 実行 | 結果 |
|---|---|
| `node --test "tests/unit/*.test.js"` | 合格 49件中 49件、fail 0 |
| `python -m unittest discover -s tests/e2e -v` | 合格 4件（8.8秒）。test_first_notice_shows_acks_and_stays_hidden、test_unexpected_error_shows_fixed_message、test_live_url_shows_fab_and_analyzes、test_panel_analysis_and_video_sync |
| `python shared/reference/metrics_ref.py --check` | 合格（出力が文字化けで読めず、終了コードで判定。QA-0001 では「一致しています」） |

## ケースごとの結果
| ID | 結果 | 備考 |
|---|---|---|
| TS-0002-M01〜M11 | 合格（11件） | fetcher.test.js（速いテストに含む） |
| TS-0002-VM01〜VM09 | 合格（9件） | panel_viewmodel.test.js、videoid.test.js |
| TS-0002-V01〜V03 | 合格 | test_first_notice_shows_acks_and_stays_hidden |
| TS-0002-V04 | 合格 | 同上（宛先の確認を含む） |
| TS-0002-V05 | 合格 | 既存2件 |
| TS-0002-V06 | 合格 | test_unexpected_error_shows_fixed_message |
| TS-0002-V07（M-1・M-2） | 未実施 | 理由：新しい Chrome プロファイルで「パッケージ化されていない拡張機能を読み込む」には OS のフォルダ選択画面の操作が要り、Claude in Chrome では操作できない。社長のPCで運用係または社長が実施 |
| TS-0002-V08（M-3・M-4） | 未実施 | 同上（拡張機能を実機の Chrome に読み込めない）。案内の表示・確認後に出ない動作は E2E（V01〜V03）で代用確認済み。ダークテーマ・2タブ・設定画面の明暗は未確認 |
| TS-0002-V09（M-5・M-7） | 未実施 | 同上。保存キーはコードで確認（下記）。実機の保存領域の目視と、長いエラー文の折り返しは未確認 |
| TS-0002-V10（M-6） | E2E で代用 | V06 が同じ内容を確認。実機確認は任意 |

## 文書確認（私が再実行したもの）
| ID | 結果 | 内容 |
|---|---|---|
| DC-01／A-01 | 合格 | README.txt に「hlx-ext」0件。入れ方は clone／ZIP の2通りで「extension」フォルダを選ぶ |
| DC-06／A-11 | 合格 | 禁止語（一切・何も保存しない・完全に安全など）が options.html・README.txt・content.js に0件。開示にコメント本文の保存、投稿者名を保存しないこと、外部送信しないこと（YouTube への要求を除く）が書かれている |
| DC-08／A-17 | 合格 | manifest.json は 6f7deac の差分なし |
| DC-09／A-18 | 合格 | `fetch(` は fetcher.js の3件のみ（宛先は location.origin）。E2E V04 でも http 宛先は www.youtube.com だけ |
| DC-13／A-22 | 合格 | README.txt と manifest が 1.2.0 |
| DC-15 | 合格 | README.txt は UTF-8 BOM・CRLF（file コマンドで確認） |
| DC-16 | 合格 | innerHTML 0件 |
| A-04 | 合格 | 更新手順が git pull と ZIP 上書きの2通りで、どちらも ↻ と YouTube タブの再読み込みを含む |
| A-06 | 合格 | README.txt 冒頭に非公式・自己責任があり、「■ 注意」の既存内容（視聴者数の推移、非公開の仕組み、切り抜きガイドライン）が残っている |
| A-10／A-12（コード突き合わせ） | 合格 | 保存キーは chat_<ID>・seen_<ID>・hlxNoticeAck（local）・hlxSettings（sync）。削除ボタンは chat_・seen_ で始まるキーだけを消す（options.js 60行）。開示の文言と一致 |
| DC-03・DC-14 | 回答待ち | README.md の冒頭の注意、LICENSE は #7 の回答後 |

## 受け入れ基準ごとの合否
| 基準 | 結果 | 根拠 |
|---|---|---|
| A-01 | 合格 | DC-01 |
| A-02 | 未実施 | M-1（実機）。clone した extension の読み込みは未確認 |
| A-03 | 未実施 | M-2（実機） |
| A-04 | 合格 | 文書確認 |
| A-05 | 回答待ち | #7（README.md の持ち場） |
| A-06 | 合格 | 文書確認 |
| A-07 | 合格（E2E） | V01・V02・VM01。新規プロファイルでの実機確認は未実施 |
| A-08 | 合格（E2E） | V03・VM01・VM02。実機・2タブは未実施 |
| A-09 | 合格（文書）・実機の見え方は未実施 | options.html の文言を確認。明暗の表示は未確認 |
| A-10 | 合格（コード）・実機目視は未実施 | 上記 |
| A-11 | 合格 | DC-06 |
| A-12 | 合格（コード・文書）・実機の前後確認は未実施 | 上記 |
| A-13 | 合格 | M01〜M04・M10 |
| A-14 | 合格 | M07 |
| A-15 | 合格 | M02・M05・M06 |
| A-16 | 合格 | M08・M09・VM03〜VM08・V06 |
| A-17 | 合格 | DC-08 |
| A-18 | 合格 | V04・DC-09 |
| A-19 | 合格 | 49件合格 |
| A-20 | 合格 | E2E 4件合格 |
| A-21 | 合格 | metrics_ref 適合・shared_spec テスト（49件に含む） |
| A-22 | 合格 | DC-13 |
| A-23 | 回答待ち | #7（ライセンス） |

## 実配信での確認
今回は実施していない。変更はエラー文・初回案内・文書で、取得の処理は変えていない。ただし fetcher.js のエラー送出を変えたため、マージ後に運用係が ops/smoke-urls.txt の URL で通常の解析（2.2）を確認する。

## 不合格のケース
なし。

## 残る留意点（不合格ではない）
1. 手動 M-1〜M-5・M-7 は、社長のPCで拡張機能を実際に読み込める人（社長または運用係）が実施する必要がある。マージ前の実施が望ましい。
2. #7 回答後に README.md・LICENSE・版数（DC-03・DC-14、A-05・A-23、A-22 の再確認）を追加で確認する。
3. 保守運用書は更新して承認した（4.3 の保存値の確かめ方は具体手順が曖昧。実機確認後に追記する）。

## 環境
Windows 11 Home 10.0.26200、Node v26.13.0、Python 3.13.14、Playwright Chromium（headless）。2026-10-30。
