// Lógica do Azulejos, sem DOM.
//
// Joga-se como o Mahjong: escolhes dois azulejos iguais e livres e eles saem.
// Livre = nada por cima e o lado esquerdo ou o direito sem vizinho na mesma camada.
// Posições em meios-azulejos (x, y) e camada z.
//
// Mecânicas (cada azulejo pode ter):
//  - gift   presente: embrulhado até ficar livre (não se vê o desenho)
//  - lock   portão: só sai depois de feito um par do desenho `lock`
//  - pile   pilha ao lado do tabuleiro (só se tira o de cima)
//  - power  super poder que dispara quando o par sai: raio, fogo, chave, olho
//  - vine   hera: solta-se quando sai um vizinho do lado
//  - ice    congelado: cada par feito ao lado racha uma camada de gelo
//  - cork   rolha: salta ao fim de `cork` pares
//  - tide   maré: tem de sair antes de se fazerem `tide` pares, senão perde-se
// Combos: pares seguidos do mesmo desenho. x3 cria um raio, x4 derrete o gelo todo.
// Nível do Cinzento: a cada 3 pares, um azulejo livre fica sem cor (continua a jogar-se).

const over = (a, b) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
const near = (a, b) => a !== b && a.z === b.z && Math.abs(a.x - b.x) <= 2 && Math.abs(a.y - b.y) <= 2;
const side = (a, b) => a.z === b.z && Math.abs(a.y - b.y) < 2 && Math.abs(a.x - b.x) === 2;
const live = g => g.tiles.filter(t => !t.gone);

export const POWERS = ['raio', 'fogo', 'chave', 'olho'];

export function isFree(t, tiles) {
  let left = false, right = false;
  for (const o of tiles) {
    if (o === t || o.gone) continue;
    if (o.z > t.z && over(o, t)) return false;
    if (o.z === t.z && Math.abs(o.y - t.y) < 2) {
      if (o.x === t.x - 2) left = true;
      if (o.x === t.x + 2) right = true;
    }
  }
  return !(left && right);
}

// Porque é que não pode ser escolhido (para explicar ao jogador).
export function blockedReason(g, t) {
  if (!isFree(t, g.tiles)) return 'covered';
  if (t.ice > 0) return 'ice';
  if (t.lock) return 'lock';
  if (t.vine) return 'vine';
  if (t.cork > 0) return 'cork';
  return null;
}
export const canTouch = (g, t) => !t.gone && !blockedReason(g, t);

export function newGame(level) {
  return {
    tiles: level.tiles.map(t => ({ ...t, gone: false, grey: false })),
    order: level.order,
    villain: !!level.villain,
    sel: [], pairs: 0, playerPairs: 0, cleared: {}, streak: { face: null, n: 0 }, over: null,
    seed: 1 + (level.tiles.length * 7919) % 100000,
  };
}
export const clone = g => JSON.parse(JSON.stringify(g));

// Aleatório guardado no estado (para o Desfazer repetir o mesmo).
function rnd(g) {
  g.seed = (g.seed * 16807) % 2147483647;
  return g.seed / 2147483647;
}

// Pares que dá para fazer agora.
export function moves(g) {
  const by = {};
  for (const t of live(g)) if (canTouch(g, t)) (by[t.face] = by[t.face] || []).push(t.id);
  return Object.values(by).filter(l => l.length >= 2).map(l => l.slice(0, 2));
}
export const isWon = g => !live(g).length;
export const tilesLeft = g => live(g).length;

// Toque num azulejo: escolhe, desescolhe, ou faz o par. Devolve a lista de acontecimentos.
export function tap(g, id) {
  const t = g.tiles[id], ev = [];
  if (g.over || t.gone) return ev;
  const why = blockedReason(g, t);
  if (why) { ev.push({ kind: 'blocked', id, why }); return ev; }
  if (g.sel.includes(id)) { g.sel = []; ev.push({ kind: 'unselect', id }); return ev; }
  if (g.sel.length && g.tiles[g.sel[0]].face !== t.face) { ev.push({ kind: 'swap', from: g.sel[0] }); g.sel = []; }
  g.sel.push(id);
  ev.push({ kind: 'select', id });
  if (g.sel.length === 2) {
    const ids = g.sel;
    g.sel = [];
    removePair(g, ids, ev, true);
  }
  return ev;
}

