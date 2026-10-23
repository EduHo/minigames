// Lógica da Letras Soltas, sem DOM.
// A grelha guarda-se por colunas, de baixo para cima: cols[c][r] = letra.
//
// Com tema: as palavras encontradas saem e as letras de cima caem. As grelhas constroem-se ao
// contrário (enfiando as palavras da última a ser encontrada para a primeira), por isso há sempre
// uma ordem que limpa tudo.
// Livre: a grelha não muda; contam todas as palavras do dicionário que se formam (3+ letras).

export const plain = w => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

export function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Com tema ----------
// order: palavras (sem acentos) pela ordem em que se encontram na solução.
// Devolve { cols, paths }: paths[k] é o caminho da palavra k no momento em que se encontra.
export function buildThemed(order, W, H, rnd) {
  for (let attempt = 0; attempt < 400; attempt++) {
    let cols = Array.from({ length: W }, () => []);
    const paths = [];
    let ok = true;
    for (let k = order.length - 1; k >= 0 && ok; k--) {
      const word = order[k], last = k === 0;
      let placed = null;
      for (let t = 0; t < 250 && !placed; t++) {
        const heights = cols.map(c => c.length), path = [], used = new Set();
        let c = Math.floor(rnd() * W), r = Math.floor(rnd() * (heights[c] + 1));
        for (let j = 0; j < word.length; j++) {
          if (j) {
            const opts = [];
            for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
              const nc = c + dc, nr = r + dr;
              if ((dc || dr) && nc >= 0 && nc < W && nr >= 0 && nr < H && !used.has(nc * 16 + nr)) opts.push([nc, nr]);
            }
            if (!opts.length) break;
            [c, r] = opts[Math.floor(rnd() * opts.length)];
          }
          if (r >= H) break;
          path.push([c, r]); used.add(c * 16 + r);
        }
        if (path.length < word.length) continue;
        const add = Array(W).fill(0);
        path.forEach(([pc]) => { add[pc]++; });
        if (path.some(([pc, pr]) => pr >= heights[pc] + add[pc]) || add.some((a, i) => heights[i] + a > H)) continue;
        if (last && add.some((a, i) => heights[i] + a !== H)) continue;
        placed = { path, add };
      }
      if (!placed) { ok = false; break; }
      cols = cols.map((col, ci) => {
        const newH = col.length + placed.add[ci], out = [];
        let oi = 0;
        for (let rr = 0; rr < newH; rr++) {
          const j = placed.path.findIndex(([pc, pr]) => pc === ci && pr === rr);
          out.push(j >= 0 ? word[j] : col[oi++]);
        }
        return out;
      });
      paths.unshift(placed.path);
    }
    if (ok && cols.every(c => c.length === H)) return { cols, paths };
  }
  return null;
}

// Todos os caminhos (até `limit`) que formam a palavra.
export function findPaths(cols, word, limit = 24) {
  const out = [];
  const dfs = (c, r, k, path) => {
    if (out.length >= limit || cols[c]?.[r] !== word[k] || path.some(([a, b]) => a === c && b === r)) return;
    path.push([c, r]);
    if (k === word.length - 1) out.push(path.slice());
    else for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) if (dc || dr) dfs(c + dc, r + dr, k + 1, path);
    path.pop();
  };
  for (let c = 0; c < cols.length; c++) for (let r = 0; r < cols[c].length; r++) dfs(c, r, 0, []);
  return out;
}
// Caminho (lista de [c, r]) que forma a palavra na grelha, ou null.
export function findPath(cols, word) {
  const at = (c, r) => cols[c]?.[r];
  const dfs = (c, r, k, used) => {
    if (at(c, r) !== word[k] || used.has(c * 16 + r)) return null;
    if (k === word.length - 1) return [[c, r]];
    used.add(c * 16 + r);
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      if (!dc && !dr) continue;
      const rest = dfs(c + dc, r + dr, k + 1, used);
      if (rest) { used.delete(c * 16 + r); return [[c, r], ...rest]; }
    }
    used.delete(c * 16 + r);
    return null;
  };
  for (let c = 0; c < cols.length; c++) for (let r = 0; r < cols[c].length; r++) { const p = dfs(c, r, 0, new Set()); if (p) return p; }
  return null;
}
// Tira as casas do caminho; as de cima caem.
export const removePath = (cols, path) => cols.map((col, c) => col.filter((_, r) => !path.some(([pc, pr]) => pc === c && pr === r)));

