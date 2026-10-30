// 盛り上がり検知：YouTubeページ上のパネル
(() => {
  'use strict';
  if (window.__hlxLoaded) return;
  window.__hlxLoaded = true;

  const S = {
    vid: null, info: null, items: null, res: null,
    sort: 'score', seen: new Set(), runId: 0, running: false,
    mode: 'heat', range: 'all', wide: false, seekHover: null,
  };

  // ---------- 小物 ----------
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const safe = (fn) => { try { return fn(); } catch (e) { return undefined; } };
  const store = {
    async get(k) { try { return (await chrome.storage.local.get(k))[k]; } catch (e) { return undefined; } },
    async set(k, v) { try { await chrome.storage.local.set({ [k]: v }); } catch (e) { /* 拡張の再読込時など */ } },
  };
  async function loadSettings() {
    try {
      const o = await chrome.storage.sync.get('hlxSettings');
      return { ...HLX_DEFAULTS, ...((o && o.hlxSettings) || {}) };
    } catch (e) { return { ...HLX_DEFAULTS }; }
  }
  const currentVid = () => hlxVideoIdFromUrl(location.pathname, location.search);
  const video = () => document.querySelector('#movie_player video') || document.querySelector('video');

  function seek(t) {
    const v = video();
    if (!v) return;
    v.currentTime = Math.max(0, t);
    if (v.paused) v.play().catch(() => {});
  }

  // ---------- UI ----------
  let fab, panel, statusEl, progWrap, progBar, progText, startBtn, cancelBtn, chartWrap, canvas, tipEl, toolbar, listEl, toast;
  let sortScoreBtn, sortTimeBtn;

  function buildUI() {
    fab = el('button', 'hlx-fab');
    fab.append(el('span', 'hlx-fab-icon', '▲'), el('span', null, '見どころ'));
    fab.title = '盛り上がり検知';
    fab.addEventListener('click', togglePanel);

    panel = el('div', 'hlx-panel');
    const head = el('div', 'hlx-head');
    head.append(el('div', 'hlx-title', '盛り上がり検知 in Chrome'));
    const gear = el('button', 'hlx-icon', '⚙');
    gear.title = '設定';
    gear.addEventListener('click', () => safe(() => chrome.runtime.sendMessage({ type: 'hlx-open-options' })));
    const close = el('button', 'hlx-icon', '×');
    close.title = '閉じる';
    close.addEventListener('click', () => panel.classList.remove('hlx-open'));
    head.append(gear, close);

    statusEl = el('div', 'hlx-status');

    progWrap = el('div', 'hlx-prog');
    const track = el('div', 'hlx-prog-track');
    progBar = el('div', 'hlx-prog-bar');
    track.append(progBar);
    progText = el('div', 'hlx-prog-text');
    progWrap.append(track, progText);

    startBtn = el('button', 'hlx-btn hlx-primary', 'このアーカイブを解析');
    startBtn.addEventListener('click', () => start(false));
    cancelBtn = el('button', 'hlx-btn', '中止');
    cancelBtn.addEventListener('click', cancel);

    chartWrap = el('div', 'hlx-chart-wrap');
    const ctl = el('div', 'hlx-tl-ctl');
    const bHeat = el('button', 'hlx-chip-btn hlx-on', 'ヒートマップ');
    const bLine = el('button', 'hlx-chip-btn', '折れ線');
    const setMode = (m) => { S.mode = m; bHeat.classList.toggle('hlx-on', m === 'heat'); bLine.classList.toggle('hlx-on', m === 'line'); drawChart(); };
    bHeat.addEventListener('click', () => setMode('heat'));
    bLine.addEventListener('click', () => setMode('line'));
    const sel = el('select', 'hlx-select');
    for (const [v, label] of [['all', '全体'], ['near', '再生位置の前後15分'], ['first', '前半'], ['second', '後半']]) {
      const o = el('option', null, label); o.value = v; sel.append(o);
    }
    sel.addEventListener('change', () => { S.range = sel.value; drawChart(); });
    const bWide = el('button', 'hlx-icon hlx-small', '⇔');
    bWide.title = 'パネルの幅を広げる／戻す';
    bWide.addEventListener('click', () => {
      S.wide = !S.wide; panel.classList.toggle('hlx-wide', S.wide);
      setTimeout(drawChart, 220);
    });
    ctl.append(bHeat, bLine, el('span', 'hlx-spacer'), sel, bWide);
    canvas = el('canvas', 'hlx-chart');
    tipEl = el('div', 'hlx-tip');
    const legend = el('div', 'hlx-legend');
    const grad = el('span', 'hlx-grad');
    grad.style.background = `linear-gradient(90deg, ${[0, .45, .75, .92, 1].map(cmap).join(',')})`;
    legend.append('低', grad, '高　', el('span', 'hlx-legend-mark', '▼'), '見どころ候補');
    chartWrap.append(ctl, canvas, tipEl, legend,
      el('div', 'hlx-hint', 'クリックでその場面へジャンプ（コメントの遅れを見込んで少し前から再生）。赤い線＝再生位置、点線＝シークバーで指している位置。色は明るいほど、この配信の中で高い'));
    canvas.addEventListener('click', onChartClick);
    canvas.addEventListener('mousemove', onChartHover);
    canvas.addEventListener('mouseleave', () => { tipEl.style.display = 'none'; S.hoverX = null; drawChart(); });

    toolbar = el('div', 'hlx-toolbar');
    sortScoreBtn = el('button', 'hlx-chip-btn hlx-on', 'スコア順');
    sortTimeBtn = el('button', 'hlx-chip-btn', '時系列順');
    sortScoreBtn.addEventListener('click', () => { S.sort = 'score'; renderList(); });
    sortTimeBtn.addEventListener('click', () => { S.sort = 'time'; renderList(); });
    const copyBtn = el('button', 'hlx-chip-btn', 'リストをコピー');
    copyBtn.addEventListener('click', copyList);
    const refetchBtn = el('button', 'hlx-chip-btn', '再取得');
    refetchBtn.title = 'チャットを取り直す（通常は不要）';
    refetchBtn.addEventListener('click', () => start(true));
    toolbar.append(sortScoreBtn, sortTimeBtn, el('span', 'hlx-spacer'), copyBtn, refetchBtn);

    listEl = el('div', 'hlx-list');
    toast = el('div', 'hlx-toast');

    panel.append(head, statusEl, progWrap, startBtn, cancelBtn, chartWrap, toolbar, listEl, toast);
    document.body.append(fab, panel);
  }

  function setView(view) {
    panel.dataset.view = view;   // idle / loading / done / error
  }

  function setStatus(text) { statusEl.textContent = text; }

  function flash(msg) {
    toast.textContent = msg;
    toast.classList.add('hlx-show');
    clearTimeout(flash.t);
    flash.t = setTimeout(() => toast.classList.remove('hlx-show'), 1600);
  }

  function togglePanel() {
    panel.classList.toggle('hlx-open');
    if (panel.classList.contains('hlx-open') && S.res) drawChart();
  }

  // ---------- 取得と解析 ----------
  async function start(force) {
    if (S.running || !S.vid) return;
    const vid = S.vid;
    const my = ++S.runId;
    const alive = () => S.runId === my;
    S.running = true;
    setView('loading');
    setStatus('準備中…');
    progBar.style.width = '0%';
    progText.textContent = '';
    try {
      let cached = force ? null : await store.get('chat_' + vid);
      if (!cached) {
        const r = await hlxFetchChat(vid, {
          isAlive: alive,
          onProgress: (p) => {
            if (!alive()) return;
            if (p.phase === 'page') { setStatus('ページ情報を読み込み中…'); return; }
            const pct = p.duration ? Math.min(100, p.ms / 1000 / p.duration * 100) : 0;
            progBar.style.width = pct.toFixed(1) + '%';
            setStatus('チャットを取得中…（5時間の配信で数分かかります）');
            progText.textContent = `${hlxFmt(p.ms / 1000)} / ${hlxFmt(p.duration)}　${p.count.toLocaleString()}件`;
          },
        });
        cached = { info: r.info, items: r.items, at: Date.now() };
        if (alive()) await store.set('chat_' + vid, cached);
      }
      if (!alive()) return;
      S.info = cached.info;
      S.items = cached.items;
      await runAnalysis();
    } catch (e) {
      if (!alive() || e.message === '__aborted__') return;
      setView('error');
      setStatus(e.message || String(e));
    } finally {
      if (alive()) S.running = false;
    }
  }

  function cancel() {
    S.runId++;
    S.running = false;
    setView('idle');
    setStatus('中止しました。');
  }

  async function runAnalysis() {
    const settings = await loadSettings();
    S.res = hlxAnalyze(S.items, S.info, settings);
    const seen = await store.get('seen_' + S.vid);
    S.seen = new Set(seen || []);
    render();
  }

  // ---------- 表示 ----------
  function render() {
    const r = S.res;
    setView('done');
    setStatus(r.total
      ? `コメント ${r.total.toLocaleString()}件から、見どころ候補 ${r.highlights.length}か所`
      : 'コメントが1件も見つかりませんでした。');
    drawChart();
    renderList();
    drawMarkers();
  }

  function renderList() {
    sortScoreBtn.classList.toggle('hlx-on', S.sort === 'score');
    sortTimeBtn.classList.toggle('hlx-on', S.sort === 'time');
    listEl.textContent = '';
    if (!S.res) return;
    const hs = [...S.res.highlights].sort((a, b) => S.sort === 'time' ? a.start - b.start : b.score - a.score);
    if (!hs.length) {
      listEl.append(el('div', 'hlx-empty', '目立った盛り上がりは見つかりませんでした。設定（⚙）で感度を「多め」にすると候補が増えます。'));
      return;
    }
    for (const h of hs) {
      const row = el('div', 'hlx-row' + (S.seen.has(h.start) ? ' hlx-seen' : ''));
      const top = el('div', 'hlx-row-top');
      const tbtn = el('button', 'hlx-time', hlxFmt(h.start));
      tbtn.title = 'ここから再生';
      tbtn.addEventListener('click', () => {
        seek(h.start);
        S.seen.add(h.start);
        row.classList.add('hlx-seen');
        store.set('seen_' + S.vid, [...S.seen]);
      });
      top.append(
        el('span', 'hlx-rank', '#' + h.rank),
        tbtn,
        el('span', 'hlx-range', '〜 ' + hlxFmt(h.end)),
        el('span', 'hlx-spacer'),
        el('span', 'hlx-score', String(h.score)),
      );
      const reasons = el('div', 'hlx-reasons');
      h.reasons.forEach((t, i) => { if (i) reasons.append(el('br')); reasons.append(document.createTextNode(t)); });
      const chips = el('div', 'hlx-chips');
      for (const [k, n] of h.top) chips.append(el('span', 'hlx-chip', `${k} ×${n}`));
      row.append(top, reasons, chips);
      listEl.append(row);
    }
  }

  // ---------- タイムライン ----------
  const STOPS = [[0, [27, 31, 42]], [0.45, [60, 50, 130]], [0.75, [200, 50, 110]], [0.92, [255, 90, 80]], [1, [255, 215, 110]]];
  function cmap(x) {
    for (let i = 1; i < STOPS.length; i++) {
      if (x <= STOPS[i][0]) {
        const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], k = (x - a) / (b - a || 1);
        return `rgb(${ca.map((c, j) => Math.round(c + (cb[j] - c) * k)).join(',')})`;
      }
    }
    return 'rgb(255,215,110)';
  }
  function rankNorm(vals) {
    const s = vals.slice().sort((a, b) => a - b), n = s.length;
    return vals.map(v => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; } return n > 1 ? lo / (n - 1) : 0; });
  }
  function rows() {
    const r = S.res, B = r.binSec;
    if (!r._rows) {
      r._rows = [
        { key: 'count', label: 'コメント量', vals: r.count, f: v => `${v}件/${B}秒`, color: '#7cc4ff' },
        { key: 'accel', label: '加速度', vals: r.accel, f: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`, color: '#7cc4ff' },
        { key: 'same', label: '同じコメ率', vals: r.same, f: v => `${Math.round(v * 100)}%`, color: '#7cc4ff' },
        { key: 'score', label: '盛り上がり', vals: r.score, f: v => `${v}`, color: css('--hlx-accent') },
      ].filter(x => Array.isArray(x.vals));
      for (const x of r._rows) x.norm = rankNorm(x.vals);
    }
    return r._rows;
  }
  function viewRange() {
    const d = S.res.duration || S.res.bins * S.res.binSec;
    if (S.range === 'first') return [0, d / 2];
    if (S.range === 'second') return [d / 2, d];
    if (S.range === 'near') {
      const v = video(), t = v ? v.currentTime : 0, w = 15 * 60;
      let a = Math.max(0, t - w), b = Math.min(d, t + w);
      if (b - a < 2 * w) { if (a === 0) b = Math.min(d, 2 * w); else a = Math.max(0, d - 2 * w); }
      return [a, b];
    }
    return [0, d];
  }
  const LABEL_W = 70, MARK_H = 9, AXIS_H = 16, GAP = 3;
  function css(name) { return getComputedStyle(panel).getPropertyValue(name).trim(); }

  function drawChart() {
    const r = S.res;
    if (!r || !panel.classList.contains('hlx-open') || panel.dataset.view !== 'done') return;
    const R = rows();
    const rh = S.mode === 'heat' ? 18 : 38;
    const W = canvas.clientWidth || 360, H = MARK_H + R.length * (rh + GAP) + AXIS_H;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = H + 'px';
    canvas.width = W * dpr; canvas.height = H * dpr;
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const [V0, V1] = viewRange();
    S.view = [V0, V1];
    const PW = W - LABEL_W, B = r.binSec;
    const X = t => LABEL_W + (t - V0) / (V1 - V0) * PW;
    const b0 = Math.max(0, Math.floor(V0 / B)), b1 = Math.min(r.bins - 1, Math.ceil(V1 / B));
    c.font = '11px Roboto, "Noto Sans JP", "Yu Gothic UI", sans-serif';
    c.textBaseline = 'middle';
    const fg = css('--hlx-fg'), sub = css('--hlx-sub'), bg = css('--hlx-card');

    R.forEach((row, ri) => {
      const y = MARK_H + ri * (rh + GAP);
      c.fillStyle = sub; c.textAlign = 'left'; c.fillText(row.label, 0, y + rh / 2);
      c.fillStyle = bg; c.fillRect(LABEL_W, y, PW, rh);
      if (S.mode === 'heat') {
        // 1ピクセルに複数の区間が入るときは、その中の一番高い値で塗る（短い盛り上がりを見落とさない）
        const cols = new Map();
        for (let i = b0; i <= b1; i++) {
          const x0 = Math.floor(X(i * B)), x1 = Math.max(x0 + 1, Math.ceil(X((i + 1) * B)));
          for (let x = x0; x < x1; x++) {
            if (x < LABEL_W || x >= W) continue;
            const prev = cols.get(x);
            if (prev === undefined || row.norm[i] > prev) cols.set(x, row.norm[i]);
          }
        }
        for (const [x, v] of cols) { c.fillStyle = cmap(v); c.fillRect(x, y, 1, rh); }
      } else {
        let lo = Infinity, hi = -Infinity;
        for (let i = b0; i <= b1; i++) { lo = Math.min(lo, row.vals[i]); hi = Math.max(hi, row.vals[i]); }
        if (!isFinite(lo)) return;
        if (hi === lo) hi = lo + 1;
        c.strokeStyle = row.color; c.lineWidth = 1.3; c.beginPath();
        for (let i = b0; i <= b1; i++) {
          const px = X((i + 0.5) * B), py = y + rh - 2 - (row.vals[i] - lo) / (hi - lo) * (rh - 4);
          i === b0 ? c.moveTo(px, py) : c.lineTo(px, py);
        }
        c.stroke();
      }
    });

    // 見どころの印
    c.fillStyle = '#ffd166';
    for (const h of r.highlights) {
      if (h.peak < V0 || h.peak > V1) continue;
      const x = X(h.peak);
      c.beginPath(); c.moveTo(x - 4, 0); c.lineTo(x + 4, 0); c.lineTo(x, MARK_H - 2); c.fill();
    }
    // 目盛り
    const span = V1 - V0, steps = [60, 120, 300, 600, 900, 1800, 3600, 7200];
    const step = steps.find(s2 => span / s2 <= Math.max(3, PW / 70)) || 7200;
    c.fillStyle = sub; c.textAlign = 'center';
    for (let t = Math.ceil(V0 / step) * step; t <= V1; t += step) {
      const x = X(t), lab = hlxFmt(t).replace(/^0:/, ''), lw = c.measureText(lab).width / 2;
      c.fillRect(x, H - AXIS_H, 1, 3);
      c.fillText(lab, Math.min(Math.max(x, LABEL_W + lw), W - lw - 1), H - AXIS_H / 2 + 1);
    }
    // 縦線（再生位置・シークバーで指している位置）＋時刻ラベル
    const vline = (t, color, textColor, dashed) => {
      if (t == null || t < V0 || t > V1) return;
      const x = Math.round(X(t)) + 0.5;
      c.save();
      c.strokeStyle = color; c.lineWidth = 2;
      if (dashed) c.setLineDash([4, 3]);
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H - AXIS_H); c.stroke();
      c.setLineDash([]);
      c.font = 'bold 11px Roboto, "Noto Sans JP", "Yu Gothic UI", sans-serif';
      const lab = hlxFmt(t), tw = c.measureText(lab).width + 10;
      const lx = Math.min(Math.max(x - tw / 2, LABEL_W), W - tw);
      c.fillStyle = color;
      c.beginPath(); c.roundRect(lx, H - AXIS_H + 1, tw, AXIS_H - 2, 4); c.fill();
      c.fillStyle = textColor; c.textAlign = 'center';
      c.fillText(lab, lx + tw / 2, H - AXIS_H / 2 + 1);
      c.restore();
    };
    vline(S.seekHover, fg, bg, true);
    const v = video();
    if (v && isFinite(v.currentTime)) vline(v.currentTime, css('--hlx-accent'), '#fff', false);
    // マウス位置
    if (S.hoverX != null) { c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(S.hoverX, 0, 1, H - AXIS_H); }
  }

  function tAt(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < LABEL_W || !S.view) return null;
    return { x, t: S.view[0] + (x - LABEL_W) / (rect.width - LABEL_W) * (S.view[1] - S.view[0]) };
  }
  function onChartClick(e) {
    const p = S.res && tAt(e);
    if (p) { seek(p.t - S.res.leadSec); requestDraw(); flash(`${hlxFmt(Math.max(0, p.t - S.res.leadSec))} から再生`); }
  }
  function onChartHover(e) {
    const p = S.res && tAt(e);
    if (!p) { tipEl.style.display = 'none'; S.hoverX = null; drawChart(); return; }
    S.hoverX = p.x;
    drawChart();
    const B = S.res.binSec, i = Math.max(0, Math.min(S.res.bins - 1, Math.floor(p.t / B)));
    tipEl.textContent = '';
    tipEl.append(el('div', 'hlx-tip-h', `${hlxFmt(i * B)}〜${hlxFmt((i + 1) * B)}`));
    for (const row of rows()) tipEl.append(el('div', null, `${row.label}：${row.f(row.vals[i])}`));
    tipEl.style.display = 'block';
    const wrap = chartWrap.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    const left = cr.left - wrap.left + p.x + 12;
    tipEl.style.left = Math.min(left, wrap.width - tipEl.offsetWidth - 4) + 'px';
    tipEl.style.top = (e.clientY - wrap.top + 12) + 'px';
  }

  // シークバー上の印
  function clearMarkers() { document.querySelectorAll('.hlx-marks').forEach(e => e.remove()); }
  function drawMarkers() {
    clearMarkers();
    if (!S.res || !S.res.highlights.length) return;
    const bar = document.querySelector('#movie_player .ytp-progress-bar');
    const v = video();
    const dur = (v && isFinite(v.duration) && v.duration) || S.res.duration;
    if (!bar || !dur) return;
    const wrap = el('div', 'hlx-marks');
    for (const h of S.res.highlights) {
      const m = el('div', 'hlx-mark');
      m.style.left = Math.min(100, h.peak / dur * 100) + '%';
      wrap.append(m);
    }
    bar.append(wrap);
  }

  function copyList() {
    if (!S.res) return;
    const lines = [S.info.title, ''];
    for (const h of [...S.res.highlights].sort((a, b) => a.start - b.start)) {
      const msgs = h.top.slice(0, 3).map(([k, n]) => `「${k}」×${n}`).join('、');
      lines.push(`${hlxFmt(h.start)}  ${h.reasons.join(' / ')}${msgs ? '  ' + msgs : ''}`);
    }
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => flash('コピーしました'))
      .catch(() => flash('コピーできませんでした'));
  }

  // ---------- ページ遷移 ----------
  async function onNav() {
    const vid = currentVid();
    fab.style.display = vid ? '' : 'none';
    if (vid === S.vid) { if (S.res) drawMarkers(); return; }
    S.vid = vid;
    S.runId++;
    S.running = false;
    S.info = S.items = S.res = null;
    clearMarkers();
    listEl.textContent = '';
    if (!vid) { panel.classList.remove('hlx-open'); return; }
    setView('idle');
    setStatus('この配信のチャットを読み込んで、盛り上がった場面を探します。');
    const cached = await store.get('chat_' + vid);
    if (cached && S.vid === vid) {
      S.info = cached.info;
      S.items = cached.items;
      await runAnalysis();
    }
  }

  // ---------- 起動 ----------
  buildUI();
  setView('idle');
  document.addEventListener('yt-navigate-finish', onNav);
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) { lastHref = location.href; onNav(); }
    if (S.res && !document.querySelector('.hlx-marks')) drawMarkers();   // プレーヤーが作り直された時
  }, 1000);
  // ---------- 動画と連動 ----------
  let rafPending = false;
  function requestDraw() {
    if (rafPending || !S.res) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; drawChart(); });
  }
  // 再生・シークのたびに縦線を動かす（プレーヤーが作り直されても付け直す）
  let boundVideo = null;
  function bindVideo() {
    const v = video();
    if (!v || v === boundVideo) return;
    boundVideo = v;
    for (const ev of ['timeupdate', 'seeking', 'seeked', 'loadedmetadata']) v.addEventListener(ev, requestDraw);
  }
  // YouTubeのシークバーにマウスを乗せている／ドラッグしている位置を点線で出す
  document.addEventListener('mousemove', (e) => {
    if (!S.res || !panel.classList.contains('hlx-open')) return;
    const bar = document.querySelector('#movie_player .ytp-progress-bar');
    let t = null;
    if (bar) {
      const r = bar.getBoundingClientRect();
      const dragging = (e.buttons & 1) && S.seekHover != null;
      const near = e.clientY >= r.top - 14 && e.clientY <= r.bottom + 14 && e.clientX >= r.left && e.clientX <= r.right;
      if (r.width > 0 && (near || dragging)) {
        const v = video();
        const dur = (v && isFinite(v.duration) && v.duration) || S.res.duration;
        t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * dur;
      }
    }
    if (t !== S.seekHover) { S.seekHover = t; requestDraw(); }
  }, { passive: true });
  setInterval(() => { bindVideo(); if (S.res) requestDraw(); }, 1000);
  window.addEventListener('resize', () => drawChart());
  onNav();

  safe(() => chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'sync' && ch.hlxSettings && S.items) runAnalysis();
  }));
  safe(() => chrome.runtime.onMessage.addListener((m) => {
    if (m && m.type === 'hlx-toggle' && currentVid()) togglePanel();
  }));
})();
