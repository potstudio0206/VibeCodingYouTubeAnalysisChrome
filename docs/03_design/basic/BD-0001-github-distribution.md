---
id: BD-0001
title: GitHub 配布の体裁整備（導入手順・自己責任の明示・保存データの開示・エラー案内・説明書の整理）基本設計
status: approved
author: chrome-design-basic
reviewer: chrome-design-kacho
requirement: REQ-0001
updated: 2026-10-30
---
# BD-0001 GitHub 配布の体裁整備 基本設計

## 0. 前提と確かめた範囲
- 入力：REQ-0001（approved）。現行コード（`extension/manifest.json`・`content.js`・`fetcher.js`・`options.html`・`options.js`・`panel.css`・`README.txt`・`viewmodel/videoid.js`・`background.js`）、リポジトリ直下 `README.md`、`tests/unit/fetcher.test.js`・`_load.js`・`videoid.test.js`、`tests/e2e/test_extension_e2e.py`、`.claude/hooks/ownership.json` を 2026-10-30 に読んだ。
- 本書の「確認」はコードを読んだこと。拡張機能の実機操作・E2E の実行・通信の実測はしていない。見込みの記述は「見込み」と書く。
- 行番号は 2026-10-30 時点のもの（REQ-0001 の行番号と一致することを確認）。
- GitHub のリポジトリは `gh repo view` で、名前 `VibeCodingYouTubeAnalysisChrome`、公開、Issue 機能が有効（hasIssuesEnabled = true）、ライセンス無し、を確認した。

### 0.1 設計の制約（課長方針）
| 制約 | 内容 | 本設計への影響 |
|---|---|---|
| C-1 | `manifest.json` の `permissions`・`host_permissions`・`content_scripts`（`matches` と `js` 配列の両方）を変えない | 新しい JS ファイルを content script として足せない。パネル側の新しいロジックは、既に読み込まれている `analyzer.js`・`fetcher.js`・`viewmodel/videoid.js`・`content.js` のどれかに置く。読み込み順はこの順のまま |
| C-2 | `shared/` を変えない | 指標の計算・スコアは一切触らない |
| C-3 | 通信先を増やさない | 案内・開示に外部の画像・フォント・スクリプトを使わない。`fetch` を足さない |
| C-4 | 社長判断待ち #7（ライセンス・版数・README.md と LICENSE の持ち場）は未回答 | 依存する部分は 8章に分けた。それ以外は回答に依存せず確定する |

## 1. 要件との対応
確かめ方の担当：単体＝`node --test "tests/unit/*.test.js"`、E2E＝`python -m unittest discover -s tests/e2e -v`、手動＝Chrome での手作業（運用係・品質保証課）、文書＝文書の目視・grep、レビュー＝コードの突き合わせ。

