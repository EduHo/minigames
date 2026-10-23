// Menu da Fornada: clássico (3×3 a 6×6), desafios, desafio diário e livro de receitas.
import { SWEETS, sweetSvg, sweetOf } from './art.js';
import { challenge, ZONES, LEVELS_PER_ZONE, TOTAL_LEVELS } from './levels.js';
import { progress, totalStars, loadSaved, dailyState } from './progress.js';
import { fornadaGame } from './game.js';
import { wallet, dailyReward, achievements, analytics } from './meta.js';
import { achievementsScreen, statsScreen } from '../../screens/app-screens.js';
import { coinHtml } from '../../core/ui.js';
import { today } from '../../core/store.js';

const INFO = {
  name: 'Fornada', color: '#d6336c', achievements, analytics, bestLabel: 'Estrelas',
  best: n => (progress().stars[n] ? '★'.repeat(progress().stars[n]) : null),
  bestStreak: () => dailyReward.state().best || 0,
};
const head = (title, extra = '') => `<header class="topbar"><button class="icon-btn" data-act="back" aria-label="Voltar">‹</button><h2>${title}</h2>${extra || '<span class="spacer"></span>'}</header>`;

export function fornadaHome(root, nav) {
  const p = progress();
  const cur = Math.min(p.current, TOTAL_LEVELS);
  const top = Math.max(...p.made);
  root.innerHTML = `
    <div class="screen fn-home">
      ${head('Fornada', `<span class="coin-badge fn-coins" data-ref="coins">${coinHtml(wallet.coins())}</span>`)}
      <div class="fn-home-body">
        <div class="fn-hero">${sweetSvg(top)}<div><small>O teu maior doce</small><b>${sweetOf(top).name}</b><span>${p.made.length}/${SWEETS.length} receitas no livro</span></div></div>
        <section class="fn-card">
          <h3>Clássico</h3>
          <div class="fn-sizes">${[3, 4, 5, 6].map(n => `<button class="fn-size" data-classic="${n}"><b>${n}×${n}</b><small>${p.best[n] ? `recorde ${p.best[n]}` : n === 4 ? 'o de sempre' : n === 3 ? 'apertado' : 'mais espaço'}</small>${loadSaved({ classic: n }) ? '<em>a meio</em>' : ''}</button>`).join('')}</div>
        </section>
        <button class="play-next fn-play" data-act="challenge">▶ Desafio ${cur}<small>${ZONES[Math.floor((cur - 1) / LEVELS_PER_ZONE)].name} · faz ${sweetOf(challenge(cur).goal).name}</small></button>
        <div class="fn-row">
          <button class="fn-tile-btn" data-act="list">🗂️<b>Desafios</b><small>${Object.keys(p.stars).length}/${TOTAL_LEVELS} · ★ ${totalStars(p)}</small></button>
          <button class="fn-tile-btn" data-act="daily">📅<b>Diário</b><small>${dailyState().done[today()] ? 'feito hoje ✓' : 'novo hoje'}</small></button>
          <button class="fn-tile-btn" data-act="book">📖<b>Receitas</b><small>${p.made.length}/${SWEETS.length}</small></button>
        </div>
        <div class="fn-row small">
          <button class="pill" data-act="achievements">🏆 Conquistas</button>
          <button class="pill" data-act="stats">📊 Estatísticas</button>
        </div>
      </div>
    </div>`;
  const $ = s => root.querySelector(s);
  $('[data-act=back]').onclick = () => nav.back();
  root.querySelectorAll('[data-classic]').forEach(b => { b.onclick = () => nav.show(fornadaGame, { classic: Number(b.dataset.classic) }); });
  $('[data-act=challenge]').onclick = () => nav.show(fornadaGame, cur);
  $('[data-act=list]').onclick = () => nav.show(fornadaChallenges);
  $('[data-act=daily]').onclick = () => nav.show(fornadaDaily);
  $('[data-act=book]').onclick = () => nav.show(fornadaBook);
  $('[data-act=achievements]').onclick = () => nav.show(achievementsScreen, INFO);
  $('[data-act=stats]').onclick = () => nav.show(statsScreen, INFO);
  setTimeout(async () => { analytics.session(); await dailyReward.show(); achievements.check(); const el = $('[data-ref=coins]'); if (el) el.innerHTML = coinHtml(wallet.coins()); }, 300);
}

