// Galaktos — GLSL ES 1.00 (WebGL1) shaders.
import { glslDefines, NUM_VEC4 } from './schema.js';

export const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`;

const HEAD = () => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform vec4 U[${NUM_VEC4}];
uniform vec2 uRes;
uniform float uTime;
uniform float uFrame;
${glslDefines()}
#define TAU 6.28318530718

vec3 hsv(float h, float s, float v){
  vec3 k = clamp(abs(mod(h*6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}
vec3 hueRotate(vec3 c, float a){
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c*ca + cross(k,c)*sin(a) + k*dot(k,c)*(1.0-ca);
}
float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 rot2(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c*p.x - s*p.y, s*p.x + c*p.y); }
float mirror1(float x){ float m = mod(x, 2.0); return m > 1.0 ? 2.0 - m : m; }
`;

// ---------------- feedback / warp / emit pass ----------------
export const FEEDBACK = () => HEAD() + `
uniform sampler2D uPrev;
uniform sampler2D uAudio; // 512x2 luminance: row 0 waveform (0.5 = zero), row 1 spectrum

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = hash12(i), b = hash12(i+vec2(1.0,0.0)), c = hash12(i+vec2(0.0,1.0)), d = hash12(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float waveAt(float x){ return texture2D(uAudio, vec2(x, 0.25)).r*2.0 - 1.0; }
float specAt(float x){ return texture2D(uAudio, vec2(x, 0.75)).r; }

vec2 edgeUV(vec2 uv){
  if (P_edgeMode < 0.5) return clamp(uv, 0.0, 1.0);
  if (P_edgeMode < 1.5) return vec2(mirror1(uv.x), mirror1(uv.y));
  return fract(uv);
}
vec3 tap(vec2 uv){ return texture2D(uPrev, edgeUV(uv)).rgb; }

float sdPoly(vec2 p, float r, float n){
  if (n < 2.5) return length(p) - r;
  float b = TAU / n;
  float a = atan(p.x, p.y);
  return cos(floor(0.5 + a/b)*b - a) * length(p) - r;
}



// complex sin for the feedback map (GLSL ES 1.00 has no sinh/cosh)
vec2 csin(vec2 z){
  float e = exp(z.y), ie = 1.0 / e;
  return vec2(sin(z.x) * 0.5 * (e + ie), cos(z.x) * 0.5 * (e - ie));
}
// distance from p to segment ab
float sdSeg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * h);
}
// parametric curves, normalised to roughly the unit disc
vec2 curvePt(float t){
  float A = P_curveA, B = P_curveB, C = P_curveC, ph = P_curvePhase;
  if (P_curveMode < 1.5) return vec2(sin(A*t + ph), sin(B*t));
  if (P_curveMode < 2.5){ float r = cos((A/B)*t + ph); return vec2(cos(t), sin(t)) * r; }
  if (P_curveMode < 3.5){
    float e = exp(-P_curveDamp * t);
    return 0.5 * e * vec2(sin(A*t + ph) + sin(C*t), sin(B*t) + sin(C*t + 1.3 + ph*0.5));
  }
  // spirograph (hypotrochoid): fixed ring radius 1, rolling radius B/A, pen distance C*r
  float r = B / max(A, 0.001), R1 = 1.0 - r, d = C * r;
  float k = R1 / max(r, 0.001);
  vec2 q = vec2(R1*cos(t) + d*cos(k*t + ph), R1*sin(t) - d*sin(k*t + ph));
  return q / max(abs(R1) + abs(d), 0.001);
}

void main(){
  float asp = uRes.x / uRes.y;
  vec2 px = 1.0 / uRes;
  vec2 c = vec2(P_cx, P_cy);

  // ---- warp: map this pixel back to where it came from last frame ----
  vec2 p = vUv - c; p.x *= asp;
  // complex feedback map: sampling last frame through f(z) builds fractals over successive frames
  if (P_cmapMode > 0.5){
    vec2 z = p * P_cmapScale;
    vec2 w;
    if (P_cmapMode < 1.5) w = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
    else if (P_cmapMode < 2.5){ float x2 = z.x*z.x, y2 = z.y*z.y; w = vec2(z.x*(x2 - 3.0*y2), z.y*(3.0*x2 - y2)); }
    else if (P_cmapMode < 3.5) w = vec2(z.x, -z.y) / max(dot(z, z), 1e-4);
    else w = csin(z);
    w += vec2(P_cmapRe, P_cmapIm);
    p = mix(p, w / P_cmapScale, P_cmapMix);
  }
  if (P_fold >= 1.5){
    float r0 = length(p);
    float a = atan(p.y, p.x) + radians(P_foldRot) + P_foldPhase;
    float seg = TAU / floor(P_fold + 0.5);
    a = mod(a, seg);
    a = min(a, seg - a);
    p = vec2(cos(a), sin(a)) * r0;
  }
  float r = length(p);
  float z = P_zoom + P_lens*(r - 0.5) + P_ripple*sin(r*P_rippleFreq - uTime*P_rippleSpeed);
  p = rot2(p, -(P_rot + P_swirl*r*2.0));
  p /= max(z, 0.05);
  p /= vec2(P_stretchX, P_stretchY);
  if (P_flow > 0.0){
    vec2 q = p*P_flowScale + uTime*P_flowSpeed;
    p += P_flow * vec2(vnoise(q) - 0.5, vnoise(q + 17.31) - 0.5) * 2.0;
  }
  p.x /= asp;
  vec2 uv = p + c - vec2(P_dx, P_dy);

  // ---- feedback filtering ----
  vec3 col = tap(uv);
  if (P_blur + P_sharpen + P_edge > 0.0){
    float s = 1.0 + P_blur*2.0;
    vec3 l = tap(uv - vec2(px.x*s, 0.0)), rr = tap(uv + vec2(px.x*s, 0.0));
    vec3 d = tap(uv - vec2(0.0, px.y*s)), u = tap(uv + vec2(0.0, px.y*s));
    vec3 avg = (l + rr + d + u) * 0.25;
    vec3 base = col;
    col = mix(col, (col + l + rr + d + u) * 0.2, clamp(P_blur, 0.0, 1.0));
    col += (base - avg) * P_sharpen;
    col += (abs(rr - l) + abs(u - d)) * P_edge * 0.5;
  }
  if (P_echoMix > 0.0){
    vec2 e = (uv - c) / max(P_echoZoom, 0.05) + c;
    col = mix(col, tap(e), P_echoMix);
  }
  if (P_hueDrift != 0.0) col = hueRotate(col, radians(P_hueDrift));
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, P_satGain);
  col = col * P_decay + P_bright;

  // ---- emitters ----
  vec3 emit = vec3(0.0);

  if (P_waveMode > 0.5){
    vec2 q = vUv - vec2(P_waveX, P_waveY); q.x *= asp;
    q = rot2(q, -(radians(P_waveRot) + P_wavePhase));
    float th = max(P_waveThick, 1.2*px.y);
    float inten = 0.0;
    float hu = 0.0;
    if (P_waveMode < 1.5){            // ring
      float a = atan(q.y, q.x) / TAU + 0.5;
      float u = abs(fract(a)*2.0 - 1.0);
      float R = P_waveSize + P_waveAmp * waveAt(u) * 0.25;
      inten = smoothstep(th, 0.0, abs(length(q) - R));
      hu = u;
    } else if (P_waveMode < 3.5){     // line / twin lines
      float u = clamp(q.x / asp + 0.5, 0.0, 1.0);
      float y = P_waveAmp * waveAt(u) * 0.25;
      float d = P_waveMode < 2.5 ? abs(q.y - y)
                                : min(abs(q.y - P_waveSize*0.5 - y), abs(q.y + P_waveSize*0.5 + y));
      inten = smoothstep(th, 0.0, d) * step(abs(q.x), asp*0.5);
      hu = u;
    } else if (P_waveMode < 4.5){     // spectrum ring
      float a = atan(q.y, q.x) / TAU + 0.5;
      float u = abs(fract(a)*2.0 - 1.0);
      float R = P_waveSize + P_waveAmp * specAt(u) * 0.3;
      float L = length(q);
      inten = max(smoothstep(th, 0.0, abs(L - R)), 0.25 * step(P_waveSize, L) * step(L, R));
      hu = u;
    } else {                          // spectrum bars, mirrored around the centre line
      float u = q.x / asp + 0.5;
      float nb = 48.0;
      float cell = fract(u * nb);
      float id = (floor(u * nb) + 0.5) / nb;
      float h = P_waveAmp * specAt(abs(id*2.0 - 1.0)) * 0.5 + th;
      inten = step(abs(q.y), h) * step(0.12, cell) * step(cell, 0.88) * step(0.0, u) * step(u, 1.0);
      hu = abs(id*2.0 - 1.0);
    }
    emit += hsv((P_waveHue + hu*P_waveHueSpread)/360.0, P_waveSat, P_waveBright) * inten;
  }

  if (P_shapeMode > 0.5){
    float n = floor(P_shapeCount + 0.5);
    float th = max(P_shapeThick, 1.2*px.y);
    for (int i = 0; i < 12; i++){
      float fi = float(i);
      if (fi >= n) break;
      float oa = P_orbitPhase + fi * TAU / n;
      vec2 q = vUv - vec2(P_shapeX, P_shapeY); q.x *= asp;
      q -= P_shapeOrbit * vec2(cos(oa), sin(oa));
      q = rot2(q, -(radians(P_shapeRot) + P_shapePhase));
      float d = sdPoly(q, P_shapeSize, floor(P_shapeSides + 0.5));
      float inten;
      if (P_shapeMode < 1.5) inten = smoothstep(th, 0.0, abs(d));
      else if (P_shapeMode < 2.5) inten = smoothstep(1.5*px.y, 0.0, d);
      else inten = exp(-abs(d) / (th*3.0)) * 0.8;
      emit += hsv((P_shapeHue + fi*P_shapeHueSpread/n)/360.0, P_shapeSat, P_shapeBright) * inten;
    }
  }

  if (P_sparkCount > 0.5){
    float n = floor(P_sparkCount + 0.5);
    for (int i = 0; i < 32; i++){
      float fi = float(i);
      if (fi >= n) break;
      float h1 = hash12(vec2(fi, 1.7)), h2 = hash12(vec2(fi, 7.3)), h3 = hash12(vec2(fi, 13.1)), h4 = hash12(vec2(fi, 23.9));
      vec2 pos = vec2(sin(P_sparkPhase*(0.5 + h1) + h2*TAU), cos(P_sparkPhase*(0.6 + h3) + h4*TAU)*0.8) * P_sparkSpread;
      vec2 q = vUv - 0.5; q.x *= asp; q -= pos;
      float inten = smoothstep(P_sparkSize, 0.0, length(q));
      emit += hsv((P_sparkHue + (h1 - 0.5)*P_sparkHueSpread)/360.0, 0.75, P_sparkBright) * inten;
    }
  }

  if (P_flash > 0.0){
    vec2 q = vUv - c; q.x *= asp;
    emit += hsv(P_flashHue/360.0, 0.6, P_flash) * exp(-dot(q,q) / max(P_flashSize*P_flashSize, 1e-5));
  }


  // ---- geometry & field generators (centred on screen) ----
  vec2 g = vUv - 0.5; g.x *= asp;
  float gr = length(g);
  float ga = atan(g.y, g.x);

  if (P_curveMode > 0.5 && gr < P_curveSize * 1.15 + 0.05){
    float th = max(P_curveThick, 1.2*px.y);
    vec2 gq = rot2(g, -P_curveRotPhase) / max(P_curveSize, 1e-3);
    float T = TAU * floor(P_curveLoops + 0.5);
    float dmin = 1e9, tmin = 0.0;
    vec2 prev = curvePt(0.0);
    for (int i = 1; i <= 96; i++){
      float t = T * float(i) / 96.0;
      vec2 cur = curvePt(t);
      float d = sdSeg(gq, prev, cur);
      if (d < dmin){ dmin = d; tmin = t; }
      prev = cur;
    }
    float inten = smoothstep(th, 0.0, dmin * P_curveSize);
    emit += hsv((P_curveHue + P_curveHueSpread * tmin / max(T, 1e-3)) / 360.0, 0.8, P_curveBright) * inten;
  }

  if (P_spiralMode > 0.5 && gr < P_spiralReach + 0.05){
    float a = ga + P_spiralPhase;
    float arms = floor(P_spiralArms + 0.5);
    float rr = P_spiralMode < 1.5 ? log(gr + 1e-3) * P_spiralTwist : gr * P_spiralTwist * 6.0;
    float v = a * arms / TAU + rr;
    float d = abs(fract(v + 0.5) - 0.5);
    float inten = smoothstep(P_spiralThick, P_spiralThick * 0.4, d)
                * smoothstep(0.0, 0.03, gr) * (1.0 - smoothstep(P_spiralReach * 0.7, P_spiralReach, gr));
    emit += hsv((P_spiralHue + P_spiralHueSpread * gr / max(P_spiralReach, 1e-3)) / 360.0, 0.8, P_spiralBright) * inten;
  }

  if (P_rayMode > 0.5){
    float n = floor(P_rayCount + 0.5);
    float seg = TAU / n;
    float a = mod(ga + P_rayPhase, TAU);
    float id = floor(a / seg);
    float local = abs(mod(a, seg) - seg * 0.5) / (seg * 0.5);   // 0 at beam centre, 1 midway
    float outer = P_rayOuter;
    if (P_rayMode > 1.5) outer = P_rayInner + (P_rayOuter - P_rayInner) * specAt(abs(fract((id + 0.5) / n) * 2.0 - 1.0));
    float radial = smoothstep(P_rayInner, P_rayInner + 0.02, gr) * (1.0 - smoothstep(outer * 0.75, outer + 1e-3, gr));
    float inten = smoothstep(P_rayWidth, P_rayWidth * 0.5, local) * radial;
    emit += hsv((P_rayHue + P_rayHueSpread * id / n) / 360.0, 0.75, P_rayBright) * inten;
  }

  if (P_ringMode > 0.5){
    float rr = P_ringMode < 1.5 ? gr : (P_ringMode < 2.5 ? max(abs(g.x), abs(g.y)) : (abs(g.x) + abs(g.y)) * 0.7071);
    float x = rr * P_ringFreq - P_ringPhase;
    float d = abs(fract(x + 0.5) - 0.5);
    float inten = smoothstep(P_ringThick, P_ringThick * 0.4, d) * exp(-rr * P_ringFade);
    emit += hsv((P_ringHue + P_ringHueSpread * fract(floor(x) * 0.618)) / 360.0, 0.75, P_ringBright) * inten;
  }

  if (P_gridMode > 0.5){
    vec2 q = rot2(g, P_gridPhase) * P_gridScale;
    float inten;
    if (P_gridMode < 1.5){
      vec2 f = abs(fract(q + 0.5) - 0.5);
      inten = smoothstep(P_gridThick, P_gridThick * 0.4, min(f.x, f.y));
    } else if (P_gridMode < 2.5){
      inten = smoothstep(P_gridThick * 2.5, P_gridThick * 1.5, length(fract(q) - 0.5));
    } else {
      const vec2 hs = vec2(1.0, 1.7320508);
      vec2 a = mod(q, hs) - hs * 0.5, b = mod(q - hs * 0.5, hs) - hs * 0.5;
      vec2 h = dot(a, a) < dot(b, b) ? a : b;
      vec2 ah = abs(h);
      float hd = max(dot(ah, normalize(hs)), ah.x);
      inten = smoothstep(P_gridThick, P_gridThick * 0.4, abs(0.5 - hd));
    }
    inten *= exp(-gr * P_gridFade);
    emit += hsv((P_gridHue + P_gridHueSpread * gr) / 360.0, 0.7, P_gridBright) * inten;
  }

  if (P_blobMode > 0.5){
    float n = floor(P_blobCount + 0.5);
    float field = 0.0, best = 0.0, bestId = 0.0;
    for (int i = 0; i < 8; i++){
      float fi = float(i);
      if (fi >= n) break;
      vec2 pos = P_blobSpread * vec2(sin(P_blobPhase * (0.6 + 0.13*fi) + fi*2.1), cos(P_blobPhase * (0.5 + 0.17*fi) + fi*1.3));
      vec2 dq = g - pos;
      float f = P_blobSize * P_blobSize / (dot(dq, dq) + 1e-5);
      field += f;
      if (f > best){ best = f; bestId = fi; }
    }
    float lf = log(field + 1e-6);
    float inten;
    if (P_blobMode < 1.5) inten = smoothstep(-0.05, 0.05, lf);
    else if (P_blobMode < 2.5) inten = smoothstep(0.12, 0.0, abs(lf));
    else inten = min(field, 3.0) * 0.35;
    emit += hsv((P_blobHue + P_blobHueSpread * bestId / n) / 360.0, 0.75, P_blobBright) * inten;
  }

  if (P_plasmaAmt > 0.0){
    vec2 q = g * P_plasmaScale;
    float t = P_plasmaPhase;
    float v = sin(q.x + t) + sin(q.y * 1.3 - t * 0.7) + sin((q.x + q.y) * 0.7 + t * 1.1) + sin(length(q) * 1.5 - t);
    v *= 0.25;
    float mask = mix(1.0, smoothstep(0.25, 0.75, gr), P_plasmaEdge);
    emit += hsv((P_plasmaHue + P_plasmaHueSpread * v) / 360.0, 0.8, 1.0) * (0.5 + 0.5*v) * P_plasmaAmt * mask;
  }


  // ---- fractals ----
  if (P_fracMode > 0.5 && gr < P_fracReach + 0.05){
    vec2 q = rot2(g, P_fracPhase) * (3.0 / exp2(P_fracZoom));
    vec2 z, cc;
    if (P_fracMode < 1.5){ z = q; cc = vec2(P_fracRe, P_fracIm); }
    else { z = vec2(0.0); cc = q + vec2(P_fracRe, P_fracIm); }
    float pw = (P_fracMode < 1.5 || P_fracMode > 3.5) ? max(P_fracPower, 2.0) : 2.0;
    float n = floor(P_fracIter + 0.5);
    float it = 0.0, esc = 0.0;
    for (int i = 0; i < 96; i++){
      if (float(i) >= n) break;
      if (P_fracMode > 2.5 && P_fracMode < 3.5) z = abs(z);          // Burning Ship
      if (pw < 2.001) z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
      else { float r = length(z), a = atan(z.y, z.x); z = pow(max(r, 1e-6), pw) * vec2(cos(a*pw), sin(a*pw)); }
      z += cc;
      if (dot(z, z) > 256.0){ esc = 1.0; break; }
      it += 1.0;
    }
    float mu = it + 1.0 - log(log(max(length(z), 1.0001))) / log(pw);   // smooth iteration count
    float t = clamp(mu / n, 0.0, 1.0);
    float inten, hu;
    if (P_fracStyle < 0.5) inten = esc * t * t * t;
    else if (P_fracStyle < 1.5) inten = esc * sqrt(t);
    else if (P_fracStyle < 2.5) inten = esc * smoothstep(0.36, 0.5, abs(fract(mu * 0.25) - 0.5)) * sqrt(t);
    else inten = (1.0 - esc) * (0.45 + 0.45 * sin(length(z) * 7.0));
    hu = esc > 0.5 ? t : fract(length(z) * 0.5);
    inten *= 1.0 - smoothstep(P_fracReach * 0.7, P_fracReach, gr);
    emit += hsv((P_fracHue + P_fracHueSpread * hu) / 360.0, 0.8, P_fracBright) * inten;
  }

  if (P_kifsMode > 0.5 && gr < P_kifsSize * 2.3){
    vec2 q = rot2(g, P_kifsPhase) / max(P_kifsSize, 1e-3);
    float k = P_kifsScale, off = P_kifsOffset;
    float tw = radians(P_kifsAngle) + P_kifsTwistPhase;
    float n = floor(P_kifsIter + 0.5), sym = floor(P_kifsSym + 0.5);
    float sc = 1.0, trap = 1e9;
    for (int i = 0; i < 10; i++){
      if (float(i) >= n) break;
      if (P_kifsMode < 1.5){            // Sierpinski: scale towards the nearest triangle vertex
        vec2 v1 = vec2(0.0, 1.0) * off, v2 = vec2(-0.8660254, -0.5) * off, v3 = vec2(0.8660254, -0.5) * off;
        float d1 = dot(q - v1, q - v1), d2 = dot(q - v2, q - v2), d3 = dot(q - v3, q - v3);
        vec2 v = d1 < d2 ? (d1 < d3 ? v1 : v3) : (d2 < d3 ? v2 : v3);
        q = q * k - v * (k - 1.0);
      } else if (P_kifsMode < 2.5){     // square fold (carpet-like)
        q = abs(q);
        if (q.x < q.y) q = q.yx;
        q = q * k - vec2(off, off) * (k - 1.0);
      } else {                          // radial fold
        float a = atan(q.y, q.x), seg = TAU / sym;
        a = mod(a, seg) - seg * 0.5;
        q = vec2(cos(a), sin(a)) * length(q);
        q = q * k - vec2(off * (k - 1.0), 0.0);
      }
      q = rot2(q, tw);
      sc *= k;
      trap = min(trap, length(q));
    }
    float d;
    if (P_kifsShape < 0.5) d = abs(length(q) - 1.0);
    else if (P_kifsShape < 1.5) d = max(length(q) - 1.0, 0.0);
    else d = max(min(abs(q.x), abs(q.y)), length(q) - 1.5);
    float scr = P_kifsSize / sc;                       // local -> screen units
    float inten = smoothstep(max(P_kifsThick * scr, 1.2 * px.y), 0.0, d * scr);
    inten *= 1.0 - smoothstep(P_kifsSize * 1.8, P_kifsSize * 2.3, gr);
    emit += hsv((P_kifsHue + P_kifsHueSpread * fract(trap * 0.35)) / 360.0, 0.75, P_kifsBright) * inten;
  }

  col += emit;
  col += (hash12(gl_FragCoord.xy + fract(uFrame*0.1234)*97.0) - 0.5) / 255.0; // dither: lets slow decay reach black in 8-bit
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// ---------------- composite / output pass ----------------
export const COMPOSITE = () => HEAD() + `
uniform sampler2D uSrc;
uniform vec3 uPalA, uPalB, uPalC, uPalD;
uniform float uPalOn;

