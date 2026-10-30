---
id: RS-0001
title: Chrome ウェブストア規約との照合（in Chrome版 v1.2.0）
status: approved
author: chrome-research-trends
reviewer: chrome-research-kacho
updated: 2026-10-30
---
# RS-0001 Chrome ウェブストア規約との照合（in Chrome版 v1.2.0）

- 確認日はすべて 2026-10-30。「確認」とは、その日に WebFetch / WebSearch で公式ページの内容を読んだこと。
- 注意：WebFetch は小型モデルによる要約を返すため、条文の細かい言い回しまでは確認できていない。条文の番号・文言を根拠に審査へ出す前に、原文での再確認が必要（本書の「出典」の URL を直接読むこと）。
- 「推測」「未確認」と書いたものは事実ではない。事実はコードを読んだ範囲と、公式ページから読み取れた範囲に限る。
- YouTube へ実リクエストは送っていない。製品コード（extension/）は変更していない。ストアへの申請・登録もしていない。
- 本書は法的助言ではない。YouTube 利用規約の解釈（2章 C-16）は、研究課の範囲を超える部分を「社長判断」として切り出した。

## 0. 先に読む人向けの要旨

| # | 要旨 | 種別 |
|---|---|---|
| 1 | コードを読んだ範囲では、外部ドメインへの送信、リモートコード、eval、innerHTML、解析・広告・トラッキングは見つからなかった。通信先は youtube.com だけ。投稿者名・投稿者IDは保存していない | 事実（grep と全ファイル読み） |
| 2 | プライバシーポリシーは無い（リポジトリ内に該当文書なし）。ストアの User Data FAQ は、端末内保存だけの製品にも方針の掲載を求めると読める | 不足 |
| 3 | 利用者向けの「何を読み、何を保存するか」の開示が画面に無い。ストアは製品内での目立つ開示を求めている（FAQ 10 の要約）。今の画面の文言は「チャットを読み込んで…探します」まで | 不足 |
| 4 | **名称に「in Chrome」が入っている**（manifest の name は「配信 盛り上がり検知 in Chrome」）。課長の依頼文の「入っていない」は事実と違う。ブランド指針は、Google の商標を名称に使うことに Google の書面許可を求める（「Chrome」が対象かは指針の本文に一覧が無く、要確認） | 要確認（社長判断の候補） |
| 5 | YouTube 利用規約には、ボット・スクレイパー等の自動手段によるアクセスを禁じる項目がある（2023-06-01 版の日本語ページ）。この拡張は利用者の操作で、ブラウザ内から YouTube の非公開の取得口へ連続して問い合わせる。これが「自動手段」に当たるかは本調査では判断できない | 要確認（社長判断） |
| 6 | 保存データの暗号化（at rest）をストアの FAQ が求めている（FAQ 9 の要約）。現状 chrome.storage.local に平文で保存。端末内保存に適用されるかは、FAQ が除外していないという以上のことは言えない | 要確認 |
| 7 | 開発者登録は 1回払いの登録料が必要、2段階認証が必須。金額の本文は読めなかった（検索要約では 5 ドルとあるが、本文未確認） | 費用は社長判断 |
| 8 | README.txt はサイドロード手順の説明で、ストア版には載せられない／書き換えが要る | 要対応 |

## 1. 問い・仮説

- 問い：現在の in Chrome版（v1.2.0）を Chrome ウェブストアに出す場合、ストアの規約（Program Policies、User Data FAQ、掲載要件、Privacy practices タブ）と YouTube 側の規約に照らして、何が足りないか。公開前に用意するものは何か。
- 仮説（調査前）：データを外部に出さない設計なので技術面の規約違反は少なく、不足は「書類・開示・名称」に集中する。→ 概ね支持された（2章）。ただし、YouTube 側の規約（C-16）と at rest 暗号化（C-9）は仮説の外にあった。

## 1.5 現状の確認（コードの事実）

読んだファイル：extension/manifest.json、fetcher.js、content.js（全体）、options.js、options.html、background.js、analyzer.js（先頭と末尾、grep）、viewmodel/videoid.js、README.txt、panel.css は未精査（描画のみ。外部URLの有無は grep で確認）。

