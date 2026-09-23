
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
