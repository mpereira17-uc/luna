// World sprites: islands, villages, trees, island props, reefs (5 tiers x 4 biomes), clams, sky and sea-floor decor.
// Everything biome-specific is driven by the palettes in PAL so each design is written once.
const { OUT, ol, limb } = require('./lib');

const S = {};
const BIOMES = ['coral', 'escarcha', 'brasa', 'abismo'];

// ================================================================ helpers
const f1 = n => Math.round(n * 10) / 10;
const stops = st => st.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('');
// user-space linear gradient (shared by several shapes so it lines up across them)
const lgu = (id, x1, y1, x2, y2, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(st)}</linearGradient>`;
const rgu = (id, cx, cy, r, st) => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops(st)}</radialGradient>`;
const U = id => `url(#${id})`;
// a soft glow disc (radial gradient defined inline)
const halo = (id, x, y, r, col, a = 1) => `<defs>${rgu(id, x, y, r, [[0, col, 0.85 * a], [0.35, col, 0.38 * a], [1, col, 0]])}</defs><circle cx="${x}" cy="${y}" r="${r}" fill="${U(id)}"/>`;

// polygon whose edges bulge outward slightly -> chunky faceted rock with sharp tips.
// a point may carry a 3rd value = bulge of the edge that ends at it (0 = straight)
function jag(pts, b = 0.12) {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  const n = pts.length;
  for (let i = 1; i <= n; i++) {
    const p = pts[i - 1], q = pts[i % n];
    const bb = q[2] !== undefined ? q[2] : b;
    const dx = q[0] - p[0], dy = q[1] - p[1];
    s += ` Q${f1((p[0] + q[0]) / 2 + dy * bb)},${f1((p[1] + q[1]) / 2 - dx * bb)} ${q[0]},${q[1]}`;
  }
  return s + ' Z';
}

// tapered blade from (x0,y0) to a sharp tip (x1,y1); w = half width at the base; bend curves it sideways
function blade(x0, y0, x1, y1, w, bend = 0) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mx = x0 + dx * 0.5 + nx * bend, my = y0 + dy * 0.5 + ny * bend;
  return `M${f1(x0 + nx * w)},${f1(y0 + ny * w)} Q${f1(mx + nx * w * 0.6)},${f1(my + ny * w * 0.6)} ${f1(x1)},${f1(y1)} Q${f1(mx - nx * w * 0.6)},${f1(my - ny * w * 0.6)} ${f1(x0 - nx * w)},${f1(y0 - ny * w)} Z`;
}
// moonlit highlight line along the top-left side of a blade
function bladeHi(x0, y0, x1, y1, w, bend = 0, col = '#fff', a = 0.5) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L, bd = bend;
  if (nx + ny > 0) { nx = -nx; ny = -ny; bd = -bend; }
  const sx = x0 + dx * 0.12 + nx * w * 0.5, sy = y0 + dy * 0.12 + ny * w * 0.5;
  const mx = x0 + dx * 0.5 + nx * (w * 0.42 + bd), my = y0 + dy * 0.5 + ny * (w * 0.42 + bd);
  const ex = x0 + dx * 0.84 + nx * w * 0.1, ey = y0 + dy * 0.84 + ny * w * 0.1;
  return `<path d="M${f1(sx)},${f1(sy)} Q${f1(mx)},${f1(my)} ${f1(ex)},${f1(ey)}" fill="none" stroke="${col}" stroke-width="${f1(Math.max(0.7, w * 0.34))}" stroke-linecap="round" opacity="${a}"/>`;
}
// deterministic pseudo random
function rng(seed) { let s = (seed * 7919) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
// organic crack polyline (+ one side branch) starting at (x,y) heading `ang` degrees (90 = down)
function crackD(x, y, ang, len, seed, br = 1) {
  const r = rng(seed); let d = `M${f1(x)},${f1(y)}`, cx = x, cy = y; const extra = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (ang + (i % 2 ? 1 : -1) * (20 + r() * 35)) * Math.PI / 180, l = len / n * (0.7 + r() * 0.6);
    cx += Math.cos(a) * l; cy += Math.sin(a) * l; d += ` L${f1(cx)},${f1(cy)}`;
    if (i === 2 && br) extra.push(crackD(cx, cy, ang + (r() > 0.5 ? 50 : -50), len * 0.35, seed + 13, 0));
  }
  return [d, ...extra].join(' ');
}

// several shapes rendered as ONE silhouette: dark outline strokes underneath, fills on top
function unite(paths, fill, w = 2, attrs = '') {
  return paths.map(p => `<path d="${p}" fill="${OUT}" stroke="${OUT}" stroke-width="${w * 2}" stroke-linejoin="round" stroke-linecap="round"/>`).join('')
    + paths.map(p => `<path d="${p}" fill="${fill}" ${attrs}/>`).join('');
}

// Cartoon-shaded solid: rim light along the top-left edges, cel shadow along the bottom-right edges,
// gradient core, optional "cap" (grass/snow/moss) on every upward-facing edge, details clipped inside.
//   P = { hi, c0, c1, sh }  o = { rim:[dx,dy], sh:[dx,dy], g:[x1,y1,x2,y2], cap:{k,hi,base,ln}, inner, over, w }
function body(I, k, d, P, o = {}) {
  const id = s => I(k + s);
  const r = o.rim || [2.2, 2.2], s = o.sh || [-6, -4], g = o.g || [0.25, 0, 0.75, 1];
  let defs = `<linearGradient id="${id('g')}" x1="${g[0]}" y1="${g[1]}" x2="${g[2]}" y2="${g[3]}"><stop offset="0" stop-color="${P.c0}"/><stop offset="1" stop-color="${P.c1}"/></linearGradient>
    <clipPath id="${id('o')}"><path d="${d}"/></clipPath>
    <clipPath id="${id('r')}"><path d="${d}" transform="translate(${r[0]} ${r[1]})"/></clipPath>
    <clipPath id="${id('s')}"><path d="${d}" transform="translate(${s[0]} ${s[1]})"/></clipPath>`;
  let core = `<path d="${d}" fill="${P.hi}"/><g clip-path="url(#${id('r')})"><path d="${d}" fill="${P.sh}"/><g clip-path="url(#${id('s')})"><path d="${d}" fill="url(#${id('g')})"/></g></g>`;
  if (o.inner) core += `<g clip-path="url(#${id('o')})">${o.inner}</g>`;
  if (o.cap) {
    const c = o.cap;
    defs += `<clipPath id="${id('c')}"><path d="${d}" transform="translate(${c.kx || 0} ${c.k})"/></clipPath><clipPath id="${id('c2')}"><path d="${d}" transform="translate(0.8 ${c.h || 1.8})"/></clipPath>`;
    core = `<path d="${d}" fill="${c.hi}"/><g clip-path="url(#${id('c2')})"><path d="${d}" fill="${c.base}"/></g><g clip-path="url(#${id('c')})">${core}</g><g clip-path="url(#${id('o')})"><path d="${d}" transform="translate(${c.kx || 0} ${c.k})" fill="none" stroke="${c.ln}" stroke-width="${c.lw || 1.3}"/></g>`;
  }
  return `<defs>${defs}</defs>${core}${o.over ? `<g clip-path="url(#${id('o')})">${o.over}</g>` : ''}<path d="${d}" fill="none" ${ol(o.w || 2.5)}/>`;
}

// glowing crack (lava / energy): dark fissure, soft glow, hot core, bright centre
function crack(d, hot, w = 1) {
  const st = (c, ww, op = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f1(ww)}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  return st(hot[2], 5.5 * w, 0.18) + st(OUT, 2.1 * w, 0.75) + st(hot[2], 1.5 * w) + st(hot[1], 0.95 * w) + st(hot[0], 0.4 * w);
}
const poly = pts => 'M' + pts.map(p => p.join(',')).join(' L');

// crystal / ice shard pointing up from (0,0), length L, half width w; rendered with two faces
function shard(L, w, C, tip = 1.15) {
  const t = Math.min(L * 0.45, w * 2 * tip);
  const out = `M${-w},2 L${-w},${f1(-L + t)} L0,${-L} L${w},${f1(-L + t)} L${w},2 Z`;
  return { out, faces: `<path d="M${-w},2 L${-w},${f1(-L + t)} L0,${-L} L${f1(w * 0.15)},${f1(-L + t)} L${f1(w * 0.15)},2 Z" fill="${C[0]}"/><path d="M${f1(w * 0.15)},2 L${f1(w * 0.15)},${f1(-L + t)} L0,${-L} L${w},${f1(-L + t)} L${w},2 Z" fill="${C[1]}"/><path d="M${f1(-w * 0.55)},${f1(-L * 0.2)} L${f1(-w * 0.55)},${f1(-L + t * 1.1)}" stroke="#fff" stroke-width="${f1(Math.max(0.6, w * 0.35))}" stroke-linecap="round" opacity="0.75"/>` };
}
// a cluster of shards rooted at (x,y), fanning around angle a (degrees, 0 = up)
function shards(x, y, a, s, C, list = [[0, 1, 1], [-26, 0.62, 0.8], [24, 0.7, 0.85]], glowCol) {
  const items = list.map(([da, ls, ws]) => ({ t: `translate(${x} ${y}) rotate(${a + da})`, sh: shard(14 * s * ls, 3.2 * s * ws, C) }));
  const gx = f1(x + Math.sin(a * Math.PI / 180) * 7 * s), gy = f1(y - Math.cos(a * Math.PI / 180) * 7 * s);
  return (glowCol ? [1, 0.7, 0.42].map(f => `<circle cx="${gx}" cy="${gy}" r="${f1(13 * s * f)}" fill="${glowCol}" opacity="0.08"/>`).join('') : '')
    + items.map(it => `<g transform="${it.t}"><path d="${it.sh.out}" fill="${OUT}" stroke="${OUT}" stroke-width="${2.8 * Math.min(1, s + 0.2)}" stroke-linejoin="round"/></g>`).join('')
    + items.map(it => `<g transform="${it.t}">${it.sh.faces}</g>`).join('');
}

// ================================================================ palettes
const PAL = {
  coral: {
    rock: { hi: '#e7d2b3', c0: '#ad977f', c1: '#776359', sh: '#56454a', ln: '#4b3a3e', dk: '#3e3036' },
    back: { hi: '#a99482', c0: '#85736a', c1: '#5c4c50', sh: '#45373e', ln: '#3c2f37' },
    cap: { hi: '#c2f37e', base: '#72c54b', ln: '#2f7d3c', d: '#4a9a3e' },          // island top: grass
    moss: { hi: '#a9df70', base: '#5da64d', ln: '#2f6e40', d: '#3f8446' },          // reef top: sea moss
    co: ['#ffd3dc', '#ff7d9b', '#d93c66', '#8a1f48'],                                // coral branches
    an: ['#ffc0da', '#e2589a', '#9c2b6b'], tip: '#9ff7ff', tip2: '#eaffff',          // anemones
    hot: ['#fff3a8', '#ffb347', '#ff6a1f'],                                           // magma
    crust: { hi: '#f0c69c', c0: '#c58d63', c1: '#7f4f3b', sh: '#58352f' },          // vent chimneys
    barn: ['#f6efe0', '#cdbfa9', '#8f8070'],
    sand: ['#f8e3a8', '#e0bb7b', '#b38c58'],
    spot: '#8c7466', glow: null,
  },
  escarcha: {
    rock: { hi: '#e2ecf8', c0: '#9fb0c8', c1: '#62728f', sh: '#45516d', ln: '#3d4763', dk: '#323a52' },
    back: { hi: '#a6b4c9', c0: '#7a8aa4', c1: '#505d78', sh: '#3c4762', ln: '#343e58' },
    cap: { hi: '#ffffff', base: '#e9f3ff', ln: '#8eaad0', d: '#c3d6ef' },           // snow
    moss: { hi: '#ffffff', base: '#dcebfb', ln: '#86a3cb', d: '#b9cfeb' },          // frost
    co: ['#e8ffff', '#8ef0ff', '#33bfe0', '#1b6f9c'],
    an: ['#e6fbff', '#79d6f0', '#2f86b0'], tip: '#c8f6ff', tip2: '#ffffff',
    hot: ['#fff3a8', '#ffb347', '#ff6a1f'],
    crust: { hi: '#e8f0fb', c0: '#a9b7cc', c1: '#5f6e8c', sh: '#434e6a' },
    barn: ['#ffffff', '#cddbee', '#8a9ab6'],
    sand: ['#f4f8ff', '#cfdcee', '#9aabc6'],
    spot: '#7f90ab', ice: ['#f2fdff', '#9fe6fb'],
  },
  brasa: {
    rock: { hi: '#8d8496', c0: '#4f4858', c1: '#2c2734', sh: '#1f1b27', ln: '#17131e', dk: '#141019' },
    back: { hi: '#5f5868', c0: '#3c3644', c1: '#25202c', sh: '#1a1622', ln: '#15111b' },
    cap: { hi: '#a39aa6', base: '#6f6772', ln: '#2a2430', d: '#565060' },           // ash
    moss: { hi: '#9b929f', base: '#655d69', ln: '#28222e', d: '#4f4858' },
    co: ['#ffe2a6', '#ffa04a', '#e8571f', '#8f2a16'],
    an: ['#ffd29a', '#f07a3c', '#a83a20'], tip: '#ffe85a', tip2: '#fffbe0',
    hot: ['#fff3a8', '#ffb347', '#ff5a1a'],
    crust: { hi: '#7d7480', c0: '#47404d', c1: '#26212c', sh: '#1a1620' },
    barn: ['#b8afb8', '#857c88', '#4d4652'],
    sand: ['#7a7078', '#57505a', '#3a343e'],
    spot: '#3e3846', lava: true,
  },
  abismo: {
    rock: { hi: '#b996e0', c0: '#6e4f98', c1: '#3f2b63', sh: '#2c1d48', ln: '#24173d', dk: '#1d1233' },
    back: { hi: '#7f62a6', c0: '#523a78', c1: '#2f2050', sh: '#22173c', ln: '#1c1234' },
    cap: { hi: '#efc9ff', base: '#a875f0', ln: '#5b38a3', d: '#8a58d8' },           // violet moss
    moss: { hi: '#e9c2ff', base: '#9b67e6', ln: '#55339a', d: '#7d4dcc' },
    co: ['#ffe0ff', '#e690ff', '#ae4ae8', '#5f23a0'],
    an: ['#ffd0ff', '#d76ae8', '#7d2ca8'], tip: '#ff9cf5', tip2: '#fff0ff',
    hot: ['#ffe6ff', '#ff7ae8', '#c22ad8'],
    crust: { hi: '#b590d9', c0: '#5d4485', c1: '#33224f', sh: '#24183a' },
    barn: ['#efe0ff', '#b9a0dc', '#6f5a96'],
    sand: ['#8d74b5', '#64508c', '#433463'],
    spot: '#c58cff', xtal: ['#fbeaff', '#c28bff', '#7a45d8'], glow: '#d08cff',
  },
};

