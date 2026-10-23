// Menu principal da coleção. Cada jogo é independente: tem as suas moedas,
// prémio diário, conquistas e estatísticas. Só as Opções são da app.
import { mahjongHome, eventScreen } from './games/mahjong/screens.js';
import { game as mahjongGame } from './games/mahjong/game.js';
import { progress as mahjongProgress, loadSaved as mahjongSaved } from './games/mahjong/progress.js';
import { potionsHome } from './games/potions/map.js';
import { potionGame } from './games/potions/game.js';
import { progress as potionsProgress, loadSaved as potionsSaved, totalStars } from './games/potions/progress.js';
import { azulejosHome } from './games/azulejos/map.js';
import { azulejosAreas } from './games/azulejos/areas.js';
import { azulejosGame } from './games/azulejos/game.js';
import { progress as azProgress, loadSaved as azSaved, totalStars as azStars } from './games/azulejos/progress.js';
import { casaHome } from './games/casa/house.js';
import { casaGame } from './games/casa/game.js';
import { progress as casaProgress, loadSaved as casaSaved } from './games/casa/progress.js';
import { fornadaHome } from './games/fornada/home.js';
import { fornadaGame } from './games/fornada/game.js';
import { progress as fnProgress, loadSaved as fnSaved } from './games/fornada/progress.js';
import { colmeiaHome } from './games/colmeia/map.js';
import { colmeiaGame } from './games/colmeia/game.js';
import { progress as cmProgress, loadSaved as cmSaved, totalStars as cmStars } from './games/colmeia/progress.js';
import { letrasHome } from './games/letras/home.js';
import { letrasGame } from './games/letras/game.js';
import { progress as lsProgress, loadSaved as lsSaved } from './games/letras/progress.js';
import { settingsScreen } from './screens/app-screens.js';
import { getResume } from './core/resume.js';
import { initNative, exitApp, scheduleReminders, setStatusStyle } from './core/native.js';
import { unlockAudioOnFirstTouch } from './core/audio.js';
import { activeEvent, eventParticles } from './core/events.js';

const GAMES = [
  {
    id: 'mahjong', name: 'Mahjong', icon: '🀄', screen: mahjongHome,
    desc: () => {
      const p = mahjongProgress();
      return `Nível ${p.unlocked} · ★ ${Object.values(p.stars).reduce((a, b) => a + b, 0)}`;
    },
    resume: mode => mahjongSaved(mode) && {
      label: mode.kind === 'level' ? `Mahjong · nível ${mode.n}` : mode.kind === 'daily' ? 'Mahjong · desafio diário' : 'Mahjong · evento',
      open: () => { nav.show(mahjongHome); nav.show(mahjongGame, mode); },
    },
  },
  {
    id: 'potions', name: 'Poções da Lúmen', icon: '🧪', screen: potionsHome,
    desc: () => {
      const p = potionsProgress();
      return p.current === 1 && !Object.keys(p.stars).length ? 'Novo! Ordena as poções por cor' : `Nível ${p.current} · ★ ${totalStars(p)}`;
    },
    resume: mode => {
      const target = mode.date ? { date: mode.date } : mode.n;
      return potionsSaved(target) && {
        label: mode.date ? 'Poções · desafio diário' : `Poções · nível ${mode.n}`,
        open: () => { nav.show(potionsHome); nav.show(potionGame, target); },
      };
    },
  },
  {
    id: 'azulejos', name: 'Azulejos', icon: '🦊', screen: azulejosAreas,
    desc: () => {
      const p = azProgress();
      return p.current === 1 && !Object.keys(p.stars).length ? 'Novo! Uma viagem com a raposa Inês' : `Nível ${p.current} · ★ ${azStars(p)}`;
    },
    resume: mode => {
      const target = mode.date ? { date: mode.date } : mode.n;
      return azSaved(target) && {
        label: mode.date ? 'Azulejos · desafio diário' : `Azulejos · nível ${mode.n}`,
        open: () => { nav.show(azulejosAreas); nav.show(azulejosHome); nav.show(azulejosGame, target); },
      };
    },
  },
  {
    id: 'casa', name: 'Casa na Serra', icon: '🏡', screen: casaHome,
    desc: () => {
      const p = casaProgress();
      return p.current === 1 && !Object.keys(p.stars).length ? 'Novo! Trios de azulejos e uma casa para recuperar' : `Nível ${p.current} · ⭐ ${p.bank} para a casa`;
    },
    resume: mode => {
      const target = mode.date ? { date: mode.date } : mode.n;
      return casaSaved(target) && {
        label: mode.date ? 'Casa na Serra · desafio diário' : `Casa na Serra · nível ${mode.n}`,
        open: () => { nav.show(casaHome); nav.show(casaGame, target); },
      };
    },
  },
  {
    id: 'fornada', name: 'Fornada', icon: '🧁', screen: fornadaHome,
    desc: () => {
      const p = fnProgress();
      return p.current === 1 && !p.best[4] ? 'Novo! O 2048 com doces portugueses' : `Desafio ${p.current} · recorde ${p.best[4] || 0}`;
    },
    resume: mode => {
      const target = mode.date ? { date: mode.date } : mode.classic ? { classic: mode.classic } : mode.n;
      return fnSaved(target) && {
        label: mode.date ? 'Fornada · desafio diário' : mode.classic ? `Fornada · clássico ${mode.classic}×${mode.classic}` : `Fornada · desafio ${mode.n}`,
        open: () => { nav.show(fornadaHome); nav.show(fornadaGame, target); },
      };
    },
  },
  {
    id: 'colmeia', name: 'Colmeia', icon: '🐝', screen: colmeiaHome,
    desc: () => {
      const p = cmProgress();
      return p.current === 1 && !Object.keys(p.stars).length ? 'Novo! Liga números iguais na colmeia' : `Nível ${p.current} · ★ ${cmStars(p)}`;
    },
    resume: mode => {
      const target = mode.date ? { date: mode.date } : mode.n;
      return cmSaved(target) && {
        label: mode.date ? 'Colmeia · desafio diário' : `Colmeia · nível ${mode.n}`,
        open: () => { nav.show(colmeiaHome); nav.show(colmeiaGame, target); },
      };
    },
  },
  {
    id: 'letras', name: 'Letras Soltas', icon: '🔤', screen: letrasHome,
    desc: () => {
      const p = lsProgress();
      return p.tema === 1 && p.free === 1 ? 'Novo! Palavras escondidas em português' : `Tema ${p.tema} · Livre ${p.free}`;
    },
    resume: mode => lsSaved(mode) && {
      label: mode.date ? 'Letras Soltas · desafio diário' : mode.kind === 'livre' ? `Letras Soltas · livre ${mode.n}` : `Letras Soltas · nível ${mode.n}`,
      open: () => { nav.show(letrasHome); nav.show(letrasGame, mode); },
    },
  },
];

