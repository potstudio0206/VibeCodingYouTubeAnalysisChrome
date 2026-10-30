---
id: DD-0001
title: GitHub 配布の体裁整備（導入手順・自己責任の明示・保存データの開示・エラー案内・説明書の整理）詳細設計
status: approved
author: chrome-design-detail
reviewer: chrome-design-kacho
basic_design: BD-0001
updated: 2026-10-30
---
# DD-0001 GitHub 配布の体裁整備 詳細設計

## 0. 前提と確かめた範囲
- 入力：BD-0001（approved）、REQ-0001（approved）。現行コード `extension/fetcher.js`・`viewmodel/videoid.js`・`content.js`・`panel.css`・`options.html`・`options.js`・`README.txt`・`manifest.json`・`analyzer.js`（定数の宣言の確認のみ）、リポジトリ直下 `README.md`、`tests/unit/_load.js`・`fetcher.test.js`・`videoid.test.js`、`tests/e2e/test_extension_e2e.py`、`.claude/hooks/ownership.json`、`.gitattributes` を 2026-10-30 に読んだ。
- 本書の「確認」はコードを読んだこと。実行（単体・E2E・実機）はしていない。見込みは「見込み」と書く。
- 行番号は 2026-10-30 時点（BD-0001・REQ-0001 の行番号と一致することを確認）。実装では、行番号より「変更前の全文」を正として置き換える。
- 文字コード・改行（`file` コマンドで確認）：`extension/` の js・html・css は UTF-8（BOM なし）・作業ツリーでは CRLF。`README.txt` だけ UTF-8 **BOM あり**・CRLF。`.gitattributes` は `* text=auto`（リポジトリ内は LF で保存される）。本件で文字コード・改行の扱いは変えない（4.5 節）。
- content script の間で、最上位の `const` は共有される（`content.js` が `analyzer.js` の `const HLX_DEFAULTS` を使っていることで確認）。本書の名前の受け渡し（5章）はこの前提による。

## 1. 変更するファイルと担当
### 1.1 #7 の回答に依存しない（すぐ着手してよい）
| ファイル | 層 | 担当（係） | 変更の内容 | 本書の節 |
|---|---|---|---|---|
| `extension/fetcher.js` | Model | Model係（`chrome-dev-model`） | 定数 `HLX_SPEC_CHANGE_TAIL`・`HLX_SPEC_CHANGE_NOTE`、補助関数 `hlxUserError` を追加。throw 7か所を置き換え | 2章 |
| `tests/unit/fetcher.test.js` | Model（テスト） | Model係 | エラー文と目印のテストを追加（7章 T-M1〜T-M9） | 7章 |
| `tests/unit/_load.js` | Model（テスト補助） | Model係 | `loadExtension` が返すオブジェクトに `hlxUserError`・`HLX_SPEC_CHANGE_TAIL`・`HLX_SPEC_CHANGE_NOTE` を足す（1行の変更） | 2.4 節 |
| `extension/viewmodel/videoid.js` | ViewModel | ViewModel係（`chrome-dev-viewmodel`） | 冒頭コメントの追記、`HLX_NOTICE_KEY`・`HLX_NOTICE_VERSION`・`HLX_UNEXPECTED_ERROR_BASE`・`hlxShouldShowNotice`・`hlxErrorStatus` を追加 | 3章 |
| `tests/unit/panel_viewmodel.test.js`（**新規**） | ViewModel（テスト） | ViewModel係 | `hlxShouldShowNotice`・`hlxErrorStatus` のテスト（7章 T-V1〜T-V8）。読み込みはこのファイルの中で行い、`_load.js` は使わない | 3.5 節 |
| `tests/unit/videoid.test.js` | ― | ―（変更なし） | 変更しない。既存の単独読み込みのテストが、そのまま N-2 の確認になる | ― |
| `extension/content.js` | View | View係（`chrome-dev-view`） | 初回案内の要素・表示判断・閉じる操作・保存、`onChanged` の条件追加、`start()` の catch の置き換え | 4.1 節 |
| `extension/panel.css` | View | View係 | `.hlx-notice` 一式を追加 | 4.2 節 |
| `extension/options.html` | View | View係 | 「保存したチャット」の項に開示（静的な文）とその見た目を追加 | 4.3 節 |
| `extension/README.txt` | View | View係 | 4.5 節の全文に置き換え（1行目の版数は `ver 1.2.1`。1.3 節） | 4.5 節 |
| `tests/e2e/test_extension_e2e.py` | View（テスト） | View係 | 初回案内の E2E と想定外エラーの E2E を追加。既存2件は変えない | 7章 |
| `extension/options.js`・`analyzer.js`・`background.js`・`icons/**`・`shared/**` | ― | ―（変更なし） | 変更しない | ― |

### 1.2 社長判断 #7 の回答による追加作業（2026-10-30 回答。すぐ着手してよい）
回答：A1 MIT ライセンス（著作権者名「なべさん」、年 2026）／B1 README.md・LICENSE は View係と開発課長の持ち場（ownership.json に追加済み、コミット b901c0a）／C1 版数を 1.2.1 に上げる（PR のマージは社長の再承認後）。BD-0001 8章。

| ファイル | 担当（係） | 変更の内容 | 本書の節 | #7 の項目 |
|---|---|---|---|---|
| `extension/manifest.json` | View係 | 4 行目 `"version": "1.2.0",` → `"version": "1.2.1",`。この1行だけ | 1.3 節 | C1 |
| `extension/README.txt` の1行目 | View係（1.1 節と同じ係・同じファイル） | `ver 1.2.0` → `ver 1.2.1`（manifest と同じコミットで） | 1.3 節 | C1 |
| `extension/README.txt` の末尾 | View係（同上） | 「■ ライセンス」節を追加 | 1.2.2 節 | A1 |
| `LICENSE`（リポジトリ直下、**新規**） | View係 | MIT の全文 | 1.2.1 節 | A1・B1 |
| `README.md`（リポジトリ直下） | View係 | 1.2.3 節の全文に置き換え | 1.2.3 節 | A1・B1 |

- 開発課長も `README.md`・`LICENSE` の持ち場に入っているが、本件で編集するのは View係だけ（1ファイル1係）。開発課長はレビューする。
- 同じブランチ（feat/license-version）で行う。上の5つは1つの PR にまとめる。

#### 1.2.1 `LICENSE`（新規）
- 置き場所：リポジトリ直下（`README.md` と同じ階層）。ファイル名は拡張子なしの `LICENSE`。`extension/` には置かない（BD 8.1）。
- 文字コード：UTF-8（BOM なし）。改行は `.gitattributes` の `* text=auto` に任せる（リポジトリ内は LF）。末尾に改行1つ。
- 条文は MIT ライセンスの標準の英文を**1文字も変えずに**使う（GitHub のライセンス自動判別のため。訳さない・言い回しを変えない）。変えるのは著作権の行の年と名前だけ。全文は次のとおり。

```text
MIT License

Copyright (c) 2026 なべさん

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
- 例外として英文の書類になる（CLAUDE.md 13章の「書類は日本語」の例外。ライセンスの条文は原文が正のため）。日本語の説明は README.md・README.txt のライセンスの節に書く。

#### 1.2.2 `extension/README.txt` の「■ ライセンス」節
4.5.2 節の全文の末尾（「■ 保存するデータ」の【削除】の行）の後ろに、空行1つを置いて次の2行を足す。

```text
■ ライセンス
MIT ライセンスです（Copyright (c) 2026 なべさん）。全文はリポジトリ直下の LICENSE にあります。
```
- 文字コード・BOM・改行は 4.5.1 節のまま（UTF-8 BOM あり、作業ツリーで CRLF）。末尾に改行1つ。

#### 1.2.3 `README.md`（この全文に置き換える）
- 文字コード：UTF-8（BOM なし。今と同じ）。改行は今と同じ（作業ツリーで CRLF。リポジトリ内は LF）。
- 「開発・運用の体制」「テスト」の節は今の文を1文字も変えない。
- 注意の引用ブロックは、1文ずつ段落に分ける（`>` だけの行をはさむ。Markdown では行末の改行だけでは1段落につながるため）。

````markdown
# VibeCodingYouTubeAnalysisChrome

YouTube配信アーカイブのページで、チャットから盛り上がった場面を見つける Chrome 拡張機能 **in Chrome版** です。
コメント量・加速度・同じコメントの割合をタイムライン（ヒートマップ／折れ線）で表示し、クリックでその場面へジャンプ、再生位置やシークバーとも連動します。

> **ご注意（はじめにお読みください）**
>
> この拡張機能は、YouTube・Google とは関係のない、非公式のものです。YouTube や Google が提供・承認したものではありません。
>
> チャットは YouTube の非公開の内部の仕組みで読み込んでいるため、YouTube 側の仕様変更で、予告なく動かなくなることがあります。
>
> 無保証です。ご利用は自己責任でお願いします。切り抜きの際は、配信者の切り抜きガイドラインを確認してください。
>
> 入れ方・使い方・保存するデータの説明は [extension/README.txt](extension/README.txt) にあります。

姉妹製品：[in App版（PCツール）](https://github.com/potstudio0206/VibeCodingYouTubeAnalysisApp)

## 使う
1. 入手する：`git clone https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome.git`、またはこのページの「Code」→「Download ZIP」でダウンロードして解凍します。
2. Chrome の `chrome://extensions` でデベロッパーモードをオンにし、「パッケージ化されていない拡張機能を読み込む」でリポジトリ直下の `extension` フォルダを読み込みます。
3. 入れ方・更新のしかた・使い方・保存するデータの詳細は [extension/README.txt](extension/README.txt) を読んでください。

