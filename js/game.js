// Home Alone – Steen voor Steen
// Een zijaanzicht-doorsnede van het huis van de McCallisters in bouwsteen-stijl.
'use strict';

const W = 1280, H = 720, WORLD_W = 3560;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------------
// Wereld
const AREAS = {
  G: { y: 480, x0: 30, x1: 2590, name: 'begane grond' },
  GR: { y: 480, x0: 3010, x1: 3520, name: 'achtertuin' },
  U: { y: 280, x0: 420, x1: 2580, name: 'boven' },
  B: { y: 690, x0: 420, x1: 2990, name: 'kelder' },
};
const STAIRS = [
  { id: 'S1', low: 'G', lx: 1250, high: 'U', hx: 1550, color: '#8a5a33' },
  { id: 'S2', low: 'B', lx: 2080, high: 'G', hx: 1830, color: '#7a6a5a' },
  { id: 'S3', low: 'B', lx: 2930, high: 'GR', hx: 3180, color: '#9aa0a8' },
];
const ROOMS = [
  { area: 'U', x0: 415, x1: 950, color: '#9cc7b5', name: 'Slaapkamer ouders' },
  { area: 'U', x0: 950, x1: 1700, color: '#e3cf9c', name: 'Overloop' },
  { area: 'U', x0: 1700, x1: 2585, color: '#8ea6cf', name: "Buzz' kamer" },
  { area: 'G', x0: 415, x1: 1100, color: '#8f2a2a', name: 'Woonkamer' },
  { area: 'G', x0: 1100, x1: 1850, color: '#2f5d45', name: 'Eetkamer' },
  { area: 'G', x0: 1850, x1: 2585, color: '#ddd3b4', name: 'Keuken' },
  { area: 'B', x0: 415, x1: 1500, color: '#6d6f73', name: 'Kelder' },
  { area: 'B', x0: 1500, x1: 2585, color: '#7c858e', name: 'Wasruimte' },
];
const CEIL = { U: 110, G: 300, B: 500 };

const TRAP_DEFS = [
  { id: 'stoep', area: 'G', x: 335, type: 'ice', name: 'IJzige stoep' },
  { id: 'klink', area: 'G', x: 440, type: 'knob', name: 'Gloeiende deurklink' },
  { id: 'autos', area: 'G', x: 760, type: 'cars', name: 'Speelgoedautootjes' },
  { id: 'ballen', area: 'G', x: 1480, type: 'ornaments', name: 'Kerstballen' },
  { id: 'brander', area: 'G', x: 2330, type: 'torch', name: 'Brander' },
  { id: 'tuinijs', area: 'GR', x: 3330, type: 'ice', name: 'IJzige kelderstoep' },
  { id: 'ijzer', area: 'B', x: 2330, type: 'iron', name: 'Strijkijzer' },
  { id: 'verf1', area: 'B', x: 1990, type: 'paint', name: 'Zwaaiend verfblik' },
  { id: 'spijker', area: 'B', x: 1050, type: 'nail', name: 'Spijker' },
  { id: 'verf2', area: 'U', x: 1470, type: 'paint', name: 'Zwaaiend verfblik' },
  { id: 'veren', area: 'U', x: 1100, type: 'feathers', name: 'Lijm & veren' },
  { id: 'spin', area: 'U', x: 2080, type: 'spider', name: 'Tarantula' },
];

const GAGS = {
  ice: { dur: 1.5, text: 'GLIBBER!', anim: 'slip', snd: 'slip' },
  cars: { dur: 1.5, text: 'WOEPS!', anim: 'slip', snd: 'slip' },
  ornaments: { dur: 1.8, text: 'AU AU AU!', anim: 'hop', snd: 'hurt' },
  nail: { dur: 1.7, text: 'AAAUW!', anim: 'launch', snd: 'boing' },
  knob: { dur: 1.8, text: 'HEET HEET!', anim: 'burnHand', snd: 'sizzle' },
  torch: { dur: 2.2, text: 'MIJN MUTS!', anim: 'fireHead', snd: 'sizzle' },
  iron: { dur: 1.6, text: 'KLONK!', anim: 'flatHit', snd: 'clang' },
  paint: { dur: 1.6, text: 'BONK!', anim: 'flatHit', snd: 'bonk' },
  feathers: { dur: 2.1, text: 'TOK TOK!', anim: 'chicken', snd: 'chicken' },
  spider: { dur: 2.2, text: 'AAAAAAAH!', anim: 'spider', snd: 'marvScream' },
};

const BREAKABLE_DEFS = [
  ['G', 230, 'snowman'], ['G', 560, 'gift'], ['G', 690, 'gift'], ['G', 900, 'lamp'], ['G', 1180, 'vase'],
  ['G', 1650, 'plant'], ['G', 1960, 'milk'], ['G', 2130, 'pizza'], ['G', 2480, 'trash'],
  ['U', 520, 'lamp'], ['U', 830, 'suitcase'], ['U', 1250, 'plant'], ['U', 1790, 'toybox'], ['U', 2250, 'lamp'],
  ['B', 520, 'box'], ['B', 870, 'box'], ['B', 1280, 'paintcans'], ['B', 1640, 'basket'], ['B', 2520, 'box'],
  ['GR', 3450, 'snowman'],
];

const STUD_VAL = { 10: '#cfd6de', 100: '#f2c230', 1000: '#3a8ee6', 10000: '#b060d8' };
const TRUE_KEVIN = 16000;
const PREP_TIME = 120;
const MAX_PRIDE = 6;

// ---------------------------------------------------------------------
// Toestand
let G = null; // huidige spel-toestand
let phase = 'menu';
let lastTime = 0;
let bgCanvas = null;
const keys = {};
const pressed = {};
const snow = [];

function newGame() {
  G = {
    time: 0,
    prepLeft: PREP_TIME,
    attackTime: 0,
    cam: 200,
    studs: 0, shownStuds: 0,
    trueKevinShown: false,
    catches: 0,
    fx: [], studList: [], pellets: [], popups: [],
    banner: null,
    shake: 0,
    tvCd: 0, tvT: 0,
    hasGun: false,
    winT: 0,
    flash: 0,
    stats: { traps: 0, smashed: 0, builtInPrep: 0 },
    kevin: {
      area: 'U', x: 720, jy: 0, vy: 0, dir: 1, walk: 0, stair: null, t: 0,
      state: 'play', timer: 0, invuln: 0, screamT: 0, screamCd: 0, shootCd: 0,
      buildId: null, idle: 0, pieces: null,
    },
    traps: TRAP_DEFS.map(d => ({ ...d, state: 'pile', progress: 0, timer: 0, anim: 0 })),
    breakables: BREAKABLE_DEFS.map(([area, x, type]) => ({ area, x, type, broken: false, wobble: 0 })),
    pickups: [
      { id: 'gun', area: 'U', x: 2470, taken: false },
    ],
    bandits: [
      makeBandit('harry', 'G', -80, 1, 0),
      makeBandit('marv', 'GR', 3620, -1, 3),
    ],
    cops: [],
  };
  placeStuds();
}

function makeBandit(name, area, x, dir, delay) {
  return {
    name, look: Looks[name], area, x, dir, stair: null, t: 0, goal: 1,
    jy: 0, vy: 0, walk: 0, pride: MAX_PRIDE, state: 'waiting', timer: delay,
    gag: null, gagT: 0, stunT: 0, pieces: null, spawnArea: area, spawnX: x,
    baseSpeed: name === 'harry' ? 118 : 128, sayCd: 2 + Math.random() * 3,
  };
}

function placeStuds() {
  const add = (area, x, h, value) => G.studList.push({ x, y: AREAS[area].y - 22 - h, floorY: AREAS[area].y, area, value, vx: 0, vy: 0, fixed: true, age: 1, spin: Math.random() * 6 });
  // Rijen zilveren noppen door het hele huis
  for (const [area, a, b, step] of [['G', 480, 1200, 60], ['G', 1300, 1800, 60], ['G', 1900, 2560, 60], ['U', 460, 1500, 60], ['U', 1620, 2560, 60], ['B', 460, 1950, 60], ['B', 2100, 2560, 60], ['G', 60, 380, 55], ['GR', 3050, 3500, 60]]) {
    for (let x = a; x <= b; x += step) add(area, x, 0, 10);
  }
  // Gouden bogen om overheen te springen
  const arc = (area, cx, n = 5) => { for (let i = 0; i < n; i++) { const u = i / (n - 1); add(area, cx - 70 + 140 * u, 25 + Math.sin(u * Math.PI) * 55, 100); } };
  arc('G', 620); arc('G', 1400); arc('G', 2200); arc('U', 640); arc('U', 1320); arc('U', 1950);
  arc('B', 700); arc('B', 1700); arc('B', 2750, 4); arc('GR', 3200, 4);
  // Blauwe noppen op lastige plekken
  add('U', 2330, 95, 1000); add('G', 820, 95, 1000); add('B', 1180, 95, 1000); add('G', 150, 90, 1000); add('B', 2860, 90, 1000);
  add('U', 1100, 100, 1000);
}

// ---------------------------------------------------------------------
// Hulpfuncties
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

function floorY(e) {
  if (e.stair) return lerp(AREAS[e.stair.low].y, AREAS[e.stair.high].y, e.t);
  return AREAS[e.area].y;
}
function posX(e) { return e.stair ? lerp(e.stair.lx, e.stair.hx, e.t) : e.x; }

function stairRoute(from, to) {
  // BFS over de gebieden; geeft de eerste trap + de kant waar je instapt
  if (from === to) return null;
  const prev = { [from]: null };
  const q = [from];
  while (q.length) {
    const a = q.shift();
    for (const s of STAIRS) {
      let b = null;
      if (s.low === a) b = s.high; else if (s.high === a) b = s.low;
      if (b && !(b in prev)) { prev[b] = { a, s }; q.push(b); }
    }
  }
  if (!(to in prev)) return null;
  let cur = to, step = prev[cur];
  while (step.a !== from) { cur = step.a; step = prev[cur]; }
  return { stair: step.s, fromLow: step.s.low === from };
}

function popup(text, x, y, size = 30, color = '#fff') {
  G.popups.push({ text, x, y, vy: -60, life: 1.3, max: 1.3, size, color });
}

function banner(text, sub = '', dur = 2.6, color = '#ffd84a') {
  G.banner = { text, sub, t: 0, dur, color };
}

function spawnStuds(x, y, fy, total, area) {
  let n = 0;
  while (total > 0 && n < 28) {
    let v = 10;
    if (total >= 1000 && Math.random() < 0.35) v = 1000;
    else if (total >= 100 && Math.random() < 0.6) v = 100;
    total -= v; n++;
    G.studList.push({ x, y, floorY: fy, area, value: v, vx: rand(-220, 220), vy: rand(-520, -260), fixed: false, age: 0, spin: Math.random() * 6, life: 12 });
  }
}

function spawnBricks(x, y, fy, colors, n = 10, power = 1) {
  for (let i = 0; i < n; i++) {
    const w = [8, 12, 16, 24][Math.random() * 4 | 0];
    G.fx.push({ kind: 'brick', x: x + rand(-10, 10), y: y + rand(-10, 10), vx: rand(-260, 260) * power, vy: rand(-480, -150) * power, w, h: 8, color: colors[i % colors.length], rot: rand(0, 6), vr: rand(-10, 10), floorY: fy, life: rand(1.2, 2), max: 2 });
  }
}

function figPieces(look, shortLegs) {
  const hairColor = { kevin: '#e9c46a', harry: '#26262b', marv: '#5a3a1e' };
  const lh = shortLegs ? 12 : 22, off = shortLegs ? 10 : 0;
  const p = (ox, oy, w, h, c) => ({ ox, oy, w, h, c });
  return [
    p(-6, -lh / 2, 11, lh, look.legColor), p(6, -lh / 2, 11, lh, look.legColor),
    p(0, -25 + off, 26, 7, look.hipColor || look.legColor),
    p(0, -40 + off, 26, 24, look.torsoColor),
    p(-14, -38 + off, 8, 17, look.armColor), p(14, -38 + off, 8, 17, look.armColor),
    p(0, -62 + off, 20, 19, LEGO_YELLOW),
    p(0, -73 + off, 24, 9, hairColor[look === Looks.kevin ? 'kevin' : look === Looks.harry ? 'harry' : 'marv']),
  ];
}

function breakFig(e, look, shortLegs) {
  const x = posX(e), fy = floorY(e) - e.jy;
  const sc = look.scale || 1;
  e.pieces = figPieces(look, shortLegs).map(p => ({
    ...p, x: x + p.ox * sc, y: fy + p.oy * sc, vx: rand(-240, 240), vy: rand(-560, -250), rot: 0, vr: rand(-12, 12), floorY: floorY(e),
  }));
  Sfx.breakApart();
}

