// Desenhos da Casa na Serra: 30 ícones coloridos (viewBox 40x40), próprios do jogo,
// para ficarem iguais em todos os telemóveis (sem depender dos emojis do sistema).
const K = '#3a2a2a';   // contorno
const st = (w = 1.6) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shine = (x, y, rx = 2.6, ry = 1.6, a = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".75" transform="rotate(${a} ${x} ${y})"/>`;

export const ICONS = {
  cereja: `<path d="M14 26 Q16 12 26 7 M26 26 Q24 15 26 7" fill="none" ${st(1.8)}/><path d="M26 7 Q31 5 33 9 Q29 11 26 7Z" fill="#5fae3b" ${st(1.2)}/>
    <circle cx="13" cy="28" r="7" fill="#e3263f" ${st()}/><circle cx="27" cy="28" r="7" fill="#c8102e" ${st()}/>${shine(11, 25)}${shine(25, 25)}`,
  banana: `<path d="M9 13 Q8 30 28 33 Q34 33 33 30 Q20 28 15 13Z" fill="#ffd23f" ${st()}/><path d="M15 13 Q19 25 32 30" fill="none" stroke="#e0a800" stroke-width="1.4"/><path d="M8 12 L10 9 L13 11" fill="#7a5a2a" ${st(1.2)}/>`,
  maca: `<path d="M20 12 Q12 8 8 15 Q5 24 11 31 Q15 36 20 33 Q25 36 29 31 Q35 24 32 15 Q28 8 20 12Z" fill="#e8322f" ${st()}/><path d="M20 12 Q20 7 23 5" fill="none" ${st(1.6)}/><path d="M22 9 Q28 5 31 9 Q26 12 22 9Z" fill="#5fae3b" ${st(1.2)}/>${shine(13, 18, 3, 2)}`,
  pera: `<path d="M20 9 Q15 10 15 17 Q15 20 12 24 Q8 31 14 34 Q20 37 26 34 Q32 31 28 24 Q25 20 25 17 Q25 10 20 9Z" fill="#b5d334" ${st()}/><path d="M20 9 L21 4" ${st(1.6)}/><path d="M21 6 Q26 3 28 6 Q24 8 21 6Z" fill="#4f9a2f" ${st(1.1)}/>${shine(16, 25, 2.5, 3.5, 20)}`,
  uvas: `${[[14, 14], [21, 13], [28, 14], [17, 20], [24, 20], [14, 26], [21, 26], [27, 26], [20, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#8e44ad" ${st(1.3)}/><circle cx="${x - 1.4}" cy="${y - 1.4}" r="1.2" fill="#fff" opacity=".6"/>`).join('')}<path d="M21 9 Q22 4 26 3" fill="none" ${st(1.5)}/><path d="M22 7 Q14 3 12 8 Q17 10 22 7Z" fill="#5fae3b" ${st(1.1)}/>`,
  limao: `<ellipse cx="20" cy="21" rx="14" ry="10" fill="#ffe44d" ${st()} transform="rotate(-20 20 21)"/><path d="M6 25 L3 27 M34 17 L37 15" ${st(2)}/>${shine(15, 17, 4, 2)}`,
  morango: `<path d="M20 35 Q8 26 9 17 Q10 11 20 12 Q30 11 31 17 Q32 26 20 35Z" fill="#ef3b48" ${st()}/><path d="M12 12 L16 7 L20 11 L24 7 L28 12 Q20 15 12 12Z" fill="#4f9a2f" ${st(1.2)}/>${[[15, 18], [21, 17], [26, 19], [17, 24], [23, 24], [20, 29], [14, 22], [27, 24]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.3" fill="#ffe7a0"/>`).join('')}`,
  melancia: `<path d="M5 15 Q20 40 35 15Z" fill="#ef3b48" ${st()}/><path d="M5 15 Q20 40 35 15" fill="none" stroke="#3f9a35" stroke-width="4"/><path d="M5 15 L35 15" ${st()}/>${[[13, 20], [20, 23], [27, 20], [17, 27], [23, 27]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.1" ry="1.7" fill="#2b2222"/>`).join('')}`,
  laranja: `<circle cx="20" cy="22" r="13" fill="#ff9a1f" ${st()}/><path d="M20 9 Q21 6 23 5" ${st(1.5)}/><path d="M22 8 Q28 4 31 8 Q26 11 22 8Z" fill="#4f9a2f" ${st(1.1)}/>${[[15, 19], [24, 17], [19, 27], [27, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".8" fill="#d06d00"/>`).join('')}${shine(14, 16, 3.2, 2)}`,
  cenoura: `<path d="M13 13 Q9 17 13 21 L30 36 Q33 36 32 33 L18 12 Q15 10 13 13Z" fill="#ff8a1f" ${st()}/><path d="M14 13 Q8 6 6 9 Q9 13 14 13 M15 12 Q14 4 17 4 Q18 9 16 12 M16 13 Q22 8 23 11 Q20 14 17 14" fill="#4f9a2f" ${st(1.1)}/><path d="M18 21 L21 19 M22 26 L25 24 M26 31 L28 29" stroke="#c45d00" stroke-width="1.3"/>`,
  abobora: `<ellipse cx="20" cy="24" rx="15" ry="11" fill="#ff8a1f" ${st()}/><path d="M20 13 Q14 24 20 35 M20 13 Q26 24 20 35 M10 16 Q8 24 11 32 M30 16 Q32 24 29 32" fill="none" stroke="#c45d00" stroke-width="1.4"/><path d="M19 13 L19 7 Q22 6 23 8 L22 13" fill="#6b8a2f" ${st(1.2)}/>`,
  cogumelo: `<path d="M5 20 Q6 7 20 7 Q34 7 35 20 Q20 24 5 20Z" fill="#e8322f" ${st()}/><path d="M15 21 L14 33 Q20 36 26 33 L25 21Z" fill="#fff4e0" ${st()}/>${[[12, 13, 2.4], [21, 11, 2], [28, 15, 2.6], [17, 17, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}`,
  bolota: `<ellipse cx="20" cy="25" rx="9" ry="11" fill="#c98a45" ${st()}/><path d="M8 18 Q8 9 20 9 Q32 9 32 18 Q20 21 8 18Z" fill="#7a5230" ${st()}/><path d="M20 9 L21 4" ${st(1.8)}/><path d="M11 13 L29 13 M10 16 L30 16" stroke="#5a3a20" stroke-width="1"/>${shine(16, 25, 2, 3, 10)}`,
  pinha: `<path d="M20 5 Q31 13 30 24 Q29 34 20 36 Q11 34 10 24 Q9 13 20 5Z" fill="#9a6235" ${st()}/>${[10, 16, 22, 28].map(y => `<path d="M${13 - (y > 20 ? 1 : 0)} ${y} Q20 ${y + 5} ${27 + (y > 20 ? 1 : 0)} ${y}" fill="none" stroke="${K}" stroke-width="1.2"/>`).join('')}<path d="M20 6 L20 35" stroke="${K}" stroke-width="1" opacity=".5"/>`,
  sino: `<path d="M20 6 Q11 7 11 18 L10 27 L7 30 L33 30 L30 27 L29 18 Q29 7 20 6Z" fill="#f5b72a" ${st()}/><circle cx="20" cy="33" r="3" fill="#c98a12" ${st(1.3)}/><circle cx="20" cy="5" r="2" fill="#c98a12" ${st(1.2)}/>${shine(15, 14, 2, 4, 15)}`,
  gota: `<path d="M20 4 Q31 18 31 25 Q31 35 20 35 Q9 35 9 25 Q9 18 20 4Z" fill="#3ba7f0" ${st()}/>${shine(15, 24, 2.2, 4, 15)}`,
  chama: `<path d="M20 4 Q31 15 31 25 Q31 35 20 35 Q9 35 9 25 Q9 18 15 12 Q15 19 19 20 Q16 12 20 4Z" fill="#ff7a1f" ${st()}/><path d="M20 18 Q26 25 25 29 Q24 34 20 34 Q16 34 15 29 Q15 24 20 18Z" fill="#ffd23f"/>`,
  lupa: `<circle cx="17" cy="17" r="10" fill="#bfe6ff" ${st(2)}/><path d="M24.5 24.5 L34 34" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/><path d="M24.5 24.5 L34 34" ${st(1.2)} fill="none"/>${shine(13, 13, 3.5, 2)}`,
  gelado: `<path d="M12 18 L20 36 L28 18Z" fill="#e3a65a" ${st()}/><path d="M14 22 L26 22 M15 26 L25 26 M17 30 L23 30" stroke="#b97c35" stroke-width="1"/><circle cx="15" cy="15" r="6" fill="#ff9ec0" ${st(1.4)}/><circle cx="25" cy="15" r="6" fill="#fff4d6" ${st(1.4)}/><circle cx="20" cy="9" r="6" fill="#8b5a3c" ${st(1.4)}/><circle cx="21" cy="3.8" r="2" fill="#e3263f" ${st(1.1)}/>`,
  queijo: `<path d="M5 28 L5 20 L32 10 L35 22 L35 30 Z" fill="#ffd23f" ${st()}/><path d="M5 20 L35 22" ${st(1.3)}/><circle cx="14" cy="25" r="2.4" fill="#e0a800"/><circle cx="25" cy="27" r="1.8" fill="#e0a800"/><circle cx="29" cy="24" r="1.4" fill="#e0a800"/><circle cx="20" cy="16" r="1.6" fill="#e0a800"/>`,
  lua: `<path d="M26 5 Q12 7 12 20 Q12 33 26 35 Q14 38 7 28 Q2 18 9 10 Q16 3 26 5Z" fill="#ffd23f" ${st()}/><circle cx="12" cy="17" r="1.6" fill="#e0a800"/><circle cx="15" cy="27" r="2" fill="#e0a800"/>`,
  estrela: `<path d="M20 4 L24.5 14.5 L35.5 15.5 L27 23 L29.5 34 L20 28.2 L10.5 34 L13 23 L4.5 15.5 L15.5 14.5Z" fill="#ffd23f" ${st()}/>${shine(16, 16, 2.4, 1.6)}`,
  coracao: `<path d="M20 34 Q4 24 5 14 Q6 6 13 6 Q18 6 20 11 Q22 6 27 6 Q34 6 35 14 Q36 24 20 34Z" fill="#ef3b5c" ${st()}/>${shine(12, 13, 3, 2)}`,
  floco: `<g stroke="#3ba7f0" stroke-width="3" stroke-linecap="round">${[0, 60, 120].map(a => `<path d="M20 5 L20 35 M20 10 L16 7 M20 10 L24 7 M20 30 L16 33 M20 30 L24 33" transform="rotate(${a} 20 20)"/>`).join('')}</g><circle cx="20" cy="20" r="3" fill="#bfe6ff" ${st(1.2)}/>`,
  caneca: `<path d="M9 12 L28 12 L27 33 Q18 36 10 33Z" fill="#d94b3d" ${st()}/><path d="M28 16 Q35 16 35 22 Q35 28 27 28" fill="none" ${st(3)}/><path d="M28 16 Q35 16 35 22 Q35 28 27 28" fill="none" stroke="#d94b3d" stroke-width="1.6"/><path d="M14 8 Q12 5 14 3 M19 8 Q17 5 19 2 M24 8 Q22 5 24 3" fill="none" stroke="#bbb" stroke-width="1.6" stroke-linecap="round"/><path d="M11 18 L26 18" stroke="#fff" stroke-width="2" opacity=".6"/>`,
  luva: `<path d="M11 33 L11 18 Q11 9 19 9 Q27 9 27 17 L27 21 L32 15 Q35 14 35 17 L28 28 L28 33Z" fill="#3a7bd5" ${st()}/><rect x="9.5" y="30" width="20" height="6" rx="2" fill="#fff" ${st(1.3)}/><path d="M14 15 L24 15 M14 20 L24 20 M14 25 L24 25" stroke="#bfe0ff" stroke-width="1.4"/>`,
  vela: `<rect x="14" y="15" width="12" height="20" rx="2" fill="#f4efe6" ${st()}/><path d="M20 15 L20 11" ${st(1.4)}/><path d="M20 3 Q25 9 20 12 Q15 9 20 3Z" fill="#ffb21f" ${st(1.1)}/><path d="M14 19 Q17 22 18 18" fill="#fff" stroke="#ddd"/><ellipse cx="20" cy="36" rx="11" ry="2.6" fill="#c98a45" ${st(1.2)}/>`,
  chave: `<circle cx="13" cy="15" r="7.5" fill="#f5b72a" ${st()}/><circle cx="13" cy="15" r="3" fill="#fff6dd" ${st(1.2)}/><path d="M18.5 20 L33 34.5 M27 28.5 L23.5 32 M30.5 32 L28 34.5" ${st(3.2)}/><path d="M18.5 20 L33 34.5" stroke="#f5b72a" stroke-width="1.6"/>`,
  folha: `<path d="M8 32 Q6 12 30 6 Q35 25 14 32Z" fill="#e8742f" ${st()}/><path d="M8 32 Q18 20 28 9 M14 24 L12 18 M19 19 L22 23 M17 21 L15 14" fill="none" stroke="#a84513" stroke-width="1.3"/>`,
  tulipa: `<path d="M20 22 L20 37" stroke="#3f8a2f" stroke-width="2.4"/><path d="M20 32 Q12 30 11 22 Q17 24 20 30" fill="#4f9a2f" ${st(1.1)}/><path d="M11 9 L15 14 L20 7 L25 14 L29 9 Q31 22 20 24 Q9 22 11 9Z" fill="#ff4f8b" ${st()}/>${shine(15, 16, 1.6, 3, 10)}`,
};

export const ICON_NAMES = {
  cereja: 'Cerejas', banana: 'Banana', maca: 'Maçã', pera: 'Pera', uvas: 'Uvas', limao: 'Limão', morango: 'Morango', melancia: 'Melancia',
  laranja: 'Laranja', cenoura: 'Cenoura', abobora: 'Abóbora', cogumelo: 'Cogumelo', bolota: 'Bolota', pinha: 'Pinha', sino: 'Sino', gota: 'Gota',
  chama: 'Chama', lupa: 'Lupa', gelado: 'Gelado', queijo: 'Queijo', lua: 'Lua', estrela: 'Estrela', coracao: 'Coração', floco: 'Floco de neve',
  caneca: 'Caneca', luva: 'Luva', vela: 'Vela', chave: 'Chave', folha: 'Folha', tulipa: 'Tulipa',
};

const cache = new Map();
export function iconSvg(face) {
  if (!cache.has(face)) cache.set(face, `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ICONS[face] || ''}</svg>`);
  return cache.get(face);
}
// Costas de um azulejo virado: padrão de losangos azuis.
export const BACK_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="40" height="40" rx="5" fill="#3d6aa8"/>
  <path d="M20 4 L36 20 L20 36 L4 20Z" fill="none" stroke="#9cc3f0" stroke-width="2"/><path d="M20 11 L29 20 L20 29 L11 20Z" fill="#9cc3f0" opacity=".55"/><circle cx="20" cy="20" r="3" fill="#fff"/></svg>`;
// Presente: embrulho vermelho com laço dourado.
export const GIFT_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="12" width="30" height="24" rx="3" fill="#e8473b" stroke="${K}" stroke-width="1.6"/>
  <rect x="17" y="12" width="6" height="24" fill="#ffd23f"/><rect x="5" y="20" width="30" height="5" fill="#ffd23f"/>
  <path d="M20 12 Q10 2 9 9 Q10 13 20 12 Q30 13 31 9 Q30 2 20 12Z" fill="#ffd23f" stroke="${K}" stroke-width="1.4"/></svg>`;
