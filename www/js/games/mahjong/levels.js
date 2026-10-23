// Níveis gerados de forma determinística: o nível N tem sempre a mesma forma.
// - A cada 20 níveis entra um nível especial desenhado à mão (layouts.js).
// - Dificuldade em dente de serra: os níveis terminados em 9 são difíceis,
//   os terminados em 1 dão alívio.
// - Cadeados a partir do nível 26, bombas a partir do 52.
import { LAYOUTS, TUTORIAL, parseLayout } from './layouts.js';
import { isSolvable } from './engine.js';
import { hashString } from '../../core/store.js';

export const LEVELS_PER_CHAPTER = 20;
export const TOTAL_LEVELS = 1000;

const CHAPTER_THEMES = [
  { name: 'Jardim de Bambu', color: '#14532d' },
  { name: 'Lago de Jade', color: '#115e59' },
  { name: 'Templo Vermelho', color: '#7f1d1d' },
  { name: 'Montanha Nevada', color: '#1e3a5f' },
  { name: 'Palácio Dourado', color: '#713f12' },
  { name: 'Cerejeiras', color: '#701a45' },
  { name: 'Rio do Dragão', color: '#1e3a8a' },
  { name: 'Estrada da Seda', color: '#7c2d12' },
  { name: 'Cidade Proibida', color: '#581c1c' },
  { name: 'Céu Estrelado', color: '#312e81' },
];
const ROMAN = ['', '', ' II', ' III', ' IV', ' V'];

export function chapterOf(n) {
  const i = Math.floor((n - 1) / LEVELS_PER_CHAPTER);
  const theme = CHAPTER_THEMES[i % CHAPTER_THEMES.length];
  return { index: i, name: theme.name + ROMAN[Math.floor(i / CHAPTER_THEMES.length) + 1], color: theme.color };
}

export function levelConfig(n) {
  const special = n % LEVELS_PER_CHAPTER === 0;
  const hard = !special && n % 10 === 9;
  const easy = n % 10 === 1 && n > 1;
  const locks = !special && n >= 25 && (n % 2 === 0 || hard) ? Math.min(4, 1 + Math.floor((n - 25) / 60)) : 0;
  const bombs = !special && n >= 52 && (n % 5 === 2 || hard) ? Math.min(2, 1 + Math.floor((n - 52) / 200)) : 0;
  return { special, hard, easy, locks, bombs };
}

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Forma simétrica (espelho esquerda/direita) com várias camadas.
// d: dificuldade de 0 (fácil) a ~1.3 (muito difícil).
function shape(d, rnd) {
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const dc = Math.min(1, d);
  const W = ri(4 + Math.round(dc * 2), Math.min(7, 5 + Math.round(dc * 2)));
  const H = ri(5 + Math.round(dc * 2), Math.min(8, 6 + Math.round(dc * 2)));
  const hw = Math.ceil(W / 2);
  const axis = W - 1; // eixo de simetria em meias-unidades

  const grid = Array.from({ length: H }, () => Array(W).fill(false));
  const put = (c, r, v) => { grid[r][c] = grid[r][W - 1 - c] = v; };
  const rects = ri(2, 4);
  for (let i = 0; i < rects; i++) {
    const w = ri(1, hw), h = ri(2, H);
    const c0 = i === 0 ? hw - w : ri(0, hw - w);
    const r0 = ri(0, H - h);
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) put(c, r, true);
  }
  if (rnd() < 0.25 + dc * 0.3) put(ri(0, hw - 1), ri(1, H - 2), false);

  let below = [];
  grid.forEach((row, r) => row.forEach((on, c) => { if (on) below.push({ x: c * 2, y: r * 2, z: 0 }); }));
  if (below.length < 12) return null;

  const all = [...below];
  const maxTiles = Math.min(144, Math.round(36 + d * 100));
  const layers = 1 + Math.round(Math.min(d, 1.25) * 3) + ri(0, 1);
  for (let z = 1; z <= layers && all.length < maxTiles; z++) {
    const has = new Set(below.map(p => p.x + ',' + p.y));
    const at = (x, y) => has.has(x + ',' + y);
    const half = rnd() < 0.4;
    const cand = [];
    for (const p of below) {
      if (half) {
        if (at(p.x + 2, p.y) && at(p.x, p.y + 2) && at(p.x + 2, p.y + 2)) cand.push({ x: p.x + 1, y: p.y + 1, z });
      } else {
        const nb = [at(p.x - 2, p.y), at(p.x + 2, p.y), at(p.x, p.y - 2), at(p.x, p.y + 2)].filter(Boolean).length;
        if (nb >= 3) cand.push({ x: p.x, y: p.y, z });
      }
    }
    // Retira algumas peças ao acaso, sempre em pares espelhados.
    const keep = new Map();
    const layer = cand.filter(q => {
      const key = Math.min(q.x, 2 * axis - q.x) + ',' + q.y;
      if (!keep.has(key)) keep.set(key, rnd() > 0.15);
      return keep.get(key);
    });
    if (layer.length < 2) break;
    all.push(...layer);
    below = layer;
  }

  // Número ímpar só acontece com uma peça no eixo: tira a mais alta descoberta.
  if (all.length % 2) {
    const covered = t => all.some(o => o.z === t.z + 1 && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2);
    const onAxis = all.filter(t => t.x === axis && !covered(t)).sort((a, b) => b.z - a.z);
    if (!onAxis.length) return null;
    all.splice(all.indexOf(onAxis[0]), 1);
  }
  const minTiles = Math.round(20 + Math.min(d, 1.1) * 56);
  if (all.length < minTiles || all.length > Math.min(144, maxTiles + 12)) return null;
  return all;
}

