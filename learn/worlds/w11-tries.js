/* ============================================================
   W11 · TRIES — ODS §13. When keys are numbers, you can ask
   the bits directly: no comparisons at all. Walk a value bit
   by bit down the trie, then compare against the BST's fork
   walk — and meet the structure that can beat log n.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { internal: '#5e5b82', leaf: '#5d4fe0', hot: '#d94f70', ok: '#0f9e8e', zero: '#c9c9dd', one: '#c8920e', chain: '#0f9e8e' };
  let api, sim;
  const st = { bt: null, w: 5, walkX: null };
  const hand = { active: false, taps: 0, path: [] };

  function layout() {
    // level → y; in-level index → x
    const pos = new Map();
    const walk = (node, level, idx, idxOf) => {
      if (!node) return;
      pos.set(node.id, { node, level, x: (idx - (Math.pow(2, level) - 1) / 2) * 4.6, y: 12 - level * 1.9 });
      if (node.kind === 'internal') {
        if (node.child[0]) walk(node.child[0], level + 1, 2 * idx + 1);
        if (node.child[1]) walk(node.child[1], level + 1, 2 * idx + 2);
      }
    };
    walk(st.bt.root, 0, 0);
    return pos;
  }

  function draw(hotId) {
    const pos = layout();
    let vi = 0, li = 0, lk = 0;
    // edges
    for (const p of pos.values()) {
      if (p.node.kind !== 'internal') continue;
      for (let b = 0; b < 2; b++) {
        const c = p.node.child[b];
        if (c && pos.has(c.id)) {
          const q = pos.get(c.id);
          sim.links.set(lk++, [p.x, p.y - 0.6, 0], [q.x, q.y + 0.6, 0], b === 0 ? C.zero : C.one);
        }
      }
    }
    sim.links.count(lk);
    // nodes
    for (const p of pos.values()) {
      const isLeaf = p.node.kind === 'leaf';
      const col = hotId === p.node.id ? C.hot : (isLeaf ? C.leaf : C.internal);
      sim.vox.set(vi++, p.x, p.y, 0, col, isLeaf ? 1.25 : 0.95, isLeaf ? 1.25 : 0.95, isLeaf ? 1.25 : 0.95);
      if (isLeaf) sim.labels.set(li++, p.x, p.y + 1.25, 0, String(p.node.x), { color: '#ffffff', size: 30 });
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    // leaves doubly-linked chain (sorted successor)
    let lk2 = lk;
    let prev = null;
    for (const n of st.bt.snapshot().leaves) { /* need leaf nodes — rebuild via walk */ }
    const leafNodes = [];
    { let p = st.bt.first; while (p) { leafNodes.push(p); p = p.next; } }
    for (let k = 0; k + 1 < leafNodes.length; k++) {
      const a = pos.get(leafNodes[k].id), b = pos.get(leafNodes[k + 1].id);
      if (a && b) sim.links.set(lk2++, [a.x + 0.7, a.y - 0.75, 0.4], [b.x - 0.7, b.y - 0.75, 0.4], C.chain);
    }
    sim.labels.set(70, 0, 13.6, 0, `${st.bt.size()} keys · w = ${st.w} bits · level r tests bit w−1−r`, { color: '#5d5d75', size: 26, w: 20, h: 1 });
    api.legend(`<b>BinaryTrie</b><div class="row"><span><i class="sw" style="background:${C.internal}"></i>internal: asks one bit</span><span><i class="sw" style="background:${C.leaf}"></i>leaf: a key</span><span><i class="sw" style="background:${C.zero}"></i>0-edge</span><span><i class="sw" style="background:${C.one}"></i>1-edge</span><span><i class="sw" style="background:${C.chain}"></i>successor chain</span></div>`);
  }

  function bitsStr(x) { return x.toString(2).padStart(st.w, '0'); }

  function walkAnim(x) {
    let node = st.bt.root;
    const pos = layout();
    const ids = [...pos.keys()];
    let level = 0;
    const step = () => {
      if (!node) { api.toast(`bit path went dead — ${x} is NOT in the trie`); return; }
      const vidx = ids.indexOf(node.id);
      sim.pulse(vidx, 420);
      if (node.kind === 'leaf') {
        const verdict = node.x === x ? `arrived at leaf ${node.x} — FOUND in exactly ${level} bit tests` : `path ends at leaf ${node.x} ≠ ${x} — not present`;
        api.toast(verdict);
        draw(node.x === x ? node.id : null);
        return;
      }
      const bit = (x >> (st.w - 1 - level)) & 1;
      api.toast(`bit ${st.w - level}: ${bitsStr(x)[level]} → go ${bit ? 'right (1)' : 'left (0)'}`);
      node = node.child[bit];
      level++;
      setTimeout(step, 700);
    };
    step();
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.bt = new DS.BinaryTrie(5);
    [10, 4, 21, 31, 7].forEach(v => st.bt.add(v));
    sim.cam.view({ target: [0, 6, 0], r: 44, theta: -0.7, phi: 1.05 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>x</label><input type="range" id="tr-x" min="0" max="31" value="21"><output id="tr-x-o">21 = ${bitsStr(21)}</output></div>
      <div class="btns">
        <button class="btn primary" id="tr-find">walk the bits</button>
        <button class="btn" id="tr-add">insert x</button>
        <button class="btn" id="tr-rm">remove x</button>
        <button class="btn" id="tr-fill">insert ×8 random</button>
        <button class="btn" id="tr-clear">clear</button>
      </div>
      <p class="note">Keys are <b>5-bit numbers</b> (0–31) shown as binary on the slider. Each trie level consumes exactly one bit. The green chain under the leaves is the <b>sorted successor list</b>.</p>`;
    $('#tr-x').oninput = e => { const v = +e.target.value; $('#tr-x-o').textContent = `${v} = ${bitsStr(v)}`; };
    $('#tr-find').onclick = () => walkAnim(+$('#tr-x').value);
    $('#tr-add').onclick = () => { const x = +$('#tr-x').value; st.bt.add(x); draw(); api.toast(`inserted ${x} — new leaf at the end of its bit path`); };
    $('#tr-rm').onclick = () => { const x = +$('#tr-x').value; if (st.bt.remove ? st.bt.remove(x) : false) { draw(); api.toast(`removed ${x}`); } else api.toast(`${x} not present`); };
    $('#tr-fill').onclick = () => {
      let k = 0;
      const iv = setInterval(() => {
        const x = Math.floor(Math.random() * 32);
        if (st.bt.add(x)) draw(x === +$('#tr-x').value ? null : null);
        if (++k >= 8) clearInterval(iv);
      }, 240);
    };
    $('#tr-clear').onclick = () => { st.bt = new DS.BinaryTrie(5); draw(); };

    api.hint('Drag to spin · set x and press "walk the bits" — every step asks one bit of x, never "less or greater?"');
    api.why(`
      <p style="margin:0 0 8px"><b>Comparison search</b> (BST, W06) asks "less or greater?" — an answer that splits the remaining candidates in <i>two equal halves</i>, at best. Hence log₂ n.<br>
      <b>Digital search</b> asks "what IS your bit?" — and follows it. The answer is already in the key.</p>
      <p style="margin:0 0 8px"><b>The bound:</b> a BinaryTrie costs exactly <b>w</b> bit-tests — the width of the key, independent of n! With 64-bit keys that's 64 steps… for <i>any</i> n. When n is huge and keys are dense, that beats log₂ n. ODS pushes this to XFastTries (hash the prefixes: O(log w)) and YFastTries (O(log w) expected with less memory).</p>
      <p style="margin:0"><b>Where you know it from:</b> IP routing tables (longest-prefix match IS a trie walk), autocomplete tries (LC 208), database indexes for integers.</p>`);
    api.arena(`Prefix trees and bit tricks: <a href="arena/#tries">LC 208 implement trie</a>, <a href="arena/#tries">LC 211 wildcard add/search</a>, <a href="arena/#tries">LC 201 bitwise AND range</a>, plus routing-table design questions.`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 11 · Tries', subtitle: 'Ask the bits, not "less or greater?"',
      steps: [
        {
          say: `A BST search only ever asks <b>"less or greater?"</b> — one bit of information per step, so log₂ n steps is the floor.<br><br>
          But if keys are <b>numbers</b>, you can do something a BST never can: ask <b>"what IS your next bit?"</b> and follow it. The trie has one level per bit: grey internal nodes ask a bit, violet leaves hold keys.<br><br>
          On screen: keys <span class="num">10, 4, 21, 31, 7</span> as 5-bit numbers.`,
          task: 'Set x to <b>21</b> (binary 10101) and press <b>walk the bits</b>.',
          hint: 'Each toast reads one bit of 10101 and goes left (0) or right (1).',
          okText: 'Five bit-tests, zero comparisons. The cost is the key\'s <b>width w</b> — it never looked at how many keys are stored.',
          learn: ['w11-trie', 'w11-digital']
        },
        {
          say: `Now you take a value down the trie yourself. The engine picks a target and shows you its bits; you tap the internal node you'd move to.<br><br>
          Remember the rule: level r (from the top) tests bit <b>w−1−r</b> — the LEFTMOST bit first.`,
          reset() {
            sim.clearPicks();
            st.walkX = 18; // 10010
            hand.active = true; hand.taps = 0; hand.path = [];
            draw();
            const pos = layout();
            const ids = [...pos.keys()];
            sim.onPick(i => {
              if (!hand.active) return;
              const entry = pos.get(ids[i]);
              const node = entry && entry.node;
              if (!node) return;
              if (node.kind !== 'internal') { api.toast('That\'s a leaf — you must choose an internal node (a bit question).'); return; }
              if (entry.level !== hand.taps) { api.toast(`Follow the path down — that node is at level ${entry.level}, but the next unanswered bit is level ${hand.taps}.`); return; }
              const bit = (st.walkX >> (st.w - 1 - hand.taps)) & 1;
              const nxt = node.child[bit];
              if (!nxt) { api.toast(`Bit ${bitsStr(st.walkX)[hand.taps]} says go ${bit ? 'right (1)' : 'left (0)'} — but there's no edge there: path is dead.`); hand.active = false; return; }
              hand.path.push(node.id);
              hand.taps++;
              sim.pulse(i, 400);
              if (nxt.kind === 'leaf') { hand.active = false; api.toast(`You reached leaf ${nxt.x}${nxt.x === st.walkX ? ' — the target!' : ' — a different key shares this prefix'}.`); }
            });
          },
          task: `Tap the <b>root</b>, then keep tapping internal nodes down, following the bits of <b>18 = 10010</b> until you hit a leaf (or a dead end).`,
          hint: '18 is 10010: right, left, left, right, left.',
          wait: () => hand.taps > 0 && !hand.active,
          okText: `You executed digital search by hand. ${hand.taps >= 5 ? 'Five bits, five decisions — fixed, data-independent.' : 'The path ended early — that\'s fine: a dead edge answers "not present" in fewer than w steps.'}`,
          learn: ['w11-bitpath']
        },
        {
          say: `Predict the headline property — the one that makes ODS devote a chapter to this:`,
          predict: {
            q: 'A BinaryTrie stores 1,000,000 keys, each a 64-bit number. Worst-case cost of one find?',
            placeholder: 'bit-tests…',
            grade: ans => {
              const t = ans.toLowerCase().replace(/[^0-9]/g, '');
              const ok = t === '64';
              return {
                right: ok,
                msg: ok
                  ? 'Right: <b>exactly 64 bit-tests</b>, whether the trie holds 10 keys or 10 billion. Compare: a balanced BST needs log₂(10⁶) ≈ 20 comparisons — FEWER here, but the trie\'s cost does not grow at all, and XFastTrie (hash the prefixes) gets it to O(log w) = ~6.'
                  : 'A BinaryTrie find costs <b>exactly w = 64 bit-tests</b> — one per bit of the key, regardless of how many keys are stored (n doesn\'t appear in the cost at all).'
              };
            }
          },
          learn: ['w11-w-bound']
        },
        {
          say: `Notice the <b>green chain</b> running under the leaves: every leaf is doubly-linked to its successor. The trie maintains sorted order <i>for free</i> — successor(x) is "find x's leaf, then follow the chain".<br><br>
          That's the SSet interface again (W06's trees) — find, successor, range — now with digit-cost instead of comparison-cost.`,
          task: 'Insert a few keys (slider + insert) and watch the chain re-thread itself in sorted order.',
          hint: 'New leaves splice into the green chain exactly like W03\'s doubly-linked list.',
          okText: 'The leaf chain IS a DLList (World 3, reused!) — successor in O(1) after the bit-walk. Structures compose: trie for search, list for order.',
          learn: ['w11-successor']
        },
        {
          say: `Honest engineering, per ODS §13.3–13.4:<br><br>
          The plain BinaryTrie spends w steps and w memory per key — wasteful when keys are sparse. <b>XFastTrie</b> hashes every ancestor prefix, skipping dead chains. <b>YFastTrie</b> buckets keys into small treaps, spending O(log w) expected with fraction of the memory.<br><br>
          This is the one corner of the book where <b>integer keys beat the comparison lower bound</b> — because they stop comparing.`,
          learn: ['w11-xfast']
        },
        {
          say: `World 11 in one breath:<br><br>
          <b>Numbers can name their own path.</b> A trie charges per BIT, not per comparison — fixed w, independent of n; hashing the prefixes (XFast) or bucketing (YFast) pushes toward O(log w).<br><br>
          Last world: when the bottleneck isn't the CPU at all, but the DISK.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w11', id: 'w11-trie', t: 'BinaryTrie', d: 'One level per key bit; internal nodes ask a bit, leaves hold keys. A.k.a. radix/digital tree.' },
    { w: 'w11', id: 'w11-digital', t: 'Digital vs comparison search', d: 'BST asks "less/greater" (log₂ n floor). Trie asks "what is this bit?" — the answer is in the key itself.' },
    { w: 'w11', id: 'w11-bitpath', t: 'The bit path', d: 'Level r tests bit w−1−r. Following x\'s bits for w steps either finds x\'s leaf or dies (absent).' },
    { w: 'w11', id: 'w11-w-bound', t: 'The w-bound', d: 'find costs exactly w bit-tests regardless of n. Huge dense key sets: beats log₂ n.' },
    { w: 'w11', id: 'w11-successor', t: 'Successor via leaf chain', d: 'Leaves are doubly-linked in sorted order (a DLList!): successor(x) = bit-walk + one hop.' },
    { w: 'w11', id: 'w11-xfast', t: 'XFast / YFast tries', d: 'X: hash ancestor prefixes, skip dead chains, O(log w). Y: bucket into treaps, O(log w) expected with less memory. Integer keys beating the comparison bound.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w11', q: 'A BinaryTrie find for w-bit keys costs…', opts: ['log₂ n comparisons', 'exactly w bit-tests, independent of n', 'O(1) always', 'n/2 in the worst case'], a: 1, x: 'One test per bit of the key. n does not appear in the cost.' },
    { w: 'w11', q: 'Why can tries beat the comparison-sort-style lower bound?', opts: ['They use better hardware', 'They stop comparing — they read bits', 'They are always smaller', 'They use heaps'], a: 1, x: 'The log₂(n!) wall binds COMPARISON algorithms only.' },
    { w: 'w11', q: 'successor(x) in a BinaryTrie is…', opts: ['a full re-scan', 'bit-walk to x\'s leaf, then one hop along the leaf chain', 'O(n) always', 'impossible'], a: 1, x: 'The sorted DLList of leaves gives O(1) successor after the walk.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w11', tab: 'Tries', book: '§13',
    title: 'Tries — search by asking the bits',
    lede: 'When keys are numbers, stop comparing: one trie level per bit, a fixed w-step search that ignores n entirely — plus XFast/YFast ideas that beat the comparison bound. <b>ODS §13.</b>',
    mount, story
  });
})();
