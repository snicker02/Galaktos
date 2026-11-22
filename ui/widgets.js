// Galaktos — DOM widget helpers (no dependencies).
import { SOURCES } from '../engine/schema.js';

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) {
    if (c == null || c === false) continue;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return e;
}

export const fmt = (v) => {
  if (!Number.isFinite(v)) return String(v);
  const a = Math.abs(v);
  if (a !== 0 && (a < 0.0005 || a >= 1e5)) return v.toExponential(2);
  return String(+v.toFixed(4));
};

// Double-tap / double-click detection that works for mouse and touch, fires once.
export function onDoubleTap(node, fn) {
  let last = 0, lastX = 0, lastY = 0;
  node.addEventListener('pointerup', (e) => {
    const now = performance.now();
    if (now - last < 320 && Math.hypot(e.clientX - lastX, e.clientY - lastY) < 24) {
      last = 0;
      fn(e);
    } else { last = now; lastX = e.clientX; lastY = e.clientY; }
  });
}

export function section(title, open = true) {
  const body = el('div', { class: 'sec-body' });
  const d = el('details', { class: 'sec', open: open || null }, el('summary', {}, title), body);
  return { root: d, body };
}

export function button(text, onClick, title, cls) {
  return el('button', { title: title || '', class: cls || '', onclick: onClick }, text);
}

export function download(name, data, type = 'application/json') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = el('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

// Plain numeric slider row (for app settings).
export function numberRow({ label, min, max, step, value, tip, onInput, onReset }) {
  const range = el('input', { type: 'range', min, max, step, value });
  const num = el('input', { type: 'number', step, value: fmt(+value), class: 'num' });
  const lab = el('label', { title: (tip || '') + (onReset ? '\nDouble-tap: reset' : '') }, label);
  range.addEventListener('input', () => { num.value = fmt(+range.value); onInput(+range.value); });
  num.addEventListener('change', () => {
    const v = parseFloat(num.value); if (!Number.isFinite(v)) return;
    range.value = v; onInput(v);
  });
  const set = (v) => { range.value = v; num.value = fmt(+v); };
  if (onReset) onDoubleTap(lab, () => set(onReset()));
  return { root: el('div', { class: 'row' }, lab, range, num, el('span')), set };
}

export function selectRow({ label, options, value, tip, onChange }) {
  const s = el('select');
  for (const [v, t] of options) s.append(el('option', { value: v }, t));
  s.value = String(value);
  s.addEventListener('change', () => onChange(s.value));
  return { root: el('div', { class: 'row sel' }, el('label', { title: tip || '' }, label), s), set: (v) => { s.value = String(v); } };
}

export function boolRow({ label, value, tip, onChange }) {
  const cb = el('input', { type: 'checkbox' });
  cb.checked = !!value;
  cb.addEventListener('change', () => onChange(cb.checked));
  return { root: el('div', { class: 'row bool' }, el('label', { class: 'cbl', title: tip || '' }, cb, ' ', label)), set: (v) => { cb.checked = !!v; } };
}

// Preset parameter row: base slider + live modulated marker + modulation route.
//   def: schema entry; value: base; mod: [src, amt] | undefined
//   onValue(v), onMod(src, amt), onReset() -> base value
export function paramRow({ def, value, mod, onValue, onMod, onReset }) {
  const isEnum = def.type === 'enum';
  const isInt = def.type === 'int';
  const lab = el('label', { title: (def.tip ? def.tip + '\n' : '') + 'Double-tap: reset to preset value' }, def.label);
  const root = el('div', { class: 'prow' });
  let setVal, marker = null, modBtn = null, modBox = null;

  if (isEnum) {
    const s = el('select');
    for (const [v, t] of def.options) s.append(el('option', { value: v }, t));
    s.value = String(Math.round(value));
    s.addEventListener('change', () => onValue(+s.value));
    setVal = (v) => { s.value = String(Math.round(v)); };
    root.append(el('div', { class: 'row sel' }, lab, s));
  } else {
    const range = el('input', { type: 'range', min: def.min, max: def.max, step: def.step, value });
    const num = el('input', { type: 'number', step: def.step, value: fmt(+value), class: 'num' });
    marker = el('i', { class: 'live' });
    const wrap = el('div', { class: 'rwrap' }, range, marker);
    range.addEventListener('input', () => {
      let v = +range.value; if (isInt) v = Math.round(v);
      num.value = fmt(v); onValue(v);
    });
    num.addEventListener('change', () => {
      let v = parseFloat(num.value); if (!Number.isFinite(v)) return;
      v = Math.max(def.min, Math.min(def.max, v)); if (isInt) v = Math.round(v);
      range.value = v; num.value = fmt(v); onValue(v);
    });
    setVal = (v) => { range.value = v; num.value = fmt(+v); };
    if (!def.nomod) {
      modBtn = el('button', { class: 'modbtn', title: 'Modulation: drive this from audio, beat or an LFO' }, '∿');
      const src = el('select');
      for (const [v, t] of SOURCES) src.append(el('option', { value: v }, t));
      const amt = el('input', { type: 'range', min: -1, max: 1, step: 0.001, value: 0 });
      const amtNum = el('input', { type: 'number', step: 0.01, class: 'num', value: 0 });
      const setMod = (m) => {
        src.value = m ? m[0] : '';
        amt.value = m ? m[1] : 0;
        amtNum.value = fmt(m ? m[1] : 0);
        modBtn.classList.toggle('on', !!(m && m[0] && m[1]));
        marker.style.display = m && m[0] && m[1] ? 'block' : 'none';
      };
      const emit = () => {
        const s = src.value, a = +amt.value;
        modBtn.classList.toggle('on', !!(s && a));
        marker.style.display = s && a ? 'block' : 'none';
        onMod(s, a);
      };
      src.addEventListener('change', () => {
        if (src.value && +amt.value === 0) { amt.value = 0.1; amtNum.value = '0.1'; }
        emit();
      });
      amt.addEventListener('input', () => { amtNum.value = fmt(+amt.value); emit(); });
      amtNum.addEventListener('change', () => { const v = parseFloat(amtNum.value); if (Number.isFinite(v)) { amt.value = Math.max(-1, Math.min(1, v)); emit(); } });
      modBox = el('div', { class: 'modrow' },
        el('span', { class: 'modlab' }, '∿ by'), src, amt, amtNum,
        el('button', { class: 'modclear', title: 'Remove modulation', onclick: () => { setMod(null); onMod('', 0); } }, '×'));
      modBtn.addEventListener('click', () => { root.classList.toggle('modopen'); });
      setMod(mod);
      root.dataset.mod = '1';
      root._setMod = setMod;
    }
    root.append(el('div', { class: 'row' }, lab, wrap, num, modBtn || el('span')));
    if (modBox) root.append(modBox);
  }
  onDoubleTap(lab, () => { const v = onReset(); if (v != null) setVal(v); });

  const span = def.max - def.min;
  return {
    root,
    set: setVal,
    setMod: (m) => root._setMod && root._setMod(m),
    live: (v) => { if (marker) marker.style.left = `calc(${((v - def.min) / span) * 100}% - 1px)`; },
  };
}
