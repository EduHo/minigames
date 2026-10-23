// Ecrã de jogo da Colmeia: arrastar por números iguais, objetivos e jogadas contadas.
import { CELLS, adjacent, newGame, canAdd, pathValue, play, shuffle, isWon, goalDone } from './engine.js';
import { getLevel, dailyLevel, ZONES, TOTAL_LEVELS } from './levels.js';
import { SQ3, PAL, pal, label, hexPts, goalIcon, MEADOW } from './art.js';
import { progress, update, loadSaved, storeSaved, clearSaved, dailyState, saveDaily } from './progress.js';
import { wallet, achievements, analytics } from './meta.js';
import { sfx } from '../../core/audio.js';
import { vibrate, requestReviewOnce } from '../../core/native.js';
import { modal, toast, confetti, coinHtml } from '../../core/ui.js';

let pending = null;
export const takeCelebration = () => { const c = pending; pending = null; return c; };

const S = 30, CX = 200, CY = 200;
const POS = CELLS.map(c => ({ x: CX + S * SQ3 * (c.q + c.r / 2), y: CY + S * 1.5 * c.r }));
const HELP = { hammer: { icon: '🔨', name: 'Martelo' }, swap: { icon: '🔄', name: 'Troca' }, shuffle: { icon: '🌀', name: 'Baralhar' } };