| 受け入れ基準 | 設計での対応 | 確かめ方の担当 |
|---|---|---|
| A-01 | README.txt の「入れ方」を GitHub 配布に合わせて書き直し、「hlx-ext」をすべて消す。読み込むのはリポジトリ直下の `extension` フォルダと明記（4.5 節の構成） | 文書（`grep -n "hlx-ext" extension/README.txt` が 0 件＋目視） |
| A-02 | 製品コードの読み込み構成（manifest）は変えないので、clone した `extension` をそのまま読み込める見込み。README.txt の手順で確かめる | 手動（運用係：新しい Chrome プロファイルで clone から読み込み、動画ページで「見どころ」ボタンを確認） |
| A-03 | 同上。README.txt は ZIP の解凍先のフォルダ名を断定せず「解凍してできたフォルダの中の `extension` フォルダ」と書く | 手動（運用係：ZIP を解凍して読み込み。実際のフォルダ名も記録） |
| A-04 | README.txt の「更新するとき」を (a) clone：`git pull` → ↻ → タブ再読み込み、(b) ZIP：読み込み済みの `extension` フォルダの中身を同じ場所で上書き → ↻ → タブ再読み込み、の2通りにする | 文書 |
| A-05 | README.md の冒頭（導入手順より前）に非公式・動かなくなることがある・無保証／自己責任の短い注意（4.1 節の文）と `extension/README.txt` への案内を置く。**README.md の編集担当は #7(c) の回答待ち**（8.3 節） | 文書 |
| A-06 | README.txt の1行目（製品名と版数）の直後に「■ はじめに（非公式・自己責任）」の要約節を置く。既存の「■ 注意」の3項目（視聴者数の推移、非公開の仕組み、切り抜きガイドライン）は文言を保って残す | 文書 |
| A-07 | パネル内、見出しのすぐ下に「初回案内」を通常の流れ（重ねない）で表示する。既読の記録キー `hlxNoticeAck` が無ければ表示。案内は解析・中止・⚙・× のボタンを覆わない（重ね表示にしない、見出しは今の sticky のまま）。案内のボタンには `hlx-btn`・`hlx-primary` のクラスを付けない（E2E の `.hlx-primary` の指定と CSS の表示切り替えに干渉させないため） | E2E（既存2件が、新しいプロファイル＝案内が出た状態のまま修正なしで通ること。加えて新規の E2E で案内の表示を確認）／手動 |
| A-08 | 案内の「確認しました」を押すと案内を隠し、`chrome.storage.local` の `hlxNoticeAck` に案内の版（数値 1）を保存。次回の読み込みでは `hlxShouldShowNotice()` が偽を返し表示しない | E2E（新規：押す → 再読み込み → 案内が出ない）／単体（判定関数）／手動 |
| A-09 | `options.html` の「保存したチャット」の項に、4.3 節の全文（非公式・自己責任＋保存データの開示）を常設する。削除ボタンと同じ項の中に置く。色は既存の CSS 変数を使い、ダークモードでも読める | 手動（options.html を開く、明暗の両方）／文書（options.html の文言） |
| A-10 | 5.1 節の対応表のとおり、開示の文の各項目と実際の保存キー・中身を突き合わせた。開示の「保存するもの」に info の各項目（動画ID・タイトル・配信者名・長さ・「よく再生された部分」）と保存日時、確認済みの印、設定の5項目、案内の確認記録が入る | レビュー（5.1 節の表とコード）＋手動（解析後に DevTools → Application → Storage でキーを目視） |
| A-11 | 開示の文は付録A をもとに 4.3 節で確定。「一切収集しない」「何も保存しない」「個人情報を含まない」「完全に安全」「規約に違反しない」などを使わない。コメント本文を保存すること、投稿者名を保存しないこと、YouTube 以外へ送らないことを書く | 文書（`grep -nE "一切|何も保存しない|個人情報を含まない|完全に安全|規約に違反しない|規約上問題ない|裏技"` で 0 件＋目視。対象：options.html・README.txt・README.md・content.js） |
| A-12 | `options.js` の `clearCache()` は変えない（`chat_`・`seen_` で始まるキーだけ消す）。新キー `hlxNoticeAck` は `chat_`・`seen_` で始まらないので消えない。設定（`hlxSettings`、sync）も消えない。開示の「削除」の文をこの動作に合わせる（4.3 節） | 手動（削除前後のキーを確認）＋文書 |
| A-13 | `fetcher.js` の 126・145・185 行のエラーに共通の一文 `HLX_SPEC_CHANGE_NOTE` を後ろに足す。142 行は既存の文言の後ろに「通常の動画・チャット無効・処理中のどれでもないのに出る場合は、」＋共通の末尾 `HLX_SPEC_CHANGE_TAIL` を足す（3.2 節） | 単体（`tests/unit/fetcher.test.js` に追加。YouTube の応答を模擬） |
| A-14 | 187 行（応答なし）は既存の「少し時間をおいて再試行してください。」の後ろに `HLX_SPEC_CHANGE_NOTE`（「何度か試しても同じ場合は、…」）を足す | 単体（5回失敗を模擬。待ち時間は `setTimeout` を即時実行に差し替えて短縮） |
| A-15 | 129 行（配信中）・141 行（視聴制限）の文言は変えない。content.js の「中止しました。」「コメントが1件も見つかりませんでした。」も変えない。142 行は既存の文言を残し、その後ろに追記 | 単体（既存の「配信中・チャットなし・視聴制限は…」が通る＋「仕様変更」を含まないことの確認、142 行の追記の確認を追加） |
| A-16 | `fetcher.js` が投げる利用者向けのエラーに目印（`hlxUser: true`）を付ける。ViewModel の純粋関数 `hlxErrorStatus(e)` が、目印ありなら `e.message` をそのまま、目印なし（想定外）なら日本語の定型文（仕様変更の可能性を含む）を返す。View（content.js）は返った文を表示し、想定外のときだけ `console.error` に詳細を出す（3.2 節） | 単体（`hlxErrorStatus` に目印あり／なし／`null`／文字列を渡す）＋手動（例外を模擬。詳細設計で手順を決める） |
| A-17 | `manifest.json` は `version` 以外を変えない（version も #7 の回答次第。8.2 節） | `git diff extension/manifest.json`（レビュー） |
| A-18 | `fetch` を足さない。案内・開示は文字だけで、外部の画像・フォント・リンク先の自動取得をしない。README のリンクは利用者が押したときに開くだけ | レビュー（`grep -n "fetch(" extension/` の件数が変わらない：fetcher.js の3か所のみ）／可能なら E2E（要求先が youtube.com だけであることの記録。任意） |
| A-19 | 既存の単体テストの期待（エラー文の部分一致、`videoid.test.js` の単独読み込み）を壊さない設計にする（7.3 節の注意 N-1・N-2） | 単体 |
| A-20 | 案内は通常の流れに置くだけで `data-view` の切り替えに関わらないので、既存 E2E の手順（⚙ ではなく「見どころ」→ `.hlx-primary` → `done` 待ち）は変えずに通る見込み。通らなかった場合だけ、テスト側に案内を閉じる手順を足す（7.3 節） | E2E |
| A-21 | `shared/`・`analyzer.js` を変えない | `python shared/reference/metrics_ref.py --check`、単体（`shared_spec.test.js`） |
| A-22 | README.txt の1行目の版数を `manifest.json` の version と同じ3桁の表記にする。#7 の回答が「1.2.1 に上げる」なら両方を 1.2.1、「上げない」なら README.txt を 1.2.0 にそろえる（8.2 節） | 文書 |
| A-23 | #7(a) の回答どおりに LICENSE と README の表記を整える（8.1 節）。回答までは README にライセンスの記述を足さない（F-50） | 文書（#7 回答後） |

## 2. 全体構成（MVVM）
### 2.1 機能の置き場所
| 機能のまとまり | 層 | モジュール・ファイル | 担当係 |
|---|---|---|---|
| エラー文の追記（共通の一文の定数、目印付きのエラーを作る補助） | Model | `extension/fetcher.js` | Model係 |
| 想定外のエラーかの判別と、表示する文の選択（`hlxErrorStatus`）、想定外のときの定型文 | ViewModel | `extension/viewmodel/videoid.js`（**既知の逸脱 D-1**） | ViewModel係 |
| 初回案内を出すかの判断（`hlxShouldShowNotice`、案内の版 `HLX_NOTICE_VERSION`、記録キー名 `HLX_NOTICE_KEY`） | ViewModel | `extension/viewmodel/videoid.js`（**既知の逸脱 D-1**） | ViewModel係 |
| 初回案内の描画、閉じる操作、既読の保存・読み出し、エラー表示の最終段（状態表示とコンソール出力） | View | `extension/content.js` | View係 |
| 初回案内の見た目 | View | `extension/panel.css` | View係 |
| 設定画面の開示（非公式・自己責任＋保存データ、常設） | View | `extension/options.html`（静的な文。`options.js` は変更なし） | View係 |
| 利用者向け説明書 | View | `extension/README.txt` | View係 |
| 版数（#7 の回答次第） | ― | `extension/manifest.json` | View係 |
| 入口の説明（リポジトリ直下） | ― | `README.md`（**#7(c) の回答待ち**） | 未定（View係に追加する案） |
| ライセンス（#7(a) の回答次第） | ― | `LICENSE`（リポジトリ直下） | 未定（同上） |

### 2.2 依存の向き
```
content.js（View）
  ├─ hlxFetchChat（Model, fetcher.js）を直接呼ぶ …… 既存の逸脱（D-2）
  ├─ hlxErrorStatus / hlxShouldShowNotice（ViewModel, viewmodel/videoid.js）を呼ぶ
  └─ chrome.storage.local（hlxNoticeAck の読み書き）
viewmodel/videoid.js（ViewModel）
  └─ HLX_SPEC_CHANGE_NOTE（Model, fetcher.js の定数）を**関数の中でだけ**参照する
fetcher.js（Model）
  └─ 表示を知らない（ただし利用者向けの日本語のエラー文を持つのは既存のまま。D-3）
```
- ViewModel が Model の定数を参照する向きは MVVM の正しい向き。View が ViewModel を経ずに Model の定数を参照しない（定型文の組み立ては ViewModel に置く）。
- `videoid.js` の**最上位**（関数の外）で `HLX_SPEC_CHANGE_NOTE` を参照しない。`tests/unit/videoid.test.js` は `videoid.js` だけを空の環境で読み込むため、最上位で参照すると既存テストが ReferenceError で落ちる（7.3 節 N-2）。

