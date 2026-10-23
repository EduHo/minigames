// Moedas, prémio diário, conquistas e estatísticas da Letras Soltas (separados dos outros jogos).
import { createWallet } from '../../core/economy.js';
import { createDailyReward } from '../../core/daily-reward.js';
import { createAchievements } from '../../core/achievements.js';
import { createAnalytics } from '../../core/analytics.js';
import { progress, totalStars, dailyState } from './progress.js';

export const wallet = createWallet('letras', {
  coins: 100,
  items: {
    hint: { start: 3, freePerDay: 2, price: 20 },
    reveal: { start: 1, freePerDay: 0, price: 60 },
  },
  owned: [],
});

export const dailyReward = createDailyReward('letras', wallet, [
  { coins: 20 }, { coins: 30 }, { coins: 40, hint: 1 }, { coins: 50 }, { coins: 60, hint: 2 }, { coins: 80 }, { coins: 150, hint: 3, reveal: 1 },
]);

const ACHIEVEMENTS = [
  { id: 'first', icon: '🔤', name: 'Primeira palavra', desc: 'Completa o primeiro nível com tema', goal: 1, stat: 'tema', prize: { coins: 20 } },
  { id: 'tema20', icon: '🏷️', name: 'Todos os temas', desc: 'Completa 20 níveis com tema', goal: 20, stat: 'tema', prize: { coins: 100 } },
  { id: 'tema100', icon: '📚', name: 'Leitor', desc: 'Completa 100 níveis com tema', goal: 100, stat: 'tema', prize: { coins: 300, reveal: 2 } },
  { id: 'tema300', icon: '🎓', name: 'Dicionário vivo', desc: 'Completa os 300 níveis com tema', goal: 300, stat: 'tema', prize: { coins: 1000 } },
  { id: 'free10', icon: '🧩', name: 'Sem tema', desc: 'Completa 10 grelhas livres', goal: 10, stat: 'free', prize: { coins: 100 } },
  { id: 'free50', icon: '🔠', name: 'Caçador de palavras', desc: 'Completa 50 grelhas livres', goal: 50, stat: 'free', prize: { coins: 300 } },
  { id: 'words500', icon: '✍️', name: 'Quinhentas', desc: 'Encontra 500 palavras', goal: 500, stat: 'words', prize: { coins: 150 } },
  { id: 'words5000', icon: '📖', name: 'Cinco mil', desc: 'Encontra 5000 palavras', goal: 5000, stat: 'words', prize: { coins: 800 } },
  { id: 'long8', icon: '📏', name: 'Palavrão... de 8 letras', desc: 'Encontra uma palavra de 8 letras', goal: 8, stat: 'longest', prize: { coins: 100 } },
  { id: 'bonus30', icon: '⏱️', name: 'Relâmpago', desc: '30 palavras numa ronda bónus', goal: 30, stat: 'bonusBest', prize: { coins: 200 } },
  { id: 'stars150', icon: '⭐', name: 'Cento e cinquenta', desc: 'Junta 150 estrelas', goal: 150, stat: 'stars', prize: { coins: 250 } },
  { id: 'daily10', icon: '📅', name: 'Todos os dias', desc: 'Completa 10 desafios diários', goal: 10, stat: 'dailyDone', prize: { coins: 150 } },
  { id: 'streak', icon: '📆', name: 'Hábito', desc: 'Recebe o prémio diário 7 dias seguidos', goal: 7, stat: 'bestStreak', prize: { coins: 150, hint: 3 } },
];

export const achievements = createAchievements('letras', ACHIEVEMENTS, {
  wallet,
  source: () => {
    const p = progress();
    return {
      tema: Object.keys(p.stars).length, free: Object.keys(p.freeStars).length, words: p.wordsFound,
      longest: p.longest.length, bonusBest: p.bonusBest, stars: totalStars(p),
      dailyDone: Object.keys(dailyState().done).length, bestStreak: dailyReward.state().best || 0,
    };
  },
});
export const analytics = createAnalytics('letras');
