/* ============================================================
   ULTRON LAB · econ/solow.js — Station E02: the growth machine.
   y = k^α, the law of motion, the steady state, the golden rule.
   Discrete-time Solow:  k_{t+1} = (s·k^α + (1−δ)·k) / (1+n).
   ============================================================ */
(function () {
  'use strict';

  function prod(k, alpha) { return Math.pow(k, alpha); }

  /* one step of the law of motion */
  function step(k, s, n, delta, alpha) {
    return (s * prod(k, alpha) + (1 - delta) * k) / (1 + n);
  }

  /* the steady state: numeric fixed point (exact for any n) */
  function steadyState(s, n, delta, alpha) {
    let k = 1;                       /* any positive start converges — the point of the model */
    for (let i = 0; i < 800; i++) k = step(k, s, n, delta, alpha);
    return k;
  }

  /* closed form exists when n = 0:  s·k^α = δ·k  ⇒  k* = (s/δ)^(1/(1−α)) */
  function steadyStateNoN(s, delta, alpha) {
    return Math.pow(s / delta, 1 / (1 - alpha));
  }

  /* a full path with receipts: investment, break-even, deepening */
  function path(k0, s, n, delta, alpha, T) {
    const rows = [];
    let k = k0;
    for (let t = 0; t <= T; t++) {
      const y = prod(k, alpha);
      rows.push({ t, k, y, invest: s * y, breakEven: (n + delta) * k, c: (1 - s) * y });
      k = step(k, s, n, delta, alpha);
    }
    return rows;
  }

  /* consumption at the steady state as a function of s — golden rule search */
  function goldenRule(n, delta, alpha) {
    let bestS = 0, bestC = -Infinity;
    for (let i = 1; i <= 200; i++) {
      const s = i / 200;
      const k = steadyState(s, n, delta, alpha);
      const y = prod(k, alpha);
      const c = (1 - s) * y;
      if (c > bestC) { bestC = c; bestS = s; }
    }
    return { s: bestS, c: bestC };
  }

  const api = { prod, step, steadyState, steadyStateNoN, path, goldenRule };
  if (typeof window !== 'undefined') window.ULTRON_SOLOW = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_SOLOW = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
