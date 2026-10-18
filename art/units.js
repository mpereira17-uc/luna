// Enemy units: ships (anchored at the waterline), walkers (anchored at the feet), fliers and the serpent.
const { OUT, ol, limb, lin, rad, glow, skull } = require('./lib');

const S = {};

// ---------------------------------------------------------------- ships
function sloop(f) {
  return (I) => {
    const sail = f ? 'M43,11 C62,18 68,28 63,41 L43,41 Z' : 'M43,11 C58,16 64,27 62,41 L43,41 Z';
    const flag = f ? 'M42,6 Q48,3 55,7 Q49,10 42,11 Z' : 'M42,6 L55,8 L42,11 Z';
    const hull = 'M10,46 L68,46 C74,46 76,48 74,51 C69,62 59,67 47,67 L22,67 C13,67 9,60 10,46 Z';
    return `<defs>
      ${lin(I('h'), [[0, '#b8743f'], [0.5, '#8f552d'], [1, '#5a321d']])}
      ${lin(I('s'), [[0, '#fff6e0'], [1, '#e0cba0']], 1, 0)}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      <clipPath id="${I('sc')}"><path d="${sail}"/></clipPath>
      ${glow(I('g'), '#ffc76a')}
    </defs>
    <circle cx="14" cy="27" r="11" fill="url(#${I('g')})"/>
    <path d="M70,48 L80,42" ${ol(2.4)}/><path d="M70,48 L80,42" stroke="#7a4a2a" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M41,6 L79,43 M41,6 L12,38" stroke="#2a1f3a" stroke-width="0.8" fill="none"/>
    <path d="${flag}" fill="#22192e" ${ol(1.6)}/><circle cx="47" cy="8.4" r="1.4" fill="#f3ead2"/>
    <path d="${sail}" fill="url(#${I('s')})"/>
    <g clip-path="url(#${I('sc')})"><rect x="40" y="17" width="40" height="5" fill="#d8434e"/><rect x="40" y="28" width="40" height="5" fill="#d8434e"/>
      <path d="M56,10 C66,20 66,32 60,44 L70,44 L70,10 Z" fill="#000" opacity="0.14"/></g>
    <path d="${sail}" fill="none" ${ol(2)}/>
    <rect x="39.5" y="5" width="3.4" height="42" rx="1.2" fill="#6e4126" ${ol(1.6)}/>
    <path d="M10,46 L10,38 L25,38 L25,46" fill="#7b4a2b" ${ol(2)}/>
    <rect x="14" y="40" width="7" height="4.5" rx="1" fill="#ffd27a" ${ol(1.2)}/>
    <path d="M13,38 L13,31" ${ol(1.6)}/><rect x="10.5" y="25.5" width="5.5" height="6.5" rx="1.5" fill="#ffd36e" ${ol(1.3)}/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <path d="M8,53 C30,55 52,55 76,52" stroke="#5a321c" stroke-width="1.1" fill="none"/>
      <path d="M8,59 C30,61 52,61 72,58" stroke="#5a321c" stroke-width="1.1" fill="none"/>
      <rect x="0" y="62" width="90" height="10" fill="#2b2236"/>
      <rect x="0" y="46" width="90" height="3" fill="#e0a565" opacity="0.85"/>
    </g>
    <circle cx="31" cy="54.5" r="2.4" fill="#ffd88a" ${ol(1.2)}/><circle cx="46" cy="54.5" r="2.4" fill="#ffd88a" ${ol(1.2)}/>
    <path d="${hull}" fill="none" ${ol(2.2)}/>`;
  };
}
S.sloop0 = { w: 82, h: 72, ax: 41, ay: 60, draw: sloop(0) };
S.sloop1 = { w: 82, h: 72, ax: 41, ay: 60, draw: sloop(1) };

