---
id: DD-0002
title: 表示切り替えで下のボタンの位置が動かないようにする（タイムラインの行の高さの統一）詳細設計
status: approved
author: chrome-design-detail
reviewer: chrome-design-kacho
basic_design: BD-0002
updated: 2026-10-30
---
# DD-0002 表示切り替えで下のボタンの位置が動かないようにする 詳細設計

## 0. 前提と確かめた範囲
- 入力：BD-0002（approved。3章、7章の申し送り N-1〜N-6、7.4 の未決事項）、REQ-0002（approved。受け入れ基準 A-01〜A-13）。現行コード `extension/content.js`（全体）、`extension/panel.css`（1〜24・36〜45・94〜114・123・150〜157行）、`extension/analyzer.js`（`hlxFmt` 38〜42行）、`tests/e2e/test_extension_e2e.py`（全体）、`tests/unit/`（ファイル一覧と `_load.js` の読み込み先）、`.claude/hooks/ownership.json`、`.gitignore`、`requirements-dev.txt`、前例 DD-0001 を 2026-10-30 に読んだ。
- 本書の「確認」はコードを読んだこと。拡張機能の実機操作・E2E の実行・画面の実測はしていない。見込みは「見込み」と書く。
- 行番号は 2026-10-30 時点（ブランチ feat/fb3-toggle-layout-impl。BD-0002 の行番号と一致することを確認）。実装では、行番号より「変更前のコード片」を正として置き換える。
- 文字コード・改行（`file` コマンドで確認）：`extension/content.js`・`tests/e2e/test_extension_e2e.py` はどちらも UTF-8（BOM なし）・作業ツリーでは CRLF。本件で文字コード・改行は変えない。
- 環境：Python 3.13、Playwright 1.64.1（`get_by_role(..., exact=True)`・`set_viewport_size`・`select_option` が使える版）。
- 単体テストは `content.js` を読み込んでいない（`tests/unit/*.test.js` と `_load.js` を確認。読み込むのは analyzer.js・fetcher.js・viewmodel/videoid.js）。

### 0.1 変えないもの（BD 0.1 の制約の再掲）
- 方式は案1（両表示の1行を 38px に統一）。グラフを縦に切らない、スクロールを出さない、行・指標を減らさない。
- 文言・ボタンの並び・色を変えない。`extension/panel.css`・`extension/manifest.json`（版数 **1.2.1 のまま**）・`shared/**`・`extension/analyzer.js`・`extension/fetcher.js`・`extension/viewmodel/**` を変えない。
- 折れ線の描き方の式（371行の `py = y + rh - 2 - … * (rh - 4)`）、ヒートマップの塗り方（355〜363行）、▼・目盛り・縦線・マウス位置の線（378〜416行）、`tAt()`・`onChartClick()`・`onChartHover()` を変えない（N-4）。

## 1. 変更するファイルと担当
| ファイル | 層 | 担当（係） | 変更の内容 | 本書の節 |
|---|---|---|---|---|
| `extension/content.js` | View | View係（`chrome-dev-view`） | 定数 `ROW_H = 38` の追加（324行）と、`rh` の決め方（331行）の2行だけ | 4.1 節 |
| `tests/e2e/test_extension_e2e.py` | View（テスト） | View係（`chrome-dev-view`） | `GAP_INK_JS` の行の高さを 38 に統一（N-1）。定数・JS 補助・補助メソッドと新規テスト2件を追加。既存4件のテストメソッドは変えない | 7.2〜7.6 節 |
| `docs/05_dev/test-spec/`（テスト仕様書） | ― | View係（`chrome-dev-view`） | 本書 7章を材料に作成。番号は部長の決定に従う（10章 U-1） | 7章 |
| `extension/panel.css`・`manifest.json`・`analyzer.js`・`fetcher.js`・`viewmodel/**`・`options.*`・`background.js`・`README.txt`・`shared/**`・`tests/unit/**` | ― | ―（変更なし） | 変更しない | 0.1 節 |
| `docs/02_requirements/spec-current.md` | ― | 現状仕様係（`chrome-req-spec`。要件定義課長が段取り） | 実装・QA の後に「表示切り替えでグラフの高さが変わる」の項を直す | 10章 U-2 |

- **1ファイル1係**：`content.js` と `test_extension_e2e.py` はどちらも View係だけが編集する。`tests/**` は Model係・ViewModel係・テスト係（`chrome-qa-test`）の持ち場にも入っているが、本件では触らない。テスト係は品質保証課で**実行するだけ**（結果は QA 報告書に書く）。
- Model係・ViewModel係の作業は無い。

### 1.1 作業の順（View係）
1. `tests/e2e/test_extension_e2e.py` を 7.2〜7.6 節のとおり変更する（`content.js` はまだ触らない）。
2. 8.1 節の手順で、修正前のコードで新テスト `test_toggle_keeps_layout` が**差 80px で失敗する**ことを確かめ、失敗の文をテスト仕様書に写す。
3. `extension/content.js` を 4.1 節のとおり変更する。
4. 7.7 節のコマンド（単体・E2E 全件・共通指標仕様）がすべて通ることを確かめる。
- コミットは「テストの追加」「content.js の修正」の2つに分けることを推奨（修正前に失敗したテストが修正で通る、という流れが履歴で分かるため）。1つの PR にまとめる。PR 本文に REQ-0002・BD-0002・DD-0002・テスト仕様書の番号と、手順2・4の結果を書く。

## 2. Model
**変更なし。**
- 理由：本件は「1行を何ピクセルで描くか」という描画の寸法だけの変更で、チャットの取得（`hlxFetchChat`）・指標の計算（`hlxAnalyze`）・返り値（`count`・`accel`・`same`・`score`・`highlights`・`binSec`・`duration`）に関わらない。`analyzer.js` は4つの配列を必ず返す（BD 3.3 で確認済み）ので、通常は4行になる。

## 3. ViewModel
**変更なし。**
- 理由：行の高さは表示の状態から計算する値ではなく、描画の寸法（View の定数。`LABEL_W`・`MARK_H`・`AXIS_H`・`GAP` と同じ並び）である（BD 2.2）。状態 `S`（`mode`・`range`・`wide` など）に項目を足さない。
- 変更後、`S.mode` は「どちらの描き方をするか」の分岐（352行 `if (S.mode === 'heat')`）にだけ使われ、高さには関わらなくなる。`S.range`（`viewRange()`）・`S.wide` の扱いも現行どおり。
- 既知の逸脱 D-2（content.js が状態 `S`・`viewRange()`・`rows()` を持つ）は増やしも減らしもしない（8章）。

