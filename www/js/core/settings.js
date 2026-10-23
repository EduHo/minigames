// Opções do jogador, partilhadas por todos os jogos.
import { load, save } from './store.js';

const KEY = 'app.settings';
const DEFAULTS = {
  sound: true,
  music: true,
  vibration: true,
  highlightFree: true,
  colorSymbols: false,
  flaskStyle: 'tube',
  reminders: false,
  tileStyle: 'classic',
};

let current = load(KEY, DEFAULTS);
const listeners = new Set();

export const settings = () => current;

export function setSetting(name, value) {
  current = { ...current, [name]: value };
  save(KEY, current);
  listeners.forEach(fn => fn(current, name));
}

export const onSettingsChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
