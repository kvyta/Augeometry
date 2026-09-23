/* ===================================================================
   WILD MODE - unbounded problem generation by random construction.

   Every base triangle is Heronian (integer sides, integer area), so the
   vertices have RATIONAL coordinates.  Every construction below keeps
   coordinates rational, so answers are exact m/n - computed, never guessed.
   =================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.WILD = factory(root.GEO);
}(typeof self !== 'undefined' ? self : this, function (GEO) {
'use strict';

var fr = GEO.fr, qa = GEO.fadd, qs = GEO.fsub, qm = GEO.fmul, qd = GEO.fdiv;
var Q0 = fr(0), Q1 = fr(1), Q2 = fr(2);
function qi(n) { return fr(n); }
function qz(f) { return f.n === 0n; }
function qneg(f) { return fr(-f.n, f.d); }
function qnum(f) { return Number(f.n) / Number(f.d); }
function qbig(f) { var n = f.n < 0n ? -f.n : f.n; return n > 100000000000000n || f.d > 100000000000000n; }

/* ---------- points, lines, circles over Q ---------- */
function pt(x, y) { return { x: x, y: y }; }
function sub(P, Q) { return pt(qs(P.x, Q.x), qs(P.y, Q.y)); }
function add2(P, Q) { return pt(qa(P.x, Q.x), qa(P.y, Q.y)); }
function scal(k, P) { return pt(qm(k, P.x), qm(k, P.y)); }
function dot(u, v) { return qa(qm(u.x, v.x), qm(u.y, v.y)); }
function cross(u, v) { return qs(qm(u.x, v.y), qm(u.y, v.x)); }
function dd(P, Q) { var u = sub(P, Q); return dot(u, u); }
function samePt(P, Q) { return qz(qs(P.x, Q.x)) && qz(qs(P.y, Q.y)); }
function linePP(P, Q) {
  var a = qs(Q.y, P.y), b = qs(P.x, Q.x);
  if (qz(a) && qz(b)) return null;
  return { a: a, b: b, c: qa(qm(a, P.x), qm(b, P.y)) };
}
function meetLL(l1, l2) {
  var det = qs(qm(l1.a, l2.b), qm(l2.a, l1.b));
  if (qz(det)) return null;
  return pt(qd(qs(qm(l1.c, l2.b), qm(l2.c, l1.b)), det), qd(qs(qm(l1.a, l2.c), qm(l2.a, l1.c)), det));
}
function perpThrough(l, P) { var a = qneg(l.b), b = l.a; return { a: a, b: b, c: qa(qm(a, P.x), qm(b, P.y)) }; }
function paraThrough(l, P) { return { a: l.a, b: l.b, c: qa(qm(l.a, P.x), qm(l.b, P.y)) }; }
function footOn(P, l) { return meetLL(l, perpThrough(l, P)); }
function reflectLine(P, l) { var F = footOn(P, l); if (!F) return null; return sub(scal(Q2, F), P); }
function midOf(P, Q) { return scal(qd(Q1, Q2), add2(P, Q)); }
function reflectPt(P, Q) { return sub(scal(Q2, Q), P); }
function perpBis(P, Q) {
  return { a: qm(Q2, qs(Q.x, P.x)), b: qm(Q2, qs(Q.y, P.y)), c: qs(dot(Q, Q), dot(P, P)) };
}
function circ3(P, Q, R) {
  var O = meetLL(perpBis(P, Q), perpBis(Q, R));
  if (!O) return null;
  return { o: O, r2: dd(O, P) };
}
function onCircle(C, P) { return qz(qs(dd(C.o, P), C.r2)); }
function secondOn(C, P, Q) {          /* P must be on C; line PQ meets C again */
  var d = sub(Q, P), n2 = dot(d, d);
  if (qz(n2)) return null;
  var t = qd(qm(qi(-2), dot(d, sub(P, C.o))), n2);
  if (qz(t)) return null;             /* tangent */
  return add2(P, scal(t, d));
}
function tangentAt(C, P) { var n = sub(P, C.o); return { a: n.x, b: n.y, c: dot(n, P) }; }
function poleOf(C, l) {
  var k = qs(l.c, qa(qm(l.a, C.o.x), qm(l.b, C.o.y)));
  if (qz(k)) return null;
  var lam = qd(C.r2, k);
  return add2(C.o, pt(qm(lam, l.a), qm(lam, l.b)));
}
function radAxis(C1, C2) {
  var a = qm(Q2, qs(C2.o.x, C1.o.x)), b = qm(Q2, qs(C2.o.y, C1.o.y));
  if (qz(a) && qz(b)) return null;
  var c = qs(qs(dot(C2.o, C2.o), C2.r2), qs(dot(C1.o, C1.o), C1.r2));
  return { a: a, b: b, c: c };
}
function orthoOf(A, B, C) {
  var l1 = linePP(B, C), l2 = linePP(C, A);
  if (!l1 || !l2) return null;
  return meetLL(perpThrough(l1, A), perpThrough(l2, B));
}
function centroidOf(A, B, C) { return scal(qd(Q1, qi(3)), add2(add2(A, B), C)); }
function areaX2(P, Q, R) { var v = cross(sub(Q, P), sub(R, P)); return v.n < 0n ? qneg(v) : v; }
function collinear3(P, Q, R) { return qz(cross(sub(Q, P), sub(R, P))); }
function concyclic4(P, Q, R, S) {     /* exact 4x4 determinant */
  var rows = [P, Q, R, S].map(function (X) { return [dot(X, X), X.x, X.y, Q1]; });
  return qz(det4(rows));
}
function det4(m) {
  var s = Q0;
  for (var j = 0; j < 4; j++) {
    var sub3 = [];
    for (var i = 1; i < 4; i++) { var r = []; for (var k = 0; k < 4; k++) if (k !== j) r.push(m[i][k]); sub3.push(r); }
    var term = qm(m[0][j], det3(sub3));
    s = (j % 2 === 0) ? qa(s, term) : qs(s, term);
  }
  return s;
}
function det3(m) {
  var t1 = qm(m[0][0], qs(qm(m[1][1], m[2][2]), qm(m[1][2], m[2][1])));
  var t2 = qm(m[0][1], qs(qm(m[1][0], m[2][2]), qm(m[1][2], m[2][0])));
  var t3 = qm(m[0][2], qs(qm(m[1][0], m[2][1]), qm(m[1][1], m[2][0])));
  return qa(qs(t1, t2), t3);
}

