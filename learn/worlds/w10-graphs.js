/* ============================================================
   W10 · GRAPHS — ODS §12. You pave the city, then watch BFS
   ripple outward in rounds and DFS dive with a rope — the two
   traversals behind half the interview set. The LED wall shows
   what the city costs to remember.
   ============================================================ */
(function () {
  'use strict';
  const DS = window.ULTRON_DS;
  const C = { city: '#5d4fe0', road: '#5e5b82', hot: '#d94f70', wave: ['#0f9e8e', '#5d4fe0', '#c8920e', '#d94f70', '#5e5b82', '#0f9e8e', '#5d4fe0', '#c8920e'], rope: '#c8920e', ledOn: '#d94f70', ledOff: '#c9c9dd' };
  let api, sim;
  const st = { g: null, reps: 'none', anim: false };
  const hand = { active: false, first: null, roads: 0 };

  const N = 16, COLS = 4;
  const pos = i => ({ x: (i % COLS) * 6 - 9, z: Math.floor(i / COLS) * 6 - 9 });
  const LETTER = i => String.fromCharCode(65 + i);

  function draw(hot) {
    let vi = 0, li = 0, lk = 0;
    // roads
    const seen = new Set();
    for (const e of st.g.edges) {
      const [a, b] = e.split('-').map(Number);
      const key = Math.min(a, b) + ':' + Math.max(a, b);
      if (seen.has(key)) continue; seen.add(key);
      const p = pos(a), q = pos(b);
      sim.links.set(lk++, [p.x, 0.3, p.z], [q.x, 0.3, q.z], C.road);
    }
    sim.links.count(lk);
    // buildings
    for (let i = 0; i < N; i++) {
      const p = pos(i);
      sim.vox.set(vi++, p.x, 0.75, p.z, hot === i ? C.hot : C.city, 1.5, 1.5, 1.5);
      sim.labels.set(li++, p.x, 2.3, p.z, LETTER(i), { color: '#ffffff', size: 34 });
    }
    // representation: LED matrix wall or list rows
    if (st.reps === 'matrix') {
      const cell = 0.62, ox = -13.5, oz = 14.5;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        sim.vox.set(vi++, ox + j * cell, 3.5, oz - i * cell, st.g.has(i, j) ? C.ledOn : C.ledOff, 0.52, 0.18, 0.52);
      }
      sim.labels.set(70, ox + (N - 1) * cell / 2, 4.4, oz + 1.5, 'adjacency matrix — n² = 256 cells, ' + st.g.edges.size / 2 + ' lit', { color: '#5d5d75', size: 22, w: 22, h: 1 });
    } else if (st.reps === 'lists') {
      const lists = st.g.adjLists();
      for (let i = 0; i < N; i++) {
        const oz = 14.5 - i * 1.1, ox = -13.5;
        sim.labels.set(li++, ox - 1.4, 3.5, oz, LETTER(i), { color: '#5d5d75', size: 20 });
        lists[i].forEach((j, k) => {
          sim.vox.set(vi++, ox + k * 1.05, 3.5, oz, C.ledOn, 0.75, 0.3, 0.55);
        });
      }
      sim.labels.set(70, 0, 3.5, 14.5 - (N - 1) * 1.1 - 1.6, `adjacency lists — n + 2m = ${N + st.g.edges.length / 2} chips total`, { color: '#5d5d75', size: 22, w: 20, h: 1 });
    } else {
      sim.labels.set(70, 0, 0, 14, `tap two buildings to pave / unpave a road`, { color: '#5d5d75', size: 26, w: 20, h: 1 });
    }
    sim.vox.hideFrom(vi); sim.labels.hideFrom(li);
    api.legend(`<b>The city is a graph</b><div class="row"><span><i class="sw" style="background:${C.city}"></i>building (node)</span><span><i class="sw" style="background:${C.road}"></i>road (edge)</span></div><div class="row">${st.g.edges.size / 2} roads · BFS ripples · DFS dives</div>`);
    stats();
  }

  function stats() {
    const el = api.stats(true); el.innerHTML = '';
    const mk = (l, v) => { const d = document.createElement('div'); d.innerHTML = `<span>${l}</span><b>${v}</b>`; el.appendChild(d); };
    const m = st.g.edges.size / 2;
    mk('nodes', N);
    mk('edges', m);
    mk('matrix cells', N * N);
    mk('list chips', N + 2 * m);
  }

  function bfsAnim(s) {
    st.anim = true;
    const { dist, rounds } = st.g.bfs(s);
    // color buildings by distance band
    draw();
    let r = 0;
    const step = () => {
      if (r >= rounds.length + 1) { st.anim = false; api.toast(`wave done — farthest building: ${rounds.length} roads away`); return; }
      if (r === 0) {
        sim.pulse(s, 700);
        api.toast(`round 0: start at ${LETTER(s)} (the queue's first member)`);
      } else {
        for (const v of rounds[r - 1]) sim.pulse(v, 700);
        api.toast(`round ${r}: ${rounds[r - 1].map(LETTER).join(', ')} — everyone 1 road from last round`);
      }
      r++;
      setTimeout(step, 950);
    };
    step();
  }

  function dfsAnim(s) {
    st.anim = true;
    const { order } = st.g.dfs(s);
    draw();
    let k = 0;
    let prev = null;
    const step = () => {
      if (k >= order.length) { st.anim = false; api.toast(`dive done — visited ${order.length} buildings by rope`); return; }
      const v = order[k];
      sim.pulse(v, 500);
      if (prev !== null) {
        const p = pos(prev), q = pos(v);
        // draw the rope
        sim.links.set(st.g.edges.size / 2 + k, [p.x, 1.9, p.z], [q.x, 1.9, q.z], C.rope);
      }
      api.toast(`${k}: dive to ${LETTER(v)}${prev !== null ? ' (deeper from ' + LETTER(prev) + ')' : ' (start)'}`);
      prev = v; k++;
      setTimeout(step, 800);
    };
    step();
  }

  function mount(a) {
    api = a; sim = a.sim;
    st.g = new DS.Graph(N);
    sim.cam.view({ target: [0, 1.5, 0], r: 46, theta: -0.6, phi: 1.15 });
    // starter roads
    [[0, 1], [1, 5], [5, 6], [2, 6], [10, 14], [8, 9]].forEach(([i, j]) => st.g.addEdge(i, j));

    const c = api.controls();
    c.innerHTML = `
      <div class="ctl"><label>memory view</label>
        <div class="seg" id="gr-rep">
          <button data-r="none" aria-pressed="true">none</button>
          <button data-r="matrix">matrix wall</button>
          <button data-r="lists">list rows</button>
        </div><span></span></div>
      <div class="btns">
        <button class="btn primary" id="gr-bfs">BFS from A</button>
        <button class="btn" id="gr-dfs">DFS from A</button>
        <button class="btn" id="gr-web">pave random roads</button>
        <button class="btn" id="gr-clear">clear roads</button>
      </div>
      <p class="note">Tap <b>two buildings</b> to pave or unpave a road between them. Then run the two traversals on YOUR city. The memory view shows what the graph costs to store.</p>`;
    $('#gr-rep').querySelectorAll('button').forEach(b => b.onclick = () => {
      $('#gr-rep').querySelectorAll('button').forEach(x => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true'); st.reps = b.dataset.r; draw();
    });
    $('#gr-bfs').onclick = () => bfsAnim(0);
    $('#gr-dfs').onclick = () => dfsAnim(0);
    $('#gr-web').onclick = () => {
      const rnd = DS.mulberry32(Date.now() & 0xffff);
      for (let k = 0; k < 10; k++) {
        const i = DS.rint(rnd, 0, N - 1), j = DS.rint(rnd, 0, N - 1);
        if (i !== j) st.g.addEdge(i, j);
      }
      draw();
    };
    $('#gr-clear').onclick = () => { st.g = new DS.Graph(N); draw(); };

    sim.onPick(i => {
      if (st.anim || i >= N) return;
      if (hand.first === null) { hand.first = i; sim.pulse(i, 800); api.toast(`from ${LETTER(i)} — now tap the other end`); return; }
      if (hand.first === i) { hand.first = null; api.toast('road cancelled'); return; }
      const a = hand.first, b = i; hand.first = null; hand.roads++;
      if (st.g.has(a, b)) { st.g.edges.delete(a + '-' + b); st.g.edges.delete(b + '-' + a); api.toast(`road ${LETTER(a)}–${LETTER(b)} removed`); }
      else { st.g.addEdge(a, b); api.toast(`road ${LETTER(a)}–${LETTER(b)} paved`); }
      draw();
    });

    api.hint('Drag to spin · tap two buildings to pave a road · BFS = ripple, DFS = rope');
    api.why(`
      <p style="margin:0 0 8px"><b>A graph is pure relationship</b> — nodes + edges, nothing else. No order, no keys, no root. Which makes it the native language of networks, maps, schedules, states…</p>
      <p style="margin:0 0 8px"><b>Two traversals run everything:</b> BFS (queue, FIFO) explores in <b>rings of distance</b> — shortest paths in unweighted graphs. DFS (stack, LIFO) <b>dives deep</b> — cycles, topo order, connectivity, backtracking.</p>
      <p style="margin:0"><b>Storage:</b> matrix = n² cells, O(1) edge test — for dense graphs; lists = n + 2m chips, scan neighbors — for sparse (real) graphs. Cities are sparse; that's why adjacency lists win in practice.</p>`);
    api.arena(`Graph questions dominate big-tech loops: <a href="arena/#graphs">LC 200 number of islands</a>, <a href="arena/#graphs">LC 994 rotting oranges</a>, <a href="arena/#graphs">LC 207 course schedule (topo)</a>, <a href="arena/#graphs">LC 133 clone graph</a>.`);
    draw();
  }
  const $ = s => document.querySelector(s);

  function story() {
    return {
      title: 'World 10 · Graphs', subtitle: 'Ripples, ropes and the LED wall',
      steps: [
        {
          say: `Everything so far ordered things. A <b>graph</b> throws order away and keeps only <b>relationship</b>: 16 buildings, roads between some pairs. No first, no last, no sorted.<br><br>
          <b>Pave your own city:</b> tap one building, then another.`,
          task: 'Pave at least <b>6 roads</b> (tap two buildings per road). Make sure A can reach at least 5 buildings, directly or through others.',
          hint: 'Connect across the grid — long diagonal roads make interesting distances.',
          wait: () => st.g.edges.size / 2 >= 6,
          okText: 'Your city is a graph G = (V, E): 16 nodes, your roads the edges. Now we ask the two questions every graph system asks: <i>what is reachable, and how far?</i>',
          learn: ['w10-graph']
        },
        {
          say: `<b>BFS</b> — breadth-first search — answers "how far" for every building at once:<br><br>
          Start at A. <b>Round 0:</b> A. <b>Round 1:</b> everyone one road away. <b>Round 2:</b> everyone one road from THEM — and so on, like a ripple in a pond. The tool that makes it honest is the humble <b>queue</b> (W02): first-in-first-out means nobody from round 3 is explored before round 2 finishes.`,
          predict: {
            q: 'In YOUR city: how many <b>rounds</b> (roads crossed) until the ripple reaches the building furthest from A?',
            placeholder: 'rounds…',
            grade: ans => {
              const v = parseInt(ans, 10);
              const { dist } = st.g.bfs(0);
              const far = Math.max(...dist.map(d => d < 0 ? 0 : d));
              return {
                right: Math.abs(v - far) <= 0,
                msg: v === far
                  ? `Exactly right — in your city the farthest reachable building is <b>${far}</b> roads from A (BFS just measured it live). ${far} rounds, and EVERY building's distance is now known.`
                  : `In your city the farthest building from A is <b>${far}</b> roads away (BFS measured it just now). Distances in an unweighted graph = BFS round numbers, exactly.`
              };
            }
          },
          learn: ['w10-bfs']
        },
        {
          say: `Watch the ripple in your own city:`,
          task: 'Press <b>BFS from A</b> and count the rounds in the toasts.',
          hint: 'Each round is one ring of the ripple — the queue drains level by level.',
          okText: 'Ripple = <b>shortest paths for free</b>: in an unweighted graph, the round a node first appears in IS its distance. That\'s the trick behind "fewest hops" routing and LC 994/542/1091.',
          learn: ['w10-bfs-shortest']
        },
        {
          say: `Same city, opposite personality. <b>DFS</b> — depth-first search — uses a <b>stack</b> (LIFO): go as deep as possible, backtrack only when stuck. A <b>rope</b>, not a ripple.<br><br>
          BFS answers "how far?"; DFS answers "what's connected, where are the cycles, what order do things depend on?"`,
          task: 'Press <b>DFS from A</b> and follow the rope: it dives, never rippling.',
          hint: 'Notice how different the visit order feels from BFS\'s rings.',
          okText: 'Dive deep, backtrack on demand. Topological sort (course prerequisites), cycle detection, maze solving, and every backtracking interview problem are DFS in costume.',
          learn: ['w10-dfs']
        },
        {
          say: `Now the bill: how do you <b>store</b> a graph?<br><br>
          <b>Adjacency matrix:</b> an n×n wall of cells, cell (i,j) lit if i–j is a road. Edge test O(1) — but n² cells even with zero roads.<br><br>
          <b>Adjacency lists:</b> per building, a short list of its neighbors. Total n + 2m chips.`,
          task: 'Switch the memory view: <b>matrix wall</b>, then <b>list rows</b>. Compare the stats: matrix cells vs list chips for YOUR city.',
          hint: 'With 16 nodes and ~10 roads: 256 cells vs 16 + 20 = 36 chips.',
          okText: `Your sparse city: matrix pays <b>${N * N}</b> cells, lists pay <b>${N + st.g.edges.length / 2}</b>. Real graphs (the web, social networks, road maps) are sparse — which is why every serious library stores lists.`,
          learn: ['w10-matrix', 'w10-lists']
        },
        {
          say: `World 10 in one breath:<br><br>
          <b>Graphs keep relationships, not order.</b> BFS (queue) ripples to distances; DFS (stack) ropes through structure. Sparse graphs live in adjacency lists.<br><br>
          Next: one last twist on search — keys that are just <b>numbers</b>, where you can ask the bits directly.`,
        }
      ]
    };
  }

  ULTRON_STORY.defineNotes([
    { w: 'w10', id: 'w10-graph', t: 'Graph', d: 'Nodes + edges — pure relationship, no order. G = (V, E). The native model of networks, maps, dependencies.' },
    { w: 'w10', id: 'w10-bfs', t: 'BFS', d: 'Queue-driven exploration in rings of distance. Round number = distance in unweighted graphs.' },
    { w: 'w10', id: 'w10-bfs-shortest', t: 'BFS = shortest paths', d: 'Unweighted "how far" for every node in one run — fewest-hops routing.' },
    { w: 'w10', id: 'w10-dfs', t: 'DFS', d: 'Stack-driven deep dive with backtracking. Cycles, topological order, connectivity, all backtracking.' },
    { w: 'w10', id: 'w10-matrix', t: 'Adjacency matrix', d: 'n×n cells, O(1) edge test. Dense or tiny graphs only.' },
    { w: 'w10', id: 'w10-lists', t: 'Adjacency lists', d: 'n + 2m chips total. The default for sparse graphs — which is nearly all of them.' }
  ]);
  ULTRON_STORY.defineQuiz([
    { w: 'w10', q: 'BFS explores in rings because…', opts: ['it sorts first', 'its queue is FIFO — level k+1 can\'t start before level k drains', 'it uses a stack', 'graphs are circular'], a: 1, x: 'First-in-first-out = nobody jumps the line: a perfect ripple.' },
    { w: 'w10', q: 'In an unweighted graph, shortest paths come from…', opts: ['DFS', 'BFS — the round a node first appears in is its distance', 'sorting the nodes', 'Dijkstra (needed only with weights)'], a: 1, x: 'Weights need Dijkstra; hops need only BFS.' },
    { w: 'w10', q: '16 nodes, 10 edges. The sane representation is…', opts: ['adjacency matrix (256 cells)', 'adjacency lists (~36 chips)', 'a hash table', 'a linked list of everything'], a: 1, x: 'Sparse graphs: lists pay n + 2m, matrices pay n² regardless.' }
  ]);

  window.ULTRON_WORLDS = window.ULTRON_WORLDS || [];
  window.ULTRON_WORLDS.push({
    id: 'w10', tab: 'Graphs', book: '§12',
    title: 'Graphs — ripples and ropes',
    lede: 'Pave your own city, then let BFS ripple to every distance and DFS rope through its structure. The LED wall shows what your roads cost to remember. <b>ODS §12.</b>',
    mount, story
  });
})();
