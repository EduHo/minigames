// Faces das peças de Mahjong desenhadas em SVG (viewBox 60x80).
// Cada "tipo" tem um grupo (o que conta para fazer par) e 1 ou 4 faces.
// Flores e estações: as 4 faces diferentes fazem par entre si.

const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WINDS = ['東', '南', '西', '北'];
const FLOWERS = ['🌸', '🌺', '🌻', '🌷'];
const SEASONS = ['🌱', '☀️', '🍁', '❄️'];

const POS = {
  1: [[30, 40]],
  2: [[30, 24], [30, 56]],
  3: [[16, 18], [30, 40], [44, 62]],
  4: [[18, 24], [42, 24], [18, 56], [42, 56]],
  5: [[17, 20], [43, 20], [30, 40], [17, 60], [43, 60]],
  6: [[18, 18], [42, 18], [18, 40], [42, 40], [18, 62], [42, 62]],
  7: [[14, 14], [30, 24], [46, 34], [18, 52], [42, 52], [18, 68], [42, 68]],
  8: [[18, 13], [42, 13], [18, 31], [42, 31], [18, 49], [42, 49], [18, 67], [42, 67]],
  9: [[14, 18], [30, 18], [46, 18], [14, 40], [30, 40], [46, 40], [14, 62], [30, 62], [46, 62]],
};
const DOT_COLORS = ['#1f5fae', '#c0392b', '#1e8449'];