// ================================================================ islands
// grass / snow / ash / moss overhang on the plateau rim: top surface at y≈20.5, ragged edge hanging over the cliff
function capPath(style) {
  const r = rng(style.length * 3 + 1);
  let d = 'M36,33 C35,25 42,20.5 51,20.5 L149,20.5 C158,20.5 165,25 164,33';
  const step = { grass: 7.5, snow: 11, ash: 13, moss: 8.5 }[style];
  const n = Math.round(128 / step), st = 128 / n;
  for (let i = 1; i <= n; i++) {
    const xa = 164 - st * (i - 1), xb = 164 - st * i, xm = (xa + xb) / 2;
    const deep = [7, 4, 9, 5, 6, 10, 4, 8][i % 8] + r() * 1.5;
    const yb = i === n ? 33 : 32.5 + r() * 1.5;
    if (style === 'grass') d += ` Q${f1(xa - 1)},${f1(33 + deep * 0.5)} ${f1(xm + 0.6)},${f1(33 + deep)} Q${f1(xm - 0.2)},${f1(33 + deep * 0.4)} ${f1(xb)},${f1(yb)}`;
    if (style === 'snow') d += ` C${f1(xa + 0.5)},${f1(35 + deep * 0.9)} ${f1(xb - 0.5)},${f1(35 + deep * 0.9)} ${f1(xb)},${f1(yb + 1)}`;
    if (style === 'ash') d += ` Q${f1(xm)},${f1(34 + deep * 0.45)} ${f1(xb)},${f1(yb)}`;
    if (style === 'moss') d += ` C${f1(xa)},${f1(34 + deep * 0.5)} ${f1(xm + 1.6)},${f1(34 + deep * 1.25)} ${f1(xm)},${f1(34 + deep * 1.25)} C${f1(xm - 1.6)},${f1(34 + deep * 1.25)} ${f1(xb)},${f1(34 + deep * 0.5)} ${f1(xb)},${f1(yb)}`;
  }
  return d + ' Z';
}
// tuft of blades rooted at (x,y)
function tuft(x, y, s, col, dark, n = 5, spread = 70) {
  const ps = [];
  for (let i = 0; i < n; i++) {
    const a = (-spread / 2 + spread * (n === 1 ? 0.5 : i / (n - 1))) * Math.PI / 180;
    const L = (i % 2 ? 5 : 7.5) * s;
    ps.push(blade(x + (i - n / 2) * 1.2 * s, y + 3, x + Math.sin(a) * L * 1.1, y - Math.cos(a) * L, 1.6 * s, (i % 2 ? 1 : -1) * s));
  }
  return unite(ps, col, 1.3) + `<path d="M${x - 1.5 * s},${y + 1} L${x + 1.5 * s},${y + 1}" stroke="${dark}" stroke-width="1" opacity="0.5"/>`;
}
// leafy bush clump rooted at (x,y)
function bush(I, k, x, y, s, C) {
  const lumps = [[-6, -3, 6, 5], [1, -7, 6.5, 6], [7, -2, 5.5, 4.6], [-1, 0, 7, 4]];
  const ps = lumps.map(([dx, dy, rx, ry]) => `M${f1(x + dx * s - rx * s)},${f1(y + dy * s)} a${f1(rx * s)},${f1(ry * s)} 0 1,0 ${f1(rx * 2 * s)},0 a${f1(rx * s)},${f1(ry * s)} 0 1,0 ${f1(-rx * 2 * s)},0 Z`);
  return `<defs>${lgu(I(k), 0, y - 13 * s, 0, y + 4 * s, [[0, C.hi], [0.45, C.base], [1, C.ln]])}</defs>` + unite(ps, U(I(k)), 1.5)
    + `<path d="M${f1(x - 6 * s)},${f1(y - 6 * s)} q${f1(2 * s)},${f1(-3 * s)} ${f1(5 * s)},${f1(-2.6 * s)} M${f1(x + 2 * s)},${f1(y - 10.5 * s)} q${f1(2 * s)},${f1(-2 * s)} ${f1(4.5 * s)},${f1(-0.6 * s)}" fill="none" stroke="#fff" stroke-width="1" opacity="0.45" stroke-linecap="round"/>`;
}
// hanging vine with alternating leaves and a few flowers
function vine(x, y, len, seed, C, flower) {
  const r = rng(seed); const pts = [];
  for (let t = 0; t <= len; t += 5) pts.push([x + Math.sin(t / 9 + seed) * 3.5, y + t]);
  const d = 'M' + pts.map(p => `${f1(p[0])},${f1(p[1])}`).join(' L');
  let leaves = '', fl = '';
  pts.forEach(([px, py], i) => {
    if (i === 0) return;
    const side = i % 2 ? 1 : -1, sz = 1 + r() * 0.4 - (i / pts.length) * 0.35;
    leaves += `<path d="M${f1(px)},${f1(py)} q${f1(side * 2.5 * sz)},${f1(-3.4 * sz)} ${f1(side * 6 * sz)},${f1(-1.2 * sz)} q${f1(-side * 2.6 * sz)},${f1(2.8 * sz)} ${f1(-side * 6 * sz)},${f1(1.2 * sz)} Z" fill="${i % 3 ? C.base : C.hi}" ${ol(0.9)}/>`;
    if (flower && i % 4 === 2) fl += `<g transform="translate(${f1(px - side * 1.5)} ${f1(py + 1)})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-1.8" rx="1.3" ry="1.9" transform="rotate(${a})" fill="${flower[i % 8 === 2 ? 0 : 1]}" stroke="${OUT}" stroke-width="0.7"/>`).join('')}<circle r="0.9" fill="#ffe36a"/></g>`;
  });
  return limb(d, C.ln, 1.3, 0.8) + leaves + fl;
}
// pocket in the rock face with crystals growing out of it (bases buried behind the rock lip)
function crystalPocket(x, y, s, P) {
  return `<ellipse cx="${x}" cy="${y}" rx="${8 * s}" ry="${3.6 * s}" fill="${OUT}" opacity="0.85"/>`
    + shards(x, y + 1.5 * s, 0, s * 0.9, P.xtal, [[0, 1, 1], [-30, 0.6, 0.8], [28, 0.7, 0.85]], P.glow)
    + `<path d="M${f1(x - 9 * s)},${f1(y - 0.5)} Q${x},${f1(y + 6 * s)} ${f1(x + 9 * s)},${f1(y - 0.5)} Q${x},${f1(y + 9 * s)} ${f1(x - 9 * s)},${f1(y - 0.5)} Z" fill="${P.rock.c0}" ${ol(1.3)}/>`
    + `<path d="M${f1(x - 6 * s)},${f1(y + 3 * s)} Q${x},${f1(y + 5.5 * s)} ${f1(x + 6 * s)},${f1(y + 3 * s)}" fill="none" stroke="${P.rock.hi}" stroke-width="0.9" opacity="0.5"/>`;
}

// strata slabs of the sea stack, top to bottom: { t: top y (left,right), L/R: side points top->bottom, b: bottom y }
// upper slabs overhang the ones below, so ledge lips only show where a lower slab sticks out
const SLABS = [
  { t: [24, 24], L: [[47, 26], [44, 34], [43, 46], [43, 58], [42, 72]], R: [[153, 26], [156, 34], [158, 46], [159, 58], [158, 72]], b: 72 },
  { t: [60, 57], L: [[37, 62], [33, 68], [32, 80], [33, 92], [32, 110]], R: [[167, 57], [172, 61], [174, 72], [172, 86], [173, 98], [171, 110]], b: 110 },
  { t: [102, 99], L: [[24, 104], [20, 110], [19, 122], [20, 134], [19, 152]], R: [[176, 99], [180, 103], [181, 114], [180, 128], [181, 140], [179, 152]], b: 152 },
  { t: [145, 139], L: [[14, 147], [10, 153], [10, 166], [11, 180], [9, 200]], R: [[188, 139], [193, 144], [194, 158], [192, 172], [193, 186], [192, 200]], b: 200 },
  { t: [190, 186], L: [[5, 192], [2, 198], [2, 212], [2, 226], [1, 244]], R: [[194, 186], [198, 191], [198, 206], [198, 222], [199, 244]], b: 244 },
  { t: [234, 230], L: [[3, 236], [1, 242], [1, 258]], R: [[196, 230], [199, 236], [199, 258]], b: 258 },
];
const slabBottom = i => { const sl = SLABS[i]; if (i === SLABS.length - 1) return [[199, 258], [1, 258]]; const xr = sl.R[sl.R.length - 1][0], xl = sl.L[sl.L.length - 1][0], y = sl.b; return [[xr, y], [150, y + 3], [118, y - 1], [84, y + 3], [52, y], [xl, y]]; };
function slabPts(i) {
  const sl = SLABS[i], [tl, tr] = sl.t;
  const xl = sl.L[0][0], xr = sl.R[0][0];
  const top = [[f1(xl + 8), tl], [100, f1((tl + tr) / 2 + (i % 2 ? 1.5 : -1)), 0.02], [f1(xr - 8), tr, 0.02]];
  const bot = slabBottom(i).map((p, k) => [...p, k === 0 ? 0.07 : (i === SLABS.length - 1 ? 0 : 0.06)]);
  return [sl.L[0], ...top, ...sl.R, ...bot.slice(1), ...sl.L.slice(1, -1).reverse()];
}
const seamY = (i, x) => { const B = slabBottom(i); for (let k = 0; k < B.length - 1; k++) { const [x0, y0] = B[k], [x1, y1] = B[k + 1]; if (x <= x0 && x >= x1) return y0 + (y1 - y0) * (x0 - x) / (x0 - x1); } return SLABS[i].b; };
const JOINTS = [[78, 124], [58, 104, 150], [44, 96, 140], [36, 84, 132, 172], [26, 70, 118, 160], [40, 96, 150]];

function island(b) {
  const P = PAL[b], R = P.rock, C = P.cap;
  const style = { coral: 'grass', escarcha: 'snow', brasa: 'ash', abismo: 'moss' }[b];
  return I => {
    const r = rng(7);
    let behind = '', front = '', mid = '';
    const defs = `<defs>
      <linearGradient id="${I('ib')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${R.dk}" stop-opacity="0.6"/><stop offset="1" stop-color="${R.dk}" stop-opacity="0"/></linearGradient>
      ${lgu(I('iu'), 0, 26, 0, 50, [[0, R.dk, 0.65], [1, R.dk, 0]])}
      ${lgu(I('iw'), 0, 120, 0, 258, [[0, '#0a1430', 0], [1, '#0a1430', 0.5]])}
      ${lgu(I('cg'), 0, 19, 0, 46, [[0, C.hi], [0.25, C.base], [1, C.d]])}</defs>`;
    // one slab of rock: blocks split by joints, pebbles, a crack, shadow cast by the slab above, darker toward the sea
    const slab = i => {
      const pts = slabPts(i), top = Math.min(...SLABS[i].t), bot = SLABS[i].b + 3;
      let inner = '';
      const J = JOINTS[i];
      J.forEach((x, j) => {
        const x2 = x + (j % 2 ? 3 : -3);
        if (j % 2 === 0) inner += `<path d="M${x},${top} L${x2},${bot} L${(J[j + 1] || 205) + 2},${bot} L${(J[j + 1] || 205)},${top} Z" fill="${R.dk}" opacity="0.12"/>`;
        inner += `<path d="M${x},${top + 3} L${f1((x + x2) / 2 + 1)},${f1((top + bot) / 2)} L${x2},${bot}" fill="none" stroke="${R.ln}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${x + 1.5},${top + 6} L${f1((x + x2) / 2 + 2.5)},${f1((top + bot) / 2)} L${x2 + 1.5},${bot - 3}" fill="none" stroke="${R.hi}" stroke-width="0.9" opacity="0.3"/>`;
      });
      if (b === 'brasa') for (let x = 20 + (i * 5) % 11; x < 196; x += 11) if (!J.some(j => Math.abs(j - x) < 4)) inner += `<path d="M${x},${top + 5} L${x + 0.6},${bot}" stroke="${R.ln}" stroke-width="1" opacity="0.75"/><path d="M${x + 1.4},${top + 6} L${x + 2},${bot}" stroke="${R.hi}" stroke-width="0.7" opacity="0.15"/>`;
      for (let k = 0; k < 7; k++) { const x = 20 + r() * 165, y = top + 8 + r() * (bot - top - 12); inner += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(1.1 + r())}" ry="${f1(0.7 + r() * 0.4)}" fill="${P.glow && k % 3 === 0 ? P.spot : R.ln}" opacity="${P.glow && k % 3 === 0 ? 0.9 : 0.4}"/>`; }
      inner += `<path d="${crackD(60 + r() * 80, top + 6, 90, (bot - top) * 0.5, i * 5 + 3, 1)}" fill="none" stroke="${R.ln}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`;
      inner += `<rect x="0" y="0" width="200" height="262" fill="url(#${I('iw')})"/>`;
      inner += i === 0 ? `<rect x="0" y="26" width="200" height="24" fill="url(#${I('iu')})"/>` : `<path d="M0,${top - 2} L200,${top - 2} L200,${top + 18} L0,${top + 18} Z" fill="url(#${I('ib')})"/>`;
      return body(I, 'sl' + i, jag(pts, 0.07), R, { inner, cap: i ? { k: style === 'snow' ? 6 : 4.6, ...C } : null, sh: [-9, -3], rim: [2.4, 2], w: 2.5 });
    };
    // dressing that hangs from the bottom edge of slab i (drawn before slab i, so its roots are hidden)
    const seam = i => {
      const sl = SLABS[i], xl = sl.L[sl.L.length - 1][0] + 6, xr = sl.R[sl.R.length - 1][0] - 6, rr = rng(i * 11 + 5);
      let o = '';
      if (b === 'escarcha') for (let x = xl + rr() * 6; x < xr; x += 7 + rr() * 9) {
        const y = seamY(i, x) - 2, L = 4 + rr() * 8, w = 1.3 + rr() * 0.9;
        o += `<path d="M${f1(x - w)},${f1(y)} L${f1(x)},${f1(y + L)} L${f1(x + w)},${f1(y)} Z" fill="${P.ice[1]}" ${ol(1.1)}/><path d="M${f1(x - w * 0.4)},${f1(y + 1)} L${f1(x - 0.1)},${f1(y + L * 0.7)}" stroke="#fff" stroke-width="0.7"/>`;
      }
      if (b === 'coral' || b === 'abismo') for (let x = xl + 4 + rr() * 10; x < xr - 4; x += 18 + rr() * 22) {
        const y = seamY(i, x) - 2, n = 3 + Math.floor(rr() * 2);
        const ps = []; for (let k = 0; k < n; k++) ps.push(blade(x + (k - n / 2) * 2.2, y, x + (k - n / 2) * 3.4 + (rr() - 0.5) * 2, y + 4 + rr() * 4, 1.3, (k % 2 ? 0.8 : -0.8)));
        o += unite(ps, C.base, 1.1);
        if (b === 'abismo') { const gx = f1(x + (1 - n / 2) * 3.4), gy = f1(y + 7.5); o += `<circle cx="${gx}" cy="${gy}" r="3" fill="${P.glow}" opacity="0.3"/><circle cx="${gx}" cy="${gy}" r="1.1" fill="${P.xtal[0]}"/>`; }
      }
      if (b === 'brasa') for (let x = xl + rr() * 20; x < xr - 20; x += 40 + rr() * 30) {
        const len = 14 + rr() * 18, pts2 = [];
        for (let t = 0; t <= len; t += 3.5) pts2.push([f1(x + t), f1(seamY(i, x + t) + 1.4 + (rr() - 0.5) * 1.2)]);
        o += crack(poly(pts2), P.hot, 1.1) + `<path d="M${f1(x + len * 0.5)},${f1(seamY(i, x + len * 0.5) + 2)} q1.6,2 0,4.5 q-1.6,-2.5 0,-4.5 Z" fill="${P.hot[1]}" ${ol(0.9)}/>`;
      }
      return o;
    };
    let cliff = '';
    for (let i = SLABS.length - 1; i >= 0; i--) { cliff += slab(i); if (i > 0) cliff += seam(i - 1); }
    // a glowing/icy fall that wobbles down the face, bulging where it spills over each seam
    const fall = (x0, y0, y1, w0, w1, seams) => {
      const Lp = [], Rp = [];
      for (let y = y0; y <= y1; y += 4) {
        const t = (y - y0) / (y1 - y0), cx = x0 + Math.sin(y / 15) * 1.8 + t * -2;
        const w = w0 + (w1 - w0) * t + seams.reduce((a, sy) => a + 2.4 * Math.exp(-((y - sy - 4) ** 2) / 30), 0);
        Lp.push([f1(cx - w), y]); Rp.push([f1(cx + w * 0.92), y]);
      }
      return { d: 'M' + [...Lp, ...Rp.reverse()].map(p => p.join(',')).join(' L') + ' Z', c: 'M' + Lp.map(([lx, y], k) => `${f1(lx + (Rp[Rp.length - 1 - k][0] - lx) * 0.42)},${y}`).join(' L') };
    };
    // ---- biome dressing
    if (b === 'coral') {
      behind += bush(I, 'b1', 37, 62, 0.75, C) + bush(I, 'b2', 167, 59, 0.85, C) + bush(I, 'b3', 23, 104, 0.8, C) + bush(I, 'b4', 187, 141, 0.85, C) + bush(I, 'b5', 6, 193, 0.7, C);
      behind += tuft(178, 101, 0.9, C.base, C.ln) + tuft(13, 148, 0.9, C.base, C.ln) + tuft(195, 188, 0.8, C.base, C.ln);
      mid += vine(58, 34, 66, 1, C, ['#ff6f9a', '#ffb347']) + vine(90, 36, 30, 2, C, ['#ff6f9a', '#ffb347']) + vine(136, 34, 96, 3, C, ['#ff6f9a', '#ffd34a']) + vine(152, 33, 24, 4, C, null);
      // sandy beach at the foot
      const sand = 'M1,258 L1,236 C12,229 30,227 48,231 C64,235 80,242 94,249 C100,252 104,255 106,258 Z';
      const sand2 = 'M146,258 C156,250 174,245 188,246 C194,247 198,249 199,251 L199,258 Z';
      front += `<defs>${lgu(I('sd'), 0, 228, 0, 258, [[0, P.sand[0]], [0.5, P.sand[1]], [1, P.sand[2]]])}</defs>`
        + [sand, sand2].map(s2 => `<path d="${s2}" fill="${U(I('sd'))}" ${ol(2.2)}/>`).join('')
        + `<path d="M8,236 C20,231 34,231 46,234" fill="none" stroke="#fff" stroke-width="1.3" opacity="0.6" stroke-linecap="round"/><path d="M14,246 Q30,242 46,246 M54,250 Q66,247 78,252 M160,254 Q172,250 184,251" fill="none" stroke="${P.sand[2]}" stroke-width="1" opacity="0.7" stroke-linecap="round"/>`
        + `<path d="M30,240 l1.6,-3.2 l1.6,3.2 l-3.2,-2 h3.2 z" fill="#ff8a5a" stroke="${OUT}" stroke-width="0.8" stroke-linejoin="round"/><path d="M60,244 a3,2.4 0 0,1 6,0 z" fill="#ffe0ec" stroke="${OUT}" stroke-width="0.8"/><path d="M176,250 a2.6,2 0 0,1 5.2,0 z" fill="#fff4dc" stroke="${OUT}" stroke-width="0.8"/>`
        + tuft(6, 232, 0.8, C.base, C.ln, 4) + tuft(192, 248, 0.7, C.base, C.ln, 4);
    }
    if (b === 'escarcha') {
      // frozen waterfall from the rim down to the first ledge
      const f = fall(100, 34, 112, 4.5, 6.5, [72]);
      front += `<defs>${lgu(I('if'), 90, 0, 112, 0, [[0, '#9fdcf5'], [0.45, '#e9fbff'], [1, '#7cc4e6']])}</defs><path d="${f.d}" fill="${U(I('if'))}" opacity="0.92" ${ol(1.5)}/><path d="${f.c}" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity="0.9"/>`
        + [[96, 116, 6], [100, 115, 9], [104, 116, 5]].map(([x, y, l]) => `<path d="M${x - 1.6},${y - 4} L${x},${y + l - 4} L${x + 1.6},${y - 4} Z" fill="#bfeaff" ${ol(1)}/>`).join('');
      front += `<path d="M1,258 L1,242 C20,236 50,238 80,246 C96,250 110,254 116,258 Z" fill="#eef6ff" ${ol(2.2)}/><path d="M150,258 C164,250 184,247 199,249 L199,258 Z" fill="#eef6ff" ${ol(2.2)}/><path d="M8,243 C24,239 46,240 66,244" fill="none" stroke="#fff" stroke-width="1.4"/>`;
    }
    if (b === 'brasa') {
      mid += [[60, 116, 80, 30, 1], [150, 158, 95, 32, 2], [84, 206, 85, 28, 3], [44, 160, 70, 26, 4], [164, 112, 100, 22, 5], [72, 40, 90, 20, 8]].map(([x, y, a, l, sd]) => crack(crackD(x, y, a, l, sd), P.hot, 0.8)).join('');
      // lava fall from a cave mouth
      const f = fall(122, 116, 250, 3.2, 7.5, [152, 200]);
      front += `<defs>${lgu(I('lv'), 0, 238, 0, 258, [[0, '#ffe58a'], [0.5, '#ff9a2a'], [1, '#ff5a1a']])}${lgu(I('lv2'), 112, 0, 132, 0, [[0, '#ff4a12'], [0.45, '#ffd76a'], [1, '#ff5a1a']])}</defs>
        <path d="${f.c}" fill="none" stroke="#ff7a1a" stroke-width="26" opacity="0.12" stroke-linecap="round"/>
        <path d="${f.c}" fill="none" stroke="#ff9a2a" stroke-width="14" opacity="0.16" stroke-linecap="round"/>
        <path d="M111,117 C111,110 116,107 122,107 C128,107 133,110 133,117 Z" fill="#2a1414" ${ol(1.6)}/>
        <path d="M114,117 C114,112 118,110 122,110 C126,110 130,112 130,117 Z" fill="#ff6a1f"/><path d="M117,117 C117,114 119,113 122,113 C125,113 127,114 127,117 Z" fill="#ffd36a"/>
        <path d="${f.d}" fill="${U(I('lv2'))}" ${ol(1.6)}/>
        <path d="${f.c}" fill="none" stroke="#fff6c8" stroke-width="1.5" opacity="0.9" stroke-linecap="round" stroke-dasharray="14 5 6 7"/>
        <ellipse cx="121" cy="250" rx="28" ry="8" fill="#ff7a1a" opacity="0.25"/>
        <path d="M98,257 C102,249 111,246 120,246 C130,246 139,249 144,257 Z" fill="${U(I('lv'))}" ${ol(1.6)}/>
        <path d="M107,252 Q120,247 134,252" fill="none" stroke="#fff3b0" stroke-width="1.2" opacity="0.9"/>
        <circle cx="105" cy="242" r="1.6" fill="#ffd36a" ${ol(0.8)}/><circle cx="137" cy="240" r="1.3" fill="#ffd36a" ${ol(0.8)}/><circle cx="131" cy="235" r="0.9" fill="#ffe9a0"/>`;
    }
    if (b === 'abismo') {
      behind += shards(39, 63, -36, 0.85, P.xtal, undefined, P.glow) + shards(166, 59, 32, 0.95, P.xtal, undefined, P.glow) + shards(24, 105, -38, 0.85, P.xtal, undefined, P.glow)
        + shards(177, 101, 38, 0.75, P.xtal, undefined, P.glow) + shards(189, 141, 34, 0.85, P.xtal, undefined, P.glow) + shards(13, 148, -36, 0.7, P.xtal, undefined, P.glow) + shards(5, 193, -30, 0.7, P.xtal, undefined, P.glow);
      mid += crystalPocket(82, 128, 0.9, P) + crystalPocket(146, 176, 1, P) + crystalPocket(60, 222, 0.75, P);
      mid += [[100, 52, 1.6], [130, 88, 1.2], [60, 172, 1.4], [168, 124, 1.2], [110, 160, 1.5], [40, 124, 1.1], [150, 236, 1.3], [118, 214, 1.1]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr * 3}" fill="${P.glow}" opacity="0.18"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${P.xtal[0]}"/>`).join('');
    }
    // ---- top overhang
    const cp = capPath(style);
    let top = `<path d="${cp}" fill="${U(I('cg'))}" ${ol(2.3)}/>`;
    top += `<path d="M41,28 C42,24 46,22.6 52,22.6 L148,22.6" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.6" stroke-linecap="round"/>`;
    if (style === 'grass') {
      top += [50, 66, 84, 102, 120, 138, 152].map((x, i) => `<path d="M${x},${30 + (i % 2) * 2} q1,-3 3,-4 M${x + 6},${28 + (i % 3)} q-0.5,-3 1.5,-4.5" fill="none" stroke="${C.ln}" stroke-width="0.9" opacity="0.55" stroke-linecap="round"/>`).join('');
      behind += tuft(40, 26, 1, C.base, C.ln) + tuft(160, 26, 1, C.base, C.ln) + tuft(56, 22, 0.8, C.hi, C.ln, 4) + tuft(146, 22, 0.8, C.hi, C.ln, 4);
    }
    if (style === 'snow') {
      behind += [44, 58, 75, 96, 118, 134, 150, 160].map((x, i) => `<path d="M${x - 2.2},36 L${x},${46 + (i * 5) % 9} L${x + 2.2},36 Z" fill="#bfeaff" ${ol(1.2)}/><path d="M${x - 0.8},37 L${x - 0.2},${42 + (i * 5) % 6}" stroke="#fff" stroke-width="0.8"/>`).join('');
      top += `<path d="M40,32 C52,35 70,34 84,36 M110,35 C126,34 140,36 160,33" fill="none" stroke="#a9c3e4" stroke-width="1.1" opacity="0.7" stroke-linecap="round"/>`;
    }
    if (style === 'ash') {
      top += crack('M42,29 L58,31 L66,28 L80,32 M120,30 L134,32 L146,29 L158,31 M96,31 L104,33', P.hot, 0.8)
        + [[48, 26], [72, 25], [130, 26], [154, 27], [100, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="#ffcf5a"/><circle cx="${x}" cy="${y}" r="2.4" fill="#ff8a2a" opacity="0.3"/>`).join('');
    }
    if (style === 'moss') {
      behind += shards(42, 28, -40, 0.85, P.xtal, undefined, P.glow) + shards(158, 28, 40, 0.85, P.xtal, undefined, P.glow);
      top += [46, 63, 80, 97, 114, 131, 148].map((x, i) => `<circle cx="${x + 2}" cy="${38 + (i * 7) % 8}" r="1.1" fill="${P.xtal[0]}"/><circle cx="${x + 2}" cy="${38 + (i * 7) % 8}" r="3" fill="${P.glow}" opacity="0.25"/>`).join('');
    }
    return defs + behind + cliff + mid + top + front;
  };
}
for (const b of BIOMES) S['isl_' + b] = { w: 200, h: 260, ax: 100, ay: 24, draw: island(b) };

// ================================================================ villages (110x64, bottom centre at the plateau top)
// lit window with a warm glow
function win(I, k, x, y, w, h, o = {}) {
  const c = o.col || ['#fff4c2', '#ffc95a', '#ff9a3a'];
  const round = o.round ? `rx="${f1(Math.min(w, h) / 2)}"` : 'rx="0.8"';
  return `<defs>${rgu(I(k), x + w / 2, y + h / 2, Math.max(w, h) * 1.4, [[0, c[1], 0.55], [1, c[1], 0]])}${lgu(I(k + 'w'), 0, y, 0, y + h, [[0, c[0]], [1, c[2]]])}</defs>
    <circle cx="${f1(x + w / 2)}" cy="${f1(y + h / 2)}" r="${f1(Math.max(w, h) * 1.4)}" fill="${U(I(k))}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" ${round} fill="${U(I(k + 'w'))}" ${ol(1.2)}/>
    ${o.bars === false ? '' : `<path d="M${f1(x + w / 2)},${y + 0.6} V${y + h - 0.6} M${x + 0.6},${f1(y + h / 2)} H${x + w - 0.6}" stroke="${o.frame || '#6b3f22'}" stroke-width="0.9"/>`}`;
}
const door = (x, y, w, h, col = '#7a4a2a', dark = '#4e2c18') => `<path d="M${x},${y + h} V${f1(y + w / 2)} A${f1(w / 2)},${f1(w / 2)} 0 0,1 ${x + w},${f1(y + w / 2)} V${y + h} Z" fill="${col}" ${ol(1.3)}/><path d="M${f1(x + w / 2)},${y + 1} V${y + h}" stroke="${dark}" stroke-width="0.9"/><circle cx="${f1(x + w * 0.72)}" cy="${f1(y + h * 0.6)}" r="0.7" fill="#e8b04c"/>`;
const lantern = (I, k, x, y, col, s = 1) => `${halo(I(k), x, y + 2 * s, 9 * s, col, 0.9)}<path d="M${x},${y - 3 * s} V${y - 1 * s}" stroke="${OUT}" stroke-width="1"/><rect x="${f1(x - 2 * s)}" y="${f1(y - 1 * s)}" width="${f1(4 * s)}" height="${f1(5 * s)}" rx="1.2" fill="${col}" ${ol(1.1)}/><rect x="${f1(x - 2.6 * s)}" y="${f1(y - 1.6 * s)}" width="${f1(5.2 * s)}" height="${f1(1.4 * s)}" rx="0.6" fill="#3a2a40" ${ol(0.8)}/><circle cx="${f1(x - 0.6 * s)}" cy="${f1(y + 1.2 * s)}" r="${f1(0.8 * s)}" fill="#fff" opacity="0.8"/>`;
const smoke = (x, y, s = 1) => `<g opacity="0.45"><circle cx="${x}" cy="${y}" r="${2.4 * s}" fill="#c9d3ea"/><circle cx="${x + 2.5 * s}" cy="${y - 4 * s}" r="${3 * s}" fill="#c9d3ea" opacity="0.8"/><circle cx="${x + 1 * s}" cy="${y - 9 * s}" r="${3.4 * s}" fill="#dfe6f6" opacity="0.6"/></g>`;
const barrel = (x, y, s = 1, c = '#9a5f33') => `<path d="M${f1(x - 4 * s)},${y} C${f1(x - 5 * s)},${f1(y - 4 * s)} ${f1(x - 5 * s)},${f1(y - 6 * s)} ${f1(x - 4 * s)},${f1(y - 10 * s)} L${f1(x + 4 * s)},${f1(y - 10 * s)} C${f1(x + 5 * s)},${f1(y - 6 * s)} ${f1(x + 5 * s)},${f1(y - 4 * s)} ${f1(x + 4 * s)},${y} Z" fill="${c}" ${ol(1.3)}/><path d="M${f1(x - 4.6 * s)},${f1(y - 2.6 * s)} H${f1(x + 4.6 * s)} M${f1(x - 4.6 * s)},${f1(y - 7.4 * s)} H${f1(x + 4.6 * s)}" stroke="#4a4458" stroke-width="${f1(1.3 * s)}"/><path d="M${f1(x - 2.5 * s)},${f1(y - 9 * s)} V${f1(y - 1 * s)}" stroke="#fff" stroke-width="0.8" opacity="0.3"/>`;
const crate = (x, y, s = 1, c = '#b07a45') => `<rect x="${f1(x - 4.5 * s)}" y="${f1(y - 9 * s)}" width="${f1(9 * s)}" height="${f1(9 * s)}" rx="0.8" fill="${c}" ${ol(1.3)}/><path d="M${f1(x - 4 * s)},${f1(y - 8.5 * s)} L${f1(x + 4 * s)},${f1(y - 0.5 * s)} M${f1(x - 4.5 * s)},${f1(y - 4.5 * s)} H${f1(x + 4.5 * s)}" stroke="#6b4426" stroke-width="1"/>`;
// crescent moon emblem (the island's banner sign)
const moon = (x, y, s, col = '#ffe9a0') => `<path d="M${f1(x + 1 * s)},${f1(y - 3 * s)} A${f1(3 * s)},${f1(3 * s)} 0 0,0 ${f1(x + 1 * s)},${f1(y + 3 * s)} A${f1(1.5 * s)},${f1(3 * s)} 0 0,1 ${f1(x + 1 * s)},${f1(y - 3 * s)} Z" fill="${col}"/>`;

// thatched roof: rounded cone with a ragged fringe and straw strokes
function thatch(I, k, x0, x1, ey, px, py) {
  const n = Math.round((x1 - x0) / 3.2);
  let fr = '';
  for (let i = n; i >= 0; i--) { const x = x0 + (x1 - x0) * i / n; fr += ` L${f1(x)},${f1(ey + (i % 2 ? 3 : 1.2))}`; }
  const d = `M${x0},${ey} C${f1(x0 + (px - x0) * 0.3)},${f1(ey - (ey - py) * 0.55)} ${f1(px - 4)},${f1(py)} ${px},${py} C${f1(px + 4)},${py} ${f1(x1 - (x1 - px) * 0.3)},${f1(ey - (ey - py) * 0.55)} ${x1},${ey}${fr} Z`;
  const strokes = [0.2, 0.4, 0.6, 0.8].map(t => `<path d="M${f1(px + (x0 - px) * t * 0.9)},${f1(py + (ey - py) * t * 0.8)} L${f1(px + (x0 - px) * (t + 0.15))},${f1(ey + 1)} M${f1(px + (x1 - px) * t * 0.9)},${f1(py + (ey - py) * t * 0.8)} L${f1(px + (x1 - px) * (t + 0.15))},${f1(ey + 1)}" stroke="#9a6a2a" stroke-width="0.8" opacity="0.6"/>`).join('');
  return `<defs>${lgu(I(k), x0, py, x1, ey, [[0, '#ffe08a'], [0.5, '#e2a94a'], [1, '#b37a30']])}</defs><path d="${d}" fill="${U(I(k))}" ${ol(1.6)}/>${strokes}<path d="M${f1(x0 + 1)},${f1(ey - 2.5)} Q${px},${f1(ey - 5)} ${f1(x1 - 1)},${f1(ey - 2.5)}" fill="none" stroke="#8a5a22" stroke-width="1.2" opacity="0.7"/><path d="M${f1(px - 3)},${f1(py + 3)} Q${f1(x0 + (px - x0) * 0.35)},${f1(py + (ey - py) * 0.35)} ${f1(x0 + 3)},${f1(ey - 3)}" fill="none" stroke="#fff6c8" stroke-width="1" opacity="0.6"/>`;
}
function hut(I, k, x0, x1, wy, rx0, rx1, py) {
  const w = x1 - x0;
  return `<rect x="${x0}" y="${wy}" width="${w}" height="${62 - wy}" fill="#c58f55" ${ol(1.6)}/>`
    + Array.from({ length: Math.floor(w / 3.4) }, (_, i) => `<path d="M${f1(x0 + 2 + i * 3.4)},${wy + 1} V61" stroke="#8f5f33" stroke-width="0.8" opacity="0.7"/>`).join('')
    + `<rect x="${x0}" y="${wy}" width="${w}" height="${62 - wy}" fill="none" ${ol(1.6)}/><path d="M${x0 + 1},${wy + 4} H${x1 - 1}" stroke="#6b4426" stroke-width="1.2"/>`
    + thatch(I, k, rx0, rx1, wy + 2, (rx0 + rx1) / 2, py);
}
function stoneWall(I, k, x0, x1, y0, R) {
  let st = '';
  for (let y = y0 + 1, row = 0; y < 61; y += 5, row++) for (let x = x0 + (row % 2 ? -3 : 0); x < x1; x += 7) { const xa = Math.max(x0 + 0.5, x + 0.6), w = Math.min(6, x1 - 0.5 - xa); if (w > 1) st += `<rect x="${f1(xa)}" y="${f1(y + 0.5)}" width="${f1(w)}" height="4" rx="1.2" fill="${(row + Math.round(x)) % 3 ? R[0] : R[1]}" stroke="${R[2]}" stroke-width="0.6"/>`; }
  return `<defs><clipPath id="${I(k)}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${62 - y0}"/></clipPath></defs><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${62 - y0}" fill="${R[2]}"/><g clip-path="url(#${I(k)})">${st}</g><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${62 - y0}" fill="none" ${ol(1.6)}/>`;
}
function logWall(I, k, x0, x1, y0) {
  let lg = '';
  for (let y = y0; y < 62; y += 4) lg += `<rect x="${x0 - 1.5}" y="${y}" width="${x1 - x0 + 3}" height="4" rx="2" fill="${(y / 4) % 2 ? '#9a6234' : '#8a552c'}" ${ol(0.9)}/><circle cx="${x0 - 0.5}" cy="${y + 2}" r="1.6" fill="#d9a066" ${ol(0.7)}/><circle cx="${x1 + 0.5}" cy="${y + 2}" r="1.6" fill="#d9a066" ${ol(0.7)}/>`;
  return lg;
}
function snowRoof(I, k, x0, x1, ey, px, py) {
  const roof = `M${x0},${ey} L${px},${py} L${x1},${ey} Z`;
  const snow = `M${x0 - 1.5},${ey + 1} L${px},${py - 3} L${x1 + 1.5},${ey + 1} Q${x1 - 2},${ey + 3} ${x1 - 4},${ey + 1.5} Q${f1((x1 + px) / 2)},${ey + 3.5} ${px + 2},${ey + 1.5} Q${px - 3},${ey + 4} ${f1((x0 + px) / 2)},${ey + 2} Q${x0 + 2},${ey + 3.5} ${x0 - 1.5},${ey + 1} Z`;
  const ic = [0.15, 0.32, 0.55, 0.75, 0.9].map((t, i) => { const x = x0 + (x1 - x0) * t; return `<path d="M${f1(x - 1.1)},${ey + 1.5} L${f1(x)},${ey + 4.5 + (i % 2) * 2.5} L${f1(x + 1.1)},${ey + 1.5} Z" fill="#bfeaff" ${ol(0.8)}/>`; }).join('');
  return `<path d="${roof}" fill="#6a3f2a" ${ol(1.5)}/>${ic}<path d="${snow}" fill="#f4f9ff" ${ol(1.5)}/><path d="M${f1(x0 + 3)},${ey - 1} L${px},${py} " stroke="#fff" stroke-width="1.2" opacity="0.9"/><path d="M${px},${py + 1} L${f1(x1 - 4)},${ey - 0.5}" stroke="#bcd0ea" stroke-width="1.2"/>`;
}
function slateRoof(I, k, x0, x1, ey, px, py, ember) {
  const roof = `M${x0},${ey} L${px},${py} L${x1},${ey} Z`;
  return `<defs>${lgu(I(k), x0, py, x1, ey, [[0, '#6c6474'], [1, '#2f2a38']])}<clipPath id="${I(k + 'c')}"><path d="${roof}"/></clipPath></defs><path d="${roof}" fill="${U(I(k))}" ${ol(1.5)}/>
    <g clip-path="url(#${I(k + 'c')})">${[0.3, 0.55, 0.8].map(t => `<path d="M${x0},${f1(py + (ey - py) * t)} H${x1}" stroke="#1f1b27" stroke-width="0.9"/>`).join('')}${ember ? `<path d="M${f1(px - 3)},${f1(py + 6)} l2,2 l-1,3" stroke="#ff8a2a" stroke-width="1" fill="none"/>` : ''}</g>
    <path d="M${f1(x0 + 2)},${ey - 0.5} L${px},${py + 0.5}" stroke="#a39aa6" stroke-width="1.1" opacity="0.7"/>`;
}

function village(b) {
  return I => {
    if (b === 'coral') return `
      <path d="M100,62 V6" ${ol(3)}/><path d="M100,62 V6" stroke="#a2683a" stroke-width="1.5"/>
      <path d="M100,7 C93,5 88,9 81,7 L82,17 C89,19 94,15 100,17 Z" fill="#2fb7c9" ${ol(1.4)}/>${moon(90, 12, 1.2)}
      <circle cx="100" cy="5" r="1.8" fill="#e8b04c" ${ol(1)}/>
      ${hut(I, 'h2', 40, 70, 34, 34, 76, 8)}
      ${win(I, 'w2', 45, 40, 6, 6, { round: true })}${win(I, 'w3', 59, 40, 6, 6, { round: true })}${door(51.5, 47, 7, 15)}
      ${hut(I, 'h1', 9, 33, 41, 4, 38, 20)}${win(I, 'w1', 13, 46, 6, 5)}${door(23, 50, 6, 12)}
      ${hut(I, 'h3', 75, 96, 43, 70, 101, 25)}${win(I, 'w4', 82, 48, 7, 5)}
      ${halo(I('tg'), 37, 41, 9, '#ffb04a', 1)}<path d="M37,62 V44" ${ol(2.6)}/><path d="M37,62 V44" stroke="#8a5a32" stroke-width="1.2"/><path d="M35,44 Q37,38 39,44 Z" fill="#ffd36a" ${ol(1)}/>
      ${barrel(70, 62, 0.8)}${crate(103, 62, 0.75)}${barrel(4.5, 62, 0.7, '#a86a3a')}`;
    if (b === 'escarcha') return `
      ${smoke(66, 10, 0.6)}
      <rect x="62" y="12" width="6" height="12" fill="#7d7484" ${ol(1.4)}/><rect x="61" y="10" width="8" height="3" rx="1" fill="#f4f9ff" ${ol(1.1)}/>
      ${logWall(I, 'l2', 41, 69, 34)}${snowRoof(I, 'r2', 36, 74, 35, 55, 13)}
      ${win(I, 'w2', 44, 41, 7, 7, { frame: '#5a3a24' })}${win(I, 'w3', 59, 41, 7, 7, { frame: '#5a3a24' })}${door(51.5, 47, 7, 15, '#6e4026')}
      ${smoke(16, 18, 0.7)}<rect x="13" y="25" width="5" height="10" fill="#7d7484" ${ol(1.3)}/>
      ${logWall(I, 'l1', 8, 33, 42)}${snowRoof(I, 'r1', 4, 37, 43, 21, 25)}${win(I, 'w1', 12, 48, 6, 6, { frame: '#5a3a24' })}${door(24, 50, 6, 12, '#6e4026')}
      ${logWall(I, 'l3', 77, 98, 44)}${snowRoof(I, 'r3', 73, 102, 45, 88, 28)}${win(I, 'w4', 84, 50, 7, 6, { frame: '#5a3a24' })}
      <path d="M71,62 L71,52 M75,62 L75,53" stroke="${OUT}" stroke-width="2.2"/>${[0, 1, 2].map(i => `<circle cx="${70.5 + i * 2.5}" cy="${59.5 - (i % 2) * 2}" r="2" fill="#a5683a" ${ol(1)}/><circle cx="${70.5 + i * 2.5}" cy="${59.5 - (i % 2) * 2}" r="0.8" fill="#e0b080"/>`).join('')}
      <path d="M104,62 V43" ${ol(2.4)}/><path d="M104,62 V43" stroke="#5a5466" stroke-width="1"/>${lantern(I, 'ln', 104, 46, '#ffd36a')}
      <path d="M2,62 C4,58 12,58 16,62 Z M96,62 C99,59 104,59 108,62 Z M34,62 C36,60 40,60 42,62 Z" fill="#f4f9ff" ${ol(1.2)}/>`;
    if (b === 'brasa') {
      const R = ['#8a8290', '#6f6878', '#3c3644'];
      return `
      ${halo(I('fg'), 61, 50, 20, '#ff8a2a', 1)}
      <path d="M66,30 L66,12 L73,12 L73,30 Z" fill="#5b5462" ${ol(1.5)}/><path d="M65,12 H74 V9 H65 Z" fill="#3c3644" ${ol(1.2)}/>${halo(I('cg'), 69.5, 8, 6, '#ff8a2a', 0.9)}
      <circle cx="71" cy="5" r="0.7" fill="#ffd36a"/><circle cx="67.5" cy="6.4" r="0.6" fill="#ffb04a"/>
      ${stoneWall(I, 's2', 40, 76, 32, R)}${slateRoof(I, 'r2', 35, 81, 33, 58, 14, true)}
      <path d="M50,62 V46 Q61,38 72,46 V62 Z" fill="#1a1016" ${ol(1.5)}/>
      <path d="M53,62 C53,54 58,50 61,50 C64,50 69,54 69,62 Z" fill="#ff6a1f"/><path d="M56,62 C56,57 59,54 61,54 C63,54 66,57 66,62 Z" fill="#ffd36a"/>
      <path d="M58,55 l1.5,-3 l1.5,2 l1.5,-4 l1.5,5" stroke="#fff3b0" stroke-width="1" fill="none"/>
      ${win(I, 'w2', 42, 39, 5, 6, { frame: '#3c3644', col: ['#fff1c0', '#ffad4a', '#ff7a2a'] })}
      ${stoneWall(I, 's1', 8, 33, 42, R)}${slateRoof(I, 'r1', 4, 37, 43, 20, 26)}${win(I, 'w1', 12, 48, 6, 6, { frame: '#3c3644', col: ['#fff1c0', '#ffad4a', '#ff7a2a'] })}${door(23, 50, 6, 12, '#5a3a2a')}
      ${stoneWall(I, 's3', 84, 104, 44, R)}${slateRoof(I, 'r3', 80, 107, 45, 94, 30)}${win(I, 'w3', 90, 50, 7, 6, { frame: '#3c3644', col: ['#fff1c0', '#ffad4a', '#ff7a2a'] })}
      <path d="M74,62 L75,58 L72,57 L72,55 L83,55 L83,57 L79,58 L80,62 Z" fill="#4a4458" ${ol(1.3)}/><path d="M73,55.6 H82" stroke="#8a8290" stroke-width="0.8"/>
      ${barrel(38, 62, 0.75, '#6a4a3a')}`;
    }
    // abismo: dark towers with violet lanterns
    const tower = (k, x0, x1, ty, py, wins) => {
      const w = x1 - x0, cx = (x0 + x1) / 2;
      return `<defs>${lgu(I(k), x0, 0, x1, 0, [[0, '#6e55a0'], [0.5, '#4a3878'], [1, '#2a1f4a']])}${lgu(I(k + 'r'), x0, py, x1, ty, [[0, '#8a5ad8'], [1, '#3a2470']])}</defs>
        <rect x="${x0}" y="${ty}" width="${w}" height="${62 - ty}" fill="${U(I(k))}" ${ol(1.6)}/>
        ${Array.from({ length: Math.floor((62 - ty) / 6) }, (_, i) => `<path d="M${x0 + 0.8},${ty + 6 + i * 6} H${x1 - 0.8}" stroke="#2a1f4a" stroke-width="0.8" opacity="0.7"/>`).join('')}
        <path d="M${x0 + 2},${ty + 2} V61" stroke="#a888e0" stroke-width="1" opacity="0.45"/>
        <path d="M${x0 - 3},${ty + 1} L${f1(cx)},${py} L${x1 + 3},${ty + 1} Q${f1(cx)},${ty - 2} ${x0 - 3},${ty + 1} Z" fill="${U(I(k + 'r'))}" ${ol(1.6)}/>
        <path d="M${f1(cx - 1)},${py + 4} L${x0},${ty - 0.5}" stroke="#d2b0ff" stroke-width="1" opacity="0.6"/>
        <circle cx="${f1(cx)}" cy="${py - 1.5}" r="1.6" fill="#e6b8ff" ${ol(0.9)}/>
        <rect x="${x0 - 1.5}" y="${ty + 1}" width="${w + 3}" height="2.6" rx="0.8" fill="#3a2a5a" ${ol(1)}/>
        ${wins}`;
    };
    return `
      ${tower('t2', 43, 67, 26, 7, win(I, 'w2', 49, 32, 5, 7, { frame: '#3a2a5a' }) + win(I, 'w3', 57, 32, 5, 7, { frame: '#3a2a5a' }) + door(51.5, 49, 7, 13, '#3a2a5a', '#22173c'))}
      ${tower('t1', 10, 28, 30, 10, win(I, 'w1', 16, 38, 6, 7, { frame: '#3a2a5a' }) + win(I, 'w5', 16.5, 50, 5, 5, { frame: '#3a2a5a', round: true }))}
      ${tower('t3', 80, 98, 34, 15, win(I, 'w4', 86, 42, 6, 7, { frame: '#3a2a5a' }))}
      <path d="M28,40 H34 V42" stroke="${OUT}" stroke-width="1.6" fill="none"/>${lantern(I, 'l1', 34, 45, '#d58cff')}
      <path d="M80,44 H75 V46" stroke="${OUT}" stroke-width="1.6" fill="none"/>${lantern(I, 'l2', 75, 49, '#d58cff')}
      <path d="M104,62 V40" ${ol(2.4)}/><path d="M104,62 V40" stroke="#4a3878" stroke-width="1"/>${lantern(I, 'l3', 104, 43, '#d58cff')}
      ${shards(36, 62, -8, 0.5, PAL.abismo.xtal, [[0, 1, 1], [-30, 0.6, 0.8], [26, 0.7, 0.85]], PAL.abismo.glow)}
      ${shards(5, 62, 10, 0.4, PAL.abismo.xtal, [[0, 1, 1], [30, 0.6, 0.8]], PAL.abismo.glow)}`;
  };
}
for (const b of BIOMES) S['vil_' + b] = { w: 110, h: 64, ax: 55, ay: 62, draw: village(b) };

// ================================================================ trees (50x84, anchor at the base of the trunk)
function frond(cx, cy, ang, len, droop, w, C) {
  const a = ang * Math.PI / 180, ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len + droop;
  const mx = cx + Math.cos(a) * len * 0.5, my = cy + Math.sin(a) * len * 0.5 - Math.abs(Math.cos(a)) * len * 0.34;
  const P = t => [(1 - t) * (1 - t) * cx + 2 * (1 - t) * t * mx + t * t * ex, (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * my + t * t * ey];
  const top = [], bot = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, [x, y] = P(t), [x2, y2] = P(Math.min(1, t + 0.01));
    const dx = x2 - x, dy = y2 - y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const ww = w * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.35);
    const s2 = ny < 0 ? 1 : -1;
    top.push([f1(x + nx * ww * 0.8 * s2), f1(y + ny * ww * 0.8 * s2)]);
    bot.push([f1(x - nx * ww * (i % 2 ? 1.25 : 0.55) * s2), f1(y - ny * ww * (i % 2 ? 1.25 : 0.55) * s2)]);
  }
  const d = 'M' + [...top, ...bot.reverse()].map(p => p.join(',')).join(' L') + ' Z';
  const rib = `M${cx},${cy} Q${f1(mx)},${f1(my)} ${f1(ex)},${f1(ey)}`;
  return { d, rib };
}
function tree(b) {
  return I => {
    if (b === 'coral') {
      const C = { l: '#7fd35a', m: '#4fa845', d: '#2f7a3c' };
      const trunk = 'M18,82 C19,62 22,44 28,26 L33,27 C29,44 27,62 27,82 Z';
      const fr = [[-178, 26, 16, 7], [-148, 22, 9, 6.5], [-108, 15, 3, 5.5], [-70, 19, 5, 6], [-30, 18, 9, 6.5], [2, 15, 13, 6]].map(([a, l, dr, w]) => frond(30, 23, a, l, dr, w, C));
      return `<defs>${lgu(I('tr'), 18, 0, 33, 0, [[0, '#d9a066'], [0.5, '#a8703f'], [1, '#6e4426']])}${lgu(I('lf'), 0, 4, 0, 40, [[0, C.l], [0.5, C.m], [1, C.d]])}</defs>
        <ellipse cx="22" cy="81" rx="10" ry="2" fill="${OUT}" opacity="0.3"/>
        <path d="${trunk}" fill="${U(I('tr'))}" ${ol(1.8)}/>
        ${[72, 63, 54, 46, 38, 31].map((y, i) => `<path d="M${f1(19.2 + i * 1.6 - (y > 60 ? 0 : 0))},${y} Q${f1(23 + i * 1.3)},${y + 2} ${f1(27.2 + i * 0.9)},${y - 0.5}" fill="none" stroke="#5a3a20" stroke-width="1" opacity="0.8"/>`).join('')}
        <path d="M20.5,80 C21,64 23.5,46 29,29" fill="none" stroke="#f0c48a" stroke-width="1" opacity="0.55"/>
        ${unite(fr.map(f => f.d), U(I('lf')), 1.5)}
        ${fr.map(f => `<path d="${f.rib}" fill="none" stroke="${C.d}" stroke-width="0.9" opacity="0.8"/>`).join('')}
        ${[[26, 26], [31, 27.5], [28.5, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#7a4a26" ${ol(1.2)}/><circle cx="${x - 0.8}" cy="${y - 0.9}" r="0.8" fill="#c08850"/>`).join('')}`;
    }
    if (b === 'escarcha') {
      // layered pine: concave tiers with drooping tips, a snow shelf above every tier edge
      const tier = (cx, by, hw, ty) => {
        let d = `M${cx - hw},${by - 1} C${f1(cx - hw * 0.55)},${by - 3} ${f1(cx - hw * 0.28)},${f1(ty + (by - ty) * 0.45)} ${cx},${ty} C${f1(cx + hw * 0.28)},${f1(ty + (by - ty) * 0.45)} ${f1(cx + hw * 0.55)},${by - 3} ${cx + hw},${by - 1}`;
        const n = 4;
        for (let i = 1; i <= n; i++) { const xa = cx + hw - (2 * hw) * (i - 1) / n, xb = cx + hw - (2 * hw) * i / n; d += ` Q${f1((xa + xb) / 2)},${by + 2.6} ${f1(xb)},${i === n ? by - 1 : by}`; }
        return d + ' Z';
      };
      const T = [[22, 72, 20, 44], [22, 58, 16, 30], [22, 44, 12, 16], [22, 30, 8.5, 4]];
      return `<defs>${lgu(I('pn'), 2, 0, 42, 0, [[0, '#4a9a7c'], [0.45, '#2c6e5e'], [1, '#1a4542']])}</defs>
        <ellipse cx="22" cy="81" rx="12" ry="2" fill="${OUT}" opacity="0.3"/>
        <rect x="19" y="66" width="6" height="16" rx="1" fill="#7a4a2a" ${ol(1.6)}/><path d="M20.5,72 V81" stroke="#b07a4a" stroke-width="1"/>
        ${T.map(([cx, by, hw, ty], i) => { const d = tier(cx, by, hw, ty); return `<defs><clipPath id="${I('tc' + i)}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${U(I('pn'))}"/>
          <g clip-path="url(#${I('tc' + i)})"><path d="${d}" transform="translate(0 -2.6)" fill="#f4f9ff"/><path d="${d}" transform="translate(0 -3.6)" fill="#c6dcf0"/><path d="${d}" transform="translate(0 -6.4)" fill="${U(I('pn'))}"/>
          <path d="M${f1(cx - hw * 0.5)},${by - 4} C${f1(cx - hw * 0.3)},${f1(ty + (by - ty) * 0.5)} ${f1(cx - hw * 0.15)},${f1(ty + (by - ty) * 0.3)} ${cx - 0.5},${ty + 2}" fill="none" stroke="#7fd0b0" stroke-width="1" opacity="0.5"/></g>
          <path d="${d}" fill="none" ${ol(1.6)}/>`; }).join('')}
        <path d="M18.4,14 L22,3 L25.6,14 Q24,12.5 22.6,14.5 Q21,12.4 18.4,14 Z" fill="#f4f9ff" ${ol(1.1)}/>`;
    }
    if (b === 'brasa') {
      const limbs = [[22, 84, 24, 30, 4.5, 2], [23, 52, 8, 30, 2.6, -3], [23, 44, 40, 24, 2.8, 3], [12, 36, 4, 22, 1.6, -2], [34, 30, 38, 14, 1.6, 2], [24, 34, 20, 10, 2, -1.5], [16, 44, 9, 42, 1.4, 1], [31, 40, 44, 38, 1.4, 1]];
      return `<defs>${lgu(I('ch'), 14, 0, 32, 0, [[0, '#5a5060'], [0.5, '#3a3240'], [1, '#1e1a24']])}</defs>
        ${halo(I('eg'), 22, 58, 14, '#ff7a1a', 0.5)}
        <ellipse cx="22" cy="81" rx="11" ry="2" fill="${OUT}" opacity="0.35"/>
        ${unite(limbs.map(l => blade(...l)), U(I('ch')), 1.6)}
        ${limbs.map(l => bladeHi(...l, '#8d8496', 0.5)).join('')}
        ${crack('M22,78 L24,70 L21,63 L24,55 L22,48', PAL.brasa.hot, 0.8)}${crack('M17,46 L13,42', PAL.brasa.hot, 0.6)}${crack('M28,44 L33,40', PAL.brasa.hot, 0.6)}
        ${[[10, 18, 1], [38, 10, 0.8], [30, 6, 0.7], [16, 8, 0.9], [44, 26, 0.7]].map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="${f1(2.6 * s)}" fill="#ff8a2a" opacity="0.3"/><circle cx="${x}" cy="${y}" r="${f1(0.9 * s)}" fill="#ffd36a"/>`).join('')}
        <path d="M14,82 Q18,77 22,78 Q27,77 31,82 Z" fill="#4a4250" ${ol(1.3)}/><circle cx="20" cy="80" r="0.8" fill="#ff9a3a"/><circle cx="26" cy="80.5" r="0.7" fill="#ffd36a"/>`;
    }
    // abismo: crystal tree
    const X = PAL.abismo.xtal, G = PAL.abismo.glow;
    const limbs = [[22, 84, 22, 40, 4, -1.5], [22, 56, 10, 36, 2.2, -2], [22, 50, 35, 32, 2.2, 2], [22, 44, 24, 24, 2, 1]];
    const leaves = [[10, 34, -30, 0.75], [22, 22, 0, 0.9], [35, 30, 30, 0.8], [16, 26, -12, 0.6], [29, 22, 14, 0.62], [6, 44, -60, 0.5], [40, 40, 58, 0.5]];
    return `<defs>${lgu(I('ct'), 16, 0, 28, 0, [[0, '#7a5ab0'], [0.5, '#4f3a80'], [1, '#2a1f4a']])}</defs>
      ${halo(I('cg'), 22, 26, 26, G, 0.7)}
      <ellipse cx="22" cy="81" rx="10" ry="2" fill="${OUT}" opacity="0.35"/>
      ${unite(limbs.map(l => blade(...l)), U(I('ct')), 1.6)}
      ${limbs.map(l => bladeHi(...l, '#c9a8f0', 0.5)).join('')}
      ${leaves.map(([x, y, a, s]) => shards(x, y, a, s, X, [[0, 1, 1], [-34, 0.62, 0.8], [32, 0.66, 0.82]])).join('')}
      ${[[12, 14], [33, 12], [42, 26], [4, 30], [24, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${G}" opacity="0.35"/><circle cx="${x}" cy="${y}" r="0.9" fill="#fff"/>`).join('')}
      ${shards(16, 82, -20, 0.35, X, [[0, 1, 1], [34, 0.6, 0.8]])}`;
  };
}
for (const b of BIOMES) S['tree_' + b] = { w: 50, h: 84, ax: 22, ay: 82, draw: tree(b) };

// ================================================================ island props
S.lighthouse = {
  w: 40, h: 110, ax: 20, ay: 108, pts: { lamp: [20, 27] },
  draw: I => {
    const tower = 'M11,100 L14,38 L26,38 L29,100 Z';
    return `<defs>${lgu(I('tw'), 11, 0, 29, 0, [[0, '#ffffff'], [0.55, '#e6e2ee'], [1, '#a9a3bc']])}${lgu(I('rd'), 11, 0, 29, 0, [[0, '#ff7a7a'], [0.55, '#d8434e'], [1, '#8f2232']])}
      <clipPath id="${I('tc')}"><path d="${tower}"/></clipPath>${lgu(I('rf'), 12, 0, 28, 0, [[0, '#ff7a7a'], [0.6, '#d8434e'], [1, '#8f2232']])}</defs>
      ${halo(I('lg'), 20, 27, 19, '#ffd36a', 1)}
      <path d="M6,108 L8,99 L32,99 L34,108 Z" fill="#8a8290" ${ol(1.8)}/><path d="M9,103 H31 M14,99 V103 M24,99 V103 M19,103 V108 M29,103 V108 M11,103 V108" stroke="#5a5466" stroke-width="0.9"/>
      <path d="${tower}" fill="${U(I('tw'))}"/>
      <g clip-path="url(#${I('tc')})">${[46, 62, 78, 94].map(y => `<rect x="0" y="${y - 8}" width="40" height="8" fill="${U(I('rd'))}"/>`).join('')}<path d="M25,38 L28,100 L40,100 L40,38 Z" fill="#1c1430" opacity="0.15"/></g>
      <path d="M15.5,42 L13,98" stroke="#fff" stroke-width="1.2" opacity="0.6"/>
      <path d="${tower}" fill="none" ${ol(2)}/>
      ${door(17, 91, 6, 9, '#6e4126')}${win(I, 'tw1', 18, 66, 4, 5, { bars: false })}${win(I, 'tw2', 18.2, 50, 3.6, 4.5, { bars: false })}
      <rect x="7" y="35" width="26" height="4" rx="1.2" fill="#4a4458" ${ol(1.6)}/>
      <path d="M8.5,35 V30 M12,35 V30 M28,35 V30 M31.5,35 V30 M8,30 H32" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round"/>
      <rect x="13" y="19" width="14" height="16" rx="1" fill="#ffe9a0" ${ol(1.6)}/>
      ${rgu(I('lm'), 20, 27, 8, [[0, '#ffffff'], [0.4, '#fff3b0'], [1, '#ffc95a']]).replace('<radialGradient', '<defs><radialGradient').replace('</radialGradient>', '</radialGradient></defs>')}
      <rect x="14" y="20" width="12" height="14" fill="${U(I('lm'))}"/>
      <path d="M17,19.5 V34.5 M23,19.5 V34.5" stroke="${OUT}" stroke-width="1.1"/>
      <circle cx="20" cy="27" r="2.6" fill="#fff" stroke="#ffb347" stroke-width="1"/>
      <path d="M11,20 L20,8 L29,20 Z" fill="${U(I('rf'))}" ${ol(1.7)}/><path d="M14,19 L20,10" stroke="#ffb0b0" stroke-width="1" opacity="0.8"/>
      <rect x="10.5" y="18.5" width="19" height="2.6" rx="1" fill="#4a4458" ${ol(1.2)}/>
      <path d="M20,8 V4.5" ${ol(1.6)}/><circle cx="20" cy="4" r="1.6" fill="#e8b04c" ${ol(1)}/>`;
  },
};

S.cannon = {
  w: 46, h: 26, ax: 12, ay: 15,
  draw: I => {
    const barrel = 'M7,8.5 C7,7.5 8,7 9,7 L38,9.6 L39,9 L43.5,9 C44.3,9 44.5,9.6 44.5,10.5 L44.5,19.5 C44.5,20.4 44.3,21 43.5,21 L39,21 L38,20.4 L9,23 C8,23 7,22.5 7,21.5 Z';
    return `<defs>${lgu(I('b'), 0, 7, 0, 23, [[0, '#6e6a80'], [0.3, '#3a3648'], [0.75, '#1f1c2a'], [1, '#141019']])}${lgu(I('z'), 0, 7, 0, 23, [[0, '#ffe39a'], [0.45, '#e0a040'], [1, '#8f5a1c']])}</defs>
      <circle cx="4.2" cy="15" r="2.6" fill="${U(I('z'))}" ${ol(1.4)}/>
      <path d="${barrel}" fill="${U(I('b'))}" ${ol(1.8)}/>
      <rect x="7" y="7.2" width="3.4" height="15.6" rx="1.2" fill="${U(I('z'))}" ${ol(1.2)}/>
      <path d="M22,8.4 L25,8.7 L25,21.3 L22,21.6 Z" fill="${U(I('z'))}" ${ol(1.1)}/>
      <path d="M38.2,9.2 L40.5,9 L40.5,21 L38.2,20.8 Z" fill="${U(I('z'))}" ${ol(1.1)}/>
      <rect x="40.5" y="8.6" width="4.4" height="12.8" rx="1.4" fill="${U(I('z'))}" ${ol(1.3)}/>
      <ellipse cx="44.6" cy="15" rx="0.9" ry="3.6" fill="${OUT}"/>
      <path d="M11,10.4 L37,12" stroke="#a6a2bc" stroke-width="1.2" opacity="0.6" stroke-linecap="round"/>
      <circle cx="12" cy="15" r="3.4" fill="${U(I('z'))}" ${ol(1.3)}/><circle cx="12" cy="15" r="1.2" fill="#6b4416"/>`;
  },
};
S.cannonBase = {
  w: 30, h: 18, ax: 15, ay: 16,
  draw: I => `<defs>${lgu(I('w'), 0, 3, 0, 14, [[0, '#c98a50'], [0.5, '#9a5f33'], [1, '#6a3f22']])}</defs>
    <path d="M4,13 L4,8 L9,8 L9,5 L18,5 L18,3 L24,3 L26,8 L26,13 Z" fill="${U(I('w'))}" ${ol(1.6)}/>
    <path d="M5,10.5 H25" stroke="#5a3a20" stroke-width="0.9"/><path d="M6,8.6 H8 M10,5.6 H17" stroke="#f0c48a" stroke-width="0.9" opacity="0.7"/>
    <circle cx="12" cy="7.5" r="0.9" fill="#4a4458"/><circle cx="21" cy="6" r="0.9" fill="#4a4458"/>
    ${[[8, 12.6], [22, 12.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#7a4a2a" ${ol(1.5)}/><circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="#3a3648" stroke-width="1"/><path d="M${x - 3},${y} H${x + 3} M${x},${y - 3} V${y + 3}" stroke="#4e2c18" stroke-width="0.9"/><circle cx="${x}" cy="${y}" r="1.1" fill="#e0a040" ${ol(0.7)}/>`).join('')}`,
};

S.wall = {
  w: 26, h: 32, ax: 13, ay: 31,
  draw: I => {
    const sil = 'M3,31 L3,9 L3,4 L8,4 L8,7 L11,7 L11,4 L15,4 L15,7 L18,7 L18,4 L23,4 L23,9 L23,31 Z';
    let st = '';
    for (let y = 8, row = 0; y < 31; y += 4.6, row++) for (let x = row % 2 ? 0 : 3; x < 26; x += 6) st += `<rect x="${f1(x + 0.5)}" y="${f1(y + 0.4)}" width="5.2" height="3.8" rx="1" fill="${(row + x) % 3 ? '#a59cae' : '#8f8698'}" stroke="#5f566a" stroke-width="0.6"/>`;
    return `<defs><clipPath id="${I('c')}"><path d="${sil}"/></clipPath>${lgu(I('bn'), 9, 0, 17, 0, [[0, '#4fd0e0'], [0.5, '#2a9db8'], [1, '#1d6a8a']])}</defs>
      <path d="${sil}" fill="#5f566a"/>
      <g clip-path="url(#${I('c')})">${st}<rect x="3" y="4" width="2.4" height="28" fill="#fff" opacity="0.18"/><rect x="18" y="4" width="6" height="28" fill="${OUT}" opacity="0.2"/></g>
      <path d="M3,9.4 H23" stroke="#5f566a" stroke-width="1.2"/>
      <path d="${sil}" fill="none" ${ol(1.8)}/>
      <path d="M8.5,9.5 H17.5" ${ol(2.4)}/><path d="M8.5,9.5 H17.5" stroke="#8a5a32" stroke-width="1"/>
      <path d="M9,10 L17,10 L17,21 L13,18.5 L9,21 Z" fill="${U(I('bn'))}" ${ol(1.3)}/>${moon(13, 14, 1.05)}
      <path d="M10,11 V18.5" stroke="#fff" stroke-width="0.8" opacity="0.4"/>
      <rect x="11" y="24" width="4" height="7" rx="2" fill="#2a2236" ${ol(1)}/>`;
  },
};

// ================================================================ giant clams (sit on reef3 shelves)
const CLAM = { sh: ['#fbe4f0', '#d79bc4', '#8a4f93'], in: ['#fff6fb', '#f2cde2', '#c99acb'], man: ['#7af0e6', '#2bb3c4', '#16708e'] };
// wavy interlocking seam between the two valves
const clamSeam = (y, amp, x0 = 3, x1 = 37, n = 6) => { let d = ''; for (let i = 0; i <= n * 2; i++) d += ` L${f1(x0 + (x1 - x0) * i / (n * 2))},${f1(y + (i % 2 ? amp : -amp))}`; return d; };
function clamBowl(I) {
  const d = `M3,17 C3,25 10,28 20,28 C30,28 37,25 37,17${clamSeam(17, 1.6).split(' L').reverse().slice(0, -1).map(p => ' L' + p).join('')} Z`;
  return `<defs>${lgu(I('bw'), 0, 14, 0, 28, [[0, CLAM.sh[0]], [0.45, CLAM.sh[1]], [1, CLAM.sh[2]]])}</defs>
    <ellipse cx="20" cy="27.6" rx="16" ry="1.6" fill="${OUT}" opacity="0.35"/>
    <path d="${d}" fill="${U(I('bw'))}" ${ol(1.8)}/>
    ${[6, 10.5, 15, 20, 25, 29.5, 34].map(x => `<path d="M${x},${x < 8 || x > 32 ? 19 : 19.5} Q${f1(20 + (x - 20) * 0.7)},25.5 ${f1(20 + (x - 20) * 0.45)},27.4" fill="none" stroke="${CLAM.sh[2]}" stroke-width="1" opacity="0.65"/>`).join('')}
    <path d="M6,20.5 Q8,25 13,26.6" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.6"/>`;
}
S.clam0 = {
  w: 40, h: 30, ax: 20, ay: 28,
  draw: I => `${halo(I('pg'), 20, 15, 15, '#e8f6ff', 1)}
    <path d="M4,13 C5,5 12,1.5 20,1.5 C28,1.5 35,5 36,13${clamSeam(13, 1.4)} Z" fill="${CLAM.sh[1]}" ${ol(1.8)}/>
    <path d="M6.5,12 C8,6 13,3.6 20,3.6 C27,3.6 32,6 33.5,12 Z" fill="url(#${I('in')})"/>
    <defs>${lgu(I('in'), 0, 3, 0, 13, [[0, CLAM.in[2]], [0.5, CLAM.in[1]], [1, CLAM.in[0]]])}${rgu(I('pr'), 18.6, 13.4, 5, [[0, '#ffffff'], [0.55, '#eef4ff'], [1, '#b9c6ee']])}${lgu(I('mn'), 0, 13, 0, 20, [[0, CLAM.man[0]], [0.6, CLAM.man[1]], [1, CLAM.man[2]]])}</defs>
    ${[9, 14, 20, 26, 31].map(x => `<path d="M${x},12 L${f1(20 + (x - 20) * 0.35)},4.5" stroke="${CLAM.in[2]}" stroke-width="0.9" opacity="0.6"/>`).join('')}
    <path d="M4.5,16 C8,12.6 14,12 20,12 C26,12 32,12.6 35.5,16 C30,18.4 10,18.4 4.5,16 Z" fill="url(#${I('mn')})" ${ol(1.3)}/>
    <path d="M8,15 C13,13.6 27,13.6 32,15" fill="none" stroke="#c8fff8" stroke-width="0.9" opacity="0.8"/>
    ${clamBowl(I)}
    <circle cx="20" cy="13.6" r="4.4" fill="url(#${I('pr')})" ${ol(1.3)}/>
    <circle cx="18.4" cy="12" r="1.4" fill="#fff"/><path d="M22.2,15.6 Q23,14.4 22.8,13" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.8"/>
    ${[[9, 6, 0.9], [31, 7, 0.8], [26, 2.6, 0.6]].map(([x, y, s]) => `<path d="M${x},${f1(y - 2 * s)} L${f1(x + 0.6 * s)},${f1(y - 0.6 * s)} L${f1(x + 2 * s)},${y} L${f1(x + 0.6 * s)},${f1(y + 0.6 * s)} L${x},${f1(y + 2 * s)} L${f1(x - 0.6 * s)},${f1(y + 0.6 * s)} L${f1(x - 2 * s)},${y} L${f1(x - 0.6 * s)},${f1(y - 0.6 * s)} Z" fill="#fff" opacity="0.85"/>`).join('')}`,
};
S.clam1 = {
  w: 40, h: 30, ax: 20, ay: 28,
  draw: I => `<defs>${lgu(I('tp'), 0, 5, 0, 18, [[0, CLAM.sh[0]], [0.5, CLAM.sh[1]], [1, CLAM.sh[2]]])}</defs>
    <path d="M3,17 C3,9 10,5 20,5 C30,5 37,9 37,17${clamSeam(17, 1.6).split(' L').reverse().slice(0, -1).map(p => ' L' + p).join('')} Z" fill="${U(I('tp'))}" ${ol(1.8)}/>
    ${[6, 10.5, 15, 20, 25, 29.5, 34].map(x => `<path d="M${x},${x < 8 || x > 32 ? 15 : 15.4} Q${f1(20 + (x - 20) * 0.75)},9 ${f1(20 + (x - 20) * 0.5)},6" fill="none" stroke="${CLAM.sh[2]}" stroke-width="1" opacity="0.6"/>`).join('')}
    <path d="M7,12 Q10,7.4 17,6.6" fill="none" stroke="#fff" stroke-width="1.3" opacity="0.7" stroke-linecap="round"/>
    ${clamBowl(I)}
    <path d="M3.5,17.3${clamSeam(17.3, 1.4, 3.5, 36.5).slice(0)}" fill="none" stroke="${CLAM.man[1]}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M3,17${clamSeam(17, 1.6)}" fill="none" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>`,
};

// ================================================================ sky
function cloud(I, puffs, w, h) {
  const d = puffs.map(([x, y, rx, ry]) => `M${x - rx},${y} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`).join(' ');
  const id = s => I('c' + s);
  return `<defs><clipPath id="${id('a')}"><path d="${d}" transform="translate(1.5 3.5)"/></clipPath><clipPath id="${id('b')}"><path d="${d}" transform="translate(0 -5)"/></clipPath>
      ${lgu(id('g'), 0, 4, 0, h - 4, [[0, '#8a9bc4'], [1, '#5f6f9a']])}</defs>
    <path d="${d}" fill="#b9c6e6" stroke="#3a4670" stroke-width="1.4" stroke-opacity="0.55"/>
    <g clip-path="url(#${id('a')})"><path d="${d}" fill="#4f5d88"/><g clip-path="url(#${id('b')})"><path d="${d}" fill="${U(id('g'))}"/></g></g>
    ${puffs.filter(p => p[1] < h / 2 + 2).map(([x, y, rx, ry]) => `<path d="M${f1(x - rx * 0.55)},${f1(y - ry * 0.55)} Q${x},${f1(y - ry * 0.95)} ${f1(x + rx * 0.35)},${f1(y - ry * 0.75)}" fill="none" stroke="#dfe7fa" stroke-width="1.3" opacity="0.6" stroke-linecap="round"/>`).join('')}`;
}
S.cloud0 = { w: 130, h: 50, ax: 65, ay: 25, draw: I => cloud(I, [[24, 32, 16, 10], [46, 22, 18, 14], [72, 18, 21, 15], [96, 26, 17, 12], [112, 34, 13, 8], [66, 35, 44, 9]], 130, 50) };
S.cloud1 = { w: 130, h: 50, ax: 65, ay: 25, draw: I => cloud(I, [[16, 34, 12, 7], [36, 27, 16, 11], [60, 25, 15, 12], [82, 22, 18, 14], [106, 30, 16, 10], [62, 36, 50, 7]], 130, 50) };
S.cloud2 = { w: 130, h: 50, ax: 65, ay: 25, draw: I => cloud(I, [[40, 30, 14, 10], [58, 19, 16, 14], [78, 23, 15, 12], [94, 31, 12, 8], [66, 35, 32, 8]], 130, 50) };

function farIsland(I, sil, extras) {
  return `<defs>${lgu(I('f'), 0, 10, 0, 68, [[0, '#2c3c68'], [1, '#18223f']])}<clipPath id="${I('fc')}"><path d="${sil}"/></clipPath></defs>
    <path d="${sil}" fill="${U(I('f'))}"/>
    <g clip-path="url(#${I('fc')})"><path d="${sil}" transform="translate(-1.5 1.8)" fill="none" stroke="#5f73a8" stroke-width="2.2" opacity="0.55"/></g>
    <path d="${sil}" fill="none" stroke="#121a33" stroke-width="1.4" stroke-linejoin="round"/>${extras}`;
}
const tinyWin = (x, y) => `<circle cx="${x + 0.6}" cy="${y + 0.6}" r="2.6" fill="#ffc95a" opacity="0.25"/><rect x="${x}" y="${y}" width="1.3" height="1.4" fill="#ffd36a"/>`;
S.farA = {
  w: 220, h: 70, ax: 110, ay: 68,
  draw: I => farIsland(I, 'M4,68 C14,62 24,58 34,56 C44,48 54,40 66,38 C76,30 84,28 92,32 L98,26 L104,30 C116,30 126,36 134,42 C146,44 158,50 170,54 C184,56 200,62 216,68 Z',
    `<path d="M84,31 L84,24 L88,20 L92,24 L92,31 Z M96,29 L96,22 L100,19 L104,22 L104,29 Z M108,33 L108,27 L112,24 L116,27 L116,33 Z" fill="#18223f" stroke="#121a33" stroke-width="1"/>
     ${tinyWin(87.4, 25.4)}${tinyWin(99.4, 24)}${tinyWin(111.4, 28.4)}${tinyWin(70, 44)}${tinyWin(140, 48)}
     <path d="M150,46 C151,38 152,34 154,30" fill="none" stroke="#18223f" stroke-width="1.6"/><path d="M154,30 q-6,-1 -9,3 M154,30 q5,-2 9,1 M154,30 q-2,-4 -6,-5 M154,30 q3,-4 7,-4" fill="none" stroke="#18223f" stroke-width="1.6" stroke-linecap="round"/>`),
};
S.farB = {
  w: 220, h: 70, ax: 110, ay: 68,
  draw: I => farIsland(I, 'M6,68 C18,64 30,60 40,58 L48,46 L56,44 L62,34 L72,32 L78,40 C90,42 98,48 108,52 C120,50 128,44 138,46 L146,52 C160,54 170,58 180,60 C192,62 204,64 214,68 Z',
    `${halo(I('lh'), 67, 18, 18, '#ffe9a0', 1)}
     <path d="M30,18 L67,18" stroke="#ffe9a0" stroke-width="6" opacity="0.08" stroke-linecap="round"/><path d="M67,18 L110,12 L110,24 Z" fill="#ffe9a0" opacity="0.1"/>
     <path d="M64,33 L65,21 L69,21 L70,33 Z" fill="#c9cfe0" stroke="#121a33" stroke-width="0.9"/><rect x="64.6" y="25" width="4.8" height="2.2" fill="#c0505a"/><rect x="64.3" y="29.6" width="5.4" height="2.2" fill="#c0505a"/>
     <rect x="64.6" y="16.6" width="4.8" height="4.6" fill="#ffe9a0" stroke="#121a33" stroke-width="0.8"/><path d="M64,16.8 L67,13.8 L70,16.8 Z" fill="#c0505a" stroke="#121a33" stroke-width="0.8"/>
     ${tinyWin(120, 49)}${tinyWin(128, 47)}${tinyWin(90, 47)}`),
};

// ================================================================ sea floor decor (anchor = bottom centre)
// wavy ribbon blade growing from (x0, 68)
function ribbon(x0, h, w0, ph) {
  const L = [], R = [], C = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, y = 68 - h * t, cx = x0 + Math.sin(t * 5 + ph) * 3.6 * t + Math.sin(ph) * 0.5;
    const w = (t < 0.12 ? 0.6 + t / 0.12 * 0.5 : Math.pow(1 - t, 0.55)) * w0 + (i % 2 ? 0.35 : -0.2);
    L.push([f1(cx - w), f1(y)]); R.push([f1(cx + w), f1(y)]); C.push([f1(cx), f1(y)]);
  }
  return { d: 'M' + [...L, ...R.reverse()].map(p => p.join(',')).join(' L') + ' Z', c: 'M' + C.slice(1, 14).map(p => p.join(',')).join(' L'), hl: 'M' + L.slice(3, 12).map(([x, y]) => `${f1(x + 1)},${y}`).join(' L') };
}
function kelp(I, blades, stalk) {
  let out = `<defs>${lgu(I('k'), 0, 2, 0, 70, [[0, '#b6e07a'], [0.45, '#6aa84e'], [1, '#2f5f3a']])}${lgu(I('k2'), 0, 2, 0, 70, [[0, '#8fc066'], [0.5, '#4f8a46'], [1, '#24493a']])}</defs>`;
  blades.forEach(([x0, h, w0, ph], i) => {
    const r = ribbon(x0, h, w0, ph);
    out += `<path d="${r.d}" fill="${U(I(i ? 'k' : 'k2'))}" ${ol(1.4)}/><path d="${r.c}" fill="none" stroke="#2f5f3a" stroke-width="0.8" opacity="0.7"/><path d="${r.hl}" fill="none" stroke="#e6ffb0" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>`;
  });
  if (stalk) {
    const pts = []; for (let y = 68; y >= 6; y -= 4) pts.push([f1(11 + Math.sin((68 - y) / 10) * 3), y]);
    const leaves = pts.filter((p, i) => i > 1 && i % 2 === 0).map(([x, y], i) => { const sd = i % 2 ? 1 : -1; return { d: blade(x, y, x + sd * 7, y - 9, 2.6, sd * -1.6), x, y, sd, i }; });
    out += unite(leaves.map(l => l.d), U(I('k')), 1.2) + limb('M' + pts.map(p => p.join(',')).join(' L'), '#5a8a3e', 1.8, 1.1)
      + leaves.map(({ x, y, sd, i }) => `<path d="M${x},${y} L${f1(x + sd * 5)},${f1(y - 6.4)}" stroke="#2f5f3a" stroke-width="0.7" opacity="0.7"/>` + (i % 2 ? '' : `<ellipse cx="${f1(x + sd * 1.5)}" cy="${y - 1}" rx="1.9" ry="2.2" fill="#c9b04a" ${ol(1)}/><circle cx="${f1(x + sd * 1.5 - 0.6)}" cy="${y - 1.8}" r="0.6" fill="#fff6c0"/>`)).join('');
  }
  return out;
}
S.kelp0 = { w: 22, h: 70, ax: 11, ay: 68, draw: I => kelp(I, [[11, 64, 4.2, 0], [7, 44, 3.4, 2.2], [15, 34, 3, 4]]) };
S.kelp1 = { w: 22, h: 70, ax: 11, ay: 68, draw: I => kelp(I, [[15, 30, 2.8, 1]], true) };

const FLOOR = { hi: '#a9b4cc', c0: '#7d88a6', c1: '#4c5674', sh: '#3a4260' };
S.rockA = { w: 40, h: 24, ax: 20, ay: 22, draw: I => body(I, 'r', jag([[3, 22, 0], [4, 15], [10, 7], [19, 4], [28, 6], [35, 11], [37, 22]], 0.16), FLOOR, { cap: { k: 2.6, hi: '#9ad66a', base: '#5aa34c', ln: '#2f6e40' }, inner: `<path d="M19,5 L21,12 L18,18" fill="none" stroke="#3a4260" stroke-width="1.1"/><ellipse cx="28" cy="16" rx="1.6" ry="1" fill="#3a4260" opacity="0.6"/><path d="M10,9 L18,6 L16,12 Z" fill="#fff" opacity="0.15"/>`, w: 2, sh: [-5, -2] }) + barnacles([[30, 21.5, 0.7], [33, 21.5, 0.55]], PAL.coral) };
S.rockB = { w: 30, h: 20, ax: 15, ay: 18, draw: I => body(I, 'b', jag([[15, 18, 0], [16, 12], [20, 8], [25, 9], [28, 13], [28, 18]], 0.18), { ...FLOOR, c0: '#6f7a98' }, { w: 1.8, sh: [-4, -2] }) + body(I, 'a', jag([[2, 18, 0], [3, 11], [8, 5], [14, 5], [19, 10], [20, 18]], 0.16), FLOOR, { inner: `<path d="M12,6 L12,11" stroke="#3a4260" stroke-width="1"/>`, w: 1.8, sh: [-4, -2] }) };
S.shell = {
  w: 16, h: 12, ax: 8, ay: 11,
  draw: I => `<defs>${lgu(I('s'), 0, 2, 0, 11, [[0, '#ffe9f0'], [0.6, '#f6a6b8'], [1, '#c96a86']])}</defs>
    <path d="M8,10.5 L2.5,5.5 C3,2.6 5.4,1.4 8,1.4 C10.6,1.4 13,2.6 13.5,5.5 Z" fill="${U(I('s'))}" ${ol(1.2)}/>
    <path d="M8,10 L5,3 M8,10 L8,2 M8,10 L11,3 M8,10 L3.4,5.4 M8,10 L12.6,5.4" stroke="#c96a86" stroke-width="0.7"/>
    <path d="M6,10.6 L10,10.6 L9.4,8.8 L6.6,8.8 Z" fill="#e88aa2" ${ol(0.9)}/><path d="M4,4 Q5.5,2.4 7.5,2.2" fill="none" stroke="#fff" stroke-width="0.8"/>`,
};
S.starfish = {
  w: 16, h: 16, ax: 8, ay: 15,
  draw: I => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.6 : 6.6; pts.push([f1(8 + Math.cos(a) * r), f1(9.4 + Math.sin(a) * r * 0.86)]); }
    return `<defs>${rgu(I('s'), 7, 8, 7, [[0, '#ffc07a'], [0.6, '#ff8a4a'], [1, '#d9532f']])}</defs><ellipse cx="8" cy="14.6" rx="5.5" ry="0.9" fill="${OUT}" opacity="0.3"/>
      <path d="M${pts.map(p => p.join(',')).join(' L')} Z" fill="${U(I('s'))}" ${ol(1.2)}/>
      ${[0, 2, 4, 6, 8].map(i => `<circle cx="${f1(8 + (pts[i][0] - 8) * 0.5)}" cy="${f1(9.4 + (pts[i][1] - 9.4) * 0.5)}" r="0.6" fill="#fff3d0"/>`).join('')}<circle cx="8" cy="9.4" r="0.8" fill="#d9532f"/>`;
  },
};
S.chestFloor = {
  w: 34, h: 26, ax: 17, ay: 24,
  draw: I => `<defs>${lgu(I('w'), 0, 6, 0, 22, [[0, '#b0703c'], [1, '#6a3a20']])}${lgu(I('sd'), 0, 15, 0, 24, [[0, '#f0d898'], [1, '#b8955a']])}${lgu(I('g'), 0, 0, 0, 1, [[0, '#fff3b0'], [1, '#e8a830']])}</defs>
    ${halo(I('gl'), 17, 10, 13, '#ffd36a', 0.8)}
    <g transform="rotate(-8 17 16)">
      <path d="M6,10 L28,10 L28,22 L6,22 Z" fill="${U(I('w'))}" ${ol(1.6)}/>
      <path d="M6,15 H28" stroke="#4e2a16" stroke-width="0.9"/>
      <path d="M5,10 C5,3 29,3 29,10 L27.5,7.5 C26,5 8,5 6.5,7.5 Z" fill="#ffd36a" opacity="0.9"/>
      <path d="M5.5,9 C6,1.5 28,1.5 28.5,9 L28.5,10.5 L5.5,10.5 Z" fill="${U(I('w'))}" ${ol(1.5)}/>
      <path d="M10,10.5 V22 M24,10.5 V22 M10,3.2 V10.5 M24,3.2 V10.5" stroke="#e0a040" stroke-width="2"/>
      <path d="M10,10.5 V22 M24,10.5 V22" stroke="${OUT}" stroke-width="0.5" opacity="0.5"/>
      <rect x="15" y="9" width="4" height="5" rx="1" fill="#ffd36a" ${ol(1)}/><circle cx="17" cy="11.6" r="0.7" fill="${OUT}"/>
    </g>
    <path d="M1,24 C4,18 10,16.5 17,17 C24,16.5 30,18 33,24 Z" fill="${U(I('sd'))}" ${ol(1.6)}/>
    <path d="M6,20 Q12,17.6 18,18.4" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/>
    ${[[24, 19.6], [27.5, 21], [9, 21.2]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="1.1" fill="#ffd36a" ${ol(0.9)}/>`).join('')}
    ${[[7, 5, 1], [29, 8, 0.8], [20, 2.4, 0.7]].map(([x, y, s]) => `<path d="M${x},${f1(y - 2.2 * s)} L${f1(x + 0.6 * s)},${f1(y - 0.6 * s)} L${f1(x + 2.2 * s)},${y} L${f1(x + 0.6 * s)},${f1(y + 0.6 * s)} L${x},${f1(y + 2.2 * s)} L${f1(x - 0.6 * s)},${f1(y + 0.6 * s)} L${f1(x - 2.2 * s)},${y} L${f1(x - 0.6 * s)},${f1(y - 0.6 * s)} Z" fill="#fff6c0"/>`).join('')}`,
};
S.anchorFloor = {
  w: 30, h: 30, ax: 15, ay: 28,
  draw: I => {
    const rust = '#a65a3a';
    const iron = `<g transform="rotate(-38 15 16)">
        <path d="M15,6 V25" stroke="${OUT}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M8,9.5 H22" stroke="${OUT}" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M5,20 C6,27 12,28.6 15,28.6 C18,28.6 24,27 25,20" fill="none" stroke="${OUT}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M15,6 V25" stroke="${rust}" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M8,9.5 H22" stroke="#8a4a32" stroke-width="2" stroke-linecap="round"/>
        <path d="M5,20 C6,27 12,28.6 15,28.6 C18,28.6 24,27 25,20" fill="none" stroke="${rust}" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M2.4,22 L5,16.4 L8,21.6 Z M27.6,22 L25,16.4 L22,21.6 Z" fill="${rust}" ${ol(1.2)}/>
        <circle cx="15" cy="3.6" r="2.6" fill="none" stroke="${OUT}" stroke-width="3.4"/><circle cx="15" cy="3.6" r="2.6" fill="none" stroke="#8a4a32" stroke-width="1.4"/>
        <path d="M14.2,8 V22" stroke="#e0956a" stroke-width="0.9" opacity="0.7"/>
        <circle cx="15.6" cy="17" r="0.9" fill="#5a2e20"/><circle cx="9.4" cy="25.4" r="0.8" fill="#5a2e20"/><circle cx="20" cy="27.4" r="0.7" fill="#d98a3a"/>
      </g>`;
    return `<defs>${lgu(I('sd'), 0, 23, 0, 29, [[0, '#f0d898'], [1, '#b8955a']])}</defs><g transform="translate(1.5 -1.5) scale(0.9)">${iron}</g>
      <path d="M2,28.5 C6,24.5 12,23.6 17,24.4 C22,24 26,25.4 28.5,28.5 Z" fill="${U(I('sd'))}" ${ol(1.4)}/>`;
  },
};

// ================================================================ reefs
// shared per-biome dressing for reef rock: cap (moss/frost/ash/glow-moss), cracks, glow spots, depth shading
function reefRock(I, k, pts, b, o = {}) {
  const P = PAL[b];
  const R = o.pal || P.rock;
  const d = jag(pts, o.bulge ?? 0.12);
  let inner = '';
  inner += (o.facets || []).map(([fp, light]) => `<path d="${poly(fp)} Z" fill="${light ? R.hi : P.rock.dk}" opacity="${light ? 0.3 : 0.32}"/>`).join('');
  inner += (o.strata || []).map(y => `<path d="M-5,${y} Q22,${y - 3} 45,${y + 1} T95,${y - 1}" fill="none" stroke="${R.ln}" stroke-width="1.1" opacity="0.5"/><path d="M-5,${y + 1.6} Q22,${y - 1.4} 45,${y + 2.6} T95,${y + 0.6}" fill="none" stroke="${R.hi}" stroke-width="0.9" opacity="0.25"/>`).join('');
  inner += (o.cracks || []).map(c => `<path d="${poly(c)}" fill="none" stroke="${R.ln}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`).join('');
  if (P.glow) inner += (o.spots || []).map(([x, y, r = 1.3], i) => `<circle cx="${x}" cy="${y}" r="${f1(r * 2.8)}" fill="${P.glow}" opacity="0.2"/><circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? P.xtal[0] : P.spot}"/>`).join('');
  else inner += (o.spots || []).map(([x, y, r = 1.3]) => `<ellipse cx="${x}" cy="${y}" rx="${f1(r * 1.25)}" ry="${f1(r * 0.8)}" fill="${P.spot}" opacity="0.75"/><ellipse cx="${x - 0.3}" cy="${y - 0.5}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.3)}" fill="${R.hi}" opacity="0.35"/>`).join('');
  // glowing fissures: always on basalt, and wherever a tier asks for them (vents)
  const lav = (P.lava ? (o.lava || []) : []).concat(o.fis || []);
  inner += lav.map(([x, y, a, l, sd]) => crack(crackD(x, y, a, l, sd), P.hot, o.lw || 0.85)).join('');
  // depth: the submerged base darkens a little
  inner += `<rect x="-5" y="${o.deep || 70}" width="100" height="70" fill="url(#${I(k + 'dp')})"/>`;
  const defs = `<defs>${lgu(I(k + 'dp'), 0, o.deep || 70, 0, 130, [[0, '#0a1430', 0], [1, '#0a1430', 0.42]])}</defs>`;
  const cap = o.cap === false ? null : { k: o.capK || 4.4, ...P.moss };
  return defs + body(I, k, d, R, { cap, inner, over: o.over, w: o.w || 2.5, sh: o.sh || [-8, -3] });
}

