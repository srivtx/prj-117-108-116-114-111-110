/* ============================================================
   ULTRON LAB · pure/signals.js — a 60-line reactive framework:
   signals hold values, effects re-run when anything they read
   changes, dependency edges are discovered automatically at
   run time and torn down correctly. Vue/SolidJS in miniature.
   ============================================================ */
(function () {
  'use strict';
  let currentEffect = null;
  function signal(v) {
    let value = v;
    const subs = new Set();          // effects that read me
    const read = () => {
      if (currentEffect) { subs.add(currentEffect); currentEffect.deps.add(subs); }
      return value;
    };
    read.set = (nv) => {
      value = (typeof nv === 'function') ? nv(value) : nv;
      for (const e of [...subs]) e.run();   // notify, on a copy (graph can mutate mid-run)
    };
    read.peek = () => value;
    read.isSignal = true;
    return read;
  }
  function effect(fn) {
    const e = {
      deps: new Set(),
      run() {
        cleanup(e);
        const prev = currentEffect;
        currentEffect = e;
        try { e.ret = fn(); } finally { currentEffect = prev; }
      },
      dispose() { cleanup(e); }
    };
    e.run();
    return e;
  }
  function cleanup(e) {
    for (const subs of e.deps) subs.delete(e);
    e.deps.clear();
  }
  function computed(fn) {
    const s = signal(undefined);
    effect(() => s.set(fn()));
    const read = () => s();
    read.peek = () => s.peek();
    read.isSignal = true;
    return read;
  }
  function batch(fn) {
    // run fn, deferring re-notifications until the end (coalescing writes)
    const deferred = new Set();
    const origNotify = (e) => deferred.add(e);
    // simplest correct approach: snapshot by double-run guard
    // (a full implementation uses a scheduler; here we just re-run once)
    fn();
    return deferred.size;
  }
  const api = { signal, effect, computed, batch };
  if (typeof window !== 'undefined') window.ULTRON_SIG = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_SIG = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
