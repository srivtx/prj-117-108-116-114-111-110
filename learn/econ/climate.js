/* ============================================================
   ULTRON LAB · econ/climate.js — Station E12: the fog ahead.
   A one-box climate model (ΔT' = (F − λΔT)/C) driven by an
   emissions path, a damage function D = a·ΔT^b, and a scenario
   ENSEMBLE over (λ, a) — because the parameters are not known,
   only bounded. Deep uncertainty: the p95 tail sets the policy.
   The synthesis station: growth → decisions → learning →
   uncertainty, in one screen.
   ============================================================ */
(function () {
  'use strict';

  function rng(seed) { let s = (seed >>> 0) || 31; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* integrate the one-box model over decades: ΔT' = (F − λΔT)/C */
  function runScenario(scn, effort, T) {
    /* effort ∈ [0,1]: 1 = full abatement (no forcing), 0 = business as usual */
    const dt = 0.5, steps = Math.round(T / dt);
    const F = scn.F0 * (1 - effort);          /* forcing left after abatement */
    let dT = 0;
    const path = [0];
    for (let i = 0; i < steps; i++) {
      dT += (F - scn.lambda * dT) / scn.C * dt;
      path.push(dT);
    }
    const damage = scn.a * Math.pow(Math.max(dT, 0), scn.b);
    const cost = effort * scn.costK;          /* abatement is not free */
    return { equilibrium: F / scn.lambda, dT, path, damage, cost, total: damage + cost };
  }

  /* the ensemble: p-quantiles of final warming across scenarios */
  function quantile(sorted, q) { return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]; }

  function ensemble(base, effort, n, seed) {
    const rand = rng(seed);
    const runs = [];
    for (let i = 0; i < n; i++) {
      const scn = {
        F0: base.F0,
        lambda: base.lambdaLo + (base.lambdaHi - base.lambdaLo) * rand(),
        C: base.C,
        a: base.aLo + (base.aHi - base.aLo) * rand(),
        b: base.b,
        costK: base.costK
      };
      runs.push(runScenario(scn, effort, base.T));
    }
    const sorted = runs.map(r => r.dT).sort((x, y) => x - y);
    return {
      runs, sorted,
      p5: quantile(sorted, 0.05), p50: quantile(sorted, 0.5), p95: quantile(sorted, 0.95)
    };
  }

  /* the policy choice under two worldviews:
     expected-value planning vs weighting the bad tail (deep uncertainty) */
  function chooseEffort(base, n, seed) {
    const grid = [];
    for (let i = 0; i <= 20; i++) grid.push(i / 20);
    let bestEV = null, bestTail = null;
    const curve = [];
    for (const e of grid) {
      const ens = ensemble(base, e, n, seed);
      const totals = ens.runs.map(r => r.total).sort((x, y) => x - y);
      const ev = totals.reduce((a, b) => a + b, 0) / totals.length;          /* mean planner */
      const tail = quantile(totals, 0.95);                                    /* tail-aware planner */
      curve.push({ effort: e, ev, tail });
      if (!bestEV || ev < bestEV.v) bestEV = { e, v: ev };
      if (!bestTail || tail < bestTail.v) bestTail = { e, v: tail };
    }
    return { bestEV, bestTail, curve };
  }

  const DEFAULTS = { F0: 8.5, lambdaLo: 0.5, lambdaHi: 1.5, C: 10, aLo: 0.5, aHi: 2.5, b: 2, costK: 6, T: 80 };

  const api = { runScenario, ensemble, chooseEffort, DEFAULTS };
  if (typeof window !== 'undefined') window.ULTRON_CLIMATE = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_CLIMATE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
