// Lógica da Colmeia, sem DOM.
//
// Colmeia hexagonal de raio 3 (37 casas, coordenadas axiais). Arrasta-se por números iguais
// encostados; depois de dois iguais pode-se subir para o dobro. A soma (arredondada para cima
// a uma potência de 2) fica na última casa; as outras esvaziam e enchem com peças novas.
// Casas especiais: mel (limpa-se quando um caminho passa por cima), pedra (sem peça; parte-se
// quando um caminho acaba ao lado), gelo (a peça não se pode usar até um caminho acabar ao lado).
// As peças novas saem de um aleatório guardado no estado: o mesmo nível dá sempre as mesmas peças.

export const R = 3;
export const CELLS = [];
for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (Math.abs(q + r) <= R) CELLS.push({ q, r });
const IDX = new Map(CELLS.map((c, i) => [`${c.q},${c.r}`, i]));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
export const NEIGHBORS = CELLS.map(c => NB.map(([a, b]) => IDX.get(`${c.q + a},${c.r + b}`)).filter(i => i != null));
export const adjacent = (a, b) => NEIGHBORS[a].includes(b);
export const roundUp = n => 2 ** Math.ceil(Math.log2(n));

function rand(g) {
  g.seed = (Math.imul(g.seed, 1103515245) + 12345) >>> 0;
  return (g.seed >>> 8) / 16777216;
}
function pick(g) {
  const r = rand(g);
  return g.minV * (r < 0.42 ? 1 : r < 0.72 ? 2 : r < 0.9 ? 4 : 8);
}

export const usable = (g, i) => g.vals[i] > 0 && !g.ice[i];
export function hasMove(g) {
  return CELLS.some((_, i) => usable(g, i) && NEIGHBORS[i].some(j => usable(g, j) && g.vals[j] === g.vals[i]));
}

// level: { seed, stones: [i], honey: [i], ice: [i], moves, goals }
export function newGame(level) {
  const g = {
    seed: level.seed >>> 0 || 1, minV: 2, score: 0, moves: level.moves, played: 0,
    vals: Array(CELLS.length).fill(0), honey: Array(CELLS.length).fill(false), ice: Array(CELLS.length).fill(false), stone: Array(CELLS.length).fill(false),
    goals: level.goals.map(x => ({ ...x, have: 0 })),
  };
  level.stones.forEach(i => { g.stone[i] = true; });
  level.honey.forEach(i => { g.honey[i] = true; });
  level.ice.forEach(i => { g.ice[i] = true; });
  for (let i = 0; i < CELLS.length; i++) if (!g.stone[i]) g.vals[i] = pick(g);
  guaranteeMove(g);
  return g;
}
export const clone = g => JSON.parse(JSON.stringify(g));

function guaranteeMove(g) {
  if (hasMove(g)) return;
  // Copia o valor de um vizinho para uma casa usável
  for (let i = 0; i < CELLS.length; i++) {
    if (!usable(g, i)) continue;
    const j = NEIGHBORS[i].find(x => usable(g, x));
    if (j != null) { g.vals[j] = g.vals[i]; return; }
  }
}

// Pode juntar a casa i ao fim do caminho?
export function canAdd(g, path, i) {
  if (!usable(g, i) || path.includes(i)) return false;
  if (!path.length) return true;
  const last = path[path.length - 1];
  if (!adjacent(last, i)) return false;
  return g.vals[i] === g.vals[last] || (path.length >= 2 && g.vals[i] === g.vals[last] * 2);
}
export const pathValue = (g, path) => roundUp(path.reduce((s, i) => s + g.vals[i], 0));

export const goalDone = x => (x.k === 'tile' ? x.have >= 1 : x.have >= x.n);
export const isWon = g => g.goals.every(goalDone);

