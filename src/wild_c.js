
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

/* ---------- targets ---------- */
function chooseTarget(ctx, R) {
  var P = ctx.pts, late = P.slice(3), tries = 0;
  var base = ['A', 'B', 'C'];
  while (tries++ < 160) {
    var roll = R();
    if (roll < 0.70 && late.length) {
      var X = late[rint(R, late.length)];
      var pool = P.filter(function (q) { return q.n !== X.n; });
      var Y = pool[rint(R, pool.length)];
      var v = dd(X.p, Y.p);
      if (qz(v)) continue;
      return { v: v, q: X.n + Y.n + '²', kind: 'd2', pts: [X.n, Y.n] };
    } else if (roll < 0.88) {
      var s = some(R, P, 3); if (!s) continue;
      var ar = areaX2(s[0].p, s[1].p, s[2].p);
      if (qz(ar)) continue;
      var base2 = areaX2(nameP(ctx, 'A').p, nameP(ctx, 'B').p, nameP(ctx, 'C').p);
      if (s.every(function (z) { return base.indexOf(z.n) >= 0; })) continue;
      return { v: qd(ar, base2), q: '[' + s[0].n + s[1].n + s[2].n + '] / [ABC]', kind: 'area', pts: [s[0].n, s[1].n, s[2].n] };
    } else if (roll < 0.94 && ctx.circs.length > 1) {
      var ce = ctx.circs[1 + rint(R, ctx.circs.length - 1)];
      return { v: ce.c.r2, q: 'the square of the radius of ' + ce.n, kind: 'r2', circ: ce.n };
    } else if (late.length >= 2) {
      var s1 = some(R, late, 2), s2 = some(R, P, 2);
      if (!s1 || !s2) continue;
      var n1 = dd(s1[0].p, s1[1].p), n2 = dd(s2[0].p, s2[1].p);
      if (qz(n1) || qz(n2) || (s1[0].n === s2[0].n && s1[1].n === s2[1].n)) continue;
      return { v: qd(n1, n2), q: s1[0].n + s1[1].n + '² / ' + s2[0].n + s2[1].n + '²', kind: 'ratio',
               pts: [s1[0].n, s1[1].n, s2[0].n, s2[1].n] };
    }
  }
  return null;
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
  if (tg.v.n <= 0n) return null;
  if (tg.v.n + tg.v.d > 1200000n) return null;
  var kept = prune(ctx, tg);
  if (kept < 4) return null;
  if (verifyCtx(ctx)) return null;
  return { ctx: ctx, target: tg, seed: seed >>> 0, steps: kept };
}
