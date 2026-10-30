---
status: approved
作成者: chrome-research-triage（仕分け係）
確認日: 2026-10-30
reviewer: chrome-research-kacho（2026-10-30 承認）
---

# ライブラリ・API 仕分け表（in Chrome版）

仕分け係が管理します。2026-10-30 に初版（暫定）を、確認できた事実で更新しました。
- 区分は 採用中 / 候補 / 見送り / 禁止 の4つ。
- 「ライセンス注意」は、GPL・AGPL・商用制限・APIキー必須のいずれかに当たるもの（CLAUDE.md 6章で社長判断の対象）。
- 確かめていないことは「未確認」と書く。確認日はすべて 2026-10-30。
- 前提（出典: Chrome for Developers）: Manifest V3 では CDN 上のコードを読み込めず、ライブラリは拡張機能のパッケージに同梱する。https://developer.chrome.com/docs/extensions/develop/migrate/improve-security

## 1. 製品で使っているもの
extension/ を読んで確認（外部ライブラリの import・CDN 参照・ffmpeg への言及は見つからない）。manifest.json の permissions は storage と unlimitedStorage のみ、版数は 1.2.0。

| 名前 | 区分 | 用途 | ライセンス | 版数・最終更新 | Windows | サイズ・オフライン | 判断の理由・備考 | 出典 |
|---|---|---|---|---|---|---|---|---|
| 外部ライブラリ | なし | ― | ― | ― | ― | 素の JavaScript。ビルド不要、CDN不使用、完全オフライン | グラフ描画は content.js が canvas に直接描画（tests/e2e が .hlx-chart の canvas を読む） | extension/manifest.json、tests/e2e/test_extension_e2e.py |
| chrome.storage（local / sync） | 採用中 | チャットの保存、設定 | ブラウザ標準API（個別ライセンスなし） | Chrome 同梱（版数は未確認） | 可（Chrome が動く環境） | 同梱不要・オフライン可 | unlimitedStorage 権限を使用中 | extension/manifest.json |
| chrome.runtime / chrome.action | 採用中 | 設定ページを開く、ツールバーのアイコン | 同上 | 同上 | 可 | 同梱不要・オフライン可 | | extension/manifest.json |
| content script（Manifest V3） | 採用中 | YouTube のページにパネルを出す | 同上 | manifest_version 3 | 可 | 同梱不要 | 対象は https://www.youtube.com/* | extension/manifest.json |
| YouTube 内部API（get_live_chat_replay） | 採用中・要注意 | チャットリプレイの取得 | YouTube の規約に従う（規約の詳細は未確認） | ― | 可 | ネットワーク必須（YouTube に接続） | 非公開。予告なく変わる可能性があり、運用係が見張る。INC-0001 は /live/<ID> 形式のURLの不具合で修正済み（git ログ） | tests/e2e のモック、git ログ |

## 2. 開発用（配布物に入らないこと）
確認結果: 拡張機能の配布物は extension/ の中身で、manifest.json が読み込むのは analyzer.js、fetcher.js、viewmodel/videoid.js、content.js、panel.css のみ。ffmpeg・imageio・Playwright を参照する記述は extension/ 内に無い（Grep で確認）。ffmpeg を呼ぶのは tests/e2e/test_extension_e2e.py の make_video() だけで、一時フォルダに test.mp4 を作り、テスト後に削除する。scripts/ は標準ライブラリ（argparse・os・sys・urllib・subprocess）のみで、ffmpeg・Playwright・imageio を使わない。パッケージ化（zip）の手順が scripts/ に見当たらないため、「配布物を zip にする作業で tests/ や仮想環境が混ざらないか」は未確認（リリース手順を担当する課の確認が要る）。

| 名前 | 区分 | 用途 | ライセンス | 版数・最終更新 | Windows | サイズ | 判断の理由・備考 | 出典 |
|---|---|---|---|---|---|---|---|---|
| Node.js のテストランナー（node --test） | 採用中 | 単体・適合テスト（tests/unit） | Node.js 本体は MIT（本体のライセンス表記は今回未確認）。node:test は本体に同梱で追加導入なし | 手元は v26.13.0（2026-10-28、LTS）。node:test は v20.0.0 から安定（Stability 2） | 可（手元のWindowsで動作） | 追加なし | glob パターン指定は引用符で囲んで渡す（CLAUDE.md の書き方と一致）。watch・coverage 等は実験的なので使わない | https://nodejs.org/api/test.html 、https://nodejs.org/dist/index.json |
| Playwright（Python） | 採用中 | E2Eテスト（拡張機能を読み込んだ Chromium を操作） | Apache-2.0（PyPI の license_expression）。商用制限・APIキーなし | 1.64.1（2026-10-22）。Python 3.10 以上が必要。手元に 1.64.1 を導入済み | 可（win_amd64 / win32 / win_arm64 の wheel あり） | wheel 約 38.8 MB（win_amd64）。別途 `python -m playwright install chromium` でブラウザを取得（そのサイズ・ライセンスは未確認） | ライセンスの「暫定」を解消。テスト用のみで配布物に入らない | https://pypi.org/project/playwright/ 、https://pypi.org/pypi/playwright/1.64.1/json |
| imageio-ffmpeg | 採用中・ライセンス注意（開発用に限る） | テスト用の30分の模擬動画づくり（シーク確認用） | パッケージ本体は BSD-2-Clause。同梱の ffmpeg バイナリは別: 手元の ffmpeg-win-x86_64-v7.1.exe は `-version` で `--enable-gpl --enable-version3` と `--enable-libx264` を確認（gyan.dev essentials ビルド）= GPL 版 | 0.7.0（2026-10-28 公開）。Python 3.10 以上 | 可（win_amd64 wheel あり） | win_amd64 wheel 約 31.2 MB（公式ページは全体で約 60 MiB とも記載） | 要点は下の「ffmpeg のライセンスの扱い」。他OS向け wheel の同梱バイナリのライセンスは未確認 | https://pypi.org/pypi/imageio-ffmpeg/json 、https://github.com/imageio/imageio-ffmpeg 、https://ffmpeg.org/legal.html |

