// チャット取得（fetcher.js）の流れの単体テスト。YouTubeの応答を模擬して確かめる。
// 実行: node --test "tests/unit/*.test.js"
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension, plain } = require('./_load');

const ORIGIN = 'https://www.youtube.com';
const act = (ms, id, text) => ({
  replayChatItemAction: {
    actions: [{ addChatItemAction: { item: { liveChatTextMessageRenderer: { id, message: { runs: [{ text }] } } } } }],
    videoOffsetTimeMsec: String(ms),
  },
});

function mockYouTube({ duration = 300, isLive = false, withChat = true, playable = 'OK' } = {}) {
  const calls = [];
  const watch = {
    contents: { twoColumnWatchNextResults: withChat ? { conversationBar: { liveChatRenderer: { continuations: [{ reloadContinuationData: { continuation: 'TOP' } }] } } } : {} },
    frameworkUpdates: { entityBatchUpdate: { mutations: [{ payload: { macroMarkersListEntity: { markersList: {
      markerType: 'MARKER_TYPE_HEATMAP',
      markers: [{ startMillis: '0', durationMillis: '60000', intensityScoreNormalized: 0.5 }],
    } } } }] } },
  };
  const player = { videoDetails: { title: 'テスト配信', author: 'テスト', lengthSeconds: String(duration), isLive }, playabilityStatus: { status: playable } };
  // 文字列中の } { や " を含むメタ情報を混ぜ、JSON切り出しの頑健さも確かめる
  const watchHtml = `<script>var ytInitialPlayerResponse = ${JSON.stringify(player)};var meta={"a":"}{\\""};</script>`
    + `<script>var ytInitialData = ${JSON.stringify(watch)};</script>`
    + `<script>ytcfg.set({"INNERTUBE_API_KEY":"KEY","INNERTUBE_CLIENT_VERSION":"2.1","INNERTUBE_CONTEXT":{"client":{"clientName":"WEB","visitorData":"VIS"}}});</script>`;
  const firstPage = { continuationContents: { liveChatContinuation: {
    header: { liveChatHeaderRenderer: { viewSelector: { sortFilterSubMenuRenderer: { subMenuItems: [{}, { continuation: { reloadContinuationData: { continuation: 'ALL0', trackingParams: 'TP' } } }] } } } },
    actions: [act(1000, 'top1', '上位チャットだけのコメント')],
    continuations: [{ liveChatReplayContinuationData: { continuation: 'TOPNEXT' } }],
  } } };
  const pages = {
    ALL0: [[act(1000, 'a1', 'x'), act(2000, 'a2', 'y')], 'ALL1'],
    ALL1: [[act(2000, 'a2', 'y'), act(60000, 'a3', 'z')], 'ALL2'],   // a2 は重複
    ALL2: [[act(299000, 'a4', 'w')], null],
  };
  const fetch = async (url, opt = {}) => {
    calls.push({ path: url.replace(ORIGIN, ''), credentials: opt.credentials, body: opt.body ? JSON.parse(opt.body) : null, headers: opt.headers || {} });
    if (url.includes('/watch?')) return { text: async () => watchHtml };
    if (url.includes('/live_chat_replay?')) return { text: async () => `<script>window["ytInitialData"] = ${JSON.stringify(firstPage)};</script>` };
    const b = JSON.parse(opt.body);
    const [actions, next] = pages[b.continuation];
    return {
      ok: true, status: 200,
      json: async () => ({ continuationContents: { liveChatContinuation: {
        actions,
        continuations: next ? [{ liveChatReplayContinuationData: { continuation: next, clickTrackingParams: 'CT' + next } }] : [],
      } } }),
    };
  };
  return { calls, globals: { fetch, location: { origin: ORIGIN } } };
}

test('「チャットのリプレイ（全件）」に切り替えて最後まで取得し、重複を除く', async () => {
  const m = mockYouTube();
  const ext = loadExtension(m.globals);
  const r = await ext.hlxFetchChat('abcdefghijk');
  assert.deepEqual(plain(r.items).map(x => [x[0], x[2]]), [[1, 'x'], [2, 'y'], [60, 'z'], [299, 'w']]);
  assert.equal(r.info.title, 'テスト配信');
  assert.equal(r.info.duration, 300);
  assert.deepEqual(plain(r.info.heatmap), [{ start_time: 0, end_time: 60, value: 0.5 }]);
});

test('未ログイン扱いで取得し、yt-dlp と同じ要求を送る', async () => {
  const m = mockYouTube();
  const ext = loadExtension(m.globals);
  await ext.hlxFetchChat('abcdefghijk');
  assert.ok(m.calls.every(c => c.credentials === 'omit'), 'credentials は omit');
  const api = m.calls.filter(c => c.path.startsWith('/youtubei/v1/live_chat/get_live_chat_replay'));
  assert.deepEqual(api.map(c => c.body.continuation), ['ALL0', 'ALL1', 'ALL2']);
  assert.equal(api[0].body.context.clickTracking.clickTrackingParams, 'TP');
  assert.equal(api[1].body.context.clickTracking.clickTrackingParams, 'CTALL1');
  // 2ページ目以降は「最後に取れた時刻 − 5秒」から
  assert.deepEqual(api.map(c => c.body.currentPlayerState.playerOffsetMs), ['0', '0', '55000']);
  assert.ok(api.every(c => c.headers['X-Goog-Visitor-Id'] === 'VIS'));
});

test('配信中・チャットなし・視聴制限は分かりやすいエラーにする', async () => {
  for (const [opt, pattern] of [
    [{ isLive: true }, /配信中/],
    [{ withChat: false }, /チャットリプレイがありません/],
    [{ withChat: false, playable: 'LOGIN_REQUIRED' }, /未ログインでは見られない/],
  ]) {
    const ext = loadExtension(mockYouTube(opt).globals);
    await assert.rejects(ext.hlxFetchChat('abcdefghijk'), pattern);
  }
});
