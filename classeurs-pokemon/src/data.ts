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

// ---------- Vraies cartes rangées dans le classeur qui s'ouvre ----------
// Images TCGdex (en français), copiées dans public/images/cards par studio/export.py.

export const CARD_IMG = (key: string) => img(`cards/${key}.webp`);

export const CARDS: Record<string, { name: string; rarity: string; set: string; number: string }> = {
  'base1-10': { name: "Mewtwo", rarity: "Rare", set: "Set de Base", number: '10/102' },
  'base1-14': { name: "Raichu", rarity: "Rare", set: "Set de Base", number: '14/102' },
  'base1-15': { name: "Florizarre", rarity: "Rare", set: "Set de Base", number: '15/102' },
  'base1-16': { name: "Électhor", rarity: "Rare", set: "Set de Base", number: '16/102' },
  'base1-2': { name: "Tortank", rarity: "Rare", set: "Set de Base", number: '2/102' },
  'base1-4': { name: "Dracaufeu", rarity: "Rare", set: "Set de Base", number: '4/102' },
  'base1-58': { name: "Pikachu", rarity: "Commune", set: "Set de Base", number: '58/102' },
  'base1-6': { name: "Léviator", rarity: "Rare", set: "Set de Base", number: '6/102' },
  'base3-5': { name: "Ectoplasma", rarity: "Rare", set: "Fossile", number: '5/62' },
  'sv03.5-026': { name: "Raichu", rarity: "Rare", set: "151", number: '026/165' },
  'sv03.5-059': { name: "Arcanin", rarity: "Peu Commune", set: "151", number: '059/165' },
  'sv03.5-071': { name: "Empiflor", rarity: "Peu Commune", set: "151", number: '071/165' },
  'sv03.5-094': { name: "Ectoplasma", rarity: "Rare", set: "151", number: '094/165' },
  'sv03.5-131': { name: "Lokhlass", rarity: "Peu Commune", set: "151", number: '131/165' },
  'sv03.5-134': { name: "Aquali", rarity: "Rare", set: "151", number: '134/165' },
  'sv03.5-135': { name: "Voltali", rarity: "Rare", set: "151", number: '135/165' },
  'sv03.5-143': { name: "Ronflex", rarity: "Peu Commune", set: "151", number: '143/165' },
  'sv03.5-146': { name: "Sulfura", rarity: "Rare", set: "151", number: '146/165' },
  'sv03.5-150': { name: "Mewtwo", rarity: "Rare", set: "151", number: '150/165' },
  'sv03.5-166': { name: "Bulbizarre", rarity: "Illustration rare", set: "151", number: '166/165' },
  'sv03.5-167': { name: "Herbizarre", rarity: "Illustration rare", set: "151", number: '167/165' },
  'sv03.5-168': { name: "Salamèche", rarity: "Illustration rare", set: "151", number: '168/165' },
  'sv03.5-169': { name: "Reptincel", rarity: "Illustration rare", set: "151", number: '169/165' },
  'sv03.5-170': { name: "Carapuce", rarity: "Illustration rare", set: "151", number: '170/165' },
  'sv03.5-171': { name: "Carabaffe", rarity: "Illustration rare", set: "151", number: '171/165' },
  'sv03.5-172': { name: "Chenipan", rarity: "Illustration rare", set: "151", number: '172/165' },
  'sv03.5-173': { name: "Pikachu", rarity: "Illustration rare", set: "151", number: '173/165' },
  'sv03.5-186': { name: "Feunard-ex", rarity: "Ultra Rare", set: "151", number: '186/165' },
  'sv03.5-193': { name: "Mew-ex", rarity: "Ultra Rare", set: "151", number: '193/165' },
  'sv03.5-198': { name: "Florizarre-ex", rarity: "Illustration spéciale rare", set: "151", number: '198/165' },
  'sv03.5-199': { name: "Dracaufeu-ex", rarity: "Illustration spéciale rare", set: "151", number: '199/165' },
  'sv03.5-200': { name: "Tortank-ex", rarity: "Illustration spéciale rare", set: "151", number: '200/165' },
  'sv03.5-201': { name: "Alakazam-ex", rarity: "Illustration spéciale rare", set: "151", number: '201/165' },
  'sv03.5-202': { name: "Électhor-ex", rarity: "Illustration spéciale rare", set: "151", number: '202/165' },
  'sv03.5-205': { name: "Mew-ex", rarity: "Hyper rare", set: "151", number: '205/165' },
};

