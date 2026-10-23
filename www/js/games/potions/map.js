// Mapa de níveis do Poções da Lúmen: caminho por capítulos, estrelas, baús e portões.
// Depois de cada vitória mostra a viagem: estrelas a voar, baús, personagem a saltar, portão.
import { chapterOf, LEVELS_PER_CHAPTER, STARS_PER_CHAPTER, TOTAL_LEVELS } from './levels.js';
import { progress, saveProgress, totalStars, chapterIndex, chapterOpen, isPlayable, hasChest, chestPrize, loadSaved, dailyState } from './progress.js';
import { potionGame, takeCelebration, lumenSays, shortDate } from './game.js';
import { wallet, achievements, analytics, dailyReward } from './meta.js';
import { COLORS, FLASK_STYLES } from './look.js';
import { rewardText } from '../../core/economy.js';
import { settings, setSetting } from '../../core/settings.js';
import { sfx } from '../../core/audio.js';
import { vibrate } from '../../core/native.js';
import { toast, coinHtml } from '../../core/ui.js';
import { today } from '../../core/store.js';
import { achievementsScreen, statsScreen } from '../../screens/app-screens.js';

const STEP = 84, GATE_GAP = 170, PAD = 100;
const wait = ms => new Promise(r => setTimeout(r, ms));

const POTIONS_INFO = {
  name: 'Poções da Lúmen', color: '#2e1065', achievements, analytics, bestLabel: 'Menos jogadas',
  best: n => progress().best[n] ?? null,
  bestStreak: () => dailyReward.state().best || 0,
};

