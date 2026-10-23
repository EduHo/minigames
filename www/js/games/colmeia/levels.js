// Níveis da Colmeia (300) e desafio diário, gerados de forma determinística.
// 10 zonas de 30 níveis pelo prado; cada nível tem objetivos e jogadas contadas.
// Cada nível é jogado por um robô na validação (npm run check:colmeia).
import { CELLS, solve } from './engine.js';
import { hashString } from '../../core/store.js';

export const LEVELS_PER_ZONE = 30;
export const TOTAL_LEVELS = 300;
export const STARS_PER_ZONE = 45;

export const ZONES = [
  { name: 'Prado das flores', icon: '🌼', color: '#86cb62', text: 'Faz números e junta pontos.' },
  { name: 'Favos de mel', icon: '🍯', color: '#f2c14e', text: 'As casas com mel ficam limpas quando um caminho passa por cima delas.' },
  { name: 'Trilho comprido', icon: '🐝', color: '#9fd27a', text: 'Faz caminhos compridos: contam os que têm o número de peças pedido ou mais.' },
  { name: 'Pedreira', icon: '🪨', color: '#b8b19f', text: 'As pedras partem-se quando um caminho acaba mesmo ao lado delas.' },
  { name: 'Orvalho gelado', icon: '🧊', color: '#a8d8f0', text: 'Peças geladas não se usam. Descongelam quando um caminho acaba ao lado.' },
  { name: 'Pomar', icon: '🍎', color: '#7cc45a', text: 'Números grandes e muitos pontos.' },
  { name: 'Mel e pedra', icon: '⛏️', color: '#d9b26a', text: 'Mel e pedras ao mesmo tempo.' },
  { name: 'Geada', icon: '❄️', color: '#bfe3f5', text: 'Gelo e caminhos compridos.' },
  { name: 'Grande colmeia', icon: '🏵️', color: '#e8b04a', text: 'Tudo junto.' },
  { name: 'Rainha', icon: '👑', color: '#f7a93a', text: 'Os últimos níveis: números enormes.' },
];

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const CENTER = CELLS.findIndex(c => c.q === 0 && c.r === 0);

export function levelConfig(n) {
  const zone = Math.floor((n - 1) / LEVELS_PER_ZONE), k = (n - 1) % LEVELS_PER_ZONE, rnd = mulberry32(n * 7919 + 5);
  const d = (n - 1) / (TOTAL_LEVELS - 1), t = k / (LEVELS_PER_ZONE - 1);      // dificuldade geral e dentro da zona
  const tileGoal = 2 ** Math.round(5 + d * 4 + t * 1.2 + (k % 10 === 9 ? 1 : 0));   // 32 … 1024
  const order = CELLS.map((_, i) => i).filter(i => i !== CENTER).sort(() => rnd() - 0.5);
  let stones = [], honey = [], ice = [], goals = [];
  const take = (count, list) => { const out = order.filter(i => !stones.includes(i) && !honey.includes(i) && !ice.includes(i)).slice(0, count); list.push(...out); return out.length; };
  const score = () => ({ k: 'score', n: Math.round((300 + tileGoal * 6 + d * 3000) / 50) * 50 });
  const tile = () => ({ k: 'tile', v: tileGoal });
  const chain = () => ({ k: 'chain', len: 5 + Math.round(t * 2), n: 1 + Math.round(t * 2) });
  const hon = () => ({ k: 'honey', n: take(5 + Math.round(t * 7 + d * 5), honey) });
  const sto = () => ({ k: 'stone', n: take(3 + Math.round(t * 4 + d * 3), stones) });
  const ic = () => ({ k: 'ice', n: take(3 + Math.round(t * 4 + d * 3), ice) });
  const alt = k % 3;
  switch (zone) {
    case 0: goals = [k % 2 ? score() : tile()]; break;
    case 1: goals = [hon(), ...(alt === 2 ? [tile()] : [])]; break;
    case 2: goals = [chain(), ...(alt === 1 ? [tile()] : [])]; break;
    case 3: goals = [sto(), ...(alt === 0 ? [score()] : [])]; break;
    case 4: goals = [ic(), ...(alt === 2 ? [chain()] : [])]; break;
    case 5: goals = [tile(), ...(alt !== 0 ? [score()] : [])]; break;
    case 6: goals = [hon(), sto()]; break;
    case 7: goals = [ic(), chain()]; break;
    case 8: goals = [[hon, sto, ic][k % 3](), [tile, chain, score][(k + 1) % 3]()]; break;
    default: goals = [tile(), [hon, sto, ic][k % 3]()];
  }
  // Jogadas: base pelo objetivo mais pesado, com folga (afinado pela validação)
  let need = 0;
  for (const x of goals) {
    if (x.k === 'tile') need = Math.max(need, 4 + Math.log2(x.v / 16) * 3.2);
    if (x.k === 'score') need = Math.max(need, 4 + x.n / 160);
    if (x.k === 'chain') need = Math.max(need, 4 + x.n * (x.len - 3) * 1.4);
    if (x.k === 'honey') need = Math.max(need, 4 + x.n * 1.1);
    if (x.k === 'stone' || x.k === 'ice') need = Math.max(need, 4 + x.n * 1.6);
  }
  need += (goals.length - 1) * 4;
  const lv = { n, zone, seed: (n * 2654435761) >>> 0, stones, honey, ice, goals, moves: 0 };
  return withMoves(lv, need, d);
}

// Jogadas: o que o robô precisou, com folga (menos folga nos níveis mais à frente).
function withMoves(lv, need, d) {
  const used = solve({ ...lv, moves: 999 }, 160);
  lv.moves = used == null ? Math.round(need * 2 + 6) : Math.max(10, Math.round(need * 0.8), Math.ceil(used * (1.85 - d * 0.3)) + 5);
  return lv;
}

const cache = new Map();
export const getLevel = n => { if (!cache.has(n)) cache.set(n, levelConfig(n)); return cache.get(n); };

// Desafio diário: um nível da zona do dia da semana, igual para toda a gente.
export function dailyLevel(date) {
  const [y, m, d] = date.split('-').map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const h = hashString('colmeia-daily:' + date) >>> 0;
  const base = levelConfig(1 + ((dow + 1) * 30 + (h % 20)) % TOTAL_LEVELS);
  return withMoves({ ...base, n: null, daily: date, dow, seed: h }, base.moves, 0.3);
}
