// Ecrãs do Mahjong fora do jogo: mapa de níveis, desafio diário, evento e coleção.
import { getLevel, chapterOf, LEVELS_PER_CHAPTER, TOTAL_LEVELS } from './levels.js';
import { progress, saveProgress, dailyState, eventsState, CHESTS, chapterStars, loadSaved } from './progress.js';
import { game, starsHtml, shortDate } from './game.js';
import { tileSvg, STYLES } from './tiles.js';
import { rewardText } from '../../core/economy.js';
import { wallet, achievements, analytics, dailyReward } from './meta.js';
import { settings, setSetting } from '../../core/settings.js';
import { activeEvent, EVENT_LEVELS, eventParticles } from '../../core/events.js';
import { modal, toast, coinHtml } from '../../core/ui.js';
import { sfx } from '../../core/audio.js';
import { today } from '../../core/store.js';
import { achievementsScreen, statsScreen } from '../../screens/app-screens.js';

const coinBadge = () => `<span class="coin-badge" data-ref="coins">${coinHtml(wallet.coins())}</span>`;
function liveCoins(root) {
  return wallet.onChange(() => {
    const el = root.querySelector('[data-ref=coins]');
    if (el) el.innerHTML = coinHtml(wallet.coins());
  });
}

// ---------- Mapa de níveis ----------

export function mahjongHome(root, nav) {
  const p = progress();
  const lastChapter = Math.min(chapterOf(p.unlocked).index + 1, Math.ceil(TOTAL_LEVELS / LEVELS_PER_CHAPTER) - 1);
  const totalStars = Object.values(p.stars).reduce((a, b) => a + b, 0);
  const ev = activeEvent();
  const dailyDone = dailyState().done[today()];
  const resume = loadSaved({ kind: 'level', n: p.unlocked });

  let chapters = '';
  for (let c = 0; c <= lastChapter; c++) {
    const first = c * LEVELS_PER_CHAPTER + 1;
    const ch = chapterOf(first);
    const stars = chapterStars(p, c);
    const claimed = p.chests[c] || [];
    const chests = CHESTS.map((chest, i) => {
      const state = claimed[i] ? 'claimed' : stars >= chest.stars ? 'ready' : 'locked';
      return `<button class="chest ${state}" data-chest="${c}:${i}" ${state !== 'ready' ? 'disabled' : ''}
                title="${chest.stars} estrelas">${state === 'claimed' ? '✓' : '🎁'}<small>${chest.stars}★</small></button>`;
    }).join('');
    chapters += `
      <section class="chapter" style="--ch:${ch.color}">
        <div class="chapter-head">
          <span><small>Capítulo ${c + 1}</small>${ch.name}</span>
          <span class="chapter-side"><span class="chapter-stars">★ ${stars}/${LEVELS_PER_CHAPTER * 3}</span>${chests}</span>
        </div>
        <div class="level-grid">
          ${Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => {
            const n = first + i;
            const locked = n > p.unlocked;
            const cfg = getLevelTag(n);
            return `<button class="level-btn ${locked ? 'locked' : ''} ${n === p.unlocked ? 'current' : ''} ${cfg}"
                      data-level="${n}" ${locked ? 'disabled' : ''} aria-label="Nível ${n}">
                      <span class="level-num">${locked ? '🔒' : cfg === 'special' ? '👑' : n}</span>
                      ${locked ? '' : starsHtml(p.stars[n] || 0, 'small')}
                    </button>`;
          }).join('')}
        </div>
      </section>`;
  }

  root.innerHTML = `
    <div class="screen levels">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h2>Mahjong</h2>
        ${coinBadge()}
      </header>
      <div class="level-scroll">
        <button class="play-next">▶ ${resume ? 'Continuar' : 'Jogar'} nível ${p.unlocked}</button>
        <div class="mode-row">
          <button class="mode-card" data-act="daily">
            <span class="mode-icon">📅</span><b>Desafio diário</b>
            <small>${dailyDone ? '✓ Feito hoje' : 'Novo desafio!'}</small>
            ${dailyDone ? '' : '<i class="dot"></i>'}
          </button>
          ${ev ? `<button class="mode-card event" data-act="event" style="--ev:${ev.color}">
            <span class="mode-icon">${ev.icon}</span><b>${ev.name}</b><small>Faltam ${ev.daysLeft} dias</small></button>` : ''}
          <button class="mode-card" data-act="collection">
            <span class="mode-icon">🎨</span><b>Peças</b><small>Estilos</small>
          </button>
          <button class="mode-card" data-act="achievements">
            <span class="mode-icon">🏆</span><b>Conquistas</b><small>${achievements.list().filter(a => a.unlocked).length}/${achievements.list().length}</small>
          </button>
          <button class="mode-card" data-act="stats">
            <span class="mode-icon">📊</span><b>Números</b><small>Estatísticas</small>
          </button>
        </div>
        <p class="total-line">★ ${totalStars} estrelas · ${Object.keys(p.stars).length} de ${TOTAL_LEVELS} níveis</p>
        ${chapters}
        <p class="levels-foot">Novos capítulos abrem à medida que avanças · 🔥 difícil · 👑 especial</p>
      </div>
    </div>`;

  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelector('.play-next').onclick = () => nav.show(game, { kind: 'level', n: p.unlocked });
  root.querySelector('[data-act=daily]').onclick = () => nav.show(dailyScreen);
  root.querySelector('[data-act=collection]').onclick = () => nav.show(collectionScreen);
  root.querySelector('[data-act=achievements]').onclick = () => nav.show(achievementsScreen, MAHJONG_INFO);
  root.querySelector('[data-act=stats]').onclick = () => nav.show(statsScreen, MAHJONG_INFO);
  root.querySelector('[data-act=event]')?.addEventListener('click', () => nav.show(eventScreen));
  root.querySelectorAll('.level-btn:not(.locked)').forEach(btn => {
    btn.onclick = () => nav.show(game, { kind: 'level', n: Number(btn.dataset.level) });
  });
  root.querySelectorAll('.chest.ready').forEach(btn => {
    btn.onclick = () => {
      const [c, i] = btn.dataset.chest.split(':').map(Number);
      const prog = progress();
      (prog.chests[c] ??= [])[i] = true;
      saveProgress(prog);
      wallet.reward(CHESTS[i].prize);
      sfx('unlock');
      modal(`<div class="dialog-emoji">🎁</div><h3>Baú aberto!</h3><p>${rewardText(CHESTS[i].prize)}</p>`, [{ label: 'Boa!' }]);
      btn.className = 'chest claimed';
      btn.disabled = true;
      btn.firstChild.textContent = '✓';
      achievements.check();
    };
  });
  root.querySelector('.level-btn.current')?.scrollIntoView({ block: 'center' });
  // Ao entrar no Mahjong: conta a sessão, prémio diário do Mahjong e conquistas pendentes.
  analytics.session();
  setTimeout(async () => { await dailyReward.show(); achievements.check(); }, 350);
  return liveCoins(root);
}

