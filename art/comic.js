// Intro comic: six panels (360x220) that tell why the moon defends the island. They reuse the game's sprites
// (placed with put) plus a few drawings only the comic needs: Marina at the lighthouse, a fishing boat,
// the giant wave and comic backgrounds. Captions and speech bubbles are HTML laid over the panels by the game.
const { OUT, ol, limb, lin, rad, glow } = require('./lib');
const SRC = { ...require('./units').S, ...require('./bosses').S, ...require('./fx').S, ...require('./world').S };

const S = {};
const W = 360, H = 220;
const f1 = v => +(+v).toFixed(1);
let uid = 0;

// sprite n with its anchor at (x, y), scaled by s (negative s mirrors it), rotated rot degrees
function put(n, x, y, s = 1, rot = 0) {
  const sp = SRC[n], id = `c${uid++}`;
  return `<g transform="translate(${x} ${y})${rot ? ` rotate(${rot})` : ''} scale(${s} ${Math.abs(s)}) translate(${-sp.ax} ${-sp.ay})">${sp.draw(k => `${id}_${k}`)}</g>`;
}
const moon = (x, y, s, face) => put('moon_llena', x, y, s) + put(`face_${face}`, x, y, s);
// the same sprite turned into a flat silhouette (distant ships against the sky)
const sil = (I, body) => `<defs><filter id="${I('sil')}"><feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.2  0 0 0 1 0"/></filter></defs><g filter="url(#${I('sil')})">${body}</g>`;

const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const sparkle = (x, y, s, col) => `<path d="M${f1(x)},${f1(y - s)} Q${f1(x)},${f1(y)} ${f1(x + s)},${f1(y)} Q${f1(x)},${f1(y)} ${f1(x)},${f1(y + s)} Q${f1(x)},${f1(y)} ${f1(x - s)},${f1(y)} Q${f1(x)},${f1(y)} ${f1(x)},${f1(y - s)} Z" fill="${col}"/>`;
function stars(n, seed, y1 = H * 0.6, col = '#fff6d6') {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * y1, k = r();
    s += k > 0.86 ? sparkle(x, y, 2.5 + k * 2.5, col) : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.5 + k)}" fill="${col}" opacity="${f1(0.35 + k * 0.6)}"/>`;
  }
  return s;
}
const sky = (I, stops) => `<defs>${lin(I('sky'), stops)}</defs><rect width="${W}" height="${H}" fill="url(#${I('sky')})"/>`;
const halo = (I, k, x, y, r, col) => `<defs>${glow(I(k), col)}</defs><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${I(k)})"/>`;

