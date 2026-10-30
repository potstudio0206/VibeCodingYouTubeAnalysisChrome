# -*- coding: utf-8 -*-
"""in Chrome版のE2Eテスト。

本物のChromium（Playwright）に拡張機能を読み込み、YouTubeを模擬したページで次を確かめる。
- パネルを開いて解析が完了し、見どころ候補とシークバーの印が出る
- グラフのクリックで動画がその場面（少し前）へジャンプする
- 再生位置の縦線と、シークバーで指している位置の点線がグラフに出る
- 初回案内（DD-0001）：出る・確認すると消える・想定外のエラーは日本語の定型文

準備（初回のみ）:
  pip install -r requirements-dev.txt
  python -m playwright install chromium
実行:
  python -m unittest discover -s tests/e2e -v
"""
import json
import os
import random
import shutil
import subprocess
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXT = os.path.join(ROOT, "extension")
ARTIFACTS = os.path.join(ROOT, "tests", "e2e", "_artifacts")   # スクリーンショットの保存先（git管理外）
VID = "SYNTHabc123"
DURATION = 1800
LABEL_W = 70          # content.js のグラフ左端のラベル幅
LEAD = 30             # 既定の「何秒前から再生するか」

try:
    from playwright.sync_api import sync_playwright
except ImportError:      # Playwright が無い環境ではスキップ
    sync_playwright = None


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg")