### 2.3 既知の逸脱（理想の MVVM から外れる箇所。リファクタリング課への申し送り＝RF-0001 の候補）
| No | 逸脱 | 理由 | RF での直し方の案 |
|---|---|---|---|
| D-1 | パネルの ViewModel の関数（エラー表示の選択、初回案内の判断）を `viewmodel/videoid.js` に置く。ファイル名（動画ID）と中身が合わなくなる | C-1 により、content script に新しいファイル（例：`viewmodel/panel.js`）を足せない。content.js に置くと View に判断が混ざり、Node で単体テストできない | manifest の `content_scripts.js` を変えてよい案件で、`viewmodel/videoid.js` を `viewmodel/panel.js` などに改名・分割する。テストも分ける |
| D-2 | content.js が Model（`hlxFetchChat`）を直接呼び、パネルの状態（`S`）も持つ。案内の表示状態も content.js が持つ | 既存の構造（CLAUDE.md 4章「現状は content.js に混在」）。本件で大きく動かさない | パネルの状態と取得の呼び出しを `viewmodel/` に移す（既存の移行計画に合流） |
| D-3 | 利用者向けの日本語のエラー文を Model（fetcher.js）が持つ。本件で追記もここで行う | 課長方針。既存の単体テストがエラー文を `hlxFetchChat` の reject で照合しているため、文の置き場所を変えると既存テストの書き換えが要る | Model はエラーの種類（コード）だけを投げ、ViewModel が種類から表示文を作る形に分ける。そのとき目印 `hlxUser` は種類コードに置き換える |
| D-4 | 開示の文が3か所（`options.html`、`README.txt`、content.js の初回案内の要約）に手で写される。コード上の単一の元が無い | C-1 により、content script と設定画面で共有する文の定数ファイルを足せない。README.txt はプレーンテキスト | `extension/view/` に文の定数を置き、content script と options.html の両方から読む（manifest 変更が要る）。README.txt との一致はテスト（文字列の照合）で守る案もある |
| D-5 | `options.js`（View）が `chrome.storage` を直接読み書きする | 既存。本件で options.js は変えない | 設定・保存データの読み書きを Model 側の保存モジュールにまとめる |

### 2.4 検討して採らなかった案
| 案 | 採らなかった理由 |
|---|---|
| エラー文の追記を content.js 側で行う（Model を触らない） | 対象・対象外の区別を文字列の照合で行うことになり、文言が変わると静かに壊れる。単体テストで確かめにくい |
| A-16 の判別を content.js の中で行う（課長方針の原案：View が目印を見て選ぶ） | 判別と定型文の組み立てを ViewModel の純粋関数にすると、A-16 を Node の単体テストで確かめられる（E2E で例外を起こすより確実で速い）。View の仕事は「返った文を出す・想定外ならコンソールに出す」だけになり、課長方針の方向（View は選ぶだけ）をさらに進めた形。**原案からの変更点として課長の確認を求める** |
| Model がエラーコードを投げ、ViewModel で文に変える（D-3 の理想形） | 既存のエラー文と単体テストの期待をまとめて動かすことになり、本件（表示と文書の整備）の範囲を超える。RF-0001 の候補に回す |
| 初回案内をモーダル（重ね表示）にする | 解析ボタン・⚙・× を覆う。E2E の `.hlx-primary` のクリックが重なりで失敗しうる。REQ（解析ボタンを塞がない）に反する |
| 案内をパネル外（ページ上部のバナー）に出す | YouTube のページの作りに依存し、動画ページ以外でも出うる（F-27） |

## 3. 処理の流れ
### 3.1 初回案内
```
[起動] content.js の buildUI()
  └─ 案内の要素 notice を作り、見出し（hlx-head）の直後、状態表示（hlx-status）の前に置く。初期状態は「隠す」
[起動の直後] content.js
  └─ store.get(HLX_NOTICE_KEY) を非同期で読む（解析の開始・キャッシュの表示を待たせない。await で onNav を止めない）
       └─ hlxShouldShowNotice(値) が真 → notice を表示 ／ 偽 → 隠したまま
          ※ 読み出しに失敗したとき（store.get は undefined を返す）は「表示」になる
[利用者が「確認しました」を押す]
  └─ notice を隠す → store.set(HLX_NOTICE_KEY, HLX_NOTICE_VERSION)
       ※ 保存に失敗しても、このページでは隠したまま。次の読み込みで再表示される（害は小さい）
[ほかのタブで確認した]（推奨）
  └─ 既存の chrome.storage.onChanged の受け手で area === 'local' かつ HLX_NOTICE_KEY の変更なら、同じ判断で再評価して隠す
```
- 案内の表示は `data-view`（idle / loading / done / error）と無関係。どの状態でも、確認するまで出し続ける。`onNav()`（動画の切り替え）でも消さない・出し直さない。
- 案内はパネルの中にあるので、パネルを開いたときだけ見える。パネルは動画ページでだけ開く（現行どおり。`togglePanel` は「見どころ」ボタン経由、ツールバーのアイコン経由は `currentVid()` がある時だけ）。動画ページ以外では「見どころ」ボタン自体が隠れている（F-27）。
- 案内の表示・非表示は、解析の開始（`start`）、結果の表示（`render`）、再生位置との連動（`drawChart`）、シークバーの印（`drawMarkers`）の処理に一切関わらせない（F-27）。案内でグラフの位置が下にずれるだけで、グラフのクリックやツールチップの座標は `getBoundingClientRect` で求めているため影響しない（コードで確認）。

判断の関数（ViewModel、純粋）：
| 名前 | 入力 | 出力 | 規則 |
|---|---|---|---|
| `HLX_NOTICE_KEY` | ― | `'hlxNoticeAck'` | 定数 |
| `HLX_NOTICE_VERSION` | ― | `1` | 定数。案内の内容を大きく変えて再表示したいときに上げる |
| `hlxShouldShowNotice(stored)` | 保存された値（undefined／数値／その他） | 真偽 | 数値として `HLX_NOTICE_VERSION` 以上なら偽（表示しない）、それ以外（未保存・壊れた値・古い版）は真 |