function updatePieces(e, dt, reforming, prog) {
  if (!e.pieces) return;
  const x = posX(e), fy = floorY(e);
  const sc = (e.look || Looks.kevin).scale || 1;
  for (const p of e.pieces) {
    if (reforming) {
      if (p.sx == null) { p.sx = p.x; p.sy = p.y; p.srot = p.rot; }
      const u = 1 - Math.pow(1 - prog, 3);
      p.x = lerp(p.sx, x + p.ox * sc, u);
      p.y = lerp(p.sy, fy + p.oy * sc, u) - Math.sin(u * Math.PI) * 60;
      p.rot = lerp(p.srot, 0, u);
    } else {
      p.vy += 1500 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y + p.h / 2 > p.floorY) { p.y = p.floorY - p.h / 2; p.vy *= -0.35; p.vx *= 0.7; p.vr *= 0.6; }
    }
  }
}

function drawPieces(e) {
  if (!e.pieces) return;
  for (const p of e.pieces) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    Draw.brick(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.c, { studs: p.w > 10, studW: 6, pitch: 10 });
    ctx.restore();
  }
}

// ---------------------------------------------------------------------
// Invoer
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyE: 'build', KeyF: 'act', KeyQ: 'scream',
  KeyP: 'pause', Escape: 'pause', KeyM: 'mute', Enter: 'enter',
};
window.addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  if (!k) return;
  if (e.target && e.target.tagName === 'INPUT') return;
  e.preventDefault();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function setupTouch() {
  const pad = document.getElementById('touch');
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return;
  pad.classList.remove('hidden');
  pad.querySelectorAll('[data-k]').forEach(btn => {
    const k = btn.dataset.k;
    const down = ev => { ev.preventDefault(); if (!keys[k]) pressed[k] = true; keys[k] = true; btn.classList.add('on'); Sfx.init(); };
    const up = ev => { ev.preventDefault(); keys[k] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  });
}

// ---------------------------------------------------------------------
// Update: Kevin
function nearestTrapPile(k) {
  let best = null, bd = 48;
  for (const t of G.traps) {
    if (t.state !== 'pile' || t.area !== k.area || k.stair) continue;
    const d = Math.abs(t.x - k.x);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}
function nearestBreakable(k) {
  let best = null, bd = 55;
  for (const b of G.breakables) {
    if (b.broken || b.area !== k.area || k.stair) continue;
    const d = Math.abs(b.x - k.x);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}
function nearStairEnd(k) {
  if (k.stair || k.jy > 0) return null;
  for (const s of STAIRS) {
    if (s.low === k.area && Math.abs(k.x - s.lx) < 34) return { s, up: true };
    if (s.high === k.area && Math.abs(k.x - s.hx) < 34) return { s, up: false };
  }
  return null;
}
const TV_X = 1010;
function nearTV(k) { return !k.stair && k.area === 'G' && Math.abs(k.x - TV_X) < 60; }
const SLED_X = 1550;
function nearSled(k) { return !k.stair && k.area === 'U' && k.jy === 0 && Math.abs(k.x - SLED_X) < 40; }
function nearPickup(k) { return G.pickups.find(p => !p.taken && p.area === k.area && !k.stair && Math.abs(p.x - k.x) < 45); }

function updateKevin(dt) {
  const k = G.kevin;
  k.invuln = Math.max(0, k.invuln - dt);
  k.screamCd = Math.max(0, k.screamCd - dt);
  k.shootCd = Math.max(0, k.shootCd - dt);
  k.screamT = Math.max(0, k.screamT - dt);

  if (k.state === 'broken') {
    k.timer -= dt;
    updatePieces(k, dt, false);
    if (k.timer <= 0) {
      k.state = 'reform'; k.timer = 0.7;
      k.area = 'U'; k.x = 700; k.stair = null; k.jy = 0; k.vy = 0;
      Sfx.reform();
    }
    return;
  }
  if (k.state === 'reform') {
    k.timer -= dt;
    updatePieces(k, dt, true, 1 - k.timer / 0.7);
    if (k.timer <= 0) { k.state = 'play'; k.pieces = null; k.invuln = 2.5; }
    return;
  }
  if (phase === 'win') return;
  if (G.facade) { k.walk = 0; return; }

  if (k.state === 'sled') { updateSled(k, dt); return; }

  // Bouwen (vasthouden)
  const pile = nearestTrapPile(k);
  if (keys.build && pile && k.jy === 0) {
    k.buildId = pile.id;
    pile.progress += dt / 1.0;
    k.dir = pile.x > k.x ? 1 : -1;
    if (Math.random() < dt * 14) Sfx.click();
    if (Math.random() < dt * 20) G.fx.push({ kind: 'brick', x: pile.x + rand(-20, 20), y: AREAS[pile.area].y - 5, vx: rand(-60, 60), vy: rand(-360, -200), w: 12, h: 8, color: ['#e33', '#fc0', '#28f', '#2a2'][Math.random() * 4 | 0], rot: 0, vr: rand(-8, 8), floorY: AREAS[pile.area].y, life: 0.5, max: 0.5 });
    if (pile.progress >= 1) {
      pile.state = 'armed'; pile.progress = 0; pile.anim = 0;
      Sfx.buildDone();
      popup(pile.name + '!', pile.x, AREAS[pile.area].y - 90, 26, '#9fe870');
      G.stats.traps++;
      if (phase === 'prep') G.stats.builtInPrep++;
      spawnStuds(pile.x, AREAS[pile.area].y - 40, AREAS[pile.area].y, 60, pile.area);
    }
    k.walk = 0;
    return;
  }
  k.buildId = null;
  for (const t of G.traps) if (t.state === 'pile' && t.id !== (pile && pile.id)) t.progress = Math.max(0, t.progress - dt * 0.5);

  // Eenmalige acties
  if (pressed.build) {
    const pu = nearPickup(k);
    if (pu) {
      pu.taken = true; G.hasGun = true;
      Sfx.buildDone();
      banner("BUZZ' BB-GEWEER!", 'Druk [F] om te schieten (maakt bandieten even duizelig)', 2.8, '#9fe870');
    } else if (nearTV(k) && G.tvCd <= 0) {
      playTV();
    } else if (nearSled(k)) {
      k.state = 'sled'; k.stair = STAIRS[0]; k.t = 1; k.sledV = 0;
      Sfx.whoosh();
      popup('JOEPIE!', SLED_X, AREAS.U.y - 100, 30, '#ffd84a');
      return;
    }
  }
  if (pressed.act) {
    const b = nearestBreakable(k);
    if (b) smash(b);
    else if (G.hasGun && k.shootCd <= 0 && !k.stair) {
      k.shootCd = 0.7;
      G.pellets.push({ area: k.area, x: k.x + k.dir * 20, y: floorY(k) - k.jy - 42, vx: k.dir * 750, life: 0.7 });
      Sfx.shoot();
    }
  }
  if (pressed.scream && k.screamCd <= 0) {
    k.screamCd = 6; k.screamT = 1.4;
    Sfx.kevinScream();
    popup('AAAAAAH!', posX(k), floorY(k) - 110, 34, '#ffe066');
    G.shake = 0.35;
    for (const b of G.bandits) {
      if (b.state !== 'chase' || b.stair || b.area !== k.area) continue;
      if (Math.abs(b.x - k.x) < 380) stun(b, 1.6, '?!');
    }
  }

  // Beweging
  const speed = 235;
  let mv = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (k.screamT > 0.6) mv = 0;
  if (k.stair) {
    const s = k.stair;
    const up = Math.sign(s.hx - s.lx);
    let dirT = 0;
    if (keys.up || mv === up) dirT = 1;
    else if (keys.down || mv === -up) dirT = -1;
    const len = Math.hypot(s.hx - s.lx, AREAS[s.low].y - AREAS[s.high].y);
    k.t += dirT * speed * 0.8 * dt / len;
    if (dirT) { k.walk += dt * 14; k.dir = dirT * up; }
    if (k.t >= 1) { k.stair = null; k.area = s.high; k.x = s.hx; }
    else if (k.t <= 0) { k.stair = null; k.area = s.low; k.x = s.lx; }
  } else {
    const se = nearStairEnd(k);
    if (se && ((se.up && pressed.up) || (!se.up && pressed.down))) {
      k.stair = se.s; k.t = se.up ? 0.02 : 0.98;
    } else {
      k.x += mv * speed * dt;
      if (mv) { k.dir = mv; k.walk += dt * 14; k.idle = 0; } else { k.walk = 0; k.idle += dt; }
      const a = AREAS[k.area];
      k.x = clamp(k.x, a.x0, a.x1);
      if (pressed.jump && k.jy === 0) { k.vy = 560; Sfx.jump(); }
      if (k.vy !== 0 || k.jy > 0) {
        k.vy -= 1500 * dt; k.jy += k.vy * dt;
        if (k.jy <= 0) { k.jy = 0; k.vy = 0; }
      }
    }
  }

  // Noppen oppakken
  const kx = posX(k), ky = floorY(k) - k.jy - 34;
  for (let i = G.studList.length - 1; i >= 0; i--) {
    const s = G.studList[i];
    if (s.age < 0.35) continue;
    const dx = kx - s.x, dy = ky - s.y, d = Math.hypot(dx, dy);
    if (d < 32) {
      G.studs += s.value;
      Sfx.stud(s.value);
      G.studList.splice(i, 1);
      if (s.value >= 1000) popup('+' + s.value, s.x, s.y - 20, 22, STUD_VAL[s.value]);
    } else if (!s.fixed && d < 110) {
      s.x += dx / d * 420 * dt; s.y += dy / d * 420 * dt;
    }
  }
  if (!G.trueKevinShown && G.studs >= TRUE_KEVIN) {
    G.trueKevinShown = true;
    banner('ECHTE KEVIN!', 'Je hebt genoeg noppen verzameld – gouden steen!', 3, '#ffd84a');
    Sfx.fanfare();
  }
}

// Met de slee de grote trap af en de voordeur uit, net als in de film
function updateSled(k, dt) {
  if (k.stair) {
    k.t -= dt * 1.7;
    k.dir = -1;
    if (k.t <= 0) { k.stair = null; k.area = 'G'; k.x = STAIRS[0].lx; k.sledV = -820; }
  } else {
    k.x += k.sledV * dt;
    k.sledV = Math.min(0, k.sledV + 260 * dt);
    if (Math.random() < dt * 30) G.fx.push({ kind: 'smoke', x: k.x + 20, y: AREAS.G.y - 4, vx: 60, vy: -30, life: 0.4, max: 0.4, r: 4 });
    for (const b of G.bandits) {
      if (b.state === 'chase' && !b.stair && b.area === 'G' && Math.abs(b.x - k.x) < 30) {
        stun(b, 2.2, 'STRIKE!'); b.x -= 30; Sfx.bonk();
      }
    }
    if (k.x <= 80 || k.sledV > -40) {
      k.x = Math.max(k.x, 80);
      k.state = 'play'; k.sledV = 0;
      if (k.x < 400) {
        spawnBricks(k.x - 20, AREAS.G.y - 10, AREAS.G.y, ['#fff', '#eef4ff', '#dde8ff'], 16, 0.8);
        popup('PLOF!', k.x, AREAS.G.y - 90, 34, '#fff');
        Sfx.noise(0.3, 0.3, 1200, 'lowpass');
        spawnStuds(k.x, AREAS.G.y - 40, AREAS.G.y, 300, 'G');
      }
    }
  }
}

function smash(b) {
  b.broken = true;
  G.stats.smashed++;
  const y = AREAS[b.area].y;
  const colors = { gift: ['#d33', '#2a2', '#fc0'], lamp: ['#fc6', '#963', '#fff'], vase: ['#39c', '#fff'], plant: ['#2a2', '#963'], milk: ['#fff', '#39f'], pizza: ['#c93', '#e33', '#fc0'], trash: ['#777', '#444'], suitcase: ['#963', '#642'], toybox: ['#e33', '#fc0', '#28f'], box: ['#b85', '#963'], paintcans: ['#ccc', '#e33', '#28f'], basket: ['#db8', '#fff'], snowman: ['#fff', '#f80', '#222'] }[b.type] || ['#999'];
  spawnBricks(b.x, y - 25, y, colors, 12);
  const val = b.type === 'pizza' ? 1000 : b.type === 'snowman' ? 400 : rand(150, 350) | 0;
  spawnStuds(b.x, y - 30, y, val, b.area);
  Sfx.smash();
  if (b.type === 'pizza') popup("Lil' Nero's Pizza!", b.x, y - 90, 24, '#ffd84a');
}

function playTV() {
  G.tvCd = 18; G.tvT = 3;
  Sfx.gun();
  popup('"Hou het wisselgeld, smerig beest!"', TV_X, 330, 22, '#fff');
  for (const b of G.bandits) {
    if (b.state !== 'chase' || b.area !== 'G' || b.stair) continue;
    b.state = 'flee'; b.timer = 2.6; b.dir = b.x < TV_X ? -1 : 1;
    popup('Wie schiet daar?!', b.x, AREAS.G.y - 110, 22, '#ff8');
  }
}

// ---------------------------------------------------------------------
// Update: bandieten
function stun(b, t, text) {
  b.state = 'stunned'; b.stunT = t;
  if (text) popup(text, posX(b), floorY(b) - 110, 26, '#ff8');
}

function moveToward(b, area, x, speed, dt) {
  if (b.stair) {
    const s = b.stair;
    const len = Math.hypot(s.hx - s.lx, AREAS[s.low].y - AREAS[s.high].y);
    const d = b.goal === 1 ? 1 : -1;
    b.t += d * speed * 0.75 * dt / len;
    b.dir = Math.sign(s.hx - s.lx) * d || b.dir;
    b.walk += dt * 12;
    if (b.t >= 1) { b.stair = null; b.area = s.high; b.x = s.hx; }
    else if (b.t <= 0) { b.stair = null; b.area = s.low; b.x = s.lx; }
    return;
  }
  let tx = x;
  let route = null;
  if (b.area !== area) {
    route = stairRoute(b.area, area);
    if (!route) return;
    tx = route.fromLow ? route.stair.lx : route.stair.hx;
  }
  const dx = tx - b.x;
  if (Math.abs(dx) < 5) {
    if (route) { b.stair = route.stair; b.t = route.fromLow ? 0 : 1; b.goal = route.fromLow ? 1 : 0; }
    b.walk = 0;
    return;
  }
  const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
  b.x += step; b.dir = Math.sign(dx); b.walk += dt * 12;
}

const TAUNTS = {
  harry: ['Kom maar hier, kleintje!', 'Ik heb een gouden tand, jij straks ook!', 'We zijn de Natte Bandieten!', 'Waar ben je, snotaap?'],
  marv: ['Ik ga je pakken, jochie!', 'Harry, wacht op mij!', 'Hé, laat de kraan maar lopen!', 'Oeh, dat huis wordt nat!'],
};

function updateBandit(b, dt) {
  const k = G.kevin;
  if (b.state === 'waiting') {
    b.timer -= dt;
    if (b.timer <= 0) b.state = 'chase';
    return;
  }
  if (b.state === 'defeated' || b.state === 'arrested') { b.walk = 0; return; }
  if (b.state === 'stunned') {
    b.stunT -= dt; b.walk = 0;
    if (b.stunT <= 0) b.state = 'chase';
    return;
  }
  if (b.state === 'laugh') {
    b.timer -= dt; b.walk = 0;
    if (b.timer <= 0) b.state = 'chase';
    return;
  }
  if (b.state === 'flee') {
    b.timer -= dt;
    const a = AREAS[b.area];
    b.x = clamp(b.x + b.dir * 190 * dt, a.x0, a.x1); b.walk += dt * 18;
    if (b.timer <= 0) b.state = 'chase';
    return;
  }
  if (b.state === 'gag') {
    b.gagT += dt;
    const g = GAGS[b.gag];
    if (b.gag === 'torch' || b.gag === 'knob') {
      b.x = clamp(b.x + b.dir * 260 * dt * Math.sign(Math.sin(b.gagT * 5)), AREAS[b.area].x0, AREAS[b.area].x1);
      b.walk += dt * 20;
      if (Math.random() < dt * 30) G.fx.push({ kind: 'smoke', x: b.x + rand(-6, 6), y: floorY(b) - (b.gag === 'torch' ? 85 : 40), vx: rand(-20, 20), vy: -80, life: 0.8, max: 0.8, r: rand(4, 9) });
    }
    if (b.gag === 'feathers') {
      if (Math.random() < dt * 12) G.fx.push({ kind: 'feather', x: b.x + rand(-15, 15), y: floorY(b) - rand(20, 70), vx: rand(-40, 40), vy: rand(-40, 20), life: 1.5, max: 1.5, rot: rand(0, 6) });
    }
    if (b.gag === 'launch') {
      b.vy -= 1400 * dt; b.jy = Math.max(0, b.jy + b.vy * dt);
      const room = floorY(b) - CEIL[b.area === 'GR' ? 'G' : b.area];
      if (b.jy > room - 78 && b.vy > 0) { b.vy = -b.vy * 0.3; if (!b.hitCeil) { b.hitCeil = true; Sfx.bonk(); popup('BOINK!', b.x, floorY(b) - room + 10, 26, '#ff8'); G.shake = 0.25; } }
    }
    if (b.gagT >= g.dur) {
      b.jy = 0; b.vy = 0;
      b.pride--;
      breakFig(b, b.look, false);
      spawnStuds(posX(b), floorY(b) - 40, floorY(b), 650, b.area);
      G.shake = 0.3;
      b.state = 'broken'; b.timer = 1.4;
      if (b.pride <= 0) banner(b.name === 'harry' ? 'HARRY IS VERSLAGEN!' : 'MARV IS VERSLAGEN!', 'Nog één Natte Bandiet te gaan…', 2.2, '#9fe870');
    }
    return;
  }
  if (b.state === 'broken') {
    b.timer -= dt;
    updatePieces(b, dt, false);
    if (b.timer <= 0) { b.state = 'reform'; b.timer = 0.7; Sfx.reform(); }
    return;
  }
  if (b.state === 'reform') {
    b.timer -= dt;
    updatePieces(b, dt, true, 1 - b.timer / 0.7);
    if (b.timer <= 0) {
      b.pieces = null;
      if (b.pride <= 0) { b.state = 'defeated'; checkWin(); }
      else { b.state = 'chase'; popup(b.name === 'harry' ? 'GRRRR!' : 'Au, mijn hoofd…', posX(b), floorY(b) - 110, 22, '#fff'); }
    }
    return;
  }

  // chase
  const anger = MAX_PRIDE - b.pride;
  const speed = b.baseSpeed + anger * 11;
  if (k.state === 'play') {
    const ks = k.stair;
    if (ks && b.stair === ks) {
      // Zelfde trap: loop recht op Kevin af
      const len = Math.hypot(ks.hx - ks.lx, AREAS[ks.low].y - AREAS[ks.high].y);
      const d = Math.sign(k.t - b.t);
      b.t = clamp(b.t + d * Math.min(Math.abs(k.t - b.t), speed * 0.75 * dt / len), 0, 1);
      b.dir = Math.sign(ks.hx - ks.lx) * d || b.dir; b.walk += dt * 12;
    } else if (ks && !b.stair && (b.area === ks.low || b.area === ks.high)) {
      // Kevin staat op een trap die aan onze verdieping grenst: ga erop
      const low = b.area === ks.low;
      const ex = low ? ks.lx : ks.hx;
      if (Math.abs(b.x - ex) < 6) { b.stair = ks; b.t = low ? 0 : 1; b.goal = low ? 1 : 0; }
      else moveToward(b, b.area, ex, speed, dt);
    } else {
      let ta = k.area, tx = k.x;
      if (ks) { ta = k.t < 0.5 ? ks.low : ks.high; tx = k.t < 0.5 ? ks.lx : ks.hx; }
      if (b.stair && ta === b.stair.low) b.goal = 0;
      else if (b.stair && ta === b.stair.high) b.goal = 1;
      moveToward(b, ta, tx, speed, dt);
    }
  } else {
    b.walk = 0;
  }

  b.sayCd -= dt;
  if (b.sayCd <= 0) {
    b.sayCd = rand(6, 11);
    const list = TAUNTS[b.name];
    popup(list[Math.random() * list.length | 0], posX(b), floorY(b) - 105, 18, '#fff');
  }

  // Vallen
  if (!b.stair) {
    for (const t of G.traps) {
      if (t.state !== 'armed' || t.area !== b.area) continue;
      if (Math.abs(t.x - b.x) < 22) { triggerTrap(t, b); return; }
    }
  }

  // Kevin pakken
  if (k.state === 'play' && k.invuln <= 0) {
    const dx = Math.abs(posX(k) - posX(b));
    const dy = Math.abs(floorY(k) - floorY(b));
    if (dx < 26 && dy < 22 && k.jy < 42) catchKevin(b);
  }
}

function triggerTrap(t, b) {
  const g = GAGS[t.type];
  t.state = 'fired'; t.timer = 5; t.anim = 0;
  b.state = 'gag'; b.gag = t.type; b.gagT = 0; b.hitCeil = false;
  if (t.type === 'nail') { b.vy = 900; }
  if (t.type === 'ice' || t.type === 'cars') b.slipDir = b.dir;
  popup(g.text, b.x, AREAS[b.area].y - 115, 34, '#ffd84a');
  Sfx[g.snd] && Sfx[g.snd]();
  if (t.type === 'ornaments') Sfx.hurt(b.name === 'marv');
  if (t.type === 'spider') { G.shake = 0.3; }
  if (t.type === 'knob') popup('M', b.x + b.dir * 20, AREAS[b.area].y - 55, 24, '#ff5533');
  G.stats.hits = (G.stats.hits || 0) + 1;
}

function catchKevin(b) {
  const k = G.kevin;
  G.catches++;
  Sfx.caught();
  Sfx.laugh();
  breakFig(k, Looks.kevin, true);
  k.state = 'broken'; k.timer = 1.5;
  const lose = Math.min(G.studs, Math.floor(G.studs * 0.15 / 10) * 10);
  G.studs -= lose;
  if (lose > 0) spawnStuds(posX(k), floorY(k) - 40, floorY(k), lose, k.area);
  popup(b.name === 'harry' ? 'Hebbes, jochie!' : 'Ik heb hem, Harry!', posX(b), floorY(b) - 110, 24, '#fff');
  b.state = 'laugh'; b.timer = 1.6;
  G.shake = 0.35;
  for (const o of G.bandits) if (o !== b && o.state === 'chase') { o.state = 'laugh'; o.timer = 1.0; }
}

function checkWin() {
  if (G.bandits.every(b => b.state === 'defeated') && phase === 'attack') {
    phase = 'win'; G.winT = 0;
    Sfx.siren();
    banner('POLITIE!', 'De Natte Bandieten worden ingerekend!', 4, '#6fb6ff');
    Music.play('win');
    for (const b of G.bandits) {
      G.cops.push({ area: b.area, x: posX(b) - 40 * (b.dir || 1), dir: b.dir || 1, target: b, t: 0 });
    }
  }
}

// ---------------------------------------------------------------------
// Hoofd-update
function update(dt) {
  G.time += dt;
  G.shake = Math.max(0, G.shake - dt);
  G.tvCd = Math.max(0, G.tvCd - dt);
  G.tvT = Math.max(0, G.tvT - dt);
  G.flash = Math.max(0, G.flash - dt);
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }

  if (phase === 'prep') {
    const before = Math.ceil(G.prepLeft);
    G.prepLeft -= dt;
    if (Math.ceil(G.prepLeft) !== before && G.prepLeft < 10) Sfx.clock();
    if (G.prepLeft <= 0 || pressed.enter) startAttack();
  } else if (phase === 'attack') {
    G.attackTime += dt;
  } else if (phase === 'win') {
    G.winT += dt;
    for (const c of G.cops) c.t += dt;
    if (G.winT > 5.5 && !G.winShown) { G.winShown = true; showWin(); }
  }

  updateFacade(dt);
  updateKevin(dt);
  if (phase === 'attack' || phase === 'win') for (const b of G.bandits) updateBandit(b, dt);

  for (const t of G.traps) {
    t.anim += dt;
    if (t.state === 'fired') { t.timer -= dt; if (t.timer <= 0) { t.state = 'pile'; t.progress = 0; } }
  }

  // Kogeltjes
  for (let i = G.pellets.length - 1; i >= 0; i--) {
    const p = G.pellets[i];
    p.x += p.vx * dt; p.life -= dt;
    let hit = false;
    for (const b of G.bandits) {
      if (b.state !== 'chase' || b.stair || b.area !== p.area) continue;
      if (Math.abs(b.x - p.x) < 16) {
        stun(b, 1.1, 'AU!'); b.x += Math.sign(p.vx) * 25; hit = true;
        Sfx.hurt(b.name === 'marv'); break;
      }
    }
    if (hit || p.life <= 0) G.pellets.splice(i, 1);
  }

  // Noppen-fysica
  for (let i = G.studList.length - 1; i >= 0; i--) {
    const s = G.studList[i];
    s.age += dt; s.spin += dt * 5;
    if (!s.fixed) {
      s.vy += 1400 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.y > s.floorY - 10) { s.y = s.floorY - 10; s.vy *= -0.45; s.vx *= 0.8; if (Math.abs(s.vy) < 40) s.vy = 0; }
      const a = AREAS[s.area]; if (a) s.x = clamp(s.x, a.x0, a.x1);
      s.life -= dt;
      if (s.life <= 0) G.studList.splice(i, 1);
    }
  }

  // Effecten
  for (let i = G.fx.length - 1; i >= 0; i--) {
    const f = G.fx[i];
    f.life -= dt;
    if (f.life <= 0) { G.fx.splice(i, 1); continue; }
    if (f.kind === 'brick') {
      f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (f.y > f.floorY - 4) { f.y = f.floorY - 4; f.vy *= -0.4; f.vx *= 0.7; f.vr *= 0.5; }
    } else if (f.kind === 'smoke' || f.kind === 'feather' || f.kind === 'spark') {
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.kind === 'feather') { f.vy = Math.min(f.vy + 60 * dt, 40); f.rot += dt * 3; f.x += Math.sin(f.life * 6) * 30 * dt; }
    }
  }
  for (let i = G.popups.length - 1; i >= 0; i--) {
    const p = G.popups[i];
    p.life -= dt; p.y += p.vy * dt; p.vy *= 0.96;
    if (p.life <= 0) G.popups.splice(i, 1);
  }

  // Camera
  const k = G.kevin;
  let focus = posX(k) + k.dir * 80;
  if (phase === 'win' && G.cops.length) focus = posX(G.bandits[G.winT < 2.8 ? 0 : G.bandits.length - 1]);
  const target = clamp(focus - W / 2, 0, WORLD_W - W);
  G.cam = lerp(G.cam, target, Math.min(1, dt * 4));
  G.shownStuds += (G.studs - G.shownStuds) * Math.min(1, dt * 8);
  if (Math.abs(G.studs - G.shownStuds) < 1) G.shownStuds = G.studs;
}

