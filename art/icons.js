// UI icons (64x64, anchor at the centre): weapons, passives, evolutions, unions, moon abilities,
// workshop upgrades, reef tiers and misc HUD/menu symbols. Light comes from the top-left.
const { OUT, ol } = require('./lib');

const S = {};

// ---------------------------------------------------------------- helpers
const f2 = v => +v.toFixed(2);
const P = p => `${f2(p[0])},${f2(p[1])}`;
const rd = a => a * Math.PI / 180;
const stopsOf = st => st.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('');

// per-icon defs collector: every id goes through I() so icons never collide in the atlas
function Defs(I) {
  const list = [], seen = new Set();
  const add = (k, s) => { if (!seen.has(k)) { seen.add(k); list.push(s); } return `url(#${I(k)})`; };
  return {
    lin: (k, st, x2 = 0.35, y2 = 1, x1 = 0, y1 = 0) => add(k, `<linearGradient id="${I(k)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsOf(st)}</linearGradient>`),
    linU: (k, st, x1, y1, x2, y2) => add(k, `<linearGradient id="${I(k)}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsOf(st)}</linearGradient>`),
    rad: (k, st, cx = 0.35, cy = 0.3, r = 0.8) => add(k, `<radialGradient id="${I(k)}" cx="${cx}" cy="${cy}" r="${r}">${stopsOf(st)}</radialGradient>`),
    radU: (k, st, cx, cy, r, fx = cx, fy = cy) => add(k, `<radialGradient id="${I(k)}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${stopsOf(st)}</radialGradient>`),
    glow: (k, col, a = 0.85) => add(k, `<radialGradient id="${I(k)}" cx="0.5" cy="0.5" r="0.5">${stopsOf([[0, col, a], [0.4, col, a * 0.45], [1, col, 0]])}</radialGradient>`),
    clip: (k, inner) => add(k, `<clipPath id="${I(k)}">${inner.startsWith('<') ? inner : `<path d="${inner}"/>`}</clipPath>`),
    blur: (k, sd) => add(k, `<filter id="${I(k)}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`),
    out: () => `<defs>${list.join('')}</defs>`,
  };
}
const icon = fn => ({ w: 64, h: 64, ax: 32, ay: 32, draw: I => { const d = Defs(I); const body = fn(d, I); return d.out() + body; } });

// palettes (light -> dark)
const GOLD = [[0, '#fff6b8'], [0.38, '#ffd23c'], [0.75, '#f2a22a'], [1, '#c26a14']];
const GOLDR = [[0, '#c9761a'], [0.5, '#f4b02e'], [1, '#ffe27a']];
const SILVER = [[0, '#ffffff'], [0.4, '#d6deec'], [1, '#7c88a6']];
const ICE = [[0, '#f4feff'], [0.45, '#a6e8ff'], [1, '#3f9be0']];
const WATER = [[0, '#8eeeff'], [0.45, '#36b4ee'], [1, '#1c5cb4']];
const DEEP = [[0, '#3aa6e6'], [0.6, '#1a5aa8'], [1, '#13306e']];
const CORAL = [[0, '#ffc0a6'], [0.4, '#ff6f66'], [1, '#c02750']];
const MOON = [[0, '#fffdf0'], [0.55, '#fff0b0'], [1, '#eccb6c']];
const WOOD = [[0, '#d39456'], [0.5, '#a0602f'], [1, '#673a1d']];
const IRON = [[0, '#7c7a96'], [0.45, '#45435c'], [1, '#1f1d2c']];
const ROCK = [[0, '#b3adc8'], [0.5, '#77708f'], [1, '#463f5c']];
const FIRE = [[0, '#fff7b0'], [0.4, '#ffbe3c'], [1, '#ee4a2a']];
const PURPLE = [[0, '#f0d8ff'], [0.45, '#b07aff'], [1, '#5c2cb4']];
const RED = [[0, '#ff9a92'], [0.45, '#ee3d4e'], [1, '#a0162f']];
const GREEN = [[0, '#c8f79a'], [0.5, '#52c85c'], [1, '#1e8640']];
const SHARK = [[0, '#c7d6ea'], [0.5, '#8098bb'], [1, '#4a5a80']];
const PARCH = [[0, '#fff5d8'], [0.6, '#f1d9a0'], [1, '#cfa765']];
const MOSS = [[0, '#c4ee7a'], [0.5, '#6cbf48'], [1, '#2e7a3a']];

// white rim highlight stroke
const hl = (d, w = 2.2, o = 0.6) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
// arc along a circle (degrees, clockwise on screen)
const arcD = (cx, cy, r, a0, a1) => { const p0 = [cx + r * Math.cos(rd(a0)), cy + r * Math.sin(rd(a0))], p1 = [cx + r * Math.cos(rd(a1)), cy + r * Math.sin(rd(a1))]; return `M${P(p0)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${P(p1)}`; };
const hlArc = (cx, cy, r, a0 = 200, a1 = 255, w = 2.4, o = 0.65) => hl(arcD(cx, cy, r, a0, a1), w, o);
// 4-point sparkle
const spark = (x, y, s = 1, col = '#fff', o = 1) => `<path transform="translate(${f2(x)} ${f2(y)}) scale(${s})" d="M0,-5 C0.7,-1.4 1.4,-0.7 5,0 C1.4,0.7 0.7,1.4 0,5 C-0.7,1.4 -1.4,0.7 -5,0 C-1.4,-0.7 -0.7,-1.4 0,-5 Z" fill="${col}" opacity="${o}"/>`;
// outlined 4-point sparkle (gold accents that must read on any tile)
const sparkO = (x, y, s = 1, col = '#ffe27a') => `<path transform="translate(${f2(x)} ${f2(y)}) scale(${s})" d="M0,-5 C0.8,-1.5 1.5,-0.8 5,0 C1.5,0.8 0.8,1.5 0,5 C-0.8,1.5 -1.5,0.8 -5,0 C-1.5,-0.8 -0.8,-1.5 0,-5 Z" fill="${col}" stroke="${OUT}" stroke-width="${f2(1.3 / s)}" stroke-linejoin="round"/>`;

// polygon with rounded corners (r = corner radius in units, scalar or per-vertex array)
function roundPoly(pts, r = 2) {
  const n = pts.length; let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], rr = Array.isArray(r) ? r[i] : r;
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const fa = Math.min(rr / la, 0.5), fb = Math.min(rr / lb, 0.5);
    const p1 = [p[0] + (a[0] - p[0]) * fa, p[1] + (a[1] - p[1]) * fa], p2 = [p[0] + (b[0] - p[0]) * fb, p[1] + (b[1] - p[1]) * fb];
    d += `${i ? 'L' : 'M'}${P(p1)} Q${P(p)} ${P(p2)} `;
  }
  return d + 'Z';
}
const starPts = (cx, cy, R, r, n = 5, rot = -90) => Array.from({ length: n * 2 }, (_, i) => { const a = rd(rot + i * 180 / n), rr = i % 2 ? r : R; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; });
const polyD = pts => 'M' + pts.map(P).join(' L') + ' Z';

// tapered curved stroke as a filled path: quadratic P0 -> C -> P1, width w0 -> w1
function tube(x0, y0, cx, cy, x1, y1, w0, w1, n = 14) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    const x = m * m * x0 + 2 * m * t * cx + t * t * x1, y = m * m * y0 + 2 * m * t * cy + t * t * y1;
    let dx = 2 * m * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * m * (cy - y0) + 2 * t * (y1 - cy);
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push([x - dy * w, y + dx * w]); R.push([x + dy * w, y - dx * w]);
  }
  return polyD([...L, ...R.reverse()]);
}
// crescent: circle (cx,cy,R) minus circle offset by (ox,oy) with radius R2
function crescentD(cx, cy, R, ox, oy, R2) {
  const d = Math.hypot(ox, oy), a = (R * R - R2 * R2 + d * d) / (2 * d), h = Math.sqrt(Math.max(R * R - a * a, 0));
  const ux = ox / d, uy = oy / d, px = cx + a * ux, py = cy + a * uy;
  const p1 = [px - uy * h, py + ux * h], p2 = [px + uy * h, py - ux * h];
  return `M${P(p1)} A${R},${R} 0 ${a > 0 ? 1 : 0} 1 ${P(p2)} A${R2},${R2} 0 ${d - a < 0 ? 1 : 0} 0 ${P(p1)} Z`;
}
// tapered spiral arm (for whirlpools); sy squashes y for perspective
function spiralArm(cx, cy, r0, r1, rot, turns, wMax, sy = 1, n = 40) {
  const A = [], B = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = rd(rot) + t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t;
    const w = wMax * Math.pow(Math.sin(Math.PI * Math.min(t * 1.05, 1)), 0.8) / 2;
    A.push([cx + (r + w) * Math.cos(a), cy + sy * (r + w) * Math.sin(a)]);
    B.push([cx + (r - w) * Math.cos(a), cy + sy * (r - w) * Math.sin(a)]);
  }
  return polyD([...A, ...B.reverse()]);
}
// several shapes sharing one silhouette outline: outline pass underneath, fill pass on top
// items: path d / element strings (take `fill`), or [d, fill] pairs with their own fill
const el = d => d.startsWith('<') ? d : `<path d="${d}"/>`;
const uni = (ds, fill, w = 2.6) => `<g fill="${OUT}" stroke="${OUT}" stroke-width="${w * 2}" stroke-linejoin="round" stroke-linecap="round">${ds.map(x => el(Array.isArray(x) ? x[0] : x)).join('')}</g>${ds.map(x => Array.isArray(x) ? `<g fill="${x[1]}">${el(x[0])}</g>` : `<g fill="${fill}">${el(x)}</g>`).join('')}`;
// fat outlined stroke (tube with an outline)
const fat = (d, col, w, o = 1.5, cap = 'round') => `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + o * 2}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;

// ---- reusable pieces
// full moon disc with craters
function moonDisc(d, cx, cy, r, pal = MOON, crater = '#e9c86e', k = 'moon') {
  const g = d.rad(k, pal, 0.36, 0.3, 0.78);
  const c = (x, y, s) => `<ellipse cx="${f2(cx + x * r)}" cy="${f2(cy + y * r)}" rx="${f2(s * r)}" ry="${f2(s * r * 0.85)}" fill="${crater}" opacity="0.75"/><path d="${arcD(cx + x * r, cy + y * r, s * r * 0.85, 20, 120)}" stroke="#fff" stroke-width="${f2(Math.max(0.8, r * 0.04))}" fill="none" opacity="0.55"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}" ${ol(3)}/>
    ${c(0.28, -0.22, 0.2)}${c(-0.3, 0.3, 0.16)}${c(0.18, 0.42, 0.11)}${c(-0.05, -0.05, 0.08)}
    ${hlArc(cx, cy, r - 3.2, 195, 250, 2.6, 0.75)}`;
}
// front-facing gold coin with a crescent emblem
function coinFace(d, cx, cy, r, w = 2.6) {
  const g = d.lin('cg', GOLD, 0.35, 1), g2 = d.lin('cgr', GOLDR, 0.35, 1);
  const ri = r * 0.72;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}" stroke="${OUT}" stroke-width="${w}"/>
    <circle cx="${cx}" cy="${cy}" r="${f2(ri)}" fill="${g2}" stroke="#b5620f" stroke-width="${f2(Math.max(1, r * 0.08))}"/>
    <path d="${crescentD(cx - r * 0.06, cy, ri * 0.66, r * 0.26, -r * 0.16, ri * 0.56)}" fill="#fff2a8" stroke="#b5620f" stroke-width="${f2(Math.max(0.8, r * 0.06))}" stroke-linejoin="round"/>
    ${hlArc(cx, cy, r - w * 0.9, 200, 255, Math.max(1, r * 0.13), 0.8)}`;
}
// tilted coin (seen from above at an angle) for piles and stacks
function coinTilt(d, cx, cy, rx, ry, th = 3, w = 2) {
  const g = d.lin('ctg', GOLD, 0.4, 1), side = d.lin('cts', [[0, '#e8961e'], [1, '#a5560e']], 0, 1);
  return `<path d="M${cx - rx},${cy} L${cx - rx},${cy + th} A${rx},${ry} 0 0 0 ${cx + rx},${cy + th} L${cx + rx},${cy} Z" fill="${side}" stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${g}" stroke="${OUT}" stroke-width="${w}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${f2(rx * 0.66)}" ry="${f2(ry * 0.62)}" fill="none" stroke="#c27414" stroke-width="${f2(Math.max(0.8, rx * 0.09))}" opacity="0.8"/>`;
}
// water band along the bottom with a wavy top
function sea(d, y = 48, x0 = 4.5, x1 = 59.5, k = 'sea', amp = 2.4) {
  const g = d.lin(k, [[0, '#4fc8f2'], [0.5, '#2a86d0'], [1, '#1c4e9c']], 0, 1);
  const n = 4, wl = (x1 - x0) / n;
  let top = `M${x0},${y}`;
  for (let i = 0; i < n; i++) top += ` q${f2(wl / 4)},${-amp} ${f2(wl / 2)},0 q${f2(wl / 4)},${amp} ${f2(wl / 2)},0`;
  const body = `${top} L${x1},57.5 Q${x1},59.5 ${x1 - 2},59.5 L${x0 + 2},59.5 Q${x0},59.5 ${x0},57.5 Z`;
  let hlp = `M${x0 + 2.5},${y + 1.6}`;
  for (let i = 0; i < n - 1; i++) hlp += ` q${f2(wl / 4)},${-amp} ${f2(wl / 2)},0 q${f2(wl / 4)},${amp} ${f2(wl / 2)},0`;
  return `<path d="${body}" fill="${g}" ${ol(2.6)}/>${hl(hlp, 1.6, 0.7)}`;
}
// lightning bolt polygon
const boltD = (pts) => polyD(pts);

// ================================================================= WEAPONS
S.i_rayo = icon((d) => {
  const beam = 'M29.8,24.2 L57,46 A7.2,7.2 0 0 1 46.2,56.2 L23.2,30.8 Z';
  return `<circle cx="24" cy="24" r="22" fill="${d.glow('gl', '#fff2a0', 0.7)}"/>
    <path d="${beam}" fill="${d.linU('bm', [[0, '#fffbe0'], [0.5, '#fff08a'], [1, '#ffc43c']], 25, 26, 55, 56)}" ${ol(2.6)}/>
    <path d="M27.5,27.5 L50.5,50.5" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity="0.95"/>
    <path d="${crescentD(23, 23, 19, 9, 8, 16)}" fill="${d.rad('mn', MOON, 0.3, 0.25, 0.85)}" ${ol(3)}/>
    <circle cx="12" cy="22" r="2.6" fill="#e9c86e" opacity="0.8"/><circle cx="17" cy="11" r="1.8" fill="#e9c86e" opacity="0.8"/><circle cx="13" cy="31" r="1.6" fill="#e9c86e" opacity="0.8"/>
    ${hl(arcD(23, 23, 15.8, 150, 245), 2.6, 0.8)}
    ${spark(51, 51, 1.5, '#fff')}${spark(46, 12, 1.1)}${spark(12, 50, 0.9)}${spark(56, 28, 0.6)}`;
});

