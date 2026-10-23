// Dicas de primeira vez: tutorial, balões a apontar para botões, explicação de peças novas.
import { load, save } from '../../core/store.js';
import { modal } from '../../core/ui.js';

const KEY = 'app.coach';
let seen = load(KEY, {});

export const hasSeen = k => !!seen[k];
export function markSeen(k) { seen = { ...seen, [k]: 1 }; save(KEY, seen); }
export function resetCoach() { seen = {}; save(KEY, seen); }

export { bubble, hand } from '../../core/ui.js';

const MECHANICS = {
  lock: {
    icon: '🔒',
    title: 'Peças trancadas',
    text: 'O número mostra quantos pares tens de fazer até a peça abrir. Depois disso joga-se como as outras.',
  },
  bomb: {
    icon: '💣',
    title: 'Bombas',
    text: 'Tira a peça com bomba antes de o contador chegar a 0. Cada par que fazes desconta 1.',
  },
};

export function mechanicIntro(kind) {
  const key = 'mech-' + kind;
  if (hasSeen(key)) return Promise.resolve();
  markSeen(key);
  const m = MECHANICS[kind];
  return new Promise(resolve => {
    modal(`<div class="dialog-emoji">${m.icon}</div><h3>${m.title}</h3><p>${m.text}</p>`, [{ label: 'Percebi', run: resolve }]);
  });
}
