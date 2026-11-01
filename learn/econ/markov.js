/* ============================================================
   ULTRON LAB · econ/markov.js — Station E03: the weather machine.
   Finite Markov chains: distribution evolution, stationary
   distributions by power iteration, seeded simulation.
   ============================================================ */
(function () {
  'use strict';

  /* π_{t+1} = π_t · P  (row vector times row-stochastic matrix) */
  function evolve(pi, P, steps) {
    let cur = pi.slice();
    const history = [cur.slice()];
    for (let s = 0; s < steps; s++) {
      const nxt = new Array(P.length).fill(0);
      for (let i = 0; i < P.length; i++)
        for (let j = 0; j < P.length; j++)
          nxt[j] += cur[i] * P[i][j];
      cur = nxt;
      history.push(cur.slice());
    }
    return { final: cur, history };
  }

  /* stationary distribution: power iteration from uniform */
  function stationary(P, tol = 1e-12, maxIter = 100000) {
    const n = P.length;
    let pi = new Array(n).fill(1 / n);
    for (let it = 0; it < maxIter; it++) {
      const { final: nxt } = evolve(pi, P, 1);
      let d = 0;
      for (let i = 0; i < n; i++) d = Math.max(d, Math.abs(nxt[i] - pi[i]));
      pi = nxt;
      if (d < tol) break;
    }
    return pi;
  }

  /* does pi satisfy pi = pi · P ? (the defining equation) */
  function isStationary(pi, P, tol = 1e-9) {
    const { final } = evolve(pi, P, 1);
    return pi.every((v, i) => Math.abs(v - final[i]) < tol);
  }

  /* seeded RNG (same LCG family as ds.js) */
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* simulate the chain; return states + occupancy fractions */
  function simulate(P, T, seed, start) {
    const rand = rng(seed || 7);
    const n = P.length;
    let cur = start !== undefined ? start : Math.floor(rand() * n);
    const counts = new Array(n).fill(0);
    const states = [cur];
    counts[cur]++;
    for (let t = 1; t < T; t++) {
      const row = P[cur];
      let u = rand(), acc = 0, nxt = n - 1;
      for (let j = 0; j < n; j++) { acc += row[j]; if (u < acc) { nxt = j; break; } }
      cur = nxt;
      counts[cur]++;
      states.push(cur);
    }
    return { states, occupancy: counts.map(c => c / T) };
  }

  /* presets used by the station */
  const PRESETS = {
    weather: {
      names: ['sunny', 'cloudy', 'rainy'],
      P: [[0.7, 0.2, 0.1],
          [0.3, 0.4, 0.3],
          [0.2, 0.4, 0.4]]
    },
    sticky: {
      names: ['boom', 'normal', 'bust'],
      P: [[0.9, 0.1, 0.0],
          [0.2, 0.6, 0.2],
          [0.0, 0.3, 0.7]]
    }
  };

  const api = { evolve, stationary, isStationary, simulate, PRESETS };
  if (typeof window !== 'undefined') window.ULTRON_MARKOV = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_MARKOV = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