/* ---------- Heronian triangle supply ---------- */
function isqrt(n) { if (n < 0) return -1; var r = Math.round(Math.sqrt(n)); return r * r === n ? r : -1; }
var HERON = null;
function heronList() {
  if (HERON) return HERON;
  var out = [];
  for (var a = 4; a <= 100; a++) for (var b = a + 1; b <= 100; b++) for (var c = b + 1; c <= 100; c++) {
    if (a + b <= c) continue;
    if (a + b + c > 170) continue;
    var T = (a + b + c) * (-a + b + c) * (a - b + c) * (a + b - c);
    if (isqrt(T) < 0) continue;
    if (!GEO.shapely(a, b, c, 25, 130)) continue;   /* scalene only: symmetry breeds fake coincidences */
    if (a * a + b * b === c * c) continue;           /* right angles collapse O, H onto the triangle */
    out.push([a, b, c]);
  }
  HERON = out;
  return out;
}

/* ---------- build the base frame ---------- */
function baseFrame(a, b, c) {
  /* BC = a, CA = b, AB = c ; B=(0,0), C=(a,0), A=(x,y) with y rational */
  var T = (a + b + c) * (-a + b + c) * (a - b + c) * (a + b - c);
  var s = isqrt(T);
  if (s < 0) return null;
  var B = pt(Q0, Q0), C = pt(qi(a), Q0);
  var x = qd(qi(a * a + c * c - b * b), qi(2 * a));
  var y = qd(qi(s), qi(2 * a));
  return { A: pt(x, y), B: B, C: C, a: a, b: b, c: c };
}

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
      var shared = s[0].on.filter(function (n) { return s[1].on.indexOf(n) >= 0; });
      if (shared.length >= 2) return null;      /* then it is just the common chord */
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

/* ---------- cevian family: bisectors, medians, symmedians, isogonal conjugates ----------
   These need the side lengths as rationals, so they act on the base triangle ABC,
   whose sides are integers by construction.                                          */
function cevianSetup(ctx, R) {
  var f = ctx.f;
  var V = [
    { v: 'A', p: 'B', q: 'C', vp: f.c, vq: f.b, ang: '∠BAC', side: 'BC' },
    { v: 'B', p: 'C', q: 'A', vp: f.a, vq: f.c, ang: '∠ABC', side: 'CA' },
    { v: 'C', p: 'A', q: 'B', vp: f.b, vq: f.a, ang: '∠BCA', side: 'AB' }
  ];
  return V[rint(R, 3)];
}
function ptOf(ctx, n) { var e = nameP(ctx, n); return e && e.p; }

