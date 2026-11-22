// Galaktos — parameter schema.
// Every visual parameter of a preset is declared here. The renderer packs them
// into a vec4 uniform array (macros P_<key> in GLSL); the UI builds controls
// from the same table; the modulator clamps to min/max.
//
// p(key, group, label, def, min, max, step, extra)
//   extra.type: 'range' (default) | 'int' | 'enum'
//   extra.options: [[value, label], …] for enums
//   extra.rnd: [lo, hi] range used by the preset randomiser (defaults to min/max)
//   extra.tip: tooltip
//   extra.nomod: true if the parameter cannot be modulated

const P = [];
function p(key, group, label, def, min, max, step, extra = {}) {
  P.push({ key, group, label, def, min, max, step, type: 'range', ...extra });
}

export const WAVE_MODES = [[0, 'Off'], [1, 'Ring'], [2, 'Line'], [3, 'Twin lines'], [4, 'Spectrum ring'], [5, 'Spectrum bars']];
export const SHAPE_MODES = [[0, 'Off'], [1, 'Outline'], [2, 'Filled'], [3, 'Glow']];
export const EDGE_MODES = [[0, 'Clamp'], [1, 'Mirror'], [2, 'Wrap']];
export const MIRROR_MODES = [[0, 'None'], [1, 'Left → right'], [2, 'Top → bottom'], [3, 'Quad'], [4, 'Right → left'], [5, 'Bottom → top']];

// Inigo Quilez style cosine palettes: col = a + b*cos(2π(c*t + d))
export const PALETTES = [
  { name: 'Raw colour', abcd: null },
  { name: 'Spectrum', abcd: [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.33, 0.67]] },
  { name: 'Ember', abcd: [[0.5, 0.3, 0.2], [0.5, 0.4, 0.3], [1, 1, 1], [0, 0.1, 0.2]] },
  { name: 'Glacier', abcd: [[0.4, 0.55, 0.65], [0.4, 0.4, 0.35], [1, 1, 1], [0.55, 0.6, 0.65]] },
  { name: 'Verdigris', abcd: [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 0.5], [0.8, 0.9, 0.3]] },
  { name: 'Orchid', abcd: [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 0.7, 0.4], [0, 0.15, 0.2]] },
  { name: 'Candy', abcd: [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [2, 1, 0], [0.5, 0.2, 0.25]] },
  { name: 'Copper', abcd: [[0.8, 0.5, 0.4], [0.2, 0.4, 0.2], [2, 1, 1], [0, 0.25, 0.25]] },
  { name: 'Bone', abcd: [[0.55, 0.52, 0.48], [0.45, 0.45, 0.45], [0.5, 0.5, 0.5], [0, 0.02, 0.05]] },
  { name: 'Neon', abcd: [[0.5, 0.5, 0.5], [0.6, 0.6, 0.6], [1, 1, 1], [0.3, 0.2, 0.2]] },
];

export const GROUPS = [
  ['motion', 'Motion'], ['feedback', 'Feedback'], ['wave', 'Wave'], ['shape', 'Shapes'],
  ['sparks', 'Sparks'], ['geom', 'Geometry'], ['fields', 'Fields'], ['fractal', 'Fractals'], ['color', 'Colour'], ['mod', 'LFOs'],
];

