# PCの準備（初回のみ）

社長の Windows PC を、この組織の作業場所にします。PCは常時起動にします。

## 1. 入れるもの
| もの | 用途 | 入れ方 |
|---|---|---|
| Git for Windows | Git と Git Bash（フックの実行にも使う） | https://git-scm.com/ |
| Python 3.13 | in App版の実行、テスト、フック | https://www.python.org/downloads/ （「Add python.exe to PATH」にチェック） |
| Node.js 22 LTS | in Chrome版のテスト | https://nodejs.org/ |
| GitHub CLI（gh） | 判断待ちIssue・日報・PR | `winget install GitHub.cli` の後 `gh auth login` |
| Claude デスクトップアプリ | Claude Code の作業と、PC上の定期実行 | https://claude.com/download |
| Claude Code（CLI） | エージェントチームの起動（scripts\team.bat） | https://code.claude.com/docs/en/quickstart |
| Claude in Chrome | in Chrome版の実配信確認・プレイヤー代理の試用 | Chrome ウェブストアで「Claude」を追加し、Claude と同じアカウント・組織でログイン |
| Deno | yt-dlp が YouTube で使う JavaScript ランタイム | `winget install --id DenoLand.Deno`（in App版の setup.bat でも入ります） |

## 2. リポジトリを並べて置く
両方のリポジトリを**同じフォルダの中に並べて**置きます（共通仕様のずれ確認と、部をまたぐエージェントチームが、隣のフォルダを見に行くため）。
```
C:\Users\<あなた>\VibeCoding\
  ├─ VibeCodingYouTubeAnalysisChrome
  └─ VibeCodingYouTubeAnalysisApp
```
```
cd %USERPROFILE%
mkdir VibeCoding
cd VibeCoding
git clone https://github.com/potstudio0206/VibeCodingYouTubeAnalysisChrome.git
git clone https://github.com/potstudio0206/VibeCodingYouTubeAnalysisApp.git
```

## 3. 開発用の部品
- in App版：`pip install -r requirements-dev.txt` の後、`app\setup.bat`
- in Chrome版：`pip install -r requirements-dev.txt` の後、`python -m playwright install chromium`

## 4. Claude Code で一度開く
1. Claude デスクトップアプリの Code タブで、このリポジトリのフォルダを開く。
2. フォルダを信頼する（フックと権限の設定は、信頼した後に有効になります）。
3. 部長として起動し、起動時のブリーフィングが表示されることを確かめる。
4. GitHub のラベルを作る（初回のみ）：部長に「`python scripts/setup_labels.py` を実行して」と頼む。

## 5. 常時起動の設定
- Claude デスクトップアプリの設定で「Keep computer awake（スリープさせない）」をオンにする。
- Windows の電源設定で、スリープしないようにする（ノートPCはふたを閉じるとスリープするので注意）。

## 6. in Chrome版を自分の Chrome に入れる
`chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」→ in Chrome版のリポジトリの `extension` フォルダ。

## 7. 定期実行を登録する
docs/90_handbook/scheduled-tasks.md の一覧を、Claude デスクトップアプリの「Scheduled」から「ローカル（Only on this computer）」のタスクとして登録します。Claude に「この一覧のとおりに登録して」と頼むこともできます。