function startAttack() {
  phase = 'attack';
  G.prepLeft = 0;
  Sfx.doorbell();
  banner('21:00 UUR', 'De Natte Bandieten komen eraan! Laat ze in je vallen lopen.', 3.2, '#ff6b5b');
  Music.play('attack');
}

// ---------------------------------------------------------------------
// Statische achtergrond (één keer getekend)
function buildBackground() {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = WORLD_W; bgCanvas.height = H;
  const c = bgCanvas.getContext('2d');

  // Lucht
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b1433'); sky.addColorStop(0.6, '#23305e'); sky.addColorStop(1, '#3a3f6b');
  c.fillStyle = sky; c.fillRect(0, 0, WORLD_W, H);
  for (let i = 0; i < 220; i++) {
    c.fillStyle = `rgba(255,255,255,${rand(0.3, 0.9)})`;
    c.fillRect(rand(0, WORLD_W), rand(0, 420), 2, 2);
  }
  // Maan
  c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(260, 70, 36, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e8dcae'; c.beginPath(); c.arc(250, 62, 8, 0, Math.PI * 2); c.arc(272, 82, 5, 0, Math.PI * 2); c.fill();

  // Buurhuizen met lichtjes
  for (let hx = -100; hx < WORLD_W; hx += 420) {
    if (hx > 250 && hx < 2700) continue;
    const hw = 260, top = 300;
    c.fillStyle = '#1c2140'; c.fillRect(hx, top, hw, 180);
    c.beginPath(); c.moveTo(hx - 20, top); c.lineTo(hx + hw / 2, top - 90); c.lineTo(hx + hw + 20, top); c.fill();
    c.fillStyle = '#f6d36a';
    c.fillRect(hx + 40, top + 50, 40, 40); c.fillRect(hx + 180, top + 50, 40, 40);
    for (let i = 0; i < 14; i++) {
      c.fillStyle = ['#f33', '#3f3', '#fd3', '#39f'][i % 4];
      c.beginPath(); c.arc(hx - 10 + i * (hw + 20) / 13, top - 2 + Math.sin(i) * 3, 3, 0, Math.PI * 2); c.fill();
    }
  }

  // Grond en aarde
  c.fillStyle = '#4a3322'; c.fillRect(0, 480, WORLD_W, H - 480);
  for (let y = 500; y < H; y += 16) for (let x = (y / 16 % 2) * 16 - 16; x < WORLD_W; x += 32) {
    c.fillStyle = shade('#4a3322', ((x * 7 + y * 3) % 5) * 0.02 - 0.04); c.fillRect(x, y, 31, 15);
  }
  // Sneeuwlaag
  for (let x = 0; x < WORLD_W; x += 32) Draw.brick(c, x, 470, 32, 12, '#f4f8ff', { studW: 9, pitch: 16 });

  // Kelder- en koekoekskuil uitsnijden
  c.fillStyle = '#23252b'; c.fillRect(2600, 470, 400, 240);
  for (let y = 480; y < 710; y += 16) Draw.brick(c, 2990, y, 16, 16, '#6b6f78', { studs: false });

  // Kamers
  for (const r of ROOMS) {
    const top = CEIL[r.area], bot = AREAS[r.area].y;
    c.fillStyle = r.color; c.fillRect(r.x0, top, r.x1 - r.x0, bot - top);
    // behangstrepen / steentextuur
    if (r.area === 'B') {
      for (let y = top; y < bot; y += 20) for (let x = r.x0 + ((y / 20) % 2) * 20; x < r.x1; x += 40) {
        c.fillStyle = shade(r.color, -0.08); c.fillRect(x, y, 39, 1); c.fillRect(x, y, 1, 19);
      }
    } else {
      for (let x = r.x0; x < r.x1; x += 24) { c.fillStyle = shade(r.color, 0.06); c.fillRect(x, top, 10, bot - top); }
      c.fillStyle = shade(r.color, -0.3); c.fillRect(r.x0, bot - 14, r.x1 - r.x0, 14);
      c.fillStyle = shade(r.color, -0.15); c.fillRect(r.x0, top, r.x1 - r.x0, 8);
    }
    // Naambordje
    c.font = '14px "Luckiest Guy", "Arial Black", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const tw = c.measureText(r.name).width + 20;
    const mx = r.x0 + tw / 2 + 24;
    c.fillStyle = 'rgba(0,0,0,0.35)'; Draw.rr(c, mx - tw / 2, top + 14, tw, 22, 6); c.fill();
    c.fillStyle = '#fff'; c.fillText(r.name, mx, top + 26);
  }

  // Ramen
  const win = (x, y, w, h) => {
    c.fillStyle = '#5b3a1e'; c.fillRect(x - 6, y - 6, w + 12, h + 12);
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0e1a3d'); g.addColorStop(1, '#2d3f78');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#fff'; for (let i = 0; i < 12; i++) c.fillRect(x + rand(0, w), y + rand(0, h), 2, 2);
    c.fillStyle = '#5b3a1e'; c.fillRect(x + w / 2 - 2, y, 4, h); c.fillRect(x, y + h / 2 - 2, w, 4);
    Draw.brick(c, x - 10, y + h + 6, w + 20, 8, '#f4f8ff', { studW: 7, pitch: 12 });
  };
  win(700, 160, 90, 70); win(1180, 160, 90, 70); win(2330, 150, 110, 80);
  win(1300, 350, 90, 75); win(2150, 345, 110, 60); win(560, 530, 60, 30); win(2200, 530, 60, 30);

  // Decor
  drawDecor(c);

  // Vloeren / plafonds
  const slab = (x0, x1, y) => {
    for (let x = x0; x < x1; x += 64) Draw.brick(c, x, y + 6, Math.min(64, x1 - x), 14, '#6b6f78', { studs: false });
    c.fillStyle = '#b8864f'; c.fillRect(x0, y, x1 - x0, 6);
    c.fillStyle = '#d4a268'; c.fillRect(x0, y, x1 - x0, 2);
  };
  slab(400, 2600, 280); slab(400, 2600, 480); slab(400, 3000, 690); slab(400, 2600, 90);
  c.fillStyle = '#4a3322'; c.fillRect(0, 710, WORLD_W, 10);

  // Buitenmuren (rode stenen)
  const wall = (x, y0, y1, holes) => {
    for (let y = y0; y < y1; y += 16) {
      if (holes.some(([a, b]) => y + 16 > a && y < b)) continue;
      Draw.brick(c, x, y, 20, 16, '#a3312b', { studW: 8, pitch: 20 });
    }
  };
  wall(395, 90, 710, [[390, 480], [600, 690]]);
  wall(2585, 90, 710, [[610, 690]]);
  // Voordeur (open) en kelderdeur
  c.fillStyle = '#2c5e2e'; c.fillRect(360, 392, 36, 88);
  c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(388, 440, 4, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#6a4a2a'; c.fillRect(2560, 612, 26, 78);

  // Dak: getrapt, zoals je dat met stenen bouwt
  for (let k = 0; k < 5; k++) {
    const y = 90 - (k + 1) * 16, x0 = 370 + k * 80, x1 = 2630 - k * 80;
    for (let x = x0; x < x1; x += 48) Draw.brick(c, x, y, Math.min(48, x1 - x), 16, k % 2 ? '#3b3f4a' : '#454a57', { studs: false });
    Draw.brick(c, x0, y - 5, 80, 5, '#f4f8ff', { studs: false });
    Draw.brick(c, x1 - 80, y - 5, 80, 5, '#f4f8ff', { studs: false });
  }
  Draw.brick(c, 770, -6, 1460, 8, '#f4f8ff', { studW: 9 });
  // Schoorsteen
  for (let y = -10; y < 10; y += 16) Draw.brick(c, 2080, y, 48, 16, '#a3312b', { studW: 8 });

  // Voorstoep
  Draw.brick(c, 290, 468, 110, 12, '#9aa0a8', { studW: 9 });

  // Trappen
  for (const s of STAIRS) {
    const n = 12, ly = AREAS[s.low].y, hy = AREAS[s.high].y;
    const sw = (s.hx - s.lx) / n;
    for (let i = 0; i < n; i++) {
      const x = s.lx + sw * i;
      const y = ly - (ly - hy) * (i + 1) / n;
      const bx = Math.min(x, x + sw);
      Draw.brick(c, bx, y, Math.abs(sw) + 1, ly - y, i % 2 ? s.color : shade(s.color, -0.08), { studs: false });
      c.fillStyle = shade(s.color, 0.3); c.fillRect(bx, y, Math.abs(sw) + 1, 3);
      if (s.id === 'S1') { c.fillStyle = '#9b1a20'; c.fillRect(bx, y, Math.abs(sw) + 1, 5); c.fillStyle = '#c8232c'; c.fillRect(bx, y, Math.abs(sw) + 1, 2); c.fillStyle = '#d4af37'; c.fillRect(bx, y + 5, 3, 3); }
    }
    // leuning
    c.strokeStyle = '#3d2410'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(s.lx, ly - 50); c.lineTo(s.hx, hy - 50); c.stroke();
    c.lineWidth = 3;
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      c.beginPath(); c.moveTo(lerp(s.lx, s.hx, u), lerp(ly, hy, u) - 50); c.lineTo(lerp(s.lx, s.hx, u), lerp(ly, hy, u) - 4); c.stroke();
    }
  }
}

function drawDecor(c) {
  // --- Buiten links: brievenbus en lantaarnpaal
  c.fillStyle = '#333'; c.fillRect(90, 380, 6, 100);
  c.fillStyle = '#ffe8a0'; c.beginPath(); c.arc(93, 375, 12, 0, Math.PI * 2); c.fill();
  Draw.brick(c, 20, 440, 30, 20, '#2a52a8'); c.fillStyle = '#555'; c.fillRect(33, 460, 4, 20);

  // --- Woonkamer: open haard + kousen
  Draw.brick(c, 780, 390, 100, 90, '#a3312b', { studW: 8 });
  c.fillStyle = '#1a0d05'; c.fillRect(800, 420, 60, 60);
  Draw.brick(c, 770, 384, 120, 8, '#e8dcc0');
  for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? '#2a8a3a' : '#d33'; c.fillRect(790 + i * 35, 392, 14, 24); c.fillRect(790 + i * 35, 410, 20, 8); c.fillStyle = '#fff'; c.fillRect(790 + i * 35, 392, 14, 5); }
  // Bank
  Draw.brick(c, 1030, 440, 60, 40, '#7a5a3a', { studs: false });
  // Eetkamer: tafel & stoelen
  Draw.brick(c, 1330, 430, 160, 10, '#6b3f1f', { studW: 8 });
  c.fillStyle = '#4a2a14'; c.fillRect(1340, 440, 8, 40); c.fillRect(1472, 440, 8, 40);
  for (const x of [1310, 1500]) { c.fillStyle = '#5a3418'; c.fillRect(x, 400, 8, 80); c.fillRect(x - 4, 450, 20, 6); }
  // Kroonluchter
  c.strokeStyle = '#caa'; c.lineWidth = 2; c.beginPath(); c.moveTo(1410, 300); c.lineTo(1410, 330); c.stroke();
  Draw.brick(c, 1385, 330, 50, 8, '#e7c35a', { studW: 6, pitch: 10 });
  // Keuken: aanrecht, koelkast
  for (let x = 1880; x < 2280; x += 40) Draw.brick(c, x, 430, 40, 50, '#e6e0cc', { studs: false });
  Draw.brick(c, 1880, 424, 400, 8, '#8b8f99', { studW: 8 });
  Draw.brick(c, 2420, 360, 70, 120, '#f2f2f2', { studs: false });
  c.fillStyle = '#999'; c.fillRect(2478, 390, 4, 30); c.fillRect(2478, 435, 4, 30);
  c.fillStyle = '#333'; c.fillRect(2420, 420, 70, 3);
  // Kalkoen op het aanrecht (Kevin's "kerstdiner": mac & cheese)
  c.fillStyle = '#f5a623'; c.beginPath(); c.ellipse(1990, 418, 16, 6, 0, 0, Math.PI * 2); c.fill();

  // --- Boven: ouderbed, spiegel, aftershave
  Draw.brick(c, 480, 230, 180, 50, '#7a4a2a', { studs: false });
  Draw.brick(c, 490, 220, 160, 14, '#d9d0ff', { studW: 8 });
  Draw.brick(c, 470, 180, 16, 100, '#5a3418', { studs: false });
  c.fillStyle = '#bfe3ff'; Draw.rr(c, 850, 150, 60, 80, 8); c.fill();
  c.strokeStyle = '#c9a44c'; c.lineWidth = 5; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(860, 160, 10, 40);
  Draw.brick(c, 840, 236, 80, 8, '#fff');
  c.fillStyle = '#6ac1ff'; c.fillRect(860, 222, 10, 14); c.fillStyle = '#333'; c.fillRect(861, 218, 8, 4);
  // Overloop: schilderijen van de familie
  for (const [x, col] of [[1030, '#c98'], [1120, '#9ac'], [1640, '#ca8']]) {
    c.fillStyle = '#c9a44c'; c.fillRect(x - 4, 146, 52, 44);
    c.fillStyle = col; c.fillRect(x, 150, 44, 36);
    c.fillStyle = LEGO_YELLOW; c.beginPath(); c.arc(x + 15, 166, 6, 0, Math.PI * 2); c.arc(x + 30, 166, 6, 0, Math.PI * 2); c.fill();
  }
  // Buzz' kamer: stapelbed, terrarium
  Draw.brick(c, 1780, 240, 150, 40, '#2a52a8', { studs: false });
  Draw.brick(c, 1780, 160, 150, 14, '#2a52a8', { studs: false });
  c.fillStyle = '#5a3418'; c.fillRect(1774, 150, 10, 130); c.fillRect(1926, 150, 10, 130);
  c.fillStyle = 'rgba(160,220,255,.35)'; c.fillRect(2200, 210, 90, 50);
  c.strokeStyle = '#555'; c.lineWidth = 3; c.strokeRect(2200, 210, 90, 50);
  Draw.brick(c, 2195, 260, 100, 20, '#5a3418', { studs: false });
  c.fillStyle = '#7a5a2a'; c.fillRect(2205, 248, 80, 12);
  // plank voor BB-geweer
  Draw.brick(c, 2430, 236, 90, 8, '#6b3f1f', { studW: 8 });
  // Poster "Buzz"
  c.fillStyle = '#222'; c.fillRect(2380, 140, 60, 70);
  c.fillStyle = '#e33'; c.font = '14px "Luckiest Guy", sans-serif'; c.textAlign = 'center'; c.fillText('KEEP', 2410, 165); c.fillText('OUT!', 2410, 185);

  // --- Kelder: griezelige verwarmingsketel (ogen worden dynamisch getekend)
  Draw.brick(c, 620, 560, 150, 130, '#50545c', { studW: 10 });
  for (let i = 0; i < 4; i++) { c.fillStyle = '#6b6f78'; c.fillRect(640 + i * 30, 510, 10, 50); }
  c.fillStyle = '#1a1a1a'; c.fillRect(655, 610, 80, 50);
  // Planken met verfblikken
  Draw.brick(c, 1120, 590, 140, 8, '#7a5a3a', { studW: 8 });
  Draw.brick(c, 1120, 540, 140, 8, '#7a5a3a', { studW: 8 });
  for (let i = 0; i < 4; i++) { c.fillStyle = ['#e33', '#28f', '#fc0', '#2a2'][i]; c.fillRect(1130 + i * 32, 562, 22, 28); c.fillStyle = '#ccc'; c.fillRect(1130 + i * 32, 562, 22, 4); }
  // Wasmachine + droger
  for (const x of [1700, 1780]) { Draw.brick(c, x, 610, 70, 80, '#f2f2f2', { studs: false }); c.fillStyle = '#9ab'; c.beginPath(); c.arc(x + 35, 655, 20, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#555'; c.lineWidth = 3; c.stroke(); }
  // Wasgoedkoker (voor het strijkijzer)
  c.fillStyle = '#777'; c.fillRect(2310, 500, 40, 30);
  c.fillStyle = '#555'; c.fillRect(2316, 526, 28, 6);
  // Boiler
  c.fillStyle = '#b0b4bb'; Draw.rr(c, 2450, 560, 60, 130, 20); c.fill();

  // --- Achtertuin: boomhut met kabelbaan
  c.fillStyle = '#5a3418'; c.fillRect(3420, 180, 30, 300);
  c.fillStyle = '#2d4f2f';
  for (const [x, y, r] of [[3435, 170, 70], [3385, 210, 50], [3490, 215, 50]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  Draw.brick(c, 3370, 240, 130, 60, '#8a5a33', { studW: 9 });
  c.fillStyle = '#3d2410'; c.beginPath(); c.moveTo(3360, 240); c.lineTo(3435, 195); c.lineTo(3510, 240); c.fill();
  c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(2440, 190); c.quadraticCurveTo(2950, 260, 3380, 260); c.stroke();
  // Hek van buurman Marley
  for (let x = 3030; x < WORLD_W; x += 24) Draw.brick(c, x, 440, 10, 30, '#e6e0cc', { studW: 6, pitch: 10 });
}

// ---------------------------------------------------------------------
// De voorgevel: bij de start vliegt hij steen voor steen weg
let facadeCanvas = null;
const FAC = { x0: 400, x1: 2600, top: 90, ground: 480 };
function buildFacade() {
  facadeCanvas = document.createElement('canvas');
  facadeCanvas.width = FAC.x1 - FAC.x0; facadeCanvas.height = FAC.ground - FAC.top;
  const c = facadeCanvas.getContext('2d');
  c.translate(-FAC.x0, -FAC.top);
  drawFacade(c, { ...FAC, up: [560, 800, 1120, 1500, 1880, 2200, 2440], down: [560, 800, 1120, 1880, 2200, 2440], door: 1500, lit: true, lightsOn: true, t: 0 });
}

function startFacadeReveal() {
  const cells = [];
  const bw = 64, bh = 26;
  const kx = posX(G.kevin), ky = floorY(G.kevin) - 30;
  for (let y = FAC.top, row = 0; y < FAC.ground; y += bh, row++) {
    for (let x = FAC.x0 - (row % 2) * bw / 2; x < FAC.x1; x += bw) {
      const x0 = Math.max(x, FAC.x0), x1 = Math.min(x + bw, FAC.x1), h = Math.min(bh, FAC.ground - y);
      if (x1 - x0 < 2) continue;
      const cx = (x0 + x1) / 2, cy = y + h / 2;
      const d = Math.hypot(cx - kx, cy - ky);
      cells.push({ sx: x0, sy: y, w: x1 - x0, h, x: cx, y: cy, vx: (cx - kx) / (d + 1) * rand(150, 380) + rand(-60, 60), vy: rand(-520, -260), rot: 0, vr: rand(-6, 6), delay: 0.9 + d / 1500, age: 0 });
    }
  }
  G.facade = { t: 0, cells, bannerShown: false };
  G.cam = clamp(kx - W / 2, 0, WORLD_W - W);
}

function updateFacade(dt) {
  const f = G.facade;
  if (!f) return;
  f.t += dt;
  let alive = 0, launched = 0;
  for (const c of f.cells) {
    if (f.t < c.delay) { alive++; continue; }
    c.age += dt; launched++;
    c.vy += 1100 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
    if (c.age < 1.4) alive++;
  }
  if (launched && Math.random() < dt * 25) Sfx.click();
  if (f.t > 0.9 && !f.bannerShown) { f.bannerShown = true; Sfx.buildDone(); }
  if (!alive) { G.facade = null; banner('19:30 UUR', 'Bouw vallen door het hele huis!', 2.6, '#ffd84a'); }
}

function drawFacadeCells() {
  const f = G.facade;
  if (!f) return;
  for (const c of f.cells) {
    const a = f.t < c.delay ? 1 : 1 - clamp((c.age - 0.8) / 0.6, 0, 1);
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(c.x, c.y); ctx.rotate(c.rot);
    ctx.drawImage(facadeCanvas, c.sx - FAC.x0, c.sy - FAC.top, c.w, c.h, -c.w / 2, -c.h / 2, c.w, c.h);
    if (f.t >= c.delay) {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-c.w / 2, c.h / 2 - 3, c.w, 3);
      for (let i = 0; i < Math.floor(c.w / 32); i++) Draw.topStud(ctx, -c.w / 2 + 11 + i * 32, -c.h / 2, 10, '#a8352c');
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------
// Tekenen: dynamische onderdelen
function drawTrap(t) {
  const y = AREAS[t.area].y;
  const x = t.x;
  if (t.state === 'pile') {
    // Stuiterende stapel stenen – klassiek!
    const bounce = Math.abs(Math.sin(G.time * 4 + x)) * 4;
    const cols = ['#e33', '#fc0', '#28f', '#2a2', '#fff'];
    for (let i = 0; i < 5; i++) {
      const bx = x - 22 + (i % 3) * 15, by = y - 8 - Math.floor(i / 3) * 8 - (i % 2 ? bounce : bounce * 0.5);
      Draw.brick(ctx, bx, by, 14, 8, cols[i], { studW: 5, pitch: 7 });
    }
    if (t.progress > 0) {
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 25, y - 50, 50, 7);
      ctx.fillStyle = '#9fe870'; ctx.fillRect(x - 24, y - 49, 48 * t.progress, 5);
    }
    // glinstertje
    if (Math.sin(G.time * 3 + x) > 0.9) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 10, y - 26, 3, 3); }
    return;
  }
  const fired = t.state === 'fired';
  ctx.save();
  if (fired) ctx.globalAlpha = Math.min(1, t.timer / 1.5);
  switch (t.type) {
    case 'ice':
      ctx.fillStyle = 'rgba(180,230,255,.85)'; Draw.rr(ctx, x - 34, y - 5, 68, 6, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 20 + Math.sin(G.time * 2) * 10, y - 4, 8, 2);
      break;
    case 'cars':
      for (let i = 0; i < 5; i++) {
        const cx = x - 26 + i * 13, col = ['#e33', '#28f', '#fc0', '#2a2', '#f80'][i];
        ctx.fillStyle = col; ctx.fillRect(cx, y - 7, 10, 5);
        ctx.fillStyle = '#222'; ctx.fillRect(cx + 1, y - 2, 3, 2); ctx.fillRect(cx + 6, y - 2, 3, 2);
      }
      break;
    case 'ornaments':
      for (let i = 0; i < 6; i++) {
        const cx = x - 25 + i * 10;
        ctx.fillStyle = ['#e33', '#fc0', '#3af', '#e3e', '#2c2', '#f80'][i];
        ctx.beginPath(); ctx.arc(cx, y - 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(cx - 2, y - 8, 2, 2);
      }
      break;
    case 'nail':
      ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y - 18); ctx.lineTo(x + 3, y); ctx.fill();
      ctx.fillStyle = '#888'; ctx.fillRect(x - 7, y - 2, 14, 2);
      break;
    case 'knob': {
      const glow = 0.5 + Math.sin(G.time * 6) * 0.3;
      ctx.fillStyle = `rgba(255,${80 + glow * 80},0,${fired ? 0.3 : 0.9})`;
      ctx.beginPath(); ctx.arc(392, y - 42, 7 + glow * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#555'; ctx.fillRect(x - 10, y - 10, 20, 10);
      ctx.fillStyle = '#e33'; ctx.fillRect(x - 6, y - 16, 12, 6);
      break;
    }
    case 'torch':
      ctx.fillStyle = '#c33'; ctx.fillRect(x - 6, y - 150, 12, 22);
      ctx.fillStyle = '#888'; ctx.fillRect(x - 3, y - 128, 6, 14);
      if (!fired && Math.sin(G.time * 20) > -0.3) {
        ctx.fillStyle = '#48f'; ctx.beginPath(); ctx.moveTo(x - 4, y - 114); ctx.lineTo(x, y - 100 + Math.sin(G.time * 30) * 3); ctx.lineTo(x + 4, y - 114); ctx.fill();
      }
      break;
    case 'iron': {
      const ceil = CEIL[t.area];
      const drop = fired ? Math.min(1, (5 - t.timer) * 3) : 0;
      const iy = lerp(ceil + 60, y - 14, drop);
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, ceil + 30); ctx.lineTo(x, iy); ctx.stroke();
      ctx.fillStyle = '#9aa'; ctx.beginPath(); ctx.moveTo(x - 16, iy + 14); ctx.lineTo(x + 16, iy + 14); ctx.lineTo(x + 10, iy); ctx.lineTo(x - 10, iy); ctx.fill();
      ctx.fillStyle = '#333'; ctx.fillRect(x - 8, iy - 6, 16, 6);
      break;
    }
    case 'paint': {
      const ceil = CEIL[t.area];
      const sw = fired ? Math.sin(t.anim * 6) * 0.9 * Math.min(1, t.timer / 4) : Math.sin(G.time * 1.5) * 0.08;
      const px = x + Math.sin(sw) * 110, py = ceil + 10 + Math.cos(sw) * 110;
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, ceil + 10); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#ccc'; ctx.fillRect(px - 11, py, 22, 26);
      ctx.fillStyle = t.id === 'verf1' ? '#e33' : '#28f'; ctx.fillRect(px - 11, py + 6, 22, 12);
      break;
    }
    case 'feathers':
      ctx.fillStyle = '#ddd'; ctx.fillRect(x + 20, y - 40, 6, 40);
      ctx.save(); ctx.translate(x + 23, y - 45); ctx.rotate(G.time * 15);
      ctx.fillStyle = '#9ab'; for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.fillRect(0, -3, 16, 6); }
      ctx.restore();
      ctx.fillStyle = '#6b4a1a'; ctx.fillRect(x - 25, y - 3, 40, 3);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x - 20 + i * 8, y - 6, 5, 2, i, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'spider':
      if (!fired) drawSpider(x, y - 4 - Math.abs(Math.sin(G.time * 3)) * 2, 1);
      break;
  }
  ctx.restore();
}

function drawSpider(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(d * (8 + i * 3), -10 + i * 2); ctx.lineTo(d * (11 + i * 3), 0); ctx.stroke();
  }
  ctx.fillStyle = '#3a2412'; ctx.beginPath(); ctx.ellipse(0, -5, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f33'; ctx.fillRect(-3, -7, 2, 2); ctx.fillRect(1, -7, 2, 2);
  ctx.restore();
}

function drawBreakable(b) {
  if (b.broken) return;
  const x = b.x, y = AREAS[b.area].y;
  switch (b.type) {
    case 'gift': {
      const col = x % 3 ? '#d33' : '#2a8';
      Draw.brick(ctx, x - 14, y - 24, 28, 24, col, { studW: 7, pitch: 14 });
      ctx.fillStyle = '#fc0'; ctx.fillRect(x - 2, y - 24, 4, 24); ctx.fillRect(x - 14, y - 14, 28, 4);
      break;
    }
    case 'lamp':
      ctx.fillStyle = '#6b3f1f'; ctx.fillRect(x - 3, y - 70, 6, 70); ctx.fillRect(x - 12, y - 4, 24, 4);
      ctx.fillStyle = '#f6e3a1'; ctx.beginPath(); ctx.moveTo(x - 18, y - 70); ctx.lineTo(x + 18, y - 70); ctx.lineTo(x + 11, y - 95); ctx.lineTo(x - 11, y - 95); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,180,.15)'; ctx.beginPath(); ctx.arc(x, y - 80, 45, 0, Math.PI * 2); ctx.fill();
      break;
    case 'vase':
      ctx.fillStyle = '#39c'; ctx.beginPath(); ctx.ellipse(x, y - 16, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 6, y - 38, 12, 10);
      ctx.fillStyle = '#e33'; ctx.beginPath(); ctx.arc(x - 5, y - 42, 5, 0, Math.PI * 2); ctx.arc(x + 6, y - 44, 5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'plant':
      Draw.brick(ctx, x - 12, y - 20, 24, 20, '#b0602a', { studs: false });
      ctx.fillStyle = '#2a8a3a';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x - 12 + i * 6, y - 32 - (i % 2) * 8, 5, 14, -0.6 + i * 0.3, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'milk':
      Draw.brick(ctx, x - 9, y - 30, 18, 30, '#fff', { studs: false });
      ctx.fillStyle = '#39f'; ctx.fillRect(x - 9, y - 18, 18, 8);
      break;
    case 'pizza':
      Draw.brick(ctx, x - 22, y - 8, 44, 8, '#e0c79a', { studW: 7, pitch: 11 });
      ctx.fillStyle = '#c33'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText("LIL' NERO'S", x, y - 2);
      break;
    case 'trash':
      Draw.brick(ctx, x - 13, y - 34, 26, 34, '#7a7f86', { studs: false });
      ctx.fillStyle = '#5a5f66'; ctx.fillRect(x - 15, y - 38, 30, 5);
      break;
    case 'suitcase':
      Draw.brick(ctx, x - 22, y - 28, 44, 28, '#8a5a33', { studs: false });
      ctx.fillStyle = '#4a2a14'; ctx.fillRect(x - 6, y - 33, 12, 5);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 12, y - 20, 12, 8);
      break;
    case 'toybox':
      Draw.brick(ctx, x - 20, y - 26, 40, 26, '#e33', { studW: 8, pitch: 13 });
      ctx.fillStyle = '#fc0'; ctx.fillRect(x - 20, y - 16, 40, 4);
      break;
    case 'box': case 'basket':
      Draw.brick(ctx, x - 18, y - 30, 36, 30, b.type === 'box' ? '#b8854f' : '#d8c08a', { studs: false });
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.moveTo(x - 18, y - 22); ctx.lineTo(x + 18, y - 22); ctx.stroke();
      break;
    case 'paintcans':
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ccc'; ctx.fillRect(x - 20 + i * 14, y - 20, 12, 20); ctx.fillStyle = ['#e33', '#28f', '#fc0'][i]; ctx.fillRect(x - 20 + i * 14, y - 14, 12, 7); }
      break;
    case 'snowman':
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y - 16, 17, 0, Math.PI * 2); ctx.arc(x, y - 44, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.fillRect(x - 10, y - 62, 20, 4); ctx.fillRect(x - 7, y - 74, 14, 12);
      ctx.fillRect(x - 5, y - 48, 3, 3); ctx.fillRect(x + 2, y - 48, 3, 3);
      ctx.fillStyle = '#f80'; ctx.beginPath(); ctx.moveTo(x, y - 44); ctx.lineTo(x + 12, y - 42); ctx.lineTo(x, y - 40); ctx.fill();
      break;
  }
}

