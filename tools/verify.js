const G = require('../src/core.js');
let bad = 0, tested = 0;
for (const cfg of G.CONFIGS) {
  let worst = 0, worstP = null, n = 0;
  for (let s = 1; s <= 260; s++) {
    const pr = G.makeProblem(cfg.id, s * 7919 + 13);
    const exact = pr.approx;
    let got;
    try { got = cfg.verify(pr.params); } catch (e) { console.log('THROW', cfg.id, e.message); bad++; break; }
    const rel = Math.abs(got - exact) / Math.max(1e-9, Math.abs(exact));
    if (!isFinite(rel)) { console.log('NaN', cfg.id, JSON.stringify(pr.params), exact, got); bad++; break; }
    if (rel > worst) { worst = rel; worstP = pr.params; }
    n++; tested++;
  }
  const ok = worst < 1e-6;
  if (!ok) bad++;
  console.log((ok ? 'OK  ' : 'FAIL') + '  ' + cfg.id.padEnd(15) + ' n=' + n + '  worst rel err = ' + worst.toExponential(2) + (ok ? '' : '   at ' + JSON.stringify(worstP)));
}
console.log('\ninstances tested:', tested, ' failing configs:', bad);
