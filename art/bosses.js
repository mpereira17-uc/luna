// Boss sprites: krakens (+ tentacle chain pieces), the Armada Negra flagship, the leviathan chain and the eclipse demon.
const { OUT, ol, lin, rad, glow } = require('./lib');

const S = {};

// ---------------------------------------------------------------- geometry helpers
const f1 = n => +n.toFixed(2);
const pt = p => `${f1(p[0])},${f1(p[1])}`;
const poly = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join(' ');
// smooth Catmull-Rom path through points
function smooth(pts, closed) {
  const n = pts.length;
  const get = i => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pt(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + (closed ? ' Z' : '');
}
const deg = a => (a * Math.PI) / 180;
// a lead-in line followed by an inward spiral. Spiral angle a (degrees, screen coords: 90 = below the centre),
// decreasing angle curls the line counter-clockwise on screen (right -> up -> left).
function curlLine(lead, c, r0, r1, a0, a1, n = 40) {
  const pts = lead.slice();
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = deg(a0 + (a1 - a0) * t), r = r0 + (r1 - r0) * Math.pow(t, 0.9);
    pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
  }
  return pts;
}
// densify a polyline (for smooth offsets)
function dens(pts, step = 1.5) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(l / step));
    for (let j = 1; j <= k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  return out;
}
// tube around a centre line: hw(t) = half width at arc-length fraction t. side>0 offsets toward the right of travel.
function tube(pts, hw, capRx) {
  pts = dens(pts);
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const T = len[len.length - 1];
  const nrm = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  });
  const off = (k, from = 0, to = 1) => {
    const o = [];
    pts.forEach((p, i) => { const t = len[i] / T; if (t < from - 1e-6 || t > to + 1e-6) return; const w = hw(t) * k; o.push([p[0] - nrm[i][1] * w, p[1] + nrm[i][0] * w]); });
    return o;
  };
  const wEnd = hw(1), wBeg = hw(0), crx = capRx === undefined ? wBeg : capRx;
  const L = off(-1), R = off(1);
  const fill = `${poly(L)} A${f1(wEnd)},${f1(wEnd)} 0 0 1 ${pt(R[R.length - 1])} ${poly(R.slice().reverse()).replace(/^M/, 'L')} A${f1(crx)},${f1(wBeg)} ${f1(Math.atan2(nrm[0][1], nrm[0][0]) * 180 / Math.PI)} 0 1 ${pt(L[0])} Z`;
  // outline that skips the base end (for chain joints)
  const edge = `${poly(L)} A${f1(wEnd)},${f1(wEnd)} 0 0 1 ${pt(R[R.length - 1])} ${poly(R.slice().reverse()).replace(/^M/, 'L')}`;
  // band between offsets k0..k1 (k in -1..1, positive = right side)
  const band = (k0, k1, from = 0, to = 1) => { const a = off(k0, from, to), b = off(k1, from, to); return `${poly(a)} ${poly(b.reverse()).replace(/^M/, 'L')} Z`; };
  // a point at fraction t, offset k
  const at = (t, k = 0) => { let i = len.findIndex(v => v / T >= t); if (i < 0) i = pts.length - 1; const w = hw(len[i] / T) * k; return [pts[i][0] - nrm[i][1] * w, pts[i][1] + nrm[i][0] * w, Math.atan2(nrm[i][1], nrm[i][0]) * 180 / Math.PI, hw(len[i] / T)]; };
  return { fill, edge, band, off, at, L, R };
}
const mirror = (w, inner) => `<g transform="translate(${w} 0) scale(-1 1)">${inner}</g>`;
// layered glowing crack line
const crack = (d, c, w = 1) => `<path d="${d}" fill="none" stroke="${c[0]}" stroke-width="${4.6 * w}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
  <path d="${d}" fill="none" stroke="${c[1]}" stroke-width="${2.1 * w}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${c[2]}" stroke-width="${0.8 * w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---------------------------------------------------------------- kraken palettes
const KA = {
  hi: '#b98ae0', lt: '#9563c0', mid: '#6b3f8f', dk: '#4a2669', deep: '#2b1243',
  spot: '#4d2870', belly: '#f4bddb', bellyDk: '#c77eaa', rim: '#e2c2ff',
  eye: ['#fffbb8', '#ffdc3a', '#e8900e'], eyeGlow: null, beak: ['#f6ead0', '#b3946a', '#fffdf6', '#7d6446'], lava: null,
};
const KM = {
  hi: '#7e4632', lt: '#633423', mid: '#47231a', dk: '#2f1610', deep: '#1a0a06',
  spot: null, belly: '#ff9a3c', bellyDk: '#d9481a', rim: '#ffb07a',
  eye: ['#fff6c8', '#ffb43a', '#e2440e'], eyeGlow: '#ff7a1a', beak: ['#4a332b', '#120a08', '#ff9a3a', '#ff6a1a'],
  lava: ['#ff5a14', '#ff9a30', '#ffe7a0'],
};

// ---------------------------------------------------------------- kraken
const KR_BODY = 'M75,6 C102,6 124,22 124,46 C124,62 117,71 114,79 C111,87 113,94 120,99 C125,103 128,107 128,111 ' +
  'C125,115 119,115.5 113,113.5 C108,116 100,116 95,113.5 C89,116 82,115.5 75,113.5 C68,115.5 61,116 55,113.5 C50,116 42,116 37,113.5 C31,115.5 25,115 22,111 ' +
  'C22,107 25,103 30,99 C37,94 39,87 36,79 C33,71 26,62 26,46 C26,22 48,6 75,6 Z';

function kraken(K, slam) {
  return (I) => {
    // side tentacle stubs (drawn behind the body; union outline so they grow out of it)
    const stub = slam
      ? tube(curlLine([[100, 106], [114, 103]], [124, 84], 15.5, 4.5, 106, -200, 46), t => 9.6 * Math.pow(1 - t, 1.1) + 1.6 * t)
      : tube(curlLine([[100, 106], [118, 105.5]], [127, 93], 12.5, 4, 94, -200, 44), t => 9.4 * Math.pow(1 - t, 1.1) + 1.6 * t);
    const stubDraw = (pass) => {
      if (pass === 'out') return `<path d="${stub.fill}" fill="${OUT}" stroke="${OUT}" stroke-width="5.2" stroke-linejoin="round"/>`;
      const suck = [0.42, 0.55, 0.66, 0.76, 0.85].map((t, i) => { const p = stub.at(t, 0.78); const s = 1 - i * 0.14; return `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(2.6 * s)}" ry="${f1(1.9 * s)}" transform="rotate(${f1(p[2])} ${f1(p[0])} ${f1(p[1])})" fill="${K.belly}" stroke="${OUT}" stroke-width="0.9"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(1.1 * s)}" ry="${f1(0.8 * s)}" transform="rotate(${f1(p[2])} ${f1(p[0])} ${f1(p[1])})" fill="${K.bellyDk}"/>`; }).join('');
      return `<path d="${stub.fill}" fill="url(#${I('stub')})"/>
        <path d="${stub.band(0.35, 1)}" fill="${K.lava ? K.bellyDk : K.belly}"/>
        <path d="${stub.band(0.35, 0.6)}" fill="${K.lava ? K.lava[1] : K.bellyDk}" opacity="${K.lava ? 0.9 : 0.45}"/>
        <path d="${poly(stub.off(-0.55, 0.15, 0.9))}" fill="none" stroke="${K.rim}" stroke-width="1.6" stroke-linecap="round" opacity="0.45"/>
        ${suck}`;
    };
    const both = pass => stubDraw(pass) + mirror(150, stubDraw(pass));

    // eyes
    const eye = (k, cx, cy, side) => {
      const rx = slam ? 14 : 13, ry = slam ? 15.5 : 13.5;
      const ec = I('ec' + k);
      let s = `<ellipse cx="${cx}" cy="${cy + 1}" rx="${rx + 4.5}" ry="${ry + 4}" fill="${K.deep}" opacity="0.5"/>`;
      if (K.eyeGlow) s += `<circle cx="${cx}" cy="${cy}" r="${rx + 12}" fill="url(#${I('eg')})"/>`;
      if (slam) s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 3}" ry="${ry + 3}" fill="url(#${I('red')})" ${ol(1.6)}/>`;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${I('eye')})" ${ol(1.8)}/>`;
      s += `<g clip-path="url(#${ec})">`;
      const pw = slam ? 1.9 : 3, ph = slam ? 11.5 : 10.5, px = cx - side * (slam ? 0 : 1.2);
      s += `<ellipse cx="${px}" cy="${cy + 1}" rx="${pw + 1.4}" ry="${ph + 0.8}" fill="${K.eye[2]}" opacity="0.6"/>`;
      s += `<ellipse cx="${px}" cy="${cy + 1}" rx="${pw}" ry="${ph}" fill="${OUT}"/>`;
      s += `<ellipse cx="${cx - 4.5}" cy="${cy - 5.5}" rx="3.2" ry="2.6" fill="#fff" opacity="0.9"/><circle cx="${cx + 4}" cy="${cy + 6}" r="1.3" fill="#fff" opacity="0.6"/>`;
      if (slam) {
        // bloodshot veins
        s += [[-1, -0.3], [-0.9, 0.5], [1, 0.2], [0.85, -0.6]].map(([a, b]) => `<path d="M${f1(cx + a * rx)},${f1(cy + b * ry)} L${f1(cx + a * rx * 0.62)},${f1(cy + b * ry * 0.75)} L${f1(cx + a * rx * 0.5)},${f1(cy + b * ry * 0.5 + 1.5)}" stroke="#e8283c" stroke-width="0.9" fill="none" opacity="0.8"/>`).join('');
      }
      // angry lid: covers upper-inner part of the eye
      const inner = side, out = -side;
      const y0 = slam ? cy - ry * 0.95 : cy - ry * 0.62, y1 = slam ? cy - ry * 0.5 : cy - ry * 0.05;
      const xa = cx + out * (rx + 3), xb = cx + inner * (rx + 3);
      s += `<path d="M${xa},${cy - ry - 4} L${xb},${cy - ry - 4} L${xb},${f1(y1)} L${xa},${f1(y0)} Z" fill="url(#${I('lid')})"/>`;
      s += `<path d="M${xa},${f1(y0)} L${xb},${f1(y1)}" stroke="${OUT}" stroke-width="2" stroke-linecap="round"/>`;
      s += `</g>`;
      // heavy brow ridge (shaded bulge, outlined only where it overhangs the eye)
      const bx0 = cx + out * (rx + 5), bx1 = cx + inner * (rx + 2), by0 = y0 - 1.2, by1 = y1 + 0.8;
      const lift = slam ? 9 : 7.5;
      s += `<path d="M${f1(bx0)},${f1(by0 + 1)} C${f1(bx0 + inner * 3)},${f1(by0 - lift)} ${f1(bx1 - inner * 6)},${f1(by1 - lift - 2)} ${f1(bx1 + inner * 2)},${f1(by1 - 1)} C${f1(bx1)},${f1(by1 + 2)} ${f1(bx1 - inner * 4)},${f1(by1 + 1.5)} ${f1(bx1 - inner * 6)},${f1(by1)} L${f1(bx0 + inner * 4)},${f1(by0 + 0.5)} Z" fill="url(#${I('brow')})"/>`;
      s += `<path d="M${f1(bx0 + inner * 3)},${f1(by0 + 0.4)} L${f1(bx1 - inner * 6)},${f1(by1)} C${f1(bx1 - inner * 4)},${f1(by1 + 1.5)} ${f1(bx1)},${f1(by1 + 2)} ${f1(bx1 + inner * 2)},${f1(by1 - 1)}" fill="none" ${ol(2)}/>`;
      s += `<path d="M${f1(bx0 + inner * 3)},${f1(by0 - 2.5)} C${f1(bx0 + inner * 8)},${f1(by0 - lift + 1)} ${f1(bx1 - inner * 8)},${f1(by1 - lift)} ${f1(bx1 - inner * 2)},${f1(by1 - 3.5)}" fill="none" stroke="${K.rim}" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>`;
      return s;
    };

    // beak
    const UB = slam
      ? 'M63,84 C64,79.5 86,79.5 87,84 C87,88 83,91.5 79,93.5 C77.5,94.5 76,96 75,97.5 C74,96 72.5,94.5 71,93.5 C67,91.5 63,88 63,84 Z'
      : 'M64,83 C65,79 85,79 86,83 C86.5,88 83,93 79,96.5 C77.5,98 76.2,100 75,102 C73.8,100 72.5,98 71,96.5 C67,93 63.5,88 64,83 Z';
    const beakShade = (top, tip) => `<path d="M75,${top} C75.5,${top + 6} 75.6,${tip - 8} 75,${tip}" stroke="${K.beak[3]}" stroke-width="1.1" fill="none" opacity="0.7"/>
      <path d="M68,${top + 1.5} C67.5,${top + 6} 70,${top + 10} 73,${tip - 5}" stroke="${K.beak[2]}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.85"/>`;
    const beak = slam
      ? `<ellipse cx="75" cy="95" rx="14.5" ry="13.2" fill="${K.deep}" ${ol(2)}/>
         <ellipse cx="75" cy="96" rx="12.4" ry="11" fill="url(#${I('mouth')})"/>
         <path d="M66,102.5 C70,99.5 80,99.5 84,102.5 C82,105 79,106 75,106 C71,106 68,105 66,102.5 Z" fill="${K.lava ? '#ffb35a' : '#e86a8c'}" opacity="0.95"/>
         <path d="${UB}" fill="url(#${I('beak')})" ${ol(1.7)}/>
         ${beakShade(81, 97)}
         <path d="M66,104.5 C69,101 81,101 84,104.5 C83,107.5 79,110 75,110.5 C71,110 67,107.5 66,104.5 Z" fill="url(#${I('beak')})" ${ol(1.6)}/>
         <path d="M70,104 C72.5,103 77.5,103 80,104" stroke="${K.beak[2]}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7"/>`
      : `<path d="M62,86 C58,89 57,93 58,97 M88,86 C92,89 93,93 92,97" stroke="${K.deep}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75"/>
         <ellipse cx="75" cy="87" rx="14" ry="9.5" fill="${K.deep}" opacity="0.5"/>
         <path d="M67.5,90 C69,96 72,99 75,100 C78,99 81,96 82.5,90 C80,93 70,93 67.5,90 Z" fill="url(#${I('beak')})" ${ol(1.4)}/>
         <path d="${UB}" fill="url(#${I('beak')})" ${ol(1.8)}/>
         ${beakShade(80.5, 100)}
         <path d="M68.5,92.5 C71,94.5 73,96 75,97" stroke="${K.beak[3]}" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.6"/>`;

    // surface markings: spots (normal) or lava cracks (magma)
    const spots = [[90, 16, 4.4], [106, 27, 5.8], [116, 45, 3.6], [64, 26, 3.2], [83, 33, 5], [45, 39, 3.4], [104, 58, 2.6], [35, 58, 2.6], [74, 14, 2.2], [98, 43, 2.2], [56, 44, 2], [118, 62, 2]];
    const marks = K.lava
      ? [
          'M44,26 L50,33 L48,41 L55,47', 'M48,41 L42,46', 'M86,11 L90,21 L99,25 L103,35 L113,39', 'M99,25 L106,21',
          'M70,22 L76,30 L72,39 L77,45', 'M107,53 L114,58 L119,53', 'M33,55 L38,62', 'M120,30 L116,34',
          'M42,97 L47,104 L45,112', 'M108,97 L103,104 L108,112', 'M60,108 L64,114', 'M90,108 L86,114',
        ].map(d => crack(d, K.lava, 0.9)).join('') +
        [[60, 37, 1.6], [95, 33, 1.3], [112, 70, 1.2], [38, 70, 1.3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="url(#${I('eg')})" opacity="0.6"/><circle cx="${x}" cy="${y}" r="${r}" fill="${K.lava[2]}"/>`).join('')
      : spots.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.82}" fill="${K.spot}" opacity="0.8"/>`).join('');

    return `<defs>
      ${rad(I('body'), [[0, K.hi], [0.38, K.lt], [0.72, K.mid], [1, K.dk]], 0.36, 0.22, 0.85)}
      ${lin(I('stub'), [[0, K.lt], [0.6, K.mid], [1, K.dk]])}
      ${lin(I('lid'), [[0, K.lt], [1, K.mid]])}
      ${lin(I('brow'), [[0, K.lt], [0.7, K.mid], [1, K.dk]])}
      ${rad(I('eye'), [[0, K.eye[0]], [0.5, K.eye[1]], [1, K.eye[2]]], 0.42, 0.38, 0.62)}
      ${rad(I('red'), [[0.6, '#ff6a5a'], [1, '#b0102a']])}
      ${lin(I('beak'), [[0, K.beak[0]], [0.45, K.beak[0]], [1, K.beak[1]]], 1, 0.6)}
      ${lin(I('mouth'), [[0, '#14060c'], [0.6, K.lava ? '#a02a0a' : '#6a1030'], [1, K.lava ? '#ff7a2a' : '#b02a4a']])}
      ${K.eyeGlow ? glow(I('eg'), K.eyeGlow) : ''}
      ${rad(I('flush'), [[0, '#ff3048', 0.45], [1, '#ff3048', 0]])}
      <clipPath id="${I('bc')}"><path d="${KR_BODY}"/></clipPath>
      <clipPath id="${I('ec0')}"><ellipse cx="55" cy="66" rx="${slam ? 14 : 13}" ry="${slam ? 15.5 : 13.5}"/></clipPath>
      <clipPath id="${I('ec1')}"><ellipse cx="95" cy="66" rx="${slam ? 14 : 13}" ry="${slam ? 15.5 : 13.5}"/></clipPath>
    </defs>
    ${both('out')}
    <path d="${KR_BODY}" fill="${OUT}" stroke="${OUT}" stroke-width="5.4" stroke-linejoin="round"/>
    ${both('fill')}
    <path d="${KR_BODY}" fill="url(#${I('body')})"/>
    <g clip-path="url(#${I('bc')})">
      <path d="${KR_BODY}" transform="translate(-10 -5)" fill="none" stroke="${K.deep}" stroke-width="20" opacity="0.32"/>
      ${marks}
      ${slam ? `<ellipse cx="75" cy="70" rx="52" ry="34" fill="url(#${I('flush')})"/>` : ''}
      <path d="M55,101 C54.5,106 55,110 55,115 M95,101 C95.5,106 95,110 95,115 M37,103 C37,108 37,111 37,115 M113,103 C113,108 113,111 113,115" stroke="${K.deep}" stroke-width="1.6" fill="none" opacity="0.55"/>
      <path d="M31,62 C26,40 40,13 72,10" stroke="${K.rim}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.55"/>
      <ellipse cx="52" cy="25" rx="15" ry="8" transform="rotate(-32 52 25)" fill="#fff" opacity="0.2"/>
      <ellipse cx="47" cy="27" rx="4.5" ry="2.6" transform="rotate(-38 47 27)" fill="#fff" opacity="0.55"/>
    </g>
    <path d="M121,100 C124,102 126,104 127,107 M29,100 C26,102 24,104 23,107" stroke="${OUT}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6"/>
    ${eye(0, 55, 66, 1)}${eye(1, 95, 66, -1)}
    <path d="M71.5,${slam ? 47 : 51} C72.5,${slam ? 50 : 53} 73.2,${slam ? 52 : 55} 73.4,${slam ? 55 : 57.5} M78.5,${slam ? 47 : 51} C77.5,${slam ? 50 : 53} 76.8,${slam ? 52 : 55} 76.6,${slam ? 55 : 57.5}" stroke="${K.deep}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.7"/>
    ${beak}`;
  };
}
S.krakenA = { w: 150, h: 120, ax: 75, ay: 112, pts: { mouth: [75, 92], eyeL: [55, 66], eyeR: [95, 66] }, draw: kraken(KA, false) };
S.krakenA_slam = { w: 150, h: 120, ax: 75, ay: 112, pts: { mouth: [75, 95], eyeL: [55, 66], eyeR: [95, 66] }, draw: kraken(KA, true) };
S.krakenM = { w: 150, h: 120, ax: 75, ay: 112, pts: { mouth: [75, 92], eyeL: [55, 66], eyeR: [95, 66] }, draw: kraken(KM, false) };
S.krakenM_slam = { w: 150, h: 120, ax: 75, ay: 112, pts: { mouth: [75, 95], eyeL: [55, 66], eyeR: [95, 66] }, draw: kraken(KM, true) };

