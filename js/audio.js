// Geluid: effecten, ingebouwde kerstmuziek en de YouTube-soundtrack.
'use strict';

const Sfx = {
  ctx: null, master: null, sfxGain: null, musicGain: null, muted: false,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.55; this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.32; this.musicGain.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  },

  tone(freq, dur, type = 'square', vol = 0.3, slideTo = null, delay = 0, dest = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  },

  noise(dur, vol = 0.3, filterFreq = 2000, type = 'lowpass', delay = 0, sweepTo = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(filterFreq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + dur + 0.05);
  },

  // Stemgeluid via formantfilter ("AAAH", "AU!")
  voice(f0, f1, dur, vowel = 'a', vol = 0.25, vibrato = 6) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const lfo = this.ctx.createOscillator(); const lg = this.ctx.createGain();
    lfo.frequency.value = vibrato; lg.gain.value = f0 * 0.04;
    lfo.connect(lg); lg.connect(o.frequency);
    const formants = { a: [800, 1150], o: [450, 800], e: [400, 2000], u: [350, 600] }[vowel] || [800, 1150];
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const ff of formants) {
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = 6;
      o.connect(bp); bp.connect(g);
    }
    g.connect(this.sfxGain);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  },

  // --- Specifieke effecten ------------------------------------------
  stud(value) {
    const base = value >= 1000 ? 1760 : value >= 100 ? 1480 : 1320;
    this.tone(base, 0.09, 'triangle', 0.22);
    this.tone(base * 1.5, 0.12, 'sine', 0.16, null, 0.045);
    if (value >= 1000) this.tone(base * 2, 0.2, 'sine', 0.14, null, 0.1);
  },
  click() { this.tone(900 + Math.random() * 400, 0.04, 'square', 0.12); this.noise(0.03, 0.12, 5000, 'highpass'); },
  buildDone() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.22, null, i * 0.07));
    this.noise(0.08, 0.15, 6000, 'highpass', 0.28);
  },
  smash() {
    this.noise(0.25, 0.4, 3000, 'bandpass');
    for (let i = 0; i < 6; i++) this.tone(1200 + Math.random() * 1800, 0.05, 'square', 0.08, null, i * 0.03);
  },
  breakApart() {
    this.noise(0.35, 0.45, 1800, 'lowpass', 0, 300);
    for (let i = 0; i < 8; i++) this.tone(700 + Math.random() * 2000, 0.05, 'square', 0.07, null, 0.05 + i * 0.035);
  },
  reform() { for (let i = 0; i < 6; i++) this.tone(600 + i * 150, 0.05, 'square', 0.08, null, i * 0.05); },
  jump() { this.tone(330, 0.14, 'square', 0.12, 660); },
  slip() { this.tone(1400, 0.35, 'sine', 0.2, 180); this.noise(0.15, 0.2, 800, 'lowpass', 0.3); this.bonk(0.35); },
  bonk(delay = 0) { this.tone(160, 0.2, 'sine', 0.45, 60, delay); this.noise(0.08, 0.3, 900, 'lowpass', delay); },
  clang() { this.tone(520, 0.5, 'square', 0.18, 505); this.tone(1310, 0.4, 'sine', 0.15); this.bonk(); },
  sizzle() { this.noise(0.9, 0.25, 4000, 'highpass', 0, 8000); },
  whoosh() { this.noise(0.6, 0.3, 300, 'bandpass', 0, 3000); },
  boing() { this.tone(180, 0.45, 'sine', 0.3, 720); this.tone(90, 0.3, 'triangle', 0.2, 400, 0.05); },
  chicken() { [0, 0.2, 0.34].forEach(d => this.tone(700, 0.1, 'sawtooth', 0.12, 1100, d)); },
  shoot() { this.noise(0.08, 0.35, 2500, 'highpass'); this.tone(900, 0.05, 'square', 0.1, 300); },
  gun() { for (let i = 0; i < 10; i++) this.noise(0.05, 0.35, 1800, 'bandpass', i * 0.07); },
  kevinScream() { this.voice(620, 560, 1.4, 'a', 0.3, 7); this.tone(1900, 0.8, 'sine', 0.05, 2100); },
  hurt(high) { this.voice(high ? 420 : 260, high ? 260 : 160, 0.45, 'u', 0.28, 9); },
  marvScream() { this.voice(700, 900, 1.3, 'a', 0.3, 11); },
  laugh() { [0, 180, 360].forEach(d => setTimeout(() => this.voice(210, 170, 0.14, 'a', 0.22, 4), d)); },
  caught() { this.tone(400, 0.2, 'square', 0.2, 200); this.tone(300, 0.3, 'square', 0.2, 120, 0.2); },
  doorbell() { this.tone(660, 0.5, 'sine', 0.25); this.tone(523, 0.7, 'sine', 0.25, null, 0.45); },
  siren() {
    for (let i = 0; i < 4; i++) { this.tone(700, 0.35, 'sawtooth', 0.08, 950, i * 0.7); this.tone(950, 0.35, 'sawtooth', 0.08, 700, i * 0.7 + 0.35); }
  },
  clock() { this.tone(1200, 0.05, 'square', 0.1); },
  fanfare() {
    const n = [523, 659, 784, 1047, 784, 1047, 1319];
    n.forEach((f, i) => { this.tone(f, 0.25, 'square', 0.12, null, i * 0.13); this.tone(f / 2, 0.25, 'triangle', 0.15, null, i * 0.13); });
  },
};

