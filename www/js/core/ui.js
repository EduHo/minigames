// Peças de interface partilhadas: avisos, diálogos, confetes, texto a flutuar.

let toastBox = null;

export function toast(html, ms = 2600) {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toasts';
    document.body.appendChild(toastBox);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  toastBox.appendChild(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

// Diálogo modal. actions: [{label, run, cls}] — run pode devolver false para não fechar.
export function modal(html, actions = [{ label: 'OK' }], { dismissable = false } = {}) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="dialog">${html}<div class="dialog-actions">${
    actions.map((a, i) => `<button class="btn ${a.cls ?? (i === 0 ? 'primary' : '')}" data-i="${i}">${a.label}</button>`).join('')
  }</div></div>`;
  const close = () => ov.remove();
  ov.querySelectorAll('[data-i]').forEach(b => {
    b.onclick = async () => {
      const a = actions[b.dataset.i];
      const keep = a.run ? await a.run(close) : undefined;
      if (keep !== false) close();
    };
  });
  if (dismissable) ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
  document.body.appendChild(ov);
  return close;
}

export function floatText(parent, x, y, html, cls = '') {
  const el = document.createElement('div');
  el.className = `float-text ${cls}`;
  el.innerHTML = html;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  parent.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

export function burst(parent, x, y, colors = ['#f5b942', '#ffffff', '#7fd8a6']) {
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('i');
    p.className = 'spark';
    const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
    const r = 30 + Math.random() * 40;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${Math.cos(a) * r}px`);
    p.style.setProperty('--dy', `${Math.sin(a) * r}px`);
    p.style.background = colors[i % colors.length];
    parent.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

export function confetti(duration = 2200) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const colors = ['#f5b942', '#e74c3c', '#2ecc71', '#3498db', '#ffffff', '#ff7ab6'];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    s: 5 + Math.random() * 6,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  (function frame(t) {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
    }
    if (t - t0 < duration) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

export const coinHtml = n => `<span class="coin">●</span>${n}`;

// Balão de texto junto a um elemento. Fecha ao tocar em qualquer lado.
export function bubble(anchor, html, { placement = 'above', autoClose = 0 } = {}) {
  const el = document.createElement('div');
  el.className = `coach-bubble ${placement}`;
  el.innerHTML = html;
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect();
  const bw = el.offsetWidth, bh = el.offsetHeight;
  const left = Math.max(12, Math.min(innerWidth - bw - 12, r.left + r.width / 2 - bw / 2));
  el.style.left = `${left}px`;
  let top = placement === 'above' ? r.top - bh - 12 : r.bottom + 12;
  if (top < 8) { top = r.bottom + 12; el.classList.replace('above', 'below'); }
  el.style.top = `${Math.min(top, innerHeight - bh - 8)}px`;
  el.style.setProperty('--arrow', `${r.left + r.width / 2 - left}px`);
  const close = () => { el.remove(); window.removeEventListener('pointerdown', close, true); };
  setTimeout(() => window.addEventListener('pointerdown', close, true), 300);
  if (autoClose) setTimeout(close, autoClose);
  return close;
}

// Mão animada a tocar numa peça.
export function hand(container, x, y) {
  const el = document.createElement('div');
  el.className = 'coach-hand';
  el.textContent = '👆';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  container.appendChild(el);
  return () => el.remove();
}
