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

export type Product = {
  number: string;
  category: string;
  name: string;
  price: string | null; // null = pas de prix affiché
  oldPrice?: string;
  url: string;
  images: { top: string; bottom: string; tall: string };
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
  },
  {
    number: '02',
    category: 'Classeur de cartes',
    name: 'Classeur Flamme',
    price: null,
    url: 'https://nl.aliexpress.com/item/1005010806342830.html',
    images: { top: img('p2-a.webp'), bottom: img('p2-b.webp'), tall: img('p2-c.webp') },
  },
];
