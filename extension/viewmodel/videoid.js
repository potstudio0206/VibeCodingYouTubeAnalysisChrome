// 動画IDの取り出し（ViewModel）：URLの pathname と search から動画IDを求める純粋関数。
// DOM・location には触らない。対象は /watch?v=ID と /live/ID のみ。
// パネルの ViewModel の関数（初回案内の判断、エラー表示の選択）もここに置く（BD-0001 D-1。manifest の content_scripts を変えられないため）。
'use strict';

function hlxVideoIdFromUrl(pathname, search) {
  const ID_RE = /^[A-Za-z0-9_-]+$/;
  const path = String(pathname || '');
  if (path === '/watch') {
    const m = /(?:^|[?&])v=([^&#]*)/.exec(String(search || ''));
    return m && ID_RE.test(m[1]) ? m[1] : null;
  }
  const live = /^\/live\/([^/]+)\/?$/.exec(path);
  return live && ID_RE.test(live[1]) ? live[1] : null;
}

// ---------- 初回案内（BD-0001 3.1） ----------
const HLX_NOTICE_KEY = 'hlxNoticeAck';
const HLX_NOTICE_VERSION = 1;

/** 保存された既読の値から、初回案内を出すかを返す。数値の型で HLX_NOTICE_VERSION 以上のときだけ「出さない」 */
function hlxShouldShowNotice(stored) {
  return !(typeof stored === 'number' && Number.isFinite(stored) && stored >= HLX_NOTICE_VERSION);
}

// ---------- エラー表示（BD-0001 3.2） ----------
const HLX_UNEXPECTED_ERROR_BASE = '解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。';

/**
 * 解析で起きた例外から、状態表示に出す文を選ぶ。
 * fetcher.js の定数は関数の中でだけ参照する（このファイルだけを読み込んでも例外にしないため。BD-0001 N-2）
 */
function hlxErrorStatus(e) {
  if (e !== null && typeof e === 'object' && e.hlxUser === true
      && typeof e.message === 'string' && e.message.trim() !== '') {
    return { text: e.message, unexpected: false };
  }
  const note = typeof HLX_SPEC_CHANGE_NOTE === 'string' ? HLX_SPEC_CHANGE_NOTE : '';
  return { text: HLX_UNEXPECTED_ERROR_BASE + note, unexpected: true };
}