export function colmeiaGame(root, nav, target) {
  const daily = typeof target === 'object';
  const lv = daily ? dailyLevel(target.date) : getLevel(target);
  const n = daily ? null : target;
  const title = daily ? `Diário · ${target.date.slice(8)}/${target.date.slice(5, 7)}` : `Nível ${n}`;

  root.innerHTML = `
    <div class="screen cm-game">
      ${MEADOW}
      <div class="cm-hud">
        <button class="cm-back" data-act="back" aria-label="Voltar">‹</button>
        <div class="cm-goals" data-ref="goals"></div>
        <div class="cm-moves" data-ref="movesbox"><small>Jogadas</small><b data-ref="moves"></b></div>
      </div>
      <div class="cm-sub">${title} · ${daily ? 'desafio do dia' : `${ZONES[lv.zone].icon} ${ZONES[lv.zone].name}`}</div>
      <div class="cm-boardwrap"><svg class="cm-hex" viewBox="-10 -10 420 420" aria-label="Colmeia: arrasta por números iguais encostados"></svg><div class="cm-preview" data-ref="preview"></div></div>
      <div class="cm-tools">
        <button class="cm-tool" data-act="hammer" aria-label="Martelo">🔨<b data-ref="hammer"></b></button>
        <button class="cm-tool" data-act="swap" aria-label="Troca">🔄<b data-ref="swap"></b></button>
        <button class="cm-tool" data-act="shuffle" aria-label="Baralhar">🌀<b data-ref="shuffle"></b></button>
        <button class="cm-tool small" data-act="restart" aria-label="Recomeçar">↻</button>
      </div>
      <canvas class="cm-fx" aria-hidden="true"></canvas>
    </div>`;
  const $ = s => root.querySelector(s);
  const svg = $('.cm-hex'), pv = $('[data-ref=preview]'), view = $('.cm-game');

  let g, path = [], tool = null, swapFirst = null, busy = false, finished = false, helps = 0, extraUsed = 0, maxChain = 0, seconds = 0, timer;

  function start(fresh = false) {
    const saved = !fresh && loadSaved(target);
    if (saved) { g = saved.g; helps = saved.helps; extraUsed = saved.extraUsed; seconds = saved.seconds || 0; toast('Jogo retomado'); }
    else { g = newGame(lv); helps = 0; extraUsed = 0; seconds = 0; clearSaved(target); }
    path = []; tool = null; swapFirst = null; finished = false; busy = false;
    analytics.track('level_start', { mode: daily ? 'daily' : 'level', n });
    clearInterval(timer);
    timer = setInterval(() => { if (!finished && !document.hidden) seconds++; }, 1000);
    draw([], !saved); goalsHtml(); hud();
  }
  const persist = () => { if (!finished && g.played) storeSaved(target, { g, helps, extraUsed, seconds }); };

  // ---------- Desenho ----------
  const defs = `<defs>${Object.entries(PAL).map(([v, [a, b]]) => `<linearGradient id="cmg${v}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('')}
    <linearGradient id="cmgx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3b2c"/><stop offset="1" stop-color="#231a10"/></linearGradient>
    <pattern id="cmcomb" width="12" height="20.8" patternUnits="userSpaceOnUse"><path d="M6 0 L12 3.5 L12 10.4 L6 13.9 L0 10.4 L0 3.5Z M6 13.9 L6 20.8" fill="none" stroke="#c4913a" stroke-width="1" opacity=".5"/></pattern></defs>`;
  const frame = `<polygon points="${hexPts(CX, CY, S * 4 * SQ3 * 0.99)}" transform="rotate(30 ${CX} ${CY})" fill="#7a4a1c"/>
    <polygon points="${hexPts(CX, CY - 6, S * 4 * SQ3 * 0.99)}" transform="rotate(30 ${CX} ${CY - 6})" fill="#f2c869" stroke="#ffe7a3" stroke-width="3"/>
    <polygon points="${hexPts(CX, CY - 6, S * 4 * SQ3 * 0.99)}" transform="rotate(30 ${CX} ${CY - 6})" fill="url(#cmcomb)"/>`;
  function tileSvg(i) {
    const { x, y } = POS[i], v = g.vals[i], s = S - 2.5, inPath = path.includes(i), sel = swapFirst === i, len = String(label(v)).length;
    const ice = g.ice[i];
    return `<g data-i="${i}" class="cm-tile">
      <polygon points="${hexPts(x, y + 5, s)}" fill="${pal(v)[1]}"/><polygon points="${hexPts(x, y + 5, s)}" fill="rgba(0,0,0,.25)"/>
      <polygon points="${hexPts(x, y, s)}" fill="${PAL[v] ? `url(#cmg${v})` : 'url(#cmgx)'}" stroke="${inPath || sel ? '#fff' : 'rgba(255,255,255,.55)'}" stroke-width="${inPath || sel ? 4 : 1.5}"/>
      <polygon points="${hexPts(x, y - 1, s - 5)}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2"/>
      <ellipse cx="${x - s * 0.3}" cy="${y - s * 0.52}" rx="${s * 0.26}" ry="${s * 0.1}" fill="#fff" opacity=".55" transform="rotate(-28 ${x - s * 0.3} ${y - s * 0.52})"/>
      <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="central" font-weight="800" font-size="${len >= 4 ? 15 : len === 3 ? 18 : 23}" fill="#fff" stroke="${pal(v)[1]}" stroke-width="3" paint-order="stroke">${label(v)}</text>
      ${ice ? `<polygon points="${hexPts(x, y, s + 1)}" fill="rgba(215,240,255,.62)" stroke="#fff" stroke-width="2.5"/><path d="M${x - 10} ${y - 12} l8 8 l-3 7 M${x + 6} ${y - 14} l-2 8 l8 4" stroke="#fff" stroke-width="2" fill="none"/>` : ''}
    </g>`;
  }
  function draw(pop = [], dropAll = false) {
    let h = defs + frame;
    CELLS.forEach((_, i) => {
      const { x, y } = POS[i];
      h += `<polygon points="${hexPts(x, y, S - 1)}" fill="#d9a441" opacity=".55"/>`;
      if (g.honey[i]) h += `<polygon points="${hexPts(x, y, S + 1)}" fill="#ffb300"/><polygon points="${hexPts(x, y, S + 1)}" fill="none" stroke="#fff3b0" stroke-width="2"/>`;
    });
    CELLS.forEach((_, i) => {
      const { x, y } = POS[i];
      if (g.stone[i]) { h += `<g data-i="${i}" class="cm-stone"><polygon points="${hexPts(x, y + 5, S - 2.5)}" fill="#4f4a44"/><polygon points="${hexPts(x, y, S - 2.5)}" fill="#9b958c" stroke="#bdb6ab" stroke-width="2"/><path d="M${x - 12} ${y - 10} l8 8 l-4 9 M${x + 6} ${y - 14} l-2 9 l9 5" stroke="#5f5a54" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`; return; }
      if (g.vals[i]) h += tileSvg(i);
      if (g.honey[i]) h += `<path d="M${x + S * 0.42} ${y - S * 0.62} q4 6 0 10 q-4 -4 0 -10z" fill="#ffd23f" stroke="#b97a00" stroke-width="1.2" pointer-events="none"/>`;
    });
    if (path.length > 1) {
      const pts = path.map(i => `${POS[i].x},${POS[i].y}`).join(' '), col = pal(g.vals[path[path.length - 1]])[1];
      h += `<polyline points="${pts}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".55" pointer-events="none"/>
        <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".8" pointer-events="none"/>
        ${path.map(i => `<circle cx="${POS[i].x}" cy="${POS[i].y + 17}" r="3.5" fill="#fff" stroke="${col}" stroke-width="2" pointer-events="none"/>`).join('')}`;
    }
    h += '<g class="cm-floats"></g>';
    svg.innerHTML = h;
    const list = dropAll ? CELLS.map((_, i) => i) : pop;
    list.forEach((i, k) => {
      const el = svg.querySelector(`.cm-tile[data-i="${i}"]`);
      if (el) el.animate([{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'translateY(4px)', opacity: 1, offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 340, delay: dropAll ? (CELLS[i].r + 3) * 45 + (i % 3) * 15 : k * 25, easing: 'ease-out', fill: 'backwards' });
    });
  }
  function goalsHtml(bump = -1) {
    $('[data-ref=goals]').innerHTML = g.goals.map((x, k) => {
      const done = goalDone(x);
      return `<div class="cm-goal ${done ? 'done' : ''} ${k === bump ? 'bump' : ''}">${goalIcon(x)}<span>${done ? '✓' : x.k === 'tile' ? 'Faz' : `${x.have}/${x.n}`}</span></div>`;
    }).join('');
  }
  function hud() {
    $('[data-ref=moves]').textContent = g.moves;
    $('[data-ref=movesbox]').classList.toggle('low', g.moves <= 3);
    for (const k of ['hammer', 'swap', 'shuffle']) {
      const a = wallet.available(k), el = $(`[data-ref=${k}]`);
      el.innerHTML = a > 0 ? a : coinHtml(wallet.prices[k]);
      el.classList.toggle('price', a === 0);
      $(`[data-act=${k}]`).classList.toggle('on', tool === k);
    }
  }

  // ---------- Efeitos ----------
  const fx = $('.cm-fx'), fctx = fx.getContext('2d');
  let parts = [], raf;
  const toScreen = (x, y) => { const r = svg.getBoundingClientRect(), pr = fx.getBoundingClientRect(); return { x: r.left - pr.left + ((x + 10) / 420) * r.width, y: r.top - pr.top + ((y + 10) / 420) * r.height }; };
  function burst(x, y, color, count = 22) {
    const p = toScreen(x, y);
    for (let k = 0; k < count; k++) { const a = Math.random() * 6.28, s = 2 + Math.random() * 5; parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 30 + Math.random() * 20, c: k % 3 ? color : '#fff', r: 2 + Math.random() * 3, star: k % 5 === 0 }); }
    if (!raf) loop();
  }
  function loop() {
    const dpr = Math.min(2, devicePixelRatio || 1), W = fx.clientWidth, H = fx.clientHeight;
    if (fx.width !== Math.round(W * dpr)) { fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr); }
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life--;
      fctx.globalAlpha = Math.min(1, p.life / 15); fctx.fillStyle = p.c;
      fctx.beginPath();
      if (p.star) for (let i = 0; i < 10; i++) { const r = i % 2 ? p.r : p.r * 2.4, a = -Math.PI / 2 + i * Math.PI / 5; fctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); }
      else fctx.arc(p.x, p.y, p.r, 0, 7);
      fctx.fill();
    });
    parts = parts.filter(p => p.life > 0);
    fctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
  function floatText(x, y, t, big = false) {
    const gEl = svg.querySelector('.cm-floats'); if (!gEl) return;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    Object.entries({ x, y, 'text-anchor': 'middle', 'font-weight': 800, 'font-size': big ? 26 : 18, fill: '#fff', stroke: '#8a3a00', 'stroke-width': 4, 'paint-order': 'stroke' }).forEach(([k, v]) => el.setAttribute(k, v));
    el.textContent = t; gEl.appendChild(el);
    el.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-40px)', opacity: 0 }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
  }
  function banner(t) { const b = document.createElement('div'); b.className = 'cm-banner'; b.textContent = t; view.appendChild(b); setTimeout(() => b.remove(), 1150); }

  // ---------- Caminho ----------
  function showPreview() {
    if (path.length < 2) { pv.classList.remove('show'); return; }
    const r = pathValue(g, path);
    pv.textContent = `= ${label(r)}`; pv.style.background = pal(r)[0]; pv.classList.add('show');
  }
  function cellAt(e) {
    const rect = svg.getBoundingClientRect(), x = (e.clientX - rect.left) * (420 / rect.width) - 10, y = (e.clientY - rect.top) * (420 / rect.height) - 10;
    let best = -1, bd = S * 0.92;
    POS.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  const stepSound = k => sfx('step', k);

  function commit() {
    if (path.length < 2) { path = []; draw(); showPreview(); return; }
    busy = true;
    const used = path.slice(), end = used[used.length - 1];
    path = []; pv.classList.remove('show');
    draw();
    used.slice(0, -1).forEach((i, k) => {
      const el = svg.querySelector(`.cm-tile[data-i="${i}"]`); if (!el) return;
      const route = used.slice(k);
      el.animate(route.map((j, m) => ({ transform: `translate(${POS[j].x - POS[i].x}px, ${POS[j].y - POS[i].y}px) scale(${1 - (m / route.length) * 0.4})`, opacity: m === route.length - 1 ? 0.2 : 1 })), { duration: 70 * route.length + 60, easing: 'ease-in', fill: 'forwards' });
    });
    const dur = 70 * used.length + 80;
    setTimeout(() => {
      const res = play(g, used);
      maxChain = Math.max(maxChain, used.length);
      achievements.setMax('maxChain', used.length);
      achievements.setMax('maxTile', res.result);
      sfx('trio', Math.min(4, Math.floor(used.length / 2) - 1)); vibrate(used.length >= 6 ? 'medium' : 'light');
      burst(POS[res.end].x, POS[res.end].y, pal(res.result)[0], 14 + used.length * 3);
      res.broke.forEach(j => burst(POS[j].x, POS[j].y, '#9b958c', 18));
      res.thawed.forEach(j => burst(POS[j].x, POS[j].y, '#d6f0ff', 14));
      if (res.broke.length) sfx('blocked');
      if (res.thawed.length) sfx('thaw');
      if (res.honeyGot) sfx('coin');
      draw(res.fresh);
      const eg = svg.querySelector(`.cm-tile[data-i="${res.end}"]`);
      if (eg) { eg.style.transformBox = 'view-box'; eg.style.transformOrigin = `${POS[res.end].x + 10}px ${POS[res.end].y + 10}px`; eg.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' }); }
      floatText(POS[res.end].x, POS[res.end].y - 10, `+${res.total * res.mult}`, res.mult > 1);
      if (used.length >= 9) banner('Colmeia de ouro!'); else if (used.length >= 7) banner('Fantástico!'); else if (used.length >= 5) banner('Boa!');
      if (res.retired) setTimeout(() => banner(`Adeus aos ${res.retired}!`), 500);
      if (res.shuffled) setTimeout(() => banner('A colmeia mexeu-se!'), 300);
      const changed = g.goals.findIndex(x => x.have && !x.shown);
      g.goals.forEach(x => { x.shown = x.have; });
      goalsHtml(changed); hud(); persist();
      busy = false;
      if (isWon(g)) return setTimeout(win, 450);
      if (g.moves <= 0) return setTimeout(lost, 350);
    }, dur);
  }

  // ---------- Ajudas ----------
  async function getItem(kind) {
    if (wallet.available(kind) > 0) { wallet.useItem(kind); return true; }
    return new Promise(resolve => modal(`<h3>Acabou: ${HELP[kind].icon} ${HELP[kind].name}</h3><p>Podes usar moedas ganhas a jogar.</p>`, [
      { label: `Usar ${coinHtml(wallet.prices[kind])}`, run: () => { if (wallet.spend(wallet.prices[kind])) { sfx('coin'); resolve(true); } else { toast('Não tens moedas suficientes'); resolve(false); } } },
      { label: 'Cancelar', cls: 'ghost', run: () => resolve(false) },
    ]));
  }
  async function useTool(kind) {
    if (busy || finished) return;
    if (kind === 'shuffle') {
      if (!(await getItem('shuffle'))) { hud(); return; }
      helps++; shuffle(g); sfx('shuffle'); draw(CELLS.map((_, i) => i).filter(i => g.vals[i])); hud(); persist(); return;
    }
    tool = tool === kind ? null : kind; swapFirst = null;
    if (tool) toast(kind === 'hammer' ? '🔨 Toca na peça a partir.' : '🔄 Toca em duas peças encostadas.', 1500);
    hud(); draw();
  }

  // ---------- Fim ----------
  function win() {
    if (finished) return;
    finished = true; clearInterval(timer); clearSaved(target);
    const stars = g.moves >= lv.moves * 0.3 ? 3 : g.moves >= lv.moves * 0.12 ? 2 : 1;
    let coins = 10 + 5 * stars + Math.min(20, g.moves);
    if (daily) {
      coins = 40 + 10 * stars;
      const d = dailyState();
      d.done[target.date] = Math.max(d.done[target.date] || 0, stars);
      const month = target.date.slice(0, 7), [y, m] = month.split('-').map(Number);
      if (Object.keys(d.done).filter(k => k.startsWith(month)).length === new Date(y, m, 0).getDate() && !d.trophies.includes(month)) { d.trophies.push(month); coins += 200; }
      saveDaily(d);
    } else {
      let prev = 0;
      update(p => { prev = p.stars[n] || 0; p.stars[n] = Math.max(prev, stars); if (n === p.current) p.current = Math.min(n + 1, TOTAL_LEVELS + 1); });
      pending = { n, stars, prev, advancing: prev === 0 };
    }
    wallet.reward({ coins });
    analytics.track('level_win', { mode: daily ? 'daily' : 'level', n, seconds, helps });
    achievements.check();
    sfx('win'); vibrate('heavy'); confetti();
    for (let k = 0; k < 5; k++) setTimeout(() => burst(60 + Math.random() * 280, 60 + Math.random() * 200, ['#ffd23f', '#f07ab8', '#3fd0c0', '#5aa0f0'][k % 4], 26), k * 150);
    if (stars === 3 && n >= 10) setTimeout(requestReviewOnce, 1500);
    modal(`<span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>
      <h3>${daily ? 'Desafio do dia feito!' : `Nível ${n} completo!`}</h3><p>Sobraram <b>${g.moves}</b> jogadas · ${g.score.toLocaleString('pt-PT')} pontos</p>
      <p class="earned">+${coins} <span class="coin">●</span></p>`,
      [{ label: daily ? 'Voltar ao calendário' : 'Voltar ao mapa', run: () => nav.back() }, { label: 'Repetir', cls: 'ghost', run: () => start(true) }]);
  }
  function lost() {
    sfx('lose'); vibrate('heavy');
    const free = extraUsed === 0;
    modal(`<div class="dialog-emoji">🐝</div><h3>Acabaram as jogadas</h3>
      <div class="cm-lostgoals">${g.goals.map(x => `<span>${goalIcon(x)}<b>${goalDone(x) ? '✓' : x.k === 'tile' ? 'falta' : `${x.have}/${x.n}`}</b></span>`).join('')}</div>`, [
      { label: free ? '+5 jogadas (grátis)' : `+5 jogadas ${coinHtml(50)}`, run: () => {
        if (!free && !wallet.spend(50)) { toast('Não tens moedas suficientes'); setTimeout(lost, 300); return; }
        extraUsed++; g.moves += 5; hud(); persist(); sfx('unlock');
      } },
      { label: 'Recomeçar', cls: 'ghost', run: () => { analytics.track('level_lose', { mode: daily ? 'daily' : 'level', n }); start(true); } },
    ]);
  }

  // ---------- Toques ----------
  svg.addEventListener('pointerdown', async e => {
    if (busy || finished) return;
    const i = cellAt(e); if (i < 0 || g.stone[i] || !g.vals[i]) return;
    if (tool === 'hammer') {
      if (!(await getItem('hammer'))) { tool = null; hud(); return; }
      helps++; burst(POS[i].x, POS[i].y, pal(g.vals[i])[0], 20); sfx('blocked'); vibrate('medium');
      // Peça nova (pequena) no lugar da partida
      g.ice[i] = false;
      g.vals[i] = g.minV * (Math.random() < 0.6 ? 1 : 2);
      tool = null; draw([i]); hud(); persist(); return;
    }
    if (tool === 'swap') {
      if (g.ice[i]) { sfx('blocked'); return; }
      if (swapFirst == null) { swapFirst = i; draw(); return; }
      if (!adjacent(swapFirst, i)) { swapFirst = i; draw(); return; }
      if (!(await getItem('swap'))) { tool = null; swapFirst = null; hud(); draw(); return; }
      helps++; [g.vals[swapFirst], g.vals[i]] = [g.vals[i], g.vals[swapFirst]];
      const a = swapFirst; swapFirst = null; tool = null; sfx('slide'); draw([a, i]); hud(); persist(); return;
    }
    if (!canAdd(g, [], i)) { sfx('blocked'); if (g.ice[i]) toast('🧊 Gelada: acaba um caminho ao lado para a soltar.', 1600); return; }
    path = [i]; svg.setPointerCapture(e.pointerId); stepSound(0); draw();
  });
  svg.addEventListener('pointermove', e => {
    if (!path.length || busy) return;
    const i = cellAt(e); if (i < 0) return;
    if (path.length > 1 && i === path[path.length - 2]) { path.pop(); stepSound(path.length - 1); draw(); showPreview(); return; }
    if (i === path[path.length - 1]) return;
    if (canAdd(g, path, i)) { path.push(i); stepSound(path.length - 1); vibrate('light'); draw(); showPreview(); }
  });
  svg.addEventListener('pointerup', () => { if (path.length) commit(); });
  svg.addEventListener('pointercancel', () => { path = []; draw(); showPreview(); });
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=hammer]').onclick = () => useTool('hammer');
  $('[data-act=swap]').onclick = () => useTool('swap');
  $('[data-act=shuffle]').onclick = () => useTool('shuffle');
  $('[data-act=restart]').onclick = () => {
    if (!g.played || busy) return;
    modal('<h3>Recomeçar o nível?</h3><p>A colmeia volta ao início.</p>', [{ label: 'Recomeçar', run: () => start(true) }, { label: 'Cancelar', cls: 'ghost' }]);
  };
  start();
  // Explicação da zona, na primeira vez
  if (!daily && !progress().seen[`zone-${lv.zone}`]) {
    update(p => { p.seen[`zone-${lv.zone}`] = true; });
    setTimeout(() => modal(`<div class="dialog-emoji">${ZONES[lv.zone].icon}</div><h3>${ZONES[lv.zone].name}</h3><p>${ZONES[lv.zone].text}</p>${lv.zone === 0 ? '<p>Arrasta o dedo por <b>números iguais encostados</b>. Depois de dois iguais podes seguir para o dobro. Ao largar, a soma fica na última casa.</p>' : ''}`, [{ label: 'Vamos!' }]), 300);
  }

  return () => {
    clearInterval(timer); cancelAnimationFrame(raf);
    if (!finished && g.played) { persist(); analytics.track('level_quit', { mode: daily ? 'daily' : 'level', n }); }
  };
}

