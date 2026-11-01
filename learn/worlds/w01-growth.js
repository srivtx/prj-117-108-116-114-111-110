/* ============================================================
   W01 · GROWTH — ODS §1. Why efficiency is a design decision.
   Towers for each growth class, the halving staircase of binary
   search, and the word-RAM idea that arithmetic is not free but
   cheap. You count the work yourself, first.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;

  const CLASSES = [
    { name: 'O(1)', f: n => 1, color: '#0f9e8e' },
    { name: 'O(log n)', f: n => Math.max(1, Math.log2(n)), color: '#0f9e8e' },
    { name: 'O(n)', f: n => n, color: '#c8920e' },
    { name: 'O(n log n)', f: n => n * Math.max(1, Math.log2(n)), color: '#d94f70' },
    { name: 'O(n²)', f: n => n * n, color: '#d94f70' },
    { name: 'O(2ⁿ)', f: n => Math.pow(2, Math.min(n, 30)), color: '#5d4fe0' }
  ];
  const SCALE = 46; // blocks per unit of f at the reference n

  let api, sim;
  const state = { n: 16, mode: 'towers' };
  const slotOf = new Map(); // class index → first voxel index

  function drawTowers() {
    const cols = CLASSES.length, gap = 7.2;
    const originX = -(cols - 1) * gap / 2;
    let vi = 0;
    CLASSES.forEach((c, k) => {
      const v = c.f(state.n);
      const hBlocks = Math.min(240, Math.max(1, Math.round(v * (SCALE / Math.max(1, state.n)))));
      // reference: O(n) tower is exactly state.n blocks tall
      const x = originX + k * gap;
      for (let b = 0; b < hBlocks; b++) {
        sim.vox.set(vi++, x, 0.5 + b, 0, c.color, 0.92, 0.92, 0.92);
      }
      for (let b = hBlocks; b < 4; b++) sim.vox.set(vi++, x, 0.5 + b, 0, '#c9c9dd', 0.5, 0.5, 0.5); // ghost stub
      sim.labels.set(k, x, -1.1, 0, c.name, { color: '#5d5d75' });
    });
    sim.vox.hideFrom(vi);
    sim.labels.hideFrom(cols);
    sim.links.hideAll();
  }

  function drawStaircase() {
    // binary search over n boxes: each comparison halves the remaining span
    const n = Math.min(state.n, 128);
    let vi = 0;
    const spanY = 0;
    let lo = 0, hi = n - 1, level = 0;
    const rows = [];
    while (lo <= hi) {
      rows.push({ lo, hi, level });
      lo = Math.floor((lo + hi) / 2) + 1;
      level++;
    }
    rows.forEach(r => {
      for (let i = r.lo; i <= r.hi; i++) {
        sim.vox.set(vi++, (i - n / 2) * 0.62, 0.5 + (rows.length - 1 - r.level) * 1.3, 0,
          r.level === 0 ? '#c8920e' : '#5d4fe0', 0.5, 0.5, 0.5);
      }
    });
    sim.vox.hideFrom(vi);
    sim.labels.set(0, 0, spanY, 8.4, `n = ${n} boxes → ${rows.length} comparisons, worst case`, { color: '#5d5d75', size: 26, w: 14, h: 1.1 });
    sim.labels.hideFrom(1);
    sim.links.hideAll();
  }

  function redraw() { state.mode === 'towers' ? drawTowers() : drawStaircase(); }

  function mount(a) {
    api = a; sim = a.sim;
    sim.cam.view({ target: [0, 5, 0], r: 44, theta: -0.7, phi: 1.05 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>n (items)</label><input type="range" id="g-n" min="4" max="96" value="16"><output id="g-n-o">16</output></div>
      <div class="btns">
        <button class="btn" id="g-mode">View: growth towers</button>
        <button class="btn" id="g-expl">Explain a tower</button>
      </div>
      <p class="note">The <b>O(n)</b> tower is exactly <i>n</i> blocks tall — the others are scaled against it. "Explain a tower" pauses and tells you what each class feels like in practice.</p>`;
    $('#g-n').oninput = e => { state.n = +e.target.value; $('#g-n-o').textContent = state.n; redraw(); };
    $('#g-mode').onclick = e => {
      state.mode = state.mode === 'towers' ? 'staircase' : 'towers';
      e.target.textContent = 'View: ' + (state.mode === 'towers' ? 'growth towers' : 'binary-search staircase');
      redraw();
    };
    $('#g-expl').onclick = () => {
      const k = Math.floor(Math.random() * CLASSES.length);
      sim.pulse(k * 40, 1400);
      api.toast(CLASSES[k].name + ' — ' + EXPL[k]);
    };

    api.legend(`<b>Growth classes at n = <span id="lg-n">${state.n}</span></b>
      <div class="row">${CLASSES.map(c => `<span><i class="sw" style="background:${c.color}"></i>${c.name}</span>`).join('')}</div>`);
    api.hint('Drag to spin · scroll to zoom · towers update live as you move the n slider');
    api.why(`
      <p style="margin:0 0 8px">Every operation in this lab has a <b>cost curve</b>. Big-O names the curve's <i>shape</i>, not its speed:</p>
      <ul style="margin:0;padding-left:18px;font-size:12.5px">
        <li><b>O(1)</b> — cost ignores n entirely (array <code>get(i)</code>).</li>
        <li><b>O(log n)</b> — each step cuts the problem in half (binary search, balanced trees). A billion items: ~30 steps.</li>
        <li><b>O(n)</b> — touch everything once (linked-list <code>get(i)</code>).</li>
        <li><b>O(n log n)</b> — the fair price of <i>sorting by comparisons</i> (W09 proves it).</li>
        <li><b>O(n²)</b> — touch everything per item (insert-at-front in an array).</li>
        <li><b>O(2ⁿ)</b> — enumerate subsets; already impossible at n≈40.</li>
      </ul>`);
    api.arena(`Growth-class thinking decides every answer: <a href="arena/#arrays">binary search (LC 704)</a>, <a href="arena/#arrays">two-pointer (LC 167)</a>, and the question interviewers actually grade — <i>can you say the cost of your own code out loud?</i>`);
    redraw();
  }
  const $ = s => document.querySelector(s);
  const EXPL = [
    'a fixed number of steps, however much data you own',
    'halving the pile repeatedly: 1,000,000,000 items ≈ 30 steps',
    'one pass over every item',
    'the best any all-purpose comparison sort can do (W09)',
    'comparing every item to every other item',
    'doubles with each added item: 30 items → a billion steps'
  ];

  function story() {
    return {
      title: 'World 1 · Growth', subtitle: 'The shape of cost',
      steps: [
        {
          say: `Everything in this lab is built from one question: <b>how does the work grow as the data grows?</b><br><br>
          This world shows six <b>growth classes</b> as towers of blocks. The amber <b>O(n)</b> tower is exactly <i>n</i> blocks tall —
          it's the ruler every other tower is measured against. Drag the <b>n slider</b> in the panel and watch who explodes.`,
          task: 'Move the n slider. Watch what happens to the O(n²) tower as n goes from 16 to 96.',
          hint: 'The n² tower grows much faster than "twice as fast" — it grows like n times n.',
          okText: 'Notice: <b>O(n²)</b> didn\'t just get taller — it pulled away from the ruler quadratically. By n = 96 it has hundreds of blocks while O(n) has 96. That gap is why data structures exist.',
          learn: ['w01-bigo', 'w01-class']
        },
        {
          say: `Now switch the view: press <b>"View: growth towers"</b> to flip to the <b>binary-search staircase</b>.<br><br>
          You have <i>n</i> sorted boxes. One comparison keeps only the half that could contain the answer.
          Each floor of the staircase is <b>one comparison</b>: the row halves, then halves again…`,
          task: 'Flip to the staircase view, then move n from 16 to 96. Watch how many floors the staircase gains.',
          hint: 'You are counting: how many times can you halve n before one box remains?',
          okText: 'n went up <b>6×</b> (16 → 96), but the number of comparisons — the floors — grew by only about <b>3</b> (4 → 7). That resistance to growth is what <b>log₂ n</b> means.',
          learn: ['w01-log']
        },
        {
          say: `<b>log₂ n</b> is not a formula to memorize. It's a question: <i>"how many times can I halve this until one is left?"</i><br><br>
          <table class="perf"><tr><th>n</th><th>halvings</th></tr>
          <tr><td class="mono">1,000</td><td class="mono">≈ 10</td></tr>
          <tr><td class="mono">1,000,000</td><td class="mono">≈ 20</td></tr>
          <tr class="hl"><td class="mono">1,000,000,000</td><td class="mono">≈ 30</td></tr></table>
          A <b>billion</b> items, thirty steps. This is the ladder every balanced structure in this lab climbs.`,
          learn: ['w01-log2-table']
        },
        {
          say: `One more first principle, from the book's <b>model of computation</b> (the word-RAM):<br><br>
          a computer's memory is a huge row of <b>words</b> — numbered boxes that each hold one number.
          Reading word #5 costs the same as reading word #5,000,000, and arithmetic on words (+, −, ×, and, or, shifts) costs a <b>constant</b>.<br><br>
          That single assumption is why <code>a[i]</code> is O(1) in W02 — and why hashing in W05 can turn a number into an address with one multiplication.`,
          learn: ['w01-wordram']
        },
        {
          say: `Time for the stakes. ODS opens with a number: doing a <b>million lookups</b> over a <b>million items</b>,
          the naive way — scan everything — costs <span class="num">10⁶ × 10⁶ = 10¹²</span> operations.<br><br>
          On a ~10⁹-operations/second machine, that's <b>1,000 seconds</b> — 16 minutes — to answer one million questions that should each take microseconds.`,
          predict: {
            q: `With a hash table (W05), each lookup checks about <b>2</b> items on average. Roughly how long do all <b>10⁶</b> lookups take on a 10⁹ ops/sec machine?<br><small>(type a number of seconds — a rough power of ten is fine)</small>`,
            placeholder: 'seconds…',
            grade: ans => {
              const v = parseFloat(ans.replace(/[^0-9.eE+-]/g, ''));
              if (isNaN(v)) return { right: false, msg: 'Type a number of seconds (for example 0.002).' };
              const truth = 2e6 / 1e9; // 0.002 s
              const ok = v > 0 && v < 0.1;
              return {
                right: ok,
                msg: ok
                  ? `Right ballpark. 2×10⁶ ops ÷ 10⁹ ops/s ≈ <b>0.002 s</b> — two milliseconds instead of 16 minutes. Same machine, same data: <b>the data structure was the difference</b>, not the hardware.`
                  : `Compare: 2×10⁶ ops ÷ 10⁹ ops/s ≈ <b>0.002 s</b>. From 1,000 seconds to 2 milliseconds — a factor of 500,000 — without buying a faster computer.`
              };
            }
          },
          learn: ['w01-why']
        },
        {
          say: `That's the whole book in one world: <b>organize data so each operation inspects almost nothing</b>.<br><br>
          Everything that follows — arrays, lists, skiplists, hashes, trees, heaps, sorts, graphs, tries, B-trees — is a different bet about which operations must be fast, and what we'll pay in memory to get it.<br><br>
          When you're ready, press <b>Next</b> to finish, then hop to <b>World 2</b>.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w01', id: 'w01-bigo', t: 'Big-O', d: 'Names the SHAPE of how cost grows with n, not the exact speed. O(f(n)) means: past some size, cost is at most a constant times f(n).' },
    { w: 'w01', id: 'w01-class', t: 'Growth classes', d: 'O(1) ignores n · O(log n) halves · O(n) touches everything once · O(n log n) sort price · O(n²) pairs · O(2ⁿ) subsets.' },
    { w: 'w01', id: 'w01-log', t: 'log₂ n', d: 'How many times you can halve n until one item remains. A billion items ≈ 30. The height of every balanced structure.' },
    { w: 'w01', id: 'w01-log2-table', t: 'The log ladder', d: '1,000 ≈ 10 halvings · 1,000,000 ≈ 20 · 1,000,000,000 ≈ 30. Each ×1000 in data costs only +10 steps.' },
    { w: 'w01', id: 'w01-wordram', t: 'Word-RAM model', d: 'Memory = numbered words; reading ANY word and doing arithmetic on words costs constant time. This is why a[i] is O(1).' },
    { w: 'w01', id: 'w01-why', t: 'Why structures matter', d: '10⁶ scans × 10⁶ items = 10¹² ops ≈ 16 min. A hash table answers the same load in ~0.002 s. Organization beats hardware.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w01', q: 'Binary search over one billion sorted items inspects at most about…', opts: ['about 30 items', 'about 1,000 items', 'about half a billion items', 'exactly 1 item'], a: 0, x: 'log₂(10⁹) ≈ 30. Each comparison halves what remains.' },
    { w: 'w01', q: 'You multiply the input by 1000. Which cost grows the LEAST?', opts: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'], a: 2, x: 'log only grows by ~10 when n grows ×1000.' },
    { w: 'w01', q: 'The word-RAM model says which operation is NOT constant time?', opts: ['Reading any one word of memory', 'Adding two words', 'Comparing two words', 'Scanning all n words'], a: 3, x: 'Each single word op is constant; touching n of them is not.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w01', tab: 'Growth', book: '§1',
    title: 'Growth — the shape of cost',
    lede: 'Before any structure: <em>how does work grow as data grows?</em> Six towers you scale yourself, the halving staircase behind every fast algorithm, and the model of computation everything stands on. <b>ODS §1.</b>',
    mount, story
  });
})();