// ---- Motion: the warp applied to last frame before it is fed back ----
p('zoom', 'motion', 'Zoom', 1.01, 0.9, 1.1, 0.0005, { rnd: [0.97, 1.04], tip: '>1 flows outward, <1 flows inward' });
p('rot', 'motion', 'Rotation', 0, -0.08, 0.08, 0.0005, { rnd: [-0.02, 0.02], tip: 'Radians per frame' });
p('swirl', 'motion', 'Swirl', 0, -0.1, 0.1, 0.0005, { rnd: [-0.03, 0.03], tip: 'Rotation that grows with radius' });
p('lens', 'motion', 'Lens', 0, -0.1, 0.1, 0.0005, { rnd: [-0.03, 0.03], tip: 'Zoom that grows with radius (bulge / pinch)' });
p('ripple', 'motion', 'Ripple', 0, 0, 0.03, 0.0001, { rnd: [0, 0.01], tip: 'Radial waves in the zoom field' });
p('rippleFreq', 'motion', 'Ripple freq', 12, 1, 60, 0.1);
p('rippleSpeed', 'motion', 'Ripple speed', 2, -10, 10, 0.01);
p('flow', 'motion', 'Noise flow', 0, 0, 0.02, 0.0001, { rnd: [0, 0.006], tip: 'Displacement by a drifting noise field' });
p('flowScale', 'motion', 'Flow scale', 3, 0.5, 20, 0.01);
p('flowSpeed', 'motion', 'Flow speed', 0.3, 0, 3, 0.01);
p('cx', 'motion', 'Centre X', 0.5, 0, 1, 0.001, { rnd: [0.5, 0.5] });
p('cy', 'motion', 'Centre Y', 0.5, 0, 1, 0.001, { rnd: [0.5, 0.5] });
p('dx', 'motion', 'Drift X', 0, -0.02, 0.02, 0.0001, { rnd: [-0.002, 0.002] });
p('dy', 'motion', 'Drift Y', 0, -0.02, 0.02, 0.0001, { rnd: [-0.002, 0.002] });
p('stretchX', 'motion', 'Stretch X', 1, 0.95, 1.05, 0.0005, { rnd: [0.995, 1.005] });
p('stretchY', 'motion', 'Stretch Y', 1, 0.95, 1.05, 0.0005, { rnd: [0.995, 1.005] });
p('fold', 'motion', 'Fold segments', 0, 0, 12, 1, { type: 'int', rnd: [0, 8], tip: 'Kaleidoscope folding inside the feedback loop (0–1 = off)' });
p('foldRot', 'motion', 'Fold angle°', 0, 0, 360, 0.5);
p('foldSpin', 'motion', 'Fold spin', 0, -2, 2, 0.01, { rnd: [-0.3, 0.3], tip: 'Radians per second' });

// ---- Feedback: how the old frame is treated ----
p('decay', 'feedback', 'Decay', 0.96, 0.8, 1, 0.0005, { rnd: [0.9, 0.985], tip: 'Fade per frame. 1 = never fades' });
p('blur', 'feedback', 'Blur', 0.2, 0, 1, 0.001, { rnd: [0, 0.6] });
p('sharpen', 'feedback', 'Sharpen', 0, 0, 2, 0.001, { rnd: [0, 0.4] });
p('edge', 'feedback', 'Edge glow', 0, 0, 3, 0.001, { rnd: [0, 0.6], tip: 'Adds brightness where the image has gradients' });
p('hueDrift', 'feedback', 'Hue drift°', 0, -10, 10, 0.01, { rnd: [-3, 3], tip: 'Hue rotation per frame' });
p('satGain', 'feedback', 'Saturation', 1, 0.9, 1.1, 0.0005, { rnd: [0.98, 1.03], tip: 'Saturation multiplier per frame' });
p('bright', 'feedback', 'Brightness', 0, -0.02, 0.02, 0.0001, { rnd: [-0.004, 0.002], tip: 'Added per frame' });
p('echoZoom', 'feedback', 'Echo zoom', 1.5, 0.25, 4, 0.001);
p('echoMix', 'feedback', 'Echo mix', 0, 0, 1, 0.001, { rnd: [0, 0.3] });
p('edgeMode', 'feedback', 'Edges', 1, 0, 2, 1, { type: 'enum', options: EDGE_MODES, nomod: true, tip: 'What the warp sees past the screen edge' });

