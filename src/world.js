// De wereld: het huis van de McCallisters, de tuinen en de straat – alles van bouwstenen.
import * as THREE from 'three';
import { C, mat, GEO, Batch, brickMesh, studTexture } from './lego.js';

export const L1 = 13;          // hoogte van de bovenverdieping
export const RAMP = { x0: -4, x1: 4, z0: -14, z1: 4, h: L1 };   // grote trap: onder bij z=4, boven bij z=-14

// Botsingsmuren: {x0,x1,z0,z1,lv:[levels]}
export const WALLS = [];
function wallBox(x0, x1, z0, z1, lv = [0, 1]) { WALLS.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), lv }); }

// Kamers voor de navigatie van de bandieten
export const ROOMS = [
  { id: 'front', lv: 0, test: (x, z) => z > 20.4 },
  { id: 'back', lv: 0, test: (x, z) => z < -20.4 },
  { id: 'living', lv: 0, test: (x, z) => x < -8 },
  { id: 'kitchen', lv: 0, test: (x, z) => x > 8 },
  { id: 'foyer', lv: 0, test: () => true },
  { id: 'parents', lv: 1, test: (x) => x < -8 },
  { id: 'buzz', lv: 1, test: (x) => x > 8 },
  { id: 'landing', lv: 1, test: () => true },
];
// Doorgangen: a <-> b, punt en richting (van a naar b)
export const DOORS = [
  { a: 'front', b: 'foyer', x: 0, z: 20, nx: 0, nz: -1 },
  { a: 'back', b: 'kitchen', x: 20, z: -20, nx: 0, nz: 1 },
  { a: 'foyer', b: 'living', x: -8, z: 10, nx: -1, nz: 0 },
  { a: 'foyer', b: 'kitchen', x: 8, z: 10, nx: 1, nz: 0 },
  { a: 'foyer', b: 'stairs', x: 0, z: 5.5, nx: 0, nz: -1 },
  { a: 'stairs', b: 'landing', x: 0, z: -15, nx: 0, nz: -1 },
  { a: 'landing', b: 'parents', x: -8, z: -16, nx: -1, nz: 0 },
  { a: 'landing', b: 'buzz', x: 8, z: -16, nx: 1, nz: 0 },
];

export function inRamp(x, z) { return x > RAMP.x0 && x < RAMP.x1 && z > RAMP.z0 && z < RAMP.z1; }
export function rampY(z) { return THREE.MathUtils.clamp((RAMP.z1 - z) / (RAMP.z1 - RAMP.z0), 0, 1) * RAMP.h; }
export function roomOf(e) {
  if (inRamp(e.x, e.z)) return 'stairs';
  for (const r of ROOMS) if (r.lv === e.level && r.test(e.x, e.z)) return r.id;
  return e.level ? 'landing' : 'foyer';
}

// Posities van interactieve dingen
export const SPOTS = {
  kevinStart: { x: -18, z: 4, level: 1 },
  harryStart: { x: -2, z: 44, level: 0 },
  marvStart: { x: 22, z: -37, level: 0 },
  tv: { x: -14, z: -15, level: 0 },
  gun: { x: 28, z: 12, level: 1 },
  sled: { x: 6, z: -17, level: 1 },
  mirror: { x: -28, z: 13, level: 1 },
};

export const TRAPS = [
  { id: 'stoep', type: 'ice', name: 'IJzige stoep', x: 0, z: 25, level: 0 },
  { id: 'klink', type: 'knob', name: 'Gloeiende deurklink', x: 0, z: 18, level: 0 },
  { id: 'autos', type: 'cars', name: 'Speelgoedautootjes', x: 0, z: 12, level: 0 },
  { id: 'verf', type: 'paint', name: 'Zwaaiend verfblik', x: 0, z: 7.2, level: 0 },
  { id: 'ballen', type: 'ornaments', name: 'Kerstballen', x: -14, z: 10, level: 0 },
  { id: 'spijker', type: 'nail', name: 'Spijker', x: -22, z: -4, level: 0 },
  { id: 'ijzer', type: 'iron', name: 'Strijkijzer', x: 20, z: 4, level: 0 },
  { id: 'brander', type: 'torch', name: 'Brander', x: 20, z: -16.5, level: 0 },
  { id: 'tuinijs', type: 'ice', name: 'IJzige achtertrap', x: 20, z: -25, level: 0 },
  { id: 'verf2', type: 'paint', name: 'Zwaaiend verfblik', x: -1.5, z: -18, level: 1 },
  { id: 'veren', type: 'feathers', name: 'Lijm & veren', x: -13, z: -16, level: 1 },
  { id: 'spin', type: 'spider', name: 'Tarantula', x: 14, z: -15, level: 1 },
];

export const BREAKABLES = [
  { type: 'gift', x: -23, z: -12, level: 0 }, { type: 'gift', x: -26, z: -10, level: 0 }, { type: 'gift', x: -29, z: -11, level: 0 },
  { type: 'lamp', x: -30, z: 4, level: 0 }, { type: 'vase', x: -5, z: 17, level: 0 }, { type: 'plant', x: 5.5, z: 17, level: 0 },
  { type: 'chair', x: 15, z: 7, level: 0 }, { type: 'milk', x: 29, z: -6, level: 0 }, { type: 'trash', x: 30, z: 17, level: 0 },
  { type: 'lamp', x: -30, z: -2, level: 1 }, { type: 'suitcase', x: -12, z: 16, level: 1 }, { type: 'toybox', x: 20, z: 16, level: 1 },
  { type: 'plant', x: 6, z: 16, level: 1 }, { type: 'snowman', x: -16, z: 31, level: 0 }, { type: 'snowman', x: 12, z: -32, level: 0 },
  { type: 'gift', x: -6, z: 30, level: 0 }, { type: 'trash', x: 28, z: -26, level: 0 },
];