| 観点 | 事実（ファイル） | 推測・未確認 |
|---|---|---|
| 権限 | `permissions: ["storage","unlimitedStorage"]`。`host_permissions` なし。content_scripts の `matches` は `https://www.youtube.com/*` のみ。js は analyzer.js / fetcher.js / viewmodel/videoid.js / content.js、css は panel.css、`run_at: document_idle`（manifest.json） | |
| 外部送信 | `fetch` は fetcher.js の3か所だけ。URL はすべて `location.origin` 起点（`/watch?v=`、`/live_chat_replay?continuation=`、`/youtubei/v1/live_chat/get_live_chat_replay`）。`XMLHttpRequest`・`sendBeacon`・`WebSocket`・`<img src>` での外部送信、`http(s)://` の固定URLは extension/ 内に見つからなかった（Grep の結果。panel.css の url() は未精査） | 実際の通信は未計測（ブラウザで DevTools の確認はしていない） |
| 資格情報 | 3か所とも `credentials: 'omit'`（Cookie を付けない）。ただし POST に `X-Goog-Visitor-Id`（ページHTMLの `INNERTUBE_CONTEXT` から読んだ値）と、ページHTMLから読んだ `INNERTUBE_API_KEY`／`INNERTUBE_CLIENT_VERSION` を付ける（fetcher.js 147〜161行）。送り先は youtube.com だけ | この visitorData が端末の識別子に当たる可能性はある（推測）。ただし YouTube 自身のページが既に持つ値を YouTube に返しているだけ |
| リモートコード | `eval`・`new Function`・`importScripts`・動的 `<script>` 生成・`document.write` は見つからなかった。利用者が設定画面で書く「検知するワード」は `new RegExp` に渡る（analyzer.js）が、これは文字列のパターンで、コードとして実行されない | |
| innerHTML | `innerHTML`・`insertAdjacentHTML` は見つからなかった。画面は `textContent` と `createElement` で作っている（content.js `el()`）。チャット本文はタイプ0〜1のとき `text` として保存され、表示時は `textContent` 系で描画（content.js 243行 `chips`、400〜402行の tooltip） | |
| 難読化 | なし（平文のJS） | ビルド・minify は無い |
| 解析・広告・トラッキング | 見つからなかった | |
| chrome.storage.local | `chat_<動画ID>` = `{ info:{id,title,channel,duration,heatmap}, items:[[秒, 種別(0=通常 1=有料 2=メンバー), 本文]…], at }`。`seen_<動画ID>` = 確認済みにした見どころの開始秒の配列（content.js 156〜170行、231行、fetcher.js 94〜99行・130〜136行） | 5時間配信1本あたりの実サイズは未計測（設定画面は MB 表示する） |
| 保存する本文 | 通常コメントと有料コメントの**本文**（切り詰めなし、fetcher.js 97行）。メンバー系（種別2）は本文を空にして保存。**投稿者名・チャンネルID・アイコン・金額は保存していない**（`items.push([秒, 種別, 本文])` のみ）。`info.channel` は配信者名（動画の `author`）で、視聴者ではない | 本文に視聴者が自分の名前・個人情報を書いている場合は保存されうる（推測。内容は制御できない） |
| chrome.storage.sync | `hlxSettings`（minSpeed / binSec / topN / leadSec / keywords）。keywords は利用者が編集する文字列（options.js、content.js 27行） | Chrome の同期を有効にしていれば Google アカウントを通じて同期される（storage.sync の一般的な動作。公式FAQでも sync に言及） |
| クリップボード | 「リストをコピー」を押したときだけ `navigator.clipboard.writeText`。内容は動画タイトル、見どころの時刻・理由、頻出コメント上位3件の本文と回数（content.js 428〜438行） | `clipboardWrite` 権限は宣言していない。利用者のクリック内なので動く見込みだが、ストア版での動作は未確認 |
| background.js | メッセージ中継のみ（アイコン押下 → `hlx-toggle`、`hlx-open-options` → 設定ページを開く）。状態を持たない | |
| 常駐 | content script は youtube.com の全ページで読み込まれ、`buildUI()` で動画ボタン(fab)とパネルを body に追加（動画ページ以外では fab を非表示）。1秒ごとの `setInterval` が2本、`mousemove` リスナーが常時動く（content.js 463〜504行） | 他ページでの性能影響は未計測 |
| 取得の頻度 | 1ページずつ順に取得（並列なし）。成功時の待機は無し、失敗時は再試行で待つ（fetcher.js 162〜185行）。上限 `guard > 50000` ページ | 実配信での実リクエスト数は未計測（本調査では YouTube に送っていない） |
| 利用者向け説明 | README.txt は zip を解凍して「デベロッパーモード」で読み込む手順。「チャットは YouTube の非公開の仕組みで読み込んでいます。仕様変更で動かなくなることがあります」と明記。プライバシー（外部へ送らない／端末に保存する／削除方法）の記述は、削除の機能（設定画面の「保存したチャットをすべて削除」）は README に無い | |
| 設定画面 | options.html に保存チャットの件数・容量と削除ボタンがある（options.js 50〜63行）。プライバシーに関する説明文は無い | |
| README と manifest の食い違い | README は「ver 1.2」、manifest は 1.2.0（一致）。README の使い方「1マス30秒」は analyzer の `binSec` 既定30と一致。README は「配信 盛り上がり検知」と呼ぶ（manifest name は末尾に「in Chrome」付き） | |

## 2. 規約と現状の照合

判定の記号：適合／不足／要確認／未確認。「推測」と書いたものは根拠が推測。

### 2.1 照合表

