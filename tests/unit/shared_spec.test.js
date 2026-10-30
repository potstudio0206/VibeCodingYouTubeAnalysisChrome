// 共通指標仕様書（shared/metrics-spec.md）への適合テスト
// 基準データ shared/golden/*.json と in Chrome版の実装が一致することを確かめる。
// 実行: node --test tests/unit
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, loadExtension, plain } = require('./_load');

const GOLDEN = path.join(ROOT, 'shared', 'golden');
const TOL = 0.0011;
const TYPE_NUM = { text: 0, money: 1, member: 2 };
const TYPE_NAME = ['text', 'money', 'member'];
const load = (name) => JSON.parse(fs.readFileSync(path.join(GOLDEN, name), 'utf8'));

const parse = load('parse_cases.json');
const metrics = load('metrics_cases.json');
const ext = loadExtension();

test('基準データの版が VERSION と一致する', () => {
  const version = fs.readFileSync(path.join(ROOT, 'shared', 'VERSION'), 'utf8').trim();
  assert.equal(parse.spec_version, version);
  assert.equal(metrics.spec_version, version);
});

for (const c of parse.cases) {
  test(`読み取り: ${c.name}`, () => {
    const items = [];
    ext.hlxCollect(c.actions, items, new Set());
    items.sort((a, b) => a[0] - b[0]);
    const got = plain(items).map(([t, type, text]) => [t, TYPE_NAME[type], text]);
    assert.deepEqual(got, c.expected);
  });
}

for (const c of metrics.cases) {
  test(`計算: ${c.name}`, () => {
    const items = c.items.map(([t, type, text]) => [t, TYPE_NUM[type], text]);
    const r = ext.hlxAnalyze(items, { duration: c.duration, heatmap: [] }, { binSec: c.bin_sec });
    const e = c.expected;
    assert.equal(r.bins, e.bins);
    assert.deepEqual(plain(r.count), e.count);
    assert.equal(r.accel.length, e.accel.length);
    assert.equal(r.same.length, e.same_rate.length);
    r.accel.forEach((v, i) => assert.ok(Math.abs(v - e.accel[i]) <= TOL, `accel[${i}] ${v} != ${e.accel[i]}`));
    r.same.forEach((v, i) => assert.ok(Math.abs(v - e.same_rate[i]) <= TOL, `same_rate[${i}] ${v} != ${e.same_rate[i]}`));
  });
}
