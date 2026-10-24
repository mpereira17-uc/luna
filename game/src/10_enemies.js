
// =====================================================================
// THE FLEET AND THE CREATURES: what each sea sends from every side, how each kind moves and attacks,
// the director that sends them, the special moments, the legendary captains, and their cannonballs
// (and the reefs: a ship thrown against one breaks its hull)
// =====================================================================
// a grid of who is where, rebuilt every frame (separation, weapons, the tsunami); a faded ghost isn't there
const GRID = 64, GRIDM = new Map();
const gkey = (i, j) => i * 100003 + j;
function gridBuild() {
  GRIDM.clear();
  for (const e of S.enemies) {
    if (e.dead || e.faded) continue;
    const k = gkey(Math.floor(e.x / GRID), Math.floor(e.y / GRID));
    let c = GRIDM.get(k); if (!c) GRIDM.set(k, c = []); c.push(e);
  }
}
function eachNear(x, y, r, fn) {
  const i0 = Math.floor((x - r) / GRID), i1 = Math.floor((x + r) / GRID), j0 = Math.floor((y - r) / GRID), j1 = Math.floor((y + r) / GRID);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = GRIDM.get(gkey(i, j)); if (c) for (const e of c) if (!e.dead && !e.faded) fn(e); }
}
const blocked = (x, y, r) => propsNear(x, y).some(p => p.block && Math.hypot(p.x - x, p.y - y) < p.r + r + 10);

// ---- sprites, reused: a sunk ship's sprite comes back as the next one of its kind
const VIEWS = {};
function enemyView(e) {
  const pool = VIEWS[e.type] || (VIEWS[e.type] = []);
  let v = pool.pop();
  if (!v) {
    v = spr(e.d.spr[0], e.s);
    if (e.d.fly) { v.sh = new PIXI.Sprite(SHADOW); v.sh.anchor.set(0.5); }
    // a serpent is a head and a trail of coils
    if (e.d.segs) { v.segs = []; for (let k = 0; k < e.d.segs; k++) v.segs.push(spr(k === e.d.segs - 1 ? 'serpTail' : 'serpBody', e.s * (1 - k * 0.05))); }
  }
  v.visible = true; v.alpha = 1; v.rotation = 0; v.tint = e.tint;
  L.body.addChild(v);
  if (v.sh) { v.sh.visible = true; v.sh.scale.set(e.r * 2.6 / 128); L.marks.addChildAt(v.sh, 0); }
  if (v.segs) for (const sg of v.segs) { sg.visible = true; sg.alpha = 1; sg.tint = e.tint; L.body.addChild(sg); }
  if (e.elite || e.cap) { e.glow = glow(L.fx, e.cap ? e.tint : 0xffc65a, e.r * 5, 0.5); e.glow.anchor.set(0.5); }
  return v;
}
function freeView(e) {
  const v = e.view; if (!v) return;
  e.view = null; v.visible = false; v.removeFromParent();
  if (v.sh) { v.sh.visible = false; v.sh.removeFromParent(); }
  if (v.segs) for (const sg of v.segs) { sg.visible = false; sg.removeFromParent(); }
  if (e.glow) { e.glow.destroy(); e.glow = null; }
  (VIEWS[e.type] || (VIEWS[e.type] = [])).push(v);
}

