// Dicionário de português europeu da Letras Soltas (data/palavras-pt.txt).
// Cada linha: PALAVRA sem acentos, ou PALAVRA:forma com acentos. Ordem: das mais frequentes para as menos.
// Fonte: lista de frequências de legendas em português (FrequencyWords, CC-BY-SA 4.0), filtrada pelo
// corretor ortográfico pt-PT (Projeto Natura / LibreOffice). Ver docs/CREDITOS.md.
let dict = null;

export function parseDict(text) {
  const words = new Set(), prefix = new Set(), shown = new Map(), rank = new Map();
  text.split('\n').forEach((line, i) => {
    if (!line) return;
    const [w, form] = line.split(':');
    words.add(w);
    rank.set(w, i);
    if (form) shown.set(w, form.toUpperCase());
    for (let k = 1; k <= w.length; k++) prefix.add(w.slice(0, k));
  });
  return { words, prefix, shown, rank, display: w => shown.get(w) || w };
}

// Carrega uma vez (no browser e na app, o ficheiro vem junto com o jogo).
export async function loadDict() {
  if (dict) return dict;
  const res = await fetch(new URL('../../../data/palavras-pt.txt', import.meta.url));
  dict = parseDict(await res.text());
  return dict;
}
export const setDict = d => { dict = d; };
export const getDict = () => dict;
