// Rasterises the sprite sources into atlases (PNG + JSON) and preview sheets.
// usage: node art/build.js preview <group> [scale] [name,name]  -> art/out/preview-<group>.png (optionally only those sprites)
//        node art/build.js atlas                     -> art/out/<atlas>.png, .webp and .json for every atlas, plus atlas.js,
//                                                       and copies atlas.js and the .webp sheets into web/ for the game
// The game loads the .webp atlases (4x smaller than PNG); the PNGs are kept for editing and review.
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out');
const WEB = path.join(__dirname, '..', 'web');
fs.mkdirSync(OUT, { recursive: true });

const groups = {
  units: () => require('./units').S,
  bosses: () => require('./bosses').S,
  fx: () => require('./fx').S,
  world: () => require('./world').S,
  icons: () => require('./icons').S,
  comic: () => require('./comic').S,
};
// which groups go in which atlas, and at what resolution
const ATLASES = [
  { name: 'sprites', groups: ['units', 'bosses', 'fx'], R: 3, width: 2048 },
  { name: 'world', groups: ['world'], R: 2.5, width: 2048 },
  { name: 'icons', groups: ['icons'], R: 2.5, width: 2048 },
  { name: 'comic', groups: ['comic'], R: 2.5, width: 2048 },   // intro comic panels, shown as CSS backgrounds only
];

function svgOf(name, sp, R) {
  const I = k => `${name}__${k}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(sp.w * R)}" height="${Math.ceil(sp.h * R)}" viewBox="0 0 ${sp.w} ${sp.h}" overflow="visible">${sp.draw(I)}</svg>`;
}

// simple shelf packer (tallest first)
function pack(items, width, pad = 3) {
  items.sort((a, b) => b.ph - a.ph || b.pw - a.pw);
  let x = pad, y = pad, rowH = 0;
  for (const it of items) {
    if (x + it.pw + pad > width) { x = pad; y += rowH + pad; rowH = 0; }
    it.x = x; it.y = y; x += it.pw + pad; rowH = Math.max(rowH, it.ph);
  }
  return y + rowH + pad;
}

(async () => {
  const [, , cmd = 'preview', group = 'units', scaleArg, only] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage();
  if (cmd === 'preview') {
    const S = groups[group]();
    const R = +(scaleArg || 4);
    const names = Object.keys(S).filter(n => !only || only.split(',').includes(n));
    const cells = names.map(n => `<div style="display:inline-flex;flex-direction:column;align-items:center;margin:6px;vertical-align:top;font:11px sans-serif;color:#9ab">
      <div style="position:relative;background:linear-gradient(#16264a,#0d1830);outline:1px dashed #2c3f6a">${svgOf(n, S[n], R)}
      <div style="position:absolute;left:${S[n].ax * R - 3}px;top:${S[n].ay * R - 3}px;width:6px;height:6px;border-radius:50%;background:#ff3d71"></div></div>${n}</div>`).join('');
    await p.setViewportSize({ width: 1600, height: 900 });
    await p.setContent(`<body style="margin:0;padding:8px;background:#0a1124">${cells}</body>`);
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/preview-${group}.png`, fullPage: true });
    console.log('preview', group, names.length, 'sprites');
  } else {
    const all = {};
    for (const A of ATLASES) {
      const items = [];
      for (const g of A.groups) { const S = groups[g](); for (const n in S) items.push({ n, sp: S[n], pw: Math.ceil(S[n].w * A.R), ph: Math.ceil(S[n].h * A.R) }); }
      const H = pack(items, A.width);
      const html = items.map(it => `<div style="position:absolute;left:${it.x}px;top:${it.y}px">${svgOf(it.n, it.sp, A.R)}</div>`).join('');
      await p.setViewportSize({ width: A.width, height: H });
      await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`);
      await p.waitForTimeout(300);
      await p.screenshot({ path: `${OUT}/${A.name}.png`, omitBackground: true, clip: { x: 0, y: 0, width: A.width, height: H } });
      const png = fs.readFileSync(`${OUT}/${A.name}.png`).toString('base64');
      const webp = await p.evaluate(async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.toDataURL('image/webp', 0.88).split(',')[1];
      }, png);
      fs.writeFileSync(`${OUT}/${A.name}.webp`, Buffer.from(webp, 'base64'));
      const frames = {}, pts = {};
      for (const it of items) { frames[it.n] = [it.x, it.y, it.pw, it.ph, +(it.sp.ax * A.R).toFixed(1), +(it.sp.ay * A.R).toFixed(1)]; if (it.sp.pts) pts[it.n] = it.sp.pts; }
      all[A.name] = { R: A.R, w: A.width, h: H, frames, pts };
      fs.writeFileSync(`${OUT}/${A.name}.json`, JSON.stringify(all[A.name]));
      console.log('atlas', A.name, `${A.width}x${H}`, items.length, 'sprites');
    }
    // frame tables for the game, loaded next to the atlas images
    fs.writeFileSync(`${OUT}/atlas.js`, `window.LUNA_ATLAS=${JSON.stringify(all)};\n`);
    if (fs.existsSync(WEB)) for (const f of ['atlas.js', ...ATLASES.map(A => `${A.name}.webp`)]) fs.copyFileSync(`${OUT}/${f}`, path.join(WEB, f));
  }
  await b.close();
})();
