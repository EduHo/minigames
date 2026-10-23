// Lógica da Fornada (2048 com doces), sem DOM.
//
// Tabuleiro N×N em `cells` (índice r*N+c). Cada peça: { id, v } e, nos desafios, `wild` (fermento:
// junta-se com qualquer doce) ou `frozen` (congelada: não se mexe até haver uma fusão ao lado).
// Pedras em `stones` ({ i, t }): t > 0 é um forno que desaparece ao fim de t jogadas; t = 0 é pedra fixa.
// As peças novas saem de um aleatório guardado no estado (`seed`), por isso o mesmo jogo
// com as mesmas jogadas dá sempre as mesmas peças (o desafio diário é igual para todos).

const DIRS = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };
export const DIR_NAMES = Object.keys(DIRS);

function rand(state) {
  state.seed = (Math.imul(state.seed, 1103515245) + 12345) >>> 0;
  return (state.seed >>> 8) / 16777216;
}

export function newState({ N = 4, seed = 1, stones = [], tiles = [], spawn = 2 } = {}) {
  const s = { N, cells: Array(N * N).fill(null), stones: stones.map(x => ({ ...x })), score: 0, moves: 0, seed: seed >>> 0 || 1, idSeq: 0, best: 0 };
  for (const t of tiles) s.cells[t.i] = { id: ++s.idSeq, v: t.v || 0, wild: !!t.wild, frozen: !!t.frozen };
  for (let k = 0; k < spawn; k++) spawnTile(s);
  s.best = maxTile(s);
  return s;
}
export const clone = s => JSON.parse(JSON.stringify(s));
export const isStone = (s, i) => s.stones.some(x => x.i === i);
export const maxTile = s => s.cells.reduce((m, t) => (t && !t.wild ? Math.max(m, t.v) : m), 0);
export const empties = s => s.cells.map((t, i) => (!t && !isStone(s, i) ? i : -1)).filter(i => i >= 0);

export function spawnTile(s) {
  const e = empties(s);
  if (!e.length) return null;
  const i = e[Math.floor(rand(s) * e.length)];
  const t = { id: ++s.idSeq, v: rand(s) < 0.9 ? 2 : 4, wild: false, frozen: false };
  s.cells[i] = t;
  return { i, id: t.id };
}

const canMerge = (a, b) => !a.frozen && !b.frozen && (a.wild !== b.wild ? true : !a.wild && a.v === b.v);

// Uma jogada. Devolve null se nada mexeu; senão { slides: [{id, from, to}], merges: [{id, into, i, v}], spawned, gained, thawed }.
export function move(s, dir) {
  const [dr, dc] = DIRS[dir], N = s.N;
  const slides = [], merges = [], thawed = [];
  let gained = 0, moved = false;
  // Cada linha na direção do movimento, da frente para trás
  for (let k = 0; k < N; k++) {
    const line = [];
    for (let j = 0; j < N; j++) {
      const step = dr || dc ? (dr + dc > 0 ? N - 1 - j : j) : j;
      const r = dr ? step : k, c = dr ? k : step;
      line.push(r * N + c);
    }
    // Segmentos separados por pedras e peças congeladas (que não se mexem)
    let seg = [];
    const flush = () => {
      if (!seg.length) return;
      const items = seg.map(i => ({ i, t: s.cells[i] })).filter(x => x.t);
      const out = [];
      for (const x of items) {
        const last = out[out.length - 1];
        if (last && !last.merged && canMerge(last.t, x.t)) {
          const v = (last.t.wild ? x.t.v : last.t.v) * 2;
          merges.push({ id: x.t.id, into: last.t.id, from: x.i, v });
          last.t = { ...last.t, v, wild: false };
          last.merged = true;
          gained += v;
        } else out.push({ t: x.t, from: x.i, merged: false });
      }
      seg.forEach(i => { s.cells[i] = null; });
      out.forEach((x, p) => {
        const to = seg[p];
        s.cells[to] = x.t;
        if (to !== x.from) { moved = true; slides.push({ id: x.t.id, from: x.from, to }); }
      });
      merges.filter(m => m.to === undefined).forEach(m => {
        const p = out.findIndex(x => x.t.id === m.into);
        m.i = seg[p]; m.to = seg[p];
        moved = true;
      });
      seg = [];
    };
    for (const i of line) {
      const t = s.cells[i];
      if (isStone(s, i) || (t && t.frozen)) { flush(); continue; }
      seg.push(i);
    }
    flush();
  }
  if (!moved) return null;
  // Fusões descongelam as peças congeladas ao lado
  for (const m of merges) {
    const r = Math.floor(m.i / N), c = m.i % N;
    for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const rr = r + a, cc = c + b;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
      const t = s.cells[rr * N + cc];
      if (t && t.frozen) { t.frozen = false; thawed.push(rr * N + cc); }
    }
  }
  // Fornos: contam as jogadas e desaparecem
  const opened = [];
  s.stones = s.stones.filter(x => {
    if (!x.t) return true;
    x.t--;
    if (x.t <= 0) { opened.push(x.i); return false; }
    return true;
  });
  s.score += gained;
  s.moves++;
  const spawned = spawnTile(s);
  s.best = Math.max(s.best, maxTile(s));
  return { slides, merges, spawned, gained, thawed, opened };
}

export function canMove(s) {
  if (empties(s).length) return true;
  return DIR_NAMES.some(d => move(clone(s), d));
}

// ---------- Robô (para validar os desafios) ----------
// Procura em feixe: guarda os melhores tabuleiros a cada jogada, segundo uma avaliação simples
// (casas vazias, ordem das peças, maior peça num canto).
function evaluate(s) {
  const N = s.N, v = i => (s.cells[i] && !s.cells[i].wild ? Math.log2(s.cells[i].v) : 0);
  let score = empties(s).length * 2.7 + Math.log2(Math.max(2, maxTile(s))) * 1.5;
  let mono = 0, merges = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = r * N + c;
    if (c + 1 < N) { const a = v(i), b = v(i + 1); mono -= Math.abs(a - b) * 0.2; if (a && a === b) merges++; }
    if (r + 1 < N) { const a = v(i), b = v(i + N); mono -= Math.abs(a - b) * 0.2; if (a && a === b) merges++; }
  }
  const corners = [0, N - 1, N * (N - 1), N * N - 1].map(v);
  return score + mono + merges * 0.7 + Math.max(...corners) * 0.8;
}
export function solve(start, goal, maxMoves, beam = 8) {
  let front = [{ s: start, n: 0 }];
  for (let step = 0; step < maxMoves; step++) {
    const next = [];
    for (const node of front) {
      for (const d of DIR_NAMES) {
        const s = clone(node.s);
        if (!move(s, d)) continue;
        if (maxTile(s) >= goal) return node.n + 1;
        next.push({ s, n: node.n + 1, e: evaluate(s) });
      }
    }
    if (!next.length) return null;
    next.sort((a, b) => b.e - a.e);
    const seen = new Set();
    front = [];
    for (const n of next) {
      const k = n.s.cells.map(t => (t ? t.v : 0)).join(',');
      if (seen.has(k)) continue;
      seen.add(k);
      front.push({ s: n.s, n: n.n });
      if (front.length >= beam) break;
    }
  }
  return null;
}