def make_video(path):
    """30分・1fpsの小さなテスト動画（シーク確認用）"""
    ff = ffmpeg_exe()
    if not ff:
        return False
    subprocess.run([ff, "-v", "error", "-y", "-f", "lavfi", "-i", f"testsrc=duration={DURATION}:size=160x90:rate=1",
                    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", path], check=True)
    return True


def build_mock():
    """模擬YouTube：視聴ページ、チャットリプレイの初回ページ、継続API"""
    rnd = random.Random(1)
    acts, mid = [], 0

    def add(t, text, kind="liveChatTextMessageRenderer"):
        nonlocal mid
        mid += 1
        acts.append({"replayChatItemAction": {
            "actions": [{"addChatItemAction": {"item": {kind: {"id": f"m{mid}", "message": {"runs": [{"text": text}]}}}}}],
            "videoOffsetTimeMsec": str(int(t * 1000))}})

    normal = ["こんばんは", "おつ", "それな", "わかる", "なるほど", "かわいい", "がんばれ", "コンボ練習えらい", "ランクいこう"]
    for t in range(0, DURATION, 3):
        add(t + rnd.random(), rnd.choice(normal))
    for et, w in [(300, "草"), (720, "888"), (1200, "!?!?"), (1500, "wwwww")]:
        for _ in range(150):
            add(et + rnd.random() * 90, w)
    for _ in range(10):
        add(900 + rnd.random() * 60, "おめでとう", "liveChatPaidMessageRenderer")
    acts.sort(key=lambda a: int(a["replayChatItemAction"]["videoOffsetTimeMsec"]))
    pages = [acts[i:i + 400] for i in range(0, len(acts), 400)]

    heat = [{"payload": {"macroMarkersListEntity": {"markersList": {"markerType": "MARKER_TYPE_HEATMAP", "markers": [
        {"startMillis": str(i * 180000), "durationMillis": "180000", "intensityScoreNormalized": 1 if i == 4 else 0.2}
        for i in range(10)]}}}}]
    yid = {"contents": {"twoColumnWatchNextResults": {"conversationBar": {"liveChatRenderer": {
        "continuations": [{"reloadContinuationData": {"continuation": "TOP"}}]}}}},
        "frameworkUpdates": {"entityBatchUpdate": {"mutations": heat}}}
    ypr = {"videoDetails": {"title": "合成テスト配信", "author": "テスト", "lengthSeconds": str(DURATION), "isLive": False},
           "playabilityStatus": {"status": "OK"}}
    cfg = {"INNERTUBE_API_KEY": "K", "INNERTUBE_CLIENT_VERSION": "2.1",
           "INNERTUBE_CONTEXT": {"client": {"clientName": "WEB", "clientVersion": "2.1", "visitorData": "V"}}}
    watch = f"""<!doctype html><html dark><head><meta charset=utf-8><title>test</title></head>
<body style="margin:0;background:#0f0f0f;color:#fff">
<div style="height:56px;background:#202020">masthead</div>
<div id="movie_player" style="width:860px;height:484px;background:#000;position:relative;margin:16px">
<video src="/test.mp4" muted preload="auto" style="width:100%;height:100%"></video>
<div class="ytp-progress-bar" style="position:absolute;left:12px;right:12px;bottom:40px;height:5px;background:#666"></div></div>
<script>var ytcfg = {{ set: function () {{}} }};</script>
<script>var ytInitialPlayerResponse = {json.dumps(ypr, ensure_ascii=False)};</script>
<script>var ytInitialData = {json.dumps(yid, ensure_ascii=False)};</script>
<script>ytcfg.set({json.dumps(cfg)});</script></body></html>"""
    first = {"continuationContents": {"liveChatContinuation": {
        "header": {"liveChatHeaderRenderer": {"viewSelector": {"sortFilterSubMenuRenderer": {"subMenuItems": [
            {}, {"continuation": {"reloadContinuationData": {"continuation": "P0", "trackingParams": "TP"}}}]}}}},
        "actions": acts[:5], "continuations": [{"liveChatReplayContinuationData": {"continuation": "TOPNEXT"}}]}}}
    return watch, first, pages


# グラフの行と行のすき間（縦線だけが描かれる場所）にあるインクの位置を返す
GAP_INK_JS = """
() => {
  const c = document.querySelector('.hlx-chart');
  const ctx = c.getContext('2d');
  const dpr = c.width / c.clientWidth;
  const rh = 38, MARK_H = 9, GAP = 3;   // content.js の ROW_H（表示に依らない。BD-0002 N-1）
  const xs = new Set();
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < GAP; k++) {
      const y = Math.floor((MARK_H + rh + row * (rh + GAP) + k) * dpr);
      const d = ctx.getImageData(0, y, c.width, 1).data;
      for (let x = 0; x < c.width; x++) if (d[x * 4 + 3] > 0) xs.add(Math.round(x / dpr));
    }
  }
  return { width: c.clientWidth, xs: [...xs].sort((a, b) => a - b) };
}
"""

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


@unittest.skipIf(sync_playwright is None, "playwright が入っていません（pip install -r requirements-dev.txt）")
class ExtensionE2ETest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(prefix="hlx-e2e-")
        cls.video = os.path.join(cls.tmp, "test.mp4")
        cls.has_video = make_video(cls.video)
        cls.watch, cls.first, cls.pages = build_mock()
        os.makedirs(ARTIFACTS, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def route(self, route):
        u = route.request.url
        if u.endswith("/test.mp4"):
            with open(self.video, "rb") as f:
                data = f.read()
            rg = route.request.headers.get("range")
            if rg:
                a, b = rg.split("=")[1].split("-")
                a = int(a)
                b = int(b) if b else len(data) - 1
                return route.fulfill(status=206, body=data[a:b + 1], headers={
                    "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Range": f"bytes {a}-{b}/{len(data)}"})
            return route.fulfill(status=200, body=data, headers={"Content-Type": "video/mp4", "Accept-Ranges": "bytes"})
        if "/youtubei/v1/live_chat/get_live_chat_replay" in u:
            n = int(json.loads(route.request.post_data)["continuation"][1:])
            nxt = [{"liveChatReplayContinuationData": {"continuation": f"P{n + 1}", "clickTrackingParams": "x"}}] \
                if n + 1 < len(self.pages) else []
            body = {"continuationContents": {"liveChatContinuation": {"actions": self.pages[n], "continuations": nxt}}}
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(body, ensure_ascii=False))
        if "/live_chat_replay" in u:
            return route.fulfill(status=200, content_type="text/html",
                                 body='<script>window["ytInitialData"] = ' + json.dumps(self.first, ensure_ascii=False) + ";</script>")
        if "/watch" in u or "/live/" in u:
            return route.fulfill(status=200, content_type="text/html; charset=utf-8", body=self.watch)
        return route.fulfill(status=404, body="")

    def test_live_url_shows_fab_and_analyzes(self):
        """INC-0001 回帰：/live/<ID> 形式のURLでも「見どころ」ボタンが出て、解析が完了する"""
        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                os.path.join(self.tmp, "profile-live"), channel="chromium", headless=True,
                args=[f"--disable-extensions-except={EXT}", f"--load-extension={EXT}"],
                viewport={"width": 1400, "height": 1000})
            try:
                ctx.route("https://www.youtube.com/**", self.route)
                pg = ctx.new_page()
                errors = []
                pg.on("pageerror", lambda e: errors.append(str(e)))
                pg.goto(f"https://www.youtube.com/live/{VID}")
                pg.wait_for_selector(".hlx-fab", timeout=20000)
                pg.click(".hlx-fab")
                pg.click(".hlx-primary")
                pg.wait_for_function("['done','error'].includes(document.querySelector('.hlx-panel').dataset.view)",
                                     timeout=60000)
                self.assertEqual(pg.eval_on_selector(".hlx-panel", "e => e.dataset.view"), "done",
                                 pg.inner_text(".hlx-status"))
                self.assertIn("見どころ候補", pg.inner_text(".hlx-status"))
                self.assertEqual(errors, [])
            finally:
                ctx.close()

    def test_panel_analysis_and_video_sync(self):
        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                os.path.join(self.tmp, "profile"), channel="chromium", headless=True,
                args=[f"--disable-extensions-except={EXT}", f"--load-extension={EXT}"],
                viewport={"width": 1400, "height": 1000})
            try:
                ctx.route("https://www.youtube.com/**", self.route)
                pg = ctx.new_page()
                errors = []
                pg.on("pageerror", lambda e: errors.append(str(e)))
                pg.goto(f"https://www.youtube.com/watch?v={VID}")

                # パネルを開いて解析
                pg.wait_for_selector(".hlx-fab", timeout=20000)
                pg.click(".hlx-fab")
                pg.click(".hlx-primary")
                pg.wait_for_function("['done','error'].includes(document.querySelector('.hlx-panel').dataset.view)",
                                     timeout=60000)
                self.assertEqual(pg.eval_on_selector(".hlx-panel", "e => e.dataset.view"), "done",
                                 pg.inner_text(".hlx-status"))
                self.assertIn("見どころ候補", pg.inner_text(".hlx-status"))
                rows = pg.locator(".hlx-row").count()
                self.assertGreaterEqual(rows, 4)
                self.assertEqual(pg.locator(".hlx-mark").count(), rows)
                pg.screenshot(path=os.path.join(ARTIFACTS, "panel.png"))

                if not self.has_video:
                    self.skipTest("ffmpeg が無いため、動画との連動は確かめられません")
                pg.wait_for_function("document.querySelector('video').readyState >= 1", timeout=20000)

                # グラフ中央（15:00）のクリック → 30秒前（14:30）へジャンプ
                box = pg.locator(".hlx-chart").bounding_box()
                pg.mouse.click(box["x"] + LABEL_W + (box["width"] - LABEL_W) * 0.5, box["y"] + 30)
                pg.wait_for_timeout(800)
                t = pg.eval_on_selector("video", "v => v.currentTime")
                self.assertAlmostEqual(t, DURATION * 0.5 - LEAD, delta=31)

                # 再生位置（20:00）の縦線と、シークバー25%（7:30）を指したときの点線
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

                self.assertTrue(near(1200), f"再生位置の縦線が無い: {ink}")
                self.assertTrue(near(450), f"シークバーの点線が無い: {ink}")
                pg.locator(".hlx-chart-wrap").screenshot(path=os.path.join(ARTIFACTS, "timeline.png"))
                self.assertEqual(errors, [])
            finally:
                ctx.close()


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

    def test_first_notice_shows_acks_and_stays_hidden(self):
        """DD-0001 T-E1/T-E2/T-E5：初回案内が出て、解析を妨げず、「確認しました」で消え、再読み込みしても出ない"""
        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                os.path.join(self.tmp, "profile-notice"), channel="chromium", headless=True,
                args=[f"--disable-extensions-except={EXT}", f"--load-extension={EXT}"],
                viewport={"width": 1400, "height": 1000})
            try:
                ctx.route("https://www.youtube.com/**", self.route)
                urls = []
                ctx.on("request", lambda r: urls.append(r.url))
                pg = ctx.new_page()
                errors = []
                pg.on("pageerror", lambda e: errors.append(str(e)))
                pg.goto(f"https://www.youtube.com/watch?v={VID}")
                pg.wait_for_selector(".hlx-fab", timeout=20000)
                pg.click(".hlx-fab")

                # T-E1：案内が出る（既読の読み出しが終わると hidden が外れる）
                pg.wait_for_function("document.querySelector('.hlx-notice') && !document.querySelector('.hlx-notice').hidden",
                                     timeout=10000)
                text = pg.inner_text(".hlx-notice")
                for word in ["はじめにお読みください", "非公式", "自己責任", "保存します"]:
                    self.assertIn(word, text)
                # 案内を出したまま解析できる（ボタンを覆わない）
                pg.click(".hlx-primary")
                pg.wait_for_function("['done','error'].includes(document.querySelector('.hlx-panel').dataset.view)",
                                     timeout=60000)
                self.assertEqual(pg.eval_on_selector(".hlx-panel", "e => e.dataset.view"), "done",
                                 pg.inner_text(".hlx-status"))
                self.assertFalse(pg.eval_on_selector(".hlx-notice", "e => e.hidden"), "解析が終わっても案内は出たまま")
                pg.screenshot(path=os.path.join(ARTIFACTS, "notice.png"))

                # T-E2：確認すると消える。再読み込みしても出ない
                before = len(urls)
                pg.click(".hlx-notice-ok")
                self.assertTrue(pg.eval_on_selector(".hlx-notice", "e => e.hidden"))
                pg.wait_for_timeout(500)
                self.assertEqual(len(urls), before, "案内の確認で通信が増えてはいけない")
                pg.reload()
                pg.wait_for_selector(".hlx-fab", timeout=20000)
                pg.click(".hlx-fab")
                pg.wait_for_function("document.querySelector('.hlx-panel').dataset.view === 'done'", timeout=60000)
                pg.wait_for_timeout(1000)
                self.assertTrue(pg.eval_on_selector(".hlx-notice", "e => e.hidden"), "確認済みなら再読み込み後も出ない")
                self.assertEqual(errors, [])

                # T-E5：http の宛先は www.youtube.com だけ
                hosts = {u.split("/")[2] for u in urls if u.startswith("http")}
                self.assertEqual(hosts, {"www.youtube.com"})
            finally:
                ctx.close()

    def test_unexpected_error_shows_fixed_message(self):
        """DD-0001 T-E4：通信の失敗（想定外）では、英語の元のメッセージではなく日本語の定型文を出す"""
        expected = ("解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。"
                    "何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。")

        def route_with_abort(route):
            u = route.request.url
            if "/watch?" in u and "hl=ja" in u:      # fetcher.js の視聴ページの取得だけを失敗させる
                return route.abort()
            return self.route(route)

        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                os.path.join(self.tmp, "profile-unexpected"), channel="chromium", headless=True,
                args=[f"--disable-extensions-except={EXT}", f"--load-extension={EXT}"],
                viewport={"width": 1400, "height": 1000})
            try:
                ctx.route("https://www.youtube.com/**", route_with_abort)
                pg = ctx.new_page()
                errors = []
                pg.on("pageerror", lambda e: errors.append(str(e)))
                pg.goto(f"https://www.youtube.com/watch?v={VID}")
                pg.wait_for_selector(".hlx-fab", timeout=20000)
                pg.click(".hlx-fab")
                pg.click(".hlx-primary")
                pg.wait_for_function("['done','error'].includes(document.querySelector('.hlx-panel').dataset.view)",
                                     timeout=60000)
                self.assertEqual(pg.eval_on_selector(".hlx-panel", "e => e.dataset.view"), "error")
                status = pg.inner_text(".hlx-status")
                self.assertEqual(status, expected)
                self.assertNotIn("Failed to fetch", status)
                self.assertEqual(errors, [])
            finally:
                ctx.close()


if __name__ == "__main__":
    unittest.main()
