/* ============================================================
   W04 · SKIPLISTS — ODS §4. A sorted list with coin-flipped
   express lanes. You flip the coins yourself, then watch a
   search ride the express and drop down like a subway rider.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { tower: '#5d4fe0', lane: '#d94f70', sentinel: '#5e5b82', found: '#0f9e8e', flash: '#c8920e', ghost: '#c9c9dd' };
  let api, sim;
  const st = { sl: null, seed: 7 };
  const GX = i => i * 1.9 - 12; // x by sorted position

  function towers() { return st.sl.snapshot().nodes; } // sorted by x

  function draw(hotId) {
    const ns = towers(), H = st.sl.snapshot().h;
    let vi = 0, li = 0, lk = 0;
    // sentinel tower
    for (let r = 0; r < H; r++) sim.vox.set(vi++, GX(-1), r + 0.5, 0, C.sentinel, 0.85, 0.85, 0.85);
    sim.labels.set(li++, GX(-1), H + 0.7, 0, '−∞', { color: '#5d5d75', size: 24 });
    // key towers
    ns.forEach((n, i) => {
      for (let r = 0; r < n.h; r++) {
        const hot = hotId === n.id && r === n.h - 1;
        sim.vox.set(vi++, GX(i), r + 0.5, 0, hot ? C.found : C.tower, 1.05, 0.88, 0.88);
      }
      sim.labels.set(li++, GX(i), n.h + 0.65, 0, String(n.x), { color: '#5d5d75', size: 26 });
    });
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    // lanes: at every level, chain towers (incl. sentinel) with h > r
    const atLevel = r => [{ id: -1, x: -Infinity, h: H, i: -1 }, ...ns.map((n, i) => ({ ...n, i }))]
      .filter(n => n.h > r);
    for (let r = 0; r < H; r++) {
      const chain = atLevel(r);
      for (let k = 0; k + 1 < chain.length; k++) {
        const a = chain[k], b = chain[k + 1];
        sim.links.set(lk++, [GX(a.i) + 0.55, r + 0.5, 0], [GX(b.i) - 0.55, r + 0.5, 0], r === 0 ? C.ghost : C.lane);
      }
    }
    sim.links.count(lk);
    sim.labels.set(70, 0, H + 2.2, 0, `${ns.length} keys · top level ${H}`, { color: '#5d5d75', size: 26, w: 12, h: 1 });
  }

  function searchAnim(x, done) {
    const ns = towers(), snapH = st.sl.snapshot().h;
    // simulated search from the sentinel, per level
    let cur = -1; // index into [-1 sentinel, ...ns] as position-1
    const posOf = k => (k === -1 ? -1 : k);
    let visits = 0;
    let r = snapH - 1;
    const path = [];
    let idx = -1; // current tower index in ns order (-1 sentinel)
    while (r >= 0) {
      const chain = [{ h: snapH, x: -Infinity, idx: -1 }, ...ns.map((n, i) => ({ ...n, idx: i }))].filter(n => n.h > r);
      let c = chain.find(n => n.idx === idx) || chain[0];
      // glide right
      while (true) {
        const nxt = chain[chain.indexOf(c) + 1];
        if (nxt && nxt.x < x) { c = nxt; visits++; path.push({ r, idx: c.idx }); }
        else break;
      }
      path.push({ r, idx: c.idx, drop: true });
      idx = c.idx;
      r--;
    }
    const last = path[path.length - 1];
    const found = ns[idx] && ns[idx].x === x;
    // animate the path
    let k = 0;
    const stepAnim = () => {
      if (k >= path.length) {
        if (found && idx >= 0) sim.pulse(idx + snapH + 1, 1200); // rough index of top block
        if (done) done(found, visits);
        return;
      }
      const p = path[k];
      // pulse the tower's block at level r: voxels run sentinel H first, then per key
      const base = snapH; // sentinel blocks
      const t = towers()[p.idx];
      if (p.idx >= 0 && t) {
        const vidx = base + ns.slice(0, p.idx).reduce((a, n) => a + n.h, 0) + Math.min(p.r, t.h - 1);
        sim.pulse(vidx, 350);
      } else sim.pulse(Math.min(p.r, snapH - 1), 350);
      k++;
      setTimeout(stepAnim, 300);
    };
    stepAnim();
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.sl = new DS.SkiplistSSet(st.seed);
    [10, 20, 30, 40, 50, 60].forEach(v => st.sl.add(v));
    sim.cam.view({ target: [0, 3, 0], r: 38, theta: -0.9, phi: 1.05 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>find</label><input type="range" id="sk-x" min="0" max="70" value="35" step="5"><output id="sk-x-o">35</output></div>
      <div class="btns">
        <button class="btn primary" id="sk-find">search</button>
        <button class="btn" id="sk-add">add a key</button>
        <button class="btn" id="sk-add10">add ×10</button>
        <button class="btn" id="sk-rm">remove found</button>
        <button class="btn" id="sk-new">new coins (reset)</button>
      </div>
      <p class="note">Every <b>add</b> flips coins for the new tower's height: keep flipping while you get heads. <b>search</b> rides the top lane right, drops a level when it overshoots.</p>`;
    $('#sk-x').oninput = e => $('#sk-x-o').textContent = e.target.value;
    $('#sk-find').onclick = () => searchAnim(+$('#sk-x').value, (found, visits) =>
      api.toast(found ? `found after ~${visits} glides — plus ${st.sl.snapshot().h} drops` : `not found — ${visits} glides, then the ground floor ends the ride`));
    const newKey = () => {
      const x = 5 + Math.floor(Math.random() * 65);
      st.sl.log = [];
      const ok = st.sl.add(x);
      if (st.sl.log.some(e => e.op === 'coin')) {
        const f = st.sl.log.find(e => e.op === 'coin');
        api.toast(`${x}: flipped ${f.flips.join('')} → height ${f.h}`);
      } else api.toast(ok ? `${x} added` : `${x} already present`);
      draw();
    };
    $('#sk-add').onclick = newKey;
    $('#sk-add10').onclick = () => { let k = 0; const iv = setInterval(() => { newKey(); if (++k >= 10) clearInterval(iv); }, 260); };
    $('#sk-rm').onclick = () => { const ns = towers(); const x = +$('#sk-x').value; const t = ns.find(n => n.x === x); if (t) { st.sl.remove(x); draw(); } else api.toast('nothing at that key'); };
    $('#sk-new').onclick = () => { st.sl = new DS.SkiplistSSet(++st.seed); [10, 20, 30, 40, 50, 60].forEach(v => st.sl.add(v)); draw(); };

    api.hint('Drag to spin · press search and watch: glide right, drop down, glide again');
    api.legend(`<b>Skiplist</b><div class="row"><span><i class="sw" style="background:${C.tower}"></i>key tower</span><span><i class="sw" style="background:${C.lane}"></i>express lane</span><span><i class="sw" style="background:${C.sentinel}"></i>sentinel −∞</span></div>`);
    api.why(`
      <p style="margin:0 0 8px"><b>The skiplist's bet:</b> keep a sorted list, but give ~½ the keys a lane to level 1, ~¼ to level 2, ⅛ to level 3… by <b>coin flips</b>. Search becomes an express ride: O(log n) <i>expected</i>.</p>
      <p style="margin:0 0 8px"><b>Why flips and not engineering?</b> Randomness needs no knowledge of the data — no adversarial input can degenerate it, and there is no rebalancing code to write or debug.</p>
      <p style="margin:0"><b>Same family:</b> treaps (W07) and universal hashing (W05) take the same bet. Redis sorted-sets and LevelDB memtables ship skiplist variants.</p>`);
    api.arena(`Design a skiplist end-to-end in <a href="arena/#trees">LC 1206 (design SkipList)</a>; the coin-flip reasoning returns in <a href="arena/#prob">randomized quickselect (LC 215)</a>.`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 4 · Skiplists', subtitle: 'Coin-flip express lanes over a sorted list',
      steps: [
        {
          say: `Recall World 3: searching a sorted linked list is a <b>walk</b> — every key, one hop. 1024 keys = up to 1024 hops.<br><br>
          A skiplist keeps that ground floor, but adds <b>express lanes</b> above it: lanes that skip several keys at a time — like a subway express line that only stops every few stations.`,
          task: 'Press <b>search</b> for 35. Watch the path: it rides the top lane, drops one level when the next tower overshoots, rides again.',
          hint: 'The red lanes are the express lines; the grey ground floor is the original sorted list.',
          okText: 'The ride never visits most towers: high lanes skip, low lanes place you exactly. The number of stops is what we care about next.',
          learn: ['w04-express']
        },
        {
          say: `Who decides which towers get express lanes? <b>Nobody. Coins do.</b><br><br>
          Every new key flips a coin: heads → build one more storey on your tower, flip again. Tails → stop. So:
          <span class="num">½</span> of towers are height 1, <span class="num">¼</span> height 2, <span class="num">⅛</span> height 3…`,
          task: 'Press <b>add a key</b> several times and read the coin flips in the toast: H means "build higher".',
          hint: 'Watch for a lucky streak: H, H, H builds a tall tower.',
          okText: 'Every tower\'s height is pure luck — independent of the data. That one property is the entire analysis: each level above holds ~half the keys, so each level halves the remaining ride. Expected search: O(log n).',
          learn: ['w04-coin']
        },
        {
          say: `Let's make that luck precise — this is the lab's first probability step, and the <b>Stats</b> page will train the whole toolkit.`,
          predict: {
            q: 'A new key flips: heads builds a storey and flips again; tails stops. What is the chance it reaches <b>height ≥ 4</b> (three heads in a row)?',
            placeholder: 'a fraction or percent…',
            grade: ans => {
              const t = ans.trim().toLowerCase().replace('%', '');
              const ok = ['1/8', '0.125', '12.5', '12%', '0,125', ',125'].includes(t) || (parseFloat(t) >= 11 && parseFloat(t) <= 13.5);
              return {
                right: ok,
                msg: ok
                  ? 'Right: (½)³ = <b>⅛ = 12.5%</b>. Each storey costs one independent heads. This geometric decay is why the lanes get sparser and the ride gets shorter.'
                  : 'Three heads in a row: ½ × ½ × ½ = <b>⅛ = 12.5%</b>. Each extra storey costs one more independent coin.'
              };
            }
          },
          learn: ['w04-geometric']
        },
        {
          say: `Now the payoff, with numbers you can defend in an interview:<br><br>
          <table class="perf"><tr><th>keys</th><th>expected stops ≈ 2·log₂n</th></tr>
          <tr><td class="mono">1,000</td><td class="mono">~20</td></tr>
          <tr><td class="mono">1,000,000</td><td class="mono">~40</td></tr>
          <tr class="hl"><td class="mono">1,000,000,000</td><td class="mono">~60</td></tr></table>
          A billion keys, sixty stops, <b>and not one line of rebalancing code</b>.`,
          task: 'Press <b>add ×10</b> twice, then <b>search</b> again — the ride still feels instant even with 26+ keys.',
          hint: 'The towers get denser, but the lanes multiply with them.',
          okText: 'Same express geometry at any size: halve, halve, halve. That is log₂ n — World 1\'s staircase wearing a subway uniform.',
          learn: ['w04-log-ride']
        },
        {
          say: `ODS makes one more point worth stealing: the skiplist is a <b>probability</b> answer to a <b>deterministic</b> problem.<br><br>
          Balanced trees (W07) get O(log n) by <i>enforcing</i> structure with rules; skiplists get it by <i>coin flips</i>. Same expected performance, wildly different engineering: no rotations, no color flips, no "which case am I in".<br><br>
          Trade: skiplists offer only <b>expected</b> bounds — a pathological run is possible, just vanishingly unlikely.`,
          learn: ['w04-vs-trees']
        },
        {
          say: `World 4 in one breath:<br><br>
          <b>Sorted list + coin-flip towers = expected O(log n) search, add and remove</b>, with code a fraction the size of a balanced tree.<br><br>
          Next: dropping the sortedness entirely — could we find things in <b>O(1)</b>? World 5 answers with arithmetic.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w04', id: 'w04-express', t: 'Express lanes', d: 'Extra pointer levels that skip keys. Ride high lanes far, drop down when you overshoot — subway thinking.' },
    { w: 'w04', id: 'w04-coin', t: 'Coin-flip heights', d: 'Heads: one more storey, flip again. Heights are geometric: ½ height 1, ¼ height 2, ⅛ height 3…' },
    { w: 'w04', id: 'w04-geometric', t: 'Geometric decay', d: 'P(height ≥ k) = (½)^(k−1). Independence from data is what makes analysis possible without knowing inputs.' },
    { w: 'w04', id: 'w04-log-ride', t: 'The O(log n) ride', d: 'Each level halves the remaining distance, so the ride is ~2·log₂ n stops — 60 stops for a billion keys.' },
    { w: 'w04', id: 'w04-vs-trees', t: 'Random vs enforced balance', d: 'Skiplists: expected bounds, no rebalancing code. Balanced trees: worst-case bounds, rule-driven repair. Both O(log n) where it counts.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w04', q: 'A tower reaches height 4 with probability…', opts: ['½', '¼', '⅛', '1/16'], a: 2, x: 'Three heads in a row: (½)³ = ⅛.' },
    { w: 'w04', q: 'Why coin flips instead of a fixed pattern (every 2nd key gets a lane)?', opts: ['Coins are faster', 'Any fixed pattern can be broken by adversarial data; random cannot', 'Patterns use more memory', 'They can\'t be combined'], a: 1, x: 'Randomized structure is data-independent — no input can degenerate it.' },
    { w: 'w04', q: 'Expected search cost in a skiplist with n keys:', opts: ['O(1)', 'O(log n)', 'O(√n)', 'O(n)'], a: 1, x: 'Each level halves the ride: ~2·log₂ n expected stops.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w04', tab: 'Skiplists', book: '§4',
    title: 'Skiplists — express lanes by coin flip',
    lede: 'A sorted list wearing randomized express lanes: ride high, drop low, land on your key in ~2·log₂ n stops. No rotations, no rules — just coins. <b>ODS §4.</b>',
    mount, story
  });
})();
