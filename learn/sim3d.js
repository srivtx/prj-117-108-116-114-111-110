/* ============================================================
   ULTRON LAB · sim3d.js — the 3D workbench every world runs on
   Three.js r128 (cdnjs), one InstancedMesh of boxes for voxels,
   pooled text sprites for labels, pooled line segments for
   pointers/edges, hand-rolled orbit + zoom + pick.
   ============================================================ */
(function () {
  'use strict';
  if (!window.THREE) { console.error('sim3d: three.js not loaded'); return; }

  const T = window.THREE;

  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  /* ---------- text sprite pool ---------- */
  function makeLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 80;
    const tex = new T.CanvasTexture(canvas);
    tex.minFilter = T.LinearFilter;
    const mat = new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const spr = new T.Sprite(mat);
    spr.scale.set(3.2, 0.8, 1);
    return { canvas, tex, spr, drawn: null };
  }
  function drawLabel(L, text, opts) {
    const key = text + '|' + (opts.color || '') + '|' + (opts.bg || '') + '|' + (opts.size || 30);
    if (L.drawn === key) return;
    L.drawn = key;
    const c = L.canvas, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const fs = (opts.size || 30);
    g.font = `600 ${fs}px "IBM Plex Mono", monospace`;
    const tw = Math.min(c.width - 20, g.measureText(text).width + 22);
    const th = fs + 18;
    const x = (c.width - tw) / 2, y = (c.height - th) / 2;
    if (opts.bg) { g.fillStyle = opts.bg; g.beginPath(); g.roundRect ? g.roundRect(x, y, tw, th, 8) : g.rect(x, y, tw, th); g.fill(); }
    g.fillStyle = opts.color || '#ffffff';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, c.width / 2, c.height / 2 + 1);
    L.tex.needsUpdate = true;
  }

  /* ---------- the sim ---------- */
  function create(canvas, opts) {
    opts = opts || {};
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new T.Scene();
    const floor = cssVar('--floor', '#e0dfee');
    scene.background = new T.Color(floor);
    scene.fog = new T.Fog(floor, 60, 170);

    const camera = new T.PerspectiveCamera(46, 1, 0.1, 600);

    scene.add(new T.AmbientLight(0xffffff, 0.58));
    const sun = new T.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 10, 5); scene.add(sun);
    const fill = new T.DirectionalLight(0xffffff, 0.28); fill.position.set(-6, 4, -7); scene.add(fill);

    /* ground grid */
    const grid = new T.GridHelper(220, 110, cssVar('--line', '#c9c9dd'), cssVar('--floor', '#e0dfee'));
    grid.material.transparent = true; grid.material.opacity = 0.55; grid.position.y = -0.001;
    scene.add(grid);

    /* voxel pool: one InstancedMesh */
    const MAXV = 26000;
    const boxGeo = new T.BoxGeometry(1, 1, 1);
    const boxMat = new T.MeshLambertMaterial({ color: 0xffffff });
    const imesh = new T.InstancedMesh(boxGeo, boxMat, MAXV);
    imesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(imesh);
    const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3();
    const COL = new T.Color();
    const vpx = new Float32Array(MAXV), vpy = new Float32Array(MAXV), vpz = new Float32Array(MAXV);
    const vsw = new Float32Array(MAXV), vsh = new Float32Array(MAXV), vsd = new Float32Array(MAXV);
    const vOn = new Uint8Array(MAXV);
    let vTop = 0;
    const ZERO = new T.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAXV; i++) imesh.setMatrixAt(i, ZERO);
    imesh.instanceMatrix.needsUpdate = true;

    const vox = {
      get top() { return vTop; },
      set(i, x, y, z, color, sx, sy, sz) {
        if (i >= MAXV) return;
        vOn[i] = 1; vpx[i] = x; vpy[i] = y; vpz[i] = z;
        vsw[i] = sx === undefined ? 1 : sx; vsh[i] = sy === undefined ? 1 : sy; vsd[i] = sz === undefined ? 1 : sz;
        if (color !== undefined) { COL.set(color); imesh.setColorAt(i, COL); if (imesh.instanceColor) imesh.instanceColor.needsUpdate = true; }
        vox.commit(i);
        if (i + 1 > vTop) vTop = i + 1;
      },
      move(i, x, y, z) { if (!vOn[i]) return; vpx[i] = x; vpy[i] = y; vpz[i] = z; vox.commit(i); },
      scale(i, sx, sy, sz) { if (!vOn[i]) return; vsw[i] = sx; vsh[i] = sy; vsd[i] = sz; vox.commit(i); },
      color(i, color) { if (!vOn[i]) return; COL.set(color); imesh.setColorAt(i, COL); if (imesh.instanceColor) imesh.instanceColor.needsUpdate = true; },
      hide(i) { vOn[i] = 0; imesh.setMatrixAt(i, ZERO); imesh.instanceMatrix.needsUpdate = true; },
      hideFrom(n) { for (let i = n; i < vTop; i++) vox.hide(i); vTop = Math.min(vTop, n); },
      get(i) { return vOn[i] ? { x: vpx[i], y: vpy[i], z: vpz[i], sx: vsw[i], sy: vsh[i], sz: vsd[i] } : null; },
      commit(i) {
        const k = pulses.active(i) ? pulses.factor(i) : 1;
        P.set(vpx[i], vpy[i], vpz[i]); S.set(vsw[i] * k, vsh[i] * k, vsd[i] * k);
        M.compose(P, Q, S); imesh.setMatrixAt(i, M); imesh.instanceMatrix.needsUpdate = true;
      },
      commitAll() { for (let i = 0; i < vTop; i++) if (vOn[i]) vox.commit(i); }
    };

    /* pulse: temporary attention flash on a voxel */
    const pulses = (() => {
      const map = new Map(); // i -> {until, t0, dur}
      return {
        add(i, dur) { map.set(i, { t0: performance.now(), dur: dur || 900, until: performance.now() + (dur || 900) }); },
        active(i) { const p = map.get(i); return p && performance.now() < p.until; },
        factor(i) {
          const p = map.get(i); if (!p) return 1;
          const k = (performance.now() - p.t0) / p.dur;
          if (k >= 1) { map.delete(i); return 1; }
          return 1 + 0.22 * Math.sin(Math.PI * k);
        },
        tick() { let live = false; for (const [i, p] of map) { if (performance.now() < p.until) { live = true; vox.commit(i); } else map.delete(i); } return live; }
      };
    })();

    /* label pool */
    const labelsPool = [];
    const labels = {
      set(i, x, y, z, text, o) {
        while (labelsPool.length <= i) { const L = makeLabel(); scene.add(L.spr); labelsPool.push(L); }
        const L = labelsPool[i];
        drawLabel(L, String(text), o || {});
        L.spr.position.set(x, y, z);
        const w = (o && o.w) || 3.2, h = (o && o.h) || 0.8;
        L.spr.scale.set(w, h, 1);
        L.spr.visible = true;
      },
      hide(i) { if (labelsPool[i]) labelsPool[i].spr.visible = false; },
      hideFrom(n) { for (let i = n; i < labelsPool.length; i++) labelsPool[i].spr.visible = false; }
    };

    /* link pool: line segments */
    const LINKMAX = 3600;
    const linkPos = new Float32Array(LINKMAX * 6);
    const linkCol = new Float32Array(LINKMAX * 6);
    const linkGeo = new T.BufferGeometry();
    linkGeo.setAttribute('position', new T.BufferAttribute(linkPos, 3));
    linkGeo.setAttribute('color', new T.BufferAttribute(linkCol, 3));
    linkGeo.setDrawRange(0, 0);
    const linkMat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.92 });
    const lines = new T.LineSegments(linkGeo, linkMat);
    lines.frustumCulled = false;
    scene.add(lines);
    const links = {
      set(i, a, b, color, alpha) {
        const p = i * 6;
        linkPos[p] = a[0]; linkPos[p + 1] = a[1]; linkPos[p + 2] = a[2];
        linkPos[p + 3] = b[0]; linkPos[p + 4] = b[1]; linkPos[p + 5] = b[2];
        COL.set(color || '#8a8ab0');
        for (let k = 0; k < 2; k++) { linkCol[p + k * 3] = COL.r; linkCol[p + k * 3 + 1] = COL.g; linkCol[p + k * 3 + 2] = COL.b; }
        linkGeo.setDrawRange(0, Math.max(linkGeo.drawRange.count, (i + 1) * 2));
        linkGeo.attributes.position.needsUpdate = true;
        linkGeo.attributes.color.needsUpdate = true;
        lines.visible = true;
      },
      count(n) { linkGeo.setDrawRange(0, Math.max(0, n * 2)); if (n === 0) lines.visible = false; },
      hideAll() { links.count(0); }
    };

    /* camera orbit state */
    const orbit = { target: new T.Vector3(0, 1.2, 0), r: 34, theta: -0.72, phi: 1.02 };
    function applyCam() {
      orbit.phi = Math.max(0.12, Math.min(Math.PI / 2 + 0.42, orbit.phi));
      orbit.r = Math.max(4, Math.min(240, orbit.r));
      const sp = Math.sin(orbit.phi), cp = Math.cos(orbit.phi);
      camera.position.set(
        orbit.target.x + orbit.r * sp * Math.sin(orbit.theta),
        orbit.target.y + orbit.r * cp,
        orbit.target.z + orbit.r * sp * Math.cos(orbit.theta)
      );
      camera.lookAt(orbit.target);
    }
    const cam = {
      view(o) {
        if (o.target) orbit.target.set(o.target[0], o.target[1], o.target[2]);
        if (o.r !== undefined) orbit.r = o.r;
        if (o.theta !== undefined) orbit.theta = o.theta;
        if (o.phi !== undefined) orbit.phi = o.phi;
        applyCam();
      },
      orbitTo(o, ms) {
        const from = { t: orbit.target.clone(), r: orbit.r, th: orbit.theta, ph: orbit.phi };
        tween(ms || 650, k => {
          const e = 1 - Math.pow(1 - k, 3);
          if (o.target) orbit.target.lerpVectors(from.t, new T.Vector3(o.target[0], o.target[1], o.target[2]), e);
          if (o.r !== undefined) orbit.r = from.r + (o.r - from.r) * e;
          if (o.theta !== undefined) orbit.theta = from.th + (o.theta - from.th) * e;
          if (o.phi !== undefined) orbit.phi = from.ph + (o.phi - from.ph) * e;
          applyCam();
        });
      },
      state() { return { r: orbit.r, theta: orbit.theta, phi: orbit.phi, target: orbit.target.toArray() }; }
    };

    /* pointer controls: drag orbit, wheel zoom, pinch, pick */
    const ray = new T.Raycaster(); const ndc = new T.Vector2();
    let dragging = false, lastX = 0, lastY = 0, moved = 0, pinch = null;
    const pickHandlers = [];
    const hoverHandlers = [];
    function pickAt(cx, cy) {
      const r = canvas.getBoundingClientRect();
      ndc.x = ((cx - r.left) / r.width) * 2 - 1;
      ndc.y = -((cy - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObject(imesh);
      for (const h of hits) { const i = h.instanceId; if (i !== undefined && vOn[i]) return i; }
      return null;
    }
    canvas.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
      canvas.classList.add('drag'); canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        orbit.theta -= dx * 0.0062; orbit.phi -= dy * 0.0058; applyCam();
        lastX = e.clientX; lastY = e.clientY;
      } else if (hoverHandlers.length) {
        const i = pickAt(e.clientX, e.clientY);
        hoverHandlers.forEach(f => f(i, e));
      }
    });
    canvas.addEventListener('pointerup', e => {
      canvas.classList.remove('drag');
      if (dragging && moved < 7) {
        const i = pickAt(e.clientX, e.clientY);
        pickHandlers.forEach(f => f(i, e));
      }
      dragging = false;
    });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      orbit.r *= Math.exp(e.deltaY * 0.0011); applyCam();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (pinch) { orbit.r *= pinch / d; applyCam(); }
        pinch = d;
      }
    }, { passive: true });
    canvas.addEventListener('touchend', () => { pinch = null; });

    /* tweens + frame hooks */
    const tweens = [];
    function tween(ms, fn, done) { tweens.push({ t0: performance.now(), ms, fn, done }); }
    function after(ms, fn) { setTimeout(fn, ms); }
    const frameHooks = [];
    function clearFrames() { frameHooks.length = 0; }

    /* tick player: worlds register a tick function; play/pause/step/speed */
    const player = {
      rate: 1, running: false, t: 0, tickFn: null, _acc: 0,
      on(fn) { player.tickFn = fn; },
      play() { player.running = true; },
      pause() { player.running = false; },
      toggle() { player.running = !player.running; },
      step(n) { for (let k = 0; k < (n || 1); k++) player.tickFn && player.tickFn(); },
      setRate(r) { player.rate = r; }
    };

    /* render loop */
    let prev = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const dtms = Math.min(64, now - prev); prev = now;
      if (player.running && player.tickFn) {
        player._acc += dtms * player.rate;
        const stepMs = 120;
        let guard = 0;
        while (player._acc >= stepMs && guard++ < 40) { player.tickFn(); player._acc -= stepMs; }
      }
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i];
        const k = Math.min(1, (now - tw.t0) / tw.ms);
        tw.fn(k);
        if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
      }
      pulses.tick();
      for (const f of frameHooks) f(dtms / 1000, now);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);

    /* resize */
    function resize() {
      const w = canvas.clientWidth || canvas.parentElement.clientWidth, h = canvas.clientHeight || canvas.parentElement.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    }
    if (opts.autoResize !== false) {
      window.addEventListener('resize', resize);
      new ResizeObserver(resize).observe(canvas.parentElement || canvas);
    }
    resize();

    applyCam();

    return {
      canvas, renderer, scene, camera, THREE: T,
      vox, labels, links, cam, player, tween, after, clearFrames,
      onFrame(fn) { frameHooks.push(fn); },
      onPick(fn) { pickHandlers.push(fn); },
      onHover(fn) { hoverHandlers.push(fn); },
      clearPicks() { pickHandlers.length = 0; hoverHandlers.length = 0; },
      pulse: (i, dur) => { pulses.add(i, dur); vox.commit(i); },
      clearAll() { vox.hideFrom(0); labels.hideFrom(0); links.count(0); },
      resize
    };
  }

  window.Sim3D = { create };
})();