### 3.2 エラー表示
```
fetcher.js（Model）
  ├─ 利用者向けのエラーはすべて「目印付き」で投げる：e.hlxUser = true
  │     対象外（文言そのまま）：129 配信中、141 視聴制限
  │     追記あり：126、145、185、187 … 既存の文 ＋ HLX_SPEC_CHANGE_NOTE
  │     追記あり（条件付き）：142 … 既存の文 ＋ '通常の動画・チャット無効・処理中のどれでもないのに出る場合は、' ＋ HLX_SPEC_CHANGE_TAIL
  └─ 中断は従来どおり new Error('__aborted__')（目印なし。content.js が先に除外する）
content.js（View）の start() の catch
  ├─ 中断・古い実行なら何もしない（現行どおり）
  ├─ st = hlxErrorStatus(e)            … ViewModel
  ├─ st.unexpected なら console.error('[盛り上がり検知]', e)   … 開発者向けの詳細
  └─ setView('error'); setStatus(st.text)
viewmodel/videoid.js（ViewModel）
  hlxErrorStatus(e):
    e が目印付き（e.hlxUser === true）で message が空でない文字列 → { text: e.message, unexpected: false }
    それ以外（想定外の例外、文字列、null など）           → { text: 想定外の定型文, unexpected: true }
```
文の定数（Model、`fetcher.js`）：
| 定数 | 値（案。公開文言として #7 の確認対象） |
|---|---|
| `HLX_SPEC_CHANGE_TAIL` | `YouTube 側の仕様変更で読み取れなくなっている可能性があります。` |
| `HLX_SPEC_CHANGE_NOTE` | `何度か試しても同じ場合は、` ＋ `HLX_SPEC_CHANGE_TAIL`（＝付録A.3 と同じ文） |

- 「追記の一文は1つの定数で統一」は、**末尾 `HLX_SPEC_CHANGE_TAIL` を全箇所で共有する**形で満たす。142 行だけは課長決定（REQ 8章(1)）の条件「どれでもないのに出る場合は」を前に付けるため、前置きが異なる。前置きまで1文に統一すると課長決定の趣旨が失われるため、この形にした。
- 想定外の定型文（ViewModel、`videoid.js`、関数の中で組み立てる）：`解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。` ＋ `HLX_SPEC_CHANGE_NOTE`（案）。
  - 想定外には、最初のページ取得（fetcher.js 143 行）の通信失敗（`TypeError` など）や、応答の JSON の読み取り失敗も入る。これらにも「再読み込み→同じなら仕様変更の可能性」の案内で差し支えないと判断した（通信の失敗も「再読み込み」で解消を試すのが先のため）。
- 目印の付け方は、`Error` に `hlxUser` プロパティを足す形を基本とする（`Error` の派生クラスでもよい。詳細設計で決める）。目印付きのエラーを作る小さな補助関数（例：`hlxUserError(message)`）を fetcher.js に置き、7か所（126・129・141・142・145・185・187）をすべてそれで投げる。
- 「コメントが1件も見つかりませんでした。」（content.js 206行）は例外ではなく `render()` の表示なので、この流れを通らず、変わらない。「中止しました。」も `cancel()` の表示で変わらない。

### 3.3 知らせ先（F-32）
- **画面（エラー文・初回案内）には Issue の URL を出さない。** 理由：エラー文が長くなり煩雑。パネルの状態表示は文字だけでリンクにならない（押せない URL は役に立たない）。
- README.txt の「うまくいかないとき」に知らせ先を書く：`https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome/issues`（Issue 機能が有効なことは `gh repo view` で確認済み。投稿には GitHub のアカウントが要る旨も添える）。
- リポジトリ名の大文字・小文字は実際の名前 `VibeCodingYouTubeAnalysisChrome`（`YouTube` の T が大文字）にそろえる。

## 4. 画面・出力
文はすべて REQ-0001 付録A を元にした案。**公開文言は #7 で社長の確認対象**（REQ 7.3）。確認で変わった場合は、4.1〜4.3 節の各文を書き換え、3か所（options.html・README.txt・初回案内）を同時に直す。

### 4.1 非公式・自己責任（短い版。初回案内、README.md 冒頭、README.txt「はじめに」で共通）
> この拡張機能は、YouTube・Google とは関係のない、非公式のものです。YouTube や Google が提供・承認したものではありません。
> チャットは YouTube の非公開の内部の仕組みで読み込んでいるため、YouTube 側の仕様変更で、予告なく動かなくなることがあります。
> 無保証です。ご利用は自己責任でお願いします。切り抜きの際は、配信者の切り抜きガイドラインを確認してください。

（付録A.1 のまま）

### 4.2 初回案内（パネル内）
置き場所：見出し（`hlx-head`）の直後、状態表示（`hlx-status`）の前。重ね表示にしない。

| 部品 | 内容 |
|---|---|
| 見出し | はじめにお読みください |
| 本文1 | 4.1 節の3文 |
| 本文2（保存データの要約） | 解析した配信の情報とチャット（コメントの本文・時刻・種別）、「確認済み」の印、設定、この案内を確認した記録を、このPCの Chrome の中に保存します。コメントを書いた人の名前・チャンネル・アイコン・スーパーチャットの金額は保存しません。データを作者や第三者のサーバーへ送ることはありません（通信するのは YouTube だけです）。 |
| 本文3 | 詳しい説明と削除の方法は、設定（⚙）の「保存したチャット」にあります。 |
| ボタン | 確認しました（押すと案内を閉じ、以後は自動で出さない） |

見た目（`panel.css`）：
- 背景 `var(--hlx-card)`、左に `var(--hlx-accent)` の細い線、文字は `var(--hlx-fg)`、本文は 12px 程度。既存の CSS 変数を使うので、YouTube のダークテーマ（`html[dark]`）でも読める。
- クラス名は `hlx-notice`（枠）、`hlx-notice-ok`（ボタン）など `hlx-` で始める。**`hlx-btn`・`hlx-primary` は使わない**（CSS 133〜140 行の表示切り替えで隠れてしまう／E2E の `.hlx-primary` に当たるため）。
- 隠すときは `hidden` 属性かクラスの付け外しで行う。`hidden` 属性を使うなら、`.hlx-notice` に `display` を指定しても隠れるよう `.hlx-notice[hidden] { display: none; }` を併記する。
- 外部の画像・フォント・`url()` を使わない（C-3）。

