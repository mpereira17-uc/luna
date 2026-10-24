
// =====================================================================
// PICKUPS: pearls (experience) that drift with the currents, coins, starfish (life), the magnet shell,
// chests, and the treasure in the wrecks (hover over one to take it)
// =====================================================================
// the original Luna's lilac pearl, painted once
const PEARL_TEX = texOf(offscreen(32, 32, 3, g => {
  const r = 7, h = 16;
  const halo = g.createRadialGradient(h, h, r * 0.6, h, h, 15); halo.addColorStop(0, 'rgba(244,226,255,0.55)'); halo.addColorStop(1, 'rgba(244,226,255,0)');
  g.fillStyle = halo; g.beginPath(); g.arc(h, h, 15, 0, TAU); g.fill();
  const body = g.createRadialGradient(h - r * 0.35, h - r * 0.4, r * 0.1, h, h, r);
  body.addColorStop(0, '#ffffff'); body.addColorStop(0.4, '#f1e4ff'); body.addColorStop(0.8, '#c4a9e8'); body.addColorStop(1, '#8a6cc2');
  g.fillStyle = body; g.beginPath(); g.arc(h, h, r, 0, TAU); g.fill();
  g.lineWidth = 1.4; g.strokeStyle = '#2b1a40'; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(h - r * 0.35, h - r * 0.38, r * 0.32, r * 0.2, -0.6, 0, TAU); g.fill();
}));
// small, blue and gold pearls: the bigger the ship, the bigger the pearl
const PEARL = [{ v: 1, tint: 0xffffff, s: 14 }, { v: 5, tint: 0xa8dcff, s: 19 }, { v: 25, tint: 0xffd98a, s: 25 }];
const tierOf = v => v >= 25 ? 2 : v >= 5 ? 1 : 0;
function dropPearl(x, y, v) {
  // a sea full of pearls folds the far ones together (nobody can pick up a thousand)
  if (S.pickups.length > 300) {
    const far = S.pickups.find(p => p.k === 'pearl' && !p.home && dist2(p.x, p.y, S.x, S.y) > 400 * 400);
    if (far) { far.v += v; const t = tierOf(far.v); far.view.tint = PEARL[t].tint; far.size = PEARL[t].s; return; }
  }
  const t = tierOf(v), view = new PIXI.Sprite(PEARL_TEX); view.anchor.set(0.5); view.tint = PEARL[t].tint; L.pick.addChild(view);
  S.pickups.push({ k: 'pearl', x, y, v, vx: rand(-40, 40), vy: rand(-40, 40), t: 0, ph: rand(0, 6), home: false, size: PEARL[t].s, view });
}
const PICK_ART = { coin: ['coin0', 0.42], starfish: ['starfish', 0.7], shell: ['shell', 0.85], chest: ['chest', 0.62] };
function dropPickup(k, x, y, o = {}) {
  const [n, s] = PICK_ART[k], view = spr(n, s * (o.big ? 1.4 : 1), L.pick);
  const p = { k, x, y, vx: rand(-50, 50), vy: rand(-50, 50), t: 0, ph: rand(0, 6), home: false, big: !!o.big, view };
  if (k === 'chest') { p.glow = glow(L.fx, 0xffcf70, o.big ? 150 : 100, 0.6); p.glow.anchor.set(0.5); p.vx = p.vy = 0; }
  S.pickups.push(p);
  return p;
}
function pickupsTick(dt) {
  const m2 = S.st.magnet ** 2;
  if (S.magnetT > 0) S.magnetT -= dt;
  for (const p of S.pickups) {
    p.t += dt;
    const dx = S.x - p.x, dy = S.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (p.home) {
      // pulled to the moon, faster and faster
      p.sp = (p.sp || 120) + 900 * dt;
      p.x += dx / d * Math.min(p.sp * dt, d); p.y += dy / d * Math.min(p.sp * dt, d);
    } else {
      // what floats drifts with the currents
      const c = current(p.x, p.y), k = Math.min(1, 3 * dt);
      p.vx -= p.vx * k; p.vy -= p.vy * k;
      p.x += (c.x * 0.7 + p.vx) * dt; p.y += (c.y * 0.7 + p.vy) * dt;
      const pulls = p.k === 'chest' ? (p.big && p.t > 1.4) : (d * d < m2 || (S.magnetT > 0 && (p.k === 'pearl' || (p.k === 'coin' && S.act && S.act.k === 'dorada'))));
      if (pulls) p.home = true;
    }
    if (d < MOON_R * (p.k === 'chest' ? 1.2 : 0.9)) collect(p);
  }
  if (S.pickups.some(p => p.got)) S.pickups = S.pickups.filter(p => { if (p.got) { p.view.destroy(); if (p.glow) p.glow.destroy(); } return !p.got; });
  // the treasure of a wreck: stay over it while the ring fills
  for (const w of NEAR_PROPS) {
    if (!w.loot) continue;
    if (Math.hypot(w.x - S.x, w.y - S.y) < w.r + 14) { w.open = (w.open || 0) + dt / 1.5; if (w.open >= 1) openWreck(w); }
    else if (w.open) w.open = Math.max(0, w.open - dt);
  }
}
function collect(p) {
  p.got = true;
  if (p.k === 'pearl') { gainXp(p.v); sfx('pop', S.lv); puff({ add: true, tex: FX.dot, x: S.x, y: S.y - 4, life: 0.2, s0: 30, s1: 46, tint: COL.lilac, a: 0.35 }); }
  else if (p.k === 'coin') { S.coins += S.st.coins; sfx('coin'); }
  else if (p.k === 'starfish') healMoon(25);
  else if (p.k === 'shell') { S.magnetT = 2.5; sfx('heal'); banner('¡Caracola imán!', 'Todas las perlas vienen a ti'); }
  else if (p.k === 'chest') openChest(p.big);
}
function openWreck(w) {
  w.loot = false; w.open = 0;
  if (w.glow) { w.glow.destroy(); w.glow = null; }
  sfx('coin'); sparks(w.x, w.y - 6, COL.gold, 14, 220, 10); numText(w.x, w.y - 50, '¡Tesoro!', 0xffd36b, 18);
  for (let i = 0; i < randi(8, 14); i++) { const p = dropPickup('coin', w.x, w.y); const a = rand(0, TAU), v = rand(80, 200); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; }
  if (Math.random() < 0.35) dropPickup('chest', w.x, w.y + 30);
  else dropPearl(w.x, w.y, 25);
}
function drawPickups() {
  for (const p of S.pickups) {
    const vis = onScreen(p.x, p.y, 30); p.view.visible = vis;
    if (p.glow) { p.glow.visible = vis; p.glow.position.set(p.x, p.y); p.glow.alpha = 0.45 + 0.2 * Math.sin(T * 6 + p.ph); }
    if (!vis) continue;
    const bob = Math.sin(T * 3 + p.ph) * 1.5;
    p.view.position.set(p.x, p.y + bob);
    if (p.k === 'pearl') {
      p.view.scale.set(p.size / 32 * (1 + 0.08 * Math.sin(T * 5 + p.ph)));
      if (Math.random() < 0.004) puff({ add: true, tex: FX.star, x: p.x + 3, y: p.y - 4, life: 0.4, s0: 9, s1: 2, tint: 0xffffff });
    } else if (p.k === 'coin') setFrame(p.view, `coin${Math.floor(T * 10 + p.ph * 3) % 6}`, PICK_ART.coin[1]);
    else if (p.k === 'starfish') p.view.rotation = Math.sin(T * 2 + p.ph) * 0.3;
  }
}
