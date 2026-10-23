// Verifica a Letras Soltas: cada nível com tema tem de se resolver pela ordem com que foi
// construído; cada grelha livre tem de ter palavras suficientes para as estrelas.
// Uso: npm run check:letras
import fs from 'node:fs';
import { parseDict, setDict } from '../www/js/games/letras/dict.js';
import { themedLevel, freeLevel, bonusLevel, dailyLevel, maxWordLen, THEMED_LEVELS, FREE_LEVELS } from '../www/js/games/letras/levels.js';
import { removePath, plain } from '../www/js/games/letras/engine.js';
import { THEMES } from '../www/js/games/letras/themes.js';

const t0 = Date.now();
const dict = parseDict(fs.readFileSync(new URL('../www/data/palavras-pt.txt', import.meta.url), 'utf8'));
setDict(dict);
let failed = 0;
const fail = (name, why) => { failed++; console.log(`${name}: ${why}`); };
function checkThemed(name, lv) {
  if (!lv || !lv.cols) return fail(name, 'não foi possível construir');
  if (lv.cols.some(c => c.length !== lv.H)) return fail(name, 'grelha incompleta');
  let cols = lv.cols;
  for (let k = 0; k < lv.order.length; k++) {
    const w = lv.order[k], p = lv.paths[k];
    const spelled = p.map(([c, r]) => cols[c]?.[r]).join('');
    const adj = p.every(([c, r], j) => !j || (Math.abs(c - p[j - 1][0]) <= 1 && Math.abs(r - p[j - 1][1]) <= 1));
    if (spelled !== w || !adj) return fail(name, `a palavra ${w} não se forma pela ordem da solução`);
    cols = removePath(cols, p);
  }
  if (cols.some(c => c.length)) fail(name, 'sobram letras');
}
const themeCount = {};
for (let n = 1; n <= THEMED_LEVELS; n++) {
  const lv = themedLevel(n);
  checkThemed(`Tema ${n}`, lv);
  if (lv?.order?.some(w => w.length > maxWordLen(n))) fail(`Tema ${n}`, 'palavra comprida demais para o nível');
  if (n <= 30 && lv?.theme) themeCount[lv.theme] = (themeCount[lv.theme] || 0) + 1;
}
console.log('níveis 1-10:', Array.from({ length: 10 }, (_, k) => themedLevel(k + 1)).map(l => `${l.theme}(${l.words.join(' ')})`).join(' · '));
const day = new Date(2026, 0, 1);
for (let i = 0; i < 730; i++, day.setDate(day.getDate() + 1)) {
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  checkThemed(`Diário ${key}`, dailyLevel(key));
}
const totals = [];
for (let n = 1; n <= FREE_LEVELS; n++) {
  const lv = freeLevel(n, dict);
  totals.push(lv.words.size);
  if (lv.words.size < lv.marks[2] || lv.marks[0] < 5) fail(`Livre ${n}`, `só ${lv.words.size} palavras`);
}
for (let s = 1; s <= 20; s++) { const b = bonusLevel(s * 31, dict); if (b.words.size < 20) fail(`Bónus ${s}`, `só ${b.words.size} palavras`); }
// Palavras dos temas: aviso das que o dicionário não conhece (nomes próprios são normais)
const unknown = THEMES.flatMap(t => t.words.filter(w => !dict.words.has(plain(w))));
console.log(`palavras dos temas fora do dicionário: ${unknown.length} (${unknown.slice(0, 12).join(', ')}...)`);
console.log(`dicionário: ${dict.words.size} palavras · livres: ${Math.min(...totals)}-${Math.max(...totals)} palavras por grelha`);
console.log(`${THEMED_LEVELS} níveis com tema + 730 diários + ${FREE_LEVELS} livres, ${failed} com erros, ${Date.now() - t0}ms`);
process.exit(failed ? 1 : 0);