MOVES.push(
  { id: 'bisfoot', w: 12, go: function (ctx, R) {
      var s = cevianSetup(ctx, R);
      var P = ptOf(ctx, s.p), Qp = ptOf(ctx, s.q);
      if (!P || !Qp) return null;
      var w = qi(s.vp + s.vq);
      var D = pt(qd(qa(qm(qi(s.vq), P.x), qm(qi(s.vp), Qp.x)), w),
                 qd(qa(qm(qi(s.vq), P.y), qm(qi(s.vp), Qp.y)), w));
      var e = addPt(ctx, D, null, [s.p, s.q]);
      if (!e) return null;
      addColl(ctx, [s.p, s.q, e.n]);
      ctx.ops.push({ id: 'bisfoot', out: e.n, a: [s.v, s.p, s.q], r: [s.vp, s.vq] });
      return 'The internal bisector of ' + s.ang + ' meets ' + s.side + ' at ' + e.n + '.';
    } },
  { id: 'extbis', w: 6, go: function (ctx, R) {
      var s = cevianSetup(ctx, R);
      if (s.vp === s.vq) return null;
      var P = ptOf(ctx, s.p), Qp = ptOf(ctx, s.q);
      if (!P || !Qp) return null;
      var w = qi(s.vp - s.vq);
      var D = pt(qd(qs(qm(qi(s.vp), Qp.x), qm(qi(s.vq), P.x)), w),
                 qd(qs(qm(qi(s.vp), Qp.y), qm(qi(s.vq), P.y)), w));
      var e = addPt(ctx, D, null, [s.p, s.q]);
      if (!e) return null;
      addColl(ctx, [s.p, s.q, e.n]);
      ctx.ops.push({ id: 'extbis', out: e.n, a: [s.v, s.p, s.q], r: [s.vp, s.vq] });
      return 'The external bisector of ' + s.ang + ' meets line ' + s.side + ' at ' + e.n + '.';
    } },
  { id: 'symfoot', w: 11, go: function (ctx, R) {
      var s = cevianSetup(ctx, R);
      var P = ptOf(ctx, s.p), Qp = ptOf(ctx, s.q);
      if (!P || !Qp) return null;
      var p2 = s.vp * s.vp, q2 = s.vq * s.vq, w = qi(p2 + q2);
      var D = pt(qd(qa(qm(qi(q2), P.x), qm(qi(p2), Qp.x)), w),
                 qd(qa(qm(qi(q2), P.y), qm(qi(p2), Qp.y)), w));
      var e = addPt(ctx, D, null, [s.p, s.q]);
      if (!e) return null;
      addColl(ctx, [s.p, s.q, e.n]);
      ctx.ops.push({ id: 'symfoot', out: e.n, a: [s.v, s.p, s.q], r: [s.vp, s.vq] });
      return 'The ' + s.v + '-symmedian meets ' + s.side + ' at ' + e.n + '.';
    } },
  { id: 'medsec', w: 9, go: function (ctx, R) {
      if (!ctx.circs.length) return null;
      var ce = ctx.circs[0];
      if (['A', 'B', 'C'].some(function (n) { return ce.on.indexOf(n) < 0; })) return null;
      var s = cevianSetup(ctx, R);
      var V = ptOf(ctx, s.v), P = ptOf(ctx, s.p), Qp = ptOf(ctx, s.q);
      if (!V || !P || !Qp) return null;
      var X = secondOn(ce.c, V, midOf(P, Qp));
      var e = addPt(ctx, X, null, [s.v]);
      if (!e) return null;
      ce.on.push(e.n);
      ctx.ops.push({ id: 'medsec', out: e.n, a: [s.v, s.p, s.q], c: ce.n });
      return 'The median from ' + s.v + ' meets ' + ce.n + ' again at ' + e.n + '.';
    } },
  { id: 'isog', w: 8, go: function (ctx, R) {
      var f = ctx.f, A = ptOf(ctx, 'A'), B = ptOf(ctx, 'B'), C = ptOf(ctx, 'C');
      var cand = ctx.pts.filter(function (z) { return ['A', 'B', 'C'].indexOf(z.n) < 0; });
      if (!cand.length) return null;
      var Pe = cand[rint(R, cand.length)], P = Pe.p;
      var al = cross(sub(B, P), sub(C, P)), be = cross(sub(C, P), sub(A, P)), ga = cross(sub(A, P), sub(B, P));
      if (qz(al) || qz(be) || qz(ga)) return null;          /* P on a side line */
      var a2 = qi(f.a * f.a), b2 = qi(f.b * f.b), c2 = qi(f.c * f.c);
      var u = qm(a2, qm(be, ga)), v = qm(b2, qm(ga, al)), w = qm(c2, qm(al, be));
      var t = qa(qa(u, v), w);
      if (qz(t)) return null;
      var Qp = pt(qd(qa(qa(qm(u, A.x), qm(v, B.x)), qm(w, C.x)), t),
                  qd(qa(qa(qm(u, A.y), qm(v, B.y)), qm(w, C.y)), t));
      var e = addPt(ctx, Qp, null, [Pe.n]);
      if (!e) return null;
      ctx.ops.push({ id: 'isog', out: e.n, a: [Pe.n] });
      return 'Let ' + e.n + ' be the isogonal conjugate of ' + Pe.n + ' with respect to triangle ABC.';
    } }
);

