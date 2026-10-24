
// =====================================================================
// WEAPONS: the moon's rays and its sharks attack on their own; the tsunami waits for the button
// =====================================================================
// ---- Rayo lunar: bolts of moonlight that bend towards the nearest enemies (the Lanza de plata: huge, and through everything)
const SHOTPOOL = [];
function rayoTick(dt) {
  const lv = S.weapons.rayo || 0; if (!lv) return;
  const Wp = WEAPONS.rayo, i = lv - 1, evo = S.evo.rayo;
  S.rayCd -= dt; if (S.rayCd > 0) return;
  const n = evo ? 4 : Wp.count[i], ts = nearestEnemies(n, 400), b = S.boss;
  if (b && b.hittable && dist2(b.x, b.y, S.x, S.y) < 430 * 430) ts.unshift(b);
  if (!ts.length) { S.rayCd = 0.12; return; }
  S.rayCd = (evo ? 0.6 : Wp.cd[i]) * S.st.cd;
  for (let k = 0; k < n; k++) {
    const t = ts[k % ts.length], a = Math.atan2(t.y - S.y, t.x - S.x) + (k - 0.5) * 0.18 + rand(-0.05, 0.05);
    fireShot({ a, v: 620, t, dmg: (evo ? 30 : Wp.dmg[i]) * S.st.dmg, pierce: evo ? 99 : Wp.pierce[i], size: evo ? 1.9 : 1, tint: evo ? 0xeaf6ff : COL.ray });
  }
  sfx('ray', null, S.x);
}
// a shot leaves the moon: o = a (angle), v, t (target to bend after, or none), dmg, pierce, size, tint, kind ('ice' slows), freeze, life
function fireShot(o) {
  const ar = S.st.area * (o.size || 1), tint = o.tint ?? COL.ray;
  let view = SHOTPOOL.pop();
  if (!view) { view = new PIXI.Sprite(FX.streak); view.anchor.set(0.72, 0.5); view.blendMode = 'add'; }
  view.visible = true; view.tint = tint; view.scale.set(56 * ar / 128, 18 * ar / 64); L.fx.addChild(view);
  const x = S.x + Math.cos(o.a) * MOON_R * 0.8, y = S.y - 6 + Math.sin(o.a) * MOON_R * 0.8;
  S.shots.push({ x, y, vx: Math.cos(o.a) * o.v, vy: Math.sin(o.a) * o.v, dmg: o.dmg, pierce: o.pierce || 0, life: o.life || 0.8, hits: [], t: o.t || null, view, done: false,
    tint, rr: 10 * ar, kind: o.kind || 'ray', freeze: o.freeze || 0 });
  puff({ add: true, tex: FX.dot, x, y, life: 0.15, s0: 22 * ar, s1: 30 * ar, tint: o.kind === 'ice' ? 0xdff6ff : COL.moon, a: 0.8 });
}
function shotsTick(dt) {
  for (const sh of S.shots) {
    sh.life -= dt;
    // it bends after its target while the target lives
    const t = sh.t;
    if (t && !t.dead && (t !== S.boss || t.hittable)) {
      const want = Math.atan2(t.y - sh.y, t.x - sh.x), cur = Math.atan2(sh.vy, sh.vx), sp = Math.hypot(sh.vx, sh.vy);
      let da = want - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      const na = cur + clamp(da, -8 * dt, 8 * dt); sh.vx = Math.cos(na) * sp; sh.vy = Math.sin(na) * sp;
    }
    sh.x += sh.vx * dt; sh.y += sh.vy * dt;
    sh.view.position.set(sh.x, sh.y); sh.view.rotation = Math.atan2(sh.vy, sh.vx);
    puff({ add: true, tex: sh.kind === 'ice' ? FX.star : FX.dot, x: sh.x + rand(-2, 2), y: sh.y + rand(-2, 2), life: 0.28, s0: sh.rr * 0.9, s1: 2, tint: sh.tint, a: 0.7 });
    const rr = sh.rr;
    eachNear(sh.x, sh.y, 50 + rr, e => {
      if (sh.done || sh.hits.includes(e)) return;
      if (dist2(e.x, e.y, sh.x, sh.y) < (e.r * 0.85 + rr) ** 2) {
        hurt(e, sh.dmg, sh.vx * 0.12, sh.vy * 0.12); sparks(sh.x, sh.y, sh.tint, 5, 130, 7);
        if (sh.kind === 'ice') { if (!e.d.noIce) e.slowT = S.t + 1.6; if (sh.freeze) freezeEnemy(e, sh.freeze); }
        sh.hits.push(e); if (sh.pierce-- <= 0) sh.done = true;
      }
    });
    const b = S.boss;
    if (!sh.done && b && b.hittable && !sh.hits.includes(b) && dist2(b.x, b.y - 20, sh.x, sh.y) < (b.r + rr) ** 2) { hurtBoss(sh.dmg); sparks(sh.x, sh.y, sh.tint, 6, 140, 8); sh.hits.push(b); if (sh.pierce-- <= 0) sh.done = true; }
    if (sh.life <= 0) sh.done = true;
  }
  if (S.shots.some(s => s.done)) S.shots = S.shots.filter(s => { if (s.done) { s.view.visible = false; s.view.removeFromParent(); SHOTPOOL.push(s.view); } return !s.done; });
}
// frozen in place for a while: it can't move or hurt, and it takes a third more damage (creatures of the ice thaw fast)
function freezeEnemy(e, t) {
  if ((e.d.heavy && e.elite) || e.cap) t *= 0.5;
  if (e.d.noIce) t *= 0.4;
  if ((e.frozen || 0) < S.t) for (let i = 0; i < 4; i++) puff({ add: true, tex: FX.star, x: e.x + rand(-e.r, e.r), y: e.y + rand(-e.r, e.r * 0.5), life: 0.5, s0: 10, s1: 3, tint: 0xd8f4ff });
  e.frozen = Math.max(e.frozen || 0, S.t + t); e.kx = e.ky = 0;
}

