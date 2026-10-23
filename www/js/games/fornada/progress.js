// Progresso da Fornada: recordes do clássico, desafios, receitas feitas e desafio diário.
import { load, save, remove } from '../../core/store.js';
import { setResume } from '../../core/resume.js';

const KEY = 'fornada.progress';
const DEFAULTS = { current: 1, stars: {}, best: { 3: 0, 4: 0, 5: 0, 6: 0 }, bestTile: { 3: 0, 4: 0, 5: 0, 6: 0 }, made: [2, 4], numbers: false, seen: {} };

export const progress = () => { const p = load(KEY, DEFAULTS); return { ...DEFAULTS, ...p, best: { ...DEFAULTS.best, ...p.best }, bestTile: { ...DEFAULTS.bestTile, ...p.bestTile } }; };
export const update = fn => { const p = progress(); fn(p); save(KEY, p); return p; };
export const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0);

// Jogo a meio. target: { classic: N } | número do desafio | { date }
export const targetKey = t => (typeof t === 'number' ? `${t}` : t.classic ? `c${t.classic}` : `daily:${t.date}`);
export const loadSaved = t => load(`fornada.save.${targetKey(t)}`, null);
export const storeSaved = (t, data) => {
  save(`fornada.save.${targetKey(t)}`, data);
  setResume('fornada', typeof t === 'number' ? { n: t } : t.classic ? { classic: t.classic } : { date: t.date });
};
export const clearSaved = t => { remove(`fornada.save.${targetKey(t)}`); setResume('fornada', null); };

export const dailyState = () => load('fornada.daily', { done: {}, trophies: [] });
export const saveDaily = d => save('fornada.daily', d);
