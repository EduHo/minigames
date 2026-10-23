// Lógica do Mahjong Solitaire, sem DOM.
// Uma peça ocupa 2x2 meias-unidades. Está livre se nada estiver por cima
// e se o lado esquerdo OU o direito estiver desimpedido.
//
// Peças especiais:
//  - lock (🔒 N): só abre depois de feitos mais N pares.
//  - bomb (💣 N): tem de sair antes de feitos mais N pares, senão explode.
import { KINDS } from './tiles.js';

const rand = n => Math.floor(Math.random() * n);
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const overlaps = (a, b) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;

export function isFree(t, tiles) {
  let left = false, right = false;
  for (const o of tiles) {
    if (o === t || o.removed) continue;
    if (o.z === t.z + 1 && overlaps(o, t)) return false;
    if (o.z === t.z && Math.abs(o.y - t.y) < 2) {
      if (o.x === t.x - 2) left = true;
      if (o.x === t.x + 2) right = true;
    }
  }
  return !(left && right);
}

export const isSelectable = (t, tiles) => !t.removed && !(t.lock > 0) && isFree(t, tiles);
export const canMatch = (a, b) => a !== b && a.group === b.group;

// Simula um jogo aleatório até ao fim, respeitando cadeados e bombas.
// A ordem em que os pares saem garante que existe pelo menos uma solução.
function randomPlaythrough(tiles, attempts = 500) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const sim = tiles.map(t => ({ x: t.x, y: t.y, z: t.z, lock: t.lock || 0, bomb: t.bomb || 0, removed: false, ref: t }));
    const pairs = [];
    let ok = true;
    for (let left = sim.length; left > 0; left -= 2) {
      const step = pairs.length;
      if (sim.some(t => !t.removed && t.bomb > 0 && t.bomb <= step)) { ok = false; break; }
      const free = shuffle(sim.filter(t => !t.removed && t.lock <= step && isFree(t, sim)));
      // Dá prioridade a bombas, como faria um bom jogador.
      free.sort((a, b) => (b.bomb > 0) - (a.bomb > 0));
      if (free.length < 2) { ok = false; break; }
      free[0].removed = free[1].removed = true;
      pairs.push([free[0].ref, free[1].ref]);
    }
    if (ok) return pairs;
  }
  return null;
}

export const isSolvable = (positions, attempts = 30) => randomPlaythrough(positions, attempts) !== null;

// Lista de pares de faces: cada tipo entra com 4 peças (2 pares).
function facePairs(count) {
  const kinds = shuffle([...KINDS]);
  const out = [];
  for (let i = 0; out.length < count; i++) {
    const k = kinds[i % kinds.length];
    const faces = k.faces.length === 1 ? [k.faces[0], k.faces[0], k.faces[0], k.faces[0]] : shuffle([...k.faces]);
    out.push({ group: k.group, faces: [faces[0], faces[1]] });
    if (out.length < count) out.push({ group: k.group, faces: [faces[2], faces[3]] });
  }
  return shuffle(out);
}

function assign(pairs, faces) {
  pairs.forEach(([a, b], i) => {
    a.group = b.group = faces[i].group;
    a.face = faces[i].faces[0];
    b.face = faces[i].faces[1];
  });
}

export function deal(positions, { locks = 0, bombs = 0 } = {}) {
  if (positions.length % 2) throw new Error('Nível com número ímpar de peças');
  const tiles = positions.map((p, id) => ({ id, x: p.x, y: p.y, z: p.z, removed: false, group: null, face: null, lock: 0, bomb: 0, hadBomb: false }));
  const pairs = randomPlaythrough(tiles);
  if (!pairs) throw new Error('Não foi possível gerar um jogo resolúvel');
  assign(pairs, facePairs(pairs.length));

  // Cadeados e bombas são colocados de acordo com a ordem da solução,
  // por isso o jogo continua a ter solução.
  const P = pairs.length;
  const lockIdx = shuffle([...Array(P).keys()].filter(i => i >= 3)).slice(0, locks);
  for (const i of lockIdx) {
    const t = pairs[i][rand(2)];
    t.lock = Math.max(2, i - rand(3));
  }
  const bombIdx = shuffle([...Array(P).keys()].filter(i => i >= 2 && i <= Math.min(P - 1, 14) && !lockIdx.includes(i))).slice(0, bombs);
  for (const i of bombIdx) {
    const t = pairs[i][rand(2)];
    t.bomb = i + 1 + 4 + rand(4);
    t.hadBomb = true;
  }
  return tiles;
}

// Baralha as peças que restam mantendo o jogo resolúvel (se possível).
export function reshuffle(tiles) {
  const alive = tiles.filter(t => !t.removed);
  const byGroup = new Map();
  for (const t of alive) {
    if (!byGroup.has(t.group)) byGroup.set(t.group, []);
    byGroup.get(t.group).push(t.face);
  }
  const faces = [];
  for (const [group, list] of byGroup) {
    for (let i = 0; i + 1 < list.length; i += 2) faces.push({ group, faces: [list[i], list[i + 1]] });
  }
  shuffle(faces);
  const pairs = randomPlaythrough(alive);
  if (pairs) {
    assign(pairs, faces);
  } else {
    // Sem solução garantida (raro): baralha à sorte.
    const flat = shuffle(alive.map(t => ({ group: t.group, face: t.face })));
    alive.forEach((t, i) => Object.assign(t, flat[i]));
  }
}

export function findMoves(tiles) {
  const free = tiles.filter(t => isSelectable(t, tiles));
  const moves = [];
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (canMatch(free[i], free[j])) moves.push([free[i], free[j]]);
    }
  }
  return moves;
}

// Remove um par e atualiza cadeados/bombas. Devolve o registo para desfazer.
export function applyMatch(tiles, a, b) {
  a.removed = b.removed = true;
  const entry = { pair: [a, b], locks: [], bombs: [] };
  for (const t of tiles) {
    if (t.removed) continue;
    if (t.lock > 0) { t.lock--; entry.locks.push(t); }
    if (t.bomb > 0) { t.bomb--; entry.bombs.push(t); }
  }
  return entry;
}

export function undoMatch(entry) {
  entry.pair.forEach(t => { t.removed = false; });
  entry.locks.forEach(t => { t.lock++; });
  entry.bombs.forEach(t => { t.bomb++; });
}

export const exploded = tiles => tiles.find(t => !t.removed && t.bomb === 0 && t.hadBomb);
