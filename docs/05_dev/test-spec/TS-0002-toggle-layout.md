---
id: TS-0002-toggle-layout
title: 表示切り替えで下のボタンの位置が動かないようにする テスト仕様書
status: approved
req: REQ-0002
detail_design: DD-0002
reviewer: chrome-dev-kacho
updated: 2026-10-30
---
# TS-0002-toggle-layout 表示切り替えで下のボタンの位置が動かないようにする テスト仕様書

- 番号について：TS-0002 は REQ-0001 系列で使用済みのため、本書は id を `TS-0002-toggle-layout` とし、req 欄に REQ-0002 を書く（部長の決定）。
- 関連：REQ-0002（受け入れ基準 A-01〜A-13）、BD-0002、DD-0002（7章が材料）。
- 単体テストは追加しない（DD 7.1。変更は content.js の即時関数の中の定数1つと代入1つで、E2E で実際の配置を測る方が要件に直結するため）。Model・ViewModel の作業は無い。

## テストケース
層はすべて View（View係）。テストファイルはすべて `tests/e2e/test_extension_e2e.py`。表の ID は DD 7.7 節と同じ。

| ID | 層 | 担当 | 前提 | 手順 | 期待結果 | 自動/手動 | テストファイル（::メソッド） |
|---|---|---|---|---|---|---|---|
| T-E1 | View | View係 | 拡張機能を読み込んだChromium、模擬YouTube、解析 done、初回案内を閉じた。1400px・通常幅・表示範囲「全体」 | ヒートマップ → 折れ線 → ヒートマップ を5往復。往復の開始時に `.hlx-panel` の scrollTop を 0 にそろえる | 毎回、「スコア順」「時系列順」ボタン・最初の候補行・canvas の top と高さが、最初の値から 1px 以内。scrollTop が同じ。`hlx-on` が押した方に付く（A-01〜A-03） | 自動 | ::test_toggle_keeps_layout |
| T-E2 | View | View係 | 同上 | 4行のとき、ヒートマップと折れ線の canvas の高さを測る | どちらも 189 ± 1px（A-04） | 自動 | ::test_toggle_keeps_layout |
| T-E3 | View | View係 | 同上 | ⇔ で広げた幅（760px）にして、1400・800・500px のビューポートで1往復ずつ（`TOGGLE_CONDITIONS` の wide=True の5条件） | 各条件の開始時の値から 1px 以内。パネル幅が min(760, ビューポート幅) ± 1（前提の確認）（A-05） | 自動 | ::test_toggle_keeps_layout |
| T-E4 | View | View係 | 同上 | 表示範囲を near・first・second にして1往復ずつ（1400/通常 と 500/広げた）。ビューポート 800・500 の通常幅も1往復 | 各条件の開始時の値から 1px 以内。500px でパネルが 500px に縮む（A-06） | 自動 | ::test_toggle_keeps_layout |
| T-E5 | View | View係 | 同上。通常幅・広げた幅 × 両表示 | `CHART_INK_JS` で canvas の画素を読む | H = 189。4行ともラベル・行の上端と下端が塗られ、行間は空。見どころの数ぶんの▼が見える。目盛りが3つ以上。`hlx-on` が押した方だけ（A-07・F-05） | 自動 | ::test_toggle_keeps_drawing_and_actions |
| T-E6 | View | View係 | 同上 | 4つの組み合わせで `.hlx-panel` の画像を保存 | `tests/e2e/_artifacts/` に toggle_heat_normal.png・toggle_line_normal.png・toggle_heat_wide.png・toggle_line_wide.png が出る。目視は社長（品質保証課が QA に添付）（A-07 の手動・BD 4.2） | 自動（保存）＋手動（目視） | ::test_toggle_keeps_drawing_and_actions |
| T-E7 | View | View係 | 同上 | 折れ線・ヒートマップに切り替えたあと、「時系列順」を押し、続けて「スコア順」を押す | 時系列順で時刻が昇順・先頭が最小の時刻。スコア順で解析直後の並びに戻る（A-10） | 自動 | ::test_toggle_keeps_drawing_and_actions |
| T-E8 | View | View係 | 同上。ffmpeg あり（動画が読める） | 折れ線でグラフ中央（15:00）をクリック | 動画が 14:30 ± 31秒 に移る（A-08 折れ線） | 自動 | ::test_toggle_keeps_drawing_and_actions |
| T-E9 | View | View係 | 同上。ffmpeg あり | 折れ線で再生位置 20:00 とシークバー25%（7:30）にマウス | 20:00 の縦線と 7:30 の点線がグラフにある（A-09 折れ線）。画像 timeline_line.png を保存 | 自動 | ::test_toggle_keeps_drawing_and_actions |
| T-E10 | View | View係 | 同上 | 既存テスト（ヒートマップでクリック・縦線）。`GAP_INK_JS` の行の高さを 38 に直した | 通る（A-08・A-09 のヒートマップ側、A-11）。直さないと 38px の行の中を読んで、中身を確かめずに通ってしまう（N-1） | 自動 | ::test_panel_analysis_and_video_sync |
| T-E11 | View | View係 | 同上 | 既存4件を実行。新規2件の pageerror を数える | 既存4件が通る。新規2件の pageerror が 0 件（A-11） | 自動 | ::test_live_url_shows_fab_and_analyzes・::test_panel_analysis_and_video_sync・::test_first_notice_shows_acks_and_stays_hidden・::test_unexpected_error_shows_fixed_message |
| DC-1 | ― | View係 | ― | `node --test "tests/unit/*.test.js"` | すべて通る（A-11） | 自動 | tests/unit/*.test.js |
| DC-2 | ― | View係 | ― | `python -m unittest discover -s tests/e2e -v` | すべて通る。skip が無い | 自動 | tests/e2e/test_extension_e2e.py |
| DC-3 | ― | View係 | ― | `python shared/reference/metrics_ref.py --check` | 通る（A-11） | 自動 | shared/reference/metrics_ref.py |
| DC-4 | ― | 開発課長 | ― | `git diff main -- extension/manifest.json` | 差分なし（版数 1.2.1 のまま。A-13） | レビュー | ― |
| DC-5 | ― | 開発課長 | ― | `git diff main -- extension/panel.css extension/analyzer.js extension/fetcher.js extension/viewmodel shared` | 差分なし（A-11） | レビュー | ― |
| DC-6 | View | 開発課長 | ― | `git diff main -- extension/content.js` | DD 4.1.1・4.1.2 の2行だけ。折れ線の式・ヒートマップの塗りに差分なし（F-04・N-4） | レビュー | ― |
| DC-7 | View | 開発課長 | ― | 行の高さの式に `S.mode` が入っていないことを読み合わせる | H = 25 + 41 × 行数。行数が減っても両表示で同じ（F-06） | レビュー | ― |
| DC-8 | ― | View係 | content.js を修正前のまま | 下の「修正前の確認」 | 新テストが修正前に失敗した記録がある | 文書 | 本書 |
| M-1 | ― | 運用係 | 実配信（Claude in Chrome） | 解析後、表示を切り替える | 並べ替えボタンが動かない。YouTube のページが崩れない（A-12） | 手動 | ― |
| M-2 | ― | 品質保証課 | ブラウザのズーム 80%・125%、Windows の表示スケーリング | 表示を切り替える | ボタンが動かない（A-06 の補い） | 手動 | ― |
| M-3 | ― | 品質保証課 | 明るいテーマ | 両表示を見る | 太いヒートマップの行・ラベル・凡例が読める | 手動 | ― |
| M-4 | ― | 品質保証課 | 再生中 | 切り替え・マウス移動 | 引っかかりが無い（体感） | 手動 | ― |

## 受け入れ基準との対応
| 受け入れ基準 | テストケースID |
|---|---|
| A-01・A-02・A-03 | T-E1 |
| A-04 | T-E1・T-E2 |
| A-05 | T-E3 |
| A-06 | T-E4（＋M-2） |
| A-07 | T-E5・T-E6（目視は手動） |
| A-08 | T-E8（折れ線）・T-E10（ヒートマップ） |
| A-09 | T-E9（折れ線）・T-E10（ヒートマップ） |
| A-10 | T-E7 |
| A-11 | T-E10・T-E11・DC-1〜DC-3・DC-5 |
| A-12 | M-1 |
| A-13 | DC-4 |

## 修正前の確認（DC-8）
2026-10-30、content.js を変更前のまま（`git diff -- extension/content.js` が空）、テストだけ追加した状態で実行：

```
PYTHONUTF8=1 python -m unittest discover -s tests/e2e -k test_toggle_keeps_layout -v
```

結果：**FAIL**（1件中1件）。1往復目の「→ 折れ線」で止まった。DD の見込みどおり。

```
AssertionError: 80 not less than or equal to 1.0 : [1400/通常/all 1往復目 → 折れ線] canvasH: 109 → 189（差 80.0px）
```

- ヒートマップ 109px、折れ線 189px。差は 80px（BD 7.4 (1) の実測値を兼ねる）。
- 修正後（content.js の2行を変更）は、同じコマンドで OK。

## 実行結果（2026-10-30、修正後）
| コマンド | 結果 |
|---|---|
| `node --test "tests/unit/*.test.js"` | 49件中49件合格 |
| `python -m unittest discover -s tests/e2e -v` | 6件中6件合格（OK。skip なし。約18.7秒） |
| `python shared/reference/metrics_ref.py --check` | 「一致しています」 |
| 画像（`tests/e2e/_artifacts/`） | toggle_heat_normal.png・toggle_line_normal.png・toggle_heat_wide.png・toggle_line_wide.png・timeline_line.png が出た |

## 記録（未決事項 DD U-3・U-4）
- **U-3 実行時間**：新規 `test_toggle_keeps_layout` 約5.6秒、`test_toggle_keeps_drawing_and_actions` 約4.9秒（単独実行。ブラウザ起動・解析を含む）。合計約10.5秒で、60秒を大きく下回る。`TOGGLE_CONDITIONS` を減らす必要は無い。
- **U-4 並べ替えの先頭**：模擬データで、スコア順の先頭は 0:11:30、時系列順の先頭は 0:04:30。先頭は入れ替わる（合否の判定には影響しない）。

## 実行方法
- 速いテスト：node --test "tests/unit/*.test.js"
- 重いテスト：python -m unittest discover -s tests/e2e -v（Windows では日本語の文字化けを避けるため `PYTHONUTF8=1` を付けるとよい）
- 共通指標仕様：python shared/reference/metrics_ref.py --check
- 新規2件だけ：`python -m unittest discover -s tests/e2e -k test_toggle -v`
