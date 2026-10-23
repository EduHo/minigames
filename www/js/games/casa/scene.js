// Fundo pintado da Casa na Serra (canvas): céu, montanhas em camadas com neve, nevoeiro,
// pinheiros, a cabana com as janelas acesas e o chão de neve. Cada divisão tem a sua hora do dia.
const PALETTES = [
  { sky: ['#6f86b8', '#b7c3e0', '#f2d2c9', '#f7e3d6'], glow: 'rgba(255,214,170,.75)', far: ['#b4c0dc', '#9aa9cc'], mid: ['#8b9fc6', '#6f86b3'], near: ['#6a83b0', '#4f6a98'], tree: '#3d5a7e', front: '#173a4f' },   // madrugada
  { sky: ['#4f9fe0', '#9fd0f2', '#d9eefa', '#eef7fc'], glow: 'rgba(255,255,230,.6)', far: ['#bcd2ea', '#a3bfdf'], mid: ['#8fb1d8', '#7398c6'], near: ['#6a8fbf', '#5378aa'], tree: '#355a74', front: '#183c4c' },   // manhã
  { sky: ['#e7a07a', '#f3c08c', '#f8d9a8', '#fbe9c8'], glow: 'rgba(255,200,120,.8)', far: ['#c9a9b6', '#b08ea4'], mid: ['#9b7f9c', '#7d6688'], near: ['#6d5a7c', '#55466a'], tree: '#4a3d5c', front: '#2b2338' },   // pôr do sol
  { sky: ['#1b2447', '#2f3d6b', '#4a5b8c', '#6b7aa6'], glow: 'rgba(200,215,255,.35)', far: ['#56658f', '#4a587f'], mid: ['#414e75', '#364266'], near: ['#2e395a', '#252f4c'], tree: '#1f2a44', front: '#121a2c', night: true },   // noite
];

function rand(seed) { let x = seed; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; }

function pine(c, x, base, h, col, snowCol) {
  c.fillStyle = '#3b2a22'; c.fillRect(x - h * 0.03, base - h * 0.1, h * 0.06, h * 0.12);
  for (let i = 0; i < 5; i++) {
    const ty = base - h * 0.08 - i * h * 0.16, tw = h * 0.36 * (1 - i * 0.16), th = h * 0.32;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(x, ty - th); c.lineTo(x + tw, ty); c.quadraticCurveTo(x, ty - th * 0.18, x - tw, ty); c.closePath(); c.fill();
    c.fillStyle = snowCol;
    c.beginPath(); c.moveTo(x, ty - th);
    c.lineTo(x + tw * 0.62, ty - th * 0.36); c.quadraticCurveTo(x + tw * 0.3, ty - th * 0.48, x, ty - th * 0.6);
    c.quadraticCurveTo(x - tw * 0.3, ty - th * 0.48, x - tw * 0.62, ty - th * 0.36); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(x + tw * 0.86, ty - th * 0.1, tw * 0.16, th * 0.06, 0.4, 0, 7); c.fill();
    c.beginPath(); c.ellipse(x - tw * 0.86, ty - th * 0.1, tw * 0.16, th * 0.06, -0.4, 0, 7); c.fill();
  }
}

