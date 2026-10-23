// Lógica do Poções da Lúmen, sem DOM.
//
// Estado: { cap, tubes, lock, ice, label, funnel, moves }
//  - tubes[i]: cores de baixo para cima; cada frasco leva `cap` camadas (4 ou 5).
//  - lock[i]  🔒: cor-chave; o frasco só abre quando essa cor estiver completa noutro frasco.
//  - ice[i]   ❄️: o frasco está gelado até se fazerem ice[i] jogadas.
//  - label[i] 🏷️: o frasco só aceita esta cor.
//  - funnel[i] ⬇️: o frasco só recebe, nunca deita.
// Regra base: deita-se a camada de cima num frasco vazio ou sobre a mesma cor.

const top = t => t[t.length - 1];

export function topRun(t) {
  if (!t.length) return 0;
  const c = top(t);
  let n = 0;
  for (let i = t.length - 1; i >= 0 && t[i] === c; i--) n++;
  return n;
}

export function newState({ tubes, cap = 4, lock, ice, label, funnel }) {
  const n = tubes.length;
  return {
    cap,
    tubes: tubes.map(t => [...t]),
    lock: lock ? [...lock] : Array(n).fill(null),
    ice: ice ? [...ice] : Array(n).fill(0),
    label: label ? [...label] : Array(n).fill(null),
    funnel: funnel ? [...funnel] : Array(n).fill(false),
    moves: 0,
  };
}

export const cloneState = s => ({ ...s, tubes: s.tubes.map(t => [...t]), lock: [...s.lock], ice: [...s.ice], label: [...s.label], funnel: [...s.funnel] });

export const isComplete = (s, i) => s.tubes[i].length === s.cap && topRun(s.tubes[i]) === s.cap;
export const isSolved = s => s.tubes.every((t, i) => t.length === 0 || isComplete(s, i));
export const isLocked = (s, i) => s.lock[i] != null && !s.tubes.some((t, j) => isComplete(s, j) && top(t) === s.lock[i]);
export const isFrozen = (s, i) => s.ice[i] > s.moves;
export const isBlocked = (s, i) => isLocked(s, i) || isFrozen(s, i);

// Junta um frasco vazio (ajuda "frasco extra").
export function addTube(s) {
  s.tubes.push([]); s.lock.push(null); s.ice.push(0); s.label.push(null); s.funnel.push(false);
}

export function canPour(s, a, b) {
  if (a === b || isBlocked(s, a) || isBlocked(s, b) || s.funnel[a]) return false;
  const src = s.tubes[a], dst = s.tubes[b];
  if (!src.length || dst.length >= s.cap || isComplete(s, a)) return false;
  if (s.label[b] != null && s.label[b] !== top(src)) return false;
  return !dst.length || top(dst) === top(src);
}

// Porque é que não dá para deitar (para explicar ao jogador). null se der.
export function whyNot(s, a, b) {
  if (isLocked(s, a) || isLocked(s, b)) return 'lock';
  if (isFrozen(s, a) || isFrozen(s, b)) return 'ice';
  if (s.funnel[a]) return 'funnel';
  const src = s.tubes[a], dst = s.tubes[b];
  if (dst.length >= s.cap) return 'full';
  if (s.label[b] != null && s.label[b] !== top(src)) return 'label';
  if (dst.length && top(dst) !== top(src)) return 'color';
  return null;
}

// Deita, conta a jogada e devolve quantas camadas passaram.
export function pour(s, a, b) {
  const n = Math.min(topRun(s.tubes[a]), s.cap - s.tubes[b].length);
  for (let i = 0; i < n; i++) s.tubes[b].push(s.tubes[a].pop());
  s.moves++;
  return n;
}

export function unpour(s, a, b, n) {
  for (let i = 0; i < n; i++) s.tubes[a].push(s.tubes[b].pop());
  s.moves--;
}

