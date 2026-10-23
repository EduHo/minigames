// Ecrãs extra do Azulejos: painel de cada sítio, toca da Avó Rosa, atelier de pintura,
// álbum de postais e desafio diário com calendário.
import { PLACES, LEVELS_PER_PLACE } from './levels.js';
import { progress, update, panelPieces, dailyState, loadSaved } from './progress.js';
import { panelSvg, PIECE_ORDER, PATTERNS, PAINT_SHAPES, PAINT_COLORS, paintingSvg } from './panels.js';
import { portrait, C } from './art.js';
import { ROOM_ART } from './furniture.js';
import { POSTCARDS, ROOMS } from './story.js';
import { azulejosGame } from './game.js';
import { wallet, achievements } from './meta.js';
import { activeFesta } from './festas.js';
import { sfx } from '../../core/audio.js';
import { toast, coinHtml, modal } from '../../core/ui.js';
import { today } from '../../core/store.js';

const header = (title, extra = '') => `<header class="topbar"><button class="icon-btn" data-act="back" aria-label="Voltar">‹</button><h2>${title}</h2>${extra || '<span class="spacer"></span>'}</header>`;
const back = (root, nav) => { root.querySelector('[data-act=back]').onclick = () => nav.back(); };

// ---------- Painel de um sítio ----------
export function panelScreen(root, nav, c) {
  const p = progress();
  const place = PLACES[c % 10];
  const pieces = panelPieces(p, c);
  root.innerHTML = `<div class="screen sub az-sub">${header(`Painel · ${place.name}`)}
    <div class="sub-scroll">
      <div class="az-panel ${pieces === LEVELS_PER_PLACE ? 'complete' : ''}">${panelSvg(c)}<div class="az-panel-grid">
        ${Array.from({ length: 20 }, (_, k) => `<div class="${PIECE_ORDER.indexOf(k) < pieces ? '' : 'hidden'}"></div>`).join('')}</div></div>
      <div class="az-quote">${portrait(place.who)}<p>${pieces === LEVELS_PER_PLACE
        ? 'O painel está restaurado! Fica guardado no teu álbum de postais.'
        : `Faltam ${LEVELS_PER_PLACE - pieces} peças. Cada nível ganho em ${place.name} devolve a cor a uma peça.`}</p></div>
      <div class="progress-bar"><i style="width:${(pieces / LEVELS_PER_PLACE) * 100}%"></i></div>
    </div></div>`;
  back(root, nav);
}

// ---------- Toca da Avó Rosa ----------

