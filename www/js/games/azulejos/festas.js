// Festas do Azulejos: mudam os desenhos do desafio diário, dão moedas a dobrar
// e enfeitam o mapa. Inspiradas nas festas portuguesas, mas nas Terras de Azulém.
import { today } from '../../core/store.js';

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher); o Carnaval é 47 dias antes.
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}
const iso = d => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

const FESTAS = [
  { id: 'arraial', name: 'Arraial de junho', icon: '🏮', range: y => [`${y}-06-01`, `${y}-06-30`],
    faces: ['balao', 'manjerico', 'sardinha', 'guitarra', 'coracao', 'sol', 'estrela', 'limao', 'flor', 'sino', 'andorinha', 'uvas'], particles: ['🏮', '✨'] },
  { id: 'carnaval', name: 'Carnaval', icon: '🎭', range: y => { const t = addDays(easter(y), -47); return [iso(addDays(t, -5)), iso(addDays(t, 1))]; },
    faces: ['balao', 'estrela', 'coracao', 'flor', 'sol', 'lua', 'sino', 'guitarra', 'concha', 'limao', 'caravela', 'manjerico'], particles: ['🎊', '✨'] },
  { id: 'natal', name: 'Natal', icon: '🎄', range: y => [`${y}-12-01`, `${y + 1}-01-06`],
    faces: ['estrela', 'sino', 'floco', 'coracao', 'lua', 'bolota', 'folha', 'cogumelo', 'livro', 'chave', 'andorinha', 'sol'], particles: ['❄️', '✨'] },
];

export function activeFesta(date = today()) {
  const year = Number(date.slice(0, 4));
  for (const f of FESTAS) for (const y of [year - 1, year]) {
    const [a, b] = f.range(y);
    if (date >= a && date <= b) return f;
  }
  return null;
}
