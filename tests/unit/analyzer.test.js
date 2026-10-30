// 見どころ選び（analyzer.js）の単体テスト。合成した5時間分のチャットで確かめる。
// 実行: node --test "tests/unit/*.test.js"
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension } = require('./_load');

const ext = loadExtension();

/** 平常時は3秒に1件、指定した時刻に同じコメントが150件流れる5時間の配信 */
function syntheticStream() {
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const normal = ['こんばんは', 'おつ', 'それな', 'わかる', 'なるほど', 'かわいい', 'がんばれ'];
  const items = [];
  for (let t = 0; t < 18000; t += 3) items.push([t + rnd(), 0, normal[Math.floor(rnd() * normal.length)]]);
  const events = [[3600, '草'], [7200, '888'], [12000, '!?!?'], [15000, 'wwwww']];
  for (const [et, w] of events) for (let i = 0; i < 150; i++) items.push([et + rnd() * 90, 0, w]);
  for (let i = 0; i < 10; i++) items.push([9000 + rnd() * 60, 1, 'おめでとう']);
  items.sort((a, b) => a[0] - b[0]);
  const heatmap = Array.from({ length: 100 }, (_, i) => ({ start_time: i * 180, end_time: (i + 1) * 180, value: i === 40 ? 1 : 0.2 }));
  return { items, info: { duration: 18000, heatmap } };
}

test('仕込んだ盛り上がりだけを見どころとして選ぶ', () => {
  const { items, info } = syntheticStream();
  const r = ext.hlxAnalyze(items, info, {});
  const peaks = r.highlights.map(h => h.peak).sort((a, b) => a - b);
  for (const t of [3600, 7200, 9000, 12000, 15000]) {
    assert.ok(peaks.some(p => Math.abs(p - t) <= 120), `${t}秒付近の盛り上がりが選ばれていない`);
  }
  // 平常時のゆらぎを拾いすぎない
  assert.ok(r.highlights.length <= 8, `候補が多すぎる: ${r.highlights.length}`);
});

test('理由に「コメント急増」「同じコメント」が入り、再生開始は少し前になる', () => {
  const { items, info } = syntheticStream();
  const r = ext.hlxAnalyze(items, info, {});
  const h = r.highlights.find(x => Math.abs(x.peak - 12000) <= 120);
  assert.ok(h);
  assert.ok(h.reasons.some(s => s.startsWith('同じコメントが')));
  assert.ok(h.start <= h.peak - 30);
});

test('設定の感度で候補数が変わる', () => {
  const { items, info } = syntheticStream();
  const few = ext.hlxAnalyze(items, info, { minSpeed: 2 }).highlights.length;
  const many = ext.hlxAnalyze(items, info, { minSpeed: 1.3 }).highlights.length;
  assert.ok(many >= few);
});

test('検知ワードの書き方の誤りを行番号つきで返す', () => {
  const { list, errors } = ext.hlxParseKeywords('笑い: 草|w{2,}\nこれは不正な行\n驚き: (');
  assert.equal(list.length, 1);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /^2行目/);
});
