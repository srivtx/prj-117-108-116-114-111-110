/* ============================================================
   ULTRON LAB · econ-sims2.js — the economics & finance wing,
   stations E07–E12: exponential clocks, wealth of crowds, deep
   equilibrium nets, physics-informed residuals, Gaussian-process
   surrogates, and climate under deep uncertainty.
   ============================================================ */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);

  function chart(cv) {
    const g = cv.getContext('2d');
    function frame() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const css = getComputedStyle(document.documentElement);
      const col = n => css.getPropertyValue(n).trim();
      return { g, w, h, ink: col('--ink'), muted: col('--muted'), line: col('--line'), c1: col('--c1'), c2: col('--c2'), c3: col('--c3'), c4: col('--c4') };
    }
    return frame;
  }
  function axis(f, x0, x1, y0, y1) {
    const pad = { l: 44, r: 12, t: 16, b: 26 };
    return {
      X: x => pad.l + (x - x0) / (x1 - x0) * (f.w - pad.l - pad.r),
      Y: y => f.h - pad.b - (y - y0) / (y1 - y0) * (f.h - pad.t - pad.b)
    };
  }
  function frame1(f, ax, lab, x0, x1, y0, y1) {
    const { g } = f;
    g.strokeStyle = f.line; g.lineWidth = 1;
    g.beginPath(); g.moveTo(ax.X(x0), f.h - 26); g.lineTo(ax.X(x1), f.h - 26); g.stroke();
    g.beginPath(); g.moveTo(44, ax.Y(y1)); g.lineTo(44, ax.Y(y0)); g.stroke();
    g.fillStyle = f.muted; g.font = '11px IBM Plex Mono, monospace';
    g.fillText(lab, 44, 14);
    for (let i = 0; i <= 4; i++) {
      const y = y0 + (y1 - y0) * i / 4;
      g.fillText(y.toFixed(Math.abs(y1 - y0) < 5 ? 1 : 0), 8, ax.Y(y) + 4);
    }
  }

  /* ============================================================
     E07 · CLOCKS & JUMPS
     ============================================================ */
  {
    let api, cv, draw;
    const st = { lam: 1.0, mu: 1.5, run: null, t: 0, state: 0, occupancy: [0, 0], jumps: [] };
    window.ULTRON_ECON.push({
      id: 'e7', tab: 'Clocks', kind: '2d',
      title: 'Clocks & jumps — the exponential heart',
      lede: 'A server works until an exponential clock rings (rate λ), then it is down until another rings (rate μ). The exponential is memoryless — surviving an hour earns you nothing. Run the machine and watch the long-run shares settle at μ/(λ+μ) and λ/(λ+μ): the stationary distribution.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        st.t = 0; st.state = 0; st.occupancy = [0, 0]; st.jumps = []; st.run = null;
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>break rate λ</label><input type="range" id="e7l" min="2" max="40" value="10"><output>1.0</output></div>
          <div class="ctl"><label>repair rate μ</label><input type="range" id="e7m" min="2" max="40" value="15"><output>1.5</output></div>
          <div class="btns"><button class="btn primary" id="e7p">run 10 time units</button><button class="btn" id="e7r">run 500 (fast-forward)</button><button class="btn" id="e7rs">reset clocks</button></div>
          <p class="note">Green = working, red = broken. The bars accumulate time-in-state; the slabs are the theoretical stationary shares μ/(λ+μ), λ/(λ+μ).</p>`;
        $('#e7l').oninput = e => { st.lam = +e.target.value / 10; e.target.nextElementSibling.textContent = st.lam.toFixed(1); };
        $('#e7m').oninput = e => { st.mu = +e.target.value / 10; e.target.nextElementSibling.textContent = st.mu.toFixed(1); };
        $('#e7p').onclick = () => runFor(10);
        $('#e7r').onclick = () => runFor(500);
        $('#e7rs').onclick = () => { st.t = 0; st.state = 0; st.occupancy = [0, 0]; st.jumps = []; redraw(); };
        let seed = 13;
        function runFor(T) {
          const K = window.ULTRON_CLOCK;
          const rand = K.rng(seed++);
          const Q = K.TWO_STATE.Q(st.lam, st.mu);
          /* continue from the current state; cores give us fresh runs,
             so simulate a long run and take the tail honestly */
          const r = K.simulateCT(Q, st.t + T, seed);
          const total = st.t + T;
          st.occupancy = r.time;
          st.t = total;
          st.state = r.jumps.length % 2 === 0 ? 0 : 1;
          st.jumps = r.jumps.slice(-14);
          redraw();
        }
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const { g } = f;
          /* state strip */
          const stripY = 40;
          g.fillStyle = f.c1; g.fillRect(54, stripY, 60, 26);
          g.fillStyle = f.c2; g.fillRect(124, stripY, 60, 26);
          g.fillStyle = f.ink; g.font = '12px IBM Plex Mono, monospace';
          g.fillText('working', 64, stripY + 17);
          g.fillText('broken', 136, stripY + 17);
          g.strokeStyle = st.state === 0 ? f.c1 : f.c2; g.lineWidth = 3;
          g.strokeRect(st.state === 0 ? 54 : 124, stripY - 4, 60, 34);
          /* occupancy bars */
          const pi = [st.mu / (st.lam + st.mu), st.lam / (st.lam + st.mu)];
          const occ = st.t > 0 ? [st.occupancy[0] / st.t, st.occupancy[1] / st.t] : [0, 0];
          const ax = axis(f, 0, 1, 0, 1);
          frame1(f, ax, 'share of time', 0, 1, 0, 1);
          const bars = [[occ[0], pi[0], f.c1, 'working'], [occ[1], pi[1], f.c2, 'broken']];
          bars.forEach(([v, theory, color, name], i) => {
            const x = 90 + i * 220;
            g.fillStyle = color;
            g.fillRect(x, ax.Y(v), 46, ax.Y(0) - ax.Y(v));
            g.fillStyle = f.ink;
            g.fillRect(x + 56, ax.Y(theory) - 1.5, 34, 3);
            g.fillStyle = f.muted;
            g.fillText(`${name}: ${(v * 100).toFixed(1)}% vs theory ${(theory * 100).toFixed(1)}%`, x - 16, ax.Y(0) + 16);
          });
          g.fillStyle = f.muted;
          g.fillText(`clock time survived: ${st.t.toFixed(0)} units · jumps: ${st.jumps.length ? st.jumps.length + ' (recent shown)' : 'none yet'}`, 54, f.h - 42);
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const K = window.ULTRON_CLOCK;
        const Q = K.TWO_STATE.Q(st.lam, st.mu);
        const rand = K.rng(99);
        const draws = []; for (let i = 0; i < 5000; i++) draws.push(K.expSample(st.lam, rand));
        const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
        const pi = K.stationaryCT(Q);
        el.innerHTML = `<div><span>mean uptime (5000 draws)</span><b>${mean.toFixed(3)} (theory ${1 / st.lam})</b></div>
          <div><span>stationary [work, broken]</span><b>${pi.map(v => v.toFixed(3)).join(' · ')}</b></div>
          <div><span>your occupancy so far</span><b>${st.t > 0 ? (st.occupancy[0] / st.t).toFixed(3) : '—'}</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E08 · WEALTH OF CROWDS
     ============================================================ */
  {
    let api, cv, draw;
    const st = { gamma: 0.1, years: 0, result: null };
    window.ULTRON_ECON.push({
      id: 'e8', tab: 'Crowds', kind: '2d',
      title: 'Wealth of crowds — luck, tails, and the tax',
      lede: 'Four hundred agents, identical at the start, differing only in the multiplicative luck they draw each year. No skill, no inheritance — and a wealth distribution grows anyway, with a fat right tail. One dial of redistribution γ reshapes it. This is the Kesten mechanism behind heterogeneous-agent economics.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        st.years = 0; st.result = null;
        const C = window.ULTRON_CROWD;
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>redistribution γ</label><input type="range" id="e8g" min="0" max="30" value="10"><output>0.10</output></div>
          <div class="btns"><button class="btn primary" id="e8y1">one year passes</button><button class="btn" id="e8y25">25 years</button><button class="btn" id="e8rs">reset to equality</button></div>
          <p class="note">Every dot is an agent (log wealth scale). The curve is the sorted distribution — the steeper its right end, the fatter the tail. γ=0: pure luck. γ=1: from each according to luck, to each equally.</p>`;
        $('#e8g').oninput = e => { st.gamma = +e.target.value / 100; e.target.nextElementSibling.textContent = st.gamma.toFixed(2); };
        $('#e8y1').onclick = () => run(st.years + 1);
        $('#e8y25').onclick = () => run(st.years + 25);
        $('#e8rs').onclick = () => run(0);
        let seed = 9;
        function run(years) {
          seed += 101;
          const r = C.run(400, years, st.gamma, seed);
          st.result = r; st.years = years;
          redraw();
        }
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const { g } = f;
          if (!st.result || st.years === 0) {
            g.fillStyle = f.muted; g.font = '13px IBM Plex Mono, monospace';
            g.fillText('four hundred agents, all with wealth 1.0 — press a year button.', 54, f.h / 2);
          } else {
            const r = st.result;
            const ax = axis(f, 0, 1, Math.log(0.02), Math.log(30));
            frame1(f, ax, 'wealth (log)', 0, 1, Math.log(0.02), Math.log(30));
            /* sorted agents */
            r.sorted.forEach((w, i) => {
              const n = r.sorted.length;
              g.fillStyle = w > r.p90 ? f.c4 : f.c1;
              g.fillRect(ax.X(i / (n - 1)), ax.Y(Math.log(Math.max(w, 0.02))), 2.4, ax.Y(Math.log(0.02)) - ax.Y(Math.log(Math.max(w, 0.02))) + 1);
            });
            g.fillStyle = f.ink; g.font = '11px IBM Plex Mono, monospace';
            g.fillText('poorest → richest', ax.X(0.42), f.h - 8);
          }
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const r = st.result;
        el.innerHTML = r && st.years > 0 ? `
          <div><span>years lived</span><b>${st.years}</b></div>
          <div><span>gini</span><b>${r.giniFinal.toFixed(3)}</b></div>
          <div><span>median / p90 / p99</span><b>${r.p50.toFixed(2)} / ${r.p90.toFixed(2)} / ${r.p99.toFixed(2)}</b></div>
          <div><span>tail ratio p99/median</span><b>${(r.p99 / Math.max(r.p50, 1e-9)).toFixed(1)}×</b></div>`
          : `<div><span>gini</span><b>0.000 (perfect equality)</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E09 · LEARNING THE ECONOMY (deep equilibrium net)
     ============================================================ */
  {
    let api, cv, draw;
    const st = { net: null, nData: 40, steps: 0, loss: null };
    window.ULTRON_ECON.push({
      id: 'e9', tab: 'Deep net', kind: '2d',
      title: 'Learning the economy — a net for a policy',
      lede: 'Station E05 solved the growth model by sweeping a grid. Here a neural network — the same 60-line autograd engine from Build-X — LEARNS the optimal rule from samples of it. One solve, evaluated anywhere: the trick that lets deep equilibrium nets touch models with a thousand state variables, where grids drown.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        const D = window.ULTRON_DEEP;
        const NN = window.ULTRON_NN;
        const model = { alpha: 0.4, beta: 0.9, kMin: 0.05, kMax: 5 };
        st.model = model;
        st.dataset = D.makeDataset(st.nData, model, 13);
        st.net = null; st.steps = 0; st.loss = null;
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>samples</label><input type="range" id="e9n" min="10" max="200" value="40" step="10"><output>40</output></div>
          <div class="btns"><button class="btn primary" id="e9t">train 200 steps</button><button class="btn" id="e9tt">train 2000</button><button class="btn" id="e9rs">re-initialize</button></div>
          <p class="note">Dots: training samples of the true rule. Blue curve: the net's guess (a random init before training). Dashed green: the exact rule (1−αβ)·k^α. The net never sees the formula — only points.</p>`;
        $('#e9n').oninput = e => {
          st.nData = +e.target.value; e.target.nextElementSibling.textContent = st.nData;
          st.dataset = D.makeDataset(st.nData, model, 13);
          redraw();
        };
        $('#e9t').onclick = () => { train(200); };
        $('#e9tt').onclick = () => { train(2000); };
        $('#e9rs').onclick = () => { st.net = null; st.steps = 0; st.loss = null; redraw(); };
        function train(n) {
          const r = D.train(model, st.dataset, n, 17 + st.steps, 8);
          st.net = r.net; st.steps += n; st.loss = r.lossCurve.length ? r.lossCurve[r.lossCurve.length - 1] : null;
          redraw();
        }
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const { g } = f;
          const ax = axis(f, 0, model.kMax, 0, 1.6);
          frame1(f, ax, 'c(k) — how much to eat', 0, model.kMax, 0, 1.6);
          /* exact */
          g.strokeStyle = f.c1; g.setLineDash([4, 4]); g.lineWidth = 1.6;
          g.beginPath();
          for (let i = 0; i <= 80; i++) {
            const k = model.kMin + (model.kMax - model.kMin) * i / 80;
            const y = (1 - model.alpha * model.beta) * Math.pow(k, model.alpha);
            const X = ax.X(k), Y = ax.Y(y);
            i ? g.lineTo(X, Y) : g.moveTo(X, Y);
          }
          g.stroke(); g.setLineDash([]);
          /* samples */
          g.fillStyle = f.muted;
          st.dataset.xs.forEach(([k]) => {
            const y = (1 - model.alpha * model.beta) * Math.pow(k, model.alpha);
            g.beginPath(); g.arc(ax.X(k), ax.Y(y), 2.4, 0, 7); g.fill();
          });
          /* the net */
          if (st.net) {
            g.strokeStyle = f.c2; g.lineWidth = 2.2;
            g.beginPath();
            for (let i = 0; i <= 80; i++) {
              const k = model.kMin + (model.kMax - model.kMin) * i / 80;
              const y = st.net.forward([k])[0].v;
              const X = ax.X(k), Y = ax.Y(Math.max(0, Math.min(y, 1.6)));
              i ? g.lineTo(X, Y) : g.moveTo(X, Y);
            }
            g.stroke();
          }
          g.fillStyle = f.ink; g.font = '12px IBM Plex Mono, monospace';
          g.fillText(`steps trained: ${st.steps}${st.loss !== null ? ' · loss ' + st.loss.toExponential(2) : ''}`, 54, 30);
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const D = window.ULTRON_DEEP;
        let err = null;
        if (st.net) err = D.maxError(st.model, st.net, 0.05, 5);
        el.innerHTML = `<div><span>samples</span><b>${st.nData}</b></div>
          <div><span>steps</span><b>${st.steps}</b></div>
          <div><span>worst policy error</span><b>${err === null ? '—' : err.toFixed(4)}</b></div>
          <div><span>the exact rule</span><b>c(k) = (1−αβ)·k^α</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E10 · PHYSICS IN THE LOSS (PINN)
     ============================================================ */
  {
    let api, cv, draw;
    const st = { dataNet: null, resNet: null, trained: 0 };
    window.ULTRON_ECON.push({
      id: 'e10', tab: 'PINN', kind: '2d',
      title: 'Physics in the loss — the equation is the teacher',
      lede: 'Two nets try to learn u(t) = e⁻ᵗ. One gets two data points. The other gets NO data — just the differential equation du/dt + u = 0 at a handful of collocation points, plus the starting value u(0) = 1. Guess which one knows the curve everywhere.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        const P = window.ULTRON_PINN, NN = window.ULTRON_NN;
        st.dataNet = null; st.resNet = null; st.trained = 0;
        const c = api.controls();
        c.innerHTML = `
          <div class="btns"><button class="btn primary" id="e10t">train both 300 steps</button><button class="btn" id="e10tt">train both 1500</button><button class="btn" id="e10rs">re-initialize</button></div>
          <p class="note">White curve: the truth e⁻ᵗ. Dots: the two data points (t = 0.5, 2.5). Red: the data-only net — it passes through the dots and free-falls between them. Blue: the physics net — residual of the equation at collocation points, no trajectory data at all.</p>`;
        $('#e10t').onclick = () => train(300);
        $('#e10tt').onclick = () => train(1500);
        $('#e10rs').onclick = () => { st.dataNet = null; st.resNet = null; st.trained = 0; redraw(); };
        function train(n) {
          st.dataNet = P.trainOnData(NN, [0.5, 2.5], n, 5, 0.05);
          st.resNet = P.trainOnResidual(NN, n, 3, 0.03, 7);
          st.trained += n;
          redraw();
        }
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const { g } = f;
          const ax = axis(f, 0, 3, 0, 1.1);
          frame1(f, ax, 'u(t)', 0, 3, 0, 1.1);
          const curve = (net, color) => {
            if (!net) return;
            g.strokeStyle = color; g.lineWidth = 2.2;
            g.beginPath();
            for (let i = 0; i <= 90; i++) {
              const t = 3 * i / 90;
              const y = net.forward([t])[0].v;
              const X = ax.X(t), Y = ax.Y(Math.max(0, Math.min(y, 1.1)));
              i ? g.lineTo(X, Y) : g.moveTo(X, Y);
            }
            g.stroke();
          };
          /* truth */
          g.strokeStyle = f.ink; g.lineWidth = 1.2;
          g.beginPath();
          for (let i = 0; i <= 90; i++) {
            const t = 3 * i / 90;
            const X = ax.X(t), Y = ax.Y(Math.exp(-t));
            i ? g.lineTo(X, Y) : g.moveTo(X, Y);
          }
          g.stroke();
          /* collocation marks */
          g.strokeStyle = f.c1; g.globalAlpha = 0.5;
          for (let i = 0; i < 7; i++) {
            const t = 0.15 + 2.7 * ((i * 37) % 100) / 100;
            g.beginPath(); g.moveTo(ax.X(t), ax.Y(1.1)); g.lineTo(ax.X(t), ax.Y(0)); g.stroke();
          }
          g.globalAlpha = 1;
          curve(st.dataNet, f.c2);
          curve(st.resNet, f.c1);
          /* data points */
          [0.5, 2.5].forEach(t => {
            g.fillStyle = f.c4;
            g.beginPath(); g.arc(ax.X(t), ax.Y(Math.exp(-t)), 4.5, 0, 7); g.fill();
          });
          g.fillStyle = f.muted; g.font = '12px IBM Plex Mono, monospace';
          g.fillText(`steps: ${st.trained}`, 54, 30);
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const P = window.ULTRON_PINN;
        const ed = st.dataNet ? P.maxError(st.dataNet, 0, 3) : null;
        const er = st.resNet ? P.maxError(st.resNet, 0, 3) : null;
        el.innerHTML = `<div><span>data-only worst error</span><b>${ed === null ? '—' : ed.toFixed(4)}</b></div>
          <div><span>physics worst error</span><b>${er === null ? '—' : er.toFixed(4)}</b></div>
          <div><span>data points the physics net saw</span><b>0 (plus u(0)=1)</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E11 · THE CURVE WITH ERROR BARS (GP)
     ============================================================ */
  {
    let api, cv, draw;
    const st = { xs: [1, 3], ys: [0.5, -0.3], l: 1.2 };
    const truth = x => 0.6 * Math.sin(x * 1.4) + 0.15 * Math.cos(x * 0.5);
    window.ULTRON_ECON.push({
      id: 'e11', tab: 'GP', kind: '2d',
      title: 'The curve with error bars — a surrogate you can trust',
      lede: 'You may evaluate the expensive model a few times only. A Gaussian process turns those samples into a curve AND honest error bars: confident near data, honest about ignorance elsewhere. Click the canvas to evaluate where you choose — the band collapses where you look and waits where you do not.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        st.xs = [1, 3]; st.ys = [truth(1), truth(3)];
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>kernel length ℓ</label><input type="range" id="e11l" min="3" max="40" value="12"><output>1.2</output></div>
          <div class="btns"><button class="btn" id="e11u">sample where UCB says</button><button class="btn" id="e11rs">back to 2 samples</button></div>
          <p class="note">Click anywhere on the chart to evaluate the true model there. White dots: your samples. Blue: the posterior mean. Shaded: ±2σ — the machine's honesty. The star is where upper-confidence says to look next.</p>`;
        $('#e11l').oninput = e => { st.l = +e.target.value / 10; e.target.nextElementSibling.textContent = st.l.toFixed(1); redraw(); };
        $('#e11u').onclick = () => {
          const G = window.ULTRON_GAUSS;
          const gridPts = [];
          for (let i = 0; i <= 60; i++) gridPts.push(0.1 + 5.8 * i / 60);
          const best = G.bestNext(st.xs, st.ys, gridPts, { l: st.l, noise: 0.001 });
          st.xs.push(best.x); st.ys.push(truth(best.x));
          redraw();
        };
        $('#e11rs').onclick = () => { st.xs = [1, 3]; st.ys = [truth(1), truth(3)]; redraw(); };
        cv.onclick = ev => {
          const rect = cv.getBoundingClientRect();
          const xAt = 0.1 + (ev.clientX - rect.left - 44) / (rect.width - 56) * 5.8;
          if (xAt < 0.1 || xAt > 5.9) return;
          st.xs.push(xAt); st.ys.push(truth(xAt));
          redraw();
        };
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const G = window.ULTRON_GAUSS;
          const { g } = f;
          const ax = axis(f, 0, 6, -1.4, 1.4);
          frame1(f, ax, 'f(x)', 0, 6, -1.4, 1.4);
          /* the ±2σ band */
          const N = 90;
          const pts = [];
          for (let i = 0; i <= N; i++) {
            const x = 0.1 + 5.8 * i / N;
            pts.push({ x, ...G.posterior(st.xs, st.ys, x, { l: st.l, noise: 0.001 }) });
          }
          g.fillStyle = 'rgba(93, 79, 224, 0.14)';
          g.beginPath();
          pts.forEach((p, i) => { const X = ax.X(p.x), Y = ax.Y(p.mean + 2 * p.sd); i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
          for (let i = N; i >= 0; i--) { const p = pts[i]; g.lineTo(ax.X(p.x), ax.Y(p.mean - 2 * p.sd)); }
          g.closePath(); g.fill();
          /* mean */
          g.strokeStyle = f.c1; g.lineWidth = 2.2;
          g.beginPath();
          pts.forEach((p, i) => { const X = ax.X(p.x), Y = ax.Y(p.mean); i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
          g.stroke();
          /* truth (thin) */
          g.strokeStyle = f.muted; g.globalAlpha = 0.55; g.lineWidth = 1.2;
          g.beginPath();
          for (let i = 0; i <= N; i++) { const x = 0.1 + 5.8 * i / N; const X = ax.X(x), Y = ax.Y(truth(x)); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }
          g.stroke(); g.globalAlpha = 1;
          /* samples */
          st.xs.forEach((x, i) => {
            g.fillStyle = f.ink;
            g.beginPath(); g.arc(ax.X(x), ax.Y(st.ys[i]), 4, 0, 7); g.fill();
          });
          /* UCB star */
          const gridPts = []; for (let i = 0; i <= 60; i++) gridPts.push(0.1 + 5.8 * i / 60);
          const best = G.bestNext(st.xs, st.ys, gridPts, { l: st.l, noise: 0.001 });
          g.fillStyle = f.c4; g.font = '18px IBM Plex Mono, monospace';
          g.fillText('★', ax.X(best.x) - 6, ax.Y(best.mean + 2 * best.sd) - 4);
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const G = window.ULTRON_GAUSS;
        let worst = 0;
        for (let i = 0; i <= 40; i++) {
          const x = 0.1 + 5.8 * i / 40;
          const p = G.posterior(st.xs, st.ys, x, { l: st.l, noise: 0.001 });
          worst = Math.max(worst, Math.abs(p.mean - truth(x)));
        }
        el.innerHTML = `<div><span>evaluations spent</span><b>${st.xs.length}</b></div>
          <div><span>worst surrogate error</span><b>${worst.toFixed(3)}</b></div>
          <div><span>where UCB points next</span><b>x ≈ ${G.bestNext(st.xs, st.ys, [0.5, 1.5, 2.5, 3.5, 4.5, 5.5], { l: st.l, noise: 0.001 }).x.toFixed(1)}</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E12 · THE FOG AHEAD (climate + deep uncertainty)
     ============================================================ */
  {
    let api, cv, draw;
    const st = { effort: 0.4, ens: null, choice: null };
    window.ULTRON_ECON.push({
      id: 'e12', tab: 'Climate', kind: '2d',
      title: 'The fog ahead — climate under deep uncertainty',
      lede: 'A one-box climate answers emissions with warming; damages answer warming. The catch: nobody knows the planet's sensitivity λ or the damage coefficient a — only ranges. This is the synthesis station: growth (E02), decisions (E05), learning (E09) and now uncertainty that will not resolve in time. Watch which part of the distribution sets policy.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        const CL = window.ULTRON_CLIMATE;
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>abatement effort</label><input type="range" id="e12e" min="0" max="100" value="40"><output>0.40</output></div>
          <div class="btns"><button class="btn" id="e12p">what would the planners choose?</button></div>
          <p class="note">Colored threads: individual scenarios (λ and a drawn from their ranges). Solid lines: the p50 and p95 of warming by year 80. The tail is where the damage lives — and the tail-aware planner abates harder than the average-seeking one.</p>`;
        $('#e12e').oninput = e => { st.effort = +e.target.value / 100; e.target.nextElementSibling.textContent = st.effort.toFixed(2); rerun(); };
        $('#e12p').onclick = () => { st.choice = CL.chooseEffort(CL.DEFAULTS, 120, 7); rerun(); };
        function rerun() {
          st.ens = CL.ensemble(CL.DEFAULTS, st.effort, 120, 7);
          redraw();
        }
        rerun();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const { g } = f;
          const T = CL.DEFAULTS.T;
          const ax = axis(f, 0, T, 0, 8);
          frame1(f, ax, 'ΔT by year', 0, T, 0, 8);
          /* scenario threads */
          st.ens.runs.slice(0, 40).forEach((r, i) => {
            g.strokeStyle = i % 4 === 0 ? f.c2 : f.line; g.globalAlpha = i % 4 === 0 ? 0.55 : 0.25; g.lineWidth = 1;
            g.beginPath();
            r.path.forEach((dT, t) => { const X = ax.X(t), Y = ax.Y(dT); t ? g.lineTo(X, Y) : g.moveTo(X, Y); });
            g.stroke();
          });
          g.globalAlpha = 1;
          /* p50 / p95 over time: recompute from runs (approximate with final quantiles) */
          const nSteps = st.ens.runs[0].path.length;
          g.strokeStyle = f.ink; g.lineWidth = 2.4;
          [0.5, 0.95].forEach((q, qi) => {
            g.beginPath();
            for (let t = 0; t < nSteps; t += 2) {
              const vals = st.ens.runs.map(r => r.path[t]).sort((x, y) => x - y);
              const v = vals[Math.floor(q * vals.length)];
              const X = ax.X(t * (T / (nSteps - 1))), Y = ax.Y(v);
              t ? g.lineTo(X, Y) : g.moveTo(X, Y);
            }
            g.stroke();
            g.lineWidth = qi === 0 ? 2.4 : 1.6;
          });
          g.fillStyle = f.ink; g.font = '12px IBM Plex Mono, monospace';
          g.fillText(`p50 ${st.ens.p50.toFixed(2)}° · p95 ${st.ens.p95.toFixed(2)}° at effort ${st.effort.toFixed(2)}`, 54, 30);
          if (st.choice) {
            const { bestEV, bestTail } = st.choice;
            g.fillStyle = f.muted;
            g.fillText(`mean planner picks effort ${bestEV.e.toFixed(2)} · tail-aware planner picks ${bestTail.e.toFixed(2)}`, 54, f.h - 42);
          }
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const CL = window.ULTRON_CLIMATE;
        el.innerHTML = `<div><span>warming p50 / p95</span><b>${st.ens.p50.toFixed(2)}° / ${st.ens.p95.toFixed(2)}°</b></div>
          <div><span>damage at the p95</span><b>${(1.5 * Math.pow(st.ens.p95, 2)).toFixed(1)}</b></div>
          ${st.choice ? `<div><span>mean planner abates</span><b>${st.choice.bestEV.e.toFixed(2)}</b></div>
          <div><span>tail-aware planner abates</span><b>${st.choice.bestTail.e.toFixed(2)}</b></div>` : ''}`;
      },
      state: st
    });
  }
})();
