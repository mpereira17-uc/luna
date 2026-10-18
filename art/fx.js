// FX group: the moon (player avatar) + its faces, shark allies, pickups/projectiles, treasure & merchant ships.
const { OUT, ol, limb, lin, rad, glow } = require('./lib');

const S = {};
const f2 = n => +n.toFixed(2);

// crescent = circle (cx,cy,r) minus circle (cx+ox, cy+oy, r2)
function crescent(cx, cy, r, ox, oy, r2) {
  const d = Math.hypot(ox, oy);
  const a = (r * r - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const ux = ox / d, uy = oy / d;
  const mx = cx + ux * a, my = cy + uy * a;
  const p1 = [f2(mx - uy * h), f2(my + ux * h)], p2 = [f2(mx + uy * h), f2(my - ux * h)];
  return `M${p1} A${r},${r} 0 1 1 ${p2} A${r2},${r2} 0 0 0 ${p1} Z`;
}
// 4-point twinkle
const twinkle = (x, y, r, col = '#fff', op = 1) => {
  const k = r * 0.22;
  return `<path d="M${x},${y - r} Q${x + k},${y - k} ${x + r},${y} Q${x + k},${y + k} ${x},${y + r} Q${x - k},${y + k} ${x - r},${y} Q${x - k},${y - k} ${x},${y - r} Z" fill="${col}" opacity="${op}"/>`;
};
// point on circle (deg, y down)
const pc = (cx, cy, r, deg) => [f2(cx + r * Math.cos(deg * Math.PI / 180)), f2(cy + r * Math.sin(deg * Math.PI / 180))];
const starPath = (cx, cy, R, r, rot = -90) => 'M' + Array.from({ length: 10 }, (_, k) => pc(cx, cy, k % 2 ? r : R, rot + k * 36).join(',')).join(' L') + ' Z';
const arc = (cx, cy, r, a0, a1) => { const p = pc(cx, cy, r, a0), q = pc(cx, cy, r, a1); return `M${p} A${r},${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${q}`; };

// ---------------------------------------------------------------- moons
const MOONS = {
  llena: { hi: '#fffdf2', base: '#f4ecd0', dark: '#d2c39a', sh: '#7d6a4e', glow: '#fff1c4', crat: '#c9b78c', rim: '#ffffff' },
  roja: { hi: '#ffc2b2', base: '#ff6b5a', dark: '#d8413f', sh: '#6e1430', glow: '#ff7a63', crat: '#c93c3c', rim: '#ffd9cc' },
  hielo: { hi: '#f2fcff', base: '#9fe3ff', dark: '#62b3e6', sh: '#26508f', glow: '#a8e8ff', crat: '#6cb8e2', rim: '#ffffff' },
  nueva: { hi: '#ece4ff', base: '#b49cff', dark: '#8468e0', sh: '#2f1f78', glow: '#b9a2ff', crat: '#8d72e6', rim: '#f4efff' },
  dorada: { hi: '#fff6c8', base: '#ffd36b', dark: '#eba236', sh: '#8a4a12', glow: '#ffd36b', crat: '#e4a03a', rim: '#fffbe2' },
  tormenta: { hi: '#e2ebff', base: '#8fa8d8', dark: '#5f77ad', sh: '#1f2c5c', glow: '#8fd8ff', crat: '#6b82b6', rim: '#eef4ff' },
};
const CRATERS = [[51, 15.5, 5.6], [17, 51, 5], [53, 53, 3.8], [22.5, 14.5, 3], [36, 60.5, 3], [10, 33, 2.4], [62.5, 31, 2.2], [37, 9, 1.9], [44, 55, 1.6], [28, 56, 1.4], [36, 27, 1.5]];

function moon(key) {
  const c = MOONS[key];
  return (I) => {
    const C = 36, R = 31;
    const craters = CRATERS.map(([x, y, r]) => `
      <circle cx="${x}" cy="${y}" r="${r}" fill="${c.crat}" opacity="0.42"/>
      <path d="${crescent(x, y, r, r * 0.32, r * 0.32, r * 0.92)}" fill="${c.sh}" opacity="0.16"/>
      <path d="${arc(x, y, r, 10, 120)}" fill="none" stroke="${c.hi}" stroke-width="${Math.max(0.8, r * 0.22)}" stroke-linecap="round" opacity="0.6"/>`).join('');
    let extra = '';
    if (key === 'hielo') extra = `
      <path d="M14,24 L22,29 L19,36 M22,29 L29,27" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>
      <path d="M52,52 L58,46 M55,49 L60,52" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.55"/>
      ${twinkle(17, 22, 2.6, '#fff', 0.95)}${twinkle(58, 42, 1.8, '#fff', 0.85)}`;
    if (key === 'dorada') extra = `${twinkle(18, 21, 3, '#fff', 0.95)}${twinkle(57, 48, 2, '#fff', 0.85)}${twinkle(44, 10, 1.5, '#fff', 0.8)}`;
    if (key === 'nueva') extra = `<circle cx="16" cy="26" r="0.9" fill="#fff" opacity="0.85"/><circle cx="56" cy="40" r="0.8" fill="#fff" opacity="0.8"/><circle cx="41" cy="62" r="0.7" fill="#fff" opacity="0.7"/>${twinkle(19, 51, 1.8, '#fff', 0.85)}${twinkle(54, 16, 1.4, '#fff', 0.7)}`;
    if (key === 'roja') extra = `<path d="M30,15 C36,13 43,16 41,22 C39,27 31,26 28,22 Z" fill="${c.sh}" opacity="0.12"/>`;
    let bolts = '';
    if (key === 'tormenta') {
      const B = ['M5,29 L12,30.5 L10.5,36 L18,39 L16,44', 'M43,5.5 L40,11 L46,14 L42.5,20', 'M67,41 L60.5,43.5 L62,48.5 L55,52.5 L55.5,59', 'M23,66 L25.5,60 L20.5,57.5', 'M10.5,36 L6,40']; 
      bolts = B.map(d => `<path d="${d}" fill="none" stroke="#2fd8ff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" filter="url(#${I('bl')})"/>
        <path d="${d}" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
        <path d="${d}" fill="none" stroke="#7ff0ff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${d}" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
      extra = `<path d="M18,14 C26,10 36,12 34,18 C30,22 20,21 18,14 Z" fill="${c.sh}" opacity="0.14"/><path d="M40,64 C46,58 58,56 62,52 L64,64 Z" fill="${c.sh}" opacity="0.12"/>`;
    }
    return `<defs>
      ${rad(I('gl'), [[0.8, c.glow, 0.9], [0.885, c.glow, 0.45], [1, c.glow, 0]])}
      ${rad(I('d'), [[0, c.hi], [0.5, c.base], [1, c.dark]], 0.36, 0.32, 0.8)}
      <clipPath id="${I('c')}"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
      ${key === 'tormenta' ? `<filter id="${I('bl')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>` : ''}
    </defs>
    <circle cx="${C}" cy="${C}" r="35.5" fill="url(#${I('gl')})"/>
    <circle cx="${C}" cy="${C}" r="${R}" fill="url(#${I('d')})"/>
    <g clip-path="url(#${I('c')})">
      <path d="M44,28 C52,26 60,30 59,38 C57,44 49,44 45,40 C41,37 40,30 44,28 Z" fill="${c.crat}" opacity="0.28"/>
      <path d="M14,40 C18,36 26,37 28,42 C30,48 24,54 18,53 C13,51 11,45 14,40 Z" fill="${c.crat}" opacity="0.25"/>
      <path d="M26,6 C32,4 40,6 40,9 C36,11 30,10 26,6 Z" fill="${c.crat}" opacity="0.2"/>
      ${extra}
      ${craters}
      <path d="M0,0 H72 V72 H0 Z M${C - 5},${C - 5 - 34} A34,34 0 1 0 ${C - 5},${C - 5 + 34} A34,34 0 1 0 ${C - 5},${C - 5 - 34} Z" fill="${c.sh}" fill-rule="evenodd" opacity="0.17"/>
      <path d="M0,0 H72 V72 H0 Z M${C - 10},${C - 10 - 36} A36,36 0 1 0 ${C - 10},${C - 10 + 36} A36,36 0 1 0 ${C - 10},${C - 10 - 36} Z" fill="${c.sh}" fill-rule="evenodd" opacity="0.2"/>
      ${bolts}
      <path d="${arc(C, C, R - 2.2, 158, 290)}" fill="none" stroke="${c.rim}" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>
      <path d="${arc(C, C, R - 1.6, 20, 75)}" fill="none" stroke="${c.glow}" stroke-width="1.4" stroke-linecap="round" opacity="0.45"/>
      <ellipse cx="22" cy="18.5" rx="6" ry="3" transform="rotate(-40 22 18.5)" fill="#fff" opacity="0.4"/>
      <circle cx="15.5" cy="27" r="1.4" fill="#fff" opacity="0.45"/>
    </g>
    <circle cx="${C}" cy="${C}" r="${R}" fill="none" ${ol(2.6)}/>`;
  };
}
for (const k of Object.keys(MOONS)) S['moon_' + k] = { w: 72, h: 72, ax: 36, ay: 36, draw: moon(k) };

// ---------------------------------------------------------------- moon faces (overlays for the 31-radius disc)
const BLUSH = (op = 0.5) => `<ellipse cx="18.5" cy="41" rx="4.4" ry="2.5" fill="#ff6f91" opacity="${op}"/><ellipse cx="53.5" cy="41" rx="4.4" ry="2.5" fill="#ff6f91" opacity="${op}"/>`;
const shine = (x, y, s = 1) => `<circle cx="${x + 1.2 * s}" cy="${y - 1.5 * s}" r="${1.35 * s}" fill="#fff"/><circle cx="${x - 1 * s}" cy="${y + 1.6 * s}" r="${0.65 * s}" fill="#fff"/>`;
const stroke = (w) => `fill="none" stroke="${OUT}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const L = 26.5, Rr = 45.5, EY = 32.5; // eye centres

const FACES = {
  calm: () => `
    ${BLUSH(0.45)}
    <path d="M22.5,25.6 Q26.5,23.6 30.5,25.2" ${stroke(1.7)}/><path d="M41.5,25.2 Q45.5,23.6 49.5,25.6" ${stroke(1.7)}/>
    <ellipse cx="${L}" cy="${EY}" rx="3.3" ry="4.2" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY}" rx="3.3" ry="4.2" fill="${OUT}"/>
    ${shine(L, EY)}${shine(Rr, EY)}
    <path d="M31,42.2 Q36,46.6 41,42.2" ${stroke(2)}/>`,
  happy: (I) => `
    <defs><clipPath id="${I('m')}"><path d="M26.5,40 Q36,42 45.5,40 Q45,52 36,52 Q27,52 26.5,40 Z"/></clipPath></defs>
    ${BLUSH(0.6)}
    <path d="M21.5,23.4 Q26,20.6 30.5,23" ${stroke(1.8)}/><path d="M41.5,23 Q46,20.6 50.5,23.4" ${stroke(1.8)}/>
    <ellipse cx="${L}" cy="${EY - 0.5}" rx="3.9" ry="4.9" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY - 0.5}" rx="3.9" ry="4.9" fill="${OUT}"/>
    ${shine(L - 0.2, EY - 1, 1.15)}${shine(Rr - 0.2, EY - 1, 1.15)}
    ${twinkle(L + 1.6, EY + 1.6, 1.2)}${twinkle(Rr + 1.6, EY + 1.6, 1.2)}
    <path d="M26.5,40 Q36,42 45.5,40 Q45,52 36,52 Q27,52 26.5,40 Z" fill="${OUT}"/>
    <g clip-path="url(#${I('m')})">
      <ellipse cx="36.5" cy="52" rx="7" ry="4.6" fill="#ff6f86"/><path d="M36.5,48.6 L36.5,51" stroke="#d94a66" stroke-width="0.9" stroke-linecap="round"/>
      <rect x="26" y="39" width="20" height="3.6" rx="1" fill="#fff"/>
    </g>
    <path d="M26.5,40 Q36,42 45.5,40 Q45,52 36,52 Q27,52 26.5,40 Z" ${stroke(1.6)}/>`,
  angry: (I) => `
    <defs><clipPath id="${I('e')}"><path d="M19,30.4 L33,32.6 L33,40 L19,40 Z M53,30.4 L39,32.6 L39,40 L53,40 Z"/></clipPath></defs>
    ${BLUSH(0.3)}
    <g clip-path="url(#${I('e')})">
      <ellipse cx="${L}" cy="${EY + 0.6}" rx="3.7" ry="4.5" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY + 0.6}" rx="3.7" ry="4.5" fill="${OUT}"/>
    </g>
    <circle cx="${L + 1.4}" cy="${EY + 1}" r="1.2" fill="#fff"/><circle cx="${Rr - 1}" cy="${EY + 1}" r="1.2" fill="#fff"/>
    <path d="M19.5,25 Q25,25.4 32.4,30.2 L31.6,31.8 Q25,29 19.8,27.6 Z" fill="${OUT}" ${stroke(1)}/>
    <path d="M52.5,25 Q47,25.4 39.6,30.2 L40.4,31.8 Q47,29 52.2,27.6 Z" fill="${OUT}" ${stroke(1)}/>
    <path d="M27.6,42.6 Q36,40.6 44.4,42.6 L44,47.4 Q36,45.8 28,47.4 Z" fill="#fff" ${stroke(1.7)}/>
    <path d="M28,45 Q36,43.4 44,45" ${stroke(1)}/>
    <path d="M31.8,41.9 L32,46.6 M36,41.4 L36,46 M40.2,41.9 L40,46.6" ${stroke(1)}/>`,
  hurt: () => `
    ${BLUSH(0.35)}
    <path d="M21,24.4 Q25,24.6 29.6,22.2" ${stroke(1.7)}/><path d="M51,24.4 Q47,24.6 42.4,22.2" ${stroke(1.7)}/>
    <path d="M22.4,28.6 L29.6,32.6 L22.4,36.6" ${stroke(2.5)}/><path d="M49.6,28.6 L42.4,32.6 L49.6,36.6" ${stroke(2.5)}/>
    <path d="M29.5,45.4 Q31.2,42.6 33,45 Q34.8,47.2 36.5,44.6 Q38.2,42.2 40,44.8 Q41.6,47 43,44.2" ${stroke(1.9)}/>
    <path d="M55.5,17 C57.6,20.6 58.8,22.6 58.8,24.4 A3.3,3.3 0 0 1 52.2,24.4 C52.2,22.6 53.4,20.6 55.5,17 Z" fill="#d6f3ff" ${stroke(1.2)}/>
    <ellipse cx="54.4" cy="23.6" rx="0.8" ry="1.3" fill="#fff"/>`,
  cool: (I) => `
    <defs><clipPath id="${I('e')}"><path d="M19,31 L33,30.2 L33,40 L19,40 Z M39,30.2 L53,31 L53,40 L39,40 Z"/></clipPath></defs>
    ${BLUSH(0.35)}
    <path d="M21.5,27.2 Q26,26 30.8,26.8" ${stroke(1.8)}/><path d="M41.4,24.6 Q46,21.6 50.6,24.2" ${stroke(1.8)}/>
    <g clip-path="url(#${I('e')})">
      <ellipse cx="${L + 0.6}" cy="${EY + 0.4}" rx="3.6" ry="4.3" fill="${OUT}"/><ellipse cx="${Rr + 0.6}" cy="${EY + 0.4}" rx="3.6" ry="4.3" fill="${OUT}"/>
    </g>
    <path d="M22.2,30.9 L31.6,30.3 M40.4,30.3 L49.8,30.9" ${stroke(2.2)}/>
    <circle cx="${L + 2}" cy="${EY + 0.6}" r="1.15" fill="#fff"/><circle cx="${Rr + 2}" cy="${EY + 0.6}" r="1.15" fill="#fff"/>
    <path d="M30.5,44.4 Q37,46 42.6,41.6" ${stroke(2)}/>
    <path d="M41.6,40.2 Q43.6,41 43.6,43.2" ${stroke(1.4)}/>`,
};
// each moon's own resting face, the reactions every moon shares, and a closed-eye blink for the resting faces
const eyesOpen = (rx = 3.3, ry = 4.2, dx = 0, dy = 0, s = 1) => `<ellipse cx="${L + dx}" cy="${EY + dy}" rx="${rx}" ry="${ry}" fill="${OUT}"/><ellipse cx="${Rr + dx}" cy="${EY + dy}" rx="${rx}" ry="${ry}" fill="${OUT}"/>${shine(L + dx, EY + dy, s)}${shine(Rr + dx, EY + dy, s)}`;
const shut = (q = 3.2, w = 2) => `<path d="M22.6,${EY} Q${L},${EY + q} 30.4,${EY}" ${stroke(w)}/><path d="M41.6,${EY} Q${Rr},${EY + q} 49.4,${EY}" ${stroke(w)}/>`;
const SWEAT = `<path d="M55.5,17 C57.6,20.6 58.8,22.6 58.8,24.4 A3.3,3.3 0 0 1 52.2,24.4 C52.2,22.6 53.4,20.6 55.5,17 Z" fill="#d6f3ff" ${stroke(1.2)}/><ellipse cx="54.4" cy="23.6" rx="0.8" ry="1.3" fill="#fff"/>`;
const GRIN = (I) => `<defs><clipPath id="${I('g')}"><path d="M27,40.5 Q36,43 45,40.5 Q44,51 36,51 Q28,51 27,40.5 Z"/></clipPath></defs>
    <path d="M27,40.5 Q36,43 45,40.5 Q44,51 36,51 Q28,51 27,40.5 Z" fill="${OUT}"/>
    <g clip-path="url(#${I('g')})"><ellipse cx="36.5" cy="51.4" rx="7.5" ry="4.8" fill="#ff6f86"/><rect x="26" y="39.5" width="20" height="3.6" rx="1" fill="#fff"/></g>
    <path d="M27,40.5 Q36,43 45,40.5 Q44,51 36,51 Q28,51 27,40.5 Z" ${stroke(1.6)}/>`;
const IDLE = {
  fierce: {
    brows: `<path d="M20.5,25.2 Q25.5,25.4 31.8,28.6" ${stroke(2.5)}/><path d="M51.5,25.2 Q46.5,25.4 40.2,28.6" ${stroke(2.5)}/>`,
    eyes: (I) => `<defs><clipPath id="${I('e')}"><path d="M19,29.2 L33,31 L33,40 L19,40 Z M53,29.2 L39,31 L39,40 L53,40 Z"/></clipPath></defs>
      <g clip-path="url(#${I('e')})"><ellipse cx="${L}" cy="${EY + 0.4}" rx="3.6" ry="4.4" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY + 0.4}" rx="3.6" ry="4.4" fill="${OUT}"/></g>
      <circle cx="${L + 1.3}" cy="${EY + 1}" r="1.2" fill="#fff"/><circle cx="${Rr + 1.3}" cy="${EY + 1}" r="1.2" fill="#fff"/>`,
    shut: shut(2.4, 2.2),
    mouth: `<path d="M30.5,43.8 Q37,46.4 42.8,41.4" ${stroke(2)}/><path d="M39,43.9 L40.3,46.6 L41.5,43.2 Z" fill="#fff" ${stroke(0.9)}/>`,
    blush: 0.35,
  },
  serene: {
    brows: `<path d="M22,24.4 Q26.5,22.6 31,24.2" ${stroke(1.6)}/><path d="M41,24.2 Q45.5,22.6 50,24.4" ${stroke(1.6)}/>`,
    eyes: (I) => `<defs><clipPath id="${I('e')}"><rect x="19" y="32" width="34" height="10"/></clipPath></defs>
      <g clip-path="url(#${I('e')})"><ellipse cx="${L}" cy="${EY + 0.6}" rx="3.4" ry="4.2" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY + 0.6}" rx="3.4" ry="4.2" fill="${OUT}"/></g>
      <path d="M22.3,32.1 Q${L},30.9 30.7,32.1" ${stroke(1.9)}/><path d="M41.3,32.1 Q${Rr},30.9 49.7,32.1" ${stroke(1.9)}/>
      <circle cx="${L + 1.2}" cy="${EY + 2}" r="0.9" fill="#fff"/><circle cx="${Rr + 1.2}" cy="${EY + 2}" r="0.9" fill="#fff"/>`,
    shut: shut(2.6, 1.9),
    mouth: `<path d="M32.4,43.6 Q36,45.6 39.6,43.6" ${stroke(1.8)}/>`,
    extra: `${twinkle(55.5, 25, 2.4, '#ffffff', 0.95)}${twinkle(17, 45, 1.5, '#ffffff', 0.8)}`,
    blush: 0.28,
  },
  sly: {
    brows: `<path d="M21.8,27.2 Q26,26.4 30.6,27.4" ${stroke(1.8)}/><path d="M41.2,23.6 Q46,20.2 50.6,23.4" ${stroke(1.8)}/>`,
    eyes: (I) => `<defs><clipPath id="${I('e')}"><path d="M19,31 L33,31 L33,40 L19,40 Z M39,26 L53,26 L53,40 L39,40 Z"/></clipPath></defs>
      <g clip-path="url(#${I('e')})"><ellipse cx="${L + 1.2}" cy="${EY + 0.4}" rx="3.2" ry="4.1" fill="${OUT}"/><ellipse cx="${Rr + 1.2}" cy="${EY}" rx="3.2" ry="4.1" fill="${OUT}"/></g>
      <path d="M22.4,31.1 H30.6" ${stroke(1.9)}/>
      <circle cx="${L + 2.4}" cy="${EY + 1.2}" r="1" fill="#fff"/>${twinkle(Rr + 2.2, EY - 1, 1.5, '#fff')}`,
    shut: `<path d="M22.6,32.4 Q${L},34.4 30.4,32.4" ${stroke(2)}/><path d="M41.6,31.8 Q${Rr},35 49.4,31.8" ${stroke(2)}/>`,
    mouth: `<path d="M31.5,44 Q36.5,45 41.8,41.4" ${stroke(2)}/><path d="M41.2,40.2 Q42.9,41 42.7,42.9" ${stroke(1.4)}/>`,
    blush: 0.32,
  },
  grumpy: {
    brows: `<path d="M20.5,26.4 L31.6,29.2" ${stroke(3.1)}/><path d="M51.5,26.4 L40.4,29.2" ${stroke(3.1)}/>`,
    eyes: () => `<ellipse cx="${L}" cy="${EY + 1.2}" rx="2.6" ry="3.1" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY + 1.2}" rx="2.6" ry="3.1" fill="${OUT}"/><circle cx="${L + 1}" cy="${EY}" r="0.9" fill="#fff"/><circle cx="${Rr + 1}" cy="${EY}" r="0.9" fill="#fff"/>`,
    shut: `<path d="M22.8,33.4 H30.2" ${stroke(2.2)}/><path d="M41.8,33.4 H49.2" ${stroke(2.2)}/>`,
    mouth: `<path d="M31,45.8 Q36,42.4 41,45.8" ${stroke(2)}/>`,
    extra: `<path d="M49.5,13.2 Q51.6,15.3 49.5,17.4 M55.7,13.2 Q53.6,15.3 55.7,17.4 M50.5,12.2 Q52.6,14.3 54.7,12.2 M50.5,18.4 Q52.6,16.3 54.7,18.4" fill="none" stroke="#ff5f6d" stroke-width="1.5" stroke-linecap="round"/>`,
    blush: 0.22,
  },
  greedy: {
    brows: `<path d="M21.5,23.4 Q26,20.6 30.5,23" ${stroke(1.8)}/><path d="M41.5,23 Q46,20.6 50.5,23.4" ${stroke(1.8)}/>`,
    eyes: () => `<ellipse cx="${L}" cy="${EY - 0.4}" rx="3.9" ry="4.8" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY - 0.4}" rx="3.9" ry="4.8" fill="${OUT}"/>${twinkle(L + 0.4, EY - 0.8, 2.7, '#ffe27a')}${twinkle(Rr + 0.4, EY - 0.8, 2.7, '#ffe27a')}<circle cx="${L + 2}" cy="${EY + 2.2}" r="0.7" fill="#fff"/><circle cx="${Rr + 2}" cy="${EY + 2.2}" r="0.7" fill="#fff"/>`,
    shut: `<path d="M22.4,34 Q${L},29.8 30.6,34" ${stroke(2.2)}/><path d="M41.4,34 Q${Rr},29.8 49.6,34" ${stroke(2.2)}/>`,
    mouth: GRIN,
    extra: `${twinkle(57, 47, 2.2, '#fff2a8')}`,
    blush: 0.6,
  },
  calm: {
    brows: `<path d="M22.5,25.6 Q26.5,23.6 30.5,25.2" ${stroke(1.7)}/><path d="M41.5,25.2 Q45.5,23.6 49.5,25.6" ${stroke(1.7)}/>`,
    eyes: () => eyesOpen(),
    shut: shut(3.2, 2),
    mouth: `<path d="M31,42.2 Q36,46.6 41,42.2" ${stroke(2)}/>`,
    blush: 0.45,
  },
};
const part = (v, I) => typeof v === 'function' ? v(I) : (v || '');
for (const k of Object.keys(IDLE)) {
  const F = IDLE[k];
  const face = closed => I => `${BLUSH(F.blush)}${part(F.brows, I)}${closed ? F.shut : part(F.eyes, I)}${part(F.mouth, I)}${part(F.extra, I)}`;
  if (k !== 'calm') FACES[k] = face(false);
  FACES[k + '_blink'] = face(true);
}
Object.assign(FACES, {
  worried: () => `
    ${BLUSH(0.3)}
    <path d="M21.5,26.6 Q26,25.8 30.6,22.6" ${stroke(1.8)}/><path d="M50.5,26.6 Q46,25.8 41.4,22.6" ${stroke(1.8)}/>
    ${eyesOpen(3.1, 4, 0, 0.6, 0.9)}
    <path d="M30.5,45.4 Q32.5,43.6 34.4,45.2 Q36.2,46.8 38,45.2 Q39.8,43.6 41.5,45.4" ${stroke(1.8)}/>
    ${SWEAT}`,
  surprised: () => `
    ${BLUSH(0.35)}
    <path d="M21.5,22.2 Q26,19.2 30.5,21.8" ${stroke(1.8)}/><path d="M41.5,21.8 Q46,19.2 50.5,22.2" ${stroke(1.8)}/>
    <ellipse cx="${L}" cy="${EY}" rx="4.4" ry="5.2" fill="${OUT}"/><ellipse cx="${Rr}" cy="${EY}" rx="4.4" ry="5.2" fill="${OUT}"/>
    <circle cx="${L + 1.4}" cy="${EY - 1.8}" r="1.9" fill="#fff"/><circle cx="${Rr + 1.4}" cy="${EY - 1.8}" r="1.9" fill="#fff"/><circle cx="${L - 1.3}" cy="${EY + 2}" r="0.8" fill="#fff"/><circle cx="${Rr - 1.3}" cy="${EY + 2}" r="0.8" fill="#fff"/>
    <ellipse cx="36" cy="46" rx="3.3" ry="4" fill="${OUT}"/><ellipse cx="36" cy="47.6" rx="2" ry="1.6" fill="#ff6f86"/>`,
  sad: () => `
    ${BLUSH(0.3)}
    <path d="M21.5,27 Q26,26.2 30.6,23" ${stroke(1.8)}/><path d="M50.5,27 Q46,26.2 41.4,23" ${stroke(1.8)}/>
    <path d="M22.6,34.4 Q${L},31 30.4,34.4" ${stroke(2.1)}/><path d="M41.6,34.4 Q${Rr},31 49.4,34.4" ${stroke(2.1)}/>
    <path d="M47.6,36.4 C49.2,39.4 50.2,41 50.2,42.4 A2.6,2.6 0 0 1 45,42.4 C45,41 46,39.4 47.6,36.4 Z" fill="#9fe3ff" ${stroke(1.1)}/>
    <path d="M31,46.8 Q36,42.6 41,46.8" ${stroke(2)}/>`,
  cheer: (I) => `
    ${BLUSH(0.7)}
    <path d="M21.5,22.8 Q26,19.8 30.5,22.4" ${stroke(1.8)}/><path d="M41.5,22.4 Q46,19.8 50.5,22.8" ${stroke(1.8)}/>
    <path d="M22.2,34.6 Q${L},29.2 30.8,34.6" ${stroke(2.5)}/><path d="M41.2,34.6 Q${Rr},29.2 49.8,34.6" ${stroke(2.5)}/>
    ${GRIN(I)}
    ${twinkle(12, 22, 3, '#fff2a8')}${twinkle(60, 20, 2.4, '#fff2a8')}${twinkle(61, 52, 1.8, '#ffffff')}`,
  effort: () => `
    ${BLUSH(0.45)}
    <path d="M20.5,25 Q25.5,25.6 31.6,29.4" ${stroke(2.3)}/><path d="M51.5,25 Q46.5,25.6 40.4,29.4" ${stroke(2.3)}/>
    <path d="M22,31.4 Q${L},35.4 31,33.2" ${stroke(2.4)}/><path d="M50,31.4 Q${Rr},35.4 41,33.2" ${stroke(2.4)}/>
    <path d="M27.6,42.4 Q36,40.6 44.4,42.4 L44,47.4 Q36,45.8 28,47.4 Z" fill="#fff" ${stroke(1.7)}/>
    <path d="M28,44.9 Q36,43.3 44,44.9" ${stroke(1)}/><path d="M31.8,41.8 L32,46.7 M36,41.3 L36,46.1 M40.2,41.8 L40,46.7" ${stroke(1)}/>
    <path d="M9,30 l-4,-1.5 M9.5,35 l-4.5,0.5 M63,30 l4,-1.5 M62.5,35 l4.5,0.5" ${stroke(1.6)}/>`,
});
for (const k of Object.keys(FACES)) S['face_' + k] = { w: 72, h: 72, ax: 36, ay: 36, draw: (I) => FACES[k](I) };


// ---------------------------------------------------------------- allies: shark
const SHARK_BODY = 'M69.5,15.6 C69.6,12.2 66.6,9.6 61.6,8.6 C55.6,7.5 48.6,7.2 42.6,7.6 C41.4,1.4 37.6,-7.4 28.4,-11.6 C31,-5.6 32.6,1.6 33.2,9.3 C26.4,10.2 19.8,11.6 15,13.2 C12.4,10.4 8.8,6.4 4.2,3.6 C5.6,7.8 7,11.6 8.8,15.2 C7.2,18.6 6,22 4.6,26 C9,23.6 12.4,20.6 15,18 C21.6,20.8 29,22.4 36,22.9 C34.4,24.6 33,26 31.6,27 C36.6,26.8 41.4,25.4 44.4,22.6 C50.4,22.6 57.2,21.6 62.2,20.1 C66.6,19 69.4,17.6 69.5,15.6 Z';
S.shark = {
  w: 72, h: 44, ax: 36, ay: 29, draw: (I) => `<defs>
    ${lin(I('b'), [[0, '#a9c3dc'], [0.38, '#6f90b3'], [1, '#3e5878']])}
    ${lin(I('w'), [[0, '#ffffff'], [1, '#c9d3e0']])}
    <clipPath id="${I('c')}"><path d="${SHARK_BODY}"/></clipPath>
    <clipPath id="${I('m')}"><path d="M68.4,16.4 C64.6,17 59.6,16.8 54.6,15.4 C55.4,18.4 59.4,20.4 63.6,19.6 C66.4,19 68.2,17.8 68.4,16.4 Z"/></clipPath>
  </defs><g transform="translate(0 14)">
  <path d="${SHARK_BODY}" fill="url(#${I('b')})"/>
  <g clip-path="url(#${I('c')})">
    <path d="M72,15.4 C66,17.6 58,18.4 50,18.2 C40,18 29,17.6 22,17.4 C19,17.4 16.6,18 14,19.4 L14,32 L72,32 Z" fill="url(#${I('w')})"/>
    <path d="M14,19.4 C16.6,18 19,17.4 22,17.4 C29,17.6 40,18 50,18.2 C58,18.4 66,17.6 72,15.4" fill="none" stroke="#56708f" stroke-width="0.9" opacity="0.7"/>
    <path d="M31.6,27 C35,25 37.6,23.4 40,21.6" fill="none" stroke="#3e5878" stroke-width="1" opacity="0.6"/>
    <path d="M36,23 C38,24.4 40,24.6 44.4,22.6 L44.4,30 L30,30 Z" fill="#3e5878" opacity="0.35"/>
    <path d="M4,4 C9,8 12,11 15.4,13.6 L15,18 C11,19 8,17 7,15 Z" fill="#2c4262" opacity="0.25"/>
    <path d="M63,8.9 C56,7.9 48,7.8 43,8.3 M40.2,3.6 C38.6,-1.6 35.4,-6.4 31,-9.2" fill="none" stroke="#e2efff" stroke-width="1.2" stroke-linecap="round" opacity="0.75"/>
  </g>
  <path d="M47.6,10.8 Q46.4,13.2 47.6,15.8 M50,10.6 Q48.8,13.2 50,15.8 M52.4,10.8 Q51.3,13.1 52.4,15.4" fill="none" stroke="#2c4262" stroke-width="0.95" stroke-linecap="round"/>
  <path d="M38.6,10.4 L43,14.4" stroke="#e8f1fb" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M39.3,12.6 L40.9,11.4 M41.2,14.2 L42.6,12.9" stroke="#2c4262" stroke-width="0.7" stroke-linecap="round"/>
  <path d="M68.4,16.4 C64.6,17 59.6,16.8 54.6,15.4 C55.4,18.4 59.4,20.4 63.6,19.6 C66.4,19 68.2,17.8 68.4,16.4 Z" fill="#fff"/>
  <g clip-path="url(#${I('m')})">
    <path d="M55,16.6 L56.3,18.5 L57.6,16.9 L58.9,19 L60.3,17.2 L61.7,19.3 L63.1,17.3 L64.5,19 L65.8,17 L67.1,18.2 L68.6,16.8" fill="none" stroke="${OUT}" stroke-width="0.85" stroke-linejoin="round"/>
    <path d="M55,19.6 C59,20.8 64,20.4 68.4,17.6 L68.4,21 L55,21 Z" fill="#c9d3e0"/>
  </g>
  <path d="M68.4,16.4 C64.6,17 59.6,16.8 54.6,15.4 C55.4,18.4 59.4,20.4 63.6,19.6 C66.4,19 68.2,17.8 68.4,16.4 Z" fill="none" ${ol(1.3)}/>
  <path d="M54.6,15.4 C53.8,15 53.2,14.2 53.1,13.3" ${ol(1.3)} fill="none"/>
  <ellipse cx="59.4" cy="11.6" rx="2.3" ry="2" fill="#fff" ${ol(1)}/><circle cx="60.1" cy="11.9" r="1.2" fill="${OUT}"/><circle cx="60.5" cy="11.4" r="0.4" fill="#fff"/>
  <path d="M56,8.8 L62.4,10.6 L62.6,9.4 C60.4,8.5 58,8.2 56,8.8 Z" fill="${OUT}" ${ol(0.9)}/>
  <path d="M36.2,-2 L32.6,5.6" stroke="#2c4262" stroke-width="1" stroke-linecap="round" opacity="0.45"/>
  <path d="${SHARK_BODY}" fill="none" ${ol(1.8)}/></g>`,
};

S.sharkFin = {
  w: 26, h: 20, ax: 13, ay: 19, draw: (I) => {
    const fin = 'M21.6,17.8 C20.8,11.6 16.6,5.6 8.6,2.6 C10.2,4.8 10.6,6.6 10.2,8.4 L8.8,9.2 L9.9,10.6 C9.2,13.2 7.2,15.8 4.8,17.8 Z';
    return `<defs>
      ${lin(I('b'), [[0, '#a9c3dc'], [0.45, '#6f90b3'], [1, '#3e5878']], 1, 0.4)}
      ${lin(I('f'), [[0, '#ffffff'], [1, '#bfe6ff']])}
      <clipPath id="${I('c')}"><path d="${fin}"/></clipPath>
    </defs>
    <ellipse cx="13" cy="18" rx="11" ry="1.8" fill="#0e2246" opacity="0.6"/>
    <path d="M4,17.4 C6,15.6 9,15.2 11,16 C14,15 18,15.2 21.6,16.6 L21.6,18 L4,18 Z" fill="#9fd8f5" ${ol(1)}/>
    <path d="${fin}" fill="url(#${I('b')})"/>
    <g clip-path="url(#${I('c')})">
      <path d="M8,2 C15,5 19,11 20,18 L24,18 L24,0 Z" fill="#2c4262" opacity="0.35"/>
      <path d="M9.2,3.4 C10.6,5 10.9,6.6 10.6,8.2" fill="none" stroke="#e2efff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
      <path d="M12.6,7 L15.4,9.8" stroke="#e8f1fb" stroke-width="1" stroke-linecap="round"/>
    </g>
    <path d="${fin}" fill="none" ${ol(1.6)}/>
    <path d="M2.4,17.8 C3.2,16.4 4.8,16 6,16.8 C7,15.8 8.6,15.8 9.6,16.8 C11.4,16 13.6,16 15.4,16.8 C16.8,15.6 18.6,15.4 19.8,16.4 C20.8,14.8 22.6,14.2 23.8,15.4 C24.4,16.4 24,17.6 23,18 C20,19 7,19 3.4,18.8 C2.6,18.6 2.2,18.2 2.4,17.8 Z" fill="url(#${I('f')})" ${ol(1.2)}/>
    <path d="M5.4,17.6 C8,18 12,18 15.6,17.6" fill="none" stroke="#8fcdee" stroke-width="0.8" stroke-linecap="round"/>
    <circle cx="23.6" cy="12.6" r="0.8" fill="#dff4ff" ${ol(0.6)}/><circle cx="21.2" cy="13.2" r="0.55" fill="#dff4ff" ${ol(0.5)}/>`;
  },
};

// ---------------------------------------------------------------- megalodon (leaping, jaws open)
function teeth(P0, P1, P2, n, len, side, tipBias = 0, bulge = 0.16) {
  // teeth along the quadratic gum curve P0->P2 (control P1); side picks the normal they point along
  const q = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
  const dq = t => [2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])];
  const T = [];
  for (let i = 0; i < n; i++) {
    const ta = i / n, tb = (i + 1) / n, tm = (ta + tb) / 2;
    const a = q(ta), b = q(tb), m = q(tm), d = dq(tm), dl = Math.hypot(d[0], d[1]);
    const tx = d[0] / dl, ty = d[1] / dl, nx = -ty * side, ny = tx * side;
    const Ln = len[0] + (len[1] - len[0]) * tm, w = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const tip = [m[0] + nx * Ln + tx * tipBias * Ln, m[1] + ny * Ln + ty * tipBias * Ln];
    const c1 = [(a[0] + tip[0]) / 2 - tx * w * bulge, (a[1] + tip[1]) / 2 - ty * w * bulge];
    const c2 = [(b[0] + tip[0]) / 2 + tx * w * bulge, (b[1] + tip[1]) / 2 + ty * w * bulge];
    T.push({ a, b, tip, c1, c2 });
  }
  const P = v => v.map(f2).join(',');
  const zig = T.map(t => `Q${P(t.c1)} ${P(t.tip)} Q${P(t.c2)} ${P(t.b)}`).join(' ');
  const shapes = T.map(t => `M${P(t.a)} Q${P(t.c1)} ${P(t.tip)} Q${P(t.c2)} ${P(t.b)} Z`).join(' ');
  const shines = T.map(t => `M${f2(t.a[0] * 0.62 + t.tip[0] * 0.38 + (t.b[0] - t.a[0]) * 0.12)},${f2(t.a[1] * 0.62 + t.tip[1] * 0.38 + (t.b[1] - t.a[1]) * 0.12)} L${f2(t.a[0] * 0.3 + t.tip[0] * 0.7 + (t.b[0] - t.a[0]) * 0.1)},${f2(t.a[1] * 0.3 + t.tip[1] * 0.7 + (t.b[1] - t.a[1]) * 0.1)}`).join(' ');
  return { zig, shapes, shines };
}
const drop = (x, y, r) => `<path d="M${x},${y - r * 2.1} C${x + r * 0.5},${y - r * 1.1} ${x + r},${y - r * 0.5} ${x + r},${y} A${r},${r} 0 0 1 ${x - r},${y} C${x - r},${y - r * 0.5} ${x - r * 0.5},${y - r * 1.1} ${x},${y - r * 2.1} Z" fill="#cdeeff" ${ol(1)}/><ellipse cx="${x - r * 0.35}" cy="${y - r * 0.2}" rx="${r * 0.28}" ry="${r * 0.45}" fill="#fff"/>`;
const scarLine = (d, w = 1.5) => `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + 1.6}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#b7c0d4" stroke-width="${w}" stroke-linecap="round"/>`;
S.mega = {
  w: 170, h: 72, ax: 85, ay: 36, draw: (I) => {
    const LG = [[153.2, 55.2], [139.6, 45.6], [127, 37.6]]; // lower gum, jaw tip -> corner
    const UG = [[127, 37.6], [145.6, 28.2], [160.4, 26.6]]; // upper gum, corner -> snout
    const dn = teeth(LG[0], LG[1], LG[2], 5, [9, 3.6], 1, -0.12);
    const up = teeth(UG[0], UG[1], UG[2], 5, [3.6, 10], 1, 0.14);
    const outer = `M153.2,55.2 C154.6,56.8 154.2,58 152.2,59.4 C147,62.8 139,62.6 131.6,58.4 C121.6,52.6 112,48.6 101.6,47.6
      C94.8,56.2 82.6,62.6 69,64.6 C75.6,59.4 80.2,53.8 84,48 C78,46.8 74,46.2 70,46.4 C58,47.2 44,47.6 31.6,47.4
      C23.6,54 15.4,60.6 6.6,67 C9.6,58.6 13.4,51.2 16.6,44.4 C11.2,34.4 8.2,25 6.2,16.6 C16,26 24.6,34 30,39.4
      C33.6,37.2 38,35 44,32.6 C58,26.8 74,20.6 90.4,16.8 C91.4,15.6 92.2,14.2 92.6,12.8 L90.2,10.8 L92.8,9.4 C92.6,7.6 91.2,5.8 88.6,3.6
      C98.6,4.4 106,8.6 110.6,13.2 C120,10.2 130,8 141,7.6 C155,7.2 164.4,11.6 165.6,19.6 C165.8,23.4 163.4,26 160.4,26.6`;
    const mouth = `M153.2,55.2 ${dn.zig} ${up.zig}`;
    const sil = `${outer} L127,37.6 Z`.replace('L127,37.6 Z', '') + ` ${mouth.replace('M153.2,55.2', 'L127,37.6').replace(/^L127,37.6/, '')}`;
    const silP = `${outer.replace('M153.2,55.2', 'M153.2,55.2')} L160.4,26.6 Z`;
    const fin = 'M84,48 C80.2,53.8 75.6,59.4 69,64.6 C82.6,62.6 94.8,56.2 101.6,47.6 C95,46.8 89,47.2 84,48 Z';
    // closed silhouette: outer contour then back along upper teeth (reversed) is awkward; use a fill made of outer + mouth contours
    const full = `M153.2,55.2 ${dn.zig} ${up.zig} C163.4,26 165.8,23.4 165.6,19.6 C164.4,11.6 155,7.2 141,7.6 C130,8 120,10.2 110.6,13.2
      C106,8.6 98.6,4.4 88.6,3.6 C91.2,5.8 92.6,7.4 92.8,9.4 L90.2,10.8 L92.6,12.8 C92.2,14.2 91.4,15.6 90.4,16.8
      C74,20.6 58,26.8 44,32.6 C38,35 33.6,37.2 30,39.4 C24.6,34 16,26 6.2,16.6 C8.2,25 11.2,34.4 16.6,44.4
      C13.4,51.2 9.6,58.6 6.6,67 C15.4,60.6 23.6,54 31.6,47.4 C44,47.6 58,47.2 70,46.4 C74,46.2 78,46.8 84,48
      C80.2,53.8 75.6,59.4 69,64.6 C82.6,62.6 94.8,56.2 101.6,47.6 C112,48.6 121.6,52.6 131.6,58.4 C139,62.6 147,62.8 152.2,59.4 C154.2,58 154.6,56.8 153.2,55.2 Z`;
    return `<defs>
      ${lin(I('b'), [[0, '#64779a'], [0.42, '#3b4a66'], [1, '#202839']])}
      ${lin(I('w'), [[0, '#e9e3d4'], [1, '#9c9486']])}
      ${lin(I('t'), [[0, '#fffdf4'], [1, '#e6d9b8']])}
      ${rad(I('m'), [[0, '#16040c'], [0.45, '#5a0f26'], [1, '#b2304e']], 0.1, 0.45, 0.95)}
      ${glow(I('eg'), '#ffb43a')}
      <clipPath id="${I('c')}"><path d="${full}"/></clipPath>
    </defs>
    <path d="M14,50 C10,56 9,60 10,64 M21,54 C19,58 19,62 20.6,65 M8,26 C6,22 6,18 8,14" fill="none" stroke="#bfe6ff" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>
    ${drop(44, 60, 2)}${drop(55, 65, 1.5)}${drop(31, 63, 1.3)}${drop(124, 66, 1.6)}${drop(20, 9, 1.2)}
    <path d="M127,37.6 C140,32 152,28.6 161.4,27.4 C158,36 156.8,46 154.4,56 C146,50.6 137,44 127,37.6 Z" fill="url(#${I('m')})" ${ol(1.5)}/>
    <path d="M132,42 C139,41 147.6,45 152.6,52.4 C145,50 138.4,46.4 132,42 Z" fill="#e0607a" ${ol(1)}/>
    <path d="${full}" fill="url(#${I('b')})"/>
    <g clip-path="url(#${I('c')})">
      <path d="M152,58.6 C145,55.4 137,51.8 128,50.2 C116,48 104,43.4 92,43 C74,43 56,44 42,42.4 C37,41.8 34.4,43.2 33,45.2 C32.4,46.2 32,47.2 31.8,48.4 L31.8,74 L172,74 L172,60 Z" fill="url(#${I('w')})"/>
      <path d="M152,58.6 C145,55.4 137,51.8 128,50.2 C116,48 104,43.4 92,43 C74,43 56,44 42,42.4 C37,41.8 34.4,43.2 33,45.2 C32.4,46.2 32,47.2 31.8,48.4" fill="none" stroke="#202839" stroke-width="1" opacity="0.55"/>
      <path d="M6,16 C14,26 22,34 31,40 L31,48 C24,52 14,60 6,68 C10,58 13,50 16,44 C12,36 9,26 6,16 Z" fill="#141a28" opacity="0.35"/>
      <path d="M160,10.4 C150,8.4 136,8.6 122,11.4 C116,12.6 112,14 108.4,15 M104,9.6 C100,6.6 96,5 91.4,4.2 M84,20 C70,24.4 56,30 44,34.6" fill="none" stroke="#a7b9d8" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>
      <path d="M127,37.6 Q145.6,28.2 160.4,26.6 M153.2,55.2 Q139.6,45.6 127,37.6" fill="none" stroke="${OUT}" stroke-width="7.2" stroke-linecap="round"/>
      <path d="M127,37.6 Q145.6,28.2 160.4,26.6 M153.2,55.2 Q139.6,45.6 127,37.6" fill="none" stroke="#c9456a" stroke-width="5" stroke-linecap="round"/>
      <path d="M127.6,36 Q145.6,26.4 160,24.8" fill="none" stroke="#8e2346" stroke-width="1.3" stroke-linecap="round"/>
    </g>
    <path d="${up.shapes} ${dn.shapes}" fill="url(#${I('t')})" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="${up.shines} ${dn.shines}" stroke="#fff" stroke-width="0.9" stroke-linecap="round" opacity="0.9"/>
    <path d="${mouth}" fill="none" ${ol(1.4)}/>
    <path d="${fin}" fill="url(#${I('b')})" ${ol(1.6)}/>
    <path d="M86.4,49.6 C82,55.4 78,59.4 73.6,62.6" fill="none" stroke="#a7b9d8" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
    ${[108.5, 112.8, 117, 121.2].map((x, k) => `<path d="M${x},${21 + k * 0.6} Q${x - 2.6},${30 + k * 0.4} ${x - 0.6},${40 - k * 0.4}" fill="none" stroke="#141a28" stroke-width="1.5" stroke-linecap="round"/>`).join('')}
    ${scarLine('M92,22.4 C97,25.4 101,29.4 103.6,35')}
    <path d="M94.4,26.4 L97.2,23.4 M98.2,30 L101.2,27.6 M100.8,34 L103.8,31.8" stroke="#b7c0d4" stroke-width="1" stroke-linecap="round"/>
    ${scarLine('M58,31.2 L64,36.6', 1.2)}${scarLine('M62.4,29.6 L68.4,35', 1.2)}${scarLine('M66.8,28.2 L72.4,33.2', 1.2)}
    ${scarLine('M130.4,10.6 L134.6,27', 1.3)}
    <path d="M130,15.4 L133.4,14.2 M131.4,21.2 L134.8,20" stroke="#b7c0d4" stroke-width="1" stroke-linecap="round"/>
    <circle cx="142" cy="19" r="6.5" fill="url(#${I('eg')})"/>
    <ellipse cx="142" cy="19" rx="3.3" ry="2.7" fill="#ffd04a" ${ol(1.2)}/>
    <ellipse cx="142.6" cy="19.2" rx="0.95" ry="2.2" fill="${OUT}"/><circle cx="141" cy="18" r="0.6" fill="#fff"/>
    <path d="M135.2,14.6 L149.4,17.6 L149,15.2 C144.6,13.2 139.6,13 135.2,14.6 Z" fill="${OUT}" ${ol(1.2)}/>
    <path d="M157.6,14.2 Q159.4,13.2 160.8,14" fill="none" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="${outer}" fill="none" ${ol(2.4)}/>`;
  },
};
// ---------------------------------------------------------------- coins (6-frame spin)
const GOLD = { hi: '#fff6b8', base: '#ffd04a', mid: '#f2a72a', dark: '#b8661a', edge: '#d98a1f' };
function coinFace(I, cx, cy, R, sx) {
  // face drawn around (cx,cy), horizontally squashed by sx (negative = back side, mirrored)
  const ns = 'vector-effect="non-scaling-stroke"';
  return `<g transform="translate(${cx} ${cy}) scale(${f2(sx)} 1)">
    <circle r="${R}" fill="url(#${I('f')})" stroke="${OUT}" stroke-width="1.3" ${ns}/>
    <circle r="${R - 1.6}" fill="none" stroke="${GOLD.dark}" stroke-width="0.9" opacity="0.8" ${ns}/>
    <circle r="${R - 1}" fill="none" stroke="${GOLD.hi}" stroke-width="0.6" opacity="0.7" ${ns} stroke-dasharray="2.2 1.4"/>
    <path d="${crescent(-R * 0.12, 0, R * 0.56, R * 0.3, -R * 0.06, R * 0.46)}" fill="${GOLD.hi}" transform="translate(0.45 0.45)" opacity="0.9"/>
    <path d="${crescent(-R * 0.12, 0, R * 0.56, R * 0.3, -R * 0.06, R * 0.46)}" fill="${GOLD.mid}" stroke="${GOLD.dark}" stroke-width="0.7" ${ns}/>
    <path d="${starPath(R * 0.3, -R * 0.06, R * 0.24, R * 0.1)}" fill="${GOLD.dark}"/>
    <path d="M${-R * 0.62},${-R * 0.2} A${R * 0.66},${R * 0.66} 0 0 1 ${-R * 0.18},${-R * 0.64}" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity="0.85" ${ns}/>
  </g>`;
}
function coin(fr) {
  return (I) => {
    const R = 6.6, T = 2.4, cx = 9, cy = 9;
    const th = fr * Math.PI / 6, c = Math.cos(th), s = Math.sin(th);
    const defs = `<defs>${rad(I('f'), [[0, GOLD.hi], [0.45, GOLD.base], [1, GOLD.mid]], 0.35, 0.3, 0.8)}${lin(I('e'), [[0, '#ffe07a'], [0.5, GOLD.edge], [1, '#9a5414']], 1, 0)}</defs>`;
    if (fr === 3) {
      return `${defs}<rect x="${cx - T * 0.85}" y="${cy - R}" width="${T * 1.7}" height="${R * 2}" rx="${T * 0.8}" fill="url(#${I('e')})" ${ol(1.3)}/>
        <path d="M${cx - T * 0.5},${cy - 4.5} H${cx + T * 0.5} M${cx - T * 0.5},${cy - 1.5} H${cx + T * 0.5} M${cx - T * 0.5},${cy + 1.5} H${cx + T * 0.5} M${cx - T * 0.5},${cy + 4.5} H${cx + T * 0.5}" stroke="#9a5414" stroke-width="0.7" opacity="0.8"/>
        <path d="M${cx - 0.6},${cy - R + 1.6} V${cy - 1}" stroke="#fff" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>`;
    }
    const rx = R * Math.abs(c), off = T * s;
    const fx = cx + off * (c >= 0 ? 1 : -1) * 0.5, bx = cx - off * (c >= 0 ? 1 : -1) * 0.5;
    const edge = s > 0.01 ? (() => {
      const dir = fx > bx ? 1 : -1;
      return `<path d="M${f2(bx)},${cy - R} L${f2(fx)},${cy - R} A${f2(rx)},${R} 0 0 ${dir > 0 ? 1 : 0} ${f2(fx)},${cy + R} L${f2(bx)},${cy + R} A${f2(rx)},${R} 0 0 ${dir > 0 ? 1 : 0} ${f2(bx)},${cy - R} Z" fill="url(#${I('e')})" ${ol(1.3)}/>`;
    })() : '';
    const gl = fr === 0 ? twinkle(13.8, 4.2, 2.2, '#fff', 0.95) : fr === 1 ? twinkle(13, 4, 1.5, '#fff', 0.8) : '';
    return `${defs}${edge}${coinFace(I, f2(fx), cy, R, c)}${gl}`;
  };
}
for (let i = 0; i < 6; i++) S['coin' + i] = { w: 18, h: 18, ax: 9, ay: 9, draw: coin(i) };

// ---------------------------------------------------------------- chest
S.chest = {
  w: 34, h: 30, ax: 17, ay: 15, draw: (I) => `<defs>
    ${rad(I('g'), [[0, '#fff3b0', 0.95], [0.3, '#ffd86b', 0.55], [1, '#ffc23a', 0]])}
    ${lin(I('ray'), [[0, '#fff6c8', 0], [0.55, '#ffe27a', 0.45], [1, '#ffe27a', 0.7]], 0, 1)}
    ${lin(I('w'), [[0, '#c27b44'], [0.55, '#8f532b'], [1, '#5c3219']])}
    ${lin(I('lid'), [[0, '#d69256'], [1, '#8a4f28']])}
    ${rad(I('in'), [[0, '#ffffff'], [0.4, '#fff1a0'], [1, '#ffb52e']], 0.5, 0.7, 0.7)}
    ${lin(I('m'), [[0, '#fff0a0'], [0.5, '#ffc93e'], [1, '#c27a1c']], 1, 0)}
  </defs>
  <circle cx="17" cy="13.5" r="13" fill="url(#${I('g')})"/>
  <g fill="url(#${I('ray')})">
    <path d="M6,13 L0.8,5.6 L4,3 Z"/><path d="M28,13 L33.2,5.6 L30,3 Z"/>
    <path d="M10,12 L6.6,0.8 L11,0.8 Z" opacity="0.85"/><path d="M24,12 L27.4,0.8 L23,0.8 Z" opacity="0.85"/>
    <path d="M6,13 L1.8,6.6 L3.6,5 Z" fill="#fff6c8" opacity="0.6"/><path d="M28,13 L32.2,6.6 L30.4,5 Z" fill="#fff6c8" opacity="0.6"/>
  </g>
  <path d="M5,15.4 L29,15.4 L29.2,25.8 C29.2,27 28.4,27.8 27.2,27.8 L6.8,27.8 C5.6,27.8 4.8,27 4.8,25.8 Z" fill="url(#${I('w')})" ${ol(1.6)}/>
  <path d="M5,20.2 H29 M5,24.2 H29" stroke="#4e2a14" stroke-width="0.8" opacity="0.7"/>
  <path d="M6.2,17.2 H27.8" stroke="#e7a56a" stroke-width="0.9" opacity="0.6"/>
  <path d="M5,25.6 H29 V27 Q29,27.8 27.4,27.8 H6.6 Q5,27.8 5,27 Z" fill="#000" opacity="0.18"/>
  <rect x="8" y="15.4" width="3.2" height="12.4" fill="url(#${I('m')})" ${ol(1)}/>
  <rect x="22.8" y="15.4" width="3.2" height="12.4" fill="url(#${I('m')})" ${ol(1)}/>
  <path d="M4.8,10.4 C11,11.6 23,11.6 29.2,10.4 L29.2,16 L4.8,16 Z" fill="url(#${I('in')})" ${ol(1.2)}/>
  <ellipse cx="9" cy="15.2" rx="2.4" ry="1.1" fill="#ffd04a" ${ol(0.8)}/><ellipse cx="25" cy="15.2" rx="2.4" ry="1.1" fill="#ffd04a" ${ol(0.8)}/>
  <ellipse cx="12.6" cy="14.6" rx="2.4" ry="1.1" fill="#ffe27a" ${ol(0.8)}/><ellipse cx="21.6" cy="14.7" rx="2.2" ry="1" fill="#ffe27a" ${ol(0.8)}/>
  <circle cx="10.6" cy="13.6" r="1" fill="#ff5a7a" ${ol(0.6)}/><path d="M22.6,13.8 L23.8,12.4 L25,13.8 L23.8,14.6 Z" fill="#5be3ff" ${ol(0.6)}/>
  <g transform="rotate(-3 17 9)">
    <path d="M4,10.4 L4,6.6 C4,1.6 30,1.6 30,6.6 L30,10.4 C23,11.4 11,11.4 4,10.4 Z" fill="url(#${I('lid')})"/>
    <path d="M6,5.4 C8,3.4 13,2.6 17,2.6" fill="none" stroke="#f3bd84" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>
    <path d="M4,8.4 C11,9.2 23,9.2 30,8.4" fill="none" stroke="url(#${I('m')})" stroke-width="2.4"/>
    <path d="M4,7.2 C11,8 23,8 30,7.2 M4,9.6 C11,10.4 23,10.4 30,9.6" fill="none" stroke="${OUT}" stroke-width="0.8"/>
    <path d="M8,11 V3.9 Q9.6,3.2 11.2,3 V11.2 Z M22.8,11.2 V3 Q24.4,3.2 26,3.9 V11 Z" fill="url(#${I('m')})" ${ol(1)}/>
    <path d="M4,10.4 L4,6.6 C4,1.6 30,1.6 30,6.6 L30,10.4 C23,11.4 11,11.4 4,10.4 Z" fill="none" ${ol(1.6)}/>
    <path d="M15.2,10.6 H18.8 V13.2 Q17,14.2 15.2,13.2 Z" fill="url(#${I('m')})" ${ol(1)}/>
  </g>
  <rect x="13.8" y="17" width="6.4" height="5.6" rx="1.4" fill="url(#${I('m')})" ${ol(1.2)}/>
  <circle cx="17" cy="19.2" r="0.9" fill="${OUT}"/><path d="M17,19.4 L17,21" stroke="${OUT}" stroke-width="0.9" stroke-linecap="round"/>
  ${twinkle(4.4, 4.6, 2.1, '#fff', 0.95)}${twinkle(30.2, 19.6, 1.6, '#fff', 0.9)}${twinkle(28, 2.4, 1.3, '#fffbe0', 0.9)}`,
};

// ---------------------------------------------------------------- projectiles
S.ball = {
  w: 14, h: 14, ax: 7, ay: 7, draw: (I) => `<defs>${rad(I('b'), [[0, '#77738c'], [0.45, '#3a3650'], [1, '#14111e']], 0.36, 0.32, 0.75)}</defs>
  <circle cx="7" cy="7" r="5.2" fill="url(#${I('b')})" ${ol(1.4)}/>
  <path d="${arc(7, 7, 4.1, 20, 95)}" fill="none" stroke="#8e8aa8" stroke-width="0.8" stroke-linecap="round" opacity="0.6"/>
  <ellipse cx="5.2" cy="4.9" rx="1.7" ry="1" transform="rotate(-38 5.2 4.9)" fill="#fff" opacity="0.85"/>
  <circle cx="7.4" cy="3.9" r="0.45" fill="#fff" opacity="0.7"/>`,
};
S.bomb = {
  w: 18, h: 18, ax: 9, ay: 9, draw: (I) => `<defs>${rad(I('b'), [[0, '#6c6884'], [0.45, '#2c2840'], [1, '#0e0b16']], 0.36, 0.32, 0.75)}
    ${rad(I('sp'), [[0, '#fff6c0', 1], [0.35, '#ffb52e', 0.75], [1, '#ff6a1e', 0]])}</defs>
  <circle cx="7.8" cy="10.6" r="5.2" fill="url(#${I('b')})" ${ol(1.4)}/>
  <ellipse cx="5.9" cy="8.4" rx="1.8" ry="1.05" transform="rotate(-38 5.9 8.4)" fill="#fff" opacity="0.8"/>
  <path d="${arc(7.8, 10.6, 4.1, 15, 90)}" fill="none" stroke="#8e8aa8" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <rect x="9.6" y="4.4" width="3.4" height="2.8" rx="0.7" transform="rotate(38 11.3 5.8)" fill="#8b8aa0" ${ol(1.1)}/>
  ${limb('M12.6,4.4 Q13.4,3.2 14.6,3.9', '#d8b47a', 1, 0.7)}
  <g transform="translate(-0.2 0.5)"><circle cx="14.8" cy="3.4" r="3.2" fill="url(#${I('sp')})"/>
  <path d="M14.8,1.2 L15.4,2.8 L17,2.4 L15.8,3.6 L16.8,5 L15.1,4.4 L14.4,6 L14.2,4.3 L12.6,4.4 L13.8,3.3 L13,1.9 L14.5,2.6 Z" fill="#ffe14a" stroke="#ff7a1e" stroke-width="0.5" stroke-linejoin="round"/>
  <circle cx="14.8" cy="3.5" r="0.8" fill="#fff"/></g>`,
};
S.star = {
  w: 26, h: 26, ax: 13, ay: 13, draw: (I) => {
    const st = starPath(13.4, 13.6, 8.6, 4.4);
    return `<defs>${glow(I('g'), '#ffe6a0')}${lin(I('f'), [[0, '#fffbe6'], [0.45, '#ffe58a'], [1, '#f6b23c']], 0.6, 1)}</defs>
    <circle cx="13" cy="13" r="12.6" fill="url(#${I('g')})"/>
    <path d="M2.6,15.4 L7,14.6 M3.4,19.4 L8.6,17.2 M4.8,10.8 L7.8,11.6" stroke="#fff3c4" stroke-width="1.2" stroke-linecap="round" opacity="0.65"/>
    <path d="${st}" fill="none" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="${st}" fill="url(#${I('f')})" stroke="url(#${I('f')})" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="${starPath(13.4, 13.6, 4.6, 2.3)}" fill="#fffef4" opacity="0.55" stroke="#fffef4" stroke-width="1" stroke-linejoin="round" stroke-opacity="0.55"/>
    <path d="M8.2,9.4 L11.4,8.6 L13,4.8" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
    <path d="M18.6,16.4 L19.8,20.6" stroke="#c9801e" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    ${twinkle(4.2, 6, 1.5, '#fff', 0.9)}`;
  },
};
S.orb = {
  w: 26, h: 26, ax: 13, ay: 13, draw: (I) => `<defs>
    ${glow(I('g'), '#b06cff')}
    ${rad(I('b'), [[0, '#ffffff'], [0.16, '#f2dcff'], [0.36, '#c27bff'], [0.72, '#5a24b0'], [1, '#26104e']])}
    ${rad(I('c'), [[0, '#ffffff', 1], [0.5, '#ffffff', 0.85], [1, '#f2dcff', 0]])}
    <clipPath id="${I('k')}"><circle cx="13" cy="13" r="8.4"/></clipPath>
  </defs>
  <circle cx="13" cy="13" r="12.6" fill="url(#${I('g')})"/>
  <circle cx="13" cy="13" r="8.4" fill="url(#${I('b')})"/>
  <g clip-path="url(#${I('k')})">
    <path d="M5,10 C8,5 15,4 18.6,7.6 M21,16 C18,21 11,22 7.4,18.4" fill="none" stroke="#e7c4ff" stroke-width="1.3" stroke-linecap="round" opacity="0.75"/>
    <path d="M7.6,14.6 C8.6,10 13,8 16.4,9.6" fill="none" stroke="#1c0a3c" stroke-width="1.2" stroke-linecap="round" opacity="0.45"/>
    <path d="${arc(13, 13, 7, 165, 255)}" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>
  </g>
  <circle cx="13" cy="13" r="3.6" fill="url(#${I('c')})"/>
  <circle cx="13" cy="13" r="1.7" fill="#fff"/>
  <circle cx="13" cy="13" r="8.4" fill="none" ${ol(1.6)}/>
  ${twinkle(21.4, 5.2, 1.8, '#f6e6ff', 0.95)}${twinkle(4.4, 20.4, 1.3, '#f6e6ff', 0.85)}`,
};
S.lava = {
  w: 22, h: 22, ax: 11, ay: 11, draw: (I) => {
    const rock = 'M3.8,11.4 C3.4,8.4 5,5.8 7.6,5 C8.8,3.8 11,3.4 12.6,4.2 C15,4 17.2,5.6 17.6,7.8 C18.8,9.4 18.6,12 17.6,13.8 C17.2,16.2 15,17.8 12.6,17.6 C10.8,18.6 8,18.2 6.8,16.8 C4.8,16.2 3.6,14 3.8,11.4 Z';
    const cracks = 'M5.6,8.2 L8.2,9.6 L7.6,12.4 L10.4,13.6 L12,16.6 M8.2,9.6 L11,9.2 L12.4,6.2 M11,9.2 L13.6,11 L17.2,10.4 M13.6,11 L13,13.8 L15.4,15.4';
    return `<defs>${glow(I('g'), '#ff7a2a')}
      ${rad(I('m'), [[0, '#fff3a0'], [0.4, '#ffb02e'], [1, '#e8401e']], 0.75, 0.8, 0.6)}
      ${rad(I('k'), [[0, '#7a4a40'], [0.55, '#45252a'], [1, '#26131c']], 0.35, 0.3, 0.8)}
      <clipPath id="${I('c')}"><path d="${rock}"/></clipPath></defs>
    <circle cx="11" cy="11" r="10.6" fill="url(#${I('g')})"/>
    <path d="${rock}" fill="url(#${I('k')})"/>
    <g clip-path="url(#${I('c')})">
      <path d="M8,20 L10.2,16.4 L12.8,16 L14.2,13.6 L16.8,13.4 L17.6,11 L20,10.6 L20,20 Z" fill="url(#${I('m')})"/>
      <path d="M8,20 L10.2,16.4 L12.8,16 L14.2,13.6 L16.8,13.4 L17.6,11 L20,10.6" fill="none" stroke="#ffde6a" stroke-width="0.7" stroke-linejoin="round"/>
      <path d="${cracks}" fill="none" stroke="#ff5a1e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
      <path d="${cracks}" fill="none" stroke="#ffc23a" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${cracks}" fill="none" stroke="#fff6c0" stroke-width="0.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5.2,9.4 C5.4,7.2 6.8,5.8 8.6,5.4 M10.4,4.6 C11.4,4.2 12.6,4.4 13.4,4.8" fill="none" stroke="#c98a72" stroke-width="1" stroke-linecap="round" opacity="0.9"/>
      <circle cx="6.2" cy="14.4" r="0.7" fill="#1c0e14" opacity="0.6"/><circle cx="14.8" cy="7.2" r="0.6" fill="#1c0e14" opacity="0.6"/>
    </g>
    <path d="${rock}" fill="none" ${ol(1.4)}/>
    <circle cx="18.8" cy="4.4" r="1" fill="#ffb02e" ${ol(0.6)}/><circle cx="3.2" cy="17.8" r="0.75" fill="#ff7a2a" ${ol(0.5)}/><circle cx="17.6" cy="18.6" r="0.6" fill="#ffd04a"/>`;
  },
};
S.shard = {
  w: 10, h: 10, ax: 5, ay: 5, draw: (I) => `<defs>${lin(I('i'), [[0, '#f4fdff'], [0.5, '#9fe3ff'], [1, '#3f8fd4']], 0.6, 1)}</defs>
  <path d="M1.4,5.8 L4.4,2.2 L8.8,4.2 L4.6,7.9 Z" fill="url(#${I('i')})" ${ol(1)}/>
  <path d="M1.4,5.8 L8.8,4.2 M4.4,2.2 L5.4,5" fill="none" stroke="#ffffff" stroke-width="0.6" stroke-linecap="round" opacity="0.85"/>
  <path d="M4.6,7.9 L5.4,5 L8.8,4.2" fill="#2f6fb8" opacity="0.3"/>
  <circle cx="3.4" cy="4.4" r="0.45" fill="#fff"/>`,
};
S.plank = {
  w: 16, h: 8, ax: 8, ay: 4, draw: (I) => `<defs>${lin(I('w'), [[0, '#d39a5e'], [0.5, '#a3653a'], [1, '#6b3d20']])}</defs>
  <g transform="rotate(-7 8 4)">
    <path d="M2.4,2.4 L11.6,2.2 L12.6,1.6 L13,2.8 L14,3.2 L13.2,4.2 L13.8,5.6 L2.6,5.8 L1.8,4.8 L2.8,4 Z" fill="url(#${I('w')})" ${ol(1.1)}/>
    <path d="M3.4,3.4 C6,3.2 8,3.6 10.6,3.3 M4,4.8 C6.4,4.7 8.8,5 11.4,4.7" fill="none" stroke="#5a321c" stroke-width="0.5" opacity="0.8"/>
    <path d="M3,2.9 L11.4,2.7" stroke="#f0c48c" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
    <circle cx="4.4" cy="4" r="0.6" fill="#8b8aa0" stroke="${OUT}" stroke-width="0.4"/>
  </g>`,
};

// ---------------------------------------------------------------- treasure galleon
const gem = (x, y, r, col) => `<path d="M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} Z" fill="${col}" ${ol(1)}/><path d="M${x - r * 0.45},${y - r * 0.1} L${x},${y - r * 0.6}" stroke="#fff" stroke-width="0.8" stroke-linecap="round" opacity="0.9"/>`;
const miniChest = (I, x, y, w, h) => `<g transform="translate(${x} ${y})">
    <rect x="0" y="${h * 0.38}" width="${w}" height="${h * 0.62}" rx="0.8" fill="url(#${I('wd')})" ${ol(1.2)}/>
    <path d="M0,${h * 0.42} L0,${h * 0.3} C0,${-h * 0.05} ${w},${-h * 0.05} ${w},${h * 0.3} L${w},${h * 0.42} Z" fill="url(#${I('wd')})" ${ol(1.2)}/>
    <rect x="${w * 0.2}" y="0.6" width="${w * 0.13}" height="${h - 0.6}" fill="#ffd04a" ${ol(0.7)}/><rect x="${w * 0.67}" y="0.6" width="${w * 0.13}" height="${h - 0.6}" fill="#ffd04a" ${ol(0.7)}/>
    <rect x="${w * 0.4}" y="${h * 0.38}" width="${w * 0.2}" height="${h * 0.26}" rx="0.4" fill="#ffd04a" ${ol(0.7)}/>
  </g>`;
function goldship(f) {
  return (I) => {
    const b = f ? 2.4 : 0;
    const hull = 'M8,37 L24,37 L25.4,45 L74,45 C79,45 83,43.6 85.6,41 C83.8,52.4 77.4,61.6 67,66.8 C61,69.8 53.6,70.6 46,70.6 L25,70.6 C14.6,69.8 9,62 8,51 Z';
    const top = `M33,7 L49,7 C${51 + b * 0.5},10 ${51.6 + b * 0.5},12.6 ${50.6 + b * 0.4},15 L31.6,15 C30.8,12.6 31,10 33,7 Z`;
    const main = `M27.6,18 L54,18 C${57.4 + b},24 ${57.6 + b},30 ${55.6 + b * 0.6},36 L26.4,36 C${24.6 - b * 0.3},30 ${24.8 - b * 0.3},24 27.6,18 Z`;
    const fore = `M58.4,21.6 L74.4,21.6 C${77.4 + b},26.4 ${77.6 + b},31 ${75.8 + b * 0.6},36 L57.4,36 C56.4,31 56.6,26.4 58.4,21.6 Z`;
    const flag = f ? 'M42,3.4 C46,1.4 50,5.6 56,3 C54.6,5 54.6,6.4 56,8 C50,10 46,6.6 42,8.4 Z' : 'M42,3.4 C46,4.6 51,2.6 56.6,4.6 C55,6 55,7 56.6,8.4 C51,6.6 46,9 42,8.4 Z';
    const tw = f ? [[19, 26, 1.6], [80, 30, 2.4], [61, 40, 2], [50, 59, 1.4], [6, 44, 1.4]] : [[19, 26, 2.4], [80, 30, 1.5], [61, 40, 1.4], [50, 59, 2], [6, 44, 2]];
    return `<defs>
      ${lin(I('h'), [[0, '#fff0a6'], [0.35, '#ffcc4a'], [0.75, '#d68a22'], [1, '#9a5614']])}
      ${lin(I('s'), [[0, '#fffaf0'], [1, '#e6d8b8']], 1, 0)}
      ${lin(I('wd'), [[0, '#b8743f'], [1, '#6e3e20']])}
      ${rad(I('f'), [[0, GOLD.hi], [0.45, GOLD.base], [1, GOLD.mid]], 0.35, 0.3, 0.8)}
      ${rad(I('pile'), [[0, '#fff3a0'], [0.5, '#ffcc3a'], [1, '#d18a1e']], 0.4, 0.3, 0.8)}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      <clipPath id="${I('mc')}"><path d="${main}"/></clipPath>
      ${glow(I('g'), '#ffc76a')}${glow(I('gg'), '#ffe27a')}
    </defs>
    <ellipse cx="46" cy="44" rx="44" ry="30" fill="url(#${I('gg')})" opacity="0.45"/>
    <circle cx="12" cy="24" r="10" fill="url(#${I('g')})"/>
    <path d="M41,3.4 L9,37 M41,3.4 L84,42 M66,13 L86,40" stroke="#5a3f1e" stroke-width="0.8" fill="none"/>
    <rect x="39.4" y="3.2" width="3.2" height="43.8" rx="1.2" fill="#8a5a2a" ${ol(1.5)}/>
    <rect x="64.4" y="13" width="3" height="34" rx="1.2" fill="#8a5a2a" ${ol(1.5)}/>
    <g transform="translate(0 1.4)"><path d="${flag}" fill="#8e5bd8" ${ol(1.4)}/><path d="${flag}" fill="none" stroke="#ffd04a" stroke-width="0.8" opacity="0.9"/>
    <circle cx="47.6" cy="${f ? 5.2 : 5.6}" r="1.3" fill="#ffd04a" ${ol(0.7)}/></g>
    <path d="${top}" fill="url(#${I('s')})" ${ol(1.8)}/>
    <path d="${main}" fill="url(#${I('s')})"/>
    <g clip-path="url(#${I('mc')})"><path d="M${46 + b},16 C${55 + b},24 ${55 + b},30 ${50 + b},38 L62,38 L62,16 Z" fill="#a08a5a" opacity="0.16"/><rect x="20" y="32" width="40" height="5" fill="#ffd04a" opacity="0.85"/></g>
    <path d="${main}" fill="none" ${ol(2)}/>
    <path d="${fore}" fill="url(#${I('s')})" ${ol(2)}/>
    <path d="M57,31 L77,31" stroke="#ffd04a" stroke-width="2.6"/>
    <path d="M57,29.7 L77.4,29.7 M57,32.3 L77.6,32.3" stroke="${OUT}" stroke-width="0.6" opacity="0.5"/>
    ${coinFace(I, 41 + b * 0.35, 25.6, 5.2, 1)}
    <rect x="26" y="16.4" width="30" height="3" rx="1.2" fill="#8a5a2a" ${ol(1.2)}/>
    <rect x="30.4" y="5.8" width="21.2" height="2.6" rx="1.1" fill="#8a5a2a" ${ol(1.1)}/>
    <rect x="56.6" y="20" width="19.6" height="2.6" rx="1.1" fill="#8a5a2a" ${ol(1.1)}/>
    ${miniChest(I, 27, 37.4, 10, 8.4)}
    <path d="M47,46 C47,41.4 50,38.6 54,38.6 C58.6,38.6 62,41.6 62,46 Z" fill="url(#${I('pile')})" ${ol(1.3)}/>
    <ellipse cx="51" cy="41.6" rx="1.8" ry="0.9" fill="#ffe27a" stroke="#b8661a" stroke-width="0.6"/><ellipse cx="56.4" cy="42.6" rx="1.8" ry="0.9" fill="#ffe27a" stroke="#b8661a" stroke-width="0.6"/><ellipse cx="54" cy="39.8" rx="1.6" ry="0.8" fill="#fff3a0" stroke="#b8661a" stroke-width="0.6"/>
    ${gem(58.6, 40.6, 1.4, '#ff4d6d')}
    ${miniChest(I, 68, 39, 8, 7)}
    <path d="M15,37 L15,29" ${ol(1.5)}/><rect x="12.2" y="23" width="5.6" height="6.6" rx="1.5" fill="#ffe27a" ${ol(1.2)}/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <rect x="0" y="36" width="90" height="2.6" fill="#fff6c8" opacity="0.9"/>
      <rect x="0" y="45" width="90" height="4.4" fill="#ffe27a"/>
      <path d="M0,45 H90 M0,49.4 H90" stroke="#a8661a" stroke-width="0.8"/>
      <path d="M8,57.6 C30,59.6 54,59.6 84,55" stroke="#a8661a" stroke-width="1.1" fill="none"/>
      <path d="M8,57.6 C30,59.6 54,59.6 84,55" stroke="#fff3b0" stroke-width="0.6" fill="none" transform="translate(0 -1)" opacity="0.7"/>
      <rect x="0" y="64.4" width="90" height="10" fill="#3a2414"/>
      <path d="M0,64.4 H90" stroke="#c98a2a" stroke-width="0.8"/>
      <path d="M10,40 C10,46 11,54 14,60" stroke="#fff6c8" stroke-width="1.4" fill="none" opacity="0.6"/>
    </g>
    ${[13.4, 20].map(x => `<rect x="${x - 2.4}" y="39.6" width="4.8" height="4.4" rx="1.4" fill="#fff1b0" ${ol(1.1)}/>`).join('')}
    ${gem(31, 47.2, 1.9, '#ff4d6d')}${gem(42, 47.2, 1.9, '#4dc3ff')}${gem(53, 47.2, 1.9, '#5be38a')}${gem(64, 47.2, 1.9, '#c77dff')}${gem(74.6, 47, 1.7, '#ff4d6d')}
    ${[24, 38, 52, 66].map(x => `<circle cx="${x}" cy="53.4" r="1.6" fill="#fff3a0" ${ol(0.9)}/>`).join('')}
    <path d="M82.4,42.4 C86.6,41 88.4,43.4 87.4,46 C86,47.4 83.6,46.6 83,45 Z" fill="#ffe27a" ${ol(1.2)}/>
    <path d="${hull}" fill="none" ${ol(2.2)}/>
    ${tw.map(([x, y, r]) => twinkle(x, y, r, '#fff', 0.95)).join('')}`;
  };
}
S.goldship0 = { w: 90, h: 78, ax: 45, ay: 64, draw: goldship(0) };
S.goldship1 = { w: 90, h: 78, ax: 45, ay: 64, draw: goldship(1) };

// ---------------------------------------------------------------- merchant ship (friendly trader)
function merchant(f) {
  return (I) => {
    const b = f ? 2.6 : 0;
    const hull = 'M10,53 L27,53 L28,58 L91,58 C96,58 100.6,56 103,52.6 C105.6,58.4 105,66.4 100,72.8 C94,80 82,83 66,83 L40,83 C24,83 11.4,78 8.2,68 C6.8,63 7.6,57.6 10,53 Z';
    const sail = `M27,14 L53,14 C${56.6 + b},22 ${57 + b},31 ${55 + b * 0.6},40 L25.6,40 C${23.4 - b * 0.3},31 ${23.6 - b * 0.3},22 27,14 Z`;
    const banner = f
      ? 'M42,5 C48,2.6 54,6.8 61,4.2 C64,3.2 66,3.4 68,4.4 L64.6,7.2 L68.6,10.4 C66,11.2 63.6,10.6 61,10.4 C54,10.8 48,8.4 42,10.6 Z'
      : 'M42,5 C48,6.4 54,3.2 61,4.8 C64,5.4 66,5 68,3.8 L65,7.6 L68.4,11.2 C66,10.4 63.6,10.8 61,11.4 C54,9 48,11.8 42,10.6 Z';
    const N = 8, X0 = 54, W = 5.75, T0 = 58.4, TW = 4.7;
    const canopy = `M${T0},31 L${T0 + N * TW},31 L${X0 + N * W},38 L${X0},38 Z`;
    let val = `M${X0},38 L${X0 + N * W},38 L${X0 + N * W},40.6`;
    for (let k = N - 1; k >= 0; k--) val += ` Q${f2(X0 + k * W + W / 2)},45 ${f2(X0 + k * W)},40.6`;
    val += ' Z';
    const stripes = Array.from({ length: N }, (_, k) => k).filter(k => k % 2 === 0).map(k => `M${f2(T0 + k * TW)},31 L${f2(T0 + (k + 1) * TW)},31 L${f2(X0 + (k + 1) * W)},38 L${f2(X0 + (k + 1) * W)},46 L${f2(X0 + k * W)},46 L${f2(X0 + k * W)},38 Z`).join(' ');
    return `<defs>
      ${lin(I('h'), [[0, '#4cc2bb'], [0.5, '#2a9196'], [1, '#175a66']])}
      ${lin(I('cr'), [[0, '#fff6dc'], [1, '#e2d0a4']])}
      ${lin(I('s'), [[0, '#fffaf0'], [1, '#e6d8b8']], 1, 0)}
      ${lin(I('wd'), [[0, '#c98a50'], [1, '#7a4524']])}
      ${lin(I('bar'), [[0, '#9a5e32'], [0.45, '#e0a565'], [1, '#6e3e20']], 1, 0)}
      ${lin(I('sk'), [[0, '#f6e8c4'], [1, '#c9ae7a']])}
      ${rad(I('f'), [[0, GOLD.hi], [0.45, GOLD.base], [1, GOLD.mid]], 0.35, 0.3, 0.8)}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      <clipPath id="${I('sc')}"><path d="${sail}"/></clipPath>
      <clipPath id="${I('ac')}"><path d="${canopy} ${val}"/></clipPath>
      ${glow(I('g'), '#ffc76a')}
    </defs>
    <circle cx="98.4" cy="48.4" r="10" fill="url(#${I('g')})"/>
    <circle cx="15.5" cy="36" r="9" fill="url(#${I('g')})"/>
    <path d="M41,4 L11,53 M41,4 L102,52 M41,20 L58.4,31" stroke="#4a3a2e" stroke-width="0.8" fill="none"/>
    <rect x="39.4" y="3.4" width="3.4" height="56" rx="1.3" fill="#8a5a32" ${ol(1.5)}/>
    <path d="${banner}" fill="#ff8a5a" ${ol(1.5)}/>
    <path d="M42,7.6 C49,8 55,6.6 62,7.4" fill="none" stroke="#fff3d6" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
    ${coinFace(I, 52, f ? 6.6 : 7.4, 2.6, 1)}
    <path d="${sail}" fill="url(#${I('s')})"/>
    <g clip-path="url(#${I('sc')})">
      <path d="M${46 + b},12 C${56 + b},22 ${56 + b},32 ${50 + b},43 L62,43 L62,12 Z" fill="#a08a5a" opacity="0.16"/>
      <rect x="20" y="17" width="40" height="3.4" fill="#2fa3a0" opacity="0.9"/><rect x="20" y="34.4" width="40" height="3.4" fill="#2fa3a0" opacity="0.9"/>
    </g>
    <path d="${sail}" fill="none" ${ol(2)}/>
    ${coinFace(I, 40.6 + b * 0.35, 27, 6.2, 1)}
    <rect x="24.4" y="12.4" width="32" height="3.2" rx="1.3" fill="#8a5a32" ${ol(1.2)}/>
    <rect x="23.4" y="38.8" width="33" height="2.8" rx="1.2" fill="#8a5a32" ${ol(1.1)}/>
    <path d="M29,58 C28,54 29.4,50.6 33,50 C36.6,50.6 38,54 37,58 Z" fill="url(#${I('sk')})" ${ol(1.2)}/>
    <path d="M31.4,50.4 L33,48.6 L34.6,50.4" fill="none" ${ol(1.1)}/>
    <path d="M44,58 L44.4,51.6 L51.6,51.6 L52,58 Z" fill="url(#${I('bar')})" ${ol(1.2)}/><path d="M44.2,54 H51.8" stroke="#4a4458" stroke-width="1"/>
    <rect x="59.4" y="36" width="2.6" height="23" fill="#8a5a32" ${ol(1.2)}/><rect x="92.6" y="36" width="2.6" height="23" fill="#8a5a32" ${ol(1.2)}/>
    <rect x="63.4" y="44.6" width="9" height="7.4" rx="0.8" fill="url(#${I('wd')})" ${ol(1.2)}/>
    <path d="M64.2,45.4 L71.6,51.2 M71.6,45.4 L64.2,51.2" stroke="#5a321c" stroke-width="1"/>
    <path d="M74.8,44.4 C74.4,46.8 74.4,49.6 74.8,52 L82,52 C82.4,49.6 82.4,46.8 82,44.4 Z" fill="url(#${I('bar')})" ${ol(1.2)}/>
    <path d="M74.6,46.4 H82.2 M74.6,50 H82.2" stroke="#4a4458" stroke-width="0.9"/>
    <circle cx="76.8" cy="43.4" r="1.6" fill="#7ad65a" ${ol(0.8)}/><circle cx="80" cy="43.2" r="1.6" fill="#ff5a5a" ${ol(0.8)}/><circle cx="78.4" cy="41.8" r="1.4" fill="#ffb03a" ${ol(0.8)}/>
    <path d="M84,52 L84.6,47.6 L91.2,47.6 L91.8,52 Z" fill="#d9a35e" ${ol(1.1)}/>
    <path d="M85,47.4 C85.4,44.6 87,44 88,45.4 C89,44 90.6,44.6 90.8,47.4" fill="#5bc8f5" ${ol(1)}/><circle cx="86.6" cy="46" r="0.4" fill="${OUT}"/>
    <rect x="60.4" y="51.6" width="33.6" height="6.8" rx="0.8" fill="url(#${I('wd')})" ${ol(1.3)}/>
    <path d="M61.2,53.2 H93.2" stroke="#e7a56a" stroke-width="0.8" opacity="0.7"/>
    <path d="${canopy}" fill="#fff4e4"/><path d="${val}" fill="#fff4e4"/>
    <g clip-path="url(#${I('ac')})"><path d="${stripes}" fill="#e8454e"/>
      <path d="M${T0},31.6 H${T0 + N * TW}" stroke="#fff" stroke-width="1" opacity="0.5"/><rect x="50" y="38" width="54" height="1.6" fill="#000" opacity="0.14"/></g>
    <path d="${canopy}" fill="none" ${ol(1.6)}/><path d="${val}" fill="none" ${ol(1.5)}/>
    <path d="M98.4,41.4 L98.4,45.4" stroke="${OUT}" stroke-width="1"/>
    <rect x="96" y="45.4" width="4.8" height="6" rx="1.4" fill="#ffe27a" ${ol(1.2)}/><path d="M96,47.2 H100.8 M97.2,51.4 H99.6" stroke="${OUT}" stroke-width="0.7"/>
    <path d="M13,53 L13,41 L27,41 L27,53 Z" fill="url(#${I('h')})" ${ol(1.6)}/>
    <path d="M11.4,41.6 L28.6,41.6 L27,38 L13,38 Z" fill="#e8454e" ${ol(1.4)}/>
    <circle cx="20" cy="47" r="2.8" fill="#ffe7a0" ${ol(1.2)}/><path d="M20,44.4 V49.6 M17.4,47 H22.6" stroke="${OUT}" stroke-width="0.6" opacity="0.6"/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <rect x="0" y="57.4" width="110" height="5.6" fill="url(#${I('cr')})"/>
      <rect x="0" y="52.4" width="28" height="5.4" fill="url(#${I('cr')})"/>
      <path d="M0,63 H110 M28,57.4 H110" stroke="#175a66" stroke-width="0.9"/>
      <path d="M6,69.6 C34,72 70,72 106,65.6" stroke="#fff6dc" stroke-width="2.2" fill="none" opacity="0.85"/>
      <rect x="0" y="74.4" width="110" height="14" fill="#1a2c3a"/>
      <path d="M0,74.4 H110" stroke="#3fb1ad" stroke-width="0.8"/>
      <path d="M11,58 C10.6,64 12.4,70 16.4,74" stroke="#bff3ee" stroke-width="1.6" fill="none" opacity="0.5"/>
    </g>
    ${[38, 53, 68, 83].map(x => `<circle cx="${x}" cy="66.4" r="2.6" fill="#ffe7a0" ${ol(1.2)}/><circle cx="${x - 0.8}" cy="65.6" r="0.7" fill="#fff"/>`).join('')}
    ${[32, 46, 60, 74, 88].map(x => `<circle cx="${x}" cy="60.2" r="0.9" fill="#2a9196"/>`).join('')}
    <circle cx="22" cy="65" r="3.6" fill="none" stroke="${OUT}" stroke-width="3.6"/><circle cx="22" cy="65" r="3.6" fill="none" stroke="#fff" stroke-width="2"/>
    <circle cx="22" cy="65" r="3.6" fill="none" stroke="#e8454e" stroke-width="2" stroke-dasharray="2.83 2.83"/>
    <path d="M101,53.2 C104.6,51 106.8,53.4 106,56.2 C104.8,57.6 102.6,57.2 101.8,55.6 Z" fill="#fff6dc" ${ol(1.2)}/>
    <path d="${hull}" fill="none" ${ol(2.3)}/>`;
  };
}
S.merchant0 = { w: 110, h: 90, ax: 55, ay: 74, draw: merchant(0) };
S.merchant1 = { w: 110, h: 90, ax: 55, ay: 74, draw: merchant(1) };

// ---------------------------------------------------------------- anchors (Ancla weapon) and jellyfish (Medusas)
// the anchor hangs from its ring: the sprite's anchor point is the ring, so rotating it swings it like a pendulum
function anchorSpr(pal, glowCol, rune) {
  return (I) => {
    const shank = 'M21.2,10 L26.8,10 L26.8,40 L21.2,40 Z', stock = 'M12,10.5 L36,10.5 Q37.5,12.5 36,14.5 L12,14.5 Q10.5,12.5 12,10.5 Z';
    const arms = 'M7,27 C7.5,39.5 16,44.5 24,44.5 C32,44.5 40.5,39.5 41,27';
    const fl = 'M2,32.5 L6.5,21.5 L12.5,31 Z M46,32.5 L41.5,21.5 L35.5,31 Z';
    return `<defs>${lin(I('g'), pal, 0.6, 1)}${glowCol ? glow(I('gl'), glowCol) : ''}</defs>
    ${glowCol ? `<circle cx="24" cy="28" r="23" fill="url(#${I('gl')})"/>` : ''}
    <circle cx="24" cy="5.6" r="4.2" fill="none" stroke="${OUT}" stroke-width="6"/><circle cx="24" cy="5.6" r="4.2" fill="none" stroke="url(#${I('g')})" stroke-width="2.8"/>
    <path d="${arms}" fill="none" stroke="${OUT}" stroke-width="8.4" stroke-linecap="round"/>
    <path d="${shank} ${stock} ${fl}" fill="${OUT}" stroke="${OUT}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="${arms}" fill="none" stroke="url(#${I('g')})" stroke-width="5" stroke-linecap="round"/>
    <path d="${shank} ${stock} ${fl}" fill="url(#${I('g')})"/>
    <path d="M23,12 L23,38 M8.4,28 C9,36 14.5,41.6 21,42.6" stroke="#fff" stroke-width="1.3" fill="none" opacity="0.6" stroke-linecap="round"/>
    ${rune ? `<path d="M24,18 L24,34 M20,22 L28,22 M20.5,30 L27.5,30" stroke="${rune}" stroke-width="1.6" stroke-linecap="round" opacity="0.95"/>` : ''}
    <circle cx="24" cy="44.5" r="3" fill="url(#${I('g')})" ${ol(1.5)}/>`;
  };
}
S.anchorW = { w: 48, h: 50, ax: 24, ay: 6, draw: anchorSpr([[0, '#dfe5f2'], [0.45, '#8a90ac'], [1, '#43455e']]) };
S.anchorG = { w: 48, h: 50, ax: 24, ay: 6, draw: anchorSpr([[0, '#e8fbff'], [0.45, '#7fc4e6'], [1, '#2e4f7e']], '#8ff7ff', '#fff27a') };
S.anchorA = { w: 48, h: 50, ax: 24, ay: 6, draw: anchorSpr([[0, '#6d7a98'], [0.45, '#2c3352'], [1, '#121426']], '#5ff2d0', '#7dffe0') };

function jelly(fr, pal, tentCol) {
  return (I) => {
    const k = fr ? 1 : 0;   // frame 1: bell squeezed, tentacles trailing
    const bw = k ? 12.5 : 14, bh = k ? 17 : 15.5;
    const bell = `M${18 - bw},18 C${18 - bw - 1},${18 - bh * 0.75} ${18 - bw * 0.55},${18 - bh} 18,${18 - bh} C${18 + bw * 0.55},${18 - bh} ${18 + bw + 1},${18 - bh * 0.75} ${18 + bw},18 C${18 + bw * 0.8},16 ${18 + bw * 0.55},19.5 ${18 + bw * 0.33},17.5 C20,20 16,20 ${18 - bw * 0.33},17.5 C${18 - bw * 0.55},19.5 ${18 - bw * 0.8},16 ${18 - bw},18 Z`;
    const sw = k ? -2 : 2;
    const tent = [9, 14.5, 21, 26.5].map((tx, i) => `M${tx},18.5 C${tx - 3 + sw},24 ${tx + 3 - sw},28 ${tx - 1},${33 + (i % 2) * 3} C${tx - 3 + sw},36 ${tx + 1},39 ${tx + sw * 0.5},${41 + (i % 2) * 2}`).join(' ');
    return `<defs>${lin(I('b'), pal, 0.3, 1)}${glow(I('gl'), pal[1][1])}</defs><g transform="translate(0 3)">
    <circle cx="18" cy="14" r="17" fill="url(#${I('gl')})" opacity="0.7"/>
    <path d="${tent}" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
    <path d="${tent}" fill="none" stroke="${tentCol}" stroke-width="1.9" stroke-linecap="round"/>
    <path d="${bell}" fill="url(#${I('b')})" ${ol(2.2)}/>
    <path d="M${18 - bw + 4},${18 - bh * 0.4} C${18 - bw + 5},${18 - bh * 0.8} ${18 - 3},${18 - bh + 1.5} 17,${18 - bh + 1.2}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/>
    <circle cx="13" cy="12" r="1.5" fill="${OUT}"/><circle cx="23" cy="12" r="1.5" fill="${OUT}"/>
    <path d="M15.6,15 Q18,17 20.4,15" stroke="${OUT}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <circle cx="10" cy="14.6" r="1.5" fill="#ff6fb8" opacity="0.55"/><circle cx="26" cy="14.6" r="1.5" fill="#ff6fb8" opacity="0.55"/></g>`;
  };
}
const JPAL = [[0, '#ffe2ff'], [0.45, '#ff8ee6'], [1, '#a03cc8']], JPAL_T = [[0, '#eef6ff'], [0.45, '#9fb8ff'], [1, '#4b3cc8']];
S.jelly0 = { w: 36, h: 49, ax: 18, ay: 17, draw: jelly(0, JPAL, '#f3b6ff') };
S.jelly1 = { w: 36, h: 49, ax: 18, ay: 17, draw: jelly(1, JPAL, '#f3b6ff') };
S.jellyT0 = { w: 36, h: 49, ax: 18, ay: 17, draw: jelly(0, JPAL_T, '#cfe4ff') };
S.jellyT1 = { w: 36, h: 49, ax: 18, ay: 17, draw: jelly(1, JPAL_T, '#cfe4ff') };

module.exports = { S };