// ---------------------------------------------------------------------
// Groepen die kunnen vervagen (doorkijk zoals in de games)
class FadeGroup {
  constructor(name) { this.name = name; this.group = new THREE.Group(); this.group.name = name; this.mats = new Map(); this.opacity = 1; this.target = 1; }
  m(color, opts = {}) {
    const key = color + JSON.stringify(opts);
    if (!this.mats.has(key)) { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.32, ...opts }); m.userData.base = opts.opacity ?? 1; this.mats.set(key, m); }
    return this.mats.get(key);
  }
  batchMat() { return this.m(0xffffff); }
  update(dt) {
    if (Math.abs(this.opacity - this.target) < 0.001) return;
    this.opacity += Math.sign(this.target - this.opacity) * Math.min(Math.abs(this.target - this.opacity), dt * 3.5);
    const op = this.opacity;
    for (const m of this.mats.values()) { const base = m.userData.base; m.transparent = op < 0.999 || base < 1; m.opacity = op * base; m.depthWrite = op > 0.5 && base >= 1; }
    this.group.visible = op > 0.02;
  }
  set(v, instant) { this.target = v; if (instant) { this.opacity = v ? v - 0.01 : 0.01; this.update(1); } }
}

// ---------------------------------------------------------------------
export function buildWorld(scene) {
  const W = { scene, groups: {}, windowMats: [], lightMats: [], roomLights: [], fire: [], treeLights: [], flicker: [] };
  const G = (n) => (W.groups[n] ||= new FadeGroup(n));
  for (const n of ['base', 'ground', 'upper', 'front', 'back', 'roof']) scene.add(G(n).group);

  // --- Lucht, maan, sterren
  scene.background = new THREE.Color(0x0c1638);
  scene.fog = new THREE.Fog(0x14204a, 90, 220);
  const starGeo = new THREE.BufferGeometry();
  const sp = [];
  for (let i = 0; i < 900; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * 0.45 + 0.05;
    sp.push(Math.cos(th) * Math.cos(ph) * 300, Math.sin(ph) * 300, Math.sin(th) * Math.cos(ph) * 300);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  W.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, fog: false }));
  scene.add(W.stars);
  W.moon = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d0, fog: false }));
  W.moon.position.set(-120, 140, -180); scene.add(W.moon);

  // --- Licht
  W.hemi = new THREE.HemisphereLight(0x9ab0ff, 0x403840, 1.5); scene.add(W.hemi);
  W.sun = new THREE.DirectionalLight(0xc8d4ff, 2.2);
  W.sun.position.set(-40, 80, 50); W.sun.castShadow = true;
  W.sun.shadow.mapSize.set(2048, 2048);
  Object.assign(W.sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 250 });
  W.sun.shadow.bias = -0.0008; W.sun.shadow.normalBias = 0.04;
  scene.add(W.sun); scene.add(W.sun.target);
  W.amb = new THREE.AmbientLight(0xffffff, 0.45); scene.add(W.amb);

  // --- Grond: besneeuwde bouwplaat, straat, stoep
  const baseTex = studTexture('#eef3fa'); baseTex.repeat.set(200, 200);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: baseTex, roughness: 0.6 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.position.y = -0.01;
  G('base').group.add(ground);
  const road = new Batch();
  for (let x = -200; x < 200; x += 8) road.box(x + 4, 0, 50, 8, 0.1, 12, 0x505866, { gap: 0 });
  for (let x = -200; x < 200; x += 12) road.box(x + 4, 0.1, 50, 5, 0.05, 0.6, 0xe8e2a0, { gap: 0 });
  for (let x = -200; x < 200; x += 4) road.box(x + 2, 0, 42, 4, 0.3, 4, 0xc8ccd2, { studs: false });
  for (let x = -200; x < 200; x += 4) road.box(x + 2, 0, 58, 4, 0.3, 4, 0xc8ccd2, { studs: false });
  // tuinpad naar de voordeur
  for (let z = 24; z < 40; z += 2) road.box(0, 0, z + 1, 4, 0.25, 2, 0xb8b0a0, { studs: false });
  G('base').group.add(road.build(mat(0xffffff)));

  // --- Het huis
  buildHouse(W, G);
  buildInterior(W, G);
  buildYard(W, G);
  buildNeighbourhood(W, G);

  // --- Sneeuw
  const n = 2500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 140; pos[i * 3 + 1] = Math.random() * 60; pos[i * 3 + 2] = (Math.random() - 0.5) * 140; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  W.snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false }));
  scene.add(W.snow);

  W.setNight = (night, lit = true) => {
    scene.background.set(night ? 0x0c1638 : 0x8fb8e0);
    scene.fog.color.set(night ? 0x14204a : 0xc8dcef);
    W.hemi.color.set(night ? 0x9ab0ff : 0xdfeaff); W.hemi.intensity = night ? 1.5 : 1.8;
    W.sun.color.set(night ? 0xc8d4ff : 0xfff2dd); W.sun.intensity = night ? 2.2 : 3;
    W.stars.visible = night; W.moon.visible = night;
    W.setLights(lit);
  };
  W.setLights = (on) => {
    W.lightsOn = on;
    for (const m of W.windowMats) { m.emissiveIntensity = on ? 1 : 0; }
    for (const l of W.roomLights) l.visible = on;
    for (const m of W.lightMats) m.visible = on;
  };
  W.lightsOn = true;

  W.update = (dt, t, camPos) => {
    for (const g of Object.values(W.groups)) g.update(dt);
    // sneeuw rond de camera
    const p = W.snow.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * (4 + (i % 5));
      let x = p.getX(i) + Math.sin(t + i) * dt * 0.8;
      if (y < 0) { y = 60; }
      p.setY(i, y); p.setX(i, x);
    }
    p.needsUpdate = true;
    W.snow.position.set(Math.round(camPos.x / 140) * 140 * 0 + camPos.x * 0.0, 0, 0);
    // kerstlichtjes knipperen
    W.treeLights.forEach((m, i) => { m.emissiveIntensity = W.lightsOn && Math.sin(t * 3 + i * 1.7) > -0.3 ? 2.2 : 0.05; });
    for (const f of W.fire) { f.scale.y = 0.8 + Math.sin(t * 13 + f.userData.ph) * 0.25 + Math.sin(t * 7) * 0.1; }
    for (const l of W.flicker) l.intensity = l.userData.base * (0.8 + Math.sin(t * 11) * 0.1 + Math.sin(t * 17) * 0.1);
  };
  return W;
}

