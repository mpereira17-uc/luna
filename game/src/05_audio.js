// =====================================================================
// AUDIO (the original Luna's synthesized band and sounds, starts after the first tap)
// =====================================================================
const AU = { ctx: null, sfx: null, mus: null, musF: null, padF: null, noise: null, last: {}, lay: {}, lv: {} };
const LAYERS = ['pad', 'bass', 'drums', 'lead', 'tense'];
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    AU.ctx = C;
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(C.destination);
    const master = C.createGain(); master.gain.value = 0.9; master.connect(comp);
    AU.sfx = C.createGain(); AU.sfx.gain.value = save.sfx ? 0.6 : 0; AU.sfx.connect(master);
    AU.mus = C.createGain(); AU.mus.gain.value = save.music ? 0.3 : 0; AU.mus.connect(master);
    AU.noise = C.createBuffer(1, C.sampleRate, C.sampleRate);
    const d = AU.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // the band plays in layers through one filter: it opens with the fight and closes while the game waits
    AU.musF = C.createBiquadFilter(); AU.musF.type = 'lowpass'; AU.musF.frequency.value = 5000; AU.musF.Q.value = 0.4; AU.musF.connect(AU.mus);
    for (const k of LAYERS) { const g = C.createGain(); g.gain.value = 0; g.connect(AU.musF); AU.lay[k] = g; AU.lv[k] = 0; }
    AU.padF = C.createBiquadFilter(); AU.padF.type = 'lowpass'; AU.padF.frequency.value = 1500; AU.padF.connect(AU.lay.pad);
    // a short echo so the band does not sound dry
    const dl = C.createDelay(0.6), fb = C.createGain(), wet = C.createGain();
    dl.delayTime.value = 0.24; fb.gain.value = 0.26; wet.gain.value = 0.2;
    AU.musF.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(AU.mus);
  } catch (e) { AU.ctx = null; }
  if (AU.ctx && MUS.want) musicStart(MUS.want);
}
function gate(name, gap) { const now = performance.now(); if (now - (AU.last[name] || 0) < gap) return false; AU.last[name] = now; return true; }
function osc(freq, dur, type, vol, slideTo, dest, when) {
  const C = AU.ctx, t = when || C.currentTime, o = C.createOscillator(), g = C.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AU.sfx); o.start(t); o.stop(t + dur + 0.05);
}
// a note with its own attack and a little detune (pads, music box, stingers)
function tone(freq, t, dur, type, vol, dest, att = 0.01, det = 0) {
  const C = AU.ctx, o = C.createOscillator(), g = C.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (det) o.detune.setValueAtTime(det, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, type, f0, f1, dest, when, q) {
  const C = AU.ctx, t = when || C.currentTime, s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain();
  s.buffer = AU.noise; f.type = type; f.frequency.setValueAtTime(f0, t); if (q) f.Q.value = q;
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || AU.sfx); s.start(t); s.stop(t + dur + 0.05);
}
// sounds sit left or right with what made them (x in world units, heard from the moon)
function sfxOut(x) {
  if (x == null || !AU.ctx.createStereoPanner || !S) return AU.sfx;
  const p = AU.ctx.createStereoPanner(); p.pan.value = clamp((x - S.x) / (viewW() / 2), -1, 1) * 0.7; p.connect(AU.sfx);
  setTimeout(() => { try { p.disconnect(); } catch (e) {} }, 2500);
  return p;
}
function sfx(name, arg, x) {
  if (!AU.ctx || !save.sfx) return;
  const C = AU.ctx, now = C.currentTime, at = dt => now + dt;
  let D = null;
  const out = () => D || (D = sfxOut(x));
  switch (name) {
    // weapons
    case 'zap': if (gate(name, 70)) osc(1200, 0.07, 'square', 0.035, 500, out()); break;
    case 'ray': if (gate(name, 75)) { osc(1500, 0.09, 'triangle', 0.045, 640, out()); osc(3000, 0.04, 'sine', 0.012, null, out()); } break;
    case 'star': if (gate(name, 90)) { osc(1760, 0.08, 'triangle', 0.08, null, out()); osc(2637, 0.14, 'sine', 0.06, null, out(), at(0.035)); osc(880, 0.06, 'sine', 0.04, null, out()); } break;
    case 'cannon': if (gate(name, 80)) { noise(0.24, 0.32, 'lowpass', 1000, 140, out()); osc(110, 0.24, 'sine', 0.32, 42, out()); noise(0.03, 0.14, 'highpass', 3200, null, out()); } break;
    case 'anchor': if (gate(name, 150)) { osc(330, 0.12, 'square', 0.045, 240, out()); osc(1180, 0.32, 'triangle', 0.035, 1120, out()); noise(0.18, 0.25, 'lowpass', 600, 120, out()); } break;
    case 'whirl': if (gate(name, 320)) { noise(0.45, 0.5, 'bandpass', 380, 1700, out(), null, 1.1); osc(180, 0.4, 'sine', 0.05, 420, out()); } break;
    case 'coral': if (gate(name, 120)) { noise(0.08, 0.22, 'bandpass', 2400, 900, out(), null, 4); osc(300, 0.06, 'square', 0.03, 120, out()); } break;
    case 'pop': if (gate(name, 35)) osc(420 + Math.min(arg || 0, 120) * 7, 0.07, 'triangle', 0.09, 180, out()); break;
    case 'boom': if (gate(name, 60)) { noise(0.35, 0.5, 'lowpass', 1400, 120, out()); osc(120, 0.3, 'sine', 0.3, 40, out()); } break;
    case 'bigboom': noise(1.0, 0.9, 'lowpass', 2000, 60, out()); osc(90, 0.9, 'sine', 0.5, 25, out()); noise(0.08, 0.3, 'highpass', 2500, null, out()); break;
    case 'splash': if (gate(name, 90)) noise(0.3, 0.25, 'bandpass', 1500, 400, out(), null, 0.8); break;
    case 'crash': if (gate(name, 120)) { noise(0.18, 0.25, 'bandpass', 900, 300, out(), null, 2); osc(160, 0.12, 'square', 0.04, 70, out()); } break;
    case 'thunder': if (gate(name, 120)) { noise(0.06, 0.5, 'highpass', 3000, null, out()); noise(0.7, 0.35, 'lowpass', 600, 80, out()); } break;
    case 'bite': if (gate(name, 100)) noise(0.08, 0.3, 'bandpass', 700, 300, out(), null, 3); break;
    case 'crit': if (gate(name, 70)) { osc(2100, 0.05, 'square', 0.025, null, out()); osc(3150, 0.09, 'sine', 0.025, null, out(), at(0.02)); } break;
    case 'laser': if (gate(name, 400)) osc(300, 0.35, 'sawtooth', 0.02, 600, out()); break;
    // what sinks, falls or drowns
    case 'sink': if (gate(name, 110)) { osc(150, 0.35, 'sawtooth', 0.04, 70, out()); noise(0.5, 0.18, 'lowpass', 800, 180, out()); [0.16, 0.26, 0.38].forEach((d, i) => osc(520 + i * 160, 0.05, 'sine', 0.05, 900 + i * 120, out(), at(d))); } break;
    case 'squawk': if (gate(name, 160)) { osc(1350, 0.1, 'sawtooth', 0.025, 900, out()); osc(1150, 0.12, 'sawtooth', 0.022, 760, out(), at(0.09)); } break;
    case 'drown': if (gate(name, 120)) { osc(300, 0.08, 'sine', 0.07, 620, out()); osc(380, 0.08, 'sine', 0.06, 760, out(), at(0.09)); } break;
    // the island and the moon
    case 'hurt': if (gate(name, 280)) { noise(0.16, 0.28, 'bandpass', 520, 220, out(), null, 1.4); osc(95, 0.22, 'sine', 0.3, 48, out()); osc(220, 0.2, 'sawtooth', 0.045, 80, out()); } break;
    case 'heal': if (gate(name, 400)) [784, 988, 1319].forEach((f, i) => osc(f, 0.3, 'sine', 0.05, null, out(), at(i * 0.06))); break;
    case 'shield': if (gate(name, 200)) { osc(620, 0.6, 'triangle', 0.05, null, out()); osc(1390, 0.5, 'sine', 0.03, null, out()); } break;
    case 'level': [523, 659, 784, 1047].forEach((f, i) => osc(f, 0.25, 'triangle', 0.13, null, null, at(i * 0.06))); break;
    case 'card': osc(880, 0.08, 'square', 0.05, 1320); break;
    case 'evo': [784, 988, 1175, 1568, 1976].forEach((f, i) => osc(f, 0.4, 'sine', 0.12, null, null, at(i * 0.07))); break;
    case 'union': [523, 659, 784, 988, 1175, 1568].forEach((f, i) => { osc(f, 0.7, 'triangle', 0.08, null, null, at(i * 0.05)); osc(f * 2, 0.5, 'sine', 0.03, null, null, at(0.3 + i * 0.05)); }); noise(0.8, 0.12, 'highpass', 6000, 2000); break;
    case 'tsunami': noise(1.4, 0.8, 'lowpass', 200, 3000); osc(55, 1.2, 'sine', 0.5, 30); break;
    case 'tide': noise(0.8, 0.32, 'bandpass', 280, 1300, null, null, 0.9); osc(70, 0.6, 'sine', 0.18, 115); break;
    case 'roar': osc(70, 1.4, 'sawtooth', 0.25, 45); noise(1.2, 0.3, 'lowpass', 500, 100); break;
    case 'warn': if (gate(name, 300)) { osc(740, 0.1, 'square', 0.05, 560); osc(740, 0.12, 'square', 0.05, 560, null, at(0.15)); } break;
    case 'freeze': osc(2400, 0.5, 'sine', 0.08, 600); noise(0.5, 0.15, 'highpass', 5000); break;
    case 'combo': [660, 880, 1320].forEach((f, i) => osc(f, 0.18, 'square', 0.05, null, null, at(i * 0.05))); break;
    case 'coin': if (gate(name, 60)) { osc(1568, 0.08, 'square', 0.04); osc(2093, 0.12, 'square', 0.04, null, null, at(0.06)); } break;
    // each moon's ability has its own voice
    case 'act_llena': noise(1.4, 0.8, 'lowpass', 200, 3000); osc(55, 1.2, 'sine', 0.5, 30); [659, 784, 988].forEach((f, i) => osc(f, 0.5, 'triangle', 0.05, null, null, at(0.1 + i * 0.08))); break;
    case 'act_roja': noise(0.9, 0.55, 'lowpass', 300, 2600); osc(90, 0.7, 'sawtooth', 0.16, 170); for (let i = 0; i < 6; i++) noise(0.04, 0.18, 'highpass', 3000, null, null, at(0.15 + i * 0.09)); break;
    case 'act_hielo': [2093, 2637, 3136, 4186, 3136, 4186].forEach((f, i) => osc(f, 0.35, 'sine', 0.05, null, null, at(i * 0.05))); noise(0.7, 0.15, 'highpass', 5000); break;
    case 'act_nueva': osc(58, 1.5, 'sine', 0.42, 40); noise(1.1, 0.3, 'lowpass', 3000, 180); osc(466, 1.2, 'triangle', 0.04, 415); break;
    case 'act_tormenta': noise(1.6, 0.14, 'highpass', 6000, 3000); noise(0.06, 0.5, 'highpass', 3000); noise(0.8, 0.4, 'lowpass', 600, 70); break;
    case 'act_dorada': for (let i = 0; i < 9; i++) osc(1568 + i * 110, 0.1, 'square', 0.035, null, null, at(i * 0.05)); osc(2637, 0.4, 'sine', 0.04, null, null, at(0.48)); break;
    // big moments
    case 'intro': noise(1.6, 0.5, 'lowpass', 900, 60); [38, 45, 50].forEach(m => { tone(mtof(m), now, 1.5, 'sawtooth', 0.06, AU.sfx, 0.08); tone(mtof(m), now, 1.5, 'sawtooth', 0.04, AU.sfx, 0.08, 9); }); osc(55, 1.3, 'sine', 0.45, 32); break;
    // the Holandés Errante's bell: a low toll with partials that don't quite agree, and a long tail
    case 'bell': [[0.5, 0.16, 4.5], [1, 0.12, 3.6], [1.19, 0.07, 2.8], [1.56, 0.05, 2.2], [2, 0.05, 2], [2.66, 0.03, 1.4], [3.01, 0.02, 1.1]].forEach(([r, v, d]) => tone(196 * r, now, d, 'sine', v, AU.sfx, 0.005)); noise(0.12, 0.12, 'bandpass', 1800, 900, null, null, 3); break;
    case 'heroic': [523, 659, 784, 1047, 1319].forEach((f, i) => osc(f, 0.6, 'triangle', 0.07, null, null, at(i * 0.06))); noise(0.7, 0.1, 'highpass', 7000, 3000); break;
  }
}