export type BinderLook = {
  cover: string; // image de la couverture (sans tirette)
  shell: string; // couleur du bord intérieur
  spine: string; // couleur du dos
  glow: string; // halo derrière le classeur
  left: (string | null)[]; // 4 pochettes de la page de gauche (null = vide)
  right: (string | null)[]; // 4 pochettes de la page de droite
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
  cards: string[], // 7 cartes : 4 à gauche, 3 à droite
): BinderLook => ({
  cover: img(`cover-${id}.webp`),
  shell: `linear-gradient(160deg,${shades[0]},${shades[1]} 55%,${shades[2]})`,
  spine: `linear-gradient(90deg,${shades[2]},${shades[1]} 60%,${shades[2]})`,
  glow,
  left: cards.slice(0, 4),
  right: [...cards.slice(4, 7), null],
});

// Tes photos AliExpress, avec de vraies cartes Pokémon à la place des cartes Magic (studio/photos.py)
const photos = (id: string) => ({
  top: img(`p-${id}-a.webp`), // zoom sur la couverture
  bottom: img(`p-${id}-b.webp`), // zoom sur les pages
  tall: img(`p-${id}-photo.webp`), // photo entière
});

// Les 5 couleurs, dans l'ordre de tes photos.
export const COLORS: BinderColor[] = [
  {
    id: 'rouge',
    label: 'Rouge',
    swatch: '#a5162b',
    images: photos('rouge'),
    binder: look('rouge', ['#d02a3e', '#a5162b', '#6e0c1b'], 'rgba(208, 42, 62, 0.35)', ['base1-4', 'sv03.5-168', 'sv03.5-169', 'sv03.5-199', 'sv03.5-059', 'sv03.5-186', 'sv03.5-146']),
  },
  {
    id: 'vert',
    label: 'Vert',
    swatch: '#80ab11',
    images: photos('vert'),
    binder: look('vert', ['#a9d136', '#80ab11', '#557a06'], 'rgba(128, 171, 17, 0.32)', ['sv03.5-166', 'sv03.5-167', 'sv03.5-198', 'base1-15', 'sv03.5-071', 'sv03.5-143', 'sv03.5-172']),
  },
  {
    id: 'marine',
    label: 'Bleu marine',
    swatch: '#1d3044',
    images: photos('marine'),
    binder: look('marine', ['#33507a', '#1d3044', '#0f1a27'], 'rgba(70, 110, 170, 0.3)', ['base1-10', 'sv03.5-205', 'base3-5', 'sv03.5-094', 'sv03.5-201', 'sv03.5-150', 'sv03.5-193']),
  },
  {
    id: 'bleu',
    label: 'Bleu',
    swatch: '#346ac0',
    images: photos('bleu'),
    binder: look('bleu', ['#5a90e4', '#346ac0', '#1f4689'], 'rgba(52, 106, 192, 0.35)', ['base1-2', 'sv03.5-170', 'sv03.5-171', 'sv03.5-200', 'base1-6', 'sv03.5-131', 'sv03.5-134']),
  },
  {
    id: 'orange',
    label: 'Orange',
    swatch: '#d6692e',
    images: photos('orange'),
    binder: look('orange', ['#f19456', '#d6692e', '#9a4719'], 'rgba(214, 105, 46, 0.35)', ['base1-58', 'sv03.5-173', 'sv03.5-026', 'sv03.5-202', 'base1-16', 'sv03.5-135', 'base1-14']),
  },
];