// ---------------------------------------------------------------------
function windowUnit(W, parent, gm, x, y, z, facing, lit = true) {
  // facing: 'z+' / 'z-' / 'x+' / 'x-' ; raam 4 breed, 6 hoog, onderkant y
  const g = new THREE.Group();
  const white = gm(C.white), black = gm(0x15181c);
  const glassMat = gm(0xffe6a0, { emissive: 0xffc860, emissiveIntensity: 1, roughness: 0.1, transparent: true, opacity: 0.62 });
  if (!W.windowMats.includes(glassMat)) W.windowMats.push(glassMat);
  const add = (geo, m, px, py, pz, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  add(GEO.box, glassMat, 0, 3, -0.1, 4, 6, 0.2);
  // kozijn
  add(GEO.box, white, 0, 6.2, 0.25, 4.8, 0.4, 0.6); add(GEO.box, white, 0, -0.15, 0.4, 5.4, 0.3, 1.0);
  add(GEO.box, white, -2.2, 3, 0.25, 0.4, 6.4, 0.6); add(GEO.box, white, 2.2, 3, 0.25, 0.4, 6.4, 0.6);
  // roedes
  add(GEO.box, white, 0, 3, 0.1, 4, 0.25, 0.25); add(GEO.box, white, 0, 1.5, 0.1, 4, 0.15, 0.2); add(GEO.box, white, 0, 4.5, 0.1, 4, 0.15, 0.2);
  add(GEO.box, white, -0.67, 3, 0.1, 0.15, 6, 0.2); add(GEO.box, white, 0.67, 3, 0.1, 0.15, 6, 0.2);
  // zwarte luiken
  for (const s of [-1, 1]) {
    add(GEO.box, black, s * 3.3, 3, 0.35, 1.8, 6.2, 0.25);
    for (let i = 0; i < 5; i++) add(GEO.box, gm(0x2a2e34), s * 3.3, 0.8 + i * 1.1, 0.5, 1.5, 0.12, 0.08);
  }
  // sneeuw op de vensterbank
  add(GEO.box, gm(C.snow), 0, 0.12, 0.45, 5.2, 0.2, 0.9);
  // kerstkrans met rode strik
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.28, 8, 18), gm(C.darkGreen));
  wreath.position.set(0, 3.2, 0.55); g.add(wreath);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(GEO.sphere, gm(C.red)); b.scale.setScalar(0.13); const a = i / 6 * Math.PI * 2; b.position.set(Math.cos(a) * 0.9, 3.2 + Math.sin(a) * 0.9, 0.8); g.add(b); }
  add(GEO.box, gm(C.red), 0, 2.2, 0.8, 0.8, 0.5, 0.2);
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[facing];
  parent.add(g);
  return g;
}

