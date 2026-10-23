// Progresso do Poções da Lúmen: níveis, estrelas, baús, portões e jogo a meio.
import { load, save, remove } from '../../core/store.js';
import { setResume } from '../../core/resume.js';
import { LEVELS_PER_CHAPTER, STARS_PER_CHAPTER, TOTAL_LEVELS } from './levels.js';

const KEY = 'potions.progress';

// current: o próximo nível por jogar; gates: capítulos cujo portão já foi aberto (para a animação).
export const progress = () => load(KEY, { current: 1, stars: {}, best: {}, chests: {}, gates: [0], mysteryWins: 0 });
export const saveProgress = p => save(KEY, p);

export const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0);
export const chapterIndex = n => Math.floor((n - 1) / LEVELS_PER_CHAPTER);

// Um capítulo abre quando o anterior está acabado e há estrelas suficientes.
export function chapterOpen(p, c) {
  if (c === 0) return true;
  return p.current > c * LEVELS_PER_CHAPTER && totalStars(p) >= c * STARS_PER_CHAPTER;
}

export function isPlayable(p, n) {
  return n <= Math.min(p.current, TOTAL_LEVELS) && chapterOpen(p, chapterIndex(n));
}

// Baús no caminho: a cada 5 níveis, exceto no fim do capítulo (aí há o portão).
export const hasChest = n => n % 5 === 0 && n % LEVELS_PER_CHAPTER !== 0;
export const chestPrize = n => (n % 10 === 0 ? { coins: 60, hint: 1 } : { coins: 40, flask: n % 15 === 0 ? 1 : 0 });

// Jogo a meio (um por nível ou por dia do desafio) e botão "Continuar" do menu principal.
// target: número do nível, ou { date } para o desafio diário.
const saveKey = target => `potions.save.${typeof target === 'number' ? target : `daily:${target.date}`}`;
export const loadSaved = target => load(saveKey(target), null);
export const storeSaved = (target, data) => {
  save(saveKey(target), data);
  setResume('potions', typeof target === 'number' ? { n: target } : { date: target.date });
};
export const clearSaved = target => { remove(saveKey(target)); setResume('potions', null); };

// Desafio diário: estrelas por dia e troféus de meses completos.
export const dailyState = () => load('potions.daily', { done: {}, trophies: [] });
export const saveDaily = d => save('potions.daily', d);

export function achievementSource() {
  const p = progress();
  const chapters = Math.ceil(TOTAL_LEVELS / LEVELS_PER_CHAPTER);
  let perfect = 0;
  for (let c = 0; c < chapters; c++) {
    let s = 0;
    for (let n = c * LEVELS_PER_CHAPTER + 1; n <= (c + 1) * LEVELS_PER_CHAPTER; n++) s += p.stars[n] || 0;
    if (s === LEVELS_PER_CHAPTER * 3) perfect++;
  }
  return {
    levels: Object.keys(p.stars).length,
    threeStars: Object.values(p.stars).filter(s => s === 3).length,
    chapters: p.gates.length - 1,
    perfectChapters: perfect,
    mysteryWins: p.mysteryWins || 0,
    dailyDone: Object.keys(dailyState().done).length,
    monthTrophies: dailyState().trophies.length,
  };
}
