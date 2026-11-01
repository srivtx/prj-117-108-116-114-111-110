/* ============================================================
   W03 · CHAINS — ODS §3. SLList, DLList, and the pointer bet:
   never move data, rewire links instead. You splice by hand,
   you walk node by node, and you meet the cache bill.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { node: '#5d4fe0', dummy: '#5e5b82', next: '#d94f70', prev: '#a0a0b8', new: '#0f9e8e', flash: '#c8920e' };
  let api, sim;
  const st = { mode: 'dl', list: null, seq: 1 };
  const hand = { active: false, taps: 0 };

  function nodes() { return st.list.snapshot().items; }
  function pos(i, arr) {
    // gentle scattered path — nodes are NOT neighbors in memory
    const a = arr || nodes();
    const seedJit = ((i * 2654435761) % 97) / 97;
    return [i * 2.4 - (a.length - 1) * 1.2, 1.15 + Math.sin(i * 1.3) * 0.85, (seedJit - 0.5) * 2.6];
  }

  function draw(extra) {
    const arr = nodes();
    let vi = 0, li = 0, lk = 0;
    const positions = arr.map((_, i) => pos(i, arr));
    // links first (below blocks visually)
    for (let i = 0; i + 1 < arr.length; i++) {
      const a = positions[i], b = positions[i + 1];
      sim.links.set(lk++, [a[0] + 0.55, a[1], a[2]], [b[0] - 0.55, b[1], b[2]], C.next);
      if (st.mode === 'dl') sim.links.set(lk++, [b[0] - 0.55, b[1] - 0.62, b[2]], [a[0] + 0.55, a[1] - 0.62, a[2]], C.prev);
    }
    sim.links.count(lk);
    // dummy node
    sim.vox.set(vi++, -(arr.length * 2.4) / 2 - 1.9, 1.15, 0, C.dummy, 0.85, 0.85, 0.85);
    sim.labels.set(li++, -(arr.length * 2.4) / 2 - 1.9, 2.25, 0, '◇', { color: '#ffffff', size: 26 });
    if (arr.length) {
      const d = [-(arr.length * 2.4) / 2 - 1.9, 1.15, 0];
      sim.links.set(lk++, [d[0] + 0.5, d[1], d[2]], [positions[0][0] - 0.55, positions[0][1], positions[0][2]], C.next);
      if (st.mode === 'dl') sim.links.set(lk++, [positions[0][0] - 0.55, positions[0][1] - 0.62, positions[0][2]], [d[0] + 0.5, d[1] - 0.62, d[2]], C.prev);
      sim.links.count(lk);
    }
    arr.forEach((n, i) => {
      const p = positions[i];
      const isExtra = extra && extra.id === n.id;
      sim.vox.set(vi++, p[0], p[1], p[2], isExtra ? C.new : C.node, 1.05, 1.05, 1.05);
      sim.labels.set(li++, p[0], p[1] + 1.15, p[2], String(n.x), { color: '#ffffff', size: 30 });
    });
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    if (arr.length > 1) {
      const last = positions[arr.length - 1], d = [-(arr.length * 2.4) / 2 - 1.9, 1.15, 0];
      sim.links.set(lk++, [last[0] + 0.55, last[1], last[2]], [d[0] - 0.5, d[1] + 0.35, d[2]], st.mode === 'dl' ? C.prev : '#c9c9dd');
      sim.links.count(lk);
    }
    sim.labels.set(80, 0, 4.6, 0, `${st.mode === 'dl' ? 'DLList' : 'SLList'} · ${arr.length} nodes · next ${st.mode === 'dl' ? '+ prev' : 'only'}`, { color: '#5d5d75', size: 26, w: 12, h: 1 });
  }

  function walkTo(i, done) { // animate the hops of get(i)
    const arr = nodes();
    let k = 0;
    const step = () => {
      if (k > i || k >= arr.length) { if (done) done(); return; }
      // pulse voxel: dummy is 0, node j is voxel j+1
      sim.pulse(k + 1, 380);
      api.toast(`hop ${k}: at node ${JSON.stringify(arr[k].x)}`);
      k++;
      setTimeout(step, 420);
    };
    step();
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.list = new DS.DLList(); st.mode = 'dl';
    [4, 7, 1, 9].forEach((v, i) => st.list.add(i, v));
    sim.cam.view({ target: [0, 1, 0], r: 30, theta: -0.35, phi: 1.15 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>flavor</label>
        <div class="seg" id="ch-mode">
          <button data-m="dl" aria-pressed="true">Doubly</button>
          <button data-m="sl">Singly</button>
        </div><span></span></div>
      <div class="ctl"><label>get(i)</label><input type="range" id="ch-i" min="0" max="3" value="2"><output id="ch-i-o">i=2</output></div>
      <div class="btns">
        <button class="btn primary" id="ch-front">add front</button>
        <button class="btn" id="ch-back">add back</button>
        <button class="btn" id="ch-rm">remove front</button>
        <button class="btn" id="ch-walk">walk get(i)</button>
        <button class="btn" id="ch-rev">reverse</button>
      </div>
      <p class="note">Nodes are drawn scattered on purpose: each lives wherever malloc put it. Only the <b>arrows</b> give the order. Tap <b>walk</b> to feel random access die.</p>`;
    const refreshMax = () => { const s = $('#ch-i'); s.max = Math.max(0, nodes().length - 1); };
    $('#ch-mode').querySelectorAll('button').forEach(b => b.onclick = () => {
      $('#ch-mode').querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true');
      st.mode = b.dataset.m;
      draw();
    });
    $('#ch-i').oninput = e => { $('#ch-i-o').textContent = 'i=' + e.target.value; };
    $('#ch-front').onclick = () => { st.list.add(0, st.seq++ % 10); refreshMax(); draw({ id: nodes()[0].id }); };
    $('#ch-back').onclick = () => { st.list.add(st.list.size(), st.seq++ % 10); refreshMax(); draw({ id: nodes()[nodes().length - 1].id }); };
    $('#ch-rm').onclick = () => { if (st.list.size()) st.list.remove(0); refreshMax(); draw(); };
    $('#ch-walk').onclick = () => walkTo(Math.min(+$('#ch-i').value, nodes().length - 1));
    $('#ch-rev').onclick = () => { // reverse the chain, one flip at a time
      const arr = nodes();
      let k = 0;
      const flip = () => {
        if (k >= arr.length - 1) { draw(); api.toast('reversed — every next pointer now points backwards'); return; }
        sim.pulse(k + 1, 400); k++;
        setTimeout(flip, 300);
      };
      // actually reverse the DLList contents
      const vals = arr.map(n => n.x).reverse();
      st.list = new DS.DLList(); vals.forEach(v => st.list.add(st.list.size(), v));
      flip();
    };

    api.hint('Drag to spin · tap walk get(i) and count the hops — that is the cost of no random access');
    api.legend(`<b>${'Linked list'}</b><div class="row"><span><i class="sw" style="background:${C.node}"></i>node</span><span><i class="sw" style="background:${C.next}"></i>next</span>${st.mode === 'dl' ? `<span><i class="sw" style="background:${C.prev}"></i>prev</span>` : ''}<span><i class="sw" style="background:${C.dummy}"></i>dummy</span></div>`);
    api.why(`
      <p style="margin:0 0 8px"><b>The list's bet:</b> memory anywhere, order carried by <b>links</b>. Splice = rewire 2–4 pointers, O(1), no matter where. Front/back ops O(1) with a tail pointer.</p>
      <p style="margin:0 0 8px"><b>The price:</b> no random access (<code>get(i)</code> is a walk — Θ(min(i, n−i)) in a DLList), and <b>cache hostility</b>: each hop can land anywhere in RAM.</p>
      <p style="margin:0"><b>Reality check:</b> an array's shift often beats a list's walk on modern hardware, because the CPU fetches array neighbors for free. Lists win when splices dominate and you already hold the node.</p>`);
    api.arena(`The list is interview royalty: <a href="arena/#lists">LC 206 reverse list</a>, <a href="arena/#lists">LC 141 cycle (Floyd's tortoise)</a>, <a href="arena/#lists">LC 21 merge two lists</a>, <a href="arena/#lists">LC 138 copy with random pointer</a>.`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 3 · Chains', subtitle: 'Never move data — rewire pointers',
      steps: [
        {
          say: `World 2's array taxed every middle insert. The linked list makes the opposite bet:<br><br>
          <b>items never move</b>. Each node is a little box holding a value plus the <b>address of its successor</b>. The ◇ on the left is the <b>dummy node</b> — a permanent "before the beginning" that makes empty lists and edge cases disappear (no special cases!).`,
          task: 'Press <b>add front</b> and <b>add back</b> a few times. Watch: no block ever slides — only arrows grow.',
          hint: 'New nodes appear wherever there is room; the arrows carry the order.',
          okText: 'Zero shifts. Inserting anywhere you can already reach is O(1): pay two pointer writes (four in a DLList) and go home.',
          learn: ['w03-node', 'w03-dummy']
        },
        {
          say: `Now <b>you</b> splice. We'll insert a green node <b>X</b> between the 1st and 2nd nodes — the same job that cost you 5 block-moves in World 2.<br><br>
          Tap the <b>left neighbour</b> first, then the <b>right neighbour</b>. Those are the only two pointers that will be rewritten.`,
          reset() {
            sim.clearPicks();
            st.list = new DS.DLList(); [8, 3].forEach((v, i) => st.list.add(i, v));
            hand.active = true; hand.taps = 0;
            draw();
            sim.onPick(i => {
              if (!hand.active || i < 1 || i > nodes().length) return;
              const which = i - 1;
              if (hand.taps === 0 && which !== 0) { api.toast('First tap the LEFT neighbour — the node before the gap.'); return; }
              if (hand.taps === 1 && which !== 1) { api.toast('Now the RIGHT neighbour — the node after the gap.'); return; }
              hand.taps++;
              if (hand.taps === 2) {
                hand.active = false;
                st.list.add(1, 'X');
                draw({ id: nodes()[1].id });
                api.toast('2 pointer writes (×2 for prev). Done.');
              }
            });
          },
          task: 'Tap node <b>8</b> (left neighbour), then node <b>3</b> (right neighbour) to splice X between them.',
          hint: 'The nodes are the violet cubes; their values float above them.',
          wait: () => hand.taps >= 2,
          okText: '<b>Two taps</b> — two <code>next</code> rewrites (plus two <code>prev</code> rewrites in a DLList). Compare with the 5-block shuffle of World 2. THIS is why lists exist.',
          learn: ['w03-splice']
        },
        {
          say: `But lists broke something the array had: <b>random access</b>. The list does not know where its 5th node lives — the only way in is to <b>hop</b>.<br><br>
          <code>get(i)</code> = start at the dummy, follow <code>next</code> i times.`,
          reset() {
            st.list = new DS.DLList();
            [2, 5, 8, 1, 4, 7, 3, 6, 9, 0].forEach((v, i) => st.list.add(i, v));
            $('#ch-i').max = 9; $('#ch-i').value = 6; $('#ch-i-o').textContent = 'i=6';
            draw();
          },
          task: 'Make sure the get(i) slider reads <b>i=6</b>, then press <b>walk get(i)</b>. Count the hops.',
          hint: 'Each hop is one "follow the pointer" step.',
          okText: 'Seven hops (dummy → 6 nodes away) to reach index 6. A DLList is a little smarter: it starts from whichever end is nearer — index 6 of 10 walks from the tail in 4 hops. Still: Θ(i) or Θ(n−i), never O(1).',
          learn: ['w03-walk']
        },
        {
          say: `Quick check that the bidirectional trick stuck. Same 10-node DLList as on screen: values <span class="num">2 5 8 1 4 7 3 6 9 0</span>.`,
          predict: {
            q: 'DLList.get(8) — how many pointer hops if it starts from the <b>nearest end</b>?',
            placeholder: 'hops…',
            grade: ans => {
              const v = parseInt(ans, 10);
              return {
                right: v === 2,
                msg: v === 2
                  ? 'Right: index 8 of 10 is 2 hops from the <b>tail</b> (8 → 9 → target), versus 9 from the head. min(i+1, n−i) — the DLList walks the short way.'
                  : `Index 8 of 10 is only <b>2 hops from the tail</b> (the dummy is 1 past the end): 8 → 9 → target. The DLList walks whichever side is nearer: cost min(i+1, n−i).`
              };
            }
          },
          learn: ['w03-dl-walk']
        },
        {
          say: `One honest bill the diagrams hide: <b>the cache</b>.<br><br>
          Array items are neighbors in RAM — when the CPU reads one, it pulls its neighbors into cache for free. List nodes are scattered (that's why this world draws them scattered): every hop risks a cache miss, ~100× slower than a register read.<br><br>
          This is why ODS (and every systems course) warns: <b>on real hardware, arrays often win even where lists are "faster" on paper.</b>`,
          learn: ['w03-cache']
        },
        {
          say: `Last move — the single most-asked list question: <b>reverse it</b>. No new nodes: flip every pointer, O(n) time, O(1) extra space.<br><br>
          In the arena this exact walk is <b>LC 206</b>, usually asked as "iteratively, then recursively, then tell me the cost of each".`,
          task: 'Press <b>reverse</b> and watch each next pointer flip, one node at a time.',
          hint: 'The chain runs right-to-left afterwards; the dummy stays put.',
          okText: 'Reverse = three pointers walking (prev, curr, next), flipping one link each step. You will re-derive it yourself in the Arena.',
          learn: ['w03-reverse']
        },
        {
          say: `World 3 in one breath:<br><br>
          <b>Lists trade random access for O(1) splices</b>. Use them when you hold the node and splice often; use arrays when you index; and know the cache makes arrays punch above their class.<br><br>
          Next: what if we wanted <b>search</b> in a sorted world — fast — without any of this walking? World 4 builds express lanes.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w03', id: 'w03-node', t: 'Node', d: 'A value + the address of the next node (and the previous one, in a DLList). Order lives in pointers, not positions.' },
    { w: 'w03', id: 'w03-dummy', t: 'Dummy node', d: 'A permanent node before the start. Every node then has a predecessor — empty lists, head and tail cases all collapse into one uniform rule.' },
    { w: 'w03', id: 'w03-splice', t: 'Splice', d: 'Insert/remove by rewriting 2 ( singly) or 4 (doubly) pointers. O(1), position-independent — the list superpower.' },
    { w: 'w03', id: 'w03-walk', t: 'The walk', d: 'get(i) hops i times from the head. No arithmetic shortcut exists: no random access.' },
    { w: 'w03', id: 'w03-dl-walk', t: 'Walk from the near end', d: 'A DLList starts at whichever end is nearer: cost min(i+1, n−i).' },
    { w: 'w03', id: 'w03-cache', t: 'The cache bill', d: 'Array neighbors load into cache together; scattered nodes miss. On real hardware, this can flip the paper verdict.' },
    { w: 'w03', id: 'w03-reverse', t: 'Reverse', d: 'Three pointers (prev, curr, next) walk once, flipping links. O(n) time, O(1) space — LC 206.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w03', q: 'Inserting between two nodes you already hold costs…', opts: ['O(1) — rewrite a few pointers', 'O(n) — always', 'O(log n)', 'O(√n)'], a: 0, x: 'The splice never moves data: 2 pointer writes singly, 4 doubly.' },
    { w: 'w03', q: 'get(2) in a 100-node DLList costs about…', opts: ['1 hop', '3 hops', '50 hops', '7 hops'], a: 1, x: 'Index 2 is nearest the head: dummy+2 hops ≈ 3 pointer reads.' },
    { w: 'w03', q: 'The dummy node exists so that…', opts: ['memory is aligned', 'every node has a predecessor and edge cases vanish', 'the list can be reversed', 'search is faster'], a: 1, x: 'Empty list, head, and tail all become "insert after some node" — one code path, no special cases.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w03', tab: 'Chains', book: '§3',
    title: 'Chains — pointers instead of positions',
    lede: 'The linked list refuses to move data: order is carried by arrows, splices cost two pointer writes. But get(i) becomes a walk you can feel, and the CPU cache keeps score. <b>ODS §3.</b>',
    mount, story
  });
})();
