// Galaktos — WebGL1 feedback renderer.
// Ping-pongs two framebuffers through the warp/emit shader, then composites to screen.
import { VERT, FEEDBACK, COMPOSITE, COPY } from './shaders.js';
import { SLOTS, NUM_VEC4, PALETTES } from './schema.js';

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('Shader compile failed: ' + log);
  }
  return s;
}

function program(gl, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Program link failed: ' + gl.getProgramInfoLog(p));
  const uni = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    const name = info.name.replace(/\[0\]$/, '');
    uni[name] = gl.getUniformLocation(p, name);
  }
  return { p, uni };
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL is not available.');
    this.gl = gl;

    // Prefer half-float feedback (smoother trails); fall back to 8-bit with dithering.
    this.texType = gl.UNSIGNED_BYTE;
    const hf = gl.getExtension('OES_texture_half_float');
    gl.getExtension('OES_texture_half_float_linear');
    gl.getExtension('EXT_color_buffer_half_float');
    if (hf && gl.getExtension('OES_texture_half_float_linear')) {
      if (this._fboWorks(hf.HALF_FLOAT_OES)) this.texType = hf.HALF_FLOAT_OES;
    }
    this.precision = this.texType === gl.UNSIGNED_BYTE ? '8-bit' : 'half-float';

    const maxFrag = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    if (maxFrag < NUM_VEC4 + 8) throw new Error(`This GPU allows ${maxFrag} fragment uniform vectors; Galaktos needs ${NUM_VEC4 + 8}.`);
    this.fb = program(gl, FEEDBACK());
    this.comp = program(gl, COMPOSITE());
    this.copy = program(gl, COPY);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.audioTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    this._texParams(gl.LINEAR);
    this.audioData = new Uint8Array(512 * 2).fill(128);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 512, 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.audioData);

    this.U = new Float32Array(NUM_VEC4 * 4);
    this.slotIndex = Object.fromEntries(SLOTS.map((k, i) => [k, i]));
    this.targets = [];
    this.simW = this.simH = 0;
    this.frame = 0;
  }

  _texParams(filter) {
    const gl = this.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  _fboWorks(type) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, type, null);
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE && !gl.getError();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(f);
    gl.deleteTexture(t);
    return ok;
  }

  _target(w, h) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    this._texParams(gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, this.texType, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h };
  }

  // Output size in device pixels; sim = feedback buffer scale relative to output.
  resize(outW, outH, simScale) {
    const gl = this.gl;
    this.canvas.width = outW;
    this.canvas.height = outH;
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const w = Math.max(16, Math.min(max, Math.round(outW * simScale)));
    const h = Math.max(16, Math.min(max, Math.round(outH * simScale)));
    if (w === this.simW && h === this.simH) return;
    const old = this.targets;
    this.targets = [this._target(w, h), this._target(w, h)];
    // carry the image over so a resize doesn't wipe the picture
    if (old.length) {
      gl.useProgram(this.copy.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.targets[0].fbo);
      gl.viewport(0, 0, w, h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, old[0].tex);
      gl.uniform1i(this.copy.uni.uSrc, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      for (const t of old) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); }
    }
    this.simW = w; this.simH = h;
  }

  clear() {
    const gl = this.gl;
    for (const t of this.targets) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // wave: Float32Array(512) in -1..1, spec: Float32Array(512) in 0..1
  setAudio(wave, spec) {
    const d = this.audioData;
    for (let i = 0; i < 512; i++) {
      d[i] = Math.max(0, Math.min(255, Math.round(128 + wave[i] * 127)));
      d[512 + i] = Math.max(0, Math.min(255, Math.round(spec[i] * 255)));
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 2, gl.LUMINANCE, gl.UNSIGNED_BYTE, d);
  }

  _packUniforms(values) {
    const U = this.U;
    for (let i = 0; i < SLOTS.length; i++) {
      const v = values[SLOTS[i]];
      U[i] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
    }
  }

  _common(prog, w, h, time) {
    const gl = this.gl;
    gl.uniform4fv(prog.uni.U, this.U);
    if (prog.uni.uRes) gl.uniform2f(prog.uni.uRes, w, h);
    if (prog.uni.uTime) gl.uniform1f(prog.uni.uTime, time);
    if (prog.uni.uFrame) gl.uniform1f(prog.uni.uFrame, this.frame % 10000);
  }

  // Advance the feedback loop one frame.
  step(values, time) {
    const gl = this.gl;
    this._packUniforms(values);
    const [src, dst] = this.targets;
    gl.useProgram(this.fb.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, dst.w, dst.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(this.fb.uni.uPrev, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    gl.uniform1i(this.fb.uni.uAudio, 1);
    this._common(this.fb, dst.w, dst.h, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.targets = [dst, src];
    this.frame++;
  }

  // Draw the current feedback image to the canvas with the output grading.
  present(values, time) {
    const gl = this.gl;
    this._packUniforms(values);
    const src = this.targets[0];
    gl.useProgram(this.comp.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(this.comp.uni.uSrc, 0);
    this._common(this.comp, this.canvas.width, this.canvas.height, time);
    const pal = PALETTES[Math.round(values.palette)] || PALETTES[0];
    const u = this.comp.uni;
    if (pal.abcd) {
      gl.uniform3fv(u.uPalA, pal.abcd[0]); gl.uniform3fv(u.uPalB, pal.abcd[1]);
      gl.uniform3fv(u.uPalC, pal.abcd[2]); gl.uniform3fv(u.uPalD, pal.abcd[3]);
      gl.uniform1f(u.uPalOn, 1);
    } else gl.uniform1f(u.uPalOn, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
