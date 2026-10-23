// Moedas, prémio diário, conquistas e estatísticas do Azulejos (separados dos outros jogos).
import { createWallet } from '../../core/economy.js';
import { createDailyReward } from '../../core/daily-reward.js';
import { createAchievements } from '../../core/achievements.js';
import { createAnalytics } from '../../core/analytics.js';
import { achievementSource } from './progress.js';

export const wallet = createWallet('azulejos', {
  coins: 100,
  items: {
    hint: { start: 3, freePerDay: 2, price: 25 },
    shuffle: { start: 2, freePerDay: 1, price: 40 },
    rocket: { start: 2, freePerDay: 0, price: 60 },
  },
  owned: [],
});

export const dailyReward = createDailyReward('azulejos', wallet, [
  { coins: 20 },
  { coins: 30 },
  { coins: 40, hint: 1 },
  { coins: 50 },
  { coins: 60, shuffle: 1 },
  { coins: 80 },
  { coins: 150, hint: 2, rocket: 1 },
]);

const ACHIEVEMENTS = [
  { id: 'first', icon: '🦊', name: 'Primeiro azulejo', desc: 'Completa o primeiro nível', goal: 1, stat: 'levels', prize: { coins: 20 } },
  { id: 'lv20', icon: '🚋', name: 'Ribeira restaurada', desc: 'Completa 20 níveis', goal: 20, stat: 'levels', prize: { coins: 80 } },
  { id: 'lv100', icon: '🏰', name: 'Meio caminho', desc: 'Completa 100 níveis', goal: 100, stat: 'levels', prize: { coins: 250, hint: 3 } },
  { id: 'lv200', icon: '🦎', name: 'As cores voltaram', desc: 'Completa a primeira viagem (200 níveis)', goal: 200, stat: 'levels', prize: { coins: 600, rocket: 3 } },
  { id: 'lv1000', icon: '👑', name: 'Mestre azulejista', desc: 'Completa os 1000 níveis', goal: 1000, stat: 'levels', prize: { coins: 2000 } },
  { id: 'panels3', icon: '🖼️', name: 'Restauradora', desc: 'Restaura 3 painéis', goal: 3, stat: 'panels', prize: { coins: 150 } },
  { id: 'star50', icon: '⭐', name: 'Mãos de artista', desc: '3 estrelas em 50 níveis', goal: 50, stat: 'threeStars', prize: { coins: 200 } },
  { id: 'combo4', icon: '⚡', name: 'Pares em cadeia', desc: 'Faz um combo x4: quatro pares seguidos do mesmo desenho', goal: 4, stat: 'maxCombo', prize: { coins: 80 } },
  { id: 'villain5', icon: '🎨', name: 'Contra o cinzento', desc: 'Vence 5 níveis do Cinzento', goal: 5, stat: 'villainWins', prize: { coins: 200, hint: 2 } },
  { id: 'rooms5', icon: '🏠', name: 'Toca bonita', desc: 'Decora 5 divisões da toca da Avó Rosa', goal: 5, stat: 'rooms', prize: { coins: 150 } },
  { id: 'paint5', icon: '🖌️', name: 'Pintora', desc: 'Pinta 5 azulejos teus', goal: 5, stat: 'paintings', prize: { coins: 100 } },
  { id: 'daily10', icon: '📅', name: 'Todos os dias', desc: 'Completa 10 desafios diários', goal: 10, stat: 'dailyDone', prize: { coins: 150 } },
  { id: 'month', icon: '🥇', name: 'Mês completo', desc: 'Ganha um troféu mensal', goal: 1, stat: 'monthTrophies', prize: { coins: 300, rocket: 2 } },
  { id: 'streak', icon: '📆', name: 'Hábito', desc: 'Recebe o prémio diário 7 dias seguidos', goal: 7, stat: 'bestStreak', prize: { coins: 150, hint: 2 } },
  { id: 'rich', icon: '💰', name: 'Mealheiro', desc: 'Junta 1000 moedas', goal: 1000, stat: 'coins', prize: { hint: 3, shuffle: 2 } },
];

export const achievements = createAchievements('azulejos', ACHIEVEMENTS, {
  wallet,
  source: () => ({ ...achievementSource(), bestStreak: dailyReward.state().best || 0 }),
});

export const analytics = createAnalytics('azulejos');