### 4.3 設定画面の開示（`options.html`、「保存したチャット」の項）
置き場所：現行の「保存したチャット」の項（`<label>保存したチャット</label>`、件数表示、削除ボタン、既存の説明）の**同じ項の中、削除ボタンと既存の説明の後**に、次の2つの小見出しと文を常設する。折りたたまない（いつでも読める）。色は既存の `var(--fg)`・`var(--sub)` を使い、`prefers-color-scheme: dark` に追従させる。

小見出し「この拡張機能について」：4.1 節の3文。

小見出し「読むもの・保存するもの」（**README.txt の保存データ節と同一の文。これを正本とする**）：
> **このツールが読むもの**：開いている動画の情報（動画ID・タイトル・配信者名・長さ・「よく再生された部分」のデータ）と、チャットのコメント（本文・投稿時刻・通常／スーパーチャット／メンバー系の種別）。
> **このPCに保存するもの**：
> ・解析した配信の情報（動画ID・タイトル・配信者名・長さ・「よく再生された部分」のデータ）と、保存した日時。
> ・解析した配信ごとのチャット（コメントの本文・時刻・種別）。メンバー系は本文を保存しません。
> ・「確認済み」にした見どころの印。
> ・設定（候補の出やすさ、集計の細かさ、候補の最大数、何秒前から再生するか、検知するワード）。
> ・はじめの案内を確認したという記録。
> **保存場所**：このPCの Chrome の中（拡張機能用の保存領域）。設定は、Chrome の同期を有効にしている場合、Google アカウントを通じて同期されることがあります。
> **保存しないもの**：コメントを書いた人（視聴者）の名前・チャンネル・アイコン・スーパーチャットの金額。（配信者名は、配信の情報として保存します。）ただし、コメント本文に視聴者が自分で書いた内容は、そのまま保存されます。
> **送信**：この拡張機能の作者や第三者のサーバーへ、データを送ることはありません。通信するのは YouTube だけです（動画ページとチャットを読み込むため。ログイン情報は付けません）。
> **削除**：このページの「保存したチャットをすべて削除」で、解析したチャットと「確認済み」の印が消えます。設定と、はじめの案内を確認した記録は消えません（設定は「初期設定に戻す」で消えます）。拡張機能そのものは、Chrome の拡張機能の管理画面（chrome://extensions）から削除できます。

付録A.2 からの変更点（理由）：
| 箇所 | 変更 | 理由 |
|---|---|---|
| 保存するもの・最後の行 | 「この案内」→「はじめの案内」 | 設定画面・README.txt では「この案内」が指すものが無いため |
| 削除 | 「設定と、はじめの案内を確認した記録は消えません」を足した | F-24 の決定（削除ボタンでは消さない）と開示を一致させるため（A-10・A-12） |
| 削除 | 拡張機能の削除でデータが消えるかは書かない | F-26（未確認） |

- 削除ボタンの文言（「保存したチャットをすべて削除」）と確認ダイアログ（options.js 58 行）は変えない。開示の「削除」の文で区別を書くことで F-25 を満たす。
- `options.html` は `analyzer.js` と `options.js` だけを読み込む。開示は静的な HTML の文なので、`options.js` の変更は無い。

### 4.4 エラー文（変更後の全文。案）
| 場所 | 変更後 |
|---|---|
| fetcher.js 126 | ページ情報を読み取れませんでした。ページを再読み込みしてからもう一度お試しください。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 |
| fetcher.js 129 | （変更なし）配信中は解析できません。配信が終わってアーカイブになってから実行してください。 |
| fetcher.js 141 | （変更なし）この動画は未ログインでは見られないため解析できません（メンバー限定・年齢制限など）。 |
| fetcher.js 142 | この動画にはチャットリプレイがありません（通常の動画、チャット無効、またはアーカイブ処理中）。通常の動画・チャット無効・処理中のどれでもないのに出る場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 |
| fetcher.js 145 | チャットリプレイの読み込み口が見つかりませんでした。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 |
| fetcher.js 185 | YouTubeからの取得に失敗しました（エラー ○○○）。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 |
| fetcher.js 187 | YouTubeからの応答がありません。少し時間をおいて再試行してください。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 |
| 想定外（content.js 179 の置き換え） | 解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 |
| content.js 189・206 | （変更なし）中止しました。／コメントが1件も見つかりませんでした。 |

- 状態表示は文字だけ（`textContent`）。エラー時の文字色は現行どおり `var(--hlx-accent)`。長くなるので2行程度に折り返す見込み（パネル幅 400px）。