// sea surface from height y down, with an outlined wavy top
function waveD(y, amp, len, ph, x0 = -10, x1 = W + 10, bottom = H + 10) {
  const p = [];
  for (let x = x0; x <= x1; x += 3) p.push(`${x},${f1(y + amp * Math.sin((x / len) * Math.PI * 2 + ph))}`);
  return `M${p.join(' L')} L${x1},${bottom} L${x0},${bottom} Z`;
}
function sea(I, k, y, top, deep, { amp = 2.4, len = 44, ph = 0, line = 2 } = {}) {
  return `<defs>${lin(I(k), [[0, top], [1, deep]])}</defs><path d="${waveD(y, amp, len, ph)}" fill="url(#${I(k)})" ${ol(line)}/>`;
}
const glints = (pts, col = '#bff3ff', op = 0.7) => pts.map(([x, y, w]) => `<path d="M${x},${y} q${w / 2},-${f1(w / 4)} ${w},0" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round" opacity="${op}"/>`).join('');
// moonlight on the water: a broken column of light below the moon
const shimmer = (x, y, n, col = '#fff3b0') => Array.from({ length: n }, (_, i) => `<ellipse cx="${f1(x + Math.sin(i * 2.3) * 4)}" cy="${f1(y + i * 6)}" rx="${f1(18 - i * 1.6)}" ry="1.6" fill="${col}" opacity="${f1(0.75 - i * 0.07)}"/>`).join('');
// comic burst: alternating rays from (cx, cy)
function burst(cx, cy, n, c0, c1, rot = 0) {
  let s = `<rect width="${W}" height="${H}" fill="${c0}"/>`;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i * 2 * Math.PI) / n, a1 = a0 + Math.PI / n, R = 400;
    s += `<path d="M${cx},${cy} L${f1(cx + R * Math.cos(a0))},${f1(cy + R * Math.sin(a0))} L${f1(cx + R * Math.cos(a1))},${f1(cy + R * Math.sin(a1))} Z" fill="${c1}"/>`;
  }
  return s;
}
// thin tapered speed lines pointing at (cx, cy), starting beyond radius r0
function speed(cx, cy, n, r0, seed, col = '#ffffff', op = 0.55) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.2, a0 = r0 + r() * 30, a1 = a0 + 30 + r() * 60, w = 0.8 + r() * 1.4;
    const px = Math.cos(a), py = Math.sin(a), nx = -py * w, ny = px * w;
    s += `<path d="M${f1(cx + px * a0)},${f1(cy + py * a0)} L${f1(cx + px * a1 + nx)},${f1(cy + py * a1 + ny)} L${f1(cx + px * a1 - nx)},${f1(cy + py * a1 - ny)} Z" fill="${col}" opacity="${op}"/>`;
  }
  return s;
}
// foam: overlapping white circles sharing one outline
function foam(B, w = 2.2, col = '#f2fdff') {
  return `<g fill="${OUT}">${B.map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r + w)}"/>`).join('')}</g><g fill="${col}">${B.map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/>`).join('')}</g>`
    + B.filter((_, i) => i % 3 === 1).map(([x, y, r]) => `<circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.3)}" r="${f1(r * 0.3)}" fill="#fff"/>`).join('');
}
const drop = (x, y, s, a = 0) => `<path d="M0,-6 C2.6,-1.8 4,0.8 4,2.6 A4,4 0 0 1 -4,2.6 C-4,0.8 -2.6,-1.8 0,-6 Z" transform="translate(${x} ${y}) rotate(${a}) scale(${s})" fill="#e6fbff" stroke="${OUT}" stroke-width="${f1(1.4 / s)}"/>`;