// ---------------------------------------------------------------------
// Ingebouwde muziek: eigen arrangementen van rechtenvrije kerstliedjes
// (Carol of the Bells – Leontovych 1914, en Jingle Bells – Pierpont 1857).
const NOTE = {};
(() => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let o = 1; o < 8; o++) names.forEach((n, i) => { NOTE[n + o] = 440 * Math.pow(2, (o * 12 + i - 57) / 12); });
  Object.assign(NOTE, { Bb4: NOTE['A#4'], Bb3: NOTE['A#3'], Bb2: NOTE['A#2'], Bb5: NOTE['A#5'], Eb5: NOTE['D#5'], Eb3: NOTE['D#3'], Eb4: NOTE['D#4'], Eb2: NOTE['D#2'], Bb1: NOTE['A#1'] });
})();

function seq(str) {
  // "Bb4:1 A4:.5 -:1" → [[freq|null, beats], ...]
  return str.trim().split(/\s+/).map(tok => {
    const [n, b] = tok.split(':');
    return [n === '-' ? null : NOTE[n], parseFloat(b)];
  });
}

const Songs = {
  carol: (() => {
    const osti = 'Bb4:1 A4:.5 Bb4:.5 G4:1 ';
    const oh = 'D5:1 C5:.5 D5:.5 Bb4:1 ';
    const eh = 'Eb5:1 D5:.5 Eb5:.5 C5:1 ';
    const hi = 'G5:1 F5:.5 G5:.5 Eb5:1 ';
    const melody =
      osti.repeat(4) + oh.repeat(4) + eh.repeat(2) + oh.repeat(2) + hi.repeat(2) + oh.repeat(2) +
      'G5:.5 F5:.5 Eb5:.5 D5:.5 C5:.5 Bb4:.5 C5:.5 D5:.5 C5:.5 Bb4:.5 A4:.5 G4:.5 ' +
      'D5:.5 E5:.5 F#5:.5 G5:.5 A5:.5 Bb5:.5 C5:.5 D5:.5 C5:.5 Bb4:.5 A4:.5 G4:.5 ' +
      osti.repeat(4);
    let bass = '';
    const bassNotes = ['G2', 'G2', 'F2', 'F2', 'Eb2', 'Eb2', 'D2', 'D2'];
    for (let i = 0; i < 26; i++) bass += bassNotes[i % 8] + ':3 ';
    return { bpm: 172, melody: seq(melody), bass: seq(bass), lead: 'triangle', bell: true, hat: false };
  })(),
  jingle: (() => {
    const melody =
      'E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:.5 E5:4 ' +
      'F5:1 F5:1 F5:1.5 F5:.5 F5:1 E5:1 E5:1 E5:.5 E5:.5 E5:1 D5:1 D5:1 E5:1 D5:2 G5:2 ' +
      'E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:.5 E5:4 ' +
      'F5:1 F5:1 F5:1.5 F5:.5 F5:1 E5:1 E5:1 E5:.5 E5:.5 G5:1 G5:1 F5:1 D5:1 C5:4 ' +
      'G4:1 E5:1 D5:1 C5:1 G4:3 G4:.5 G4:.5 G4:1 E5:1 D5:1 C5:1 A4:4 ' +
      'A4:1 F5:1 E5:1 D5:1 B4:4 G5:1 G5:1 F5:1 D5:1 E5:4 ';
    const b = 'C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 ' +
      'F2:1 C3:1 F2:1 C3:1 C3:1 G2:1 C3:1 G2:1 D3:1 A2:1 G2:1 D3:1 G2:1 D3:1 G2:1 B2:1 ';
    const bass = b + b.replace('D3:1 A2:1 G2:1 D3:1 G2:1 D3:1 G2:1 B2:1', 'G2:1 D3:1 G2:1 B2:1 C3:1 G2:1 C3:1 G2:1') +
      'C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 C3:1 G2:1 F2:1 C3:1 F2:1 C3:1 ' +
      'F2:1 C3:1 F2:1 C3:1 G2:1 D3:1 G2:1 D3:1 G2:1 D3:1 G2:1 D3:1 C3:1 G2:1 C3:1 G2:1 ';
    return { bpm: 150, melody: seq(melody), bass: seq(bass), lead: 'square', bell: false, hat: true };
  })(),
  holy: (() => {
    // rustig "O Holy Night"-achtig slaapliedje voor het menu
    const melody = 'E4:3 E4:1 E4:.5 G4:1.5 G4:2 A4:1 E4:1 A4:1 C5:4 ' +
      'G4:2 E4:1 D4:1.5 C4:.5 E4:1 G4:2 F4:1 D4:2 C4:4 -:2 ' +
      'E4:3 E4:1 E4:.5 G4:1.5 G4:2 A4:1 E4:1 A4:1 C5:4 ' +
      'B4:2 F#4:1 A4:1.5 G4:.5 F#4:1 B4:2 G4:1 C5:6 -:2 ';
    const bass = 'C3:6 C3:6 F2:6 C3:6 G2:6 C3:6 G2:6 C3:6 C3:6 C3:6 F2:6 C3:6 G2:6 E2:6 A2:6 C3:6 ';
    return { bpm: 96, melody: seq(melody), bass: seq(bass), lead: 'sine', bell: true, hat: false };
  })(),
};

