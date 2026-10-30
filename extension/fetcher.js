// 盛り上がり検知：YouTubeアーカイブのチャットリプレイ取得
'use strict';

// HTML中の「name = {...}」のJSONを取り出す
function hlxExtractObject(text, startIdx) {
  if (startIdx < 0 || text[startIdx] !== '{') return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(startIdx, i + 1)); } catch (e) { return null; }
      }
    }
  }
  return null;
}

function hlxExtractVar(html, name) {
  const re = new RegExp(`${name}"?\\]?\\s*=\\s*\\{`);
  const m = re.exec(html);
  if (!m) return null;
  return hlxExtractObject(html, m.index + m[0].length - 1);
}

function hlxExtractAfter(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const j = html.indexOf('{', i + marker.length);
  return hlxExtractObject(html, j);
}

// 本文を作る（共通指標仕様書 2.4）
function hlxRunsToText(msg) {
  if (!msg) return '';
  if (msg.simpleText) return msg.simpleText;
  return (msg.runs || []).map(r => {
    if (r.text) return r.text;
    if (r.emoji) {
      const e = r.emoji;
      if (e.isCustomEmoji && e.shortcuts && e.shortcuts.length) return e.shortcuts[0];
      return e.emojiId || '';
    }
    return '';
  }).join('');
}

function hlxExtractHeatmap(data) {
  const muts = data?.frameworkUpdates?.entityBatchUpdate?.mutations || [];
  for (const m of muts) {
    const ml = m?.payload?.macroMarkersListEntity?.markersList;
    if (ml && ml.markerType === 'MARKER_TYPE_HEATMAP' && Array.isArray(ml.markers)) {
      return ml.markers.map(x => {
        const s = Number(x.startMillis) || 0, d = Number(x.durationMillis) || 0;
        return { start_time: s / 1000, end_time: (s + d) / 1000, value: Number(x.intensityScoreNormalized) || 0 };
      });
    }
  }
  return [];
}

const HLX_KIND = {
  liveChatTextMessageRenderer: 0,
  liveChatPaidMessageRenderer: 1,
  liveChatPaidStickerRenderer: 1,
  liveChatMembershipItemRenderer: 2,
  liveChatSponsorshipsGiftPurchaseAnnouncementRenderer: 2,
};

// 1ページ分のアクションを items に追加。最後のオフセット(ms)を返す（共通指標仕様書 2章）
function hlxCollect(actions, items, ids) {
  let last = -1;
  for (const a of actions || []) {
    const rep = a && a.replayChatItemAction;
    if (!rep) continue;
    const raw = rep.videoOffsetTimeMsec;
    if (raw === undefined || raw === null || raw === '') continue;   // 時刻の無いアクションは捨てる
    const ms = Number(raw);
    if (!(ms >= 0)) continue;                                        // 負・NaN を捨てる
    last = Math.max(last, ms);
    for (const act of rep.actions || []) {
      const item = act.addChatItemAction?.item;
      if (!item) continue;
      for (const [kind, r] of Object.entries(item)) {
        const type = HLX_KIND[kind];
        if (type === undefined) continue;
        if (r.id) { if (ids.has(r.id)) continue; ids.add(r.id); }
        const text = type === 2 ? '' : hlxRunsToText(r.message);   // 本文は切り詰めない
        items.push([ms / 1000, type, text]);                         // 時刻は丸めない
      }
    }
  }
  return last;
}

const hlxSleep = (ms) => new Promise(r => setTimeout(r, ms));

// 利用者向けのエラー（BD-0001 3.2）。目印 hlxUser を付け、content.js が ViewModel の hlxErrorStatus で想定外のエラーと区別する
const HLX_SPEC_CHANGE_TAIL = 'YouTube 側の仕様変更で読み取れなくなっている可能性があります。';
const HLX_SPEC_CHANGE_NOTE = '何度か試しても同じ場合は、' + HLX_SPEC_CHANGE_TAIL;
function hlxUserError(message) {
  const e = new Error(message);
  e.hlxUser = true;
  return e;
}

/**
 * vid のチャットリプレイを全件取得する
 * opts.onProgress({phase, ms, duration, count})
 * opts.isAlive() が false を返したら中断
 */