S.i_remolino = icon((d) => {
  const cx = 32, cy = 33, rx = 27, ry = 21.5, sy = ry / rx;
  const arms = [0, 120, 240].map(r => spiralArm(cx, cy, 3, 24, r, 0.95, 7.5, sy));
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${d.radU('w', [[0, '#0b1c4a'], [0.35, '#1a4f9c'], [0.8, '#2f8fd8'], [1, '#56c4f0']], cx, cy, 28)}" ${ol(3)}/>
    ${arms.map(a => `<path d="${a}" fill="${d.linU('a', [[0, '#e8fdff'], [0.5, '#8de6ff'], [1, '#3fb0ea']], 8, 12, 56, 56)}" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/>`).join('')}
    <ellipse cx="${cx}" cy="${cy}" rx="5" ry="${f2(5 * sy)}" fill="#08122e" stroke="${OUT}" stroke-width="1.4"/>
    ${hl(arcD(cx, cy, 25.2, 195, 250).replace(/A25.2,25.2/, `A25.2,${f2(25.2 * sy)}`), 2.2, 0.0)}
    <path d="M7,27 C9,20 15,15 22,13" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0.75"/>
    <circle cx="57" cy="16" r="2" fill="#dff8ff" ${ol(1.2)}/><circle cx="8" cy="50" r="1.6" fill="#dff8ff" ${ol(1.1)}/><circle cx="53" cy="54" r="1.3" fill="#dff8ff" ${ol(1)}/>
    ${spark(11, 11, 0.9)}`;
});

S.i_coral = icon((d) => {
  const br = [
    tube(32, 55, 31, 48, 32, 40, 11, 7.5),
    tube(31, 47, 20, 40, 13, 21, 7, 0.6),
    tube(33, 45, 46, 37, 52, 17, 7, 0.6),
    tube(32, 42, 30, 25, 34, 6, 6.5, 0.6),
    tube(20, 36, 12, 37, 6, 33, 4.6, 0.5),
    tube(16, 28, 21, 21, 22, 13, 4, 0.5),
    tube(45, 34, 53, 36, 58, 40, 4.6, 0.5),
    tube(49, 26, 44, 20, 43, 12, 4, 0.5),
    tube(32, 30, 39, 26, 42, 22, 3.6, 0.5),
  ];
  const g = d.linU('c', [[0, '#ffd0bc'], [0.35, '#ff7f72'], [0.75, '#e23c5c'], [1, '#a81e48']], 14, 6, 44, 60);
  return `<path d="M14,59.5 C12,54.5 17,51 24,51 C28,48 37,48 41,51 C48,51 53,54.5 50,59.5 Z" fill="${d.lin('r', ROCK)}" ${ol(2.6)}/>
    ${uni(br, g, 2.5)}
    ${hl('M13.5,22.5 C16,30 20,36 27,44', 1.6, 0.55)}${hl('M33,9 C31,18 31,26 31,34', 1.5, 0.5)}
    ${[[24, 40], [40, 38], [30, 52], [35, 47], [15, 30], [47, 28], [28, 47]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.25" fill="#a81e48" opacity="0.7"/>`).join('')}
    ${hl('M17,53 C21,51.5 25,51.5 28,52', 1.4, 0.45)}
    ${spark(54, 8, 0.9)}${spark(8, 12, 0.7)}`;
});

S.i_tiburon = icon((d) => {
  const body = 'M5,59 C3,40 10,19 31,12 C45,8 57,15 61,24 C62.5,28 61,31 57,31.4 L31,35.6 L53,42 C57,43.2 56.8,47.4 53.6,49.2 C45,55 33,58.6 21,59.4 Z';
  const mouth = 'M59,30 L29,35.6 L54.5,44.5 C58,41 60,35 59,30 Z';
  const g = d.lin('s', SHARK, 0.3, 1);
  return `<path d="M15,23 C13,15 11,9 6,4 C15,6 23,11 28,15 Z" fill="${d.lin('fn', SHARK, 0.6, 1)}" ${ol(2.6)}/>
    <path d="${mouth}" fill="#8a1b34" ${ol(2.4)}/>
    <path d="M34,36.5 C42,38.5 49,41 54,43.5 L56,39 C49,37.5 41,36 34,36.5 Z" fill="#e8577a" opacity="0.9"/>
    <path d="${body}" fill="${g}"/>
    <g clip-path="${d.clip('bc', body)}"><path d="M0,64 L0,51 C10,47 21,41 31,36.2 L58,44 L62,64 Z" fill="${d.lin('bl', [[0, '#ffffff'], [1, '#c9d4e6']], 0, 1)}"/></g>
    <path d="${body}" fill="none" ${ol(3)}/>
    ${[[54.5, 31], [49, 32], [43.5, 33], [38, 34]].map(([x, y]) => `<path d="M${x - 2.4},${y + 0.3} L${x},${y + 5} L${x + 2.4},${y - 0.5} Z" fill="#fff" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>`).join('')}
    ${[[51.5, 42.6], [46, 40.6], [40.5, 39]].map(([x, y]) => `<path d="M${x - 2.3},${y - 0.5} L${x},${y - 5} L${x + 2.3},${y + 0.6} Z" fill="#fff" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>`).join('')}
    <circle cx="42" cy="21" r="3.6" fill="#fff" ${ol(1.4)}/><circle cx="43" cy="21.6" r="2" fill="${OUT}"/><circle cx="42.3" cy="20.6" r="0.7" fill="#fff"/>
    <path d="M36.5,15.6 L47.5,18.8" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M20,26 C18,30 18,35 20,39 M24.5,25 C22.5,29 22.5,34 24.5,38 M29,25 C27,29 27,33 29,36" stroke="#3e4c6e" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    ${hl('M10,38 C11,27 17,19 27,15', 2.2, 0.55)}
    <path d="M4.5,59.5 C5,55 8,52.5 11.5,55 C13.5,51.5 19,50.5 21,55 C23,52 28,53 28,57 C28.6,58.6 28,59.5 26,59.5 Z" fill="${d.lin('wv', WATER, 0.2, 1)}" ${ol(2.2)}/>
    <path d="M6,57 C8,55 10,55.5 11.5,57.5 M15,56 C17,53.5 19,54 20.5,56" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.8"/>
    <circle cx="33" cy="53" r="1.6" fill="#bff0ff" ${ol(1)}/><circle cx="30" cy="48" r="1.1" fill="#bff0ff" ${ol(0.9)}/>`;
});

S.i_escarcha = icon((d) => {
  const cx = 32, cy = 32, segs = [];
  for (let k = 0; k < 6; k++) {
    const a = rd(-90 + k * 60), ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    const pt = (r, s = 0) => [cx + ux * r + px * s, cy + uy * r + py * s];
    segs.push(`M${P(pt(0))} L${P(pt(21))}`);
    for (const [r, l] of [[10, 7], [16.5, 5.2]]) segs.push(`M${P(pt(r))} L${P(pt(r + l * 0.75, l * 0.78))} M${P(pt(r))} L${P(pt(r + l * 0.75, -l * 0.78))}`);
  }
  const tips = Array.from({ length: 6 }, (_, k) => { const a = rd(-90 + k * 60), x = cx + Math.cos(a) * 23, y = cy + Math.sin(a) * 23; return `<path transform="translate(${f2(x)} ${f2(y)}) rotate(${k * 60})" d="M0,-4.4 L2.8,0 L0,4 L-2.8,0 Z"/>`; });
  const g = d.linU('i', [[0, '#ffffff'], [0.45, '#aeeaff'], [1, '#4aa0e6']], 10, 8, 54, 58);
  const hexD = polyD(Array.from({ length: 6 }, (_, k) => [cx + 7.2 * Math.cos(rd(-90 + k * 60)), cy + 7.2 * Math.sin(rd(-90 + k * 60))]));
  return `<circle cx="32" cy="32" r="28" fill="${d.glow('gl', '#bff2ff', 0.35)}"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${segs.join(' ')}" stroke="${OUT}" stroke-width="8"/>
      <g fill="${OUT}" stroke="${OUT}" stroke-width="3">${tips.join('')}</g>
      <path d="${segs.join(' ')}" stroke="${g}" stroke-width="4.6"/>
    </g>
    <g fill="${g}">${tips.join('')}</g>
    <path d="${hexD}" fill="${d.lin('h', ICE, 0.4, 1)}" ${ol(2.2)}/>
    <path d="M${cx},${cy - 7.2} L${cx},${cy} L${f2(cx - 6.2)},${cy - 3.6} Z" fill="#fff" opacity="0.75"/>
    <path d="M${cx},${cy} L${f2(cx + 6.2)},${cy + 3.6} L${cx},${cy + 7.2} Z" fill="#3f8fd6" opacity="0.45"/>
    ${spark(52, 12, 1.1)}${spark(12, 52, 0.8)}`;
});

S.i_faro = icon((d) => {
  const tower = 'M22.5,53 L26.6,24 L37.4,24 L41.5,53 Z';
  return `<path d="M36,15.5 L61,5 L61,28 L36,18.5 Z" fill="${d.linU('b1', [[0, '#fff6b0', 0.95], [1, '#ffe27a', 0.1]], 36, 16, 61, 16)}"/>
    <path d="M28,15.5 L3,8 L3,24 L28,18.5 Z" fill="${d.linU('b2', [[0, '#fff6b0', 0.85], [1, '#ffe27a', 0.05]], 28, 16, 3, 16)}"/>
    <circle cx="32" cy="17" r="12" fill="${d.glow('gl', '#fff2a0', 0.8)}"/>
    <path d="${tower}" fill="${d.lin('t', [[0, '#ffffff'], [0.6, '#e6e2f0'], [1, '#a9a2c2']], 1, 0.2)}"/>
    <g clip-path="${d.clip('tc', tower)}">
      <rect x="20" y="29" width="24" height="6.5" fill="${d.lin('rs', RED, 1, 0.3)}"/><rect x="20" y="41.5" width="24" height="6.5" fill="${d.lin('rs', RED, 1, 0.3)}"/>
      <path d="M36,24 L40,53 L44,53 L44,24 Z" fill="#000" opacity="0.15"/>
    </g>
    <path d="${tower}" fill="none" ${ol(2.8)}/>
    <rect x="29.5" y="34.5" width="5" height="5.5" rx="2.5" fill="#3a3152" ${ol(1.3)}/>
    ${hl('M26.6,27 L24.6,48', 1.6, 0.7)}
    <rect x="26.5" y="12.2" width="11" height="10" rx="1" fill="${d.rad('lp', [[0, '#ffffff'], [0.5, '#fff3a0'], [1, '#ffb52e']], 0.5, 0.5, 0.7)}" ${ol(2.2)}/>
    <path d="M32,12.5 L32,22" stroke="${OUT}" stroke-width="1.3"/>
    <rect x="23.5" y="21.6" width="17" height="3.6" rx="1.2" fill="#3a3152" ${ol(2)}/>
    <path d="M25,12.8 C25.5,6.4 38.5,6.4 39,12.8 Z" fill="${d.lin('rf', RED, 0.6, 1)}" ${ol(2.2)}/>
    <circle cx="32" cy="5.6" r="1.9" fill="#ffd23c" ${ol(1.3)}/>
    <path d="M12,59.5 C11,54.5 15,51 21,51 L43,51 C49,51 53,54.5 52,59.5 Z" fill="${d.lin('rk', ROCK)}" ${ol(2.6)}/>
    ${hl('M16,55 C17,53.5 19,53 21,53', 1.4, 0.5)}
    <path d="M5,57.6 C7.5,55.2 10,55.2 12.5,57.6 M51.5,57.6 C54,55.2 56.5,55.2 59,57.6" stroke="#7fdcff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
});

S.i_canon = icon((d) => {
  const bar = 'M-15,-8.5 C-19,-8.5 -21,-4 -21,0 C-21,4 -19,8.5 -15,8.5 L14,6.6 L14,-6.6 Z';
  return `<g transform="translate(50 20.5) scale(0.9)">
      <path d="${roundPoly(starPts(0, 0, 11, 5.2, 9, -20), 1.2)}" fill="${d.lin('fl', FIRE, 0.3, 1)}" ${ol(2.4)}/>
      <path d="${roundPoly(starPts(0, 0, 5.6, 2.8, 7, 0), 0.8)}" fill="#fffbe0"/>
    </g>
    <circle cx="14" cy="11" r="5" fill="#d8d4e8" ${ol(2)}/><circle cx="9" cy="16" r="3.4" fill="#d8d4e8" ${ol(1.8)}/><circle cx="20" cy="7" r="3" fill="#d8d4e8" ${ol(1.6)}/>
    ${hl(arcD(14, 11, 3.2, 200, 260), 1.3, 0.8)}
    <g transform="translate(27.5 35.5) rotate(-35) scale(1.1)">
      <path d="${bar}" fill="${d.lin('ir', [[0, '#b4b2d0'], [0.45, '#68668a'], [1, '#2c2a3e']], 0.15, 1)}" ${ol(2.8)}/>
      <rect x="-9" y="-9.2" width="4.4" height="18.4" rx="1.6" fill="${d.lin('gb', GOLD, 0.2, 1)}" ${ol(1.6)}/>
      <rect x="4" y="-7.8" width="3.6" height="15.6" rx="1.4" fill="${d.lin('gb', GOLD, 0.2, 1)}" ${ol(1.6)}/>
      <rect x="13" y="-8.6" width="6" height="17.2" rx="2" fill="${d.lin('ir2', IRON, 0.2, 1)}" ${ol(2.2)}/>
      <ellipse cx="19.2" cy="0" rx="2" ry="5.2" fill="#14101e"/>
      ${hl('M-14,-5.6 L12,-4.4', 1.8, 0.45)}
      <circle cx="-22.4" cy="0" r="2.6" fill="#45435c" ${ol(1.6)}/>
    </g>
    <path d="M10,47 L19,38 L36,43 L40,51 L16,55 Z" fill="${d.lin('wd', WOOD)}" ${ol(2.6)}/>
    <circle cx="25" cy="51" r="9" fill="${d.lin('wh', WOOD, 0.3, 1)}" ${ol(2.8)}/>
    <circle cx="25" cy="51" r="5.6" fill="none" stroke="#5a3218" stroke-width="1.3"/>
    <path d="M25,43.4 L25,58.6 M17.4,51 L32.6,51 M19.6,45.6 L30.4,56.4 M30.4,45.6 L19.6,56.4" stroke="#5a3218" stroke-width="1.6"/>
    <circle cx="25" cy="51" r="2.6" fill="${d.lin('gb', GOLD, 0.2, 1)}" ${ol(1.4)}/>
    ${hl(arcD(25, 51, 7.2, 195, 255), 1.6, 0.6)}
    <circle cx="57" cy="7" r="1.4" fill="#ffd23c"/><circle cx="60" cy="16" r="1" fill="#ffd23c"/>`;
});

S.i_tormenta = icon((d) => {
  const cloud = ['<circle cx="20" cy="27" r="11"/>', '<circle cx="33" cy="20" r="13"/>', '<circle cx="46" cy="27" r="10.5"/>', '<rect x="9" y="26" width="47" height="13" rx="6.5"/>'];
  const bolt = boltD([[37, 30], [25, 45], [32, 45.5], [25, 59], [44, 40], [36.5, 40], [43, 30]]);
  return `${[[13, 44], [19, 50], [49, 44], [54, 50]].map(([x, y]) => `<path d="M${x},${y} l-2.4,5" stroke="${OUT}" stroke-width="4.6" stroke-linecap="round"/><path d="M${x},${y} l-2.4,5" stroke="#8fdcff" stroke-width="2.2" stroke-linecap="round"/>`).join('')}
    ${uni(cloud, d.linU('cl', [[0, '#c9c4e6'], [0.55, '#7b74a8'], [1, '#433c6a']], 20, 8, 34, 40), 2.7)}
    ${hl(arcD(33, 19, 10.6, 195, 265), 2.4, 0.7)}${hl(arcD(20, 27, 8, 190, 240), 2, 0.55)}
    <path d="M14,36 C24,38.5 42,38.5 52,36" stroke="#3a3260" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="${bolt}" fill="${d.lin('bt', [[0, '#fffbd0'], [0.45, '#ffe04a'], [1, '#f39a1e']], 0.3, 1)}" ${ol(2.6)}/>
    ${hl('M37.5,32 L30,43', 1.4, 0.8)}
    ${spark(54, 11, 0.9, '#fff3a0')}`;
});

// ================================================================= PASSIVES
S.i_espejo = icon((d) => {
  const frame = 'M0,-27 C9,-27 15.5,-19 15.5,-9 C15.5,1 9,8.5 0,8.5 C-9,8.5 -15.5,1 -15.5,-9 C-15.5,-19 -9,-27 0,-27 Z';
  const glass = 'M0,-22.5 C6.5,-22.5 11,-16.5 11,-9 C11,-1.5 6.5,4 0,4 C-6.5,4 -11,-1.5 -11,-9 C-11,-16.5 -6.5,-22.5 0,-22.5 Z';
  const sv = d.lin('sv', SILVER, 0.5, 1);
  return `<g transform="translate(33.5 31) rotate(35) scale(1.08)">
      <path d="M-3.2,7 L-3.6,22 C-3.6,24 3.6,24 3.6,22 L3.2,7 Z" fill="${sv}" ${ol(2.6)}/>
      <circle cx="0" cy="25.5" r="3.6" fill="${sv}" ${ol(2.4)}/>
      <rect x="-5" y="7.6" width="10" height="3.6" rx="1.6" fill="${d.lin('gd', GOLD, 0.3, 1)}" ${ol(1.6)}/>
      <path d="${frame}" fill="${sv}" ${ol(3)}/>
      <path d="${glass}" fill="${d.lin('gl', [[0, '#e6fbff'], [0.5, '#8fd2f4'], [1, '#6a74d8']], 0.4, 1)}" stroke="#6f7c9c" stroke-width="1.6"/>
      <g clip-path="${d.clip('gc', glass)}">
        <path d="M-14,-6 L4,-26 L9,-26 L-9,-2 Z" fill="#fff" opacity="0.75"/>
        <path d="M-4,4 L12,-14 L13,-10 L0,5 Z" fill="#fff" opacity="0.5"/>
      </g>
      <circle cx="0" cy="-27" r="2.6" fill="${d.lin('gm', [[0, '#c9f4ff'], [1, '#3f8fe0']], 0.3, 1)}" ${ol(1.5)}/>
      ${hl('M-12.8,-12 C-12.4,-19 -7,-24.4 -1,-24.6', 1.8, 0.85)}
    </g>
    ${spark(50, 11, 1.1)}${spark(12, 12, 0.7)}${spark(54, 24, 0.55)}`;
});

function waveD(s) { // curling crest, base at y=0, facing right, ~42 wide
  return `M0,0 C0,-15 9,-27 23,-29 C34,-30 42,-22 42,-14 C42,-7.5 36.5,-4.5 32,-7.5 C28.6,-10 29.6,-15.4 33.6,-15.2 C31,-20.5 22.5,-20 20,-12.6 C18.4,-6.4 22,-1.8 28,0 Z`;
}
S.i_marea = icon((d) => {
  const w = waveD();
  const back = d.lin('wb', [[0, '#b5f2ff'], [0.5, '#57c6f2'], [1, '#2a7cc8']], 0.4, 1);
  const front = d.lin('wf', WATER, 0.4, 1);
  const foam = (tx, ty, sc) => `<g transform="translate(${tx} ${ty}) scale(${sc})"><path d="M4,-17 C7,-24 14,-27.4 23,-27.6 C32,-27.6 39,-22 40.2,-15.6" fill="none" stroke="#fff" stroke-width="${f2(2.6 / sc)}" stroke-linecap="round" opacity="0.9"/></g>`;
  return `<g transform="translate(5.5 46) scale(0.82)"><path d="${w}" fill="${back}" stroke="${OUT}" stroke-width="3.4" stroke-linejoin="round"/><path d="M33.6,-15.2 C31,-20.5 22.5,-20 20,-12.6 C18.4,-6.4 22,-1.8 28,0 L33,0 C28,-3 26,-9 28.6,-12.6 Z" fill="#1d5aa8" opacity="0.35"/></g>
    ${foam(5.5, 46, 0.82)}
    <g transform="translate(18 58)"><path d="${w}" fill="${front}" ${ol(2.9)}/><path d="M33.6,-15.2 C31,-20.5 22.5,-20 20,-12.6 C18.4,-6.4 22,-1.8 28,0 L34,0 C28,-3 26,-9 28.6,-12.6 Z" fill="#103f8a" opacity="0.35"/></g>
    ${foam(18, 58, 1)}
    <path d="M4,59 C10,55.5 16,55.5 22,58.6" fill="none" stroke="#7fdcff" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="58" cy="35" r="1.8" fill="#dff8ff" ${ol(1.1)}/><circle cx="55" cy="29" r="1.2" fill="#dff8ff" ${ol(0.9)}/>
    ${spark(50, 10, 1)}${spark(8, 16, 0.7)}`;
});

S.i_arrecife = icon((d) => {
  const rock = 'M6,57 C4,45 9,33 19,28 C27,23 39,22 48,27 C57,32 60,45 58,57 Z';
  return `${uni([tube(15, 36, 6, 24, 12, 9, 6.4, 1.4), tube(22, 31, 28, 20, 22, 7, 5.6, 1.2), tube(11, 40, 5, 34, 7.5, 27, 4.4, 1)], d.linU('sw', MOSS, 10, 6, 24, 34), 2.2)}
    ${uni([tube(46, 32, 48, 22, 44, 14, 4.6, 1.4), tube(47, 25, 52, 21, 55, 14, 3, 1.2), tube(45.5, 22, 41, 19, 39, 15, 2.6, 1)], d.linU('cr', CORAL, 40, 12, 52, 32), 2.2)}
    <path d="${rock}" fill="${d.lin('rk', ROCK, 0.4, 1)}" ${ol(3)}/>
    <g clip-path="${d.clip('rc', rock)}">
      <path d="M0,0 L64,0 L64,35 C60,36 58,40 54,38 C51,36 49,42 45,40 C41,38 39,44 35,41 C32,39 29,44 26,41 C22,38 20,43 16,40 C12,37 10,41 6,40 L0,40 Z" fill="${d.lin('ms', MOSS, 0.3, 1)}"/>
      <path d="M0,0 L64,0 L64,35 C60,36 58,40 54,38 C51,36 49,42 45,40 C41,38 39,44 35,41 C32,39 29,44 26,41 C22,38 20,43 16,40 C12,37 10,41 6,40 L0,40 Z" fill="none" stroke="#235e2e" stroke-width="1.4"/>
      <path d="M54,57 C56,48 54,40 50,35" stroke="#2c2640" stroke-width="5" fill="none" opacity="0.18"/>
      ${[[20, 33], [30, 30], [40, 32], [26, 36], [47, 35], [14, 37]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#e4ffb0" opacity="0.8"/>`).join('')}
      <path d="M18,48 C20,46 23,46 25,48 M38,50 C40,47.5 44,47.5 46,50" stroke="#3a3350" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.6"/>
    </g>
    ${hl('M9,44 C10,37 14,32 19,30', 2, 0.55)}
    <path d="M4.5,58 L59.5,58" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/>
    <path d="M29,49 L30.5,46 L32,49 L35,49.5 L32.6,51.4 L33.4,54.6 L30.5,52.8 L27.6,54.6 L28.4,51.4 L26,49.5 Z" fill="#ffb35a" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="56" cy="12" r="2.2" fill="#dff8ff" ${ol(1.2)}/><circle cx="59" cy="5.5" r="1.4" fill="#dff8ff" ${ol(1)}/><circle cx="33" cy="12" r="1.3" fill="#dff8ff" ${ol(1)}/>`;
});

S.i_sangre = icon((d) => {
  const drop = 'M32,3.5 C40,15 52,27 52,40 C52,52 43,60.5 32,60.5 C21,60.5 12,52 12,40 C12,27 24,15 32,3.5 Z';
  const sea = 'M0,46 C5,43 10,48.5 16,46 C22,43 27,48.5 32,46 C37,43 42,48.5 48,46 C53,43 58,48 64,46 L64,64 L0,64 Z';
  return `<circle cx="32" cy="40" r="26" fill="${d.glow('gw', '#ff4060', 0.35)}"/>
    <path d="${drop}" fill="${d.rad('dr', [[0, '#ffb0a8'], [0.35, '#ff3d50'], [1, '#9a0c2a']], 0.35, 0.35, 0.8)}"/>
    <g clip-path="${d.clip('dc', drop)}">
      <path d="M21.5,47.5 C26,41 30,32 38,25.5 C37.6,34 39,41 43.5,47.5 Z" fill="${d.lin('fn', [[0, '#8a9dc0'], [0.5, '#4b5a80'], [1, '#262c48']], 0.6, 1)}" ${ol(2.2)}/>
      ${hl('M25,44 C28,38 31,33 35.5,29', 1.4, 0.6)}
      <path d="${sea}" fill="#7a0a22"/>
      <path d="M0,46 C5,43 10,48.5 16,46 C22,43 27,48.5 32,46 C37,43 42,48.5 48,46 C53,43 58,48 64,46" fill="none" stroke="#ff8a90" stroke-width="1.6"/>
    </g>
    <path d="${drop}" fill="none" ${ol(3)}/>
    ${hl('M27,13 C23,19 18,26 16.5,34', 2.6, 0.75)}
    <ellipse cx="19.5" cy="40.5" rx="2" ry="2.8" fill="#fff" opacity="0.6"/>
    ${spark(52, 12, 0.9)}`;
});

S.i_hielo = icon((d) => {
  const cx = 32, cy = 28, r = 22;
  const ice = d.lin('ic', ICE, 0.3, 1);
  const ic = [[16, 41, 23, 46, 19, 55], [27, 47, 37, 47, 32, 59], [40, 45, 47, 40.5, 45, 53]].map(([a, b, c, e, x, y]) => `M${a},${b} L${c},${e} L${x},${y} Z`);
  const disc = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="29" fill="${d.glow('gl', '#bff2ff', 0.45)}"/>
    ${uni([...ic.map(x => [x, ice]), [disc, d.rad('mn', [[0, '#ffffff'], [0.5, '#d4f4ff'], [1, '#7ec4ec']], 0.36, 0.3, 0.8)]], ice, 2.8)}
    ${ic.map(x => `<path d="${x}" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.5"/>`).join('')}
    <g clip-path="${d.clip('mc', `<circle cx="${cx}" cy="${cy}" r="${r}"/>`)}">
      <ellipse cx="40" cy="25" rx="5" ry="4.2" fill="#8cc6ea" opacity="0.7"/><ellipse cx="24" cy="36" rx="4" ry="3.4" fill="#8cc6ea" opacity="0.7"/><ellipse cx="38" cy="39" rx="2.5" ry="2.1" fill="#8cc6ea" opacity="0.7"/>
      <path d="M0,0 L64,0 L64,17 C58,19 55,15 51,18 C47,21 45,16 41,19 C37,22 35,17 31,20 C27,23 25,18 21,20 C17,22 15,17 11,19 L0,21 Z" fill="#fff"/>
      <path d="M64,17 C58,19 55,15 51,18 C47,21 45,16 41,19 C37,22 35,17 31,20 C27,23 25,18 21,20 C17,22 15,17 11,19 L0,21" fill="none" stroke="#7ec4ec" stroke-width="1.4"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${ol(2.8)}/>
    ${hlArc(cx, cy, r - 3.4, 140, 190, 2.4, 0.7)}
    ${spark(54, 9, 1.1)}${spark(10, 10, 0.8)}${spark(55, 50, 0.6)}`;
});

S.i_lente = icon((d) => {
  const cx = 25, cy = 25;
  return `<g transform="translate(${cx} ${cy}) rotate(45)">
      <rect x="22" y="-5" width="21" height="10" rx="5" fill="${d.lin('wd', WOOD, 0, 1)}" ${ol(2.8)}/>
      <path d="M27,-4.4 L27,4.4 M33,-4.6 L33,4.6" stroke="#5a3218" stroke-width="1.2" opacity="0.6"/>
      ${hl('M25,-2.6 L40,-2.6', 1.6, 0.45)}
      <rect x="16" y="-4.4" width="8" height="8.8" rx="1.6" fill="${d.lin('gd', GOLD, 0, 1)}" ${ol(2.2)}/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="19.5" fill="${d.lin('rg', GOLD, 0.4, 1)}" ${ol(3)}/>
    <circle cx="${cx}" cy="${cy}" r="14.2" fill="${d.radU('gl', [[0, '#ffffff'], [0.45, '#d4f6ff'], [1, '#62bde8']], 20, 19, 18)}" ${ol(2.2)}/>
    <g clip-path="${d.clip('lc', `<circle cx="${cx}" cy="${cy}" r="14.2"/>`)}" opacity="0.9">
      <path d="M${cx},${cy - 3} L${cx - 15},${cy - 15} M${cx},${cy - 3} L${cx + 15},${cy - 15} M${cx},${cy - 3} L${cx},${cy + 15} M${cx - 6},${cy + 4} L${cx - 15},${cy + 9} M${cx + 6},${cy + 4} L${cx + 15},${cy + 9}" stroke="#9fdcf4" stroke-width="1.2"/>
      <path d="M${cx - 6},${cy + 4} L${cx},${cy - 3} L${cx + 6},${cy + 4} L${cx},${cy + 9} Z" fill="#fff" opacity="0.55" stroke="#9fdcf4" stroke-width="1.1"/>
      <path d="M${cx - 15},${cy - 15} L${cx},${cy - 3} L${cx - 15},${cy + 1} Z" fill="#fff" opacity="0.6"/>
    </g>
    ${hl(arcD(cx, cy, 11.4, 195, 250), 2.4, 0.85)}
    ${hlArc(cx, cy, 17, 200, 245, 1.6, 0.7)}
    ${spark(33, 18, 0.8)}${spark(53, 14, 1.1)}${spark(10, 52, 0.8)}`;
});

S.i_polvora = icon((d) => {
  const body = 'M15,26 C12,36 12,47 15,55 A17,4.8 0 0 0 49,55 C52,47 52,36 49,26 Z';
  const iron = d.lin('ir', IRON, 0, 1);
  return `<ellipse cx="32" cy="58" rx="22" ry="3" fill="#000" opacity="0.25"/>
    <path d="${body}" fill="${d.lin('wd', WOOD, 1, 0.2)}"/>
    <g clip-path="${d.clip('bc', body)}">
      <path d="M22,26 C20,36 20,46 22,60 M32,28 L32,62 M42,26 C44,36 44,46 42,60" stroke="#5a3218" stroke-width="1.3" fill="none" opacity="0.7"/>
      <path d="M8,30 Q32,38 56,30 L56,35 Q32,43 8,35 Z" fill="${iron}" stroke="${OUT}" stroke-width="1.4"/>
      <path d="M8,47 Q32,55 56,47 L56,52 Q32,60 8,52 Z" fill="${iron}" stroke="${OUT}" stroke-width="1.4"/>
      <path d="M44,26 C47,36 47,46 45,58 L56,58 L56,26 Z" fill="#000" opacity="0.18"/>
      ${hl('M18,28 C16,36 16,45 18,53', 2, 0.45)}
    </g>
    <path d="${body}" fill="none" ${ol(3)}/>
    <ellipse cx="32" cy="26" rx="17" ry="5" fill="${d.lin('lid', [[0, '#e6b57a'], [1, '#a0602f']], 0.4, 1)}" ${ol(2.6)}/>
    <ellipse cx="32" cy="26" rx="12.5" ry="3.2" fill="none" stroke="#7a4522" stroke-width="1.2"/>
    <ellipse cx="37" cy="25.4" rx="3" ry="1.4" fill="#1a1424"/>
    <path d="M37,25 C38,19 42,16 45,13.5" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
    <path d="M37,25 C38,19 42,16 45,13.5" fill="none" stroke="#e8d3a6" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 1.6"/>
    <path d="${roundPoly(starPts(46.5, 12, 6.6, 2.9, 8, -90), 0.6)}" fill="${d.lin('sp', FIRE, 0.3, 1)}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="46.5" cy="12" r="2.1" fill="#fffbe0"/>
    <circle cx="57" cy="20" r="1.2" fill="#ffd23c"/><circle cx="55" cy="4" r="1" fill="#ffd23c"/>`;
});

S.i_caracola = icon((d) => {
  const body = 'M1,-14.5 C14,-15.5 30,-10 49,0 C30,9 14,14 1,15 Z';
  const knobs = [10, 20, 30].map((x, i) => `<circle cx="${x}" cy="${f2(-14.4 + i * 2.6 + (x - 10) * 0.12)}" r="${3.2 - i * 0.5}"/>`);
  const g = d.lin('sh', [[0, '#fff4e2'], [0.5, '#f7c79a'], [1, '#c9784e']], 0.3, 1);
  return `<circle cx="13" cy="51" r="11" fill="${d.glow('gl', '#fff2a0', 0.8)}"/>
    <g transform="translate(22 41) rotate(-41)">
      ${uni([...knobs, body], g, 2.8)}
      <g clip-path="${d.clip('bc', body)}">
        ${[13, 24, 34, 42].map(x => `<path d="M${x},-16 C${x + 5},-5 ${x + 4},5 ${x - 3},16" stroke="#c9784e" stroke-width="1.6" fill="none"/>`).join('')}
        <path d="M0,6 C14,6 30,4 49,0 L49,20 L0,20 Z" fill="#a8583a" opacity="0.22"/>
      </g>
      ${hl('M6,-11 C16,-11.5 26,-8.5 36,-4', 1.8, 0.7)}
      <ellipse cx="1.5" cy="0" rx="6.5" ry="16" fill="${d.lin('lp', [[0, '#fff8ee'], [1, '#f2c4a0']], 1, 0.3)}" ${ol(2.6)}/>
      <ellipse cx="0.5" cy="0.5" rx="3.6" ry="11" fill="${d.lin('in', [[0, '#ff9ab0'], [1, '#c4466a']], 1, 0.5)}" stroke="#9a3a52" stroke-width="1.2"/>
    </g>
    <path d="M13,40 L10.5,36.5 M7.5,46 L5,45.4 M24,57 L24.6,59.4" stroke="#ffe27a" stroke-width="1.8" stroke-linecap="round"/>
    ${sparkO(11.5, 52, 1.35, '#fff3a0')}
    ${spark(5, 37, 0.6, '#fff3a0')}${spark(21, 59, 0.5, '#fff3a0')}${spark(52, 46, 0.8)}`;
});
// ================================================================= EVOLUTIONS (gold accents)
const roundStar = (cx, cy, R, r, rr = 2, n = 5, rot = -90) => roundPoly(starPts(cx, cy, R, r, n, rot), rr);
function goldStar(d, cx, cy, R, w = 2.8, k = 'gs') {
  return `<path d="${roundStar(cx, cy, R, R * 0.5, R * 0.16)}" fill="${d.lin(k, GOLD, 0.35, 1)}" ${ol(w)}/>
    <path d="${roundStar(cx, cy, R * 0.55, R * 0.28, R * 0.08)}" fill="#fff6c0" opacity="0.55"/>
    ${hl(`M${f2(cx - R * 0.5)},${f2(cy - R * 0.12)} L${f2(cx - R * 0.15)},${f2(cy - R * 0.2)} L${f2(cx)},${f2(cy - R * 0.62)}`, Math.max(1, R * 0.12), 0.75)}`;
}

S.i_estrellas = icon((d) => {
  const trail = (x, y, len, w, k) => { const a = rd(-38), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len; return `<path d="${tube(x, y, (x + ex) / 2, (y + ey) / 2 + 1, ex, ey, w, 0.5)}" fill="${d.linU(k, [[0, '#fff3a0', 0.95], [0.5, '#c58cff', 0.6], [1, '#8a5cff', 0]], x, y, ex, ey)}"/>`; };
  return `${trail(22, 41, 40, 17, 't1')}${trail(47, 47, 17, 9, 't2')}${trail(13, 18, 19, 8, 't3')}
    ${goldStar(d, 22, 41, 15)}
    ${goldStar(d, 47, 48, 8.2, 2.4)}
    ${goldStar(d, 13, 18, 7.2, 2.2)}
    ${sparkO(52, 26, 1, '#ffe27a')}${spark(34, 15, 0.8)}${spark(6, 58, 0.6)}${spark(58, 58, 0.6)}`;
});

S.i_maelstrom = icon((d) => {
  const cx = 32, cy = 31, rx = 27.5, ry = 20, sy = ry / rx;
  const rings = [0, 1, 2, 3, 4].map(k => { const s = 1 - k * 0.17; return `<ellipse cx="${cx}" cy="${f2(cy + k * 2.2)}" rx="${f2(rx * s)}" ry="${f2(ry * s)}" fill="${['#2d86d0', '#2366b4', '#1a4890', '#142e6a', '#0d1a44'][k]}"/>`; }).join('');
  const arms = [0, 72, 144, 216, 288].map(r => spiralArm(cx, cy + 3, 4, 26, r, 0.8, 6, sy));
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2d86d0" ${ol(3)}/>
    <g clip-path="${d.clip('ec', `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`)}">
      ${rings}
      ${arms.map(a => `<path d="${a}" fill="${d.linU('a', [[0, '#ffffff'], [0.5, '#9feaff'], [1, '#4fbcf0']], 8, 10, 56, 54)}" stroke="#0f2a5e" stroke-width="1.1" stroke-linejoin="round" opacity="0.95"/>`).join('')}
      <ellipse cx="${cx}" cy="${cy + 8}" rx="5" ry="3.2" fill="#070b22"/>
    </g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx - 2}" ry="${ry - 2}" fill="none" stroke="${d.linU('gr', GOLD, 4, 10, 60, 52)}" stroke-width="2.6"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" ${ol(3)}/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx - 3.6}" ry="${ry - 3.6}" fill="none" stroke="${OUT}" stroke-width="1" opacity="0.6"/>
    ${hl('M6,26 C8,19 15,14 24,12', 1.6, 0.8)}
    ${[[7.5, 55], [56, 56], [56, 9]].map(([x, y], i) => sparkO(x, y, [0.85, 0.75, 0.95][i]))}
    <circle cx="8" cy="8" r="1.6" fill="#dff8ff" ${ol(1)}/><circle cx="50" cy="58" r="1.4" fill="#dff8ff" ${ol(1)}/>`;
});

