/* ============================================================
   W02 · ARRAYS — ODS §2. ArrayStack, the circular ArrayQueue,
   and RootishArrayStack. You shift the blocks yourself, then
   meet amortization as a bank you pay into before you need it.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { item: '#5d4fe0', ghost: '#c9c9dd', head: '#d94f70', flash: '#d94f70', warn: '#c8920e', ok: '#0f9e8e' };
  let api, sim;
  const st = { mode: 'stack', stack: null, queue: null, rootish: null, copies: 0, seedv: 1 };

  function slotX(i, cap) { return (i - (cap - 1) / 2) * 1.35; }

  function drawStack(highlight) {
    const s = st.stack, snap = s.snapshot();
    let vi = 0, li = 0;
    for (let i = 0; i < snap.cap; i++) {
      sim.vox.set(vi++, slotX(i, snap.cap), 0.28, 0, C.ghost, 1.14, 0.14, 1.14); // slot plate
    }
    snap.items.forEach((v, i) => {
      // hand-shift mode: already-moved blocks (from the right) float one slot right
      const off = (hand.active && i >= snap.items.length - hand.moved) ? 1 : 0;
      const slot = i + off;
      const hot = highlight && highlight.kind === 'slot' && highlight.i === i;
      sim.vox.set(vi++, slotX(slot, snap.cap), 0.92, 0, hot ? C.flash : C.item, 1, 0.92, 0.92);
      sim.labels.set(li++, slotX(slot, snap.cap), 1.9, 0, String(v), { color: '#ffffff', size: 30 });
    });
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(90, 0, -0.9, 0, `n = ${snap.items.length} · capacity ${snap.cap}`, { color: '#5d5d75', size: 28, w: 12, h: 1 });
    sim.links.hideAll();
    return vi;
  }

  function drawQueue() {
    const q = st.queue, snap = q.snapshot();
    const R = Math.max(4.2, snap.cap * 0.72), m = snap.cap || 1;
    let vi = 0, li = 0;
    for (let i = 0; i < m; i++) {
      const ang = (i / m) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(ang) * R, z = Math.sin(ang) * R;
      const isHead = i === snap.head, isTail = (snap.head + snap.items.length - 1) % m === i && snap.items.length;
      sim.vox.set(vi++, x, 0.28, z, isHead ? C.head : C.ghost, 1.14, 0.14, 1.14);
      const val = q.a[i];
      if (val !== undefined && val !== null) {
        sim.vox.set(vi++, x, 0.92, z, C.item, 1, 0.92, 0.92);
        sim.labels.set(li++, x, 1.9, z, String(val), { color: '#ffffff', size: 30 });
      } else sim.labels.set(li++, x, 1.9, z, '', {});
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(90, 0, 0.6, 0, `front → walks clockwise · n = ${snap.items.length} / ${m}`, { color: '#5d5d75', size: 26, w: 12, h: 1.1 });
    sim.links.hideAll();
  }

  function drawRootish() {
    const r = st.rootish, snap = r.snapshot();
    let vi = 0, li = 0;
    snap.blocks.forEach((blk, b) => {
      const width = b + 1, startX = -width / 2 + 0.5 + (snap.blocks.length - 1) * 0.0;
      for (let j = 0; j < width; j++) {
        const x = startX + j, y = 0.5 + b * 1.05;
        const filled = blk[j] !== undefined;
        sim.vox.set(vi++, x, y - 0.36, 0, C.ghost, 1.02, 0.12, 1.02);
        if (filled) {
          sim.vox.set(vi++, x, y + 0.2, 0, C.item, 0.9, 0.84, 0.9);
          sim.labels.set(li++, x, y + 0.95, 0, String(blk[j]), { color: '#ffffff', size: 26 });
        } else sim.labels.set(li++, x, y + 0.95, 0, '', {});
      }
    });
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(90, 0, -0.9, 0, `blocks 1+2+3… · n = ${snap.n} · waste ≤ √n/2`, { color: '#5d5d75', size: 26, w: 13, h: 1 });
    sim.links.hideAll();
  }

  function redraw(hl) {
    if (st.mode === 'stack') drawStack(hl);
    else if (st.mode === 'queue') drawQueue();
    else drawRootish();
    api.legend(LEGEND[st.mode]());
  }
  const LEGEND = {
    stack: () => `<b>ArrayStack</b><div class="row"><span><i class="sw" style="background:${C.item}"></i>item</span><span><i class="sw" style="background:${C.ghost}"></i>empty slot</span><span><i class="sw" style="background:${C.flash}"></i>just changed</span></div>`,
    queue: () => `<b>ArrayQueue (circular)</b><div class="row"><span><i class="sw" style="background:${C.head}"></i>front</span><span><i class="sw" style="background:${C.item}"></i>item</span><span><i class="sw" style="background:${C.ghost}"></i>free slot</span></div>`,
    rootish: () => `<b>RootishArrayStack</b><div class="row"><span><i class="sw" style="background:${C.item}"></i>item</span><span><i class="sw" style="background:${C.ghost}"></i>slot in a growing block</span></div>`
  };

  const wave = (n, get, ms) => { for (let k = 0; k < n; k++) setTimeout(() => { const v = get(k); if (v !== undefined) sim.pulse(v, 500); }, k * ms); };

  function op(kind) {
    const narrate = (e) => {
      if (!e) return;
      if (e.op === 'shift') {
        api.toast(`shifted ${e.count} block${e.count === 1 ? '' : 's'} ${e.dir > 0 ? '→ right' : '← left'} — cost ${e.cost}`);
        wave(e.count, k => k + 2, 45); // pulse slot plates + items above them
      } else if (e.op === 'resize') {
        api.toast(`array full → grew ${e.from} → ${e.to} and copied ${e.cost - 1} items`);
        st.copies += e.cost - 1;
      } else if (e.op === 'rotate') api.toast(`hit the wall with room up front → rotated to the front (copied ${e.cost})`);
    };
    if (st.mode === 'stack') {
      const s = st.stack; s.log = [];
      if (kind === 'addEnd') s.add(s.size(), st.seedv++);
      else if (kind === 'addFront') { try { s.add(0, st.seedv++); } catch (err) { } }
      else if (kind === 'removeEnd') { if (s.size()) s.remove(s.size() - 1); }
      else if (kind === 'removeFront') { if (s.size()) s.remove(0); }
      const shift = s.log.find(e => e.op === 'shift'); const rs = s.log.find(e => e.op === 'resize');
      if (rs) st.copies += 0; // counted above
      narrate(shift); narrate(rs);
      const last = s.log[s.log.length - 1];
      redraw(last && last.op !== 'shift' ? { kind: 'slot', i: last.i } : null);
    } else if (st.mode === 'queue') {
      const q = st.queue; q.log = [];
      if (kind === 'addEnd') q.add(st.seedv++);
      else if (kind === 'removeFront') { if (q.size()) q.remove(); }
      narrate(q.log.find(e => e.op === 'rotate'));
      redraw();
    } else {
      const r = st.rootish; r.log = [];
      if (kind === 'addEnd') r.add(r.size(), st.seedv++);
      else if (kind === 'removeEnd') { if (r.size()) r.remove(r.size() - 1); }
      narrate(r.log.find(e => e.op === 'grow'));
      redraw();
    }
    stats();
  }

  function stats() {
    const el = api.stats(true);
    el.innerHTML = '';
    const items = st.mode === 'stack' ? st.stack.size() : st.mode === 'queue' ? st.queue.size() : st.rootish.size();
    const cap = st.mode === 'stack' ? st.stack.snapshot().cap : st.mode === 'queue' ? st.queue.snapshot().cap : '~ n + √n';
    const mk = (l, v, cls) => { const d = document.createElement('div'); d.innerHTML = `<span>${l}</span><b class="${cls || ''}">${v}</b>`; el.appendChild(d); };
    mk('items', items);
    mk(st.mode === 'queue' ? 'capacity' : 'capacity', cap);
    mk('copy ops', st.copies, st.copies > 200 ? 'no' : 'ok');
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.stack = new DS.ArrayStack(); st.queue = new DS.ArrayQueue(); st.rootish = new DS.RootishArrayStack();
    [3, 1, 4, 1].forEach(v => st.stack.add(st.stack.size(), v));
    [2, 7, 1].forEach(v => st.queue.add(v));
    [5, 9, 2].forEach(v => st.rootish.add(st.rootish.size(), v));
    sim.cam.view({ target: [0, 1.4, 0], r: 30, theta: -0.85, phi: 1.12 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>structure</label>
        <div class="seg" id="ar-mode">
          <button data-m="stack" aria-pressed="true">Stack</button>
          <button data-m="queue">Queue</button>
          <button data-m="rootish">Rootish</button>
        </div><span></span></div>
      <div class="btns">
        <button class="btn primary" id="ar-addend">add at end</button>
        <button class="btn" id="ar-addfront">insert at front</button>
        <button class="btn" id="ar-rmfront">remove front</button>
        <button class="btn" id="ar-rmend">remove end</button>
        <button class="btn" id="ar-load">add ×20</button>
        <button class="btn" id="ar-clear">reset</button>
      </div>
      <p class="note" id="ar-note">Slot plates are the array itself: one memory word each, numbered 0…n−1. That numbering is why <code>get(i)</code> is instant.</p>`;
    $('#ar-mode').querySelectorAll('button').forEach(b => b.onclick = () => {
      $('#ar-mode').querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true');
      st.mode = b.dataset.m;
      $('#ar-note').textContent = st.mode === 'stack'
        ? 'Slot plates are the array itself: one memory word each, numbered 0…n−1. That numbering is why get(i) is instant.'
        : st.mode === 'queue'
          ? 'The queue never moves its items — only the FRONT walks forward. When it hits the wall with room behind, everything slides back to the front.'
          : 'Blocks of size 1, 2, 3, … — add at the end costs O(1+√n) worst case, but only O(√n)/2n of the space is ever wasted.';
      redraw(); stats();
    });
    const bind = (id, fn) => $(id).onclick = fn;
    bind('#ar-addend', () => op('addEnd'));
    bind('#ar-addfront', () => op('addFront'));
    bind('#ar-rmfront', () => op('removeFront'));
    bind('#ar-rmend', () => op('removeEnd'));
    bind('#ar-load', () => { let k = 0; const iv = setInterval(() => { op('addEnd'); if (++k >= 20) clearInterval(iv); }, 120); });
    bind('#ar-clear', () => {
      st.stack = new DS.ArrayStack(); st.queue = new DS.ArrayQueue(); st.rootish = new DS.RootishArrayStack();
      st.copies = 0; st.seedv = 1; redraw(); stats();
    });

    api.hint('Drag to spin · press the buttons and watch what moves — and what doesn\'t');
    api.why(`
      <p style="margin:0 0 8px"><b>The array's bet:</b> pay a huge <i>fixed</i> cost (contiguous words) once, and random access <code>get(i)</code> is a single arithmetic + one memory read. Nothing beats it.</p>
      <p style="margin:0 0 8px"><b>The price:</b> the middle is sacred. Insert or remove at position i and <span class="num">n−i</span> blocks must shuffle — O(n).</p>
      <p style="margin:0"><b>The compromises:</b> growing ×2 makes appends <b>amortized O(1)</b> (a rare O(n) copy is pre-paid); the circular trick makes the queue O(1) by moving only its front; Rootish blocks cut the wasted half to O(√n).</p>`);
    api.arena(`Array thinking is tested everywhere: <a href="arena/#arrays">LC 232 implement queue via stacks</a>, <a href="arena/#arrays">LC 189 rotate array</a>, <a href="arena/#arrays">LC 238 product except self</a>, plus "how would you resize a dynamic array?" as a classic phone-screen question.`);
    redraw(); stats();
  }
  const $ = s => document.querySelector(s);

  /* ---------- hand-shift task state ---------- */
  const hand = { active: false, moved: 0, need: 0 };

  function story() {
    return {
      title: 'World 2 · Arrays', subtitle: 'Contiguous memory, and the bill for the middle',
      steps: [
        {
          say: `This is an <b>array</b>: a row of numbered slots, one memory word apart.
          The grey plates are the <b>slots</b>; the violet blocks are your <b>items</b>.<br><br>
          Because the slots are contiguous and numbered, <code>get(2)</code> is one multiplication and one memory read — <b>O(1)</b>, forever, any slot. That's the array's superpower.`,
          task: 'Press <b>add at end</b> three times. Notice how nothing has to move out of the way.',
          hint: 'The end is free real estate: nothing lives past the last item.',
          okText: 'Appending is O(1): the next slot is always empty. Keep this in mind — the amortization step will explain the one exception.',
          learn: ['w02-array', 'w02-random-access']
        },
        {
          say: `Now the array's bill arrives. You want to <b>insert at the front</b>, but slot 0 is occupied — and so are all the others.<br><br>
          <b>You be the computer.</b> Every block must slide one slot right — and you'll move them yourself, <b>from the right end backwards</b> (moving left-to-right would overwrite data you still need).`,
          reset() {
            sim.clearPicks();
            st.stack = new DS.ArrayStack();
            [3, 1, 4, 1, 5].forEach(v => st.stack.add(st.stack.size(), v));
            hand.active = true; hand.moved = 0; hand.need = 5;
            st.mode = 'stack';
            redraw();
            // let the player move blocks by tapping them (right to left)
            sim.onPick(i => {
              if (!hand.active) return;
              const snap = st.stack.snapshot();
              // item voxels come after the cap plates: index = cap + itemIndex
              const itemIdx = i - snap.cap;
              if (itemIdx < 0 || itemIdx >= snap.items.length) return;
              const rightmost = snap.items.length - 1 - hand.moved;
              if (itemIdx !== rightmost) { api.toast('Start from the right end — otherwise you overwrite blocks you still need.'); return; }
              hand.moved++;
              redraw();
            });
          },
          task: 'Tap the blocks <b>right to left</b> to slide each one slot right. 5 blocks to move.',
          hint: 'Tap the rightmost item block first, then the next one left, and so on.',
          wait: () => {
            if (hand.moved >= hand.need) {
              if (hand.active) { // complete the real insert once, then freeze the visual
                hand.active = false;
                st.stack.add(0, st.seedv++);
                redraw();
              }
              return true;
            }
            return false;
          },
          okText: `You just paid the array's tax: <b>5 blocks moved for one insert</b>. In general, inserting at position <i>i</i> moves <b>n − i</b> blocks. Front inserts are O(n) — this is THE reason linked lists (World 3) exist.`,
          learn: ['w02-shift-cost']
        },
        {
          say: `You moved 5 blocks for one insert. Now scale it up in your head.`,
          predict: {
            q: 'An ArrayStack holds <b>20</b> items. You insert at the <b>front</b>. Exactly how many blocks must move?',
            placeholder: 'a number…',
            grade: ans => {
              const v = parseInt(ans, 10);
              return {
                right: v === 20,
                msg: v === 20 ? 'Right — all n of them. The new item needs slot 0, so every resident moves one right. Insert-at-front is <b>Θ(n)</b>.' :
                  (v === 20 - 1 || v === 19 ? 'So close — the item being inserted doesn\'t count as "moved": all <b>20</b> existing blocks shift.' : 'All <b>20</b> existing blocks shift one slot right — insert-at-front moves every resident. It\'s Θ(n).')
              };
            }
          },
          learn: ['w02-shift-cost']
        },
        {
          say: `Appends never shift. But they hit the <b>wall</b>: the array is full.
          The fix: allocate a <b>double-length</b> array, copy everyone over, and keep going.
          One append in a hundred pays O(n); the other 99 cost O(1).<br><br>
          ODS calls this <b>amortization</b> — like a mortgage: the $120,000 house costs $1,000/month over 120 months, even though one month got the whole house.`,
          task: 'Press <b>add ×20</b> and watch the "copy ops" counter. Most appends add 0 copies; a grow adds a burst.',
          hint: 'Growths happen at powers of two: caps 1→2→4→8→16→32.',
          okText: 'Total copies after 20 appends: about <b>1+2+4+8+16 = 31</b> — roughly <b>1.5 copies per append</b>, even though single appends sometimes cost 16. The average is the truth you can rely on: <b>amortized O(1)</b>.',
          learn: ['w02-amortized', 'w02-geometric']
        },
        {
          say: `Switch to <b>Queue</b> mode (in the panel). Here's the circular trick: the array never moves an item — only the <b>front marker</b> walks forward, slot by slot.<br><br>
          When the front hits the wall with free space behind it, the whole queue <b>rotates</b> back to slot 0. Watch the red front plate travel clockwise.`,
          task: 'In Queue mode: press add at end twice, then remove front twice, repeatedly — until you see the "rotated" toast.',
          hint: 'The wall is reached when the front plate has walked almost a full circle.',
          okText: 'That rotate was an O(n) slide — but again amortized away: each enqueue pays a little rent for the future rotation. Queues implemented like this power job schedulers everywhere.',
          learn: ['w02-circular']
        },
        {
          say: `Last stop: <b>Rootish</b> mode. Doubling wastes up to half the array (cap 32, n = 17).<br><br>
          RootishArrayStack instead grows in <b>blocks of size 1, 2, 3, 4…</b> — total space for r blocks is r(r+1)/2, so waste is only about <b>√(2n)</b> slots. The triangle you see IS the memory layout.`,
          task: 'In Rootish mode, press add at end a few times and watch a new, one-longer block appear when needed.',
          hint: 'Watch the widest row at the bottom grow by one block each time.',
          okText: 'Space waste: <b>O(√n)</b> instead of O(n) — at the price of O(√n) worst-case appends (still amortized O(1)). Engineering is choosing which waste you can live with.',
          learn: ['w02-rootish']
        },
        {
          say: `World 2 in one breath:<br><br>
          <b>Arrays buy O(1) random access with contiguous memory</b> and pay for it in the middle: O(n) shifts.
          Doubling makes appends amortized O(1); circular fronts make queues O(1); triangle blocks make waste √n.<br><br>
          Next: what if we refused to move blocks at all — and moved only <b>pointers</b>? World 3.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w02', id: 'w02-array', t: 'Array', d: 'A row of numbered, contiguous memory words. The numbering is what makes get(i) a single arithmetic step.' },
    { w: 'w02', id: 'w02-random-access', t: 'Random access', d: 'Any index, same constant cost — the array superpower, unique to contiguous memory.' },
    { w: 'w02', id: 'w02-shift-cost', t: 'The shift tax', d: 'Insert/remove at position i moves n−i blocks. Front inserts are Θ(n) — the reason linked lists exist.' },
    { w: 'w02', id: 'w02-amortized', t: 'Amortized cost', d: 'The honest average over a sequence: a rare expensive operation (the copy on grow) pre-paid by many cheap ones.' },
    { w: 'w02', id: 'w02-geometric', t: 'Geometric resizing', d: 'Grow ×2, shrink when 3× too big. Guarantees each item is copied O(1) times over its lifetime.' },
    { w: 'w02', id: 'w02-circular', t: 'Circular buffer', d: 'Items never move; the front marker walks forward and wraps. The trick behind queues and ring buffers in kernels.' },
    { w: 'w02', id: 'w02-rootish', t: 'RootishArrayStack', d: 'Blocks of size 1,2,3,…: O(√n) wasted space instead of O(n), amortized O(1) appends. ODS §2.6.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w02', q: 'Why is array get(i) O(1)?', opts: ['Arrays are small', 'Slot i is at a computable address: base + i words', 'The CPU caches arrays', 'It isn\'t — it\'s O(log n)'], a: 1, x: 'Contiguity + numbering = one address calculation. That\'s the word-RAM model paying off.' },
    { w: 'w02', q: 'Doubling on grow makes appends…', opts: ['worst-case O(1)', 'amortized O(1) but worst-case O(n)', 'O(n) always', 'O(log n)'], a: 1, x: 'A single grow copies everything; averaged over the sequence it\'s ~O(1) per append.' },
    { w: 'w02', q: 'The circular queue avoids moving items by…', opts: ['sorting them', 'moving only the front marker forward', 'using two arrays', 'linked lists'], a: 1, x: 'The front walks and wraps; an occasional rotate re-centers everything, amortized away.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w02', tab: 'Arrays', book: '§2',
    title: 'Arrays — one row to rule them all',
    lede: 'Contiguous memory buys instant access to any index — and charges O(n) for the middle. Meet the shift tax, the doubling bank of amortization, the circular queue and the triangle trick. <b>ODS §2.</b>',
    mount, story
  });
})();
