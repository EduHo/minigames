// Níveis da Casa na Serra, gerados de forma determinística (o nível N é sempre igual).
// 10 zonas de 20 níveis (uma por divisão da casa), depois a segunda volta até ao nível 1000.
import { generateTiles } from './engine.js';
import { hashString } from '../../core/store.js';
import { ICON_NAMES } from './art.js';

export const LEVELS_PER_ZONE = 20;
export const TOTAL_LEVELS = 1000;

export const ZONES = [
  { name: 'Sala da lareira', mech: null },
  { name: 'Cozinha', mech: 'virados' },
  { name: 'Quarto', mech: 'pilhas' },
  { name: 'Varanda', mech: 'gelo' },
  { name: 'Sótão', mech: 'correntes' },
  { name: 'Jardim de inverno', mech: 'presentes' },
  { name: 'Adega', mech: 'cortica' },
  { name: 'Celeiro', mech: 'dourados' },
  { name: 'Estufa', mech: 'gigante' },
  { name: 'Torre do relógio', mech: 'tudo' },
];

export const MECHANICS = {
  virados: { icon: '🂠', name: 'Virados', text: 'Alguns azulejos estão virados. Só vês o desenho quando ficam livres.' },
  pilhas: { icon: '📚', name: 'Pilhas', text: 'Ao lado da cúpula há pilhas de azulejos. Só se tira o de cima; o número diz quantos faltam.' },
  gelo: { icon: '❄️', name: 'Gelo', text: 'Um azulejo gelado precisa de dois toques: o primeiro parte o gelo.' },
  correntes: { icon: '⛓️', name: 'Correntes', text: 'Um azulejo com corrente só sai depois de fazeres um trio do desenho que a corrente mostra.' },
  presentes: { icon: '🎁', name: 'Presentes', text: 'Os azulejos embrulhados dão uma ajuda quando os tiras.' },
  cortica: { icon: '🍾', name: 'Rolha', text: 'Na adega uma rolha tapa um lugar da barra: só tens 6.' },
  dourados: { icon: '✨', name: 'Dourados', text: 'Os azulejos dourados valem 5 moedas cada.' },
  gigante: { icon: '🏔️', name: 'Cúpulas gigantes', text: 'Cúpulas enormes, com mais de 200 azulejos. Calma e boa pontaria!' },
};

export const zoneOf = n => Math.floor(((n - 1) % 200) / LEVELS_PER_ZONE);

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Formas ----------
// Cada camada é a mesma forma um pouco mais pequena; as camadas ímpares ficam desfasadas meio azulejo.
const MASKS = {
  cupula: (x, y) => x * x + y * y * 1.05 <= 1,
  oval: (x, y) => x * x * 0.8 + y * y * 1.25 <= 1,
  almofada: (x, y) => Math.abs(x) ** 3 + Math.abs(y) ** 3 <= 1,
  losango: (x, y) => Math.abs(x) + Math.abs(y) <= 1.15,
  flor: (x, y) => { const a = Math.atan2(y, x), r = Math.hypot(x, y); return r <= 0.78 + 0.25 * Math.cos(a * 4); },
  coracao: (x, y) => { const X = x * 1.1, Y = -y * 1.15 + 0.25; return (X * X + Y * Y - 0.6) ** 3 - X * X * Y ** 3 <= 0; },
};
const MASK_KEYS = Object.keys(MASKS);

export function dome(kind, radius, layers, shrink, piles = 0, rnd = Math.random) {
  const mask = MASKS[kind];
  const pos = [];
  for (let z = 0; z < layers; z++) {
    const r = radius - z * shrink, off = z % 2;
    if (r < 0.6) break;
    const lim = Math.ceil(radius) + 1;
    for (let y = -lim; y <= lim; y++) for (let x = -lim; x <= lim; x++) {
      const cx = x + off * 0.5, cy = y + off * 0.5;
      if (mask(cx / r, cy / r)) pos.push({ x: Math.round(cx * 2), y: Math.round(cy * 2), z });
    }
  }
  // Pilhas ao lado da cúpula, em baixo, à esquerda e à direita
  if (piles) {
    const maxY = Math.max(...pos.map(p => p.y)), minX = Math.min(...pos.map(p => p.x)), maxX = Math.max(...pos.map(p => p.x));
    const spots = [{ x: minX, y: maxY + 3 }, { x: maxX, y: maxY + 3 }, { x: Math.round((minX + maxX) / 4) * 2, y: maxY + 3 }].slice(0, piles);
    spots.forEach(sp => { const h = 3 + Math.floor(rnd() * 3); for (let j = 0; j < h; j++) pos.push({ x: sp.x, y: sp.y, z: j, pile: true }); });
  }
  // Acertar para múltiplo de 3 tirando azulejos de cima
  const covered = (t, all) => all.some(o => o !== t && o.z > t.z && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2);
  while (pos.length % 3) {
    const tops = pos.filter(t => !t.pile && !covered(t, pos)).sort((a, b) => b.z - a.z);
    pos.splice(pos.indexOf(tops[0]), 1);
  }
  const mx = Math.min(...pos.map(p => p.x)), my = Math.min(...pos.map(p => p.y));
  return pos.map(p => ({ ...p, x: p.x - mx, y: p.y - my }));
}

