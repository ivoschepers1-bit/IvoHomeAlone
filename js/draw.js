// Tekenhulpjes in bouwsteen-stijl: stenen, noppen en minifiguren.
'use strict';

const LEGO_YELLOW = '#f6c700';

function shade(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt;
  } else {
    r *= 1 + amt; g *= 1 + amt; b *= 1 + amt;
  }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

const Draw = {
  rr(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // Een losse nop bovenop een steen (zijaanzicht)
  topStud(ctx, x, y, w, color) {
    const h = w * 0.45;
    ctx.fillStyle = shade(color, -0.12);
    ctx.fillRect(x, y - h, w, h);
    ctx.fillStyle = shade(color, 0.25);
    ctx.fillRect(x + w * 0.15, y - h, w * 0.2, h);
    ctx.fillStyle = shade(color, 0.1);
    ctx.fillRect(x - 0.5, y - h - 1.5, w + 1, 2);
  },

  brick(ctx, x, y, w, h, color, opts = {}) {
    const studW = opts.studW || 10;
    const pitch = opts.pitch || 16;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shade(color, 0.22);
    ctx.fillRect(x, y, w, Math.max(2, h * 0.12));
    ctx.fillStyle = shade(color, -0.28);
    ctx.fillRect(x, y + h - Math.max(2, h * 0.14), w, Math.max(2, h * 0.14));
    ctx.fillStyle = shade(color, -0.15);
    ctx.fillRect(x + w - 2, y, 2, h);
    if (opts.studs !== false) {
      const n = Math.max(1, Math.floor(w / pitch));
      const gap = (w - n * studW) / n;
      for (let i = 0; i < n; i++) this.topStud(ctx, x + gap / 2 + i * (studW + gap), y, studW, color);
    }
  },

  // Verzamelbare nop (van voren gezien, draait rond)
  stud(ctx, x, y, r, color, spin = 1) {
    const sx = Math.max(0.12, Math.abs(spin));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, 1);
    ctx.fillStyle = shade(color, -0.35);
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r, r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(color, -0.25);
    ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.25, r * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  heart(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 20, s / 20);
    ctx.fillStyle = shade(color, -0.35);
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -14, 0, -6);
    ctx.bezierCurveTo(8, -14, 14, -2, 0, 8); ctx.fill();
    ctx.translate(0, -1.5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -14, 0, -6);
    ctx.bezierCurveTo(8, -14, 14, -2, 0, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-4, -4, 2.5, 1.6, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  // Comic-tekst met dikke rand
  comic(ctx, text, x, y, size, fill = '#fff', stroke = '#222', align = 'center') {
    ctx.font = `${size}px "Luckiest Guy", "Arial Black", Impact, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size / 5);
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  },

  // ------------------------------------------------------------------
  // Minifiguur. (x,y) = midden tussen de voeten op de vloer.
  // f: { dir, scale, walk, legColor, hipColor, torsoColor, torsoPrint, armColor,
  //      hair, face, expr, armL, armR, rot, flat, shortLegs, alpha, tint }
  minifig(ctx, f) {
    const s = f.scale || 1;
    const dir = f.dir || 1;
    ctx.save();
    ctx.globalAlpha = f.alpha == null ? 1 : f.alpha;
    ctx.translate(f.x, f.y);
    if (f.rot) {
      // Kantel rond de voeten (of het midden bij een salto)
      const pivot = f.rotPivot || 0;
      ctx.translate(0, -pivot * s);
      ctx.rotate(f.rot);
      ctx.translate(0, pivot * s);
    }
    ctx.scale(s, s * (f.flat ? 1 - f.flat : 1));

    const legH = f.shortLegs ? 12 : 22;
    const hipTop = -legH - 6;
    const torsoTop = hipTop - 24;
    const walk = f.walk || 0;
    const legColor = f.legColor || '#2255aa';

    // Benen (zij-/driekwartaanzicht)
    const legSwing = Math.sin(walk) * 0.45;
    const drawLeg = (ox, ang, col) => {
      ctx.save();
      ctx.translate(ox, -legH);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.fillRect(-5.5, 0, 11, legH - 3);
      ctx.fillStyle = shade(col, -0.25);
      ctx.fillRect(-5.5, legH - 4, 11 + (dir > 0 ? 3 : 0) - (dir < 0 ? 3 : 0), 4);
      ctx.fillStyle = shade(col, 0.18);
      ctx.fillRect(-5.5, 0, 3, legH - 4);
      ctx.restore();
    };
    drawLeg(-6, legSwing, shade(legColor, -0.12));
    drawLeg(6, -legSwing, legColor);

    // Heupen
    const hipColor = f.hipColor || legColor;
    ctx.fillStyle = hipColor;
    ctx.fillRect(-13, hipTop, 26, 7);
    ctx.fillStyle = shade(hipColor, -0.3);
    ctx.fillRect(-1, hipTop + 3, 2, 4);

    // Achterste arm
    const armColor = f.armColor || f.torsoColor || '#c33';
    const armAngle = (a) => a == null ? Math.sin(walk + Math.PI) * 0.5 : a;
    const drawArm = (side, ang, front) => {
      ctx.save();
      ctx.translate(side * 11, torsoTop + 5);
      ctx.rotate(ang * side * -1);
      ctx.fillStyle = front ? armColor : shade(armColor, -0.2);
      this.rr(ctx, -4, -2, 8, 17, 3.5);
      ctx.fill();
      // C-hand
      ctx.fillStyle = f.handColor || LEGO_YELLOW;
      ctx.beginPath(); ctx.arc(0, 18, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(f.handColor || LEGO_YELLOW, -0.35);
      ctx.beginPath(); ctx.arc(0, 19.5, 1.8, 0, Math.PI * 2); ctx.fill();
      if (front && f.holding) f.holding(ctx);
      ctx.restore();
    };
    drawArm(-dir, armAngle(dir > 0 ? f.armL : f.armR), false);

    // Torso (trapezium)
    const tc = f.torsoColor || '#c33';
    ctx.fillStyle = tc;
    ctx.beginPath();
    ctx.moveTo(-14, hipTop); ctx.lineTo(14, hipTop);
    ctx.lineTo(10, torsoTop); ctx.lineTo(-10, torsoTop);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(tc, 0.15);
    ctx.beginPath();
    ctx.moveTo(-14, hipTop); ctx.lineTo(-10, hipTop);
    ctx.lineTo(-7, torsoTop); ctx.lineTo(-10, torsoTop);
    ctx.closePath(); ctx.fill();
    if (f.torsoPrint) {
      ctx.save(); ctx.translate(0, torsoTop); f.torsoPrint(ctx); ctx.restore();
    }

    // Nek + hoofd
    const headColor = f.headColor || LEGO_YELLOW;
    ctx.fillStyle = shade(headColor, -0.15);
    ctx.fillRect(-4, torsoTop - 3, 8, 4);
    const hy = torsoTop - 21;
    ctx.fillStyle = headColor;
    this.rr(ctx, -10, hy, 20, 19, 5); ctx.fill();
    ctx.fillStyle = shade(headColor, 0.25);
    ctx.fillRect(-8, hy + 3, 3, 12);
    // nop op het hoofd
    ctx.fillStyle = shade(headColor, -0.1);
    ctx.fillRect(-5, hy - 4, 10, 5);

    // Gezicht
    this.face(ctx, hy, dir, f.expr || 'smile', f);

    if (f.hair) { ctx.save(); ctx.translate(0, hy); f.hair(ctx, dir); ctx.restore(); }

    // Voorste arm
    drawArm(dir, armAngle(dir > 0 ? f.armR : f.armL), true);

    if (f.overlay) f.overlay(ctx, hy, torsoTop);
    ctx.restore();
  },

  face(ctx, hy, dir, expr, f) {
    const cx = dir * 2.5;
    ctx.fillStyle = '#1b1b1b';
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 1.4;
    const ey = hy + 7.5;
    if (expr === 'dizzy') {
      for (const ex of [-4, 4]) {
        ctx.beginPath();
        ctx.moveTo(cx + ex - 2, ey - 2); ctx.lineTo(cx + ex + 2, ey + 2);
        ctx.moveTo(cx + ex + 2, ey - 2); ctx.lineTo(cx + ex - 2, ey + 2);
        ctx.stroke();
      }
    } else if (expr === 'closed') {
      for (const ex of [-4, 4]) {
        ctx.beginPath(); ctx.arc(cx + ex, ey, 2, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      }
    } else {
      const big = expr === 'scream' || expr === 'ooh';
      for (const ex of [-4, 4]) {
        ctx.beginPath(); ctx.arc(cx + ex, ey, big ? 2.3 : 1.7, 0, Math.PI * 2); ctx.fill();
        if (big) {
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(cx + ex - 0.6, ey - 0.7, 0.7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1b1b1b';
        }
      }
    }
    // wenkbrauwen
    ctx.beginPath();
    if (expr === 'grr') {
      ctx.moveTo(cx - 7, ey - 5); ctx.lineTo(cx - 2, ey - 3);
      ctx.moveTo(cx + 7, ey - 5); ctx.lineTo(cx + 2, ey - 3);
    } else if (expr === 'scream' || expr === 'ooh') {
      ctx.moveTo(cx - 6, ey - 6); ctx.quadraticCurveTo(cx - 4, ey - 8, cx - 2, ey - 6);
      ctx.moveTo(cx + 6, ey - 6); ctx.quadraticCurveTo(cx + 4, ey - 8, cx + 2, ey - 6);
    } else {
      ctx.moveTo(cx - 6, ey - 4.5); ctx.lineTo(cx - 2, ey - 5);
      ctx.moveTo(cx + 6, ey - 4.5); ctx.lineTo(cx + 2, ey - 5);
    }
    ctx.stroke();
    // mond
    const my = hy + 13.5;
    if (expr === 'scream') {
      ctx.fillStyle = '#6b0f0f';
      ctx.beginPath(); ctx.ellipse(cx, my + 0.5, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e04a4a';
      ctx.beginPath(); ctx.ellipse(cx, my + 2.5, 2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    } else if (expr === 'ooh') {
      ctx.fillStyle = '#6b0f0f';
      ctx.beginPath(); ctx.ellipse(cx, my, 2, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    } else if (expr === 'grr') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 4, my - 1, 8, 3);
      ctx.strokeRect(cx - 4, my - 1, 8, 3);
      if (f && f.goldTooth) { ctx.fillStyle = '#ffd24a'; ctx.fillRect(cx + dir * 1, my - 1, 2, 3); }
    } else if (expr === 'dizzy') {
      ctx.beginPath();
      ctx.moveTo(cx - 4, my); ctx.quadraticCurveTo(cx - 2, my - 2, cx, my);
      ctx.quadraticCurveTo(cx + 2, my + 2, cx + 4, my); ctx.stroke();
    } else if (expr === 'smirk') {
      ctx.beginPath(); ctx.moveTo(cx - 3, my); ctx.quadraticCurveTo(cx + 1, my + 2.5, cx + 4, my - 1.5); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, my - 2, 4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      if (f && f.goldTooth) {
        ctx.fillStyle = '#ffd24a'; ctx.fillRect(cx + dir * 1 - 1, my + 0.2, 2, 1.8);
      }
    }
  },
};

// ---------------------------------------------------------------------
// Personages
const Looks = {
  kevin: {
    shortLegs: true,
    legColor: '#3a5fa8', hipColor: '#3a5fa8',
    torsoColor: '#c8232c', armColor: '#c8232c',
    torsoPrint(ctx) {
      // trui met rendierpatroon-streep
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(-12, 9, 24, 3);
      ctx.fillStyle = '#2d7d3a';
      for (let i = -10; i < 11; i += 5) ctx.fillRect(i, 9.5, 2, 2);
      ctx.fillStyle = '#9b1a20';
      ctx.fillRect(-6, 0, 12, 2);
    },
    hair(ctx, dir) {
      ctx.fillStyle = '#e9c46a';
      ctx.beginPath();
      ctx.moveTo(-11.5, 9);
      ctx.quadraticCurveTo(-13, -5, 0, -6.5);
      ctx.quadraticCurveTo(13, -5, 11.5, 9);
      ctx.lineTo(9, 4); ctx.lineTo(5 * dir, 2); ctx.lineTo(-2 * dir, 5); ctx.lineTo(-9, 3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7dc8f';
      ctx.fillRect(-6, -4, 7, 2);
    },
  },
  harry: {
    legColor: '#4a3b2a', hipColor: '#3a2e20',
    torsoColor: '#6b4a2b', armColor: '#6b4a2b',
    goldTooth: true,
    torsoPrint(ctx) {
      ctx.fillStyle = '#3d2a17';
      ctx.fillRect(-1, 0, 2, 24);
      ctx.fillStyle = '#8a6a44';
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-2, 8); ctx.lineTo(-1, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(2, 8); ctx.lineTo(1, 0); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(-7, 13, 3, 3); ctx.fillRect(4, 13, 3, 3);
    },
    hair(ctx) {
      // zwarte muts
      ctx.fillStyle = '#26262b';
      ctx.beginPath();
      ctx.moveTo(-11, 5); ctx.quadraticCurveTo(-12, -8, 0, -8); ctx.quadraticCurveTo(12, -8, 11, 5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(-11.5, 1, 23, 5);
    },
  },
  marv: {
    scale: 1.08,
    legColor: '#2d3d52', hipColor: '#1e2a38',
    torsoColor: '#5b6e3a', armColor: '#5b6e3a',
    torsoPrint(ctx) {
      ctx.strokeStyle = '#3c4a24'; ctx.lineWidth = 1.2;
      for (let i = -9; i <= 9; i += 6) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i * 1.3, 24); ctx.stroke(); }
      for (let j = 5; j < 24; j += 6) { ctx.beginPath(); ctx.moveTo(-12, j); ctx.lineTo(12, j); ctx.stroke(); }
      ctx.fillStyle = '#a33'; ctx.fillRect(-5, 0, 10, 3);
    },
    hair(ctx) {
      // krullen
      ctx.fillStyle = '#5a3a1e';
      for (const [cx, cy, r] of [[-9, 0, 5], [-4, -5, 5.5], [3, -6, 5.5], [9, -1, 5], [11, 5, 3.5], [-11, 6, 3.5]]) {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#7a5230';
      ctx.beginPath(); ctx.arc(-3, -7, 2, 0, Math.PI * 2); ctx.fill();
    },
  },
  marley: {
    legColor: '#333', torsoColor: '#2b2b33', armColor: '#2b2b33',
    torsoPrint(ctx) { ctx.fillStyle = '#ddd'; ctx.fillRect(-3, 0, 6, 6); },
    hair(ctx) {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(-11, 1, 4, 10); ctx.fillRect(7, 1, 4, 10);
      ctx.fillStyle = '#4a3a2a'; // pet
      ctx.fillRect(-11, -4, 22, 7);
      ctx.fillRect(-2, -1, 16, 3);
    },
    overlay(ctx, hy) {
      ctx.fillStyle = '#eee';
      ctx.beginPath(); ctx.moveTo(-8, hy + 14); ctx.lineTo(8, hy + 14); ctx.lineTo(0, hy + 24); ctx.fill();
    },
  },
  cop: {
    legColor: '#1d2a4a', torsoColor: '#24365e', armColor: '#24365e',
    torsoPrint(ctx) { ctx.fillStyle = '#f2c230'; ctx.fillRect(-9, 4, 5, 5); ctx.fillStyle = '#ccc'; ctx.fillRect(-1, 0, 2, 24); },
    hair(ctx) {
      ctx.fillStyle = '#1d2a4a';
      ctx.fillRect(-12, -6, 24, 9);
      ctx.fillStyle = '#111'; ctx.fillRect(-13, 2, 26, 3);
      ctx.fillStyle = '#f2c230'; ctx.fillRect(-2, -4, 4, 4);
    },
  },
};
