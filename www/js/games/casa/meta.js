// Moedas, prémio diário, conquistas e estatísticas da Casa na Serra (separados dos outros jogos).
import { createWallet } from '../../core/economy.js';
import { createDailyReward } from '../../core/daily-reward.js';
import { createAchievements } from '../../core/achievements.js';
import { createAnalytics } from '../../core/analytics.js';
import { progress, totalStars, dailyState } from './progress.js';
import { ROOMS } from './rooms.js';

export const wallet = createWallet('casa', {
  coins: 100,
  items: {
    magnet: { start: 2, freePerDay: 1, price: 40 },
    shuffle: { start: 2, freePerDay: 1, price: 30 },
    slot: { start: 1, freePerDay: 0, price: 60 },
  },
  owned: [],
});

export const dailyReward = createDailyReward('casa', wallet, [
  { coins: 20 },
  { coins: 30 },
  { coins: 40, shuffle: 1 },
  { coins: 50 },
  { coins: 60, magnet: 1 },
  { coins: 80 },
  { coins: 150, magnet: 2, slot: 1 },
]);

const roomsDone = () => {
  const p = progress();
  return ROOMS.filter((r, i) => r.tasks.every(t => p.rooms[i]?.[t.id])).length;
};

const ACHIEVEMENTS = [
  { id: 'first', icon: '🏡', name: 'Primeira cúpula', desc: 'Completa o primeiro nível', goal: 1, stat: 'levels', prize: { coins: 20 } },
  { id: 'lv20', icon: '🔥', name: 'Lareira acesa', desc: 'Completa 20 níveis', goal: 20, stat: 'levels', prize: { coins: 80 } },
  { id: 'lv100', icon: '🏔️', name: 'Meia serra', desc: 'Completa 100 níveis', goal: 100, stat: 'levels', prize: { coins: 250, magnet: 2 } },
  { id: 'lv200', icon: '🕰️', name: 'Torre do relógio', desc: 'Completa 200 níveis', goal: 200, stat: 'levels', prize: { coins: 600, slot: 2 } },
  { id: 'lv1000', icon: '👑', name: 'Dono da serra', desc: 'Completa os 1000 níveis', goal: 1000, stat: 'levels', prize: { coins: 2000 } },
  { id: 'room1', icon: '🛋️', name: 'Primeira divisão', desc: 'Acaba a sala da lareira', goal: 1, stat: 'rooms', prize: { coins: 100 } },
  { id: 'room5', icon: '🏠', name: 'Meia casa', desc: 'Acaba 5 divisões', goal: 5, stat: 'rooms', prize: { coins: 300, magnet: 2 } },
  { id: 'room10', icon: '🏰', name: 'Casa recuperada', desc: 'Acaba as 10 divisões', goal: 10, stat: 'rooms', prize: { coins: 800 } },
  { id: 'star50', icon: '⭐', name: 'Mãos firmes', desc: '3 estrelas em 50 níveis', goal: 50, stat: 'threeStars', prize: { coins: 200 } },
  { id: 'stars300', icon: '🌟', name: 'Céu estrelado', desc: 'Junta 300 estrelas', goal: 300, stat: 'stars', prize: { coins: 300 } },
  { id: 'trio5', icon: '✨', name: 'Cinco seguidos', desc: 'Faz 5 trios seguidos num nível', goal: 5, stat: 'maxCombo', prize: { coins: 80 } },
  { id: 'daily10', icon: '📅', name: 'Todos os dias', desc: 'Completa 10 desafios diários', goal: 10, stat: 'dailyDone', prize: { coins: 150 } },
  { id: 'streak', icon: '📆', name: 'Hábito', desc: 'Recebe o prémio diário 7 dias seguidos', goal: 7, stat: 'bestStreak', prize: { coins: 150, magnet: 1 } },
  { id: 'rich', icon: '💰', name: 'Mealheiro', desc: 'Junta 1000 moedas', goal: 1000, stat: 'coins', prize: { shuffle: 2, magnet: 2 } },
];

export const achievements = createAchievements('casa', ACHIEVEMENTS, {
  wallet,
  source: () => {
    const p = progress();
    return {
      levels: Object.keys(p.stars).length,
      threeStars: Object.values(p.stars).filter(s => s === 3).length,
      stars: totalStars(p),
      rooms: roomsDone(),
      dailyDone: Object.keys(dailyState().done).length,
      bestStreak: dailyReward.state().best || 0,
    };
  },
});

export const analytics = createAnalytics('casa');