const app = document.getElementById('app');
let cleanup = null;
const stack = [];

function render() {
  if (cleanup) cleanup();
  app.innerHTML = '';
  const [screen, args] = stack[stack.length - 1];
  cleanup = screen(app, nav, ...args) || null;
  setStatusStyle(!!app.querySelector('.az-map-screen, .az-game, .az-sub, .fn-game, .fn-home'));
}

// Navegação com histórico: cada ecrã recebe (container, nav, ...args)
// e pode devolver uma função de limpeza (timers, listeners).
export const nav = {
  show(screen, ...args) { stack.push([screen, args]); render(); },
  replace(screen, ...args) { stack.pop(); stack.push([screen, args]); render(); },
  back() {
    if (stack.length > 1) { stack.pop(); render(); } else exitApp();
  },
  home() { stack.length = 0; stack.push([hub, []]); render(); },
};

function hub(root) {
  const ev = activeEvent();
  const r = getResume();
  const resume = r && GAMES.find(g => g.id === r.game)?.resume?.(r.mode);

  root.innerHTML = `
    <div class="screen hub">
      <header class="hub-head">
        <h1 class="hub-title">Mini Jogos</h1>
        <button class="icon-btn" data-act="settings" aria-label="Opções">⚙️</button>
      </header>
      <div class="hub-body">
        ${resume ? `<button class="resume-card" data-act="resume">▶ Continuar · ${resume.label}</button>` : ''}
        <div class="game-list">
          ${GAMES.map(g => `
            <button class="game-card ${g.screen ? '' : 'disabled'} game-${g.id}" data-id="${g.id}" ${g.screen ? '' : 'disabled'}>
              <span class="game-icon">${g.icon}</span>
              <span class="game-text">
                <span class="game-name">${g.name}</span>
                <span class="game-desc">${g.desc()}</span>
              </span>
              ${g.screen ? '<span class="go">›</span>' : ''}
            </button>`).join('')}
        </div>
        ${ev ? `<button class="event-banner" style="--ev:${ev.color}" data-act="event">
          <span class="mode-icon">${ev.icon}</span>
          <span><b>Mahjong · Evento ${ev.name}</b><small>Níveis especiais e peças novas · faltam ${ev.daysLeft} dias</small></span>
          <span class="go">›</span></button>` : ''}
        <p class="hub-foot">Grátis e open source · sem anúncios · sem compras</p>
      </div>
    </div>`;
  eventParticles(root.querySelector('.screen'), ev);
  root.querySelectorAll('.game-card:not(.disabled)').forEach(btn => {
    btn.onclick = () => nav.show(GAMES.find(g => g.id === btn.dataset.id).screen);
  });
  root.querySelector('[data-act=settings]').onclick = () => nav.show(settingsScreen);
  root.querySelector('[data-act=event]')?.addEventListener('click', () => { nav.show(mahjongHome); nav.show(eventScreen); });
  root.querySelector('[data-act=resume]')?.addEventListener('click', () => resume.open());
}

// ---------- Arranque ----------

unlockAudioOnFirstTouch();
// Botão "voltar" do Android: com um diálogo aberto não faz nada.
initNative({ onBack: () => { if (!document.querySelector('.overlay')) nav.back(); } });
scheduleReminders({ doneToday: false });
nav.home();
