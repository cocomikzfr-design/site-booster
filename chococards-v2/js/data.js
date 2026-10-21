/* ==========================================================================
   ChocoCards v2 — DONNÉES DU SITE
   --------------------------------------------------------------------------
   C'est ici que l'on modifie le contenu « vivant » de la page d'accueil :
   produits, prix, statuts, sorties, tournois, catégories, menu…
   Pas besoin de toucher au HTML, au CSS ni aux animations.

   PHOTOS
   - image : chemin local (ex. 'assets/img/produits/mon-produit.webp')
             ou adresse web complète (ex. photo du distributeur, Shopify…).
             null = pas encore de photo : le site affiche une carte
             typographique holographique (code du set + format), jamais
             un faux visuel. Il suffit de remplir « image » pour la remplacer.
   - detoure : true si la photo est détourée (fond transparent, WebP/PNG) :
               le produit est alors posé entier sur un halo coloré.
   Format conseillé : carré 800 × 800 px minimum, WebP.

   STATUTS d'un produit
     'disponible'  → « Ajouter au panier »
     'precommande' → « Précommander »
     'bientot'     → « Bientôt disponible » (bouton désactivé)
     'rupture'     → « Rupture de stock » (bouton désactivé)
     'boutique'    → « Non disponible en ligne » + « Disponible en boutique à Nivelles »

   COULEURS (champ « couleur ») : 'citron' | 'menthe' | 'cyan' | 'rose' |
   'violet' | 'lilas' | 'corail' | 'peche' | 'ciel' | 'or'
   Les prix sont indicatifs : à vérifier avant la mise en ligne.
   ========================================================================== */

