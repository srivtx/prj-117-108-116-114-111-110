/* ============================================================
   ULTRON LAB · econ-sims.js — the economics & finance wing,
   stations E01–E06: money & time, the Solow machine, Markov
   chains (3D), the McCall job search, the Bellman sweep, and
   consumption smoothing. Every station runs its pure core from
   learn/econ/ — the same file the verify suite proves.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_ECON = [];
  const $ = s => document.querySelector(s);

  /* ---------- tiny canvas chart helper (same DNA as stats-sims) ---------- */
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
      return { g, w, h, ink: col('--ink'), muted: col('--muted'), line: col('--line'), c1: col('--c1'), c2: col('--c2'), c3: col('--c3'), c4: col('--c4'), card: col('--card') };
    }
    return frame;
  }
  function axis(f, x0, x1, y0, y1, pad) {
    pad = pad || { l: 44, r: 12, t: 14, b: 26 };
    const X = x => pad.l + (x - x0) / (x1 - x0) * (f.w - pad.l - pad.r);
    const Y = y => f.h - pad.b - (y - y0) / (y1 - y0) * (f.h - pad.t - pad.b);
    return { X, Y };
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
     E01 · MONEY & TIME
     ============================================================ */
  {
    let api, cv, draw;
    const st = { principal: 100, rate: 7, years: 30, t: 0 };
    window.ULTRON_ECON.push({
      id: 'e1', tab: 'Money', kind: '2d',
      title: 'Money & time — the geometric machine',
      lede: 'A dollar at 7% for 30 years is not 30 more dollars — it is 7.6 dollars. The curve you are about to drive is a geometric series, and it is the engine under loans, valuations and the Solow model two stations ahead.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>principal</label><input type="range" id="e1p" min="10" max="500" value="100"><output>100</output></div>
          <div class="ctl"><label>rate %</label><input type="range" id="e1r" min="0" max="15" value="7"><output>7</output></div>
          <div class="ctl"><label>years</label><input type="range" id="e1y" min="5" max="50" value="30"><output>30</output></div>
          <div class="btns"><button class="btn" id="e1g">grow a year</button><button class="btn" id="e1f">grow to the end</button><button class="btn" id="e1rs">reset</button></div>
          <p class="note">Bars: value at each year. The dashed line is SIMPLE interest (principal + rate×years). The gap between them is compounding — interest on interest.</p>`;
        const bind = (id, key, fmt) => { const el = $('#' + id); el.oninput = () => { st[key] = +el.value; el.nextElementSibling.textContent = fmt ? fmt(+el.value) : el.value; st.t = Math.min(st.t, st.years); redraw(); }; };
        bind('e1p', 'principal'); bind('e1r', 'rate'); bind('e1y', 'years');
        $('#e1g').onclick = () => { st.t = Math.min(st.t + 1, st.years); redraw(); };
        $('#e1f').onclick = () => { st.t = st.years; redraw(); };
        $('#e1rs').onclick = () => { st.t = 0; redraw(); };
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const M = window.ULTRON_MONEY;
          const path = M.growthPath(st.principal, st.rate / 100, st.years);
          const maxV = path[path.length - 1].v;
          const ax = axis(f, 0, st.years, 0, Math.max(maxV, st.principal * 1.2));
          frame1(f, ax, 'value', 0, st.years, 0, Math.max(maxV, st.principal * 1.2));
          const { g } = f;
          /* simple interest line */
          g.strokeStyle = f.muted; g.setLineDash([4, 4]); g.beginPath();
          path.forEach((pt, i) => { const x = ax.X(pt.t), y = ax.Y(st.principal * (1 + st.rate / 100 * pt.t)); i ? g.lineTo(x, y) : g.moveTo(x, y); });
          g.stroke(); g.setLineDash([]);
          /* bars up to st.t */
          for (let t = 0; t <= st.t; t++) {
            const v = path[t].v;
            g.fillStyle = t === st.t ? f.c2 : f.c1;
            g.fillRect(ax.X(t) - 3, ax.Y(v), 6, ax.Y(0) - ax.Y(v));
          }
          const d = M.doubling(st.rate / 100);
          g.fillStyle = f.ink; g.font = '12px IBM Plex Mono, monospace';
          g.fillText(`year ${st.t}: ${path[st.t].v.toFixed(0)}`, ax.X(st.t) + 8, ax.Y(path[st.t].v) - 6);
          g.fillStyle = f.muted;
          g.fillText(`doubling: exact ${d.exact.toFixed(1)}y · rule of 72 says ${(0.72 / (st.rate / 100)).toFixed(1)}y`, 54, f.h - 40);
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const M = window.ULTRON_MONEY;
        const g = M.geomSum(st.principal, st.rate / 100, st.years);
        const d = M.doubling(st.rate / 100);
        el.innerHTML = `<div><span>final value</span><b>${g.value.toFixed(0)}</b></div>
          <div><span>simple interest would say</span><b>${(st.principal * (1 + st.rate / 100 * st.years)).toFixed(0)}</b></div>
          <div><span>compounding bonus</span><b>${(g.value - st.principal * (1 + st.rate / 100 * st.years)).toFixed(0)}</b></div>
          <div><span>doubling time</span><b>${d.exact.toFixed(1)}y</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E02 · THE SOLOW MACHINE
     ============================================================ */
  {
    let api, cv, draw;
    const st = { s: 0.3, k0: 0.6, t: 0, alpha: 0.4, n: 0.02, delta: 0.05 };
    window.ULTRON_ECON.push({
      id: 'e2', tab: 'Solow', kind: '2d',
      title: 'The Solow machine — capital hunting its steady state',
      lede: 'Output needs capital; saving builds capital; depreciation and population growth eat it. Push the saving rate and the starting capital, then watch the economy roll to the one point where the two forces cancel: the steady state.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>saving rate s</label><input type="range" id="e2s" min="5" max="60" value="30"><output>0.30</output></div>
          <div class="ctl"><label>start capital k₀</label><input type="range" id="e2k" min="5" max="60" value="15"><output>0.15</output></div>
          <div class="btns"><button class="btn" id="e2s1">a year passes</button><button class="btn" id="e2s2">run 40 years</button><button class="btn" id="e2rs">reset</button></div>
          <p class="note">Green: actual investment s·k^α. Red: break-even investment (n+δ)·k. Where they cross, capital stops moving — that is k*. The arrows show which way k rolls from where you dropped it.</p>`;
        $('#e2s').oninput = e => { st.s = +e.target.value / 100; e.target.nextElementSibling.textContent = st.s.toFixed(2); redraw(); };
        $('#e2k').oninput = e => { st.k0 = +e.target.value / 20; st.t = 0; e.target.nextElementSibling.textContent = st.k0.toFixed(2); redraw(); };
        $('#e2s1').onclick = () => { st.t += 1; redraw(); };
        $('#e2s2').onclick = () => { st.t += 40; redraw(); };
        $('#e2rs').onclick = () => { st.t = 0; redraw(); };
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const S = window.ULTRON_SOLOW;
          const kstar = S.steadyState(st.s, st.n, st.delta, st.alpha);
          const rows = S.path(st.k0, st.s, st.n, st.delta, st.alpha, Math.max(st.t, 1));
          const shown = rows.slice(0, st.t + 1);
          const kMax = Math.max(kstar * 1.8, 0.5), yMax = Math.max(Math.pow(kMax, st.alpha) * 1.1, 0.2);
          const ax = axis(f, 0, kMax, 0, yMax);
          frame1(f, ax, 'output per worker', 0, kMax, 0, yMax);
          const { g } = f;
          const curve = (fn, color, dash) => {
            g.strokeStyle = color; g.lineWidth = 2; g.setLineDash(dash || []);
            g.beginPath();
            for (let i = 0; i <= 80; i++) { const k = kMax * i / 80; const y = fn(k); i ? g.lineTo(ax.X(k), ax.Y(y)) : g.moveTo(ax.X(k), ax.Y(y)); }
            g.stroke(); g.setLineDash([]);
          };
          curve(k => Math.pow(k, st.alpha), f.muted, [2, 3]);
          curve(k => st.s * Math.pow(k, st.alpha), f.c1);
          curve(k => (st.n + st.delta) * k, f.c2);
          /* steady state marker */
          g.fillStyle = f.ink;
          g.fillText('k*', ax.X(kstar) - 6, ax.Y(0) + 16);
          g.fillRect(ax.X(kstar) - 1, ax.Y(0) - 8, 2, 8);
          /* the path so far */
          g.fillStyle = f.c3;
          shown.forEach(r => { g.beginPath(); g.arc(ax.X(r.k), ax.Y(r.invest), 2.6, 0, 7); g.fill(); });
          if (shown.length) {
            const last = shown[shown.length - 1];
            g.font = '12px IBM Plex Mono, monospace';
            g.fillText(`year ${last.t}: k=${last.k.toFixed(3)} y=${last.y.toFixed(3)}`, ax.X(last.k) + 8, ax.Y(last.invest) - 8);
          }
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const S = window.ULTRON_SOLOW;
        const kstar = S.steadyState(st.s, st.n, st.delta, st.alpha);
        const ystar = Math.pow(kstar, st.alpha);
        const gr = S.goldenRule(st.n, st.delta, st.alpha);
        el.innerHTML = `<div><span>steady capital k*</span><b>${kstar.toFixed(3)}</b></div>
          <div><span>steady output y*</span><b>${ystar.toFixed(3)}</b></div>
          <div><span>steady consumption</span><b>${((1 - st.s) * ystar).toFixed(3)}</b></div>
          <div><span>golden-rule saving rate</span><b>${gr.s.toFixed(2)} (you are at ${st.s.toFixed(2)})</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E03 · MARKOV CHAINS (3D)
     ============================================================ */
  {
    let api, sim, draw = null;
    const st = { preset: 'weather', steps: 0, dist: [1, 0, 0], target: null };
    window.ULTRON_ECON.push({
      id: 'e3', tab: 'Markov', kind: '3d',
      title: 'Markov chains — probability that forgets',
      lede: 'Start all probability mass on SUNNY. Step the machine: mass flows between states by the transition table. Keep stepping: the distribution settles somewhere that does not depend on where you began. That place is the stationary distribution.',
      mount(a) {
        api = a; sim = a.sim3d(); draw = null;
        const P = window.ULTRON_MARKOV.PRESETS[st.preset];
        st.dist = [1, 0, 0]; st.steps = 0;
        st.target = window.ULTRON_MARKOV.stationary(P.P);
        const c = api.controls();
        c.innerHTML = `
          <div class="seg" id="e3p">
            <button data-k="weather" aria-pressed="true">weather</button><button data-k="sticky">business cycle</button>
          </div>
          <div class="btns"><button class="btn primary" id="e3s1">step ×1</button><button class="btn" id="e3s10">step ×10</button><button class="btn" id="e3rs">reset to sunny</button></div>
          <p class="note">Column height = probability of each state. The floating slabs are the stationary targets — watch the columns land on them.</p>`;
        $('#e3p').querySelectorAll('button').forEach(b => b.onclick = () => {
          $('#e3p').querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
          b.setAttribute('aria-pressed', 'true');
          st.preset = b.dataset.k;
          const q = window.ULTRON_MARKOV.PRESETS[st.preset];
          st.dist = [1, 0, 0]; st.steps = 0; st.target = window.ULTRON_MARKOV.stationary(q.P);
          drawBoard();
        });
        $('#e3s1').onclick = () => { stepChain(1); };
        $('#e3s10').onclick = () => { stepChain(10); };
        $('#e3rs').onclick = () => { st.dist = [1, 0, 0]; st.steps = 0; drawBoard(); };
        sim.cam.view({ target: [0, 4, 0], r: 30, theta: -0.8, phi: 1.2 });
        drawBoard();
        function stepChain(k) {
          const P = window.ULTRON_MARKOV.PRESETS[st.preset].P;
          const r = window.ULTRON_MARKOV.evolve(st.dist, P, k);
          st.dist = r.final; st.steps += k;
          drawBoard();
        }
        function drawBoard() {
          const P = window.ULTRON_MARKOV.PRESETS[st.preset];
          const n = P.P.length;
          let vi = 0;
          /* ground pads */
          for (let i = 0; i < n; i++) sim.vox.set(vi++, (i - (n - 1) / 2) * 4.5, 0.15, 0, '#c9c9dd', 3.6, 0.12, 3.6);
          /* probability columns (scale: height 14 = probability 1) */
          for (let i = 0; i < n; i++) {
            const p = st.dist[i];
            const hgt = Math.max(p * 14, 0.04);
            sim.vox.set(vi++, (i - (n - 1) / 2) * 4.5, 0.3 + hgt / 2, 0, p > 0.005 ? '#5d4fe0' : '#5e5b82', 2.2, hgt, 2.2);
          }
          /* stationary target slabs */
          for (let i = 0; i < n; i++) {
            const p = st.target[i];
            sim.vox.set(vi++, (i - (n - 1) / 2) * 4.5, 0.3 + p * 14, 0, '#0f9e8e', 2.9, 0.1, 2.9);
          }
          sim.vox.hideFrom(vi);
          P.names.forEach((nm, i) => {
            sim.labels.set(i, (i - (n - 1) / 2) * 4.5, 0.6, 2.6, nm, { color: '#5d5d75', size: 22, w: 3, h: 0.8 });
          });
          sim.labels.set(9, 0, 16.5, 0, `steps: ${st.steps} · π = [${st.dist.map(p => p.toFixed(2)).join(', ')}]`, { color: '#5d5d75', size: 24, w: 18, h: 1 });
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const K = window.ULTRON_MARKOV;
        const P = K.PRESETS[st.preset];
        const sim = K.simulate(P.P, 6000, 7, 0);
        el.innerHTML = `<div><span>stationary π</span><b>${st.target.map(v => v.toFixed(3)).join(' · ')}</b></div>
          <div><span>your distribution (step ${st.steps})</span><b>${st.dist.map(v => v.toFixed(3)).join(' · ')}</b></div>
          <div><span>simulated occupancy (6000 days)</span><b>${sim.occupancy.map(v => v.toFixed(3)).join(' · ')}</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E04 · MCCALL JOB SEARCH
     ============================================================ */
  {
    let api, cv, draw;
    const st = { offers: [], spell: [], accepted: [], mode: 'play', done: false };
    window.ULTRON_ECON.push({
      id: 'e4', tab: 'Job search', kind: '2d',
      title: 'The job you take — search, patience, and the reservation wage',
      lede: 'Offers arrive from a fixed distribution; benefits pay the rent while you wait. Take the first offer you like — the machine will remember your choices. Then meet the reservation wage: the one threshold that beats every strategy you can improvise.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        st.offers = []; st.spell = []; st.accepted = []; st.done = false;
        const M = window.ULTRON_MCCALL;
        const sol = M.solve(M.DEFAULTS);
        st.res = sol.resWage;
        let seed = 7;
        const rand = (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
        const c = api.controls();
        c.innerHTML = `
          <div class="btns"><button class="btn primary" id="e4n">next offer</button><button class="btn" id="e4a">accept it</button><button class="btn" id="e4d">decline it</button><button class="btn" id="e4rs">new life</button></div>
          <div class="btns"><button class="btn" id="e4rev">reveal the optimal rule</button></div>
          <p class="note">Your accepted wages and waiting times are scored below. The green line, when revealed, is the optimal reservation wage — accept iff the offer clears it.</p>`;
        $('#e4n').onclick = () => {
          if (st.done) return;
          const { wages, probs } = M.DEFAULTS;
          let u = rand(), acc = 0, offer = wages[wages.length - 1];
          for (let i = 0; i < wages.length; i++) { acc += probs[i]; if (u < acc) { offer = wages[i]; break; } }
          st.offers.push(offer); st.current = offer;
          redraw();
        };
        $('#e4a').onclick = () => {
          if (st.done || st.current === undefined) return;
          st.accepted.push({ wage: st.current, waited: st.offers.length });
          st.done = true; redraw();
        };
        $('#e4d').onclick = () => { if (st.done || st.current === undefined) return; st.current = undefined; redraw(); };
        $('#e4rs').onclick = () => { st.offers = []; st.current = undefined; st.done = false; redraw(); };
        $('#e4rev').onclick = () => { st.showRule = !st.showRule; redraw(); };
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const { wages } = M.DEFAULTS;
          const ax = axis(f, 36, 84, 0, 1);
          frame1(f, ax, 'offers', 36, 84, 0, 1);
          const { g } = f;
          if (st.showRule) {
            g.strokeStyle = f.c1; g.lineWidth = 2;
            g.beginPath(); g.moveTo(ax.X(st.res), ax.Y(1)); g.lineTo(ax.X(st.res), ax.Y(0)); g.stroke();
            g.fillStyle = f.c1;
            g.fillText(`accept ≥ ${st.res} (optimal)`, ax.X(st.res) - 60, ax.Y(1) - 6);
          }
          /* offer dots along a strip */
          st.offers.forEach((o, i) => {
            const isCur = i === st.offers.length - 1 && !st.done;
            g.fillStyle = isCur ? f.c2 : f.muted;
            g.beginPath(); g.arc(ax.X(o), f.h * 0.55, isCur ? 6 : 3.5, 0, 7); g.fill();
          });
          if (st.done) {
            g.fillStyle = f.c3; g.font = '12px IBM Plex Mono, monospace';
            const last = st.accepted[st.accepted.length - 1];
            g.fillText(`hired at ${last.wage} after ${last.waited} offer${last.waited > 1 ? 's' : ''}`, 54, 30);
          }
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const M = window.ULTRON_MCCALL;
        const cmp = M.compare(M.DEFAULTS, 400, 120, 5);
        const mine = st.accepted.length
          ? st.accepted.reduce((a, x) => a + x.wage, 0) / st.accepted.length
          : null;
        el.innerHTML = `<div><span>optimal reservation wage</span><b>${st.res}</b></div>
          <div><span>your accepted wages</span><b>${st.accepted.map(x => x.wage).join(', ') || '—'}</b></div>
          <div><span>your average</span><b>${mine ? mine.toFixed(1) : '—'}</b></div>
          <div><span>optimal rule (400 lives)</span><b>${cmp.optimal.value.toFixed(1)}/period</b></div>
          <div><span>always-accept rule</span><b>${cmp.always.value.toFixed(1)}/period</b></div>
          <div><span>never-accept rule</span><b>${cmp.picky.value.toFixed(1)}/period</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E05 · THE BELLMAN SWEEP
     ============================================================ */
  {
    let api, cv, draw;
    const st = { sweeps: 0, V: null, err: 1 };
    window.ULTRON_ECON.push({
      id: 'e5', tab: 'Bellman', kind: '2d',
      title: 'The Bellman sweep — value iteration, watched',
      lede: 'The value of holding capital k satisfies one equation that contains itself. Start with any guess and sweep: each pass applies the equation once. Watch the guess harden into the true value function — and the eating rule it implies.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        const V0 = window.ULTRON_VALUEFN;
        st.sweeps = 0; st.V = null; st.err = 1;
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>patience β</label><input type="range" id="e5b" min="50" max="98" value="90"><output>0.90</output></div>
          <div class="btns"><button class="btn primary" id="e5s">one sweep</button><button class="btn" id="e5s10">ten sweeps</button><button class="btn" id="e5run">run to convergence</button><button class="btn" id="e5rs">fresh guess</button></div>
          <p class="note">Blue: your current guess V(k). Dashed green: the exact value function for log utility (V(k) = A + B·ln k). The red curve is the policy: how much of the cake to eat at each k — converging to (1−αβ)·k^α.</p>`;
        $('#e5b').oninput = e => { st.beta = +e.target.value / 100; e.target.nextElementSibling.textContent = st.beta.toFixed(2); st.V = null; st.sweeps = 0; st.err = 1; redraw(); };
        st.beta = 0.9;
        $('#e5s').onclick = () => { doSweep(1); };
        $('#e5s10').onclick = () => { doSweep(10); };
        $('#e5run').onclick = () => { doSweep(400); };
        $('#e5rs').onclick = () => { st.V = null; st.sweeps = 0; st.err = 1; redraw(); };
        redraw();
        function model() { return { ...V0.DEFAULTS, beta: st.beta }; }
        function doSweep(k) {
          const md = model();
          const r = V0.iterate(md, k, st.V);
          st.V = r.V; st.sweeps += k;
          st.err = r.errors[r.errors.length - 1];
          redraw();
        }
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const md = model();
          const ks = V0.grid(md);
          const Vmax = 2.2, cMax = 1.6;
          const ax = axis(f, 0, md.kMax, -3.2, Vmax);
          frame1(f, ax, 'value V(k)', 0, md.kMax, -3.2, Vmax);
          const { g } = f;
          /* exact solution: V(k) = A + B ln k ; B = α/(1−αβ) */
          const B = md.alpha / (1 - md.alpha * st.beta);
          g.strokeStyle = f.c1; g.setLineDash([4, 4]); g.lineWidth = 1.6;
          g.beginPath();
          ks.forEach((k, i) => { const x = ax.X(k), y = ax.Y(B * Math.log(k)); i ? g.lineTo(x, y) : g.moveTo(x, y); });
          g.stroke(); g.setLineDash([]);
          if (st.V) {
            g.strokeStyle = f.c2; g.lineWidth = 2.4;
            g.beginPath();
            ks.forEach((k, i) => { const x = ax.X(k), y = ax.Y(st.V[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
            g.stroke();
            /* policy on the right axis (scaled) */
            const pol = V0.policy(md, st.V);
            g.strokeStyle = f.c2; g.globalAlpha = 0.45; g.lineWidth = 1.6;
            g.beginPath();
            ks.forEach((k, i) => { const x = ax.X(k), y = ax.Y((pol[i] / cMax) * (Vmax + 3.2) - 3.2); i ? g.lineTo(x, y) : g.moveTo(x, y); });
            g.stroke(); g.globalAlpha = 1;
          }
          g.fillStyle = f.muted; g.font = '12px IBM Plex Mono, monospace';
          g.fillText(`sweeps: ${st.sweeps} · change per sweep: ${st.err < 1e-6 ? 'converged' : st.err.toExponential(1)}`, 54, 30);
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const V0 = window.ULTRON_VALUEFN;
        const md = { ...V0.DEFAULTS, beta: st.beta || 0.9 };
        let worst = 0;
        if (st.V) {
          const pol = V0.policy(md, st.V);
          V0.grid(md).forEach((k, i) => {
            const want = V0.policyClosedForm(k, md);
            if (want > 1e-6) worst = Math.max(worst, Math.abs(pol[i] - want) / want);
          });
        }
        el.innerHTML = `<div><span>sweeps done</span><b>${st.sweeps}</b></div>
          <div><span>policy vs exact</span><b>${st.V ? (worst * 100).toFixed(1) + '% off' : '—'}</b></div>
          <div><span>exact rule</span><b>c(k) = (1−αβ)k^α</b></div>`;
      },
      state: st
    });
  }

  /* ============================================================
     E06 · CONSUMPTION SMOOTHING
     ============================================================ */
  {
    let api, cv, draw;
    const st = { shock: null };
    window.ULTRON_ECON.push({
      id: 'e6', tab: 'Smoothing', kind: '2d',
      title: 'The perfect arc — consumption smoothing',
      lede: 'A rational consumer does not spend what happens to arrive; she spends the annuity of everything she will ever have. Drop a one-off bonus on her and consumption barely twitches. Announce a permanent raise and it jumps. That asymmetry is the permanent income hypothesis.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw = chart(cv);
        st.shock = null;
        const C = window.ULTRON_CONSUME;
        const c = api.controls();
        c.innerHTML = `
          <div class="btns">
            <button class="btn" id="e6b">one-off bonus +10 at year 5</button>
            <button class="btn" id="e6p">permanent raise +10</button>
            <button class="btn" id="e6c">clear shocks</button>
          </div>
          <p class="note">Bars: income. Flat blue line: the smoother's consumption (the annuity). Jagged red line: the hand-to-mouth consumer, who spends exactly what arrives. Watch which one sleeps better.</p>`;
        $('#e6b').onclick = () => { st.shock = 'trans'; redraw(); };
        $('#e6p').onclick = () => { st.shock = 'perm'; redraw(); };
        $('#e6c').onclick = () => { st.shock = null; redraw(); };
        redraw();
        function redraw() {
          const f = draw(); if (!f.w) return requestAnimationFrame(redraw);
          const horizon = 40, r = 0.05;
          const base = new Array(horizon).fill(1);
          let income = base.slice();
          if (st.shock === 'trans') income[5] += 10;
          if (st.shock === 'perm') income = income.map(v => v + 10);
          const cS = C.pihConsumption(0, income, r, horizon);
          const ax = axis(f, 0, horizon - 1, 0, 12);
          frame1(f, ax, 'income & consumption', 0, horizon - 1, 0, 12);
          const { g } = f;
          income.forEach((v, t) => {
            g.fillStyle = t === 5 && st.shock === 'trans' ? f.c4 : f.c1;
            g.fillRect(ax.X(t) - 3, ax.Y(v), 6, ax.Y(0) - ax.Y(v));
          });
          /* hand-to-mouth: c = y */
          g.strokeStyle = f.c2; g.lineWidth = 1.4;
          g.beginPath();
          income.forEach((v, t) => { const x = ax.X(t), y = ax.Y(v); t ? g.lineTo(x, y) : g.moveTo(x, y); });
          g.stroke();
          /* smoother */
          g.strokeStyle = f.c3; g.lineWidth = 2.4;
          g.beginPath();
          g.moveTo(ax.X(0), ax.Y(cS)); g.lineTo(ax.X(horizon - 1), ax.Y(cS)); g.stroke();
          g.fillStyle = f.ink; g.font = '12px IBM Plex Mono, monospace';
          g.fillText(`smoother: ${cS.toFixed(3)}/yr`, 54, ax.Y(cS) - 8);
          api.statsFn && api.statsFn();
        }
      },
      statsRefresh() {
        const el = api.stats(true); if (!el) return;
        const C = window.ULTRON_CONSUME;
        const resp = C.shockResponse(10, 0.05);
        const cmp = C.compareConsumers(60, 0.05, 3);
        el.innerHTML = `<div><span>one-off +10 raises c by</span><b>${resp.transitoryRise.toFixed(3)}</b></div>
          <div><span>permanent +10 raises c by</span><b>${resp.permanentRise.toFixed(3)}</b></div>
          <div><span>annuity share r/(1+r)</span><b>${resp.annuityShare.toFixed(4)}</b></div>
          <div><span>hand-to-mouth variance</span><b>${cmp.varHand.toFixed(3)}</b></div>
          <div><span>smoother variance</span><b>${cmp.varSmooth.toFixed(3)}</b></div>`;
      },
      state: st
    });
  }
})();
