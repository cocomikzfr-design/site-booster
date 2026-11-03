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
  tagline: 'des classeurs zippés de 160 cartes pour protéger et sublimer ta collection pokémon',
  image: img('hero-binder.webp'),
  imageAlt: 'Classeur zippé bleu, fermé, entouré de cartes Pokémon',
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
      'Jusqu’à 160 cartes, 4 par page : classe ta collection par série, par type ou par rareté et retrouve chaque carte en quelques secondes.',
  },
  {
    title: 'Présentation',
    description:
      'Feuillette tes pages comme un vrai album et montre tes plus belles cartes holo à tes amis.',
  },
  {
    title: 'Transport',
    description:
      'La fermeture éclair fait le tour du classeur : tes cartes restent en place, même au fond du sac les jours d’échange.',
  },
  {
    title: 'Petit prix',
    description:
      'Des classeurs à prix doux pour commencer ta collection ou l’agrandir sans vider ta tirelire.',
  },
];

// ---------- Cartes rangées dans le classeur qui s'ouvre ----------

export const CARD_ART = (id: number) => img(`art/${id}.webp`);

type CardType = 'electric' | 'fire' | 'water' | 'grass' | 'psychic' | 'ghost' | 'dragon' | 'normal' | 'fairy' | 'ice' | 'dark';

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
  ice: ['#effcff', '#7fd6ea', '#2a7f9e'],
  dark: ['#d8d3e0', '#4b4459', '#17131f'],
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
  ice: 'Glace',
  dark: 'Ténèbres',
};

export const POKEMON: Record<number, { name: string; type: CardType }> = {
  1: { name: 'Bulbizarre', type: 'grass' },
  3: { name: 'Florizarre', type: 'grass' },
  4: { name: 'Salamèche', type: 'fire' },
  6: { name: 'Dracaufeu', type: 'fire' },
  7: { name: 'Carapuce', type: 'water' },
  9: { name: 'Tortank', type: 'water' },
  25: { name: 'Pikachu', type: 'electric' },
  26: { name: 'Raichu', type: 'electric' },
  54: { name: 'Psykokwak', type: 'water' },
  94: { name: 'Ectoplasma', type: 'ghost' },
  129: { name: 'Magicarpe', type: 'water' },
  130: { name: 'Léviator', type: 'water' },
  131: { name: 'Lokhlass', type: 'ice' },
  133: { name: 'Évoli', type: 'normal' },
  134: { name: 'Aquali', type: 'water' },
  135: { name: 'Voltali', type: 'electric' },
  136: { name: 'Pyroli', type: 'fire' },
  143: { name: 'Ronflex', type: 'normal' },
  145: { name: 'Électhor', type: 'electric' },
  146: { name: 'Sulfura', type: 'fire' },
  150: { name: 'Mewtwo', type: 'psychic' },
  151: { name: 'Mew', type: 'psychic' },
  155: { name: 'Héricendre', type: 'fire' },
  175: { name: 'Togepi', type: 'fairy' },
  197: { name: 'Noctali', type: 'dark' },
  249: { name: 'Lugia', type: 'psychic' },
  250: { name: 'Ho-Oh', type: 'fire' },
  257: { name: 'Braségali', type: 'fire' },
  384: { name: 'Rayquaza', type: 'dragon' },
  778: { name: 'Mimiqui', type: 'ghost' },
};

export const CARD_FRAMES = {
  silver: 'linear-gradient(140deg,#f4f4f6,#b9bcc4 45%,#f8f8fa 60%,#a6a9b2)',
  gold: 'linear-gradient(140deg,#fff3c4,#d6a740 40%,#fff0b0 58%,#b8862a)',
};

export type BinderLook = {
  cover: string; // image de la couverture (sans tirette)
  shell: string; // couleur du bord intérieur
  spine: string; // couleur du dos
  glow: string; // halo derrière le classeur
  frame: keyof typeof CARD_FRAMES;
  left: (number | null)[]; // 4 pochettes de la page de gauche (null = vide)
  right: (number | null)[]; // 4 pochettes de la page de droite
};

// Le classeur vendu (les deux liens AliExpress mènent à ce même classeur).
// Prix : celui indiqué dans ton premier lien (12,88 € au lieu de 17,30 €).
export const PRODUCT = {
  name: 'Classeur zippé',
  specs: '160 cartes · 4 pochettes par page',
  price: '12,88 €' as string | null,
  oldPrice: '17,30 €',
  url: 'https://nl.aliexpress.com/item/1005007540143317.html',
  // Deuxième lien du même classeur, gardé ici au cas où.
  altUrl: 'https://nl.aliexpress.com/item/1005010806342830.html',
};

export type BinderColor = {
  id: string;
  label: string;
  swatch: string; // couleur du bouton de choix
  images: { top: string; bottom: string; tall: string };
  binder: BinderLook;
};

const look = (
  id: string,
  shades: [string, string, string],
  glow: string,
  frame: BinderLook['frame'],
  left: (number | null)[],
  right: (number | null)[],
): BinderLook => ({
  cover: img(`cover-${id}.webp`),
  shell: `linear-gradient(160deg,${shades[0]},${shades[1]} 55%,${shades[2]})`,
  spine: `linear-gradient(90deg,${shades[2]},${shades[1]} 60%,${shades[2]})`,
  glow,
  frame,
  left,
  right,
});

const photos = (id: string) => ({
  top: img(`p-${id}-a.webp`),
  bottom: img(`p-${id}-b.webp`),
  tall: img(`p-${id}-c.webp`),
});

// Les 5 couleurs, dans l'ordre de tes photos.
export const COLORS: BinderColor[] = [
  {
    id: 'rouge',
    label: 'Rouge',
    swatch: '#a5162b',
    images: photos('rouge'),
    binder: look('rouge', ['#d02a3e', '#a5162b', '#6e0c1b'], 'rgba(208, 42, 62, 0.35)', 'gold', [6, 4, 146, 250], [136, 155, 257, null]),
  },
  {
    id: 'vert',
    label: 'Vert',
    swatch: '#80ab11',
    images: photos('vert'),
    binder: look('vert', ['#a9d136', '#80ab11', '#557a06'], 'rgba(128, 171, 17, 0.32)', 'silver', [1, 3, 25, 133], [143, 175, 54, null]),
  },
  {
    id: 'marine',
    label: 'Bleu marine',
    swatch: '#1d3044',
    images: photos('marine'),
    binder: look('marine', ['#33507a', '#1d3044', '#0f1a27'], 'rgba(70, 110, 170, 0.3)', 'silver', [94, 197, 150, 151], [249, 384, 778, null]),
  },
  {
    id: 'bleu',
    label: 'Bleu',
    swatch: '#346ac0',
    images: photos('bleu'),
    binder: look('bleu', ['#5a90e4', '#346ac0', '#1f4689'], 'rgba(52, 106, 192, 0.35)', 'silver', [7, 9, 130, 131], [134, 54, 129, null]),
  },
  {
    id: 'orange',
    label: 'Orange',
    swatch: '#d6692e',
    images: photos('orange'),
    binder: look('orange', ['#f19456', '#d6692e', '#9a4719'], 'rgba(214, 105, 46, 0.35)', 'gold', [25, 26, 135, 145], [6, 4, 136, null]),
  },
];
