/* ============================================================
   ULTRON LAB · ds.js — pure data structures from Open Data
   Structures, each with an op-log so the 3D worlds can narrate
   what just happened. No DOM, no three.js: runs in the browser
   AND in node (tools/verify.mjs tests this exact file).
   References in comments: ODS §n = chapter/section of the book.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- seeded randomness (deterministic worlds + tests) ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(0x5eed);
  const rint = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const shuffle = (a, rnd) => {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  let NODE_SEQ = 1;
  const nid = () => NODE_SEQ++;

  /* ============================================================
     ArrayStack — ODS §2.1. An array with a gap at the end.
     ============================================================ */
  class ArrayStack {
    constructor() { this.a = []; this.n = 0; this.log = []; }
    get(i) { if (i < 0 || i >= this.n) throw new RangeError(); return this.a[i]; }
    set(i, x) { if (i < 0 || i >= this.n) throw new RangeError(); const y = this.a[i]; this.a[i] = x; this.log.push({ op: 'set', i, x, cost: 1 }); return y; }
    resize(nn) {
      const b = new Array(Math.max(1, nn * 2));
      for (let k = 0; k < this.n; k++) b[k] = this.a[k];
      this.log.push({ op: 'resize', from: this.a.length, to: b.length, cost: this.n + 1 });
      this.a = b;
    }
    add(i, x) {
      if (i < 0 || i > this.n) throw new RangeError();
      if (this.n + 1 > this.a.length) this.resize(this.n + 1);
      // shift a[n-1..i] right one slot, heaviest first
      for (let k = this.n; k > i; k--) this.a[k] = this.a[k - 1];
      this.a[i] = x; this.n++;
      this.log.push({ op: 'shift', i, count: this.n - 1 - i, dir: +1, cost: this.n - i });
      this.log.push({ op: 'add', i, x, cost: 1 });
      return true;
    }
    remove(i) {
      if (i < 0 || i >= this.n) throw new RangeError();
      const x = this.a[i];
      for (let k = i; k < this.n - 1; k++) this.a[k] = this.a[k + 1];
      this.a[this.n - 1] = undefined; this.n--;
      this.log.push({ op: 'shift', i, count: this.n - i, dir: -1, cost: this.n - i + 1 });
      this.log.push({ op: 'remove', i, x });
      if (this.a.length > 3 * this.n) this.resize(this.n);
      return x;
    }
    size() { return this.n; }
    snapshot() { return { kind: 'arraystack', items: this.a.slice(0, this.n), cap: this.a.length }; }
  }

  /* ============================================================
     ArrayQueue — ODS §2.3. A circular array; the queue walks
     forward and the array rotates when it hits the wall.
     ============================================================ */
  class ArrayQueue {
    constructor() { this.a = []; this.j = 0; this.n = 0; this.log = []; }
    resize(nn) {
      const b = new Array(Math.max(1, nn * 2));
      for (let k = 0; k < this.n; k++) b[k] = this.a[(this.j + k) % this.a.length];
      this.log.push({ op: 'rotate', from: this.j, to: 0, cost: this.n + 1 });
      this.a = b; this.j = 0;
    }
    add(x) {
      if (this.j + this.n + 1 > this.a.length) {
        if (this.j === 0) this.resize(this.n + 1); // truly full: grow
        else this.rotate();                        // space up front: slide to the front, same array
      }
      this.a[(this.j + this.n) % this.a.length] = x; this.n++;
      this.log.push({ op: 'enqueue', x, pos: (this.j + this.n - 1) % this.a.length, cost: 1 });
    }
    rotate() { // ODS: the queue walks back to the front of the array
      const m = this.a.length;
      for (let k = 0; k < this.n; k++) this.a[k] = this.a[(this.j + k) % m];
      this.log.push({ op: 'rotate', from: this.j, to: 0, cost: this.n });
      this.j = 0;
    }
    remove() {
      if (this.n === 0) throw new RangeError('empty');
      const x = this.a[this.j]; this.a[this.j] = undefined;
      this.j = (this.j + 1) % this.a.length; this.n--;
      this.log.push({ op: 'dequeue', x, cost: 1 });
      if (this.a.length >= 3 * this.n && this.n > 0) this.resize(this.n);
      return x;
    }
    size() { return this.n; }
    snapshot() {
      const items = []; for (let k = 0; k < this.n; k++) items.push(this.a[(this.j + k) % this.a.length]);
      return { kind: 'arrayqueue', items, cap: this.a.length, head: this.j };
    }
  }

  /* ============================================================
     ArrayDeque — ODS §2.4. A circular array (like the queue):
     shift whichever side is shorter.
     ============================================================ */
  class ArrayDeque {
    constructor() { this.a = []; this.j = 0; this.n = 0; this.log = []; }
    resize() {
      const b = new Array(Math.max(1, 2 * this.n));
      for (let k = 0; k < this.n; k++) b[k] = this.a[(this.j + k) % this.a.length];
      this.log.push({ op: 'recenter', cost: this.n + 1 });
      this.a = b; this.j = 0;
    }
    get(i) { if (i < 0 || i >= this.n) throw new RangeError(); return this.a[(this.j + i) % this.a.length]; }
    set(i, x) { const y = this.get(i); this.a[(this.j + i) % this.a.length] = x; return y; }
    add(i, x) {
      if (i < 0 || i > this.n) throw new RangeError();
      if (this.n + 1 > this.a.length) this.resize();
      const m = this.a.length;
      if (i < this.n / 2) {
        // back the head up one slot, shift the front block toward it
        this.j = (this.j === 0) ? m - 1 : this.j - 1;
        for (let k = 0; k < i; k++) this.a[(this.j + k) % m] = this.a[(this.j + k + 1) % m];
        this.log.push({ op: 'shift', side: 'front', i, count: i, cost: i + 1 });
      } else {
        for (let k = this.n; k > i; k--) this.a[(this.j + k) % m] = this.a[(this.j + k - 1) % m];
        this.log.push({ op: 'shift', side: 'back', i, count: this.n - i, cost: this.n - i + 1 });
      }
      this.a[(this.j + i) % m] = x; this.n++;
      this.log.push({ op: 'add', i, x });
    }
    remove(i) {
      if (i < 0 || i >= this.n) throw new RangeError();
      const m = this.a.length;
      const x = this.get(i);
      if (i < this.n / 2) {
        for (let k = i; k > 0; k--) this.a[(this.j + k) % m] = this.a[(this.j + k - 1) % m];
        this.a[this.j] = undefined;
        this.j = (this.j + 1) % m;
        this.log.push({ op: 'shift', side: 'front', i, count: i, cost: i + 1 });
      } else {
        for (let k = i; k < this.n - 1; k++) this.a[(this.j + k) % m] = this.a[(this.j + k + 1) % m];
        this.a[(this.j + this.n - 1) % m] = undefined;
        this.log.push({ op: 'shift', side: 'back', i, count: this.n - 1 - i, cost: this.n - i });
      }
      this.n--;
      this.log.push({ op: 'remove', i, x });
      if (this.a.length >= 3 * this.n && this.n > 0) this.resize();
      return x;
    }
    size() { return this.n; }
    snapshot() {
      const items = []; for (let k = 0; k < this.n; k++) items.push(this.a[(this.j + k) % this.a.length]);
      return { kind: 'arraydeque', items, cap: this.a.length, head: this.j };
    }
  }

  /* ============================================================
     RootishArrayStack — ODS §2.6. Blocks of size 1,2,3,…:
     O(√n) wasted space instead of O(n).
     ============================================================ */
  class RootishArrayStack {
    constructor() { this.blocks = []; this.n = 0; this.log = []; }
    static i2b(i) { let r = Math.ceil((Math.sqrt(8 * i + 9) - 3) / 2); const want = r * (r + 1) / 2; if (want > i + 1) r--; return r; }
    grow() { this.blocks.push(new Array(this.blocks.length + 1)); this.log.push({ op: 'grow', b: this.blocks.length - 1, size: this.blocks.length }); }
    shrink() { this.blocks.pop(); this.log.push({ op: 'shrink' }); }
    get(i) { if (i < 0 || i > this.n - 1) throw new RangeError(); const b = RootishArrayStack.i2b(i); const j = i - b * (b + 1) / 2; return this.blocks[b][j]; }
    set(i, x) { const b = RootishArrayStack.i2b(i), j = i - b * (b + 1) / 2; const y = this.blocks[b][j]; this.blocks[b][j] = x; return y; }
    add(i, x) {
      if (i < 0 || i > this.n) throw new RangeError();
      const r = this.blocks.length;
      if (r * (r + 1) / 2 < this.n + 1) this.grow();
      this.log.push({ op: 'shift', i, count: this.n - i, cost: this.n - i + 1 });
      for (let k = this.n; k > i; k--) {
        const bFrom = RootishArrayStack.i2b(k - 1), jFrom = (k - 1) - bFrom * (bFrom + 1) / 2;
        const bTo = RootishArrayStack.i2b(k), jTo = k - bTo * (bTo + 1) / 2;
        this.blocks[bTo][jTo] = this.blocks[bFrom][jFrom];
      }
      const b = RootishArrayStack.i2b(i), j = i - b * (b + 1) / 2;
      this.blocks[b][j] = x; this.n++;
      this.log.push({ op: 'add', i, x, b });
    }
    remove(i) {
      if (i < 0 || i > this.n - 1) throw new RangeError();
      const x = this.get(i);
      for (let k = i; k < this.n - 1; k++) {
        const bFrom = RootishArrayStack.i2b(k + 1), jFrom = (k + 1) - bFrom * (bFrom + 1) / 2;
        const bTo = RootishArrayStack.i2b(k), jTo = k - bTo * (bTo + 1) / 2;
        this.blocks[bTo][jTo] = this.blocks[bFrom][jFrom];
      }
      // clear the vacated last cell so blocks hold no stale values
      const bLast = RootishArrayStack.i2b(this.n - 1), jLast = (this.n - 1) - bLast * (bLast + 1) / 2;
      this.blocks[bLast][jLast] = undefined;
      this.n--;
      const r = this.blocks.length;
      if (r > 2 && (r - 2) * (r - 1) / 2 >= this.n) this.shrink();
      this.log.push({ op: 'remove', i, x });
      return x;
    }
    size() { return this.n; }
    snapshot() { return { kind: 'rootish', blocks: this.blocks.map(b => b.slice()), n: this.n }; }
  }

  /* ============================================================
     SLList / DLList — ODS §3.1–3.2. Nodes + pointers.
     ============================================================ */
  class SLList {
    constructor() { this.head = null; this.tail = null; this.n = 0; this.log = []; }
    push(x) { const node = { id: nid(), x, next: this.head }; this.head = node; if (this.tail === null) this.tail = node; this.n++; this.log.push({ op: 'push', id: node.id, x, cost: 1 }); return node; }
    pop() {
      if (!this.head) throw new RangeError('empty');
      const node = this.head; this.head = node.next; if (!this.head) this.tail = null;
      this.n--; this.log.push({ op: 'pop', id: node.id, x: node.x, cost: 1 }); return node.x;
    }
    addLast(x) { const node = { id: nid(), x, next: null }; if (this.tail) this.tail.next = node; else this.head = node; this.tail = node; this.n++; this.log.push({ op: 'addlast', id: node.id, x, cost: 1 }); return node; }
    size() { return this.n; }
    snapshot() { const items = []; let p = this.head; while (p) { items.push({ id: p.id, x: p.x }); p = p.next; } return { kind: 'sllist', items }; }
  }

  class DLList {
    constructor() {
      this.dummy = { id: nid(), x: null, prev: null, next: null };
      this.dummy.prev = this.dummy; this.dummy.next = this.dummy;
      this.n = 0; this.log = [];
    }
    getNode(i) {
      let p, dir;
      if (i < this.n / 2) { p = this.dummy.next; dir = 1; for (let k = 0; k < i; k++) p = p.next; }
      else { p = this.dummy.prev; dir = -1; for (let k = this.n - 1; k > i; k--) p = p.prev; }
      this.log.push({ op: 'walk', i, steps: dir === 1 ? i + 1 : this.n - i, cost: Math.min(i + 1, this.n - i) });
      return p;
    }
    get(i) { return this.getNode(i).x; }
    addBefore(node, x) {
      const u = { id: nid(), x, prev: node.prev, next: node };
      node.prev.next = u; node.prev = u; this.n++;
      this.log.push({ op: 'splice', id: u.id, x, cost: 1 });
      return u;
    }
    add(i, x) { const node = i === this.n ? this.dummy : this.getNode(i); return this.addBefore(node, x); }
    removeNode(node) {
      node.prev.next = node.next; node.next.prev = node.prev; this.n--;
      this.log.push({ op: 'unlink', id: node.id, x: node.x, cost: 1 });
      return node.x;
    }
    remove(i) { const node = this.getNode(i); return this.removeNode(node); }
    size() { return this.n; }
    snapshot() {
      const items = []; let p = this.dummy.next;
      while (p !== this.dummy) { items.push({ id: p.id, x: p.x }); p = p.next; }
      return { kind: 'dllist', items };
    }
  }

  /* ============================================================
     SkiplistSSet — ODS §4. Coin flips build express lanes.
     ============================================================ */
  class SkiplistSSet {
    constructor(seed) {
      this.rnd = mulberry32(seed === undefined ? (Date.now() & 0xffff) : seed);
      this.sentinel = { id: nid(), x: -Infinity, next: [] };
      this.h = 0; this.n = 0; this.log = [];
    }
    pickHeight() {
      let z = this.rnd(), h = 0, flips = [];
      while (z > 0.5) { h++; z = this.rnd(); flips.push(1); }
      flips.push(0);
      this.log.push({ op: 'coin', flips, h });
      return h + 1;
    }
    findPred(x) { // returns the node just before where x belongs, per level; logs path
      let u = this.sentinel; const path = [];
      for (let r = this.h - 1; r >= 0; r--) {
        while (u.next[r] !== undefined && u.next[r] !== null && u.next[r].x < x) { u = u.next[r]; path.push({ id: u.id, x: u.x, r }); }
        path.push({ at: u.id, r, stop: true });
      }
      this.log.push({ op: 'path', path });
      return u;
    }
    find(x) {
      const u = this.findPred(x);
      const nx = u.next[0];
      return nx && nx.x !== undefined && nx.x >= x ? nx : null;
    }
    add(x) {
      const u = this.findPred(x);
      const nx = u.next[0];
      if (nx && nx.x === x) return false;
      const w = { id: nid(), x, next: [] };
      const k = this.pickHeight();
      while (this.h < k) { this.sentinel.next[this.h] = null; this.h++; this.log.push({ op: 'lane', level: this.h - 1 }); }
      for (let r = 0; r < k; r++) {
        // walk from top again per level (simple version of ODS findPred per level)
        let v = this.sentinel;
        for (let r2 = this.h - 1; r2 >= r; r2--) { while (v.next[r2] && v.next[r2].x < x) v = v.next[r2]; }
        w.next[r] = v.next[r] || null; v.next[r] = w;
      }
      this.n++;
      this.log.push({ op: 'add', id: w.id, x, h: k });
      return true;
    }
    remove(x) {
      let u = this.sentinel; let target = null;
      for (let r = this.h - 1; r >= 0; r--) {
        while (u.next[r] && u.next[r].x < x) u = u.next[r];
        if (u.next[r] && u.next[r].x === x) { target = u.next[r]; u.next[r] = target.next[r] || null; }
      }
      if (!target) return false;
      while (this.h > 1 && this.sentinel.next[this.h - 1] === null) { this.h--; this.log.push({ op: 'droplane', level: this.h }); }
      this.n--;
      this.log.push({ op: 'remove', id: target.id, x });
      return true;
    }
    size() { return this.n; }
    snapshot() {
      const nodes = [];
      let p = this.sentinel.next[0];
      while (p) { nodes.push({ id: p.id, x: p.x, h: p.next.length }); p = p.next[0]; }
      return { kind: 'skiplist', nodes, h: this.h };
    }
  }

  /* ============================================================
     Hashing — ODS §5. Multiplicative hashing (BigInt for exact
     32-bit math), chaining and linear probing.
     ============================================================ */
  function mulHash(z, x, d) {
    const big = (BigInt(z) * BigInt(x >>> 0)) & 0xFFFFFFFFn;
    return Number(big >> BigInt(32 - d));
  }
  class ChainedHashTable {
    constructor(d, seed) {
      const rnd = mulberry32(seed === undefined ? 0xabc : seed);
      this.d = d || 4; this.z = 0;
      while (this.z % 2 === 0) this.z = Math.floor(rnd() * 4294967295) | 1;
      this.t = Array.from({ length: 1 << this.d }, () => []);
      this.n = 0; this.log = [];
    }
    hash(x) { const h = mulHash(this.z, x | 0, this.d); this.log.push({ op: 'hash', x, h }); return h; }
    add(x) {
      const h = this.hash(x);
      if (this.t[h].some(e => e.x === x)) { this.log.push({ op: 'dup', x, h }); return false; }
      const e = { id: nid(), x }; this.t[h].push(e); this.n++;
      this.log.push({ op: 'chain', id: e.id, x, h, len: this.t[h].length, cost: this.t[h].length });
      if (this.n > this.t.length) this.grow();
      return true;
    }
    grow() {
      this.d++; const old = this.t;
      this.t = Array.from({ length: 1 << this.d }, () => []);
      this.log.push({ op: 'rehash', from: old.length, to: this.t.length });
      for (const b of old) for (const e of b) this.t[this.hash(e.x)].push(e);
    }
    find(x) {
      const h = this.hash(x);
      const i = this.t[h].findIndex(e => e.x === x);
      this.log.push({ op: 'find', x, h, i, cost: i < 0 ? this.t[h].length : i + 1 });
      return i < 0 ? null : this.t[h][i].x;
    }
    remove(x) {
      const h = this.hash(x);
      const i = this.t[h].findIndex(e => e.x === x);
      if (i < 0) return null;
      const [e] = this.t[h].splice(i, 1); this.n--;
      this.log.push({ op: 'remove', id: e.id, x, h });
      return x;
    }
    size() { return this.n; }
    snapshot() { return { kind: 'chainedhash', buckets: this.t.map(b => b.map(e => ({ id: e.id, x: e.x }))), d: this.d, z: this.z }; }
  }

  class LinearHashTable {
    constructor(d, seed) {
      const rnd = mulberry32(seed === undefined ? 0xabc : seed);
      this.d = d || 4; this.z = 0;
      while (this.z % 2 === 0) this.z = Math.floor(rnd() * 4294967295) | 1;
      this.t = new Array(1 << this.d).fill(null); // null | {id,x} | 'DEL'
      this.n = 0; this.q = 0; this.log = [];
    }
    hash(x) { return mulHash(this.z, x | 0, this.d); }
    add(x) {
      if (this.find(x) !== null) return false;
      if (this.q === this.t.length) this.grow();
      let i = this.hash(x), probe = 0;
      while (this.t[i] !== null && this.t[i] !== 'DEL') { i = (i + 1) % this.t.length; probe++; }
      const e = { id: nid(), x };
      if (this.t[i] === null) this.q++;
      this.t[i] = e; this.n++;
      this.log.push({ op: 'probe', x, start: this.hash(x), at: i, probe, cost: probe + 1 });
      return true;
    }
    find(x) {
      let i = this.hash(x), probe = 0;
      while (this.t[i] !== null) {
        if (this.t[i] !== 'DEL' && this.t[i].x === x) { this.log.push({ op: 'hit', x, at: i, probe }); return x; }
        i = (i + 1) % this.t.length; probe++;
        if (probe > this.t.length) break;
      }
      this.log.push({ op: 'miss', x, start: this.hash(x), probe, cost: probe + 1 });
      return null;
    }
    remove(x) {
      let i = this.hash(x), probe = 0;
      while (this.t[i] !== null) {
        if (this.t[i] !== 'DEL' && this.t[i].x === x) {
          this.t[i] = 'DEL'; this.n--; this.log.push({ op: 'tomb', x, at: i, probe });
          return x;
        }
        i = (i + 1) % this.t.length; probe++;
        if (probe > this.t.length) break;
      }
      return null;
    }
    grow() { // rehash doubles size, drops tombstones
      const old = this.t;
      this.d++; this.t = new Array(1 << this.d).fill(null); this.q = this.n;
      this.log.push({ op: 'rehash', from: old.length, to: this.t.length });
      for (const e of old) if (e && e !== 'DEL') { let i = this.hash(e.x); while (this.t[i] !== null) i = (i + 1) % this.t.length; this.t[i] = e; }
    }
    size() { return this.n; }
    snapshot() { return { kind: 'linearhash', slots: this.t.map(s => s === null ? null : s === 'DEL' ? 'DEL' : { id: s.id, x: s.x }), d: this.d }; }
  }

  /* ============================================================
     BinarySearchTree — ODS §6. No balance guarantees (yet).
     ============================================================ */
  class BST {
    constructor() { this.r = null; this.n = 0; this.log = []; }
    find(x) {
      let p = this.r; const path = [];
      while (p !== null) {
        path.push({ id: p.id, x: p.x });
        if (x < p.x) p = p.left;
        else if (x > p.x) p = p.right;
        else { this.log.push({ op: 'find', x, found: true, path, cost: path.length }); return p; }
      }
      this.log.push({ op: 'find', x, found: false, path, cost: path.length });
      return null;
    }
    add(x) {
      const node = { id: nid(), x, left: null, right: null, parent: null };
      let p = this.r, depth = 0;
      if (p === null) { this.r = node; this.n++; this.log.push({ op: 'add', id: node.id, x, root: true, cost: 1 }); return true; }
      while (true) {
        depth++;
        if (x < p.x) { if (p.left === null) { p.left = node; node.parent = p; break; } p = p.left; }
        else if (x > p.x) { if (p.right === null) { p.right = node; node.parent = p; break; } p = p.right; }
        else return false;
      }
      this.n++;
      this.log.push({ op: 'add', id: node.id, x, cost: depth });
      return true;
    }
    remove(x) {
      const node = this.find(x);
      if (!node) return null;
      // case analysis for the story engine — ODS style:
      // two children → copy successor value up, then splice the successor leaf
      let which;
      if (node.left !== null && node.right !== null) {
        which = 'two-children';
        let s = node.right; while (s.left !== null) s = s.left;
        this.log.push({ op: 'successor', from: node.id, to: s.id, x: s.x });
        node.x = s.x;
        this.splice(s);
      } else {
        which = (node.left === null && node.right === null) ? 'leaf' : 'one-child';
        this.splice(node);
      }
      this.log.push({ op: 'remove', id: node.id, x, which });
      return x;
    }
    splice(n) {
      let child = n.left !== null ? n.left : n.right;
      let parent = n.parent;
      if (n === this.r) { this.r = child; if (child) child.parent = null; }
      else if (parent.left === n) parent.left = child; else parent.right = child;
      if (child) child.parent = parent;
      this.n--;
    }
    traverse(kind) {
      const out = [];
      const walk = (p) => {
        if (!p) return;
        if (kind === 'pre') out.push(p.x);
        walk(p.left);
        if (kind === 'in') out.push(p.x);
        walk(p.right);
        if (kind === 'post') out.push(p.x);
      };
      walk(this.r);
      this.log.push({ op: 'traverse', kind, order: out.slice() });
      return out;
    }
    depth() {
      const d = (p) => p === null ? 0 : 1 + Math.max(d(p.left), d(p.right));
      return d(this.r);
    }
    size() { return this.n; }
    nodesList() {
      const out = [];
      const walk = (p) => { if (p) { out.push(p); walk(p.left); walk(p.right); } };
      walk(this.r); return out;
    }
    snapshot() {
      const nodes = this.nodesList().map(p => ({ id: p.id, x: p.x, parent: p.parent ? p.parent.id : null }));
      return { kind: 'bst', nodes, rootId: this.r ? this.r.id : null, depth: this.depth() };
    }
  }

  /* ============================================================
     Treap — ODS §7.2. BST by key, heap by random priority.
     Rotations keep both true; expected depth O(log n).
     ============================================================ */
  class Treap {
    constructor(seed) {
      this.rnd = mulberry32(seed === undefined ? 0x7ea : seed);
      this.r = null; this.n = 0; this.log = [];
    }
    add(x) {
      const pri = this.rnd();
      const node = { id: nid(), x, pri, left: null, right: null, parent: null };
      this.log.push({ op: 'draw', id: node.id, x, pri });
      if (!this.r) { this.r = node; this.n++; return true; }
      let p = this.r;
      while (true) {
        if (x < p.x) { if (!p.left) { p.left = node; node.parent = p; break; } p = p.left; }
        else if (x > p.x) { if (!p.right) { p.right = node; node.parent = p; break; } p = p.right; }
        else return false;
      }
      this.n++;
      // rotate up while child has larger priority (min-heap on pri)
      while (node.parent && node.pri < node.parent.pri) {
        this.rotateUp(node);
      }
      this.log.push({ op: 'settle', id: node.id, x, pri });
      return true;
    }
    rotateUp(node) {
      const p = node.parent, g = p.parent;
      if (p.left === node) { // right rotation
        p.left = node.right; if (node.right) node.right.parent = p;
        node.right = p;
        this.log.push({ op: 'rotate', id: node.id, pivot: p.id, dir: 'right' });
      } else { // left rotation
        p.right = node.left; if (node.left) node.left.parent = p;
        node.left = p;
        this.log.push({ op: 'rotate', id: node.id, pivot: p.id, dir: 'left' });
      }
      p.parent = node; node.parent = g;
      if (!g) this.r = node;
      else if (g.left === p) g.left = node; else g.right = node;
    }
    find(x) {
      let p = this.r; const path = [];
      while (p) {
        path.push({ id: p.id, x: p.x });
        if (x < p.x) p = p.left; else if (x > p.x) p = p.right; else break;
      }
      this.log.push({ op: 'find', x, path });
      return p;
    }
    depth() { const d = p => p ? 1 + Math.max(d(p.left), d(p.right)) : 0; return d(this.r); }
    nodesList() { const out = []; const w = p => { if (p) { out.push(p); w(p.left); w(p.right); } }; w(this.r); return out; }
    snapshot() {
      return {
        kind: 'treap', rootId: this.r ? this.r.id : null, depth: this.depth(),
        nodes: this.nodesList().map(p => ({ id: p.id, x: p.x, pri: p.pri, parent: p.parent ? p.parent.id : null }))
      };
    }
    size() { return this.n; }
  }

  /* ============================================================
     RedBlack — ODS §9 as a left-leaning red-black tree
     (Sedgewick's isomorphic encoding of a 2-4 tree).
     ============================================================ */
  const RED = true, BLACK = false;
  class RedBlack {
    constructor() { this.r = null; this.n = 0; this.log = []; }
    add(x) {
      const ins = (h) => {
        if (!h) { this.n++; return { id: nid(), x, left: null, right: null, color: RED }; }
        if (x < h.x) h.left = ins(h.left);
        else if (x > h.x) h.right = ins(h.right);
        else return h;
        if (this.isRed(h.right) && !this.isRed(h.left)) { h = this.rotL(h); this.log.push({ op: 'rotate', dir: 'left', at: h.x }); }
        if (this.isRed(h.left) && this.isRed(h.left.left)) { h = this.rotR(h); this.log.push({ op: 'rotate', dir: 'right', at: h.x }); }
        if (this.isRed(h.left) && this.isRed(h.right)) { this.flip(h); this.log.push({ op: 'split', at: h.x }); }
        return h;
      };
      this.r = ins(this.r);
      this.r.color = BLACK;
      this.log.push({ op: 'add', x });
      return true;
    }
    isRed(h) { return !!h && h.color === RED; }
    rotL(h) { const x = h.right; h.right = x.left; x.left = h; x.color = h.color; h.color = RED; return x; }
    rotR(h) { const x = h.left; h.left = x.right; x.right = h; x.color = h.color; h.color = RED; return x; }
    flip(h) { h.color = RED; if (h.left) h.left.color = BLACK; if (h.right) h.right.color = BLACK; }
    find(x) { let p = this.r; while (p) { if (x < p.x) p = p.left; else if (x > p.x) p = p.right; else return p; } return null; }
    depth() { const d = p => p ? 1 + Math.max(d(p.left), d(p.right)) : 0; return d(this.r); }
    blackDepth() {
      const d = (p) => p ? (p.color === BLACK ? 1 : 0) + Math.max(d(p.left), d(p.right)) : 0;
      return d(this.r);
    }
    nodesList() { const out = []; const w = p => { if (p) { out.push(p); w(p.left); w(p.right); } }; w(this.r); return out; }
    snapshot() {
      return {
        kind: 'redblack', rootId: this.r ? this.r.id : null, depth: this.depth(),
        nodes: this.nodesList().map(p => ({ id: p.id, x: p.x, color: p.color, parent: null }))
      };
    }
    size() { return this.n; }
  }

  /* ============================================================
     Heaps — ODS §10. BinaryHeap (implicit tree in an array) and
     MeldableHeap (randomized merge).
     ============================================================ */
  class BinaryHeap {
    constructor() { this.a = []; this.log = []; }
    add(x) {
      this.a.push(x);
      let i = this.a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this.a[p] <= this.a[i]) break;
        [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
        this.log.push({ op: 'swapUp', i, p, cost: 1 });
        i = p;
      }
      this.log.push({ op: 'add', x, at: i });
    }
    removeMin() {
      if (!this.a.length) throw new RangeError('empty');
      const x = this.a[0];
      const last = this.a.pop();
      if (this.a.length) {
        this.a[0] = last;
        let i = 0;
        while (true) {
          const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < this.a.length && this.a[l] < this.a[m]) m = l;
          if (r < this.a.length && this.a[r] < this.a[m]) m = r;
          if (m === i) break;
          [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
          this.log.push({ op: 'swapDown', i, m, cost: 1 });
          i = m;
        }
      }
      this.log.push({ op: 'removeMin', x });
      return x;
    }
    static heapify(arr) { // O(n) build — ODS exercise, used by heapsort
      const h = new BinaryHeap(); h.a = arr.slice();
      for (let i = (h.a.length >> 1) - 1; i >= 0; i--) h.siftDownFrom(i, true);
      return h;
    }
    siftDownFrom(i, quiet) {
      while (true) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < this.a.length && this.a[l] < this.a[m]) m = l;
        if (r < this.a.length && this.a[r] < this.a[m]) m = r;
        if (m === i) break;
        [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
        this.log.push({ op: 'swapDown', i, m, cost: 1 });
        i = m;
      }
    }
    size() { return this.a.length; }
    snapshot() { return { kind: 'binheap', items: this.a.slice() }; }
  }

  class MeldableHeap {
    constructor(seed) { this.rnd = mulberry32(seed === undefined ? 0xbee : seed); this.r = null; this.n = 0; this.log = []; }
    merge(h1, h2) {
      if (!h1) return h2;
      if (!h2) return h1;
      if (h2.x < h1.x) { const t = h1; h1 = h2; h2 = t; this.log.push({ op: 'swapRoles', a: h1.id, b: h2.id }); }
      h1.right = this.merge(h1.right, h2);
      if (this.rnd() < 0.5) { const t = h1.left; h1.left = h1.right; h1.right = t; this.log.push({ op: 'coinSwap', at: h1.id }); }
      return h1;
    }
    add(x) { const u = { id: nid(), x, left: null, right: null }; this.r = this.merge(this.r, u); this.n++; this.log.push({ op: 'add', id: u.id, x }); }
    removeMin() { if (!this.r) throw new RangeError('empty'); const x = this.r.x; this.r = this.merge(this.r.left, this.r.right); this.n--; this.log.push({ op: 'removeMin', x }); return x; }
    size() { return this.n; }
  }

  /* ============================================================
     Sorting — ODS §11 as step scripts the 3D world replays.
     Step kinds: cmp, swap, set, mark, done, aux
     ============================================================ */
  function mergeSortSteps(input) {
    const a = input.slice(), steps = [];
    const aux = (lo, hi) => { // sort [lo,hi)
      if (hi - lo <= 1) return;
      const mid = (lo + hi) >> 1;
      aux(lo, mid); aux(mid, hi);
      const tmp = [];
      let i = lo, j = mid;
      while (i < mid && j < hi) {
        steps.push({ t: 'cmp', i, j });
        if (a[i] <= a[j]) tmp.push(a[i++]); else tmp.push(a[j++]);
      }
      while (i < mid) tmp.push(a[i++]);
      while (j < hi) tmp.push(a[j++]);
      for (let k = 0; k < tmp.length; k++) { a[lo + k] = tmp[k]; steps.push({ t: 'set', i: lo + k, v: tmp[k] }); }
    };
    aux(0, a.length);
    steps.push({ t: 'done' });
    return { steps, out: a };
  }

  function quickSortSteps(input, pivotMode) {
    const a = input.slice(), steps = [];
    const pick = (lo, hi) => {
      if (pivotMode === 'first') return lo;
      if (pivotMode === 'last') return hi - 1;
      return lo + Math.floor((hi - lo) / 2); // middle (avoid worst case for sorted demo... but story wants worst case)
    };
    const qs = (lo, hi) => { // sort [lo,hi)
      if (hi - lo <= 1) return;
      const p = pick(lo, hi);
      steps.push({ t: 'mark', i: p, kind: 'pivot' });
      const pv = a[p];
      // Lomuto with pivot moved to end
      [a[p], a[hi - 1]] = [a[hi - 1], a[p]];
      steps.push({ t: 'swap', i: p, j: hi - 1 });
      let store = lo;
      for (let k = lo; k < hi - 1; k++) {
        steps.push({ t: 'cmp', i: k, j: hi - 1 });
        if (a[k] < pv) { if (k !== store) { [a[k], a[store]] = [a[store], a[k]]; steps.push({ t: 'swap', i: k, j: store }); } store++; }
      }
      [a[store], a[hi - 1]] = [a[hi - 1], a[store]];
      steps.push({ t: 'swap', i: store, j: hi - 1 });
      steps.push({ t: 'mark', i: store, kind: 'placed' });
      qs(lo, store); qs(store + 1, hi);
    };
    qs(0, a.length);
    steps.push({ t: 'done' });
    return { steps, out: a };
  }

  function heapSortSteps(input) {
    const a = input.slice(), steps = [];
    const sift = (i, size) => {
      while (true) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < size) { steps.push({ t: 'cmp', i: l, j: m }); if (a[l] > a[m]) m = l; }
        if (r < size) { steps.push({ t: 'cmp', i: r, j: m }); if (a[r] > a[m]) m = r; }
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; steps.push({ t: 'swap', i, j: m });
        i = m;
      }
    };
    for (let i = (a.length >> 1) - 1; i >= 0; i--) sift(i, a.length);
    for (let end = a.length - 1; end > 0; end--) {
      [a[0], a[end]] = [a[end], a[0]]; steps.push({ t: 'swap', i: 0, j: end });
      steps.push({ t: 'mark', i: end, kind: 'placed' });
      sift(0, end);
    }
    steps.push({ t: 'mark', i: 0, kind: 'placed' });
    steps.push({ t: 'done' });
    return { steps, out: a }; // max-heap build + extract-largest-to-end → ascending
  }

  function countingSortSteps(input, kmax) {
    const a = input.slice(), steps = [];
    const k = kmax || Math.max(...a, 1);
    const c = new Array(k + 1).fill(0);
    for (const v of a) { c[v]++; steps.push({ t: 'count', d: v }); }
    let s = 0;
    for (let i = 0; i <= k; i++) { const t = c[i]; c[i] = s; s += t; }
    const out = new Array(a.length);
    for (let i = 0; i < a.length; i++) { const p = c[a[i]]++; out[p] = a[i]; steps.push({ t: 'place', from: i, to: p, v: a[i] }); }
    steps.push({ t: 'done' });
    return { steps, out };
  }

  function radixSortSteps(input, r) {
    // LSD radix, base 2^r, values as non-negative ints
    const a = input.slice(), steps = [];
    const base = 1 << r, mask = base - 1;
    const maxv = Math.max(...a, 0);
    let shift = 0, pass = 0;
    while (((maxv >> shift) | 0) > 0) {
      steps.push({ t: 'pass', pass, shift });
      const buckets = Array.from({ length: base }, () => []);
      for (const v of a) { const d = (v >> shift) & mask; buckets[d].push(v); steps.push({ t: 'bucket', v, d, pass }); }
      let i = 0;
      for (const b of buckets) for (const v of b) { a[i++] = v; steps.push({ t: 'set', i: i - 1, v, pass }); }
      shift += r; pass++;
    }
    steps.push({ t: 'done' });
    return { steps, out: a };
  }

  /* ============================================================
     Graph — ODS §12. BFS/DFS with frontier logs.
     ============================================================ */
  class Graph {
    constructor(n) { this.n = n; this.edges = new Set(); this.log = []; }
    addEdge(i, j) { if (i !== j) { this.edges.add(i + '-' + j); this.edges.add(j + '-' + i); } this.log.push({ op: 'edge', i, j }); }
    has(i, j) { return this.edges.has(i + '-' + j); }
    adj(i) { const out = []; for (let j = 0; j < this.n; j++) if (i !== j && this.has(i, j)) out.push(j); return out; }
    adjLists() { const out = []; for (let i = 0; i < this.n; i++) out.push(this.adj(i)); return out; }
    adjMatrix() { const m = []; for (let i = 0; i < this.n; i++) { m.push([]); for (let j = 0; j < this.n; j++) m[i].push(this.has(i, j) ? 1 : 0); } return m; }
    bfs(s) {
      const seen = new Array(this.n).fill(false), dist = new Array(this.n).fill(-1);
      const rounds = []; let frontier = [s]; seen[s] = true; dist[s] = 0;
      this.log.push({ op: 'visit', v: s, d: 0 });
      while (frontier.length) {
        const next = [];
        for (const v of frontier) for (const w of this.adj(v)) {
          if (!seen[w]) { seen[w] = true; dist[w] = dist[v] + 1; next.push(w); this.log.push({ op: 'visit', v: w, d: dist[w], via: v }); }
        }
        if (next.length) rounds.push(next.slice());
        frontier = next;
      }
      this.log.push({ op: 'rounds', rounds });
      return { dist, rounds };
    }
    dfs(s) {
      const seen = new Array(this.n).fill(false), order = [], stack = [s];
      while (stack.length) {
        const v = stack.pop();
        if (seen[v]) continue;
        seen[v] = true; order.push(v);
        this.log.push({ op: 'visit', v, d: null, deep: true });
        for (const w of this.adj(v).reverse()) if (!seen[w]) { stack.push(w); this.log.push({ op: 'push', v: w, from: v }); }
      }
      return { order };
    }
    snapshot() { return { kind: 'graph', n: this.n, edges: [...this.edges] }; }
  }

  /* ============================================================
     BinaryTrie — ODS §13.1. Search bit by bit; w=8 for the lab.
     Leaves form a doubly-linked list in sorted order.
     ============================================================ */
  class BinaryTrie {
    constructor(w) {
      this.w = w || 8;
      this.root = { id: nid(), kind: 'internal', child: [null, null] };
      this.first = null; // leftmost leaf
      this.n = 0; this.log = [];
    }
    find(x) {
      let node = this.root; const path = [];
      for (let i = this.w - 1; i >= 0; i--) {
        if (!node || node.kind === 'leaf') break;   // shallow leaf: path ends early
        const b = (x >> i) & 1;
        path.push({ level: this.w - 1 - i, bit: b });
        node = node.child[b];
      }
      if (node && node.kind === 'leaf' && node.x === x) {
        this.log.push({ op: 'path', x, path, leaf: node.x });
        return node;
      }
      this.log.push({ op: 'path', x, path, dead: true });
      return null;
    }
    add(x) {
      if (this.n === 0) {
        const leaf = { id: nid(), kind: 'leaf', x, prev: null, next: null };
        this.root.child[(x >> (this.w - 1)) & 1] = leaf;
        this.first = leaf; this.n++;
        this.log.push({ op: 'add', x, first: true });
        return true;
      }
      // walk x's bits; stop at an empty slot (easy case) or at a leaf
      let node = this.root;
      let i = this.w - 1;        // bit index this node consumes
      let w = null;              // the leaf we ran into
      let slot = 0;              // where the leaf hangs / where we hang ours
      while (true) {
        const b = (x >> i) & 1;
        const nx = node.child[b];
        if (!nx) { slot = b; w = null; break; }         // empty slot
        if (nx.kind === 'leaf') { slot = b; w = nx; break; }
        node = nx; i--;
      }
      const leaf = { id: nid(), kind: 'leaf', x, prev: null, next: null };
      if (w === null) {
        // easy: empty slot, hang the leaf directly
        node.child[slot] = leaf;
        this.log.push({ op: 'add', x, at: i, slot });
      } else {
        if (w.x === x) return false;                      // already present
        // highest bit where x and w.x differ (must be ≤ i)
        let j = -1;
        for (let k = this.w - 1; k >= 0; k--) if (((x ^ w.x) >> k) & 1) { j = k; break; }
        if (j < 0) return false;
        // replace leaf w with a chain of internal nodes for the shared
        // prefix (bits i-1 … j+1), ending in one internal node at bit j
        // that separates w and the new leaf
        const chain = { id: nid(), kind: 'internal', child: [null, null] };
        node.child[slot] = chain;
        let cur = chain;
        for (let k = i - 1; k > j; k--) {
          const nb = (x >> k) & 1; // == (w.x >> k) & 1, shared prefix bit
          const nxt = { id: nid(), kind: 'internal', child: [null, null] };
          cur.child[nb] = nxt; cur = nxt;
        }
        const jb = (x >> j) & 1;
        cur.child[jb] = leaf;
        cur.child[1 - jb] = w;
        this.log.push({ op: 'split', at: j, old: w.x, x });
      }
      // splice into the sorted doubly-linked list of leaves
      let p = this.first, prev = null;
      while (p && p.x < x) { prev = p; p = p.next; }
      leaf.next = p; leaf.prev = prev;
      if (prev) prev.next = leaf; else this.first = leaf;
      if (p) p.prev = leaf;
      this.n++;
      return true;
    }
    size() { return this.n; }
    remove(x) {
      if (!this.find(x)) return false;
      // lab simplification: rebuild without x (ODS §13.1 removes in place
      // and prunes empty chains; a rebuild is easier to keep provably right)
      const vals = this.snapshot().leaves.filter(v => v !== x);
      this.root = { id: nid(), kind: 'internal', child: [null, null] };
      this.first = null; this.n = 0;
      vals.forEach(v => this.add(v));
      this.log.push({ op: 'remove', x });
      return true;
    }
    snapshot() {
      const nodes = [];
      const walk = (node, level, pathBits) => {
        if (!node) return;
        nodes.push({ id: node.id, kind: node.kind, x: node.x !== undefined ? node.x : null, level, path: pathBits });
        if (node.kind === 'internal') { walk(node.child[0], level + 1, pathBits + '0'); walk(node.child[1], level + 1, pathBits + '1'); }
      };
      walk(this.root, 0, '');
      const leaves = [];
      let p = this.first; while (p) { leaves.push(p.x); p = p.next; }
      return { kind: 'btrie', w: this.w, nodes, leaves };
    }
  }

  /* ============================================================
     BTree — ODS §14.2. Blocks of keys, balanced by construction:
     splits on the way down (pre-emptive), B-1..2B-2 keys/node.
     ============================================================ */
  class BTree {
    constructor(B) {
      this.B = B || 3; // max keys per node = 2B-2 (min B-1 except root)
      this.root = { id: nid(), keys: [], children: [], leaf: true };
      this.n = 0; this.log = [];
    }
    add(x) {
      const B = this.B;
      const r = this.root;
      this.dup = false;
      if (r.keys.length === 2 * B - 1) { // full root: split pre-emptively
        const s = { id: nid(), keys: [], children: [r], leaf: false };
        this.root = s;
        this.splitChild(s, 0); // pushes median into s.keys, right half into s.children
        this.log.push({ op: 'rootsplit', up: s.keys[0] });
        this.insertNonFull(this.root, x);
      } else this.insertNonFull(r, x);
      if (!this.dup) this.n++;
    }
    splitChild(parent, i) {
      const B = this.B, y = parent.children[i];
      const z = { id: nid(), keys: y.keys.slice(B), children: y.children.slice(B), leaf: y.leaf };
      const up = y.keys[B - 1];
      y.keys = y.keys.slice(0, B - 1); y.children = y.children.slice(0, B);
      parent.keys.splice(i, 0, up);
      parent.children.splice(i + 1, 0, z);
      this.log.push({ op: 'split', parent: parent.id, child: y.id, new: z.id, up, at: i });
    }
    insertNonFull(node, x) {
      const B = this.B;
      let cur = node;
      while (true) {
        if (cur.keys.includes(x)) { this.dup = true; return; }
        let i = cur.keys.findIndex(k => k > x);
        if (i < 0) i = cur.keys.length;
        if (cur.leaf) { cur.keys.splice(i, 0, x); this.log.push({ op: 'insert', into: cur.id, x, at: i }); return; }
        if (cur.children[i].keys.length === 2 * B - 1) {
          this.splitChild(cur, i);
          if (x === cur.keys[i]) { this.dup = true; return; }
          if (x > cur.keys[i]) i++;
        }
        cur = cur.children[i];
      }
    }
    find(x) {
      let cur = this.root; const path = [];
      while (cur) {
        path.push({ id: cur.id, keys: cur.keys.slice() });
        let i = cur.keys.findIndex(k => k >= x);
        if (i >= 0 && cur.keys[i] === x) { this.log.push({ op: 'found', x, block: cur.id, at: i, path }); return { node: cur, i }; }
        if (cur.leaf) { this.log.push({ op: 'miss', x, path }); return null; }
        cur = cur.children[i < 0 ? cur.keys.length : i];
      }
      return null;
    }
    inOrder() {
      const out = [];
      const walk = (node) => {
        if (!node) return;
        for (let i = 0; i < node.keys.length; i++) { walk(node.children[i]); out.push(node.keys[i]); }
        walk(node.children[node.keys.length]);
      };
      walk(this.root);
      return out;
    }
    size() { return this.n; }
    snapshot() {
      const nodes = [];
      const walk = (node, depth) => {
        nodes.push({ id: node.id, keys: node.keys.slice(), children: node.children.map(c => c ? c.id : null), leaf: node.leaf, depth });
        for (const c of node.children) walk(c, depth + 1);
      };
      walk(this.root, 0);
      return { kind: 'btree', nodes, B: this.B };
    }
  }

  /* ---------- exports (browser + node) ---------- */
  const DS = {
    mulberry32, rng, rint, shuffle,
    ArrayStack, ArrayQueue, ArrayDeque, RootishArrayStack, SLList, DLList,
    SkiplistSSet, ChainedHashTable, LinearHashTable, mulHash,
    BST, Treap, RedBlack, RED, BLACK,
    BinaryHeap, MeldableHeap,
    mergeSortSteps, quickSortSteps, heapSortSteps, countingSortSteps, radixSortSteps,
    Graph, BinaryTrie, BTree
  };
  if (typeof window !== 'undefined') window.ULTRON_DS = DS;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_DS = DS;
  if (typeof module !== 'undefined' && module.exports) module.exports = DS;
})();