function drawDynamicDecor() {
  const t = G.time;
  // Kerstboom met knipperlichtjes
  const tx = 640, ty = 480;
  ctx.fillStyle = '#5a3418'; ctx.fillRect(tx - 8, ty - 20, 16, 20);
  for (let i = 0; i < 5; i++) {
    const w = 110 - i * 20, y = ty - 20 - i * 32;
    Draw.brick(ctx, tx - w / 2, y - 30, w, 30, i % 2 ? '#1f6e32' : '#237a38', { studW: 8, pitch: 14 });
  }
  for (let i = 0; i < 18; i++) {
    const on = Math.sin(t * 3 + i * 1.7) > 0;
    const row = i % 5, w = 110 - row * 20;
    const lx = tx - w / 2 + 8 + ((i * 37) % (w - 16)), ly = ty - 35 - row * 32;
    ctx.fillStyle = on ? ['#ff4a4a', '#ffd84a', '#4ab8ff', '#ff7ae0'][i % 4] : '#333';
    ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ffd84a';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(tx + Math.cos(a) * r, ty - 195 + Math.sin(a) * r); }
  ctx.fill();

  // Haardvuur
  for (let i = 0; i < 5; i++) {
    const h = 20 + Math.sin(t * 9 + i * 2) * 8;
    ctx.fillStyle = i % 2 ? '#ff9d2a' : '#ffd84a';
    ctx.beginPath(); ctx.moveTo(806 + i * 11, 480); ctx.lineTo(812 + i * 11, 480 - h); ctx.lineTo(818 + i * 11, 480); ctx.fill();
  }

  // TV
  const tvx = TV_X;
  Draw.brick(ctx, tvx - 40, 400, 80, 60, '#4a3a2a', { studW: 8 });
  Draw.brick(ctx, tvx - 30, 460, 60, 20, '#3a2a1a', { studs: false });
  ctx.fillStyle = G.tvT > 0 ? (Math.sin(t * 40) > 0 ? '#eee' : '#666') : '#18222a';
  ctx.fillRect(tvx - 32, 408, 52, 44);
  if (G.tvT > 0) {
    ctx.fillStyle = '#222'; ctx.fillRect(tvx - 16, 422, 8, 26); ctx.beginPath(); ctx.arc(tvx - 12, 418, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff0'; ctx.fillRect(tvx - 6, 430, 8, 2);
  } else {
    ctx.fillStyle = 'rgba(120,180,255,.15)'; ctx.fillRect(tvx - 28, 410, 20, 10);
  }
  ctx.fillStyle = '#c9a44c'; ctx.beginPath(); ctx.arc(tvx + 30, 420, 3, 0, Math.PI * 2); ctx.arc(tvx + 30, 432, 3, 0, Math.PI * 2); ctx.fill();

  // Verwarmingsketel met eng gezicht
  const flick = 0.6 + Math.sin(t * 13) * 0.2 + Math.sin(t * 7) * 0.2;
  ctx.fillStyle = `rgba(255,${120 + flick * 60},20,${0.6 + flick * 0.4})`;
  ctx.fillRect(660, 616, 70, 38);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.moveTo(665, 616); ctx.lineTo(690, 628); ctx.lineTo(665, 632); ctx.fill();
  ctx.beginPath(); ctx.moveTo(725, 616); ctx.lineTo(700, 628); ctx.lineTo(725, 632); ctx.fill();
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(668 + i * 10, 654); ctx.lineTo(673 + i * 10, 642); ctx.lineTo(678 + i * 10, 654); ctx.fill(); }
  const kv = G.kevin;
  if (kv.area === 'B' && Math.abs(kv.x - 695) < 160 && Math.sin(t * 1.3) > 0.7) {
    Draw.comic(ctx, 'grrrrr…', 695, 540, 16, '#ff8a3a');
  }

  // Schoorsteenrook
  for (let i = 0; i < 6; i++) {
    const u = ((t * 0.3 + i / 6) % 1);
    ctx.fillStyle = `rgba(200,200,210,${0.35 * (1 - u)})`;
    ctx.beginPath(); ctx.arc(2104 + Math.sin(u * 6 + i) * 12, -10 - u * 60 + 30, 8 + u * 14, 0, Math.PI * 2); ctx.fill();
  }

  // Kartonnen Michael Jordan-bordfiguur op het treintje (in de eetkamer)
  const mjx = 1180 + ((t * 40) % 600);
  ctx.fillStyle = '#333'; ctx.fillRect(1160, 476, 640, 3);
  Draw.brick(ctx, mjx - 16, 462, 32, 14, '#c33', { studW: 6, pitch: 10 });
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(mjx - 8, 477, 4, 0, Math.PI * 2); ctx.arc(mjx + 8, 477, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a26b'; ctx.fillRect(mjx - 9, 395, 18, 67);
  ctx.fillStyle = '#e33'; ctx.fillRect(mjx - 9, 412, 18, 24);
  ctx.fillStyle = '#fff'; ctx.font = '9px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('23', mjx, 426);
  ctx.fillStyle = '#6b4a2a'; ctx.beginPath(); ctx.arc(mjx, 402, 7, 0, Math.PI * 2); ctx.fill();
}

function drawPickup(p) {
  if (p.taken) return;
  const y = AREAS[p.area].y - 50 + Math.sin(G.time * 3) * 4;
  ctx.save(); ctx.translate(p.x, y);
  ctx.fillStyle = 'rgba(255,255,160,.25)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6b3f1f'; ctx.fillRect(-22, -2, 16, 7);
  ctx.fillStyle = '#333'; ctx.fillRect(-8, -3, 30, 4);
  ctx.fillStyle = '#555'; ctx.fillRect(-4, 1, 4, 7);
  ctx.restore();
}

function kevinPose(k) {
  const f = {
    ...Looks.kevin, x: posX(k), y: floorY(k) - k.jy, dir: k.dir, walk: k.walk,
    expr: 'smile',
  };
  if (k.state === 'sled') {
    f.walk = 0; f.armL = 2.7; f.armR = 2.7; f.expr = 'scream'; f.y -= 8;
    if (k.stair) { const s = k.stair; f.rot = -Math.atan2(AREAS[s.low].y - AREAS[s.high].y, s.hx - s.lx); }
    return f;
  }
  if (k.screamT > 0) {
    // Handen tegen de wangen – dé klassieke pose
    f.expr = 'scream'; f.armL = 2.6; f.armR = 2.6;
    f.dir = 1;
  } else if (k.buildId) {
    f.expr = 'smirk'; f.armL = 1.2 + Math.sin(G.time * 20) * 0.6; f.armR = 1.2 + Math.cos(G.time * 20) * 0.6;
  } else if (k.jy > 0) {
    f.armL = 2.4; f.armR = 2.4; f.expr = 'ooh';
  } else if (k.idle > 7) {
    f.expr = 'smirk'; f.armL = 0.2; f.armR = 0.2 + Math.abs(Math.sin(G.time * 3)) * 1.8;
  }
  if (G.hasGun && k.shootCd > 0.4) { f.armR = 1.57; f.armL = 1.57; }
  if (G.hasGun) {
    f.holding = (c) => { c.fillStyle = '#6b3f1f'; c.fillRect(-3, 14, 6, 8); c.fillStyle = '#333'; c.fillRect(-2, 20, 4, 18); };
  }
  if (k.invuln > 0 && Math.sin(G.time * 30) > 0) f.alpha = 0.4;
  return f;
}

function banditPose(b) {
  const f = { ...b.look, x: posX(b), y: floorY(b) - b.jy, dir: b.dir, walk: b.walk, expr: 'grr' };
  const sc = b.look.scale || 1;
  f.scale = sc;
  if (b.state === 'waiting') return null;
  if (b.state === 'stunned' || b.state === 'laugh') {
    f.expr = b.state === 'laugh' ? 'smile' : 'dizzy';
    if (b.state === 'laugh') { f.armL = 0.8 + Math.sin(G.time * 20) * 0.3; f.armR = f.armL; }
  }
  if (b.state === 'flee') { f.expr = 'scream'; f.armL = 2.8; f.armR = 2.8; }
  if (b.state === 'defeated' || b.state === 'arrested') {
    f.expr = 'dizzy'; f.armL = 0.3; f.armR = 0.3; f.flat = 0.25;
    if (b.state === 'arrested') { f.armL = -0.5; f.armR = -0.5; }
  }
  if (b.state === 'gag') {
    const u = b.gagT;
    switch (b.gag) {
      case 'ice': case 'cars': {
        const d = b.slipDir || b.dir;
        const k = Math.min(1, u / 0.35);
        f.rot = -d * k * Math.PI / 2 * 1.05; f.rotPivot = 0;
        f.y -= Math.sin(k * Math.PI) * 40;
        f.expr = u > 0.4 ? 'dizzy' : 'scream'; f.armL = 2.5; f.armR = 2.5; f.walk = u * 30;
        break;
      }
      case 'ornaments':
        f.y -= Math.abs(Math.sin(u * 10)) * 26; f.expr = 'scream'; f.walk = 0.6 * Math.sign(Math.sin(u * 10)); f.armL = 2 + Math.sin(u * 20) * 0.5; f.armR = 2.4;
        break;
      case 'nail':
        f.expr = 'scream'; f.armL = 3; f.armR = 3;
        if (b.hitCeil) { f.expr = 'dizzy'; f.flat = 0.15; }
        break;
      case 'knob':
        f.expr = 'scream'; f.armR = 2.2 + Math.sin(u * 25) * 0.6; f.armL = 0.5 + Math.sin(u * 25) * 0.5;
        f.handColor = '#ff5533';
        break;
      case 'torch':
        f.expr = 'scream'; f.armL = 2.9; f.armR = 2.9;
        f.overlay = (c, hy) => {
          for (let i = 0; i < 5; i++) {
            const h = 18 + Math.sin(G.time * 20 + i * 2) * 8;
            c.fillStyle = i % 2 ? '#ff7a1a' : '#ffd84a';
            c.beginPath(); c.moveTo(-12 + i * 6, hy - 2); c.lineTo(-9 + i * 6, hy - 2 - h); c.lineTo(-6 + i * 6, hy - 2); c.fill();
          }
        };
        f.hair = (c) => { c.fillStyle = '#111'; c.fillRect(-11, -2, 22, 5); };
        break;
      case 'iron': case 'paint': {
        const k = Math.min(1, u / 0.25);
        f.rot = -b.dir * k * Math.PI / 2; f.expr = 'dizzy'; f.armL = 1.5; f.armR = 1.5;
        if (b.gag === 'iron') f.overlay = (c, hy) => { c.fillStyle = 'rgba(160,170,180,.8)'; c.beginPath(); c.moveTo(-8, hy + 6); c.lineTo(8, hy + 6); c.lineTo(5, hy + 16); c.lineTo(-5, hy + 16); c.fill(); };
        if (b.gag === 'paint') f.overlay = (c, hy) => { c.fillStyle = '#e33'; c.fillRect(-10, hy + 4, 20, 6); };
        break;
      }
      case 'feathers':
        f.torsoColor = '#f4f4f4'; f.armColor = '#f4f4f4'; f.legColor = '#f4f4f4'; f.hipColor = '#eee';
        f.torsoPrint = (c) => { c.fillStyle = '#ddd'; for (let i = 0; i < 6; i++) c.fillRect(-8 + (i % 3) * 6, 4 + (i / 3 | 0) * 8, 4, 4); };
        f.armL = 1.3 + Math.sin(u * 22) * 0.9; f.armR = f.armL; f.expr = 'ooh';
        f.y -= Math.abs(Math.sin(u * 8)) * 8;
        f.overlay = (c, hy) => { c.fillStyle = '#e33'; c.fillRect(-3, hy - 8, 6, 5); c.fillStyle = '#f80'; c.fillRect(b.dir * 9, hy + 11, b.dir * 6, 3); };
        break;
      case 'spider':
        f.expr = 'scream'; f.armL = 2.6 + Math.sin(u * 30) * 0.4; f.armR = 2.6 - Math.sin(u * 30) * 0.4;
        f.x += Math.sin(u * 50) * 3;
        break;
    }
  }
  return f;
}

function drawCharacter(e, pose, shortLegs) {
  if (e.state === 'broken' || e.state === 'reform') { drawPieces(e); return; }
  if (!pose) return;
  // schaduw
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(posX(e), floorY(e), 18, 4, 0, 0, Math.PI * 2); ctx.fill();
  if (e === G.kevin && e.state === 'sled') {
    ctx.save(); ctx.translate(pose.x, pose.y + 8); ctx.rotate(pose.rot || 0);
    Draw.brick(ctx, -26, -10, 52, 8, '#d01012', { studW: 6, pitch: 10 });
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(24, 0); ctx.quadraticCurveTo(34, 0, 32, -10); ctx.stroke();
    ctx.restore();
  }
  Draw.minifig(ctx, pose);
  if (e.name && e.state === 'gag' && e.gag === 'spider') drawSpider(pose.x + e.dir * 3, pose.y - 60 * (pose.scale || 1), 1.1);
  const stunned = e.state === 'stunned' || e.state === 'defeated' || (e.state === 'gag' && e.gagT > 0.5 && ['ice', 'cars', 'iron', 'paint'].includes(e.gag));
  if (stunned) {
    for (let i = 0; i < 3; i++) {
      const a = G.time * 4 + i * 2.1;
      const sx = pose.x + Math.cos(a) * 18 + (pose.rot ? -e.dir * 40 : 0);
      const sy = (pose.rot ? floorY(e) - 20 : pose.y - 88) + Math.sin(a) * 5;
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath();
      for (let j = 0; j < 10; j++) { const r = j % 2 ? 2.5 : 6, aa = j * Math.PI / 5; ctx.lineTo(sx + Math.cos(aa) * r, sy + Math.sin(aa) * r); }
      ctx.fill();
    }
  }
}

function drawCops() {
  for (const c of G.cops) {
    const b = c.target;
    const tx = posX(b) - 34 * (b.dir || 1);
    const u = Math.min(1, c.t / 1.2);
    const x = lerp(c.x - 200 * (b.dir || 1), tx, u);
    if (u >= 1 && b.state === 'defeated') { b.state = 'arrested'; popup('Gearresteerd!', posX(b), floorY(b) - 110, 24, '#6fb6ff'); }
    Draw.minifig(ctx, { ...Looks.cop, x, y: floorY(b), dir: (b.dir || 1), walk: u < 1 ? c.t * 14 : 0, expr: 'smirk', armR: u >= 1 ? 1.4 : null });
  }
}

// ---------------------------------------------------------------------
// HUD
function drawHUD() {
  const k = G.kevin;
  // Noppenteller
  ctx.fillStyle = 'rgba(0,0,0,.45)'; Draw.rr(ctx, 16, 14, 250, 74, 14); ctx.fill();
  Draw.stud(ctx, 46, 42, 16, '#cfd6de', Math.cos(G.time * 3));
  Draw.comic(ctx, Math.round(G.shownStuds).toLocaleString('nl-NL'), 72, 43, 30, '#fff', '#222', 'left');
  // Echte-Kevin-meter
  const p = Math.min(1, G.studs / TRUE_KEVIN);
  ctx.fillStyle = '#222'; Draw.rr(ctx, 30, 66, 220, 12, 6); ctx.fill();
  const grd = ctx.createLinearGradient(30, 0, 250, 0); grd.addColorStop(0, '#f2c230'); grd.addColorStop(1, '#ffe98a');
  ctx.fillStyle = grd; Draw.rr(ctx, 31, 67, 218 * p, 10, 5); ctx.fill();
  ctx.font = '11px "Luckiest Guy", sans-serif'; ctx.fillStyle = p >= 1 ? '#222' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(p >= 1 ? 'ECHTE KEVIN!' : 'ECHTE KEVIN', 140, 73);

  // Midden: klok of bandieten
  if (phase === 'prep') {
    const mins = 19 * 60 + 30 + (1 - G.prepLeft / PREP_TIME) * 90;
    const hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; Draw.rr(ctx, W / 2 - 170, 12, 340, 70, 14); ctx.fill();
    Draw.comic(ctx, `${hh}:${String(mm).padStart(2, '0')}`, W / 2, 38, 32, G.prepLeft < 15 ? '#ff6b5b' : '#ffd84a');
    ctx.font = '14px "Luckiest Guy", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('Bouw vallen! Om 21:00 komen de bandieten  ·  [ENTER] = nu al beginnen', W / 2, 66);
  } else {
    G.bandits.forEach((b, i) => {
      const x = W / 2 - 200 + i * 220, y = 14;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; Draw.rr(ctx, x, y, 200, 62, 12); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(x + 4, y + 4, 54, 54); ctx.clip();
      Draw.minifig(ctx, { ...b.look, x: x + 31, y: y + 104, dir: 1, scale: 1.1, expr: b.pride <= 0 ? 'dizzy' : 'grr' });
      ctx.restore();
      Draw.comic(ctx, b.name === 'harry' ? 'HARRY' : 'MARV', x + 64, y + 18, 18, '#fff', '#222', 'left');
      for (let h = 0; h < MAX_PRIDE; h++) Draw.heart(ctx, x + 72 + h * 21, y + 44, 18, h < b.pride ? '#e8333a' : '#555');
    });
  }

  // Rechts: vallen, geweer, gil
  const armed = G.traps.filter(t => t.state === 'armed').length;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; Draw.rr(ctx, W - 250, 14, 234, 74, 14); ctx.fill();
  Draw.comic(ctx, `VALLEN ${armed}/${G.traps.length}`, W - 236, 36, 20, '#9fe870', '#222', 'left');
  ctx.font = '13px "Luckiest Guy", sans-serif'; ctx.textAlign = 'left';
  ctx.fillStyle = k.screamCd > 0 ? '#999' : '#ffd84a';
  ctx.fillText(k.screamCd > 0 ? `GIL [Q] ${Math.ceil(k.screamCd)}s` : 'GIL [Q] KLAAR', W - 236, 62);
  ctx.fillStyle = G.hasGun ? '#9fe870' : '#777';
  ctx.fillText(G.hasGun ? 'BB-GEWEER [F]' : 'BB-GEWEER: ?', W - 120, 62);
  ctx.fillStyle = G.tvCd > 0 ? '#999' : '#6fb6ff';
  ctx.fillText(G.tvCd > 0 ? `TV ${Math.ceil(G.tvCd)}s` : 'TV KLAAR', W - 236, 80);

  // Minikaart
  drawMinimap();

  // Contextprompt
  const prompt = contextPrompt(k);
  if (prompt) {
    ctx.font = '18px "Luckiest Guy", sans-serif';
    const w = ctx.measureText(prompt).width + 40;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; Draw.rr(ctx, W / 2 - w / 2, H - 58, w, 40, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(prompt, W / 2, H - 37);
  }

  // Groot bericht
  if (G.banner) {
    const b = G.banner;
    const inT = Math.min(1, b.t / 0.25), outT = Math.min(1, (b.dur - b.t) / 0.3);
    const s = inT < 1 ? 0.5 + inT * 0.6 : 1.1 - Math.min(0.1, (b.t - 0.25) * 0.4);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, outT));
    ctx.translate(W / 2, H / 2 - 80); ctx.scale(s, s);
    Draw.comic(ctx, b.text, 0, 0, 64, b.color, '#1a1a1a');
    if (b.sub) { ctx.font = '22px "Luckiest Guy", sans-serif'; Draw.comic(ctx, b.sub, 0, 52, 22, '#fff', '#1a1a1a'); }
    ctx.restore();
  }

  if (phase === 'win') {
    const a = Math.sin(G.time * 10) > 0;
    ctx.fillStyle = a ? 'rgba(255,40,40,.12)' : 'rgba(40,80,255,.12)';
    ctx.fillRect(0, 0, W, H);
  }
}

function contextPrompt(k) {
  if (k.state !== 'play' || phase === 'win') return null;
  const pile = nearestTrapPile(k);
  if (pile) return `Houd [E] ingedrukt: bouw ${pile.name}`;
  const pu = nearPickup(k);
  if (pu) return "[E] Pak Buzz' BB-geweer";
  if (nearSled(k)) return '[E] Met de slee de trap af!';
  if (nearTV(k)) return G.tvCd > 0 ? 'TV laadt op…' : "[E] Zet 'Engelen met Smerige Zielen' aan";
  const b = nearestBreakable(k);
  if (b) return '[F] Mep het kapot voor noppen';
  const se = nearStairEnd(k);
  if (se) return se.up ? '[↑] Trap op' : '[↓] Trap af';
  return null;
}

function drawMinimap() {
  const mx = 12, my = H - 80, mw = 190, mh = 68;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; Draw.rr(ctx, mx, my, mw, mh, 10); ctx.fill();
  const sx = (mw - 16) / WORLD_W, sy = (mh - 12) / 620;
  const X = x => mx + 8 + x * sx, Y = y => my + 6 + (y - 90) * sy;
  ctx.fillStyle = '#6b6f78';
  for (const a of Object.values(AREAS)) ctx.fillRect(X(a.x0), Y(a.y), (a.x1 - a.x0) * sx, 2);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  for (const s of STAIRS) { ctx.beginPath(); ctx.moveTo(X(s.lx), Y(AREAS[s.low].y)); ctx.lineTo(X(s.hx), Y(AREAS[s.high].y)); ctx.stroke(); }
  for (const t of G.traps) {
    ctx.fillStyle = t.state === 'armed' ? '#9fe870' : t.state === 'pile' ? '#ffd84a' : '#555';
    ctx.fillRect(X(t.x) - 1.5, Y(AREAS[t.area].y) - 4, 3, 3);
  }
  for (const b of G.bandits) {
    if (b.state === 'waiting') continue;
    ctx.fillStyle = b.pride > 0 ? '#ff4a4a' : '#888';
    ctx.beginPath(); ctx.arc(X(posX(b)), Y(floorY(b)) - 4, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(X(posX(G.kevin)), Y(floorY(G.kevin)) - 4, 4.5, 0, Math.PI * 2); ctx.fill();
}

// ---------------------------------------------------------------------
// Render
function render() {
  ctx.save();
  let sx = 0, sy = 0;
  if (G.shake > 0) { sx = rand(-6, 6) * G.shake * 2; sy = rand(-6, 6) * G.shake * 2; }
  const cam = Math.round(G.cam);
  ctx.translate(-cam + sx, sy);
  ctx.drawImage(bgCanvas, cam, 0, W, H, cam, 0, W, H);

  drawDynamicDecor();
  for (const b of G.breakables) if (b.x > cam - 100 && b.x < cam + W + 100) drawBreakable(b);
  for (const t of G.traps) if (t.x > cam - 200 && t.x < cam + W + 200) drawTrap(t);
  for (const p of G.pickups) drawPickup(p);

  // Noppen
  for (const s of G.studList) {
    if (s.x < cam - 30 || s.x > cam + W + 30) continue;
    const blink = !s.fixed && s.life < 2 && Math.sin(G.time * 30) > 0;
    if (!blink) Draw.stud(ctx, s.x, s.y + (s.fixed ? Math.sin(G.time * 3 + s.x) * 3 : 0), s.value >= 1000 ? 12 : 9, STUD_VAL[s.value], Math.cos(s.spin));
  }

  // Personages
  for (const b of G.bandits) drawCharacter(b, banditPose(b), false);
  drawCharacter(G.kevin, kevinPose(G.kevin), true);
  if (phase === 'win') drawCops();

  // Kogeltjes
  ctx.fillStyle = '#ffe066';
  for (const p of G.pellets) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); }

  // Effecten
  for (const f of G.fx) {
    const a = Math.min(1, f.life / (f.max * 0.4));
    ctx.globalAlpha = a;
    if (f.kind === 'brick') {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      Draw.brick(ctx, -f.w / 2, -f.h / 2, f.w, f.h, f.color, { studW: 5, pitch: 8 });
      ctx.restore();
    } else if (f.kind === 'smoke') {
      ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (2 - f.life), 0, Math.PI * 2); ctx.fill();
    } else if (f.kind === 'feather') {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawFacadeCells();

  // Tekstwolkjes
  for (const p of G.popups) {
    ctx.globalAlpha = Math.min(1, p.life / 0.4);
    const s = 1 + Math.max(0, (p.max - p.life - 0.0) < 0.15 ? (0.15 - (p.max - p.life)) * 3 : 0);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    Draw.comic(ctx, p.text, 0, 0, p.size, p.color, '#1a1a1a');
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Sneeuw (schermruimte, parallax)
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (const f of snow) {
    const x = ((f.x - G.cam * f.z) % W + W) % W;
    ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
  }

  drawHUD();
}

function updateSnow(dt) {
  for (const f of snow) {
    f.y += f.vy * dt; f.x += Math.sin(G ? G.time + f.y * 0.01 : 0) * 10 * dt;
    if (f.y > H) { f.y = -5; f.x = rand(0, W * 2); }
  }
}

// ---------------------------------------------------------------------
// Menu's en schermen
const $ = id => document.getElementById(id);
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.add('hidden');
  if (id) $(id).classList.remove('hidden');
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.add('hidden'), 6000);
}

function startIntro() {
  Sfx.init();
  newGame();
  phase = 'cutscene';
  showScreen(null);
  Music.play('menu');
  Intro.start(() => { phase = 'intro'; showScreen('intro'); });
}

function startPrep() {
  showScreen(null);
  phase = 'prep';
  startFacadeReveal();
  Music.play('prep');
}

function showWin() {
  const s = G.stats;
  const golds = [
    ['Het huis verdedigd', true],
    ['Echte Kevin (' + TRUE_KEVIN.toLocaleString('nl-NL') + ' noppen)', G.studs >= TRUE_KEVIN],
    ['Nooit gepakt', G.catches === 0],
    ['Alle 12 vallen gebouwd vóór 21:00', s.builtInPrep >= 12],
  ];
  const got = golds.filter(g => g[1]).length;
  $('winStats').innerHTML = `
    <div class="stat"><span>Noppen</span><b>${G.studs.toLocaleString('nl-NL')}</b></div>
    <div class="stat"><span>Tijd tegen de bandieten</span><b>${Math.floor(G.attackTime / 60)}:${String(Math.floor(G.attackTime % 60)).padStart(2, '0')}</b></div>
    <div class="stat"><span>Keer gepakt</span><b>${G.catches}</b></div>
    <div class="stat"><span>Vallen gebouwd</span><b>${s.traps}</b></div>
    <div class="stat"><span>Spullen gesloopt</span><b>${s.smashed}</b></div>
    <h3>Gouden stenen: ${got}/4</h3>
    <ul class="golds">${golds.map(([n, ok]) => `<li class="${ok ? 'ok' : ''}"><i></i>${n}</li>`).join('')}</ul>`;
  showScreen('win');
  Sfx.fanfare();
}

function togglePause() {
  if (phase === 'prep' || phase === 'attack') {
    G.pausedFrom = phase; phase = 'paused'; showScreen('pause');
    YTMusic.pause(); Synth.stop();
  } else if (phase === 'paused') {
    phase = G.pausedFrom; showScreen(null);
    Music.resume();
  }
}

function toggleMute() {
  const m = !Sfx.muted;
  Sfx.setMuted(m); YTMusic.setMuted(m);
  toast(m ? 'Geluid uit (M)' : 'Geluid aan (M)');
}

function setupUI() {
  $('btnPlay').onclick = startIntro;
  $('btnStart').onclick = startPrep;
  $('btnHelp').onclick = () => showScreen('help');
  $('btnSettings').onclick = () => showScreen('settings');
  for (const b of document.querySelectorAll('[data-back]')) b.onclick = () => showScreen(phase === 'paused' ? 'pause' : 'menu');
  $('btnResume').onclick = togglePause;
  $('btnQuit').onclick = () => { phase = 'menu'; showScreen('menu'); Music.play('menu', true); };
  $('btnPauseSettings').onclick = () => showScreen('settings');
  $('btnAgain').onclick = startIntro;
  $('btnMenu').onclick = () => { phase = 'menu'; showScreen('menu'); Music.play('menu', true); };

  // Muziekinstellingen
  const saved = (() => { try { return JSON.parse(localStorage.getItem('ha-music') || 'null'); } catch (e) { return null; } })();
  if (saved) { Music.mode = saved.mode || 'youtube'; Object.assign(Music.tracks, saved.tracks || {}); }
  for (const r of document.querySelectorAll('input[name=music]')) {
    r.checked = r.value === Music.mode;
    r.onchange = () => { Sfx.init(); Music.setMode(r.value); save(); };
  }
  for (const key of ['menu', 'prep', 'attack']) {
    const inp = $('yt-' + key);
    inp.value = Music.tracks[key];
    inp.onchange = () => { Music.tracks[key] = inp.value; if (key === 'menu') Music.tracks.win = inp.value; save(); if (Music.current === key) Music.play(key, true); };
  }
  $('btnResetTracks').onclick = () => {
    Object.assign(Music.tracks, DEFAULT_TRACKS);
    for (const key of ['menu', 'prep', 'attack']) $('yt-' + key).value = Music.tracks[key];
    save();
  };
  function save() { try { localStorage.setItem('ha-music', JSON.stringify({ mode: Music.mode, tracks: Music.tracks })); } catch (e) { /* privévenster */ } }
  $('radioToggle').onclick = () => $('radio').classList.toggle('mini');
  Music.toast = toast;

  // Eerste klik ergens = audio aan + menumuziek
  const firstGesture = () => {
    Sfx.init();
    if (phase === 'menu' && !Music.current) Music.play('menu');
    window.removeEventListener('pointerdown', firstGesture);
    window.removeEventListener('keydown', firstGesture);
  };
  window.addEventListener('pointerdown', firstGesture);
  canvas.addEventListener('pointerdown', () => { if (phase === 'cutscene') Intro.skip(); });
  window.addEventListener('keydown', firstGesture);
}

// ---------------------------------------------------------------------
// Lus
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTime) / 1000 || 0);
  lastTime = ts;

  if (phase === 'cutscene' && (pressed.enter || pressed.pause)) { Intro.skip(); pressed.enter = false; pressed.pause = false; }
  if (pressed.pause) togglePause();
  if (pressed.mute) toggleMute();
  if (pressed.enter && phase === 'intro') { startPrep(); pressed.enter = false; }
  else if (pressed.enter && phase === 'menu') startIntro();

  updateSnow(dt);
  if (phase === 'prep' || phase === 'attack' || phase === 'win') update(dt);
  if (phase === 'cutscene') { Intro.update(dt); Intro.render(ctx); }
  else if (phase === 'menu' || !G) renderTitleBackdrop(ts / 1000);
  else render();

  for (const k in pressed) pressed[k] = false;
  requestAnimationFrame(frame);
}

// Achtergrond achter het menu: langzaam pannen langs het huis
function renderTitleBackdrop(t) {
  // Het huis van de McCallisters in de sneeuw, van bouwstenen
  nightSky(ctx, false, t);
  neighbours(ctx, 600, true);
  snowGround(ctx, 600, false);
  drawIntroHouse(ctx, 640 + Math.sin(t * 0.15) * 30, 600, 0.78, { lit: true, lightsOn: true, t });
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (const f of snow) { const x = ((f.x - t * 20 * f.z) % W + W) % W; ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); }
}

function fitCanvas() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  const wrap = $('wrap');
  wrap.style.width = W * s + 'px';
  wrap.style.height = H * s + 'px';
  wrap.style.setProperty('--s', s);
}

function boot() {
  for (let i = 0; i < 90; i++) snow.push({ x: rand(0, W * 2), y: rand(0, H), vy: rand(30, 80), r: rand(1, 3), z: rand(0.2, 0.9) });
  buildBackground();
  buildFacade();
  setupUI();
  setupTouch();
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  showScreen('menu');
  requestAnimationFrame(frame);
  // Fonts kunnen later binnenkomen: achtergrond opnieuw tekenen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildBackground(); buildFacade(); });
}

boot();
