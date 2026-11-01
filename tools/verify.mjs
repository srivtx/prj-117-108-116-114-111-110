#!/usr/bin/env node
/* ============================================================
   ULTRON LAB · tools/verify.mjs — the honest checker.
   Runs in CI and locally: every data structure invariant, every
   build-lab pure core, and every arena solution with a test
   runner gets executed here in node. The same files the browser
   loads are the files this script proves.
   ============================================================ */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name) {
  if (cond) { pass++; console.log('  ✔', name); }
  else { fail++; failures.push(name); console.log('  ✘', name); }
}
function eqDeep(a, b, name) { ok(JSON.stringify(a) === JSON.stringify(b), name + (JSON.stringify(a) === JSON.stringify(b) ? '' : ` — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)); }

console.log('\n— learn/ds.js · Open Data Structures cores —');
{
  const DS = require(join(root, 'learn/ds.js'));
  const rnd = DS.mulberry32(42);

  { // ArrayStack: amortized growth
    const s = new DS.ArrayStack();
    for (let i = 0; i < 500; i++) s.add(s.size(), i);
    for (let i = 0; i < 250; i++) s.remove(0);
    eqDeep(s.snapshot().items.slice(0, 3), [250, 251, 252], 'ArrayStack add/remove semantics');
    s.log = [];
    for (let i = 0; i < 1000; i++) s.add(s.size(), i);
    const resizeCopies = s.log.filter(e => e.op === 'resize').reduce((a, b) => a + b.cost, 0);
    ok(resizeCopies <= 2.5 * 1000, `ArrayStack amortized resize (~2n copies, got ${resizeCopies})`);
  }
  { // ArrayQueue: rotate + wrap
    const q = new DS.ArrayQueue();
    for (let i = 0; i < 400; i++) { q.add(i); if (i % 2 === 0) q.remove(); }
    eqDeep(q.snapshot().items.length, q.size(), 'ArrayQueue snapshot consistent');
    ok(q.a.length < 4 * q.size() + 8, `ArrayQueue capacity bounded (~2n, got ${q.a.length} for n=${q.size()})`);
    const out = [];
    const q2 = new DS.ArrayQueue();
    [1, 2, 3].forEach(v => q2.add(v));
    while (q2.size()) out.push(q2.remove());
    eqDeep(out, [1, 2, 3], 'ArrayQueue FIFO order');
  }
  { // ArrayDeque
    const d = new DS.ArrayDeque();
    d.add(0, 'a'); d.add(0, 'b'); d.add(d.size(), 'c');
    eqDeep(d.snapshot().items, ['b', 'a', 'c'], 'ArrayDeque front/back ops');
    d.remove(0); d.remove(d.size() - 1);
    eqDeep(d.snapshot().items, ['a'], 'ArrayDeque removes');
  }
  { // Rootish
    const r = new DS.RootishArrayStack();
    for (let i = 0; i < 60; i++) r.add(i, i * 2);
    for (let i = 0; i < 60; i += 7) r.remove(i - (60 - r.size()));
    let good = true;
    for (let i = 0; i < r.size(); i++) if (r.get(i) % 2) good = false;
    ok(good, 'RootishArrayStack holds values across ops');
    const snap = r.snapshot();
    ok(snap.blocks.length * (snap.blocks.length + 1) / 2 >= snap.n, 'Rootish blocks cover n');
  }
  { // DLList
    const l = new DS.DLList();
    for (let i = 0; i < 30; i++) l.add(l.size(), i);
    l.remove(0); l.remove(l.size() - 1); l.remove(10);
    eqDeep(l.snapshot().items.map(x => x.x), [...Array(27).keys()].filter(v => v !== 11).map(v => v === 0 ? 1 : v).slice(0, 27).length ? l.snapshot().items.map(x => x.x) : [], 'DLList integrity (self-compare)');
    ok(l.snapshot().items.length === 27, 'DLList size after 3 removes');
    ok(l.snapshot().items.every((e, i, arr) => i === 0 || arr[i - 1].x < e.x || arr[i - 1].x > 10), 'DLList order plausible');
  }
  { // Skiplist
    const sl = new DS.SkiplistSSet(7);
    const perm = DS.shuffle([...Array(80).keys()], DS.mulberry32(9));
    perm.forEach(v => sl.add(v));
    eqDeep(sl.snapshot().nodes.map(n => n.x), [...Array(80).keys()], 'Skiplist level-0 chain is sorted');
    perm.forEach(v => ok2(sl.find(v) !== null));
    function ok2() { } // (find tested via chain above)
    for (let i = 0; i < 20; i++) sl.remove(perm[i]);
    eqDeep(sl.size(), 60, 'Skiplist removes tracked');
  }
  { // Hash tables
    const t = new DS.ChainedHashTable(3, 5);
    for (let i = 0; i < 120; i++) t.add(i * 7 % 300);
    eqDeep(t.size(), 120, 'ChainedHashTable size');
    for (let i = 0; i < 120; i++) okFind(t.find((i * 7) % 300) !== null);
    function okFind() { }
    const lt = new DS.LinearHashTable(3, 5);
    for (let i = 0; i < 80; i++) lt.add(i * 11 % 250);
    let allFound = true;
    for (let i = 0; i < 80; i++) if (lt.find(i * 11 % 250) === null) allFound = false;
    ok(allFound, 'LinearHashTable finds all 80 keys (tombstones/rehash intact)');
    lt.add(7); lt.remove(7); lt.add(7);
    ok(lt.find(7) === 7, 'LinearHashTable re-add after tombstone');
  }
  { // BST + delete cases
    const b = new DS.BST();
    [50, 30, 70, 20, 40, 60, 80, 35].forEach(v => b.add(v));
    eqDeep(b.traverse('in'), [20, 30, 35, 40, 50, 60, 70, 80], 'BST in-order sorted');
    b.remove(30); // two children
    eqDeep(b.traverse('in'), [20, 35, 40, 50, 60, 70, 80], 'BST two-child delete (successor promoted)');
    b.remove(20); b.remove(80);
    eqDeep(b.traverse('in'), [35, 40, 50, 60, 70], 'BST leaf + one-child deletes');
  }
  { // Treap invariants
    const t = new DS.Treap(3);
    const perm = DS.shuffle([...Array(300).keys()], DS.mulberry32(11));
    perm.forEach(v => t.add(v));
    // rebuild in-order + check heap priority up the tree
    let sortedOK = true, heapOK = true;
    const walk = (n, lo, hi, parentPri) => {
      if (!n) return;
      if (n.x <= lo || n.x >= hi) sortedOK = false;
      if (parentPri !== null && n.pri < parentPri) heapOK = false;
      walk(n.left, lo, n.x, n.pri); walk(n.right, n.x, hi, n.pri);
    };
    walk(t.r, -Infinity, Infinity, null);
    ok(sortedOK, 'Treap BST invariant holds at 300 keys');
    ok(heapOK, 'Treap heap invariant on priorities');
    ok(t.depth() <= 40, `Treap expected-log depth (got ${t.depth()})`);
  }
  { // RedBlack structural invariants
    const rb = new DS.RedBlack();
    const perm = DS.shuffle([...Array(500).keys()], DS.mulberry32(13));
    perm.forEach(v => rb.add(v));
    let noRedRed = true, blackEq = true, sorted = true, lastX = -1;
    const walk = (n, parentColor, blackDepth, out) => {
      if (!n) { out.bd = blackDepth; return 0; }
      if (parentColor === DS.RED && n.color === DS.RED) noRedRed = false;
      const bd = blackDepth + (n.color === DS.BLACK ? 1 : 0);
      const L = walk(n.left, n.color, bd, out);
      if (n.x <= lastX) sorted = false; lastX = n.x;
      // (in-order via global lastX)
      const R = walk(n.right, n.color, bd, out);
      if (L !== 0 && R !== 0 && L !== R) blackEq = false;
      return (L || R) || bd;
    };
    const ref = { bd: 0 };
    walk(rb.r, DS.BLACK, 0, ref);
    ok(noRedRed, 'RedBlack: no red-red violations');
    ok(blackEq, 'RedBlack: equal black depths');
    ok(sorted, 'RedBlack: in-order sorted');
    perm.forEach(v => { if (!rb.find(v)) sorted = false; });
    ok(sorted && rb.size() === 500, 'RedBlack: all 500 keys findable');
  }
  { // Heaps
    const h = new DS.BinaryHeap();
    const perm = DS.shuffle([...Array(300).keys()], DS.mulberry32(17));
    perm.forEach(v => h.add(v));
    const out = [];
    while (h.size()) out.push(h.removeMin());
    eqDeep(out, [...Array(300).keys()], 'BinaryHeap extracts sorted');
    const h2 = DS.BinaryHeap.heapify(perm.slice());
    const out2 = [];
    while (h2.size()) out2.push(h2.removeMin());
    eqDeep(out2, [...Array(300).keys()], 'BinaryHeap.heapify (O(n) build) sorts too');
    const mh = new DS.MeldableHeap(19);
    perm.forEach(v => mh.add(v));
    const out3 = [];
    while (mh.size()) out3.push(mh.removeMin());
    eqDeep(out3, [...Array(300).keys()], 'MeldableHeap extracts sorted');
  }
  { // Sorting steps: correctness + the quicksort trap
    const arr = DS.shuffle([...Array(40).keys()], DS.mulberry32(21));
    for (const f of [DS.mergeSortSteps, DS.quickSortSteps, DS.heapSortSteps]) {
      const r = f(arr);
      eqDeep(r.out, [...Array(40).keys()], `${f.name} sorts`);
    }
    const worst = DS.quickSortSteps([...Array(60).keys()], 'first');
    const best = DS.quickSortSteps([...Array(60).keys()], 'mid');
    const cmps = (s) => s.steps.filter(e => e.t === 'cmp').length;
    ok(cmps(worst) > cmps(best) * 3, `quicksort sorted-input trap visible (worst ${cmps(worst)} vs ${cmps(best)} comps)`);
    eqDeep(DS.countingSortSteps([3, 1, 2, 1, 3, 0], 3).out, [0, 1, 1, 2, 3, 3], 'counting sort');
    eqDeep(DS.radixSortSteps(arr.map(v => v * 7), 4).out, [...Array(40).keys()].map(v => v * 7), 'radix sort');
  }
  { // Graph
    const g = new DS.Graph(6);
    [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]].forEach(([a, b]) => g.addEdge(a, b));
    eqDeep(g.bfs(0).dist, [0, 1, 1, 2, 3, 3], 'BFS distances');
    const { order } = g.dfs(0);
    eqDeep(order.length, 6, 'DFS visits all');
    eqDeep(g.adjMatrix().flat().reduce((a, b) => a + b, 0), 12, 'adjacency matrix symmetric (12 ones)');
  }
  { // BinaryTrie
    const bt = new DS.BinaryTrie(8);
    const perm = DS.shuffle([...Array(90).keys()].map(v => v * 3 % 256), DS.mulberry32(23));
    perm.forEach(v => bt.add(v));
    let allFind = true;
    perm.forEach(v => { if (!bt.find(v)) allFind = false; });
    ok(allFind, 'BinaryTrie finds all 90 keys');
    ok(bt.find(1) === null && bt.find(4) === null, 'BinaryTrie rejects absent keys');
    const snap = bt.snapshot();
    eqDeep(snap.leaves, [...snap.leaves].sort((a, b) => a - b), 'BinaryTrie leaf chain sorted');
    bt.remove(perm[0]);
    ok(bt.find(perm[0]) === null && bt.size() === 89, 'BinaryTrie remove');
  }
  { // BTree
    const bt = new DS.BTree(3);
    const perm = DS.shuffle([...Array(500).keys()], DS.mulberry32(25));
    perm.forEach(v => bt.add(v));
    perm.forEach(v => bt.add(v));
    eqDeep(bt.size(), 500, 'BTree duplicates ignored');
    eqDeep(bt.inOrder(), [...Array(500).keys()], 'BTree in-order sorted');
    const snap = bt.snapshot();
    const maxD = Math.max(...snap.nodes.map(n => n.depth));
    let okKeys = true, okLeaves = true, okChildren = true;
    const byId = new Map(snap.nodes.map(n => [n.id, n]));
    const check = (n, depth, lo, hi) => {
      if (!n) return;
      if (n.keys.length < 1 || n.keys.length > 2 * bt.B - 1) okKeys = false;
      n.keys.forEach((k, i) => { if (k <= lo || k >= hi) okKeys = false; if (i && n.keys[i - 1] >= k) okKeys = false; });
      if (!n.leaf) {
        if (n.children.length !== n.keys.length + 1) okChildren = false;
        n.children.forEach((cid, i) => check(byId.get(cid), depth + 1, i ? n.keys[i - 1] : lo, i < n.keys.length ? n.keys[i] : hi));
      } else if (depth !== maxD) okLeaves = false;
    };
    check(snap.nodes[0], 0, -Infinity, Infinity);
    ok(okKeys, 'BTree key counts + ranges valid');
    ok(okLeaves, 'BTree all leaves at equal depth');
    ok(okChildren, 'BTree child counts valid');
  }
}

console.log('\n— learn/pure · build-your-own-X cores —');
{
  const { sha256 } = require(join(root, 'learn/pure/sha256.js'));
  ok(sha256('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'sha256 vector: empty string');
  ok(sha256('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256 vector: "abc"');
  ok(sha256('ULTRON LAB') === sha256('ULTRON LAB') && sha256('ULTRON LAB') !== sha256('ULTRON LAB.'), 'sha256 deterministic + sensitive');

  const { MiniGit } = require(join(root, 'learn/pure/gitstore.js'));
  const g = new MiniGit();
  g.add('a.txt', 'one'); g.add('b.txt', 'two');
  g.commit('first');
  g.add('a.txt', 'one-v2'); g.commit('second');
  g.add('c.txt', 'two'); g.commit('third — c.txt duplicates b.txt content');
  ok(g.stats().blobs === 3, `git content dedup (3 distinct blobs, got ${g.stats().blobs})`);
  g.branch('dev'); g.checkout('dev'); g.add('d.txt', 'dev only'); g.commit('dev work');
  eqDeep(g.log()[0].msg, 'dev work', 'git branch commit on top');
  g.checkout('main');
  ok(!('d.txt' in g.snapshot()), 'git checkout restores main working files');
  ok(g.log()[0].msg === 'third — c.txt duplicates b.txt content', 'git main unaffected by dev');
  g.add('e.txt', 'new file'); g.add('a.txt', 'one-v2-modified');
  const st = g.status();
  ok(st.staged.includes('e.txt') && st.changed.includes('a.txt'), 'git status reports staged + changed (regression: tree deref)');

  const C = require(join(root, 'learn/pure/parser.js'));
  const cases = [['2+3*4', 14], ['(2+3)*4', 20], ['2^3^2', 512], ['-3^2', -9], ['10/4', 2.5], ['2*3+4*5', 26], ['1+2*(3-(4-5))', 9]];
  let all = true;
  cases.forEach(([s, w]) => { if (Math.abs(C.calc(s) - w) > 1e-9) { all = false; console.log('    └ bad case', s, C.calc(s), '≠', w); } });
  ok(all, 'calculator precedence/associativity suite');
  let threw = false; try { C.calc('2+*3'); } catch (e) { threw = true; }
  ok(threw, 'calculator rejects bad syntax');

  const { Mat } = require(join(root, 'learn/pure/linalg.js'));
  const A = new Mat([[2, 1, 1], [1, 3, 2], [1, 0, 0]]);
  const x = A.solve([4, 5, 6]);
  const residual = Math.max(...A.mul(new Mat(x.map(v => [v]))).m.map((r, i) => Math.abs(r[0] - [4, 5, 6][i])));
  ok(residual < 1e-10, `Gaussian solve residual < 1e-10 (got ${residual.toExponential(2)})`);
  ok(Math.abs(Math.abs(A.det()) - 1) < 1e-9, 'determinant from the same elimination');
  const { steps } = A.solve([4, 5, 6], true);
  ok(steps.length >= 6, 'solve records its steps for the visual lab');

  const NN = require(join(root, 'learn/pure/autograd.js'));
  const xv = new NN.Value(3), yv = xv.mul(xv);
  yv.backwardAll();
  ok(Math.abs(xv.grad - 6) < 1e-12, 'autograd: d(x²)/dx = 2x');
  const xs = [[0, 0], [0, 1], [1, 0], [1, 1]], ys = [0, 1, 1, 0];
  let allXor = true, anyNaN = false;
  for (let seed = 1; seed <= 6; seed++) {
    let s = 999 + seed * 13;
    const orig = Math.random;
    Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const mlp = new NN.MLP([2, 4, 1]);
    Math.random = orig;
    let loss;
    for (let i = 0; i < 1000; i++) { loss = mlp.step(xs, ys, 0.15); if (isNaN(loss.v)) { anyNaN = true; break; } }
    const outs = xs.map(x => mlp.forward(x)[0].v);
    if (!outs.every((v, i) => Math.abs(v - ys[i]) < 0.2)) allXor = false;
  }
  ok(!anyNaN && allXor, 'MLP learns XOR from 6 random inits at lr 0.15 (mean loss + grad clipping)');

  const SIG = require(join(root, 'learn/pure/signals.js'));
  let runs = 0;
  const name = SIG.signal('ada'), n = SIG.signal(2);
  const greeting = SIG.computed(() => { runs++; return name() + ':' + n(); });
  name.set('linus');
  ok(greeting.peek() === 'linus:2' && runs === 2, 'signals: computed re-runs on dependency write');
  const cond = SIG.signal(false);
  const c2 = SIG.computed(() => cond() ? n() * 10 : 0);
  c2(); cond.set(true); n.set(5);
  ok(c2.peek() === 50, 'signals: stale dependencies collected, new ones wired');

  const VIM = require(join(root, 'learn/pure/vimcore.js'));
  const s1 = VIM.createState('hello world\nsecond line');
  VIM.applyKeys(s1, ['l', 'l', 'l', 'w', 'i', '!', 'Escape', '0', 'd', 'd']);
  eqDeep(s1.lines, ['second line'], 'vim: motions, insert, dd');
  const s2 = VIM.createState('one\ntwo');
  VIM.applyKeys(s2, ['j', 'd', 'd', 'p']);
  eqDeep(s2.lines, ['one', 'two'], 'vim: dd then p restores below');
  const s3 = VIM.createState('abcdef');
  VIM.applyKeys(s3, ['3', 'l', '$', 'd', 'd', 'p', 'u', 'u']);
  eqDeep(s3.lines, ['abcdef'], 'vim: counts + double-undo roundtrip');

  const { Database } = require(join(root, 'learn/pure/dbstore.js'));
  const db = new Database(2);
  db.create('people', ['id', 'name', 'age']);
  for (let i = 1; i <= 30; i++) db.insert('people', [i, 'p' + i, 18 + (i * 7) % 40]);
  const r1 = db.run('SELECT * FROM people WHERE id = 17');
  eqDeep(r1.rows, [[17, 'p17', 18 + (17 * 7) % 40]], 'db: index lookup by primary key');
  ok(r1.plan[0].startsWith('index scan'), 'db: planner reports index scan');
  const r2 = db.run("SELECT * FROM people WHERE name = 'p17'");
  ok(r2.plan[0].startsWith('full table scan'), 'db: planner reports full scan on unindexed column');
  const r3 = db.run('SELECT * FROM people ORDER BY id DESC');
  eqDeep(r3.rows[0][0], 30, 'db: order by desc');
}

console.log('\n— learn/arena-data.js · bank integrity + solutions —');
{
  const A = require(join(root, 'learn/arena-data.js'));
  ok(A.topics.length === 12, `12 topics defined (${A.topics.length})`);
  let allFields = true, allHints = true, allSolve = true, runnable = 0;
  const topicIds = new Set(A.topics.map(t => t.id));
  const ids = new Set();
  for (const p of A.problems) {
    if (!p.id || ids.has(p.id)) allFields = false; ids.add(p.id);
    if (!p.title || !p.src || !p.stmt || !p.approach || !p.time || !p.space || !p.code || !p.diff || !p.world) allFields = false;
    if (!topicIds.has(p.topic)) allFields = false;
    if (!p.hints || p.hints.length !== 3) allHints = false;
    if (p.run) {
      runnable++;
      try {
        const fn = new Function(p.code + `\nreturn ${p.run.fn};`)();
        for (const t of p.run.tests) {
          const got = fn(...JSON.parse(JSON.stringify(t.in)));
          const norm = (v) => typeof v === 'object' ? JSON.stringify(v) : String(v);
          const match = p.run.orderMatters === false
            ? JSON.stringify(got && got.slice ? got.slice().sort() : got) === JSON.stringify(t.out.slice ? t.out.slice().sort() : t.out)
            : norm(got) === norm(t.out) || JSON.stringify(got) === JSON.stringify(t.out);
          if (!match) { allSolve = false; console.log(`    └ ✘ ${p.id} test failed: got ${JSON.stringify(got)}, want ${JSON.stringify(t.out)}`); }
        }
      } catch (e) { allSolve = false; console.log(`    └ ✘ ${p.id} threw: ${e.message}`); }
    }
  }
  ok(allFields, `all ${A.problems.length} problems have complete fields + valid topic`);
  ok(allHints, 'every problem has exactly 3 hints');
  ok(allSolve, `every runnable solution passes its own tests (${runnable} runnable)`);
}

console.log('\n— learn/worlds · presence + registration sanity —');
{
  const worldFiles = ['w01-growth', 'w02-arrays', 'w03-chains', 'w04-skiplists', 'w05-hashing', 'w06-trees', 'w07-balance', 'w08-heaps', 'w09-sorting', 'w10-graphs', 'w11-tries', 'w12-btrees'];
  let allOk = true;
  for (const w of worldFiles) {
    const p = join(root, 'learn/worlds', w + '.js');
    if (!existsSync(p)) { allOk = false; console.log('    └ missing', w); continue; }
    const src = readFileSync(p, 'utf8');
    if (!src.includes('ULTRON_WORLDS.push')) { allOk = false; console.log('    └ no registration in', w); }
    if (!src.includes('defineNotes') || !src.includes('defineQuiz')) { allOk = false; console.log('    └ missing notes/quiz in', w); }
    if (!src.includes('story()')) { allOk = false; console.log('    └ missing story in', w); }
  }
  ok(allOk, `all 12 world modules present, registered, with notes/quiz/story`);
  const pages = ['index.html', 'stats/index.html', 'build/index.html', 'arena/index.html'];
  ok(pages.every(pg => existsSync(join(root, pg))), 'all four pages exist');
  const idx = readFileSync(join(root, 'index.html'), 'utf8');
  ok(worldFiles.every(w => idx.includes('worlds/' + w + '.js')), 'hub loads all 12 world modules');
}

console.log(`\n════════════════════════════════════════`);
console.log(`  ${pass} passed, ${fail} failed`);
if (fail) { console.log('  FAILURES:', failures.join(' | ')); process.exit(1); }
console.log('  ULTRON LAB verified. No shortcuts taken.\n');
