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

  /* ---------- exports (browser + node) ---------- */
  const DS = {
    mulberry32, rng, rint, shuffle, ArrayStack, ArrayQueue, ArrayDeque, RootishArrayStack, SLList, DLList
  };
  if (typeof window !== 'undefined') window.ULTRON_DS = DS;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_DS = DS;
  if (typeof module !== 'undefined' && module.exports) module.exports = DS;
})();