// Tira um par. `player` = feito pelo jogador (conta para combos e para o Cinzento).
// Rolhas e maré contam todos os pares, também os que os poderes levam.
export function removePair(g, ids, ev, player) {
  const gone = ids.map(i => g.tiles[i]);
  gone.forEach(t => { t.gone = true; });
  const face = gone[0].face;
  g.cleared[face] = (g.cleared[face] || 0) + 1;
  g.pairs++;
  ev.push({ kind: 'pair', ids, face, player });
  // Gelo dos vizinhos racha (uma vez por par)
  live(g).filter(t => t.ice > 0 && gone.some(x => near(x, t))).forEach(t => { t.ice--; ev.push({ kind: t.ice ? 'crack' : 'melt', id: t.id }); });
  // Hera solta-se quando sai um vizinho do lado
  live(g).filter(t => t.vine && gone.some(x => side(x, t))).forEach(t => { t.vine = false; ev.push({ kind: 'vine', id: t.id }); });
  // Portões com este desenho abrem
  live(g).filter(t => t.lock === face).forEach(t => { t.lock = null; ev.push({ kind: 'unlock', id: t.id }); });
  live(g).filter(t => t.cork > 0).forEach(t => { t.cork--; if (!t.cork) ev.push({ kind: 'pop', id: t.id }); });
  if (player) {
    g.playerPairs++;
    // Combo: pares seguidos do mesmo desenho
    g.streak = g.streak.face === face ? { face, n: g.streak.n + 1 } : { face, n: 1 };
    if (g.streak.n >= 2) ev.push({ kind: 'combo', face, n: g.streak.n });
    if (g.streak.n === 3) {
      const cand = live(g).filter(t => !t.power);
      if (cand.length) { const t = cand[Math.floor(rnd(g) * cand.length)]; t.power = 'raio'; ev.push({ kind: 'newpower', id: t.id, power: 'raio' }); }
    }
    if (g.streak.n >= 4) power(g, 'fogo', ev);
  }
  for (const t of gone) if (t.power) power(g, t.power, ev);
  // Maré: cada par aproxima a maré
  live(g).filter(t => t.tide > 0).forEach(t => { t.tide--; if (!t.tide && !g.over) { g.over = 'tide'; ev.push({ kind: 'tide', id: t.id }); } });
  // Cinzento: a cada 3 pares do jogador apaga as cores de um azulejo livre
  if (player && g.villain && g.playerPairs % 3 === 0 && !g.over) {
    const cand = live(g).filter(t => !t.grey && isFree(t, g.tiles));
    if (cand.length) { const v = cand[Math.floor(rnd(g) * cand.length)]; v.grey = true; ev.push({ kind: 'grey', id: v.id }); }
  }
  if (!g.over && isWon(g)) g.over = 'won';
  return ev;
}

function power(g, p, ev) {
  ev.push({ kind: 'power', power: p });
  if (p === 'fogo') live(g).filter(t => t.ice > 0).forEach(t => { t.ice = 0; ev.push({ kind: 'melt', id: t.id }); });
  if (p === 'chave') live(g).filter(t => t.lock).forEach(t => { t.lock = null; ev.push({ kind: 'unlock', id: t.id }); });
  if (p === 'olho') live(g).filter(t => t.gift).forEach(t => { t.gift = false; ev.push({ kind: 'unwrap', id: t.id }); });
  if (p === 'raio') { const pair = rocketPair(g); if (pair) removePair(g, pair, ev, false); }
}