## 4. View
### 4.1 `extension/content.js`（View係）
変更は次の2行だけ。ほかの行（空白・コメントを含む）は変えない。

#### 4.1.1 定数の追加（324行）
変更前：
```js
  const LABEL_W = 70, MARK_H = 9, AXIS_H = 16, GAP = 3;
```
変更後：
```js
  const LABEL_W = 70, MARK_H = 9, AXIS_H = 16, GAP = 3, ROW_H = 38;   // ROW_H：1行の高さ。表示（ヒートマップ／折れ線）に依らない（BD-0002）
```

#### 4.1.2 `rh` の決め方（`drawChart()` の中、331行）
変更前：
```js
    const rh = S.mode === 'heat' ? 18 : 38;
```
変更後：
```js
    const rh = ROW_H;   // 表示を切り替えても高さを変えない（REQ-0002）
```
- **決定：変数 `rh` は残す**（BD 3.1 で詳細設計に任された点）。理由：349行以降の `rh` を使う5か所（行の位置 `y`、ラベルの縦位置 `y + rh / 2`、背景 `fillRect(LABEL_W, y, PW, rh)`、ヒートマップの塗り `fillRect(x, y, 1, rh)`、折れ線の縦の位置 `y + rh - 2 - …*(rh - 4)`）を1文字も変えずに済み、差分が2行で閉じる。折れ線の式（N-4）にも触れない。
- 332行の H の式 `H = MARK_H + R.length * (rh + GAP) + AXIS_H` は**変えない**（`rh` が定数になるので、H は行数だけで決まる）。

#### 4.1.3 変更後の値（式からの計算。実測は 7章の E2E で確かめる）
| 入力 | 変更前 | 変更後 |
|---|---|---|
| `S.mode = 'heat'`、4行 | `rh` = 18、H = 9 + 4×21 + 16 = **109** | `rh` = 38、H = 9 + 4×41 + 16 = **189** |
| `S.mode = 'line'`、4行 | `rh` = 38、H = **189** | `rh` = 38、H = **189**（画素も現行と同じ） |
| 行 ri（0始まり）の上端 y | heat：9 + 21×ri（9, 30, 51, 72） | 両表示：9 + 41×ri（**9, 50, 91, 132**） |
| ラベルの縦の中央 | heat：y + 9 | 両表示：y + 19（**28, 69, 110, 151**） |
| 行と行のすき間（3px） | heat：y + 18〜20 | 両表示：y + 38〜40（**47〜49, 88〜90, 129〜131**） |
| 目盛りの帯 | heat：93〜108 | 両表示：**173〜188**（H − AXIS_H 〜 H − 1） |

- 幅（パネル 400／760px、ウィンドウ幅）・表示範囲・`devicePixelRatio` は H の式に入らない（現行どおり）。

#### 4.1.4 操作とコマンドの対応（変更なし。テストの待ち方の根拠）
| 操作 | 呼ばれる処理（行） | 描き直し |
|---|---|---|
| 「ヒートマップ」「折れ線」 | `setMode(m)`（82〜84行）：`S.mode` → `hlx-on` の付け替え → `drawChart()` | **同期**。`canvas.style.height` もクリックの処理の中で決まる |
| 表示範囲の select | `S.range = sel.value; drawChart();`（89行） | 同期 |
| ⇔ | `S.wide` 反転 → `.hlx-wide` の付け替え → `setTimeout(drawChart, 220)`（92〜95行） | **220ms 後**。パネル幅に transition は無い（panel.css で確認。transition は `transform`・進み具合の棒の `width`・案内の `opacity` だけ） |
| ウィンドウの大きさ | `resize` → `drawChart()`（540行） | 同期（resize の発火の後） |
| 再生・シーク・1秒ごと | `requestDraw()`（rAF） | 次の描画の枠。高さは変わらない |

## 5. 層の間の受け渡し
- 変更なし。Model（`hlxAnalyze` の返り値 `S.res`）→ content.js の `rows()`（行の配列、`norm`）→ `drawChart()`（描画）の流れのまま。
- `ROW_H` は content.js の即時関数の中の `const` で、ほかのファイルからは見えない（content script の間で共有される最上位の名前ではない）。名前の衝突は起きない。

## 6. エラー処理・境界値
| 場合 | 振る舞い（変更後） | 根拠・確かめ方 |
|---|---|---|
| 解析前・パネルが閉じている・`data-view` が `done` 以外 | `drawChart()` は何もしないで戻る（329行。変更なし） | レビュー |
| 行数が3・2・1（F-06） | **行数ぶん縮む（現行の規則のまま。BD 3.3 の決定）**。H = 25 + 41 × 行数 → 148 / 107 / 66px。どちらの表示でも同じ値なので、切り替えで高さは変わらない | レビュー（式）。現行の analyzer では起きないので E2E では確かめない |
| 行数が0 | H = 25（▼の帯と目盛りだけ）。現行の analyzer では起きない。変更前も同じ式なので新しい失敗は無い | レビュー |
| canvas の幅が0（非表示中など） | `W = canvas.clientWidth \|\| 360`（変更なし） | レビュー |
| ブラウザのズーム・Windows の表示スケーリング | CSS ピクセルの H は同じ。`devicePixelRatio` で画素数だけ変わる（見込み） | 手動 M-2 |
| ウィンドウ幅 500px 以下 | パネルは `max-width: 100vw` で縮む（⇔ で 760px にしても 500px）。H は変わらない | E2E T-E3 |
| 例外 | 追加する処理に例外の起きる箇所は無い（定数の参照だけ） | ― |

## 7. テストの観点（開発課がテスト仕様書を書く材料）
### 7.1 方針
- **単体テストは追加しない。** 理由：(1) 変更は content.js の即時関数の中の定数1つと代入1つで、`drawChart()` は DOM・canvas を前提にしており、今の単体テスト（`vm` で読み込む）では読み込めない。(2) 高さの式を純関数に切り出すと、変更が content.js の複数か所と新しいファイル（manifest の変更が要る）に広がる。**切り出さない方針**とし、変更を最小にする。(3) 確かめたいのは「画面上でボタンが動かないこと」で、E2E で実際の配置（`getBoundingClientRect()`）を測る方が要件に直結する。
- 既存の単体テストは content.js を読まないので、影響を受けない（A-11 の範囲で全件を流す）。
- E2E は新規2件。ブラウザの起動と解析は1件につき1回にし、ビューポート・パネル幅・表示範囲は同じページの中で変えて繰り返す（実行時間への配慮。BD 7.2）。

