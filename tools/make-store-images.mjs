// Compõe as imagens da Play Store (1080x1920) a partir de capturas do emulador.
// Uso: node tools/make-store-images.mjs <pasta-com-capturas> [video.mp4]
// As capturas chamam-se 1-game.png, 2-map.png, ... (ver CAPTIONS).
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [src, video] = process.argv.slice(2);
const OUT = 'store/screenshots';
mkdirSync(OUT, { recursive: true });

const CAPTIONS = {
  '1-game': ['Mahjong clássico', 'Junta pares de peças livres'],
  '2-map': ['1000 níveis', '50 capítulos, estrelas e baús'],
  '3-daily': ['Desafio diário', 'Um nível novo todos os dias'],
  '4-event': ['Eventos especiais', 'Peças novas no Halloween, Natal e Ano Novo Chinês'],
  '5-win': ['Conquistas e recordes', 'Ganha estrelas e moedas a jogar'],
  '6-collection': ['Estilos de peças', 'Clássico, frutas, animais e mais'],
};

const W = 1080, H = 1920;
const background = (title, subtitle) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="bg" cx="0.5" cy="0.2" r="0.9"><stop offset="0" stop-color="#1f7a44"/><stop offset="1" stop-color="#0b2e1a"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="540" y="150" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="78" font-weight="800" fill="#fffaf0">${title}</text>
  <text x="540" y="225" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="38" fill="#f5b942">${subtitle}</text>
</svg>`);

async function framed(file, title, subtitle, out) {
  const shotH = 1580;
  const shot = await sharp(file).resize({ height: shotH }).toBuffer();
  const { width: shotW } = await sharp(shot).metadata();
  const r = 40;
  const mask = Buffer.from(`<svg width="${shotW}" height="${shotH}"><rect width="${shotW}" height="${shotH}" rx="${r}" fill="#fff"/></svg>`);
  const rounded = await sharp(shot).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(background(title, subtitle))
    .composite([{ input: rounded, left: Math.round((W - shotW) / 2), top: 290 }])
    .png()
    .toFile(out);
}

for (const [name, [title, subtitle]] of Object.entries(CAPTIONS)) {
  const file = `${src}/${name}.png`;
  if (!existsSync(file)) { console.warn(`Falta ${file}`); continue; }
  await framed(file, title, subtitle, `${OUT}/${name}.png`);
}

// Vídeo promocional: a gravação do ecrã sobre o mesmo fundo, com título.
if (video) {
  const bg = 'store/.video-bg.png';
  await sharp(background('Mini Jogos', 'Mahjong grátis · sem anúncios')).png().toFile(bg);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-loop', '1', '-i', bg, '-i', video,
    '-filter_complex', '[1:v]scale=-2:1580[v];[0:v][v]overlay=(W-w)/2:290:shortest=1,format=yuv420p',
    '-r', '30', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', 'store/promo-video.mp4']);
  execFileSync('rm', [bg]);
}
console.log('Imagens da loja geradas em store/');