// barnacle cluster: little domed cones with plates and dark mouths
function barnacles(list, P) {
  const B = P.barn;
  return list.map(([x, y, s = 1]) => {
    const w = 2.5 * s, h = 3.4 * s;
    return `<path d="M${f1(x - w)},${y} C${f1(x - w)},${f1(y - h * 0.75)} ${f1(x - w * 0.55)},${f1(y - h)} ${x},${f1(y - h)} C${f1(x + w * 0.55)},${f1(y - h)} ${f1(x + w)},${f1(y - h * 0.75)} ${f1(x + w)},${y} Z" fill="${B[0]}" ${ol(1)}/>
      <path d="M${f1(x + w * 0.15)},${f1(y - h + 0.3)} C${f1(x + w * 0.7)},${f1(y - h + 0.3)} ${f1(x + w - 0.4)},${f1(y - h * 0.6)} ${f1(x + w - 0.4)},${f1(y - 0.4)} L${f1(x + w * 0.25)},${f1(y - 0.4)} Z" fill="${B[1]}"/>
      <path d="M${f1(x - w * 0.45)},${f1(y - 0.3)} L${f1(x - w * 0.25)},${f1(y - h * 0.75)} M${f1(x + w * 0.4)},${f1(y - 0.3)} L${f1(x + w * 0.22)},${f1(y - h * 0.75)}" stroke="${B[2]}" stroke-width="0.6" opacity="0.7"/>
      <ellipse cx="${x}" cy="${f1(y - h + 0.6)}" rx="${f1(w * 0.42)}" ry="${f1(0.75 * s)}" fill="${OUT}"/>`;
  }).join('');
}

