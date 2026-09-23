// Opstart, spellus, invoer en menu's.
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { Game, TRUE_KEVIN } from './game.js';
import { Intro } from './intro.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');

// ---------------------------------------------------------------------
// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.3, 700);
const world = buildWorld(scene);
const game = new Game(world, scene, camera);
const intro = new Intro(world, scene, camera);
intro.game = game;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const wrap = $('wrap'); wrap.style.width = w + 'px'; wrap.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------------
// Invoer
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyE: 'build', KeyF: 'act', KeyQ: 'scream',
  KeyP: 'pause', Escape: 'pause', KeyM: 'mute', Enter: 'enter',
};
const input = { pressed: {} };
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.code]; if (!k) return;
  if (e.target && e.target.tagName === 'INPUT') return;
  e.preventDefault();
  if (!input[k]) input.pressed[k] = true;
  input[k] = true;
});
window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) input[k] = false; });
window.addEventListener('blur', () => { for (const k of Object.values(KEYMAP)) input[k] = false; });

function setupTouch() {
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return;
  const pad = $('touch'); pad.classList.remove('hidden');
  pad.querySelectorAll('[data-k]').forEach((btn) => {
    const k = btn.dataset.k;
    const down = (ev) => { ev.preventDefault(); if (!input[k]) input.pressed[k] = true; input[k] = true; btn.classList.add('on'); Sfx.init(); };
    const up = (ev) => { ev.preventDefault(); input[k] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
  });
  // joystick
  const stick = $('stick'), knob = stick.querySelector('i');
  let id = null, cx = 0, cy = 0;
  stick.addEventListener('pointerdown', (e) => { id = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; stick.setPointerCapture(id); move(e); });
  const move = (e) => {
    if (e.pointerId !== id) return;
    let dx = (e.clientX - cx) / 50, dy = (e.clientY - cy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    input.stick = { x: dx, y: dy }; knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
  };
  stick.addEventListener('pointermove', move);
  const end = (e) => { if (e.pointerId !== id) return; id = null; input.stick = null; knob.style.transform = ''; };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
}

// ---------------------------------------------------------------------
// Schermen
let phase = 'menu';
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.add('hidden');
  if (id) $(id).classList.remove('hidden');
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 6000);
}
Music.toast = toast;

function toMenu() {
  phase = 'menu'; game.clear(); showScreen('menu'); $('hud').classList.add('hidden');
  world.setNight(true, true);
  for (const g of Object.values(world.groups)) g.set(1, true);
  Music.play('menu', true);
}

function startIntro() {
  Sfx.init();
  game.clear();
  phase = 'cutscene'; showScreen(null); $('hud').classList.add('hidden');
  Music.play('menu');
  intro.start(() => { phase = 'mission'; showScreen('intro'); });
}

function startGame() {
  showScreen(null);
  game.reset();
  game.onWin = showWin;
  phase = 'play';
  $('hud').classList.remove('hidden');
  game.banner('19:30 UUR', 'Bouw vallen door het hele huis!', 2.8, 'yellow');
  Music.play('prep');
}

function showWin() {
  const s = game.stats;
  const golds = [
    ['Het huis verdedigd', true],
    [`Echte Kevin (${TRUE_KEVIN.toLocaleString('nl-NL')} noppen)`, game.studs >= TRUE_KEVIN],
    ['Nooit gepakt', game.catches === 0],
    ['Alle 12 vallen gebouwd vóór 21:00', s.builtInPrep >= 12],
  ];
  const t = game.attackTime;
  $('winStats').innerHTML = `
    <div class="stat"><span>Noppen</span><b>${game.studs.toLocaleString('nl-NL')}</b></div>
    <div class="stat"><span>Tijd tegen de bandieten</span><b>${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}</b></div>
    <div class="stat"><span>Keer gepakt</span><b>${game.catches}</b></div>
    <div class="stat"><span>Vallen gebouwd</span><b>${s.traps}</b></div>
    <div class="stat"><span>Spullen gesloopt</span><b>${s.smashed}</b></div>
    <h3>Gouden stenen: ${golds.filter(g => g[1]).length}/4</h3>
    <ul class="golds">${golds.map(([n, ok]) => `<li class="${ok ? 'ok' : ''}"><i></i>${n}</li>`).join('')}</ul>`;
  phase = 'won'; showScreen('win'); Sfx.fanfare();
}