const DATA = {
  /* ---------- Infos boutique ---------- */
  boutique: {
    nom: 'ChocoCards',
    rue: 'Rue du Géant 15',
    codePostal: '1400',
    ville: 'Nivelles',
    region: 'Brabant wallon',
    pays: 'Belgique',
    telephone: '+32 465 16 83 13',
    telephoneLien: 'tel:+32465168313',
    email: 'contact@chococards.be',
    instagram: 'https://www.instagram.com/chococards.be/',
    instagramPseudo: '@chococards.be',
    itineraire: 'https://www.google.com/maps/dir/?api=1&destination=Rue%20du%20G%C3%A9ant%2015%2C%201400%20Nivelles%2C%20Belgique',
    parking: 'Stationnement facile dans les rues voisines et parkings publics à quelques minutes à pied.',
    retrait: 'Commandez en ligne et récupérez gratuitement votre colis en boutique.',
    // Index 0 = dimanche, 1 = lundi… (comme Date.getDay()). null = fermé.
    // ouverture / fermeture au format 24 h, pour savoir si la boutique est ouverte « maintenant ».
    horaires: [
      { jour: 'Dimanche', heures: '10h – 18h', ouverture: '10:00', fermeture: '18:00' },
      { jour: 'Lundi', heures: null },
      { jour: 'Mardi', heures: '10h – 19h', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Mercredi', heures: '10h – 19h', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Jeudi', heures: '10h – 19h', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Vendredi', heures: '10h – 19h', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Samedi', heures: '10h – 19h', ouverture: '10:00', fermeture: '19:00' }
    ]
  },

  /* ---------- Libellés des statuts ---------- */
  statuts: {
    disponible: { label: 'Disponible', bouton: 'Ajouter au panier', achat: true },
    precommande: { label: 'Précommande', bouton: 'Précommander', achat: true },
    bientot: { label: 'Bientôt disponible', bouton: 'Bientôt disponible', achat: false },
    rupture: { label: 'Rupture de stock', bouton: 'Rupture de stock', achat: false },
    boutique: { label: 'Non disponible en ligne', bouton: 'Disponible en boutique à Nivelles', achat: false }
  },

  /* ---------- Langues des produits ---------- */
  langues: {
    FR: 'Version française',
    JP: 'Version japonaise',
    EN: 'Version anglaise'
  },

  /* ---------- Produits ----------
     categorie : 'pokemon-30-ans' | 'pokemon' | 'one-piece'
     code      : code du set, affiché en grand sur la carte typographique
     format    : type de produit (ETB, Display ×36…)                        */
  produits: [
    // Pokémon fête ses 30 ans — vendus exclusivement en boutique physique
    { id: 'p30-etb', nom: 'Coffret Dresseur d’Élite (ETB) — Pokémon 30 ans', court: 'ETB', prix: 64.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', code: 'ETB', format: '30 ans', couleur: 'or', image: 'assets/img/produits/pokemon-30-ans-etb.webp', detoure: true },
    { id: 'p30-upc', nom: 'Ultra-Premium Collection (UPC) — Pokémon 30 ans', court: 'UPC', prix: 149.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', code: 'UPC', format: '30 ans', couleur: 'or', image: null, detoure: false },
    { id: 'p30-tin', nom: 'Mini Tin — Pokémon 30 ans', court: 'Mini Tin', prix: 14.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', code: 'TIN', format: '30 ans · Mini Tin', couleur: 'rose', image: null, detoure: false },
    { id: 'p30-bundle', nom: 'Booster Bundle — Pokémon 30 ans', court: 'Booster Bundle', prix: 39.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', code: 'BUNDLE', format: '30 ans · Booster', couleur: 'lilas', image: null, detoure: false },

    // L'univers Pokémon
    { id: 'pk-me06-display', nom: 'Display ME06 Règne Delta — 36 boosters', prix: 199.90, statut: 'precommande', categorie: 'pokemon', langue: 'FR', code: 'ME06', format: 'Display ×36', couleur: 'menthe', image: null, detoure: false },
    { id: 'pk-me06-etb', nom: 'Coffret Dresseur d’Élite ME06 Règne Delta', prix: 59.90, statut: 'precommande', categorie: 'pokemon', langue: 'FR', code: 'ME06', format: 'ETB', couleur: 'menthe', image: 'assets/img/produits/pokemon-me06-etb.webp', detoure: true },
    { id: 'pk-me05-display', nom: 'Display ME05 — 36 boosters', prix: 189.90, statut: 'disponible', categorie: 'pokemon', langue: 'FR', code: 'ME05', format: 'Display ×36', couleur: 'ciel', image: null, detoure: false },
    { id: 'pk-me05-booster', nom: 'Booster ME05', prix: 5.90, statut: 'disponible', categorie: 'pokemon', langue: 'FR', code: 'ME05', format: 'Booster', couleur: 'ciel', image: null, detoure: false },
    { id: 'pk-jp-30th', nom: 'Booster japonais 30th Celebration', prix: 6.90, statut: 'disponible', categorie: 'pokemon', langue: 'JP', code: '30TH', format: 'Booster JP', couleur: 'citron', image: 'assets/img/produits/pokemon-japonais-30th-celebration-booster.webp', detoure: true },
    { id: 'pk-pikachu-ex', nom: 'Pikachu-ex 30e anniversaire — carte à l’unité', prix: 4.90, statut: 'disponible', categorie: 'pokemon', langue: 'FR', code: '30 ANS', format: 'Carte', couleur: 'citron', image: 'assets/img/produits/pokemon-carte-pikachu-ex-30-ans.webp', detoure: true },
    { id: 'pk-tripack', nom: 'Tripack ME04', prix: 17.90, statut: 'rupture', categorie: 'pokemon', langue: 'FR', code: 'ME04', format: 'Tripack', couleur: 'lilas', image: null, detoure: false },
    { id: 'pk-premium', nom: 'Coffret Collection Premium', prix: 39.90, statut: 'bientot', categorie: 'pokemon', langue: 'FR', code: 'PREMIUM', format: 'Coffret', couleur: 'violet', image: null, detoure: false },

    // One Piece Card Game
    { id: 'op-op18-display', nom: 'Display OP-18 — 24 boosters', prix: 109.90, statut: 'precommande', categorie: 'one-piece', langue: 'EN', code: 'OP-18', format: 'Display ×24', couleur: 'corail', image: null, detoure: false },
    { id: 'op-eb05-display', nom: 'Display Extra Booster EB-05 — 24 boosters', prix: 119.90, statut: 'precommande', categorie: 'one-piece', langue: 'EN', code: 'EB-05', format: 'Display ×24', couleur: 'peche', image: null, detoure: false },
    { id: 'op-op17-display', nom: 'Display OP-17 — 24 boosters', prix: 104.90, statut: 'disponible', categorie: 'one-piece', langue: 'EN', code: 'OP-17', format: 'Display ×24', couleur: 'citron', image: null, detoure: false },
    { id: 'op-op17-booster', nom: 'Booster OP-17 — Les Guerriers les plus puissants au monde', prix: 4.90, statut: 'disponible', categorie: 'one-piece', langue: 'FR', code: 'OP-17', format: 'Booster', couleur: 'citron', image: 'assets/img/produits/one-piece-op17-booster-fr.webp', detoure: true },
    { id: 'op-op16-booster', nom: 'Booster OP-16 — L’Heure de la bataille décisive', prix: 4.90, statut: 'disponible', categorie: 'one-piece', langue: 'FR', code: 'OP-16', format: 'Booster', couleur: 'corail', image: 'assets/img/produits/one-piece-op16-booster-fr.webp', detoure: true },
    { id: 'op-starter', nom: 'Starter Deck', prix: 14.90, statut: 'boutique', categorie: 'one-piece', langue: 'EN', code: 'ST', format: 'Starter Deck', couleur: 'rose', image: null, detoure: false },
    { id: 'op-double', nom: 'Double Pack Set', prix: 9.90, statut: 'rupture', categorie: 'one-piece', langue: 'EN', code: 'DP', format: 'Double Pack', couleur: 'lilas', image: null, detoure: false },
    { id: 'op-premium', nom: 'Premium Card Collection', prix: 29.90, statut: 'bientot', categorie: 'one-piece', langue: 'EN', code: 'PRB', format: 'Premium', couleur: 'cyan', image: null, detoure: false }
  ],

  /* ---------- Précommande mise en avant (compte à rebours) ---------- */
  precommandeVedette: {
    produitId: 'pk-me06-display',
    // Autres produits proposés à côté (même extension)
    autresIds: ['pk-me06-etb'],
    titre: 'ME06 — Règne Delta',
    titreDebut: 'ME06 —',
    titreAccent: 'Règne Delta',
    code: 'ME06',
    jeu: 'Pokémon',
    // Photo mise en scène (vraie photo de la boutique)
    image: 'assets/img/produits/pokemon-me06-etb.webp',
    imageAlt: 'Coffret Dresseur d’Élite ME06 Règne Delta',
    // Date et heure de sortie (heure belge)
    sortie: '2026-11-06T00:00:00+01:00',
    sortieTexte: '6 novembre 2026',
    texte: 'La nouvelle extension Pokémon arrive le 6 novembre 2026. Réservez dès maintenant vos displays et coffrets : on vous les met de côté dès l’arrivée du stock.'
  },

  /* ---------- Explorez la boutique (9 catégories) ---------- */
  categories: [
    { id: 'pokemon', titre: 'Pokémon', texte: 'Displays, boosters, ETB et coffrets', lien: '#pokemon', image: 'assets/img/categories/pokemon.webp', detoure: true, couleur: 'citron', code: 'PKMN' },
    { id: 'one-piece', titre: 'One Piece', texte: 'Displays, boosters et starter decks', lien: '#one-piece', image: 'assets/img/categories/one-piece.webp', detoure: true, couleur: 'corail', code: 'OPCG' },
    { id: 'japonais', titre: 'Japonais', texte: 'Boosters et displays importés du Japon', lien: '#japonais', image: 'assets/img/categories/japonais.webp', detoure: true, couleur: 'rose', code: 'JP' },
    { id: 'cartes-unite', titre: 'Cartes à l’unité', texte: 'La carte qui manque à votre collection', lien: '#cartes-unite', image: 'assets/img/categories/cartes-a-l-unite.webp', detoure: true, couleur: 'lilas', code: '1/1' },
    { id: 'cartes-gradees', titre: 'Cartes gradées', texte: 'Des cartes certifiées et protégées', lien: '#cartes-gradees', image: null, detoure: false, couleur: 'ciel', code: '10' },
    { id: 'goodies', titre: 'Goodies', texte: 'Peluches, figurines et produits dérivés', lien: '#goodies', image: null, detoure: false, couleur: 'peche', code: '★' },
    { id: 'accessoires', titre: 'Accessoires', texte: 'Sleeves, classeurs, protections acryliques', lien: '#accessoires', image: null, detoure: false, couleur: 'cyan', code: '∞' },
    { id: 'autres-tcg', titre: 'Autres TCG', texte: 'Dragon Ball, Digimon, Lorcana, Gundam…', lien: '#autres-tcg', image: null, detoure: false, couleur: 'violet', code: '+5' },
    { id: 'precommandes', titre: 'Précommandes', texte: 'Réservez les prochaines sorties', lien: '#precommande', image: 'assets/img/categories/precommandes.webp', detoure: true, couleur: 'menthe', code: 'PRÉ' }
  ],

  /* ---------- Prochaines sorties TCG (les dates passées disparaissent seules) ---------- */
  sorties: [
    { date: '2026-10-30', jeu: 'One Piece', titre: 'EB-05', texte: 'Extra Booster', lien: '#one-piece', couleur: 'corail' },
    { date: '2026-10-30', jeu: 'Gundam', titre: 'GD-06', texte: 'Nouvelle extension', lien: '#autres-tcg', couleur: 'cyan' },
    { date: '2026-11-06', jeu: 'Pokémon', titre: 'ME06 — Règne Delta', texte: 'Displays, ETB et boosters', lien: '#precommande', couleur: 'menthe' },
    { date: '2026-11-20', jeu: 'One Piece', titre: 'OP-18', texte: 'Nouvelle extension', lien: '#one-piece', couleur: 'rose' }
  ],

  /* ---------- Découvrez nos autres TCG ---------- */
  autresTcg: [
    { nom: 'Dragon Ball', texte: 'Fusion World & Masters', lien: '#autres-tcg', image: null, sigle: 'DB', couleurs: ['#FF8A00', '#FFD43B'] },
    { nom: 'Digimon', texte: 'Digimon Card Game', lien: '#autres-tcg', image: null, sigle: 'DG', couleurs: ['#2F80ED', '#56CCF2'] },
    { nom: 'Gundam', texte: 'Gundam Card Game', lien: '#autres-tcg', image: null, sigle: 'GD', couleurs: ['#E63946', '#7FB2D6'] },
    { nom: 'Lorcana', texte: 'Disney Lorcana', lien: '#autres-tcg', image: null, sigle: 'LO', couleurs: ['#9B5CFF', '#F5C542'] },
    { nom: 'Riftbound', texte: 'Le TCG League of Legends', lien: '#autres-tcg', image: null, sigle: 'RB', couleurs: ['#0BC5EA', '#C89B3C'] }
  ],

  /* ---------- Tournois & événements en boutique (les dates passées disparaissent seules) ---------- */
  evenements: [
    { date: '2026-10-24', heure: '14h', jeu: 'One Piece', titre: 'Store Tournament One Piece', prix: 8, lien: 'mailto:contact@chococards.be?subject=Inscription%20Store%20Tournament%20One%20Piece%20du%2024%20octobre' },
    { date: '2026-10-25', heure: '14h', jeu: 'One Piece', titre: 'Store Tournament One Piece', prix: 8, lien: 'mailto:contact@chococards.be?subject=Inscription%20Store%20Tournament%20One%20Piece%20du%2025%20octobre' },
    { date: '2026-10-31', heure: '14h', jeu: 'One Piece', titre: 'Store Tournament One Piece', prix: 8, lien: 'mailto:contact@chococards.be?subject=Inscription%20Store%20Tournament%20One%20Piece%20du%2031%20octobre' }
  ],

  /* ---------- Communauté Instagram (6 vignettes) ----------
     image: null = vignette typographique en attendant la vraie photo du post. */
  instagram: [
    { image: 'assets/img/categories/one-piece.webp', detoure: true, alt: 'Arrivage des boosters One Piece OP-16 et OP-17', legende: 'Arrivage One Piece', couleur: 'corail', lien: 'https://www.instagram.com/chococards.be/' },
    { image: null, alt: 'Ouverture de boosters entre passionnés', legende: 'Ouverture de boosters', couleur: 'violet', lien: 'https://www.instagram.com/chococards.be/' },
    { image: null, alt: 'Tournoi du week-end chez ChocoCards', legende: 'Tournoi du week-end', couleur: 'citron', lien: 'https://www.instagram.com/chococards.be/' },
    { image: 'assets/img/categories/japonais.webp', detoure: true, alt: 'Boosters japonais 30th Celebration arrivés en boutique', legende: 'Import Japon', couleur: 'ciel', lien: 'https://www.instagram.com/chococards.be/' },
    { image: null, alt: 'Les vitrines de cartes gradées', legende: 'Vitrine des gradées', couleur: 'cyan', lien: 'https://www.instagram.com/chococards.be/' },
    { image: null, alt: 'La boutique de Nivelles', legende: 'La boutique', couleur: 'menthe', lien: 'https://www.instagram.com/chococards.be/' }
  ],

  /* ---------- Méga-menu ---------- */
  menu: [
    { titre: 'Pokémon', lien: '#pokemon', colonnes: [
      { titre: 'Produits scellés', liens: ['Displays', 'Boosters', 'Coffrets Dresseur d’Élite (ETB)', 'Special Box', 'Tins & Mini Tins', 'Blisters & Tripacks'] },
      { titre: 'Collection', liens: ['Cartes à l’unité', 'Cartes gradées', 'Pokémon 30 ans'] }
    ], vedette: { titre: 'Pokémon fête ses 30 ans', texte: 'Exclusivités en boutique', image: 'assets/img/categories/pokemon.webp', detoure: true, lien: '#anniversaire', couleur: 'citron', code: '30 ANS' } },
    { titre: 'One Piece', lien: '#one-piece', colonnes: [
      { titre: 'Produits scellés', liens: ['Displays', 'Boosters', 'Starter Decks', 'Special Box', 'Double Packs'] },
      { titre: 'Collection', liens: ['Cartes à l’unité', 'Cartes gradées'] }
    ], vedette: { titre: 'OP-18 en précommande', texte: 'Sortie le 20 novembre', image: 'assets/img/categories/one-piece.webp', detoure: true, lien: '#one-piece', couleur: 'corail', code: 'OP-18' } },
    { titre: 'Japonais', lien: '#japonais', colonnes: [
      { titre: 'Pokémon japonais', liens: ['Displays', 'Boosters', 'Special Box'] },
      { titre: 'One Piece japonais', liens: ['Displays', 'Boosters'] }
    ], vedette: { titre: 'Import Japon', texte: 'Les sets avant tout le monde', image: 'assets/img/categories/japonais.webp', detoure: true, lien: '#japonais', couleur: 'rose', code: 'JP' } },
    { titre: 'Cartes à l’unité', lien: '#cartes-unite', colonnes: [
      { titre: 'Par jeu', liens: ['Pokémon', 'One Piece', 'Autres TCG'] },
      { titre: 'Prestige', liens: ['Cartes gradées', 'Cartes rares'] }
    ], vedette: { titre: 'Cartes gradées', texte: 'Certifiées et protégées', image: null, lien: '#cartes-gradees', couleur: 'ciel', code: '10' } },
    { titre: 'Goodies', lien: '#goodies', colonnes: [
      { titre: 'Goodies', liens: ['Peluches', 'Figurines', 'Autres goodies'] }
    ], vedette: { titre: 'Peluches & figurines', texte: 'Pour décorer votre coin collection', image: null, lien: '#goodies', couleur: 'peche', code: '★' } },
    { titre: 'Accessoires', lien: '#accessoires', colonnes: [
      { titre: 'Protéger', liens: ['Sleeves', 'Toploaders', 'Classeurs', 'Deck boxes'] },
      { titre: 'Protections acryliques', liens: ['Protection acrylique UPC', 'Protection acrylique ETB', 'Protection acrylique Display'] },
      { titre: 'Jouer', liens: ['Playmats', 'Dés & marqueurs'] }
    ], vedette: { titre: 'Protégez vos trésors', texte: 'Acryliques UPC, ETB, Display', image: null, lien: '#accessoires', couleur: 'cyan', code: '∞' } },
    { titre: 'Autres TCG', lien: '#autres-tcg', colonnes: [
      { titre: 'Jeux', liens: ['Dragon Ball', 'Digimon', 'Lorcana', 'Gundam', 'Riftbound', 'Hellbreak TCG'] }
    ], vedette: { titre: 'Gundam GD-06', texte: 'Sortie le 30 octobre', image: null, lien: '#autres-tcg', couleur: 'violet', code: 'GD-06' } },
    { titre: 'Précommandes', lien: '#precommande' },
    { titre: 'Tournois', lien: '#tournois' },
    { titre: 'Calendrier TCG', lien: '#sorties' },
    { titre: 'Guides & Actualités', lien: '#guides' }
  ]
};

export default DATA;
