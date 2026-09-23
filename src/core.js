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
/* ---------- shared statement helpers ---------- */
function sides(p) { return 'BC = ' + p.a + ', CA = ' + p.b + ', AB = ' + p.c; }
function Tval(a, b, c) { return (a + b + c) * (b + c - a) * (c + a - b) * (a + b - c); } /* = 16K^2 */
function bigT(a, b, c) { a = BigInt(a); b = BigInt(b); c = BigInt(c); return (a + b + c) * (b + c - a) * (c + a - b) * (a + b - c); }
function sq(x) { return x * x; }
function num(v) { return String(v); }

/* label a point object for figures */
function P(pt, l, dir) { return { t: 'pt', p: pt, l: l, dir: dir }; }
function S(p1, p2, o) { o = o || {}; return { t: 'seg', p: p1, q: p2, dash: o.dash ? 1 : 0, k: o.k || 'aux' }; }
function CIR(c, r, o) { o = o || {}; return { t: 'circ', c: c, r: r, dash: o.dash ? 1 : 0, k: o.k || 'aux' }; }
function TRI(m) { return [S(m.A, m.B, { k: 'main' }), S(m.B, m.C, { k: 'main' }), S(m.C, m.A, { k: 'main' })]; }
function ABC(m) { return [P(m.A, 'A'), P(m.B, 'B'), P(m.C, 'C')]; }

var CONFIGS = [];

/* ============ 1. Incenter-Excenter Lemma (Fact 5) ============ */
CONFIGS.push({
  id: 'fact5', tier: 2, topic: 'incenter',
  name: 'Incenter–Excenter Lemma ("Fact 5")',
  lemma: 'If M is the midpoint of arc BC not containing A, then MB = MC = MI = MI<sub>A</sub>. Equivalently, M is the circumcenter of BICI<sub>A</sub>.',
  gen: function (R) { var t = randTri(R, 8, 21); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    return fr(a * a * b * c, (a + b + c) * (b + c - a));
  },
  quantity: 'MI²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. Let I be the incenter of ABC, and let M be the midpoint of arc BC of the circumcircle not containing A.';
  },
  hints: [
    'Chase angles in triangle MBI: show ∠MBI = ∠MIB = (A + B)/2. What does that make triangle MBI?',
    'That is the Incenter–Excenter Lemma: MI = MB = MC. So the whole problem reduces to finding the chord MB.',
    'MB is the chord subtending inscribed angle ∠BAM = A/2, so MB = 2R·sin(A/2). Now use sin²(A/2) = (s−b)(s−c)/bc and R = abc/4K.'
  ],
  solution: function (p) {
    return '<p><b>Fact 5.</b> ∠MBC = ∠MAC = A/2 (same arc MC), so ∠MBI = ∠MBC + ∠CBI = A/2 + B/2. Also ∠MIB is exterior to triangle ABI, so ∠MIB = ∠IAB + ∠IBA = A/2 + B/2. Hence triangle MBI is isosceles and <b>MI = MB</b>.</p>' +
      '<p>MB subtends inscribed angle ∠BAM = A/2, so MB = 2R·sin(A/2). Squaring and using sin²(A/2) = (s−b)(s−c)/(bc), R = abc/(4K), K² = s(s−a)(s−b)(s−c):</p>' +
      '<p class="k">MI² = 4R²·(s−b)(s−c)/(bc) = a²bc / (4s(s−a)) = a²bc / ((a+b+c)(b+c−a))</p>' +
      '<p>With a = ' + p.a + ', b = ' + p.b + ', c = ' + p.c + ': MI² = ' + p.a + '²·' + p.b + '·' + p.c + ' / (' + (p.a + p.b + p.c) + '·' + (p.b + p.c - p.a) + ').</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), g = [];
    g.push(CIR(m.O, m.R, { k: 'main' }));
    g.push(CIR(m.M, dist(m.M, m.B), { dash: 1 }));
    g = g.concat(TRI(m));
    g.push(S(m.A, m.M, { dash: 1 }), S(m.M, m.B), S(m.M, m.C), S(m.M, m.I, { k: 'hi' }));
    g = g.concat(ABC(m));
    g.push(P(m.I, 'I'), P(m.M, 'M'));
    return g;
  },
  verify: function (p) { var m = model(p.a, p.b, p.c); return d2(m.M, m.I); }
});

/* ============ 2. Distance from vertex to incenter ============ */
CONFIGS.push({
  id: 'ai_len', tier: 1, topic: 'incenter',
  name: 'Incircle touch lengths (AI = r / sin(A/2))',
  lemma: 'The incircle touches AB and AC at distance s−a from A; hence AI² = (s−a)² + r² = bc(s−a)/s.',
  gen: function (R) { var t = randTri(R, 7, 20); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    return fr(b * c * (b + c - a), (a + b + c));
  },
  quantity: 'AI²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + ', and I is its incenter.';
  },
  hints: [
    'Let the incircle touch AB at F. The two tangent lengths from each vertex are equal — what is AF in terms of s?',
    'AF = s − a, and IF = r with ∠AFI = 90°.',
    'So AI² = (s−a)² + r², and r² = (s−a)(s−b)(s−c)/s. Simplify: s(s−a) + (s−b)(s−c) = bc.'
  ],
  solution: function (p) {
    var s2 = p.a + p.b + p.c;
    return '<p>Equal tangents give AF = s − a, where the incircle touches AB at F. Since IF ⟂ AB and IF = r,</p>' +
      '<p class="k">AI² = (s−a)² + r² = (s−a)² + (s−a)(s−b)(s−c)/s = (s−a)·[s(s−a) + (s−b)(s−c)]/s.</p>' +
      '<p>Expanding, s(s−a) + (s−b)(s−c) = bc, so</p>' +
      '<p class="k">AI² = bc(s−a)/s = bc(b+c−a)/(a+b+c)</p>' +
      '<p>Here that is ' + p.b + '·' + p.c + '·' + (p.b + p.c - p.a) + ' / ' + s2 + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), F = foot(m.I, m.A, m.B), g = [];
    g.push(CIR(m.I, m.r, { k: 'main' }));
    g = g.concat(TRI(m));
    g.push(S(m.A, m.I, { k: 'hi' }), S(m.I, F, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(m.I, 'I'), P(F, 'F'));
    return g;
  },
  verify: function (p) { var m = model(p.a, p.b, p.c); return d2(m.A, m.I); }
});

/* ============ 3. Euler's formula OI² = R² − 2Rr ============ */
CONFIGS.push({
  id: 'euler_oi', tier: 2, topic: 'incenter',
  name: "Euler's formula OI² = R² − 2Rr",
  lemma: 'For any triangle, OI² = R(R − 2r). (Proof: the power of I in the circumcircle is −AI·IM = −2Rr by Fact 5.)',
  gen: function (R) { var t = randTri(R, 8, 20); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c), T = bigT(p.a, p.b, p.c);
    return fsub(fr(a * a * b * b * c * c, T), fr(a * b * c, a + b + c));
  },
  quantity: 'OI²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. Let O be its circumcenter and I its incenter.';
  },
  hints: [
    'Compute the power of the point I with respect to the circumcircle in two ways.',
    'Power of I = OI² − R², and it also equals −AI·IM where AI extended meets the circle again at the arc midpoint M.',
    'By Fact 5, IM = MB = 2R sin(A/2), and AI = r/sin(A/2), so AI·IM = 2Rr. Hence OI² = R² − 2Rr, with R = abc/4K and r = K/s.'
  ],
  solution: function (p) {
    return '<p>Let line AI meet the circumcircle again at M. The power of I is OI² − R² = −AI·IM.</p>' +
      '<p>Now AI = r/sin(A/2), and by Fact 5 IM = MB = 2R·sin(A/2). Multiplying, AI·IM = 2Rr, which gives <b>Euler\'s formula</b>:</p>' +
      '<p class="k">OI² = R² − 2Rr</p>' +
      '<p>With R = abc/(4K) and r = K/s we get Rr = abc/(4s), so</p>' +
      '<p class="k">OI² = a²b²c²/(16K²) − abc/(2s) = a²b²c²/T − abc/(a+b+c),&nbsp; T = (a+b+c)(b+c−a)(c+a−b)(a+b−c)</p>' +
      '<p>Here T = ' + Tval(p.a, p.b, p.c) + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), g = [];
    g.push(CIR(m.O, m.R, { k: 'main' }), CIR(m.I, m.r, { k: 'main' }));
    g = g.concat(TRI(m));
    g.push(S(m.O, m.I, { k: 'hi' }), S(m.A, m.M, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(m.O, 'O'), P(m.I, 'I'), P(m.M, 'M'));
    return g;
  },
  verify: function (p) { var m = model(p.a, p.b, p.c); return d2(m.O, m.I); }
});