/* ---------- exact verification: every constructed point must satisfy its defining property ---------- */
function ptOfC(ctx, n) { var e = nameP(ctx, n); return e && e.p; }
function nameC(ctx, n) { for (var i = 0; i < ctx.circs.length; i++) if (ctx.circs[i].n === n) return ctx.circs[i]; return null; }
function onLine(X, P, Q) { return collinear3(P, Q, X); }
function perpOK(u, v) { return qz(dot(u, v)); }
function distToSide2(P, U, V) {           /* squared distance from P to line UV, exact */
  var l = linePP(U, V);
  var r = qs(qa(qm(l.a, P.x), qm(l.b, P.y)), l.c);
  return qd(qm(r, r), qa(qm(l.a, l.a), qm(l.b, l.b)));
}
function verifyCtx(ctx) {
  var g = function (n) { var e = nameP(ctx, n); return e && e.p; };
  for (var i = 0; i < ctx.ops.length; i++) {
    var op = ctx.ops[i], a = op.a, X = op.isCirc ? null : g(op.out), ok = true;
    switch (op.id) {
      case 'mid': ok = samePt(scal(Q2, X), add2(g(a[0]), g(a[1]))); break;
      case 'reflP': ok = samePt(add2(X, g(a[0])), scal(Q2, g(a[1]))); break;
      case 'cent': ok = samePt(scal(qi(3), X), add2(add2(g(a[0]), g(a[1])), g(a[2]))); break;
      case 'foot': ok = onLine(X, g(a[1]), g(a[2])) && perpOK(sub(X, g(a[0])), sub(g(a[2]), g(a[1]))); break;
      case 'reflL': {
        var M = midOf(X, g(a[0]));
        ok = onLine(M, g(a[1]), g(a[2])) && perpOK(sub(X, g(a[0])), sub(g(a[2]), g(a[1])));
        break;
      }
      case 'meet': ok = onLine(X, g(a[0]), g(a[1])) && onLine(X, g(a[2]), g(a[3])); break;
      case 'second': {
        var C = nameC(ctx, op.c);
        ok = onCircle(C.c, X) && onLine(X, g(a[0]), g(a[1]));
        break;
      }
      case 'omegaSeed':
      case 'circum': {
        var Ce = nameC(ctx, op.out);
        ok = onCircle(Ce.c, g(a[0])) && onCircle(Ce.c, g(a[1])) && onCircle(Ce.c, g(a[2]));
        break;
      }
      case 'tang': {
        var C2 = nameC(ctx, op.c), P1 = g(a[0]), P2 = g(a[1]);
        ok = perpOK(sub(X, P1), sub(P1, C2.c.o)) && perpOK(sub(X, P2), sub(P2, C2.c.o));
        break;
      }
      case 'anti': {
        var C3 = nameC(ctx, op.c);
        ok = onCircle(C3.c, X) && samePt(midOf(X, g(a[0])), C3.c.o);
        break;
      }
      case 'ortho':
        ok = perpOK(sub(X, g(a[0])), sub(g(a[1]), g(a[2]))) && perpOK(sub(X, g(a[1])), sub(g(a[2]), g(a[0])));
        break;
      case 'ccen':
        ok = qz(qs(dd(X, g(a[0])), dd(X, g(a[1])))) && qz(qs(dd(X, g(a[1])), dd(X, g(a[2]))));
        break;
      case 'miq': {
        var Ca = nameC(ctx, op.cc[0]), Cb = nameC(ctx, op.cc[1]);
        ok = onCircle(Ca.c, X) && onCircle(Cb.c, X);
        break;
      }
      case 'rad': {
        var Cx = nameC(ctx, op.cc[0]), Cy = nameC(ctx, op.cc[1]);
        var p1 = qs(dd(X, Cx.c.o), Cx.c.r2), p2 = qs(dd(X, Cy.c.o), Cy.c.r2);
        ok = qz(qs(p1, p2)) && onLine(X, g(a[0]), g(a[1]));
        break;
      }
      case 'para':
        ok = onLine(X, g(a[3]), g(a[4])) && qz(cross(sub(X, g(a[0])), sub(g(a[2]), g(a[1]))));
        break;
      case 'perp':
        ok = onLine(X, g(a[3]), g(a[4])) && perpOK(sub(X, g(a[0])), sub(g(a[2]), g(a[1])));
        break;
      case 'incenter': {
        var A0 = g(a[0]), B0 = g(a[1]), C0 = g(a[2]);
        var d1 = distToSide2(X, B0, C0), d2x = distToSide2(X, C0, A0), d3 = distToSide2(X, A0, B0);
        ok = qz(qs(d1, d2x)) && qz(qs(d2x, d3));
        break;
      }
      case 'medsec': {
        var Cm = nameC(ctx, op.c);
        ok = onCircle(Cm.c, X) && onLine(X, g(op.a[0]), midOf(g(op.a[1]), g(op.a[2])));
        break;
      }
      case 'bisfoot': case 'extbis': case 'symfoot': {
        var Pp = g(op.a[1]), Qq = g(op.a[2]);
        var m = (op.id === 'symfoot') ? [op.r[0] * op.r[0], op.r[1] * op.r[1]] : [op.r[0], op.r[1]];
        /* X on line PQ, and PX : XQ = m0 : m1 (compare squares to stay rational) */
        var lhs = qm(dd(Pp, X), qi(m[1] * m[1])), rhs = qm(dd(X, Qq), qi(m[0] * m[0]));
        var between = cross(sub(X, Pp), sub(X, Qq));   /* collinear, so use the dot test */
        var side = dot(sub(X, Pp), sub(X, Qq));
        ok = onLine(X, Pp, Qq) && qz(qs(lhs, rhs)) &&
             (op.id === 'extbis' ? side.n > 0n : side.n < 0n);
        break;
      }
      case 'isog': {
        var A1 = g('A'), B1 = g('B'), C1 = g('C'), Pi = g(op.a[0]);
        var eqAng = function (V, U1, U2) {          /* ∠(U1 V P) = ∠(Q V U2) exactly */
          var l = qm(cross(sub(U1, V), sub(Pi, V)), dot(sub(X, V), sub(U2, V)));
          var r2 = qm(cross(sub(X, V), sub(U2, V)), dot(sub(U1, V), sub(Pi, V)));
          return qz(qs(l, r2));
        };
        ok = eqAng(A1, B1, C1) && eqAng(B1, C1, A1) && eqAng(C1, A1, B1);
        break;
      }
      default: ok = true;
    }
    if (!ok) return op.id + ':' + op.out;
  }
  return null;
}

/* ---------- coincidence detection (exact) ---------- */
/* first record the facts that follow immediately from the construction, so they
   are not reported back to the solver as "hidden structure" */