const Synth = {
  song: null, timer: null, nextTime: 0, mi: 0, bi: 0, mTime: 0, bTime: 0, beatDur: 0.5, hatTime: 0,

  play(name) {
    this.stop();
    if (!Sfx.ctx) return;
    this.song = Songs[name];
    if (!this.song) return;
    this.beatDur = 60 / this.song.bpm;
    const t = Sfx.ctx.currentTime + 0.1;
    this.mi = 0; this.bi = 0; this.mTime = t; this.bTime = t; this.hatTime = t;
    this.timer = setInterval(() => this.tick(), 60);
    this.tick();
  },

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.song = null;
  },

  note(freq, t, dur, type, vol, bell) {
    const ctx = Sfx.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.98);
    o.connect(g); g.connect(Sfx.musicGain);
    o.start(t); o.stop(t + dur);
    if (bell) {
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.value = freq * 2.01;
      g2.gain.setValueAtTime(vol * 0.5, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(1.2, dur * 2));
      o2.connect(g2); g2.connect(Sfx.musicGain);
      o2.start(t); o2.stop(t + Math.min(1.25, dur * 2 + 0.05));
    }
  },

  tick() {
    const s = this.song; if (!s || !Sfx.ctx) return;
    const horizon = Sfx.ctx.currentTime + 0.3;
    while (this.mTime < horizon) {
      const [f, b] = s.melody[this.mi];
      const d = b * this.beatDur;
      if (f) this.note(f, this.mTime, d * 0.95, s.lead, 0.16, s.bell);
      this.mTime += d;
      this.mi = (this.mi + 1) % s.melody.length;
      if (this.mi === 0) { this.bi = 0; this.bTime = this.mTime; this.hatTime = this.mTime; }
    }
    while (this.bTime < horizon) {
      const [f, b] = s.bass[this.bi];
      const d = b * this.beatDur;
      if (f) this.note(f, this.bTime, d * 0.9, 'triangle', 0.22, false);
      this.bTime += d;
      this.bi = (this.bi + 1) % s.bass.length;
    }
    if (s.hat) {
      while (this.hatTime < horizon) {
        const t = this.hatTime;
        const src = Sfx.ctx.createBufferSource(); src.buffer = Sfx.noiseBuf;
        const hp = Sfx.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
        const g = Sfx.ctx.createGain();
        g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        src.connect(hp); hp.connect(g); g.connect(Sfx.musicGain);
        src.start(t); src.stop(t + 0.08);
        this.hatTime += this.beatDur / 2;
      }
    }
  },
};

