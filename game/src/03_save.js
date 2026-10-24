
// =====================================================================
// SAVE (its own key: this game never touches the original Luna's progress)
// =====================================================================
const SAVE_KEY = 'luna-mar-v1';
const save = (() => {
  const def = { coins: 0, best: 0, wins: 0, runs: 0, kills: 0, music: true, sfx: true, vib: true, fx: 'alto', fxManual: false, moon: 'llena', caps: 0, moons: ['llena'], shop: {}, rec: {} };
  let raw = null; try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
  // the Android app keeps its own copy of the save: the newer of the two wins
  let app = null; try { app = window.LunaHost ? JSON.parse(window.LunaHost.saveRead() || 'null') : null; } catch (e) {}
  if (app && (!raw || (app.savedAt || 0) > (raw.savedAt || 0))) raw = app;
  return Object.assign(def, raw || {});
})();
const persist = () => {
  save.savedAt = Date.now();
  let str = ''; try { str = JSON.stringify(save); localStorage.setItem(SAVE_KEY, str); } catch (e) {}
  try { if (str && window.LunaHost) window.LunaHost.saveWrite(str); } catch (e) {}
};
