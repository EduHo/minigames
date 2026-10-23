// Moedas, prémio diário, conquistas e estatísticas da Colmeia (separados dos outros jogos).
import { createWallet } from '../../core/economy.js';
import { createDailyReward } from '../../core/daily-reward.js';
import { createAchievements } from '../../core/achievements.js';
import { createAnalytics } from '../../core/analytics.js';
import { progress, totalStars, dailyState } from './progress.js';

export const wallet = createWallet('colmeia', {
  coins: 100,
  items: {
    hammer: { start: 3, freePerDay: 1, price: 30 },
    swap: { start: 3, freePerDay: 1, price: 30 },
    shuffle: { start: 2, freePerDay: 0, price: 40 },
  },
  owned: [],
});

export const dailyReward = createDailyReward('colmeia', wallet, [
  { coins: 20 }, { coins: 30 }, { coins: 40, hammer: 1 }, { coins: 50 }, { coins: 60, swap: 1 }, { coins: 80 }, { coins: 150, hammer: 2, shuffle: 1 },
]);

const ACHIEVEMENTS = [
  { id: 'first', icon: '🐝', name: 'Primeiro voo', desc: 'Completa o primeiro nível', goal: 1, stat: 'levels', prize: { coins: 20 } },
  { id: 'lv30', icon: '🌼', name: 'Prado das flores', desc: 'Completa 30 níveis', goal: 30, stat: 'levels', prize: { coins: 100 } },
  { id: 'lv150', icon: '🍯', name: 'Meio prado', desc: 'Completa 150 níveis', goal: 150, stat: 'levels', prize: { coins: 300, hammer: 3 } },
  { id: 'lv300', icon: '👑', name: 'Abelha rainha', desc: 'Completa os 300 níveis', goal: 300, stat: 'levels', prize: { coins: 1000 } },
  { id: 'star100', icon: '⭐', name: 'Cem estrelas', desc: 'Junta 100 estrelas', goal: 100, stat: 'stars', prize: { coins: 150 } },
  { id: 'three50', icon: '🌟', name: 'Perfeição', desc: '3 estrelas em 50 níveis', goal: 50, stat: 'threeStars', prize: { coins: 250 } },
  { id: 'chain9', icon: '🏵️', name: 'Colmeia de ouro', desc: 'Faz um caminho de 9 peças', goal: 9, stat: 'maxChain', prize: { coins: 100 } },
  { id: 'big1024', icon: '🔶', name: 'Mil e vinte e quatro', desc: 'Faz um 1024', goal: 1024, stat: 'maxTile', prize: { coins: 120 } },
  { id: 'big4096', icon: '💎', name: 'Quatro mil', desc: 'Faz um 4096', goal: 4096, stat: 'maxTile', prize: { coins: 400 } },
  { id: 'daily10', icon: '📅', name: 'Todos os dias', desc: 'Completa 10 desafios diários', goal: 10, stat: 'dailyDone', prize: { coins: 150 } },
  { id: 'streak', icon: '📆', name: 'Hábito', desc: 'Recebe o prémio diário 7 dias seguidos', goal: 7, stat: 'bestStreak', prize: { coins: 150, swap: 2 } },
  { id: 'rich', icon: '💰', name: 'Mealheiro', desc: 'Junta 1000 moedas', goal: 1000, stat: 'coins', prize: { hammer: 3, swap: 3 } },
];

export const achievements = createAchievements('colmeia', ACHIEVEMENTS, {
  wallet,
  source: () => {
    const p = progress();
    return {
      levels: Object.keys(p.stars).length,
      stars: totalStars(p),
      threeStars: Object.values(p.stars).filter(s => s === 3).length,
      dailyDone: Object.keys(dailyState().done).length,
      bestStreak: dailyReward.state().best || 0,
    };
  },
});
export const analytics = createAnalytics('colmeia');