### ffmpeg のライセンスの扱い
- FFmpeg は既定では LGPL 2.1 以上。`--enable-gpl` を付けた構成や libx264 等の GPL ライブラリを使うと全体に GPL が及ぶ（出典: https://ffmpeg.org/legal.html）。
- imageio-ffmpeg の公式 README と PyPI は、同梱 ffmpeg の種類やライセンスを書いていない。そのため「LGPL か GPL か」は、手元のバイナリを実際に確認した結果（GPL 版）に基づく。
- 現状の使い方: テストが一時フォルダで実行して動画を作るだけで、バイナリも生成物（test.mp4）も拡張機能に入らず、他人に配布もしていない。この使い方なら GPL 版でも製品のライセンスに影響しない、というのが仕分け係の見立て（法的判断ではない。必要なら社長判断）。
- 守るべきこと: ffmpeg バイナリや test.mp4 を extension/ やリリースの zip、リポジトリ（git）に入れない。入れる案が出たら「ライセンス注意」として社長判断に上げる。
- 逃げ道: imageio-ffmpeg を使わず、システムの ffmpeg（shutil.which）に切り替えられる（make_video() に既にある）。`IMAGEIO_FFMPEG_EXE` 環境変数で別のビルドを指す方法もある（公式 README）。
- 課長確認（2026-10-30）: .gitignore は tests/e2e/_artifacts/ を除外済み。git管理下に mp4・ffmpeg 関連のファイルは無い。リリース zip を作る手順・スクリプトは scripts/ に無い（リリース時に tests/ や仮想環境を含めない手順の整備は、リリースの際に品質保証課へ）。

## 3. 研究の候補
共通の注意: 権限（permissions）の追加は CLAUDE.md 6章により社長判断。ここでの「候補」は、評価を続ける価値がある、という意味で、採用の決定ではない。

### 3-1. Chrome 拡張機能 API
| 名前 | 区分 | 期待する用途 | ライセンス・費用 | 版数・最低Chrome | Windows | サイズ・オフライン | 判断の理由・備考 | 出典 |
|---|---|---|---|---|---|---|---|---|
| chrome.sidePanel | 候補（要・社長判断） | パネルを Chrome 標準のサイドパネルに出す | ブラウザ標準API。費用・APIキーなし | Chrome 114 以上。ドキュメント最終更新 2026-10-29 | ドキュメントに記載なし（未確認）。ただし他OS限定の注記も無い | 同梱不要・オフライン可（パネルのHTMLは拡張機能内のローカルファイルに限る） | `sidePanel` 権限と manifest の `side_panel` が必要で、権限の追加にあたる。`open()` は利用者の操作への応答としてのみ呼べる。パネルの左右は利用者が Chrome の設定で選ぶ。現状の content script（動画ページに重ねる方式）は、シークバーとの連動（.ytp-progress-bar の読み取りなど）を直接DOMで行っており、サイドパネルに移すとページのDOMに触れず、連動の作り直しが要る（見立て。未検証） | https://developer.chrome.com/docs/extensions/reference/api/sidePanel |
| chrome.offscreen（offscreen document） | 候補（要・社長判断） | 拡張機能内で Web Audio を動かす土台 | ブラウザ標準API。費用・APIキーなし | Chrome 109 以上。最終更新 2026-10-29 | ドキュメントに記載なし（未確認） | 同梱不要・オフライン可 | `offscreen` 権限が必要。1拡張機能につき同時に1つ。使えるAPIは runtime のみ。理由 AUDIO_PLAYBACK は音が無い状態が30秒続くと閉じられる。音声を取るには下の tabCapture が別に要る | https://developer.chrome.com/docs/extensions/reference/api/offscreen |
| chrome.tabCapture | 候補（要・社長判断・権限が重い） | タブの音声を取り出し、「声の大きさ」を解析（Web Audio と組み合わせ） | ブラウザ標準API。費用・APIキーなし | `getMediaStreamId` は Chrome 71 以上、Promise 版は 116 以上。最終更新 2026-10-29 | ドキュメントに記載なし（未確認） | 同梱不要・オフライン可（ただし再生中の音を取るので、解析は再生に同期する） | `tabCapture` 権限が必要で、利用者が拡張機能を起動した後（アクションの押下など）にしか呼べない。service worker で得た stream ID を offscreen document で使える（Chrome 116 以降）。アーカイブを自動で全編解析することはできず、再生しながらの解析になる見込み（見立て。未検証） | https://developer.chrome.com/docs/extensions/reference/api/tabCapture |
| Web Audio API | 候補（offscreen・tabCapture とセット） | 音量（RMS等）の計算 | ブラウザ標準API。費用なし | 版数の概念なし（Chrome 同梱）。個別の最低版数は未確認 | 可（Chrome が動く環境） | 同梱不要・オフライン可 | 単体では音声の入手手段にならない。入手は tabCapture に依存する。YouTube のメディアを fetch して直接デコードする方法は、規約・技術面とも未確認なので扱わない | 未確認（今回は MDN 等を参照していない） |

