
// =====================================================================
// SCREENS: title, level-up cards, chests, pause, results, and the curtain between them
// =====================================================================
const SCREENS = ['scrTitle', 'scrShop', 'levelUp', 'chestScr', 'scrPause', 'scrResult'];
function show(id) {
  SCREENS.forEach(s => { const el = $(s), on = s === id; if (on && el.hidden) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); } el.hidden = !on; });
  $('hud').hidden = !(id === null || id === 'levelUp' || id === 'chestScr');
}
let curtainBusy = false;
function curtain(fn) {
  if (reduceMotion) { fn(); return; }
  if (curtainBusy) return;
  curtainBusy = true; $('curtain').classList.add('on');
  setTimeout(() => { fn(); curtainBusy = false; requestAnimationFrame(() => $('curtain').classList.remove('on')); }, 290);
}
const releaseJoy = () => { JOY.id = null; JOY.on = false; };
// the Android app keeps the screen on only while a night at sea is going
const keepAwake = on => { try { if (window.LunaHost) window.LunaHost.keepAwake(on); } catch (e) {} };

// ---- title: the sea drifts by under the moon
function showTitle() {
  clearRun(); mode = 'title'; keepAwake(false);
  show('scrTitle');
  $('titleCoins').textContent = fmtNum(save.coins);
  $('titleBest').textContent = save.best ? `Tu mejor marca: ${fmtTime(save.best)}` + (save.wins ? ` · ${save.wins} ${save.wins === 1 ? 'noche superada' : 'noches superadas'}` : '') : '';
  $('shopIco').innerHTML = ico('i_ancla', 20);
  drawMoonPick();
  musicStart('title'); setAudioGains();
}
// ---- choosing the moon: its portrait, its power, its weapon and its trait; locked ones are bought with coins
const moonOpen = m => save.moons.includes(m.id);
function drawMoonPick() {
  moonPortrait($('moonCv'), MOON.face);
  setMoonLook();
  const el = $('scrTitle'), open = moonOpen(MOON), r = save.rec[MOON.id];
  el.style.setProperty('--mp', MOON.color);
  $('scrTitle').querySelector('.moonpick').classList.toggle('locked', !open);
  $('mpName').textContent = MOON.name;
  $('mpPower').innerHTML = `${ico(MOON.ico, 26)}<span><b>${MOON.active}.</b> ${MOON.activeDesc}</span>`;
  $('mpPerk').innerHTML = `${ico(WEAPONS[MOON.weapon].ico, 22)}<span>Empieza con ${WEAPONS[MOON.weapon].name}. ${MOON.perk}</span>`;
  $('mpRec').textContent = !open ? '' : r && r.best ? `Récord: ${fmtTime(r.best)} · ${fmtNum(r.kills)} hundidos` + (r.wins ? ` · ${r.wins} ${r.wins === 1 ? 'amanecer' : 'amaneceres'}` : '') : 'Aún no ha salido al mar';
  $('mpDots').innerHTML = MOONS.map((m, i) => `<button type="button" data-i="${i}" aria-label="${m.name}${moonOpen(m) ? '' : ' (bloqueada)'}" aria-current="${m === MOON}"${moonOpen(m) ? '' : ' class="lock"'}></button>`).join('');
  // the big button: set sail, or buy this moon
  const go = $('goPlay'), lack = MOON.cost - save.coins;
  go.disabled = !open && lack > 0;
  go.firstElementChild.innerHTML = open ? 'Zarpar<small id="goSub">Aguanta 15 minutos hasta el amanecer</small>'
    : `Desbloquear<small id="goSub">${fmtNum(MOON.cost)} monedas${lack > 0 ? ` · te faltan ${fmtNum(lack)}` : ''}</small>`;
  $('titleCoins').textContent = fmtNum(save.coins);
}
function pickMoon(i) {
  MOON = MOONS[(i + MOONS.length) % MOONS.length];
  if (moonOpen(MOON)) { save.moon = MOON.id; persist(); }
  drawMoonPick(); sfx('card');
}
function goPlay() {
  if (moonOpen(MOON)) { startRun(); return; }
  if (save.coins < MOON.cost) return;
  save.coins -= MOON.cost; save.moons.push(MOON.id); save.moon = MOON.id; persist();
  sfx('union'); vib('heroic');
  drawMoonPick(); moonPortrait($('moonCv'), 'cheer');
}

