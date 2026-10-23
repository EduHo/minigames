// Progresso da Colmeia: níveis, estrelas, portões, baús e desafio diário.
import { load, save, remove } from '../../core/store.js';
import { setResume } from '../../core/resume.js';
import { LEVELS_PER_ZONE, STARS_PER_ZONE, TOTAL_LEVELS } from './levels.js';

const KEY = 'colmeia.progress';
const DEFAULTS = { current: 1, stars: {}, chests: {}, gates: [0], seen: {} };
export const progress = () => ({ ...DEFAULTS, ...load(KEY, DEFAULTS) });
export const update = fn => { const p = progress(); fn(p); save(KEY, p); return p; };
export const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0);
export const zoneOf = n => Math.floor((n - 1) / LEVELS_PER_ZONE);
// Portão de uma zona: acabar a anterior e ter estrelas suficientes.
export const gateReady = (p, z) => z === 0 || (p.current > z * LEVELS_PER_ZONE && totalStars(p) >= z * STARS_PER_ZONE);
export const zoneOpen = (p, z) => z === 0 || p.gates.includes(z);
export const isPlayable = (p, n) => n <= Math.min(p.current, TOTAL_LEVELS) && zoneOpen(p, zoneOf(n));
export const hasChest = n => n % 6 === 0 && n % LEVELS_PER_ZONE !== 0;

const saveKey = t => `colmeia.save.${typeof t === 'number' ? t : `daily:${t.date}`}`;
export const loadSaved = t => load(saveKey(t), null);
export const storeSaved = (t, data) => { save(saveKey(t), data); setResume('colmeia', typeof t === 'number' ? { n: t } : { date: t.date }); };
export const clearSaved = t => { remove(saveKey(t)); setResume('colmeia', null); };
export const dailyState = () => load('colmeia.daily', { done: {}, trophies: [] });
export const saveDaily = d => save('colmeia.daily', d);