S.i_muralla = icon((d) => {
  const cor = d.linU('cw', [[0, '#ffc4b0'], [0.4, '#ff7a70'], [1, '#b8264c']], 10, 10, 50, 62);
  const tower = x => `M${x},58 L${x},22 L${x + 3.5},22 L${x + 3.5},18 L${x + 7},18 L${x + 7},22 L${x + 10},22 L${x + 10},18 L${x + 13.5},18 L${x + 13.5},22 L${x + 17},22 L${x + 17},58 Z`;
  const wall = 'M18,58 L18,31 L23,31 L23,27.5 L28,27.5 L28,31 L36,31 L36,27.5 L41,27.5 L41,31 L46,31 L46,58 Z';
  const sprouts = [tube(11, 19, 9, 13, 7.5, 7, 3.6, 0.5), tube(14, 18, 16, 12, 14.5, 6.5, 3, 0.5), tube(53, 19, 55, 13, 56.5, 7, 3.6, 0.5), tube(50, 18, 48, 12, 49.5, 6.5, 3, 0.5), tube(32, 29, 32, 22, 33, 14, 3.4, 0.5), tube(32.5, 23, 36, 20, 38, 17, 2.2, 0.4)];
  const gate = 'M26.5,58 L26.5,46 C26.5,38 37.5,38 37.5,46 L37.5,58 Z';
  return `${uni(sprouts, cor, 2.2)}
    ${uni([tower(6), tower(41), wall], cor, 2.8)}
    <path d="M6,40 L23,40 M41,40 L58,40 M23,44 L41,44" stroke="#a8204a" stroke-width="1.2" opacity="0.5"/>
    ${[[10, 30], [16, 48], [50, 30], [54, 50], [24, 35], [40, 35], [12, 53], [51, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#a8204a" opacity="0.65"/>`).join('')}
    ${hl('M8.5,25 L8.5,55', 1.8, 0.55)}${hl('M43.5,25 L43.5,55', 1.6, 0.45)}
    <rect x="11.5" y="27" width="6" height="8" rx="3" fill="#2a1d3a" ${ol(1.4)}/><rect x="46.5" y="27" width="6" height="8" rx="3" fill="#2a1d3a" ${ol(1.4)}/>
    <path d="M24,58 L24,46 C24,35.5 40,35.5 40,46 L40,58 Z" fill="${d.lin('gd', GOLD, 0.3, 1)}" ${ol(2.4)}/>
    <path d="${gate}" fill="#2a1d3a" ${ol(1.6)}/>
    <path d="M32,40 L32,58 M26.5,49 L37.5,49" stroke="#5a4a6e" stroke-width="1.2"/>
    <circle cx="32" cy="38.4" r="2" fill="#7fe0ff" ${ol(1.2)}/>
    <path d="M4.5,58.5 L59.5,58.5" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/>
    ${sparkO(24.5, 13, 0.7)}${sparkO(42, 11, 0.6)}`;
});

S.i_megalodon = icon((d) => {
  const head = 'M32,3.5 C48,3.5 60.5,14 60.5,30 C60.5,47 49,60.5 32,60.5 C15,60.5 3.5,47 3.5,30 C3.5,14 16,3.5 32,3.5 Z';
  const mouth = 'M9.5,27 C9.5,22 54.5,22 54.5,27 C54.5,44 45,55.5 32,55.5 C19,55.5 9.5,44 9.5,27 Z';
  const top = [], bot = [];
  for (let i = 0; i < 7; i++) { const x = 13.5 + i * 6.2, y = 25 + Math.pow((x - 32) / 22, 2) * 3; top.push([x, y]); }
  for (let i = 0; i < 6; i++) { const x = 16.5 + i * 6.2, dx = (x - 32) / 18; bot.push([x, 52 - dx * dx * 8]); }
  const tooth = ([x, y], dn, gold) => `<path d="M${f2(x - 3)},${f2(y)} L${f2(x)},${f2(y + (dn ? 7.5 : -7))} L${f2(x + 3)},${f2(y)} Z" fill="${gold ? d.lin('gd', GOLD, 0.3, 1) : '#fffdf4'}" stroke="${OUT}" stroke-width="1.3" stroke-linejoin="round"/>`;
  return `<path d="${head}" fill="${d.lin('hd', SHARK, 0.3, 1)}" ${ol(3)}/>
    <g clip-path="${d.clip('hc', head)}"><path d="M0,38 C10,46 54,46 64,38 L64,64 L0,64 Z" fill="#e6edf6" opacity="0.9"/></g>
    <path d="${mouth}" fill="${d.radU('mo', [[0, '#3a0a1c'], [0.6, '#7a1430'], [1, '#c43a5a']], 32, 40, 22)}" ${ol(2.6)}/>
    <path d="M18,48 C24,52 40,52 46,48 C42,44 22,44 18,48 Z" fill="#e8577a" opacity="0.8"/>
    ${top.map((p, i) => tooth(p, true, i === 4)).join('')}
    ${bot.map(p => tooth(p, false)).join('')}
    <path d="M10,15.5 L21,19.5 M54,15.5 L43,19.5" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="15" cy="20" r="3" fill="#fff" ${ol(1.3)}/><circle cx="49" cy="20" r="3" fill="#fff" ${ol(1.3)}/>
    <circle cx="15.8" cy="20.6" r="1.6" fill="${OUT}"/><circle cx="48.2" cy="20.6" r="1.6" fill="${OUT}"/>
    <path d="M28,11 L30,13 M36,11 L34,13" stroke="#3e4c6e" stroke-width="1.6" stroke-linecap="round"/>
    ${hl('M9,22 C9,14 16,8 24,6.5', 2.4, 0.6)}
    ${sparkO(56, 8, 0.8)}${sparkO(8, 55, 0.7)}`;
});

S.i_glaciar = icon((d) => {
  const back = 'M30,54 L45,17 L58.5,54 Z';
  const main = 'M6,55 L27,6 L48,55 Z';
  return `<path d="${back}" fill="${d.lin('bk', [[0, '#d6f6ff'], [1, '#4a9ad8']], 0.6, 1)}" ${ol(2.6)}/>
    <path d="M45,17 L52,34 L47,31 L44,36 L40,30 L37,33 Z" fill="#fff" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M45,17 L58.5,54 L47,54 L46,32 Z" fill="#2a6ab8" opacity="0.35"/>
    <path d="${main}" fill="${d.lin('mn', ICE, 0.5, 1)}" ${ol(3)}/>
    <path d="M27,6 L48,55 L30,55 L29,30 Z" fill="#2f7cc8" opacity="0.38"/>
    <path d="M27,6 L18,25 L23,22 L26,28 L30,22 L34,26 L37,22 Z" fill="#fff" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M29,30 L23,42 M29,30 L36,44 M14,44 L22,40" stroke="#ffffff" stroke-width="1.3" opacity="0.6" stroke-linecap="round"/>
    ${hl('M24,13 L9,46', 2, 0.6)}
    ${sea(d, 52, 4.5, 59.5, 'sea', 2)}
    ${sparkO(27, 8.6, 0.95, '#ffe27a')}${sparkO(54, 12, 0.8)}${spark(10, 14, 0.8)}`;
});

S.i_solar = icon((d) => {
  const tower = 'M23,54 L27,27 L37,27 L41,54 Z';
  const rays = Array.from({ length: 12 }, (_, i) => { const a = rd(i * 30 - 90); return `M${P([32 + Math.cos(a - 0.13) * 11, 19.5 + Math.sin(a - 0.13) * 11])} L${P([32 + Math.cos(a) * 15.8, 19.5 + Math.sin(a) * 15.8])} L${P([32 + Math.cos(a + 0.13) * 11, 19.5 + Math.sin(a + 0.13) * 11])} Z`; }).join(' ');
  return `<circle cx="32" cy="21" r="22" fill="${d.glow('gl', '#ffd860', 0.7)}"/>
    <path d="${rays}" fill="${d.radU('ry', [[0, '#fff3a0'], [1, '#ff9a2a']], 32, 19.5, 16)}" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="32" cy="19.5" r="11.5" fill="${d.rad('sn', [[0, '#fffbe0'], [0.5, '#ffd23c'], [1, '#f08a1e']], 0.4, 0.35, 0.75)}" ${ol(2.6)}/>
    ${hlArc(32, 19.5, 8.6, 195, 255, 2.2, 0.8)}
    <path d="${tower}" fill="${d.lin('t', [[0, '#ffffff'], [0.6, '#e8e2f2'], [1, '#aaa2c4']], 1, 0.2)}"/>
    <g clip-path="${d.clip('tc', tower)}">
      <rect x="20" y="33" width="24" height="5" fill="${d.lin('gb', GOLD, 1, 0.3)}"/><rect x="20" y="44" width="24" height="5" fill="${d.lin('gb', GOLD, 1, 0.3)}"/>
      <path d="M36,27 L40,54 L44,54 L44,27 Z" fill="#000" opacity="0.14"/>
    </g>
    <path d="${tower}" fill="none" ${ol(2.8)}/>
    <path d="M23,33 L41,33 M23,38 L41,38 M22.5,44 L41.5,44 M22,49 L42,49" stroke="${OUT}" stroke-width="1" opacity="0.5"/>
    ${hl('M27,30 L25,50', 1.6, 0.7)}
    <rect x="22.5" y="25" width="19" height="4" rx="1.4" fill="${d.lin('gb', GOLD, 1, 0.3)}" ${ol(2)}/>
    <path d="M12,59.5 C11,55 15,52 21,52 L43,52 C49,52 53,55 52,59.5 Z" fill="${d.lin('rk', ROCK)}" ${ol(2.6)}/>
    ${hl('M16,56 C17,54.5 19,54 21,54', 1.4, 0.5)}
    <path d="M5,57.6 C7.5,55.2 10,55.2 12.5,57.6 M51.5,57.6 C54,55.2 56.5,55.2 59,57.6" stroke="#7fdcff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${sparkO(56, 40, 0.8)}${sparkO(7, 40, 0.7)}`;
});

