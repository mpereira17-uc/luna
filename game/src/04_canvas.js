
// =====================================================================
// RENDERER: PixiJS 8 on WebGL, bundled next to the page (the app has no internet)
// the sea, the ships and the effects are a scene; the HUD and the menus stay in the DOM
// =====================================================================
const cv = $('game');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let W = 0, H = 0, DPR = 1, Z = 1;
let rdr = null;                 // the renderer, once boot() has it ready
// graphics quality: 'alto' = every filter (rippling water, bloom, moonbeams), 'bajo' = the same art without filters
let FXQ = 'alto';
// Z = screen pixels per world unit: a phone shows about 430 units across, a tablet or a computer a bit more
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, FXQ === 'alto' ? 2 : 1.5);
  Z = clamp(Math.min(W / 430, H / 780), 0.7, 2.4);
  if (rdr) rdr.resize(W, H, DPR);
}
window.addEventListener('resize', resize); resize();
// how much of the world fits on the screen
const viewW = () => W / Z, viewH = () => H / Z;

// ---- the scene: world layers in world units (moved by the camera), then the screen layer
const stage = new PIXI.Container();
const world = new PIXI.Container();
const ui = new PIXI.Container();
// sea: water, kelp, crests | marks: foam, telegraphs, waves of the tsunami | wake: foam behind ships, splashes
// pick: pearls, coins | body: props, ships, the moon and the boss, sorted by depth | fx: light (added, with bloom) | num: damage numbers
const L = {};
// flat: ice floes and treasure marks lying on the water | fog: banks of mist drifting over the ships
for (const k of ['sea', 'flat', 'marks', 'wake', 'pick', 'body', 'fog', 'fx', 'num']) { L[k] = new PIXI.Container(); world.addChild(L[k]); }
L.body.sortableChildren = true;
stage.addChild(world, ui);

// the camera glides after the moon and looks a little ahead of where it is going
const cam = { x: 0, y: 0, shake: 0 };
function placeCamera() {
  const sh = cam.shake > 0 && !reduceMotion ? cam.shake * 10 : 0;
  world.scale.set(Z);
  world.position.set(W / 2 - cam.x * Z + (Math.random() - 0.5) * sh, H / 2 - cam.y * Z + (Math.random() - 0.5) * sh);
}
const toScreen = (x, y) => ({ x: (x - cam.x) * Z + W / 2, y: (y - cam.y) * Z + H / 2 });
const onScreen = (x, y, pad = 60) => Math.abs(x - cam.x) < viewW() / 2 + pad && Math.abs(y - cam.y) < viewH() / 2 + pad;

// ---- art painted once on a canvas of its own (water tiles, islets, glows), k = pixels per unit
function offscreen(w, h, k, draw) {
  const c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const g = c.getContext('2d'); g.scale(k, k); draw(g); return c;
}
const texOf = (c, ax = 0.5, ay = 0.5) => new PIXI.Texture({ source: new PIXI.CanvasSource({ resource: c, autoGenerateMipmaps: true }), defaultAnchor: { x: ax, y: ay } });

// ---- sprites: the original Luna's atlases and this game's own (WebP sheets + frame tables in atlas.js and mar.js), in design units
const FR = {};
let artReady = false;
function loadArt() {
  const A = window.LUNA_ATLAS; if (!A) return Promise.resolve();
  const jobs = [];
  for (const k in A) {
    if (k === 'comic') continue;
    const img = new Image(); img.src = `${k}.webp`; A[k].img = img;
    jobs.push(img.decode().then(() => {
      const source = new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' }), r = A[k].R;
      for (const n in A[k].frames) {
        const f = A[k].frames[n];
        FR[n] = { k, img, x: f[0], y: f[1], w: f[2], h: f[3], ax: f[4] / r, ay: f[5] / r, pw: f[2] / r, ph: f[3] / r, R: r,
          tex: new PIXI.Texture({ source, frame: new PIXI.Rectangle(f[0], f[1], f[2], f[3]), defaultAnchor: { x: f[4] / f[2], y: f[5] / f[3] } }) };
      }
    }).catch(() => {}));
  }
  return Promise.all(jobs).then(() => { artReady = true; });
}
// a sprite of frame n at s world units per design unit (the scale numbers the original game used)
function spr(n, s = 1, layer) {
  const f = FR[n], sp = new PIXI.Sprite(f ? f.tex : PIXI.Texture.EMPTY);
  if (f) sp.scale.set(s / f.R);
  if (layer) layer.addChild(sp);
  return sp;
}
// change what a sprite shows (animation frames, a face), keeping it facing the right way
function setFrame(sp, n, s, flip) {
  const f = FR[n]; if (!f) return;
  if (sp.texture !== f.tex) { sp.texture = f.tex; sp.anchor.set(f.tex.defaultAnchor.x, f.tex.defaultAnchor.y); }
  const k = s / f.R; sp.scale.set(flip ? -k : k, k);
}
// the same frames onto a 2D canvas (the islets painted once, the moon portraits and the chest on the DOM screens)
function sprOn(g, n, x, y, s, flip) {
  const f = FR[n]; if (!f) return false;
  if (!flip) { g.drawImage(f.img, f.x, f.y, f.w, f.h, x - f.ax * s, y - f.ay * s, f.pw * s, f.ph * s); return true; }
  g.save(); g.translate(x, y); g.scale(-1, 1); g.drawImage(f.img, f.x, f.y, f.w, f.h, -f.ax * s, -f.ay * s, f.pw * s, f.ph * s); g.restore(); return true;
}
// a moon with a face on a small canvas: k = size pulse, dy = hop
function moonPortrait(c, face, k = 1, dy = 0) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const halo = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.5);
  const [r, gg, b] = [1, 3, 5].map(i => parseInt(MOON.color.slice(i, i + 2), 16));
  halo.addColorStop(0, `rgba(${r},${gg},${b},0.4)`); halo.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = halo; g.fillRect(0, 0, w, h);
  const s = w * 0.34 / 31 * k;
  if (!sprOn(g, `moon_${MOON.id}`, w / 2, h / 2 + dy, s)) { g.fillStyle = MOON.color; g.beginPath(); g.arc(w / 2, h / 2 + dy, w * 0.34, 0, TAU); g.fill(); }
  sprOn(g, `face_${face}`, w / 2, h / 2 + dy, s);
}
// an icon (from whichever atlas has it: the original's icons or this game's own) as an inline element for the DOM
function ico(n, size = 28) {
  const f = FR[n], A = f && window.LUNA_ATLAS?.[f.k];
  if (!f || !A) return `<span class="sp" style="width:${size}px;height:${size}px"></span>`;
  const k = size / f.w;
  return `<span class="sp" style="width:${size}px;height:${size}px;background-image:url(${f.k}.webp);background-size:${A.w * k}px ${A.h * k}px;background-position:-${f.x * k}px -${f.y * k}px"></span>`;
}