// ---- MUSIC: a small band in layers. Pad and bass always play; the drums come in with the threat, the lead with the
// fight, a heartbeat of tension when the island is in danger. Bosses bring their own song, the title its own lullaby.
const MUS = { on: false, step: 0, next: 0, timer: null, intensity: 0, boss: false, song: 'sea', want: null };
const PROG = [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]];
const SONGS = {
  title: { bpm: 84, prog: [[48, [0, 4, 7]], [43, [0, 4, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]]], box: [12, 16, 19, 24, 19, 16, 14, 12] },
  sea: { bpm: 108, prog: PROG },
  kraken: { bpm: 126, prog: [[50, [0, 3, 7]], [46, [0, 4, 7]], [43, [0, 3, 7]], [45, [0, 4, 7]]], motif: [0, null, 3, 5, 7, null, 5, 3, 1, null, 0, null, -2, null, 0, null] },
  armada: { bpm: 134, prog: [[52, [0, 3, 7]], [48, [0, 4, 7]], [50, [0, 4, 7]], [47, [0, 4, 7]]], motif: [0, 0, 7, null, 5, 3, 2, null, 0, 0, 7, null, 10, 8, 7, null], march: true },
  leviatan: { bpm: 116, prog: [[48, [0, 3, 7]], [44, [0, 4, 7]], [41, [0, 3, 7]], [43, [0, 4, 7]]], motif: [0, null, null, 3, 2, null, null, -1, 0, null, null, 3, 7, null, 6, null] },
  eclipse: { bpm: 122, prog: [[46, [0, 3, 7]], [42, [0, 4, 7]], [49, [0, 4, 7]], [41, [0, 4, 7]]], motif: [12, null, 11, null, 7, null, 6, null, 3, null, 6, 7, null, null, null, null] },
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function musicStart(song) {
  MUS.want = song || (S ? 'sea' : 'title');
  if (!AU.ctx) return;
  if (!MUS.on || MUS.song !== MUS.want) { MUS.song = MUS.want; MUS.step = 0; MUS.next = AU.ctx.currentTime + 0.12; }
  MUS.on = true; if (!MUS.timer) MUS.timer = setInterval(musicTick, 25);
}
function musicStop() { MUS.on = false; MUS.want = null; if (AU.ctx) for (const k of LAYERS) { AU.lay[k].gain.setTargetAtTime(0, AU.ctx.currentTime, 0.15); AU.lv[k] = 0; } }
// which song and how much of each layer, from what is happening right now
function musicMix() {
  const L = { pad: 0, bass: 0, drums: 0, lead: 0, tense: 0 };
  let cut = 5200, song = MUS.song;
  if (!S) { song = 'title'; L.pad = 0.9; L.bass = 0.3; L.lead = 0.8; cut = 3000; }
  else {
    const int = MUS.intensity, near = S.near, th = clamp(near / 14, 0, 1);
    if (MUS.boss) { song = typeof MUS.boss === 'string' ? MUS.boss : 'kraken'; L.pad = 0.6; L.bass = 1; L.drums = 1; L.lead = 1; cut = 8000; }
    else { song = 'sea'; L.pad = 1; L.bass = 0.55 + 0.15 * int; L.drums = int >= 1 ? 0.55 + 0.45 * th : th > 0.4 ? th * 0.8 : 0; L.lead = int >= 2 ? 0.6 + 0.4 * th : th > 0.7 ? 0.5 : 0; cut = 2600 + 5000 * Math.min(1, int / 3 + th * 0.4); }
    L.tense = S.hp < S.maxHp * 0.3 && !S.ended ? 1 : 0;
    if (mode !== 'play') cut = 650;
  }
  return { L, cut, song };
}
function musicTick() {
  if (!MUS.on || !AU.ctx || !save.music) return;
  const C = AU.ctx, mx = musicMix();
  for (const k of LAYERS) if (Math.abs(mx.L[k] - AU.lv[k]) > 0.02) { AU.lv[k] = mx.L[k]; AU.lay[k].gain.setTargetAtTime(mx.L[k], C.currentTime, 0.5); }
  if (Math.abs(AU.musF.frequency.value - mx.cut) > 50) AU.musF.frequency.setTargetAtTime(mx.cut, C.currentTime, 0.3);
  const Sg = SONGS[MUS.song] || SONGS.sea, spb = 60 / (Sg.bpm + (MUS.song === 'sea' ? MUS.intensity * 4 : 0)) / 4;
  if (MUS.next < C.currentTime - 0.2) MUS.next = C.currentTime + 0.05;
  while (MUS.next < C.currentTime + 0.12) {
    // a new song waits for the start of a bar
    if (mx.song !== MUS.song && MUS.step % 16 === 0) { MUS.song = mx.song; MUS.step = 0; }
    playStep(SONGS[MUS.song] || SONGS.sea, MUS.step, MUS.next, spb);
    MUS.next += spb; MUS.step = (MUS.step + 1) % 64;
  }
}
function playStep(Sg, s, t, spb) {
  const bar = Math.floor(s / 16) % 4, st = s % 16, [root, tri] = Sg.prog[bar], on = k => AU.lv[k] > 0.02, Y = AU.lay;
  if (on('pad') && st === 0) for (const n of tri) { const f = mtof(root + 12 + n); tone(f, t, spb * 16, 'sawtooth', 0.022, AU.padF, 0.35, -8); tone(f, t, spb * 16, 'sawtooth', 0.022, AU.padF, 0.35, 8); }
  if (on('bass')) {
    if (Sg.box) { if (st % 8 === 0) tone(mtof(root - 12), t, spb * 7, 'sine', 0.16, Y.bass, 0.02); }
    else if (st % 2 === 0) osc(mtof(root - 12 + (st % 8 === 6 ? 12 : 0)), spb * 1.7, 'sawtooth', 0.1, null, Y.bass, t);
  }
  if (on('drums')) {
    if (st % 4 === 0) osc(150, 0.18, 'sine', 0.7, 40, Y.drums, t);
    if (st % 8 === 4 || (Sg.march && bar === 3 && st >= 12)) { noise(0.12, 0.16, 'bandpass', 1800, 900, Y.drums, t, 0.8); osc(190, 0.08, 'triangle', 0.06, 120, Y.drums, t); }
    if (st % 2 === 1) noise(0.03, 0.07, 'highpass', 8000, null, Y.drums, t);
  }
  if (on('lead')) {
    if (Sg.box) { if (st % 2 === 0) { const n = Sg.box[(st / 2 + bar * 2) % 8]; tone(mtof(root + 12 + n), t, spb * 6, 'triangle', 0.045, Y.lead, 0.005); } }
    else if (Sg.motif && bar % 2 === 0) { const n = Sg.motif[st]; if (n != null) { tone(mtof(Sg.prog[0][0] + 24 + n), t, spb * 1.8, 'square', 0.03, Y.lead, 0.01); tone(mtof(Sg.prog[0][0] + 12 + n), t, spb * 1.8, 'triangle', 0.035, Y.lead, 0.01); } }
    else osc(mtof(root + 12 + tri[st % 3] + (st >= 8 ? 12 : 0)), spb * 0.9, 'triangle', 0.05, null, Y.lead, t);
  }
  if (on('tense')) {
    // a heartbeat, and a thin trembling note a half step above the key
    if (st === 0 || st === 3 || st === 8 || st === 11) osc(st % 8 === 0 ? 62 : 55, 0.16, 'sine', st % 8 === 0 ? 0.55 : 0.4, 38, Y.tense, t);
    if (st % 2 === 0) tone(mtof(root + 37), t, spb * 1.5, 'sawtooth', 0.008, Y.tense, 0.02);
  }
}
// short phrases for the end of a run
function musicSting(kind) {
  if (!AU.ctx || !kind) return;
  const D = save.music ? AU.mus : save.sfx ? AU.sfx : null; if (!D) return;
  const t = AU.ctx.currentTime + 0.05;
  if (kind === 'win') {
    [[60, 0], [64, 0.12], [67, 0.24], [72, 0.36]].forEach(([m, d]) => tone(mtof(m), t + d, 0.3, 'triangle', 0.22, D));
    [72, 76, 79, 84].forEach(m => { tone(mtof(m), t + 0.5, 1.6, 'triangle', 0.12, D, 0.01); tone(mtof(m - 12), t + 0.5, 1.6, 'sawtooth', 0.04, D, 0.05); });
  } else if (kind === 'lose') {
    [[69, 0], [65, 0.3], [62, 0.6], [57, 0.9]].forEach(([m, d], i) => tone(mtof(m), t + d, i === 3 ? 1.6 : 0.35, 'triangle', 0.18, D, 0.02));
    tone(mtof(45), t + 0.9, 1.8, 'sawtooth', 0.05, D, 0.1);
  }
}
function setAudioGains() {
  if (!AU.ctx) return;
  AU.sfx.gain.value = save.sfx ? 0.6 : 0;
  AU.mus.gain.value = save.music ? (mode === 'play' ? 0.3 : 0.16) : 0;
}
// vibration, when the player wants it: short and different for each kind of moment, never continuous
const VIB = { tap: 12, hit: 25, heavy: [50, 30, 90], boss: [90, 60, 180], win: [40, 40, 40, 40, 160], heroic: [30, 30, 60] };
function vib(p) { if (save.vib !== false && navigator.vibrate) { try { navigator.vibrate(typeof p === 'string' ? VIB[p] : p); } catch (e) {} } }
