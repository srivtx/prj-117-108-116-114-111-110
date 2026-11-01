/* ============================================================
   ULTRON LAB · build-labs.js — Build your own X, part 1:
   calculator, git, vim, database. Each lab is a REAL working
   implementation of the pure cores in learn/pure/*.js —
   use it, then understand it, then rebuild it.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_BUILDS = [];
  const $ = (s, el) => (el || document).querySelector(s);
  const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html !== undefined) d.innerHTML = html; return d; };

  function section(title, bodyHtml) {
    return el('div', '', `<h3>${title}</h3>${bodyHtml}`);
  }
  function milestones(list) {
    const wrap = el('div', 'block');
    wrap.appendChild(el('h3', '', 'Build it yourself — the ladder'));
    list.forEach((m, i) => {
      const row = el('div', 'milestone', `<div class="box" role="checkbox" aria-checked="false" tabindex="0"></div><div class="txt"><b>${m[0]}</b><small>${m[1]}</small></div>`);
      const box = $('.box', row);
      const toggle = () => { row.classList.toggle('done'); box.setAttribute('aria-checked', row.classList.contains('done')); if (window.ULTRON_STORY) ULTRON_STORY.toast(row.classList.contains('done') ? 'Milestone done: ' + m[0] : 'Milestone reopened'); };
      box.onclick = toggle;
      box.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* ============================================================
     LAB 1 · A CALCULATOR — tokens → tree → number
     ============================================================ */
  {
    window.ULTRON_BUILDS.push({
      id: 'calc', tab: 'Calculator', minutes: 45,
      title: 'Build a calculator',
      lede: 'Three small machines, one after another: characters become <em>tokens</em>, tokens become a <em>tree</em>, the tree collapses into one number. Precedence is not a rule to memorize — it is the <em>shape</em> of the tree.',
      render(main) {
        main.innerHTML = `
          <div class="prose">
          <h3>Use it first</h3>
          <p>Type any expression. The tree is drawn live from the real parser — click any operator node to hear why it sits where it sits.</p>
          <div class="split">
            <div class="block">
              <input type="text" id="cc-in" value="2+3*(4-1)" style="width:100%;font-size:16px" autocomplete="off">
              <div class="btns">
                <button class="btn" data-ex="2+3*4">2+3*4</button>
                <button class="btn" data-ex="(2+3)*4">(2+3)*4</button>
                <button class="btn" data-ex="2^3^2">2^3^2</button>
                <button class="btn" data-ex="-3^2+10/4">-3^2+10/4</button>
                <button class="btn" data-ex="1+2*3-4/2">1+2*3-4/2</button>
              </div>
              <div id="cc-out" style="font:600 26px var(--f-mono);margin-top:12px"></div>
              <div id="cc-toks" style="font:12px var(--f-mono);color:var(--muted);margin-top:8px"></div>
            </div>
            <div class="block" id="cc-tree" style="min-height:260px"></div>
          </div>
          <h3>How it works — the three machines</h3>
          <div class="cols">
            <div class="block"><h4>1 · Tokenizer</h4><p style="font-size:13px">Characters → words. <code>12</code> is ONE number token, not two digits. Spaces vanish; every other character must justify itself.</p></div>
            <div class="block"><h4>2 · Pratt parser</h4><p style="font-size:13px">Each operator has a <b>binding power</b> (here: <code>+ −</code>=10, <code>* /</code>=20, <code>^</code>=31). Tighter binders sit <b>deeper</b> in the tree — that IS precedence, as geometry.</p></div>
            <div class="block"><h4>3 · Evaluator</h4><p style="font-size:13px">Post-order walk: evaluate children first, apply the operator, bubble one number up. Errors point at real positions.</p></div>
          </div>
          <h3>Feel the geometry</h3>
          <p><b>2+3*4 = 14</b>, not 20 — because <code>*</code> binds tighter and sits <i>deeper</i>, so it evaluates first. Parentheses don't "go first"; they just let a weak binder (<code>+</code>) sit deeper than a strong one. Same engine, different shape.</p>
          <p>And <code>2^3^2</code>: right-associative, so it means 2^(3²) = 512 — the tree leans the other way. One boolean (rightAssoc) changes the whole shape.</p>
          </div>`;
        const inp = $('#cc-in'), out = $('#cc-out'), toksEl = $('#cc-toks'), treeEl = $('#cc-tree');
        function nodeHtml(ast, depth) {
          if (ast.k === 'num') return `<span class="tok-num" style="display:inline-block;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:var(--soft);font:600 13px var(--f-mono)">${ast.v}</span>`;
          if (ast.k === 'var') return `<span class="tok-var" style="display:inline-block;padding:6px 10px;border:1px dashed var(--c2);border-radius:6px;font:600 13px var(--f-mono)">${ast.name}</span>`;
          if (ast.k === 'neg') return `<div style="text-align:center">−<div style="margin-top:4px">${nodeHtml(ast.a, depth + 1)}</div></div>`;
          const kind = ast.k === 'bin' ? ast.op : '·';
          return `<div style="display:inline-block;text-align:center;margin:6px">
            <div style="font:700 15px var(--f-mono);color:var(--c2);border:1px solid var(--c2);border-radius:6px;padding:4px 9px" title="op binds at power ${window.ULTRON_CALC.BP[ast.op] || '?'}">${kind}</div>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:6px">${nodeHtml(ast.a, depth + 1)}${ast.b ? nodeHtml(ast.b, depth + 1) : ''}</div></div>`;
        }
        function go() {
          try {
            const ast = window.ULTRON_CALC.parse(inp.value);
            const v = window.ULTRON_CALC.evaluate(ast);
            out.innerHTML = `<span style="color:var(--ok)">=</span> ${v}`;
            out.style.color = 'var(--ink)';
            toksEl.textContent = 'tokens: ' + window.ULTRON_CALC.tokenize(inp.value).map(t => t.t === 'num' ? t.v : (t.t === 'name' ? t.v : t.t)).join(' · ');
            treeEl.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;min-height:240px;overflow:auto">${nodeHtml(ast, 0)}</div>`;
          } catch (e) {
            out.textContent = '✘ ' + e.message; out.style.color = 'var(--bad)';
            toksEl.textContent = '';
            treeEl.innerHTML = `<p class="note" style="margin:0">${e.message} — real errors with real positions, not a shrug.</p>`;
          }
        }
        inp.oninput = go;
        main.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { inp.value = b.dataset.ex; go(); });
        go();
        const ms = milestones([
          ['Tokenizer', 'Walk the string once; digits accumulate into one number; reject anything unknown with its position. ~20 lines.'],
          ['Tree via binding powers', 'expr(minBP): parse a left side, then while the next operator binds tighter, recurse with a higher floor. The whole Pratt parser is ~25 lines.'],
          ['Evaluator', 'Post-order walk over the tree. Handle neg/pos, division by zero, and unknown names with useful messages.'],
          ['Right-associativity', 'Make ^ lean right with one boolean. Verify 2^3^2 = 512.'],
          ['Variables', 'Accept name tokens; evaluate against an environment object. Congratulations: a spreadsheet engine.']
        ]);
        main.appendChild(section('Rebuild ladder', ''));
        main.lastChild.replaceWith(ms);
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">The identical three machines sit inside every compiler, template engine, JSON parser, SQL planner (next labs), and your browser's CSS engine. You have just built the trunk they all branch from — and the tree you see above is literally an <b>abstract syntax tree</b>.</p><p style="font-size:13.5px">Interview angle: tokenization/parsing questions appear as LC 224 (basic calculator), LC 227, LC 150 (reverse Polish — the tree, flattened).</p>`));
      }
    });
  }

  /* ============================================================
     LAB 2 · YOUR OWN GIT — content-addressed everything
     ============================================================ */
  {
    window.ULTRON_BUILDS.push({
      id: 'git', tab: 'Mini-git', minutes: 60,
      title: 'Build your own git',
      lede: 'Git has exactly one idea: <em>name every object by the hash of its content</em>. Everything else — history, branches, "the working tree" — falls out of that for free. This lab runs a real object database with the real SHA-256.',
      render(main) {
        main.innerHTML = `
          <div class="prose">
          <h3>Use it first</h3>
          <p>Edit files, stage, commit, branch. Watch the object store: it only ever grows, it never stores the same bytes twice, and every commit is just text pointing at other hashes.</p>
          <div class="split">
            <div class="block">
              <h4>Working files</h4>
              <textarea id="gt-file" rows="4" style="width:100%">hello lab</textarea>
              <div class="ctl" style="margin-top:8px"><label>path</label><input type="text" id="gt-path" value="readme.md" style="flex:1"><span></span></div>
              <div class="btns">
                <button class="btn primary" id="gt-add">stage (add)</button>
                <button class="btn" id="gt-commit">commit</button>
                <button class="btn" id="gt-branch">branch + switch</button>
                <button class="btn" id="gt-dedup">dedup demo</button>
                <button class="btn" id="gt-reset">reset</button>
              </div>
              <input type="text" id="gt-msg" placeholder="commit message" value="update" style="width:100%;margin-top:8px">
              <div id="gt-status" style="font:12px var(--f-mono);color:var(--muted);margin-top:8px"></div>
            </div>
            <div class="block">
              <h4>Commits (HEAD → history)</h4>
              <div id="gt-log" style="font:12px var(--f-mono);min-height:70px"></div>
              <h4 style="margin-top:10px">Object store</h4>
              <div id="gt-objs" style="font:12px var(--f-mono);max-height:180px;overflow:auto"></div>
            </div>
          </div>
          <h3>How it works — one idea, three object types</h3>
          <div class="cols">
            <div class="block"><h4>blob</h4><p style="font-size:13px">A file's bytes. Its id = <code>sha256("blob\\0" + content)</code>. Same content anywhere, any time, any repo → <b>same id</b>. That's dedup, integrity and caching in a single move.</p></div>
            <div class="block"><h4>tree</h4><p style="font-size:13px">A directory snapshot: path → blob id (real git nests trees; we keep it flat and honest about it). Two commits that share a file literally point at the same blob.</p></div>
            <div class="block"><h4>commit</h4><p style="font-size:13px">A frozen point in history: one tree + one parent + a message. A branch is nothing but a <b>sticky note with a commit hash on it</b> — which is why branching is free.</p></div>
          </div>
          <p>Notice what is NOT here: no diffs, no deltas, no server. Git's real storage packs objects cleverly, but the <i>semantics</i> are exactly this lab — you now understand rebase/cherry-pick as graph edits, not magic.</p>
          </div>`;
        const G = window.ULTRON_GIT;
        let repo = new G.MiniGit();
        repo.add('readme.md', 'hello lab');
        repo.commit('first commit');
        const fileEl = $('#gt-file'), pathEl = $('#gt-path'), msgEl = $('#gt-msg');
        function refresh() {
          const st = repo.status();
          $('#gt-status').textContent = `on branch ${st.branch} · staged: ${st.staged.join(', ') || '—'} · changed: ${st.changed.join(', ') || '—'}`;
          $('#gt-log').innerHTML = repo.log().map((c, i) =>
            `<div>${i === 0 ? '<b style="color:var(--c2)">● HEAD → ' + st.branch + '</b> ' : ''}<span style="color:var(--ok)">${c.sha}</span> ${c.msg}</div>`
          ).join('') || '<span class="note">no commits yet</span>';
          const counts = { blob: 0, tree: 0, commit: 0 };
          let rows = [];
          for (const [id, o] of repo.objects) {
            counts[o.type]++;
            rows.push(`<div><span style="color:var(--cm)">${o.type.padEnd(6)}</span> ${id.slice(0, 10)}…</div>`);
          }
          $('#gt-objs').innerHTML = `<div class="note" style="margin:0 0 4px">${counts.blob} blobs · ${counts.tree} trees · ${counts.commit} commits — every id is content-hashed</div>` + rows.join('');
        }
        $('#gt-add').onclick = () => { repo.add(pathEl.value, fileEl.value); refresh(); ULTRON_STORY.toast('staged ' + pathEl.value); };
        $('#gt-commit').onclick = () => {
          const sha = repo.commit(msgEl.value || 'update');
          refresh(); ULTRON_STORY.toast('commit ' + sha.slice(0, 8) + ' — a tree + a parent, frozen forever');
        };
        $('#gt-branch').onclick = () => {
          const name = 'feature-' + (repo.branches.size - 1);
          repo.branch(name); repo.checkout(name);
          refresh(); ULTRON_STORY.toast('branched ' + name + ' — just a movable pointer, cost: zero');
        };
        $('#gt-dedup').onclick = () => {
          const before = repo.objects.size;
          const content = fileEl.value;
          repo.add(pathEl.value, content); repo.commit('same content again');
          repo.add('copy-of-' + pathEl.value, content); repo.commit('identical file, different name');
          const grew = repo.objects.size - before;
          refresh();
          ULTRON_STORY.toast(`two commits, one identical file under two names — store grew by ${grew} objects (trees+commits only; the blob was reused)`);
        };
        $('#gt-reset').onclick = () => { repo = new G.MiniGit(); repo.add('readme.md', 'hello lab'); repo.commit('first commit'); refresh(); };
        refresh();
        main.appendChild(milestones([
          ['Hash a blob', 'sha256("blob\\0" + content). Store it in a Map keyed by hash. Re-add the same content: the Map must NOT grow.'],
          ['Freeze a tree', 'Map every staged path to its blob id, hash the whole mapping. That hash IS a directory snapshot.'],
          ['Link commits', 'commit = {tree, parent, msg}. The parent pointer turns a list of snapshots into a DAG of history.'],
          ['Branches as pointers', 'branches: Map<name, commitHash>. checkout = copy the tree\'s blobs back into the working files. Branching costs one Map entry.'],
          ['See the log', 'Walk parent pointers from HEAD. That is `git log` — a linked list walk (World 3, recycled).']
        ]));
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">This is the real architecture: git objects are exactly blob/tree/commit with SHA-1 (plus tags), packed cleverly on disk. Now you can <i>derive</i> why rebase rewrites commits (a commit is immutable — "changing" it means making a new one), why history never forgets (objects are orphaned, not deleted), and why merge conflicts happen (two parents, one tree to produce).</p><p style="font-size:13.5px">Systems-interview angle: content addressing returns in IPFS, Nix, Docker layers, and every build cache ever written.</p>`));
      }
    });
  }

  /* ============================================================
     LAB 3 · YOUR OWN VIM — modes as a state machine
     ============================================================ */
  {
    window.ULTRON_BUILDS.push({
      id: 'vim', tab: 'Mini-vim', minutes: 40,
      title: 'Build your own vim',
      lede: 'Vim is not "hard". Vim is a <em>verb–noun language</em> with a state machine inside — and you can hold the whole machine in your head once you\'ve built one. This lab is a real modal editor whose core is 200 pure, testable lines.',
      render(main) {
        main.innerHTML = `
          <div class="prose">
          <h3>Use it first — click the buffer, then use real keys</h3>
          <div id="vm-screen" class="block" tabindex="0" style="outline:2px solid var(--line);cursor:text">
            <pre id="vm-text" style="margin:0;font:14px/1.5 var(--f-mono);white-space:pre-wrap"></pre>
          </div>
          <div class="btns">
            <span class="chip" id="vm-mode"><i></i><span>NORMAL</span></span>
            <button class="btn" id="vm-reset">reset</button>
            <span class="note" style="margin:0">click above, then type: <code>h j k l w b 0 $ x d d y y p i a o u G g</code> · <code>Esc</code> · <code>: w q</code> · counts like <code>3j</code></span>
          </div>
          <h3>Missions</h3>
          <ol style="font-size:13.5px">
            <li>Jump to the last line (<code>G</code>), then home (<code>g</code> or <code>gg</code> — here <code>g</code>).</li>
            <li>Delete the line with the word "delete" (<code>dd</code>), then bring it back (<code>p</code>).</li>
            <li>Append a line below with your name (<code>o</code>, type, <code>Esc</code>).</li>
            <li>Fix a typo: <code>w</code> to reach it, <code>x</code> to eat letters, <code>i</code> to insert.</li>
            <li>Regret everything: <code>u</code> as many times as it takes.</li>
          </ol>
          <h3>How it works — one state machine, zero special cases</h3>
          <div class="cols">
            <div class="block"><h4>Normal = commands</h4><p style="font-size:13px">Keys are verbs and motions: <code>d</code>+<code>d</code> = delete line, <code>3j</code> = count × motion. Keys never insert text here.</p></div>
            <div class="block"><h4>Insert = typing</h4><p style="font-size:13px">The ONLY mode with text input. <code>Esc</code> is the "back to commands" pedal.</p></div>
            <div class="block"><h4>Command (:) = ex mode</h4><p style="font-size:13px">A mini command line: <code>:w :q :wq</code>. Saves and exits — the state machine's third door.</p></div>
          </div>
          <p>The core is a <b>pure function</b>: <code>(state, key) → (state, events)</code> — no DOM inside. That is why it's testable (the verify script runs it in node) and why the same core could drive a phone app tomorrow. Separation of <i>policy</i> (the machine) from <i>mechanism</i> (the screen) is the real systems lesson.</p>
          <div class="keys">
            <div class="kk"><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd> move</div>
            <div class="kk"><kbd>w</kbd><kbd>b</kbd> word hops</div>
            <div class="kk"><kbd>0</kbd><kbd>$</kbd> line ends</div>
            <div class="kk"><kbd>x</kbd> delete char</div>
            <div class="kk"><kbd>dd</kbd> delete line</div>
            <div class="kk"><kbd>yy</kbd> yank line</div>
            <div class="kk"><kbd>p</kbd> paste</div>
            <div class="kk"><kbd>i</kbd><kbd>a</kbd><kbd>o</kbd> insert modes</div>
            <div class="kk"><kbd>u</kbd> undo</div>
            <div class="kk"><kbd>3j</kbd> counts</div>
            <div class="kk"><kbd>Esc</kbd> back to normal</div>
          </div>
          </div>`;
        const V = window.ULTRON_VIM;
        const START = ['the modal editor lives here.', 'delete this line, then paste it back.', 'vim is a language: verb + noun.', 'insert mode is the only place you type.', 'you are the state machine now.'].join('\n');
        let s = V.createState(START);
        const screen = $('#vm-screen'), textEl = $('#vm-text'), modeEl = $('#vm-mode');
        function render() {
          const lines = s.lines.slice();
          let row = lines[s.row] || '';
          const before = row.slice(0, s.col), after = row.slice(s.col);
          lines[s.row] = before + (s.mode === 'insert' ? '▏' : '▮') + after;
          textEl.textContent = lines.join('\n');
          const m = s.mode === 'insert' ? 'INSERT' : s.mode === 'command' ? 'COMMAND ' + s.cmd : 'NORMAL';
          modeEl.querySelector('span').textContent = m;
          modeEl.querySelector('i').style.background = s.mode === 'insert' ? 'var(--ok)' : s.mode === 'command' ? 'var(--c1)' : 'var(--c4)';
          if (s.lastMsg) ULTRON_STORY.toast(s.lastMsg);
          s.lastMsg = '';
        }
        screen.addEventListener('keydown', e => {
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          e.preventDefault();
          let key = e.key;
          if (key === ' ') key = ' ';
          V.applyKeys(s, [key]);
          render();
        });
        $('#vm-reset').onclick = () => { s = V.createState(START); render(); };
        render();
        main.appendChild(milestones([
          ['State, not strings', 'Model the editor as {lines, row, col, mode}. Every key is a transition on this state. No DOM in the core.'],
          ['Motions first', 'h j k l 0 $ w b — pure cursor functions. Clamp row/col at the edges.'],
          ['Operators = motion + register', 'dd deletes what the cursor sits on into a register; p puts it back. You now have the verb–noun grammar.'],
          ['Counts', 'Digits accumulate in state.pending; every motion multiplies by it. 3j and d3d come free.'],
          ['Undo = push before mutate', 'Snapshot the buffer before every mutating action onto a stack; u pops. History in fifteen lines.']
        ]));
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">Real vim adds registers (a–z), marks, visual mode, macros, text objects (ci"), and regex search — all still state transitions on the same machine. Once modes click, muscle memory becomes <i>language</i> fluency.</p><p style="font-size:13.5px">Interview angle: state machines like this one appear in embedded systems, protocol parsers, game input, and LC 8 (atoi) / lexer problems.</p>`));
      }
    });
  }

  /* ============================================================
     LAB 4 · YOUR OWN DATABASE — a B-tree with a query planner
     ============================================================ */
  {
    window.ULTRON_BUILDS.push({
      id: 'db', tab: 'Mini-sqlite', minutes: 75,
      title: 'Build your own database',
      lede: 'A real (small) database engine: a table, a <em>B-tree primary-key index</em> (World 12, running live), a SQL dialect, and a query planner that <em>tells you</em> whether it used the index or a full scan — the exact decision that runs planet-scale systems.',
      render(main) {
        main.innerHTML = `
          <div class="prose">
          <h3>Use it first — a real REPL</h3>
          <div class="split">
            <div class="block">
              <textarea id="db-sql" rows="3" style="width:100%">SELECT * FROM people WHERE id = 17</textarea>
              <div class="btns">
                <button class="btn primary" id="db-run">run (⏎)</button>
                <button class="btn" data-q="SELECT name, age FROM people WHERE age = 21">query by age</button>
                <button class="btn" data-q="SELECT * FROM people ORDER BY age DESC">order by</button>
                <button class="btn" data-q="INSERT INTO people VALUES (99, 'you', 20)">insert 99</button>
              </div>
              <div id="db-out" class="console" style="margin-top:10px;max-height:230px">—</div>
            </div>
            <div class="block">
              <h4>The index, live (B-tree from W12)</h4>
              <div id="db-tree" style="font:12px var(--f-mono);overflow:auto"></div>
              <div class="btns">
                <button class="btn" id="db-fill">insert 40 random rows</button>
                <button class="btn" id="db-reset">reset table</button>
              </div>
            </div>
          </div>
          <h3>How it works — four layers</h3>
          <div class="cols">
            <div class="block"><h4>1 · Storage</h4><p style="font-size:13px">Rows live in a Map (the "table heap"). Insert order is not query order — real databases keep data in pages on disk.</p></div>
            <div class="block"><h4>2 · Index</h4><p style="font-size:13px">Every primary key also goes into a <b>B-tree</b> — the blocks you see splitting on the right. It answers "is id = 17 present?" in height-many block reads.</p></div>
            <div class="block"><h4>3 · Parser</h4><p style="font-size:13px">The same tokenizer → tree → act pipeline as the calculator (Lab 1), for a tiny SQL dialect: SELECT / INSERT / WHERE = / ORDER BY.</p></div>
            <div class="block"><h4>4 · Planner</h4><p style="font-size:13px">WHERE on the <b>indexed</b> column → B-tree lookup. WHERE on anything else → full scan. The planner PRINTS its choice — the "EXPLAIN" of real engines.</p></div>
          </div>
          <p>Run the <b>query by age</b> button: no index on <code>age</code>, so the engine reads every row — and says so. That is precisely why production databases let you <code>CREATE INDEX</code>… which would just be another B-tree, exactly like the one on screen.</p>
          </div>`;
        const DB = window.ULTRON_DB;
        const names = ['ada', 'grace', 'linus', 'barbara', 'alan', 'edsger', 'radia', 'vint', 'donald', 'leslie'];
        let db;
        function reset() {
          db = new DB.Database(2);
          db.create('people', ['id', 'name', 'age']);
          for (let i = 1; i <= 12; i++) db.insert('people', [i, names[i % names.length], 18 + (i * 7) % 40]);
          drawTree(); $('#db-out').textContent = 'table people(id, name, age) · 12 rows · B-tree index on id';
        }
        function drawTree() {
          const snap = db.tables.get('people').index.snapshot();
          const byDepth = {};
          snap.nodes.forEach(n => (byDepth[n.depth] = byDepth[n.depth] || []).push(n));
          const html = Object.keys(byDepth).sort((a, b) => a - b).map(d =>
            `<div style="display:flex;gap:6px;justify-content:center;margin:6px 0">` +
            byDepth[d].map(n => `<span style="border:2px solid var(--c4);border-radius:6px;padding:2px 6px;background:var(--soft);color:var(--ink)">${n.keys.map(k => k % 1 === 0 ? k : '·').join('·')}</span>`).join('') + `</div>`
          ).join('<div style="text-align:center;color:var(--muted)">│</div>');
          $('#db-tree').innerHTML = html + `<div class="note" style="margin:6px 0 0">${snap.nodes.length} blocks · height ${Math.max(...snap.nodes.map(n => n.depth)) + 1} — every leaf equidistant from the root</div>`;
        }
        function run() {
          const sql = $('#db-sql').value.trim();
          try {
            const r = db.run(sql);
            let out = '';
            if (r.ok !== undefined) out = r.msg;
            else {
              out = `<div style="color:var(--c2);font-weight:600;margin-bottom:4px">QUERY PLAN:</div>` +
                r.plan.map(p => '· ' + p).join('\n') + '\n\n' +
                `<table class="perf"><tr>${r.cols.map(c => `<th>${c}</th>`).join('')}</tr>` +
                r.rows.slice(0, 20).map(row => `<tr>${row.map(c => `<td class="mono">${c}</td>`).join('')}</tr>`).join('') +
                `</table>\n${r.rows.length} row(s)`;
            }
            $('#db-out').innerHTML = out;
            drawTree();
          } catch (e) { $('#db-out').innerHTML = `<span class="bad">✘ ${e.message}</span>`; }
        }
        $('#db-run').onclick = run;
        main.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { $('#db-sql').value = b.dataset.q; run(); });
        $('#db-sql').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });
        $('#db-fill').onclick = () => {
          let added = 0;
          for (let k = 0; k < 40; k++) {
            const id = 13 + Math.floor(Math.random() * 500);
            try { db.insert('people', [id, names[id % names.length], 18 + (id * 7) % 50]); added++; } catch (e) { }
          }
          drawTree(); ULTRON_STORY.toast(added + ' rows inserted — watch the B-tree split to stay balanced');
          $('#db-out').textContent = 'table people · ' + db.tables.get('people').rows.size + ' rows total';
        };
        $('#db-reset').onclick = reset;
        reset();
        main.appendChild(milestones([
          ['A table is a Map', 'id → row. Support insert (reject duplicate ids — the primary key contract) and full scan. You have a CSV with dignity.'],
          ['Index it with a B-tree', 'Insert every id into a B-tree of block size B. Lookup = root-to-leaf walk. You already built the B-tree in W12 — reuse it.'],
          ['Parse tiny SQL', 'Tokenizer (Lab 1) + a hand-rolled recursive parser for SELECT cols FROM t [WHERE c = v] [ORDER BY c [DESC]]. ~60 lines.'],
          ['The planner', 'WHERE on an indexed column → index scan. Else full scan. Print the choice. Congratulations: you understand EXPLAIN.'],
          ['Order from the index', 'ORDER BY the primary key should be FREE — the B-tree already iterates sorted. (In-order leaf walk, W12 again.)']
        ]));
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">Real SQLite: the entire database is one file of B-tree pages; every table and index is a B-tree; <code>EXPLAIN QUERY PLAN</code> prints exactly what this lab prints. Postgres adds heap tables, MVCC, and a cost-based planner — but the index story you just built is unchanged.</p><p style="font-size:13.5px">Interview angle: "why is my query slow?" is index reasoning — and it's nearly always the WHERE/ORDER BY column lacking a B-tree.</p>`));
      }
    });
  }
})();
