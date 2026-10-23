// Lógica da Casa na Serra, sem DOM.
//
// Os azulejos estão em camadas; um azulejo está livre se nenhum de uma camada acima o tapar.
// Tocar num azulejo livre manda-o para a barra; três iguais na barra desaparecem.
// Se a barra encher sem trio, perde-se. Posições em meios-azulejos (x, y) e camada z.
//
// Mecânicas (cada azulejo pode ter):
//  - flipped  virado: o desenho só se vê quando o azulejo está livre
//  - pile     pilha ao lado da cúpula (só se tira o de cima)
//  - ice      gelo: precisa de `ice` toques antes de sair
//  - chain    corrente: só sai depois de feito um trio do desenho `chain`
//  - gift     presente: ao sair dá uma ajuda
//  - gold     dourado: vale moedas
// Barra: 7 lugares (6 com a rolha da adega; 8 com o lugar extra).

export const BAR_SIZE = 7;

const over = (a, b) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;

export function isFree(t, tiles) {
  for (const o of tiles) if (o !== t && !o.gone && o.z > t.z && over(o, t)) return false;
  return true;
}

export function newGame(level) {
  return {
    tiles: level.tiles.map(t => ({ ...t, gone: false })),
    order: level.order,
    bar: [],
    cleared: {},
    moves: 0,
    maxBar: 0,
    barSize: level.cork ? BAR_SIZE - 1 : BAR_SIZE,
  };
}

export const chainOpen = (g, t) => !t.chain || (g.cleared[t.chain] || 0) > 0;
export const canTouch = (g, t) => !t.gone && isFree(t, g.tiles) && chainOpen(g, t);
export function blockedReason(g, t) {
  if (!isFree(t, g.tiles)) return 'covered';
  if (!chainOpen(g, t)) return 'chain';
  return null;
}

export function insertInBar(bar, item) {
  let at = bar.length;
  for (let k = bar.length - 1; k >= 0; k--) if (bar[k].face === item.face) { at = k + 1; break; }
  bar.splice(at, 0, item);
  return at;
}

// Tira os trios da barra. Devolve os desenhos que saíram.
export function clearTrios(g) {
  const trios = [];
  for (;;) {
    const counts = {};
    g.bar.forEach(b => { counts[b.face] = (counts[b.face] || 0) + 1; });
    const face = Object.keys(counts).find(f => counts[f] >= 3);
    if (!face) break;
    let n = 0;
    g.bar = g.bar.filter(b => !(b.face === face && n++ < 3));
    g.cleared[face] = (g.cleared[face] || 0) + 1;
    trios.push(face);
  }
  return trios;
}

// Toque num azulejo. { kind: 'crack' } partiu gelo; { kind: 'take', at, trios, gift, gold } foi para a barra.
export function touch(g, id) {
  const t = g.tiles[id];
  if (!canTouch(g, t)) return null;
  g.moves++;
  if (t.ice > 0) { t.ice--; return { kind: 'crack', id }; }
  t.gone = true;
  const at = insertInBar(g.bar, { id: t.id, face: t.face });
  g.maxBar = Math.max(g.maxBar, g.bar.length);
  const trios = clearTrios(g);
  return { kind: 'take', id, at, trios, gift: !!t.gift, gold: !!t.gold };
}

export const isLost = g => g.bar.length >= g.barSize;
export const isWon = g => g.tiles.every(t => t.gone) && !g.bar.length;
export const tilesLeft = g => g.tiles.filter(t => !t.gone).length;

// Íman: tira um trio inteiro (o desenho que mais está na barra, ou o próximo da solução).
export function magnet(g) {
  const counts = {};
  g.bar.forEach(b => { counts[b.face] = (counts[b.face] || 0) + 1; });
  let face = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  if (!face) face = (g.order || []).map(i => g.tiles[i]).find(t => !t.gone)?.face;
  if (!face) return null;
  const need = 3 - Math.min(3, counts[face] || 0);
  const pick = g.tiles.filter(t => !t.gone && t.face === face).sort((a, b) => b.z - a.z).slice(0, need);
  if (pick.length < need) return null;
  pick.forEach(t => { t.gone = true; t.ice = 0; insertInBar(g.bar, { id: t.id, face }); });
  return { face, ids: pick.map(t => t.id), trios: clearTrios(g) };
}

