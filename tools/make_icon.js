// Draws the launcher icon from the game's own sprites: the full moon over a night sea with its reflection.
// usage: node tools/make_icon.js  -> app/src/main/res/mipmap-*/ic_launcher{,_round,_foreground,_background}.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), lib = path.join(root, 'game', 'lib'), res = path.join(root, 'app', 'src', 'main', 'res');
const D = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const atlas = fs.readFileSync(path.join(lib, 'atlas.js'), 'utf8');
  const sheet = 'data:image/webp;base64,' + fs.readFileSync(path.join(lib, 'sprites.webp')).toString('base64');
  await p.setContent('<body></body>');
  await p.addScriptTag({ content: atlas });
  const out = await p.evaluate(async ({ sheet, D }) => {
    const img = new Image(); img.src = sheet; await img.decode();
    const A = window.LUNA_ATLAS.sprites;
    const sprite = (g, n, cx, cy, size) => { const f = A.frames[n], k = size / f[2]; g.drawImage(img, f[0], f[1], f[2], f[3], cx - f[4] * k, cy - f[5] * k, f[2] * k, f[3] * k); };
    // the sea at night: deep teal, wave lines, a few stars, the moon's light on the water
    const sea = (g, s, round) => {
      const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#0a1a3a'); gr.addColorStop(0.55, '#0b3550'); gr.addColorStop(1, '#0a5466');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      g.fillStyle = 'rgba(255,255,255,0.8)'; for (const [x, y, r] of [[0.18, 0.16, 0.012], [0.8, 0.12, 0.009], [0.7, 0.26, 0.007], [0.28, 0.3, 0.006]]) { g.beginPath(); g.arc(x * s, y * s, r * s, 0, Math.PI * 2); g.fill(); }
      const ref = g.createLinearGradient(0, s * 0.58, 0, s); ref.addColorStop(0, 'rgba(255,240,190,0.55)'); ref.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = ref; for (let i = 0; i < 6; i++) { const y = s * (0.64 + i * 0.06), w = s * (0.22 - i * 0.025); g.fillRect(s / 2 - w / 2, y, w, s * 0.018); }
      g.strokeStyle = 'rgba(160,230,255,0.35)'; g.lineWidth = s * 0.012; g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const y = s * (0.66 + i * 0.08); g.beginPath(); for (let x = 0; x <= 1.0001; x += 0.05) { const yy = y + Math.sin(x * 14 + i) * s * 0.012; x ? g.lineTo(x * s, yy) : g.moveTo(0, yy); } g.stroke(); }
    };
    const moon = (g, s, size) => {
      const glow = g.createRadialGradient(s / 2, s * 0.44, 0, s / 2, s * 0.44, size * 0.9);
      glow.addColorStop(0, 'rgba(255,246,210,0.55)'); glow.addColorStop(1, 'rgba(255,246,210,0)');
      g.fillStyle = glow; g.fillRect(0, 0, s, s);
      sprite(g, 'moon_llena', s / 2, s * 0.44, size); sprite(g, 'face_calm', s / 2, s * 0.44, size);
    };
    const png = (s, fn) => { const c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'); fn(g, s); return c.toDataURL('image/png').split(',')[1]; };
    const files = {};
    for (const [d, k] of Object.entries(D)) {
      const L = Math.round(108 * k), S = Math.round(48 * k);
      files[`mipmap-${d}/ic_launcher_background.png`] = png(L, (g, s) => sea(g, s));
      files[`mipmap-${d}/ic_launcher_foreground.png`] = png(L, (g, s) => moon(g, s, s * 0.46));
      files[`mipmap-${d}/ic_launcher.png`] = png(S, (g, s) => { g.beginPath(); g.roundRect(0, 0, s, s, s * 0.2); g.clip(); sea(g, s); moon(g, s, s * 0.62); });
      files[`mipmap-${d}/ic_launcher_round.png`] = png(S, (g, s) => { g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); g.clip(); sea(g, s); moon(g, s, s * 0.6); });
    }
    return files;
  }, { sheet, D });
  for (const [f, b64] of Object.entries(out)) { fs.mkdirSync(path.dirname(path.join(res, f)), { recursive: true }); fs.writeFileSync(path.join(res, f), Buffer.from(b64, 'base64')); }
  console.log('icons', Object.keys(out).length);
  await b.close();
})();
