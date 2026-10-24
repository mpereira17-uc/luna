// Rasterises this game's own sprites (mar.js) into the "mar" atlas, next to the original Luna's atlases.
// usage: node art/build.js preview [scale]   -> art/out/preview.png
//        node art/build.js atlas             -> lib/mar.webp and lib/mar.js (adds LUNA_ATLAS.mar), and art/out/mar.png
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out'), LIB = path.join(__dirname, '..', 'lib');
fs.mkdirSync(OUT, { recursive: true });
const S = require('./mar').S, R = 3, WIDTH = 2048;
const svgOf = (name, sp, r) => `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(sp.w * r)}" height="${Math.ceil(sp.h * r)}" viewBox="0 0 ${sp.w} ${sp.h}" overflow="visible">${sp.draw(k => `${name}__${k}`)}</svg>`;
function pack(items, width, pad = 3) {
  items.sort((a, b) => b.ph - a.ph || b.pw - a.pw);
  let x = pad, y = pad, rowH = 0;
  for (const it of items) { if (x + it.pw + pad > width) { x = pad; y += rowH + pad; rowH = 0; } it.x = x; it.y = y; x += it.pw + pad; rowH = Math.max(rowH, it.ph); }
  return y + rowH + pad;
}
(async () => {
  const [, , cmd = 'preview', scaleArg] = process.argv;
  const b = await chromium.launch(), p = await b.newPage();
  if (cmd === 'preview') {
    const r = +(scaleArg || 3);
    const cells = Object.keys(S).map(n => `<div style="display:inline-flex;flex-direction:column;align-items:center;margin:8px;vertical-align:top;font:12px sans-serif;color:#9ab">
      <div style="position:relative;background:linear-gradient(#123a4a,#0a2030);outline:1px dashed #2c3f6a">${svgOf(n, S[n], r)}
      <div style="position:absolute;left:${S[n].ax * r - 3}px;top:${S[n].ay * r - 3}px;width:6px;height:6px;border-radius:50%;background:#ff3d71"></div></div>${n}</div>`).join('');
    await p.setViewportSize({ width: 1600, height: 900 });
    await p.setContent(`<body style="margin:0;padding:8px;background:#0a1124">${cells}</body>`);
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/preview.png`, fullPage: true });
  } else {
    const items = Object.keys(S).map(n => ({ n, sp: S[n], pw: Math.ceil(S[n].w * R), ph: Math.ceil(S[n].h * R) }));
    const H = pack(items, WIDTH);
    await p.setViewportSize({ width: WIDTH, height: H });
    await p.setContent(`<body style="margin:0;background:transparent">${items.map(it => `<div style="position:absolute;left:${it.x}px;top:${it.y}px">${svgOf(it.n, it.sp, R)}</div>`).join('')}</body>`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/mar.png`, omitBackground: true, clip: { x: 0, y: 0, width: WIDTH, height: H } });
    const png = fs.readFileSync(`${OUT}/mar.png`).toString('base64');
    const webp = await p.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.9).split(',')[1];
    }, png);
    fs.writeFileSync(`${LIB}/mar.webp`, Buffer.from(webp, 'base64'));
    const frames = {};
    for (const it of items) frames[it.n] = [it.x, it.y, it.pw, it.ph, +(it.sp.ax * R).toFixed(1), +(it.sp.ay * R).toFixed(1)];
    fs.writeFileSync(`${LIB}/mar.js`, `(window.LUNA_ATLAS = window.LUNA_ATLAS || {}).mar = ${JSON.stringify({ R, w: WIDTH, h: H, frames, pts: {} })};\n`);
    console.log('atlas mar', `${WIDTH}x${H}`, items.length, 'sprites');
  }
  await b.close();
})();
