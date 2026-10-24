
// =====================================================================
// DRAWING: every frame the scene follows the game: the sea, the props, the fleet, the sharks,
// the moon floating over the water, the Kraken, the tsunami, and arrows to what is off screen
// =====================================================================
const MV = {};
let ARW = null;
function initMoonView() {
  MV.shadow = new PIXI.Sprite(SHADOW); MV.shadow.anchor.set(0.5); L.marks.addChildAt(MV.shadow, 0);
  // its halo sits behind it (added light, but out of the bloom, so the moon keeps its craters and its face)
  MV.halo = new PIXI.Sprite(GLOW); MV.halo.anchor.set(0.5); MV.halo.blendMode = 'add'; MV.halo.tint = 0xdcecff; MV.halo.scale.set(200 / 128);
  MV.c = new PIXI.Container();
  MV.body = spr(`moon_${MOON.id}`, MOON_R / 31, MV.c); MV.face = spr('face_calm', MOON_R / 31, MV.c);
  L.body.addChild(MV.halo, MV.c);
  ARW = new PIXI.Graphics(); ui.addChild(ARW);
}
// the chosen moon's face and colour (the title screen and each run)
function setMoonLook() {
  setFrame(MV.body, `moon_${MOON.id}`, MOON_R / 31);
  MV.halo.tint = MOON.tint;
}
function drawMoon(mx, my) {
  const bob = reduceMotion ? 0 : Math.sin(T * 2.2) * 3, dead = S && S.ended && !S.win;
  const k = dead ? Math.max(0, 1 - S.deadT / 1.2) : 1;
  const hid = S && S.hidden ? 0.35 + 0.1 * Math.sin(T * 8) : S && S.safeT > S.t ? 0.6 + 0.4 * Math.sin(T * 28) : 1;
  MV.c.position.set(mx, my - 8 + bob + (1 - k) * 18); MV.c.zIndex = 1e7; MV.c.alpha = k * hid; MV.c.scale.set(0.6 + 0.4 * k);
  MV.halo.position.set(mx, my - 8 + bob); MV.halo.zIndex = 1e7 - 1; MV.halo.alpha = (0.4 + 0.08 * Math.sin(T * 1.7)) * k * (hid < 1 ? 0.3 : 1);
  MV.shadow.position.set(mx, my + 26); MV.shadow.scale.set((MOON_R * 2.3 - bob) / 128); MV.shadow.alpha = 0.6 * k;
  setFrame(MV.face, `face_${S ? moonFace() : MOON.face + (Math.sin(T * 0.8) > 0.97 ? '_blink' : '')}`, MOON_R / 31);
  MV.body.tint = MV.face.tint = S && S.hp < S.maxHp && gateOpen('moonhurt', 140) ? 0xffb0b0 : 0xffffff;
  drawReflection(mx, my + 14);
}
// true for a moment after gate(name) last fired (the moon blushes red while it is being hit)
const gateOpen = (name, ms) => performance.now() - (AU.last[name] || 0) < ms;