// ---------------------------------------------------------------- tentacle chain pieces
// Segment: a round cross-section. Outline only on the top and bottom arcs, so overlapped segments merge into one tube.
function tentSeg(K) {
  return (I) => {
    const cx = 14, cy = 14, r = 10;
    const A = a => [cx + r * Math.cos(deg(a)), cy - r * Math.sin(deg(a))];
    const top = `M${pt(A(146))} A${r},${r} 0 0 1 ${pt(A(34))}`;
    const bot = `M${pt(A(214))} A${r},${r} 0 0 0 ${pt(A(326))}`;
    const by = cy + r * 0.36;
    // outline stroke fades out toward the overlapped ends
    const fade = `<linearGradient id="${I('o')}" gradientUnits="userSpaceOnUse" x1="${cx - r}" y1="0" x2="${cx + r}" y2="0">
      <stop offset="0.08" stop-color="${OUT}" stop-opacity="0"/><stop offset="0.24" stop-color="${OUT}" stop-opacity="1"/>
      <stop offset="0.76" stop-color="${OUT}" stop-opacity="1"/><stop offset="0.92" stop-color="${OUT}" stop-opacity="0"/></linearGradient>`;
    return `<defs>
      ${lin(I('g'), [[0, K.hi], [0.35, K.lt], [0.75, K.mid], [1, K.dk]])}
      ${lin(I('b'), K.lava ? [[0, K.lava[1]], [1, K.bellyDk]] : [[0, K.belly], [1, K.bellyDk]])}
      ${fade}
      <clipPath id="${I('c')}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      ${K.lava ? glow(I('gl'), K.lava[0]) : ''}
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${I('g')})"/>
    <g clip-path="url(#${I('c')})">
      <rect x="0" y="${f1(by)}" width="28" height="14" fill="url(#${I('b')})"/>
      <rect x="0" y="${f1(by)}" width="28" height="1.2" fill="${K.lava ? K.lava[2] : '#fff'}" opacity="${K.lava ? 0.7 : 0.35}"/>
      <rect x="0" y="${f1(cy - r * 0.8)}" width="28" height="2.4" fill="${K.rim}" opacity="0.36"/>
      ${K.lava ? crack('M6,11 L10,9.5 L13,12 L17.5,8.5 L22,10.5', K.lava, 0.65) : `<ellipse cx="17" cy="${cy - 1.5}" rx="2.3" ry="1.9" fill="${K.spot}" opacity="0.85"/><ellipse cx="9.5" cy="${cy}" rx="1.3" ry="1.1" fill="${K.spot}" opacity="0.85"/>`}
    </g>
    <path d="${top}" fill="none" stroke="url(#${I('o')})" stroke-width="2.2" stroke-linecap="round"/>
    <path d="${bot}" fill="none" stroke="url(#${I('o')})" stroke-width="2.2" stroke-linecap="round"/>
    ${K.lava ? `<circle cx="${cx}" cy="${cy + r - 0.6}" r="3.4" fill="url(#${I('gl')})"/>` : ''}
    <ellipse cx="${cx}" cy="${f1(cy + r - 0.6)}" rx="3.3" ry="2.2" fill="${K.lava ? K.lava[1] : K.belly}" ${ol(1.1)}/>
    <ellipse cx="${cx}" cy="${f1(cy + r - 0.6)}" rx="1.6" ry="0.95" fill="${K.lava ? K.lava[2] : K.bellyDk}"/>`;
  };
}
// Curled tip: starts at the left (joint at x=6) and curls right and up.
function tentTip(K) {
  return (I) => {
    const tb = tube(curlLine([[7, 15], [12, 15.8], [17.5, 17.6]], [24.2, 10.6], 7.6, 3.9, 96, -158, 48), t => 7.7 * Math.pow(1 - t, 1.45) + 0.9 * t, 4);
    const suck = [0.1, 0.25, 0.39, 0.52, 0.64, 0.75].map((t, i) => {
      const p = tb.at(t, 0.88); const s = 1 - i * 0.13;
      return `${K.lava ? `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(4 * s)}" fill="url(#${I('gl')})"/>` : ''}<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(2.6 * s)}" ry="${f1(1.8 * s)}" transform="rotate(${f1(p[2])} ${f1(p[0])} ${f1(p[1])})" fill="${K.lava ? K.lava[1] : K.belly}" stroke="${OUT}" stroke-width="${f1(1.1 * s)}"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(1.2 * s)}" ry="${f1(0.75 * s)}" transform="rotate(${f1(p[2])} ${f1(p[0])} ${f1(p[1])})" fill="${K.lava ? K.lava[2] : K.bellyDk}"/>`;
    }).join('');
    return `<defs>
      ${lin(I('g'), [[0, K.hi], [0.4, K.lt], [1, K.mid]], 0.3, 1)}
      ${lin(I('b'), K.lava ? [[0, K.lava[1]], [1, K.bellyDk]] : [[0, K.belly], [1, K.bellyDk]], 0, 1)}
 ${K.lava ? glow(I('gl'), K.lava[0]) : ''}
      <linearGradient id="${I('o')}" gradientUnits="userSpaceOnUse" x1="4" y1="0" x2="12" y2="0"><stop offset="0" stop-color="${OUT}" stop-opacity="0"/><stop offset="1" stop-color="${OUT}"/></linearGradient>
    </defs>
    <path d="${tb.edge}" fill="none" stroke="url(#${I('o')})" stroke-width="3.8" stroke-linejoin="round"/>
    <path d="${tb.fill}" fill="url(#${I('g')})"/>
    <path d="${tb.band(0.36, 1)}" fill="url(#${I('b')})"/>
    <path d="${poly(tb.off(0.36, 0, 0.95))}" fill="none" stroke="${K.lava ? K.lava[2] : '#fff'}" stroke-width="0.9" opacity="${K.lava ? 0.6 : 0.3}"/>
    <path d="${poly(tb.off(-0.55, 0.03, 0.8))}" fill="none" stroke="${K.rim}" stroke-width="2" stroke-linecap="round" opacity="0.36"/>
    ${K.lava ? crack(poly(tb.off(-0.15, 0.08, 0.5)), K.lava, 0.6) : `<ellipse cx="13" cy="11.5" rx="2.2" ry="1.8" fill="${K.spot}" opacity="0.85"/><ellipse cx="21" cy="12.6" rx="1.4" ry="1.2" fill="${K.spot}" opacity="0.85"/>`}
    ${suck}`;
  };
}
S.tentA = { w: 28, h: 28, ax: 14, ay: 14, draw: tentSeg(KA) };
S.tentTipA = { w: 36, h: 30, ax: 6, ay: 15, draw: tentTip(KA) };
S.tentM = { w: 28, h: 28, ax: 14, ay: 14, draw: tentSeg(KM) };
S.tentTipM = { w: 36, h: 30, ax: 6, ay: 15, draw: tentTip(KM) };