function galleon(f) {
  return (I) => {
    const b = f ? 3 : 0;
    const main = `M42,21 L72,21 C${77 + b},31 ${77 + b},38 74,47 L40,47 C${37 - b * 0.3},38 ${37 - b * 0.3},31 42,21 Z`;
    const fore = `M78,27 L100,27 C${104 + b},35 ${104 + b},40 102,47 L77,47 C75,40 75,35 78,27 Z`;
    const top = `M48,6 L66,6 C${69 + b * 0.5},10 ${70 + b * 0.5},14 69,17 L45,17 C44,14 45,10 48,6 Z`;
    const hull = 'M8,34 L34,34 L36,52 L102,52 C110,52 117,50 122,45 C119,58 110,76 94,86 C86,91 74,92 60,92 L28,92 C16,90 9,80 8,64 Z';
    const rig = 'stroke="#2a1f3a" stroke-width="0.9" fill="none"';
    return `<defs>
      ${lin(I('h'), [[0, '#a3653a'], [0.45, '#7a4622'], [1, '#452710']])}
      ${lin(I('s'), [[0, '#453b62'], [1, '#241d38']], 1, 0)}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      ${glow(I('g'), '#ffc76a')}
    </defs>
    <circle cx="13" cy="22" r="13" fill="url(#${I('g')})"/>
    <path d="M57,1 L10,34 M57,1 L120,46 M89,12 L126,35" ${rig}/>
    <path d="M110,49 L127,35" ${ol(3)}/><path d="M110,49 L127,35" stroke="#7a4a2a" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="55.5" y="0" width="3.6" height="54" rx="1.2" fill="#6a3d22" ${ol(1.6)}/>
    <rect x="87.5" y="12" width="3.4" height="42" rx="1.2" fill="#6a3d22" ${ol(1.6)}/>
    <path d="M59,1 L76,${f ? 5 : 3} L59,7 Z" fill="#d8434e" ${ol(1.5)}/>
    <path d="${top}" fill="url(#${I('s')})" ${ol(2)}/>
    <path d="${main}" fill="url(#${I('s')})" ${ol(2.2)}/>
    <path d="${fore}" fill="url(#${I('s')})" ${ol(2.2)}/>
    <path d="M${50 + b},24 C${46 + b},32 ${46 + b},38 ${48 + b},45" stroke="#fff" stroke-width="1.4" opacity="0.12" fill="none"/>
    ${skull(57, 34, 1.1)}
    <path d="M80,38 L101,38" stroke="#d8434e" stroke-width="3" opacity="0.9"/>
    <rect x="39" y="18.6" width="36" height="3.4" rx="1.2" fill="#7b4a2b" ${ol(1.3)}/>
    <rect x="43" y="4" width="28" height="3" rx="1.2" fill="#7b4a2b" ${ol(1.2)}/>
    <rect x="75" y="25" width="28" height="3" rx="1.2" fill="#7b4a2b" ${ol(1.2)}/>
    <path d="M15,34 L15,25" ${ol(1.6)}/><rect x="12" y="18.5" width="6" height="7" rx="1.6" fill="#ffd36e" ${ol(1.3)}/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <rect x="0" y="33" width="130" height="4" fill="#e8b04c"/>
      <rect x="0" y="51" width="130" height="3.5" fill="#e8b04c"/>
      <path d="M0,70 C40,72 80,72 130,64" stroke="#4a2a15" stroke-width="1.3" fill="none"/>
      <path d="M0,78 C40,80 80,79 130,72" stroke="#4a2a15" stroke-width="1.3" fill="none"/>
      <rect x="0" y="84" width="130" height="14" fill="#271d31"/>
    </g>
    ${[13, 21, 29].map(x => `<rect x="${x - 3}" y="40" width="6" height="7" rx="1.5" fill="#ffd27a" ${ol(1.2)}/>`).join('')}
    ${[48, 62, 76, 90].map(x => `<rect x="${x - 4}" y="58" width="8" height="7" rx="1.2" fill="#1d1426" ${ol(1.3)}/><circle cx="${x}" cy="61.5" r="2" fill="#4a4458"/>`).join('')}
    <path d="M118,47 C122,46 124,48 123,51 C121,52 118,51 117,49 Z" fill="#e8b04c" ${ol(1.3)}/>
    <path d="${hull}" fill="none" ${ol(2.4)}/>`;
  };
}
S.galleon0 = { w: 130, h: 98, ax: 64, ay: 84, draw: galleon(0) };
S.galleon1 = { w: 130, h: 98, ax: 64, ay: 84, draw: galleon(1) };

