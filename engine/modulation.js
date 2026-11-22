// Galaktos — modulation: turns a preset (base values + mod routes) plus the
// current audio/LFO state into the concrete values the renderer draws with.
//
// Preset format:
//   { name, params: { key: base, … }, mods: { key: [source, amount], … } }
// amount is a fraction of the parameter's range: value = base + amount * (max-min) * source

import { PARAMS, PARAM, DEFAULTS } from './schema.js';

function hash(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x) { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); return hash(i) * (1 - t) + hash(i + 1) * t; }
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function normalizePreset(pr) {
  const out = { name: String(pr && pr.name || 'Untitled'), params: {}, mods: {} };
  const ps = (pr && pr.params) || {};
  for (const d of PARAMS) {
    const v = Number(ps[d.key]);
    out.params[d.key] = Number.isFinite(v) ? v : d.def;
  }
  const ms = (pr && pr.mods) || {};
  for (const [k, m] of Object.entries(ms)) {
    if (!PARAM[k] || PARAM[k].nomod || !Array.isArray(m) || !m[0]) continue;
    const amt = Number(m[1]);
    if (Number.isFinite(amt) && amt !== 0) out.mods[k] = [String(m[0]), clamp(amt, -1, 1)];
  }
  if (pr && pr.author) out.author = String(pr.author);
  return out;
}

export function clonePreset(p) { return JSON.parse(JSON.stringify(p)); }

// Compact form for export: only values that differ from defaults.
export function compactPreset(p) {
  const params = {};
  for (const d of PARAMS) if (Math.abs(p.params[d.key] - d.def) > 1e-9) params[d.key] = +p.params[d.key].toFixed(6);
  return { name: p.name, params, mods: clonePreset(p.mods) };
}

export class Modulator {
  constructor() {
    this.src = { bass: 0, mid: 0, treb: 0, vol: 0, bass_att: 0, mid_att: 0, treb_att: 0, beat: 0, lfo1: 0, lfo2: 0, lfo3: 0, noise: 0, ramp: 0 };
    this.ph = { lfo1: 0, lfo2: 0, lfo3: 0 };
    this.t = 0;
  }

  // levels: audio engine levels; rates from the active preset's LFO params
  update(dt, levels, rates) {
    this.t += dt;
    const s = this.src;
    const rel = (v) => clamp(v - 1, -1, 2);
    s.bass = rel(levels.bass); s.mid = rel(levels.mid); s.treb = rel(levels.treb); s.vol = rel(levels.vol);
    s.bass_att = rel(levels.bass_att); s.mid_att = rel(levels.mid_att); s.treb_att = rel(levels.treb_att);
    s.beat = levels.beat;
    this.ph.lfo1 = (this.ph.lfo1 + dt * rates.lfo1Rate) % 1;
    this.ph.lfo2 = (this.ph.lfo2 + dt * rates.lfo2Rate) % 1;
    this.ph.lfo3 = (this.ph.lfo3 + dt * rates.lfo3Rate) % 1;
    s.lfo1 = Math.sin(this.ph.lfo1 * Math.PI * 2);
    s.lfo2 = 1 - 4 * Math.abs(this.ph.lfo2 - 0.5);
    s.lfo3 = Math.sin(this.ph.lfo3 * Math.PI * 2);
    s.noise = (vnoise(this.t * 0.25) - 0.5) * 2;
    s.ramp = ((this.t / 30) % 1) * 2 - 1;
  }

  // Evaluate one preset into concrete values (written into out).
  evaluate(pr, out = {}) {
    const s = this.src;
    for (const d of PARAMS) {
      let v = pr.params[d.key];
      const m = pr.mods[d.key];
      if (m) {
        const sv = s[m[0]];
        if (sv !== undefined) v += m[1] * (d.max - d.min) * sv;
      }
      v = clamp(v, d.min, d.max);
      if (d.type !== 'range') v = Math.round(v);
      out[d.key] = v;
    }
    return out;
  }
}

// Blend two evaluated value sets. Enums/ints snap at the midpoint.
export function mixValues(a, b, k, out = {}) {
  for (const d of PARAMS) {
    const x = a[d.key], y = b[d.key];
    if (d.type === 'range') out[d.key] = x + (y - x) * k;
    else if (d.type === 'int' && !d.nomod) out[d.key] = Math.round(x + (y - x) * k);
    else out[d.key] = k < 0.5 ? x : y;
  }
  return out;
}

export { DEFAULTS };