### 7.2 `GAP_INK_JS` の修正（N-1。必須）
変更前（112〜113行）：
```js
  const heat = document.querySelector('.hlx-chip-btn.hlx-on')?.textContent === 'ヒートマップ';
  const rh = heat ? 18 : 38, MARK_H = 9, GAP = 3;
```
変更後（2行を1行に）：
```js
  const rh = 38, MARK_H = 9, GAP = 3;   // content.js の ROW_H（表示に依らない。BD-0002 N-1）
```
- 理由：変更後のヒートマップは 38px の行なので、18 のままだと「行のすき間」ではなく「塗られた行の中」を読み、ほぼ全幅にインクが見つかって既存テスト `test_panel_analysis_and_video_sync` の `near()` が中身を確かめずに通ってしまう。
- 既存4件のテストメソッドの本体は変えない（この JS の定数だけが既存テストに効く変更）。

### 7.3 追加する定数・JS 補助（モジュールの上の方、`GAP_INK_JS` の後に置く）
```python
ROW_H = 38            # content.js の1行の高さ（BD-0002 で表示に依らない値に統一）
MARK_H = 9            # content.js の▼の帯の高さ
AXIS_H = 16           # content.js の目盛りの帯の高さ
GAP = 3               # content.js の行と行のすき間
CHART_H_4ROWS = MARK_H + 4 * (ROW_H + GAP) + AXIS_H   # 189（4行のときの canvas の高さ）
TOL = 1.0             # 位置・高さの許容（REQ-0002 5章：小数点の丸めのため 1px）

# 表示範囲を変えて確かめる条件（7.5 節）：（ビューポート幅, ⇔ で広げるか, 表示範囲の value）
TOGGLE_CONDITIONS = [
    (1400, False, "all"), (1400, False, "near"), (1400, False, "first"), (1400, False, "second"),
    (1400, True, "all"),
    (800, False, "all"), (800, True, "all"),
    (500, False, "all"), (500, True, "all"), (500, True, "near"), (500, True, "first"), (500, True, "second"),
]
```

```python
# canvas の高さが、描画の枠2回続けて同じ値になるまで待つ（落ち着かなければ null）
SETTLE_JS = """
async () => {
  const c = document.querySelector('.hlx-chart');
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  let prev = null;
  for (let i = 0; i < 60; i++) {
    await frame();
    const h = c.getBoundingClientRect().height;
    if (prev !== null && h === prev) return h;
    prev = h;
  }
  return null;
}
"""

# 切り替えの前後で比べる位置（すべて getBoundingClientRect の CSS ピクセル）
LAYOUT_JS = """
() => {
  const p = document.querySelector('.hlx-panel');
  const btn = t => [...document.querySelectorAll('.hlx-toolbar .hlx-chip-btn')].find(b => b.textContent === t);
  const cv = document.querySelector('.hlx-chart').getBoundingClientRect();
  const on = document.querySelector('.hlx-tl-ctl .hlx-chip-btn.hlx-on');
  return {
    scrollTop: p.scrollTop,
    panelW: p.getBoundingClientRect().width,
    mode: on ? on.textContent : null,
    canvasTop: cv.top,
    canvasH: cv.height,
    score: btn('スコア順').getBoundingClientRect().top,
    time: btn('時系列順').getBoundingClientRect().top,
    row: document.querySelector('.hlx-row').getBoundingClientRect().top,
  };
}
"""

# グラフの中身（A-07）：ラベル、行の塗りの上下端とすき間、▼、目盛り
CHART_INK_JS = """
(a) => {
  const c = document.querySelector('.hlx-chart');
  const ctx = c.getContext('2d');
  const dpr = c.width / c.clientWidth;
  const W = c.clientWidth, H = c.clientHeight, PW = W - a.labelW;
  const alpha = (x, y) => ctx.getImageData(Math.floor(x * dpr), Math.floor(y * dpr), 1, 1).data[3];
  const inkIn = (x0, x1, y0, y1) => {
    const d = ctx.getImageData(Math.floor(x0 * dpr), Math.floor(y0 * dpr),
      Math.max(1, Math.floor((x1 - x0) * dpr)), Math.max(1, Math.floor((y1 - y0) * dpr))).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
    return false;
  };
  const scan = (y0, y1, ok) => {
    const xs = new Set();
    for (let y = Math.floor(y0 * dpr); y < Math.floor(y1 * dpr); y++) {
      const d = ctx.getImageData(0, y, c.width, 1).data;
      for (let x = 0; x < c.width; x++) if (ok(d, x * 4)) xs.add(Math.round(x / dpr));
    }
    return [...xs].sort((p, q) => p - q);
  };
  const mid = a.labelW + Math.floor(PW / 2);
  const rows = [];
  for (let ri = 0; ri < a.rows; ri++) {
    const y0 = a.markH + ri * (a.rowH + a.gap), yc = y0 + a.rowH / 2;
    rows.push({
      label: inkIn(0, a.labelW - 4, yc - 4, yc + 4),          // 行の縦の中央にラベルの文字
      top: alpha(mid, y0 + 1) > 0,                              // 行の上端の近くが塗られている
      bottom: alpha(mid, y0 + a.rowH - 2) > 0,                  // 行の下端の近くが塗られている
      gap: ri < a.rows - 1 ? alpha(mid, y0 + a.rowH + 1) === 0 : true,   // その下のすき間は空
    });
  }
  const marks = scan(1, a.markH - 3, (d, i) => d[i + 3] > 0 && d[i] > 200 && d[i + 1] > 150 && d[i + 2] < 160);  // ▼（#ffd166）
  const axis = scan(H - a.axisH, H - a.axisH + 3, (d, i) => d[i + 3] > 0);   // 目盛りの刻み（H-16〜H-14）
  return { W, H, rows, marks, axis };
}
"""

TIMES_JS = "() => [...document.querySelectorAll('.hlx-row .hlx-time')].map(b => b.textContent)"


def _secs(text):
    """hlxFmt の「h:mm:ss」を秒に"""
    h, m, s = (int(v) for v in text.split(":"))
    return h * 3600 + m * 60 + s


def _clusters(xs):
    """並んだ x 座標を、2px 以内で続くまとまりに分ける"""
    out = []
    for x in xs:
        if out and x - out[-1][-1] <= 2:
            out[-1].append(x)
        else:
            out.append([x])
    return out
```
- `CHART_INK_JS` の色の判定：▼は `#ffd166`（255,209,102）。再生位置の線（`--hlx-accent`。模擬ページは `html[dark]` なので `#ff4d6d`＝緑 77）と、シークの点線（`--hlx-fg`＝`#f1f1f1`、青 241）は条件（緑 > 150 かつ 青 < 160）に入らない（panel.css 1〜24行で確認）。ヒートマップの色は▼の帯（y = 0〜8）に描かれない（行は y = 9 から）。