S.i_bombarda = icon((d) => {
  const bar = 'M-15,-9 C-19.5,-9 -21.5,-4.5 -21.5,0 C-21.5,4.5 -19.5,9 -15,9 L12,7 L12,-7 Z';
  const burst = (x, y, r, col, k) => { const rays = Array.from({ length: 8 }, (_, i) => { const a = rd(i * 45 + 22); return `M${P([x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45])} L${P([x + Math.cos(a) * r, y + Math.sin(a) * r])}`; }).join(' '); return `<path d="${rays}" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/><path d="${rays}" stroke="${col}" stroke-width="2" stroke-linecap="round"/><path d="${roundStar(x, y, r * 0.42, r * 0.2, 0.6)}" fill="${col}" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${f2(r * 0.12)}" fill="#fff"/>`; };
  return `<path d="M40,27 C43,22 45,18 45,15" stroke="#ffd860" stroke-width="1.6" fill="none" stroke-dasharray="2 2" opacity="0.9"/>
    ${burst(45, 14, 9, '#ff7ac8', 'b1')}${burst(53.5, 32, 5.8, '#7fe8ff', 'b2')}${burst(26, 11, 6, '#ffe27a', 'b3')}
    <g transform="translate(27 37) rotate(-38)">
      <path d="${bar}" fill="${d.lin('br', GOLD, 0.15, 1)}" ${ol(3)}/>
      <path d="M-14,-6 L10,-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
      <rect x="-10" y="-9.8" width="4.6" height="19.6" rx="1.6" fill="${d.lin('pu', PURPLE, 0.2, 1)}" ${ol(1.6)}/>
      <rect x="2" y="-8.4" width="3.6" height="16.8" rx="1.4" fill="${d.lin('pu', PURPLE, 0.2, 1)}" ${ol(1.6)}/>
      <rect x="11" y="-9" width="6.4" height="18" rx="2" fill="${d.lin('br2', GOLDR, 0.2, 1)}" ${ol(2.2)}/>
      <ellipse cx="17.6" cy="0" rx="2" ry="5.4" fill="#14101e"/>
      <circle cx="-23" cy="0" r="2.8" fill="${d.lin('br', GOLD, 0.15, 1)}" ${ol(1.6)}/>
      <path d="M-4,-3 L-1,0 L-4,3 L-7,0 Z" fill="#fff6c0" stroke="#b5620f" stroke-width="0.8"/>
    </g>
    <path d="M9,48 L18,39 L35,44 L39,52 L15,56 Z" fill="${d.lin('wd', WOOD)}" ${ol(2.6)}/>
    <circle cx="24" cy="52" r="8.6" fill="${d.lin('wh', WOOD, 0.3, 1)}" ${ol(2.8)}/>
    <circle cx="24" cy="52" r="5.4" fill="none" stroke="#5a3218" stroke-width="1.3"/>
    <path d="M24,44.8 L24,59.2 M16.8,52 L31.2,52 M18.9,46.9 L29.1,57.1 M29.1,46.9 L18.9,57.1" stroke="#5a3218" stroke-width="1.5"/>
    <circle cx="24" cy="52" r="2.6" fill="${d.lin('br', GOLD, 0.15, 1)}" ${ol(1.4)}/>
    ${spark(8, 20, 0.8)}${spark(58, 50, 0.7, '#ffe27a')}`;
});

S.i_poseidon = icon((d) => {
  const gold = '#ffc93a';
  const U = 'M-12,-19 L-12,-12 C-12,-5 -6,-3 0,-3 C6,-3 12,-5 12,-12 L12,-19 M0,-3 L0,-21';
  const head = (x, y) => `M${x - 4.4},${y + 2.6} L${x},${y - 7.4} L${x + 4.4},${y + 2.6} L${x},${y + 0.6} Z`;
  const heads = [head(-12, -20), head(0, -22), head(12, -20)].join(' ');
  const bolts = 'M-16,-24 L-23,-18 L-19,-16 L-26,-8 M16,-24 L23,-19 L19,-16.4 L25,-9';
  return `<circle cx="32" cy="22" r="24" fill="${d.glow('gl', '#7fe8ff', 0.55)}"/>
    <g transform="translate(32 34) rotate(15)">
      <rect x="-2.8" y="-3" width="5.6" height="25" rx="2.2" fill="${d.lin('sf', GOLD, 1, 0.1)}" ${ol(2.4)}/>
      <path d="M-1.2,2 L-1.2,19" stroke="#fff6c0" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
      <circle cx="0" cy="23.4" r="3.1" fill="${d.lin('pm', GOLD, 0.3, 1)}" ${ol(2)}/>
      <path d="${U}" fill="none" stroke="${OUT}" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${heads}" fill="${OUT}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="${U}" fill="none" stroke="${gold}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${heads}" fill="${d.lin('hd', GOLD, 0.4, 1)}"/>
      <path d="M-13.2,-18 L-13.2,-12 C-13.2,-7 -10,-4.6 -6,-4 M-1.1,-6 L-1.1,-19" stroke="#fff6c0" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.85"/>
      <rect x="-4.6" y="-4.6" width="9.2" height="4.4" rx="1.6" fill="${d.lin('cl', GOLDR, 0, 1)}" ${ol(1.6)}/>
      <path d="M0,-6.2 L2.6,-2.4 L0,1.2 L-2.6,-2.4 Z" fill="${d.lin('gem', [[0, '#d6fbff'], [1, '#2a8fd6']], 0.3, 1)}" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
      <g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${bolts}" stroke="${OUT}" stroke-width="4.4"/><path d="${bolts}" stroke="#bff6ff" stroke-width="2.2"/></g>
    </g>
    ${sparkO(52, 50, 0.85)}${sparkO(11, 46, 0.7)}${spark(54, 8, 0.8, '#bff6ff')}`;
});

// ================================================================= UNIONS (purple + gold)
const aura = (d, cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${d.glow('pa', '#b07aff', 0.6)}"/>`;

S.i_tiburonado = icon((d) => {
  const funnel = 'M5,9 C5,3 59,3 59,9 C58,20 48,29 41,41 C38,47 35,53 33,59 C32,60.5 31,59.5 30.6,58 C29,52 26,46 23,41 C16,29 6,20 5,9 Z';
  const shark = 'M15,26 C21,20 32,17 42,20 L48,15 L48,22 C52,23 55,25 56,27 C52,29 46,30 41,30 C34,32 24,31 15,26 Z';
  return `${aura(d, 32, 32, 31)}
    <path d="${funnel}" fill="${d.linU('fn', [[0, '#c6f4ff'], [0.4, '#5cc6ee'], [1, '#2a6cc0']], 10, 4, 44, 58)}" ${ol(3)}/>
    <g clip-path="${d.clip('fc', funnel)}" fill="none" stroke-linecap="round">
      ${[[13, 30], [22, 41], [30, 50]].map(([y, w], i) => `<path d="M${32 - w / 2 - 6},${y} C${32 - w / 4},${y + 5} ${32 + w / 4},${y + 5} ${32 + w / 2 + 6},${y - 1}" stroke="#ffffff" stroke-width="${2.2 - i * 0.3}" opacity="0.7"/>`).join('')}
      <path d="M8,10 C20,14 44,14 58,8" stroke="#1d4f9a" stroke-width="1.6" opacity="0.5"/>
    </g>
    <ellipse cx="32" cy="8.5" rx="26.5" ry="4" fill="${d.lin('tp', [[0, '#ffffff'], [1, '#9feaff']], 0, 1)}" ${ol(2)}/>
    <path d="M30,28 L33,21 L37,27 Z" fill="${d.lin('sf', SHARK, 0.4, 1)}" ${ol(1.8)}/>
    <path d="${shark}" fill="${d.lin('sk', SHARK, 0.2, 1)}" ${ol(2.4)}/>
    <path d="M17,27 C25,30 34,31 41,30 C46,30 51,29 55,27.6 C50,30.6 44,31.6 38,32 C30,32.4 22,30.4 17,27 Z" fill="#fff" opacity="0.9"/>
    <circle cx="21" cy="23.5" r="1.3" fill="${OUT}"/>
    <path d="M17.5,27.4 L22,26.4" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M10,34 C22,40 42,40 54,30" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
    <path d="M10,34 C22,40 42,40 54,30" fill="none" stroke="#bdf2ff" stroke-width="2.6" stroke-linecap="round"/>
    ${sparkO(56, 50, 0.9)}${sparkO(8, 48, 0.7, '#e6c6ff')}${spark(46, 56, 0.6)}`;
});

S.i_prisma = icon((d) => {
  const tri = 'M32,10 L52,46 L12,46 Z';
  return `${aura(d, 32, 32, 30)}
    <path d="M5,33 L22,28 L22,32 L5,38 Z" fill="#fffbe6" ${ol(2)}/>
    ${[['#ffd23c', -18], ['#c58cff', 0], ['#5fe0ff', 18]].map(([c, dy], i) => `<path d="M42,${30 + i * 3} L59,${31 + dy - 4} L59,${31 + dy + 4} L42,${33 + i * 3} Z" fill="${c}" ${ol(1.8)}/>`).join('')}
    <path d="${tri}" fill="${d.lin('pr', [[0, '#ffffff'], [0.5, '#c4eeff'], [1, '#7aa8f0']], 0.5, 1)}" ${ol(3)}/>
    <path d="M32,10 L32,46 L12,46 Z" fill="#fff" opacity="0.35"/>
    <path d="M32,10 L52,46 L32,46 Z" fill="#6a4ad0" opacity="0.18"/>
    <path d="M32,24 L22,46 M32,24 L42,46 M32,24 L32,10" stroke="#fff" stroke-width="1.2" opacity="0.7"/>
    <path d="M10,48 L54,48 L50,54 L14,54 Z" fill="${d.lin('gb', GOLD, 0.3, 1)}" ${ol(2.2)}/>
    <path d="M17,50.5 L47,50.5" stroke="#fff6c0" stroke-width="1.2" opacity="0.8"/>
    ${hl('M29.5,16 L17,42', 1.8, 0.8)}
    ${sparkO(14, 12, 0.85)}${sparkO(50, 10, 0.7, '#e6c6ff')}${spark(30, 58, 0.6)}`;
});

S.i_truenos = icon((d) => {
  const bolts = ['M8,10 L15,19 L11,21 L19,28', 'M56,8 L49,17 L54,19 L45,26', 'M57,54 L49,47 L52,44 L44,40', 'M6,50 L14,45 L11,42 L19,39'];
  return `${aura(d, 32, 32, 31)}
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${bolts.join(' ')}" stroke="${OUT}" stroke-width="5"/>
      <path d="${bolts[0]} ${bolts[2]}" stroke="#ffe27a" stroke-width="2.6"/>
      <path d="${bolts[1]} ${bolts[3]}" stroke="#d6a8ff" stroke-width="2.6"/>
    </g>
    <circle cx="32" cy="33" r="17" fill="${d.rad('cb', [[0, '#9a98b8'], [0.35, '#4c4a66'], [1, '#17151f']], 0.35, 0.3, 0.8)}" ${ol(3)}/>
    <ellipse cx="25.5" cy="26" rx="5.5" ry="3.6" transform="rotate(-35 25.5 26)" fill="#fff" opacity="0.55"/>
    <circle cx="21.5" cy="31.5" r="1.4" fill="#fff" opacity="0.6"/>
    <path d="M23,38 L28,35 L26,40 L33,37" fill="none" stroke="#e6c6ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
    <path d="M37,42 L41,38 L42,43 L46,40" fill="none" stroke="#ffe27a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
    ${sparkO(32, 7.5, 0.8)}${sparkO(32, 57, 0.7, '#e6c6ff')}`;
});

S.i_estelar = icon((d) => {
  const pts = starPts(32, 33, 27, 12.5, 5, -90);
  const body = roundPoly(pts, pts.map((_, i) => i % 2 ? 4.5 : 4.2));
  const g = d.radU('st', [[0, '#ffe0f4'], [0.35, '#ff7ac0'], [0.75, '#b44cd8'], [1, '#6a2aa8']], 27, 26, 32);
  const tips = pts.filter((_, i) => i % 2 === 0);
  const dot = (t, r, fill) => tips.map(([x, y]) => `<circle cx="${f2(32 + (x - 32) * t)}" cy="${f2(33 + (y - 33) * t)}" r="${r}" fill="${fill}"/>`).join('');
  return `${aura(d, 32, 33, 31)}
    <path d="${body}" fill="${g}" ${ol(3)}/>
    <path d="${roundPoly(starPts(32, 33, 17, 8, 5, -90), 2.6)}" fill="#ffd0ec" opacity="0.35"/>
    ${dot(0.66, 1.6, '#ffd6f0')}${dot(0.45, 1.3, '#ffd6f0')}
    ${tips.map(([x, y]) => `<circle cx="${f2(32 + (x - 32) * 0.84)}" cy="${f2(33 + (y - 33) * 0.84)}" r="2.3" fill="${d.lin('gd', GOLD, 0.3, 1)}" stroke="${OUT}" stroke-width="1.1"/>`).join('')}
    <circle cx="32" cy="33" r="4.8" fill="${d.lin('gd', GOLD, 0.3, 1)}" ${ol(1.6)}/>
    ${hl('M28.6,15 L31,9.6 M12.5,26.4 L19,25.6', 1.8, 0.75)}
    ${sparkO(55, 9, 0.85)}${sparkO(8, 55, 0.7, '#e6c6ff')}${spark(56, 52, 0.6)}`;
});
// ================================================================= MOON ABILITIES
S.i_tsunami = icon((d) => {
  const w = waveD();
  return `<g transform="translate(5 58) scale(1.28 1.5)">
      <path d="${w}" fill="${d.lin('wv', [[0, '#a8f2ff'], [0.35, '#44bcef'], [1, '#164e9e']], 0.45, 1)}" stroke="${OUT}" stroke-width="2.1" stroke-linejoin="round"/>
      <path d="M33.6,-15.2 C31,-20.5 22.5,-20 20,-12.6 C18.4,-6.4 22,-1.8 28,0 L34,0 C28,-3 26,-9 28.6,-12.6 Z" fill="#0d2f70" opacity="0.4"/>
      <path d="M4,-17 C7,-24 14,-27.4 23,-27.6 C32,-27.6 39,-22 40.2,-15.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <path d="M7,-6 C9,-12 12,-16 16,-19" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    </g>
    ${[[47, 13, 1.6], [53, 18, 2.2], [57, 26, 1.5], [57, 36, 1.2], [40, 9, 1.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e6fbff" ${ol(1.2)}/>`).join('')}
    <path d="M4.5,59.5 L59.5,59.5" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/>
    ${spark(12, 12, 1)}${spark(26, 7, 0.6)}`;
});

S.i_furia = icon((d) => {
  const cx = 32, cy = 38.5, r = 18.5;
  const T = [[-180, 6, 35], [-150, 7.5, 21], [-122, 16, 10], [-96, 29, 5], [-70, 41, 6.5], [-45, 51.5, 12.5], [-18, 58, 23], [6, 58.5, 37]];
  const tongues = T.map(([a, tx, ty]) => { const A = rd(a), bx = cx + Math.cos(A) * (r - 3), by = cy + Math.sin(A) * (r - 3); return tube(bx, by, (bx + tx) / 2 + Math.cos(A) * 3, (by + ty) / 2 + 2, tx, ty, 14, 0.6); });
  const inner = T.slice(1, 7).map(([a, tx, ty]) => { const A = rd(a), bx = cx + Math.cos(A) * (r - 4), by = cy + Math.sin(A) * (r - 4), ix = bx + (tx - bx) * 0.62, iy = by + (ty - by) * 0.62; return tube(bx, by, (bx + ix) / 2 + Math.cos(A) * 1.5, (by + iy) / 2 + 1, ix, iy, 8, 0.5); });
  return `<circle cx="${cx}" cy="${cy - 6}" r="28" fill="${d.glow('gl', '#ff6a2a', 0.6)}"/>
    ${uni(tongues, d.linU('fl', [[0, '#fff2a0'], [0.4, '#ffaa2a'], [1, '#e8402a']], 32, 6, 32, 40), 2.4)}
    <g fill="#fff3a0">${inner.map(x => `<path d="${x}"/>`).join('')}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${d.rad('mn', [[0, '#ff9a8a'], [0.5, '#e8343e'], [1, '#8a0f26']], 0.36, 0.3, 0.8)}" ${ol(3)}/>
    <ellipse cx="41" cy="46.5" rx="3.6" ry="3" fill="#a8142e" opacity="0.7"/><ellipse cx="24" cy="48.5" rx="2.4" ry="2" fill="#a8142e" opacity="0.7"/>
    <path d="M22.5,33.5 L29.5,37 M41.5,33.5 L34.5,37" stroke="${OUT}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M23.8,37.4 C24.8,40.6 28.6,40.6 29,38 Z M40.2,37.4 C39.2,40.6 35.4,40.6 35,38 Z" fill="#ffe27a" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M27,47.4 C30,45 34,45 37,47.4" stroke="${OUT}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${hlArc(cx, cy, r - 3.2, 195, 250, 2.4, 0.6)}`;
});

S.i_ventisca = icon((d) => {
  const ice = d.linU('ic', [[0, '#ffffff'], [0.6, '#c4f0ff'], [1, '#6cc4f0']], 8, 8, 56, 56);
  const s1 = 'M8.5,27 C13,13 33,7 44,15 C52,21 49,33 40,32 C34,31.4 34.6,24.4 40,25.2';
  const s2 = 'M7.5,42 C20,37 38,42 49,37 C56,33.6 56.6,26 51,25.2';
  const s3 = 'M13,53 C25,49 36,55 49,50';
  const flake = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 60, 120].map(a => `<path d="M0,-5 L0,5" transform="rotate(${a})"/>`).join('')}</g>`;
  const fl = [[54, 12, 0.9], [22, 30, 0.6], [56, 50, 0.75], [10, 13, 0.55], [32, 58, 0.5]];
  return `${[s1, s2, s3].map((s, i) => fat(s, ice, [4.6, 4.2, 3.4][i], 1.6)).join('')}
    ${hl('M10,23 C15,14 28,10 38,12', 1.4, 0.9)}
    <g fill="none" stroke-linecap="round" stroke="${OUT}" stroke-width="4.2">${fl.map(f => flake(...f)).join('')}</g>
    <g fill="none" stroke-linecap="round" stroke="#fff" stroke-width="2">${fl.map(f => flake(...f)).join('')}</g>
    ${[[30, 22], [46, 44], [8, 50], [60, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff" ${ol(1)}/>`).join('')}`;
});

S.i_eclipse = icon((d) => {
  const rays = Array.from({ length: 16 }, (_, i) => { const a = rd(i * 22.5 - 90 + 11), L = i % 2 ? 24.5 : 27.6; return `M${P([32 + Math.cos(a - 0.09) * 20, 32 + Math.sin(a - 0.09) * 20])} L${P([32 + Math.cos(a) * L, 32 + Math.sin(a) * L])} L${P([32 + Math.cos(a + 0.09) * 20, 32 + Math.sin(a + 0.09) * 20])} Z`; }).join(' ');
  return `<circle cx="32" cy="32" r="30" fill="${d.glow('gl', '#ffe9a0', 0.9)}"/>
    <path d="${rays}" fill="${d.radU('ry', [[0, '#fffbe0'], [1, '#ffb83a']], 32, 32, 30)}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="32" cy="32" r="21.5" fill="${d.rad('rg', [[0, '#ffffff'], [0.7, '#fff3b0'], [1, '#ffc23c']], 0.5, 0.5, 0.5)}" ${ol(2.4)}/>
    <circle cx="34.5" cy="30.5" r="18.5" fill="${d.rad('dk', [[0, '#3a2f66'], [0.7, '#1c1636'], [1, '#110c22']], 0.4, 0.35, 0.8)}" ${ol(2.2)}/>
    ${hl(arcD(34.5, 30.5, 15.5, 200, 250), 1.6, 0.25)}
    <circle cx="17" cy="42" r="3" fill="#fff"/>
    ${spark(17, 42, 2.2, '#fff')}
    ${sparkO(55, 9, 0.8)}`;
});

S.i_tesoro = icon((d) => {
  return `<circle cx="27" cy="26" r="24" fill="${d.glow('gl', '#ffd860', 0.6)}"/>
    <path d="${crescentD(26, 26, 21, 11, -7, 17.5)}" fill="${d.rad('mg', GOLD, 0.3, 0.3, 0.9)}" ${ol(3)}/>
    <circle cx="13" cy="28" r="2.6" fill="#e0911e" opacity="0.7"/><circle cx="20" cy="40" r="2" fill="#e0911e" opacity="0.7"/><circle cx="11" cy="17" r="1.5" fill="#e0911e" opacity="0.7"/>
    ${hl(arcD(26, 26, 17.6, 125, 220), 2.4, 0.8)}
    ${coinTilt(d, 46, 53, 10, 4, 3)}${coinTilt(d, 46, 48, 10, 4, 3)}${coinTilt(d, 46, 43, 10, 4, 3)}${coinTilt(d, 46, 38, 10, 4, 3)}
    ${coinFace(d, 30, 48.5, 9.5, 2.4)}
    ${sparkO(56, 26, 0.9, '#fff3a0')}${spark(44, 12, 0.8)}${spark(14, 56, 0.6)}`;
});

// ================================================================= WORKSHOP
S.i_murallas = icon((d) => {
  const wall = 'M5,58 L5,16 L13,16 L13,22 L20,22 L20,16 L28,16 L28,22 L36,22 L36,16 L44,16 L44,22 L51,22 L51,16 L59,16 L59,58 Z';
  const rows = [[22, 30], [30, 38], [38, 46], [46, 58]];
  let mortar = 'M5,22 L59,22 M5,30 L59,30 M5,38 L59,38 M5,46 L59,46';
  rows.forEach(([y0, y1], i) => { const off = i % 2 ? 9 : 0; for (let x = 5 + off + 18; x < 59; x += 18) mortar += ` M${x},${y0} L${x},${y1}`; });
  mortar += ' M9,16 L9,22 M24,16 L24,22 M40,16 L40,22 M55,16 L55,22';
  return `<path d="${wall}" fill="${d.lin('st', [[0, '#c9c4dc'], [0.5, '#8d86a8'], [1, '#544c6e']], 0.5, 1)}"/>
    <g clip-path="${d.clip('wc', wall)}">
      <path d="${mortar}" stroke="${OUT}" stroke-width="1.6" opacity="0.65" fill="none"/>
      <path d="M5,23.6 L59,23.6 M5,31.6 L59,31.6 M5,39.6 L59,39.6 M5,47.6 L59,47.6 M5,17.6 L59,17.6" stroke="#fff" stroke-width="1.2" opacity="0.4" fill="none"/>
      <path d="M44,22 L59,22 L59,58 L50,58 Z" fill="#000" opacity="0.1"/>
    </g>
    <path d="${wall}" fill="none" ${ol(3)}/>
    <path d="M24,58 L24,48 C24,41 40,41 40,48 L40,58 Z" fill="${d.lin('gt', WOOD, 0.3, 1)}" ${ol(2.4)}/>
    <path d="M29,44 L29,58 M35,44 L35,58" stroke="#5a3218" stroke-width="1.2"/>
    <path d="M10,52 C11,49 14,48 16,50 M50,30 C51,28 54,27.6 55,29" stroke="#6cbf48" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M4.5,58.5 L59.5,58.5" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/>
    ${spark(32, 8, 0.9)}`;
});

S.i_poder = icon((d) => {
  return `<circle cx="32" cy="32" r="31" fill="${d.glow('gl', '#ffe27a', 0.85)}"/>
    <path d="${roundPoly(starPts(32, 32, 27.5, 19.5, 12, -90), 1.2)}" fill="${d.radU('au', [[0, '#fffbe0'], [0.6, '#ffe27a'], [1, '#ffa62a']], 32, 32, 27.5)}" ${ol(2.2)}/>
    ${moonDisc(d, 32, 32, 17.5)}
    ${[[10, 10], [54, 10], [10, 54], [54, 54]].map(([x, y], i) => `<path d="M${x},${y + 3} L${x},${y - 3} M${x - 2.4},${y - 0.6} L${x},${y - 3} L${x + 2.4},${y - 0.6}" stroke="${OUT}" stroke-width="3.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x},${y + 3} L${x},${y - 3} M${x - 2.4},${y - 0.6} L${x},${y - 3} L${x + 2.4},${y - 0.6}" stroke="#fff3a0" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}`;
});

