// Verifica os níveis do Poções da Lúmen: cada um tem solução (com todas as mecânicas),
// o número certo de camadas e cabe no ecrã. Uso: npm run check:potions
import { getLevel, getDailyLevel, TOTAL_LEVELS, MECHANICS } from '../www/js/games/potions/levels.js';
import { solve } from '../www/js/games/potions/engine.js';

const t0 = Date.now();
let failed = 0, slowest = { n: 0, ms: 0 };
const colorsCount = {}, mech = { mystery: 0, lock: 0, ice: 0, big: 0, label: 0, funnel: 0 };
for (let n = 1; n <= TOTAL_LEVELS; n++) {
  const s = Date.now();
  const lv = getLevel(n);
  const ms = Date.now() - s;
  if (ms > slowest.ms) slowest = { n, ms };
  const st = lv.state;
  const counts = {};
  st.tubes.flat().forEach(c => { counts[c] = (counts[c] || 0) + 1; });
  const errors = [];
  if (Object.values(counts).some(v => v !== st.cap)) errors.push('camadas erradas');
  if (st.tubes.length > 16) errors.push(`${st.tubes.length} frascos é demais para o ecrã`);
  if (!solve(st)) errors.push('sem solução');
  if (errors.length) { failed++; console.log(`Nível ${n}: ${errors.join(', ')}`); }
  colorsCount[lv.colors] = (colorsCount[lv.colors] || 0) + 1;
  if (lv.mystery) mech.mystery++;
  if (lv.locks) mech.lock++;
  if (lv.ice) mech.ice++;
  if (lv.cap === 5) mech.big++;
  if (lv.labels) mech.label++;
  if (lv.funnels) mech.funnel++;
}
// Desafios diários de dois anos
let dailyFailed = 0, dailySlowest = 0;
const day = new Date(2026, 0, 1);
for (let i = 0; i < 730; i++, day.setDate(day.getDate() + 1)) {
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const s = Date.now();
  const lv = getDailyLevel(key);
  dailySlowest = Math.max(dailySlowest, Date.now() - s);
  if (lv.state.tubes.length > 16 || !solve(lv.state)) { dailyFailed++; console.log(`Diário ${key}: sem solução ou frascos a mais`); }
}
failed += dailyFailed;
console.log(`Desafios diários: 730 dias, ${dailyFailed} com erros, o mais lento ${dailySlowest}ms`);
console.log('Cores:', Object.entries(colorsCount).map(([k, v]) => `${k}: ${v}`).join(' · '));
console.log('Mecânicas:', Object.entries(mech).map(([k, v]) => `${MECHANICS[k].icon} ${v}`).join(' · '));
console.log(`Mais lento a gerar: nível ${slowest.n} (${slowest.ms}ms)`);
console.log(`${TOTAL_LEVELS} níveis, ${failed} com erros, ${Date.now() - t0}ms`);
process.exit(failed ? 1 : 0);
