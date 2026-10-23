// Carteira de um jogo: moedas e ajudas. Cada jogo tem a sua, separada das outras.
// Cada dia há ajudas grátis; depois gastam-se as guardadas e, por fim, compram-se com moedas.
import { load, save, today } from './store.js';

const ICONS = { hint: '💡', shuffle: '🔀', flask: '🧪', magnet: '🧲', slot: '➕', rocket: '🚀' };

export function rewardText(prize = {}) {
  return Object.entries(prize)
    .filter(([, n]) => n)
    .map(([k, n]) => (k === 'coins' ? `<span class="coin">●</span>${n}` : `${ICONS[k] || k}×${n}`))
    .join(' &nbsp; ');
}

// game: prefixo das chaves; items: { hint: { start, freePerDay, price }, ... }
export function createWallet(game, { coins = 100, items, owned = [], legacyKey } = {}) {
  const KEY = `${game}.wallet`;
  const defaults = { coins, freeDay: '', owned, free: {} };
  for (const [k, cfg] of Object.entries(items)) defaults[k] = cfg.start;

  let w = load(KEY, null) || (legacyKey && migrate(legacyKey)) || structuredClone(defaults);
  w = { ...structuredClone(defaults), ...w, free: { ...(w.free || {}) } };
  const listeners = new Set();

  // Carteira antiga do Mahjong (antes de os jogos estarem separados).
  function migrate(key) {
    const old = load(key, null);
    if (!old) return null;
    return { coins: old.coins, hint: old.hint, shuffle: old.shuffle, owned: old.owned, freeDay: '', free: {} };
  }

  function commit() {
    save(KEY, w);
    listeners.forEach(fn => fn(w));
  }

  function refreshFree() {
    if (w.freeDay === today()) return;
    w.freeDay = today();
    for (const [k, cfg] of Object.entries(items)) w.free[k] = cfg.freePerDay || 0;
    save(KEY, w);
  }

  const api = {
    prices: Object.fromEntries(Object.entries(items).map(([k, c]) => [k, c.price])),
    coins: () => w.coins,
    owns: id => w.owned.includes(id),
    onChange: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    available(kind) { refreshFree(); return (w.free[kind] || 0) + (w[kind] || 0); },
    freeLeft(kind) { refreshFree(); return w.free[kind] || 0; },
    // Usa uma ajuda grátis ou guardada. Devolve false se não houver.
    useItem(kind) {
      refreshFree();
      if (w.free[kind] > 0) w.free[kind]--;
      else if (w[kind] > 0) w[kind]--;
      else return false;
      commit();
      return true;
    },
    spend(amount) {
      if (w.coins < amount) return false;
      w.coins -= amount;
      commit();
      return true;
    },
    reward(prize = {}) {
      for (const [k, n] of Object.entries(prize)) {
        if (k === 'coins') w.coins += n;
        else w[k] = (w[k] || 0) + n;
      }
      commit();
    },
    unlock(id, price) {
      if (api.owns(id)) return true;
      if (!api.spend(price)) return false;
      w.owned = [...w.owned, id];
      commit();
      return true;
    },
    reset() { w = structuredClone(defaults); commit(); },
  };
  return api;
}
