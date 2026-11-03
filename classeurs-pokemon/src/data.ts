// Tout le contenu du site est ici : textes, produits, prix, liens et images.
// Pour mettre tes vraies photos produit, remplace les fichiers dans public/images/
// (mêmes noms) ou change les noms ci-dessous.

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

export const BRAND = 'Les Classeurs de Jack';

// À remplacer par ta vraie adresse.
export const CONTACT_EMAIL = 'ton-email@exemple.com';

export const NAV_LINKS = [
  { label: 'À propos', href: '#apropos' },
  { label: 'Avantages', href: '#avantages' },
  { label: 'Produits', href: '#produits' },
  { label: 'Contact', href: '#contact' },
];

export const HERO = {
  heading: 'Classeurs',
  tagline: 'des classeurs pensés pour protéger et sublimer ta collection de cartes pokémon',
  image: img('hero-binder.webp'),
  imageAlt: 'Classeur jaune fermé avec Pikachu sur la couverture, entouré de cartes',
};

// 21 visuels du bandeau qui défile : 11 sur la première ligne, 10 sur la seconde.
export const MARQUEE_IMAGES = Array.from({ length: 21 }, (_, i) =>
  img(`tile-${String(i + 1).padStart(2, '0')}.webp`),
);

export const ABOUT = {
  heading: 'À propos',
  text: "Ici, on choisit des classeurs solides et stylés pour que chaque carte de ta collection reste comme neuve. Que tu ouvres ton premier booster ou que tu complètes un set entier, on t'aide à ranger, protéger et montrer tes plus belles cartes. Construisons ensemble la collection de tes rêves !",
  images: {
    topLeft: img('pikachu.webp'),
    bottomLeft: img('corner-card.webp'),
    topRight: img('ectoplasma.webp'),
    bottomRight: img('corner-binder.webp'),
  },
};

export const SERVICES = [
  {
    title: 'Protection',
    description:
      'Des pochettes transparentes qui gardent tes cartes à l’abri des rayures, de la poussière et des coins abîmés.',
  },
  {
    title: 'Rangement',
    description:
      'Classe ta collection par série, par type ou par rareté et retrouve n’importe quelle carte en quelques secondes.',
  },
  {
    title: 'Présentation',
    description:
      'Feuillette tes pages comme un vrai album et montre tes plus belles cartes holo à tes amis.',
  },
  {
    title: 'Transport',
    description:
      'Un format pratique à glisser dans ton sac pour les échanges, les tournois et les après-midis entre dresseurs.',
  },
  {
    title: 'Petit prix',
    description:
      'Des classeurs à prix doux pour commencer ta collection ou l’agrandir sans vider ta tirelire.',
  },
];

// ---------- Cartes rangées dans le classeur qui s'ouvre ----------

export const CARD_ART = (id: number) => img(`art/${id}.webp`);

type CardType = 'electric' | 'fire' | 'water' | 'grass' | 'psychic' | 'ghost' | 'dragon' | 'normal' | 'fairy';

// Couleurs de fond des cartes : [centre, milieu, bord]
export const TYPE_COLORS: Record<CardType, [string, string, string]> = {
  electric: ['#fff3a6', '#f6c623', '#c9780c'],
  fire: ['#ffd0a1', '#f06a2a', '#8f1b0f'],
  water: ['#c9e7ff', '#4f8ff0', '#1b3c9c'],
  grass: ['#e2ffc2', '#5fbf4a', '#1f6b34'],
  psychic: ['#ffd6ec', '#e85a9c', '#7a1f6b'],
  ghost: ['#e3d3ff', '#7a5bc4', '#2a1857'],
  dragon: ['#d9d2ff', '#6a46e6', '#25127a'],
  normal: ['#fbf6e1', '#c9b98a', '#6e6243'],
  fairy: ['#fff0f7', '#f39acb', '#a54a83'],
};

export const TYPE_LABELS: Record<CardType, string> = {
  electric: 'Électrik',
  fire: 'Feu',
  water: 'Eau',
  grass: 'Plante',
  psychic: 'Psy',
  ghost: 'Spectre',
  dragon: 'Dragon',
  normal: 'Normal',
  fairy: 'Fée',
};

