/* ===================================================================
   Olympiad Geometry Drill - generator core
   Exact rational arithmetic (BigInt) so every answer is a clean m/n.
   =================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GEO = factory();
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

/* ---------- exact rationals ---------- */
function bgcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { var t = a % b; a = b; b = t; } return a; }
function fr(n, d) {
  n = BigInt(n); d = (d === undefined ? 1n : BigInt(d));
  if (d === 0n) throw new Error('division by zero');
  if (d < 0n) { n = -n; d = -d; }
  var g = bgcd(n, d); if (g === 0n) g = 1n;
  return { n: n / g, d: d / g };
}
var fadd = function (x, y) { return fr(x.n * y.d + y.n * x.d, x.d * y.d); };
var fsub = function (x, y) { return fr(x.n * y.d - y.n * x.d, x.d * y.d); };
var fmul = function (x, y) { return fr(x.n * y.n, x.d * y.d); };
var fdiv = function (x, y) { return fr(x.n * y.d, x.d * y.n); };
var fnum = function (x) { return Number(x.n) / Number(x.d); };
var fint = function (x) { return x.d === 1n; };
function fstr(x) { return x.d === 1n ? String(x.n) : (String(x.n) + '/' + String(x.d)); }

/* ---------- seeded RNG (mulberry32) ---------- */
function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function ri(R, lo, hi) { return lo + Math.floor(R() * (hi - lo + 1)); }
function pick(R, arr) { return arr[Math.floor(R() * arr.length)]; }

/* ---------- triangle shape helpers (floating point, for validity + figures) ---------- */
function angles(a, b, c) {
  return [
    Math.acos((b * b + c * c - a * a) / (2 * b * c)),
    Math.acos((c * c + a * a - b * b) / (2 * c * a)),
    Math.acos((a * a + b * b - c * c) / (2 * a * b))
  ];
}
function shapely(a, b, c, minDeg, maxDeg) {
  if (a + b <= c || b + c <= a || c + a <= b) return false;
  var A = angles(a, b, c), lo = minDeg * Math.PI / 180, hi = maxDeg * Math.PI / 180;
  for (var i = 0; i < 3; i++) if (A[i] < lo || A[i] > hi) return false;
  return true;
}
/* random integer triangle, sides in [lo,hi], angles in [22,140] degrees */
function randTri(R, lo, hi) {
  lo = lo || 7; hi = hi || 21;
  for (var k = 0; k < 4000; k++) {
    var a = ri(R, lo, hi), b = ri(R, lo, hi), c = ri(R, lo, hi);
    if (a === b && b === c) continue;
    if (!shapely(a, b, c, 28, 124)) continue;
    return { a: a, b: b, c: c };
  }
  return { a: 14, b: 13, c: 15 };
}

/* full coordinate model of triangle ABC: BC = a, CA = b, AB = c */
function model(a, b, c) {
  var B = [0, 0], C = [a, 0];
  var x = (a * a + c * c - b * b) / (2 * a);
  var y = Math.sqrt(Math.max(c * c - x * x, 1e-12));
  var A = [x, y];
  var s = (a + b + c) / 2;
  var K = Math.sqrt(s * (s - a) * (s - b) * (s - c));
  var Rc = a * b * c / (4 * K);
  var oy = Math.sqrt(Math.max(Rc * Rc - a * a / 4, 1e-12)) * (y > 0 ? 1 : -1);
  /* circumcentre is on x = a/2; pick the sign consistently by solving directly */
  var k = (x * x + y * y - a * x) / (2 * y);   /* from |O-B| = |O-A| with O=(a/2,k) */
  var O = [a / 2, k];
  var r = K / s;
  var I = [(a * A[0] + b * B[0] + c * C[0]) / (a + b + c), (a * A[1] + b * B[1] + c * C[1]) / (a + b + c)];
  var H = [A[0] + B[0] + C[0] - 2 * O[0], A[1] + B[1] + C[1] - 2 * O[1]];
  var N = [(O[0] + H[0]) / 2, (O[1] + H[1]) / 2];
  var IA = [(-a * A[0] + b * B[0] + c * C[0]) / (-a + b + c), (-a * A[1] + b * B[1] + c * C[1]) / (-a + b + c)];
  var M = [a / 2, k - Rc];              /* arc midpoint of BC not containing A (A is above BC) */
  return { a: a, b: b, c: c, A: A, B: B, C: C, O: O, I: I, H: H, N: N, IA: IA, M: M, R: Rc, r: r, s: s, K: K, oy: oy };
}
var d2 = function (P, Q) { var dx = P[0] - Q[0], dy = P[1] - Q[1]; return dx * dx + dy * dy; };
var dist = function (P, Q) { return Math.sqrt(d2(P, Q)); };
var mid = function (P, Q) { return [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; };
var lerp = function (P, Q, t) { return [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]; };
function meet(P1, P2, P3, P4) {           /* intersection of lines P1P2 and P3P4 */
  var x1 = P1[0], y1 = P1[1], x2 = P2[0], y2 = P2[1], x3 = P3[0], y3 = P3[1], x4 = P4[0], y4 = P4[1];
  var den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  var A1 = x1 * y2 - y1 * x2, A2 = x3 * y4 - y3 * x4;
  return [(A1 * (x3 - x4) - (x1 - x2) * A2) / den, (A1 * (y3 - y4) - (y1 - y2) * A2) / den];
}
/* foot of perpendicular from P to line QR */
function foot(P, Q, R2) {
  var dx = R2[0] - Q[0], dy = R2[1] - Q[1];
  var t = ((P[0] - Q[0]) * dx + (P[1] - Q[1]) * dy) / (dx * dx + dy * dy);
  return [Q[0] + t * dx, Q[1] + t * dy];
}