// Jogadas que valem a pena considerar.
export function usefulMoves(s) {
  const moves = [];
  const seenEmpty = new Set();
  for (let b = 0; b < s.tubes.length; b++) {
    const empty = s.tubes[b].length === 0;
    if (empty) {
      // Frascos vazios iguais são equivalentes: basta um.
      const sig = `${s.label[b]}|${s.funnel[b]}|${isBlocked(s, b)}`;
      if (seenEmpty.has(sig)) continue;
      seenEmpty.add(sig);
    }
    for (let a = 0; a < s.tubes.length; a++) {
      if (!canPour(s, a, b)) continue;
      // Mudar um frasco de uma só cor para um vazio normal não adianta.
      if (empty && s.label[b] == null && !s.funnel[b] && topRun(s.tubes[a]) === s.tubes[a].length && s.lock[a] == null) continue;
      moves.push([a, b]);
    }
  }
  return moves.sort((m1, m2) => (s.tubes[m1[1]].length === 0) - (s.tubes[m2[1]].length === 0));
}

function stateKey(s) {
  const maxIce = Math.max(...s.ice);
  const parts = s.tubes.map((t, i) => `${s.lock[i] ?? ''}${isLocked(s, i) ? 'L' : ''}/${s.label[i] ?? ''}/${s.funnel[i] ? 'F' : ''}/${s.ice[i] > s.moves ? s.ice[i] : ''}:${t.join(',')}`);
  return parts.sort().join('|') + (maxIce > s.moves ? `#${s.moves}` : '');
}

// Procura uma solução a partir de um estado. Devolve a lista de jogadas, ou null
// se não houver ou se a pesquisa passar o limite.
export function solve(start, limit = 200000) {
  const s = cloneState(start);
  const seen = new Set();
  const path = [];
  let nodes = 0;
  function dfs() {
    if (isSolved(s)) return true;
    if (++nodes > limit) return false;
    const key = stateKey(s);
    if (seen.has(key)) return false;
    seen.add(key);
    for (const [a, b] of usefulMoves(s)) {
      const n = pour(s, a, b);
      path.push([a, b]);
      if (dfs()) return true;
      path.pop();
      unpour(s, a, b, n);
    }
    return false;
  }
  return dfs() ? path : null;
}

function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Gera um nível com solução garantida.
// cfg: { colors, cap, empty, locks, ice, labels, funnels }
export function generate(cfg, rnd) {
  const { colors, cap = 4, empty = 2, locks = 0, ice = 0, labels = 0, funnels = 0 } = cfg;
  for (let attempt = 0; attempt < 400; attempt++) {
    const layers = shuffle([...Array(colors).keys()].flatMap(c => Array(cap).fill(c)), rnd);
    const tubes = [];
    for (let i = 0; i < colors; i++) tubes.push(layers.slice(i * cap, (i + 1) * cap));
    for (let i = 0; i < empty; i++) tubes.push([]);
    if (tubes.some(t => t.length && topRun(t) >= cap - 1)) continue;
    const s = newState({ tubes, cap });

    // Cadeados e gelo vão para frascos cheios diferentes.
    const filled = shuffle([...Array(colors).keys()], rnd);
    let ok = true;
    for (let k = 0; k < locks && ok; k++) {
      const i = filled.pop();
      // A cor-chave não pode estar dentro do próprio frasco trancado.
      const keys = [...Array(colors).keys()].filter(c => !tubes[i].includes(c) && !s.lock.includes(c));
      if (!keys.length) ok = false;
      else s.lock[i] = keys[Math.floor(rnd() * keys.length)];
    }
    for (let k = 0; k < ice && ok; k++) s.ice[filled.pop()] = 3 + Math.floor(rnd() * 5);
    if (!ok) continue;
    // Rótulos e funis vão para frascos vazios.
    const empties = [...Array(empty).keys()].map(k => colors + k);
    for (let k = 0; k < labels; k++) s.label[empties.shift()] = Math.floor(rnd() * colors);
    for (let k = 0; k < funnels; k++) s.funnel[empties.shift()] = true;

    // Limite baixo: se a pesquisa demorar, é mais rápido baralhar de novo.
    const solution = solve(s, 25000);
    if (solution) return { state: s, par: solution.length };
  }
  throw new Error('Não foi possível gerar um nível resolúvel');
}
