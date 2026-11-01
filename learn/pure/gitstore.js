/* ============================================================
   ULTRON LAB · pure/gitstore.js — a content-addressed object
   store, the actual heart of git: blobs, trees, commits,
   branches, staging. Nothing here knows about the DOM.
   ============================================================ */
(function () {
  'use strict';
  const sha = (typeof window !== 'undefined' && window.ULTRON_SHA256) ? window.ULTRON_SHA256.sha256
    : (typeof globalThis !== 'undefined' && globalThis.ULTRON_SHA256) ? globalThis.ULTRON_SHA256.sha256 : null;

  class MiniGit {
    constructor(hashFn) {
      this.hash = hashFn
        || (typeof window !== 'undefined' && window.ULTRON_SHA256 ? window.ULTRON_SHA256.sha256 : null)
        || (typeof globalThis !== 'undefined' && globalThis.ULTRON_SHA256 ? globalThis.ULTRON_SHA256.sha256 : null);
      if (!this.hash && typeof require === 'function') {
        try { this.hash = require('./sha256.js').sha256; } catch (e) { /* not resolvable */ }
      }
      if (!this.hash) throw new Error('sha256 module not loaded');
      this.objects = new Map();   // sha → {type, data}
      this.index = new Map();     // path → content (the staging area)
      this.branches = new Map();  // name → commit sha
      this.branches.set('main', null);
      this.HEAD = 'main';
      this.clock = 0;
    }
    /* ---- object database: content-addressed, immutable, dedup ---- */
    writeObject(type, data) {
      // The sha is computed OVER a type-prefixed serialization — exactly git's trick,
      // so "blob 42" and "commit 42" never collide.
      const body = type === 'blob' ? String(data)
        : type === 'tree' ? JSON.stringify(data)
          : JSON.stringify(data);
      const store = type + '\u0000' + body;
      const id = this.hash(store);
      if (!this.objects.has(id)) this.objects.set(id, { type, data, body });
      return id;
    }
    read(id) { return this.objects.get(id) || null; }

    /* ---- staging ---- */
    add(path, content) { this.index.set(path, content); return this; }
    rm(path) { this.index.delete(path); return this; }
    status() {
      const headCommit = this.branches.get(this.HEAD);
      // commit → tree sha → tree data (the path→blob map); two derefs, read carefully
      const headTree = headCommit ? this.read(this.read(headCommit).data.tree).data : {};
      const staged = [], changed = [], removed = [];
      for (const [p, c] of this.index) {
        if (!(p in headTree)) staged.push(p);
        else if (this.read(headTree[p]).data !== c) changed.push(p);
      }
      for (const p of Object.keys(headTree)) if (!this.index.has(p)) removed.push(p);
      return { branch: this.HEAD, staged, changed, removed };
    }

    /* ---- commits: freeze the index into a tree, link to parent ---- */
    commit(msg) {
      const treeData = {};
      for (const [p, c] of this.index) treeData[p] = this.writeObject('blob', c);
      const treeId = this.writeObject('tree', treeData);
      const parent = this.branches.get(this.HEAD);
      const commitData = { tree: treeId, parent, msg: msg || '', time: ++this.clock, author: 'you' };
      const commitId = this.writeObject('commit', commitData);
      this.branches.set(this.HEAD, commitId);
      return commitId;
    }
    treeOf(commitId) {
      const c = this.read(commitId);
      return c ? this.read(c.data.tree).data : {};
    }
    snapshot() { // files at HEAD (or staged if no commits)
      const head = this.branches.get(this.HEAD);
      if (!head) return { ...Object.fromEntries(this.index) };
      const tree = this.treeOf(head);
      const out = {};
      for (const [p, id] of Object.entries(tree)) out[p] = this.read(id).data;
      return out;
    }

    /* ---- branches ---- */
    branch(name) { this.branches.set(name, this.branches.get(this.HEAD)); return this; }
    checkout(name) {
      if (!this.branches.has(name)) throw new Error('no branch: ' + name);
      this.HEAD = name;
      // restore the index from that branch's tree (files on disk ← commit)
      this.index = new Map(Object.entries(this.snapshot()));
      return this;
    }
    log() {
      const out = [];
      let id = this.branches.get(this.HEAD);
      while (id) {
        const o = this.read(id);
        out.push({ sha: id.slice(0, 8), msg: o.data.msg, time: o.data.time });
        id = o.data.parent;
      }
      return out;
    }
    /* how many objects does history cost? (the dedup story) */
    stats() {
      let blobs = 0, trees = 0, commits = 0;
      for (const o of this.objects.values()) {
        if (o.type === 'blob') blobs++; else if (o.type === 'tree') trees++; else commits++;
      }
      return { blobs, trees, commits, total: this.objects.size };
    }
  }

  const api = { MiniGit };
  if (typeof window !== 'undefined') window.ULTRON_GIT = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_GIT = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
