// Níveis do Azulejos, gerados de forma determinística (o nível N é sempre igual).
// Viagem pelas Terras de Azulém: 10 sítios de 20 níveis (1–200), depois a Segunda Viagem até ao 1000.
// Cada sítio apresenta uma mecânica; o último nível de cada sítio é o nível do Cinzento.
import { generateTiles } from './engine.js';
import { hashString } from '../../core/store.js';
import { CHAPTER_FACES } from './art.js';

export const LEVELS_PER_PLACE = 20;
export const TOTAL_LEVELS = 1000;
export const STARS_PER_PLACE = 40;

export const PLACES = [
  { id: 'ribeira', name: 'Ribeira Azul', who: 'joaquim', mech: null, top: '#cfe0f7', bottom: '#f6f1e4', deco: 'houses' },
  { id: 'nevoa', name: 'Bosque da Névoa', who: 'amelia', mech: 'nevoa', top: '#d6e6cf', bottom: '#eef3ec', deco: 'trees' },
  { id: 'muralha', name: 'Vila Muralhada', who: 'rui', mech: 'cadeado', top: '#e9dcc4', bottom: '#f6efe2', deco: 'walls' },
  { id: 'torre', name: 'Torre dos Mil Livros', who: 'beatriz', mech: 'pilhas', top: '#e2d9ef', bottom: '#f4f0f8', deco: 'books' },
  { id: 'fogueiras', name: 'Vale das Fogueiras', who: 'ze', mech: 'poderes', top: '#f6dcc0', bottom: '#fbf0e2', deco: 'lanterns' },
  { id: 'vinhedo', name: 'Encostas do Vinhedo', who: 'graca', mech: 'hera', top: '#e3d6e6', bottom: '#f3eef0', deco: 'vines' },
  { id: 'serra', name: 'Serra Gelada', who: 'tome', mech: 'gelo', top: '#dbe9f6', bottom: '#f5f9fd', deco: 'snow' },
  { id: 'sobreiros', name: 'Planície dos Sobreiros', who: 'luisa', mech: 'cortica', top: '#efe1c2', bottom: '#f8f1e0', deco: 'oaks' },
  { id: 'grutas', name: 'Costa das Grutas', who: 'marta', mech: 'mare', top: '#cdebea', bottom: '#eef8f7', deco: 'waves' },
  { id: 'ilhas', name: 'Ilhas Flutuantes', who: 'lourenco', mech: 'tudo', top: '#d8e4fa', bottom: '#f3f6fd', deco: 'clouds' },
];

export const MECHANICS = {
  nevoa: { icon: '🎁', name: 'Presentes', text: 'Alguns azulejos vêm embrulhados. Só sabes o que têm quando ficam livres e se desembrulham.' },
  cadeado: { icon: '🔒', name: 'Portões', text: 'Um azulejo com cadeado só sai depois de fazeres um par do desenho que o cadeado mostra.' },
  pilhas: { icon: '📚', name: 'Pilhas', text: 'Ao lado do tabuleiro há pilhas de azulejos. Só se tira o de cima; o número diz quantos faltam.' },
  poderes: { icon: '✨', name: 'Super poderes', text: 'Azulejos com poderes! Quando fazes o par, o poder dispara: ⚡ tira mais um par, 🔥 derrete o gelo, 🔑 abre os portões, 👁️ desembrulha os presentes.' },
  hera: { icon: '🌿', name: 'Vinhas', text: 'A hera prende o azulejo. Solta-se quando sai um vizinho do lado.' },
  gelo: { icon: '❄️', name: 'Congelados', text: 'Um azulejo congelado não se pode escolher. Cada par feito ao lado racha o gelo; o número diz quantos faltam.' },
  cortica: { icon: '🍾', name: 'Rolhas', text: 'Uma rolha de cortiça tapa o azulejo. Salta sozinha ao fim de alguns pares; o número diz quantos.' },
  mare: { icon: '🌊', name: 'Maré', text: 'A maré está a subir! O azulejo com a onda tem de sair antes de o número chegar a zero, senão a maré leva o nível.' },
};
const MECH_KEYS = Object.keys(MECHANICS);

