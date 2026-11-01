/* ============================================================
   ULTRON LAB · pure/vimcore.js — a modal editor as a pure
   state machine: (state, keys) → (state, events). The DOM
   knows nothing; this file knows nothing of the DOM. That
   separation is exactly what makes it testable — and it is
   the whole lesson of "build your own vim".
   ============================================================ */
(function () {
  'use strict';
  function createState(text) {
    return {
      lines: (text || '').split('\n'),
      row: 0, col: 0,
      mode: 'normal',           // normal | insert | command
      cmd: '',                  // pending ':' command line
      pending: '',              // pending count prefix, e.g. "3"
      register: '',             // yanked text (dd/yy → p)
      lastMsg: '',
      undoStack: []
    };
  }
  function pushUndo(s) { s.undoStack.push({ lines: s.lines.slice(), row: s.row, col: s.col }); if (s.undoStack.length > 100) s.undoStack.shift(); }
  function clamp(s) {
    s.row = Math.max(0, Math.min(s.lines.length - 1, s.row));
    s.col = Math.max(0, Math.min((s.lines[s.row] || '').length, s.col));
  }
  function count(s, dflt) {
    const n = s.pending ? parseInt(s.pending, 10) : 0;
    s.pending = '';
    return n > 0 ? n : (dflt || 1);
  }
  function applyKey(s, key) {
    const events = [];
    const say = (m) => { s.lastMsg = m; events.push({ t: 'msg', m }); };
    if (s.mode === 'insert') {
      if (key === 'Escape') { s.mode = 'normal'; if (s.col > 0) s.col--; say('back to NORMAL'); return events; }
      pushUndo(s);
      const line = s.lines[s.row];
      if (key === 'Enter') { s.lines.splice(s.row, 1, line.slice(0, s.col), line.slice(s.col)); s.row++; s.col = 0; }
      else if (key === 'Backspace') {
        if (s.col > 0) { s.lines[s.row] = line.slice(0, s.col - 1) + line.slice(s.col); s.col--; }
        else if (s.row > 0) { const prev = s.lines[s.row - 1]; s.lines.splice(s.row - 1, 2, prev + line); s.row--; s.col = prev.length; }
      } else if (key.length === 1) { s.lines[s.row] = line.slice(0, s.col) + key + line.slice(s.col); s.col++; }
      return events;
    }
    if (s.mode === 'command') {
      if (key === 'Enter') {
        const c = s.cmd.trim(); s.cmd = ''; s.mode = 'normal';
        if (c === 'w') say('written (pretend — no disk in the lab)');
        else if (c === 'q') { events.push({ t: 'quit' }); say('quit'); }
        else if (c === 'wq') { events.push({ t: 'quit' }); say('written + quit'); }
        else say('unknown command');
        return events;
      }
      if (key === 'Escape') { s.cmd = ''; s.mode = 'normal'; return events; }
      if (key === 'Backspace') { s.cmd = s.cmd.slice(0, -1); if (!s.cmd) s.mode = 'normal'; return events; }
      if (key.length === 1) s.cmd += key;
      return events;
    }
    /* ---- normal mode ---- */
    if (/^[1-9]$/.test(key)) { s.pending += key; return events; }
    const n = 1; // counts handled per-command below for simplicity (d3d etc. supported via count())
    switch (key) {
      case 'h': s.col = Math.max(0, s.col - count(s)); break;
      case 'l': s.col = Math.min((s.lines[s.row] || '').length, s.col + count(s)); break;
      case 'j': s.row = Math.min(s.lines.length - 1, s.row + count(s)); s.col = 0; break;
      case 'k': s.row = Math.max(0, s.row - count(s)); s.col = 0; break;
      case 'w': { // next word start
        const c = count(s);
        for (let i = 0; i < c; i++) {
          const line = s.lines[s.row];
          let m = /(\w+|\s+|[^\w\s])/g, match, target = null;
          while ((match = m.exec(line))) { if (match.index > s.col) { target = match.index; break; } }
          if (target !== null) s.col = target;
          else if (s.row < s.lines.length - 1) { s.row++; s.col = 0; }
        }
        break;
      }
      case 'b': { // previous word start
        const line = s.lines[s.row];
        let m = /(\w+|\s+|[^\w\s])/g, match, target = 0;
        while ((match = m.exec(line))) { if (match.index >= s.col) break; target = match.index; }
        s.col = target;
        break;
      }
      case '0': s.col = 0; break;
      case '$': s.col = Math.max(0, (s.lines[s.row] || '').length - 1); break;
      case 'g': s.row = 0; s.col = 0; break;
      case 'G': s.row = s.lines.length - 1; s.col = 0; break;
      case 'i': s.mode = 'insert'; say('-- INSERT --'); break;
      case 'a': s.mode = 'insert'; s.col = Math.min((s.lines[s.row] || '').length, s.col + 1); say('-- INSERT --'); break;
      case 'A': s.mode = 'insert'; s.col = (s.lines[s.row] || '').length; say('-- INSERT --'); break;
      case 'o': case 'O': {
        pushUndo(s); s.mode = 'insert';
        const at = key === 'o' ? s.row + 1 : s.row;
        s.lines.splice(at, 0, ''); s.row = at; s.col = 0; say('-- INSERT --');
        break;
      }
      case 'x': { pushUndo(s); const line = s.lines[s.row]; s.lines[s.row] = line.slice(0, s.col) + line.slice(s.col + 1); break; }
      case 'd': { // dd = delete line (we accept 'd' then require 'd' again — simplified: single key 'dd' handled by caller sending 'd','d')
        say('dd deletes the line');
        break;
      }
      case 'y': say('yy yanks the line'); break;
      case 'p': {
        if (s.register) { pushUndo(s); s.lines.splice(s.row + 1, 0, s.register.slice(0, -1)); say('pasted'); }
        break;
      }
      case 'u': {
        const st = s.undoStack.pop();
        if (st) { s.lines = st.lines; s.row = st.row; s.col = st.col; say('undone'); } else say('already at oldest');
        break;
      }
      case ':': s.mode = 'command'; s.cmd = ''; break;
      case 'Escape': s.pending = ''; break;
      default: say('unmapped: ' + key);
    }
    clamp(s);
    return events;
  }
  /* higher-level: dd / yy as digraphs */
  function applyKeys(s, keys) {
    const events = [];
    for (let i = 0; i < keys.length; i++) {
      if (s.mode === 'normal' && keys[i] === 'd' && keys[i + 1] === 'd') {
        pushUndo(s); s.register = s.lines[s.row] + '\n';
        s.lines.splice(s.row, 1);
        if (!s.lines.length) s.lines = [''];
        clamp(s); events.push({ t: 'msg', m: 'line deleted' }); i++; continue;
      }
      if (s.mode === 'normal' && keys[i] === 'y' && keys[i + 1] === 'y') {
        s.register = s.lines[s.row] + '\n'; events.push({ t: 'msg', m: 'line yanked' }); i++; continue;
      }
      events.push(...applyKey(s, keys[i]));
    }
    return events;
  }
  const api = { createState, applyKey, applyKeys };
  if (typeof window !== 'undefined') window.ULTRON_VIM = api;
  if (typeof globalThis !== 'undefined') globalThis.ULTRON_VIM = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
