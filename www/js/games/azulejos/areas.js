// Ecrã de áreas do Azulejos: um cartão por sítio, como as páginas de um álbum.
// Mostra o painel (as peças ganham cor com os níveis ganhos), as estrelas da área e um baú
// que abre com as 60 estrelas. Tocar no cartão abre o caminho dessa área.
import { PLACES, LEVELS_PER_PLACE, TOTAL_LEVELS, STARS_PER_PLACE } from './levels.js';
import { progress, update, placeIdx, placeOpen, gateReady, panelPieces, totalStars } from './progress.js';
import { panelSvg, PIECE_ORDER } from './panels.js';
import { portrait } from './art.js';
import { azulejosHome } from './map.js';
import { azulejosGame } from './game.js';
import { wallet } from './meta.js';
import { sfx } from '../../core/audio.js';
import { vibrate } from '../../core/native.js';
import { coinHtml, toast, confetti } from '../../core/ui.js';

const PLACE_COUNT = TOTAL_LEVELS / LEVELS_PER_PLACE;
const FULL = LEVELS_PER_PLACE * 3;
const CHEST_PRIZE = { coins: 150, rocket: 1 };

const placeStars = (p, c) => {
  let s = 0;
  for (let n = c * LEVELS_PER_PLACE + 1; n <= (c + 1) * LEVELS_PER_PLACE; n++) s += p.stars[n] || 0;
  return s;
};

const chestSvg = open => `<svg class="az-ar-chest ${open ? 'open' : ''}" viewBox="0 0 40 36" aria-hidden="true">
  ${open ? '<path d="M4 14 L8 2 L32 2 L36 14Z" fill="#a8743f" stroke="#5b3a1a" stroke-width="2"/><circle cx="14" cy="12" r="3" fill="#f6c453"/><circle cx="22" cy="10" r="3" fill="#f6c453"/><circle cx="27" cy="13" r="2.5" fill="#f6c453"/>'
    : '<path d="M4 16 Q20 4 36 16Z" fill="#a8743f" stroke="#5b3a1a" stroke-width="2"/>'}
  <rect x="4" y="15" width="32" height="19" rx="3" fill="#c48a4f" stroke="#5b3a1a" stroke-width="2"/><rect x="17" y="15" width="6" height="9" rx="1.5" fill="#f6c453" stroke="#5b3a1a" stroke-width="1.5"/></svg>`;

