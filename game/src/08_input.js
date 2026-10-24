
// =====================================================================
// INPUT: a floating joystick (touch anywhere and drag; it appears under the thumb) and the keyboard
// (WASD or the arrows to move, space for the moon's power, Esc to pause)
// =====================================================================
const JOY = { id: null, on: false, bx: 0, by: 0, kx: 0, ky: 0, R: 54 };
const KEYS = {};
let JOYG = null;
function initInput() {
  JOYG = new PIXI.Graphics(); ui.addChild(JOYG);
  cv.addEventListener('pointerdown', e => {
    audioInit();
    if (mode !== 'play' || JOY.id !== null) return;
    JOY.id = e.pointerId; JOY.on = true;
    JOY.bx = clamp(e.clientX, JOY.R + 12, W - JOY.R - 12); JOY.by = clamp(e.clientY, JOY.R + 12, H - JOY.R - 12);
    JOY.kx = e.clientX; JOY.ky = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== JOY.id) return;
    JOY.kx = e.clientX; JOY.ky = e.clientY;
    // past the rim the base follows the thumb, so turning around is instant
    const dx = JOY.kx - JOY.bx, dy = JOY.ky - JOY.by, d = Math.hypot(dx, dy);
    if (d > JOY.R) { JOY.bx += dx / d * (d - JOY.R); JOY.by += dy / d * (d - JOY.R); }
  });
  const up = e => { if (e.pointerId === JOY.id) { JOY.id = null; JOY.on = false; } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  addEventListener('keydown', e => {
    KEYS[e.code] = true;
    if (e.code === 'Space' && mode === 'play') { e.preventDefault(); useActive(); }
    if ((e.code === 'Escape' || e.code === 'KeyP') && (mode === 'play' || mode === 'pause')) togglePause();
    if (mode === 'levelup' && /^Digit[1-4]$/.test(e.code)) { const b = $('cards').children[+e.code.slice(5) - 1]; if (b) b.click(); }
  });
  addEventListener('keyup', e => { KEYS[e.code] = false; });
  addEventListener('blur', () => { for (const k in KEYS) KEYS[k] = false; JOY.id = null; JOY.on = false; });
}
// where the player wants to go: x, y in -1..1 (the joystick is analog, the keys are not)
function moveInput() {
  if (JOY.on) {
    const dx = (JOY.kx - JOY.bx) / JOY.R, dy = (JOY.ky - JOY.by) / JOY.R, d = Math.hypot(dx, dy);
    if (d < 0.12) return { x: 0, y: 0 };
    const k = Math.min(1, (d - 0.12) / 0.7) / d;
    return { x: dx * k, y: dy * k };
  }
  const x = (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0) - (KEYS.KeyA || KEYS.ArrowLeft ? 1 : 0);
  const y = (KEYS.KeyS || KEYS.ArrowDown ? 1 : 0) - (KEYS.KeyW || KEYS.ArrowUp ? 1 : 0);
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
}
function drawJoy() {
  JOYG.clear();
  if (!JOY.on || mode !== 'play') return;
  const dx = JOY.kx - JOY.bx, dy = JOY.ky - JOY.by, d = Math.hypot(dx, dy), k = d > JOY.R ? JOY.R / d : 1;
  JOYG.circle(JOY.bx, JOY.by, JOY.R).fill({ color: 0x050a18, alpha: 0.22 }).stroke({ width: 3, color: 0xe6f6ff, alpha: 0.32 });
  JOYG.circle(JOY.bx + dx * k, JOY.by + dy * k, 22).fill({ color: 0xf4ecd0, alpha: 0.5 });
}
