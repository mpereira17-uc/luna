
// =====================================================================
// THE LOOP: boot (the renderer, the art, the font), the update in small steps, the drawing,
// and a guard that drops to plain graphics if the phone can't keep up
// =====================================================================
function update(dt) {
  S.t += dt;
  moonTick(dt);
  directorTick(dt);
  // the bosses come on time (one at a time); dawn wins the run once the sea is clear of them
  if (S.bossI < BOSS_TIMES.length && S.t >= BOSS_TIMES[S.bossI][0] && !S.boss) bossStart(BOSS_TIMES[S.bossI++][1]);
  if (S.t >= RUN_END && !S.boss && !S.ended) { dawn(); return; }
  enemiesTick(dt); eshotsTick(dt); bossTick(dt);
  rayoTick(dt); shotsTick(dt); sharkTick(dt); armsTick(dt); waveTick(dt); actTick(dt);
  pickupsTick(dt); hazardsTick(dt); zoneTick(); camTick(dt);
  if (S.pendingLv > 0 && !S.ended && mode === 'play') openLevelUp();
}
let last = 0;
const perf = { t: 0, n: 0, sum: 0, slow: 0, fps: 0 };
function frame(now) {
  const raw = Math.max(0, (now - last) / 1000), dt = Math.min(0.05, raw); last = now;
  T += reduceMotion ? dt * 0.3 : dt;
  let live = 0;
  if (mode === 'play' && S && !S.ended) {
    const steps = dt > 1 / 40 ? 2 : 1, n = steps * (window.__luna.fast || 1);
    for (let i = 0; i < n && mode === 'play'; i++) update(dt / steps);
    streaksTick(dt); hudTick(); drawMinimap(dt); live = dt;
  } else if (mode === 'play' && S) { S.deadT += dt; streaksTick(dt); camTick(dt); live = dt; }
  else if (mode === 'title') { titleCam(dt); streaksTick(dt); }
  else streaksTick(dt);
  drawFrame(live, dt);
  qualityGuard(raw);
  requestAnimationFrame(frame);
}
// 4-second windows while playing: two slow ones in a row (under ~40 fps) and the filters go off
function qualityGuard(raw) {
  if (mode !== 'play' || raw > 0.25) return;
  perf.t += raw; perf.n++; perf.sum += raw;
  if (perf.t < 4) return;
  perf.fps = Math.round(perf.n / perf.sum);
  perf.slow = perf.fps < 40 ? perf.slow + 1 : 0;
  perf.t = perf.n = perf.sum = 0;
  if (perf.slow >= 2 && FXQ === 'alto' && !save.fxManual) { FXQ = save.fx = 'bajo'; persist(); applyQuality(); perf.slow = 0; }
}
async function boot() {
  try {
    rdr = await PIXI.autoDetectRenderer({ canvas: cv, width: W, height: H, resolution: DPR, autoDensity: false, background: SEA.base,
      antialias: false, preference: 'webgl', powerPreference: 'high-performance' });
  } catch (e) {
    $('titleBest').textContent = 'Este dispositivo no puede mostrar los gráficos del juego (falta WebGL).'; return;
  }
  await loadArt();
  if (document.fonts) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
  try {
    PIXI.BitmapFont.install({ name: 'lunaNum', style: { fontFamily: 'Figtree, system-ui, sans-serif', fontSize: 28, fontWeight: '900', fill: '#ffffff', stroke: { color: '#0a1020', width: 5 } }, chars: [['0', '9'], '+¡!Tesor'] });
    numFont = true;
  } catch (e) {}
  FXQ = save.fx === 'bajo' ? 'bajo' : 'alto';
  MOON = MOONS.find(m => m.id === save.moon) || MOONS[0];
  initParticles(); initFilters(); initSea(); initMoonView(); initInput(); applyQuality();
  wireScreens(); showTitle();
  window.__luna.ready = true;
  requestAnimationFrame(t => { last = t; frame(t); });
}
// for the automated checks (screenshots, a quick look at the state); the game never uses it
window.__luna = {
  state: () => S ? { mode, t: +S.t.toFixed(1), hp: Math.round(S.hp), lv: S.lv, kills: S.kills, enemies: S.enemies.length, pickups: S.pickups.length, shots: S.shots.length,
    boss: S.boss ? { kind: S.boss.kind, hp: Math.round(S.boss.hp), ph: S.boss.ph, x: Math.round(S.boss.x), y: Math.round(S.boss.y) } : null, bossI: S.bossI, cap: S.cap ? S.cap.cap : null, eshots: S.eshots.length, gloom: +S.gloom.toFixed(2), fxq: FXQ, fps: perf.fps, parts: parts.length } : { mode, fxq: FXQ },
  start: () => startRun(),
  skip: t => { S.t = t; S.eventI = EVENTS.findIndex(e => e.t >= t); if (S.eventI < 0) S.eventI = EVENTS.length; S.bossI = BOSS_TIMES.filter(b => b[0] < t).length; },
  spawn: (type, n = 1, o = {}) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), r = o.r || 200; spawnEnemy(type, S.x + Math.cos(a) * r, S.y + Math.sin(a) * r, o); } },
  captain: id => spawnCaptain(id),
  event: k => runEvent(EVENTS.find(e => e.k === k)),
  god: on => { S.god = on; },
  give: (k, n = 1) => { for (let i = 0; i < n; i++) takeOffer(WEAPONS[k] ? { kind: 'w', id: k } : { kind: 'p', id: k }); },
  tsunami: () => { S.charge = 1; return useActive(); },
  power: () => { S.charge = 1; return useActive(); },
  find: k => { for (let r = 1; r < 12; r++) for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) { const p = chunkAt(i, j).props.find(p => p.k === k); if (p) return [Math.round(p.x), Math.round(p.y)]; } return null; },
  go: (x, y) => { S.x = x; S.y = y; cam.x = x; cam.y = y; for (const e of S.enemies) relocate(e); },
  moon: id => { MOON = MOONS.find(m => m.id === id) || MOONS[0]; save.moon = MOON.id; },
  evo: k => { S.weapons[k] = WEAPONS[k].lv.length; S.passives[EVOS[WEAPONS[k].evo].pas] = 1; recalc(); takeOffer({ kind: 'evo', id: k }); },
  quality: q => { FXQ = save.fx = q; save.fxManual = true; applyQuality(); },
  hurtBoss: f => { if (S.boss) { S.boss.hittable = true; hurtBoss(S.boss.maxHp * f); } },
  peek: () => S,
  sinkCap: () => { if (S.cap) { S.cap.faded = false; hurt(S.cap, 1e7); } },
  unblock: () => { if (mode === 'chest') { show(null); mode = 'play'; } let n = 0; while (mode === 'levelup' && n++ < 60) { cardLock = 0; chooseCard(0); } },
};
boot();
})();
