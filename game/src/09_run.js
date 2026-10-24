
// =====================================================================
// THE RUN: the moon, what it carries, experience and levels, the camera, and how a run ends
// =====================================================================
let S = null;            // the run in progress (null on the title screen)
let mode = 'title';      // 'title' | 'play' | 'levelup' | 'chest' | 'pause' | 'over'
function newRun() {
  S = {
    t: 0, x: 0, y: 0, vx: 0, vy: 0, hp: MOON.hp, maxHp: MOON.hp, lv: 1, xp: 0, next: xpNeed(1),
    kills: 0, coins: 0, near: 0, ended: false, win: false, quit: false, god: false,
    weapons: { [MOON.weapon]: 1 }, evo: {}, passives: {}, rerolls: 2 + shopLv('baraja'), revive: shopLv('manantial') > 0, safeT: 0, pendingLv: 0, chestsOpen: 0,
    charge: 0.35, face: 'calm', faceT: 0, blinkT: 3, deadT: 0,
    enemies: [], shots: [], sharks: [], pickups: [], sinking: [], wave: null,
    rings: [], bolts: [], marks: [], pools: [], rocks: [], eshots: [], act: null, hidden: false, cds: {}, cap: null, slowT: 0, bossI: 0, caps: 0, gloom: 0,
    spawnAcc: 0, eventI: 0, boss: null, rayCd: 0.6, sharkA: 0, touch: 0, magnetT: 0, newBest: false,
  };
  S.hp = S.maxHp = 0; recalc(); S.hp = S.maxHp;
  ZONE_NOW = S.zone = 'mareas'; MINI.t = 0;
}
// what the passives, the moon's trait and the workshop add up to
const shopLv = k => save.shop[k] || 0;
function recalc() {
  const lv = k => S.passives[k] || 0, m = MOON.mods, u = shopLv;
  S.st = { dmg: 1 + 0.1 * lv('espejo') + (m.dmg || 0) + 0.06 * u('fuerza'), area: 1 + 0.1 * lv('marea'), cd: Math.pow(0.92, lv('lente')), spd: 1 + 0.08 * lv('motor') + 0.04 * u('viento'),
    magnet: 70 * (1 + 0.3 * lv('iman') + 0.12 * u('iman')), regen: 0.3 * lv('nacar'), xp: 1 + 0.1 * lv('caracola') + (m.xp || 0) + 0.05 * u('sabio'),
    coins: 1 + (m.coins || 0) + 0.1 * u('codicia'), chill: !!m.chill, slots: MAX_WEAPONS + (m.slots || 0), charge: ACTIVE_CHARGE * (1 + (m.charge || 0)) * (1 - 0.08 * u('luz')),
    armor: 1 - 0.05 * u('coraza') };
  const max = MOON.hp + (m.hpAdd || 0) + 20 * lv('nacar') + 10 * u('vida');
  if (max > S.maxHp) S.hp += max - S.maxHp;
  S.maxHp = max;
}
// the first levels come fast, then each one asks for a bit more
const xpNeed = lv => Math.round(3 + (lv - 1) * 4.5 + Math.pow(lv - 1, 1.65));
function gainXp(v) {
  S.xp += v * S.st.xp;
  while (S.xp >= S.next) { S.xp -= S.next; S.lv++; S.next = xpNeed(S.lv); S.pendingLv++; }
}
// three cards to choose from: new weapons and new upgrades weigh a bit more early on
function offers(n = 3) {
  const pool = [], nw = Object.keys(S.weapons).length;
  for (const k in WEAPONS) { const l = S.weapons[k] || 0; if (l < WEAPONS[k].lv.length && (l || nw < S.st.slots)) pool.push({ kind: 'w', id: k, lv: l, w: l ? 1.2 : 1.8 }); }
  const np = Object.keys(S.passives).length;
  for (const k in PASSIVES) { const l = S.passives[k] || 0; if (l < PASSIVES[k].max && (l || np < MAX_PASSIVES)) pool.push({ kind: 'p', id: k, lv: l, w: l ? 1 : 0.9 }); }
  const out = [];
  while (out.length < n && pool.length) {
    let r = Math.random() * pool.reduce((a, o) => a + o.w, 0), i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  // everything is at its best: the moon heals or takes gold instead
  if (!out.length) out.push({ kind: 'heal' }, { kind: 'gold' });
  return out;
}
// weapons ready to evolve: at their best, with the partner upgrade, not evolved yet
const evoReady = () => Object.keys(S.weapons).filter(k => S.weapons[k] >= WEAPONS[k].lv.length && !S.evo[k] && S.passives[EVOS[WEAPONS[k].evo].pas]);
function takeOffer(o) {
  if (o.kind === 'w') S.weapons[o.id] = (S.weapons[o.id] || 0) + 1;
  else if (o.kind === 'p') { S.passives[o.id] = (S.passives[o.id] || 0) + 1; recalc(); }
  else if (o.kind === 'evo') S.evo[o.id] = true;
  else if (o.kind === 'heal') S.hp = Math.min(S.maxHp, S.hp + 30);
  else if (o.kind === 'gold') S.coins += 25;
  kitDirty = true;
}

// ---- the moon
function moonTick(dt) {
  const m = moveInput(), sp = MOON.spd * S.st.spd * (S.hidden ? 1.25 : 1) * (S.slowT > S.t ? 0.55 : 1), k = 1 - Math.exp(-12 * dt);
  S.vx += (m.x * sp - S.vx) * k; S.vy += (m.y * sp - S.vy) * k;
  S.x += S.vx * dt; S.y += S.vy * dt;
  if (S.st.regen) S.hp = Math.min(S.maxHp, S.hp + S.st.regen * dt);
  S.charge = Math.min(1, S.charge + dt / S.st.charge);
  // its face: hurt, fierce or happy for a moment, worried when low, and it blinks
  S.faceT -= dt; S.blinkT -= dt;
  if (S.blinkT < -0.12) S.blinkT = rand(2.5, 5);
}
function setFace(f, t) { S.face = f; S.faceT = t; }
function moonFace() {
  if (S.ended && !S.win) return 'sad';
  if (S.faceT > 0) return S.face;
  if (S.hp < S.maxHp * 0.3) return 'worried';
  return S.blinkT < 0 ? MOON.face + '_blink' : MOON.face;
}
function hurtMoon(d) {
  if (S.ended || S.god || S.hidden || S.safeT > S.t) return;
  S.hp -= d * S.st.armor;
  if (gate('moonhurt', 300)) { sfx('hurt'); vib('hit'); setFace('hurt', 0.45); hurtFlash(); }
  if (S.hp <= 0 && S.revive) secondTide();
  else if (S.hp <= 0) { S.hp = 0; endRun(false); }
}
// Segunda marea (the workshop): once a night the moon comes back up with half its life and throws everything back
function secondTide() {
  S.revive = false; S.hp = S.maxHp * 0.5; S.safeT = S.t + 2.5;
  banner('¡Segunda marea!', 'La luna vuelve a flote', true); sfx('act_llena'); vib('heavy'); setFace('fierce', 1.5);
  shock(S.x, S.y, 40, 220, 600, 900); ringWave(S.x, S.y, 0x9fe3ff, MOON_R, 260, 0.6, 1); cam.shake = 1;
  for (const e of S.enemies) { if (e.dead) continue; const dx = e.x - S.x, dy = e.y - S.y, d = Math.hypot(dx, dy) || 1; if (d < 320) hurt(e, 30, dx / d * 900, dy / d * 900, true); }
  for (const b of S.eshots) b.done = true;
}
function healMoon(v) { S.hp = Math.min(S.maxHp, S.hp + v); sfx('heal'); setFace('happy', 0.8); numText(S.x, S.y - MOON_R - 10, '+' + Math.round(v), 0x7fe0b5, 15); }

// the camera glides after the moon and looks ahead of where it is going
function camTick(dt) {
  const k = 1 - Math.exp(-4 * dt);
  cam.x += (S.x + S.vx * 0.38 - cam.x) * k; cam.y += (S.y + S.vy * 0.38 - cam.y) * k;
  cam.shake = Math.max(0, cam.shake - dt * 2.5);
}

// ---- the end: the moon sinks, or the night ends and dawn wins the run
function dawn() {
  banner('¡Amanece!', 'La flota huye de la luz del sol', true);
  // what is left of the fleet goes down in the first light
  for (const e of S.enemies) if (!e.dead) { e.dead = true; if (e.view) S.sinking.push({ e, t: rand(-0.6, 0) }); }
  for (const b of S.eshots) b.view.destroy();
  S.eshots = [];
  // the sun comes up over the top of the screen and warms the sea
  S.gloom = 0; L.sea.tint = 0xffd6b0; sfx('heroic'); vib('win'); setFace('cheer', 9);
  S.sun = glow(L.fx, 0xffb46a, Math.max(viewW(), viewH()) * 1.8, 0.8); S.sun.anchor.set(0.5); S.sun.position.set(cam.x, cam.y - viewH() * 0.62);
  endRun(true);
}
function endRun(win) {
  if (S.ended) return;
  S.ended = true; S.win = win;
  S.coins = Math.round(S.coins); save.coins += S.coins; save.runs++; save.kills += S.kills; save.caps = (save.caps || 0) + S.caps;
  if (win) save.wins++;
  if (S.t > save.best) { save.best = S.t; S.newBest = true; }
  // each moon keeps its own records
  const r = save.rec[MOON.id] || (save.rec[MOON.id] = { best: 0, wins: 0, kills: 0 });
  if (S.t > r.best) r.best = S.t;
  if (S.kills > r.kills) r.kills = S.kills;
  if (win) r.wins++;
  persist();
  musicStop(); musicSting(win ? 'win' : S.quit ? null : 'lose');
  if (!win) { sinkFx(S.x, S.y, 1.6); vib('heavy'); }
  setTimeout(() => { if (S && S.ended && mode === 'play') showResults(); }, S.quit ? 200 : win ? 2600 : 1600);
}