## 不具合の連絡
[Issue](https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome/issues) で知らせてください（GitHub のアカウントが必要です）。

## ライセンス
[MIT ライセンス](LICENSE)です（Copyright (c) 2026 なべさん）。

## 開発・運用の体制
（今の「## 開発・運用の体制」の節をそのまま）

## テスト
（今の「## テスト」の節をそのまま。コードブロックを含む）
````
- 「（今の…をそのまま）」の2か所は、現行の README.md の該当の節の本文を**1文字も変えずに**置く（括弧書きを残さない）。
- 注意の4文のうち最初の3文は BD 4.1 節の正本と同じ（初回案内・README.txt「■ はじめに」・options.html と一致させる。D-4）。
- 「使う」は手順の本体を書かない（F-41）。clone の URL と `extension` フォルダは README.txt と同じ。
- 禁止表現（DC-06）を含まない。外部の画像・バッジを足さない。

### 1.3 版数（#7 C1：1.2.1 に上げる）
- `extension/manifest.json` の `"version"` と `extension/README.txt` の1行目を、**同じコミットで** `1.2.1` にする（BD 8.2、A-22）。
  - manifest：`  "version": "1.2.0",` → `  "version": "1.2.1",`（字下げ・カンマはそのまま。ほかの行は変えない）。
  - README.txt：`配信 盛り上がり検知 in Chrome（Chrome拡張機能） ver 1.2.0` → `配信 盛り上がり検知 in Chrome（Chrome拡張機能） ver 1.2.1`（先頭の BOM はそのまま）。
- 版数を表す文字列は、extension/ の中ではこの2か所だけ（grep で確認。tests/ には無い）。
- 版数の更新はリリースに当たるため、PR のマージは社長の再承認後（#7 C1）。

### 1.4 作業の順と結合
- 3係は並行して進めてよい（名前と形は本書で確定）。
- 結合して動くのは Model（定数・`hlxUserError`）→ ViewModel（`hlxErrorStatus` ほか）→ View（呼び出し）がそろったとき。View係の E2E は3係の変更がすべて入った状態で実行する。
- View係が先に終わった場合、`hlxErrorStatus`・`hlxShouldShowNotice`・`HLX_NOTICE_KEY` が未定義だと content.js が起動時に ReferenceError になる。**3係の変更は1つの PR にまとめてからマージする**（部分的なマージをしない）。

## 2. Model（`extension/fetcher.js`、Model係）
### 2.1 追加する定数と関数
置き場所：105 行 `const hlxSleep = ...;` の直後（106 行の空行の前）に、次の9行（前後の空行を含む）を挿入する。1〜105 行は変えない。

```js

// 利用者向けのエラー（BD-0001 3.2）。目印 hlxUser を付け、content.js が ViewModel の hlxErrorStatus で想定外のエラーと区別する
const HLX_SPEC_CHANGE_TAIL = 'YouTube 側の仕様変更で読み取れなくなっている可能性があります。';
const HLX_SPEC_CHANGE_NOTE = '何度か試しても同じ場合は、' + HLX_SPEC_CHANGE_TAIL;
function hlxUserError(message) {
  const e = new Error(message);
  e.hlxUser = true;
  return e;
}
```

| 関数・データ | 入力 | 出力 | 説明（例） |
|---|---|---|---|
| `HLX_SPEC_CHANGE_TAIL` | ― | 文字列 `'YouTube 側の仕様変更で読み取れなくなっている可能性があります。'` | 追記文の共通の末尾。142 行だけはこれを直接使う |
| `HLX_SPEC_CHANGE_NOTE` | ― | 文字列 `'何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。'` | 126・145・185・187 行の追記、ViewModel の想定外の定型文で使う。REQ 付録A.3 と同じ文 |
| `hlxUserError(message)` | `message`：文字列（利用者向けの日本語の文） | `Error` の実体（`message` は入力のまま、`hlxUser === true`）。**投げずに返す**（呼ぶ側が `throw hlxUserError(...)` と書く） | 例：`hlxUserError('配信中は…')` → `e instanceof Error === true`、`e.message === '配信中は…'`、`e.hlxUser === true`。`hlxUserError('')` → `message === ''`・`hlxUser === true`（本件では空文字で呼ぶ箇所は無い） |

決めたこと：
- **目印は `Error` に足すプロパティ `hlxUser`（値は真偽値 `true`）とし、派生クラスにしない。** 理由：単体テストは `vm` の別の環境で読み込むため、`instanceof` による判定は環境をまたぐと偽になる。プロパティの判定なら環境に依存しない。ViewModel も `instanceof` を使わずプロパティだけで判定する（3.3 節）。
- 定数は `const`（既存の `HLX_KIND` と同じ書き方）。`var`・`window.` への代入にしない。
- `'__aborted__'` の中断エラー（115 行）は変えない。目印を付けない。

### 2.2 throw 7か所の変更（変更前 → 変更後の全文）
行番号は変更前のもの。2.1 節の挿入で、挿入以降の行は9行ずれる（変更後の行番号の見込みを括弧で示す）。各行の行頭の字下げは変えない。

| 行（変更後の見込み） | 変更前 | 変更後 |
|---|---|---|
| 126（135） | `  if (!data) throw new Error('ページ情報を読み取れませんでした。ページを再読み込みしてからもう一度お試しください。');` | `  if (!data) throw hlxUserError('ページ情報を読み取れませんでした。ページを再読み込みしてからもう一度お試しください。' + HLX_SPEC_CHANGE_NOTE);` |
| 129（138） | `  if (vd.isLive) throw new Error('配信中は解析できません。配信が終わってアーカイブになってから実行してください。');` | `  if (vd.isLive) throw hlxUserError('配信中は解析できません。配信が終わってアーカイブになってから実行してください。');` |
| 141（150） | `    if (ps && ps !== 'OK') throw new Error('この動画は未ログインでは見られないため解析できません（メンバー限定・年齢制限など）。');` | `    if (ps && ps !== 'OK') throw hlxUserError('この動画は未ログインでは見られないため解析できません（メンバー限定・年齢制限など）。');` |
| 142（151） | `    throw new Error('この動画にはチャットリプレイがありません（通常の動画、チャット無効、またはアーカイブ処理中）。');` | `    throw hlxUserError('この動画にはチャットリプレイがありません（通常の動画、チャット無効、またはアーカイブ処理中）。通常の動画・チャット無効・処理中のどれでもないのに出る場合は、' + HLX_SPEC_CHANGE_TAIL);` |
| 145（154） | `  if (!cont) throw new Error('チャットリプレイの読み込み口が見つかりませんでした。');` | `  if (!cont) throw hlxUserError('チャットリプレイの読み込み口が見つかりませんでした。' + HLX_SPEC_CHANGE_NOTE);` |
| 185（194） | ``      throw new Error(`YouTubeからの取得に失敗しました（エラー ${r.status}）。`);`` | ``      throw hlxUserError(`YouTubeからの取得に失敗しました（エラー ${r.status}）。` + HLX_SPEC_CHANGE_NOTE);`` |
| 187（196） | `    throw new Error('YouTubeからの応答がありません。少し時間をおいて再試行してください。');` | `    throw hlxUserError('YouTubeからの応答がありません。少し時間をおいて再試行してください。' + HLX_SPEC_CHANGE_NOTE);` |

### 2.3 変更後に利用者に見える文（`e.message` の全文。BD 4.4 と一致）
| 行 | `e.message` | `hlxUser` | 「仕様変更」を含む |
|---|---|---|---|
| 126 | ページ情報を読み取れませんでした。ページを再読み込みしてからもう一度お試しください。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 | true | 含む |
| 129 | 配信中は解析できません。配信が終わってアーカイブになってから実行してください。 | true | 含まない（文言は現行と完全に同じ） |
| 141 | この動画は未ログインでは見られないため解析できません（メンバー限定・年齢制限など）。 | true | 含まない（同上） |
| 142 | この動画にはチャットリプレイがありません（通常の動画、チャット無効、またはアーカイブ処理中）。通常の動画・チャット無効・処理中のどれでもないのに出る場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 | true | 含む |
| 145 | チャットリプレイの読み込み口が見つかりませんでした。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 | true | 含む |
| 185 | YouTubeからの取得に失敗しました（エラー 403）。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。（例：status 403） | true | 含む |
| 187 | YouTubeからの応答がありません。少し時間をおいて再試行してください。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。 | true | 含む |

- 上の7か所以外で `hlxFetchChat` が reject するもの（目印なし＝想定外）：121 行の `fetch` の失敗（`TypeError`）、122 行の `res.text()` の失敗、181 行の `r.json()` の失敗（`SyntaxError`）、中断の `'__aborted__'`。これらは変えない。
- `fetch(` の数は 3 のまま（121・166・198 行。2.1 節の挿入後は 130・175・207 行の見込み）。

