/* ============================================================
   ULTRON LAB · solves.js — renders the Solve Hall: the arena
   bank joined with the walkthrough volumes, organized by topic,
   filterable, every card linking back to the arena to practice.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const A = window.ULTRON_ARENA;
  const W = window.ULTRON_WALKS || {};
  const DIFF = { e: ['easy', 'e'], m: ['medium', 'm'], h: ['hard', 'h'] };
  const MOVES = ['Restate', 'The wall', 'The turn', 'The build', 'The check'];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function card(p) {
    const w = W[p.id];
    const el = document.createElement('div');
    el.className = 'prob';
    el.id = 'w-' + p.id;
    const [dname, dcls] = DIFF[p.diff];
    if (!w) {
      el.innerHTML = `<div class="head"><h3>${p.title}</h3><span class="diff ${dcls}">${dname}</span>
        <a class="src" href="../arena/#${p.id}">practice in the arena ↗</a></div>
        <p class="stmt">No walkthrough yet — attempt it, then press for one.</p>`;
      return el;
    }
    el.innerHTML = `
      <div class="head">
        <h3>${p.title}</h3>
        <span class="diff ${dcls}">${dname}</span>
        <a class="src" href="../arena/#${p.id}" title="statement, hints, judge">practice in the arena ↗</a>
        ${p.world ? `<span class="tag">trains ${p.world}</span>` : ''}
      </div>
      <p class="stmt">${p.stmt}</p>
      <div class="walk-moves">
        ${w.steps.map((s, i) => `
          <div class="walk-move">
            <span class="walk-k">${String(i + 1).padStart(2, '0')}</span>
            <div><b class="walk-t">${MOVES[i]}</b><span>${esc(s)}</span></div>
          </div>`).join('')}
      </div>
      <div class="walk-trace"><b>Dry run</b> ${esc(w.trace)}</div>
      <div class="walk-cols">
        <div><b class="walk-t">Edges that break naive code</b>
          <ul>${w.edges.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
        </div>
        <div><b class="walk-t">The interviewer's follow-ups</b>
          <ul>${w.asks.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="walk-transfer"><b>Carry it away</b> ${esc(w.transfer)}</div>
      <div class="complexity" style="margin-top:10px">
        <span class="tag">time ${p.time}</span><span class="tag">space ${p.space}</span>
        ${p.tags.slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
      </div>`;
    return el;
  }

  function render() {
    const host = $('#sh-list');
    let solved = 0;
    A.topics.forEach(t => {
      const probs = A.problems.filter(p => p.topic === t.id);
      if (!probs.length) return;
      solved += probs.filter(p => W[p.id]).length;
      const section = document.createElement('section');
      section.id = 'sec-' + t.id;
      section.innerHTML = `
        <div class="part-head"><h3>${t.name}</h3><span class="tag">${t.world}</span></div>
        <p class="note" style="margin:0 0 14px">${t.blurb} · ${probs.length} solved in the open</p>`;
      probs.forEach(p => section.appendChild(card(p)));
      host.appendChild(section);
    });
    const c = $('#sh-count');
    if (c) c.textContent = solved;
    const hash = location.hash.slice(1);
    if (hash) {
      const target = document.getElementById('w-' + hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function bindFilter() {
    const inp = $('#sh-filter');
    if (!inp) return;
    inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase();
      $$('#sh-list .prob').forEach(el => {
        el.style.display = !q || el.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      $$('#sh-list section').forEach(sec => {
        const any = $$('.prob', sec).some(c => c.style.display !== 'none');
        sec.style.display = any ? '' : 'none';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => { render(); bindFilter(); });
})();
