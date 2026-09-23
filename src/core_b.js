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
