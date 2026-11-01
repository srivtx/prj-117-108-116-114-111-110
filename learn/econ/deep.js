/* ============================================================
   ULTRON LAB · econ/deep.js — Station E09: learning the economy.
   A miniature deep equilibrium net: the Build-X autograd MLP
   learns Station E05's optimal policy c*(k) = (1−αβ)·k^α from
   samples. Solve once with grids… or learn the solution and
   evaluate it millions of times. The DEQN idea, in miniature.
   ============================================================ */
(function () {
  'use strict';

  function getNN() {
    if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
      return require('../pure/autograd.js');
    }
    return (typeof window !== 'undefined' ? window.ULTRON_NN : globalThis.ULTRON_NN);
  }

  /* deterministic LCG — reproducible training, like the XOR lab */
  function seededRandom(seed) {
    let s = (seed >>> 0) || 77;
    return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  }

  /* sample k in [kMin, kMax], target = closed-form policy */
  function makeDataset(n, model, seed) {
    const { alpha, beta, kMin, kMax } = model;
    const rand = seededRandom(seed || 13);
    const xs = [], ys = [];
    for (let i = 0; i < n; i++) {
      const k = kMin + (kMax - kMin) * rand();
      xs.push([k]);
      ys.push((1 - alpha * beta) * Math.pow(k, alpha));
    }
    return { xs, ys };
  }

  /* train [1,8,1] on MSE; return the net + the loss curve */
  function train(model, dataset, steps, seed, hidden) {
    const NN = getNN();
    const rand = seededRandom(seed || 17);
    const orig = Math.random;
    Math.random = rand;                       /* the MLP constructor samples weights from Math.random */
    const net = new NN.MLP([1, hidden || 8, 1]);
    Math.random = orig;
    const lr = 0.05;
    const lossCurve = [];
    for (let s = 0; s < steps; s++) {
      const i = Math.floor(rand() * dataset.xs.length);
      const loss = net.step([dataset.xs[i]], [dataset.ys[i]], lr);
      if (isNaN(loss.v)) break;
      if (s % 10 === 0) lossCurve.push(loss.v);
    }
    return { net, lossCurve, NN };
  }

  /* max policy error over a fixed test grid — the yardstick */
  function maxError(model, net, kMin, kMax) {
    const { alpha, beta } = model;
    let worst = 0;
    for (let i = 0; i <= 40; i++) {
      const k = kMin + (kMax - kMin) * i / 40;
      const got = net.forward([k])[0].v;
      const want = (1 - alpha * beta) * Math.pow(k, alpha);
      worst = Math.max(worst, Math.abs(got - want));
    }
    return worst;
  }

  /* use the LEARNED policy to run the economy forward; compare to truth.
     Law of motion with full depreciation: k_{t+1} = k^α − c(k). */
  function simulateWithPolicy(model, net, k0, T) {
    const { alpha } = model;
    const pathTrue = [], pathNet = [];
    let a = k0, b = k0;
    for (let t = 0; t < T; t++) {
      pathTrue.push(a); pathNet.push(b);
      const ya = Math.pow(a, alpha), yb = Math.pow(b, alpha);
      const ca = (1 - model.alpha * model.beta) * ya;
      const cb = Math.max(net.forward([b])[0].v, 1e-6);
      a = ya - ca;
      b = Math.max(yb - cb, 1e-6);
    }
    return { pathTrue, pathNet };
  }

  const api = { makeDataset, train, maxError, simulateWithPolicy, seededRandom };
  if (typeof window !== 'undefined') window.ULTRON_DEEP = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_DEEP = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