/* ============ 4. OH² = 9R² − (a²+b²+c²) ============ */
CONFIGS.push({
  id: 'euler_oh', tier: 3, topic: 'orthocenter',
  name: 'Euler line: OH² = 9R² − (a²+b²+c²)',
  lemma: 'With O as origin, H = A + B + C. Hence OH² = 9R² − (a²+b²+c²), and O, G, H are collinear with OG : GH = 1 : 2.',
  gen: function (R) { var t = randTri(R, 8, 20); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c), T = bigT(p.a, p.b, p.c);
    return fsub(fr(9n * a * a * b * b * c * c, T), fr(a * a + b * b + c * c, 1n));
  },
  quantity: 'OH²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. Let O be the circumcenter and H the orthocenter.';
  },
  hints: [
    'Put the circumcenter at the origin and write everything as vectors.',
    'Show that the point with position vector A + B + C is the orthocenter (check that (A+B+C) − A is perpendicular to B − C).',
    'Then OH² = |A+B+C|² = 3R² + 2(A·B + B·C + C·A), and 2A·B = 2R² − c² since |A−B|² = c².'
  ],
  solution: function (p) {
    return '<p>Place O at the origin, so |A| = |B| = |C| = R. Let X = A + B + C. Then X − A = B + C, and (B + C)·(B − C) = |B|² − |C|² = 0, so AX ⟂ BC. By symmetry X is the <b>orthocenter</b> H.</p>' +
      '<p>Therefore OH² = |A+B+C|² = 3R² + 2(A·B + B·C + C·A). From |A − B|² = c² we get 2A·B = 2R² − c², so</p>' +
      '<p class="k">OH² = 3R² + (2R² − c²) + (2R² − a²) + (2R² − b²) = 9R² − (a² + b² + c²)</p>' +
      '<p>With R² = a²b²c²/T, T = (a+b+c)(b+c−a)(c+a−b)(a+b−c) = ' + Tval(p.a, p.b, p.c) + ', and a²+b²+c² = ' + (p.a * p.a + p.b * p.b + p.c * p.c) + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), G = [(m.A[0] + m.B[0] + m.C[0]) / 3, (m.A[1] + m.B[1] + m.C[1]) / 3], g = [];
    g.push(CIR(m.O, m.R, { k: 'main' }));
    g = g.concat(TRI(m));
    g.push(S(m.O, m.H, { k: 'hi' }));
    g = g.concat(ABC(m));
    g.push(P(m.O, 'O'), P(m.H, 'H'), P(G, 'G'));
    return g;
  },
  verify: function (p) { var m = model(p.a, p.b, p.c); return d2(m.O, m.H); }
});

/* ============ 5. AH = 2R cos A / reflection of H ============ */
CONFIGS.push({
  id: 'orth_ah', tier: 2, topic: 'orthocenter',
  name: 'AH = 2·OM<sub>a</sub> = 2R cos A',
  lemma: 'The reflection of H over BC lies on the circumcircle, and the reflection over the midpoint of BC is the antipode of A. Consequently AH = 2R·cos A.',
  gen: function (R) {
    for (var k = 0; k < 500; k++) {
      var t = randTri(R, 8, 20);
      if (Math.abs(t.b * t.b + t.c * t.c - t.a * t.a) >= 12) return { a: t.a, b: t.b, c: t.c };
    }
    return { a: 14, b: 13, c: 15 };
  },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c), T = bigT(p.a, p.b, p.c);
    var e = b * b + c * c - a * a;
    return fr(a * a * e * e, T);
  },
  quantity: 'AH²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + ', and H is its orthocenter.';
  },
  hints: [
    'Let A\' be the antipode of A on the circumcircle. What can you say about BHCA\'?',
    'BHCA\' is a parallelogram (both pairs of sides are perpendicular to the same lines), so AH = 2·OM where M is the midpoint of BC.',
    'OM = R cos A, so AH = 2R cos A. Now cos A = (b²+c²−a²)/(2bc) and R = abc/4K.'
  ],
  solution: function (p) {
    return '<p>Let A\' be the antipode of A. Then BH ⟂ AC and A\'C ⟂ AC, so BH ∥ A\'C; likewise CH ∥ A\'B. So <b>BHCA\' is a parallelogram</b> and its diagonals bisect: the midpoint M of BC is the midpoint of HA\'.</p>' +
      '<p>Then OM is a midline of triangle AHA\', giving AH = 2·OM = 2R·cos A. Squaring with cos A = (b²+c²−a²)/(2bc) and R² = a²b²c²/T:</p>' +
      '<p class="k">AH² = 4R²cos²A = a²(b²+c²−a²)² / T,&nbsp; T = (a+b+c)(b+c−a)(c+a−b)(a+b−c)</p>' +
      '<p>Here b²+c²−a² = ' + (p.b * p.b + p.c * p.c - p.a * p.a) + ' and T = ' + Tval(p.a, p.b, p.c) + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), Ma = mid(m.B, m.C);
    var Ap = [2 * m.O[0] - m.A[0], 2 * m.O[1] - m.A[1]];
    var Hr = [m.H[0], -m.H[1]];
    var g = [CIR(m.O, m.R, { k: 'main' })];
    g = g.concat(TRI(m));
    g.push(S(m.A, m.H, { k: 'hi' }), S(m.H, Hr, { dash: 1 }), S(m.B, Ap, { dash: 1 }), S(m.C, Ap, { dash: 1 }), S(m.A, Ap, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(m.H, 'H'), P(m.O, 'O'), P(Ap, "A'"), P(Hr, 'H*'), P(Ma, 'M'));
    return g;
  },
  verify: function (p) { var m = model(p.a, p.b, p.c); return d2(m.A, m.H); }
});