// ---- Main wave ----
p('waveMode', 'wave', 'Mode', 1, 0, 5, 1, { type: 'enum', options: WAVE_MODES, nomod: true });
p('waveAmp', 'wave', 'Amplitude', 0.5, 0, 2, 0.001, { rnd: [0.2, 1] });
p('waveSize', 'wave', 'Size / gap', 0.25, 0, 1, 0.001, { rnd: [0.1, 0.4] });
p('waveThick', 'wave', 'Thickness', 0.005, 0.001, 0.05, 0.0001, { rnd: [0.002, 0.01] });
p('waveRot', 'wave', 'Angle°', 0, -180, 180, 0.5, { rnd: [0, 0] });
p('waveSpin', 'wave', 'Spin', 0, -3, 3, 0.01, { rnd: [-0.6, 0.6], tip: 'Radians per second' });
p('waveX', 'wave', 'Position X', 0.5, 0, 1, 0.001, { rnd: [0.5, 0.5] });
p('waveY', 'wave', 'Position Y', 0.5, 0, 1, 0.001, { rnd: [0.5, 0.5] });
p('waveHue', 'wave', 'Hue°', 200, 0, 360, 0.5);
p('waveHueSpread', 'wave', 'Hue spread°', 0, 0, 360, 0.5, { rnd: [0, 120] });
p('waveSat', 'wave', 'Saturation', 0.7, 0, 1, 0.001);
p('waveBright', 'wave', 'Brightness', 1, 0, 3, 0.001, { rnd: [0.6, 1.5] });
p('waveSmooth', 'wave', 'Smoothing', 0.4, 0, 0.95, 0.001, { nomod: true });

// ---- Shapes: N polygons orbiting a centre ----
p('shapeMode', 'shape', 'Mode', 0, 0, 3, 1, { type: 'enum', options: SHAPE_MODES, nomod: true });
p('shapeSides', 'shape', 'Sides', 6, 2, 12, 1, { type: 'int', rnd: [2, 8], tip: '2 = circle' });
p('shapeCount', 'shape', 'Count', 1, 1, 12, 1, { type: 'int', rnd: [1, 8] });
p('shapeSize', 'shape', 'Size', 0.12, 0, 0.8, 0.001, { rnd: [0.03, 0.25] });
p('shapeThick', 'shape', 'Thickness', 0.006, 0.001, 0.05, 0.0001, { rnd: [0.002, 0.012] });
p('shapeRot', 'shape', 'Angle°', 0, -180, 180, 0.5);
p('shapeSpin', 'shape', 'Spin', 0.3, -4, 4, 0.01, { rnd: [-1.5, 1.5] });
p('shapeOrbit', 'shape', 'Orbit radius', 0, 0, 0.6, 0.001, { rnd: [0, 0.35] });
p('shapeOrbitSpin', 'shape', 'Orbit spin', 0.3, -4, 4, 0.01, { rnd: [-1.2, 1.2] });
p('shapeX', 'shape', 'Position X', 0.5, 0, 1, 0.001, { rnd: [0.5, 0.5] });
p('shapeY', 'shape', 'Position Y', 0.5, 0, 1, 0.001, { rnd: [0.5, 0.5] });
p('shapeHue', 'shape', 'Hue°', 30, 0, 360, 0.5);
p('shapeHueSpread', 'shape', 'Hue spread°', 0, 0, 360, 0.5, { rnd: [0, 180] });
p('shapeSat', 'shape', 'Saturation', 0.7, 0, 1, 0.001);
p('shapeBright', 'shape', 'Brightness', 0.8, 0, 3, 0.001, { rnd: [0.4, 1.2] });

