// Ecrã principal da Casa na Serra: a divisão a recuperar, as tarefas com estrelas e o botão de jogar.
// E o calendário do desafio diário.
import { ROOMS, roomSvg, roomCost } from './rooms.js';
import { ZONES, MECHANICS, TOTAL_LEVELS, levelConfig } from './levels.js';
import { progress, update, totalStars, loadSaved, dailyState } from './progress.js';
import { casaGame, takeCelebration } from './game.js';
import { wallet, dailyReward, achievements, analytics } from './meta.js';
import { drawScene } from './scene.js';
import { achievementsScreen, statsScreen } from '../../screens/app-screens.js';
import { sfx } from '../../core/audio.js';
import { vibrate } from '../../core/native.js';
import { toast, coinHtml, confetti, modal } from '../../core/ui.js';
import { today } from '../../core/store.js';

const INFO = {
  name: 'Casa na Serra', color: '#1f3b63', achievements, analytics, bestLabel: 'Estrelas',
  best: n => (progress().stars[n] ? '★'.repeat(progress().stars[n]) : null),
  bestStreak: () => dailyReward.state().best || 0,
};
const roomDone = (p, r) => ROOMS[r].tasks.every(t => p.rooms[r]?.[t.id] != null);

export function casaHome(root, nav, view = null) {
  let p = progress();
  let shown = view ?? p.room;

  root.innerHTML = `
    <div class="screen cs-home">
      <canvas class="cs-scene" aria-hidden="true"></canvas>
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h1 class="cs-h1">Casa na Serra</h1>
        <span class="coin-badge cs-coins" data-ref="coins">${coinHtml(wallet.coins())}</span>
      </header>
      <div class="cs-home-body">
        <div class="cs-roomcard">
          <div class="cs-roomhead">
            <button class="icon-btn" data-act="prev" aria-label="Divisão anterior">‹</button>
            <div><b data-ref="rname"></b><small data-ref="rprog"></small></div>
            <button class="icon-btn" data-act="next" aria-label="Divisão seguinte">›</button>
          </div>
          <div class="cs-room" data-ref="room"></div>
          <div class="cs-bank"><span>⭐ <b data-ref="bank"></b> para gastar</span><small>Cada nível novo ganho dá uma estrela</small></div>
        </div>
        <button class="play-next cs-play" data-act="play"></button>
        <div class="cs-roomcard"><div class="cs-tasks" data-ref="tasks"></div></div>
        <div class="cs-homebar">
          <button class="pill" data-act="daily">📅 Diário${dailyState().done[today()] ? '' : '<i class="dot"></i>'}</button>
          <button class="pill" data-act="achievements">🏆 Conquistas</button>
          <button class="pill" data-act="stats">📊 Estatísticas</button>
        </div>
      </div>
    </div>`;
  const $ = s => root.querySelector(s);

  function render(fresh = null) {
    p = progress();
    const unlocked = Math.min(ROOMS.length - 1, p.room);
    shown = Math.max(0, Math.min(shown, unlocked));
    const st = p.rooms[shown] || {};
    const room = ROOMS[shown];
    const done = room.tasks.filter(t => st[t.id] != null).length;
    $('[data-ref=rname]').textContent = `${shown + 1}. ${room.name}`;
    $('[data-ref=rprog]').textContent = roomDone(p, shown) ? 'Divisão recuperada ✓' : `${done}/${room.tasks.length} tarefas`;
    $('[data-ref=room]').innerHTML = roomSvg(shown, st, fresh);
    $('[data-ref=bank]').textContent = p.bank;
    $('[data-act=prev]').disabled = shown === 0;
    $('[data-act=next]').disabled = shown >= unlocked;
    $('[data-ref=tasks]').innerHTML = room.tasks.map(t => {
      const s = st[t.id];
      if (s != null) {
        return `<div class="cs-task done"><div><b>${t.name}</b><div class="cs-styles">${t.styles.map((c, k) => `<button class="cs-style ${k === s ? 'on' : ''}" style="background:${c}" data-t="${t.id}" data-s="${k}" aria-label="Estilo ${k + 1}"></button>`).join('')}</div></div><span class="cs-check">✓</span></div>`;
      }
      return `<div class="cs-task"><div><b>${t.name}</b><small>⭐ ${t.cost}</small></div><button class="btn primary" data-do="${t.id}" ${p.bank < t.cost ? 'disabled' : ''}>Fazer</button></div>`;
    }).join('');
    const n = Math.min(p.current, TOTAL_LEVELS), cfg = levelConfig(n);
    const mech = Object.keys(cfg.mech)[0];
    $('[data-act=play]').innerHTML = `▶ Nível ${n}<small>${ZONES[cfg.zone].name}${mech ? ` · ${MECHANICS[mech].icon} ${MECHANICS[mech].name}` : ''}${loadSaved(n) ? ' · a meio' : ''}</small>`;
    $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
  }

  // Fazer uma tarefa: gasta estrelas, escolhe o primeiro estilo (muda-se depois sem custo).
  $('[data-ref=tasks]').addEventListener('click', e => {
    const doIt = e.target.closest('[data-do]'), style = e.target.closest('[data-s]');
    if (doIt) {
      const t = ROOMS[shown].tasks.find(x => x.id === doIt.dataset.do);
      if (p.bank < t.cost) { toast('Precisas de mais estrelas: ganha níveis novos.'); return; }
      update(q => { q.bank -= t.cost; q.rooms[shown] = { ...(q.rooms[shown] || {}), [t.id]: 0 }; });
      sfx('unlock'); vibrate('light');
      render(t.id);
      const q = progress();
      if (roomDone(q, shown)) {
        setTimeout(() => {
          sfx('win'); confetti();
          const last = shown === ROOMS.length - 1;
          if (!last && q.room === shown) update(x => { x.room = shown + 1; });
          achievements.check();
          modal(`<div class="dialog-emoji">🏡</div><h3>${ROOMS[shown].name} recuperada!</h3><p>${last ? 'A casa está toda recuperada. Podes continuar a mudar os estilos à tua vontade.' : `Abriu uma divisão nova: <b>${ROOMS[shown + 1].name}</b>.`}</p>`,
            [{ label: last ? 'Que bonita!' : 'Ver a divisão nova', run: () => { if (!last) { shown += 1; render(); } } }]);
        }, 600);
      }
      return;
    }
    if (style) {
      update(q => { q.rooms[shown][style.dataset.t] = Number(style.dataset.s); });
      sfx('pick');
      render(style.dataset.t);
    }
  });
  $('[data-act=prev]').onclick = () => { shown--; render(); };
  $('[data-act=next]').onclick = () => { shown++; render(); };
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=play]').onclick = () => nav.show(casaGame, Math.min(progress().current, TOTAL_LEVELS));
  $('[data-act=daily]').onclick = () => nav.show(casaDaily);
  $('[data-act=achievements]').onclick = () => nav.show(achievementsScreen, INFO);
  $('[data-act=stats]').onclick = () => nav.show(statsScreen, INFO);

  const sceneCv = $('.cs-scene');
  const ro = new ResizeObserver(() => drawScene(sceneCv, ZONES.length ? Math.min(p.room, 9) % 4 : 0));
  ro.observe(root.querySelector('.cs-home'));
  render();
  const cel = takeCelebration();
  if (cel?.houseStar) { setTimeout(() => { sfx('star'); toast('⭐ +1 estrela para a casa'); root.querySelector('.cs-bank')?.classList.add('pulse'); }, 300); }
  else setTimeout(async () => { analytics.session(); await dailyReward.show(); achievements.check(); render(); }, 350);
  const off = wallet.onChange(() => { const el = $('[data-ref=coins]'); if (el) el.innerHTML = coinHtml(wallet.coins()); });
  return () => { ro.disconnect(); off(); };
}

