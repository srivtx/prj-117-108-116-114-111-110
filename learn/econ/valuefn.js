/* ============================================================
   ULTRON LAB · econ/valuefn.js — Station E05: the Bellman sweep.
   Optimal growth with log utility, Cobb-Douglas production and
   FULL depreciation (δ=1), so the model has a known closed form:
     V(k) = A + B·ln k,    policy  c*(k) = (1−αβ)·k^α
   Value iteration is checked against that truth. The same
   closed form feeds Station E09, where a neural net learns it.
   ============================================================ */
(function () {
  'use strict';

  const DEFAULTS = { alpha: 0.4, beta: 0.9, kMin: 0.05, kMax: 5, nGrid: 60 };

  function grid(model) {
    const { kMin, kMax, nGrid } = model;
    const g = [];
    for (let i = 0; i < nGrid; i++) g.push(kMin * Math.pow(kMax / kMin, i / (nGrid - 1)));   /* log-spaced */
    return g;
  }

  /* the exact policy — the yardstick VFI must meet */
  function policyClosedForm(k, model) { return (1 - model.alpha * model.beta) * Math.pow(k, model.alpha); }

  /* value iteration on the grid. VFI sweep: V'(k) = max over k' of ln(k^α−k') + β V(k') */
  function iterate(model, sweeps, V0) {
    const { alpha, beta } = model;
    const ks = grid(model);
    let V = V0 ? V0.slice() : ks.map(k => Math.log(Math.max(policyClosedForm(k, model), 1e-9)));
    const errors = [];
    for (let s = 0; s < sweeps; s++) {
      const nxt = new Array(ks.length);
      for (let i = 0; i < ks.length; i++) {
        const y = Math.pow(ks[i], alpha);
        let best = -Infinity;
        /* try each feasible next-capital gridpoint (coarse but honest) */
        for (let j = 0; j < ks.length; j++) {
          const kp = ks[j];
          if (kp >= y) break;                       /* infeasible: log of negative */
          const val = Math.log(y - kp) + beta * V[j];
          if (val > best) best = val;
        }
        nxt[i] = best === -Infinity ? V[i] - 1 : best;
      }
      let err = 0;
      for (let i = 0; i < ks.length; i++) err = Math.max(err, Math.abs(nxt[i] - V[i]));
      errors.push(err);
      V = nxt;
    }
    return { ks, V, errors };
  }

  /* recover the policy function from the converged V */
  function policy(model, V) {
    const { alpha, beta } = model;
    const ks = grid(model);
    const n = ks.length;
    const cStar = new Array(n);
    for (let i = 0; i < n; i++) {
      const y = Math.pow(ks[i], alpha);
      let best = -Infinity, bestC = null;
      for (let j = 0; j < n; j++) {
        const kp = ks[j];
        if (kp >= y) break;
        const val = Math.log(y - kp) + beta * V[j];
        if (val > best) { best = val; bestC = y - ks[j]; }
      }
      cStar[i] = bestC === null ? y : bestC;
    }
    return cStar;
  }

  const api = { DEFAULTS, grid, policyClosedForm, iterate, policy };
  if (typeof window !== 'undefined') window.ULTRON_VALUEFN = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_VALUEFN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