// ---- Sparks: drifting points + centre flash ----
p('sparkCount', 'sparks', 'Count', 0, 0, 32, 1, { type: 'int', rnd: [0, 20] });
p('sparkSize', 'sparks', 'Size', 0.006, 0.001, 0.04, 0.0001, { rnd: [0.003, 0.012] });
p('sparkSpread', 'sparks', 'Spread', 0.35, 0, 0.8, 0.001, { rnd: [0.15, 0.45] });
p('sparkSpeed', 'sparks', 'Speed', 0.5, -4, 4, 0.01, { rnd: [-1.5, 1.5] });
p('sparkHue', 'sparks', 'Hue°', 50, 0, 360, 0.5);
p('sparkHueSpread', 'sparks', 'Hue spread°', 60, 0, 360, 0.5);
p('sparkBright', 'sparks', 'Brightness', 1, 0, 3, 0.001, { rnd: [0.5, 1.5] });
p('flash', 'sparks', 'Centre flash', 0, 0, 2, 0.001, { rnd: [0, 0.4] });
p('flashSize', 'sparks', 'Flash size', 0.15, 0.01, 0.8, 0.001, { rnd: [0.05, 0.3] });
p('flashHue', 'sparks', 'Flash hue°', 40, 0, 360, 0.5);

// ---- Geometry generators ----
export const CURVE_MODES = [[0, 'Off'], [1, 'Lissajous'], [2, 'Rose'], [3, 'Harmonograph'], [4, 'Spirograph']];
export const SPIRAL_MODES = [[0, 'Off'], [1, 'Logarithmic'], [2, 'Archimedean']];
export const RAY_MODES = [[0, 'Off'], [1, 'Beams'], [2, 'Spectrum beams']];
p('curveMode', 'geom', 'Curve', 0, 0, 4, 1, { type: 'enum', options: CURVE_MODES, nomod: true });
p('curveA', 'geom', 'Freq A', 3, 1, 12, 0.001, { rnd: [1, 7], tip: 'First frequency (petals for Rose, ring ratio for Spirograph)' });
p('curveB', 'geom', 'Freq B', 2, 1, 12, 0.001, { rnd: [1, 7], tip: 'Second frequency' });
p('curveC', 'geom', 'Freq C / pen', 1.5, 0, 6, 0.001, { rnd: [0.3, 3], tip: 'Harmonograph third frequency, Spirograph pen distance' });
p('curveLoops', 'geom', 'Loops', 1, 1, 12, 1, { type: 'int', rnd: [1, 4], tip: 'How many 2π turns are traced' });
p('curveDamp', 'geom', 'Damping', 0.05, 0, 0.5, 0.001, { rnd: [0, 0.15], tip: 'Harmonograph decay' });
p('curveSize', 'geom', 'Size', 0.3, 0, 0.8, 0.001, { rnd: [0.15, 0.4] });
p('curveThick', 'geom', 'Thickness', 0.004, 0.001, 0.03, 0.0001, { rnd: [0.002, 0.008] });
p('curveSpin', 'geom', 'Phase speed', 0.3, -3, 3, 0.01, { rnd: [-1, 1], tip: 'How fast the curve morphs (radians/s)' });
p('curveRot', 'geom', 'Rotation speed', 0, -2, 2, 0.01, { rnd: [-0.4, 0.4] });
p('curveHue', 'geom', 'Curve hue°', 180, 0, 360, 0.5);
p('curveHueSpread', 'geom', 'Curve hue spread°', 90, 0, 360, 0.5);
p('curveBright', 'geom', 'Curve brightness', 1, 0, 3, 0.001, { rnd: [0.6, 1.4] });

p('spiralMode', 'geom', 'Spiral', 0, 0, 2, 1, { type: 'enum', options: SPIRAL_MODES, nomod: true });
p('spiralArms', 'geom', 'Arms', 3, 1, 16, 1, { type: 'int', rnd: [1, 8] });
p('spiralTwist', 'geom', 'Twist', 1.5, -6, 6, 0.001, { rnd: [-3, 3] });
p('spiralThick', 'geom', 'Thickness', 0.05, 0.005, 0.5, 0.001, { rnd: [0.02, 0.12], tip: 'Fraction of the arm spacing' });
p('spiralSpin', 'geom', 'Spin', 0.5, -4, 4, 0.01, { rnd: [-1.5, 1.5] });
p('spiralReach', 'geom', 'Reach', 0.6, 0.05, 1.2, 0.001, { rnd: [0.3, 0.8], tip: 'Outer radius' });
p('spiralHue', 'geom', 'Spiral hue°', 270, 0, 360, 0.5);
p('spiralHueSpread', 'geom', 'Spiral hue spread°', 120, 0, 360, 0.5);
p('spiralBright', 'geom', 'Spiral brightness', 0.8, 0, 3, 0.001, { rnd: [0.4, 1.2] });

