/* ============================================================
   ULTRON LAB · econ/clock.js — Station E07: clocks & jumps.
   The exponential distribution (memoryless), the Poisson
   process, and a continuous-time Markov chain simulated as
   competing exponential clocks — the Kolmogorov picture.
   ============================================================ */
(function () {
  'use strict';

  function rng(seed) { let s = (seed >>> 0) || 9; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* one exponential draw: P(X > t) = e^{−λt} */
  function expSample(rate, rand) { return -Math.log(1 - rand()) / rate; }

  /* count arrivals of a Poisson(rate) process in window t */
  function poissonCount(rate, t, rand) {
    let now = 0, k = 0;
    for (;;) { const dt = expSample(rate, rand); if (now + dt > t) return k; now += dt; k++; }
  }

  /* a two-state machine: working (breaks at rate λ, repaired at rate μ).
     Q = [[−λ, λ], [μ, −μ]]. Simulate by drawing the clock of the current state. */
  const TWO_STATE = {
    names: ['working', 'broken'],
    Q: (lam, mu) => [[-lam, lam], [mu, -mu]]
  };

  function simulateCT(Q, T, seed) {
    const rand = rng(seed);
    const n = Q.length;
    let cur = 0, now = 0;
    const time = new Array(n).fill(0);
    const jumps = [];
    while (now < T) {
      const rates = Q[cur].filter(v => v > 0);
      const total = rates.reduce((a, b) => a + b, 0);
      const dt = expSample(total, rand);
      const nextT = now + dt;
      /* which target wins the clock race? */
      let u = rand() * total, acc = 0, nxt = cur;
      for (let j = 0; j < n; j++) {
        const r = Q[cur][j];
        if (r > 0) { acc += r; if (u < acc) { nxt = j; break; } }
      }
      const spend = Math.min(dt, T - now);
      time[cur] += spend;
      if (nextT === cur) break;   /* absorbing state */
      jumps.push({ from: cur, to: nxt, at: nextT });
      now = nextT;
      cur = nxt;
    }
    return { time, occupancy: time.map(v => v / T), jumps };
  }

  /* stationary distribution of the CTMC = stationary of the EMBEDDED
     jump chain (uniformized power iteration for small n) */
  function stationaryCT(Q) {
    const n = Q.length;
    /* build the embedded chain: P[i][j] = Q[i][j] / total-rate-out-of-i */
    const P = [];
    for (let i = 0; i < n; i++) {
      const out = Q[i].reduce((a, b) => a + Math.max(b, 0), 0);
      P.push(Q[i].map(v => v > 0 ? v / out : 0));
      P[i][i] = 1 - P[i].reduce((a, b) => a + b, 0);
    }
    let pi = new Array(n).fill(1 / n);
    for (let it = 0; it < 100000; it++) {
      const nxt = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) nxt[j] += pi[i] * P[i][j];
      let d = 0;
      for (let i = 0; i < n; i++) d = Math.max(d, Math.abs(nxt[i] - pi[i]));
      pi = nxt;
      if (d < 1e-12) break;
    }
    /* pi is the embedded-chain stationary; time shares weight by mean holding time 1/rate-out */
    let raw = pi.map((v, i) => {
      const out = Q[i].reduce((a, b) => a + Math.max(b, 0), 0);
      return v * (out > 0 ? 1 / out : 1);
    });
    const s = raw.reduce((a, b) => a + b, 0);
    return raw.map(v => v / s);
  }

  const api = { rng, expSample, poissonCount, TWO_STATE, simulateCT, stationaryCT };
  if (typeof window !== 'undefined') window.ULTRON_CLOCK = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_CLOCK = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
