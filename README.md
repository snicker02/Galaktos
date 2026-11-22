# Galaktos v2.2.0

Galaktos is an audio-reactive feedback visualizer with its own engine and its own presets. Every parameter is a control, and any control can be driven by the music.

It's written from scratch in WebGL1 with no outside libraries. It contains no MilkDrop or Butterchurn code or presets.

## Run

Serve the folder over HTTP, then open `index.html`. ES modules won't load from `file://`. GitHub Pages works as-is.

```
python -m http.server 8000
```

## How it works

Each frame, the previous image is warped, filtered and faded, then new elements are drawn on top. That loop is what produces trails, tunnels and blooms. A final output pass handles colour grading and symmetry, and its result is not fed back into the loop.

- **Motion** – how the old frame moves each frame:
  - zoom, rotation, swirl, lens and ripple
  - noise flow
  - drift and stretch
  - kaleidoscope folding inside the loop
- **Feedback** – what happens to the old frame:
  - decay, blur, sharpen and edge glow
  - hue drift, saturation and brightness
  - echo
  - what happens at the screen edges (clamp, mirror or wrap)
- **Wave** – the audio waveform drawn as a ring, a line or twin lines, or the spectrum as a ring or bars.
- **Shapes** – up to 12 polygons orbiting a centre, drawn as outlines, filled or glowing.
- **Sparks** – up to 32 drifting points, plus a flash at the centre.
- **Geometry**:
  - parametric curves: Lissajous, rose, harmonograph and spirograph
  - logarithmic or Archimedean spirals
  - light rays, optionally with each ray's length driven by the spectrum
- **Fields**:
  - pulse rings: circles, squares or diamonds
  - a lattice: lines, dots or hexagons
  - metaballs: filled, outline or glow
  - a plasma field that can be limited to the screen edges
- **Fractals**:
  - escape-time sets (Julia, Mandelbrot, Burning Ship, Multibrot) with four colouring styles and a smooth iteration count. Modulate c to morph a Julia set with the music.
  - kaleidoscopic IFS (triangle, square or radial folding) using ring, dot or cross shapes
  - a complex feedback map (z² + c, z³ + c, inversion, sin z) that warps the loop itself, so a fractal grows frame by frame
- **Colour** (output only) – 10 colour palettes, hue, saturation, contrast, gamma, vignette, mirrors, a spinning kaleidoscope and zoom.

## Modulation

Press **∿** on any parameter to drive it from one of these sources:

| Source | Behaviour |
|---|---|
| Bass, Mid, Treble, Volume | 0 at average loudness |
| Smooth versions of the bands | Same as above, smoothed |
| Beat | Jumps to 1 on each beat, then decays |
| LFO 1–3 | Each has its own rate, set in the Mod tab |
| Wander | Slow random drift |
| Slow ramp | Rises over 30 seconds, then repeats |

The amount is a fraction of the parameter's full range. An orange tick on the slider shows the live value. The **Mod** tab lists every route in the current preset.

## Audio

- **Synth** – a built-in pulse with adjustable BPM, so you don't need any sound.
- **Microphone** – mic or line-in. It needs https or localhost, and it isn't played back through the speakers.
- **Audio file** – pick a file or drag it onto the page.

Reactivity, beat threshold, beat decay, smoothing and waveform gain are all adjustable.

## Presets

- 47 factory presets.
- **New random** builds a coherent random preset and **Mutate** nudges the current one.
- **Save** stores presets in this browser.
- **Export** and **Import** use `.galaktos.json` files. You can drag several files in at once.
- Switching presets morphs from one to the next over the blend time.

## Recording

The **Output → Capture** section has these options:

- **MP4 (default)**:
  - H.264 video at the output resolution, at a constant 24, 30 or 60 fps, with an adjustable bitrate.
  - Encoded with the browser's WebCodecs and written by Galaktos's own MP4 writer (`engine/mp4.js`). The file has its index at the front, so it plays straight away.
  - With Microphone or Audio file input it records the sound too: AAC where the browser can encode it (Windows/macOS Chrome and Edge, Safari), otherwise Opus.
  - Browsers without WebCodecs H.264 fall back to their built-in MP4 recording.
- **WebM**: VP9 + Opus, recorded with the browser's built-in recorder.
- **Snapshot PNG**.

## Controls

On a phone, the view docks at the top with tabs underneath. On landscape phones the view is on the left.

| Action | Mouse / keyboard | Touch |
|---|---|---|
| Move the warp centre | Drag | Drag |
| Zoom | Mouse wheel | Pinch |
| Drift | — | Two-finger drag |
| Next preset | Double-click | Double-tap |
| Show / hide panel | H | ☰ button |
| Next / previous preset | N / P | — |
| Random preset from the list | R | — |
| New random preset | G | — |
| Mutate | M | — |
| Favourite | F | — |
| Kick (beat) | Space | — |
| Pause / step one frame | . / , | — |
| Clear the trails | C | — |
| Snapshot | S | — |

Every control updates live, so there's no "confirm before applying" mode.

## Files

```
index.html           layout + styles (desktop panel, phone tabbed layout)
main.js              loop, preset state, gestures, save/import/capture
engine/schema.js     every parameter (range, group, randomiser range), palettes, mod sources
engine/shaders.js    GLSL ES 1.00: feedback/warp/emit pass, composite pass
engine/renderer.js   WebGL1 ping-pong buffers (half-float when available, else 8-bit + dither)
engine/audio.js      mic / file / synth, band levels, beat, waveform, log spectrum
engine/modulation.js preset evaluation, routing, morph blending
engine/generate.js   random preset generator and mutator
engine/recorder.js   MP4 (WebCodecs) / WebM (MediaRecorder) capture
engine/mp4.js        MP4 writer: H.264 + AAC/Opus, moov-first
engine/presets.js    factory presets
ui/                  panels, widgets, library, responsive layout
```

## Changelog

- **2.2.0** – Added 7 generators (curves, spirals, rays, pulse rings, lattice, metaballs, plasma) and a Fractals tab with escape-time sets, a kaleidoscopic IFS and a complex feedback map. 22 new presets. The randomiser and Mutate now use the new generators. The app reports an error if the GPU doesn't allow enough shader uniforms.
- **2.1.0** – MP4 export is the default: H.264 with AAC or Opus, constant frame rate, choice of fps and bitrate. WebM is still available. Added the credit line.
- **2.0.0** – New engine and original presets (replaces the Butterchurn-based prototype).

---

Created with help from Claude AI
