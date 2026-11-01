/* ============================================================
   ULTRON LAB · pure/autograd.js — a scalar autograd engine
   (micrograd-style): values remember how they were built and
   backpropagate through the tape. Plus a tiny MLP that learns
   XOR. Every gradient is derived, none are hard-coded.
   ============================================================ */
(function () {
  'use strict';
  class Value {
    constructor(v, children, op, label) {
      this.v = v; this.grad = 0;
      this.prev = children || [];
      this.op = op || '';
      this.label = label || '';
      this.backward = () => { };
    }
    add(o) { o = v(o); const out = new Value(this.v + o.v, [this, o], '+');
      out.backward = () => { this.grad += out.grad; o.grad += out.grad; }; return out; }
    mul(o) { o = v(o); const out = new Value(this.v * o.v, [this, o], '×');
      out.backward = () => { this.grad += o.v * out.grad; o.grad += this.v * out.grad; }; return out; }
    neg() { return this.mul(-1); }
    sub(o) { o = v(o); return this.add(o.neg()); }
    pow(p) { const out = new Value(Math.pow(this.v, p), [this], `^${p}`);
      out.backward = () => { this.grad += p * Math.pow(this.v, p - 1) * out.grad; }; return out; }
    relu() { const out = new Value(this.v > 0 ? this.v : 0, [this], 'relu');
      out.backward = () => { if (this.v > 0) this.grad += out.grad; }; return out; }
    tanh() { const t = Math.tanh(this.v); const out = new Value(t, [this], 'tanh');
      out.backward = () => { this.grad += (1 - t * t) * out.grad; }; return out; }
    exp() { const e = Math.exp(this.v); const out = new Value(e, [this], 'exp');
      out.backward = () => { this.grad += e * out.grad; }; return out; }
    /* build a tape (topological order) then backprop */
    backwardAll() {
      const tape = [];
      const seen = new Set();
      const walk = (n) => { if (seen.has(n)) return; seen.add(n); for (const p of n.prev) walk(p); tape.push(n); };
      walk(this);
      this.grad = 1;
      for (let i = tape.length - 1; i >= 0; i--) tape[i].backward();
    }
    toString() { return `${this.label || this.op || '·'}(${this.v.toFixed(3)})`; }
  }
  const v = x => x instanceof Value ? x : new Value(x);

  /* ---------- a neuron / layer / MLP ---------- */
  class Neuron {
    constructor(nin, nonlin) {
      this.w = Array.from({ length: nin }, () => new Value((Math.random() * 2 - 1) * 0.8));
      this.b = new Value(0);
      this.nonlin = nonlin !== false;
    }
    forward(x) {
      let s = this.b;
      for (let i = 0; i < this.w.length; i++) s = s.add(this.w[i].mul(x[i]));
      return this.nonlin ? s.tanh() : s;
    }
    params() { return [...this.w, this.b]; }
  }
  class Layer {
    constructor(nin, nout, nonlin) { this.neurons = Array.from({ length: nout }, () => new Neuron(nin, nonlin)); }
    forward(x) { return this.neurons.map(n => n.forward(x)); }
    params() { return this.neurons.flatMap(n => n.params()); }
  }
  class MLP {
    constructor(sizes) {
      this.layers = [];
      for (let i = 0; i + 1 < sizes.length; i++)
        this.layers.push(new Layer(sizes[i], sizes[i + 1], i + 2 < sizes.length));
    }
    forward(x) { for (const L of this.layers) x = L.forward(x); return x; }
    params() { return this.layers.flatMap(L => L.params()); }
    /* one SGD step on (xs, ys) with mean squared-error loss; returns the loss Value.
       Two pieces of trainer hygiene, same as real frameworks:
       MEAN loss (not sum — keeps the scale data-size independent) and
       gradient CLIPPING (a hard |∂| ≤ clip stops divergence blowups). */
    step(xs, ys, lr, clip) {
      clip = clip === undefined ? 1 : clip;
      let loss = new Value(0);
      for (let k = 0; k < xs.length; k++) {
        const out = this.forward(xs[k])[0];
        loss = loss.add(out.sub(ys[k]).pow(2));
      }
      loss = loss.mul(1 / xs.length);              // mean, not sum
      for (const p of this.params()) p.grad = 0;
      loss.backwardAll();
      for (const p of this.params()) {
        if (p.grad > clip) p.grad = clip;           // gradient clipping
        if (p.grad < -clip) p.grad = -clip;
        p.v -= lr * p.grad;
      }
      return loss;
    }
  }

  const api = { Value, Neuron, Layer, MLP, v };
  if (typeof window !== 'undefined') window.ULTRON_NN = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_NN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
