// Verifica todos os níveis: número par de peças, sem sobreposições,
// tamanho que cabe no ecrã e jogo resolúvel (também com cadeados e bombas).
// Inclui os desafios diários de um ano e os níveis de evento. Uso: npm run check
import { getLevel, getDailyLevel, getEventLevel, TOTAL_LEVELS } from '../www/js/games/mahjong/levels.js';
import { deal, findMoves, isSolvable } from '../www/js/games/mahjong/engine.js';
import { EVENTS, EVENT_LEVELS } from '../www/js/core/events.js';

let failed = 0;
const t0 = Date.now();

function check(name, lv) {
  const pos = lv.positions;
  const w = (Math.max(...pos.map(p => p.x)) + 2) / 2;
  const h = (Math.max(...pos.map(p => p.y)) + 2) / 2;
  const keys = new Set(pos.map(p => `${p.x},${p.y},${p.z}`));
  const errors = [];
  if (pos.length % 2) errors.push('ímpar');
  if (keys.size !== pos.length) errors.push('peças repetidas');
  if (pos.length > 144) errors.push('demasiadas peças');
  if (w > 7.5 || h > 8.5) errors.push(`grande demais ${w}x${h}`);
  try {
    const tiles = deal(pos, { locks: lv.locks || 0, bombs: lv.bombs || 0 });
    if (findMoves(tiles).length === 0) errors.push('sem jogadas no início');
    if ((lv.locks || lv.bombs) && !isSolvable(tiles, 500)) errors.push('cadeados/bombas sem solução encontrada');
  } catch (e) { errors.push(e.message); }
  if (errors.length) { failed++; console.log(`${name}: ${errors.join(', ')}`); }
  return pos.length;
}

const sizes = [];
let locks = 0, bombs = 0, hard = 0;
for (let n = 1; n <= TOTAL_LEVELS; n++) {
  const lv = getLevel(n);
  sizes.push(check(`Nível ${n}`, lv));
  if (lv.locks) locks++;
  if (lv.bombs) bombs++;
  if (lv.hard) hard++;
}

const d = new Date(2026, 0, 1);
for (let i = 0; i < 365; i++, d.setDate(d.getDate() + 1)) {
  const key = d.toISOString().slice(0, 10);
  check(`Diário ${key}`, getDailyLevel(key));
}
for (const ev of EVENTS) {
  for (let i = 0; i < EVENT_LEVELS; i++) check(`Evento ${ev.id} ${i + 1}`, getEventLevel(`${ev.id}-2026`, i, '#000'));
}

const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
for (const [a, b] of [[1, 10], [11, 40], [41, 80], [81, 120], [121, 1000]]) {
  const s = sizes.slice(a - 1, b);
  console.log(`níveis ${a}-${b}: ${Math.min(...s)}-${Math.max(...s)} peças (média ${avg(s)})`);
}
console.log(`${hard} difíceis, ${locks} com cadeados, ${bombs} com bombas`);
console.log(`${TOTAL_LEVELS} níveis + 365 diários + ${EVENTS.length * EVENT_LEVELS} de evento, ${failed} com erros, ${Date.now() - t0}ms`);
process.exit(failed ? 1 : 0);