### 2.4 `tests/unit/_load.js` の変更（Model係）
17〜18 行の返すオブジェクトに3つの名前を足す。
- 変更前：`;this.__ext = { hlxAnalyze, hlxFmt, hlxNormalize, hlxParseKeywords, HLX_DEFAULTS,` ／ `  hlxCollect, hlxFetchChat, hlxExtractVar, hlxExtractHeatmap, hlxRunsToText };`
- 変更後：`;this.__ext = { hlxAnalyze, hlxFmt, hlxNormalize, hlxParseKeywords, HLX_DEFAULTS,` ／ `  hlxCollect, hlxFetchChat, hlxExtractVar, hlxExtractHeatmap, hlxRunsToText,` ／ `  hlxUserError, HLX_SPEC_CHANGE_TAIL, HLX_SPEC_CHANGE_NOTE };`
- 読み込むファイル（`analyzer.js`・`fetcher.js`）と `globals` の扱いは変えない。`globals.setTimeout` で `setTimeout` を差し替えられること（12 行 `{ console, setTimeout, clearTimeout, ...globals }`）は既存のまま使う。

## 3. ViewModel（`extension/viewmodel/videoid.js`、ViewModel係）
### 3.1 状態・コマンド・表示用データ
- 本件で ViewModel に足すのは**純粋関数と定数だけ**。状態（変数）は持たない。DOM・`chrome.*`・`console`・`location` に触らない。
- 案内の表示状態とエラー表示の状態は View（content.js）が持つ（BD D-2）。

### 3.2 ファイルの全体（変更後）
既存の1〜14 行は変えない。冒頭コメント（1〜2 行）の後ろに1行足し、14 行の後ろに追記する。

```js
// 動画IDの取り出し（ViewModel）：URLの pathname と search から動画IDを求める純粋関数。
// DOM・location には触らない。対象は /watch?v=ID と /live/ID のみ。
// パネルの ViewModel の関数（初回案内の判断、エラー表示の選択）もここに置く（BD-0001 D-1。manifest の content_scripts を変えられないため）。
'use strict';

function hlxVideoIdFromUrl(pathname, search) {
  … 既存の 6〜13 行のまま …
}

// ---------- 初回案内（BD-0001 3.1） ----------
const HLX_NOTICE_KEY = 'hlxNoticeAck';
const HLX_NOTICE_VERSION = 1;

/** 保存された既読の値から、初回案内を出すかを返す。数値の型で HLX_NOTICE_VERSION 以上のときだけ「出さない」 */
function hlxShouldShowNotice(stored) {
  return !(typeof stored === 'number' && Number.isFinite(stored) && stored >= HLX_NOTICE_VERSION);
}

// ---------- エラー表示（BD-0001 3.2） ----------
const HLX_UNEXPECTED_ERROR_BASE = '解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。';

/**
 * 解析で起きた例外から、状態表示に出す文を選ぶ。
 * fetcher.js の定数は関数の中でだけ参照する（このファイルだけを読み込んでも例外にしないため。BD-0001 N-2）
 */
function hlxErrorStatus(e) {
  if (e !== null && typeof e === 'object' && e.hlxUser === true
      && typeof e.message === 'string' && e.message.trim() !== '') {
    return { text: e.message, unexpected: false };
  }
  const note = typeof HLX_SPEC_CHANGE_NOTE === 'string' ? HLX_SPEC_CHANGE_NOTE : '';
  return { text: HLX_UNEXPECTED_ERROR_BASE + note, unexpected: true };
}
```

- **最上位（関数の外）で `HLX_SPEC_CHANGE_NOTE` を参照しない**（上のとおり `hlxErrorStatus` の中の `typeof` だけ）。`typeof` は未宣言の名前でも例外にならない。
- 名前の衝突がないこと：`HLX_NOTICE_KEY`・`HLX_NOTICE_VERSION`・`HLX_UNEXPECTED_ERROR_BASE`・`hlxShouldShowNotice`・`hlxErrorStatus` は、`analyzer.js`・`fetcher.js` の最上位の名前（grep で確認）と重ならない。content.js は即時関数の中なので衝突しない。

### 3.3 関数と定数の入出力
| 関数・データ | 入力 | 出力 | 規則 |
|---|---|---|---|
| `HLX_NOTICE_KEY` | ― | `'hlxNoticeAck'` | `chrome.storage.local` のキー名。`chat_`・`seen_` で始めない（F-24） |
| `HLX_NOTICE_VERSION` | ― | `1` | 案内の版。案内を大きく変えて全員に出し直すときだけ上げる |
| `HLX_UNEXPECTED_ERROR_BASE` | ― | `'解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。'` | 想定外の定型文の前半 |
| `hlxShouldShowNotice(stored)` | 何でも（`chrome.storage.local.get` の結果、または `onChanged` の `newValue`） | 真偽値 | **型が number で、有限で、`HLX_NOTICE_VERSION` 以上のときだけ `false`。それ以外はすべて `true`**。例外を投げない |
| `hlxErrorStatus(e)` | 何でも（`catch` で受けた値） | `{ text: 文字列, unexpected: 真偽値 }`（新しいオブジェクト。他のプロパティは無い） | 目印付き（`e.hlxUser === true`、`e.message` が空白以外を含む文字列）→ `{ text: e.message, unexpected: false }`。それ以外 → `{ text: HLX_UNEXPECTED_ERROR_BASE + HLX_SPEC_CHANGE_NOTE（未定義なら ''）, unexpected: true }`。例外を投げない |

`hlxShouldShowNotice` の例（境界値を確定）：
| 入力 | 出力 | 理由 |
|---|---|---|
| `undefined`（未保存・読み出し失敗） | `true` | 初回 |
| `1` | `false` | 確認済み |
| `2` | `false` | 新しい版で確認済み（版を下げた場合も出さない） |
| `1.5` | `false` | 数値として 1 以上 |
| `0`、`-1` | `true` | 古い版・壊れた値 |
| `'1'`（文字列） | `true` | **数値に直さない。** 書くのは常に数値 `1` なので、文字列は壊れた値として扱い、開示を出し直す側（安全側）に倒す |
| `NaN`、`Infinity` | `true` | `Number.isFinite` が偽 |
| `null`、`true`、`{}`、`[1]` | `true` | 型が number でない |

`hlxErrorStatus` の例（`NOTE` は `HLX_SPEC_CHANGE_NOTE` の値、`BASE` は `HLX_UNEXPECTED_ERROR_BASE` の値）：
| 入力 | 出力 |
|---|---|
| `hlxUserError('配信中は解析できません。…')`（fetcher.js が投げたもの） | `{ text: '配信中は解析できません。…', unexpected: false }` |
| `new Error('Cannot read properties of undefined (reading \'x\')')` | `{ text: BASE + NOTE, unexpected: true }` |
| `new TypeError('Failed to fetch')` | `{ text: BASE + NOTE, unexpected: true }` |
| `{ hlxUser: true, message: 'X' }`（Error でない普通のオブジェクト） | `{ text: 'X', unexpected: false }`（型は問わず、目印と文だけで判定する） |
| `hlxUserError('')`、`{ hlxUser: true, message: '   ' }` | `{ text: BASE + NOTE, unexpected: true }` |
| `{ hlxUser: 'true', message: 'X' }`（目印が文字列） | `{ text: BASE + NOTE, unexpected: true }` |
| `{ hlxUser: true, message: 123 }` | `{ text: BASE + NOTE, unexpected: true }` |
| `null`、`undefined`、`'文字列'`、`42` | `{ text: BASE + NOTE, unexpected: true }` |
| `new Error('__aborted__')` | `{ text: BASE + NOTE, unexpected: true }`（中断は View が先に除外するので、実際には渡らない） |
| 任意の入力で、**fetcher.js を読み込んでいない環境**（`videoid.js` だけ） | 想定外のときの `text` は `BASE` だけ（`NOTE` が付かない）。例外にならない。目印付きのときは変わらない |

- 本番（manifest の読み込み順 `analyzer → fetcher → viewmodel/videoid → content`）では `HLX_SPEC_CHANGE_NOTE` は常に定義されているので、想定外の文は常に `BASE + NOTE`（BD 4.4 の「想定外」の行と同じ全文）になる。`NOTE` が無い形は、単体テストで `videoid.js` だけを読み込んだときの安全策。
- 目印付きのときは `e.message` を**加工しない**（前後の空白も削らない）。判定にだけ `trim()` を使う。

### 3.4 想定外の文（全文）
`解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。`

### 3.5 ViewModel のテストファイル `tests/unit/panel_viewmodel.test.js`（新規、ViewModel係）
- 既存の `videoid.test.js` には足さない。理由：`videoid.test.js` は INC-0001 の回帰テスト（TS-0001）で、`videoid.js` だけを読み込む形を保ちたいため。新しいファイルは「fetcher.js と一緒に読み込む場合」と「videoid.js だけの場合」の両方を扱う。
- 読み込み方（このファイルの中に書く。`_load.js` は使わない＝Model係の持ち物に手を入れない）：
  - 結合あり：`fetcher.js` と `viewmodel/videoid.js` を**この順で**読み、`'\n;\n'` でつないで1回の `vm.runInContext` で実行し、最後に `;this.__vm = { hlxShouldShowNotice, hlxErrorStatus, HLX_NOTICE_KEY, HLX_NOTICE_VERSION, HLX_UNEXPECTED_ERROR_BASE, HLX_SPEC_CHANGE_NOTE, hlxUserError };` を足して取り出す。環境は `vm.createContext({})`（`fetch` などは不要。fetcher.js の最上位は宣言だけで、外部の名前を呼ばない）。
  - 単独：`viewmodel/videoid.js` だけを空の環境で読み、`hlxErrorStatus`・`hlxShouldShowNotice` を取り出す。