function mortarShip(f) {
  return (I) => {
    const hull = 'M8,44 L84,44 C90,44 92,47 90,50 C85,60 75,66 62,66 L24,66 C14,66 8,58 8,44 Z';
    const sail = f ? 'M23,10 L23,38 L5,38 C8,28 13,18 23,10 Z' : 'M23,10 L23,38 L7,38 C9,28 14,18 23,10 Z';
    return `<defs>
      ${lin(I('h'), [[0, '#7d6a5a'], [0.5, '#5b4a3e'], [1, '#33281f']])}
      ${lin(I('m'), [[0, '#4d4a5c'], [1, '#1f1d29']], 1, 0)}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      ${glow(I('g'), '#ff9a4a')}
    </defs>
    <path d="M23,7 L9,44 M23,7 L44,40" stroke="#2a1f3a" stroke-width="0.8" fill="none"/>
    <path d="${sail}" fill="#ef8a3a" ${ol(2)}/>
    <path d="M23,16 L10,34" stroke="#c96a26" stroke-width="2" opacity="0.7"/>
    <rect x="22" y="6" width="3.2" height="40" rx="1.2" fill="#6a3d22" ${ol(1.6)}/>
    <circle cx="66" cy="16" r="10" fill="url(#${I('g')})"/>
    <g transform="translate(58 40) rotate(-48)">
      <rect x="-2" y="-9" width="30" height="18" rx="4" fill="url(#${I('m')})" ${ol(2.2)}/>
      <rect x="6" y="-10" width="3.5" height="20" rx="1" fill="#6d6880" ${ol(1.2)}/>
      <rect x="17" y="-10" width="3.5" height="20" rx="1" fill="#6d6880" ${ol(1.2)}/>
      <ellipse cx="28" cy="0" rx="3.5" ry="8.5" fill="#ffb35a" ${ol(1.6)}/>
    </g>
    <path d="M44,44 L48,32 L70,32 L74,44 Z" fill="#6b4a33" ${ol(2)}/>
    <circle cx="36" cy="40" r="4" fill="#25222f" ${ol(1.4)}/><circle cx="31" cy="41" r="3.6" fill="#25222f" ${ol(1.4)}/><circle cx="33.5" cy="35.5" r="3.6" fill="#25222f" ${ol(1.4)}/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <rect x="0" y="44" width="100" height="3" fill="#ef8a3a"/>
      ${[22, 40, 58, 76].map(x => `<rect x="${x}" y="44" width="3" height="30" fill="#2c2420" opacity="0.6"/>`).join('')}
      <rect x="0" y="61" width="100" height="10" fill="#271d26"/>
    </g>
    <path d="${hull}" fill="none" ${ol(2.2)}/>`;
  };
}
S.mortar0 = { w: 96, h: 72, ax: 48, ay: 58, draw: mortarShip(0) };
S.mortar1 = { w: 96, h: 72, ax: 48, ay: 58, draw: mortarShip(1) };