// ---- the workshop: permanent upgrades for every moon
function showShop() { show('scrShop'); drawShop(); sfx('card'); }
function drawShop(just) {
  $('shopCoins').textContent = fmtNum(save.coins);
  $('shopList').innerHTML = Object.entries(SHOP).map(([k, d]) => {
    const lv = shopLv(k), max = lv >= d.max, cost = max ? 0 : shopCost(k, lv), cant = !max && cost > save.coins;
    return `<button type="button" class="shop-row${max ? ' max' : cant ? ' cant' : ''}${just === k ? ' bought' : ''}" data-k="${k}"${max ? ' aria-disabled="true"' : ''}>
      <span class="ico">${ico(d.ico, 40)}</span>
      <span><b>${d.name}</b><span class="d">${d.desc}</span><span class="pips" aria-label="nivel ${lv} de ${d.max}">${'★'.repeat(lv)}<span class="off">${'★'.repeat(d.max - lv)}</span></span></span>
      <span class="buy">${max ? 'Completo' : `<i class="coin"></i>${fmtNum(cost)}`}</span></button>`;
  }).join('');
}
function buyShop(k) {
  const d = SHOP[k], lv = shopLv(k); if (!d || lv >= d.max) return;
  const cost = shopCost(k, lv); if (cost > save.coins) { sfx('warn'); return; }
  save.coins -= cost; save.shop[k] = lv + 1; persist();
  sfx('coin'); sfx('level'); vib('tap');
  drawShop(k);
}
function titleCam(dt) { cam.x += 26 * dt; cam.y = Math.sin(T * 0.09) * 160; cam.shake = 0; }
// everything a run put in the scene goes away with it
function clearRun() {
  if (!S) return;
  for (const e of S.enemies) freeView(e);
  for (const s of S.sinking) freeView(s.e);
  for (const sh of S.shots) { sh.view.visible = false; sh.view.removeFromParent(); SHOTPOOL.push(sh.view); }
  for (const sk of S.sharks) { sk.body.destroy(); sk.fin.destroy(); }
  if (S.mega) { S.mega.body.destroy(); S.mega.fin.destroy(); }
  for (const k of S.rocks) { k.view.destroy(); k.g.destroy(); }
  for (const p of S.pools) p.view.destroy();
  if (S.sun) S.sun.destroy();
  L.sea.tint = 0xffffff;
  for (const p of S.pickups) { p.view.destroy(); if (p.glow) p.glow.destroy(); }
  if (S.boss) bossFree(S.boss);
  for (const b of S.eshots) b.view.destroy();
  FILT.shock = []; world.filters = null;
  $('bossBar').hidden = true; MUS.boss = false;
  S = null;
}
function startRun() {
  audioInit();
  curtain(() => {
    clearRun(); newRun(); setMoonLook();
    cam.x = 0; cam.y = 0;
    hudInit(); show(null); mode = 'play'; keepAwake(true);
    musicStart('sea'); setAudioGains(); sfx('intro');
    banner('Arrastra para moverte', 'Tus armas disparan solas');
  });
}

// ---- level up: three cards
const pips = (a, b, max) => `<span class="lvchg" aria-label="de nivel ${a} a ${b}">${'★'.repeat(a)}<span class="off">${'★'.repeat(max - a)}</span><span class="ar">→</span>${'★'.repeat(b)}<span class="off">${'★'.repeat(max - b)}</span></span>`;
function cardInfo(o) {
  if (o.kind === 'evo') { const ev = EVOS[WEAPONS[o.id].evo]; return { ico: ev.ico, name: ev.name, tag: ['EVOLUCIÓN', 't-evo'], d: ev.desc, lv: '', evo: true }; }
  if (o.kind === 'heal') return { ico: 'i_vida', name: 'Recuperar vida', tag: ['CURA', 't-heal'], d: '+30 de vida', lv: '' };
  if (o.kind === 'gold') return { ico: 'i_monedas', name: 'Bolsa de monedas', tag: ['ORO', 't-up'], d: '+25 monedas', lv: '' };
  const w = o.kind === 'w', def = w ? WEAPONS[o.id] : PASSIVES[o.id], max = w ? def.lv.length : def.max;
  return { ico: def.ico, name: def.name, tag: o.lv ? ['NIVEL ' + (o.lv + 1), 't-up'] : ['NUEVA', 't-new'], d: w && o.lv ? def.lv[o.lv] : def.desc, lv: pips(o.lv, o.lv + 1, max) };
}
const cardHtml = (c, tag, i) => `<${tag} class="up${c.evo ? ' evo' : ''}"${tag === 'button' ? ` type="button" data-i="${i}"` : ''}><span class="ico">${ico(c.ico, 50)}</span><span><span class="top"><span class="tagl ${c.tag[1]}">${c.tag[0]}</span>${c.lv}</span><b>${c.name}</b><span class="d">${c.d}</span></span></${tag}>`;
let cardOpts = [], cardLock = 0;
function openLevelUp() {
  mode = 'levelup'; releaseJoy();
  sfx('level'); vib('heroic'); setFace('happy', 1);
  $('luTitle').textContent = `¡Nivel ${S.lv - S.pendingLv + 1}!`;
  dealCards();
  show('levelUp');
}
function dealCards() {
  cardOpts = offers(3); cardLock = performance.now() + 380;
  $('cards').innerHTML = cardOpts.map((o, i) => cardHtml(cardInfo(o), 'button', i)).join('');
  $('rerollBtn').hidden = S.rerolls <= 0;
  $('rerollBtn').textContent = `Cambiar cartas (${S.rerolls})`;
}
function chooseCard(i) {
  if (mode !== 'levelup' || performance.now() < cardLock || !cardOpts[i]) return;
  takeOffer(cardOpts[i]); sfx('card');
  S.pendingLv--;
  if (S.pendingLv > 0) openLevelUp(); else { show(null); mode = 'play'; }
}