function buildHouse(W, G) {
  const brick = C.brick;
  const front = G('front'), back = G('back'), upper = G('upper'), ground = G('ground'), roof = G('roof');
  const gmF = (c, o) => front.m(c, o), gmB = (c, o) => back.m(c, o), gmU = (c, o) => upper.m(c, o);

  // ---- Voorgevel (z = 20)
  const fb = new Batch();
  const fWinX0 = [-24, -14, 14, 24], fWinX1 = [-24, -14, 0, 14, 24];
  fb.wall('x', 20, -32, 32, 0, 12, brick, { holes: [[-2.6, 2.6, 0, 8.4], ...fWinX0.map(x => [x - 2, x + 2, 3, 9])], topStuds: false });
  fb.box(0, 12, 20, 65, 1, 1.4, C.cream, { studs: false });
  fb.wall('x', 20, -32, 32, 13, 25, brick, { holes: fWinX1.map(x => [x - 2, x + 2, 16, 22]), topStuds: false });
  fb.box(0, 25, 20.2, 66, 0.8, 1.6, C.cream, { studs: true });
  // witte hoekstenen
  for (let y = 0; y < 25; y += 2.4) { fb.box(-31.6, y, 20.4, 1.6, 1.15, 0.6, C.cream, { studs: false }); fb.box(31.6, y + 1.2, 20.4, 1.6, 1.15, 0.6, C.cream, { studs: false }); }
  front.group.add(fb.build(front.batchMat()));
  for (const x of fWinX0) windowUnit(W, front.group, gmF, x, 3, 20.1, 'z+');
  for (const x of fWinX1) windowUnit(W, front.group, gmF, x, 16, 20.1, 'z+');
  // voordeur met portiek
  const porch = new Batch();
  porch.box(0, 0, 22.6, 11, 0.4, 5, 0xd8d8d8, { studs: false });
  porch.box(0, 0.4, 21.6, 9, 0.3, 3, 0xe4e4e4, { studs: false });
  porch.box(0, 8.4, 20.9, 9.4, 0.8, 1.2, C.white, { studs: false });
  porch.box(0, 9.3, 22.2, 11, 0.9, 4.4, C.white, { studs: false });
  for (let k = 0; k < 4; k++) porch.box(0, 10.2 + k * 0.6, 22.2, 11 - k * 2.8, 0.6, 4.4, C.white, { studs: k === 3, gap: 0.02 });
  front.group.add(porch.build(front.batchMat()));
  for (const s of [-1, 1]) {
    const col = new THREE.Mesh(GEO.cyl, gmF(C.white)); col.scale.set(0.5, 8.9, 0.5); col.position.set(s * 4.4, 0.7 + 4.45, 23.8); col.castShadow = true; front.group.add(col);
    const cap = brickMesh(1.6, 0.4, 1.6, C.white, false, gmF(C.white)); cap.position.set(s * 4.4, 8.9, 23.8); front.group.add(cap);
  }
  // deur (open naar binnen)
  const doorPivot = new THREE.Group(); doorPivot.position.set(-2.5, 0, 19.6);
  const door = new THREE.Mesh(GEO.box, ground.m(0x1e3b2a)); door.scale.set(5, 8.2, 0.4); door.position.set(2.5, 4.1, 0); door.castShadow = true;
  doorPivot.add(door); doorPivot.rotation.y = -1.35;
  const wreathD = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.3, 8, 18), ground.m(C.darkGreen)); wreathD.position.set(2.5, 5.5, 0.35); doorPivot.add(wreathD);
  const knob = new THREE.Mesh(GEO.sphere, ground.m(C.gold, { metalness: 0.6 })); knob.scale.setScalar(0.25); knob.position.set(4.3, 4, 0.3); doorPivot.add(knob);
  ground.group.add(doorPivot);
  W.frontDoor = doorPivot;
  // bovenlicht boven de deur
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.3, 20, 1, false, -Math.PI / 2, Math.PI), gmF(0xffe6a0, { emissive: 0xffc860, emissiveIntensity: 1 }));
  fan.rotation.x = Math.PI / 2; fan.position.set(0, 8.4, 20.2); front.group.add(fan);
  W.windowMats.push(fan.material);
  // portieklamp
  const porchLight = new THREE.PointLight(0xffc27a, 30, 18, 1.6); porchLight.position.set(0, 7.5, 23.5); front.group.add(porchLight); W.roomLights.push(porchLight);

  // ---- Achtergevel (z = -20)
  const bb = new Batch();
  const bWin0 = [-24, -14, 0, 28], bWin1 = [-24, -14, 14, 24];
  bb.wall('x', -20, -32, 32, 0, 12, brick, { holes: [[17.4, 22.6, 0, 8.4], ...bWin0.map(x => [x - 2, x + 2, 3, 9])], topStuds: false });
  back.group.add(bb.build(back.batchMat()));
  for (const x of bWin0) windowUnit(W, back.group, gmB, x, 3, -20.1, 'z-');
  const bdoor = new THREE.Mesh(GEO.box, back.m(0xf4f4f4)); bdoor.scale.set(0.4, 8.2, 5); bdoor.position.set(17.6, 4.1, -17.6); bdoor.rotation.y = 0; back.group.add(bdoor);
  const backSteps = new Batch(); backSteps.box(20, 0, -22.5, 7, 0.4, 5, 0xd0d0d0, { studs: false });
  back.group.add(backSteps.build(back.batchMat()));

  const ub = new Batch();
  ub.wall('x', -20, -32, 32, 13, 25, brick, { holes: bWin1.map(x => [x - 2, x + 2, 16, 22]), topStuds: false });
  ub.box(0, 12, -20, 65, 1, 1.4, C.cream, { studs: false });
  // zijmuren boven
  ub.wall('z', -32, -20, 20, 13, 25, brick, { holes: [[-6, -2, 16, 22], [6, 10, 16, 22]], topStuds: false });
  ub.wall('z', 32, -20, 20, 13, 25, brick, { holes: [[-6, -2, 16, 22], [6, 10, 16, 22]], topStuds: false });
  ub.box(-32, 12, 0, 1.4, 1, 41, C.cream, { studs: false }); ub.box(32, 12, 0, 1.4, 1, 41, C.cream, { studs: false });
  upper.group.add(ub.build(upper.batchMat()));
  for (const x of bWin1) windowUnit(W, upper.group, gmU, x, 16, -20.1, 'z-');
  for (const z of [-4, 8]) { windowUnit(W, upper.group, gmU, -32.1, 16, z, 'x-'); windowUnit(W, upper.group, gmU, 32.1, 16, z, 'x+'); }

  // ---- Zijmuren beneden (altijd zichtbaar)
  const sb = new Batch();
  sb.wall('z', -32, -20, 20, 0, 12, brick, { holes: [[-6, -2, 3, 9], [6, 10, 3, 9]], topStuds: false });
  sb.wall('z', 32, -20, 20, 0, 12, brick, { holes: [[-6, -2, 3, 9], [6, 10, 3, 9]], topStuds: false });
  ground.group.add(sb.build(ground.batchMat()));
  for (const z of [-4, 8]) { windowUnit(W, ground.group, (c, o) => ground.m(c, o), -32.1, 3, z, 'x-'); windowUnit(W, ground.group, (c, o) => ground.m(c, o), 32.1, 3, z, 'x+'); }

  // ---- Dak: getrapt, met sneeuw en lichtjes
  const rb = new Batch();
  for (let k = 0; k < 9; k++) {
    const w = 68 - k * 3.2, d = 44 - k * 3.2, y = 25.8 + k * 1.2;
    rb.box(0, y, 0, w, 1.2, d, k % 2 ? 0x3d414b : 0x474c57, { studs: false, gap: 0.02 });
    // sneeuw op de rand + noppen
    for (let x = -w / 2 + 0.8; x < w / 2; x += 1) { rb.stud(x, y + 1.2, d / 2 - 0.8, C.snow); rb.stud(x, y + 1.2, -d / 2 + 0.8, C.snow); }
    for (let z = -d / 2 + 1.8; z < d / 2 - 1; z += 1) { rb.stud(-w / 2 + 0.8, y + 1.2, z, C.snow); rb.stud(w / 2 - 0.8, y + 1.2, z, C.snow); }
  }
  rb.box(0, 25.8 + 9 * 1.2, 0, 68 - 9 * 3.2, 0.4, 44 - 9 * 3.2, C.snow, { studs: true });
  // schoorsteen
  for (let y = 26; y < 42; y += 1.2) rb.box(22, y, -6, 4, 1.2, 4, C.brick, { vary: 0.1, studs: y > 40.5 });
  roof.group.add(rb.build(roof.batchMat()));
  // lichtjes langs de dakrand
  const lightCols = [0xff3a3a, 0xffd23a, 0x3ab8ff, 0x5aff6a];
  const lmats = lightCols.map(c => roof.m(c, { emissive: c, emissiveIntensity: 2 }));
  W.treeLights.push(...lmats);
  for (let x = -33; x <= 33; x += 1.6) {
    for (const z of [22.1, -22.1]) { const b = new THREE.Mesh(GEO.sphere, lmats[Math.abs(Math.round(x / 1.6)) % 4]); b.scale.setScalar(0.28); b.position.set(x, 25.6, z); roof.group.add(b); }
  }
  // rook uit de schoorsteen is in de update

  // ---- Botsingen
  // voorgevel met deur
  wallBox(-32.5, -2.6, 19.5, 20.5, [0]); wallBox(2.6, 32.5, 19.5, 20.5, [0]); wallBox(-32.5, 32.5, 19.5, 20.5, [1]);
  wallBox(-32.5, 17.4, -20.5, -19.5, [0]); wallBox(22.6, 32.5, -20.5, -19.5, [0]); wallBox(-32.5, 32.5, -20.5, -19.5, [1]);
  wallBox(-32.5, -31.5, -20.5, 20.5); wallBox(31.5, 32.5, -20.5, 20.5);
  // portiekzuilen
  wallBox(-4.9, -3.9, 23.3, 24.3, [0]); wallBox(3.9, 4.9, 23.3, 24.3, [0]);
}