// sea moss hanging from an upper edge (drawn clipped inside the rock; top merges into the moss cap)
function mossDrape(list, M) {
  return list.map(([x, y, w, n = 3]) => {
    const x0 = x - w / 2;
    let top = `M${f1(x0)},${y - 4} L${f1(x0 + w)},${y - 4} L${f1(x0 + w)},${y}`, edge = `M${f1(x0 + w)},${y}`;
    for (let i = n; i > 0; i--) {
      const xa = x0 + (w / n) * i, xm = x0 + (w / n) * (i - 0.5), xb = x0 + (w / n) * (i - 1);
      const len = 3.5 + ((i * 7 + Math.round(x)) % 4) * 1.2;
      const seg = ` C${f1(xa - 0.3)},${f1(y + len * 0.6)} ${f1(xm + 0.9)},${f1(y + len)} ${f1(xm)},${f1(y + len)} C${f1(xm - 0.9)},${f1(y + len)} ${f1(xb + 0.3)},${f1(y + len * 0.6)} ${f1(xb)},${y}`;
      top += seg; edge += seg;
    }
    return `<path d="${top} Z" fill="${M.base}"/><path d="${edge}" fill="none" stroke="${M.ln}" stroke-width="1.1" stroke-linecap="round"/>`;
  }).join('');
}