### 4.5 README.txt の構成（F-01〜F-06、F-10〜F-13、F-34、F-40〜F-44）
| 順 | 節 | 内容 | 根拠 |
|---|---|---|---|
| 1 | 1行目 | `配信 盛り上がり検知 in Chrome（Chrome拡張機能） ver <manifest の version と同じ3桁>`（8.2 節） | F-43・A-22 |
| 2 | ■ はじめに（非公式・自己責任） | 4.1 節の3文 | F-10・F-11(b)・A-06 |
| 3 | （in App版との違い） | 「音声・画面まで解析する in App版（PCツール）とは別のもの。in Chrome版はチャットだけで解析し、ブラウザだけで動く」。**「数分で終わります」は消す**（実測の根拠が無いため） | F-42・F-13 |
| 4 | ■ 入れ方（GitHub から・最初の1回だけ） | 入手2通り：(a) `git clone https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome.git`、(b) リポジトリのページで「Code → Download ZIP」して解凍（解凍先を決めてから読み込む）。一言：「入るのはリポジトリ全体（tests・docs など）ですが、使うのは `extension` フォルダだけです」。手順：`chrome://extensions` → 右上「デベロッパー モード」オン → 「パッケージ化されていない拡張機能を読み込む」でリポジトリ直下の `extension` フォルダ（ZIP の場合は「解凍してできたフォルダの中の `extension` フォルダ」）→ ピン留め（任意）。「読み込んだ後はフォルダを消さない・動かさない」を残す。アドレス・ボタン名は現行のまま | F-01〜F-03・F-06・A-01 |
| 5 | ■ 使い方 | 現行の内容を保つ。手順3の「5時間の配信なら数分でチャットを読み終わります」は「配信が長いほど時間がかかります。進み具合はパネルに表示されます」にする | F-13 |
| 6 | ■ 設定（パネル右上の ⚙） | 現行どおり。最後に「設定画面の『保存したチャット』に、保存するデータの説明があります」を1行足す | F-21 の導線 |
| 7 | ■ 更新するとき | (a) clone した場合：リポジトリのフォルダで `git pull` → `chrome://extensions` で更新ボタン（↻）→ YouTube のタブを再読み込み。(b) ZIP の場合：新しい ZIP を解凍し、読み込み済みの `extension` フォルダの中身を同じ場所で上書き → ↻ → タブを再読み込み。「別の場所に解凍して読み込み直さず、同じ場所に上書きしてください」（理由は断定しない） | F-04・A-04 |
| 8 | ■ うまくいかないとき | 現行の5項目を保つ（「途中でエラーになる → …続く場合は YouTube 側の仕様変更の可能性があります」は維持）。「チャットリプレイがありません」の項に「どれにも当たらないのに出る場合は、YouTube 側の仕様変更の可能性があります」を足し、画面の文と意味をそろえる。最後に知らせ先：「直らないときは、リポジトリの Issue で知らせてください：`https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome/issues`（GitHub のアカウントが必要です）」 | F-34・F-32 |
| 9 | ■ 注意 | 現行の3項目をそのまま残す | A-06 |
| 10 | ■ 保存するデータ | 4.3 節「読むもの・保存するもの」と同一の文（`**` の強調はプレーンテキストに合わせて【】などに置き換えてよい。文そのものは変えない）。ただし「このページの『保存したチャットをすべて削除』」は「設定画面（⚙）の『保存したチャット』の『保存したチャットをすべて削除』」と読み替える（指す場所が違うため。**この1語句だけが options.html との差**） | F-22・F-44 |
| 11 | ■ ライセンス | **#7(a) の回答待ち**（8.1 節）。回答までは節を作らない | F-50 |

- 文字コードは UTF-8。現行ファイルの先頭に BOM がある（`cat -n` で確認）。BOM は残しても消してもよいが、変えるなら詳細設計で明記する。
- 「hlx-ext」は1か所も残さない（A-01）。

### 4.6 README.md の構成（F-05、F-10、F-11(a)、F-40、F-41）— **編集担当は #7(c) の回答待ち**
| 順 | 節 | 内容 |
|---|---|---|
| 1 | 見出しと説明 | 現行の1〜4行目（製品の説明）を保つ |
| 2 | 注意（引用ブロック） | 4.1 節の3文。導入手順より前に置く（A-05） |
| 3 | 姉妹製品 | 現行どおり |
| 4 | ## 使う | 3点だけ：①入手（`git clone` または「Code → Download ZIP」）②`chrome://extensions` でデベロッパーモードをオンにし、`extension` フォルダを読み込む ③入れ方・更新・使い方・保存するデータの詳細は [extension/README.txt](extension/README.txt)。手順の本体は書かない（F-41） |
| 5 | ## 不具合の連絡 | Issue への1行（任意。README.txt と重複するので1行に留める） |
| 6 | ## ライセンス | #7(a) の回答どおり（8.1 節） |
| 7 | ## 開発・運用の体制、## テスト | 現行どおり |

## 5. データ（入力・出力・保存）
### 5.1 保存キーと開示の対応（A-10。コードで確認）
| 保存領域 | キー | 中身（コードの実際） | 書く処理 | 消す操作 | 開示の文での言い方 |
|---|---|---|---|---|---|
| `chrome.storage.local` | `chat_<動画ID>` | `{ info, items, at }`（content.js 169〜170 行） | 解析で取得したとき（キャッシュが無い、または「再取得」） | 「保存したチャットをすべて削除」（options.js 60 行） | 下の3行 |
| 〃 | 　└ `info` | `{ id: 動画ID, title: タイトル, channel: 配信者名（videoDetails.author）, duration: 長さ（秒）, heatmap: [{start_time, end_time, value}] }`（fetcher.js 130〜136 行） | 同上 | 同上 | 「解析した配信の情報（動画ID・タイトル・配信者名・長さ・『よく再生された部分』のデータ）」 |
| 〃 | 　└ `items` | `[[時刻（秒、丸めない）, 種別 0/1/2, 本文]]`。種別2（メンバー系）は本文 `''`。視聴者名・チャンネルID・アイコン・金額は取り出していない（fetcher.js 80〜103 行） | 同上 | 同上 | 「解析した配信ごとのチャット（コメントの本文・時刻・種別）。メンバー系は本文を保存しません」「保存しないもの：…名前・チャンネル・アイコン・スーパーチャットの金額」 |
| 〃 | 　└ `at` | `Date.now()`（保存した時刻、ミリ秒） | 同上 | 同上 | 「保存した日時」 |
| 〃 | `seen_<動画ID>` | 確認済みにした見どころの開始秒の配列（content.js 229〜231 行） | リストの時刻を押したとき | 「保存したチャットをすべて削除」 | 「『確認済み』にした見どころの印」 |
| `chrome.storage.sync` | `hlxSettings` | `{ minSpeed, binSec, topN, leadSec, keywords }`（options.js 32〜39 行） | 設定画面の「保存」 | 「初期設定に戻す」（options.js 45 行） | 「設定（候補の出やすさ、集計の細かさ、候補の最大数、何秒前から再生するか、検知するワード）」「同期を有効にしている場合…同期されることがあります」 |
| `chrome.storage.local` | `hlxNoticeAck`（**新規**） | 数値 `1`（確認した案内の版。日時などほかの情報は持たない） | 初回案内の「確認しました」 | どの操作でも消さない（「すべて削除」の対象は `chat_`・`seen_` で始まるキーだけ、「初期設定に戻す」は sync の `hlxSettings` だけ） | 「はじめの案内を確認したという記録」「設定と、はじめの案内を確認した記録は消えません」 |

- 上の5種類以外に `chrome.storage`・`localStorage`・`sessionStorage`・IndexedDB を使う箇所は extension/ に無い（grep で確認）。
- 新キーの名前の決め方：既存の `hlxSettings` と同じ `hlx` の接頭辞。`chat_`・`seen_` で始めない（F-24）ので、「すべて削除」の絞り込み（`startsWith('chat_') || startsWith('seen_')`）に掛からない。`options.js` の件数表示（`chat_` で始まるキーの数）にも数えられない。
- 「すべて削除」で消さない理由：消すと案内が毎回出直して邪魔になる（REQ F-24 の推奨）。完全に消したい人には、拡張機能そのものの削除を案内する（消えるかは未確認なので断定しない）。
- 保存の量：数値1つで、`unlimitedStorage` の見直し（範囲外の E）に影響しない。

