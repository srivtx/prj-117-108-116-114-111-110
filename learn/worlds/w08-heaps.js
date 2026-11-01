/* ============================================================
   W08 · HEAPS — ODS §10. The priority queue: a tree hidden
   inside a bare array. You triage patients by hand first,
   then meet sift-up, sift-down, and the O(n) build.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { item: '#5d4fe0', slot: '#c9c9dd', hot: '#d94f70', ok: '#0f9e8e', min: '#0f9e8e', tie: '#c8920e' };
  let api, sim;
  const st = { heap: null, swaps: 0, seq: 1 };
  const hand = { active: false, picks: 0, scans: 0 };

  const slotPos = i => ({ x: i * 1.75 - 12, z: 6.5 });
  const treePos = i => {
    const d = Math.floor(Math.log2(i + 1));
    const p = i - (1 << d) + 1;
    const w = 1 << d;
    return { x: (p - (w - 1) / 2) * (26 / w), y: 9.2 - d * 1.9, z: -3 };
  };

  function draw(hotI) {
    const items = st.heap.snapshot().items;
    let vi = 0, li = 0, lk = 0;
    // tree edges first
    for (let i = 1; i < items.length; i++) {
      const p = treePos((i - 1) >> 1), me = treePos(i);
      sim.links.set(lk++, [p.x, p.y - 0.6, p.z], [me.x, me.y + 0.6, me.z], C.slot);
    }
    // identity ties: slot ↔ same node in the tree
    for (let i = 0; i < items.length; i++) {
      const s = slotPos(i), t = treePos(i);
      sim.links.set(lk++, [s.x, 0.55, s.z - 0.5], [t.x, t.y - 0.7, t.z + 0.6], '#c9c9dd');
    }
    sim.links.count(lk);
    // array view (front)
    for (let i = 0; i < Math.max(items.length, 4); i++) {
      const s = slotPos(i);
      sim.vox.set(vi++, s.x, 0.18, s.z, C.slot, 1.45, 0.14, 1.45);
      sim.labels.set(li++, s.x, -0.6, s.z, String(i), { color: '#5d5d75', size: 22 });
      if (i < items.length) {
        const isMin = i === 0 && items.length > 0;
        sim.vox.set(vi++, s.x, 0.95, s.z, hotI === i ? C.hot : (isMin ? C.min : C.item), 1.1, 1, 1.1);
        sim.labels.set(li++, s.x, 0.95, s.z + 0.95, String(items[i]), { color: '#ffffff', size: 30 });
      }
    }
    // tree view (back, up)
    for (let i = 0; i < items.length; i++) {
      const t = treePos(i);
      sim.vox.set(vi++, t.x, t.y, t.z, hotI === i ? C.hot : (i === 0 ? C.min : C.item), 1.1, 1.1, 1.1);
      sim.labels.set(li++, t.x, t.y + 1.15, t.z, String(items[i]), { color: '#ffffff', size: 26 });
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(70, 0, 0.3, 10.5, `front: the array (slots 0…${Math.max(0, items.length - 1)}) · back: the same data, drawn as its implicit tree`, { color: '#5d5d75', size: 24, w: 26, h: 1.1 });
    api.legend(`<b>Binary min-heap</b><div class="row"><span><i class="sw" style="background:${C.min}"></i>root = the minimum</span><span><i class="sw" style="background:${C.item}"></i>item</span><span><i class="sw" style="background:${C.hot}"></i>sifting</span></div><div class="row">rule: every parent ≤ its children — the ONLY rule</div>`);
  }

  function siftAnim(log, done) {
    const swaps = log.filter(e => e.op === 'swapUp' || e.op === 'swapDown');
    let k = 0;
    const step = () => {
      if (k >= swaps.length) { draw(); if (done) done(swaps.length); return; }
      const e = swaps[k];
      st.swaps++;
      draw(e.i); draw(e.p !== undefined ? e.p : e.m);
      sim.pulse(e.i, 350); sim.pulse(e.p !== undefined ? e.p : e.m, 350);
      api.toast(`swap slots ${e.i} ↔ ${e.p !== undefined ? e.p : e.m} (parent ≤ child restored)`);
      k++;
      setTimeout(step, 560);
    };
    step();
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.heap = new DS.BinaryHeap(); st.swaps = 0;
    sim.cam.view({ target: [0, 3.5, 1.5], r: 42, theta: -0.55, phi: 1.02 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>value</label><input type="range" id="hp-v" min="1" max="99" value="37"><output id="hp-v-o">37</output></div>
      <div class="btns">
        <button class="btn primary" id="hp-add">insert (sift up)</button>
        <button class="btn" id="hp-min">remove min (sift down)</button>
        <button class="btn" id="hp-build">build from shuffled ×15</button>
        <button class="btn" id="hp-clear">clear</button>
      </div>
      <p class="note">One array, two drawings: the grey ties connect every slot to the same node in the tree. Children of slot <i>i</i>: <code>2i+1, 2i+2</code>. Parent: <code>(i−1)/2</code>.</p>`;
    $('#hp-v').oninput = e => $('#hp-v-o').textContent = e.target.value;
    $('#hp-add').onclick = () => {
      st.heap.log = [];
      st.heap.add(+$('#hp-v').value);
      siftAnim(st.heap.log, () => api.toast(`insert done — total swaps so far: ${st.swaps}`));
    };
    $('#hp-min').onclick = () => {
      if (!st.heap.size()) return;
      const x = st.heap.a[0];
      st.heap.log = [];
      st.heap.removeMin();
      api.toast(`served ${x} (the root) — last item sinks from the top`);
      siftAnim(st.heap.log);
    };
    $('#hp-build').onclick = () => {
      const vals = DS.shuffle([...Array(15).keys()].map(v => v + 1), DS.mulberry32(Date.now() & 0xffff));
      st.heap = new DS.BinaryHeap(); st.heap.a = vals.slice(0, 14); st.heap.log = [];
      // bottom-up heapify
      for (let i = (st.heap.a.length >> 1) - 1; i >= 0; i--) st.heap.siftDownFrom(i);
      st.swaps += st.heap.log.length;
      draw();
      api.toast(`heapify done: ${st.heap.log.length} swaps for 14 items — about 1 per item, NOT n²`);
    };
    $('#hp-clear').onclick = () => { st.heap = new DS.BinaryHeap(); st.swaps = 0; draw(); };

    api.hint('Drag to spin · insert and remove-min animate in BOTH views — same array, same swaps');
    api.why(`
      <p style="margin:0 0 8px"><b>The heap bet:</b> only "who is minimal" matters, not full order. One weak rule — parent ≤ children — gives O(log n) insert and O(1) peek-min, in a bare array with zero pointers.</p>
      <p style="margin:0 0 8px"><b>Why an array?</b> The complete-tree shape is implicit: children at 2i+1, 2i+2. No pointer, perfect cache behavior (W03's lesson, obeyed).</p>
      <p style="margin:0"><b>Careers:</b> schedulers, Dijkstra/A* frontier, k-largest streaming (LC 215), heapsort (W09), and your OS's priority queues.</p>`);
    api.arena(`Heaps are a top-5 interview structure: <a href="arena/#heaps">LC 215 kth largest</a>, <a href="arena/#heaps">LC 239 sliding window maximum</a>, <a href="arena/#heaps">LC 703 kth in stream</a>, <a href="arena/#heaps">LC 621 task scheduler</a>.`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 8 · Heaps', subtitle: 'Priority from one weak rule',
      steps: [
        {
          say: `An emergency room. Patients arrive with <b>severity</b> numbers — and the doctor must always take the <b>most severe</b> next, not the first-arrived.<br><br>
          Row of 7 random severities. <b>You're the triage nurse.</b> Tap the smallest number (most urgent) — and notice what you had to do to be SURE it's the smallest.`,
          reset() {
            sim.clearPicks();
            st.heap = new DS.BinaryHeap();
            st.heap.a = DS.shuffle([42, 17, 93, 5, 61, 28, 77], DS.mulberry32(5));
            hand.active = true; hand.picks = 0; hand.scans = 0;
            draw();
            sim.onPick(i => {
              if (!hand.active) return;
              const n = st.heap.a.length;
              // item blocks in array view start at index: max(n,4) plates come first
              const base = Math.max(n, 4);
              const idx = i - base;
              if (idx < 0 || idx >= n) return;
              if (st.heap.a[idx] !== Math.min(...st.heap.a)) {
                api.toast(`That's ${st.heap.a[idx]} — not the most urgent. You had to look at all ${n} anyway to be sure.`);
                hand.scans += n;
                return;
              }
              hand.picks++;
              const served = st.heap.a.splice(idx, 1)[0];
              api.toast(`served ${served} — but to be SURE it was the min you scanned all ${n}. That's O(n) per patient.`);
              st.heap = new DS.BinaryHeap(); st.heap.a = st.heap.a; // keep
              draw();
              if (hand.picks >= 3) hand.active = false;
            });
          },
          task: 'Tap the <b>smallest</b> value in the front row — three times (the row stays scrambled each time).',
          hint: 'Compare each tap\'s certainty: how many blocks did you have to glance at?',
          wait: () => hand.picks >= 3,
          okText: 'Three patients served, ~21 blocks inspected. A scan per service is O(n) per operation — we want the minimum <b>ready in O(1)</b>, served in O(log n). The heap is built for exactly that.',
          learn: ['w08-pq']
        },
        {
          say: `The heap's single rule: <b>every parent ≤ its children</b> (a min-heap). That's ALL. No left-vs-right order, no sortedness — just this weak promise, recursively.<br><br>
          Consequence: the <b>root is the global minimum</b> — it's ≤ its children, who are ≤ theirs… The front row is the array; the back view draws the <b>same data</b> as the tree the array secretly is. The grey ties show they're one thing.`,
          task: 'Hover the array and the tree: press insert a few times and watch both views update identically.',
          hint: 'Children of slot i live at slots 2i+1 and 2i+2 — count the ties.',
          okText: 'The tree needs <b>zero pointers</b>: it is the array read at angles. Complete shape, implicit, cache-perfect.',
          learn: ['w08-rule', 'w08-implicit']
        },
        {
          say: `Index arithmetic check — the kind of thing interviewers quiz cold:`,
          predict: {
            q: 'In the array form, the children of slot <b>i</b> live at slots <code>2i+1</code> and <code>2i+2</code>. What slot holds the <b>parent</b> of slot 6?',
            placeholder: 'slot number…',
            grade: ans => {
              const v = parseInt(ans, 10);
              return {
                right: v === 2,
                msg: v === 2
                  ? 'Right: (6−1) ÷ 2 = <b>2</b>. Parent = (i−1)/2, floored. That one division is the entire "pointer" budget of a heap.'
                  : 'Parent of slot i is <b>(i−1)/2 floored</b> — for i = 6: (6−1)/2 = <b>2</b>. One integer division per hop: the whole pointer system of a heap.'
              };
            }
          },
          learn: ['w08-parent']
        },
        {
          say: `<b>Insert</b>: drop the newcomer at the <b>end</b> (the only slot that keeps the tree complete), then <b>sift up</b>: while it beats its parent, swap. One branch per level → O(log n) worst, O(1) average.`,
          task: 'Set the value slider to a small number (1–9) and press <b>insert (sift up)</b>. Watch it bubble to the top in both views.',
          hint: 'The swaps toast each parent↔child exchange.',
          okText: 'It climbed to near the root in log-steps. Note: it did NOT sort the array — heaps are deliberately weaker than sorted. Weak rule, cheap maintenance.',
          learn: ['w08-siftup']
        },
        {
          say: `<b>Serve the minimum</b>: the root leaves in O(1)… but the last array item is now squatting at the root. <b>Sift down</b>: swap it with its smaller child until the rule holds — again ≤ log n swaps.`,
          task: 'Press <b>remove min (sift down)</b> twice and watch the sink.',
          hint: 'It always swaps with the SMALLER child (that one must come up to keep the rule).',
          okText: 'The ER now runs at O(log n) per patient — versus your O(n) hand-triage. Dijkstra, A*, schedulers, and "k largest of a stream" all reduce to these two sifts.',
          learn: ['w08-siftdown']
        },
        {
          say: `Last trick — <b>building</b> a heap from n items. Naive: n inserts × log n = O(n log n).<br><br>
          Bottom-up <b>heapify</b>: start at slot n/2 (the last parent) and sift down, right to left. Most nodes are near the bottom where sifting is nearly free — the tall work only happens at the few top nodes. The series sums to <b>O(n)</b>, surprisingly.`,
          predict: {
            q: 'Bottom-up heapify of n = 14 items: roughly how many swaps total? (Then press "build from shuffled ×15" to check.)',
            placeholder: 'swaps…',
            grade: ans => {
              const v = parseInt(ans, 10);
              const ok = v >= 8 && v <= 30;
              return {
                right: ok,
                msg: ok
                  ? 'Right ballpark: the exact count is <b>at most 2n ≈ 28</b> — in practice ~n. Build is LINEAR, not n log n. Press build and watch the toast confirm.'
                  : 'Bottom-up build costs <b>at most ~2n swaps</b> (≈ 14–28 here) — linear, not quadratic and not n·log n. Half the nodes are leaves (0 work), a quarter move ≤ 1… the heavy sifting only happens at the few top slots.'
              };
            }
          },
          learn: ['w08-heapify']
        },
        {
          say: `World 8 in one breath:<br><br>
          <b>One weak rule (parent ≤ children) + implicit complete tree in an array = a priority queue</b> with O(log n) insert/serve and O(n) build.<br><br>
          World 9 will put this exact engine inside a sorting machine.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w08', id: 'w08-pq', t: 'Priority queue', d: 'Serve by urgency, not arrival. The interface: insert(x), findMin(), removeMin(). The heap is its best-known engine.' },
    { w: 'w08', id: 'w08-rule', t: 'The heap rule', d: 'Every parent ≤ its children. Nothing else! Weak enough to maintain fast, strong enough to put the global min at the root.' },
    { w: 'w08', id: 'w08-implicit', t: 'Implicit tree', d: 'Children of i at 2i+1, 2i+2; parent at (i−1)/2. A complete binary tree needs no pointers at all — it IS the array.' },
    { w: 'w08', id: 'w08-parent', t: 'Parent index', d: '(i−1)/2, floored — one integer division per hop up.' },
    { w: 'w08', id: 'w08-siftup', t: 'Sift up', d: 'New item at the end swaps with its parent while it wins. ≤ log n swaps; O(1) on average.' },
    { w: 'w08', id: 'w08-siftdown', t: 'Sift down', d: 'Root leaves; last item sinks, always swapping with its SMALLER child. ≤ log n swaps.' },
    { w: 'w08', id: 'w08-heapify', t: 'Heapify: O(n) build', d: 'Sift down from slot n/2 to 0. Bottom-heavy tree: most nodes barely move — total work linear.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w08', q: 'The heap rule guarantees…', opts: ['the array is sorted', 'every parent ≤ its children', 'left child ≤ right child', 'all leaves at same depth ±1 only'], a: 1, x: 'One weak invariant; the root is the min by transitivity. (Leaves DO share depth ±1 by completeness, but that\'s shape, not the rule.)' },
    { w: 'w08', q: 'Children of slot 3 live at…', opts: ['4 and 5', '6 and 7', '7 and 8', '2 and 4'], a: 2, x: '2·3+1 = 7 and 2·3+2 = 8. One multiplication replaces two pointers.' },
    { w: 'w08', q: 'removeMin costs…', opts: ['O(1)', 'O(log n) — sift down from the root', 'O(n)', 'O(n log n)'], a: 1, x: 'The last item sinks at most one branch per level.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w08', tab: 'Heaps', book: '§10',
    title: 'Heaps — priority without full order',
    lede: 'One weak rule — parent ≤ children — hiding a complete tree inside a bare array. Triage patients by hand, sift up, sift down, and build the whole thing in O(n). <b>ODS §10.</b>',
    mount, story
  });
})();