// ---------------------------------------------------------------- characters and props only the comic uses
function lantern(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-3,-9 Q0,-13 3,-9" fill="none" ${ol(1.4)}/>
    <path d="M-5,-8 L5,-8 L4,-5 L-4,-5 Z" fill="#3c3550" ${ol(1.3)}/>
    <rect x="-4.2" y="-5" width="8.4" height="10" rx="2" fill="#fff1a8" ${ol(1.5)}/>
    <path d="M0,-3 C2,0 1.6,3 0,3.4 C-1.6,3 -2,0 0,-3 Z" fill="#ff9d3c"/>
    <path d="M-5,5 L5,5 L4,7.5 L-4,7.5 Z" fill="#3c3550" ${ol(1.3)}/>
  </g>`;
}
// Marina, the lighthouse keeper's daughter: feet at (0,0), ~66 units tall, facing right.
// pose 'up' raises a lantern to the sky, 'cheer' throws both arms up
function marina(I, pose = 'up') {
  const skin = '#c27c4e', skinD = '#9a5a36', hair = '#2b1830';
  const up = pose === 'up', cheer = pose === 'cheer';
  const backArm = cheer ? 'M-6,-34 C-11,-40 -14,-48 -15,-56' : 'M-6,-34 C-11,-28 -13,-22 -12,-17';
  const frontArm = 'M6,-34 C12,-40 17,-52 20,-61';
  return `<defs>${rad(I('lg'), [[0, '#fff6c0', 0.95], [0.35, '#ffd36a', 0.45], [1, '#ffb347', 0]])}${lin(I('dr'), [[0, '#ff8a6e'], [1, '#e2475a']])}</defs>
    ${up ? `<circle cx="20" cy="-52" r="30" fill="url(#${I('lg')})"/>` : ''}
    ${limb(backArm, skinD, 4.4, 1.5)}${cheer ? `<circle cx="-15" cy="-57" r="3" fill="${skinD}" ${ol(1.4)}/>` : ''}
    ${limb('M-4,-16 L-5,-3', skin, 4.6, 1.5)}${limb('M4,-16 L5,-3', skin, 4.6, 1.5)}
    <ellipse cx="-5.5" cy="-1.6" rx="4.6" ry="2" fill="${OUT}"/><ellipse cx="6.5" cy="-1.6" rx="4.6" ry="2" fill="${OUT}"/>
    <path d="M-8,-36 C-10,-28 -14,-20 -15,-13 Q0,-9 15,-13 C14,-20 10,-28 8,-36 Q0,-39 -8,-36 Z" fill="url(#${I('dr')})" ${ol(2)}/>
    <path d="M-13.5,-15 Q0,-11.4 13.5,-15" fill="none" stroke="#fff3d6" stroke-width="1.6" stroke-linecap="round"/>
    ${[[-6, -21], [5, -26], [8, -18], [-1, -30], [-9, -16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#ffe2a8"/>`).join('')}
    ${limb(frontArm, skin, 4.4, 1.5)}
    ${up ? `${lantern(20, -50)}<circle cx="20" cy="-62" r="3" fill="${skin}" ${ol(1.4)}/>` : `<circle cx="20" cy="-62" r="3" fill="${skin}" ${ol(1.4)}/>`}
    <circle cx="-12" cy="-43" r="5.2" fill="${hair}" ${ol(1.8)}/><circle cx="-12.5" cy="-38.5" r="2" fill="#ffd84a" ${ol(1)}/>
    <circle cx="0" cy="-47" r="11.5" fill="${skin}" ${ol(2)}/>
    <path d="M-11.4,-46 C-12.6,-60 6,-63.5 11.2,-52 C6,-54.6 0.4,-53.6 -2.6,-50.6 C-5,-48.4 -8,-46.4 -11.4,-43.6 Z" fill="${hair}" ${ol(1.6)}/>
    <g transform="translate(4 -58)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-3.2" rx="2.6" ry="3.4" fill="#ff7fae" stroke="${OUT}" stroke-width="1" transform="rotate(${a})"/>`).join('')}<circle r="1.6" fill="#ffd84a"/></g>
    <ellipse cx="-2.6" cy="-45.6" rx="2.6" ry="3.4" fill="#fff" stroke="${OUT}" stroke-width="1.1"/><ellipse cx="5.4" cy="-46" rx="3.1" ry="3.9" fill="#fff" stroke="${OUT}" stroke-width="1.1"/>
    <circle cx="-1.6" cy="-47" r="1.7" fill="${OUT}"/><circle cx="6.6" cy="-47.6" r="2" fill="${OUT}"/>
    <circle cx="-1" cy="-47.7" r="0.6" fill="#fff"/><circle cx="7.3" cy="-48.4" r="0.7" fill="#fff"/>
    <path d="M-5,-51.6 Q-3,-52.6 -0.8,-51.4 M3.4,-52.2 Q5.8,-53.6 8.4,-52.2" fill="none" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M0.6,-40.4 Q3.6,-38.6 6.4,-40.8 Q4,-35.4 0.6,-40.4 Z" fill="#7a1f3d" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
    <ellipse cx="-6.4" cy="-41.8" rx="2.4" ry="1.4" fill="#ff6f86" opacity="0.55"/><ellipse cx="9.6" cy="-42" rx="1.8" ry="1.3" fill="#ff6f86" opacity="0.55"/>`;
}
// a fisherman's rowboat with a lantern on a pole; waterline at (0,0), bow to the left
function rowboat(I) {
  return `<defs>${glow(I('g'), '#ffd36a')}</defs>
    <circle cx="20" cy="-27" r="15" fill="url(#${I('g')})"/>
    <path d="M18,-6 L19.5,-24" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>${lantern(19.5, -25, 0.7)}
    <path d="M-12,-14 C-16,-22 -22,-30 -30,-36" fill="none" stroke="#7a5236" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-30,-36 C-32,-20 -31,-8 -32,0" fill="none" stroke="#e8f4ff" stroke-width="0.6" opacity="0.7"/>
    <path d="M-7,-6 C-8,-13 -5,-17 0,-17 C5,-17 7,-13 6,-6 Z" fill="#3f6fb5" ${ol(1.6)}/>
    <path d="M-4,-14 C-8,-15 -11,-15 -12,-14" fill="none" stroke="${OUT}" stroke-width="4.4" stroke-linecap="round"/><path d="M-4,-14 C-8,-15 -11,-15 -12,-14" fill="none" stroke="#c98a5a" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="0" cy="-21" r="4.6" fill="#c98a5a" ${ol(1.5)}/>
    <path d="M-7.4,-22.6 Q0,-25 7.4,-22.6 Q0,-21 -7.4,-22.6 Z" fill="#e8c26a" ${ol(1.3)}/><path d="M-3.6,-23.6 Q0,-30 3.6,-23.6 Z" fill="#e8c26a" ${ol(1.3)}/>
    <circle cx="-2" cy="-20.6" r="0.9" fill="${OUT}"/>
    <path d="M-27,-8 L27,-8 C25,2 17,6 0,6 C-17,6 -25,2 -27,-8 Z" fill="#a8683a" ${ol(2)}/>
    <path d="M-25,-4 Q0,-2 25,-4 M-21,1 Q0,3 21,1" fill="none" stroke="#7a4a2a" stroke-width="1"/>
    <path d="M-27,-8 L27,-8" stroke="#d99a5e" stroke-width="2" stroke-linecap="round"/>`;
}
// the big curling wave (curl to the right); body fills down past the panel bottom
const WAVE = 'M-10,522 L-10,330 C10,250 70,186 140,170 C230,124 330,106 400,136 C460,162 482,230 466,292 C452,336 404,354 378,330 C410,330 428,300 416,276 C400,248 352,252 340,296 C330,340 360,392 522,410 L522,522 Z';
const WAVE_CREST = [[118, 196], [170, 132], [250, 112], [300, 114], [380, 118], [462, 172], [466, 262], [468, 308], [436, 340], [398, 342]];
function cubicChain(pts, t) {
  const n = (pts.length - 1) / 3, s = Math.min(Math.floor(t * n), n - 1), u = t * n - s, q = pts.slice(s * 3, s * 3 + 4), v = 1 - u;
  return [0, 1].map(k => v * v * v * q[0][k] + 3 * v * v * u * q[1][k] + 3 * v * u * u * q[2][k] + u * u * u * q[3][k]);
}
function bigWave(I) {
  const B = [];
  for (let i = 0; i <= 15; i++) { const t = i / 15, p = cubicChain(WAVE_CREST, t); B.push([p[0], p[1], 26 - 12 * Math.abs(t - 0.45)]); }
  return `<defs>${lin(I('wv'), [[0, '#52d4f0'], [0.55, '#2196cf'], [1, '#155ea8']], 0.4, 1)}${rad(I('tb'), [[0, '#0b2f66'], [1, '#17508f']], 0.6, 0.4, 0.7)}</defs>
    <ellipse cx="392" cy="318" rx="70" ry="66" fill="url(#${I('tb')})" ${ol(10)}/>
    <path d="${WAVE}" fill="url(#${I('wv')})" ${ol(11)}/>
    <path d="M60,250 C110,200 170,180 230,178" fill="none" stroke="#9eeafd" stroke-width="12" stroke-linecap="round" opacity="0.7"/>
    ${foam(B, 5.5)}`;
}

// ---------------------------------------------------------------- the six panels
const PANELS = {
  // 1. peace: the moon rocks the tides and guides the fishermen home
  comic1: I => `${sky(I, [[0, '#0a1838'], [0.7, '#22457c'], [1, '#3a6aa0']])}
    ${stars(46, 7, 150)}
    ${halo(I, 'mg', 284, 58, 70, '#fff1b8')}
    ${moon(284, 58, 1.15, 'happy')}
    <g opacity="0.55">${put('cloud1', 92, 44, 0.75)}</g>${put('cloud2', 196, 92, 0.5)}
    ${put('farA', 300, 166, 0.6)}
    ${put('isl_coral', 92, 116, 0.5)}
    ${put('tree_coral', 56, 117, 0.42)}${put('vil_coral', 92, 118, 0.5)}${put('lighthouse', 130, 118, 0.52)}
    ${sea(I, 's1', 164, '#2f8fc0', '#0d3a6a', { amp: 2, len: 50, ph: 1 })}
    ${shimmer(284, 172, 7)}
    <g transform="translate(232 182)">${rowboat(I)}</g>
    ${sea(I, 's2', 190, '#2478b0', '#0b2f5a', { amp: 2.6, len: 38, ph: 2.2 })}
    ${glints([[30, 200, 12], [120, 206, 14], [200, 214, 12], [318, 204, 12]])}`,

  // 2. the Eclipse Demon wakes up from the bottom of the sea and swallows the moonlight
  comic2: I => `${sky(I, [[0, '#07030f'], [0.6, '#231040'], [1, '#4a1c70']])}
    ${stars(30, 11, 120, '#d9c8ff')}
    ${halo(I, 'eg', 238, 132, 120, '#b45cff')}
    <defs><clipPath id="${I('mc')}"><circle cx="70" cy="52" r="${f1(31 * 0.95)}"/></clipPath></defs>
    ${moon(70, 52, 0.95, 'hurt')}
    <g clip-path="url(#${I('mc')})"><circle cx="92" cy="44" r="30" fill="#140820" opacity="0.94"/></g>
    <path d="M150,20 L160,40 L152,42 L166,66" fill="none" stroke="#e3b6ff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M330,26 L318,46 L326,48 L312,72" fill="none" stroke="#e3b6ff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    ${put('eclipse0', 238, 132, 1.25)}
    ${sea(I, 's1', 170, '#3a2470', '#100626', { amp: 3, len: 40 })}
    ${shimmer(238, 178, 6, '#d08cff')}
    ${foam([[170, 170, 6], [184, 166, 8], [200, 168, 6], [276, 168, 6], [292, 165, 8], [306, 170, 6]], 1.8, '#e9d8ff')}
    ${sea(I, 's2', 196, '#2a1858', '#0a0418', { amp: 2.6, len: 36, ph: 1.4 })}
    ${glints([[40, 206, 12], [150, 210, 14], [330, 208, 12]], '#c9a6ff', 0.6)}`,

  // 3. he sends the Black Armada, the Kraken and the Leviathan to take the islands
  comic3: I => `${sky(I, [[0, '#1d0716'], [0.55, '#6e1f2e'], [1, '#d4603a']])}
    ${stars(14, 5, 70, '#ffd6c0')}
    <g opacity="0.55">${put('eclEye', 180, 40, 2.2)}</g>
    <g opacity="0.45">${put('cloud0', 70, 70, 0.9)}${put('cloud2', 300, 52, 0.8)}</g>
    ${put('galleon0', 300, 166, -0.42)}${put('sloop1', 128, 166, -0.42)}
    ${put('flag0', 210, 172, -0.6)}
    ${sea(I, 's1', 168, '#7a3a50', '#2a0e22', { amp: 2.4, len: 46 })}
    ${put('krakenA', 54, 198, 0.66)}
    ${put('levHead_open', 340, 178, -0.7, -14)}
    ${foam([[16, 186, 6], [30, 182, 7], [78, 182, 7], [92, 186, 6], [300, 188, 6], [316, 184, 7], [340, 186, 6]], 1.8, '#ffe6dc')}
    ${sea(I, 's2', 190, '#5a2a48', '#1a0816', { amp: 2.8, len: 34, ph: 0.6 })}
    ${glints([[150, 204, 14], [240, 210, 12]], '#ffb59a', 0.6)}`,

  // 4. at the top of the lighthouse, little Marina lifts her lantern to the sky
  comic4: I => `${sky(I, [[0, '#10103a'], [0.65, '#2c3478'], [1, '#4a4f9a']])}
    ${stars(40, 21, 140)}
    ${halo(I, 'mg', 306, 46, 52, '#fff1b8')}
    ${moon(306, 46, 0.8, 'calm')}
    <defs>${lin(I('bm'), [[0, '#fff1b0', 0.55], [1, '#fff1b0', 0]], 1, 0)}</defs>
    <path d="M66,76 L370,8 L370,96 Z" fill="url(#${I('bm')})"/>
    ${sea(I, 's1', 176, '#2a5a9a', '#0c2550', { amp: 1.4, len: 30 })}
    ${sil(I, put('flag0', 196, 178, -0.26) + put('galleon0', 266, 178, -0.24) + put('sloop0', 320, 178, -0.24) + put('sloop1', 150, 179, -0.2))}
    ${[[162, 160], [190, 150], [214, 156], [262, 164], [318, 168], [146, 172]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#ff5a4e"/><circle cx="${x}" cy="${y}" r="4" fill="#ff5a4e" opacity="0.3"/>`).join('')}
    ${put('lighthouse', 66, 262, 2.3)}
    <path d="M40,96 L176,96 L172,103 L44,103 Z" fill="#4a4458" ${ol(2)}/>
    <g transform="translate(128 96) scale(1.2)">${marina(I, 'up')}</g>
    <path d="M44,80 H176" stroke="${OUT}" stroke-width="4.6" stroke-linecap="round"/><path d="M44,80 H176" stroke="#6e6880" stroke-width="2.4" stroke-linecap="round"/>
    ${[52, 74, 96, 150, 172].map(x => `<path d="M${x},80 V96" stroke="${OUT}" stroke-width="3.6"/><path d="M${x},81 V95" stroke="#6e6880" stroke-width="1.6"/>`).join('')}`,

  // 5. the moon wakes up furious
  comic5: I => `${burst(180, 108, 22, '#1d347e', '#2b4aa8', 0.1)}
    ${speed(180, 108, 46, 104, 3)}
    ${halo(I, 'mg', 180, 104, 130, '#fff1b8')}
    ${moon(180, 104, 2.35, 'angry')}
    <path d="M-10,230 L-10,170 C20,150 40,176 58,160 C66,150 60,138 50,136 C66,130 84,146 80,166 C76,190 40,196 30,230 Z" fill="#2a9fd6" ${ol(2.4)}/>
    <path d="M370,230 L370,170 C340,150 320,176 302,160 C294,150 300,138 310,136 C294,130 276,146 280,166 C284,190 320,196 330,230 Z" fill="#2a9fd6" ${ol(2.4)}/>
    ${foam([[50, 138, 6], [62, 136, 5], [72, 142, 4], [310, 138, 6], [298, 136, 5], [288, 142, 4]], 1.8)}
    ${sea(I, 's1', 200, '#3ab8e6', '#155ea8', { amp: 4, len: 30, line: 2.4 })}
    ${drop(30, 120, 1.2, -20)}${drop(86, 112, 1, 10)}${drop(330, 118, 1.2, 20)}${drop(276, 110, 1, -10)}`,

  // 6. the moon lifts a giant wave: ships smash on the reef and pirates go flying
  comic6: I => `${sky(I, [[0, '#0f1c44'], [0.6, '#24508e'], [1, '#3f7cb8']])}
    ${stars(26, 31, 110)}
    ${halo(I, 'mg', 306, 40, 66, '#fff1b8')}
    <defs>${lin(I('bm'), [[0, '#fff1b0', 0.5], [1, '#fff1b0', 0.05]])}</defs>
    <path d="M292,52 L320,52 L250,170 L150,170 Z" fill="url(#${I('bm')})"/>
    ${moon(306, 40, 0.95, 'angry')}
    <g transform="translate(330 22) scale(-0.42 0.42)">${bigWave(I)}</g>
    ${put('galleon1', 214, 98, -0.46, 24)}
    ${put('pirate1', 128, 44, 0.9, -40)}${put('pirate2', 182, 34, -0.9, 30)}${put('pirate3', 84, 82, 0.9, 120)}
    ${put('plank', 112, 112, 1.2, 30)}${put('plank', 64, 120, 1, -50)}${put('plank', 140, 98, 0.9, 70)}
    ${sea(I, 's1', 186, '#2a9fd6', '#0f4a8a', { amp: 3, len: 34 })}
    ${put('sloop0', 80, 158, -0.72, -34)}
    ${put('reef1_coral', 50, 240, 0.9)}
    ${foam([[16, 176, 6], [30, 170, 8], [44, 174, 6], [92, 180, 6], [104, 176, 7]], 1.8)}
    ${drop(20, 140, 1.2, -30)}${drop(100, 150, 1, 20)}${drop(130, 130, 0.9, 40)}
    ${sea(I, 's2', 206, '#2478b0', '#0b2f5a', { amp: 2.6, len: 30, ph: 1 })}`,
};
// clip each panel to its frame: the atlas packs them edge to edge
for (const k in PANELS) S[k] = { w: W, h: H, ax: 0, ay: 0, draw: I => `<defs><clipPath id="${I('frame')}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#${I('frame')})">${PANELS[k](I)}</g>` };

module.exports = { S };
