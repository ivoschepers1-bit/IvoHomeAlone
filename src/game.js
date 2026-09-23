// Gameplay: Kevin, de Natte Bandieten, vallen, noppen en de HUD.
import * as THREE from 'three';
import { C, mat, GEO, Minifig, brickMesh } from './lego.js';
import { WALLS, RAMP, L1, inRamp, rampY, roomOf, DOORS, SPOTS, TRAPS, BREAKABLES } from './world.js';

const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const rand = (a, b) => a + Math.random() * (b - a);
const $ = (id) => document.getElementById(id);

export const PREP_TIME = 150;
export const TRUE_KEVIN = 20000;
const MAX_PRIDE = 6;
const STUD_COLORS = { 10: C.silver, 100: C.gold, 1000: C.studBlue, 10000: C.purple };

const GAGS = {
  ice: { dur: 1.6, text: 'GLIBBER!', snd: 'slip' },
  cars: { dur: 1.6, text: 'WOEPS!', snd: 'slip' },
  ornaments: { dur: 1.9, text: 'AU AU AU!', snd: 'hurt' },
  nail: { dur: 1.9, text: 'AAAUW!', snd: 'boing' },
  knob: { dur: 1.9, text: 'HEET HEET!', snd: 'sizzle' },
  torch: { dur: 2.3, text: 'MIJN MUTS!', snd: 'sizzle' },
  iron: { dur: 1.7, text: 'KLONK!', snd: 'clang' },
  paint: { dur: 1.7, text: 'BONK!', snd: 'bonk' },
  feathers: { dur: 2.2, text: 'TOK TOK!', snd: 'chicken' },
  spider: { dur: 2.3, text: 'AAAAAAAH!', snd: 'marvScream' },
};
const TAUNTS = {
  harry: ['Kom maar hier, kleintje!', 'Ik heb een gouden tand. Jij straks ook!', 'We zijn de Natte Bandieten!', 'Waar zit je, snotaap?'],
  marv: ['Ik ga je pakken, jochie!', 'Harry, wacht op mij!', 'Zet de kraan maar open!', 'Hé, dit huis is een doolhof!'],
};

// ---------------------------------------------------------------------
// Beweging & botsing
function groundY(e) { return inRamp(e.x, e.z) ? rampY(e.z) : e.level * L1; }
function collide(e) {
  const r = e.r;
  for (let pass = 0; pass < 2; pass++) for (const w of WALLS) {
    if (!w.lv.includes(e.level)) continue;
    const cx = clamp(e.x, w.x0, w.x1), cz = clamp(e.z, w.z0, w.z1);
    const dx = e.x - cx, dz = e.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); e.x = cx + dx / d * r; e.z = cz + dz / d * r; }
    else {
      const l = e.x - w.x0, rr = w.x1 - e.x, t = e.z - w.z0, b = w.z1 - e.z, m = Math.min(l, rr, t, b);
      if (m === l) e.x = w.x0 - r; else if (m === rr) e.x = w.x1 + r; else if (m === t) e.z = w.z0 - r; else e.z = w.z1 + r;
    }
  }
}
function move(e, dx, dz) {
  e.x += dx; e.z += dz;
  collide(e);
  if (inRamp(e.x, e.z)) e.level = rampY(e.z) > 6.5 ? 1 : 0;
}

// ---------------------------------------------------------------------
export class Game {
  constructor(world, scene, camera) {
    this.W = world; this.scene = scene; this.camera = camera;
    this.root = new THREE.Group(); scene.add(this.root);
    this.popEl = $('popups');
    this.fx = []; this.pops = [];
  }

  lvl(level) { return level === 1 ? this.upRoot : this.root; }

  clear() {
    this.root.clear(); this.fx = [];
    for (const p of this.pops) p.el.remove();
    this.pops = [];
  }

  // ------------------------------------------------------------------
  reset() {
    this.root.clear();
    this.upRoot = new THREE.Group(); this.root.add(this.upRoot);
    for (const p of this.popEl.querySelectorAll('.pop')) p.remove();
    this.t = 0; this.phase = 'prep'; this.prepLeft = PREP_TIME; this.attackTime = 0;
    this.studs = 0; this.shownStuds = 0; this.catches = 0; this.trueKevin = false;
    this.stats = { traps: 0, builtInPrep: 0, smashed: 0 };
    this.fx = []; this.studList = []; this.pellets = []; this.pops = [];
    this.tvCd = 0; this.tvT = 0; this.hasGun = false; this.winT = 0; this.shake = 0;
    this.camTarget = new THREE.Vector3(); this.camPos = new THREE.Vector3();

    // Kevin
    const k = this.kevin = this.makeActor('kevin', SPOTS.kevinStart);
    Object.assign(k, { r: 0.9, state: 'play', invuln: 0, screamT: 0, screamCd: 0, shootCd: 0, vy: 0, jy: 0, yaw: 0, building: null, idle: 0 });

    // Bandieten
    this.bandits = [
      this.makeBandit('harry', SPOTS.harryStart, 0, 12.5),
      this.makeBandit('marv', SPOTS.marvStart, 3, 13.5),
    ];

    // Vallen
    this.traps = TRAPS.map(d => this.makeTrap(d));
    // Breekbare spullen
    this.breakables = BREAKABLES.map(d => this.makeBreakable(d));
    // BB-geweer
    this.gun = { ...SPOTS.gun, taken: false, mesh: this.makeGunMesh() };
    this.gun.mesh.position.set(this.gun.x, L1 + 3.4, this.gun.z);
    this.upRoot.add(this.gun.mesh);
    // Slee
    this.sled = this.makeSledMesh(); this.sled.position.set(SPOTS.sled.x, L1, SPOTS.sled.z); this.upRoot.add(this.sled);
    this.placeStuds();
    this.cops = [];
    this.setCamera(true);
    this.updateCutaway();
    for (const g of Object.values(this.W.groups)) g.set(g.target, true);
  }

  makeActor(look, spot) {
    const fig = new Minifig(look);
    this.root.add(fig.root);
    const a = { look, fig, x: spot.x, z: spot.z, level: spot.level, y: spot.level * L1, walk: 0, yaw: 0, r: 0.9 };
    return a;
  }

  makeBandit(name, spot, delay, speed) {
    const b = this.makeActor(name, spot);
    Object.assign(b, { name, state: 'waiting', timer: delay, pride: MAX_PRIDE, baseSpeed: speed, gag: null, gagT: 0, stunT: 0, sayCd: rand(3, 6), vy: 0, jy: 0, pieces: null });
    b.fig.root.visible = false;
    return b;
  }

