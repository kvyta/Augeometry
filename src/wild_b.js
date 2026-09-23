
/* ---------- construction context ---------- */
var LABELS = ['M','N','P','Q','R','S','T','U','V','W','X','Y','Z','D','E','F','J','K','L'];
var CLABS = ['ω₁','ω₂','ω₃','ω₄'];

function newCtx(fr0) {
  return { f: fr0, pts: [], circs: [], text: [], coll: [], eq: [], ops: [], used: {}, cused: 0, scale: fr0.a };
}
function label(ctx) {
  for (var i = 0; i < LABELS.length; i++) if (!ctx.used[LABELS[i]]) { ctx.used[LABELS[i]] = 1; return LABELS[i]; }
  return 'Z' + (ctx.pts.length);
}
function idxOf(ctx, n) { for (var i = 0; i < ctx.pts.length; i++) if (ctx.pts[i].n === n) return i; return 99; }
function pr(ctx, n1, n2) { return idxOf(ctx, n1) <= idxOf(ctx, n2) ? n1 + n2 : n2 + n1; }
function tri3(ctx, a, b2, c) {
  var v = [a, b2, c].sort(function (x, y) { return idxOf(ctx, x) - idxOf(ctx, y); });
  return v[0] + v[1] + v[2];
}
function nameP(ctx, n) { for (var i = 0; i < ctx.pts.length; i++) if (ctx.pts[i].n === n) return ctx.pts[i]; return null; }
function addPt(ctx, P, n, parents) {
  if (!P) return null;
  if (qbig(P.x) || qbig(P.y)) return null;
  var lim = 7 * ctx.scale;
  if (Math.abs(qnum(P.x)) > lim || Math.abs(qnum(P.y)) > lim) return null;
  for (var i = 0; i < ctx.pts.length; i++) if (samePt(ctx.pts[i].p, P)) return null;
  var e = { n: n || label(ctx), p: P, par: parents || [] };
  ctx.pts.push(e);
  return e;
}
function addColl(ctx, names) {
  for (var i = 0; i < ctx.coll.length; i++) {
    var g = ctx.coll[i], hit = 0;
    for (var j = 0; j < names.length; j++) if (g.indexOf(names[j]) >= 0) hit++;
    if (hit >= 2) { names.forEach(function (n) { if (g.indexOf(n) < 0) g.push(n); }); return; }
  }
  ctx.coll.push(names.slice());
}
function knownColl(ctx, a, b, c) {
  for (var i = 0; i < ctx.coll.length; i++) {
    var g = ctx.coll[i];
    if (g.indexOf(a) >= 0 && g.indexOf(b) >= 0 && g.indexOf(c) >= 0) return true;
  }
  return false;
}
function segKey(a, b) { return a < b ? a + b : b + a; }
function addEq(ctx, a, b, c, d) { ctx.eq.push([segKey(a, b), segKey(c, d)]); }
function addCirc(ctx, C, on, txtName) {
  if (!C || qbig(C.o.x) || qbig(C.o.y) || qbig(C.r2)) return null;
  if (qz(C.r2)) return null;
  for (var i = 0; i < ctx.circs.length; i++)
    if (samePt(ctx.circs[i].c.o, C.o) && qz(qs(ctx.circs[i].c.r2, C.r2))) return null;
  var nm = txtName || CLABS[ctx.cused++] || ('ω' + ctx.circs.length);
  var e = { n: nm, c: C, on: on.slice() };
  ctx.circs.push(e);
  return e;
}
function onList(ctx, ce) { return ce.on; }

/* ---------- moves ---------- */
function rint(R, n) { return Math.floor(R() * n); }
function some(R, arr, k) {
  var a = arr.slice(), out = [];
  while (out.length < k && a.length) out.push(a.splice(rint(R, a.length), 1)[0]);
  return out.length === k ? out : null;
}