/* ============ 6. Symmedian ============ */
CONFIGS.push({
  id: 'symmedian', tier: 2, topic: 'ratios',
  name: 'The symmedian divides BC in ratio c² : b²',
  lemma: 'The reflection of the median AM over the bisector of ∠A (the A-symmedian) meets BC at D with BD : DC = AB² : AC² = c² : b².',
  gen: function (R) { var t = randTri(R, 7, 19); if (t.b === t.c) t.b = t.b + 1; return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    var den = b * b + c * c;
    return fr(b * b * c * c * (2n * b * b + 2n * c * c - a * a), den * den);
  },
  quantity: 'AD²',
  statement: function (p) {
    return 'In triangle ABC, ' + sides(p) + '. The A-symmedian (the reflection of the median from A over the internal bisector of ∠A) meets BC at D.';
  },
  hints: [
    'If a cevian AD and the median AM are isogonal, compare the ratios in which they cut BC. Use the ratio lemma: BD/DC = (AB/AC)·(sin∠BAD / sin∠DAC).',
    'Isogonality swaps the two angles, so BD/DC equals (c/b)·(c/b) = c²/b².',
    'Now BD = ac²/(b²+c²), DC = ab²/(b²+c²), and finish with Stewart\'s theorem: AD² = (b²·BD + c²·DC)/a − BD·DC.'
  ],
  solution: function (p) {
    var b2c2 = p.b * p.b + p.c * p.c;
    return '<p>By the ratio lemma, BD/DC = (AB/AC)·(sin∠BAD/sin∠DAC). For the median, BM/MC = 1 gives sin∠BAM/sin∠MAC = b/c. The symmedian is isogonal to the median, so its two angles are swapped, giving sin∠BAD/sin∠DAC = c/b and</p>' +
      '<p class="k">BD : DC = c² : b²</p>' +
      '<p>So BD = ac²/(b²+c²) and DC = ab²/(b²+c²). Stewart\'s theorem AD² = (b²·BD + c²·DC)/a − BD·DC gives</p>' +
      '<p class="k">AD² = b²c²(2b² + 2c² − a²) / (b² + c²)²</p>' +
      '<p>Here b²+c² = ' + b2c2 + ' and 2b²+2c²−a² = ' + (2 * b2c2 - p.a * p.a) + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), Ma = mid(m.B, m.C);
    var D = lerp(m.B, m.C, (p.c * p.c) / (p.b * p.b + p.c * p.c));
    var g = TRI(m).slice();
    g.push(S(m.A, D, { k: 'hi' }), S(m.A, Ma, { dash: 1 }), S(m.A, m.I, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(D, 'D'), P(Ma, 'M'));
    return g;
  },
  verify: function (p) {
    var m = model(p.a, p.b, p.c);
    var D = lerp(m.B, m.C, (p.c * p.c) / (p.b * p.b + p.c * p.c));
    return d2(m.A, D);
  }
});

/* ============ 7. Tangents at B and C meet on the symmedian ============ */
CONFIGS.push({
  id: 'tangent_pole', tier: 3, topic: 'circles',
  name: 'The pole of BC: tangents at B, C meet on the A-symmedian',
  lemma: 'If the tangents to the circumcircle at B and C meet at T, then AT is the A-symmedian, and TB = TC = R·tan A.',
  gen: function (R) {
    for (var k = 0; k < 800; k++) {
      var t = randTri(R, 7, 18);
      var e = t.b * t.b + t.c * t.c - t.a * t.a;
      if (Math.abs(e) >= 0.5 * t.b * t.c && t.b !== t.c) return { a: t.a, b: t.b, c: t.c };
    }
    return { a: 9, b: 10, c: 17 };
  },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    var e = b * b + c * c - a * a;
    return fr(a * a * b * b * c * c, e * e);
  },
  quantity: 'TB²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. The tangents to the circumcircle of ABC at B and at C meet at T.';
  },
  hints: [
    'T is equidistant from B and C (equal tangents), so T lies on the perpendicular bisector of BC, through O.',
    'In right triangle OBT, ∠BOT = half of the central angle ∠BOC = A. So TB = R·tan A.',
    'tan²A = sin²A/cos²A with sin A = a/2R and cos A = (b²+c²−a²)/(2bc): the R\'s cancel nicely.'
  ],
  solution: function (p) {
    var e = p.b * p.b + p.c * p.c - p.a * p.a;
    return '<p>TB = TC by equal tangents, so T is on line OM<sub>a</sub> (M<sub>a</sub> the midpoint of BC). Since OB ⟂ TB, triangle OBT is right-angled at B, and ∠BOT = ½∠BOC = A. Hence</p>' +
      '<p class="k">TB = R·tan A</p>' +
      '<p>Now sin A = a/(2R) and cos A = (b²+c²−a²)/(2bc), so TB² = R²·sin²A/cos²A = R²·(a²/4R²)·(4b²c²)/(b²+c²−a²)²:</p>' +
      '<p class="k">TB² = a²b²c² / (b² + c² − a²)²</p>' +
      '<p>Here b²+c²−a² = ' + e + ', so TB² = (' + p.a + '·' + p.b + '·' + p.c + ')² / ' + e + '².</p>' +
      '<p><em>The same point T is the pole of BC, and AT is the A-symmedian — worth remembering.</em></p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), Ma = mid(m.B, m.C);
    var dvec = [Ma[0] - m.O[0], Ma[1] - m.O[1]], dl = Math.hypot(dvec[0], dvec[1]);
    var T = [m.O[0] + dvec[0] / dl * (m.R * m.R / dl), m.O[1] + dvec[1] / dl * (m.R * m.R / dl)];
    var g = [CIR(m.O, m.R, { k: 'main' })];
    g = g.concat(TRI(m));
    g.push(S(T, m.B, { k: 'hi' }), S(T, m.C, { k: 'hi' }), S(m.A, T, { dash: 1 }), S(m.O, T, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(T, 'T'), P(m.O, 'O'));
    return g;
  },
  verify: function (p) {
    var m = model(p.a, p.b, p.c), Ma = mid(m.B, m.C);
    var dvec = [Ma[0] - m.O[0], Ma[1] - m.O[1]], dl = Math.hypot(dvec[0], dvec[1]);
    var T = [m.O[0] + dvec[0] / dl * (m.R * m.R / dl), m.O[1] + dvec[1] / dl * (m.R * m.R / dl)];
    return d2(T, m.B);
  }
});

/* ============ 8. Bisector meets circumcircle: power of a point ============ */
CONFIGS.push({
  id: 'bisector_chord', tier: 2, topic: 'circles',
  name: 'Bisector chord + power of a point',
  lemma: 'The internal bisector from A meets BC at D and the circumcircle again at the arc midpoint M; then DB·DC = DA·DM and AD·AM = bc.',
  gen: function (R) { var t = randTri(R, 8, 20); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    return fr(a * a * a * a * b * c, (b + c) * (b + c) * (b + c - a) * (a + b + c));
  },
  quantity: 'DM²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. The internal bisector of ∠A meets BC at D and meets the circumcircle again at M.';
  },
  hints: [
    'First get BD and DC from the angle bisector theorem, then DB·DC by the power of the point D.',
    'DB·DC = DA·DM, so DM = DB·DC / AD. You still need AD.',
    'The bisector length satisfies AD² = bc − BD·DC = bc[1 − a²/(b+c)²].'
  ],
  solution: function (p) {
    return '<p>By the bisector theorem BD = ac/(b+c) and DC = ab/(b+c), so DB·DC = a²bc/(b+c)².</p>' +
      '<p>Triangles ABD and AMC are similar (∠BAD = ∠MAC and ∠ABD = ∠AMC), giving AD·AM = bc; subtracting AD² from both sides of AD·AM = AD² + AD·DM yields the standard bisector length</p>' +
      '<p class="k">AD² = bc − DB·DC = bc[(b+c)² − a²]/(b+c)²</p>' +
      '<p>The power of D gives DB·DC = DA·DM, hence DM = DB·DC/AD and</p>' +
      '<p class="k">DM² = (DB·DC)²/AD² = a⁴bc / [(b+c)²(b+c−a)(a+b+c)]</p>' +
      '<p>Here b+c = ' + (p.b + p.c) + ', b+c−a = ' + (p.b + p.c - p.a) + ', a+b+c = ' + (p.a + p.b + p.c) + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c);
    var D = lerp(m.B, m.C, p.c / (p.b + p.c));
    var g = [CIR(m.O, m.R, { k: 'main' })];
    g = g.concat(TRI(m));
    g.push(S(m.A, m.M, { dash: 1 }), S(D, m.M, { k: 'hi' }), S(m.M, m.B), S(m.M, m.C));
    g = g.concat(ABC(m));
    g.push(P(D, 'D'), P(m.M, 'M'));
    return g;
  },
  verify: function (p) {
    var m = model(p.a, p.b, p.c);
    var D = lerp(m.B, m.C, p.c / (p.b + p.c));
    return d2(D, m.M);
  }
});

