---
id: OPS-MANUAL
title: 保守運用書（in Chrome版）
status: approved          # 保守運用書係が更新。approved にするのは品質保証課長
reviewer: chrome-qa-kacho
author: chrome-qa-opsdoc
updated: 2026-10-30
---
# 保守運用書（in Chrome版）

## 1. 定期作業
| いつ | 誰が | 何を | 手順 |
|---|---|---|---|
| 毎日 | 部長 | 日報 | /daily-report |
| 毎日 | 保守運用課・運用係 | 実配信での動作確認（1本。/live/ 形式と /watch 形式の両方、2章） | /smoke-test |
| 毎週 | 研究課 | 動向調査（Chrome拡張API・YouTubeの変化） | /research-scan |
| 毎週 | プレイヤー代理課 | 試用 | /player-session |

定期実行の設定は docs/90_handbook/scheduled-tasks.md にあります。

## 2. 実配信での動作確認（スモークテスト）
YouTube の配信アーカイブには、同じ動画に複数のURL形式があります（2.1）。拡張機能は URL の形で動画かどうかを判定するため、**1本の動画につき /live/<ID> 形式と /watch?v=<ID> 形式の両方**で確かめます（INC-0001：/live/ 形式だけボタンが出なかった）。

### 2.1 URL形式と対応状況
次の表は、コード（extension/manifest.json の matches、extension/viewmodel/videoid.js）を読んで確かめた内容です（2026-10-30、版数 1.2.0 の作業ツリー）。

| URL形式 | 例 | ボタン・解析 | 根拠 |
|---|---|---|---|
| /watch?v=ID | https://www.youtube.com/watch?v=fPnkoOtQIyE | 対応 | videoid.js が pathname `/watch` の `v=` を読む |
| /live/ID | https://www.youtube.com/live/fPnkoOtQIyE | 対応 | videoid.js が `/live/ID`（末尾の `/` は可）を読む。`?si=` などの付き物は読まない |
| /shorts/ID | https://www.youtube.com/shorts/xxxxxxxxxxx | 対象外（ボタンは出ない） | videoid.js は null を返し、content.js の onNav がボタンを隠す。部長決定（QA-0001） |
| /embed/ID | https://www.youtube.com/embed/xxxxxxxxxxx | 対象外（ボタンは出ない） | 同上。manifest の matches は `https://www.youtube.com/*` のみで、all_frames の指定はない |

- 動画ID は英数字・`-`・`_` だけを受け付けます（videoid.js）。それ以外の文字を含むと、ボタンは出ません。
- manifest の matches が `https://www.youtube.com/*` なので、`www.youtube.com` 以外のドメイン（m.youtube.com など）で動くかどうかは、確かめていません（未確認）。確認用URLにも使わないでください。
- YouTube が将来、URL形式を増やしたり変えたりしたら、videoid.js と本表の更新が必要です（動向調査係から共有を受けたら、課長へ報告）。

### 2.2 手順
1. ops/smoke-urls.txt から、前回の次のURLを選ぶ。
2. 選んだURLから動画ID（`/live/` の後ろ、`?` の前の11文字）を取り、次の2つのURLを作る。`?si=` 以降は付けなくてよい。
   - /live/ 形式：`https://www.youtube.com/live/<ID>`
   - /watch 形式：`https://www.youtube.com/watch?v=<ID>`
   - 例（1本目）：`https://www.youtube.com/live/fPnkoOtQIyE` と `https://www.youtube.com/watch?v=fPnkoOtQIyE`
3. Claude in Chrome が使えるセッション（`claude --chrome`）で、まず /live/ 形式を開く。右下に「見どころ」ボタンが出るのを確かめ、押して「このアーカイブを解析」を押す。
4. 確かめる：完了の表示（コメント数・候補の数）、グラフのクリックで動画がジャンプする、再生位置の赤い線が動く。
5. 同じ動画を /watch 形式で開き、3〜4 を繰り返す。2つの形式で、コメント数と候補の数が同じ程度か見比べる（INC-0001 では /watch 形式でコメント574件・候補20か所。同じ動画でも、取得のたびに数が少し違うかもしれないが、桁が違うときは不具合として扱う）。
6. どちらかでボタンが出ない・解析が始まらないときは、4章の最初の行に従う。
7. Claude in Chrome が使えないときは、E2Eテスト（`python -m unittest discover -s tests/e2e -v`）だけ実行し、「実配信は未確認」と記録する。
8. docs/07_ops/logs/YYYY-MM-DD.md に記録する。**どの動画IDを、どちらの形式で確かめたか**を、形式ごとに書く（例：「/live/ 形式：合格」「/watch 形式：合格」）。片方だけ確認したときは、その旨を書く。

### 2.3 INC-0001 の再確認（修正のマージ後に1回）
INC-0001 の修正（ブランチ fix/live-url-support）は、自動テストでは合格していますが（QA-0001）、**本物の /live/ URL での確認はまだ行っていません**。修正のマージと拡張機能の読み込み直し（3章）のあと、次を行います。
1. ops/smoke-urls.txt の /live/ 形式のURLを開き、2.2 の 3〜4 を行う（INC-0001 で症状が出た fPnkoOtQIyE を最初に使う）。
2. 同じ動画を /watch 形式でも確かめる（2.2 の 5）。
3. docs/07_ops/logs/ の運用記録に結果を書き、保守運用課長へ報告する。INC-0001 を閉じるのは保守運用課長です。

