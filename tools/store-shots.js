// Google Play screenshots, 1080x1920 (360x640 at 3x), written to google-play/capturas/.
// usage: node tools/store-shots.js     Needs: npm i playwright
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const fs = require('fs');
const path = require('path');
const WEB = path.join(__dirname, '..', 'web');
const OUT = path.join(__dirname, '..', 'google-play', 'capturas');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const page = path.join(WEB, '_shots.html');
  fs.writeFileSync(page, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">' + fs.readFileSync(path.join(WEB, 'luna.html'), 'utf8') + '</body></html>');
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // a save with some progress so the menus look lived-in
  await p.addInitScript(() => { try { localStorage.setItem('luna-v4', JSON.stringify({ coins: 2480, reef: 2, moons: ['llena', 'roja', 'hielo'], moon: 'llena', meta: { muralla: 3, poder: 3, roca: 2, iman: 1, codicia: 2, sabio: 1, vigor: 1 }, isl: { coral: { best: 20, cleared: true, danger: 2, dsel: 1 }, escarcha: { best: 14, cleared: false, danger: 0, dsel: 0 } }, endlessBest: 17, music: true, sfx: true, tips: { move: 1 } })); } catch (e) {} });
  await p.clock.install();
  await p.goto('file://' + page);
  await p.clock.runFor(1500);
  const shot = n => p.screenshot({ path: path.join(OUT, `${n}.png`) });
  const sway = () => p.evaluate(() => { const L = window.__luna; clearInterval(window.__bot); window.__bot = setInterval(() => { if (L.mode === 'levelup') L.pick(0); if (L.mode === 'merchant') L.leaveMerchant(); const S = L.S, B = L.bounds(); if (S) L.moveTo(L.W / 2 + Math.sin(S.t * 0.8) * L.W * 0.28, B.y0 + (B.y1 - B.y0) * (0.55 + 0.35 * Math.sin(S.t * 0.5))); }, 100); });
  await shot('1-titulo');
  await p.click('#goPlay'); await p.clock.runFor(500); await shot('5-islas');
  // gameplay: weapons at level 3 shredding a boarding party
  await p.evaluate(() => { const L = window.__luna; L.save().tips = new Proxy({}, { get: () => 1, has: () => true }); L.start('island', 0); ['tormenta', 'tiburon', 'canon', 'faro'].forEach(L.give); L.maxw(); L.S.lv = 12; L.jump(9); });
  await sway();
  for (let i = 0; i < 4; i++) await p.clock.runFor(1000);
  await p.evaluate(() => { const S = window.__luna.S; S.horde = { t: 0, side: 1 }; });
  await p.clock.runFor(4200);
  await p.evaluate(() => { const S = window.__luna.S; S.combo = Math.max(S.combo, 187); S.comboT = 1.9; });
  await p.clock.runFor(300);
  await shot('2-accion');
  // level-up with a union on offer
  await p.evaluate(() => { const S = window.__luna.S; clearInterval(window.__bot); window.__luna.give('remolino'); window.__luna.maxw(); S.xp = S.need + 1; });
  await p.clock.runFor(900); await shot('3-cartas');
  await p.evaluate(() => window.__luna.pick(0));
  // boss
  await p.evaluate(() => { const L = window.__luna; L.start('island', 0); ['canon', 'tiburon'].forEach(L.give); L.S.lv = 9; L.jump(10); });
  await sway();
  for (let i = 0; i < 4; i++) await p.clock.runFor(1000);
  // keep the moon clear of the kraken for the picture
  await p.evaluate(() => { const L = window.__luna, S = L.S, B = L.bounds(); clearInterval(window.__bot); const x = S.boss && S.boss.x < L.W / 2 ? L.W * 0.72 : L.W * 0.28; window.__bot = setInterval(() => L.moveTo(x, B.y0 + (B.y1 - B.y0) * 0.35), 100); });
  for (let i = 0; i < 2; i++) await p.clock.runFor(1000);
  await shot('4-jefe');
  // workshop with the reef designs
  await p.evaluate(() => { clearInterval(window.__bot); document.getElementById('quitBtn').click(); document.getElementById('pYes').click(); });
  await p.clock.runFor(1500);
  await p.evaluate(() => { window.lunaBack && window.lunaBack(); window.lunaBack && window.lunaBack(); });
  await p.clock.runFor(300);
  await p.click('#goShop'); await p.clock.runFor(400); await shot('6-taller');
  fs.unlinkSync(page);
  console.log('errors', errs);
  await b.close();
})();
