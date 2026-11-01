/* ============================================================
   ULTRON LAB · econ/gauss.js — Station E11: the curve with
   error bars. Gaussian-process regression with a squared-
   exponential kernel: posterior mean and variance, uncertainty-
   aware sampling (UCB), and the prior that returns where there
   is no data. Surrogates for expensive models — the heart of
   DEQN ch 9–10 (GPs, deep surrogates, SMM).
   ============================================================ */
(function () {
  'use strict';

  /* small symmetric solve via Gaussian elimination with partial
     pivoting — the same craft as pure/linalg, kept local and tiny */
  function solveSym(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c] || 1e-12;
      for (let r = c + 1; r < n; r++) {
        const f = M[r][c] / d;
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
      x[r] = s / (M[r][r] || 1e-12);
    }
    return x;
  }

  /* Cholesky of a small SPD matrix (jitter added by caller) */
  function chol(A) {
    const n = A.length;
    const L = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let s = A[i][j];
        for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / (L[j][j] || 1e-12);
      }
    }
    return L;
  }

  const sqExp = (a, b, l) => Math.exp(-((a - b) * (a - b)) / (2 * l * l));

  /* posterior at x*: mean and variance of f(x*) given (xs, ys) */
  function posterior(xs, ys, xstar, opts) {
    const { l = 1, noise = 0.05, jitter = 1e-8 } = opts || {};
    const n = xs.length;
    const K = [];
    for (let i = 0; i < n; i++) {
      K.push([]);
      for (let j = 0; j < n; j++) K[i].push(sqExp(xs[i], xs[j], l) + (i === j ? noise + jitter : 0));
    }
    const kstar = xs.map(x => sqExp(x, xstar, l));
    const kss = sqExp(xstar, xstar, l) + jitter;
    const alpha = solveSym(K, ys.slice());
    const mean = kstar.reduce((a, kj, i) => a + kj * alpha[i], 0);
    const v = solveSym(K, kstar.slice());
    const s1 = kstar.reduce((a, kj, i) => a + kj * v[i], 0);
    const variance = Math.max(kss - s1, 0);
    return { mean, variance, sd: Math.sqrt(variance) };
  }

  /* where to sample next: max upper-confidence bound on a grid */
  function bestNext(xs, ys, gridPts, opts) {
    let best = null;
    for (const gx of gridPts) {
      const { mean, sd } = posterior(xs, ys, gx, opts);
      const ucb = mean + 2 * sd;
      if (!best || ucb > best.ucb) best = { x: gx, ucb, mean, sd };
    }
    return best;
  }

  const api = { solveSym, chol, sqExp, posterior, bestNext };
  if (typeof window !== 'undefined') window.ULTRON_GAUSS = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_GAUSS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