### 7.4 補助メソッド（`ExtensionE2ETest` の中。名前が `test_` で始まらないので、テストとしては実行されない）
```python
    def _open_done(self, pw, profile):
        """新しいプロファイルで開き、解析を done まで進め、初回案内を閉じる。(ctx, pg, errors) を返す"""
        ctx = pw.chromium.launch_persistent_context(
            os.path.join(self.tmp, profile), channel="chromium", headless=True,
            args=[f"--disable-extensions-except={EXT}", f"--load-extension={EXT}"],
            viewport={"width": 1400, "height": 1000})
        try:
            ctx.route("https://www.youtube.com/**", self.route)
            pg = ctx.new_page()
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"https://www.youtube.com/watch?v={VID}")
            pg.wait_for_selector(".hlx-fab", timeout=20000)
            pg.click(".hlx-fab")
            pg.click(".hlx-primary")
            pg.wait_for_function("['done','error'].includes(document.querySelector('.hlx-panel').dataset.view)",
                                 timeout=60000)
            self.assertEqual(pg.eval_on_selector(".hlx-panel", "e => e.dataset.view"), "done",
                             pg.inner_text(".hlx-status"))
            # 初回案内を閉じ、2回目以降の利用と同じ配置にする（案内の高さを比較に持ち込まない）
            pg.wait_for_function("!document.querySelector('.hlx-notice').hidden", timeout=10000)
            pg.click(".hlx-notice-ok")
            return ctx, pg, errors
        except Exception:
            ctx.close()
            raise

    def _settle(self, pg):
        h = pg.evaluate(SETTLE_JS)
        self.assertIsNotNone(h, "グラフの高さが落ち着かない")
        return h

    def _layout(self, pg):
        return pg.evaluate(LAYOUT_JS)

    def _set_mode(self, pg, name):
        """切り替えボタン（.hlx-tl-ctl の中を文字で特定）を押し、描き直しを待つ"""
        pg.locator(".hlx-tl-ctl").get_by_role("button", name=name, exact=True).click()
        self._settle(pg)

    def _set_wide(self, pg, wide):
        """⇔ でパネルの幅を変える。描き直しは 220ms 後なので 400ms 待ってから落ち着きを待つ"""
        if pg.eval_on_selector(".hlx-panel", "p => p.classList.contains('hlx-wide')") != wide:
            pg.click(".hlx-tl-ctl .hlx-small")
            pg.wait_for_timeout(400)
        self._settle(pg)

    def _assert_same(self, cond, base, now):
        self.assertEqual(now["scrollTop"], base["scrollTop"], f"[{cond}] パネルがスクロールした: {base} → {now}")
        for k in ("canvasTop", "canvasH", "score", "time", "row"):
            self.assertLessEqual(abs(now[k] - base[k]), TOL,
                                 f"[{cond}] {k}: {base[k]} → {now[k]}（差 {now[k] - base[k]:.1f}px）")

    def _round_trip(self, pg, cond, base=None):
        """ヒートマップ → 折れ線 → ヒートマップ。毎回 base（省略時は開始時の値）と比べる"""
        pg.eval_on_selector(".hlx-panel", "p => { p.scrollTop = 0 }")
        self._settle(pg)
        start = self._layout(pg)
        self.assertEqual(start["mode"], "ヒートマップ", f"[{cond}] 開始時の表示")
        base = base or start
        self._assert_same(cond + " 開始", base, start)
        for name in ("折れ線", "ヒートマップ"):
            self._set_mode(pg, name)
            now = self._layout(pg)
            self.assertEqual(now["mode"], name, f"[{cond}] hlx-on が押したボタンに付いていない")
            self._assert_same(f"{cond} → {name}", base, now)
        return base
```
- **セレクタ（N-3）**：切り替えボタンは `.hlx-tl-ctl` の中で `get_by_role("button", name=…, exact=True)`（「ヒートマップ」「折れ線」）。並べ替えボタンは `.hlx-toolbar` の中を文字（「スコア順」「時系列順」）で特定。どちらも `.hlx-chip-btn` で共通なので、クラスだけで選ばない。⇔ は `.hlx-tl-ctl .hlx-small`、表示範囲は `.hlx-tl-ctl .hlx-select`。`.hlx-primary` は既存どおり解析ボタン。
- **待ち方（REQ 8章(6)・BD 7.4 (6)）**：切り替えは同期処理（4.1.4 節）だが、念のため `SETTLE_JS`（描画の枠ごとに canvas の高さを読み、**2回続けて同じ値**になったら返す。60枠で落ち着かなければ失敗）で待つ。⇔ の後は **400ms**（220ms より長い）待ってから `SETTLE_JS`。ビューポートの変更の後も `SETTLE_JS`。
- **scrollTop（N-6）**：各往復の開始時に `.hlx-panel` の `scrollTop` を 0 にそろえ、比べるたびに `scrollTop` が開始時と**等しい**ことを確かめる（`_assert_same` の最初）。クリックで Playwright が要素を見える位置へスクロールした場合はここで失敗し、原因が分かる（切り替えボタンはパネルの上の方にあるので、起きない見込み）。
- **初回案内を閉じる理由**：新しいプロファイルでは案内（`.hlx-notice`）がグラフの上に出る。閉じたままにしておくと、比較・画像が2回目以降の利用と同じ配置になる。案内を閉じる処理は同期（`hidden = true`）で、比較の前に済ませる。

