// Sons e música sintetizados com Web Audio (sem ficheiros de áudio).
import { settings, onSettingsChange } from './settings.js';

let ctx = null;
let master = null;
let musicGain = null;
let musicTimer = null;
let echo = null;

// Escala pentatónica: soa sempre bem, combina com o tema oriental.
const PENTA = [0, 2, 4, 7, 9];
const freq = (semis, base = 220) => base * 2 ** (semis / 12);

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);

  // Eco suave para a música
  echo = ctx.createDelay(1);
  echo.delayTime.value = 0.38;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  echo.connect(fb).connect(echo);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.16;
  musicGain.connect(master);
  echo.connect(musicGain);
  return ctx;
}

function tone({ f, type = 'sine', dur = 0.15, vol = 0.3, at = 0, slide = 0, out }) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out || master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ dur = 0.08, vol = 0.2, at = 0, filter = 2000 }) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = filter;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

const SFX = {
  // Toque de peça: "clac" de marfim
  tap: () => { noise({ dur: 0.05, vol: 0.5, filter: 3200 }); tone({ f: 1400, dur: 0.05, vol: 0.12, type: 'triangle' }); },
  match: (combo = 1) => {
    const step = Math.min(combo - 1, 8);
    const n1 = PENTA[step % 5] + 12 * Math.floor(step / 5);
    tone({ f: freq(n1, 523), dur: 0.25, vol: 0.22, type: 'triangle' });
    tone({ f: freq(n1 + 7, 523), dur: 0.35, vol: 0.16, at: 0.07 });
  },
  blocked: () => tone({ f: 180, dur: 0.12, vol: 0.25, type: 'square', slide: 0.6 }),
  shuffle: () => { for (let i = 0; i < 6; i++) noise({ dur: 0.04, vol: 0.3, at: i * 0.05, filter: 2500 + i * 300 }); },
  hint: () => { tone({ f: 880, dur: 0.12, vol: 0.15 }); tone({ f: 1320, dur: 0.2, vol: 0.12, at: 0.1 }); },
  coin: () => { tone({ f: 1568, dur: 0.08, vol: 0.15, type: 'square' }); tone({ f: 2093, dur: 0.25, vol: 0.12, type: 'square', at: 0.07 }); },
  win: () => [0, 2, 4, 7, 9, 12].forEach((s, i) => tone({ f: freq(s, 523), dur: 0.4, vol: 0.2, type: 'triangle', at: i * 0.09 })),
  lose: () => [7, 4, 0].forEach((s, i) => tone({ f: freq(s, 262), dur: 0.35, vol: 0.2, type: 'triangle', at: i * 0.15 })),
  unlock: () => { tone({ f: 660, dur: 0.1, vol: 0.2, type: 'square' }); tone({ f: 990, dur: 0.18, vol: 0.18, type: 'square', at: 0.08 }); },
  tick: () => tone({ f: 1000, dur: 0.04, vol: 0.1, type: 'square' }),
  boom: () => { noise({ dur: 0.6, vol: 0.9, filter: 300 }); tone({ f: 90, dur: 0.5, vol: 0.4, slide: 0.4 }); },
  // Poções
  pick: () => { tone({ f: 2200, dur: 0.12, vol: 0.08 }); tone({ f: 3300, dur: 0.1, vol: 0.05, at: 0.02 }); },
  pour: (n = 2) => { for (let i = 0; i < n * 3; i++) tone({ f: 220 + Math.random() * 260, dur: 0.09, vol: 0.12, at: i * 0.07, slide: 1.8 }); },
  cork: () => { noise({ dur: 0.06, vol: 0.6, filter: 900 }); tone({ f: 520, dur: 0.12, vol: 0.18, type: 'triangle', at: 0.02, slide: 1.6 }); [0, 4, 7].forEach((s, i) => tone({ f: freq(s, 660), dur: 0.35, vol: 0.09, type: 'triangle', at: 0.08 + i * 0.05 })); },
  reveal: () => { tone({ f: 1320, dur: 0.18, vol: 0.06, slide: 1.5 }); noise({ dur: 0.2, vol: 0.15, filter: 4000 }); },
  star: (i = 0) => { tone({ f: freq([0, 4, 7][i % 3], 880), dur: 0.3, vol: 0.13, type: 'triangle' }); tone({ f: freq([0, 4, 7][i % 3], 1760), dur: 0.2, vol: 0.05 }); },
  hop: () => tone({ f: 330, dur: 0.16, vol: 0.1, slide: 2 }),
  gate: () => { noise({ dur: 0.3, vol: 0.3, filter: 600 }); [0, 4, 7, 11, 14].forEach((s, i) => tone({ f: freq(s, 392), dur: 0.6, vol: 0.1, type: 'triangle', at: 0.1 + i * 0.08 })); },
  denied: () => { tone({ f: 220, dur: 0.2, vol: 0.15, type: 'square', slide: 0.8 }); tone({ f: 196, dur: 0.25, vol: 0.15, type: 'square', at: 0.15, slide: 0.8 }); },
  thaw: () => { noise({ dur: 0.25, vol: 0.25, filter: 5000 }); tone({ f: 1800, dur: 0.2, vol: 0.05, slide: 0.6 }); },
  // Colmeia: nota de cada passo do caminho, a subir na escala
  step: (k = 0) => tone({ f: freq([0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21][Math.min(k, 12)], 440), dur: 0.1, vol: 0.09, type: 'triangle' }),
  // Azulejos
  trio: (k = 0) => [0, 4, 7, 12].forEach((st, i) => { tone({ f: freq(st + Math.min(k, 6) * 2, 1046), dur: 0.35, vol: 0.09, type: 'triangle', at: i * 0.05 }); }),
  greyed: () => { tone({ f: 300, dur: 0.4, vol: 0.1, type: 'sawtooth', slide: 0.5 }); tone({ f: 220, dur: 0.5, vol: 0.06, at: 0.1, slide: 0.6 }); },
  guitarra: () => [0, 3, 7, 12, 10, 7, 3, 5, 8, 12, 15, 12].forEach((st, i) => { tone({ f: freq(st, 330), dur: 0.6, vol: 0.07, type: 'triangle', at: i * 0.16 }); tone({ f: freq(st, 330) * 1.004, dur: 0.6, vol: 0.04, type: 'sawtooth', at: i * 0.16 }); }),
  slide: () => tone({ f: 900, dur: 0.12, vol: 0.06, slide: 1.6 }),
  chirp: () => [0, 0.12, 0.2].forEach((t, i) => tone({ f: 2800 + i * 300, dur: 0.07, vol: 0.06, at: t, slide: 1.3 })),
  chains: () => { for (let i = 0; i < 4; i++) noise({ dur: 0.05, vol: 0.4, filter: 3000 - i * 400, at: i * 0.06 }); tone({ f: 700, dur: 0.3, vol: 0.12, type: 'triangle', slide: 1.5, at: 0.2 }); },
};

