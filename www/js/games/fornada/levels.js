// Desafios da Fornada (300) e desafio diário, gerados de forma determinística.
// Cada desafio: tabuleiro, pedras/fornos, peças já postas, um doce a fazer e um limite de jogadas.
// O limite é generoso e é verificado por um robô (npm run check:fornada).
import { newState } from './engine.js';
import { hashString } from '../../core/store.js';

export const LEVELS_PER_ZONE = 30;
export const TOTAL_LEVELS = 300;

export const ZONES = [
  { name: 'Forno a lenha', icon: '🔥', text: 'Desafios simples: faz o doce pedido antes de acabarem as jogadas.' },
  { name: 'Pedras', icon: '🪨', text: 'As pedras não se mexem e partem as linhas. Cuidado para não ficares encurralado.' },
  { name: 'Tabuleiro grande', icon: '🔲', text: 'Tabuleiros 5×5, com mais espaço e doces maiores.' },
  { name: 'Fermento', icon: '🧫', text: 'O fermento junta-se com qualquer doce e dobra-o.' },
  { name: 'Fornos', icon: '♨️', text: 'Os fornos ocupam uma casa e abrem ao fim de algumas jogadas. O número diz quantas faltam.' },
  { name: 'Congeladas', icon: '❄️', text: 'As peças congeladas não se mexem. Descongelam quando há uma fusão mesmo ao lado.' },
  { name: 'Apertado', icon: '🫙', text: 'Tabuleiros 3×3: cada jogada conta.' },
  { name: 'Mistura', icon: '🥣', text: 'Pedras, fornos e congeladas juntos.' },
  { name: 'Grande fornada', icon: '🎂', text: 'Tabuleiros 6×6 e doces grandes.' },
  { name: 'Mestre pasteleiro', icon: '👑', text: 'Os desafios finais, com tudo.' },
];

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Jogadas permitidas: o robô precisa de cerca de goal/2 jogadas; damos bastante folga.
const limitFor = (goal, N, extra = 0) => Math.ceil((goal / 2) * (N <= 3 ? 1.9 : 1.55) + 25 + extra);

