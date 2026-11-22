// Galaktos — minimal MP4 (ISO BMFF) muxer for WebCodecs output.
// Writes a progressive (non-fragmented) MP4 with the moov box before mdat
// ("fast start"), one H.264 video track and an optional AAC or Opus audio track.
// Samples are interleaved by time. No dependencies.

const enc = new TextEncoder();

function concat(parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
// ArrayBuffer | ArrayBufferView -> owned Uint8Array copy
function toBytes(d) {
  return d instanceof ArrayBuffer ? new Uint8Array(d).slice() : new Uint8Array(d.buffer, d.byteOffset, d.byteLength).slice();
}
const u8 = (v) => new Uint8Array([v & 255]);
const u16 = (v) => new Uint8Array([(v >>> 8) & 255, v & 255]);
const u24 = (v) => new Uint8Array([(v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
const u32 = (v) => new Uint8Array([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
const str = (s) => enc.encode(s);
const zeros = (n) => new Uint8Array(n);
function box(type, ...content) {
  const body = concat(content);
  return concat([u32(body.length + 8), str(type), body]);
}
function fullbox(type, version, flags, ...content) {
  return box(type, u8(version), u24(flags), ...content);
}
const MATRIX = concat([0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000].map(u32));

// run-length encode sample deltas for stts
function stts(deltas) {
  const runs = [];
  for (const d of deltas) {
    const last = runs[runs.length - 1];
    if (last && last[1] === d) last[0]++; else runs.push([1, d]);
  }
  return fullbox('stts', 0, 0, u32(runs.length), ...runs.map(([c, d]) => concat([u32(c), u32(d)])));
}

// MPEG-4 descriptor with single-byte length (all ours are < 128 bytes)
function desc(tag, ...content) {
  const body = concat(content);
  if (body.length > 127) throw new Error('descriptor too long');
  return concat([u8(tag), u8(body.length), body]);
}

// AudioSpecificConfig for AAC-LC when the encoder doesn't supply one.
export function makeASC(sampleRate, channels) {
  const rates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
  let fi = rates.indexOf(sampleRate);
  if (fi < 0) fi = 4;
  return new Uint8Array([(2 << 3) | (fi >> 1), ((fi & 1) << 7) | (channels << 3)]);
}

export class Mp4Muxer {
  // video: { width, height, timescale } ; audio: { codec: 'aac'|'opus', sampleRate, channels } | null
  constructor(video, audio) {
    this.v = { ...video, timescale: video.timescale || 90000, samples: [], avcC: null };
    // Opus in ISOBMFF always uses a 48 kHz timescale
    this.a = audio ? { ...audio, timescale: audio.codec === 'opus' ? 48000 : audio.sampleRate, samples: [], asc: null } : null;
  }

  // chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata
  addVideo(chunk, meta) {
    if (meta && meta.decoderConfig && meta.decoderConfig.description && !this.v.avcC) this.v.avcC = toBytes(meta.decoderConfig.description);
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    this.v.samples.push({ data, ts: chunk.timestamp, key: chunk.type === 'key' });
  }

  addAudio(chunk, meta) {
    if (!this.a) return;
    if (meta && meta.decoderConfig && meta.decoderConfig.description && !this.a.asc) this.a.asc = toBytes(meta.decoderConfig.description);
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    const fallback = this.a.codec === 'opus' ? 960 : 1024;
    const dur = chunk.duration ? Math.round(chunk.duration * this.a.timescale / 1e6) : fallback;
    this.a.samples.push({ data, ts: chunk.timestamp, dur: dur || fallback });
  }

  _videoTrack(offsets, movieDurMs) {
    const v = this.v, S = v.samples, ts = v.timescale;
    const t0 = S[0].ts;
    const times = S.map((s) => Math.round((s.ts - t0) * ts / 1e6));
    const deltas = times.map((t, i) => (i < times.length - 1 ? Math.max(1, times[i + 1] - t) : 0));
    if (deltas.length) deltas[deltas.length - 1] = deltas.length > 1 ? deltas[deltas.length - 2] : Math.round(ts / 30);
    const dur = deltas.reduce((a, b) => a + b, 0);
    const sync = [];
    S.forEach((s, i) => { if (s.key) sync.push(i + 1); });
    const avc1 = box('avc1',
      zeros(6), u16(1), u16(0), u16(0), zeros(12),
      u16(v.width), u16(v.height), u32(0x00480000), u32(0x00480000), u32(0), u16(1),
      zeros(32), u16(0x0018), u16(0xffff),
      box('avcC', v.avcC));
    const stbl = box('stbl',
      fullbox('stsd', 0, 0, u32(1), avc1),
      stts(deltas),
      fullbox('stss', 0, 0, u32(sync.length), ...sync.map(u32)),
      fullbox('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)),
      fullbox('stsz', 0, 0, u32(0), u32(S.length), ...S.map((s) => u32(s.data.length))),
      fullbox('stco', 0, 0, u32(offsets.length), ...offsets.map(u32)));
    return box('trak',
      fullbox('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(movieDurMs), zeros(8), u16(0), u16(0), u16(0), u16(0), MATRIX, u32(v.width << 16), u32(v.height << 16)),
      box('mdia',
        fullbox('mdhd', 0, 0, u32(0), u32(0), u32(ts), u32(dur), u16(0x55c4), u16(0)),
        fullbox('hdlr', 0, 0, u32(0), str('vide'), zeros(12), str('VideoHandler\0')),
        box('minf',
          fullbox('vmhd', 0, 1, u16(0), u16(0), u16(0), u16(0)),
          box('dinf', fullbox('dref', 0, 0, u32(1), fullbox('url ', 0, 1))),
          stbl)));
  }

  _audioTrack(offsets, movieDurMs) {
    const a = this.a, S = a.samples;
    const deltas = S.map((s) => s.dur);
    const dur = deltas.reduce((x, y) => x + y, 0);
    let entry;
    if (a.codec === 'opus') {
      // dOps from the encoder's OpusHead (little-endian) when present
      let preSkip = 312, inRate = a.sampleRate;
      const h = a.asc;
      if (h && h.length >= 19 && String.fromCharCode(...h.slice(0, 8)) === 'OpusHead') {
        preSkip = h[10] | (h[11] << 8);
        inRate = (h[12] | (h[13] << 8) | (h[14] << 16) | (h[15] << 24)) >>> 0;
      }
      const dOps = box('dOps', u8(0), u8(a.channels), u16(preSkip), u32(inRate), u16(0), u8(0));
      entry = box('Opus', zeros(6), u16(1), zeros(8), u16(a.channels), u16(16), u16(0), u16(0), u32(48000 << 16), dOps);
    } else {
      const asc = a.asc || makeASC(a.sampleRate, a.channels);
      const esds = fullbox('esds', 0, 0,
        desc(0x03, u16(2), u8(0),
          desc(0x04, u8(0x40), u8(0x15), u24(0), u32(192000), u32(192000),
            desc(0x05, asc)),
          desc(0x06, u8(0x02))));
      entry = box('mp4a', zeros(6), u16(1), zeros(8), u16(a.channels), u16(16), u16(0), u16(0), u32(a.sampleRate << 16), esds);
    }
    const stbl = box('stbl',
      fullbox('stsd', 0, 0, u32(1), entry),
      stts(deltas),
      fullbox('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)),
      fullbox('stsz', 0, 0, u32(0), u32(S.length), ...S.map((s) => u32(s.data.length))),
      fullbox('stco', 0, 0, u32(offsets.length), ...offsets.map(u32)));
    return box('trak',
      fullbox('tkhd', 0, 3, u32(0), u32(0), u32(2), u32(0), u32(movieDurMs), zeros(8), u16(0), u16(1), u16(0x0100), u16(0), MATRIX, u32(0), u32(0)),
      box('mdia',
        fullbox('mdhd', 0, 0, u32(0), u32(0), u32(a.timescale), u32(dur), u16(0x55c4), u16(0)),
        fullbox('hdlr', 0, 0, u32(0), str('soun'), zeros(12), str('SoundHandler\0')),
        box('minf',
          fullbox('smhd', 0, 0, u16(0), u16(0)),
          box('dinf', fullbox('dref', 0, 0, u32(1), fullbox('url ', 0, 1))),
          stbl)));
  }

  finalize() {
    const v = this.v, a = this.a;
    if (!v.samples.length) throw new Error('No video frames were recorded.');
    if (!v.avcC) throw new Error('Encoder did not provide an H.264 configuration.');
    const useAudio = a && a.samples.length > 0;

    // interleave by timestamp
    const t0 = v.samples[0].ts;
    const order = v.samples.map((s, i) => ({ k: 'v', i, t: s.ts - t0, s }));
    if (useAudio) {
      const a0 = a.samples[0].ts;
      a.samples.forEach((s, i) => order.push({ k: 'a', i, t: s.ts - a0, s }));
    }
    order.sort((x, y) => x.t - y.t || (x.k === 'v' ? -1 : 1));
    const rel = { v: new Array(v.samples.length), a: useAudio ? new Array(a.samples.length) : [] };
    let off = 0;
    for (const o of order) { rel[o.k][o.i] = off; off += o.s.data.length; }
    const mdatSize = off + 8;
    if (mdatSize > 0xffffffff) throw new Error('Recording too large for MP4 (over 4 GB).');

    const lastV = v.samples[v.samples.length - 1].ts - t0;
    const vDurMs = Math.round(lastV / 1000) + 33;
    const aDurMs = useAudio ? Math.round(a.samples.reduce((x, s) => x + s.dur, 0) / a.timescale * 1000) : 0;
    const movieDurMs = Math.max(vDurMs, aDurMs);

    const ftyp = box('ftyp', str('isom'), u32(0x200), str('isom'), str('iso2'), str('avc1'), str('mp41'));
    const build = (base) => {
      const tracks = [this._videoTrack(rel.v.map((x) => x + base), movieDurMs)];
      if (useAudio) tracks.push(this._audioTrack(rel.a.map((x) => x + base), movieDurMs));
      return box('moov',
        fullbox('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(movieDurMs), u32(0x00010000), u16(0x0100), zeros(10), MATRIX, zeros(24), u32(useAudio ? 3 : 2)),
        ...tracks);
    };
    const moovSize = build(0).length;
    const moov = build(ftyp.length + moovSize + 8);

    const parts = [ftyp, moov, concat([u32(mdatSize), str('mdat')])];
    for (const o of order) parts.push(o.s.data);
    return new Blob(parts, { type: 'video/mp4' });
  }
}
