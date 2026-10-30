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

function mockYouTube({ duration = 300, isLive = false, withChat = true, playable = 'OK', noData = false, noCont = false, apiStatus = null, apiThrow = false } = {}) {
  const calls = [];
  const watch = {
    contents: { twoColumnWatchNextResults: withChat ? { conversationBar: { liveChatRenderer: noCont ? {} : { continuations: [{ reloadContinuationData: { continuation: 'TOP' } }] } } } : {} },
    frameworkUpdates: { entityBatchUpdate: { mutations: [{ payload: { macroMarkersListEntity: { markersList: {
      markerType: 'MARKER_TYPE_HEATMAP',
      markers: [{ startMillis: '0', durationMillis: '60000', intensityScoreNormalized: 0.5 }],
    } } } }] } },
  };
  const player = { videoDetails: { title: 'テスト配信', author: 'テスト', lengthSeconds: String(duration), isLive }, playabilityStatus: { status: playable } };
  // 文字列中の } { や " を含むメタ情報を混ぜ、JSON切り出しの頑健さも確かめる
  const watchHtml = `<script>var ytInitialPlayerResponse = ${JSON.stringify(player)};var meta={"a":"}{\\""};</script>`
    + (noData ? '' : `<script>var ytInitialData = ${JSON.stringify(watch)};</script>`)
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
    if (apiThrow) throw new TypeError('Failed to fetch');
    if (apiStatus) return { ok: false, status: apiStatus, json: async () => ({}) };
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

// ---------- DD-0001 2章：利用者向けエラー（目印 hlxUser と追記文） ----------
const HEAD_NOTE = '何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。';
const TAIL = 'YouTube 側の仕様変更で読み取れなくなっている可能性があります。';
const instant = (m) => ({ ...m.globals, setTimeout: (f) => f() });   // 再試行の待ちを無くす
async function rejection(opt, useInstant = false) {
  const m = mockYouTube(opt);
  const ext = loadExtension(useInstant ? instant(m) : m.globals);
  let err = null;
  try { await ext.hlxFetchChat('abcdefghijk'); } catch (e) { err = e; }
  assert.ok(err, 'reject されること');
  return { err, ext, m };
}
const apiCalls = (m) => m.calls.filter(c => c.path.startsWith('/youtubei/v1/live_chat/get_live_chat_replay'));

test('T-M1 ページ情報が読めないとき、再読み込みの案内に仕様変更の追記が付く', async () => {
  const { err, ext } = await rejection({ noData: true });
  assert.ok(err.message.startsWith('ページ情報を読み取れませんでした'));
  assert.ok(err.message.endsWith(ext.HLX_SPEC_CHANGE_NOTE));
  assert.equal(err.message, 'ページ情報を読み取れませんでした。ページを再読み込みしてからもう一度お試しください。' + HEAD_NOTE);
  assert.equal(err.hlxUser, true);
});

test('T-M2 チャットリプレイが無いとき、既存の文のあとに仕様変更の可能性が付く', async () => {
  const { err, ext } = await rejection({ withChat: false });
  assert.match(err.message, /チャットリプレイがありません/);
  assert.ok(err.message.endsWith('通常の動画・チャット無効・処理中のどれでもないのに出る場合は、' + ext.HLX_SPEC_CHANGE_TAIL));
  assert.equal(err.message, 'この動画にはチャットリプレイがありません（通常の動画、チャット無効、またはアーカイブ処理中）。通常の動画・チャット無効・処理中のどれでもないのに出る場合は、' + TAIL);
  assert.equal(err.hlxUser, true);
});

test('T-M3 読み込み口が無いとき、完全一致の文になる', async () => {
  const { err, ext } = await rejection({ noCont: true });
  assert.equal(err.message, 'チャットリプレイの読み込み口が見つかりませんでした。' + ext.HLX_SPEC_CHANGE_NOTE);
  assert.equal(err.message, 'チャットリプレイの読み込み口が見つかりませんでした。' + HEAD_NOTE);
  assert.equal(err.hlxUser, true);
});

test('T-M4 取得APIが403のとき、エラー番号と追記が付く（再試行しない）', async () => {
  const { err, ext, m } = await rejection({ apiStatus: 403 });
  assert.equal(err.message, 'YouTubeからの取得に失敗しました（エラー 403）。' + ext.HLX_SPEC_CHANGE_NOTE);
  assert.equal(err.message, 'YouTubeからの取得に失敗しました（エラー 403）。' + HEAD_NOTE);
  assert.equal(err.hlxUser, true);
  assert.equal(apiCalls(m).length, 1);
});

test('T-M5 配信中の文は現行と完全に同じで、仕様変更を含まない', async () => {
  const { err } = await rejection({ isLive: true });
  assert.equal(err.message, '配信中は解析できません。配信が終わってアーカイブになってから実行してください。');
  assert.ok(!err.message.includes('仕様変更'));
  assert.equal(err.hlxUser, true);
});

test('T-M6 未ログインの文は現行と完全に同じで、仕様変更を含まない', async () => {
  const { err } = await rejection({ withChat: false, playable: 'LOGIN_REQUIRED' });
  assert.equal(err.message, 'この動画は未ログインでは見られないため解析できません（メンバー限定・年齢制限など）。');
  assert.ok(!err.message.includes('仕様変更'));
  assert.equal(err.hlxUser, true);
});

test('T-M7 応答が5回なかったとき（通信の例外・503）、応答なしの文になる', async () => {
  for (const opt of [{ apiThrow: true }, { apiStatus: 503 }]) {
    const { err, ext, m } = await rejection(opt, true);
    assert.equal(err.message, 'YouTubeからの応答がありません。少し時間をおいて再試行してください。' + ext.HLX_SPEC_CHANGE_NOTE);
    assert.equal(err.message, 'YouTubeからの応答がありません。少し時間をおいて再試行してください。' + HEAD_NOTE);
    assert.equal(err.hlxUser, true);
    assert.equal(apiCalls(m).length, 5);
  }
});

test('T-M8 7か所すべてで、reject の例外に目印 hlxUser === true が付く', async () => {
  const cases = [
    [{ noData: true }, false], [{ withChat: false }, false], [{ noCont: true }, false],
    [{ apiStatus: 403 }, false], [{ isLive: true }, false],
    [{ withChat: false, playable: 'LOGIN_REQUIRED' }, false],
    [{ apiThrow: true }, true], [{ apiStatus: 503 }, true],
  ];
  for (const [opt, inst] of cases) {
    const { err } = await rejection(opt, inst);
    assert.strictEqual(err.hlxUser, true, JSON.stringify(opt));
  }
});

test('T-M8b 中断（__aborted__）と通信の失敗には目印を付けない', async () => {
  const m = mockYouTube();
  const ext = loadExtension(m.globals);
  await assert.rejects(ext.hlxFetchChat('abcdefghijk', { isAlive: () => false }), (e) => e.message === '__aborted__' && e.hlxUser === undefined);
  const ext2 = loadExtension({ fetch: async () => { throw new TypeError('Failed to fetch'); }, location: { origin: ORIGIN } });
  await assert.rejects(ext2.hlxFetchChat('abcdefghijk'), (e) => e.hlxUser === undefined);
});

test('T-M9 hlxUserError は目印付きの Error を返し、定数は DD の値になる', () => {
  const ext = loadExtension(mockYouTube().globals);
  const e = ext.hlxUserError('x');
  assert.equal(e.message, 'x');
  assert.strictEqual(e.hlxUser, true);
  // vm 内で作られた Error なので、テスト側の Error では instanceof が偽になる（DD 2.1 の理由）。名前と継承で確かめる
  assert.equal(e.name, 'Error');
  assert.ok(e instanceof e.constructor && typeof e.stack === 'string');
  assert.equal(e instanceof Error, false);
  assert.equal(ext.HLX_SPEC_CHANGE_TAIL, TAIL);
  assert.equal(ext.HLX_SPEC_CHANGE_NOTE, '何度か試しても同じ場合は、' + ext.HLX_SPEC_CHANGE_TAIL);
  assert.equal(ext.HLX_SPEC_CHANGE_NOTE, HEAD_NOTE);
  assert.equal(ext.hlxUserError('').message, '');
  assert.strictEqual(ext.hlxUserError('').hlxUser, true);
});
