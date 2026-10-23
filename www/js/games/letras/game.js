// Ecrã de jogo da Letras Soltas: com tema (as letras caem), livre (grelha fixa) e ronda bónus (60 s).
import { loadDict } from './dict.js';
import { plain, findPaths, solvable, safeWord } from './engine.js';
import { themedLevel, freeLevel, bonusLevel, dailyLevel, THEMED_LEVELS, FREE_LEVELS } from './levels.js';
import { progress, update, loadSaved, storeSaved, clearSaved, dailyState, saveDaily } from './progress.js';
import { wallet, achievements, analytics } from './meta.js';
import { sfx } from '../../core/audio.js';
import { vibrate, requestReviewOnce } from '../../core/native.js';
import { modal, toast, confetti, coinHtml } from '../../core/ui.js';
import { today } from '../../core/store.js';

let pending = null;
export const takeCelebration = () => { const c = pending; pending = null; return c; };

// target: { kind: 'tema' | 'livre', n } | { date } | { kind: 'bonus', seed }
export function letrasGame(root, nav, target) {
  root.innerHTML = '<div class="screen ls-game"><div class="ls-loading">A abrir o dicionário…</div></div>';
  let cleanup = null, gone = false;
  loadDict().then(dict => { if (!gone) cleanup = play(root, nav, target, dict); })
    .catch(() => { root.querySelector('.ls-loading').textContent = 'Não foi possível abrir o dicionário.'; });
  return () => { gone = true; cleanup?.(); };
}