vec2 mapUV(vec2 uv){
  float asp = uRes.x / uRes.y;
  vec2 q = uv - 0.5; q.x *= asp;
  q /= max(P_outZoom, 0.05);
  if (P_outKaleido >= 1.5){
    float r = length(q);
    float a = atan(q.y, q.x) + P_kalAcc;
    float seg = TAU / floor(P_outKaleido + 0.5);
    a = mod(a, seg);
    a = min(a, seg - a);
    q = vec2(cos(a), sin(a)) * r;
  }
  q.x /= asp;
  uv = q + 0.5;
  if (P_outMirror > 0.5){
    if (P_outMirror < 1.5) uv.x = uv.x > 0.5 ? 1.0 - uv.x : uv.x;
    else if (P_outMirror < 2.5) uv.y = uv.y < 0.5 ? 1.0 - uv.y : uv.y;
    else if (P_outMirror < 3.5){ uv.x = uv.x > 0.5 ? 1.0 - uv.x : uv.x; uv.y = uv.y < 0.5 ? 1.0 - uv.y : uv.y; }
    else if (P_outMirror < 4.5) uv.x = uv.x < 0.5 ? 1.0 - uv.x : uv.x;
    else uv.y = uv.y > 0.5 ? 1.0 - uv.y : uv.y;
  }
  return vec2(mirror1(uv.x), mirror1(uv.y));
}

void main(){
  vec3 col = texture2D(uSrc, mapUV(vUv)).rgb;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  if (uPalOn > 0.5){
    float t = lum * P_palFreq + P_palPhase + P_palAcc;
    vec3 pc = uPalA + uPalB * cos(TAU * (uPalC * t + uPalD));
    pc *= smoothstep(0.0, 0.35, lum) * (0.6 + 0.6*lum);
    col = mix(col, pc, P_palMix);
  }
  col = hueRotate(col, radians(P_outHue));
  lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, P_outSat);
  col = (col - 0.5) * P_contrast + 0.5;
  col = pow(max(col, 0.0), vec3(1.0 / max(P_gamma, 0.01)));
  vec2 d = vUv - 0.5;
  col *= 1.0 - P_vignette * smoothstep(0.25, 0.8, length(d) * 1.3);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// plain copy (used to blit when resizing)
export const COPY = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uSrc;
void main(){ gl_FragColor = texture2D(uSrc, vUv); }
`;
