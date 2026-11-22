// Galaktos — audio-reactive feedback visualizer with editable, modulatable presets.
// Entry point: render loop, preset state, input, save/import/capture.
import { Renderer } from './engine/renderer.js';
import { AudioEngine } from './engine/audio.js';
import { Modulator, normalizePreset, clonePreset, compactPreset, mixValues } from './engine/modulation.js';
import { randomPreset, mutatePreset } from './engine/generate.js';
import { PARAM, DERIVED } from './engine/schema.js';
import { Library } from './ui/library.js';
import { buildPanels } from './ui/panels.js';
import { download } from './ui/widgets.js';
import { initLayout } from './ui/layout.js';
import { Recorder } from './engine/recorder.js';

const VERSION = '2.2.0';
const LS_SETTINGS = 'galaktos.settings';
const DEFAULT_OUT = Object.freeze({
  speed: 1, fpsCap: 0, resScale: 1, simScale: 1, blend: 2.5, cycle: 0, cycleRandom: true, showTitle: true,
  recFormat: 'mp4', recMbps: 16, recFps: 60,
});

const $ = (id) => document.getElementById(id);
const readSettings = () => { try { return JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}; } catch { return {}; } };

function newPhases() { return Object.fromEntries(DERIVED.map((k) => [k, 0])); }

const app = {
  VERSION,
  out: { ...DEFAULT_OUT },
  paused: false, stepOnce: false, recording: false,
  preset: null, baseline: null, currentId: null, edited: false,
  values: null, prevPreset: null, blendT: 0, blendDur: 0,
  phases: newPhases(), prevPhases: null,
  time: 0,
};
window.galaktos = app;

function fatal(msg) { const f = $('fatal'); f.style.display = 'flex'; f.textContent = msg; }

function boot() {
  const saved = readSettings();
  Object.assign(app.out, saved.out || {});
  try {
    app.renderer = new Renderer($('out'));
  } catch (e) { fatal('Could not start WebGL: ' + e.message); console.error(e); return; }
  app.audio = new AudioEngine();
  app.audio.set(saved.audio || {});
  app.mod = new Modulator();
  app.lib = new Library(app);

  const first = saved.lastId && app.lib.get(saved.lastId) ? saved.lastId : app.lib.factoryIds[0];
  setPreset(app.lib.get(first).preset, first, 0);

  app.panels = buildPanels(app);
  app.lib.setCurrent(first);
  initLayout(app);

  new ResizeObserver(() => app.resize()).observe($('stage'));
  app.resize();
  wireKeys();
  wireDrop();
  wirePointer();
  // Browsers keep audio suspended until a user gesture; resume on the next tap/click/key.
  const wake = () => { const c = app.audio.ctx; if (c && c.state === 'suspended') c.resume(); };
  window.addEventListener('pointerdown', wake, true);
  window.addEventListener('keydown', wake, true);
  $('showPanel').onclick = () => app.togglePanel();
  $('fsBtn').onclick = () => {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen(); else (d.documentElement.requestFullscreen || (() => {})).call(d.documentElement);
  };
  showTitle(app.preset.name);
  requestAnimationFrame(loop);
}

// ---------------- presets ----------------
function setPreset(pr, id, blend) {
  const next = normalizePreset(pr);
  if (app.preset && blend > 0) {
    app.prevPreset = clonePreset(app.preset);
    app.prevPhases = app.phases;
    app.blendT = 0; app.blendDur = blend;
  } else { app.prevPreset = null; app.prevPhases = null; }
  app.phases = newPhases(); // every preset starts from its authored angles
  app.preset = next;
  app.baseline = clonePreset(next);
  app.currentId = id;
  app.edited = false;
}

app.loadById = function (id, blend) {
  const e = app.lib.get(id);
  if (!e) return;
  setPreset(e.preset, id, blend == null ? app.out.blend : blend);
  app.lib.setCurrent(id);
  app.panels.onPresetLoaded();
  showTitle(e.name);
  app.saveSettings();
};

function loadUnsaved(pr, msg) {
  setPreset(pr, null, app.out.blend);
  app.edited = true;
  app.lib.setCurrent(null);
  app.panels.onPresetLoaded();
  showTitle(app.preset.name);
  if (msg) app.toast(msg);
}

