/* ============================================================
   W05 · HASHING — ODS §5. Compute the address from the value
   itself. You read the multiply-and-shift pipeline by hand,
   meet the birthday paradox at the bins, then probe linearly
   and learn why tombstones exist.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { ball: '#5d4fe0', bin: '#c9c9dd', hot: '#d94f70', tomb: '#5e5b82', ok: '#0f9e8e', chain: '#c8920e' };
  let api, sim;
  const st = { mode: 'chained', table: null, lt: null, z: 0, d: 4, inserts: 0, rnd: DS.mulberry32(31) };
  const binX = i => (i - (st.d === 4 ? 7.5 : 7.5)) * 1.75;

  function bits32(v) { return (v >>> 0).toString(2).padStart(32, '0'); }

  function drawChained(hotBucket) {
    const snap = st.table.snapshot();
    let vi = 0, li = 0;
    snap.buckets.forEach((b, i) => {
      sim.vox.set(vi++, binX(i), 0.22, 0, hotBucket === i ? C.hot : C.bin, 1.35, 0.16, 1.35);
      sim.labels.set(li++, binX(i), -0.75, 0, String(i), { color: '#5d5d75', size: 24 });
      b.forEach((e, k) => {
        sim.vox.set(vi++, binX(i), 0.85 + k * 1.02, 0, k === 0 ? C.ball : C.chain, 1, 0.9, 0.9);
        sim.labels.set(li++, binX(i), 0.85 + k * 1.02, 0.78, String(e.x), { color: '#ffffff', size: 26 });
      });
    });
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    const longest = Math.max(0, ...snap.buckets.map(b => b.length));
    sim.labels.set(70, 0, 6.4, 0, `${st.table.size()} items · ${snap.buckets.length} buckets · load ${st.table.size() / snap.buckets.length} · longest chain ${longest}`, { color: '#5d5d75', size: 26, w: 17, h: 1.1 });
    sim.links.hideAll();
    api.legend(`<b>Chaining</b> — each bucket is its own little list<div class="row"><span><i class="sw" style="background:${C.ball}"></i>first in chain</span><span><i class="sw" style="background:${C.chain}"></i>collision link</span><span><i class="sw" style="background:${C.hot}"></i>just hashed here</span></div><div class="row" style="margin-top:4px;font-family:var(--f-mono)">z = ${st.z} · h(x) = top ${st.d} bits of (z·x mod 2³²)</div>`);
  }

  function drawProbing(hotSlot) {
    const snap = st.lt.snapshot();
    let vi = 0, li = 0;
    snap.slots.forEach((s, i) => {
      sim.vox.set(vi++, binX(i), 0.22, 0, hotSlot === i ? C.hot : C.bin, 1.35, 0.16, 1.35);
      sim.labels.set(li++, binX(i), -0.75, 0, String(i), { color: '#5d5d75', size: 24 });
      if (s === 'DEL') {
        sim.vox.set(vi++, binX(i), 0.85, 0, C.tomb, 0.85, 0.85, 0.85);
        sim.labels.set(li++, binX(i), 0.85, 0.8, '†', { color: '#ffffff', size: 26 });
      } else if (s) {
        sim.vox.set(vi++, binX(i), 0.85, 0, C.ball, 1, 0.9, 0.9);
        sim.labels.set(li++, binX(i), 0.85, 0.8, String(s.x), { color: '#ffffff', size: 26 });
      }
    });
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(70, 0, 5.6, 0, `${st.lt.size()} items + ${snap.slots.filter(s => s === 'DEL').length} tombstones · ${snap.slots.length} slots`, { color: '#5d5d75', size: 26, w: 16, h: 1 });
    sim.links.hideAll();
    api.legend(`<b>Linear probing</b> — one array, no pointers<div class="row"><span><i class="sw" style="background:${C.ball}"></i>item</span><span><i class="sw" style="background:${C.tomb}"></i>tombstone † (deleted)</span><span><i class="sw" style="background:${C.hot}"></i>probe path</span></div>`);
  }

  function draw(hot) { st.mode === 'chained' ? drawChained(hot) : drawProbing(hot); stats(); }

  function probeAnim(x) {
    let i = DS.mulHash(st.z, x, st.d);
    const start = i;
    const snap = st.lt.snapshot();
    let steps = 0;
    const walk = () => {
      const s = snap.slots[i];
      if (steps > 0 || true) sim.pulse(i, 400); // pulse plate: recompute index mapping is fragile; flash the bin plate
      if (s === null) { st.lt.add(x); draw(start); api.toast(`x=${x} → h=${start}, probed ${steps + 1} slot(s), landed at ${i}`); return; }
      steps++;
      if (steps > snap.slots.length) { api.toast('table full — resize first'); return; }
      i = (i + 1) % snap.slots.length;
      setTimeout(walk, 240);
    };
    walk();
  }

  function stats() {
    const el = api.stats(true); el.innerHTML = '';
    const mk = (l, v, cls) => { const d = document.createElement('div'); d.innerHTML = `<span>${l}</span><b class="${cls || ''}">${v}</b>`; el.appendChild(d); };
    if (st.mode === 'chained') {
      const snap = st.table.snapshot();
      const longest = Math.max(0, ...snap.buckets.map(b => b.length));
      mk('items', st.table.size());
      mk('load n/m', (st.table.size() / snap.buckets.length).toFixed(2));
      mk('longest chain', longest, longest > 3 ? 'no' : 'ok');
    } else {
      mk('items', st.lt.size());
      mk('slots', st.lt.snapshot().slots.length);
      mk('load', (st.lt.q / st.lt.snapshot().slots.length).toFixed(2), st.lt.q / st.lt.snapshot().slots.length > 0.7 ? 'no' : 'ok');
    }
  }

  function insert(x) {
    st.inserts++;
    if (st.mode === 'chained') {
      const h = DS.mulHash(st.z, x, st.d);
      const before = st.table.size();
      st.table.add(x);
      draw(h);
      const chain = st.table.snapshot().buckets[h].length;
      if (st.table.size() > before) api.toast(`x=${x} → bucket ${h} · chain length now ${chain}`);
      else api.toast(`x=${x} already present`);
    } else probeAnim(x);
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.rnd = DS.mulberry31 || DS.mulberry32(31);
    const rnd = DS.mulberry32(31);
    while (st.z % 2 === 0) st.z = Math.floor(rnd() * 4294967295) | 1;
    st.table = new DS.ChainedHashTable(4, 42); st.table.z = st.z;
    st.lt = new DS.LinearHashTable(4, 42); st.lt.z = st.z;
    sim.cam.view({ target: [0, 2.2, 0], r: 34, theta: -0.75, phi: 1.1 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>mode</label>
        <div class="seg" id="h-mode">
          <button data-m="chained" aria-pressed="true">Chaining</button>
          <button data-m="probing">Linear probing</button>
        </div><span></span></div>
      <div class="ctl"><label>x</label><input type="range" id="h-x" min="0" max="63" value="17"><output id="h-x-o">17</output></div>
      <div class="btns">
        <button class="btn primary" id="h-ins">insert x</button>
        <button class="btn" id="h-rand">random ×10</button>
        <button class="btn" id="h-del">delete x</button>
        <button class="btn" id="h-grow">resize ×2</button>
        <button class="btn" id="h-reset">reset</button>
      </div>
      <p class="note" id="h-pipe"></p>`;
    const pipe = () => {
      const x = +$('#h-x').value;
      const prod = (BigInt(st.z) * BigInt(x >>> 0)) & 0xFFFFFFFFn;
      const b = prod.toString(2).padStart(32, '0');
      $('#h-pipe').innerHTML = `h(${x}) pipeline: z·${x} mod 2³² = <code>${b.slice(0, 4)}<b style="color:var(--c1)">${b.slice(4)}</b></code> → top ${st.d} bits = <b>${parseInt(b.slice(0, 4), 2)}</b>`;
    };
    $('#h-x').oninput = e => { $('#h-x-o').textContent = e.target.value; pipe(); };
    $('#h-mode').querySelectorAll('button').forEach(b => b.onclick = () => {
      $('#h-mode').querySelectorAll('button').forEach(x2 => x2.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true');
      st.mode = b.dataset.m; draw();
    });
    $('#h-ins').onclick = () => insert(+$('#h-x').value);
    $('#h-rand').onclick = () => {
      let k = 0; const iv = setInterval(() => {
        insert(Math.floor(Math.random() * 64));
        if (++k >= 10) clearInterval(iv);
      }, 220);
    };
    $('#h-del').onclick = () => {
      const x = +$('#h-x').value;
      if (st.mode === 'chained') { st.table.remove(x); draw(); api.toast(`removed ${x} from its chain`); }
      else {
        const snap = st.lt.snapshot();
        const idx = snap.slots.findIndex(s => s && s !== 'DEL' && s.x === x);
        if (idx < 0) { api.toast(`${x} not in the table`); return; }
        st.lt.remove(x); draw(idx); api.toast(`deleted ${x} → a tombstone † must stay, or probes past it would stop early`);
      }
    };
    $('#h-grow').onclick = () => {
      if (st.mode === 'chained') { st.table.grow(); st.d = st.table.d; }
      else { st.lt.grow(); st.d = st.lt.d; }
      draw(); api.toast(`rehashed into ${1 << st.d} buckets with the same z`);
    };
    $('#h-reset').onclick = () => {
      st.table = new DS.ChainedHashTable(4, 42); st.table.z = st.z; st.d = 4;
      st.lt = new DS.LinearHashTable(4, 42); st.lt.z = st.z;
      draw();
    };

    api.hint('Drag to spin · the pipeline line under the buttons IS the hash function — read it like the machine does');
    api.why(`
      <p style="margin:0 0 8px"><b>The hash bet:</b> stop comparing — <i>compute</i> where a key lives: <code>h(x) = top d bits of (z·x mod 2³²)</code>. Expected O(1) find/add/remove.</p>
      <p style="margin:0 0 8px"><b>Chaining</b> tolerates load > 1 with simple lists; <b>linear probing</b> has no pointers and loves the cache — but clusters grow quadratically as load → 1, so resize around ¾.</p>
      <p style="margin:0"><b>The z is chosen at random per run</b> (universal hashing): no key set can be crafted against <i>your</i> table, because the adversary doesn't know your z. Randomness again buying guarantees — same trick as W04's coins.</p>`);
    api.arena(`Hash maps are the most-used structure in practice and in interviews: <a href="arena/#hashing">LC 1 two sum</a>, <a href="arena/#hashing">LC 217 contains duplicate</a>, <a href="arena/#hashing">LC 128 longest consecutive</a>, and the design-heavy <a href="arena/#hashing">LC 146 LRU cache</a> (hash + doubly-linked list — Worlds 3+5 combined).`);
    pipe(); draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 5 · Hashing', subtitle: 'Stop searching — compute the address',
      steps: [
        {
          say: `Binary search needed <b>log n</b> comparisons because it only knew <i>less / greater</i>.<br><br>
          Hashing asks a different question: <b>what if the value itself told us the address?</b>
          Like a phone book printed with "S → page 812": no searching, one jump.<br><br>
          The machine on the right of the panel is our oracle: it multiplies x by a big random odd number <b>z</b>, keeps the low 32 bits, and reads off the <b>top 4 bits</b> — that's the bucket. Read the pipeline line: it shows every bit.`,
          task: 'Move the x slider and watch the pipeline line recompute. Then press <b>insert x</b> for x = 17.',
          hint: 'The bold top bits of the product ARE the bucket number, in binary.',
          okText: `The bucket came from arithmetic, not comparison: multiply, mask, shift. One word-RAM operation (W01) — this is why hashing is O(1): it IS just arithmetic.`,
          learn: ['w05-hash-fn', 'w05-mul-hash']
        },
        {
          say: `Now <b>you</b> are the hash function. Same pipeline, a fresh value:`,
          reset() {
            st.quizX = 41;
            const prod = (BigInt(st.z) * BigInt(41)) & 0xFFFFFFFFn;
            st.quizBits = prod.toString(2).padStart(32, '0');
          },
          predict: {
            q: () => `z·41 mod 2³² starts with the 32 bits <code style="font-size:12px">${st.quizBits ? '<b>' + st.quizBits.slice(0, 4) + '</b>' + st.quizBits.slice(4) : ''}</code><br>The bucket is the <b>top 4 bits</b>. Which bucket number is that (0–15)?`,
            placeholder: '0–15…',
            grade: ans => {
              const v = parseInt(ans, 10);
              const truth = parseInt(st.quizBits.slice(0, 4), 2);
              return {
                right: v === truth,
                msg: v === truth
                  ? `Exactly — <code>${st.quizBits.slice(0, 4)}</code> in binary is <b>${truth}</b>. You just executed a hash function by hand. Every insert you'll ever do is this + a modulo.`
                  : `Read the first four bits as one binary number: <code>${st.quizBits.slice(0, 4)}</code> = <b>${truth}</b>. (Binaries: 0000=0, 0001=1 … 1111=15.)`
              };
            }
          },
          learn: ['w05-mul-hash']
        },
        {
          say: `16 buckets, and we're about to drop 12 balls in. Two values may want the same bucket — a <b>collision</b> — and no hash function can prevent it: 17 pigeons, 16 holes (the pigeonhole principle).`,
          reset() { st.table = new DS.ChainedHashTable(4, 42); st.table.z = st.z; st.inserts = 0; draw(); },
          predict: {
            q: '12 balls fly independently into 16 buckets. Roughly how many buckets stay <b>empty</b>?<br><small>(intuition first — exact math is optional)</small>',
            placeholder: 'a number…',
            grade: ans => {
              const v = parseInt(ans, 10);
              const ok = v >= 3 && v <= 8;
              return {
                right: ok,
                msg: ok
                  ? `Good instinct. The expected count is 16·(15/16)¹² ≈ <b>5.6</b> empty buckets — which also means collisions are near-certain: the <b>birthday paradox</b> (the Stats page makes you run it). Hash tables aren't built to avoid collisions — they're built to live with them.`
                  : `Expected: each bucket dodges 12 balls with chance (15/16)¹² ≈ 35% → about <b>5.6</b> empty of 16. Collisions are near-certain — the birthday paradox. Tables are built to live with collisions, not to avoid them.`
              };
            }
          },
          learn: ['w05-collision', 'w05-birthday']
        },
        {
          say: `Press <b>random ×10</b> twice. Collisions become <b>chains</b>: each bucket is its own mini-list (gold links) — ODS's <b>ChainedHashTable</b>.`,
          task: 'Fill the table to 20+ items (random ×10 twice). Watch the longest-chain stat and the load n/m.',
          hint: 'Chains stay short while load is low; each doubling of load roughly doubles chain length.',
          okText: 'With load ~1, the average chain is ~1: find = compute bucket (O(1)) + walk a chain of expected length <b>n/m</b>. That\'s why real tables resize near load ¾: keep chains ~1 long, keep everything O(1) expected.',
          learn: ['w05-chaining', 'w05-load']
        },
        {
          say: `Switch to <b>Linear probing</b> — the no-pointers hash table. A collision doesn't build a chain; it just walks to the <b>next free slot</b> (i+1, i+2, …). One array, everything adjacent: the cache's favorite structure.<br><br>
          But two rules of the road: clusters grow <i>quadratically*</i> as the table fills — and <b>deletes can't just clear a slot</b>: a probe walking past would stop early. Enter the <b>tombstone †</b>.`,
          task: 'In probing mode: insert several values, then <b>delete</b> one from the middle of a probe path and try to find values that hashed before it.',
          hint: 'Delete x (slider) where another value probed past that slot.',
          okText: 'The † stays behind as a "keep walking" sign. Tombstones pile up → periodic rehash. Probing at load 0.9 averages 50+ probes per insert; at 0.5, ~2.5. Load factor IS the whole game.',
          learn: ['w05-probing', 'w05-tombstone']
        },
        {
          say: `Notice <b>z is re-drawn at every reset</b>. That's <b>universal hashing</b>: a family of functions, one chosen at random per run.<br><br>
          An adversary can craft inputs that destroy <i>one fixed</i> hash function — but can't know which z your run drew. Same trick as W04's coins, one world earlier than the trees need it.<br><br>
          Expected O(1) against <i>any</i> input. That's the deal hashing signs.`,
          learn: ['w05-universal']
        },
        {
          say: `World 5 in one breath:<br><br>
          <b>Hashing = arithmetic instead of comparison.</b> O(1) expected find/add/remove, at the price of no order (you can't ask "what's after x?" — that's the SSet world of trees).<br><br>
          Next: trees — order AND logarithms, in one structure.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w05', id: 'w05-hash-fn', t: 'Hash function', d: 'Turns a key into a bucket index with arithmetic. h(x) = top d bits of (z·x mod 2³²), z a random odd 32-bit number.' },
    { w: 'w05', id: 'w05-mul-hash', t: 'Multiplicative hashing', d: 'Multiply by odd z, keep 32 bits, take the top d. One word-RAM multiply — cheap AND well-spread. ODS §5.1.2.' },
    { w: 'w05', id: 'w05-collision', t: 'Collision', d: 'Two keys, one bucket. Unavoidable by pigeonhole; the design question is only how to live with them.' },
    { w: 'w05', id: 'w05-birthday', t: 'Birthday paradox', d: '12 balls in 16 buckets: ~5.6 buckets stay empty — collisions near-certain. Fewer buckets than you think fill "sparsely".' },
    { w: 'w05', id: 'w05-chaining', t: 'Chaining', d: 'Each bucket is a list. find = h(x) + walk a chain of expected length n/m (the load factor).' },
    { w: 'w05', id: 'w05-load', t: 'Load factor n/m', d: 'Average chain length / probe cost driver. Real tables resize around ¾ to keep O(1) honest.' },
    { w: 'w05', id: 'w05-probing', t: 'Linear probing', d: 'Collision → try the next slot. No pointers, cache-perfect. Clusters grow badly as load → 1.' },
    { w: 'w05', id: 'w05-tombstone', t: 'Tombstone †', d: 'A deleted slot that still says "keep probing" — clearing it outright would hide keys inserted past it.' },
    { w: 'w05', id: 'w05-universal', t: 'Universal hashing', d: 'Pick z at random per run: no adversary can target your table. Randomness as a guarantee, again.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w05', q: 'Hash tables achieve O(1) expected find because…', opts: ['they keep data sorted', 'the bucket comes from arithmetic, not comparisons', 'CPUs have hash instructions', 'they use trees inside'], a: 1, x: 'One multiply + mask computes the address; only the short chain walk remains.' },
    { w: 'w05', q: 'Why can\'t a linear-probe delete just empty the slot?', opts: ['Memory can\'t be freed', 'Probes walking past would stop early and miss further keys', 'It can — tombstones are tradition', 'It breaks the hash function'], a: 1, x: 'A gap in the probe path hides keys inserted beyond it. Hence tombstones.' },
    { w: 'w05', q: 'Expected chain length in a chained table with load factor n/m:', opts: ['1', 'n/m', 'log n', 'm/n'], a: 1, x: 'Balls are spread by expectation: each bucket holds n/m items on average.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w05', tab: 'Hashing', book: '§5',
    title: 'Hashing — arithmetic instead of search',
    lede: 'Compute the address from the value itself. You run the multiply-and-shift pipeline by hand, collide with the birthday paradox, then probe, cluster and tombstone your way to expected O(1). <b>ODS §5.</b>',
    mount, story
  });
})();
