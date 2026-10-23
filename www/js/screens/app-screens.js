// Ecrãs gerais: opções da app, e conquistas e estatísticas de cada jogo.
// As conquistas e estatísticas recebem o jogo, porque cada jogo tem as suas.
import { settings, setSetting } from '../core/settings.js';
import { scheduleReminders } from '../core/native.js';
import { rewardText } from '../core/economy.js';
import { clearAll } from '../core/store.js';
import { sfx } from '../core/audio.js';

const header = title => `
  <header class="topbar">
    <button class="icon-btn" data-act="back" aria-label="Voltar">‹</button>
    <h2>${title}</h2>
    <span class="spacer"></span>
  </header>`;

const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtDuration = s => (s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`);

// ---------- Opções ----------

const TOGGLES = [
  { key: 'sound', label: 'Sons', desc: 'Toques, pares e vitórias' },
  { key: 'music', label: 'Música', desc: 'Música calma de fundo' },
  { key: 'vibration', label: 'Vibração', desc: 'Vibra ao jogar' },
  { key: 'highlightFree', label: 'Mahjong: destacar peças livres', desc: 'Escurece as peças que ainda não podem sair' },
  { key: 'colorSymbols', label: 'Poções: símbolos nas cores', desc: 'Mostra um símbolo em cada cor, para quem não distingue cores' },
  { key: 'reminders', label: 'Lembrete diário', desc: 'Uma notificação às 19h para jogar' },
];

export function settingsScreen(root, nav) {
  const s = settings();
  root.innerHTML = `
    <div class="screen sub">
      ${header('Opções')}
      <div class="sub-scroll">
        <div class="panel list">
          ${TOGGLES.map(t => `
            <label class="toggle-row" for="opt-${t.key}">
              <span><b>${t.label}</b><small>${t.desc}</small></span>
              <input type="checkbox" id="opt-${t.key}" data-key="${t.key}" ${s[t.key] ? 'checked' : ''}>
              <i class="switch"></i>
            </label>`).join('')}
        </div>
        <div class="panel about">
          <h3>Sobre</h3>
          <p><b>Mini Jogos</b> é gratuito e open source.</p>
          <p>Sem anúncios, sem compras e sem recolha de dados. O teu progresso fica guardado só neste telemóvel.</p>
        </div>
        <div class="panel danger">
          <h3>Apagar progresso</h3>
          <p>Apaga níveis, estrelas, moedas e conquistas de todos os jogos deste telemóvel. Não dá para desfazer.</p>
          <button class="btn danger-btn" data-act="reset">Apagar tudo</button>
        </div>
      </div>
    </div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
  root.querySelectorAll('input[data-key]').forEach(input => {
    input.onchange = () => {
      setSetting(input.dataset.key, input.checked);
      sfx('tap');
      if (input.dataset.key === 'reminders') scheduleReminders({ doneToday: false });
    };
  });
  const reset = root.querySelector('[data-act=reset]');
  let armed = false;
  reset.onclick = () => {
    if (!armed) {
      armed = true;
      reset.textContent = 'Toca outra vez para confirmar';
      setTimeout(() => { armed = false; reset.textContent = 'Apagar tudo'; }, 4000);
      return;
    }
    clearAll();
    location.reload();
  };
}

// ---------- Conquistas ----------

export function achievementsScreen(root, nav, game) {
  const list = game.achievements.list();
  const done = list.filter(a => a.unlocked).length;
  root.innerHTML = `
    <div class="screen sub" style="--ch:${game.color}">
      ${header(`Conquistas · ${game.name}`)}
      <div class="sub-scroll">
        <p class="total-line">${done} de ${list.length} desbloqueadas</p>
        ${list.map(a => `
          <div class="achievement ${a.unlocked ? 'unlocked' : ''}">
            <span class="ach-icon">${a.icon}</span>
            <span class="ach-text">
              <b>${a.name}</b>
              <small>${a.desc}</small>
              ${a.unlocked ? '' : `<span class="progress-bar small"><i style="width:${(a.value / a.goal) * 100}%"></i></span>`}
            </span>
            <span class="ach-prize">${a.unlocked ? '✓' : `${a.value}/${a.goal}`}<small>${rewardText(a.prize)}</small></span>
          </div>`).join('')}
      </div>
    </div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
}

// ---------- Estatísticas ----------

// game: { name, color, analytics, best(n) -> texto, bestLabel, bestStreak() }
export function statsScreen(root, nav, game) {
  const a = game.analytics.data();
  const levels = Object.entries(a.levels).map(([n, l]) => ({ n: Number(n), ...l })).sort((x, y) => x.n - y.n);
  const totalWins = Object.values(a.modes).reduce((x, y) => x + y, 0);
  const helps = levels.reduce((x, l) => x + l.helps, 0);
  // Níveis onde se desiste mais (pelo menos 2 tentativas e metade ou mais sem vitória).
  const hardest = levels
    .filter(l => l.starts >= 2)
    .map(l => ({ ...l, rate: 1 - l.wins / l.starts }))
    .filter(l => l.rate >= 0.5)
    .sort((x, y) => y.rate - x.rate)
    .slice(0, 5);

  const tiles = [
    ['Dias a jogar', a.daysPlayed],
    ['Sessões', a.sessions],
    ['Vitórias', totalWins],
    ['Tempo de jogo', fmtDuration(a.playSeconds)],
    ['Ajudas usadas', helps],
    ['Melhor sequência', `${game.bestStreak()} ${game.bestStreak() === 1 ? 'dia' : 'dias'}`],
  ];

  root.innerHTML = `
    <div class="screen sub" style="--ch:${game.color}">
      ${header(`Estatísticas · ${game.name}`)}
      <div class="sub-scroll">
        <div class="stat-tiles">${tiles.map(([k, v]) => `<div class="stat-tile"><b>${v}</b><small>${k}</small></div>`).join('')}</div>
        <div class="panel">
          <h3>Níveis mais difíceis para ti</h3>
          ${hardest.length ? `<ul class="plain">${hardest.map(l => `<li>Nível ${l.n} · ${l.wins} vitórias em ${l.starts} tentativas</li>`).join('')}</ul>`
            : '<p class="muted">Ainda não há nenhum nível onde tenhas desistido muitas vezes.</p>'}
        </div>
        <div class="panel">
          <h3>Últimos níveis</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nível</th><th>Jogos</th><th>Vitórias</th><th>Tempo médio</th><th>${game.bestLabel}</th></tr></thead>
              <tbody>
                ${levels.slice(-15).reverse().map(l => `<tr>
                  <td>${l.n}</td><td>${l.starts}</td><td>${l.wins}</td>
                  <td>${l.wins ? fmtClock(Math.round(l.seconds / l.wins)) : '—'}</td>
                  <td>${game.best(l.n) ?? '—'}</td>
                </tr>`).join('') || '<tr><td colspan="5" class="muted">Joga um nível para veres aqui os números.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        <p class="muted center">Estes números ficam só no teu telemóvel.</p>
      </div>
    </div>`;
  root.querySelector('[data-act=back]').onclick = () => nav.back();
}
