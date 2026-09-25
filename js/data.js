/* =========================================================
   BURGUER_BYTE — dados do cardápio + ilustrações
   Para trocar as ilustrações por fotos reais, altere a função
   artBox() no final deste arquivo para devolver uma <img>.
   ========================================================= */
'use strict';

const CATEGORIES = [
  { id: 'combos',          label: 'Combos',          title: 'Combos em destaque:' },
  { id: 'hamburgueres',    label: 'Hambúrgueres',    title: 'Hambúrgueres:' },
  { id: 'acompanhamentos', label: 'Acompanhamentos', title: 'Acompanhamentos:' },
  { id: 'bebidas',         label: 'Bebidas',         title: 'Bebidas:' },
  { id: 'sobremesas',      label: 'Sobremesas',      title: 'Sobremesas:' }
];

/*
  art:  tipo de ilustração (combo, burger, fries, rings, drink, juice, shake, brownie)
  tone: cor do fundo do card (a, b, c, d)
  ingredients: itens que o cliente pode retirar
  allergens:   usados no alerta de alergênicos
*/
const PRODUCTS = [
  {
    id: 'combo-master', cat: 'combos', name: 'Combo Master', price: 42.90, kcal: 1250,
    badge: 'Destaque', art: 'combo', tone: 'a',
    desc: 'Nosso campeão de vendas! Hambúrguer artesanal de 150g, queijo cheddar derretido, alface fresca, molho especial Byte, batata frita média crocante e bebida de sua escolha.',
    includes: ['Hambúrguer Master Byte', 'Batata Média', 'Refrigerante 500ml'],
    ingredients: ['Queijo Cheddar', 'Cebola Roxa', 'Alface e Tomate'],
    allergens: ['glúten (pão)', 'derivados de leite (queijo)']
  },
  {
    id: 'combo-byte', cat: 'combos', name: 'Combo Byte', price: 38.90, kcal: 1020,
    art: 'combo', tone: 'b',
    desc: 'Hambúrguer Byte Bacon com fatias de bacon crocante, cheddar e molho Byte, acompanhado de batata média e refrigerante gelado.',
    includes: ['Hambúrguer Byte Bacon', 'Batata Média', 'Refrigerante 500ml'],
    ingredients: ['Bacon crocante', 'Queijo Cheddar', 'Molho Byte'],
    allergens: ['glúten (pão)', 'derivados de leite (queijo)']
  },
  {
    id: 'combo-megabit', cat: 'combos', name: 'Combo Megabit', price: 49.90, kcal: 1680,
    art: 'combo', tone: 'c',
    desc: 'Para quem chegou com muita fome: hambúrguer duplo, cheddar em dobro, cebola caramelizada, batata grande e refrigerante de 700ml.',
    includes: ['Hambúrguer Mega Bit (duplo)', 'Batata Grande', 'Refrigerante 700ml'],
    ingredients: ['Queijo Cheddar', 'Picles', 'Cebola Caramelizada'],
    allergens: ['glúten (pão)', 'derivados de leite (queijo)']
  },
  {
    id: 'combo-glitch', cat: 'combos', name: 'Combo Glitch (Vegetariano)', price: 36.90, kcal: 850,
    art: 'combo', tone: 'd',
    desc: 'Hambúrguer de grão-de-bico com maionese verde, alface e tomate, batata média e suco natural. Sem carne, com muito sabor.',
    includes: ['Hambúrguer Glitch', 'Batata Média', 'Suco Natural 400ml'],
    ingredients: ['Maionese Verde', 'Cebola Roxa', 'Alface e Tomate'],
    allergens: ['glúten (pão)']
  },

  {
    id: 'rock-burger', cat: 'hamburgueres', name: 'Rock Burger', price: 34.90, kcal: 780,
    art: 'burger', tone: 'a',
    desc: 'Blend bovino de 150g, cheddar, cebola crocante e molho barbecue defumado no pão brioche.',
    includes: ['Pão brioche', 'Blend bovino 150g', 'Cheddar e molho barbecue'],
    ingredients: ['Queijo Cheddar', 'Cebola Crocante', 'Molho Barbecue'],
    allergens: ['glúten (pão)', 'derivados de leite (queijo)']
  },
  {
    id: 'byte-bacon', cat: 'hamburgueres', name: 'Byte Bacon', price: 36.90, kcal: 860,
    art: 'burger', tone: 'b',
    desc: 'Hambúrguer artesanal com bacon crocante, cheddar derretido e o molho especial Byte.',
    includes: ['Pão brioche', 'Blend bovino 150g', 'Bacon e cheddar'],
    ingredients: ['Bacon crocante', 'Queijo Cheddar', 'Molho Byte'],
    allergens: ['glúten (pão)', 'derivados de leite (queijo)']
  },
  {
    id: 'master-byte', cat: 'hamburgueres', name: 'Master Byte', price: 29.90, kcal: 640,
    art: 'burger', tone: 'c',
    desc: 'O clássico da casa: hambúrguer de 150g, queijo cheddar, alface, tomate e molho Byte.',
    includes: ['Pão brioche', 'Blend bovino 150g', 'Cheddar, alface e tomate'],
    ingredients: ['Queijo Cheddar', 'Cebola Roxa', 'Alface e Tomate'],
    allergens: ['glúten (pão)', 'derivados de leite (queijo)']
  },
  {
    id: 'glitch-veggie', cat: 'hamburgueres', name: 'Glitch Veggie', price: 27.90, kcal: 560,
    art: 'burger', tone: 'd',
    desc: 'Hambúrguer de grão-de-bico com maionese verde, alface, tomate e cebola roxa.',
    includes: ['Pão brioche', 'Hambúrguer de grão-de-bico'],
    ingredients: ['Maionese Verde', 'Cebola Roxa', 'Alface e Tomate'],
    allergens: ['glúten (pão)']
  },

  {
    id: 'batata-turbo', cat: 'acompanhamentos', name: 'Batata Turbo', price: 16.90, kcal: 420,
    art: 'fries', tone: 'a',
    desc: 'Batata frita crocante com cobertura de cheddar cremoso e bacon em cubos.',
    includes: ['Porção média (200g)'],
    ingredients: ['Cheddar cremoso', 'Bacon em cubos'],
    allergens: ['derivados de leite (cheddar)']
  },
  {
    id: 'onion-rings', cat: 'acompanhamentos', name: 'Onion Rings', price: 18.90, kcal: 380,
    art: 'rings', tone: 'b',
    desc: 'Anéis de cebola empanados e fritos na hora, com molho barbecue à parte.',
    includes: ['8 anéis de cebola', 'Molho barbecue'],
    allergens: ['glúten (empanado)']
  },
  {
    id: 'nuggets', cat: 'acompanhamentos', name: 'Nuggets (6 un.)', price: 19.90, kcal: 340,
    art: 'fries', tone: 'c',
    desc: 'Seis nuggets de frango crocantes acompanhados de molho Byte.',
    includes: ['6 nuggets', 'Molho Byte'],
    allergens: ['glúten (empanado)']
  },

  {
    id: 'refrigerante', cat: 'bebidas', name: 'Coca-Cola 350ml', price: 8.90, kcal: 150,
    art: 'drink', tone: 'a',
    desc: 'Lata gelada de 350ml.'
  },
  {
    id: 'suco', cat: 'bebidas', name: 'Suco Natural 400ml', price: 10.90, kcal: 120,
    art: 'juice', tone: 'c',
    desc: 'Suco de laranja natural, feito na hora e sem adição de açúcar.'
  },
  {
    id: 'agua', cat: 'bebidas', name: 'Água 500ml', price: 5.00, kcal: 0,
    art: 'drink', tone: 'd',
    desc: 'Água mineral sem gás, 500ml.'
  },

  {
    id: 'milkshake', cat: 'sobremesas', name: 'Milk-shake', price: 18.90, kcal: 520,
    art: 'shake', tone: 'b',
    desc: 'Milk-shake cremoso de baunilha com chantilly e calda de morango.',
    allergens: ['derivados de leite']
  },
  {
    id: 'brownie', cat: 'sobremesas', name: 'Brownie Byte', price: 14.90, kcal: 380,
    art: 'brownie', tone: 'a',
    desc: 'Brownie de chocolate meio amargo com sorvete de creme.',
    allergens: ['glúten', 'derivados de leite', 'ovos']
  }
];

