// Desenho da Colmeia em SVG: hexágonos com volume, ícones dos objetivos, abelha e prado.
export const SQ3 = Math.sqrt(3);
export const PAL = { 2: ['#3fd0c0', '#1f8f84'], 4: ['#f07ab8', '#b23e7d'], 8: ['#f2705f', '#b33c2e'], 16: ['#f7c04a', '#c08712'], 32: ['#7ccf55', '#428a26'], 64: ['#5aa0f0', '#2c62b3'], 128: ['#42cde0', '#1b8b9c'], 256: ['#b07af0', '#6f3cb3'], 512: ['#e8609c', '#a42c63'], 1024: ['#ff7a3d', '#b8431a'], 2048: ['#ffcf3f', '#c79300'], 4096: ['#6b6be0', '#34349a'], 8192: ['#2fb36b', '#17703f'] };
export const pal = v => PAL[v] || ['#4a3b2c', '#231a10'];
export const label = v => (v >= 100000 ? `${Math.round(v / 1000)}K` : v >= 10000 ? `${(v / 1000).toFixed(0)}K` : v);
export const hexPts = (x, y, s) => Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 180 * (60 * k - 30); return `${(x + s * Math.cos(a)).toFixed(1)},${(y + s * Math.sin(a)).toFixed(1)}`; }).join(' ');

export const miniHex = v => `<svg viewBox="0 0 40 42" aria-hidden="true"><polygon points="${hexPts(20, 24, 16)}" fill="${pal(v)[1]}"/><polygon points="${hexPts(20, 21, 16)}" fill="${pal(v)[0]}"/><text x="20" y="22" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-weight="800" font-size="${String(label(v)).length > 2 ? 11 : 14}" fill="#fff" stroke="rgba(0,0,0,.3)" stroke-width="1" paint-order="stroke">${label(v)}</text></svg>`;
const ICON = {
  score: '<svg viewBox="0 0 40 42" aria-hidden="true"><path d="M20 4 L25 15 L37 16 L28 24 L31 36 L20 30 L9 36 L12 24 L3 16 L15 15Z" fill="#ffd23f" stroke="#c08712" stroke-width="2" stroke-linejoin="round"/></svg>',
  chain: '<svg viewBox="0 0 40 42" aria-hidden="true"><g fill="none" stroke="#f2705f" stroke-width="4"><rect x="4" y="15" width="16" height="10" rx="5"/><rect x="20" y="15" width="16" height="10" rx="5"/></g></svg>',
  honey: `<svg viewBox="0 0 40 42" aria-hidden="true"><polygon points="${hexPts(20, 21, 16)}" fill="#f5b400" stroke="#b97a00" stroke-width="2"/><path d="M12 14 Q20 10 28 14 L28 22 Q26 30 24 22 Q22 18 20 26 Q18 32 16 22 Q14 18 12 22Z" fill="#ffd95a"/></svg>`,
  stone: `<svg viewBox="0 0 40 42" aria-hidden="true"><polygon points="${hexPts(20, 23, 16)}" fill="#5f5a54"/><polygon points="${hexPts(20, 20, 16)}" fill="#9b958c"/><path d="M12 14 L18 20 L15 27 M24 13 L22 20 L29 24" stroke="#5f5a54" stroke-width="2" fill="none"/></svg>`,
  ice: `<svg viewBox="0 0 40 42" aria-hidden="true"><polygon points="${hexPts(20, 21, 16)}" fill="#bfe8fb" stroke="#5aa8d8" stroke-width="2"/><path d="M20 10 L20 32 M11 15 L29 27 M29 15 L11 27" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
};
export const goalIcon = g => (g.k === 'tile' ? miniHex(g.v) : ICON[g.k]);
export const goalText = g => ({ tile: `Faz um ${g.v}`, score: `${g.n} pontos`, chain: `${g.n}× caminho de ${g.len}+`, honey: `${g.n} de mel`, stone: `${g.n} pedras`, ice: `${g.n} gelos` }[g.k]);

export const BEE = `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="18" cy="14" rx="9" ry="7" fill="#e8f6ff" opacity=".85" transform="rotate(-20 18 14)"/><ellipse cx="30" cy="14" rx="9" ry="7" fill="#e8f6ff" opacity=".85" transform="rotate(20 30 14)"/><ellipse cx="24" cy="28" rx="14" ry="11" fill="#ffd23f" stroke="#3a2a10" stroke-width="2"/><path d="M18 18 L18 38 M26 17 L26 39" stroke="#3a2a10" stroke-width="5"/><circle cx="35" cy="25" r="6" fill="#3a2a10"/><circle cx="37" cy="23" r="1.6" fill="#fff"/><path d="M10 28 L5 30" stroke="#3a2a10" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export function flowers(seed, w, h, count, dy = 0) {
  let x = seed, out = '';
  const r = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
  for (let i = 0; i < count; i++) {
    const fx = r() * w, fy = r() * h + dy, c = ['#ff7ab0', '#fff', '#ffd23f', '#b07af0'][i % 4];
    out += `<g transform="translate(${fx.toFixed(0)} ${fy.toFixed(0)})"><path d="M0 0 L0 10" stroke="#3f8f3a" stroke-width="2"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-5" rx="3" ry="5" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="2.5" fill="#f2a900"/></g>`;
  }
  return out;
}
// Prado com sol e abelhas a voar (fundo do ecrã de jogo)
export const MEADOW = `<svg class="cm-bg" viewBox="0 0 360 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="cmsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fc8f0"/><stop offset=".55" stop-color="#d4f0ff"/><stop offset=".56" stop-color="#9ad672"/><stop offset="1" stop-color="#5aa83f"/></linearGradient>
  <radialGradient id="cmsun"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
  <rect width="360" height="680" fill="url(#cmsky)"/><circle cx="300" cy="70" r="90" fill="url(#cmsun)"/><circle cx="300" cy="70" r="26" fill="#fff2a8"/>
  <path d="M0 380 Q90 320 180 370 T360 350 L360 680 L0 680Z" fill="#86cb62"/><path d="M0 440 Q120 400 220 440 T360 430 L360 680 L0 680Z" fill="#74bd52"/>
  ${flowers(3, 360, 250, 28, 425)}
  ${[0, 1, 2].map(k => `<g><g transform="scale(.5)">${BEE.replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g><animateMotion dur="${9 + k * 4}s" repeatCount="indefinite" path="M${-30 + k * 10} ${120 + k * 140} C 100 ${60 + k * 120}, 220 ${200 + k * 100}, 390 ${110 + k * 150}"/></g>`).join('')}</svg>`;
