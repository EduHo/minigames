// Arte do Azulejos, toda em SVG: desenhos dos azulejos, bichos, painéis e decoração.
export const C = '#1d3f8f', C2 = '#3b64c4', C3 = '#8fb0e8', O = '#d99a1e', W = '#ffffff', R = '#c0392b', G = '#2e8b57';

// ---------- Desenhos dos azulejos (grupo de 40x40 dentro de um azulejo 60x60) ----------
const sun = () => Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `<path d="M${20 + Math.cos(a) * 12} ${20 + Math.sin(a) * 12} L${20 + Math.cos(a) * 18} ${20 + Math.sin(a) * 18}" stroke="${C}" stroke-width="2.4" stroke-linecap="round"/>`;
}).join('');

export const ICONS = {
  sardinha: `<path d="M3 20 Q14 9 30 20 Q14 31 3 20Z" fill="${C2}"/><path d="M29 20 L39 13 L37 20 L39 27Z" fill="${C}"/><circle cx="9" cy="18.5" r="1.8" fill="${W}"/><path d="M14 16 q2 4 0 8 M19 15 q2 5 0 10" stroke="${W}" stroke-width="1.4" fill="none"/>`,
  eletrico: `<rect x="4" y="10" width="32" height="20" rx="4" fill="${O}" stroke="${C}" stroke-width="2"/><rect x="8" y="14" width="6" height="6" fill="${W}" stroke="${C}"/><rect x="17" y="14" width="6" height="6" fill="${W}" stroke="${C}"/><rect x="26" y="14" width="6" height="6" fill="${W}" stroke="${C}"/><circle cx="12" cy="32" r="3" fill="${C}"/><circle cx="28" cy="32" r="3" fill="${C}"/><path d="M20 10 L26 2" stroke="${C}" stroke-width="2"/>`,
  andorinha: `<path d="M2 20 Q12 14 18 18 Q26 8 38 4 Q31 17 24 21 L36 33 L21 25 Q14 29 8 24 Z" fill="${C}"/><path d="M8 22 Q12 23 15 21" stroke="${W}" stroke-width="1.5" fill="none"/><circle cx="7" cy="19.5" r="1.2" fill="${W}"/>`,
  limao: `<ellipse cx="20" cy="22" rx="14" ry="11" fill="${O}" stroke="${C}" stroke-width="2"/><path d="M20 11 Q26 2 34 6 Q28 12 20 11Z" fill="${C2}"/><path d="M12 19 q4 -4 9 -3" stroke="${W}" stroke-width="2" fill="none"/>`,
  caravela: `<path d="M3 26 L37 26 L32 34 L8 34 Z" fill="${C}"/><path d="M20 26 L20 3" stroke="${C}" stroke-width="2"/><path d="M8 8 Q20 4 32 8 L30 22 Q20 19 10 22 Z" fill="${W}" stroke="${C}" stroke-width="2"/><path d="M20 10 L20 19 M15.5 14.5 L24.5 14.5" stroke="${R}" stroke-width="2.4"/>`,
  flor: `${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="20" cy="9" rx="5.5" ry="9" fill="${C2}" transform="rotate(${a} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="6" fill="${O}" stroke="${C}" stroke-width="1.5"/>`,
  castelo: `<path d="M5 36 L5 14 L9 14 L9 10 L13 10 L13 14 L17 14 L17 10 L23 10 L23 14 L27 14 L27 10 L31 10 L31 14 L35 14 L35 36 Z" fill="${C2}" stroke="${C}" stroke-width="2"/><path d="M16 36 L16 26 Q20 21 24 26 L24 36" fill="${W}"/><rect x="9" y="19" width="4" height="5" fill="${W}"/><rect x="27" y="19" width="4" height="5" fill="${W}"/><path d="M20 10 L20 2 L27 5 L20 7" fill="${O}" stroke="${C}"/>`,
  uvas: `${[[14, 14], [22, 14], [30, 14], [18, 21], [26, 21], [22, 28], [14, 21]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#7a3e9b" stroke="${C}" stroke-width="1.2"/>`).join('')}<path d="M22 9 Q22 3 28 2" stroke="${C}" stroke-width="2" fill="none"/><path d="M24 7 Q32 0 36 8 Q29 10 24 7Z" fill="${G}"/>`,
  concha: `<path d="M20 36 L4 14 Q20 -2 36 14 Z" fill="${O}" stroke="${C}" stroke-width="2"/>${[8, 14, 20, 26, 32].map(x => `<path d="M20 34 L${x} ${x === 20 ? 4 : 10}" stroke="${C}" stroke-width="1.5"/>`).join('')}<rect x="16" y="33" width="8" height="4" rx="1.5" fill="${C}"/>`,
  sol: `<circle cx="20" cy="20" r="9" fill="${O}" stroke="${C}" stroke-width="2"/>${sun()}<circle cx="17" cy="18" r="1.3" fill="${C}"/><circle cx="23" cy="18" r="1.3" fill="${C}"/><path d="M16 23 q4 3 8 0" stroke="${C}" stroke-width="1.4" fill="none"/>`,
  guitarra: `<circle cx="15" cy="27" r="10" fill="${O}" stroke="${C}" stroke-width="2"/><circle cx="15" cy="27" r="3" fill="${C}"/><path d="M21 21 L35 6" stroke="${C}" stroke-width="4" stroke-linecap="round"/><circle cx="35" cy="5" r="3.5" fill="${C2}"/><path d="M12 30 L33 8" stroke="${W}" stroke-width=".8"/>`,
  coracao: `<path d="M20 35 C 4 24, 2 12, 11 8 C 16 6, 19 9, 20 12 C 21 9, 24 6, 29 8 C 38 12, 36 24, 20 35 Z" fill="${R}" stroke="${C}" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="none" stroke="${O}" stroke-width="2"/><path d="M20 4 L20 9" stroke="${O}" stroke-width="2"/>`,
  cogumelo: `<path d="M4 20 Q20 0 36 20 Z" fill="${R}" stroke="${C}" stroke-width="2"/><circle cx="13" cy="13" r="2.5" fill="${W}"/><circle cx="24" cy="10" r="2.2" fill="${W}"/><circle cx="29" cy="16" r="1.8" fill="${W}"/><rect x="15" y="20" width="10" height="15" rx="4" fill="${W}" stroke="${C}" stroke-width="2"/>`,
  folha: `<path d="M6 34 Q4 10 34 4 Q34 32 6 34Z" fill="${G}" stroke="${C}" stroke-width="2"/><path d="M6 34 L30 9 M14 25 l-3 -7 M20 19 l-2 -8 M14 25 l7 1 M20 19 l8 1" stroke="${W}" stroke-width="1.4" fill="none"/>`,
  chave: `<circle cx="11" cy="20" r="8" fill="none" stroke="${O}" stroke-width="4"/><circle cx="11" cy="20" r="8" fill="none" stroke="${C}" stroke-width="1"/><path d="M19 20 L37 20 M31 20 L31 27 M36 20 L36 25" stroke="${C}" stroke-width="3.4" stroke-linecap="round"/>`,
  livro: `<path d="M4 8 Q12 4 20 9 Q28 4 36 8 L36 32 Q28 28 20 33 Q12 28 4 32Z" fill="${W}" stroke="${C}" stroke-width="2"/><path d="M20 9 L20 33" stroke="${C}" stroke-width="2"/><path d="M8 13 h8 M8 18 h8 M24 13 h8 M24 18 h8 M24 23 h6" stroke="${C2}" stroke-width="1.4"/><path d="M30 4 L30 14 L32.5 11.5 L35 14 L35 4" fill="${R}"/>`,
  balao: `<path d="M20 4 L20 8" stroke="${C}" stroke-width="2"/><path d="M10 8 Q20 6 30 8 Q34 20 30 30 Q20 33 10 30 Q6 20 10 8Z" fill="${R}" stroke="${C}" stroke-width="2"/><path d="M14 8 Q11 20 14 30 M26 8 Q29 20 26 30 M20 8 V31" stroke="${O}" stroke-width="1.6" fill="none"/><path d="M15 31 h10 l-2 5 h-6z" fill="${O}" stroke="${C}"/>`,
  manjerico: `<path d="M8 26 h24 l-3 11 h-18z" fill="#c4643d" stroke="${C}" stroke-width="2"/>${[[12, 18], [20, 14], [28, 18], [16, 10], [24, 10], [20, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${G}" stroke="${C}" stroke-width="1"/>`).join('')}<path d="M27 3 l3 8 l-6 -2z" fill="${R}"/>`,
  floco: `${[0, 60, 120].map(a => `<g transform="rotate(${a} 20 20)"><path d="M20 3 V37" stroke="${C2}" stroke-width="3" stroke-linecap="round"/><path d="M15 7 L20 11 L25 7 M15 33 L20 29 L25 33" stroke="${C2}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`).join('')}<circle cx="20" cy="20" r="3.5" fill="${O}"/>`,
  bolota: `<path d="M9 16 Q20 6 31 16 Z" fill="#8b5a2b" stroke="${C}" stroke-width="2"/><path d="M11 16 Q11 34 20 36 Q29 34 29 16Z" fill="${O}" stroke="${C}" stroke-width="2"/><path d="M20 9 V4" stroke="${C}" stroke-width="2.4"/><path d="M14 13 h12 M16 10 h8" stroke="#c99a63" stroke-width="1.4"/>`,
  ovo: `<path d="M3 26 Q20 40 37 26 Q34 20 20 22 Q6 20 3 26Z" fill="#c99a63" stroke="${C}" stroke-width="2"/><ellipse cx="14" cy="20" rx="6" ry="8" fill="${W}" stroke="${C}" stroke-width="1.6"/><ellipse cx="25" cy="19" rx="6" ry="8" fill="${C3}" stroke="${C}" stroke-width="1.6"/><path d="M4 26 l4 -3 M36 26 l-4 -3" stroke="${C}" stroke-width="1.4"/>`,
  estrela_mar: `<path d="M20 3 L24 15 L37 15 L27 23 L31 36 L20 28 L9 36 L13 23 L3 15 L16 15Z" fill="#e8743b" stroke="${C}" stroke-width="2" stroke-linejoin="round"/>${[[20, 10], [30, 17], [26, 29], [14, 29], [10, 17]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${W}"/>`).join('')}`,
  ancora: `<circle cx="20" cy="6" r="3.5" fill="none" stroke="${C}" stroke-width="2.4"/><path d="M20 10 V35 M12 16 H28" stroke="${C}" stroke-width="3" stroke-linecap="round"/><path d="M6 24 Q8 35 20 35 Q32 35 34 24" stroke="${C}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M3 26 L6 21 L9 26 M31 26 L34 21 L37 26" fill="${O}" stroke="${C}" stroke-width="1.4"/>`,
  lua: `<path d="M26 4 A16 16 0 1 0 36 26 A12 12 0 1 1 26 4Z" fill="${O}" stroke="${C}" stroke-width="2"/><circle cx="16" cy="22" r="1.4" fill="${C}"/><path d="M14 28 q3 2 6 0" stroke="${C}" stroke-width="1.4" fill="none"/>`,
  estrela: `<path d="M20 3 L25 15 L38 16 L28 24 L31 37 L20 30 L9 37 L12 24 L2 16 L15 15Z" fill="${O}" stroke="${C}" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="21" r="4" fill="${C2}"/>`,
  sino: `<path d="M20 4 Q31 6 31 22 L35 30 H5 L9 22 Q9 6 20 4Z" fill="${O}" stroke="${C}" stroke-width="2"/><circle cx="20" cy="33" r="3.5" fill="${C}"/><path d="M13 14 q2 -4 6 -5" stroke="${W}" stroke-width="2" fill="none"/>`,
};
export const ICON_NAMES = {
  sardinha: 'Sardinha', eletrico: 'Elétrico', andorinha: 'Andorinha', limao: 'Limão', caravela: 'Caravela', flor: 'Flor', castelo: 'Castelo', uvas: 'Uvas',
  concha: 'Concha', sol: 'Sol', guitarra: 'Guitarra', coracao: 'Coração', cogumelo: 'Cogumelo', folha: 'Folha', chave: 'Chave', livro: 'Livro', balao: 'Balão do arraial',
  manjerico: 'Manjerico', floco: 'Floco de neve', bolota: 'Bolota', ovo: 'Ninho', estrela_mar: 'Estrela-do-mar', ancora: 'Âncora', lua: 'Lua', estrela: 'Estrela', sino: 'Sino',
};

// 12 desenhos por sítio
export const CHAPTER_FACES = [
  ['eletrico', 'sardinha', 'andorinha', 'limao', 'caravela', 'flor', 'castelo', 'guitarra', 'coracao', 'sol', 'ancora', 'sino'],
  ['cogumelo', 'folha', 'lua', 'estrela', 'castelo', 'flor', 'andorinha', 'sino', 'coracao', 'chave', 'bolota', 'livro'],
  ['castelo', 'chave', 'sino', 'coracao', 'flor', 'sol', 'limao', 'estrela', 'andorinha', 'livro', 'ancora', 'lua'],
  ['livro', 'chave', 'lua', 'estrela', 'sino', 'flor', 'coracao', 'andorinha', 'folha', 'sol', 'castelo', 'guitarra'],
  ['balao', 'manjerico', 'sardinha', 'guitarra', 'coracao', 'sol', 'estrela', 'limao', 'flor', 'sino', 'andorinha', 'uvas'],
  ['uvas', 'folha', 'sol', 'bolota', 'cogumelo', 'flor', 'andorinha', 'limao', 'sino', 'coracao', 'lua', 'estrela'],
  ['floco', 'estrela', 'lua', 'sino', 'bolota', 'cogumelo', 'folha', 'coracao', 'chave', 'livro', 'sol', 'andorinha'],
  ['bolota', 'ovo', 'folha', 'sol', 'cogumelo', 'flor', 'andorinha', 'uvas', 'limao', 'estrela', 'lua', 'sino'],
  ['concha', 'estrela_mar', 'ancora', 'sardinha', 'caravela', 'sol', 'lua', 'estrela', 'coracao', 'flor', 'limao', 'andorinha'],
  ['flor', 'concha', 'estrela_mar', 'sol', 'lua', 'estrela', 'coracao', 'andorinha', 'caravela', 'uvas', 'limao', 'balao'],
];

// Azulejo: vidrado branco, moldura azul e cantos com quartos de flor.
export function frame(inner, { grey = false, back = false, hidden = false } = {}) {
  const corners = [[0, 0], [60, 0], [0, 60], [60, 60]].map(([x, y]) =>
    `<path d="M ${x} ${y} m ${x ? -11 : 11} 0 a 11 11 0 0 ${x === y ? 1 : 0} ${x ? 11 : -11} ${y ? -11 : 11}" fill="none" stroke="${C}" stroke-width="2"/><circle cx="${x ? 55 : 5}" cy="${y ? 55 : 5}" r="2.6" fill="${O}"/>`).join('');
  if (back) {
    // Presente: azulejo embrulhado (ainda não se sabe o desenho)
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect x=".5" y=".5" width="59" height="59" rx="5" fill="#d1477a"/>
      ${[10, 25, 40, 55].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 12 : 48}" r="3" fill="#f7b6cf"/><circle cx="${x - 7}" cy="${i % 2 ? 46 : 14}" r="2.4" fill="#f7b6cf"/>`).join('')}
      <rect x="25" y="0" width="10" height="60" fill="${O}"/><rect x="0" y="25" width="60" height="10" fill="${O}"/>
      <path d="M30 28 C20 14 10 20 16 28 C20 32 27 30 30 28 C33 30 40 32 44 28 C50 20 40 14 30 28Z" fill="#f6c453" stroke="#a8740f" stroke-width="1.5"/><circle cx="30" cy="29" r="4" fill="#e0a92e" stroke="#a8740f" stroke-width="1.5"/></svg>`;
  }
  if (hidden) {
    // Apagado pelo Mestre Cinzento: só um rabisco cinzento
    inner = '<path d="M8 30 C 8 14, 32 8, 34 22 C 36 32, 22 34, 22 26 C 22 21, 28 21, 28 25" fill="none" stroke="#9da3ad" stroke-width="3" stroke-linecap="round"/>';
    grey = true;
  }
  return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <rect x=".5" y=".5" width="59" height="59" rx="5" fill="${grey ? '#dfe2e8' : '#fdfdfb'}"/>
    <rect x="3" y="3" width="54" height="54" rx="3" fill="none" stroke="${C2}" stroke-width="1.6"/>${corners}
    <g transform="translate(10 10)"${grey && !hidden ? ' opacity=".35"' : ''}>${inner}</g></svg>`;
}
const cache = new Map();
export function tileSvg(face, opts = {}) {
  const key = `${face}|${opts.grey ? 1 : 0}|${opts.back ? 1 : 0}|${opts.hidden ? 1 : 0}`;
  if (!cache.has(key)) cache.set(key, frame(ICONS[face] || '', opts));
  return cache.get(key);
}

