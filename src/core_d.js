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
