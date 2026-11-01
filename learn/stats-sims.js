/* ============================================================
   ULTRON LAB · stats-sims.js — the probability & statistics
   worlds. One 3D Galton board (Sim3D) + six crisp 2D canvas
   sims: law of large numbers, linearity of expectation, CLT,
   Bayes, the birthday paradox, variance. Every story follows
   the lab's loop: play → predict → name it.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  window.ULTRON_STATS = [];

  /* ---------- tiny canvas chart helper ---------- */
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

  /* ============================================================
     S1 · GALTON BOARD (3D)
     ============================================================ */
  {
    let api, sim, bins, balls, anim;
    const ROWS = 9, NBINS = 10;
    const st = { dropped: 0, history: [] };
    function pegPos(r, k) { return { x: (k - r / 2) * 2.0, y: 14 - r * 1.5, z: 0 }; }
    function drawBoard() {
      let vi = 0, lk = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let k = 0; k <= r; k++) {
          const p = pegPos(r, k);
          sim.vox.set(vi++, p.x, p.y, p.z, '#5e5b82', 0.5, 0.5, 0.5);
        }
      }
      // bin floors
      for (let b = 0; b < NBINS; b++) {
        sim.vox.set(vi++, (b - (NBINS - 1) / 2) * 2.0, 0.25, 0, '#c9c9dd', 1.8, 0.12, 2.4);
      }
      // stacked balls
      for (let b = 0; b < NBINS; b++) {
        for (let hgt = 0; hgt < bins[b]; hgt++) {
          sim.vox.set(vi++, (b - (NBINS - 1) / 2) * 2.0, 0.9 + hgt * 0.95, 0, '#5d4fe0', 0.82, 0.82, 0.82);
        }
      }
      // falling balls
      for (const ball of balls) {
        if (!ball.done) sim.vox.set(vi++, ball.x, ball.y, 0, '#d94f70', 0.82, 0.82, 0.82);
      }
      sim.vox.hideFrom(vi);
      sim.labels.set(0, 0, 16.5, 0, `dropped ${st.dropped} · left-right coin flips each peg`, { color: '#5d5d75', size: 26, w: 16, h: 1 });
    }
    function dropOne(cb) {
      const ball = { row: 0, x: 0, y: 15, path: [], bin: 0 };
      balls.push(ball);
      const step = () => {
        if (ball.row >= ROWS) {
          ball.bin = Math.round(ball.x / 2.0 + (NBINS - 1) / 2);
          ball.done = true; bins[Math.max(0, Math.min(NBINS - 1, ball.bin))]++;
          st.dropped++;
          drawBoard(); if (cb) cb();
          return;
        }
        const dir = Math.random() < 0.5 ? -1 : 1;
        ball.path.push(dir);
        ball.row++;
        ball.x += dir * 1.0;
        ball.y = 14 - ball.row * 1.5;
        drawBoard();
        anim = setTimeout(step, 110);
      };
      step();
    }
    window.ULTRON_STATS.push({
      id: 's1', tab: 'Galton', kind: '3d',
      title: 'Galton board — randomness becomes a bell',
      lede: 'Each ball takes 9 coin flips — left or right at every peg. No ball knows anything; yet a bell assembles underneath. This is where the whole subject begins.',
      mount(a) {
        api = a; sim = a.sim3d();
        bins = new Array(NBINS).fill(0); balls = []; st.dropped = 0;
        sim.cam.view({ target: [0, 7, 0], r: 36, theta: -0.7, phi: 1.15 });
        const c = api.controls();
        c.innerHTML = `
          <div class="btns">
            <button class="btn primary" id="gb1">drop a ball</button>
            <button class="btn" id="gb100">drop 100</button>
            <button class="btn" id="gbr">reset</button>
          </div>
          <p class="note">One ball = pure chance. A hundred balls = a shape. The bin counts will matter more than any single ball.</p>`;
        $('#gb1').onclick = () => dropOne();
        $('#gb100').onclick = () => { let k = 0; const iv = setInterval(() => { dropOne(); if (++k >= 100) clearInterval(iv); }, 28); };
        $('#gbr').onclick = () => { bins = new Array(NBINS).fill(0); balls = []; st.dropped = 0; drawBoard(); };
        drawBoard();
      },
      state: st,
      dropOne, getBins: () => bins
    });
  }

  /* ============================================================
     S2 · LAW OF LARGE NUMBERS (dice)
     ============================================================ */
  {
    let api, cv;
    const st = { rolls: [], mean: 0 };
    function roll(n) {
      for (let i = 0; i < n; i++) st.rolls.push(1 + Math.floor(Math.random() * 6));
      st.mean = st.rolls.reduce((a, b) => a + b, 0) / (st.rolls.length || 1);
    }
    function draw() {
      const f = chart(cv), { g, w, h, ink, muted, line, c1, c2, c3 } = f();
      const pad = 34;
      g.strokeStyle = line; g.strokeRect(pad, 8, w - pad - 8, h - 30);
      g.font = '11px "IBM Plex Mono", monospace';
      // y: 1..6
      const y = v => 8 + (6 - v) / 5 * (h - 38);
      for (let v = 1; v <= 6; v += 1) {
        g.fillStyle = muted; g.fillText(String(v), 10, y(v) + 3);
        g.strokeStyle = line; g.globalAlpha = .4;
        g.beginPath(); g.moveTo(pad, y(v)); g.lineTo(w - 8, y(v)); g.stroke(); g.globalAlpha = 1;
      }
      g.fillStyle = c2; g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(pad, y(3.5)); g.lineTo(w - 8, y(3.5)); g.stroke(); g.setLineDash([]);
      g.fillText('E[X] = 3.5', w - 80, y(3.5) - 5);
      // running mean line
      let sum = 0;
      g.strokeStyle = c1; g.lineWidth = 2; g.beginPath();
      st.rolls.forEach((v, i) => {
        sum += v; const m = sum / (i + 1);
        const x = pad + (i / Math.max(1, st.rolls.length - 1)) * (w - pad - 8);
        if (i === 0) g.moveTo(x, y(m)); else g.lineTo(x, y(m));
      });
      g.stroke(); g.lineWidth = 1;
      g.fillStyle = ink; g.font = '600 13px "IBM Plex Mono", monospace';
      g.fillText(`rolls ${st.rolls.length} · average ${st.mean.toFixed(3)}`, pad + 8, 22);
    }
    window.ULTRON_STATS.push({
      id: 's2', tab: 'LLN', kind: '2d',
      title: 'Law of large numbers — the average settles',
      lede: 'A die has no memory and no plan. Roll once: chaos. Roll a thousand times: the average locks onto 3.5 — the <em>expected value</em>. Watch it settle, slowly, honestly.',
      mount(a) {
        api = a; cv = a.canvas2d(); roll(1); draw();
        const c = api.controls();
        c.innerHTML = `
          <div class="btns">
            <button class="btn primary" id="r1">roll 1</button>
            <button class="btn" id="r100">roll 100</button>
            <button class="btn" id="r1000">roll 1,000</button>
            <button class="btn" id="rr">reset</button>
          </div>
          <p class="note">The line is your <b>running average</b>. It wobbles wildly early, then hones in — but never exactly. Settling ≠ stopping.</p>`;
        $('#r1').onclick = () => { roll(1); draw(); api.statsFn(); };
        $('#r100').onclick = () => { roll(100); draw(); api.statsFn(); };
        $('#r1000').onclick = () => { roll(1000); draw(); api.statsFn(); };
        $('#rr').onclick = () => { st.rolls = []; st.mean = 0; roll(0); draw(); api.statsFn(); };
      },
      state: st, draw, roll
    });
  }

  /* ============================================================
     S3 · LINEARITY + INDICATORS (coins) — ODS §1.3.4's example
     ============================================================ */
  {
    let api, cv;
    const st = { k: 10, flips: 0, heads: 0, lastHeads: 0, hist: new Array(64).fill(0) };
    function flipAll() {
      let heads = 0;
      const bits = [];
      for (let i = 0; i < st.k; i++) { const b = Math.random() < 0.5; if (b) heads++; bits.push(b); }
      st.flips++; st.heads += heads; st.lastHeads = heads;
      st.hist[Math.min(63, heads)]++;
      return { heads, bits };
    }
    function draw(bits) {
      const f = chart(cv), { g, w, h, ink, muted, line, c1, c2, c3 } = f();
      // coins row
      const n = st.k, cw = Math.min(46, (w - 20) / n);
      for (let i = 0; i < n; i++) {
        const x = 10 + i * cw + cw / 2, y = 34;
        const head = bits ? bits[i] : null;
        g.fillStyle = head ? c3 : line;
        g.beginPath(); g.arc(x, y, Math.min(15, cw / 2 - 3), 0, 7); g.fill();
        g.fillStyle = head ? '#fff' : muted; g.font = '600 12px "IBM Plex Mono", monospace'; g.textAlign = 'center';
        g.fillText(head ? 'H' : 'T', x, y + 4); g.textAlign = 'left';
      }
      g.fillStyle = ink; g.font = '600 13px "IBM Plex Mono", monospace';
      g.fillText(`rounds ${st.flips} · last round: ${st.lastHeads} heads of ${st.k}`, 12, 76);
      g.fillStyle = muted; g.font = '11.5px "IBM Plex Sans"'; g.fillText(`E[Iᵢ] = ½ each → E[heads] = Σ E[Iᵢ] = ${st.k}/2 = ${st.k / 2} — no matter how the coins correlate`, 12, 94);
      // histogram of heads
      const maxC = Math.max(1, ...st.hist);
      const bw = (w - 20) / 64;
      for (let i = 0; i < 64; i++) {
        if (!st.hist[i]) continue;
        const bh = st.hist[i] / maxC * (h - 140);
        g.fillStyle = c2; g.fillRect(10 + i * bw, h - 16 - bh, bw - 1, bh);
      }
      g.fillStyle = muted; g.font = '11px "IBM Plex Mono", monospace';
      g.fillText('how many heads per round (all history)', 12, h - 4);
      g.fillStyle = c1; g.fillText('· expected ' + st.k / 2, 210, h - 4);
    }
    window.ULTRON_STATS.push({
      id: 's3', tab: 'Expectation', kind: '2d',
      title: 'Linearity of expectation — count without counting',
      lede: 'How many heads in 10 flips? You could enumerate 1,024 outcomes… or split the question into 10 questions of ½ each and add. Linearity of expectation is the cheapest superpower in mathematics.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw();
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>coins k</label><input type="range" id="ek" min="1" max="40" value="10"><output id="eko">10</output></div>
          <div class="btns">
            <button class="btn primary" id="ef">flip all</button>
            <button class="btn" id="ef100">×100 rounds</button>
            <button class="btn" id="er">reset</button>
          </div>
          <p class="note">This is ODS §1.3.4's exact example — the one the book uses to set up randomized data structures (W04's coins, W05's universal hashing, W07's treaps).</p>`;
        $('#ek').oninput = e => { st.k = +e.target.value; $('#eko').textContent = st.k; draw(); };
        $('#ef').onclick = () => { const r = flipAll(); draw(r.bits); api.statsFn(); };
        $('#ef100').onclick = () => {
          let k2 = 0; const iv = setInterval(() => { const r = flipAll(); draw(r.bits); api.statsFn(); if (++k2 >= 100) clearInterval(iv); }, 30);
        };
        $('#er').onclick = () => { st.flips = 0; st.heads = 0; st.hist = new Array(64).fill(0); draw(); api.statsFn(); };
      },
      state: st, draw, flipAll
    });
  }

  /* ============================================================
     S4 · CENTRAL LIMIT THEOREM
     ============================================================ */
  {
    let api, cv;
    const st = { m: 5, sums: [], trials: 0 };
    function trial() {
      let s = 0; for (let i = 0; i < st.m; i++) s += 1 + Math.floor(Math.random() * 6);
      st.sums.push(s); st.trials++;
    }
    function draw() {
      const f = chart(cv), { g, w, h, ink, muted, line, c1, c2, c3 } = f();
      const lo = st.m, hi = st.m * 6;
      const counts = new Array(hi - lo + 1).fill(0);
      st.sums.forEach(s => counts[s - lo]++);
      const maxC = Math.max(1, ...counts);
      const bw = (w - 30) / counts.length;
      counts.forEach((c2v, i) => {
        const bh = c2v / maxC * (h - 60);
        g.fillStyle = c2; g.fillRect(15 + i * bw, h - 34 - bh, Math.max(1, bw - 2), bh);
        if (counts.length <= 22) { g.fillStyle = muted; g.font = '10px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.fillText(String(lo + i), 15 + i * bw + bw / 2, h - 18); }
      });
      g.textAlign = 'left';
      // normal overlay
      const mu = 3.5 * st.m, sig = Math.sqrt(35 / 12 * st.m);
      if (st.trials > 30 && sig > 0) {
        g.strokeStyle = c1; g.lineWidth = 2; g.beginPath();
        for (let px = 0; px <= w - 30; px += 2) {
          const x = lo + px / (w - 30) * (hi - lo);
          const dens = Math.exp(-((x - mu) ** 2) / (2 * sig * sig)) / (sig * Math.sqrt(2 * Math.PI));
          const yv = h - 34 - dens * (st.trials * (hi - lo) / (w - 30)) / maxC * (h - 60);
          if (px === 0) g.moveTo(15 + px, yv); else g.lineTo(15 + px, yv);
        }
        g.stroke(); g.lineWidth = 1;
      }
      g.fillStyle = ink; g.font = '600 13px "IBM Plex Mono", monospace';
      g.fillText(`sum of ${st.m} dice · ${st.trials} trials · mean ${(st.sums.reduce((a, b) => a + b, 0) / (st.trials || 1)).toFixed(1)} vs theory 3.5×${st.m} = ${(3.5 * st.m).toFixed(1)}`, 15, 20);
      g.fillStyle = muted; g.font = '11.5px "IBM Plex Sans"';
      g.fillText(st.trials > 30 ? 'the red curve is the normal distribution the CLT promises — no dice were consulted' : 'run ~200 trials to reveal the bell', 15, 38);
    }
    window.ULTRON_STATS.push({
      id: 's4', tab: 'CLT', kind: '2d',
      title: 'Central limit theorem — why bells are everywhere',
      lede: 'Sum 5 dice: still lumpy randomness. Sum 500 such rounds into a histogram: a bell, always, whatever the source. The theorem that lets the whole world assume normality.',
      mount(a) {
        api = a; cv = a.canvas2d(); draw();
        const c = api.controls();
        c.innerHTML = `
          <div class="ctl"><label>dice per sum m</label><input type="range" id="cm" min="1" max="12" value="5"><output id="cmo">5</output></div>
          <div class="btns">
            <button class="btn primary" id="c1t">run a trial</button>
            <button class="btn" id="c200">run 200</button>
            <button class="btn" id="c2000">run 2,000</button>
            <button class="btn" id="cr">reset</button>
          </div>
          <p class="note">Try <b>m = 1</b> (flat — a single die has no bell) and watch the bell emerge as m grows. Bells come from <i>adding</i>, not from dice.</p>`;
        $('#cm').oninput = e => { st.m = +e.target.value; $('#cmo').textContent = st.m; st.sums = []; st.trials = 0; draw(); };
        $('#c1t').onclick = () => { trial(); draw(); api.statsFn(); };
        $('#c200').onclick = () => { for (let i = 0; i < 200; i++) trial(); draw(); api.statsFn(); };
        $('#c2000').onclick = () => { for (let i = 0; i < 2000; i++) trial(); draw(); api.statsFn(); };
        $('#cr').onclick = () => { st.sums = []; st.trials = 0; draw(); api.statsFn(); };
      },
      state: st, draw, trial
    });
  }

})();