var MOVES = [
  { id: 'mid', w: 9, go: function (ctx, R) {
      var s = some(R, ctx.pts, 2); if (!s) return null;
      var e = addPt(ctx, midOf(s[0].p, s[1].p), null, [s[0].n, s[1].n]);
      if (!e) return null;
      addColl(ctx, [s[0].n, s[1].n, e.n]); addEq(ctx, e.n, s[0].n, e.n, s[1].n);
      ctx.ops.push({ id: 'mid', out: e.n, a: [s[0].n, s[1].n] });
      return 'Let ' + e.n + ' be the midpoint of ' + pr(ctx, s[0].n, s[1].n) + '.';
    } },
  { id: 'foot', w: 11, go: function (ctx, R) {
      var s = some(R, ctx.pts, 3); if (!s) return null;
      var l = linePP(s[1].p, s[2].p); if (!l) return null;
      if (collinear3(s[0].p, s[1].p, s[2].p)) return null;
      var e = addPt(ctx, footOn(s[0].p, l), null, [s[1].n, s[2].n]);
      if (!e) return null;
      addColl(ctx, [s[1].n, s[2].n, e.n]);
      ctx.ops.push({ id: 'foot', out: e.n, a: [s[0].n, s[1].n, s[2].n] });
      return 'Let ' + e.n + ' be the foot of the perpendicular from ' + s[0].n + ' to line ' + pr(ctx, s[1].n, s[2].n) + '.';
    } },
  { id: 'reflL', w: 9, go: function (ctx, R) {
      var s = some(R, ctx.pts, 3); if (!s) return null;
      var l = linePP(s[1].p, s[2].p); if (!l) return null;
      if (collinear3(s[0].p, s[1].p, s[2].p)) return null;
      var e = addPt(ctx, reflectLine(s[0].p, l), null, [s[0].n]);
      if (!e) return null;
      ctx.ops.push({ id: 'reflL', out: e.n, a: [s[0].n, s[1].n, s[2].n] });
      return 'Let ' + e.n + ' be the reflection of ' + s[0].n + ' in line ' + pr(ctx, s[1].n, s[2].n) + '.';
    } },
  { id: 'reflP', w: 4, go: function (ctx, R) {
      var s = some(R, ctx.pts, 2); if (!s) return null;
      var e = addPt(ctx, reflectPt(s[0].p, s[1].p), null, [s[0].n, s[1].n]);
      if (!e) return null;
      addColl(ctx, [s[0].n, s[1].n, e.n]); addEq(ctx, s[1].n, s[0].n, s[1].n, e.n);
      ctx.ops.push({ id: 'reflP', out: e.n, a: [s[0].n, s[1].n] });
      return 'Let ' + e.n + ' be the reflection of ' + s[0].n + ' over ' + s[1].n + '.';
    } },
  { id: 'meet', w: 12, go: function (ctx, R) {
      var s = some(R, ctx.pts, 4); if (!s) return null;
      var l1 = linePP(s[0].p, s[1].p), l2 = linePP(s[2].p, s[3].p);
      if (!l1 || !l2) return null;
      var e = addPt(ctx, meetLL(l1, l2), null, [s[0].n, s[1].n, s[2].n, s[3].n]);
      if (!e) return null;
      addColl(ctx, [s[0].n, s[1].n, e.n]); addColl(ctx, [s[2].n, s[3].n, e.n]);
      ctx.ops.push({ id: 'meet', out: e.n, a: [s[0].n, s[1].n, s[2].n, s[3].n] });
      return 'Lines ' + pr(ctx, s[0].n, s[1].n) + ' and ' + pr(ctx, s[2].n, s[3].n) + ' meet at ' + e.n + '.';
    } },
  { id: 'second', w: 16, go: function (ctx, R) {
      if (!ctx.circs.length) return null;
      var ce = ctx.circs[rint(R, ctx.circs.length)];
      var onN = some(R, ce.on, 1); if (!onN) return null;
      var Pe = nameP(ctx, onN[0]);
      var others = ctx.pts.filter(function (q) { return q.n !== Pe.n; });
      var Qe = some(R, others, 1); if (!Qe) return null;
      var X = secondOn(ce.c, Pe.p, Qe[0].p);
      var e = addPt(ctx, X, null, [Pe.n, Qe[0].n]);
      if (!e) return null;
      ce.on.push(e.n);
      addColl(ctx, [Pe.n, Qe[0].n, e.n]);
      ctx.ops.push({ id: 'second', out: e.n, a: [Pe.n, Qe[0].n], c: ce.n });
      return 'Line ' + pr(ctx, Pe.n, Qe[0].n) + ' meets ' + ce.n + ' again at ' + e.n + '.';
    } },
  { id: 'circum', w: 13, go: function (ctx, R) {
      var s = some(R, ctx.pts, 3); if (!s) return null;
      if (collinear3(s[0].p, s[1].p, s[2].p)) return null;
      var C = circ3(s[0].p, s[1].p, s[2].p);
      var e = addCirc(ctx, C, [s[0].n, s[1].n, s[2].n]);
      if (!e) return null;
      ctx.ops.push({ id: 'circum', out: e.n, a: [s[0].n, s[1].n, s[2].n], isCirc: 1 });
      return 'Let ' + e.n + ' be the circle through ' + s[0].n + ', ' + s[1].n + ' and ' + s[2].n + '.';
    } },
  { id: 'tangmeet', w: 11, go: function (ctx, R) {
      var cs = ctx.circs.filter(function (c) { return c.on.length >= 2; });
      if (!cs.length) return null;
      var ce = cs[rint(R, cs.length)];
      var s = some(R, ce.on, 2); if (!s) return null;
      var P1 = nameP(ctx, s[0]).p, P2 = nameP(ctx, s[1]).p;
      var ch = linePP(P1, P2); if (!ch) return null;
      var e = addPt(ctx, poleOf(ce.c, ch), null, [s[0], s[1]]);
      if (!e) return null;
      addEq(ctx, e.n, s[0], e.n, s[1]);
      ctx.ops.push({ id: 'tang', out: e.n, a: [s[0], s[1]], c: ce.n });
      return 'The tangents to ' + ce.n + ' at ' + s[0] + ' and at ' + s[1] + ' meet at ' + e.n + '.';
    } },
  { id: 'antipode', w: 6, go: function (ctx, R) {
      if (!ctx.circs.length) return null;
      var ce = ctx.circs[rint(R, ctx.circs.length)];
      var s = some(R, ce.on, 1); if (!s) return null;
      var Pe = nameP(ctx, s[0]);
      var e = addPt(ctx, reflectPt(Pe.p, ce.c.o), null, [Pe.n]);
      if (!e) return null;
      ce.on.push(e.n);
      for (var zz = 0; zz < ctx.pts.length; zz++) if (samePt(ctx.pts[zz].p, ce.c.o)) addColl(ctx, [Pe.n, ctx.pts[zz].n, e.n]);
      ctx.ops.push({ id: 'anti', out: e.n, a: [Pe.n], c: ce.n });
      return 'Let ' + e.n + ' be the point of ' + ce.n + ' diametrically opposite ' + Pe.n + '.';
    } },
  { id: 'ortho', w: 8, go: function (ctx, R) {
      var s = some(R, ctx.pts, 3); if (!s) return null;
      if (collinear3(s[0].p, s[1].p, s[2].p)) return null;
      var e = addPt(ctx, orthoOf(s[0].p, s[1].p, s[2].p), null, [s[0].n, s[1].n, s[2].n]);
      if (!e) return null;
      ctx.ops.push({ id: 'ortho', out: e.n, a: [s[0].n, s[1].n, s[2].n] });
      return 'Let ' + e.n + ' be the orthocenter of triangle ' + tri3(ctx, s[0].n, s[1].n, s[2].n) + '.';
    } },
  { id: 'circumcenter', w: 8, go: function (ctx, R) {
      var s = some(R, ctx.pts, 3); if (!s) return null;
      if (collinear3(s[0].p, s[1].p, s[2].p)) return null;
      var C = circ3(s[0].p, s[1].p, s[2].p);
      var e = addPt(ctx, C.o, null, [s[0].n, s[1].n, s[2].n]);
      if (!e) return null;
      addEq(ctx, e.n, s[0].n, e.n, s[1].n); addEq(ctx, e.n, s[1].n, e.n, s[2].n);
      ctx.ops.push({ id: 'ccen', out: e.n, a: [s[0].n, s[1].n, s[2].n] });
      return 'Let ' + e.n + ' be the circumcenter of triangle ' + tri3(ctx, s[0].n, s[1].n, s[2].n) + '.';
    } },
  { id: 'centroid', w: 4, go: function (ctx, R) {
      var s = some(R, ctx.pts, 3); if (!s) return null;
      if (collinear3(s[0].p, s[1].p, s[2].p)) return null;
      var e = addPt(ctx, centroidOf(s[0].p, s[1].p, s[2].p), null, [s[0].n, s[1].n, s[2].n]);
      if (!e) return null;
      ctx.ops.push({ id: 'cent', out: e.n, a: [s[0].n, s[1].n, s[2].n] });
      return 'Let ' + e.n + ' be the centroid of triangle ' + tri3(ctx, s[0].n, s[1].n, s[2].n) + '.';
    } },
  { id: 'miquel', w: 11, go: function (ctx, R) {
      if (ctx.circs.length < 2) return null;
      var s = some(R, ctx.circs, 2); if (!s) return null;
      var c1 = s[0], c2 = s[1];
      var shared = c1.on.filter(function (n) { return c2.on.indexOf(n) >= 0; });
      if (!shared.length) return null;
      var Pe = nameP(ctx, shared[0]);
      var axis = linePP(c1.c.o, c2.c.o);
      if (!axis) return null;
      var e = addPt(ctx, reflectLine(Pe.p, axis), null, [Pe.n]);
      if (!e) return null;
      c1.on.push(e.n); c2.on.push(e.n);
      ctx.ops.push({ id: 'miq', out: e.n, a: [Pe.n], cc: [c1.n, c2.n] });
      return 'Circles ' + c1.n + ' and ' + c2.n + ' meet again at ' + e.n + '.';
    } },
  { id: 'radmeet', w: 7, go: function (ctx, R) {
      if (ctx.circs.length < 2) return null;
      var s = some(R, ctx.circs, 2); if (!s) return null;
      var ax = radAxis(s[0].c, s[1].c); if (!ax) return null;
      var pp = some(R, ctx.pts, 2); if (!pp) return null;
      var l = linePP(pp[0].p, pp[1].p); if (!l) return null;
      var e = addPt(ctx, meetLL(ax, l), null, [pp[0].n, pp[1].n]);
      if (!e) return null;
      addColl(ctx, [pp[0].n, pp[1].n, e.n]);
      ctx.ops.push({ id: 'rad', out: e.n, a: [pp[0].n, pp[1].n], cc: [s[0].n, s[1].n] });
      return 'The radical axis of ' + s[0].n + ' and ' + s[1].n + ' meets line ' + pr(ctx, pp[0].n, pp[1].n) + ' at ' + e.n + '.';
    } },
  { id: 'para', w: 4, go: function (ctx, R) {
      var s = some(R, ctx.pts, 5); if (!s) return null;
      var base = linePP(s[1].p, s[2].p), tgt = linePP(s[3].p, s[4].p);
      if (!base || !tgt) return null;
      var e = addPt(ctx, meetLL(paraThrough(base, s[0].p), tgt), null, [s[3].n, s[4].n]);
      if (!e) return null;
      addColl(ctx, [s[3].n, s[4].n, e.n]);
      ctx.ops.push({ id: 'para', out: e.n, a: [s[0].n, s[1].n, s[2].n, s[3].n, s[4].n] });
      return 'The line through ' + s[0].n + ' parallel to ' + pr(ctx, s[1].n, s[2].n) + ' meets line ' + pr(ctx, s[3].n, s[4].n) + ' at ' + e.n + '.';
    } },
  { id: 'perp', w: 5, go: function (ctx, R) {
      var s = some(R, ctx.pts, 5); if (!s) return null;
      var base = linePP(s[1].p, s[2].p), tgt = linePP(s[3].p, s[4].p);
      if (!base || !tgt) return null;
      var e = addPt(ctx, meetLL(perpThrough(base, s[0].p), tgt), null, [s[3].n, s[4].n]);
      if (!e) return null;
      addColl(ctx, [s[3].n, s[4].n, e.n]);
      ctx.ops.push({ id: 'perp', out: e.n, a: [s[0].n, s[1].n, s[2].n, s[3].n, s[4].n] });
      return 'The line through ' + s[0].n + ' perpendicular to ' + pr(ctx, s[1].n, s[2].n) + ' meets line ' + pr(ctx, s[3].n, s[4].n) + ' at ' + e.n + '.';
    } }
];
