/* ---------- topics + tiers ---------- */
var TOPICS = {
  incenter: 'Incenter / incircle',
  orthocenter: 'Orthocenter / Euler line',
  circles: 'Circles & power of a point',
  ratios: 'Ratios & cevians'
};
var TIERS = { 1: 'Warm-up', 2: 'AIME', 3: 'Olympiad config', 4: 'Wild' };

function byId(id) { for (var i = 0; i < CONFIGS.length; i++) if (CONFIGS[i].id === id) return CONFIGS[i]; return null; }

var DEFAULT_CAP = 60000n;
function acceptable(v, cfg) {
  if (v.n <= 0n) return false;
  if (v.n + v.d < 8n) return false;      /* single-digit answers are guessable */
  var cap = cfg && cfg.cap ? BigInt(cfg.cap) : DEFAULT_CAP;
  if (v.n + v.d > cap) return false;
  return true;
}

/* Build one problem from a config id + seed. Deterministic. */
function makeProblem(cfgId, seed) {
  var cfg = byId(cfgId);
  if (!cfg) return null;
  var R = rng(seed >>> 0);
  var p = null, v = null, pool = [];
  /* Sample many instances and keep one of the cleanest: the same lemma can land on
     13/4 or on 826281/23104 depending only on the side lengths, and the second is
     a bash, not a geometry problem. */
  for (var k = 0; k < 300 && pool.length < 60; k++) {
    var pk = cfg.gen(R), vk;
    try { vk = cfg.value(pk); } catch (e) { continue; }
    if (!acceptable(vk, cfg)) continue;
    pool.push({ p: pk, v: vk, s: 2.4 * Math.log(Number(vk.d) + 1) + Math.log(Number(vk.n) + 1) });
  }
  if (pool.length) {
    pool.sort(function (x, y) { return x.s - y.s; });
    var take = pool.slice(0, Math.min(12, pool.length));
    var ch = take[Math.floor(R() * take.length)];
    p = ch.p; v = ch.v;
  } else { p = cfg.gen(rng(12345)); v = cfg.value(p); }
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