## 3. 拡張機能の更新（社長のChromeへの反映）
1. main を最新にする（`git pull`）。
2. Chrome の `chrome://extensions` で「配信 盛り上がり検知 in Chrome」の更新ボタン（↻）を押す。
3. YouTube のタブを再読み込みする。

**manifest.json の content_scripts にファイルを追加・変更・並べ替えたときは、必ず 2 → 3 の両方を行います。** 拡張機能の再読み込み（↻）だけでは、すでに開いている YouTube のタブには新しい構成が入りません。タブの再読み込みを忘れると、古いコードのまま（または新旧が混ざった状態）で動きます。
- 直近の例：INC-0001 の修正で、content_scripts.js に `viewmodel/videoid.js` が加わりました（`analyzer.js`、`fetcher.js`、`viewmodel/videoid.js`、`content.js` の順）。content.js が videoid.js の関数を使うため、**videoid.js は content.js より前**に書く必要があります。順番を変えたときも、同じ再読み込みを行います。
- 反映を確かめるには、YouTube のタブを再読み込みしたあと、/live/ 形式のURLを開いて「見どころ」ボタンが出ることを見ます（2.2 の 3）。

## 4. よくある障害と対応
| 症状・文言 | 原因 | 対応 |
|---|---|---|
| 「見どころ」ボタンが出ない | 1) URL形式が対象外（/shorts/・/embed/、ほか）。2) 古い拡張機能のまま（読み込み直しの後に YouTube のタブを再読み込みしていない）。3) ページの読み込み途中 | **まずアドレスバーのURL形式を確認する**（下の切り分け）。次に YouTube のタブを再読み込みする |
| 「YouTubeからの取得に失敗しました（エラー 番号）」 | YouTube の内部APIの変化、一時的な制限 | 時間をおいて「再取得」。続くなら不具合として報告（動向調査係にも共有） |
| 「この動画にはチャットリプレイがありません」 | 通常の動画・チャット無効・処理中 | 別の動画で確認 |
| 「未ログインでは見られないため解析できません」 | メンバー限定・年齢制限 | 対象外 |
| 「配信中は解析できません」 | ライブ中 | アーカイブになってから |

### 4.1 「見どころ」ボタンが出ないときの切り分け
ボタンが出ない場合、エラーの文言もコンソールの出力も出ません（拡張機能は「動画ではない」と判断して、ボタンを隠しているだけです。INC-0001）。次の順に確かめます。
1. **URL形式を確認する。** アドレスバーが `https://www.youtube.com/watch?v=<ID>` または `https://www.youtube.com/live/<ID>` か。
   - /shorts/ や /embed/ の場合は、対象外なので不具合ではない。/watch または /live/ の形式で開き直す。
   - `www.youtube.com` 以外のドメインの場合は、対象かどうか未確認（2.1）。`www.youtube.com` で開き直す。
   - /live/ と /watch のどちらでもよい。同じ動画を、もう一方の形式で開いてボタンが出るか見る（出るなら、URL形式に関する不具合の疑い。課長へ「論点」に書いて報告）。
2. URL形式が対象なのにボタンがない：YouTube のタブを再読み込みする。
3. まだ出ない：`chrome://extensions` で拡張機能の更新ボタン（↻）を押し、YouTube のタブを再読み込みする（3章）。拡張機能が「オン」になっているかも見る。
4. それでも出ない：不具合として、URL、版数（`chrome://extensions` に表示）、再現手順を添えて保守運用課長へ報告する。

## 5. 復旧（前の版に戻す）
- 問題のあるPRを `git revert` で戻すPRを作り、マージ後に3章の手順で読み込み直す。

## 6. 確認用URLの管理
- ops/smoke-urls.txt に、チャットリプレイのある公開アーカイブを3〜5本。社長が登録する。
- 現状の5本は、すべて /live/<ID> 形式です。**/watch 形式のURLを別に登録する必要はありません。** 運用係が2.2 の 2 でIDから /watch 形式を作って確かめます（登録しているのは動画で、URLの形式ではないため）。
- 新しく登録するときは、/live/ 形式でも /watch?v= 形式でもよい。どちらで登録されても、2.2 に従って両方の形式で確かめる。
- 登録できないもの：メンバー限定・年齢制限・配信中・チャットリプレイのないもの。/shorts/ と /embed/ の形式（対象外）。

## 7. 変更履歴
| 日付 | 内容 |
|---|---|
| 2026-10-30 | 初版 |
| 2026-10-30 | INC-0001 の再発防止を反映：実配信確認を /live/ と /watch の両方の形式で行う（2章）、URL形式と対応状況の表（2.1）、INC-0001 修正後の再確認（2.3）、manifest の content_scripts 変更時の再読み込み（3章）、ボタンが出ないときの切り分け（4.1）、確認用URLの扱い（6章）。status を review に |
