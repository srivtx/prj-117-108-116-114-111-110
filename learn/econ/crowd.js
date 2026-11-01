/* ============================================================
   ULTRON LAB · econ/crowd.js — Station E08: wealth of crowds.
   A thousand agents, multiplicative luck, and one dial of
   redistribution γ:  w' = (1−γ)·w·R_i + γ·mean(w).
   Multiplicative growth grows a right tail (Kesten); γ tames it.
   Inequality emerges from LUCK ALONE — that is the whole point.
   ============================================================ */
(function () {
  'use strict';

  function rng(seed) { let s = (seed >>> 0) || 21; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* Gini: mean absolute difference over twice the mean */
  function gini(w) {
    const n = w.length;
    const mu = w.reduce((a, b) => a + b, 0) / n;
    if (mu <= 0) return 0;
    let sad = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sad += Math.abs(w[i] - w[j]);
    return sad / (2 * n * n * mu);
  }

  /* one year of the ensemble */
  function step(w, gamma, rand, muShock = 0.02, sigShock = 0.16) {
    const mean = w.reduce((a, b) => a + b, 0) / w.length;
    /* Box-Muller for lognormal multiplicative shocks */
    const draws = w.map(() => {
      const u1 = Math.max(rand(), 1e-12), u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return Math.exp(muShock - sigShock * sigShock / 2 + sigShock * z);   /* lognormal R, E[R]≈e^mu */
    });
    return w.map((wi, i) => (1 - gamma) * wi * draws[i] + gamma * mean);
  }

  /* run the ensemble; return wealth snapshots + a Gini path */
  function run(N, years, gamma, seed) {
    const rand = rng(seed);
    let w = new Array(N).fill(1);
    const giniPath = [gini(w)];
    const snaps = { 0: w.slice() };
    for (let t = 1; t <= years; t++) {
      w = step(w, gamma, rand);
      giniPath.push(gini(w));
      if (t === Math.floor(years / 2) || t === years) snaps[t] = w.slice().sort((a, b) => a - b);
    }
    const sorted = w.slice().sort((a, b) => a - b);
    const p = q => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    return {
      final: w, sorted, snaps, giniPath,
      p10: p(0.1), p50: p(0.5), p90: p(0.9), p99: p(0.99),
      giniFinal: giniPath[giniPath.length - 1]
    };
  }

  const api = { gini, step, run };
  if (typeof window !== 'undefined') window.ULTRON_CROWD = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_CROWD = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