export const POKEMON: Record<number, { name: string; type: CardType }> = {
  1: { name: 'Bulbizarre', type: 'grass' },
  4: { name: 'Salamèche', type: 'fire' },
  6: { name: 'Dracaufeu', type: 'fire' },
  7: { name: 'Carapuce', type: 'water' },
  25: { name: 'Pikachu', type: 'electric' },
  26: { name: 'Raichu', type: 'electric' },
  39: { name: 'Rondoudou', type: 'fairy' },
  52: { name: 'Miaouss', type: 'normal' },
  54: { name: 'Psykokwak', type: 'water' },
  94: { name: 'Ectoplasma', type: 'ghost' },
  129: { name: 'Magicarpe', type: 'water' },
  133: { name: 'Évoli', type: 'normal' },
  135: { name: 'Voltali', type: 'electric' },
  136: { name: 'Pyroli', type: 'fire' },
  143: { name: 'Ronflex', type: 'normal' },
  145: { name: 'Électhor', type: 'electric' },
  146: { name: 'Sulfura', type: 'fire' },
  149: { name: 'Dracolosse', type: 'dragon' },
  150: { name: 'Mewtwo', type: 'psychic' },
  151: { name: 'Mew', type: 'psychic' },
  155: { name: 'Héricendre', type: 'fire' },
  175: { name: 'Togepi', type: 'fairy' },
  249: { name: 'Lugia', type: 'psychic' },
  250: { name: 'Ho-Oh', type: 'fire' },
  257: { name: 'Braségali', type: 'fire' },
  384: { name: 'Rayquaza', type: 'dragon' },
  445: { name: 'Carchacrok', type: 'dragon' },
};

export const CARD_FRAMES = {
  silver: 'linear-gradient(140deg,#f4f4f6,#b9bcc4 45%,#f8f8fa 60%,#a6a9b2)',
  gold: 'linear-gradient(140deg,#fff3c4,#d6a740 40%,#fff0b0 58%,#b8862a)',
};

export type BinderLook = {
  cover: string; // image de la couverture (sans tirette)
  shell: string; // couleur de l'intérieur du classeur
  spine: string; // couleur du dos
  glow: string; // halo derrière le classeur
  page: string; // fond des pages
  frame: keyof typeof CARD_FRAMES;
  left: (number | null)[]; // 9 pochettes de la page de gauche (null = vide)
  right: (number | null)[]; // 9 pochettes de la page de droite
};

export type Product = {
  number: string;
  category: string;
  name: string;
  price: string | null; // null = pas de prix affiché
  oldPrice?: string;
  url: string;
  images: { top: string; bottom: string; tall: string };
  binder: BinderLook;
};

// Prix du produit 01 : celui indiqué dans ton lien AliExpress (12,88 € au lieu de 17,30 €).
// Prix du produit 02 : inconnu pour l'instant, remplace null par "XX,XX €".
export const PRODUCTS: Product[] = [
  {
    number: '01',
    category: 'Classeur de cartes',
    name: 'Classeur Éclair',
    price: '12,88 €',
    oldPrice: '17,30 €',
    url: 'https://nl.aliexpress.com/item/1005007540143317.html',
    images: { top: img('p1-a.webp'), bottom: img('p1-b.webp'), tall: img('p1-c.webp') },
    binder: {
      cover: img('cover-eclair.webp'),
      shell: 'linear-gradient(160deg,#ffd84a,#f2b318 55%,#d98e0a)',
      spine: 'linear-gradient(90deg,#8a5806,#f0b21c 60%,#b8770a)',
      glow: 'rgba(242, 179, 24, 0.35)',
      page: '#121214',
      frame: 'silver',
      left: [25, 26, 135, 145, null, 25, 133, 52, 39],
      right: [143, 175, 129, 54, 7, 1, 4, null, null],
    },
  },
  {
    number: '02',
    category: 'Classeur de cartes',
    name: 'Classeur Flamme',
    price: null,
    url: 'https://nl.aliexpress.com/item/1005010806342830.html',
    images: { top: img('p2-a.webp'), bottom: img('p2-b.webp'), tall: img('p2-c.webp') },
    binder: {
      cover: img('cover-flamme.webp'),
      shell: 'linear-gradient(160deg,#e8452c,#b81f16 55%,#7d120c)',
      spine: 'linear-gradient(90deg,#3d0805,#a81b12 60%,#5e0d08)',
      glow: 'rgba(232, 69, 44, 0.35)',
      page: '#140e0e',
      frame: 'gold',
      left: [6, 4, 146, 250, 136, 155, 257, null, 6],
      right: [149, 384, 445, 150, 151, null, 249, 94, null],
    },
  },
];
