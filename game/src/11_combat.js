
// =====================================================================
// COMBAT: hits, knockback, what a sunk ship leaves behind
// =====================================================================
// kx, ky = the push (galleons and elites barely move); big = shown in gold
function hurt(e, dmg, kx = 0, ky = 0, big) {
  if (e.dead || e.faded) return;
  if ((e.frozen || 0) > S.t) dmg *= 1.3;
  if (S.st.chill && !e.d.noIce) e.slowT = S.t + 0.8;
  e.hp -= dmg; e.hit = 0.12;
  const res = (e.d.heavy ? 0.35 : 1) * (e.elite ? 0.35 : 1);
  e.kx += kx * res; e.ky += ky * res;
  numText(e.x, e.y - e.r - 4, String(Math.round(dmg)), big ? 0xffd36b : 0xffffff, big ? 15 : 11);
  if (e.hp <= 0) kill(e);
}
function kill(e) {
  e.dead = true;
  // a decoy was never a ship: it bursts into mist and leaves nothing
  if (e.type === 'decoy') {
    for (let i = 0; i < 10; i++) { const a = rand(0, TAU), v = rand(40, 110); puff({ add: true, tex: FX.dot, x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, s0: 16, s1: 4, tint: e.tint, a: 0.6, drag: 2 }); }
    sfx('pop', 40, e.x); if (e.view) S.sinking.push({ e, t: 0.4 }); return;
  }
  S.kills++;
  S.charge = Math.min(1, S.charge + 0.012);
  const gold = S.act && S.act.k === 'dorada';
  if (e.d.ai === 'bomb') explode(e);
  if (e.cap) capSunk(e);
  if (e.type === 'goldship') { for (let i = 0; i < 14; i++) dropPickup('coin', e.x + rand(-30, 30), e.y + rand(-30, 30)); sparks(e.x, e.y, COL.gold, 14, 220, 10); banner('¡Tesoro!', 'El barco del tesoro se hunde con todo'); sfx('coin'); }
  // an octopus leaves a cloud of ink on the water
  if (e.type === 'octopus') for (let i = 0; i < 6; i++) { const a = rand(0, TAU), v = rand(10, 40); puff({ tex: FX.foam, x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.4, s0: 14, s1: 36, tint: 0x1a1030, a: 0.55, drag: 1.5 }); }
  dropPearl(e.x, e.y, e.d.xp * (e.elite ? 12 : 1) * (gold ? 2 : 1));
  if (Math.random() < (gold ? 0.4 : 0.05)) dropPickup('coin', e.x + rand(-10, 10), e.y + rand(-10, 10));
  if (Math.random() < 0.012) dropPickup('starfish', e.x, e.y);
  if (Math.random() < 0.004) dropPickup('shell', e.x, e.y);
  if (e.elite) { dropPickup('chest', e.x, e.y); for (let i = 0; i < 6; i++) dropPickup('coin', e.x + rand(-26, 26), e.y + rand(-26, 26)); }
  if (e.d.fly) {
    sfx('squawk', null, e.x);
    for (let i = 0; i < 7; i++) { const a = rand(0, TAU), v = rand(40, 120); puff({ tex: FX.drop, x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 60, life: rand(0.5, 0.9), s0: 6, s1: 3, tint: 0xf4f0e8, drag: 2.5, rot: rand(0, TAU), vr: rand(-6, 6) }); }
  } else {
    sfx('sink', null, e.x); sinkFx(e.x, e.y, e.d.heavy ? 1.4 : 1);
    if ((e.frozen || 0) > S.t) { sfx('coral', null, e.x); for (let i = 0; i < 8; i++) { const a = rand(0, TAU), v = rand(80, 180); puff({ add: true, tex: FX.star, x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, s0: 9, s1: 3, tint: 0xd8f4ff, drag: 3 }); } }
  }
  if (e.glow) { e.glow.destroy(); e.glow = null; }
  if (e.view) S.sinking.push({ e, t: 0 });
}
// a legendary captain goes down: its chest, its gold, and the whole sea hears it
function capSunk(e) {
  const c = CAPTAINS[e.cap];
  dropPickup('chest', e.x, e.y);
  for (let i = 0; i < 20; i++) dropPickup('coin', e.x + rand(-40, 40), e.y + rand(-40, 40));
  sparks(e.x, e.y, c.tint, 20, 260, 12); shock(e.x, e.y, 26, 140, 460, 520); cam.shake = Math.max(cam.shake, 0.8);
  banner(`¡${c.name} ha caído!`, 'Su cofre flota entre los restos', true); sfx('bigboom', null, e.x); vib('heavy');
  if (S.cap === e) S.cap = null;
  S.caps++;
}
// the closest enemies (for the moon's rays): up to n, within range
function nearestEnemies(n, range) {
  const out = [], r2 = range * range;
  for (const e of S.enemies) { if (e.dead || e.faded) continue; const q = dist2(e.x, e.y, S.x, S.y); if (q < r2) out.push([q, e]); }
  out.sort((a, b) => a[0] - b[0]);
  return out.slice(0, n).map(o => o[1]);
}
// the screen blushes red when the moon is hit (DOM, so it costs the renderer nothing)
let hurtTimer = 0;
function hurtFlash() {
  const el = $('hurtFx'); el.classList.add('on'); clearTimeout(hurtTimer); hurtTimer = setTimeout(() => el.classList.remove('on'), 90);
  $('hpBox').classList.remove('hit'); void $('hpBox').offsetWidth; $('hpBox').classList.add('hit');
}