// sharp branching coral rooted behind the rock: blades = [x0,y0,x1,y1,w,bend]
function coralBush(I, k, blades, P, y0 = 8, y1 = 70) {
  const id = I(k);
  return `<defs>${lgu(id, 0, y0, 0, y1, [[0, P.co[0]], [0.28, P.co[1]], [0.72, P.co[2]], [1, P.co[3]]])}</defs>`
    + unite(blades.map(b => blade(...b)), U(id), 1.6)
    + blades.map(b => bladeHi(...b, '#fff', 0.5)).join('')
    + blades.filter((b, i) => i % 2 === 0 && b[4] > 2).map(([x0, y0b, x1, y1b], i) => `<circle cx="${f1(x0 + (x1 - x0) * (0.4 + i % 3 * 0.1))}" cy="${f1(y0b + (y1b - y0b) * (0.4 + i % 3 * 0.1))}" r="0.75" fill="${P.co[3]}" opacity="0.55"/>`).join('');
}

// biome accents rooted behind rock edges: ice shards (escarcha), crystals (abismo), nothing otherwise
function edgeGrowth(b, list) {
  const P = PAL[b];
  if (b === 'escarcha') return list.map(([x, y, a, s]) => shards(x, y, a, s * 0.85, P.ice)).join('');
  if (b === 'abismo') return list.map(([x, y, a, s]) => shards(x, y, a, s, P.xtal, undefined, P.glow)).join('');
  return '';
}

