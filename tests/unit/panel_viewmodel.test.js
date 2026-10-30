// パネルの ViewModel（extension/viewmodel/videoid.js の初回案内・エラー表示）のテスト  TS-0002
// fetcher.js と結合して読む場合と、videoid.js だけを読む場合の両方を扱う（_load.js は使わない）。
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const EXT = path.join(__dirname, '..', '..', 'extension');
const FETCHER = fs.readFileSync(path.join(EXT, 'fetcher.js'), 'utf8');
const VIDEOID = fs.readFileSync(path.join(EXT, 'viewmodel', 'videoid.js'), 'utf8');

const plain = (v) => JSON.parse(JSON.stringify(v));

// 結合あり：fetcher.js → videoid.js の順
function loadCombined() {
  const ctx = vm.createContext({});
  const src = [FETCHER, VIDEOID].join('\n;\n')
    + '\n;this.__vm = { hlxShouldShowNotice, hlxErrorStatus, HLX_NOTICE_KEY, HLX_NOTICE_VERSION,'
    + ' HLX_UNEXPECTED_ERROR_BASE, HLX_SPEC_CHANGE_NOTE, hlxUserError };';
  vm.runInContext(src, ctx, { filename: 'fetcher+videoid.js' });
  return ctx.__vm;
}
// 単独：videoid.js だけ
function loadAlone() {
  const ctx = vm.createContext({});
  vm.runInContext(VIDEOID + '\n;this.__vm = { hlxShouldShowNotice, hlxErrorStatus, HLX_UNEXPECTED_ERROR_BASE };',
    ctx, { filename: 'videoid.js' });
  return ctx.__vm;
}

const BASE = '解析中に予期しないエラーが起きました。ページを再読み込みしてから、もう一度お試しください。';
const NOTE = '何度か試しても同じ場合は、YouTube 側の仕様変更で読み取れなくなっている可能性があります。';

test('T-V1 hlxShouldShowNotice：境界値の全入力', () => {
  const { hlxShouldShowNotice: f } = loadAlone();
  const cases = [
    [undefined, true], [1, false], [2, false], [1.5, false], [0, true], [-1, true],
    ['1', true], [NaN, true], [Infinity, true], [null, true], [true, true],
    [{}, true], [[1], true],
  ];
  for (const [input, expected] of cases) {
    assert.equal(f(input), expected, 'input: ' + String(input));
  }
});

test('T-V2 キー名・版・既読の判定', () => {
  const m = loadCombined();
  assert.equal(m.HLX_NOTICE_KEY, 'hlxNoticeAck');
  assert.ok(!m.HLX_NOTICE_KEY.startsWith('chat_'));
  assert.ok(!m.HLX_NOTICE_KEY.startsWith('seen_'));
  assert.equal(m.HLX_NOTICE_VERSION, 1);
  assert.equal(m.hlxShouldShowNotice(m.HLX_NOTICE_VERSION), false);
});

test('T-V3 目印付きのエラーは message をそのまま返す（結合あり）', () => {
  const m = loadCombined();
  const msg = '配信中は解析できません。配信が終わってアーカイブになってから実行してください。';
  assert.deepEqual(plain(m.hlxErrorStatus(m.hlxUserError(msg))), { text: msg, unexpected: false });
  // Error でない普通のオブジェクトでも、目印と文だけで判定する
  assert.deepEqual(plain(m.hlxErrorStatus({ hlxUser: true, message: 'X' })), { text: 'X', unexpected: false });
  // 前後の空白は加工しない
  assert.equal(m.hlxErrorStatus({ hlxUser: true, message: ' X ' }).text, ' X ');
});

test('T-V4 目印なし・不正な目印・空の message は想定外の文（結合あり）', () => {
  const m = loadCombined();
  const expected = { text: BASE + NOTE, unexpected: true };
  assert.equal(m.HLX_UNEXPECTED_ERROR_BASE, BASE);
  assert.equal(m.HLX_SPEC_CHANGE_NOTE, NOTE);
  const inputs = [
    new Error('Cannot read properties of undefined'),
    new TypeError('Failed to fetch'),
    m.hlxUserError(''),
    { hlxUser: true, message: '   ' },
    { hlxUser: 'true', message: 'X' },
    { hlxUser: true, message: 123 },
    new Error('__aborted__'),
  ];
  for (const e of inputs) assert.deepEqual(plain(m.hlxErrorStatus(e)), expected);
});

test('T-V5 null・undefined・文字列・数値でも例外にならず想定外の文', () => {
  const m = loadCombined();
  for (const e of [null, undefined, '文字列', 42]) {
    let r;
    assert.doesNotThrow(() => { r = m.hlxErrorStatus(e); });
    assert.deepEqual(plain(r), { text: BASE + NOTE, unexpected: true });
  }
});

test('T-V6 想定外の文は BASE で始まり NOTE を含み、元の英語メッセージを含まない', () => {
  const m = loadCombined();
  const r = m.hlxErrorStatus(new Error('Cannot read properties'));
  assert.ok(r.text.startsWith(m.HLX_UNEXPECTED_ERROR_BASE));
  assert.ok(r.text.includes(m.HLX_SPEC_CHANGE_NOTE));
  assert.ok(!r.text.includes('Cannot read properties'));
});

test('T-V7 videoid.js だけを読み込んでも例外にならない（NOTE なしの安全策）', () => {
  let m;
  assert.doesNotThrow(() => { m = loadAlone(); });
  assert.deepEqual(plain(m.hlxErrorStatus(new Error('x'))), { text: m.HLX_UNEXPECTED_ERROR_BASE, unexpected: true });
  assert.deepEqual(plain(m.hlxErrorStatus({ hlxUser: true, message: 'm' })), { text: 'm', unexpected: false });
});

test('T-V8 戻り値のプロパティは text と unexpected の2つだけ', () => {
  const m = loadCombined();
  for (const e of [m.hlxUserError('a'), new Error('b'), null]) {
    assert.deepEqual(Object.keys(m.hlxErrorStatus(e)).sort(), ['text', 'unexpected']);
  }
});