### 5.2 入力・出力
| 区分 | 内容 |
|---|---|
| 入力 | 変更なし（YouTube の動画ページとチャットリプレイ）。追加は `hlxNoticeAck` の読み出しのみ |
| 出力（画面） | 初回案内（パネル内）、設定画面の開示、エラー文の一文 |
| 出力（文書） | README.txt、README.md（#7(c) 待ち）、LICENSE（#7(a) 待ち） |
| 出力（コンソール） | 想定外のエラーのときだけ `console.error` に詳細（開発者向け。利用者の画面には出さない） |

## 6. 外部依存（ライブラリ・YouTube・OS）
| 区分 | 内容 |
|---|---|
| ライブラリ | 追加なし（`extension/` は自作のファイルのみ。F-51） |
| YouTube | 通信先・要求の中身は変えない（`fetch` は fetcher.js の3か所のまま、すべて `location.origin` 宛て、`credentials: 'omit'`）。案内・開示のための通信は無い |
| Chrome API | `chrome.storage.local` の get/set（既存の権限 `storage` の範囲）。`chrome.storage.onChanged`（既存の受け手に条件を足す）。権限の追加なし |
| GitHub | README の説明（clone・ZIP・Issue）。拡張機能のコードからは GitHub へ通信しない |
| OS | 手順は `git clone` と `chrome://extensions` で書き、OS に依存しない書き方にする（REQ 4章） |

## 7. 詳細設計係への申し送り
### 7.1 変更ファイルと担当（1ファイル1係）
| ファイル | 担当係 | 変更の要点 | #7 依存 |
|---|---|---|---|
| `extension/fetcher.js` | Model係（`chrome-dev-model`） | `HLX_SPEC_CHANGE_TAIL`・`HLX_SPEC_CHANGE_NOTE` の定数、目印付きエラーの補助関数、7か所の throw の置き換えと4.4 節の追記 | なし |
| `tests/unit/fetcher.test.js` | Model係 | A-13〜A-15 のテスト追加（7.2 節） | なし |
| `extension/viewmodel/videoid.js` | ViewModel係（`chrome-dev-viewmodel`） | `HLX_NOTICE_KEY`・`HLX_NOTICE_VERSION`・`hlxShouldShowNotice`・`hlxErrorStatus` の追加。冒頭のコメントに「パネルの ViewModel の関数も置く（BD-0001 D-1。manifest を変えられないため）」と書く | なし |
| `tests/unit/` の ViewModel のテスト | ViewModel係 | `hlxShouldShowNotice`・`hlxErrorStatus` のテスト。既存の `videoid.test.js` に足すか新しいファイルにするかは詳細設計で決める（新しいファイルなら fetcher.js と videoid.js を同じ環境に読み込む） | なし |
| `extension/content.js` | View係（`chrome-dev-view`） | 初回案内の要素・表示判断の呼び出し・閉じる操作・保存、`onChanged` の条件追加（推奨）、`start()` の catch を `hlxErrorStatus` 経由に | なし |
| `extension/panel.css` | View係 | `.hlx-notice` 一式 | なし |
| `extension/options.html` | View係 | 4.3 節の開示（静的な文）と、その見た目（既存の CSS 変数） | なし |
| `extension/README.txt` | View係 | 4.5 節の構成 | 1行目の版数（8.2）、■ライセンス（8.1） |
| `tests/e2e/test_extension_e2e.py` | View係 | 初回案内の E2E を1件追加（7.2 節）。既存2件は変えない（通らないときだけ閉じる手順を足す） | なし |
| `extension/manifest.json` | View係 | `version` だけ（8.2 節）。それ以外の行は変えない | **あり** |
| `README.md` | 未定（#7(c)） | 4.6 節の構成 | **あり** |
| `LICENSE` | 未定（#7(c)） | 8.1 節 | **あり** |
| `extension/options.js`・`analyzer.js`・`background.js`・`shared/**` | ― | 変更なし | ― |

作業の順：定数と関数の名前は本書で決めたので、3係は並行して進められる。結合して動くのは Model（定数）→ ViewModel（関数）→ View（呼び出し）の順に揃ったとき。

### 7.2 テストの観点
単体（Model係、`fetcher.test.js`）：
- 126：watch の HTML に `ytInitialData` が無い → reject の文が「ページ情報を読み取れませんでした」と「仕様変更」の両方を含む。
- 142：`withChat: false` → 「チャットリプレイがありません」と「どれでもないのに出る場合は」と「仕様変更」を含む。既存の正規表現 `/チャットリプレイがありません/` も通る。
- 145：`liveChatRenderer` に `continuations` が無い → 「読み込み口が見つかりませんでした」＋「仕様変更」。
- 185：取得 API が `ok: false, status: 403` → 「エラー 403」＋「仕様変更」。
- 187：取得 API の `fetch` が5回とも例外（または 503）→ 「応答がありません」＋「仕様変更」。`fetcher.js` は 1.5〜2 秒×回数の待ちを入れるので、`loadExtension({ setTimeout: (f) => f(), ... })` のように即時の `setTimeout` を渡して待たない（`_load.js` は globals で `setTimeout` を上書きできる。確認済み）。
- 129・141：「仕様変更」を**含まない**こと、文言が現行と完全に同じこと。
- 7か所すべてのエラーに目印（`hlxUser === true`）が付いていること。

単体（ViewModel係）：
- `hlxShouldShowNotice`：`undefined`→真、`1`→偽、`2`→偽、`0`→真、`'1'`（文字列）→詳細設計で決める（数値に直して比べるなら偽）、`null`・オブジェクト→真。
- `hlxErrorStatus`：目印付きのエラー→その文・`unexpected: false`。目印なしの `Error('Cannot read properties of undefined')`→定型文・`unexpected: true`。定型文が `HLX_SPEC_CHANGE_NOTE` を含む。`null`・文字列・目印付きだが `message` が空→定型文。
- `videoid.js` だけを空の環境で読み込んでも例外にならない（既存の `videoid.test.js` の読み込み方。N-2）。

