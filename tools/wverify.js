const W = require('../src/wild.js');
const K = W._k, qn = K.qnum;
let n = 0, bad = 0, worst = 0, withNote = 0, steps = {}, tgt = {};
for (let s = 0; s < 4000; s++) {
  const b = W.build((s * 2654435761) >>> 0);
  if (!b) continue;
  n++;
  const ctx = b.ctx, tg = b.target;
  const gp = (nm) => { for (const e of ctx.pts) if (e.n === nm) return [qn(e.p.x), qn(e.p.y)]; return null; };
  const d2 = (P, Q) => (P[0]-Q[0])**2 + (P[1]-Q[1])**2;
  const ar = (P,Q,R) => Math.abs((Q[0]-P[0])*(R[1]-P[1]) - (Q[1]-P[1])*(R[0]-P[0]));
  let got = null;
  if (tg.kind === 'd2') got = d2(gp(tg.pts[0]), gp(tg.pts[1]));
  else if (tg.kind === 'area') got = ar(gp(tg.pts[0]),gp(tg.pts[1]),gp(tg.pts[2])) / ar(gp('A'),gp('B'),gp('C'));
  else if (tg.kind === 'ratio') got = d2(gp(tg.pts[0]),gp(tg.pts[1])) / d2(gp(tg.pts[2]),gp(tg.pts[3]));
  else if (tg.kind === 'r2') { for (const ce of ctx.circs) if (ce.n === tg.circ) got = qn(ce.c.r2); }
  const want = qn(tg.v);
  const rel = Math.abs(got - want) / Math.max(1e-9, Math.abs(want));
  if (!(rel < 1e-7)) { bad++; if (bad < 4) console.log('MISMATCH', tg.kind, got, want); }
  if (rel > worst) worst = rel;
  // exact defining-property check (already run inside build, re-assert here)
  if (W.verifyCtx(ctx)) { bad++; console.log('DEFINITION FAILED'); }
  const notes = W.findNotes(ctx);
  if (notes.length) withNote++;
  steps[b.steps] = (steps[b.steps]||0)+1;
  tgt[tg.kind] = (tgt[tg.kind]||0)+1;
}
console.log('instances:', n, ' failures:', bad, ' worst rel err:', worst.toExponential(2));
console.log('with a detected coincidence:', withNote, '(' + Math.round(100*withNote/n) + '%)');
console.log('steps histogram:', JSON.stringify(steps));
console.log('target kinds:', JSON.stringify(tgt));