// O par que o raio e o foguete levam: o próximo par inteiro da solução (assim nunca a estraga);
// se já não houver (depois de baralhar), o par mais à vista.
export function rocketPair(g) {
  for (const [a, b] of g.order || []) {
    const ta = g.tiles[a], tb = g.tiles[b];
    if (!ta.gone && !tb.gone && ta.face === tb.face) return [a, b];
  }
  const by = {};
  live(g).forEach(t => { (by[t.face] = by[t.face] || []).push(t); });
  let best = null, score = -1;
  for (const list of Object.values(by)) {
    if (list.length < 2) continue;
    const s = list.sort((a, b) => canTouch(g, b) - canTouch(g, a) || isFree(b, g.tiles) - isFree(a, g.tiles) || b.z - a.z);
    const sc = s.slice(0, 2).reduce((n, t) => n + (canTouch(g, t) ? 2 : isFree(t, g.tiles) ? 1 : 0), 0);
    if (sc > score) { score = sc; best = s.slice(0, 2).map(t => t.id); }
  }
  return best;
}
// Foguete (ajuda): tira um par como o raio.
export function rocket(g) {
  const pair = rocketPair(g);
  if (!pair) return [];
  g.sel = [];
  const ev = [{ kind: 'power', power: 'foguete' }];
  removePair(g, pair, ev, false);
  return ev;
}

// Uma ordem de jogo possível só com a geometria: tirar sempre dois livres ao acaso.
// As pilhas e as camadas de cima saem primeiro com mais probabilidade, para não ficar encalhado.
function playOrder(tiles, rand) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const sim = tiles.map(t => ({ x: t.x, y: t.y, z: t.z, id: t.id, pile: t.pile, gone: false }));
    const pairs = [];
    let left = sim.length;
    while (left) {
      const free = sim.filter(t => !t.gone && isFree(t, sim));
      if (free.length < 2) break;
      const weight = t => 1 + t.z * 0.6 + (t.pile ? 3 : 0);
      const pickOne = list => {
        let r = rand() * list.reduce((s, t) => s + weight(t), 0);
        for (const t of list) { r -= weight(t); if (r <= 0) return t; }
        return list[list.length - 1];
      };
      const a = pickOne(free), b = pickOne(free.filter(t => t !== a));
      a.gone = b.gone = true;
      left -= 2;
      pairs.push([a.id, b.id]);
    }
    if (!left) return pairs;
  }
  return null;
}

