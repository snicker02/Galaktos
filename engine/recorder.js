// Galaktos — video recording.
//   MP4: WebCodecs H.264 (+ AAC, or Opus where the browser has no AAC encoder, for mic/file input)
//        muxed by engine/mp4.js.
//        Falls back to MediaRecorder MP4 where WebCodecs H.264 isn't available.
//   WebM: MediaRecorder (VP9/VP8 + Opus).
import { Mp4Muxer } from './mp4.js';

const AVC_CODECS = ['avc1.42E033', 'avc1.42E028', 'avc1.42E01F', 'avc1.4D0033', 'avc1.640033'];
const MR_MP4 = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4;codecs=avc1', 'video/mp4'];
const MR_WEBM = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

const even = (n) => Math.max(2, n - (n & 1));

export async function mp4Support() {
  if (window.VideoEncoder && window.VideoFrame) {
    for (const codec of AVC_CODECS) {
      try {
        const r = await VideoEncoder.isConfigSupported({ codec, width: 1280, height: 720, bitrate: 8e6, avc: { format: 'avc' } });
        if (r.supported) return 'webcodecs';
      } catch { /* try next */ }
    }
  }
  if (window.MediaRecorder && MR_MP4.some((t) => MediaRecorder.isTypeSupported(t))) return 'mediarecorder';
  return null;
}

export class Recorder {
  // canvas: the output canvas; audio: AudioEngine; opts: { format: 'mp4'|'webm', mbps }
  constructor(canvas, audio, opts) {
    this.canvas = canvas;
    this.audio = audio;
    this.opts = opts;
    this.active = false;
    this.info = '';
  }

  async start() {
    const fmt = this.opts.format;
    if (fmt === 'mp4') {
      const how = await mp4Support();
      if (how === 'webcodecs') return this._startWebCodecs();
      if (how === 'mediarecorder') return this._startMR(MR_MP4, 'mp4');
      throw new Error('This browser cannot encode MP4. Try current Chrome, Edge or Safari, or choose WebM.');
    }
    return this._startMR(MR_WEBM, 'webm');
  }

  // Called once per rendered frame while recording (WebCodecs path).
  // Frames are placed on a fixed fps grid (constant-rate timing for editors).
  captureFrame() {
    if (!this.active || !this.enc) return;
    const fps = this.fps;
    const idx = Math.round((performance.now() - this.t0) / 1000 * fps);
    if (idx <= this.lastIdx) return;            // rendering faster than the record rate
    if (this.enc.encodeQueueSize > 6) { this.dropped++; return; } // encoder behind: drop rather than balloon memory
    this.lastIdx = idx;
    this.ctx2d.drawImage(this.canvas, 0, 0, this.w, this.h);
    const ts = Math.round(idx * 1e6 / fps);
    const frame = new VideoFrame(this.cap, { timestamp: ts, duration: Math.round(1e6 / fps) });
    const key = this.frames === 0 || ts - this.lastKey >= 2e6;
    if (key) this.lastKey = ts;
    this.enc.encode(frame, { keyFrame: key });
    frame.close();
    this.frames++;
  }