S.i_iman = icon((d) => {
  const U = 'M-9.5,-14 L-9.5,0 A9.5,9.5 0 0 0 9.5,0 L9.5,-14';
  return `<g transform="translate(23 23) rotate(135)">
      <path d="${U}" fill="none" stroke="${OUT}" stroke-width="13" stroke-linecap="butt" stroke-linejoin="round"/>
      <path d="M-9.5,-14.6 L-9.5,-11" stroke="${OUT}" stroke-width="13"/><path d="M9.5,-14.6 L9.5,-11" stroke="${OUT}" stroke-width="13"/>
      <path d="${U}" fill="none" stroke="${d.linU('mg', RED, -16, -10, 16, 10)}" stroke-width="8" stroke-linecap="butt"/>
      <path d="M-9.5,-13 L-9.5,-7 M9.5,-13 L9.5,-7" stroke="${d.linU('sv', SILVER, -14, -14, 14, -6)}" stroke-width="8"/>
      <path d="M-14,-6.4 L-5,-6.4 M5,-6.4 L14,-6.4" stroke="${OUT}" stroke-width="1.4"/>
      <path d="M-11.5,-3 L-11.5,0 A11.5,11.5 0 0 0 -4,10.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
    </g>
    <path d="M33,37 C35,39 37,41 38,44 M37,32 C40,33 42,35 44,37 M28,41 C30,43 31,45 32,48" stroke="#9feaff" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="3 2.4"/>
    ${coinFace(d, 47, 47, 11.5, 2.6)}
    ${spark(57, 32, 0.8)}${spark(33, 58, 0.6)}${spark(8, 54, 0.8)}`;
});

S.i_codicia = icon((d) => {
  const stack = (x, y0, n, rx = 9.5, ry = 3.8) => Array.from({ length: n }, (_, i) => coinTilt(d, x, y0 - i * 4.6, rx, ry, 3)).join('');
  return `<circle cx="32" cy="36" r="28" fill="${d.glow('gl', '#ffd860', 0.5)}"/>
    ${stack(18, 49.5, 6)}${stack(45, 49.5, 4)}
    ${stack(32, 53, 3)}
    ${coinFace(d, 25, 45, 9, 2.3)}
    ${coinFace(d, 43, 47, 8, 2.2)}
    ${sparkO(52, 18, 0.9, '#fff3a0')}${spark(30, 14, 0.8)}${spark(8, 32, 0.6)}`;
});

S.i_sabio = icon((d) => {
  const paper = 'M14,12 L50,12 L50,52 C46,50 42,54 38,52 C34,50 30,54 26,52 C22,50 18,54 14,52 Z';
  const roll = (y) => `<rect x="9" y="${y}" width="46" height="8.4" rx="4.2" fill="${d.lin('rl', [[0, '#fff1c8'], [0.5, '#e2bf7a'], [1, '#a5793c']], 0, 1)}" ${ol(2.4)}/>
    <ellipse cx="9.6" cy="${y + 4.2}" rx="2.4" ry="4.2" fill="${d.lin('rc', WOOD, 0, 1)}" ${ol(1.8)}/><ellipse cx="54.4" cy="${y + 4.2}" rx="2.4" ry="4.2" fill="${d.lin('rc', WOOD, 0, 1)}" ${ol(1.8)}/>
    ${hl(`M13,${y + 2.4} L50,${y + 2.4}`, 1.3, 0.75)}`;
  return `<path d="${paper}" fill="${d.lin('pp', PARCH, 0.4, 1)}" ${ol(2.6)}/>
    <path d="${crescentD(25, 25, 6.5, 3.4, -2.4, 5.6)}" fill="#3b4f8f"/>
    ${[[33, 21, 44], [33, 26, 42], [19, 33, 45], [19, 38, 42], [19, 43, 38]].map(([x0, y, x1]) => `<path d="M${x0},${y} L${x1},${y}" stroke="#8a6438" stroke-width="2" stroke-linecap="round"/>`).join('')}
    <path d="M42,52 L42,60 L45,57.4 L48,60 L48,52 Z" fill="#d8434e" ${ol(1.6)}/>
    ${roll(5)}${roll(47)}
    <circle cx="45" cy="50.8" r="4" fill="${d.lin('sl', RED, 0.3, 1)}" ${ol(1.8)}/><circle cx="45" cy="50.8" r="1.6" fill="#ff9a92"/>
    ${spark(57, 26, 0.8)}`;
});

S.i_manantial = icon((d) => {
  const drop = 'M32,3.5 C40,15 52,27 52,40 C52,52 43,60 32,60 C21,60 12,52 12,40 C12,27 24,15 32,3.5 Z';
  const heart = 'M32,51 C24,45 20,40.5 20,36 C20,32 23,29.5 26,29.5 C29,29.5 31,31.4 32,33.4 C33,31.4 35,29.5 38,29.5 C41,29.5 44,32 44,36 C44,40.5 40,45 32,51 Z';
  return `<circle cx="32" cy="38" r="26" fill="${d.glow('gl', '#7fe8ff', 0.4)}"/>
    <path d="${drop}" fill="${d.rad('dr', [[0, '#e6fdff'], [0.4, '#5cd0f6'], [1, '#1c66c0']], 0.35, 0.35, 0.8)}" ${ol(3)}/>
    <path d="${heart}" fill="${d.lin('ht', [[0, '#ffc0cc'], [0.5, '#ff5a7a'], [1, '#c4204a']], 0.3, 1)}" ${ol(2.4)}/>
    ${hl('M23.5,33 C24,31.6 25.4,31 26.6,31.2', 1.6, 0.85)}
    ${hl('M27,13 C23,19 18,26 16.5,34', 2.6, 0.75)}
    <circle cx="54" cy="16" r="2.4" fill="#bff0ff" ${ol(1.2)}/><circle cx="9" cy="16" r="1.7" fill="#bff0ff" ${ol(1)}/>
    ${spark(53, 50, 0.9)}`;
});

S.i_motor = icon((d) => {
  const n = 10, pts = [];
  for (let i = 0; i < n; i++) { const a0 = rd(i * 36 - 90); for (const [o, R] of [[-11, 21], [-6.5, 27], [6.5, 27], [11, 21]]) pts.push([32 + Math.cos(a0 + rd(o)) * R, 32 + Math.sin(a0 + rd(o)) * R]); }
  const gear = roundPoly(pts, 1.2);
  const hole = `<circle cx="32" cy="32" r="12.5"/>`;
  return `<path d="${gear}" fill="${d.lin('gr', [[0, '#e6e9f4'], [0.45, '#9aa3bc'], [1, '#4f5674']], 0.4, 1)}" ${ol(2.8)}/>
    <circle cx="32" cy="32" r="17" fill="none" stroke="#4f5674" stroke-width="1.3" opacity="0.7"/>
    ${[0, 1, 2, 3, 4, 5].map(i => { const a = rd(i * 60 + 30); return `<circle cx="${f2(32 + Math.cos(a) * 18.8)}" cy="${f2(32 + Math.sin(a) * 18.8)}" r="1.3" fill="#4f5674"/>`; }).join('')}
    <circle cx="32" cy="32" r="12.5" fill="${d.lin('sk', [[0, '#bff2ff'], [1, '#5ab8ee']], 0, 1)}"/>
    <g clip-path="${d.clip('hc', hole)}">
      <path d="M18,33 C22,28 26,28 29,32 C32,36 36,36 39,31 C41,28 44,28 47,31 L47,48 L18,48 Z" fill="${d.lin('wv', WATER, 0.2, 1)}" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M21,33 C23,30.4 26,30.4 28,33" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </g>
    <circle cx="32" cy="32" r="12.5" fill="none" ${ol(2.4)}/>
    ${hlArc(32, 32, 24.5, 200, 250, 1.8, 0.7)}
    ${spark(56, 56, 0.8)}`;
});

S.i_baraja = icon((d) => {
  const card = (rot, sym) => `<g transform="rotate(${rot} 32 62)"><rect x="20" y="12" width="24" height="36" rx="3.4" fill="${d.lin('cd', [[0, '#ffffff'], [1, '#e6dcc4']], 0.3, 1)}" ${ol(2.6)}/>
    <rect x="23" y="15" width="18" height="30" rx="2" fill="none" stroke="${sym[1]}" stroke-width="1.2" opacity="0.6"/><g transform="translate(0 4)">${sym[0]}</g></g>`;
  const star = `<path d="${roundStar(32, 26, 7.5, 3.6, 0.8)}" fill="${d.lin('gs', GOLD, 0.35, 1)}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const moon = `<path d="${crescentD(31, 26, 7.5, 3.6, -2.6, 6.4)}" fill="${d.lin('mn', [[0, '#c4d4ff'], [1, '#4a5ad0']], 0.3, 1)}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const heart = `<path d="M32,32 C27.5,28.5 25,26 25,23 C25,20.6 27,19 29,19 C30.6,19 31.4,20 32,21.2 C32.6,20 33.4,19 35,19 C37,19 39,20.6 39,23 C39,26 36.5,28.5 32,32 Z" fill="${d.lin('ht', RED, 0.3, 1)}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>`;
  return `${card(-18, [heart, '#d8434e'])}${card(18, [moon, '#4a5ad0'])}${card(0, [star, '#e09a1e'])}
    ${hl('M22.4,17 L22.4,34', 1.4, 0.8)}
    ${spark(54, 9, 0.9)}${spark(10, 9, 0.7)}`;
});

S.i_coraza = icon((d) => {
  const shield = 'M32,5 C40,9.5 49,10.5 56,9.5 C57.5,31 50,47.5 32,59.5 C14,47.5 6.5,31 8,9.5 C15,10.5 24,9.5 32,5 Z';
  const inner = 'M32,9 C38.6,12.4 45.6,13.6 51.4,13.2 C51.6,31 45.6,44.6 32,54.8 C18.4,44.6 12.4,31 12.6,13.2 C18.4,13.6 25.4,12.4 32,9 Z';
  const ribs = [-50, -25, 0, 25, 50].map(a => { const A = rd(a - 90); return `M32,42 L${P([32 + Math.cos(A) * 14.5, 40 + Math.sin(A) * 14.5])}`; }).join(' ');
  const shell = 'M32,42.5 C27,42.5 19,36 19,30 C19,24 25,20.5 32,20.5 C39,20.5 45,24 45,30 C45,36 37,42.5 32,42.5 Z';
  return `<path d="${shield}" fill="${d.lin('gd', GOLD, 0.4, 1)}" ${ol(3)}/>
    <path d="${inner}" fill="${d.lin('bl', [[0, '#6fd2ff'], [0.5, '#2a7ad0'], [1, '#183e8e']], 0.4, 1)}" stroke="#a8620f" stroke-width="1.4"/>
    <path d="M32,9 L32,54.8 C18.4,44.6 12.4,31 12.6,13.2 C18.4,13.6 25.4,12.4 32,9 Z" fill="#fff" opacity="0.12"/>
    <path d="${shell}" fill="${d.lin('sh', [[0, '#fff6ea'], [0.6, '#ffc8a8'], [1, '#e8876a']], 0.3, 1)}" ${ol(2.2)}/>
    <g clip-path="${d.clip('sc', shell)}"><path d="${ribs}" stroke="#d26e52" stroke-width="1.4"/></g>
    <path d="M27,42 L28,46.5 L36,46.5 L37,42 Z" fill="#ffc8a8" ${ol(1.8)}/>
    ${hl('M23.5,26 C25,23.6 28,22.6 31,22.6', 1.6, 0.85)}
    ${hl('M11.5,12 C11.5,26 15,37 22,46', 1.6, 0.5)}`;
});

S.i_critico = icon((d) => {
  const ticks = 'M32,7.2 L32,17 M32,47 L32,56.8 M7.2,32 L17,32 M47,32 L56.8,32';
  return `<circle cx="32" cy="32" r="20" fill="none" stroke="${OUT}" stroke-width="8"/>
    <path d="${ticks}" stroke="${OUT}" stroke-width="7.4" stroke-linecap="round"/>
    <circle cx="32" cy="32" r="20" fill="none" stroke="${d.linU('rc', RED, 10, 10, 54, 54)}" stroke-width="4.4"/>
    <path d="${ticks}" stroke="${d.linU('rc', RED, 10, 10, 54, 54)}" stroke-width="3.8" stroke-linecap="round"/>
    ${hl(arcD(32, 32, 20, 200, 250), 1.4, 0.7)}
    <circle cx="32" cy="32" r="12" fill="${d.glow('sg', '#fff2a0', 0.9)}"/>
    <path d="${roundPoly(starPts(32, 32, 11, 4, 4, -90), 0.8)}" fill="${d.lin('sp', FIRE, 0.3, 1)}" ${ol(2)}/>
    <path d="${roundPoly(starPts(32, 32, 6.5, 2.6, 4, -45), 0.6)}" fill="#fff6c0" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
    ${spark(50, 12, 0.8)}`;
});

S.i_arsenal = icon((d) => {
  const blade = 'M-3.4,-2 L-3.8,-24 C-4,-31 1,-36.5 7.8,-39.6 C5.2,-32 5.6,-22 4.4,-2 Z';
  const sabre = `<path d="M-2,2 L-2,10 L2,10 L2,2 Z" fill="#5a3218" ${ol(1.8)}/>
      <path d="${blade}" fill="${d.lin('bl', SILVER, 0.6, 1)}" ${ol(2.2)}/>
      <path d="M-1,-4 L-1.2,-24 C-1.2,-29 1,-33 4,-35.5" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.8"/>
      <path d="M-6.5,-2.8 C-6.5,-0.4 6.5,-0.4 6.5,-2.8 L5.6,1.4 C2,3 -2,3 -5.6,1.4 Z" fill="${d.lin('gd', GOLD, 0.3, 1)}" ${ol(1.7)}/>
      <path d="M5.6,0.8 C9,4 7,10 2,11" fill="none" stroke="${OUT}" stroke-width="3.4" stroke-linecap="round"/><path d="M5.6,0.8 C9,4 7,10 2,11" fill="none" stroke="#ffcf3a" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="0" cy="11.6" r="2.4" fill="${d.lin('gd', GOLD, 0.3, 1)}" ${ol(1.3)}/>`;
  return `<g transform="translate(18 43.5) scale(1.12) rotate(31)">${sabre}</g>
    <g transform="translate(46 43.5) scale(-1.12 1.12) rotate(31)">${sabre}</g>
    <circle cx="32" cy="51" r="8" fill="${d.lin('pl', GREEN, 0.3, 1)}" ${ol(2.4)}/>
    <path d="M32,46.5 L32,55.5 M27.5,51 L36.5,51" stroke="${OUT}" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M32,46.5 L32,55.5 M27.5,51 L36.5,51" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    ${spark(32, 8, 0.9)}`;
});