// ---------------------------------------------------------------- pirate (4 walk frames)
function pirate(f) {
  // leg/arm phase for a 4-frame walk cycle
  const P = [[-8, 8, 0], [-1, 2, -1.2], [8, -8, 0], [2, -1, -1.2]][f];
  const [lb, lf, bob] = P;
  return () => `
    <g transform="translate(0 ${bob})">
    ${limb(`M14,30 L${13 + lb * 0.6},${38 - Math.abs(lb) * 0.15}`, '#2a2740', 4.2)}
    <ellipse cx="${13 + lb * 0.6 - 0.5}" cy="${39 - Math.abs(lb) * 0.15}" rx="3.2" ry="1.8" fill="#151020" ${ol(1)}/>
    ${limb(`M12,22 L${9 - lf * 0.4},${28}`, '#e8b48a', 3.2)}
    <path d="M10,20 C10,17 22,17 22,20 L22,29 C22,31 10,31 10,29 Z" fill="#f2efe6" ${ol(1.8)}/>
    <path d="M10.5,22.5 L21.5,22.5 M10.5,25.5 L21.5,25.5" stroke="#3b4f8f" stroke-width="1.6"/>
    <rect x="9.8" y="27.5" width="12.4" height="2.6" rx="1" fill="#6b3f22" ${ol(1)}/><rect x="15" y="27.6" width="2.4" height="2.4" fill="#e8b04c"/>
    ${limb(`M18,30 L${19 + lf * 0.6},${38 - Math.abs(lf) * 0.15}`, '#3a3656', 4.2)}
    <ellipse cx="${19.5 + lf * 0.6}" cy="${39 - Math.abs(lf) * 0.15}" rx="3.2" ry="1.8" fill="#151020" ${ol(1)}/>
    <path d="M25,23 C27,17 29,13 31,8 C30,13 29,18 27,24 Z" fill="#dfe6f2" ${ol(1.2)}/>
    ${limb(`M20,22 L25,24.5`, '#e8b48a', 3.2)}
    <rect x="23.2" y="22.6" width="4.6" height="2.4" rx="1" fill="#e8b04c" ${ol(0.9)}/>
    <circle cx="16" cy="12" r="8.6" fill="#f2c08f" ${ol(1.8)}/>
    <ellipse cx="21.5" cy="15.5" rx="3.2" ry="2.4" fill="#f59a8a" opacity="0.85"/>
    <path d="M7.6,11.5 C7.6,3.8 24.4,3.8 24.4,11 C20,9.6 12,9.6 7.6,11.5 Z" fill="#d8434e" ${ol(1.6)}/>
    <circle cx="12" cy="7.6" r="0.9" fill="#fff"/><circle cx="17" cy="6.4" r="0.9" fill="#fff"/><circle cx="21" cy="8" r="0.9" fill="#fff"/>
    <path d="M8,10 L3.5,8.5 L4.8,12.4 Z" fill="#d8434e" ${ol(1.2)}/>
    <circle cx="15.4" cy="12.6" r="1.7" fill="#fff" ${ol(0.8)}/><circle cx="15.9" cy="12.8" r="0.9" fill="${OUT}"/>
    <path d="M9,10.5 L24.5,14.5" stroke="${OUT}" stroke-width="0.9"/>
    <ellipse cx="20.8" cy="13" rx="2.4" ry="2.1" fill="${OUT}"/>
    <path d="M17.5,17.6 C18.8,18.4 20.4,18.4 21.6,17.4" stroke="${OUT}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    </g>`;
}
for (let i = 0; i < 4; i++) S['pirate' + i] = { w: 34, h: 42, ax: 16, ay: 40, draw: pirate(i) };

// ---------------------------------------------------------------- crab (2 frames)
function crab(f) {
  const a = f ? 3 : -3;
  return (I) => `<defs>${lin(I('b'), [[0, '#f27a4f'], [0.6, '#d9472f'], [1, '#9e2c22']])}</defs>
    ${[-1, 1].map(sd => [0, 1, 2].map(k => {
      const x0 = 26 + sd * (6 + k * 4), x1 = 26 + sd * (13 + k * 5) + (k % 2 ? a : -a) * sd * 0.5;
      return limb(`M${x0},24 Q${(x0 + x1) / 2 + sd * 3},${17 + k} ${x1},${31}`, '#c43d2b', 2.6, 1.3);
    }).join('')).join('')}
    ${limb('M14,20 L7,15', '#d9472f', 3.6)}
    <path d="M4,9 C2,13 4,17 8,17 L10,14 Z" fill="#e85a3a" ${ol(1.5)}/>
    ${limb('M37,19 L44,13', '#d9472f', 4.2)}
    <path d="M42,5 C${f ? 51 : 52},2 56,8 53,12 L46,13 C44,11 43,8 42,5 Z" fill="#ef6a45" ${ol(1.7)}/>
    <path d="M45,15 C${f ? 52 : 51},${f ? 19 : 17} 55,14 53,12 L46,13 Z" fill="#d9472f" ${ol(1.6)}/>
    ${limb('M22,15 L20,7', '#d9472f', 2.2, 1.2)}${limb('M30,15 L32,7', '#d9472f', 2.2, 1.2)}
    <ellipse cx="26" cy="21" rx="15.5" ry="9.5" fill="url(#${I('b')})" ${ol(2)}/>
    <ellipse cx="21" cy="16.5" rx="7" ry="3" fill="#fff" opacity="0.28"/>
    <circle cx="20" cy="23" r="1.4" fill="#9e2c22"/><circle cx="31" cy="24" r="1.7" fill="#9e2c22"/><circle cx="26" cy="26" r="1.2" fill="#9e2c22"/>
    <path d="M18,28 C23,30.5 29,30.5 34,28" stroke="#7d1f18" stroke-width="1.3" fill="none"/>
    <circle cx="20" cy="6" r="3.4" fill="#fff" ${ol(1.3)}/><circle cx="32" cy="6" r="3.4" fill="#fff" ${ol(1.3)}/>
    <circle cx="21" cy="6.6" r="1.6" fill="${OUT}"/><circle cx="33" cy="6.6" r="1.6" fill="${OUT}"/>
    <path d="M16.5,2.5 L23,4.4 M35.5,2.5 L29,4.4" stroke="${OUT}" stroke-width="1.7" stroke-linecap="round"/>`;
}
S.crab0 = { w: 58, h: 34, ax: 27, ay: 32, draw: crab(0) };
S.crab1 = { w: 58, h: 34, ax: 27, ay: 32, draw: crab(1) };