// ---------- Configuração de um nível ----------
export function levelConfig(n) {
  const voyage2 = n > 200;
  const local = ((n - 1) % 200) + 1;
  const zone = Math.floor((local - 1) / LEVELS_PER_ZONE);
  const inZone = ((local - 1) % LEVELS_PER_ZONE) + 1;
  const rnd = mulberry32(n * 977 + 3);
  const d = voyage2 ? Math.min(1, 0.55 + (n - 200) / 800) : Math.min(1, (local - 1) / 160);
  const hard = inZone % 10 === 9, easy = inZone % 10 === 1 && n > 1;
  const zm = ZONES[zone].mech;
  const big = zm === 'gigante' || (voyage2 && rnd() < 0.2);
  let radius = 2.2 + d * 1.5 + (hard ? 0.25 : 0) - (easy ? 0.3 : 0);
  let layers = 3 + Math.round(d * 5) + (hard ? 1 : 0);
  if (big) { radius = Math.max(radius, 3.7); layers = Math.max(layers, 8); }
  const shrink = 0.3 - d * 0.1;
  const types = Math.min(16, 5 + Math.round(d * 9) + (hard ? 1 : 0));
  const mech = {};
  const introduced = ZONES.slice(1, voyage2 ? 8 : Math.min(zone, 7) + 1).map(z => z.mech);
  const use = m => {
    const k = Math.min(1, 0.4 + d * 0.6);
    if (m === 'virados') mech.virados = 0.15 + 0.15 * k;
    if (m === 'pilhas') mech.pilhas = 1 + Math.floor(k * 2);
    if (m === 'gelo') mech.gelo = 3 + Math.floor(k * 4);
    if (m === 'correntes') mech.correntes = 2 + Math.floor(k * 2);
    if (m === 'presentes') mech.presentes = 2 + Math.floor(k * 2);
    if (m === 'cortica') mech.cortica = true;
    if (m === 'dourados') mech.dourados = 4 + Math.floor(k * 4);
  };
  if (n <= 2) { /* tutorial */ }
  else if (!voyage2 && zm && zm !== 'tudo' && zm !== 'gigante') {
    if (inZone !== 2) use(zm);
    if (inZone % 4 === 0 && introduced.length > 1) use(introduced[Math.floor(rnd() * (introduced.length - 1))]);
  } else if (voyage2 || zm === 'tudo' || zm === 'gigante') {
    const pool = introduced.length ? introduced : [];
    const count = zm === 'gigante' ? 1 : 1 + Math.floor(rnd() * Math.min(3, pool.length));
    for (let k = 0; k < count && pool.length; k++) use(pool[Math.floor(rnd() * pool.length)]);
  }
  return {
    n, zone, inZone, voyage2, hard, easy,
    shape: n <= 3 ? 'cupula' : MASK_KEYS[Math.floor(rnd() * MASK_KEYS.length)],
    radius: n === 1 ? 1.6 : n === 2 ? 1.9 : radius,
    layers: n === 1 ? 2 : n === 2 ? 3 : layers,
    shrink,
    types: n === 1 ? 3 : n === 2 ? 4 : types,
    mech,
  };
}

const cache = new Map();
function build(cfg, seed) {
  const rnd = mulberry32(seed);
  // Cúpulas até ~270 azulejos, para caberem bem num telemóvel
  let layers = cfg.layers, positions = dome(cfg.shape, cfg.radius, layers, cfg.shrink, cfg.mech.pilhas || 0, rnd);
  while (positions.length > 270 && layers > 3) positions = dome(cfg.shape, cfg.radius, --layers, cfg.shrink, cfg.mech.pilhas || 0, rnd);
  const { tiles, order } = generateTiles(positions, { ...cfg.mech, types: cfg.types, faces: ICON_NAMES_KEYS }, rnd);
  return { ...cfg, tiles, order, cork: !!cfg.mech.cortica };
}
const ICON_NAMES_KEYS = Object.keys(ICON_NAMES);

export function getLevel(n) {
  if (!cache.has(n)) cache.set(n, build(levelConfig(n), n * 7919 + 17));
  return cache.get(n);
}

// Desafio diário: segunda calma, domingo com várias mecânicas.
const WEEK = [[], ['virados'], ['gelo'], ['pilhas', 'dourados'], ['correntes'], ['presentes', 'gelo'], ['virados', 'correntes', 'cortica']];
export function getDailyLevel(date) {
  const key = `daily:${date}`;
  if (cache.has(key)) return cache.get(key);
  const [y, m, d] = date.split('-').map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const rnd = mulberry32(hashString('casa-daily:' + date));
  const cfg = {
    n: null, daily: date, dow, zone: (y * 12 + m + d) % 10, inZone: 0, voyage2: false, hard: dow === 6, easy: false,
    shape: MASK_KEYS[Math.floor(rnd() * MASK_KEYS.length)], radius: 3 + dow * 0.12, layers: 5 + Math.floor(dow / 2), shrink: 0.24, types: 9 + dow, mech: {},
  };
  const AMOUNT = { virados: 0.2, gelo: 4, pilhas: 2, dourados: 5, correntes: 3, presentes: 3, cortica: true };
  for (const k of WEEK[dow]) cfg.mech[k] = AMOUNT[k];
  const lv = build(cfg, hashString('casa-daily-build:' + date));
  cache.set(key, lv);
  return lv;
}