// ---------- Bichos ----------
export const PEOPLE = {
  ines: { id: 'ines', name: 'Inês', species: 'fox', color: '#e07a2f', dark: '#5a2d10', role: 'Raposinha aprendiz de azulejista.', shirt: C2, acc: ['flower'], bg: '#e6eefb' },
  rosa: { id: 'rosa', name: 'Avó Rosa', species: 'owl', color: '#9b7653', light: '#f3e6d0', dark: '#5b4126', role: 'Coruja e mestre azulejista.', shirt: '#7a4fb5', acc: ['glasses'], bg: '#f1e9fb' },
  cinzento: { id: 'cinzento', name: 'Mestre Cinzento', species: 'chameleon', color: '#9da3ad', dark: '#6b717c', role: 'Camaleão que perdeu as cores.', shirt: '#5d6270', villain: true, bg: '#e3e5ea' },
  cinzentoCor: { id: 'cinzentoCor', name: 'Mestre Cinzento', species: 'chameleon', color: '#4fb06a', dark: '#2f7a45', role: 'Camaleão que recuperou as cores.', shirt: '#d99a1e', bg: '#e4f4ea' },
  joaquim: { id: 'joaquim', name: 'Sr. Joaquim', species: 'cat', color: '#e9a23b', dark: '#a05a12', stripes: true, role: 'Gato guarda-freio do elétrico.', shirt: '#2f4b8a', acc: ['cap'] },
  amelia: { id: 'amelia', name: 'D. Amélia', species: 'deer', color: '#b07a4a', role: 'Corça guardiã do palácio.', shirt: '#d1477a', acc: ['crown'], bg: '#e9f1e4' },
  rui: { id: 'rui', name: 'Rui', species: 'bear', color: '#7a5233', light: '#d9b38c', role: 'Urso guarda das portas.', shirt: '#7c2d12', acc: ['helmet'] },
  beatriz: { id: 'beatriz', name: 'Beatriz', species: 'mole', color: '#4a4552', light: '#bfb4c9', role: 'Toupeira estudante.', shirt: '#1c1c1c', acc: ['glasses'], bg: '#ece6f5' },
  ze: { id: 'ze', name: 'Zé', species: 'frog', color: '#5aa34a', light: '#d7efb8', role: 'Sapo rei do arraial.', shirt: '#2a6f97', acc: ['beret'], bg: '#fbefd5' },
  graca: { id: 'graca', name: 'Tia Graça', species: 'goat', color: '#f4efe6', light: '#e8d9c4', role: 'Cabra vindimadeira.', shirt: '#6b8e23', acc: ['scarf'], bg: '#efe4f2' },
  tome: { id: 'tome', name: 'Tomé', species: 'dog', color: '#e8dcc8', dark: '#8a5a2b', role: 'Cão pastor.', shirt: '#8b5a2b', acc: ['scarf'], bg: '#e6f0fa' },
  luisa: { id: 'luisa', name: 'Luísa', species: 'stork', color: '#ffffff', dark: '#22252c', role: 'Cegonha dos sobreiros.', shirt: '#a0522d', bg: '#f6ecd8' },
  marta: { id: 'marta', name: 'Marta', species: 'otter', color: '#8a5a3c', light: '#e8cfb2', role: 'Lontra pescadora.', shirt: '#1e8a8a', acc: ['bow'], bg: '#dcf1f1' },
  lourenco: { id: 'lourenco', name: 'Lourenço', species: 'turtle', color: '#6fb06a', light: '#e2f3c8', role: 'Tartaruga das ilhas.', shirt: '#2e8b57', acc: ['hat'], bg: '#e4f4ea' },
};