// ---------------------------------------------------------------- pirate gull (3 frames)
function gull(f) {
  const wing = [
    'M22,17 C18,9 14,4 6,1 C8,6 11,10 12,13 C14,15 18,17 22,19 Z',
    'M22,17 C16,14 9,13 1,15 C6,17 10,19 13,20 C16,20 19,20 22,20 Z',
    'M22,18 C17,22 13,27 8,32 C13,30 17,27 19,25 C21,23 22,21 23,20 Z',
  ][f];
  const tip = ['M6,1 C8,6 10,8 11,10 L13,8 C11,5 9,3 6,1 Z', 'M1,15 C4,16 6,17 8,18 L8,15 C6,15 3,15 1,15 Z', 'M8,32 C10,31 12,29 14,28 L12,26 C11,28 10,30 8,32 Z'][f];
  return (I) => `<defs>${lin(I('w'), [[0, '#e6ebf4'], [1, '#a9b3c6']])}</defs>
    ${f === 0 ? `<path d="M24,16 C24,9 26,5 30,2 C30,7 29,11 27,15 Z" fill="#9aa4b8" ${ol(1.3)}/>` : ''}
    <path d="M11,19 L4,16 L5,22 Z" fill="#c9d1e0" ${ol(1.4)}/>
    <ellipse cx="20" cy="20" rx="10" ry="6.4" fill="#ffffff" ${ol(1.7)}/>
    <path d="M12,22 C17,25 24,25 28,22" stroke="#c9d1e0" stroke-width="2" fill="none"/>
    <circle cx="30" cy="15" r="6" fill="#ffffff" ${ol(1.7)}/>
    <path d="M35,14.5 L43,16.5 L35,18.6 Z" fill="#ffc23a" ${ol(1.3)}/><circle cx="40.6" cy="16.6" r="0.9" fill="#d8434e"/>
    <path d="M24.4,13 C25.5,8 34.5,8 35.8,13 C32,11.8 28,11.8 24.4,13 Z" fill="#d8434e" ${ol(1.3)}/>
    <path d="M25,12 L21,10 L22,14 Z" fill="#d8434e" ${ol(1)}/>
    <path d="M26,13.5 L35.5,17" stroke="${OUT}" stroke-width="0.8"/>
    <ellipse cx="32.5" cy="15.2" rx="1.9" ry="1.7" fill="${OUT}"/>
    <path d="M18,26 L17,29 M22,26 L22,29" stroke="#ff9d3d" stroke-width="1.5" stroke-linecap="round"/>
    <path d="${wing}" fill="url(#${I('w')})" ${ol(1.6)}/>
    <path d="${tip}" fill="#2e2a3e"/>`;
}
for (let i = 0; i < 3; i++) S['gull' + i] = { w: 46, h: 34, ax: 22, ay: 19, draw: gull(i) };

