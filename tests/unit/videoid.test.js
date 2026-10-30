// 動画IDの取り出し（extension/viewmodel/videoid.js）のテスト  TS-0001
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.join(__dirname, '..', '..', 'extension', 'viewmodel', 'videoid.js');

function load() {
  const ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(FILE, 'utf8') + '\n;this.__f = hlxVideoIdFromUrl;', ctx, { filename: 'videoid.js' });
  return ctx.__f;
}

const ID = 'fPnkoOtQIyE';

test('/watch?v=ID は ID を返す', () => {
  const f = load();
  assert.equal(f('/watch', '?v=' + ID), ID);
  assert.equal(f('/watch', '?list=PL1&v=' + ID + '&t=30s'), ID);
});

test('/live/ID は ID を返す', () => {
  assert.equal(load()('/live/' + ID, ''), ID);
});

test('/live/ID?feature=share は ID を返す', () => {
  assert.equal(load()('/live/' + ID, '?feature=share'), ID);
});

test('/live/ID/ （末尾スラッシュ）は ID を返す', () => {
  assert.equal(load()('/live/' + ID + '/', ''), ID);
});

test('/watch で v がなければ null', () => {
  const f = load();
  assert.equal(f('/watch', ''), null);
  assert.equal(f('/watch', '?list=PL1'), null);
  assert.equal(f('/watch', '?v='), null);
});

test('トップ / は null', () => {
  assert.equal(load()('/', ''), null);
});

test('/shorts/ID や /results は対象外で null', () => {
  const f = load();
  assert.equal(f('/shorts/' + ID, ''), null);
  assert.equal(f('/results', '?search_query=abc'), null);
});

test('ID に [A-Za-z0-9_-] 以外を含むなら null', () => {
  const f = load();
  assert.equal(f('/live/ab$cd', ''), null);
  assert.equal(f('/live/ab%20cd', ''), null);
  assert.equal(f('/live/ab.cd', ''), null);
  assert.equal(f('/watch', '?v=ab$cd'), null);
  assert.equal(f('/live/' + ID + '/extra', ''), null);
});

test('/live/ だけ（IDなし）は null', () => {
  const f = load();
  assert.equal(f('/live/', ''), null);
  assert.equal(f('/live', ''), null);
});

test('ID に使える記号 _ と - は通す', () => {
  assert.equal(load()('/live/a_b-c', ''), 'a_b-c');
});
