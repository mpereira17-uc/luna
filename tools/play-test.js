// Bot play-test: a bot plays a full run in headless Chromium and prints how far it got.
// usage: node tools/play-test.js <mode: island|endless|daily|mission> <isl or mission index> <bot:smart|idle> <seconds> [shotPrefix] [danger] [meta preset: none|mid|max] [reefTier]
// e.g.   node tools/play-test.js island 0 smart 420 "" 0 none    (island 1, no workshop upgrades)
//        node tools/play-test.js mission 1 smart 300 "" 0 none   (campaign mission 2)
// The bot drags the moon toward coins, gulls and the ship closest to the island, and picks cards
// in this order: union > fusion > weapon level > new weapon > passive. Needs: npm i playwright
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium, devices } = pw;
const fs = require('fs');
const path = require('path');
const WEB = path.join(__dirname, '..', 'web');
const [, , runMode = 'island', isl = '0', bot = 'smart', secs = '120', shot = '', danger = '0', preset = 'none', reef = '0'] = process.argv;
const PRESETS = {
  none: {},
  mid: { muralla: 4, poder: 4, roca: 4, iman: 2, codicia: 3, sabio: 3, coraza: 2, vigor: 2, critico: 2, motor: 2, suerte: 1 },
  max: { muralla: 10, poder: 10, roca: 10, iman: 5, codicia: 10, sabio: 10, coraza: 5, vigor: 5, critico: 5, motor: 5, suerte: 3, arsenal: 1 },
};
(async () => {
  const html = fs.readFileSync(path.join(WEB, process.env.SIMSRC || 'luna.html'), 'utf8');
  const OUT = path.join(WEB, process.env.SIMOUT || '_test.html');
  fs.writeFileSync(OUT, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">' + html + '</body></html>');
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
  await p.clock.install();
  await p.goto('file://' + OUT);
  await p.clock.runFor(800);
  await p.evaluate(([m, i, bot, danger, meta, reef]) => {
    const L = window.__luna, sv = L.save();
    sv.meta = meta; sv.reef = +reef; sv.coins = 5000;
    sv.isl[['coral', 'escarcha', 'brasa', 'abismo'][+i]] = { best: 0, cleared: true, danger: +danger, dsel: +danger };
    sv.tips = { move: 1, tide: 1, crash: 1, swat: 1, pull: 1, strand: 1, elite: 1, active: 1, ecl: 1, en_sloop: 1, en_pirate: 1, en_gull: 1, en_galleon: 1, en_crab: 1, en_mortar: 1, en_serpent: 1, en_gold: 1 };
    L.start(m, +i);
    window.__log = []; window.__picks = [];
    const rank = c => /union/.test(c.className) ? 0 : /evo/.test(c.className) ? 1 : /k-wup/.test(c.className) ? 2 : /k-wnew|k-pnew/.test(c.className) ? 3 : 4;
    setInterval(() => {
      const md = L.mode, S = L.S;
      if (md === 'levelup') { const cs = [...document.querySelectorAll('#cards .up')]; let best = 0; cs.forEach((c, k) => { if (rank(c) < rank(cs[best])) best = k; }); window.__picks.push((cs[best]?.querySelector('b')?.textContent || '?') + '@' + S.lv); L.pick(best); return; }
      if (md === 'merchant') { const before = Math.floor(L.S.pearls); for (let k = 0; k < 3; k++) L.buyMerchant(k); if (L.rerollMerchant) { L.rerollMerchant(); for (let k = 0; k < 3; k++) L.buyMerchant(k); } (window.__shop = window.__shop || []).push(`w${L.S.wave}: ${before} perlas, gastó ${before - Math.floor(L.S.pearls)}`); L.leaveMerchant(); return; }
      if (md === 'revive') { document.getElementById('reviveBtn').click(); return; }
      if (md === 'fuse') { L.skipFuse(); return; }
      if (md !== 'play' || !S || bot === 'idle') return;
      const B = L.bounds(), W = L.W, mx = S.mx, my = S.my;
      let tx = mx, ty = B.y1;
      const coins = S.coins.filter(c => !c.home);
      let goal = null, bd = 1e9;
      for (const c of coins) { const d = Math.hypot(c.x - mx, c.y - my); if (d < bd) { bd = d; goal = c; } }
      const gulls = S.enemies.filter(e => e.def.kind === 'fly' && Math.abs(e.x - W / 2) < W * 0.3);
      if (gulls.length) { const g = gulls[0]; tx = g.x; ty = g.y; }
      else if (goal && bd < W * 0.45) { tx = goal.x; ty = goal.y; }
      else {
        let tgt = null, td = 1e9;
        for (const e of S.enemies) { if (e.def.kind === 'fly') continue; const d = Math.abs(e.x - W / 2); if (d < td) { td = d; tgt = e; } }
        if (S.boss && !S.boss.dead && S.boss.type === 'eclipse' && !S.boss.invuln) { tx = S.boss.x; ty = S.boss.y; }
        else if (S.boss && !S.boss.dead && !S.boss.invuln && (!tgt || td > W * 0.22)) { tx = S.boss.x; ty = B.y1 - (B.y1 - B.y0) * 0.25; }
        // mission 2 wants ships wrecked on the reef: hover high over the island and let them come
        else if (S.mis && S.mis.deep) { tx = W / 2 + Math.sin(S.t * 0.7) * W * 0.12; ty = B.y0 + (B.y1 - B.y0) * 0.3; }
        else if (tgt) { tx = tgt.x - tgt.dir * 18; ty = B.y1; }
      }
      const dx = tx - mx, dy = ty - my, d = Math.hypot(dx, dy) || 1, step = Math.min(d, 70);
      L.moveTo(mx + dx / d * step, my + dy / d * step);
      if (S.charge >= 1) L.active();
    }, 100);
    setInterval(() => { const S = L.S; if (S) window.__log.push({ t: Math.round(S.t), w: S.wave, hp: Math.round(S.hp), mhp: Math.round(S.maxHp), lv: S.lv, en: S.enemies.length, k: S.kills, c: Math.round(S.pearls), boss: S.boss ? Math.round(S.boss.hp) : null, mode: L.mode }); }, 10000);
  }, [runMode, isl, bot, danger, PRESETS[preset], reef]);
  const total = +secs * 1000; let done = 0; const t0 = Date.now();
  while (done < total) {
    await p.clock.runFor(5000); done += 5000;
    if (shot && done % 30000 === 0) await p.screenshot({ path: `${shot}-${done / 1000}.png` });
    const md = await p.evaluate(() => window.__luna.mode);
    if (md === 'result') { await p.clock.runFor(2500); break; }
  }
  const log = await p.evaluate(() => window.__log);
  const picks = await p.evaluate(() => window.__picks);
  const S = await p.evaluate(() => { const S = window.__luna.S; return S ? { wave: S.wave, t: Math.round(S.t), kills: S.kills, lv: S.lv, hp: Math.round(S.hp), coins: Math.round(S.pearls), golds: S.golds, chests: S.chestsOpened, weapons: S.weapons.map(w => w.id + w.lv + (w.evo ? '*' : '') + (w.union ? 'U' : '')), passives: S.passives, bossKills: S.bossKills, dmgBy: Object.fromEntries(Object.entries(S.dmgBy).map(([k, v]) => [k, Math.round(v)])), ended: S.ended, maxCombo: S.maxCombo, mg: S.mg, stars: S.stars || null, failWhy: S.failWhy || null } : null; });
  if (shot) await p.screenshot({ path: `${shot}-end.png` });
  const res = await p.evaluate(() => document.getElementById('rTitle')?.innerText + ' | ' + document.getElementById('rTally')?.innerText.replace(/\n/g, ' | '));
  console.log(JSON.stringify({ runMode, isl, danger, preset, reef, real: Math.round((Date.now() - t0) / 1000) + 's', S, res }));
  console.log('LOG', log.map(l => `${l.t}s w${l.w} hp${l.hp}/${l.mhp} lv${l.lv} en${l.en} k${l.k} c${l.c}${l.boss != null ? ' B' + l.boss : ''} ${l.mode}`).join(' / '));
  console.log('PICKS', picks.join(', '));
  console.log('SHOP', JSON.stringify(await p.evaluate(() => window.__shop || [])));
  console.log('ERRORS', errs.slice(0, 10));
  await b.close();
})();
