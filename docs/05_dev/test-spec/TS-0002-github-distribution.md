---
id: TS-0002
title: GitHub 配布の体裁整備（初回案内・開示・エラー案内・説明書）
status: approved
reviewer: chrome-dev-kacho
detail_design: DD-0001
updated: 2026-10-30
---
# TS-0002 GitHub 配布の体裁整備 テスト仕様書

対応する設計：DD-0001（GitHub 配布）。番号は TS-0001 が INC-0001 で使用済みのため 0002。
関連：REQ-0001、BD-0001。受け入れ基準 A-xx は REQ-0001 のもの。

## 受け入れ基準
初回案内（非公式・自己責任・保存データ）が初回だけ出て、確認後は出ない。設定画面と README.txt に保存データの開示がある。エラー文に「YouTube 側の仕様変更の可能性」が（該当する場合だけ）付き、想定外の例外は日本語の定型文になる。README.txt の手順が GitHub 配布に合っている。既存の機能・共通指標は変わらない。

## テストケース
### Model（担当：Model係。tests/unit/fetcher.test.js）
| ID | DD | 前提 | 手順 | 期待結果 | 自動/手動 |
|---|---|---|---|---|---|
| TS-0002-M01 | T-M1 | 模擬 noData | hlxFetchChat | 「ページ情報を読み取れませんでした」で始まり HLX_SPEC_CHANGE_NOTE で終わる。hlxUser === true | 自動 |
| TS-0002-M02 | T-M2 | 模擬 withChat:false | 同上 | 「チャットリプレイがありません」を含み、「…どれでもないのに出る場合は、」＋HLX_SPEC_CHANGE_TAIL で終わる | 自動 |
| TS-0002-M03 | T-M3 | 模擬 noCont | 同上 | 「チャットリプレイの読み込み口が見つかりませんでした。」＋NOTE と完全一致 | 自動 |
| TS-0002-M04 | T-M4 | 模擬 apiStatus:403 | 同上 | 「YouTubeからの取得に失敗しました（エラー 403）。」＋NOTE と完全一致。再試行しない | 自動 |
| TS-0002-M05 | T-M5 | 模擬 isLive:true | 同上 | 現行と同じ文で「仕様変更」を含まない | 自動 |
| TS-0002-M06 | T-M6 | withChat:false かつ LOGIN_REQUIRED | 同上 | 現行と同じ文で「仕様変更」を含まない | 自動 |
| TS-0002-M07 | T-M7 | apiThrow／apiStatus:503（5回とも）、setTimeout 即時 | 同上 | 「YouTubeからの応答がありません。少し時間をおいて再試行してください。」＋NOTE と完全一致。API 呼び出しちょうど5回 | 自動 |
| TS-0002-M08 | T-M8 | M01〜M07 の8条件 | reject を受ける | すべて hlxUser === true | 自動 |
| TS-0002-M09 | T-M8 補 | 中断／fetch が TypeError | 実行 | `'__aborted__'` と通信の失敗には hlxUser が付かない | 自動 |
| TS-0002-M10 | T-M9 | 読み込み済み | hlxUserError('x')、('') と定数 | message・hlxUser が仕様どおり。NOTE === 「何度か試しても同じ場合は、」＋TAIL。vm 内の Error 判定は instanceof でなく name で行う（環境が別のため） | 自動 |
| TS-0002-M11 | T-M10 | 既存3件 | 変更なしで実行 | 合格 | 自動 |

### ViewModel（担当：ViewModel係。tests/unit/panel_viewmodel.test.js。VM09 のみ videoid.test.js）
| ID | DD | 前提 | 手順 | 期待結果 | 自動/手動 |
|---|---|---|---|---|---|
| TS-0002-VM01 | T-V1 | videoid.js のみ | hlxShouldShowNotice に undefined,1,2,1.5,0,-1,'1',NaN,Infinity,null,true,{},[1] | 1・2・1.5 だけ false、他は true | 自動 |
| TS-0002-VM02 | T-V2 | fetcher+videoid 結合 | 定数と hlxShouldShowNotice(HLX_NOTICE_VERSION) | キー 'hlxNoticeAck'（chat_・seen_ で始まらない）、版 1、結果 false | 自動 |
| TS-0002-VM03 | T-V3 | 結合 | 目印付き（hlxUserError、普通のオブジェクト、前後空白） | { text: message そのまま, unexpected:false } | 自動 |
| TS-0002-VM04 | T-V4 | 結合 | 目印なし Error/TypeError、message が空・空白・数値、hlxUser が文字列 | 想定外の全文（BASE+NOTE）・unexpected:true | 自動 |
| TS-0002-VM05 | T-V5 | 結合 | null・undefined・文字列・数値 | 例外なし、想定外の文 | 自動 |
| TS-0002-VM06 | T-V6 | 結合 | 想定外の入力 | BASE で始まり NOTE を含み、英語の元のメッセージを含まない | 自動 |
| TS-0002-VM07 | T-V7 | videoid.js のみ | 読み込み、hlxErrorStatus 2通り | 例外なし。想定外は BASE のみ、目印付きはそのまま | 自動 |
| TS-0002-VM08 | T-V8 | 結合 | 戻り値のキー | text と unexpected の2つだけ | 自動 |
| TS-0002-VM09 | T-V9 | 既存 | videoid.test.js を変更なしで実行 | 合格 | 自動 |