/* ============ 9. Ptolemy / cyclic quadrilateral diagonal ============ */
CONFIGS.push({
  id: 'ptolemy', tier: 2, topic: 'circles',
  name: 'Ptolemy + the cyclic-quadrilateral diagonal formula',
  lemma: 'For cyclic ABCD with AB=p, BC=q, CD=r, DA=t: AC·BD = pr + qt (Ptolemy) and AC/BD = (pt+qr)/(pq+rt).',
  gen: function (R) {
    for (var k = 0; k < 3000; k++) {
      var p1 = ri(R, 5, 15), q = ri(R, 5, 15), r = ri(R, 5, 15), t = ri(R, 5, 15);
      var mx = Math.max(p1, q, r, t), sum = p1 + q + r + t;
      if (sum - mx <= mx + 2) continue;
      if (!quadOK(p1, q, r, t)) continue;
      return { p: p1, q: q, r: r, t: t };
    }
    return { p: 7, q: 8, r: 9, t: 10 };
  },
  value: function (pp) {
    var p = BigInt(pp.p), q = BigInt(pp.q), r = BigInt(pp.r), t = BigInt(pp.t);
    return fr((p * r + q * t) * (p * t + q * r), p * q + r * t);
  },
  quantity: 'AC²',
  statement: function (pp) {
    return 'Cyclic quadrilateral ABCD (in this order on its circle) has AB = ' + pp.p + ', BC = ' + pp.q + ', CD = ' + pp.r + ', DA = ' + pp.t + '.';
  },
  hints: [
    'Ptolemy gives AC·BD = AB·CD + BC·DA. One equation, two unknowns — you need a second relation between AC and BD.',
    'Get AC/BD by comparing areas or by the law of cosines: opposite angles of a cyclic quadrilateral are supplementary, so their cosines are negatives.',
    'AC/BD = (AB·AD + CB·CD)/(BA·BC + DA·DC). Multiply the two relations together to isolate AC².'
  ],
  solution: function (pp) {
    return '<p>Write p = AB, q = BC, r = CD, t = DA. Applying the law of cosines to triangles ABC and ADC (∠B + ∠D = 180°, so cos D = −cos B) and eliminating cos B:</p>' +
      '<p class="k">AC² = (pr + qt)(pt + qr)/(pq + rt)</p>' +
      '<p>Symmetrically BD² = (pr+qt)(pq+rt)/(pt+qr), and multiplying the two recovers <b>Ptolemy</b>: AC·BD = pr + qt.</p>' +
      '<p>Here pr+qt = ' + (pp.p * pp.r + pp.q * pp.t) + ', pt+qr = ' + (pp.p * pp.t + pp.q * pp.r) + ', pq+rt = ' + (pp.p * pp.q + pp.r * pp.t) + '.</p>';
  },
  figure: function (pp) {
    var Q = quadPts(pp.p, pp.q, pp.r, pp.t);
    var g = [CIR(Q.O, Q.R, { k: 'main' })];
    g.push(S(Q.A, Q.B, { k: 'main' }), S(Q.B, Q.C, { k: 'main' }), S(Q.C, Q.D, { k: 'main' }), S(Q.D, Q.A, { k: 'main' }));
    g.push(S(Q.A, Q.C, { k: 'hi' }), S(Q.B, Q.D, { dash: 1 }));
    g.push(P(Q.A, 'A'), P(Q.B, 'B'), P(Q.C, 'C'), P(Q.D, 'D'));
    return g;
  },
  verify: function (pp) { var Q = quadPts(pp.p, pp.q, pp.r, pp.t); return d2(Q.A, Q.C); }
});
/* ---------- cyclic quadrilateral construction (numeric, for figures + checking) ---------- */
function quadSum(R, s) {
  var tot = 0;
  for (var i = 0; i < 4; i++) { var x = s[i] / (2 * R); if (x > 1) return Infinity; tot += 2 * Math.asin(x); }
  return tot;
}
function quadR(p, q, r, t) {
  var s = [p, q, r, t], lo = Math.max(p, q, r, t) / 2 + 1e-9, hi = 1e7;
  if (quadSum(lo, s) < 2 * Math.PI) return null;      /* centre would fall outside: reject */
  for (var i = 0; i < 300; i++) {
    var mid2 = (lo + hi) / 2, v = quadSum(mid2, s);
    if (v > 2 * Math.PI) lo = mid2; else hi = mid2;
  }
  return (lo + hi) / 2;
}
function quadOK(p, q, r, t) {
  var R = quadR(p, q, r, t);
  if (!R || !isFinite(R) || R > 400) return false;
  return true;
}
function quadPts(p, q, r, t) {
  var R = quadR(p, q, r, t), s = [p, q, r, t], th = 0.6, pts = [];
  for (var i = 0; i < 4; i++) {
    pts.push([R * Math.cos(th), R * Math.sin(th)]);
    th += 2 * Math.asin(s[i] / (2 * R));
  }
  return { O: [0, 0], R: R, A: pts[0], B: pts[1], C: pts[2], D: pts[3] };
}

/* ============ 10. Miquel point / PQ² = pow(P) + pow(Q) ============ */
CONFIGS.push({
  id: 'miquel_pq', tier: 3, topic: 'circles',
  name: 'Radical axes: PQ² = pow(P) + pow(Q)',
  lemma: 'If the opposite sides of a cyclic quadrilateral meet at P and Q, then PQ² = pow(P) + pow(Q); equivalently the circle with diameter PQ is orthogonal to the original circle.',
  gen: function (R) {
    for (var k = 0; k < 6000; k++) {
      var p = ri(R, 5, 13), q = ri(R, 5, 12), r = ri(R, 7, 15), t = ri(R, 7, 15);
      if (t <= q + 1 || r <= p + 1) continue;
      var mx = Math.max(p, q, r, t);
      if (p + q + r + t - mx <= mx + 2) continue;
      if (!quadOK(p, q, r, t)) continue;
      var Q = quadPts(p, q, r, t);
      var PP = meet(Q.A, Q.B, Q.C, Q.D), QQ = meet(Q.A, Q.D, Q.B, Q.C);
      if (!isFinite(PP[0]) || !isFinite(QQ[0])) continue;
      if (dist(PP, Q.O) > 4 * Q.R || dist(QQ, Q.O) > 4 * Q.R) continue;
      return { p: p, q: q, r: r, t: t };
    }
    return { p: 5, q: 6, r: 9, t: 10 };
  },
  value: function (pp) {
    var p = BigInt(pp.p), q = BigInt(pp.q), r = BigInt(pp.r), t = BigInt(pp.t);
    var PB = fr(q * (p * q + r * t), t * t - q * q);
    var powP = fmul(PB, fadd(PB, fr(p, 1n)));
    var QA = fr(p * (p * t + q * r), r * r - p * p);
    var powQ = fmul(QA, fadd(QA, fr(t, 1n)));
    return fadd(powP, powQ);
  },
  quantity: 'PQ²',
  statement: function (pp) {
    return 'Cyclic quadrilateral ABCD has AB = ' + pp.p + ', BC = ' + pp.q + ', CD = ' + pp.r + ', DA = ' + pp.t + '. Rays AB and DC meet at P, and rays AD and BC meet at Q.';
  },
  hints: [
    'Both P and Q lie outside the circle ω. Write pow(P) = PB·PA and pow(Q) = QA·QD, and find those lengths from similar triangles.',
    'Triangles PBC and PDA are similar (ratio BC : DA), and triangles QAB and QCD are similar (ratio AB : CD). Each gives a small linear system.',
    'For the last step use the famous identity PQ² = pow(P) + pow(Q), which follows since the circle with diameter PQ is orthogonal to ω.'
  ],
  solution: function (pp) {
    var p = pp.p, q = pp.q, r = pp.r, t = pp.t;
    var PB = q * (p * q + r * t) / (t * t - q * q), QA = p * (p * t + q * r) / (r * r - p * p);
    return '<p><b>The lemma.</b> Let ω be the circle. The circle with diameter PQ is orthogonal to ω, so if N is the midpoint of PQ then NP² = pow(N). Expanding pow along the line gives the clean identity</p>' +
      '<p class="k">PQ² = pow(P) + pow(Q)</p>' +
      '<p><b>The lengths.</b> Since ABCD is cyclic, ∠PBC = ∠PDA, so △PBC ∼ △PDA with ratio q : t. Writing PB = x, PC = y and PA = x + p, PD = y + r gives x/(y+r) = y/(x+p) = q/t, hence</p>' +
      '<p class="k">PB = q(pq + rt)/(t² − q²) = ' + PB.toFixed(4) + ',&nbsp; pow(P) = PB·(PB + p)</p>' +
      '<p>Similarly △QAB ∼ △QCD with ratio p : r, so</p>' +
      '<p class="k">QA = p(pt + qr)/(r² − p²) = ' + QA.toFixed(4) + ',&nbsp; pow(Q) = QA·(QA + t)</p>' +
      '<p>Add the two powers.</p>';
  },
  figure: function (pp) {
    var Q = quadPts(pp.p, pp.q, pp.r, pp.t);
    var PP = meet(Q.A, Q.B, Q.C, Q.D), QQ = meet(Q.A, Q.D, Q.B, Q.C);
    var g = [CIR(Q.O, Q.R, { k: 'main' })];
    g.push(S(Q.A, Q.B, { k: 'main' }), S(Q.B, Q.C, { k: 'main' }), S(Q.C, Q.D, { k: 'main' }), S(Q.D, Q.A, { k: 'main' }));
    g.push(S(Q.B, PP, { dash: 1 }), S(Q.C, PP, { dash: 1 }), S(Q.D, QQ, { dash: 1 }), S(Q.C, QQ, { dash: 1 }));
    g.push(S(PP, QQ, { k: 'hi' }));
    g.push(P(Q.A, 'A'), P(Q.B, 'B'), P(Q.C, 'C'), P(Q.D, 'D'), P(PP, 'P'), P(QQ, 'Q'));
    return g;
  },
  verify: function (pp) {
    var Q = quadPts(pp.p, pp.q, pp.r, pp.t);
    var PP = meet(Q.A, Q.B, Q.C, Q.D), QQ = meet(Q.A, Q.D, Q.B, Q.C);
    return d2(PP, QQ);
  }
});

