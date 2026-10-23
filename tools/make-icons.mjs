// Gera o ícone da app, o ecrã de arranque e as imagens da Play Store a partir de SVG.
// Uso: npm run build:icons
import sharp from 'sharp';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const RES = 'android/app/src/main/res';
const BG = '#14532d';

// Peça de Mahjong com 5 círculos (o "5 de círculos"), desenhada à mão.
function tile(x, y, w, rot = 0) {
  const h = w * 1.3, r = w * 0.12, t = w * 0.07;
  const dot = (cx, cy, c) => {
    const rr = w * 0.12;
    return `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${c}"/><circle cx="${cx}" cy="${cy}" r="${rr * 0.55}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${rr * 0.28}" fill="${c}"/>`;
  };
  const px = f => x + w * f, py = f => y + h * f;
  return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
    <rect x="${x + t * 1.4}" y="${y + t * 1.8}" width="${w}" height="${h}" rx="${r}" fill="#a68f5e"/>
    <rect x="${x + t * 0.7}" y="${y + t * 0.9}" width="${w}" height="${h}" rx="${r}" fill="#d6c49a"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#ivory)"/>
    ${dot(px(0.28), py(0.24), '#1f5fae')}${dot(px(0.72), py(0.24), '#c0392b')}
    ${dot(px(0.5), py(0.5), '#1e8449')}
    ${dot(px(0.28), py(0.76), '#c0392b')}${dot(px(0.72), py(0.76), '#1f5fae')}
  </g>`;
}

const defs = `<defs>
  <linearGradient id="ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#efe5cc"/></linearGradient>
  <radialGradient id="bg" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stop-color="#1f7a44"/><stop offset="1" stop-color="#0f3d22"/></radialGradient>
</defs>`;

// Duas peças: uma atrás inclinada e uma à frente. Cabem na zona segura do ícone adaptativo.
const tiles = (size, scale = 1) => {
  const w = size * 0.36 * scale;
  const cx = size / 2, cy = size / 2;
  return tile(cx - w * 0.95, cy - w * 0.78, w * 0.9, -14) + tile(cx - w * 0.3, cy - w * 0.62, w, 6);
};

const iconSvg = (size, { background = true, scale = 1 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs}
    ${background ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>` : ''}${tiles(size, scale)}</svg>`;

const png = (svg, out, w, h) => sharp(Buffer.from(svg)).resize(w, h).png().toFile(out);

writeFileSync('assets/icon.svg', iconSvg(1024));

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(DENSITIES)) {
  const dir = `${RES}/mipmap-${d}`;
  mkdirSync(dir, { recursive: true });
  const s = Math.round(48 * k);
  await png(iconSvg(512, { scale: 1.05 }), `${dir}/ic_launcher.png`, s, s);
  const round = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${defs}<clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath>
    <g clip-path="url(#c)"><rect width="512" height="512" fill="url(#bg)"/>${tiles(512, 1.2)}</g></svg>`;
  await png(round, `${dir}/ic_launcher_round.png`, s, s);
  const f = Math.round(108 * k);
  await png(iconSvg(1024, { background: false, scale: 0.9 }), `${dir}/ic_launcher_foreground.png`, f, f);
}
writeFileSync(`${RES}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);

// Ecrã de arranque: fundo verde com as peças ao centro, nos tamanhos já existentes.
for (const dir of readdirSync(RES).filter(d => d.startsWith('drawable'))) {
  const file = `${RES}/${dir}/splash.png`;
  if (!existsSync(file)) continue;
  const { width, height } = await sharp(file).metadata();
  const m = Math.min(width, height);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${defs}
    <rect width="${width}" height="${height}" fill="#0f3d22"/>
    <g transform="translate(${(width - m) / 2} ${(height - m) / 2})">${tiles(m, 0.8)}</g></svg>`;
  await png(svg, file, width, height);
}

// Play Store: ícone 512 e imagem de destaque 1024x500.
await png(iconSvg(512, { scale: 1.05 }), 'store/icon-512.png', 512, 512);
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">${defs}
  <rect width="1024" height="500" fill="url(#bg)"/>
  <g transform="translate(40 -20)">${tiles(520, 1.1)}</g>
  <text x="560" y="230" font-family="Helvetica, Arial, sans-serif" font-size="78" font-weight="800" fill="#fffaf0">Mini Jogos</text>
  <text x="562" y="300" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#cfe6d6">Mahjong com 1000 níveis</text>
  <text x="562" y="350" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#f5b942">Grátis · sem anúncios</text>
</svg>`;
await png(feature, 'store/feature-graphic.png', 1024, 500);
console.log('Ícones, ecrã de arranque e imagens da loja gerados.');
