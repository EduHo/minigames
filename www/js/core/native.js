// Ponte para as funções nativas do Android (via Capacitor).
// No browser, tudo aqui é ignorado sem erros.
import { settings } from './settings.js';
import { load, save } from './store.js';

const plugins = () => window.NativePlugins || {};
export const isNative = () => !!window.Capacitor?.isNativePlatform?.();

export function vibrate(kind = 'light') {
  if (!settings().vibration) return;
  const { Haptics } = plugins();
  if (isNative() && Haptics) {
    const style = { light: 'LIGHT', medium: 'MEDIUM', heavy: 'HEAVY' }[kind] || 'LIGHT';
    Haptics.impact({ style }).catch(() => {});
  } else if (navigator.vibrate) {
    navigator.vibrate({ light: 8, medium: 20, heavy: [30, 40, 30] }[kind] || 8);
  }
}

export async function initNative({ onBack, onPause }) {
  if (!isNative()) return;
  const { SplashScreen, StatusBar, ScreenOrientation, App } = plugins();
  try {
    await StatusBar?.setStyle({ style: 'DARK' });
    await StatusBar?.setBackgroundColor({ color: '#0f3d22' });
  } catch { /* opcional */ }
  // Telemóveis só na vertical; tablets podem rodar.
  if (Math.min(screen.width, screen.height) < 600) {
    ScreenOrientation?.lock({ orientation: 'portrait' }).catch(() => {});
  }
  App?.addListener('backButton', () => onBack());
  App?.addListener('pause', () => onPause?.());
  SplashScreen?.hide().catch(() => {});
}

// Ícones da barra de estado: escuros em ecrãs claros (Azulejos), claros nos outros.
let statusStyle = null;
export function setStatusStyle(light) {
  const want = light ? 'LIGHT' : 'DARK';
  if (!isNative() || statusStyle === want) return;
  statusStyle = want;
  plugins().StatusBar?.setStyle({ style: want }).catch(() => {});
}

export function exitApp() {
  plugins().App?.exitApp();
}

const REMINDERS = [
  'O desafio diário de hoje está à tua espera 🀄',
  'Mantém a sequência! Abre o jogo e recebe o prémio do dia 🎁',
  'Um nível rápido antes do jantar? 🍵',
  'Há um novo desafio diário para completar 📅',
];

// Agenda um lembrete por dia às 19h, para os próximos 7 dias.
export async function scheduleReminders({ doneToday }) {
  const { LocalNotifications: LN } = plugins();
  if (!isNative() || !LN) return;
  try {
    const pending = await LN.getPending();
    if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    if (!settings().reminders) return;
    let perm = await LN.checkPermissions();
    if (perm.display !== 'granted') perm = await LN.requestPermissions();
    if (perm.display !== 'granted') return;
    const now = new Date();
    const notifications = [];
    for (let i = doneToday ? 1 : 0; i < 7; i++) {
      const at = new Date(now);
      at.setDate(now.getDate() + i);
      at.setHours(19, 0, 0, 0);
      if (at <= now) continue;
      notifications.push({ id: 100 + i, title: 'Mini Jogos', body: REMINDERS[(at.getDate()) % REMINDERS.length], schedule: { at, allowWhileIdle: true } });
    }
    if (notifications.length) await LN.schedule({ notifications });
  } catch { /* sem permissão ou indisponível */ }
}

// Pede avaliação na loja uma única vez, num momento feliz.
export function requestReviewOnce() {
  const state = load('app.review', { asked: false });
  if (state.asked || !isNative()) return;
  save('app.review', { asked: true });
  plugins().InAppReview?.requestReview().catch(() => {});
}
