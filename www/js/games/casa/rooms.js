// As 10 divisões da casa, as tarefas de cada uma e os móveis (SVG, viewBox 400x300).
// Cada tarefa custa estrelas e tem três estilos; o desenho da divisão muda com o que já se fez.

const K = '#3b2a22';
const darker = (hex, k = 0.75) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
};

// ---------- Móveis: cada um recebe a cor do estilo e a posição ----------
const F = {
  fireplace: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="120" height="112" fill="${c}"/>${Array.from({ length: 6 }, (_, r) => Array.from({ length: 4 }, (_, k) => `<rect x="${(r % 2) * 15 + k * 30}" y="${r * 18}" width="28" height="16" fill="${darker(c, 0.9)}" opacity=".5"/>`).join('')).join('')}
    <rect x="-10" y="-10" width="140" height="14" fill="${darker(c, 0.7)}"/><rect x="20" y="40" width="80" height="72" rx="6" fill="#2b2622"/>
    <path d="M40 112 Q32 82 52 64 Q50 88 64 78 Q64 52 80 42 Q78 72 88 86 Q96 98 84 112Z" fill="#ff7a1f"/><path d="M52 112 Q50 96 62 88 Q64 102 72 96 Q78 106 72 112Z" fill="#ffd23f"/></g>`,
  sofa: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="170" height="44" rx="16" fill="${darker(c, 0.85)}"/><rect x="0" y="30" width="170" height="40" rx="14" fill="${c}"/>
    <rect x="-12" y="22" width="26" height="54" rx="10" fill="${c}"/><rect x="156" y="22" width="26" height="54" rx="10" fill="${c}"/><rect x="40" y="10" width="34" height="26" rx="8" fill="#f4efe6" opacity=".85"/><rect x="0" y="70" width="8" height="10" fill="${K}"/><rect x="162" y="70" width="8" height="10" fill="${K}"/></g>`,
  armchair: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="70" height="50" rx="16" fill="${darker(c, 0.85)}"/><rect x="0" y="34" width="70" height="34" rx="12" fill="${c}"/><rect x="-10" y="26" width="20" height="44" rx="8" fill="${c}"/><rect x="60" y="26" width="20" height="44" rx="8" fill="${c}"/><rect x="2" y="68" width="6" height="10" fill="${K}"/><rect x="62" y="68" width="6" height="10" fill="${K}"/></g>`,
  rug: (c, x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="120" ry="22" fill="${c}"/><ellipse cx="0" cy="0" rx="96" ry="14" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/><ellipse cx="0" cy="0" rx="60" ry="7" fill="none" stroke="#fff" stroke-width="2" opacity=".4"/></g>`,
  lamp: (c, x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="118" rx="16" ry="5" fill="${K}"/><rect x="-2" y="20" width="4" height="98" fill="${K}"/><path d="M-22 26 L-14 0 L14 0 L22 26Z" fill="${c}"/><ellipse cx="0" cy="34" rx="34" ry="14" fill="#ffe9a8" opacity=".35"/></g>`,
  plant: (c, x, y) => `<g transform="translate(${x} ${y})"><path d="M-18 40 L-14 70 L14 70 L18 40Z" fill="${c}"/><rect x="-20" y="34" width="40" height="8" rx="3" fill="${darker(c, 0.8)}"/>
    ${[[-30, -6, -40], [28, -4, 40], [-10, -30, -10], [12, -28, 15], [0, -44, 0]].map(([dx, dy, a]) => `<ellipse cx="${dx * 0.6}" cy="${dy + 20}" rx="9" ry="22" fill="#4f9a2f" transform="rotate(${a} ${dx * 0.6} ${dy + 20})"/>`).join('')}</g>`,
  shelf: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="90" height="140" fill="${c}"/><rect x="6" y="6" width="78" height="128" fill="${darker(c, 0.7)}"/>
    ${[0, 1, 2].map(r => `<rect x="6" y="${44 + r * 42}" width="78" height="5" fill="${c}"/>${Array.from({ length: 6 }, (_, k) => `<rect x="${10 + k * 12}" y="${14 + r * 42}" width="9" height="${28 - (k % 3) * 3}" y2="0" fill="${['#c8423b', '#2b5d8a', '#e0a83a', '#3f8a5a', '#8e44ad', '#f4efe6'][(k + r) % 6]}" transform="translate(0 ${(k % 3) * 3})"/>`).join('')}`).join('')}</g>`,
  table: (c, x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="56" ry="14" fill="${c}"/><path d="M-56 0 Q-50 30 -40 34 L40 34 Q50 30 56 0" fill="${c}" opacity=".9"/><rect x="-4" y="30" width="8" height="34" fill="${K}"/><ellipse cx="0" cy="64" rx="22" ry="5" fill="${K}"/><ellipse cx="-12" cy="-6" rx="10" ry="4" fill="#fff" opacity=".8"/><circle cx="14" cy="-8" r="5" fill="#e8322f"/></g>`,
  stove: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="96" height="96" rx="6" fill="${c}"/><rect x="12" y="30" width="72" height="52" rx="5" fill="#2b2622"/><rect x="0" y="-10" width="96" height="14" rx="4" fill="${darker(c, 0.7)}"/>
    <rect x="66" y="-70" width="18" height="62" fill="${darker(c, 0.6)}"/><circle cx="26" cy="-14" r="10" fill="#555"/><circle cx="56" cy="-14" r="8" fill="#555"/><path d="M28 82 Q24 64 34 56 Q36 70 44 64 Q46 52 54 46 Q56 64 60 74 Q62 82 58 82Z" fill="#ff7a1f"/></g>`,
  cupboard: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="110" height="60" fill="${c}"/><rect x="6" y="6" width="46" height="48" fill="${darker(c, 0.85)}"/><rect x="58" y="6" width="46" height="48" fill="${darker(c, 0.85)}"/><circle cx="48" cy="30" r="3" fill="${K}"/><circle cx="62" cy="30" r="3" fill="${K}"/>
    <rect x="0" y="80" width="110" height="64" fill="${c}"/><rect x="-4" y="76" width="118" height="8" fill="${darker(c, 0.7)}"/><rect x="8" y="92" width="44" height="44" fill="${darker(c, 0.85)}"/><rect x="58" y="92" width="44" height="44" fill="${darker(c, 0.85)}"/></g>`,
  bed: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="-30" width="16" height="96" rx="4" fill="#7a5230"/><rect x="190" y="0" width="14" height="66" rx="4" fill="#7a5230"/><rect x="10" y="20" width="186" height="34" rx="6" fill="#f4efe6"/>
    <rect x="16" y="6" width="44" height="22" rx="8" fill="#fff"/><path d="M60 14 L196 14 L196 50 Q130 62 60 50Z" fill="${c}"/><path d="M80 24 L190 24 M80 36 L190 36" stroke="#fff" stroke-width="2" opacity=".4"/></g>`,
  wardrobe: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="84" height="150" rx="4" fill="${c}"/><rect x="6" y="8" width="34" height="132" fill="${darker(c, 0.85)}"/><rect x="44" y="8" width="34" height="132" fill="${darker(c, 0.85)}"/><circle cx="36" cy="74" r="3" fill="${K}"/><circle cx="48" cy="74" r="3" fill="${K}"/><rect x="-4" y="-8" width="92" height="10" fill="${darker(c, 0.7)}"/></g>`,
  painting: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="70" height="52" fill="${c}"/><rect x="6" y="6" width="58" height="40" fill="#cfe4f5"/><path d="M8 44 L24 22 L36 36 L46 26 L62 44Z" fill="#fff"/><path d="M8 44 L24 22 L30 30 L22 44Z" fill="#7d93b8"/><circle cx="52" cy="14" r="5" fill="#ffd23f"/></g>`,
  clock: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="56" height="170" rx="8" fill="${c}"/><circle cx="28" cy="34" r="22" fill="#f4efe6" stroke="${darker(c, 0.7)}" stroke-width="4"/><path d="M28 34 L28 20 M28 34 L38 40" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
    <rect x="12" y="66" width="32" height="90" rx="4" fill="${darker(c, 0.75)}"/><line x1="28" y1="70" x2="28" y2="130" stroke="#e0a83a" stroke-width="2"/><circle cx="28" cy="134" r="9" fill="#e0a83a"/></g>`,
  barrel: (c, x, y) => `<g transform="translate(${x} ${y})">${[0, 1].map(k => `<g transform="translate(${k * 70} 0)"><ellipse cx="30" cy="0" rx="30" ry="9" fill="${darker(c, 0.7)}"/><path d="M0 0 Q-6 40 0 80 L60 80 Q66 40 60 0Z" fill="${c}"/><path d="M-3 18 L63 18 M-3 62 L63 62" stroke="#555" stroke-width="5"/><ellipse cx="30" cy="0" rx="22" ry="5" fill="${darker(c, 0.5)}"/></g>`).join('')}</g>`,
  bench: (c, x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="150" height="14" rx="4" fill="${c}"/><rect x="0" y="-36" width="150" height="10" rx="4" fill="${c}"/><rect x="0" y="-20" width="150" height="10" rx="4" fill="${c}"/><rect x="10" y="-36" width="8" height="70" fill="${darker(c, 0.7)}"/><rect x="132" y="-36" width="8" height="70" fill="${darker(c, 0.7)}"/></g>`,
  lights: (c, x, y) => `<g transform="translate(${x} ${y})"><path d="M0 0 Q100 40 200 0 Q260 -20 320 6" fill="none" stroke="${K}" stroke-width="1.5"/>${Array.from({ length: 12 }, (_, k) => { const t = k / 11, px = t * 320, py = t < 0.62 ? 40 * Math.sin(Math.PI * t / 0.62) * 0.5 : -8 + 14 * (t - 0.62); return `<circle cx="${px}" cy="${py + 7}" r="5" fill="${k % 2 ? c : '#fff6c8'}"/><circle cx="${px}" cy="${py + 7}" r="11" fill="${k % 2 ? c : '#fff6c8'}" opacity=".25"/>`; }).join('')}</g>`,
  flowers: (c, x, y) => `<g transform="translate(${x} ${y})"><path d="M-14 30 L-10 60 L10 60 L14 30Z" fill="#cfe4f5" opacity=".9"/>${[[-14, -10], [0, -20], [14, -8], [-6, 2], [8, 4]].map(([dx, dy]) => `<path d="M0 30 L${dx} ${dy}" stroke="#4f9a2f" stroke-width="2"/><circle cx="${dx}" cy="${dy}" r="7" fill="${c}"/><circle cx="${dx}" cy="${dy}" r="2.5" fill="#ffd23f"/>`).join('')}</g>`,
};

// Paredes e chão: a primeira tarefa limpa e pinta, a segunda põe o soalho.
const WALLS = ['#e9d8b8', '#c9dfe9', '#e7c3c0'];
const FLOORS = ['#a0683c', '#c8955a', '#6b4630'];

const t = (id, name, cost, item, styles, x, y) => ({ id, name, cost, item, styles, x, y });
const base = () => [t('wall', 'Limpar e pintar as paredes', 3, 'wall', WALLS), t('floor', 'Pôr soalho novo', 3, 'floor', FLOORS)];
const RED = ['#c8423b', '#2b5d8a', '#5b7f3a'], WOOD = ['#8a5a35', '#b37a45', '#5e3a22'], CLOTH = ['#2f6e8f', '#7a3e5c', '#c9853a'], POTS = ['#c8604a', '#e8e1d4', '#3f6e9a'], WARM = ['#ffcf6b', '#ff8fa3', '#8fe0ff'];

export const ROOMS = [
  { name: 'Sala da lareira', tasks: [...base(), t('fire', 'Acender a lareira', 3, 'fireplace', ['#a8a29a', '#c8604a', '#d8c9a8'], 30, 110), t('sofa', 'Pôr um sofá', 4, 'sofa', CLOTH, 196, 150), t('rug', 'Tapete de lã', 3, 'rug', RED, 236, 262), t('lamp', 'Candeeiro', 3, 'lamp', ['#e0a83a', '#f4efe6', '#c8423b'], 172, 104)] },
  { name: 'Cozinha', tasks: [...base(), t('stove', 'Fogão a lenha', 4, 'stove', ['#3b3b3b', '#7a2e2e', '#2e4a6b'], 30, 126), t('cup', 'Armário da loiça', 3, 'cupboard', WOOD, 260, 70), t('table', 'Mesa e toalha', 3, 'table', RED, 196, 214), t('plant', 'Vaso com plantas', 3, 'plant', POTS, 150, 160)] },
  { name: 'Quarto', tasks: [...base(), t('bed', 'Cama com manta', 4, 'bed', CLOTH, 160, 170), t('ward', 'Guarda-roupa', 3, 'wardrobe', WOOD, 30, 72), t('rug', 'Tapete', 3, 'rug', ['#e0a83a', '#2b5d8a', '#c8423b'], 250, 264), t('paint', 'Quadro da serra', 3, 'painting', ['#b37a45', '#e0a83a', '#3b3b3b'], 160, 40)] },
  { name: 'Varanda', tasks: [...base(), t('bench', 'Banco de madeira', 3, 'bench', WOOD, 120, 206), t('plant', 'Plantas', 3, 'plant', POTS, 50, 160), t('flow', 'Flores na janela', 3, 'flowers', ['#ff4f8b', '#ffd23f', '#8e44ad'], 300, 170), t('lights', 'Luzinhas', 4, 'lights', WARM, 40, 10)] },
  { name: 'Sótão', tasks: [...base(), t('shelf', 'Estante de livros', 4, 'shelf', WOOD, 30, 80), t('chair', 'Cadeirão', 3, 'armchair', CLOTH, 170, 150), t('lamp', 'Candeeiro', 3, 'lamp', ['#e0a83a', '#f4efe6', '#2b5d8a'], 280, 104), t('paint', 'Quadro antigo', 3, 'painting', ['#b37a45', '#e0a83a', '#3b3b3b'], 150, 50)] },
  { name: 'Jardim de inverno', tasks: [...base(), t('plant', 'Plantas grandes', 3, 'plant', POTS, 60, 160), t('flow', 'Flores', 3, 'flowers', ['#ff4f8b', '#ffd23f', '#ffffff'], 330, 170), t('bench', 'Banco', 3, 'bench', ['#ffffff', '#3f6e9a', '#5b7f3a'], 140, 206), t('lights', 'Luzinhas', 4, 'lights', WARM, 40, 10)] },
  { name: 'Adega', tasks: [...base(), t('barrel', 'Pipas', 4, 'barrel', ['#8a5a35', '#a8743f', '#6b4630'], 40, 150), t('shelf', 'Garrafeira', 3, 'shelf', WOOD, 280, 80), t('table', 'Mesa', 3, 'table', ['#8a5a35', '#c8423b', '#e8e1d4'], 220, 214), t('lamp', 'Lanterna', 3, 'lamp', ['#e0a83a', '#3b3b3b', '#c8423b'], 196, 104)] },
  { name: 'Celeiro', tasks: [...base(), t('barrel', 'Barris', 3, 'barrel', ['#a8743f', '#6b4630', '#8a5a35'], 220, 150), t('bench', 'Banco', 3, 'bench', WOOD, 30, 206), t('plant', 'Fardos e vasos', 3, 'plant', POTS, 340, 160), t('lights', 'Luzinhas', 4, 'lights', WARM, 40, 10)] },
  { name: 'Estufa', tasks: [...base(), t('plant', 'Plantas', 3, 'plant', POTS, 60, 160), t('flow', 'Canteiro de flores', 3, 'flowers', ['#ff4f8b', '#ffd23f', '#8e44ad'], 330, 170), t('table', 'Mesa de chá', 3, 'table', ['#ffffff', '#5b7f3a', '#c8423b'], 200, 214), t('lights', 'Luzinhas', 4, 'lights', WARM, 40, 10)] },
  { name: 'Torre do relógio', tasks: [...base(), t('clock', 'Relógio de pé', 4, 'clock', WOOD, 40, 60), t('chair', 'Cadeirão', 3, 'armchair', CLOTH, 200, 150), t('rug', 'Tapete', 3, 'rug', RED, 250, 264), t('paint', 'Retrato da casa', 3, 'painting', ['#b37a45', '#e0a83a', '#3b3b3b'], 260, 40)] },
];

export const roomCost = r => ROOMS[r].tasks.reduce((s, x) => s + x.cost, 0);

// Desenho de uma divisão. state = { tarefa: estilo } com as tarefas feitas. fresh = tarefa acabada de fazer (anima).
export function roomSvg(r, state = {}, fresh = null) {
  const room = ROOMS[r];
  const wallTask = room.tasks.find(x => x.id === 'wall'), floorTask = room.tasks.find(x => x.id === 'floor');
  const wall = state.wall != null ? wallTask.styles[state.wall] : '#b9ae9c';
  const floor = state.floor != null ? floorTask.styles[state.floor] : '#8d8478';
  const items = room.tasks.filter(x => x.item !== 'wall' && x.item !== 'floor' && state[x.id] != null)
    .map(x => `<g class="${fresh === x.id ? 'cs-fresh' : ''}">${F[x.item](x.styles[state[x.id]], x.x, x.y)}</g>`);
  const rug = items.filter((s, k) => room.tasks.filter(x => x.item !== 'wall' && x.item !== 'floor' && state[x.id] != null)[k].item === 'rug');
  const rest = items.filter(s => !rug.includes(s));
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${room.name}">
    <rect width="400" height="300" fill="${wall}" class="${fresh === 'wall' ? 'cs-fresh' : ''}"/>
    ${state.wall == null ? '<g fill="#7d7363" opacity=".35"><circle cx="70" cy="60" r="26"/><circle cx="330" cy="90" r="34"/><circle cx="200" cy="40" r="18"/><path d="M120 10 L140 70 L128 72Z"/></g><path d="M300 20 Q320 30 310 50 M310 50 L330 60" stroke="#8a8070" stroke-width="2" fill="none" opacity=".6"/>' : ''}
    <rect y="230" width="400" height="70" fill="${floor}" class="${fresh === 'floor' ? 'cs-fresh' : ''}"/>${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 48}" y1="230" x2="${i * 48 - 24}" y2="300" stroke="${darker(floor, 0.75)}" stroke-width="2"/>`).join('')}
    ${state.floor == null ? '<g fill="#5e564c" opacity=".4"><rect x="60" y="250" width="40" height="6"/><rect x="250" y="270" width="60" height="5"/></g>' : ''}
    <g transform="translate(250 40)"><rect width="110" height="80" rx="6" fill="#cfe4f5" stroke="#6e4527" stroke-width="8"/><path d="M8 72 L32 30 L52 52 L70 24 L102 72Z" fill="#fff"/><path d="M8 72 L32 30 L40 42 L26 72Z" fill="#9fb6d4"/><line x1="55" y1="0" x2="55" y2="80" stroke="#6e4527" stroke-width="5"/></g>
    ${rug.join('')}${rest.join('')}
  </svg>`;
}
export { F as FURNITURE };
