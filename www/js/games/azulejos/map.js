// Mapa do Azulejos: caminho de níveis por sítio, com portões de estrelas, baús,
// a Inês a saltar de nível em nível e as cenas da história.
import { PLACES, LEVELS_PER_PLACE, STARS_PER_PLACE, TOTAL_LEVELS, isVillain, placeOf } from './levels.js';
import { progress, update, totalStars, placeIdx, gateReady, placeOpen, isPlayable, panelPieces, hasChest, chestPrize, loadSaved, dailyState } from './progress.js';
import { azulejosGame, takeCelebration } from './game.js';
import { frame, portrait, nameOf, decoSvg } from './art.js';
import { panelSvg } from './panels.js';
import { PROLOGUE, PLACE_SCENES, ENDING } from './story.js';
import { wallet, achievements, analytics, dailyReward } from './meta.js';
import { activeFesta } from './festas.js';
import { panelScreen, toca, atelier, album, azDaily } from './extras.js';
import { rewardText } from '../../core/economy.js';
import { sfx } from '../../core/audio.js';
import { vibrate } from '../../core/native.js';
import { toast, coinHtml } from '../../core/ui.js';
import { today } from '../../core/store.js';
import { achievementsScreen, statsScreen } from '../../screens/app-screens.js';

const STEP = 88, GATE_GAP = 210, PAD = 110;
const wait = ms => new Promise(r => setTimeout(r, ms));

const AZ_INFO = {
  name: 'Azulejos', color: '#1d3f8f', achievements, analytics, bestLabel: 'Estrelas',
  best: n => (progress().stars[n] ? '★'.repeat(progress().stars[n]) : null),
  bestStreak: () => dailyReward.state().best || 0,
};

// ---------- Cena de história (sobreposta ao ecrã) ----------
export function playScene(lines, placeI = 0) {
  return new Promise(resolve => {
    const place = PLACES[placeI % 10];
    const ov = document.createElement('div');
    ov.className = 'az-scene';
    ov.style.setProperty('--top', place.top);
    ov.style.setProperty('--bottom', place.bottom);
    ov.innerHTML = `<div class="az-scene-bg">${panelSvg(placeI).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')}</div>
      <button class="az-skip">Saltar ›</button>
      <div class="az-cast"></div>
      <div class="az-dialog"><b></b><p></p><small>toca para continuar ›</small></div>`;
    document.body.appendChild(ov);
    let i = 0;
    const show = () => {
      const [who, text] = lines[i];
      const others = [...new Set(lines.map(l => l[0]))].filter(w => w !== who).slice(0, 1);
      const cast = [who, ...others];
      ov.querySelector('.az-cast').innerHTML = cast.map((w, k) => `<div class="actor ${k ? 'dim' : ''} ${w === 'cinzento' ? 'grey' : ''}">${portrait(w)}</div>`).join('');
      ov.querySelector('.az-dialog b').textContent = nameOf(who);
      ov.querySelector('.az-dialog p').textContent = text;
      ov.classList.toggle('greyscene', who === 'cinzento');
      sfx(who === 'pena' ? 'chirp' : who === 'cinzento' ? 'greyed' : 'tap');
    };
    const close = () => { ov.remove(); resolve(); };
    ov.addEventListener('click', e => {
      if (e.target.closest('.az-skip')) { close(); return; }
      i++;
      if (i >= lines.length) close(); else show();
    });
    show();
  });
}