p('rayMode', 'geom', 'Rays', 0, 0, 2, 1, { type: 'enum', options: RAY_MODES, nomod: true });
p('rayCount', 'geom', 'Count', 12, 1, 64, 1, { type: 'int', rnd: [3, 32] });
p('rayWidth', 'geom', 'Width', 0.25, 0.01, 1, 0.001, { rnd: [0.08, 0.4], tip: 'Fraction of the gap between rays' });
p('rayInner', 'geom', 'Inner radius', 0.08, 0, 1, 0.001, { rnd: [0.02, 0.2] });
p('rayOuter', 'geom', 'Outer radius', 0.5, 0, 1.5, 0.001, { rnd: [0.3, 0.8] });
p('raySpin', 'geom', 'Spin', 0.2, -4, 4, 0.01, { rnd: [-1, 1] });
p('rayHue', 'geom', 'Ray hue°', 45, 0, 360, 0.5);
p('rayHueSpread', 'geom', 'Ray hue spread°', 60, 0, 360, 0.5);
p('rayBright', 'geom', 'Ray brightness', 0.6, 0, 3, 0.001, { rnd: [0.3, 1] });

// ---- Field generators ----
export const RING_MODES = [[0, 'Off'], [1, 'Circles'], [2, 'Squares'], [3, 'Diamonds']];
export const GRID_MODES = [[0, 'Off'], [1, 'Lines'], [2, 'Dots'], [3, 'Hexagons']];
export const BLOB_MODES = [[0, 'Off'], [1, 'Filled'], [2, 'Outline'], [3, 'Glow']];
p('ringMode', 'fields', 'Rings', 0, 0, 3, 1, { type: 'enum', options: RING_MODES, nomod: true });
p('ringFreq', 'fields', 'Density', 6, 0.5, 40, 0.01, { rnd: [2, 14], tip: 'Rings per screen height' });
p('ringSpeed', 'fields', 'Speed', 0.5, -5, 5, 0.01, { rnd: [-1.5, 1.5], tip: 'Outward travel (rings/s)' });
p('ringThick', 'fields', 'Thickness', 0.08, 0.005, 0.5, 0.001, { rnd: [0.03, 0.15], tip: 'Fraction of the ring spacing' });
p('ringFade', 'fields', 'Fade', 2, 0, 10, 0.01, { rnd: [0.5, 4], tip: 'Falloff with distance from the centre' });
p('ringHue', 'fields', 'Ring hue°', 200, 0, 360, 0.5);
p('ringHueSpread', 'fields', 'Ring hue spread°', 40, 0, 360, 0.5);
p('ringBright', 'fields', 'Ring brightness', 0.5, 0, 3, 0.001, { rnd: [0.25, 0.9] });

p('gridMode', 'fields', 'Lattice', 0, 0, 3, 1, { type: 'enum', options: GRID_MODES, nomod: true });
p('gridScale', 'fields', 'Cells', 8, 1, 40, 0.01, { rnd: [3, 16], tip: 'Cells per screen height' });
p('gridThick', 'fields', 'Thickness', 0.04, 0.005, 0.5, 0.001, { rnd: [0.02, 0.1] });
p('gridSpin', 'fields', 'Spin', 0, -2, 2, 0.01, { rnd: [-0.3, 0.3] });
p('gridFade', 'fields', 'Fade', 2, 0, 10, 0.01, { rnd: [0.5, 5] });
p('gridHue', 'fields', 'Lattice hue°', 160, 0, 360, 0.5);
p('gridHueSpread', 'fields', 'Lattice hue spread°', 60, 0, 360, 0.5);
p('gridBright', 'fields', 'Lattice brightness', 0.4, 0, 3, 0.001, { rnd: [0.2, 0.8] });