- vm の中で作られたオブジェクトは `assert.deepEqual` で比べにくい場合があるので、`JSON.parse(JSON.stringify(v))` で普通の値にしてから比べる（`_load.js` の `plain` と同じ考え方。このファイルの中に同じ1行の関数を書く）。
- テストの観点は 7章 T-V1〜T-V8。

## 4. View（View係）
### 4.1 `extension/content.js`
DOM の作り方は既存の流儀（小物 `el(tag, cls, text)` で `createElement` し、文字は `textContent`）に合わせる。**`innerHTML` を使わない。** 案内の文はすべて固定の文字列で、利用者の入力は入らない。

#### 4.1.1 変数の追加（42 行）
- 変更前：`  let fab, panel, statusEl, progWrap, progBar, progText, startBtn, cancelBtn, chartWrap, canvas, tipEl, toolbar, listEl, toast;`
- 変更後：`  let fab, panel, noticeEl, statusEl, progWrap, progBar, progText, startBtn, cancelBtn, chartWrap, canvas, tipEl, toolbar, listEl, toast;`
- 43 行の後ろに1行足す：`  let noticeDone = false;   // このページで案内が確認済みになったか（ボタン、または他のタブでの確認）`

#### 4.1.2 案内の要素を作る（`buildUI` の中）
- 62 行 `statusEl = el('div', 'hlx-status');` の**直前**に1行足す：`    noticeEl = buildNotice();`
- 122 行の並びに `noticeEl` を見出しの直後に入れる。
  - 変更前：`    panel.append(head, statusEl, progWrap, startBtn, cancelBtn, chartWrap, toolbar, listEl, toast);`
  - 変更後：`    panel.append(head, noticeEl, statusEl, progWrap, startBtn, cancelBtn, chartWrap, toolbar, listEl, toast);`
- `buildUI` の後ろ（124 行の `}` の後）に、次の3つの関数を足す。

```js
  // ---------- 初回案内（BD-0001 3.1・4.2） ----------
  function buildNotice() {
    const box = el('div', 'hlx-notice');
    box.hidden = true;                       // 既読の読み出しが終わるまで隠す
    box.setAttribute('role', 'note');
    const ok = el('button', 'hlx-notice-ok', '確認しました');
    ok.type = 'button';
    ok.addEventListener('click', ackNotice);
    box.append(
      el('div', 'hlx-notice-title', 'はじめにお読みください'),
      el('div', 'hlx-notice-text', '（本文1：下の表の全文）'),
      el('div', 'hlx-notice-text', '（本文2：下の表の全文）'),
      el('div', 'hlx-notice-text', '（本文3：下の表の全文）'),
      ok,
    );
    return box;
  }
  function hideNotice() {
    noticeDone = true;
    noticeEl.hidden = true;
  }
  function ackNotice() {
    hideNotice();
    store.set(HLX_NOTICE_KEY, HLX_NOTICE_VERSION);   // 待たない。失敗は store.set の中で握りつぶす（このページでは隠したまま）
  }
```

DOM 構造（できあがり）：
```
div.hlx-panel
  div.hlx-head（既存）
  div.hlx-notice[role=note][hidden]      ← 新規。見出しの直後、状態表示の前
    div.hlx-notice-title   はじめにお読みください
    div.hlx-notice-text    本文1
    div.hlx-notice-text    本文2
    div.hlx-notice-text    本文3
    button.hlx-notice-ok[type=button]   確認しました
  div.hlx-status（既存）
  …（既存のまま）
```
- クラス名は `hlx-notice`・`hlx-notice-title`・`hlx-notice-text`・`hlx-notice-ok` の4つ。**`hlx-btn`・`hlx-primary` を付けない**（BD N-3）。
- `p` 要素ではなく `div` を使う（YouTube のページの CSS が `p` に余白を付けていても影響を受けないように）。

文（BD 4.1・4.2 の正本のまま。1つの要素に1段落）：
| 部品 | `textContent` の全文 |
|---|---|
| 見出し | はじめにお読みください |
| 本文1 | この拡張機能は、YouTube・Google とは関係のない、非公式のものです。YouTube や Google が提供・承認したものではありません。チャットは YouTube の非公開の内部の仕組みで読み込んでいるため、YouTube 側の仕様変更で、予告なく動かなくなることがあります。無保証です。ご利用は自己責任でお願いします。切り抜きの際は、配信者の切り抜きガイドラインを確認してください。 |
| 本文2 | 解析した配信の情報とチャット（コメントの本文・時刻・種別）、「確認済み」の印、設定、この案内を確認した記録を、このPCの Chrome の中に保存します。コメントを書いた人の名前・チャンネル・アイコン・スーパーチャットの金額は保存しません。データを作者や第三者のサーバーへ送ることはありません（通信するのは YouTube だけです）。 |
| 本文3 | 詳しい説明と削除の方法は、設定（⚙）の「保存したチャット」にあります。 |
| ボタン | 確認しました |

- 本文1 は BD 4.1 の3文（3行）を、高さを抑えるため1段落につないだもの。文そのものは変えていない。
- 上のコードの `'（本文1：下の表の全文）'` などは置き場所の目印。実装では、この表の全文の文字列リテラルに置き換える（目印の文字を残さない）。

#### 4.1.3 起動時の読み出し（「起動」の節）
- 464 行 `  setView('idle');` の直後に1行足す：`  initNotice();`
- `initNotice` は 4.1.2 の関数群の後ろに足す。

```js
  function initNotice() {
    store.get(HLX_NOTICE_KEY).then((v) => {
      if (!noticeDone && hlxShouldShowNotice(v)) noticeEl.hidden = false;
    }).catch(() => {});
  }
```
- **`await` しない**（BD N-5）。`onNav()` と解析の開始を待たせない。
- `store.get` は例外を握りつぶして `undefined` を返す（22 行。確認済み）ので、読み出しに失敗したら「表示」になる（BD 3.1 の決定どおり）。
- `!noticeDone` の条件：読み出しの途中で他のタブの確認（4.1.4）が届いた場合に、古い読み出し結果で出し直さないため。

#### 4.1.4 `chrome.storage.onChanged` の条件追加（507〜509 行）
- 変更前：
```js
  safe(() => chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'sync' && ch.hlxSettings && S.items) runAnalysis();
  }));
```
- 変更後：
```js
  safe(() => chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'sync' && ch.hlxSettings && S.items) runAnalysis();
    if (area === 'local' && ch[HLX_NOTICE_KEY] && !hlxShouldShowNotice(ch[HLX_NOTICE_KEY].newValue)) hideNotice();
  }));
```
- **隠す方向だけ**に反応する。既読の記録が消された（`newValue` が `undefined`）ときに、開いているページで案内を出し直すことはしない（次の読み込みで出る）。理由：解析中に突然パネルの中身が下にずれるのを避けるため。既読の記録はどの操作でも消さないので（BD 5.1）、実際に起きるのは DevTools で消した場合だけ。
- 自分のタブで「確認しました」を押したときも、自分の `set` でこの受け手が呼ばれる。`hideNotice()` は何度呼んでも同じ結果なので問題ない。

#### 4.1.5 `start()` の catch の置き換え（176〜179 行）
- 変更前：
```js
    } catch (e) {
      if (!alive() || e.message === '__aborted__') return;
      setView('error');
      setStatus(e.message || String(e));
    } finally {
```
- 変更後：
```js
    } catch (e) {
      if (!alive() || (e && e.message) === '__aborted__') return;
      const st = hlxErrorStatus(e);
      if (st.unexpected) console.error('[盛り上がり検知]', e);
      setView('error');
      setStatus(st.text);
    } finally {
```
- `(e && e.message)`：`null` などが投げられても、この行で TypeError にしないため（現行の `e.message` は `e` が `null` だと例外になる）。
- 文の選択は ViewModel（`hlxErrorStatus`）に任せ、View は「出す」「想定外ならコンソールに出す」だけを行う。View で文を組み立てない・`HLX_SPEC_CHANGE_NOTE` を直接参照しない。
- `setStatus` は `textContent` で入れる（130 行。既存）。エラー時の文字色は既存の CSS（63 行）のまま。

#### 4.1.6 変えないもの（content.js）
- 165 行「チャットを取得中…（5時間の配信で数分かかります）」、189 行「中止しました。」、206 行「コメントが1件も見つかりませんでした。」、219 行の空の一覧の文。
- `togglePanel`・`onNav`・`render`・`drawChart`・`drawMarkers`・`cancel` の処理。案内は `onNav`（動画の切り替え）で出し直さない・消さない。`data-view` の切り替えとも無関係。

### 4.2 `extension/panel.css`
63 行（`.hlx-panel[data-view="error"] .hlx-status { … }`）の直後、64 行の空行の前に、次を挿入する。