### 7.5 新規テスト1：`test_toggle_keeps_layout`（A-01〜A-06）
プロファイル：`profile-toggle-layout`。
```python
    def test_toggle_keeps_layout(self):
        """REQ-0002 A-01〜A-06：表示を切り替えても、グラフより下（並べ替えボタン・候補一覧）が動かない"""
        with sync_playwright() as pw:
            ctx, pg, errors = self._open_done(pw, "profile-toggle-layout")
            try:
                # A-01〜A-03：1400px・通常幅・全体で5往復し、毎回、最初の値と比べる
                base = None
                for i in range(5):
                    base = self._round_trip(pg, f"1400/通常/all {i + 1}往復目", base)
                # A-04：4行のとき、両表示とも 189px
                self.assertAlmostEqual(base["canvasH"], CHART_H_4ROWS, delta=TOL)
                self._set_mode(pg, "折れ線")
                self.assertAlmostEqual(self._layout(pg)["canvasH"], CHART_H_4ROWS, delta=TOL)
                self._set_mode(pg, "ヒートマップ")

                # A-05・A-06：ウィンドウ幅・パネル幅・表示範囲を変えて1往復ずつ
                for vw, wide, rng in TOGGLE_CONDITIONS:
                    cond = f"{vw}/{'広げた' if wide else '通常'}/{rng}"
                    with self.subTest(cond=cond):
                        if pg.viewport_size["width"] != vw:
                            pg.set_viewport_size({"width": vw, "height": 1000})
                        self._set_wide(pg, wide)
                        pg.select_option(".hlx-tl-ctl .hlx-select", rng)
                        self._settle(pg)
                        lay = self._layout(pg)
                        self.assertAlmostEqual(lay["panelW"], min(760 if wide else 400, vw), delta=TOL,
                                               msg=f"[{cond}] パネル幅（前提の確認）")
                        self._round_trip(pg, cond)
                self.assertEqual(errors, [])
            finally:
                ctx.close()
```
測る値と許容：

| 値 | 取り方 | 合格の条件 |
|---|---|---|
| `score`・`time` | `.hlx-toolbar` の「スコア順」「時系列順」の `getBoundingClientRect().top` | 基準との差の絶対値 ≤ 1px |
| `row` | 最初の `.hlx-row` の top | 同上 |
| `canvasTop`・`canvasH` | `.hlx-chart` の top・height | 同上。さらに `canvasH` は 189 ± 1（4行） |
| `scrollTop` | `.hlx-panel` の `scrollTop` | 基準と等しい（往復の開始時に 0 にそろえる） |
| `mode` | `.hlx-tl-ctl` の中で `hlx-on` が付いたボタンの文字 | 押したボタンの文字と一致 |
| `panelW` | `.hlx-panel` の幅 | min(400 または 760, ビューポート幅) ± 1（条件が狙いどおりかの前提の確認） |

- **比べる基準**：A-01〜A-03 は「1400/通常/all」の1往復目の開始時の値（5往復のあいだ固定）。A-05・A-06 は条件ごとに、その条件での開始時（ヒートマップ）の値。幅が変わると `.hlx-hint` や `.hlx-toolbar` の折り返しで位置が変わるので、条件をまたいでは比べない（REQ 8章(5)・BD 7.4 (5)）。
- **条件の代表の取り方（決定）**：全通り（ビューポート3 × パネル幅2 × 表示範囲4＝24）ではなく、`TOGGLE_CONDITIONS` の **12 条件**にする。
  - ビューポート 1400・800・500 × パネル幅（通常・広げた）の6通りは、すべて「全体（all）」で行う。幅は折り返しを通じて下の部品の位置を変えうる唯一の入力なので、全通りを見る。
  - 表示範囲「前後15分（near）」「前半（first）」「後半（second）」は、いちばん広い条件（1400・通常）といちばん狭い条件（500・広げた。パネルは `max-width: 100vw` で 500px に縮む）の2か所で行う。表示範囲は描く中身（横の区間）を変えるだけで、H の式にも配置にも入らないので、両端の2か所で足りると判断する。
  - 注記：模擬の動画は30分（`DURATION = 1800`）なので、「前後15分」は計算上いつも [0, 1800]（全体と同じ範囲）になる（`viewRange()` 316〜320行）。select の操作と描き直しの経路は通るが、描く中身は「全体」と同じ。前半・後半は中身が変わる。
- **実行時間（見込み）**：切り替え 10 回＋24 回、⇔ の待ち 400ms × 3 回程度、ビューポートの変更 2 回。ブラウザの起動と解析は1回。既存1件と同程度（十数秒）の増加の見込み（未計測。テスト仕様書の作成時に一度測り、記録する）。

