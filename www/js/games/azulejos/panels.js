// Os 10 painéis de azulejo (320x400), um por sítio, e os padrões para a toca.
import { C, C2, C3, O, W, R, G } from './art.js';

const frame = inner => `<svg viewBox="0 0 320 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="320" height="400" fill="#fbfcfe"/>
  ${Array.from({ length: 16 }, (_, i) => `<circle cx="${10 + i * 20}" cy="10" r="7" fill="none" stroke="${C2}" stroke-width="3"/><circle cx="${10 + i * 20}" cy="390" r="7" fill="none" stroke="${C2}" stroke-width="3"/>`).join('')}
  ${Array.from({ length: 19 }, (_, i) => `<circle cx="10" cy="${30 + i * 20}" r="7" fill="none" stroke="${C2}" stroke-width="3"/><circle cx="310" cy="${30 + i * 20}" r="7" fill="none" stroke="${C2}" stroke-width="3"/>`).join('')}
  <rect x="22" y="22" width="276" height="356" fill="none" stroke="${C}" stroke-width="4"/>
  <g>${inner}</g>
  ${[1, 2, 3].map(c => `<line x1="${c * 80}" y1="0" x2="${c * 80}" y2="400" stroke="rgba(22,33,59,.12)"/>`).join('')}${[1, 2, 3, 4].map(r => `<line x1="0" y1="${r * 80}" x2="320" y2="${r * 80}" stroke="rgba(22,33,59,.12)"/>`).join('')}
</svg>`;

const sunAt = (x, y, r = 30) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${O}" opacity=".9"/>${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<line x1="${x + Math.cos(a) * (r + 8)}" y1="${y + Math.sin(a) * (r + 8)}" x2="${x + Math.cos(a) * (r + 18)}" y2="${y + Math.sin(a) * (r + 18)}" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`; }).join('')}`;
const moonAt = (x, y) => `<path d="M${x + 10} ${y - 28} A30 30 0 1 0 ${x + 28} ${y + 14} A22 22 0 1 1 ${x + 10} ${y - 28}Z" fill="${O}"/>`;
const birds = pts => pts.map(([x, y]) => `<path d="M${x - 12} ${y} q6 -8 12 0 q6 -8 12 0" fill="none" stroke="${C}" stroke-width="3" stroke-linecap="round"/>`).join('');
const waves = (y0, rows = 4) => `<rect x="22" y="${y0}" width="276" height="${378 - y0}" fill="${C2}"/>${Array.from({ length: rows }, (_, r) => Array.from({ length: 7 }, (_, i) => `<path d="M${30 + i * 40 + (r % 2) * 20} ${y0 + 14 + r * 18} q10 -8 20 0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/>`).join('')).join('')}`;
const tree = (x, y, s = 1) => `<rect x="${x - 4 * s}" y="${y}" width="${8 * s}" height="${30 * s}" fill="#6b4a2a"/><circle cx="${x}" cy="${y - 4 * s}" r="${24 * s}" fill="#5f9a62" stroke="${C}" stroke-width="2"/><circle cx="${x - 14 * s}" cy="${y + 8 * s}" r="${14 * s}" fill="#78ad6f" stroke="${C}" stroke-width="2"/>`;
const house = (x, y, roof = '#c4643d') => `<rect x="${x}" y="${y}" width="26" height="34" fill="#fff" stroke="${C}" stroke-width="2.5"/><path d="M${x - 3} ${y} L${x + 13} ${y - 13} L${x + 29} ${y}Z" fill="${roof}"/><rect x="${x + 9}" y="${y + 12}" width="8" height="10" fill="${C2}"/>`;