// Aplica um caminho válido. Devolve o que aconteceu (para animar).
export function play(g, path) {
  const total = path.reduce((s, i) => s + g.vals[i], 0), result = roundUp(total), end = path[path.length - 1];
  const mult = path.length >= 9 ? 3 : path.length >= 6 ? 2 : 1;
  let honeyGot = 0;
  path.forEach(i => { if (g.honey[i]) { g.honey[i] = false; honeyGot++; } });
  const around = NEIGHBORS[end];
  const broke = around.filter(j => g.stone[j]);
  const thawed = around.filter(j => g.ice[j]);
  broke.forEach(j => { g.stone[j] = false; g.vals[j] = 0; });
  thawed.forEach(j => { g.ice[j] = false; });
  path.slice(0, -1).forEach(i => { g.vals[i] = 0; });
  g.vals[end] = result;
  g.score += total * mult;
  g.moves--; g.played++;
  for (const x of g.goals) {
    if (x.k === 'tile' && result >= x.v) x.have = 1;
    if (x.k === 'score') x.have = Math.min(x.n, g.score);
    if (x.k === 'chain' && path.length >= x.len) x.have = Math.min(x.n, x.have + 1);
    if (x.k === 'honey') x.have = Math.min(x.n, x.have + honeyGot);
    if (x.k === 'stone') x.have = Math.min(x.n, x.have + broke.length);
    if (x.k === 'ice') x.have = Math.min(x.n, x.have + thawed.length);
  }
  // Os números pequenos saem quando já há números grandes
  let retired = 0;
  if (Math.max(...g.vals) >= g.minV * 512) { retired = g.minV; g.minV *= 2; g.vals = g.vals.map(v => (v === retired ? 0 : v)); }
  const fresh = [];
  for (let i = 0; i < CELLS.length; i++) if (!g.vals[i] && !g.stone[i]) { g.vals[i] = pick(g); fresh.push(i); }
  let shuffled = false;
  if (!hasMove(g)) { shuffle(g); shuffled = true; }
  return { total, result, end, mult, honeyGot, broke, thawed, retired, fresh, shuffled };
}

// Baralha as peças usáveis até haver uma jogada.
export function shuffle(g) {
  const live = CELLS.map((_, i) => i).filter(i => g.vals[i] && !g.ice[i]);
  for (let tries = 0; tries < 30; tries++) {
    const v = live.map(i => g.vals[i]);
    for (let k = v.length - 1; k > 0; k--) { const j = Math.floor(rand(g) * (k + 1)); [v[k], v[j]] = [v[j], v[k]]; }
    live.forEach((i, k) => { g.vals[i] = v[k]; });
    if (hasMove(g)) return;
  }
  guaranteeMove(g);
}

// ---------- Robô (para validar os níveis) ----------
// Procura caminhos (até 8 peças) e escolhe o que mais ajuda os objetivos.
export function candidates(g, maxLen = 8, cap = 4000) {
  const out = [];
  const dfs = path => {
    if (out.length >= cap) return;
    if (path.length >= 2) out.push(path.slice());
    if (path.length >= maxLen) return;
    const last = path[path.length - 1];
    for (const j of NEIGHBORS[last]) if (canAdd(g, path, j)) { path.push(j); dfs(path); path.pop(); }
  };
  for (let i = 0; i < CELLS.length; i++) if (usable(g, i)) dfs([i]);
  return out;
}
function rate(g, path) {
  const v = pathValue(g, path), end = path[path.length - 1];
  let s = path.length * 2 + Math.log2(v) * 3;
  for (const x of g.goals) {
    if (goalDone(x)) continue;
    if (x.k === 'tile') s += v >= x.v ? 500 : Math.log2(v) * 6;
    if (x.k === 'chain' && path.length >= x.len) s += 60;
    if (x.k === 'honey') s += path.filter(i => g.honey[i]).length * 25;
    if (x.k === 'stone') s += NEIGHBORS[end].filter(j => g.stone[j]).length * 30;
    if (x.k === 'ice') s += NEIGHBORS[end].filter(j => g.ice[j]).length * 30;
    if (x.k === 'score') s += path.reduce((a, i) => a + g.vals[i], 0) / 20;
  }
  return s;
}
// Joga o nível; devolve o número de jogadas usadas para ganhar, ou null.
export function solve(level, limit = level.moves) {
  const g = newGame({ ...level, moves: 999 });
  while (g.played < limit) {
    const c = candidates(g);
    if (!c.length) shuffle(g);
    else {
      let best = c[0], bs = -1;
      for (const p of c) { const r = rate(g, p); if (r > bs) { bs = r; best = p; } }
      play(g, best);
    }
    if (isWon(g)) return g.played;
  }
  return null;
}
