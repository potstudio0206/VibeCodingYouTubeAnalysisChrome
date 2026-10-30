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
このリポジトリは、Claude Code のエージェントによる組織（**Chrome拡張機能部**：部長・8課の課長・係長）が開発・運用しています。
- 共通ルール：[CLAUDE.md](CLAUDE.md)
- 社長（人間）向けの使い方：[docs/90_handbook/how-to-work.md](docs/90_handbook/how-to-work.md)
- 書類：[docs/](docs/README.md)
- 両部の共通指標仕様：[shared/metrics-spec.md](shared/metrics-spec.md)

## テスト
```
node --test "tests/unit/*.test.js"               # 単体・共通指標仕様の適合テスト（Node.js 22）
python -m unittest discover -s tests/e2e -v      # E2E（拡張機能を読み込んだChromium）
python shared/reference/metrics_ref.py --check   # 共通指標の基準データの確認
```