  // ------------------------------------------------------------------
  placeStuds() {
    const add = (x, z, level, value, h = 1.3) => {
      const m = this.studMesh(value);
      const s = { x, z, y: level * L1 + h, level, value, fixed: true, mesh: m, spin: Math.random() * 6, age: 1 };
      m.position.set(x, s.y, s.z); this.lvl(level).add(m); this.studList.push(s);
    };
    const line = (x0, z0, x1, z1, level, step = 2.2) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / step));
      for (let i = 0; i <= n; i++) add(lerp(x0, x1, i / n), lerp(z0, z1, i / n), level, 10);
    };
    const arc = (x, z, level, dir = 'x') => {
      for (let i = 0; i < 5; i++) {
        const u = i / 4, o = (u - 0.5) * 6;
        add(dir === 'x' ? x + o : x, dir === 'x' ? z : z + o, level, 100, 1.3 + Math.sin(u * Math.PI) * 2.6);
      }
    };
    // beneden
    line(-2, 38, -2, 26, 0); line(2, 38, 2, 26, 0);
    line(-30, 34, -8, 34, 0, 3); line(8, 30, 30, 30, 0, 3);
    line(-3, 16, -3, 8, 0); line(3, 16, 3, 8, 0);
    line(-10, 10, -28, 10, 0); line(-28, 2, -28, -6, 0); line(-12, -8, -24, -8, 0);
    line(10, 10, 28, 10, 0); line(12, -4, 12, -14, 0); line(28, 6, 28, -4, 0);
    line(-6, -18, 6, -18, 0);
    line(10, -26, 30, -26, 0, 3); line(-30, -26, -10, -26, 0, 3); line(-6, -36, 6, -36, 0);
    // trap
    for (let z = 2; z > -14; z -= 2) add(0, z, 0, 10, rampY(z) + 1.3);
    // boven
    line(-10, -16, -30, -16, 1); line(-12, 8, -28, 8, 1); line(-28, 0, -28, -6, 1);
    line(-6, 6, -6, 18, 1); line(6, 6, 6, 18, 1); line(-3, 18, 3, 18, 1);
    line(10, -16, 20, -16, 1); line(12, 0, 28, 0, 1); line(12, 6, 12, 16, 1);
    // bogen om te springen
    arc(0, 30, 0); arc(-20, 14, 0); arc(20, 14, 0); arc(-18, -12, 0, 'z'); arc(20, -26, 0); arc(-20, 2, 1); arc(20, 6, 1); arc(-4, -34, 0);
    // blauwe noppen op lastige plekken
    add(-20, 0, 0, 1000, 2.8);          // op de salontafel
    add(20, 2, 0, 1000, 4.6);           // op de keukentafel tussen de pizza's
    add(-22, -12, 1, 1000, 4.2);        // op het ouderbed
    add(26, -14, 1, 1000, 7.3);         // bovenste stapelbed
    add(-20, -32, 0, 1000, 12.2);       // in de boomhut? nee: onder de boom
    add(0, 13, 0, 1000, 10.5);          // bij de kroonluchter
    add(30, -12, 0, 1000, 9.4);         // op de koelkast
    // paarse nop, heel hoog in de boomhut
    add(-20, -32, 0, 10000, 16);
  }

  studMesh(value) {
    const g = new THREE.Group();
    const col = STUD_COLORS[value];
    const m = mat(col, { metalness: 0.55, roughness: 0.25, emissive: col, emissiveIntensity: 0.25 });
    const coin = new THREE.Mesh(GEO.studCoin, m); const bump = new THREE.Mesh(GEO.studBump, m);
    const bump2 = bump.clone(); bump2.rotation.y = Math.PI;
    g.add(coin, bump, bump2);
    g.scale.setScalar(value >= 1000 ? 1.35 : 1);
    return g;
  }

  spawnStuds(x, y, z, level, total) {
    let n = 0;
    while (total > 0 && n < 30) {
      let v = 10;
      if (total >= 1000 && Math.random() < 0.35) v = 1000;
      else if (total >= 100 && Math.random() < 0.6) v = 100;
      total -= v; n++;
      const m = this.studMesh(v); this.lvl(level).add(m);
      const a = Math.random() * Math.PI * 2, sp = rand(3, 8);
      this.studList.push({ x, y, z, level, value: v, fixed: false, mesh: m, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: rand(8, 14), spin: 0, age: 0, life: 14 });
    }
  }

  // ------------------------------------------------------------------
  // Vallen
  makeTrap(d) {
    const t = { ...d, state: 'pile', progress: 0, timer: 0, anim: 0 };
    const baseY = d.level * L1;
    t.pile = new THREE.Group(); t.pile.position.set(d.x, baseY, d.z);
    const cols = [C.red, C.yellow, C.blue, C.green, C.white, C.orange];
    t.pileBricks = [];
    for (let i = 0; i < 7; i++) {
      const b = brickMesh(i % 3 ? 2 : 1, 0.8, 1, cols[i % cols.length]);
      b.position.set(rand(-1, 1), (i >> 2) * 0.8, rand(-0.8, 0.8)); b.rotation.y = rand(0, 3);
      b.userData.baseY = b.position.y; b.userData.ph = rand(0, 6);
      t.pile.add(b); t.pileBricks.push(b);
    }
    // voortgangsbalk
    t.bar = new THREE.Group();
    const bg = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: 0x111111 })); bg.scale.set(3, 0.3, 0.05); t.bar.add(bg);
    t.barFill = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: 0x9fe870 })); t.barFill.scale.set(0.01, 0.22, 0.08); t.bar.add(t.barFill);
    t.bar.position.y = 4; t.bar.visible = false; t.pile.add(t.bar);
    this.lvl(d.level).add(t.pile);
    t.model = this.trapModel(t); t.model.visible = false; this.lvl(d.level).add(t.model);
    return t;
  }

  trapModel(t) {
    const g = new THREE.Group(); const y = t.level * L1; const ceil = y + 12;
    g.position.set(t.x, y, t.z);
    const box = (w, h, d, col, x = 0, yy = 0, z = 0, o = {}) => { const m = new THREE.Mesh(GEO.box, mat(col, o)); m.scale.set(w, h, d); m.position.set(x, yy + h / 2, z); m.castShadow = true; g.add(m); return m; };
    switch (t.type) {
      case 'ice': box(6, 0.12, 4.5, 0xbfe6ff, 0, 0.02, 0, { transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.2 }); break;
      case 'cars':
        for (let i = 0; i < 8; i++) {
          const c = new THREE.Group(); const col = [C.red, C.blue, C.yellow, C.green, C.orange][i % 5];
          const b = new THREE.Mesh(GEO.box, mat(col)); b.scale.set(0.6, 0.3, 1); b.position.y = 0.25; c.add(b);
          const top = new THREE.Mesh(GEO.box, mat(0x223344)); top.scale.set(0.5, 0.2, 0.5); top.position.y = 0.5; c.add(top);
          c.position.set(rand(-2.2, 2.2), 0, rand(-2, 2)); c.rotation.y = rand(0, 6); g.add(c);
        }
        break;
      case 'ornaments':
        for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(GEO.sphere, mat([C.red, C.yellow, C.studBlue, C.pink, C.green][i % 5], { metalness: 0.5, roughness: 0.15 })); s.scale.setScalar(0.3); s.position.set(rand(-2.2, 2.2), 0.3, rand(-2, 2)); g.add(s); }
        break;
      case 'nail': {
        box(2.5, 0.3, 1.5, 0x8a5a33);
        const n = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 8), mat(0xbbbbbb, { metalness: 0.8 })); n.position.y = 0.9; g.add(n);
        break;
      }
      case 'knob': {
        box(1.6, 1.4, 1.6, 0x444444, 1.6, 0, -0.5);
        box(1.4, 0.2, 1.4, 0xff5522, 1.6, 1.4, -0.5, { emissive: 0xff3300, emissiveIntensity: 1.5 });
        const k = new THREE.Mesh(GEO.sphere, mat(0xff5522, { emissive: 0xff3300, emissiveIntensity: 2 })); k.scale.setScalar(0.45); k.position.set(-1.8, 4, 1.4); g.add(k); t.glow = k;
        break;
      }
      case 'torch': {
        box(1.2, 1.2, 2.4, C.red, 0, 8.4, -2.2);
        const noz = new THREE.Mesh(GEO.cyl, mat(0x999999, { metalness: 0.7 })); noz.scale.set(0.2, 1.4, 0.2); noz.rotation.x = Math.PI / 2; noz.position.set(0, 8.8, -0.6); g.add(noz);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 8), mat(0x4a8aff, { emissive: 0x2a6aff, emissiveIntensity: 2, transparent: true, opacity: 0.8 })); fl.rotation.x = Math.PI / 2; fl.position.set(0, 8.8, 0.6); g.add(fl); t.flame = fl;
        break;
      }
      case 'iron': case 'paint': {
        const pivot = new THREE.Group(); pivot.position.y = 12; g.add(pivot); t.pivot = pivot;
        const rope = new THREE.Mesh(GEO.cyl, mat(0xeeeeee)); rope.scale.set(0.05, 7, 0.05); rope.position.y = -3.5; pivot.add(rope);
        const obj = new THREE.Group(); obj.position.y = -7.5; pivot.add(obj); t.obj = obj;
        if (t.type === 'paint') {
          const can = new THREE.Mesh(GEO.cyl, mat(0xcccccc, { metalness: 0.5 })); can.scale.set(0.7, 1.4, 0.7); obj.add(can);
          const lab = new THREE.Mesh(GEO.cyl, mat(t.level ? C.blue : C.red)); lab.scale.set(0.72, 0.7, 0.72); obj.add(lab);
        } else {
          const ir = new THREE.Mesh(GEO.box, mat(0x9aa4ad, { metalness: 0.6 })); ir.scale.set(1.2, 0.5, 2); obj.add(ir);
          const hd = new THREE.Mesh(GEO.box, mat(0x333333)); hd.scale.set(0.3, 0.6, 1.2); hd.position.y = 0.5; obj.add(hd);
        }
        break;
      }
      case 'feathers': {
        box(0.5, 3, 0.5, 0xdddddd, 2.2, 0, -1.2);
        const fan = new THREE.Group(); fan.position.set(2.2, 3.2, -0.8); g.add(fan); t.fan = fan;
        for (let i = 0; i < 3; i++) { const bl = new THREE.Mesh(GEO.box, mat(0x9ab)); bl.scale.set(0.3, 1.4, 0.05); bl.position.y = 0.7; const p = new THREE.Group(); p.rotation.z = i * 2.094; p.add(bl); fan.add(p); }
        box(4, 0.05, 3, 0xd8b030, -0.5, 0, 0, { roughness: 0.1 });
        for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(GEO.sphere, mat(C.white)); f.scale.set(0.35, 0.08, 0.15); f.position.set(rand(-2, 1), 0.15, rand(-1.4, 1.4)); f.rotation.y = rand(0, 3); g.add(f); }
        break;
      }
      case 'spider': g.add(this.spiderMesh()); t.spider = g.children[g.children.length - 1]; break;
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  spiderMesh() {
    const s = new THREE.Group();
    const body = new THREE.Mesh(GEO.sphere, mat(0x3a2412)); body.scale.set(0.5, 0.3, 0.6); body.position.y = 0.35; s.add(body);
    const head = new THREE.Mesh(GEO.sphere, mat(0x2a1a0a)); head.scale.set(0.3, 0.25, 0.3); head.position.set(0, 0.35, 0.55); s.add(head);
    for (let i = 0; i < 4; i++) for (const d of [-1, 1]) {
      const l = new THREE.Mesh(GEO.cyl, mat(0x2a1a10)); l.scale.set(0.05, 0.8, 0.05);
      l.position.set(d * 0.5, 0.25, -0.3 + i * 0.25); l.rotation.set(0, 0, d * 1.1); s.add(l);
    }
    return s;
  }

  // ------------------------------------------------------------------
  makeBreakable(d) {
    const g = new THREE.Group(); const y = d.level * L1; g.position.set(d.x, y, d.z);
    const box = (w, h, dd, col, x = 0, yy = 0, z = 0, studs = true) => { const b = brickMesh(w, h, dd, col, studs); b.position.set(x, yy, z); g.add(b); return b; };
    let colors = [C.red];
    switch (d.type) {
      case 'gift': { const col = [C.red, C.green, C.blue][Math.floor(Math.abs(d.x * 7 + d.z)) % 3]; box(2, 1.6, 2, col); box(2.05, 1.62, 0.4, C.yellow, 0, 0, 0, false); box(0.4, 1.62, 2.05, C.yellow, 0, 0, 0, false); colors = [col, C.yellow]; break; }
      case 'lamp': box(1.4, 0.4, 1.4, 0x4a2410); box(0.4, 5, 0.4, 0x4a2410, 0, 0.4, 0, false); { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 1.6, 12), mat(0xf6e3a1, { emissive: 0xffd080, emissiveIntensity: 0.6 })); sh.position.y = 6; g.add(sh); } colors = [0xf6e3a1, 0x4a2410]; break;
      case 'vase': { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 2.2, 12), mat(0x3a8ac8)); v.position.y = 3.6; g.add(v); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(GEO.sphere, mat(C.red)); f.scale.setScalar(0.35); f.position.set(rand(-0.4, 0.4), 5, rand(-0.4, 0.4)); g.add(f); } colors = [0x3a8ac8, C.red]; break; }
      case 'plant': box(1.6, 1.4, 1.6, 0xb0602a); for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(GEO.sphere, mat(C.green)); l.scale.set(0.4, 1.1, 0.25); l.position.set(rand(-0.5, 0.5), 2.4, rand(-0.5, 0.5)); l.rotation.z = rand(-0.6, 0.6); g.add(l); } colors = [C.green, 0xb0602a]; break;
      case 'chair': box(2, 0.4, 2, 0x6b3a1e, 0, 1.8); box(2, 2.6, 0.4, 0x6b3a1e, 0, 2.2, -0.8, false); for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) box(0.3, 1.8, 0.3, 0x4a2410, x, 0, z, false); colors = [0x6b3a1e]; break;
      case 'milk': box(1, 2, 1, C.white, 0, 3.6); box(1.02, 0.6, 1.02, C.blue, 0, 4.4, 0, false); colors = [C.white, C.blue]; break;
      case 'trash': box(1.8, 2.6, 1.8, 0x7a7f86); colors = [0x7a7f86]; break;
      case 'suitcase': box(3, 2, 1.2, 0x8a5a33); box(1, 0.3, 0.3, 0x4a2a14, 0, 2); colors = [0x8a5a33]; break;
      case 'toybox': box(3, 2, 2, C.red); box(3.02, 0.4, 2.02, C.yellow, 0, 1.2, 0, false); colors = [C.red, C.yellow, C.blue]; break;
      case 'snowman': {
        for (const [r, yy] of [[1.5, 1.3], [1.1, 3.5], [0.8, 5.1]]) { const s = new THREE.Mesh(GEO.sphere, mat(C.snow)); s.scale.setScalar(r); s.position.y = yy; g.add(s); }
        box(1.4, 0.2, 1.4, C.black, 0, 5.8, 0, false); box(0.9, 1.1, 0.9, C.black, 0, 6.0, 0);
        const n = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.8, 8), mat(C.orange)); n.rotation.x = Math.PI / 2; n.position.set(0, 5.1, 0.9); g.add(n);
        colors = [C.snow, C.black, C.orange]; break;
      }
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.lvl(d.level).add(g);
    return { ...d, mesh: g, colors, broken: false };
  }

  makeGunMesh() {
    const g = new THREE.Group();
    const stock = new THREE.Mesh(GEO.box, mat(0x6b3f1f)); stock.scale.set(0.5, 0.6, 1.4); stock.position.z = -0.8; g.add(stock);
    const barrel = new THREE.Mesh(GEO.cyl, mat(0x333333, { metalness: 0.6 })); barrel.scale.set(0.15, 2.4, 0.15); barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.9; g.add(barrel);
    const glow = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: 0xffff90, transparent: true, opacity: 0.25 })); glow.scale.setScalar(1.8); g.add(glow);
    g.rotation.y = Math.PI / 2;
    return g;
  }

  makeSledMesh() {
    const g = new THREE.Group();
    const top = brickMesh(2, 0.3, 3.2, C.red); top.position.y = 0.45; g.add(top);
    for (const s of [-1, 1]) { const r = new THREE.Mesh(GEO.box, mat(0x777777, { metalness: 0.7 })); r.scale.set(0.12, 0.12, 3.6); r.position.set(s * 0.8, 0.12, 0.1); g.add(r); const f = new THREE.Mesh(GEO.box, mat(0x777777, { metalness: 0.7 })); f.scale.set(0.12, 0.5, 0.12); f.position.set(s * 0.8, 0.3, 1.8); g.add(f); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  // ------------------------------------------------------------------
  // Hulpjes
  popup(text, x, y, z, cls = '') {
    const el = document.createElement('div'); el.className = 'pop ' + cls; el.textContent = text;
    this.popEl.appendChild(el);
    this.pops.push({ el, pos: new THREE.Vector3(x, y, z), life: 1.4, max: 1.4 });
  }
  banner(text, sub = '', dur = 2.6, cls = '') {
    const b = $('banner'); b.className = cls; b.querySelector('b').textContent = text; b.querySelector('small').textContent = sub;
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(this.bannerT); this.bannerT = setTimeout(() => b.classList.add('hidden'), dur * 1000);
  }
  bricksBurst(x, y, z, colors, n = 12, power = 1, floor = null, parent = this.root) {
    for (let i = 0; i < n; i++) {
      const b = brickMesh([1, 1, 2][i % 3], 0.6, 1, colors[i % colors.length]);
      b.position.set(x + rand(-0.6, 0.6), y + rand(0, 1), z + rand(-0.6, 0.6));
      parent.add(b);
      const a = Math.random() * Math.PI * 2, sp = rand(3, 9) * power;
      this.fx.push({ kind: 'brick', mesh: b, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: rand(6, 13) * power, vr: new THREE.Vector3(rand(-8, 8), rand(-8, 8), rand(-8, 8)), floor: floor ?? (y < 12 ? 0 : L1), life: rand(1.4, 2.2) });
    }
  }
  near(a, b, r) { return a.level === b.level && Math.hypot(a.x - b.x, a.z - b.z) < r; }
  actorY(a) { return groundY(a) + (a.jy || 0); }

  breakFig(e) {
    const fig = e.fig;
    fig.root.updateMatrixWorld(true);
    e.pieces = fig.parts.map(p => {
      const c = p.clone(true);
      p.matrixWorld.decompose(c.position, c.quaternion, c.scale);
      this.root.add(c);
      const a = Math.random() * Math.PI * 2, sp = rand(2, 6);
      return { part: p, mesh: c, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: rand(6, 11), vr: new THREE.Vector3(rand(-9, 9), rand(-9, 9), rand(-9, 9)), floor: groundY(e) };
    });
    fig.root.visible = false;
    Sfx.breakApart();
  }
  updatePieces(e, dt, reform, prog) {
    if (!e.pieces) return;
    if (reform) {
      e.fig.root.updateMatrixWorld(true);
      const tp = new THREE.Vector3(), tq = new THREE.Quaternion(), ts = new THREE.Vector3();
      for (const p of e.pieces) {
        if (!p.start) p.start = { pos: p.mesh.position.clone(), q: p.mesh.quaternion.clone() };
        p.part.matrixWorld.decompose(tp, tq, ts);
        const u = 1 - Math.pow(1 - prog, 3);
        p.mesh.position.lerpVectors(p.start.pos, tp, u); p.mesh.position.y += Math.sin(u * Math.PI) * 3;
        p.mesh.quaternion.slerpQuaternions(p.start.q, tq, u);
      }
    } else {
      for (const p of e.pieces) {
        p.vy -= 30 * dt;
        p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += p.vr.x * dt; p.mesh.rotation.y += p.vr.y * dt; p.mesh.rotation.z += p.vr.z * dt;
        if (p.mesh.position.y < p.floor + 0.3) { p.mesh.position.y = p.floor + 0.3; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; p.vr.multiplyScalar(0.5); }
      }
    }
  }
  clearPieces(e) { if (e.pieces) for (const p of e.pieces) this.root.remove(p.mesh); e.pieces = null; e.fig.root.visible = true; }

  // ------------------------------------------------------------------
  // Invoer-afhankelijke update van Kevin
  nearestPile(k) { let best = null, bd = 3; for (const t of this.traps) { if (t.state !== 'pile' || t.level !== k.level) continue; const d = Math.hypot(t.x - k.x, t.z - k.z); if (d < bd) { bd = d; best = t; } } return best; }
  nearestBreakable(k) { let best = null, bd = 3.2; for (const b of this.breakables) { if (b.broken || b.level !== k.level) continue; const d = Math.hypot(b.x - k.x, b.z - k.z); if (d < bd) { bd = d; best = b; } } return best; }
  nearTV(k) { return this.near(k, SPOTS.tv, 4.5); }
  nearGun(k) { return !this.gun.taken && this.near(k, this.gun, 3.5); }
  nearSled(k) { return k.state === 'play' && this.near(k, SPOTS.sled, 3) && !inRamp(k.x, k.z); }

  updateKevin(dt, input) {
    const k = this.kevin, fig = k.fig;
    k.invuln = Math.max(0, k.invuln - dt); k.screamCd = Math.max(0, k.screamCd - dt); k.shootCd = Math.max(0, k.shootCd - dt); k.screamT = Math.max(0, k.screamT - dt);

    if (k.state === 'broken') {
      k.timer -= dt; this.updatePieces(k, dt, false);
      if (k.timer <= 0) { k.state = 'reform'; k.timer = 0.8; Object.assign(k, { x: SPOTS.kevinStart.x, z: SPOTS.kevinStart.z, level: 1, jy: 0, vy: 0 }); this.placeFig(k); Sfx.reform(); }
      return;
    }
    if (k.state === 'reform') {
      k.timer -= dt; this.updatePieces(k, dt, true, 1 - k.timer / 0.8);
      if (k.timer <= 0) { this.clearPieces(k); k.state = 'play'; k.invuln = 2.5; }
      return;
    }
    if (k.state === 'sled') { this.updateSled(dt); return; }
    if (this.phase === 'win') { fig.pose({ walk: 0, amp: 0, armL: 2.8, armR: 2.8 }); fig.setExpr('smile'); this.placeFig(k); return; }

    // bouwen
    const pile = this.nearestPile(k);
    for (const t of this.traps) { if (t !== pile && t.state === 'pile' && t.progress > 0) t.progress = Math.max(0, t.progress - dt * 0.5); }
    if (input.build && pile && k.jy === 0) {
      k.building = pile;
      pile.progress += dt / 1.1;
      k.yaw = Math.atan2(pile.x - k.x, pile.z - k.z);
      if (Math.random() < dt * 14) Sfx.click();
      if (Math.random() < dt * 7) this.bricksBurst(pile.x, pile.level * L1 + 0.5, pile.z, [C.red, C.yellow, C.blue, C.green], 1, 0.6);
      fig.pose({ walk: 0, amp: 0, armL: 1.3 + Math.sin(this.t * 22) * 0.5, armR: 1.3 + Math.cos(this.t * 22) * 0.5 });
      fig.setExpr('smirk');
      if (pile.progress >= 1) this.armTrap(pile);
      this.placeFig(k);
      return;
    }
    k.building = null;

    // eenmalige acties
    if (input.pressed.build) {
      if (this.nearGun(k)) {
        this.gun.taken = true; this.gun.mesh.visible = false; this.hasGun = true;
        Sfx.buildDone(); this.banner("BUZZ' BB-GEWEER!", 'Druk op F om te schieten', 2.6, 'green');
        this.gunHeld = this.makeGunMesh(); this.gunHeld.children[2].visible = false; this.gunHeld.scale.setScalar(0.6); this.gunHeld.rotation.set(Math.PI / 2, 0, 0); this.gunHeld.position.set(0.3, -1.1, 0.4); fig.armR.add(this.gunHeld);
      } else if (this.nearTV(k) && this.tvCd <= 0) this.playTV();
      else if (this.nearSled(k)) { this.startSled(); return; }
    }
    if (input.pressed.act) {
      const b = this.nearestBreakable(k);
      if (b) this.smash(b);
      else if (this.hasGun && k.shootCd <= 0) this.shoot();
    }
    if (input.pressed.scream && k.screamCd <= 0) {
      k.screamCd = 6; k.screamT = 1.5; Sfx.kevinScream(); this.shake = 0.4;
      this.popup('AAAAAAH!', k.x, this.actorY(k) + 6, k.z, 'yellow big');
      for (const b of this.bandits) if (b.state === 'chase' && this.near(b, k, 12)) this.stun(b, 1.7, '?!');
    }

    // lopen (camerarelatief: omhoog = weg van de camera)
    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0), mz = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (input.stick) { mx = input.stick.x; mz = input.stick.y; }
    const len = Math.hypot(mx, mz);
    if (k.screamT > 0.5) { mx = mz = 0; }
    const speed = 13;
    if (len > 0.1) {
      const nx = mx / Math.max(1, len), nz = mz / Math.max(1, len);
      move(k, nx * speed * dt, nz * speed * dt);
      const targetYaw = Math.atan2(nx, nz);
      k.yaw = lerpAngle(k.yaw, targetYaw, Math.min(1, dt * 14));
      k.walk += dt * 13 * Math.min(1, len); k.idle = 0;
    } else { k.walk = 0; k.idle += dt; }

    // springen
    if (input.pressed.jump && k.jy === 0) { k.vy = 17; Sfx.jump(); }
    if (k.vy !== 0 || k.jy > 0) { k.vy -= 45 * dt; k.jy += k.vy * dt; if (k.jy <= 0) { k.jy = 0; k.vy = 0; } }

    // pose
    let expr = 'smile';
    const pose = { walk: k.walk, amp: len > 0.1 ? 0.8 : 0 };
    if (k.screamT > 0) { expr = 'scream'; pose.armL = 2.7; pose.armR = 2.7; pose.armLz = -0.5; pose.armRz = -0.5; pose.amp = 0; }
    else if (k.jy > 0) { expr = 'ooh'; pose.armL = 2.5; pose.armR = 2.5; }
    else if (k.idle > 6) { expr = 'smirk'; pose.armR = Math.abs(Math.sin(this.t * 3)) * 2.5; }
    if (this.hasGun && k.shootCd > 0.3) pose.armR = 1.57;
    fig.pose(pose); fig.setExpr(expr);
    this.placeFig(k);
    fig.root.visible = !(k.invuln > 0 && Math.sin(this.t * 30) > 0.3);

    // noppen oppakken
    const ky = this.actorY(k) + 2;
    for (let i = this.studList.length - 1; i >= 0; i--) {
      const s = this.studList[i];
      if (s.age < 0.35) continue;
      const dx = k.x - s.x, dz = k.z - s.z, dy = ky - s.y, d = Math.hypot(dx, dz, dy * 0.8);
      if (d < 1.8) { this.collect(s, i); }
      else if (!s.fixed && d < 7) { const f = 22 * dt / d; s.x += dx * f; s.z += dz * f; s.y += dy * f; }
    }
    if (!this.trueKevin && this.studs >= TRUE_KEVIN) { this.trueKevin = true; this.banner('ECHTE KEVIN!', 'Je hebt genoeg noppen voor een gouden steen', 3, 'gold'); Sfx.fanfare(); }
  }

  collect(s, i) {
    this.studs += s.value; Sfx.stud(s.value);
    s.mesh.parent.remove(s.mesh); this.studList.splice(i, 1);
    if (s.value >= 1000) this.popup('+' + s.value.toLocaleString('nl-NL'), s.x, s.y + 1.5, s.z, s.value >= 10000 ? 'purple' : 'blue');
  }

  placeFig(e) {
    const r = e.fig.root;
    r.position.set(e.x, this.actorY(e), e.z);
    r.rotation.y = e.yaw;
  }

  armTrap(t) {
    t.state = 'armed'; t.progress = 0; t.anim = 0;
    t.pile.visible = false; t.model.visible = true; t.model.scale.setScalar(0.01); t.popT = 0;
    Sfx.buildDone();
    this.popup(t.name + '!', t.x, t.level * L1 + 5, t.z, 'green');
    this.stats.traps++; if (this.phase === 'prep') this.stats.builtInPrep++;
    this.spawnStuds(t.x, t.level * L1 + 2, t.z, t.level, 60);
    this.bricksBurst(t.x, t.level * L1 + 0.5, t.z, [C.red, C.yellow, C.blue, C.green, C.white], 6, 0.7);
  }

  smash(b) {
    b.broken = true; b.mesh.parent.remove(b.mesh); this.stats.smashed++;
    this.bricksBurst(b.x, b.level * L1 + 1, b.z, b.colors, 14);
    const val = b.type === 'snowman' ? 500 : Math.round(rand(150, 400) / 10) * 10;
    this.spawnStuds(b.x, b.level * L1 + 2, b.z, b.level, val);
    Sfx.smash();
  }

  shoot() {
    const k = this.kevin; k.shootCd = 0.7;
    const m = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: 0xffe066 })); m.scale.setScalar(0.18);
    const dx = Math.sin(k.yaw), dz = Math.cos(k.yaw);
    const p = { x: k.x + dx * 1.2, z: k.z + dz * 1.2, y: this.actorY(k) + 2.6, level: k.level, vx: dx * 40, vz: dz * 40, life: 0.6, mesh: m, r: 0.1 };
    m.position.set(p.x, p.y, p.z); this.root.add(m); this.pellets.push(p);
    Sfx.shoot();
  }

  playTV() {
    this.tvCd = 18; this.tvT = 3; Sfx.gun();
    this.popup('"Hou het wisselgeld, smerig beest!"', SPOTS.tv.x, 9, SPOTS.tv.z, 'white');
    for (const b of this.bandits) {
      if (b.state !== 'chase' || b.level !== 0 || !['living', 'foyer', 'kitchen'].includes(roomOf(b))) continue;
      b.state = 'flee'; b.timer = 2.6; b.fleeFrom = { x: SPOTS.tv.x, z: SPOTS.tv.z };
      this.popup('Wie schiet daar?!', b.x, 7, b.z, 'white');
    }
  }

  startSled() {
    const k = this.kevin;
    k.state = 'sled'; k.x = 0; k.z = RAMP.z0 - 1; k.level = 1; k.yaw = 0; k.sledV = 6;
    this.sled.visible = false;
    this.sledRide = this.makeSledMesh(); this.root.add(this.sledRide);
    Sfx.whoosh(); this.popup('JOEPIE!', 0, L1 + 6, RAMP.z0, 'yellow');
  }
  updateSled(dt) {
    const k = this.kevin;
    k.sledV = Math.min(34, k.sledV + (inRamp(k.x, k.z) ? 40 : -9) * dt);
    k.z += k.sledV * dt; k.x += (0 - k.x) * dt * 3;
    if (inRamp(k.x, k.z)) k.level = rampY(k.z) > 6.5 ? 1 : 0; else if (k.z > RAMP.z1) k.level = 0;
    collide(k);
    const y = groundY(k);
    const slope = inRamp(k.x, k.z) ? Math.atan2(RAMP.h, RAMP.z1 - RAMP.z0) : 0;
    k.fig.pose({ walk: 0, amp: 0, armL: 2.8, armR: 2.8 }); k.fig.setExpr('scream');
    k.fig.legL.rotation.x = k.fig.legR.rotation.x = -1.4;
    k.fig.root.position.set(k.x, y + 0.5, k.z); k.fig.root.rotation.set(slope, 0, 0);
    this.sledRide.position.set(k.x, y, k.z); this.sledRide.rotation.set(slope, 0, 0);
    if (Math.random() < dt * 25) this.bricksBurst(k.x, y + 0.2, k.z - 1.5, [C.snow], 1, 0.3, y);
    for (const b of this.bandits) if (b.state === 'chase' && this.near(b, k, 2.2)) { this.stun(b, 2.2, 'STRIKE!'); Sfx.bonk(); move(b, rand(-3, 3), 3); }
    if (k.sledV <= 1 || k.z > 37) {
      k.state = 'play'; k.fig.root.rotation.set(0, 0, 0); this.root.remove(this.sledRide); this.sled.visible = true;
      if (k.z > 21) { this.bricksBurst(k.x, 0.5, k.z, [C.snow, 0xeef4ff], 16, 1, 0); this.popup('PLOF!', k.x, 5, k.z, 'white big'); Sfx.noise(0.3, 0.3, 1200, 'lowpass'); this.spawnStuds(k.x, 2, k.z, 0, 300); }
    }
  }

  // ------------------------------------------------------------------
  // Bandieten
  stun(b, t, text) { b.state = 'stunned'; b.stunT = t; if (text) this.popup(text, b.x, this.actorY(b) + 6.5, b.z, 'white'); }

  steer(b, speed, dt) {
    const k = this.kevin;
    const target = { x: k.x, z: k.z, level: k.level };
    const from = roomOf(b), to = roomOf(target);
    let tx = target.x, tz = target.z;
    if (from !== to) {
      const route = this.route(from, to);
      if (route) {
        const d = route;
        const inv = d.a !== from;
        const dirx = inv ? -d.nx : d.nx, dirz = inv ? -d.nz : d.nz;
        const dist = Math.hypot(b.x - d.x, b.z - d.z);
        // eerst voor de deur gaan staan, dan erdoor
        const along = (b.x - d.x) * dirx + (b.z - d.z) * dirz;
        if (dist > 1.4 && along < -0.3) { tx = d.x - dirx * 0.5; tz = d.z - dirz * 0.5; }
        else { tx = d.x + dirx * 4; tz = d.z + dirz * 4; }
      }
    }
    const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
    if (d > 0.3) {
      const st = Math.min(d, speed * dt);
      move(b, dx / d * st, dz / d * st);
      b.yaw = lerpAngle(b.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
      b.walk += dt * 11;
    } else b.walk = 0;
  }

  route(from, to) {
    const prev = { [from]: null }; const q = [from];
    while (q.length) {
      const r = q.shift();
      if (r === to) break;
      for (const d of DOORS) {
        const n = d.a === r ? d.b : d.b === r ? d.a : null;
        if (n && !(n in prev)) { prev[n] = { r, d }; q.push(n); }
      }
    }
    if (!(to in prev)) return null;
    let cur = to;
    while (prev[cur] && prev[cur].r !== from) cur = prev[cur].r;
    return prev[cur] ? prev[cur].d : null;
  }

  updateBandit(b, dt) {
    const k = this.kevin, fig = b.fig;
    b.sayCd -= dt;
    switch (b.state) {
      case 'waiting':
        b.timer -= dt;
        if (b.timer <= 0) { b.state = 'chase'; fig.root.visible = true; }
        return;
      case 'defeated': case 'arrested':
        fig.pose({ walk: 0, amp: 0, armL: b.state === 'arrested' ? -0.4 : 0.4, armR: b.state === 'arrested' ? -0.4 : 0.4 }); fig.setExpr('dizzy');
        fig.body.rotation.set(0, 0, 0); fig.legL.rotation.x = fig.legR.rotation.x = -1.5; b.jy = -0.6; this.placeFig(b); b.jy = 0;
        this.stars(b, true);
        return;
      case 'stunned':
        b.stunT -= dt; fig.pose({ walk: 0, amp: 0, armL: 0.3 + Math.sin(this.t * 8) * 0.2, armR: 0.3 }); fig.setExpr('dizzy'); this.stars(b, true);
        if (b.stunT <= 0) { b.state = 'chase'; this.stars(b, false); }
        this.placeFig(b); return;
      case 'laugh':
        b.timer -= dt; fig.pose({ walk: 0, amp: 0, armL: 0.8 + Math.sin(this.t * 20) * 0.3, armR: 0.8 + Math.sin(this.t * 20) * 0.3 }); fig.setExpr('smile');
        if (b.timer <= 0) b.state = 'chase';
        this.placeFig(b); return;
      case 'flee': {
        b.timer -= dt;
        const dx = b.x - b.fleeFrom.x, dz = b.z - b.fleeFrom.z, d = Math.hypot(dx, dz) || 1;
        move(b, dx / d * 16 * dt, dz / d * 16 * dt); b.yaw = Math.atan2(dx, dz); b.walk += dt * 18;
        fig.pose({ walk: b.walk, armL: 2.8, armR: 2.8 }); fig.setExpr('scream');
        if (b.timer <= 0) b.state = 'chase';
        this.placeFig(b); return;
      }
      case 'gag': this.updateGag(b, dt); return;
      case 'broken':
        b.timer -= dt; this.updatePieces(b, dt, false);
        if (b.timer <= 0) { b.state = 'reform'; b.timer = 0.8; fig.body.rotation.set(0, 0, 0); this.clearGagProps(b); Sfx.reform(); }
        return;
      case 'reform':
        b.timer -= dt; this.updatePieces(b, dt, true, 1 - b.timer / 0.8);
        if (b.timer <= 0) {
          this.clearPieces(b);
          if (b.pride <= 0) { b.state = 'defeated'; this.checkWin(); }
          else { b.state = 'chase'; this.popup(b.name === 'harry' ? 'GRRRR!' : 'Au, mijn hoofd…', b.x, this.actorY(b) + 6.5, b.z, 'white'); }
        }
        return;
    }

    // achtervolgen
    const speed = b.baseSpeed + (MAX_PRIDE - b.pride) * 0.9;
    if (k.state === 'play') this.steer(b, speed, dt); else b.walk = 0;
    fig.pose({ walk: b.walk, amp: b.walk ? 0.8 : 0, armL: 1.4, armR: 1.4 }); fig.setExpr('grr');
    this.placeFig(b);
    if (b.sayCd <= 0) { b.sayCd = rand(7, 12); const l = TAUNTS[b.name]; this.popup(l[Math.floor(Math.random() * l.length)], b.x, this.actorY(b) + 6.5, b.z, 'white small'); }

    for (const t of this.traps) if (t.state === 'armed' && this.near(t, b, 1.9)) { this.triggerTrap(t, b); return; }
    if (k.state === 'play' && k.invuln <= 0 && this.near(b, k, 1.8) && k.jy < 2 && Math.abs(groundY(b) - groundY(k)) < 1.5) this.catchKevin(b);
  }

  stars(b, on) {
    if (on && !b.starRing) {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), mat(0xffd84a, { emissive: 0xffc000, emissiveIntensity: 1.2 })); const a = i / 3 * Math.PI * 2; s.position.set(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3); g.add(s); }
      b.starRing = g; this.root.add(g);
    }
    if (!on && b.starRing) { this.root.remove(b.starRing); b.starRing = null; }
    if (b.starRing) { b.starRing.position.set(b.x, this.actorY(b) + (b.state === 'defeated' || b.state === 'arrested' ? 5.2 : 6.2), b.z); b.starRing.rotation.y += 0.08; }
  }

  triggerTrap(t, b) {
    const g = GAGS[t.type];
    t.state = 'fired'; t.timer = 5; t.anim = 0;
    b.state = 'gag'; b.gag = t.type; b.gagT = 0; b.hitCeil = false; b.gagDir = b.yaw; b.vy = t.type === 'nail' ? 26 : 0; b.jy = 0;
    this.popup(g.text, b.x, this.actorY(b) + 7, b.z, 'yellow big');
    if (Sfx[g.snd]) Sfx[g.snd](b.name === 'marv');
    if (t.type === 'ornaments') Sfx.hurt(b.name === 'marv');
    if (t.type === 'knob') this.popup('M', b.x, this.actorY(b) + 3, b.z, 'red');
    this.shake = 0.25;
    // rekwisieten op de bandiet
    const fig = b.fig;
    if (t.type === 'torch') {
      const fl = new THREE.Group();
      for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 6), mat(i % 2 ? 0xff7a1a : 0xffd84a, { emissive: 0xff5a00, emissiveIntensity: 2 })); c.position.set(Math.cos(i * 1.3) * 0.35, 1.9, Math.sin(i * 1.3) * 0.35); fl.add(c); }
      fig.head.add(fl); b.props = [fl]; fig.hair.visible = false;
    } else if (t.type === 'spider') {
      const s = this.spiderMesh(); s.rotation.x = -Math.PI / 2; s.position.set(0, 0.6, 0.6); s.scale.setScalar(1.2); fig.head.add(s); b.props = [s];
      t.model.visible = false;
    } else if (t.type === 'feathers') {
      const fe = new THREE.Group();
      for (let i = 0; i < 40; i++) { const f = new THREE.Mesh(GEO.sphere, mat(C.white)); f.scale.set(0.35, 0.12, 0.2); f.position.set(rand(-1, 1), rand(0.3, 3.6), rand(-0.6, 0.6)); f.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); fe.add(f); }
      const comb = new THREE.Mesh(GEO.box, mat(C.red)); comb.scale.set(0.2, 0.5, 0.6); comb.position.set(0, 5.8, 0); fe.add(comb);
      fig.body.add(fe); b.props = [fe];
    } else if (t.type === 'paint') {
      const splat = new THREE.Mesh(GEO.box, mat(t.level ? C.blue : C.red)); splat.scale.set(1.1, 0.4, 0.2); splat.position.set(0, 0.7, 0.6); fig.head.add(splat); b.props = [splat];
    } else if (t.type === 'knob') {
      fig.armR.children[1].material = mat(0xff5522, { emissive: 0xff2200, emissiveIntensity: 1.5 }); b.hotHand = true;
    }
  }

  clearGagProps(b) {
    if (b.props) for (const p of b.props) p.parent && p.parent.remove(p);
    b.props = null; b.fig.hair.visible = true;
    if (b.hotHand) { b.fig.armR.children[1].material = mat(C.skin); b.hotHand = false; }
  }

  updateGag(b, dt) {
    const fig = b.fig, u = b.gagT += dt, g = GAGS[b.gag];
    fig.body.rotation.set(0, 0, 0);
    let expr = 'scream';
    const pose = { walk: 0, amp: 0 };
    switch (b.gag) {
      case 'ice': case 'cars': {
        const k = Math.min(1, u / 0.35);
        fig.body.rotation.x = -k * Math.PI / 2; b.jy = Math.sin(k * Math.PI) * 2.5;
        pose.armL = 2.6; pose.armR = 2.6; pose.walk = u * 30; pose.amp = 1 - k; if (u > 0.45) expr = 'dizzy';
        if (u < 0.4) move(b, Math.sin(b.gagDir) * 10 * dt, Math.cos(b.gagDir) * 10 * dt);
        break;
      }
      case 'ornaments': b.jy = Math.abs(Math.sin(u * 10)) * 1.6; pose.armL = 2 + Math.sin(u * 20) * 0.5; pose.armR = 2.4; fig.legL.rotation.x = -1; break;
      case 'nail': {
        b.vy -= 50 * dt; b.jy = Math.max(0, b.jy + b.vy * dt);
        const room = 12 - b.fig.height;
        if (b.jy > room && b.vy > 0) { b.jy = room; b.vy = -2; if (!b.hitCeil) { b.hitCeil = true; Sfx.bonk(); this.popup('BOINK!', b.x, this.actorY(b) + 6, b.z, 'yellow'); this.shake = 0.3; } }
        pose.armL = 3; pose.armR = 3; if (b.hitCeil) expr = 'dizzy';
        break;
      }
      case 'knob': pose.armR = 2.2 + Math.sin(u * 25) * 0.6; pose.armL = 0.6; b.yaw += dt * 8; break;
      case 'torch':
        pose.armL = 2.9; pose.armR = 2.9; pose.walk = u * 20; pose.amp = 0.9;
        move(b, Math.sin(u * 3) * 14 * dt, Math.cos(u * 2) * 14 * dt); b.yaw = u * 3;
        break;
      case 'iron': case 'paint': {
        const k = Math.min(1, u / 0.25);
        fig.body.rotation.x = -k * Math.PI / 2; expr = 'dizzy'; pose.armL = 1.5; pose.armR = 1.5;
        break;
      }
      case 'feathers': pose.armL = 1.3 + Math.sin(u * 22) * 0.9; pose.armR = pose.armL; pose.armLz = 0.8; pose.armRz = 0.8; expr = 'ooh'; b.jy = Math.abs(Math.sin(u * 8)) * 0.6; break;
      case 'spider': pose.armL = 2.6 + Math.sin(u * 30) * 0.4; pose.armR = 2.6 - Math.sin(u * 30) * 0.4; b.yaw += Math.sin(u * 20) * 0.1; break;
    }
    fig.pose(pose); fig.setExpr(expr);
    this.placeFig(b);
    if (u >= g.dur) {
      b.jy = 0; b.vy = 0; b.pride--;
      this.breakFig(b);
      this.spawnStuds(b.x, this.actorY(b) + 2, b.z, b.level, 700);
      this.shake = 0.3; b.state = 'broken'; b.timer = 1.4;
      if (b.pride <= 0) this.banner(b.name === 'harry' ? 'HARRY IS VERSLAGEN!' : 'MARV IS VERSLAGEN!', 'Nog één Natte Bandiet te gaan…', 2.4, 'green');
    }
  }

  catchKevin(b) {
    const k = this.kevin;
    this.catches++; Sfx.caught(); Sfx.laugh();
    this.breakFig(k); k.state = 'broken'; k.timer = 1.6;
    const lose = Math.min(this.studs, Math.floor(this.studs * 0.15 / 10) * 10);
    this.studs -= lose; if (lose > 0) this.spawnStuds(k.x, this.actorY(k) + 2, k.z, k.level, lose);
    this.popup(b.name === 'harry' ? 'Hebbes, jochie!' : 'Ik heb hem, Harry!', b.x, this.actorY(b) + 6.5, b.z, 'white');
    b.state = 'laugh'; b.timer = 1.6; this.shake = 0.4;
    for (const o of this.bandits) if (o !== b && o.state === 'chase') { o.state = 'laugh'; o.timer = 1; }
  }

  checkWin() {
    if (this.phase !== 'attack' || !this.bandits.every(b => b.state === 'defeated')) return;
    this.phase = 'win'; this.winT = 0;
    Sfx.siren(); this.banner('POLITIE!', 'De Natte Bandieten worden ingerekend!', 4, 'blue');
    Music.play('win');
    for (const b of this.bandits) {
      const c = this.makeActor('cop', { x: b.x + 14, z: b.z, level: b.level });
      c.target = b; c.t = 0; c.sx = b.x + 14 * (b.x > 0 ? -1 : 1); this.cops.push(c);
    }
  }

  // ------------------------------------------------------------------
  startAttack() {
    this.phase = 'attack'; this.prepLeft = 0;
    Sfx.doorbell();
    this.banner('21:00 UUR', 'De Natte Bandieten komen eraan!', 3, 'red');
    Music.play('attack');
  }

  update(dt, input) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.tvCd = Math.max(0, this.tvCd - dt); this.tvT = Math.max(0, this.tvT - dt);
    const W = this.W;
    W.tvScreen.material.emissive.setHex(this.tvT > 0 ? (Math.sin(this.t * 40) > 0 ? 0xdddddd : 0x555555) : 0x000000);

    if (this.phase === 'prep') {
      const before = Math.ceil(this.prepLeft); this.prepLeft -= dt;
      if (Math.ceil(this.prepLeft) !== before && this.prepLeft < 10) Sfx.clock();
      if (this.prepLeft <= 0 || input.pressed.enter) this.startAttack();
    } else if (this.phase === 'attack') this.attackTime += dt;
    else if (this.phase === 'win') {
      this.winT += dt;
      for (const c of this.cops) {
        c.t += dt; const b = c.target; const u = Math.min(1, c.t / 1.5);
        c.x = lerp(c.sx, b.x + 2.2, u); c.z = b.z; c.level = b.level; c.yaw = Math.atan2(b.x - c.x, 0.001);
        c.fig.pose({ walk: u < 1 ? c.t * 12 : 0, amp: u < 1 ? 0.8 : 0, armR: u >= 1 ? 1.5 : null }); c.fig.setExpr('smirk');
        this.placeFig(c);
        if (u >= 1 && b.state === 'defeated') { b.state = 'arrested'; this.popup('Gearresteerd!', b.x, this.actorY(b) + 6, b.z, 'blue'); }
      }
      if (this.winT > 6 && !this.winShown) { this.winShown = true; this.onWin && this.onWin(); }
    }

    this.updateKevin(dt, input);
    if (this.phase !== 'prep') for (const b of this.bandits) this.updateBandit(b, dt);

    // vallen animeren
    for (const t of this.traps) {
      t.anim += dt;
      if (t.state === 'pile') {
        for (const b of t.pileBricks) b.position.y = b.userData.baseY + Math.abs(Math.sin(this.t * 5 + b.userData.ph)) * 0.35;
        t.bar.visible = t.progress > 0; t.barFill.scale.x = Math.max(0.01, t.progress * 2.9); t.barFill.position.x = -1.45 + t.progress * 1.45;
        t.bar.lookAt(this.camera.position);
      } else if (t.state === 'armed') {
        t.popT = Math.min(1, (t.popT || 0) + dt * 3);
        const s = t.popT < 1 ? 1 + Math.sin(t.popT * Math.PI) * 0.4 : 1; t.model.scale.setScalar(Math.max(0.01, t.popT * s));
        if (t.pivot) t.pivot.rotation.x = Math.sin(this.t * 1.5 + t.x) * 0.06;
        if (t.fan) t.fan.rotation.z += dt * 15;
        if (t.flame) t.flame.scale.set(1, 1 + Math.sin(this.t * 30) * 0.3, 1);
        if (t.glow) t.glow.material.emissiveIntensity = 1.5 + Math.sin(this.t * 6);
        if (t.spider) t.spider.position.y = Math.abs(Math.sin(this.t * 3)) * 0.2;
      } else if (t.state === 'fired') {
        t.timer -= dt;
        if (t.pivot) {
          if (t.type === 'paint') t.pivot.rotation.x = Math.sin(t.anim * 6) * 1.2 * Math.max(0, t.timer / 5);
          else t.obj.position.y = Math.max(-11.5, -7.5 - t.anim * 18);
        }
        if (t.timer < 1) t.model.scale.setScalar(Math.max(0.01, t.timer));
        if (t.timer <= 0) {
          t.state = 'pile'; t.model.visible = false; t.pile.visible = true; t.progress = 0;
          if (t.obj) t.obj.position.y = -7.5; if (t.pivot) t.pivot.rotation.x = 0;
          t.model.parent.remove(t.model); t.model = this.trapModel(t); t.model.visible = false; this.lvl(t.level).add(t.model);
        }
      }
    }

    // kogeltjes
    for (let i = this.pellets.length - 1; i >= 0; i--) {
      const p = this.pellets[i]; p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt; p.mesh.position.set(p.x, p.y, p.z);
      let hit = false;
      for (const b of this.bandits) if (b.state === 'chase' && this.near(b, p, 1.3)) { this.stun(b, 1.2, 'AU!'); Sfx.hurt(b.name === 'marv'); hit = true; break; }
      if (hit || p.life <= 0) { this.root.remove(p.mesh); this.pellets.splice(i, 1); }
    }

    // noppen
    for (let i = this.studList.length - 1; i >= 0; i--) {
      const s = this.studList[i]; s.age += dt; s.spin += dt * 4;
      if (!s.fixed) {
        s.vy -= 35 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        const fl = (inRamp(s.x, s.z) ? rampY(s.z) : s.level * L1) + 0.5;
        if (s.y < fl) { s.y = fl; s.vy *= -0.45; s.vx *= 0.8; s.vz *= 0.8; if (Math.abs(s.vy) < 1.5) s.vy = 0; }
        const tmp = { x: s.x, z: s.z, level: s.level, r: 0.4 }; collide(tmp); s.x = tmp.x; s.z = tmp.z;
        s.life -= dt; if (s.life <= 0) { s.mesh.parent.remove(s.mesh); this.studList.splice(i, 1); continue; }
        s.mesh.visible = !(s.life < 2 && Math.sin(this.t * 30) > 0);
      }
      s.mesh.position.set(s.x, s.y + (s.fixed ? Math.sin(this.t * 3 + s.x) * 0.15 : 0), s.z);
      s.mesh.rotation.y = s.spin;
    }

    this.updateFx(dt);
    this.updatePops(dt);

    this.shownStuds += (this.studs - this.shownStuds) * Math.min(1, dt * 8);
    if (Math.abs(this.studs - this.shownStuds) < 1) this.shownStuds = this.studs;
    this.setCamera(false, dt);
    this.updateCutaway();
    this.updateHUD();
  }

  updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.life -= dt;
      if (f.life <= 0) { f.mesh.parent && f.mesh.parent.remove(f.mesh); this.fx.splice(i, 1); continue; }
      const m = f.mesh;
      f.vy -= 32 * dt; m.position.x += f.vx * dt; m.position.y += f.vy * dt; m.position.z += f.vz * dt;
      m.rotation.x += f.vr.x * dt; m.rotation.y += f.vr.y * dt; m.rotation.z += f.vr.z * dt;
      if (m.position.y < f.floor + 0.3) { m.position.y = f.floor + 0.3; f.vy *= -0.35; f.vx *= 0.7; f.vz *= 0.7; f.vr.multiplyScalar(0.5); }
      if (f.life < 0.4) m.scale.setScalar(f.life / 0.4);
    }
  }

  updatePops(dt) {
    const v = new THREE.Vector3();
    const wrap = document.getElementById('wrap').getBoundingClientRect();
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]; p.life -= dt; p.pos.y += dt * 2.2;
      if (p.life <= 0) { p.el.remove(); this.pops.splice(i, 1); continue; }
      v.copy(p.pos).project(this.camera);
      p.el.style.left = ((v.x + 1) / 2 * wrap.width) + 'px';
      p.el.style.top = ((1 - v.y) / 2 * wrap.height) + 'px';
      p.el.style.opacity = Math.min(1, p.life / 0.4);
      p.el.style.display = v.z > 1 ? 'none' : '';
    }
  }

  // ------------------------------------------------------------------
  // Camera & doorkijk
  setCamera(instant, dt = 1) {
    let focus = this.kevin;
    if (this.phase === 'win' && this.cops.length) focus = this.bandits[this.winT < 3 ? 0 : 1];
    const fy = this.actorY(focus);
    const outsideFront = focus.z > 20.5, backyard = focus.z < -20.5;
    const dist = outsideFront ? 30 : backyard ? 14 : 24, height = outsideFront ? 24 : backyard ? 34 : 26;
    this.camTarget.set(focus.x, fy + 2, focus.z);
    const want = new THREE.Vector3(focus.x * 0.85, fy + height, focus.z + dist);
    if (instant) this.camPos.copy(want); else this.camPos.lerp(want, Math.min(1, dt * 4));
    this.camera.position.copy(this.camPos);
    if (this.shake > 0) this.camera.position.add(new THREE.Vector3(rand(-1, 1), rand(-1, 1), 0).multiplyScalar(this.shake * 1.5));
    this.lookAt = this.lookAt || this.camTarget.clone();
    if (instant) this.lookAt.copy(this.camTarget); else this.lookAt.lerp(this.camTarget, Math.min(1, dt * 6));
    this.camera.lookAt(this.lookAt);
    this.W.sun.position.set(focus.x - 40, 80, focus.z + 50); this.W.sun.target.position.set(focus.x, 0, focus.z);
  }

  updateCutaway() {
    let focus = this.kevin;
    if (this.phase === 'win' && this.cops.length) focus = this.bandits[this.winT < 3 ? 0 : 1];
    const g = this.W.groups;
    const front = focus.z > 20.5, back = focus.z < -20.5;
    const up = !front && !back && (focus.level === 1 || (inRamp(focus.x, focus.z) && rampY(focus.z) > 8));
    g.front.target = front ? 1 : 0;
    g.roof.target = front ? 1 : 0;
    g.upper.target = front || up ? 1 : 0;
    g.back.target = back ? 0 : 1;
    // dingen op de bovenverdieping alleen tonen als die verdieping zichtbaar is
    const showUp = g.upper.opacity > 0.4;
    this.upRoot.visible = showUp;
    for (const b of this.bandits) if (b.state !== 'waiting' && b.state !== 'broken' && b.state !== 'reform') b.fig.root.visible = b.level === 0 || showUp || inRamp(b.x, b.z);
    if (this.kevin.level === 1 && !showUp && this.kevin.state === 'play') this.kevin.fig.root.visible = true;
  }

  // ------------------------------------------------------------------
  updateHUD() {
    const k = this.kevin;
    $('studCount').textContent = Math.round(this.shownStuds).toLocaleString('nl-NL');
    $('tkFill').style.width = Math.min(100, this.studs / TRUE_KEVIN * 100) + '%';
    const center = $('hudCenter');
    if (this.phase === 'prep') {
      const mins = 19 * 60 + 30 + (1 - this.prepLeft / PREP_TIME) * 90;
      const txt = `${Math.floor(mins / 60)}:${String(Math.floor(mins % 60)).padStart(2, '0')}`;
      if (center.dataset.mode !== 'clock') { center.dataset.mode = 'clock'; center.innerHTML = '<div class="clock"></div><div class="hint">Bouw vallen! Om 21:00 komen de bandieten · <kbd>Enter</kbd> = nu beginnen</div>'; }
      const c = center.querySelector('.clock'); c.textContent = txt; c.classList.toggle('late', this.prepLeft < 15);
    } else {
      if (center.dataset.mode !== 'bandits') {
        center.dataset.mode = 'bandits';
        center.innerHTML = this.bandits.map(b => `<div class="bandit"><b>${b.name === 'harry' ? 'HARRY' : 'MARV'}</b><span class="hearts" data-n="${b.name}"></span></div>`).join('');
      }
      for (const b of this.bandits) {
        const h = center.querySelector(`[data-n="${b.name}"]`);
        const html = Array.from({ length: MAX_PRIDE }, (_, i) => `<i class="${i < b.pride ? 'on' : ''}"></i>`).join('');
        if (h.innerHTML !== html) h.innerHTML = html;
      }
    }
    const armed = this.traps.filter(t => t.state === 'armed').length;
    $('hudRight').innerHTML = `<div class="traps">VALLEN ${armed}/${this.traps.length}</div>` +
      `<div class="${k.screamCd > 0 ? 'off' : ''}">GIL [Q] ${k.screamCd > 0 ? Math.ceil(k.screamCd) + 's' : 'KLAAR'}</div>` +
      `<div class="${this.hasGun ? '' : 'off'}">BB-GEWEER ${this.hasGun ? '[F]' : '?'}</div>` +
      `<div class="${this.tvCd > 0 ? 'off' : ''}">TV ${this.tvCd > 0 ? Math.ceil(this.tvCd) + 's' : 'KLAAR'}</div>`;
    const pr = this.prompt();
    const pe = $('prompt');
    if (pr) { pe.innerHTML = pr; pe.classList.remove('hidden'); } else pe.classList.add('hidden');
    this.drawMap();
  }

  prompt() {
    const k = this.kevin;
    if (k.state !== 'play' || this.phase === 'win') return null;
    const p = this.nearestPile(k);
    if (p) return `Houd <kbd>E</kbd> ingedrukt: bouw <b>${p.name}</b>`;
    if (this.nearGun(k)) return "<kbd>E</kbd> Pak Buzz' BB-geweer";
    if (this.nearTV(k)) return this.tvCd > 0 ? 'De tv laadt op…' : "<kbd>E</kbd> Zet 'Engelen met Smerige Zielen' aan";
    if (this.nearSled(k)) return '<kbd>E</kbd> Met de slee de trap af!';
    if (this.nearestBreakable(k)) return '<kbd>F</kbd> Mep het kapot voor noppen';
    return null;
  }

  drawMap() {
    const cv = $('minimap'); const c = cv.getContext('2d'); const w = cv.width, h = cv.height;
    c.clearRect(0, 0, w, h);
    const X = (x) => w / 2 + x * (w / 96), Z = (z) => h / 2 + z * (h / 84);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1;
    c.strokeRect(X(-32), Z(-20), X(32) - X(-32), Z(20) - Z(-20));
    c.beginPath(); c.moveTo(X(-8), Z(-20)); c.lineTo(X(-8), Z(20)); c.moveTo(X(8), Z(-20)); c.lineTo(X(8), Z(20)); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(X(-4), Z(-14), X(4) - X(-4), Z(4) - Z(-14));
    for (const t of this.traps) { c.fillStyle = t.state === 'armed' ? '#9fe870' : t.state === 'pile' ? '#ffd84a' : '#666'; c.fillRect(X(t.x) - 2, Z(t.z) - 2, 4, 4); }
    for (const b of this.bandits) { if (b.state === 'waiting') continue; c.fillStyle = b.pride > 0 ? '#ff4a4a' : '#888'; c.beginPath(); c.arc(X(b.x), Z(b.z), 4, 0, 7); c.fill(); if (b.level) { c.strokeStyle = '#fff'; c.stroke(); } }
    const k = this.kevin; c.fillStyle = '#fff'; c.beginPath(); c.arc(X(k.x), Z(k.z), 4.5, 0, 7); c.fill();
    c.font = '10px sans-serif'; c.fillStyle = '#fff'; c.fillText(k.level ? 'BOVEN' : 'BENEDEN', 4, h - 4);
  }
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