| ID | 規約の項目 | 現状（コードの事実） | 判定 | 対応案 | 出典・確認日 |
|---|---|---|---|---|---|
| C-1 | 単一目的（拡張は1つの狭い目的を持つ） | 目的は「アーカイブのチャットから盛り上がり場面を探して一覧・グラフ・シークバーの印で見せる」。コピー・設定・保存も同じ目的の内側にある（推測） | 適合（推測） | 説明文案 4(c) | https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq 2026-10-30 |
| C-2 | 権限の最小化。使わない権限を要求しない | `storage` は使用中。`unlimitedStorage` は保存チャットを 10MB 超で持てるようにするため（動向レポートで local は10MB上限と確認）。実際の1本あたりの容量は未計測 | 要確認 | 5時間配信1本の `chat_` の大きさを測り、10MBを超えうる根拠を権限の説明に書く。超えないなら `unlimitedStorage` の削除を検討（権限の削除は権限の変更なので社長判断の対象） | https://developer.chrome.com/docs/webstore/program-policies/policies 2026-10-30、https://developer.chrome.com/docs/extensions/reference/api/storage（動向レポート 2026-10-30） |
| C-3 | ホスト権限・content script の範囲 | `host_permissions` なし（良い）。`matches` は `https://www.youtube.com/*` の全ページ。ストア審査は広いホスト権限で審査が長引くとしている（`youtube.com` 1サイトは「広い」には当たらない見込み＝推測）。Quality Guidelines FAQ は「全ページに UI を差し込むツールバー」を非推奨とする。この拡張のボタンは動画ページ以外では非表示だが、DOM には常に追加される | 要確認（推測の注意点） | `matches` を `/watch*` に絞ると、YouTube のページ遷移（画面を作り直さない）で拡張が起動しなくなる恐れがあるため、絞るかは設計判断。説明は「動画ページ（/watch・/live/）で動くため」と書く | https://developer.chrome.com/docs/webstore/review-process 、https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq 2026-10-30 |
| C-4 | リモートホストコード禁止（MV3） | 拡張内のコードのみ実行。外部スクリプト・eval なし。YouTube のページから読む `INNERTUBE_*` は「データ」で、実行しない | 適合 | Privacy practices の Remote Code は「いいえ」 | https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements 2026-10-30 |
| C-5 | 難読化の禁止・コードの読みやすさ | 平文のJS、ビルドなし | 適合 | 公開 zip にビルド生成物を足さない | 同上、https://developer.chrome.com/docs/webstore/review-process 2026-10-30 |
| C-6 | プライバシーポリシー（ユーザーデータを扱う製品は掲載し、ダッシュボードに URL を書く） | 文書なし。FAQ（要約）は、データを端末内にだけ保存する製品でも、また Chrome Storage Sync だけを使う製品でも、方針の掲載を求めるとしている | 不足 | 4(a) の案で作成し、公開URLを用意する（置き場所は社長判断） | https://developer.chrome.com/docs/webstore/program-policies/user-data-faq 、https://developer.chrome.com/docs/webstore/program-policies/privacy 2026-10-30 |
| C-7 | 目立つ開示（Disclosure Requirements）。製品内で、収集するデータの種類と使い方を示し、利用者の操作で同意を得る。方針ページや掲載文だけでは足りない（FAQ 10 の要約）。2026-08-01 施行の更新で、目的に近いデータでも明示が必要と強調された | 画面には「この配信のチャットを読み込んで、盛り上がった場面を探します。」とだけある。保存すること・外部へ送らないこと・削除方法は画面に無い。解析ボタンは利用者の操作ではある | 不足 | 初回表示の説明（または解析ボタンの近くの常設文）と、設定画面の説明を追加（要件定義が必要。社長判断の対象の「使い方の変更」に当たるか部長が判断）。4(a)(b) の文言を流用できる | https://developer.chrome.com/docs/webstore/program-policies/user-data-faq 、https://developer.chrome.com/blog/cws-policy-updates-2026 、https://developer.chrome.com/docs/webstore/program-policies/policies 2026-10-30 |
| C-8 | Limited Use（収集は単一目的に必要なものだけ／広告・販売・人の閲覧の禁止）。公開の声明を方針ページ等に載せる | 外部送信なし・広告なし・解析なし（コードの事実）。投稿者情報は保存していない。目的外の利用は見つからない | 適合（コード上）／声明は不足 | 方針ページに Limited Use への準拠を書く（4(a)） | https://developer.chrome.com/docs/webstore/program-policies/user-data-faq 、https://developer.chrome.com/blog/cws-policy-updates-2026 2026-10-30 |
| C-9 | 保存時の暗号化（FAQ 9：強い暗号方式で保存）と通信の暗号化 | 通信は https のみ（YouTube 宛て）。保存は `chrome.storage.local` に平文。FAQ は端末内保存を除外すると書いていないが、適用範囲を明示してもいない | 要確認 | ストアの審査での扱いは不明。実装で暗号化するなら鍵管理の設計が要る（拡張内に鍵を持つと実質的な保護にならない＝推測）。まずは課長・部長で、「端末内のみ・投稿者情報なし・公開コメントのみ」を方針ページに明記し、審査の指摘が出たら対応する運用でよいか判断 | https://developer.chrome.com/docs/webstore/program-policies/user-data-faq（WebFetch 2回目の要約） 2026-10-30 |
| C-10 | 収集の最小化（FAQ 9：必要最小限） | 本文は切り詰めずに全件保存（fetcher.js 97行）。解析で使うのは正規化した先頭30文字（analyzer.js `hlxNormalize`）とキーワード判定。「リストをコピー」の頻出コメントは `h.top`（解析結果）から出る | 要確認（推測） | 全文保存が必要な理由があるか（共通指標仕様 shared/ の定義で本文を切り詰めない決めがあるのか）を要件側で確認。fetcher.js のコメントには「共通指標仕様書 2.4」とあるが、shared/ は本調査では読んでいない | 同上 |
| C-11 | 保存するデータの種類の申告（Privacy practices） | 4(b) 参照 | 要確認 | 4(b) の案 | https://developer.chrome.com/docs/webstore/cws-dashboard-privacy 2026-10-30 |
| C-12 | メタデータの正確性（説明・スクリーンショット・Privacy 欄が実際の挙動と食い違うと削除の可能性） | 説明は manifest の description と README の記載が土台。README は「ブラウザだけで数分」「5時間の配信で数分」と、速度の目安を書いている（未計測の数字の可能性） | 要確認 | 掲載文の数値は実測した範囲だけにする | https://developer.chrome.com/docs/webstore/program-policies/listing-requirements（最終更新 2024-07-10） 2026-10-30 |
| C-13 | 名称と Google の商標：名称・ロゴに Google の商標や紛らわしい名称を使うには書面許可が要る。互換を示す表現は「for」「compatible with」＋ ™ | manifest の name は「配信 盛り上がり検知 in Chrome」。パネルの見出しも「盛り上がり検知 in Chrome」。アイコン（icons/）は未確認（中身を見ていない） | 要確認（不足の可能性が高い＝推測） | 名称から「in Chrome」を外す案（内部の呼び名として残す）。またはストア上の名称は「配信 盛り上がり検知」とし、説明に「Google Chrome™ 向け」と書く。名称変更は使い方・見え方の変更で、社長判断の候補。「Chrome」が指針の対象の商標に含まれることは、ブランド指針のページ本文には一覧が無く、一般に Chrome が Google の商標であるという前提に立つ（未確認） | https://developer.chrome.com/docs/webstore/branding 2026-10-30 |
| C-14 | YouTube の名称・なりすまし：YouTube／Google の公式であるかのような表現、承認の主張は不可 | 名称に YouTube は無い。manifest の description に「YouTube配信アーカイブ」とある（事実の記述）。アイコンの絵柄は未確認 | 適合（推測）／アイコンは未確認 | 掲載文に「YouTube は Google LLC の商標です。本拡張は YouTube が提供・承認したものではありません」を入れる（YouTube API Services のブランド規定は API クライアント向けで、直接の義務ではない＝推測。帰属の記載は慎重策） | https://developer.chrome.com/docs/webstore/program-policies/policies（Impersonation & IP）、https://developers.google.com/youtube/terms/developer-policies 2026-10-30 |
| C-15 | 第三者サイトの利用：ログイン・有料の制限の回避は不可。第三者のネットワーク・サーバーの運用を妨げない | `credentials:'omit'` で未ログインとして取得。限定公開・メンバー限定は取れずにエラー表示（fetcher.js 141行）で、制限の回避はしていない。取得は直列で並列なし。ただし成功時の待機は無く、長い配信では数千リクエストが連続する可能性（推測。未計測） | 適合（制限の回避なし）／負荷は要確認 | 実配信での実リクエスト数を運用係に測ってもらい、必要なら間隔を入れる（開発課の変更） | https://developer.chrome.com/docs/webstore/program-policies/policies 2026-10-30 |
| C-16 | YouTube 利用規約（2023-06-01 版の日本語ページ）：(1) ボット・スクレイパー等の自動手段によるアクセスは、検索エンジンの例外か事前の書面許可がなければ禁止。(2) 本サービスの一部の利用・複製・改変は、許可されたもの以外は禁止。(3) 氏名やユーザー名など個人を特定しうる情報の収集は、本人の同意か (1) の例外がない限り禁止。※ページの最終改訂日は WebFetch の報告に基づく。現在の版かは未確認 | この拡張は、利用者がボタンを押したときだけ、利用者のブラウザ内から YouTube が配信ページ用に使う内部の取得口（yt-dlp も同じ手順）へ問い合わせる。投稿者名・IDは取らない（事実）。これが (1) の「自動手段」に当たるか、(2) に当たるかは、本調査では判断できない | 要確認（社長判断） | 法的な判断は研究課の範囲外。選択肢は4(f)。README が既に「非公開の仕組みで読み込んでいる」と書いているので、ストア掲載文でも隠さない（隠すとストアの「正確なメタデータ」に反する） | https://www.youtube.com/t/terms 2026-10-30 |
| C-17 | YouTube API Services 利用規約・開発者ポリシー（2026-10-15 最終更新と WebFetch が報告） | これらは YouTube API Services を使う API クライアント向け。この拡張は API キーを自分で取得して使うのではなく、ページ内の値を使う。したがって直接の適用対象ではない見込み（推測）。ただし、同ポリシーは非 API の手段によるデータ取得や未公開 API の利用を禁じる内容（III.I.14、III.D.7 と要約）で、YouTube 側の姿勢を示している | 要確認 | 適用外と断定しない。C-16 とあわせて社長判断 | https://developers.google.com/youtube/terms/developer-policies 、https://developers.google.com/youtube/terms/api-services-terms-of-service 2026-10-30 |
| C-18 | 最小機能・壊れた機能は不可 | YouTube の仕様変更で取得が止まると「壊れた機能」になりうる（動向レポート 3.2）。エラー文は利用者向けに出る（fetcher.js） | 要確認（運用） | 壊れたときの表示と、掲載文の注記は 4(f) | https://developer.chrome.com/docs/webstore/program-policies/policies（Minimum Functionality）2026-10-30 |
| C-19 | 2026-08-01 施行の更新：(a) 単一目的に厳密に必要なデータだけ (b) 明示の強化と、変更時の通知 (c) 予測市場の禁止 (d) AI の安全策の回避の禁止 | (c)(d) は該当しない。(a)(b) は C-7・C-8・C-10 | 一部不足 | 同上。将来、保存項目を増やす場合は利用者への通知が要る（設計の制約） | https://developer.chrome.com/blog/cws-policy-updates-2026 2026-10-30 |
| C-20 | 掲載の必須項目：説明、カテゴリ、言語、アイコン 128x128、スクリーンショット 1280x800 を1枚以上。販促画像は任意 | icons/icon128.png はある（中身は未確認）。スクリーンショット・説明文・カテゴリは未作成 | 不足 | スクリーンショットは YouTube の画面を含む。YouTube サービスの無加工スクリーンショットは「説明・情報提供」目的で使える（ブランド指針の要約）。実配信の画面を使う場合は、配信者の許諾・肖像の扱いを要確認（本調査の範囲外。コメント本文や配信者名が写る場合の扱いは社長判断） | https://developer.chrome.com/docs/webstore/cws-dashboard-listing 、https://developer.chrome.com/docs/webstore/branding 2026-10-30 |
| C-21 | キーワードの詰め込み、匿名の推薦文の禁止 | 掲載文は未作成 | ― | 4(e) | https://developer.chrome.com/docs/webstore/program-policies/listing-requirements 2026-10-30 |
| C-22 | 開発者アカウント：2段階認証が全開発者アカウントで必須（公開・更新の前）。連絡用メールの確認。公開者名の設定 | 未着手（本調査では確認できない） | 要対応 | 社長のアカウントで準備 | https://developer.chrome.com/docs/webstore/program-policies/policies 、https://developer.chrome.com/docs/webstore/set-up-account 2026-10-30 |
| C-23 | 登録料（1回払い） | 未払い（推測。本調査では確認できない） | 費用（社長判断） | 金額は 2.3 | https://developer.chrome.com/docs/webstore/register 、https://developer.chrome.com/docs/webstore/program-policies/terms 2026-10-30 |