// ---------------------------------------------------------------------
// YouTube-soundtrack via de officiële IFrame Player API (streamen, niet downloaden).
const DEFAULT_TRACKS = {
  menu: 'https://www.youtube.com/watch?v=b27DylO-ucw',   // Main Title "Somewhere in My Memory"
  prep: 'https://www.youtube.com/watch?v=b27DylO-ucw',
  attack: 'https://www.youtube.com/watch?v=B-AIwcXfgDk', // The Attack on the House
  win: 'https://www.youtube.com/watch?v=b27DylO-ucw',
};

function ytId(url) {
  if (!url) return null;
  url = url.trim();
  if (/^[\w-]{11}$/.test(url)) return url;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const YTMusic = {
  state: 'idle', // idle | loading | ready | failed
  player: null, wantId: null, currentId: null, onFail: null, playing: false, watchdog: null,

  load(onFail) {
    this.onFail = onFail;
    if (this.state !== 'idle') return;
    if (location.protocol === 'file:') { this.fail('YouTube werkt niet vanaf een lokaal bestand (file://). Start een webserver of gebruik GitHub Pages.'); return; }
    this.state = 'loading';
    window.onYouTubeIframeAPIReady = () => this.create();
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => this.fail('YouTube kon niet geladen worden (offline?).');
    document.head.appendChild(s);
    setTimeout(() => { if (this.state === 'loading') this.fail('YouTube reageert niet.'); }, 9000);
  },

  create() {
    document.getElementById('radio').classList.remove('hidden');
    this.player = new YT.Player('ytPlayer', {
      width: '220', height: '124',
      playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin },
      events: {
        onReady: () => {
          this.state = 'ready';
          this.player.setVolume(70);
          if (this.wantId) this.play(this.wantId, true);
        },
        onError: (e) => this.fail(`Deze YouTube-video mag niet ingesloten worden (code ${e.data}).`),
        onStateChange: (e) => {
          if (e.data === 1) { this.playing = true; Synth.stop(); }
          if (e.data === 0) { this.player.seekTo(0); this.player.playVideo(); }
        },
      },
    });
  },

  play(id, force) {
    this.wantId = id;
    if (this.state !== 'ready') return;
    if (!force && id === this.currentId) { this.player.playVideo(); return; }
    this.currentId = id;
    this.playing = false;
    this.player.loadVideoById(id);
    clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      if (!this.playing && this.onFail) this.onFail('autoplay', 'Autoplay geblokkeerd: klik op ▶ in de radio rechtsonder. Tot dan speelt de ingebouwde muziek.');
    }, 4000);
  },

  pause() { if (this.state === 'ready') this.player.pauseVideo(); },
  stop() { this.wantId = null; clearTimeout(this.watchdog); if (this.state === 'ready') this.player.stopVideo(); },
  setMuted(m) { if (this.state === 'ready') (m ? this.player.mute() : this.player.unMute()); },

  fail(msg) {
    this.state = 'failed';
    const r = document.getElementById('radio'); if (r) r.classList.add('hidden');
    if (this.onFail) this.onFail('fatal', msg);
  },
};

// Kiest tussen YouTube, ingebouwd of uit.
const Music = {
  mode: 'youtube', // youtube | synth | off
  tracks: { ...DEFAULT_TRACKS },
  current: null,
  synthFor: { menu: 'holy', prep: 'jingle', attack: 'carol', win: 'jingle' },
  toast: null,

  setMode(mode) {
    this.mode = mode;
    Synth.stop(); YTMusic.stop();
    if (this.current) this.play(this.current, true);
  },

  resume() {
    if (!this.current) return;
    if (this.mode === 'youtube' && YTMusic.state === 'ready' && YTMusic.playing) YTMusic.player.playVideo();
    else this.play(this.current, true);
  },

  play(scene, force) {
    if (!force && scene === this.current) return;
    this.current = scene;
    if (this.mode === 'off') { Synth.stop(); YTMusic.stop(); return; }
    if (this.mode === 'youtube' && YTMusic.state !== 'failed') {
      const id = ytId(this.tracks[scene]);
      if (id) {
        YTMusic.load((kind, msg) => {
          if (this.toast) this.toast(msg);
          if (kind === 'fatal' || !YTMusic.playing) {
            if (this.mode === 'youtube' && this.current) Synth.play(this.synthFor[this.current]);
          }
        });
        Synth.stop();
        YTMusic.play(id);
        return;
      }
    }
    YTMusic.stop();
    Synth.play(this.synthFor[scene]);
  },
};