const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const MAHJONG_INFO = {
  name: 'Mahjong', color: '#14532d', achievements, analytics, bestLabel: 'Recorde',
  best: n => (progress().best[n] != null ? fmtClock(progress().best[n]) : null),
  bestStreak: () => dailyReward.state().best || 0,
};

function getLevelTag(n) {
  if (n % LEVELS_PER_CHAPTER === 0) return 'special';
  if (n % 10 === 9) return 'hard';
  return '';
}

// ---------- Desafio diário ----------

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function dailyScreen(root, nav, monthOffset = 0) {
  const d = dailyState();
  const t = today();
  const [ty, tm] = t.split('-').map(Number);
  const view = new Date(ty, tm - 1 + monthOffset, 1);
  const y = view.getFullYear(), m = view.getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  const days = new Date(y, m, 0).getDate();
  const firstDow = (view.getDay() + 6) % 7;
  const doneCount = Object.keys(d.done).filter(k => k.startsWith(prefix)).length;

  let cells = '<span></span>'.repeat(firstDow);
  for (let day = 1; day <= days; day++) {
    const key = `${prefix}-${String(day).padStart(2, '0')}`;
    const stars = d.done[key];
    const future = key > t;
    cells += `<button class="day ${stars ? 'done' : ''} ${key === t ? 'today' : ''} ${future ? 'future' : ''}"
                data-date="${key}" ${future ? 'disabled' : ''}>
                <b>${day}</b>${stars ? starsHtml(stars, 'small') : ''}</button>`;
  }
  const trophies = d.trophies.map(mo => {
    const [yy, mm] = mo.split('-').map(Number);
    return `<span class="trophy">🥇<small>${MONTH_NAMES[mm - 1].slice(0, 3)} ${yy}</small></span>`;
  }).join('') || '<p class="muted">Completa todos os dias de um mês para ganhar o troféu.</p>';

  root.innerHTML = `
    <div class="screen sub">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h2>Desafio diário</h2>
        ${coinBadge()}
      </header>
      <div class="sub-scroll">
        <div class="panel">
          <div class="month-nav">
            <button class="icon-btn" data-act="prev" aria-label="Mês anterior">‹</button>
            <div><b>${MONTH_NAMES[m - 1]} ${y}</b><small>${doneCount}/${days} dias · troféu ao completar o mês</small></div>
            <button class="icon-btn" data-act="next" ${monthOffset >= 0 ? 'disabled' : ''} aria-label="Mês seguinte">›</button>
          </div>
          <div class="cal-head">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
          <div class="calendar">${cells}</div>
          <div class="progress-bar"><i style="width:${(doneCount / days) * 100}%"></i></div>
        </div>
        ${monthOffset === 0 ? `<button class="play-next" data-date="${t}">${d.done[t] ? 'Jogar outra vez o de hoje' : '▶ Jogar o desafio de hoje'}</button>` : ''}
        <p class="muted center">Segunda é o dia mais fácil, domingo o mais difícil. Dias que falharam podem ser feitos depois.</p>
        <div class="panel"><h3>Troféus</h3><div class="trophies">${trophies}</div></div>
      </div>
    </div>`;

  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelector('[data-act=prev]').onclick = () => nav.replace(dailyScreen, monthOffset - 1);
  root.querySelector('[data-act=next]').onclick = () => nav.replace(dailyScreen, monthOffset + 1);
  root.querySelectorAll('[data-date]:not([disabled])').forEach(b => {
    b.onclick = () => nav.show(game, { kind: 'daily', date: b.dataset.date });
  });
  return liveCoins(root);
}