// Lista dos desafios por zonas; abrem um a um.
export function fornadaChallenges(root, nav) {
  const p = progress();
  root.innerHTML = `<div class="screen sub fn-sub">${head('Desafios', `<span class="coin-badge">★ ${totalStars(p)}</span>`)}
    <div class="sub-scroll">${ZONES.map((z, k) => {
      const from = k * LEVELS_PER_ZONE + 1, to = from + LEVELS_PER_ZONE - 1;
      if (from > p.current + LEVELS_PER_ZONE) return `<div class="panel fn-zone locked"><h3>${z.icon} ${z.name}</h3><p class="muted">Abre no desafio ${from}.</p></div>`;
      let cells = '';
      for (let n = from; n <= to; n++) {
        const st = p.stars[n] || 0, open = n <= p.current;
        cells += `<button class="fn-lv ${open ? '' : 'locked'} ${n === p.current ? 'current' : ''}" data-n="${n}" ${open ? '' : 'disabled'}><b>${n}</b><span>${open ? [1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">★</i>`).join('') : '🔒'}</span></button>`;
      }
      return `<div class="panel fn-zone"><h3>${z.icon} ${z.name}</h3><p class="muted">${z.text}</p><div class="fn-grid">${cells}</div></div>`;
    }).join('')}</div></div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelectorAll('[data-n]:not([disabled])').forEach(b => { b.onclick = () => nav.show(fornadaGame, Number(b.dataset.n)); });
  root.querySelector('.fn-lv.current')?.scrollIntoView({ block: 'center' });
}

// Livro de receitas: os doces feitos e os que faltam.
export function fornadaBook(root, nav) {
  const p = progress();
  root.innerHTML = `<div class="screen sub fn-sub">${head('Livro de receitas')}
    <div class="sub-scroll"><p class="muted center">${p.made.length} de ${SWEETS.length} receitas. Junta doces iguais para descobrir os seguintes.</p>
      <div class="fn-book">${SWEETS.map(s => {
        const has = p.made.includes(s.v);
        return `<div class="fn-recipe ${has ? '' : 'locked'}"><div class="fn-art" style="background:${s.bg}">${sweetSvg(s.v)}</div><b>${has ? s.name : '???'}</b><small>${s.v}</small>${has ? `<p>${s.note}</p>` : ''}</div>`;
      }).join('')}</div></div></div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
}

// Desafio diário com calendário e troféu do mês.
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEK_HINT = ['Segunda: bolo de arroz no 4×4', 'Terça: com uma pedra', 'Quarta: 5×5', 'Quinta: com fermento', 'Sexta: com fornos', 'Sábado: com congeladas', 'Domingo: tudo junto'];
export function fornadaDaily(root, nav, offset = 0) {
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
  root.innerHTML = `<div class="screen sub fn-sub">${head('Desafio diário', `<span class="coin-badge">${coinHtml(wallet.coins())}</span>`)}
    <div class="sub-scroll">
      <div class="panel">
        <div class="month-nav"><button class="icon-btn" data-act="prev" aria-label="Mês anterior">‹</button>
          <div><b>${MONTHS[m - 1]} ${y}</b><small>${doneCount}/${days} dias · troféu ao completar o mês</small></div>
          <button class="icon-btn" data-act="next" ${offset >= 0 ? 'disabled' : ''} aria-label="Mês seguinte">›</button></div>
        <div class="cal-head">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="calendar">${cells}</div>
        <div class="progress-bar"><i style="width:${(doneCount / days) * 100}%"></i></div>
      </div>
      ${offset === 0 ? `<button class="play-next" data-date="${t}">${d.done[t] ? 'Jogar outra vez o de hoje' : '▶ Jogar o desafio de hoje'}</button><p class="muted center">Hoje: ${WEEK_HINT[dow]}. O tabuleiro e as peças são iguais para toda a gente.</p>` : ''}
      <div class="panel"><h3>Troféus</h3><div class="trophies">${d.trophies.map(mo => `<span class="trophy">🥇<small>${MONTHS[Number(mo.slice(5)) - 1].slice(0, 3)} ${mo.slice(0, 4)}</small></span>`).join('') || '<p class="muted">Completa todos os dias de um mês para ganhar o troféu e 200 moedas.</p>'}</div></div>
    </div></div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelector('[data-act=prev]').onclick = () => nav.replace(fornadaDaily, offset - 1);
  root.querySelector('[data-act=next]').onclick = () => nav.replace(fornadaDaily, offset + 1);
  root.querySelectorAll('[data-date]:not([disabled])').forEach(b => { b.onclick = () => nav.show(fornadaGame, { date: b.dataset.date }); });
}