export function sfx(name, ...args) {
  if (!settings().sound) return;
  try { SFX[name]?.(...args); } catch { /* áudio indisponível */ }
}

// Música generativa: notas soltas da escala pentatónica sobre um bordão.
function musicStep() {
  const c = ensure();
  if (!c) return;
  const base = 196;
  const oct = Math.random() < 0.3 ? 12 : 0;
  const note = PENTA[Math.floor(Math.random() * 5)] + oct;
  tone({ f: freq(note, base), dur: 1.6, vol: 0.5, type: 'sine', out: echo });
  if (Math.random() < 0.25) tone({ f: freq(note + 7, base), dur: 1.8, vol: 0.25, type: 'triangle', out: echo, at: 0.25 });
  if (Math.random() < 0.15) tone({ f: freq(0, base / 2), dur: 3, vol: 0.35, type: 'sine', out: musicGain });
  musicTimer = setTimeout(musicStep, 700 + Math.random() * 900);
}

export function startMusic() {
  if (!settings().music || musicTimer || document.hidden) return;
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  musicStep();
}

export function stopMusic() {
  clearTimeout(musicTimer);
  musicTimer = null;
}

// O browser só deixa tocar som depois de um toque do jogador.
export function unlockAudioOnFirstTouch() {
  const go = () => {
    const c = ensure();
    if (c?.state === 'suspended') c.resume();
    startMusic();
    window.removeEventListener('pointerdown', go);
  };
  window.addEventListener('pointerdown', go);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopMusic(); ctx?.suspend(); } else { ctx?.resume(); startMusic(); }
  });
  onSettingsChange((s, name) => {
    if (name === 'music') s.music ? startMusic() : stopMusic();
  });
}
