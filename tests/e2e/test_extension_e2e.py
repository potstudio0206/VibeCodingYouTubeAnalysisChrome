# -*- coding: utf-8 -*-
"""in Chrome版のE2Eテスト。

本物のChromium（Playwright）に拡張機能を読み込み、YouTubeを模擬したページで次を確かめる。
- パネルを開いて解析が完了し、見どころ候補とシークバーの印が出る
- グラフのクリックで動画がその場面（少し前）へジャンプする
- 再生位置の縦線と、シークバーで指している位置の点線がグラフに出る

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
  const heat = document.querySelector('.hlx-chip-btn.hlx-on')?.textContent === 'ヒートマップ';
  const rh = heat ? 18 : 38, MARK_H = 9, GAP = 3;
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


if __name__ == "__main__":
    unittest.main()