function eqClasses(ctx) {
  var parent = {};
  var find = function (x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  var uni = function (x, y) {
    if (parent[x] === undefined) parent[x] = x;
    if (parent[y] === undefined) parent[y] = y;
    var rx = find(x), ry = find(y);
    if (rx !== ry) parent[rx] = ry;
  };
  ctx.eq.forEach(function (e) { uni(e[0], e[1]); });
  return { find: function (k) { return parent[k] === undefined ? k : find(k); } };
}

function expandKnown(ctx) {
  ctx.ops.forEach(function (o) {
    if (o.id !== 'rad') return;
    var c1 = nameC(ctx, o.cc[0]), c2 = nameC(ctx, o.cc[1]);
    if (!c1 || !c2) return;
    var sh = c1.on.filter(function (n) { return c2.on.indexOf(n) >= 0; });
    if (sh.length >= 2) addColl(ctx, [sh[0], sh[1], o.out]);
  });
  /* a reflection in a line preserves the distance from every point of that line */
  ctx.ops.forEach(function (o) {
    if (o.id !== 'reflL') return;
    var src = o.a[0], L1 = o.a[1], L2 = o.a[2];
    ctx.pts.forEach(function (Z) {
      if (Z.n === src || Z.n === o.out) return;
      if (Z.n === L1 || Z.n === L2 || knownColl(ctx, L1, L2, Z.n) || collinear3(ptOfC(ctx, L1), ptOfC(ctx, L2), Z.p))
        addEq(ctx, Z.n, src, Z.n, o.out);
    });
  });
  /* every point of a circle is equidistant from a named centre */
  ctx.circs.forEach(function (ce) {
    var Cn = null;
    ctx.pts.forEach(function (Z) { if (samePt(Z.p, ce.c.o)) Cn = Z.n; });
    if (!Cn) return;
    for (var i = 0; i < ce.on.length; i++) for (var j = i + 1; j < ce.on.length; j++)
      addEq(ctx, Cn, ce.on[i], Cn, ce.on[j]);
  });
  if (nameP(ctx, 'I')) {
    ctx.ops.forEach(function (o) {
      if (o.id === 'bisfoot') addColl(ctx, [o.a[0], 'I', o.out]);
    });
  }
  ctx.ops.forEach(function (o) {
    if (o.id === 'medsec') {
      var m = null;
      ctx.ops.forEach(function (om) {
        if (om.id !== 'mid') return;
        if (om.a.indexOf(o.a[1]) >= 0 && om.a.indexOf(o.a[2]) >= 0) m = om.out;
      });
      if (m) addColl(ctx, [o.a[0], m, o.out]);
    }
  });
  ctx.ops.forEach(function (oc) {
    if (oc.id !== 'cent') return;
    ctx.ops.forEach(function (om) {
      if (om.id !== 'mid') return;
      var t = oc.a, m = om.a;
      if (t.indexOf(m[0]) < 0 || t.indexOf(m[1]) < 0) return;
      var third = t.filter(function (n) { return n !== m[0] && n !== m[1]; })[0];
      if (third) addColl(ctx, [third, oc.out, om.out]);
    });
  });
  ctx.ops.forEach(function (o) {
    if (o.id !== 'reflP') return;
    var P = nameP(ctx, o.a[0]), Cc = nameP(ctx, o.a[1]), X = nameP(ctx, o.out);
    if (!P || !Cc || !X) return;
    ctx.circs.forEach(function (ce) {
      if (samePt(ce.c.o, Cc.p) && ce.on.indexOf(P.n) >= 0 && ce.on.indexOf(X.n) < 0) ce.on.push(X.n);
    });
  });
}

function findNotes(ctx) {
  expandKnown(ctx);
  var EQ = eqClasses(ctx);
  var P = ctx.pts, notes = [], i, j, k, l;
  for (i = 0; i < P.length; i++) for (j = i + 1; j < P.length; j++) for (k = j + 1; k < P.length; k++) {
    if (!collinear3(P[i].p, P[j].p, P[k].p)) continue;
    if (knownColl(ctx, P[i].n, P[j].n, P[k].n)) continue;
    notes.push({ t: 'coll', s: P[i].n + ', ' + P[j].n + ' and ' + P[k].n + ' are collinear', rank: 1 });
  }
  for (i = 0; i < ctx.pts.length; i++) for (j = 0; j < ctx.circs.length; j++) {
    if (ctx.circs[j].on.indexOf(P[i].n) >= 0) continue;
    if (onCircle(ctx.circs[j].c, P[i].p)) {
      notes.push({ t: 'on', s: P[i].n + ' lies on ' + ctx.circs[j].n, rank: 1 });
      ctx.circs[j].on.push(P[i].n);      /* so the concyclicity pass does not restate it */
    }
  }
  if (notes.length < 3) {
    for (i = 0; i < P.length; i++) for (j = i + 1; j < P.length; j++)
      for (k = j + 1; k < P.length; k++) for (l = k + 1; l < P.length; l++) {
        if (collinear3(P[i].p, P[j].p, P[k].p) || collinear3(P[i].p, P[j].p, P[l].p) ||
            collinear3(P[i].p, P[k].p, P[l].p) || collinear3(P[j].p, P[k].p, P[l].p)) continue;
        if (!concyclic4(P[i].p, P[j].p, P[k].p, P[l].p)) continue;
        var nm = [P[i].n, P[j].n, P[k].n, P[l].n], known = false;
        for (var m = 0; m < ctx.circs.length; m++) {
          var on = ctx.circs[m].on;
          if (nm.every(function (x) { return on.indexOf(x) >= 0; })) known = true;
        }
        if (known) continue;
        notes.push({ t: 'cyc', s: nm.join(', ') + ' are concyclic', rank: 2 });
      }
  }
  if (notes.length < 3) {
    for (i = 0; i < P.length; i++) for (j = i + 1; j < P.length; j++)
      for (k = 0; k < P.length; k++) for (l = k + 1; l < P.length; l++) {
        if (k < i || (k === i && l <= j)) continue;
        if (P[k].n === P[i].n || P[k].n === P[j].n || P[l].n === P[i].n || P[l].n === P[j].n) continue;
        if (!qz(qs(dd(P[i].p, P[j].p), dd(P[k].p, P[l].p)))) continue;
        if (EQ.find(segKey(P[i].n, P[j].n)) === EQ.find(segKey(P[k].n, P[l].n))) continue;
        notes.push({ t: 'eq', s: P[i].n + P[j].n + ' = ' + P[k].n + P[l].n, rank: 3 });
      }
  }
  notes.sort(function (x, y) { return x.rank - y.rank; });
  return notes.slice(0, 3);
}

/* ---------- targets ----------
   Enumerate every candidate question this construction can ask, then keep the one
   with the cleanest exact value. A big denominator is the signature of a bash
   problem; a small one means the quantity actually has structure.               */
function depCount(ctx, names, circName) {
  var need = {}, cnt = 0;
  names.forEach(function (n) { need[n] = 1; });
  if (circName) need[circName] = 1;
  for (var i = ctx.ops.length - 1; i >= 0; i--) {
    var op = ctx.ops[i];
    if (!need[op.out]) continue;
    if (op.id !== 'omegaSeed') cnt++;
    (op.a || []).forEach(function (n) { need[n] = 1; });
    if (op.c) need[op.c] = 1;
    if (op.cc) op.cc.forEach(function (n) { need[n] = 1; });
  }
  return cnt;
}
/* per-kind cleanliness budgets: a squared length carries a squarer denominator
   than an area ratio, so holding both to one threshold just deletes all lengths */
var CAPS = { d2: [900n, 40000n], area: [250n, 20000n], ratio: [150n, 12000n], r2: [900n, 40000n] };
function scoreOf(v, kept) {
  var num = Number(v.n), den = Number(v.d);
  return 2.4 * Math.log(den + 1) + Math.log(num + 1) - 0.85 * kept;
}
function chooseTarget(ctx, R) {
  var P = ctx.pts, i, j, k, cands = [];
  var isBase = function (n) { return n === 'A' || n === 'B' || n === 'C'; };
  var push = function (v, q, kind, names, circ) {
    if (!v || v.n <= 0n) return;
    var cap = CAPS[kind];
    if (v.d > cap[0]) return;
    if (v.n + v.d > cap[1]) return;
    if (v.n + v.d < 15n) return;          /* an answer of 1 or 2 is a giveaway */
    var kept = depCount(ctx, names || [], circ);
    if (kept < 4) return;
    cands.push({ v: v, q: q, kind: kind, pts: names, circ: circ, kept: kept, s: scoreOf(v, kept) });
  };
  var baseArea = areaX2(nameP(ctx, 'A').p, nameP(ctx, 'B').p, nameP(ctx, 'C').p);

  for (i = 0; i < P.length; i++) for (j = i + 1; j < P.length; j++) {
    if (isBase(P[i].n) && isBase(P[j].n)) continue;
    push(dd(P[i].p, P[j].p), P[i].n + P[j].n + '\u00B2', 'd2', [P[i].n, P[j].n]);
  }
  for (i = 0; i < P.length; i++) for (j = i + 1; j < P.length; j++) for (k = j + 1; k < P.length; k++) {
    if (isBase(P[i].n) && isBase(P[j].n) && isBase(P[k].n)) continue;
    var ar = areaX2(P[i].p, P[j].p, P[k].p);
    if (qz(ar)) continue;
    push(qd(ar, baseArea), '[' + P[i].n + P[j].n + P[k].n + '] / [ABC]', 'area', [P[i].n, P[j].n, P[k].n]);
  }
  for (i = 1; i < ctx.circs.length; i++) {
    push(ctx.circs[i].c.r2, 'the square of the radius of ' + ctx.circs[i].n, 'r2', [], ctx.circs[i].n);
  }
  var late = P.filter(function (z) { return !isBase(z.n); });
  for (var t = 0; t < 40 && late.length >= 2; t++) {
    var s1 = some(R, late, 2), s2 = some(R, P, 2);
    if (!s1 || !s2) continue;
    if (segKey(s1[0].n, s1[1].n) === segKey(s2[0].n, s2[1].n)) continue;
    var n1 = dd(s1[0].p, s1[1].p), n2 = dd(s2[0].p, s2[1].p);
    if (qz(n1) || qz(n2)) continue;
    var rv = qd(n1, n2);
    push(rv, s1[0].n + s1[1].n + '\u00B2 / ' + s2[0].n + s2[1].n + '\u00B2', 'ratio',
         [s1[0].n, s1[1].n, s2[0].n, s2[1].n]);
  }
  if (!cands.length) return null;
  cands.sort(function (x, y) { return x.s - y.s; });
  var byKind = {}, KW = { d2: 55, area: 26, ratio: 14, r2: 5 };
  cands.forEach(function (c2) { (byKind[c2.kind] = byKind[c2.kind] || []).push(c2); });
  var kinds = Object.keys(byKind), tot = 0;
  kinds.forEach(function (k2) { tot += KW[k2] || 1; });
  var r = R() * tot, pickKind = kinds[0];
  for (var z = 0; z < kinds.length; z++) { r -= (KW[kinds[z]] || 1); if (r <= 0) { pickKind = kinds[z]; break; } }
  var pool = byKind[pickKind].slice(0, Math.min(6, byKind[pickKind].length));
  return pool[rint(R, pool.length)];
}

/* ---------- the generator ---------- */
function seedCtx(ctx, R) {
  var f = ctx.f;
  ['A', 'B', 'C'].forEach(function (n) { ctx.used[n] = 1; });
  ctx.pts.push({ n: 'A', p: f.A, par: [] }, { n: 'B', p: f.B, par: [] }, { n: 'C', p: f.C, par: [] });
  var W = circ3(f.A, f.B, f.C);
  addCirc(ctx, W, ['A', 'B', 'C'], '\u03C9');
  ctx.head = 'Triangle ABC has BC = ' + f.a + ', CA = ' + f.b + ', AB = ' + f.c + '.';
  ctx.ops.push({ id: 'omegaSeed', out: '\u03C9', a: ['A', 'B', 'C'], isCirc: 1, seed: 1,
    text: 'Let \u03C9 be the circumcircle of ABC.' });
  var opts = [
    { n: 'I', make: function () {
        var w = qi(f.a + f.b + f.c);
        return pt(qd(qa(qa(qm(qi(f.a), f.A.x), qm(qi(f.b), f.B.x)), qm(qi(f.c), f.C.x)), w),
                  qd(qa(qa(qm(qi(f.a), f.A.y), qm(qi(f.b), f.B.y)), qm(qi(f.c), f.C.y)), w));
      }, t: 'Let I be the incenter of ABC.', op: 'incenter' },
    { n: 'H', make: function () { return orthoOf(f.A, f.B, f.C); },
      t: 'Let H be the orthocenter of ABC.', op: 'ortho' },
    { n: 'O', make: function () { return W.o; },
      t: 'Let O be the circumcenter of ABC.', op: 'ccen' },
    { n: 'G', make: function () { return centroidOf(f.A, f.B, f.C); },
      t: 'Let G be the centroid of ABC.', op: 'cent' }
  ];
  var chosen = [];
  for (var t = 0; t < 40 && chosen.length < 2; t++) {
    var o = opts[rint(R, opts.length)];
    if (chosen.indexOf(o) < 0) chosen.push(o);
  }
  chosen.forEach(function (o) {
    var Pp = o.make();
    if (!Pp) return;
    ctx.used[o.n] = 1;
    var e = addPt(ctx, Pp, o.n, []);
    if (!e) return;
    ctx.ops.push({ id: o.op, out: o.n, a: ['A', 'B', 'C'], seed: 1, text: o.t });
    if (o.n === 'O') { addEq(ctx, 'O', 'A', 'O', 'B'); addEq(ctx, 'O', 'B', 'O', 'C'); }
  });
}

/* keep only the steps the question actually depends on */
function prune(ctx, tg) {
  var need = {};
  (tg.pts || []).forEach(function (n) { need[n] = 1; });
  if (tg.circ) need[tg.circ] = 1;
  for (var i = ctx.ops.length - 1; i >= 0; i--) {
    var op = ctx.ops[i];
    if (!need[op.out]) continue;
    op.keep = 1;
    (op.a || []).forEach(function (n) { need[n] = 1; });
    if (op.c) need[op.c] = 1;
    if (op.cc) op.cc.forEach(function (n) { need[n] = 1; });
  }
  ctx.ops = ctx.ops.filter(function (o) { return o.keep; });
  var keepP = {A: 1, B: 1, C: 1};
  ctx.ops.forEach(function (o) { if (!o.isCirc) keepP[o.out] = 1; });
  Object.keys(need).forEach(function (n) { keepP[n] = 1; });
  ctx.pts = ctx.pts.filter(function (e) { return keepP[e.n]; });
  var keepC = {};
  ctx.ops.forEach(function (o) { if (o.isCirc) keepC[o.out] = 1; });
  ctx.circs = ctx.circs.filter(function (ce) { return keepC[ce.n]; });
  ctx.circs.forEach(function (ce) {
    ce.on = ce.on.filter(function (n) { return keepP[n]; });
  });
  return ctx.ops.filter(function (o) { return o.id !== 'omegaSeed'; }).length;
}

function build(seed) {
  var R = GEO.rng(seed >>> 0);
  var H = heronList();
  var tri = H[rint(R, H.length)].slice();
  for (var s = tri.length - 1; s > 0; s--) { var j = rint(R, s + 1); var t = tri[s]; tri[s] = tri[j]; tri[j] = t; }
  var f = baseFrame(tri[0], tri[1], tri[2]);
  if (!f) return null;
  var ctx = newCtx(f);
  seedCtx(ctx, R);
  var steps = 5 + rint(R, 4), made = 0, guard = 0;
  var tot = 0; MOVES.forEach(function (m) { tot += m.w; });
  while (made < steps && guard++ < 400) {
    var r = R() * tot, mv = MOVES[0];
    for (var i = 0; i < MOVES.length; i++) { r -= MOVES[i].w; if (r <= 0) { mv = MOVES[i]; break; } }
    var before = ctx.ops.length;
    var line;
    try { line = mv.go(ctx, R); } catch (e) { line = null; }
    if (!line || ctx.ops.length === before) continue;
    ctx.ops[ctx.ops.length - 1].text = line;
    made++;
  }
  if (made < 3) return null;
  if (verifyCtx(ctx)) return null;
  var tg = chooseTarget(ctx, R);
  if (!tg) return null;
  var kept = prune(ctx, tg);
  if (kept < 4) return null;
  if (verifyCtx(ctx)) return null;
  return { ctx: ctx, target: tg, seed: seed >>> 0, steps: kept };
}

/* ---------- presentation ---------- */
function fs(f) { return GEO.fstr(f); }
function coordStr(P) { return '(' + fs(P.x) + ', ' + fs(P.y) + ')'; }

function figureOf(ctx, tg) {
  var g = [], gp = function (n) { return nameP(ctx, n); };
  var xy = function (e) { return [qnum(e.p.x), qnum(e.p.y)]; };
  ctx.circs.forEach(function (ce, i) {
    g.push({ t: 'circ', c: [qnum(ce.c.o.x), qnum(ce.c.o.y)], r: Math.sqrt(qnum(ce.c.r2)),
             dash: i === 0 ? 0 : 1, k: i === 0 ? 'main' : 'aux' });
  });
  var A = gp('A'), B = gp('B'), C = gp('C');
  g.push({ t: 'seg', p: xy(A), q: xy(B), k: 'main', dash: 0 });
  g.push({ t: 'seg', p: xy(B), q: xy(C), k: 'main', dash: 0 });
  g.push({ t: 'seg', p: xy(C), q: xy(A), k: 'main', dash: 0 });
  ctx.ops.forEach(function (op) {
    if (op.isCirc) return;
    var X = gp(op.out);
    if (!X) return;
    var link = [];
    if (op.id === 'meet') link = [op.a[0], op.a[1], op.a[2], op.a[3]];
    else if (op.id === 'second' || op.id === 'mid' || op.id === 'reflP') link = [op.a[0], op.a[1]];
    else if (op.id === 'foot' || op.id === 'reflL') link = [op.a[0]];
    else if (op.id === 'tang') link = [op.a[0], op.a[1]];
    else if (op.id === 'para' || op.id === 'perp') link = [op.a[3], op.a[4]];
    link.forEach(function (n) {
      var Y = gp(n);
      if (Y) g.push({ t: 'seg', p: xy(X), q: xy(Y), k: 'aux', dash: 1 });
    });
  });
  if (tg.kind === 'd2' && tg.pts) {
    g.push({ t: 'seg', p: xy(gp(tg.pts[0])), q: xy(gp(tg.pts[1])), k: 'hi', dash: 0 });
  } else if (tg.kind === 'area' && tg.pts) {
    for (var i = 0; i < 3; i++)
      g.push({ t: 'seg', p: xy(gp(tg.pts[i])), q: xy(gp(tg.pts[(i + 1) % 3])), k: 'hi', dash: 0 });
  } else if (tg.kind === 'r2') {
    var ce = nameC(ctx, tg.circ);
    if (ce) g.push({ t: 'circ', c: [qnum(ce.c.o.x), qnum(ce.c.o.y)], r: Math.sqrt(qnum(ce.c.r2)), dash: 0, k: 'hi' });
  }
  ctx.pts.forEach(function (e) { g.push({ t: 'pt', p: xy(e), l: e.n }); });
  return g;
}

function make(seed) {
  if (seed === undefined) seed = (Math.random() * 4294967296) >>> 0;
  for (var k = 0; k < 400; k++) {
    var b = build((seed + k * 2654435761) >>> 0);
    if (b) return present(b);
  }
  return null;
}

function present(b) {
  var ctx = b.ctx, tg = b.target, f = ctx.f;
  var notes = findNotes(ctx);
  var v = tg.v, isInt = (v.d === 1n);
  var answer = (isInt ? v.n : v.n + v.d).toString();
  var nSteps = b.steps;

  var statement = ctx.head + ' ' + ctx.ops.map(function (o) { return o.text; }).filter(Boolean).join(' ');

  var hints = [];
  hints.push('This triangle is Heronian, so set B = (0, 0), C = (' + f.a + ', 0) and A = ' +
    coordStr(f.A) + '. Every point in the construction is then rational — coordinates will close it out.');
  if (notes.length) {
    hints.push('There is hidden structure here: <b>' + notes[0].s + '</b>. Spotting that is usually the short route.');
  } else {
    var mid = ctx.pts[3 + Math.floor((ctx.pts.length - 3) / 2)] || ctx.pts[3];
    if (mid) hints.push('Work out ' + mid.n + ' first — it comes to ' + coordStr(mid.p) + '.');
    else hints.push('Take the construction one step at a time and keep everything as exact fractions.');
  }
  var shown = ctx.pts.slice(3).filter(function (e) { return !tg.pts || tg.pts.indexOf(e.n) < 0; });
  if (shown.length) {
    hints.push('Intermediate coordinates: ' + shown.map(function (e) { return e.n + ' = ' + coordStr(e.p); }).join(', ') + '.');
  } else {
    hints.push('Every point is rational — push the fractions through without decimals and the answer drops out.');
  }

  var sol = '<p>This one is machine-generated, so there is no named lemma behind it — here is the verified coordinate computation. ' +
    'Each step below was checked to satisfy its own definition exactly (in rational arithmetic, not floating point).</p>';
  sol += '<p class="k">B = (0, 0)&nbsp; C = (' + f.a + ', 0)&nbsp; A = ' + coordStr(f.A) + '</p>';
  sol += '<p>Carrying the construction through:</p><p class="k">' +
    ctx.pts.slice(3).map(function (e) { return e.n + ' = ' + coordStr(e.p); }).join('<br>') + '</p>';
  if (ctx.circs.length > 1) {
    sol += '<p class="k">' + ctx.circs.map(function (ce) {
      return ce.n + ': center ' + coordStr(ce.c.o) + ', r² = ' + fs(ce.c.r2);
    }).join('<br>') + '</p>';
  }
  if (notes.length) {
    sol += '<p><b>Worth spotting:</b> ' + notes.map(function (n) { return n.s; }).join('; ') +
      '. A synthetic solution would almost certainly go through ' +
      (notes[0].t === 'coll' ? 'that collinearity' : notes[0].t === 'cyc' ? 'those concyclic points' :
       notes[0].t === 'on' ? 'that incidence' : 'that equality') + '.</p>';
  }
  sol += '<p>Finally</p><p class="k">' + tg.q + ' = ' + fs(v) +
    (isInt ? '' : '&nbsp; →&nbsp; m + n = <b>' + answer + '</b>') + '</p>';

  return {
    cfgId: 'wild', name: 'Wild construction · ' + nSteps + ' steps',
    lemma: notes.length
      ? 'Machine-generated from a random chain of classical constructions. Hidden structure in this one: ' +
        notes.map(function (n) { return n.s; }).join('; ') + '.'
      : 'Machine-generated from a random chain of classical constructions over a Heronian triangle, so every point is rational and the answer is exact.',
    tier: 4, topic: 'wild', seed: b.seed, params: { tri: [f.a, f.b, f.c] },
    quantity: tg.q, statement: statement,
    exact: fs(v), approx: qnum(v), isInt: isInt, answer: answer,
    hints: hints, solution: sol, figure: figureOf(ctx, tg),
    notes: notes.map(function (n) { return n.s; }), steps: nSteps
  };
}

return {
  make: make, build: build, heronList: heronList, verifyCtx: verifyCtx,
  findNotes: findNotes, baseFrame: baseFrame,
  _k: { pt: pt, dd: dd, circ3: circ3, secondOn: secondOn, poleOf: poleOf, collinear3: collinear3, qnum: qnum }
};
}));
