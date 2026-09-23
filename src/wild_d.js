
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
