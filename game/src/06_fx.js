
// =====================================================================
// LIGHT AND PARTICLES: one sheet of glows, two particle layers, bloom on the light,
// rippling water, shockwaves and moonbeams (the filters only run on 'alto')
// =====================================================================
// every particle comes from this one sheet (a particle layer draws from a single texture)
const fxSheet = offscreen(512, 64, 1, g => {
  const soft = (x, y, r, stops) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); for (const [o, a] of stops) gr.addColorStop(o, `rgba(255,255,255,${a})`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  // 0..64 dot: soft light
  soft(32, 32, 31, [[0, 1], [0.3, 0.6], [1, 0]]);
  // 64..128 star: a four-point sparkle with a bright heart
  g.fillStyle = '#fff';
  for (const [l, w, a] of [[31, 3.4, 0], [17, 2.2, Math.PI / 4]]) {
    g.save(); g.translate(96, 32); g.rotate(a);
    g.beginPath(); g.moveTo(0, -l); g.quadraticCurveTo(w * 0.4, -w * 0.4, l, 0); g.quadraticCurveTo(w * 0.4, w * 0.4, 0, l); g.quadraticCurveTo(-w * 0.4, w * 0.4, -l, 0); g.quadraticCurveTo(-w * 0.4, -w * 0.4, 0, -l); g.fill();
    g.restore();
  }
  soft(96, 32, 10, [[0, 1], [1, 0]]);
  // 128..256 streak: a long soft bar of light (rays, sparks that fly)
  const lg = g.createLinearGradient(128, 0, 256, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.7, 'rgba(255,255,255,0.85)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.save(); g.beginPath(); g.rect(128, 0, 128, 64); g.clip();
  for (let i = 0; i < 6; i++) { g.globalAlpha = 0.26; g.fillStyle = lg; g.beginPath(); g.ellipse(192, 32, 62, 3 + i * 2.6, 0, 0, TAU); g.fill(); }
  g.restore(); g.globalAlpha = 1;
  // 256..320 ring
  g.strokeStyle = '#fff';
  for (let i = 0; i < 5; i++) { g.globalAlpha = 0.2 + i * 0.16; g.lineWidth = 9 - i * 1.7; g.beginPath(); g.arc(288, 32, 25, 0, TAU); g.stroke(); }
  g.globalAlpha = 1;
  // 320..384 foam: a soft blob with a firmer edge
  soft(352, 32, 30, [[0, 0.85], [0.6, 0.7], [1, 0]]);
  // 384..448 spark: a hard white core
  soft(416, 32, 16, [[0, 1], [0.45, 1], [1, 0]]);
  // 448..480 chip: a splinter of wood (tinted brown) | 480..512 drop of water
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(450, 12); g.lineTo(476, 8); g.lineTo(478, 18); g.lineTo(452, 22); g.closePath(); g.fill();
  soft(496, 16, 12, [[0, 1], [0.6, 0.8], [1, 0]]);
  // 448..512 x 32..64 bubble: a thin ring
  g.lineWidth = 2.5; g.globalAlpha = 0.9; g.beginPath(); g.arc(480, 48, 11, 0, TAU); g.stroke(); g.globalAlpha = 1;
});
const fxSrc = new PIXI.CanvasSource({ resource: fxSheet, autoGenerateMipmaps: true });
const fxTex = (x, y, w, h) => new PIXI.Texture({ source: fxSrc, frame: new PIXI.Rectangle(x, y, w, h), defaultAnchor: { x: 0.5, y: 0.5 } });
const FX = {
  dot: fxTex(0, 0, 64, 64), star: fxTex(64, 0, 64, 64), streak: fxTex(128, 0, 128, 64), ring: fxTex(256, 0, 64, 64),
  foam: fxTex(320, 0, 64, 64), spark: fxTex(384, 0, 64, 64), chip: fxTex(448, 0, 32, 32), drop: fxTex(480, 0, 32, 32), bubble: fxTex(448, 32, 64, 32),
};
// a big soft glow for sprites that stay (the moon's halo, a treasure, the pearls)
const GLOW = texOf(offscreen(128, 128, 1, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 63); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }));
// a soft dark oval: the shadow of whatever flies over the water
const SHADOW = texOf(offscreen(128, 64, 1, g => { const gr = g.createRadialGradient(64, 32, 0, 64, 32, 62); gr.addColorStop(0, 'rgba(0,8,20,0.55)'); gr.addColorStop(1, 'rgba(0,8,20,0)'); g.save(); g.scale(1, 0.5); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.restore(); }));
const glow = (layer, tint, size, alpha = 1) => { const s = new PIXI.Sprite(GLOW); s.tint = tint; s.alpha = alpha; s.scale.set(size / 128); layer.addChild(s); return s; };