function buildInterior(W, G) {
  const ground = G('ground'), upper = G('upper');
  const gm0 = (c, o) => ground.m(c, o), gm1 = (c, o) => upper.m(c, o);

  // ---- Vloeren beneden
  const fl = new Batch();
  for (let x = -31; x < 31; x += 2) for (let z = -19; z < 19.5; z += 2) {
    let col;
    if (x < -8) col = (Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? 0x7a1f24 : 0x6d1a20;        // woonkamer: rood tapijt
    else if (x > 8) col = (Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? 0xf4f4f4 : 0x2a2e34;      // keuken: zwart-wit
    else col = (Math.floor(z / 2)) % 2 ? 0x8a5a33 : 0x7a4e2c;                                         // hal: hout
    fl.box(x + 1, -0.2, z + 1, 2, 0.2, 2, col, { gap: 0.03 });
  }
  ground.group.add(fl.build(ground.batchMat()));

  // Behang aan de binnenkant
  const wp = new Batch();
  const paper = (x0, x1, z0, z1, y0, y1, col) => wp.box((x0 + x1) / 2, y0, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, col, { gap: 0 });
  paper(-31.4, -31.2, -19.4, 19.4, 0, 12, 0x7a1a1f); paper(31.2, 31.4, -19.4, 19.4, 0, 12, 0xe8dfc4);
  ground.group.add(wp.build(ground.batchMat()));
  // behang tegen de achtermuur hoort bij de achtermuur (verdwijnt mee)
  const bp = new Batch();
  const bpaper = (x0, x1, col) => bp.box((x0 + x1) / 2, 0, -19.3, x1 - x0, 12, 0.2, col, { gap: 0 });
  bpaper(-31.4, -8.6, 0x7a1a1f); bpaper(8.6, 31.4, 0xe8dfc4); bpaper(-7.4, 7.4, 0x2f5d45);
  bp.box(0, 0, -19.05, 62.8, 0.8, 0.3, 0xf4f4f4, { gap: 0 });
  G('back').group.add(bp.build(G('back').batchMat()));

  // Binnenmuren beneden (x = ±8) met deuropening
  const iw = new Batch();
  iw.wall('z', -8, -20, 20, 0, 12, 0xd8c9a3, { holes: [[7, 13, 0, 8.5]], bw: 3, vary: 0.04 });
  iw.wall('z', 8, -20, 20, 0, 12, 0xd8c9a3, { holes: [[7, 13, 0, 8.5]], bw: 3, vary: 0.04 });
  ground.group.add(iw.build(ground.batchMat()));
  wallBox(-8.5, -7.5, -20, 7, [0]); wallBox(-8.5, -7.5, 13, 20, [0]);
  wallBox(7.5, 8.5, -20, 7, [0]); wallBox(7.5, 8.5, 13, 20, [0]);

  // ---- De grote trap met rode loper
  const st = new Batch();
  const steps = 18, rise = L1 / steps;
  for (let i = 0; i < steps; i++) {
    const z = RAMP.z1 - (i + 0.5) * (RAMP.z1 - RAMP.z0) / steps;
    st.box(0, 0, z, 8, (i + 1) * rise, 1, 0x6b3a1e, { gap: 0.02 });
    st.box(0, (i + 1) * rise, z, 4, 0.12, 1.02, 0x9b1a20, { gap: 0 });
  }
  // zijkanten van de trap (lambrisering)
  st.box(-4.3, 0, (RAMP.z0 + RAMP.z1) / 2, 0.6, 1, 18, 0x4a2410, { gap: 0 });
  st.box(4.3, 0, (RAMP.z0 + RAMP.z1) / 2, 0.6, 1, 18, 0x4a2410, { gap: 0 });
  ground.group.add(st.build(ground.batchMat()));
  // leuningen met spijlen
  const rail = new Batch();
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 18; i += 2) {
      const z = RAMP.z1 - i, y = (i / 18) * L1;
      rail.box(s * 4.3, y, z, 0.3, 3.2, 0.3, 0xf4f4f4, { gap: 0 });
    }
  }
  ground.group.add(rail.build(ground.batchMat()));
  for (const s of [-1, 1]) {
    const len = Math.hypot(18, L1);
    const r = new THREE.Mesh(GEO.box, gm0(0x4a2410)); r.scale.set(0.4, 0.4, len); r.position.set(s * 4.3, L1 / 2 + 3.2, (RAMP.z0 + RAMP.z1) / 2);
    r.rotation.x = Math.atan2(L1, 18); r.castShadow = true; ground.group.add(r);
  }
  wallBox(-4.8, -4.2, RAMP.z0, RAMP.z1, [0, 1]); wallBox(4.2, 4.8, RAMP.z0, RAMP.z1, [0, 1]);
  wallBox(-4.8, 4.8, -14.6, -14.0, [0]);
  wallBox(-4.8, 4.8, 4.0, 4.6, [1]);

  // ---- Meubels beneden
  const fu = new Batch();
  // open haard met schoorsteenmantel
  fu.box(-20, 0, -18.6, 8, 7, 1.6, C.brick, { vary: 0.1, studs: false });
  fu.box(-20, 7, -18.2, 9, 0.6, 2.4, C.cream, { studs: true });
  fu.box(-20, 0, -17.9, 4, 3.5, 0.4, 0x120a05, { gap: 0 });
  for (let i = 0; i < 3; i++) fu.box(-22.5 + i * 2.5, 5, -17, 0.9, 1.6, 0.3, i % 2 ? C.green : C.red, { gap: 0 });
  // bank en stoel
  fu.box(-20, 0, 6, 10, 2, 3, 0x6b4a2b, { studs: true }); fu.box(-20, 2, 7.3, 10, 2.2, 0.8, 0x6b4a2b, { studs: true });
  fu.box(-25.5, 2, 6, 1, 1, 3, 0x5a3a20, { studs: true }); fu.box(-14.5, 2, 6, 1, 1, 3, 0x5a3a20, { studs: true });
  // tv-kast
  fu.box(-14, 0, -17.5, 6, 2.5, 2.4, 0x4a3020, { studs: true });
  // salontafel
  fu.box(-20, 0, 0, 5, 1.4, 3, 0x6b3a1e, { studs: true });
  // keuken: aanrecht langs de achtermuur, koelkast, tafel
  for (const [x0, x1] of [[9, 17], [23, 31]]) { fu.box((x0 + x1) / 2, 0, -18.4, x1 - x0, 3.6, 2.2, 0xf4f4f4, { studs: false }); fu.box((x0 + x1) / 2, 3.6, -18.4, x1 - x0, 0.4, 2.4, 0x6c6e68, { studs: true }); }
  fu.box(30, 0, -12, 2.6, 8, 3.6, 0xf4f4f4, { studs: true });
  fu.box(20, 0, 2, 7, 3, 4, 0x6b3a1e, { studs: true });
  // pizzadozen van Lil' Nero's op tafel
  fu.box(19, 3, 2, 2.4, 0.4, 2.4, 0xe0c79a, { studs: true }); fu.box(21.5, 3, 2.3, 2.4, 0.4, 2.4, 0xe0c79a, { studs: true });
  // hal: tafeltje, kapstok
  fu.box(-6, 0, 17, 2, 2.5, 2, 0x6b3a1e, { studs: true });
  fu.box(6, 0, -18, 2, 7, 1, 0x4a2410, { studs: true });
  ground.group.add(fu.build(ground.batchMat()));
  // botsingen meubels
  wallBox(-24, -16, -19.5, -16.8, [0]); wallBox(-25, -15, 4.3, 7.8, [0]); wallBox(-22.6, -17.4, -1.6, 1.6, [0]);
  wallBox(9, 17, -19.5, -17.2, [0]); wallBox(23, 31, -19.5, -17.2, [0]); wallBox(28.6, 31.5, -14, -10, [0]);
  wallBox(16.4, 23.6, 0, 4, [0]); wallBox(-17.2, -10.8, -19.5, -16.2, [0]);

  // Kerstboom (woonkamer, achterhoek)
  const tree = new THREE.Group(); tree.position.set(-27, 0, -13);
  const tb = new Batch();
  tb.box(0, 0, 0, 1.4, 1.5, 1.4, 0x5a3418);
  for (let i = 0; i < 7; i++) { const s = 7 - i * 0.9; tb.box(0, 1.5 + i * 1.3, 0, s, 1.3, s, i % 2 ? 0x1f6e32 : 0x237841, { studs: true, vary: 0.05 }); }
  tree.add(tb.build(ground.batchMat()));
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), gm0(0xffd84a, { emissive: 0xffc800, emissiveIntensity: 1.5 })); star.position.y = 11; tree.add(star);
  const orn = [0xff3a3a, 0xffd23a, 0x3ab8ff, 0xff7ae0].map(c => gm0(c, { emissive: c, emissiveIntensity: 2 }));
  W.treeLights.push(...orn);
  for (let i = 0; i < 40; i++) {
    const lvl = i % 7, s = (7 - lvl * 0.9) / 2 + 0.15, a = i * 2.4;
    const b = new THREE.Mesh(GEO.sphere, orn[i % 4]); b.scale.setScalar(0.25);
    b.position.set(Math.cos(a) * s, 2.1 + lvl * 1.3, Math.sin(a) * s); tree.add(b);
  }
  ground.group.add(tree);
  wallBox(-31, -23.5, -17, -9, [0]);
  const treeLight = new THREE.PointLight(0xffb070, 25, 16, 1.6); treeLight.position.set(-25, 5, -10); ground.group.add(treeLight); W.roomLights.push(treeLight);

  // haardvuur
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 6), gm0(i % 2 ? 0xff8a1a : 0xffd84a, { emissive: i % 2 ? 0xff5a00 : 0xffb000, emissiveIntensity: 2 }));
    f.position.set(-21.2 + i * 0.6, 0.9, -17.6); f.userData.ph = i * 2; W.fire.push(f); ground.group.add(f);
  }
  const fireLight = new THREE.PointLight(0xff8030, 20, 14, 1.8); fireLight.position.set(-20, 2, -15); fireLight.userData.base = 20; W.flicker.push(fireLight); ground.group.add(fireLight);

  // tv (de gangsterfilm)
  const tv = new THREE.Group(); tv.position.set(SPOTS.tv.x, 2.5, -17.5);
  const tvBox = brickMesh(5, 3.6, 2.2, 0x3a2a1a, true, gm0(0x3a2a1a)); tv.add(tvBox);
  W.tvScreen = new THREE.Mesh(GEO.box, new THREE.MeshStandardMaterial({ color: 0x18222a, emissive: 0x000000, roughness: 0.2 }));
  W.tvScreen.scale.set(3.4, 2.6, 0.1); W.tvScreen.position.set(-0.4, 1.8, 1.12); tv.add(W.tvScreen);
  ground.group.add(tv);

  // kroonluchter in de hal + lichten per kamer
  for (const [x, z, col, int] of [[0, 8, 0xffd9a0, 40], [-20, 0, 0xffc890, 30], [20, 0, 0xfff0d0, 35]]) {
    const l = new THREE.PointLight(col, int, 30, 1.4); l.position.set(x, 10.5, z); ground.group.add(l); W.roomLights.push(l);
  }
  const chand = new Batch(); chand.box(0, 10, 8, 3, 0.5, 3, C.gold, { studs: true }); chand.box(0, 10.5, 8, 0.3, 1.5, 0.3, C.gold, { gap: 0 });
  ground.group.add(chand.build(ground.batchMat()));

  // ---- Bovenverdieping: vloer met trapgat
  const up = new Batch();
  const slab = (x0, x1, z0, z1) => up.box((x0 + x1) / 2, 12, (z0 + z1) / 2, x1 - x0, 1, z1 - z0, 0x8a5a33, { gap: 0.02 });
  slab(-32, -4.5, -20, 20); slab(4.5, 32, -20, 20); slab(-4.5, 4.5, -20, -14); slab(-4.5, 4.5, 4, 20);
  // tapijt
  up.box(-20, 13, 0, 22, 0.1, 38, 0x6fa3b8, { gap: 0 }); up.box(20, 13, 0, 22, 0.1, 38, 0x3a5a8a, { gap: 0 });
  // binnenmuren boven (x = ±8) met deur achterin
  up.wall('z', -8, -20, 20, 13, 25, 0xd8c9a3, { holes: [[-19, -13, 13, 21.5]], bw: 3, vary: 0.04 });
  up.wall('z', 8, -20, 20, 13, 25, 0xd8c9a3, { holes: [[-19, -13, 13, 21.5]], bw: 3, vary: 0.04 });
  // balustrade rond het trapgat
  for (let z = -14; z <= 4; z += 1.5) { up.box(-4.5, 13, z, 0.3, 3, 0.3, C.white, { gap: 0 }); up.box(4.5, 13, z, 0.3, 3, 0.3, C.white, { gap: 0 }); }
  for (let x = -4.5; x <= 4.5; x += 1.5) up.box(x, 13, 4.3, 0.3, 3, 0.3, C.white, { gap: 0 });
  up.box(-4.5, 16, -5, 0.5, 0.4, 18.5, 0x4a2410, { gap: 0 }); up.box(4.5, 16, -5, 0.5, 0.4, 18.5, 0x4a2410, { gap: 0 }); up.box(0, 16, 4.3, 9.4, 0.4, 0.5, 0x4a2410, { gap: 0 });
  // ouderslaapkamer: groot bed, kaptafel, badkamerhoek met spiegel
  up.box(-22, 13, -13, 10, 2, 12, 0x6b3a1e, { studs: false }); up.box(-22, 15, -12.5, 9.4, 0.8, 11, 0xd9d0ff, { studs: true });
  up.box(-22, 13, -19, 10, 6, 1, 0x4a2410, { studs: true }); up.box(-25, 15.8, -17.5, 3, 0.8, 1.8, C.white, { studs: true }); up.box(-19, 15.8, -17.5, 3, 0.8, 1.8, C.white, { studs: true });
  up.box(-28, 13, 16, 5, 3, 2.4, C.white, { studs: true }); // wastafel
  up.box(-12, 13, -19, 4, 4, 1.6, 0x6b3a1e, { studs: true }); // ladekast
  // Buzz' kamer: stapelbed, terrarium, plank
  up.box(26, 13, -14, 5, 1.2, 10, 0x2a52a8, { studs: true }); up.box(26, 18, -14, 5, 1, 10, 0x2a52a8, { studs: true });
  for (const [x, z] of [[23.7, -18.8], [28.3, -18.8], [23.7, -9.2], [28.3, -9.2]]) up.box(x, 13, z, 0.6, 7, 0.6, 0x5a3418, { gap: 0 });
  up.box(14, 13, -18.5, 5, 3, 2, 0x5a3418, { studs: false }); // tafel terrarium
  up.box(28, 13, 12, 5, 3.2, 2, 0x6b3a1e, { studs: true });   // plank met BB-geweer
  up.box(30.9, 17, 0, 0.3, 4, 4, 0x1b1f24, { gap: 0 });        // KEEP OUT-poster
  upper.group.add(up.build(upper.batchMat()));
  // spiegel in de badkamerhoek
  const mirror = new THREE.Mesh(GEO.box, gm1(0xcfe8f5, { metalness: 0.9, roughness: 0.05 })); mirror.scale.set(4, 5, 0.2); mirror.position.set(-28, 19, 17.6); upper.group.add(mirror);
  const aft = new THREE.Mesh(GEO.cyl, gm1(0x6ac1ff, { transparent: true, opacity: 0.8 })); aft.scale.set(0.35, 1, 0.35); aft.position.set(-27, 16.5, 16); upper.group.add(aft);
  // terrarium
  const tank = new THREE.Mesh(GEO.box, gm1(0xa8dcff, { transparent: true, opacity: 0.35, roughness: 0.05 })); tank.scale.set(4, 2.4, 1.8); tank.position.set(14, 17.2, -18.5); upper.group.add(tank);
  for (const [x, z, col, int] of [[-20, 0, 0xffe0b0, 30], [0, -8, 0xffd9a0, 25], [20, 0, 0xd0e0ff, 30]]) {
    const l = new THREE.PointLight(col, int, 28, 1.4); l.position.set(x, 23, z); upper.group.add(l); W.roomLights.push(l);
  }
  // botsingen boven
  wallBox(-8.5, -7.5, -13, 20, [1]); wallBox(-8.5, -7.5, -20, -19, [1]);
  wallBox(7.5, 8.5, -13, 20, [1]); wallBox(7.5, 8.5, -20, -19, [1]);
  wallBox(-27.2, -16.8, -19.5, -6.8, [1]); wallBox(23.2, 28.8, -19.5, -8.6, [1]); wallBox(11.4, 16.6, -19.5, -17.4, [1]);
  wallBox(-30.6, -25.4, 14.6, 19.5, [1]); wallBox(25.4, 30.6, 10.8, 13.2, [1]); wallBox(-14.2, -9.8, -19.5, -18, [1]);
}