app.newRandom = () => loadUnsaved(randomPreset(), 'New random preset — Save it if you like it');
app.mutate = (amt = 0.4) => {
  const keepBase = app.baseline;
  loadUnsaved(mutatePreset(app.preset, amt));
  app.baseline = keepBase; // double-tap reset still goes back to the original
};
app.revert = () => {
  app.preset = clonePreset(app.baseline);
  app.edited = false;
  app.panels.onPresetLoaded();
  app.toast('Reverted');
};
app.markEdited = () => { app.edited = true; };

// ---------------- render loop ----------------
let last = performance.now(), acc = 0, cycleT = 0;
const waveBuf = new Float32Array(512);

function smoothWave(src, s) {
  if (s <= 0) return src;
  const a = Math.min(0.95, s);
  let y = src[0];
  for (let i = 0; i < 512; i++) { y = y * a + src[i] * (1 - a); waveBuf[i] = y; }
  for (let i = 510; i >= 0; i--) waveBuf[i] = waveBuf[i] * a + waveBuf[i + 1] * (1 - a);
  return waveBuf;
}

// Integrate spins/speeds into phases (per preset, so a preset never inherits another's angles).
function advancePhases(v, ph, sdt) {
  ph.wavePhase += v.waveSpin * sdt;
  ph.shapePhase += v.shapeSpin * sdt;
  ph.orbitPhase += v.shapeOrbitSpin * sdt;
  ph.sparkPhase += v.sparkSpeed * sdt;
  ph.foldPhase += v.foldSpin * sdt;
  ph.palAcc = (ph.palAcc + v.palSpeed * sdt) % 1000;
  ph.kalAcc += v.outKaleidoSpin * sdt;
  ph.curvePhase += v.curveSpin * sdt;
  ph.curveRotPhase += v.curveRot * sdt;
  ph.spiralPhase += v.spiralSpin * sdt;
  ph.rayPhase += v.raySpin * sdt;
  ph.ringPhase += v.ringSpeed * sdt;
  ph.gridPhase += v.gridSpin * sdt;
  ph.blobPhase += v.blobSpeed * sdt;
  ph.plasmaPhase += v.plasmaSpeed * sdt;
  ph.fracPhase += v.fracSpin * sdt;
  ph.kifsPhase += v.kifsSpin * sdt;
  ph.kifsTwistPhase += v.kifsTwistSpin * sdt;
  return Object.assign(v, ph);
}

function computeValues(dt, sdt) {
  const v = advancePhases(app.mod.evaluate(app.preset, {}), app.phases, sdt);
  if (app.prevPreset) {
    app.blendT += dt;
    const k = Math.min(1, app.blendT / app.blendDur);
    const e = k * k * (3 - 2 * k);
    const pv = advancePhases(app.mod.evaluate(app.prevPreset, {}), app.prevPhases, sdt);
    mixValues(pv, v, e, v);
    for (const key of DERIVED) v[key] = pv[key] + (app.phases[key] - pv[key]) * e;
    if (k >= 1) { app.prevPreset = null; app.prevPhases = null; }
  }
  return v;
}

function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  const o = app.out;

  if (app.paused && !app.stepOnce) {
    if (app.values) app.renderer.present(app.values, app.time);
    app.panels.tick(dt);
    return;
  }
  if (app.stepOnce) { dt = 1 / 60; app.stepOnce = false; }
  else if (o.fpsCap > 0) {
    acc += dt;
    if (acc < 1 / o.fpsCap) { app.panels.tick(dt); return; }
    dt = Math.min(0.1, acc); acc = 0;
  }

  const sdt = dt * o.speed;
  app.time += sdt;
  app.audio.update(dt);
  app.mod.update(sdt, app.audio.levels, app.preset.params);
  const v = computeValues(dt, sdt);
  app.values = v;

  app.renderer.setAudio(smoothWave(app.audio.wave, v.waveSmooth), app.audio.spec);
  app.renderer.step(v, app.time);
  app.renderer.present(v, app.time);
  if (recorder && recorder.active) recorder.captureFrame();
  app.panels.tick(dt);

  if (o.cycle > 0) {
    cycleT += dt;
    if (cycleT >= o.cycle) { cycleT = 0; if (o.cycleRandom) app.lib.random(); else app.lib.step(1); }
  } else cycleT = 0;
}

// ---------------- sizing / ui state ----------------
app.resize = function () {
  const r = $('stage').getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2) * app.out.resScale;
  app.renderer.resize(Math.round(r.width * dpr), Math.round(r.height * dpr), app.out.simScale);
};