S.i_roca = icon((d) => {
  const rock = 'M5,57 L9,40 L17,30 L27,27 L36,15 L55,5 L50,19 L57,31 L59,45 L57,57 Z';
  return `<path d="${rock}" fill="${d.lin('rk', ROCK, 0.5, 1)}" ${ol(3)}/>
    <path d="M27,27 L36,15 L55,5 L40,26 Z" fill="#d8d4ea" opacity="0.9"/>
    <path d="M40,26 L55,5 L50,19 L57,31 L44,36 Z" fill="#544c6e" opacity="0.55"/>
    <path d="M17,30 L27,27 L40,26 L44,36 L30,40 L9,40 Z" fill="#fff" opacity="0.12"/>
    <path d="M44,36 L57,31 L59,45 L57,57 L40,57 Z" fill="#2c2540" opacity="0.3"/>
    <path d="M27,27 L40,26 L44,36 M30,40 L44,36" stroke="${OUT}" stroke-width="1.3" fill="none" opacity="0.5"/>
    <path d="M28.5,25.4 L36.5,15 L52,6.6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5,57 C10,50 16,50 22,53 C26,49 31,49 35,53 L35,57 Z" fill="${d.lin('ms', MOSS, 0.3, 1)}" ${ol(2)}/>
    ${[[12, 48], [20, 45], [48, 50]].map(([x, y]) => `<path d="M${x - 2.8},${y + 1.6} L${x - 1.2},${y - 1.8} L${x + 1.2},${y - 1.8} L${x + 2.8},${y + 1.6} Z" fill="#e6dccc" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${x - 0.9},${y - 1.2} L${x + 0.9},${y - 1.2}" stroke="#8a8098" stroke-width="1.1" stroke-linecap="round"/>`).join('')}
    <path d="M4.5,58 L59.5,58" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/>
    ${spark(51, 9.5, 1.1)}${spark(36, 14, 0.7)}`;
});
// ================================================================= REEF TIERS (small reef pictures on a sandy bed)
function reefBed(d) {
  return `<path d="M5.5,59.5 C5.5,53 12,49 20,49.5 C26,47 38,47 44,49.5 C52,49 58.5,53 58.5,59.5 Z" fill="${d.lin('sand', [[0, '#ffe7b0'], [0.6, '#e8c07a'], [1, '#b98a4a']], 0.3, 1)}" ${ol(2.6)}/>
    ${hl('M9,55 C11,52.5 15,51.4 19,51.6', 1.4, 0.6)}
    <ellipse cx="50" cy="56" rx="2.4" ry="1.4" fill="#c99a5a"/><ellipse cx="16" cy="57.4" rx="1.8" ry="1.1" fill="#c99a5a"/>`;
}
const bubbles = (arr) => arr.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#dff8ff" stroke="${OUT}" stroke-width="${f2(Math.min(1.2, 0.5 + r * 0.3))}"/>`).join('');

S.i_reef0 = icon((d) => {
  const g = d.lin('rk', [[0, '#a6a0bc'], [0.5, '#625b7c'], [1, '#2f2944']], 0.5, 1);
  return `${reefBed(d)}
    <path d="M30,52 L35,22 L40,30 L46,14 L52,34 L56,52 Z" fill="${g}" ${ol(2.8)}/>
    <path d="M46,14 L52,34 L56,52 L47,52 L45,30 Z" fill="#231d36" opacity="0.4"/><path d="M35,22 L40,30 L38,52 L33,52 Z" fill="#231d36" opacity="0.25"/>
    <path d="M8,52 L14,30 L19,36 L26,8 L33,30 L37,52 Z" fill="${g}" ${ol(3)}/>
    <path d="M26,8 L33,30 L37,52 L27,52 L25,30 Z" fill="#231d36" opacity="0.4"/>
    <path d="M24,14 L17.5,37 M13.5,34 L10.5,46" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
    <path d="M44,20 L39,33" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
    <path d="M18,52 C20,47 24,46 27,49 C29,46 33,46 35,50 Z" fill="${d.lin('ms', MOSS, 0.3, 1)}" ${ol(1.6)}/>
    ${bubbles([[50, 8, 2], [55, 4.5, 1.3]])}`;
});

S.i_reef1 = icon((d) => {
  const bl = [tube(30, 50, 22, 36, 9, 16, 9, 0.4), tube(32, 50, 30, 30, 26, 6, 9, 0.4), tube(34, 50, 40, 30, 46, 9, 9, 0.4), tube(35, 50, 47, 40, 56, 24, 8, 0.4), tube(29, 50, 18, 46, 7, 36, 7, 0.4)];
  return `${reefBed(d)}
    ${uni(bl, d.linU('bc', [[0, '#fff0a0'], [0.35, '#ffa040'], [0.8, '#e8463a'], [1, '#a82040']], 20, 6, 36, 52), 2.4)}
    ${[[22, 36, 10, 17], [30, 30, 26.5, 8], [40, 30, 45.5, 11], [47, 40, 55, 25.5], [18, 46, 8.5, 37]].map(([x0, y0, x1, y1]) => `<path d="M${x0},${y0} L${f2(x0 + (x1 - x0) * 0.75)},${f2(y0 + (y1 - y0) * 0.75)}" stroke="#a82040" stroke-width="1.2" opacity="0.55" stroke-linecap="round"/>`).join('')}
    ${hl('M22,40 C17,32 13,25 10.5,19', 1.3, 0.7)}${hl('M29,36 C28,25 27.5,16 26.5,9', 1.3, 0.7)}
    <ellipse cx="32" cy="51" rx="7" ry="3" fill="#8a6438" ${ol(1.8)}/>
    ${bubbles([[54, 10, 1.8], [58, 5, 1.2]])}`;
});

S.i_reef2 = icon((d) => {
  const ten = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8, bx = 23.5 + t * 17, a = -144 + t * 108, A = rd(a), L = 24 - Math.abs(t - 0.5) * 12;
    const tx = bx + Math.cos(A) * L, ty = 38 + Math.sin(A) * L;
    ten.push([tube(bx, 38, bx + Math.cos(A) * L * 0.5 + (i % 2 ? 4 : -4), 38 + Math.sin(A) * L * 0.5, tx, ty, 5, 2.2), tx, ty]);
  }
  const zz = 'M9,13 L13,16 L10,18 L14,21 M55,11 L51,15 L54,17 L50,21';
  return `<circle cx="32" cy="28" r="26" fill="${d.glow('gl', '#7fe8ff', 0.5)}"/>
    ${reefBed(d)}
    ${uni(ten.map(t => t[0]), d.linU('tn', [[0, '#fffbd0'], [0.4, '#7fe8ff'], [1, '#3a8fe0']], 32, 10, 32, 38), 2)}
    ${ten.map(([, x, y]) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="2.4" fill="#ffe94a" ${ol(1.3)}/>`).join('')}
    <path d="M22,53 C20,47 21,42 23,38.5 L41,38.5 C43,42 44,47 42,53 Z" fill="${d.lin('bd', [[0, '#e6a6ff'], [0.5, '#a858e0'], [1, '#5c2a9a']], 0.4, 1)}" ${ol(2.6)}/>
    <ellipse cx="32" cy="38.6" rx="9.8" ry="2.8" fill="#7a3ab8" ${ol(1.8)}/>
    <path d="M26,42 L26,50 M30.6,42 L30.6,51 M35.4,42 L35.4,51 M38.4,42 L38.4,50" stroke="#5c2a9a" stroke-width="1.3" opacity="0.6" stroke-linecap="round"/>
    ${hl('M24.6,42 C23.6,45 23.6,48 24,51', 1.6, 0.6)}
    <g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${zz}" stroke="${OUT}" stroke-width="4"/><path d="${zz}" stroke="#ffe94a" stroke-width="2"/></g>`;
});

S.i_reef3 = icon((d) => {
  const scal = (y0, up) => { let p = ''; for (let i = 0; i <= 6; i++) { const x = 6 + i * 52 / 6; p += i === 0 ? `M${x},${y0}` : ` Q${f2(x - 52 / 12)},${y0 + (up ? -3 : 3)} ${f2(x)},${y0}`; } return p; };
  const lid = `M6,34 C6,16 18,7 32,7 C46,7 58,16 58,34 ${scal(34, false).replace(/^M[^ ]+/, '').split(' Q').reverse().length ? '' : ''} Z`;
  const lidD = 'M6,34 C6,17 18,8 32,8 C46,8 58,17 58,34 Q55.8,31 53.7,34 Q51.5,31 49.3,34 Q47.2,31 45,34 Q42.8,31 40.7,34 Q38.5,31 36.3,34 Q34.2,31 32,34 Q29.8,31 27.7,34 Q25.5,31 23.3,34 Q21.2,31 19,34 Q16.8,31 14.7,34 Q12.5,31 10.3,34 Q8.2,31 6,34 Z';
  const bowl = 'M5,36 Q7.2,39 9.3,36 Q11.5,39 13.7,36 Q15.8,39 18,36 Q20.2,39 22.3,36 Q24.5,39 26.7,36 Q28.8,39 31,36 Q33.2,39 35.3,36 Q37.5,39 39.7,36 Q41.8,39 44,36 Q46.2,39 48.3,36 Q50.5,39 52.7,36 Q54.8,39 57,36 Q58.6,39 59,36 C59,49 47,57 32,57 C17,57 5,49 5,36 Z';
  const sh = d.lin('sh', [[0, '#d8c6ff'], [0.5, '#8a6ae0'], [1, '#4a2f9a']], 0.4, 1);
  return `<path d="${lidD}" fill="${sh}" ${ol(2.8)}/>
    <path d="M32,10 L32,32 M20,13 L23,32 M44,13 L41,32 M11,22 L15,32 M53,22 L49,32" stroke="#4a2f9a" stroke-width="1.6" opacity="0.6"/>
    <path d="M9,31 C9,20 18,11 30,10.4" fill="none" stroke="#fff" stroke-width="1.8" opacity="0.6" stroke-linecap="round"/>
    <path d="M9,35 C14,30 50,30 55,35 C50,40 14,40 9,35 Z" fill="#f6b8d8" ${ol(1.8)}/>
    <circle cx="32" cy="34" r="12" fill="${d.glow('pg', '#ffffff', 0.9)}"/>
    <circle cx="32" cy="33" r="7.2" fill="${d.rad('pl', [[0, '#ffffff'], [0.6, '#f2ecff'], [1, '#b8a8e0']], 0.35, 0.3, 0.8)}" ${ol(2.2)}/>
    <circle cx="29.6" cy="30.6" r="2" fill="#fff"/>
    <path d="${bowl}" fill="${sh}" ${ol(2.8)}/>
    <path d="M32,40 L32,55 M21,39 L23,54 M43,39 L41,54 M12,39 L15,49 M52,39 L49,49" stroke="#4a2f9a" stroke-width="1.6" opacity="0.55"/>
    ${hl('M9,42 C11,48 16,52 22,54', 1.6, 0.5)}
    ${spark(46, 22, 1.1)}${spark(54, 7, 0.7)}`;
});

S.i_reef4 = icon((d) => {
  const cone = 'M10,54 L22,30 C24,27 27,26 28,26 L36,26 C37,26 40,27 42,30 L54,54 Z';
  const plume = ['<circle cx="32" cy="16.5" r="7.6"/>', '<circle cx="24" cy="20" r="5.8"/>', '<circle cx="40" cy="19.5" r="6.2"/>', '<circle cx="30" cy="11" r="4.8"/>', tube(32, 28, 31, 23, 32, 17, 9, 7)];
  return `<circle cx="32" cy="30" r="26" fill="${d.glow('gl', '#ff6a2a', 0.5)}"/>
    ${uni(plume, d.linU('pm', [[0, '#ffffff'], [0.6, '#d6f0ff'], [1, '#8fc4e8']], 22, 3, 40, 28), 2.4)}
    ${hl(arcD(32, 16.5, 5.2, 195, 260), 1.6, 0.9)}
    ${bubbles([[18, 9, 1.7], [46, 7, 1.5], [50, 22, 1.2]])}
    ${reefBed(d)}
    <path d="${cone}" fill="${d.lin('cn', [[0, '#8a7a9a'], [0.5, '#4a3e5c'], [1, '#231a30']], 0.5, 1)}" ${ol(3)}/>
    <ellipse cx="32" cy="27" rx="6" ry="2.2" fill="#ff8a2a" ${ol(1.6)}/>
    <path d="M30,29 L27,37 L30,41 L26,50 M36,30 L39,38 L36,43 L41,52 M20,44 L24,47" stroke="${OUT}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M30,29 L27,37 L30,41 L26,50 M36,30 L39,38 L36,43 L41,52 M20,44 L24,47" stroke="#ffb03a" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${hl('M21,34 L14,49', 1.6, 0.4)}`;
});

// ================================================================= MISC
const heartD = 'M32,57 C18,47.5 5.5,37.5 5.5,23 C5.5,14 12.5,7.5 20.5,7.5 C26,7.5 30,10.5 32,15 C34,10.5 38,7.5 43.5,7.5 C51.5,7.5 58.5,14 58.5,23 C58.5,37.5 46,47.5 32,57 Z';
S.i_vida = icon((d) => `<path d="${heartD}" fill="${d.rad('ht', [[0, '#ffb8b8'], [0.4, '#ff3d55'], [1, '#a0102e']], 0.32, 0.3, 0.85)}" ${ol(3.2)}/>
    <ellipse cx="18.5" cy="19" rx="5.4" ry="3.6" transform="rotate(-35 18.5 19)" fill="#fff" opacity="0.75"/>
    <circle cx="13" cy="28" r="1.8" fill="#fff" opacity="0.6"/>
    ${hl('M47,13 C51,15 53.4,19 53.4,23', 1.6, 0.35)}
    ${spark(55, 52, 0.9)}`);

S.i_monedas = icon((d) => {
  const bag = 'M15,58.5 C5,53 5,40 15,32.5 L20,28 C17,25 15.5,22 16,19 C24,21 40,21 48,19 C48.5,22 47,25 44,28 L49,32.5 C59,40 59,53 49,58.5 Z';
  return `<path d="${bag}" fill="${d.lin('bg', [[0, '#e8c48a'], [0.5, '#b8844a'], [1, '#6e4524']], 0.4, 1)}" ${ol(3)}/>
    <path d="M14,37 C10,44 11,51 16,55" stroke="#fff" stroke-width="2" fill="none" opacity="0.4" stroke-linecap="round"/>
    <path d="M24,32 C24,42 22,50 22,57 M40,32 C40,42 42,50 42,57" stroke="#7a4e28" stroke-width="1.3" fill="none" opacity="0.5"/>
    <ellipse cx="32" cy="19.5" rx="16" ry="5" fill="#3a2414" ${ol(2.4)}/>
    <path d="M17.4,19 C19,10 26,6 32,6 C38,6 45,10 46.6,19 C40,22 24,22 17.4,19 Z" fill="${d.lin('hp', GOLD, 0.3, 1)}" ${ol(2.4)}/>
    ${[[25, 13], [33, 10], [40, 15], [29, 17.5], [37, 19]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.8" fill="#ffe27a" stroke="#c27414" stroke-width="1"/>`).join('')}
    ${hl('M21,16 C23,11 27,8.6 31,8', 1.4, 0.8)}
    <path d="M18,28.5 C26,31.5 38,31.5 46,28.5" stroke="${OUT}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M18,28.5 C26,31.5 38,31.5 46,28.5" stroke="#d8434e" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    ${coinFace(d, 47, 51, 8, 2.2)}
    ${coinTilt(d, 19, 54.5, 7.5, 3, 2.4, 1.8)}
    ${sparkO(55, 13, 0.85, '#fff3a0')}${spark(9, 24, 0.7)}`;
});

S.i_perla = icon((d) => {
  const SHELL = [[0, '#ffe6ef'], [0.5, '#f5a3c1'], [1, '#b0507f']];
  const lid = 'M9,33 C9,17 19,6 32,6 C45,6 55,17 55,33 C47,30 40,29 32,29 C24,29 17,30 9,33 Z';
  const bowl = 'M6,41 C7,53 19,60 32,60 C45,60 57,53 58,41 C50,46 42,47.5 32,47.5 C22,47.5 14,46 6,41 Z';
  const ribs = (cx, cy, r0, r1, a0, a1, n) => Array.from({ length: n }, (_, i) => { const a = rd(a0 + (a1 - a0) * (i + 0.5) / n); return `M${P([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0])} L${P([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1])}`; }).join(' ');
  return `<circle cx="32" cy="36" r="30" fill="${d.glow('gl', '#f4e2ff', 0.5)}"/>
    <path d="${lid}" fill="${d.lin('ld', SHELL, 0.3, 1)}" ${ol(3)}/>
    <path d="${ribs(32, 33, 6, 25, 200, 340, 6)}" stroke="#a24a76" stroke-width="1.5" opacity="0.55" stroke-linecap="round"/>
    ${hl('M14,24 C16,15 22,10 29,9', 2, 0.7)}
    <ellipse cx="32" cy="42" rx="25" ry="6.5" fill="#7c2f5a" ${ol(2.4)}/>
    <circle cx="32" cy="36" r="12" fill="${d.rad('pr', [[0, '#ffffff'], [0.4, '#f1e4ff'], [0.8, '#c4a9e8'], [1, '#8a6cc2']], 0.36, 0.3, 0.75)}" ${ol(2.6)}/>
    <ellipse cx="27.5" cy="31.5" rx="4" ry="2.6" fill="#fff" opacity="0.9" transform="rotate(-35 27.5 31.5)"/>
    <path d="M36,45 C40,43 42.5,40 43.5,36" stroke="#fbe9ff" stroke-width="1.6" fill="none" opacity="0.8" stroke-linecap="round"/>
    <path d="${bowl}" fill="${d.lin('bw', SHELL, 0.25, 1)}" ${ol(3)}/>
    <path d="${ribs(32, 20, 29, 38.5, 62, 118, 5)}" stroke="#a24a76" stroke-width="1.5" opacity="0.55" stroke-linecap="round"/>
    ${hl('M11,46 C14,52 19,55.5 24,57', 1.8, 0.55)}
    ${sparkO(52, 14, 0.8, '#fff3fb')}${spark(11, 12, 0.7)}`;
});

S.i_coin = icon((d) => {
  const notches = Array.from({ length: 24 }, (_, i) => { const a = rd(i * 15); return `M${P([32 + Math.cos(a) * 25.2, 32 + Math.sin(a) * 25.2])} L${P([32 + Math.cos(a) * 27, 32 + Math.sin(a) * 27])}`; }).join(' ');
  return `<circle cx="32" cy="32" r="31" fill="${d.glow('gl', '#ffd860', 0.45)}"/>
    ${coinFace(d, 32, 32, 27, 3)}
    <path d="${notches}" stroke="#b5620f" stroke-width="1.3" opacity="0.7"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = rd(i * 45 + 22.5); return `<circle cx="${f2(32 + Math.cos(a) * 22.6)}" cy="${f2(32 + Math.sin(a) * 22.6)}" r="1.1" fill="#fff2a8" stroke="#b5620f" stroke-width="0.7"/>`; }).join('')}
    ${spark(50, 14, 1.3)}`;
});

S.i_cofre = icon((d) => {
  const wood = d.lin('wd', WOOD, 0.3, 1), gold = d.lin('gd', GOLD, 0.3, 1);
  return `<circle cx="32" cy="36" r="29" fill="${d.glow('gl', '#ffd860', 0.45)}"/>
    <path d="M7,33 L57,33 L57,55 C57,57.5 55.5,59 53,59 L11,59 C8.5,59 7,57.5 7,55 Z" fill="${wood}" ${ol(3)}/>
    <path d="M7,33 C7,18 15,11 32,11 C49,11 57,18 57,33 Z" fill="${d.lin('ld', [[0, '#e0a464'], [0.6, '#a0602f'], [1, '#6e3e1e']], 0.3, 1)}" ${ol(3)}/>
    <path d="M7,45 L57,45 M10,25 C18,23.5 46,23.5 54,25" stroke="#5a3218" stroke-width="1.4" fill="none" opacity="0.7"/>
    ${hl('M11,29 C11,21 17,15.6 27,14.4', 2, 0.55)}
    <path d="M12,59 L12,33 M52,59 L52,33" stroke="${OUT}" stroke-width="7.6"/><path d="M12,58 L12,33.6 M52,58 L52,33.6" stroke="${gold}" stroke-width="4.4"/>
    <path d="M12,33 C12,22 15,15 20,12.6 M52,33 C52,22 49,15 44,12.6" stroke="${OUT}" stroke-width="7.6" fill="none"/><path d="M12,32.4 C12,22 15,15.6 20,13.4 M52,32.4 C52,22 49,15.6 44,13.4" stroke="${gold}" stroke-width="4.4" fill="none"/>
    <rect x="5.5" y="30.6" width="53" height="5" rx="2" fill="${gold}" ${ol(2)}/>
    <path d="M25.5,29 L38.5,29 L38.5,40 C38.5,44 35,46 32,46 C29,46 25.5,44 25.5,40 Z" fill="${gold}" ${ol(2.2)}/>
    <circle cx="32" cy="36" r="2.4" fill="${OUT}"/><path d="M31,37 L30.4,41 L33.6,41 L33,37 Z" fill="${OUT}"/>
    ${hl('M27.4,31 L36.6,31', 1.2, 0.8)}
    ${sparkO(56, 10, 0.9, '#fff3a0')}${spark(8, 12, 0.8)}`;
});

// islands sit on a strip of sea
function islandSea(d, dark) {
  const g = dark ? d.lin('sd', [[0, '#7a5ad8'], [0.5, '#3a2a8a'], [1, '#1c1450']], 0, 1) : d.lin('sw', [[0, '#5fd4f6'], [0.5, '#2a86d0'], [1, '#1c4e9c']], 0, 1);
  return `<path d="M4.5,50 Q9.1,47.6 13.7,50 Q18.3,52.4 22.9,50 Q27.5,47.6 32,50 Q36.6,52.4 41.1,50 Q45.7,47.6 50.3,50 Q54.9,52.4 59.5,50 L59.5,57 Q59.5,59.5 57,59.5 L7,59.5 Q4.5,59.5 4.5,57 Z" fill="${g}" ${ol(2.6)}/>
    <path d="M7,55 C10,53.6 13,53.6 16,55 M44,56 C47,54.6 50,54.6 53,56" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.55"/>`;
}
S.i_isla0 = icon((d) => {
  const fr = (a, L, dr) => { const A = rd(a), tx = 36 + Math.cos(A) * L, ty = 18 + Math.sin(A) * L; return tube(36, 18, 36 + Math.cos(A) * L * 0.55, 18 + Math.sin(A) * L * 0.55 - dr, tx, ty, 6.4, 0.8); };
  const leaves = [fr(-172, 21, 5), fr(-128, 14, 4.5), fr(-58, 13.5, 4.5), fr(-10, 20, 5), fr(25, 14, 3), fr(155, 15, 3)];
  return `${islandSea(d)}
    <path d="M8,51 C10,42 20,38 32,38 C44,38 54,42 56,51 Z" fill="${d.lin('sa', [[0, '#fff0b8'], [0.6, '#f0cc7a'], [1, '#c4964a']], 0.3, 1)}" ${ol(2.8)}/>
    ${hl('M13,46 C16,42.4 22,40.6 28,40.4', 1.6, 0.7)}
    <path d="M28,44 C27,35 30,25 36,18" fill="none" stroke="${OUT}" stroke-width="7"/>
    <path d="M28,44 C27,35 30,25 36,18" fill="none" stroke="${d.linU('tr', [[0, '#d8a060'], [1, '#8a5a2e']], 26, 20, 36, 40)}" stroke-width="4"/>
    <path d="M27.4,38.5 L31,37.5 M27.7,33 L31.4,32.4 M29,27.6 L32.6,27.6 M31.4,23 L34.6,23.4" stroke="#6a4020" stroke-width="1.2"/>
    ${uni(leaves, d.linU('lf', [[0, '#c8f58a'], [0.5, '#52c060'], [1, '#1e7a3e']], 30, 6, 40, 30), 2.2)}
    <circle cx="34" cy="21" r="2.6" fill="#7a4a22" ${ol(1.3)}/><circle cx="38.4" cy="21.6" r="2.4" fill="#7a4a22" ${ol(1.3)}/>
    
    ${spark(54, 10, 0.9)}`;
});

