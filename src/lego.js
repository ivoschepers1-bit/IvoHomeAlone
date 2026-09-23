// Bouwstenen in 3D: kleuren, stenen, noppen en minifiguren.
import * as THREE from 'three';

export const C = {
  red: 0xc91a09, darkRed: 0x720e0f, blue: 0x0055bf, darkBlue: 0x0a3463, yellow: 0xf2cd37,
  skin: 0xf6d01e, green: 0x237841, darkGreen: 0x184632, white: 0xf4f4f4, black: 0x1b1f24,
  tan: 0xe4cd9e, darkTan: 0x958a73, brown: 0x582a12, reddishBrown: 0x6b3a1e, lbg: 0xa0a5a9,
  dbg: 0x6c6e68, orange: 0xfe8a18, lime: 0xbbe90b, pink: 0xfc97ac, snow: 0xf2f6fb,
  brick: 0xa8352c, cream: 0xf3ecdc, gold: 0xdcbc35, silver: 0xc9ced6, studBlue: 0x3a8ee6, purple: 0xa05ad8,
};

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.0, ...opts });
  delete m.unique;
  if (!opts.unique) matCache.set(key, m);
  return m;
}

// ---------------------------------------------------------------------
// Geometrieën die veel hergebruikt worden
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  stud: new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16),
  studCoin: (() => {
    // de verzamelnop: een platte schijf met een nop erop, zoals in de games
    const g = new THREE.CylinderGeometry(0.42, 0.42, 0.16, 24);
    g.rotateX(Math.PI / 2);
    return g;
  })(),
  studBump: (() => { const g = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.14); return g; })(),
  sphere: new THREE.SphereGeometry(1, 16, 12),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
};

// ---------------------------------------------------------------------
// Een "batch": veel stenen en noppen in een paar InstancedMeshes.
export class Batch {
  constructor() { this.boxes = []; this.studs = []; }

