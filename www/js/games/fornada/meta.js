// Moedas, prémio diário, conquistas e estatísticas da Fornada (separados dos outros jogos).
import { createWallet } from '../../core/economy.js';
import { createDailyReward } from '../../core/daily-reward.js';
import { createAchievements } from '../../core/achievements.js';
import { createAnalytics } from '../../core/analytics.js';
import { progress, totalStars, dailyState } from './progress.js';
import { SWEETS } from './art.js';

export const wallet = createWallet('fornada', {
  coins: 100,
  items: {
    undo: { start: 5, freePerDay: 5, price: 15 },
    moves: { start: 1, freePerDay: 0, price: 40 },
  },
  owned: [],
});

export const dailyReward = createDailyReward('fornada', wallet, [
  { coins: 20 }, { coins: 30 }, { coins: 40, undo: 2 }, { coins: 50 }, { coins: 60, moves: 1 }, { coins: 80 }, { coins: 150, undo: 5, moves: 1 },
]);

const ACHIEVEMENTS = [
  { id: 'nata', icon: '🥧', name: 'Primeiro pastel de nata', desc: 'Faz um pastel de nata (16)', goal: 16, stat: 'maxTile', prize: { coins: 20 } },
  { id: 'arroz', icon: '🧁', name: 'Bolo de arroz', desc: 'Faz um bolo de arroz (256)', goal: 256, stat: 'maxTile', prize: { coins: 60 } },
  { id: 'paodelo', icon: '🍰', name: 'Pão de ló', desc: 'Faz um pão de ló (1024)', goal: 1024, stat: 'maxTile', prize: { coins: 150 } },
  { id: 'rei', icon: '👑', name: 'Bolo-rei!', desc: 'Faz um bolo-rei (2048)', goal: 2048, stat: 'maxTile', prize: { coins: 400, undo: 10 } },
  { id: 'noiva', icon: '💍', name: 'Bolo de noiva', desc: 'Faz um bolo de noiva (4096)', goal: 4096, stat: 'maxTile', prize: { coins: 800 } },
  { id: 'ch10', icon: '🔥', name: 'Forno quente', desc: 'Completa 10 desafios', goal: 10, stat: 'challenges', prize: { coins: 80 } },
  { id: 'ch100', icon: '🥣', name: 'Pasteleiro', desc: 'Completa 100 desafios', goal: 100, stat: 'challenges', prize: { coins: 300, moves: 3 } },
  { id: 'ch300', icon: '🎂', name: 'Mestre pasteleiro', desc: 'Completa os 300 desafios', goal: 300, stat: 'challenges', prize: { coins: 1000 } },
  { id: 'stars100', icon: '⭐', name: 'Cem estrelas', desc: 'Junta 100 estrelas nos desafios', goal: 100, stat: 'stars', prize: { coins: 200 } },
  { id: 'book', icon: '📖', name: 'Livro completo', desc: `Faz as ${SWEETS.length} receitas`, goal: SWEETS.length, stat: 'recipes', prize: { coins: 1000 } },
  { id: 'score', icon: '🏅', name: '20 000 pontos', desc: 'Faz 20 000 pontos num jogo clássico', goal: 20000, stat: 'bestScore', prize: { coins: 200 } },
  { id: 'daily10', icon: '📅', name: 'Todos os dias', desc: 'Completa 10 desafios diários', goal: 10, stat: 'dailyDone', prize: { coins: 150 } },
  { id: 'streak', icon: '📆', name: 'Hábito', desc: 'Recebe o prémio diário 7 dias seguidos', goal: 7, stat: 'bestStreak', prize: { coins: 150, undo: 5 } },
];

export const achievements = createAchievements('fornada', ACHIEVEMENTS, {
  wallet,
  source: () => {
    const p = progress();
    return {
      maxTile: Math.max(...p.made),
      challenges: Object.keys(p.stars).length,
      stars: totalStars(p),
      recipes: p.made.length,
      bestScore: Math.max(...Object.values(p.best)),
      dailyDone: Object.keys(dailyState().done).length,
      bestStreak: dailyReward.state().best || 0,
    };
  },
});

export const analytics = createAnalytics('fornada');
