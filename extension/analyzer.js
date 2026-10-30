// 盛り上がり検知：解析ロジック（content script と設定ページで共用）
'use strict';

const HLX_DEFAULTS = {
  binSec: 30,      // 集計の細かさ（秒）
  topN: 20,        // 候補の最大数
  leadSec: 30,     // 何秒前から再生するか
  minGapBins: 3,   // 候補同士の最小間隔（区間数）
  minSpeed: 1.5,   // 平常の何倍コメントが流れたら候補にするか
  keywords: [
    '笑い: 草|[wｗ]{2,}|^[wｗ]+$|笑|ワロ|lol|kusa',
    '驚き: [!！?？]{2,}|えっ|ええ|まじ|マジ|うそ|嘘|やば|ヤバ|ファッ',
    '称賛: 8{3,}|👏|うま|上手|天才|ナイス|nice|gg|すご|凄|神|うおお',
    'かわいい: かわい|可愛|kawaii|てぇてぇ|尊',
    '悲鳴: ぎゃ|ひえ|ヒエ|こわ|怖|ぁぁ|ああああ',
  ].join('\n'),
};

const HLX_WEIGHTS = { speed: 0.35, accel: 0.15, same: 0.15, keyword: 0.20, money: 0.05, heat: 0.10 };

function hlxParseKeywords(text) {
  const out = [];
  const errors = [];
  (text || '').split(/\r?\n/).forEach((line, i) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const m = line.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (!m) { errors.push(`${i + 1}行目：「名前: パターン」の形になっていません`); return; }
    try {
      out.push({ name: m[1].trim(), re: new RegExp(m[2], 'iu') });
    } catch (e) {
      errors.push(`${i + 1}行目：パターンの書き方に誤りがあります`);
    }
  });
  return { list: out, errors };
}

function hlxFmt(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function hlxNormalize(text) {
  let s = text.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
  s = s.replace(/(.)\1{3,}/gu, '$1$1$1');   // wwwww → www、88888 → 888
  return Array.from(s).slice(0, 30).join('');
}

function hlxMedian(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

function hlxRollingMedian(vals, half = 10) {
  return vals.map((_, i) => hlxMedian(vals.slice(Math.max(0, i - half), Math.min(vals.length, i + half + 1))));
}

function hlxPctRank(vals) {
  const s = [...vals].sort((a, b) => a - b);
  const n = s.length;
  if (n <= 1) return vals.map(() => 0);
  const lower = (v) => { let lo = 0, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (s[mid] < v) lo = mid + 1; else hi = mid; } return lo; };
  return vals.map(v => lower(v) / (n - 1));
}

function topEntries(map, k) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
}

function addCount(map, key, n = 1) { map.set(key, (map.get(key) || 0) + n); }

/**
 * items: [[秒, 種類(0=コメント,1=スパチャ,2=メンバー), 本文], ...]
 * info:  { duration, heatmap: [{start_time, end_time, value}] }
 */