export function drawScene(canvas, zone = 0) {
  const pal = PALETTES[zone % PALETTES.length];
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = canvas.clientWidth || 360, H = canvas.clientHeight || 640;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = rand(4242 + zone);
  const sky = c.createLinearGradient(0, 0, 0, H * 0.6);
  pal.sky.forEach((col, i) => sky.addColorStop(i / (pal.sky.length - 1), col));
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  if (pal.night) { c.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { c.globalAlpha = 0.3 + r() * 0.7; c.beginPath(); c.arc(r() * W, r() * H * 0.45, r() * 1.4, 0, 7); c.fill(); } c.globalAlpha = 1; c.fillStyle = '#f4f1dc'; c.beginPath(); c.arc(W * 0.75, H * 0.14, 16, 0, 7); c.fill(); }
  const glow = c.createRadialGradient(W * 0.72, H * 0.42, 4, W * 0.72, H * 0.42, W * 0.6);
  glow.addColorStop(0, pal.glow); glow.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = glow; c.fillRect(0, 0, W, H);
  [[H * 0.46, H * 0.2, 7, pal.far], [H * 0.54, H * 0.17, 6, pal.mid], [H * 0.62, H * 0.12, 8, pal.near]].forEach(([y0, amp, n, [top, bot]], k) => {
    const pts = []; for (let i = 0; i <= n; i++) pts.push([i / n * W, y0 - amp * (0.35 + r() * 0.65) * (i % 2 ? 1 : 0.55)]);
    const g = c.createLinearGradient(0, y0 - amp, 0, y0 + 40); g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.beginPath(); c.moveTo(-10, H); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(W + 10, H); c.closePath(); c.fill();
    c.fillStyle = k === 0 ? 'rgba(255,255,255,.9)' : 'rgba(245,248,255,.85)';
    pts.forEach(([x, y], i) => {
      if (i === 0 || i === pts.length - 1 || y > pts[i - 1][1] || y > pts[i + 1][1]) return;
      const [lx, ly] = pts[i - 1], [rx, ry] = pts[i + 1], d = 0.28;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rx - x) * d, y + (ry - y) * d); c.lineTo(x + (rx - x) * d * 0.6, y + (ry - y) * d * 0.75);
      c.lineTo(x, y + (ly - y) * d * 0.55 + 6); c.lineTo(x + (lx - x) * d * 0.6, y + (ly - y) * d * 0.8); c.lineTo(x + (lx - x) * d, y + (ly - y) * d); c.closePath(); c.fill();
    });
    const mist = c.createLinearGradient(0, y0 - 10, 0, y0 + 50); mist.addColorStop(0, 'rgba(240,236,245,0)'); mist.addColorStop(0.5, `rgba(240,236,245,${pal.night ? 0.12 : 0.35})`); mist.addColorStop(1, 'rgba(240,236,245,0)');
    c.fillStyle = mist; c.fillRect(0, y0 - 10, W, 60);
  });
  for (let i = 0; i < 26; i++) { const x = r() * W, h = 26 + r() * 22; pine(c, x, H * 0.7 + r() * 12, h, pal.tree, 'rgba(232,240,252,.9)'); }
  const cx = W * 0.2, cy = H * 0.735;
  c.fillStyle = '#e9eef7'; c.beginPath(); c.ellipse(cx + 10, cy + 6, 70, 16, 0, 0, 7); c.fill();
  c.fillStyle = '#6b4a37'; c.fillRect(cx - 18, cy - 20, 40, 24);
  c.fillStyle = '#f4f6fb'; c.beginPath(); c.moveTo(cx - 25, cy - 18); c.lineTo(cx + 2, cy - 40); c.lineTo(cx + 29, cy - 18); c.closePath(); c.fill();
  c.fillStyle = '#ffcf6b'; c.shadowColor = '#ffb347'; c.shadowBlur = 10; c.fillRect(cx - 12, cy - 13, 8, 8); c.fillRect(cx + 6, cy - 13, 8, 8); c.shadowBlur = 0;
  c.fillStyle = '#5b3e2e'; c.fillRect(cx + 12, cy - 44, 6, 14);
  c.fillStyle = 'rgba(240,240,248,.55)'; [[0, 0, 5], [5, -9, 7], [12, -20, 9]].forEach(([a, b, rr]) => { c.beginPath(); c.arc(cx + 15 + a, cy - 50 + b, rr, 0, 7); c.fill(); });
  const snowG = c.createLinearGradient(0, H * 0.74, 0, H); snowG.addColorStop(0, pal.night ? '#b8c3dc' : '#e7eef9'); snowG.addColorStop(1, pal.night ? '#7f8fb5' : '#b9c8e2');
  c.fillStyle = snowG; c.beginPath(); c.moveTo(0, H * 0.78); c.quadraticCurveTo(W * 0.3, H * 0.74, W * 0.55, H * 0.79); c.quadraticCurveTo(W * 0.8, H * 0.83, W, H * 0.77); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  [[-6, 1.0], [W * 0.1, 0.78], [W - 4, 1.05], [W * 0.88, 0.8]].forEach(([x, k]) => pine(c, x, H * 0.97, H * 0.5 * k, pal.front, '#f1f6fd'));
}

// Neve a cair: flocos pequenos ao fundo e alguns grandes e desfocados à frente. Devolve a função para parar.
export function startSnow(canvas) {
  const flakes = Array.from({ length: 60 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: i < 8 ? 3 + Math.random() * 3 : 0.8 + Math.random() * 2, v: 0.0006 + Math.random() * 0.0012, w: Math.random() * 6.28, near: i < 8 }));
  let raf = 0, alive = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loop() {
    if (!alive) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== Math.round(W * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    for (const f of flakes) {
      f.y += f.v * (f.near ? 1.8 : 1); f.w += 0.02; if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
      const x = (f.x + Math.sin(f.w) * 0.01) * W, y = f.y * H;
      if (f.near) { const g = c.createRadialGradient(x, y, 0, x, y, f.r * 2.2); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, f.r * 2.2, 0, 7); c.fill(); }
      else { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, y, f.r, 0, 7); c.fill(); }
    }
    if (!reduced && !document.hidden) raf = requestAnimationFrame(loop);
    else raf = setTimeout(loop, 500);
  }
  loop();
  return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(raf); };
}
