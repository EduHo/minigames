// Níveis da Letras Soltas, gerados de forma determinística.
//  - Com tema: 300 níveis (os 20 temas em ciclo, grelhas a crescer de 3×4 a 6×6)
//  - Livre: 150 grelhas fixas (4×4, 5×5, 6×6), estrelas por percentagem das palavras escondidas
//  - Ronda bónus (60 s) e desafio diário
import { THEMES } from './themes.js';
import { plain, mulberry32, shuffle, buildThemed, buildFree } from './engine.js';
import { hashString } from '../../core/store.js';

export const THEMED_LEVELS = 300;
export const FREE_LEVELS = 150;
export const BONUS_EVERY = 5;

const SIZES = [[10, 3, 4], [40, 4, 4], [100, 4, 5], [170, 5, 5], [240, 5, 6], [Infinity, 6, 6]];
export const themedSize = n => SIZES.find(([max]) => n <= max).slice(1);

// Tamanho máximo das palavras: os primeiros níveis só têm palavras curtas.
export const maxWordLen = n => (n == null ? 6 : n <= 10 ? 4 : n <= 30 ? 5 : n <= 60 ? 6 : 8);

// Escolhe palavras do tema cujas letras enchem a grelha exatamente.
function pickWords(theme, total, rnd, maxLen = 8) {
  const pool = theme.words.map(w => ({ w, p: plain(w) })).filter(x => x.p.length <= Math.min(maxLen, total));
  for (let t = 0; t < 600; t++) {
    const bag = shuffle(pool.slice(), rnd), out = [];
    let sum = 0;
    for (const x of bag) {
      if (sum + x.p.length > total) continue;
      if (total - sum - x.p.length !== 0 && total - sum - x.p.length < 3) continue;
      out.push(x); sum += x.p.length;
      if (sum === total) return out;
    }
  }
  return null;
}

const cache = new Map();
function themedFrom(theme, W, H, seed, maxLen = 8) {
  const rnd = mulberry32(seed);
  for (let t = 0; t < 30; t++) {
    const words = pickWords(theme, W * H, rnd, maxLen);
    if (!words) continue;
    const order = words.map(x => x.p);
    const b = buildThemed(order, W, H, rnd);
    if (b) return { theme: theme.name, icon: theme.icon, W, H, cols: b.cols, paths: b.paths, order, words: words.map(x => x.w) };
  }
  return null;
}

export function themedLevel(n) {
  const key = `t${n}`;
  if (cache.has(key)) return cache.get(key);
  const [W, H] = themedSize(n);
  let lv = null;
  for (let k = 0; !lv && k < THEMES.length; k++) lv = themedFrom(THEMES[(n - 1 + k * 7) % THEMES.length], W, H, n * 7919 + k, maxWordLen(n));
  lv = { ...lv, n, kind: 'tema' };
  cache.set(key, lv);
  return lv;
}

export const freeSize = n => (n <= 40 ? [4, 4] : n <= 110 ? [5, 5] : [6, 6]);
// Estrelas: 1.ª, 2.ª e 3.ª com uma parte das palavras escondidas (com limites para não ficar impossível).
export function marksFor(total, W) {
  const cap = W <= 4 ? [12, 20, 30] : W === 5 ? [20, 35, 55] : [30, 55, 85];
  return [Math.min(cap[0], Math.ceil(total * 0.25)), Math.min(cap[1], Math.ceil(total * 0.4)), Math.min(cap[2], Math.ceil(total * 0.6))];
}
export function freeLevel(n, dict) {
  const key = `f${n}`;
  if (cache.has(key)) return cache.get(key);
  const [W, H] = freeSize(n);
  const b = buildFree(W, H, dict, mulberry32(n * 104729 + 3), 4000 + n * 60);
  const lv = { n, kind: 'livre', W, H, cols: b.cols, words: b.words, marks: marksFor(b.words.size, W) };
  cache.set(key, lv);
  return lv;
}
export function bonusLevel(seed, dict) {
  const W = 5, H = 5;
  const b = buildFree(W, H, dict, mulberry32(seed), 5000);
  return { kind: 'bonus', W, H, cols: b.cols, words: b.words, seconds: 60 };
}
export function dailyLevel(date) {
  const key = `d${date}`;
  if (cache.has(key)) return cache.get(key);
  const h = hashString('letras-daily:' + date) >>> 0;
  let lv = null;
  for (let k = 0; !lv && k < THEMES.length; k++) lv = themedFrom(THEMES[(h + k) % THEMES.length], 5, 5, h + k, maxWordLen(null));
  lv = { ...lv, n: null, date, kind: 'tema' };
  cache.set(key, lv);
  return lv;
}
