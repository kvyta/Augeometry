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
