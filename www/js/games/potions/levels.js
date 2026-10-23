// Níveis do Poções da Lúmen, gerados de forma determinística (o nível N é sempre igual).
// - Mais cores à medida que se avança, até 12.
// - Dente de serra: níveis terminados em 9 são difíceis (+1 cor), em 1 dão alívio.
// - Uma mecânica nova a cada 20 níveis, apresentada pela Lúmen:
//   25 mistério ❓ · 41 cadeado 🔒 · 61 gelo ❄️ · 81 frascos grandes · 101 rótulo 🏷️ · 121 funil ⬇️
//   A partir do 140 as mecânicas combinam-se.
import { generate, newState } from './engine.js';
import { hashString } from '../../core/store.js';

export const LEVELS_PER_CHAPTER = 20;
export const TOTAL_LEVELS = 1000;
export const STARS_PER_CHAPTER = 40; // estrelas necessárias por capítulo para abrir o seguinte

export const MECHANICS = {
  mystery: { from: 25, icon: '❓', name: 'Poções mistério', text: 'Só vês a camada de cima de cada frasco. As outras revelam-se quando ficam no topo. Observa bem antes de deitar!' },
  lock: { from: 41, icon: '🔒', name: 'Frascos com cadeado', text: 'Um frasco trancado só abre quando a cor do cadeado estiver completa noutro frasco. Escolhe bem a ordem!' },
  ice: { from: 61, icon: '❄️', name: 'Frascos gelados', text: 'O gelo derrete com as jogadas que fazes nos outros frascos. O número mostra quantas faltam.' },
  big: { from: 81, icon: '⚗️', name: 'Frascos grandes', text: 'Agora cada poção tem 5 camadas. Mais espaço, mas também mais para arrumar.' },
  label: { from: 101, icon: '🏷️', name: 'Frascos com rótulo', text: 'Um frasco com rótulo só aceita a cor do rótulo. Usa-o para guardar essa poção.' },
  funnel: { from: 121, icon: '⬇️', name: 'Funis', text: 'Um funil só recebe poções: o que lá deitares não volta a sair. Só deites o que já não precisas de mexer.' },
};

const CHAPTER_THEMES = [
  { name: 'Laboratório', color: '#2e1065', glow: '#5b21b6', deco: ['🕯️', '📜', '⚗️', '🧪'] },
  { name: 'Torre do Feiticeiro', color: '#1e1b4b', glow: '#4338ca', deco: ['🌙', '✨', '📚', '🔮'] },
  { name: 'Floresta Encantada', color: '#14532d', glow: '#3f9b5c', deco: ['🍄', '🌿', '🦉', '🌲'] },
  { name: 'Caverna de Cristal', color: '#164e63', glow: '#22c3c3', deco: ['💎', '🦇', '✨', '🪨'] },
  { name: 'Biblioteca Arcana', color: '#4a2511', glow: '#b7791f', deco: ['📚', '🕯️', '🪶', '📜'] },
  { name: 'Pântano das Bruxas', color: '#365314', glow: '#84cc16', deco: ['🐸', '🌫️', '🍄', '🧹'] },
  { name: 'Castelo nas Nuvens', color: '#1e3a8a', glow: '#93c5fd', deco: ['☁️', '🏰', '🕊️', '✨'] },
  { name: 'Jardim Lunar', color: '#3b0764', glow: '#e9d5ff', deco: ['🌙', '🌸', '🦋', '⭐'] },
  { name: 'Forja do Dragão', color: '#7f1d1d', glow: '#f97316', deco: ['🔥', '🐉', '⚒️', '🌋'] },
  { name: 'Observatório', color: '#0f172a', glow: '#facc15', deco: ['🔭', '⭐', '🪐', '☄️'] },
];
const ROMAN = ['', '', ' II', ' III', ' IV', ' V'];

// O que a Lúmen diz ao entrar em cada capítulo.
const CHAPTER_LINES = [
  'Bem-vindo ao meu laboratório! Deita cada poção sobre a mesma cor até cada frasco ter uma só cor.',
  'Na Torre há poções que escondem segredos. Planeia antes de deitar!',
  'A Floresta guarda frascos trancados. Completa a cor do cadeado para os abrir.',
  'Na Caverna de Cristal faz frio: alguns frascos estão gelados.',
  'A Biblioteca tem frascos maiores. Cada poção tem agora 5 camadas!',
  'No Pântano, alguns frascos têm rótulo e só aceitam uma cor.',
  'Cuidado com os funis do Castelo: o que entra já não sai.',
  'O Jardim Lunar mistura todos os truques que aprendeste. Estou orgulhosa de ti!',
  'A Forja do Dragão é para alquimistas experientes. Calma e paciência!',
  'Do Observatório vê-se tudo o que já conquistaste. Continua!',
];