  // x,z = midden, y = onderkant
  box(x, y, z, w, h, d, color, o = {}) {
    const gap = o.gap == null ? 0.05 : o.gap;
    let c = new THREE.Color(color);
    if (o.vary) { const v = 1 + (Math.random() - 0.5) * o.vary; c.multiplyScalar(v); }
    this.boxes.push({ x, y: y + h / 2, z, w: Math.max(0.01, w - gap), h: Math.max(0.01, h - gap * 0.5), d: Math.max(0.01, d - gap), c, rot: o.rot || 0 });
    if (o.studs) {
      const sc = o.studColor != null ? new THREE.Color(o.studColor) : c;
      const nx = Math.max(1, Math.round(w)), nz = Math.max(1, Math.round(d));
      for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
        const lx = -w / 2 + (i + 0.5) * (w / nx), lz = -d / 2 + (k + 0.5) * (d / nz);
        const cs = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0);
        this.studs.push({ x: x + lx * cs + lz * sn, y: y + h + 0.1, z: z - lx * sn + lz * cs, c: sc });
      }
    }
    return this;
  }

  // Muur van stenen (in x- of z-richting), met gaten voor deuren/ramen
  wall(axis, fixed, from, to, y0, y1, color, o = {}) {
    const bw = o.bw || 4, bh = o.bh || 1.2, th = o.th || 1;
    const holes = o.holes || [];
    for (let y = y0, row = 0; y < y1 - 0.01; y += bh, row++) {
      const hh = Math.min(bh, y1 - y);
      const off = (row % 2) * bw / 2;
      for (let a = from - off; a < to; a += bw) {
        let s = Math.max(a, from), e = Math.min(a + bw, to);
        // gaten uitsnijden
        const segs = [[s, e]];
        for (const [h0, h1, hy0, hy1] of holes) {
          if (y + hh <= hy0 || y >= hy1) continue;
          for (let i = segs.length - 1; i >= 0; i--) {
            const [p, q] = segs[i];
            if (q <= h0 || p >= h1) continue;
            segs.splice(i, 1);
            if (p < h0) segs.push([p, h0]);
            if (q > h1) segs.push([h1, q]);
          }
        }
        const top = y + hh >= y1 - 0.01;
        for (const [p, q] of segs) {
          if (q - p < 0.05) continue;
          const m = (p + q) / 2, len = q - p;
          if (axis === 'x') this.box(m, y, fixed, len, hh, th, color, { vary: o.vary ?? 0.08, studs: top && o.topStuds !== false, gap: 0.06 });
          else this.box(fixed, y, m, th, hh, len, color, { vary: o.vary ?? 0.08, studs: top && o.topStuds !== false, gap: 0.06 });
        }
      }
    }
    // donkere achterkant zodat de voegen zichtbaar zijn
    if (o.backing !== false) {
      const len = to - from, mid = (from + to) / 2, col = new THREE.Color(color).multiplyScalar(0.35);
      if (axis === 'x') this.boxes.push({ x: mid, y: (y0 + y1) / 2 - 0.02, z: fixed, w: len - 0.02, h: y1 - y0 - 0.06, d: th * 0.7, c: col, rot: 0, holes, axis });
      else this.boxes.push({ x: fixed, y: (y0 + y1) / 2 - 0.02, z: mid, w: th * 0.7, h: y1 - y0 - 0.06, d: len - 0.02, c: col, rot: 0, holes, axis });
      // backings met gaten: splits in stukken
      const b = this.boxes.pop();
      this._backing(b, axis, from, to, y0, y1, th, holes, col, fixed);
    }
    return this;
  }

  _backing(b, axis, from, to, y0, y1, th, holes, col, fixed) {
    // eenvoudige rasterverdeling rond de gaten
    const xs = [from, to]; const ys = [y0, y1];
    for (const [h0, h1, hy0, hy1] of holes) { xs.push(h0, h1); ys.push(hy0, hy1); }
    const ux = [...new Set(xs)].filter(v => v >= from && v <= to).sort((a, b) => a - b);
    const uy = [...new Set(ys)].filter(v => v >= y0 && v <= y1).sort((a, b) => a - b);
    for (let i = 0; i < ux.length - 1; i++) for (let j = 0; j < uy.length - 1; j++) {
      const a0 = ux[i], a1 = ux[i + 1], c0 = uy[j], c1 = uy[j + 1];
      const ma = (a0 + a1) / 2, mc = (c0 + c1) / 2;
      if (holes.some(([h0, h1, hy0, hy1]) => ma > h0 && ma < h1 && mc > hy0 && mc < hy1)) continue;
      if (axis === 'x') this.boxes.push({ x: ma, y: mc - 0.02, z: fixed, w: a1 - a0, h: c1 - c0 - 0.06, d: th * 0.7, c: col, rot: 0 });
      else this.boxes.push({ x: fixed, y: mc - 0.02, z: ma, w: th * 0.7, h: c1 - c0 - 0.06, d: a1 - a0, c: col, rot: 0 });
    }
  }

  stud(x, y, z, color) { this.studs.push({ x, y: y + 0.1, z, c: new THREE.Color(color) }); return this; }

  build(material) {
    const group = new THREE.Group();
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const matl = material || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32 });
    if (this.boxes.length) {
      const im = new THREE.InstancedMesh(GEO.box, matl, this.boxes.length);
      this.boxes.forEach((b, i) => {
        q.setFromAxisAngle(up, b.rot || 0); s.set(b.w, b.h, b.d); p.set(b.x, b.y, b.z);
        m.compose(p, q, s); im.setMatrixAt(i, m); im.setColorAt(i, b.c);
      });
      im.castShadow = true; im.receiveShadow = true;
      group.add(im);
    }
    if (this.studs.length) {
      const im = new THREE.InstancedMesh(GEO.stud, matl, this.studs.length);
      q.identity(); s.set(1, 1, 1);
      this.studs.forEach((b, i) => { p.set(b.x, b.y, b.z); m.compose(p, q, s); im.setMatrixAt(i, m); im.setColorAt(i, b.c); });
      im.castShadow = true; im.receiveShadow = true;
      group.add(im);
    }
    return group;
  }
}

