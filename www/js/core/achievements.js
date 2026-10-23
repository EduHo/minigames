// Conquistas de um jogo. Os valores vêm da função `source` do jogo
// e de contadores guardados aqui (ex.: maior combo).
import { load, save, today } from './store.js';
import { rewardText } from './economy.js';
import { toast } from './ui.js';
import { sfx } from './audio.js';

export function createAchievements(game, list, { wallet, source, legacyKey }) {
  const KEY = `${game}.achievements`;
  let state = load(KEY, null) || (legacyKey && load(legacyKey, null)) || { unlocked: {}, counters: {} };

  const stats = () => ({ ...source(), ...state.counters, coins: wallet.coins() });

  return {
    list() {
      const s = stats();
      return list.map(a => ({ ...a, value: Math.min(a.goal, s[a.stat] || 0), unlocked: state.unlocked[a.id] }));
    },
    bump(counter, n = 1) {
      state.counters[counter] = (state.counters[counter] || 0) + n;
      save(KEY, state);
    },
    setMax(counter, value) {
      if ((state.counters[counter] || 0) >= value) return;
      state.counters[counter] = value;
      save(KEY, state);
    },
    // Verifica e entrega conquistas novas, com aviso.
    check() {
      const s = stats();
      for (const a of list) {
        if (state.unlocked[a.id] || (s[a.stat] || 0) < a.goal) continue;
        state.unlocked[a.id] = today();
        save(KEY, state);
        wallet.reward(a.prize);
        sfx('unlock');
        toast(`<b>${a.icon} ${a.name}</b><br>Conquista desbloqueada · ${rewardText(a.prize)}`, 3500);
      }
    },
  };
}
