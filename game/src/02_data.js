
// =====================================================================
// DATA (world units: the screen shows about 430 of them across a phone)
// =====================================================================
const MOON_R = 26;            // the moon's body; about 12% of what a phone shows across
// a night at sea: the Kraken at minute 5, the Holandés Errante at minute 10, and dawn at minute 15 wins the run
const BOSS_TIMES = [[300, 'kraken'], [600, 'holandes']];
const RUN_END = 900;

// enemies: hp at minute 0, speed in units per second, dps while touching the moon, xp = pearl value
// spr = frames to alternate, s = sprite scale, r = body radius, fly = passes over reefs and islands, heavy = barely pushed
// ai: chase (default) | ranged (keeps away and fires) | bomb (explodes against the moon) | ghost (fades, goes through islands)
//     drift (floats with the current towards the moon) | weave (snakes in) | dash (lunges) | flee (runs from the moon)
// tint = colour cast, noIce = cold doesn't slow or freeze it, from = second of the night it starts to appear
const EN = {
  sloop:    { name: 'Balandra', hp: 10, spd: 58, dps: 6, xp: 1, r: 19, spr: ['sloop0', 'sloop1'], s: 0.62, wake: 1, from: 0 },
  gull:     { name: 'Gaviota pirata', hp: 6, spd: 92, dps: 5, xp: 1, r: 13, spr: ['gull0', 'gull1', 'gull2'], s: 0.72, fly: true, from: 30 },
  galleon:  { name: 'Galeón', hp: 95, spd: 30, dps: 14, xp: 5, r: 34, spr: ['galleon0', 'galleon1'], s: 0.74, wake: 1.6, heavy: true, from: 110 },
  gunboat:  { name: 'Cañonera pirata', hp: 40, spd: 44, dps: 6, xp: 3, r: 22, spr: ['mortar0', 'mortar1'], s: 0.62, wake: 1.2, ai: 'ranged', from: 70 },
  brulote:  { name: 'Brulote', hp: 26, spd: 82, dps: 0, xp: 2, r: 20, spr: ['brulote0', 'brulote1'], s: 0.6, wake: 1.1, ai: 'bomb', from: 90 },
  crab:     { name: 'Cangrejo gigante', hp: 34, spd: 40, dps: 8, xp: 2, r: 15, spr: ['crab0', 'crab1'], s: 0.72, from: 40 },
  jelly:    { name: 'Medusa', hp: 12, spd: 34, dps: 4, xp: 1, r: 12, spr: ['jelly0', 'jelly1'], s: 0.62, ai: 'drift', from: 0, tint: 0xffd0f4 },
  octopus:  { name: 'Pulpo', hp: 30, spd: 46, dps: 8, xp: 2, r: 18, spr: ['octo0', 'octo1'], s: 0.78, ai: 'dash', from: 60 },
  ghost:    { name: 'Barco fantasma', hp: 55, spd: 50, dps: 10, xp: 4, r: 30, spr: ['ghost0', 'ghost1'], s: 0.66, ai: 'ghost', from: 80, noIce: true },
  serpent:  { name: 'Serpiente abisal', hp: 60, spd: 56, dps: 10, xp: 4, r: 15, spr: ['serpHead'], s: 0.8, ai: 'weave', segs: 7, from: 100, tint: 0xff9a8a },
  icesloop: { name: 'Balandra helada', hp: 16, spd: 54, dps: 7, xp: 1, r: 19, spr: ['sloop0', 'sloop1'], s: 0.62, wake: 1, tint: 0xbfe8ff, noIce: true, from: 0 },
  icejelly: { name: 'Medusa eléctrica', hp: 16, spd: 32, dps: 6, xp: 2, r: 12, spr: ['jellyT0', 'jellyT1'], s: 0.62, ai: 'drift', from: 30 },
  iceserp:  { name: 'Serpiente de hielo', hp: 70, spd: 52, dps: 10, xp: 4, r: 15, spr: ['serpHead'], s: 0.8, ai: 'weave', segs: 7, tint: 0xa8e4ff, noIce: true, from: 90 },
  redjelly: { name: 'Medusa de sangre', hp: 16, spd: 36, dps: 6, xp: 2, r: 12, spr: ['jelly0', 'jelly1'], s: 0.66, ai: 'drift', tint: 0xff6a6a, from: 0 },
  goldship: { name: 'Barco del tesoro', hp: 120, spd: 70, dps: 0, xp: 8, r: 22, spr: ['goldship0', 'goldship1'], s: 0.62, wake: 1.2, ai: 'flee', from: 9999 },
  decoy:    { name: 'Señuelo', hp: 20, spd: 40, dps: 6, xp: 0, r: 30, spr: ['galleon0', 'galleon1'], s: 0.7, wake: 1.4, from: 9999 },
};
// what each sea sends (weights); a type only comes once its night time (from) has passed
const ZONE_POOL = {
  mareas: { sloop: 3, gull: 2, galleon: 1, jelly: 1.6, octopus: 0.9, gunboat: 0.6 },
  archi:  { sloop: 2, gunboat: 2, brulote: 1.2, crab: 1.6, gull: 1, galleon: 0.9, octopus: 0.6, ghost: 0.4 },
  hielo:  { icesloop: 3, icejelly: 1.6, iceserp: 1.2, galleon: 0.9, gull: 0.5 },
  sangre: { ghost: 2, serpent: 1.6, redjelly: 1.4, brulote: 1.2, sloop: 1.4, galleon: 0.9 },
};
// how many come, second by second (spawns per second); quieter while a boss is up
const WAVES = [
  { t: 0, rate: 0.9 }, { t: 40, rate: 1.4 }, { t: 80, rate: 2.0 }, { t: 120, rate: 2.4 }, { t: 170, rate: 3.0 }, { t: 220, rate: 3.8 }, { t: 260, rate: 4.6 },
  { t: 300, rate: 1.2 }, { t: 360, rate: 3.6 }, { t: 420, rate: 4.2 }, { t: 480, rate: 4.8 }, { t: 540, rate: 5.4 },
  { t: 600, rate: 1.4 }, { t: 660, rate: 5.4 }, { t: 720, rate: 6.0 }, { t: 780, rate: 6.6 }, { t: 840, rate: 7.2 },
];
// special moments: flocks, elites with a chest, rings, the four legendary captains, a treasure ship, blooms of jellyfish
const EVENTS = [
  { t: 60, k: 'flock', n: 14, txt: '¡Una bandada!' },
  { t: 100, k: 'elite', type: 'galleon', txt: 'Un galeón de élite', sub: 'Lleva un cofre' },
  { t: 130, k: 'gold', txt: '¡Un barco del tesoro!', sub: 'Húndelo antes de que escape' },
  { t: 150, k: 'cap', id: 'perla' },
  { t: 200, k: 'ring', n: 22, txt: '¡Te rodean!', sub: 'Abre un hueco y escapa' },
  { t: 235, k: 'bloom', n: 18, txt: '¡Medusas!', sub: 'Un banco entero sube a la superficie' },
  { t: 270, k: 'ring', n: 30, txt: '¡Te rodean!', sub: 'Abre un hueco y escapa' },
  { t: 390, k: 'elite', type: 'gunboat', txt: 'Una cañonera de élite', sub: 'Lleva un cofre' },
  { t: 420, k: 'cap', id: 'ballenero' },
  { t: 470, k: 'flock', n: 26, txt: '¡Una bandada!' },
  { t: 500, k: 'gold', txt: '¡Un barco del tesoro!', sub: 'Húndelo antes de que escape' },
  { t: 520, k: 'cap', id: 'ceniza' },
  { t: 570, k: 'ring', n: 34, txt: '¡Te rodean!', sub: 'Abre un hueco y escapa' },
  { t: 690, k: 'bloom', n: 26, txt: '¡Medusas!', sub: 'Un banco entero sube a la superficie' },
  { t: 720, k: 'cap', id: 'sombra' },
  { t: 760, k: 'elite', type: 'galleon', txt: 'Un galeón de élite', sub: 'Lleva un cofre' },
  { t: 800, k: 'gold', txt: '¡Un barco del tesoro!', sub: 'Húndelo antes de que escape' },
  { t: 830, k: 'ring', n: 40, txt: '¡Te rodean!', sub: 'Aguanta hasta el amanecer' },
  { t: 870, k: 'flock', n: 30, txt: '¡La última bandada!' },
];
// the four legendary captains of the original Luna: a named galleon with a trick of its own; sink it before it escapes
const CAPTAINS = {
  perla:     { name: 'Capitana Perla', tint: 0xff9ad5, hp: 900, tip: 'Suelta barcos señuelo idénticos a su nave', ab: '¡Señuelos!' },
  ballenero: { name: 'El Ballenero', tint: 0x9fdcff, hp: 1600, tip: 'Arponea a la luna y la frena', ab: '¡Arpón!' },
  ceniza:    { name: 'Capitán Ceniza', tint: 0xff9a5a, hp: 2000, tip: 'Lanza andanadas de fuego y llama a su escolta', ab: '¡Andanada!' },
  sombra:    { name: 'La Sombra', tint: 0xb49cff, hp: 2600, tip: 'Se vuelve invisible a ratos', ab: '¡Velo de sombra!' },
};
const CAP_TIME = 80;          // seconds before a captain gives up and sails away

