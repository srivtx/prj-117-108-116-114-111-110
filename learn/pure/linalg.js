/* ============================================================
   ULTRON LAB · pure/linalg.js — a small math engine: vectors,
   matrices, Gaussian elimination with pivoting, determinant.
   The same elimination steps are recorded for the visual lab.
   ============================================================ */
(function () {
  'use strict';
  class Mat {
    constructor(rows) {
      this.m = rows.map(r => r.slice());
      this.rows = this.m.length;
      this.cols = this.rows ? this.m[0].length : 0;
    }
    static zeros(r, c) { return new Mat(Array.from({ length: r }, () => new Array(c).fill(0))); }
    static identity(n) {
      const M = Mat.zeros(n, n);
      for (let i = 0; i < n; i++) M.m[i][i] = 1;
      return M;
    }
    get(i, j) { return this.m[i][j]; }
    set(i, j, v) { this.m[i][j] = v; }
    add(B) { return new Mat(this.m.map((r, i) => r.map((v, j) => v + B.m[i][j]))); }
    sub(B) { return new Mat(this.m.map((r, i) => r.map((v, j) => v - B.m[i][j]))); }
    scale(s) { return new Mat(this.m.map(r => r.map(v => v * s))); }
    mul(B) {
      if (this.cols !== B.rows) throw new Error(`shape mismatch ${this.rows}x${this.cols} · ${B.rows}x${B.cols}`);
      const out = Array.from({ length: this.rows }, () => new Array(B.cols).fill(0));
      for (let i = 0; i < this.rows; i++)
        for (let k = 0; k < this.cols; k++) {
          const a = this.m[i][k];
          if (a === 0) continue;
          for (let j = 0; j < B.cols; j++) out[i][j] += a * B.m[k][j]; // the i-k-j loop order real BLAS uses (cache!)
        }
      return new Mat(out);
    }
    transpose() { return new Mat(this.m[0].map((_, j) => this.m.map(r => r[j]))); }
    map(f) { return new Mat(this.m.map(r => r.map(f))); }
    clone() { return new Mat(this.m); }
    /* Gaussian elimination with partial pivoting; records every step */
    solve(b, record) {
      if (this.rows !== this.cols) throw new Error('solve: square only');
      const n = this.rows;
      const A = this.clone().m;
      const x = b.slice();
      const steps = [];
      const rec = (s) => { if (record) steps.push(s); };
      // forward: clear below the diagonal
      for (let col = 0; col < n; col++) {
        // pick the biggest pivot in this column (numerical honesty)
        let best = col;
        for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[best][col])) best = r;
        if (Math.abs(A[best][col]) < 1e-12) throw new Error('singular matrix');
        if (best !== col) {
          [A[col], A[best]] = [A[best], A[col]];
          [x[col], x[best]] = [x[best], x[col]];
          rec({ t: 'swap', i: col, j: best });
        }
        for (let r = col + 1; r < n; r++) {
          const f = A[r][col] / A[col][col];
          for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
          x[r] -= f * x[col];
          rec({ t: 'eliminate', pivot: col, row: r, factor: f });
        }
        rec({ t: 'pivot', i: col, v: A[col][col] });
      }
      // back-substitution
      for (let r = n - 1; r >= 0; r--) {
        for (let c = r + 1; c < n; c++) x[r] -= A[r][c] * x[c];
        x[r] /= A[r][r];
        rec({ t: 'back', i: r, v: x[r] });
      }
      return record ? { x, steps } : x;
    }
    det() {
      const n = this.rows;
      const A = this.clone().m;
      let det = 1;
      for (let col = 0; col < n; col++) {
        let best = col;
        for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[best][col])) best = r;
        if (Math.abs(A[best][col]) < 1e-12) return 0;
        if (best !== col) { [A[col], A[best]] = [A[best], A[col]]; det = -det; }
        det *= A[col][col];
        for (let r = col + 1; r < n; r++) {
          const f = A[r][col] / A[col][col];
          for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
        }
      }
      return det;
    }
    toString() { return this.m.map(r => r.map(v => String(Math.round(v * 100) / 100).padStart(6)).join('')).join('\n'); }
  }
  const vec = {
    dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
    len: a => Math.sqrt(vec.dot(a, a)),
    sub: (a, b) => a.map((v, i) => v - b[i]),
    add: (a, b) => a.map((v, i) => v + b[i]),
    scale: (a, s) => a.map(v => v * s)
  };
  const api = { Mat, vec };
  if (typeof window !== 'undefined') window.ULTRON_LIN = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_LIN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