```css

/* 初回案内（BD-0001 4.2）。通常の流れに置き、重ねない */
.hlx-notice {
  background: var(--hlx-card); color: var(--hlx-fg);
  border-left: 3px solid var(--hlx-accent); border-radius: 8px;
  padding: 10px 12px; margin-bottom: 10px;
  font-size: 12px; line-height: 1.5;
}
.hlx-notice[hidden] { display: none; }
.hlx-notice-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.hlx-notice-text { margin-bottom: 6px; }
.hlx-notice-ok {
  padding: 4px 12px; border-radius: 999px; border: 1px solid var(--hlx-accent);
  background: transparent; color: var(--hlx-accent);
  font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer;
}
.hlx-notice-ok:hover { background: var(--hlx-bg); }
```
- 使う CSS 変数はすべて既存（2〜22 行）。`html[dark]` の側も既存の変数の切り替えで追従する。
- `position`・`z-index`・`url()`・外部フォントを使わない（BD N-4・C-3）。
- 133〜140 行の「表示切り替え」の規則には足さない（案内は `data-view` に関係なく、`hidden` 属性だけで出し入れする）。
- 高さの見込み：パネルの中身の幅は約 368px（400px − 左右 16px）、案内の文字の幅は約 340px、12px の文字で1行約 28 字。本文の合計は約 400 字で約 15 行（約 270px）＋見出し・ボタン・余白で約 340px。BD N-4 の見込み（250px 程度）より高いが、E2E のグラフのクリック位置（グラフの上端＋30px）は約 570px で、ビューポートの高さ 1000px に収まる見込み（7章 T-E3 で確かめる）。

### 4.3 `extension/options.html`
#### 4.3.1 追加する HTML
81 行（`<div class="help">一度解析した配信は…</div>`）の直後、82 行（`  </div>`。「保存したチャット」の `.field` の閉じタグ）の**前**に挿入する。同じ `.field` の中に入れる（A-09「削除ボタンと同じ項」）。文は BD 4.3 の正本をそのまま使う。「・」は文の一部として残す。

```html
    <div class="disclosure">
      <h2>この拡張機能について</h2>
      <p>この拡張機能は、YouTube・Google とは関係のない、非公式のものです。YouTube や Google が提供・承認したものではありません。</p>
      <p>チャットは YouTube の非公開の内部の仕組みで読み込んでいるため、YouTube 側の仕様変更で、予告なく動かなくなることがあります。</p>
      <p>無保証です。ご利用は自己責任でお願いします。切り抜きの際は、配信者の切り抜きガイドラインを確認してください。</p>

      <h2>読むもの・保存するもの</h2>
      <p><strong>このツールが読むもの</strong>：開いている動画の情報（動画ID・タイトル・配信者名・長さ・「よく再生された部分」のデータ）と、チャットのコメント（本文・投稿時刻・通常／スーパーチャット／メンバー系の種別）。</p>
      <p><strong>このPCに保存するもの</strong>：</p>
      <ul class="plain">
        <li>・解析した配信の情報（動画ID・タイトル・配信者名・長さ・「よく再生された部分」のデータ）と、保存した日時。</li>
        <li>・解析した配信ごとのチャット（コメントの本文・時刻・種別）。メンバー系は本文を保存しません。</li>
        <li>・「確認済み」にした見どころの印。</li>
        <li>・設定（候補の出やすさ、集計の細かさ、候補の最大数、何秒前から再生するか、検知するワード）。</li>
        <li>・はじめの案内を確認したという記録。</li>
      </ul>
      <p><strong>保存場所</strong>：このPCの Chrome の中（拡張機能用の保存領域）。設定は、Chrome の同期を有効にしている場合、Google アカウントを通じて同期されることがあります。</p>
      <p><strong>保存しないもの</strong>：コメントを書いた人（視聴者）の名前・チャンネル・アイコン・スーパーチャットの金額。（配信者名は、配信の情報として保存します。）ただし、コメント本文に視聴者が自分で書いた内容は、そのまま保存されます。</p>
      <p><strong>送信</strong>：この拡張機能の作者や第三者のサーバーへ、データを送ることはありません。通信するのは YouTube だけです（動画ページとチャットを読み込むため。ログイン情報は付けません）。</p>
      <p><strong>削除</strong>：このページの「保存したチャットをすべて削除」で、解析したチャットと「確認済み」の印が消えます。設定と、はじめの案内を確認した記録は消えません（設定は「初期設定に戻す」で消えます）。拡張機能そのものは、Chrome の拡張機能の管理画面（chrome://extensions）から削除できます。</p>
    </div>
```
- `chrome://extensions` はリンクにしない（文字だけ）。外部へのリンク・画像・フォントを足さない。
- `options.js` は変えない（開示は静的な文。`$()` で参照する id も足さない）。

#### 4.3.2 追加する CSS
`<style>` の中、28 行（`hr { … }`）の直後に挿入する。

```css
  .disclosure { margin-top:20px; padding-top:12px; border-top:1px solid var(--line); font-size:13px; line-height:1.7; }
  .disclosure h2 { font-size:14px; margin:12px 0 4px; color:var(--fg); }
  .disclosure p { margin:0 0 6px; }
  .disclosure ul.plain { list-style:none; margin:0 0 6px; padding:0 0 0 1em; }
```
- 色は既存の `var(--fg)`・`var(--line)` だけ（7〜10 行で `prefers-color-scheme: dark` に追従）。文字色は `body` の `var(--fg)` を受け継ぐ。

### 4.4 エラー表示（View の担当範囲のまとめ）
| 状況 | View がすること | 出る文 |
|---|---|---|
| fetcher.js の7か所 | `hlxErrorStatus(e)` → `unexpected: false` → `setView('error')`・`setStatus(st.text)` | 2.3 節の全文 |
| 想定外（通信の失敗など） | 同上で `unexpected: true` → `console.error('[盛り上がり検知]', e)` のあと表示 | 3.4 節の全文 |
| 中断（`'__aborted__'`）・古い実行 | 何もしない（現行どおり） | ― |
| 中止ボタン・コメント0件 | 変更なし（例外の経路を通らない） | 中止しました。／コメントが1件も見つかりませんでした。 |

### 4.5 `extension/README.txt`
#### 4.5.1 文字コード・改行（決定）
- **UTF-8 の BOM は残す。** 改行は今と同じ（作業ツリーで CRLF）。理由：今の形を変えると差分が全行に出て確認しにくい。Windows のメモ帳などで文字化けしにくい形を保つ。
- 編集後に `file extension/README.txt` で「UTF-8 (with BOM)」のままであることを確かめる。

#### 4.5.2 新しい全体（この全文に置き換える）
`<版数>` は 1.3 節のとおり `1.2.1`。行頭の全角空白・半角空白は下のとおり。

```text
配信 盛り上がり検知 in Chrome（Chrome拡張機能） ver <版数>
==========================================

■ はじめに（非公式・自己責任）
この拡張機能は、YouTube・Google とは関係のない、非公式のものです。YouTube や Google が提供・承認したものではありません。
チャットは YouTube の非公開の内部の仕組みで読み込んでいるため、YouTube 側の仕様変更で、予告なく動かなくなることがあります。
無保証です。ご利用は自己責任でお願いします。切り抜きの際は、配信者の切り抜きガイドラインを確認してください。

※音声・画面（RANKED MATCH）まで解析する in App版（PCツール）とは別のものです。
　in Chrome版はチャットだけで解析し、ブラウザだけで動きます。

■ 入れ方（GitHub から・最初の1回だけ）
1. 次のどちらかの方法で入手し、消さない場所（ドキュメントなど）に置く
   (a) git を使う場合：置きたい場所で次のコマンドを実行する
         git clone https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome.git
   (b) git を使わない場合：https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome を開き、
       「Code」→「Download ZIP」でダウンロードする。解凍先を決めてから解凍する
   ※入るのはリポジトリ全体（tests・docs など）ですが、使うのは「extension」フォルダだけです
   ※読み込んだ後にこのフォルダを消したり移動したりすると、拡張機能が動かなくなります
2. Chromeのアドレスバーに  chrome://extensions  と入力してEnter
3. 右上の「デベロッパー モード」をオンにする
4. 左上の「パッケージ化されていない拡張機能を読み込む」を押し、リポジトリ直下の「extension」フォルダを選ぶ
   （ZIP の場合は、解凍してできたフォルダの中の「extension」フォルダ）
5. 右上のパズルのアイコン →「配信 盛り上がり検知」のピンを押すと、ツールバーに常に表示されます（任意）

■ 使い方
1. YouTubeで配信アーカイブを開く
2. 右下の赤い「見どころ」ボタン（またはツールバーのアイコン）を押す
3. 「このアーカイブを解析」を押す。配信が長いほど時間がかかります。進み具合はパネルに表示されます
4. 結果
   （現行の 19〜29 行をそのまま）
一度解析した配信はチャットを保存しているので、次に開いたときは自動で結果が出ます。

■ 設定（パネル右上の ⚙）
・候補の出やすさ：多め／標準／少なめ
・集計の細かさ（初期値 30秒ごと）、候補の最大数、何秒前から再生するか
・検知するワード：配信者ごとの定番コメントを追加できます
設定を保存すると、開いているパネルにすぐ反映されます（チャットの取り直しは不要）。
設定画面の「保存したチャット」に、保存するデータの説明があります。

■ 更新するとき
(a) git clone で入れた場合
   1. リポジトリのフォルダで  git pull  を実行する
   2. chrome://extensions で「配信 盛り上がり検知」の更新ボタン（↻）を押す
   3. YouTubeのタブを再読み込みする
(b) ZIP で入れた場合
   1. 新しい ZIP をダウンロードして解凍する
   2. 読み込み済みの「extension」フォルダの中身を、新しい「extension」フォルダの中身で上書きする
      ※別の場所に解凍して読み込み直さず、同じ場所に上書きしてください
   3. chrome://extensions で「配信 盛り上がり検知」の更新ボタン（↻）を押す
   4. YouTubeのタブを再読み込みする

■ うまくいかないとき
・ボタンが出ない → YouTubeのタブを再読み込み
・「チャットリプレイがありません」→ チャット無効の配信、通常の動画、配信直後でアーカイブ処理中のどれか。どれにも当たらないのに出る場合は、YouTube 側の仕様変更の可能性があります
・「未ログインでは見られない」→ メンバー限定・年齢制限の配信は非対応です
・途中でエラーになる → 少し時間をおいて「再取得」。続く場合は YouTube 側の仕様変更の可能性があります
・配信中（ライブ中）は解析できません。終了後のアーカイブで使ってください
直らないときは、リポジトリの Issue で知らせてください（GitHub のアカウントが必要です）：
https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome/issues

■ 注意
（現行の 49〜52 行をそのまま）

■ 保存するデータ
【このツールが読むもの】開いている動画の情報（動画ID・タイトル・配信者名・長さ・「よく再生された部分」のデータ）と、チャットのコメント（本文・投稿時刻・通常／スーパーチャット／メンバー系の種別）。
【このPCに保存するもの】
・解析した配信の情報（動画ID・タイトル・配信者名・長さ・「よく再生された部分」のデータ）と、保存した日時。
・解析した配信ごとのチャット（コメントの本文・時刻・種別）。メンバー系は本文を保存しません。
・「確認済み」にした見どころの印。
・設定（候補の出やすさ、集計の細かさ、候補の最大数、何秒前から再生するか、検知するワード）。
・はじめの案内を確認したという記録。
【保存場所】このPCの Chrome の中（拡張機能用の保存領域）。設定は、Chrome の同期を有効にしている場合、Google アカウントを通じて同期されることがあります。
【保存しないもの】コメントを書いた人（視聴者）の名前・チャンネル・アイコン・スーパーチャットの金額。（配信者名は、配信の情報として保存します。）ただし、コメント本文に視聴者が自分で書いた内容は、そのまま保存されます。
【送信】この拡張機能の作者や第三者のサーバーへ、データを送ることはありません。通信するのは YouTube だけです（動画ページとチャットを読み込むため。ログイン情報は付けません）。
【削除】設定画面（⚙）の「保存したチャット」の「保存したチャットをすべて削除」で、解析したチャットと「確認済み」の印が消えます。設定と、はじめの案内を確認した記録は消えません（設定は「初期設定に戻す」で消えます）。拡張機能そのものは、Chrome の拡張機能の管理画面（chrome://extensions）から削除できます。
```
- 「（現行の 19〜29 行をそのまま）」「（現行の 49〜52 行をそのまま）」の2か所は、**現行の行を1文字も変えずに**その位置に置く（説明の括弧書きを残さない）。
- 「■ 保存するデータ」は options.html（4.3.1）と同じ文。違いは、強調を `<strong>…</strong>：` → `【…】` にしたことと、「削除」の「このページの」→「設定画面（⚙）の「保存したチャット」の」の1語句だけ（BD 4.5 順10）。
- 末尾に「■ ライセンス」節を足す（1.2.2 節。#7 A1）。
- 「hlx-ext」は1か所も残らない。「数分」も残らない（F-13）。

