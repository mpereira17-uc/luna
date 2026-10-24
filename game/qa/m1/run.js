const { chromium } = require('playwright');
const OUT = __dirname;
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  await p.goto('http://localhost:8765/out/index.html');
  await p.waitForFunction(() => window.__luna && window.__luna.ready, null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/title.png' });
  await p.click('#moonNext'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/title2.png' });
  const moons = ['llena', 'roja', 'hielo', 'nueva', 'tormenta', 'dorada'];
  const weapons = ['ondas', 'escarcha', 'tormenta', 'meteoros', 'remolino'];
  for (let i = 0; i < moons.length; i++) {
    const m = moons[i];
    await p.evaluate(m => { __luna.moon(m); __luna.quality('alto'); __luna.start(); }, m);
    await p.waitForTimeout(900);
    await p.evaluate((w) => { __luna.god(true); __luna.skip(130); __luna.give(w, 3); }, weapons[i % 5]);
    await p.waitForTimeout(3500);
    await p.evaluate(() => __luna.power());
    await p.waitForTimeout(1200);
    await p.screenshot({ path: OUT + `/m_${m}.png` });
    const st = await p.evaluate(() => __luna.state());
    console.log(m, JSON.stringify(st));
    await p.evaluate(() => { document.getElementById('levelUp').hidden || document.querySelector('#cards .up')?.click(); });
  }
  // evolutions
  await p.evaluate(() => { __luna.moon('llena'); __luna.start(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { __luna.god(true); __luna.skip(150); for (const k of ['rayo','tiburon','ondas','escarcha','tormenta','meteoros','remolino']) __luna.evo(k); });
  await p.waitForTimeout(5000);
  await p.screenshot({ path: OUT + '/evos.png' });
  console.log('evo', JSON.stringify(await p.evaluate(() => __luna.state())));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)));
  await b.close();
})();
