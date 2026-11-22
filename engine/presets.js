// Galaktos — factory presets (original to Galaktos).
// Only values that differ from the schema defaults are listed.
// mods: key -> [source, amount as fraction of the parameter's range]

export const FACTORY = [
  {
    name: 'Ember Bloom',
    params: { zoom: 1.018, swirl: 0.012, decay: 0.955, blur: 0.3, hueDrift: 0.6, waveMode: 1, waveAmp: 0.7, waveSize: 0.18, waveThick: 0.006, waveHue: 25, waveHueSpread: 40, waveBright: 1.2, flash: 0.1, flashSize: 0.12, flashHue: 30, palette: 2, palFreq: 1.2, vignette: 0.4 },
    mods: { zoom: ['bass', 0.06], swirl: ['lfo1', 0.15], waveSize: ['bass_att', 0.08], flash: ['beat', 0.3], palPhase: ['lfo2', 0.15] },
  },
  {
    name: 'Glass Mandala',
    params: { zoom: 1.012, rot: 0.004, fold: 6, foldSpin: 0.15, decay: 0.965, blur: 0.15, sharpen: 0.2, waveMode: 1, waveAmp: 0.5, waveSize: 0.22, waveHue: 190, waveSat: 0.5, shapeMode: 1, shapeSides: 6, shapeCount: 6, shapeSize: 0.05, shapeOrbit: 0.25, shapeOrbitSpin: 0.4, shapeSpin: -0.8, shapeHue: 210, shapeBright: 0.7, palette: 3, palFreq: 1.4, contrast: 1.15, vignette: 0.35 },
    mods: { rot: ['lfo1', 0.12], shapeSize: ['beat', 0.06], shapeOrbit: ['bass_att', 0.08], waveAmp: ['vol', 0.2], foldRot: ['lfo2', 0.1] },
  },
  {
    name: 'Tide Lines',
    params: { zoom: 1.0, dy: 0.0025, flow: 0.004, flowScale: 4, flowSpeed: 0.25, decay: 0.975, blur: 0.25, edgeMode: 1, waveMode: 3, waveAmp: 0.6, waveSize: 0.35, waveThick: 0.004, waveHue: 160, waveHueSpread: 60, waveSat: 0.6, palette: 4, palFreq: 0.9, vignette: 0.3 },
    mods: { flow: ['mid_att', 0.12], waveSize: ['lfo1', 0.1], dy: ['bass', 0.08], palPhase: ['lfo2', 0.2] },
  },
  {
    name: 'Spectral Furnace',
    params: { zoom: 1.025, lens: 0.015, decay: 0.88, blur: 0.15, sharpen: 0.2, edge: 0.15, waveMode: 5, waveAmp: 0.6, waveY: 0.5, waveThick: 0.004, waveHue: 15, waveHueSpread: 50, waveBright: 0.55, palette: 7, palFreq: 1.1, contrast: 1.2, vignette: 0.5 },
    mods: { zoom: ['beat', 0.06], lens: ['bass_att', 0.15], edge: ['treb_att', 0.1], hueDrift: ['mid', 0.05] },
  },
  {
    name: 'Orbiting Choir',
    params: { zoom: 1.008, swirl: -0.02, decay: 0.97, blur: 0.35, waveMode: 0, shapeMode: 3, shapeSides: 2, shapeCount: 8, shapeSize: 0.015, shapeThick: 0.004, shapeOrbit: 0.28, shapeOrbitSpin: 0.6, shapeHue: 280, shapeHueSpread: 120, shapeBright: 0.6, flash: 0.03, flashHue: 300, palette: 5, palFreq: 1.3, vignette: 0.4 },
    mods: { shapeOrbit: ['lfo1', 0.15], shapeSize: ['bass', 0.02], swirl: ['lfo2', 0.2], flash: ['beat', 0.08], shapeOrbitSpin: ['mid', 0.06] },
  },
  {
    name: 'Night Garden',
    params: { zoom: 1.006, flow: 0.006, flowScale: 2.5, flowSpeed: 0.2, decay: 0.985, blur: 0.5, waveMode: 0, sparkCount: 24, sparkSize: 0.01, sparkSpread: 0.42, sparkSpeed: 0.35, sparkHue: 120, sparkHueSpread: 160, sparkBright: 2.2, palette: 9, palMix: 0.55, palFreq: 0.8, gamma: 1.2, vignette: 0.45 },
    mods: { sparkBright: ['treb', 0.2], flow: ['mid_att', 0.15], sparkSpread: ['lfo1', 0.08], zoom: ['bass', 0.03] },
  },
  {
    name: 'Vortex Engine',
    params: { zoom: 0.985, swirl: 0.045, rot: 0.01, decay: 0.95, blur: 0.2, hueDrift: 2.2, waveMode: 1, waveAmp: 0.8, waveSize: 0.3, waveThick: 0.005, waveHue: 0, waveHueSpread: 300, waveSat: 0.9, palette: 0, outSat: 1.2, vignette: 0.3 },
    mods: { swirl: ['bass', 0.12], waveSize: ['lfo1', 0.1], hueDrift: ['mid', 0.08], waveAmp: ['vol', 0.15] },
  },
  {
    name: 'Kaleido Pulse',
    params: { zoom: 1.02, fold: 8, foldSpin: -0.2, decay: 0.94, blur: 0.08, sharpen: 0.35, waveMode: 4, waveAmp: 0.8, waveSize: 0.12, waveThick: 0.004, waveHue: 320, waveHueSpread: 90, palette: 6, palFreq: 1.0, contrast: 1.1, vignette: 0.35 },
    mods: { zoom: ['beat', 0.07], waveSize: ['bass_att', 0.1], foldRot: ['lfo1', 0.15], palPhase: ['lfo2', 0.25] },
  },
  {
    name: 'Ripple Pool',
    params: { zoom: 1.0, ripple: 0.006, rippleFreq: 22, rippleSpeed: 3, decay: 0.97, blur: 0.3, sharpen: 0.15, waveMode: 2, waveAmp: 0.7, waveThick: 0.004, waveHue: 195, waveSat: 0.4, palette: 3, palFreq: 1.2, vignette: 0.5 },
    mods: { ripple: ['treb', 0.2], waveRot: ['lfo1', 0.1], rippleFreq: ['lfo2', 0.05], zoom: ['bass', 0.03] },
  },
  {
    name: 'Ink in Water',
    params: { zoom: 1.004, flow: 0.012, flowScale: 2.2, flowSpeed: 0.15, decay: 0.988, blur: 0.15, sharpen: 0.35, waveMode: 2, waveAmp: 0.9, waveThick: 0.003, waveHue: 220, waveSat: 0.2, waveBright: 0.9, palette: 8, palFreq: 1.0, contrast: 1.25, vignette: 0.55 },
    mods: { flow: ['bass_att', 0.15], waveRot: ['noise', 0.4], waveAmp: ['vol', 0.2] },
  },
  {
    name: 'Hex Lattice',
    params: { zoom: 1.0, dx: 0.0015, dy: 0.0009, edgeMode: 2, decay: 0.965, blur: 0.1, echoMix: 0.25, echoZoom: 0.5, waveMode: 0, shapeMode: 2, shapeSides: 6, shapeCount: 1, shapeSize: 0.05, shapeSpin: 0.5, shapeHue: 35, shapeSat: 0.6, shapeBright: 0.6, palette: 7, palFreq: 1.6, contrast: 1.15, vignette: 0.25 },
    mods: { shapeSize: ['beat', 0.08], echoMix: ['bass', 0.15], dx: ['lfo1', 0.08], palPhase: ['lfo2', 0.2] },
  },
  {
    name: 'Solar Wind',
    params: { zoom: 1.01, dx: -0.004, flow: 0.003, decay: 0.955, blur: 0.35, edgeMode: 0, waveMode: 4, waveAmp: 0.9, waveSize: 0.08, waveX: 0.7, waveHue: 40, waveHueSpread: 40, sparkCount: 14, sparkSize: 0.005, sparkSpread: 0.35, sparkSpeed: 0.9, sparkHue: 45, sparkHueSpread: 40, palette: 2, palFreq: 1.3, vignette: 0.4 },
    mods: { dx: ['bass', -0.1], waveSize: ['beat', 0.06], sparkBright: ['treb', 0.2], hueDrift: ['lfo3', 0.06] },
  },
  {
    name: 'Echo Chamber',
    params: { zoom: 1.012, rot: -0.006, decay: 0.95, blur: 0.2, echoMix: 0.35, echoZoom: 2.2, waveMode: 1, waveAmp: 0.6, waveSize: 0.16, waveThick: 0.006, waveHue: 260, waveHueSpread: 160, palette: 1, palFreq: 0.9, vignette: 0.4 },
    mods: { echoZoom: ['lfo1', 0.15], rot: ['mid', 0.1], echoMix: ['beat', 0.2], palPhase: ['ramp', 0.5] },
  },
  {
    name: 'Prism Tunnel',
    params: { zoom: 1.05, lens: 0.04, rot: 0.012, decay: 0.93, blur: 0.15, hueDrift: 3, waveMode: 1, waveAmp: 0.5, waveSize: 0.06, waveThick: 0.008, waveHue: 0, waveHueSpread: 360, waveSat: 1, palette: 0, outKaleido: 6, outKaleidoSpin: 0.12, outSat: 1.2, vignette: 0.45 },
    mods: { zoom: ['bass', 0.05], rot: ['lfo1', 0.15], hueDrift: ['treb', 0.08] },
  },
  {
    name: 'Breathing Star',
    params: { zoom: 1.015, swirl: 0.008, decay: 0.96, blur: 0.25, waveMode: 0, shapeMode: 1, shapeSides: 5, shapeCount: 1, shapeSize: 0.15, shapeThick: 0.006, shapeSpin: 0.4, shapeHue: 300, shapeSat: 0.6, shapeBright: 0.9, flash: 0.04, flashSize: 0.08, flashHue: 320, palette: 5, palFreq: 1.1, vignette: 0.4 },
    mods: { shapeSize: ['bass_att', 0.08], shapeSpin: ['mid', 0.08], swirl: ['lfo1', 0.2], flash: ['beat', 0.1] },
  },
  {
    name: 'Electric Moss',
    params: { zoom: 1.004, flow: 0.005, flowScale: 6, flowSpeed: 0.4, decay: 0.92, blur: 0.1, edge: 0.3, waveMode: 2, waveAmp: 0.8, waveThick: 0.003, waveHue: 100, waveSat: 0.7, sparkCount: 10, sparkSize: 0.004, sparkHue: 90, sparkHueSpread: 40, palette: 4, palFreq: 1.6, contrast: 1.05, vignette: 0.4 },
    mods: { edge: ['treb_att', 0.05], flow: ['mid', 0.15], waveRot: ['lfo2', 0.25] },
  },
  {
    name: 'Liquid Chrome',
    params: { zoom: 1.008, ripple: 0.004, rippleFreq: 14, rippleSpeed: -2, decay: 0.97, blur: 0.2, sharpen: 0.5, waveMode: 1, waveAmp: 0.7, waveSize: 0.25, waveThick: 0.012, waveSat: 0, waveBright: 1.0, palette: 8, palFreq: 2.2, contrast: 1.35, gamma: 1.1, vignette: 0.5 },
    mods: { ripple: ['bass', 0.15], waveSize: ['lfo1', 0.08], palPhase: ['mid_att', 0.2] },
  },
  {
    name: 'Cathedral',
    params: { zoom: 1.01, fold: 12, foldSpin: 0.05, decay: 0.965, blur: 0.2, sharpen: 0.25, waveMode: 2, waveAmp: 0.6, waveThick: 0.003, waveY: 0.6, waveHue: 45, waveSat: 0.5, palette: 7, palFreq: 1.3, outMirror: 2, contrast: 1.15, vignette: 0.4 },
    mods: { zoom: ['bass_att', 0.04], waveRot: ['lfo1', 0.12], foldRot: ['mid', 0.08] },
  },
  {
    name: 'Pulse Grid',
    params: { zoom: 0.99, stretchX: 1.006, edgeMode: 2, decay: 0.96, blur: 0.1, sharpen: 0.2, waveMode: 5, waveAmp: 0.7, waveThick: 0.003, waveHue: 170, waveHueSpread: 120, waveBright: 1.6, palette: 9, palMix: 0.7, palFreq: 1.4, contrast: 1.15, vignette: 0.3 },
    mods: { zoom: ['beat', -0.05], stretchX: ['lfo1', 0.15], stretchY: ['lfo2', 0.15], hueDrift: ['mid', 0.05] },
  },
  {
    name: 'Aurora',
    params: { zoom: 1.0, dy: 0.003, flow: 0.007, flowScale: 1.8, flowSpeed: 0.12, decay: 0.982, blur: 0.45, edgeMode: 0, waveMode: 3, waveAmp: 0.5, waveSize: 0.08, waveY: 0.25, waveThick: 0.004, waveHue: 130, waveHueSpread: 180, waveSat: 0.8, palette: 1, palMix: 0.5, palFreq: 0.7, vignette: 0.35 },
    mods: { flow: ['bass_att', 0.12], waveHue: ['ramp', 0.4], dy: ['mid', 0.05], palPhase: ['lfo1', 0.2] },
  },
  {
    name: 'Dervish',
    params: { zoom: 1.006, swirl: -0.035, decay: 0.955, blur: 0.2, waveMode: 0, shapeMode: 1, shapeSides: 3, shapeCount: 3, shapeSize: 0.08, shapeThick: 0.005, shapeOrbit: 0.18, shapeOrbitSpin: 1.6, shapeSpin: -2.2, shapeHue: 0, shapeHueSpread: 240, shapeSat: 0.8, shapeBright: 1.1, palette: 0, outSat: 1.15, vignette: 0.35 },
    mods: { shapeOrbit: ['bass', 0.08], swirl: ['lfo1', 0.2], shapeHue: ['ramp', 0.5] },
  },
  {
    name: 'Deep Field',
    params: { zoom: 1.015, decay: 0.988, blur: 0.15, waveMode: 0, sparkCount: 32, sparkSize: 0.0045, sparkSpread: 0.6, sparkSpeed: 0.12, sparkHue: 210, sparkHueSpread: 120, sparkBright: 2.5, flash: 0.02, flashSize: 0.04, flashHue: 220, palette: 3, palFreq: 1.0, vignette: 0.5 },
    mods: { zoom: ['bass', 0.04], sparkBright: ['treb', 0.15], flash: ['beat', 0.05] },
  },
  {
    name: 'Molten Glass',
    params: { zoom: 1.01, lens: -0.03, flow: 0.004, decay: 0.965, blur: 0.5, waveMode: 4, waveAmp: 0.7, waveSize: 0.15, waveThick: 0.005, waveHue: 20, waveHueSpread: 30, palette: 2, palFreq: 1.6, contrast: 1.2, vignette: 0.4 },
    mods: { lens: ['bass_att', 0.15], flow: ['mid_att', 0.12], palPhase: ['lfo1', 0.2], blur: ['beat', 0.2] },
  },
  {
    name: 'Signal Bloom',
    params: { zoom: 1.02, fold: 5, foldSpin: 0.1, decay: 0.955, blur: 0.25, hueDrift: 1.2, waveMode: 1, waveAmp: 0.6, waveSize: 0.12, waveThick: 0.005, waveHue: 330, waveHueSpread: 90, sparkCount: 10, sparkSize: 0.005, sparkSpread: 0.25, sparkSpeed: 0.7, sparkHue: 300, palette: 6, palFreq: 1.2, vignette: 0.4 },
    mods: { zoom: ['bass', 0.05], waveSize: ['beat', 0.08], foldRot: ['lfo2', 0.15], sparkSpread: ['mid', 0.08] },
  },
  {
    name: 'Copper Loom',
    params: { zoom: 1.0, rot: 0.002, stretchY: 1.004, edgeMode: 1, decay: 0.975, blur: 0.15, sharpen: 0.3, waveMode: 3, waveAmp: 0.7, waveSize: 0.4, waveThick: 0.003, waveRot: 90, waveHue: 30, waveSat: 0.5, palette: 7, palFreq: 1.8, contrast: 1.2, vignette: 0.35 },
    mods: { waveSize: ['lfo1', 0.12], rot: ['mid', 0.06], stretchY: ['bass', 0.1] },
  },
  // ---- v2.2: generator showcases ----
  {
    name: 'Lissajous Loom',
    params: { zoom: 1.006, decay: 0.95, blur: 0.2, waveMode: 0, curveMode: 1, curveA: 3, curveB: 2, curveSize: 0.32, curveThick: 0.004, curveSpin: 0.4, curveHue: 190, curveHueSpread: 120, curveBright: 1.1, palette: 3, palFreq: 1.3, vignette: 0.4 },
    mods: { curveSize: ['bass_att', 0.08], curveA: ['lfo1', 0.01], rot: ['lfo2', 0.08] },
  },
  {
    name: 'Rose Window',
    params: { zoom: 1.01, decay: 0.955, blur: 0.15, sharpen: 0.25, waveMode: 0, curveMode: 2, curveA: 5, curveB: 1, curveLoops: 1, curveSize: 0.3, curveThick: 0.005, curveSpin: 0.25, curveRot: 0.1, curveHue: 30, curveHueSpread: 60, ringMode: 1, ringFreq: 5, ringSpeed: 0.3, ringThick: 0.05, ringFade: 3, ringHue: 40, ringBright: 0.25, palette: 7, palFreq: 1.4, contrast: 1.15, vignette: 0.45 },
    mods: { curveSize: ['bass', 0.06], ringBright: ['beat', 0.2], palPhase: ['lfo1', 0.15] },
  },
  {
    name: 'Harmonograph Drift',
    params: { zoom: 1.006, flow: 0.002, decay: 0.95, blur: 0.15, waveMode: 0, curveMode: 3, curveA: 2, curveB: 3, curveC: 1.5, curveDamp: 0.02, curveLoops: 3, curveSize: 0.42, curveThick: 0.003, curveSpin: 0.15, curveHue: 290, curveHueSpread: 160, curveBright: 0.9, palette: 5, palFreq: 1.1, vignette: 0.4 },
    mods: { curveC: ['lfo2', 0.03], curveDamp: ['bass_att', 0.02], flow: ['mid', 0.1] },
  },
  {
    name: 'Spirograph Bloom',
    params: { zoom: 1.015, decay: 0.95, blur: 0.2, hueDrift: 1.2, waveMode: 0, curveMode: 4, curveA: 5, curveB: 3, curveC: 0.8, curveLoops: 3, curveSize: 0.33, curveThick: 0.004, curveSpin: 0.3, curveRot: -0.15, curveHue: 320, curveHueSpread: 200, palette: 6, palFreq: 1.2, vignette: 0.4 },
    mods: { zoom: ['bass', 0.05], curveC: ['lfo1', 0.08], curveBright: ['beat', 0.2] },
  },
  {
    name: 'Galaxy Arms',
    params: { zoom: 0.992, swirl: 0.02, decay: 0.965, blur: 0.3, waveMode: 0, spiralMode: 1, spiralArms: 2, spiralTwist: 2.2, spiralThick: 0.06, spiralReach: 0.7, spiralSpin: 0.4, spiralHue: 220, spiralHueSpread: 100, spiralBright: 0.6, sparkCount: 20, sparkSize: 0.004, sparkSpread: 0.5, sparkSpeed: 0.2, sparkHue: 200, sparkBright: 1.8, palette: 3, palFreq: 1.1, vignette: 0.5 },
    mods: { spiralBright: ['beat', 0.15], swirl: ['bass_att', 0.1], spiralTwist: ['lfo1', 0.04] },
  },
  {
    name: 'Sunburst',
    params: { zoom: 1.03, decay: 0.92, blur: 0.25, waveMode: 0, rayMode: 2, rayCount: 32, rayWidth: 0.35, rayInner: 0.06, rayOuter: 0.6, raySpin: 0.15, rayHue: 30, rayHueSpread: 40, rayBright: 0.7, flash: 0.05, flashSize: 0.1, flashHue: 40, palette: 2, palFreq: 1.3, vignette: 0.45 },
    mods: { flash: ['beat', 0.15], raySpin: ['mid', 0.05], zoom: ['bass', 0.04] },
  },
  {
    name: 'Sonar',
    params: { zoom: 1.0, rot: 0.003, decay: 0.9, blur: 0.15, waveMode: 1, waveAmp: 0.4, waveSize: 0.1, waveThick: 0.003, waveHue: 150, waveSat: 0.5, ringMode: 1, ringFreq: 8, ringSpeed: 1, ringThick: 0.04, ringFade: 2.5, ringHue: 150, ringHueSpread: 20, ringBright: 0.45, palette: 4, palFreq: 1.3, vignette: 0.5 },
    mods: { ringBright: ['beat', 0.25], ringSpeed: ['bass_att', 0.05], waveAmp: ['vol', 0.15] },
  },
  {
    name: 'Hex Reactor',
    params: { zoom: 1.02, decay: 0.93, blur: 0.2, sharpen: 0.2, waveMode: 0, gridMode: 3, gridScale: 6, gridThick: 0.04, gridSpin: 0.08, gridFade: 3, gridHue: 30, gridHueSpread: 80, gridBright: 0.5, flash: 0.05, flashSize: 0.12, flashHue: 30, palette: 7, palFreq: 1.5, contrast: 1.1, vignette: 0.4 },
    mods: { gridBright: ['beat', 0.2], gridScale: ['lfo1', 0.04], zoom: ['bass', 0.04] },
  },
  {
    name: 'Lava Lamp',
    params: { zoom: 1.0, dy: 0.0015, flow: 0.004, flowScale: 3, decay: 0.95, blur: 0.4, edgeMode: 1, waveMode: 0, blobMode: 1, blobCount: 5, blobSize: 0.1, blobSpread: 0.2, blobSpeed: 0.35, blobHue: 15, blobHueSpread: 40, blobBright: 0.35, palette: 2, palFreq: 1.2, vignette: 0.4 },
    mods: { blobSize: ['bass', 0.05], flow: ['mid_att', 0.1], blobSpread: ['lfo1', 0.06] },
  },
  {
    name: 'Plasma Shore',
    params: { zoom: 1.02, swirl: 0.008, decay: 0.965, blur: 0.3, waveMode: 1, waveAmp: 0.5, waveSize: 0.12, waveHue: 180, waveSat: 0.4, plasmaAmt: 0.12, plasmaScale: 5, plasmaSpeed: 0.8, plasmaEdge: 0.85, plasmaHue: 180, plasmaHueSpread: 160, palette: 1, palMix: 0.6, palFreq: 0.9, vignette: 0.35 },
    mods: { plasmaAmt: ['vol', 0.06], swirl: ['lfo1', 0.15], waveSize: ['beat', 0.05] },
  },
  {
    name: 'Square Pulse',
    params: { zoom: 0.985, decay: 0.92, blur: 0.1, sharpen: 0.2, edgeMode: 2, waveMode: 0, ringMode: 2, ringFreq: 6, ringSpeed: -0.8, ringThick: 0.05, ringFade: 1.5, ringHue: 300, ringHueSpread: 120, ringBright: 0.5, gridMode: 1, gridScale: 10, gridThick: 0.02, gridFade: 4, gridHue: 180, gridBright: 0.2, palette: 9, palFreq: 1.4, vignette: 0.35 },
    mods: { ringBright: ['beat', 0.25], zoom: ['bass', -0.04], gridSpin: ['lfo2', 0.05] },
  },
  {
    name: 'Orbit Lace',
    params: { zoom: 1.012, decay: 0.95, blur: 0.1, waveMode: 0, blobMode: 2, blobCount: 6, blobSize: 0.07, blobSpread: 0.25, blobSpeed: 0.7, blobHue: 260, blobHueSpread: 160, blobBright: 1.6, palette: 5, palFreq: 1.3, vignette: 0.4 },
    mods: { blobSize: ['bass_att', 0.06], blobSpeed: ['mid', 0.05], palPhase: ['lfo2', 0.2] },
  },
  // ---- v2.2: fractals ----
  {
    name: 'Julia Breath',
    params: { zoom: 1.0, decay: 0.9, blur: 0.1, waveMode: 0, fracMode: 1, fracStyle: 0, fracRe: -0.7, fracIm: 0.27015, fracZoom: 0.35, fracIter: 64, fracReach: 0.9, fracSpin: 0.04, fracHue: 190, fracHueSpread: 140, fracBright: 0.3, palette: 3, palFreq: 1.2, vignette: 0.35 },
    mods: { fracRe: ['lfo1', 0.012], fracIm: ['lfo2', 0.012], fracBright: ['beat', 0.08] },
  },
  {
    name: 'Mandelbrot Tide',
    params: { zoom: 1.008, decay: 0.92, blur: 0.15, waveMode: 0, fracMode: 2, fracStyle: 0, fracRe: -0.6, fracIm: 0, fracZoom: 0.3, fracIter: 64, fracReach: 1.2, fracHue: 20, fracHueSpread: 90, fracBright: 0.45, palette: 2, palFreq: 1.4, vignette: 0.4 },
    mods: { fracZoom: ['bass_att', 0.015], palPhase: ['lfo1', 0.2], zoom: ['beat', 0.03] },
  },
  {
    name: 'Burning Coast',
    params: { zoom: 1.0, rot: 0.002, decay: 0.9, blur: 0.1, sharpen: 0.2, waveMode: 0, fracMode: 3, fracStyle: 0, fracRe: -0.45, fracIm: -0.5, fracZoom: 0.1, fracIter: 64, fracReach: 1.4, fracSpin: 0.03, fracHue: 25, fracHueSpread: 60, fracBright: 0.4, palette: 7, palFreq: 1.5, contrast: 1.15, vignette: 0.45 },
    mods: { fracZoom: ['lfo1', 0.01], fracBright: ['beat', 0.06] },
  },
  {
    name: 'Multibrot Iris',
    params: { zoom: 1.012, decay: 0.92, blur: 0.15, waveMode: 0, fracMode: 4, fracStyle: 1, fracPower: 4, fracRe: 0, fracIm: 0, fracZoom: 0.2, fracIter: 32, fracReach: 0.75, fracSpin: 0.1, fracHue: 290, fracHueSpread: 160, fracBright: 0.2, palette: 5, palFreq: 1.2, contrast: 1.35, vignette: 0.4 },
    mods: { fracPower: ['lfo1', 0.02], fracZoom: ['bass_att', 0.015], hueDrift: ['mid', 0.04] },
  },
  {
    name: 'Sierpinski Bloom',
    params: { zoom: 1.012, decay: 0.94, blur: 0.15, waveMode: 0, kifsMode: 1, kifsShape: 0, kifsIter: 6, kifsScale: 2, kifsOffset: 1, kifsSize: 0.38, kifsThick: 0.1, kifsSpin: 0.15, kifsHue: 330, kifsHueSpread: 160, kifsBright: 0.8, palette: 6, palFreq: 1.2, vignette: 0.4 },
    mods: { kifsAngle: ['lfo1', 0.04], kifsScale: ['bass', 0.03], kifsBright: ['beat', 0.15] },
  },
  {
    name: 'Crystal Carpet',
    params: { zoom: 1.005, decay: 0.93, blur: 0.1, sharpen: 0.3, waveMode: 0, kifsMode: 2, kifsShape: 2, kifsIter: 5, kifsScale: 2.2, kifsAngle: 12, kifsTwistSpin: 0.05, kifsOffset: 1, kifsSize: 0.32, kifsThick: 0.08, kifsSpin: -0.08, kifsHue: 190, kifsHueSpread: 90, kifsBright: 0.8, palette: 3, palFreq: 1.6, contrast: 1.15, vignette: 0.4 },
    mods: { kifsOffset: ['lfo3', 0.03], kifsScale: ['bass_att', 0.03], zoom: ['beat', 0.03] },
  },
  {
    name: 'Snowflake Engine',
    params: { zoom: 1.0, swirl: 0.01, decay: 0.92, blur: 0.15, waveMode: 0, kifsMode: 3, kifsShape: 0, kifsIter: 4, kifsScale: 2.4, kifsOffset: 0.9, kifsSym: 6, kifsSize: 0.4, kifsThick: 0.1, kifsSpin: 0.12, kifsHue: 200, kifsHueSpread: 60, kifsBright: 1.2, palette: 8, palFreq: 1.8, contrast: 1.2, vignette: 0.45 },
    mods: { kifsAngle: ['lfo2', 0.05], kifsSize: ['bass', 0.03], kifsBright: ['beat', 0.15] },
  },
  {
    name: 'Feedback Julia',
    params: { zoom: 1.0, decay: 0.985, blur: 0.05, edgeMode: 1, waveMode: 1, waveAmp: 0.5, waveSize: 0.15, waveThick: 0.006, waveHue: 200, waveHueSpread: 200, waveBright: 1.6, flash: 0.1, flashSize: 0.08, flashHue: 190, cmapMode: 1, cmapMix: 1, cmapRe: -0.4, cmapIm: 0.6, cmapScale: 2, palette: 1, palMix: 0.5, palFreq: 1.1, vignette: 0.3 },
    mods: { cmapRe: ['lfo1', 0.01], cmapIm: ['lfo2', 0.01], waveAmp: ['vol', 0.15] },
  },
  {
    name: 'Inversion Well',
    params: { zoom: 1.0, decay: 0.95, blur: 0.1, edgeMode: 1, waveMode: 0, shapeMode: 1, shapeSides: 4, shapeCount: 4, shapeSize: 0.05, shapeOrbit: 0.2, shapeOrbitSpin: 0.5, shapeHue: 150, shapeHueSpread: 120, shapeBright: 1, cmapMode: 3, cmapMix: 0.85, cmapRe: 0.1, cmapIm: 0, cmapScale: 1.5, palette: 4, palFreq: 1.3, vignette: 0.35 },
    mods: { cmapRe: ['lfo1', 0.02], shapeSize: ['beat', 0.04], cmapMix: ['bass_att', 0.05] },
  },
  {
    name: 'Sine Garden',
    params: { zoom: 1.0, decay: 0.96, blur: 0.1, edgeMode: 1, waveMode: 2, waveAmp: 0.7, waveThick: 0.004, waveHue: 300, waveHueSpread: 160, cmapMode: 4, cmapMix: 0.5, cmapRe: 0, cmapIm: 0, cmapScale: 2.2, palette: 5, palFreq: 1.2, vignette: 0.35 },
    mods: { cmapMix: ['lfo1', 0.08], cmapIm: ['lfo2', 0.01], waveRot: ['lfo3', 0.1] },
  },
];