/* ============ 11. Feuerbach: NI = R/2 − r ============ */
CONFIGS.push({
  id: 'feuerbach', tier: 3, topic: 'incenter',
  name: "Feuerbach's theorem (NI = R/2 − r)",
  lemma: 'The nine-point circle is internally tangent to the incircle, so the distance from the nine-point centre N to the incenter I equals R/2 − r.',
  gen: function (R) { var t = randTri(R, 8, 19); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c), T = bigT(p.a, p.b, p.c), s2 = a + b + c;
    var R2 = fr(a * a * b * b * c * c, T);          /* R^2 */
    var Rr = fr(a * b * c, 2n * s2);                /* R*r */
    var r2 = fr(T, 4n * s2 * s2);                   /* r^2 */
    return fadd(fsub(fdiv(R2, fr(4n)), Rr), r2);
  },
  quantity: 'NI²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. Let I be the incenter and let N be the center of the nine-point circle.';
  },
  hints: [
    'What is the radius of the nine-point circle, and what does tangency of two circles say about the distance between their centers?',
    'Feuerbach: the nine-point circle (radius R/2) is internally tangent to the incircle (radius r), so NI = R/2 − r.',
    'Now just compute R = abc/4K and r = K/s.'
  ],
  solution: function (p) {
    return '<p>The nine-point circle has radius R/2 and, by <b>Feuerbach\'s theorem</b>, is internally tangent to the incircle. For internal tangency the distance between centres is the difference of radii:</p>' +
      '<p class="k">NI = R/2 − r &nbsp;⟹&nbsp; NI² = R²/4 − Rr + r²</p>' +
      '<p>With R² = a²b²c²/T, Rr = abc/(2(a+b+c)) and r² = T/(4(a+b+c)²), where T = (a+b+c)(b+c−a)(c+a−b)(a+b−c) = ' + Tval(p.a, p.b, p.c) + ':</p>' +
      '<p class="k">NI² = a²b²c²/(4T) − abc/(2(a+b+c)) + T/(4(a+b+c)²)</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c), g = [];
    g.push(CIR(m.O, m.R, { dash: 1 }), CIR(m.N, m.R / 2, { k: 'main' }), CIR(m.I, m.r, { k: 'main' }));
    g = g.concat(TRI(m));
    g.push(S(m.N, m.I, { k: 'hi' }));
    g = g.concat(ABC(m));
    g.push(P(m.N, 'N'), P(m.I, 'I'));
    return g;
  },
  verify: function (p) { var m = model(p.a, p.b, p.c); return d2(m.N, m.I); }
});

/* ============ 12. Mixtilinear incircle radius ============ */
CONFIGS.push({
  id: 'mixtilinear', tier: 3, topic: 'circles',
  name: 'A-mixtilinear incircle: ρ = r·sec²(A/2)',
  lemma: 'The A-mixtilinear incircle — tangent to AB and AC and internally tangent to the circumcircle — has its centre on AI and radius ρ<sub>A</sub> = r / cos²(A/2). If it touches AB at X and AC at Y, the incenter I is the midpoint of XY.',
  gen: function (R) { var t = randTri(R, 8, 19); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    return fr(4n * b * b * c * c * (c + a - b) * (a + b - c), (b + c - a) * (a + b + c) * (a + b + c) * (a + b + c));
  },
  quantity: 'ρ²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. Circle ω is tangent to rays AB and AC and is internally tangent to the circumcircle of ABC; let ρ be its radius.';
  },
  hints: [
    'The centre of ω lies on the bisector AI, and the incircle is the other circle tangent to both rays — so the two are homothetic from A.',
    'A key fact: the incenter I is the midpoint of the chord ω cuts... more useful here — ω passes through I? No: the homothety at the tangency point T maps ω to the circumcircle and I to the arc midpoint M, and it forces ρ = r/cos²(A/2).',
    'Use cos²(A/2) = s(s−a)/(bc) and r = K/s.'
  ],
  solution: function (p) {
    return '<p>Let ω touch AB at X and the circumcircle at T. The homothety at T carrying ω to the circumcircle sends X to the midpoint of arc AB, and one shows the incenter I is the midpoint of XY (Y the touch point on AC) — the classical mixtilinear lemma.</p>' +
      '<p>Since AI bisects ∠A and AX = ρ/tan(A/2)... combining AI = r/sin(A/2) with AO<sub>ω</sub> = ρ/sin(A/2) and AI = AO<sub>ω</sub>·cos... the standard result is</p>' +
      '<p class="k">ρ = r · sec²(A/2) = r·bc / (s(s−a))</p>' +
      '<p>Squaring with r² = (s−a)(s−b)(s−c)/s gives ρ² = b²c²(s−b)(s−c)/(s³(s−a)), i.e.</p>' +
      '<p class="k">ρ² = 4b²c²(c+a−b)(a+b−c) / [(b+c−a)(a+b+c)³]</p>' +
      '<p>Here (c+a−b) = ' + (p.c + p.a - p.b) + ', (a+b−c) = ' + (p.a + p.b - p.c) + ', (b+c−a) = ' + (p.b + p.c - p.a) + ', (a+b+c) = ' + (p.a + p.b + p.c) + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c);
    var rho = Math.sqrt(4 * p.b * p.b * p.c * p.c * (p.c + p.a - p.b) * (p.a + p.b - p.c) / ((p.b + p.c - p.a) * Math.pow(p.a + p.b + p.c, 3)));
    var A2 = angles(p.a, p.b, p.c)[0] / 2;
    var u = [(m.I[0] - m.A[0]), (m.I[1] - m.A[1])], ul = Math.hypot(u[0], u[1]);
    u = [u[0] / ul, u[1] / ul];
    var dd = rho / Math.sin(A2);
    var W = [m.A[0] + u[0] * dd, m.A[1] + u[1] * dd];
    var dv = [W[0] - m.O[0], W[1] - m.O[1]], dl = Math.hypot(dv[0], dv[1]);
    var Tp = [m.O[0] + dv[0] / dl * m.R, m.O[1] + dv[1] / dl * m.R];
    var g = [CIR(m.O, m.R, { k: 'main' }), CIR(W, rho, { k: 'hi' }), CIR(m.I, m.r, { dash: 1 })];
    g = g.concat(TRI(m));
    g.push(S(m.A, W, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(m.I, 'I'), P(Tp, 'T'));
    return g;
  },
  verify: function (p) {
    /* independent: solve for d on AI with radius d·sin(A/2) internally tangent to circumcircle */
    var m = model(p.a, p.b, p.c), A2 = angles(p.a, p.b, p.c)[0] / 2;
    var u = [(m.I[0] - m.A[0]), (m.I[1] - m.A[1])], ul = Math.hypot(u[0], u[1]);
    u = [u[0] / ul, u[1] / ul];
    var f = function (d) {
      var W = [m.A[0] + u[0] * d, m.A[1] + u[1] * d];
      return dist(m.O, W) - (m.R - d * Math.sin(A2));
    };
    var lo = 1e-9, hi = 3 * m.R;
    for (var i = 0; i < 300; i++) { var md = (lo + hi) / 2; if (f(md) < 0) lo = md; else hi = md; }
    var d = (lo + hi) / 2, rho = d * Math.sin(A2);
    return rho * rho;
  }
});

