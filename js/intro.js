// De filmintro in bouwsteen-stijl + de voorgevel van het huis van de McCallisters.
'use strict';

// ---------------------------------------------------------------------
// Extra familieleden
Object.assign(Looks, {
  kate: {
    legColor: '#2b2b3a', torsoColor: '#7a1f2b', armColor: '#7a1f2b',
    torsoPrint(c) { c.fillStyle = '#f2e6d0'; c.beginPath(); c.moveTo(-5, 0); c.lineTo(0, 7); c.lineTo(5, 0); c.fill(); },
    hair(c) {
      c.fillStyle = '#3b2314';
      c.beginPath(); c.moveTo(-12, 20); c.quadraticCurveTo(-15, -7, 0, -7); c.quadraticCurveTo(15, -7, 12, 20);
      c.lineTo(9, 18); c.lineTo(10, 4); c.lineTo(-10, 4); c.lineTo(-9, 18); c.closePath(); c.fill();
      c.fillStyle = '#5a3a24'; c.fillRect(-6, -5, 8, 2);
    },
    face2: true,
  },
  peter: {
    legColor: '#3a3a44', torsoColor: '#8a6a4a', armColor: '#8a6a4a',
    torsoPrint(c) { c.fillStyle = '#fff'; c.fillRect(-3, 0, 6, 5); c.fillStyle = '#6a4a2a'; for (let i = 0; i < 4; i++) c.fillRect(-10, 6 + i * 4, 20, 1.5); },
    hair(c) { c.fillStyle = '#4a3020'; c.fillRect(-11, -4, 22, 8); c.fillRect(-11, 0, 3, 8); c.fillRect(8, 0, 3, 8); },
  },
  buzz: {
    scale: 1.1, legColor: '#2d3d52', torsoColor: '#2c6a4a', armColor: '#2c6a4a',
    torsoPrint(c) { c.strokeStyle = '#1d4a33'; c.lineWidth = 1.5; for (let i = -8; i <= 8; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 24); c.stroke(); } },
    hair(c) {
      c.fillStyle = '#7a4a24';
      c.beginPath(); c.moveTo(-12, 8); c.quadraticCurveTo(-12, -9, 2, -8); c.quadraticCurveTo(13, -6, 12, 8); c.lineTo(8, 2); c.lineTo(-8, 3); c.fill();
    },
  },
  frank: {
    legColor: '#444', torsoColor: '#5a2a3a', armColor: '#5a2a3a',
    torsoPrint(c) { c.fillStyle = '#ddd'; c.fillRect(-4, 0, 8, 4); },
    hair(c) { c.fillStyle = '#6a5a4a'; c.fillRect(-11, 2, 4, 8); c.fillRect(7, 2, 4, 8); },
    overlay(c, hy) {
      c.strokeStyle = '#222'; c.lineWidth = 1.5;
      c.strokeRect(-8, hy + 5, 6, 5); c.strokeRect(2, hy + 5, 6, 5);
      c.beginPath(); c.moveTo(-2, hy + 7); c.lineTo(2, hy + 7); c.stroke();
    },
  },
  kid: {
    shortLegs: true, legColor: '#555', torsoColor: '#2a6ab0', armColor: '#2a6ab0',
    hair(c) { c.fillStyle = '#b5652a'; c.fillRect(-11, -4, 22, 8); },
  },
});