const SCENES = [
  // Ribeira Azul: casario, castelo, rio, barco e elétrico
  () => `${sunAt(230, 90)}${birds([[70, 70], [100, 92], [130, 60]])}
    <path d="M22 250 C80 190, 160 180, 298 215 L298 300 L22 300Z" fill="${C3}"/>
    ${Array.from({ length: 9 }, (_, i) => house(34 + i * 29, 214 - Math.sin(i / 2.2) * 18 + (i % 2) * 8, i % 3 === 0 ? O : C2)).join('')}
    <rect x="128" y="150" width="64" height="38" fill="#fff" stroke="${C}" stroke-width="3"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${128 + i * 14}" y="141" width="8" height="10" fill="${C}"/>`).join('')}
    ${waves(300)}<path d="M110 330 L190 330 L176 348 L124 348Z" fill="#fff" stroke="${C}" stroke-width="2.5"/><path d="M150 330 L150 286 L178 326Z" fill="#fff" stroke="${C}" stroke-width="2.5"/>
    <rect x="196" y="262" width="70" height="30" rx="6" fill="${O}" stroke="${C}" stroke-width="2.5"/>${[0, 1, 2, 3].map(i => `<rect x="${202 + i * 15}" y="268" width="11" height="10" fill="#fff"/>`).join('')}`,
  // Bosque da Névoa: palácio colorido entre árvores e névoa
  () => `${moonAt(240, 80)}
    <rect x="110" y="120" width="100" height="90" fill="${O}" stroke="${C}" stroke-width="3"/><circle cx="160" cy="112" r="26" fill="${R}" stroke="${C}" stroke-width="3"/><rect x="92" y="96" width="24" height="114" fill="${C2}" stroke="${C}" stroke-width="3"/><circle cx="104" cy="92" r="14" fill="${O}" stroke="${C}" stroke-width="3"/>
    ${[[140, 150], [176, 150], [140, 180], [176, 180]].map(([x, y]) => `<path d="M${x} ${y + 20} v-12 q6 -10 12 0 v12z" fill="#fff" stroke="${C}" stroke-width="2"/>`).join('')}
    ${tree(56, 230)}${tree(266, 236)}${tree(70, 300, 0.8)}${tree(250, 306, 0.9)}
    <rect x="22" y="260" width="276" height="118" fill="#8fb58a"/>${[240, 268, 300, 334].map(y => `<path d="M22 ${y} q46 -16 92 0 q46 16 92 0 q46 -16 92 0" fill="none" stroke="#fff" stroke-width="7" opacity=".7"/>`).join('')}`,
  // Vila Muralhada: muralha, porta e torre
  () => `${sunAt(80, 80, 24)}${birds([[200, 70], [232, 92]])}
    <path d="M22 160 h276 v140 h-276z" fill="#efe6d4" stroke="${C}" stroke-width="3"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${24 + i * 20}" y="146" width="12" height="16" fill="#efe6d4" stroke="${C}" stroke-width="2"/>`).join('')}
    ${Array.from({ length: 6 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<rect x="${30 + c * 30 + (r % 2) * 15}" y="${172 + r * 20}" width="28" height="18" fill="none" stroke="${C3}" stroke-width="1.5"/>`).join('')).join('')}
    <path d="M128 300 v-80 q32 -40 64 0 v80z" fill="${C2}" stroke="${C}" stroke-width="3"/><circle cx="182" cy="262" r="4" fill="${O}"/>
    <rect x="236" y="96" width="44" height="64" fill="#efe6d4" stroke="${C}" stroke-width="3"/>${[0, 1, 2].map(i => `<rect x="${236 + i * 16}" y="86" width="12" height="12" fill="#efe6d4" stroke="${C}" stroke-width="2"/>`).join('')}<path d="M258 86 V58 L278 66 L258 72" fill="${R}" stroke="${C}" stroke-width="2"/>
    <rect x="22" y="300" width="276" height="78" fill="#8fb58a"/><path d="M160 300 L140 378 H180Z" fill="#d9c7a3"/>`,
  // Torre dos Mil Livros: torre alta, estrelas, estantes
  () => `${moonAt(70, 70)}${[[200, 50], [250, 90], [150, 70], [270, 40]].map(([x, y]) => `<path d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z" fill="${O}"/>`).join('')}
    <rect x="120" y="100" width="80" height="230" fill="#fff" stroke="${C}" stroke-width="3"/><path d="M110 100 L160 40 L210 100Z" fill="${C2}" stroke="${C}" stroke-width="3"/>
    ${[0, 1, 2, 3].map(r => `<rect x="134" y="${120 + r * 50}" width="52" height="34" fill="${C3}" stroke="${C}" stroke-width="2"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${138 + i * 9}" y="${126 + r * 50}" width="7" height="24" fill="${[R, O, G, C2, '#7a3e9b'][(i + r) % 5]}"/>`).join('')}`).join('')}
    <rect x="22" y="330" width="276" height="48" fill="#b8a7d8"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${36 + i * 44}" y="300" width="30" height="40" rx="3" fill="${[R, O, G, C2, '#7a3e9b', R][i]}" stroke="${C}" stroke-width="2" transform="rotate(${i % 2 ? 8 : -6} ${51 + i * 44} 320)"/>`).join('')}`,
  // Vale das Fogueiras: arraial, balões, fogueira
  () => `<rect x="22" y="22" width="276" height="200" fill="#25407e"/>${moonAt(250, 70)}
    ${[0, 1, 2].map(k => `<path d="M22 ${100 + k * 40} Q160 ${150 + k * 40} 298 ${100 + k * 40}" fill="none" stroke="#fff" stroke-width="1.5"/>${Array.from({ length: 8 }, (_, i) => { const x = 40 + i * 34, y = 100 + k * 40 + Math.sin((i / 7) * Math.PI) * 44; return `<path d="M${x - 8} ${y} h16 l3 18 h-22z" fill="${[R, O, G, C2][(i + k) % 4]}" stroke="#fff" stroke-width="1"/>`; }).join('')}`).join('')}
    <rect x="22" y="222" width="276" height="156" fill="#8fb58a"/>
    <path d="M140 330 q20 -70 20 -90 q10 30 20 90z" fill="${O}"/><path d="M150 330 q10 -40 10 -56 q6 20 12 56z" fill="${R}"/><path d="M128 334 l64 -10 M128 324 l64 10" stroke="#6b4a2a" stroke-width="7" stroke-linecap="round"/>
    ${[[60, 300], [250, 300]].map(([x, y]) => `<path d="M${x - 14} ${y} h28 l-4 22 h-20z" fill="#c4643d" stroke="${C}" stroke-width="2"/>${[[-8, -8], [0, -14], [8, -8], [-4, -2], [4, -2]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="7" fill="${G}" stroke="${C}" stroke-width="1.5"/>`).join('')}`).join('')}`,
  // Encostas do Vinhedo: socalcos, lagar, uvas
  () => `${sunAt(250, 70, 22)}
    ${Array.from({ length: 7 }, (_, i) => `<path d="M22 ${130 + i * 34} Q160 ${110 + i * 34} 298 ${140 + i * 34} L298 ${164 + i * 34} Q160 ${134 + i * 34} 22 ${154 + i * 34}Z" fill="${i % 2 ? '#a9c88a' : '#94b878'}" stroke="${C}" stroke-width="1.5"/>${Array.from({ length: 8 }, (_, k) => `<circle cx="${40 + k * 34}" cy="${138 + i * 34 - Math.sin(k / 7 * Math.PI) * 10}" r="5" fill="#7a3e9b"/>`).join('')}`).join('')}
    <rect x="44" y="70" width="80" height="50" fill="#fff" stroke="${C}" stroke-width="3"/><path d="M38 70 L84 40 L130 70Z" fill="#c4643d" stroke="${C}" stroke-width="3"/><path d="M74 120 v-24 q10 -12 20 0 v24z" fill="${C2}"/>`,
  // Serra Gelada: montanhas com neve, pinheiros, rebanho
  () => `<rect x="22" y="22" width="276" height="356" fill="#dfeaf7"/>${sunAt(70, 70, 20)}
    <path d="M22 260 L110 100 L170 200 L220 120 L298 250 L298 378 L22 378Z" fill="${C3}" stroke="${C}" stroke-width="3"/>
    <path d="M86 144 L110 100 L134 144 L120 136 L110 150 L98 136Z M200 156 L220 120 L240 156 L228 150 L220 160 L212 150Z" fill="#fff" stroke="${C}" stroke-width="2"/>
    ${[[60, 300], [90, 320], [240, 300], [270, 320]].map(([x, y]) => `<path d="M${x} ${y - 40} L${x + 18} ${y} H${x - 18}Z" fill="#3f7a52" stroke="${C}" stroke-width="2"/><path d="M${x - 6} ${y - 26} L${x} ${y - 40} L${x + 6} ${y - 26}Z" fill="#fff"/>`).join('')}
    ${[[140, 330], [170, 340], [196, 328]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="10" fill="#fff" stroke="${C}" stroke-width="2"/><circle cx="${x + 13}" cy="${y - 4}" r="5" fill="#3a3a3a"/>`).join('')}`,
  // Planície dos Sobreiros: sobreiros, cegonhas, templo
  () => `${sunAt(240, 90, 34)}
    <rect x="22" y="230" width="276" height="148" fill="#e3c98a"/>
    <rect x="96" y="150" width="128" height="16" fill="#fff" stroke="${C}" stroke-width="3"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${102 + i * 26}" y="166" width="12" height="64" fill="#fff" stroke="${C}" stroke-width="2.5"/>`).join('')}<rect x="90" y="230" width="140" height="10" fill="#fff" stroke="${C}" stroke-width="2.5"/>
    ${[[52, 290], [270, 300]].map(([x, y]) => `<path d="M${x} ${y + 40} q-4 -30 0 -50" stroke="#8b5a2b" stroke-width="10" fill="none"/><ellipse cx="${x}" cy="${y - 16}" rx="40" ry="22" fill="#7f9a50" stroke="${C}" stroke-width="2"/><path d="M${x - 14} ${y - 38} q14 -8 28 0" fill="#8b5a2b"/><ellipse cx="${x + 2}" cy="${y - 48}" rx="10" ry="6" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M${x + 10} ${y - 50} l12 4" stroke="#e0662b" stroke-width="3"/>`).join('')}`,
  // Costa das Grutas: arcos de rocha, gruta, barco
  () => `${sunAt(90, 80, 24)}${birds([[200, 60], [236, 80]])}
    <path d="M150 300 V160 Q200 120 298 150 V300Z" fill="#e2a868" stroke="${C}" stroke-width="3"/><path d="M190 300 v-70 q30 -40 60 0 v70z" fill="#3f4a66"/>
    <path d="M22 300 V190 Q60 160 110 190 V300Z" fill="#e8b878" stroke="${C}" stroke-width="3"/><path d="M48 300 v-40 q16 -24 32 0 v40z" fill="${C2}"/>
    ${waves(300)}<path d="M124 340 L196 340 L184 356 L136 356Z" fill="${O}" stroke="${C}" stroke-width="2.5"/><path d="M160 340 V300 L184 334Z" fill="#fff" stroke="${C}" stroke-width="2"/>`,
  // Ilhas Flutuantes: ilhas no céu, cascatas, o camaleão com cores
  () => `<rect x="22" y="22" width="276" height="356" fill="#e3ecfb"/>${sunAt(250, 70, 22)}
    ${[[90, 150, 60], [230, 200, 50], [130, 290, 70]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.28}" fill="#8fb58a" stroke="${C}" stroke-width="2.5"/><path d="M${x - r} ${y} Q${x} ${y + r * 0.9} ${x + r} ${y}Z" fill="#c99a63" stroke="${C}" stroke-width="2.5"/><path d="M${x + r * 0.4} ${y + 8} v${r * 0.8}" stroke="${C2}" stroke-width="4" stroke-dasharray="4 4"/>`).join('')}
    ${[[80, 136], [100, 138]].map(([x, y]) => house(x - 13, y - 30, O)).join('')}
    <ellipse cx="140" cy="270" rx="26" ry="14" fill="#4fb06a" stroke="${C}" stroke-width="2.5"/><circle cx="158" cy="266" r="7" fill="#fff" stroke="${C}" stroke-width="2"/><circle cx="159" cy="266" r="3" fill="#22252c"/><path d="M116 274 q-12 4 -8 12 q6 6 10 -2" stroke="${O}" stroke-width="4" fill="none"/>`,
];

const panelCache = new Map();
export function panelSvg(placeI) {
  const k = placeI % SCENES.length;
  if (!panelCache.has(k)) panelCache.set(k, frame(SCENES[k]()));
  return panelCache.get(k);
}

// Cena do painel sem moldura, para o fundo do ecrã de jogo.
const sceneCache = new Map();
export function sceneSvg(placeI) {
  const k = placeI % SCENES.length;
  if (!sceneCache.has(k)) sceneCache.set(k, `<svg viewBox="22 22 276 356" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="0" y="0" width="320" height="400" fill="#fbfcfe"/>${SCENES[k]()}</svg>`);
  return sceneCache.get(k);
}

// Ordem em que as peças ganham cor (de baixo para cima).
export const PIECE_ORDER = [17, 18, 16, 19, 13, 14, 12, 15, 9, 10, 8, 11, 5, 6, 4, 7, 1, 2, 0, 3];

// ---------- Padrões de azulejo para a toca (SVG 60x60, repetível) ----------
export const PATTERNS = [
  { id: 'p1', name: 'Estrela de Alfama', svg: `<rect width="60" height="60" fill="#fdfdfb"/><path d="M30 6 L36 24 L54 30 L36 36 L30 54 L24 36 L6 30 L24 24Z" fill="${C2}"/><circle cx="30" cy="30" r="6" fill="${O}"/>${[[0, 0], [60, 0], [0, 60], [60, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${C}" stroke-width="3"/>`).join('')}` },
  { id: 'p2', name: 'Flor do pátio', svg: `<rect width="60" height="60" fill="#fdfdfb"/>${[0, 90, 180, 270].map(a => `<ellipse cx="30" cy="14" rx="7" ry="12" fill="${C}" transform="rotate(${a} 30 30)"/>`).join('')}<circle cx="30" cy="30" r="7" fill="${O}"/><rect x="1" y="1" width="58" height="58" fill="none" stroke="${C2}" stroke-width="2"/>` },
  { id: 'p3', name: 'Xadrez azul', svg: `<rect width="60" height="60" fill="#fdfdfb"/><rect width="30" height="30" fill="${C2}"/><rect x="30" y="30" width="30" height="30" fill="${C2}"/><circle cx="15" cy="15" r="6" fill="#fdfdfb"/><circle cx="45" cy="45" r="6" fill="#fdfdfb"/>` },
  { id: 'p4', name: 'Folhas amarelas', svg: `<rect width="60" height="60" fill="#fdfdfb"/>${[0, 90, 180, 270].map(a => `<path d="M30 30 Q30 8 48 6 Q46 26 30 30Z" fill="${O}" stroke="${C}" stroke-width="1.5" transform="rotate(${a} 30 30)"/>`).join('')}<circle cx="30" cy="30" r="4" fill="${C}"/>` },
  { id: 'p5', name: 'Ondas do rio', svg: `<rect width="60" height="60" fill="#fdfdfb"/>${[12, 30, 48].map(y => `<path d="M0 ${y} q7.5 -10 15 0 q7.5 10 15 0 q7.5 -10 15 0 q7.5 10 15 0" stroke="${C2}" stroke-width="4" fill="none"/>`).join('')}` },
  { id: 'p6', name: 'Rosácea', svg: `<rect width="60" height="60" fill="#fdfdfb"/><circle cx="30" cy="30" r="22" fill="none" stroke="${C}" stroke-width="3"/>${Array.from({ length: 8 }, (_, i) => `<ellipse cx="30" cy="16" rx="4" ry="9" fill="${i % 2 ? O : C2}" transform="rotate(${i * 45} 30 30)"/>`).join('')}<circle cx="30" cy="30" r="5" fill="${R}"/>` },
];

// Desenho de um azulejo pintado pelo jogador (formas com simetria de 4).
export const PAINT_SHAPES = [
  { id: 'corner', d: 'M0 0 L28 0 A28 28 0 0 1 0 28 Z', rot: true },
  { id: 'petal', d: 'M60 18 Q70 30 60 42 Q50 30 60 18 Z', rot: true },
  { id: 'leaf', d: 'M30 30 Q44 34 46 46 Q34 44 30 30 Z', rot: true },
  { id: 'dot', d: 'M60 84 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', rot: true },
  { id: 'ring', d: 'M60 30 A30 30 0 1 1 59.9 30 Z M60 36 A24 24 0 1 0 60.1 36 Z', ring: true },
  { id: 'center', d: 'M60 42 L78 60 L60 78 L42 60 Z' },
];
export const PAINT_COLORS = [C, C2, C3, O, R, G, '#7a3e9b', '#ffffff'];
export function paintingSvg(fills, size = 120) {
  const body = PAINT_SHAPES.map(s => {
    const f = fills[s.id] || '#ffffff';
    if (!s.rot) return `<path d="${s.d}" data-s="${s.id}" fill="${f}" stroke="${C}" stroke-width="1.2" fill-rule="evenodd"/>`;
    return [0, 90, 180, 270].map(a => `<path d="${s.d}" data-s="${s.id}" fill="${f}" stroke="${C}" stroke-width="1.2" transform="rotate(${a} 60 60)"/>`).join('');
  }).join('');
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#fdfdfb"/>${body}<rect x="1" y="1" width="118" height="118" fill="none" stroke="${C}" stroke-width="2"/></svg>`;
}