/* ============ 13. Excenter distance ============ */
CONFIGS.push({
  id: 'excenter', tier: 2, topic: 'incenter',
  name: 'The A-excircle and AI<sub>A</sub> = s / cos(A/2)',
  lemma: 'The A-excircle touches line AB at distance s from A, has radius r<sub>A</sub> = K/(s−a), and AI<sub>A</sub>² = s·bc/(s−a).',
  gen: function (R) { var t = randTri(R, 8, 20); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    return fr(b * c * (a + b + c), (b + c - a));
  },
  quantity: 'AI<sub>A</sub>²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. Let I<sub>A</sub> be the center of the excircle opposite A (tangent to side BC and to the extensions of AB and AC).';
  },
  hints: [
    'The A-excircle touches ray AB at a point X. Equal tangents give AX = s — prove that first.',
    'Then AI<sub>A</sub> = AX / cos(A/2) = s / cos(A/2), since ∠XAI<sub>A</sub> = A/2 and ∠AXI<sub>A</sub> = 90°.',
    'Finish with cos²(A/2) = s(s−a)/(bc).'
  ],
  solution: function (p) {
    return '<p>Let the A-excircle touch ray AB at X and ray AC at Y. Then AX = AY, and AX = AB + BX = c + (s−c) = s (the tangent lengths from B are s−c).</p>' +
      '<p>Since I<sub>A</sub>X ⟂ AB and AI<sub>A</sub> bisects ∠A, AI<sub>A</sub> = AX/cos(A/2) = s/cos(A/2). With cos²(A/2) = s(s−a)/bc:</p>' +
      '<p class="k">AI<sub>A</sub>² = s²·bc/(s(s−a)) = s·bc/(s−a) = bc(a+b+c)/(b+c−a)</p>' +
      '<p>Here a+b+c = ' + (p.a + p.b + p.c) + ' and b+c−a = ' + (p.b + p.c - p.a) + '.</p>' +
      '<p><em>Compare with AI² = bc(s−a)/s — the two differ by swapping s and s−a.</em></p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c);
    var rA = m.K / (m.s - p.a);
    var g = [CIR(m.IA, rA, { k: 'main' }), CIR(m.I, m.r, { dash: 1 })];
    g = g.concat(TRI(m));
    var X = foot(m.IA, m.A, m.B), Y = foot(m.IA, m.A, m.C);
    g.push(S(m.A, X, { dash: 1 }), S(m.A, Y, { dash: 1 }), S(m.A, m.IA, { k: 'hi' }));
    g = g.concat(ABC(m));
    g.push(P(m.IA, 'I_A'), P(X, 'X'));
    return g;
  },
  verify: function (p) { var m = model(p.a, p.b, p.c); return d2(m.A, m.IA); }
});

/* ============ 14. Mass points / two cevians ============ */
CONFIGS.push({
  id: 'cevian_ratio', tier: 1, topic: 'ratios',
  name: 'Mass points: the ratio in which two cevians cut each other',
  lemma: 'If BD : DC = m₁ : n₁ and CE : EA = m₂ : n₂, then AD ∩ BE = P satisfies AP : PD = n₂(m₁+n₁) : m₁m₂.',
  gen: function (R) {
    var v = function () { return ri(R, 1, 6); };
    for (var k = 0; k < 500; k++) {
      var m1 = v(), n1 = v(), m2 = v(), n2 = v();
      if (m1 === n1 && m2 === n2) continue;
      var num1 = n2 * (m1 + n1), den1 = m1 * m2;
      if (num1 % den1 === 0 && num1 / den1 <= 3) continue;
      return { m1: m1, n1: n1, m2: m2, n2: n2 };
    }
    return { m1: 3, n1: 2, m2: 4, n2: 3 };
  },
  value: function (p) {
    return fr(BigInt(p.n2) * BigInt(p.m1 + p.n1), BigInt(p.m1) * BigInt(p.m2));
  },
  quantity: 'AP / PD',
  statement: function (p) {
    return 'In triangle ABC, point D lies on segment BC with BD : DC = ' + p.m1 + ' : ' + p.n1 + ', and point E lies on segment CA with CE : EA = ' + p.m2 + ' : ' + p.n2 + '. Segments AD and BE meet at P.';
  },
  hints: [
    'Mass points: put masses at B and C so that D balances, then a mass at A so that E balances.',
    'Masses: B gets n₁·(something) and C gets m₁·(something); on CA you need mass(C)·CE = mass(A)·EA.',
    'Once the three masses are fixed, AP : PD = mass(D) : mass(A) = (mass B + mass C) : mass A.'
  ],
  solution: function (p) {
    var m1 = p.m1, n1 = p.n1, m2 = p.m2, n2 = p.n2;
    return '<p>Use barycentric (or mass-point) coordinates with A = (1,0,0), B = (0,1,0), C = (0,0,1).</p>' +
      '<p>D on BC with BD : DC = ' + m1 + ' : ' + n1 + ' is D = (0, ' + n1 + ', ' + m1 + '), and E on CA with CE : EA = ' + m2 + ' : ' + n2 + ' is E = (' + m2 + ', 0, ' + n2 + ').</p>' +
      '<p>A point of line AD has the form (t, ' + n1 + ', ' + m1 + '); a point of line BE has the form (' + m2 + ', u, ' + n2 + '). Matching up to scale gives</p>' +
      '<p class="k">P = (m₁m₂ : n₁n₂ : m₁n₂) = (' + (m1 * m2) + ' : ' + (n1 * n2) + ' : ' + (m1 * n2) + ')</p>' +
      '<p>In normalized barycentrics the A-coordinate of P is the "weight of A", and AP : PD = (sum of the other two) : (A-coordinate):</p>' +
      '<p class="k">AP : PD = n₂(m₁+n₁) : m₁m₂ = ' + (n2 * (m1 + n1)) + ' : ' + (m1 * m2) + '</p>';
  },
  figure: function (p) {
    var m = model(14, 13, 15);
    var D = lerp(m.B, m.C, p.m1 / (p.m1 + p.n1));
    var E = lerp(m.C, m.A, p.m2 / (p.m2 + p.n2));
    var PP = meet(m.A, D, m.B, E);
    var g = TRI(m).slice();
    g.push(S(m.A, D, { k: 'hi' }), S(m.B, E, { k: 'hi' }));
    g = g.concat(ABC(m));
    g.push(P(D, 'D'), P(E, 'E'), P(PP, 'P'));
    return g;
  },
  verify: function (p) {
    var m = model(14, 13, 15);
    var D = lerp(m.B, m.C, p.m1 / (p.m1 + p.n1));
    var E = lerp(m.C, m.A, p.m2 / (p.m2 + p.n2));
    var PP = meet(m.A, D, m.B, E);
    return dist(m.A, PP) / dist(PP, D);
  }
});