export const placeOf = n => PLACES[Math.floor(((n - 1) % 200) / LEVELS_PER_PLACE)];
export const placeIndex = n => Math.floor((n - 1) / LEVELS_PER_PLACE);
export const isVillain = n => n % LEVELS_PER_PLACE === 0;

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Formas do tabuleiro ----------
// Desenhos simétricos (como nos jogos de referência): o desenho dá a camada de baixo,
// e as camadas de cima vão em pirâmide (desfasadas meio azulejo) ou alinhadas.
const MASKS = {
  square: () => true,
  frame: (c, r, W, H) => c < 2 || r < 2 || c >= W - 2 || r >= H - 2,
  diamond: (c, r, W, H) => Math.abs(c - (W - 1) / 2) / (W / 2) + Math.abs(r - (H - 1) / 2) / (H / 2) <= 1.05,
  cross: (c, r, W, H) => Math.abs(c - (W - 1) / 2) <= W / 5 || Math.abs(r - (H - 1) / 2) <= H / 5,
  ex: (c, r, W, H) => { const u = c / (W - 1), v = r / (H - 1); return Math.abs(u - v) < 0.26 || Math.abs(u + v - 1) < 0.26; },
  circle: (c, r, W, H) => ((c - (W - 1) / 2) / (W / 2)) ** 2 + ((r - (H - 1) / 2) / (H / 2)) ** 2 <= 1.1,
  towers: (c, r, W) => c < Math.ceil(W / 3) || c >= W - Math.ceil(W / 3),
  arch: (c, r, W, H) => !(r > H / 2 && Math.abs(c - (W - 1) / 2) < W / 5),
  hourglass: (c, r, W, H) => Math.abs(c - (W - 1) / 2) <= 0.5 + Math.abs(r - (H - 1) / 2) * (W / H),
  pyramid: (c, r, W, H) => Math.abs(c - (W - 1) / 2) <= 0.6 + r * (W / 2) / (H - 1),
  heart: (c, r, W, H) => {
    const x = (c - (W - 1) / 2) / (W / 2), y = 1 - r / (H - 1) * 2;
    return (x * x + y * y - 0.55) ** 3 - x * x * y ** 3 * 1.1 <= 0.02;
  },
  columns: (c, r, W) => c % 2 === 0 || c === Math.floor(W / 2),
  stripes: (c, r) => r % 3 !== 2,
  rings: (c, r, W, H) => { const d = Math.max(Math.abs(c - (W - 1) / 2), Math.abs(r - (H - 1) / 2)); return Math.round(d) % 2 === 0 || d < 1; },
  butterfly: (c, r, W, H) => Math.abs(c - (W - 1) / 2) >= Math.abs(r - (H - 1) / 2) * 0.8 - 0.3,
};
const MASK_KEYS = Object.keys(MASKS);

function maskGrid(kind, W, H) {
  const g = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    // Simetria esquerda/direita garantida
    const cc = Math.min(c, W - 1 - c);
    if (MASKS[kind](cc, r, W, H) || MASKS[kind](W - 1 - cc, r, W, H)) g.push({ x: c * 2, y: r * 2, z: 0 });
  }
  return g;
}

function nextLayer(below, mode, z) {
  const has = new Set(below.map(p => `${p.x},${p.y}`));
  const at = (x, y) => has.has(`${x},${y}`);
  const layer = [];
  for (const p of below) {
    if (mode === 'pyramid') {
      if (at(p.x + 2, p.y) && at(p.x, p.y + 2) && at(p.x + 2, p.y + 2)) layer.push({ x: p.x + 1, y: p.y + 1, z });
    } else if ([at(p.x - 2, p.y), at(p.x + 2, p.y), at(p.x, p.y - 2), at(p.x, p.y + 2)].filter(Boolean).length >= 3) {
      layer.push({ x: p.x, y: p.y, z });
    }
  }
  return layer;
}

