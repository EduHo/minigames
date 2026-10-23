// Verifica os desafios da Fornada: um robô joga cada um e tem de fazer o doce pedido
// dentro do limite de jogadas. Uso: npm run check:fornada
import { challenge, challengeState, dailyChallenge, TOTAL_LEVELS } from '../www/js/games/fornada/levels.js';
import { solve } from '../www/js/games/fornada/engine.js';

const t0 = Date.now();
let failed = 0, tight = 0;
function check(name, lv) {
  const used = solve(challengeState(lv), lv.goal, lv.moves, 10);
  if (used == null) { failed++; console.log(`${name}: o robô não conseguiu (${lv.N}x${lv.N}, ${lv.goal} em ${lv.moves} jogadas)`); return; }
  if (used > lv.moves * 0.85) tight++;
}
for (let n = 1; n <= TOTAL_LEVELS; n++) check(`Desafio ${n}`, challenge(n));
const day = new Date(2026, 0, 1);
for (let i = 0; i < 730; i++, day.setDate(day.getDate() + 1)) {
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  check(`Diário ${key}`, dailyChallenge(key));
}
console.log(`${TOTAL_LEVELS} desafios + 730 diários, ${failed} com erros, ${tight} apertados, ${Date.now() - t0}ms`);
process.exit(failed ? 1 : 0);
