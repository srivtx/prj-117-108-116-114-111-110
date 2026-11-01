/* ============================================================
   ULTRON LAB · econ/consume.js — Station E06: the perfect arc.
   The permanent income hypothesis: consumption equals the
   annuity value of wealth + the present value of income.
   A one-off bonus barely moves it; a permanent raise moves it
   one-for-one. The station makes you feel why.
   ============================================================ */
(function () {
  'use strict';

  /* the constant consumption stream that exactly spends W over T periods at rate r */
  function annuityStream(W, r, T) {
    if (W <= 0) return 0;
    if (!isFinite(T)) return r > 0 ? W * r / (1 + r) : W;   /* infinite horizon: the perpetuity slice */
    if (r === 0) return W / T;
    return W * r / (1 - Math.pow(1 + r, -T));
  }

  /* PV of an income stream at rate r */
  function pvIncome(income, r) {
    let s = 0;
    for (let t = 0; t < income.length; t++) s += income[t] / Math.pow(1 + r, t);
    return s;
  }

  /* the PIH consumption level: annuitize (wealth + PV of income) over the horizon */
  function pihConsumption(wealth, income, r, T) {
    return annuityStream(wealth + pvIncome(income, r), r, T);
  }

  /* how much does consumption move when a shock lands? Both the
     income window and the annuity horizon are the SAME 40 periods —
     matching horizons is what makes the arithmetic exact:
     a one-off bonus annuitizes to a sliver; a raise for the whole
     horizon raises consumption by (almost exactly) the full amount. */
  function shockResponse(shock, r) {
    const horizon = 40;
    const T = horizon;                                   /* income window = annuity window */
    const base = new Array(horizon).fill(1);             /* baseline income of 1/period */
    const hit = base.slice(); hit[5] += shock;           /* one-off bonus at t=5 */
    const perm = base.slice(); for (let t = 0; t < horizon; t++) perm[t] += shock;   /* raise, whole horizon */
    const cBase = pihConsumption(0, base, r, T);
    const cTrans = pihConsumption(0, hit, r, T);
    const cPerm = pihConsumption(0, perm, r, T);
    return {
      base: cBase,
      transitoryRise: cTrans - cBase,        /* ≈ shock × discount × annuity share — a sliver */
      permanentRise: cPerm - cBase,          /* ≈ shock — full */
      annuityShare: r / (1 + r)
    };
  }

  /* simulate two consumers over a random transitory-income stream:
     the smoother (PIH) vs the hand-to-mouth (c = y). Variance tells the story. */
  function variance(xs) { const u = xs.reduce((a, b) => a + b, 0) / xs.length; return xs.reduce((a, b) => a + (b - u) * (b - u), 0) / xs.length; }

  function compareConsumers(T, r, seed) {
    let s = (seed || 3) >>> 0;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const income = [];
    for (let t = 0; t < T; t++) income.push(1 + (rand() < 0.3 ? 1.5 : 0));   /* occasional transitory windfalls */
    const smooth = annuityStream(1 + pvIncome(income, r), r, Infinity);       /* wealth 1 + future income, annuitized */
    const handToMouth = income;
    return {
      income,
      smoothPath: new Array(T).fill(smooth),
      handToMouthPath: handToMouth,
      varSmooth: variance(new Array(T).fill(smooth)),
      varHand: variance(handToMouth)
    };
  }

  const api = { annuityStream, pvIncome, pihConsumption, shockResponse, compareConsumers, variance };
  if (typeof window !== 'undefined') window.ULTRON_CONSUME = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_CONSUME = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