// ---------------------------------------------------------------------
// Voorgevel: rode stenen, witte kozijnen, zwarte luiken, kransen en lichtjes.
// o: { x0, x1, top, ground, up:[x], down:[x], door:x, lit, t, lightsOn, roof, snowRoof }
function drawFacade(c, o) {
  const { x0, x1, top, ground } = o;
  const t = o.t || 0;
  const mid = (top + ground) / 2;
  // Muur van stenen
  const bw = 32, bh = 14;
  for (let y = top, row = 0; y < ground; y += bh, row++) {
    for (let x = x0 - (row % 2) * bw / 2; x < x1; x += bw) {
      const xx = Math.max(x, x0), w = Math.min(x + bw, x1) - xx;
      if (w <= 0) continue;
      const v = ((Math.floor(x / bw) * 7 + row * 13) % 5) * 0.025 - 0.05;
      const col = shade('#a8352c', v);
      c.fillStyle = col; c.fillRect(xx, y, w, bh);
      c.fillStyle = shade(col, 0.18); c.fillRect(xx, y, w, 2);
      c.fillStyle = shade(col, -0.3); c.fillRect(xx, y + bh - 2, w, 2); c.fillRect(xx + w - 1.5, y, 1.5, bh);
    }
  }
  // Witte daklijst en tussenband
  Draw.brick(c, x0 - 10, top - 4, x1 - x0 + 20, 12, '#f2f0ea', { studW: 8, pitch: 16 });
  Draw.brick(c, x0, mid - 4, x1 - x0, 8, '#f2f0ea', { studs: false });
  // Hoekstenen
  for (let y = top; y < ground; y += 28) {
    Draw.brick(c, x0, y, 18, 13, '#e8e2d4', { studs: false });
    Draw.brick(c, x1 - 18, y + 14, 18, 13, '#e8e2d4', { studs: false });
  }

  const winH = (ground - top) * 0.3, winW = winH * 0.66;
  const window = (cx, cy) => {
    const x = cx - winW / 2, y = cy - winH / 2;
    // luiken
    for (const sx of [x - winW * 0.42, x + winW + 4]) {
      c.fillStyle = '#1d1f22'; c.fillRect(sx, y, winW * 0.38, winH);
      c.fillStyle = '#34373c'; for (let i = 0; i < 6; i++) c.fillRect(sx + 2, y + 4 + i * winH / 6, winW * 0.38 - 4, 2);
    }
    // kozijn
    c.fillStyle = '#f7f5ef'; c.fillRect(x - 5, y - 5, winW + 10, winH + 10);
    // glas
    if (o.lit) {
      const g = c.createLinearGradient(0, y, 0, y + winH);
      g.addColorStop(0, '#ffe7a0'); g.addColorStop(1, '#f5b84a');
      c.fillStyle = g;
    } else c.fillStyle = o.day ? '#9cc3de' : '#1a2440';
    c.fillRect(x, y, winW, winH);
    // roedes (6 over 6)
    c.fillStyle = '#f7f5ef';
    c.fillRect(x, y + winH / 2 - 2, winW, 4);
    for (let i = 1; i < 3; i++) c.fillRect(x + winW * i / 3 - 1, y, 2, winH);
    c.fillRect(x, y + winH / 4 - 1, winW, 2); c.fillRect(x, y + winH * 3 / 4 - 1, winW, 2);
    // vensterbank met sneeuw
    Draw.brick(c, x - 9, y + winH + 4, winW + 18, 6, '#f7f5ef', { studW: 5, pitch: 10 });
    // kerstkrans met strik
    const r = winW * 0.22;
    c.strokeStyle = '#1f6e32'; c.lineWidth = r * 0.45;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#d01012';
    c.beginPath(); c.moveTo(cx, cy + r); c.lineTo(cx - r * 0.6, cy + r * 0.6); c.lineTo(cx - r * 0.6, cy + r * 1.4); c.fill();
    c.beginPath(); c.moveTo(cx, cy + r); c.lineTo(cx + r * 0.6, cy + r * 0.6); c.lineTo(cx + r * 0.6, cy + r * 1.4); c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = '#e33'; c.beginPath(); c.arc(cx + Math.cos(i) * r, cy + Math.sin(i * 1.3) * r, 1.8, 0, Math.PI * 2); c.fill(); }
  };
  const upY = top + (mid - top) * 0.52, downY = mid + (ground - mid) * 0.46;
  for (const x of o.up || []) window(x, upY);
  for (const x of o.down || []) window(x, downY);

  // Voordeur met witte zuilen, fronton en krans
  if (o.door != null) {
    const dx = o.door, dw = winW * 0.95, dh = (ground - mid) * 0.72;
    const dy = ground - dh - 10;
    c.fillStyle = '#f7f5ef';
    c.beginPath(); c.moveTo(dx - dw * 1.25, dy - 12); c.lineTo(dx, dy - 12 - dw * 0.55); c.lineTo(dx + dw * 1.25, dy - 12); c.fill();
    Draw.brick(c, dx - dw * 1.2, dy - 14, dw * 2.4, 12, '#f7f5ef', { studs: false });
    for (const s of [-1, 1]) {
      const cx = dx + s * dw * 0.95;
      c.fillStyle = '#f7f5ef'; c.fillRect(cx - 7, dy - 2, 14, dh + 2);
      c.fillStyle = '#dcd8ce'; c.fillRect(cx + 3, dy - 2, 3, dh + 2);
    }
    // bovenlicht
    c.fillStyle = o.lit ? '#ffd88a' : '#1a2440';
    c.beginPath(); c.arc(dx, dy + 6, dw * 0.46, Math.PI, 0); c.fill();
    c.fillStyle = '#1e3b2a'; c.fillRect(dx - dw / 2, dy + 6, dw, dh - 6);
    c.fillStyle = '#16301f'; c.fillRect(dx - dw / 2 + 5, dy + 12, dw / 2 - 8, dh * 0.35); c.fillRect(dx + 3, dy + 12, dw / 2 - 8, dh * 0.35);
    c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(dx + dw * 0.33, dy + dh * 0.55, 2.5, 0, Math.PI * 2); c.fill();
    const r = dw * 0.26;
    c.strokeStyle = '#1f6e32'; c.lineWidth = r * 0.5;
    c.beginPath(); c.arc(dx, dy + dh * 0.33, r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#d01012'; c.fillRect(dx - 4, dy + dh * 0.33 + r - 3, 8, 6);
    // stoep
    for (let i = 0; i < 3; i++) Draw.brick(c, dx - dw * 1.3 + i * 8, ground - 10 + i * 0 - (2 - i) * 0, dw * 2.6 - i * 16, 4, '#bdbdbd', { studs: false });
    Draw.brick(c, dx - dw * 1.4, ground - 8, dw * 2.8, 8, '#c8c8c8', { studW: 6, pitch: 12 });
  }

  // Struikjes met lichtjes
  for (let x = x0 + 30; x < x1 - 20; x += 70) {
    if (o.door != null && Math.abs(x - o.door) < winW * 1.6) continue;
    c.fillStyle = '#1d4a2a'; c.beginPath(); c.arc(x, ground - 12, 20, Math.PI, 0); c.fill();
    c.fillStyle = '#f4f8ff'; c.fillRect(x - 14, ground - 30, 12, 3);
    if (o.lightsOn) for (let i = 0; i < 4; i++) {
      c.fillStyle = Math.sin(t * 4 + i + x) > 0 ? ['#ff4a4a', '#ffd84a', '#4ab8ff', '#7aff7a'][i] : '#553';
      c.beginPath(); c.arc(x - 12 + i * 8, ground - 16 - (i % 2) * 8, 2.2, 0, Math.PI * 2); c.fill();
    }
  }

  // Dak (alleen in de intro)
  if (o.roof) {
    const rh = (ground - top) * 0.42;
    for (let k = 0, rows = 8; k < rows; k++) {
      const y = top - (k + 1) * rh / rows;
      const inset = (k + 1) * (x1 - x0) * 0.028;
      Draw.brick(c, x0 - 16 + inset, y, x1 - x0 + 32 - inset * 2, rh / rows + 1, k % 2 ? '#3d414b' : '#474c57', { studs: false });
      if (o.snowRoof) Draw.brick(c, x0 - 16 + inset, y - 3, x1 - x0 + 32 - inset * 2, 4, '#f4f8ff', { studs: false });
    }
    // schoorsteen
    const chx = x1 - (x1 - x0) * 0.2;
    for (let y = top - rh * 1.1; y < top - rh * 0.3; y += 14) Draw.brick(c, chx, y, 36, 14, '#a8352c', { studs: false });
    Draw.brick(c, chx - 4, top - rh * 1.1 - 8, 44, 8, '#f4f8ff', { studW: 6, pitch: 12 });
    // lichtjes langs de dakrand
    if (o.lightsOn) {
      const n = Math.floor((x1 - x0) / 18);
      for (let i = 0; i <= n; i++) {
        const lx = x0 - 10 + i * (x1 - x0 + 20) / n;
        c.fillStyle = Math.sin(t * 3 + i * 1.3) > -0.2 ? ['#ff4a4a', '#ffd84a', '#4ab8ff', '#7aff7a'][i % 4] : '#444';
        c.beginPath(); c.arc(lx, top + 8 + Math.sin(i * 1.7) * 2, 3, 0, Math.PI * 2); c.fill();
      }
    }
  }
}

