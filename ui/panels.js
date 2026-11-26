// Galaktos — panels (one tab per section).
import { el, fmt, section, button, numberRow, selectRow, boolRow, paramRow } from './widgets.js';
import { PARAMS, PARAM, SOURCES } from '../engine/schema.js';
import { DEFAULT_AUDIO } from '../engine/audio.js';

const TABS = [
  ['presets', 'Presets'], ['motion', 'Motion'], ['feedback', 'Feedback'], ['wave', 'Wave'],
  ['shape', 'Shapes'], ['sparks', 'Sparks'], ['geom', 'Geometry'], ['fields', 'Fields'], ['fractal', 'Fractals'], ['color', 'Colour'], ['mod', 'Mod'],
  ['audio', 'Audio'], ['output', 'Output'],
];

const SUBSECTIONS = {
  motion: [['Flow field', ['zoom', 'rot', 'swirl', 'lens', 'ripple', 'rippleFreq', 'rippleSpeed', 'flow', 'flowScale', 'flowSpeed']],
    ['Centre & drift', ['cx', 'cy', 'dx', 'dy', 'stretchX', 'stretchY']],
    ['Feedback fold', ['fold', 'foldRot', 'foldSpin']]],
  feedback: [['Trail', ['decay', 'blur', 'sharpen', 'edge', 'edgeMode']], ['Colour drift', ['hueDrift', 'satGain', 'bright']], ['Echo', ['echoMix', 'echoZoom']]],
  wave: [['Shape', ['waveMode', 'waveAmp', 'waveSize', 'waveThick', 'waveSmooth']], ['Placement', ['waveX', 'waveY', 'waveRot', 'waveSpin']], ['Colour', ['waveHue', 'waveHueSpread', 'waveSat', 'waveBright']]],
  shape: [['Form', ['shapeMode', 'shapeSides', 'shapeCount', 'shapeSize', 'shapeThick']], ['Motion', ['shapeRot', 'shapeSpin', 'shapeOrbit', 'shapeOrbitSpin', 'shapeX', 'shapeY']], ['Colour', ['shapeHue', 'shapeHueSpread', 'shapeSat', 'shapeBright']]],
  sparks: [['Sparks', ['sparkCount', 'sparkSize', 'sparkSpread', 'sparkSpeed', 'sparkHue', 'sparkHueSpread', 'sparkBright']], ['Centre flash', ['flash', 'flashSize', 'flashHue']]],
  geom: [['Curve', ['curveMode', 'curveA', 'curveB', 'curveC', 'curveLoops', 'curveDamp', 'curveSize', 'curveThick', 'curveSpin', 'curveRot', 'curveHue', 'curveHueSpread', 'curveBright']],
    ['Spiral', ['spiralMode', 'spiralArms', 'spiralTwist', 'spiralThick', 'spiralReach', 'spiralSpin', 'spiralHue', 'spiralHueSpread', 'spiralBright']],
    ['Rays', ['rayMode', 'rayCount', 'rayWidth', 'rayInner', 'rayOuter', 'raySpin', 'rayHue', 'rayHueSpread', 'rayBright']]],
  fields: [['Pulse rings', ['ringMode', 'ringFreq', 'ringSpeed', 'ringThick', 'ringFade', 'ringHue', 'ringHueSpread', 'ringBright']],
    ['Lattice', ['gridMode', 'gridScale', 'gridThick', 'gridSpin', 'gridFade', 'gridHue', 'gridHueSpread', 'gridBright']],
    ['Metaballs', ['blobMode', 'blobCount', 'blobSize', 'blobSpread', 'blobSpeed', 'blobHue', 'blobHueSpread', 'blobBright']],
    ['Plasma', ['plasmaAmt', 'plasmaScale', 'plasmaSpeed', 'plasmaEdge', 'plasmaHue', 'plasmaHueSpread']]],
  fractal: [['Escape-time set', ['fracMode', 'fracStyle', 'fracRe', 'fracIm', 'fracZoom', 'fracPower', 'fracIter', 'fracReach', 'fracSpin', 'fracHue', 'fracHueSpread', 'fracBright']],
    ['Kaleidoscopic IFS', ['kifsMode', 'kifsShape', 'kifsIter', 'kifsScale', 'kifsAngle', 'kifsTwistSpin', 'kifsOffset', 'kifsSym', 'kifsSize', 'kifsThick', 'kifsSpin', 'kifsHue', 'kifsHueSpread', 'kifsBright']],
    ['Feedback map (warp)', ['cmapMode', 'cmapMix', 'cmapRe', 'cmapIm', 'cmapScale']]],
  color: [['Palette', ['palette', 'palMix', 'palFreq', 'palPhase', 'palSpeed']], ['Grade', ['outHue', 'outSat', 'contrast', 'gamma', 'vignette']], ['Symmetry & framing', ['outMirror', 'outKaleido', 'outKaleidoSpin', 'outZoom']]],
  mod: [['LFO rates', ['lfo1Rate', 'lfo2Rate', 'lfo3Rate']]],
};