// ---- particles: 'add' glows over everything (with bloom), 'norm' is foam and spray on the water
const PART = {}, parts = [], pfree = { add: [], norm: [] }, PMAX = { add: 1100, norm: 800 };
function initParticles() {
  for (const k of ['add', 'norm']) {
    const c = new PIXI.ParticleContainer({ dynamicProperties: { position: true, rotation: true, vertex: true, color: true, uvs: true } });
    c.boundsArea = new PIXI.Rectangle(-1e6, -1e6, 2e6, 2e6);
    if (k === 'add') { c.blendMode = 'add'; L.fx.addChild(c); } else L.wake.addChild(c);
    PART[k] = c;
  }
}
// o: tex, x, y, vx, vy, life, s0 -> s1 (size in world units), a (alpha), tint, rot, vr, drag, g (sinks or rises), sx (stretch), align (turn with its speed), add
function puff(o) {
  const k = o.add ? 'add' : 'norm';
  let p = pfree[k].pop();
  if (!p) { if (PART[k].particleChildren.length >= PMAX[k]) return null; p = new PIXI.Particle({ texture: o.tex, anchorX: 0.5, anchorY: 0.5 }); PART[k].addParticle(p); }
  p.texture = o.tex; p.tint = o.tint ?? 0xffffff;
  const q = { p, k, tex: o.tex, x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, t: 0, life: o.life || 0.6, s0: o.s0 ?? 10, s1: o.s1 ?? o.s0 ?? 10,
    a: o.a ?? 1, rot: o.rot || 0, vr: o.vr || 0, drag: o.drag || 0, g: o.g || 0, sx: o.sx || 1, align: !!o.align, fadeIn: o.fadeIn || 0 };
  parts.push(q); placeParticle(q);
  return q;
}
function placeParticle(q) {
  const p = q.p, f = q.t / q.life, sz = q.s0 + (q.s1 - q.s0) * f, h = q.tex.frame.height;
  p.x = q.x; p.y = q.y; p.scaleX = sz * q.sx / h; p.scaleY = sz / h;
  p.rotation = q.align ? Math.atan2(q.vy, q.vx) : q.rot;
  p.alpha = q.a * (1 - f * f) * (q.fadeIn ? Math.min(1, f / q.fadeIn) : 1);
}
function fxTick(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i]; q.t += dt;
    if (q.t >= q.life) { q.p.alpha = 0; pfree[q.k].push(q.p); parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    const d = 1 - Math.min(1, q.drag * dt);
    q.vx *= d; q.vy = q.vy * d + q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
    placeParticle(q);
  }
}
// ---- ready-made effects
const COL = { moon: 0xdff2ff, ray: 0x9fd8ff, gold: 0xffd36b, coral: 0xff6b5a, lilac: 0xc9b2ff, foam: 0xe6f6ff, wood: 0x7a4a26, ink: 0x1a0f2e, blood: 0xff5f6d };
function sparks(x, y, tint, n = 8, spd = 160, size = 9) {
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = spd * rand(0.4, 1); puff({ add: true, tex: FX.streak, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.18, 0.4), s0: size, s1: size * 0.3, sx: 2.2, tint, drag: 4, align: true }); }
  puff({ add: true, tex: FX.dot, x, y, life: 0.18, s0: size * 3, s1: size * 4.5, tint, a: 0.9 });
}
function splash(x, y, k = 1) {
  for (let i = 0; i < 6 * k; i++) { const a = rand(0, TAU), v = rand(40, 110) * k; puff({ tex: FX.drop, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 30, g: 160, life: rand(0.35, 0.6), s0: rand(4, 7) * k, s1: 2, tint: COL.foam, drag: 1.5 }); }
  puff({ tex: FX.ring, x, y, life: 0.6, s0: 14 * k, s1: 70 * k, sx: 1.4, a: 0.7, tint: COL.foam });
  puff({ tex: FX.foam, x, y, life: 0.8, s0: 22 * k, s1: 46 * k, sx: 1.4, a: 0.55, tint: COL.foam });
}
function sinkFx(x, y, k = 1) {
  splash(x, y, k);
  for (let i = 0; i < 7 * k; i++) { const a = rand(0, TAU), v = rand(60, 170) * k; puff({ tex: FX.chip, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.5, 0.9), s0: rand(8, 13), s1: 6, rot: rand(0, TAU), vr: rand(-9, 9), tint: COL.wood, drag: 2.5 }); }
  for (let i = 0; i < 5; i++) puff({ tex: FX.bubble, x: x + rand(-14, 14) * k, y: y + rand(-8, 8) * k, vy: -rand(4, 14), life: rand(0.6, 1.2), s0: rand(3, 6), s1: rand(6, 9), a: 0.8, tint: COL.foam, fadeIn: 0.2 });
}
function wakePuff(x, y, s, vx = 0, vy = 0, a = 0.2, life = 0.85) { puff({ tex: FX.foam, x, y, vx, vy, life, s0: s * 0.8, s1: s * 1.7, sx: 1.2, a, tint: COL.foam, drag: 1.2 }); }
function ringWave(x, y, tint, r0, r1, life = 0.5, a = 0.9) { return puff({ add: true, tex: FX.ring, x, y, life, s0: r0 * 2, s1: r1 * 2, tint, a }); }

