// Móveis da toca da Avó Rosa, em SVG, no traço dos azulejos.
// Cada divisão é desenhada num quadro de 160x110: parede de 0 a 80, chão de 80 a 110.
import { C, C2, C3, O, W, R, G } from './art.js';

const WOOD = '#a8743f', WOOD_D = '#7c4f2a', POT = '#c4643d';
const s = 'stroke="' + C + '" stroke-width="1.6" stroke-linejoin="round"';

// Planta num vaso (usada em várias divisões)
const plant = (x, y, k = 1) => `
  <path d="M${x - 9 * k} ${y - 14 * k} h${18 * k} l${-3 * k} ${14 * k} h${-12 * k}z" fill="${POT}" ${s}/>
  ${[[-7, -26, -25], [0, -32, 0], [7, -26, 25], [-3, -22, -10], [4, -22, 12]].map(([dx, dy, a]) =>
    `<ellipse cx="${x + dx * k}" cy="${y + dy * k}" rx="${4 * k}" ry="${9 * k}" fill="${G}" ${s} transform="rotate(${a} ${x + dx * k} ${y + dy * k})"/>`).join('')}`;

// Janela com portadas
const window_ = (x, y, w = 30, h = 34) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#cfe0f7" ${s}/>
  <path d="M${x + w / 2} ${y} v${h} M${x} ${y + h / 2} h${w}" stroke="${C}" stroke-width="1.6"/>
  <rect x="${x - 9}" y="${y}" width="8" height="${h}" fill="${C2}" ${s}/><rect x="${x + w + 1}" y="${y}" width="8" height="${h}" fill="${C2}" ${s}/>
  <rect x="${x - 3}" y="${y + h}" width="${w + 6}" height="4" fill="${W}" ${s}/>`;

export const ROOM_ART = [
  // 0 Cozinha: fogão de lenha com panela, mesa com pão e bule
  () => `
    <rect x="10" y="50" width="44" height="48" rx="3" fill="${W}" ${s}/>
    <rect x="16" y="66" width="32" height="20" rx="2" fill="#2b2b2b" ${s}/><path d="M22 82 q4 -8 8 0 q4 -10 8 0 q4 -6 6 0" fill="${O}"/>
    <path d="M10 50 h44 v8 h-44z" fill="${C2}" ${s}/>
    <path d="M20 50 v-10 h22 v10" fill="${R}" ${s}/><path d="M18 40 h26" stroke="${C}" stroke-width="2.4"/><path d="M28 34 q2 -6 0 -10 M34 34 q2 -6 0 -10" stroke="#9aa3b5" stroke-width="1.6" fill="none"/>
    <rect x="96" y="70" width="54" height="6" fill="${WOOD}" ${s}/><path d="M100 76 v24 M146 76 v24" stroke="${WOOD_D}" stroke-width="4"/>
    <path d="M104 70 q8 -12 22 -6 q-2 6 -22 6z" fill="#d9a066" ${s}/><path d="M110 64 l2 3 M116 62 l2 4 M122 63 l1 4" stroke="${WOOD_D}" stroke-width="1.2"/>
    <ellipse cx="138" cy="62" rx="8" ry="7" fill="${C2}" ${s}/><path d="M146 60 l6 -4" stroke="${C}" stroke-width="2.2"/><circle cx="138" cy="54" r="2" fill="${O}" ${s}/>`,

  // 1 Pátio: fonte de pedra, vaso com planta, gato a dormir
  () => `
    <path d="M58 98 h44 l-4 -12 h-36z" fill="#e8e1d2" ${s}/>
    <rect x="76" y="58" width="8" height="28" fill="#e8e1d2" ${s}/><ellipse cx="80" cy="58" rx="16" ry="5" fill="#e8e1d2" ${s}/>
    <path d="M80 54 q-10 -16 -20 -4 M80 54 q10 -16 20 -4" stroke="${C2}" stroke-width="2.5" fill="none"/>
    <ellipse cx="80" cy="86" rx="20" ry="4" fill="${C3}" ${s}/>
    ${plant(24, 100)}
    <path d="M118 100 q0 -14 14 -14 q14 0 14 14z" fill="${O}" ${s}/><circle cx="144" cy="92" r="7" fill="${O}" ${s}/>
    <path d="M139 86 l2 -5 l3 4 M146 85 l3 -4 l1 5" fill="${O}" ${s}/><path d="M142 93 q2 1 4 0" stroke="${C}" stroke-width="1.2" fill="none"/>
    <path d="M118 100 q-6 -2 -2 -8" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M150 74 l3 -3 m2 6 l4 -2" stroke="${C}" stroke-width="1.2"/><text x="152" y="70" font-size="8" fill="${C}">z</text>`,

  // 2 Fachada: porta em arco, janela com vasos, candeeiro de rua
  () => `
    <path d="M62 104 v-46 q18 -20 36 0 v46z" fill="${C2}" ${s}/><path d="M80 104 v-52" stroke="${C}" stroke-width="1.4"/>
    <circle cx="74" cy="82" r="2" fill="${O}"/><circle cx="86" cy="82" r="2" fill="${O}"/>
    <rect x="58" y="102" width="44" height="6" fill="#e8e1d2" ${s}/>
    ${window_(18, 26)}
    <rect x="14" y="62" width="38" height="8" fill="${POT}" ${s}/>${[20, 30, 40, 48].map((x, k) => `<circle cx="${x}" cy="58" r="4" fill="${[R, '#e86aa6', R, O][k]}" ${s}/>`).join('')}
    <path d="M136 106 v-62" stroke="#2b2b2b" stroke-width="3"/><path d="M136 46 q10 0 10 10" stroke="#2b2b2b" stroke-width="2.4" fill="none"/>
    <path d="M140 56 h12 l-2 12 h-8z" fill="${O}" ${s}/><path d="M138 56 h16 l-8 -6z" fill="#2b2b2b"/>`,

  // 3 Sala: sofá, rádio antigo numa mesa, relógio de pé
  () => `
    <path d="M14 98 v-22 q0 -8 8 -8 h52 q8 0 8 8 v22z" fill="${R}" ${s}/>
    <rect x="10" y="78" width="12" height="20" rx="5" fill="${R}" ${s}/><rect x="74" y="78" width="12" height="20" rx="5" fill="${R}" ${s}/>
    <rect x="22" y="84" width="52" height="10" rx="3" fill="#d9584a" ${s}/><path d="M18 98 v6 M78 98 v6" stroke="${WOOD_D}" stroke-width="3"/>
    <rect x="34" y="70" width="12" height="12" rx="3" fill="${O}" ${s}/>
    <rect x="96" y="80" width="26" height="6" fill="${WOOD}" ${s}/><path d="M100 86 v18 M118 86 v18" stroke="${WOOD_D}" stroke-width="3"/>
    <path d="M98 80 v-14 q11 -10 22 0 v14z" fill="${WOOD}" ${s}/><circle cx="109" cy="70" r="5" fill="#f3e6c8" ${s}/><circle cx="104" cy="77" r="1.6" fill="${C}"/><circle cx="114" cy="77" r="1.6" fill="${C}"/>
    <rect x="134" y="30" width="18" height="74" rx="3" fill="${WOOD}" ${s}/><circle cx="143" cy="44" r="7" fill="${W}" ${s}/>
    <path d="M143 44 v-5 M143 44 h4" stroke="${C}" stroke-width="1.4"/><path d="M143 56 v20" stroke="${O}" stroke-width="1.6"/><circle cx="143" cy="78" r="3.5" fill="${O}" ${s}/>`,

  // 4 Oficina: bancada com azulejos, frasco de pincéis, balde de tinta
  () => `
    <rect x="12" y="66" width="92" height="8" fill="${WOOD}" ${s}/><path d="M18 74 v30 M98 74 v30 M18 92 h80" stroke="${WOOD_D}" stroke-width="3.5"/>
    ${[0, 1, 2].map(k => `<g transform="translate(${22 + k * 22} 46)"><rect width="18" height="18" fill="${W}" ${s}/><path d="M9 3 l6 6 l-6 6 l-6 -6z" fill="${[C2, O, C][k]}"/></g>`).join('')}
    <rect x="86" y="50" width="12" height="16" rx="2" fill="${C3}" ${s}/>
    ${[[88, R], [92, O], [96, C2]].map(([x, c]) => `<path d="M${x} 50 l${(x - 92) / 2} -14" stroke="${WOOD_D}" stroke-width="2"/><circle cx="${x + (x - 92) / 2}" cy="35" r="2.4" fill="${c}"/>`).join('')}
    <path d="M118 104 l-4 -26 h32 l-4 26z" fill="#9aa3b5" ${s}/><ellipse cx="130" cy="78" rx="16" ry="4" fill="${C2}" ${s}/>
    <path d="M114 80 q16 -22 32 0" stroke="${C}" stroke-width="1.6" fill="none"/><path d="M140 82 q2 8 -2 14" stroke="${C2}" stroke-width="4" stroke-linecap="round"/>`,

  // 5 Quarto: cama com manta de azulejo, mesa de cabeceira com vela, peluche
  () => `
    <rect x="12" y="50" width="10" height="54" rx="2" fill="${WOOD}" ${s}/>
    <rect x="20" y="78" width="88" height="16" rx="3" fill="${W}" ${s}/><path d="M22 94 v10 M106 94 v10" stroke="${WOOD_D}" stroke-width="3"/>
    <rect x="24" y="68" width="22" height="12" rx="5" fill="${W}" ${s}/>
    <path d="M48 76 h60 v18 h-60z" fill="${C2}" ${s}/>${[56, 72, 88, 100].map(x => `<path d="M${x} 80 l4 4 l-4 4 l-4 -4z" fill="${O}"/>`).join('')}
    <rect x="120" y="76" width="26" height="28" rx="2" fill="${WOOD}" ${s}/><circle cx="133" cy="90" r="2" fill="${O}"/>
    <rect x="130" y="62" width="6" height="14" fill="${W}" ${s}/><path d="M133 62 q-3 -6 0 -10 q3 4 0 10z" fill="${O}"/>
    <circle cx="36" cy="64" r="6" fill="#c99a63" ${s}/><circle cx="31" cy="59" r="2.5" fill="#c99a63" ${s}/><circle cx="41" cy="59" r="2.5" fill="#c99a63" ${s}/>
    <circle cx="34" cy="63" r="1" fill="${C}"/><circle cx="38" cy="63" r="1" fill="${C}"/>`,

  // 6 Escadas: degraus com corrimão, quadro na parede, vaso
  () => `
    ${[0, 1, 2, 3, 4].map(k => `<rect x="${60 + k * 14}" y="${92 - k * 12}" width="${100 - (60 + k * 14) + 60}" height="12" fill="${WOOD}" ${s}/>`).join('')}
    <path d="M58 72 L130 18" stroke="${WOOD_D}" stroke-width="3"/>${[0, 1, 2, 3, 4].map(k => `<path d="M${66 + k * 14} ${92 - k * 12} v-18" stroke="${WOOD_D}" stroke-width="2"/>`).join('')}
    <rect x="16" y="20" width="32" height="26" fill="${W}" stroke="${O}" stroke-width="3"/><path d="M20 42 l8 -10 l6 6 l4 -4 l6 8z" fill="${C2}"/><circle cx="40" cy="27" r="3" fill="${O}"/>
    ${plant(30, 104, 0.9)}`,

  // 7 Jardim: árvore de fruto, canteiro de flores, regador
  () => `
    <rect x="30" y="44" width="8" height="60" fill="${WOOD_D}" ${s}/>
    <circle cx="34" cy="34" r="24" fill="${G}" ${s}/><circle cx="18" cy="44" r="12" fill="#4f9a62" ${s}/><circle cx="50" cy="44" r="12" fill="#4f9a62" ${s}/>
    ${[[26, 28], [42, 30], [34, 44], [20, 40], [48, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${O}" ${s}/>`).join('')}
    <path d="M66 104 v-10 h52 v10z" fill="#8b5a2b" ${s}/>
    ${[72, 84, 96, 108].map((x, k) => `<path d="M${x} 94 v-16" stroke="${G}" stroke-width="2"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="${74}" rx="2.6" ry="4.5" fill="${[R, '#e86aa6', O, C2][k]}" transform="rotate(${a} ${x} 78)"/>`).join('')}<circle cx="${x}" cy="78" r="2" fill="${O}"/>`).join('')}
    <path d="M128 104 v-18 h18 v18z" fill="${C2}" ${s}/><path d="M146 90 l10 -8" stroke="${C}" stroke-width="3"/><path d="M128 90 q-8 -6 0 -10" stroke="${C}" stroke-width="2.4" fill="none"/>`,

  // 8 Varanda: grade de ferro forjado, cadeira, mesa com chávena, pôr-do-sol
  () => `
    <circle cx="124" cy="36" r="16" fill="${O}" opacity=".85"/>
    <path d="M6 64 h148" stroke="#2b2b2b" stroke-width="3"/><path d="M6 100 h148" stroke="#2b2b2b" stroke-width="3"/>
    ${Array.from({ length: 13 }, (_, k) => `<path d="M${12 + k * 12} 64 v36" stroke="#2b2b2b" stroke-width="1.6"/>`).join('')}
    ${Array.from({ length: 6 }, (_, k) => `<path d="M${18 + k * 24} 82 q6 -8 12 0 q-6 8 -12 0z" fill="none" stroke="#2b2b2b" stroke-width="1.4"/>`).join('')}
    <path d="M30 104 v-26 h22 v26 M30 84 h22 M34 78 v-18 h14 v18" fill="${C2}" ${s}/>
    <rect x="70" y="80" width="30" height="5" fill="${WOOD}" ${s}/><path d="M85 85 v19" stroke="${WOOD_D}" stroke-width="3"/>
    <path d="M78 80 v-6 h12 v6z" fill="${W}" ${s}/><path d="M90 76 q4 0 0 4" stroke="${C}" stroke-width="1.4" fill="none"/><path d="M82 72 q2 -4 0 -7 M86 72 q2 -4 0 -7" stroke="#9aa3b5" stroke-width="1.2" fill="none"/>`,

  // 9 Torreão: telescópio, janela com estrelas, mapa enrolado
  () => `
    <rect x="96" y="12" width="44" height="50" rx="22" fill="#25407e" ${s}/>
    ${[[108, 28], [124, 22], [118, 42], [130, 36], [106, 46]].map(([x, y]) => `<path d="M${x} ${y - 3} l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1z" fill="${O}"/>`).join('')}
    <path d="M42 104 l12 -30 l12 30 M54 74 v30" stroke="${WOOD_D}" stroke-width="3" fill="none"/>
    <path d="M40 66 l46 -22 l5 10 l-46 22z" fill="${O}" ${s}/><rect x="80" y="40" width="10" height="16" rx="2" fill="${C2}" ${s}/>
    <path d="M110 104 v-8 h36 v8z" fill="${WOOD}" ${s}/>
    <rect x="112" y="84" width="30" height="12" rx="6" fill="#f3e6c8" ${s}/><path d="M118 88 h18 M118 92 h12" stroke="${C2}" stroke-width="1.4"/><circle cx="112" cy="90" r="6" fill="#e8d9b4" ${s}/>`,
];