### 2.2 補足：ストアが他社サイトを加工する拡張を扱う際の注意（公式文書にあるもの）

- Quality Guidelines FAQ「Interacting with or Modifying Third-Party Websites」は、設定の変更（ホーム・検索など）と、全ページへの UI 差し込みを主に扱う。この拡張が当たるのは、後者の「全ページに UI を差し込む拡張は推奨されない」の趣旨だけ（C-3）。YouTube のような他社サイトの加工そのものを禁じる条文は、読んだ範囲に無かった。
- Program Policies（要約）は、ログイン・有料の制限を回避する手助けと、第三者のネットワーク・サーバーの運用を妨げることを禁じる。C-15 に反映。
- 出典：https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq 、https://developer.chrome.com/docs/webstore/program-policies/policies 2026-10-30

### 2.3 費用・期間の事実

| 項目 | 事実 | 出典・確認日 |
|---|---|---|
| 登録料 | 1回払い。公開前に支払いと開発者契約への同意が必要。契約書は「金額は Google の裁量で決める」とだけ書き、**金額は公式ページの本文で確認できなかった**。WebSearch の要約には「5ドル」とあるが、その根拠のページ本文は読めていない（**未確認**） | https://developer.chrome.com/docs/webstore/register 、https://developer.chrome.com/docs/webstore/program-policies/terms 2026-10-30 |
| 2段階認証 | 全開発者アカウントで必須（公開・更新の前）。要約による | https://developer.chrome.com/docs/webstore/program-policies/policies 2026-10-30 |
| 審査期間の目安 | 多くは数日、数週間かかる場合もある。3週間を超えたら開発者サポートへ連絡。広いホスト権限・強い権限・新規開発者・コードの量・過去の拒否があると長引く | https://developer.chrome.com/docs/webstore/review-process 2026-10-30 |
| 連絡用メール | 登録時に設定。後から変更できず、変えるには新アカウントと移管が必要 | https://developer.chrome.com/docs/webstore/register 2026-10-30 |