// ---- something comes into the sea; everything gets tougher as the night goes on
function spawnEnemy(type, x, y, o = {}) {
  const d = EN[type], hpMul = 1 + S.t / 60 * 0.3, cap = o.cap ? CAPTAINS[o.cap] : null;
  const big = o.elite ? 1.35 : cap ? 1.3 : 1;
  const e = { type, d, x, y, vx: 0, vy: 0, kx: 0, ky: 0, hp: (cap ? cap.hp : d.hp) * hpMul * (o.elite ? 9 : 1), r: d.r * big, spd: d.spd * (o.elite ? 0.85 : 1) * rand(0.92, 1.08),
    ft: rand(0, 2), hit: 0, wakeT: 0, elite: !!o.elite, cap: o.cap || null, path: o.path || null, dead: false, gone: false, slide: null,
    tint: cap ? cap.tint : o.tint || d.tint || 0xffffff, fireT: rand(1.2, 2.6), abT: 3, seed: rand(0, 6), trail: null, born: S.t, life: o.life || 0 };
  e.maxHp = e.hp; e.s = d.s * big;
  if (d.segs) e.trail = [];
  e.view = enemyView(e);
  S.enemies.push(e);
  return e;
}
// a point just past the edge of the screen, more often ahead of where the moon is going
function edgePoint(margin = 70) {
  const vw = viewW() / 2 + margin, vh = viewH() / 2 + margin, moving = Math.hypot(S.vx, S.vy) > 20;
  const a = moving && Math.random() < 0.55 ? Math.atan2(S.vy, S.vx) + rand(-1.1, 1.1) : rand(0, TAU);
  const c = Math.cos(a), s = Math.sin(a), k = Math.min(vw / Math.max(Math.abs(c), 1e-4), vh / Math.max(Math.abs(s), 1e-4));
  return { x: cam.x + c * k, y: cam.y + s * k };
}
const passesIslands = d => d.fly || d.ai === 'ghost';
function spawnEdge(type) {
  for (let i = 0; i < 5; i++) { const p = edgePoint(); if (passesIslands(EN[type]) || !blocked(p.x, p.y, EN[type].r)) return spawnEnemy(type, p.x, p.y); }
  return null;
}
// left far behind: it sails round to come at the moon again from ahead
function relocate(e) {
  for (let i = 0; i < 5; i++) { const p = edgePoint(90); if (passesIslands(e.d) || !blocked(p.x, p.y, e.r)) { e.x = p.x; e.y = p.y; e.vx = e.vy = e.kx = e.ky = 0; if (e.trail) e.trail.length = 0; return; } }
}
// thrown onto a reef or an islet: the hull breaks
function crash(e, prop, kb) {
  e.kx = e.ky = 0;
  sfx('crash', null, e.x); cam.shake = Math.max(cam.shake, 0.25);
  for (let i = 0; i < 6; i++) { const a = rand(0, TAU), v = rand(60, 150); puff({ tex: FX.chip, x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7, s0: 11, s1: 6, rot: rand(0, TAU), vr: rand(-9, 9), tint: COL.wood, drag: 2.5 }); }
  splash(e.x, e.y, 0.8);
  hurt(e, e.maxHp * (e.elite || e.cap ? 0.08 : 0.5) + 8 + kb * 0.04, 0, 0, true);
}
// a fire ship blows up: it hurts the moon if it reaches it, and every ship around it
function explode(e) {
  sfx('boom', null, e.x); cam.shake = Math.max(cam.shake, 0.35);
  sparks(e.x, e.y, 0xff9a4a, 14, 240, 11); splash(e.x, e.y, 1.2); shock(e.x, e.y, 14, 90, 400, 220);
  puff({ add: true, tex: FX.ring, x: e.x, y: e.y, life: 0.4, s0: 20, s1: 150, tint: 0xff8a3d, a: 0.9 });
  for (let i = 0; i < 8; i++) { const a = rand(0, TAU), v = rand(30, 90); puff({ add: true, tex: FX.dot, x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: rand(0.5, 0.9), s0: rand(14, 24), s1: 4, tint: 0xff6a2a, a: 0.8, drag: 2 }); }
  eachNear(e.x, e.y, 80, o => { if (o !== e && dist2(o.x, o.y, e.x, e.y) < 75 * 75) hurt(o, 30, (o.x - e.x) * 3, (o.y - e.y) * 3, true); });
  if (Math.hypot(S.x - e.x, S.y - e.y) < 70) hurtMoon(e.reached ? 16 : 8);
}