#### 4.5.3 現行からの変更点（確認用）
| 現行の行 | 変更 |
|---|---|
| 1 | `ver 1.2` → `ver <版数>`（3桁） |
| 3〜4 | 「■ はじめに」の後ろに移し、4行目を「in Chrome版はチャットだけで解析し、ブラウザだけで動きます。」に（「数分で終わります」を消す） |
| 6〜12 | 「■ 入れ方」を書き直し（「hlx-ext」を消す、入手2通り、`extension` フォルダ、ピン留めは任意） |
| 17 | 手順3の後半を「配信が長いほど時間がかかります。進み具合はパネルに表示されます」に |
| 36 の後 | 「設定画面の『保存したチャット』に、保存するデータの説明があります。」を1行追加 |
| 38〜39 | 「■ 更新するとき」を (a)(b) の2通りに |
| 43 | 「どれにも当たらないのに出る場合は…」を追記 |
| 46 の後 | 知らせ先の2行を追加 |
| 48〜52 | 変更なし |
| 末尾 | 「■ 保存するデータ」を追加 |

## 5. 層の間の受け渡し
前提：content script の読み込み順は manifest のとおり `analyzer.js → fetcher.js → viewmodel/videoid.js → content.js`（変えない）。各ファイルの最上位の `const`・`function` は、同じ拡張機能の content script の間で共有される。

| 名前 | 公開する層（ファイル） | 使う層（ファイル・場所） | 使う時点 |
|---|---|---|---|
| `hlxUserError` | Model（fetcher.js） | Model（fetcher.js の throw 7か所）。テスト（`_load.js`・`panel_viewmodel.test.js`） | 解析中 |
| `HLX_SPEC_CHANGE_TAIL` | Model（fetcher.js） | Model（fetcher.js 142 行）。テスト | 解析中 |
| `HLX_SPEC_CHANGE_NOTE` | Model（fetcher.js） | Model（fetcher.js）。**ViewModel（videoid.js の `hlxErrorStatus` の中だけ）**。テスト | 解析中・エラー時 |
| `HLX_NOTICE_KEY` | ViewModel（videoid.js） | View（content.js の `ackNotice`・`initNotice`・`onChanged`） | 起動時・押したとき・他タブの変更時 |
| `HLX_NOTICE_VERSION` | ViewModel（videoid.js） | ViewModel（`hlxShouldShowNotice`）。View（`ackNotice` の保存値） | 同上 |
| `hlxShouldShowNotice` | ViewModel（videoid.js） | View（content.js の `initNotice`・`onChanged`） | 同上 |
| `hlxErrorStatus` | ViewModel（videoid.js） | View（content.js の `start()` の catch） | エラー時 |
| `HLX_UNEXPECTED_ERROR_BASE` | ViewModel（videoid.js） | ViewModel（`hlxErrorStatus`）。テスト | エラー時 |
| `hlxFetchChat` | Model（fetcher.js） | View（content.js の `start()`）……既存の逸脱 D-2。本件で変えない | 解析時 |

- 依存の向き：View → ViewModel → Model（定数のみ）。View は Model の定数（`HLX_SPEC_CHANGE_*`）を直接参照しない。Model は ViewModel・View の名前を参照しない。
- ViewModel が Model の定数を参照するのは関数の実行時だけ。読み込みの時点では参照しないので、videoid.js が fetcher.js より先・単独で読み込まれても例外にならない。
- View は ViewModel の名前を**関数の実行時**に参照する（`buildUI` 以降）。content.js は最後に読み込まれるので、その時点で必ず定義済み。
- 保存の受け渡し：`chrome.storage.local` の `hlxNoticeAck` に数値 `HLX_NOTICE_VERSION`（=1）を書くのは View だけ。読むのも View（`store.get`）。値の意味の判断は ViewModel（`hlxShouldShowNotice`）。

## 6. エラー処理・境界値
| No | 状況 | 動き（決定） | 根拠・確かめ方 |
|---|---|---|---|
| E-1 | `chrome.storage.local.get` が失敗（拡張機能の再読み込み後の古いタブなど） | `store.get` が `undefined` を返す → 案内を表示 | `store.get`（22 行）が例外を握りつぶす。手動 |
| E-2 | `chrome.storage.local.set` が失敗 | このページでは隠したまま。次の読み込みで再表示される | `store.set`（23 行）が握りつぶす。害は小さい（BD 3.1） |
| E-3 | 案内の表示中に動画を切り替え（`onNav`） | 案内はそのまま（出し直さない・消さない）。案内の状態は動画ごとではない | 4.1.6。E2E では扱わない（手動で任意） |
| E-4 | 他のタブで「確認しました」を押した | `onChanged`（area `local`、キー `hlxNoticeAck`、新しい値が 1 以上の数値）で、このタブの案内も隠す | 4.1.4。手動（2タブ） |
| E-5 | 起動時の読み出しが終わる前に E-4 が届いた | `noticeDone` が真なので、読み出しの結果（`undefined`）で出し直さない | 4.1.3 |
| E-6 | 既読の記録が DevTools で消された | 開いているページでは何もしない。次の読み込みで表示 | 4.1.4（隠す方向だけ） |
| E-7 | 既読の値が壊れている（文字列 `'1'`、`null` など） | 表示する（`hlxShouldShowNotice` が真） | 3.3 節。単体 T-V1 |
| E-8 | パネルを開く前（パネルが閉じている） | 案内の要素は `buildUI` で作られ、パネルの中にあるので見えない。開いたときに見える。`buildUI` は起動の最初に必ず走るので、`noticeEl` が無い状態で `initNotice`・`hideNotice` が呼ばれることは無い | 4.1.2・4.1.3 |
| E-9 | 動画ページ以外（トップ、検索など） | 「見どころ」ボタンが隠れ（443 行）、パネルも閉じる（451 行）ので案内は見えない（F-27）。案内の要素の `hidden` は変えない | 既存の動き |
| E-10 | 案内の表示中に解析・中止・再取得・グラフのクリック | 案内とは無関係に動く。案内はボタンを覆わない（通常の流れ、`position` 指定なし） | E2E T-E1・T-E2・T-E3 |
| E-11 | 「確認しました」を連打 | 1回目で隠れ、2回目以降は押せない（隠れている）。`store.set` が重なっても同じ値 | ― |
| E-12 | 解析中に `null` などが投げられた | `(e && e.message)` で catch の中が例外にならない。`hlxErrorStatus(null)` は想定外の文 | 4.1.5。単体 T-V5 |
| E-13 | 目印付きだが `message` が空 | 想定外の文（空の状態表示にしない） | 単体 T-V4 |
| E-14 | 想定外のエラー | 画面には日本語の定型文だけ。`console.error` に `'[盛り上がり検知]'` と元の例外。`pageerror`（捕まえられなかった例外）にはならない | E2E T-E4。BD N-8 |
| E-15 | 187 行の待ち（1.5〜10 秒×5回） | 本件で変えない。単体テストでは `setTimeout` を即時実行に差し替える | 7章 T-M7 |
| E-16 | 中止のあとに、走っていた取得がエラーで終わった | `alive()` が偽なので何も出さない（現行どおり） | 既存 |