export function challenge(n) {
  const zone = Math.floor((n - 1) / LEVELS_PER_ZONE), k = (n - 1) % LEVELS_PER_ZONE, rnd = mulberry32(n * 7919 + 11);
  const steps = (list) => list[Math.min(list.length - 1, Math.floor((k / LEVELS_PER_ZONE) * list.length))];
  const pickCells = (N, count, avoid = new Set(), inner = false) => {
    const out = [];
    let guard = 0;
    while (out.length < count && guard++ < 200) {
      const r = inner ? 1 + Math.floor(rnd() * (N - 2)) : Math.floor(rnd() * N), c = inner ? 1 + Math.floor(rnd() * (N - 2)) : Math.floor(rnd() * N);
      const i = r * N + c;
      if (avoid.has(i) || out.includes(i)) continue;
      out.push(i);
    }
    return out;
  };
  let N = 4, goal = 128, stones = [], tiles = [], extra = 0;
  switch (zone) {
    case 0: N = 4; goal = steps([32, 64, 128, 128, 256, 256, 512]); break;
    case 1: N = 4; goal = steps([64, 128, 128, 256]); stones = pickCells(4, k < 15 ? 1 : 2, new Set(), true).map(i => ({ i, t: 0 })); extra = 20; break;
    case 2: N = 5; goal = steps([128, 256, 256, 512, 512, 1024]); break;
    case 3: N = 4; goal = steps([128, 256, 256, 512]); tiles = pickCells(4, 1 + (k % 2)).map(i => ({ i, wild: true })); break;
    case 4: N = 5; goal = steps([256, 256, 512, 512, 1024]); stones = pickCells(5, 2 + Math.floor(k / 10)).map(i => ({ i, t: 10 + Math.floor(rnd() * 25) })); extra = 25; break;
    case 5: { N = k < 15 ? 4 : 5; goal = steps([128, 256, 256, 512]); const cells = pickCells(N, 2 + Math.floor(k / 10)); tiles = cells.map(i => ({ i, v: [2, 4, 8, 16][Math.floor(rnd() * 4)], frozen: true })); extra = 25; break; }
    case 6: N = 3; goal = steps([32, 64, 64, 128, 128]); break;
    case 7: { N = 5; goal = steps([256, 512, 512, 1024]); stones = [...pickCells(5, 1, new Set(), true).map(i => ({ i, t: 0 })), ...pickCells(5, 2).map(i => ({ i, t: 12 + Math.floor(rnd() * 20) }))];
      const avoid = new Set(stones.map(x => x.i)); tiles = pickCells(5, 2, avoid).map(i => ({ i, v: [4, 8, 16][Math.floor(rnd() * 3)], frozen: true })); extra = 40; break; }
    case 8: N = 6; goal = steps([512, 1024, 1024, 2048]); break;
    default: { N = k < 15 ? 5 : 6; goal = steps([512, 1024, 1024, 2048]); stones = pickCells(N, 2).map(i => ({ i, t: 15 + Math.floor(rnd() * 20) })); stones.push(...pickCells(N, 1, new Set(stones.map(x => x.i)), true).map(i => ({ i, t: 0 })));
      const avoid = new Set(stones.map(x => x.i)); tiles = [...pickCells(N, 1, avoid).map(i => ({ i, wild: true })), ...pickCells(N, 2, new Set([...avoid])).map(i => ({ i, v: 8, frozen: true }))];
      extra = 50; }
  }
  // Não pôr peças em cima de pedras
  const stoneSet = new Set(stones.map(x => x.i));
  tiles = tiles.filter((t, j) => !stoneSet.has(t.i) && tiles.findIndex(o => o.i === t.i) === j);
  return { n, zone, N, goal, stones, tiles, seed: (n * 2654435761) >>> 0, moves: limitFor(goal, N, extra) };
}

export const challengeState = lv => newState({ N: lv.N, seed: lv.seed, stones: lv.stones, tiles: lv.tiles });

// Desafio diário: igual para todos nesse dia. Segunda calma, domingo maior.
const DAILY = [
  { N: 4, goal: 256 }, { N: 4, goal: 256, stones: 1 }, { N: 5, goal: 512 }, { N: 4, goal: 512, wild: 1 },
  { N: 5, goal: 512, fornos: 2 }, { N: 4, goal: 256, frozen: 2 }, { N: 5, goal: 512, stones: 1, fornos: 2, frozen: 1 },
];
export function dailyChallenge(date) {
  const [y, m, d] = date.split('-').map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7, cfg = DAILY[dow];
  const rnd = mulberry32(hashString('fornada-daily:' + date));
  const N = cfg.N, used = new Set();
  const cell = (inner = false) => { for (;;) { const r = inner ? 1 + Math.floor(rnd() * (N - 2)) : Math.floor(rnd() * N), c = inner ? 1 + Math.floor(rnd() * (N - 2)) : Math.floor(rnd() * N), i = r * N + c; if (!used.has(i)) { used.add(i); return i; } } };
  const stones = [...Array(cfg.stones || 0)].map(() => ({ i: cell(true), t: 0 })).concat([...Array(cfg.fornos || 0)].map(() => ({ i: cell(), t: 12 + Math.floor(rnd() * 20) })));
  const tiles = [...Array(cfg.wild || 0)].map(() => ({ i: cell(), wild: true })).concat([...Array(cfg.frozen || 0)].map(() => ({ i: cell(), v: 4, frozen: true })));
  return { n: null, daily: date, dow, zone: dow, N, goal: cfg.goal, stones, tiles, seed: hashString('fornada-seed:' + date) >>> 0, moves: limitFor(cfg.goal, N, 30) };
}