// ---- Tiburones: they circle the moon under the water, fin up, and bite whoever comes close
function newShark() {
  const body = spr('shark', 0.5, L.sea); body.tint = 0x2b6a94; body.alpha = 0.85;
  const fin = spr('sharkFin', 0.5, L.body);
  return { x: S.x, y: S.y, a: 0, bite: 0, wakeT: 0, body, fin };
}
function sharkTick(dt) {
  const lv = S.weapons.tiburon || 0; if (!lv) return;
  const Wp = WEAPONS.tiburon, i = lv - 1, n = Wp.count[i];
  while (S.sharks.length < n) S.sharks.push(newShark());
  const orbit = Wp.orbit[i] * S.st.area, dmg = Wp.dmg[i] * S.st.dmg * (S.evo.tiburon ? 1.4 : 1), rr = 18 * S.st.area;
  if (S.evo.tiburon) megaTick(dt);
  S.sharkA += Wp.spin[i] * dt;
  S.sharks.forEach((sk, k) => {
    const a = S.sharkA + k / n * TAU;
    sk.a = a; sk.x = S.x + Math.cos(a) * orbit; sk.y = S.y + Math.sin(a) * orbit * 0.9;
    sk.bite = Math.max(0, sk.bite - dt);
    eachNear(sk.x, sk.y, 60, e => {
      if ((e.sharkT || 0) > S.t || dist2(e.x, e.y, sk.x, sk.y) > (e.r + rr) ** 2) return;
      e.sharkT = S.t + 0.45; sk.bite = 0.18;
      const dx = e.x - S.x, dy = e.y - S.y, d = Math.hypot(dx, dy) || 1;
      hurt(e, dmg, dx / d * 190, dy / d * 190); sfx('bite', null, e.x); splash(e.x, e.y, 0.45);
    });
    const b = S.boss;
    if (b && b.hittable && b.sharkT <= S.t && dist2(b.x, b.y, sk.x, sk.y) < (b.r + rr) ** 2) { b.sharkT = S.t + 0.45; hurtBoss(dmg); sk.bite = 0.18; splash(sk.x, sk.y, 0.5); }
  });
}

// ---- Megalodón (the sharks' evolution): a giant shark circles wider and slower; every bite heals the moon
function megaTick(dt) {
  if (!S.mega) { const body = spr('mega', 0.62, L.sea); body.tint = 0x24577e; body.alpha = 0.9; const fin = spr('sharkFin', 0.95, L.body); S.mega = { x: S.x, y: S.y, a: 0, bite: 0, wakeT: 0, body, fin }; }
  const m = S.mega, orbit = 150 * S.st.area, rr = 34 * S.st.area;
  m.a -= 1.5 * dt; m.x = S.x + Math.cos(m.a) * orbit; m.y = S.y + Math.sin(m.a) * orbit * 0.9; m.bite = Math.max(0, m.bite - dt);
  eachNear(m.x, m.y, 80, e => {
    if ((e.megaT || 0) > S.t || dist2(e.x, e.y, m.x, m.y) > (e.r + rr) ** 2) return;
    e.megaT = S.t + 0.5; m.bite = 0.2;
    const dx = e.x - S.x, dy = e.y - S.y, d = Math.hypot(dx, dy) || 1;
    hurt(e, 45 * S.st.dmg, dx / d * 320, dy / d * 320, true); sfx('bite', null, e.x); splash(e.x, e.y, 0.8);
    if (!S.ended) S.hp = Math.min(S.maxHp, S.hp + 1.5);
  });
  const b = S.boss;
  if (b && b.hittable && (b.megaT || 0) <= S.t && dist2(b.x, b.y, m.x, m.y) < (b.r + rr) ** 2) { b.megaT = S.t + 0.5; hurtBoss(60 * S.st.dmg); m.bite = 0.2; splash(m.x, m.y, 1); }
}
