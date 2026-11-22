// Galaktos — preset randomiser and mutator.
import { PARAMS, PARAM, PALETTES } from './schema.js';
import { normalizePreset, clonePreset } from './modulation.js';

const R = Math.random;
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// [param, source, amount range (fraction of param range), allowNegative]
const MOD_IDEAS = [
  ['zoom', 'bass', [0.03, 0.08], false], ['zoom', 'beat', [0.03, 0.08], false], ['zoom', 'lfo1', [0.02, 0.05], true],
  ['rot', 'lfo1', [0.05, 0.2], true], ['rot', 'mid', [0.05, 0.15], true],
  ['swirl', 'lfo2', [0.05, 0.25], true], ['lens', 'bass_att', [0.05, 0.2], true],
  ['ripple', 'treb', [0.1, 0.3], false], ['flow', 'mid_att', [0.05, 0.2], false],
  ['hueDrift', 'mid', [0.03, 0.1], true], ['hueDrift', 'lfo3', [0.05, 0.15], true],
  ['waveAmp', 'vol', [0.1, 0.3], false], ['waveSize', 'bass_att', [0.05, 0.15], false],
  ['waveHue', 'ramp', [0.3, 0.5], false], ['waveBright', 'beat', [0.1, 0.3], false],
  ['shapeSize', 'beat', [0.05, 0.15], false], ['shapeSize', 'bass', [0.05, 0.12], false],
  ['shapeOrbit', 'lfo2', [0.05, 0.2], true], ['shapeHue', 'lfo1', [0.1, 0.3], true],
  ['sparkBright', 'treb', [0.1, 0.3], false], ['sparkSpread', 'lfo1', [0.05, 0.15], true],
  ['flash', 'beat', [0.15, 0.35], false], ['echoMix', 'beat', [0.1, 0.3], false],
  ['foldRot', 'lfo2', [0.05, 0.2], true], ['palPhase', 'lfo1', [0.1, 0.3], true],
  ['decay', 'beat', [-0.15, -0.05], false], ['outHue', 'noise', [0.05, 0.15], true],
  ['edge', 'treb_att', [0.05, 0.15], false], ['blur', 'bass', [0.1, 0.25], false],
  ['curveSize', 'bass_att', [0.05, 0.15], false], ['curveC', 'lfo2', [0.05, 0.2], true],
  ['spiralTwist', 'lfo1', [0.05, 0.15], true], ['spiralBright', 'beat', [0.1, 0.25], false],
  ['rayOuter', 'bass', [0.08, 0.2], false], ['rayWidth', 'treb', [0.1, 0.25], false],
  ['ringBright', 'beat', [0.1, 0.3], false], ['ringFreq', 'lfo2', [0.03, 0.1], true],
  ['gridScale', 'lfo1', [0.03, 0.1], true], ['gridBright', 'mid', [0.05, 0.15], false],
  ['blobSize', 'bass', [0.05, 0.15], false], ['blobSpread', 'lfo3', [0.05, 0.15], true],
  ['plasmaAmt', 'vol', [0.03, 0.1], false],
  ['fracRe', 'lfo1', [0.005, 0.02], true], ['fracIm', 'lfo2', [0.005, 0.02], true], ['fracZoom', 'bass_att', [0.01, 0.03], false],
  ['kifsAngle', 'lfo1', [0.02, 0.08], true], ['kifsScale', 'bass', [0.02, 0.06], false], ['kifsOffset', 'lfo3', [0.02, 0.06], true],
  ['cmapRe', 'lfo1', [0.005, 0.02], true], ['cmapIm', 'lfo2', [0.005, 0.02], true],
];
const GEN_MODES = { curveMode: [1, 2, 3, 4], spiralMode: [1, 2], rayMode: [1, 2], ringMode: [1, 2, 3], gridMode: [1, 2, 3], blobMode: [1, 2, 3], fracMode: [1, 1, 2, 3, 4], kifsMode: [1, 2, 3] };

const ADJ = ['Velvet', 'Hollow', 'Molten', 'Silent', 'Fractured', 'Electric', 'Tidal', 'Lunar', 'Feral', 'Gilded', 'Spiral', 'Drifting', 'Burning', 'Frozen', 'Hidden', 'Orbital', 'Woven', 'Phantom', 'Radiant', 'Shattered'];
const NOUN = ['Lantern', 'Cathedral', 'Bloom', 'Engine', 'Garden', 'Vortex', 'Lattice', 'Choir', 'Reef', 'Halo', 'Furnace', 'Mirage', 'Tide', 'Signal', 'Nebula', 'Labyrinth', 'Totem', 'Prism', 'Current', 'Iris'];
export function randomName() { return `${pick(ADJ)} ${pick(NOUN)}`; }