// the bosses of the night: calls = life left when it calls its fleet, rage = life left when it gets worse
const BOSSES = {
  kraken:   { name: 'El Kraken', hp: 6000, r: 70, dps: 26, calls: [0.66, 0.33], rage: 0.33, song: 'kraken', spark: 0xffd36b,
    intro: ['¡El Kraken!', 'Sale de las profundidades'], angry: '¡El Kraken se enfurece!', beat: '¡Has vencido al Kraken!' },
  holandes: { name: 'El Holandés Errante', hp: 12000, r: 110, dps: 30, calls: [0.75, 0.25], rage: 0.5, song: 'armada', spark: 0x9dffc8,
    intro: ['El Holandés Errante', 'Suena la campana del barco maldito'], angry: 'La maldición del Holandés', beat: '¡Has hundido al Holandés Errante!' },
};

// weapons fire on their own; 5 levels each. lv[i] = what level i+1 brings.
// evo: at level 5, with its partner upgrade, a chest turns the weapon into its evolution
const WEAPONS = {
  rayo: {
    name: 'Rayo lunar', ico: 'i_rayo', desc: 'La luna dispara rayos al enemigo más cercano.',
    lv: ['Un rayo cada 0,9 s', '+1 rayo', '+40% de daño', '+1 rayo y dispara más rápido', 'Los rayos atraviesan y +40% de daño'],
    count: [1, 2, 2, 3, 3], dmg: [12, 12, 16, 16, 22], cd: [0.9, 0.9, 0.85, 0.7, 0.7], pierce: [0, 0, 0, 0, 2], evo: 'lanza',
  },
  tiburon: {
    name: 'Tiburones', ico: 'i_tiburon', desc: 'Tiburones que nadan en círculo alrededor de la luna y muerden a quien se acerca.',
    lv: ['1 tiburón', '+1 tiburón', 'Muerden un 40% más y nadan más lejos', '+1 tiburón y nadan más rápido', '4 tiburones y +40% de daño'],
    count: [1, 2, 2, 3, 4], dmg: [8, 8, 11, 11, 15], orbit: [72, 72, 86, 86, 96], spin: [2.3, 2.3, 2.5, 3.0, 3.0], evo: 'megalodon',
  },
  ondas: {
    name: 'Ondas lunares', ico: 'i_ondas', desc: 'Un anillo de energía sale de la luna, golpea y aparta a los barcos.',
    lv: ['Una onda cada 3 s', 'Más grande y +40% de daño', 'Sale más a menudo', 'Más grande y +40% de daño', 'Dos ondas seguidas'],
    dmg: [10, 14, 14, 20, 24], R: [115, 135, 135, 160, 170], cd: [3, 3, 2.4, 2.4, 2.2], n: [1, 1, 1, 1, 2], evo: 'mareaviva',
  },
  escarcha: {
    name: 'Escarcha', ico: 'i_escarcha', desc: 'Esquirlas de hielo en abanico que frenan a quien tocan.',
    lv: ['3 esquirlas cada 1,6 s', '+1 esquirla', '+40% de daño', '+1 esquirla y más rápido', 'Congelan un instante y +40% de daño'],
    count: [3, 4, 4, 5, 6], dmg: [9, 9, 13, 13, 18], cd: [1.6, 1.6, 1.5, 1.25, 1.2], freeze: [0, 0, 0, 0, 0.8], evo: 'glaciar',
  },
  tormenta: {
    name: 'Tormenta', ico: 'i_tormenta', desc: 'Caen rayos sobre los barcos cercanos y saltan de uno a otro.',
    lv: ['Un rayo cada 2,2 s', '+1 rayo y salta a otro barco', 'Más a menudo y +30% de daño', '+1 rayo y salta a dos', 'Salta a tres y +30% de daño'],
    n: [1, 2, 2, 3, 3], chain: [0, 1, 1, 2, 3], dmg: [18, 18, 24, 24, 32], cd: [2.2, 2.0, 1.75, 1.6, 1.45], evo: 'poseidon',
  },
  meteoros: {
    name: 'Meteoritos', ico: 'i_meteoro', desc: 'Rocas de luna caen del cielo y estallan entre los barcos.',
    lv: ['Un meteorito cada 2,8 s', '+1 meteorito', 'Explosión más grande y +30% de daño', '+1 meteorito y más a menudo', '+1 meteorito y +40% de daño'],
    n: [1, 2, 2, 3, 4], dmg: [26, 26, 34, 34, 46], r: [50, 50, 60, 60, 66], cd: [2.8, 2.6, 2.6, 2.2, 2.0], evo: 'cometa',
  },
  remolino: {
    name: 'Remolinos', ico: 'i_remolino', desc: 'Remolinos que tragan barcos y los hacen girar hasta hundirlos.',
    lv: ['Un remolino cada 4 s', 'Más grande y dura más', '+1 remolino y +40% de daño', 'Sale más a menudo', '+1 remolino, más grande y +40% de daño'],
    n: [1, 1, 2, 2, 3], dps: [12, 12, 17, 17, 24], r: [62, 74, 74, 80, 92], cd: [4, 4, 3.6, 3, 3], dur: [3, 3.6, 3.6, 3.6, 4], evo: 'maelstrom',
  },
};
// evolutions: weapon at its best + its partner upgrade (from a chest)
const EVOS = {
  lanza:     { name: 'Lanza de plata', ico: 'i_prisma', base: 'rayo', pas: 'espejo', desc: 'Rayos enormes que lo atraviesan todo.' },
  megalodon: { name: 'Megalodón', ico: 'i_megalodon', base: 'tiburon', pas: 'nacar', desc: 'Un tiburón gigante se une a los demás; cada mordisco cura a la luna.' },
  mareaviva: { name: 'Marea viva', ico: 'i_solar', base: 'ondas', pas: 'marea', desc: 'Ondas inmensas que lanzan lejos a la flota y atraen las perlas.' },
  glaciar:   { name: 'Glaciar', ico: 'i_glaciar', base: 'escarcha', pas: 'lente', desc: 'Las esquirlas congelan por completo y atraviesan.' },
  poseidon:  { name: 'Ira de Poseidón', ico: 'i_poseidon', base: 'tormenta', pas: 'caracola', desc: 'Una tormenta continua que electrocuta a toda la flota.' },
  cometa:    { name: 'Cometa', ico: 'i_estelar', base: 'meteoros', pas: 'iman', desc: 'Un cometa gigante cae cada pocos segundos entre una lluvia de meteoritos.' },
  maelstrom: { name: 'Maelstrom', ico: 'i_maelstrom', base: 'remolino', pas: 'motor', desc: 'Un remolino gigante viaja contigo y se traga lo que se acerca.' },
};
const PASSIVES = {
  espejo:   { name: 'Espejo de plata', ico: 'i_espejo', desc: '+10% de daño', max: 5 },
  marea:    { name: 'Marea doble', ico: 'i_marea', desc: '+10% de área: tiburones, rayos y poderes más grandes', max: 5 },
  lente:    { name: 'Lente de cristal', ico: 'i_lente', desc: '-8% de tiempo entre ataques', max: 5 },
  motor:    { name: 'Viento de cola', ico: 'i_motor', desc: '+8% de velocidad de la luna', max: 5 },
  iman:     { name: 'Imán lunar', ico: 'i_iman', desc: '+30% de alcance para recoger perlas', max: 5 },
  nacar:    { name: 'Corazón de nácar', ico: 'i_nacar', desc: '+20 de vida máxima y recupera 0,3 por segundo', max: 5 },
  caracola: { name: 'Caracola de trueno', ico: 'i_caracola', desc: '+10% de experiencia', max: 5 },
};
const MAX_PASSIVES = 5, MAX_WEAPONS = 5;