// ---------------------------------------------------------------- serpent pieces
function serpentHead(c) {
  return (I) => `<defs>${lin(I('b'), [[0, c[0]], [1, c[1]]])}</defs>
    <path d="M14,6 L17,0 L20,6 L24,1 L26,8 Z" fill="${c[3]}" ${ol(1.4)}/>
    <path d="M4,10 C10,4 22,3 30,7 C36,10 40,13 40,17 C40,19 37,20 34,20 L20,22 C14,24 8,24 4,22 Z" fill="url(#${I('b')})" ${ol(1.8)}/>
    <path d="M10,22 C18,27 28,27 36,22 L34,20 L20,22 Z" fill="${c[2]}" ${ol(1.6)}/>
    <path d="M24,21 L25.5,25 L27,21 M30,21 L31.2,24.5 L32.6,20.6" fill="#fff" ${ol(0.9)}/>
    <ellipse cx="26" cy="11.5" rx="3.6" ry="3.2" fill="#ffe14a" ${ol(1.2)}/><ellipse cx="26.8" cy="11.6" rx="1" ry="2.4" fill="${OUT}"/>
    <path d="M21.5,7.4 L30,9" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="37" cy="15" r="0.9" fill="${OUT}"/>
    <path d="M12,10 C16,8 20,8 22,9" stroke="#fff" stroke-width="1.4" opacity="0.35" fill="none"/>`;
}
function serpentBody(c) {
  return (I) => `<defs>${lin(I('b'), [[0, c[0]], [1, c[1]]])}</defs>
    <path d="M7,5 L11,0 L14,5 L18,1 L20,7 Z" fill="${c[3]}" ${ol(1.3)}/>
    <circle cx="13" cy="14" r="10" fill="url(#${I('b')})" ${ol(1.8)}/>
    <path d="M4.5,18 C9,24 17,24 21.5,18" fill="${c[2]}" stroke="${OUT}" stroke-width="1.4"/>
    <path d="M8,10 C10,8 14,7.5 17,8.5" stroke="#fff" stroke-width="1.4" opacity="0.3" fill="none"/>
    <circle cx="10" cy="14" r="1.6" fill="${c[1]}"/><circle cx="16" cy="13" r="1.3" fill="${c[1]}"/>`;
}
function serpentTail(c) {
  return (I) => `<defs>${lin(I('b'), [[0, c[0]], [1, c[1]]])}</defs>
    <path d="M2,4 C6,8 8,10 10,10 L6,16 C4,14 2,10 2,4 Z" fill="${c[3]}" ${ol(1.3)}/>
    <path d="M28,4 C20,4 12,7 8,10 C12,13 20,16 28,16 Z" fill="url(#${I('b')})" ${ol(1.7)}/>
    <path d="M12,13 C17,15 22,15.6 28,15.6" stroke="${c[2]}" stroke-width="2.4" fill="none"/>`;
}
const SERP = ['#55b884', '#2c7a55', '#f0dc94', '#ff7a5a'];
S.serpHead = { w: 42, h: 28, ax: 8, ay: 15, draw: serpentHead(SERP) };
S.serpBody = { w: 26, h: 26, ax: 13, ay: 14, draw: serpentBody(SERP) };
S.serpTail = { w: 30, h: 20, ax: 26, ay: 10, draw: serpentTail(SERP) };