function play(root, nav, target, dict) {
  const daily = !!target.date, kind = daily ? 'tema' : target.kind;
  const lv = daily ? dailyLevel(target.date) : kind === 'tema' ? themedLevel(target.n) : kind === 'livre' ? freeLevel(target.n, dict) : bonusLevel(target.seed, dict);
  const free = kind !== 'tema';
  const title = daily ? `${lv.icon} ${lv.theme}` : kind === 'tema' ? `${lv.icon} ${lv.theme}` : kind === 'livre' ? `🔤 Livre ${target.n}` : '⏱️ Ronda bónus';
  const sub = daily ? `Desafio do dia · ${lv.words.length} palavras` : kind === 'tema' ? `Nível ${target.n} · ${lv.words.length} palavras` : kind === 'livre' ? `${lv.words.size} palavras escondidas` : '60 segundos';

  root.innerHTML = `
    <div class="screen ls-game">
      <div class="ls-sparkles"></div>
      <header class="ls-top">
        <button class="ls-back" data-act="back" aria-label="Voltar">‹</button>
        <div class="ls-title"><b>${title}</b><small data-ref="sub">${sub}</small></div>
        <span class="ls-coins" data-ref="coins">${coinHtml(wallet.coins())}</span>
      </header>
      ${free ? `<div class="ls-freebar"><b data-ref="count"></b><div class="ls-bar"><i data-ref="fill"></i></div><div class="ls-marks" data-ref="marks"></div></div>
        <div class="ls-found" data-ref="found"></div>` : '<div class="ls-slots" data-ref="slots"></div>'}
      <div class="ls-cur" data-ref="cur"></div>
      <div class="ls-boardwrap"><div class="ls-board" data-ref="board"><svg class="ls-line" data-ref="line"></svg></div></div>
      <footer class="ls-tools">
        ${kind === 'bonus' ? '' : `<button class="ls-tool" data-act="hint" aria-label="Pista">💡<b data-ref="hint"></b></button>`}
        ${kind === 'tema' ? `<button class="ls-tool" data-act="reveal" aria-label="Lupa">🔎<b data-ref="reveal"></b></button><button class="ls-tool dark" data-act="restart" aria-label="Recomeçar">↻</button>` : ''}
        ${kind === 'livre' ? '<button class="ls-tool dark" data-act="done" aria-label="Terminar">🏁</button>' : ''}
      </footer>
      <canvas class="ls-fx" aria-hidden="true"></canvas>
    </div>`;
  const $ = s => root.querySelector(s);
  const board = $('[data-ref=board]'), lineEl = $('[data-ref=line]'), curEl = $('[data-ref=cur]'), view = $('.ls-game');

  let cols, found, foundList, path = [], helps = 0, busy = false, finished = false, seconds = 0, timer, CS = 60, GAP = 7, H = lv.H;
  const els = new Map();
  let idSeq = 0;
  const marks = free && lv.marks ? lv.marks : null;

  function start(fresh = false) {
    // Jogo guardado só serve se for do mesmo nível (as palavras de um nível podem mudar entre versões)
    const sig = free ? `${lv.W}x${lv.H}:${lv.words.size}` : lv.order.join(',');
    let saved = !fresh && kind !== 'bonus' ? loadSaved(target) : null;
    if (saved && saved.sig !== sig) saved = null;
    if (saved) { cols = saved.cols.map(c => c.map(ch => ({ id: ++idSeq, ch }))); found = new Set(saved.found); foundList = saved.foundList || []; helps = saved.helps; seconds = saved.seconds || 0; }
    else { cols = lv.cols.map(c => c.map(ch => ({ id: ++idSeq, ch }))); found = new Set(); foundList = []; helps = 0; seconds = 0; clearSaved(target); }
    path = []; finished = false; busy = false;
    board.querySelectorAll('.ls-cell').forEach(e => e.remove()); els.clear();
    analytics.track('level_start', { mode: daily ? 'daily' : kind, n: target.n ?? null });
    clearInterval(timer);
    if (kind === 'bonus') { seconds = lv.seconds; $('[data-ref=sub]').textContent = '60 s · toca para começar'; }
    else timer = setInterval(() => { if (!finished && !document.hidden) seconds++; }, 1000);
    layout(); render(true); renderWords(); hud();
  }
  const letters = () => cols.map(c => c.map(x => x.ch));
  const persist = () => { if (!finished && kind !== 'bonus' && (found.size || foundList.length)) storeSaved(target, { sig: free ? `${lv.W}x${lv.H}:${lv.words.size}` : lv.order.join(','), cols: letters(), found: [...found], foundList, helps, seconds }); };

  // ---------- Desenho ----------
  function layout() {
    const wrap = board.parentElement, W = lv.W;
    const maxW = wrap.clientWidth - 24, maxH = wrap.clientHeight - 12;
    CS = Math.floor(Math.min(76, (maxW - (W - 1) * 7) / W, (maxH - (H - 1) * 7) / H));
    GAP = Math.max(4, Math.round(CS * 0.12));
    board.style.width = `${W * CS + (W - 1) * GAP}px`;
    board.style.height = `${H * CS + (H - 1) * GAP}px`;
    board.style.setProperty('--s', `${CS}px`);
  }
  const xy = (c, r) => ({ x: c * (CS + GAP), y: (H - 1 - r) * (CS + GAP) });
  function render(dropIn = false) {
    const keep = new Set();
    cols.forEach((col, c) => col.forEach((cell, r) => {
      keep.add(cell.id);
      let el = els.get(cell.id);
      const p = xy(c, r), sel = path.some(q => q.id === cell.id);
      if (!el) {
        el = document.createElement('div'); el.className = 'ls-cell'; el.textContent = cell.ch;
        Object.assign(el.style, { width: `${CS}px`, height: `${CS}px`, transform: `translate(${p.x}px, ${dropIn ? p.y - 320 : p.y}px)` });
        board.appendChild(el); els.set(cell.id, el);
        if (dropIn) { el.style.transitionDelay = `${c * 40 + r * 55}ms`; requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translate(${p.x}px, ${p.y}px)`; setTimeout(() => { el.style.transitionDelay = ''; }, 900); })); }
      } else {
        Object.assign(el.style, { width: `${CS}px`, height: `${CS}px`, transform: `translate(${p.x}px, ${p.y}px)${sel ? ' scale(1.06)' : ''}` });
      }
      el.classList.toggle('sel', sel);
    }));
    els.forEach((el, id) => { if (!keep.has(id) && !el.classList.contains('out')) { el.remove(); els.delete(id); } });
    drawLine();
  }
  function drawLine() {
    if (path.length < 2) { lineEl.innerHTML = ''; return; }
    const pts = path.map(q => { const p = xy(q.c, q.r); return `${p.x + CS / 2},${p.y + CS / 2}`; }).join(' ');
    lineEl.innerHTML = `<polyline points="${pts}" fill="none" stroke="#fff" stroke-width="${CS * 0.34}" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>`;
  }
  function renderWords() {
    if (!free) {
      $('[data-ref=slots]').innerHTML = lv.words.map(w => {
        const p = plain(w), done = found.has(p);
        return `<span class="ls-slot ${done ? 'found' : ''}" data-w="${p}">${[...(done ? w.toUpperCase() : p)].map(ch => `<i>${done ? ch : ''}</i>`).join('')}</span>`;
      }).join('');
      return;
    }
    const n = foundList.length;
    $('[data-ref=count]').textContent = kind === 'bonus' ? `${n} palavras` : `${n} / ${lv.words.size}`;
    if (marks) {
      $('[data-ref=fill]').style.width = `${Math.min(100, (n / marks[2]) * 100)}%`;
      $('[data-ref=marks]').innerHTML = marks.map(m => `<span class="${n >= m ? 'on' : ''}" style="left:${(m / marks[2]) * 100}%">★<small>${m}</small></span>`).join('');
      const done = $('[data-act=done]'); if (done) done.style.opacity = n >= marks[0] ? 1 : 0.45;
    } else $('[data-ref=fill]').style.width = `${Math.min(100, n * 3)}%`;
    $('[data-ref=found]').innerHTML = foundList.slice().reverse().map(w => `<span class="${w.length >= 6 ? 'long' : ''}">${dict.display(w)}</span>`).join('');
  }
  function hud() {
    $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
    for (const k of ['hint', 'reveal']) {
      const el = $(`[data-ref=${k}]`); if (!el) continue;
      const a = wallet.available(k);
      el.innerHTML = a > 0 ? a : coinHtml(wallet.prices[k]);
      el.classList.toggle('price', a === 0);
    }
  }
  const curText = () => path.map(q => q.ch).join('');
  function showCur(cls = '', text = curText()) {
    curEl.innerHTML = text ? `<span class="${cls}">${text}</span>` : '';
    if (cls) setTimeout(() => { if (!path.length) curEl.innerHTML = ''; }, 800);
  }

  // ---------- Partículas ----------
  const fx = $('.ls-fx'), fctx = fx.getContext('2d');
  let parts = [], raf = 0;
  function burst(px, py, n = 14) {
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, s = 2 + Math.random() * 4; parts.push({ x: px, y: py, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 30 + Math.random() * 20, c: ['#ffd23f', '#fff', '#8fe0ff', '#ff9ec0'][k % 4], r: 2 + Math.random() * 3 }); }
    if (!raf) loop();
  }
  function loop() {
    const dpr = Math.min(2, devicePixelRatio || 1), W = fx.clientWidth, Hh = fx.clientHeight;
    if (fx.width !== Math.round(W * dpr)) { fx.width = Math.round(W * dpr); fx.height = Math.round(Hh * dpr); }
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, W, Hh);
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life--; fctx.globalAlpha = Math.min(1, p.life / 15); fctx.fillStyle = p.c; fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 7); fctx.fill(); });
    parts = parts.filter(p => p.life > 0); fctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
  const burstAt = (id, n) => { const el = els.get(id); if (!el) return; const r = el.getBoundingClientRect(), fr = fx.getBoundingClientRect(); burst(r.left - fr.left + r.width / 2, r.top - fr.top + r.height / 2, n); };

  // ---------- Toques ----------
  function cellAt(e) {
    const r = board.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const c = Math.floor(x / (CS + GAP)), top = Math.floor(y / (CS + GAP));
    const ix = x - c * (CS + GAP), iy = y - top * (CS + GAP);
    if (ix < CS * 0.12 || ix > CS * 0.88 || iy < CS * 0.12 || iy > CS * 0.88) return null;   // perto do meio: diagonais fáceis
    const rr = H - 1 - top, cell = cols[c]?.[rr];
    return cell ? { c, r: rr, id: cell.id, ch: cell.ch } : null;
  }
  board.addEventListener('pointerdown', e => {
    if (busy || finished) return;
    const q = cellAt(e); if (!q) return;
    board.setPointerCapture(e.pointerId);
    board.querySelectorAll('.ls-cell.hint').forEach(x => x.classList.remove('hint'));
    path = [q]; sfx('step', 0); render(); showCur();
  });
  board.addEventListener('pointermove', e => {
    if (!path.length || busy) return;
    const q = cellAt(e); if (!q) return;
    const last = path[path.length - 1];
    if (q.id === last.id) return;
    if (path.length > 1 && q.id === path[path.length - 2].id) { path.pop(); sfx('step', path.length - 1); render(); showCur(); return; }
    if (path.some(p => p.id === q.id) || Math.abs(q.c - last.c) > 1 || Math.abs(q.r - last.r) > 1) return;
    path.push(q); sfx('step', Math.min(12, path.length - 1)); vibrate('light'); render(); showCur();
  });
  board.addEventListener('pointerup', () => finishPath());
  board.addEventListener('pointercancel', () => { path = []; render(); curEl.innerHTML = ''; });

  function finishPath() {
    if (!path.length) return;
    const word = curText();
    if (path.length < 3) { path = []; render(); curEl.innerHTML = ''; return; }
    if (free) freeWord(word);
    else themedWord(word);
  }
  const noteWord = w => update(p => { p.wordsFound++; if (w.length > p.longest.length) p.longest = w; });

  // ---------- Com tema ----------
  function themedWord(word) {
    const target2 = lv.words.map(plain).find(w => w === word && !found.has(w));
    if (!target2) {
      if (dict.words.has(word) && !foundList.includes(word)) {
        // Palavra que existe mas não é do tema: bónus
        foundList.push(word); wallet.reward({ coins: 1 }); hud(); noteWord(word);
        showCur('bonus', `${dict.display(word)} · bónus +1`); sfx('coin');
      } else if (foundList.includes(word)) showCur('old', `${dict.display(word)} · já usada`);
      else { showCur('bad'); sfx('denied'); }
      path = []; render(); persist(); return;
    }
    busy = true;
    showCur('good', lv.words.find(w => plain(w) === word).toUpperCase()); sfx('trio', 1); vibrate('medium');
    const used = path.slice();
    used.forEach((q, k) => {
      const el = els.get(q.id); if (!el) return;
      setTimeout(() => burstAt(q.id, 8), k * 40);
      el.classList.add('out'); el.style.transitionDelay = `${k * 40}ms`;
      el.style.transform += ' translateY(-60px) scale(.3)';
      setTimeout(() => { el.remove(); els.delete(q.id); }, 400 + k * 40);
    });
    found.add(word); noteWord(word);
    const ids = new Set(used.map(q => q.id));
    cols = cols.map(col => col.filter(cell => !ids.has(cell.id)));
    path = [];
    setTimeout(() => {
      render(); sfx('slide'); renderWords();
      const slot = root.querySelector(`.ls-slot[data-w="${word}"]`); slot?.classList.add('pop');
      busy = false; persist();
      if (found.size === lv.words.length) { setTimeout(win, 450); return; }
      if (!solvable(letters(), lv.words.map(plain).filter(w => !found.has(w)))) setTimeout(stuck, 500);
    }, 330);
  }
  function stuck() {
    sfx('denied');
    modal('<div class="dialog-emoji">🧩</div><h3>Sem saída</h3><p>As palavras que faltam já não se conseguem formar todas. Recomeça e experimenta outra ordem: a 💡 pista mostra por onde ir.</p>',
      [{ label: '↻ Recomeçar', run: () => { helps++; start(true); } }, { label: 'Sair', cls: 'ghost', run: () => nav.back() }]);
  }

  // ---------- Livre e bónus ----------
  function freeWord(word) {
    if (foundList.includes(word)) { showCur('old', `${dict.display(word)} · já tens`); sfx('tap'); }
    else if (lv.words.has(word)) {
      foundList.push(word); noteWord(word);
      showCur('good', dict.display(word)); sfx('trio', Math.min(4, word.length - 3)); vibrate('light');
      path.forEach((q, k) => setTimeout(() => burstAt(q.id, 6), k * 35));
      const gain = kind === 'bonus' ? (word.length >= 6 ? 4 : word.length >= 4 ? 2 : 1) : word.length >= 6 ? 2 : 0;
      if (gain) { wallet.reward({ coins: gain }); hud(); }
      if (marks) {
        const n = foundList.length;
        if (marks.includes(n)) { sfx('star', marks.indexOf(n)); toast(`⭐ ${marks.indexOf(n) + 1}.ª estrela!`, 1200); }
      }
      renderWords(); persist();
      if (foundList.length === lv.words.size) setTimeout(kind === 'bonus' ? endBonus : winFree, 500);
    } else { showCur('bad'); sfx('denied'); }
    path = []; render();
  }
  function tickBonus() {
    if (finished) return;
    seconds--;
    const s = $('[data-ref=sub]');
    if (!s) return;
    s.textContent = `${seconds} s · cada palavra dá moedas`;
    s.classList.toggle('hurry', seconds <= 10);
    if (seconds <= 10 && seconds > 0) sfx('tick');
    if (seconds <= 0) endBonus();
  }
  function endBonus() {
    if (finished) return;
    finished = true; clearInterval(timer);
    const n = foundList.length, coins = foundList.reduce((s, w) => s + (w.length >= 6 ? 4 : w.length >= 4 ? 2 : 1), 0);
    const p = progress(), record = n > p.bonusBest;
    update(q => { q.bonusBest = Math.max(q.bonusBest, n); if (target.daily) q.bonusDay = today(); else q.bonusPlayed++; });
    achievements.check();
    sfx('win'); confetti();
    const missing = [...lv.words].filter(w => !foundList.includes(w)).sort((a, b) => b.length - a.length).slice(0, 8).map(w => dict.display(w));
    modal(`<div class="dialog-emoji">⏱️</div><h3>Tempo!</h3><p>Encontraste <b>${n}</b> palavras${record ? ' · <b>novo recorde!</b>' : ''}</p><p class="earned">+${coins} <span class="coin">●</span> (já recebidas)</p>${missing.length ? `<p class="tips">Havia, por exemplo: ${missing.join(', ')}</p>` : ''}`,
      [{ label: 'Voltar', run: () => nav.back() }]);
  }
  function winFree(manual = false) {
    const n = foundList.length, stars = marks.filter(m => n >= m).length;
    if (!stars) { toast(`Precisas de ${marks[0]} palavras para a 1.ª estrela.`); return; }
    finished = true; clearInterval(timer); clearSaved(target);
    let prev = 0;
    update(p => { prev = p.freeStars[target.n] || 0; p.freeStars[target.n] = Math.max(prev, stars); if (target.n === p.free) p.free = Math.min(target.n + 1, FREE_LEVELS + 1); });
    pending = { kind: 'livre', n: target.n, stars, prev };
    const coins = 10 + stars * 5;
    wallet.reward({ coins });
    analytics.track('level_win', { mode: 'livre', n: target.n, seconds, helps });
    achievements.check();
    sfx('win'); confetti();
    const missing = [...lv.words].filter(w => !foundList.includes(w)).sort((a, b) => b.length - a.length).slice(0, 10).map(w => dict.display(w));
    modal(`<span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span><h3>Livre ${target.n}</h3>
      <p>Encontraste <b>${n}</b> de ${lv.words.size} palavras.</p><p class="earned">+${coins} <span class="coin">●</span></p>${missing.length ? `<p class="tips">Faltaram, por exemplo: ${missing.join(', ')}</p>` : ''}`,
      [...(target.n < FREE_LEVELS ? [{ label: `Livre ${target.n + 1}`, run: () => nav.replace(letrasGame, { kind: 'livre', n: target.n + 1 }) }] : []), { label: 'Voltar', cls: 'secondary', run: () => nav.back() }]);
    void manual;
  }

  // ---------- Fim (com tema) ----------
  function win() {
    if (finished) return;
    finished = true; clearInterval(timer); clearSaved(target);
    const stars = helps === 0 ? 3 : helps === 1 ? 2 : 1;
    let coins = 10 + 5 * stars + foundList.length;
    if (daily) {
      coins = 40 + 10 * stars;
      const d = dailyState();
      d.done[target.date] = Math.max(d.done[target.date] || 0, stars);
      const month = target.date.slice(0, 7), [y, m] = month.split('-').map(Number);
      if (Object.keys(d.done).filter(k => k.startsWith(month)).length === new Date(y, m, 0).getDate() && !d.trophies.includes(month)) { d.trophies.push(month); coins += 200; }
      saveDaily(d);
    } else {
      let prev = 0;
      update(p => { prev = p.stars[target.n] || 0; p.stars[target.n] = Math.max(prev, stars); if (target.n === p.tema) p.tema = Math.min(target.n + 1, THEMED_LEVELS + 1); });
      pending = { kind: 'tema', n: target.n, stars, prev };
    }
    wallet.reward({ coins });
    analytics.track('level_win', { mode: daily ? 'daily' : 'tema', n: target.n ?? null, seconds, helps });
    achievements.check();
    sfx('win'); vibrate('heavy'); confetti();
    if (stars === 3 && target.n >= 10) setTimeout(requestReviewOnce, 1500);
    modal(`<span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span><h3>${lv.icon} ${lv.theme}!</h3>
      <p>${lv.words.map(w => w.toUpperCase()).join(' · ')}</p><p class="earned">+${coins} <span class="coin">●</span></p>`,
      [...(!daily && target.n < THEMED_LEVELS ? [{ label: `Nível ${target.n + 1}`, run: () => nav.replace(letrasGame, { kind: 'tema', n: target.n + 1 }) }] : []),
        { label: daily ? 'Voltar ao calendário' : 'Voltar', cls: daily ? '' : 'secondary', run: () => nav.back() }]);
  }

  // ---------- Ajudas ----------
  async function getItem(k, name) {
    if (wallet.available(k) > 0) { wallet.useItem(k); hud(); return true; }
    return new Promise(resolve => modal(`<h3>Acabou: ${name}</h3><p>Podes usar moedas ganhas a jogar.</p>`, [
      { label: `Usar ${coinHtml(wallet.prices[k])}`, run: () => { if (wallet.spend(wallet.prices[k])) { sfx('coin'); hud(); resolve(true); } else { toast('Não tens moedas suficientes'); resolve(false); } } },
      { label: 'Cancelar', cls: 'ghost', run: () => resolve(false) },
    ]));
  }
  function glow(p, all = false) {
    board.querySelectorAll('.ls-cell.hint').forEach(x => x.classList.remove('hint'));
    (all ? p : [p[0]]).forEach(([c, r]) => els.get(cols[c][r].id)?.classList.add('hint'));
  }
  async function hint(all = false) {
    if (busy || finished) return;
    if (free) {
      const left = [...lv.words].filter(w => !foundList.includes(w)).sort((a, b) => a.length - b.length || dict.rank.get(a) - dict.rank.get(b));
      const w = left[0]; if (!w) return;
      if (!(await getItem('hint', '💡 Pista'))) return;
      helps++; sfx('hint'); glow(findPaths(letters(), w, 1)[0]);
      toast(`Começa aqui: ${w.length} letras`, 1600);
      return;
    }
    const left = lv.words.map(plain).filter(w => !found.has(w));
    const s = safeWord(letters(), left);
    if (!s) { stuck(); return; }
    if (!(await getItem(all ? 'reveal' : 'hint', all ? '🔎 Lupa' : '💡 Pista'))) return;
    helps++; sfx('hint'); glow(s.path, all);
    const slot = root.querySelector(`.ls-slot[data-w="${s.word}"]`);
    if (slot) [...slot.children].forEach((i, k) => { if (all || k === 0) { i.textContent = s.word[k]; i.classList.add('hint'); } });
    persist();
  }

  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=hint]')?.addEventListener('click', () => hint(false));
  $('[data-act=reveal]')?.addEventListener('click', () => hint(true));
  $('[data-act=restart]')?.addEventListener('click', () => {
    if (busy || !found.size) return;
    modal('<h3>Recomeçar?</h3><p>As letras voltam ao sítio. Conta como uma ajuda.</p>', [{ label: 'Recomeçar', run: () => { helps++; start(true); } }, { label: 'Cancelar', cls: 'ghost' }]);
  });
  $('[data-act=done]')?.addEventListener('click', () => winFree(true));
  const ro = new ResizeObserver(() => requestAnimationFrame(() => { layout(); render(); }));
  ro.observe($('.ls-boardwrap'));
  start();
  // A ronda bónus só começa a contar depois de fechada a explicação
  const beginBonus = () => { if (kind === 'bonus' && !finished) { clearInterval(timer); timer = setInterval(tickBonus, 1000); $('[data-ref=sub]').textContent = `${seconds} s · cada palavra dá moedas`; } };
  if (kind === 'bonus' && progress().seen.bonus) setTimeout(() => modal('<div class="dialog-emoji">⏱️</div><h3>Ronda bónus</h3><p>60 segundos. Pronto?</p>', [{ label: 'Começar!', run: beginBonus }]), 250);
  if (!progress().seen[kind] && !daily) {
    update(p => { p.seen[kind] = true; });
    const TXT = {
      tema: 'Arrasta o dedo por letras encostadas (também na diagonal) para formar as palavras do tema. Cada palavra encontrada sai e as letras de cima caem: <b>a ordem conta</b>. Outras palavras portuguesas dão moedas de bónus.',
      livre: 'Sem tema e sem letras a cair: forma o máximo de palavras portuguesas com 3 letras ou mais. Com a 1.ª estrela podes terminar no 🏁 ou continuar.',
      bonus: '60 segundos para formar o máximo de palavras. Cada palavra dá moedas, mais nas compridas!',
    };
    setTimeout(() => modal(`<div class="dialog-emoji">${kind === 'tema' ? '🏷️' : kind === 'livre' ? '🔤' : '⏱️'}</div><p>${TXT[kind]}</p>`, [{ label: kind === 'bonus' ? 'Começar!' : 'Vamos!', run: beginBonus }]), 300);
  }

  return () => {
    clearInterval(timer); ro.disconnect(); cancelAnimationFrame(raf);
    if (!finished && kind !== 'bonus' && (found.size || foundList.length)) { persist(); analytics.track('level_quit', { mode: daily ? 'daily' : kind, n: target.n ?? null }); }
  };
}