// the six moons of the original Luna, each with its own power over the sea, its weapon and its trait
// mods: dmg, hpAdd, xp, coins, charge (time to fill the power), slots (extra weapon), chill (hits slow ships)
const MOONS = [
  { id: 'llena', face: 'calm', name: 'Luna llena', color: '#f4ecd0', tint: 0xdcecff, hp: 100, spd: 128, weapon: 'rayo', cost: 0,
    active: 'Tsunami', ico: 'i_tsunami', activeDesc: 'Una marea gigante sale de la luna y empuja lejos a todos los barcos.',
    perk: 'Equilibrada: ni fuerte ni débil en nada.', mods: {} },
  { id: 'roja', face: 'fierce', name: 'Luna roja', color: '#ff6b5a', tint: 0xff8a7a, hp: 100, spd: 130, weapon: 'ondas', cost: 350,
    active: 'Marea de sangre', ico: 'i_sangre', activeDesc: 'Durante 8 s el mar alrededor de la luna se vuelve rojo y quema a todo el que entra.',
    perk: '+20% de daño, pero 20 de vida menos.', mods: { dmg: 0.2, hpAdd: -20 } },
  { id: 'hielo', face: 'serene', name: 'Luna de hielo', color: '#9fe3ff', tint: 0xb8ecff, hp: 105, spd: 124, weapon: 'escarcha', cost: 800,
    active: 'Ventisca', ico: 'i_ventisca', activeDesc: 'Congela a todos los barcos de la pantalla durante 4 s.',
    perk: 'Sus golpes frenan a los barcos, pero hace un 10% menos de daño.', mods: { dmg: -0.1, chill: true } },
  { id: 'nueva', face: 'sly', name: 'Luna nueva', color: '#b49cff', tint: 0xc9b2ff, hp: 95, spd: 136, weapon: 'tiburon', cost: 1400,
    active: 'Eclipse', ico: 'i_eclipse', activeDesc: 'Se oculta 6 s: la flota la pierde de vista y nada puede tocarla.',
    perk: '+20% de experiencia, pero su poder tarda un 15% más en cargarse.', mods: { xp: 0.2, charge: 0.15 } },
  { id: 'tormenta', face: 'grumpy', name: 'Luna de tormenta', color: '#8fa8d8', tint: 0xb8c8ff, hp: 100, spd: 128, weapon: 'tormenta', cost: 2200,
    active: 'Diluvio', ico: 'i_diluvio', activeDesc: 'Durante 6 s caen rayos sobre todos los barcos que se ven.',
    perk: 'Lleva 6 armas en vez de 5, pero gana un 15% menos de experiencia.', mods: { slots: 1, xp: -0.15 } },
  { id: 'dorada', face: 'greedy', name: 'Luna dorada', color: '#ffd36b', tint: 0xffe2a0, hp: 85, spd: 130, weapon: 'meteoros', cost: 3000,
    active: 'Fiebre del oro', ico: 'i_tesoro', activeDesc: 'Durante 8 s cada barco hundido suelta el doble de perlas y monedas, y todas vuelan a ti.',
    perk: '+50% de monedas, pero 15 de vida menos.', mods: { coins: 0.5, hpAdd: -15 } },
];
let MOON = MOONS[0];          // the moon of this run, chosen on the title screen
const ACTIVE_CHARGE = 24;     // seconds for the power to fill on its own (sinking ships fills it faster)

