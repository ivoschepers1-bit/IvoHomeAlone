// De filmintro in 3D: camerarijders, minifiguren en ondertiteling.
import * as THREE from 'three';
import { C, mat, GEO, Batch, Minifig, brickMesh } from './lego.js';
import { L1 } from './world.js';

const $ = (id) => document.getElementById(id);
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Camerapad: [[t, [px,py,pz], [lx,ly,lz]], ...]
function camPath(cam, keys, t) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [t0, p0, l0] = keys[i], [t1, p1, l1] = keys[Math.min(i + 1, keys.length - 1)];
  const u = t1 > t0 ? smooth(clamp01((t - t0) / (t1 - t0))) : 1;
  cam.position.set(p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u, p0[2] + (p1[2] - p0[2]) * u);
  cam.lookAt(l0[0] + (l1[0] - l0[0]) * u, l0[1] + (l1[1] - l0[1]) * u, l0[2] + (l1[2] - l0[2]) * u);
}

function labelTexture(text, bg = '#e9e6dc', fg = '#1d3f8a') {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const c = cv.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, 512, 128);
  c.fillStyle = fg; c.font = 'bold 54px "Luckiest Guy", "Arial Black", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 256, 60);
  c.fillStyle = '#c91a09'; c.fillRect(0, 108, 512, 10);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeVan(label, color = C.white) {
  const g = new THREE.Group();
  const b = new Batch();
  b.box(0, 1.2, 0, 14, 5.5, 6, color, { studs: true, gap: 0.04 });
  b.box(8.5, 1.2, 0, 3, 2.2, 6, color, { studs: false });
  b.box(8.5, 6.2, 0, 3, 0.4, 6, color, { studs: true });
  b.box(0, 0.6, 0, 16, 0.8, 6.2, 0x333333, { studs: false });
  g.add(b.build(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })));
  const glass = mat(0x9fc6e6, { transparent: true, opacity: 0.35, roughness: 0.05 });
  for (const x of [-4.5, -0.5, 3.5]) { const w = new THREE.Mesh(GEO.box, glass); w.scale.set(3, 2, 6.1); w.position.set(x, 5, 0); g.add(w); }
  const wind = new THREE.Mesh(GEO.box, glass); wind.scale.set(3, 2.8, 6); wind.position.set(8.5, 4.8, 0); g.add(wind);
  for (const [x, z] of [[-4.5, 3.1], [5.5, 3.1], [-4.5, -3.1], [5.5, -3.1]]) {
    const w = new THREE.Mesh(GEO.cyl, mat(0x111111)); w.scale.set(1.3, 0.8, 1.3); w.rotation.x = Math.PI / 2; w.position.set(x, 1.3, z); g.add(w);
    const h = new THREE.Mesh(GEO.cyl, mat(0xaaaaaa, { metalness: 0.6 })); h.scale.set(0.6, 0.85, 0.6); h.rotation.x = Math.PI / 2; h.position.set(x, 1.3, z); g.add(h);
  }
  if (label) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshStandardMaterial({ map: labelTexture(label) }));
    pl.position.set(-1, 3, 3.02); g.add(pl);
  }
  const hl = new THREE.Mesh(GEO.box, mat(0xfff6c0, { emissive: 0xffeeaa, emissiveIntensity: 2 })); hl.scale.set(0.2, 0.6, 1); hl.position.set(10.1, 2, 2); g.add(hl);
  const hl2 = hl.clone(); hl2.position.z = -2; g.add(hl2);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function makePlane() {
  const g = new THREE.Group();
  const white = mat(0xe8ecf0), red = mat(C.red), blue = mat(C.darkBlue);
  const body = new THREE.Mesh(GEO.cyl, white); body.scale.set(2.2, 30, 2.2); body.rotation.z = Math.PI / 2; g.add(body);
  const nose = new THREE.Mesh(GEO.sphere, white); nose.scale.set(3, 2.2, 2.2); nose.position.x = 15; g.add(nose);
  const stripe = new THREE.Mesh(GEO.cyl, red); stripe.scale.set(2.25, 30, 2.25); stripe.rotation.z = Math.PI / 2; stripe.position.y = -0.2; stripe.scale.y = 30; g.add(stripe); stripe.scale.set(2.25, 30, 0.6); stripe.position.set(0, -0.6, 0);
  const wing = brickMesh(10, 0.6, 30, 0xd0d6dc); wing.position.set(-1, -0.8, 0); g.add(wing);
  const tail = brickMesh(4, 0.6, 10, 0xd0d6dc); tail.position.set(-14, 0.8, 0); g.add(tail);
  const fin = new THREE.Mesh(GEO.box, red); fin.scale.set(4, 6, 0.6); fin.position.set(-13.5, 4, 0); g.add(fin);
  for (let i = 0; i < 12; i++) { const w = new THREE.Mesh(GEO.box, blue); w.scale.set(0.8, 0.7, 4.5); w.position.set(-10 + i * 2, 0.8, 0); g.add(w); }
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(GEO.stud, white); s.position.set(-12 + i * 2, 2.25, 0); g.add(s); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function cloud(x, y, z, s = 1) {
  const g = new THREE.Group(); const b = new Batch();
  b.box(0, 0, 0, 16 * s, 3 * s, 8 * s, C.white, { studs: true }); b.box(-2 * s, 3 * s, 0, 8 * s, 2.5 * s, 6 * s, C.white, { studs: true }); b.box(4 * s, 3 * s, 1, 6 * s, 2 * s, 5 * s, C.white, { studs: true });
  g.add(b.build(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }))); g.position.set(x, y, z);
  return g;
}

