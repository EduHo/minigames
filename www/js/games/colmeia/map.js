// Mapa da Colmeia: caminho pelo prado com os níveis, estrelas, baús, portões e a abelha.
// E o calendário do desafio diário.
import { getLevel, ZONES, LEVELS_PER_ZONE, STARS_PER_ZONE, TOTAL_LEVELS } from './levels.js';
import { progress, update, totalStars, zoneOf, gateReady, zoneOpen, isPlayable, hasChest, loadSaved, dailyState } from './progress.js';
import { colmeiaGame, takeCelebration } from './game.js';
import { hexPts, goalIcon, goalText, BEE, flowers } from './art.js';
import { wallet, dailyReward, achievements, analytics } from './meta.js';
import { achievementsScreen, statsScreen } from '../../screens/app-screens.js';
import { sfx } from '../../core/audio.js';
import { vibrate } from '../../core/native.js';
import { modal, toast, coinHtml, confetti } from '../../core/ui.js';
import { rewardText } from '../../core/economy.js';
import { today } from '../../core/store.js';

const INFO = {
  name: 'Colmeia', color: '#e8a317', achievements, analytics, bestLabel: 'Estrelas',
  best: n => (progress().stars[n] ? '★'.repeat(progress().stars[n]) : null),
  bestStreak: () => dailyReward.state().best || 0,
};
const GAP = 104, PAD = 170, GATE = 150;
const chestPrize = n => (n % 12 === 0 ? { coins: 60, hammer: 1 } : { coins: 40, swap: 1 });

