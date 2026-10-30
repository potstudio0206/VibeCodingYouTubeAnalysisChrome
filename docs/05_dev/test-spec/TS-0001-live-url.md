---
id: TS-0001
title: /live/<ID> 形式URLへの対応
status: approved
reviewer: chrome-dev-kacho
detail_design: DD-0001（未作成。不具合 INC-0001 の修正のため、設計書より先に回帰テストを置いた）
updated: 2026-10-30
---
# TS-0001 /live/<ID> 形式URLへの対応 テスト仕様書

関連：INC-0001（/live/<ID> で「見どころ」ボタンが出ない）。原因は content.js の currentVid が pathname==='/watch' のときだけ ?v= を返すこと。

## 受け入れ基準
/live/<ID> と /watch?v=<ID> の両方で「見どころ」ボタンが出て、解析できる。

## テストケース
| ID | 層 | 担当 | 前提 | 手順 | 期待結果 | 自動/手動 | テストファイル |
|---|---|---|---|---|---|---|---|
| TS-0001-VM01 | ViewModel | ViewModel係 | videoid.js を読み込み済み | hlxVideoIdFromUrl('/watch', '?v=fPnkoOtQIyE')。他のパラメータが混ざる ?list=PL1&v=…&t=30s も | 動画ID fPnkoOtQIyE | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM02 | ViewModel | ViewModel係 | 同上 | hlxVideoIdFromUrl('/live/fPnkoOtQIyE', '') | fPnkoOtQIyE | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM03 | ViewModel | ViewModel係 | 同上 | hlxVideoIdFromUrl('/live/fPnkoOtQIyE', '?feature=share') | fPnkoOtQIyE | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM04 | ViewModel | ViewModel係 | 同上 | hlxVideoIdFromUrl('/live/fPnkoOtQIyE/', '')（末尾スラッシュ） | fPnkoOtQIyE | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM05 | ViewModel | ViewModel係 | 同上 | '/watch' で search が空、v なし、'?v=' | null | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM06 | ViewModel | ViewModel係 | 同上 | hlxVideoIdFromUrl('/', '') | null | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM07 | ViewModel | ViewModel係 | 同上 | '/shorts/<ID>'、'/results'（今回は対象外） | null | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM08 | ViewModel | ViewModel係 | 同上 | ID に $ % . を含む /live/ab$cd 等、/watch?v=ab$cd、/live/<ID>/extra | null | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM09 | ViewModel | ViewModel係 | 同上 | '/live/'、'/live' | null | 自動 | tests/unit/videoid.test.js |
| TS-0001-VM10 | ViewModel | ViewModel係 | 同上 | '/live/a_b-c' | a_b-c（_ と - は使える） | 自動 | tests/unit/videoid.test.js |
| TS-0001-V01 | View | View係 | 模擬YouTubeが /live/ パスにも視聴ページを返す。拡張機能を読み込んだChromium | https://www.youtube.com/live/<VID> を開き、.hlx-fab を押し、解析ボタンを押す | .hlx-fab が出て、解析が done で完了し「見どころ候補」が出る。ページエラーなし | 自動 | tests/e2e/test_extension_e2e.py::test_live_url_shows_fab_and_analyzes |
| TS-0001-V02 | View | View係 | 同上 | /watch?v=<VID> で同じ流れ（既存の回帰） | 従来どおり動作（パネル・シーク連動） | 自動 | tests/e2e/test_extension_e2e.py::test_panel_analysis_and_video_sync |

## 修正前に落ちたこと
videoid.js がまだ無い状態で `node --test tests/unit/videoid.test.js` を実行（2026-10-30）。videoid.js を読み込めず（ENOENT）、10件中10件が落ちた（pass 0 / fail 10）。落ちたテスト：
- /watch?v=ID は ID を返す
- /live/ID は ID を返す
- /live/ID?feature=share は ID を返す
- /live/ID/ （末尾スラッシュ）は ID を返す
- /watch で v がなければ null
- トップ / は null
- /shorts/ID や /results は対象外で null
- ID に [A-Za-z0-9_-] 以外を含むなら null
- /live/ だけ（IDなし）は null
- ID に使える記号 _ と - は通す

実装後は 10件すべて合格（速いテスト全体 31件合格）。なお、content.js の旧 currentVid は /live/<ID> で null を返す（INC-0001 の原因）。

### E2E（View係、2026-10-30）
content.js・manifest.json が未修正の状態で `python -m unittest discover -s tests/e2e -v` を実行。2件中1件が落ちた（ERROR）：
- test_live_url_shows_fab_and_analyzes（.hlx-fab が表示されず 20 秒でタイムアウト。ボタンは作られるが hidden のまま）
既存の test_panel_analysis_and_video_sync は合格。
修正後（manifest に viewmodel/videoid.js を追加、currentVid を hlxVideoIdFromUrl に置換）は E2E 2件すべて合格、速いテスト 31件合格。

## 受け入れ基準との対応
| 受け入れ基準 | テストケースID |
|---|---|
| /watch?v=<ID> で動画IDが求まる | TS-0001-VM01 |
| /live/<ID> で動画IDが求まる（ボタンが出て解析できる前提） | TS-0001-VM02〜VM04 |
| 対象外のURLでは出さない・誤ったIDを通さない | TS-0001-VM05〜VM09 |
| 両URLでボタンが出て解析できる（実際の画面） | TS-0001-V01（/live/）、TS-0001-V02（/watch） |

## 実行方法
- 速いテスト：node --test "tests/unit/*.test.js"
- 重いテスト：python -m unittest discover -s tests/e2e -v