// Losse steen als Mesh-groep (voor dingen die bewegen)
export function brickMesh(w, h, d, color, studs = true, material) {
  const g = new THREE.Group();
  const mm = material || mat(color);
  const b = new THREE.Mesh(GEO.box, mm);
  b.scale.set(w - 0.04, h - 0.02, d - 0.04); b.position.y = h / 2;
  b.castShadow = true; b.receiveShadow = true;
  g.add(b);
  if (studs) {
    const nx = Math.max(1, Math.round(w)), nz = Math.max(1, Math.round(d));
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      const st = new THREE.Mesh(GEO.stud, mm);
      st.position.set(-w / 2 + (i + 0.5) * w / nx, h + 0.1, -d / 2 + (k + 0.5) * d / nz);
      st.castShadow = true;
      g.add(st);
    }
  }
  return g;
}

// ---------------------------------------------------------------------
// Texturen
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d'); draw(c, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function studTexture(base = '#f2f6fb') {
  const t = canvasTex(64, 64, (c) => {
    c.fillStyle = base; c.fillRect(0, 0, 64, 64);
    const g = c.createRadialGradient(28, 28, 4, 32, 32, 20);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.7, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
    c.fillStyle = g; c.beginPath(); c.arc(32, 32, 19, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 2; c.beginPath(); c.arc(32, 33, 19, 0.2, Math.PI - 0.2); c.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Gezichten
const faceCache = new Map();
export function faceTexture(expr, opts = {}) {
  const key = expr + (opts.goldTooth ? 'g' : '') + (opts.freckles ? 'f' : '') + (opts.lipstick ? 'l' : '') + (opts.glasses ? 'b' : '') + (opts.beard ? 'd' : '');
  if (faceCache.has(key)) return faceCache.get(key);
  const t = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#f6d01e'; c.fillRect(0, 0, w, h);
    const cx = w / 2, ey = 112;
    c.fillStyle = '#1b1b1b'; c.strokeStyle = '#1b1b1b'; c.lineCap = 'round';
    const eye = (x) => {
      if (expr === 'dizzy') { c.lineWidth = 7; c.beginPath(); c.moveTo(x - 10, ey - 10); c.lineTo(x + 10, ey + 10); c.moveTo(x + 10, ey - 10); c.lineTo(x - 10, ey + 10); c.stroke(); return; }
      if (expr === 'closed') { c.lineWidth = 6; c.beginPath(); c.arc(x, ey - 4, 11, 0.2, Math.PI - 0.2); c.stroke(); return; }
      const big = expr === 'scream' || expr === 'ooh';
      c.beginPath(); c.ellipse(x, ey, big ? 12 : 9, big ? 15 : 12, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 3, ey - 5, big ? 4 : 3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1b1b1b';
    };
    eye(cx - 34); eye(cx + 34);
    c.lineWidth = 6;
    c.beginPath();
    if (expr === 'grr') { c.moveTo(cx - 56, ey - 34); c.lineTo(cx - 18, ey - 20); c.moveTo(cx + 56, ey - 34); c.lineTo(cx + 18, ey - 20); }
    else if (expr === 'scream' || expr === 'ooh') { c.arc(cx - 34, ey - 22, 16, Math.PI * 1.15, Math.PI * 1.85); c.moveTo(cx + 50, ey - 30); c.arc(cx + 34, ey - 22, 16, Math.PI * 1.15, Math.PI * 1.85); }
    else { c.moveTo(cx - 50, ey - 28); c.lineTo(cx - 20, ey - 30); c.moveTo(cx + 50, ey - 28); c.lineTo(cx + 20, ey - 30); }
    c.stroke();
    if (opts.glasses) {
      c.lineWidth = 5; c.strokeRect(cx - 58, ey - 20, 44, 36); c.strokeRect(cx + 14, ey - 20, 44, 36);
      c.beginPath(); c.moveTo(cx - 14, ey - 6); c.lineTo(cx + 14, ey - 6); c.stroke();
    }
    if (opts.freckles) { c.fillStyle = '#c98a2a'; for (const [dx, dy] of [[-50, 30], [-40, 38], [-30, 30], [50, 30], [40, 38], [30, 30]]) { c.beginPath(); c.arc(cx + dx, ey + dy, 3, 0, Math.PI * 2); c.fill(); } }
    if (opts.beard) { c.fillStyle = 'rgba(60,40,20,.35)'; c.beginPath(); c.ellipse(cx, 200, 80, 40, 0, 0, Math.PI * 2); c.fill(); }
    const my = 185;
    c.fillStyle = '#1b1b1b'; c.lineWidth = 6;
    if (expr === 'scream') {
      c.fillStyle = '#5a0c0c'; c.beginPath(); c.ellipse(cx, my, 26, 34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d94040'; c.beginPath(); c.ellipse(cx, my + 16, 15, 10, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.fillRect(cx - 16, my - 30, 32, 8);
    } else if (expr === 'ooh') {
      c.fillStyle = '#5a0c0c'; c.beginPath(); c.ellipse(cx, my, 14, 18, 0, 0, Math.PI * 2); c.fill();
    } else if (expr === 'grr') {
      c.fillStyle = '#fff'; c.fillRect(cx - 34, my - 12, 68, 24); c.strokeRect(cx - 34, my - 12, 68, 24);
      c.beginPath(); c.moveTo(cx - 34, my); c.lineTo(cx + 34, my); c.stroke();
      if (opts.goldTooth) { c.fillStyle = '#ffcc33'; c.fillRect(cx + 4, my - 12, 12, 12); }
    } else if (expr === 'dizzy') {
      c.beginPath(); c.moveTo(cx - 36, my); c.quadraticCurveTo(cx - 18, my - 16, cx, my); c.quadraticCurveTo(cx + 18, my + 16, cx + 36, my); c.stroke();
    } else if (expr === 'smirk') {
      c.beginPath(); c.moveTo(cx - 30, my); c.quadraticCurveTo(cx + 6, my + 18, cx + 36, my - 12); c.stroke();
    } else if (expr === 'closed') {
      c.beginPath(); c.arc(cx, my - 20, 26, 0.3, Math.PI - 0.3); c.stroke();
    } else {
      c.beginPath(); c.arc(cx, my - 26, 36, 0.25, Math.PI - 0.25); c.stroke();
      if (opts.goldTooth) { c.fillStyle = '#ffcc33'; c.fillRect(cx + 6, my + 4, 12, 10); }
    }
    if (opts.lipstick && expr !== 'scream' && expr !== 'ooh') { c.strokeStyle = '#b3202a'; c.lineWidth = 4; c.beginPath(); c.arc(cx, my - 26, 36, 0.35, Math.PI - 0.35); c.stroke(); }
  });
  faceCache.set(key, t);
  return t;
}

function printTexture(color, draw) {
  return canvasTex(256, 256, (c, w, h) => { c.fillStyle = color; c.fillRect(0, 0, w, h); draw && draw(c, w, h); });
}

// ---------------------------------------------------------------------
// Uiterlijk van de personages
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export const LOOKS = {
  kevin: {
    shortLegs: true, legs: 0x3a5fa8, hips: 0x3a5fa8, torso: C.red, arms: C.red, face: { freckles: true },
    print(c) { c.fillStyle = '#f4f4f4'; c.fillRect(0, 150, 256, 26); c.fillStyle = '#237841'; for (let x = 8; x < 256; x += 30) { c.beginPath(); c.moveTo(x, 172); c.lineTo(x + 10, 154); c.lineTo(x + 20, 172); c.fill(); } c.fillStyle = '#8a1010'; c.fillRect(80, 0, 96, 18); },
    hair: 'kevin',
  },
  harry: {
    legs: 0x4a3b2a, hips: 0x3a2e20, torso: 0x6b4a2b, arms: 0x6b4a2b, face: { goldTooth: true, beard: true },
    print(c) { c.fillStyle = '#3d2a17'; c.fillRect(122, 0, 12, 256); c.fillStyle = '#8a6a44'; c.beginPath(); c.moveTo(40, 0); c.lineTo(118, 90); c.lineTo(118, 0); c.fill(); c.beginPath(); c.moveTo(216, 0); c.lineTo(138, 90); c.lineTo(138, 0); c.fill(); c.fillStyle = '#222'; for (const y of [120, 170, 220]) { c.beginPath(); c.arc(106, y, 7, 0, 7); c.fill(); } },
    hair: 'beanie',
  },
  marv: {
    tall: true, legs: 0x2d3d52, hips: 0x1e2a38, torso: 0x5b6e3a, arms: 0x5b6e3a, face: {},
    print(c) { c.strokeStyle = '#3c4a24'; c.lineWidth = 8; for (let i = 0; i < 256; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); } c.strokeStyle = '#a33'; c.lineWidth = 3; for (let i = 20; i < 256; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke(); } },
    hair: 'curly',
  },
  kate: {
    legs: 0x2b2b3a, torso: 0x7a1f2b, arms: 0x7a1f2b, face: { lipstick: true },
    print(c) { c.fillStyle = '#f2e6d0'; c.beginPath(); c.moveTo(90, 0); c.lineTo(128, 70); c.lineTo(166, 0); c.fill(); c.fillStyle = '#d4af37'; c.beginPath(); c.arc(128, 90, 8, 0, 7); c.fill(); },
    hair: 'long',
  },
  peter: {
    legs: 0x3a3a44, torso: 0x8a6a4a, arms: 0x8a6a4a, face: {},
    print(c) { c.fillStyle = '#6a4a2a'; for (let y = 30; y < 256; y += 30) c.fillRect(0, y, 256, 10); c.fillStyle = '#fff'; c.fillRect(100, 0, 56, 30); },
    hair: 'short',
  },
  buzz: {
    tall: true, legs: 0x2d3d52, torso: 0x2c6a4a, arms: 0x2c6a4a, face: {},
    print(c) { c.strokeStyle = '#1d4a33'; c.lineWidth = 10; for (let x = 20; x < 256; x += 50) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); } },
    hair: 'messy',
  },
  frank: {
    legs: 0x444444, torso: 0x5a2a3a, arms: 0x5a2a3a, face: { glasses: true },
    print(c) { c.fillStyle = '#ddd'; c.fillRect(100, 0, 56, 26); },
    hair: 'bald',
  },
  kid: { shortLegs: true, legs: 0x555555, torso: 0x2a6ab0, arms: 0x2a6ab0, face: { freckles: true }, hair: 'short', hairColor: 0xb5652a },
  cop: {
    legs: 0x1d2a4a, torso: 0x24365e, arms: 0x24365e, face: {},
    print(c) { c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(60, 60); c.lineTo(80, 50); c.lineTo(100, 60); c.lineTo(96, 90); c.lineTo(64, 90); c.fill(); c.fillStyle = '#ccc'; c.fillRect(122, 0, 12, 256); },
    hair: 'cap',
  },
  marley: {
    legs: 0x333333, torso: 0x2b2b33, arms: 0x2b2b33, face: { beard: true },
    print(c) { c.fillStyle = '#ddd'; c.fillRect(100, 0, 56, 50); }, hair: 'marley',
  },
};