function hlxAnalyze(items, info, settings) {
  const st = { ...HLX_DEFAULTS, ...(settings || {}) };
  const BIN = Number(st.binSec) || 60;
  const kws = hlxParseKeywords(st.keywords).list;

  let duration = info.duration || 0;
  if (!duration && items.length) duration = items[items.length - 1][0];
  const nb = Math.max(1, Math.ceil(duration / BIN));

  const count = new Array(nb).fill(0);
  const money = new Array(nb).fill(0);
  const kwTotal = new Array(nb).fill(0);
  const kw = Array.from({ length: nb }, () => new Map());
  const keys = Array.from({ length: nb }, () => new Map());

  for (const [t, type, text] of items) {
    if (!(t >= 0)) continue;
    const b = Math.min(nb - 1, Math.floor(t / BIN));
    if (type === 1 || type === 2) money[b]++;
    if (type === 2) continue;
    count[b]++;
    if (!text) continue;
    const k = hlxNormalize(text);
    if (k) addCount(keys[b], k);
    let hit = false;
    for (const { name, re } of kws) {
      if (re.test(text)) { addCount(kw[b], name); hit = true; }
    }
    if (hit) kwTotal[b]++;
  }

  const base = hlxRollingMedian(count).map(v => Math.max(1, v));
  const kwBase = hlxRollingMedian(kwTotal).map(v => Math.max(1, v));
  const speed = count.map((c, i) => c / base[i]);
  // 加速度：直前の区間からのコメントの増え方（平常時の量で割って配信ごとの差をならす）
  const accel = count.map((c, i) => i ? (c - count[i - 1]) / base[i] : 0);
  // 同じコメントの流れる確率：区間で一番多いコメントが全体に占める割合
  const topCnt = keys.map(m => { let top = 0; for (const v of m.values()) if (v > top) top = v; return top; });
  const same = topCnt.map((top, i) => count[i] >= 5 && top >= 3 ? top / count[i] : 0);
  const sameBase = hlxRollingMedian(same);
  const kwr = kwTotal.map((k, i) => k / kwBase[i]);

  const heat = new Array(nb).fill(0);
  const hm = info.heatmap || [];
  if (hm.length) {
    const starts = hm.map(h => h.start_time || 0);
    for (let i = 0; i < nb; i++) {
      const mid = (i + 0.5) * BIN;
      let lo = 0, hi = starts.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (starts[m] <= mid) lo = m + 1; else hi = m; }
      const j = lo - 1;
      if (j >= 0) heat[i] = Number(hm[j].value) || 0;
    }
  }

  let w = { ...HLX_WEIGHTS };
  if (!hm.length) {
    const extra = w.heat; delete w.heat;
    const rest = Object.values(w).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(w)) w[k] += extra * w[k] / rest;
    w.heat = 0;
  }

  const rSpeed = hlxPctRank(speed), rSame = hlxPctRank(same), rKw = hlxPctRank(kwr), rMoney = hlxPctRank(money);
  const rAccel = hlxPctRank(accel.map(a => Math.max(0, a)));
  const score = [];
  for (let i = 0; i < nb; i++) {
    let s = w.speed * rSpeed[i] + w.accel * rAccel[i] + w.same * rSame[i] + w.keyword * rKw[i]
      + w.money * (money[i] ? rMoney[i] : 0) + w.heat * heat[i];
    if (count[i] === 0) s *= 0.2;
    score.push(Math.round(s * 1000) / 10);
  }

  // ピーク選出
  const order = [...Array(nb).keys()].sort((a, b) => score[b] - score[a]);
  const picked = [];
  for (const i of order) {
    if (picked.length >= st.topN) break;
    const spiky = speed[i] >= st.minSpeed
      || (kwr[i] >= 3.0 && kwTotal[i] >= 10)
      || (same[i] >= Math.max(0.35, 1.8 * sameBase[i]) && topCnt[i] >= 8)
      || money[i] >= 3 || heat[i] >= 0.6;
    if (!spiky) continue;
    if (picked.every(p => Math.abs(i - p) > st.minGapBins)) picked.push(i);
  }

  const highlights = picked.map((i, idx) => {
    let l = i, r = i;
    while (l - 1 >= 0 && i - (l - 1) <= 2 && score[l - 1] >= score[i] * 0.85) l--;
    while (r + 1 < nb && (r + 1) - i <= 2 && score[r + 1] >= score[i] * 0.85) r++;
    const totKw = new Map(), totKeys = new Map();
    for (let b = l; b <= r; b++) {
      for (const [k, v] of kw[b]) addCount(totKw, k, v);
      for (const [k, v] of keys[b]) addCount(totKeys, k, v);
    }
    const reasons = [`コメント速度 平常の${speed[i].toFixed(1)}倍（${count[i]}件/${BIN}秒）`];
    if (accel[i] >= 1.0) reasons.push(`コメント急増（直前より+${i ? count[i] - count[i - 1] : count[i]}件）`);
    if (same[i] >= 0.35) reasons.push(`同じコメントが${Math.round(same[i] * 100)}%`);
    if (totKw.size) { const [name, n] = topEntries(totKw, 1)[0]; reasons.push(`${name}系ワード ${n}件`); }
    if (money[i]) reasons.push(`スパチャ・メンバー ${money[i]}件`);
    if (heat[i] >= 0.6) reasons.push('よく見返されている区間');
    return {
      rank: idx + 1,
      start: Math.max(0, l * BIN - st.leadSec),
      end: (r + 1) * BIN,
      peak: (i + 0.5) * BIN,
      score: score[i],
      reasons,
      top: topEntries(totKeys, 4).filter(([, n]) => n >= 3),
    };
  });

  return {
    bins: nb, binSec: BIN, leadSec: st.leadSec,
    count, accel: accel.map(a => Math.round(a * 1000) / 1000), same: same.map(v => Math.round(v * 1000) / 1000),
    score, heat, money, highlights,
    hasHeat: hm.length > 0,
    total: count.reduce((a, b) => a + b, 0),
    duration,
  };
}

if (typeof module !== 'undefined') module.exports = { hlxAnalyze, hlxFmt, hlxNormalize, hlxParseKeywords, HLX_DEFAULTS };