// focus: índice da área a mostrar (vindo do ecrã de áreas).
export function azulejosHome(root, nav, focus = null) {
  let p = progress();
  let W = 0, H = 0, pos = {}, first = 1, last = 1, firstPlace = 0, lastPlace = 0, extraBack = 0;
  const festa = activeFesta();

  root.innerHTML = `
    <div class="screen az-map-screen">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h2>Azulejos</h2>
        <span class="coin-badge az-coins" data-ref="coins">${coinHtml(wallet.coins())}</span>
      </header>
      ${festa ? `<div class="az-festa">${festa.icon} ${festa.name}: desafio diário com desenhos de festa e moedas a dobrar</div>` : ''}
      <div class="az-map-bar">
        <span class="pill stars" data-ref="stars"></span>
        <button class="pill play" data-act="play">▶ <b data-ref="current"></b></button>
        <span class="spacer"></span>
        <button class="pill" data-act="daily" aria-label="Desafio diário">📅${dailyState().done[today()] ? '' : '<i class="dot"></i>'}</button>
        <button class="pill" data-act="panel" aria-label="Painel">🖼️</button>
        <button class="pill" data-act="toca" aria-label="Toca da Avó Rosa">🏠</button>
        <button class="pill" data-act="atelier" aria-label="Pintar azulejos">🖌️</button>
        <button class="pill" data-act="album" aria-label="Álbum de postais">📮</button>
        <button class="pill" data-act="achievements" aria-label="Conquistas">🏆</button>
        <button class="pill" data-act="stats" aria-label="Estatísticas">📊</button>
      </div>
      <div class="az-map"><div class="az-map-inner"></div></div>
    </div>`;
  const $ = s => root.querySelector(s);
  const mapEl = $('.az-map'), inner = $('.az-map-inner');

  const atLevel = () => Math.min(TOTAL_LEVELS, placeOpen(p, placeIdx(Math.min(p.current, TOTAL_LEVELS))) ? p.current : p.current - 1);

  function layout() {
    const cur = placeIdx(Math.min(p.current, TOTAL_LEVELS));
    if (focus != null) extraBack = Math.max(extraBack, cur - 2 - focus);
    firstPlace = Math.max(0, cur - 2 - extraBack);
    lastPlace = Math.min(TOTAL_LEVELS / LEVELS_PER_PLACE - 1, cur + 1);
    first = firstPlace * LEVELS_PER_PLACE + 1;
    last = (lastPlace + 1) * LEVELS_PER_PLACE;
    W = inner.clientWidth || 360;
    const count = last - first + 1, places = lastPlace - firstPlace + 1;
    H = PAD * 2 + (count - 1) * STEP + (places - 1) * GATE_GAP + (firstPlace > 0 ? 60 : 0);
    pos = {};
    for (let n = first; n <= last; n++) {
      const i = n - first, c = placeIdx(n) - firstPlace;
      pos[n] = { x: W / 2 + Math.sin(n * 0.78) * Math.min(W * 0.3, 150), y: H - PAD - i * STEP - c * GATE_GAP };
    }
  }
  const gateY = c => (pos[c * LEVELS_PER_PLACE].y + pos[c * LEVELS_PER_PLACE + 1].y) / 2;
  const pathD = (a, b) => {
    let d = `M ${pos[a].x} ${pos[a].y}`;
    for (let n = a + 1; n <= b; n++) { const u = pos[n - 1], v = pos[n], my = (u.y + v.y) / 2; d += ` C ${u.x} ${my}, ${v.x} ${my}, ${v.x} ${v.y}`; }
    return d;
  };
  const levelTile = (n, locked) => frame(isVillain(n) && !locked
    ? '<text x="20" y="28" text-anchor="middle" font-size="20">🦎</text>'
    : `<text x="20" y="27" text-anchor="middle" font-size="${n > 99 ? 14 : 17}" font-weight="800" font-family="Nunito, system-ui, sans-serif" fill="${locked ? '#8b8f99' : '#1d3f8f'}">${locked ? '🔒' : n}</text>`, { grey: locked });

  function render() {
    p = progress();
    layout();
    inner.style.height = `${H}px`;
    let h = '';
    for (let c = firstPlace; c <= lastPlace; c++) {
      const pl = PLACES[c % 10];
      const yTop = c === lastPlace ? 0 : gateY(c + 1), yBot = c === firstPlace ? H : gateY(c);
      const pieces = panelPieces(p, c);
      h += `<div class="band" style="top:${yTop}px;height:${yBot - yTop}px;background:linear-gradient(180deg, ${pl.top}, ${pl.bottom})">
        ${decoSvg(pl.deco, W, yBot - yTop)}
        <button class="band-name" data-panel="${c}">${c + 1}. ${pl.name}${c >= 10 ? ' II' : ''}<small>🖼️ ${pieces}/20</small></button></div>`;
    }
    h += `<svg class="path" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path d="${pathD(first, last)}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".7"/>
      <path d="${pathD(first, last)}" fill="none" stroke="#8fb0e8" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>
      <path d="${pathD(first, Math.max(first + 1, Math.min(atLevel(), last)))}" fill="none" stroke="#d99a1e" stroke-width="6" stroke-linecap="round"/></svg>`;
    for (let n = first; n < last; n++) {
      if (!hasChest(n)) continue;
      const a = pos[n], b = pos[n + 1], open = p.chests[n];
      h += `<span class="chest ${open ? 'open' : ''}" data-chest="${n}" style="left:${(a.x + b.x) / 2 + 46}px;top:${(a.y + b.y) / 2 - 6}px">${open ? '📦' : '🎁'}</span>`;
    }
    for (let n = first; n <= last; n++) {
      const st = p.stars[n] || 0, can = isPlayable(p, n);
      h += `<button class="node ${!can ? 'locked' : n === p.current ? 'current' : 'done'} ${isVillain(n) ? 'special' : ''}" data-n="${n}"
          style="left:${pos[n].x}px;top:${pos[n].y}px" aria-label="Nível ${n}${st ? `, ${st} estrelas` : ''}">${levelTile(n, !can)}
        ${st ? `<span class="nst">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">★</i>`).join('')}</span>` : ''}</button>`;
    }
    for (let c = firstPlace + 1; c <= lastPlace; c++) {
      const pl = PLACES[c % 10], need = c * STARS_PER_PLACE, have = totalStars(p), open = placeOpen(p, c);
      h += `<div class="gate ${open ? 'open' : ''}" data-gate="${c}" style="top:${gateY(c) - 66}px">
        <div class="gate-who">${portrait(pl.who)}</div>
        <div class="gate-text"><b>${open ? '🔓' : '🔒'} ${c + 1}. ${pl.name}</b>
          <small>${open ? `${nameOf(pl.who)} está à tua espera` : `★ ${Math.min(have, need)} / ${need} · acaba o nível ${c * LEVELS_PER_PLACE}`}</small>
          ${open ? '' : `<span class="prog"><i style="width:${Math.min(100, (have / need) * 100)}%"></i></span>`}</div></div>`;
    }
    if (firstPlace > 0) h += `<button class="btn more" style="top:${H - 50}px" data-act="more">Ver sítios anteriores</button>`;
    const at = atLevel();
    if (pos[at]) h += `<span class="avatar" style="left:${pos[at].x}px;top:${pos[at].y}px">${portrait('ines')}</span>`;
    inner.innerHTML = h;
    $('[data-ref=stars]').textContent = `★ ${totalStars(p)}`;
    $('[data-ref=current]').textContent = `Nível ${at}`;
    $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
  }

  const scrollToY = (y, smooth = true) => mapEl.scrollTo({ top: y - mapEl.clientHeight / 2, behavior: smooth ? 'smooth' : 'auto' });
  const closePops = () => inner.querySelectorAll('.pop').forEach(e => e.remove());

  function showPop(n) {
    closePops();
    const st = p.stars[n] || 0;
    const pop = document.createElement('div');
    pop.className = 'pop';
    pop.style.left = `${Math.max(115, Math.min(W - 115, pos[n].x))}px`;
    pop.style.top = pos[n].y < 230 ? `${pos[n].y + 52}px` : `${pos[n].y - 180}px`;
    if (!isPlayable(p, n)) {
      const c = placeIdx(n);
      pop.innerHTML = `<b>Nível ${n}</b><small>${!placeOpen(p, c) && p.current > c * LEVELS_PER_PLACE ? `Precisas de ${c * STARS_PER_PLACE} ★ para entrar em ${PLACES[c % 10].name}. Repete níveis para ganhar mais estrelas.` : `Acaba o nível ${atLevel()} primeiro.`}</small>`;
    } else {
      pop.innerHTML = `<b>${isVillain(n) ? 'Nível do Cinzento' : `Nível ${n}`}</b><span class="big">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>
        <small>${n === p.current ? 'Próximo nível' : st < 3 ? 'Repete para ganhar mais estrelas' : 'Perfeito!'}</small><button class="btn primary">${loadSaved(n) ? 'Continuar' : 'Jogar'}</button>`;
      pop.querySelector('button').onclick = e => { e.stopPropagation(); nav.show(azulejosGame, n); };
    }
    pop.addEventListener('click', e => e.stopPropagation());
    inner.appendChild(pop);
  }
  inner.addEventListener('click', e => {
    const node = e.target.closest('.node');
    if (node) { e.stopPropagation(); sfx('tap'); showPop(Number(node.dataset.n)); return; }
    const band = e.target.closest('[data-panel]');
    if (band) { nav.show(panelScreen, Number(band.dataset.panel)); return; }
    if (e.target.closest('[data-act=more]')) { extraBack += 3; render(); return; }
    const gate = e.target.closest('.gate:not(.open)');
    if (gate) {
      const c = Number(gate.dataset.gate);
      toast(p.current <= c * LEVELS_PER_PLACE ? `Acaba o nível ${c * LEVELS_PER_PLACE} e junta ${c * STARS_PER_PLACE} ★.` : `Faltam ${c * STARS_PER_PLACE - totalStars(p)} ★. Repete níveis com menos de 3 estrelas.`);
      return;
    }
    closePops();
  });

  // ---------- Depois de uma vitória ----------
  async function celebrate({ n, stars, prev, advancing }) {
    if (!pos[n]) return;
    scrollToY(pos[n].y, false);
    await wait(350);
    const node = inner.querySelector(`.node[data-n="${n}"]`);
    if (node) {
      node.querySelectorAll('.nst i').forEach((el, i) => el.classList.toggle('on', i < prev));
      const nr = node.getBoundingClientRect();
      for (let i = 0; i < stars; i++) {
        const f = document.createElement('span');
        f.className = 'fly-star'; f.textContent = '★';
        f.style.left = `${innerWidth / 2 - 15}px`; f.style.top = `${mapEl.getBoundingClientRect().top + 10}px`; f.style.transform = 'scale(2)';
        document.body.appendChild(f);
        requestAnimationFrame(() => requestAnimationFrame(() => { f.style.left = `${nr.left + nr.width / 2 - 22 + i * 15}px`; f.style.top = `${nr.top + 50}px`; f.style.transform = 'scale(.5)'; }));
        setTimeout(() => f.remove(), 760);
        sfx('star', i);
        await wait(240);
      }
      await wait(420);
      node.querySelectorAll('.nst i').forEach((el, i) => { el.classList.toggle('on', i < Math.max(prev, stars)); if (i >= prev && i < stars) el.classList.add('just-won'); });
    }
    // Baú
    if (advancing && hasChest(n) && !p.chests[n]) {
      await wait(300);
      const chest = inner.querySelector(`.chest[data-chest="${n}"]`);
      chest?.classList.add('wiggle'); sfx('coin'); vibrate('light');
      await wait(900);
      const prize = chestPrize(n);
      p = update(q => { q.chests[n] = true; });
      wallet.reward(prize);
      if (chest) { chest.textContent = '📦'; chest.classList.add('open'); floatAt(parseFloat(chest.style.left), parseFloat(chest.style.top), rewardText(prize)); }
      $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
    }
    // Painel completo: despedida do sítio (e final da viagem nas ilhas)
    const c0 = placeIdx(n);
    if (panelPieces(p, c0) === LEVELS_PER_PLACE && !p.seen[`leave-${c0}`]) {
      update(q => { q.seen[`leave-${c0}`] = true; });
      await wait(300);
      sfx('guitarra');
      const lines = PLACE_SCENES[c0 % 10].leave;
      if (lines.length) await playScene(lines, c0);
      if (c0 === 9) await playScene(ENDING, 9);
      achievements.check();
    }
    // Portões
    for (let c = 1; c <= lastPlace; c++) {
      if (placeOpen(p, c) || p.current <= c * LEVELS_PER_PLACE) continue;
      if (n === c * LEVELS_PER_PLACE || gateReady(p, c)) { await wait(350); await tryGate(c); return; }
    }
    if (advancing && pos[n + 1] && isPlayable(p, n + 1)) await hop(n, n + 1);
  }

  async function tryGate(c) {
    scrollToY(gateY(c));
    await wait(500);
    const gate = inner.querySelector(`.gate[data-gate="${c}"]`);
    if (gateReady(p, c)) {
      p = update(q => { if (!q.gates.includes(c)) q.gates.push(c); });
      sfx('gate'); vibrate('heavy');
      render();
      inner.querySelector(`.gate[data-gate="${c}"]`)?.classList.add('opening');
      await wait(700);
      await hop(c * LEVELS_PER_PLACE, c * LEVELS_PER_PLACE + 1);
      if (!p.seen[`arrive-${c}`]) {
        update(q => { q.seen[`arrive-${c}`] = true; });
        await playScene(PLACE_SCENES[c % 10].arrive, c);
      }
    } else {
      sfx('denied'); vibrate('medium');
      gate?.classList.add('shake');
      setTimeout(() => gate?.classList.remove('shake'), 500);
      floatAt(W / 2 - 60, gateY(c) - 84, `Faltam ${c * STARS_PER_PLACE - totalStars(p)} ★`);
      await wait(600);
      inner.querySelectorAll('.node.done').forEach(el => {
        if ((p.stars[el.dataset.n] || 0) < 3) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 600, iterations: 2 });
      });
    }
  }

  async function hop(a, b) {
    const av = inner.querySelector('.avatar');
    if (!av || !pos[a] || !pos[b]) return;
    scrollToY(pos[b].y);
    const u = pos[a], v = pos[b], t0 = performance.now(), dur = 650;
    sfx('hop');
    await new Promise(res => {
      (function f(t) {
        const k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        av.style.left = `${u.x + (v.x - u.x) * e}px`;
        av.style.top = `${u.y + (v.y - u.y) * e - Math.sin(Math.PI * k) * 40}px`;
        if (k < 1) requestAnimationFrame(f); else res();
      })(t0);
    });
  }
  function floatAt(x, y, html) {
    const f = document.createElement('span');
    f.className = 'float'; f.innerHTML = html;
    f.style.left = `${x}px`; f.style.top = `${y}px`;
    inner.appendChild(f); setTimeout(() => f.remove(), 1500);
  }

  // ---------- Botões e arranque ----------
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=play]').onclick = () => { const n = atLevel(); if (isPlayable(p, n)) nav.show(azulejosGame, n); };
  $('[data-act=daily]').onclick = () => nav.show(azDaily);
  $('[data-act=panel]').onclick = () => nav.show(panelScreen, placeIdx(atLevel()));
  $('[data-act=toca]').onclick = () => nav.show(toca);
  $('[data-act=atelier]').onclick = () => nav.show(atelier);
  $('[data-act=album]').onclick = () => nav.show(album);
  $('[data-act=achievements]').onclick = () => nav.show(achievementsScreen, AZ_INFO);
  $('[data-act=stats]').onclick = () => nav.show(statsScreen, AZ_INFO);

  render();
  const cel = takeCelebration();
  if (cel) {
    celebrate(cel).then(() => render());
    if (cel.advancing && pos[cel.n]) { const av = inner.querySelector('.avatar'); if (av) { av.style.left = `${pos[cel.n].x}px`; av.style.top = `${pos[cel.n].y}px`; } }
  } else {
    const focusN = focus == null || focus === placeIdx(atLevel()) ? atLevel() : focus * LEVELS_PER_PLACE + 1;
    const gateNext = focus != null && focus + 1 <= lastPlace && !placeOpen(p, focus + 1) && gateReady(p, focus + 1);
    scrollToY(gateNext ? gateY(focus + 1) : pos[focusN]?.y ?? pos[atLevel()]?.y ?? 0, false);
    analytics.session();
    setTimeout(async () => {
      if (!p.seen.prologue) {
        update(q => { q.seen.prologue = true; });
        await playScene(PROLOGUE, 0);
        await playScene(PLACE_SCENES[0].arrive, 0);
      }
      await dailyReward.show();
      achievements.check();
      $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
    }, 350);
  }
  let lastW = inner.clientWidth;
  const ro = new ResizeObserver(() => { if (Math.abs(inner.clientWidth - lastW) > 4) { lastW = inner.clientWidth; render(); } });
  ro.observe(inner);
  const off = wallet.onChange(() => { const el = $('[data-ref=coins]'); if (el) el.innerHTML = coinHtml(wallet.coins()); });
  return () => { ro.disconnect(); off(); document.querySelectorAll('.az-scene').forEach(e => e.remove()); };
}