## 7. テストの観点（開発課がテスト仕様書を書く材料）
### 7.1 単体：Model（`tests/unit/fetcher.test.js`、Model係）
既存の `mockYouTube` に、次の模擬の切り替えを足す（名前は例。テスト仕様書で確定）：`noData`（watch の HTML に `ytInitialData` を入れない）、`noCont`（`liveChatRenderer` に `continuations` を入れない）、`apiStatus`（取得 API の応答の `ok`/`status`。例：403、503）、`apiThrow`（取得 API の `fetch` が例外を投げる）。187 行のテストは `loadExtension({ ...globals, setTimeout: (f) => f() })` で待ちを無くす。

| ID | 観点 | 層 | 自動/手動 | 受け入れ基準 |
|---|---|---|---|---|
| T-M1 | `noData` → reject の文が「ページ情報を読み取れませんでした」で始まり、`HLX_SPEC_CHANGE_NOTE` で終わる | Model | 自動 | A-13 |
| T-M2 | `withChat: false` → 文が「この動画にはチャットリプレイがありません」を含み（既存の正規表現も通る）、「通常の動画・チャット無効・処理中のどれでもないのに出る場合は、」＋`HLX_SPEC_CHANGE_TAIL` で終わる | Model | 自動 | A-13・A-15 |
| T-M3 | `noCont` → 「チャットリプレイの読み込み口が見つかりませんでした。」＋`HLX_SPEC_CHANGE_NOTE` と完全一致 | Model | 自動 | A-13 |
| T-M4 | `apiStatus: 403` → 「YouTubeからの取得に失敗しました（エラー 403）。」＋`HLX_SPEC_CHANGE_NOTE` と完全一致 | Model | 自動 | A-13 |
| T-M5 | `isLive: true` → 文が現行と完全一致（2.3 節）で、「仕様変更」を含まない | Model | 自動 | A-15 |
| T-M6 | `withChat: false, playable: 'LOGIN_REQUIRED'` → 文が現行と完全一致で、「仕様変更」を含まない | Model | 自動 | A-15 |
| T-M7 | `apiThrow`（5回とも例外）と `apiStatus: 503`（5回とも）→ 「YouTubeからの応答がありません。少し時間をおいて再試行してください。」＋`HLX_SPEC_CHANGE_NOTE` と完全一致。API の呼び出しが5回であること | Model | 自動 | A-14 |
| T-M8 | T-M1〜T-M7 のすべての reject で `e.hlxUser === true` | Model | 自動 | A-16（前提） |
| T-M9 | `hlxUserError('x')` → `message === 'x'`・`hlxUser === true`・`instanceof`（同じ環境の）`Error`。`HLX_SPEC_CHANGE_NOTE === '何度か試しても同じ場合は、' + HLX_SPEC_CHANGE_TAIL` | Model | 自動 | A-13 |
| T-M10 | 既存の3件（取得の流れ、未ログイン扱い、分かりやすいエラー）が変更なしで通る | Model | 自動 | A-19 |

### 7.2 単体：ViewModel（`tests/unit/panel_viewmodel.test.js`、ViewModel係）
| ID | 観点 | 層 | 自動/手動 | 受け入れ基準 |
|---|---|---|---|---|
| T-V1 | `hlxShouldShowNotice`：3.3 節の表の全入力（`undefined`・`1`・`2`・`1.5`・`0`・`-1`・`'1'`・`NaN`・`Infinity`・`null`・`true`・`{}`・`[1]`）が表の出力になる | ViewModel | 自動 | A-07・A-08 |
| T-V2 | `HLX_NOTICE_KEY === 'hlxNoticeAck'`（`chat_`・`seen_` で始まらない）、`HLX_NOTICE_VERSION === 1`、`hlxShouldShowNotice(HLX_NOTICE_VERSION) === false` | ViewModel | 自動 | A-08・A-12 |
| T-V3 | `hlxErrorStatus(hlxUserError('配信中は…'))` → `{ text: '配信中は…', unexpected: false }`（結合あり） | ViewModel | 自動 | A-16・A-15 |
| T-V4 | 目印なしの `Error`・`TypeError`、目印付きで `message` が空・空白だけ・数値、目印が文字列 `'true'` → `{ text: 3.4 節の全文, unexpected: true }`（結合あり） | ViewModel | 自動 | A-16 |
| T-V5 | `null`・`undefined`・文字列・数値 → 想定外の文・`unexpected: true`。例外を投げない | ViewModel | 自動 | A-16 |
| T-V6 | 想定外の文が `HLX_UNEXPECTED_ERROR_BASE` で始まり、`HLX_SPEC_CHANGE_NOTE` を含み、英語の元のメッセージ（例：`'Cannot read properties'`）を含まない | ViewModel | 自動 | A-16 |
| T-V7 | 単独（`videoid.js` だけ）で読み込んでも例外にならず、`hlxErrorStatus(new Error('x'))` → `{ text: HLX_UNEXPECTED_ERROR_BASE, unexpected: true }`、`hlxErrorStatus({ hlxUser: true, message: 'm' })` → `{ text: 'm', unexpected: false }` | ViewModel | 自動 | A-19（N-2） |
| T-V8 | 戻り値のプロパティが `text`・`unexpected` の2つだけ | ViewModel | 自動 | A-16 |
| T-V9 | 既存の `videoid.test.js` が変更なしで通る | ViewModel | 自動 | A-19 |

### 7.3 E2E（`tests/e2e/test_extension_e2e.py`、View係）
既存の `route` は変えない。新しいテストは新しいプロファイルのフォルダ名（例：`profile-notice`、`profile-unexpected`）を使う。

| ID | 観点 | 層 | 自動/手動 | 受け入れ基準 |
|---|---|---|---|---|
| T-E1 | 新しいプロファイルで `/watch?v=VID` → 「見どころ」→ `.hlx-notice` の `hidden` が偽になるまで待つ（`wait_for_function`）。案内の文に「はじめにお読みください」「非公式」「自己責任」「保存します」を含む。案内を出したまま `.hlx-primary` を押して `data-view` が `done`。`done` の後も案内が出たまま | View | 自動 | A-07・F-27 |
| T-E2 | T-E1 の続きで `.hlx-notice-ok` を押す → `.hlx-notice` の `hidden` が真。`pg.reload()` → 「見どころ」→ `data-view` が `done`（保存済みのチャットで自動解析）になってから 1 秒待ち、`.hlx-notice` の `hidden` が真のまま。`pageerror` が 0 件 | View | 自動 | A-08 |
| T-E3 | 既存2件（`test_live_url_shows_fab_and_analyzes`、`test_panel_analysis_and_video_sync`）が**変更なしで**通る（どちらも新しいプロファイル＝案内が出た状態）。グラフのクリック・縦線の確認も通る | View | 自動 | A-07・A-20・U-3 |
| T-E4 | 想定外エラー：`ctx.route` の受け手を「URL に `/watch?` と `hl=ja` を含む要求（fetcher.js 121 行の取得）は `route.abort()`、それ以外は既存の `self.route`」にする。ページは `/watch?v=VID`（`hl=ja` を含まない）で開く。「見どころ」→ `.hlx-primary` → `data-view` が `error`、状態表示が 3.4 節の全文と一致し、`Failed to fetch` などの英語を含まない。`pageerror` が 0 件 | View | 自動 | A-16 |
| T-E5 | （任意）`ctx.on("request")` で要求の URL を集め、`http` で始まるものの宛先がすべて `www.youtube.com` であること。案内の表示と「確認しました」の前後で要求が増えないこと | View | 自動（任意） | A-18 |

- T-E4 は、content script の `fetch` が `ctx.route` で捕まえられること（既存の E2E が `/live_chat_replay` などを同じ方法で模擬していることで確認）と、`route.abort()` で `fetch` が例外になることを前提にする（見込み。通らなければ手動の M-6 で代える）。
- T-E3 が通らなかった場合だけ、既存の2件に「`.hlx-notice-ok` を押す」手順を足す（BD 7.3・A-20）。その場合はテスト仕様書と報告に理由を書く。

