// Progresso do Mahjong: níveis, desafio diário, eventos, baús e jogos a meio.
import { load, save, remove } from '../../core/store.js';
import { setResume } from '../../core/resume.js';
import { LEVELS_PER_CHAPTER, TOTAL_LEVELS } from './levels.js';
import { EVENT_LEVELS } from '../../core/events.js';

const KEYS = {
  progress: 'mahjong.progress.v2',
  daily: 'mahjong.daily',
  events: 'mahjong.events',
};

export const progress = () => load(KEYS.progress, { unlocked: 1, best: {}, stars: {}, chests: {} });
export const saveProgress = p => save(KEYS.progress, p);

export const dailyState = () => load(KEYS.daily, { done: {}, trophies: [] });
export const saveDaily = d => save(KEYS.daily, d);

export const eventsState = () => load(KEYS.events, {});
export const saveEvents = e => save(KEYS.events, e);

// Baús de capítulo: abrem ao juntar estrelas.
export const CHESTS = [
  { stars: 30, prize: { coins: 50, hint: 1 } },
  { stars: 60, prize: { coins: 150, hint: 2, shuffle: 1 } },
];

export function chapterStars(p, chapterIndex) {
  const first = chapterIndex * LEVELS_PER_CHAPTER + 1;
  let total = 0;
  for (let n = first; n < first + LEVELS_PER_CHAPTER; n++) total += p.stars[n] || 0;
  return total;
}

// Jogos a meio: um por modo (nível N, desafio do dia X, evento).
export const modeKey = mode =>
  mode.kind === 'level' ? `level:${mode.n}` : mode.kind === 'daily' ? `daily:${mode.date}` : `event:${mode.season}:${mode.i}`;
export const loadSaved = mode => load('mahjong.save.' + modeKey(mode), null);
export const storeSaved = (mode, data) => save('mahjong.save.' + modeKey(mode), data);
export const clearSaved = mode => remove('mahjong.save.' + modeKey(mode));

// Último jogo a meio (para o botão "Continuar" do menu principal).
export const setLastSaved = mode => setResume('mahjong', mode);

export function achievementSource(wallet) {
  const p = progress();
  const d = dailyState();
  const ev = eventsState();
  const chapters = Math.ceil(TOTAL_LEVELS / LEVELS_PER_CHAPTER);
  let perfect = 0;
  for (let c = 0; c < chapters; c++) if (chapterStars(p, c) === LEVELS_PER_CHAPTER * 3) perfect++;
  return {
    levels: Object.keys(p.stars).length,
    threeStars: Object.values(p.stars).filter(s => s === 3).length,
    perfectChapters: perfect,
    dailyDone: Object.keys(d.done).length,
    monthTrophies: d.trophies.length,
    eventsDone: Object.values(ev).filter(e => e.done >= EVENT_LEVELS).length,
    stylesBought: ['fruits', 'animals'].filter(id => wallet.owns(id)).length,
  };
}