// ---- chests: one upgrade (three from a boss's) and gold
function openChest(big) {
  mode = 'chest'; releaseJoy(); S.chestsOpen++;
  const got = [];
  // a weapon at its best with its partner upgrade evolves; otherwise, upgrades
  for (let i = 0; i < (big ? 3 : 1); i++) {
    const ev = evoReady(), o = ev.length ? { kind: 'evo', id: ev[0] } : offers(1)[0];
    got.push(cardInfo(o)); takeOffer(o);
    if (o.kind === 'evo') { banner('¡Evolución!', EVOS[WEAPONS[o.id].evo].name); sfx('union'); }
  }
  const gold = big ? 50 : randi(10, 25); S.coins += gold;
  const c = $('chestCv'), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  const halo = g.createRadialGradient(120, 120, 10, 120, 120, 118); halo.addColorStop(0, 'rgba(255,211,107,0.5)'); halo.addColorStop(1, 'rgba(255,211,107,0)');
  g.fillStyle = halo; g.fillRect(0, 0, 240, 240); sprOn(g, 'chest', 120, 150, 4.4);
  $('chestCards').innerHTML = ''; $('chestOk').hidden = true;
  $('chestBox').classList.remove('shake'); void $('chestBox').offsetWidth; $('chestBox').classList.add('shake');
  show('chestScr'); sfx('anchor'); vib('heavy');
  $('chestOk').onclick = () => { sfx('card'); show(null); mode = 'play'; };
  setTimeout(() => {
    $('chestCards').innerHTML = got.map(cd => cardHtml(cd, 'div')).join('') + `<div class="best" style="font-size:16px;color:var(--gold)">+${gold} monedas</div>`;
    $('chestOk').hidden = false; sfx('evo');
  }, reduceMotion ? 80 : 1000);
}

// ---- pause
function togglePause() {
  if (mode === 'play' && S && !S.ended) {
    mode = 'pause'; releaseJoy();
    const gear = (have, defs, slots) => { const ks = Object.keys(have); let h = ''; for (let i = 0; i < slots; i++) h += ks[i] ? (defs === WEAPONS && S.evo[ks[i]] ? `<span class="evo">${ico(wDef(ks[i]).ico, 30)}</span>` : `<span>${ico(defs[ks[i]].ico, 30)}<i>${have[ks[i]]}</i></span>`) : '<span class="empty"></span>'; return h; };
    $('gearW').innerHTML = gear(S.weapons, WEAPONS, S.st.slots); $('gearP').innerHTML = gear(S.passives, PASSIVES, MAX_PASSIVES);
    syncSettings(); show('scrPause'); setAudioGains();
  } else if (mode === 'pause') { show(null); mode = 'play'; setAudioGains(); }
}
function syncSettings() {
  $('setMusic').setAttribute('aria-checked', String(!!save.music));
  $('setSfx').setAttribute('aria-checked', String(!!save.sfx));
  $('setFx').setAttribute('aria-checked', String(FXQ === 'alto'));
}

