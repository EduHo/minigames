// Estatísticas de um jogo, guardadas só no aparelho. Nada é enviado para fora.
import { load, save, today } from './store.js';

const DEFAULTS = { firstDay: '', lastDay: '', daysPlayed: 0, sessions: 0, playSeconds: 0, levels: {}, modes: {} };

export function createAnalytics(game, { legacyKey } = {}) {
  const KEY = `${game}.analytics`;
  let data = { ...structuredClone(DEFAULTS), ...(load(KEY, null) || (legacyKey && load(legacyKey, null)) || {}) };
  let sessionCounted = false;

  const level = n => (data.levels[n] ??= { starts: 0, wins: 0, quits: 0, losses: 0, seconds: 0, helps: 0 });

  return {
    data: () => data,
    // Conta uma sessão por cada vez que a app é aberta e o jogo visitado.
    session() {
      if (sessionCounted) return;
      sessionCounted = true;
      data.sessions++;
      if (!data.firstDay) data.firstDay = today();
      if (data.lastDay !== today()) { data.daysPlayed++; data.lastDay = today(); }
      save(KEY, data);
    },
    track(name, params = {}) {
      const isLevel = params.mode === 'level';
      switch (name) {
        case 'level_start': if (isLevel) level(params.n).starts++; break;
        case 'level_win':
          if (isLevel) {
            const l = level(params.n);
            l.wins++; l.seconds += params.seconds; l.helps += params.helps;
          }
          data.modes[params.mode] = (data.modes[params.mode] || 0) + 1;
          data.playSeconds += params.seconds;
          break;
        case 'level_quit': if (isLevel) level(params.n).quits++; break;
        case 'level_lose': if (isLevel) level(params.n).losses++; break;
      }
      save(KEY, data);
    },
  };
}