### 7.6 新規テスト2：`test_toggle_keeps_drawing_and_actions`（A-07〜A-10、社長確認用の画像）
プロファイル：`profile-toggle-draw`。ビューポートは 1400×1000 のまま。
```python
    def test_toggle_keeps_drawing_and_actions(self):
        """REQ-0002 A-07〜A-10：どちらの表示でも中身が描かれ、並べ替え・クリック・縦線が動く（社長確認用の画像も保存）"""
        with sync_playwright() as pw:
            ctx, pg, errors = self._open_done(pw, "profile-toggle-draw")
            try:
                marks = pg.eval_on_selector_all(".hlx-mark", "ms => ms.map(m => parseFloat(m.style.left))")
                self.assertGreater(len(marks), 0)
                ink_args = {"labelW": LABEL_W, "markH": MARK_H, "axisH": AXIS_H, "gap": GAP, "rowH": ROW_H, "rows": 4}

                # A-07（＋F-05）：通常幅・広げた幅 × ヒートマップ・折れ線
                for wide in (False, True):
                    self._set_wide(pg, wide)
                    for name, key in (("ヒートマップ", "heat"), ("折れ線", "line")):
                        cond = f"{'広げた' if wide else '通常'}/{name}"
                        self._set_mode(pg, name)
                        on = dict(pg.eval_on_selector_all(
                            ".hlx-tl-ctl .hlx-chip-btn", "bs => bs.map(b => [b.textContent, b.classList.contains('hlx-on')])"))
                        self.assertEqual(on, {"ヒートマップ": key == "heat", "折れ線": key == "line"}, cond)
                        ink = pg.evaluate(CHART_INK_JS, ink_args)
                        self.assertAlmostEqual(ink["H"], CHART_H_4ROWS, delta=TOL, msg=cond)
                        for ri, r in enumerate(ink["rows"]):
                            self.assertEqual(r, {"label": True, "top": True, "bottom": True, "gap": True},
                                             f"[{cond}] {ri + 1}行目: {r}")
                        pw_ = ink["W"] - LABEL_W
                        for pct in marks:     # 表示範囲は「全体」なので、全部の▼が見える
                            x = LABEL_W + pct / 100 * pw_
                            self.assertTrue(any(abs(v - x) <= 4 for v in ink["marks"]),
                                            f"[{cond}] ▼が無い（x≈{x:.0f}）: {ink['marks']}")
                        self.assertGreaterEqual(len(_clusters(ink["axis"])), 3, f"[{cond}] 目盛り: {ink['axis']}")
                        # 社長確認用の画像（合否には使わない）
                        pg.eval_on_selector(".hlx-panel", "p => { p.scrollTop = 0 }")
                        pg.locator(".hlx-panel").screenshot(
                            path=os.path.join(ARTIFACTS, f"toggle_{key}_{'wide' if wide else 'normal'}.png"))
                self._set_wide(pg, False)

                # A-10：切り替えた後でも並べ替えが効く
                toolbar = pg.locator(".hlx-toolbar")
                initial = pg.evaluate(TIMES_JS)          # 解析直後＝スコア順
                self.assertGreaterEqual(len(initial), 2)
                for name in ("折れ線", "ヒートマップ"):
                    self._set_mode(pg, name)
                    toolbar.get_by_role("button", name="時系列順", exact=True).click()
                    ts = [_secs(t) for t in pg.evaluate(TIMES_JS)]
                    self.assertEqual(ts, sorted(ts), f"[{name}] 時系列順になっていない")
                    self.assertEqual(ts[0], min(_secs(t) for t in initial))
                    toolbar.get_by_role("button", name="スコア順", exact=True).click()
                    self.assertEqual(pg.evaluate(TIMES_JS), initial, f"[{name}] スコア順に戻らない")

                if not self.has_video:
                    self.assertEqual(errors, [])
                    self.skipTest("ffmpeg が無いため、折れ線での動画との連動は確かめられません")
                pg.wait_for_function("document.querySelector('video').readyState >= 1", timeout=20000)

                # A-08：折れ線でグラフ中央（15:00）をクリック → 30秒前（14:30）へ
                self._set_mode(pg, "折れ線")
                box = pg.locator(".hlx-chart").bounding_box()
                pg.mouse.click(box["x"] + LABEL_W + (box["width"] - LABEL_W) * 0.5, box["y"] + 30)
                pg.wait_for_timeout(800)
                t = pg.eval_on_selector("video", "v => v.currentTime")
                self.assertAlmostEqual(t, DURATION * 0.5 - LEAD, delta=31)

                # A-09：折れ線で、再生位置（20:00）の縦線と、シークバー25%（7:30）の点線
                pg.eval_on_selector("video", "v => { v.currentTime = 1200 }")
                pg.wait_for_timeout(600)
                bar = pg.locator(".ytp-progress-bar").bounding_box()
                pg.mouse.move(bar["x"] + bar["width"] * 0.25, bar["y"] + 2)
                pg.wait_for_timeout(500)
                ink = pg.evaluate(GAP_INK_JS)
                pw_ = ink["width"] - LABEL_W

                def near(sec):
                    x = LABEL_W + sec / DURATION * pw_
                    return any(abs(v - x) <= 3 for v in ink["xs"])

                self.assertTrue(near(1200), f"折れ線：再生位置の縦線が無い: {ink}")
                self.assertTrue(near(450), f"折れ線：シークバーの点線が無い: {ink}")
                pg.locator(".hlx-chart-wrap").screenshot(path=os.path.join(ARTIFACTS, "timeline_line.png"))
                self.assertEqual(errors, [])
            finally:
                ctx.close()
```

#### 7.6.1 A-07 の画素の確認の具体（`CHART_INK_JS`。座標は canvas の CSS ピクセル）
| 確かめるもの | 読む場所 | 合格の条件 |
|---|---|---|
| 4行のラベル | x = 0〜66（`LABEL_W − 4`）、y = 各行の縦の中央 ± 4（28, 69, 110, 151 の ± 4） | 4行とも、範囲の中にインク（alpha > 0）がある |
| 行の太さ（38px） | x = `LABEL_W + floor(PW/2)`（グラフの横の中央）の、y = 行の上端 + 1 と 下端 − 2（行0：10 と 45） | 両方にインクがある（ヒートマップは色、折れ線は背景 `--hlx-card`） |
| 行と行のすき間 | 同じ x の y = 行の上端 + 39（行0〜2：48, 89, 130） | インクが無い（alpha = 0）。ヒートマップが 18px のままなら、行1・行2 の確認位置（89・130）が別の行の塗りの中になり失敗する（その前に `H` = 109 の判定で止まる） |
| ▼（見どころの数ぶん） | y = 1〜5 の帯の、▼の色（赤 > 200・緑 > 150・青 < 160）の x | シークバーの `.hlx-mark` の `left`（%）から求めた x（`LABEL_W + left/100 × PW`）の ± 4px に、▼の色が**すべての印について**ある |
| 目盛り | y = H − 16 〜 H − 14 の帯（刻み `fillRect(x, H−16, 1, 3)`） | インクの x が、2px より離れたまとまりで **3つ以上**（通常幅は 0:00・10:00・20:00、広げた幅は5分ごと。30:00 の刻みは x = W で canvas の外になり描かれない。0:00 の刻みには再生位置の時刻ラベルが重なるが、まとまりの数え方に影響しない） |
| `hlx-on` | `.hlx-tl-ctl .hlx-chip-btn` | 押した方だけに付いている（F-05） |
| 再生位置の線 | ― | A-09（`near(1200)`）で確かめる。A-07 の時点では `currentTime` = 0 の線が x = 70 にあるだけで、上の判定を邪魔しない |

- 判定の前提：マウスがグラフにもシークバーにも乗っていないこと（マウス位置の線・点線が出ない）。`_set_mode` のクリックでマウスは切り替えボタンの上にあり、グラフ・シークバーから離れている。
- ▼の x と `.hlx-mark` の対応：グラフの x は `S.res.duration`（1800）を、シークバーの印は動画の長さ（あれば `video.duration`＝1800、無ければ `S.res.duration`）を使う。模擬ではどちらも 1800 なので一致する（見込み。違えば ± 4px で落ちるので分かる）。

#### 7.6.2 社長確認用の画像（BD 4.2。合否の判定には使わない）
| ファイル名 | 保存先 | 内容 |
|---|---|---|
| `toggle_heat_normal.png` | `ARTIFACTS`（`tests/e2e/_artifacts/`。git 管理外：`.gitignore` 8行） | ヒートマップ・通常幅（400px）。`.hlx-panel` の要素の画像（グラフ・凡例・説明文・並べ替えボタン・候補一覧の始まりまで） |
| `toggle_line_normal.png` | 同上 | 折れ線・通常幅 |
| `toggle_heat_wide.png` | 同上 | ヒートマップ・広げた幅（760px） |
| `toggle_line_wide.png` | 同上 | 折れ線・広げた幅 |
| `timeline_line.png`（任意） | 同上 | 折れ線の `.hlx-chart-wrap`（既存の `timeline.png` の折れ線版。ffmpeg がある場合だけ） |