function drawEnemies(dt) {
  for (const e of S.enemies) {
    const v = e.view; if (!v || e.dead) continue;
    const vis = onScreen(e.x, e.y, 90); v.visible = vis;
    if (v.sh) v.sh.visible = vis;
    if (e.glow) e.glow.visible = vis;
    if (v.segs) for (const sg of v.segs) sg.visible = vis;
    if (!vis) continue;
    const frozen = (e.frozen || 0) > S.t, ai = e.d.ai, vx = e.vx + e.kx, vy = e.vy + e.ky;
    if (frozen) e.ft -= dt;
    const fr = e.d.spr[Math.floor(e.ft * (e.d.fly ? 9 : ai === 'drift' ? 3 : 2.5)) % e.d.spr.length];
    // how solid it looks: a bloom comes up from below, ghosts flicker and fade, a captain in its veil is barely there
    let a = 1;
    if (e.rise > 0) { e.rise -= dt; a = 1 - e.rise / 0.8; }
    if (ai === 'ghost') a *= e.faded ? 0.14 : 0.74 + 0.1 * Math.sin(e.ft * 4 + e.seed);
    else if (e.faded) a *= 0.12;
    v.alpha = a;
    if (e.d.fly) {
      setFrame(v, fr, e.s, vx < 0);
      v.position.set(e.x, e.y - 18 + Math.sin(e.ft * 5) * 2); v.zIndex = e.y + 60; v.rotation = 0;
      v.sh.position.set(e.x, e.y + 8);
    } else if (ai === 'drift') {
      // a jellyfish breathes: it stretches as it pushes and squashes as it drifts
      const pul = Math.sin(e.ft * 3 + e.seed);
      setFrame(v, fr, e.s); v.scale.x *= 1 - 0.07 * pul; v.scale.y *= 1 + 0.09 * pul;
      v.position.set(e.x, e.y + (e.rise > 0 ? e.rise * 20 : 0)); v.zIndex = e.y; v.rotation = Math.sin(e.ft * 1.3 + e.seed) * 0.08;
    } else if (v.segs) {
      // a serpent: the head turns to where it swims, its coils follow the path it took
      const ang = Math.atan2(vy, vx);
      setFrame(v, fr, e.s, false); v.position.set(e.x, e.y); v.rotation = ang; v.zIndex = e.y + 2; v.scale.y *= Math.abs(ang) > Math.PI / 2 ? -1 : 1;
      const tr = e.trail;
      let px = e.x, py = e.y;
      v.segs.forEach((sg, k) => {
        const i = Math.min(tr.length / 2 - 1, (k + 1) * 3) * 2, x = i >= 0 ? tr[i] : e.x, y = i >= 0 ? tr[i + 1] : e.y;
        sg.position.set(x, y + Math.sin(e.ft * 6 - k * 0.8) * 1.5); sg.rotation = Math.atan2(py - y, px - x); sg.zIndex = e.y + 1 - k * 0.01;
        sg.alpha = a; sg.tint = v.tint; px = x; py = y;
      });
    } else {
      setFrame(v, fr, e.s, vx < 0);
      // an octopus gathering itself squashes down before it lunges
      if (e.coil > 0) { v.scale.y *= 0.8; v.scale.x *= 1.15; }
      v.position.set(e.x, e.y + 4 + Math.sin(e.ft * 2.4) * 1.2); v.rotation = Math.sin(e.ft * 1.7) * 0.04; v.zIndex = e.y;
      // foam behind the stern
      e.wakeT -= dt;
      const sp = Math.hypot(vx, vy);
      if (e.wakeT <= 0 && sp > 12 && !frozen && !e.faded && e.d.wake) { e.wakeT = 0.1; wakePuff(e.x - vx / sp * e.r * 0.9, e.y + 6 - vy / sp * e.r * 0.4, e.r * 0.7); }
    }
    v.tint = e.hit > 0 ? 0xff9a9a : frozen ? 0x9fdcff : (e.slowT || 0) > S.t ? 0xcfeeff : e.elite ? 0xffe2a0 : e.tint;
    if (e.glow) { e.glow.position.set(e.x, e.y - 10); e.glow.alpha = (0.32 + 0.14 * Math.sin(T * 5 + e.ft)) * a; }
  }
  // the sunk: a ship heels over and goes under, a gull tumbles into the water
  for (const s of S.sinking) {
    s.t += dt; const v = s.e.view, f = Math.max(0, s.t / 0.8);
    if (!v) { s.t = 9; continue; }
    if (s.e.d.fly) { v.y += 70 * dt; v.rotation += 7 * dt * (v.scale.x < 0 ? -1 : 1); if (v.sh) v.sh.alpha = 1 - f; }
    else { v.rotation = (v.scale.x < 0 ? 1 : -1) * f * 0.8; v.y += 14 * dt * (f > 0 ? 1 : 0); v.tint = 0x7c8fb0; }
    v.alpha = Math.min(v.alpha, Math.max(0, 1 - f));
    if (v.segs) for (const sg of v.segs) sg.alpha = v.alpha;
    if (f >= 1) freeView(s.e);
  }
  if (S.sinking.some(s => s.t >= 0.8)) S.sinking = S.sinking.filter(s => s.t < 0.8);
}
function drawSharks(dt) {
  for (const sk of S.sharks) {
    // the body is under the water (the ripple filter bends it), the fin cuts the surface
    const tx = -Math.sin(sk.a), ty = Math.cos(sk.a);
    sk.body.position.set(sk.x, sk.y + 6); sk.body.rotation = Math.atan2(ty, tx);
    sk.fin.position.set(sk.x, sk.y - (sk.bite > 0 ? 4 : 0)); sk.fin.zIndex = sk.y; setFrame(sk.fin, 'sharkFin', 0.5, tx < 0);
    sk.wakeT -= dt;
    if (sk.wakeT <= 0) { sk.wakeT = 0.07; wakePuff(sk.x - tx * 10, sk.y + 2 - ty * 6, 7, 0, 0, 0.16, 0.45); }
  }
  const m = S.mega;
  if (m) {
    const tx = Math.sin(m.a), ty = -Math.cos(m.a);
    m.body.position.set(m.x, m.y + 10); m.body.rotation = Math.atan2(ty, tx);
    m.fin.position.set(m.x, m.y - (m.bite > 0 ? 6 : 0)); m.fin.zIndex = m.y; setFrame(m.fin, 'sharkFin', 0.95, tx < 0);
    m.wakeT -= dt;
    if (m.wakeT <= 0) { m.wakeT = 0.06; wakePuff(m.x - tx * 22, m.y + 4 - ty * 12, 14, 0, 0, 0.18, 0.55); }
  }
}
// the tsunami: a ring of foam and light running out from the moon
function drawWave() {
  const w = S.wave; if (!w) return;
  const f = w.f || 0, a = 1 - f;
  MK.circle(S.x, S.y, w.r).stroke({ width: 26 * a + 6, color: 0x2f7fb8, alpha: 0.35 * a + 0.1 });
  MK.circle(S.x, S.y, w.r).stroke({ width: 8 * a + 3, color: 0xe6f6ff, alpha: 0.75 * a + 0.15 });
  FXG.circle(S.x, S.y, w.r - 6).stroke({ width: 10 * a + 2, color: 0x9fe3ff, alpha: 0.5 * a });
}
// arrows at the edge of the screen: the boss, chests, elites, captains and treasure ships
function drawArrows() {
  ARW.clear();
  if (!S || mode !== 'play') return;
  const pts = [];
  if (S.boss && S.boss.ph !== 'gone' && S.boss.ph !== 'rise') pts.push([S.boss.x, S.boss.y, S.boss.kind === 'holandes' ? 0x6affb0 : 0xff5f6d, 16]);
  for (const p of S.pickups) if (p.k === 'chest') pts.push([p.x, p.y, 0xffd36b, 13]);
  for (const e of S.enemies) if (!e.dead && !e.faded && (e.elite || e.cap || e.type === 'goldship')) pts.push([e.x, e.y, e.cap ? e.tint : 0xffc65a, e.cap ? 14 : 11]);
  for (const [x, y, col, sz] of pts) {
    if (onScreen(x, y, -20)) continue;
    const sp = toScreen(x, y), cx = W / 2, cy = H / 2, a = Math.atan2(sp.y - cy, sp.x - cx);
    const m = 30, ex = clamp(sp.x, m, W - m), ey = clamp(sp.y, m + 70, H - m - 110);
    ARW.poly([ex + Math.cos(a) * sz, ey + Math.sin(a) * sz, ex + Math.cos(a + 2.5) * sz * 0.8, ey + Math.sin(a + 2.5) * sz * 0.8, ex + Math.cos(a - 2.5) * sz * 0.8, ey + Math.sin(a - 2.5) * sz * 0.8])
      .fill({ color: col, alpha: 0.6 + 0.3 * Math.sin(T * 6) }).stroke({ width: 2, color: 0x070e20, alpha: 0.8 });
  }
}
// the whole frame
function drawFrame(dt, rdt) {
  MK.clear(); REFL.clear(); FXG.clear();
  const mx = S ? S.x : cam.x, my = S ? S.y : cam.y;
  refreshProps();
  drawSea(mx, my);
  for (const p of NEAR_PROPS) drawProp(p);
  if (S) { drawPickups(); drawEnemies(dt); drawSharks(dt); drawBoss(); drawWave(); drawArms(); drawPowers(); }
  drawMoon(mx, my);
  drawJoy(); drawArrows();
  fxTick(rdt); numsTick(rdt); filtersTick(rdt);
  placeCamera();
  rdr.render(stage);
}