// De gevel van het intro-huis (compact, in lokale coördinaten rond x=0, grond=0)
function drawIntroHouse(c, cx, ground, s, o = {}) {
  c.save();
  c.translate(cx, ground); c.scale(s, s);
  // zijvleugel links
  drawFacade(c, { x0: -470, x1: -330, top: -190, ground: 0, up: [], down: [-400], lit: o.lit, day: o.day, t: o.t, lightsOn: o.lightsOn, roof: true, snowRoof: !o.day || o.snow });
  drawFacade(c, { x0: -330, x1: 330, top: -330, ground: 0, up: [-240, -120, 0, 120, 240], down: [-240, -120, 120, 240], door: 0, lit: o.lit, day: o.day, t: o.t, lightsOn: o.lightsOn, roof: true, snowRoof: !o.day || o.snow });
  if (o.atticLight) {
    c.fillStyle = '#ffe7a0'; c.fillRect(-18, -420, 36, 26);
    c.fillStyle = '#f7f5ef'; c.fillRect(-20, -396, 40, 4); c.fillRect(-1, -420, 2, 26);
  }
  c.restore();
}

// ---------------------------------------------------------------------
// Decorstukken voor de intro
function nightSky(c, day, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  if (day) { g.addColorStop(0, '#7fb2e0'); g.addColorStop(1, '#dbe9f5'); }
  else { g.addColorStop(0, '#0b1433'); g.addColorStop(0.7, '#27346a'); g.addColorStop(1, '#3b4274'); }
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!day) {
    for (let i = 0; i < 120; i++) {
      c.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 2 + i)})`;
      c.fillRect((i * 97) % W, (i * 53) % 380, 2, 2);
    }
    c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(1080, 110, 40, 0, Math.PI * 2); c.fill();
  }
}

function snowGround(c, y, day) {
  c.fillStyle = day ? '#eef4fb' : '#cfd9ec'; c.fillRect(0, y, W, H - y);
  for (let x = 0; x < W; x += 32) Draw.brick(c, x, y - 8, 32, 10, day ? '#fafdff' : '#e4ecf8', { studW: 9, pitch: 16 });
  c.fillStyle = day ? '#9aa3ad' : '#5a6070'; c.fillRect(0, y + 60, W, 70); // straat
  c.fillStyle = '#e8e2a0'; for (let x = 20; x < W; x += 120) c.fillRect(x, y + 93, 60, 4);
}

function neighbours(c, y, lit) {
  for (const hx of [-120, 1080]) {
    c.fillStyle = '#1c2140'; c.fillRect(hx, y - 220, 320, 220);
    c.beginPath(); c.moveTo(hx - 20, y - 220); c.lineTo(hx + 160, y - 320); c.lineTo(hx + 340, y - 220); c.fill();
    c.fillStyle = lit ? '#f6d36a' : '#26305a';
    c.fillRect(hx + 50, y - 160, 50, 50); c.fillRect(hx + 220, y - 160, 50, 50);
  }
}

function drawVan(c, x, y, s, label, dir = 1, faces) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  Draw.brick(c, -110, -90, 220, 70, label ? '#e9e6dc' : '#f2f2f2', { studW: 10, pitch: 18 });
  Draw.brick(c, 60, -70, 60, 50, label ? '#e9e6dc' : '#f2f2f2', { studs: false });
  c.fillStyle = '#6fa8d8'; c.fillRect(70, -64, 36, 24);
  for (let i = 0; i < 3; i++) c.fillRect(-96 + i * 52, -80, 40, 24);
  if (faces) faces(c);
  if (label) {
    c.save(); c.scale(dir, 1);
    c.font = '15px "Luckiest Guy", "Arial Black", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#1d3f8a';
    c.fillText(label, dir > 0 ? -20 : 20, -34);
    c.restore();
  }
  c.fillStyle = '#d01012'; c.fillRect(-110, -32, 230, 5);
  for (const wx of [-70, 80]) {
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(wx, -18, 20, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#aaa'; c.beginPath(); c.arc(wx, -18, 8, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

function drawPlane(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#dfe3e8';
  c.beginPath(); c.moveTo(-150, -10); c.lineTo(-180, -60); c.lineTo(-150, -60); c.lineTo(-110, -18); c.fill();
  Draw.rr(c, -170, -24, 330, 44, 22); c.fill();
  c.fillStyle = '#d01012'; c.fillRect(-160, 0, 310, 6);
  c.fillStyle = '#1d3f8a'; for (let i = 0; i < 12; i++) c.fillRect(-110 + i * 20, -14, 10, 9);
  c.fillStyle = '#c9ced6'; c.beginPath(); c.moveTo(-20, 8); c.lineTo(40, 8); c.lineTo(-40, 60); c.lineTo(-70, 60); c.fill();
  for (let i = 0; i < 8; i++) Draw.topStud(c, -120 + i * 34, -22, 12, '#dfe3e8');
  c.restore();
}

function roomBackdrop(c, color, floorY) {
  c.fillStyle = color; c.fillRect(0, 0, W, floorY);
  for (let x = 0; x < W; x += 30) { c.fillStyle = shade(color, 0.06); c.fillRect(x, 0, 12, floorY); }
  c.fillStyle = shade(color, -0.3); c.fillRect(0, floorY - 18, W, 18);
  for (let x = 0; x < W; x += 64) Draw.brick(c, x, floorY, 64, H - floorY, '#b8864f', { studs: false });
}

function fig(c, look, x, y, extra = {}) {
  Draw.minifig(c, { ...Looks[look], x, y, dir: 1, ...extra, scale: (extra.scale || 1) * (Looks[look].scale || 1) });
}

// ---------------------------------------------------------------------
// Scènes
const SCENES = [
  {
    // 1. Titel: het huis in de sneeuw
    dur: 10,
    draw(c, t) {
      nightSky(c, false, t);
      neighbours(c, 560, true);
      snowGround(c, 560, false);
      const s = 0.85 + t * 0.012;
      drawIntroHouse(c, 640, 560, s, { lit: true, lightsOn: true, t });
      // lantaarnpaal
      c.fillStyle = '#222'; c.fillRect(150, 400, 8, 160);
      c.fillStyle = 'rgba(255,230,150,.9)'; c.beginPath(); c.arc(154, 395, 14, 0, Math.PI * 2); c.fill();
      const a1 = clamp((t - 1.2) / 1, 0, 1), a2 = clamp((t - 3.2) / 0.6, 0, 1), a3 = clamp((t - 5.5) / 0.8, 0, 1);
      c.globalAlpha = a1 * (1 - clamp((t - 9.2) / 0.8, 0, 1));
      Draw.comic(c, 'EEN BOUWSTEEN-KLASSIEKER', 640, 110, 26, '#ffd84a');
      c.globalAlpha = a2 * (1 - clamp((t - 9.2) / 0.8, 0, 1));
      c.save(); c.translate(640, 210); const zs = 1.4 - a2 * 0.4; c.scale(zs, zs);
      c.font = 'bold 110px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 12; c.strokeStyle = '#7a0a0c'; c.strokeText('HOME ALONE', 0, 0);
      c.fillStyle = '#fff'; c.fillText('HOME ALONE', 0, 0);
      c.restore();
      c.globalAlpha = a3 * (1 - clamp((t - 9.2) / 0.8, 0, 1));
      c.save(); c.translate(640, 290); c.rotate(-0.04);
      c.fillStyle = '#d01012'; Draw.rr(c, -170, -24, 340, 48, 10); c.fill();
      c.lineWidth = 4; c.strokeStyle = '#1a1a1a'; c.stroke();
      Draw.comic(c, 'STEEN VOOR STEEN', 0, 2, 32, '#fff');
      c.restore();
      c.globalAlpha = 1;
    },
    lines: [],
  },
  {
    // 2. De avond voor de reis: ruzie om de kaaspizza
    dur: 14,
    draw(c, t) {
      roomBackdrop(c, '#ddd3b4', 560);
      // keukenkastjes en raam
      for (let x = 40; x < 400; x += 60) Draw.brick(c, x, 470, 60, 90, '#e6e0cc', { studs: false });
      Draw.brick(c, 40, 462, 360, 10, '#8b8f99', { studW: 8 });
      c.fillStyle = '#1a2440'; c.fillRect(120, 200, 180, 140); c.fillStyle = '#f7f5ef'; c.fillRect(206, 200, 8, 140); c.fillRect(120, 266, 180, 8);
      c.strokeStyle = '#f7f5ef'; c.lineWidth = 10; c.strokeRect(120, 200, 180, 140);
      // tafel met pizzadozen
      Draw.brick(c, 520, 470, 520, 14, '#6b3f1f', { studW: 9 });
      c.fillStyle = '#4a2a14'; c.fillRect(540, 484, 12, 76); c.fillRect(1008, 484, 12, 76);
      for (const px of [560, 700, 860]) { Draw.brick(c, px, 454, 90, 16, '#e0c79a', { studW: 7, pitch: 12 }); }
      c.font = '10px sans-serif'; c.fillStyle = '#c33'; c.textAlign = 'center'; c.fillText("LIL' NERO'S", 605, 466);
      const spill = t > 7.2;
      const kx = t < 1 ? 1380 - t * 300 : t < 6.8 ? 1080 : t < 7.2 ? 1080 - (t - 6.8) * 500 : 900;
      const surprise = t > 7.2 && t < 12;
      const S = { scale: 1.7 };
      fig(c, 'kate', 200, 560, { ...S, expr: t > 9.8 && t < 12 ? 'grr' : surprise ? 'ooh' : 'smile', armR: t > 9.8 && t < 12 ? 2.3 : null, walk: t < 7 ? t * 8 : 0, dir: 1 });
      fig(c, 'peter', 330, 560, { ...S, expr: surprise ? 'ooh' : 'smile', dir: 1 });
      fig(c, 'frank', 460, 560, { ...S, expr: t > 8.4 && t < 10 ? 'grr' : surprise ? 'scream' : 'smirk', dir: 1 });
      fig(c, 'buzz', 800, 560, { ...S, expr: t > 4.8 && t < 7 ? 'smirk' : surprise ? 'scream' : 'smile', dir: 1, armR: t > 4.5 && t < 7 ? 2.2 : null,
        holding: t > 4.5 && t < 7 ? (h) => { h.fillStyle = '#f5c04a'; h.beginPath(); h.moveTo(-6, 20); h.lineTo(8, 16); h.lineTo(2, 34); h.fill(); h.fillStyle = '#c33'; h.fillRect(0, 22, 3, 3); } : null });
      fig(c, 'kevin', kx, 560, { ...S, dir: -1, walk: (t < 1 || (t > 6.8 && t < 7.2)) ? t * 16 : 0, expr: t > 11.4 ? 'grr' : t > 2.8 ? 'grr' : 'smile', armL: t > 6.8 && t < 7.3 ? 1.6 : null, armR: t > 6.8 && t < 7.3 ? 1.6 : null });
      if (spill) {
        const u = t - 7.2;
        for (let i = 0; i < 14; i++) {
          const bx = 880 + Math.cos(i * 2.3) * u * 260, by = 450 - u * 380 * Math.sin(1 + i * 0.3) + 700 * u * u;
          if (by < 555) { c.save(); c.translate(bx, by); c.rotate(u * 6 + i); Draw.brick(c, -8, -4, 16, 8, i % 3 ? '#ffffff' : '#c8232c', { studW: 5, pitch: 8 }); c.restore(); }
        }
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(900, 556, Math.min(160, u * 200), 6, 0, 0, Math.PI * 2); c.fill();
        if (u < 1.2) Draw.comic(c, 'BOEM!', 880, 330, 60 + u * 20, '#ffd84a');
      }
    },
    lines: [
      [0.4, 'Kate', 'Iedereen inpakken! Morgen vliegen we naar Parijs!'],
      [2.9, 'Kevin', 'Hé! Wie heeft mijn kaaspizza?'],
      [4.8, 'Buzz', 'Die heb ik opgegeten, sukkel. Hap hap!'],
      [7.2, '', ''],
      [8.4, 'Oom Frank', 'Kijk nou wat je gedaan hebt, kleine sukkel!'],
      [9.9, 'Kate', 'Kevin! Naar boven. Naar de zolder. NU!'],
      [11.6, 'Kevin', 'Ik hoop dat ik jullie NOOIT meer zie!'],
    ],
  },
  {
    // 3. Die nacht: stroomstoring
    dur: 7,
    draw(c, t) {
      nightSky(c, false, t);
      snowGround(c, 560, false);
      const lit = t < 2.6;
      drawIntroHouse(c, 520, 560, 0.72, { lit, lightsOn: lit, t });
      // boom, tak en stroomkabel
      c.fillStyle = '#3a2412'; c.fillRect(1050, 200, 34, 360);
      c.fillStyle = '#3a2412';
      const fall = clamp((t - 1.6) / 0.6, 0, 1);
      c.save(); c.translate(1060, 260); c.rotate(-0.4 - fall * 0.9); c.fillRect(-170, -8, 170, 14); c.restore();
      c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath();
      c.moveTo(1200, 250); c.quadraticCurveTo(1000, 270 + fall * 70, 790, 330); c.stroke();
      c.fillStyle = '#555'; c.fillRect(1196, 240, 10, 320);
      if (t > 2.1 && t < 3.2) {
        for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#fff' : '#ffd84a'; c.fillRect(960 + Math.random() * 60, 300 + Math.random() * 60, 4, 4); }
        Draw.comic(c, 'KRAK!', 1000, 200, 56, '#ffd84a');
      }
      // wind en sneeuw
      c.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 80; i++) { const x = ((i * 137 + t * 600) % (W + 100)) - 50, y = (i * 71 + t * 200) % H; c.fillRect(x, y, 6, 2); }
      // wekker
      if (t > 3.6) {
        const u = clamp((t - 3.6) / 0.3, 0, 1);
        c.save(); c.translate(640, 330); c.scale(u, u);
        c.fillStyle = '#1a1a1a'; Draw.rr(c, -170, -70, 340, 140, 20); c.fill();
        c.strokeStyle = '#d01012'; c.lineWidth = 8; c.stroke();
        c.font = 'bold 80px "Courier New", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = Math.sin(t * 8) > 0 ? '#ff3b30' : '#401010';
        c.fillText('--:--', 0, 4);
        c.restore();
      }
    },
    lines: [
      [0.3, 'Verteller', 'Die nacht stormt het in Winnetka, Illinois…'],
      [2.8, 'Verteller', 'De stroom valt uit. En dus gaan de wekkers niet af.'],
    ],
  },
  {
    // 4. De ochtend: verslapen!
    dur: 10,
    draw(c, t) {
      nightSky(c, true, t);
      snowGround(c, 560, true);
      drawIntroHouse(c, 460, 560, 0.62, { day: true, snow: true, t, atticLight: false });
      const vx = t < 6 ? 0 : -(t - 6) * (t - 6) * 260;
      drawVan(c, 900 + vx, 640, 0.9, '', -1);
      drawVan(c, 1160 + vx * 1.1, 640, 0.9, '', -1);
      // de familie rent naar de busjes
      if (t < 6) {
        for (let i = 0; i < 9; i++) {
          const ph = ((t * 0.5 + i * 0.13) % 1);
          const x = 480 + ph * 520, y = 570 + (i % 3) * 8;
          const look = ['kate', 'peter', 'buzz', 'frank', 'kid', 'kid', 'peter', 'kid', 'kate'][i];
          fig(c, look, x, y, { dir: 1, walk: t * 18 + i, expr: 'scream', armL: 2.5, armR: 0.3, scale: 0.8 });
        }
      }
      if (t < 2.3) Draw.comic(c, 'WE HEBBEN ONS VERSLAPEN!!!', 640, 140, 54, '#ffd84a');
      // zolderraampje
      if (t > 7) {
        c.fillStyle = 'rgba(255,255,255,.9)';
        for (let i = 0; i < 3; i++) { const u = ((t * 0.6 + i / 3) % 1); Draw.comic(c, 'z', 470 + u * 40 + i * 6, 290 - u * 70, 18 + u * 14, '#fff'); }
      }
    },
    lines: [
      [0.3, 'Kate', 'WE HEBBEN ONS VERSLAPEN! Iedereen in de busjes!'],
      [3, 'Buzz', '…9, 10, 11! Iedereen is er!'],
      [5.4, 'Verteller', '(Dat elfde kind was het buurjongetje…)'],
      [7.1, 'Verteller', 'En op zolder ligt er nog iemand heerlijk te slapen.'],
    ],
  },
  {
    // 5. Het vliegtuig: KEVIN!
    dur: 8.5,
    draw(c, t) {
      if (t < 4) {
        nightSky(c, true, t);
        for (let i = 0; i < 7; i++) {
          const x = ((i * 230 - t * 120) % (W + 300) + W + 300) % (W + 300) - 150;
          c.fillStyle = '#fff'; for (const [ox, oy, r] of [[0, 0, 40], [40, -14, 46], [84, 0, 38]]) { c.beginPath(); c.arc(x + ox, 520 + (i % 3) * 50 + oy, r, 0, Math.PI * 2); c.fill(); }
        }
        drawPlane(c, -200 + t * 440, 300 - t * 30, 1.1);
        Draw.comic(c, 'OP WEG NAAR PARIJS', 640, 110, 40, '#fff', '#1d3f8a');
      } else {
        // in de cabine
        c.fillStyle = '#d7d2c4'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#b9b3a3'; c.fillRect(0, 520, W, 200);
        for (let i = 0; i < 4; i++) {
          c.fillStyle = '#9cc3de'; Draw.rr(c, 160 + i * 280, 200, 110, 150, 40); c.fill();
          c.strokeStyle = '#8a8578'; c.lineWidth = 8; c.stroke();
        }
        for (let i = 0; i < 5; i++) Draw.brick(c, 60 + i * 250, 380, 150, 160, '#2a4a8a', { studs: false });
        const shout = t > 6.2;
        c.save();
        if (shout) c.translate(Math.random() * 8 - 4, Math.random() * 8 - 4);
        fig(c, 'peter', 380, 520, { expr: 'closed', scale: 1.8 });
        fig(c, 'kate', 640, 520, { expr: shout ? 'scream' : t > 5 ? 'ooh' : 'smile', scale: 1.8, armL: shout ? 2.6 : null, armR: shout ? 2.6 : null });
        c.restore();
        if (shout) {
          const u = clamp((t - 6.2) / 0.25, 0, 1);
          c.save(); c.translate(640, 150); c.scale(0.5 + u * 0.7, 0.5 + u * 0.7);
          Draw.comic(c, 'KEVIN!!!', 0, 0, 120, '#ff4a3a');
          c.restore();
        }
      }
    },
    lines: [
      [4.3, 'Kate', 'Ik heb het gevoel dat we iets vergeten zijn…'],
      [6.2, 'Kate', 'KEVIN!!!'],
    ],
  },
  {
    // 6. Kevin alleen thuis
    dur: 13,
    draw(c, t) {
      if (t < 8.4) {
        roomBackdrop(c, '#9cc7b5', 560);
        // ouderbed
        Draw.brick(c, 600, 470, 320, 90, '#7a4a2a', { studs: false });
        Draw.brick(c, 610, 452, 300, 22, '#d9d0ff', { studW: 9 });
        Draw.brick(c, 580, 360, 26, 200, '#5a3418', { studs: false });
        c.fillStyle = '#1a2440'; c.fillRect(160, 180, 150, 150); c.strokeStyle = '#f7f5ef'; c.lineWidth = 10; c.strokeRect(160, 180, 150, 150);
        let kx, ky = 560, expr = 'ooh', walk = 0, armL = null, armR = null, dir = 1;
        if (t < 3.4) { kx = 60 + t * 140; walk = t * 14; expr = 'ooh'; }
        else if (t < 5.8) { kx = 536; expr = 'smile'; armL = 2.8; armR = 2.8; }
        else { kx = 760; const u = (t - 5.8) * 3.2; ky = 452 - Math.abs(Math.sin(u)) * 120; expr = 'smile'; armL = 2.6; armR = 2.6; }
        fig(c, 'kevin', kx, ky, { expr, walk, armL, armR, dir, scale: 1.5 });
        if (t > 5.8) Draw.comic(c, 'BOING!', 760 + Math.sin(t * 5) * 30, 220, 34, '#ffd84a');
      } else {
        // badkamerspiegel: de aftershave
        c.fillStyle = '#bfe3f0'; c.fillRect(0, 0, W, H);
        for (let x = 0; x < W; x += 40) for (let y = 0; y < H; y += 40) { c.fillStyle = (x / 40 + y / 40) % 2 ? '#d7eef7' : '#c5e6f2'; c.fillRect(x, y, 39, 39); }
        c.fillStyle = '#c9a44c'; Draw.rr(c, 330, 40, 620, 600, 30); c.fill();
        c.fillStyle = '#e8f6ff'; Draw.rr(c, 350, 60, 580, 560, 24); c.fill();
        const scream = t > 9.6;
        c.save();
        if (scream) c.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
        fig(c, 'kevin', 640, 660, { scale: 5, expr: scream ? 'scream' : 'smirk', armL: scream ? 2.6 : 1.9, armR: scream ? 2.6 : 1.9 });
        c.restore();
        if (scream) {
          const u = clamp((t - 9.6) / 0.2, 0, 1);
          c.save(); c.translate(640, 110); c.scale(u, u); Draw.comic(c, 'AAAAAAAAAH!', 0, 0, 90, '#ffd84a'); c.restore();
        }
      }
    },
    lines: [
      [0.3, 'Kevin', 'Mam? Pap? Buzz…? Hallo?'],
      [3.5, 'Kevin', 'Ik heb mijn familie laten verdwijnen!'],
      [5.9, 'Kevin', 'Ik ben ALLEEN THUIS!'],
      [8.6, 'Kevin', 'Even een beetje aftershave van papa…'],
      [9.7, '', ''],
    ],
  },
  {
    // 7. De Natte Bandieten
    dur: 11,
    draw(c, t) {
      nightSky(c, false, t);
      neighbours(c, 560, true);
      snowGround(c, 560, false);
      const lit = t > 1.2;
      drawIntroHouse(c, 470, 560, 0.66, { lit, lightsOn: lit, t });
      if (t > 7.4) {
        // Kevin achter het raam
        c.save(); c.beginPath(); c.rect(470 - 30, 560 - 0.66 * 330 + 25, 60, 70); c.clip();
        fig(c, 'kevin', 470, 560 - 0.66 * 330 + 130, { expr: 'grr', scale: 0.9 });
        c.restore();
      }
      const vx = t < 2.6 ? 1500 - (1 - Math.pow(1 - t / 2.6, 2)) * 520 : 980;
      drawVan(c, vx - 110, 640, 1.05, 'OH-KAY LOODGIETERS', -1, (h) => {
        h.save(); h.beginPath(); h.rect(-96, -80, 144, 24); h.clip();
        Draw.minifig(h, { ...Looks.marv, x: -30, y: -20, dir: -1, scale: 0.55, expr: 'smile' });
        h.restore();
        h.save(); h.beginPath(); h.rect(70, -64, 36, 24); h.clip();
        Draw.minifig(h, { ...Looks.harry, x: 88, y: -4, dir: -1, scale: 0.55, expr: 'grr' });
        h.restore();
      });
      if (t > 9.4) {
        const u = clamp((t - 9.4) / 0.3, 0, 1);
        c.save(); c.translate(640, 150); c.scale(u, u);
        Draw.comic(c, 'VERDEDIG HET HUIS!', 0, 0, 72, '#ffd84a');
        c.restore();
      }
    },
    lines: [
      [0.3, 'Verteller', 'Maar in het busje van "Oh-Kay Loodgieters" zitten geen loodgieters…'],
      [2.8, 'Harry', 'Om 21:00 uur gaan die lichtjes aan. Dan gaan we naar binnen.'],
      [5.3, 'Marv', 'Hé Harry… volgens mij is dat joch helemaal alleen thuis.'],
      [7.5, 'Kevin', 'Dit is míjn huis. Ik moet het verdedigen!'],
    ],
  },
];

const Intro = {
  scene: 0, t: 0, onDone: null, active: false,

  start(onDone) {
    this.scene = 0; this.t = 0; this.onDone = onDone; this.active = true;
  },

  skip() {
    if (!this.active) return;
    this.active = false;
    if (this.onDone) this.onDone();
  },

  update(dt) {
    if (!this.active) return;
    const before = this.t;
    this.t += dt;
    const sc = SCENES[this.scene];
    // geluidjes op vaste momenten
    const at = (x) => before < x && this.t >= x;
    if (this.scene === 1 && at(7.2)) Sfx.smash();
    if (this.scene === 1 && at(9.9)) Sfx.hurt(true);
    if (this.scene === 2 && at(2.1)) { Sfx.noise(0.6, 0.5, 1500, 'lowpass'); Sfx.clang(); }
    if (this.scene === 3 && at(0.2)) Sfx.voice(500, 700, 0.9, 'a', 0.25, 8);
    if (this.scene === 3 && at(6)) Sfx.whoosh();
    if (this.scene === 4 && at(0.1)) Sfx.whoosh();
    if (this.scene === 4 && at(6.2)) Sfx.voice(620, 820, 1.2, 'e', 0.35, 9);
    if (this.scene === 5 && this.t > 5.8 && this.t < 8.4 && Math.floor(before * 3.2 / Math.PI) !== Math.floor(this.t * 3.2 / Math.PI)) Sfx.boing();
    if (this.scene === 5 && at(9.6)) Sfx.kevinScream();
    if (this.scene === 6 && at(1.2)) Sfx.buildDone();
    if (this.scene === 6 && at(9.4)) Sfx.fanfare();
    if (this.t >= sc.dur) {
      this.scene++; this.t = 0;
      if (this.scene >= SCENES.length) this.skip();
    }
  },

  render(c) {
    if (!this.active) return;
    const sc = SCENES[this.scene];
    c.save();
    sc.draw(c, this.t);
    c.restore();
    // fade tussen scènes
    const fade = Math.max(0, 1 - this.t / 0.4, 1 - (sc.dur - this.t) / 0.4);
    if (fade > 0) { c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); }
    // filmbalken
    c.fillStyle = '#000'; c.fillRect(0, 0, W, 50); c.fillRect(0, H - 50, W, 50);
    // ondertiteling
    let line = null;
    for (const l of sc.lines) if (this.t >= l[0]) line = l;
    if (line && line[2]) {
      const [, who, text] = line;
      c.font = 'bold 24px Nunito, "Segoe UI", sans-serif';
      const full = (who ? who + ': ' : '') + text;
      const w = Math.min(W - 80, c.measureText(full).width + 50);
      c.fillStyle = 'rgba(0,0,0,.72)'; Draw.rr(c, W / 2 - w / 2, H - 128, w, 52, 12); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (who) {
        const ww = c.measureText(who + ': ').width, tw = c.measureText(text).width;
        const sx = W / 2 - (ww + tw) / 2;
        c.textAlign = 'left';
        c.fillStyle = { Kevin: '#ff6b5b', Kate: '#ffb3c0', Buzz: '#8fe0a8', Harry: '#ffd84a', Marv: '#9fe870', Verteller: '#9cc9ff' }[who] || '#ffd84a';
        c.fillText(who + ':', sx, H - 101);
        c.fillStyle = '#fff'; c.fillText(text, sx + ww, H - 101);
      } else { c.fillStyle = '#fff'; c.fillText(text, W / 2, H - 101); }
    }
    c.font = '15px "Luckiest Guy", "Arial Black", sans-serif';
    c.fillStyle = 'rgba(255,255,255,.75)'; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillText('OVERSLAAN: ENTER / KLIK', W - 24, 25);
    c.textAlign = 'left';
    c.fillText(`SCÈNE ${this.scene + 1}/${SCENES.length}`, 24, 25);
  },
};
