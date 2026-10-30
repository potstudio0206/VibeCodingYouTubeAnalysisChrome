'use strict';
const $ = (id) => document.getElementById(id);
const FIELDS = ['minSpeed', 'binSec', 'topN', 'leadSec', 'keywords'];

function fill(s) {
  $('minSpeed').value = String(s.minSpeed);
  if (!$('minSpeed').value) $('minSpeed').value = '1.5';
  $('binSec').value = String(s.binSec);
  $('topN').value = s.topN;
  $('leadSec').value = s.leadSec;
  $('keywords').value = s.keywords;
  $('errors').textContent = '';
}

function flash(t) {
  $('msg').textContent = t;
  clearTimeout(flash.t);
  flash.t = setTimeout(() => { $('msg').textContent = ''; }, 2000);
}

async function load() {
  const o = await chrome.storage.sync.get('hlxSettings');
  fill({ ...HLX_DEFAULTS, ...((o && o.hlxSettings) || {}) });
  refreshCache();
}

async function save() {
  const kw = $('keywords').value;
  const { errors } = hlxParseKeywords(kw);
  if (errors.length) { $('errors').textContent = errors.join('\n'); return; }
  $('errors').textContent = '';
  const s = {
    minSpeed: Number($('minSpeed').value) || HLX_DEFAULTS.minSpeed,
    binSec: Number($('binSec').value) || HLX_DEFAULTS.binSec,
    topN: Math.min(100, Math.max(5, Math.round(Number($('topN').value) || HLX_DEFAULTS.topN))),
    leadSec: Math.min(300, Math.max(0, Math.round(Number($('leadSec').value) || 0))),
    keywords: kw,
  };
  await chrome.storage.sync.set({ hlxSettings: s });
  fill(s);
  flash('保存しました。開いているYouTubeのパネルにもすぐ反映されます。');
}

async function reset() {
  await chrome.storage.sync.remove('hlxSettings');
  fill({ ...HLX_DEFAULTS });
  flash('初期設定に戻しました。');
}

async function refreshCache() {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter(k => k.startsWith('chat_'));
  const bytes = await chrome.storage.local.getBytesInUse(null);
  $('cacheInfo').textContent = `${keys.length}本の配信（約${(bytes / 1024 / 1024).toFixed(1)}MB）`;
}

async function clearCache() {
  if (!confirm('保存したチャットをすべて削除しますか？（次回の解析時に取り直します）')) return;
  const all = await chrome.storage.local.get(null);
  await chrome.storage.local.remove(Object.keys(all).filter(k => k.startsWith('chat_') || k.startsWith('seen_')));
  refreshCache();
  flash('削除しました。');
}

$('save').addEventListener('click', save);
$('reset').addEventListener('click', reset);
$('clear').addEventListener('click', clearCache);
load();