// ---- enemy shots: cannonballs, fireballs, harpoons; the moon dodges them, the tsunami and the rings wash them away
const ESHOT_ART = { ball: ['ball', 1.0, 0xffffff], fire: ['lava', 1.0, 0xffffff], harpoon: ['shard', 1.6, 0xd8e4f0], ghost: ['orb', 0.9, 0x9dffc8] };
function eshot(x, y, a, v, dmg, kind = 'ball', from = null) {
  const [n, s, tint] = ESHOT_ART[kind], view = spr(n, s, L.body); view.anchor.set(0.5); view.tint = tint;
  S.eshots.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dmg, kind, life: 2.6, r: kind === 'harpoon' ? 8 : 7, view, from, done: false });
}
function eshotsTick(dt) {
  for (const b of S.eshots) {
    b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    b.view.position.set(b.x, b.y); b.view.zIndex = b.y + 30; if (b.kind === 'harpoon') b.view.rotation = Math.atan2(b.vy, b.vx);
    if (b.kind === 'fire' && Math.random() < 0.7) puff({ add: true, tex: FX.dot, x: b.x, y: b.y, life: 0.3, s0: 12, s1: 3, tint: 0xff7a2a, a: 0.8 });
    else if (b.kind === 'ghost' && Math.random() < 0.6) puff({ add: true, tex: FX.dot, x: b.x, y: b.y, life: 0.35, s0: 12, s1: 3, tint: 0x6affb0, a: 0.7 });
    else if (b.kind === 'ball' && Math.random() < 0.3) puff({ tex: FX.foam, x: b.x, y: b.y + 6, life: 0.4, s0: 5, s1: 9, a: 0.3, tint: COL.foam });
    if (!S.ended && !S.hidden && dist2(b.x, b.y, S.x, S.y) < (MOON_R * 0.8 + b.r) ** 2) {
      b.done = true; hurtMoon(b.dmg); splash(b.x, b.y, 0.6);
      if (b.kind === 'harpoon') { S.slowT = S.t + 2.2; banner('¡Arpón!', 'La luna va más despacio'); if (b.from && !b.from.dead) { const dx = b.from.x - S.x, dy = b.from.y - S.y, d = Math.hypot(dx, dy) || 1; S.x += dx / d * 50; S.y += dy / d * 50; } }
      if (b.kind === 'fire') sparks(b.x, b.y, 0xff8a3d, 6, 140, 8);
    }
    if (b.life <= 0 && !b.done) { b.done = true; splash(b.x, b.y, 0.4); }
  }
  if (S.eshots.some(b => b.done)) S.eshots = S.eshots.filter(b => { if (b.done) b.view.destroy(); return !b.done; });
}
// a ring of water or energy washes away the shots it crosses
function washShots(x, y, r) { for (const b of S.eshots) if (!b.done && dist2(b.x, b.y, x, y) < r * r) { b.done = true; puff({ tex: FX.foam, x: b.x, y: b.y, life: 0.4, s0: 8, s1: 16, a: 0.5, tint: COL.foam }); } }
// aim where the moon will be when the shot gets there
function leadAngle(x, y, v) { const d = Math.hypot(S.x - x, S.y - y), t = d / v; return Math.atan2(S.y + S.vy * t * 0.7 - y, S.x + S.vx * t * 0.7 - x); }

// ---- the legendary captains: each one's trick, every few seconds
function capTick(e, dt, d) {
  const c = CAPTAINS[e.cap];
  if (!e.fleeing && S.t - e.born > CAP_TIME) { e.fleeing = true; banner(`${c.name} huye`, 'Húndelo antes de que escape'); }
  if (e.fleeing) return;
  e.abT -= dt;
  if (e.cap === 'sombra' && e.veil > 0) {
    e.veil -= dt;
    if (e.veil <= 0) {
      // out of the veil, closer than before
      const a = rand(0, TAU); e.x = S.x + Math.cos(a) * 170; e.y = S.y + Math.sin(a) * 170; e.faded = false;
      for (let i = 0; i < 12; i++) { const an = rand(0, TAU); puff({ add: true, tex: FX.dot, x: e.x, y: e.y, vx: Math.cos(an) * 120, vy: Math.sin(an) * 120, life: 0.5, s0: 14, s1: 3, tint: 0xb49cff, a: 0.8, drag: 2 }); }
    }
    return;
  }
  if (e.abT > 0 || d > 520) return;
  if (e.cap === 'perla') {
    e.abT = 7;
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + rand(-0.3, 0.3); spawnEnemy('decoy', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, { tint: c.tint }); }
    banner(c.ab, 'Solo una es la de verdad'); sfx('warn');
  } else if (e.cap === 'ballenero') {
    e.abT = 4.5; eshot(e.x, e.y - 6, leadAngle(e.x, e.y, 330), 330, 8, 'harpoon', e); sfx('anchor', null, e.x);
  } else if (e.cap === 'ceniza') {
    e.abT = 5.5; const a0 = Math.atan2(S.y - e.y, S.x - e.x);
    for (let k = -2; k <= 2; k++) eshot(e.x, e.y - 6, a0 + k * 0.22, 200, 10, 'fire');
    sfx('cannon', null, e.x); banner(c.ab, null);
  } else if (e.cap === 'sombra') {
    e.abT = 7; e.veil = 2.5; e.faded = true; sfx('act_nueva'); banner(c.ab, 'Desaparece entre la niebla');
  }
}