const LS_TAB = 'galaktos.tab';
const GEN_PAGES = new Set(['geom', 'fields', 'fractal']);

export function buildPanels(app) {
  const $bar = document.getElementById('tabbar');
  const $pages = document.getElementById('pages');
  const pages = {};
  const rows = new Map(); // param key -> paramRow widget
  let active = 'presets';
  try { const t = localStorage.getItem(LS_TAB); if (t && TABS.some((x) => x[0] === t)) active = t; } catch { /* */ }

  for (const [id, label] of TABS) {
    $bar.append(el('button', { 'data-tab': id, onclick: () => show(id) }, label));
    pages[id] = el('section', { class: 'page', 'data-page': id });
    $pages.append(pages[id]);
  }

  function show(id) {
    active = id;
    for (const b of $bar.children) b.classList.toggle('on', b.dataset.tab === id);
    for (const [k, p] of Object.entries(pages)) p.classList.toggle('tabon', k === id);
    try { localStorage.setItem(LS_TAB, id); } catch { /* */ }
    const b = $bar.querySelector(`[data-tab="${id}"]`);
    if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (id === 'mod') buildRoutes();
  }

  // ---------------- parameter pages ----------------
  // Section titles already name the generator, so rows drop the prefix ("Curve hue°" -> "Hue°").
  const SHORT = /^(Curve|Spiral|Ray|Ring|Lattice|Blob|Plasma|Set|IFS|Map|Flash) (?=\S)/;
  function paramWidget(key) {
    const full = PARAM[key];
    const short = full.label.replace(SHORT, '');
    const def = short === full.label ? full : { ...full, label: short[0].toUpperCase() + short.slice(1) };
    const w = paramRow({
      def,
      value: app.preset.params[key],
      mod: app.preset.mods[key],
      onValue: (v) => { app.preset.params[key] = v; app.markEdited(); },
      onMod: (src, amt) => {
        if (src && amt) app.preset.mods[key] = [src, amt]; else delete app.preset.mods[key];
        app.markEdited();
      },
      onReset: () => {
        const v = app.baseline.params[key];
        app.preset.params[key] = v;
        return v;
      },
    });
    rows.set(key, w);
    return w.root;
  }

  function buildParamPages() {
    rows.clear();
    for (const [gid, subs] of Object.entries(SUBSECTIONS)) {
      const pg = pages[gid];
      pg.innerHTML = '';
      pg.append(el('div', { class: 'hint' }, gid === 'color'
        ? 'Output grading — applied to the screen, not fed back into the trails.'
        : gid === 'fractal' ? 'Escape-time sets and the IFS draw into the loop (keep brightness low — they add every frame). The feedback map warps the loop itself through a complex function, so a fractal grows frame by frame; Edges = Mirror works best. Modulate c to morph the set with the music.'
        : GEN_PAGES.has(gid) ? 'Generators draw into the feedback loop, centred on the screen. Switch one on with its first control; the Curve is the heaviest on slow GPUs.'
        : 'Double-tap a name to reset it. ∿ routes audio, beat or an LFO to a parameter; the orange tick shows the live value.'));
      for (const [title, keys] of subs) {
        const first = PARAM[keys[0]];
        const open = !GEN_PAGES.has(gid) || (first.type === 'enum' ? app.preset.params[keys[0]] > 0 : app.preset.params[keys[0]] > 0);
        const s = section(title + (GEN_PAGES.has(gid) && !open ? ' — off' : ''), open);
        for (const k of keys) s.body.append(paramWidget(k));
        pg.append(s.root);
      }
      if (gid === 'mod') pg.append(el('div', { id: 'routes' }));
    }
    buildRoutes();
  }

  function buildRoutes() {
    const box = pages.mod.querySelector('#routes');
    if (!box) return;
    box.innerHTML = '';
    const s = section('Active routes', true);
    const entries = Object.entries(app.preset.mods);
    if (!entries.length) s.body.append(el('div', { class: 'hint' }, 'No modulation in this preset. Open ∿ on any parameter to add one.'));
    const srcName = Object.fromEntries(SOURCES);
    for (const [k, [src, amt]] of entries) {
      s.body.append(el('div', { class: 'route' },
        el('span', {}, `${PARAM[k].label}`), el('span', { class: 'dim' }, `← ${srcName[src] || src}`), el('span', { class: 'num' }, fmt(amt)),
        button('×', () => { delete app.preset.mods[k]; const w = rows.get(k); if (w) w.setMod(null); app.markEdited(); buildRoutes(); }, 'Remove route')));
    }
    s.body.append(el('div', { class: 'bar' },
      button('Clear all routes', () => { app.preset.mods = {}; for (const w of rows.values()) w.setMod(null); app.markEdited(); buildRoutes(); }, '', 'danger')));
    box.append(s.root);
    box.append(el('div', { class: 'hint' }, 'Sources: audio bands are centred on 0 at average loudness (louder = positive). Beat jumps to 1 and decays. LFOs swing −1…1. Wander is slow random drift; Slow ramp rises over 30 s and repeats. Amount is a fraction of the parameter\'s full range.'));
  }

  // ---------------- presets page ----------------
  let nameInput, mutAmt = 0.4;
  function buildPresets() {
    const pg = pages.presets;
    pg.innerHTML = '';
    const lib = el('div', { class: 'libbox' });
    pg.append(lib);
    app.lib.mount(lib);

    const gen = section('Create', true);
    gen.body.append(
      el('div', { class: 'bar' },
        button('New random', () => app.newRandom(), 'Generate a fresh preset (G)', 'primary'),
        button('Mutate', () => app.mutate(mutAmt), 'Nudge the current preset (M)'),
        button('Revert', () => app.revert(), 'Undo all edits since it was loaded')),
      numberRow({ label: 'Mutate amount', min: 0.05, max: 1, step: 0.01, value: mutAmt, onInput: (v) => { mutAmt = v; } }).root,
    );
    pg.append(gen.root);

    const sv = section('Save', true);
    nameInput = el('input', { type: 'text', placeholder: 'Preset name', style: 'flex:1;min-width:0' });
    nameInput.value = app.preset.name;
    nameInput.addEventListener('change', () => { app.preset.name = nameInput.value.trim() || app.preset.name; });
    const fileIn = el('input', { type: 'file', accept: '.json,application/json', multiple: true, style: 'display:none' });
    fileIn.onchange = () => { app.importFiles([...fileIn.files]); fileIn.value = ''; };
    sv.body.append(
      el('div', { class: 'bar' }, nameInput, button('Save', () => app.saveMine(nameInput.value), 'Save to My presets (this browser)', 'primary')),
      el('div', { class: 'bar' },
        button('Export', () => app.exportPreset(nameInput.value), 'Download as .json'),
        button('Import…', () => fileIn.click(), 'Load .json presets (drag & drop works too)'),
        button('Delete', () => app.deleteMine(), 'Remove the loaded preset from My presets', 'danger'),
        fileIn),
    );
    pg.append(sv.root);
  }

  // ---------------- audio page ----------------
  let meters = null, statusEl = null, playerBox = null;
  function buildAudio() {
    const pg = pages.audio;
    pg.innerHTML = '';
    const au = app.audio;
    const fileIn = el('input', { type: 'file', accept: 'audio/*', style: 'display:none' });
    fileIn.onchange = () => { if (fileIn.files[0]) app.useFile(fileIn.files[0]); fileIn.value = ''; };
    statusEl = el('div', { class: 'status' }, au.status);
    playerBox = el('div', { class: 'player' });
    if (au.mode === 'file' && au.el) playerBox.append(au.el);
    const src = section('Source', true);
    src.body.append(
      el('div', { class: 'bar' },
        button('Synth', () => app.useSynth(), 'Built-in pulse — no sound needed', au.mode === 'synth' ? 'primary' : ''),
        button('Microphone', () => app.useMic(), 'Mic or line-in (asks permission)', au.mode === 'mic' ? 'primary' : ''),
        button('Audio file…', () => fileIn.click(), 'Play a file and visualise it (drag & drop works too)', au.mode === 'file' ? 'primary' : ''),
        fileIn),
      statusEl, playerBox,
    );
    pg.append(src.root);

    const m = el('div', { class: 'meters' });
    meters = {};
    for (const k of ['bass', 'mid', 'treb', 'vol', 'beat']) {
      const bar = el('i'), att = el('i'), val = el('span', { class: 'num' });
      m.append(el('span', {}, k), el('div', {}, el('div', { class: 'meter' }, bar), k === 'beat' ? null : el('div', { class: 'meter att' }, att)), val);
      meters[k] = { bar, att, val };
    }
    const lv = section('Levels', true);
    lv.body.append(m, el('div', { class: 'bar' }, button('Kick', () => au.kick(), 'Inject a beat (Space)', 'primary')));
    pg.append(lv.root);

    const an = section('Analysis', true);
    const num = (k, label, min, max, step, tip) => numberRow({
      label, min, max, step, tip, value: au.p[k],
      onInput: (v) => { au.p[k] = v; app.saveSettings(); },
      onReset: () => { au.p[k] = DEFAULT_AUDIO[k]; app.saveSettings(); return DEFAULT_AUDIO[k]; },
    }).root;
    an.body.append(
      num('reactivity', 'Reactivity', 0, 3, 0.01, 'How far levels swing from average'),
      num('beatThresh', 'Beat threshold', 1.05, 3, 0.01, 'Bass ratio over its average that counts as a beat'),
      num('beatDecay', 'Beat decay', 1, 20, 0.1, 'How fast the beat source falls back to 0'),
      num('attSmooth', 'Smoothing', 0, 0.995, 0.001, 'Smoothing of the (smooth) sources'),
      num('waveGain', 'Wave gain', 0, 4, 0.01, 'Waveform height'),
    );
    pg.append(an.root);
    const sy = section('Synth', au.mode === 'synth');
    sy.body.append(
      num('bpm', 'BPM', 30, 220, 0.5),
      num('synthEnergy', 'Energy', 0, 2, 0.01),
      num('synthWander', 'Wander', 0, 1.5, 0.01),
    );
    pg.append(sy.root);
  }

  function tickAudio() {
    if (active !== 'audio' || !meters) return;
    const L = app.audio.levels;
    for (const k of ['bass', 'mid', 'treb', 'vol', 'beat']) {
      const v = L[k];
      meters[k].bar.style.width = `${Math.min(100, (k === 'beat' ? v : v / 3) * 100)}%`;
      if (k !== 'beat') meters[k].att.style.width = `${Math.min(100, L[k + '_att'] / 3 * 100)}%`;
      meters[k].val.textContent = v.toFixed(2);
    }
  }

  // ---------------- output page ----------------
  let recBtn, pauseBtn;
  const recLabel = () => (app.recording ? '■ Stop recording' : `● Record ${app.out.recFormat === 'webm' ? 'WebM' : 'MP4'}`);
  function buildOutput() {
    const pg = pages.output;
    pg.innerHTML = '';
    const o = app.out;
    const num = (k, label, min, max, step, tip, after) => numberRow({
      label, min, max, step, tip, value: o[k],
      onInput: (v) => { o[k] = v; app.saveSettings(); if (after) after(); },
    }).root;
    const t = section('Time', true);
    pauseBtn = button(app.paused ? 'Resume' : 'Pause', () => app.togglePause(), 'Pause / resume (.)');
    t.body.append(
      num('speed', 'Time speed', 0.05, 4, 0.01, 'Scales LFOs, spins and time-based motion'),
      num('fpsCap', 'FPS cap', 0, 120, 1, '0 = uncapped. Lower values slow the feedback motion down'),
      el('div', { class: 'bar' }, pauseBtn, button('Step', () => app.step(), 'One frame (,)'), button('Clear', () => app.renderer.clear(), 'Wipe the trails (C)')),
    );
    pg.append(t.root);
    const q = section('Quality', true);
    q.body.append(
      num('resScale', 'Resolution', 0.25, 2, 0.05, 'Output resolution relative to the screen', () => app.resize()),
      num('simScale', 'Feedback res', 0.25, 1, 0.05, 'Trail buffer size relative to output. Lower = softer, faster', () => app.resize()),
      el('div', { class: 'hint' }, `Trail buffer precision: ${app.renderer.precision}.`),
    );
    pg.append(q.root);
    const tr = section('Transitions', true);
    tr.body.append(
      num('blend', 'Blend time (s)', 0, 10, 0.1, 'Morph between presets'),
      num('cycle', 'Auto-cycle (s)', 0, 300, 1, '0 = off'),
      boolRow({ label: 'Auto-cycle picks random', value: o.cycleRandom, onChange: (v) => { o.cycleRandom = v; app.saveSettings(); } }).root,
      boolRow({ label: 'Show preset name on change', value: o.showTitle, onChange: (v) => { o.showTitle = v; app.saveSettings(); } }).root,
    );
    pg.append(tr.root);
    const cap = section('Capture', true);
    recBtn = button(recLabel(), () => app.toggleRecord(), 'Records the output (with sound for mic/file input)', 'primary');
    cap.body.append(
      selectRow({ label: 'Video format', value: o.recFormat, options: [['mp4', 'MP4 (H.264)'], ['webm', 'WebM (VP9 / Opus)']],
        onChange: (v) => { o.recFormat = v; app.saveSettings(); if (!app.recording) recBtn.textContent = recLabel(); } }).root,
      num('recMbps', 'Quality (Mbps)', 2, 60, 1, 'Video bitrate'),
      selectRow({ label: 'Frame rate', value: o.recFps, options: [[24, '24 fps'], [30, '30 fps'], [60, '60 fps']],
        onChange: (v) => { o.recFps = +v; app.saveSettings(); } }).root,
      el('div', { class: 'bar' }, button('Snapshot PNG', () => app.snapshot(), '(S)'), recBtn,
        button('⇄ Shelf', () => (app.shelf ? app.shelf.toggle() : app.toast('The shelf needs snicker02.github.io (offline?)', true)), 'Shared image shelf: send this frame to another snicker02 app')),
      el('div', { class: 'hint' }, 'MP4 is H.264 at the output resolution (Resolution above), constant frame rate. Sound is recorded for Microphone or Audio file input: AAC where the browser can encode it, otherwise Opus.'),
    );
    pg.append(cap.root);
    pg.append(el('div', { class: 'bar' }, button('Reset settings', () => app.resetSettings(), 'Output and audio settings back to defaults', 'danger')));
    pg.append(el('div', { class: 'hint keys' }, 'Keys: H panel · N/P next/prev · R random · G new random · M mutate · F favourite · Space kick · . pause · , step · C clear · S snapshot · drag = move centre · wheel = zoom · double-click = next'));
    pg.append(el('div', { class: 'hint touch' }, 'Touch: drag = move centre · pinch = zoom · two fingers = drift · double-tap = next preset'));
    pg.append(el('div', { class: 'foot' }, `Galaktos v${app.VERSION}`));
  }

  // ---------------- public ----------------
  let liveT = 0;
  function tickLive(dt) {
    liveT += dt;
    if (liveT < 1 / 15) return;
    liveT = 0;
    const v = app.values;
    const pg = pages[active];
    if (!pg || !v) return;
    for (const row of pg.querySelectorAll('.prow[data-mod]')) {
      const key = row.dataset.key;
      const w = rows.get(key);
      if (w) w.live(v[key]);
    }
  }

  function onPresetLoaded() {
    buildParamPages();
    for (const [k, w] of rows) w.root.dataset.key = k;
    if (nameInput) nameInput.value = app.preset.name;
  }

  function refreshParam(key) {
    const w = rows.get(key);
    if (w) w.set(app.preset.params[key]);
  }

  buildPresets();
  buildAudio();
  buildOutput();
  onPresetLoaded();
  show(active);

  return {
    onPresetLoaded,
    refreshParam,
    rebuildAudio: buildAudio,
    rebuildOutput: buildOutput,
    refreshRecord: () => { if (recBtn) { recBtn.textContent = recLabel(); recBtn.classList.toggle('danger', app.recording); } },
    refreshPause: () => { if (pauseBtn) pauseBtn.textContent = app.paused ? 'Resume' : 'Pause'; },
    setStatus: (s) => { if (statusEl) statusEl.textContent = s; },
    tick(dt) { tickLive(dt); tickAudio(); },
    show,
  };
}