## 3. 試作・計測（手順・結果）

試作・計測は行っていない。理由：本件は規約の読み取りとコード読みであり、YouTube への実リクエストを禁じられているため。未実施の確認を次に示す。

| 確認 | 目的 | 担当（案） |
|---|---|---|
| 5時間級のアーカイブ1本の `chat_` の保存サイズと、取得リクエスト数・所要時間 | C-2（unlimitedStorage の要否）、C-15（負荷）、C-12（速度の記載） | 運用係（実配信の確認）。取得そのものは運用係の既存手順 |
| 拡張を読み込んだ状態の DevTools の Network で、youtube.com 以外への通信が無いこと | C-8 の裏付け（コード読みの結論を実測で確認） | テスト係（模擬YouTubeのE2Eに「外部ドメインへの通信なし」の確認を足す案） |
| `panel.css` に外部の `url()` が無いこと、icons の中身 | C-13・C-14・外部通信の網羅 | 本係で次回（画像の中身は目視が要る） |
| 「リストをコピー」がストア版（Chrome 通常のプロファイル）で動くこと | `clipboardWrite` を宣言していないため | テスト係 |

## 4. 製品に入れる場合の影響（公開準備物）

### 4(a) プライバシー方針

- 要否：要（C-6）。端末内保存だけでも掲載が求められる（FAQ の要約）。Chrome Storage Sync を使うので、その旨も書く。
- 公開URLが要る。ダッシュボードの欄に URL を書く。Limited Use の声明は、製品の公式ページかその1クリック先に載せる必要がある（FAQ の要約）。置き場所（例：GitHub リポジトリの文書・GitHub Pages・別のWebページ）は**社長判断**。
- 載せるべき事項の案（コードの事実に基づく。公開前に事実確認が要る）：

  1. 事業者名と連絡先（社長が決める。個人情報になるため本調査では案を出さない）
  2. この拡張が何をするか：利用者が開いた YouTube のアーカイブ動画のチャットリプレイを読み、盛り上がった場面を探す。
  3. 読み取る情報：動画ページの情報（動画ID・タイトル・配信者名・長さ・「よく再生された部分」のデータ）と、チャットのコメント本文・時刻・種別（通常／有料／メンバー系）。コメントの投稿者の名前・ID・アイコン・金額は読み取って保存しない。
  4. 保存する情報と場所：利用者の端末の Chrome の拡張機能用ストレージ（storage.local）にチャットの本文と時刻、見どころの確認済み印。設定は storage.sync（Chrome の同期を有効にしていれば、利用者の Google アカウントを通じて同期される）。
  5. 外部への送信：開発者のサーバーや第三者へは送らない。通信先は YouTube だけ（動画ページとチャット取得のため）。Cookie などの認証情報は付けない。
  6. 第三者への提供・販売・広告への利用・解析ツールの利用：しない。人が読むことは、利用者本人以外にない。
  7. 削除方法：設定画面の「保存したチャットをすべて削除」。拡張機能を削除すれば端末内のデータも消える。
  8. 変更時の通知：保存する項目や使い方を変えるときは、利用者に知らせる。
  9. Limited Use への準拠の声明（ストアの Limited Use 要件に従う）。
  10. 「リストをコピー」はクリップボードに利用者の操作でだけ書き込む。
  11. 子どもを対象にしない、等の一般項目は、社長が決める事項で、本調査は案を出さない。

