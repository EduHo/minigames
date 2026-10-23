// Progresso do Azulejos: níveis, estrelas, baús, portões, história, toca, pinturas e desafio diário.
import { load, save, remove } from '../../core/store.js';
import { setResume } from '../../core/resume.js';
import { LEVELS_PER_PLACE, STARS_PER_PLACE, TOTAL_LEVELS } from './levels.js';

const KEY = 'azulejos.progress';
const DEFAULTS = {
  current: 1, stars: {}, chests: {}, gates: [0], villainWins: 0,
  seen: {},          // cenas e explicações já vistas
  rooms: {},         // divisão da toca -> padrão escolhido
  paintings: [],     // azulejos pintados pelo jogador
};

export const progress = () => load(KEY, DEFAULTS);
export const saveProgress = p => save(KEY, p);
export const update = fn => { const p = progress(); fn(p); saveProgress(p); return p; };

export const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0);
export const placeIdx = n => Math.floor((n - 1) / LEVELS_PER_PLACE);
// Um sítio abre quando o anterior está acabado e há estrelas suficientes.
export const gateReady = (p, c) => c === 0 || (p.current > c * LEVELS_PER_PLACE && totalStars(p) >= c * STARS_PER_PLACE);
export const placeOpen = (p, c) => c === 0 || p.gates.includes(c);
export const isPlayable = (p, n) => n <= Math.min(p.current, TOTAL_LEVELS) && placeOpen(p, placeIdx(n));
// Painel do sítio: uma peça por nível ganho nesse sítio.
export const panelPieces = (p, c) => {
  let k = 0;
  for (let n = c * LEVELS_PER_PLACE + 1; n <= (c + 1) * LEVELS_PER_PLACE; n++) if (p.stars[n]) k++;
  return k;
};
export const hasChest = n => n % 5 === 0 && n % LEVELS_PER_PLACE !== 0;
export const chestPrize = n => (n % 10 === 0 ? { coins: 60, hint: 1 } : { coins: 40, shuffle: n % 15 === 0 ? 1 : 0 });

// Jogo a meio: target é o número do nível ou { date } do desafio diário.
const saveKey = t => `azulejos.save.${typeof t === 'number' ? t : `daily:${t.date}`}`;
export const loadSaved = t => load(saveKey(t), null);
export const storeSaved = (t, data) => { save(saveKey(t), data); setResume('azulejos', typeof t === 'number' ? { n: t } : { date: t.date }); };
export const clearSaved = t => { remove(saveKey(t)); setResume('azulejos', null); };

export const dailyState = () => load('azulejos.daily', { done: {}, trophies: [] });
export const saveDaily = d => save('azulejos.daily', d);

export function achievementSource() {
  const p = progress();
  let panels = 0;
  for (let c = 0; c < 50; c++) if (panelPieces(p, c) === LEVELS_PER_PLACE) panels++;
  return {
    levels: Object.keys(p.stars).length,
    threeStars: Object.values(p.stars).filter(s => s === 3).length,
    panels,
    villainWins: p.villainWins || 0,
    rooms: Object.keys(p.rooms).length,
    paintings: p.paintings.length,
    dailyDone: Object.keys(dailyState().done).length,
    monthTrophies: dailyState().trophies.length,
  };
}