const shuffleArr = (a, rand) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Gera os azulejos de um nível com solução garantida.
// Numa ordem de jogo possível, os pares do mesmo desenho vêm seguidos (2 a 4 pares),
// por isso há sempre combos para fazer. As mecânicas são postas de acordo com a mesma ordem.
export function generateTiles(positions, cfg, rand) {
  const tiles = positions.map((p, i) => ({ id: i, x: p.x, y: p.y, z: p.z, pile: !!p.pile, face: null, gift: false, lock: null, ice: 0, vine: false, cork: 0, tide: 0, power: null }));
  const order = playOrder(tiles, rand);
  if (!order) return null;
  const P = order.length;
  const pairOf = new Array(tiles.length);
  order.forEach(([a, b], k) => { pairOf[a] = k; pairOf[b] = k; });
  // Desenhos em sequências (combos): na maior parte 2 pares, às vezes 3 ou 4.
  const faces = shuffleArr([...cfg.faces], rand).slice(0, cfg.types);
  const runs = cfg.runs || [2, 2, 2, 3, 2, 4];
  let k = 0, fi = 0;
  while (k < P) {
    const len = Math.min(P - k, runs[Math.floor(rand() * runs.length)]);
    const face = faces[fi++ % faces.length];
    for (let j = 0; j < len; j++, k++) order[k].forEach(id => { tiles[id].face = face; });
  }
  const plain = t => !t.gift && !t.lock && !t.ice && !t.vine && !t.cork && !t.tide && !t.power;
  const pick = (list, n) => shuffleArr(list, rand).slice(0, n);
  const topZ = Math.max(...tiles.map(t => t.z));

  if (cfg.nevoa) pick(tiles.filter(t => t.z < topZ || t.pile), Math.round(tiles.length * cfg.nevoa)).forEach(t => { t.gift = true; });
  if (cfg.cadeado) {
    let n = 0;
    for (const t of pick(tiles.filter(t => plain(t) && pairOf[t.id] >= 2), tiles.length)) {
      if (n >= cfg.cadeado) break;
      const keys = [...new Set(order.slice(0, pairOf[t.id]).map(([a]) => tiles[a].face))].filter(f => f !== t.face);
      if (!keys.length) continue;
      t.lock = keys[Math.floor(rand() * keys.length)];
      n++;
    }
  }
  if (cfg.hera) {
    const cand = tiles.filter(t => plain(t) && tiles.some(o => side(o, t) && pairOf[o.id] < pairOf[t.id]));
    pick(cand, cfg.hera).forEach(t => { t.vine = true; });
  }
  if (cfg.gelo) {
    let n = 0;
    for (const t of pick(tiles.filter(plain), tiles.length)) {
      if (n >= cfg.gelo) break;
      const before = new Set(tiles.filter(o => near(o, t) && pairOf[o.id] < pairOf[t.id]).map(o => pairOf[o.id]));
      if (!before.size) continue;
      t.ice = Math.min(2, before.size);
      n++;
    }
  }
  // Rolhas e maré com números pequenos (de 2 a 8), para se sentir a contagem.
  if (cfg.cortica) pick(tiles.filter(t => plain(t) && pairOf[t.id] >= 2 && pairOf[t.id] <= 10), cfg.cortica).forEach(t => { t.cork = Math.max(1, pairOf[t.id] - Math.floor(rand() * 3)); });
  if (cfg.mare) pick(tiles.filter(t => plain(t) && pairOf[t.id] >= 1 && pairOf[t.id] <= 6), cfg.mare).forEach(t => { t.tide = pairOf[t.id] + 2 + Math.floor(rand() * 3); });
  if (cfg.poderes) {
    const kinds = ['raio', ...(cfg.gelo ? ['fogo'] : []), ...(cfg.cadeado ? ['chave'] : []), ...(cfg.nevoa ? ['olho'] : [])];
    pick(tiles.filter(plain), cfg.poderes).forEach((t, j) => { t.power = kinds[j % kinds.length]; });
  }
  return { tiles, order };
}

// Baralha os azulejos que restam mantendo uma solução possível pela geometria.
export function reshuffle(g, rand = Math.random) {
  const alive = live(g);
  const count = {};
  alive.forEach(t => { count[t.face] = (count[t.face] || 0) + 1; });
  const pairFaces = shuffleArr(Object.entries(count).flatMap(([f, n]) => Array(Math.floor(n / 2)).fill(f)), rand);
  const order = playOrder(alive, rand);
  if (order) order.forEach(([a, b], k) => { g.tiles[a].face = g.tiles[b].face = pairFaces[k]; });
  else {
    const flat = shuffleArr(alive.map(t => t.face), rand);
    alive.forEach((t, k) => { t.face = flat[k]; });
  }
  g.order = order;
  g.sel = [];
  g.streak = { face: null, n: 0 };
}

// Joga um nível seguindo a ordem com que foi gerado (para a validação). Devolve true se ganhar.
export function playsThrough(level, order = level.order) {
  const g = newGame(level);
  for (const [a, b] of order) {
    if (g.tiles[a].gone && g.tiles[b].gone) continue;
    if (g.tiles[a].gone || g.tiles[b].gone) return false;
    tap(g, a);
    tap(g, b);
    if (!g.tiles[a].gone || !g.tiles[b].gone) return false;
    if (g.over === 'tide') return false;
  }
  return isWon(g);
}
