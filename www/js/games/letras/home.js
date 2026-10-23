// Menu da Letras Soltas: níveis com tema, grelhas livres, ronda bónus e desafio diário.
import { THEMED_LEVELS, FREE_LEVELS, BONUS_EVERY, themedLevel, themedSize, freeSize } from './levels.js';
import { THEMES } from './themes.js';
import { progress, totalStars, loadSaved, dailyState } from './progress.js';
import { letrasGame, takeCelebration } from './game.js';
import { wallet, dailyReward, achievements, analytics } from './meta.js';
import { achievementsScreen, statsScreen } from '../../screens/app-screens.js';
import { coinHtml, toast } from '../../core/ui.js';
import { sfx } from '../../core/audio.js';
import { today, hashString } from '../../core/store.js';

const INFO = {
  name: 'Letras Soltas', color: '#6a4fd8', achievements, analytics, bestLabel: 'Estrelas',
  best: n => (progress().stars[n] ? '★'.repeat(progress().stars[n]) : null),
  bestStreak: () => dailyReward.state().best || 0,
};
let tab = 'tema';
// Ronda bónus: uma por cada 5 níveis com tema ganhos, mais uma por dia.
export const bonusAvailable = p => Math.floor(Object.keys(p.stars).length / BONUS_EVERY) > p.bonusPlayed || p.bonusDay !== today();

