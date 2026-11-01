/* ============================================================
   ULTRON LAB · story.js — the teaching loop every world runs:
   say → your turn (wait for the real thing) → predict → name it.
   Plus the notebook, the quiz drawer and story progress, all in
   localStorage. Same DNA as Voxel Network Lab's story engine.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];

  /* ---------- persistent state ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  let collected = new Set(store.get('ultron-notes', []));
  let progress = store.get('ultron-progress', { done: [] });
  if (!Array.isArray(progress.done)) progress.done = [];

  /* ---------- registry: notes + quiz questions per world ---------- */
  const NOTES = [];   // {w, id, t, d}
  const QUIZ = [];    // {w, q, opts:[..], a:index, x:'explanation'}

  function defineNotes(list) { for (const n of list) NOTES.push(n); }
  function defineQuiz(list) { for (const q of list) QUIZ.push(q); }
  function worldTitle(w) {
    const el = document.querySelector(`.tabs button[data-w="${w}"]`);
    return el ? el.textContent.trim().replace(/^\S+\s/, '') : w;
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------- notebook ---------- */
  function nbCount() {
    const b = $('#nb-count');
    if (b) { b.textContent = collected.size; b.classList.toggle('zero', collected.size === 0); }
  }
  function learn(id) {
    if (collected.has(id)) return;
    const n = NOTES.find(x => x.id === id);
    if (!n) return;
    collected.add(id);
    store.set('ultron-notes', [...collected]);
    nbCount();
    toast('New in your notebook: ' + n.t);
  }
  function nbOpen() {
    const el = $('#nb'); if (!el) return;
    const byWorld = {};
    for (const n of NOTES) (byWorld[n.w] = byWorld[n.w] || []).push(n);
    let h = `<div class="nb-head"><h2>Your notebook</h2><button class="g-x" id="nb-x">Close</button></div>
      <p class="note" style="margin:0">Every idea you meet in a story lands here, in plain words.
      <b>${collected.size} of ${NOTES.length}</b> collected.</p>
      <div class="btns" style="margin:0"><button class="btn primary" id="nb-quiz">Quiz me</button></div>`;
    for (const w of Object.keys(byWorld)) {
      h += `<div class="nb-ch"><h3>${worldTitle(w)}</h3>` + byWorld[w].map(n =>
        collected.has(n.id)
          ? `<div class="nb-t"><b>${n.t}</b><span>${n.d}</span></div>`
          : `<div class="nb-t locked"><b>Locked</b><span>Play the ${worldTitle(w)} story to unlock</span></div>`
      ).join('') + `</div>`;
    }
    el.innerHTML = h; el.hidden = false;
    $('#nb-x').onclick = () => { el.hidden = true; };
    $('#nb-quiz').onclick = quizStart;
  }

  /* ---------- quiz me (only worlds you've collected ideas from) ---------- */
  const QZ = { list: [], i: 0, score: 0, picked: null };
  function quizStart() {
    const playedW = new Set([...collected].map(id => (NOTES.find(n => n.id === id) || {}).w).filter(Boolean));
    const pool = QUIZ.filter(q => playedW.has(q.w));
    if (!pool.length) { quizRenderEmpty(); return; }
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    QZ.list = pool.slice(0, 6); QZ.i = 0; QZ.score = 0; QZ.picked = null;
    quizRender();
  }
  function quizRenderEmpty() {
    const el = $('#nb'); el.innerHTML = `<div class="nb-head"><h2>Quiz me</h2><button class="g-x" id="nb-x">Back</button></div>
      <p class="note">Finish at least one story first; the quiz only asks about worlds you've played.</p>`;
    el.hidden = false;
    $('#nb-x').onclick = nbOpen;
  }
  function quizRender() {
    const el = $('#nb');
    if (QZ.i >= QZ.list.length) {
      el.innerHTML = `<div class="nb-head"><h2>Quiz me</h2><button class="g-x" id="nb-x">Back</button></div>
        <p class="qz-score">${QZ.score} / ${QZ.list.length}</p>
        <p class="note">${QZ.score === QZ.list.length ? 'Every one right. The ideas are sticking.' : 'Missed ones are worth replaying — open that world and press “Play the guided story”.'}</p>
        <div class="btns"><button class="btn primary" id="qz-again">Another round</button></div>`;
      el.hidden = false;
      $('#nb-x').onclick = nbOpen;
      $('#qz-again').onclick = quizStart;
      return;
    }
    const q = QZ.list[QZ.i];
    el.innerHTML = `<div class="nb-head"><h2>Quiz me · ${QZ.i + 1} of ${QZ.list.length}</h2><button class="g-x" id="nb-x">Back</button></div>
      <p class="qz-q">${q.q}</p>
      ${q.opts.map((o, k) => `<button class="qz-opt ${QZ.picked === null ? '' : k === q.a ? 'reveal' : ''} ${QZ.picked === k ? (k === q.a ? 'pick-r' : 'pick-w') : ''}" data-q="${k}">${o}</button>`).join('')}
      ${QZ.picked !== null ? `<p class="qz-x">${q.x}</p><div class="btns"><button class="btn primary" id="qz-next">${QZ.i === QZ.list.length - 1 ? 'Finish' : 'Next'}</button></div>` : ''}`;
    el.hidden = false;
    $('#nb-x').onclick = nbOpen;
    el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
      if (QZ.picked !== null) return;
      QZ.picked = +b.dataset.q;
      if (QZ.picked === q.a) QZ.score++;
      quizRender();
    });
    const nx = $('#qz-next'); if (nx) nx.onclick = () => { QZ.i++; QZ.picked = null; quizRender(); };
  }

  /* ---------- progress ---------- */
  function markDone(w) {
    if (!progress.done.includes(w)) progress.done.push(w);
    store.set('ultron-progress', progress);
    refreshTabs();
    toast(`Story complete · ${progress.done.length} of ${NOTES.reduce((s, n, i, arr) => s + (arr.findIndex(x => x.w === n.w) === i ? 1 : 0), 0)} worlds done`);
  }
  function refreshTabs() {
    $$('.tabs button[data-w]').forEach(b => b.classList.toggle('done', progress.done.includes(b.dataset.w)));
  }

  /* ============================================================
     The story player
     ============================================================ */
  const S = { tour: null, i: 0, world: null, poll: null, onExit: null };

  function start(world, tour) {
    S.world = world; S.tour = tour; S.i = 0;
    const el = $('#guide');
    el.hidden = false;
    render();
  }
  function stop() {
    S.tour = null;
    clearInterval(S.poll);
    if (window.ULTRON_SIM && window.ULTRON_SIM.clearPicks) window.ULTRON_SIM.clearPicks();
    const el = $('#guide'); if (el) el.hidden = true;
    if (S.onExit) { const f = S.onExit; S.onExit = null; f(); }
  }
  function render() {
    clearInterval(S.poll);
    const el = $('#guide');
    const t = S.tour, i = S.i, step = t.steps[i];
    if (!step) return stop();
    const dots = t.steps.map((_, k) =>
      k === i ? `<i class="now"></i>`
        : (k < i || t.steps[k].seen)
          ? `<button class="gd ${k < i ? 'past' : 'ahead'}" data-d="${k}" aria-label="Go to step ${k + 1}"></button>`
          : `<i class=""></i>`
    ).join('');
    el.innerHTML = `
      <div class="g-head">
        <div><span class="g-eye">Story · ${t.title}</span><b class="g-title">${t.subtitle || ''}</b></div>
        <button class="g-x" id="g-x">Explore freely</button>
      </div>
      <div class="g-dots">${dots}</div>
      <div class="g-say" id="g-say"></div>
      <div id="g-extra"></div>
      <div class="g-next" id="g-next"></div>`;
    $('#g-x').onclick = stop;
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { t.steps[i].seen = true; S.i = +b.dataset.d; render(); });

    const say = typeof step.say === 'function' ? step.say() : step.say;
    $('#g-say').innerHTML = say;
    step.seen = true;
    if (step.learn) for (const id of step.learn) learn(id);
    if (step.reset) step.reset();

    const extra = $('#g-extra');
    const next = $('#g-next');
    const isLast = i === t.steps.length - 1;

    const nextBtn = () => {
      next.innerHTML = `<button class="btn primary" id="g-fwd">${isLast ? 'Finish ✓' : 'Next →'}</button>`;
      $('#g-fwd').onclick = () => {
        if (isLast) { markDone(S.world); stop(); }
        else { S.i++; render(); }
      };
    };

    if (step.predict) {
      const p = step.predict;
      extra.insertAdjacentHTML('beforeend', `
        <div class="predict">
          <div class="g-task"><span class="tag">Predict first</span><br>${p.q}</div>
          <div class="p-in">
            <input type="text" id="p-in" placeholder="${p.placeholder || 'your guess…'}" autocomplete="off">
            <button class="btn primary" id="p-go">Lock it in</button>
          </div>
          <div id="p-verdict"></div>
        </div>`);
      const go = () => {
        const v = $('#p-verdict');
        const ans = $('#p-in').value.trim();
        if (!ans) { $('#p-in').focus(); return; }
        const r = p.grade(ans);
        v.innerHTML = `<div class="verdict ${r.right ? 'right' : 'wrong'}">${r.right ? '✔ ' : '✘ '}${r.msg}</div>`;
        if (r.right) nextBtn();
        else { $('#p-in').focus(); $('#p-in').select(); }
      };
      $('#p-go').onclick = go;
      $('#p-in').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      $('#p-in').focus();
      if (step.task) addTask(step, extra);
      return; // next appears only after a right prediction
    }

    if (step.task) addTask(step, extra);

    if (step.wait) {
      extra.insertAdjacentHTML('beforeend', `<div id="g-wait"><span class="tag" style="display:none"></span></div>`);
      let done = false;
      S.poll = setInterval(() => {
        if (!S.tour) return clearInterval(S.poll);
        if (!done && step.wait()) {
          done = true;
          clearInterval(S.poll);
          if (step.okText) {
            extra.insertAdjacentHTML('beforeend', `<div class="g-ok">${typeof step.okText === 'function' ? step.okText() : step.okText}</div>`);
          }
          nextBtn();
        }
      }, 350);
    } else {
      nextBtn();
    }
    // space also advances (when a next button exists)
  }

  function addTask(step, extra) {
    extra.insertAdjacentHTML('beforeend', `
      <div class="g-task"><span class="tag">Your turn</span><br>${step.task}
        ${step.hint ? `<div><button class="btn" id="g-hint" style="margin-top:8px">Hint</button><div class="g-hint" id="g-hint-t" hidden>${step.hint}</div></div>` : ''}
      </div>`);
    const hb = $('#g-hint');
    if (hb) hb.onclick = () => { const h = $('#g-hint-t'); h.hidden = !h.hidden; };
  }

  /* ---------- keyboard: arrows move through a story ---------- */
  document.addEventListener('keydown', e => {
    if (!S.tour || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') { const b = $('#g-fwd'); if (b) b.click(); }
    if (e.key === 'ArrowLeft') { if (S.i > 0) { S.i--; render(); } }
  });

  window.ULTRON_STORY = {
    defineNotes, defineQuiz, learn, start, stop, markDone, toast,
    open: nbOpen, quizStart, refreshTabs,
    progress: () => progress, collected: () => collected
  };
})();
