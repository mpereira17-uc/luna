// =====================================================================
// THE OPEN SEA: one map with no edges and four seas in it, that change little by little as the moon travels.
// The Mareas in the middle; the Océano Congelado to the north, the Archipiélago Maldito to the east,
// the Mar de Sangre to the west. Props are laid out chunk by chunk, always the same for the same place.
// =====================================================================
const CHUNK = 640;
const SEA = { base: '#0c4a5e' };

// ---- the four seas: colours of the water, the island art they use, and what they bring
// base = the water, light = lighter patches, crest = foam and swells, pool = the moon's light on it, body = a cast over ships and islands
const ZONES = {
  mareas: { name: 'Mar de las Mareas', sub: 'Corrientes, remolinos y destellos', base: 0x0c4a5e, light: 0x2ab0bc, crest: 0xc6f6ff, pool: 0x58d4dc, body: 0xffffff, biome: 'coral', map: 0x1e8c9c },
  archi:  { name: 'Archipiélago Maldito', sub: 'Islas, naufragios y tesoros ocultos', base: 0x0e5180, light: 0x3cc0dc, crest: 0xe0f8ff, pool: 0x6ac8ff, body: 0xf4f0ff, biome: 'abismo', map: 0x2c78b8 },
  hielo:  { name: 'Océano Congelado', sub: 'Hielo flotante y tormentas de nieve', base: 0x2a6890, light: 0xb0e6f8, crest: 0xffffff, pool: 0xd0f2ff, body: 0xeaf6ff, biome: 'escarcha', map: 0xa8dcf0 },
  sangre: { name: 'Mar de Sangre', sub: 'Niebla roja bajo la Luna Roja', base: 0x2c0812, light: 0x9a1c30, crest: 0xffa8a8, pool: 0xff4a5a, body: 0xffd6d6, biome: 'brasa', map: 0x9a1c30 },
};
const ZK = Object.keys(ZONES);
// the three outer seas each fill a third of the circle around the Mareas
const SECT = [['hielo', -Math.PI / 2], ['archi', Math.PI / 6], ['sangre', Math.PI * 5 / 6]];
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ZONE_IN = 1100, ZONE_OUT = 1800;   // where the Mareas start to give way, and where they are gone
function zoneMix(x, y) {
  const d = Math.hypot(x, y), out = smooth(ZONE_IN, ZONE_OUT, d), w = { mareas: 1 - out, archi: 0, hielo: 0, sangre: 0 };
  if (out > 0) {
    const a = Math.atan2(y, x); let sum = 0;
    const ws = SECT.map(([k, c]) => { const da = Math.abs(((a - c) % TAU + TAU * 1.5) % TAU - Math.PI), v = 1 - smooth(Math.PI / 3 - 0.35, Math.PI / 3 + 0.35, da); sum += v; return [k, v]; });
    for (const [k, v] of ws) w[k] = out * v / (sum || 1);
  }
  return w;
}
function zoneAt(x, y) { const w = zoneMix(x, y); let best = 'mareas'; for (const k of ZK) if (w[k] > w[best]) best = k; return best; }
// a colour mixed from the four seas by how much of each is here
function zoneCol(w, key) {
  let r = 0, g = 0, b = 0;
  for (const k of ZK) { if (!w[k]) continue; const c = ZONES[k][key]; r += (c >> 16) * w[k]; g += ((c >> 8) & 255) * w[k]; b += (c & 255) * w[k]; }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

// ---- pre-drawn pieces: tiles of water painted once onto their own canvases (offscreen() is in 04_canvas.js)
// big soft patches of lighter water (white, tinted by the sea) and of deep water (black), seamless
const DEPTH_T = 1024;
function depthTile(seed, light) {
  return offscreen(DEPTH_T, DEPTH_T, 0.25, g => {
    const r = rng(seed);
    for (let i = 0; i < 30; i++) {
      const x = r() * DEPTH_T, y = r() * DEPTH_T, rad = 90 + r() * 260;
      for (const ox of [-DEPTH_T, 0, DEPTH_T]) for (const oy of [-DEPTH_T, 0, DEPTH_T]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.34)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      }
    }
  });
}
const lightTile = depthTile(7, true), darkTile = depthTile(19, false);
// cartoon wave crests, two sizes, scattered so the tile does not show its seams (white, tinted by the sea)
const WAVE_T = 320;
function waveTile(seed, n, size, alpha) {
  return offscreen(WAVE_T, WAVE_T, 2, g => {
    const r = rng(seed); g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const x = r() * WAVE_T, y = r() * WAVE_T, w = size * (0.6 + r() * 0.8), a = alpha * (0.5 + r() * 0.5);
      for (const ox of [-WAVE_T, 0, WAVE_T]) for (const oy of [-WAVE_T, 0, WAVE_T]) {
        g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 1.6 + size * 0.06;
        g.beginPath(); g.moveTo(x + ox - w, y + oy); g.quadraticCurveTo(x + ox - w / 2, y + oy - w * 0.45, x + ox, y + oy);
        if (r() < 0.22) g.quadraticCurveTo(x + ox + w / 2, y + oy - w * 0.45, x + ox + w, y + oy);
        g.stroke();
      }
    }
  });
}
const wavesA = waveTile(11, 30, 14, 0.16), wavesB = waveTile(23, 14, 26, 0.11);
// long swells that roll across the whole sea (the wavy lines of the concept), seamless both ways
const SWELL_T = 640;
const swellTile = offscreen(SWELL_T, SWELL_T, 1, g => {
  const r = rng(31); g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const y0 = (i + r() * 0.6) * SWELL_T / 16, amp = 8 + r() * 16, k = TAU * (1 + Math.floor(r() * 2)) / SWELL_T, ph = r() * TAU, a = 0.05 + r() * 0.07;
    for (const oy of [-SWELL_T, 0, SWELL_T]) {
      g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 1.4 + r() * 1.4;
      g.beginPath();
      for (let x = 0; x <= SWELL_T; x += 8) { const y = y0 + oy + Math.sin(x * k + ph) * amp + Math.sin(x * k * 3 + ph * 2) * amp * 0.25; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
  }
});

// ---- textures painted for this game: a whirlpool, ice floes, an iceberg (the sea props the original never had)
function paintVortex() {
  return offscreen(256, 256, 1, g => {
    const c = 128, r = rng(5);
    const deep = g.createRadialGradient(c, c, 0, c, c, 126);
    deep.addColorStop(0, 'rgba(1,10,20,0.95)'); deep.addColorStop(0.25, 'rgba(3,30,48,0.75)'); deep.addColorStop(0.7, 'rgba(10,70,96,0.35)'); deep.addColorStop(1, 'rgba(10,70,96,0)');
    g.fillStyle = deep; g.beginPath(); g.arc(c, c, 126, 0, TAU); g.fill();
    // arms of foam spiralling into the eye, thick outside and thin inside
    g.lineCap = 'round';
    for (let arm = 0; arm < 7; arm++) {
      const a0 = arm / 7 * TAU + r() * 0.4;
      for (let s = 0; s < 3; s++) {
        g.beginPath();
        for (let j = 0; j <= 40; j++) {
          const f = j / 40, ang = a0 + f * 4.2 + s * 0.08, rr = 122 * (1 - f * 0.9) - s * 3;
          const x = c + Math.cos(ang) * rr, y = c + Math.sin(ang) * rr;
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = `rgba(225,250,255,${0.22 + 0.2 * (s === 0) - s * 0.05})`; g.lineWidth = 5 - s * 1.4; g.stroke();
      }
    }
    // spray and sparkles caught in the spin
    for (let i = 0; i < 90; i++) { const ang = r() * TAU, rr = 20 + r() * 100, s = 1 + r() * 2.4; g.fillStyle = `rgba(235,252,255,${0.2 + r() * 0.5})`; g.beginPath(); g.ellipse(c + Math.cos(ang) * rr, c + Math.sin(ang) * rr, s * 2, s, ang + 1.6, 0, TAU); g.fill(); }
    const eye = g.createRadialGradient(c, c, 0, c, c, 30); eye.addColorStop(0, 'rgba(0,4,10,1)'); eye.addColorStop(1, 'rgba(0,4,10,0)');
    g.fillStyle = eye; g.beginPath(); g.arc(c, c, 30, 0, TAU); g.fill();
  });
}
// an irregular slab of sea ice seen from above: a lit top with snow, cracks, a darker rim and the pale ice under the water
function paintFloe(seed, w, h) {
  return offscreen(w, h, 2, g => {
    const r = rng(seed), cx = w / 2, cy = h / 2, n = 11, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + r() * 0.3, k = 0.72 + r() * 0.28; pts.push([cx + Math.cos(a) * (w / 2 - 8) * k, cy + Math.sin(a) * (h / 2 - 8) * k]); }
    const path = (dx = 0, dy = 0, s = 1) => { g.beginPath(); pts.forEach(([x, y], i) => { const px = cx + (x - cx) * s + dx, py = cy + (y - cy) * s + dy; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
    // the ice under the water, pale and blurred
    g.save(); g.filter = 'blur(4px)'; path(0, 3, 1.1); g.fillStyle = 'rgba(170,230,255,0.45)'; g.fill(); g.restore();
    // the rim, then the top
    path(0, 3); g.fillStyle = '#6fa8c8'; g.fill();
    path(); const top = g.createLinearGradient(0, 0, w * 0.3, h); top.addColorStop(0, '#ffffff'); top.addColorStop(0.55, '#e4f4fb'); top.addColorStop(1, '#b6d8ea'); g.fillStyle = top; g.fill();
    g.save(); path(); g.clip();
    // drifts of snow and blue melt pools
    for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h, rr = 6 + r() * 16; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.35 ? 'rgba(120,200,235,0.45)' : 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    g.strokeStyle = 'rgba(90,150,190,0.55)'; g.lineWidth = 1.1;
    for (let i = 0; i < 4; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (r() - 0.5) * 26; y += (r() - 0.5) * 18; g.lineTo(x, y); } g.stroke(); }
    // light on the upper edge
    path(-1.5, -1.5); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.stroke();
    g.restore();
    path(); g.strokeStyle = 'rgba(40,90,130,0.65)'; g.lineWidth = 1.4; g.stroke();
  });
}
// an iceberg: faceted peaks that catch the moonlight on one side
function paintBerg(seed) {
  return offscreen(180, 170, 2, g => {
    const r = rng(seed), base = 128;
    g.save(); g.filter = 'blur(6px)'; g.fillStyle = 'rgba(160,225,255,0.5)'; g.beginPath(); g.ellipse(90, base + 6, 84, 26, 0, 0, TAU); g.fill(); g.restore();
    const peaks = [[26, base, 54, 70], [52, base, 90, 22], [92, base, 128, 48], [118, base, 156, 84]];
    for (const [x0, y0, x1, top] of peaks) {
      const mid = (x0 + x1) / 2 + (r() - 0.5) * 10;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(mid, top); g.lineTo(mid + 4, y0 + 4); g.closePath(); g.fillStyle = '#f4fbff'; g.fill();
      g.beginPath(); g.moveTo(mid, top); g.lineTo(x1, y0); g.lineTo(mid + 4, y0 + 4); g.closePath(); g.fillStyle = '#9cc8e2'; g.fill();
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(mid, top); g.lineTo(x1, y0); g.strokeStyle = 'rgba(40,90,130,0.7)'; g.lineWidth = 1.6; g.stroke();
    }
    const wl = g.createLinearGradient(0, base - 8, 0, base + 10); wl.addColorStop(0, 'rgba(255,255,255,0)'); wl.addColorStop(1, 'rgba(120,190,230,0.9)');
    g.fillStyle = wl; g.fillRect(20, base - 8, 140, 18);
  });
}
let VORTEX_TEX = null, FLOE_TEX = [], BERG_TEX = null;
function initSeaArt() {
  VORTEX_TEX = texOf(paintVortex());
  FLOE_TEX = [paintFloe(3, 150, 110), paintFloe(8, 110, 90), paintFloe(14, 80, 64)].map(c => texOf(c));
  BERG_TEX = texOf(paintBerg(4), 0.5, 128 / 170);
}

// ---- currents: a slow field that bends across the sea; streaks show it, pearls and wreckage drift with it
function current(x, y) {
  const a = Math.sin(x * 0.0011 + Math.cos(y * 0.0013) * 1.7) * 1.6 + Math.cos(y * 0.0009 - x * 0.0004) * 1.3;
  const k = clamp(Math.sin(x * 0.0007 + y * 0.0005 + 1.3) * 0.9 + 0.25, 0, 1);
  return { x: Math.cos(a) * k * 22, y: Math.sin(a) * k * 22, k };
}
const streaks = [];
function streaksTick(dt) {
  const vw = viewW() / 2 + 80, vh = viewH() / 2 + 80;
  while (streaks.length < 60) streaks.push({ x: cam.x + rand(-vw, vw), y: cam.y + rand(-vh, vh), t: rand(0, 3), life: rand(2.5, 5) });
  for (const s of streaks) {
    const c = current(s.x, s.y); s.vx = c.x * 2.6; s.vy = c.y * 2.6; s.k = c.k;
    s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt;
    if (s.t > s.life || Math.abs(s.x - cam.x) > vw || Math.abs(s.y - cam.y) > vh) { s.x = cam.x + rand(-vw, vw); s.y = cam.y + rand(-vh, vh); s.t = 0; s.life = rand(2.5, 5); }
  }
  zoneFxTick(dt);
}

// ---- props: chunk by chunk, generated the first time the camera gets near; each sea lays out its own
const chunks = new Map();
function chunkAt(cx, cy) {
  const key = cx + ',' + cy;
  let c = chunks.get(key); if (c) return c;
  const r = rng(Math.floor(hash2(cx, cy, 91) * 4294967296)), props = [], x0 = cx * CHUNK, y0 = cy * CHUNK;
  const zone = zoneAt(x0 + CHUNK / 2, y0 + CHUNK / 2), biome = ZONES[zone].biome;
  const free = (x, y, rad) => Math.hypot(x, y) > 300 + rad && props.every(p => Math.hypot(p.x - x, p.y - y) > p.r + rad + 60);
  const place = (rad, tries = 8) => { for (let i = 0; i < tries; i++) { const x = x0 + 60 + r() * (CHUNK - 120), y = y0 + 60 + r() * (CHUNK - 120); if (free(x, y, rad)) return { x, y }; } return null; };
  const islet = (chance) => { let p; if (r() < chance && (p = place(80))) props.push({ k: 'islet', x: p.x, y: p.y, r: 72, v: Math.floor(r() * 3), biome, block: true }); };
  const wreck = (chance) => { let p; if (r() < chance && (p = place(46))) props.push({ k: 'wreck', x: p.x, y: p.y, r: 40, v: Math.floor(r() * 2), flip: r() < 0.5, block: true, loot: true }); };
  const reefs = (n) => { let p; for (let i = 0; i < n; i++) if ((p = place(30))) props.push({ k: 'reef', x: p.x, y: p.y, r: 24, v: Math.floor(r() * 5), biome, flip: r() < 0.5, block: true }); };
  const rocks = (n) => { let p; for (let i = 0; i < n; i++) if ((p = place(12, 4))) props.push({ k: 'rock', x: p.x, y: p.y, r: 10, v: r() < 0.5 ? 'rockA' : 'rockB', flip: r() < 0.5, block: true }); };
  let p;
  if (zone === 'mareas') {
    islet(0.22); wreck(0.18); reefs(Math.floor(r() * 3) + (r() < 0.3 ? 1 : 0)); rocks(2 + Math.floor(r() * 3));
    // whirlpools: they pull everything in, and the eye hurts
    if (r() < 0.16 && (p = place(110))) props.push({ k: 'vortex', x: p.x, y: p.y, r: 105, a: r() * TAU, block: false });
  } else if (zone === 'archi') {
    islet(0.9); islet(0.7); islet(0.45); wreck(0.5); reefs(2 + Math.floor(r() * 3)); rocks(3 + Math.floor(r() * 3));
    // hidden treasure: a glint in the shallows, open it by staying over it
    if (r() < 0.35 && (p = place(24))) props.push({ k: 'treasure', x: p.x, y: p.y, r: 18, block: false, loot: true });
  } else if (zone === 'hielo') {
    islet(0.12); reefs(Math.floor(r() * 2));
    for (let i = 0; i < 6 + Math.floor(r() * 4); i++) { const v = r() < 0.25 ? 0 : r() < 0.55 ? 1 : 2, rad = [52, 38, 26][v]; if ((p = place(rad - 20, 6))) props.push({ k: 'floe', x: p.x, y: p.y, r: rad, v, rot: r() * TAU, block: true }); }
    if (r() < 0.3 && (p = place(76))) props.push({ k: 'berg', x: p.x, y: p.y, r: 68, flip: r() < 0.5, block: true });
  } else {
    islet(0.16); reefs(1 + Math.floor(r() * 2)); rocks(1 + Math.floor(r() * 2));
    for (let i = 0; i < 1 + (r() < 0.5 ? 1 : 0); i++) if ((p = place(52))) props.push({ k: 'stack', x: p.x, y: p.y, r: 44, v: r() < 0.5 ? 'stackA' : 'stackB', flip: r() < 0.5, block: true });
    wreck(0.12);
  }
  // things under the water and floating on it: drawn under everything and never in the way
  const under = [];
  if (zone !== 'hielo') for (let i = 0; i < 3 + Math.floor(r() * 3); i++) under.push({ k: 'kelp', x: x0 + r() * CHUNK, y: y0 + r() * CHUNK, n: 3 + Math.floor(r() * 4), p: r() * 6, col: zone === 'sangre' ? 0x4a1020 : 0x123f3a });
  for (let i = 0; i < 2; i++) under.push({ k: 'plank', x: x0 + r() * CHUNK, y: y0 + r() * CHUNK, a: r() * TAU, p: r() * 6 });
  c = { props, under, zone };
  chunks.set(key, c);
  return c;
}
// every prop near a point (the camera, a ship), from the 3x3 chunks around it
function propsNear(x, y, out = []) {
  const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const c = chunkAt(cx + i, cy + j); for (const p of c.props) out.push(p); }
  return out;
}
function underNear(x, y, out = []) {
  const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const u of chunkAt(cx + i, cy + j).under) out.push(u);
  return out;
}
// the props in play this frame (what ships bump into), refreshed once per frame; their sprites come and go with them
let NEAR_PROPS = [];
const SHOWN = new Set();
function refreshProps() {
  NEAR_PROPS = propsNear(cam.x, cam.y);
  if (!artReady) return;
  const near = new Set(NEAR_PROPS);
  for (const p of SHOWN) if (!near.has(p)) { p.view.destroy({ children: true }); p.view = null; if (p.glow) { p.glow.destroy(); p.glow = null; } SHOWN.delete(p); }
  for (const p of NEAR_PROPS) if (!p.view) { propView(p); SHOWN.add(p); }
}
// push a body out of reefs, islets, ice and wrecks; returns the prop it hit
function pushOut(o, rad) {
  let hit = null;
  for (const p of NEAR_PROPS) {
    if (!p.block) continue;
    const dx = o.x - p.x, dy = o.y - p.y, min = p.r + rad, d2 = dx * dx + dy * dy;
    if (d2 < min * min && d2 > 0.01) { const d = Math.sqrt(d2), k = (min - d) / d; o.x += dx * k; o.y += dy * k; hit = p; }
  }
  return hit;
}
// the whirlpools of the Mareas pull the moon and the ships in; their eye hurts
function hazardsTick(dt) {
  for (const p of NEAR_PROPS) {
    if (p.k !== 'vortex') continue;
    const R = p.r;
    const dx = p.x - S.x, dy = p.y - S.y, d = Math.hypot(dx, dy) || 1;
    if (d < R) {
      const f = 1 - d / R;
      S.x += (dx / d * 40 * f - dy / d * 50 * f) * dt; S.y += (dy / d * 40 * f + dx / d * 50 * f) * dt;
      if (d < R * 0.3) hurtMoon(7 * dt);
    }
    eachNear(p.x, p.y, R + 20, e => {
      if (e.d.fly || (e.frozen || 0) > S.t) return;
      const ex = p.x - e.x, ey = p.y - e.y, ed = Math.hypot(ex, ey) || 1; if (ed > R) return;
      const f = 1 - ed / R; e.x += (ex / ed * 70 * f - ey / ed * 80 * f) * dt; e.y += (ey / ed * 70 * f + ex / ed * 80 * f) * dt;
      if (ed < R * 0.3) { e.vortexT = (e.vortexT || 0) + dt; if (e.vortexT > 0.5) { e.vortexT = 0; hurt(e, 6); } }
    });
  }
}

// ---- props painted once: islets (only the top of the island shows above the water) and half-sunk wrecks
const PROP_K = 2;
const PROP_ART = {};
function propArt(key) {
  if (PROP_ART[key] !== undefined) return PROP_ART[key];
  if (!artReady) return null;
  let c = null, ax = 0, ay = 0;
  if (key.startsWith('islet')) {
    const [, biome, vs] = key.split('_'), v = +vs, s = 0.78, tree = `tree_${biome}`, vil = `vil_${biome}`;
    // 200 wide: the top tier of the original island, its village or lighthouse, a palm or two
    c = offscreen(200, 170, PROP_K, g => {
      const water = 132, isl = `isl_${biome}`;
      // under the surface the cliff fades into the deep (a sandbar shows around the islands of the Archipiélago)
      if (biome === 'abismo' || biome === 'coral') { const sb = g.createRadialGradient(100, water + 4, 20, 100, water + 4, 96); sb.addColorStop(0, 'rgba(150,235,230,0.5)'); sb.addColorStop(1, 'rgba(150,235,230,0)'); g.fillStyle = sb; g.fillRect(0, water - 40, 200, 80); }
      g.save(); g.beginPath(); g.rect(0, water, 200, 40); g.clip(); g.globalAlpha = 0.22; sprOn(g, isl, 100, water - 95 * s, s); g.restore();
      g.save(); g.beginPath(); g.rect(0, 0, 200, water); g.clip(); sprOn(g, isl, 100, water - 95 * s, s); g.restore();
      const top = water - 95 * s;
      if (v === 0) { sprOn(g, vil, 100, top + 4, 0.62); sprOn(g, tree, 46, top + 6, 0.62); sprOn(g, tree, 156, top + 8, 0.55, true); }
      else if (v === 1) { if (biome === 'coral') sprOn(g, 'lighthouse', 112, top + 6, 0.7); else sprOn(g, vil, 112, top + 4, 0.55, true); sprOn(g, tree, 62, top + 7, 0.66); }
      else { sprOn(g, tree, 70, top + 6, 0.7); sprOn(g, tree, 110, top + 3, 0.6, true); sprOn(g, tree, 142, top + 8, 0.66); sprOn(g, 'chestFloor', 96, top + 9, 0.5); }
    });
    ax = 100 / 200; ay = 132 / 170;
  } else if (key.startsWith('wreck')) {
    const v = +key.slice(5), n = v ? 'ghost0' : 'galleon0', s = 0.72;
    c = offscreen(130, 110, PROP_K, g => {
      g.save(); g.beginPath(); g.rect(0, 0, 130, 78); g.clip();
      g.translate(64, 96); g.rotate(-0.42); sprOn(g, n, 0, 0, s);
      g.restore();
      // old and soaked: darker, bluer
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(8,28,48,0.55)'; g.fillRect(0, 0, 130, 110);
      g.globalCompositeOperation = 'source-over';
      const pl = FR.plank; if (pl) for (const [x, y, a] of [[22, 84, 0.5], [104, 88, -0.3], [40, 96, 1.2]]) { g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = 0.8; g.drawImage(pl.img, pl.x, pl.y, pl.w, pl.h, -12, -6, 24, 12); g.restore(); }
    });
    ax = 64 / 130; ay = 80 / 110;
  }
  PROP_ART[key] = c ? texOf(c, ax, ay) : null;
  return PROP_ART[key];
}
// a prop's sprite: standing ones among the ships (sorted by depth), flat ones on the water
function propView(p) {
  const v = new PIXI.Container(); v.position.set(p.x, p.y); v.zIndex = p.y;
  const flip = p.flip ? -1 : 1;
  if (p.k === 'reef') { const s = spr(`reef${p.v}_${p.biome}`, 0.56, v); s.y = 4; s.scale.x *= flip; }
  else if (p.k === 'rock') { const s = spr(p.v, 0.7, v); s.y = 3; s.scale.x *= flip; }
  else if (p.k === 'stack') { const s = spr(p.v, 0.5, v); s.y = 10; s.scale.x *= flip; s.tint = 0xd8a0a0; }
  else if (p.k === 'berg') { const s = new PIXI.Sprite(BERG_TEX); s.scale.set(flip * 0.5 * 1.05, 0.5 * 1.05); s.y = 6; v.addChild(s); }
  else if (p.k === 'floe') { const s = new PIXI.Sprite(FLOE_TEX[p.v]); s.anchor.set(0.5); s.scale.set(1 / PROP_K); s.rotation = p.rot; v.addChild(s); L.flat.addChild(v); p.view = v; return; }
  else if (p.k === 'vortex') { const s = new PIXI.Sprite(VORTEX_TEX); s.anchor.set(0.5); s.scale.set(p.r * 2.3 / 256); v.addChild(s); v.s = s; L.flat.addChild(v); p.view = v; return; }
  else if (p.k === 'treasure') { const g = new PIXI.Graphics(); g.moveTo(-9, -9).lineTo(9, 9).moveTo(9, -9).lineTo(-9, 9).stroke({ width: 4, color: 0xffe2a0, alpha: 0.55, cap: 'round' }); v.addChild(g); p.glow = glow(L.fx, 0xffcf70, 90, 0.5); p.glow.anchor.set(0.5); p.glow.position.set(p.x, p.y); L.flat.addChild(v); p.view = v; return; }
  else { const t = propArt(p.k === 'islet' ? `islet_${p.biome}_${p.v}` : p.k + p.v); if (t) { const s = new PIXI.Sprite(t); s.scale.set(flip / PROP_K, 1 / PROP_K); v.addChild(s); } }
  // a sunken treasure still glows inside until the moon takes it
  if (p.loot) { p.glow = glow(L.fx, 0xffcf70, 120, 0.6); p.glow.anchor.set(0.5); p.glow.position.set(p.x, p.y - 6); }
  L.body.addChild(v); p.view = v;
}

// ---- the sea as a scene: water tiles that slide against each other, the moon's pool of light, kelp, crests, currents, glints
let T = 0;
const SEAV = {};
let MK = null, REFL = null, FXG = null;   // drawn fresh every frame: foam and telegraphs, the moon's light on the water, glowing lines
let ZW = { mareas: 1, archi: 0, hielo: 0, sangre: 0 };   // how much of each sea is under the camera now
function initSea() {
  initSeaArt();
  const tile = (c, k) => { const t = new PIXI.TilingSprite({ texture: new PIXI.Texture({ source: new PIXI.CanvasSource({ resource: c }) }), width: 10, height: 10 }); t.tileScale.set(1 / k); return t; };
  SEAV.base = new PIXI.Sprite(PIXI.Texture.WHITE);
  SEAV.dark = tile(darkTile, 0.25);
  SEAV.light = tile(lightTile, 0.25);
  SEAV.pool = new PIXI.Sprite(GLOW); SEAV.pool.anchor.set(0.5); SEAV.pool.blendMode = 'add'; SEAV.pool.alpha = 0.42; SEAV.pool.scale.set(520 / 128);
  // the Luna Roja hangs over the Mar de Sangre: its huge reflection lies on the water
  SEAV.redMoon = new PIXI.Sprite(GLOW); SEAV.redMoon.anchor.set(0.5); SEAV.redMoon.blendMode = 'add'; SEAV.redMoon.tint = 0xff3040; SEAV.redMoon.scale.set(900 / 128);
  SEAV.swell = tile(swellTile, 1);
  SEAV.kelp = new PIXI.Graphics();
  SEAV.wavesB = tile(wavesB, 2); SEAV.wavesB.alpha = 0.9;
  SEAV.wavesA = tile(wavesA, 2);
  SEAV.streaks = new PIXI.Graphics();
  SEAV.glints = new PIXI.ParticleContainer({ dynamicProperties: { position: true, vertex: true, color: true } });
  SEAV.glints.blendMode = 'add'; SEAV.glints.boundsArea = new PIXI.Rectangle(-1e6, -1e6, 2e6, 2e6);
  for (let i = 0; i < 240; i++) SEAV.glints.addParticle(new PIXI.Particle({ texture: FX.star, anchorX: 0.5, anchorY: 0.5, alpha: 0 }));
  SEAV.planks = new PIXI.Container();
  L.sea.addChild(SEAV.base, SEAV.dark, SEAV.light, SEAV.redMoon, SEAV.pool, SEAV.swell, SEAV.kelp, SEAV.wavesB, SEAV.wavesA, SEAV.streaks, SEAV.glints, SEAV.planks);
  MK = new PIXI.Graphics(); REFL = new PIXI.Graphics(); REFL.blendMode = 'add';
  L.marks.addChild(MK, REFL);
  FXG = new PIXI.Graphics(); L.fx.addChild(FXG);
  // banks of red mist (Mar de Sangre)
  SEAV.fog = [];
  for (let i = 0; i < 9; i++) { const f = new PIXI.Sprite(GLOW); f.anchor.set(0.5); f.tint = 0x8a1424; f.alpha = 0; L.fog.addChild(f); SEAV.fog.push({ s: f, x: rand(-400, 400), y: rand(-500, 500), sz: rand(300, 520), ph: rand(0, 6) }); }
}
const FLOATS = new Set();
function drawSea(mx, my) {
  const vw = viewW(), vh = viewH(), x0 = cam.x - vw / 2 - 80, y0 = cam.y - vh / 2 - 80, w = vw + 160, h = vh + 160;
  const lay = (t, ox, oy) => { t.position.set(x0, y0); t.width = w; t.height = h; t.tilePosition.set(-x0 + ox, -y0 + oy); };
  // the colours of the sea under the camera
  ZW = zoneMix(cam.x, cam.y);
  SEAV.base.position.set(x0, y0); SEAV.base.width = w; SEAV.base.height = h; SEAV.base.tint = zoneCol(ZW, 'base');
  lay(SEAV.dark, 0, 0); lay(SEAV.light, 0, 0); SEAV.light.tint = zoneCol(ZW, 'light');
  const crest = zoneCol(ZW, 'crest');
  // the moon's light on the water: a wide soft pool under it
  SEAV.pool.position.set(mx, my); SEAV.pool.tint = zoneCol(ZW, 'pool');
  SEAV.redMoon.visible = ZW.sangre > 0.02; SEAV.redMoon.alpha = 0.32 * ZW.sangre; SEAV.redMoon.position.set(cam.x + vw * 0.18, cam.y - vh * 0.22);
  L.body.tint = zoneCol(ZW, 'body');
  // things under the surface
  const under = underNear(cam.x, cam.y), g = SEAV.kelp;
  g.clear();
  for (const u of under) if (u.k === 'kelp' && onScreen(u.x, u.y, 80)) drawKelp(g, u);
  // swells and two layers of crests drifting against each other: the sea never stands still
  const d = reduceMotion ? 0 : T;
  lay(SEAV.swell, (d * 3) % SWELL_T, (d * 9) % SWELL_T); SEAV.swell.tint = crest;
  lay(SEAV.wavesB, (d * 5) % WAVE_T, (d * 2.4) % WAVE_T); SEAV.wavesB.tint = crest;
  lay(SEAV.wavesA, (-d * 7) % WAVE_T, (Math.sin(d * 0.5) * 6) % WAVE_T); SEAV.wavesA.tint = crest;
  drawStreaks(crest);
  drawGlints(mx, my);
  const near = new Set();
  for (const u of under) if (u.k === 'plank') { drawFloat(u); near.add(u); }
  for (const u of FLOATS) if (!near.has(u)) { u.view.destroy(); u.view = null; FLOATS.delete(u); }
  drawFog();
}
function drawKelp(g, u) {
  for (let i = 0; i < u.n; i++) {
    const a = u.p + i * 1.7, x = u.x + Math.cos(a) * 14, y = u.y + Math.sin(a) * 10, sw = Math.sin(T * 1.1 + u.p + i) * 6;
    g.moveTo(x, y).quadraticCurveTo(x + sw, y - 18, x + sw * 1.6 + Math.cos(a) * 10, y - 34).stroke({ width: 7 - i * 0.6, color: u.col, alpha: 0.32, cap: 'round' });
  }
}
function drawFloat(u) {
  if (!u.view) { const f = FR.plank; if (!f) return; u.view = spr('plank', 28 / f.pw, SEAV.planks); u.view.anchor.set(0.5); u.view.alpha = 0.85; FLOATS.add(u); }
  const c = current(u.x, u.y); u.x += c.x * 0.016 * 0.4; u.y += c.y * 0.016 * 0.4;
  u.view.visible = onScreen(u.x, u.y, 40);
  u.view.position.set(u.x, u.y); u.view.rotation = u.a + Math.sin(T * 1.6 + u.p) * 0.08;
}
function drawStreaks(col) {
  const g = SEAV.streaks; g.clear();
  for (const s of streaks) {
    if (s.k < 0.15) continue;
    const a = Math.sin(Math.PI * s.t / s.life) * 0.32 * s.k;
    g.moveTo(s.x, s.y).lineTo(s.x - s.vx * 0.28, s.y - s.vy * 0.28).stroke({ width: 1.6, color: col, alpha: a, cap: 'round' });
  }
}
// plankton and starlight glinting on the crests, brighter in the moon's light (and many more in the Mareas: its destellos)
function drawGlints(mx, my) {
  const G = 70, vw = viewW() / 2 + G, vh = viewH() / 2 + G, P = SEAV.glints.particleChildren, many = 0.55 + 0.25 * ZW.mareas;
  const gx0 = Math.floor((cam.x - vw) / G), gx1 = Math.floor((cam.x + vw) / G), gy0 = Math.floor((cam.y - vh) / G), gy1 = Math.floor((cam.y + vh) / G);
  const tint = zoneCol(ZW, 'crest');
  let n = 0;
  for (let gx = gx0; gx <= gx1 && n < P.length; gx++) for (let gy = gy0; gy <= gy1 && n < P.length; gy++) {
    const h = hash2(gx, gy, 5); if (h > many) continue;
    const x = gx * G + hash2(gx, gy, 6) * G, y = gy * G + hash2(gx, gy, 7) * G;
    const tw = 0.5 + 0.5 * Math.sin(T * (1.5 + h * 3) + h * 40); if (tw < 0.35) continue;
    const near = clamp(1 - Math.hypot(x - mx, y - my) / 260, 0, 1);
    const p = P[n++], s = (1.2 + near * 1.6 + h * 1.2) * 3.4 / 64;
    p.x = x; p.y = y; p.scaleX = s * 0.55; p.scaleY = s; p.alpha = (0.16 + near * 0.6 + 0.12 * ZW.mareas) * tw; p.tint = tint;
  }
  for (; n < P.length; n++) { if (P[n].alpha === 0) break; P[n].alpha = 0; }
}
// the Mar de Sangre's mist drifts over everything; the Océano Congelado's snow falls
function drawFog() {
  // the Mar de Sangre's fog, and the fog the Holandés Errante brings anywhere
  const a = Math.max(ZW.sangre, S ? S.gloom * 0.9 : 0), vw = viewW() / 2, vh = viewH() / 2;
  for (const f of SEAV.fog) {
    f.s.visible = a > 0.02; if (!f.s.visible) continue;
    // each bank drifts and wraps around the camera
    f.x += 6 * 0.016; f.y += 2 * 0.016;
    let x = ((f.x - cam.x * 0.15 + vw + 300) % (vw * 2 + 600) + (vw * 2 + 600)) % (vw * 2 + 600) - vw - 300;
    let y = ((f.y - cam.y * 0.15 + vh + 300) % (vh * 2 + 600) + (vh * 2 + 600)) % (vh * 2 + 600) - vh - 300;
    f.s.position.set(cam.x + x, cam.y + y); f.s.scale.set(f.sz / 128); f.s.alpha = a * (0.4 + 0.12 * Math.sin(T * 0.4 + f.ph));
  }
}
let snowAcc = 0;
function zoneFxTick(dt) {
  const vw = viewW() / 2, vh = viewH() / 2;
  // snow over the Océano Congelado
  snowAcc += dt * 70 * ZW.hielo;
  while (snowAcc >= 1) { snowAcc--; puff({ add: true, tex: FX.dot, x: cam.x + rand(-vw - 60, vw + 60), y: cam.y + rand(-vh, vh), vx: rand(20, 50), vy: rand(30, 60), life: rand(1.6, 2.6), s0: rand(3, 6), s1: rand(2, 4), tint: 0xffffff, a: 0.75, fadeIn: 0.25 }); }
  // embers rising off the Mar de Sangre
  if (Math.random() < dt * 14 * ZW.sangre) puff({ add: true, tex: FX.dot, x: cam.x + rand(-vw, vw), y: cam.y + rand(-vh, vh), vx: rand(-8, 8), vy: -rand(14, 34), life: rand(1.2, 2.2), s0: rand(3, 5), s1: 1, tint: 0xff6a5a, a: 0.8, fadeIn: 0.3 });
}
// the moon's reflection: a column of light that shivers on the water just below it
function drawReflection(mx, my) {
  for (let i = 0; i < 9; i++) {
    const y = my + 8 + i * 9, w = (26 - i * 2.2) * (0.8 + 0.25 * Math.sin(T * 4 + i * 1.7)), x = mx + Math.sin(T * 2.2 + i) * 3;
    REFL.moveTo(x - w / 2, y).lineTo(x + w / 2, y).stroke({ width: 2.4 - i * 0.15, color: 0xe6f0ff, alpha: 0.34 - i * 0.034, cap: 'round' });
  }
}
// foam that laps around anything standing in the sea
function foamRing(x, y, rx, ry, ph) {
  for (let i = 0; i < 2; i++) {
    const k = ((T * 0.45 + ph + i * 0.5) % 1), a = (1 - k) * 0.45;
    MK.ellipse(x, y, rx * (1 + k * 0.35), ry * (1 + k * 0.35)).stroke({ width: 2.2 - k, color: 0xe6f6ff, alpha: a });
  }
  MK.ellipse(x, y, rx, ry).fill({ color: 0xe6f6ff, alpha: 0.18 });
}
// a prop this frame: hidden off screen, foam around it, a treasure's glow and the ring that fills while the moon takes it
function drawProp(p) {
  if (!p.view) return;
  const vis = onScreen(p.x, p.y, p.k === 'vortex' ? 160 : 140); p.view.visible = vis;
  if (p.glow) p.glow.visible = vis;
  if (!vis) return;
  if (p.k === 'reef') foamRing(p.x, p.y, 30, 11, p.x * 0.01);
  else if (p.k === 'rock') foamRing(p.x, p.y, 14, 5, p.y * 0.01);
  else if (p.k === 'islet') foamRing(p.x, p.y, 84, 24, p.x * 0.003);
  else if (p.k === 'stack') foamRing(p.x, p.y + 4, 52, 16, p.x * 0.004);
  else if (p.k === 'berg') foamRing(p.x, p.y + 4, 78, 22, p.y * 0.004);
  else if (p.k === 'floe') { p.view.y = p.y + Math.sin(T * 0.9 + p.rot * 3) * 1.5; foamRing(p.x, p.y, p.r * 1.12, p.r * 0.86, p.rot); }
  else if (p.k === 'vortex') { p.view.s.rotation = -T * 1.4 + p.a; p.view.s.alpha = 0.85; if (Math.random() < 0.3) { const a = rand(0, TAU), rr = p.r * rand(0.4, 1); puff({ add: true, tex: FX.star, x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr, vx: Math.sin(a) * 50, vy: -Math.cos(a) * 50, life: 0.6, s0: 6, s1: 2, tint: 0xdff8ff, a: 0.7 }); } }
  else if (p.k === 'treasure') {
    if (p.loot && Math.random() < 0.08) puff({ add: true, tex: FX.star, x: p.x + rand(-10, 10), y: p.y + rand(-8, 8), life: 0.5, s0: 10, s1: 2, tint: 0xffe2a0 });
    if (!p.loot) p.view.visible = false;
  }
  if (p.glow && p.loot) {
    const k = 0.5 + 0.5 * Math.sin(T * 3 + p.x); p.glow.alpha = 0.45 + 0.3 * k;
    if (p.open > 0) { const oy = p.k === 'wreck' ? -4 : 0; FXG.moveTo(p.x, p.y + oy - 30).arc(p.x, p.y + oy, 30, -Math.PI / 2, -Math.PI / 2 + TAU * p.open).stroke({ width: 4, color: 0xffdd8c, alpha: 0.95, cap: 'round' }); }
  }
  if (p.k === 'wreck') foamRing(p.x, p.y, 50, 15, p.y * 0.003);
}
// ---- the minimap: the seas around the moon, and what matters (the boss, chests)
const MINI = { t: 0, n: 40, span: 5200 };
function drawMinimap(dt) {
  MINI.t -= dt; if (MINI.t > 0) return; MINI.t = 0.4;
  const c = $('miniCv'); if (!c) return;
  const g = c.getContext('2d'), n = MINI.n, px = c.width / n, cx = S ? S.x : cam.x, cy = S ? S.y : cam.y;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const wx = cx + (i / n - 0.5) * MINI.span, wy = cy + (j / n - 0.5) * MINI.span, col = zoneCol(zoneMix(wx, wy), 'map');
    g.fillStyle = '#' + col.toString(16).padStart(6, '0'); g.fillRect(i * px, j * px, px + 0.5, px + 0.5);
  }
  const to = (x, y) => [(x - cx) / MINI.span * c.width + c.width / 2, (y - cy) / MINI.span * c.height + c.height / 2];
  // the edge of the Mareas: where the other seas begin
  const [ox, oy] = to(0, 0); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.beginPath(); g.arc(ox, oy, (ZONE_IN + ZONE_OUT) / 2 / MINI.span * c.width, 0, TAU); g.stroke();
  const dot = (x, y, col, r) => { const [a, b] = to(x, y); if (a < 0 || b < 0 || a > c.width || b > c.height) return; g.fillStyle = col; g.beginPath(); g.arc(a, b, r, 0, TAU); g.fill(); };
  if (S) { for (const p of S.pickups) if (p.k === 'chest') dot(p.x, p.y, '#ffd36b', 3); if (S.boss) dot(S.boss.x, S.boss.y, '#ff5f6d', 5); }
  dot(cx, cy, '#ffffff', 3.5);
}
// the sea under the moon changed: say where it is
let ZONE_NOW = 'mareas';
function zoneTick() {
  const w = zoneMix(S.x, S.y); let best = ZONE_NOW;
  for (const k of ZK) if (w[k] > 0.7) best = k;
  if (best !== ZONE_NOW) { ZONE_NOW = best; S.zone = best; banner(ZONES[best].name, ZONES[best].sub); sfx('tide'); }
}
