/* ============================================================
   ULTRON LAB · arena.js — renders the question bank and runs
   the practice judge: your JavaScript, executed against real
   tests, in this browser, right now. No accounts, no servers.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const A = window.ULTRON_ARENA;
  const DIFF = { e: ['easy', 'e'], m: ['medium', 'm'], h: ['hard', 'h'] };

  function deepEq(a, b, ordered) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      if (!ordered) { a = a.slice().map(x => JSON.stringify(x)).sort(); b = b.slice().map(x => JSON.stringify(x)).sort(); }
      return a.every((v, i) => v === b[i] || deepEq(JSON.parse(v), JSON.parse(b[i]), true));
    }
    if (a && b && typeof a === 'object') {
      const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
      return ka.length === kb.length && ka.every((k, i) => k === kb[i] && deepEq(a[k], b[k], ordered));
    }
    return false;
  }

  function starterFor(p) {
    const args = (p.run.args || []).join(', ');
    return `function ${p.run.fn}(${args}) {\n  // ${p.hints[0]}\n  \n}`;
  }

  function problemCard(p) {
    const card = document.createElement('div');
    card.className = 'prob';
    card.id = p.id;
    const [dname, dcls] = DIFF[p.diff];
    card.innerHTML = `
      <div class="head">
        <h3>${p.title}</h3>
        <span class="diff ${dcls}">${dname}</span>
        <a class="src" href="${p.src.startsWith('LC') ? 'https://leetcode.com/problems/' + p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '/' : 'https://codeforces.com/problemset/problem/' + p.src.slice(3).replace('A', '/A')}" target="_blank" rel="noopener" title="the original problem">${p.src} ↗</a>
        ${p.world ? `<span class="tag">trains ${p.world}</span>` : ''}
      </div>
      <p class="stmt">${p.stmt}</p>
      <div class="hints">
        <button>Hint 1</button><button>Hint 2</button><button>Hint 3 (the key)</button>
        <a class="walk-link" href="../solves/#${p.id}" title="the five-move walkthrough: restate, the wall, the turn, the build, the check">full walkthrough ↗</a>
      </div>
      <details class="sol"><summary>💬 Approach &amp; complexity</summary>
        <div class="inner">
          <p style="margin:0 0 8px;font-size:13px">${p.approach}</p>
          <div class="complexity">
            <span class="tag">time ${p.time}</span><span class="tag">space ${p.space}</span>
            ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      </details>
      <details class="sol"><summary>⌨ Solution (JavaScript)</summary>
        <div class="inner"><pre>${p.code.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre></div>
      </details>`;
    const hb = $$('.hints button', card);
    p.hints.forEach((h, i) => {
      hb[i].onclick = () => {
        const existing = $(`.hints .h[data-k="${i}"]`, card);
        if (existing) { existing.remove(); return; }
        const div = document.createElement('div');
        div.className = 'h'; div.dataset.k = i;
        div.innerHTML = `<b>${i + 1}</b>${h}`;
        card.insertBefore(div, hb[i].nextSibling);
      };
    });
    if (p.run) {
      const run = document.createElement('details');
      run.className = 'sol';
      run.innerHTML = `
        <summary>⚡ Practice it here — write the function, run the tests</summary>
        <div class="inner">
          <div class="editor"><textarea spellcheck="false">${starterFor(p)}</textarea></div>
          <div class="btns">
            <button class="btn primary run-btn">▶ run tests</button>
            <span class="note" style="margin:0">runs in this tab — the judge is ~20 lines of honest JavaScript</span>
          </div>
          <div class="console out" style="margin-top:10px">write your solution above, then run.</div>
        </div>`;
      card.appendChild(run);
      const btn = $('.run-btn', run);
      btn.onclick = () => {
        const out = $('.out', run);
        const code = $('textarea', run).value;
        let fn;
        try { fn = new Function(code + `\nreturn ${p.run.fn};`)(); }
        catch (e) { out.innerHTML = `<span class="bad">✘ ${e.message}</span>`; return; }
        if (typeof fn !== 'function') { out.innerHTML = `<span class="bad">✘ no function named ${p.run.fn} found</span>`; return; }
        let pass = 0;
        const lines = p.run.tests.map((t, i) => {
          try {
            const got = fn(...JSON.parse(JSON.stringify(t.in)));
            const ok = deepEq(got, t.out, p.run.orderMatters !== false);
            if (ok) pass++;
            return `<div class="testline"><span class="st ${ok ? 'ok' : 'bad'}">${ok ? '✔' : '✘'}</span> test ${i + 1}: got <b>${JSON.stringify(got)}</b>${ok ? '' : ` — want <b>${JSON.stringify(t.out)}</b>`}</div>`;
          } catch (e) {
            return `<div class="testline"><span class="st bad">✘</span> test ${i + 1}: threw ${e.message}</div>`;
          }
        }).join('');
        out.innerHTML = `<div class="testline"><span class="st ${pass === p.run.tests.length ? 'ok' : 'bad'}">${pass === p.run.tests.length ? '✔' : '✘'}</span><b>${pass}/${p.run.tests.length} passed</b></div>` + lines;
      };
    }
    return card;
  }

  function render() {
    const host = $('#arena-list');
    const hash = location.hash.slice(1);
    A.topics.forEach(t => {
      const probs = A.problems.filter(p => p.topic === t.id);
      if (!probs.length) return;
      const section = document.createElement('section');
      section.id = t.id;
      section.innerHTML = `
        <div class="part-head"><h3>${t.name}</h3><span class="tag">${t.world}</span></div>
        <p class="note" style="margin:0 0 14px">${t.blurb} · ${probs.length} problems</p>`;
      probs.forEach(p => section.appendChild(problemCard(p)));
      host.appendChild(section);
    });
    if (hash) {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* filter bar */
  function bindFilter() {
    const inp = $('#arena-filter');
    if (!inp) return;
    inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase();
      $$('#arena-list .prob').forEach(card => {
        const hit = !q || card.textContent.toLowerCase().includes(q);
        card.style.display = hit ? '' : 'none';
      });
      $$('#arena-list section').forEach(sec => {
        const any = $$('.prob', sec).some(c => c.style.display !== 'none');
        sec.style.display = any ? '' : 'none';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => { render(); bindFilter(); });
})();
