// Ecrã de jogo do Azulejos: pares como no Mahjong, com azulejos especiais e combos.
import { getLevel, getDailyLevel, PLACES, MECHANICS, TOTAL_LEVELS } from './levels.js';
import { newGame, tap, canTouch, isFree, moves, rocket, reshuffle, clone, tilesLeft } from './engine.js';
import { tileSvg, portrait, nameOf, ICON_NAMES } from './art.js';
import { sceneSvg } from './panels.js';
import { progress, update, loadSaved, storeSaved, clearSaved, dailyState, saveDaily } from './progress.js';
import { wallet, achievements, analytics } from './meta.js';
import { activeFesta } from './festas.js';
import { sfx } from '../../core/audio.js';
import { vibrate, requestReviewOnce } from '../../core/native.js';
import { modal, toast, confetti, coinHtml, bubble, hand } from '../../core/ui.js';

let pending = null;
export const takeCelebration = () => { const c = pending; pending = null; return c; };

const OBJECTIVES = {
  combo2: { text: 'Faz um combo x2', check: s => s.bestCombo >= 2 },
  combo3: { text: 'Faz um combo x3', check: s => s.bestCombo >= 3 },
  noundo: { text: 'Acaba sem Desfazer', check: s => s.undos === 0 },
  norocket: { text: 'Acaba sem o Foguete', check: s => !s.rocketUsed },
};
const POWER_ICON = { raio: '⚡', fogo: '🔥', chave: '🔑', olho: '👁️' };
const POWER_TEXT = { raio: '⚡ Raio! Saiu mais um par.', fogo: '🔥 Fogo! O gelo derreteu.', chave: '🔑 Chave! Os portões abriram.', olho: '👁️ Olho! Os presentes abriram-se.', foguete: '🚀 O foguete levou um par.' };
const REASONS = {
  covered: null,
  ice: () => '❄️ Congelado: faz um par ao lado para partir o gelo.',
  lock: t => `🔒 Faz primeiro um par de ${ICON_NAMES[t.lock]}.`,
  vine: () => '🌿 Tira um vizinho do lado para soltar a hera.',
  cork: t => `🍾 A rolha salta daqui a ${t.cork} ${t.cork === 1 ? 'par' : 'pares'}.`,
};
const CHEERS = ['Boa!', 'Isso!', 'Bonito!', 'Mais um!', 'Muito bem!'];

// Diálogo com um bicho (usado nas explicações e nos níveis do Cinzento).
export const sayDialog = (who, title, text, button = 'Vamos!') => new Promise(resolve => {
  modal(`<div class="az-say">${portrait(who)}<div><b>${title || nameOf(who)}</b><p>${text}</p></div></div>`, [{ label: button, run: resolve }]);
});

