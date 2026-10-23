// Ecrã de jogo da Fornada: clássico (3×3 a 6×6), desafios e desafio diário.
import { newState, move, canMove, clone, maxTile, isStone } from './engine.js';
import { challenge, challengeState, dailyChallenge, TOTAL_LEVELS, ZONES } from './levels.js';
import { sweetSvg, sweetOf, WILD_SVG, NUM_COLORS } from './art.js';
import { progress, update, loadSaved, storeSaved, clearSaved, dailyState, saveDaily } from './progress.js';
import { wallet, achievements, analytics } from './meta.js';
import { sfx } from '../../core/audio.js';
import { vibrate, requestReviewOnce } from '../../core/native.js';
import { modal, toast, confetti, coinHtml } from '../../core/ui.js';

// target: { classic: N } | número do desafio | { date }
export function fornadaGame(root, nav, target) {
  const classic = typeof target === 'object' && target.classic;
  const daily = typeof target === 'object' && target.date;
  const lv = classic ? null : daily ? dailyChallenge(target.date) : challenge(target);
  const N = classic ? target.classic : lv.N;
  const title = classic ? `Clássico ${N}×${N}` : daily ? `Diário · ${target.date.slice(8)}/${target.date.slice(5, 7)}` : `Desafio ${target}`;
  const sub = classic ? 'Chega ao bolo-rei' : daily ? 'Igual para toda a gente hoje' : `${ZONES[lv.zone].icon} ${ZONES[lv.zone].name}`;

  root.innerHTML = `
    <div class="screen fn-game">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <div class="fn-title"><b>${title}</b><small>${sub}</small></div>
        <button class="icon-btn" data-act="restart" aria-label="Recomeçar">↻</button>
      </header>
      <div class="fn-info">
        ${classic ? `<div class="fn-box"><small>Pontos</small><b data-ref="score">0</b></div><div class="fn-box"><small>Melhor</small><b data-ref="best">0</b></div>`
          : `<div class="fn-goal">${sweetSvg(lv.goal)}<span><small>Faz</small><b>${sweetOf(lv.goal).name}</b></span></div><div class="fn-box"><small>Jogadas</small><b data-ref="left">0</b></div>`}
      </div>
      <div class="fn-stage"><div class="fn-board" data-ref="board"></div></div>
      <footer class="fn-controls">
        <button class="fn-btn" data-act="undo">↶ Desfazer <em data-ref="undo"></em></button>
        <button class="fn-btn" data-act="theme">${progress().numbers ? '🧁 Doces' : '🔢 Números'}</button>
      </footer>
    </div>`;
  const $ = s => root.querySelector(s);
  const board = $('[data-ref=board]'), stage = $('.fn-stage');

  let s, hist, extraUsed, finished, keptGoing, busy = false, CS = 60, GAP = 8, seconds = 0, timer;
  let numbers = progress().numbers;

  function start(fresh = false) {
    const saved = !fresh && loadSaved(target);
    if (saved) { s = saved.s; hist = saved.hist || []; extraUsed = saved.extraUsed; keptGoing = saved.keptGoing; seconds = saved.seconds || 0; }
    else {
      s = classic ? newState({ N, seed: (Math.random() * 2 ** 31) >>> 0 }) : challengeState(lv);
      hist = []; extraUsed = 0; keptGoing = false; seconds = 0;
      clearSaved(target);
    }
    finished = false;
    analytics.track('level_start', { mode: classic ? 'classic' : daily ? 'daily' : 'level', n: classic ? null : target });
    clearInterval(timer);
    timer = setInterval(() => { if (!finished && !document.hidden) seconds++; }, 1000);
    board.innerHTML = '';
    layout(); render(); info();
  }
  const persist = () => { if (!finished && s.moves) storeSaved(target, { s, hist: hist.slice(-12), extraUsed, keptGoing, seconds }); };
  const movesLimit = () => (lv ? lv.moves + extraUsed * 5 : Infinity);

  // ---------- Desenho ----------
  function layout() {
    const size = Math.min(stage.clientWidth - 24, stage.clientHeight - 16, 560);
    board.style.width = board.style.height = `${size}px`;
    GAP = Math.max(5, Math.round(size * (N >= 6 ? 0.02 : 0.03)));
    CS = (size - GAP * (N + 1)) / N;
    board.style.setProperty('--cs', `${CS}px`);
    board.style.setProperty('--gap', `${GAP}px`);
  }
  const pos = i => `translate(${GAP + (i % N) * (CS + GAP)}px, ${GAP + Math.floor(i / N) * (CS + GAP)}px)`;
  function tileHtml(t) {
    if (t.wild) return `${WILD_SVG}<span class="fn-num">×2</span>`;
    return numbers ? `<span class="fn-num">${t.v}</span>` : `${sweetSvg(t.v)}<span class="fn-num">${t.v}</span>`;
  }
  function render(res = null) {
    // Casas e pedras
    let cells = '';
    for (let i = 0; i < N * N; i++) {
      const stone = s.stones.find(x => x.i === i);
      cells += `<div class="fn-cell ${stone ? (stone.t ? 'oven' : 'stone') : ''}" style="width:${CS}px;height:${CS}px;transform:${pos(i)}">${stone && stone.t ? `<b>${stone.t}</b>` : ''}</div>`;
    }
    board.querySelectorAll('.fn-cell').forEach(el => el.remove());
    board.insertAdjacentHTML('afterbegin', cells);
    const existing = new Map([...board.querySelectorAll('.fn-tile')].map(el => [Number(el.dataset.id), el]));
    const live = new Set();
    s.cells.forEach((t, i) => {
      if (!t) return;
      live.add(t.id);
      let el = existing.get(t.id);
      const isNew = !el;
      if (!el) { el = document.createElement('div'); el.dataset.id = t.id; board.appendChild(el); }
      const merged = res?.merges.some(m => m.into === t.id);
      el.className = `fn-tile ${numbers && !t.wild ? 'numbers' : 'art'} ${t.v >= 1024 ? 'big' : ''} ${t.frozen ? 'frozen' : ''} ${isNew && res ? 'new' : ''} ${merged ? 'merged' : ''}`;
      Object.assign(el.style, { width: `${CS}px`, height: `${CS}px`, transform: pos(i), zIndex: 2 });
      el.style.setProperty('--pos', pos(i));
      el.style.background = t.wild ? '#dff3ea' : numbers ? (NUM_COLORS[t.v] || '#3c3a32') : sweetOf(t.v).bg;
      el.style.color = numbers && t.v > 4 && !t.wild ? '#fff' : '#3a2418';
      const keyV = `${t.v}|${t.wild}|${numbers}`;
      if (el.dataset.k !== keyV) { el.innerHTML = tileHtml(t); el.dataset.k = keyV; }
    });
    // Peças que se juntaram: deslizam até ao destino e só depois desaparecem
    existing.forEach((el, id) => {
      if (live.has(id)) return;
      const m = res?.merges.find(x => x.id === id);
      if (m) { el.style.transform = pos(m.to); el.style.zIndex = 1; setTimeout(() => el.remove(), 120); }
      else el.remove();
    });
  }
  function info() {
    if (classic) {
      $('[data-ref=score]').textContent = s.score;
      $('[data-ref=best]').textContent = Math.max(progress().best[N] || 0, s.score);
    } else {
      const left = movesLimit() - s.moves;
      const el = $('[data-ref=left]');
      el.textContent = left;
      el.parentElement.classList.toggle('low', left <= 10);
    }
    const a = wallet.available('undo');
    $('[data-ref=undo]').innerHTML = a > 0 ? `(${a})` : coinHtml(wallet.prices.undo);
  }

  // ---------- Jogadas ----------
  function play(dir) {
    if (finished || busy) return;
    const before = clone(s);
    const res = move(s, dir);
    if (!res) { vibrate('light'); return; }
    hist.push(before); if (hist.length > 30) hist.shift();
    busy = true;
    render(res);
    const big = res.merges.reduce((m, x) => Math.max(m, x.v), 0);
    if (big) { sfx(big >= 256 ? 'trio' : 'match', Math.min(4, Math.log2(big) - 3)); vibrate(big >= 128 ? 'medium' : 'light'); }
    else sfx('slide');
    if (res.opened.length) { sfx('unlock'); toast('♨️ Um forno abriu'); }
    if (res.thawed.length) sfx('thaw');
    setTimeout(() => { busy = false; }, 90);
    newRecipe();
    info();
    persist();
    check();
  }
  function newRecipe() {
    const top = maxTile(s);
    const p = progress();
    if (top && !p.made.includes(top)) {
      update(q => { q.made = [...new Set([...q.made, top])].sort((a, b) => a - b); });
      const sw = sweetOf(top);
      if (top >= 16) { toast(`📖 Nova receita: <b>${sw.name}</b>`, 2200); wallet.reward({ coins: Math.min(100, Math.log2(top) * 3) }); }
      achievements.check();
    }
    if (classic) update(q => { q.bestTile[N] = Math.max(q.bestTile[N] || 0, top); q.best[N] = Math.max(q.best[N] || 0, s.score); });
  }
  function check() {
    if (classic) {
      if (!keptGoing && maxTile(s) >= 2048) { keptGoing = true; persist(); bigWin(); return; }
      if (!canMove(s)) gameOver();
      return;
    }
    if (maxTile(s) >= lv.goal) { win(); return; }
    if (s.moves >= movesLimit() || !canMove(s)) lost();
  }

  function undo() {
    if (busy || finished || !hist.length) { if (!hist.length) toast('Não há nada para desfazer.'); return; }
    const go = () => {
      const movesNow = s.moves;
      s = hist.pop();
      if (!classic) s.moves = movesNow;   // nos desafios, as jogadas desfeitas contam
      board.innerHTML = '';
      sfx('slide'); render(); info(); persist();
    };
    if (wallet.available('undo') > 0) { wallet.useItem('undo'); go(); return; }
    modal(`<h3>Acabaram os desfazer de hoje</h3><p>Amanhã há mais 5. Também podes usar moedas.</p>`, [
      { label: `Desfazer ${coinHtml(wallet.prices.undo)}`, run: () => { if (wallet.spend(wallet.prices.undo)) { sfx('coin'); go(); } else toast('Não tens moedas suficientes'); } },
      { label: 'Cancelar', cls: 'ghost' },
    ]);
  }

  // ---------- Fim ----------
  function bigWin() {
    sfx('win'); confetti();
    modal(`<div class="fn-bigart">${sweetSvg(2048)}</div><h3>Bolo-rei!</h3><p>Fizeste um bolo-rei. Queres continuar a fornada até ao bolo de noiva?</p>`,
      [{ label: 'Continuar', run: () => {} }, { label: 'Novo jogo', cls: 'ghost', run: () => start(true) }]);
  }
  function gameOver() {
    finished = true; clearInterval(timer);
    clearSaved(target);
    const p = progress();
    const record = s.score >= (p.best[N] || 0) && s.score > 0;
    wallet.reward({ coins: Math.floor(s.score / 500) });
    analytics.track('level_win', { mode: 'classic', n: null, seconds, helps: 0 });
    achievements.check();
    sfx(record ? 'win' : 'lose');
    modal(`<div class="fn-bigart">${sweetSvg(maxTile(s))}</div><h3>${record ? 'Novo recorde!' : 'Tabuleiro cheio'}</h3>
      <p>${s.score} pontos · o maior doce foi <b>${sweetOf(maxTile(s)).name}</b>.</p><p class="earned">+${Math.floor(s.score / 500)} <span class="coin">●</span></p>`,
      [{ label: 'Novo jogo', run: () => start(true) }, ...(hist.length ? [{ label: '↶ Desfazer', cls: 'secondary', run: () => { finished = false; undo(); } }] : []), { label: 'Sair', cls: 'ghost', run: () => nav.back() }]);
  }
  function win() {
    finished = true; clearInterval(timer);
    clearSaved(target);
    const left = movesLimit() - s.moves, limit = lv.moves;
    const stars = left >= limit * 0.35 ? 3 : left >= limit * 0.15 ? 2 : 1;
    let coins = 15 + 5 * stars;
    if (daily) {
      coins = 40 + 10 * stars;
      const d = dailyState();
      d.done[target.date] = Math.max(d.done[target.date] || 0, stars);
      const month = target.date.slice(0, 7), [y, m] = month.split('-').map(Number);
      if (Object.keys(d.done).filter(k => k.startsWith(month)).length === new Date(y, m, 0).getDate() && !d.trophies.includes(month)) { d.trophies.push(month); coins += 200; }
      saveDaily(d);
    } else {
      update(p => { p.stars[target] = Math.max(p.stars[target] || 0, stars); if (target === p.current) p.current = Math.min(target + 1, TOTAL_LEVELS + 1); });
    }
    wallet.reward({ coins });
    analytics.track('level_win', { mode: daily ? 'daily' : 'level', n: daily ? null : target, seconds, helps: hist.length ? 0 : 0 });
    achievements.check();
    sfx('win'); vibrate('heavy'); confetti();
    if (stars === 3 && !daily && target >= 10) setTimeout(requestReviewOnce, 1500);
    modal(`<div class="fn-bigart">${sweetSvg(lv.goal)}</div><span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>
      <h3>Saiu do forno: ${sweetOf(lv.goal).name}!</h3><p>Sobraram ${left} jogadas.</p><p class="earned">+${coins} <span class="coin">●</span></p>`,
      [...(!daily && target < TOTAL_LEVELS ? [{ label: `Desafio ${target + 1}`, run: () => nav.replace(fornadaGame, target + 1) }] : []),
        { label: daily ? 'Voltar ao calendário' : 'Voltar', cls: daily ? '' : 'secondary', run: () => nav.back() }]);
  }
  function lost() {
    sfx('lose'); vibrate('heavy');
    const noMoves = !canMove(s);
    const free = extraUsed === 0;
    const actions = [];
    if (!noMoves) actions.push({ label: free ? '+5 jogadas (grátis)' : `+5 jogadas ${wallet.available('moves') ? `(${wallet.available('moves')})` : coinHtml(wallet.prices.moves)}`, run: () => extra(free) });
    if (noMoves && hist.length) actions.push({ label: '↶ Desfazer', run: undo });
    actions.push({ label: 'Recomeçar', cls: 'ghost', run: () => { analytics.track('level_lose', { mode: daily ? 'daily' : 'level', n: daily ? null : target }); start(true); } });
    modal(`<div class="dialog-emoji">${noMoves ? '🧺' : '⏳'}</div><h3>${noMoves ? 'Tabuleiro cheio' : 'Acabaram as jogadas'}</h3><p>Faltou fazer: ${sweetOf(lv.goal).name}.</p>`, actions);
  }
  function extra(free) {
    const go = () => { extraUsed++; info(); persist(); sfx('unlock'); };
    if (free) return go();
    if (wallet.available('moves') > 0) { wallet.useItem('moves'); return go(); }
    if (wallet.spend(wallet.prices.moves)) { sfx('coin'); return go(); }
    toast('Não tens moedas suficientes'); lost();
  }

  // ---------- Toques e teclado ----------
  let startP = null;
  board.addEventListener('pointerdown', e => { startP = { x: e.clientX, y: e.clientY }; board.setPointerCapture(e.pointerId); });
  board.addEventListener('pointerup', e => {
    if (!startP) return;
    const dx = e.clientX - startP.x, dy = e.clientY - startP.y; startP = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    play(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  board.addEventListener('pointercancel', () => { startP = null; });
  const onKey = e => {
    const d = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
    if (!d || document.querySelector('.overlay')) return;
    e.preventDefault(); play(d);
  };
  document.addEventListener('keydown', onKey);
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=restart]').onclick = () => {
    if (!s.moves) return;
    modal('<h3>Começar de novo?</h3><p>Este tabuleiro perde-se.</p>', [{ label: 'Recomeçar', run: () => start(true) }, { label: 'Cancelar', cls: 'ghost' }]);
  };
  $('[data-act=undo]').onclick = undo;
  $('[data-act=theme]').onclick = e => {
    numbers = !numbers;
    update(q => { q.numbers = numbers; });
    e.currentTarget.textContent = numbers ? '🧁 Doces' : '🔢 Números';
    board.innerHTML = ''; render();
  };
  const ro = new ResizeObserver(() => requestAnimationFrame(() => { layout(); board.innerHTML = ''; render(); }));
  ro.observe(stage);
  start();
  if (!classic && !progress().seen[`zone-${lv.zone}`] && !daily) {
    update(q => { q.seen[`zone-${lv.zone}`] = true; });
    setTimeout(() => modal(`<div class="dialog-emoji">${ZONES[lv.zone].icon}</div><h3>${ZONES[lv.zone].name}</h3><p>${ZONES[lv.zone].text}</p><p>Objetivo: <b>${sweetOf(lv.goal).name}</b> em ${lv.moves} jogadas.</p>`, [{ label: 'Vamos!' }]), 250);
  }

  return () => {
    clearInterval(timer); ro.disconnect();
    document.removeEventListener('keydown', onKey);
    if (!finished && s.moves) { persist(); analytics.track('level_quit', { mode: classic ? 'classic' : daily ? 'daily' : 'level', n: classic || daily ? null : target }); }
  };
}
