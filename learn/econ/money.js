/* ============================================================
   ULTRON LAB · econ/money.js — Station E01: Money & time.
   Geometric series, present value, annuities, doubling time.
   Pure JS: browser + node. The math of interest, as machinery.
   ============================================================ */
(function () {
  'use strict';

  /* geometric series: a + a·r + … + a·r^(n−1), closed form + receipt */
  function geomSum(a, r, n) {
    if (n <= 0) return { value: 0, steps: [] };
    if (Math.abs(r - 1) < 1e-12) return { value: a * n, steps: ['r = 1: the sum is just a·n'] };
    const closed = a * (1 - Math.pow(r, n)) / (1 - r);
    const steps = [];
    let run = 0, term = a;
    const terms = [];
    for (let i = 0; i < n; i++) { run += term; terms.push(term); term *= r; }
    steps.push(`terms: ${terms.slice(0, 4).map(t => t.toFixed(3)).join(' + ')}${n > 4 ? ' + …' : ''}`);
    steps.push(`closed form: a(1 − rⁿ)/(1 − r) = ${closed.toFixed(6)}`);
    steps.push(`loop check: ${run.toFixed(6)} — they agree`);
    return { value: closed, steps, loop: run };
  }

  /* future value of one dollar: fv = (1+r)^T with a year-by-year receipt */
  function growthPath(p, r, T) {
    const path = [{ t: 0, v: p }];
    let v = p;
    for (let t = 1; t <= T; t++) { v *= (1 + r); path.push({ t, v }); }
    return path;
  }

  /* present value: what a future cashflow stream is worth TODAY */
  function pv(cashflows, r) {
    let s = 0;
    const weights = [];
    for (let t = 0; t < cashflows.length; t++) {
      const w = 1 / Math.pow(1 + r, t);
      weights.push(w);
      s += cashflows[t] * w;
    }
    return { value: s, weights };
  }

  /* the constant payment that exhausts principal P over T periods at rate r */
  function annuity(P, r, T) {
    if (T === Infinity || !isFinite(T)) return r > 0 ? P * r / (1 + r) : P;   /* the perpetuity limit */
    if (r === 0) return P / T;
    return P * r / (1 - Math.pow(1 + r, -T));
  }

  /* doubling time: exact (ln 2 / ln(1+r)) vs the rule of 72 */
  function doubling(r) {
    const exact = Math.log(2) / Math.log(1 + r);
    const rule = 0.72 / r;   /* 72%/r with r as a fraction */
    return { exact, rule };
  }

  const api = { geomSum, growthPath, pv, annuity, doubling };
  if (typeof window !== 'undefined') window.ULTRON_MONEY = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_MONEY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