### 7.4 手動（運用係・品質保証課）
| ID | 観点 | 層 | 自動/手動 | 受け入れ基準 |
|---|---|---|---|---|
| M-1 | 新しい Chrome プロファイルで `git clone` → README.txt の手順で `extension` を読み込み → 動画ページで「見どころ」ボタン | ― | 手動 | A-02 |
| M-2 | ZIP を解凍 → 解凍してできたフォルダの中の `extension` を読み込み。実際のフォルダ名を記録（U-1） | ― | 手動 | A-03 |
| M-3 | 初回案内が出る・解析が押せる・確認後は再読み込みしても出ない。YouTube のダークテーマでも読める。2つのタブで E-4 | View | 手動 | A-07・A-08 |
| M-4 | 設定画面（options.html）を明・暗の両方で開き、「保存したチャット」の項に開示が読める | View | 手動 | A-09 |
| M-5 | 解析後に DevTools → Application → Storage（拡張機能の service worker か options ページで `chrome.storage.local.get(null)`）で、キーが `chat_<ID>`（`info`・`items`・`at`）、`seen_<ID>`、`hlxNoticeAck`（値 1）だけであること。`chrome.storage.sync` は `hlxSettings` だけ。「保存したチャットをすべて削除」の前後で `chat_`・`seen_` だけが消え、`hlxNoticeAck`・`hlxSettings` が残る | ― | 手動 | A-10・A-12 |
| M-6 | 想定外の例外（T-E4 の代わり、または実機での確認）：動画ページで DevTools のコンソールを開き、実行コンテキストを拡張機能（「配信 盛り上がり検知 in Chrome」）に切り替えて `hlxFetchChat = async () => { throw new Error('test unexpected'); }` を実行 → パネルの「再取得」（または保存の無い動画で「このアーカイブを解析」）→ 状態表示が 3.4 節の全文、コンソールに `[盛り上がり検知] Error: test unexpected`。ページを再読み込みして元に戻す | View | 手動 | A-16 |
| M-7 | エラー文が長いときの折り返しの見え方（U-5） | View | 手動 | A-13・A-14 |

### 7.5 文書確認・レビュー・その他のコマンド
| ID | 観点 | 方法 | 受け入れ基準 |
|---|---|---|---|
| DC-01 | `grep -n "hlx-ext" extension/README.txt` が 0 件。入れ方の記述が `extension` フォルダ | 文書 | A-01 |
| DC-02 | README.txt の「■ 更新するとき」が (a)(b) の2通りで、どちらも ↻ とタブの再読み込みを含む | 文書 | A-04 |
| DC-03 | README.md が 1.2.3 節の全文と一致。導入手順（## 使う）より前に注意の引用ブロックと README.txt への案内がある | 文書 | A-05 |
| DC-04 | README.txt の「■ はじめに」に 4.1 節の3文、「■ 注意」の3項目が現行のまま | 文書 | A-06 |
| DC-05 | options.html の文が 4.3.1 と一致 | 文書 | A-09・A-10 |
| DC-06 | `grep -nE "一切\|何も保存しない\|個人情報を含まない\|完全に安全\|規約に違反しない\|規約上問題ない\|裏技" extension/options.html extension/README.txt README.md extension/content.js` が 0 件。開示にコメント本文の保存・投稿者名を保存しない・YouTube 以外へ送らない、が書かれている | 文書 | A-11 |
| DC-07 | 開示の文（options.html・README.txt）の削除の文が「`chat_`・`seen_` だけ消える／設定と既読は消えない」と一致 | 文書＋レビュー | A-12 |
| DC-08 | `git diff main -- extension/manifest.json` が `"version"` の1行（`1.2.0` → `1.2.1`）だけ | レビュー | A-17 |
| DC-09 | `grep -n "fetch(" extension/` が fetcher.js の3件だけ。案内・開示に外部の URL・画像・`url()` が無い | レビュー | A-18 |
| DC-10 | `node --test "tests/unit/*.test.js"` がすべて通る | 自動 | A-19・A-21 |
| DC-11 | `python -m unittest discover -s tests/e2e -v` がすべて通る | 自動 | A-20 |
| DC-12 | `python shared/reference/metrics_ref.py --check` が通る。`git diff shared/ extension/analyzer.js` が空 | 自動＋レビュー | A-21 |
| DC-13 | README.txt の1行目の版数と manifest の version が一致（`1.2.1`）。2つの変更が同じコミットに入っている（`git log -p`） | 文書 | A-22 |
| DC-14 | `LICENSE` が 1.2.1 節の全文と一致（著作権の行 `Copyright (c) 2026 なべさん`）。README.md の「## ライセンス」・README.txt の「■ ライセンス」が 1.2.2・1.2.3 節と一致。GitHub のリポジトリ画面でライセンスが MIT と判別される（push 後、任意） | 文書 | A-23 |
| DC-15 | `file extension/README.txt` が「UTF-8 (with BOM)」のまま | 文書 | ― |
| DC-16 | content.js に `innerHTML` の追加が無い | レビュー | ― |

### 7.6 受け入れ基準との対応（漏れの確認）
| 受け入れ基準 | 観点 |
|---|---|
| A-01 | DC-01 |
| A-02 | M-1 |
| A-03 | M-2 |
| A-04 | DC-02 |
| A-05 | DC-03 |
| A-06 | DC-04 |
| A-07 | T-E1・T-E3・T-V1・M-3 |
| A-08 | T-E2・T-V1・T-V2・M-3 |
| A-09 | DC-05・M-4 |
| A-10 | DC-05・M-5（＋BD 5.1 のレビュー） |
| A-11 | DC-06 |
| A-12 | DC-07・M-5・T-V2 |
| A-13 | T-M1〜T-M4・T-M9・M-7 |
| A-14 | T-M7 |
| A-15 | T-M2・T-M5・T-M6・T-V3 |
| A-16 | T-M8・T-V3〜T-V8・T-E4・M-6 |
| A-17 | DC-08 |
| A-18 | DC-09・T-E5（任意） |
| A-19 | T-M10・T-V7・T-V9・DC-10 |
| A-20 | T-E3・DC-11 |
| A-21 | DC-10・DC-12 |
| A-22 | DC-13 |
| A-23 | DC-14 |

## 8. 前提となるリファクタリング
- **本件の前に必要なリファクタリングは無い。** 変更は既存の構造の中で閉じる（新しいファイルは製品コードに足さない。テストの新規ファイル1つだけ）。
- ただし、次の既知の逸脱（BD 2.3）を、リファクタリング課の RF-0001（MVVM への移行計画）への申し送りとして再掲する。

| No | 逸脱 | 本件で増える部分 | RF での直し方の案（BD 2.3 のまま） |
|---|---|---|---|
| D-1 | パネルの ViewModel の関数を `viewmodel/videoid.js` に置く（名前と中身が合わない） | `HLX_NOTICE_*`・`HLX_UNEXPECTED_ERROR_BASE`・`hlxShouldShowNotice`・`hlxErrorStatus`。テストは `panel_viewmodel.test.js` に分けてあるので、ファイルを分けるときはテストの読み込み先を変えるだけで済む | manifest の `content_scripts.js` を変えてよい案件で `viewmodel/panel.js` などに分ける |
| D-2 | content.js が Model（`hlxFetchChat`）を直接呼び、パネルの状態を持つ | 案内の表示状態（`noticeEl.hidden`・`noticeDone`）と既読の読み書き（`store`）も content.js が持つ | パネルの状態と取得の呼び出しを `viewmodel/` に移す |
| D-3 | 利用者向けの日本語のエラー文を Model（fetcher.js）が持つ | 追記の文と定数も fetcher.js に置く。目印 `hlxUser` | Model はエラーの種類（コード）を投げ、ViewModel が文を作る。目印 `hlxUser` は種類コードに置き換える |
| D-4 | 開示の文が3か所（options.html・README.txt・初回案内の要約）に手で写される | 本件で3か所に新しく書く | `extension/view/` に文の定数を置き、両方から読む（manifest 変更が要る）。README.txt との一致はテストで照合 |
| D-5 | `options.js`（View）が `chrome.storage` を直接読み書きする。content.js も `store` で直接読み書きする | content.js の `hlxNoticeAck` の読み書きが増える | 保存の読み書きを Model 側の保存モジュールにまとめる |

## 9. 共通指標仕様（shared/）への影響
- **なし。** `shared/**`・`extension/analyzer.js` を変えない。コメント量・加速度・同じコメントの流れる確率の定義と計算、スコアに関わる処理は触らない。
- 確かめ方：7.5 節 DC-10（`shared_spec.test.js` を含む）・DC-12。

## 付記 変えてはいけないもの
- `extension/manifest.json` の `permissions`（`storage`・`unlimitedStorage`）・`host_permissions`（無し）・`content_scripts`（`matches`・`js` の配列と順・`css`・`run_at`）を変えない。変えてよいのは #7 C1 による `"version"` の1行（`1.2.1`）だけ。
- `fetch` を足さない（`fetch(` は fetcher.js の3か所のまま）。案内・開示のために外部の画像・フォント・スクリプト・`url()`・リンク先の自動取得を使わない。
- `options.js`（`clearCache` の消す対象 `chat_`・`seen_`、確認ダイアログの文）を変えない。
- content.js で `innerHTML` を使わない。

## 改訂履歴
| 日付 | 版 | 内容 | 承認 |
|---|---|---|---|
| 2026-10-30 | 初版 | 作成・承認 | chrome-design-kacho |
| 2026-10-30 | 追補1 | 社長判断 #7 の回答（A1 MIT・なべさん・2026／B1 View係／C1 1.2.1）に合わせ、1.2 節（LICENSE の全文、README.txt のライセンス節、README.md の全文）と 1.3 節（版数 1.2.1）を確定。4.5.2・7.5・7.6・付記の該当箇所を更新 | chrome-design-kacho |