async function hlxFetchChat(vid, opts = {}) {
  const onProgress = opts.onProgress || (() => {});
  const isAlive = opts.isAlive || (() => true);
  const abort = () => { if (!isAlive()) throw new Error('__aborted__'); };

  // yt-dlp と同じく未ログイン扱いで取得（ログイン中の認証ヘッダー不足によるエラーを避ける）
  const CRED = 'omit';

  onProgress({ phase: 'page' });
  const res = await fetch(`${location.origin}/watch?v=${encodeURIComponent(vid)}&hl=ja`, { credentials: CRED });
  const html = await res.text();
  abort();
  const data = hlxExtractVar(html, 'ytInitialData');
  const player = hlxExtractVar(html, 'ytInitialPlayerResponse');
  if (!data) throw hlxUserError('ページ情報を読み取れませんでした。ページを再読み込みしてからもう一度お試しください。' + HLX_SPEC_CHANGE_NOTE);

  const vd = player?.videoDetails || {};
  if (vd.isLive) throw hlxUserError('配信中は解析できません。配信が終わってアーカイブになってから実行してください。');
  const info = {
    id: vid,
    title: vd.title || '',
    channel: vd.author || '',
    duration: Number(vd.lengthSeconds) || 0,
    heatmap: hlxExtractHeatmap(data),
  };

  const lcr = data?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer;
  if (!lcr) {
    const ps = player?.playabilityStatus?.status;
    if (ps && ps !== 'OK') throw hlxUserError('この動画は未ログインでは見られないため解析できません（メンバー限定・年齢制限など）。');
    throw hlxUserError('この動画にはチャットリプレイがありません（通常の動画、チャット無効、またはアーカイブ処理中）。通常の動画・チャット無効・処理中のどれでもないのに出る場合は、' + HLX_SPEC_CHANGE_TAIL);
  }
  let cont = lcr.continuations?.[0]?.reloadContinuationData?.continuation;
  if (!cont) throw hlxUserError('チャットリプレイの読み込み口が見つかりませんでした。' + HLX_SPEC_CHANGE_NOTE);

  const apiKey = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || [])[1];
  const clientVersion = (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) || [])[1] || '2.20261001.00.00';
  const context = hlxExtractAfter(html, '"INNERTUBE_CONTEXT":') ||
    { client: { clientName: 'WEB', clientVersion, hl: 'ja', gl: 'JP' } };
  const visitor = context?.client?.visitorData;

  const api = async (continuation, offsetMs, clickTracking) => {
    const url = `${location.origin}/youtubei/v1/live_chat/get_live_chat_replay?prettyPrint=false${apiKey ? '&key=' + apiKey : ''}`;
    const ctx = clickTracking ? { ...context, clickTracking: { clickTrackingParams: clickTracking } } : context;
    const headers = {
      'Content-Type': 'application/json',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': clientVersion,
    };
    if (visitor) headers['X-Goog-Visitor-Id'] = visitor;
    for (let attempt = 0; attempt < 5; attempt++) {
      abort();
      let r;
      try {
        r = await fetch(url, {
          method: 'POST',
          credentials: CRED,
          headers,
          body: JSON.stringify({
            context: ctx,
            continuation,
            currentPlayerState: { playerOffsetMs: String(Math.max(0, Math.floor(offsetMs) - 5000)) },
          }),
        });
      } catch (e) {
        await hlxSleep(1500 * (attempt + 1));
        continue;
      }
      if (r.ok) {
        const j = await r.json();
        return j?.continuationContents?.liveChatContinuation || null;
      }
      if (r.status === 429 || r.status >= 500) { await hlxSleep(2000 * (attempt + 1)); continue; }
      throw hlxUserError(`YouTubeからの取得に失敗しました（エラー ${r.status}）。` + HLX_SPEC_CHANGE_NOTE);
    }
    throw hlxUserError('YouTubeからの応答がありません。少し時間をおいて再試行してください。' + HLX_SPEC_CHANGE_NOTE);
  };

  const items = [];
  const ids = new Set();
  let lastMs = 0;

  // 1ページ目：チャット欄と同じく live_chat_replay のページから
  onProgress({ phase: 'chat', ms: 0, duration: info.duration, count: 0 });
  let lcc = null;
  try {
    const fr = await fetch(`${location.origin}/live_chat_replay?continuation=${encodeURIComponent(cont)}`, { credentials: CRED });
    lcc = hlxExtractVar(await fr.text(), 'ytInitialData')?.continuationContents?.liveChatContinuation || null;
  } catch (e) { /* 下でAPIにフォールバック */ }
  abort();

  // 既定は「上位のチャット」（絞り込み済み）なので、「チャットのリプレイ」（全件）に切り替えて最初から取り直す
  const all = lcc?.header?.liveChatHeaderRenderer?.viewSelector?.sortFilterSubMenuRenderer?.subMenuItems?.[1]?.continuation?.reloadContinuationData;
  if (all?.continuation) {
    lcc = await api(all.continuation, 0, all.trackingParams);
  } else if (!lcc) {
    lcc = await api(cont, 0);
  }

  let guard = 0;
  let stall = 0;
  while (lcc) {
    abort();
    const before = items.length;
    const last = hlxCollect(lcc.actions, items, ids);
    if (last > lastMs) lastMs = last;
    onProgress({ phase: 'chat', ms: lastMs, duration: info.duration, count: items.length });

    const nextData = lcc.continuations?.[0]?.liveChatReplayContinuationData;
    if (!nextData?.continuation) break;
    stall = items.length === before ? stall + 1 : 0;
    if (stall >= 5) break;               // 何度取っても新しいコメントが来ない＝終端
    if (++guard > 50000) break;
    lcc = await api(nextData.continuation, lastMs, nextData.clickTrackingParams);
  }

  items.sort((a, b) => a[0] - b[0]);
  if (!info.duration && items.length) info.duration = Math.ceil(items[items.length - 1][0]);
  return { info, items };
}
