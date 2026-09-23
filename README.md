# Augeometry — synthetic geometry drill

A single-file mobile web app that generates AIME/USAMO-flavoured synthetic geometry
problems with **exact, verified integer answers**. No server, no network, no model in
the loop: every answer is computed in exact BigInt rational arithmetic.

Open `index.html` in any browser, or publish it as-is.

## Two generators

**Curated configurations (18).** Each is a named classical lemma with a hand-derived
closed form: incenter–excenter ("Fact 5"), Euler's `OI² = R² − 2Rr`, `OH² = 9R² − (a²+b²+c²)`,
`AH = 2R cos A`, the symmedian ratio, the pole of `BC`, the bisector chord, Ptolemy,
`PQ² = pow(P) + pow(Q)`, Feuerbach, the mixtilinear incircle, the A-excircle, mass points,
the orthic triangle, medians, the radical axis, and the tangent-at-A harmonic point.
Randomised integer side lengths per instance; answers are exact rationals in `a, b, c`.

**Wild mode (unlimited).** Chains classical constructions at random and computes the
answer exactly. The trick: base triangles are **Heronian** (integer sides *and* `16K²`
a perfect square), so vertex `A` lands on rational coordinates and every construction
below stays in ℚ — no square roots anywhere.

Scope is deliberately narrow: plane triangle and circle geometry only. Nothing 3D, no
analytic-geometry dressing, no combinatorial geometry.

Construction moves — cevian family: internal bisector foot, external bisector foot,
symmedian foot, median extended to the circumcircle, isogonal conjugate. Circle family:
second intersection with a circle, circle through three points, intersection of two
tangents (pole of a chord), antipode, second intersection of two circles (Miquel point),
radical axis ∩ line. Plus: midpoint, perpendicular foot, reflection in a line, reflection
in a point, line∩line, orthocenter, circumcenter, centroid, parallel/perpendicular
through a point.

After a chain is built the generator:
- **verifies** every constructed point against its own defining property, in exact
  rational arithmetic (a foot really is perpendicular and on the line, a second
  intersection really is on the circle, a pole really sits on both tangents, …);
- **prunes** every step the question does not depend on, so statements stay tight;
- **detects coincidences** exactly — collinear triples, concyclic quadruples, unexpected
  incidences, equal segments — after first discounting the ones that follow immediately
  from the construction. About half of all instances hide one, and it is usually the
  short synthetic route. It gets surfaced as the second hint.

Base triangles are scalene and non-right on purpose: symmetry and right angles manufacture
fake "coincidences" (`O` landing on a side, `H` landing on a vertex).

## Layout

```
index.html        built app — this is the whole deliverable
preview.html      same page wrapped the way the Artifact host wraps it
build.js          node build.js  →  regenerates both from src/
src/
  core_a.js       exact rationals, seeded RNG, triangle coordinate model
  core_b.js       curated configurations 1–9
  core_c.js       curated configurations 10–17
  core_c2.js      curated configuration 18
  core_d.js       problem assembly, topics, tiers, exports
  wild_a.js       rational point/line/circle kernel + Heronian triangle supply
  wild_b.js       the construction move library
  wild_b2.js      cevian moves: bisectors, symmedians, medians, isogonal conjugates
  wild_c.js       exact verifier, coincidence detection, targets, chain generator
  wild_d.js       figure emission, hints, coordinate solutions
  app.js          UI: drill loop, adaptive sampling, stats, lemma index
  shell.html      markup + CSS, with /*__CORE__*/ /*__WILD__*/ /*__APP__*/ slots
tools/
  verify.js       checks all 18 curated formulas against independent coordinate geometry
  wverify.js      checks wild instances: exact definitions + float cross-check of answers
  fn.js, fn2.js   headless browser tests (answer checking, overflow, console errors)
  shot.js         screenshots
```

## Tests

```
node tools/verify.js     # 18 configs × 260 instances, worst relative error ~1e-13
node tools/wverify.js    # ~770 wild instances, 0 failures
npm i playwright && node tools/fn.js && node tools/fn2.js
```

## Notes

- Curated problems come with a full synthetic solution. Wild problems come with a
  verified *coordinate* solution and the detected coincidences — nobody derived them,
  so claiming a synthetic proof would be dishonest.
- Progress is kept in `localStorage` (wrapped in try/catch; the app works without it).
- Sampling is adaptive by default: configurations you miss come up more often.