- 撮る前に初回案内を閉じ（`_open_done`）、`scrollTop` を 0 にする。ビューポートは 1400×1000、模擬ページは `html[dark]`（ダーク）。
- 品質保証課のテスト係が E2E の実行後にこの4枚を QA 報告書に添付（またはパスを記載）し、部長経由で社長に見てもらう。「ヒートマップが太すぎる」などの意見が出たら設計課に戻す（BD 7.4 (9)）。明るいテーマの見え方は手動 M-3。

#### 7.6.3 注意
- A-10：模擬データで「スコア順」と「時系列順」の先頭がたまたま同じになっても、合否は「時系列順で昇順になる」「先頭が最小の時刻」「スコア順で解析直後の並びに戻る」で決める。先頭が実際に入れ替わるかは、テスト仕様書の作成時に一度実行して記録する（未確認）。
- A-08（ヒートマップ側）は既存の `test_panel_analysis_and_video_sync` が行う（ヒートマップの状態でクリック。y = 30 は変更後も1行目の中＝9〜47px。N-2）。A-09（ヒートマップ側）も同じテストの `near()` が、7.2 節で直した `GAP_INK_JS` で行う。
- ffmpeg が無い環境では、A-08・A-09 の部分だけ省略（skip）になり、A-07・A-10 と画像は確かめられる。品質保証課は ffmpeg（`imageio-ffmpeg`）のある環境で実行し、skip が無いことを QA に書く。
- 動画はクリックで再生が始まる（`seek()` が `play()` を呼ぶ）。A-09 の 600＋500ms のあいだに約1秒進むが、`near()` の ±3px（通常幅で約16秒）の中に収まる（既存テストと同じ条件）。

### 7.7 テストの観点の一覧（テスト仕様書の材料）
| ID | 観点 | 層 | 自動/手動 | 受け入れ基準 |
|---|---|---|---|---|
| T-E1 | `test_toggle_keeps_layout` の前半：1400/通常/all で5往復。各切り替えの後に `score`・`time`・`row`・`canvasTop`・`canvasH` が最初の値から 1px 以内、`scrollTop` が同じ、`hlx-on` が押した方 | View | 自動 | A-01・A-02・A-03 |
| T-E2 | 同上：`canvasH` が両表示で 189 ± 1 | View | 自動 | A-04 |
| T-E3 | 同上の後半：`TOGGLE_CONDITIONS` のうち「広げた」の条件（1400・800・500）で1往復ずつ | View | 自動 | A-05 |
| T-E4 | 同上の後半：ビューポート 1400・800・500 と、表示範囲 near・first・second（1400/通常、500/広げた）で1往復ずつ。500px でパネル幅が 500 に縮んでいること（前提の確認） | View | 自動 | A-06 |
| T-E5 | `test_toggle_keeps_drawing_and_actions`：通常幅・広げた幅 × 両表示で、ラベル・行の太さ・すき間・▼・目盛り・`hlx-on`（7.6.1 節） | View | 自動 | A-07・F-05 |
| T-E6 | 同上：社長確認用の画像4枚（7.6.2 節） | View | 自動（保存）＋手動（目視） | A-07（手動）・BD 4.2 |
| T-E7 | 同上：折れ線・ヒートマップに切り替えた後に「時系列順」で昇順・先頭が最小、「スコア順」で元の並び | View | 自動 | A-10 |
| T-E8 | 同上：折れ線でグラフ中央クリック → 14:30 ± 31秒（ffmpeg が要る） | View | 自動 | A-08 |
| T-E9 | 同上：折れ線で `near(1200)`・`near(450)`（ffmpeg が要る） | View | 自動 | A-09 |
| T-E10 | 既存 `test_panel_analysis_and_video_sync`（ヒートマップでのクリック・縦線）が、直した `GAP_INK_JS` で通る | View | 自動 | A-08・A-09（ヒートマップ側）・A-11 |
| T-E11 | 既存4件（`test_live_url_shows_fab_and_analyzes`・`test_panel_analysis_and_video_sync`・`test_first_notice_shows_acks_and_stays_hidden`・`test_unexpected_error_shows_fixed_message`）が通る。新規2件の `pageerror` が0件 | View | 自動 | A-11 |
| DC-1 | `node --test "tests/unit/*.test.js"` がすべて通る | ― | 自動 | A-11 |
| DC-2 | `python -m unittest discover -s tests/e2e -v` がすべて通る（skip が無いこと） | ― | 自動 | A-11 |
| DC-3 | `python shared/reference/metrics_ref.py --check` が通る | ― | 自動 | A-11 |
| DC-4 | `git diff main -- extension/manifest.json` が空（版数 1.2.1 のまま） | ― | レビュー | A-13 |
| DC-5 | `git diff main -- extension/panel.css extension/analyzer.js extension/fetcher.js extension/viewmodel shared` が空 | ― | レビュー | A-11・0.1 節 |
| DC-6 | `git diff main -- extension/content.js` が 4.1.1・4.1.2 節の2行だけ（折れ線の式 371行・塗り 363行に差分が無い） | View | レビュー | F-04・N-4 |
| DC-7 | 行数が4未満のとき：H = 25 + 41 × 行数 で、式に `S.mode` が入らないこと（コードの読み合わせ） | View | レビュー | F-06 |
| DC-8 | 8.1 節の修正前の失敗の記録（差 80px）がテスト仕様書にある | ― | 文書 | （テストの有効性） |
| M-1 | 実配信（Claude in Chrome）で、解析後に切り替えの前後で並べ替えボタンが動かない、YouTube のページが崩れない（運用係。画面サイズは可能な範囲で） | ― | 手動 | A-12 |
| M-2 | ブラウザのズーム（例：80%・125%）と Windows の表示スケーリングで、切り替えの前後でボタンが動かない（品質保証課） | ― | 手動 | A-06 の補い・REQ 8章(2) |
| M-3 | 明るいテーマでの見た目（ヒートマップの太い行・ラベル・凡例が読める） | ― | 手動 | 非機能（画面） |
| M-4 | 切り替え・マウス移動・再生中に引っかかりが無い（体感） | ― | 手動 | 非機能（処理時間） |

