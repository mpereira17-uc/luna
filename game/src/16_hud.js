
// =====================================================================
// HUD (DOM over the canvas): experience, life, time, sunk ships, coins, the boss's or captain's life,
// what the moon carries, and the tsunami button. Written only when something changes.
// =====================================================================
const HC = {};
let kitDirty = true;
function hudSet(id, prop, val) {
  const k = id + prop; if (HC[k] === val) return; HC[k] = val;
  const el = $(id);
  if (prop === 'text') el.textContent = val; else if (prop === 'w') el.style.width = val; else if (prop === 'p') el.style.setProperty('--p', val); else if (prop === 'cls') el.classList.toggle('ready', val); else if (prop === 'joy') el.classList.toggle('joy', val); else if (prop === 'hide') el.hidden = val; else if (prop === 'capc') el.classList.toggle('cap', val);
}
function hudInit() {
  $('pauseBtn').innerHTML = ico('i_pausa', 22);
  $('activeIco').innerHTML = ico(MOON.ico, 44);
  $('activeLbl').textContent = MOON.active;
  $('hudMoon').textContent = MOON.name;
  $('activeBtn').style.setProperty('--moon-c', MOON.color);
  for (const k in HC) delete HC[k];
  kitDirty = true;
}
function hudTick() {
  hudSet('xpFill', 'w', (S.xp / S.next * 100).toFixed(1) + '%');
  hudSet('lvTxt', 'text', 'Nivel ' + S.lv);
  hudSet('hpFill', 'w', (S.hp / S.maxHp * 100).toFixed(1) + '%');
  hudSet('hpTxt', 'text', `${Math.ceil(S.hp)} / ${S.maxHp}`);
  hudSet('timer', 'text', fmtTime(S.t));
  hudSet('killTxt', 'text', fmtNum(S.kills) + ' hundidos');
  hudSet('coinTxt', 'text', fmtNum(S.coins));
  hudSet('activeBtn', 'p', S.charge.toFixed(3));
  hudSet('activeBtn', 'cls', S.charge >= 1);
  hudSet('hud', 'cls', S.charge >= 1);
  hudSet('hud', 'joy', JOY.on);
  // the big bar up top: the boss, or else the captain at sea
  const foe = S.boss && S.boss.ph !== 'die' ? S.boss : S.cap && !S.cap.dead ? S.cap : null;
  hudSet('bossBar', 'hide', !foe);
  if (foe) {
    hudSet('bossBar', 'capc', !!foe.cap);
    hudSet('bossName', 'text', foe.cap ? CAPTAINS[foe.cap].name : foe.D.name);
    hudSet('bossFill', 'w', (Math.max(0, foe.hp) / foe.maxHp * 100).toFixed(1) + '%');
  }
  if (kitDirty) { kitDirty = false; $('kitW').innerHTML = kitHtml(S.weapons, WEAPONS); $('kitP').innerHTML = kitHtml(S.passives, PASSIVES); }
}
// a weapon shows its evolution once it has one
const wDef = k => S && S.evo[k] ? EVOS[WEAPONS[k].evo] : WEAPONS[k];
const kitHtml = (have, defs) => Object.keys(have).map(k => defs === WEAPONS && S.evo[k] ? `<span class="evo">${ico(wDef(k).ico, 22)}</span>` : `<span>${ico(defs[k].ico, 22)}<i>${have[k]}</i></span>`).join('');
// a line of big text across the sea for a moment
let bannerTimer = 0;
function banner(txt, sub, boss) {
  const el = $('banner');
  el.innerHTML = txt + (sub ? `<small>${sub}</small>` : '');
  el.classList.toggle('boss', !!boss); el.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => el.classList.remove('show'), boss ? 2800 : 2200);
}