// Baralha os desenhos dos azulejos que restam no tabuleiro.
export function reshuffle(g, rand = Math.random) {
  const left = g.tiles.filter(t => !t.gone);
  const faces = left.map(t => t.face);
  for (let i = faces.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [faces[i], faces[j]] = [faces[j], faces[i]]; }
  left.forEach((t, k) => { t.face = faces[k]; });
  g.order = null;
}

// ---------------- Geração ----------------

const shuffleArr = (a, rand) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Uma ordem de jogo possível: tirar sempre um azulejo livre ao acaso.
function playOrder(positions, rand) {
  const sim = positions.map((p, i) => ({ ...p, id: i, gone: false }));
  const order = [];
  while (order.length < sim.length) {
    const free = sim.filter(t => !t.gone && isFree(t, sim));
    const t = free[Math.floor(rand() * free.length)];
    t.gone = true;
    order.push(t.id);
  }
  return order;
}

// Gera os azulejos de um nível com solução garantida.
// Numa ordem de jogo possível, os desenhos vão de 6 em 6 (dois trios misturados): quem seguir
// essa ordem nunca passa de 5 azulejos na barra. As mecânicas respeitam a mesma ordem.
export function generateTiles(positions, cfg, rand) {
  const order = playOrder(positions, rand);
  const N = order.length;
  const faces = shuffleArr([...cfg.faces], rand).slice(0, cfg.types);
  const tiles = positions.map((p, i) => ({ id: i, x: p.x, y: p.y, z: p.z, pile: !!p.pile, face: null, flipped: false, ice: 0, chain: null, gift: false, gold: false }));
  const windowOf = new Array(N);
  let fi = 0;
  for (let w = 0; w * 6 < N; w++) {
    const chunk = order.slice(w * 6, w * 6 + 6);
    const a = faces[fi++ % faces.length], b = faces[fi++ % faces.length];
    const set = chunk.length === 6 ? shuffleArr([a, a, a, b, b, b], rand) : [a, a, a];
    chunk.forEach((id, k) => { tiles[id].face = set[k]; windowOf[id] = w; });
  }
  const plain = t => !t.ice && !t.chain && !t.gift && !t.gold;
  const pick = (list, n) => shuffleArr(list, rand).slice(0, n);
  const topZ = Math.max(...tiles.map(t => t.z));

  if (cfg.virados) pick(tiles.filter(t => t.z < topZ), Math.round(N * cfg.virados)).forEach(t => { t.flipped = true; });
  if (cfg.gelo) pick(tiles.filter(plain), cfg.gelo).forEach(t => { t.ice = 1; });
  if (cfg.correntes) {
    for (const t of pick(tiles.filter(t => plain(t) && windowOf[t.id] >= 1), cfg.correntes)) {
      const done = [...new Set(order.slice(0, windowOf[t.id] * 6).map(id => tiles[id].face))].filter(f => f !== t.face);
      if (done.length) t.chain = done[Math.floor(rand() * done.length)];
    }
  }
  if (cfg.presentes) pick(tiles.filter(plain), cfg.presentes).forEach(t => { t.gift = true; });
  if (cfg.dourados) pick(tiles.filter(plain), cfg.dourados).forEach(t => { t.gold = true; });
  return { tiles, order };
}

// Joga um nível seguindo a ordem com que foi gerado (para a validação). Devolve true se ganhar.
export function playsThrough(level, order = level.order) {
  const g = newGame(level);
  for (const id of order) {
    const t = g.tiles[id];
    let guard = 4;
    while (!t.gone && guard--) {
      if (!canTouch(g, t)) return false;
      touch(g, id);
    }
    if (!t.gone || isLost(g)) return false;
  }
  return isWon(g);
}