function shape(target, layersMax, rnd, stacks) {
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  for (let attempt = 0; attempt < 300; attempt++) {
    const kind = target <= 18 ? ['square', 'diamond', 'cross', 'pyramid'][ri(0, 3)] : MASK_KEYS[ri(0, MASK_KEYS.length - 1)];
    const big = target > 60;
    const W = ri(target <= 18 ? 3 : 5, big || target > 30 ? 7 : 5);
    const H = ri(target <= 18 ? 3 : 5, stacks ? 7 : big ? 8 : target > 30 ? 7 : 6);
    let below = maskGrid(kind, W, H);
    if (below.length < 6) continue;
    const all = [...below];
    const pyramidFirst = rnd() < 0.65;
    for (let z = 1; z <= layersMax && all.length < target; z++) {
      const mode = (z % 2 === 1) === pyramidFirst ? 'pyramid' : 'aligned';
      const layer = nextLayer(below, mode, z);
      if (layer.length < 2) break;
      all.push(...layer);
      below = layer;
    }
    // Pilhas ao lado do tabuleiro (em baixo, à esquerda e à direita), como nos jogos de referência.
    if (stacks) {
      const maxY = Math.max(...all.map(p => p.y)), maxX = Math.max(...all.map(p => p.x));
      const spots = [{ x: 0, y: maxY + 3 }, { x: maxX, y: maxY + 3 }, { x: Math.round(maxX / 4) * 2, y: maxY + 3 }].slice(0, Math.min(3, stacks + 1));
      spots.forEach(sp => {
        const h = ri(3, 5);
        for (let j = 0; j < h; j++) all.push({ x: sp.x, y: sp.y, z: j, pile: true });
      });
    }
    // Acertar para número par tirando azulejos de cima (sem deixar nada a flutuar).
    while (all.length % 2) {
      const covered = t => all.some(o => o !== t && o.z > t.z && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2);
      const tops = all.filter(t => !covered(t)).sort((a, b) => b.z - a.z || Math.abs(a.x - 8) - Math.abs(b.x - 8));
      all.splice(all.indexOf(tops[0]), 1);
    }
    if (all.length >= Math.max(8, target * 0.7) && all.length <= target * 1.4) { all.kind = kind; return all; }
  }
  throw new Error('Forma impossível');
}