S.i_isla1 = icon((d) => {
  const ice = d.lin('ic', ICE, 0.4, 1);
  return `${islandSea(d)}
    <path d="M7,51 L13,36 L19,40 L27,16 L34,32 L40,24 L50,40 L54,38 L58,51 Z" fill="${ice}" ${ol(2.8)}/>
    <path d="M27,16 L34,32 L30,51 L26,51 L25,30 Z" fill="#2f7cc8" opacity="0.35"/><path d="M40,24 L50,40 L48,51 L42,51 L41,36 Z" fill="#2f7cc8" opacity="0.3"/>
    <path d="M27,16 L22,30.5 L25.6,28.4 L28,32 L31,27.4 L33.6,30.8 Z" fill="#fff" stroke="${OUT}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M40,24 L36.5,30.4 L39.6,29.2 L42,32 L44.4,29.8 L46.6,33.4 Z" fill="#fff" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
    ${hl('M25,22 L16,44', 1.6, 0.6)}
    <path d="M9,51 C12,47 20,46 26,48 C32,45.6 44,45.6 50,48 C53,47 56,48.6 57,51 Z" fill="#fff" ${ol(2)}/>
    ${spark(54, 12, 0.9)}${spark(12, 18, 0.7)}`;
});

S.i_isla2 = icon((d) => {
  const vol = 'M6,51 L20,24 C22,21 24,20 26,20 L38,20 C40,20 42,21 44,24 L58,51 Z';
  return `<circle cx="32" cy="20" r="18" fill="${d.glow('gl', '#ff7a2a', 0.6)}"/>
    ${uni(['<circle cx="27" cy="14" r="5.6"/>', '<circle cx="35" cy="11.5" r="6"/>', '<circle cx="42.6" cy="14" r="4.6"/>', '<circle cx="20.4" cy="16.6" r="3.6"/>'], d.lin('sm', [[0, '#e6e2f0'], [1, '#8a84a2']], 0.3, 1), 2.2)}
    ${hl(arcD(35, 11.5, 3.8, 200, 260), 1.4, 0.8)}
    ${islandSea(d)}
    <path d="${vol}" fill="${d.lin('vl', [[0, '#b2826a'], [0.5, '#6e4a46'], [1, '#3a2434']], 0.5, 1)}" ${ol(3)}/>
    <path d="M38,20 L44,24 L58,51 L44,51 Z" fill="#231626" opacity="0.3"/>
    <path d="M24,20.5 C24,26 27,27 27,31 C27,35 24,37 25,42 C26,38 30,36 30,31 C30,27 33,26 33,31 C33,36 36,38 38,42 C37,36 35,33 37,29 C38,26 40,24 40,20.5 Z" fill="${d.lin('lv', FIRE, 0, 1)}" ${ol(2)}/>
    <ellipse cx="32" cy="20.4" rx="8" ry="2.2" fill="#fff3a0" ${ol(1.8)}/>
    ${hl('M19,29 L11,45', 1.6, 0.45)}
    <path d="M14,44 C16,42 18,43 19,45 M47,40 C49,39 51,40 51,42" stroke="#52c060" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
});

S.i_isla3 = icon((d) => {
  const isle = 'M6,51 L12,36 L17,39 L22,20 L28,32 L33,12 L39,30 L45,24 L51,40 L58,51 Z';
  const cr = (x, y, h, w, rot) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0,${-h} L${w},${-h * 0.45} L${w * 0.7},0 L${-w * 0.7},0 L${-w},${-h * 0.45} Z" fill="${d.lin('cr', [[0, '#ffe6ff'], [0.45, '#c47aff'], [1, '#6a2ad0']], 0.4, 1)}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/><path transform="translate(${x} ${y}) rotate(${rot})" d="M0,${-h} L${-w},${-h * 0.45} L${-w * 0.7},0 L0,0 Z" fill="#fff" opacity="0.35"/>`;
  return `<circle cx="32" cy="30" r="29" fill="${d.glow('gl', '#b46aff', 0.75)}"/>
    ${islandSea(d, true)}
    <path d="${isle}" fill="${d.lin('rk', [[0, '#5a4a7a'], [0.5, '#2c2244'], [1, '#140e22']], 0.5, 1)}" ${ol(3)}/>
    <path d="M33,12 L39,30 L36,51 L31,51 L32,28 Z" fill="#000" opacity="0.3"/>
    ${hl('M21,25 L15,42 M32,17 L29,30', 1.4, 0.35)}
    ${cr(26, 46, 13, 4, -14)}${cr(37, 47, 17, 4.6, 8)}${cr(46, 48, 9, 3.2, 20)}
    ${spark(52, 12, 1, '#f0d8ff')}${spark(11, 22, 0.7, '#f0d8ff')}${spark(18, 46, 0.6, '#f0d8ff')}`;
});

