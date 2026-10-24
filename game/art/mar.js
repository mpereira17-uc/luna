// Art made for Luna: Mar abierto (the "mar" atlas): the Holandés Errante, the pink octopus, the meteorite,
// and the icons the original Luna didn't have. Same cartoon style as the original sprites: dark outline,
// light from the top-left, design units (1 unit = 1 world unit at scale 1), anchored at the waterline.
const { OUT, ol, limb, lin, rad, glow, skull } = require('./lib');

const S = {};
const f1 = v => +v.toFixed(1);

// ---------------------------------------------------------------- the Holandés Errante
// a torn sail: straight at the mast side, billowing towards the bow (it sails right), ragged at the foot, with holes
function sail(x0, x1, y0, y1, bil, seed) {
  const h = y1 - y0, n = 7;
  let d = `M${x0},${y0} L${x1},${y0} C${x1 + bil},${f1(y0 + h * 0.35)} ${x1 + bil},${f1(y0 + h * 0.75)} ${x1 + 2},${y1}`;
  for (let i = 1; i <= n; i++) { const x = x1 + 2 - (x1 + 2 - x0) * i / n, y = y1 + ((i + seed) % 2 ? 5 : -2) * (i === n ? 0.4 : 1); d += ` L${f1(x)},${f1(y)}`; }
  return d + ` C${f1(x0 + bil * 0.35)},${f1(y0 + h * 0.7)} ${f1(x0 + bil * 0.35)},${f1(y0 + h * 0.3)} ${x0},${y0} Z`;
}
const hole = (cx, cy, rx, ry) => ` M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0 Z`;
function holandes(f) {
  return (I) => {
    const b = f ? 4 : 0, lamp = f ? 1 : 0.8;
    const hull = 'M10,66 L56,66 L58,96 L190,96 C200,96 208,92 214,84 C212,110 202,134 182,148 C170,156 152,158 132,158 L50,158 C30,156 15,144 12,122 Z';
    const sails = [
      // mizzen, main and fore masts, upper and lower sails
      [sail(66, 100, 28, 50, 6 + b, 0) + hole(80, 40, 3, 2.4)],
      [sail(62, 106, 56, 90, 8 + b, 1) + hole(74, 70, 4, 3) + hole(94, 80, 2.4, 2)],
      [sail(106, 150, 12, 42, 7 + b, 1) + hole(136, 26, 3.4, 2.6)],
      [sail(100, 156, 48, 90, 10 + b, 0) + hole(116, 62, 5, 3.6) + hole(140, 76, 3, 2.4) + hole(124, 82, 2, 1.6)],
      [sail(154, 184, 32, 52, 6 + b, 0)],
      [sail(150, 190, 58, 92, 8 + b, 1) + hole(172, 70, 3.6, 3)],
    ];
    const jib = `M172,30 L${228 + b * 0.5},72 L200,90 Z` + hole(198, 66, 3, 2.4);
    const rig = 'stroke="#9dffd8" stroke-width="0.8" fill="none" opacity="0.55"';
    const flag = f ? 'M130,3 Q140,-1 150,4 L146,7 L151,10 Q140,12 130,10 Z' : 'M130,3 Q141,1 151,6 L145,8 L150,12 Q139,11 130,10 Z';
    return `<defs>
      ${lin(I('h'), [[0, '#4f9187'], [0.45, '#27544f'], [1, '#0c2321']])}
      ${lin(I('s'), [[0, '#e4fff6', 0.92], [0.6, '#a6ead6', 0.82], [1, '#6cc4ab', 0.72]], 1, 0.3)}
      ${lin(I('w'), [[0, '#7a5a3a'], [1, '#3b2a1c']])}
      ${rad(I('m'), [[0, '#c8ffe8', 0.55], [0.6, '#7dffcf', 0.18], [1, '#7dffcf', 0]])}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      ${glow(I('g'), '#7dffcf')}
      ${glow(I('l'), '#b6ffe4')}
    </defs>
    <ellipse cx="118" cy="92" rx="122" ry="86" fill="url(#${I('g')})" opacity="0.32"/>
    <circle cx="6" cy="50" r="${f1(18 * lamp)}" fill="url(#${I('l')})"/>
    <path d="M128,2 L10,66 M128,2 L234,70 M84,20 L10,66 M170,24 L234,70 M84,20 L128,2 L170,24" ${rig}/>
    <path d="M206,90 L236,68" ${ol(4.4)}/><path d="M206,90 L236,68" stroke="#3f6f68" stroke-width="2.4" stroke-linecap="round"/>
    <path d="${jib}" fill="url(#${I('s')})" fill-rule="evenodd" ${ol(1.8)}/>
    <rect x="82" y="18" width="4" height="80" rx="1.3" fill="#3c6f68" ${ol(1.6)}/>
    <rect x="126" y="0" width="4.4" height="98" rx="1.4" fill="#3c6f68" ${ol(1.6)}/>
    <rect x="168" y="22" width="4" height="76" rx="1.3" fill="#3c6f68" ${ol(1.6)}/>
    <path d="${flag}" fill="#14201f" ${ol(1.4)}/>${skull(139, 6.6, 0.42, '#a8ffe0', '#14201f')}
    ${sails.map(([d]) => `<path d="${d}" fill="url(#${I('s')})" fill-rule="evenodd" ${ol(1.9)}/>`).join('')}
    ${skull(128, 70, 1.5, '#173533', '#a8ffe0')}
    ${[[63, 103, 27], [59, 109, 55], [103, 153, 11], [97, 159, 47], [151, 187, 31], [147, 193, 57]].map(([a, z, y]) => `<rect x="${a}" y="${y - 1.6}" width="${z - a}" height="3.4" rx="1.2" fill="#3c6f68" ${ol(1.2)}/>`).join('')}
    <rect x="118" y="6" width="20" height="5" rx="1.5" fill="#2f5a55" ${ol(1.3)}/>
    <path d="M6,66 L6,56" ${ol(1.6)}/><rect x="1.5" y="45" width="9" height="11" rx="2" fill="#c8ffe8" opacity="${lamp}" ${ol(1.3)}/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <rect x="0" y="95" width="240" height="3.4" fill="#9dffd8" opacity="0.55"/>
      <rect x="0" y="120" width="240" height="3" fill="#9dffd8" opacity="0.4"/>
      <path d="M0,104 C70,106 140,106 240,98 M0,130 C70,133 150,132 240,122 M0,140 C70,143 150,142 240,132" stroke="#0c2321" stroke-width="1.3" fill="none"/>
      <path d="M58,124 L66,132 L60,138 L70,144 M150,124 L144,132 L152,138 M100,128 L106,136" stroke="#081a19" stroke-width="1.8" fill="none"/>
      <path d="M78,130 L92,128 L96,138 L86,144 L76,140 Z" fill="#061413"/>
      ${[[40, 150], [66, 152], [96, 154], [128, 152], [160, 148], [178, 142], [24, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#9ab8ad" opacity="0.7" ${ol(0.8)}/>`).join('')}
      <rect x="0" y="146" width="240" height="14" fill="#061413" opacity="0.75"/>
    </g>
    ${[18, 30, 42].map(x => `<path d="M${x - 4},86 L${x - 4},78 Q${x},72 ${x + 4},78 L${x + 4},86 Z" fill="#b6ffe4" opacity="${0.75 + 0.2 * lamp}" ${ol(1.2)}/>`).join('')}
    <path d="M60,90 L188,90" stroke="#3c6f68" stroke-width="2" ${ol(0.01)}/>
    ${[64, 80, 96, 112, 144, 160, 176].map(x => `<path d="M${x},90 L${x},96" stroke="${OUT}" stroke-width="1.8"/>`).join('')}
    <path d="M58,89.5 L190,89.5" ${ol(1.6)}/>
    ${[72, 94, 116, 138, 160, 180].map(x => `<rect x="${x - 4.5}" y="106" width="9" height="8" rx="1.3" fill="#7dffcf" opacity="${0.8 + 0.15 * lamp}" ${ol(1.3)}/>`).join('')}
    <path d="${hull}" fill="none" ${ol(2.6)}/>
    ${skull(211, 93, 1.25, '#e8fff6', '#173533')}
    <path d="M196,112 ${[0, 1, 2, 3, 4].map(k => `L${200 + (k % 2) * 3},${118 + k * 7}`).join(' ')}" stroke="#6e8c86" stroke-width="2.2" stroke-dasharray="3 2" fill="none"/>
    <path d="M40,156 C36,${164 + b} 42,166 37,${172 + b * 0.5} M84,158 C82,166 88,168 84,${174 - b * 0.5} M128,158 C130,164 125,170 129,${176 + b * 0.5} M170,152 C174,160 168,164 172,${170 - b * 0.5}" stroke="#4fcf9a" stroke-width="2.2" fill="none" opacity="0.75" stroke-linecap="round"/>
    <ellipse cx="112" cy="148" rx="112" ry="9" fill="url(#${I('m')})"/>
    <ellipse cx="${f ? 60 : 56}" cy="150" rx="40" ry="6" fill="#d8fff2" opacity="0.18"/><ellipse cx="${f ? 170 : 176}" cy="148" rx="46" ry="6" fill="#d8fff2" opacity="0.16"/>`;
  };
}
S.holandes0 = { w: 240, h: 180, ax: 112, ay: 146, draw: holandes(0) };
S.holandes1 = { w: 240, h: 180, ax: 112, ay: 146, draw: holandes(1) };

// ---------------------------------------------------------------- the pink octopus (seen from above the water)
function octo(f) {
  return (I) => {
    const sw = f ? 1 : -1;
    // six arms curling out from under the head
    const arms = [
      [`M22,36 C12,${40 + sw * 2} 6,46 9,${52 - sw * 2} C11,56 16,55 15,51`],
      [`M26,39 C20,${46 + sw} 18,52 21,${56 + sw} C23,59 27,57 26,54`],
      [`M30,40 C29,${48 - sw} 28,53 30,57 C31,59 34,58 33,55`],
      [`M34,40 C35,${48 + sw} 36,53 34,57 C33,59 30,58 31,55`],
      [`M38,39 C44,${46 - sw} 46,52 43,${56 - sw} C41,59 37,57 38,54`],
      [`M42,36 C52,${40 - sw * 2} 58,46 55,${52 + sw * 2} C53,56 48,55 49,51`],
    ];
    return `<defs>
      ${rad(I('b'), [[0, '#ffd2e6'], [0.45, '#ff7fb5'], [1, '#c23a78']], 0.38, 0.3, 0.75)}
      ${lin(I('a'), [[0, '#ff8fbf'], [1, '#b8306c']])}
    </defs>
    <ellipse cx="32" cy="50" rx="24" ry="6" fill="#0a1a2c" opacity="0.25"/>
    ${arms.map(([d]) => limb(d, `url(#${I('a')})`, 5.2)).join('')}
    ${arms.map(([d], i) => `<circle cx="${[13, 22, 31, 33, 42, 51][i]}" cy="${[50, 53, 54, 54, 53, 50][i]}" r="1" fill="#ffe0ee"/>`).join('')}
    <path d="M14,28 C14,12 22,5 32,5 C42,5 50,12 50,28 C50,36 43,41 32,41 C21,41 14,36 14,28 Z" fill="url(#${I('b')})" ${ol(2.2)}/>
    <circle cx="23" cy="15" r="2.4" fill="#c23a78" opacity="0.55"/><circle cx="40" cy="12" r="1.8" fill="#c23a78" opacity="0.55"/><circle cx="44" cy="22" r="1.4" fill="#c23a78" opacity="0.5"/>
    <ellipse cx="25" cy="28" rx="5.6" ry="6.2" fill="#fff" ${ol(1.6)}/><ellipse cx="39" cy="28" rx="5.6" ry="6.2" fill="#fff" ${ol(1.6)}/>
    <circle cx="${f ? 26.5 : 26}" cy="29.5" r="3" fill="${OUT}"/><circle cx="${f ? 40.5 : 40}" cy="29.5" r="3" fill="${OUT}"/>
    <circle cx="${f ? 25.6 : 25.1}" cy="28.3" r="1" fill="#fff"/><circle cx="${f ? 39.6 : 39.1}" cy="28.3" r="1" fill="#fff"/>
    <path d="M19,20.5 L29,23 M45,20.5 L35,23" ${ol(2)}/>
    <path d="M29,36 Q32,${f ? 38.5 : 37.5} 35,36" fill="none" ${ol(1.6)}/>
    <path d="M20,12 C23,8 28,7 31,7" stroke="#fff" stroke-width="2" fill="none" opacity="0.55" stroke-linecap="round"/>`;
  };
}
S.octo0 = { w: 64, h: 60, ax: 32, ay: 46, draw: octo(0) };
S.octo1 = { w: 64, h: 60, ax: 32, ay: 46, draw: octo(1) };

// ---------------------------------------------------------------- the meteorite: a rock with burning cracks
S.meteor = { w: 40, h: 40, ax: 20, ay: 20, draw: (I) => `<defs>
    ${rad(I('r'), [[0, '#b8a690'], [0.55, '#6e6052'], [1, '#2e2620']], 0.35, 0.3, 0.8)}
    ${glow(I('g'), '#ffb44a')}
  </defs>
  <circle cx="20" cy="20" r="20" fill="url(#${I('g')})" opacity="0.8"/>
  <path d="M9,14 L16,7 L27,8 L33,15 L32,26 L25,33 L13,32 L7,24 Z" fill="url(#${I('r')})" ${ol(2)}/>
  <path d="M13,16 L19,19 L17,26 M19,19 L26,15 M22,23 L28,25" stroke="#ff9a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M13,16 L19,19 L17,26 M19,19 L26,15 M22,23 L28,25" stroke="#fff2a8" stroke-width="0.9" fill="none" stroke-linecap="round"/>
  <circle cx="14" cy="12" r="1.6" fill="#d8ccb8" opacity="0.7"/>` };

// ---------------------------------------------------------------- icons (64x64, anchored at the centre)
const icon = draw => ({ w: 64, h: 64, ax: 32, ay: 32, draw });
// Ondas lunares: rings of light going out from a small moon
S.i_ondas = icon(I => `<defs>
    ${glow(I('g'), '#8ee8ff')}
    ${rad(I('m'), [[0, '#fffdf0'], [0.6, '#fff0b0'], [1, '#e2bf5c']], 0.35, 0.3, 0.8)}
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#${I('g')})" opacity="0.7"/>
  <circle cx="32" cy="32" r="27" fill="none" stroke="${OUT}" stroke-width="6.4"/><circle cx="32" cy="32" r="27" fill="none" stroke="#5cc8ff" stroke-width="3.4"/>
  <circle cx="32" cy="32" r="19" fill="none" stroke="${OUT}" stroke-width="6.4"/><circle cx="32" cy="32" r="19" fill="none" stroke="#9ee8ff" stroke-width="3.4"/>
  <path d="M14,20 A22,22 0 0 1 24,10" stroke="#fff" stroke-width="2" fill="none" opacity="0.8" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="11" fill="url(#${I('m')})" ${ol(2.2)}/>
  <circle cx="29" cy="30" r="2" fill="#e2c46a" opacity="0.7"/><circle cx="35.5" cy="35" r="1.4" fill="#e2c46a" opacity="0.7"/>`);
// Meteoritos: a burning rock coming down at a slant
S.i_meteoro = icon(I => `<defs>
    ${lin(I('f'), [[0, '#fff6b8', 0], [0.5, '#ffb43a', 0.85], [1, '#ff5a2a']], 1, 1)}
    ${rad(I('r'), [[0, '#c4b29a'], [0.55, '#76665a'], [1, '#332a22']], 0.35, 0.3, 0.8)}
    ${glow(I('g'), '#ffb44a')}
  </defs>
  <path d="M4,6 L30,26 L38,34 L28,40 L22,32 Z" fill="url(#${I('f')})"/>
  <path d="M10,4 L36,24 M2,14 L26,32" stroke="#ffe08a" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>
  <circle cx="40" cy="40" r="22" fill="url(#${I('g')})" opacity="0.75"/>
  <path d="M28,36 L35,27 L47,28 L54,36 L52,48 L44,55 L32,53 L26,45 Z" fill="url(#${I('r')})" ${ol(2.4)}/>
  <path d="M33,38 L40,41 L38,49 M40,41 L48,36 M43,45 L50,47" stroke="#ff9a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M33,38 L40,41 L38,49 M40,41 L48,36 M43,45 L50,47" stroke="#fff2a8" stroke-width="1" fill="none" stroke-linecap="round"/>`);

module.exports = { S };
