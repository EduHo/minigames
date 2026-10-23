// Ecrã de jogo do Poções da Lúmen.
import { getLevel, getDailyLevel, TOTAL_LEVELS, MECHANICS } from './levels.js';
import { cloneState, canPour, whyNot, pour, unpour, isComplete, isSolved, isLocked, isFrozen, topRun, addTube, solve } from './engine.js';
import { COLORS } from './look.js';
import { progress, saveProgress, loadSaved, storeSaved, clearSaved, dailyState, saveDaily } from './progress.js';
import { wallet, achievements, analytics } from './meta.js';
import { settings } from '../../core/settings.js';
import { sfx } from '../../core/audio.js';
import { vibrate, requestReviewOnce } from '../../core/native.js';
import { modal, toast, confetti, coinHtml, bubble, hand } from '../../core/ui.js';
import { load, save } from '../../core/store.js';

const top = t => t[t.length - 1];
const COACH_KEY = 'potions.coach';

// A vitória fica aqui à espera de o mapa a mostrar (estrelas a voar, personagem a andar...).
let pending = null;
export const takeCelebration = () => { const c = pending; pending = null; return c; };

function starsFor(moves, par, helps) {
  let s = 3;
  if (moves > par) s--;
  if (helps > 0) s--;
  return Math.max(1, s);
}

export const lumenSays = (title, text, button = 'Vamos!') => new Promise(resolve => {
  modal(`<div class="lumen"><span class="lumen-face">🐈‍⬛</span><div><b>${title}</b><p>${text}</p></div></div>`, [{ label: button, run: resolve }]);
});

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const shortDate = key => { const [, m, d] = key.split('-').map(Number); return `${d} ${MONTHS[m - 1]}`; };