function buildYard(W, G) {
  const base = G('base');
  const y = new Batch();
  // heggen langs de zijkanten (tuin voor en achter gescheiden)
  for (const s of [-1, 1]) {
    for (const z of [20, -20]) { y.box(s * 38.5, 0, z, 13, 2.4, 2, 0x1d4a2a, { studs: true, vary: 0.1 }); wallBox(s * 32, s * 45, z - 1, z + 1); }
  }
  // hekjes aan de randen
  for (let x = -44; x <= 44; x += 2) { if (Math.abs(x) > 3) y.box(x, 0, 39, 0.4, 2.2, 0.4, C.white, { gap: 0 }); y.box(x, 0, -39, 0.4, 2.2, 0.4, C.white, { gap: 0 }); }
  y.box(-23, 1.5, 39, 42, 0.3, 0.3, C.white, { gap: 0 }); y.box(23, 1.5, 39, 42, 0.3, 0.3, C.white, { gap: 0 }); y.box(0, 1.5, -39, 88, 0.3, 0.3, C.white, { gap: 0 });
  for (let z = -39; z <= 39; z += 2) { if (Math.abs(z) < 21) continue; y.box(-45, 0, z, 0.4, 2.2, 0.4, C.white, { gap: 0 }); y.box(45, 0, z, 0.4, 2.2, 0.4, C.white, { gap: 0 }); }
  // struiken met lichtjes voor het huis
  for (const x of [-26, -19, -9, 9, 19, 26]) y.box(x, 0, 22, 4, 2, 2, 0x1d4a2a, { studs: true, vary: 0.12 });
  // brievenbus
  y.box(9, 0, 37, 0.4, 3, 0.4, 0x333333, { gap: 0 }); y.box(9, 3, 37, 1.6, 1.2, 2.4, C.blue, { studs: true });
  // boom met boomhut achter het huis
  y.box(-20, 0, -32, 2, 16, 2, 0x5a3418, { vary: 0.1 });
  y.box(-20, 10, -32, 9, 0.8, 7, 0x8a5a33, { studs: true });
  y.box(-20, 10.8, -34.5, 8, 4, 0.6, 0x8a5a33, { studs: false }); y.box(-23.7, 10.8, -32, 0.6, 4, 5, 0x8a5a33, { studs: false }); y.box(-16.3, 10.8, -32, 0.6, 4, 5, 0x8a5a33, { studs: false });
  for (let k = 0; k < 4; k++) y.box(-20, 14.8 + k * 0.8, -32, 10 - k * 2.4, 0.8, 8 - k * 2, 0x3d2410, { studs: k === 3 });
  for (const [x, yy, z, s] of [[-20, 17, -32, 10], [-23, 15, -29, 7], [-16, 15.5, -35, 7]]) y.box(x, yy, z, s, s * 0.6, s, 0x2d4f2f, { studs: true, vary: 0.1 });
  wallBox(-21, -19, -33, -31);
  // bomen in de voortuin met lichtjes
  for (const [tx, tz] of [[-34, 32], [34, 30]]) {
    y.box(tx, 0, tz, 1.4, 5, 1.4, 0x5a3418);
    for (let k = 0; k < 5; k++) y.box(tx, 5 + k * 1.8, tz, 7 - k * 1.3, 1.8, 7 - k * 1.3, 0x1f5a2e, { studs: true, vary: 0.05 });
    wallBox(tx - 1, tx + 1, tz - 1, tz + 1);
  }
  // lantaarnpaal
  y.box(-30, 0, 41, 0.6, 9, 0.6, 0x222222, { gap: 0 }); y.box(-30, 9, 41, 1.4, 1.4, 1.4, 0xfff0c0, { studs: true });
  base.group.add(y.build(mat(0xffffff)));
  const lamp = new THREE.PointLight(0xffe0a0, 40, 25, 1.5); lamp.position.set(-30, 9.5, 41); base.group.add(lamp); W.roomLights.push(lamp);
  // kabelbaan van Buzz' raam naar de boomhut
  const pts = [new THREE.Vector3(24, 20, -20), new THREE.Vector3(2, 15, -28), new THREE.Vector3(-20, 13, -30)];
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.08, 5), mat(0xdddddd));
  base.group.add(rope);
  // wereldgrenzen
  wallBox(-60, -44.5, -60, 60); wallBox(44.5, 60, -60, 60); wallBox(-60, -3, 38.8, 60); wallBox(3, 60, 38.8, 60); wallBox(-60, 60, 47, 60); wallBox(-60, 60, -60, -38.8);
}

