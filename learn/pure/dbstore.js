/* ============================================================
   ULTRON LAB · pure/dbstore.js — a tiny database: rows in a
   table, a real B-tree (from learn/ds.js) as the primary-key
   index, and a mini SQL planner that TELLS YOU whether it used
   the index or a full scan. Storage story of W12, made real.
   ============================================================ */
(function () {
  'use strict';
  const DS = (typeof window !== 'undefined' && window.ULTRON_DS) ? window.ULTRON_DS
    : (typeof globalThis !== 'undefined' && globalThis.ULTRON_DS) ? globalThis.ULTRON_DS
      : (typeof require === 'function' ? (() => { try { return require('../ds.js'); } catch (e) { return null; } })() : null);

  const KEYWORDS = new Set(['select', 'from', 'where', 'order', 'by', 'insert', 'into', 'values', 'and', 'desc', 'asc']);
  function lex(sql) {
    const toks = []; let i = 0;
    while (i < sql.length) {
      const c = sql[i];
      if (c === ' ') { i++; continue; }
      if (c === ',' || c === '(' || c === ')' || c === '*' || c === '=') { toks.push({ t: c }); i++; continue; }
      if (c === "'") {
        const j = sql.indexOf("'", i + 1);
        if (j < 0) throw new Error('unterminated string');
        toks.push({ t: 'str', v: sql.slice(i + 1, j) }); i = j + 1; continue;
      }
      if (/[0-9]/.test(c)) { let j = i; while (j < sql.length && /[0-9.]/.test(sql[j])) j++; toks.push({ t: 'num', v: parseFloat(sql.slice(i, j)) }); i = j; continue; }
      if (/[a-z_]/i.test(c)) { let j = i; while (j < sql.length && /[a-z0-9_]/i.test(sql[j])) j++; toks.push({ t: 'word', v: sql.slice(i, j).toLowerCase() }); i = j; continue; }
      throw new Error(`unexpected character "${c}"`);
    }
    return toks;
  }

  class Database {
    constructor(B) {
      this.tables = new Map(); // name → {cols, rows: Map<id, row>, index: BTree, nextId}
      this.B = B || 2;
    }
    create(name, cols) {
      if (this.tables.has(name)) throw new Error('table exists: ' + name);
      this.tables.set(name, { cols: cols.slice(), rows: new Map(), index: new DS.BTree(this.B) });
      return this;
    }
    insert(name, row) {
      const t = this.tables.get(name);
      if (!t) throw new Error('no table: ' + name);
      if (row.length !== t.cols.length) throw new Error(`expected ${t.cols.length} values, got ${row.length}`);
      const id = row[0];
      if (!Number.isInteger(id)) throw new Error('first column must be an integer id (the primary key)');
      if (t.rows.has(id)) throw new Error('duplicate primary key ' + id);
      t.rows.set(id, row);
      t.index.add(id);
      return this;
    }
    /* ---- the planner: decides index scan vs table scan, and says so ---- */
    select(name, opts) {
      const t = this.tables.get(name);
      if (!t) throw new Error('no table: ' + name);
      opts = opts || {};
      let plan = [];
      let rows = [];
      // WHERE
      if (opts.where) {
        const [col, val] = opts.where;
        const ci = t.cols.indexOf(col);
        if (ci < 0) throw new Error('no column: ' + col);
        if (ci === 0) {
          // PRIMARY KEY → B-tree lookup (this is the entire point)
          t.index.find(val);
          const found = t.rows.has(val);
          rows = found ? [t.rows.get(val)] : [];
          const depth = 1 + Math.max(...t.index.snapshot().nodes.map(n => n.depth));
          plan.push(`index scan on pk (${depth} block reads — the B-tree of W12)`);
        } else {
          rows = [];
          let scanned = 0;
          for (const r of t.rows.values()) { scanned++; if (r[ci] === val) rows.push(r); }
          plan.push(`full table scan (${scanned} rows read — no index on ${col})`);
        }
      } else {
        rows = [...t.rows.values()];
        plan.push(`full scan (${rows.length} rows)`);
      }
      // ORDER BY
      if (opts.order) {
        const ci = t.cols.indexOf(opts.order.col);
        if (ci < 0) throw new Error('no column: ' + opts.order.col);
        rows = rows.slice().sort((a, b) => {
          const d = a[ci] < b[ci] ? -1 : a[ci] > b[ci] ? 1 : 0;
          return opts.order.desc ? -d : d;
        });
        plan.push(`sort by ${opts.order.col} (${opts.order.col === 'id' ? 'index order is already sorted — free!' : 'in-memory sort'})`);
      }
      // projection
      if (opts.cols && opts.cols[0] !== '*') {
        const cis = opts.cols.map(c => { const i = t.cols.indexOf(c); if (i < 0) throw new Error('no column: ' + c); return i; });
        rows = rows.map(r => cis.map(i => r[i]));
      } else rows = rows.map(r => r.slice());
      return { rows, plan, cols: (opts.cols && opts.cols[0] !== '*') ? opts.cols : t.cols.slice() };
    }
    /* run a tiny SQL string; returns {rows, plan} or {ok} */
    run(sql) {
      const toks = lex(sql);
      const w = (k) => toks.length && toks[0].t === 'word' && toks[0].v === k;
      const eat = () => toks.shift();
      if (w('insert')) {
        eat(); // insert
        if (!w('into')) throw new Error('expected INTO');
        eat();
        const name = eat().v;
        if (!w('values')) throw new Error('expected VALUES');
        eat();
        if (!toks[0] || toks[0].t !== '(') throw new Error('expected (');
        eat();
        const row = [];
        while (toks.length && toks[0].t !== ')') {
          if (toks[0].t === ',') { eat(); continue; }
          row.push(eat().v);
        }
        this.insert(name, row);
        return { ok: true, msg: 'inserted into ' + name };
      }
      if (w('select')) {
        eat();
        const cols = [];
        if (toks[0] && toks[0].t === '*') { eat(); cols.push('*'); }
        else {
          // identifiers until the FROM keyword
          while (toks.length && !(toks[0].t === 'word' && KEYWORDS.has(toks[0].v))) {
            if (toks[0].t === ',') { eat(); continue; }
            if (toks[0].t === 'word') cols.push(eat().v);
            else throw new Error('unexpected token in column list');
          }
        }
        if (!w('from')) throw new Error('expected FROM');
        eat();
        const name = eat().v;
        let where = null, order = null;
        if (w('where')) {
          eat();
          const col = eat().v;
          if (!toks[0] || toks[0].t !== '=') throw new Error('only = supported in WHERE');
          eat();
          const vtok = eat();
          where = [col, vtok.v];
        }
        if (w('order')) {
          eat(); eat(); // order by
          const col = eat().v;
          const desc = w('desc');
          if (desc) eat();
          order = { col, desc };
        }
        return this.select(name, { cols, where, order });
      }
      throw new Error('I only speak SELECT and INSERT (small dialect, honest engine)');
    }
  }

  const api = { Database, lex };
  if (typeof window !== 'undefined') window.ULTRON_DB = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_DB = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