// ---------- Evento sazonal ----------

export function eventScreen(root, nav) {
  const ev = activeEvent();
  if (!ev) { nav.back(); return; }
  const st = eventsState()[ev.season] || { done: 0 };
  const style = STYLES.find(s => s.id === ev.style);
  const sample = ['d1', 'b5', 'c9', 'r1'].map(f => `<div class="mini-tile">${tileSvg(f, ev.style)}</div>`).join('');

  root.innerHTML = `
    <div class="screen sub event-screen" style="--ch:${ev.color}">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h2>${ev.icon} ${ev.name}</h2>
        ${coinBadge()}
      </header>
      <div class="sub-scroll">
        <div class="panel event-hero">
          <p>Evento especial · faltam <b>${ev.daysLeft} dias</b></p>
          <div class="mini-tiles">${sample}</div>
          <p>Completa os ${EVENT_LEVELS} níveis para ficar para sempre com o estilo <b>${style.name}</b> e ganhar ${coinHtml(200)}.</p>
          <div class="progress-bar"><i style="width:${(st.done / EVENT_LEVELS) * 100}%"></i></div>
          <small>${st.done}/${EVENT_LEVELS} níveis</small>
        </div>
        <div class="event-path">
          ${Array.from({ length: EVENT_LEVELS }, (_, i) => `
            <button class="level-btn ${i < st.done ? 'done' : ''} ${i === st.done ? 'current' : ''} ${i > st.done ? 'locked' : ''}"
              data-i="${i}" ${i > st.done ? 'disabled' : ''}>
              <span class="level-num">${i > st.done ? '🔒' : i < st.done ? '✓' : i + 1}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
  eventParticles(root.querySelector('.screen'), ev);
  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelectorAll('.level-btn:not([disabled])').forEach(b => {
    b.onclick = () => nav.show(game, { kind: 'event', season: ev.season, i: Number(b.dataset.i) });
  });
  return liveCoins(root);
}

// ---------- Coleção de estilos ----------

export function collectionScreen(root, nav) {
  const ev = activeEvent();
  const render = () => {
    const current = settings().tileStyle;
    const cards = STYLES.map(s => {
      const own = wallet.owns(s.id);
      const eventOn = s.event && ev?.id === s.event;
      const usable = own || eventOn || (!s.event && s.price === 0);
      const sample = ['d5', 'b3', 'c7', 'w1', 'r2', 'f1'].map(f => `<div class="mini-tile">${tileSvg(f, s.id)}</div>`).join('');
      let action;
      if (current === s.id && usable) action = '<span class="chip-on">Em uso</span>';
      else if (usable) action = `<button class="btn primary small" data-use="${s.id}">Usar</button>`;
      else if (s.event) action = `<span class="muted small">Disponível no evento ${s.name}</span>`;
      else action = `<button class="btn small" data-buy="${s.id}">Desbloquear ${coinHtml(s.price)}</button>`;
      return `<div class="style-card ${usable ? '' : 'locked'}">
        <div class="style-head"><b>${s.name}</b>${s.desc ? `<small>${s.desc}</small>` : ''}${eventOn && !own ? '<small>Grátis durante o evento</small>' : ''}</div>
        <div class="mini-tiles">${sample}</div>
        <div class="style-action">${action}</div>
      </div>`;
    }).join('');
    root.innerHTML = `
      <div class="screen sub">
        <header class="topbar">
          <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
          <h2>Estilos de peças</h2>
          ${coinBadge()}
        </header>
        <div class="sub-scroll">${cards}</div>
      </div>`;
    root.querySelector('[data-act=back]').onclick = () => nav.back();
    root.querySelectorAll('[data-use]').forEach(b => {
      b.onclick = () => { setSetting('tileStyle', b.dataset.use); sfx('tap'); render(); };
    });
    root.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        const s = STYLES.find(x => x.id === b.dataset.buy);
        if (!wallet.unlock(s.id, s.price)) { toast(`Precisas de ${coinHtml(s.price)}. Ganha moedas a jogar!`); return; }
        sfx('unlock');
        setSetting('tileStyle', s.id);
        achievements.check();
        render();
      };
    });
  };
  render();
  return liveCoins(root);
}