let clipSeq = 0;
export function portrait(id) {
  if (id === 'pena') return pena();
  const p = PEOPLE[id];
  const c = p.color, light = p.light || '#fff7ec', dark = p.dark || '#3a2a1e';
  const eye = (x, y, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#22252c"/><circle cx="${x + 1}" cy="${y - 1}" r="${r * 0.35}" fill="#fff"/>`;
  const blush = '<ellipse cx="33" cy="60" rx="5" ry="3" fill="#f2879a" opacity=".45"/><ellipse cx="67" cy="60" rx="5" ry="3" fill="#f2879a" opacity=".45"/>';
  const smile = '<path d="M44 64 Q50 69 56 64" stroke="#22252c" stroke-width="2" fill="none" stroke-linecap="round"/>';
  const H = {
    fox: `<path d="M24 22 L36 46 L20 48Z M76 22 L64 46 L80 48Z" fill="${c}"/><path d="M24 22 L30 34 L26 36Z M76 22 L70 34 L74 36Z" fill="${dark}"/><path d="M22 48 Q24 30 50 30 Q76 30 78 48 Q76 70 50 80 Q24 70 22 48Z" fill="${c}"/><path d="M28 54 Q40 58 50 80 Q60 58 72 54 Q66 72 50 80 Q34 72 28 54Z" fill="${light}"/>${eye(40, 50)}${eye(60, 50)}<ellipse cx="50" cy="68" rx="4" ry="3" fill="#22252c"/>${blush}`,
    owl: `<path d="M22 30 L32 40 L24 44Z M78 30 L68 40 L76 44Z" fill="${dark}"/><ellipse cx="50" cy="54" rx="30" ry="28" fill="${c}"/><path d="M28 58 Q50 92 72 58 Q60 66 50 66 Q40 66 28 58Z" fill="${light}" opacity=".7"/><circle cx="39" cy="50" r="10" fill="${light}"/><circle cx="61" cy="50" r="10" fill="${light}"/>${eye(39, 50, 4.4)}${eye(61, 50, 4.4)}<path d="M46 58 L54 58 L50 66Z" fill="#e0a12b"/>`,
    chameleon: `<path d="M26 40 Q34 14 62 18 Q78 22 80 40 Q70 30 54 30 Q38 30 26 40Z" fill="${dark}"/><ellipse cx="52" cy="54" rx="30" ry="24" fill="${c}"/><path d="M30 48 Q50 40 74 48" stroke="${dark}" stroke-width="2" fill="none" opacity=".6"/><circle cx="64" cy="50" r="11" fill="${dark}"/><circle cx="64" cy="50" r="7" fill="#e9ecef"/>${eye(65, 50, 3)}${p.villain ? '<path d="M28 64 Q50 70 72 62" stroke="#22252c" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M40 46 l4 -3 M48 44 l4 -3" stroke="#22252c" stroke-width="2" stroke-linecap="round"/>' : '<path d="M30 62 Q50 76 72 60" stroke="#22252c" stroke-width="2" fill="none" stroke-linecap="round"/>'}`,
    cat: `<path d="M26 26 L36 44 L22 46Z M74 26 L64 44 L78 46Z" fill="${c}"/><path d="M27 31 L33 42 L26 43Z M73 31 L67 42 L74 43Z" fill="#f2a5b4"/><ellipse cx="50" cy="54" rx="28" ry="25" fill="${c}"/>${p.stripes ? `<path d="M40 31 l2 7 M50 30 v8 M60 31 l-2 7" stroke="${dark}" stroke-width="2.4"/>` : ''}<ellipse cx="50" cy="64" rx="12" ry="8" fill="${light}"/>${eye(40, 52)}${eye(60, 52)}<path d="M47 60 L53 60 L50 63Z" fill="#f2879a"/><path d="M30 62 L40 63 M30 67 L40 66 M70 62 L60 63 M70 67 L60 66" stroke="#22252c" stroke-width="1"/>${smile}`,
    deer: `<ellipse cx="24" cy="40" rx="11" ry="6" fill="${c}" transform="rotate(-25 24 40)"/><ellipse cx="76" cy="40" rx="11" ry="6" fill="${c}" transform="rotate(25 76 40)"/><ellipse cx="50" cy="52" rx="24" ry="26" fill="${c}"/><circle cx="41" cy="34" r="2" fill="${light}"/><circle cx="58" cy="36" r="2" fill="${light}"/><ellipse cx="50" cy="68" rx="12" ry="10" fill="${light}"/>${eye(41, 50)}${eye(59, 50)}<ellipse cx="50" cy="64" rx="4" ry="3" fill="#22252c"/>${blush}`,
    bear: `<circle cx="28" cy="32" r="10" fill="${c}"/><circle cx="72" cy="32" r="10" fill="${c}"/><circle cx="28" cy="32" r="5" fill="${light}"/><circle cx="72" cy="32" r="5" fill="${light}"/><circle cx="50" cy="54" r="28" fill="${c}"/><ellipse cx="50" cy="65" rx="13" ry="10" fill="${light}"/>${eye(40, 50)}${eye(60, 50)}<ellipse cx="50" cy="61" rx="5" ry="3.5" fill="#22252c"/>${smile}`,
    mole: `<ellipse cx="50" cy="56" rx="28" ry="26" fill="${c}"/><ellipse cx="50" cy="66" rx="14" ry="10" fill="${light}" opacity=".5"/>${eye(41, 52, 2.4)}${eye(59, 52, 2.4)}${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="50" cy="59" rx="2" ry="5" fill="#f28aa0" transform="rotate(${a} 50 64)"/>`).join('')}<circle cx="50" cy="64" r="3" fill="#e2627f"/>`,
    frog: `<circle cx="34" cy="34" r="11" fill="${c}"/><circle cx="66" cy="34" r="11" fill="${c}"/><circle cx="34" cy="34" r="7" fill="#fff"/><circle cx="66" cy="34" r="7" fill="#fff"/>${eye(34, 34, 4)}${eye(66, 34, 4)}<ellipse cx="50" cy="58" rx="32" ry="22" fill="${c}"/><ellipse cx="50" cy="66" rx="22" ry="10" fill="${light}" opacity=".6"/><path d="M30 58 Q50 74 70 58" stroke="#22252c" stroke-width="2.4" fill="none" stroke-linecap="round"/>${blush}`,
    goat: `<path d="M34 34 Q22 16 32 10 Q30 22 40 30Z M66 34 Q78 16 68 10 Q70 22 60 30Z" fill="#b89b6a"/><ellipse cx="22" cy="44" rx="10" ry="5" fill="${c}" stroke="#d8cbb4" transform="rotate(20 22 44)"/><ellipse cx="78" cy="44" rx="10" ry="5" fill="${c}" stroke="#d8cbb4" transform="rotate(-20 78 44)"/><ellipse cx="50" cy="52" rx="22" ry="26" fill="${c}" stroke="#d8cbb4"/><ellipse cx="50" cy="68" rx="11" ry="9" fill="${light}"/>${eye(41, 48)}${eye(59, 48)}<ellipse cx="46" cy="66" rx="1.6" ry="1" fill="#22252c"/><ellipse cx="54" cy="66" rx="1.6" ry="1" fill="#22252c"/><path d="M46 77 Q50 90 54 77Z" fill="${light}"/>`,
    dog: `<ellipse cx="25" cy="50" rx="9" ry="18" fill="${dark}" transform="rotate(15 25 50)"/><ellipse cx="75" cy="50" rx="9" ry="18" fill="${dark}" transform="rotate(-15 75 50)"/><ellipse cx="50" cy="52" rx="25" ry="26" fill="${c}"/><ellipse cx="50" cy="66" rx="13" ry="10" fill="${light}"/>${eye(41, 48)}${eye(59, 48)}<ellipse cx="50" cy="61" rx="5" ry="4" fill="#22252c"/><path d="M44 70 Q50 74 56 70" stroke="#22252c" stroke-width="2" fill="none"/><path d="M47 72 q3 7 6 0" fill="#f2879a"/>`,
    stork: `<ellipse cx="46" cy="52" rx="24" ry="24" fill="${c}" stroke="#d6dbe4"/><path d="M58 52 L94 62 L58 60Z" fill="#e0662b"/><path d="M58 56 L94 62" stroke="#a8461a" stroke-width="1"/>${eye(52, 46, 3.4)}<path d="M26 34 Q36 26 48 30" stroke="${dark}" stroke-width="3" fill="none"/>`,
    otter: `<circle cx="30" cy="34" r="7" fill="${c}"/><circle cx="70" cy="34" r="7" fill="${c}"/><ellipse cx="50" cy="54" rx="27" ry="25" fill="${c}"/><ellipse cx="50" cy="64" rx="18" ry="12" fill="${light}"/>${eye(40, 49)}${eye(60, 49)}<ellipse cx="50" cy="59" rx="5" ry="3.5" fill="#22252c"/><path d="M30 62 L42 63 M30 67 L42 66 M70 62 L58 63 M70 67 L58 66" stroke="#22252c" stroke-width="1"/>${smile}`,
    turtle: `<ellipse cx="50" cy="56" rx="24" ry="24" fill="${c}"/><ellipse cx="50" cy="66" rx="14" ry="9" fill="${light}" opacity=".6"/>${eye(41, 50)}${eye(59, 50)}<path d="M43 64 Q50 70 57 64" stroke="#22252c" stroke-width="2" fill="none"/>${blush}`,
  };
  const ACC = {
    cap: `<path d="M28 32 Q50 16 72 32 L72 36 L28 36Z" fill="${C}"/><rect x="24" y="34" width="52" height="5" rx="2" fill="${C}"/><circle cx="50" cy="26" r="3" fill="${O}"/>`,
    glasses: `<circle cx="40" cy="51" r="8" fill="none" stroke="${C}" stroke-width="2.4"/><circle cx="60" cy="51" r="8" fill="none" stroke="${C}" stroke-width="2.4"/><path d="M48 51 L52 51" stroke="${C}" stroke-width="2.4"/>`,
    flower: `<g transform="translate(66 30)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-6" rx="3.5" ry="6" fill="#e86aa6" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="${O}"/></g>`,
    scarf: `<path d="M26 74 Q50 90 74 74 L74 82 Q50 96 26 82Z" fill="${R}"/><circle cx="40" cy="83" r="1.8" fill="#fff"/><circle cx="58" cy="83" r="1.8" fill="#fff"/>`,
    beret: '<ellipse cx="50" cy="24" rx="20" ry="6" fill="#2b2b2b"/><circle cx="50" cy="18" r="2.5" fill="#2b2b2b"/>',
    hat: `<ellipse cx="50" cy="30" rx="30" ry="6" fill="#c9a24a"/><path d="M36 30 Q36 14 50 14 Q64 14 64 30Z" fill="#d8b45c"/><rect x="36" y="24" width="28" height="4" fill="${C}"/>`,
    helmet: `<path d="M26 40 Q26 16 50 16 Q74 16 74 40 L70 40 Q68 24 50 24 Q32 24 30 40Z" fill="#9aa3b5" stroke="${C}" stroke-width="1.5"/><rect x="48" y="12" width="4" height="10" fill="${R}"/>`,
    crown: `<path d="M36 30 L39 16 L45 24 L50 12 L55 24 L61 16 L64 30Z" fill="${O}" stroke="${C}" stroke-width="1.3"/>`,
    bow: '<path d="M50 30 L40 24 L40 36Z M50 30 L60 24 L60 36Z" fill="#e86aa6"/><circle cx="50" cy="30" r="3" fill="#c0397a"/>',
  };
  const id2 = `cl${++clipSeq}`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="50" cy="50" r="49" fill="${p.bg || '#dfe8f8'}"/>
    <clipPath id="${id2}"><circle cx="50" cy="50" r="49"/></clipPath>
    <g clip-path="url(#${id2})"><path d="M14 100 Q16 74 50 72 Q84 74 86 100Z" fill="${p.shirt || C2}"/>${H[p.species]}${(p.acc || []).map(a => ACC[a]).join('')}</g>
    <circle cx="50" cy="50" r="48" fill="none" stroke="${p.villain ? '#8b8f99' : C}" stroke-width="2.5"/></svg>`;
}
function pena() {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="50" cy="50" r="49" fill="#dfe8f8"/>
    <path d="M14 56 Q34 44 46 50 Q60 26 90 14 Q76 46 62 54 L88 80 L56 64 Q40 74 26 66 Z" fill="${C}"/>
    <path d="M26 62 Q36 64 44 58" stroke="${W}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M20 55 Q22 60 30 60" fill="${R}"/>
    <circle cx="24" cy="52" r="3" fill="${W}"/><circle cx="24.5" cy="52" r="1.6" fill="#16213b"/><path d="M12 54 L4 56 L12 58Z" fill="${O}"/>
    <circle cx="50" cy="50" r="48" fill="none" stroke="${C}" stroke-width="2.5"/></svg>`;
}
export const nameOf = id => (id === 'pena' ? 'Pena' : PEOPLE[id].name);

// ---------- Decoração das faixas do mapa (nas margens) ----------
export function decoSvg(kind, width, height) {
  let s = '';
  const sides = [10, width - 56];
  for (let k = 0; k < Math.floor(height / 80); k++) {
    const x = sides[k % 2] + ((k * 13) % 24) - (k % 2 ? 6 : 0), y = 30 + k * 80;
    s += DECO[kind](x, y, k);
  }
  return `<svg class="deco" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">${s}</svg>`;
}
const DECO = {
  houses: (x, y) => `<rect x="${x}" y="${y}" width="36" height="40" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M${x - 3} ${y} L${x + 18} ${y - 14} L${x + 39} ${y}Z" fill="#c4643d"/>${[0, 1, 2].map(r => [0, 1, 2].map(cc => `<rect x="${x + 4 + cc * 10}" y="${y + 6 + r * 10}" width="8" height="8" fill="${(r + cc) % 2 ? C3 : '#fff'}" stroke="${C2}" stroke-width=".6"/>`).join('')).join('')}`,
  trees: (x, y) => `<rect x="${x + 16}" y="${y + 24}" width="5" height="18" fill="#6b4a2a"/><circle cx="${x + 18}" cy="${y + 16}" r="16" fill="#7fa37a" stroke="${C}" stroke-width="1.2"/><circle cx="${x + 8}" cy="${y + 26}" r="9" fill="#93b88c" stroke="${C}" stroke-width="1"/><path d="M${x - 6} ${y + 46} q12 -6 24 0 q12 -6 24 0" stroke="#fff" stroke-width="4" fill="none" opacity=".85"/>`,
  walls: (x, y) => `<path d="M${x} ${y + 40} v-28 h6 v6 h6 v-6 h6 v6 h6 v-6 h6 v6 h6 v-6 h6 v28z" fill="#efe6d4" stroke="${C}" stroke-width="1.5"/><path d="M${x + 16} ${y + 40} v-10 q5 -6 10 0 v10" fill="${C2}"/>`,
  books: (x, y) => [0, 1, 2, 3].map(i => `<rect x="${x + i * 9}" y="${y + 8 + (i % 2) * 4}" width="8" height="${32 - (i % 2) * 4}" fill="${[C2, R, O, G][i]}" stroke="${C}" stroke-width="1"/>`).join('') + `<rect x="${x - 2}" y="${y + 40}" width="40" height="4" fill="#8b5a2b"/>`,
  lanterns: (x, y) => `<path d="M${x - 4} ${y} q24 14 48 0" stroke="${C}" stroke-width="1" fill="none"/>${[0, 1, 2].map(i => `<path d="M${x + 4 + i * 14} ${y + 6} h8 l2 12 h-12z" fill="${[R, O, C2][i]}" stroke="${C}" stroke-width="1"/>`).join('')}<path d="M${x + 8} ${y + 44} q4 -10 8 0 q4 -12 8 0z" fill="${O}"/>`,
  vines: (x, y) => `${[0, 1, 2].map(i => `<path d="M${x} ${y + 14 + i * 12} q20 -6 40 0" stroke="#7a3e6b" stroke-width="2" fill="none" stroke-dasharray="3 3"/>`).join('')}<circle cx="${x + 30}" cy="${y + 8}" r="4" fill="#7a3e9b"/><circle cx="${x + 35}" cy="${y + 12}" r="4" fill="#7a3e9b"/>`,
  snow: (x, y) => `<path d="M${x} ${y + 40} L${x + 20} ${y} L${x + 40} ${y + 40}Z" fill="${C3}" stroke="${C}" stroke-width="1.2"/><path d="M${x + 12} ${y + 16} L${x + 20} ${y} L${x + 28} ${y + 16} L${x + 22} ${y + 12} L${x + 18} ${y + 16}Z" fill="#fff"/>`,
  oaks: (x, y) => `<path d="M${x + 18} ${y + 42} q-2 -12 0 -20" stroke="#6b4a2a" stroke-width="5"/><ellipse cx="${x + 18}" cy="${y + 14}" rx="22" ry="12" fill="#8aa05a" stroke="${C}" stroke-width="1.2"/><path d="M${x + 22} ${y - 2} q6 -4 12 0" stroke="#fff" stroke-width="3" fill="none"/>`,
  waves: (x, y) => `${[0, 1, 2].map(i => `<path d="M${x - 4} ${y + 10 + i * 12} q8 -8 16 0 q8 -8 16 0 q8 -8 16 0" stroke="${C2}" stroke-width="2.5" fill="none"/>`).join('')}`,
  clouds: (x, y) => `<ellipse cx="${x + 20}" cy="${y + 20}" rx="20" ry="9" fill="#fff" stroke="${C3}"/><ellipse cx="${x + 12}" cy="${y + 15}" rx="10" ry="8" fill="#fff"/><ellipse cx="${x + 26}" cy="${y + 13}" rx="9" ry="7" fill="#fff"/><path d="M${x + 4} ${y + 34} h32 l-6 8 h-20z" fill="#9c7a54" stroke="${C}"/>`,
};
