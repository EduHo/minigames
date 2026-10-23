// Níveis. Cada camada tem um desvio (em meias-peças) e um mapa em que
// cada 'X' é uma peça. As camadas de cima ficam por cima das de baixo.
// Pensado para ecrã vertical: no máximo ~7 peças de largura.

// Nível 1: pequeno, para o tutorial.
export const TUTORIAL = {
  name: 'Primeiros passos',
  layers: [
    { off: [0, 0], map: ['XXXX', 'XXXX', 'XXXX'] },
    { off: [2, 1], map: ['XX'] },
  ],
};

export const LAYOUTS = [
  {
    name: 'Pirâmide',
    layers: [
      { off: [0, 0], map: ['XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX'] },
      { off: [1, 1], map: ['XXX', 'XXX', 'XXX', 'XXX'] },
      { off: [2, 2], map: ['XX', 'XX', 'XX'] },
    ],
  },
  {
    name: 'Torre',
    layers: [
      { off: [0, 0], map: ['XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX'] },
      { off: [1, 1], map: ['XXX', 'XXX', 'XXX', 'XXX', 'XXX'] },
      { off: [3, 5], map: ['X'] },
    ],
  },
  {
    name: 'Cruz',
    layers: [
      { off: [0, 0], map: [' XXX ', ' XXX ', 'XXXXX', 'XXXXX', 'XXXXX', ' XXX ', ' XXX '] },
      { off: [2, 2], map: [' X ', 'XXX', 'XXX', 'XXX', ' X '] },
      { off: [4, 5], map: ['X', 'X'] },
    ],
  },
  {
    name: 'Borboleta',
    layers: [
      { off: [0, 0], map: ['XX   XX', 'XXX XXX', 'XXXXXXX', ' XXXXX ', 'XXXXXXX', 'XXX XXX', 'XX   XX'] },
      { off: [1, 1], map: ['X    X', 'XX  XX', '  XX  ', 'XX  XX', 'X    X'] },
      { off: [6, 4], map: ['X', 'X', 'X'] },
    ],
  },
  {
    name: 'Fortaleza',
    layers: [
      { off: [0, 0], map: ['XXXXXX', 'X XX X', 'XXXXXX', 'XXXXXX', 'XXXXXX', 'XXXXXX', 'X XX X', 'XXXXXX'] },
      { off: [2, 2], map: ['XXXX', 'X  X', 'X  X', 'X  X', 'X  X', 'XXXX'] },
      { off: [3, 5], map: ['XX', 'XX', 'XX'] },
      { off: [4, 8], map: ['X'] },
      { off: [4, 10], map: ['X'] },
    ],
  },
  {
    name: 'Diamante',
    layers: [
      { off: [0, 0], map: ['   X   ', '  XXX  ', ' XXXXX ', 'XXXXXXX', ' XXXXX ', '  XXX  ', '   X   '] },
      { off: [2, 2], map: ['  X  ', ' XXX ', 'XXXXX', ' XXX ', '  X  '] },
      { off: [4, 4], map: [' X ', 'XXX', ' X '] },
      { off: [6, 6], map: ['X'] },
    ],
  },
  {
    name: 'Templo',
    layers: [
      { off: [0, 0], map: ['XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX'] },
      { off: [2, 2], map: ['XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX'] },
      { off: [4, 4], map: ['XXX', 'XXX', 'XXX', 'XXX'] },
      { off: [6, 6], map: ['X', 'X'] },
    ],
  },
  {
    name: 'Dragão',
    layers: [
      { off: [0, 0], map: ['XXXXXXX', 'XXXXXXX', 'XX   XX', 'XXXXXXX', 'XXXXXXX', 'XX   XX', 'XXXXXXX', 'XXXXXXX'] },
      { off: [1, 1], map: ['XXXXXX', 'X    X', 'X    X', 'XXXXXX', 'X    X', 'X    X', 'XXXXXX'] },
      { off: [2, 2], map: ['XXXXX', '     ', 'XXXXX', 'XXXXX', '     ', 'XXXXX'] },
      { off: [3, 3], map: ['XXXX', '    ', ' XX ', '    ', 'XXXX'] },
    ],
  },
];

// Converte um nível em posições {x, y, z} em meias-peças.
export function parseLayout(layout) {
  const pos = [];
  layout.layers.forEach(({ off, map }, z) => {
    map.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === 'X') pos.push({ x: off[0] + c * 2, y: off[1] + r * 2, z });
      });
    });
  });
  return pos;
}