export function potionsHome(root, nav) {
  let p = progress();
  let extraBack = 0; // capítulos anteriores a mostrar além dos últimos
  let W = 0, H = 0, pos = {}, first = 1, last = 1, firstChapter = 0, lastChapter = 0;

  root.innerHTML = `
    <div class="screen pt-map-screen">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h2>Poções da Lúmen</h2>
        <span class="coin-badge" data-ref="coins">${coinHtml(wallet.coins())}</span>
      </header>
      <div class="pt-map-bar">
        <span class="pill stars" data-ref="stars">★ 0</span>
        <button class="pill" data-act="play">▶ Nível <b data-ref="current"></b></button>
        <span class="spacer"></span>
        <button class="pill daily-pill" data-act="daily" aria-label="Desafio diário">📅${dailyState().done[today()] ? '' : '<i class="dot"></i>'}</button>
        <button class="pill" data-act="flasks" aria-label="Frascos">⚗️</button>
        <button class="pill" data-act="achievements" aria-label="Conquistas">🏆</button>
        <button class="pill" data-act="stats" aria-label="Estatísticas">📊</button>
      </div>
      <div class="pt-map"><div class="pt-map-inner"></div></div>
    </div>`;
  const $ = s => root.querySelector(s);
  const mapEl = $('.pt-map'), inner = $('.pt-map-inner');

  const gateBlocked = () => p.current <= TOTAL_LEVELS && !chapterOpen(p, chapterIndex(p.current));
  const avatarLevel = () => Math.min(TOTAL_LEVELS, gateBlocked() ? p.current - 1 : p.current);

  // ---------- Geometria ----------

  function layout() {
    const curCh = chapterIndex(Math.min(p.current, TOTAL_LEVELS));
    firstChapter = Math.max(0, curCh - 2 - extraBack);
    lastChapter = Math.min(Math.ceil(TOTAL_LEVELS / LEVELS_PER_CHAPTER) - 1, curCh + 1);
    first = firstChapter * LEVELS_PER_CHAPTER + 1;
    last = (lastChapter + 1) * LEVELS_PER_CHAPTER;
    W = inner.clientWidth || 360;
    const count = last - first + 1, chapters = lastChapter - firstChapter + 1;
    H = PAD * 2 + (count - 1) * STEP + (chapters - 1) * GATE_GAP + (firstChapter > 0 ? 60 : 0);
    pos = {};
    for (let n = first; n <= last; n++) {
      const i = n - first, c = chapterIndex(n) - firstChapter;
      pos[n] = { x: W / 2 + Math.sin(n * 0.78) * Math.min(W * 0.3, 150), y: H - PAD - i * STEP - c * GATE_GAP };
    }
  }
  const gateY = c => (pos[c * LEVELS_PER_CHAPTER].y + pos[c * LEVELS_PER_CHAPTER + 1].y) / 2;

  function pathD(from, to) {
    let d = `M ${pos[from].x} ${pos[from].y}`;
    for (let n = from + 1; n <= to; n++) {
      const a = pos[n - 1], b = pos[n], my = (a.y + b.y) / 2;
      d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
    }
    return d;
  }

  // ---------- Desenho ----------

  function render() {
    p = progress();
    layout();
    inner.style.height = `${H}px`;
    let html = '';
    for (let c = firstChapter; c <= lastChapter; c++) {
      const ch = chapterOf(c * LEVELS_PER_CHAPTER + 1);
      const yTop = c === lastChapter ? 0 : gateY(c + 1);
      const yBot = c === firstChapter ? H : gateY(c);
      let deco = '';
      for (let k = 0; k < 9; k++) {
        const y = ((k * 97 + c * 31) % Math.max(1, yBot - yTop - 40)) + 20;
        const left = k % 2 ? 3 + ((k * 13) % 12) : 84 + ((k * 7) % 10);
        deco += `<span class="deco" style="top:${y}px;left:${left}%">${ch.deco[k % ch.deco.length]}</span>`;
      }
      html += `<div class="band" style="top:${yTop}px;height:${yBot - yTop}px;background:radial-gradient(ellipse at 50% 60%, ${ch.glow}55, transparent 70%), linear-gradient(180deg, ${ch.color}, #0f0a1c)">
        ${deco}<span class="band-name">${c + 1}. ${ch.name}</span></div>`;
    }
    const doneTo = Math.max(first + 1, Math.min(avatarLevel(), last));
    html += `<svg class="path" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path d="${pathD(first, last)}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="7" stroke-dasharray="2 14" stroke-linecap="round"/>
      <path d="${pathD(first, doneTo)}" fill="none" stroke="#e8b04a" stroke-width="6" stroke-linecap="round" opacity=".75"/>
    </svg>`;
    for (let n = first; n < last; n++) {
      if (!hasChest(n)) continue;
      const a = pos[n], b = pos[n + 1], open = p.chests[n];
      html += `<span class="chest ${open ? 'open' : ''}" data-chest="${n}" style="left:${(a.x + b.x) / 2 + 28}px;top:${(a.y + b.y) / 2}px">${open ? '📦' : '🎁'}</span>`;
    }
    for (let n = first; n <= last; n++) {
      const s = p.stars[n] || 0;
      const playable = isPlayable(p, n);
      const cls = !playable ? 'locked' : n === p.current ? 'current' : 'done';
      const special = n % LEVELS_PER_CHAPTER === 0, hard = n % 10 === 9;
      html += `<button class="node ${cls} ${special ? 'special' : ''} ${hard ? 'hard' : ''}" data-n="${n}" style="left:${pos[n].x}px;top:${pos[n].y}px"
          aria-label="Nível ${n}${s ? `, ${s} estrelas` : ''}">
        ${special && playable ? '👑' : n}
        ${s ? `<span class="nst">${[1, 2, 3].map(i => `<i class="${i <= s ? 'on' : ''}">★</i>`).join('')}</span>` : ''}
      </button>`;
    }
    for (let c = firstChapter + 1; c <= lastChapter; c++) {
      const need = c * STARS_PER_CHAPTER, have = totalStars(p), open = chapterOpen(p, c) && p.gates.includes(c);
      const ch = chapterOf(c * LEVELS_PER_CHAPTER + 1);
      html += `<div class="gate ${open ? 'open' : ''}" data-gate="${c}" style="top:${gateY(c) - 52}px">
        <span class="lock">${open ? '🔓' : '🔒'}</span>
        <b>Capítulo ${c + 1} · ${ch.name}</b>
        <small>${open ? 'Aberto' : `★ ${Math.min(have, need)} / ${need} · acaba o nível ${c * LEVELS_PER_CHAPTER}`}</small>
        ${open ? '' : `<span class="bar"><i style="width:${Math.min(100, (have / need) * 100)}%"></i></span>`}
      </div>`;
    }
    if (firstChapter > 0) html += `<button class="btn more" style="top:${H - 50}px" data-act="more">Ver capítulos anteriores</button>`;
    const at = avatarLevel();
    if (pos[at]) html += `<span class="avatar" style="left:${pos[at].x}px;top:${pos[at].y}px">🧙</span>`;
    inner.innerHTML = html;

    $('[data-ref=stars]').textContent = `★ ${totalStars(p)}`;
    $('[data-ref=current]').textContent = Math.min(avatarLevel(), TOTAL_LEVELS);
    $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
  }

  const scrollTo = (y, smooth = true) => mapEl.scrollTo({ top: y - mapEl.clientHeight / 2, behavior: smooth ? 'smooth' : 'auto' });

  // ---------- Toques ----------

  function closePops() { inner.querySelectorAll('.pop').forEach(el => el.remove()); }

  function showPop(n) {
    closePops();
    const s = p.stars[n] || 0;
    const pop = document.createElement('div');
    pop.className = 'pop';
    pop.style.left = `${Math.max(115, Math.min(W - 115, pos[n].x))}px`;
    pop.style.top = pos[n].y < 220 ? `${pos[n].y + 46}px` : `${pos[n].y - 176}px`;
    if (!isPlayable(p, n)) {
      const c = chapterIndex(n);
      pop.innerHTML = `<b>Nível ${n}</b><small>${!chapterOpen(p, c) && p.current > c * LEVELS_PER_CHAPTER
        ? `Precisas de ${c * STARS_PER_CHAPTER} ★ para abrir este capítulo. Repete níveis para ganhar mais estrelas.`
        : `Acaba o nível ${Math.min(p.current, TOTAL_LEVELS)} primeiro.`}</small>`;
    } else {
      const saved = loadSaved(n);
      pop.innerHTML = `<b>Nível ${n}</b><span class="big">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>
        <small>${p.best[n] != null ? `Melhor: ${p.best[n]} jogadas` : n === p.current ? 'Próximo nível' : ''}</small>
        <button class="btn primary">${saved ? 'Continuar' : 'Jogar'}</button>`;
      pop.querySelector('button').onclick = e => { e.stopPropagation(); nav.show(potionGame, n); };
    }
    pop.addEventListener('click', e => e.stopPropagation());
    inner.appendChild(pop);
  }

  inner.addEventListener('click', e => {
    const node = e.target.closest('.node');
    if (node) { e.stopPropagation(); sfx('tap'); showPop(Number(node.dataset.n)); return; }
    if (e.target.closest('[data-act=more]')) { extraBack += 3; render(); return; }
    const gate = e.target.closest('.gate:not(.open)');
    if (gate) { explainGate(Number(gate.dataset.gate)); return; }
    closePops();
  });

  function explainGate(c) {
    const need = c * STARS_PER_CHAPTER, have = totalStars(p);
    if (p.current <= c * LEVELS_PER_CHAPTER) toast(`Acaba o nível ${c * LEVELS_PER_CHAPTER} e junta ${need} ★ para abrir.`);
    else toast(`Faltam ${need - have} ★. Repete níveis com menos de 3 estrelas.`);
  }

  // ---------- Transições depois de uma vitória ----------

  async function celebrate({ n, stars, prev, advancing }) {
    if (!pos[n]) return;
    scrollTo(pos[n].y, false);
    await wait(350);
    const node = inner.querySelector(`.node[data-n="${n}"]`);
    // Mostra o nível como estava antes e faz as estrelas voar até ele.
    if (node) {
      node.querySelector('.nst')?.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i < prev));
      const nr = node.getBoundingClientRect();
      for (let i = 0; i < stars; i++) {
        const f = document.createElement('span');
        f.className = 'fly';
        f.textContent = '★';
        f.style.left = `${innerWidth / 2 - 15}px`;
        f.style.top = `${mapEl.getBoundingClientRect().top + 10}px`;
        f.style.transform = 'scale(2)';
        document.body.appendChild(f);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          f.style.left = `${nr.left + nr.width / 2 - 22 + i * 15}px`;
          f.style.top = `${nr.top + 34}px`;
          f.style.transform = 'scale(.5)';
        }));
        setTimeout(() => f.remove(), 760);
        sfx('star', i);
        await wait(240);
      }
      await wait(420);
      node.querySelectorAll('.nst i').forEach((el, i) => { el.classList.toggle('on', i < Math.max(prev, stars)); if (i >= prev && i < stars) el.classList.add('just-won'); });
    }
    // Baú no caminho
    if (advancing && hasChest(n) && !p.chests[n]) {
      await wait(300);
      const chest = inner.querySelector(`.chest[data-chest="${n}"]`);
      chest?.classList.add('wiggle');
      sfx('coin'); vibrate('light');
      await wait(900);
      const prize = chestPrize(n);
      p = progress(); p.chests[n] = true; saveProgress(p);
      wallet.reward(prize);
      if (chest) { chest.textContent = '📦'; chest.classList.add('open'); floatAt(parseFloat(chest.style.left), parseFloat(chest.style.top), rewardText(prize)); }
      $('[data-ref=coins]').innerHTML = coinHtml(wallet.coins());
    }
    // Portões: no fim do capítulo, ou um portão que estava à espera de estrelas.
    for (let c = 1; c <= lastChapter; c++) {
      if (p.gates.includes(c) || p.current <= c * LEVELS_PER_CHAPTER) continue;
      if (n === c * LEVELS_PER_CHAPTER || chapterOpen(p, c)) { await wait(350); await tryGate(c); return; }
    }
    if (advancing && pos[n + 1] && isPlayable(p, n + 1)) await hop(n, n + 1);
  }

  async function tryGate(c) {
    scrollTo(gateY(c));
    await wait(500);
    const gate = inner.querySelector(`.gate[data-gate="${c}"]`);
    if (chapterOpen(p, c)) {
      p = progress();
      if (!p.gates.includes(c)) { p.gates.push(c); saveProgress(p); }
      sfx('gate'); vibrate('heavy');
      render();
      inner.querySelector(`.gate[data-gate="${c}"]`)?.classList.add('opening');
      sparkleAt(W / 2, gateY(c) - 30);
      achievements.check();
      await wait(700);
      await hop(c * LEVELS_PER_CHAPTER, c * LEVELS_PER_CHAPTER + 1);
      const ch = chapterOf(c * LEVELS_PER_CHAPTER + 1);
      await lumenSays(`Capítulo ${c + 1} · ${ch.name}`, ch.line);
    } else {
      sfx('denied'); vibrate('medium');
      gate?.classList.add('shake');
      setTimeout(() => gate?.classList.remove('shake'), 500);
      floatAt(W / 2 - 60, gateY(c) - 70, `Faltam ${c * STARS_PER_CHAPTER - totalStars(p)} ★`);
      await wait(600);
      inner.querySelectorAll('.node.done').forEach(el => {
        if ((p.stars[el.dataset.n] || 0) < 3) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 600, iterations: 2 });
      });
    }
  }

  async function hop(from, to) {
    const av = inner.querySelector('.avatar');
    if (!av || !pos[from] || !pos[to]) return;
    scrollTo(pos[to].y);
    const a = pos[from], b = pos[to], t0 = performance.now(), dur = 650;
    sfx('hop');
    await new Promise(res => {
      (function frame(t) {
        const k = Math.min(1, (t - t0) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        av.style.left = `${a.x + (b.x - a.x) * e}px`;
        av.style.top = `${a.y + (b.y - a.y) * e - Math.sin(Math.PI * k) * 40}px`;
        if (k < 1) requestAnimationFrame(frame); else res();
      })(t0);
    });
    const b2 = document.createElement('span');
    b2.className = 'burst';
    b2.style.left = `${b.x}px`;
    b2.style.top = `${b.y}px`;
    inner.appendChild(b2);
    setTimeout(() => b2.remove(), 650);
  }

  function floatAt(x, y, html) {
    const f = document.createElement('span');
    f.className = 'coinfloat';
    f.innerHTML = html;
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    inner.appendChild(f);
    setTimeout(() => f.remove(), 1500);
  }

  function sparkleAt(x, y, count = 22) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const ang = (Math.PI * 2 * i) / count, d = 30 + Math.random() * 40;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty('--dx', `${Math.cos(ang) * d}px`);
      s.style.setProperty('--dy', `${Math.sin(ang) * d}px`);
      inner.appendChild(s);
      setTimeout(() => s.remove(), 720);
    }
  }

  // ---------- Botões e arranque ----------

  $('[data-act=back]').onclick = () => nav.back();
  $('[data-act=play]').onclick = () => {
    const n = avatarLevel();
    if (isPlayable(p, n)) nav.show(potionGame, n);
  };
  $('[data-act=flasks]').onclick = () => nav.show(flaskCollection);
  $('[data-act=daily]').onclick = () => nav.show(dailyCalendar);
  $('[data-act=achievements]').onclick = () => nav.show(achievementsScreen, POTIONS_INFO);
  $('[data-act=stats]').onclick = () => nav.show(statsScreen, POTIONS_INFO);

  render();
  const celebration = takeCelebration();
  if (celebration) {
    // Desenha o mapa como estava antes da vitória e anima a mudança.
    celebrate(celebration).then(() => { render(); });
    if (celebration.advancing && pos[celebration.n]) {
      const av = inner.querySelector('.avatar');
      if (av) { av.style.left = `${pos[celebration.n].x}px`; av.style.top = `${pos[celebration.n].y}px`; }
    }
  } else {
    scrollTo(pos[avatarLevel()]?.y ?? 0, false);
    analytics.session();
    setTimeout(async () => {
      if (p.current === 1 && !Object.keys(p.stars).length) {
        await lumenSays('Olá! Eu sou a Lúmen 🐈‍⬛', 'Sou a gata alquimista desta botica. Ajuda-me a arrumar as poções: cada frasco tem de ficar com uma só cor. Toca no nível que está a brilhar para começar!');
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
  return () => { ro.disconnect(); off(); };
}

// ---------- Coleção de frascos ----------

export function flaskCollection(root, nav) {
  const render = () => {
    const current = wallet.owns(settings().flaskStyle) ? settings().flaskStyle : 'tube';
    const sample = [[0, 5, 3, 3], [1, 1, 6, 4], [7, 2, 2]];
    root.innerHTML = `
      <div class="screen sub pt-collection">
        <header class="topbar">
          <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
          <h2>Frascos</h2>
          <span class="coin-badge">${coinHtml(wallet.coins())}</span>
        </header>
        <div class="sub-scroll">
          ${FLASK_STYLES.map(s => {
            const own = wallet.owns(s.id);
            const action = current === s.id ? '<span class="chip-on">Em uso</span>'
              : own ? `<button class="btn primary small" data-use="${s.id}">Usar</button>`
              : `<button class="btn small" data-buy="${s.id}">Desbloquear ${coinHtml(s.price)}</button>`;
            return `<div class="style-card ${own ? '' : 'locked'}">
              <div class="style-head"><b>${s.name}</b><small>${s.desc}</small></div>
              <div class="pt-stage pt-preview" style="--fw:44px;--lh:29px;--gh:${29 * 4 + 20}px;font-size:13px">
                ${sample.map(t => `<span class="pt-flask style-${s.id}" style="--done:transparent"><span class="lip"></span><span class="glass"><span class="liquid">${t.map(c => `<div class="layer" style="--c:${COLORS[c].hex}"></div>`).join('')}</span></span></span>`).join('')}
              </div>
              <div class="style-action">${action}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    root.querySelector('[data-act=back]').onclick = () => nav.back();
    root.querySelectorAll('[data-use]').forEach(b => { b.onclick = () => { setSetting('flaskStyle', b.dataset.use); sfx('pick'); render(); }; });
    root.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        const s = FLASK_STYLES.find(x => x.id === b.dataset.buy);
        if (!wallet.unlock(s.id, s.price)) { toast(`Precisas de ${coinHtml(s.price)}. Ganha moedas a jogar!`); return; }
        sfx('unlock');
        setSetting('flaskStyle', s.id);
        achievements.check();
        render();
      };
    });
  };
  render();
}

