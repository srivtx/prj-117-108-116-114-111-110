/* ============================================================
   ULTRON LAB · pure/parser.js — a calculator engine in three
   machines: tokenizer → Pratt parser → tree evaluator.
   Precedence is the SHAPE of the tree, not a rule you memorize.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- machine 1: characters → tokens ---------- */
  function tokenize(src) {
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === ' ') { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < src.length && /[0-9.]/.test(src[j])) j++;
        const text = src.slice(i, j);
        if ((text.match(/\./g) || []).length > 1) throw new SyntaxError(`bad number "${text}" at ${i}`);
        tokens.push({ t: 'num', v: parseFloat(text), pos: i });
        i = j; continue;
      }
      if (/[a-z]/i.test(c)) {
        let j = i;
        while (j < src.length && /[a-z0-9]/i.test(src[j])) j++;
        tokens.push({ t: 'name', v: src.slice(i, j), pos: i });
        i = j; continue;
      }
      if ('+-*/^()%,'.includes(c)) { tokens.push({ t: c, pos: i }); i++; continue; }
      throw new SyntaxError(`unexpected character "${c}" at ${i}`);
    }
    return tokens;
  }

  /* ---------- machine 2: tokens → tree (precedence climbing) ---------- */
  // binding powers: higher binds tighter (sits DEEPER in the tree)
  const BP = { '+': 10, '-': 10, '*': 20, '/': 20, '%': 20, '^': 31 };
  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const eat = t => { if (toks[p] && (t === undefined || toks[p].t === t)) return toks[p++]; return null; };
    function expr(minBP) {
      let lhsTok = eat() || peek();
      let left;
      if (lhsTok.t === 'num') left = { k: 'num', v: lhsTok.v };
      else if (lhsTok.t === 'name') left = { k: 'var', name: lhsTok.v };
      else if (lhsTok.t === '-') left = { k: 'neg', a: expr(30) };       // unary minus
      else if (lhsTok.t === '+') left = { k: 'pos', a: expr(30) };       // unary plus
      else if (lhsTok.t === '(') {
        left = expr(0);
        if (!eat(')')) throw new SyntaxError('missing ) near ' + (toks[p] ? 'position ' + toks[p].pos : 'end of input'));
      } else throw new SyntaxError(`unexpected "${lhsTok.t}" at ${lhsTok.pos}`);
      while (true) {
        const op = peek();
        if (!op || BP[op.t] === undefined) break;
        const rightAssoc = op.t === '^';
        const bp = BP[op.t];
        if (bp < minBP || (bp === minBP && !rightAssoc)) break;
        p++;
        const rhs = expr(rightAssoc ? bp : bp + 1);
        left = { k: 'bin', op: op.t, a: left, b: rhs };
      }
      return left;
    }
    const ast = expr(0);
    if (p < toks.length) throw new SyntaxError(`unexpected "${toks[p].t}" at ${toks[p].pos}`);
    return ast;
  }

  /* ---------- machine 3: tree → number ---------- */
  function evaluate(ast, env) {
    env = env || {};
    switch (ast.k) {
      case 'num': return ast.v;
      case 'var': {
        if (ast.name in env) return env[ast.name];
        throw new ReferenceError(`unknown name "${ast.name}"`);
      }
      case 'neg': return -evaluate(ast.a, env);
      case 'pos': return evaluate(ast.a, env);
      case 'bin': {
        const a = evaluate(ast.a, env), b = evaluate(ast.b, env);
        switch (ast.op) {
          case '+': return a + b; case '-': return a - b;
          case '*': return a * b; case '/': return a / b;
          case '%': return a % b;
          case '^': return Math.pow(a, b);
        }
      }
    }
    throw new Error('bad ast');
  }

  /* ---------- utilities for the visual lab ---------- */
  function depthOf(ast) { return ast ? 1 + Math.max(depthOf(ast.a || null), depthOf(ast.b || null)) : 0; }
  function prefixOf(ast) { // root-first listing, for stepping through
    if (!ast) return [];
    if (ast.k === 'num') return [String(ast.v)];
    if (ast.k === 'var') return [ast.name];
    if (ast.k === 'neg' || ast.k === 'pos') return [(ast.k === 'neg' ? '-' : '+') + '·', ...prefixOf(ast.a)];
    return [ast.op, ...prefixOf(ast.a), ...prefixOf(ast.b)];
  }
  function calc(src, env) { return evaluate(parse(src), env); }

  const api = { tokenize, parse, evaluate, calc, depthOf, prefixOf, BP };
  if (typeof window !== 'undefined') window.ULTRON_CALC = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_CALC = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
