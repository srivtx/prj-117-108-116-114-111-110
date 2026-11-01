/* ============================================================
   W07 · BALANCE — ODS §7–9. Rotations repair shape; randomness
   (the treap) or rules (red-black) decides when to rotate.
   You rotate by hand, beat the sorted-stick with a treap, and
   read a red-black tree as 2-3 crates splitting and merging.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { node: '#5d4fe0', edge: '#a0a0b8', hot: '#d94f70', ok: '#0f9e8e', red: '#d94f70', black: '#2b2946', crate: '#c8920e', ghost: '#c9c9dd' };
  let api, sim;
  const st = { mode: 'treap', treap: null, rb: null };
  const hand = { active: false, taps: 0 };

  function layoutFromRoot(root, isRB) {
    const pos = new Map();
    let idx = 0;
    const walk = (n, d) => {
      if (!n) return;
      walk(n.left, d + 1);
      pos.set(n.id, { x: idx++, y: d, node: n });
      walk(n.right, d + 1);
    };
    walk(root, 0);
    const n = pos.size;
    const spacing = Math.max(1.6, Math.min(3.4, 26 / Math.max(1, n)));
    for (const p of pos.values()) {
      p.px = (p.x - (n - 1) / 2) * spacing;
      p.py = 7 - p.y * 1.8;
    }
    return pos;
  }

  function draw(hotId) {
    if (st.mode === 'treap') drawTreap(hotId); else drawRB(hotId);
    stats();
  }

  function drawTreap(hotId) {
    const pos = layoutFromRoot(st.treap.r);
    let vi = 0, li = 0, lk = 0;
    for (const p of pos.values()) {
      for (const c of [p.node.left, p.node.right]) {
        if (c && pos.has(c.id)) sim.links.set(lk++, [p.px, p.py - 0.6, 0], [pos.get(c.id).px, pos.get(c.id).py + 0.6, 0], C.edge);
      }
    }
    sim.links.count(lk);
    for (const p of pos.values()) {
      const tall = 0.9 + (1 - p.node.pri) * 1.5; // small priority (heap-top) = tall
      sim.vox.set(vi++, p.px, p.py, 0, hotId === p.node.id ? C.hot : C.node, 1.1, tall, 1.1);
      sim.labels.set(li++, p.px, p.py + 1.15, 0, `${p.node.x}·${p.node.pri.toFixed(2)}`, { color: '#ffffff', size: 24 });
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(70, 0, 9.4, 0, `treap · ${st.treap.size()} keys · depth ${st.treap.depth()}`, { color: '#5d5d75', size: 26, w: 12, h: 1 });
    api.legend(`<b>Treap</b><div class="row"><span>key·priority — height ∝ priority rank</span></div><div class="row">BST by key · min-heap by priority · tall blocks want to be near the root</div>`);
  }

  function drawRB(hotId) {
    const pos = layoutFromRoot(st.rb.r, true);
    let vi = 0, li = 0, lk = 0;
    // edges: red links drawn warm & thick-feeling (double line), black links cool
    for (const p of pos.values()) {
      for (const c of [p.node.left, p.node.right]) {
        if (c && pos.has(c.id)) {
          const col = c.color === DS.RED ? C.red : C.edge;
          sim.links.set(lk++, [p.px, p.py - 0.6, 0], [pos.get(c.id).px, pos.get(c.id).py + 0.6, 0], col);
          if (c.color === DS.RED) sim.links.set(lk++, [p.px, p.py - 0.75, 0], [pos.get(c.id).px, pos.get(c.id).py + 0.5, 0], col);
        }
      }
    }
    sim.links.count(lk);
    // 2-3 crates: black node + its red LEFT child share a crate
    const crates = [];
    for (const p of pos.values()) {
      if (p.node.color === DS.BLACK || !pos.has(p.node.id)) {
        const l = p.node.left;
        if (l && l.color === DS.RED && pos.has(l.id)) crates.push([pos.get(l.id), p]);
        else crates.push([p]);
      }
    }
    for (const cr of crates) {
      const xs = cr.map(p => p.px);
      const lo = Math.min(...xs) - 1.05, hi = Math.max(...xs) + 1.05;
      sim.vox.set(vi++, (lo + hi) / 2, cr[0].py - 0.55, -0.9, C.crate, hi - lo, 0.18, 1.7);
    }
    for (const p of pos.values()) {
      if (p.node.color !== DS.BLACK) continue; // draw black nodes only; reds drawn on their crate
    }
    for (const p of pos.values()) {
      const col = p.node.color === DS.RED ? C.red : C.black;
      sim.vox.set(vi++, p.px, p.py, 0, hotId === p.node.id ? C.hot : col, 1.1, 1.1, 1.1);
      sim.labels.set(li++, p.px, p.py + 1.1, 0, String(p.node.x), { color: '#ffffff', size: 30 });
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(70, 0, 9.4, 0, `red-black · ${st.rb.size()} keys · depth ${st.rb.depth()} ≤ 2·log₂(n+1)`, { color: '#5d5d75', size: 26, w: 15, h: 1 });
    api.legend(`<b>Red-black = a 2-3 tree in disguise</b><div class="row"><span><i class="sw" style="background:${C.red}"></i>red = glued to parent (one crate)</span><span><i class="sw" style="background:${C.black}"></i>black = real separator</span><span><i class="sw" style="background:${C.crate}"></i>2-3 crate</span></div>`);
  }

  function stats() {
    const el = api.stats(true); el.innerHTML = '';
    const mk = (l, v, cls) => { const d = document.createElement('div'); d.innerHTML = `<span>${l}</span><b class="${cls || ''}">${v}</b>`; el.appendChild(d); };
    if (st.mode === 'treap') {
      const n = st.treap.size(), d = st.treap.depth();
      mk('keys', n);
      mk('depth', d);
      const ratio = d <= 1 ? 0 : (d / Math.max(1, Math.log2(n))).toFixed(2);
      mk('depth / log₂n', ratio, ratio < 2.4 ? 'ok' : 'no');
    } else {
      const n = st.rb.size(), d = st.rb.depth();
      mk('keys', n);
      mk('depth', d);
      const ratio = d <= 1 ? 0 : (d / Math.max(1, Math.log2(n))).toFixed(2);
      mk('depth / log₂n', ratio, ratio < 2.4 ? 'ok' : 'no');
    }
  }

  function narrate(log, label) {
    const rots = log.filter(e => e.op === 'rotate').length;
    const splits = log.filter(e => e.op === 'split' || e.op === 'rotate').length;
    const flips = log.filter(e => e.op === 'split').length;
    if (rots) api.toast(`${label}: ${rots} rotation${rots > 1 ? 's' : ''}${flips ? ` + ${flips} color flip${flips > 1 ? 's' : ''}` : ''} — the tree repaired itself`);
    else if (flips) api.toast(`${label}: ${flips} color flip${flips > 1 ? 's' : ''} (a 4-node split) — no rotation needed`);
    else api.toast(`${label}: no repair needed`);
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.treap = new DS.Treap(7); st.rb = new DS.RedBlack();
    [50, 30, 70, 20, 40, 80].forEach(v => { st.treap.add(v); st.rb.add(v); });
    sim.cam.view({ target: [0, 3.6, 0], r: 36, theta: -0.85, phi: 1.1 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>structure</label>
        <div class="seg" id="b-mode">
          <button data-m="treap" aria-pressed="true">Treap</button>
          <button data-m="rb">Red-black</button>
        </div><span></span></div>
      <div class="ctl"><label>value</label><input type="range" id="b-v" min="1" max="99" value="42"><output id="b-v-o">42</output></div>
      <div class="btns">
        <button class="btn primary" id="b-add">insert</button>
        <button class="btn" id="b-sorted">insert 1..15 sorted</button>
        <button class="btn" id="b-shuf">insert ×15 shuffled</button>
        <button class="btn" id="b-clear">clear</button>
      </div>
      <p class="note">The honest metric is <b>depth / log₂n</b>: a perfectly balanced tree scores ~1, a stick scores n/log n. Watch it refuse to explode on sorted input.</p>`;
    $('#b-mode').querySelectorAll('button').forEach(b => b.onclick = () => {
      $('#b-mode').querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true'); st.mode = b.dataset.m; draw();
    });
    $('#b-v').oninput = e => $('#b-v-o').textContent = e.target.value;
    $('#b-add').onclick = () => {
      const x = +$('#b-v').value;
      if (st.mode === 'treap') { st.treap.log = []; st.treap.add(x); narrate(st.treap.log, `insert ${x}`); }
      else { st.rb.log = []; st.rb.add(x); narrate(st.rb.log, `insert ${x}`); }
      draw();
    };
    const seqAdd = (vals, getT) => {
      let k = 0;
      const iv = setInterval(() => {
        const t = getT();
        t.log = []; t.add(vals[k]);
        narrate(t.log, `insert ${vals[k]}`);
        draw();
        if (++k >= vals.length) clearInterval(iv);
      }, 420);
    };
    $('#b-sorted').onclick = () => {
      if (st.mode === 'treap') { st.treap = new DS.Treap(11); seqAdd([...Array(15).keys()].map(v => v + 1), () => st.treap); }
      else { st.rb = new DS.RedBlack(); seqAdd([...Array(15).keys()].map(v => v + 1), () => st.rb); }
    };
    $('#b-shuf').onclick = () => {
      const vals = DS.shuffle([...Array(15).keys()].map(v => v + 1), DS.mulberry32(Date.now() & 0xffff));
      if (st.mode === 'treap') { st.treap = new DS.Treap(13); seqAdd(vals, () => st.treap); }
      else { st.rb = new DS.RedBlack(); seqAdd(vals, () => st.rb); }
    };
    $('#b-clear').onclick = () => { st.treap = new DS.Treap(17); st.rb = new DS.RedBlack(); draw(); };

    api.hint('Drag to spin · sorted input is the torture test — press it and watch depth stay logarithmic');
    api.why(`
      <p style="margin:0 0 8px"><b>Balance = repair after every update.</b> Two repair strategies, both O(log n): the <b>treap</b> rotates when a random priority is violated (expected bounds, ~15 lines); the <b>red-black tree</b> follows color rules isomorphic to 2-3/2-4 node splits (worst-case ≤ 2·log₂(n+1) bound, ~100 lines).</p>
      <p style="margin:0 0 8px"><b>Why rotations are legal:</b> they only rewire 3 pointers and never change the <i>in-order sequence</i> — the sorted meaning is untouchable; only shape changes.</p>
      <p style="margin:0"><b>Where you'll meet them:</b> C++ <code>std::map</code>, Java <code>TreeMap</code> and Linux's CFS scheduler run red-black trees; treaps power randomized sets and priority queues-with-search.</p>`);
    api.arena(`Balance questions: <a href="arena/#trees">LC 110 balanced tree check</a>, <a href="arena/#trees">LC 108 sorted array → balanced BST</a>, <a href="arena/#trees">LC 1382 balance a BST</a> — and whiteboard classic: "rotate this node left; what happens to in-order?"`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 7 · Balance', subtitle: 'Repair the shape, keep the order',
      steps: [
        {
          say: `World 6 ended on a stick: sorted input, depth n. Balance is the cure, and the cure is one move: the <b>rotation</b>.<br><br>
          A rotation promotes one child and demotes one parent — 3 pointer rewrites — while the <b>in-order sequence stays identical</b>. The sorted meaning cannot change; only the shape does.<br><br>
          On the left is a 3-key stick (1 → 2 → 3). <b>You</b> rotate.`,
          reset() {
            sim.clearPicks();
            // rigged treap: priorities force a right chain 1-2-3
            st.treap = new DS.Treap(3);
            st.mode = 'treap';
            // seed so priorities come out decreasing: 1 gets 0.9, 2 gets 0.7, 3 gets 0.6
            let tries = 0;
            while (tries++ < 500) {
              const t = new DS.Treap(tries);
              t.add(1); t.add(2); t.add(3);
              if (t.r.x === 1 && t.depth() === 3) { st.treap = t; break; }
            }
            hand.active = true; hand.taps = 0;
            draw();
            sim.onPick(i => {
              if (!hand.active) return;
              const pos = layoutFromRoot(st.treap.r);
              const ids = [...pos.keys()];
              const node = st.treap.nodesList().find(n => n.id === ids[i]);
              if (!node) return;
              if (node.x !== 2) { api.toast('Rotate the MIDDLE node (2) up — it becomes the new root.'); return; }
              hand.active = false; hand.taps = 1;
              st.treap.rotateUp(node);
              draw(node.id);
              api.toast('rotated: 2 took the throne — depth 3 → 2, in-order still 1,2,3');
            });
          },
          task: 'Tap node <b>2</b> (the middle of the stick) to rotate it up to the root.',
          hint: 'The node labeled 2·priority — its block sits between 1 and 3.',
          wait: () => hand.taps >= 1,
          okText: 'One rotation, depth 3 → 2, and an in-order walk still reads 1, 2, 3. Rotations are <b>shape surgery with zero meaning change</b> — that\'s why every balanced tree is built from them.',
          learn: ['w07-rotation']
        },
        {
          say: `So we rotate — but <b>who decides when?</b> ODS §7's answer: <b>randomness</b>. The <b>treap</b> gives every key a random priority and demands TWO invariants at once:<br><br>
          BST by <b>key</b> (in-order sorted) · min-heap by <b>priority</b> (smallest priority on top).<br><br>
          Each insert walks down like a BST, then <b>rotates up while its priority beats its parent's</b>. Block heights show priority — taller wants to be higher.`,
          task: 'Press <b>insert</b> a few times at different values. Watch new keys bubble up with rotations until the heap rule holds.',
          hint: 'The toast counts rotations after each insert.',
          okText: 'The two rules fight to a draw: keys keep order, priorities keep shape. The result behaves like a <b>random BST</b> — expected depth 1.39·log₂ n — no matter WHAT order you feed it.',
          learn: ['w07-treap']
        },
        {
          say: `The torture test. Sorted input killed the plain BST (depth 15 for 15 keys).`,
          predict: {
            q: 'Insert <b>1..15 in sorted order</b> into an empty <b>treap</b>. Roughly what depth do you expect?',
            placeholder: '≈ 4..8…',
            grade: ans => {
              const v = parseInt(ans, 10);
              const ok = v >= 4 && v <= 8;
              return {
                right: ok,
                msg: ok
                  ? `Yes — random priorities make sorted keys land like shuffled keys: expected depth ≈ <b>1.39·log₂15 ≈ 5.4</b>. Now run it and check the depth/log₂n stat ≈ 1.4–1.8.`
                  : `Random priorities detach shape from input order: expected depth ≈ <b>1.39·log₂15 ≈ 5.4</b> (anything 4–8 for one run). Run it — the stat depth/log₂n should read ~1.4–1.8, not 15/3.9 ≈ 3.8.`
              };
            }
          },
          learn: ['w07-expected']
        },
        {
          say: `Proof by running: <b>insert 1..15 sorted</b> on a treap — the exact input that made a stick in World 6.`,
          task: 'Press <b>insert 1..15 sorted</b> and watch the depth / log₂n stat.',
          hint: 'Rotations fire constantly; the tree refuses to become a stick.',
          okText: 'Depth ~5 for 15 sorted keys — versus 15 for the plain BST. Same input, same interface, opposite outcome. That is the entire value proposition of balanced trees.',
          learn: ['w07-expected']
        },
        {
          say: `The treap gives <b>expected</b> O(log n). Red-black trees give a <b>guarantee</b>: depth ≤ 2·log₂(n+1), always, adversarial input or not.<br><br>
          Switch to <b>Red-black</b> mode. Our implementation is the <b>left-leaning</b> variant (Sedgewick): it is secretly a <b>2-3 tree</b> — the gold crates. A red node is <b>glued to its parent</b>: one crate, two keys. When a crate would overflow (insert 3 keys), it <b>splits</b>: color-flip — the middle key rises, red links turn black.`,
          task: 'In Red-black mode press <b>insert</b> at several values until you see a gold crate hold two keys, and a toast announce a color flip (crate split).',
          hint: 'Color flips happen when a crate\'s two halves both fill — watch for "split" in the toast.',
          okText: 'A 2-3 tree with rule-based splitting = a red-black tree with colors. Two totally different stories — <i>random priorities</i> vs <i>node-splitting rules</i> — both landing at logarithmic depth. ODS §9 tells the 2-4 version of the same story.',
          learn: ['w07-redblack', 'w07-23']
        },
        {
          say: `Run the torture test on red-black too — then compare the philosophies:`,
          task: 'In Red-black mode: <b>insert 1..15 sorted</b>, then read the depth / log₂n stat.',
          hint: 'It should stay under ~2.0 — that\'s the guarantee at work.',
          okText: 'Guaranteed ≤ 2·log₂(n+1). In practice both read ~1.3–1.7. The choice is engineering taste: expected + tiny code (treap) vs guaranteed + real code (red-black).',
          learn: ['w07-guarantee']
        },
        {
          say: `World 7 in one breath:<br><br>
          <b>Rotations repair shape without touching meaning.</b> Treaps decide with coins; red-black trees decide with rules that are 2-3/2-4 splits in disguise; skiplists skipped the tree entirely.<br><br>
          All three roads lead to O(log n) find/add/remove on sorted data. Next: dropping the "sorted" requirement — who's next in line? The heap.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w07', id: 'w07-rotation', t: 'Rotation', d: 'Promote a child, demote its parent: 3 pointer rewrites, in-order sequence unchanged. The atom of all rebalancing.' },
    { w: 'w07', id: 'w07-treap', t: 'Treap', d: 'BST by key + min-heap by random priority. Inserts rotate up until both hold; shape behaves like a random BST regardless of input.' },
    { w: 'w07', id: 'w07-expected', t: 'Expected vs worst case', d: 'Treap: expected 1.39·log₂ n depth, any input. Red-black: guaranteed ≤ 2·log₂(n+1).' },
    { w: 'w07', id: 'w07-redblack', t: 'Red-black tree', d: 'BST + one color bit per node, with invariants that force depth ≤ 2·log₂(n+1). Powers std::map, TreeMap, Linux CFS.' },
    { w: 'w07', id: 'w07-23', t: 'The 2-3 disguise', d: 'Red child = glued to its parent: one crate, 2 keys. Crate overflow → color-flip split, middle key rises. (ODS §9 tells the 2-4 flavor.)' },
    { w: 'w07', id: 'w07-guarantee', t: 'Why libraries pick red-black', d: 'Worst-case bounds for real-time systems + delete works (treap delete is easy too, but the guarantee sells).' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w07', q: 'A rotation changes…', opts: ['the in-order sequence', 'only the shape — in-order is preserved', 'the keys stored', 'nothing at all'], a: 1, x: 'Sorted meaning is untouchable; only parent/child roles change.' },
    { w: 'w07', q: 'A treap keeps two invariants at once:', opts: ['sorted by key + min-heap by random priority', 'two BSTs', 'colors + keys', 'left and right balanced'], a: 0, x: 'Keys own the order; random priorities own the shape.' },
    { w: 'w07', q: 'In the 2-3 view, a red child means…', opts: ['it is about to be deleted', 'it is glued to its parent — one multi-key node', 'it has higher priority', 'it is the root'], a: 1, x: 'Red links are inside-node glue; black links are real separators. A split = color flip.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w07', tab: 'Balance', book: '§7–9',
    title: 'Balance — rotations, coins and rules',
    lede: 'The stick problem meets its cure: rotations repair shape without touching meaning. Coins (treaps) or rules (red-black = 2-3 trees in disguise) decide when to rotate. <b>ODS §7–9.</b>',
    mount, story
  });
})();
