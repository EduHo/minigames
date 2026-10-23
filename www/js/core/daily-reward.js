// Prémio diário de um jogo, com sequência de dias: o 7.º dia seguido dá o prémio maior.
import { load, save, today, daysBetween } from './store.js';
import { rewardText } from './economy.js';
import { modal } from './ui.js';
import { sfx } from './audio.js';

export function createDailyReward(game, wallet, rewards, { legacyKey } = {}) {
  const KEY = `${game}.dailyReward`;
  const state = () => load(KEY, null) || (legacyKey && load(legacyKey, null)) || { last: '', streak: 0, best: 0 };

  function status() {
    const s = state();
    if (s.last === today()) return { available: false, streak: s.streak };
    const streak = s.last && daysBetween(s.last, today()) === 1 ? s.streak + 1 : 1;
    return { available: true, streak, day: (streak - 1) % rewards.length };
  }

  function claim() {
    const st = status();
    if (!st.available) return null;
    const prize = rewards[st.day];
    save(KEY, { last: today(), streak: st.streak, best: Math.max(state().best || 0, st.streak) });
    wallet.reward(prize);
    return prize;
  }

  // Mostra o diálogo do prémio diário (se houver). Devolve uma Promise.
  function show() {
    const st = status();
    if (!st.available) return Promise.resolve(false);
    return new Promise(resolve => {
      const days = rewards.map((r, i) => `
        <div class="reward-day ${i < st.day ? 'past' : ''} ${i === st.day ? 'now' : ''}">
          <small>Dia ${i + 1}</small>
          <span>${i === rewards.length - 1 ? '🎁' : r.hint ? '💡' : r.magnet ? '🧲' : r.rocket ? '🚀' : r.shuffle ? '🔀' : r.flask ? '🧪' : r.slot ? '➕' : '●'}</span>
          <b>${r.coins}</b>
        </div>`).join('');
      modal(
        `<div class="dialog-emoji">📆</div>
         <h3>Prémio diário</h3>
         <p>${st.streak > 1 ? `Sequência de <b>${st.streak} dias</b>! Volta amanhã para continuar.` : 'Volta todos os dias: o prémio aumenta.'}</p>
         <div class="reward-days">${days}</div>`,
        [{ label: `Receber ${rewardText(rewards[st.day])}`, run: () => { claim(); sfx('coin'); resolve(true); } }],
      );
    });
  }

  return { state, status, show };
}
