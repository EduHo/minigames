// Moedas, prémio diário, conquistas e estatísticas do Poções da Lúmen
// (separados dos outros jogos).
import { createWallet } from '../../core/economy.js';
import { createDailyReward } from '../../core/daily-reward.js';
import { createAchievements } from '../../core/achievements.js';
import { createAnalytics } from '../../core/analytics.js';
import { achievementSource } from './progress.js';

export const wallet = createWallet('potions', {
  coins: 100,
  items: { hint: { start: 3, freePerDay: 2, price: 25 }, flask: { start: 2, freePerDay: 1, price: 60 } },
  owned: ['tube'],
});

export const dailyReward = createDailyReward('potions', wallet, [
  { coins: 20 },
  { coins: 30 },
  { coins: 40, hint: 1 },
  { coins: 50 },
  { coins: 60, flask: 1 },
  { coins: 80 },
  { coins: 150, hint: 2, flask: 1 },
]);

const ACHIEVEMENTS = [
  { id: 'first', icon: '🧪', name: 'Primeira poção', desc: 'Completa o primeiro nível', goal: 1, stat: 'levels', prize: { coins: 20 } },
  { id: 'lv20', icon: '🕯️', name: 'Aprendiz de alquimia', desc: 'Completa 20 níveis', goal: 20, stat: 'levels', prize: { coins: 60 } },
  { id: 'lv100', icon: '🔮', name: 'Alquimista', desc: 'Completa 100 níveis', goal: 100, stat: 'levels', prize: { coins: 200, hint: 3 } },
  { id: 'lv300', icon: '🐉', name: 'Mestre das poções', desc: 'Completa 300 níveis', goal: 300, stat: 'levels', prize: { coins: 500, flask: 3 } },
  { id: 'lv1000', icon: '👑', name: 'Arquimaga', desc: 'Completa os 1000 níveis', goal: 1000, stat: 'levels', prize: { coins: 2000 } },
  { id: 'ch3', icon: '🚪', name: 'Viajante', desc: 'Abre 3 portões de capítulo', goal: 3, stat: 'chapters', prize: { coins: 100 } },
  { id: 'ch10', icon: '🗺️', name: 'Exploradora', desc: 'Abre 10 portões de capítulo', goal: 10, stat: 'chapters', prize: { coins: 300, flask: 2 } },
  { id: 'star25', icon: '⭐', name: 'Precisão', desc: '3 estrelas em 25 níveis', goal: 25, stat: 'threeStars', prize: { coins: 100 } },
  { id: 'star100', icon: '🌟', name: 'Perfeição alquímica', desc: '3 estrelas em 100 níveis', goal: 100, stat: 'threeStars', prize: { coins: 300 } },
  { id: 'chapter', icon: '🏆', name: 'Capítulo perfeito', desc: 'Junta as 60 estrelas de um capítulo', goal: 1, stat: 'perfectChapters', prize: { coins: 150 } },
  { id: 'mystery', icon: '❓', name: 'Detetive', desc: 'Ganha 25 níveis mistério', goal: 25, stat: 'mysteryWins', prize: { coins: 150, hint: 2 } },
  { id: 'noundo', icon: '🧠', name: 'Sem voltar atrás', desc: 'Ganha 20 níveis sem Desfazer nem ajudas', goal: 20, stat: 'cleanWins', prize: { coins: 200 } },
  { id: 'daily10', icon: '📅', name: 'Rotina mágica', desc: 'Completa 10 desafios diários', goal: 10, stat: 'dailyDone', prize: { coins: 150 } },
  { id: 'month', icon: '🥇', name: 'Mês completo', desc: 'Ganha um troféu mensal', goal: 1, stat: 'monthTrophies', prize: { coins: 300, flask: 2 } },
  { id: 'streak', icon: '📆', name: 'Hábito', desc: 'Recebe o prémio diário 7 dias seguidos', goal: 7, stat: 'bestStreak', prize: { coins: 150, flask: 1 } },
  { id: 'collector', icon: '⚗️', name: 'Colecionadora', desc: 'Desbloqueia todos os frascos', goal: 3, stat: 'styles', prize: { coins: 200 } },
  { id: 'rich', icon: '💰', name: 'Tesouro', desc: 'Junta 1000 moedas', goal: 1000, stat: 'coins', prize: { hint: 3, flask: 2 } },
];

export const achievements = createAchievements('potions', ACHIEVEMENTS, {
  wallet,
  source: () => ({
    ...achievementSource(),
    bestStreak: dailyReward.state().best || 0,
    styles: ['tube', 'round', 'jar'].filter(id => wallet.owns(id)).length,
  }),
});

export const analytics = createAnalytics('potions');