// ---- every frame: each kind moves its own way, keeps apart from the rest, goes round islands, hurts the moon on contact
function enemiesTick(dt) {
  gridBuild();
  let touch = 0, near = 0;
  const far = Math.max(viewW(), viewH()) * 0.75 + 260;
  for (const e of S.enemies) {
    if (e.dead) continue;
    e.ft += dt; e.hit = Math.max(0, e.hit - dt);
    const dx = S.x - e.x, dy = S.y - e.y, d = Math.hypot(dx, dy) || 1, frozen = (e.frozen || 0) > S.t, ai = e.d.ai;
    // ghosts fade in and out: faded, nothing touches them and they touch nothing
    if (ai === 'ghost') e.faded = Math.sin(e.ft * 0.9 + e.seed) < -0.45;
    if (e.cap) capTick(e, dt, d);
    if (e.life && S.t - e.born > e.life && !e.fleeing) { e.fleeing = true; }
    if (frozen) { e.vx = e.vy = 0; }
    else if (e.path) {
      // a flock flies straight across and away
      e.vx = e.path.vx; e.vy = e.path.vy;
      if (d > far + 300 && e.ft > 4) { e.dead = true; e.gone = true; continue; }
    } else {
      // where it wants to go (the moon in eclipse: they lose it and wander)
      let gx = dx, gy = dy, gd = d;
      if (S.hidden) {
        if (!e.wander || e.ft > e.wander.t) e.wander = { x: e.x + rand(-320, 320), y: e.y + rand(-320, 320), t: e.ft + rand(1.2, 2.6) };
        gx = e.wander.x - e.x; gy = e.wander.y - e.y; gd = Math.hypot(gx, gy) || 1;
      }
      let spd = e.spd * ((e.slowT || 0) > S.t ? 0.5 : 1) * (S.hidden ? 0.6 : 1);
      let tx = gx / gd * spd, ty = gy / gd * spd, k = Math.min(1, (e.d.heavy || e.cap ? 2.2 : 5) * dt);
      if (e.fleeing || ai === 'flee') { tx = -dx / d * spd * 1.2; ty = -dy / d * spd * 1.2; if (d > far + 200) { e.dead = true; e.gone = true; if (e.cap) { banner(`${CAPTAINS[e.cap].name} escapó`, null); S.cap = null; } continue; } }
      else if (ai === 'ranged') {
        // a gunboat keeps its distance, circles, and fires
        const want = 230, side = Math.sin(e.seed) > 0 ? 1 : -1;
        const radial = d > want + 30 ? 1 : d < want - 30 ? -0.8 : 0;
        tx = (gx / gd * radial - gy / gd * side * 0.7) * spd; ty = (gy / gd * radial + gx / gd * side * 0.7) * spd;
        e.fireT -= dt;
        if (e.fireT <= 0 && d < 360 && !S.hidden && onScreen(e.x, e.y, 0)) { e.fireT = rand(2.6, 3.4) * (e.elite ? 0.6 : 1); eshot(e.x, e.y - 8, leadAngle(e.x, e.y, 190), 190, e.elite ? 14 : 9); sfx('cannon', null, e.x); puff({ add: true, tex: FX.dot, x: e.x, y: e.y - 8, life: 0.2, s0: 20, s1: 34, tint: 0xffc070, a: 0.8 }); }
      } else if (ai === 'drift') {
        // a jellyfish pulses towards the moon and drifts with the current
        const c = current(e.x, e.y), pulse = 0.35 + 0.65 * Math.max(0, Math.sin(e.ft * 3 + e.seed));
        tx = tx * pulse + c.x * 1.2; ty = ty * pulse + c.y * 1.2; k = Math.min(1, 3 * dt);
        if (e.type === 'icejelly') { e.fireT -= dt; if (e.fireT <= 0 && d < 110 && !S.hidden) { e.fireT = 3; S.bolts.push({ pts: zig(e.x, e.y, S.x, S.y, 6, 9), t: 0, life: 0.2, col: 0x9fe3ff }); hurtMoon(6); sfx('zap', null, e.x); } }
      } else if (ai === 'weave') {
        // a serpent snakes in
        const a = Math.atan2(gy, gx) + Math.sin(e.ft * 2.6 + e.seed) * 0.8;
        tx = Math.cos(a) * spd; ty = Math.sin(a) * spd; k = Math.min(1, 4 * dt);
      } else if (ai === 'dash') {
        // an octopus creeps up, gathers itself, and lunges
        e.fireT -= dt;
        if (e.dash > 0) { e.dash -= dt; tx = e.dx * 330; ty = e.dy * 330; k = 1; }
        else if (e.coil > 0) { e.coil -= dt; tx = ty = 0; if (e.coil <= 0) { e.dash = 0.35; e.dx = gx / gd; e.dy = gy / gd; } }
        else { tx *= 0.6; ty *= 0.6; if (e.fireT <= 0 && d < 260) { e.fireT = rand(2.8, 3.8); e.coil = 0.4; } }
      }
      if (e.slide) { tx = tx * 0.4 + e.slide.x * spd; ty = ty * 0.4 + e.slide.y * spd; e.slide = null; }
      e.vx += (tx - e.vx) * k; e.vy += (ty - e.vy) * k;
      // a fleet doesn't pile into one point
      eachNear(e.x, e.y, e.r * 2, o => {
        if (o === e || o.d.fly !== e.d.fly) return;
        const ox = e.x - o.x, oy = e.y - o.y, min = (e.r + o.r) * 0.8, q = ox * ox + oy * oy;
        if (q < min * min && q > 0.01) { const dd = Math.sqrt(q), push = (min - dd) / dd * 0.5 * ((o.d.heavy || o.cap) && !(e.d.heavy || e.cap) ? 1.5 : 1); e.x += ox * push; e.y += oy * push; }
      });
    }
    e.x += (e.vx + e.kx) * dt; e.y += (e.vy + e.ky) * dt;
    const kd = Math.min(1, 4.5 * dt); e.kx -= e.kx * kd; e.ky -= e.ky * kd;
    if (!passesIslands(e.d)) {
      const kb = Math.hypot(e.kx, e.ky), hit = pushOut(e, e.r * 0.75);
      if (hit) {
        if (kb > 170) crash(e, hit, kb);
        else {
          // slide along the coast towards the side the moon is on
          const nx = e.x - hit.x, ny = e.y - hit.y, nd = Math.hypot(nx, ny) || 1, sx = -ny / nd, sy = nx / nd, sg = sx * dx + sy * dy > 0 ? 1 : -1;
          e.slide = { x: sx * sg, y: sy * sg };
        }
      }
    }
    // a serpent's path, a point every few units: its coils lie along it
    if (e.trail) { const tr = e.trail; if (!tr.length || Math.abs(tr[0] - e.x) + Math.abs(tr[1] - e.y) > 4) { tr.unshift(e.x, e.y); if (tr.length > (e.d.segs + 1) * 6) tr.length = (e.d.segs + 1) * 6; } }
    if (e.dead) continue;
    const touching = d < e.r + MOON_R * 0.7 && !frozen && !S.hidden && !e.faded;
    if (touching && ai === 'bomb') { e.reached = true; kill(e); continue; }
    if (touching) touch += e.d.dps * (e.elite || e.cap ? 1.5 : 1);
    if (d < 160) near++;
    if (!e.path && d > far && !frozen && !e.fleeing && ai !== 'flee' && !e.cap) relocate(e);
  }
  S.near = near; S.touch = touch;
  if (touch > 0) hurtMoon(touch * dt);
  if (S.enemies.some(e => e.dead)) S.enemies = S.enemies.filter(e => { if (e.dead && e.gone) freeView(e); return !e.dead; });
}

