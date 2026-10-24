
// =====================================================================
// MORE WEAPONS: rings of energy, ice shards, lightning, meteorites and whirlpools, and their evolutions
// (each keeps its own cooldown in S.cds; what lingers lives in S.rings, S.bolts, S.rocks, S.pools)
// =====================================================================
// true when a weapon's cooldown has run out; then it waits cd again
function ready(k, dt, cd, first = 0.8) {
  S.cds[k] = (S.cds[k] ?? first) - dt;
  if (S.cds[k] > 0) return false;
  S.cds[k] = cd * S.st.cd; return true;
}
// enemies near the moon in random order (lightning and meteorites pick from them)
function nearShuffled(range) {
  const out = [], r2 = range * range;
  for (const e of S.enemies) if (!e.dead && dist2(e.x, e.y, S.x, S.y) < r2) out.push(e);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
const bossNear = r => { const b = S.boss; return b && b.hittable && dist2(b.x, b.y, S.x, S.y) < r * r ? b : null; };

// ---- Ondas lunares: a ring runs out from the moon, hits and pushes (Marea viva: huge, and pulls the pearls in)
function ondasTick(dt) {
  const lv = S.weapons.ondas || 0; if (!lv) return;
  const Wp = WEAPONS.ondas, i = lv - 1, evo = S.evo.ondas;
  if (!ready('ondas', dt, evo ? 2.2 : Wp.cd[i])) return;
  const n = evo ? 2 : Wp.n[i];
  for (let k = 0; k < n; k++) S.rings.push({ t: -k * 0.32, R: (evo ? 250 : Wp.R[i]) * S.st.area, dmg: (evo ? 36 : Wp.dmg[i]) * S.st.dmg, kb: evo ? 560 : 300, hit: new Set(), col: evo ? 0xffe2a0 : 0xb9a8ff, pull: evo, f: 0, r: MOON_R });
  sfx('tide', null, S.x);
}
function ringsTick(dt) {
  for (const r of S.rings) {
    r.t += dt; if (r.t < 0) continue;
    const f = r.f = Math.min(1, r.t / 0.55); r.r = MOON_R + (r.R - MOON_R) * (1 - Math.pow(1 - f, 2));
    eachNear(S.x, S.y, r.r + 40, e => {
      if (r.hit.has(e)) return;
      const dx = e.x - S.x, dy = e.y - S.y, d = Math.hypot(dx, dy) || 1;
      if (d < r.r + e.r) { r.hit.add(e); hurt(e, r.dmg, dx / d * r.kb, dy / d * r.kb); }
    });
    const b = S.boss;
    if (b && b.hittable && !r.hit.has(b) && Math.hypot(b.x - S.x, b.y - S.y) < r.r + b.r) { r.hit.add(b); hurtBoss(r.dmg); }
    washShots(S.x, S.y, r.r);
    if (r.pull) for (const p of S.pickups) if (p.k === 'pearl' && dist2(p.x, p.y, S.x, S.y) < r.r * r.r) p.home = true;
  }
  if (S.rings.some(r => r.t >= 0.55)) S.rings = S.rings.filter(r => r.t < 0.55);
}

// ---- Escarcha: a fan of ice shards at the nearest ship; they slow (Glaciar: they freeze solid and go through)
function escarchaTick(dt) {
  const lv = S.weapons.escarcha || 0; if (!lv) return;
  const Wp = WEAPONS.escarcha, i = lv - 1, evo = S.evo.escarcha;
  const t = nearestEnemies(1, 380)[0] || bossNear(420);
  if (!t) { S.cds.escarcha = Math.max(S.cds.escarcha ?? 0, 0.15); return; }
  if (!ready('escarcha', dt, evo ? 1.0 : Wp.cd[i])) return;
  const n = evo ? 7 : Wp.count[i], a0 = Math.atan2(t.y - S.y, t.x - S.x);
  for (let k = 0; k < n; k++) fireShot({ a: a0 + (k - (n - 1) / 2) * 0.16, v: 540, dmg: (evo ? 22 : Wp.dmg[i]) * S.st.dmg, pierce: evo ? 2 : 0, size: 0.8,
    tint: 0xbfeaff, kind: 'ice', freeze: evo ? 1.6 : Wp.freeze[i], life: 0.7 });
  sfx('zap', null, S.x);
}

// ---- Tormenta: bolts fall from the sky on nearby ships and jump to the next (Ira de Poseidón: a storm that never stops)
function zig(x0, y0, x1, y1, n, j) {
  const pts = [x0, y0];
  for (let i = 1; i < n; i++) { const f = i / n; pts.push(lerp(x0, x1, f) + rand(-j, j), lerp(y0, y1, f) + rand(-j * 0.4, j * 0.4)); }
  pts.push(x1, y1); return pts;
}
// one bolt from the sky onto a ship, then jumps to the closest ones it hasn't hit
function strike(e, dmg, chain, col = 0xcfe0ff) {
  S.bolts.push({ pts: zig(e.x + rand(-50, 50), e.y - 340, e.x, e.y - 6, 9, 16), t: 0, life: 0.24, col });
  hurt(e, dmg); sparks(e.x, e.y - 4, col, 6, 160, 8); puff({ add: true, tex: FX.dot, x: e.x, y: e.y, life: 0.25, s0: 40, s1: 70, tint: col, a: 0.7 });
  let cur = e; const hit = new Set([e]);
  for (let c = 0; c < chain; c++) {
    let best = null, bd = 160 * 160;
    eachNear(cur.x, cur.y, 160, o => { if (hit.has(o)) return; const q = dist2(o.x, o.y, cur.x, cur.y); if (q < bd) { bd = q; best = o; } });
    if (!best) break;
    S.bolts.push({ pts: zig(cur.x, cur.y - 8, best.x, best.y - 8, 6, 10), t: 0, life: 0.2, col });
    hurt(best, dmg * 0.75); sparks(best.x, best.y, col, 4, 120, 6); hit.add(best); cur = best;
  }
}
function boltOnBoss(b, dmg, col = 0xcfe0ff) {
  S.bolts.push({ pts: zig(b.x + rand(-40, 40), b.y - 400, b.x + rand(-30, 30), b.y - 40, 10, 18), t: 0, life: 0.26, col });
  hurtBoss(dmg); sparks(b.x, b.y - 40, col, 8, 180, 10);
}
function tormentaTick(dt) {
  const lv = S.weapons.tormenta || 0; if (!lv) return;
  const Wp = WEAPONS.tormenta, i = lv - 1, evo = S.evo.tormenta;
  if (!ready('tormenta', dt, evo ? 0.8 : Wp.cd[i], 1.2)) return;
  const n = evo ? 6 : Wp.n[i], chain = evo ? 3 : Wp.chain[i], dmg = (evo ? 40 : Wp.dmg[i]) * S.st.dmg;
  const ts = nearShuffled(340).slice(0, n), b = bossNear(400);
  if (b) boltOnBoss(b, dmg * 1.5);
  if (!ts.length && !b) { S.cds.tormenta = 0.2; return; }
  for (const e of ts) strike(e, dmg, chain);
  sfx('thunder', null, ts[0] ? ts[0].x : S.x); cam.shake = Math.max(cam.shake, 0.15);
}

// ---- Meteoritos: moon rocks fall from the sky among the ships (Cometa: and a giant comet every few seconds)
function meteorosTick(dt) {
  const lv = S.weapons.meteoros || 0; if (!lv) return;
  const Wp = WEAPONS.meteoros, i = lv - 1, evo = S.evo.meteoros;
  if (evo && ready('cometa', dt, 6, 2)) {
    const t = nearShuffled(300)[0] || bossNear(360) || { x: S.x + rand(-160, 160), y: S.y + rand(-160, 160) };
    dropRock(t.x, t.y, 150 * S.st.area, 160 * S.st.dmg, true);
  }
  if (!ready('meteoros', dt, evo ? 1.8 : Wp.cd[i], 1)) return;
  const n = evo ? 5 : Wp.n[i], r = (evo ? 70 : Wp.r[i]) * S.st.area, dmg = (evo ? 50 : Wp.dmg[i]) * S.st.dmg;
  const ts = nearShuffled(380), b = bossNear(400);
  for (let k = 0; k < n; k++) {
    const t = k === 0 && b ? b : ts[k] || { x: S.x + rand(-220, 220), y: S.y + rand(-220, 220) };
    dropRock(t.x + rand(-14, 14), t.y + rand(-14, 14), r, dmg, false, k * 0.12);
  }
}
function dropRock(x, y, r, dmg, big, delay = 0) {
  const T0 = big ? 1.1 : 0.75;
  const view = spr('meteor', big ? 2.2 : 0.95, L.body); view.visible = false;
  const g = glow(L.fx, big ? 0xffc85a : 0xffe2a0, big ? 150 : 60, 0); g.anchor.set(0.5);
  S.rocks.push({ x, y, r, dmg, big, t: -delay, T: T0, view, g, done: false });
}
function rocksTick(dt) {
  for (const k of S.rocks) {
    k.t += dt;
    if (k.t < k.T || k.done) continue;
    k.done = true;
    eachNear(k.x, k.y, k.r + 40, e => {
      const dx = e.x - k.x, dy = e.y - k.y, d = Math.hypot(dx, dy) || 1;
      if (d < k.r + e.r) hurt(e, k.dmg, dx / d * 240, dy / d * 240, k.big);
    });
    const b = S.boss; if (b && b.hittable && Math.hypot(b.x - k.x, b.y - k.y) < k.r + b.r) hurtBoss(k.dmg);
    sparks(k.x, k.y, COL.gold, k.big ? 22 : 10, k.big ? 300 : 200, k.big ? 14 : 9); splash(k.x, k.y, k.big ? 2 : 1);
    puff({ add: true, tex: FX.ring, x: k.x, y: k.y, life: 0.45, s0: k.r * 0.6, s1: k.r * 2.4, tint: 0xffd36b, a: 0.85 });
    for (let i = 0; i < (k.big ? 10 : 5); i++) { const a = rand(0, TAU), v = rand(80, 200); puff({ tex: FX.chip, x: k.x, y: k.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, s0: 8, s1: 4, rot: a, vr: rand(-8, 8), tint: 0x9c968a, drag: 2.5 }); }
    if (k.big) { shock(k.x, k.y, 30, 150, 500, 520); cam.shake = Math.max(cam.shake, 0.8); sfx('bigboom', null, k.x); vib('heavy'); }
    else { shock(k.x, k.y, 12, 80, 380, 200); cam.shake = Math.max(cam.shake, 0.25); sfx('boom', null, k.x); }
    k.view.destroy(); k.g.destroy();
  }
  if (S.rocks.some(k => k.done)) S.rocks = S.rocks.filter(k => !k.done);
}

// ---- Remolinos: whirlpools open among the ships, pull them in and spin them under (Maelstrom: a giant one travels with the moon)
function remolinoTick(dt) {
  const lv = S.weapons.remolino || 0; if (!lv) return;
  const Wp = WEAPONS.remolino, i = lv - 1, evo = S.evo.remolino;
  if (evo) {
    if (!S.pools.some(p => p.follow)) S.pools.push(newPool(S.x, S.y, 150, 32, 1e9, true));
    const m = S.pools.find(p => p.follow); m.r = 150 * S.st.area; m.dps = 32 * S.st.dmg;
  }
  if (!ready('remolino', dt, Wp.cd[i], 1.5)) return;
  const n = Wp.n[i], ts = nearShuffled(260);
  for (let k = 0; k < n; k++) {
    const t = ts[k] || { x: S.x + rand(-200, 200), y: S.y + rand(-200, 200) };
    S.pools.push(newPool(t.x, t.y, Wp.r[i] * S.st.area, Wp.dps[i] * S.st.dmg, Wp.dur[i], false));
  }
  sfx('whirl', null, S.x);
}
// a whirlpool on the water: the sea's own painted vortex, spinning (the Maelstrom's is bigger and follows the moon)
function newPool(x, y, r, dps, life, follow) {
  const view = new PIXI.Sprite(VORTEX_TEX); view.anchor.set(0.5); view.scale.set(0); L.flat.addChild(view);
  return { x, y, r, dps, t: 0, life, a: rand(0, TAU), follow, tick: 0, view };
}
function poolsTick(dt) {
  for (const p of S.pools) {
    p.t += dt; p.a += 3.2 * dt; p.tick += dt;
    if (p.follow) { const k = Math.min(1, 2.2 * dt); p.x += (S.x - p.x) * k; p.y += (S.y - p.y) * k; }
    const grow = Math.min(1, p.t / 0.4) * Math.min(1, (p.life - p.t) / 0.4), R = p.r * grow, bite = p.tick >= 0.3;
    eachNear(p.x, p.y, R + 30, e => {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (d > R + e.r * 0.5 || (e.frozen || 0) > S.t) return;
      // pulled towards the eye and spun around it
      const pull = (e.d.heavy ? 50 : 130) * (1 - d / (R + e.r)) + 25;
      e.x += (dx / d * pull - dy / d * 95) * dt; e.y += (dy / d * pull + dx / d * 95) * dt;
      if (bite) hurt(e, p.dps * 0.3);
    });
    const b = S.boss; if (bite && b && b.hittable && Math.hypot(b.x - p.x, b.y - p.y) < R + b.r * 0.6) hurtBoss(p.dps * 0.3);
    if (bite) p.tick = 0;
    if (Math.random() < 0.5) { const a = rand(0, TAU), rr = R * rand(0.5, 1); puff({ tex: FX.foam, x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr * 0.8, vx: -Math.sin(a) * 60, vy: Math.cos(a) * 48, life: 0.6, s0: 8, s1: 14, a: 0.35, tint: COL.foam, drag: 1 }); }
  }
  if (S.pools.some(p => p.t >= p.life)) S.pools = S.pools.filter(p => { if (p.t >= p.life) p.view.destroy(); return p.t < p.life; });
}

// ---- drawn every frame: the rings, the bolts, the falling rocks and their marks, the whirlpools
function drawArms() {
  for (const r of S.rings) {
    if (r.t < 0) continue;
    const a = 1 - r.f;
    MK.circle(S.x, S.y, r.r).stroke({ width: 14 * a + 3, color: r.col, alpha: 0.3 * a + 0.08 });
    FXG.circle(S.x, S.y, r.r).stroke({ width: 4 * a + 1.5, color: 0xffffff, alpha: 0.7 * a });
  }
  for (const k of S.rocks) {
    if (k.t < 0) continue;
    const f = Math.min(1, k.t / k.T);
    MK.circle(k.x, k.y, k.r).fill({ color: k.big ? 0xffb44a : 0xffd36b, alpha: 0.08 + 0.1 * f }).stroke({ width: 2, color: 0xffd36b, alpha: 0.65 });
    MK.circle(k.x, k.y, k.r * f).fill({ color: 0xffc85a, alpha: 0.16 });
    // the rock comes down at a slant out of the night sky, burning
    const hx = k.x - 240 * (1 - f), hy = k.y - 460 * (1 - f) - 8;
    k.view.visible = true; k.view.position.set(hx, hy); k.view.zIndex = k.y + 1e5; k.view.rotation += 0.2;
    k.g.position.set(hx, hy); k.g.alpha = 0.9;
    puff({ add: true, tex: FX.dot, x: hx + rand(-3, 3), y: hy + rand(-3, 3), life: 0.35, s0: k.big ? 34 : 16, s1: 4, tint: 0xffb44a, a: 0.8 });
  }
  for (const b of S.bolts) {
    const a = Math.max(0, 1 - b.t / b.life);
    FXG.poly(b.pts, false).stroke({ width: 7, color: b.col, alpha: 0.35 * a, join: 'round', cap: 'round' });
    FXG.poly(b.pts, false).stroke({ width: 2.2, color: 0xffffff, alpha: 0.95 * a, join: 'round', cap: 'round' });
  }
  for (const p of S.pools) {
    const grow = Math.min(1, p.t / 0.4) * Math.min(1, (p.life - p.t) / 0.4), R = p.r * grow; if (R < 2) continue;
    p.view.position.set(p.x, p.y); p.view.rotation = -p.a; p.view.scale.set(R * 2.3 / 256, R * 2.3 * 0.86 / 256); p.view.alpha = 0.78 * grow;
    for (let arm = 0; arm < 3; arm++) {
      const pts = [];
      for (let j = 0; j <= 18; j++) { const f = j / 18, ang = p.a + arm * TAU / 3 + f * 3.4, rr = R * (1 - f * 0.88); pts.push(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr * 0.82); }
      MK.poly(pts, false).stroke({ width: 3.2, color: 0xd9f3ff, alpha: 0.5 * grow, cap: 'round', join: 'round' });
    }
    MK.ellipse(p.x, p.y, R, R * 0.82).stroke({ width: 2.4, color: 0xe6f6ff, alpha: 0.45 * grow });
  }
}
function armsTick(dt) {
  ondasTick(dt); ringsTick(dt); escarchaTick(dt); tormentaTick(dt); meteorosTick(dt); rocksTick(dt); remolinoTick(dt); poolsTick(dt);
  for (const b of S.bolts) b.t += dt;
  if (S.bolts.some(b => b.t >= b.life)) S.bolts = S.bolts.filter(b => b.t < b.life);
}
