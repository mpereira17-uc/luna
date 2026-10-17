// Shared helpers for the sprite sources. Every sprite is an SVG drawn in "design units"
// (1 unit = 1 CSS px when the game's scale u = 1) and rasterised at R× into an atlas.
const OUT = '#1c1430';

// stroke attributes for the cartoon outline
const ol = (w = 2) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
// a fat limb: dark outline stroke under a coloured stroke (reads as an outlined tube)
const limb = (d, col, w, o = 1.6) => `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + o * 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const glow = (id, col) => rad(id, [[0, col, 0.85], [0.35, col, 0.35], [1, col, 0]]);

// small skull used on sails and flags (centered at x,y, size s)
const skull = (x, y, s, col = '#f3ead2', dark = OUT) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-7,6 L7,-6 M-7,-6 L7,6" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M-5,-1 C-5,-6 5,-6 5,-1 C5,2 3,3 3,4.5 L-3,4.5 C-3,3 -5,2 -5,-1 Z" fill="${col}"/>
    <circle cx="-2" cy="-1" r="1.4" fill="${dark}"/><circle cx="2" cy="-1" r="1.4" fill="${dark}"/>
  </g>`;

module.exports = { OUT, ol, limb, lin, rad, glow, skull };