// ---------------------------------------------------------------------
export class Intro {
  constructor(world, scene, camera) {
    this.W = world; this.scene = scene; this.camera = camera;
    this.root = new THREE.Group(); scene.add(this.root);
    this.active = false;
  }

  fig(look, x, y, z, yaw = 0) {
    const f = new Minifig(look); f.root.position.set(x, y, z); f.root.rotation.y = yaw; this.root.add(f.root); return f;
  }

  start(onDone) {
    this.onDone = onDone; this.active = true; this.scene_i = -1; this.t = 0;
    $('cine').classList.remove('hidden');
    this.next();
  }

  skip() { if (this.active) this.finish(); }

  finish() {
    this.active = false;
    this.cleanup();
    $('cine').classList.add('hidden');
    this.W.setNight(true, true);
    for (const g of Object.values(this.W.groups)) g.set(1, true);
    this.W.snow.material.size = 0.35; this.W.snow.visible = true;
    if (this.onDone) this.onDone();
  }

  cleanup() {
    this.root.clear();
    if (this.game) { this.game.fx = this.game.fx.filter(f => f.mesh.parent && f.mesh.parent !== this.root); }
    this.actors = {};
    this.say(null); this.big(null); this.title(null);
    $('clockCard').classList.add('hidden');
  }

  groups(o) { for (const [k, v] of Object.entries(o)) this.W.groups[k].set(v, true); }
  say(who, text) {
    const s = $('subtitle');
    if (!who && !text) { s.classList.add('hidden'); return; }
    s.classList.remove('hidden');
    s.innerHTML = who ? `<b class="who-${who.toLowerCase().replace(/\s/g, '')}">${who}:</b> ${text}` : text;
  }
  big(text, cls = '') {
    const b = $('cineBig');
    if (!text) { b.classList.add('hidden'); b.textContent = ''; return; }
    if (b.textContent === text) return;
    b.textContent = text; b.className = cls; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  }
  title(state) {
    const t = $('titleCard');
    if (!state) { t.className = 'hidden'; return; }
    t.className = state;
  }