// ---- tier 0: Rocas — a cluster of jagged spires with boulders at the foot
function reef0(b) {
  const P = PAL[b];
  return I => {
    const back = [[44, 128, 0], [46, 96], [50, 78], [56, 62], [61, 48], [65, 36], [70, 21], [75, 35], [78, 45], [82, 60], [85, 78], [87, 100], [88, 128]];
    const front = [[6, 128, 0], [7, 112], [10, 100], [8, 90], [13, 80], [11, 68], [16, 58], [13, 45], [21, 56], [25, 44], [30, 32], [33, 22], [38, 9], [42, 21], [45, 33], [48, 47], [53, 40], [58, 30], [61, 42], [64, 52], [69, 60], [67, 70], [75, 80], [79, 92], [77, 100], [83, 110], [84, 128]];
    const bl = [[2, 128, 0], [2, 119], [6, 111], [12, 107], [20, 108], [27, 112], [31, 119], [32, 128]];
    const br = [[60, 128, 0], [61, 120], [66, 114], [73, 112], [81, 114], [86, 119], [88, 128]];
    return edgeGrowth(b, [[72, 31, 24, 0.8], [12, 60, -42, 0.6]])
      + reefRock(I, 'b', back, b, { pal: P.back, capK: 3.4, cracks: [[[70, 40], [67, 52], [71, 62]], [[79, 62], [76, 76]]], facets: [[[[70, 21], [65, 36], [65, 54], [70, 40]], true]], lava: [[72, 50, 95, 22, 3]], spots: [[74, 56], [81, 74, 1]] })
      + reefRock(I, 'f', front, b, {
        cracks: [[[42, 22], [41, 34], [43, 46], [40, 58]], [[21, 57], [23, 68], [20, 80]], [[61, 43], [58, 56], [61, 68]], [[33, 80], [36, 92], [34, 104]], [[48, 48], [50, 60]]],
        strata: [86],
        facets: [[[[38, 9], [33, 22], [30, 32], [28, 50], [36, 40], [38, 24]], true], [[[38, 9], [42, 21], [45, 33], [46, 50], [41, 40]], false], [[[13, 45], [16, 58], [19, 54]], true], [[[58, 30], [61, 42], [64, 52], [60, 50], [58, 40]], false], [[[58, 30], [53, 40], [56, 46]], true]],
        lava: [[30, 58, 85, 30, 1], [55, 64, 95, 26, 2], [20, 84, 80, 16, 5]],
        spots: [[18, 76], [50, 66, 1.2], [26, 96], [70, 90, 1.1], [44, 102]],
        over: mossDrape([[25, 46, 6, 2], [48, 49, 5, 2], [12, 82, 5, 2], [69, 62, 6, 2], [33, 25, 4, 2]], P.moss),
      })
      + barnacles([[22, 92, 1], [27, 94, 0.8], [24, 97, 0.9], [57, 84, 1.1], [62, 86, 0.8], [48, 100, 0.9]], P)
      + reefRock(I, 'l', bl, b, { bulge: 0.2, capK: 3.4, deep: 100, spots: [[12, 118], [22, 120, 1]], cracks: [[[17, 108], [19, 116]]], facets: [[[[6, 111], [12, 107], [10, 118]], true]] })
      + reefRock(I, 'r', br, b, { bulge: 0.2, capK: 3.4, deep: 100, spots: [[78, 120]], cracks: [[[73, 113], [71, 121]]], facets: [[[[66, 114], [73, 112], [69, 120]], true]] })
      + barnacles([[16, 112, 0.8], [20, 113, 0.7], [76, 117, 0.8]], P);
  };
}