/* ============ 15. Orthic triangle side ============ */
CONFIGS.push({
  id: 'orthic', tier: 2, topic: 'orthocenter',
  name: 'Orthic triangle: EF = a·cos A',
  lemma: 'If E, F are the feet of the altitudes from B and C, then AEHF is cyclic with diameter AH, triangle AEF ∼ triangle ABC with ratio cos A, and EF = a·cos A.',
  gen: function (R) {
    for (var k = 0; k < 900; k++) {
      var t = randTri(R, 8, 20);
      var A = angles(t.a, t.b, t.c);
      if (Math.max(A[0], A[1], A[2]) < 85 * Math.PI / 180 && Math.abs(t.b * t.b + t.c * t.c - t.a * t.a) >= 10) return { a: t.a, b: t.b, c: t.c };
    }
    return { a: 13, b: 14, c: 15 };
  },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    var e = b * b + c * c - a * a;
    return fr(a * a * e * e, 4n * b * b * c * c);
  },
  quantity: 'EF²',
  statement: function (p) {
    return 'Acute triangle ABC has ' + sides(p) + '. The altitudes from B and from C have feet E (on CA) and F (on AB).';
  },
  hints: [
    'BE ⟂ AC and CF ⟂ AB mean ∠BEC = ∠BFC = 90°, so BCEF is cyclic — what circle?',
    'BCEF is cyclic with diameter BC, so ∠AEF = ∠ABC: triangles AEF and ABC are similar.',
    'The ratio of similarity is AE/AB = cos A, so EF = a·cos A.'
  ],
  solution: function (p) {
    var e = p.b * p.b + p.c * p.c - p.a * p.a;
    return '<p>Since ∠BEC = ∠BFC = 90°, the points B, C, E, F lie on the circle with diameter BC. Hence ∠AEF = 180° − ∠FEC = ∠ABC, so</p>' +
      '<p class="k">△AEF ∼ △ABC with ratio AE/AB = (b·cos A)/c · (c/b) = cos A</p>' +
      '<p>(directly: AE = c·cos A and AF = b·cos A, so AE/AC = AF/AB = cos A). Therefore EF = a·cos A and</p>' +
      '<p class="k">EF² = a²cos²A = a²(b²+c²−a²)²/(4b²c²)</p>' +
      '<p>Here b²+c²−a² = ' + e + ' and 4b²c² = ' + (4 * p.b * p.b * p.c * p.c) + '.</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c);
    var E = foot(m.B, m.C, m.A), F = foot(m.C, m.A, m.B), D = foot(m.A, m.B, m.C);
    var g = [CIR(mid(m.B, m.C), p.a / 2, { dash: 1 })];
    g = g.concat(TRI(m));
    g.push(S(m.B, E, { dash: 1 }), S(m.C, F, { dash: 1 }), S(m.A, D, { dash: 1 }), S(E, F, { k: 'hi' }));
    g = g.concat(ABC(m));
    g.push(P(E, 'E'), P(F, 'F'), P(m.H, 'H'));
    return g;
  },
  verify: function (p) {
    var m = model(p.a, p.b, p.c);
    var E = foot(m.B, m.C, m.A), F = foot(m.C, m.A, m.B);
    return d2(E, F);
  }
});

/* ============ 16. Median length ============ */
CONFIGS.push({
  id: 'median', tier: 1, topic: 'ratios',
  name: 'Median length / Apollonius',
  lemma: 'For the median to BC: 4m_a² = 2b² + 2c² − a². The centroid divides it 2 : 1.',
  gen: function (R) { var t = randTri(R, 7, 22); return { a: t.a, b: t.b, c: t.c }; },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    return fr(4n * (2n * b * b + 2n * c * c - a * a), 36n);   /* AG^2 = (2/3 m_a)^2 */
  },
  quantity: 'AG²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + ', and G is its centroid.';
  },
  hints: [
    'Let M be the midpoint of BC. Apply Stewart\'s theorem (or the law of cosines twice) to get AM².',
    'Apollonius: AB² + AC² = 2AM² + 2BM², i.e. 4AM² = 2b² + 2c² − a².',
    'The centroid cuts the median 2 : 1 from the vertex, so AG = (2/3)AM.'
  ],
  solution: function (p) {
    return '<p>With M the midpoint of BC, Apollonius\' theorem (the law of cosines at B and at C, added) gives</p>' +
      '<p class="k">4·AM² = 2b² + 2c² − a² = ' + (2 * p.b * p.b + 2 * p.c * p.c - p.a * p.a) + '</p>' +
      '<p>The centroid divides each median in ratio 2 : 1 from the vertex, so AG = (2/3)AM and</p>' +
      '<p class="k">AG² = (4/9)·AM² = (2b² + 2c² − a²)/9</p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c);
    var Ma = mid(m.B, m.C), Mb = mid(m.C, m.A), Mc = mid(m.A, m.B);
    var G = [(m.A[0] + m.B[0] + m.C[0]) / 3, (m.A[1] + m.B[1] + m.C[1]) / 3];
    var g = TRI(m).slice();
    g.push(S(m.A, Ma, { k: 'hi' }), S(m.B, Mb, { dash: 1 }), S(m.C, Mc, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(G, 'G'), P(Ma, 'M'));
    return g;
  },
  verify: function (p) {
    var m = model(p.a, p.b, p.c);
    var G = [(m.A[0] + m.B[0] + m.C[0]) / 3, (m.A[1] + m.B[1] + m.C[1]) / 3];
    return d2(m.A, G);
  }
});

/* ============ 17. Radical axis / common chord ============ */
CONFIGS.push({
  id: 'radaxis', tier: 1, topic: 'circles',
  name: 'Radical axis and the common chord',
  lemma: 'The radical axis of two intersecting circles is their common chord; it is perpendicular to the line of centers at distance (d²+r₁²−r₂²)/(2d) from O₁.',
  gen: function (R) {
    for (var k = 0; k < 900; k++) {
      var r1 = ri(R, 5, 17), r2 = ri(R, 5, 17), d = ri(R, 4, 24);
      if (d <= Math.abs(r1 - r2) + 1) continue;
      if (d >= r1 + r2 - 1) continue;
      return { r1: r1, r2: r2, d: d };
    }
    return { r1: 10, r2: 13, d: 9 };
  },
  value: function (p) {
    var r1 = BigInt(p.r1), r2 = BigInt(p.r2), d = BigInt(p.d);
    var e = d * d + r1 * r1 - r2 * r2;
    return fsub(fr(4n * r1 * r1, 1n), fr(e * e, d * d));
  },
  quantity: 'XY²',
  statement: function (p) {
    return 'Circles ω₁ and ω₂ have radii ' + p.r1 + ' and ' + p.r2 + ', and their centers are ' + p.d + ' apart. They meet at two points X and Y.';
  },
  hints: [
    'XY is the radical axis, so it is perpendicular to O₁O₂; let it cross O₁O₂ at Z.',
    'Write O₁Z = x. Then r₁² − x² = ZX² = r₂² − (d−x)², which pins down x.',
    'x = (d² + r₁² − r₂²)/(2d), and XY = 2·√(r₁² − x²).'
  ],
  solution: function (p) {
    var e = p.d * p.d + p.r1 * p.r1 - p.r2 * p.r2;
    return '<p>XY ⟂ O₁O₂; let them meet at Z with O₁Z = x. Then ZX² = r₁² − x² and also ZX² = r₂² − (d−x)². Setting these equal,</p>' +
      '<p class="k">x = (d² + r₁² − r₂²)/(2d) = ' + e + '/' + (2 * p.d) + '</p>' +
      '<p>(This x is exactly the statement that Z lies on the radical axis: equal powers.) Then</p>' +
      '<p class="k">XY² = 4(r₁² − x²) = 4r₁² − (d² + r₁² − r₂²)²/d²</p>';
  },
  figure: function (p) {
    var O1 = [0, 0], O2 = [p.d, 0];
    var x = (p.d * p.d + p.r1 * p.r1 - p.r2 * p.r2) / (2 * p.d);
    var h = Math.sqrt(Math.max(p.r1 * p.r1 - x * x, 0));
    var X = [x, h], Y = [x, -h];
    return [CIR(O1, p.r1, { k: 'main' }), CIR(O2, p.r2, { k: 'main' }),
      S(O1, O2, { dash: 1 }), S(X, Y, { k: 'hi' }),
      P(O1, 'O₁'), P(O2, 'O₂'), P(X, 'X'), P(Y, 'Y')];
  },
  verify: function (p) {
    var x = (p.d * p.d + p.r1 * p.r1 - p.r2 * p.r2) / (2 * p.d);
    var h = Math.sqrt(Math.max(p.r1 * p.r1 - x * x, 0));
    return 4 * h * h;
  }
});

