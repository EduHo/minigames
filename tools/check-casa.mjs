// Verifica os níveis da Casa na Serra: cada um tem de se poder ganhar seguindo a ordem
// com que foi gerado (com todas as mecânicas), ter desenhos em múltiplos de 3 e caber no ecrã.
// Uso: npm run check:casa
import { getLevel, getDailyLevel, TOTAL_LEVELS } from '../www/js/games/casa/levels.js';
import { playsThrough } from '../www/js/games/casa/engine.js';

const t0 = Date.now();
let failed = 0, slow = { n: 0, ms: 0 };
const sizes = [], mech = {}, shapes = {};

function check(name, lv) {
  const errors = [];
  const counts = {};
  lv.tiles.forEach(t => { counts[t.face] = (counts[t.face] || 0) + 1; });
  if (Object.values(counts).some(v => v % 3)) errors.push('desenhos que não são múltiplos de 3');
  if (lv.tiles.some(t => !t.face)) errors.push('azulejo sem desenho');
  const w = (Math.max(...lv.tiles.map(t => t.x)) + 2) / 2, h = (Math.max(...lv.tiles.map(t => t.y)) + 2) / 2;
  if (w > 9 || h > 10.5) errors.push(`grande demais (${w}x${h})`);
  if (!playsThrough(lv)) errors.push('a ordem de solução falha');
  if (errors.length) { failed++; console.log(`${name}: ${errors.join(', ')}`); }
}

for (let n = 1; n <= TOTAL_LEVELS; n++) {
  const s = Date.now();
  const lv = getLevel(n);
  const ms = Date.now() - s;
  if (ms > slow.ms) slow = { n, ms };
  sizes.push(lv.tiles.length);
  shapes[lv.shape] = (shapes[lv.shape] || 0) + 1;
  Object.keys(lv.mech).forEach(k => { mech[k] = (mech[k] || 0) + 1; });
  check(`Nível ${n}`, lv);
}
const day = new Date(2026, 0, 1);
for (let i = 0; i < 730; i++, day.setDate(day.getDate() + 1)) {
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  check(`Diário ${key}`, getDailyLevel(key));
}
const avg = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
for (const [a, b] of [[1, 20], [21, 60], [61, 120], [121, 200], [201, 1000]]) {
  const s = sizes.slice(a - 1, b);
  console.log(`níveis ${a}-${b}: ${Math.min(...s)}-${Math.max(...s)} azulejos (média ${avg(s)})`);
}
console.log('Formas:', Object.entries(shapes).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log('Mecânicas:', Object.entries(mech).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log(`Mais lento a gerar: nível ${slow.n} (${slow.ms}ms)`);
console.log(`${TOTAL_LEVELS} níveis + 730 diários, ${failed} com erros, ${Date.now() - t0}ms`);
process.exit(failed ? 1 : 0);