export function chapterOf(n) {
  const i = Math.floor((n - 1) / LEVELS_PER_CHAPTER);
  const theme = CHAPTER_THEMES[i % CHAPTER_THEMES.length];
  return {
    index: i,
    name: theme.name + ROMAN[Math.floor(i / CHAPTER_THEMES.length) + 1],
    color: theme.color, glow: theme.glow, deco: theme.deco,
    line: CHAPTER_LINES[i % CHAPTER_LINES.length],
    first: i * LEVELS_PER_CHAPTER + 1,
    starsNeeded: i * STARS_PER_CHAPTER,
  };
}

const is = (n, m) => n >= MECHANICS[m].from;

export function levelConfig(n) {
  const hard = n % 10 === 9;
  const easy = n % 10 === 1 && n > 1;
  const intro = Object.keys(MECHANICS).find(m => MECHANICS[m].from === n) || null;
  const mystery = is(n, 'mystery') && (n % 4 === 0 || intro === 'mystery' || (hard && n >= 49));
  const lock = is(n, 'lock') && (n % 3 === 1 || intro === 'lock') ? (n >= 140 ? 2 : 1) : 0;
  const ice = is(n, 'ice') && (n % 3 === 2 || intro === 'ice') ? (n >= 160 ? 2 : 1) : 0;
  const big = is(n, 'big') && (n % 5 === 0 || intro === 'big');
  const label = is(n, 'label') && (n % 4 === 2 || intro === 'label') ? 1 : 0;
  const funnel = is(n, 'funnel') && (n % 4 === 3 || intro === 'funnel') ? 1 : 0;

  let colors = Math.min(12, 3 + Math.floor(n / 8));
  if (hard) colors = Math.min(12, colors + 1);
  if (easy) colors = Math.max(3, colors - 1);
  if (intro) colors = Math.max(4, colors - 3); // a mecânica nova aparece num nível mais calmo
  if (big) colors = Math.max(4, colors - 2);
  const empty = 2 + label + funnel; // rótulos e funis ocupam frascos vazios
  return { hard, easy, intro, mystery, colors, cap: big ? 5 : 4, empty, locks: lock, ice, labels: label, funnels: funnel };
}

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Nível 1 (tutorial): resolve-se em 3 jogadas.
const TUTORIAL = { tubes: [[1, 0, 0, 0], [0, 1, 1, 1], []], par: 3 };

const cache = new Map();

export function getLevel(n) {
  if (cache.has(n)) return cache.get(n);
  const cfg = levelConfig(n);
  const chapter = chapterOf(n);
  let state, par;
  if (n === 1) {
    state = newState({ tubes: TUTORIAL.tubes });
    par = TUTORIAL.par;
  } else {
    ({ state, par } = generate(cfg, mulberry32(n * 7919 + 17)));
  }
  // Mistério: tudo escondido exceto a camada de cima.
  const hidden = state.tubes.map(t => t.map((_, i) => cfg.mystery && i < t.length - 1));
  const level = { n, ...cfg, mechanics: mechanicsOf(cfg), chapter, state, par, hidden, tutorial: n === 1, special: n % LEVELS_PER_CHAPTER === 0 };
  cache.set(n, level);
  return level;
}

// Mecânicas usadas num nível (para a Lúmen as explicar na primeira vez).
function mechanicsOf(cfg) {
  return [cfg.mystery && 'mystery', cfg.locks && 'lock', cfg.ice && 'ice', cfg.cap === 5 && 'big', cfg.labels && 'label', cfg.funnels && 'funnel'].filter(Boolean);
}

// Desafio diário: o mesmo nível para toda a gente nesse dia.
// Segunda é o dia mais fácil e domingo o mais difícil; cada dia tem a sua mecânica.
const DAILY_WEEK = [
  { colors: 6 },
  { colors: 7, mystery: true },
  { colors: 7, locks: 1 },
  { colors: 8, ice: 1 },
  { colors: 9, labels: 1 },
  { colors: 8, cap: 5 },
  { colors: 10, mystery: true, locks: 1, funnels: 1 },
];
export const DAILY_THEME = { name: 'Desafio diário', color: '#1e3a5f', glow: '#7cc4fa', deco: ['🌙', '⭐', '🔮', '✨'] };

export function getDailyLevel(date) {
  const key = `daily:${date}`;
  if (cache.has(key)) return cache.get(key);
  const [y, m, d] = date.split('-').map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7; // 0 = segunda
  const w = DAILY_WEEK[dow];
  const cfg = {
    hard: dow === 6, easy: false, intro: null, mystery: !!w.mystery, colors: w.colors, cap: w.cap || 4,
    locks: w.locks || 0, ice: w.ice || 0, labels: w.labels || 0, funnels: w.funnels || 0,
  };
  cfg.empty = 2 + cfg.labels + cfg.funnels;
  const { state, par } = generate(cfg, mulberry32(hashString('potions-daily:' + date)));
  const hidden = state.tubes.map(t => t.map((_, i) => cfg.mystery && i < t.length - 1));
  const level = { n: null, daily: date, dow, ...cfg, mechanics: mechanicsOf(cfg), chapter: DAILY_THEME, state, par, hidden, tutorial: false, special: false };
  cache.set(key, level);
  return level;
}