p('blobMode', 'fields', 'Metaballs', 0, 0, 3, 1, { type: 'enum', options: BLOB_MODES, nomod: true });
p('blobCount', 'fields', 'Count', 4, 2, 8, 1, { type: 'int', rnd: [2, 7] });
p('blobSize', 'fields', 'Size', 0.08, 0.01, 0.4, 0.001, { rnd: [0.04, 0.14] });
p('blobSpread', 'fields', 'Spread', 0.25, 0, 0.8, 0.001, { rnd: [0.1, 0.4] });
p('blobSpeed', 'fields', 'Speed', 0.6, -4, 4, 0.01, { rnd: [-1.5, 1.5] });
p('blobHue', 'fields', 'Blob hue°', 320, 0, 360, 0.5);
p('blobHueSpread', 'fields', 'Blob hue spread°', 90, 0, 360, 0.5);
p('blobBright', 'fields', 'Blob brightness', 0.6, 0, 3, 0.001, { rnd: [0.3, 1] });

p('plasmaAmt', 'fields', 'Plasma amount', 0, 0, 1, 0.001, { rnd: [0, 0.15], tip: '0 = off' });
p('plasmaScale', 'fields', 'Plasma scale', 6, 0.5, 30, 0.01, { rnd: [2, 12] });
p('plasmaSpeed', 'fields', 'Plasma speed', 0.6, -4, 4, 0.01, { rnd: [-1.5, 1.5] });
p('plasmaEdge', 'fields', 'Edges only', 0.6, 0, 1, 0.001, { rnd: [0, 1], tip: '0 = everywhere, 1 = only near the screen edge (feeds zoom-out flows)' });
p('plasmaHue', 'fields', 'Plasma hue°', 20, 0, 360, 0.5);
p('plasmaHueSpread', 'fields', 'Plasma hue spread°', 120, 0, 360, 0.5);

// ---- Fractals ----
export const FRAC_MODES = [[0, 'Off'], [1, 'Julia'], [2, 'Mandelbrot'], [3, 'Burning Ship'], [4, 'Multibrot']];
export const FRAC_STYLES = [[0, 'Boundary glow'], [1, 'Smooth fill'], [2, 'Contour bands'], [3, 'Interior']];
export const KIFS_MODES = [[0, 'Off'], [1, 'Triangle fold'], [2, 'Square fold'], [3, 'Radial fold']];
export const KIFS_SHAPES = [[0, 'Ring'], [1, 'Dot'], [2, 'Cross']];
export const CMAP_MODES = [[0, 'Off'], [1, 'z² + c'], [2, 'z³ + c'], [3, 'Inversion 1/z + c'], [4, 'sin z + c']];
p('fracMode', 'fractal', 'Set type', 0, 0, 4, 1, { type: 'enum', options: FRAC_MODES, nomod: true });
p('fracStyle', 'fractal', 'Style', 0, 0, 3, 1, { type: 'enum', options: FRAC_STYLES, nomod: true });
p('fracRe', 'fractal', 'c real · X', -0.7, -2, 2, 0.0001, { rnd: [-0.9, 0.4], tip: 'Julia constant (Julia) or view centre (other sets)' });
p('fracIm', 'fractal', 'c imag · Y', 0.27, -2, 2, 0.0001, { rnd: [-0.6, 0.6] });
p('fracZoom', 'fractal', 'Zoom (log2)', 0, -1, 10, 0.001, { rnd: [0, 1.5], tip: 'Each +1 doubles the magnification' });
p('fracPower', 'fractal', 'Power', 2, 2, 6, 0.001, { rnd: [2, 4], tip: 'Exponent (Multibrot; Julia uses it too)' });
p('fracIter', 'fractal', 'Iterations', 48, 8, 96, 1, { type: 'int', rnd: [24, 64] });
p('fracReach', 'fractal', 'Reach', 0.8, 0.05, 1.5, 0.001, { rnd: [0.4, 1], tip: 'Fades the set out beyond this radius' });
p('fracSpin', 'fractal', 'Spin', 0, -2, 2, 0.01, { rnd: [-0.3, 0.3] });
p('fracHue', 'fractal', 'Set hue°', 200, 0, 360, 0.5);
p('fracHueSpread', 'fractal', 'Set hue spread°', 180, 0, 360, 0.5);
p('fracBright', 'fractal', 'Set brightness', 0.3, 0, 2, 0.001, { rnd: [0.12, 0.45], tip: 'Keep low — it is added every frame' });