  next() {
    this.cleanup();
    this.scene_i++; this.t = 0; this.fired = new Set();
    const sc = SCENES[this.scene_i];
    if (!sc) { this.finish(); return; }
    this.cur = sc;
    sc.setup.call(this);
    $('cineFade').style.opacity = 1;
  }

  once(key, t, fn) { if (this.t >= t && !this.fired.has(key)) { this.fired.add(key); fn(); } }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    this.game.updateFx(dt);
    const sc = this.cur;
    // ondertitels
    let line = null;
    for (const l of sc.lines || []) if (this.t >= l[0]) line = l;
    if (line) this.say(line[1], line[2]); else this.say(null);
    sc.update.call(this, this.t, dt);
    const fade = Math.max(0, 1 - this.t / 0.5, 1 - (sc.dur - this.t) / 0.5);
    $('cineFade').style.opacity = fade;
    $('cineScene').textContent = `SCÈNE ${this.scene_i + 1}/${SCENES.length}`;
    if (this.t >= sc.dur) this.next();
  }
}

// ---------------------------------------------------------------------
const SCENES = [
  {
    // 1. De openingsshot: door de besneeuwde straat naar het huis
    dur: 13,
    setup() {
      this.W.setNight(true, true);
      this.groups({ front: 1, roof: 1, upper: 1, back: 1 });
      this.W.snow.material.size = 0.45;
    },
    update(t) {
      camPath(this.camera, [
        [0, [-90, 5, 52], [-40, 6, 40]],
        [4.5, [-38, 7, 56], [0, 10, 25]],
        [9, [0, 12, 64], [0, 13, 20]],
        [13, [0, 16, 46], [0, 14, 20]],
      ], t);
      this.W.sun.position.set(-40, 80, 50); this.W.sun.target.position.set(0, 0, 0);
      this.title(t > 3.5 && t < 12.3 ? (t > 6.5 ? 'show sub' : 'show') : null);
    },
  },
  {
    // 2. De avond ervoor: ruzie om de kaaspizza
    dur: 14,
    lines: [
      [0.4, 'Kate', 'Iedereen inpakken! Morgen vliegen we naar Parijs!'],
      [2.9, 'Kevin', 'Hé! Wie heeft mijn kaaspizza?'],
      [4.8, 'Buzz', 'Die heb ik opgegeten, sukkel. Hap hap!'],
      [7.2, '', ''],
      [8.4, 'Oom Frank', 'Kijk nou wat je gedaan hebt, kleine sukkel!'],
      [9.9, 'Kate', 'Kevin! Naar boven. Naar de zolder. NU!'],
      [11.6, 'Kevin', 'Ik hoop dat ik jullie NOOIT meer zie!'],
    ],
    setup() {
      this.W.setNight(true, true);
      this.groups({ front: 0, roof: 0, upper: 0, back: 1 });
      const a = this.actors = {};
      a.kate = this.fig('kate', 15, 0, -2.5, 0.25);
      a.peter = this.fig('peter', 18.5, 0, -3, 0);
      a.frank = this.fig('frank', 22, 0, -3, -0.15);
      a.buzz = this.fig('buzz', 26.5, 0, 6, -0.5);
      a.kevin = this.fig('kevin', 4, 0, 10, Math.PI / 2);
      a.pizza = brickMesh(1, 0.3, 2, 0xf5c04a, true); a.buzz.armR.add(a.pizza); a.pizza.position.set(0.3, -1.2, 0.5); a.pizza.visible = false;
    },
    update(t) {
      const a = this.actors;
      camPath(this.camera, [[0, [16, 12, 27], [20, 3, 2]], [7, [19, 10, 24], [22, 3, 3]], [14, [18, 9, 22], [21, 3, 3]]], t);
      // Kevin loopt de keuken in en valt Buzz aan
      let kx = 4, kz = 10, walk = 0;
      if (t < 2.5) { kx = 4 + t * 5; kz = 10 - t * 0.8; walk = t * 12; }
      else if (t < 6.8) { kx = 16.5; kz = 8; }
      else if (t < 7.2) { const u = (t - 6.8) / 0.4; kx = 16.5 + u * 8; kz = 8 - u * 1.5; walk = t * 20; }
      else { kx = 24.5; kz = 6.5; }
      a.kevin.root.position.set(kx, 0, kz);
      a.kevin.root.rotation.y = t < 2.5 ? Math.PI / 2 : Math.atan2(26.5 - kx, 6 - kz);
      a.kevin.pose({ walk, amp: walk ? 0.8 : 0, armL: t > 6.8 && t < 7.4 ? 1.6 : null, armR: t > 6.8 && t < 7.4 ? 1.6 : null });
      a.kevin.setExpr(t > 2.8 ? 'grr' : 'smile');
      const surprise = t > 7.2 && t < 12;
      a.buzz.pizza = t > 4.4 && t < 7.2; a.pizza.visible = a.buzz.pizza;
      a.buzz.pose({ walk: 0, amp: 0, armR: a.pizza.visible ? 2.2 : null });
      a.buzz.setExpr(t > 4.8 && t < 7.2 ? 'smirk' : surprise ? 'scream' : 'smile');
      a.buzz.root.rotation.y = t > 3 && t < 7.2 ? Math.atan2(kx - 26.5, kz - 6) : -0.5;
      a.kate.setExpr(t > 9.8 && t < 12 ? 'grr' : surprise ? 'ooh' : 'smile');
      a.kate.pose({ walk: 0, amp: 0, armR: t > 9.8 && t < 12 ? 2.4 : null });
      a.frank.setExpr(t > 8.4 && t < 10 ? 'grr' : surprise ? 'scream' : 'smirk');
      a.peter.setExpr(surprise ? 'ooh' : 'smile');
      this.once('boem', 7.2, () => {
        Sfx.smash(); this.big('BOEM!', 'yellow');
        this.game.bricksBurst(25.5, 3.2, 6, [C.white, C.white, C.red], 26, 1.1, 0, this.root);
      });
      this.once('boemoff', 8.3, () => this.big(null));
      this.once('kate', 9.9, () => Sfx.hurt(true));
    },
  },
  {
    // 3. De stroomstoring
    dur: 7.5,
    lines: [[0.3, 'Verteller', 'Die nacht stormt het in Winnetka, Illinois…'], [2.9, 'Verteller', 'De stroom valt uit. En dus gaan de wekkers niet af.']],
    setup() {
      this.W.setNight(true, true);
      this.groups({ front: 1, roof: 1, upper: 1, back: 1 });
      this.W.snow.material.size = 0.7;
      const pole = brickMesh(1, 16, 1, 0x6b4a2a, true); pole.position.set(42, 0, 36); this.root.add(pole);
      const pts = [new THREE.Vector3(42, 15.5, 36), new THREE.Vector3(37, 13, 28), new THREE.Vector3(32, 18, 18)];
      this.actors = { line: new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.1, 5), mat(0x111111)) };
      this.root.add(this.actors.line);
      const branch = new THREE.Group(); const bm = brickMesh(10, 1, 1, 0x5a3418, true); bm.position.x = -10; branch.add(bm);
      branch.position.set(35, 14, 30); branch.rotation.z = 0.3; this.root.add(branch); this.actors.branch = branch;
    },
    update(t) {
      camPath(this.camera, [[0, [60, 12, 64], [20, 12, 22]], [7.5, [54, 10, 58], [22, 11, 22]]], t);
      const f = clamp01((t - 1.6) / 0.5);
      this.actors.branch.rotation.z = 0.3 - f * 1.2;
      this.actors.branch.position.y = 14 - f * 1.5;
      this.once('krak', 2.1, () => { Sfx.noise(0.6, 0.5, 1500, 'lowpass'); Sfx.clang(); this.big('KRAK!', 'yellow'); this.game.bricksBurst(37, 13, 28, [0xffe066, C.white], 14, 0.8, 0, this.root); });
      this.once('out', 2.6, () => { this.W.setLights(false); this.big(null); });
      this.once('clock', 4.2, () => $('clockCard').classList.remove('hidden'));
    },
  },
  {
    // 4. De ochtend: verslapen!
    dur: 10.5,
    lines: [[0.3, 'Kate', 'WE HEBBEN ONS VERSLAPEN! Iedereen in de busjes!'], [3.2, 'Buzz', '…9, 10, 11! Iedereen is er!'], [5.6, 'Verteller', '(Dat elfde kind was het buurjongetje…)'], [7.6, 'Verteller', 'En op zolder ligt er nog iemand heerlijk te slapen.']],
    setup() {
      this.W.setNight(false, false);
      this.groups({ front: 1, roof: 1, upper: 1, back: 1 });
      this.W.snow.material.size = 0.3;
      const a = this.actors = { runners: [] };
      a.van1 = makeVan(''); a.van1.position.set(-14, 0, 50); this.root.add(a.van1);
      a.van2 = makeVan(''); a.van2.position.set(10, 0, 50); this.root.add(a.van2);
      const looks = ['kate', 'peter', 'buzz', 'frank', 'kid', 'kid', 'peter', 'kid', 'kate', 'kid', 'buzz'];
      looks.forEach((l, i) => a.runners.push({ f: this.fig(l, 0, 0, 22), off: i * 0.11, tx: (i % 2 ? -14 : 10) + (i % 3 - 1) * 2 }));
    },
    update(t) {
      const a = this.actors;
      camPath(this.camera, [[0, [-34, 14, 76], [0, 6, 36]], [10.5, [-20, 12, 72], [0, 8, 34]]], t);
      this.W.sun.position.set(-40, 80, 50);
      this.big(t > 0.2 && t < 2.6 ? 'WE HEBBEN ONS VERSLAPEN!!!' : null, 'yellow');
      for (const r of a.runners) {
        const u = clamp01((t * 0.45 - r.off));
        const tx = r.tx;
        const x = u * tx, z = 22 + u * 24;
        r.f.root.position.set(x, 0, z); r.f.root.rotation.y = Math.atan2(tx, 24);
        r.f.root.visible = u < 1 && t < 6.2;
        r.f.pose({ walk: t * 16 + r.off * 9, amp: 0.9, armL: 2.6 }); r.f.setExpr('scream');
      }
      if (t > 6) { const d = (t - 6) * (t - 6) * 6; a.van1.position.x = -14 - d; a.van2.position.x = 10 - d * 1.1; }
      this.once('vroem', 6, () => Sfx.whoosh());
      this.once('zz', 7.6, () => this.big('zzz…', 'white small'));
    },
  },
  {
    // 5. In het vliegtuig: KEVIN!
    dur: 9,
    lines: [[4.6, 'Kate', 'Ik heb het gevoel dat we iets vergeten zijn…'], [6.4, 'Kate', 'KEVIN!!!']],
    setup() {
      this.W.setNight(false, false);
      this.groups({ front: 1, roof: 1, upper: 1, back: 1 });
      this.W.snow.visible = false;
      const a = this.actors = {};
      a.plane = makePlane(); a.plane.position.set(-80, 120, 0); this.root.add(a.plane);
      for (let i = 0; i < 10; i++) this.root.add(cloud(-120 + i * 28, 104 + (i % 3) * 5, -30 + (i % 4) * 18, 1 + (i % 2) * 0.5));
      // cabine ver weg van het huis
      const cab = new THREE.Group(); cab.position.set(600, 0, 0); this.root.add(cab); a.cab = cab;
      const cb = new Batch();
      cb.box(0, -0.2, 0, 40, 0.2, 20, 0x8a8578, { studs: false });
      cb.box(0, 0, -6, 40, 14, 1, 0xd7d2c4, { studs: false, holes: [] });
      for (let i = 0; i < 5; i++) { cb.box(-16 + i * 8, 0, -1, 5, 2.4, 4, 0x2a4a8a, { studs: true }); cb.box(-16 + i * 8, 2.4, -2.8, 5, 4.5, 1, 0x2a4a8a, { studs: true }); }
      cab.add(cb.build(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })));
      for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), mat(0x9fd0ff, { emissive: 0x9fd0ff, emissiveIntensity: 0.6 })); w.scale.y = 1.4; w.position.set(-12 + i * 8, 7, -5.4); cab.add(w); }
      a.peter = this.fig('peter', 600 - 16 + 8, 2.4, -1); a.peter.legL.rotation.x = a.peter.legR.rotation.x = -1.5; a.peter.setExpr('closed');
      a.kate = this.fig('kate', 600 - 16 + 16, 2.4, -1); a.kate.legL.rotation.x = a.kate.legR.rotation.x = -1.5;
      const l = new THREE.PointLight(0xffffff, 60, 40); l.position.set(600, 12, 8); cab.add(l);
    },
    update(t) {
      const a = this.actors;
      if (t < 4.2) {
        a.plane.position.set(-80 + t * 42, 120 + t * 2, 0);
        camPath(this.camera, [[0, [-40, 118, 60], [-70, 120, 0]], [4.2, [20, 124, 55], [80, 126, 0]]], t);
        this.big(t > 0.4 && t < 3.6 ? 'OP WEG NAAR PARIJS' : null, 'white');
      } else {
        const u = t - 4.2;
        const shout = t > 6.4;
        camPath(this.camera, [[0, [600 + 0, 6, 16], [600, 4, -1]], [2.2, [600, 5.5, 10], [600, 4.5, -1]], [4.8, [600, 5, 8], [600, 5, -1]]], u);
        if (shout) this.camera.position.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0).multiplyScalar(0.4));
        a.kate.setExpr(shout ? 'scream' : t > 5.3 ? 'ooh' : 'smile');
        a.kate.pose({ walk: 0, amp: 0, armL: shout ? 2.8 : 0.3, armR: shout ? 2.8 : 0.3 });
        a.kate.legL.rotation.x = a.kate.legR.rotation.x = -1.5;
        this.big(shout ? 'KEVIN!!!' : null, 'red huge');
        this.once('kevin', 6.4, () => Sfx.voice(620, 820, 1.2, 'e', 0.35, 9));
      }
    },
  },
  {
    // 6. Alleen thuis
    dur: 13.5,
    lines: [[0.3, 'Kevin', 'Mam? Pap? Buzz…? Hallo?'], [3.6, 'Kevin', 'Ik heb mijn familie laten verdwijnen!'], [6, 'Kevin', 'Ik ben ALLEEN THUIS!'], [8.8, 'Kevin', 'Even een beetje aftershave van papa…'], [10, '', '']],
    setup() {
      this.W.setNight(false, false);
      this.W.snow.visible = true;
      this.groups({ front: 0, roof: 0, upper: 1, back: 1 });
      this.actors = { kevin: this.fig('kevin', -10, L1, -16, -Math.PI / 2) };
    },
    update(t) {
      const k = this.actors.kevin;
      if (t < 8.6) {
        camPath(this.camera, [[0, [-8, L1 + 16, 12], [-14, L1 + 2, -10]], [8.6, [-14, L1 + 14, 10], [-20, L1 + 3, -11]]], t);
        if (t < 3.4) { const u = t / 3.4; k.root.position.set(-10 - u * 8, L1, -16 + u * 12); k.root.rotation.y = Math.atan2(-8, 12); k.pose({ walk: t * 12 }); k.setExpr('ooh'); }
        else if (t < 5.8) { k.root.rotation.y = 0.3; k.pose({ walk: 0, amp: 0, armL: 2.8, armR: 2.8 }); k.setExpr('smile'); }
        else {
          const u = (t - 5.8) * 3.4;
          k.root.position.set(-22, L1 + 2.8 + Math.abs(Math.sin(u)) * 4, -11); k.root.rotation.y = 0.4;
          k.pose({ walk: 0, amp: 0, armL: 2.7, armR: 2.7 }); k.setExpr('smile');
          if (Math.floor((t - 5.8) * 3.4 / Math.PI) !== Math.floor((t - 5.8 - 0.016) * 3.4 / Math.PI)) Sfx.boing();
          this.big('BOING!', 'yellow');
        }
      } else {
        this.big(t > 10 ? 'AAAAAAAAH!' : null, 'yellow huge');
        const scream = t > 10;
        k.root.position.set(-28, L1, 12); k.root.rotation.y = 0;
        k.pose({ walk: 0, amp: 0, armL: scream ? 2.7 : 2.0, armR: scream ? 2.7 : 2.0, armLz: -0.55, armRz: -0.55 });
        k.setExpr(scream ? 'scream' : 'smirk');
        camPath(this.camera, [[0, [-28, L1 + 4.6, 17.3], [-28, L1 + 3.6, 13]], [1.4, [-28, L1 + 4.3, 16.6], [-28, L1 + 3.8, 13]]], t - 8.6);
        if (scream) this.camera.position.x += (Math.random() - 0.5) * 0.3;
        this.once('scream', 10, () => Sfx.kevinScream());
      }
    },
  },
  {
    // 7. De Natte Bandieten
    dur: 12,
    lines: [[0.3, 'Verteller', 'Maar in het busje van "Oh-Kay Loodgieters" zitten geen loodgieters…'], [3.2, 'Harry', 'Om 21:00 uur gaan die lichtjes aan. Dan gaan we naar binnen.'], [5.8, 'Marv', 'Hé Harry… volgens mij is dat joch helemaal alleen thuis.'], [8, 'Kevin', 'Dit is míjn huis. Ik moet het verdedigen!']],
    setup() {
      this.W.setNight(true, false);
      this.groups({ front: 1, roof: 1, upper: 1, back: 1 });
      const a = this.actors = {};
      a.van = makeVan('OH-KAY LOODGIETERS', 0xe9e6dc); a.van.rotation.y = Math.PI; a.van.position.set(80, 0, 50); this.root.add(a.van);
      a.harry = new Minifig('harry'); a.harry.root.position.set(8.5, 1.0, -1.4); a.harry.root.rotation.y = Math.PI / 2; a.van.add(a.harry.root);
      a.marv = new Minifig('marv'); a.marv.root.position.set(8.5, 1.0, 1.4); a.marv.root.rotation.y = Math.PI / 2; a.van.add(a.marv.root);
      a.kevin = this.fig('kevin', 0, L1, 17.5, 0);
    },
    update(t) {
      const a = this.actors;
      const u = clamp01(t / 3); a.van.position.x = 80 - (1 - Math.pow(1 - u, 2)) * 86;
      this.once('lights', 1.4, () => { this.W.setLights(true); Sfx.buildDone(); });
      a.harry.setExpr(t > 3 && t < 5.8 ? 'grr' : 'smirk'); a.marv.setExpr(t > 5.8 ? 'smile' : 'ooh');
      a.kevin.setExpr('grr'); a.kevin.pose({ walk: 0, amp: 0, armL: 0.3, armR: 0.3 });
      if (t < 7.8) camPath(this.camera, [[0, [34, 8, 80], [10, 5, 50]], [4, [22, 7, 74], [-4, 5, 50]], [7.8, [12, 7, 70], [-5, 6, 50]]], t);
      else camPath(this.camera, [[0, [2, 18, 34], [0, 17, 18]], [4.2, [0, 17.5, 28], [0, 17.2, 18]]], t - 7.8);
      this.big(t > 10 ? 'VERDEDIG HET HUIS!' : null, 'yellow');
      this.once('fanfare', 10, () => Sfx.fanfare());
    },
  },
];
