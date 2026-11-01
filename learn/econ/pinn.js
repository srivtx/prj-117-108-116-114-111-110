/* ============================================================
   ULTRON LAB · econ/pinn.js — Station E10: physics in the loss.
   Learn u(t) = e^{−t} on [0, 3] two ways:
     (a) data fit — MSE on a couple of points (interpolation,
         blind between them and at the edges);
     (b) residual fit — the differential equation du/dt + u = 0
         at collocation points, ZERO data. The equation is the
         only teacher.
   The gradient is EXACT: the forward pass carries dual numbers
   (u, du/dt) through the same Value graph the autograd engine
   backprops — the derivative contributes its own edge to the
   loss, so backprop sees ∂(du/dt)/∂weights too. That is a
   physics-informed neural network in miniature.
   ============================================================ */
(function () {
  'use strict';

  function getNN() {
    if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
      return require('../pure/autograd.js');
    }
    return (typeof window !== 'undefined' ? window.ULTRON_NN : globalThis.ULTRON_NN);
  }

  function seededRandom(seed) {
    let s = (seed >>> 0) || 41;
    return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  }

  function makeNet(NN, seed, hidden) {
    const rand = seededRandom(seed);
    const orig = Math.random;
    Math.random = rand;                        /* the constructor samples from Math.random */
    const net = new NN.MLP([1, hidden || 10, 1]);
    Math.random = orig;
    return net;
  }

  /* one gradient step on an arbitrary loss Value — the same hygiene
     as MLP.step (mean scale, clipping) but the loss is OURS. */
  function sgd(net, loss, lr, clip) {
    clip = clip === undefined ? 1 : clip;
    for (const p of net.params()) p.grad = 0;
    loss.backwardAll();
    for (const p of net.params()) {
      if (p.grad > clip) p.grad = clip;
      if (p.grad < -clip) p.grad = -clip;
      p.v -= lr * p.grad;
    }
  }

  /* forward-mode pass through the SAME weights: each layer maps the
     pair (x, dx/dt) to (out, dout/dt).  s = b + Σ w·x and
     ds = Σ w·dx share the weight Values, so backprop reaches the
     weights through BOTH the value and the derivative paths. */
  function forwardDual(net, NN, t) {
    let xs = [new NN.Value(t)], dxs = [new NN.Value(1)];
    for (const layer of net.layers) {
      const nxt = [], dnxt = [];
      for (const neuron of layer.neurons) {
        let s = neuron.b, ds = new NN.Value(0);
        for (let i = 0; i < neuron.w.length; i++) {
          s = s.add(neuron.w[i].mul(xs[i]));
          ds = ds.add(neuron.w[i].mul(dxs[i]));
        }
        if (neuron.nonlin) {
          const th = s.tanh();
          const oneMinusT2 = th.mul(th).neg().add(1);   /* 1 − tanh²(s) */
          nxt.push(th);
          dnxt.push(ds.mul(oneMinusT2));
        } else {
          nxt.push(s);
          dnxt.push(ds);
        }
      }
      xs = nxt; dxs = dnxt;
    }
    return { u: xs[0], du: dxs[0] };
  }

  /* (a) plain data fit */
  function trainOnData(NN, dataTs, steps, seed, lr) {
    const net = makeNet(NN, seed, 10);
    const targets = dataTs.map(t => Math.exp(-t));
    for (let s = 0; s < steps; s++) net.step([dataTs], targets, lr || 0.05);
    return net;
  }

  /* (b) residual training: minimize (du/dt + u)² at collocation
     points, pinned by the initial condition u(0) = 1 — no TRAJECTORY
     data anywhere, one boundary value plus the equation. (The IC is
     not optional: u' + u = 0 alone also admits u ≡ 0, the trivial
     solution — real PINNs always carry boundary/initial terms.) */
  function trainOnResidual(NN, steps, seed, lr, nColloc) {
    const net = makeNet(NN, seed || 3, 10);
    const rand = seededRandom((seed || 3) * 7 + 1);
    const ts = [];
    for (let i = 0; i < (nColloc || 7); i++) ts.push(0.15 + 2.7 * rand());
    for (let s = 0; s < steps; s++) {
      let loss = new NN.Value(0);
      for (const t of ts) {
        const { u, du } = forwardDual(net, NN, t);
        const r = du.add(u);                     /* residual of du/dt + u = 0 */
        loss = loss.add(r.pow(2));
      }
      loss = loss.mul(1 / ts.length);
      const ic = forwardDual(net, NN, 0).u.sub(1).pow(2);   /* u(0) = 1 */
      loss = loss.add(ic);
      sgd(net, loss, lr || 0.03, 5);
      if (!isFinite(loss.v)) break;
    }
    return net;
  }

  /* max |u(t) − e^{−t}| over an evaluation grid */
  function maxError(net, from, to) {
    let worst = 0;
    for (let i = 0; i <= 40; i++) {
      const t = from + (to - from) * i / 40;
      worst = Math.max(worst, Math.abs(net.forward([t])[0].v - Math.exp(-t)));
    }
    return worst;
  }

  const api = { makeNet, sgd, forwardDual, trainOnData, trainOnResidual, maxError, seededRandom };
  if (typeof window !== 'undefined') window.ULTRON_PINN = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_PINN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