### 3-2. グラフ描画ライブラリ（同梱できるもの）
現状は canvas の自前描画で、外部ライブラリは使っていない。次は「自前描画が限界になったとき」の備え。どちらも CDN からは読めず、ファイルをパッケージに入れる必要がある。サイズは jsDelivr の配布ファイルを実測（minified / gzip）。

| 名前 | 区分 | ライセンス | 版数・最終更新 | 同梱サイズ | 依存 | Windows・オフライン | 判断の理由・備考 | 出典 |
|---|---|---|---|---|---|---|---|---|
| uPlot | 候補 | MIT。商用制限・APIキーなし | 1.6.32（npm 公開 2025-03-14）。約19か月更新が無い点に注意 | uPlot.iife.min.js 約 51 KB（gzip 約 22 KB）。CSS は別に要る（サイズ未確認） | なし | 可・オフライン可（ブラウザ内で完結。Windows固有の制約は無い見込みで、実機の動作確認は未実施） | 軽量・canvas 2D。長い時系列に向く。更新が止まり気味なのでメンテ面は注視。導入するなら版を固定して同梱 | https://github.com/leeoniya/uPlot 、https://registry.npmjs.org/uplot/latest |
| Chart.js | 候補（優先度低） | MIT。商用制限・APIキーなし | 4.6.1（npm 公開 2026-10-22。GitHub の Latest も v4.6.1） | chart.umd.min.js 約 210 KB（gzip 約 71 KB） | @kurkle/color（同梱に含まれる） | 可・オフライン可（実機の動作確認は未実施） | 機能は多いが uPlot の約4倍のサイズ。このツールのタイムライン（縦線・点線・マーク）は自前描画との相性で、導入の利点は薄い見立て | https://registry.npmjs.org/chart.js/latest 、https://github.com/chartjs/Chart.js/releases |

- 仕分けの方針: 今はどちらも採用しない。自前の canvas 描画に不具合や保守の負担が出たときに、uPlot を第一候補として試作（融合開発係）で評価する。
- 未確認: CSP（content script での動作）、Shadow DOM 内での動作、拡大縮小・マーク重ね描きの適合。

## 4. 見送り・禁止
| 名前 | 区分 | 理由 | 出典 |
|---|---|---|---|
| CDN からのスクリプト読み込み（unpkg・jsDelivr など） | 禁止 | Manifest V3 は外部ホストのコードを禁じる。ライブラリは同梱 | https://developer.chrome.com/docs/extensions/develop/migrate/improve-security |
| ffmpeg バイナリ・動画ファイルの配布物への同梱 | 禁止（ライセンス注意） | 手元の ffmpeg は GPL 構成。入れると配布物に GPL の義務が及ぶ恐れ（法的判断は未実施） | 上記「ffmpeg のライセンスの扱い」 |
| 該当なし（見送りに仕分けた外部ライブラリ） | ― | 今回の調査範囲では、見送りに値する具体的なライブラリは出ていない | ― |

## 5. 今回の未解決・次回の宿題
- Playwright が取得する Chromium のサイズ・ライセンス（未確認）。
- リリース zip の作り方（scripts/ に手順なし。.gitignore は確認済み）。
- sidePanel・offscreen・tabCapture の Windows での動作（公式に記載なし。試作で確認が必要）。
- Node.js 本体のライセンス表記の一次確認（今回は node:test と版数のみ）。
- 変更履歴: 2026-10-30 初版（暫定）を更新。開発用依存のライセンスの「要確認」を解消（ただし imageio-ffmpeg の同梱 ffmpeg は GPL 版のため「ライセンス注意」に変更）。候補3件を仕分け、tabCapture と Chart.js・uPlot の行を追加。