app.togglePanel = function () {
  document.body.classList.toggle('nopanel');
  requestAnimationFrame(() => app.resize());
};
app.togglePause = function () { app.paused = !app.paused; app.panels.refreshPause(); app.toast(app.paused ? 'Paused' : 'Running'); };
app.step = function () { app.paused = true; app.stepOnce = true; app.panels.refreshPause(); };

let titleTimer = 0;
function showTitle(name) {
  const t = $('title');
  if (!app.out.showTitle) { t.classList.add('hide'); return; }
  t.textContent = name;
  t.classList.remove('hide');
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => t.classList.add('hide'), 3000);
}

let toastTimer = 0;
app.toast = function (msg, err) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('err', !!err);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), err ? 5000 : 1800);
};

let saveTimer = 0;
app.saveSettings = function () {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify({
        out: app.out, audio: app.audio.p,
        lastId: app.currentId && !app.currentId.startsWith('i::') ? app.currentId : null,
      }));
    } catch { /* */ }
  }, 250);
};

app.resetSettings = function () {
  app.out = { ...DEFAULT_OUT };
  app.audio.set({});
  app.resize();
  app.panels.rebuildOutput(); app.panels.rebuildAudio();
  app.saveSettings();
  app.toast('Settings reset');
};

// ---------------- audio sources ----------------
app.useSynth = function () { app.audio.useSynth(); app.panels.rebuildAudio(); app.toast('Synth pulse'); };
app.useMic = async function () {
  try { await app.audio.useMic(); app.panels.rebuildAudio(); app.toast('Listening to the microphone'); }
  catch (e) { app.toast('Microphone unavailable: ' + (e.message || e.name), true); }
};
app.useFile = function (file) {
  try { app.audio.useFile(file); app.panels.rebuildAudio(); app.toast('Playing ' + file.name); }
  catch (e) { app.toast('Could not play file: ' + e.message, true); }
};

// ---------------- save / export / import ----------------
const safeName = (s) => (s || 'preset').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 100) || 'preset';

app.saveMine = function (name) {
  name = (name || '').trim() || app.preset.name || 'Untitled';
  try {
    app.preset.name = name;
    const id = app.lib.saveMine(name, compactPreset(app.preset));
    app.currentId = id;
    app.baseline = clonePreset(app.preset);
    app.edited = false;
    app.lib.setCurrent(id);
    app.saveSettings();
    app.toast(`Saved "${name}"`);
  } catch (e) { app.toast(e.message, true); }
};

app.deleteMine = function () {
  const e = app.currentId && app.lib.get(app.currentId);
  if (!e || e.kind !== 'mine') { app.toast('Load one of your saved presets first', true); return; }
  app.lib.deleteMine(e.name);
  app.currentId = null;
  app.toast(`Deleted "${e.name}"`);
};

app.exportPreset = function (name) {
  name = (name || '').trim() || app.preset.name;
  const out = { galaktos: 2, version: VERSION, ...compactPreset({ ...app.preset, name }) };
  download(`${safeName(name)}.galaktos.json`, JSON.stringify(out, null, 1));
};

app.importFiles = async function (files) {
  let firstId = null, ok = 0, bad = 0;
  for (const f of files) {
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : [data];
      for (const d of list) {
        if (!d || typeof d !== 'object' || !d.params || typeof d.params !== 'object') { bad++; continue; }
        const pr = normalizePreset({ ...d, name: d.name || f.name.replace(/(\.galaktos)?\.json$/i, '') });
        const id = app.lib.addImported(pr);
        firstId = firstId || id; ok++;
      }
    } catch { bad++; }
  }
  if (ok) { app.lib.showImported(); app.loadById(firstId); app.panels.show('presets'); }
  app.toast(`Imported ${ok} preset${ok === 1 ? '' : 's'}${bad ? `, skipped ${bad}` : ''}`, ok === 0);
};

// ---------------- capture ----------------
app.snapshot = function () {
  $('out').toBlob((b) => { if (b) download(`${safeName(app.preset.name)}.png`, b); }, 'image/png');
};