// the workshop: permanent upgrades bought with coins between nights; each level costs more than the last
const SHOP = {
  vida:      { name: 'Más vida', ico: 'i_vida', desc: '+10 de vida máxima', max: 5, cost: 60 },
  fuerza:    { name: 'Fuerza lunar', ico: 'i_furia', desc: '+6% de daño', max: 5, cost: 80 },
  coraza:    { name: 'Coraza de nácar', ico: 'i_coraza', desc: 'Recibe un 5% menos de daño', max: 3, cost: 120 },
  iman:      { name: 'Atracción', ico: 'i_iman', desc: 'Recoge las perlas un 12% más lejos', max: 3, cost: 60 },
  viento:    { name: 'Viento a favor', ico: 'i_motor', desc: '+4% de velocidad', max: 3, cost: 90 },
  luz:       { name: 'Luz de luna', ico: 'i_faro', desc: 'El poder lunar se carga un 8% antes', max: 3, cost: 100 },
  codicia:   { name: 'Codicia', ico: 'i_codicia', desc: '+10% de monedas', max: 5, cost: 70 },
  sabio:     { name: 'Sabiduría', ico: 'i_sabio', desc: '+5% de experiencia', max: 3, cost: 90 },
  baraja:    { name: 'Más cartas', ico: 'i_baraja', desc: '+1 cambio de cartas en cada partida', max: 3, cost: 110 },
  manantial: { name: 'Segunda marea', ico: 'i_manantial', desc: 'Una vez por noche, la luna vuelve a flote con media vida', max: 1, cost: 900 },
};
const shopCost = (k, lv) => Math.round(SHOP[k].cost * Math.pow(1 + lv, 1.6) / 5) * 5;
