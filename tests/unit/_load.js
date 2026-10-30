// 拡張機能のスクリプト（ブラウザ向けの素のJS）をNode上で読み込むための補助
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const EXT = path.join(ROOT, 'extension');

/** analyzer.js と fetcher.js を1つの環境に読み込み、主要な関数を返す */
function loadExtension(globals = {}) {
  const ctx = vm.createContext({ console, setTimeout, clearTimeout, ...globals });
  const code = ['analyzer.js', 'fetcher.js']
    .map(f => fs.readFileSync(path.join(EXT, f), 'utf8'))
    .join('\n;\n');
  vm.runInContext(code + `
;this.__ext = { hlxAnalyze, hlxFmt, hlxNormalize, hlxParseKeywords, HLX_DEFAULTS,
  hlxCollect, hlxFetchChat, hlxExtractVar, hlxExtractHeatmap, hlxRunsToText };`, ctx, { filename: 'extension' });
  return ctx.__ext;
}

/** vm 内で作られた配列・オブジェクトを、比較できる普通の値に直す */
const plain = (v) => JSON.parse(JSON.stringify(v));

module.exports = { ROOT, EXT, loadExtension, plain };