E2E（View係）：
- 新規1件：新しいプロファイルで動画ページ → 「見どころ」→ `.hlx-notice` が見える → `.hlx-primary` が押せて解析が `done` になる（A-07）→ 「確認しました」→ 案内が消える → ページを再読み込み → 「見どころ」→ `.hlx-notice` が見えない（A-08）。
- 既存2件は、新しいプロファイル（案内が出たまま）で修正なしに通ることを確かめる。これが「案内が出ていても解析ボタンが押せる」ことの確認にもなる。
- 任意：拡張機能が出す要求の宛先を記録し、youtube.com だけであることを確かめる（A-18）。

手動（運用係・品質保証課）：A-02・A-03（clone と ZIP からの読み込み）、A-09（設定画面の明暗）、A-10・A-12（DevTools でキーの確認、削除前後）、A-16（想定外の例外。例：DevTools で一時的に例外を起こす手順を詳細設計で決める）。

文書：A-01（`grep hlx-ext`）、A-04〜A-06、A-11（禁止表現の grep）、A-22、A-23。

### 7.3 注意（実装で壊しやすい点）
- **N-1** `tests/unit/fetcher.test.js` の既存の照合は部分一致の正規表現（`/配信中/`、`/チャットリプレイがありません/`、`/未ログインでは見られない/`）。全文一致のテストは無い（確認済み）。追記は既存の文の後ろに足すので通る見込み。
- **N-2** `videoid.js` の最上位で fetcher.js の定数（`HLX_SPEC_CHANGE_NOTE`）を参照しない。関数の中でだけ参照する。既存の `videoid.test.js` は `vm.createContext({})` に `videoid.js` だけを読み込む。
- **N-3** 初回案内の要素に `hlx-btn`・`hlx-primary` を付けない。E2E は `pg.click(".hlx-primary")`（最初に一致する要素を押す）で解析を始める。
- **N-4** 案内はパネルの通常の流れに置く。重ね表示（`position: fixed/absolute` で覆う）にしない。既存 E2E のグラフのクリックはグラフの位置を `bounding_box` で取ってから押すので、案内でグラフが下にずれても、パネル（高さ `100vh - 56px`、E2E のビューポート 1000px）の中に収まっていれば影響しない見込み。案内の高さは 250px 程度までに抑える（見込みの計算：見出し約 60px＋案内＋状態表示約 30px＋グラフ部分約 200px が 944px に収まる）。E2E で確かめること。
- **N-5** `store.get` の読み出しを `await` して `onNav()` や解析の開始を待たせない（REQ 4章の処理時間）。
- **N-6** 案内のボタンを押したときの処理で例外を投げない（E2E は `pageerror` が0件であることを確かめている）。
- **N-7** 「中止しました。」「コメントが1件も見つかりませんでした。」は例外の経路を通らないので変えない。
- **N-8** 想定外のときの `console.error` は利用者の画面に出ない。E2E の `pageerror` にも数えられない（`pageerror` は捕まえられなかった例外だけ）。

### 7.4 未確認事項
| No | 内容 | 扱い |
|---|---|---|
| U-1 | ZIP を解凍したときの実際のフォルダ名（REQ 8章(3)） | README.txt は断定しない。運用係が A-03 の確認時に記録 |
| U-2 | 拡張機能の削除、unpacked のフォルダの移動・再読み込みで保存データがどうなるか（REQ 8章(4)） | 開示・README.txt に書かない。運用係または品質保証課が確認 |
| U-3 | 案内を足したあとのパネルの実際の高さと、既存 E2E が修正なしで通るか（N-4） | E2E で確認 |
| U-4 | 実際の通信先の実測（REQ 8章(5)） | A-18 はコードレビューで確認。E2E での記録は任意 |
| U-5 | 状態表示の長いエラー文の折り返しの見え方 | 手動で確認。読みにくければ View係がパネルの CSS で調整（文は変えない） |
| U-6 | 公開文言（4.1〜4.4 節）の社長の確認（REQ 7.3、#7） | 確認で文が変わったら、3か所を同時に直す |

## 8. 社長判断待ち #7 の回答待ちの部分
以下は #7 の回答が出るまで実装しない（またはその部分だけ残して先に進める）。それ以外の節は回答に依存しない。

### 8.1 (a) LICENSE の有無と README のライセンス表記（推奨：MIT）
| 回答 | 対応 |
|---|---|
| MIT を採用 | リポジトリ直下に `LICENSE`（MIT の標準の文。著作権者名と年は社長の回答どおり）を置く。README.md に「## ライセンス：MIT（[LICENSE](LICENSE)）」、README.txt の末尾に「■ ライセンス：MIT ライセンスです。全文はリポジトリ直下の LICENSE にあります」。`extension/` には置かない（clone・ZIP でリポジトリ全体が入るため。置くかは回答時に再検討） |
| 付けない | `LICENSE` を置かない。README.md・README.txt はライセンスの節を作らず、4.1 節の「無保証・自己責任」の注意だけにする（F-50）。A-23 の「ライセンス無しの注意」として「ライセンスは定めていません」の1文を README.md と README.txt の両方に足すかは、回答時に社長に合わせて決める |
| その他 | 回答の内容で本節を書き直す（設計課に戻す） |
- いずれの場合も `shared/` は変えない。姉妹製品との整合（F-52）は部長経由で確認。

### 8.2 (b) manifest の version と README.txt の版数（推奨：1.2.1）
| 回答 | `manifest.json` | README.txt の1行目 |
|---|---|---|
| 1.2.1 に上げる | `"version": "1.2.1"`（この1行だけ変える） | `ver 1.2.1` |
| 上げない | 変更なし（`1.2.0`） | `ver 1.2.0`（現行の「ver 1.2」を3桁にそろえる） |
- 2つの変更は同じコミットで行う（A-22）。版数の更新はリリースに当たるので、PR のマージは社長の承認後（REQ 7.2）。

### 8.3 (c) README.md と LICENSE の担当係（推奨：View係に追加）
- 現状、`README.md` と `LICENSE` は `.claude/hooks/ownership.json` のどの役割の持ち場にも無い（確認済み）。
- 推奨：View係（`chrome-dev-view`）の持ち場に `README.md` と `LICENSE` を足す。理由：利用者向けの説明書 `extension/README.txt` と同じ係が持つと、F-41（同じ内容を2か所に詳しく書かない）と 4.1 節の文の一致を1人で守れる。
- 回答までは 4.6 節（README.md）と 8.1 節の LICENSE は着手しない。ほかの変更（コード・README.txt）は先に進めてよい。
