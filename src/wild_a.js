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