### 4(b) Privacy practices タブ（現状コードに基づく記入案）

注意：ダッシュボードの「データ種別」のチェック項目の名称は、公式ページの本文で一覧を確認できなかった（**未確認**）。下表は User Data FAQ が挙げる分類で書いた。実際の画面で名称を合わせること。

| 欄 | 記入案 | 根拠・要確認 |
|---|---|---|
| データ種別 | 「ウェブサイトのコンテンツ」にチェック（チャット本文を読み、端末内に保存するため）。FAQ は「ページ内容のスクレイピング」を取り扱いに含めるとしている。 | 「ウェブ閲覧履歴」：動画IDを保存キーに使い、どの動画を解析したかが端末内に残る（利用者自身の操作）。チェックするかは要確認（保守的にはチェック）。「個人を特定できる情報」「コミュニケーション」：投稿者情報は保存しないのでチェックなし（ただしコメント本文に利用者が自分で個人情報を書いた場合は保存されうる＝推測）。「ユーザーの操作」：見どころの確認済み印を端末内に保存するが、行動追跡ではない。チェックの要否は要確認 |
| 利用目的 | 単一目的（盛り上がり場面の検出）のためにのみ使用 | |
| 第三者への販売・転送 | 承認済みの用途以外でユーザーデータを第三者に販売・転送しない | |
| 無関係な目的での利用 | 製品の単一目的と無関係な目的で使用・転送しない | |
| 信用判断・融資への利用 | しない | |
| Limited Use への準拠 | 準拠する旨を認証 | 3つの認証の正確な名称は、読んだページに載っていなかったため未確認。Limited Use FAQ に沿って記入 |
| リモートコード | 「いいえ」 | C-4 |
| プライバシーポリシーURL | 4(a) の公開URL | 置き場所は社長判断 |

### 4(c) 単一目的の説明文案（日本語。短く）

「YouTube の配信アーカイブのチャットリプレイを読み、コメント量などから盛り上がった場面を探して、グラフと一覧で見せます。」

### 4(d) 各権限の説明文案

| 権限 | 案 |
|---|---|
| storage | 解析したチャットと、利用者が設定画面で決めた設定（感度・集計の細かさ・検知するワードなど）を保存し、同じ配信を次に開いたときすぐ表示するため。 |
| unlimitedStorage | 長い配信（数時間）のチャットを保存すると、標準の保存上限（10MB）を超えることがあるため。**サイズの実測が前提。測定結果によっては、この権限を外す判断になる**（C-2、権限の変更は社長判断） |
| content scripts の matches（https://www.youtube.com/*） | 動画ページ（/watch と /live/）にパネルとグラフを表示し、動画の再生位置と連動させるため。YouTube はページを切り替えても画面全体を作り直さないため、youtube.com の全ページに読み込むが、動画ページ以外では何も表示しない。 |
| host_permissions | 宣言していない（記入欄は出ない見込み。出た場合は「なし」）。 |

### 4(e) 掲載文で避けるべき表現

規約に根拠があるもの：
- 実際には動かない機能、未計測の性能（例：「5時間の配信が数分で終わる」を実測なしで書く）。根拠：Listing Requirements（正確・完全なメタデータ）。
- YouTube／Google が提供・承認・推薦したかのような表現、公式を思わせる表現、受賞などの虚偽。根拠：Impersonation & IP、Branding。
- 名称・ロゴへの Google の商標の使用（許可なしの場合）。「Chrome」の扱いは C-13。
- キーワードの羅列、匿名の推薦文。根拠：Listing Requirements。
- 「データを一切収集しない」と書くこと（コメント本文を端末内に保存している。端末外に出さない、が正しい）。根拠：Privacy 欄が実際の挙動と食い違うと削除の可能性（Listing Requirements）。

推測に基づくもの：
- 「YouTube 非公式」「裏技」などの表現は、YouTube 利用規約上の位置づけを悪く見せる恐れがある一方、非公開の仕組みを隠す表現も避けるべき。根拠はストアの「正確性」だが、ちょうど良い言い方は社長・法務の判断に属する（推測）。
- 「切り抜き」の推奨は、配信者の権利の問題と結びつくため、README の「配信者の切り抜きガイドラインを確認」の注意を掲載文にも残すとよい（推測。規約上の根拠は読んでいない）。
- 「in Chrome」は、Anthropic の「Claude in Chrome」と紛らわしい可能性がある（推測。名称の整理は C-13 とあわせて）。