function generate(seed, d) {
  for (let attempt = 0; ; attempt++) {
    const pos = shape(d, mulberry32(seed + attempt * 104729));
    if (pos && isSolvable(pos)) return pos;
  }
}

const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

export function getLevel(n) {
  return cached(`level:${n}`, () => {
    const cfg = levelConfig(n);
    const chapter = chapterOf(n);
    const base = { n, ...cfg, color: chapter.color, chapter };
    if (n === 1) return { ...base, name: 'Primeiros passos', positions: parseLayout(TUTORIAL), tutorial: true };
    if (cfg.special) {
      const layout = LAYOUTS[(n / LEVELS_PER_CHAPTER - 1) % LAYOUTS.length];
      return { ...base, name: layout.name, positions: parseLayout(layout) };
    }
    let d = Math.min(1, (n - 1) / 120);
    if (cfg.hard) d += 0.3;
    if (cfg.easy) d = Math.max(0, d - 0.2);
    return { ...base, name: cfg.hard ? 'Nível difícil' : `Nível ${n}`, positions: generate(n * 7919, d) };
  });
}

// Desafio diário: segunda é o dia mais fácil, domingo o mais difícil.
export function getDailyLevel(date) {
  return cached(`daily:${date}`, () => {
    const [y, m, dd] = date.split('-').map(Number);
    const dow = (new Date(y, m - 1, dd).getDay() + 6) % 7; // 0 = segunda
    const d = 0.25 + dow * 0.1;
    return {
      positions: generate(hashString('daily' + date), d),
      locks: dow >= 3 ? 1 + (dow >= 5 ? 1 : 0) : 0,
      bombs: dow === 6 ? 1 : 0,
      color: '#1e3a5f',
    };
  });
}

// Níveis de evento: série curta com dificuldade a subir.
export function getEventLevel(season, i, color) {
  return cached(`event:${season}:${i}`, () => ({
    positions: generate(hashString(season + ':' + i), 0.15 + i * 0.06),
    locks: i >= 5 && i % 2 ? 1 : 0,
    bombs: i >= 10 && i % 2 === 0 ? 1 : 0,
    color,
  }));
}
