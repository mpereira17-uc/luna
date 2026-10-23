// Google Play screenshots, 1080x1920 (360x640 at 3x), written to google-play/capturas/.
// usage: node tools/store-shots.js [titulo,accion,...]     Needs: npm i playwright
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const fs = require('fs');
const path = require('path');
const WEB = path.join(__dirname, '..', 'web');
const OUT = path.join(__dirname, '..', 'google-play', 'capturas');
const ONLY = process.argv[2] ? process.argv[2].split(',') : null;
const on = k => !ONLY || ONLY.includes(k);
// a save with most of the game opened, so the menus look lived-in and no tutorial gets in the way
const TIPS = { move: 1, tide: 1, crash: 1, active: 1, tidebtn: 1, pull: 1, strand: 1, elite: 1, wreck: 1, treasure: 1 };
const camp = {}; for (let i = 1; i <= 20; i++) camp[i] = { s: [1, 1, i % 3 ? 1 : 0], n: 1 };
const SAVE = {
  intro: true, coins: 12480, tips: TIPS, camp, reef: 2,
  story: { o0: 1, c0: 1, o1: 1, c1: 1, o2: 1, o3: 1, c2: 1 },
  moons: ['llena', 'roja', 'hielo', 'nueva', 'tormenta'],
  isl: { coral: { best: 20, cleared: true }, escarcha: { best: 20, cleared: true }, brasa: { best: 12 } },
  meta: { muralla: 6, poder: 6, roca: 4, iman: 3, codicia: 4, sabio: 3, coraza: 2, vigor: 2 },
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const page = path.join(WEB, '_shots.html');
  fs.writeFileSync(page, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">' + fs.readFileSync(path.join(WEB, 'luna.html'), 'utf8') + '</body></html>');
  const b = await pw.chromium.launch();
  const errs = [];
  const ev = (p, src) => p.evaluate(s => window.__luna.ev(s), src);
  const wait = (p, ms) => p.waitForTimeout(ms);
  // the choices that stop a run (cards, fusions, the merchant, pacts) are answered on their own
  const busy = p => p.evaluate(() => { const L = window.__luna; if (L.mode === 'levelup') L.pick(0); if (L.mode === 'fuse') L.skipFuse(); if (L.mode === 'merchant') L.leaveMerchant(); if (L.mode === 'pact') L.choice(0); });
  const open = async (save = SAVE) => {
    const p = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { try { localStorage.setItem('luna-v4', JSON.stringify(s)); } catch (e) {} }, save);
    await p.goto('file://' + page); await wait(p, 2600);
    await ev(p, `GFX.dpr = 3; setDpr()`);
    return p;
  };
  // the banners (new enemy, wave rules) cover the scene: cleared before every picture of a run
  const shot = async (p, n, run = true) => {
    if (run) { await ev(p, `clearTimeout(bannerTimer); $('banner').classList.remove('show')`); await wait(p, 450); }
    await p.screenshot({ path: path.join(OUT, `${n}.png`) }); await p.close();
  };
  // a run on an island with the weapons at level 3, at a given wave; tips never show
  const run = async (p, island, wave, weapons) => {
    await ev(p, `audioInit(); beginRun('island', ${island}); S.intro = 0; S.hp = S.maxHp = 400; S.bannerHold = 1e9`); await wait(p, 500); await busy(p);
    await ev(p, `${weapons.map(id => `__luna.give('${id}')`).join(';')}; __luna.maxw(); S.lv = 14; S.xp = 0; S.need = 1e9`);
    if (wave) { await ev(p, `__luna.jump(${wave}); S.merchantDue = undefined; S.evDue = null`); await wait(p, 300); await busy(p); }
  };
  // the moon sweeps the sky like a player would
  const wander = async (p, secs) => { for (let t = 0; t < secs * 4; t++) { await busy(p); await ev(p, `S && __luna.moveTo(W * (0.3 + 0.4 * Math.sin(S.t * 0.8)), H * (0.27 + 0.05 * Math.cos(S.t)))`); await wait(p, 250); } };

  if (on('titulo')) { const p = await open(); await wait(p, 2600); await shot(p, '1-titulo', false); }
  if (on('accion')) {
    const p = await open(); await run(p, 0, 9, ['tiburon', 'faro', 'canon', 'tormenta']);
    await ev(p, `S.mods.spawn = 2.2`); await wander(p, 9); await ev(p, `S.hp = S.maxHp * 0.92`); await wander(p, 1); await shot(p, '2-accion');
  }
  if (on('jefe')) {
    const p = await open(); await run(p, 0, 0, ['tiburon', 'canon']);
    await ev(p, `S.wave = 9; nextWave(); S.merchantDue = undefined; S.evDue = null`); await wait(p, 300); await busy(p);
    for (let i = 0; i < 80 && !(await ev(p, '!!S.cine')); i++) { await busy(p); await wait(p, 250); }
    for (let i = 0; i < 80 && (await ev(p, '!!S.cine')); i++) await wait(p, 250);
    await ev(p, `S.bannerHold = 1e9`); await wander(p, 3.5); await shot(p, '3-jefe');
  }
  if (on('evento')) { const p = await open(); await run(p, 1, 8, ['escarcha', 'faro']); await ev(p, `startEvent('ballena')`); await wander(p, 3.2); await shot(p, '4-evento'); }
  if (on('rival')) {
    const p = await open({ ...SAVE, rival: { id: 'perla', lv: 3, met: 2, esc: 2, since: '2026-10-20' } }); await run(p, 0, 12, ['canon', 'tiburon']);
    await ev(p, `S.enemies.forEach(e => e.dead = true); S.enemies = []; rivalSpawn()`); await wander(p, 3.4); await shot(p, '5-rival');
  }
  if (on('cartas')) {
    const p = await open(); await run(p, 0, 6, ['tiburon']);
    await wander(p, 2); await ev(p, `S.need = xpNeed(S.lv); S.xp = S.need`); await wait(p, 1200); await shot(p, '6-cartas', false);
  }
  if (on('islas')) { const p = await open(); await ev(p, `openIslands(1)`); await wait(p, 900); await p.evaluate(() => document.getElementById('scrIslands').scrollTop = 0); await wait(p, 300); await shot(p, '7-islas', false); }
  if (on('retos')) { const p = await open(); await ev(p, `openDaily()`); await wait(p, 700); await p.evaluate(() => document.getElementById('scrDaily').scrollTop = 0); await wait(p, 300); await shot(p, '8-retos', false); }
  fs.unlinkSync(page);
  console.log('errors', errs);
  await b.close();
})();
