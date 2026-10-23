// Progresso da Casa na Serra: níveis, estrelas, estrelas por gastar na casa, divisões e desafio diário.
import { load, save, remove } from '../../core/store.js';
import { setResume } from '../../core/resume.js';

const KEY = 'casa.progress';
const DEFAULTS = {
  current: 1, stars: {},
  bank: 0,           // estrelas por gastar na casa
  room: 0,           // divisão que está a ser recuperada
  rooms: {},         // divisão -> { tarefa: estilo }
  seen: {},          // explicações já vistas
};

export const progress = () => load(KEY, DEFAULTS);
export const saveProgress = p => save(KEY, p);
export const update = fn => { const p = progress(); fn(p); saveProgress(p); return p; };
export const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0);

// Jogo a meio: target é o número do nível ou { date } do desafio diário.
const saveKey = t => `casa.save.${typeof t === 'number' ? t : `daily:${t.date}`}`;
export const loadSaved = t => load(saveKey(t), null);
export const storeSaved = (t, data) => { save(saveKey(t), data); setResume('casa', typeof t === 'number' ? { n: t } : { date: t.date }); };
export const clearSaved = t => { remove(saveKey(t)); setResume('casa', null); };

export const dailyState = () => load('casa.daily', { done: {}, trophies: [] });
export const saveDaily = d => save('casa.daily', d);