const text = (s, x, y, size, fill, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" dominant-baseline="central" font-family="'Noto Serif CJK SC','Songti SC',serif" ${extra}>${s}</text>`;

function dots(n) {
  if (n === 1) {
    return `<circle cx="30" cy="40" r="21" fill="#1e8449"/><circle cx="30" cy="40" r="15" fill="#fff"/>
      <circle cx="30" cy="40" r="11" fill="#c0392b"/><circle cx="30" cy="40" r="5" fill="#fff"/>`;
  }
  const r = n <= 2 ? 11 : n <= 6 ? 9 : 7.5;
  return POS[n].map(([x, y], i) => {
    const c = DOT_COLORS[(n === 9 ? Math.floor(i / 3) : i) % 3];
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${r * 0.28}" fill="${c}"/>`;
  }).join('');
}

function bamboo(n) {
  if (n === 1) return text('🦚', 30, 42, 40, '#000');
  const h = n <= 4 ? 24 : n === 7 || n === 8 ? 15 : 18;
  return POS[n].map(([x, y], i) => {
    const center = (n === 5 || n === 9) && i === Math.floor(n / 2);
    const c = center ? '#c0392b' : '#1e8449';
    return `<rect x="${x - 3.5}" y="${y - h / 2}" width="7" height="${h}" rx="3" fill="${c}"/>
      <rect x="${x - 4.5}" y="${y - 1}" width="9" height="2" rx="1" fill="#0b4d26"/>`;
  }).join('');
}

function faceSvg(face) {
  const [kind, v] = [face[0], face.slice(1)];
  const n = Number(v);
  let body = '';
  switch (kind) {
    case 'd': body = dots(n); break;
    case 'b': body = bamboo(n); break;
    case 'c': body = text(NUMERALS[n - 1], 30, 24, 28, '#1a3a8a', 'font-weight="700"') + text('萬', 30, 60, 30, '#c0392b', 'font-weight="700"'); break;
    case 'w': body = text(WINDS[n - 1], 30, 41, 42, '#222', 'font-weight="700"'); break;
    case 'r':
      body = n === 1 ? text('中', 30, 41, 44, '#c0392b', 'font-weight="700"')
        : n === 2 ? text('發', 30, 41, 42, '#1e8449', 'font-weight="700"')
        : `<rect x="12" y="15" width="36" height="50" rx="4" fill="none" stroke="#1f5fae" stroke-width="4"/>
           <rect x="19" y="22" width="22" height="36" rx="2" fill="none" stroke="#1f5fae" stroke-width="2"/>`;
      break;
    case 'f': body = text(FLOWERS[n - 1], 30, 40, 36, '#000') + text(n, 52, 9, 10, '#c0392b'); break;
    case 's': body = text(SEASONS[n - 1], 30, 40, 36, '#000') + text(n, 52, 9, 10, '#1f5fae'); break;
  }
  return `<svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

// Estilos de peças. "contrast" é o clássico com símbolos maiores e mais escuros.
export const STYLES = [
  { id: 'classic', name: 'Clássico', price: 0 },
  { id: 'contrast', name: 'Alto contraste', price: 0, desc: 'Símbolos maiores, mais fáceis de ver' },
  { id: 'fruits', name: 'Frutas', price: 300 },
  { id: 'animals', name: 'Animais', price: 500 },
  { id: 'halloween', name: 'Halloween', event: 'halloween' },
  { id: 'christmas', name: 'Natal', event: 'christmas' },
  { id: 'cny', name: 'Ano Novo Chinês', event: 'cny' },
];

// Ordem fixa das faces, para mapear para os conjuntos de emoji.
const ORDER = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => 'd' + n),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => 'b' + n),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => 'c' + n),
  'w1', 'w2', 'w3', 'w4', 'r1', 'r2', 'r3',
  'f1', 'f2', 'f3', 'f4', 's1', 's2', 's3', 's4',
];

// 34 símbolos + 4 do grupo "flores" + 4 do grupo "estações" por estilo.
const EMOJI = {
  fruits: '🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥕 🌽 🌶️ 🥒 🍄 🥜 🌰 🍞 🥐 🧀 🥚 🍔 🍕 🌮 🍩 🍪 🎂 🍰 🍵 ☕ 🧃 🥤',
  animals: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦆 🦉 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐢 🐍 🐙 🦀 🐠 🐬 🐳 🌸 🌺 🌻 🌷 🌱 ☀️ 🍁 ❄️',
  halloween: '🎃 👻 🦇 🕷️ 🕸️ 💀 🧙 🧛 🧟 🍬 🍭 🕯️ 🌕 🐈‍⬛ 🔮 ⚰️ 🪦 🧹 🦉 🍂 🌙 ⭐ 🧪 📜 🗝️ 🏚️ 🌑 🐺 🦴 👁️ 🍫 🎭 🪄 🌫️ 🍁 🍄 🌰 🌾 🎩 🧣 🧤 🥾',
  christmas: '🎄 🎅 🤶 🦌 ⛄ ❄️ 🎁 🔔 🕯️ ⭐ 🍪 🥛 🧦 🎀 🌟 🛷 🧸 🎉 🍬 🍭 🧤 🧣 🎿 ⛸️ 🏔️ 🌨️ ☃️ 🦉 🐧 🍫 🥧 🍷 🌲 🎶 🌺 🌸 🌼 🌷 ✨ 💫 🎇 🎆',
  cny: '🧧 🏮 🐉 🐲 🍊 🥟 🎆 🎇 🐍 🐎 🐐 🐒 🐓 🐕 🐖 🐀 🐂 🐅 🐇 🀄 🍜 🍵 🥢 🎐 🎋 🏯 ⛩️ 🪭 🌕 🥮 🍡 🍙 🐼 🎎 🌸 🌺 🌼 🪷 🌱 ☀️ 🍁 ❄️',
};
const EMOJI_LISTS = Object.fromEntries(Object.entries(EMOJI).map(([k, v]) => [k, v.split(' ')]));

function emojiSvg(face, style) {
  const e = EMOJI_LISTS[style][ORDER.indexOf(face)];
  const group = face[0] === 'f' || face[0] === 's';
  return `<svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">${text(e, 30, 41, 40, '#000')}${
    group ? `<circle cx="51" cy="9" r="4" fill="${face[0] === 'f' ? '#c0392b' : '#1f5fae'}"/>` : ''}</svg>`;
}

const cache = new Map();
export function tileSvg(face, style = 'classic') {
  const key = style + ':' + face;
  if (!cache.has(key)) {
    let svg;
    if (EMOJI_LISTS[style]) svg = emojiSvg(face, style);
    else if (style === 'contrast') svg = faceSvg(face).replace('<svg viewBox="0 0 60 80"', '<svg viewBox="4 6 52 68"').replace(/#1e8449/g, '#0b5d2e').replace(/#1f5fae/g, '#0b3f8a').replace(/#c0392b/g, '#a3170c');
    else svg = faceSvg(face);
    cache.set(key, svg);
  }
  return cache.get(key);
}

// Todos os tipos de peça disponíveis
export const KINDS = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(n => ['d', 'b', 'c'].map(s => ({ group: s + n, faces: [s + n] }))),
  ...[1, 2, 3, 4].map(n => ({ group: 'w' + n, faces: ['w' + n] })),
  ...[1, 2, 3].map(n => ({ group: 'r' + n, faces: ['r' + n] })),
  { group: 'f', faces: ['f1', 'f2', 'f3', 'f4'] },
  { group: 's', faces: ['s1', 's2', 's3', 's4'] },
];
