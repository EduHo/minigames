// Moedas, prémio diário, conquistas e estatísticas do Mahjong (separados dos outros jogos).
// As chaves "app.*" são de antes da separação e só servem para migrar o progresso antigo.
import { createWallet } from '../../core/economy.js';
import { createDailyReward } from '../../core/daily-reward.js';
import { createAchievements } from '../../core/achievements.js';
import { createAnalytics } from '../../core/analytics.js';
import { achievementSource } from './progress.js';

export const wallet = createWallet('mahjong', {
  coins: 100,
  items: { hint: { start: 3, freePerDay: 2, price: 20 }, shuffle: { start: 2, freePerDay: 1, price: 40 } },
  owned: ['classic', 'contrast'],
  legacyKey: 'app.wallet',
});

export const dailyReward = createDailyReward('mahjong', wallet, [
  { coins: 20 },
  { coins: 30 },
  { coins: 40, hint: 1 },
  { coins: 50 },
  { coins: 60, shuffle: 1 },
  { coins: 80 },
  { coins: 150, hint: 2, shuffle: 1 },
], { legacyKey: 'app.dailyReward' });

const ACHIEVEMENTS = [
  { id: 'first', icon: '🌱', name: 'Primeiros passos', desc: 'Completa o primeiro nível', goal: 1, stat: 'levels', prize: { coins: 20 } },
  { id: 'lv10', icon: '🎋', name: 'Aprendiz', desc: 'Completa 10 níveis', goal: 10, stat: 'levels', prize: { coins: 50 } },
  { id: 'lv50', icon: '🏮', name: 'Discípulo', desc: 'Completa 50 níveis', goal: 50, stat: 'levels', prize: { coins: 100, hint: 2 } },
  { id: 'lv100', icon: '🐉', name: 'Mestre', desc: 'Completa 100 níveis', goal: 100, stat: 'levels', prize: { coins: 200, hint: 3 } },
  { id: 'lv250', icon: '🏯', name: 'Grão-mestre', desc: 'Completa 250 níveis', goal: 250, stat: 'levels', prize: { coins: 400, shuffle: 3 } },
  { id: 'lv500', icon: '⛩️', name: 'Lenda', desc: 'Completa 500 níveis', goal: 500, stat: 'levels', prize: { coins: 800 } },
  { id: 'lv1000', icon: '👑', name: 'Imperador', desc: 'Completa os 1000 níveis', goal: 1000, stat: 'levels', prize: { coins: 2000 } },
  { id: 'star25', icon: '⭐', name: 'Perfeccionista', desc: '3 estrelas em 25 níveis', goal: 25, stat: 'threeStars', prize: { coins: 100 } },
  { id: 'star100', icon: '🌟', name: 'Estrela brilhante', desc: '3 estrelas em 100 níveis', goal: 100, stat: 'threeStars', prize: { coins: 300 } },
  { id: 'chapter', icon: '🏆', name: 'Capítulo perfeito', desc: 'Junta as 60 estrelas de um capítulo', goal: 1, stat: 'perfectChapters', prize: { coins: 150 } },
  { id: 'nohelp', icon: '🧠', name: 'Sem ajudas', desc: 'Ganha 50 níveis sem Ajuda nem Baralhar', goal: 50, stat: 'noHelpWins', prize: { coins: 200 } },
  { id: 'combo', icon: '⚡', name: 'Relâmpago', desc: 'Faz um combo x5', goal: 5, stat: 'maxCombo', prize: { coins: 50 } },
  { id: 'streak', icon: '📆', name: 'Hábito', desc: 'Recebe o prémio diário 7 dias seguidos', goal: 7, stat: 'bestStreak', prize: { coins: 150, hint: 2 } },
  { id: 'daily30', icon: '📅', name: 'Diário', desc: 'Completa 30 desafios diários', goal: 30, stat: 'dailyDone', prize: { coins: 300 } },
  { id: 'month', icon: '🥇', name: 'Mês completo', desc: 'Ganha um troféu mensal', goal: 1, stat: 'monthTrophies', prize: { coins: 300 } },
  { id: 'event', icon: '🎉', name: 'Festivo', desc: 'Completa todos os níveis de um evento', goal: 1, stat: 'eventsDone', prize: { coins: 250 } },
  { id: 'collector', icon: '🎨', name: 'Colecionador', desc: 'Desbloqueia 2 estilos de peças', goal: 2, stat: 'stylesBought', prize: { coins: 100 } },
  { id: 'rich', icon: '💰', name: 'Poupança', desc: 'Junta 1000 moedas', goal: 1000, stat: 'coins', prize: { hint: 3, shuffle: 2 } },
];

export const achievements = createAchievements('mahjong', ACHIEVEMENTS, {
  wallet,
  source: () => ({ ...achievementSource(wallet), bestStreak: dailyReward.state().best || 0 }),
  legacyKey: 'app.achievements',
});

export const analytics = createAnalytics('mahjong', { legacyKey: 'app.analytics' });
