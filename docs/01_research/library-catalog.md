# ライブラリ・API 仕分け表（in Chrome版）

仕分け係が管理します。初版（Claude作成）の暫定の記載です。

## 製品で使っているもの
| 名前 | 区分 | 用途 | 備考 |
|---|---|---|---|
| 外部ライブラリ | なし | ― | 素の JavaScript（ビルド不要・CDN不使用） |
| chrome.storage（local / sync） | 採用中 | チャットの保存、設定 | unlimitedStorage 権限 |
| chrome.runtime / chrome.action | 採用中 | 設定ページを開く、ツールバーのアイコン | |
| content script（Manifest V3） | 採用中 | YouTube のページにパネルを出す | https://www.youtube.com/* |
| YouTube 内部API（get_live_chat_replay） | 採用中・要注意 | チャットリプレイの取得 | 非公開。予告なく変わる可能性がある（運用係が見張る） |

## 開発用
| 名前 | 用途 | ライセンス（暫定） |
|---|---|---|
| Node.js のテストランナー（node --test） | 単体・適合テスト | （Node.js に同梱） |
| Playwright（Python） | E2Eテスト | Apache-2.0 |
| imageio-ffmpeg | テスト用の動画づくり | 要確認 |

## 研究の候補（未評価）
| 名前 | 期待する用途 |
|---|---|
| chrome.sidePanel API | パネルを Chrome の標準のサイドパネルに出す |
| offscreen document / Web Audio | ブラウザ内で音声を解析し、「声の大きさ」を in Chrome版にも |
| 軽量なグラフ描画ライブラリ | タイムラインの描画（同梱できるもの） |
