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
  // a save with some coins and a record, as after a few nights
  await p.evaluate(() => localStorage.setItem('luna-mar-v1', JSON.stringify({ coins: 1200, best: 640, wins: 1, runs: 4, moons: ['llena'], shop: { vida: 2, fuerza: 1 }, rec: { llena: { best: 640, wins: 1, kills: 812 } } })));
  await p.reload();
  await p.waitForFunction(() => window.__luna && window.__luna.ready, null, { timeout: 30000 });
  await wait(p, 1200);
  await p.screenshot({ path: OUT + '/t_title.png' });
  await p.click('#moonNext'); await wait(p, 600);
  await p.screenshot({ path: OUT + '/t_locked.png' });
  await p.click('#goPlay'); await wait(p, 600);
  await p.screenshot({ path: OUT + '/t_unlocked.png' });
  await p.click('#moonNext'); await p.click('#moonNext'); await p.click('#moonNext'); await wait(p, 600);
  await p.screenshot({ path: OUT + '/t_cant.png' });
  await p.click('#shopBtn'); await wait(p, 700);
  await p.screenshot({ path: OUT + '/s_shop.png' });
  await p.click('.shop-row[data-k="coraza"]'); await wait(p, 200);
  await p.click('.shop-row[data-k="vida"]'); await wait(p, 500);
  await p.screenshot({ path: OUT + '/s_bought.png', fullPage: true });
  await p.click('#shopBack'); await wait(p, 500);
  console.log(JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('luna-mar-v1')))));
  // a run with the workshop: life and the second tide
  await p.evaluate(() => { localStorage.setItem('x', '1'); });
  await p.click('#moonPrev'); await p.click('#moonPrev'); await p.click('#moonPrev'); await wait(p, 300);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('luna-mar-v1')); });
  await p.evaluate(() => __luna.start()); await wait(p, 1200);
  console.log(JSON.stringify(await p.evaluate(() => { const S = __luna.peek(); return { moon: __luna.state(), maxHp: S.maxHp, armor: S.st.armor, rerolls: S.rerolls, revive: S.revive }; })));
  await p.screenshot({ path: OUT + '/r_run.png' });
  console.log('ERRORS', JSON.stringify(errs.slice(0, 12)));
  await b.close();
})();
