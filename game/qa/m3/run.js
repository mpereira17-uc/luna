const { chromium } = require('playwright');
const OUT = __dirname;
const wait = (p, ms) => p.waitForTimeout(ms);
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  await p.goto('http://localhost:8765/out/index.html');
  await p.waitForFunction(() => window.__luna && window.__luna.ready, null, { timeout: 30000 });
  await wait(p, 600);
  await p.evaluate(() => { __luna.moon('llena'); __luna.quality('alto'); __luna.start(); });
  await wait(p, 900);
  const st = () => p.evaluate(() => __luna.state());
  const shot = async n => { await p.screenshot({ path: OUT + `/${n}.png` }); console.log(n, JSON.stringify(await st())); };
  await p.evaluate(() => { __luna.god(true); __luna.skip(100); __luna.fast = 4; setInterval(() => __luna.unblock(), 250); });
  // the creatures, all at once around the moon
  await p.evaluate(() => { for (const t of ['gunboat', 'brulote', 'crab', 'jelly', 'octopus', 'ghost', 'serpent', 'iceserp', 'icejelly', 'redjelly']) __luna.spawn(t, 1, { r: 150 + Math.random() * 60 }); });
  await wait(p, 2500); await shot('a_creatures');
  await wait(p, 2500); await shot('a_creatures2');
  // the captains
  for (const id of ['perla', 'ballenero', 'ceniza', 'sombra']) {
    await p.evaluate(id => { if (__luna.state().cap) { /* sink the last one */ } __luna.captain(id); }, id);
    await wait(p, 5000); await shot('c_' + id);
    await p.evaluate(() => { const S = __luna.peek(); if (S.cap) { S.cap.faded = false; } });
    await p.evaluate(() => __luna.sinkCap());
    await wait(p, 1500); await shot('c_' + id + '_sunk');
    await p.evaluate(() => __luna.unblock());
  }
  await p.evaluate(() => __luna.event('gold')); await wait(p, 2000); await shot('e_gold');
  await p.evaluate(() => __luna.event('bloom')); await wait(p, 1200); await shot('e_bloom');
  // the Kraken at minute 5, killed, its chest, and the run goes on
  await p.evaluate(() => __luna.skip(300)); await wait(p, 4000); await shot('k_kraken');
  await p.evaluate(() => __luna.hurtBoss(1.1)); await wait(p, 6000); await shot('k_dead');
  await p.evaluate(() => __luna.unblock()); await wait(p, 800); await shot('k_after');
  // the Holandés Errante at minute 10
  await p.evaluate(() => __luna.skip(600)); await wait(p, 2500); await shot('h_rise');
  await wait(p, 3500); await shot('h_pass1');
  await wait(p, 2500); await shot('h_pass1b');
  await p.evaluate(() => __luna.hurtBoss(0.55)); await wait(p, 6000); await shot('h_cursed');
  await wait(p, 3000); await shot('h_cursed2');
  await p.evaluate(() => { __luna.peek().boss.ph = 'pass'; __luna.hurtBoss(1); }); await wait(p, 6000); await shot('h_dead');
  await p.evaluate(() => __luna.unblock());
  // dawn
  await p.evaluate(() => __luna.skip(899)); await wait(p, 2000); await shot('z_dawn');
  await wait(p, 4000); await shot('z_results');
  console.log('ERRORS', JSON.stringify(errs.slice(0, 12)));
  await b.close();
})();