// ---------- Desafio diário ----------

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEK_HINT = ['Segunda: calma', 'Terça: mistério ❓', 'Quarta: cadeado 🔒', 'Quinta: gelo ❄️', 'Sexta: rótulo 🏷️', 'Sábado: frascos grandes ⚗️', 'Domingo: tudo junto 🔥'];

export function dailyCalendar(root, nav, monthOffset = 0) {
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
    cells += `<button class="day ${stars ? 'done' : ''} ${key === t ? 'today' : ''} ${future ? 'future' : ''} ${loadSaved({ date: key }) ? 'saved' : ''}"
                data-date="${key}" ${future ? 'disabled' : ''} aria-label="${day}${stars ? `, ${stars} estrelas` : ''}">
                <b>${day}</b>${stars ? `<span class="stars small">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</span>` : ''}</button>`;
  }
  const trophies = d.trophies.map(mo => {
    const [yy, mm] = mo.split('-').map(Number);
    return `<span class="trophy">🥇<small>${MONTH_NAMES[mm - 1].slice(0, 3)} ${yy}</small></span>`;
  }).join('') || '<p class="muted">Completa todos os dias de um mês para ganhar o troféu e 200 moedas.</p>';
  const dow = (new Date(ty, tm - 1, Number(t.slice(8))).getDay() + 6) % 7;

  root.innerHTML = `
    <div class="screen sub pt-collection">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
        <h2>Desafio diário</h2>
        <span class="coin-badge" data-ref="coins">${coinHtml(wallet.coins())}</span>
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
        ${monthOffset === 0 ? `<button class="play-next" data-date="${t}">${d.done[t] ? 'Jogar outra vez o de hoje' : `▶ Jogar o desafio de hoje`}</button>
          <p class="muted center">Hoje: ${WEEK_HINT[dow]} · ${coinHtml('40 + 10 por estrela')}</p>` : ''}
        <p class="muted center">Cada dia tem uma poção diferente. Os dias que falharam podem ser feitos depois.</p>
        <div class="panel"><h3>Troféus</h3><div class="trophies">${trophies}</div></div>
      </div>
    </div>`;

  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelector('[data-act=prev]').onclick = () => nav.replace(dailyCalendar, monthOffset - 1);
  root.querySelector('[data-act=next]').onclick = () => nav.replace(dailyCalendar, monthOffset + 1);
  root.querySelectorAll('[data-date]:not([disabled])').forEach(b => {
    b.onclick = () => { sfx('tap'); nav.show(potionGame, { date: b.dataset.date }); };
  });
}