S.i_sinfin = icon((d) => {
  const inf = 'M32,32 C37,23.5 43,20 47.5,20 C52.5,20 54.5,25.8 54.5,32 C54.5,38.2 52.5,44 47.5,44 C43,44 37,40.5 32,32 C27,23.5 21,20 16.5,20 C11.5,20 9.5,25.8 9.5,32 C9.5,38.2 11.5,44 16.5,44 C21,44 27,40.5 32,32 Z';
  const g = d.linU('wv', [[0, '#9ff0ff'], [0.5, '#36b0ee'], [1, '#1c5cb4']], 10, 14, 54, 48);
  const crest = (tx, ty, sc) => `<g transform="translate(${tx} ${ty}) scale(${sc})">`;
  const W = waveD();
  return `${crest(9.6, 18.4, 0.3)}<path d="${W}" fill="${OUT}" stroke="${OUT}" stroke-width="${f2(5.2 / 0.3)}" stroke-linejoin="round"/></g>
    ${crest(40.6, 18.4, 0.3)}<path d="${W}" fill="${OUT}" stroke="${OUT}" stroke-width="${f2(5.2 / 0.3)}" stroke-linejoin="round"/></g>
    <path d="${inf}" fill="none" stroke="${OUT}" stroke-width="13" stroke-linejoin="round"/>
    ${crest(9.6, 18.4, 0.3)}<path d="${W}" fill="${g}"/></g>${crest(40.6, 18.4, 0.3)}<path d="${W}" fill="${g}"/></g>
    <path d="${inf}" fill="none" stroke="${g}" stroke-width="8" stroke-linejoin="round"/>
    ${crest(9.6, 18.4, 0.3)}<path d="M4,-17 C7,-24 14,-27.4 23,-27.6 C32,-27.6 39,-22 40.2,-15.6" fill="none" stroke="#fff" stroke-width="${f2(1.8 / 0.3)}" stroke-linecap="round"/></g>
    ${crest(40.6, 18.4, 0.3)}<path d="M4,-17 C7,-24 14,-27.4 23,-27.6 C32,-27.6 39,-22 40.2,-15.6" fill="none" stroke="#fff" stroke-width="${f2(1.8 / 0.3)}" stroke-linecap="round"/></g>
    <path d="M12.4,27 C12.4,30 12.2,32 12.2,34 M51.6,27 C51.6,30 51.8,32 51.8,34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
    <path d="M35,28.6 C38.6,24 42.6,22.8 45.4,22.8 M29,35.4 C25.4,40 21.4,41.2 18.6,41.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.6" stroke-dasharray="3 2.6"/>
    <path d="M47.5,41.2 C51,41.2 52,38 52.2,36 M16.5,41.2 C13,41.2 12,38 11.8,36" fill="none" stroke="#0f3a80" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>
    ${[[30, 16, 1.6], [34, 11.5, 1.1], [28, 50, 1.4], [24, 54, 1]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#dff8ff" ${ol(1)}/>`).join('')}
    ${spark(56, 10, 0.8)}${spark(8, 54, 0.7)}`;
});

S.i_trofeo = icon((d) => {
  const gold = d.lin('gd', GOLD, 0.35, 1);
  const cup = 'M15,7 L49,7 C49,25 43,34 32,36 C21,34 15,25 15,7 Z';
  return `<circle cx="32" cy="24" r="26" fill="${d.glow('gl', '#ffd860', 0.45)}"/>
    <path d="M16,12 C6,11 5,22 10,27 C13,30 17,31 20,30" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>
    <path d="M48,12 C58,11 59,22 54,27 C51,30 47,31 44,30" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>
    <path d="M16,12 C6,11 5,22 10,27 C13,30 17,31 20,30 M48,12 C58,11 59,22 54,27 C51,30 47,31 44,30" fill="none" stroke="${d.linU('hg', GOLD, 6, 10, 20, 32)}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M28,35 L36,35 L35,45 L29,45 Z" fill="${gold}" ${ol(2.4)}/>
    <path d="${cup}" fill="${gold}" ${ol(3)}/>
    <path d="M32,7 L49,7 C49,25 43,34 32,36 Z" fill="#c26a14" opacity="0.18"/>
    ${hl('M19.6,10.4 C19.6,20 22.4,27 27.6,31', 2.2, 0.7)}
    <path d="${roundStar(32, 19, 7.6, 3.6, 0.8)}" fill="#fff6c0" stroke="#b5620f" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="22.5" y="44" width="19" height="5" rx="1.6" fill="${gold}" ${ol(2.2)}/>
    <path d="M17,49 L47,49 L49,58.5 L15,58.5 Z" fill="${d.lin('bs', [[0, '#7a5ad8'], [1, '#2c1c6a']], 0.3, 1)}" ${ol(2.6)}/>
    <rect x="26" y="51.6" width="12" height="4" rx="1" fill="${gold}" stroke="${OUT}" stroke-width="1.2"/>
    ${spark(53, 40, 0.9)}${spark(10, 40, 0.7)}`;
});

S.i_regalo = icon((d) => {
  const gold = d.lin('gd', GOLD, 0.35, 1);
  return `<path d="M32,20 C24,7 13,8 14,15 C15,20 25,21 32,20 Z" fill="${gold}" ${ol(2.4)}/>
    <path d="M32,20 C40,7 51,8 50,15 C49,20 39,21 32,20 Z" fill="${gold}" ${ol(2.4)}/>
    <path d="M19,14 C22,13 27,15.6 30,18.6 M45,14 C42,13 37,15.6 34,18.6" stroke="#b5620f" stroke-width="1.3" fill="none"/>
    <rect x="11" y="31" width="42" height="27.5" rx="2.6" fill="${d.lin('bx', [[0, '#ffb0e0'], [0.5, '#e04aa8'], [1, '#8a1e6e']], 0.4, 1)}" ${ol(3)}/>
    <path d="M44,33 L52,33 L52,57 L44,57 Z" fill="#000" opacity="0.14"/>
    <rect x="7.5" y="21" width="49" height="11.4" rx="2.6" fill="${d.lin('ld', [[0, '#ffc6ea'], [0.5, '#f05ab8'], [1, '#a82680']], 0.4, 1)}" ${ol(3)}/>
    <rect x="27.5" y="21" width="9" height="11.4" fill="${gold}" stroke="${OUT}" stroke-width="2"/>
    <rect x="27.5" y="32.4" width="9" height="26" fill="${gold}" stroke="${OUT}" stroke-width="2"/>
    <circle cx="32" cy="20.5" r="3.6" fill="${gold}" ${ol(2)}/>
    ${hl('M11,24.4 L25,24.4', 1.6, 0.6)}${hl('M14.4,35 L14.4,54', 1.6, 0.5)}
    ${[[19, 40], [45, 48], [20, 52], [44, 39]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#ffd0ee" opacity="0.8"/>`).join('')}
    ${spark(56, 10, 0.9)}${spark(7, 12, 0.6)}`;
});

S.i_candado = icon((d) => {
  return `<path d="M20.5,30 L20.5,19 C20.5,4.5 43.5,4.5 43.5,19 L43.5,30" fill="none" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/>
    <path d="M20.5,30 L20.5,19 C20.5,4.5 43.5,4.5 43.5,19 L43.5,30" fill="none" stroke="${d.linU('sv', SILVER, 18, 6, 46, 30)}" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M22.4,20 C22.4,12 26,8.6 30,8" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
    <rect x="10.5" y="27" width="43" height="32" rx="6" fill="${d.lin('bd', GOLD, 0.4, 1)}" ${ol(3)}/>
    <path d="M10.5,35 L53.5,35 M10.5,51 L53.5,51" stroke="#c26a14" stroke-width="1.4" opacity="0.6"/>
    ${hl('M14.4,31 L14.4,53', 2, 0.65)}
    <circle cx="32" cy="40.6" r="4.4" fill="${OUT}"/><path d="M30,42 L28.8,50 L35.2,50 L34,42 Z" fill="${OUT}"/>
    ${spark(53, 15, 0.9)}`;
});

function skullHead(d, cx, cy, s, k = 'sk') {
  const head = `M${cx - 17 * s},${cy + 2 * s} C${cx - 17 * s},${cy - 14 * s} ${cx - 9 * s},${cy - 20 * s} ${cx},${cy - 20 * s} C${cx + 9 * s},${cy - 20 * s} ${cx + 17 * s},${cy - 14 * s} ${cx + 17 * s},${cy + 2 * s} C${cx + 17 * s},${cy + 8 * s} ${cx + 12 * s},${cy + 10 * s} ${cx + 11 * s},${cy + 13 * s} L${cx + 11 * s},${cy + 18 * s} C${cx + 11 * s},${cy + 20 * s} ${cx + 9 * s},${cy + 21 * s} ${cx + 7 * s},${cy + 21 * s} L${cx - 7 * s},${cy + 21 * s} C${cx - 9 * s},${cy + 21 * s} ${cx - 11 * s},${cy + 20 * s} ${cx - 11 * s},${cy + 18 * s} L${cx - 11 * s},${cy + 13 * s} C${cx - 12 * s},${cy + 10 * s} ${cx - 17 * s},${cy + 8 * s} ${cx - 17 * s},${cy + 2 * s} Z`;
  return `<path d="${head}" fill="${d.lin(k, [[0, '#ffffff'], [0.6, '#f1e8d0'], [1, '#c4b48e']], 0.4, 1)}" ${ol(3)}/>
    <ellipse cx="${cx - 7 * s}" cy="${cy + 1 * s}" rx="${5 * s}" ry="${5.6 * s}" fill="${OUT}"/><ellipse cx="${cx + 7 * s}" cy="${cy + 1 * s}" rx="${5 * s}" ry="${5.6 * s}" fill="${OUT}"/>
    <path d="M${cx},${cy + 7 * s} L${cx - 2.4 * s},${cy + 11 * s} L${cx + 2.4 * s},${cy + 11 * s} Z" fill="${OUT}"/>
    <path d="M${cx - 5 * s},${cy + 15 * s} L${cx - 5 * s},${cy + 21 * s} M${cx},${cy + 15 * s} L${cx},${cy + 21 * s} M${cx + 5 * s},${cy + 15 * s} L${cx + 5 * s},${cy + 21 * s}" stroke="${OUT}" stroke-width="${f2(1.6 * Math.max(s, 0.8))}"/>`;
}
S.i_calavera = icon((d) => {
  return `${skullHead(d, 32, 33, 1.25)}
    <path d="M11,24 C10,10 21,4 32,4 C43,4 54,10 53,24 C46,20 18,20 11,24 Z" fill="${d.lin('bn', RED, 0.4, 1)}" ${ol(2.8)}/>
    ${[[22, 11], [32, 8.6], [42, 11], [27, 16.6], [37, 16.6], [17, 18], [47, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff"/>`).join('')}
    <path d="M52,20 L58.6,15.6 L57.4,24 Z M52,21 L59.4,26 L54,28 Z" fill="${d.lin('bn', RED, 0.4, 1)}" ${ol(2)}/>
    <circle cx="52" cy="21" r="2.6" fill="#c4203a" ${ol(1.6)}/>
    ${hl('M15,17 C17,11 23,7.6 29,7', 1.6, 0.6)}
    ${hl('M14,33 C14,29 15,27 16.4,26', 2, 0.8)}
    <circle cx="11.2" cy="40" r="2.6" fill="none" stroke="${OUT}" stroke-width="3.6"/><circle cx="11.2" cy="40" r="2.6" fill="none" stroke="#ffd23c" stroke-width="1.8"/>`;
});

S.i_barco = icon((d) => {
  const hull = 'M5,40 L57,40 C60,40 61,42 59.6,44.4 C55,52 47,55 38,55 L20,55 C11,55 6,50 5,40 Z';
  return `<path d="M32,8 L58,40 M32,8 L8,38" stroke="#2a1f3a" stroke-width="0.9"/>
    <path d="M33,6 L45,8.6 L33,11.6 Z" fill="#d8434e" ${ol(1.6)}/>
    <path d="M14,14 C24,13 40,13 50,14 C52,22 52,30 50,37 C40,36 24,36 14,37 C12,30 12,22 14,14 Z" fill="${d.lin('sl', [[0, '#4a4070'], [1, '#221a38']], 0.6, 1)}" ${ol(2.4)}/>
    <path d="M18,17 C17,23 17,29 18,34" stroke="#fff" stroke-width="1.4" opacity="0.18" fill="none"/>
    <g transform="translate(32 25) scale(1.25)"><path d="M-7,6 L7,-6 M-7,-6 L7,6" stroke="#f3ead2" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-5,-1 C-5,-6 5,-6 5,-1 C5,2 3,3 3,4.5 L-3,4.5 C-3,3 -5,2 -5,-1 Z" fill="#f3ead2"/><circle cx="-2" cy="-1" r="1.4" fill="${OUT}"/><circle cx="2" cy="-1" r="1.4" fill="${OUT}"/></g>
    <rect x="30.4" y="5" width="3.4" height="37" rx="1.2" fill="#6e4126" ${ol(1.6)}/>
    <rect x="12" y="12" width="40" height="3" rx="1.2" fill="#7b4a2b" ${ol(1.3)}/>
    <path d="${hull}" fill="${d.lin('hl', [[0, '#c27c44'], [0.5, '#8f552d'], [1, '#5a321d']], 0, 1)}"/>
    <g clip-path="${d.clip('hc', hull)}"><rect x="0" y="40" width="64" height="3" fill="#ffcf5a"/><path d="M0,48 C20,50 40,50 64,46" stroke="#5a321c" stroke-width="1.2" fill="none"/></g>
    <circle cx="24" cy="46" r="2.2" fill="#ffd88a" ${ol(1.2)}/><circle cx="36" cy="46" r="2.2" fill="#ffd88a" ${ol(1.2)}/>
    <path d="${hull}" fill="none" ${ol(2.6)}/>
    <path d="M6,57 Q10.5,53.4 15,57 Q19.5,60.6 24,57 Q28.5,53.4 33,57 Q37.5,60.6 42,57 Q46.5,53.4 51,57 Q55,60.2 58,57.4" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
    <path d="M6,57 Q10.5,53.4 15,57 Q19.5,60.6 24,57 Q28.5,53.4 33,57 Q37.5,60.6 42,57 Q46.5,53.4 51,57 Q55,60.2 58,57.4" fill="none" stroke="#5fd4f6" stroke-width="2.6" stroke-linecap="round"/>`;
});

S.i_estrella = icon((d) => `<circle cx="32" cy="33" r="30" fill="${d.glow('gl', '#ffd860', 0.45)}"/>${goldStar(d, 32, 34, 28.5, 3.2)}${spark(54, 10, 0.9)}`);

S.i_check = icon((d) => `<circle cx="32" cy="32" r="27" fill="${d.rad('ck', [[0, '#b8f58a'], [0.5, '#3cc45a'], [1, '#14803e']], 0.35, 0.3, 0.85)}" ${ol(3.2)}/>
    ${hlArc(32, 32, 23, 195, 250, 2.6, 0.6)}
    <path d="M19,33 L28,42 L46,22" fill="none" stroke="${OUT}" stroke-width="10.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19,33 L28,42 L46,22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);

S.i_peligro = icon((d) => {
  const tri = roundPoly([[32, 4], [60, 56], [4, 56]], 7);
  const tri2 = roundPoly([[32, 11.5], [53.4, 51.6], [10.6, 51.6]], 4.4);
  return `<path d="${tri}" fill="${d.lin('tr', [[0, '#ffe27a'], [1, '#f2a22a']], 0.3, 1)}" ${ol(3.2)}/>
    <path d="${tri2}" fill="${d.lin('rd', RED, 0.4, 1)}" stroke="#7a0a22" stroke-width="1.4"/>
    <path d="M20,49 L44,31 M20,31 L44,49" stroke="${OUT}" stroke-width="6.2" stroke-linecap="round"/>
    <path d="M20,49 L44,31 M20,31 L44,49" stroke="#f6eedc" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M24.5,34 C24.5,26 39.5,26 39.5,34 C39.5,38 36.6,39 36.6,41.6 L27.4,41.6 C27.4,39 24.5,38 24.5,34 Z" fill="#f6eedc" ${ol(2)}/>
    <circle cx="29" cy="34" r="2.1" fill="${OUT}"/><circle cx="35" cy="34" r="2.1" fill="${OUT}"/>
    ${hl('M28,12.6 L15,37', 1.6, 0.6)}`;
});

S.i_pausa = icon((d) => {
  const g = d.lin('ps', [[0, '#ffffff'], [0.6, '#e6e8f6'], [1, '#a8aed0']], 0.4, 1);
  return `<rect x="13" y="8" width="14" height="48" rx="5" fill="${g}" ${ol(3.2)}/>
    <rect x="37" y="8" width="14" height="48" rx="5" fill="${g}" ${ol(3.2)}/>
    ${hl('M17,13 L17,30', 2.2, 0.9)}${hl('M41,13 L41,30', 2.2, 0.9)}`;
});

S.i_musica = icon((d) => {
  const g = d.lin('mu', [[0, '#d6f6ff'], [0.5, '#5fd0f6'], [1, '#2a6ac8']], 0.4, 1);
  const shape = ['<ellipse cx="17" cy="48" rx="8.6" ry="6.6" transform="rotate(-22 17 48)"/>', '<ellipse cx="45" cy="42" rx="8.6" ry="6.6" transform="rotate(-22 45 42)"/>', '<path d="M22.4,47 L22.4,14 L51,7 L51,41 L47.4,41 L47.4,18 L26,23 L26,47 Z"/>'];
  return `${uni(shape, g, 2.8)}
    <path d="M22.6,14 L51,7 L51,16 L22.6,22.6 Z" fill="${d.lin('bm', [[0, '#bff2ff'], [1, '#3a86d6']], 0.3, 1)}" stroke="${OUT}" stroke-width="1.3" stroke-linejoin="round"/>
    <ellipse cx="13.6" cy="45.6" rx="3" ry="1.8" transform="rotate(-22 13.6 45.6)" fill="#fff" opacity="0.75"/>
    <ellipse cx="41.6" cy="39.6" rx="3" ry="1.8" transform="rotate(-22 41.6 39.6)" fill="#fff" opacity="0.75"/>
    ${spark(9, 13, 0.9)}${spark(58, 54, 0.7)}`;
});

S.i_sonido = icon((d) => {
  return `<path d="M7,24 L17,24 L31,11 C33,9.6 35,10.6 35,13 L35,51 C35,53.4 33,54.4 31,53 L17,40 L7,40 C5.4,40 4.5,39 4.5,37.5 L4.5,26.5 C4.5,25 5.4,24 7,24 Z" fill="${d.lin('sp', [[0, '#ffffff'], [0.6, '#dfe2f2'], [1, '#9aa0c4']], 0.4, 1)}" ${ol(3)}/>
    <path d="M17,24 L17,40" stroke="${OUT}" stroke-width="1.6"/>
    ${hl('M8,27.5 L8,36.5 M20,26 L30,16.4', 1.8, 0.8)}
    ${[[0, 8], [1, 15]].map(([i, r]) => `<path d="${arcD(36, 32, r + 4, -45, 45)}" fill="none" stroke="${OUT}" stroke-width="7.4" stroke-linecap="round"/><path d="${arcD(36, 32, r + 4, -45, 45)}" fill="none" stroke="#7fe0ff" stroke-width="3.8" stroke-linecap="round"/>`).join('')}`;
});

// ---- late additions
S.i_mision = icon((d) => {
  const paper = 'M13,13 C22,11 42,15 51,13 L51,51 C42,53 22,49 13,51 Z';
  const roll = x => `<rect x="${x}" y="8.6" width="9" height="46.8" rx="4.5" fill="${d.lin('rl', [[0, '#fff1c8'], [0.5, '#e2bf7a'], [1, '#a5793c']], 1, 0)}" ${ol(2.4)}/>
    <ellipse cx="${x + 4.5}" cy="9.4" rx="4.5" ry="2" fill="${d.lin('rc', WOOD, 1, 0)}" ${ol(1.6)}/>`;
  return `<path d="${paper}" fill="${d.lin('pp', PARCH, 0.5, 1)}" ${ol(2.6)}/>
    <path d="M22,22 C25,19 30,20 31,23 C33,27 28,29 24,28 C20,27 20,24 22,22 Z" fill="#9fd88a" stroke="#6a8a4a" stroke-width="1.2"/>
    <path d="M17,45 C23,44 26,40 27,35 C28,31 34,30 37,33 C40,36 40,25 43,22" fill="none" stroke="#8a5a2e" stroke-width="2" stroke-linecap="round" stroke-dasharray="2.6 2.6"/>
    <path d="M39,17 L47,25 M47,17 L39,25" stroke="${OUT}" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M39,17 L47,25 M47,17 L39,25" stroke="#e8343e" stroke-width="3" stroke-linecap="round"/>
    ${roll(5)}${roll(50)}
    ${hl('M7.8,14 L7.8,48', 1.4, 0.7)}${hl('M52.8,14 L52.8,48', 1.4, 0.7)}`;
});

S.i_mercader = icon((d) => {
  const n = 5, x0 = 5, x1 = 59, w = (x1 - x0) / n;
  let scal = `M${x0},12 L${x1},12 L${x1},26`;
  for (let i = n - 1; i >= 0; i--) scal += ` Q${f2(x0 + i * w + w / 2)},33 ${f2(x0 + i * w)},26`;
  scal += ' Z';
  const stripes = Array.from({ length: n }, (_, i) => i % 2 ? '' : `<rect x="${f2(x0 + i * w)}" y="8" width="${f2(w)}" height="30" fill="${d.lin('rs', RED, 0.3, 1)}"/>`).join('');
  return `<rect x="9" y="22" width="4.6" height="37" rx="1.4" fill="${d.lin('ps', WOOD, 1, 0)}" ${ol(2)}/><rect x="50.4" y="22" width="4.6" height="37" rx="1.4" fill="${d.lin('ps', WOOD, 1, 0)}" ${ol(2)}/>
    <rect x="6" y="48" width="52" height="10.5" rx="2" fill="${d.lin('ct', WOOD, 0, 1)}" ${ol(2.6)}/>
    <path d="M6,52.6 L58,52.6" stroke="#5a3218" stroke-width="1.2" opacity="0.7"/>
    ${hl('M9,50.6 L55,50.6', 1.3, 0.5)}
    <path d="M7,12 L32,4 L57,12 Z" fill="${d.lin('rf', RED, 0.3, 1)}" ${ol(2.4)}/>
    <path d="${scal}" fill="#fff6e6"/>
    <g clip-path="${d.clip('ac', scal)}">${stripes}<path d="M5,24 L59,24 L59,40 L5,40 Z" fill="#000" opacity="0.08"/></g>
    <path d="${scal}" fill="none" ${ol(2.6)}/>
    ${hl('M8,15 L56,15', 1.4, 0.6)}
    ${coinFace(d, 32, 39, 11, 2.6)}
    ${spark(50, 34, 0.9)}${spark(14, 40, 0.6)}`;
});

S.i_dorada = icon((d) => {
  return `<circle cx="30" cy="30" r="30" fill="${d.glow('gl', '#ffd860', 0.6)}"/>
    ${moonDisc(d, 29, 29, 23, [[0, '#fffbe0'], [0.45, '#ffd84a'], [0.85, '#f2a22a'], [1, '#c26a14']], '#e0911e', 'gm')}
    ${coinFace(d, 49, 49, 9.5, 2.4)}
    ${sparkO(56, 33, 0.9, '#fff3a0')}${spark(40, 58, 0.6)}${spark(54, 8, 0.8)}`;
});

S.i_diluvio = icon((d) => {
  const cloud = ['<circle cx="17" cy="23" r="10"/>', '<circle cx="31" cy="17" r="11"/>', '<circle cx="44.5" cy="20.5" r="10"/>', '<circle cx="51" cy="27" r="6"/>', '<rect x="7" y="22" width="50" height="13" rx="6.5"/>'];
  const rain = [[11, 40], [17, 47], [22, 40.5], [46, 41], [51.5, 47], [57, 40], [13, 50.5], [55, 51], [33, 52]].map(([x, y]) => `M${x},${y} l-2.4,5.6`).join(' ');
  const b1 = boltD([[30, 31], [22, 45], [28, 45.4], [22.6, 58.6], [37, 41], [31, 41], [36, 31]]);
  const b2 = boltD([[44, 33], [39, 42], [43, 42.4], [38.6, 51], [48, 40], [44.6, 40], [48.6, 33]]);
  const b3 = boltD([[16, 33], [12, 40], [15.4, 40.4], [12, 47], [20, 38.4], [17, 38.4], [20, 33]]);
  const bg = d.lin('bt', [[0, '#fffbd0'], [0.45, '#ffe04a'], [1, '#f39a1e']], 0.3, 1);
  return `<path d="${rain}" stroke="${OUT}" stroke-width="4.4" stroke-linecap="round"/><path d="${rain}" stroke="#7fd4ff" stroke-width="2" stroke-linecap="round"/>
    ${uni(cloud, d.linU('cl', [[0, '#8a84b0'], [0.55, '#46406e'], [1, '#221d40']], 20, 6, 34, 36), 2.7)}
    ${hl(arcD(31, 17, 8.2, 195, 265), 2.2, 0.45)}${hl(arcD(17, 23, 7.2, 190, 240), 1.8, 0.35)}
    <path d="M11,32 C24,35 44,35 54,32" stroke="#16122e" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="${b3}" fill="${bg}" ${ol(2.2)}/><path d="${b2}" fill="${bg}" ${ol(2.2)}/><path d="${b1}" fill="${bg}" ${ol(2.6)}/>
    ${hl('M30.5,33 L24,43', 1.3, 0.8)}`;
});

// ---------------------------------------------------------------- fit
// per-icon scale about the centre that keeps every icon inside the 3-unit margin
// (measured from the rendered artwork by a helper script; regenerate after editing an icon)
const FIT = {"i_rayo":0.975, "i_coral":0.997, "i_tiburon":0.922, "i_escarcha":0.991, "i_faro":0.991, "i_canon":0.975, "i_espejo":0.98, "i_marea":0.975, "i_arrecife":0.991, "i_sangre":0.958, "i_hielo":0.964, "i_polvora":0.98, "i_caracola":0.964, "i_estrellas":0.997, "i_maelstrom":0.975, "i_muralla":0.991, "i_megalodon":0.958, "i_glaciar":0.997, "i_solar":0.98, "i_bombarda":0.958, "i_poseidon":0.98, "i_tiburonado":0.98, "i_prisma":0.997, "i_truenos":0.986, "i_tsunami":0.991, "i_furia":0.975, "i_ventisca":0.958, "i_tesoro":0.986, "i_murallas":0.991, "i_iman":0.997, "i_codicia":0.997, "i_sabio":0.997, "i_manantial":0.958, "i_coraza":0.986, "i_roca":0.991, "i_reef0":0.98, "i_reef1":0.997, "i_reef2":0.997, "i_reef4":0.997, "i_monedas":0.997, "i_cofre":0.986, "i_isla0":0.997, "i_isla1":0.997, "i_isla2":0.997, "i_isla3":0.997, "i_sinfin":0.991, "i_candado":0.991, "i_calavera":0.975, "i_barco":0.969, "i_musica":0.98, "i_sonido":0.991, "i_mercader":0.986, "i_dorada":0.986, "i_diluvio":0.997};
if (!process.env.ICONS_NOFIT) for (const n in FIT) {
  const dr = S[n].draw, s = FIT[n];
  S[n].draw = I => `<g transform="translate(32 32) scale(${s}) translate(-32 -32)">${dr(I)}</g>`;
}

// ---- settings menu
const gearD = (cx, cy, rO, rI, n) => {
  const st = 360 / n, pt = (r, a) => P([cx + r * Math.cos(rd(a)), cy + r * Math.sin(rd(a))]);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = i * st - 90;
    d += `${i ? 'L' : 'M'}${pt(rI, a - st * 0.3)} L${pt(rO, a - st * 0.17)} L${pt(rO, a + st * 0.17)} L${pt(rI, a + st * 0.3)} `;
  }
  return d + 'Z';
};
S.i_ajustes = icon((d) => {
  return `<path d="${gearD(32, 32, 28.5, 21, 8)}" fill="${d.lin('gr', SILVER, 0.4, 1)}" ${ol(3.2)}/>
    <circle cx="32" cy="32" r="13.5" fill="none" stroke="#9aa6c2" stroke-width="2"/>
    <circle cx="32" cy="32" r="8.6" fill="${d.rad('hb', DEEP, 0.4, 0.35, 0.9)}" ${ol(2.6)}/>
    <path d="M29.6,27.4 A4.6,4.6 0 1 0 35.8,34.6 A6,6 0 0 1 29.6,27.4 Z" fill="${d.lin('mn', MOON, 0.3, 1)}"/>
    ${hlArc(32, 32, 18, 200, 250, 2.6, 0.75)}${spark(53, 11, 0.8)}`;
});
S.i_vibra = icon((d) => {
  const waves = side => [8, 14].map(r => `<path d="${arcD(32, 32, r + 12, side ? -35 : 145, side ? 35 : 215)}" fill="none" stroke="${OUT}" stroke-width="6.6" stroke-linecap="round"/><path d="${arcD(32, 32, r + 12, side ? -35 : 145, side ? 35 : 215)}" fill="none" stroke="#ffd23c" stroke-width="3.2" stroke-linecap="round"/>`).join('');
  return `${waves(0)}${waves(1)}
    <rect x="19" y="6" width="26" height="52" rx="6" fill="${d.lin('ph', IRON, 0.4, 1)}" ${ol(3)}/>
    <rect x="23" y="12" width="18" height="36" rx="2.4" fill="${d.lin('sc', WATER, 0.3, 1)}" stroke="${OUT}" stroke-width="1.4"/>
    <circle cx="32" cy="53" r="2.2" fill="#c9cde0"/>
    ${hl('M26,16 L26,30', 1.8, 0.7)}`;
});
S.i_libro = icon((d) => {
  return `<path d="M4,16 C14,12 24,13 32,19 C40,13 50,12 60,16 L60,54 C50,50 40,51 32,57 C24,51 14,50 4,54 Z" fill="${d.lin('cv', RED, 0.3, 1)}" ${ol(3)}/>
    <path d="M8,12 C17,8 26,10 32,16 L32,52 C26,46 17,45 8,48 Z" fill="${d.lin('pl', PARCH, 0.5, 1)}" ${ol(2.4)}/>
    <path d="M56,12 C47,8 38,10 32,16 L32,52 C38,46 47,45 56,48 Z" fill="${d.lin('pr', PARCH, 0.5, 1)}" ${ol(2.4)}/>
    <rect x="12" y="17" width="15" height="12" rx="1.6" fill="${d.lin('pn', DEEP, 0.3, 1)}" stroke="${OUT}" stroke-width="1.3"/>
    <circle cx="20" cy="22.6" r="3.6" fill="${d.lin('mo', MOON, 0.3, 1)}"/>
    <path d="M12.6,27.4 Q16,25 19.5,27.4 T26.4,27.4" fill="none" stroke="#7fe0ff" stroke-width="1.4"/>
    <path d="M13,35 L27,37 M13,40 L25,41.6" stroke="#b08a52" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="37" y="17" width="15" height="12" rx="1.6" fill="${d.lin('pn2', CORAL, 0.3, 1)}" stroke="${OUT}" stroke-width="1.3"/>
    <path d="M40,26 L44,20 L46,24 L48,21 L50,26" fill="none" stroke="#fff6b8" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M37,37 L51,35 M39,41.6 L51,40" stroke="#b08a52" stroke-width="1.8" stroke-linecap="round"/>
    ${hl('M10,15 C17,12 24,13 29,17', 1.4, 0.7)}${spark(57, 7, 0.7)}`;
});

module.exports = { S };