// ---------- Desafio diário ----------
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEK_HINT = ['Segunda: calma', 'Terça: azulejos virados', 'Quarta: gelo', 'Quinta: pilhas e dourados', 'Sexta: correntes', 'Sábado: presentes e gelo', 'Domingo: tudo junto'];
export function casaDaily(root, nav, offset = 0) {
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
  const dow = (new Date(ty, tm - 1, Number(t.slice(8))).getDay() + 6) % 7;
  root.innerHTML = `<div class="screen sub cs-sub"><header class="topbar"><button class="icon-btn" data-act="back" aria-label="Voltar">‹</button><h2>Desafio diário</h2><span class="coin-badge">${coinHtml(wallet.coins())}</span></header>
    <div class="sub-scroll">
      <div class="panel">
        <div class="month-nav"><button class="icon-btn" data-act="prev" aria-label="Mês anterior">‹</button>
          <div><b>${MONTHS[m - 1]} ${y}</b><small>${doneCount}/${days} dias · troféu ao completar o mês</small></div>
          <button class="icon-btn" data-act="next" ${offset >= 0 ? 'disabled' : ''} aria-label="Mês seguinte">›</button></div>
        <div class="cal-head">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="calendar">${cells}</div>
        <div class="progress-bar"><i style="width:${(doneCount / days) * 100}%"></i></div>
      </div>
      ${offset === 0 ? `<button class="play-next" data-date="${t}">${d.done[t] ? 'Jogar outra vez o de hoje' : '▶ Jogar o desafio de hoje'}</button><p class="muted center">Hoje: ${WEEK_HINT[dow]}. O primeiro desafio de cada dia dá uma estrela para a casa.</p>` : ''}
      <div class="panel"><h3>Troféus</h3><div class="trophies">${d.trophies.map(mo => `<span class="trophy">🥇<small>${MONTHS[Number(mo.slice(5)) - 1].slice(0, 3)} ${mo.slice(0, 4)}</small></span>`).join('') || '<p class="muted">Completa todos os dias de um mês para ganhar o troféu e 200 moedas.</p>'}</div></div>
    </div></div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelector('[data-act=prev]').onclick = () => nav.replace(casaDaily, offset - 1);
  root.querySelector('[data-act=next]').onclick = () => nav.replace(casaDaily, offset + 1);
  root.querySelectorAll('[data-date]:not([disabled])').forEach(b => { b.onclick = () => nav.show(casaGame, { date: b.dataset.date }); });
}

export { roomCost, totalStars };
