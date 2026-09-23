(function () {
'use strict';
var $ = function (id) { return document.getElementById(id); };

/* ============ figure renderer ============ */
function svgFor(prims) {
  var W = 1000, H = 700, pad = 64;
  var x0 = 1e18, x1 = -1e18, y0 = 1e18, y1 = -1e18;
  function add(x, y) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  prims.forEach(function (o) {
    if (o.t === 'pt') add(o.p[0], o.p[1]);
    else if (o.t === 'seg') { add(o.p[0], o.p[1]); add(o.q[0], o.q[1]); }
    else if (o.t === 'circ') { add(o.c[0] - o.r, o.c[1] - o.r); add(o.c[0] + o.r, o.c[1] + o.r); }
  });
  var bw = Math.max(x1 - x0, 1e-6), bh = Math.max(y1 - y0, 1e-6);
  var sc = Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh);
  var px = (W - bw * sc) / 2, py = (H - bh * sc) / 2;
  function m(p) { return [(p[0] - x0) * sc + px, (y1 - p[1]) * sc + py]; }
  var pts = prims.filter(function (o) { return o.t === 'pt'; });
  var cx = 0, cy = 0;
  pts.forEach(function (o) { cx += o.p[0]; cy += o.p[1]; });
  if (pts.length) { cx /= pts.length; cy /= pts.length; }

  var out = [], dots = [], labs = [];
  prims.forEach(function (o) {
    if (o.t === 'circ') {
      var c = m(o.c), cls = o.dash ? 'fig-circ-dash' : (o.k === 'hi' ? 'fig-circ-hi' : 'fig-circ');
      out.push('<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + (o.r * sc).toFixed(1) + '" class="' + cls + '"/>');
    } else if (o.t === 'seg') {
      var a = m(o.p), b = m(o.q);
      var cl = o.dash ? 'fig-dash' : (o.k === 'hi' ? 'fig-hi' : (o.k === 'main' ? 'fig-main' : 'fig-aux'));
      out.push('<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" class="' + cl + '"/>');
    } else if (o.t === 'pt') {
      var q = m(o.p);
      dots.push('<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="5.6" class="fig-dot"/>');
      var dx = o.p[0] - cx, dy = o.p[1] - cy, L = Math.hypot(dx, dy);
      if (L < 1e-9) { dx = 0; dy = 1; L = 1; }
      dx /= L; dy /= L;
      var lx = q[0] + dx * 26, ly = q[1] - dy * 26 + 7;
      var anchor = dx > 0.35 ? 'start' : (dx < -0.35 ? 'end' : 'middle');
      var parts = String(o.l).split('_');
      var txt = esc(parts[0]) + (parts[1] ? '<tspan font-size="14" dy="5">' + esc(parts[1]) + '</tspan>' : '');
      labs.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anchor + '" class="fig-lab">' + txt + '</text>');
    }
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Figure for the problem">' +
    out.join('') + dots.join('') + labs.join('') + '</svg>';
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ============ storage ============ */
var KEY = 'sgd.v1';
var DB = { stats: {}, streak: 0, best: 0, total: 0, correct: 0,
  opts: { adaptive: true, name: false, fig: true, topic: 'all', tier: 'all', custom: null } };
try {
  var raw = localStorage.getItem(KEY);
  if (raw) { var o = JSON.parse(raw); if (o && o.stats) { DB = o; DB.opts = DB.opts || {}; } }
} catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }
function st(id) { return DB.stats[id] || (DB.stats[id] = { seen: 0, right: 0, time: 0 }); }

/* ============ problem state ============ */
var cur = null, scored = false, done = false, hintsUp = 0, t0 = 0, tick = null;

function activeIds() {
  if (DB.opts.custom && DB.opts.custom.length) return DB.opts.custom.slice();
  if (DB.opts.tier === '4') return ['wild'];
  return GEO.CONFIGS.filter(function (c) {
    return (DB.opts.topic === 'all' || c.topic === DB.opts.topic) &&
           (DB.opts.tier === 'all' || c.tier === +DB.opts.tier);
  }).map(function (c) { return c.id; });
}
function weightOf(id) {
  var s = DB.stats[id];
  if (!s || s.seen === 0) return 3.2;
  var acc = s.right / s.seen;
  return 1 + 3 * (1 - acc) + (s.seen < 3 ? 1.4 : 0);
}
function pickId(ids) {
  if (ids.length === 1) return ids[0];
  var pool = ids.filter(function (i) { return !cur || i !== cur.cfgId; });
  if (!pool.length) pool = ids;
  if (!DB.opts.adaptive) return pool[Math.floor(Math.random() * pool.length)];
  var tot = 0, w = pool.map(function (i) { var x = weightOf(i); tot += x; return x; });
  var r = Math.random() * tot;
  for (var k = 0; k < pool.length; k++) { r -= w[k]; if (r <= 0) return pool[k]; }
  return pool[pool.length - 1];
}

function newProblem() {
  var ids = activeIds();
  if (!ids.length) { DB.opts.topic = 'all'; DB.opts.tier = 'all'; ids = activeIds(); }
  var id = pickId(ids);
  cur = (id === 'wild') ? WILD.make() : GEO.makeProblem(id, (Math.random() * 4294967296) >>> 0);
  if (!cur) cur = GEO.randomProblem();
  scored = false; done = false; hintsUp = 0;
  drawProblem();
  startClock();
}

function drawProblem() {
  var p = cur, cfg = GEO.byId(p.cfgId);
  $('pTier').className = 'tier t' + p.tier;
  $('pTier').textContent = GEO.TIERS[p.tier];
  $('pTopic').textContent = GEO.TOPICS[p.topic] || 'Machine-generated construction';
  $('pStmt').innerHTML = p.statement;
  $('pAsk').innerHTML = p.isInt
    ? 'Find <b>' + p.quantity + '</b>.'
    : '<b>' + p.quantity + '</b> can be written as m/n, where m and n are relatively prime positive integers. Find <b>m + n</b>.';
  $('pFig').innerHTML = svgFor(p.figure);
  $('plate').hidden = !DB.opts.fig;
  $('figBtn').textContent = DB.opts.fig ? 'hide' : 'show';
  $('pNamed').hidden = !DB.opts.name;
  $('pNamedT').innerHTML = p.name;
  $('pNamedL').innerHTML = p.lemmaPre || p.lemma;
  $('ans').value = ''; $('ans').disabled = false;
  $('checkBtn').disabled = false;
  $('verdict').hidden = true;
  $('hints').innerHTML = '';
  $('sol').hidden = true;
  $('hintBtn').disabled = false;
  $('hintBtn').textContent = 'Hint 1 of ' + p.hints.length;
  $('solBtn').textContent = 'Solution';
  $('newBtn').className = 'btn';
  $('checkBtn').className = 'btn primary';
}

function startClock() {
  t0 = Date.now();
  if (tick) clearInterval(tick);
  $('pClock').textContent = '0:00';
  tick = setInterval(function () {
    var s = Math.floor((Date.now() - t0) / 1000);
    $('pClock').textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }, 1000);
}
function stopClock() { if (tick) { clearInterval(tick); tick = null; } return Math.round((Date.now() - t0) / 1000); }

function record(ok) {
  var s = st(cur.cfgId);
  s.seen++; if (ok) s.right++;
  s.time += Math.min(stopClock(), 1800);
  DB.total++;
  if (ok) { DB.correct++; DB.streak++; if (DB.streak > DB.best) DB.best = DB.streak; }
  else DB.streak = 0;
  save();
}

function finish() {
  done = true;
  $('ans').disabled = true; $('checkBtn').disabled = true;
  $('checkBtn').className = 'btn';
  $('newBtn').className = 'btn primary';
  $('pNamed').hidden = false;
  $('pNamedT').innerHTML = cur.name;
  $('pNamedL').innerHTML = cur.lemma;
}

function check(e) {
  if (e) e.preventDefault();
  if (done) { newProblem(); return; }
  var v = $('ans').value.replace(/[^0-9]/g, '');
  if (!v) { $('ans').focus(); return; }
  var ok = (v.replace(/^0+(?=\d)/, '') === cur.answer);
  if (!scored) { scored = true; record(ok); }
  var vd = $('verdict'); vd.hidden = false;
  if (ok) {
    vd.className = 'verdict good';
    vd.innerHTML = 'Correct. <span class="val">' + cur.quantity + ' = ' + cur.exact + '</span>' +
      '<span class="named">Streak: ' + DB.streak + '</span>';
    finish();
    $('newBtn').focus();
  } else {
    vd.className = 'verdict bad';
    vd.innerHTML = 'That is not the answer. Try again, take a hint, or open the solution.';
    $('ans').select();
  }
  renderProgress();
}

function showHint() {
  if (hintsUp >= cur.hints.length) return;
  var li = document.createElement('li');
  li.innerHTML = cur.hints[hintsUp];
  $('hints').appendChild(li);
  hintsUp++;
  if (hintsUp >= cur.hints.length) { $('hintBtn').disabled = true; $('hintBtn').textContent = 'No more hints'; }
  else $('hintBtn').textContent = 'Hint ' + (hintsUp + 1) + ' of ' + cur.hints.length;
}

function showSolution() {
  if (!scored) { scored = true; record(false); }
  while (hintsUp < cur.hints.length) showHint();
  $('solBody').innerHTML =
    '<p class="k" style="border-left-color:var(--accent)">' + cur.quantity + ' = ' + cur.exact +
    '&nbsp; &nbsp;→&nbsp; answer <b>' + cur.answer + '</b></p>' + cur.solution;
  $('sol').hidden = false;
  if (!done) finish();
  renderProgress();
}

var WILDCFG = { id: 'wild', tier: 4, topic: 'wild',
  name: 'Wild constructions (unlimited)',
  lemma: 'Not a lemma \u2014 a generator. It chains plane triangle-and-circle constructions at random over a Heronian triangle, so every point stays rational and the answer is computed exactly. Its vocabulary: internal and external bisectors, medians (including where they meet the circumcircle), symmedians, isogonal conjugates, perpendicular feet, reflections, second intersections with a circle, circumcircles, tangent poles, radical axes and Miquel points. About two in five problems hide a coincidence \u2014 a collinearity, a concyclicity, an unexpected incidence, an equal pair \u2014 which is usually the short way in, and that is what the second hint tells you.' };

/* ============ chips & filters ============ */
function buildChips() {
  var tc = $('topicChips'), tr = $('tierChips');
  tc.innerHTML = ''; tr.innerHTML = '';
  function mk(host, label, val, key) {
    var b = document.createElement('button');
    b.className = 'chip'; b.type = 'button'; b.textContent = label;
    b.setAttribute('aria-pressed', String(DB.opts[key] === val));
    b.onclick = function () { DB.opts[key] = val; DB.opts.custom = null; save(); buildChips(); setLabel(); newProblem(); };
    host.appendChild(b);
  }
  mk(tc, 'All', 'all', 'topic');
  Object.keys(GEO.TOPICS).forEach(function (k) { mk(tc, GEO.TOPICS[k], k, 'topic'); });
  mk(tr, 'All', 'all', 'tier');
  [1, 2, 3, 4].forEach(function (t) { mk(tr, GEO.TIERS[t], String(t), 'tier'); });
}
function setLabel() {
  var ids = activeIds(), n = ids.length;
  var nm;
  if (DB.opts.custom && DB.opts.custom.length) {
    nm = n === 1 ? ((ids[0] === 'wild' ? WILDCFG : GEO.byId(ids[0])).name.replace(/<[^>]+>/g, '')) : n + ' selected configurations';
  } else if (DB.opts.tier === '4') nm = 'Wild constructions \u2014 unlimited';
  else if (DB.opts.topic === 'all' && DB.opts.tier === 'all') nm = 'All ' + n + ' lemmas';
  else {
    var bits = [];
    if (DB.opts.topic !== 'all') bits.push(GEO.TOPICS[DB.opts.topic]);
    if (DB.opts.tier !== 'all') bits.push(GEO.TIERS[DB.opts.tier] + ' level');
    nm = bits.join(' · ') + ' (' + n + ')';
  }
  $('setName').textContent = nm;
  $('setMeta').textContent = DB.opts.adaptive ? '· adaptive' : '';
  $('setMeta').style.color = 'var(--muted)';
  $('setMeta').style.fontSize = '12px';
}

/* ============ progress view ============ */
function fmtTime(s) { return Math.floor(s / 60) + ':' + ('0' + Math.round(s % 60)).slice(-2); }
function renderProgress() {
  $('sAtt').textContent = DB.total;
  $('sAcc').textContent = DB.total ? Math.round(100 * DB.correct / DB.total) + '%' : '—';
  $('sStreak').textContent = DB.streak;
  $('sBest').textContent = DB.best;
  var all = GEO.CONFIGS.concat([WILDCFG]);
  var rows = all.map(function (c) {
    var s = DB.stats[c.id] || { seen: 0, right: 0, time: 0 };
    return { c: c, s: s, acc: s.seen ? s.right / s.seen : -1 };
  });
  rows.sort(function (a, b) {
    if (a.acc < 0 && b.acc < 0) return 0;
    if (a.acc < 0) return 1; if (b.acc < 0) return -1;
    if (a.acc !== b.acc) return a.acc - b.acc;
    return b.s.seen - a.s.seen;
  });
  var host = $('progRows'); host.innerHTML = '';
  rows.forEach(function (r) {
    var b = document.createElement('button');
    b.className = 'row' + (r.acc < 0 ? ' untried' : (r.acc < 0.5 ? ' weak' : (r.acc >= 0.8 ? ' strong' : '')));
    var pct = r.acc < 0 ? 0 : Math.round(100 * r.acc);
    b.innerHTML = '<span class="nm">' + r.c.name + '</span>' +
      '<span class="sc">' + (r.acc < 0 ? 'not tried' : r.s.right + '/' + r.s.seen + ' · ' + pct + '%') + '</span>' +
      '<span class="bar"><i style="width:' + pct + '%"></i></span>' +
      '<span class="meta">' + GEO.TIERS[r.c.tier].toUpperCase() + ' · ' + (GEO.TOPICS[r.c.topic] || 'Unlimited, machine-generated') +
      (r.s.seen ? ' · avg ' + fmtTime(r.s.time / r.s.seen) : '') + '</span>';
    b.onclick = function () { drillOnly([r.c.id]); };
    host.appendChild(b);
  });
}
function drillOnly(ids) {
  DB.opts.custom = ids; save();
  setLabel(); show('drill'); newProblem();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============ lemma index ============ */
function renderLemmas() {
  var host = $('lemBody'); host.innerHTML = '';
  Object.keys(GEO.TOPICS).forEach(function (k) {
    var list = GEO.CONFIGS.filter(function (c) { return c.topic === k; });
    if (!list.length) return;
    var g = document.createElement('div'); g.className = 'group';
    g.innerHTML = '<h3>' + GEO.TOPICS[k] + '</h3>';
    list.sort(function (a, b) { return a.tier - b.tier; }).forEach(function (c) {
      var d = document.createElement('div'); d.className = 'lem';
      d.innerHTML = '<div class="hd"><span class="tier t' + c.tier + '">' + GEO.TIERS[c.tier] + '</span>' +
        '<span class="nm">' + c.name + '</span></div><p>' + c.lemma + '</p>';
      var btn = document.createElement('button');
      btn.className = 'go'; btn.type = 'button'; btn.textContent = 'Drill this';
      btn.onclick = function () { drillOnly([c.id]); };
      d.appendChild(btn);
      g.appendChild(d);
    });
    host.appendChild(g);
  });
  var g2 = document.createElement('div'); g2.className = 'group';
  g2.innerHTML = '<h3>Unlimited</h3>';
  var d2 = document.createElement('div'); d2.className = 'lem';
  d2.innerHTML = '<div class="hd"><span class="tier t4">Wild</span><span class="nm">' + WILDCFG.name +
    '</span></div><p>' + WILDCFG.lemma + '</p>';
  var b2 = document.createElement('button');
  b2.className = 'go'; b2.type = 'button'; b2.textContent = 'Drill this';
  b2.onclick = function () { drillOnly(['wild']); };
  d2.appendChild(b2); g2.appendChild(d2); host.appendChild(g2);
}

/* ============ views ============ */
function show(v) {
  ['drill', 'progress', 'lemmas'].forEach(function (k) {
    $('view-' + k).hidden = (k !== v);
    $('tab-' + k).setAttribute('aria-selected', String(k === v));
  });
  if (v === 'progress') renderProgress();
}

/* ============ wiring ============ */
$('ansForm').addEventListener('submit', check);
$('hintBtn').onclick = showHint;
$('solBtn').onclick = showSolution;
$('newBtn').onclick = function () { newProblem(); $('ans').focus(); };
$('figBtn').onclick = function () { DB.opts.fig = !DB.opts.fig; save(); $('plate').hidden = !DB.opts.fig; $('figBtn').textContent = DB.opts.fig ? 'hide' : 'show'; };
$('optAdaptive').onchange = function () { DB.opts.adaptive = this.checked; save(); setLabel(); };
$('optName').onchange = function () { DB.opts.name = this.checked; save(); if (!done) { $('pNamed').hidden = !this.checked; } };
$('tab-drill').onclick = function () { show('drill'); };
$('tab-progress').onclick = function () { show('progress'); };
$('tab-lemmas').onclick = function () { show('lemmas'); };
$('weakBtn').onclick = function () {
  var rows = GEO.CONFIGS.map(function (c) {
    var s = DB.stats[c.id] || { seen: 0, right: 0 };
    return { id: c.id, acc: s.seen ? s.right / s.seen : 2, seen: s.seen };
  }).sort(function (a, b) { return a.acc - b.acc || b.seen - a.seen; });
  drillOnly(rows.slice(0, 5).map(function (r) { return r.id; }));
};
$('resetBtn').onclick = function () {
  DB.stats = {}; DB.streak = 0; DB.best = 0; DB.total = 0; DB.correct = 0; save(); renderProgress();
};
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && done && document.activeElement !== $('ans')) { newProblem(); }
});

window.SGD = { get problem() { return cur; }, get data() { return DB; } };

/* boot */
if (DB.opts.adaptive === undefined) DB.opts.adaptive = true;
if (DB.opts.fig === undefined) DB.opts.fig = true;
$('optAdaptive').checked = !!DB.opts.adaptive;
$('optName').checked = !!DB.opts.name;
buildChips(); setLabel(); renderLemmas(); renderProgress(); newProblem();
})();
