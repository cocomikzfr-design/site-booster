/* ==========================================================================
   ChocoCards — DONNÉES DU SITE
   --------------------------------------------------------------------------
   C'est ici que vous modifiez le contenu « vivant » de la page d'accueil :
   produits, sorties TCG, tournois, catégories, menu…
   Pas besoin de toucher au HTML ni au JavaScript.

   IMAGES : chaque produit pointe vers un fichier dans assets/images/…
   Il suffit de remplacer le fichier par votre vraie photo EN GARDANT LE MÊME
   NOM (ex. assets/images/produits/pokemon-30-ans-etb.jpg). Format conseillé :
   JPG ou WebP, carré 1000 × 1000 px pour les produits.

   STATUTS possibles pour un produit :
     "disponible"  → bouton « Ajouter au panier »
     "precommande" → bouton « Précommander »
     "bientot"     → « Bientôt disponible » (bouton désactivé)
     "rupture"     → « Rupture de stock » (bouton désactivé)
     "boutique"    → « Non disponible en ligne » + « Disponible en boutique à Nivelles »

   Les prix sont indicatifs : vérifiez-les avant la mise en ligne.
   ========================================================================== */

window.CHOCO_DATA = {
  /* ---------- Infos boutique ---------- */
  boutique: {
    nom: 'ChocoCards',
    rue: 'Rue du Géant 15',
    codePostal: '1400',
    ville: 'Nivelles',
    pays: 'Belgique',
    telephone: '+32 465 16 83 13',
    email: 'contact@chococards.be',
    instagram: 'https://www.instagram.com/chococards.be/',
    instagramPseudo: '@chococards.be',
    itineraire: 'https://www.google.com/maps/dir/?api=1&destination=Rue%20du%20G%C3%A9ant%2015%2C%201400%20Nivelles%2C%20Belgique',
    parking: 'Stationnement facile dans les rues voisines et parkings publics à quelques minutes à pied.',
    retrait: 'Commandez en ligne et récupérez gratuitement votre colis en boutique.',
    // 0 = dimanche, 1 = lundi… null = fermé
    horaires: [
      { jour: 'Dimanche', heures: '10h – 18h' },
      { jour: 'Lundi', heures: null },
      { jour: 'Mardi', heures: '10h – 19h' },
      { jour: 'Mercredi', heures: '10h – 19h' },
      { jour: 'Jeudi', heures: '10h – 19h' },
      { jour: 'Vendredi', heures: '10h – 19h' },
      { jour: 'Samedi', heures: '10h – 19h' }
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

  /* ---------- Produits ----------
     categorie : "pokemon-30-ans" | "pokemon" | "one-piece" | "precommande"
     langue    : "FR" | "JP" | "EN"                                          */
  produits: [
    // Pokémon fête ses 30 ans — vendus exclusivement en boutique physique
    { id: 'p30-etb', nom: 'Coffret Dresseur d’Élite (ETB) — Pokémon 30 ans', court: 'ETB', prix: 64.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', image: 'assets/images/produits/pokemon-30-ans-etb.jpg' },
    { id: 'p30-upc', nom: 'Ultra-Premium Collection (UPC) — Pokémon 30 ans', court: 'UPC', prix: 149.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', image: 'assets/images/produits/pokemon-30-ans-upc.jpg' },
    { id: 'p30-tin', nom: 'Mini Tin — Pokémon 30 ans', court: 'Mini Tin', prix: 14.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', image: 'assets/images/produits/pokemon-30-ans-mini-tin.jpg' },
    { id: 'p30-bundle', nom: 'Booster Bundle — Pokémon 30 ans', court: 'Booster Bundle', prix: 39.90, statut: 'boutique', categorie: 'pokemon-30-ans', langue: 'FR', image: 'assets/images/produits/pokemon-30-ans-booster-bundle.jpg' },

    // L'univers Pokémon
    { id: 'pk-me06-display', nom: 'Display ME06 Règne Delta — 36 boosters', prix: 199.90, statut: 'precommande', categorie: 'pokemon', langue: 'FR', image: 'assets/images/produits/pokemon-me06-display.jpg' },
    { id: 'pk-me06-etb', nom: 'Coffret Dresseur d’Élite ME06 Règne Delta', prix: 59.90, statut: 'precommande', categorie: 'pokemon', langue: 'FR', image: 'assets/images/produits/pokemon-me06-etb.jpg' },
    { id: 'pk-me05-display', nom: 'Display ME05 — 36 boosters', prix: 189.90, statut: 'disponible', categorie: 'pokemon', langue: 'FR', image: 'assets/images/produits/pokemon-me05-display.jpg' },
    { id: 'pk-me05-booster', nom: 'Booster ME05', prix: 5.90, statut: 'disponible', categorie: 'pokemon', langue: 'FR', image: 'assets/images/produits/pokemon-me05-booster.jpg' },
    { id: 'pk-jp-display', nom: 'Display japonais — 30 boosters', prix: 79.90, statut: 'disponible', categorie: 'pokemon', langue: 'JP', image: 'assets/images/produits/pokemon-japonais-display.jpg' },
    { id: 'pk-tripack', nom: 'Tripack ME04', prix: 17.90, statut: 'rupture', categorie: 'pokemon', langue: 'FR', image: 'assets/images/produits/pokemon-me04-tripack.jpg' },
    { id: 'pk-premium', nom: 'Coffret Collection Premium', prix: 39.90, statut: 'bientot', categorie: 'pokemon', langue: 'FR', image: 'assets/images/produits/pokemon-collection-premium.jpg' },

    // One Piece Card Game
    { id: 'op-op18-display', nom: 'Display OP-18 — 24 boosters', prix: 109.90, statut: 'precommande', categorie: 'one-piece', langue: 'EN', image: 'assets/images/produits/one-piece-op18-display.jpg' },
    { id: 'op-eb05-display', nom: 'Display Extra Booster EB-05 — 24 boosters', prix: 119.90, statut: 'precommande', categorie: 'one-piece', langue: 'EN', image: 'assets/images/produits/one-piece-eb05-display.jpg' },
    { id: 'op-op17-display', nom: 'Display OP-17 — 24 boosters', prix: 104.90, statut: 'disponible', categorie: 'one-piece', langue: 'EN', image: 'assets/images/produits/one-piece-op17-display.jpg' },
    { id: 'op-op17-booster', nom: 'Booster OP-17', prix: 4.90, statut: 'disponible', categorie: 'one-piece', langue: 'EN', image: 'assets/images/produits/one-piece-op17-booster.jpg' },
    { id: 'op-op16-jp', nom: 'Display OP-16 — 24 boosters', prix: 69.90, statut: 'disponible', categorie: 'one-piece', langue: 'JP', image: 'assets/images/produits/one-piece-op16-display-jp.jpg' },
    { id: 'op-starter', nom: 'Starter Deck', prix: 14.90, statut: 'boutique', categorie: 'one-piece', langue: 'EN', image: 'assets/images/produits/one-piece-starter-deck.jpg' },
    { id: 'op-double', nom: 'Double Pack Set', prix: 9.90, statut: 'rupture', categorie: 'one-piece', langue: 'EN', image: 'assets/images/produits/one-piece-double-pack.jpg' },
    { id: 'op-premium', nom: 'Premium Card Collection', prix: 29.90, statut: 'bientot', categorie: 'one-piece', langue: 'EN', image: 'assets/images/produits/one-piece-premium-collection.jpg' }
  ],

  /* ---------- Précommande mise en avant (section compte à rebours) ---------- */
  precommandeVedette: {
    produitId: 'pk-me06-display',
    titre: 'ME06 — Règne Delta',
    jeu: 'Pokémon',
    // Date et heure de sortie (heure belge)
    sortie: '2026-11-06T00:00:00+01:00',
    texte: 'La nouvelle extension Pokémon arrive le 6 novembre 2026. Réservez dès maintenant vos displays et coffrets : on vous les met de côté dès l’arrivée du stock.'
  },

  /* ---------- Explorez la boutique (9 catégories) ---------- */
  categories: [
    { titre: 'Pokémon', texte: 'Displays, boosters, ETB et coffrets', lien: '#pokemon', image: 'assets/images/categories/pokemon.jpg', teinte: 48 },
    { titre: 'One Piece', texte: 'Displays, boosters et starter decks', lien: '#one-piece', image: 'assets/images/categories/one-piece.jpg', teinte: 0 },
    { titre: 'Japonais', texte: 'Boosters et displays importés du Japon', lien: '#japonais', image: 'assets/images/categories/japonais.jpg', teinte: 340 },
    { titre: 'Cartes à l’unité', texte: 'La carte qui manque à votre collection', lien: '#cartes-unite', image: 'assets/images/categories/cartes-a-l-unite.jpg', teinte: 265 },
    { titre: 'Cartes gradées', texte: 'Des cartes certifiées et protégées', lien: '#cartes-gradees', image: 'assets/images/categories/cartes-gradees.jpg', teinte: 190 },
    { titre: 'Goodies', texte: 'Peluches, figurines et produits dérivés', lien: '#goodies', image: 'assets/images/categories/goodies.jpg', teinte: 320 },
    { titre: 'Accessoires', texte: 'Sleeves, classeurs, protections acryliques', lien: '#accessoires', image: 'assets/images/categories/accessoires.jpg', teinte: 160 },
    { titre: 'Autres TCG', texte: 'Dragon Ball, Digimon, Lorcana, Gundam…', lien: '#autres-tcg', image: 'assets/images/categories/autres-tcg.jpg', teinte: 220 },
    { titre: 'Précommandes', texte: 'Réservez les prochaines sorties', lien: '#precommande', image: 'assets/images/categories/precommandes.jpg', teinte: 28 }
  ],

  /* ---------- Prochaines sorties TCG ---------- */
  sorties: [
    { date: '2026-10-30', jeu: 'One Piece', titre: 'EB-05', texte: 'Extra Booster', lien: '#one-piece' },
    { date: '2026-10-30', jeu: 'Gundam', titre: 'GD-06', texte: 'Nouvelle extension', lien: '#autres-tcg' },
    { date: '2026-11-06', jeu: 'Pokémon', titre: 'ME06 — Règne Delta', texte: 'Displays, ETB et boosters', lien: '#precommande' },
    { date: '2026-11-20', jeu: 'One Piece', titre: 'OP-18', texte: 'Nouvelle extension', lien: '#one-piece' }
  ],

  /* ---------- Découvrez nos autres TCG ---------- */
  autresTcg: [
    { nom: 'Dragon Ball', texte: 'Fusion World & Masters', lien: '#autres-tcg', image: 'assets/images/autres-tcg/dragon-ball.jpg', couleurs: ['#FF8A00', '#FFD43B'] },
    { nom: 'Digimon', texte: 'Digimon Card Game', lien: '#autres-tcg', image: 'assets/images/autres-tcg/digimon.jpg', couleurs: ['#2F80ED', '#56CCF2'] },
    { nom: 'Gundam', texte: 'Gundam Card Game', lien: '#autres-tcg', image: 'assets/images/autres-tcg/gundam.jpg', couleurs: ['#E63946', '#457B9D'] },
    { nom: 'Lorcana', texte: 'Disney Lorcana', lien: '#autres-tcg', image: 'assets/images/autres-tcg/lorcana.jpg', couleurs: ['#7B2FF7', '#F5C542'] },
    { nom: 'Riftbound', texte: 'Le TCG League of Legends', lien: '#autres-tcg', image: 'assets/images/autres-tcg/riftbound.jpg', couleurs: ['#0BC5EA', '#C89B3C'] }
  ],

  /* ---------- Tournois & événements en boutique ---------- */
  evenements: [
    { date: '2026-10-24', heure: '14h', jeu: 'One Piece', titre: 'Store Tournament One Piece', prix: 8, lien: '#tournois' },
    { date: '2026-10-25', heure: '14h', jeu: 'One Piece', titre: 'Store Tournament One Piece', prix: 8, lien: '#tournois' },
    { date: '2026-10-31', heure: '14h', jeu: 'One Piece', titre: 'Store Tournament One Piece', prix: 8, lien: '#tournois' }
  ],

  /* ---------- Communauté Instagram (6 vignettes) ---------- */
  instagram: [
    { image: 'assets/images/instagram/post-1.jpg', alt: 'Arrivage de nouveautés en boutique' },
    { image: 'assets/images/instagram/post-2.jpg', alt: 'Ouverture de boosters entre passionnés' },
    { image: 'assets/images/instagram/post-3.jpg', alt: 'Tournoi du week-end chez ChocoCards' },
    { image: 'assets/images/instagram/post-4.jpg', alt: 'Les vitrines de cartes gradées' },
    { image: 'assets/images/instagram/post-5.jpg', alt: 'Nouvelles peluches et goodies' },
    { image: 'assets/images/instagram/post-6.jpg', alt: 'La boutique de Nivelles' }
  ],

  /* ---------- Méga-menu ---------- */
  menu: [
    { titre: 'Pokémon', lien: '#pokemon', colonnes: [
      { titre: 'Produits scellés', liens: ['Displays', 'Boosters', 'Coffrets Dresseur d’Élite (ETB)', 'Special Box', 'Tins & Mini Tins', 'Blisters & Tripacks'] },
      { titre: 'Collection', liens: ['Cartes à l’unité', 'Cartes gradées', 'Pokémon 30 ans'] }
    ], vedette: { titre: 'Pokémon fête ses 30 ans', texte: 'Exclusivités en boutique', image: 'assets/images/categories/pokemon.jpg', lien: '#pokemon-30-ans' } },
    { titre: 'One Piece', lien: '#one-piece', colonnes: [
      { titre: 'Produits scellés', liens: ['Displays', 'Boosters', 'Starter Decks', 'Special Box', 'Double Packs'] },
      { titre: 'Collection', liens: ['Cartes à l’unité', 'Cartes gradées'] }
    ], vedette: { titre: 'OP-18 en précommande', texte: 'Sortie le 20 novembre', image: 'assets/images/categories/one-piece.jpg', lien: '#one-piece' } },
    { titre: 'Japonais', lien: '#japonais', colonnes: [
      { titre: 'Pokémon japonais', liens: ['Displays', 'Boosters', 'Special Box'] },
      { titre: 'One Piece japonais', liens: ['Displays', 'Boosters'] }
    ], vedette: { titre: 'Import Japon', texte: 'Les sets avant tout le monde', image: 'assets/images/categories/japonais.jpg', lien: '#japonais' } },
    { titre: 'Cartes à l’unité', lien: '#cartes-unite', colonnes: [
      { titre: 'Par jeu', liens: ['Pokémon', 'One Piece', 'Autres TCG'] },
      { titre: 'Prestige', liens: ['Cartes gradées', 'Cartes rares'] }
    ], vedette: { titre: 'Cartes gradées', texte: 'Certifiées et protégées', image: 'assets/images/categories/cartes-gradees.jpg', lien: '#cartes-gradees' } },
    { titre: 'Goodies', lien: '#goodies', colonnes: [
      { titre: 'Goodies', liens: ['Peluches', 'Figurines', 'Autres goodies'] }
    ], vedette: { titre: 'Peluches & figurines', texte: 'Pour décorer votre coin collection', image: 'assets/images/categories/goodies.jpg', lien: '#goodies' } },
    { titre: 'Accessoires', lien: '#accessoires', colonnes: [
      { titre: 'Protéger', liens: ['Sleeves', 'Toploaders', 'Classeurs', 'Deck boxes'] },
      { titre: 'Protections acryliques', liens: ['Protection acrylique UPC', 'Protection acrylique ETB', 'Protection acrylique Display'] },
      { titre: 'Jouer', liens: ['Playmats', 'Dés & marqueurs'] }
    ], vedette: { titre: 'Protégez vos trésors', texte: 'Acryliques UPC, ETB, Display', image: 'assets/images/categories/accessoires.jpg', lien: '#accessoires' } },
    { titre: 'Autres TCG', lien: '#autres-tcg', colonnes: [
      { titre: 'Jeux', liens: ['Dragon Ball', 'Digimon', 'Lorcana', 'Gundam', 'Riftbound', 'Hellbreak TCG'] }
    ], vedette: { titre: 'Gundam GD-06', texte: 'Sortie le 30 octobre', image: 'assets/images/categories/autres-tcg.jpg', lien: '#autres-tcg' } },
    { titre: 'Précommandes', lien: '#precommande' },
    { titre: 'Tournois', lien: '#tournois' },
    { titre: 'Calendrier TCG', lien: '#sorties' },
    { titre: 'Guides & Actualités', lien: '#guides' }
  ]
};
