// Ecrã de jogo da Casa na Serra: cúpula de azulejos, barra de 7 e trios.
import { getLevel, getDailyLevel, ZONES, MECHANICS, TOTAL_LEVELS } from './levels.js';
import { newGame, touch, canTouch, blockedReason, isFree, isLost, isWon, tilesLeft, magnet, reshuffle, insertInBar } from './engine.js';
import { iconSvg, ICON_NAMES, BACK_SVG, GIFT_SVG } from './art.js';
import { drawScene, startSnow } from './scene.js';
import { progress, update, loadSaved, storeSaved, clearSaved, dailyState, saveDaily } from './progress.js';
import { wallet, achievements, analytics } from './meta.js';
import { sfx } from '../../core/audio.js';
import { vibrate, requestReviewOnce } from '../../core/native.js';
import { modal, toast, confetti, coinHtml, bubble, hand } from '../../core/ui.js';

let pending = null;
export const takeCelebration = () => { const c = pending; pending = null; return c; };

const HELP = { magnet: { icon: '🧲', name: 'Íman', text: 'tira um trio' }, shuffle: { icon: '🔀', name: 'Baralhar', text: 'troca os desenhos' }, slot: { icon: '➕', name: 'Lugar extra', text: 'mais um lugar na barra' } };

// target: número do nível, ou { date } do desafio diário.
export function casaGame(root, nav, target) {
  const daily = typeof target === 'object';
  const level = daily ? getDailyLevel(target.date) : getLevel(target);
  const n = daily ? null : target;
  const zone = ZONES[level.zone];
  const title = daily ? `Diário · ${target.date.slice(8)}/${target.date.slice(5, 7)}` : `Nível ${n}`;
  const chips = Object.keys(level.mech).map(k => `<span>${MECHANICS[k].icon} ${MECHANICS[k].name}</span>`);

  root.innerHTML = `
    <div class="screen cs-game">
      <canvas class="cs-scene" aria-hidden="true"></canvas>
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <div class="cs-title"><b>${title}</b><small>${daily ? 'Desafio do dia' : zone.name}</small></div>
        <button class="icon-btn" data-act="restart" aria-label="Recomeçar">↻</button>
      </header>
      <div class="cs-chips">${chips.join('')}<span class="cs-left" data-ref="left"></span></div>
      <div class="cs-bench"><div class="cs-board"></div></div>
      <div class="cs-tray" data-ref="tray"></div>
      <footer class="cs-tools">
        <button class="cs-tool" data-act="undo" aria-label="Desfazer"><span>↶</span></button>
        <button class="cs-tool" data-act="magnet" aria-label="Íman"><span>🧲</span><b data-ref="magnet"></b></button>
        <button class="cs-tool" data-act="shuffle" aria-label="Baralhar"><span>🔀</span><b data-ref="shuffle"></b></button>
        <button class="cs-tool" data-act="slot" aria-label="Lugar extra"><span>➕</span><b data-ref="slot"></b></button>
      </footer>
      <canvas class="cs-snow" aria-hidden="true"></canvas>
    </div>`;

  const $ = s => root.querySelector(s);
  const bench = $('.cs-bench'), board = $('.cs-board'), trayEl = $('[data-ref=tray]');
  const sceneCv = $('.cs-scene'), stopSnow = startSnow($('.cs-snow'));

  let g, history, s, busy, finished, geo, seconds, timer;

  function start(fresh = false) {
    const saved = !fresh && loadSaved(target);
    if (saved) { g = saved.g; history = saved.history; s = saved.s; seconds = saved.seconds; toast('Jogo retomado'); }
    else {
      g = newGame(level); history = [];
      s = { helps: 0, extraUsed: false, freeHelp: true, streak: 0, bestStreak: 0 };
      seconds = 0; clearSaved(target);
    }
    busy = false; finished = false;
    analytics.track('level_start', { mode: daily ? 'daily' : 'level', n });
    clearInterval(timer);
    timer = setInterval(() => { if (!finished && !document.hidden) seconds++; }, 1000);
    layout(); render(); badges();
    setTimeout(intro, 300);
  }
  const persist = () => { if (!finished && g.moves) storeSaved(target, { g, history, s, seconds }); };

  // ---------- Desenho ----------
  function layout() {
    const ts = g.tiles;
    const maxX = Math.max(...ts.map(t => t.x)) + 2, maxY = Math.max(...ts.map(t => t.y)) + 2, maxZ = Math.max(...ts.map(t => t.z));
    const W = bench.clientWidth - 8, H = bench.clientHeight - 8;
    const w = Math.floor(Math.min(58, W / (maxX / 2), H / (maxY / 2 + maxZ * 0.17 + 0.2)));
    geo = { w, lift: Math.round(w * 0.17), maxZ };
    board.style.width = `${(maxX / 2) * w}px`;
    board.style.height = `${(maxY / 2) * w + maxZ * geo.lift + w * 0.2}px`;
    board.style.setProperty('--s', `${w}px`);
  }
  const pileCount = t => g.tiles.filter(o => !o.gone && o.pile && o.x === t.x && o.y === t.y).length;
  function tileHtml(t) {
    const free = isFree(t, g.tiles);
    const face = t.flipped && !free ? BACK_SVG : t.gift && !free ? GIFT_SVG : iconSvg(t.face);
    const marks = [
      t.ice > 0 ? '<i class="cs-ice"></i>' : '',
      t.chain && (g.cleared[t.chain] || 0) === 0 ? `<i class="cs-chain"><span>${iconSvg(t.chain)}</span></i>` : '',
      t.gift && free ? '<i class="cs-giftmark">🎁</i>' : '',
      t.pile && free && pileCount(t) > 1 ? `<i class="cs-stack">${pileCount(t)}</i>` : '',
    ].join('');
    const left = (t.x / 2) * geo.w, top = (t.y / 2) * geo.w + (geo.maxZ - t.z) * geo.lift;
    return `<button class="cs-tile ${free ? '' : 'blocked'} ${t.gold ? 'gold' : ''}" data-i="${t.id}"
      style="left:${left}px;top:${top}px;z-index:${t.z * 1000 + t.y * 10 + t.x}" aria-label="${t.flipped && !free ? 'Azulejo virado' : ICON_NAMES[t.face]}">${face}${marks}</button>`;
  }
  function render() {
    board.innerHTML = g.tiles.filter(t => !t.gone).map(tileHtml).join('');
    renderTray();
    $('[data-ref=left]').textContent = `${tilesLeft(g)} azulejos`;
  }
  function renderTray(clearing = []) {
    trayEl.style.setProperty('--n', g.barSize);
    trayEl.innerHTML = Array.from({ length: Math.max(g.barSize, level.cork ? 7 : g.barSize) }, (_, k) => k >= g.barSize
      ? '<div class="cs-slot cork">🍾</div>'
      : `<div class="cs-slot ${g.bar[k] ? 'full' : ''} ${clearing.includes(k) ? 'clear' : ''}">${g.bar[k] ? iconSvg(g.bar[k].face) : ''}</div>`).join('');
    trayEl.classList.toggle('danger', g.bar.length >= g.barSize - 2);
  }
  function badges() {
    for (const k of ['magnet', 'shuffle', 'slot']) {
      const a = wallet.available(k), el = $(`[data-ref=${k}]`);
      el.innerHTML = a > 0 ? a : coinHtml(wallet.prices[k]);
      el.classList.toggle('price', a === 0);
    }
  }
  function fly(fromRect, toEl, face) {
    return new Promise(res => {
      if (!fromRect || !toEl) return res();
      const b = toEl.getBoundingClientRect();
      const f = document.createElement('div'); f.className = 'cs-fly'; f.innerHTML = iconSvg(face);
      Object.assign(f.style, { left: `${fromRect.left}px`, top: `${fromRect.top}px`, width: `${fromRect.width}px`, height: `${fromRect.height}px` });
      document.body.appendChild(f);
      toEl.style.visibility = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(f.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` })));
      setTimeout(() => { f.remove(); toEl.style.visibility = ''; res(); }, 250);
    });
  }
  function sparkle(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    for (let k = 0; k < 16; k++) {
      const sp = document.createElement('i'); sp.className = 'cs-spark';
      const a = (Math.PI * 2 * k) / 16, d = 24 + Math.random() * 32;
      sp.style.left = `${r.left + r.width / 2}px`; sp.style.top = `${r.top + r.height / 2}px`;
      sp.style.setProperty('--dx', `${Math.cos(a) * d}px`); sp.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      document.body.appendChild(sp); setTimeout(() => sp.remove(), 650);
    }
  }

  // ---------- Jogadas ----------
  const queue = [];
  async function onTap(id) {
    if (finished) return;
    if (busy) { if (queue.length < 3) queue.push(id); return; }
    const t = g.tiles[id];
    if (!canTouch(g, t)) {
      sfx('blocked'); vibrate('light');
      board.querySelector(`[data-i="${id}"]`)?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 200 });
      if (blockedReason(g, t) === 'chain') toast(`⛓️ Faz primeiro um trio de ${ICON_NAMES[t.chain]}.`, 1800);
      return;
    }
    busy = true;
    removeHand?.();
    const el = board.querySelector(`[data-i="${id}"]`), rect = el?.getBoundingClientRect();
    const barBefore = g.bar.map(b => ({ ...b }));
    const res = touch(g, id);
    if (res.kind === 'crack') { sfx('thaw'); vibrate('light'); render(); busy = false; persist(); next(); return; }
    history.push(id);
    sfx('tap'); vibrate('light');
    // Mostra a barra antes de saírem os trios, para o azulejo voar até ao sítio certo
    const tmp = barBefore; const at = insertInBar(tmp, { id, face: t.face });
    render();
    trayEl.innerHTML = Array.from({ length: g.barSize }, (_, k) => `<div class="cs-slot ${tmp[k] ? 'full' : ''}">${tmp[k] ? iconSvg(tmp[k].face) : ''}</div>`).join('') + (level.cork && g.barSize < 7 ? '<div class="cs-slot cork">🍾</div>' : '');
    await fly(rect, trayEl.children[at], t.face);
    sfx('pick');
    if (res.gold) { wallet.reward({ coins: 5 }); toast(`✨ +5 ${coinHtml('')}`, 900); }
    if (res.gift) {
      const k = ['magnet', 'shuffle'][Math.floor(Math.random() * 2)];
      wallet.reward({ [k]: 1 }); badges();
      toast(`🎁 Presente: +1 ${HELP[k].icon} ${HELP[k].name}`, 1600);
    }
    if (res.trios.length) {
      const idx = tmp.map((b, k) => (b.face === res.trios[0] ? k : -1)).filter(k => k >= 0).slice(0, 3);
      idx.forEach(k => trayEl.children[k]?.classList.add('clear'));
      sparkle(trayEl.children[idx[1]]);
      s.streak += res.trios.length; s.bestStreak = Math.max(s.bestStreak, s.streak);
      sfx('trio', Math.min(4, s.streak - 1)); vibrate('medium');
      achievements.setMax('maxCombo', s.bestStreak);
      await new Promise(r => setTimeout(r, 320));
    } else s.streak = 0;
    render();
    busy = false;
    persist();
    tutorial();
    if (isWon(g)) { setTimeout(win, 250); return; }
    if (isLost(g)) { lost(); return; }
    next();
  }
  const next = () => { if (queue.length && !finished) onTap(queue.shift()); };

  // ---------- Ajudas ----------
  async function getItem(kind, free = false) {
    if (free) return true;
    if (wallet.available(kind) > 0) { wallet.useItem(kind); badges(); return true; }
    const ok = await new Promise(resolve => modal(`<h3>Acabou: ${HELP[kind].icon} ${HELP[kind].name}</h3><p>Podes usar moedas ganhas a jogar.</p>`, [
      { label: `Usar ${coinHtml(wallet.prices[kind])}`, run: () => { if (wallet.spend(wallet.prices[kind])) { sfx('coin'); resolve(true); } else { toast('Não tens moedas suficientes'); resolve(false); } } },
      { label: 'Cancelar', cls: 'ghost', run: () => resolve(false) },
    ]));
    badges();
    return ok;
  }
  function undo() {
    if (busy || finished) return;
    const id = history[history.length - 1];
    const k = id == null ? -1 : g.bar.findIndex(b => b.id === id);
    if (k < 0) { toast('Só dá para desfazer azulejos que ainda estão na barra.'); return; }
    history.pop(); g.bar.splice(k, 1); g.tiles[id].gone = false; g.moves = Math.max(0, g.moves - 1);
    s.helps++; s.streak = 0;
    sfx('slide'); render(); persist();
  }
  async function useMagnet(free = false) {
    if (busy || finished) return;
    if (!(await getItem('magnet', free))) return;
    const res = magnet(g);
    if (!res) { toast('Não há trio para o íman.'); return; }
    s.helps++;
    sfx('hint'); render();
    sparkle(trayEl.children[0]);
    persist();
    if (isWon(g)) setTimeout(win, 250);
  }
  async function useShuffle() {
    if (busy || finished) return;
    if (!(await getItem('shuffle'))) return;
    s.helps++;
    reshuffle(g);
    sfx('shuffle');
    board.classList.remove('shuffling'); void board.offsetWidth; board.classList.add('shuffling');
    render(); persist();
  }
  async function useSlot(free = false) {
    if (busy || finished) return;
    if (s.extraUsed) { toast('O lugar extra só se usa uma vez por nível.'); return; }
    if (!(await getItem('slot', free))) return;
    s.helps++; s.extraUsed = true; g.barSize += 1;
    sfx('unlock'); render(); persist();
  }

  // ---------- Fim ----------
  function lost() {
    sfx('lose'); vibrate('heavy');
    const actions = [];
    if (s.freeHelp) {
      actions.push({ label: '➕ Lugar extra (grátis)', run: () => { s.freeHelp = false; if (!s.extraUsed) useSlot(true); else useMagnet(true); } });
    } else {
      if (!s.extraUsed) actions.push({ label: `➕ Lugar extra ${wallet.available('slot') ? `(${wallet.available('slot')})` : coinHtml(wallet.prices.slot)}`, run: () => useSlot() });
      actions.push({ label: `🧲 Íman ${wallet.available('magnet') ? `(${wallet.available('magnet')})` : coinHtml(wallet.prices.magnet)}`, cls: 'secondary', run: () => useMagnet() });
    }
    actions.push({ label: 'Recomeçar', cls: 'ghost', run: () => { analytics.track('level_lose', { mode: daily ? 'daily' : 'level', n }); start(true); } });
    modal(`<div class="dialog-emoji">🧺</div><h3>Barra cheia</h3><p>Não há lugar para mais azulejos. ${s.freeHelp ? 'Desta vez o lugar extra é grátis.' : 'Usa uma ajuda ou recomeça.'}</p>`, actions);
  }

  function win() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    clearSaved(target);
    sfx('win'); vibrate('heavy'); confetti();
    const stars = 1 + (s.helps === 0 ? 1 : 0) + (g.maxBar <= 5 ? 1 : 0);
    let coins = 10 + 5 * stars, houseStar = 0;
    if (daily) {
      coins = 40 + 10 * stars;
      const d = dailyState();
      if (!d.done[target.date]) houseStar = 1;
      d.done[target.date] = Math.max(d.done[target.date] || 0, stars);
      const month = target.date.slice(0, 7), [y, m] = month.split('-').map(Number);
      if (Object.keys(d.done).filter(k => k.startsWith(month)).length === new Date(y, m, 0).getDate() && !d.trophies.includes(month)) { d.trophies.push(month); coins += 200; }
      saveDaily(d);
    } else {
      update(p => {
        if (!p.stars[n]) houseStar = 1;
        p.stars[n] = Math.max(p.stars[n] || 0, stars);
        if (n === p.current) p.current = Math.min(n + 1, TOTAL_LEVELS + 1);
      });
    }
    if (houseStar) update(p => { p.bank += 1; });
    pending = { stars, houseStar };
    wallet.reward({ coins });
    analytics.track('level_win', { mode: daily ? 'daily' : 'level', n, seconds, helps: s.helps });
    achievements.check();
    if (stars === 3 && n >= 10) setTimeout(requestReviewOnce, 1500);
    const tips = [];
    if (s.helps) tips.push('não uses ajudas');
    if (g.maxBar > 5) tips.push('não passes de 5 na barra');
    modal(
      `<span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>
       <h3>${daily ? 'Desafio do dia feito!' : 'Cúpula limpa!'}</h3>
       ${houseStar ? '<p class="cs-housestar">+1 ⭐ para a casa</p>' : ''}
       <p class="earned">+${coins} <span class="coin">●</span></p>
       ${tips.length ? `<p class="tips">Para 3 estrelas: ${tips.join(' e ')}</p>` : ''}`,
      [
        ...(!daily && n < TOTAL_LEVELS ? [{ label: `Nível ${n + 1}`, run: () => nav.replace(casaGame, n + 1) }] : []),
        { label: daily ? 'Voltar ao calendário' : 'Ir para a casa', cls: daily ? '' : 'secondary', run: () => nav.back() },
      ],
    );
  }

  // ---------- Explicações e tutorial ----------
  let removeHand = null, closeBubble = null;
  async function intro() {
    const p = progress();
    for (const k of Object.keys(level.mech)) {
      if (p.seen[`mech-${k}`]) continue;
      update(q => { q.seen[`mech-${k}`] = true; });
      await new Promise(resolve => modal(`<div class="dialog-emoji">${MECHANICS[k].icon}</div><h3>${MECHANICS[k].name}</h3><p>${MECHANICS[k].text}</p>`, [{ label: 'Percebi', run: resolve }]));
    }
    tutorial();
  }
  function tutorial() {
    if (n !== 1 || finished) return;
    removeHand?.(); closeBubble?.(); removeHand = closeBubble = null;
    // Sugere um azulejo livre com o desenho que já está na barra (ou qualquer livre)
    const free = g.tiles.filter(t => !t.gone && canTouch(g, t));
    const want = g.bar[0]?.face;
    const t = free.find(x => x.face === want) || free[0];
    if (!t) return;
    const el = board.querySelector(`[data-i="${t.id}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect(), br = board.getBoundingClientRect();
    removeHand = hand(board, r.left - br.left + r.width / 2, r.top - br.top + r.height * 0.6);
    const msg = !g.moves ? 'Toca num azulejo <b>claro</b>: vai para a barra.' : g.bar.length ? 'Junta <b>três iguais</b> na barra para desaparecerem.' : 'Muito bem! Continua até limpar a cúpula.';
    closeBubble = bubble(trayEl, msg, { placement: 'above', autoClose: 5000 });
  }

  // ---------- Botões ----------
  board.addEventListener('click', e => { const b = e.target.closest('.cs-tile'); if (b) onTap(Number(b.dataset.i)); });
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=restart]').onclick = () => {
    if (!g.moves || busy) return;
    modal('<h3>Recomeçar o nível?</h3><p>Os azulejos voltam ao início.</p>', [{ label: 'Recomeçar', run: () => start(true) }, { label: 'Cancelar', cls: 'ghost' }]);
  };
  $('[data-act=undo]').onclick = undo;
  $('[data-act=magnet]').onclick = () => useMagnet();
  $('[data-act=shuffle]').onclick = useShuffle;
  $('[data-act=slot]').onclick = () => useSlot();
  const ro = new ResizeObserver(() => requestAnimationFrame(() => { drawScene(sceneCv, level.zone); if (g && !busy) { layout(); render(); } }));
  ro.observe(root.querySelector('.cs-game'));
  start();

  return () => {
    clearInterval(timer); ro.disconnect(); stopSnow();
    removeHand?.(); closeBubble?.();
    if (!finished && g.moves) { persist(); analytics.track('level_quit', { mode: daily ? 'daily' : 'level', n }); }
  };
}