export function letrasHome(root, nav) {
  const p = progress();
  const stars = (st, cls = '') => `<span class="ls-st ${cls}">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">★</i>`).join('')}</span>`;
  root.innerHTML = `
    <div class="screen ls-home">
      <div class="ls-sparkles"></div>
      <header class="ls-top">
        <button class="ls-back" data-act="back" aria-label="Voltar">‹</button>
        <div class="ls-title"><b>Letras Soltas</b><small>★ ${totalStars(p)} · ${p.wordsFound} palavras encontradas</small></div>
        <span class="ls-coins" data-ref="coins">${coinHtml(wallet.coins())}</span>
      </header>
      <div class="ls-tabs" role="tablist"><button data-tab="tema" class="${tab === 'tema' ? 'on' : ''}">🏷️ Com tema</button><button data-tab="livre" class="${tab === 'livre' ? 'on' : ''}">🔤 Palavras livres</button></div>
      <div class="ls-list" data-ref="list"></div>
      <footer class="ls-homebar">
        <button class="ls-pill" data-act="bonus">⏱️ Bónus${bonusAvailable(p) ? '<i class="dot"></i>' : ''}</button>
        <button class="ls-pill" data-act="daily">📅 Diário${dailyState().done[today()] ? '' : '<i class="dot"></i>'}</button>
        <button class="ls-pill" data-act="achievements" aria-label="Conquistas">🏆</button>
        <button class="ls-pill" data-act="stats" aria-label="Estatísticas">📊</button>
      </footer>
    </div>`;
  const $ = s => root.querySelector(s);
  const list = $('[data-ref=list]');

  function render() {
    const q = progress();
    if (tab === 'tema') {
      const cur = Math.min(q.tema, THEMED_LEVELS), from = Math.max(1, cur - 12), to = Math.min(THEMED_LEVELS, cur + 12);
      let h = from > 1 ? `<p class="ls-more">… ${from - 1} níveis acabados</p>` : '';
      for (let n = from; n <= to; n++) {
        const open = n <= q.tema, st = q.stars[n] || 0, t = THEMES[(n - 1) % THEMES.length], [W, H] = themedSize(n);
        // O tema real do nível (pode trocar se não couber na grelha); para os bloqueados mostra-se o previsto
        const lv = open ? themedLevel(n) : null;
        h += `<button class="ls-card ${open ? '' : 'locked'} ${n === cur && !st ? 'cur' : ''}" data-n="${n}" ${open ? '' : 'disabled'}>
          <span class="ls-em">${open ? lv.icon : '🔒'}</span><span class="ls-ct"><b>${n}. ${open ? lv.theme : t.name}</b><small>${open ? `${lv.words.length} palavras · ` : ''}grelha ${W}×${H}${open && loadSaved({ kind: 'tema', n }) ? ' · a meio' : ''}</small></span>${stars(st)}</button>`;
        if (n % BONUS_EVERY === 0 && n < to) h += `<div class="ls-bonusmark ${q.stars[n] ? 'on' : ''}">⏱️ ronda bónus</div>`;
      }
      list.innerHTML = h;
    } else {
      const cur = Math.min(q.free, FREE_LEVELS), from = Math.max(1, cur - 12), to = Math.min(FREE_LEVELS, cur + 12);
      let h = '';
      for (let n = from; n <= to; n++) {
        const open = n <= q.free, st = q.freeStars[n] || 0, [W, H] = freeSize(n);
        h += `<button class="ls-card ${open ? '' : 'locked'} ${n === cur && !st ? 'cur' : ''}" data-f="${n}" ${open ? '' : 'disabled'}>
          <span class="ls-em">${open ? '🔤' : '🔒'}</span><span class="ls-ct"><b>Livre ${n}</b><small>grelha ${W}×${H} · sem tema${open && loadSaved({ kind: 'livre', n }) ? ' · a meio' : ''}</small></span>${stars(st)}</button>`;
      }
      list.innerHTML = h;
    }
    const cur = list.querySelector('.ls-card.cur') || list.querySelector('.ls-card:not(.locked):last-of-type');
    cur?.scrollIntoView({ block: 'center' });
  }
  list.addEventListener('click', e => {
    const b = e.target.closest('.ls-card:not([disabled])'); if (!b) return;
    sfx('tap');
    nav.show(letrasGame, b.dataset.f ? { kind: 'livre', n: Number(b.dataset.f) } : { kind: 'tema', n: Number(b.dataset.n) });
  });
  root.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { tab = b.dataset.tab; root.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); render(); }; });
  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=bonus]').onclick = () => {
    const q = progress();
    if (!bonusAvailable(q)) { toast(`A próxima ronda bónus abre amanhã ou depois de mais ${BONUS_EVERY - (Object.keys(q.stars).length % BONUS_EVERY)} níveis com tema.`); return; }
    const daily = q.bonusDay !== today() && !(Math.floor(Object.keys(q.stars).length / BONUS_EVERY) > q.bonusPlayed);
    nav.show(letrasGame, { kind: 'bonus', seed: (hashString(`bonus:${today()}:${q.bonusPlayed}`) >>> 0) || 1, daily });
  };
  $('[data-act=daily]').onclick = () => nav.show(letrasDaily);
  $('[data-act=achievements]').onclick = () => nav.show(achievementsScreen, INFO);
  $('[data-act=stats]').onclick = () => nav.show(statsScreen, INFO);
  render();
  const cel = takeCelebration();
  if (cel && cel.kind === 'tema' && cel.prev === 0 && cel.n % BONUS_EVERY === 0) setTimeout(() => toast('⏱️ Ronda bónus desbloqueada!', 2200), 300);
  if (!cel) setTimeout(async () => { analytics.session(); await dailyReward.show(); achievements.check(); const el = $('[data-ref=coins]'); if (el) el.innerHTML = coinHtml(wallet.coins()); }, 350);
  const off = wallet.onChange(() => { const el = $('[data-ref=coins]'); if (el) el.innerHTML = coinHtml(wallet.coins()); });
  return () => off();
}

// ---------- Desafio diário ----------
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export function letrasDaily(root, nav, offset = 0) {
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
  root.innerHTML = `<div class="screen sub ls-sub"><header class="topbar"><button class="icon-btn" data-act="back" aria-label="Voltar">‹</button><h2>Desafio diário</h2><span class="coin-badge">${coinHtml(wallet.coins())}</span></header>
    <div class="sub-scroll">
      <div class="panel">
        <div class="month-nav"><button class="icon-btn" data-act="prev" aria-label="Mês anterior">‹</button>
          <div><b>${MONTHS[m - 1]} ${y}</b><small>${doneCount}/${days} dias · troféu ao completar o mês</small></div>
          <button class="icon-btn" data-act="next" ${offset >= 0 ? 'disabled' : ''} aria-label="Mês seguinte">›</button></div>
        <div class="cal-head">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="calendar">${cells}</div>
        <div class="progress-bar"><i style="width:${(doneCount / days) * 100}%"></i></div>
      </div>
      ${offset === 0 ? `<button class="play-next" data-date="${t}">${d.done[t] ? 'Jogar outra vez o de hoje' : '▶ Jogar o tema de hoje'}</button><p class="muted center">Um tema e uma grelha 5×5, iguais para toda a gente hoje.</p>` : ''}
      <div class="panel"><h3>Troféus</h3><div class="trophies">${d.trophies.map(mo => `<span class="trophy">🥇<small>${MONTHS[Number(mo.slice(5)) - 1].slice(0, 3)} ${mo.slice(0, 4)}</small></span>`).join('') || '<p class="muted">Completa todos os dias de um mês para ganhar o troféu e 200 moedas.</p>'}</div></div>
    </div></div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelector('[data-act=prev]').onclick = () => nav.replace(letrasDaily, offset - 1);
  root.querySelector('[data-act=next]').onclick = () => nav.replace(letrasDaily, offset + 1);
  root.querySelectorAll('[data-date]:not([disabled])').forEach(b => { b.onclick = () => nav.show(letrasGame, { date: b.dataset.date }); });
}
