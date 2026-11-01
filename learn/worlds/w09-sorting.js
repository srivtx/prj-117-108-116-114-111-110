/* ============================================================
   W09 · SORTING — ODS §11. Every algorithm as a step script the
   3D bars replay. You merge two piles by hand, partition around
   a wall, and break the n log n "limit" by refusing to compare.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { bar: '#5d4fe0', cmp: '#c8920e', pivot: '#d94f70', placed: '#0f9e8e', ghost: '#c9c9dd', aux: '#5e5b82' };
  let api, sim;
  const st = {
    algo: 'quick', input: 'shuffled', n: 16, values: [], steps: [], k: 0,
    cmps: 0, writes: 0, done: false
  };
  const hand = { active: false, merged: 0, a: [], b: [], out: [], bad: 0 };

  const bx = i => i * 1.45 - 11;
  function draw() {
    let vi = 0, li = 0;
    const maxv = Math.max(...st.values, 1);
    st.values.forEach((v, i) => {
      const col = st.colors && st.colors[i] ? st.colors[i] : C.bar;
      for (let h = 0; h < v; h++) sim.vox.set(vi++, bx(i), 0.5 + h, 0, col, 1.15, 0.98, 1.15);
      sim.labels.set(li++, bx(i), v + 0.8, 0, '', {});
    });
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.links.hideAll();
    sim.labels.set(70, 0, maxv + 2.2, 0, `${st.algo}sort · ${st.k}/${st.steps.length} steps · ${st.cmps} comparisons · ${st.writes} writes`, { color: '#5d5d75', size: 26, w: 24, h: 1 });
  }

  function genValues() {
    const n = st.n;
    if (st.input === 'sorted') return [...Array(n).keys()].map(v => v + 1);
    if (st.input === 'reversed') return [...Array(n).keys()].map(v => n - v);
    if (st.input === 'few') return [...Array(n).keys()].map(v => 1 + (v % 3) * 4);
    return DS.shuffle([...Array(n).keys()].map(v => v + 1), DS.mulberry32(97));
  }

  function build() {
    st.values = genValues();
    const src = st.values.slice();
    st.colors = {};
    const maxv = Math.max(...src);
    st.hmap = new Map(src.map(v => [v, Math.max(1, Math.round(v * 12 / maxv))]));
    let r;
    if (st.algo === 'merge') r = DS.mergeSortSteps(src);
    else if (st.algo === 'quick') r = DS.quickSortSteps(src, st.input === 'sorted' ? 'first' : 'last');
    else if (st.algo === 'heap') r = DS.heapSortSteps(src);
    else if (st.algo === 'counting') r = DS.countingSortSteps(src);
    else r = DS.radixSortSteps(src, 2);
    st.steps = r.steps;
    st.values = src.map(v => st.hmap.get(v));
    st.k = 0; st.cmps = 0; st.writes = 0; st.done = false;
    draw();
  }

  function applyStep() {
    if (st.k >= st.steps.length) { st.done = true; st.colors = {}; st.values.forEach((_, i) => st.colors[i] = C.placed); draw(); return; }
    const s = st.steps[st.k++];
    st.colors = {};
    if (s.t === 'cmp') { st.cmps++; st.colors[s.i] = C.cmp; st.colors[s.j] = C.cmp; }
    else if (s.t === 'swap') { st.writes += 2; [st.values[s.i], st.values[s.j]] = [st.values[s.j], st.values[s.i]]; st.colors[s.i] = C.cmp; st.colors[s.j] = C.cmp; }
    else if (s.t === 'set') { st.writes++; st.values[s.i] = st.hmap.get(s.v) || 1; st.colors[s.i] = C.aux; }
    else if (s.t === 'mark') { st.colors[s.i] = s.kind === 'pivot' ? C.pivot : C.placed; }
    else if (s.t === 'count' || s.t === 'bucket') { /* digit reads: no comparisons */ }
    else if (s.t === 'place') { st.writes++; st.values[s.to] = st.hmap.get(s.v) || 1; st.colors[s.to] = C.placed; }
    draw();
  }

  function drawHandMerge() {
    let vi = 0, li = 0;
    const rowY = (r) => 1 + r * 2.2;
    const drawRow = (arr, row, color, label) => {
      arr.forEach((v, i) => {
        sim.vox.set(vi++, -9 + i * 1.5, rowY(row), 0, color, 1.15, 1.15, 1.15);
        sim.labels.set(li++, -9 + i * 1.5, rowY(row) + 1.05, 0, String(v), { color: '#ffffff', size: 28 });
      });
      sim.labels.set(li++, -11.4, rowY(row), 0, label, { color: '#5d5d75', size: 30 });
    };
    drawRow(hand.a, 0, C.bar, 'A');
    drawRow(hand.b, 1, C.aux, 'B');
    drawRow(hand.out, 2, C.placed, 'out');
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.links.hideAll();
    sim.labels.set(70, 0, 9.6, 0, 'take the smaller FRONT of A or B, always', { color: '#5d5d75', size: 28, w: 20, h: 1 });
  }

  function mount(a) {
    api = a; sim = a.sim;
    sim.cam.view({ target: [0, 4.5, 0], r: 40, theta: -0.75, phi: 1.08 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>algorithm</label>
        <div class="seg" id="so-algo">
          <button data-a="quick" aria-pressed="true">quick</button><button data-a="merge">merge</button>
          <button data-a="heap">heap</button><button data-a="counting">count</button><button data-a="radix">radix</button>
        </div><span></span></div>
      <div class="ctl"><label>input</label>
        <div class="seg" id="so-in">
          <button data-i="shuffled" aria-pressed="true">shuffled</button><button data-i="sorted">sorted</button>
          <button data-i="reversed">reversed</button><button data-i="few">3 values</button>
        </div><span></span></div>
      <div class="ctl"><label>n</label><input type="range" id="so-n" min="6" max="24" value="16"><output id="so-n-o">16</output></div>
      <div class="btns"><button class="btn primary" id="so-build">▶ shuffle & arm</button></div>
      <p class="note">Arm the machine, then use the <b>Time</b> controls. Try <b>quick + sorted</b> and compare the comparison counter with <b>quick + shuffled</b> — that gap is a whole lecture.</p>`;
    const segBind = (id, key, cb) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => {
      $(id).querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true'); st[key] = b.dataset[key === 'algo' ? 'a' : 'i']; cb && cb();
    });
    segBind('#so-algo', 'algo', build);
    segBind('#so-in', 'input', build);
    $('#so-n').oninput = e => { st.n = +e.target.value; $('#so-n-o').textContent = st.n; };
    $('#so-build').onclick = build;

    api.timebar({
      toggle: () => sim.player.toggle(),
      running: () => sim.player.running,
      step: () => applyStep(),
      reset: () => { sim.player.pause(); build(); },
      speed: r => sim.player.setRate(r)
    });
    sim.player.on(() => { if (st.steps.length) applyStep(); });

    api.hint('Drag to spin · amber = comparing · red = pivot · green = placed · arm, then Step or Play');
    api.why(`
      <p style="margin:0 0 8px"><b>The n log n wall:</b> a comparison sort must distinguish all n! input orders; each comparison buys one bit. So ≥ log₂(n!) ≈ n·log₂n − 1.44n comparisons. Merge/quick/heap all sit at this wall.</p>
      <p style="margin:0 0 8px"><b>Quick</b> is usually fastest in practice (cache-local swaps, tiny inner loop) but has the sorted-input trap; <b>merge</b> is stable and predictable with O(n) extra memory; <b>heap</b> sorts in place, worst-case safe, but jumps around memory.</p>
      <p style="margin:0"><b>Counting/radix</b> refuse to compare at all: they spend digits, not comparisons, and beat the wall — when keys are small integers.</p>`);
    api.arena(`Sorting is the warm-up and the trap: <a href="arena/#sorting">LC 912 sort an array</a>, <a href="arena/#sorting">LC 75 sort colors (3-way partition!)</a>, <a href="arena/#sorting">LC 56 merge intervals</a>; Codeforces openings live on counting-sort thinking.`);
    build();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 9 · Sorting', subtitle: 'One wall, five machines',
      steps: [
        {
          say: `Merge sort's engine is so small you can be it. Two <b>already-sorted</b> piles, A and B. To merge them: look only at the two <b>fronts</b>, take the smaller, repeat. That's the whole algorithm.`,
          reset() {
            sim.clearPicks();
            hand.active = true; hand.merged = 0; hand.out = [];
            hand.a = [2, 5, 9]; hand.b = [3, 7, 8];
            st.steps = []; // suspend the machine player
            drawHandMerge();
            sim.onPick(i => {
              if (!hand.active) return;
              // rows: A (3), B (3), out grows — pick index: 0..2 = A's front
              if (i > 5) return;
              const takeA = i < 3;
              const idx = takeA ? i : i - 3;
              if (idx !== 0) { api.toast('Only the FRONT of a pile is available.'); return; }
              const va = hand.a[0], vb = hand.b[0];
              if (takeA && vb !== undefined && vb < va) { api.toast(`${va} > ${vb} — take the smaller front (B).`); return; }
              if (!takeA && va !== undefined && va < vb) { api.toast(`${vb} > ${va} — take the smaller front (A).`); return; }
              hand.out.push(takeA ? hand.a.shift() : hand.b.shift());
              hand.merged++;
              drawHandMerge();
            });
          },
          task: 'Tap the <b>front block</b> of A or of B — whichever is smaller — until both piles are empty (6 moves).',
          hint: 'Fronts only. Each move is ONE comparison.',
          wait: () => hand.merged >= 6,
          okText: '6 comparisons merged two sorted piles of 3. Merging sorted runs of total length n costs <b>n − 1 comparisons at most</b> — linear. Merge sort: halve until size 1 (trivially sorted), merge back up. log n levels × n work = <b>n log n</b>.',
          learn: ['w09-merge', 'w09-divide']
        },
        {
          say: `Back to the machine. Arm it with <b>merge</b> + <b>shuffled</b>, press Play in the Time bar, and watch the purple 'set' writes: values fly from the aux rail into place, run by run.`,
          task: 'Select <b>merge</b> + <b>shuffled</b>, press <b>shuffle & arm</b>, then Play. Reset when done.',
          hint: 'Pause and Step to see single comparisons.',
          okText: 'Merge sort: <b>guaranteed</b> n log n comparisons, but it pays O(n) extra memory for the aux rail. Now the rival…',
          learn: ['w09-merge-cost']
        },
        {
          say: `<b>Quicksort</b> doesn't merge — it <b>partitions</b>: pick a pivot, sweep once, put smaller-thans left / bigger-thans right. The pivot lands in its <b>final</b> place (green), and the two sides are sorted independently.<br><br>
          Best case: every pivot splits in half → n log n. The trap is the pivot CHOICE.`,
          task: 'Arm <b>quick + shuffled</b> and Play. Watch the red pivot get placed green each round.',
          hint: 'Count the comparisons for n = 16 shuffled: should be around n·log₂n ≈ 64.',
          okText: 'Partitioning = one sweep with swaps — wonderfully cache-friendly. That\'s why quicksort is the default sort in most libraries.',
          learn: ['w09-partition']
        },
        {
          say: `The trap: <b>sorted input + first-element pivot</b>. Every partition is maximally lopsided — the pivot is always the smallest, one side empty. Recursion depth n, comparisons ≈ n²/2.`,
          predict: {
            q: 'Quicksort, n = 16: <b>shuffled</b> input needs ≈ 64 comparisons. Roughly how many does <b>sorted</b> input with first-pivot need? (Arm quick+sorted to verify after.)',
            placeholder: 'a number…',
            grade: ans => {
              const v = parseInt(ans, 10);
              const ok = v >= 90 && v <= 160;
              return {
                right: ok,
                msg: ok
                  ? `Right — ≈ n²/2 = <b>128</b> for n = 16. Now arm <b>quick + sorted</b> and watch the counter double-take. Real libraries defend with random / median-of-3 pivots.`
                  : `Sorted + first-pivot degenerates to ≈ <b>n²/2 = 128</b> comparisons (vs 64 shuffled). Arm <b>quick + sorted</b> and watch the counter — then remember why libraries pick pivots randomly.`
              };
            }
          },
          learn: ['w09-quick-trap']
        },
        {
          say: `Arm <b>heap</b> next: it's World 8's engine sorting in place — build a max-heap, swap the top to the end, repair, repeat. Worst-case safe, zero extra memory.<br><br>
          Then the wall itself: any comparison sort needs ≥ <b>log₂(n!) ≈ n log₂ n − 1.44n</b> comparisons — because n! possible orders must all end in different answers, and one comparison only splits the possibilities in two. Merge sort sits essentially ON the wall.`,
          task: 'Arm <b>heap + shuffled</b> and compare its comparison count to merge\'s.',
          hint: 'Heap does more comparisons (~2n log n) but never blows up and never allocates.',
          okText: 'Three different machines, one shared wall. To beat it you must leave the comparison game entirely…',
          learn: ['w09-lowerbound', 'w09-heap-in-place']
        },
        {
          say: `<b>Counting sort</b> refuses to compare: tally each value into a counter array, prefix-sum the counters, drop every item directly into its final slot. For n values in range k: <b>O(n + k)</b> — LINEAR.<br><br>
          <b>Radix sort</b> repeats a stable counting pass per digit: 32-bit keys in 4 passes of 8 bits. This is how card sorters worked in the 1950s, and how big-integer sorts still work.`,
          task: 'Arm <b>counting + few values</b> and Play — watch writes happen with almost no comparisons (the counter reads them instead).',
          hint: 'The comparison counter barely moves; writes do all the work.',
          okText: 'No comparisons → no n log n wall. The catch: only for integer-ish keys of known range, and stability is required for radix to compose passes. Every sort you know is now a <i>choice among trade-offs</i>, not a single answer.',
          learn: ['w09-counting', 'w09-radix', 'w09-stable']
        },
        {
          say: `World 9 in one breath:<br><br>
          <b>Comparison sorts hit the n log n wall</b> (merge: stable + memory; quick: fast + fragile pivot; heap: safe + jumpy). <b>Digit sorts skip the wall</b> when keys cooperate.<br><br>
          Next: from ordering items to ordering a whole city of them — graphs.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w09', id: 'w09-merge', t: 'Merge two runs', d: 'Compare only the two fronts, take the smaller. Linear in the run lengths.' },
    { w: 'w09', id: 'w09-divide', t: 'Divide & conquer', d: 'Halve until trivial (size 1 is sorted), merge back up: log n levels × linear merging = n log n.' },
    { w: 'w09', id: 'w09-merge-cost', t: 'Merge sort profile', d: 'Guaranteed n log n, stable, O(n) extra memory + a cache-unfriendly aux rail.' },
    { w: 'w09', id: 'w09-partition', t: 'Partition', d: 'One sweep around a pivot: smaller left, larger right, pivot lands final. Quicksort\'s atom (also LC 75).' },
    { w: 'w09', id: 'w09-quick-trap', t: 'The quicksort trap', d: 'Sorted input + first pivot → every split lopsided → ≈ n²/2 comparisons. Cure: random or median-of-3 pivots.' },
    { w: 'w09', id: 'w09-lowerbound', t: 'The n log n wall', d: 'n! orders must give n! answers; each comparison buys one bit → ≥ log₂(n!) ≈ n log₂n − 1.44n comparisons, always.' },
    { w: 'w09', id: 'w09-heap-in-place', t: 'Heapsort profile', d: 'Build heap O(n), then swap-top-to-end n times: in-place, worst-case n log n, but poor locality.' },
    { w: 'w09', id: 'w09-counting', t: 'Counting sort', d: 'Tally values, prefix-sum, place directly: O(n + k) for range k. No comparisons, no wall.' },
    { w: 'w09', id: 'w09-radix', t: 'Radix sort', d: 'Stable counting per digit, least-significant first: O((n+k) per pass · passes). 1950s card sorters to modern big-int sorts.' },
    { w: 'w09', id: 'w09-stable', t: 'Stability', d: 'Equal keys keep their relative order. Required for radix composition; merge sort has it, quick/heap mostly don\'t.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w09', q: 'Why can\'t any comparison sort beat ~n log n?', opts: ['CPUs are slow at comparing', 'n! orders must be distinguished; comparisons give 1 bit each', 'Memory is linear', 'It can — merge sort does'], a: 1, x: 'Information theory: log₂(n!) comparisons necessary in the worst case.' },
    { w: 'w09', q: 'Sorted input makes first-pivot quicksort…', opts: ['twice as fast', 'degenerate to ≈ n²/2 comparisons', 'stable', 'in-place'], a: 1, x: 'Maximally lopsided splits — the classic trap; libraries randomize pivots.' },
    { w: 'w09', q: 'Counting sort beats the wall because…', opts: ['it compares faster', 'it never compares — it counts and places', 'it uses a heap', 'n is small'], a: 1, x: 'The wall only binds comparison sorts. Digit/counting sorts spend digits instead.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w09', tab: 'Sorting', book: '§11',
    title: 'Sorting — the wall and the machines',
    lede: 'Five machines, one information-theoretic wall. Merge by hand, partition around pivots, spring the sorted-input trap, then break the n log n limit by refusing to compare. <b>ODS §11.</b>',
    mount, story
  });
})();