// Ainda se resolve com estas palavras? (procura em profundidade; grelhas pequenas)
export function solvable(cols, left, budget = { n: 4000 }) {
  if (!left.length) return true;
  if (budget.n-- <= 0) return true;   // não se sabe: não acusar beco sem saída
  for (const w of left) for (const p of findPaths(cols, w, 8)) {
    if (budget.n <= 0) return true;
    if (solvable(removePath(cols, p), left.filter(x => x !== w), budget)) return true;
  }
  return false;
}
// Palavra que ainda dá (para a pista): tirando-a, o resto ainda se resolve.
export function safeWord(cols, left) {
  for (const w of left) for (const p of findPaths(cols, w, 8)) {
    if (solvable(removePath(cols, p), left.filter(x => x !== w))) return { word: w, path: p };
  }
  return null;
}

// ---------- Livre ----------
export function allWords(cols, dict) {
  const W = cols.length, H = cols[0].length, out = new Set();
  const dfs = (c, r, pre, used) => {
    const w = pre + cols[c][r];
    if (!dict.prefix.has(w)) return;
    if (w.length >= 3 && dict.words.has(w)) out.add(w);
    used.add(c * 16 + r);
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      const nc = c + dc, nr = r + dr;
      if ((dc || dr) && nc >= 0 && nc < W && nr >= 0 && nr < H && !used.has(nc * 16 + nr)) dfs(nc, nr, w, used);
    }
    used.delete(c * 16 + r);
  };
  for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) dfs(c, r, '', new Set());
  return out;
}
const FREQ = 'AAAAAAAAEEEEEEEOOOOOOOSSSSSRRRRRIIIIINNNNDDDMMMUUUUTTTTCCCLLLPPVGHBFZQ';
// Grelha livre com muitas palavras: enfia palavras comuns por caminhos e enche o resto com letras frequentes.
export function buildFree(W, H, dict, rnd, common = 6000) {
  const list = [...dict.words].filter(w => w.length >= 4 && w.length <= Math.min(8, W + H - 1) && dict.rank.get(w) < common);
  let best = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const cols = Array.from({ length: W }, () => Array(H).fill(''));
    for (let k = 0; k < W * H; k++) {
      const w = list[Math.floor(rnd() * list.length)];
      let c = Math.floor(rnd() * W), r = Math.floor(rnd() * H), ok = cols[c][r] === '' || cols[c][r] === w[0];
      const path = [[c, r]];
      for (let j = 1; j < w.length && ok; j++) {
        const opts = [];
        for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
          const nc = c + dc, nr = r + dr;
          if ((dc || dr) && nc >= 0 && nc < W && nr >= 0 && nr < H && !path.some(([a, b]) => a === nc && b === nr) && (cols[nc][nr] === '' || cols[nc][nr] === w[j])) opts.push([nc, nr]);
        }
        if (!opts.length) { ok = false; break; }
        [c, r] = opts[Math.floor(rnd() * opts.length)];
        path.push([c, r]);
      }
      if (ok) path.forEach(([a, b], j) => { cols[a][b] = w[j]; });
    }
    for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) if (!cols[c][r]) cols[c][r] = FREQ[Math.floor(rnd() * FREQ.length)];
    const words = allWords(cols, dict);
    if (!best || words.size > best.words.size) best = { cols, words };
  }
  return best;
}
export { shuffle };
