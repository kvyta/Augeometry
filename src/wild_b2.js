
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