function buildNeighbourhood(W, G) {
  const base = G('base');
  const nb = new Batch();
  const house = (cx, cz, w, d, col, rot) => {
    nb.box(cx, 0, cz, w, 14, d, col, { studs: false, vary: 0.05 });
    for (let k = 0; k < 6; k++) nb.box(cx, 14 + k * 1.4, cz, w + 2 - k * (w / 6), 1.4, d + 2 - k * (d / 6) * 0.3, 0x3d414b, { studs: false });
    // ramen
    for (const dx of [-w / 3, 0, w / 3]) for (const yy of [3, 9]) {
      nb.box(cx + dx, yy, cz + (rot ? -d / 2 - 0.1 : d / 2 + 0.1), 3, 3.5, 0.3, Math.random() > 0.3 ? 0xffd88a : 0x2a3450, { gap: 0 });
    }
  };
  house(-60, 100, 40, 22, 0xb8b0a0, 1); house(0, 102, 36, 22, 0x8a9aa8, 1); house(60, 100, 42, 22, 0xc8a080, 1);
  house(-95, 0, 26, 40, 0xa89888, 0); house(95, 0, 26, 40, 0x9a8878, 0);
  // bomen langs de straat
  for (let x = -120; x <= 120; x += 30) {
    nb.box(x, 0, 62, 1.2, 4, 1.2, 0x5a3418);
    for (let k = 0; k < 4; k++) nb.box(x, 4 + k * 1.6, 62, 5 - k * 1.1, 1.6, 5 - k * 1.1, 0x1f5a2e, { studs: true });
  }
  base.group.add(nb.build(mat(0xffffff)));
  // lichtjes op de buurhuizen
  const lm = [0xff3a3a, 0xffd23a, 0x3ab8ff, 0x5aff6a].map(c => mat(c, { emissive: c, emissiveIntensity: 2 }));
  for (const [cx, cz, w] of [[-60, 100, 40], [0, 102, 36], [60, 100, 42]]) {
    for (let x = -w / 2; x <= w / 2; x += 1.8) { const b = new THREE.Mesh(GEO.sphere, lm[Math.abs(Math.round(x)) % 4]); b.scale.setScalar(0.3); b.position.set(cx + x, 14, cz - 12.2); base.group.add(b); }
  }
}
