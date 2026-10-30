# VibeCodingYouTubeAnalysisChrome

YouTube配信アーカイブのページで、チャットから盛り上がった場面を見つける Chrome 拡張機能 **in Chrome版** です。
コメント量・加速度・同じコメントの割合をタイムライン（ヒートマップ／折れ線）で表示し、クリックでその場面へジャンプ、再生位置やシークバーとも連動します。

姉妹製品：[in App版（PCツール）](https://github.com/potstudio0206/VibeCodingYouTubeAnalysisApp)

## 使う
Chrome の `chrome://extensions` でデベロッパーモードをオンにし、`extension` フォルダを読み込みます。詳しくは [extension/README.txt](extension/README.txt)。

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