// ---------------------------------------------------------------- La Armada Negra (flagship)
const GOLD = ['#ffe08a', '#e8b04c', '#a8701e'];
// a red skull and crossbones emblem centred at (x,y), ~26 units wide at s=1
function redSkull(I, x, y, s) {
  const bone = (x1, y1, x2, y2) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${OUT}" stroke-width="5.6" stroke-linecap="round"/>
    <circle cx="${x1}" cy="${y1 - 1.6}" r="2.5" fill="url(#${I('sk')})" stroke="${OUT}" stroke-width="1.1"/><circle cx="${x1 + (x1 < x2 ? -1.6 : 1.6)}" cy="${y1 + 0.6}" r="2.5" fill="url(#${I('sk')})" stroke="${OUT}" stroke-width="1.1"/>
    <circle cx="${x2}" cy="${y2 + 1.6}" r="2.5" fill="url(#${I('sk')})" stroke="${OUT}" stroke-width="1.1"/><circle cx="${x2 + (x1 < x2 ? 1.6 : -1.6)}" cy="${y2 - 0.6}" r="2.5" fill="url(#${I('sk')})" stroke="${OUT}" stroke-width="1.1"/>
    <path d="M${x1},${y1} L${x2},${y2}" stroke="url(#${I('sk')})" stroke-width="3.4" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${bone(-12, -9, 12, 11)}${bone(12, -9, -12, 11)}
    <path d="M-9,-1 C-9,-12 9,-12 9,-1 C9,3.5 6.5,5 6,8 L-6,8 C-6.5,5 -9,3.5 -9,-1 Z" fill="url(#${I('sk')})" ${ol(1.4)}/>
    <path d="M-5.5,8 L5.5,8 L5,12 C2,13.4 -2,13.4 -5,12 Z" fill="url(#${I('sk')})" ${ol(1.3)}/>
    <path d="M-2.6,8.3 L-2.6,12.6 M0,8.3 L0,13 M2.6,8.3 L2.6,12.6" stroke="${OUT}" stroke-width="0.9"/>
    <path d="M-7.4,-2.6 L-1.6,-0.6 C-1.6,2 -3.2,3.6 -5,3.6 C-7,3.6 -7.8,1 -7.4,-2.6 Z" fill="${OUT}"/>
    <path d="M7.4,-2.6 L1.6,-0.6 C1.6,2 3.2,3.6 5,3.6 C7,3.6 7.8,1 7.4,-2.6 Z" fill="${OUT}"/>
    <circle cx="-4.4" cy="1.2" r="1" fill="#ff8a6a"/><circle cx="4.4" cy="1.2" r="1" fill="#ff8a6a"/>
    <path d="M0,3.6 L-1.5,6.4 L1.5,6.4 Z" fill="${OUT}"/>
    <path d="M-6.5,-5 C-5,-8.5 -1,-9.6 2,-9.2" stroke="#ff9a9a" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7"/>
  </g>`;
}
function flagship(fr) {
  return (I) => {
    const b = fr ? 3.2 : 0;
    const sheer = (x, y0, k = 8) => y0 - k * Math.pow((x - 115) / 105, 2);
    const curve = (y0, k = 8) => { const p = []; for (let x = 0; x <= 240; x += 8) p.push([x, sheer(x, y0, k)]); return p; };
    const bandP = (ya, yb) => `${poly(curve(ya))} ${poly(curve(yb).reverse()).replace(/^M/, 'L')} Z`;
    const HULL = 'M9,80 C22,82 45,86 65,89 L68,104 C96,108 140,108 165,103 L168,96 C180,95 192,94 201,94 C208,97 213,103 216,111 ' +
      'C219,124 216,138 210,153 C203,168 194,181 184,189 C176,195 162,197 146,197 L62,197 C46,197 36,192 30,183 C24,170 19,154 16,138 C12,120 8,100 9,80 Z';
    // billowing square sail
    const sail = (cx, y0, y1, w0, w1, bb) => {
      const h = y1 - y0;
      return `M${cx - w0},${y0} L${cx + w0},${y0} C${f1(cx + w0 + 2 + bb * 0.8)},${f1(y0 + h * 0.3)} ${f1(cx + w1 + 3 + bb)},${f1(y1 - h * 0.35)} ${cx + w1},${y1} ` +
        `Q${f1(cx + bb * 0.4)},${f1(y1 + 3 + bb * 0.3)} ${cx - w1},${y1} C${f1(cx - w1 - 2 + bb * 0.3)},${f1(y1 - h * 0.35)} ${f1(cx - w0 - 1.5 + bb * 0.3)},${f1(y0 + h * 0.3)} ${cx - w0},${y0} Z`;
    };
    // sail shading shared by square sails and jibs (clipped)
    let sails = '';
    const SAILS = [
      // [cx, y0, y1, w0, w1]
      [62, 42, 60, 13, 16], [62, 64, 87, 17, 20],
      [118, 27, 41, 13, 16], [118, 45, 67, 19, 24], [118, 71, 103, 25, 29],
      [172, 31, 44, 10, 13], [172, 48, 68, 16, 20], [172, 72, 98, 21, 24],
    ];
    SAILS.forEach(([cx, y0, y1, w0, w1], k) => {
      const d = sail(cx, y0, y1, w0, w1, b), cid = I('sc' + k);
      const h = y1 - y0;
      sails += `<clipPath id="${cid}"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#${I('sail')})"/>
        <g clip-path="url(#${cid})">
          <path d="M${cx - w1 - 4},${f1(y0 + h * 0.5)} Q${f1(cx + b * 0.4)},${f1(y0 + h * 0.5 + 2.5)} ${cx + w1 + 6},${f1(y0 + h * 0.5)}" stroke="#5a4e6e" stroke-width="0.8" fill="none" opacity="0.5"/>
          <path d="M${f1(cx - w0 + 4 + b * 0.3)},${y0 + 2} C${f1(cx - w1 + 2 + b * 0.5)},${f1(y0 + h * 0.4)} ${f1(cx - w1 + 2 + b * 0.5)},${f1(y1 - h * 0.3)} ${f1(cx - w1 + 4)},${y1 + 2}" stroke="#9a8cb8" stroke-width="2.4" fill="none" opacity="0.3"/>
          <path d="M${f1(cx + w0 - 3 + b)},${y0} C${f1(cx + w1 + b)},${f1(y0 + h * 0.4)} ${f1(cx + w1 + b)},${f1(y1 - h * 0.3)} ${f1(cx + w1 - 2)},${y1 + 3} L${cx + w1 + 12},${y1 + 4} L${cx + w1 + 12},${y0} Z" fill="#000" opacity="0.3"/>
          <path d="M${cx - w1 - 6},${f1(y1 - 1.2 + b * 0.15)} Q${f1(cx + b * 0.4)},${f1(y1 + 1.8 + b * 0.3)} ${cx + w1 + 6},${f1(y1 - 1.2)}" stroke="#a01e30" stroke-width="2.6" fill="none"/>
        </g>
        ${k === 4 ? redSkull(I, 118 + b * 0.5, 84.5, 1.2) : ''}
        <path d="${d}" fill="none" ${ol(k === 4 ? 2.2 : 1.9)}/>
        <rect x="${cx - w0 - 3}" y="${y0 - 1.8}" width="${w0 * 2 + 6}" height="3.4" rx="1.6" fill="url(#${I('wood')})" ${ol(1.2)}/>
        <circle cx="${cx - w0 - 2}" cy="${y0 - 0.1}" r="1" fill="${GOLD[1]}"/><circle cx="${cx + w0 + 2}" cy="${y0 - 0.1}" r="1" fill="${GOLD[1]}"/>`;
    });
    // jibs (behind the fore sails): head, tack, clew
    const jib = (h, t, c, k) => {
      const d = `M${pt(h)} L${pt(t)} Q${f1((t[0] + c[0]) / 2 + 1 + b * 0.4)},${f1((t[1] + c[1]) / 2 + 4 + b * 0.4)} ${pt(c)} Q${f1((h[0] + c[0]) / 2 + 4 + b)},${f1((h[1] + c[1]) / 2 + 1)} ${pt(h)} Z`;
      return `<clipPath id="${I('jc' + k)}"><path d="${d}"/></clipPath><path d="${d}" fill="url(#${I('sail')})"/>
        <g clip-path="url(#${I('jc' + k)})"><path d="M${f1(h[0] + 1)},${f1(h[1] + 4)} Q${f1((h[0] + c[0]) / 2 + 6 + b)},${f1((h[1] + c[1]) / 2)} ${f1(c[0] + 3)},${f1(c[1] - 2)}" stroke="#9a8cb8" stroke-width="2.4" fill="none" opacity="0.3"/>
        <path d="M${pt(t)} Q${f1((t[0] + c[0]) / 2 + 1 + b * 0.4)},${f1((t[1] + c[1]) / 2 + 4 + b * 0.4)} ${pt(c)}" stroke="#a01e30" stroke-width="4" fill="none"/></g>
        <path d="${d}" fill="none" ${ol(1.7)}/>`;
    };
    const jibs = jib([179, 52], [214, 79], [196, 95], 1) + jib([182, 27], [232, 64], [205, 80], 0);
    // red pennants (wave differs per frame)
    const pennant = (x, y, L, ph, w = 2.8) => {
      const top = [], bot = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14, xx = x + t * L, yy = y + Math.sin(ph + t * 5.2) * (0.6 + t * 2.6) + t * 2.2, ww = w * (1 - t * 0.62);
        top.push([xx, yy - ww]); bot.push([xx, yy + ww]);
      }
      const e = top.length - 1, tip = [(top[e][0] + bot[e][0]) / 2 - 3.6, (top[e][1] + bot[e][1]) / 2];
      return `<path d="${poly(top)} L${pt(tip)} ${poly(bot.reverse()).replace(/^M/, 'L')} Z" fill="url(#${I('pen')})" ${ol(1.3)}/>
        <path d="${poly(top.slice(1, 9).map(p => [p[0], p[1] + 1]))}" stroke="#ff9aa4" stroke-width="0.8" fill="none" opacity="0.7"/>`;
    };
    const ph = fr ? 2.2 : 0;
    // glowing gunports with cannon muzzles
    const rows = [[121, 74, 200, 6.8, 6, 1], [139, 50, 202, 7.4, 6.4, 0.92], [157, 46, 192, 7.4, 6.4, 0.8]];
    let halos = '', ports = '';
    rows.forEach(([y0, xa, xb, w, h, op], ri) => {
      for (let x = xa; x <= xb; x += 13.4) {
        const y = sheer(x, y0);
        halos += `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="url(#${I('ph')})" opacity="${op * 0.6}"/>`;
        ports += `<rect x="${f1(x - w / 2)}" y="${f1(y - h / 2)}" width="${w}" height="${h}" rx="1.3" fill="url(#${I('port')})" stroke="${OUT}" stroke-width="1.15"/>
          <ellipse cx="${f1(x + 0.6)}" cy="${f1(y + 1.3)}" rx="1.9" ry="1.6" fill="#3a2a2a"/><ellipse cx="${f1(x + 0.7)}" cy="${f1(y + 1.4)}" rx="1" ry="0.85" fill="${OUT}"/>
          <path d="M${f1(x - w / 2 - 0.6)},${f1(y - h / 2 - 1.1)} L${f1(x + w / 2 + 0.6)},${f1(y - h / 2 - 1.1)}" stroke="${GOLD[1]}" stroke-width="1" stroke-linecap="round" opacity="0.85"/>`;
      }
    });
    const lantern = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-4,-5 L4,-5 L5,0 L4,6 L-4,6 L-5,0 Z" fill="url(#${I('lamp')})" ${ol(1.2)}/>
      <path d="M0,-5 L0,6 M-4.6,0.5 L4.6,0.5" stroke="${GOLD[2]}" stroke-width="0.8"/>
      <path d="M-5,-5 L5,-5 L0,-10 Z" fill="url(#${I('gold')})" ${ol(1.1)}/>
      <rect x="-3.6" y="6" width="7.2" height="2" rx="0.8" fill="url(#${I('gold')})" ${ol(1)}/>
      <circle cx="0" cy="-11.2" r="1.3" fill="${GOLD[1]}" ${ol(0.8)}/>
    </g>`;
    return `<defs>
      ${lin(I('hull'), [[0, '#3c3349'], [0.35, '#262031'], [1, '#100c16']])}
      ${lin(I('qg'), [[0, '#3a3248'], [1, '#17121f']], 1, 0.4)}
      ${lin(I('sail'), [[0, '#4c4262'], [0.45, '#2c253a'], [1, '#16111f']], 1, 0.25)}
      ${lin(I('wood'), [[0, '#6a4a36'], [1, '#2e1d16']])}
      ${lin(I('mast'), [[0, '#6e4c36'], [0.5, '#4a3226'], [1, '#2a1b15']], 1, 0)}
      ${lin(I('gold'), [[0, GOLD[0]], [0.5, GOLD[1]], [1, GOLD[2]]])}
      ${lin(I('sk'), [[0, '#ff5a5e'], [0.55, '#e0303e'], [1, '#9a1424']])}
      ${lin(I('pen'), [[0, '#ff5f6d'], [1, '#b81e32']])}
      ${rad(I('port'), [[0, '#fff3c0'], [0.45, '#ffc04a'], [1, '#e0641c']])}
      ${rad(I('lamp'), [[0, '#fffbe0'], [0.6, '#ffd36e'], [1, '#f09a2a']])}
      ${glow(I('ph'), '#ffaa44')}
      ${glow(I('lg'), '#ffc76a')}
      <clipPath id="${I('hc')}"><path d="${HULL}"/></clipPath>
    </defs>
    <circle cx="17" cy="67" r="13" fill="url(#${I('lg')})"/>
    <circle cx="41" cy="76" r="10" fill="url(#${I('lg')})"/>
    <path d="M118,8 L62,31 M118,8 L172,18 M172,18 L232,64 M62,31 L12,79 M118,8 L94,105 M118,8 L144,105 M172,18 L152,100 M172,18 L196,96 M62,31 L44,88 M62,31 L82,103 M118,42 L172,46" stroke="#3a3050" stroke-width="0.9" fill="none"/>
    <path d="M192,99 L235,63" stroke="${OUT}" stroke-width="5.8" stroke-linecap="round"/><path d="M192,99 L235,63" stroke="url(#${I('mast')})" stroke-width="3.2" stroke-linecap="round"/>
    ${jibs}
    <rect x="60.2" y="29" width="3.8" height="64" rx="1.2" fill="url(#${I('mast')})" ${ol(1.4)}/>
    <rect x="116" y="6" width="4.4" height="102" rx="1.2" fill="url(#${I('mast')})" ${ol(1.5)}/>
    <rect x="170" y="16" width="4" height="86" rx="1.2" fill="url(#${I('mast')})" ${ol(1.4)}/>
    ${pennant(64, 31, 18, ph + 1, 2.2)}${pennant(120.5, 8, 30, ph, 3)}${pennant(174, 18, 22, ph + 2, 2.4)}
    ${sails}
    <path d="M109.5,13 L126.5,13 L125,22.5 L111,22.5 Z" fill="url(#${I('wood')})" ${ol(1.4)}/>
    <path d="M110,15.6 L126,15.6 M111,20 L125,20" stroke="${GOLD[1]}" stroke-width="1.1"/>
    <path d="M17,81 L17,74 M41,87 L41,83" ${ol(2.4)}/><path d="M17,81 L17,74 M41,87 L41,83" stroke="${GOLD[1]}" stroke-width="1.1"/>
    ${lantern(17, 67, 1.15)}${lantern(41, 76.5, 0.85)}
    <path d="${HULL}" fill="url(#${I('hull')})"/>
    <g clip-path="url(#${I('hc')})">
      <path d="${bandP(100, 112)}" fill="#7a1828"/>
      <path d="${bandP(109, 112)}" fill="#4e0f1c"/>
      <path d="${bandP(115, 127)}" fill="#2f2840"/>
      <path d="${bandP(133, 145)}" fill="#2a2338"/>
      <path d="${bandP(151, 163)}" fill="#221c2e"/>
      ${[113, 129, 147, 165].map((y, i) => `<path d="${poly(curve(y))}" stroke="${GOLD[2]}" stroke-width="${i ? 2.2 : 2.6}" fill="none"/><path d="${poly(curve(y - 0.5))}" stroke="${GOLD[i ? 1 : 0]}" stroke-width="${i ? 1.1 : 1.4}" fill="none"/>`).join('')}
      <path d="${poly(curve(172))}" stroke="#4a3a5a" stroke-width="1" fill="none"/>
      <rect x="0" y="177" width="240" height="30" fill="#17111f"/>
      <rect x="0" y="177" width="240" height="1.4" fill="#5a4a70" opacity="0.6"/>
      ${halos}
      <path d="M8,85 C24,87 46,91 65,94 L68,109 C96,113 140,113 165,108" stroke="#000" stroke-width="5" fill="none" opacity="0.25"/>
      <path d="M10,83 C22,85 45,89 65,92 M69,107 C96,111 140,111 165,106 L168,99 C180,98 192,97 201,97" stroke="#8a7aa6" stroke-width="1.3" fill="none" opacity="0.6"/>
      <path d="M12,104 C11,124 15,144 22,164" stroke="#6a5a86" stroke-width="1.6" fill="none" opacity="0.4"/>
    </g>
    ${ports}
    <path d="M14,93 L46,95 C48.5,105 48.5,118 46,129 C40,135 27,137 19,133 C15,120 13,106 14,93 Z" fill="url(#${I('qg')})" ${ol(1.8)}/>
    <path d="M13,91 L47,93.5 L46,97 L14,95 Z" fill="url(#${I('gold')})" ${ol(1.2)}/>
    ${[[21, 100], [29.5, 100.6], [38, 101.2]].map(([x, y]) => `<rect x="${x - 2.8}" y="${y}" width="5.6" height="7.4" rx="2.6" fill="url(#${I('port')})" ${ol(1.1)}/>`).join('')}
    <path d="M15,111 L47,112.6" stroke="${GOLD[1]}" stroke-width="1.5"/>
    ${[[22, 115], [30.5, 115.6], [39, 116.2]].map(([x, y]) => `<rect x="${x - 2.8}" y="${y}" width="5.6" height="7" rx="1.2" fill="url(#${I('port')})" ${ol(1.1)}/>`).join('')}
    <path d="M19,133 C25,138 37,137 45,130 L37,141 C33,144 27,144 24,141 Z" fill="url(#${I('gold')})" ${ol(1.2)}/>
    <circle cx="30.5" cy="145" r="1.8" fill="${GOLD[1]}" ${ol(1)}/>
    <path d="M9,80 C7,75 9,71 13,72 C15,73 15,76 13,77" fill="none" stroke="${OUT}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M9,80 C7,75 9,71 13,72 C15,73 15,76 13,77" fill="none" stroke="${GOLD[1]}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M65,89 L68,104" stroke="${GOLD[1]}" stroke-width="1.4"/>
    <path d="M9,80 C22,82 45,86 65,89 M68,104 C96,108 140,108 165,103 L168,96 C180,95 192,94 201,94 C208,97 213,103 216,111" stroke="${GOLD[1]}" stroke-width="1.5" fill="none"/>
    <path d="${HULL}" fill="none" ${ol(2.6)}/>
    <path d="M213,116 C219,112 222,106 221.5,100" stroke="${OUT}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M213,116 C219,112 222,106 221.5,100" stroke="url(#${I('gold')})" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M216.5,101 C216.5,95 227.5,94 228.5,100 C229.1,103 227.5,104.6 227.1,106.4 L221.5,107.4 C220.1,105.6 216.5,104.6 216.5,101 Z" fill="url(#${I('gold')})" ${ol(1.3)}/>
    <circle cx="224.1" cy="100.4" r="1.3" fill="${OUT}"/><path d="M227.1,103.2 L228.5,103.6" stroke="${OUT}" stroke-width="0.9"/>
    <path d="M222.1,95.4 C223.1,91.4 226.1,90 228.9,91 C227.1,92 226.1,93.6 225.9,95.6" fill="url(#${I('gold')})" ${ol(1)}/>
    <path d="M210,128 C213,122 215,119 213,116" stroke="${GOLD[1]}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  };
}
S.flag0 = { w: 240, h: 200, ax: 118, ay: 178, draw: flagship(0) };
S.flag1 = { w: 240, h: 200, ax: 118, ay: 178, draw: flagship(1) };

// ---------------------------------------------------------------- leviathan (head right, body trailing left, tail far left)
const LV = {
  hi: '#8fdce2', lt: '#5fb3c0', mid: '#468f9e', dk: '#2f6f7f', deep: '#1a4452',
  belly: ['#e2f6ea', '#a8d8cc'], fin: ['#6fd0da', '#2c7f90'], spine: '#c8fbff',
  glow: '#5ff0ff', core: '#eaffff', eye: ['#fffbd0', '#ffd84a', '#ff8a1a'], eyeGlow: '#ffd24a',
  mouth: ['#2a0718', '#7a1c3c'], tongue: '#e0647e', fang: ['#ffffff', '#d8d2c0'],
};
const rot = (p, c, a) => { const r = deg(a), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)]; };
// bioluminescent dot
const bio = (I, x, y, r) => `<circle cx="${x}" cy="${y}" r="${f1(r * 3)}" fill="url(#${I('bg')})"/><circle cx="${x}" cy="${y}" r="${r}" fill="${LV.core}"/>`;
const fang = (x, y, len, w, dir) => `<path d="M${f1(x - w)},${y} L${f1(x + w)},${y} L${f1(x + w * 0.2)},${f1(y + dir * len)} Z" fill="url(#FANG)" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>`;

function levHead(open) {
  return (I) => {
    const ua = open ? -18 : 0, la = open ? 11.5 : 4;          // upper / lower jaw angles
    const UC = [56, 31], LC = [34, 50];                      // jaw pivots
    const SKULL = 'M10,57 C4,51 2,41 5,31 C8,23 16,17.5 27,16 C38,14.5 49,16 57,20 C63,23 65,28 63,33 C61,38 57,42 51,45.5 C45,49 37,53 29,55.5 C22,57.5 15,59 10,57 Z';
    const SNOUT = 'M42,21 C56,19 72,24 85,30 C90.5,32.5 94,35.5 93.5,39 C93,41.5 90,42.5 86.5,42.5 C78,43 68,43.5 60,44.5 C52,45.5 44,47 38,47 Z';
    const JAW = 'M30,49 C42,47.5 60,47 74,47 C81,47 86,47.4 88.5,48.8 C89,51.5 85.5,54.5 79,56.5 C67,60 50,60.5 36,58 C30,57 25,55 25,52.5 Z';
    const HORN1 = 'M19,20 C14,13.8 9.5,9.4 5,5.6 C13,6.2 22.5,10.2 34,16.2 Z';
    const HORN2 = 'M7,29 C5.6,25.6 4.8,22.8 4.6,19 C8.2,20.8 11.6,22 16,22.6 Z';
    const FRILL = 'M33,46 C24,45.5 14,46.5 4.5,49 C9.5,51.6 10,55.4 7.6,60 C12.6,59.8 15.4,62.6 16.6,66.6 C21,61.6 25.6,58 32,55 Z';
    const U = `rotate(${ua} ${UC[0]} ${UC[1]})`, Lr = `rotate(${la} ${LC[0]} ${LC[1]})`;
    // mouth interior wedge between the jaw lines (in world space)
    const up = [[36, 47], [60, 44.5], [80, 43], [88, 42.6]].map(p => rot(p, UC, ua));
    const lo = [[84, 48], [74, 47.2], [56, 47.4], [36, 48.6]].map(p => rot(p, LC, la));
    const MOUTH = `M34,48 ${up.map(p => 'L' + pt(p)).join(' ')} L${pt(lo[0])} ${lo.slice(1).map(p => 'L' + pt(p)).join(' ')} Z`;
    const tongue = (() => { const a = rot([46, 49], LC, la), b = rot([74, 48.5], LC, la), c = rot([62, 51], LC, la), d = rot([44, 52], LC, la); return `M${pt(a)} Q${pt(rot([62, 44.5], LC, la))} ${pt(b)} Q${pt(c)} ${pt(d)} Z`; })();
    const outl = d => `<path d="${d}" fill="${OUT}" stroke="${OUT}" stroke-width="4.6" stroke-linejoin="round"/>`;
    return `<defs>
      <linearGradient id="${I('g')}" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="60"><stop offset="0" stop-color="${LV.hi}"/><stop offset="0.3" stop-color="${LV.lt}"/><stop offset="0.7" stop-color="${LV.mid}"/><stop offset="1" stop-color="${LV.dk}"/></linearGradient>
      ${lin(I('horn'), [[0, '#eafcff'], [0.5, '#9fd8de'], [1, '#3d7e8c']], 1, 1)}
      ${lin(I('fin'), [[0, LV.fin[0]], [1, LV.fin[1]]], 1, 0.4)}
      ${lin(I('bel'), [[0, LV.belly[0]], [1, LV.belly[1]]])}
      ${lin(I('mo'), [[0, LV.mouth[0]], [1, LV.mouth[1]]], 1, 0)}
      ${lin(I('fang'), [[0, LV.fang[0]], [1, LV.fang[1]]])}
      ${rad(I('eye'), [[0, LV.eye[0]], [0.5, LV.eye[1]], [1, LV.eye[2]]], 0.45, 0.45, 0.6)}
      ${glow(I('eg'), LV.eyeGlow)}${glow(I('bg'), LV.glow)}
      <clipPath id="${I('jc')}"><path d="${JAW}"/></clipPath>
      <clipPath id="${I('kc')}"><path d="${SKULL}"/></clipPath>
    </defs>
    <g transform="translate(14 40) scale(0.95) translate(-14 -40)">
    ${outl(FRILL)}${outl(HORN2)}${outl(HORN1)}${outl(MOUTH)}
    <g transform="${Lr}">${outl(JAW)}</g>
    ${outl(SKULL)}
    <g transform="${U}">${outl(SNOUT)}</g>
    <path d="${FRILL}" fill="url(#${I('fin')})"/>
    <path d="M32,48 L6.5,49.4 M32,50.5 L9,59 M32,53 L16.2,65" stroke="${LV.spine}" stroke-width="1.3" stroke-linecap="round" opacity="0.75"/>
    ${bio(I, 6.5, 49.4, 1.1)}${bio(I, 9, 59, 1.1)}${bio(I, 16.2, 65, 1.1)}
    <path d="${HORN2}" fill="url(#${I('horn')})"/>
    <path d="${HORN1}" fill="url(#${I('horn')})"/>
    <path d="M28,13.6 C20,9.8 14,7.6 8.4,6.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="M14,11.2 L17.5,14.4 M19.5,9.8 L22.6,13.6 M9.6,9.4 L12.2,11.6" stroke="#3d7e8c" stroke-width="0.9" opacity="0.7"/>
    <path d="${MOUTH}" fill="url(#${I('mo')})"/>
    <path d="${tongue}" fill="${LV.tongue}" stroke="${OUT}" stroke-width="0.9"/>
    <g transform="${Lr}">
      <path d="${JAW}" fill="url(#${I('g')})"/>
      <g clip-path="url(#${I('jc')})"><path d="M20,53.5 C44,55.5 66,54 92,50 L92,64 L20,64 Z" fill="url(#${I('bel')})"/>
        <path d="M40,55.4 L41,59 M48,55.6 L49,60 M56,55.4 L57,60 M64,54.6 L65,59 M72,53.4 L73,57.6" stroke="${LV.belly[1]}" stroke-width="0.9"/></g>
      ${bio(I, 50, 52.2, 1.1)}${bio(I, 60, 51.6, 1.1)}${bio(I, 70, 50.8, 1)}
      ${fang(80, 47.6, 5.5, 1.5, -1).replace('url(#FANG)', `url(#${I('fang')})`)}${fang(68, 47.4, 4.4, 1.3, -1).replace('url(#FANG)', `url(#${I('fang')})`)}${fang(57, 47.6, 3.6, 1.1, -1).replace('url(#FANG)', `url(#${I('fang')})`)}
    </g>
    <g transform="${U}">
      <path d="${SNOUT}" fill="url(#${I('g')})"/>
      ${fang(85, 42.4, 7.4, 1.8, 1).replace('url(#FANG)', `url(#${I('fang')})`)}${fang(74, 43, 5.2, 1.4, 1).replace('url(#FANG)', `url(#${I('fang')})`)}${fang(63, 44, 4.4, 1.2, 1).replace('url(#FANG)', `url(#${I('fang')})`)}
      <path d="M86,33.6 C87.6,32.6 89.4,32.8 90.4,34" stroke="${OUT}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M62,24.4 C66,23.6 70,24.6 73,26 M70,28.6 C73.5,28 77,29.2 79.6,30.8" stroke="${LV.dk}" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.7"/>
      <path d="M60,24.6 C69,24.2 77,27 84,31" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.4"/>
      ${bio(I, 78, 37.6, 1)}${bio(I, 70, 39, 1)}
      <path d="M90,40.6 C88,41.4 84,41.8 80,42" stroke="${LV.dk}" stroke-width="1" fill="none" opacity="0.6"/>
    </g>
    <path d="${SKULL}" fill="url(#${I('g')})"/>
    <g clip-path="url(#${I('kc')})">
      <path d="${SKULL}" transform="translate(-5 -4)" fill="none" stroke="${LV.deep}" stroke-width="9" opacity="0.3"/>
    </g>
    <path d="M57.5,22 C62,26 63,31 61,35.5" stroke="${LV.dk}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="${open ? 0.9 : 0.55}"/>
    <path d="M6,42 C4,32 9,22 20,18.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.38"/>
    ${bio(I, 16, 37.5, 1.3)}${bio(I, 24, 38.6, 1.4)}${bio(I, 32, 39.6, 1.3)}${bio(I, 39.5, 40.2, 1.1)}
    <circle cx="50" cy="29" r="10" fill="url(#${I('eg')})"/>
    <path d="M41.5,28.4 C44.5,24.2 52.5,23.6 57.6,28.8 C53,32.6 46,32.8 41.5,28.4 Z" fill="url(#${I('eye')})" ${ol(1.4)}/>
    <ellipse cx="${open ? 50.4 : 50}" cy="28.6" rx="${open ? 0.9 : 1.3}" ry="3.4" fill="${OUT}"/>
    <circle cx="47.2" cy="27" r="1.1" fill="#fff"/>
    <path d="M37.5,24.6 C43,${open ? 17.6 : 18.6} 54,${open ? 18.4 : 19.6} 61.5,${open ? 25 : 26.4} L58,${open ? 26.6 : 27.6} C52.5,${open ? 22.6 : 23.8} 45,${open ? 22.4 : 23.4} 40,${open ? 26.6 : 27}  Z" fill="${LV.mid}"/>
    <path d="M40,${open ? 26.6 : 27} C45,${open ? 22.4 : 23.4} 52.5,${open ? 22.6 : 23.8} 58,${open ? 26.6 : 27.6} L61.5,${open ? 25 : 26.4}" fill="none" ${ol(1.6)}/>
    <path d="M40.5,22.6 C46,18.6 53,19 58,22.6" stroke="${LV.hi}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7"/>
    </g>`;
  };
}
S.levHead = { w: 96, h: 70, ax: 14, ay: 40, pts: { mouth: [80, 46], eye: [48, 30] }, draw: levHead(false) };
S.levHead_open = { w: 96, h: 70, ax: 14, ay: 40, pts: { mouth: [79, 45], eye: [48, 30] }, draw: levHead(true) };

// body segment: round, dorsal fin growing out of its top (swept back = left), lighter belly; seamless chain outline
S.levBody = {
  w: 54, h: 54, ax: 27, ay: 27, draw: (I) => {
    const cx = 27, cy = 27, r = 17;
    const A = a => [cx + r * Math.cos(deg(a)), cy - r * Math.sin(deg(a))];
    const FIN = `M${pt(A(58))} C33,9.5 25,5.8 13.5,5 C17.5,8 19.5,11 ${pt(A(124))} Z`;
    const top = `M${pt(A(146))} A${r},${r} 0 0 1 ${pt(A(34))}`;
    const bot = `M${pt(A(214))} A${r},${r} 0 0 0 ${pt(A(326))}`;
    return `<defs>
      ${lin(I('g'), [[0, LV.hi], [0.3, LV.lt], [0.7, LV.mid], [1, LV.dk]])}
      ${lin(I('fin'), [[0, LV.fin[0]], [1, LV.fin[1]]], 0.3, 1)}
      ${lin(I('bel'), [[0, LV.belly[0]], [1, LV.belly[1]]])}
      ${glow(I('bg'), LV.glow)}
      <linearGradient id="${I('o')}" gradientUnits="userSpaceOnUse" x1="${cx - r}" y1="0" x2="${cx + r}" y2="0">
        <stop offset="0.08" stop-color="${OUT}" stop-opacity="0"/><stop offset="0.24" stop-color="${OUT}"/><stop offset="0.76" stop-color="${OUT}"/><stop offset="0.92" stop-color="${OUT}" stop-opacity="0"/></linearGradient>
      <clipPath id="${I('c')}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    </defs>
    <path d="${FIN}" fill="${OUT}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="${FIN}" fill="url(#${I('fin')})"/>
    <path d="M27,11.5 C24,8 19.5,6.2 15,5.4 M31,12 C29,9.6 26,8 22.4,7" stroke="${LV.spine}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="0.8"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${I('g')})"/>
    <g clip-path="url(#${I('c')})">
      <rect x="0" y="${cy + 6}" width="54" height="20" fill="url(#${I('bel')})"/>
      <rect x="0" y="${cy + 6}" width="54" height="1.2" fill="#fff" opacity="0.5"/>
      ${[16, 22, 28, 34, 40].map(x => `<path d="M${x},${cy + 8} L${x},${cy + 17}" stroke="${LV.belly[1]}" stroke-width="0.9"/>`).join('')}
      <rect x="0" y="${cy - r * 0.78}" width="54" height="3" fill="#fff" opacity="0.22"/>
      <path d="M8,${cy - 1} L46,${cy - 1}" stroke="${LV.dk}" stroke-width="1" opacity="0.35"/>
    </g>
    <path d="${top}" fill="none" stroke="url(#${I('o')})" stroke-width="2.4" stroke-linecap="round"/>
    <path d="${bot}" fill="none" stroke="url(#${I('o')})" stroke-width="2.4" stroke-linecap="round"/>
    ${bio(I, 20, cy - 5, 1.5)}${bio(I, 33, cy - 5, 1.5)}${bio(I, 27, cy + 2.5, 1)}`;
  },
};

// tail: joint on the right (x=72), tail fin pointing left
S.levTail = {
  w: 80, h: 46, ax: 72, ay: 23, draw: (I) => {
    const BODY = 'M72,10.5 C62,11.5 50,15 34,19 L34,28.5 C50,31 62,34.5 72,35.5 A6,12.5 0 0 0 72,10.5 Z';
    const SPIKE = 'M58,14.2 C54,9.5 49,7.2 43,6.6 C46,9.4 47.5,12.6 47.6,16.6 Z';
    const FIN = 'M37,19.5 C28,15 17,9 5,3.6 C9,10 12,16 15,23.5 C12,31 9,36 5,42.4 C17,37 28,31.6 37,28 Z';
    return `<defs>
      ${lin(I('g'), [[0, LV.hi], [0.3, LV.lt], [0.7, LV.mid], [1, LV.dk]])}
      ${lin(I('fin'), [[0, LV.fin[0]], [1, LV.fin[1]]], 1, 0.5)}
      ${lin(I('bel'), [[0, LV.belly[0]], [1, LV.belly[1]]])}
      ${glow(I('bg'), LV.glow)}
      <linearGradient id="${I('o')}" gradientUnits="userSpaceOnUse" x1="66" y1="0" x2="77" y2="0"><stop offset="0" stop-color="${OUT}"/><stop offset="1" stop-color="${OUT}" stop-opacity="0"/></linearGradient>
      <clipPath id="${I('c')}"><path d="${BODY}"/></clipPath>
      <clipPath id="${I('fc')}"><path d="${FIN}"/></clipPath>
    </defs>
    <path d="${FIN}" fill="${OUT}" stroke="${OUT}" stroke-width="4.2" stroke-linejoin="round"/>
    <path d="${SPIKE}" fill="${OUT}" stroke="${OUT}" stroke-width="3.6" stroke-linejoin="round"/>
    <path d="${BODY}" fill="none" stroke="url(#${I('o')})" stroke-width="4.4" stroke-linejoin="round"/>
    <path d="${FIN}" fill="url(#${I('fin')})"/>
    <g clip-path="url(#${I('fc')})">
      <path d="M38,22 L8,6 M38,23 L12,13 M38,24 L15,23.5 M38,25 L12,34 M38,26 L8,41" stroke="${LV.spine}" stroke-width="1.1" opacity="0.75"/>
      <path d="M5,3.6 C9,10 12,16 15,23.5 C12,31 9,36 5,42.4" stroke="${LV.glow}" stroke-width="2" fill="none" opacity="0.55"/>
    </g>
    ${bio(I, 8.5, 6.6, 1)}${bio(I, 13.5, 16, 0.9)}${bio(I, 13.5, 31, 0.9)}${bio(I, 8.5, 40, 1)}
    <path d="${SPIKE}" fill="url(#${I('fin')})"/>
    <path d="M55,13.6 C52,10.6 49,8.8 45.5,7.8" stroke="${LV.spine}" stroke-width="1" fill="none" opacity="0.8"/>
    <path d="${BODY}" fill="url(#${I('g')})"/>
    <g clip-path="url(#${I('c')})">
      <path d="M30,26.5 C46,27.6 60,29.6 80,29 L80,40 L30,40 Z" fill="url(#${I('bel')})"/>
      <path d="M44,28.6 L44,33 M52,29.6 L52,34.4 M60,30.4 L60,35.4 M68,30.4 L68,36" stroke="${LV.belly[1]}" stroke-width="0.9"/>
      <path d="M36,19.6 C50,15.6 62,12.6 78,12.6" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.35"/>
    </g>
    <path d="M34,19 C50,15 62,11.5 72,10.5 A6,12.5 0 0 1 72,35.5 C62,34.5 50,31 34,28.5" fill="none" stroke="url(#${I('o')})" stroke-width="2.2" stroke-linejoin="round"/>
    ${bio(I, 46, 20.6, 1.2)}${bio(I, 57, 19.4, 1.3)}${bio(I, 67, 19, 1.3)}`;
  },
};

// ---------------------------------------------------------------- eclipse demon (orb with corona, horns, grin and an empty socket)
// flame tongues around a circle (polar-mapped so they follow the curve). Returns one subpath per tongue.
function flames(cx, cy, r0, n, off, lens, w, lean) {
  const bz = (t, p0, p1, p2, p3) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = deg(-90 + off + (i * 360) / n), up = -Math.sin(a);
    const L = lens[i % lens.length] * (1 + 0.28 * up), sd = -lean * Math.cos(a) + (i % 3 === 1 ? lean * 0.5 : 0);
    // leaning tongue with a hooked tip: convex outer edge, concave inner edge
    const k = sd >= 0 ? 1 : -1, tip = [L, sd + k * w * 0.35];
    const segs = [
      [[-2, -k * w], [L * 0.42, -k * w * 1.3], [L * 0.8, -k * w * 0.1 + sd * 0.6], tip],
      [tip, [L * 0.78, sd * 0.3 + k * w * 0.05], [L * 0.5, k * w * 0.15], [L * 0.3, k * w * 0.55]],
      [[L * 0.3, k * w * 0.55], [L * 0.18, k * w * 0.85], [L * 0.05, k * w * 1.05], [-2, k * w]],
    ];
    const pts = [];
    segs.forEach((sg, j) => { for (let q = j ? 1 : 0; q <= 10; q++) pts.push(bz(q / 10, ...sg)); });
    pts.pop();
    const m = pts.map(([u, v]) => { const r = r0 + u, aa = a + v / r; return [cx + Math.cos(aa) * r, cy + Math.sin(aa) * r]; });
    out.push(poly(m) + ' Z');
  }
  return out;
}
function eclipse(fr) {
  return (I) => {
    const C = 65, R = 35;
    const LO = fr ? [21, 15, 19, 13, 21, 16, 18, 14] : [16, 21, 14, 20, 15, 21, 13, 19];
    const LI = fr ? [10, 13, 9, 12, 10, 13, 8, 11] : [12, 9, 13, 10, 11, 8, 13, 10];
    const outer = flames(C, C, R - 1, 15, fr ? 7 : 0, LO, 10.5, fr ? 6 : 4.5);
    const inner = flames(C, C, R - 1, 15, fr ? 19 : 12, LI, 7, fr ? 4.5 : 6);
    const embers = (fr ? [[16, 40, 2.4, -30], [113, 86, 2, 25], [30, 100, 1.8, -40]] : [[113, 42, 2.3, 30], [17, 84, 2, -25], [101, 103, 1.8, 40]])
      .map(([x, y, r, a]) => `<path d="M${x},${y - r * 2.4} C${x + r},${y - r} ${x + r},${y + r} ${x},${y + r} C${x - r},${y + r} ${x - r},${y - r} ${x},${y - r * 2.4} Z" transform="rotate(${a} ${x} ${y})" fill="#b06aff" stroke="${OUT}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.45)}" fill="#f4dcff"/>`).join('');
    const HORN = 'M90.4,49.1 C104,40 111,26 106.5,6.5 C100.5,17 90,26 71.2,35.7 Z';
    const top = [[33, 66], [45, 79.5], [85, 79.5], [97, 66]], bot = [[97, 66], [90, 103], [40, 103], [33, 66]];
    const MOUTH = `M${pt(top[0])} C${pt(top[1])} ${pt(top[2])} ${pt(top[3])} C${pt(bot[1])} ${pt(bot[2])} ${pt(bot[3])} Z`;
    const qb = (t, P) => { const u = 1 - t; return [0, 1].map(k => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
    const teeth = (P, ws, t0, t1, lens, dir) => {
      const r = [], tot = ws.reduce((x, y) => x + y, 0);
      let t = t0;
      ws.forEach((w, i) => {
        const span = ((t1 - t0) * w) / tot, ta = t + span * 0.08, tb = t + span * 0.92, tm = (ta + tb) / 2 + span * 0.08;
        const A = qb(ta, P), B = qb(tb, P), M = qb(tm, P);
        r.push(`M${pt(A)} L${f1(M[0])},${f1(M[1] + dir * lens[i])} L${pt(B)} Z`);
        t += span;
      });
      return r;
    };
    const up = teeth(top, [0.8, 1.1, 0.9, 1.3, 1, 1.25, 0.85, 1.1, 0.8], 0.05, 0.96, [4, 6.4, 4.6, 7.6, 5.2, 7.4, 4.4, 6.2, 3.8], 1);
    const lo = teeth(bot, [0.9, 1.2, 1, 1.3, 0.9, 1.2, 0.9], 0.08, 0.94, [4.2, 6, 4.4, 6.8, 4.6, 5.8, 4], -1);
    const coG = (id, stops) => `<radialGradient id="${I(id)}" gradientUnits="userSpaceOnUse" cx="${C}" cy="${C}" r="62">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
    return `<defs>
      ${rad(I('halo'), [[0.45, '#b46cff', 0.6], [0.72, '#7a2cd8', 0.25], [1, '#5a1aa8', 0]])}
      ${coG('co', [[0.5, '#3a1278'], [0.72, '#7a2ad8'], [0.95, '#c78cff']])}
      ${coG('ci', [[0.52, '#b36cff'], [0.7, '#e2b2ff'], [0.85, '#fff0ff']])}
      ${rad(I('orb'), [[0, '#221232'], [0.7, '#0c0614'], [0.93, '#1a0c2c'], [1, '#2e1450']], 0.42, 0.38, 0.62)}
      <linearGradient id="${I('horn')}" gradientUnits="userSpaceOnUse" x1="106" y1="8" x2="80" y2="44"><stop offset="0" stop-color="#f6ecff"/><stop offset="0.3" stop-color="#b698e0"/><stop offset="0.68" stop-color="#4a2a6e"/><stop offset="1" stop-color="#140a20"/></linearGradient>
      ${lin(I('brow'), [[0, '#5a3a86'], [1, '#160b24']])}
      ${rad(I('sock'), [[0, '#000'], [0.7, '#040108'], [1, '#2a0f44']], 0.5, 0.4, 0.62)}
      ${rad(I('mo'), [[0, '#ffd0ec'], [0.3, '#ff4f9e'], [0.7, '#b0145e'], [1, '#3a0624']], 0.5, 0.45, 0.6)}
      ${lin(I('tooth'), [[0, '#ffffff'], [1, '#efc6ff']])}
      ${glow(I('mg'), '#ff4fa8')}
      <clipPath id="${I('oc')}"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
      <clipPath id="${I('mc')}"><path d="${MOUTH}"/></clipPath>
    </defs>
    <circle cx="${C}" cy="${C}" r="62" fill="url(#${I('halo')})"/>
    ${outer.map(d => `<path d="${d}" fill="${OUT}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>`).join('')}
    ${outer.map(d => `<path d="${d}" fill="url(#${I('co')})"/>`).join('')}
    ${inner.map(d => `<path d="${d}" fill="url(#${I('ci')})" opacity="0.92"/>`).join('')}
    ${embers}
    <path d="${HORN}" fill="${OUT}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="${HORN}" transform="translate(130 0) scale(-1 1)" fill="${OUT}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="${C}" cy="${C}" r="${R}" fill="${OUT}" stroke="${OUT}" stroke-width="5.2"/>
    <circle cx="${C}" cy="${C}" r="${R}" fill="url(#${I('orb')})"/>
    <g clip-path="url(#${I('oc')})">
      <circle cx="${C}" cy="${C}" r="${R - 1}" fill="none" stroke="#d6a8ff" stroke-width="2.4" opacity="0.85"/>
      <circle cx="${C}" cy="${C}" r="${R - 3.6}" fill="none" stroke="#9a5cff" stroke-width="2" opacity="0.3"/>
    </g>
    ${[0, 1].map(m => `<g ${m ? 'transform="translate(130 0) scale(-1 1)"' : ''}>
      <path d="${HORN}" fill="url(#${I('horn')})"/>
      <path d="M96,39 C103,32 106.6,23 105.8,12" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="${m ? 0.3 : 0.6}"/>
      <path d="M86,31.6 C90,32.8 94,35.6 96.4,39.4 M92.4,25.6 C96.2,26.6 99.6,29.2 101.6,32.6 M98,18.4 C100.8,19.4 103,21.4 104.4,24" stroke="#2a1640" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="0.6"/>
    </g>`).join('')}
    <ellipse cx="${C}" cy="54.6" rx="22.5" ry="15" fill="#2a1240" opacity="0.55"/>
    <ellipse cx="${C}" cy="54" rx="20.5" ry="13" fill="url(#${I('sock')})" ${ol(2)}/>
    <path d="M47,60 C53,66.4 77,66.4 83,60" stroke="#8a4ae8" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>
    ${[0, 1].map(m => `<g ${m ? 'transform="translate(130 0) scale(-1 1)"' : ''}>
      <path d="M91.5,35.5 C84,37.5 74,41 66.2,46.6 C74.5,44.6 83.5,43.6 92.5,42.6 C93.4,40 93,37.4 91.5,35.5 Z" fill="url(#${I('brow')})" ${ol(1.5)}/>
      <path d="M90.4,37.4 C83,39.2 75,42 69,45.4" stroke="#c49aff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="${m ? 0.5 : 0.8}"/>
    </g>`).join('')}
    <ellipse cx="${C}" cy="85" rx="36" ry="18" fill="url(#${I('mg')})" opacity="0.5"/>
    <path d="${MOUTH}" fill="url(#${I('mo')})"/>
    <g clip-path="url(#${I('mc')})">
      ${up.concat(lo).map(d => `<path d="${d}" fill="#ffc8ff" stroke="#ffc8ff" stroke-width="3" stroke-linejoin="round" opacity="0.3"/>`).join('')}
      ${up.concat(lo).map(d => `<path d="${d}" fill="url(#${I('tooth')})" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>`).join('')}
    </g>
    <path d="${MOUTH}" fill="none" ${ol(2)}/>
    <path d="M32,61.4 L35.2,66.6 M98,61.4 L94.8,66.6" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/>`;
  };
}
S.eclipse0 = { w: 130, h: 130, ax: 65, ay: 65, pts: { socket: [65, 54], mouth: [65, 85] }, draw: eclipse(0) };
S.eclipse1 = { w: 130, h: 130, ax: 65, ay: 65, pts: { socket: [65, 54], mouth: [65, 85] }, draw: eclipse(1) };
S.eclEye = {
  w: 36, h: 24, ax: 18, ay: 12, draw: (I) => `<defs>
      ${rad(I('h'), [[0, '#ff2a3a', 0.7], [0.55, '#ff1a2a', 0.25], [1, '#ff1a2a', 0]])}
      ${rad(I('e'), [[0, '#ffe2b0'], [0.3, '#ff6a4a'], [0.7, '#e01a2a'], [1, '#7a0014']], 0.5, 0.5, 0.55)}
      <clipPath id="${I('c')}"><path d="M5,12 C10,4 26,4 31,12 C26,20 10,20 5,12 Z"/></clipPath>
    </defs>
    <ellipse cx="18" cy="12" rx="16" ry="9.5" fill="url(#${I('h')})"/>
    <path d="M5,12 C10,4 26,4 31,12 C26,20 10,20 5,12 Z" fill="url(#${I('e')})" ${ol(1.6)}/>
    <g clip-path="url(#${I('c')})">
      <path d="M5,9 C10,5 26,5 31,9 L31,4 L5,4 Z" fill="#5a000e" opacity="0.45"/>
      <ellipse cx="18" cy="12" rx="4.2" ry="7.6" fill="#ff2a2a" opacity="0.5"/>
      <ellipse cx="18" cy="12" rx="2" ry="7.2" fill="${OUT}"/>
      <ellipse cx="13.4" cy="9.4" rx="2.2" ry="1.4" fill="#fff" opacity="0.9"/>
      <circle cx="22.6" cy="15" r="0.9" fill="#fff" opacity="0.55"/>
    </g>`,
};

module.exports = { S };