### 4(f) YouTube 内部API利用に関わる注意

- 規約上の位置づけ（C-16・C-17）：YouTube 利用規約は、自動手段によるアクセスを原則として禁止している。YouTube API Services の規約と開発者ポリシーは、未公開 API の利用を禁じる内容を含む（API クライアント向け）。この拡張が実際にどう扱われるかは、読んだ文書だけでは決められない。
- 実装側の事実：Cookie を付けずに（未ログインとして）、利用者が押したときだけ、1本の動画に対して取得する。投稿者情報は取らない。メンバー限定などの制限は回避しない。
- 選択肢（社長判断）：
  - 案1：このまま公開し、掲載文とプライバシー方針に取得の仕組みを事実どおりに書く。リスク：YouTube 側の規約違反と見なされる可能性（Chrome ウェブストアの審査とは別の話）。
  - 案2：公開前に法的な確認（専門家）を受ける。費用は発生しうる（金額は不明）。
  - 案3：取得方式を、利用者が自分でチャット欄を開いて読み込む方式（ページ上に表示されたものを読む）に変える。大きな設計変更で、使い勝手も変わる。実現性は未調査。
  - 推奨：案2を先にし、結論が出るまで案1の公開は保留。理由：規約違反の判断は法的で、研究課では確かめられず、公開後の取り返しが難しい。
- 壊れたときの表示：現在は、段階ごとのエラー文を画面に出す（「ページ情報を読み取れませんでした」など）。README は「YouTube 側の仕様変更の可能性」を案内している。ストア版では、同じ案内を画面（エラー時）と掲載文にも置く（現在の画面のエラー文に「仕様変更の可能性」は無い＝要件定義が必要）。
- 動向の監視：動向レポート 2026-10-30 の提案2・3（`subMenuItems[1]` の静かな失敗の検知）は、ストア公開後に特に重要になる（壊れた機能は C-18 に当たる）。

### 4(g) README.txt の扱い（サイドロード手順）

- 現状の README は、zip を解凍して「デベロッパー モード」で読み込む説明。ストア版の利用者には不要で、読み込み方の記述は誤解を招く（ストアからは1クリックで入れる）。
- 案：サイドロード版の README と、ストア版の掲載文・説明書を分ける。使い方（■使い方、■設定、■うまくいかないとき、■注意）は流用できる。「■入れ方」「■更新するとき」は、ストア版では不要または別文書。
- リリース zip の作り方（ffmpeg・動画・tests を含めない）は、本調査の範囲外（品質保証課の担当と思われるが、本調査では未確認）。
- README の更新は View 係の持ち場（`extension/README.txt`）。研究課では変更しない。

## 5. 推奨と根拠

### 5.1 推奨の順序

| 優先 | 推奨 | 根拠 | 担当（案） |
|---|---|---|---|
| 1 | YouTube 利用規約の自動アクセスの項目（C-16）について、公開前に社長が方針を決める | 公開後の取り返しが難しい。研究課では判断できない | 部長が社長判断Issueを起票 |
| 2 | 名称の「in Chrome」の扱い（C-13）を決める | 掲載の名称と画像に関わり、審査で止まる可能性がある（推測） | 同上 |
| 3 | プライバシー方針の作成と置き場所の決定（C-6、4(a)） | 必須の書類（ストアの要求） | 要件定義課（置き場所は社長判断） |
| 4 | 画面の開示の追加（C-7）の要件化 | 目立つ開示の要求。2026-08-01 施行で強調されている | 要件定義課 → 設計課 → 開発課（View係） |
| 5 | 保存サイズと取得リクエスト数の実測（C-2・C-15） | `unlimitedStorage` の説明に必要。負荷の確認 | 運用係 |
| 6 | 掲載文・スクリーンショットの作成 | 必須項目（C-20） | 要件定義課（掲載文は書類として扱うか部長が判断） |

### 5.2 社長判断が必要な事項（CLAUDE.md 6章に当たるもの）

1. 公開そのものとリリース（常に社長判断）。
2. **費用**：開発者登録料（1回払い）。金額は公式本文で未確認（検索要約は 5 ドル、未確認）。法的確認を受ける場合の費用は不明。
3. **権限の変更**：`unlimitedStorage` を外す／維持する（サイズの実測後）。`matches` の範囲を変える場合も該当。
4. **使い方・出力の大きな変更**：名称変更（C-13）、画面への開示の追加（C-7）、取得方式の変更（4(f) 案3）。
5. **YouTube 利用規約との関係**（C-16・C-17）。ライセンス・規約の注意が要るもの。
6. **プライバシー方針の公開URLの置き場所**と、事業者名・連絡先に何を載せるか（個人情報の扱い）。
7. スクリーンショットに実配信の画面（配信者名・コメント）を使うかどうか。

### 5.3 要件定義が必要なもの

- 画面での目立つ開示の追加（初回の説明の出し方、設定画面の説明）。
- エラー表示に「YouTube 側の仕様変更の可能性」を足すか。
- 保存した本文を全文で持つ必要があるか（C-10）の整理。
- ストア版の説明書（README との分離）。

### 5.4 気づき