/* ============ 18. Tangent at A meets BC: the harmonic point ============ */
CONFIGS.push({
  id: 'tangent_a', tier: 3, topic: 'circles',
  name: 'Tangent at A meets BC (harmonic conjugate)',
  lemma: 'If the tangent at A meets line BC at X, then XB : XC = c² : b², XA² = XB·XC, and (B, C; D, X) is harmonic where D is the foot of the A-bisector.',
  gen: function (R) {
    for (var k = 0; k < 900; k++) {
      var t = randTri(R, 7, 19);
      var e = Math.abs(t.b * t.b - t.c * t.c);
      if (e < 24) continue;
      var far = t.a * Math.max(t.b * t.b, t.c * t.c) / e;   /* distance from the far vertex to X */
      if (far > 2.0 * t.a) continue;
      return { a: t.a, b: t.b, c: t.c };
    }
    return { a: 14, b: 13, c: 15 };
  },
  value: function (p) {
    var a = BigInt(p.a), b = BigInt(p.b), c = BigInt(p.c);
    var e = b * b - c * c; if (e < 0n) e = -e;
    return fr(a * a * b * b * c * c, e * e);
  },
  quantity: 'XA²',
  statement: function (p) {
    return 'Triangle ABC has ' + sides(p) + '. The tangent to the circumcircle of ABC at A meets line BC at X.';
  },
  hints: [
    'The tangent–chord angle gives ∠XAB = ∠ACB. Which two triangles does that make similar?',
    '△XAB ∼ △XCA with ratio AB : CA = c : b. So XB/XA = XA/XC = c/b, hence XB : XC = c² : b².',
    'XA² is the power of X, i.e. XA² = XB·XC, and XC − XB = a (X lies outside the segment, on the side of the shorter of b, c).'
  ],
  solution: function (p) {
    var e = Math.abs(p.b * p.b - p.c * p.c);
    return '<p>By the tangent–chord angle, ∠XAB = ∠ACB, and ∠X is common, so <b>△XAB ∼ △XCA</b> with ratio AB : CA = c : b. Hence</p>' +
      '<p class="k">XB/XA = XA/XC = c/b &nbsp;⟹&nbsp; XB : XC = c² : b²</p>' +
      '<p>Since X is outside segment BC, |XC − XB| = a, so XB = ac²/|b²−c²| and XC = ab²/|b²−c²|. The power of X gives XA² = XB·XC:</p>' +
      '<p class="k">XA² = a²b²c² / (b² − c²)²</p>' +
      '<p>Here |b²−c²| = ' + e + '.</p>' +
      '<p><em>Bonus: X is the harmonic conjugate of the bisector foot D with respect to B and C, and XA is tangent — this is the standard setup for the "A-Apollonius circle".</em></p>';
  },
  figure: function (p) {
    var m = model(p.a, p.b, p.c);
    var tdir = [-(m.A[1] - m.O[1]), (m.A[0] - m.O[0])];
    var X = meet(m.A, [m.A[0] + tdir[0], m.A[1] + tdir[1]], m.B, m.C);
    var D = lerp(m.B, m.C, p.c / (p.b + p.c));
    var g = [CIR(m.O, m.R, { k: 'main' })];
    g = g.concat(TRI(m));
    g.push(S(X, m.A, { k: 'hi' }), S(X, m.C, { dash: 1 }), S(m.A, D, { dash: 1 }));
    g = g.concat(ABC(m));
    g.push(P(X, 'X'), P(D, 'D'));
    return g;
  },
  verify: function (p) {
    var m = model(p.a, p.b, p.c);
    var tdir = [-(m.A[1] - m.O[1]), (m.A[0] - m.O[0])];
    var X = meet(m.A, [m.A[0] + tdir[0], m.A[1] + tdir[1]], m.B, m.C);
    return d2(X, m.A);
  }
});
/* ---------- topics + tiers ---------- */
var TOPICS = {
  incenter: 'Incenter / incircle',
  orthocenter: 'Orthocenter / Euler line',
  circles: 'Circles & power of a point',
  ratios: 'Ratios & cevians'
};
var TIERS = { 1: 'Warm-up', 2: 'AIME', 3: 'Olympiad config', 4: 'Wild' };

function byId(id) { for (var i = 0; i < CONFIGS.length; i++) if (CONFIGS[i].id === id) return CONFIGS[i]; return null; }

var DEFAULT_CAP = 2000000n;
function acceptable(v, cfg) {
  if (v.n <= 0n) return false;
  var cap = cfg && cfg.cap ? BigInt(cfg.cap) : DEFAULT_CAP;
  if (v.n + v.d > cap) return false;
  return true;
}

/* Build one problem from a config id + seed. Deterministic. */
function makeProblem(cfgId, seed) {
  var cfg = byId(cfgId);
  if (!cfg) return null;
  var R = rng(seed >>> 0);
  var p = null, v = null;
  for (var k = 0; k < 400; k++) {
    p = cfg.gen(R);
    try { v = cfg.value(p); } catch (e) { continue; }
    if (acceptable(v, cfg)) break;
    v = null;
  }
  if (!v) { p = cfg.gen(rng(12345)); v = cfg.value(p); }
  var isInt = fint(v);
  var answer = isInt ? v.n : (v.n + v.d);
  var ask = isInt
    ? 'Find ' + cfg.quantity + '.'
    : cfg.quantity + ' can be written as m/n, where m and n are relatively prime positive integers. Find m + n.';
  return {
    cfgId: cfg.id, name: cfg.name, lemma: cfg.lemma, tier: cfg.tier, topic: cfg.topic,
    seed: seed >>> 0, params: p, quantity: cfg.quantity,
    statement: cfg.statement(p), ask: ask,
    exact: fstr(v), approx: fnum(v), isInt: isInt,
    answer: answer.toString(),
    hints: cfg.hints, solution: cfg.solution(p), figure: cfg.figure(p)
  };
}

function randomProblem(filterIds, seed) {
  var ids = (filterIds && filterIds.length) ? filterIds : CONFIGS.map(function (c) { return c.id; });
  if (seed === undefined) seed = (Math.random() * 4294967296) >>> 0;
  var R = rng(seed);
  var id = ids[Math.floor(R() * ids.length)];
  return makeProblem(id, (Math.floor(R() * 4294967296)) >>> 0);
}

return {
  CONFIGS: CONFIGS, TOPICS: TOPICS, TIERS: TIERS,
  makeProblem: makeProblem, randomProblem: randomProblem, byId: byId,
  fr: fr, fstr: fstr, fnum: fnum, model: model, rng: rng, dist: dist, d2: d2,
  fadd: fadd, fsub: fsub, fmul: fmul, fdiv: fdiv, fint: fint, shapely: shapely, angles: angles
};
}));
