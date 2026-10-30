# VibeCodingYouTubeAnalysisChrome

YouTube配信アーカイブから切り抜きの見どころを探すツールの **in Chrome版（Chrome拡張機能）** のリポジトリです。Chrome拡張機能部が開発・運用します。
姉妹製品のin App版（PCツール）は、アプリケーション部が [VibeCodingYouTubeAnalysisApp](https://github.com/potstudio0206/VibeCodingYouTubeAnalysisApp) で担当します。

このファイルは部長・課長・係長の全員が従う共通ルールです。各自の役割は .claude/agents/ のエージェント定義にあります。

## 1. 構成
| 場所 | 内容 |
|---|---|
| `extension/` | 製品コード |
| `tests/` | テスト |
| `shared/` | 共通指標仕様（両リポジトリで同じ内容） |
| `docs/` | 書類（3章） |
| `research/` | 研究課の試作（製品コードではない） |
| `ops/` | 運用の設定（実配信での確認に使うURLなど） |
| `scripts/` | 補助スクリプト（エージェントチームの起動、共通仕様のずれ確認、ラベル作成） |
| `.claude/` | 組織の設定（エージェント・スキル・フック）。変更には社長の許可が必要 |

## 2. 組織と報告の流れ
社長（人間） ← 部長（このリポジトリのメインのセッション：`chrome-bucho`） ← 課長（8課） ← 係長

- 仕事は 部長 → 課長 → 係長 と流れ、報告と判断待ちは逆向きに上がります。
- 係長どうし・課長どうしは直接やり取りしません。他の課に伝えたいことは報告の「論点」に書けば、部長が回します。

| 課 | 課長 | 係長 |
|---|---|---|
| 研究課 | `chrome-research-kacho` | 仕分け係（`chrome-research-triage`）、動向調査係（`chrome-research-trends`）、融合開発係（`chrome-research-fusion`） |
| 要件定義課 | `chrome-req-kacho` | 現状仕様係（`chrome-req-spec`）、要件定義係（`chrome-req-define`） |
| 設計課 | `chrome-design-kacho` | 基本設計係（`chrome-design-basic`）、詳細設計係（`chrome-design-detail`） |
| リファクタリング課 | `chrome-refactor-kacho` | 構造分析係（`chrome-refactor-analyze`）、移行係（`chrome-refactor-migrate`） |
| 開発課 | `chrome-dev-kacho` | Model係（`chrome-dev-model`）、ViewModel係（`chrome-dev-viewmodel`）、View係（`chrome-dev-view`） |
| 品質保証課 | `chrome-qa-kacho` | テスト係（`chrome-qa-test`）、保守運用書係（`chrome-qa-opsdoc`） |
| 保守運用課 | `chrome-ops-kacho` | 運用係（`chrome-ops-run`）、フィードバック集約係（`chrome-ops-feedback`） |
| プレイヤー代理課 | `chrome-player-kacho` | 良いところ係（`chrome-player-good`）、悪いところ係（`chrome-player-bad`） |

## 3. 書類の流れと番号
| 書類 | 番号 | 置き場所 | 書く | 承認 |
|---|---|---|---|---|
| 現状仕様書・開発後の仕様書 | ― | `docs/02_requirements/spec-current.md`・`spec-next.md` | 現状仕様係 | 要件定義課長 |
| 要件定義書 | REQ-xxxx | `docs/02_requirements/` | 要件定義係 | 要件定義課長（＋必要なら社長） |
| 基本設計書 | BD-xxxx | `docs/03_design/basic/` | 基本設計係 | 設計課長 |
| 詳細設計書（MVVM） | DD-xxxx | `docs/03_design/detail/` | 詳細設計係 | 設計課長 |
| リファクタリング計画書 | RF-xxxx | `docs/04_refactoring/` | 構造分析係 | リファクタリング課長 |
| テスト仕様書 | TS-xxxx | `docs/05_dev/test-spec/` | 開発課の各係 | 開発課長 |
| テスト結果報告書 | QA-xxxx | `docs/06_qa/reports/` | テスト係 | 品質保証課長 |
| 保守運用書 | ― | `docs/06_qa/ops-manual.md` | 保守運用書係 | 品質保証課長 |
| 運用記録・障害記録 | 日付・INC-xxxx | `docs/07_ops/logs/`・`incidents/` | 運用係 | 保守運用課長 |
| フィードバックまとめ | FB-xxxx | `docs/07_ops/feedback/` | フィードバック集約係 | 保守運用課長 |
| プレイヤー要望書 | PLY-xxxx | `docs/08_player/requests/` | プレイヤー代理課長 | プレイヤー代理課長 |
| 研究レポート・動向レポート | RS-xxxx・日付 | `docs/01_research/` | 研究課の各係 | 研究課長 |

- 1つの案件では、要件定義書の番号を引き継ぎます（REQ-0003 → BD-0003 → DD-0003 → TS-0003 → QA-0003）。
- 書類の先頭の status は draft → review → approved。approved にするのは担当の課長です。承認されていない書類をもとに次の工程を始めません。
- 書類のテンプレートはスキル doc-requirements などにあります。

## 4. MVVM の層の分け方（このリポジトリ）
| 層 | 役割 | 今のファイル | 担当 |
|---|---|---|---|
| Model | チャット取得と解析（fetcher.js / analyzer.js） | `extension/model/**`、`extension/analyzer.js`、`extension/fetcher.js` | Model係 |
| ViewModel | パネルの状態・並べ替え・表示範囲・動画との連動の計算（今後 extension/viewmodel/。現状は content.js に混在） | `extension/viewmodel/**` | ViewModel係 |
| View | パネルとグラフの描画（content.js / panel.css）、設定画面、アイコン、利用者向け説明書 | `extension/view/**`、`extension/content.js`、`extension/panel.css`、`extension/options.html`、`extension/options.js`、`extension/background.js`、`extension/icons/**`、`extension/README.txt` | View係 |

- Model は表示を知らない、ViewModel は DOM・HTML を触らない、View は計算をしない。
- 今のコードは完全な MVVM ではありません。移行はリファクタリング課が段階的に行います。新しいコードは目標の構造（`extension/model/`・`viewmodel/`・`view/`）に置きます。
- ファイルの持ち場は `.claude/hooks/ownership.json` にあり、フックが持ち場の外の編集を止めます。

## 5. 手戻り
- 不足を見つけた課長は、どこが・なぜ・どう直すかを具体的に書いて差し戻します。
- 同じ成果物の差し戻しは最大3回。超えたら部長へ「判断待ち」で上げます。
- 前の工程の不足は、部長経由でその工程の課へ戻します（要件の不足 → 要件定義課、設計の不足 → 設計課、実装の不足 → 開発課）。

## 6. 社長判断の基準と判断待ちIssue
次に当たる事項は、部長が判断待ちIssue（ラベル「社長判断」）を起票し、社長の返答を待ちます（スキル /escalate）。
- 新機能を作るかどうか、使い方・出力の大きな変更、機能の削除
- 共通指標仕様（shared/）の変更
- リリース（版数の更新・利用者への配布）
- 費用がかかるもの、ライセンスに注意が要るもの（GPL・AGPL・商用制限・APIキー必須）
- 権限の追加（in Chrome版の manifest の permissions など）
- 同じ工程の手戻りが3回を超えたもの、両部の意見が分かれたもの
- その他、やり直しが難しく、どちらとも取れる判断

判断待ちの件は止め、他の仕事を進めます。社長の返答は、起動時のブリーフィングに★で出ます。

## 7. 会議の代わり
- 課長・係長の作業の開始と終了は、フックが自動で記録します（`.claude/state/activity.jsonl`、git管理外）。
- 進捗ボード `docs/00_status/board.md` は、課長が作業の区切りで更新します。
- 部長は毎日、GitHub の日報Issueに日報をコメントします（スキル /daily-report）。相手の部の日報も読み、共有事項を書きます。
- 臨時の相談が必要なときは、部長が判断待ちIssueを立てるか、8章のエージェントチームを社長に提案します。

## 8. エージェントチーム（使う場面を限定）
エージェントチーム（複数のエージェントが互いに直接話し合う機能）は、トークンを多く使う実験的な機能です。次の2つの場合だけ使います。
- 原因の分からない不具合の究明：`scripts\team.bat bug "症状"`（手順はスキル /team-bug）
- 両部にまたがる判断：`scripts\team.bat cross "決めたいこと"`（手順はスキル /team-cross）

普段のセッションでは有効にしません（有効にすると、普段の依頼でもチームが作られてしまうため）。起動するのは社長です。

## 9. 共通指標仕様（shared/）
- コメント量・加速度・同じコメントの流れる確率の定義は `shared/metrics-spec.md` が唯一の正です。両版の実装はこれに合わせ、適合テストで確かめます。
- shared/ は両リポジトリで同じ内容を保ちます。変更はスキル /shared-spec の手順で、社長の承認を得てから両リポジトリに同時に行います。
- ずれの確認：`python scripts/check_shared_sync.py`（隣のフォルダに相手のリポジトリがある場合）

## 10. 実行環境とテスト
- 作業場所は社長のWindows PC（常時起動）です。YouTube に繋ぐ作業（実配信での確認、プレイヤー代理の試用）はこのPCでしかできません。
- 速いテスト：`node --test "tests/unit/*.test.js"`
- 重いテスト：`python -m unittest discover -s tests/e2e -v`（E2Eテストは、拡張機能を読み込んだChromium（Playwright）で模擬YouTubeを操作します（約20秒）。）
- 共通指標仕様：`python shared/reference/metrics_ref.py --check`
- 実配信での確認：Claude in Chrome で配信アーカイブを開き、パネルの「このアーカイブを解析」を押す
- コマンドは Git Bash の書き方で書きます（Claude Code の Bash は Windows でも Git Bash です）。

## 11. Git と PR
- 作業は必ずブランチで行います（feat/… fix/… refactor/… docs/…）。main への直接の push と force push は禁止です。
- PR の本文に、関係する書類の番号とテスト結果を書きます。
- マージ：バグ修正・リファクタリング・書類だけの変更 → 部長がマージしてよい。新機能・使い方の大きな変更・共通指標仕様 → 社長の承認後。リリース → 常に社長の承認。
- GitHub に書く文章で、@ を付けて人の名前を書きません（通知が飛ぶため）。

## 12. 報告の書式
全員、作業の最後に次の形で報告します（フックがこの形を読み取って記録します）。
```
状態: 完了 / 手戻り / 判断待ち / ブロック
成果物: パス、PR・Issue の番号
要約: 3行以内
次の担当: エージェント名 または なし
論点: （手戻り・判断待ち・ブロックのとき）
```

## 13. 書き方
- 書類と画面の文言は日本語。専門用語は必要なときだけ、短い説明を添えます。
- ファイルは UTF-8。bat は CRLF（.gitattributes で自動）。
- 秘密情報（トークン・パスワード・個人情報）を書かない、コミットしない。
- 確かめていないことを事実として書かない。