export function colmeiaHome(root, nav) {
  let p = progress();
  root.innerHTML = `
    <div class="screen cm-map">
      <header class="cm-maptop">
        <button class="cm-back" data-act="back" aria-label="Voltar">‹</button>
        <span class="cm-pill">★ <b data-ref="stars"></b></span>
        <span class="cm-pill" data-ref="coins">${coinHtml(wallet.coins())}</span>
      </header>
      <div class="cm-mapscroll"><div class="cm-mapinner"></div></div>
      <footer class="cm-mapbar">
        <button class="cm-pill" data-act="daily">📅 Diário${dailyState().done[today()] ? '' : '<i class="dot"></i>'}</button>
        <button class="cm-play" data-act="play"></button>
        <button class="cm-pill" data-act="achievements" aria-label="Conquistas">🏆</button>
        <button class="cm-pill" data-act="stats" aria-label="Estatísticas">📊</button>
      </footer>
    </div>`;
  const $ = s => root.querySelector(s);
  const scroller = $('.cm-mapscroll'), inner = $('.cm-mapinner');
  let pos = {}, first = 1, last = 1, H = 0;

  // Mostra a zona atual, a anterior e a seguinte (o resto não é preciso desenhar).
  function layout() {
    const cz = zoneOf(Math.min(p.current, TOTAL_LEVELS));
    const z0 = Math.max(0, cz - 1), z1 = Math.min(ZONES.length - 1, cz + 1);
    first = z0 * LEVELS_PER_ZONE + 1; last = (z1 + 1) * LEVELS_PER_ZONE;
    const count = last - first + 1, gates = z1 - z0;
    H = PAD * 2 + (count - 1) * GAP + gates * GATE;
    pos = {};
    let y = H - PAD;
    for (let n = first; n <= last; n++) {
      if (n > first && (n - 1) % LEVELS_PER_ZONE === 0) y -= GATE;
      pos[n] = { x: 50 + Math.sin(n * 1.15) * 29, y };   // x em %
      y -= GAP;
    }
  }
  const gateY = z => (pos[z * LEVELS_PER_ZONE].y + pos[z * LEVELS_PER_ZONE + 1].y) / 2;

  function render() {
    if (!inner.isConnected) return;
    p = progress();
    layout();
    const W = inner.clientWidth || 360;
    const px = n => (pos[n].x / 100) * W;
    let d = '';
    for (let n = first; n <= last; n++) d += n === first ? `M ${px(n)} ${pos[n].y}` : ` S ${(px(n - 1) + px(n)) / 2 + (n % 2 ? 50 : -50)} ${(pos[n - 1].y + pos[n].y) / 2} ${px(n)} ${pos[n].y}`;
    let h = `<svg class="cm-mapbg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      ${ZONES.map((z, k) => { const a = k * LEVELS_PER_ZONE + 1; if (a < first || a > last) return ''; const yTop = k === zoneOf(last) ? 0 : gateY(k + 1), yBot = a === first ? H : gateY(k); return `<rect x="0" y="${yTop}" width="${W}" height="${yBot - yTop}" fill="${z.color}"/>`; }).join('')}
      ${flowers(first * 7 + 3, W, H, Math.round(H / 60))}
      <path d="${d}" fill="none" stroke="#9a6418" stroke-width="22" stroke-linecap="round" opacity=".45"/>
      <path d="${d}" fill="none" stroke="#ffcf5a" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 16"/></svg>`;
    // Faixas com o nome de cada zona
    for (let z = zoneOf(first); z <= zoneOf(last); z++) {
      const a = z * LEVELS_PER_ZONE + 1;
      h += `<div class="cm-zone" style="top:${pos[a].y + 52}px">${ZONES[z].icon} ${z + 1}. ${ZONES[z].name}</div>`;
    }
    const cur = Math.min(p.current, TOTAL_LEVELS);
    for (let n = first; n <= last; n++) {
      const st = p.stars[n] || 0, open = isPlayable(p, n), isCur = n === cur && open;
      const boss = n % LEVELS_PER_ZONE === 0;
      const c = isCur ? ['#ffcf3f', '#c79300'] : st ? ['#f7a93a', '#b8661a'] : open ? ['#f2c869', '#b8862a'] : ['#c9b48c', '#8a7350'];
      h += `<button class="cm-node ${open ? '' : 'locked'} ${isCur ? 'cur' : ''} ${boss ? 'boss' : ''}" data-n="${n}" style="left:${pos[n].x}%;top:${pos[n].y}px" aria-label="Nível ${n}">
        <svg viewBox="0 0 64 72"><polygon points="${hexPts(32, 40, 28)}" fill="${c[1]}"/><polygon points="${hexPts(32, 35, 28)}" fill="${c[0]}" stroke="#fff" stroke-width="3"/>
        <text x="32" y="36" text-anchor="middle" dominant-baseline="central" font-weight="800" font-size="${n > 99 ? 17 : 21}" fill="#fff" stroke="rgba(0,0,0,.3)" stroke-width="1.5" paint-order="stroke">${n}</text></svg>
        ${st ? `<span class="cm-st">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">★</i>`).join('')}</span>` : ''}${loadSaved(n) ? '<em>a meio</em>' : ''}</button>`;
      if (hasChest(n) && n < last) {
        const opened = p.chests[n];
        h += `<span class="cm-chest ${opened ? 'open' : ''}" data-chest="${n}" style="left:${pos[n].x > 50 ? pos[n].x - 26 : pos[n].x + 26}%;top:${pos[n].y - 50}px">${opened ? '📦' : '🎁'}</span>`;
      }
    }
    for (let z = Math.max(1, zoneOf(first) + 1); z <= zoneOf(last); z++) {
      const open = zoneOpen(p, z);
      h += `<div class="cm-gate ${open ? 'open' : ''}" data-gate="${z}" style="top:${gateY(z)}px"><span>${open ? '🌸' : '🚪'}</span><b>${open ? ZONES[z].name : `${totalStars(p)}/${z * STARS_PER_ZONE} ★`}</b></div>`;
    }
    const at = pos[cur] || pos[first];
    h += `<div class="cm-bee" style="left:${at.x}%;top:${at.y - 40}px">${BEE}</div>`;
    inner.style.height = `${H}px`;
    inner.innerHTML = h;
    $('[data-ref=stars]').textContent = totalStars(p);
    $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
    $('[data-act=play]').innerHTML = `▶ Nível ${cur}`;
  }
  const scrollTo = (n, smooth = false) => { if (pos[n]) scroller.scrollTo({ top: pos[n].y - scroller.clientHeight / 2, behavior: smooth ? 'smooth' : 'auto' }); };

  function openLevel(n) {
    if (!isPlayable(p, n)) {
      const z = zoneOf(n);
      toast(!zoneOpen(p, z) && p.current > z * LEVELS_PER_ZONE ? `Precisas de ${z * STARS_PER_ZONE} ★ para abrir ${ZONES[z].name}.` : `Acaba primeiro o nível ${Math.min(p.current, TOTAL_LEVELS)}.`);
      sfx('denied'); return;
    }
    sfx('tap');
    const lv = getLevel(n), st = p.stars[n] || 0;
    modal(`<h3>Nível ${n}</h3><p>Objetivos em <b>${lv.moves} jogadas</b>:</p>
      <div class="cm-objs">${lv.goals.map(g => `<div class="cm-obj">${goalIcon(g)}<span>${goalText(g)}</span></div>`).join('')}</div>
      <span class="stars big">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">★</i>`).join('')}</span>`,
      [{ label: loadSaved(n) ? 'Continuar' : 'Jogar', run: () => nav.show(colmeiaGame, n) }, { label: 'Fechar', cls: 'ghost' }], { dismissable: true });
  }
  function tryGate(z) {
    if (zoneOpen(p, z)) return;
    if (!gateReady(p, z)) { toast(p.current <= z * LEVELS_PER_ZONE ? `Acaba o nível ${z * LEVELS_PER_ZONE} primeiro.` : `Faltam ${z * STARS_PER_ZONE - totalStars(p)} ★. Repete níveis para ganhar mais estrelas.`); return; }
    p = update(q => { q.gates.push(z); });
    sfx('gate'); vibrate('medium'); confetti();
    modal(`<div class="dialog-emoji">${ZONES[z].icon}</div><h3>${ZONES[z].name}</h3><p>${ZONES[z].text}</p>`, [{ label: 'Vamos!', run: render }]);
  }
  inner.addEventListener('click', e => {
    const node = e.target.closest('.cm-node'); if (node) { openLevel(Number(node.dataset.n)); return; }
    const gate = e.target.closest('.cm-gate'); if (gate) { tryGate(Number(gate.dataset.gate)); return; }
    const chest = e.target.closest('.cm-chest:not(.open)');
    if (chest) toast(`Este baú abre quando passares o nível ${chest.dataset.chest}.`);
  });

  // Depois de uma vitória: a abelha avança, baús e portões.
  async function celebrate(c) {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    scrollTo(c.n);
    await wait(300);
    if (c.advancing) {
      const bee = inner.querySelector('.cm-bee'), next = pos[Math.min(c.n + 1, TOTAL_LEVELS)];
      if (bee && pos[c.n]) { bee.style.left = `${pos[c.n].x}%`; bee.style.top = `${pos[c.n].y - 40}px`; await wait(50); bee.style.left = `${next.x}%`; bee.style.top = `${next.y - 40}px`; sfx('hop'); }
      await wait(700);
      if (hasChest(c.n) && !p.chests[c.n]) {
        const prize = chestPrize(c.n);
        p = update(q => { q.chests[c.n] = true; });
        wallet.reward(prize); sfx('coin'); vibrate('light');
        toast(`🎁 Baú aberto: ${rewardText(prize)}`, 2200);
        render(); scrollTo(c.n + 1);
      }
      const z = zoneOf(c.n + 1);
      if (c.n % LEVELS_PER_ZONE === 0 && c.n < TOTAL_LEVELS && gateReady(p, z)) { await wait(400); tryGate(z); }
    }
  }

  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=play]').onclick = () => openLevel(Math.min(p.current, TOTAL_LEVELS));
  $('[data-act=daily]').onclick = () => nav.show(colmeiaDaily);
  $('[data-act=achievements]').onclick = () => nav.show(achievementsScreen, INFO);
  $('[data-act=stats]').onclick = () => nav.show(statsScreen, INFO);

  render();
  const cel = takeCelebration();
  if (cel) celebrate(cel).then(() => { render(); scrollTo(Math.min(progress().current, TOTAL_LEVELS)); });
  else {
    scrollTo(Math.min(p.current, TOTAL_LEVELS));
    setTimeout(async () => { analytics.session(); await dailyReward.show(); achievements.check(); $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins()); }, 350);
  }
  let lastW = inner.clientWidth;
  const ro = new ResizeObserver(() => { if (Math.abs(inner.clientWidth - lastW) > 4) { lastW = inner.clientWidth; render(); } });
  ro.observe(inner);
  const off = wallet.onChange(() => { const el = $('[data-ref=coins]'); if (el) el.innerHTML = coinHtml(wallet.coins()); });
  return () => { ro.disconnect(); off(); };
}

// ---------- Desafio diário ----------
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export function colmeiaDaily(root, nav, offset = 0) {
  const d = dailyState(), t = today();
  const [ty, tm] = t.split('-').map(Number);
  const view = new Date(ty, tm - 1 + offset, 1);
  const y = view.getFullYear(), m = view.getMonth() + 1, prefix = `${y}-${String(m).padStart(2, '0')}`;
  const days = new Date(y, m, 0).getDate(), firstDow = (view.getDay() + 6) % 7;
  const doneCount = Object.keys(d.done).filter(k => k.startsWith(prefix)).length;
  let cells = '<span></span>'.repeat(firstDow);
  for (let day = 1; day <= days; day++) {
    const key = `${prefix}-${String(day).padStart(2, '0')}`, st = d.done[key], future = key > t;
    cells += `<button class="day ${st ? 'done' : ''} ${key === t ? 'today' : ''} ${future ? 'future' : ''}" data-date="${key}" ${future ? 'disabled' : ''}>
      <b>${day}</b>${st ? `<span class="stars small">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">★</i>`).join('')}</span>` : ''}</button>`;
  }
  root.innerHTML = `<div class="screen sub cm-sub"><header class="topbar"><button class="icon-btn" data-act="back" aria-label="Voltar">‹</button><h2>Desafio diário</h2><span class="coin-badge">${coinHtml(wallet.coins())}</span></header>
    <div class="sub-scroll">
      <div class="panel">
        <div class="month-nav"><button class="icon-btn" data-act="prev" aria-label="Mês anterior">‹</button>
          <div><b>${MONTHS[m - 1]} ${y}</b><small>${doneCount}/${days} dias · troféu ao completar o mês</small></div>
          <button class="icon-btn" data-act="next" ${offset >= 0 ? 'disabled' : ''} aria-label="Mês seguinte">›</button></div>
        <div class="cal-head">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="calendar">${cells}</div>
        <div class="progress-bar"><i style="width:${(doneCount / days) * 100}%"></i></div>
      </div>
      ${offset === 0 ? `<button class="play-next" data-date="${t}">${d.done[t] ? 'Jogar outra vez o de hoje' : '▶ Jogar o desafio de hoje'}</button><p class="muted center">A mesma colmeia e as mesmas peças para toda a gente hoje.</p>` : ''}
      <div class="panel"><h3>Troféus</h3><div class="trophies">${d.trophies.map(mo => `<span class="trophy">🥇<small>${MONTHS[Number(mo.slice(5)) - 1].slice(0, 3)} ${mo.slice(0, 4)}</small></span>`).join('') || '<p class="muted">Completa todos os dias de um mês para ganhar o troféu e 200 moedas.</p>'}</div></div>
    </div></div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelector('[data-act=prev]').onclick = () => nav.replace(colmeiaDaily, offset - 1);
  root.querySelector('[data-act=next]').onclick = () => nav.replace(colmeiaDaily, offset + 1);
  root.querySelectorAll('[data-date]:not([disabled])').forEach(b => { b.onclick = () => nav.show(colmeiaGame, { date: b.dataset.date }); });
}
