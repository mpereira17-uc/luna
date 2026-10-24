
// =====================================================================
// THE MOON'S POWER OVER THE SEA (the button): each moon has its own
// Llena: tsunami · Roja: a sea of blood that burns · Hielo: blizzard that freezes · Nueva: eclipse, hidden
// Tormenta: a deluge of lightning · Dorada: gold fever, double rewards and everything flies to the moon
// =====================================================================
function useActive() {
  if (mode !== 'play' || !S || S.ended || S.charge < 1) return false;
  S.charge = 0;
  sfx('act_' + MOON.id); vib('heavy'); setFace('fierce', 1.4);
  POWERS[MOON.id].start();
  return true;
}
// the sea takes the colour of the power while it lasts
const mixTint = (a, b, f) => {
  const r = (a >> 16) + ((b >> 16) - (a >> 16)) * f, g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * f, bl = (a & 255) + ((b & 255) - (a & 255)) * f;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
};
const POWERS = {
  llena: {
    start() {
      S.wave = { t: 0, r: MOON_R, max: 440 * S.st.area, hit: new Set() };
      shock(S.x, S.y, 34, 170, 600, 760); cam.shake = 0.9;
      ringWave(S.x, S.y, 0x9fe3ff, MOON_R, 140, 0.45, 1);
    },
  },
  roja: {
    sea: 0xff8f8f,
    start() {
      S.act = { k: 'roja', t: 0, T: 8, tick: 0 };
      shock(S.x, S.y, 22, 120, 480, 420); cam.shake = 0.6;
      ringWave(S.x, S.y, 0xff5f6d, MOON_R, 170, 0.5, 1);
      banner('Marea de sangre', 'El mar rojo quema a la flota');
    },
    tick(dt, a) {
      const R = 175 * S.st.area; a.R = R; a.tick += dt;
      if (a.tick >= 0.25) {
        a.tick = 0;
        eachNear(S.x, S.y, R + 30, e => { if (dist2(e.x, e.y, S.x, S.y) < (R + e.r) ** 2) hurt(e, 9 * S.st.dmg); });
        const b = S.boss; if (b && b.hittable && Math.hypot(b.x - S.x, b.y - S.y) < R + b.r) hurtBoss(20 * S.st.dmg);
      }
      if (Math.random() < 0.8) { const an = rand(0, TAU), rr = R * Math.sqrt(Math.random()); puff({ add: true, tex: FX.dot, x: S.x + Math.cos(an) * rr, y: S.y + Math.sin(an) * rr, vy: -rand(20, 50), life: rand(0.5, 0.9), s0: rand(6, 12), s1: 2, tint: 0xff5f6d, a: 0.8 }); }
    },
  },
  hielo: {
    start() {
      let n = 0;
      for (const e of S.enemies) if (!e.dead && onScreen(e.x, e.y, 60)) { freezeEnemy(e, 4); n++; }
      const b = S.boss; if (b && b.hittable) b.frozen = S.t + 2.5;
      S.act = { k: 'hielo', t: 0, T: 1.2 };
      shock(S.x, S.y, 18, 160, 700, 800); ringWave(S.x, S.y, 0xd8f4ff, MOON_R, 260, 0.6, 1);
      // a gust of snow across the whole screen
      const vw = viewW() / 2, vh = viewH() / 2;
      for (let i = 0; i < 70; i++) puff({ add: true, tex: FX.star, x: cam.x + rand(-vw, vw) - 120, y: cam.y + rand(-vh, vh), vx: rand(160, 320), vy: rand(40, 90), life: rand(0.8, 1.4), s0: rand(5, 10), s1: 3, tint: 0xeaf8ff, a: 0.9, rot: rand(0, TAU), vr: rand(-4, 4) });
      banner('Ventisca', n === 1 ? '1 barco congelado' : n ? `${n} barcos congelados` : 'El mar se congela');
    },
    sea: 0xd6f2ff,
  },
  nueva: {
    sea: 0x8a80c8,
    start() {
      S.act = { k: 'nueva', t: 0, T: 6 }; S.hidden = true;
      for (const e of S.enemies) e.wander = null;
      ringWave(S.x, S.y, 0x6a50c8, MOON_R * 3, MOON_R, 0.5, 1);
      for (let i = 0; i < 18; i++) { const a = rand(0, TAU); puff({ add: true, tex: FX.dot, x: S.x, y: S.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.6, s0: 14, s1: 4, tint: 0xb49cff, a: 0.7, drag: 2 }); }
      banner('Eclipse', 'La flota te ha perdido de vista');
    },
    end() { S.hidden = false; ringWave(S.x, S.y, 0xc9b2ff, MOON_R, MOON_R * 4, 0.5, 0.9); },
  },
  tormenta: {
    sea: 0x9aa6cc,
    start() { S.act = { k: 'tormenta', t: 0, T: 6, next: 0, bossT: 0 }; cam.shake = 0.5; banner('Diluvio', 'Rayos sobre toda la flota'); },
    tick(dt, a) {
      a.next -= dt; a.bossT -= dt;
      if (a.next <= 0) {
        a.next = 0.12;
        const ts = S.enemies.filter(e => !e.dead && onScreen(e.x, e.y, -10));
        if (ts.length) { strike(pick(ts), 34 * S.st.dmg, 1); sfx('thunder'); }
      }
      const b = S.boss; if (b && b.hittable && a.bossT <= 0 && onScreen(b.x, b.y, 0)) { a.bossT = 0.5; boltOnBoss(b, 55 * S.st.dmg); }
      // rain slanting across the screen
      const vw = viewW() / 2, vh = viewH() / 2;
      for (let i = 0; i < 4; i++) puff({ tex: FX.streak, x: cam.x + rand(-vw, vw + 100), y: cam.y - vh - 20, vx: -110, vy: 620, life: 0.9, s0: 3, s1: 3, sx: 6, align: true, tint: 0xcfe0ff, a: 0.45 });
    },
  },
  dorada: {
    sea: 0xffeec0,
    start() {
      S.act = { k: 'dorada', t: 0, T: 8 }; S.magnetT = 8;
      ringWave(S.x, S.y, 0xffd36b, MOON_R, 200, 0.55, 1); sparks(S.x, S.y, COL.gold, 16, 240, 10);
      banner('Fiebre del oro', 'Doble de perlas y monedas');
    },
    tick() { if (Math.random() < 0.5) { const a = rand(0, TAU); puff({ add: true, tex: FX.star, x: S.x + Math.cos(a) * MOON_R * 1.4, y: S.y - 8 + Math.sin(a) * MOON_R * 1.4, vy: -30, life: 0.6, s0: 9, s1: 2, tint: COL.gold }); } },
  },
};
function actTick(dt) {
  const a = S.act;
  let want = a && POWERS[a.k].sea ? POWERS[a.k].sea : 0xffffff;
  if (S.gloom > 0) want = mixTint(want, 0x4a5a78, S.gloom);
  L.sea.tint = mixTint(L.sea.tint, want, Math.min(1, 3 * dt));
  if (!a) return;
  a.t += dt;
  if (POWERS[a.k].tick) POWERS[a.k].tick(dt, a);
  if (a.t >= a.T) { if (POWERS[a.k].end) POWERS[a.k].end(a); S.act = null; }
}
// the tsunami (Luna llena): the ring of water runs out, hits every ship and throws it far (onto the reefs, if there are any)
function waveTick(dt) {
  const w = S.wave; if (!w) return;
  w.t += dt;
  const f = Math.min(1, w.t / 0.95), r = MOON_R + (w.max - MOON_R) * (1 - Math.pow(1 - f, 2.2));
  w.r = r; w.f = f;
  for (const e of S.enemies) {
    if (e.dead || w.hit.has(e)) continue;
    const dx = e.x - S.x, dy = e.y - S.y, d = Math.hypot(dx, dy) || 1;
    if (d < r + e.r) { w.hit.add(e); hurt(e, 40 * S.st.dmg, dx / d * 700, dy / d * 700, true); }
  }
  const b = S.boss;
  if (b && b.hittable && !w.hit.has(b) && Math.hypot(b.x - S.x, b.y - S.y) < r + b.r) { w.hit.add(b); hurtBoss(160 * S.st.dmg); }
  washShots(S.x, S.y, r);
  for (let i = 0; i < 7; i++) {
    const a = rand(0, TAU);
    puff({ tex: FX.drop, x: S.x + Math.cos(a) * r, y: S.y + Math.sin(a) * r, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 25, g: 120, life: 0.5, s0: 8, s1: 3, tint: COL.foam });
  }
  if (f >= 1) S.wave = null;
}
// what a lasting power looks like on the water
function drawPowers() {
  const a = S.act; if (!a) return;
  if (a.k === 'roja' && a.R) {
    const fade = Math.min(1, a.t / 0.3, (a.T - a.t) / 0.5), pul = 0.5 + 0.5 * Math.sin(T * 6);
    MK.circle(S.x, S.y, a.R).fill({ color: 0xc81e3a, alpha: (0.16 + 0.05 * pul) * fade }).stroke({ width: 4, color: 0xff5f6d, alpha: 0.7 * fade });
    FXG.circle(S.x, S.y, a.R * (0.94 + 0.04 * pul)).stroke({ width: 3, color: 0xff8a7a, alpha: 0.45 * fade });
  }
}