- **課長の依頼文は「manifest の name に『in Chrome』が入っていない」と読めたが、現行の manifest の name は「配信 盛り上がり検知 in Chrome」で、入っている**（確認済み）。README の本文中の呼び名は「配信 盛り上がり検知」。
- 公式ページの更新日が古いもの（Program Policies の WebFetch 報告は 2025-05-22、Privacy 2022-11-01、契約 2021-05-04）があるが、2026-07-01 の告知はそれらの更新を指している。ページ本文が最新の条文かは、小型モデルの要約では判断できない。審査提出の前に原文を直接読むこと。
- 動向レポート（2026-10-30）の「未確認(a) ストアに公開しているか」は、社長が「公開予定あり」と回答した（docs/00_status/board.md の部長の判断記録、2026-10-30）。公開済みではない。

## 6. 出典

| 出典 | URL | 確認日 | 備考 |
|---|---|---|---|
| Chrome Web Store Program Policies | https://developer.chrome.com/docs/webstore/program-policies/policies | 2026-10-30 | 要約。単一目的、権限、プライバシー、MV3、2段階認証など |
| Program Policies 目次 | https://developer.chrome.com/docs/webstore/program-policies | 2026-10-30 | |
| User Data FAQ | https://developer.chrome.com/docs/webstore/program-policies/user-data-faq | 2026-10-30 | FAQ 3・9・10・14、Limited Use |
| Privacy Policy（プライバシー方針の要件） | https://developer.chrome.com/docs/webstore/program-policies/privacy | 2026-10-30 | 最終更新 2022-11-01（WebFetch 報告） |
| 2026 年のポリシー更新 | https://developer.chrome.com/blog/cws-policy-updates-2026 | 2026-10-30 | |
| Manifest V3 追加要件 | https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements | 2026-10-30 | |
| Listing Requirements | https://developer.chrome.com/docs/webstore/program-policies/listing-requirements | 2026-10-30 | 最終更新 2024-07-10（WebFetch 報告） |
| Quality Guidelines FAQ（単一目的、他社サイトの加工） | https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq | 2026-10-30 | |
| Affiliate Ads | https://developer.chrome.com/docs/webstore/program-policies/affiliate-ads | 2026-10-30 | 該当しない（アフィリエイトなし）。品質・スパムの一般規定は載っていなかった |
| ブランドガイドライン | https://developer.chrome.com/docs/webstore/branding | 2026-10-30 | Google の商標の扱い。Chrome・YouTube の個別規定は無し |
| Privacy practices タブ | https://developer.chrome.com/docs/webstore/cws-dashboard-privacy | 2026-10-30 | |
| 掲載情報 | https://developer.chrome.com/docs/webstore/cws-dashboard-listing | 2026-10-30 | |
| ベストプラクティス | https://developer.chrome.com/docs/webstore/best-practices | 2026-10-30 | 単一目的・商標の記述なし |
| 審査プロセス | https://developer.chrome.com/docs/webstore/review-process | 2026-10-30 | |
| 開発者登録 | https://developer.chrome.com/docs/webstore/register | 2026-10-30 | 登録料の金額は本文に無し |
| アカウント設定 | https://developer.chrome.com/docs/webstore/set-up-account | 2026-10-30 | |
| 開発者契約 | https://developer.chrome.com/docs/webstore/program-policies/terms | 2026-10-30 | 登録料は「1回、Google の裁量で決める」 |
| YouTube 利用規約（日本語） | https://www.youtube.com/t/terms | 2026-10-30 | WebFetch 報告の改訂日 2023-06-01。現行版か未確認 |
| YouTube API Services 利用規約 | https://developers.google.com/youtube/terms/api-services-terms-of-service | 2026-10-30 | 報告の最終更新 2026-09-14 |
| YouTube API Services 開発者ポリシー | https://developers.google.com/youtube/terms/developer-policies | 2026-10-30 | 報告の最終更新 2026-10-15 |
| 登録料と2段階認証に関する検索 | （WebSearch の結果。developer.chrome.com／support.google.com に限定） | 2026-10-30 | 5ドルの記述は要約のみで本文未確認 |
| 製品コード | extension/manifest.json、fetcher.js、content.js、options.js、options.html、background.js、analyzer.js、viewmodel/videoid.js、README.txt | 2026-10-30 | |

## 7. 未確認の項目（一覧）

1. 登録料の金額（公式ページの本文）。検索要約の「5ドル」は本文未確認。
2. ダッシュボードの「データ種別」チェック項目の正式名称と、3つの認証の正式名称。
3. 「Chrome」「YouTube」が、ブランド指針の対象商標に含まれるかの明文（一覧が本文に無い）。
4. YouTube 利用規約の現行版の改訂日（ページ報告は 2023-06-01）。および自動手段の項目がこの拡張に当たるかの法的判断。
5. YouTube API Services 規約が、この拡張に適用されるかの断定。
6. FAQ 9 の at rest 暗号化が端末内の chrome.storage.local に審査で適用されるか。
7. 各公式ページの条文の原文（小型モデルの要約を元にしたため、番号・言い回しは未確認）。
8. 5時間配信1本の保存サイズ、実リクエスト数、所要時間。
9. youtube.com 以外へ通信しないことの実測。
10. panel.css の外部 `url()` の有無、icons の絵柄。
11. 「リストをコピー」のストア版での動作。
12. スクリーンショットの寸法・本数の正式要件（掲載情報ページの要約では 1280x800 を1枚以上）。画像ページ supplying-images は取得できなかった（404）。
13. 配信者の許諾・肖像など、スクリーンショットの権利の扱い。
14. shared/metrics-spec.md の本文保存に関する定義（C-10）。
15. 審査の拒否理由の具体例（公式ページに一覧が無かった）。
