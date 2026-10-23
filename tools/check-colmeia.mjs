// Verifica os níveis da Colmeia: um robô joga cada nível e tem de cumprir os objetivos
// dentro das jogadas. Uso: npm run check:colmeia
import { getLevel, dailyLevel, TOTAL_LEVELS } from '../www/js/games/colmeia/levels.js';
import { solve } from '../www/js/games/colmeia/engine.js';

const t0 = Date.now();
let failed = 0, tight = 0;
const slack = [];
function check(name, lv) {
  const used = solve(lv);
  if (used == null) { failed++; console.log(`${name}: o robô não conseguiu (${lv.goals.map(g => `${g.k}${g.v || g.n}`).join('+')} em ${lv.moves} jogadas)`); return; }
  slack.push(lv.moves - used);
  if (used > lv.moves * 0.85) tight++;
}
for (let n = 1; n <= TOTAL_LEVELS; n++) check(`Nível ${n}`, getLevel(n));
const day = new Date(2026, 0, 1);
for (let i = 0; i < 730; i++, day.setDate(day.getDate() + 1)) {
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  check(`Diário ${key}`, dailyLevel(key));
}
slack.sort((a, b) => a - b);
console.log(`folga de jogadas: mínima ${slack[0]}, mediana ${slack[slack.length >> 1]}`);
console.log(`${TOTAL_LEVELS} níveis + 730 diários, ${failed} com erros, ${tight} apertados, ${Date.now() - t0}ms`);
process.exit(failed ? 1 : 0);