function togglePause() {
  if (phase === 'play') { phase = 'paused'; showScreen('pause'); YTMusic.pause(); Synth.stop(); }
  else if (phase === 'paused') { phase = 'play'; showScreen(null); Music.resume(); }
}
function toggleMute() { const m = !Sfx.muted; Sfx.setMuted(m); YTMusic.setMuted(m); toast(m ? 'Geluid uit (M)' : 'Geluid aan (M)'); }

function setupUI() {
  $('btnPlay').onclick = startIntro;
  $('btnStart').onclick = startGame;
  $('btnHelp').onclick = () => showScreen('help');
  $('btnSettings').onclick = () => showScreen('settings');
  for (const b of document.querySelectorAll('[data-back]')) b.onclick = () => showScreen(phase === 'paused' ? 'pause' : 'menu');
  $('btnResume').onclick = togglePause;
  $('btnQuit').onclick = toMenu;
  $('btnPauseSettings').onclick = () => showScreen('settings');
  $('btnAgain').onclick = startIntro;
  $('btnMenu').onclick = toMenu;
  $('btnSkipIntro').onclick = () => intro.skip();
  canvas.addEventListener('pointerdown', () => { if (phase === 'cutscene') intro.skip(); });

  const saved = (() => { try { return JSON.parse(localStorage.getItem('ha-music') || 'null'); } catch (e) { return null; } })();
  if (saved) { Music.mode = saved.mode || 'youtube'; Object.assign(Music.tracks, saved.tracks || {}); }
  const save = () => { try { localStorage.setItem('ha-music', JSON.stringify({ mode: Music.mode, tracks: Music.tracks })); } catch (e) { /* privévenster */ } };
  for (const r of document.querySelectorAll('input[name=music]')) {
    r.checked = r.value === Music.mode;
    r.onchange = () => { Sfx.init(); Music.setMode(r.value); save(); };
  }
  for (const key of ['menu', 'prep', 'attack']) {
    const inp = $('yt-' + key); inp.value = Music.tracks[key];
    inp.onchange = () => { Music.tracks[key] = inp.value; if (key === 'menu') Music.tracks.win = inp.value; save(); if (Music.current === key) Music.play(key, true); };
  }
  $('btnResetTracks').onclick = () => { Object.assign(Music.tracks, DEFAULT_TRACKS); for (const key of ['menu', 'prep', 'attack']) $('yt-' + key).value = Music.tracks[key]; save(); };
  $('radioToggle').onclick = () => $('radio').classList.toggle('mini');

  const first = () => { Sfx.init(); if (phase === 'menu' && !Music.current) Music.play('menu'); window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first); };
  window.addEventListener('pointerdown', first); window.addEventListener('keydown', first);
}

// ---------------------------------------------------------------------
// Lus
const clock = new THREE.Clock();
let t = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  t += dt;

  if (input.pressed.mute) toggleMute();
  if (phase === 'cutscene' && (input.pressed.enter || input.pressed.pause)) { intro.skip(); input.pressed = {}; }
  else if (phase === 'menu' && input.pressed.enter) { startIntro(); input.pressed = {}; }
  else if (phase === 'mission' && input.pressed.enter) { startGame(); input.pressed = {}; }
  if (input.pressed.pause && (phase === 'play' || phase === 'paused')) togglePause();

  if (phase === 'cutscene') intro.update(dt);
  else if (phase === 'play') game.update(dt, input);
  else if (phase === 'menu' || phase === 'mission' || phase === 'won') {
    // langzaam rondcirkelen voor het huis
    const a = Math.sin(t * 0.12) * 0.55;
    camera.position.set(Math.sin(a) * 70, 20 + Math.sin(t * 0.2) * 4, 20 + Math.cos(a) * 60);
    camera.lookAt(0, 12, 12);
    world.sun.position.set(-40, 80, 50); world.sun.target.position.set(0, 0, 0);
    if (phase === 'won') game.updateFx(dt);
  }

  world.update(dt, t, camera.position);
  renderer.render(scene, camera);
  input.pressed = {};
  requestAnimationFrame(frame);
}

setupUI();
setupTouch();
showScreen('menu');
window.__ha = { game, intro, world, camera, get phase() { return phase; }, set phase(v) { phase = v; }, startGame, startIntro };
requestAnimationFrame(frame);