// ---- damage numbers (a bitmap font made once from Figtree, or the system font when offline)
let numFont = false;
const nums = [], numFree = [];
function numText(x, y, txt, tint = 0xffffff, size = 13) {
  if (!numFont || nums.length > 60) return;
  let t = numFree.pop();
  if (!t) { t = new PIXI.BitmapText({ text: '', style: { fontFamily: 'lunaNum', fontSize: 14 } }); t.anchor.set(0.5); L.num.addChild(t); }
  t.text = txt; t.tint = tint; t.visible = true; t.scale.set(size / 14); t.x = x + rand(-6, 6); t.y = y;
  nums.push({ t, life: 0.7, age: 0, vy: -46, s: size / 14 });
}
function numsTick(dt) {
  for (let i = nums.length - 1; i >= 0; i--) {
    const n = nums[i]; n.age += dt;
    if (n.age >= n.life) { n.t.visible = false; numFree.push(n.t); nums.splice(i, 1); continue; }
    n.t.y += n.vy * dt; n.vy *= 1 - 3 * dt;
    const f = n.age / n.life; n.t.alpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3; n.t.scale.set(n.s * (f < 0.12 ? 1 + (0.12 - f) * 4 : 1));
  }
}

// ---- filters
const FILT = {};
let rippleSpr = null, rays = null;
// a seamless map of slow swells: red and green push the water sideways and up and down
function rippleTex() {
  const n = 128, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), im = g.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n * TAU, v = y / n * TAU, i = (y * n + x) * 4;
    im.data[i] = 128 + 60 * Math.sin(u * 2 + Math.cos(v) * 1.5) + 40 * Math.sin(v * 3 + u);
    im.data[i + 1] = 128 + 60 * Math.cos(v * 2 + Math.sin(u * 2) * 1.2) + 40 * Math.sin(u * 3 - v);
    im.data[i + 2] = 128; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const t = new PIXI.Texture({ source: new PIXI.CanvasSource({ resource: c, addressMode: 'repeat' }) });
  return t;
}
function initFilters() {
  rippleSpr = new PIXI.Sprite(rippleTex()); rippleSpr.renderable = false; rippleSpr.scale.set(5); L.sea.addChild(rippleSpr);
  FILT.ripple = new PIXI.DisplacementFilter({ sprite: rippleSpr, scale: 9 }); FILT.ripple.resolution = 1;
  FILT.bloom = new PIXI.filters.AdvancedBloomFilter({ threshold: 0.25, bloomScale: 1.15, brightness: 1, blur: 7, quality: 4 });
  FILT.bloom.resolution = 0.5; FILT.bloom.blendMode = 'add';
  // moonbeams: slanted shafts of light that drift over the whole screen
  FILT.rays = new PIXI.filters.GodrayFilter({ angle: 24, gain: 0.42, lacunarity: 2.6, parallel: true, alpha: 0.26 });
  FILT.rays.resolution = 0.35; FILT.rays.blendMode = 'add';
  rays = new PIXI.Graphics(); rays.rect(0, 0, 10, 10).fill({ color: 0x000000, alpha: 0.004 }); rays.filters = [FILT.rays];
  ui.addChildAt(rays, 0);
  FILT.shock = [];
}
function applyQuality() {
  const hi = FXQ === 'alto';
  L.sea.filters = hi ? [FILT.ripple] : null;
  L.fx.filters = hi ? [FILT.bloom] : null;
  rays.visible = hi && !reduceMotion;
  resize();
}
// a ring of distortion that runs out from a point (the tsunami, the Kraken rising, a slam)
function shock(x, y, amp = 26, wave = 140, speed = 520, radius = 600) {
  if (FXQ !== 'alto' || reduceMotion) return;
  const f = new PIXI.filters.ShockwaveFilter({ center: { x: 0, y: 0 }, amplitude: amp, wavelength: wave, speed, brightness: 1.15, radius });
  FILT.shock.push({ f, x, y, t: 0, life: radius / speed + 0.2 });
  world.filters = FILT.shock.map(s => s.f);
}
function filtersTick(dt) {
  if (rippleSpr) { rippleSpr.x = (T * 9) % 640; rippleSpr.y = (T * 5) % 640; }
  if (rays && rays.visible) { rays.width = W; rays.height = H; FILT.rays.time = T * 0.35; }
  if (FILT.shock && FILT.shock.length) {
    for (const s of FILT.shock) { s.t += dt; const p = toScreen(s.x, s.y); s.f.center = { x: p.x, y: p.y }; s.f.time = s.t; }
    const n = FILT.shock.length; FILT.shock = FILT.shock.filter(s => s.t < s.life);
    if (FILT.shock.length !== n) world.filters = FILT.shock.length ? FILT.shock.map(s => s.f) : null;
  }
}
