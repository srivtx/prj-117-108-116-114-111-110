/* ============================================================
   ULTRON LAB · econ/mcall.js — Station E04: the job you take.
   The McCall search model: wage offers arrive each period; a
   worker accepts (works at that wage for the rest of the life)
   or rejects and collects unemployment benefit b for one more
   period. Value iteration finds the reservation wage. You play
   against it.
   ============================================================ */
(function () {
  'use strict';

  /* offers on a fine grid with a hump-shaped distribution — a real
     offer density, so the reservation wage MOVES when benefits move */
  const DEFAULTS = (() => {
    const wages = [];
    for (let w = 40; w <= 80; w += 4) wages.push(w);
    const raw = wages.map(w => Math.exp(-Math.pow((w - 62) / 14, 2)));
    const s = raw.reduce((a, b) => a + b, 0);
    return { wages, probs: raw.map(v => v / s), b: 28, beta: 0.96 };
  })();

  /* value iteration: V(w) = max( w/(1−β) , b + β·EV )  */
  function solve(model) {
    const { wages, probs, b, beta } = model;
    const n = wages.length;
    let V = wages.map(w => Math.max(w / (1 - beta), b));
    let policy = new Array(n).fill(false);
    const iters = [];
    for (let sweep = 0; sweep < 2000; sweep++) {
      let EV = 0;
      for (let i = 0; i < n; i++) EV += probs[i] * V[i];
      const nxt = new Array(n), npol = new Array(n);
      let moved = 0;
      for (let i = 0; i < n; i++) {
        const accept = wages[i] / (1 - beta);
        const reject = b + beta * EV;
        nxt[i] = Math.max(accept, reject);
        npol[i] = accept >= reject;
        if (Math.abs(nxt[i] - V[i]) > 1e-10) moved++;
      }
      V = nxt; policy = npol;
      iters.push({ sweep, moved, EV });
      if (moved === 0) break;
    }
    let resIdx = wages.findIndex((w, i) => policy[i]);
    const resWage = resIdx >= 0 ? wages[resIdx] : Infinity;
    return { V, policy, resWage, resIdx, iters };
  }

  function rng(seed) { let s = (seed >>> 0) || 11; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* one LIFE of T periods: search collecting b; upon acceptance at
     time τ, work at that wage for the remaining T−τ periods. */
  function liveLife(model, resWage, T, rand) {
    const { wages, probs, b } = model;
    let t = 0;
    while (t < T) {
      let u = rand(), acc = 0, offer = wages[wages.length - 1];
      for (let i = 0; i < wages.length; i++) { acc += probs[i]; if (u < acc) { offer = wages[i]; break; } }
      if (offer >= resWage) {
        return { wait: t, wage: offer, value: (t * b + (T - t) * offer) / T };
      }
      t++;
    }
    return { wait: T, wage: null, value: b };   /* never accepted: b forever */
  }

  /* average a rule over many lives */
  function simulate(model, resWage, lives, T, seed) {
    const rand = rng(seed || 5);
    let vSum = 0, waitSum = 0, wageSum = 0, wageN = 0;
    for (let i = 0; i < lives; i++) {
      const life = liveLife(model, resWage, T, rand);
      vSum += life.value;
      waitSum += life.wait;
      if (life.wage !== null) { wageSum += life.wage; wageN++; }
    }
    return { value: vSum / lives, avgWait: waitSum / lives, avgWage: wageN ? wageSum / wageN : 0 };
  }

  /* baselines: always accept vs optimal vs never accept */
  function compare(model, lives = 300, T = 120, seed = 5) {
    const opt = solve(model);
    const always = simulate(model, -Infinity, lives, T, seed);
    const optimal = simulate(model, opt.resWage, lives, T, seed);
    const picky = simulate(model, Infinity, lives, T, seed);
    return { always, optimal, picky, resWage: opt.resWage };
  }

  const api = { DEFAULTS, solve, liveLife, simulate, compare };
  if (typeof window !== 'undefined') window.ULTRON_MCCALL = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_MCCALL = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
