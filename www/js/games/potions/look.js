// Aspeto das poções: cores (com símbolo para quem não distingue cores) e frascos.

export const COLORS = [
  { name: 'Rubi', hex: '#e5484d', sym: '●' },
  { name: 'Âmbar', hex: '#f5a524', sym: '▲' },
  { name: 'Limão', hex: '#e9e34a', sym: '■' },
  { name: 'Esmeralda', hex: '#2fbf71', sym: '◆' },
  { name: 'Turquesa', hex: '#22c3c3', sym: '★' },
  { name: 'Safira', hex: '#3e63dd', sym: '♥' },
  { name: 'Ametista', hex: '#a35ee0', sym: '✚' },
  { name: 'Rosa', hex: '#f06bb3', sym: '☾' },
  { name: 'Laranja', hex: '#ff7a29', sym: '✿' },
  { name: 'Menta', hex: '#9be7b0', sym: '♠' },
  { name: 'Céu', hex: '#7cc4fa', sym: '♣' },
  { name: 'Cacau', hex: '#8a5a3c', sym: '✦' },
  { name: 'Pérola', hex: '#e8e6f0', sym: '✖' },
];

export const FLASK_STYLES = [
  { id: 'tube', name: 'Tubo de ensaio', price: 0, desc: 'O clássico do laboratório' },
  { id: 'round', name: 'Balão redondo', price: 400, desc: 'Fundo redondo, como nos livros de alquimia' },
  { id: 'jar', name: 'Frasco de botica', price: 700, desc: 'Vidro grosso com ombros quadrados' },
];
