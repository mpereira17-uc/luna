// =====================================================================
// THE BOSSES OF THE NIGHT: the Kraken rises at minute 5, slams its tentacles and bursts up under the moon;
// at minute 10 the water darkens, a bell tolls and the Holandés Errante crosses the sea firing broadsides.
// Each one calls its fleet when wounded, gets worse near the end, and leaves a big chest.
// =====================================================================
const TENTS = 6, SEGS = 17, KS = 0.95;
function bossStart(kind) {
  const D = BOSSES[kind];
  let x = S.x, y = S.y - 250;
  for (let i = 0; i < 12; i++) { const a = rand(0, TAU); x = S.x + Math.cos(a) * 250; y = S.y + Math.sin(a) * 250; if (!blocked(x, y, D.r)) break; }
  const b = S.boss = { kind, D, x, y, hp: D.hp, maxHp: D.hp, r: D.r, ph: 'rise', t: 0, atkT: 2.2, n: 0, hit: 0, sub: 1, hittable: false,
    calls: D.calls.slice(), marks: [], enraged: false, slam: null, sw: rand(0, 6) };
  BOSS_AI[kind].start(b);
  banner(D.intro[0], D.intro[1], true);
  MUS.boss = D.song; vib('boss');
}
function hurtBoss(dmg) {
  const b = S.boss; if (!b || !b.hittable) return;
  b.hp -= dmg; b.hit = 0.1;
  numText(b.x + rand(-30, 30), b.y - 90, String(Math.round(dmg)), 0xffd36b, 15);
  if (b.calls.length && b.hp < b.maxHp * b.calls[0]) { b.calls.shift(); callFleet(b); }
  if (!b.enraged && b.hp < b.maxHp * b.D.rage) { b.enraged = true; banner(b.D.angry, null, true); if (b.kind === 'holandes') sfx('bell'); }
  if (b.hp <= 0) bossDie();
}
// wounded, it calls its fleet: a ring of ships closes in (the Holandés calls ghost ships, which sail through islands)
function callFleet(b) {
  const R0 = Math.max(viewW(), viewH()) * 0.56, ghosts = b.kind === 'holandes', n = ghosts ? 10 : 14;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, x = S.x + Math.cos(a) * R0, y = S.y + Math.sin(a) * R0, t = ghosts ? 'ghost' : i % 7 === 0 ? 'galleon' : 'sloop';
    if (ghosts || !blocked(x, y, EN[t].r)) spawnEnemy(t, x, y);
  }
  banner(ghosts ? '¡La flota fantasma!' : '¡Llama a la flota!', 'Barcos por todos lados'); sfx('roar');
}
function bossDie() {
  const b = S.boss; b.ph = 'die'; b.t = 0; b.hittable = false; b.marks = []; b.slam = null;
  sfx('bigboom'); vib('boss'); cam.shake = 1.6; shock(b.x, b.y, 50, 220, 500, 900);
  if (b.kind === 'holandes') sfx('bell');
  MUS.boss = false;
  banner(b.D.beat, 'Recoge su cofre', true);
}
// it goes under in a shower of sparks, and its chest comes up where it sank
function bossDieTick(b, dt) {
  b.sub = Math.min(1, b.t / 2.2);
  S.gloom = Math.max(0, S.gloom - dt * 0.45);
  if (b.t < 1.8 && Math.random() < 0.4) { const x = b.x + rand(-70, 70), y = b.y + rand(-80, 10); sparks(x, y, b.D.spark, 8, 200, 10); splash(x, y + 20, 1); sfx('boom', null, x); }
  if (b.t > 2.3) {
    dropPickup('chest', b.x, b.y, { big: true });
    for (let i = 0; i < 30; i++) dropPickup('coin', b.x + rand(-60, 60), b.y + rand(-40, 40));
    bossFree(b); S.boss = null;
  }
}
function bossFree(b) { b.view.destroy({ children: true }); b.shadow.destroy(); b.glow.destroy(); }
// a red ring on the water that fills before something hits there
const mark = (x, y, r, T0) => ({ x, y, r, t: 0, T: T0 });
function bossTick(dt) {
  const b = S.boss; if (!b) return;
  b.t += dt; b.hit = Math.max(0, b.hit - dt);
  for (const m of b.marks) m.t += dt;
  if (b.ph === 'die') { bossDieTick(b, dt); return; }
  // frozen by the blizzard, it waits
  if (b.hittable && (b.frozen || 0) > S.t) return;
  BOSS_AI[b.kind].tick(b, dt);
}
// ---- the Kraken
function krakenStart(b) {
  krakenView(b);
  sfx('roar'); cam.shake = 1.2;
  shock(b.x, b.y, 40, 200, 420, 700); splash(b.x, b.y, 2.2);
}
function krakenView(b) {
  b.shadow = new PIXI.Sprite(SHADOW); b.shadow.anchor.set(0.5); b.shadow.scale.set(b.r * 3.4 / 128); L.marks.addChildAt(b.shadow, 0);
  b.view = new PIXI.Container(); b.view.sortableChildren = true; L.body.addChild(b.view);
  b.tents = [];
  for (let i = 0; i < TENTS; i++) {
    const c = new PIXI.Container(), segs = [];
    for (let k = 0; k <= SEGS; k++) segs.push(spr(k === SEGS ? 'tentTipA' : 'tentA', 0.95, c));
    b.view.addChild(c); b.tents.push({ c, segs, a: i / TENTS * TAU + 0.3 });
  }
  b.body = spr('krakenA', KS, b.view); b.body.zIndex = 0.5;
  b.glow = glow(L.fx, 0xff3a5a, 260, 0); b.glow.anchor.set(0.5);
}
function krakenTick(b, dt) {
  const dx = S.x - b.x, dy = S.y - b.y, d = Math.hypot(dx, dy) || 1;
  if (b.ph === 'rise') {
    b.sub = Math.max(0, 1 - b.t / 2.2);
    if (Math.random() < 0.5) splash(b.x + rand(-60, 60), b.y + rand(-30, 30), 0.6);
    if (b.t > 2.2) { b.ph = 'fight'; b.hittable = true; b.sub = 0; }
    return;
  }
  // it drifts after the moon; touching it hurts
  if (b.ph === 'fight') {
    const sp = d > 200 ? 46 : 18;
    b.x += dx / d * sp * dt; b.y += dy / d * sp * dt;
    if (d < b.r * 0.85 && !b.sub) hurtMoon(b.D.dps * dt);
    b.atkT -= dt * (b.enraged ? 1.4 : 1);
    if (b.atkT <= 0 && !b.slam) {
      b.n++;
      if (d > 260 || b.n % 3 === 0) { b.ph = 'dive'; b.t = 0; b.hittable = false; sfx('splash'); }
      else {
        // slam: one tentacle (two when enraged) lifts over where the moon is going and comes down
        const lead = 0.6, tx = S.x + S.vx * lead, ty = S.y + S.vy * lead, k = b.enraged ? 2 : 1, hits = [];
        for (let i = 0; i < k; i++) hits.push(mark(tx + (i ? rand(-70, 70) : 0), ty + (i ? rand(-70, 70) : 0), 62, 1.05));
        b.marks.push(...hits); b.slam = { hits, t: 0, done: false }; sfx('warn');
      }
      b.atkT = rand(2.6, 3.4);
    }
    if (b.slam) {
      const s = b.slam; s.t += dt;
      if (!s.done && s.t >= 1.05) {
        s.done = true; cam.shake = Math.max(cam.shake, 0.7); sfx('boom', null, b.x); vib('heavy');
        for (const m of s.hits) {
          splash(m.x, m.y, 1.6); shock(m.x, m.y, 18, 90, 380, 260);
          if (Math.hypot(S.x - m.x, S.y - m.y) < m.r + MOON_R * 0.6) hurtMoon(22);
          // its own fleet is in the way too
          for (const e of S.enemies) if (!e.dead && Math.hypot(e.x - m.x, e.y - m.y) < m.r + e.r) hurt(e, 60, (e.x - m.x) * 4, (e.y - m.y) * 4, true);
        }
        b.marks = b.marks.filter(m => !s.hits.includes(m));
      }
      if (s.t > 1.6) b.slam = null;
    }
    return;
  }
  // dive: it sinks, its shadow races under the water to the moon, and it bursts up there
  if (b.ph === 'dive') {
    if (!b.dive) { b.dive = { x0: b.x, y0: b.y, t: 0, m: null }; }
    const v = b.dive; v.t += dt;
    if (v.t < 0.7) b.sub = v.t / 0.7;
    else if (v.t < 2.0) {
      b.sub = 1;
      if (!v.m) { v.m = mark(S.x, S.y, 96, 1.3); b.marks.push(v.m); sfx('warn'); }
      // the mark follows the moon a little, then stays
      if (v.t < 1.5) { v.m.x += (S.x - v.m.x) * Math.min(1, 2 * dt); v.m.y += (S.y - v.m.y) * Math.min(1, 2 * dt); }
      const f = (v.t - 0.7) / 1.3; b.x = lerp(v.x0, v.m.x, f); b.y = lerp(v.y0, v.m.y, f);
      if (Math.random() < 0.3) wakePuff(b.x + rand(-30, 30), b.y + rand(-20, 20), 26);
    } else {
      if (v.m) {
        // the burst
        b.x = v.m.x; b.y = v.m.y; splash(b.x, b.y, 2.4); shock(b.x, b.y, 36, 160, 520, 600); cam.shake = 1; sfx('bigboom'); vib('heavy');
        if (Math.hypot(S.x - b.x, S.y - b.y) < v.m.r + MOON_R * 0.6) hurtMoon(30);
        for (const e of S.enemies) if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) < v.m.r + e.r) hurt(e, 80, (e.x - b.x) * 5, (e.y - b.y) * 5, true);
        b.marks = b.marks.filter(m => m !== v.m); v.m = null;
      }
      b.sub = Math.max(0, 1 - (v.t - 2.0) / 0.45);
      if (v.t > 2.45) { b.ph = 'fight'; b.hittable = true; b.sub = 0; b.dive = null; b.atkT = rand(1.6, 2.4); }
    }
  }
}
// ---- the Kraken on screen: the body rises out of the water, six tentacles sway on the surface, one lifts to slam
function tentacle(segs, bx, by, cx, cy, ex, ey, s, raised) {
  const n = segs.length - 1;
  for (let i = 0; i <= n; i++) {
    const f = i / n, mt = 1 - f;
    const px = mt * mt * bx + 2 * mt * f * cx + f * f * ex, py = mt * mt * by + 2 * mt * f * cy + f * f * ey;
    const ang = Math.atan2(2 * mt * (cy - by) + 2 * f * (ey - cy), 2 * mt * (cx - bx) + 2 * f * (ex - cx));
    const sc = s * (1.15 - f * 0.6) * (raised ? 1.15 : 1), sp = segs[i];
    sp.position.set(px, py); sp.rotation = ang; sp.scale.set(sc / FR[i === n ? 'tentTipA' : 'tentA'].R);
  }
}
function drawBoss() {
  const b = S && S.boss; if (!b) return;
  for (const m of b.marks) {
    const f = Math.min(1, m.t / m.T), c = m.col || 0xff3a3a;
    MK.circle(m.x, m.y, m.r).fill({ color: c, alpha: 0.1 + 0.12 * f }).stroke({ width: 3, color: m.col ? 0xc8ffe4 : 0xff6b5a, alpha: 0.75 });
    MK.circle(m.x, m.y, m.r * f).fill({ color: c, alpha: 0.22 });
  }
  BOSS_AI[b.kind].draw(b);
}
function krakenDraw(b) {
  const vis = onScreen(b.x, b.y, 260);
  b.view.visible = vis; b.shadow.visible = vis;
  if (!vis) return;
  const sub = b.sub, up = 1 - sub;
  b.view.position.set(0, 0); b.view.zIndex = b.y;
  b.shadow.position.set(b.x, b.y + 10); b.shadow.alpha = 0.4 + 0.5 * sub;
  // under the water it is a dark shape; out of it, the full purple Kraken
  const dark = sub > 0.02;
  b.body.position.set(b.x, b.y + 20 * sub); b.body.alpha = dark ? 0.35 + 0.65 * up : 1;
  const iced = (b.frozen || 0) > S.t;
  b.body.tint = dark ? 0x2a3a66 : b.hit > 0 ? 0xff9a9a : iced ? 0xa8e4ff : 0xffffff;
  const slamming = b.slam && !b.slam.done;
  setFrame(b.body, slamming || (b.dive && b.dive.t > 2) ? 'krakenA_slam' : 'krakenA', KS * (0.75 + 0.25 * up), b.x > S.x);
  b.tents.forEach((tn, i) => {
    tn.c.alpha = dark ? 0.3 + 0.7 * up : 1;
    for (const sg of tn.segs) sg.tint = dark ? 0x2a3a66 : b.hit > 0 ? 0xff9a9a : iced ? 0xa8e4ff : 0xffffff;
    const bx = b.x + Math.cos(tn.a) * 34, by = b.y + 14 + Math.sin(tn.a) * 18, reach = (60 + 110 * up) * (b.enraged ? 1.08 : 1);
    const target = b.slam && b.slam.hits[i];
    if (target && i < b.slam.hits.length) {
      // lifted over its mark, then down onto it
      const f = Math.min(1, b.slam.t / 1.05), down = b.slam.done;
      const ex = down ? target.x : lerp(bx, target.x, 0.85), ey = down ? target.y : lerp(by, target.y, 0.85) - 70 * f;
      tentacle(tn.segs, bx, by, (bx + ex) / 2, Math.min(by, ey) - 90, ex, ey, 1, !down);
      tn.c.zIndex = 1;
    } else {
      tn.c.zIndex = 0;
      const sw = Math.sin(T * 1.6 + i * 1.3 + b.sw) * 0.5, sw2 = Math.sin(T * 1.2 + i * 2.1) * 0.7;
      tentacle(tn.segs, bx, by, b.x + Math.cos(tn.a + sw) * reach * 0.6, b.y + Math.sin(tn.a + sw) * reach * 0.45,
        b.x + Math.cos(tn.a + sw2) * reach, b.y + Math.sin(tn.a + sw2) * reach * 0.7, 0.95, false);
    }
  });
  b.glow.position.set(b.x, b.y - 40); b.glow.alpha = b.enraged && !dark ? 0.22 + 0.12 * Math.sin(T * 8) : 0;
  if (!dark) foamRing(b.x, b.y + 16, 96, 30, 0.2);
}