// ---------------------------------------------------------------- brulote: a charred little ship packed with powder kegs, sail ablaze
function brulote(f) {
  return (I) => {
    const hull = 'M8,48 L72,48 C78,48 80,51 78,54 C73,64 62,69 50,69 L22,69 C13,69 8,62 8,48 Z';
    const sail = f ? 'M40,12 C55,18 60,28 57,42 L40,42 Z' : 'M40,12 C52,16 58,27 56,42 L40,42 Z';
    const fl = (x, y, s, k) => `<path transform="translate(${x} ${y}) scale(${s})" d="${k ? 'M0,0 C-6,-4 -5,-12 -1,-18 C0,-12 4,-12 3,-17 C8,-11 7,-3 0,0 Z' : 'M0,0 C-7,-3 -6,-11 -2,-16 C-1,-11 3,-10 2,-15 C7,-9 6,-2 0,0 Z'}" fill="url(#${I('f')})" ${ol(1.3)}/>`;
    return `<defs>
      ${lin(I('h'), [[0, '#6b4a3a'], [0.5, '#4a3128'], [1, '#2a1b17']])}
      ${lin(I('f'), [[0, '#fff2a8'], [0.45, '#ffb347'], [1, '#ff5a2a']])}
      ${lin(I('s'), [[0, '#d9c3a0'], [1, '#9a7f62']], 1, 0)}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      <clipPath id="${I('sc')}"><path d="${sail}"/></clipPath>
      ${glow(I('g'), '#ff8a3d')}
    </defs>
    <circle cx="44" cy="30" r="30" fill="url(#${I('g')})"/>
    <path d="M39,8 L72,46 M39,8 L14,42" stroke="#2a1f3a" stroke-width="0.8" fill="none"/>
    <path d="${sail}" fill="url(#${I('s')})"/>
    <g clip-path="url(#${I('sc')})">
      <path d="M44,${f ? 22 : 20} C48,24 50,30 47,34 C52,33 55,38 54,44 L40,44 L40,26 Z" fill="#2a1b17" opacity="0.55"/>
      <circle cx="50" cy="${f ? 27 : 29}" r="3" fill="#2a1b17" opacity="0.7"/>
    </g>
    <path d="${sail}" fill="none" ${ol(1.8)}/>
    ${fl(50, 30, f ? 1.1 : 1, f)}${fl(44, 20, f ? 0.8 : 0.9, !f)}
    <rect x="37.5" y="7" width="3.2" height="42" rx="1.2" fill="#3e2a20" ${ol(1.6)}/>
    ${[[16, 41], [27, 41], [21.5, 33]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-5.5" y="-6" width="11" height="12" rx="3" fill="#7a4a2a" ${ol(1.4)}/><path d="M-5.5,-2 L5.5,-2 M-5.5,2.5 L5.5,2.5" stroke="#2a1f1a" stroke-width="1.2"/><path d="M-2,-1 L2,2 M2,-1 L-2,2" stroke="#f3ead2" stroke-width="1" stroke-linecap="round"/></g>`).join('')}
    <path d="M21.5,27 C21,23 24,22 23,${f ? 18 : 19}" fill="none" stroke="#c9b08a" stroke-width="1.2"/>
    <circle cx="23" cy="${f ? 17.5 : 18.5}" r="${f ? 2.6 : 2}" fill="#fff2a8"/><circle cx="23" cy="${f ? 17.5 : 18.5}" r="${f ? 4.5 : 3.6}" fill="#ffb347" opacity="0.45"/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <path d="M6,55 C30,57 52,57 80,54" stroke="#2a1b17" stroke-width="1.1" fill="none"/>
      <path d="M6,61 C30,63 52,63 76,60" stroke="#2a1b17" stroke-width="1.1" fill="none"/>
      <path d="M20,48 C24,54 22,60 28,66 M54,48 C50,55 56,60 52,68" stroke="#1a100c" stroke-width="2.2" fill="none" opacity="0.6"/>
      <rect x="0" y="64" width="90" height="10" fill="#1d1418"/>
      <rect x="0" y="48" width="90" height="3" fill="#ff8a3d" opacity="0.75"/>
    </g>
    ${fl(66, 49, f ? 0.75 : 0.65, f)}${fl(12, 49, f ? 0.6 : 0.7, !f)}
    <path d="${hull}" fill="none" ${ol(2.2)}/>`;
  };
}
S.brulote0 = { w: 84, h: 74, ax: 42, ay: 62, draw: brulote(0) };
S.brulote1 = { w: 84, h: 74, ax: 42, ay: 62, draw: brulote(1) };

// ---------------------------------------------------------------- the Flying Dutchman: a ghostly galleon with torn sails and green lanterns
function ghostShip(f) {
  return (I) => {
    const b = f ? 2.5 : 0;
    const main = `M42,21 L72,21 C${77 + b},31 ${77 + b},38 74,47 L66,47 L64,40 L60,47 L52,47 L49,38 L46,47 L40,47 C37,38 37,31 42,21 Z`;
    const fore = `M78,27 L100,27 C${104 + b},35 ${104 + b},40 102,47 L96,47 L94,41 L90,47 L77,47 C75,40 75,35 78,27 Z`;
    const top = `M48,6 L66,6 C${69 + b * 0.5},10 ${70 + b * 0.5},14 69,17 L62,17 L60,13 L57,17 L45,17 C44,14 45,10 48,6 Z`;
    const hull = 'M8,34 L34,34 L36,52 L102,52 C110,52 117,50 122,45 C119,58 110,76 94,86 C86,91 74,92 60,92 L28,92 C16,90 9,80 8,64 Z';
    const rig = 'stroke="#9dffd8" stroke-width="0.8" fill="none" opacity="0.6"';
    return `<defs>
      ${lin(I('h'), [[0, '#4f8f86'], [0.5, '#2e5e5a'], [1, '#173533']])}
      ${lin(I('s'), [[0, '#d8fff2', 0.9], [1, '#7fd1bb', 0.75]], 1, 0)}
      <clipPath id="${I('hc')}"><path d="${hull}"/></clipPath>
      ${glow(I('g'), '#7dffcf')}
    </defs>
    <circle cx="13" cy="22" r="16" fill="url(#${I('g')})"/>
    <circle cx="64" cy="50" r="58" fill="url(#${I('g')})" opacity="0.35"/>
    <path d="M57,1 L10,34 M57,1 L120,46 M89,12 L126,35" ${rig}/>
    <path d="M110,49 L127,35" ${ol(3)}/><path d="M110,49 L127,35" stroke="#5aa596" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="55.5" y="0" width="3.6" height="54" rx="1.2" fill="#3c6f68" ${ol(1.6)}/>
    <rect x="87.5" y="12" width="3.4" height="42" rx="1.2" fill="#3c6f68" ${ol(1.6)}/>
    <path d="M59,1 L${f ? 72 : 75},${f ? 6 : 3} L68,5 L71,8 L59,7 Z" fill="#a8ffe0" opacity="0.8" ${ol(1.3)}/>
    <path d="${top}" fill="url(#${I('s')})" ${ol(1.8)}/>
    <path d="${main}" fill="url(#${I('s')})" ${ol(2)}/>
    <path d="${fore}" fill="url(#${I('s')})" ${ol(2)}/>
    <circle cx="66" cy="30" r="3.4" fill="#173533" opacity="0.55"/><circle cx="85" cy="35" r="2.6" fill="#173533" opacity="0.55"/><circle cx="50" cy="12" r="2" fill="#173533" opacity="0.55"/>
    ${skull(57, 34, 1.15, '#173533', '#a8ffe0')}
    <rect x="39" y="18.6" width="36" height="3.4" rx="1.2" fill="#3c6f68" ${ol(1.3)}/>
    <rect x="43" y="4" width="28" height="3" rx="1.2" fill="#3c6f68" ${ol(1.2)}/>
    <rect x="75" y="25" width="28" height="3" rx="1.2" fill="#3c6f68" ${ol(1.2)}/>
    <path d="M15,34 L15,25" ${ol(1.6)}/><rect x="12" y="18.5" width="6" height="7" rx="1.6" fill="#b6ffe4" ${ol(1.3)}/>
    <path d="${hull}" fill="url(#${I('h')})"/>
    <g clip-path="url(#${I('hc')})">
      <rect x="0" y="33" width="130" height="3" fill="#9dffd8" opacity="0.6"/>
      <rect x="0" y="51" width="130" height="3" fill="#9dffd8" opacity="0.6"/>
      <path d="M0,70 C40,72 80,72 130,64" stroke="#173533" stroke-width="1.3" fill="none"/>
      <path d="M0,78 C40,80 80,79 130,72" stroke="#173533" stroke-width="1.3" fill="none"/>
      <path d="M40,60 L46,68 L42,74 M84,58 L80,66 L86,72" stroke="#0e2422" stroke-width="1.6" fill="none"/>
      <rect x="0" y="84" width="130" height="14" fill="#0e2422" opacity="0.8"/>
    </g>
    ${[13, 21, 29].map(x => `<rect x="${x - 3}" y="40" width="6" height="7" rx="1.5" fill="#b6ffe4" ${ol(1.2)}/>`).join('')}
    ${[48, 62, 76, 90].map(x => `<rect x="${x - 4}" y="58" width="8" height="7" rx="1.2" fill="#7dffcf" opacity="0.85" ${ol(1.3)}/>`).join('')}
    <path d="${hull}" fill="none" ${ol(2.4)}/>
    <path d="M28,92 C24,96 26,${f ? 99 : 97} 22,98 M60,92 C58,96 62,98 58,${f ? 100 : 98} M94,86 C96,91 92,94 95,97" stroke="#9dffd8" stroke-width="1.5" fill="none" opacity="0.6" stroke-linecap="round"/>`;
  };
}
S.ghost0 = { w: 130, h: 100, ax: 64, ay: 84, draw: ghostShip(0) };
S.ghost1 = { w: 130, h: 100, ax: 64, ay: 84, draw: ghostShip(1) };

module.exports = { S, serpentHead, serpentBody, serpentTail, galleon, sloop };