### View（担当：View係。tests/e2e/test_extension_e2e.py）
| ID | DD | 前提 | 手順 | 期待結果 | 自動/手動 |
|---|---|---|---|---|---|
| TS-0002-V01 | T-E1 | 新プロファイル | /watch?v=VID →「見どころ」 | 案内が出て「はじめにお読みください」「非公式」「自己責任」「保存します」を含む（test_first_notice_shows_acks_and_stays_hidden） | 自動 |
| TS-0002-V02 | T-E1 | V01 の続き | 案内を出したまま解析 | data-view が done。done 後も案内は出たまま | 自動 |
| TS-0002-V03 | T-E2 | V02 の続き | 「確認しました」→ 再読み込み | 案内が隠れ、再読み込み後も隠れたまま。pageerror 0件 | 自動 |
| TS-0002-V04 | T-E5 | 通信を記録 | 全要求の宛先 | http の宛先は www.youtube.com だけ。確認前後で要求が増えない | 自動 |
| TS-0002-V05 | T-E3 | 既存2件 | 変更なしで実行 | 合格（グラフのクリック・縦線も） | 自動 |
| TS-0002-V06 | T-E4 | 視聴ページ取得を route.abort | 解析 | data-view が error、想定外の全文と完全一致、英語を含まない、pageerror 0件（test_unexpected_error_shows_fixed_message） | 自動 |
| TS-0002-V07 | M-1,M-2 | 新しい Chrome プロファイル | git clone／ZIP で README.txt の手順どおり読み込む | 読み込めてボタンが出る | 手動（品質保証課・運用係） |
| TS-0002-V08 | M-3,M-4 | 実機 | 案内の確認・ダークテーマ・2タブ／設定画面の開示を明暗で確認 | 読める。他タブでも隠れる | 手動 |
| TS-0002-V09 | M-5,M-7 | 実機 | 保存キーの確認と削除の前後／長いエラー文の折り返し | キーは chat_・seen_・hlxNoticeAck、sync は hlxSettings だけ。削除で消えるのは chat_・seen_ だけ | 手動 |
| TS-0002-V10 | M-6 | — | T-E4 の自動テストで代用済み | 実機確認は任意 | 手動（任意） |

### 文書確認（実施済みはView係・開発課長が実行）
DC-01（hlx-ext 0件）、DC-02、DC-04、DC-05、DC-06（禁止語 0件）、DC-07、DC-09（fetch( は fetcher.js の3件）、DC-13（README.txt と manifest が 1.2.0）、DC-15（UTF-8 BOM・CRLF のまま）、DC-16（innerHTML 0件）：すべて合格。DC-08（manifest 差分なし）・DC-12（shared・analyzer.js の差分なし、適合テスト合格）：開発課長が確認し合格。DC-03・DC-14（README.md・LICENSE）は #7 の回答待ちで未実施。

## 修正前に落ちたこと
- Model：実装前の fetcher.test.js は pass 4 / fail 9（M01〜M10 の新規分）。
- ViewModel：変更前の videoid.js に差し替えると新テスト8件すべて失敗。
- View：E2E は3係がそろってから実行（案内の要素が無い状態を作る前提がないため、修正前の失敗は確認していない）。

## 受け入れ基準との対応
A-07 → V01・V02・V05・VM01、A-08 → V03・VM01・VM02、A-09〜A-12 → 文書確認・V08・V09、A-13 → M01〜M04・M10、A-14 → M07、A-15 → M02・M05・M06、A-16 → M08・M09・VM03〜VM08・V06、A-17 → DC-08、A-18 → V04・DC-09、A-19 → M11・VM07・VM09、A-20 → V05、A-21 → DC-12、A-22 → DC-13。A-05・A-23（README.md・LICENSE）は #7 回答待ち。

## 実行方法
- 速いテスト：node --test "tests/unit/*.test.js"（49件合格、2026-10-30）
- 重いテスト：python -m unittest discover -s tests/e2e -v（4件合格、2026-10-30）
- 共通指標仕様：python shared/reference/metrics_ref.py --check（合格）
