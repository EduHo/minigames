// Guardar/ler estado no aparelho, sem rebentar se o armazenamento falhar.

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return structuredClone(fallback);
    return { ...structuredClone(fallback), ...JSON.parse(raw) };
  } catch {
    return structuredClone(fallback);
  }
}

export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento */ }
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch { /* sem armazenamento */ }
}

// Apaga tudo o que a app guardou (opção "Apagar progresso").
export function clearAll() {
  try { localStorage.clear(); } catch { /* sem armazenamento */ }
}

const pad = n => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Para testar eventos e o desafio diário: abrir a app com ?date=2026-12-10
const forcedDate = typeof location !== 'undefined' && /^\d{4}-\d{2}-\d{2}$/.test(new URLSearchParams(location.search).get('date') || '')
  ? new URLSearchParams(location.search).get('date') : null;
export const today = () => forcedDate || dateKey();

export function daysBetween(a, b) {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