p('kifsMode', 'fractal', 'IFS type', 0, 0, 3, 1, { type: 'enum', options: KIFS_MODES, nomod: true });
p('kifsShape', 'fractal', 'Primitive', 0, 0, 2, 1, { type: 'enum', options: KIFS_SHAPES, nomod: true });
p('kifsIter', 'fractal', 'Depth', 5, 1, 10, 1, { type: 'int', rnd: [3, 7] });
p('kifsScale', 'fractal', 'Scale', 2, 1.1, 3.5, 0.001, { rnd: [1.6, 2.6] });
p('kifsAngle', 'fractal', 'Twist°', 0, -180, 180, 0.1, { rnd: [-30, 30], tip: 'Rotation per iteration' });
p('kifsTwistSpin', 'fractal', 'Twist speed', 0, -1, 1, 0.001, { rnd: [-0.15, 0.15], tip: 'Animates the twist (radians/s)' });
p('kifsOffset', 'fractal', 'Offset', 1, 0, 2, 0.001, { rnd: [0.6, 1.3] });
p('kifsSym', 'fractal', 'Radial symmetry', 6, 2, 12, 1, { type: 'int', rnd: [3, 8], tip: 'Segments for Radial fold' });
p('kifsSize', 'fractal', 'Size', 0.35, 0.05, 1, 0.001, { rnd: [0.2, 0.45] });
p('kifsThick', 'fractal', 'Thickness', 0.06, 0.005, 0.5, 0.001, { rnd: [0.03, 0.12], tip: 'Primitive line width (local units)' });
p('kifsSpin', 'fractal', 'Spin', 0.1, -2, 2, 0.01, { rnd: [-0.5, 0.5] });
p('kifsHue', 'fractal', 'IFS hue°', 40, 0, 360, 0.5);
p('kifsHueSpread', 'fractal', 'IFS hue spread°', 120, 0, 360, 0.5);
p('kifsBright', 'fractal', 'IFS brightness', 0.7, 0, 3, 0.001, { rnd: [0.4, 1] });

p('cmapMode', 'fractal', 'Map type', 0, 0, 4, 1, { type: 'enum', options: CMAP_MODES, nomod: true, tip: 'Applies a complex function to the warp each frame — the picture becomes a fractal recursively' });
p('cmapMix', 'fractal', 'Map strength', 1, 0, 1, 0.001, { rnd: [0.6, 1] });
p('cmapRe', 'fractal', 'Map c real', -0.4, -1.5, 1.5, 0.0001, { rnd: [-0.8, 0.4] });
p('cmapIm', 'fractal', 'Map c imag', 0.6, -1.5, 1.5, 0.0001, { rnd: [-0.7, 0.7] });
p('cmapScale', 'fractal', 'Map scale', 2, 0.5, 5, 0.001, { rnd: [1.5, 3], tip: 'Screen-to-complex-plane scale' });

