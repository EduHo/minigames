// O último jogo deixado a meio, para o botão "Continuar" do menu principal.
import { load, save, remove } from './store.js';

const KEY = 'app.resume';

export const getResume = () => load(KEY, null);

// mode = null limpa, mas só se o "Continuar" atual for deste jogo.
export function setResume(game, mode) {
  if (mode) { save(KEY, { game, mode }); return; }
  if (getResume()?.game === game) remove(KEY);
}