// ---- tier 1: Coral cortante — rock overgrown with blade-like branching coral
function reef1(b) {
  const P = PAL[b];
  return I => {
    const rock = [[2, 128, 0], [4, 110], [9, 99], [7, 88], [13, 76], [18, 64], [25, 57], [31, 46], [39, 41], [46, 46], [53, 40], [60, 48], [67, 54], [73, 64], [77, 76], [83, 89], [86, 106], [88, 128]];
    const big = [[44, 60, 41, 9, 5.5, -2], [42, 40, 25, 14, 3.4, -3], [43, 46, 17, 34, 3, -2], [42, 30, 54, 11, 2.8, 2], [44, 44, 64, 21, 3.3, 2.5], [45, 52, 70, 42, 2.6, 1.5], [33.5, 27, 31, 10, 2, -1], [29, 21, 18, 16, 1.6, -1], [54, 32, 61, 13, 2, 1.5], [30, 40, 23, 27, 1.7, -1], [58, 34, 68, 31, 1.4, 1]];
    const left = [[18, 74, 7, 40, 3.6, -2.5], [14, 60, 21, 40, 2.4, 1.5], [11, 52, 3, 46, 1.8, -1], [9, 46, 12, 32, 1.6, 1]];
    const right = [[67, 66, 79, 28, 3.8, 2], [71, 50, 63, 32, 2.4, -1.5], [75, 42, 86, 36, 2.1, 1.5], [77, 36, 82, 22, 1.7, 1]];
    const side = [[12, 100, 3, 82, 2.8, -1.5], [11, 94, 6, 75, 1.8, 1], [79, 102, 87, 84, 2.8, 1.5], [80, 96, 85, 78, 1.8, -1]];
    return edgeGrowth(b, [[58, 46, 22, 0.55]])
      + coralBush(I, 'cb', [...side, ...left, ...right, ...big], P, 8, 92)
      + reefRock(I, 'r', rock, b, {
        cracks: [[[46, 47], [44, 60], [47, 72]], [[25, 58], [27, 72], [24, 84]], [[60, 49], [57, 62], [61, 74]], [[38, 90], [41, 104]], [[68, 100], [64, 112]]],
        strata: [86],
        facets: [[[[39, 41], [31, 46], [28, 62], [37, 54]], true], [[[53, 40], [60, 48], [62, 62], [55, 54]], false], [[[18, 64], [13, 76], [17, 80]], true]],
        lava: [[32, 66, 88, 28, 4], [56, 72, 92, 26, 6]],
        spots: [[20, 82], [48, 66, 1.2], [70, 86], [30, 104, 1.1]],
        over: mossDrape([[33, 47, 6, 2], [62, 51, 6, 2], [18, 66, 5, 2]], P.moss),
      })
      + barnacles([[20, 102, 1], [25, 104, 0.8], [22, 107, 0.7], [62, 96, 1], [67, 98, 0.85]], P);
  };
}