### 7.8 受け入れ基準との対応（漏れの確認）
| 受け入れ基準 | 確かめるテスト | assert |
|---|---|---|
| A-01 | T-E1 | `_round_trip` の「→ 折れ線」の後の `_assert_same`（`score`・`time`・`row`） |
| A-02 | T-E1 | `_round_trip` の「→ ヒートマップ」の後の `_assert_same` |
| A-03 | T-E1 | 5往復とも、1往復目の基準 `base` に対する `_assert_same` |
| A-04 | T-E1・T-E2 | `_assert_same` の `canvasH`（差 ≤ 1）と `assertAlmostEqual(…, CHART_H_4ROWS)` |
| A-05 | T-E3 | `TOGGLE_CONDITIONS` の `wide=True` の条件での `_round_trip`（前提として `panelW`） |
| A-06 | T-E4（＋M-2） | ビューポート 1400/800/500 と表示範囲 near/first/second の条件での `_round_trip` |
| A-07 | T-E5・T-E6 | 7.6.1 節の各 assert（ラベル・行の上下・すき間・▼・目盛り・`hlx-on`）、画像の目視 |
| A-08 | T-E8（折れ線）・T-E10（ヒートマップ） | `assertAlmostEqual(t, DURATION * 0.5 - LEAD, delta=31)` |
| A-09 | T-E9（折れ線）・T-E10（ヒートマップ） | `near(1200)`・`near(450)` |
| A-10 | T-E7 | 昇順・先頭が最小・スコア順で元の並び |
| A-11 | T-E10・T-E11・DC-1〜DC-3・DC-5 | 全件が通る |
| A-12 | M-1 | 手動 |
| A-13 | DC-4 | `git diff` が空 |

## 8. 前提となるリファクタリング
- **本件の前に必要なリファクタリングは無い。** 変更は `drawChart()` の高さの決め方（描画の寸法）だけで、View の中で閉じる。MVVM の層をまたぐ値の受け渡しを増やさない。
- 既知の逸脱 D-2（content.js がパネルの状態 `S`・`viewRange()`・`rows()` を持ち、ViewModel が View に混在）は、本件で増やしも減らしもしない。リファクタリング課への申し送り：将来 `drawChart()` を `extension/view/` に移すときは、`ROW_H` を `LABEL_W`・`MARK_H`・`AXIS_H`・`GAP` と一緒に View 側の描画の定数として移す（ViewModel に置かない。BD 2.2）。

### 8.1 修正前のコードで新テストが失敗することの確認（テストの有効性。1回だけ）
1. 1.1 節の手順1（テストの変更）だけを済ませ、`extension/content.js` は変更前のままにする（`git diff -- extension/content.js` が空であることを確かめる）。
2. 次を実行する：
   ```
   python -m unittest discover -s tests/e2e -k test_toggle_keeps_layout -v
   ```
3. 期待する結果：**FAIL**。1往復目の「→ 折れ線」で、`_assert_same` が `canvasTop` は通り、`canvasH` で `109.0 → 189.0（差 80.0px）` の文で止まる（計算上。`canvasH` の次に比べる `score`・`time`・`row` も同じく 80px ずれているはず）。
4. 失敗の文（差の値）をテスト仕様書の「修正前の確認」に写す。差が 80px でなかった場合も、その値をそのまま書く（BD 7.4 (1) の実測値の記録を兼ねる）。
5. 4.1 節の修正をしてから、同じコマンドで **OK** になることを確かめ、続けて 7.7 節 DC-1〜DC-3 を流す。
- 任意：同じ手順で `-k test_toggle_keeps_drawing_and_actions` も修正前に失敗する見込み（ヒートマップで `ink["H"]` が 109 になる判定）。必須ではない。
- 注意：修正前に `GAP_INK_JS` だけ直した状態では、既存の `test_panel_analysis_and_video_sync` は失敗しない（ヒートマップの行の中を読んで通る）。手順3で見るのは新テストの失敗だけでよい。

## 9. 共通指標仕様（shared/）への影響
- **なし。** `shared/**`・`extension/analyzer.js` を変えない。コメント量・加速度・同じコメントの流れる確率の定義と計算、スコア、`rows()` の値・`rankNorm()` は触らない。
- 確かめ方：7.7 節 DC-3・DC-5。

## 10. 未決事項
| No | 内容 | 扱い |
|---|---|---|
| U-1 | **テスト仕様書・テスト結果報告書の番号**（BD 7.4 (8)）。TS-0002・QA-0002 は REQ-0001 の系列で使用済み | **部長の決定に従う。** 決まるまでの仮の名前は `docs/05_dev/test-spec/TS-0002-toggle-layout.md`・`docs/06_qa/reports/QA-0002-toggle-layout.md`（BD の推奨 (b)）。部長が別の番号に決めた場合は、ファイル名・先頭の id をそれに合わせ、本書の記載は読み替える |
| U-2 | `docs/02_requirements/spec-current.md` の更新（REQ 8章(7)・BD 7.1） | 実装・QA の後、現状仕様係（`chrome-req-spec`）が「6. パネル」の「表示切り替えでグラフの高さが変わる（現状の挙動）」の項（39〜41行付近）を、「どちらの表示も1行38px、4行で189px。切り替えで高さは変わらない」に直す。段取りは要件定義課長 |
| U-3 | 新規 E2E の実行時間（7.5 節の見込み） | テスト仕様書の作成時に一度測り、記録する。極端に長い（例：新規2件で60秒超）場合は、`TOGGLE_CONDITIONS` から表示範囲の条件を減らす案を設計課に戻す |
| U-4 | 模擬データで並べ替えの先頭が入れ替わるか（7.6.3 節） | テスト仕様書の作成時に記録。合否には影響しない |
| U-5 | 画像確認の結果、見た目を変える意見が出た場合（BD 7.4 (9)） | 設計課に戻す。定数 `ROW_H` の値の変更で済む見込み（その場合は 7.3 節の `ROW_H`・`CHART_H_4ROWS` と 4.1.3 節の数値を合わせて直す） |

## 付記 変えてはいけないもの
- `extension/manifest.json`（版数 `1.2.1`、`permissions`・`host_permissions`・`content_scripts`）、`extension/panel.css`、`shared/**`。
- content.js の文言（`.hlx-hint`・凡例・ボタン名）、部品の並び（103〜124行）、`setMode`（82〜84行）、⇔ の `setTimeout(drawChart, 220)`、折れ線の式（371行）、ヒートマップの塗り方（353〜363行）。
- 既存の E2E 4件のテストメソッドの本体（変えるのはモジュールの `GAP_INK_JS` の2行だけ）。

## 改訂履歴
| 日付 | 版 | 内容 | 承認 |
|---|---|---|---|
| 2026-10-30 | 初版 | 作成・課長レビュー（差し戻しなし）で承認 | chrome-design-kacho |
