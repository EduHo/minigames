// Ecrã de jogo do Mahjong (níveis, desafio diário e eventos).
import { getLevel, getDailyLevel, getEventLevel, TOTAL_LEVELS } from './levels.js';
import { deal, reshuffle, isFree, isSelectable, canMatch, findMoves, applyMatch, undoMatch, exploded } from './engine.js';
import { tileSvg, STYLES } from './tiles.js';
import {
  progress, saveProgress, dailyState, saveDaily, eventsState, saveEvents,
  loadSaved, storeSaved, clearSaved, setLastSaved,
} from './progress.js';
import { bubble, hand, hasSeen, markSeen, mechanicIntro } from './coach.js';
import { settings } from '../../core/settings.js';
import { sfx } from '../../core/audio.js';
import { vibrate, requestReviewOnce } from '../../core/native.js';
import { wallet, achievements, analytics } from './meta.js';
import { activeEvent, eventParticles, EVENT_LEVELS } from '../../core/events.js';
import { modal, toast, floatText, burst, confetti, coinHtml } from '../../core/ui.js';
import { today } from '../../core/store.js';

const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const starsHtml = (n, cls = '') => `<span class="stars ${cls}">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;
const CONTINUE_PRICE = 60;
const MAX_COMBO_BONUS = 30;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const shortDate = key => { const [, m, d] = key.split('-').map(Number); return `${d} ${MONTHS[m - 1]}`; };

// 3 estrelas: dentro do tempo-alvo e sem ajudas. Cada falha tira uma.
function starsFor(seconds, tiles, helpsUsed) {
  let s = 3;
  if (seconds > tiles * 2) s--;
  if (helpsUsed > 0) s--;
  return Math.max(1, s);
}

// Junta tudo o que o ecrã precisa de saber sobre o modo de jogo.
function gameDef(mode) {
  const ev = activeEvent();
  if (mode.kind === 'daily') {
    const d = getDailyLevel(mode.date);
    return { ...d, label: 'Diário', value: shortDate(mode.date), coins: s => 40 + 10 * s };
  }
  if (mode.kind === 'event') {
    const d = getEventLevel(mode.season, mode.i, ev?.color || '#3b1d4a');
    return { ...d, label: ev?.name || 'Evento', value: `${mode.i + 1}/${EVENT_LEVELS}`, coins: s => 25 + 5 * s, eventStyle: ev?.style };
  }
  const lv = getLevel(mode.n);
  return {
    ...lv,
    label: lv.special ? '👑 ' + lv.name : lv.hard ? '🔥 Difícil' : 'Nível',
    value: mode.n,
    coins: s => (10 + 5 * s) * (lv.hard ? 2 : 1),
  };
}

function tileStyle(def) {
  const ev = activeEvent();
  if (def.eventStyle) return def.eventStyle;
  const s = settings().tileStyle;
  const st = STYLES.find(x => x.id === s);
  if (!st) return 'classic';
  if (st.event) return wallet.owns(s) || ev?.id === st.event ? s : 'classic';
  return wallet.owns(s) ? s : 'classic';
}

export function game(root, nav, mode) {
  const def = gameDef(mode);
  const positions = def.positions;
  const style = tileStyle(def);
  const highlight = settings().highlightFree;

  root.innerHTML = `
    <div class="screen game ${highlight ? '' : 'no-highlight'}" style="--ch:${def.color}">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <div class="stats">
          <span class="stat"><small>${def.label}</small>${def.value}</span>
          <span class="stat"><small>Tempo</small><b data-ref="time">0:00</b></span>
          <span class="stat"><small>Peças</small><b data-ref="left"></b></span>
          <span class="stat"><small>Jogadas</small><b data-ref="moves"></b></span>
        </div>
        <button class="icon-btn" data-act="restart" aria-label="Recomeçar">↻</button>
      </header>
      ${def.hard ? '<div class="level-tag hard">🔥 Nível difícil · moedas a dobrar</div>' : ''}
      <div class="board-wrap">
        <div class="board"></div>
        <div class="combo" data-ref="combo"></div>
        <button class="zoom-btn" data-act="zoom" hidden aria-label="Ampliar">🔍</button>
      </div>
      <footer class="toolbar">
        <button class="tool" data-act="undo"><span>↶</span>Desfazer</button>
        <button class="tool" data-act="hint"><span>💡</span>Ajuda<em class="badge" data-ref="hint"></em></button>
        <button class="tool" data-act="shuffle"><span>🔀</span>Baralhar<em class="badge" data-ref="shuffle"></em></button>
      </footer>
    </div>`;

  const $ = sel => root.querySelector(sel);
  const screen = $('.game');
  const boardWrap = $('.board-wrap');
  const board = $('.board');
  if (mode.kind === 'event') eventParticles(screen, activeEvent());

  let tiles = [];
  let byId = new Map();
  let selected = null;
  let history = [];
  let seconds = 0;
  let helpsUsed = 0;
  let timer = null;
  let finished = false;
  let paused = 0;
  let combo = 0;
  let maxCombo = 0;
  let comboBonus = 0;
  let lastMatchAt = 0;
  let lastActionAt = Date.now();
  let geo = null;
  let zoom = { s: 1, x: 0, y: 0 };
  let tutorialStep = 0;
  let removeHand = null;
  let closeBubble = null;

  // ---------- Início / gravação ----------

  function start(fresh = false) {
    const saved = !fresh && loadSaved(mode);
    if (saved && saved.count === positions.length) {
      tiles = positions.map((p, id) => {
        const [face, group, removed, lock, bomb, hadBomb] = saved.tiles[id];
        return { id, x: p.x, y: p.y, z: p.z, face, group, removed: !!removed, lock, bomb, hadBomb: !!hadBomb };
      });
      byId = new Map(tiles.map(t => [t.id, t]));
      history = saved.history.map(h => ({ pair: h.p.map(i => byId.get(i)), locks: h.l.map(i => byId.get(i)), bombs: h.b.map(i => byId.get(i)) }));
      seconds = saved.seconds;
      helpsUsed = saved.helps;
      comboBonus = saved.comboBonus || 0;
      toast('Jogo retomado');
    } else {
      tiles = deal(positions, { locks: def.locks || 0, bombs: def.bombs || 0 });
      byId = new Map(tiles.map(t => [t.id, t]));
      history = [];
      seconds = 0;
      helpsUsed = 0;
      comboBonus = 0;
      clearSaved(mode);
    }
    selected = null;
    finished = false;
    combo = 0;
    zoom = { s: 1, x: 0, y: 0 };
    analytics.track('level_start', { mode: mode.kind, n: mode.n });
    build();
    layoutBoard();
    refresh();
    updateBadges();
    $('[data-ref=time]').textContent = fmtTime(seconds);
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    setTimeout(intro, 350);
  }

  function persist() {
    if (finished || !history.length) return;
    storeSaved(mode, {
      count: positions.length,
      tiles: tiles.map(t => [t.face, t.group, t.removed ? 1 : 0, t.lock, t.bomb, t.hadBomb ? 1 : 0]),
      history: history.map(h => ({ p: h.pair.map(t => t.id), l: h.locks.map(t => t.id), b: h.bombs.map(t => t.id) })),
      seconds,
      helps: helpsUsed,
      comboBonus,
    });
    setLastSaved(mode);
  }

  function tick() {
    if (finished || paused || document.hidden) return;
    $('[data-ref=time]').textContent = fmtTime(++seconds);
    // Primeira vez que o jogador fica parado: mostrar onde está a Ajuda.
    if (!hasSeen('tip-hint') && mode.n !== 1 && Date.now() - lastActionAt > 20000 && !closeBubble) {
      markSeen('tip-hint');
      closeBubble = bubble($('[data-act=hint]'), 'Não encontras um par? Toca em <b>Ajuda</b> 💡', { autoClose: 6000 });
    }
  }

  // ---------- Desenho ----------

  function build() {
    board.innerHTML = '';
    for (const t of tiles) {
      const el = document.createElement('div');
      el.className = 'tile';
      el.style.zIndex = t.z * 1000 + t.y * 20 + t.x;
      el.dataset.id = t.id;
      t.el = el;
      board.appendChild(el);
      paint(t);
    }
  }

  function paint(t) {
    t.el.innerHTML = tileSvg(t.face, style)
      + (t.lock > 0 ? `<span class="lock-cover"><b>🔒</b><i>${t.lock}</i></span>` : '')
      + (t.bomb > 0 ? `<span class="bomb-badge ${t.bomb <= 3 ? 'urgent' : ''}">💣${t.bomb}</span>` : '');
  }

  // Calcula o tamanho das peças para caber no espaço disponível.
  function layoutBoard() {
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x)) + 2;
    const maxY = Math.max(...positions.map(p => p.y)) + 2;
    const maxZ = Math.max(...positions.map(p => p.z));
    const RATIO = 1.32, DEPTH = 0.12;
    const cols = (maxX - minX) / 2, rows = (maxY - minY) / 2;
    const availW = boardWrap.clientWidth - 16;
    const availH = boardWrap.clientHeight - 16;
    const w = Math.min(availW / (cols + maxZ * DEPTH + 0.15), availH / (rows * RATIO + maxZ * DEPTH + 0.15), 90);
    const h = w * RATIO, d = w * DEPTH;
    geo = { w, h };
    board.style.width = `${cols * w + maxZ * d + w * 0.15}px`;
    board.style.height = `${rows * h + maxZ * d + w * 0.15}px`;
    board.style.setProperty('--t', `${Math.max(2, w * 0.06)}px`);
    for (const t of tiles) {
      t.px = ((t.x - minX) / 2) * w + (maxZ - t.z) * d;
      t.py = ((t.y - minY) / 2) * h + (maxZ - t.z) * d;
      Object.assign(t.el.style, { left: `${t.px}px`, top: `${t.py}px`, width: `${w}px`, height: `${h}px` });
    }
    // Peças pequenas: mostrar botão de zoom (também dá para usar dois dedos).
    $('[data-act=zoom]').hidden = w >= 46;
    applyZoom();
  }

  function refresh() {
    for (const t of tiles) {
      if (!t.flying) t.el.classList.toggle('gone', t.removed);
      t.el.classList.toggle('blocked', !t.removed && !isSelectable(t, tiles));
      t.el.classList.toggle('sel', t === selected);
      t.el.classList.remove('hint');
    }
    const left = tiles.filter(t => !t.removed).length;
    const moves = findMoves(tiles).length;
    $('[data-ref=left]').textContent = left;
    $('[data-ref=moves]').textContent = moves;

    if (left === 0) win();
    else if (exploded(tiles)) lose(exploded(tiles));
    else if (moves === 0) stuck();
  }

  function updateBadges() {
    for (const kind of ['hint', 'shuffle']) {
      const n = wallet.available(kind);
      $(`[data-ref=${kind}]`).innerHTML = n > 0 ? n : coinHtml(wallet.prices[kind]);
      $(`[data-ref=${kind}]`).classList.toggle('price', n === 0);
    }
  }

  // ---------- Jogadas ----------

  function onTap(t) {
    if (finished || paused || t.removed) return;
    lastActionAt = Date.now();
    if (!isSelectable(t, tiles)) {
      shake(t);
      sfx('blocked');
      vibrate('medium');
      if (t.lock > 0) toast(`🔒 Abre daqui a ${t.lock} ${t.lock === 1 ? 'par' : 'pares'}`, 1500);
      return;
    }
    if (selected === t) {
      selected = null;
      sfx('tap');
    } else if (selected && canMatch(selected, t)) {
      match(selected, t);
      return;
    } else {
      selected = t;
      sfx('tap');
      vibrate('light');
    }
    refresh();
  }

  function match(a, b) {
    const entry = applyMatch(tiles, a, b);
    history.push(entry);
    selected = null;

    const now = Date.now();
    combo = now - lastMatchAt < 4000 ? combo + 1 : 1;
    lastMatchAt = now;
    maxCombo = Math.max(maxCombo, combo);
    sfx('match', combo);
    vibrate('medium');

    // Animação: as duas peças voam uma para a outra e desfazem-se em brilho.
    const mx = (a.px + b.px) / 2, my = (a.py + b.py) / 2;
    for (const t of [a, b]) {
      t.flying = true;
      t.el.classList.add('flying');
      t.el.style.transform = `translate(${mx - t.px}px, ${my - t.py}px) scale(1.05)`;
    }
    setTimeout(() => {
      for (const t of [a, b]) {
        t.flying = false;
        t.el.classList.remove('flying');
        t.el.style.transform = '';
        t.el.classList.toggle('gone', t.removed);
      }
      if (a.removed) burst(board, mx + geo.w / 2, my + geo.h / 2);
    }, 220);

    if (combo >= 2) {
      // Bónus de combo: até 3 moedas por par e no máximo 30 por nível.
      const bonus = Math.min(combo - 1, 3, MAX_COMBO_BONUS - comboBonus);
      comboBonus += bonus;
      const words = ['', '', 'Bom!', 'Ótimo!', 'Incrível!', 'Fantástico!', 'Lendário!'];
      const c = $('[data-ref=combo]');
      c.innerHTML = `<b>Combo x${combo}</b>${words[Math.min(combo, 6)]}`;
      c.classList.remove('show');
      void c.offsetWidth;
      c.classList.add('show');
      if (bonus > 0) floatText(board, mx + geo.w / 2, my, `+${bonus}●`, 'coin-float');
    }

    [...entry.locks, ...entry.bombs].forEach(paint);
    if (entry.bombs.some(t => t.bomb <= 3)) sfx('tick');
    if (mode.n === 1) tutorialNext();
    refresh();
    persist();
  }

  function shake(t) {
    t.el.classList.remove('shake');
    void t.el.offsetWidth;
    t.el.classList.add('shake');
  }

  function undo() {
    if (finished || paused) return;
    const last = history.pop();
    if (!last) return;
    undoMatch(last);
    [...last.pair, ...last.locks, ...last.bombs].forEach(paint);
    selected = null;
    combo = 0;
    sfx('tap');
    refresh();
    persist();
  }

  // Usa uma ajuda: grátis/guardada, senão moedas.
  async function getBooster(kind) {
    if (wallet.available(kind) > 0) { wallet.useItem(kind); updateBadges(); return true; }
    const name = kind === 'hint' ? 'ajudas' : 'baralhos';
    paused++;
    const ok = await new Promise(resolve => {
      modal(
        `<div class="dialog-emoji">${kind === 'hint' ? '💡' : '🔀'}</div><h3>Acabaram as ${name} de hoje</h3>
         <p>Amanhã há mais grátis. Até lá, podes usar moedas ganhas a jogar.</p>`,
        [
          { label: `Usar ${coinHtml(wallet.prices[kind])}`, run: () => { if (wallet.spend(wallet.prices[kind])) { sfx('coin'); resolve(true); } else { toast('Não tens moedas suficientes'); resolve(false); } } },
          { label: 'Cancelar', cls: 'ghost', run: () => resolve(false) },
        ],
      );
    });
    paused--;
    updateBadges();
    return ok;
  }

  async function hint() {
    if (finished || paused) return;
    const [move] = findMoves(tiles);
    if (!move) return;
    if (!(await getBooster('hint'))) return;
    helpsUsed++;
    selected = null;
    refresh();
    sfx('hint');
    move.forEach(t => t.el.classList.add('hint'));
    persist();
  }

  async function doShuffle({ free = false } = {}) {
    if (!tiles.some(t => !t.removed) || paused) return;
    if (!free) {
      if (finished) return;
      if (!(await getBooster('shuffle'))) return;
      helpsUsed++;
    }
    reshuffle(tiles);
    tiles.forEach(t => { if (!t.removed) paint(t); });
    selected = null;
    finished = false;
    sfx('shuffle');
    board.classList.remove('shuffling');
    void board.offsetWidth;
    board.classList.add('shuffling');
    refresh();
    persist();
  }

  // ---------- Fim de jogo ----------

  function win() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    clearSaved(mode);
    setLastSaved(null);
    sfx('win');
    vibrate('heavy');
    confetti();

    const stars = starsFor(seconds, positions.length, helpsUsed);
    const earned = def.coins(stars) + comboBonus;
    wallet.reward({ coins: earned });
    if (helpsUsed === 0) achievements.bump('noHelpWins');
    achievements.setMax('maxCombo', maxCombo);
    analytics.track('level_win', { mode: mode.kind, n: mode.n, seconds, helps: helpsUsed, stars });

    let title = '', isRecord = false, extra = '';
    if (mode.kind === 'level') {
      const p = progress();
      isRecord = p.best[mode.n] == null || seconds < p.best[mode.n];
      if (isRecord) p.best[mode.n] = seconds;
      p.stars[mode.n] = Math.max(p.stars[mode.n] || 0, stars);
      p.unlocked = Math.max(p.unlocked, Math.min(mode.n + 1, TOTAL_LEVELS));
      saveProgress(p);
      title = `Nível ${mode.n} concluído!`;
      if (stars === 3 && mode.n >= 10) setTimeout(requestReviewOnce, 1500);
    } else if (mode.kind === 'daily') {
      const d = dailyState();
      d.done[mode.date] = Math.max(d.done[mode.date] || 0, stars);
      const month = mode.date.slice(0, 7);
      const [y, m] = month.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const doneInMonth = Object.keys(d.done).filter(k => k.startsWith(month)).length;
      if (doneInMonth === daysInMonth && !d.trophies.includes(month)) {
        d.trophies.push(month);
        extra = '<p class="trophy-won">🥇 Troféu do mês ganho!</p>';
      }
      saveDaily(d);
      title = 'Desafio diário concluído!';
    } else {
      const e = eventsState();
      const s = (e[mode.season] ??= { done: 0 });
      s.done = Math.max(s.done, mode.i + 1);
      saveEvents(e);
      title = `Nível ${mode.i + 1} do evento!`;
      if (s.done === EVENT_LEVELS && !s.prized) {
        s.prized = true;
        saveEvents(e);
        wallet.unlock(def.eventStyle, 0);
        wallet.reward({ coins: 200 });
        extra = `<p class="trophy-won">🎉 Evento completo! Ganhaste o estilo de peças e ${coinHtml(200)}</p>`;
      }
    }
    achievements.check();

    const tips = [];
    if (seconds > positions.length * 2) tips.push(`acaba em menos de ${fmtTime(positions.length * 2)}`);
    if (helpsUsed > 0) tips.push('não uses Ajuda nem Baralhar');

    const actions = [
      { label: nextLabel(), run: () => goNext() },
      { label: 'Repetir', cls: 'ghost', run: () => start(true) },
    ];
    modal(
      `${starsHtml(stars, 'big')}<h3>${title}</h3>
       <p>Tempo: <b>${fmtTime(seconds)}</b>${isRecord ? ' · <span class="record">Recorde!</span>' : ''}</p>
       <p class="earned">+${earned} <span class="coin">●</span>${comboBonus ? ` <small>(combos +${comboBonus})</small>` : ''}</p>
       ${extra}
       ${tips.length ? `<p class="tips">Para 3 estrelas: ${tips.join(' e ')}</p>` : ''}`,
      actions,
    );
  }

  function nextLabel() {
    if (mode.kind === 'level') return mode.n < TOTAL_LEVELS ? `Próximo nível (${mode.n + 1})` : 'Mapa de níveis';
    if (mode.kind === 'event') return mode.i + 1 < EVENT_LEVELS ? 'Próximo nível do evento' : 'Voltar ao evento';
    return 'Voltar ao calendário';
  }

  function goNext() {
    if (mode.kind === 'level' && mode.n < TOTAL_LEVELS) {
      nav.replace(game, { kind: 'level', n: mode.n + 1 });
    } else if (mode.kind === 'event' && mode.i + 1 < EVENT_LEVELS) {
      nav.replace(game, { ...mode, i: mode.i + 1 });
    } else {
      nav.back();
    }
  }

  function lose(bombTile) {
    finished = true;
    sfx('boom');
    vibrate('heavy');
    bombTile.el.classList.add('exploding');
    analytics.track('level_lose', { mode: mode.kind, n: mode.n });
    clearSaved(mode);
    modal(
      `<div class="dialog-emoji">💥</div><h3>A bomba explodiu!</h3><p>Usa moedas para ganhar mais 5 jogadas, ou recomeça o nível.</p>`,
      [
        {
          label: `Continuar +5 por ${coinHtml(CONTINUE_PRICE)}`,
          run: () => {
            if (!wallet.spend(CONTINUE_PRICE)) { toast('Não tens moedas suficientes'); return false; }
            sfx('coin');
            tiles.forEach(t => { if (!t.removed && t.hadBomb) { t.bomb += 5; paint(t); } });
            bombTile.el.classList.remove('exploding');
            finished = false;
            refresh();
          },
        },
        { label: 'Recomeçar', cls: 'ghost', run: () => start(true) },
      ],
    );
  }

  function stuck() {
    finished = true;
    const firstTime = !hasSeen('stuck');
    markSeen('stuck');
    modal(
      `<div class="dialog-emoji">😕</div><h3>Sem jogadas</h3>
       <p>Não há pares livres. ${firstTime ? 'Quando isto acontece, baralhar é grátis: as peças trocam de lugar e o jogo continua a ter solução.' : 'Baralha as peças para continuar.'}</p>`,
      [
        { label: 'Baralhar grátis', run: () => doShuffle({ free: true }) },
        { label: 'Desfazer', cls: 'ghost', run: () => { finished = false; undo(); } },
      ],
    );
  }

  // ---------- Tutorial (nível 1) e dicas ----------

  async function intro() {
    if (mode.n === 1 && !history.length) { tutorialStep = 0; tutorialNext(); return; }
    if (def.locks) await mechanicIntro('lock');
    if (def.bombs) await mechanicIntro('bomb');
  }

  function tutorialNext() {
    removeHand?.();
    closeBubble?.();
    removeHand = closeBubble = null;
    if (tutorialStep === 0) {
      const [move] = findMoves(tiles);
      if (!move) return;
      const showHand = i => {
        removeHand?.();
        const t = move[i];
        removeHand = hand(board, t.px + geo.w * 0.5, t.py + geo.h * 0.6);
      };
      showHand(0);
      closeBubble = bubble(board, 'Toca em <b>duas peças iguais</b> para as retirar.', { placement: 'above' });
      const watch = setInterval(() => {
        if (selected === move[0]) showHand(1);
        if (move[0].removed) clearInterval(watch);
      }, 150);
      tutorialStep = 1;
    } else if (tutorialStep === 1) {
      tutorialStep = 2;
      closeBubble = bubble(board, 'Muito bem! As peças <b>escuras</b> estão presas: têm outra por cima ou dos dois lados. Só as claras podem sair.', { placement: 'above', autoClose: 7000 });
    }
  }

  // ---------- Zoom e toques ----------

  function applyZoom() {
    const bw = board.offsetWidth * zoom.s, bh = board.offsetHeight * zoom.s;
    const mx = Math.max(0, (bw - boardWrap.clientWidth) / 2 + 20);
    const my = Math.max(0, (bh - boardWrap.clientHeight) / 2 + 20);
    zoom.x = Math.max(-mx, Math.min(mx, zoom.x));
    zoom.y = Math.max(-my, Math.min(my, zoom.y));
    board.style.transform = zoom.s === 1 ? '' : `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`;
  }

  const pointers = new Map();
  let gesture = null;
  const dist = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

  boardWrap.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) gesture = { type: 'pinch', d0: dist(), s0: zoom.s };
    else if (pointers.size === 1) gesture = { type: 'tap', sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
  });
  boardWrap.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture?.type === 'pinch' && pointers.size === 2) {
      zoom.s = Math.max(1, Math.min(2.5, gesture.s0 * dist() / gesture.d0));
      applyZoom();
    } else if (gesture?.type === 'tap') {
      if (Math.hypot(e.clientX - gesture.sx, e.clientY - gesture.sy) > 10) gesture.moved = true;
      if (gesture.moved && zoom.s > 1) {
        zoom.x += e.clientX - gesture.lx;
        zoom.y += e.clientY - gesture.ly;
        applyZoom();
      }
      gesture.lx = e.clientX;
      gesture.ly = e.clientY;
    }
  });
  const endPointer = e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (gesture?.type === 'tap' && !gesture.moved && e.type === 'pointerup') {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tile');
      if (el && board.contains(el)) onTap(byId.get(Number(el.dataset.id)));
    }
    if (pointers.size === 0) gesture = null;
  };
  boardWrap.addEventListener('pointerup', endPointer);
  boardWrap.addEventListener('pointercancel', endPointer);

  $('[data-act=zoom]').onclick = e => {
    e.stopPropagation();
    zoom = zoom.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 1.8, x: 0, y: 0 };
    applyZoom();
  };
  $('[data-act=zoom]').addEventListener('pointerdown', e => e.stopPropagation());

  // ---------- Botões ----------

  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=restart]').onclick = () => {
    if (!history.length) return;
    paused++;
    modal('<h3>Recomeçar o nível?</h3><p>Perdes o progresso deste jogo.</p>', [
      { label: 'Recomeçar', run: () => { paused--; start(true); } },
      { label: 'Cancelar', cls: 'ghost', run: () => { paused--; } },
    ]);
  };
  $('[data-act=undo]').onclick = undo;
  $('[data-act=hint]').onclick = hint;
  $('[data-act=shuffle]').onclick = () => doShuffle();

  const ro = new ResizeObserver(() => layoutBoard());
  ro.observe(boardWrap);
  start();

  return () => {
    clearInterval(timer);
    ro.disconnect();
    removeHand?.();
    closeBubble?.();
    if (!finished && history.length) {
      persist();
      analytics.track('level_quit', { mode: mode.kind, n: mode.n });
    }
  };
}