// target: número do nível do mapa, ou { date } para o desafio diário.
export function potionGame(root, nav, target) {
  const daily = typeof target === 'object';
  const n = daily ? null : target;
  const level = daily ? getDailyLevel(target.date) : getLevel(n);
  const { chapter } = level;
  const style = wallet.owns(settings().flaskStyle) ? settings().flaskStyle : 'tube';
  const tag = daily ? '📅 Diário' : level.special ? '👑 Especial' : level.hard ? '🔥 Difícil' : 'Nível';
  const title = daily ? shortDate(level.daily) : n;
  const chips = [
    level.mystery && '❓ Mistério', level.locks && '🔒 Cadeado', level.ice && '❄️ Gelo',
    level.cap === 5 && '⚗️ 5 camadas', level.labels && '🏷️ Rótulo', level.funnels && '⬇️ Funil',
  ].filter(Boolean);

  root.innerHTML = `
    <div class="screen pt-game ${settings().colorSymbols ? 'symbols' : ''}" style="--ch:${chapter.color};--glow:${chapter.glow}">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <div class="stats">
          <span class="stat"><small>${tag}</small>${title}</span>
          <span class="stat"><small>Jogadas</small><b data-ref="moves">0</b></span>
          <span class="stat"><small>Alvo ★★★</small><b>${level.par}</b></span>
        </div>
        <button class="icon-btn" data-act="restart" aria-label="Recomeçar">↻</button>
      </header>
      ${chips.length ? `<div class="pt-chips">${chips.map(c => `<span>${c}</span>`).join('')}</div>` : ''}
      <div class="pt-wrap"><div class="pt-stage"></div></div>
      <footer class="toolbar">
        <button class="tool" data-act="undo"><span>↶</span>Desfazer</button>
        <button class="tool" data-act="hint"><span>💡</span>Ajuda<em class="badge" data-ref="hint"></em></button>
        <button class="tool" data-act="flask"><span>🧪</span>Frasco extra<em class="badge" data-ref="flask"></em></button>
      </footer>
    </div>`;

  const $ = sel => root.querySelector(sel);
  const wrap = $('.pt-wrap');
  const stage = $('.pt-stage');
  ambient(root.querySelector('.pt-game'), chapter.deco);

  let state, hidden, history, helps, undos, usedExtra, selected, busy, finished, seconds, timer;

  // ---------- Início e gravação ----------

  function start(fresh = false) {
    const saved = !fresh && loadSaved(target);
    if (saved) {
      state = saved.state; hidden = saved.hidden; history = saved.history;
      helps = saved.helps; undos = saved.undos; usedExtra = saved.usedExtra; seconds = saved.seconds;
      toast('Jogo retomado');
    } else {
      state = cloneState(level.state); hidden = level.hidden.map(h => [...h]); history = [];
      helps = 0; undos = 0; usedExtra = false; seconds = 0;
      clearSaved(target);
    }
    selected = null; busy = false; finished = false;
    analytics.track('level_start', { mode: daily ? 'daily' : 'level', n });
    clearInterval(timer);
    timer = setInterval(() => { if (!finished && !document.hidden) seconds++; }, 1000);
    render();
    layout();
    updateBadges();
    setTimeout(intro, 300);
  }

  function persist() {
    if (finished || !history.length) return;
    storeSaved(target, { state, hidden, history, helps, undos, usedExtra, seconds });
  }

  // ---------- Desenho ----------

  function layerHtml(c, isHidden) {
    const col = COLORS[c];
    return isHidden
      ? '<div class="layer mystery"></div>'
      : `<div class="layer" style="--c:${col.hex}"><span class="sym">${col.sym}</span></div>`;
  }

  function flaskHtml(i) {
    const t = state.tubes[i];
    const done = isComplete(state, i);
    const locked = isLocked(state, i), frozen = isFrozen(state, i);
    const key = state.lock[i] != null ? COLORS[state.lock[i]] : null;
    const lab = state.label[i] != null ? COLORS[state.label[i]] : null;
    const bubbles = t.length && !locked && !frozen
      ? [0, 1].map(k => `<span class="bubble" style="left:${30 + k * 26}%;--h:-${t.length * 0.9}em;animation-delay:${(Math.random() * 3).toFixed(2)}s"></span>`).join('')
      : '';
    return `<button class="pt-flask style-${style} ${done ? 'done' : ''} ${selected === i ? 'lifted' : ''} ${locked ? 'locked' : ''} ${frozen ? 'frozen' : ''} ${state.funnel[i] ? 'funnel' : ''}"
        data-i="${i}" style="--done:${t.length ? COLORS[top(t)].hex : 'transparent'}" aria-label="Frasco ${i + 1}">
      <span class="cork"></span><span class="lip"></span>
      ${state.funnel[i] ? '<span class="pt-funnel" aria-hidden="true"></span>' : ''}
      ${lab ? `<span class="pt-label" style="--c:${lab.hex}" title="Só aceita ${lab.name}">${lab.sym}</span>` : ''}
      <span class="glass">
        <span class="liquid">${t.map((c, j) => layerHtml(c, hidden[i][j])).join('')}</span>${bubbles}
        ${locked ? `<span class="pt-lock" style="--c:${key.hex}"><b>🔒</b><i>${key.sym}</i></span>` : ''}
        ${frozen ? `<span class="pt-ice"><b>❄️</b><i>${state.ice[i] - state.moves}</i></span>` : ''}
      </span>
    </button>`;
  }

  function render() {
    stage.innerHTML = state.tubes.map((_, i) => flaskHtml(i)).join('');
    $('[data-ref=moves]').textContent = state.moves;
    $('[data-act=flask]').classList.toggle('used', usedExtra);
  }

  // Tamanho dos frascos para caberem no ecrã (1 ou 2 filas).
  function layout() {
    const T = state.tubes.length;
    const rows = T <= 6 ? 1 : 2;
    const perRow = Math.ceil(T / rows);
    const W = wrap.clientWidth - 16, H = wrap.clientHeight - 16;
    const gap = 12;
    const total = w => w * 0.66 * state.cap + w * 0.45 + 18;
    let fw = Math.min(62, (W - (perRow - 1) * gap) / perRow);
    while (fw > 24 && rows * (total(fw) + 34) > H) fw -= 1;
    stage.style.setProperty('--fw', `${fw}px`);
    stage.style.setProperty('--lh', `${fw * 0.66}px`);
    stage.style.setProperty('--gh', `${fw * 0.66 * state.cap + fw * 0.45}px`);
    stage.style.width = `${perRow * fw + (perRow - 1) * gap + 4}px`;
    stage.style.fontSize = `${fw * 0.3}px`;
  }

  function updateBadges() {
    for (const kind of ['hint', 'flask']) {
      const k = wallet.available(kind);
      const el = $(`[data-ref=${kind}]`);
      el.innerHTML = k > 0 ? k : coinHtml(wallet.prices[kind]);
      el.classList.toggle('price', k === 0);
    }
  }

  const flaskEl = i => stage.querySelector(`.pt-flask[data-i="${i}"]`);

  // ---------- Jogadas ----------

  const REASONS = {
    lock: i => `🔒 Este frasco abre quando completares a cor ${COLORS[state.lock[i]].name}.`,
    ice: i => `❄️ Gelado: faltam ${state.ice[i] - state.moves} jogadas para derreter.`,
    funnel: () => '⬇️ O funil só recebe poções: o que lá entra não volta a sair.',
    label: i => `🏷️ Este frasco só aceita ${COLORS[state.label[i]].name}.`,
  };

  function blockedReason(i) {
    if (isLocked(state, i)) return REASONS.lock(i);
    if (isFrozen(state, i)) return REASONS.ice(i);
    return null;
  }

  function tap(i) {
    if (busy || finished) return;
    if (selected === null) {
      const why = blockedReason(i) || (state.funnel[i] && state.tubes[i].length ? REASONS.funnel() : null);
      if (why) { shake(i); toast(why, 2000); return; }
      if (!state.tubes[i].length || isComplete(state, i)) { shake(i); return; }
      selected = i;
      flaskEl(i).classList.add('lifted');
      sfx('pick'); vibrate('light');
      tutorial();
      return;
    }
    if (selected === i) { flaskEl(i).classList.remove('lifted'); selected = null; return; }
    if (!canPour(state, selected, i)) {
      const reason = whyNot(state, selected, i);
      flaskEl(selected).classList.remove('lifted');
      const from = selected;
      selected = null;
      // Tocar noutro frasco com poção muda a escolha; nos outros casos explica porquê.
      if (reason === 'color' && state.tubes[i].length && !isComplete(state, i) && !state.funnel[i]) { tap(i); return; }
      shake(i);
      if (reason === 'lock' || reason === 'ice') toast(blockedReason(isLocked(state, i) || isFrozen(state, i) ? i : from), 2000);
      else if (reason === 'label') toast(REASONS.label(i), 2000);
      return;
    }
    animatePour(selected, i);
  }

  function shake(i) {
    sfx('blocked'); vibrate('medium');
    flaskEl(i)?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 260 });
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function animatePour(a, b) {
    busy = true;
    selected = null;
    removeHand?.();
    const src = flaskEl(a), dst = flaskEl(b);
    const sr = src.getBoundingClientRect(), dr = dst.getBoundingClientRect(), st = stage.getBoundingClientRect();
    const right = dr.left > sr.left;
    // A boca do frasco fica por cima do destino; o frasco roda à volta da boca.
    src.classList.add('pouring');
    src.style.transform = `translate(${dr.left - sr.left + (right ? -dr.width * 0.15 : dr.width * 0.15)}px, ${dr.top - sr.top - sr.width * 0.75}px) rotate(${right ? 72 : -72}deg)`;
    await wait(280);
    const count = Math.min(topRun(state.tubes[a]), state.cap - state.tubes[b].length);
    const col = COLORS[top(state.tubes[a])];
    const layerH = parseFloat(getComputedStyle(stage).getPropertyValue('--lh')) || 36;
    const stream = document.createElement('div');
    stream.className = 'pt-stream';
    stream.style.background = `linear-gradient(90deg, ${col.hex}, #ffffffaa 50%, ${col.hex})`;
    stream.style.left = `${dr.left - st.left + dr.width / 2 - 4}px`;
    stream.style.top = `${dr.top - st.top + 8}px`;
    stream.style.height = `${Math.max(10, dr.height - 16 - state.tubes[b].length * layerH)}px`;
    stage.appendChild(stream);
    sfx('pour', count);
    const srcLayers = [...src.querySelectorAll('.layer')];
    const dstLiquid = dst.querySelector('.liquid');
    for (let k = 0; k < count; k++) {
      srcLayers[srcLayers.length - 1 - k].style.height = '0px';
      const add = document.createElement('div');
      add.className = 'layer';
      add.style.setProperty('--c', col.hex);
      add.style.height = '0px';
      add.innerHTML = `<span class="sym">${col.sym}</span>`;
      dstLiquid.appendChild(add);
      requestAnimationFrame(() => { add.style.height = `${layerH}px`; });
      await wait(170);
    }
    stream.remove();

    // Estado: antes/depois para saber o que mudou (cadeados, gelo, cores completas, mistério).
    const lockedBefore = state.tubes.map((_, i) => isLocked(state, i));
    const frozenBefore = state.tubes.map((_, i) => isFrozen(state, i));
    const moved = pour(state, a, b);
    for (let k = 0; k < moved; k++) { hidden[a].pop(); hidden[b].push(false); }
    let revealed = false;
    if (state.tubes[a].length && hidden[a][state.tubes[a].length - 1]) {
      hidden[a][state.tubes[a].length - 1] = false;
      revealed = true;
    }
    history.push({ a, b, n: moved, revealed });

    src.style.transform = '';
    await wait(260);
    src.classList.remove('pouring');
    render();
    vibrate('light');

    if (revealed) { sfx('reveal'); flaskEl(a)?.querySelector('.layer:last-of-type')?.classList.add('just-revealed'); }
    if (isComplete(state, b)) { sfx('cork'); vibrate('medium'); sparkle(b); }
    state.tubes.forEach((_, i) => {
      if (lockedBefore[i] && !isLocked(state, i)) { sfx('chains'); flaskEl(i)?.classList.add('unlocking'); toast('🔓 Frasco destrancado!', 1500); }
      if (frozenBefore[i] && !isFrozen(state, i)) { sfx('thaw'); flaskEl(i)?.classList.add('thawing'); }
    });
    busy = false;
    persist();
    tutorial();
    if (isSolved(state)) { await wait(350); win(); return; }
    if (!hasAnyMove()) stuck();
  }

  function hasAnyMove() {
    for (let a = 0; a < state.tubes.length; a++) for (let b = 0; b < state.tubes.length; b++) if (canPour(state, a, b)) return true;
    // Com gelo à espera, jogadas noutros frascos também contam; sem nenhuma, está mesmo preso.
    return false;
  }

  function sparkle(i) {
    const el = flaskEl(i);
    if (!el) return;
    const r = el.getBoundingClientRect(), st = stage.getBoundingClientRect();
    for (let k = 0; k < 14; k++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const ang = (Math.PI * 2 * k) / 14, d = 26 + Math.random() * 26;
      s.style.left = `${r.left - st.left + r.width / 2}px`;
      s.style.top = `${r.top - st.top}px`;
      s.style.setProperty('--dx', `${Math.cos(ang) * d}px`);
      s.style.setProperty('--dy', `${Math.sin(ang) * d}px`);
      s.style.background = 'var(--done-c, #e8b04a)';
      stage.appendChild(s);
      setTimeout(() => s.remove(), 720);
    }
  }

  function undo() {
    if (busy || finished) return;
    const h = history.pop();
    if (!h) return;
    unpour(state, h.a, h.b, h.n);
    for (let k = 0; k < h.n; k++) { hidden[h.b].pop(); hidden[h.a].push(false); }
    undos++;
    selected = null;
    sfx('pick');
    render();
    persist();
  }

  // Ajudas: grátis/guardadas, senão moedas.
  async function getItem(kind, label) {
    if (wallet.available(kind) > 0) { wallet.useItem(kind); updateBadges(); return true; }
    const ok = await new Promise(resolve => {
      modal(`<div class="dialog-emoji">${kind === 'hint' ? '💡' : '🧪'}</div><h3>Acabaram as ${label} de hoje</h3><p>Amanhã há mais grátis. Até lá, podes usar moedas ganhas a jogar.</p>`, [
        { label: `Usar ${coinHtml(wallet.prices[kind])}`, run: () => { if (wallet.spend(wallet.prices[kind])) { sfx('coin'); resolve(true); } else { toast('Não tens moedas suficientes'); resolve(false); } } },
        { label: 'Cancelar', cls: 'ghost', run: () => resolve(false) },
      ]);
    });
    updateBadges();
    return ok;
  }

  async function hint() {
    if (busy || finished) return;
    const path = solve(state, 80000);
    if (!path) { toast('Por aqui já não há saída. Desfaz algumas jogadas ou usa um frasco extra.', 3200); return; }
    if (!(await getItem('hint', 'ajudas'))) return;
    helps++;
    const [a, b] = path[0];
    if (selected !== null) { flaskEl(selected)?.classList.remove('lifted'); selected = null; }
    sfx('hint');
    [a, b].forEach((i, k) => { const el = flaskEl(i); el.classList.add(k ? 'hint-to' : 'hint-from'); setTimeout(() => el.classList.remove('hint-from', 'hint-to'), 2600); });
    persist();
  }

  async function extraFlask() {
    if (busy || finished) return;
    if (usedExtra) { toast('Só podes juntar um frasco extra por nível.'); return; }
    if (!(await getItem('flask', 'frascos extra'))) return;
    usedExtra = true;
    helps++;
    addTube(state);
    hidden.push([]);
    sfx('cork');
    render();
    layout();
    flaskEl(state.tubes.length - 1)?.classList.add('appearing');
    persist();
  }

  // ---------- Fim ----------

  function win() {
    finished = true;
    clearInterval(timer);
    clearSaved(target);
    sfx('win'); vibrate('heavy'); confetti();
    const stars = starsFor(state.moves, level.par, helps);
    if (!helps && !undos) achievements.bump('cleanWins');
    if (daily) { winDaily(stars); return; }
    const p = progress();
    const prev = p.stars[n] || 0;
    const advancing = n === p.current;
    p.stars[n] = Math.max(prev, stars);
    p.best[n] = Math.min(p.best[n] ?? Infinity, state.moves);
    if (advancing) p.current = Math.min(n + 1, TOTAL_LEVELS + 1);
    if (level.mystery) p.mysteryWins = (p.mysteryWins || 0) + 1;
    saveProgress(p);
    const coins = (10 + 5 * stars) * (level.hard || level.special ? 2 : 1);
    wallet.reward({ coins });
    analytics.track('level_win', { mode: 'level', n, seconds, helps });
    achievements.check();
    pending = { n, stars, prev, advancing };
    if (stars === 3 && n >= 10) setTimeout(requestReviewOnce, 1500);

    const tips = [];
    if (state.moves > level.par) tips.push(`acaba em ${level.par} jogadas ou menos`);
    if (helps) tips.push('não uses Ajuda nem Frasco extra');
    modal(
      `<span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>
       <h3>Nível ${n} resolvido!</h3>
       <p>${state.moves} jogadas · alvo ${level.par}${p.best[n] === state.moves && prev ? ' · <span class="record">Recorde!</span>' : ''}</p>
       <p class="earned">+${coins} <span class="coin">●</span></p>
       ${tips.length ? `<p class="tips">Para 3 estrelas: ${tips.join(' e ')}</p>` : ''}`,
      [
        { label: 'Continuar', run: () => nav.back() },
        { label: 'Repetir', cls: 'ghost', run: () => start(true) },
      ],
    );
  }

  // Desafio diário: estrelas do dia e troféu do mês completo.
  function winDaily(stars) {
    const d = dailyState();
    const date = level.daily;
    d.done[date] = Math.max(d.done[date] || 0, stars);
    const month = date.slice(0, 7);
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    let trophy = false;
    if (Object.keys(d.done).filter(k => k.startsWith(month)).length === daysInMonth && !d.trophies.includes(month)) {
      d.trophies.push(month);
      trophy = true;
    }
    saveDaily(d);
    const coins = 40 + 10 * stars + (trophy ? 200 : 0);
    wallet.reward({ coins });
    analytics.track('level_win', { mode: 'daily', seconds, helps });
    achievements.check();
    modal(
      `<span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>
       <h3>Desafio de ${shortDate(date)} resolvido!</h3>
       <p>${state.moves} jogadas · alvo ${level.par}</p>
       <p class="earned">+${coins} <span class="coin">●</span></p>
       ${trophy ? '<p class="trophy-won">🥇 Mês completo! Ganhaste o troféu do mês.</p>' : ''}`,
      [
        { label: 'Voltar ao calendário', run: () => nav.back() },
        { label: 'Repetir', cls: 'ghost', run: () => start(true) },
      ],
    );
  }

  function stuck() {
    modal(
      `<div class="dialog-emoji">🫙</div><h3>Sem jogadas</h3><p>Não há nenhuma poção que possas deitar. Desfaz algumas jogadas${usedExtra ? '' : ' ou junta um frasco extra'}.</p>`,
      [
        { label: 'Desfazer', run: undo },
        ...(usedExtra ? [] : [{ label: '🧪 Frasco extra', cls: 'secondary', run: extraFlask }]),
        { label: 'Recomeçar', cls: 'ghost', run: () => start(true) },
      ],
    );
  }

  // ---------- Tutorial e mecânicas novas ----------

  let removeHand = null, closeBubble = null;
  const coach = load(COACH_KEY, {});
  const seen = k => coach[k];
  const markSeen = k => { coach[k] = 1; save(COACH_KEY, coach); };

  async function intro() {
    if (level.tutorial && !history.length) { tutorial(); return; }
    for (const key of level.mechanics) {
      if (seen(`mech-${key}`)) continue;
      markSeen(`mech-${key}`);
      const m = MECHANICS[key];
      await lumenSays(`${m.icon} ${m.name}`, m.text, 'Percebi');
    }
  }

  // Nível 1: a solução tem 3 jogadas; a mão mostra cada uma.
  const TUTORIAL_MOVES = [[0, 2], [1, 0], [1, 2]];
  function tutorial() {
    if (!level.tutorial || finished) return;
    removeHand?.(); closeBubble?.();
    removeHand = closeBubble = null;
    const step = TUTORIAL_MOVES[history.length];
    if (!step) return;
    const target = selected === null ? step[0] : step[1];
    const el = flaskEl(target);
    if (!el) return;
    const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    removeHand = hand(stage, r.left - sr.left + r.width / 2, r.top - sr.top + r.height * 0.55);
    const text = selected === null
      ? (history.length ? 'Agora este frasco.' : 'Toca num frasco para o <b>pegar</b>.')
      : (history.length ? 'Deita aqui, sobre a <b>mesma cor</b>.' : 'Agora toca no frasco vazio para <b>deitar</b>.');
    closeBubble = bubble(stage, text, { placement: 'above' });
  }

  // ---------- Botões ----------

  stage.addEventListener('click', e => {
    const el = e.target.closest('.pt-flask');
    if (el) tap(Number(el.dataset.i));
  });
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=restart]').onclick = () => {
    if (!history.length || busy) return;
    modal('<h3>Recomeçar o nível?</h3><p>As poções voltam ao início.</p>', [
      { label: 'Recomeçar', run: () => start(true) },
      { label: 'Cancelar', cls: 'ghost' },
    ]);
  };
  $('[data-act=undo]').onclick = undo;
  $('[data-act=hint]').onclick = hint;
  $('[data-act=flask]').onclick = extraFlask;

  const ro = new ResizeObserver(() => layout());
  ro.observe(wrap);
  start();

  return () => {
    clearInterval(timer);
    ro.disconnect();
    removeHand?.(); closeBubble?.();
    if (!finished && history.length) {
      persist();
      analytics.track('level_quit', { mode: daily ? 'daily' : 'level', n });
    }
  };
}

// Partículas lentas no fundo, com a decoração do capítulo.
export function ambient(el, deco) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'pt-ambient';
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('span');
    p.textContent = i % 3 === 0 ? deco[i % deco.length] : '✦';
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${14 + Math.random() * 12}s`;
    p.style.animationDelay = `${-Math.random() * 20}s`;
    p.style.fontSize = `${i % 3 === 0 ? 16 + Math.random() * 10 : 6 + Math.random() * 6}px`;
    layer.appendChild(p);
  }
  el.prepend(layer);
}
