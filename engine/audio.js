// Galaktos — audio input & analysis.
// Sources: microphone / line-in, an audio file, or the built-in synthetic pulse.
// Produces MilkDrop-style relative band levels (1 = recent average), smoothed
// "_att" versions, a beat envelope, a 512-sample waveform and a 512-bin log spectrum.

const N = 512;
const BANDS = { bass: [20, 250], mid: [250, 2000], treb: [2000, 16000] };

function hash(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x) { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); return hash(i) * (1 - t) + hash(i + 1) * t; }

export const DEFAULT_AUDIO = Object.freeze({
  reactivity: 1,     // scales how far levels swing from 1
  beatThresh: 1.35,  // bass must exceed its average by this ratio for a beat
  beatDecay: 6,      // beat envelope decay rate (1/s)
  attSmooth: 0.9,    // smoothing for *_att
  waveGain: 1,       // waveform display gain (after auto-gain)
  // synth
  bpm: 120, synthEnergy: 1, synthWander: 0.3,
});

export class AudioEngine {
  constructor() {
    this.p = { ...DEFAULT_AUDIO };
    this.mode = 'synth';
    this.ctx = null;
    this.analyser = null;
    this.srcNode = null;
    this.stream = null;
    this.el = null;            // <audio> for file playback
    this.recDest = null;       // MediaStreamDestination for recording with sound
    this.levels = { bass: 1, mid: 1, treb: 1, vol: 1, bass_att: 1, mid_att: 1, treb_att: 1, vol_att: 1, beat: 0 };
    this.wave = new Float32Array(N);
    this.spec = new Float32Array(N);
    this.avg = { bass: 1e-6, mid: 1e-6, treb: 1e-6 };
    this.peakAvg = 0.05;
    this.sinceBeat = 1;
    this.t = 0;
    this.kickE = 0;
    this.status = 'Synth';
  }

  set(obj) { this.p = { ...DEFAULT_AUDIO, ...obj }; }

  _ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0;
      this.timeBuf = new Float32Array(this.analyser.fftSize);
      this.freqBuf = new Float32Array(this.analyser.frequencyBinCount);
      this.specSmooth = new Float32Array(N);
      this.recDest = this.ctx.createMediaStreamDestination ? this.ctx.createMediaStreamDestination() : null;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _disconnect() {
    if (this.srcNode) { try { this.srcNode.disconnect(); } catch { /* */ } this.srcNode = null; }
    if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
    if (this.el) { this.el.pause(); }
  }

