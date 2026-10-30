// 動画IDの取り出し（ViewModel）：URLの pathname と search から動画IDを求める純粋関数。
// DOM・location には触らない。対象は /watch?v=ID と /live/ID のみ。
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
