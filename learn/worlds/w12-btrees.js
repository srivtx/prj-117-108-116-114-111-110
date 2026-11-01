/* ============================================================
   W12 · B-TREES — ODS §14. When reads come in blocks (disk,
   SSD, memory pages), a node should be as big as a block. Crates
   of keys, splits that fly the median up, and heights that
   collapse from 20 to 3 — this is the database index.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { crate: '#c8920e', key: '#5d4fe0', hot: '#d94f70', ok: '#0f9e8e', ghost: '#c9c9dd', up: '#d94f70' };
  let api, sim;
  const st = { bt: null, B: 3, seq: 1 };
  const hand = { active: false, descents: 0, need: 3 };

  function layout() {
    // in-order slot index → x, depth → y
    const pos = new Map();
    const measure = node => {
      if (node.leaf) return node.keys.length + 0.6;
      let w = 0; for (const c of node.children) w += measure(c);
      return w;
    };
    const assign = (node, depth, x0, w) => {
      pos.set(node.id, { node, depth, cx: x0 + w / 2, w });
      if (node.leaf) return;
      let cx = x0;
      for (const c of node.children) {
        const cw = measure(c);
        assign(c, depth + 1, cx, cw);
        cx += cw;
      }
    };
    assign(st.bt.root, 0, 0, measure(st.bt.root));
    for (const p of pos.values()) { p.px = (p.cx - measure(st.bt.root) / 2) * 1.5; p.py = 10.5 - p.depth * 3.2; }
    return pos;
  }

  function draw(hotId) {
    const pos = layout();
    let vi = 0, li = 0, lk = 0;
    // edges (parent crate bottom → child crate top)
    for (const p of pos.values()) {
      if (p.node.leaf) continue;
      p.node.children.forEach((c, k) => {
        const q = pos.get(c.id); if (!q) return;
        sim.links.set(lk++, [p.px + (k - (p.node.children.length - 1) / 2) * 1.1, p.py - 1.1, 0], [q.px, q.py + 1.6, 0], C.ghost);
      });
    }
    sim.links.count(lk);
    for (const p of pos.values()) {
      const isHot = hotId === p.node.id;
      const wdt = Math.max(1.6, p.node.keys.length * 1.35 + 0.8);
      sim.vox.set(vi++, p.px, p.py, 0, isHot ? C.hot : C.crate, wdt, 1.9, 2.1);
      p.node.keys.forEach((k, j) => {
        sim.vox.set(vi++, p.px - wdt / 2 + 0.75 + j * 1.35, p.py + 0.45, 0.6, C.key, 1.05, 1.05, 1.05);
        sim.labels.set(li++, p.px - wdt / 2 + 0.75 + j * 1.35, p.py + 1.5, 0.6, String(k), { color: '#ffffff', size: 26 });
      });
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    const snap = st.bt.snapshot();
    const maxD = Math.max(...snap.nodes.map(n => n.depth));
    sim.labels.set(70, 0, 12.8, 0, `${st.bt.size()} keys · ${snap.nodes.length} blocks · height ${maxD + 1} · B = ${st.B} (max ${2 * st.B - 1} keys/block)`, { color: '#5d5d75', size: 24, w: 24, h: 1 });
    api.legend(`<b>B-tree</b><div class="row"><span><i class="sw" style="background:${C.crate}"></i>block (one disk read)</span><span><i class="sw" style="background:${C.key}"></i>key</span><span><i class="sw" style="background:${C.hot}"></i>being read</span></div><div class="row">sorted keys per block · all leaves at equal depth</div>`);
    stats();
  }

  function stats() {
    const el = api.stats(true); el.innerHTML = '';
    const mk = (l, v, cls) => { const d = document.createElement('div'); d.innerHTML = `<span>${l}</span><b class="${cls || ''}">${v}</b>`; el.appendChild(d); };
    const snap = st.bt.snapshot();
    const maxD = Math.max(...snap.nodes.map(n => n.depth));
    mk('keys', st.bt.size());
    mk('blocks', snap.nodes.length);
    mk('reads/find', maxD + 1, 'ok');
    mk('BST would read', st.bt.size() ? Math.ceil(Math.log2(st.bt.size() + 1)) : 0, 'no');
  }

  function findAnim(x) {
    let node = st.bt.root, reads = 0;
    const step = () => {
      const pos = layout();
      const ids = [...pos.keys()];
      const entry = pos.get(node.id);
      const vidx = ids.indexOf(node.id);
      sim.pulse(vidx, 520);
      reads++;
      let i = node.keys.findIndex(k => k >= x);
      if (i >= 0 && node.keys[i] === x) { draw(node.id); api.toast(`block read #${reads}: key ${x} is in THIS block`); return; }
      if (node.leaf) { draw(); api.toast(`block read #${reads}: leaf reached, no ${x} — absent in ${reads} reads`); return; }
      const next = node.children[i < 0 ? node.keys.length : i];
      api.toast(`block read #${reads}: ${x} is ${i < 0 ? 'past the last key' : 'before key ' + node.keys[Math.max(0, i)]} → descend`);
      node = next;
      setTimeout(step, 900);
    };
    step();
  }

  function addSeq(n) {
    let k = 0;
    const iv = setInterval(() => {
      const x = st.seq++;
      st.bt.log = [];
      st.bt.add(x);
      const split = st.bt.log.find(e => e.op === 'split' || e.op === 'rootsplit');
      draw(split ? split.parent || null : null);
      if (split) {
        const up = split.up !== undefined ? split.up : '';
        api.toast(`${x} added — block overflowed → split, median ${up} flies up${st.bt.log.some(e => e.op === 'rootsplit') ? ' (new root!)' : ''}`);
        sim.pulse(0, 900);
      }
      if (++k >= n) clearInterval(iv);
    }, 620);
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.bt = new DS.BTree(3);
    sim.cam.view({ target: [0, 4.5, 0], r: 44, theta: -0.75, phi: 1.08 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>B (block size)</label>
        <div class="seg" id="bt-b">
          <button data-b="2">B=2</button><button data-b="3" aria-pressed="true">B=3</button><button data-b="4">B=4</button>
        </div><span></span></div>
      <div class="ctl"><label>find x</label><input type="range" id="bt-x" min="1" max="60" value="10"><output id="bt-x-o">10</output></div>
      <div class="btns">
        <button class="btn primary" id="bt-add">insert next</button>
        <button class="btn" id="bt-add10">insert ×10</button>
        <button class="btn" id="bt-find">search (count reads)</button>
        <button class="btn" id="bt-clear">clear</button>
      </div>
      <p class="note">Each crate is <b>one block read</b> — a fixed ~µs-scale cost whether it holds 1 key or 100. The "reads/find" stat is the whole story; compare it with the BST column.</p>`;
    $('#bt-b').querySelectorAll('button').forEach(b => b.onclick = () => {
      $('#bt-b').querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true');
      st.B = +b.dataset.b; st.bt = new DS.BTree(st.B); st.seq = 1; draw();
    });
    $('#bt-x').oninput = e => $('#bt-x-o').textContent = e.target.value;
    $('#bt-add').onclick = () => {
      const x = st.seq++;
      st.bt.log = []; st.bt.add(x);
      const split = st.bt.log.find(e => e.op === 'split' || e.op === 'rootsplit');
      draw(split ? (split.parent || null) : null);
      if (split) api.toast(`${x} — overflow! median ${split.up} promoted${st.bt.log.some(e => e.op === 'rootsplit') ? ' and a NEW ROOT appeared (tree grew one level taller)' : ''}`);
      else api.toast(`${x} slid into a block with room — 1 read to find the block, 1 write`);
    };
    $('#bt-add10').onclick = () => addSeq(10);
    $('#bt-find').onclick = () => findAnim(+$('#bt-x').value);
    $('#bt-clear').onclick = () => { st.bt = new DS.BTree(st.B); st.seq = 1; draw(); };

    api.hint('Drag to spin · insert until a crate overflows and splits · search counts block reads honestly');
    api.why(`
      <p style="margin:0 0 8px"><b>The disk's law:</b> reading a 4 KB block costs about the same as reading 8 bytes — the latency is the <i>trip</i>, not the payload. So a BST (1 key per block) wastes 99.98% of every read.</p>
      <p style="margin:0 0 8px"><b>The B-tree's answer:</b> pack up to 2B−1 keys per block. Height collapses to ~log_B n: 1,000,000 keys with B=50 → <b>height 3</b>, so 3 reads instead of 20. That's a 6× real-world speedup, not an asymptotic nicety.</p>
      <p style="margin:0"><b>Family tree:</b> a B-tree with B=2 is exactly the 2-3-4 tree of W07 — same split logic, wider blocks. SQLite, PostgreSQL, InnoDB, ext4, LMDB: every serious index you will ever query is one of these.</p>`);
    api.arena(`B-tree questions show up in systems rounds: "why is a database index a B+ tree and not a BST/hash map?", <a href="arena/#tries">LC 987 vertical traversal</a>'s sorted-level thinking, and range-scan design: <a href="arena/#trees">LC 352 data stream as disjoint intervals</a>.`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 12 · B-trees', subtitle: 'Paying for blocks, not keys',
      steps: [
        {
          say: `Last stop: the structure designed for the <b>slowest</b> layer — disk.<br><br>
          Disk reads come in <b>blocks</b> (typically 4 KB). Reading one byte costs a ~10µs trip; reading the whole 4 KB block costs the <i>same trip</i>.<br><br>
          A BST stores <b>one key per node</b> — one block read per comparison — so a million-key BST pays 20 block reads per search, each 99.98% empty. Absurd? That's the situation B-trees fix.`,
          learn: ['w12-blocks']
        },
        {
          say: `Fix: make each node a <b>crate as big as a block</b>, holding up to 2B−1 <b>sorted</b> keys. Searching inside a crate is free (it arrived with the block); the expensive thing is only WHICH block to read next.<br><br>
          <b>You be the disk arm.</b> Find <b>${'x'}</b>: tap the crate you'd read next at each level — the crate whose key range contains the target.`,
          reset() {
            sim.clearPicks();
            st.bt = new DS.BTree(3); st.seq = 1;
            [...Array(8).keys()].forEach(() => st.bt.add(st.seq++));
            draw();
            hand.active = true; hand.descents = 0; hand.need = 2;
            sim.onPick(i => {
              if (!hand.active) return;
              const pos = layout();
              const ids = [...pos.keys()];
              const entry = pos.get(ids[i]);
              if (!entry) return;
              const depth = entry.depth;
              const expectedDepth = hand.descents;
              if (depth !== expectedDepth) { api.toast(`Wrong level — you're at depth ${depth}, but the disk arm is at depth ${expectedDepth}. Descend one crate per read.`); return; }
              // is this the crate the search would choose from its parent?
              const target = st.bt.find(st.bt.size()); // largest key — deterministic path
              if (depth === 0) { sim.pulse(i, 500); hand.descents++; api.toast('root read — the disk arm now knows which child block to fetch'); return; }
              // for depth ≥ 1: must be the rightmost leaf path for the largest key
              const isRightmost = entry === (() => {
                let p = pos.get(st.bt.root.id);
                while (!p.node.leaf) p = pos.get(p.node.children[p.node.children.length - 1].id);
                return p;
              })();
              if (isRightmost) { sim.pulse(i, 500); hand.descents++; api.toast(`correct block — keys ≤ its range; ${hand.descents === 2 ? 'found the largest key in 2 reads' : 'one more read'}`); }
              else api.toast('That block\'s key range doesn\'t contain the largest key — go right.');
            });
          },
          task: 'Find the <b>largest</b> key: tap the <b>root crate</b>, then the crate the root tells you to read next.',
          hint: 'The largest key lives in the rightmost leaf block.',
          wait: () => hand.descents >= hand.need,
          okText: 'Two block reads for 8 keys spread over multiple blocks — and the taller the tree gets, the more the comparison matters: each level is one physical read.',
          learn: ['w12-crate']
        },
        {
          say: `Now grow one. Insert keys and watch the crates fill — until one <b>overflows</b>: its median key <b>flies up</b> to the parent, and the crate splits into two half-full ones. Perfect balance, by construction: all leaves stay at exactly the same depth.`,
          task: 'Press <b>insert next</b> slowly (×8 or so) until you see a split toast, then keep going until a <b>new root</b> appears.',
          hint: 'Splits announce themselves: "median N flies up". The new root is the tree growing one level taller.',
          okText: 'Splits are pre-emptive (ODS splits full blocks on the way DOWN), so each insert performs at most one split per level — insert stays O(log_B n) block writes, guaranteed.',
          learn: ['w12-split']
        },
        {
          say: `The payoff in numbers — this is the stat interviewers want you to produce unprompted:`,
          predict: {
            q: '1,000,000 keys. Block = 100 keys (B = 50). How many <b>block reads</b> does a B-tree find need? (A balanced BST would need ≈ 20.)',
            placeholder: 'reads…',
            grade: ans => {
              const v = parseInt(ans, 10);
              const ok = v >= 2 && v <= 4;
              return {
                right: ok,
                msg: ok
                  ? `Right: height ≈ log₁₀₀(10⁶) = <b>3</b> reads (root is usually cached → often 2). Versus 20 for a BST: a real 6–10× speedup, paid for with wide crates and split logic.`
                  : `Height ≈ log₁₀₀(10⁶) = <b>3</b> block reads (vs ≈ 20 for the BST). Each level of a B-tree divides by ~100, not by 2 — that\'s the whole trick.`
              };
            }
          },
          learn: ['w12-height']
        },
        {
          say: `Run the height experiment yourself:`,
          task: 'Set B=4, then press <b>insert ×10</b> three times (30 keys) and watch the "reads/find" stat vs the "BST would read" stat.',
          hint: 'The two stats diverge as n grows: 3 reads vs ~5 for the BST at n=30 — and the gap widens forever.',
          okText: `Right now: ${st.bt.size()} keys, ${st.bt.snapshot().nodes.length} blocks, ${Math.max(...st.bt.snapshot().nodes.map(n => n.depth)) + 1} reads per find. At n = 10⁶ the gap becomes 3 vs 20. Databases didn't choose B-trees for elegance — they chose them for <b>disk geometry</b>.`,
          learn: ['w12-db']
        },
        {
          say: `World 12 — and the whole 3D lab — in one breath:<br><br>
          <b>Data structures are bets about which cost you'll pay most:</b> array shifts (W2), pointer walks (W3), randomness (W4-5, 7), rotations and rules (W7), weak partial order (W8), the comparison wall (W9), relationship without order (W10), keys that spell their own path (W11), and physical block geometry (W12).<br><br>
          You've now <i>played</i> every one. Next stops: <b>Build X</b> (own git, vim, database, calculator, renderer, framework, neural net) and the <b>Arena</b> (the interview questions all this was training for).`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w12', id: 'w12-blocks', t: 'The block law', d: 'One disk/SSD/page read costs the same for 1 byte or 4 KB. The trip is the cost, not the payload.' },
    { w: 'w12', id: 'w12-crate', t: 'Crate = node = block', d: 'Up to 2B−1 sorted keys per block. Scanning inside a block is free; only WHICH block next is expensive.' },
    { w: 'w12', id: 'w12-split', t: 'Split', d: 'Overflow → median flies up to the parent, block halves. Pre-emptive (on the way down): ≤ 1 split per level per insert. Leaves stay at equal depth, always.' },
    { w: 'w12', id: 'w12-height', t: 'log_B n height', d: 'Each level divides by ~2B keys: 10⁶ keys, B=50 → height 3. Versus log₂ n ≈ 20 for a BST.' },
    { w: 'w12', id: 'w12-db', t: 'Why databases pick B-trees', d: 'Fewer block reads + sorted ranges in one structure. SQLite, PostgreSQL, InnoDB, ext4, LMDB — the index of the world.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w12', q: 'Why pack many keys per B-tree node?', opts: ['Fewer comparisons', 'Each block read is a fixed cost — fill it with useful keys', 'Memory is scarce', 'To keep keys sorted'], a: 1, x: 'The trip is the cost, not the payload: a full block costs the same read as one key.' },
    { w: 'w12', q: '1M keys, blocks of 100 keys (B=50). Find costs about…', opts: ['20 reads', '3 reads', '1000 reads', '1 read'], a: 1, x: 'log₁₀₀(10⁶) = 3 levels ≈ 3 block reads.' },
    { w: 'w12', q: 'A B-tree with B = 2 is exactly…', opts: ['a hash table', 'the 2-3-4 tree from World 7', 'a binary heap', 'a skiplist'], a: 1, x: 'Same split logic, narrowest blocks — red-black trees are its binary disguise.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w12', tab: 'B-trees', book: '§14',
    title: 'B-trees — nodes the size of the disk',
    lede: 'The database index: crates of sorted keys as wide as a block read, splits that fly the median up, and heights that collapse 20 reads into 3. ODS §14 — the final world.',
    mount, story
  });
})();