// ---- the director: how many come now, and what each sea sends; the special moments on time
const CAP = 280;
const waveAt = t => { let w = WAVES[0]; for (const x of WAVES) if (t >= x.t) w = x; return w; };
function pickW(mix) {
  let r = Math.random() * Object.values(mix).reduce((a, b) => a + b, 0);
  for (const k in mix) { r -= mix[k]; if (r <= 0) return k; }
  return Object.keys(mix)[0];
}
// the sea under the moon decides the mix (in between two seas, both send)
function pickType() {
  const w = zoneMix(S.x, S.y), zone = pickW(w), pool = ZONE_POOL[zone], mix = {};
  for (const k in pool) if (EN[k].from <= S.t) mix[k] = pool[k];
  return Object.keys(mix).length ? pickW(mix) : 'sloop';
}
// the plain ship of each sea (for rings)
const BASIC = { mareas: 'sloop', archi: 'sloop', hielo: 'icesloop', sangre: 'ghost' };
const JELLY = { mareas: 'jelly', archi: 'jelly', hielo: 'icejelly', sangre: 'redjelly' };
function directorTick(dt) {
  const w = waveAt(S.t);
  if (S.enemies.length < CAP) S.spawnAcc += w.rate * (S.boss ? 0.65 : 1) * dt;
  while (S.spawnAcc >= 1) { S.spawnAcc -= 1; spawnEdge(pickType()); }
  while (S.eventI < EVENTS.length && S.t >= EVENTS[S.eventI].t) runEvent(EVENTS[S.eventI++]);
  MUS.intensity = Math.min(3, Math.floor(S.t / 120));
}
function spawnCaptain(id) {
  if (S.cap && !S.cap.dead) return;
  let p = edgePoint(40);
  for (let i = 0; i < 6 && blocked(p.x, p.y, 44); i++) p = edgePoint(40);
  const e = spawnEnemy('galleon', p.x, p.y, { cap: id });
  S.cap = e;
  const c = CAPTAINS[id];
  banner(c.name, c.tip, true); sfx('roar'); vib('boss');
  if (id === 'ceniza') for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; spawnEnemy('sloop', p.x + Math.cos(a) * 80, p.y + Math.sin(a) * 80, { tint: 0xffb080 }); }
}
function runEvent(ev) {
  const R0 = Math.max(viewW(), viewH()) * 0.6, zone = zoneAt(S.x, S.y);
  if (ev.k === 'flock') {
    // a wide V of gulls crosses the sea right through where the moon is
    const a = rand(0, TAU), c = Math.cos(a), s = Math.sin(a), spd = 175;
    for (let i = 0; i < ev.n; i++) {
      const row = Math.ceil(i / 2), off = (i % 2 ? 1 : -1) * row * 26, back = row * 22;
      spawnEnemy('gull', S.x - c * (R0 + back) - s * off, S.y - s * (R0 + back) + c * off, { path: { vx: c * spd, vy: s * spd } });
    }
    sfx('squawk');
  } else if (ev.k === 'elite') {
    const p = edgePoint(); spawnEnemy(ev.type, p.x, p.y, { elite: true }); sfx('warn');
  } else if (ev.k === 'ring') {
    const type = BASIC[zone], n = Math.round(ev.n * (type === 'ghost' ? 0.6 : 1)), R1 = R0 * 0.95;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, x = S.x + Math.cos(a) * R1, y = S.y + Math.sin(a) * R1; if (passesIslands(EN[type]) || !blocked(x, y, EN[type].r)) spawnEnemy(type, x, y); }
    sfx('warn');
  } else if (ev.k === 'gold') {
    const a = rand(0, TAU), x = S.x + Math.cos(a) * 260, y = S.y + Math.sin(a) * 260;
    spawnEnemy('goldship', x, y, { life: 22 }); sfx('coin');
  } else if (ev.k === 'bloom') {
    // a whole bank of jellyfish rises around the moon
    const type = JELLY[zone];
    for (let i = 0; i < ev.n; i++) { const a = rand(0, TAU), r = rand(150, 280); const e = spawnEnemy(type, S.x + Math.cos(a) * r, S.y + Math.sin(a) * r); e.rise = 0.8; }
    sfx('splash');
  } else if (ev.k === 'cap') { spawnCaptain(ev.id); return; }
  banner(ev.txt, ev.sub);
}