export function azulejosAreas(root, nav) {
  let p = progress();
  const cur = placeIdx(Math.min(p.current, TOTAL_LEVELS));
  const shown = Math.min(PLACE_COUNT, cur + 2);

  root.innerHTML = `
    <div class="screen az-sub az-areas">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h1 class="az-h1">Azulejos</h1>
        <span class="coin-badge az-coins" data-ref="coins">${coinHtml(wallet.coins())}</span>
      </header>
      <p class="az-ar-sub">Terras de Azulém · ★ ${totalStars(p)}</p>
      <div class="az-ar-track" data-ref="track"></div>
      <div class="az-ar-dots" data-ref="dots"></div>
      <button class="btn primary az-ar-play" data-act="play">▶ Nível ${Math.min(p.current, TOTAL_LEVELS)}</button>
    </div>`;
  const $ = s => root.querySelector(s);
  const track = $('[data-ref=track]'), dots = $('[data-ref=dots]');

  function cardHtml(c) {
    const pl = PLACES[c % 10];
    const open = placeOpen(p, c) && p.current > c * LEVELS_PER_PLACE;
    const gate = !open && !placeOpen(p, c) && gateReady(p, c);
    const pieces = panelPieces(p, c), stars = placeStars(p, c);
    const lit = new Set(PIECE_ORDER.slice(0, pieces));
    const claimed = !!p.areaChests?.[c];
    const done = pieces === LEVELS_PER_PLACE;
    const label = gate ? '🔓 Abrir o portão' : !open ? `🔒 Abre com ${c * STARS_PER_PLACE} ★` : done ? 'Rever o caminho' : c === cur ? 'Continuar' : 'Abrir';
    return `<article class="az-ar-card ${open || gate ? '' : 'locked'}" data-c="${c}">
      <span class="az-ar-ribbon">Área ${c + 1}${c >= 10 ? ' · 2.ª viagem' : ''}</span>
      <div class="az-ar-pic">${panelSvg(c)}<div class="az-ar-grid">${Array.from({ length: 20 }, (_, k) => `<i class="${lit.has(k) ? 'on' : ''}"></i>`).join('')}</div>${open ? '' : `<div class="az-ar-lock">${gate ? '🔓' : '🔒'}</div>`}</div>
      <div class="az-ar-who">${portrait(pl.who)}</div>
      <h2>${pl.name}${c >= 10 ? ' II' : ''}</h2>
      <small>${pieces}/${LEVELS_PER_PLACE} níveis</small>
      <div class="az-ar-prog">
        <div class="az-ar-bar"><i style="width:${(stars / FULL) * 100}%"></i><b>★ ${stars}/${FULL}</b></div>
        <button class="az-ar-chestbtn ${stars >= FULL && !claimed ? 'ready' : ''}" data-chest="${c}" aria-label="Baú da área">${chestSvg(claimed)}</button>
      </div>
      <button class="btn ${open || gate ? 'primary' : ''}" data-open="${c}">${label}</button>
    </article>`;
  }

  function render() {
    track.innerHTML = Array.from({ length: shown }, (_, c) => cardHtml(c)).join('');
    dots.innerHTML = Array.from({ length: shown }, () => '<i></i>').join('');
  }
  const cards = () => [...track.children];
  function sync() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    cards().forEach((el, k) => { if (Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid) < Math.abs(cards()[best].offsetLeft + cards()[best].offsetWidth / 2 - mid)) best = k; });
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === best));
  }
  const goTo = (c, smooth) => { const el = cards()[c]; if (el) track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' }); };

  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  track.addEventListener('click', e => {
    const chest = e.target.closest('[data-chest]');
    if (chest) {
      const c = Number(chest.dataset.chest);
      if (p.areaChests?.[c]) { toast('Já abriste este baú.'); return; }
      if (placeStars(p, c) < FULL) { sfx('denied'); toast(`O baú abre com ${FULL} ★ nesta área. Tens ${placeStars(p, c)}.`); return; }
      p = update(q => { q.areaChests = { ...(q.areaChests || {}), [c]: true }; });
      wallet.reward(CHEST_PRIZE);
      sfx('coin'); vibrate('medium'); confetti();
      toast(`🎉 Baú aberto: +${CHEST_PRIZE.coins} moedas e um foguete 🚀`, 2500);
      $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
      render(); goTo(c, false);
      return;
    }
    const card = e.target.closest('[data-c]');
    if (!card) return;
    const c = Number(card.dataset.c);
    if (card.classList.contains('locked')) {
      sfx('denied');
      toast(p.current <= c * LEVELS_PER_PLACE ? `Acaba primeiro a área ${c}.` : `Precisas de ${c * STARS_PER_PLACE} ★ para abrir. Tens ${totalStars(p)}.`);
      return;
    }
    sfx('tap');
    // Portão por abrir: o mapa mostra o fim da área anterior, onde está o portão.
    nav.show(azulejosHome, placeOpen(p, c) ? c : c - 1);
  });
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=play]').onclick = () => {
    const n = Math.min(p.current, TOTAL_LEVELS);
    nav.show(azulejosHome);
    if (placeOpen(p, placeIdx(n))) nav.show(azulejosGame, n);
  };

  render();
  requestAnimationFrame(() => { goTo(Math.min(cur, shown - 1), false); sync(); });
  const off = wallet.onChange(() => { const el = $('[data-ref=coins]'); if (el) el.innerHTML = coinHtml(wallet.coins()); });
  return () => off();
}

