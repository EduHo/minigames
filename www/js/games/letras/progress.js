// Progresso da Letras Soltas: níveis com tema, grelhas livres, ronda bónus e desafio diário.
import { load, save, remove } from '../../core/store.js';
import { setResume } from '../../core/resume.js';

const KEY = 'letras.progress';
const DEFAULTS = { tema: 1, free: 1, stars: {}, freeStars: {}, bonusPlayed: 0, bonusDay: '', bonusBest: 0, wordsFound: 0, longest: '', seen: {} };
export const progress = () => ({ ...DEFAULTS, ...load(KEY, DEFAULTS) });
export const update = fn => { const p = progress(); fn(p); save(KEY, p); return p; };
export const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0) + Object.values(p.freeStars).reduce((a, b) => a + b, 0);

// target: { kind: 'tema' | 'livre', n } | { date }
const keyOf = t => (t.date ? `daily:${t.date}` : `${t.kind}${t.n}`);
export const loadSaved = t => load(`letras.save.${keyOf(t)}`, null);
export const storeSaved = (t, data) => { save(`letras.save.${keyOf(t)}`, data); setResume('letras', t); };
export const clearSaved = t => { remove(`letras.save.${keyOf(t)}`); setResume('letras', null); };
export const dailyState = () => load('letras.daily', { done: {}, trophies: [] });
export const saveDaily = d => save('letras.daily', d);