  async useMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Microphone input needs https (or localhost).');
    const ctx = this._ensureCtx();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    this._disconnect();
    this.stream = stream;
    this.srcNode = ctx.createMediaStreamSource(stream);
    this.srcNode.connect(this.analyser);           // not to speakers: avoids howl-round
    if (this.recDest) this.srcNode.connect(this.recDest);
    this.mode = 'mic';
    this.status = 'Microphone';
    this._resetStats();
  }

  // Returns the <audio> element so the UI can show its native controls.
  useFile(file) {
    const ctx = this._ensureCtx();
    this._disconnect();
    if (!this.el) {
      this.el = new Audio();
      this.el.loop = true;
      this.el.controls = true;
      this.el.crossOrigin = 'anonymous';
      this.elNode = ctx.createMediaElementSource(this.el);
    }
    if (this.el.src) URL.revokeObjectURL(this.el.src);
    this.el.src = URL.createObjectURL(file);
    this.srcNode = this.elNode;
    this.srcNode.connect(this.analyser);
    this.srcNode.connect(ctx.destination);
    if (this.recDest) this.srcNode.connect(this.recDest);
    this.el.play().catch(() => { /* needs a gesture; controls are shown */ });
    this.mode = 'file';
    this.status = 'File: ' + file.name;
    this._resetStats();
    return this.el;
  }

  useSynth() {
    this._disconnect();
    this.mode = 'synth';
    this.status = 'Synth';
    this._resetStats();
  }

  _resetStats() {
    this.avg = { bass: 1e-6, mid: 1e-6, treb: 1e-6 };
    this.warm = 0;
  }

  kick(amount = 1.5) { this.kickE = Math.max(this.kickE, amount); }

  update(dt) {
    this.t += dt;
    if (this.mode === 'synth' || !this.analyser) this._synth(dt);
    else this._analyse(dt);

    // common: kick injection, smoothing, beat envelope
    const L = this.levels;
    this.kickE *= Math.exp(-dt * 6);
    if (this.kickE > 0.01) { L.bass += this.kickE; L.mid += this.kickE * 0.6; L.treb += this.kickE * 0.4; }
    L.vol = (L.bass + L.mid + L.treb) / 3;
    const a = Math.pow(this.p.attSmooth, dt * 60);
    for (const k of ['bass', 'mid', 'treb', 'vol']) L[k + '_att'] = L[k + '_att'] * a + L[k] * (1 - a);

    this.sinceBeat += dt;
    L.beat *= Math.exp(-dt * this.p.beatDecay);
    if (this._beatNow && this.sinceBeat > 0.18) { L.beat = 1; this.sinceBeat = 0; }
    if (this.kickE > 1.2 && this.sinceBeat > 0.18) { L.beat = 1; this.sinceBeat = 0; }
    this._beatNow = false;
  }

  _analyse(dt) {
    const an = this.analyser, ctx = this.ctx, p = this.p;
    an.getFloatTimeDomainData(this.timeBuf);
    an.getFloatFrequencyData(this.freqBuf);
    const binHz = ctx.sampleRate / an.fftSize;
    const L = this.levels;
    const rate = 1 - Math.pow(0.5, dt / 2.5); // ~2.5 s half-life average
    this.warm = Math.min(1, (this.warm || 0) + dt);
    let total = 0;
    for (const [band, [lo, hi]] of Object.entries(BANDS)) {
      const b0 = Math.max(1, Math.floor(lo / binHz)), b1 = Math.min(this.freqBuf.length - 1, Math.ceil(hi / binHz));
      let e = 0;
      for (let i = b0; i <= b1; i++) { const m = Math.pow(10, this.freqBuf[i] / 20); e += m * m; }
      e /= (b1 - b0 + 1);
      total += e;
      // fast attack into the average for the first second so levels settle quickly
      const r = this.warm < 1 ? 0.2 : rate;
      this.avg[band] = this.avg[band] * (1 - r) + e * r;
      const rel = e / Math.max(this.avg[band], 1e-9);
      L[band] = Math.max(0, 1 + (Math.min(rel, 4) - 1) * p.reactivity);
    }
    if (total < 1e-10) { L.bass = L.mid = L.treb = 0; } // silence
    if (L.bass > p.beatThresh && L.bass > (this._prevBass || 0)) this._beatNow = true;
    this._prevBass = L.bass;

    // waveform: start at a rising zero crossing for a stable picture, auto-gain
    const tb = this.timeBuf;
    let start = 0;
    for (let i = 1; i < tb.length - N; i++) { if (tb[i - 1] < 0 && tb[i] >= 0) { start = i; break; } }
    let peak = 0;
    for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(tb[start + i]));
    this.peakAvg = Math.max(peak, this.peakAvg * Math.pow(0.98, dt * 60)); // fast attack, slow release: no clipping
    const g = p.waveGain * 0.8 / Math.max(this.peakAvg, 0.02);
    for (let i = 0; i < N; i++) this.wave[i] = Math.max(-1, Math.min(1, tb[start + i] * g));

    // log spectrum 30 Hz .. 16 kHz, -100..-20 dB
    const fb = this.freqBuf, s = this.spec, ss = this.specSmooth;
    const lo = Math.log(30 / binHz), hi = Math.log(Math.min(16000, ctx.sampleRate / 2 - binHz) / binHz);
    for (let i = 0; i < N; i++) {
      const bin = Math.min(fb.length - 1, Math.max(1, Math.round(Math.exp(lo + (hi - lo) * i / (N - 1)))));
      const v = Math.max(0, Math.min(1, (fb[bin] + 100) / 80));
      ss[i] = Math.max(v, ss[i] * Math.pow(0.85, dt * 60)); // fast rise, slow fall
      s[i] = ss[i];
    }
  }

  _synth(dt) {
    const p = this.p, t = this.t, L = this.levels;
    const beat = t * p.bpm / 60;
    const pul = (x, sh) => Math.pow(1 - (x - Math.floor(x)), sh);
    const w = p.synthWander, e = p.synthEnergy;
    const n = (o, r) => (vnoise(t * r + o) - 0.5) * 2 * w;
    const pb = pul(beat, 6), pm = pul(beat + 0.5, 5), pt = pul(beat * 2 + 0.25, 8);
    L.bass = Math.max(0, 1 + (0.9 * pb - 0.25 + n(0, 0.5)) * e * p.reactivity);
    L.mid = Math.max(0, 1 + (0.5 * pm - 0.15 + n(11, 0.7)) * e * p.reactivity);
    L.treb = Math.max(0, 1 + (0.4 * pt - 0.1 + n(23, 1.1)) * e * p.reactivity);
    const ph = beat - Math.floor(beat);
    if (ph < (this._prevPh || 0)) this._beatNow = true;
    this._prevPh = ph;

    const amp = Math.min(1, 0.35 + 0.35 * L.bass) * p.waveGain;
    for (let i = 0; i < N; i++) {
      const x = i / N;
      const v = 0.55 * Math.sin((x * 3 + t * 0.4) * 6.2832) + 0.3 * Math.sin((x * 11 - t * 0.9) * 6.2832) * L.mid * 0.6
        + 0.15 * Math.sin((x * 29 + t * 2.1) * 6.2832) * L.treb * 0.6;
      this.wave[i] = Math.max(-1, Math.min(1, v * amp));
    }
    for (let i = 0; i < N; i++) {
      const x = i / N;
      const v = (0.85 - x * 0.6) * (0.55 + 0.3 * L.bass * Math.exp(-x * 8) + 0.25 * L.mid * Math.exp(-((x - 0.45) ** 2) * 40) + 0.2 * L.treb * Math.exp(-((x - 0.8) ** 2) * 30))
        + 0.08 * (vnoise(x * 40 + t * 3) - 0.5);
      this.spec[i] = Math.max(0, Math.min(1, v * 0.8));
    }
  }

  recordTrack() {
    return this.recDest && this.mode !== 'synth' ? this.recDest.stream.getAudioTracks()[0] : null;
  }
}