function patternDefs(id, svg, scale = 1) {
  return `<pattern id="${id}" width="${30}" height="${30}" patternUnits="userSpaceOnUse"><g transform="scale(${0.5 * scale})">${svg}</g></pattern>`;
}
function allPatterns(p) {
  const mine = p.paintings.map((pt, i) => ({ id: `mine${i}`, name: `A minha pintura ${i + 1}`, svg: paintingSvg(pt.fills, 120).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''), scale: 0.5 }));
  return [...PATTERNS, ...mine];
}
function roomSvg(i, pattern) {
  const pid = `rp${i}-${pattern?.id || 'none'}`;
  return `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>${pattern ? patternDefs(pid, pattern.svg, pattern.scale || 1) : ''}</defs>
    <rect width="160" height="80" fill="${pattern ? `url(#${pid})` : '#ecebe7'}"/>
    ${pattern ? '' : '<text x="80" y="14" text-anchor="middle" font-size="9" fill="#8b8f99">Escolhe os azulejos</text>'}
    <rect y="80" width="160" height="30" fill="#c99a63"/><rect y="78" width="160" height="4" fill="${C}"/>
    ${ROOM_ART[i]()}</svg>`;
}

export function toca(root, nav) {
  const render = () => {
    const p = progress();
    const done = Array.from({ length: 10 }, (_, c) => panelPieces(p, c) === LEVELS_PER_PLACE);
    const pats = allPatterns(p);
    root.innerHTML = `<div class="screen sub az-sub">${header('Toca da Avó Rosa')}
      <div class="sub-scroll">
        <div class="az-quote">${portrait('rosa')}<p>Cada painel que restauras abre uma divisão da minha toca. Escolhe os azulejos de cada uma, até os que pintares no atelier!</p></div>
        <div class="az-rooms">${ROOMS.map((name, i) => {
          const open = done[i];
          const pat = pats.find(x => x.id === p.rooms[i]);
          return `<button class="az-room ${open ? '' : 'locked'}" data-room="${i}" ${open ? '' : 'disabled'}>
            ${open ? roomSvg(i, pat) : '<span class="lockbig">🔒</span>'}<b>${name}</b><small>${open ? (pat ? pat.name : 'Por decorar') : `Restaura o painel de ${PLACES[i].name}`}</small></button>`;
        }).join('')}</div>
      </div></div>`;
    back(root, nav);
    root.querySelectorAll('[data-room]:not([disabled])').forEach(b => { b.onclick = () => choose(Number(b.dataset.room)); });
  };
  const choose = i => {
    const p = progress();
    const pats = allPatterns(p);
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="dialog az-choose"><h3>${ROOMS[i]}</h3><p>Escolhe os azulejos:</p>
      <div class="az-pats">${pats.map(pt => `<button data-p="${pt.id}" class="${p.rooms[i] === pt.id ? 'on' : ''}">${roomSvg(i, pt)}<small>${pt.name}</small></button>`).join('')}</div>
      <div class="dialog-actions"><button class="btn ghost" data-close>Fechar</button></div></div>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-close]').onclick = () => ov.remove();
    ov.querySelectorAll('[data-p]').forEach(b => {
      b.onclick = () => {
        update(q => { q.rooms[i] = b.dataset.p; });
        sfx('unlock'); achievements.check();
        ov.remove(); render();
      };
    });
  };
  render();
}

// ---------- Atelier: pinta o teu azulejo ----------
export function atelier(root, nav) {
  let fills = { corner: '#1d3f8f', petal: '#3b64c4', leaf: '#ffffff', dot: '#d99a1e', ring: '#ffffff', center: '#d99a1e' };
  let brush = PAINT_COLORS[0];
  const render = () => {
    const p = progress();
    root.innerHTML = `<div class="screen sub az-sub">${header('Atelier')}
      <div class="sub-scroll">
        <div class="az-quote">${portrait('ines')}<p>Escolhe uma cor e toca nas formas. A simetria pinta as quatro partes ao mesmo tempo. Guarda os teus azulejos para decorar a toca.</p></div>
        <div class="az-easel"><div class="az-canvas">${paintingSvg(fills, 240)}</div>
          <div class="az-palette">${PAINT_COLORS.map(c => `<button style="background:${c}" data-c="${c}" class="${c === brush ? 'on' : ''}" aria-label="Cor"></button>`).join('')}</div>
          <div class="controls"><button class="btn" data-act="random">🎲 Surpresa</button><button class="btn primary" data-act="save">Guardar azulejo</button></div>
        </div>
        <h3 class="az-h3">Os meus azulejos (${p.paintings.length}/12)</h3>
        <div class="az-gallery">${p.paintings.map((pt, i) => `<button data-load="${i}">${paintingSvg(pt.fills, 72)}</button>`).join('') || '<p class="muted">Ainda não guardaste nenhum.</p>'}</div>
      </div></div>`;
    back(root, nav);
    root.querySelector('.az-canvas').addEventListener('click', e => { const sh = e.target.dataset?.s; if (!sh) return; fills = { ...fills, [sh]: brush }; sfx('tap'); render(); });
    root.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { brush = b.dataset.c; render(); }; });
    root.querySelector('[data-act=random]').onclick = () => { PAINT_SHAPES.forEach(sh => { fills[sh.id] = PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)]; }); sfx('shuffle'); render(); };
    root.querySelector('[data-act=save]').onclick = () => {
      const q = progress();
      if (q.paintings.length >= 12) { toast('Já tens 12 azulejos. Toca num para o carregar e pintar por cima.'); return; }
      update(x => { x.paintings.push({ fills: { ...fills }, date: today() }); });
      sfx('unlock'); toast('Azulejo guardado! Já o podes usar na toca.'); achievements.check(); render();
    };
    root.querySelectorAll('[data-load]').forEach(b => { b.onclick = () => { fills = { ...progress().paintings[Number(b.dataset.load)].fills }; render(); }; });
  };
  render();
}

// ---------- Álbum de postais ----------
export function album(root, nav) {
  const p = progress();
  root.innerHTML = `<div class="screen sub az-sub">${header('Álbum de postais')}
    <div class="sub-scroll"><div class="az-postcards">
      ${PLACES.map((pl, c) => {
        const done = panelPieces(p, c) === LEVELS_PER_PLACE;
        return `<div class="az-postcard ${done ? '' : 'locked'}">
          <div class="az-postcard-img">${done ? panelSvg(c) : '<span class="lockbig">🔒</span>'}</div>
          <div><b>${pl.name}</b><p>${done ? POSTCARDS[c] : `Restaura o painel de ${pl.name} para receberes este postal.`}</p></div></div>`;
      }).join('')}
    </div></div></div>`;
  back(root, nav);
}

// ---------- Desafio diário ----------
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEK_HINT = ['Segunda: calma', 'Terça: presentes 🎁', 'Quarta: portões e poderes 🔒✨', 'Quinta: pilhas e gelo 📚❄️', 'Sexta: poderes e gelo ✨❄️', 'Sábado: vinhas e rolhas 🌿🍾', 'Domingo: tudo junto 🦎'];
export function azDaily(root, nav, offset = 0) {
  const d = dailyState(), t = today();
  const [ty, tm] = t.split('-').map(Number);
  const view = new Date(ty, tm - 1 + offset, 1);
  const y = view.getFullYear(), m = view.getMonth() + 1, prefix = `${y}-${String(m).padStart(2, '0')}`;
  const days = new Date(y, m, 0).getDate(), firstDow = (view.getDay() + 6) % 7;
  const doneCount = Object.keys(d.done).filter(k => k.startsWith(prefix)).length;
  const festa = activeFesta(t);
  let cells = '<span></span>'.repeat(firstDow);
  for (let day = 1; day <= days; day++) {
    const key = `${prefix}-${String(day).padStart(2, '0')}`, st = d.done[key], future = key > t;
    cells += `<button class="day ${st ? 'done' : ''} ${key === t ? 'today' : ''} ${future ? 'future' : ''} ${loadSaved({ date: key }) ? 'saved' : ''}" data-date="${key}" ${future ? 'disabled' : ''}>
      <b>${day}</b>${st ? `<span class="stars small">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">★</i>`).join('')}</span>` : ''}</button>`;
  }
  const dow = (new Date(ty, tm - 1, Number(t.slice(8))).getDay() + 6) % 7;
  root.innerHTML = `<div class="screen sub az-sub">${header('Desafio diário', `<span class="coin-badge">${coinHtml(wallet.coins())}</span>`)}
    <div class="sub-scroll">
      ${festa ? `<div class="az-festa">${festa.icon} ${festa.name}: desenhos de festa e moedas a dobrar!</div>` : ''}
      <div class="panel">
        <div class="month-nav"><button class="icon-btn" data-act="prev" aria-label="Mês anterior">‹</button>
          <div><b>${MONTHS[m - 1]} ${y}</b><small>${doneCount}/${days} dias · troféu ao completar o mês</small></div>
          <button class="icon-btn" data-act="next" ${offset >= 0 ? 'disabled' : ''} aria-label="Mês seguinte">›</button></div>
        <div class="cal-head">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="calendar">${cells}</div>
        <div class="progress-bar"><i style="width:${(doneCount / days) * 100}%"></i></div>
      </div>
      ${offset === 0 ? `<button class="play-next" data-date="${t}">${d.done[t] ? 'Jogar outra vez o de hoje' : '▶ Jogar o desafio de hoje'}</button><p class="muted center">Hoje: ${WEEK_HINT[dow]}</p>` : ''}
      <div class="panel"><h3>Troféus</h3><div class="trophies">${d.trophies.map(mo => `<span class="trophy">🥇<small>${MONTHS[Number(mo.slice(5)) - 1].slice(0, 3)} ${mo.slice(0, 4)}</small></span>`).join('') || '<p class="muted">Completa todos os dias de um mês para ganhar o troféu e 200 moedas.</p>'}</div></div>
    </div></div>`;
  back(root, nav);
  root.querySelector('[data-act=prev]').onclick = () => nav.replace(azDaily, offset - 1);
  root.querySelector('[data-act=next]').onclick = () => nav.replace(azDaily, offset + 1);
  root.querySelectorAll('[data-date]:not([disabled])').forEach(b => { b.onclick = () => nav.show(azulejosGame, { date: b.dataset.date }); });
}