// target: número do nível, ou { date } do desafio diário.
export function azulejosGame(root, nav, target) {
  const daily = typeof target === 'object';
  const festa = daily ? activeFesta(target.date) : null;
  const level = daily ? getDailyLevel(target.date, festa?.faces) : getLevel(target);
  const n = daily ? null : target;
  const place = PLACES[level.place];
  const title = daily ? `Diário · ${target.date.slice(8)}/${target.date.slice(5, 7)}` : level.villain ? `Nível do Cinzento · ${n}` : `${place.name} · ${n}`;
  const chips = Object.keys(level.mech).map(k => `<span>${MECHANICS[k].icon} ${MECHANICS[k].name}</span>`);
  if (level.villain) chips.unshift('<span>🦎 Cinzento</span>');
  const objective = level.objective ? OBJECTIVES[level.objective] : null;
  const mascot = level.villain ? 'cinzento' : place.who;

  root.innerHTML = `
    <div class="screen az-game ${level.villain ? 'villain' : ''}">
      <div class="az-backdrop">${sceneSvg(level.place)}</div>
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <div class="az-title"><b>${title}</b><small data-ref="goal">${objective ? `⭐ ${objective.text}` : 'Junta pares de azulejos iguais'}</small></div>
        <button class="icon-btn" data-act="restart" aria-label="Recomeçar">↻</button>
      </header>
      <div class="az-chips">${chips.join('')}<span class="az-left" data-ref="left"></span></div>
      <div class="az-bench"><div class="az-board"></div><div class="az-combo" data-ref="combo"></div></div>
      <footer class="az-foot">
        <div class="az-pet" data-ref="pet">${portrait(mascot)}<div class="az-speech" data-ref="speech"></div></div>
        <div class="toolbar">
          <button class="tool" data-act="undo"><span>↶</span>Desfazer</button>
          <button class="tool" data-act="hint"><span>💡</span>Dica<em class="badge" data-ref="hint"></em></button>
          <button class="tool" data-act="shuffle"><span>🔀</span>Baralhar<em class="badge" data-ref="shuffle"></em></button>
          <button class="tool" data-act="rocket"><span>🚀</span>Foguete<em class="badge" data-ref="rocket"></em></button>
        </div>
      </footer>
    </div>`;

  const $ = s => root.querySelector(s);
  const bench = $('.az-bench'), board = $('.az-board');

  let g, history, s, busy, finished, geo, seconds, timer;

  function start(fresh = false) {
    const saved = !fresh && loadSaved(target);
    if (saved?.g?.playerPairs != null) {
      g = saved.g; s = saved.s; seconds = saved.seconds;
      toast('Jogo retomado');
    } else {
      g = newGame(level);
      s = { helps: 0, undos: 0, rocketUsed: false, freeShuffle: true, bestCombo: 0, powers: 0 };
      seconds = 0;
      clearSaved(target);
    }
    history = [];
    busy = false; finished = false;
    analytics.track('level_start', { mode: daily ? 'daily' : 'level', n });
    clearInterval(timer);
    timer = setInterval(() => { if (!finished && !document.hidden) seconds++; }, 1000);
    layout();
    render();
    updateBadges();
    setTimeout(intro, 300);
  }
  const persist = () => { if (!finished && g.pairs) storeSaved(target, { g, s, seconds }); };

  // ---------- Desenho ----------

  function layout() {
    const ts = g.tiles;
    const maxX = Math.max(...ts.map(t => t.x)) + 2, maxY = Math.max(...ts.map(t => t.y)) + 2, maxZ = Math.max(...ts.map(t => t.z));
    const W = bench.clientWidth - 12, H = bench.clientHeight - 12;
    const w = Math.floor(Math.min(64, W / (maxX / 2 + 0.25), H / (maxY / 2 + 0.3 + maxZ * 0.12)));
    geo = { w, lift: Math.round(w * 0.12), th: Math.max(3, Math.round(w * 0.1)), maxZ };
    board.style.width = `${(maxX / 2) * w}px`;
    board.style.height = `${(maxY / 2) * w + maxZ * geo.lift + geo.th}px`;
    board.style.setProperty('--w', `${w}px`);
    board.style.setProperty('--th', `${geo.th}px`);
  }

  const pileCount = t => g.tiles.filter(o => !o.gone && o.pile && o.x === t.x && o.y === t.y).length;

  function tileHtml(t) {
    const free = isFree(t, g.tiles);
    const sel = g.sel.includes(t.id);
    const wrapped = t.gift && !free;
    const face = wrapped ? tileSvg(t.face, { back: true }) : t.grey && !sel ? tileSvg(t.face, { hidden: true }) : tileSvg(t.face);
    const marks = [
      t.ice > 0 ? `<i class="az-ice ${t.ice === 1 ? 'cracked' : ''}">${t.ice > 1 ? `<b>${t.ice}</b>` : ''}</i>` : '',
      t.lock ? `<i class="az-lock">🔒<span>${tileSvg(t.lock)}</span></i>` : '',
      t.vine ? '<i class="az-vine"></i>' : '',
      t.cork > 0 ? `<i class="az-cork">${t.cork}</i>` : '',
      t.tide > 0 ? `<i class="az-tide ${t.tide <= 2 ? 'urgent' : ''}">🌊${t.tide}</i>` : '',
      t.power && !wrapped ? `<i class="az-pow">${POWER_ICON[t.power]}</i>` : '',
      t.pile && free && pileCount(t) > 1 ? `<i class="az-stack">${pileCount(t)}</i>` : '',
    ].join('');
    const left = (t.x / 2) * geo.w, top = (t.y / 2) * geo.w + (geo.maxZ - t.z) * geo.lift;
    return `<button class="az-tile ${free ? '' : 'blocked'} ${sel ? 'sel' : ''}" data-i="${t.id}"
      style="left:${left}px;top:${top}px;z-index:${t.z * 100 + t.y * 3 + t.x}" aria-label="${wrapped ? 'Presente' : t.grey && !sel ? 'Azulejo sem cor' : ICON_NAMES[t.face]}">${face}${marks}</button>`;
  }

  function render() {
    board.innerHTML = g.tiles.filter(t => !t.gone).map(tileHtml).join('');
    $('[data-ref=left]').textContent = `${tilesLeft(g)} azulejos`;
    if (objective) {
      const done = level.objective.startsWith('combo') && objective.check(s);
      $('[data-ref=goal]').textContent = `${done ? '✅' : '⭐'} ${objective.text}`;
    }
  }

  function updateBadges() {
    for (const k of ['hint', 'shuffle', 'rocket']) {
      const a = wallet.available(k), el = $(`[data-ref=${k}]`);
      el.innerHTML = a > 0 ? a : coinHtml(wallet.prices[k]);
      el.classList.toggle('price', a === 0);
    }
  }

  // Mascote: um salto e uma frase curta.
  let speechTimer;
  function pet(text, mood = 'hop') {
    const p = $('[data-ref=pet]'), sp = $('[data-ref=speech]');
    p.classList.remove('hop', 'sad'); void p.offsetWidth; p.classList.add(mood);
    if (text) {
      sp.textContent = text; sp.classList.add('show');
      clearTimeout(speechTimer);
      speechTimer = setTimeout(() => sp.classList.remove('show'), 1800);
    }
  }

  function showCombo(face, k) {
    const el = $('[data-ref=combo]');
    el.innerHTML = `<span>${tileSvg(face)}</span>Combo x${k}! <small>${['', '', 'Boa!', 'Ganhaste um ⚡', 'Fogo no gelo! 🔥', 'Mestre!'][Math.min(k, 5)]}</small>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  // ---------- Jogadas ----------

  async function onTap(id) {
    if (finished || busy) return;
    const snap = clone(g);
    const ev = tap(g, id);
    if (!ev.length) return;
    const blocked = ev.find(e => e.kind === 'blocked');
    if (blocked) {
      sfx('blocked'); vibrate('light');
      const el = board.querySelector(`[data-i="${id}"]`);
      el?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 220 });
      const r = REASONS[blocked.why];
      if (r) toast(r(g.tiles[id]), 1800);
      return;
    }
    if (!ev.some(e => e.kind === 'pair')) { sfx('tap'); vibrate('light'); render(); return; }
    history.push(snap);
    if (history.length > 40) history.shift();
    await playEvents(ev);
    afterMove();
  }

  // Anima os acontecimentos de uma jogada (par, poderes, combos, gelo...).
  async function playEvents(ev) {
    busy = true;
    removeHand?.();
    const pairs = ev.filter(e => e.kind === 'pair');
    pairs.forEach((p, k) => p.ids.forEach(i => {
      const el = board.querySelector(`[data-i="${i}"]`);
      if (el) { el.classList.add('sel'); setTimeout(() => el.classList.add('pop'), k * 120); }
    }));
    sfx('match', Math.max(1, g.streak.n)); vibrate('medium');
    const first = pairs[0] && board.querySelector(`[data-i="${pairs[0].ids[0]}"]`);
    if (first) sparkle(first.getBoundingClientRect());
    await new Promise(r => setTimeout(r, 260 + (pairs.length - 1) * 120));
    render();
    const flash = id => board.querySelector(`[data-i="${id}"]`)?.classList.add('flash');
    let said = false;
    for (const e of ev) {
      if (e.kind === 'combo') {
        showCombo(e.face, e.n); sfx('trio', e.n - 2);
        s.bestCombo = Math.max(s.bestCombo, e.n);
        achievements.setMax('maxCombo', s.bestCombo);
        pet(`Combo x${e.n}!`); said = true;
      }
      if (e.kind === 'power') {
        s.powers++;
        if (e.power !== 'foguete') { sfx('chirp'); toast(POWER_TEXT[e.power], 1500); pet('Uau, um super poder!'); said = true; }
      }
      if (e.kind === 'newpower') { flash(e.id); }
      if (e.kind === 'melt' || e.kind === 'crack') { sfx('thaw'); flash(e.id); }
      if (e.kind === 'unlock') { sfx('unlock'); flash(e.id); }
      if (e.kind === 'pop') { sfx('cork'); flash(e.id); }
      if (e.kind === 'vine' || e.kind === 'unwrap') flash(e.id);
      if (e.kind === 'grey') { sfx('greyed'); flash(e.id); pet('Hehe, apaguei mais um!', 'sad'); said = true; }
    }
    if (!said && Math.random() < 0.35) pet(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    busy = false;
  }

  function afterMove() {
    persist();
    tutorial();
    if (g.over === 'won') { setTimeout(win, 300); return; }
    if (g.over === 'tide') { lostTide(); return; }
    if (!moves(g).length) stuck();
  }

  function sparkle(r) {
    const colors = ['#1d3f8f', '#3b64c4', '#d99a1e', '#ffffff'];
    for (let k = 0; k < 14; k++) {
      const sp = document.createElement('i');
      sp.className = 'az-spark';
      const a = (Math.PI * 2 * k) / 14, d = 26 + Math.random() * 36;
      sp.style.left = `${r.left + r.width / 2}px`; sp.style.top = `${r.top + r.height / 2}px`;
      sp.style.background = colors[k % 4];
      sp.style.setProperty('--dx', `${Math.cos(a) * d}px`); sp.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      document.body.appendChild(sp); setTimeout(() => sp.remove(), 650);
    }
  }

  // ---------- Ajudas ----------

  async function getItem(kind, label) {
    if (wallet.available(kind) > 0) { wallet.useItem(kind); updateBadges(); return true; }
    const ok = await new Promise(resolve => modal(`<h3>Acabaram ${label}</h3><p>Podes usar moedas ganhas a jogar.</p>`, [
      { label: `Usar ${coinHtml(wallet.prices[kind])}`, run: () => { if (wallet.spend(wallet.prices[kind])) { sfx('coin'); resolve(true); } else { toast('Não tens moedas suficientes'); resolve(false); } } },
      { label: 'Cancelar', cls: 'ghost', run: () => resolve(false) },
    ]));
    updateBadges();
    return ok;
  }

  function undo() {
    if (busy || finished) return;
    if (!history.length) { toast('Não há nada para desfazer.'); return; }
    g = history.pop();
    g.sel = [];
    g.streak = { face: null, n: 0 };   // desfazer corta a sequência do combo
    s.undos++;
    sfx('pick');
    render(); persist();
  }

  async function hint() {
    if (busy || finished) return;
    const m = moves(g)[0];
    if (!m) { stuck(); return; }
    if (!(await getItem('hint', 'as dicas'))) return;
    s.helps++;
    sfx('hint');
    g.sel = [];
    render();
    m.forEach(i => board.querySelector(`[data-i="${i}"]`)?.classList.add('hint'));
    persist();
  }

  async function shuffle(free = false) {
    if (busy || finished) return;
    if (!free && !(await getItem('shuffle', 'os baralhos'))) return;
    s.helps++;
    reshuffle(g);
    sfx('shuffle');
    board.classList.remove('shuffling'); void board.offsetWidth; board.classList.add('shuffling');
    render(); persist();
    if (!moves(g).length) setTimeout(stuck, 500);
  }

  async function useRocket() {
    if (busy || finished) return;
    if (!(await getItem('rocket', 'os foguetes'))) return;
    s.helps++; s.rocketUsed = true;
    history.push(clone(g));
    const ev = rocket(g);
    sfx('boom');
    await playEvents(ev);
    afterMove();
  }

  // ---------- Fim ----------

  function stuck() {
    if (finished) return;
    sfx('denied');
    pet('Hmm... não há pares livres.', 'sad');
    const actions = [];
    if (s.freeShuffle) actions.push({ label: '🔀 Baralhar (grátis)', run: () => { s.freeShuffle = false; shuffle(true); } });
    else actions.push({ label: `🔀 Baralhar ${wallet.available('shuffle') ? `(${wallet.available('shuffle')})` : coinHtml(wallet.prices.shuffle)}`, run: () => shuffle() });
    actions.push({ label: `🚀 Foguete ${wallet.available('rocket') ? `(${wallet.available('rocket')})` : coinHtml(wallet.prices.rocket)}`, cls: 'secondary', run: useRocket });
    actions.push({ label: 'Desfazer', cls: 'ghost', run: undo });
    modal(`<div class="dialog-emoji">🤔</div><h3>Sem pares livres</h3><p>Não há dois azulejos iguais livres. ${s.freeShuffle ? 'Baralha os azulejos (desta vez é grátis)' : 'Baralha, usa o foguete'} ou desfaz algumas jogadas.</p>`, actions);
  }

  function lostTide() {
    sfx('lose'); vibrate('heavy');
    pet('Oh não, a maré!', 'sad');
    analytics.track('level_lose', { mode: daily ? 'daily' : 'level', n });
    modal('<div class="dialog-emoji">🌊</div><h3>A maré chegou</h3><p>Um azulejo com a onda não saiu a tempo. Desfaz a última jogada ou recomeça e tira primeiro os azulejos com a onda.</p>', [
      { label: 'Desfazer', run: () => { g.over = null; undo(); } },
      { label: 'Recomeçar', cls: 'ghost', run: () => start(true) },
    ]);
  }

  function win() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    clearSaved(target);
    sfx('win'); vibrate('heavy'); confetti();
    pet('Conseguiste!');
    const objDone = objective ? objective.check(s) : true;
    const stars = 1 + (s.helps === 0 ? 1 : 0) + (objDone ? 1 : 0);
    let coins = (10 + 5 * stars) * (level.villain ? 2 : 1) + (s.bestCombo >= 3 ? 5 : 0);
    if (daily) {
      coins = (40 + 10 * stars) * (festa ? 2 : 1);
      const d = dailyState();
      d.done[target.date] = Math.max(d.done[target.date] || 0, stars);
      const month = target.date.slice(0, 7);
      const [y, m] = month.split('-').map(Number);
      if (Object.keys(d.done).filter(k => k.startsWith(month)).length === new Date(y, m, 0).getDate() && !d.trophies.includes(month)) { d.trophies.push(month); coins += 200; }
      saveDaily(d);
    } else {
      let prev = 0;
      update(p => {
        prev = p.stars[n] || 0;
        p.stars[n] = Math.max(prev, stars);
        if (n === p.current) p.current = Math.min(n + 1, TOTAL_LEVELS + 1);
        if (level.villain) p.villainWins = (p.villainWins || 0) + 1;
      });
      pending = { n, stars, prev, advancing: prev === 0 && progress().current === n + 1 };
    }
    wallet.reward({ coins });
    analytics.track('level_win', { mode: daily ? 'daily' : 'level', n, seconds, helps: s.helps });
    achievements.check();
    if (stars === 3 && n >= 10) setTimeout(requestReviewOnce, 1500);
    const tips = [];
    if (s.helps) tips.push('não uses ajudas');
    if (objective && !objDone) tips.push(objective.text.toLowerCase());
    modal(
      `<span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>
       <h3>${daily ? 'Desafio do dia feito!' : level.villain ? 'Venceste o Cinzento!' : 'Nível ganho!'}</h3>
       ${daily ? '' : '<p>Uma peça do painel ganhou cor.</p>'}
       ${s.bestCombo >= 2 ? `<p>Melhor combo: x${s.bestCombo}</p>` : ''}
       <p class="earned">+${coins} <span class="coin">●</span>${festa ? ' <small>(festa: a dobrar)</small>' : ''}</p>
       ${tips.length ? `<p class="tips">Para 3 estrelas: ${tips.join(' e ')}</p>` : ''}`,
      [{ label: daily ? 'Voltar ao calendário' : 'Voltar ao mapa', run: () => nav.back() }, { label: 'Repetir', cls: 'ghost', run: () => start(true) }],
    );
  }

  // ---------- Tutorial e explicações ----------

  let removeHand = null, closeBubble = null;
  async function intro() {
    const p = progress();
    if (level.villain && !daily) {
      await sayDialog('cinzento', 'Mestre Cinzento', p.seen.villain
        ? 'Outra vez tu? A cada três pares vou apagar as cores de um azulejo!'
        : 'Ah, a raposinha! Neste painel mando eu: a cada três pares apago as cores de um azulejo. Vais ter de te lembrar do desenho!', 'Vamos a isso');
      update(q => { q.seen.villain = true; });
    }
    if (!p.seen.pairsRules && (daily || n > 1)) {
      // Quem já jogava com a barra: explicar as regras novas uma vez.
      update(q => { q.seen.pairsRules = true; });
      await sayDialog('pena', 'Regras novas', 'Agora joga-se como o Mahjong: toca em <b>dois azulejos iguais e livres</b>. Livre é não ter nada por cima e ter um lado sem vizinho. <b>Pares seguidos do mesmo desenho</b> fazem combos!', 'Percebi');
    }
    if (level.intro && !p.seen[`mech-${level.intro}`]) {
      update(q => { q.seen[`mech-${level.intro}`] = true; });
      await sayDialog(place.who, `${MECHANICS[level.intro].icon} ${MECHANICS[level.intro].name}`, MECHANICS[level.intro].text, 'Percebi');
    }
    for (const k of Object.keys(level.mech)) {
      if (progress().seen[`mech-${k}`]) continue;
      update(q => { q.seen[`mech-${k}`] = true; });
      await sayDialog('pena', `${MECHANICS[k].icon} ${MECHANICS[k].name}`, MECHANICS[k].text, 'Percebi');
    }
    if (n === 1) update(q => { q.seen.pairsRules = true; });
    tutorial();
  }

  function tutorial() {
    if (n !== 1 || finished) return;
    removeHand?.(); closeBubble?.();
    removeHand = closeBubble = null;
    const next = g.sel.length
      ? g.tiles.find(t => !t.gone && t.id !== g.sel[0] && t.face === g.tiles[g.sel[0]].face && canTouch(g, t))
      : (moves(g)[0] ? g.tiles[moves(g)[0][0]] : null);
    if (!next) return;
    const el = board.querySelector(`[data-i="${next.id}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect(), br = board.getBoundingClientRect();
    removeHand = hand(board, r.left - br.left + r.width / 2, r.top - br.top + r.height * 0.6);
    const msg = !g.pairs && !g.sel.length ? 'Toca num azulejo <b>claro</b>: os escuros estão presos.'
      : g.sel.length ? 'Agora toca no azulejo <b>igual</b> para fazer o par.'
      : g.pairs === 1 ? 'Boa! Se fizeres pares <b>seguidos do mesmo desenho</b>, ganhas um combo.'
      : 'Continua: dois iguais e livres de cada vez.';
    closeBubble = bubble($('.az-foot'), msg, { placement: 'above', autoClose: 5000 });
  }

  // ---------- Botões ----------

  board.addEventListener('click', e => {
    const b = e.target.closest('.az-tile');
    if (!b) return;
    onTap(Number(b.dataset.i)).then(() => { if (n === 1) tutorial(); });
  });
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=restart]').onclick = () => {
    if (!g.pairs || busy) return;
    modal('<h3>Recomeçar o nível?</h3><p>Os azulejos voltam ao início.</p>', [{ label: 'Recomeçar', run: () => start(true) }, { label: 'Cancelar', cls: 'ghost' }]);
  };
  $('[data-act=undo]').onclick = undo;
  $('[data-act=hint]').onclick = hint;
  $('[data-act=shuffle]').onclick = () => shuffle();
  $('[data-act=rocket]').onclick = useRocket;
  const ro = new ResizeObserver(() => requestAnimationFrame(() => { if (g && !busy) { layout(); render(); } }));
  ro.observe(bench);
  start();

  return () => {
    clearInterval(timer);
    ro.disconnect();
    removeHand?.(); closeBubble?.();
    if (!finished && g.pairs) { persist(); analytics.track('level_quit', { mode: daily ? 'daily' : 'level', n }); }
  };
}