// ---- Colour: output grading (not fed back) ----
p('palette', 'color', 'Palette', 0, 0, PALETTES.length - 1, 1, { type: 'enum', options: PALETTES.map((x, i) => [i, x.name]), nomod: true });
p('palMix', 'color', 'Palette mix', 1, 0, 1, 0.001, { rnd: [0.6, 1] });
p('palFreq', 'color', 'Palette freq', 1, 0, 4, 0.001, { rnd: [0.5, 2] });
p('palPhase', 'color', 'Palette phase', 0, 0, 1, 0.001);
p('palSpeed', 'color', 'Palette speed', 0, -1, 1, 0.001, { rnd: [-0.1, 0.1], tip: 'Cycles per second' });
p('outHue', 'color', 'Hue shift°', 0, -180, 180, 0.5, { rnd: [0, 0] });
p('outSat', 'color', 'Saturation', 1, 0, 3, 0.001, { rnd: [0.9, 1.3] });
p('contrast', 'color', 'Contrast', 1, 0, 3, 0.001, { rnd: [0.9, 1.4] });
p('gamma', 'color', 'Gamma', 1, 0.25, 4, 0.001, { rnd: [0.8, 1.3] });
p('vignette', 'color', 'Vignette', 0.3, 0, 1, 0.001, { rnd: [0, 0.6] });
p('outMirror', 'color', 'Mirror', 0, 0, 5, 1, { type: 'enum', options: MIRROR_MODES, nomod: true, rnd: [0, 0] });
p('outKaleido', 'color', 'Kaleido segs', 0, 0, 16, 1, { type: 'int', rnd: [0, 0], tip: 'Output-only kaleidoscope (0–1 = off)' });
p('outKaleidoSpin', 'color', 'Kaleido spin', 0, -2, 2, 0.01, { rnd: [0, 0] });
p('outZoom', 'color', 'Output zoom', 1, 0.25, 4, 0.001, { rnd: [1, 1] });

// ---- LFO rates (not modulatable) ----
p('lfo1Rate', 'mod', 'LFO 1 rate (Hz)', 0.1, 0.005, 4, 0.001, { nomod: true, rnd: [0.03, 0.4] });
p('lfo2Rate', 'mod', 'LFO 2 rate (Hz)', 0.37, 0.005, 4, 0.001, { nomod: true, rnd: [0.05, 0.8] });
p('lfo3Rate', 'mod', 'LFO 3 rate (Hz)', 1, 0.005, 8, 0.001, { nomod: true, rnd: [0.2, 3] });

export const PARAMS = P;
export const PARAM = Object.fromEntries(P.map((x) => [x.key, x]));
export const DEFAULTS = Object.fromEntries(P.map((x) => [x.key, x.def]));

// Derived uniforms computed by the app (integrated phases etc.), packed after the params.
export const DERIVED = ['wavePhase', 'shapePhase', 'orbitPhase', 'sparkPhase', 'foldPhase', 'palAcc', 'kalAcc',
  'curvePhase', 'curveRotPhase', 'spiralPhase', 'rayPhase', 'ringPhase', 'gridPhase', 'blobPhase', 'plasmaPhase',
  'fracPhase', 'kifsPhase', 'kifsTwistPhase'];

// Modulation sources. Audio bands are centred on 0 (0 = average loudness).
export const SOURCES = [
  ['', '—'], ['bass', 'Bass'], ['mid', 'Mid'], ['treb', 'Treble'], ['vol', 'Volume'],
  ['bass_att', 'Bass (smooth)'], ['mid_att', 'Mid (smooth)'], ['treb_att', 'Treble (smooth)'],
  ['beat', 'Beat'], ['lfo1', 'LFO 1 (sine)'], ['lfo2', 'LFO 2 (triangle)'], ['lfo3', 'LFO 3 (sine)'],
  ['noise', 'Wander'], ['ramp', 'Slow ramp'],
];

// Uniform packing: params then derived, 4 per vec4.
export const SLOTS = [...P.map((x) => x.key), ...DERIVED];
export const NUM_VEC4 = Math.ceil(SLOTS.length / 4);
export function glslDefines() {
  const c = 'xyzw';
  return SLOTS.map((k, i) => `#define P_${k} U[${i >> 2}].${c[i & 3]}`).join('\n');
}