// anemone: squat column rooted behind the rock, flared crown, two rows of tentacles with glowing tips
function anemone(I, k, hx, hy, base, s, P, n = 9) {
  const id = s2 => I(k + s2);
  const sw = 5.2 * s, ww = 3.8 * s, hw = 6.8 * s;
  const my = (hy + base) / 2;
  const stalk = `M${f1(hx - sw)},${base} C${f1(hx - sw)},${f1(my + 3)} ${f1(hx - ww)},${f1(my)} ${f1(hx - ww)},${f1(my - 2)} C${f1(hx - ww)},${f1(hy + 4)} ${f1(hx - hw - 1)},${f1(hy + 2)} ${f1(hx - hw)},${hy} L${f1(hx + hw)},${hy} C${f1(hx + hw + 1)},${f1(hy + 2)} ${f1(hx + ww)},${f1(hy + 4)} ${f1(hx + ww)},${f1(my - 2)} C${f1(hx + ww)},${f1(my)} ${f1(hx + sw)},${f1(my + 3)} ${f1(hx + sw)},${base} Z`;
  const row = (m, rad, len, ang0, ang1, ph) => {
    const out = [];
    for (let i = 0; i < m; i++) {
      const t = m === 1 ? 0.5 : i / (m - 1), a = (ang0 + t * (ang1 - ang0)) * Math.PI / 180;
      const L = len * s * (0.72 + 0.28 * Math.sin(t * Math.PI));
      const ca = Math.cos(a), sa = Math.sin(a);
      const x0 = hx + ca * rad * s, y0 = hy + sa * 1.2;
      const x1 = hx + ca * (rad * s + L), y1 = hy + sa * L * 0.95 - 1.5 * s;
      const wob = ((i + ph) % 2 ? 2.4 : -2.4) * s;
      const c1x = x0 + ca * L * 0.2 - sa * 0, c1y = y0 + sa * L * 0.55 - 1.5 * s;
      const c2x = x0 + ca * L * 0.65 + (-sa) * wob, c2y = y0 + sa * L * 0.8 + ca * wob;
      out.push({ d: `M${f1(x0)},${f1(y0)} C${f1(c1x)},${f1(c1y)} ${f1(c2x)},${f1(c2y)} ${f1(x1)},${f1(y1)}`, x1, y1 });
    }
    return out;
  };
  const backR = row(n - 1, 3, 15, -160, -20, 1), frontR = row(n, 5.5, 11.5, -175, -5, 0);
  const tube = (r, w, col) => r.map(t => `<path d="${t.d}" fill="none" stroke="${OUT}" stroke-width="${f1(w + 2.6)}" stroke-linecap="round"/>`).join('') + r.map(t => `<path d="${t.d}" fill="none" stroke="${col}" stroke-width="${f1(w)}" stroke-linecap="round"/><path d="${t.d}" fill="none" stroke="#fff" stroke-width="${f1(w * 0.3)}" stroke-linecap="round" opacity="0.3" stroke-dasharray="0 2 7 40"/>`).join('');
  const tips = r => r.map(({ x1, y1 }) => `<circle cx="${f1(x1)}" cy="${f1(y1)}" r="${f1(4 * s)}" fill="${P.tip}" opacity="0.3"/><circle cx="${f1(x1)}" cy="${f1(y1)}" r="${f1(1.55 * s)}" fill="${P.tip}" stroke="${OUT}" stroke-width="0.9"/><circle cx="${f1(x1 - 0.45 * s)}" cy="${f1(y1 - 0.5 * s)}" r="${f1(0.6 * s)}" fill="${P.tip2}"/>`).join('');
  return `<defs>${lgu(id('s'), hx - sw, 0, hx + sw, 0, [[0, P.an[0]], [0.45, P.an[1]], [1, P.an[2]]])}${lgu(id('t'), 0, hy - 17 * s, 0, hy + 1, [[0, P.tip2], [0.3, P.an[0]], [1, P.an[1]]])}${lgu(id('b'), 0, hy - 17 * s, 0, hy + 1, [[0, P.an[0]], [1, P.an[2]]])}
    ${rgu(id('h'), hx, hy - 7 * s, 22 * s, [[0, P.tip, 0.35], [0.6, P.tip, 0.12], [1, P.tip, 0]])}</defs>
    <circle cx="${hx}" cy="${f1(hy - 7 * s)}" r="${f1(22 * s)}" fill="${U(id('h'))}"/>
    ${tube(backR, 2.2 * s, U(id('b')))}${tips(backR)}
    <path d="${stalk}" fill="${OUT}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${stalk}" fill="${U(id('s'))}"/>
    <path d="M${f1(hx - sw * 0.5)},${base} C${f1(hx - sw * 0.5)},${f1(my + 3)} ${f1(hx - ww * 0.55)},${f1(my)} ${f1(hx - ww * 0.55)},${f1(my - 2)} C${f1(hx - ww * 0.55)},${f1(hy + 4)} ${f1(hx - hw * 0.7)},${f1(hy + 2.5)} ${f1(hx - hw * 0.7)},${f1(hy + 1.6)}" fill="none" stroke="#fff" stroke-width="${f1(1.1 * s)}" opacity="0.35" stroke-linecap="round"/>
    ${[0.35, 0.6, 0.85].map(f => `<path d="M${f1(hx - ww - (f > 0.6 ? 1 : 0))},${f1(hy + (base - hy) * f)} Q${hx},${f1(hy + (base - hy) * f + 1.6)} ${f1(hx + ww + (f > 0.6 ? 1 : 0))},${f1(hy + (base - hy) * f)}" fill="none" stroke="${P.an[2]}" stroke-width="0.8" opacity="0.55"/>`).join('')}
    <ellipse cx="${hx}" cy="${hy}" rx="${f1(hw)}" ry="${f1(2.3 * s)}" fill="${P.an[2]}" stroke="${OUT}" stroke-width="1.2"/>
    <ellipse cx="${hx}" cy="${f1(hy + 0.2)}" rx="${f1(hw * 0.5)}" ry="${f1(1.1 * s)}" fill="${P.tip}" opacity="0.85"/>
    ${tube(frontR, 2.5 * s, U(id('t')))}${tips(frontR)}`;
}
// tiny lightning spark
const spark = (x, y, s, col) => `<path d="M${x},${y} l${2 * s},${-3 * s} l${-1.2 * s},${-0.5 * s} l${2.4 * s},${-3.4 * s}" fill="none" stroke="${col}" stroke-width="${f1(2.6 * s)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/><path d="M${x},${y} l${2 * s},${-3 * s} l${-1.2 * s},${-0.5 * s} l${2.4 * s},${-3.4 * s}" fill="none" stroke="#fff" stroke-width="${f1(0.9 * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---- tier 2: Anémonas eléctricas — a rounded reef crowned with glowing anemones
function reef2(b) {
  const P = PAL[b];
  const heads = [[22, 47], [46, 31], [69, 48]];
  return {
    pts: { zap: heads },
    draw: I => {
      const rock = [[2, 128, 0], [3, 110], [6, 96], [11, 84], [17, 74], [26, 64], [36, 57], [47, 54], [58, 56], [67, 62], [75, 71], [81, 83], [85, 97], [87, 112], [88, 128]];
      return anemone(I, 'a1', heads[0][0], heads[0][1], 78, 0.82, P, 7)
        + anemone(I, 'a3', heads[2][0], heads[2][1], 78, 0.8, P, 7)
        + anemone(I, 'a2', heads[1][0], heads[1][1], 66, 1.05, P, 9)
        + reefRock(I, 'r', rock, b, {
          bulge: 0.22,
          cracks: [[[26, 65], [29, 76], [26, 86]], [[67, 63], [64, 74], [67, 84]], [[45, 88], [48, 100], [45, 112]]],
          strata: [96],
          facets: [[[[26, 64], [17, 74], [20, 86], [28, 76]], true], [[[36, 57], [26, 64], [34, 66]], true]],
          lava: [[18, 86, 85, 24, 8], [66, 88, 95, 24, 9]],
          spots: [[38, 68], [56, 72, 1.2], [26, 94, 1.1], [72, 96], [54, 106, 1.1], [14, 108, 1]],
          over: mossDrape([[45, 56, 8, 3], [74, 72, 6, 2], [18, 75, 6, 2]], P.moss),
        })
        + barnacles([[33, 102, 1], [38, 104, 0.8], [35, 107, 0.7], [62, 112, 1], [67, 113, 0.8]], P)
        + spark(30, 29, 0.9, P.tip) + spark(58, 17, 0.8, P.tip) + spark(78, 33, 0.7, P.tip);
    },
  };
}

// ---- tier 3: Almejas gigantes — broad reef with two flat shelves (clams are separate sprites at pts.clam)
function reef3(b) {
  const P = PAL[b];
  const clam = [[23, 40], [67, 62]];
  return {
    pts: { clam },
    draw: I => {
      const spire = [[30, 128, 0], [32, 80], [36, 56], [42, 38], [47, 23], [52, 10], [57, 22], [61, 34], [64, 50], [70, 70], [74, 128]];
      const front = [[2, 128, 0], [4, 108], [9, 92], [7, 76], [11, 62], [8, 52], [3, 46], [4, 40, 0.05], [42, 40, 0], [45, 44], [47, 52], [51, 58], [50, 62, 0.05], [86, 62, 0], [88, 66], [84, 74], [81, 84], [85, 98], [87, 112], [88, 128]];
      const shelfTop = (x0, x1, y) => `<path d="M${x0 + 1},${y + 1.6} L${x1 - 1},${y + 1.6}" stroke="${P.rock.hi}" stroke-width="1.2" opacity="0.45"/><path d="M${x0 + 3},${y + 5.5} Q${(x0 + x1) / 2},${y + 7.5} ${x1 - 3},${y + 5.5}" fill="none" stroke="${P.rock.dk}" stroke-width="1.6" opacity="0.5"/>`;
      return edgeGrowth(b, [[60, 32, 26, 0.7], [44, 30, -24, 0.6]])
        + coralBush(I, 'cb', [[40, 46, 31, 24, 2.4, -1.5], [38, 38, 30, 33, 1.4, -0.5], [62, 50, 71, 36, 2.2, 1.5], [64, 46, 70, 47, 1.2, 0.5]], P, 20, 60)
        + reefRock(I, 's', spire, b, { pal: P.back, capK: 3.4, cracks: [[[52, 12], [52, 26], [49, 36]], [[58, 40], [56, 52]]], facets: [[[[52, 10], [47, 23], [45, 38], [51, 26]], true]], lava: [[54, 28, 95, 20, 11]], spots: [[56, 30, 1.2], [48, 44]] })
        + reefRock(I, 'f', front, b, {
          bulge: 0.1, capK: 5,
          cracks: [[[45, 45], [43, 56], [46, 66]], [[11, 63], [16, 74], [13, 86]], [[60, 68], [57, 80], [61, 92]], [[30, 88], [33, 102], [30, 114]], [[72, 96], [69, 110]]],
          strata: [78, 100],
          facets: [[[[4, 40], [42, 40], [38, 47], [8, 47]], true], [[[50, 62], [86, 62], [82, 69], [53, 69]], true]],
          lava: [[22, 54, 85, 30, 12], [68, 74, 95, 26, 14]],
          spots: [[28, 62], [16, 98, 1.2], [56, 104], [76, 82, 1.1], [44, 80]],
          over: shelfTop(4, 42, 40) + shelfTop(50, 86, 62) + mossDrape([[11, 45, 8, 3], [31, 45, 6, 2], [62, 67, 8, 3], [80, 67, 6, 2]], P.moss),
        })
        + barnacles([[34, 72, 1], [39, 74, 0.8], [20, 110, 1], [25, 112, 0.8], [74, 106, 1]], P);
    },
  };
}

// hydrothermal chimney: knobbly mineral tube flaring into the rock, glowing mouth and veins
function chimney(I, k, x, top, base, w0, w1, P, seed) {
  const id = s => I(k + s);
  const C = P.crust, H = P.hot, r = rng(seed);
  const h = base - top, L = [], R = [];
  const N = 7;
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = top + 4 + t * (h - 4);
    const w = w1 + (w0 - w1) * Math.pow(t, 2.2);
    L.push([f1(x - w - (i % 2 ? 1.8 : -0.2) * (0.5 + r())), f1(y)]);
    R.push([f1(x + w + (i % 2 ? -0.2 : 1.8) * (0.5 + r())), f1(y + 0.8)]);
  }
  const lip = w1 + 2.4;
  let d = `M${R[N][0]},${base + 4}`;
  for (let i = N; i >= 1; i--) { const a = R[i], q = R[i - 1]; d += ` Q${f1(Math.max(a[0], q[0]) + 1.2)},${f1((a[1] + q[1]) / 2)} ${q[0]},${q[1]}`; }
  d += ` L${f1(x + lip - 0.6)},${top + 2.2} Q${f1(x + lip + 0.8)},${top + 0.5} ${f1(x + lip)},${top - 1.6} L${f1(x + lip * 0.5)},${top - 0.4} L${f1(x)},${top - 2.4} L${f1(x - lip * 0.5)},${top - 0.6} L${f1(x - lip)},${top - 1.8} Q${f1(x - lip - 0.8)},${top + 0.5} ${f1(x - lip + 0.6)},${top + 2.2} L${L[0][0]},${L[0][1]}`;
  for (let i = 0; i < N; i++) { const a = L[i], q = L[i + 1]; d += ` Q${f1(Math.min(a[0], q[0]) - 1.2)},${f1((a[1] + q[1]) / 2)} ${q[0]},${q[1]}`; }
  d += ` L${L[N][0]},${base + 4} Z`;
  const ring = f => { const y = top + h * f, w = w1 + (w0 - w1) * Math.pow(f, 2.2) + 2; return `<path d="M${f1(x - w)},${f1(y)} Q${x},${f1(y + 2.4)} ${f1(x + w)},${f1(y)}" fill="none" stroke="${C.sh}" stroke-width="1.3" opacity="0.75"/><path d="M${f1(x - w)},${f1(y + 1.4)} Q${x},${f1(y + 3.8)} ${f1(x + w)},${f1(y + 1.4)}" fill="none" stroke="${C.hi}" stroke-width="0.8" opacity="0.35"/>`; };
  const inner = `${ring(0.24)}${ring(0.5)}${ring(0.74)}
    ${[[-0.5, 0.14], [0.45, 0.36], [-0.65, 0.6], [0.35, 0.86], [0.6, 0.1]].map(([fx, fy]) => `<circle cx="${f1(x + fx * (w1 + 1))}" cy="${f1(top + h * fy)}" r="1" fill="${C.sh}"/><circle cx="${f1(x + fx * (w1 + 1) - 0.3)}" cy="${f1(top + h * fy - 0.4)}" r="0.4" fill="${H[1]}"/>`).join('')}
    ${crack(crackD(x - 0.5, top + 2.5, 92, h * 0.55, seed + 3), H, 0.7)}
    <ellipse cx="${x}" cy="${top + 2}" rx="${f1(lip + 2)}" ry="6" fill="${H[1]}" opacity="0.3"/>`;
  return body(I, k, d, C, { inner, rim: [1.6, 1.6], sh: [-4, -2], w: 2.2, g: [0, 0, 1, 0] })
    + `<defs>${rgu(id('m'), x, top - 0.8, lip, [[0, '#fff'], [0.25, H[0]], [0.6, H[1]], [1, H[2]]])}</defs>
    <ellipse cx="${x}" cy="${f1(top - 0.6)}" rx="${f1(lip - 1.3)}" ry="2.2" fill="${U(id('m'))}" stroke="${OUT}" stroke-width="1.3"/>`;
}
// soft rising steam puffs
const steam = (x, y, s, a = 0.5) => `<g opacity="${a}">
    <circle cx="${x}" cy="${f1(y - 1 * s)}" r="${f1(2.6 * s)}" fill="#e9eeff" opacity="0.55"/>
    <circle cx="${f1(x - 2 * s)}" cy="${f1(y - 5 * s)}" r="${f1(3.2 * s)}" fill="#e9eeff" opacity="0.45"/>
    <circle cx="${f1(x + 1.5 * s)}" cy="${f1(y - 9 * s)}" r="${f1(3.6 * s)}" fill="#ffffff" opacity="0.35"/>
    <circle cx="${f1(x - 1 * s)}" cy="${f1(y - 13 * s)}" r="${f1(3 * s)}" fill="#ffffff" opacity="0.25"/>
    <path d="M${f1(x - 3.5 * s)},${f1(y - 4 * s)} C${f1(x - 5 * s)},${f1(y - 8 * s)} ${f1(x - 1 * s)},${f1(y - 8 * s)} ${f1(x - 1 * s)},${f1(y - 11 * s)}" fill="none" stroke="#fff" stroke-width="${f1(0.9 * s)}" stroke-linecap="round" opacity="0.6"/></g>`;

// ---- tier 4: Géiser volcánico — mineral chimneys glowing with magma, steaming
function reef4(b) {
  const P = PAL[b];
  const vent = [[33, 12], [64, 34]];
  return {
    pts: { vent },
    draw: I => {
      const rock = [[2, 128, 0], [4, 110], [8, 98], [6, 86], [13, 76], [20, 69], [26, 61], [35, 65], [44, 60], [52, 66], [59, 62], [67, 69], [74, 71], [79, 84], [84, 96], [87, 112], [88, 128]];
      return halo(I('gh1'), 33, 13, 24, P.hot[1], 0.55) + halo(I('gh2'), 64, 35, 17, P.hot[1], 0.5)
        + chimney(I, 'c2', 64, 34, 76, 8.5, 4.8, P, 21)
        + chimney(I, 'c1', 33, 12, 72, 11, 5.4, P, 37)
        + edgeGrowth(b, [[12, 77, -32, 0.6], [77, 74, 34, 0.6]])
        + reefRock(I, 'r', rock, b, {
          cracks: [[[26, 62], [28, 74]], [[52, 67], [50, 80]], [[70, 74], [66, 88]]],
          strata: [94],
          facets: [[[[26, 61], [20, 69], [21, 82], [28, 74]], true], [[[59, 62], [67, 69], [65, 80], [60, 72]], false]],
          fis: [[30, 68, 115, 20, 41], [62, 73, 70, 16, 43], [44, 70, 95, 14, 47]],
          lw: 0.8,
          spots: [[24, 96, 1.2], [56, 100], [74, 104, 1.1], [12, 100, 1]],
          over: mossDrape([[44, 61, 6, 2], [74, 72, 6, 2], [20, 70, 5, 2]], P.moss),
        })
        + barnacles([[56, 106, 0.9], [61, 107, 0.7], [20, 112, 0.8]], P)
        + steam(33, 10, 0.5, 0.6) + steam(64, 30, 0.6, 0.55);
    },
  };
}

for (const b of BIOMES) {
  S['reef0_' + b] = { w: 90, h: 130, ax: 45, ay: 128, draw: reef0(b) };
  S['reef1_' + b] = { w: 90, h: 130, ax: 45, ay: 128, draw: reef1(b) };
  const r2 = reef2(b), r3 = reef3(b), r4 = reef4(b);
  S['reef2_' + b] = { w: 90, h: 130, ax: 45, ay: 128, draw: r2.draw, pts: r2.pts };
  S['reef3_' + b] = { w: 90, h: 130, ax: 45, ay: 128, draw: r3.draw, pts: r3.pts };
  S['reef4_' + b] = { w: 90, h: 130, ax: 45, ay: 128, draw: r4.draw, pts: r4.pts };
}

module.exports = { S, PAL };