// ---- results
function showResults() {
  mode = 'over'; releaseJoy(); keepAwake(false);
  const win = S.win;
  moonPortrait($('rMoon'), win ? 'cheer' : S.quit ? 'calm' : 'sad');
  $('rTitle').textContent = win ? '¡Amanece!' : S.quit ? 'Partida terminada' : 'La luna se hundió';
  const next = BOSS_TIMES.find(b => b[0] > S.t);
  $('rSub').textContent = win ? 'Has aguantado la noche entera y el mar es tuyo.' : `Aguantaste ${fmtTime(S.t)}` + (S.newBest ? ', tu mejor marca.' : '.') + (next ? ` ${BOSSES[next[1]].name} sale en el minuto ${next[0] / 60}.` : ' Amanece en el minuto 15.');
  const row = (k, v, gold) => `<dt>${k}</dt><dd${gold ? ' class="gold"' : ''}>${v}</dd>`;
  $('rTally').innerHTML = row('Tiempo', fmtTime(S.t)) + row('Barcos hundidos', fmtNum(S.kills)) + row('Nivel', S.lv) + (S.caps ? row('Capitanes', S.caps) : '') + row('Monedas', '+' + fmtNum(S.coins), true);
  $('rBuild').innerHTML = [...Object.entries(S.weapons).map(([k, v]) => [wDef(k), S.evo[k] ? '' : v]), ...Object.entries(S.passives).map(([k, v]) => [PASSIVES[k], v])]
    .map(([d, v]) => `<span>${ico(d.ico, 20)} ${d.name} ${v}</span>`).join('');
  show('scrResult');
  setTimeout(() => { if (mode === 'over') musicStart('title'); }, 2600);
}

function wireScreens() {
  $('goPlay').onclick = goPlay;
  $('shopBtn').onclick = showShop;
  $('shopBack').onclick = () => { show('scrTitle'); drawMoonPick(); sfx('card'); };
  $('shopList').addEventListener('click', e => { const b = e.target.closest('.shop-row'); if (b) buyShop(b.dataset.k); });
  $('moonPrev').onclick = () => pickMoon(MOONS.indexOf(MOON) - 1);
  $('moonNext').onclick = () => pickMoon(MOONS.indexOf(MOON) + 1);
  $('mpDots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pickMoon(+b.dataset.i); });
  addEventListener('keydown', e => { if (mode !== 'title' || $('scrTitle').hidden) return; if (e.code === 'ArrowLeft') pickMoon(MOONS.indexOf(MOON) - 1); if (e.code === 'ArrowRight') pickMoon(MOONS.indexOf(MOON) + 1); });
  $('cards').addEventListener('click', e => { const b = e.target.closest('.up'); if (b) chooseCard(+b.dataset.i); });
  $('rerollBtn').onclick = () => { if (S.rerolls > 0) { S.rerolls--; sfx('card'); dealCards(); } };
  $('pauseBtn').onclick = togglePause;
  $('resumeBtn').onclick = togglePause;
  $('quitBtn').onclick = () => { show(null); mode = 'play'; S.quit = true; endRun(false); };
  $('activeBtn').addEventListener('pointerdown', e => { e.stopPropagation(); audioInit(); useActive(); });
  $('setMusic').onclick = () => { save.music = !save.music; persist(); syncSettings(); setAudioGains(); if (save.music) musicStart(); };
  $('setSfx').onclick = () => { save.sfx = !save.sfx; persist(); syncSettings(); setAudioGains(); };
  $('setFx').onclick = () => { FXQ = FXQ === 'alto' ? 'bajo' : 'alto'; save.fx = FXQ; save.fxManual = true; persist(); applyQuality(); syncSettings(); };
  $('againBtn').onclick = startRun;
  $('homeBtn').onclick = () => curtain(showTitle);
  // the Android app: back pauses or goes back a screen; leaving the app pauses
  window.lunaBack = () => {
    if (mode === 'play' && S && !S.ended) { togglePause(); return true; }
    if (mode === 'pause') { togglePause(); return true; }
    if (mode === 'over') { curtain(showTitle); return true; }
    if (mode === 'title' && !$('scrShop').hidden) { show('scrTitle'); drawMoonPick(); return true; }
    return mode !== 'title';
  };
  window.lunaPause = () => { if (mode === 'play' && S && !S.ended) togglePause(); if (AU.ctx) AU.ctx.suspend(); };
  window.lunaResume = () => { if (AU.ctx) AU.ctx.resume(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.lunaPause(); else window.lunaResume(); });
}
