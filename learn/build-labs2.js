/* ============================================================
   ULTRON LAB · build-labs2.js — Build your own X, part 2:
   math engine, software renderer, reactive framework, and a
   neural network with real backpropagation.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_BUILDS2 = [];
  const $ = (s, el) => (el || document).querySelector(s);
  const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html !== undefined) d.innerHTML = html; return d; };
  function section(title, bodyHtml) { return el('div', 'prose', `<h3>${title}</h3>${bodyHtml}`); }
  function milestones(list) {
    const wrap = el('div', 'block');
    wrap.appendChild(el('h3', '', 'Build it yourself — the ladder'));
    list.forEach(m => {
      const row = el('div', 'milestone', `<div class="box" role="checkbox" aria-checked="false" tabindex="0"></div><div class="txt"><b>${m[0]}</b><small>${m[1]}</small></div>`);
      const box = $('.box', row);
      const toggle = () => { row.classList.toggle('done'); box.setAttribute('aria-checked', row.classList.contains('done')); };
      box.onclick = toggle;
      box.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* ============================================================
     LAB 5 · MATH ENGINE — matrices + elimination with receipts
     ============================================================ */
  {
    window.ULTRON_BUILDS2.push({
      id: 'math', tab: 'Math engine', minutes: 50,
      title: 'Build a math engine',
      lede: 'Vectors, matrices, and the algorithm that solves them all — <em>Gaussian elimination</em> — with a receipt of every step. This is the linear algebra that powers graphics (next lab), neural nets (lab 8), and every physics simulation ever shipped.',
      render(main) {
        main.innerHTML = `
        <div class="prose">
        <h3>Use it first</h3>
        <div class="split">
          <div class="block">
            <h4>A · B</h4>
            <div class="matgrid" id="mn-ab"></div>
            <h4 style="margin-top:12px">det(A)</h4>
            <div id="mn-det" style="font:600 18px var(--f-mono)"></div>
          </div>
          <div class="block">
            <h4>Solve A·x = b</h4>
            <div class="matgrid" id="mn-A"></div>
            <div style="display:flex;gap:8px;align-items:center;margin:8px 0"><span style="font:600 14px var(--f-mono)">b =</span><div class="matgrid" id="mn-b"></div></div>
            <div class="btns"><button class="btn primary" id="mn-solve">eliminate ▸</button></div>
            <div id="mn-x" style="font:600 16px var(--f-mono);margin-top:8px"></div>
          </div>
        </div>
        <div id="mn-steps" class="console" style="margin-top:12px">— steps appear here —</div>
        <h3>How it works — one idea repeated</h3>
        <p><b>Elimination:</b> to solve n equations, take the first equation, and use it to <em>cancel the first unknown from every other equation</em>. Now you have n−1 equations in n−1 unknowns. Repeat. The system becomes a triangle; then solve bottom-up (back-substitution). Every step is "add a multiple of one row to another" — the only move in the whole engine.</p>
        <p>The <b>pivot</b> (the coefficient you cancel with) is chosen as the largest in its column — not for elegance, but because dividing by tiny numbers amplifies rounding error. Numerical honesty is a design decision.</p>
        <p>And matrix multiply — the i·k·j loop order in this engine walks memory in the order a CPU likes. Same math, different speed: <b>algorithms and architecture travel together</b>.</p>
        </div>`;
        const LIN = window.ULTRON_LIN;
        const A = [[3, 2, -1], [2, -2, 4], [-1, 0.5, -1]];
        const b = [1, -2, 0];
        function grid(id, m, editable) {
          const host = $(id); host.innerHTML = ''; host.style.display = 'inline-grid';
          host.style.gridTemplateColumns = `repeat(${m[0].length}, 54px)`;
          host.style.gap = '4px';
          m.forEach((row, i) => row.forEach((v, j) => {
            const inp = document.createElement(editable ? 'input' : 'span');
            if (editable) { inp.type = 'number'; inp.value = v; inp.step = 'any'; inp.style.cssText = 'width:54px;padding:3px 5px;font:12px var(--f-mono)'; inp.dataset.i = i; inp.dataset.j = j; }
            else inp.textContent = v, inp.style.cssText = 'display:grid;place-items:center;font:12px var(--f-mono);height:26px';
            host.appendChild(inp);
          }));
        }
        function readGrid(id) {
          return [...$(id).querySelectorAll('input')].reduce((acc, inp) => {
            const i = +inp.dataset.i, j = +inp.dataset.j;
            acc[i][j] = parseFloat(inp.value) || 0; return acc;
          }, [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        }
        grid('#mn-A', A, true); grid('#mn-b', b.map(v => [v]), true); grid('#mn-ab', LIN.Mat.identity(3).m, false);
        function refreshAB() {
          const Am = new LIN.Mat(readGrid('#mn-A'));
          const Bm = new LIN.Mat([[1, 2, 0], [0, 1, 3], [2, 0, 1]]);
          grid('#mn-ab', Am.mul(Bm).m.map(r => r.map(v => Math.round(v * 100) / 100)), false);
          $('#mn-det').textContent = Math.round(Am.det() * 1000) / 1000;
        }
        $('#mn-solve').onclick = () => {
          try {
            const Am = new LIN.Mat(readGrid('#mn-A'));
            const bv = readGrid('#mn-b').map(r => r[0]);
            const { x, steps } = Am.solve(bv, true);
            $('#mn-x').innerHTML = `x = ( ${x.map(v => (Math.round(v * 100) / 100)).join(', ')} )`;
            $('#mn-steps').innerHTML = steps.map(s => {
              if (s.t === 'swap') return `<span class="dim">swap rows ${s.i + 1} ↔ ${s.j + 1} (biggest pivot wins)</span>`;
              if (s.t === 'pivot') return `pivot ready at (${s.i + 1},${s.i + 1}) = ${s.v.toFixed(3)}`;
              if (s.t === 'eliminate') return `<span class="dim">row ${s.row + 1} − ${s.factor.toFixed(2)}·row ${s.pivot + 1}  (kill column ${s.pivot + 1})</span>`;
              return `back-substitute x${s.i + 1} = ${s.v.toFixed(4)}`;
            }).join('\n');
          } catch (e) { $('#mn-steps').innerHTML = `<span class="bad">✘ ${e.message}</span>`; $('#mn-x').textContent = ''; }
        };
        main.addEventListener('input', refreshAB);
        refreshAB();
        main.appendChild(milestones([
          ['Vec3 and dot/cross', 'The grammar of geometry: dot = "how aligned", cross = "how perpendicular" (a normal vector). 20 lines.'],
          ['Mat with mul/add/transpose', 'A grid + triple loop. Then reorder the loops i·k·j and feel the cache (W03\'s lesson, in math form).'],
          ['Elimination with receipts', 'Rows of numbers, one cancel move, a steps[] log. Solve any n×n system with a paper trail.'],
          ['Partial pivoting', 'Always cancel with the largest remaining coefficient. Try solving with and without: watch accuracy die.'],
          ['Determinant from the same walk', 'det = ± product of pivots. Same elimination, different summary — math reuses everything.']
        ]));
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">This exact elimination solves circuit equations, structural stresses, pricing models, and (with an extra column) matrix inversion. Graphics (next lab) reduces to 4×4 versions of these ops per vertex, per frame. And neural networks (lab 8) are just these multiplies with a learning rule attached.</p>`));
      }
    });
  }

  /* ============================================================
     LAB 6 · SOFTWARE RENDERER — a ray tracer, pixel by pixel
     ============================================================ */
  {
    window.ULTRON_BUILDS2.push({
      id: 'render', tab: 'Renderer', minutes: 60,
      title: 'Build a graphics engine',
      lede: 'No GPU, no libraries: a <em>ray tracer</em> that fires one ray per pixel and asks geometry what it hits. Reflections come not from tricks but from firing <em>another</em> ray. The whole of "graphics" in 150 honest lines.',
      render(main) {
        main.innerHTML = `
        <div class="prose">
        <h3>Use it first — this canvas is being computed, not drawn</h3>
        <div class="split">
          <div class="block" style="text-align:center">
            <canvas id="rt-cv" width="240" height="160" style="width:100%;max-width:360px;border:1px solid var(--line);border-radius:8px;image-rendering:pixelated"></canvas>
            <div class="btns" style="justify-content:center">
              <button class="btn primary" id="rt-go">trace ▸</button>
              <span class="chip"><i></i><span id="rt-prog">idle</span></span>
            </div>
          </div>
          <div class="block">
            <div class="ctl"><label>light azimuth</label><input type="range" id="rt-az" min="-180" max="180" value="35"><output>35°</output></div>
            <div class="ctl"><label>light height</label><input type="range" id="rt-el" min="10" max="80" value="45"><output>45°</output></div>
            <div class="ctl"><label>reflections</label><input type="range" id="rt-bounce" min="0" max="2" value="1"><output>1</output></div>
            <p class="note">Every pixel = one primary ray → nearest hit → shadow ray to the light → (optionally) a reflected ray, recursively. 240×160 = 38,400 rays, in JavaScript, on your machine.</p>
          </div>
        </div>
        <h3>How it works — a loop that asks geometry questions</h3>
        <div class="cols">
          <div class="block"><h4>1 · Ray = point + direction</h4><p style="font-size:13px">From the eye through the pixel. That's it: rays are two vectors (Lab 5).</p></div>
          <div class="block"><h4>2 · Intersect</h4><p style="font-size:13px">Ray ∩ sphere is a quadratic formula; Ray ∩ plane is one dot product. Take the <b>nearest</b> positive hit.</p></div>
          <div class="block"><h4>3 · Shade</h4><p style="font-size:13px">Lambert (how much the surface faces the light) + specular (the highlight) + a shadow ray (is anything blocking?).</p></div>
          <div class="block"><h4>4 · Reflect</h4><p style="font-size:13px">Bounce the ray off the normal and trace <i>again</i>. Recursion is what makes mirrors real.</p></div>
        </div>
        <p><b>Why ray tracing instead of triangles?</b> Rasterizers (the other way) ask "where does this triangle land on screen?" — fast, GPU-shaped. Ray tracers ask "what does THIS pixel see?" — slower, but reflections, shadows and lens effects come almost free. The film industry and modern GPUs both converged here.</p>
        </div>`;
        const cv = $('#rt-cv'), g = cv.getContext('2d');
        const st = { az: 35, el: 45, bounce: 1 };
        ['#rt-az', '#rt-el', '#rt-bounce'].forEach((id, k) => {
          $(id).oninput = e => {
            const v = +e.target.value;
            if (k === 0) st.az = v; if (k === 1) st.el = v; if (k === 2) st.bounce = v;
            e.target.parentElement.querySelector('output').textContent = k === 2 ? v : v + '°';
          };
        });
        // scene
        const sph = (c, r, col, mirror) => ({ c, r, col, mirror });
        const scene = {
          spheres: [sph([0, 1, 0], 1, [220, 60, 100], .25), sph([2.1, .6, .6], .6, [90, 90, 230], .5), sph([-1.8, .5, 1.2], .5, [240, 180, 40], .1)],
          planeY: 0
        };
        function trace(ox, oy, oz, dx, dy, dz, depth) {
          // nearest hit
          let best = Infinity, hit = null;
          for (const s of scene.spheres) {
            const lx = s.c[0] - ox, ly = s.c[1] - oy, lz = s.c[2] - oz;
            const tca = lx * dx + ly * dy + lz * dz;
            const d2 = lx * lx + ly * ly + lz * lz - tca * tca;
            if (d2 > s.r * s.r) continue;
            const thc = Math.sqrt(s.r * s.r - d2);
            let t = tca - thc; if (t < 0.01) t = tca + thc;
            if (t > 0.01 && t < best) { best = t; hit = s; }
          }
          // ground plane y=0
          if (dy !== 0) {
            const t = -oy / dy;
            if (t > 0.01 && t < best) { best = t; hit = { plane: true }; }
          }
          if (!hit) return [110, 130, 190]; // sky
          const px = ox + dx * best, py = oy + dy * best, pz = oz + dz * best;
          let nx, ny, nz, col, mirror = 0;
          if (hit.plane) { nx = 0; ny = 1; nz = 0; const ck = (Math.floor(px * 1.2) + Math.floor(pz * 1.2)) % 2 === 0; col = ck ? [225, 225, 230] : [180, 180, 190]; }
          else {
            nx = (px - hit.c[0]) / hit.r; ny = (py - hit.c[1]) / hit.r; nz = (pz - hit.c[2]) / hit.r;
            col = hit.col; mirror = hit.mirror;
          }
          // light
          const az = st.az * Math.PI / 180, elv = st.el * Math.PI / 180;
          const Lx = Math.cos(elv) * Math.sin(az), Ly = Math.sin(elv), Lz = Math.cos(elv) * Math.cos(az);
          const ndl = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
          // shadow ray
          let shadow = 1;
          for (const s of scene.spheres) {
            const lx = s.c[0] - px, ly = s.c[1] - py, lz = s.c[2] - pz;
            const tca = lx * Lx + ly * Ly + lz * Lz;
            if (tca <= 0) continue;
            const d2 = lx * lx + ly * ly + lz * lz - tca * tca;
            if (d2 > 0 && d2 < s.r * s.r) { shadow = 0.35; break; }
          }
          let r = col[0] * (0.18 + 0.82 * ndl * shadow);
          let gg = col[1] * (0.18 + 0.82 * ndl * shadow);
          let bb = col[2] * (0.18 + 0.82 * ndl * shadow);
          // specular
          const h = [Lx - dx, Ly - dy, Lz - dz];
          const hl = Math.hypot(...h);
          const ndh = Math.max(0, (nx * h[0] + ny * h[1] + nz * h[2]) / hl);
          const spec = Math.pow(ndh, 40) * shadow * 120;
          r += spec; gg += spec; bb += spec;
          // reflection
          if (depth < st.bounce && mirror > 0) {
            const dDotN = dx * nx + dy * ny + dz * nz;
            const rx = dx - 2 * dDotN * nx, ry = dy - 2 * dDotN * ny, rz = dz - 2 * dDotN * nz;
            const rc = trace(px + rx * .01, py + ry * .01, pz + rz * .01, rx, ry, rz, depth + 1);
            r = r * (1 - mirror) + rc[0] * mirror; gg = gg * (1 - mirror) + rc[1] * mirror; bb = bb * (1 - mirror) + rc[2] * mirror;
          }
          return [Math.min(255, r), Math.min(255, gg), Math.min(255, bb)];
        }
        let row = 0, timer = null;
        function render() {
          if (timer) cancelAnimationFrame(timer);
          row = 0;
          const step = () => {
            if (!document.getElementById('rt-prog')) return;   // lab closed mid-render
            const img = g.createImageData(240, 1);
            for (let x2 = 0; x2 < 240; x2++) {
              const u = (x2 / 240 - .5) * 1.6, v = (0.52 - row / 160) * 1.05;
              const c = trace(0, .6, 3.6, u, v, -1, 0);
              img.data[x2 * 4] = c[0]; img.data[x2 * 4 + 1] = c[1]; img.data[x2 * 4 + 2] = c[2]; img.data[x2 * 4 + 3] = 255;
            }
            g.putImageData(img, 0, row);
            row++;
            $('#rt-prog').textContent = Math.round(row / 160 * 100) + '%';
            if (row < 160) timer = requestAnimationFrame(step);
            else { $('#rt-prog').textContent = 'done'; ULTRON_STORY.toast('38,400 rays traced — no GPU, just questions and geometry'); }
          };
          step();
        }
        $('#rt-go').onclick = render;
        ['rt-az', 'rt-el', 'rt-bounce'].forEach(id => $('#' + id).addEventListener('change', render));
        render();
        main.appendChild(milestones([
          ['A ray', 'origin + direction. Write normalize() and dot() (Lab 5). Everything is built from these two.'],
          ['Ray ∩ sphere', 'Substitute the ray into |p−c|²=r² → quadratic in t. Return the smaller positive root. ~15 lines.'],
          ['Ray ∩ plane', 't = −(o·n)/(d·n). One dot product. Now you have a ground.'],
          ['Nearest hit + Lambert + shadow ray', 'Take min t; shade by the normal-vs-light dot; fire one ray to the light — if anything blocks, multiply by 0.35.'],
          ['Recursion = reflection', 'Reflect d about n, trace again with depth−1. depth is the only difference between "shiny" and "mirror".']
        ]));
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">Real engines add: triangle meshes + BVH acceleration (a tree of World-12-style bounds), Fresnel, path tracing (Monte Carlo — the Stats page!), and GPU scheduling. But the pipeline — <b>ray → hit → shade → recurse</b> — is exactly this lab. When games say "ray tracing hardware," this loop is what got silicon.</p>`));
      }
    });
  }

  /* ============================================================
     LAB 7 · YOUR OWN FRAMEWORK — signals + effects
     ============================================================ */
  {
    window.ULTRON_BUILDS2.push({
      id: 'frame', tab: 'Framework', minutes: 45,
      title: 'Build a reactive framework',
      lede: 'Vue, Solid and React\'s hooks are all one idea: <em>values that know who depends on them</em>. Build a signal/effect graph in ~40 lines and you have the core of every modern UI framework — then watch the dependency graph light up live.',
      render(main) {
        main.innerHTML = `
        <div class="prose">
        <h3>Use it first — this counter is alive; the graph below it is the framework watching itself</h3>
        <div class="split">
          <div class="block">
            <h4>The app</h4>
            <div style="display:flex;gap:10px;align-items:center">
              <button class="btn" id="fw-dec">−</button>
              <b id="fw-count" style="font:700 28px var(--f-mono)">2</b>
              <button class="btn" id="fw-inc">+</button>
              <span style="font:15px var(--f-mono)">×2 =</span>
              <b id="fw-dbl" style="font:700 28px var(--f-mono)">4</b>
            </div>
            <div style="display:flex;gap:10px;align-items:center;margin-top:10px">
              <input type="text" id="fw-name" value="ada" style="width:90px">
              <span style="font:14px var(--f-mono)">→</span>
              <b id="fw-up" style="font:600 16px var(--f-mono)">ADA</b>
            </div>
            <p class="note" id="fw-runs"></p>
          </div>
          <div class="block">
            <h4>Dependency graph (live)</h4>
            <div id="fw-graph" style="font:12px var(--f-mono);min-height:170px"></div>
          </div>
        </div>
        <h3>How it works — three functions total</h3>
        <div class="cols">
          <div class="block"><h4>signal(v)</h4><p style="font-size:13px">A cell holding v, plus a set of <i>subscribers</i>. Reading it while an effect runs records the edge automatically; writing notifies exactly those effects.</p></div>
          <div class="block"><h4>effect(fn)</h4><p style="font-size:13px">Run fn; every signal it touched now owns it. Re-run when any of them writes. Crucially: <b>re-collect dependencies every run</b> (stale edges must die).</p></div>
          <div class="block"><h4>computed(fn)</h4><p style="font-size:13px">A signal whose value another effect keeps fresh — a derived cell. That's the whole reactivity model.</p></div>
        </div>
        <p>The counter demonstrates the <b>precision</b> of the design: incrementing <code>count</code> re-runs the doubled label, but nothing else; typing re-runs only the uppercase effect. No diffing of the whole page, no re-render of the world — exactly the edges that changed, exactly the effects that needed them.</p>
        </div>`;
        const SIG = window.ULTRON_SIG;
        let effectRuns = 0;
        const nodes = []; // {name, kind, flash:0}
        function flash(name) { const n = nodes.find(x => x.name === name); if (n) { n.flash = 1; drawGraph(); } }
        const count = SIG.signal(2);
        const nameS = SIG.signal('ada');
        const doubled = SIG.computed(() => count() * 2);
        let dblRuns = 0;
        SIG.effect(() => { $('#fw-count').textContent = count(); flash('count'); });
        SIG.effect(() => { $('#fw-dbl').textContent = doubled(); flash('doubled'); });
        SIG.effect(() => { $('#fw-up').textContent = nameS().toUpperCase(); flash('upper'); });
        $('#fw-inc').onclick = () => { count.set(count.peek() + 1); flash('count'); note(); };
        $('#fw-dec').onclick = () => { count.set(count.peek() - 1); flash('count'); note(); };
        $('#fw-name').oninput = e => { nameS.set(e.target.value); flash('name'); note(); };
        function note() {
          $('#fw-runs').textContent = `only the touched edges re-ran — press + repeatedly and watch which boxes flash`;
        }
        function drawGraph() {
          const box = (n) => {
            const col = n.kind === 'signal' ? 'var(--c2)' : n.kind === 'computed' ? 'var(--c4)' : 'var(--c3)';
            const glow = n.flash > 0 ? `box-shadow:0 0 0 3px color-mix(in srgb, ${col} 55%, transparent);` : '';
            return `<div style="border:2px solid ${col};border-radius:8px;padding:5px 10px;margin:4px;${glow}transition:box-shadow .25s">${n.name}</div>`;
          };
          $('#fw-graph').innerHTML = `
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${box(find('count'))} ${box(find('name'))}
              <span style="color:var(--muted)">→</span> ${box(find('doubled'))}
              <span style="color:var(--muted)">→</span>
              <div style="display:flex;flex-direction:column">${box(find('upper'))}${box(find('DOM'))}</div>
            </div>
            <div class="note" style="margin-top:8px">violet = signal · amber = computed · green = effect (DOM write)</div>`;
          for (const n of nodes) if (n.flash > 0) { n.flash = 0; setTimeout(drawGraph, 320); break; }
        }
        function find(name) { let n = nodes.find(x => x.name === name); if (!n) { n = { name, kind: name === 'count' || name === 'name' ? 'signal' : name === 'doubled' ? 'computed' : 'effect', flash: 0 }; nodes.push(n); } return n; }
        find('count'); find('name'); find('doubled'); find('upper'); find('DOM');
        drawGraph();
        main.appendChild(milestones([
          ['signal(v) with subscribers', 'A closure: value + Set of effects. set() notifies them. 15 lines.'],
          ['The global "currently running effect"', 'One variable. Reads during an effect wire the edge; that\'s automatic dependency tracking.'],
          ['effect(fn) with cleanup', 'Before each re-run, remove yourself from every old subscriber set — otherwise branches you no longer read keep firing you (the classic memory leak).'],
          ['computed(fn)', 'An effect writing into a private signal. Derived state in 5 lines.'],
          ['Prove precision', 'Add a log line per effect run. Increment count: 2 effects run (count DOM + doubled chain), the name effect stays silent. That precision is the entire pitch of signals.']
        ]));
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">Vue 3's reactivity, SolidJS, Preact signals and Vue's vapor mode are this graph with a scheduler on top (batched writes, priorities). React's hooks answer the same need with immutable snapshots + a diffing virtual DOM — a different trade on the same problem. Now "framework magic" is a data structure you have personally built: <b>a graph of dependencies with auto-discovered edges</b>.</p>`));
      }
    });
  }

  /* ============================================================
     LAB 8 · NEURAL NETWORK — autograd from scratch
     ============================================================ */
  {
    window.ULTRON_BUILDS2.push({
      id: 'nn', tab: 'Neural net', minutes: 75,
      title: 'Build a neural network',
      lede: 'Backpropagation is not magic — it is the chain rule, applied to a graph of arithmetic. Build a 60-line <em>autograd engine</em> (every value remembers how it was made), then teach a 2-4-1 network XOR — the function a single neuron provably cannot learn.',
      render(main) {
        main.innerHTML = `
        <div class="prose">
        <h3>Use it first — watch a network learn XOR live</h3>
        <div class="split">
          <div class="block">
            <canvas id="nn-loss" width="330" height="140" style="width:100%;border:1px solid var(--line);border-radius:8px"></canvas>
            <div class="btns">
              <button class="btn primary" id="nn-100">train 100</button>
              <button class="btn" id="nn-1000">train 1,000</button>
              <button class="btn" id="nn-reset">reset weights</button>
            </div>
            <div id="nn-outs" style="font:12.5px var(--f-mono);margin-top:8px"></div>
          </div>
          <div class="block">
            <h4>Decision boundary (learned)</h4>
            <canvas id="nn-map" width="120" height="120" style="width:100%;max-width:220px;border:1px solid var(--line);border-radius:8px;image-rendering:pixelated"></canvas>
            <p class="note">corners = the 4 XOR inputs, colored by what the network currently predicts there. Blue→red = 0→1.</p>
          </div>
        </div>
        <h3>How it works — three ideas stacked</h3>
        <div class="cols">
          <div class="block"><h4>1 · Values remember</h4><p style="font-size:13px">Every number in the network is a node with children + a local-derivative rule. <code>a×b</code> routes gradient ×b and ×a; <code>tanh</code> multiplies by 1−t². Nothing else.</p></div>
          <div class="block"><h4>2 · Backward = reverse walk</h4><p style="font-size:13px">Topological-sort the graph (built in W12!), start at the loss with gradient 1, walk backwards, each node adds its local rule into the children. <b>That's the chain rule, mechanized.</b></p></div>
          <div class="block"><h4>3 · Learn = nudge downhill</h4><p style="font-size:13px">p ← p − lr·∂loss/∂p for every parameter. Repeat on the 4 XOR rows. Loss falls; the map bends; the impossible function becomes learnable.</p></div>
        </div>
        <p>Why XOR matters: a single neuron is a straight line — it cannot separate XOR's corners no matter the weights. Two lines (the hidden layer) can frame the diagonal band. <b>Depth buys geometry.</b> Everything after this — attention, transformers, billion-parameter models — is this same engine with more graph.</p>
        </div>`;
        const NN = window.ULTRON_NN;
        let net = new NN.MLP([2, 4, 1]);
        const xs = [[0, 0], [0, 1], [1, 0], [1, 1]], ys = [0, 1, 1, 0];
        const history = [];
        const lossCv = $('#nn-loss'), lg = lossCv.getContext('2d');
        const mapCv = $('#nn-map'), mg = mapCv.getContext('2d');
        function drawLoss() {
          const css = getComputedStyle(document.documentElement);
          lg.clearRect(0, 0, lossCv.width, lossCv.height);
          if (history.length < 2) return;
          const max = Math.max(...history, 0.1);
          lg.strokeStyle = css.getPropertyValue('--c2'); lg.lineWidth = 1.5; lg.beginPath();
          history.forEach((v, i) => {
            const x = i / (history.length - 1) * (lossCv.width - 8) + 4;
            const y = lossCv.height - 8 - (v / max) * (lossCv.height - 20);
            if (!i) lg.moveTo(x, y); else lg.lineTo(x, y);
          });
          lg.stroke();
          lg.fillStyle = css.getPropertyValue('--muted'); lg.font = '10px monospace';
          lg.fillText('loss (was ' + history[0].toFixed(3) + ', now ' + history[history.length - 1].toFixed(3) + ')', 6, 12);
        }
        function drawMap() {
          const N = 40;
          const img = mg.createImageData(N, N);
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const v = net.forward([i / (N - 1), j / (N - 1)])[0].v;
            const r = Math.round(60 + 195 * v), b = Math.round(255 - 195 * v);
            const o = (j * N + i) * 4;
            img.data[o] = r; img.data[o + 1] = 90; img.data[o + 2] = b; img.data[o + 3] = 255;
          }
          mg.putImageData(img, 0, 0);
          // corners: (0,0)=0 (1,1)=0 top-left/bottom-right blue; (1,0),(0,1) red
          const css = getComputedStyle(document.documentElement);
          mg.fillStyle = css.getPropertyValue('--ink');
          mg.font = '9px monospace';
          [[0, 0, '0'], [N - 1, 0, '1'], [0, N - 1, '1'], [N - 1, N - 1, '0']].forEach(([cx, cy, t]) => {
            mg.fillStyle = '#fff'; mg.fillRect(cx - 5, cy - 5, 10, 10);
            mg.fillStyle = css.getPropertyValue('--ink'); mg.fillText(t, cx - 3, cy + 3);
          });
        }
        function outs() {
          $('#nn-outs').innerHTML = xs.map((x, i) => {
            const v = net.forward(x)[0].v;
            const good = Math.abs(v - ys[i]) < 0.15;
            return `XOR(${x.join(',')}) → <b style="color:${good ? 'var(--ok)' : 'var(--bad)'}">${v.toFixed(3)}</b> (want ${ys[i]})`;
          }).join('<br>');
        }
        function train(n) {
          let k = 0;
          const step = () => {
            for (let i = 0; i < 10; i++) {
              const loss = net.step(xs, ys, 0.15);
              history.push(loss.v);
            }
            if (!document.getElementById('nn-outs')) return;  // lab closed mid-training
            drawLoss(); drawMap(); outs();
            if (++k < n / 10) setTimeout(step, 16);
            else ULTRON_STORY.toast(history.length && history[history.length - 1] < 0.05 ? 'Loss ' + history[history.length - 1].toFixed(4) + ' — the corners separated. Depth bought geometry.' : 'Loss ' + (history[history.length - 1] || 0).toFixed(4) + ' — keep training (or reset for luckier init)');
          };
          step();
        }
        $('#nn-100').onclick = () => train(100);
        $('#nn-1000').onclick = () => train(1000);
        $('#nn-reset').onclick = () => { net = new NN.MLP([2, 4, 1]); history.length = 0; drawLoss(); drawMap(); outs(); ULTRON_STORY.toast('fresh random weights — gradient descent from a new starting line'); };
        drawLoss(); drawMap(); outs();
        main.appendChild(milestones([
          ['Value with children', 'A number + a list of parents + a backward() that adds local gradients. Start with + and ×.'],
          ['Backward over a tape', 'Topologically sort (you built this in W12\'s layout), seed the loss with grad 1, walk in reverse. Two nodes deep is enough to verify: check d(x·y)/dx numerically.'],
          ['Neuron = Σwᵢxᵢ + b, tanh', 'A Layer = matrix of Values; an MLP = stack of layers. ~20 lines with the engine done.'],
          ['The training loop', 'Loss = Σ (out − target)². backwardAll(), then every parameter: p.v −= lr·p.grad. That is ALL of "learning".'],
          ['Verify with XOR', 'A single neuron fails forever; 2-4-1 succeeds within a few hundred steps. You have personally demonstrated why depth exists.']
        ]));
        main.appendChild(section('Where this goes', `<p style="font-size:13.5px">The engine you built is micrograd in spirit — and micrograd is Karpathy's famous teaching engine precisely because 60 lines IS the whole idea. Real frameworks add tensors (batch the arithmetic), GPUs, and autodiff over huge graphs — but every gradient is still produced by exactly your reverse walk. Attention? More graph. Transformers? More graph. You now have the load-bearing core of modern AI in your hands.</p><p style="font-size:13.5px">Interview angle: derive backprop for a 2-layer net on a whiteboard — it's chain rule + bookkeeping, and you've literally built the bookkeeping.</p>`));
      }
    });
  }
})();
