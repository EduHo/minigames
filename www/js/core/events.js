// Eventos sazonais: datas, tema e estilo de peças próprio.
import { today } from './store.js';

// O Ano Novo Chinês muda de data todos os anos.
const CNY = { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11' };

function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export const EVENT_LEVELS = 15;

export const EVENTS = [
  {
    id: 'halloween', name: 'Halloween', icon: '🎃', style: 'halloween', color: '#3b1d4a',
    particles: ['🍂', '🦇', '🍁'],
    range: y => [`${y}-10-20`, `${y}-11-03`],
  },
  {
    id: 'christmas', name: 'Natal', icon: '🎄', style: 'christmas', color: '#1e3a5f',
    particles: ['❄️', '❅', '✨'],
    range: y => [`${y}-12-01`, `${y + 1}-01-06`],
  },
  {
    id: 'cny', name: 'Ano Novo Chinês', icon: '🧧', style: 'cny', color: '#7f1d1d',
    particles: ['🏮', '🧧', '✨'],
    range: y => (CNY[y] ? [addDays(`${y}-${CNY[y]}`, -5), addDays(`${y}-${CNY[y]}`, 15)] : null),
  },
];

export function activeEvent(date = today()) {
  const year = Number(date.slice(0, 4));
  for (const ev of EVENTS) {
    for (const y of [year - 1, year]) {
      const r = ev.range(y);
      if (r && date >= r[0] && date <= r[1]) {
        const [ey, em, ed] = r[1].split('-').map(Number);
        const [ty, tm, td] = date.split('-').map(Number);
        const daysLeft = Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / 86400000);
        return { ...ev, season: `${ev.id}-${y}`, start: r[0], end: r[1], daysLeft };
      }
    }
  }
  return null;
}

// Partículas a cair no fundo do ecrã durante o evento.
export function eventParticles(root, ev) {
  if (!ev || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'event-particles';
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('span');
    p.textContent = ev.particles[i % ev.particles.length];
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${8 + Math.random() * 8}s`;
    p.style.animationDelay = `${-Math.random() * 12}s`;
    p.style.fontSize = `${12 + Math.random() * 14}px`;
    layer.appendChild(p);
  }
  root.prepend(layer);
}