// ---- the Holandés Errante (its own sprite, in the mar atlas): a ghost ship three times the size of any other. It crosses the sea from side to side,
// through islands and all, firing broadsides up and down; between passes it sinks into the fog and its drowned crew
// comes up around the moon. Cursed (half its life gone), it sails faster and its cannons fire from the mist too.
const HS = 1.25;
function holandesStart(b) {
  b.shadow = new PIXI.Sprite(SHADOW); b.shadow.anchor.set(0.5); L.marks.addChildAt(b.shadow, 0);
  b.view = new PIXI.Container(); L.body.addChild(b.view);
  b.body = spr('holandes0', HS, b.view);
  b.glow = glow(L.fx, 0x6affb0, 460, 0); b.glow.anchor.set(0.5);
  b.alpha = 0; b.pass = null; b.passN = 0; b.bells = [0, 1.7, 3.4]; b.x = S.x; b.y = S.y - 2000;
}
// a new pass: from one side of the screen to the other, through where the moon is (or where it is going)
function holandesPass(b) {
  b.passN++;
  const dir = b.passN % 2 ? 1 : -1, vw = viewW() / 2 + 320, y = S.y + S.vy * 0.8 + rand(-40, 40);
  b.pass = { dir, x1: cam.x + dir * vw, slope: rand(-0.12, 0.12), spd: b.enraged ? 235 : 180, gunT: 0.9, warned: false };
  b.x = cam.x - dir * vw; b.y = y; b.ph = 'pass'; b.t = 0; b.hittable = true;
  sfx('bell');
}
// the guns along its hull, in world units from its centre
const H_GUNS = [-52, 6, 62];
function broadside(b) {
  const p = b.pass, vx = p.dir * p.spd * 0.45, spread = b.enraged ? [-0.28, 0, 0.28] : [0];
  for (const gx of H_GUNS) {
    const x = b.x + gx * p.dir, y = b.y + 26;
    for (const side of [-1, 1]) for (const s of spread) {
      const a = side * Math.PI / 2 + s, v = 165;
      eshot(x, y + side * 22, Math.atan2(Math.sin(a) * v, Math.cos(a) * v + vx), Math.hypot(Math.sin(a) * v, Math.cos(a) * v + vx), 9, 'ghost');
    }
    puff({ add: true, tex: FX.dot, x, y: y - 22, life: 0.25, s0: 26, s1: 44, tint: 0x9dffc8, a: 0.9 });
    puff({ add: true, tex: FX.dot, x, y: y + 22, life: 0.25, s0: 26, s1: 44, tint: 0x9dffc8, a: 0.9 });
  }
  sfx('cannon', null, b.x); cam.shake = Math.max(cam.shake, 0.3);
}
function holandesTick(b, dt) {
  if (b.ph === 'rise') {
    // the water darkens, the bell tolls three times, and the ship comes out of the fog
    S.gloom = Math.min(0.8, b.t / 3 * 0.8);
    if (b.bells.length && b.t >= b.bells[0]) { b.bells.shift(); sfx('bell'); cam.shake = Math.max(cam.shake, 0.3); }
    if (b.t > 4) holandesPass(b);
    return;
  }
  S.gloom = Math.max(S.gloom, 0.8);
  if (b.ph === 'pass') {
    const p = b.pass;
    b.x += p.dir * p.spd * dt; b.y += p.slope * p.spd * dt;
    b.alpha = Math.min(1, b.alpha + dt * 1.6);
    if (onScreen(b.x, b.y, -40)) {
      p.gunT -= dt;
      // the gunports glow just before it fires
      if (p.gunT < 0.4 && !p.warned) { p.warned = true; for (const gx of H_GUNS) puff({ add: true, tex: FX.dot, x: b.x + gx * p.dir, y: b.y + 26, life: 0.4, s0: 10, s1: 30, tint: 0x6affb0, a: 0.9 }); }
      if (p.gunT <= 0) { p.gunT = b.enraged ? 0.85 : 1.15; p.warned = false; broadside(b); }
    }
    // ramming: the hull is long and low; the moon is shoved aside and hurt
    const hx = Math.abs(S.x - b.x), hy = S.y - (b.y + 40);
    if (hx < 125 && Math.abs(hy) < 40 + MOON_R * 0.6) { hurtMoon(b.D.dps * dt); S.y += Math.sign(hy || 1) * 160 * dt; }
    if (Math.random() < 0.5) wakePuff(b.x - p.dir * rand(60, 130), b.y + 64 + rand(-6, 6), 30, -p.dir * 20, 0, 0.18, 1.1);
    if (Math.random() < 0.5) puff({ tex: FX.foam, x: b.x - p.dir * rand(40, 140), y: b.y + 40 - rand(30, 140), vx: -p.dir * 30, vy: -10, life: 1.4, s0: 30, s1: 70, a: 0.22, tint: 0xa8ffd8, drag: 0.8 });
    if (p.dir * (b.x - p.x1) > 0) { b.ph = 'gone'; b.t = 0; b.hittable = false; }
    return;
  }
  if (b.ph === 'gone') {
    b.alpha = Math.max(0, b.alpha - dt * 2);
    // its drowned crew comes up around the moon (every other pass)
    if (!b.crew && b.t > 0.4 && b.passN % 2 === 0) {
      b.crew = true;
      for (let i = 0; i < (b.enraged ? 7 : 5); i++) { const a = rand(0, TAU), r = rand(170, 240), e = spawnEnemy('ghost', S.x + Math.cos(a) * r, S.y + Math.sin(a) * r); e.rise = 0.8; }
      if (!b.crewSaid) { b.crewSaid = true; banner('La tripulación maldita', 'Sale del agua alrededor de la luna'); }
      sfx('splash');
    }
    // cursed: cannonballs fall out of the mist on green marks
    if (b.enraged && !b.volley && b.t > 0.2) {
      b.volley = [];
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rand(-0.3, 0.3), r = i ? rand(60, 190) : 0, m = mark(S.x + S.vx * 0.5 + Math.cos(a) * r, S.y + S.vy * 0.5 + Math.sin(a) * r, 54, 1.25); m.col = 0x3aff9a; b.volley.push(m); }
      b.marks.push(...b.volley); sfx('warn');
    }
    if (b.volley && b.volley.length && b.volley[0].t >= b.volley[0].T) {
      for (const m of b.volley) {
        splash(m.x, m.y, 1.2); puff({ add: true, tex: FX.ring, x: m.x, y: m.y, life: 0.35, s0: 16, s1: 110, tint: 0x6affb0, a: 0.9 });
        if (Math.hypot(S.x - m.x, S.y - m.y) < m.r + MOON_R * 0.6) hurtMoon(14);
      }
      sfx('boom'); cam.shake = Math.max(cam.shake, 0.5);
      b.marks = b.marks.filter(m => !b.volley.includes(m)); b.volley.length = 0;
    }
    if (b.t > (b.enraged ? 2.2 : 2.8)) { b.crew = false; b.volley = null; holandesPass(b); }
  }
}
function holandesDraw(b) {
  const sinkF = b.ph === 'die' ? Math.min(1, b.t / 2.3) : 0, vis = b.alpha > 0.01 && onScreen(b.x, b.y, 300);
  b.view.visible = vis; b.shadow.visible = vis;
  if (!vis) { b.glow.alpha = 0; return; }
  const flip = b.pass ? b.pass.dir < 0 : false, iced = (b.frozen || 0) > S.t;
  setFrame(b.body, Math.floor(T * 2.2) % 2 ? 'holandes1' : 'holandes0', HS * (1 - 0.08 * sinkF), flip);
  b.body.position.set(b.x, b.y + 70 + Math.sin(T * 1.3) * 3 + sinkF * 50);
  b.body.rotation = Math.sin(T * 0.9) * 0.025 + sinkF * 0.4 * (flip ? 1 : -1);
  // it flickers like a lantern in the wind
  b.body.alpha = b.alpha * (0.86 + 0.09 * Math.sin(T * 7) + 0.05 * Math.sin(T * 23)) * (1 - sinkF);
  b.body.tint = b.hit > 0 ? 0xffb0b0 : iced ? 0xa8e4ff : 0xffffff;
  b.view.zIndex = b.y + 70;
  b.shadow.position.set(b.x, b.y + 74); b.shadow.scale.set(300 / 128, 110 / 64); b.shadow.alpha = 0.55 * b.alpha * (1 - sinkF);
  b.glow.position.set(b.x, b.y - 10); b.glow.alpha = (0.32 + 0.1 * Math.sin(T * 3)) * b.alpha * (1 - sinkF);
}
const BOSS_AI = {
  kraken: { start: krakenStart, tick: krakenTick, draw: krakenDraw },
  holandes: { start: holandesStart, tick: holandesTick, draw: holandesDraw },
};
