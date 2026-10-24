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
  await p.waitForTimeout(800);
  await p.evaluate(() => { __luna.moon('llena'); __luna.quality('alto'); __luna.start(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { __luna.god(true); __luna.skip(90); });
  const spots = { mareas: [700, 300], archi: [2400, 1300], hielo: [100, -2600], sangre: [-2400, 1300], borde: [1100, -1100] };
  for (const [k, [x, y]] of Object.entries(spots)) {
    await p.evaluate(([x, y]) => __luna.go(x, y), [x, y]);
    await p.waitForTimeout(2600);
    await p.screenshot({ path: OUT + `/z_${k}.png` });
  }
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)));
  await b.close();
})();