  async _startWebCodecs() {
    // even dimensions (H.264 needs them), capped at 3840 wide
    let w = this.canvas.width, h = this.canvas.height;
    if (w > 3840) { h = Math.round(h * 3840 / w); w = 3840; }
    w = even(w); h = even(h);
    let config = null;
    for (const codec of AVC_CODECS) {
      const c = { codec, width: w, height: h, bitrate: Math.round(this.opts.mbps * 1e6), framerate: this.opts.fps || 60, latencyMode: 'quality', avc: { format: 'avc' } };
      try { const r = await VideoEncoder.isConfigSupported(c); if (r.supported) { config = c; break; } } catch { /* */ }
    }
    if (!config) throw new Error(`H.264 encoding is not supported at ${w}×${h}. Lower the resolution and try again.`);
    this.w = w; this.h = h;
    this.cap = document.createElement('canvas');
    this.cap.width = w; this.cap.height = h;
    this.ctx2d = this.cap.getContext('2d');

    // audio from the mic / file source: AAC where the browser can encode it, else Opus-in-MP4
    let audioCfg = null, audioCodec = null;
    const au = this.audio;
    if (au.mode !== 'synth' && au.srcNode && window.AudioEncoder && window.AudioData) {
      const sr = au.ctx.sampleRate;
      for (const [codec, name] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
        const c = { codec, sampleRate: sr, numberOfChannels: 2, bitrate: 192000 };
        try { const r = await AudioEncoder.isConfigSupported(c); if (r.supported) { audioCfg = c; audioCodec = name; break; } } catch { /* */ }
      }
    }

    this.mux = new Mp4Muxer({ width: w, height: h }, audioCfg ? { codec: audioCodec, sampleRate: audioCfg.sampleRate, channels: 2 } : null);
    this.error = null;
    this.enc = new VideoEncoder({
      output: (chunk, meta) => this.mux.addVideo(chunk, meta),
      error: (e) => { this.error = e; },
    });
    this.enc.configure(config);

    if (audioCfg) {
      this.aenc = new AudioEncoder({
        output: (chunk, meta) => this.mux.addAudio(chunk, meta),
        error: (e) => { this.error = e; },
      });
      this.aenc.configure(audioCfg);
      const ctx = au.ctx;
      this.tap = ctx.createScriptProcessor(4096, 2, 2);
      this.mute = ctx.createGain();
      this.mute.gain.value = 0;
      let samples = 0;
      this.tap.onaudioprocess = (e) => {
        if (!this.active || !this.aenc) return;
        const ib = e.inputBuffer;
        const n = ib.length;
        const L = ib.getChannelData(0);
        const R = ib.numberOfChannels > 1 ? ib.getChannelData(1) : L;
        const data = new Float32Array(n * 2);
        data.set(L, 0); data.set(R, n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: ib.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(samples / ib.sampleRate * 1e6), data });
        samples += n;
        this.aenc.encode(ad);
        ad.close();
      };
      au.srcNode.connect(this.tap);
      this.tap.connect(this.mute);
      this.mute.connect(ctx.destination);
    }

    this.fps = this.opts.fps || 60;
    this.t0 = performance.now();
    this.lastIdx = -1; this.lastKey = -1e9; this.frames = 0; this.dropped = 0;
    this.kind = 'webcodecs';
    this.ext = 'mp4';
    this.active = true;
    this.info = `MP4 · H.264 ${w}×${h} @ ${this.fps} fps${audioCfg ? (audioCodec === 'aac' ? ' + AAC' : ' + Opus') : ''}`;
    return this.info;
  }

  _startMR(types, ext) {
    if (!this.canvas.captureStream || !window.MediaRecorder) throw new Error('Recording is not supported in this browser.');
    const mime = types.find((t) => MediaRecorder.isTypeSupported(t));
    if (!mime) throw new Error(`This browser cannot record ${ext.toUpperCase()}.`);
    const stream = this.canvas.captureStream(60);
    const at = this.audio.recordTrack();
    if (at) stream.addTrack(at);
    this.mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.round(this.opts.mbps * 1e6) });
    this.chunks = [];
    this.mr.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.mr.start(250);
    this.kind = 'mediarecorder';
    this.ext = ext;
    this.mime = mime;
    this.active = true;
    this.info = `${ext.toUpperCase()} · ${mime.split(';')[1] || 'default codecs'}${at ? ' + sound' : ''}`;
    return this.info;
  }

  // Resolves to { blob, ext }
  async stop() {
    if (!this.active) return null;
    this.active = false;
    if (this.kind === 'mediarecorder') {
      await new Promise((res) => { this.mr.onstop = res; this.mr.stop(); });
      return { blob: new Blob(this.chunks, { type: this.mime.split(';')[0] }), ext: this.ext };
    }
    if (this.tap) {
      try { this.audio.srcNode && this.audio.srcNode.disconnect(this.tap); } catch { /* */ }
      this.tap.disconnect(); this.mute.disconnect();
      this.tap.onaudioprocess = null;
    }
    await this.enc.flush();
    this.enc.close();
    if (this.aenc) { await this.aenc.flush(); this.aenc.close(); }
    if (this.error) throw this.error;
    return { blob: this.mux.finalize(), ext: 'mp4', dropped: this.dropped, frames: this.frames };
  }
}