function hairMesh(kind, colorOverride) {
  const g = new THREE.Group();
  const add = (geo, color, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(geo, mat(color)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m;
  };
  switch (kind) {
    case 'kevin': {
      const col = colorOverride || 0xe9c46a;
      add(GEO.sphere, col, 0, 0.55, -0.04, 0.66, 0.5, 0.68);
      add(GEO.box, col, 0, 0.62, 0.42, 1.05, 0.28, 0.35);   // pony
      add(GEO.box, col, 0, 0.2, -0.36, 1.2, 0.8, 0.55);     // achterkant
      break;
    }
    case 'short': {
      const col = colorOverride || 0x4a3020;
      add(GEO.sphere, col, 0, 0.55, -0.03, 0.64, 0.42, 0.66);
      add(GEO.box, col, 0, 0.2, -0.35, 1.18, 0.7, 0.5);
      break;
    }
    case 'messy': {
      const col = 0x7a4a24;
      add(GEO.sphere, col, 0, 0.55, -0.02, 0.68, 0.5, 0.7);
      for (const [x, z] of [[-0.35, 0.3], [0.1, 0.4], [0.4, 0.2]]) add(GEO.sphere, col, x, 0.62, z, 0.3, 0.25, 0.25);
      add(GEO.box, col, 0, 0.2, -0.35, 1.2, 0.8, 0.5);
      break;
    }
    case 'beanie':
      add(GEO.sphere, 0x26262b, 0, 0.5, 0, 0.66, 0.62, 0.66);
      add(GEO.cyl, 0x3a3a42, 0, 0.42, 0, 0.66, 0.3, 0.66);
      break;
    case 'curly': {
      const col = 0x5a3a1e;
      for (const [x, y, z, r] of [[-0.45, 0.4, 0, 0.35], [0.45, 0.4, 0, 0.35], [0, 0.72, 0, 0.42], [-0.3, 0.7, 0.3, 0.3], [0.3, 0.7, 0.3, 0.3], [0, 0.55, -0.4, 0.45], [-0.5, 0.1, -0.2, 0.3], [0.5, 0.1, -0.2, 0.3]]) add(GEO.sphere, col, x, y, z, r, r, r);
      break;
    }
    case 'long': {
      const col = 0x3b2314;
      add(GEO.sphere, col, 0, 0.55, -0.04, 0.68, 0.52, 0.7);
      add(GEO.box, col, 0, -0.1, -0.3, 1.3, 1.3, 0.6);
      add(GEO.box, col, -0.58, -0.1, 0.1, 0.2, 1.2, 0.5); add(GEO.box, col, 0.58, -0.1, 0.1, 0.2, 1.2, 0.5);
      break;
    }
    case 'bald':
      add(GEO.box, 0x6a5a4a, -0.56, 0.2, -0.1, 0.12, 0.4, 0.7); add(GEO.box, 0x6a5a4a, 0.56, 0.2, -0.1, 0.12, 0.4, 0.7);
      break;
    case 'cap':
      add(GEO.cyl, 0x1d2a4a, 0, 0.6, 0, 0.62, 0.5, 0.62);
      add(GEO.box, 0x111111, 0, 0.4, 0.45, 1.0, 0.08, 0.5);
      add(GEO.box, 0xf2c230, 0, 0.66, 0.6, 0.25, 0.25, 0.05);
      break;
    case 'marley':
      add(GEO.cyl, 0x4a3a2a, 0, 0.55, 0, 0.62, 0.35, 0.62);
      add(GEO.box, 0x4a3a2a, 0, 0.42, 0.45, 1.0, 0.08, 0.45);
      add(GEO.box, 0xe8e8e8, 0, -0.35, 0.5, 0.8, 0.4, 0.1);
      break;
  }
  return g;
}

// ---------------------------------------------------------------------
// Minifiguur
export class Minifig {
  constructor(lookName) {
    const L = LOOKS[lookName];
    this.look = L; this.lookName = lookName;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); // voor kantelen/omvallen
    this.root.add(this.body);
    const legH = L.shortLegs ? 0.9 : 1.6;
    const scale = L.tall ? 1.08 : 1;
    this.body.scale.setScalar(scale);
    this.legH = legH;
    const legMat = mat(L.legs), hipMat = mat(L.hips || L.legs);

    // benen
    this.legL = new THREE.Group(); this.legR = new THREE.Group();
    for (const [leg, x] of [[this.legL, -0.46], [this.legR, 0.46]]) {
      leg.position.set(x, legH, 0);
      const m = new THREE.Mesh(GEO.box, legMat); m.scale.set(0.88, legH - 0.1, 0.9); m.position.y = -(legH - 0.1) / 2; m.castShadow = true;
      const foot = new THREE.Mesh(GEO.box, legMat); foot.scale.set(0.88, 0.3, 1.15); foot.position.set(0, -legH + 0.15, 0.1); foot.castShadow = true;
      leg.add(m, foot);
      this.body.add(leg);
    }
    const hips = new THREE.Mesh(GEO.box, hipMat); hips.scale.set(1.9, 0.4, 0.95); hips.position.y = legH + 0.2; hips.castShadow = true;
    this.body.add(hips);

    // torso: taps toelopend
    const tg = new THREE.BoxGeometry(1.9, 1.3, 0.95);
    const pos = tg.attributes.position;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) pos.setX(i, pos.getX(i) * 0.7);
    tg.computeVertexNormals();
    const torsoTex = printTexture(hex(L.torso), L.print);
    const torsoMat = mat(L.torso), printMat = new THREE.MeshStandardMaterial({ map: torsoTex, roughness: 0.32 });
    this.torso = new THREE.Mesh(tg, [torsoMat, torsoMat, torsoMat, torsoMat, printMat, torsoMat]);
    this.torso.position.y = legH + 0.4 + 0.65; this.torso.castShadow = true;
    this.body.add(this.torso);
    const torsoTop = legH + 0.4 + 1.3;

    // armen
    this.armL = new THREE.Group(); this.armR = new THREE.Group();
    const armMat = mat(L.arms), handMat = mat(C.skin);
    for (const [arm, s] of [[this.armL, -1], [this.armR, 1]]) {
      arm.position.set(s * 0.82, torsoTop - 0.25, 0);
      const a = new THREE.Mesh(GEO.cyl, armMat); a.scale.set(0.24, 1.0, 0.26); a.position.set(s * 0.16, -0.45, 0.05); a.rotation.z = s * 0.25; a.castShadow = true;
      const hand = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.09, 8, 14, Math.PI * 1.5), handMat);
      hand.position.set(s * 0.3, -1.05, 0.18); hand.rotation.set(Math.PI / 2, 0, 0); hand.castShadow = true;
      const wrist = new THREE.Mesh(GEO.cyl, handMat); wrist.scale.set(0.1, 0.15, 0.1); wrist.position.set(s * 0.3, -0.95, 0.12);
      arm.add(a, hand, wrist);
      this.body.add(arm);
    }
    this.handR = this.armR;

    // hoofd
    this.head = new THREE.Group();
    this.head.position.y = torsoTop + 0.1;
    const neck = new THREE.Mesh(GEO.cyl, handMat); neck.scale.set(0.28, 0.15, 0.28); neck.position.y = 0.02;
    this.faceOpts = L.face || {};
    this.headMat = new THREE.MeshStandardMaterial({ map: faceTexture('smile', this.faceOpts), roughness: 0.3 });
    const hg = new THREE.CylinderGeometry(0.58, 0.58, 1.0, 28, 1, false, Math.PI, Math.PI * 2);
    const headMesh = new THREE.Mesh(hg, [this.headMat, handMat, handMat]);
    headMesh.position.y = 0.6; headMesh.castShadow = true;
    const hstud = new THREE.Mesh(GEO.cyl, handMat); hstud.scale.set(0.3, 0.18, 0.3); hstud.position.y = 1.18;
    this.head.add(neck, headMesh, hstud);
    const hair = hairMesh(L.hair, L.hairColor); hair.position.y = 0.6; this.head.add(hair);
    this.hair = hair;
    this.body.add(this.head);
    this.height = (torsoTop + 1.3) * scale;
    this.expr = 'smile';

    this.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.parts = [this.legL, this.legR, hips, this.torso, this.armL, this.armR, this.head];
  }

  setExpr(e) {
    if (e === this.expr) return;
    this.expr = e;
    this.headMat.map = faceTexture(e, this.faceOpts);
    this.headMat.needsUpdate = true;
  }

  // walk: fase; speed: 0..1
  pose(o = {}) {
    const w = o.walk || 0, amp = (o.amp == null ? 0.7 : o.amp);
    this.legL.rotation.x = Math.sin(w) * amp;
    this.legR.rotation.x = -Math.sin(w) * amp;
    this.armL.rotation.x = o.armL != null ? -o.armL : -Math.sin(w) * amp * 0.8;
    this.armR.rotation.x = o.armR != null ? -o.armR : Math.sin(w) * amp * 0.8;
    this.armL.rotation.z = o.armLz || 0; this.armR.rotation.z = -(o.armRz || 0);
    this.head.rotation.y = o.headY || 0;
  }
}