// Configuração de um nível: tamanho, desenhos e mecânicas.
export function levelConfig(n) {
  const voyage2 = n > 200;
  const local = ((n - 1) % 200) + 1;           // posição na viagem (1–200)
  const placeI = Math.floor((local - 1) / LEVELS_PER_PLACE);
  const inPlace = ((local - 1) % LEVELS_PER_PLACE) + 1;
  const villain = isVillain(n);
  const hard = inPlace % 10 === 9, easy = inPlace % 10 === 1 && n > 1;
  const rnd = mulberry32(n * 31 + 7);
  // Tamanho e variedade sobem ao longo da viagem; na Segunda Viagem começam já altos.
  const d = voyage2 ? Math.min(1, 0.55 + (n - 200) / 800) : Math.min(1, (local - 1) / 150);
  let target = Math.round(24 + d * 90 + inPlace * 0.8);
  if (hard || villain) target += 9;
  if (easy) target -= 9;
  const types = Math.min(12, 3 + Math.round(d * 9) + (hard ? 1 : 0));
  const mech = {};
  const introduced = PLACES.slice(1, voyage2 ? 9 : Math.min(placeI, 8) + 1).map(p => p.mech);
  const placeMech = PLACES[placeI % 10].mech;
  const use = m => {
    const k = Math.min(1, 0.4 + d * 0.6);
    if (m === 'nevoa') mech.nevoa = 0.12 + 0.1 * k;
    if (m === 'cadeado') mech.cadeado = 1 + Math.floor(k * 2);
    if (m === 'pilhas') mech.pilhas = 1 + Math.floor(k * 2);
    if (m === 'poderes') mech.poderes = 2 + Math.floor(k * 2);
    if (m === 'hera') mech.hera = 2 + Math.floor(k * 3);
    if (m === 'gelo') mech.gelo = 2 + Math.floor(k * 3);
    if (m === 'cortica') mech.cortica = 2 + Math.floor(k * 2);
    if (m === 'mare') mech.mare = 2 + Math.floor(k * 2);
  };
  if (n === 1 || n === 2) { /* tutorial */ }
  else if (!voyage2 && placeMech && placeMech !== 'tudo') {
    // No sítio da mecânica: quase sempre essa; às vezes uma anterior também.
    if (inPlace !== 2 && inPlace !== 3) use(placeMech);
    if (inPlace % 4 === 0 && introduced.length > 1) use(introduced[Math.floor(rnd() * (introduced.length - 1))]);
  } else if (voyage2 || placeMech === 'tudo') {
    // Ilhas e Segunda Viagem: combinações de 1 a 3 mecânicas.
    const pool = introduced.length ? introduced : MECH_KEYS;
    const count = 1 + Math.floor(rnd() * Math.min(3, pool.length));
    for (let k = 0; k < count; k++) use(pool[Math.floor(rnd() * pool.length)]);
  }
  const objectives = ['combo2', 'noundo', 'combo3', 'norocket'];
  return {
    n, place: placeI % 10, inPlace, villain, hard, easy, voyage2,
    target: n === 1 ? 12 : n === 2 ? 16 : n === 3 ? 22 : n <= 6 ? 28 : target,
    layers: n <= 2 ? 1 : n <= 6 ? 2 : Math.min(6, 2 + Math.round(d * 4)),
    types: n === 1 ? 3 : n === 2 ? 4 : types,
    mech,
    intro: !voyage2 && inPlace === 1 && placeMech && placeMech !== 'tudo' ? placeMech : null,
    objective: n <= 2 ? null : objectives[n % 4],
  };
}

const cache = new Map();
function build(cfg, seed, faces) {
  const rnd = mulberry32(seed);
  for (let attempt = 0; attempt < 20; attempt++) {
    const positions = shape(cfg.target, cfg.layers, rnd, cfg.mech.pilhas || 0);
    const res = generateTiles(positions, { ...cfg.mech, types: cfg.types, faces }, rnd);
    if (res) return { ...cfg, tiles: res.tiles, order: res.order };
  }
  throw new Error('Nível impossível de gerar');
}

export function getLevel(n) {
  if (!cache.has(n)) cache.set(n, build(levelConfig(n), n * 7919 + 13, CHAPTER_FACES[levelConfig(n).place]));
  return cache.get(n);
}

// Desafio diário: segunda é o dia mais calmo, domingo junta várias mecânicas.
const WEEK = [[], ['nevoa'], ['cadeado', 'poderes'], ['pilhas', 'gelo'], ['poderes', 'gelo'], ['hera', 'cortica'], ['mare', 'cadeado', 'nevoa', 'poderes']];
export function getDailyLevel(date, faces) {
  const key = `daily:${date}:${faces ? 'f' : ''}`;
  if (cache.has(key)) return cache.get(key);
  const [y, m, d] = date.split('-').map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const cfg = {
    n: null, daily: date, dow, place: (y * 12 + m + d) % 10, inPlace: 0, villain: false, hard: dow === 6, easy: false, voyage2: false,
    target: 36 + dow * 6, layers: 2 + Math.floor(dow / 2), types: 6 + dow, mech: {}, intro: null, objective: ['combo2', 'noundo', 'combo3'][dow % 3],
  };
  const AMOUNT = { nevoa: 0.18, cadeado: 2, pilhas: 2, poderes: 3, hera: 3, gelo: 3, cortica: 3, mare: 2 };
  for (const m of WEEK[dow]) cfg.mech[m] = AMOUNT[m];
  const lv = build(cfg, hashString('azulejos-daily:' + date), faces || CHAPTER_FACES[cfg.place]);
  cache.set(key, lv);
  return lv;
}
