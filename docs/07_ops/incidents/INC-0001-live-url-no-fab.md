---
status: review
author: chrome-ops-kacho
reviewer: ―
---
# INC-0001 /live/<ID> 形式のURLで「見どころ」ボタンが出ない

| 項目 | 内容 |
|---|---|
| 発見 | 2026-10-30 定期スモークテスト（運用記録 docs/07_ops/logs/2026-10-30.md） |
| 対象版 | 1.2.0（extension/manifest.json） |
| 深刻度 | 高（配信アーカイブの共有URLで拡張機能が全く使えない） |
| 状態 | 原因特定済み・修正待ち（ブランチ fix/live-url-support、開発課が修正中） |

## 症状
- https://www.youtube.com/live/fPnkoOtQIyE を開くと、右下の「見どころ」ボタンが出ない（表示サイズ 0×0）。
- パネルは画面の右外（x=1589、画面幅1584）に隠れたまま。パネル内の「このアーカイブを解析」を操作しても解析は始まらず、状態は変わらない。
- エラー文言の表示はなし。コンソールにも出力なし（例外で落ちているのではなく、設計どおり「動画ではない」と判定されている）。

## 再現手順（2026-10-30 約21時、このPC、Claude in Chrome で再現済み）
1. 拡張機能（1.2.0）を読み込んだChromeで https://www.youtube.com/live/fPnkoOtQIyE を開く（動画ID fPnkoOtQIyE、長さ2:24:23）。
2. 右下に「見どころ」ボタンが出ないことを確認する。
3. 比較: 同じ動画を https://www.youtube.com/watch?v=fPnkoOtQIyE で開くと、ボタンが出て、解析（コメント574件、見どころ候補20か所）が正常に動く。

## 原因
- extension/content.js 31行目 `currentVid` が `location.pathname === '/watch'` のときだけ動画IDを返す。/live/<ID> は YouTube が /watch に変換しないため null になる。
- null のとき、441〜443行目の `onNav` で `fab.style.display = 'none'`、`S.vid = null`、パネルを閉じる、の順に処理されるため、ボタンもパネルも使えない。
- 呼び出し元は `onNav`（442行目）と、ツールバーのアイコン押下を受ける `hlx-toggle` ハンドラ（511行目）。後者も `currentVid()` が null だと何もしない。

## 影響範囲（コードを読んで整理。実機での確認はしていない）
| 箇所 | 状況 |
|---|---|
| content.js 31行目 `currentVid` | 不具合の本体。/live/<ID> のほか /shorts/<ID>・/embed/<ID> も null |
| content.js 442行目 `onNav`（ボタン表示、解析対象の切り替え、キャッシュ `chat_<ID>` の読み出し） | currentVid に依存。修正で自動的に直る |
| content.js 511行目 `hlx-toggle`（ツールバーのアイコンでパネルを開閉） | currentVid に依存。同上 |
| content.js 466〜468行目 SPA遷移 | `yt-navigate-finish` と、1秒ごとの `location.href` 比較の両方で `onNav` を呼ぶ。href 全体を比べるので /live/ ↔ /watch の遷移でも検知できる。判定が currentVid だけなので修正で追従する見込み |
| extension/manifest.json の matches | `https://www.youtube.com/*` で /live/ も含む。注入は問題なし（ボタン要素は作られているため確認済み）。変更不要の見込み |
| extension/fetcher.js | URL形式に依存しない。動画IDから `/watch?v=<ID>` を自前で取得する（121行目）。location.origin 以外にパスへの依存なし |
| manifest の action.default_title | 「YouTubeの動画ページで押すと…」。文言のみ、動作には影響なし |
| extension/README.txt、options.html、background.js | URL形式の記述・依存は見つからなかった |
| tests/e2e/test_extension_e2e.py | 177行目で /watch?v= のみを開く。/live/ は検知できていない（テストの穴） |
| ops/smoke-urls.txt | 5本すべて /live/ 形式。修正されるまで、2本目以降も同じ症状になる |

## 修正方針の案（実装は開発課）
- `currentVid` で、/watch?v=<ID> に加えて /live/<ID> からも動画IDを取る。
- /shorts/<ID> は、チャットリプレイを持たない短尺動画なので対象に含めるかどうかを決める。含める場合は、チャットがない場合の表示が出るか確認が要る。含めない場合は、今のとおりボタンを出さない。
- /embed/<ID> は、拡張機能の matches が www.youtube.com で、埋め込みは別ドメイン内のため、対象外でよい見込み。
- ID の形式（英数字・- ・_ の11文字）を確認してから使う。

## 再発防止
- E2E テストに /live/<ID> 形式のURLを開く場合を追加する（品質保証課・開発課）。この不具合は現状の自動テストでは検知できない。
- 速いテストで、URLから動画IDを取り出す処理を単独で検証できるようにする（例: /watch?v=、/live/、/shorts/、その他のパス）。
- 修正後、運用係が ops/smoke-urls.txt の /live/ URL で実配信を再確認し、運用記録に追記する（保守運用課）。

## 経過
| 日時 | 内容 |
|---|---|
| 2026-10-30 約21時 | 定期スモークテストで発見。再現を確認 |
| 2026-10-30 | 部長に報告。社長が修正を承認。障害記録を作成 |
| 未定 | 修正のマージ後、実配信（/live/ URL）で再確認し、本書を approved にして閉じる |