let recorder = null;
app.toggleRecord = async function () {
  if (app.recording) {
    const r = recorder;
    app.recording = false;
    app.panels.refreshRecord();
    app.toast('Finishing video…');
    try {
      const res = await r.stop();
      if (res) {
        download(`${safeName(app.preset.name)}.${res.ext}`, res.blob);
        const mb = (res.blob.size / 1048576).toFixed(1);
        app.toast(`Saved ${res.ext.toUpperCase()} (${mb} MB)${res.dropped ? ` — ${res.dropped} frames dropped` : ''}`);
      }
    } catch (e) { app.toast('Recording failed: ' + (e.message || e), true); console.error(e); }
    recorder = null;
    return;
  }
  recorder = new Recorder($('out'), app.audio, { format: app.out.recFormat, mbps: app.out.recMbps, fps: app.out.recFps });
  try {
    const info = await recorder.start();
    app.recording = true;
    app.panels.refreshRecord();
    app.toast('Recording ' + info);
  } catch (e) {
    recorder = null;
    app.toast(e.message || String(e), true);
  }
};

// ---------------- input ----------------
function wireKeys() {
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key.toLowerCase()) {
      case 'h': app.togglePanel(); break;
      case 'n': app.lib.step(1); break;
      case 'p': app.lib.step(-1); break;
      case 'r': app.lib.random(); break;
      case 'g': app.newRandom(); break;
      case 'm': app.mutate(0.4); break;
      case 'f': app.lib.toggleFav(); break;
      case 's': app.snapshot(); break;
      case 'c': app.renderer.clear(); break;
      case ' ': e.preventDefault(); app.audio.kick(); break;
      case '.': app.togglePause(); break;
      case ',': app.step(); break;
      default: return;
    }
  });
}

function wireDrop() {
  let depth = 0;
  window.addEventListener('dragenter', (e) => { e.preventDefault(); depth++; document.body.classList.add('dragging'); });
  window.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) document.body.classList.remove('dragging'); });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault(); depth = 0; document.body.classList.remove('dragging');
    const files = [...((e.dataTransfer && e.dataTransfer.files) || [])];
    const audio = files.find((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i.test(f.name));
    const json = files.filter((f) => /\.json$/i.test(f.name));
    if (audio) { app.useFile(audio); app.panels.show('audio'); }
    if (json.length) app.importFiles(json);
  });
}

// Canvas gestures: drag = move warp centre, pinch / wheel = zoom, two-finger drag = drift, double-tap = next preset.
function wirePointer() {
  const cv = $('out');
  const pts = new Map();
  let g = null;
  let lastTap = 0, lastTapX = 0, lastTapY = 0, moved = false;
  const setP = (k, v) => {
    const d = PARAM[k];
    v = Math.max(d.min, Math.min(d.max, v));
    app.preset.params[k] = v;
    app.panels.refreshParam(k);
    app.markEdited();
  };
  const uvOf = (x, y) => { const r = cv.getBoundingClientRect(); return [(x - r.left) / r.width, 1 - (y - r.top) / r.height]; };
  const gesture = () => {
    const a = [...pts.values()];
    if (a.length === 1) return { n: 1 };
    const [p, q] = a;
    return { n: 2, d: Math.hypot(p.x - q.x, p.y - q.y), mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2, zoom: app.preset.params.zoom, dx: app.preset.params.dx, dy: app.preset.params.dy };
  };
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { moved = false; const [u, v] = uvOf(e.clientX, e.clientY); g = { n: 1, sx: e.clientX, sy: e.clientY, u, v }; }
    else if (pts.size === 2) g = gesture();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!g) return;
    if (pts.size === 1 && g.n === 1) {
      if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 6) moved = true;
      if (moved) { const [u, v] = uvOf(e.clientX, e.clientY); setP('cx', u); setP('cy', v); }
    } else if (pts.size >= 2 && g.n === 2) {
      moved = true;
      const c = gesture();
      setP('zoom', g.zoom + (c.d / Math.max(g.d, 1) - 1) * 0.04);
      const r = cv.getBoundingClientRect();
      setP('dx', g.dx + (c.mx - g.mx) / r.width * 0.02);
      setP('dy', g.dy - (c.my - g.my) / r.height * 0.02);
    }
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (e.type === 'pointerup' && pts.size === 0 && !moved) {
      const now = performance.now();
      if (now - lastTap < 320 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 30) { lastTap = 0; app.lib.step(1); }
      else { lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY; }
    }
    if (pts.size < 2) g = null; // after a pinch, ignore the remaining finger until all are lifted
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    setP('zoom', app.preset.params.zoom - Math.sign(e.deltaY) * 0.001);
  }, { passive: false });
}

boot();
