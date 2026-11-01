/* ============================================================
   W06 · TREES — ODS §6. The BST: binary search made branching.
   You steer the search yourself, grow a stick, shuffle it into
   a bush, walk all three traversals, and delete by successor.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { node: '#5d4fe0', edge: '#a0a0b8', hot: '#d94f70', ok: '#0f9e8e', leafless: '#c9c9dd', tour: '#c8920e' };
  let api, sim;
  const st = { bst: null, seq: 1 };

  function layout() {
    // in-order index → x, depth → y. Live nodes via traversal.
    const pos = new Map();
    let idx = 0;
    const walk = (n, d) => {
      if (!n) return;
      walk(n.left, d + 1);
      pos.set(n.id, { x: idx++, y: d, node: n });
      walk(n.right, d + 1);
    };
    walk(st.bst.r, 0);
    const n = pos.size;
    const spacing = Math.max(1.5, Math.min(3.2, 26 / Math.max(1, n)));
    for (const p of pos.values()) {
      p.px = (p.x - (n - 1) / 2) * spacing;
      p.py = 6.5 - p.y * 1.75;
    }
    return pos;
  }

  function draw(hotId) {
    const pos = layout();
    let vi = 0, li = 0, lk = 0;
    // edges first
    for (const p of pos.values()) {
      const n = p.node;
      for (const c of [n.left, n.right]) {
        if (c && pos.has(c.id)) {
          sim.links.set(lk++, [p.px, p.py - 0.55, 0], [pos.get(c.id).px, pos.get(c.id).py + 0.55, 0], C.edge);
        }
      }
    }
    sim.links.count(lk);
    for (const p of pos.values()) {
      sim.vox.set(vi++, p.px, p.py, 0, hotId === p.node.id ? C.hot : C.node, 1.1, 1.1, 1.1);
      sim.labels.set(li++, p.px, p.py + 1.1, 0, String(p.node.x), { color: '#ffffff', size: 30 });
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    sim.labels.set(70, 0, 8.6, 0, `${st.bst.size()} keys · depth ${st.bst.depth()}`, { color: '#5d5d75', size: 26, w: 10, h: 1 });
  }

  function findAnim(x, done) {
    let p = st.bst.r;
    const step = () => {
      if (!p) { api.toast(`${x}: hit a null pointer — not in the tree`); if (done) done(false); return; }
      const pos = layout();
      const vidx = [...pos.keys()].indexOf(p.id);
      sim.pulse(vidx, 420);
      if (x < p.x) { api.toast(`${x} < ${p.x} → go left`); p = p.left; }
      else if (x > p.x) { api.toast(`${x} > ${p.x} → go right`); p = p.right; }
      else { api.toast(`${x} == ${p.x} → found, ${pos.get(p.id).y} hops down`); draw(p.id); if (done) done(true); return; }
      setTimeout(step, 520);
    };
    step();
  }

  function traverseAnim(kind) {
    const out = [];
    const seq = [];
    const walk = (n) => {
      if (!n) return;
      if (kind === 'pre') seq.push(n);
      walk(n.left);
      if (kind === 'in') seq.push(n);
      walk(n.right);
      if (kind === 'post') seq.push(n);
    };
    walk(st.bst.r);
    let k = 0;
    const step = () => {
      if (k >= seq.length) {
        api.toast(`${kind}-order: ${seq.map(n => n.x).join(', ')}`);
        sim.labels.set(71, 0, -1.4, 0, `${kind}-order → ${seq.map(n => n.x).join('  ')}`, { color: '#5d5d75', size: 26, w: 22, h: 1.2 });
        return;
      }
      const pos = layout();
      const vidx = [...pos.keys()].indexOf(seq[k].id);
      sim.pulse(vidx, 400);
      k++;
      setTimeout(step, 480);
    };
    step();
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.bst = new DS.BST();
    [8, 3, 10, 1, 6, 14, 4].forEach(v => st.bst.add(v));
    sim.cam.view({ target: [0, 3, 0], r: 34, theta: -0.85, phi: 1.1 });

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>value</label><input type="range" id="t-v" min="1" max="20" value="7"><output id="t-v-o">7</output></div>
      <div class="btns">
        <button class="btn primary" id="t-add">insert</button>
        <button class="btn" id="t-find">find</button>
        <button class="btn" id="t-del">delete</button>
        <button class="btn" id="t-sorted">insert 1..7 sorted</button>
        <button class="btn" id="t-shuf">insert ×15 shuffled</button>
        <button class="btn" id="t-clear">clear</button>
      </div>
      <div class="ctl"><label>traverse</label>
        <div class="seg" id="t-trav">
          <button data-k="pre">pre</button><button data-k="in" aria-pressed="true">in</button><button data-k="post">post</button>
        </div><button class="btn" id="t-walk" style="grid-column:3">walk ▸</button></div>
      <p class="note">Depth counter is the honest metric: the whole game of trees is keeping depth ≈ log₂ n. Watch what sorted input does to it.</p>`;
    $('#t-v').oninput = e => $('#t-v-o').textContent = e.target.value;
    $('#t-add').onclick = () => { st.bst.add(+$('#t-v').value); draw(); };
    $('#t-find').onclick = () => findAnim(+$('#t-v').value);
    $('#t-del').onclick = () => {
      const v = +$('#t-v').value;
      st.bst.log = [];
      const r = st.bst.remove(v);
      if (r === null) api.toast(`${v} not present`);
      else {
        const which = st.bst.log.filter(e => e.op === 'remove').map(e => e.which).join();
        draw();
        api.toast(which === 'two-children' ? `deleted ${v}: two children → successor moved up` : `deleted ${v}: ${which.replace('-', ' ')}`);
      }
    };
    $('#t-sorted').onclick = () => {
      st.bst = new DS.BST(); draw();
      let k = 1;
      const iv = setInterval(() => { st.bst.add(k); draw(); if (++k > 7) clearInterval(iv); }, 330);
    };
    $('#t-shuf').onclick = () => {
      st.bst = new DS.BST();
      const rnd = DS.mulberry32(Date.now() & 0xffff);
      const vals = DS.shuffle([...Array(15).keys()].map(v => v + 1), rnd);
      let k = 0;
      const iv = setInterval(() => { st.bst.add(vals[k]); draw(); if (++k >= vals.length) clearInterval(iv); }, 300);
    };
    $('#t-clear').onclick = () => { st.bst = new DS.BST(); draw(); };
    let travKind = 'in';
    $('#t-trav').querySelectorAll('button').forEach(b => b.onclick = () => {
      $('#t-trav').querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true'); travKind = b.dataset.k;
    });
    $('#t-walk').onclick = () => traverseAnim(travKind);

    api.hint('Drag to spin · every question in tree land is one question: how deep is this tree?');
    api.legend(`<b>Binary search tree</b><div class="row"><span><i class="sw" style="background:${C.node}"></i>node</span><span><i class="sw" style="background:${C.hot}"></i>on the search path</span></div><div class="row">left subtree &lt; node &lt; right subtree, at every node</div>`);
    api.why(`
      <p style="margin:0 0 8px"><b>The BST bet:</b> store the binary-search decision in memory itself. Each node is a fork; search = one root-to-leaf walk = O(depth).</p>
      <p style="margin:0 0 8px"><b>The catch:</b> depth depends on insertion order. Sorted input → depth n (a stick). Random input → depth ≈ 2·ln n ≈ 1.39·log₂ n.</p>
      <p style="margin:0"><b>Why not just hash (W05)?</b> Trees keep <b>order</b>: successor(x), predecessor(x), range queries [a,b], sorted iteration — the SSet interface. Hashing answers "is x in?" only.</p>`);
    api.arena(`The tree question dynasty: <a href="arena/#trees">LC 98 validate BST</a>, <a href="arena/#trees">LC 230 kth smallest (in-order!)</a>, <a href="arena/#trees">LC 102 level order</a>, <a href="arena/#trees">LC 236 lowest common ancestor</a>, <a href="arena/#trees">LC 297 serialize / deserialize</a>.`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 6 · Trees', subtitle: 'Binary search that lives in memory',
      steps: [
        {
          say: `Binary search (W01) halved a sorted <i>array</i> — static, pre-sorted, hard to insert into.<br><br>
          A <b>binary search tree</b> stores the halving as <b>forks</b>: at every node, smaller keys hang left, larger right. Search is a root-to-leaf walk — one yes/no per floor.<br><br>
          <b>You steer.</b> Find <b>4</b> in this tree: 8 → smaller, go left; 3 → bigger, go right; 6 → smaller, left; <b>4</b>.`,
          task: 'Set the value slider to <b>4</b> and press <b>find</b>. Watch each fork announce its comparison.',
          hint: 'The pulses are the search path — its length IS the cost.',
          okText: 'Four comparisons, four floors. Every find/add/remove in a BST costs exactly its path length. Which sets up the dangerous question…',
          learn: ['w06-bst', 'w06-invariant']
        },
        {
          say: `What if the forks all point the <b>same way</b>? Feed a BST sorted input and each new key is "bigger than everything" — always right, forever.`,
          predict: {
            q: 'Insert <b>1, 2, 3, 4, 5, 6, 7</b> in sorted order into an empty BST. How many levels deep does the tree become?',
            placeholder: 'levels…',
            grade: ans => {
              const v = parseInt(ans, 10);
              return {
                right: v === 7,
                msg: v === 7
                  ? 'A <b>stick</b>: every node has only a right child; depth 7 = n. The tree is a linked list wearing a costume — search is back to O(n).'
                  : 'Sorted input makes a <b>stick</b>: depth <b>7</b> — each key lands below the previous one. The BST degrades into a linked list (W03) with extra steps.'
              };
            }
          },
          learn: ['w06-stick']
        },
        {
          say: `Now prove the stick with your own eyes, then heal it with randomness.`,
          task: 'Press <b>insert 1..7 sorted</b> and watch the depth stat hit 7. Then press <b>insert ×15 shuffled</b> and watch it hover near 4–5.',
          hint: 'depth of a bushy 15-node tree ≈ log₂ 15 ≈ 3.9; expected random-BST depth ≈ 1.39·log₂ n ≈ 5.4.',
          okText: 'Same structure, different insertion order: <b>n vs ≈ log n</b>. The BST is only as good as the order data arrives in — which is exactly the problem World 7 fixes (with coins and rotations).',
          learn: ['w06-random-depth']
        },
        {
          say: `Trees do one thing hashing never will: <b>they keep order</b>. Three ways to read the whole tree, one walk each:<br><br>
          <b>pre</b>-order (node, left, right) — copies/clones the tree shape<br>
          <b>in</b>-order (left, node, right) — visits keys <b>sorted</b><br>
          <b>post</b>-order (left, right, node) — deletes safely (children first)`,
          task: 'Press <b>walk</b> with <b>in</b> selected. Read the emitted sequence under the tree.',
          hint: 'Try all three; only one emits ascending keys.',
          okText: '<b>In-order = sorted order, for free.</b> That\'s the SSet promise: find(x), successor(x), range [a,b] — all tree-shaped walks. No hash table can do any of them.',
          learn: ['w06-traversals', 'w06-inorder']
        },
        {
          say: `Deleting from a BST is a three-case drama:<br><br>
          <b>leaf</b> → just remove it · <b>one child</b> → child moves up · <b>two children</b> → the <b>successor</b> (smallest key in the right subtree, i.e. in-order's next) takes the throne, and IT is deleted as a leaf/one-child case.`,
          task: 'Delete a leaf (try 1), then a two-child node (try 3), reading the toasts.',
          hint: 'The successor of a node = go right once, then left as far as possible.',
          okText: 'Two children solved by "promote the in-order successor" — the traversal knowledge from the last step, recycled. Interviewers love asking you to re-derive exactly this.',
          learn: ['w06-delete']
        },
        {
          say: `World 6 in one breath:<br><br>
          <b>A BST stores binary search in memory</b> — O(depth) everything, order preserved, all three traversals meaningful.<br><br>
          Its one flaw: <b>depth is hostage to insertion order</b>. World 7 takes that flaw personally.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w06', id: 'w06-bst', t: 'Binary search tree', d: 'Each node forks: smaller left, larger right. Search = one root-to-leaf path; cost = path length.' },
    { w: 'w06', id: 'w06-invariant', t: 'The BST invariant', d: 'At EVERY node: all left-subtree keys < node < all right-subtree keys. Recursive, not just parent-child.' },
    { w: 'w06', id: 'w06-stick', t: 'The stick', d: 'Sorted insertion → every node one right child → depth n. A linked list in disguise; O(n) search.' },
    { w: 'w06', id: 'w06-random-depth', t: 'Random vs sorted input', d: 'Random order → expected depth ≈ 1.39·log₂ n. Sorted order → n. Same tree, hostage to history.' },
    { w: 'w06', id: 'w06-traversals', t: 'pre / in / post', d: 'One physical walk around the tree; the label (node) is emitted before, between, or after the children.' },
    { w: 'w06', id: 'w06-inorder', t: 'In-order = sorted', d: 'Left, node, right at every level emits keys ascending — the SSet superpower hashing lacks.' },
    { w: 'w06', id: 'w06-delete', t: 'Delete: three cases', d: 'Leaf: drop. One child: promote. Two children: in-order successor takes the node\'s key, then is deleted recursively.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w06', q: 'In-order traversal of any BST emits keys…', opts: ['in insertion order', 'sorted ascending', 'level by level', 'randomly'], a: 1, x: 'Left < node < right at every subtree → ascending sequence.' },
    { w: 'w06', q: 'Inserting 1..7 sorted into an empty BST gives depth…', opts: ['3', '7', 'log₂ 7 ≈ 2.8', '1'], a: 1, x: 'A stick: each key is the largest so far, always lands below the last.' },
    { w: 'w06', q: 'Deleting a node with two children replaces its key with…', opts: ['its left child\'s key', 'the in-order successor (right subtree\'s minimum)', 'the root\'s key', 'a random key'], a: 1, x: 'Right once, then left forever: the smallest key greater than the node.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w06', tab: 'Trees', book: '§6',
    title: 'Search trees — forks in memory',
    lede: 'The BST turns binary search into a living structure: one fork per node, one path per query, sorted order for free. And one fatal flaw — depth hostage to insertion order. <b>ODS §6.</b>',
    mount, story
  });
})();