/* ---------------------------------------------------------
   Ilustrações (SVG inline, sem dependência externa)
   --------------------------------------------------------- */
const INK = '#111';

const ART = (() => {
  const st = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

  const burger = (t = '') => `<g transform="${t}">
    <ellipse cx="100" cy="118" rx="60" ry="6" fill="rgba(0,0,0,.28)"/>
    <path d="M46 100h108v6a12 12 0 0 1-12 12H58a12 12 0 0 1-12-12z" fill="#D98A26" ${st}/>
    <rect x="44" y="86" width="112" height="16" rx="8" fill="#5B2F1A" ${st}/>
    <path d="M44 75H156V83L142 83L134 96L126 83H74L66 96L58 83H44Z" fill="#FFC933" ${st}/>
    <rect x="48" y="65" width="104" height="11" rx="5" fill="#E4432D" ${st}/>
    <path d="M42 61q7 9 14 0t14 0t14 0t14 0t14 0t14 0t14 0t14 0v8H42Z" fill="#63B83F" ${st}/>
    <path d="M46 61C46 32 72 22 100 22S154 32 154 61Z" fill="#E59A2F" ${st}/>
    <g fill="#FFF1C7">
      <ellipse cx="78" cy="45" rx="5" ry="2.6" transform="rotate(-25 78 45)"/>
      <ellipse cx="101" cy="36" rx="5" ry="2.6"/>
      <ellipse cx="124" cy="46" rx="5" ry="2.6" transform="rotate(25 124 46)"/>
      <ellipse cx="92" cy="54" rx="5" ry="2.6" transform="rotate(10 92 54)"/>
      <ellipse cx="114" cy="55" rx="5" ry="2.6" transform="rotate(-10 114 55)"/>
    </g>
  </g>`;

  const fries = (t = '') => `<g transform="${t}">
    <g fill="#FFCF33" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
      <rect x="6"  y="-24" width="9" height="34" rx="2" transform="rotate(-8 10 -7)"/>
      <rect x="16" y="-32" width="9" height="42" rx="2"/>
      <rect x="26" y="-22" width="9" height="32" rx="2" transform="rotate(4 30 -6)"/>
      <rect x="36" y="-34" width="9" height="44" rx="2" transform="rotate(-4 40 -12)"/>
      <rect x="46" y="-26" width="9" height="36" rx="2" transform="rotate(9 50 -8)"/>
    </g>
    <path d="M2 0H58L52 58H8Z" fill="#E4322B" ${st}/>
    <rect x="16" y="20" width="28" height="20" rx="4" fill="#FFD100" stroke="${INK}" stroke-width="2.5"/>
    <path d="M24 26h12M24 34h12" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  </g>`;

  const cup = (t = '', color = '#FF2E63', shake = false) => `<g transform="${t}">
    <path d="M28 -4L32 -30L46 -38" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M28 -4L32 -30L46 -38" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    ${shake ? `<path d="M6 -6q24-26 48 0z" fill="#fff" ${st}/><circle cx="30" cy="-24" r="5" fill="#E4322B" stroke="${INK}" stroke-width="2.5"/>` : ''}
    <rect x="4" y="-8" width="52" height="10" rx="4" fill="#fff" ${st}/>
    <path d="M8 2H52L46 66H14Z" fill="${color}" ${st}/>
    <path d="M11 24H49L47 42H13Z" fill="#FFD100" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  </g>`;

  const rings = () => {
    const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${INK}" stroke-width="17"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#E59A2F" stroke-width="11"/>`;
    return `<ellipse cx="100" cy="118" rx="64" ry="6" fill="rgba(0,0,0,.28)"/>
      ${ring(66, 88, 24)}${ring(134, 88, 24)}${ring(100, 62, 26)}`;
  };

  const brownie = () => `<ellipse cx="100" cy="118" rx="62" ry="6" fill="rgba(0,0,0,.28)"/>
    <path d="M42 62l60-22 58 22v40l-58 18-60-18z" fill="#5B2F1A" ${st}/>
    <path d="M42 62l60 20 58-20" fill="none" ${st}/>
    <path d="M102 82v38" ${st} fill="none"/>
    <path d="M58 60l44-16 44 16-44 15z" fill="#FFF1C7" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="102" cy="38" r="9" fill="#E4322B" stroke="${INK}" stroke-width="3"/>`;

  const scenes = {
    combo: () =>
      cup('translate(4 52) scale(.9)') +
      fries('translate(140 54) scale(.9)') +
      burger('translate(18 20) scale(.82)'),
    burger: () => burger('translate(10 2) scale(.9)'),
    fries:  () => `<ellipse cx="100" cy="122" rx="52" ry="6" fill="rgba(0,0,0,.28)"/>` + fries('translate(64 46) scale(1.45)'),
    rings:  rings,
    drink:  () => `<ellipse cx="100" cy="126" rx="42" ry="6" fill="rgba(0,0,0,.28)"/>` + cup('translate(68 52) scale(1.25)', '#E4322B'),
    juice:  () => `<ellipse cx="100" cy="126" rx="42" ry="6" fill="rgba(0,0,0,.28)"/>` + cup('translate(68 52) scale(1.25)', '#FF9A1F'),
    shake:  () => `<ellipse cx="100" cy="126" rx="42" ry="6" fill="rgba(0,0,0,.28)"/>` + cup('translate(68 56) scale(1.2)', '#FF8FB1', true),
    brownie: brownie
  };

  return (kind) => `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${(scenes[kind] || scenes.burger)()}</svg>`;
})();

/* Caixa da ilustração (fundo colorido + SVG). */
function artBox(product, size = 'card') {
  return `<div class="art art--${product.tone} art--${size}">${ART(product.art)}</div>`;
}