export function randomPreset() {
  const params = {};
  for (const d of PARAMS) {
    const [lo, hi] = d.rnd || [d.min, d.max];
    if (d.type === 'enum') continue;
    let v = lerp(lo, hi, R());
    if (d.type === 'int') v = Math.round(v);
    params[d.key] = v;
  }
  // structure choices
  params.waveMode = pick([1, 1, 2, 3, 4, 5, 1, 4]);
  params.shapeMode = R() < 0.5 ? pick([1, 2, 3]) : 0;
  params.palette = R() < 0.15 ? 0 : 1 + Math.floor(R() * (PALETTES.length - 1));
  params.edgeMode = pick([0, 1, 1, 2]);
  params.outMirror = R() < 0.15 ? pick([1, 2, 3]) : 0;
  if (R() < 0.55) params.fold = 0;
  if (R() < 0.6) params.sparkCount = 0;
  if (R() < 0.5) params.echoMix = 0;
  if (R() < 0.6) params.flow = 0;
  if (R() < 0.6) params.ripple = 0;
  if (R() < 0.15) params.outKaleido = pick([4, 6, 8]);
  // new generators: usually one or two, sometimes none
  for (const k of Object.keys(GEN_MODES)) params[k] = 0;
  const gens = Object.keys(GEN_MODES).sort(() => R() - 0.5).slice(0, pick([0, 1, 1, 2, 2]));
  for (const k of gens) params[k] = pick(GEN_MODES[k]);
  if (R() > 0.2) params.plasmaAmt = 0;
  params.fracStyle = pick([0, 0, 1, 2, 3]);
  params.kifsShape = pick([0, 0, 1, 2]);
  if (params.fracMode > 1) { params.fracRe = pick([-0.75, -0.5, -1.75, 0]); params.fracIm = params.fracMode === 3 ? -0.03 : 0; params.fracZoom = params.fracMode === 3 ? 3 : lerp(0, 1, R()); }
  // complex feedback map: occasional, because it reshapes everything
  params.cmapMode = R() < 0.12 ? pick([1, 1, 2, 3, 4]) : 0;
  if (params.cmapMode) params.edgeMode = 1;
  if (params.curveMode === 2 || params.curveMode === 4) { params.curveA = Math.round(params.curveA); params.curveB = Math.max(1, Math.round(params.curveB)); }
  // harmonious hues
  const h = R() * 360;
  const off = pick([0, 30, 60, 120, 180]);
  params.waveHue = h;
  params.shapeHue = (h + off) % 360;
  params.sparkHue = (h + off * 0.5 + 40) % 360;
  params.flashHue = (h + 20) % 360;
  for (const [k, o] of [['curveHue', 90], ['spiralHue', 150], ['rayHue', 30], ['ringHue', 200], ['gridHue', 120], ['blobHue', 300], ['plasmaHue', 60], ['fracHue', 180], ['kifsHue', 45]]) params[k] = (h + o + R() * 60) % 360;
  params.waveSat = lerp(0.4, 0.9, R());
  params.shapeSat = lerp(0.4, 0.9, R());

  const mods = {};
  const n = 4 + Math.floor(R() * 5);
  for (let i = 0; i < n * 3 && Object.keys(mods).length < n; i++) {
    const [k, src, [a, b], neg] = pick(MOD_IDEAS);
    if (mods[k]) continue;
    let amt = lerp(a, b, R());
    if (neg && R() < 0.5) amt = -amt;
    mods[k] = [src, +amt.toFixed(4)];
  }
  return normalizePreset({ name: randomName(), params, mods });
}

export function mutatePreset(pr, amount = 0.5) {
  const out = clonePreset(pr);
  for (const d of PARAMS) {
    if (d.key.startsWith('lfo') && R() > amount) continue;
    const v = out.params[d.key];
    if (d.type === 'enum') {
      if (d.key === 'palette' && R() < amount * 0.2) out.params.palette = Math.floor(R() * PALETTES.length);
      else if (d.key === 'waveMode' && R() < amount * 0.12) out.params.waveMode = pick([1, 2, 3, 4, 5]);
      continue;
    }
    const [lo, hi] = d.rnd && d.rnd[0] !== d.rnd[1] ? d.rnd : [d.min, d.max];
    if (d.rnd && d.rnd[0] === d.rnd[1]) continue; // structural/position params left alone
    let nv = v + (R() * 2 - 1) * amount * (hi - lo) * 0.25;
    if (/Hue$/.test(d.key)) nv = ((v + (R() * 2 - 1) * amount * 60) % 360 + 360) % 360;
    nv = clamp(nv, d.min, d.max);
    if (d.type === 'int') nv = Math.round(nv);
    out.params[d.key] = nv;
  }
  if (R() < amount * 0.25) {
    const k = pick(Object.keys(GEN_MODES));
    out.params[k] = out.params[k] > 0 ? 0 : pick(GEN_MODES[k]);
  }
  for (const k of Object.keys(out.mods)) {
    out.mods[k][1] = clamp(out.mods[k][1] * (1 + (R() * 2 - 1) * amount * 0.5), -1, 1);
  }
  if (R() < amount * 0.5) {
    const [k, src, [a, b]] = pick(MOD_IDEAS);
    if (!out.mods[k]) out.mods[k] = [src, +lerp(a, b, R()).toFixed(4)];
  }
  if (!/·$/.test(out.name) && !out.name.endsWith('(mutated)')) out.name = `${out.name} (mutated)`;
  return out;
}

export { PARAM };
