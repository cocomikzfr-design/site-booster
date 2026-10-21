# Thème Shopify ChocoCards (Online Store 2.0)

Thème complet pour [chococards.be](https://chococards.be/) : même structure, même contenu et mêmes fonctions que le site actuel, avec un nouvel emballage (3D Three.js, cartes holographiques, booster qui s’ouvre au scroll, palette chocolat + accents irisés).
Tout est modifiable dans l’éditeur de thème, sans toucher au code.

> **Important** : ce thème n’a jamais été envoyé sur la boutique. Il doit être installé comme **thème non publié**, prévisualisé, puis publié par vous seulement.

---

## 1. Installation (sans jamais toucher au thème en ligne)

```bash
npm install -g @shopify/cli          # une seule fois
cd chococards-theme

shopify theme check                  # vérification (0 erreur attendue)
shopify theme dev --store chococards.myshopify.com    # aperçu local, rien n'est publié

shopify theme push --unpublished --store chococards.myshopify.com   # crée un NOUVEAU thème non publié
# mises à jour suivantes de ce même thème non publié :
shopify theme push --theme <ID_DU_THEME_NON_PUBLIE> --store chococards.myshopify.com
```

N’utilisez jamais `--publish`, ni `--live`, ni l’ID du thème actuellement en ligne.
La publication se fait à la main dans **Boutique en ligne > Thèmes**, une fois l’aperçu validé.

---

## 2. À créer dans l’admin Shopify

### Tags produits (statuts automatiques)

| Tag | Badge affiché | Bouton |
|---|---|---|
| `precommande` | Précommande | « Précommander » (si stock disponible, sinon « Rupture de stock ») |
| `bientot-disponible` | Bientôt disponible | désactivé |
| `boutique-uniquement` | Non disponible en ligne | désactivé + « Disponible en boutique à Nivelles » |
| *(aucun tag)* | Disponible / Rupture de stock | selon l’inventaire Shopify |

Priorité : `boutique-uniquement` > `bientot-disponible` > `precommande` > inventaire.
Les noms des tags sont modifiables dans **Paramètres du thème > Produits et statuts**.

### Metafields produit (Paramètres > Données personnalisées > Produits)

| Nom | Espace de noms et clé | Type | Usage |
|---|---|---|---|
| Langue | `custom.langue` | Texte sur une ligne, **liste de valeurs** : `FR`, `JP`, `EN` | Badge de langue sur les cartes et la fiche produit. Activez-le aussi comme filtre dans Search & Discovery. |
| Libellé court | `custom.libelle_court` | Texte sur une ligne (ex. `ETB`, `UPC`, `Mini Tin`) | Étiquette sur les cartes du carrousel 3D (sinon : type de produit). |

### Metaobjects (Contenu > Metaobjects > Ajouter une définition)

Cochez **« Accès Storefront / Storefronts »** sur les deux définitions, sinon le thème ne peut pas les lire.

**« Sortie TCG »** — type (handle) : `sortie_tcg`

| Champ (clé) | Type | Exemple |
|---|---|---|
| `date` | Date (obligatoire) | 2026-10-30 |
| `jeu` | Texte sur une ligne | One Piece |
| `titre` | Texte sur une ligne | EB-05 |
| `description` | Texte sur une ligne | Extra Booster |
| `lien` | URL | /collections/one-piece |
| `couleur` | Couleur (facultatif) | couleur de l’étiquette du jeu |

À créer pour démarrer : 30/10 One Piece EB-05 · 30/10 Gundam GD-06 · 06/11 Pokémon ME06 — Règne Delta · 20/11 One Piece OP-18.

**« Événement »** — type (handle) : `evenement`

| Champ (clé) | Type | Exemple |
|---|---|---|
| `date` | Date (obligatoire) | 2026-10-24 |
| `heure` | Texte sur une ligne | 14h |
| `jeu` | Texte sur une ligne | One Piece |
| `titre` | Texte sur une ligne | Store Tournament One Piece |
| `prix` | Décimal | 8 |
| `produit` | Référence de produit | le produit-ticket d’inscription |
| `lien` | URL (facultatif) | si pas de produit-ticket |

À créer : Store Tournament One Piece les 24, 25 et 31 octobre 2026, 14h, 8 €.
Conseil : un **produit-ticket** par tournoi (prix 8 €, stock = nombre de places) ; le bouton « S’inscrire » mène à sa fiche.

Les dates passées disparaissent toutes seules et l’ordre est chronologique. Tant qu’aucune entrée n’existe, les sections affichent leurs blocs de démonstration (modifiables dans l’éditeur).
La section « Boutique physique » affiche automatiquement le **prochain** événement.

### Pages (Boutique en ligne > Pages)

| Page | Identifiant (handle) | Modèle à choisir |
|---|---|---|
| Contact | `contact` | `page.contact` |
| Comment venir | `comment-venir` | `page.comment-venir` |
| Tournois | `tournois` | `page.tournois` |
| Calendrier TCG | `calendrier-tcg` | `page.calendrier-tcg` |

Avec ces identifiants, les liens « Voir le calendrier complet », « Tous les tournois », « Voir les tournois » et « Contact » se remplissent tout seuls.
Mentions légales, CGV, confidentialité, livraison/retours : via **Paramètres > Politiques** puis le menu légal.

### Blog

« Guides & Actualités » : un blog Shopify (modèles `blog` et `article` inclus, filtres par tag).

### Menus (Boutique en ligne > Navigation)

- **Menu principal** (`main-menu`) : Pokémon, One Piece, Japonais, Cartes à l’unité, Goodies, Accessoires, Autres TCG (avec sous-menus) puis Précommandes, Tournois, Calendrier TCG, Guides & Actualités.
  Les sous-menus deviennent le méga-menu (jusqu’à 3 niveaux, ex. Accessoires > Protections acryliques > UPC / ETB / Display ; Autres TCG > Dragon Ball, Digimon, Lorcana, Gundam, Riftbound, Hellbreak TCG).
  Image mise en avant : bloc « Mise en avant (méga-menu) » du header, en indiquant le titre du lien (ex. « Pokémon »).
- **Footer** : un menu « Infos » et un menu « Liens légaux » (à choisir dans la section Footer).

### Autres réglages de la boutique

- **Retrait en magasin** : Paramètres > Expédition et livraison > Retrait en magasin, pour l’emplacement de Nivelles (le bloc « Retrait en boutique » de la fiche produit l’affiche automatiquement).
- **Pays** : Paramètres > Marchés (Belgique, France) → sélecteur de pays.
- **Langues** : Paramètres > Langues, publier l’anglais → sélecteur FR / EN. Les textes du thème sont traduits dans `locales/fr.default.json` et `locales/en.json` ; les textes saisis dans l’éditeur se traduisent avec l’application gratuite Translate & Adapt.
- **Filtres** : application gratuite Shopify **Search & Discovery** (disponibilité, prix, type, langue…).
- **Moyens de paiement** : icônes automatiques dans le footer (`shop.enabled_payment_types`).

### Dans l’éditeur de thème (2 minutes)

Choisir les collections et images : « Collection 3D » (Pokémon 30 ans), les deux « Carrousel de produits » (Pokémon, One Piece), les 9 blocs de « Grille de catégories », le produit de « Précommande + décompte » (Display ME06), les photos des bannières, d’Instagram et de la boutique.

---

## 3. Contenu du thème

```
layout/      theme.liquid, password.liquid
config/      settings_schema.json (réglages), settings_data.json
sections/    toutes les sections (+ header-group.json, footer-group.json)
snippets/    carte produit, statut, badges, prix, icônes, dates, filtres…
templates/   JSON (accueil, collection, produit, panier, recherche, pages, blog, article, 404, comptes clients) + gift_card.liquid
locales/     fr.default.json, en.json
assets/      base.css, sections.css, templates.css, modules JS, librairies, police Bricolage Grotesque
```

### Sections de l’accueil (dans l’ordre du site actuel, toutes réordonnables)

1. `announcement-marquee` — bandeau défilant (blocs = messages)
2. `header` — logo, méga-menu (navigation Shopify), recherche prédictive, compte, panier, pays et langue (formulaire `localization`)
3. `hero-3d` — message d’accueil, horaires, adresse, bouton Instagram, scène Three.js
4. `featured-collection-3d` — carrousel 3D d’une collection + mention « vente exclusive en boutique »
5. `category-grid` — « Explorez la boutique » (blocs = collection + image + teinte)
6. `preorder-countdown` — précommande, compte à rebours (date réglable), booster qui s’ouvre au scroll
7. `release-timeline` — prochaines sorties (metaobjects `sortie_tcg`)
8. `product-carousel` — réutilisable (Pokémon, One Piece…)
9. `other-tcg-grid`, `promo-banners`, `community-instagram`
10. `events-list` — tournois (metaobjects `evenement`)
11. `store-info` — boutique de Nivelles, horaires (jour actuel surligné), prochain événement automatique, boutons Itinéraire / Tournois / Contact, compteurs animés
12. `trust-badges` — 5 arguments avec icônes animées
13. `footer` — menus, coordonnées, newsletter (formulaire client Shopify), moyens de paiement, liens légaux

Autres : `main-collection` (filtres Search & Discovery, tri, pagination sans rechargement), `main-product` (galerie holo, variantes, badges, retrait en boutique), `product-recommendations`, `main-cart`, `cart-drawer`, `main-search`, `predictive-search`, `main-page`, `contact-form`, `rich-text`, `main-blog`, `main-article`, `main-404`, `main-list-collections`, `main-password`, comptes clients, `apps`.

### Paramètres du thème

Couleurs (chocolat, crème, or, 4 couleurs holo), typographie (Bricolage Grotesque incluse ou police Shopify + Inter), effets on/off (3D du hero, effet holo, curseur personnalisé, scroll fluide, apparitions au scroll), type de panier (tiroir ou page), tags de statut, coordonnées de la boutique, réseaux sociaux.

### JavaScript

Modules ES (carte d’import) chargés là où ils servent :
`theme.js` (toutes les pages), `cart.js` (Cart AJAX API + Section Rendering API), `predictive-search.js` (Predictive Search API), `hero-3d.js` + Three.js (uniquement si la section hero est présente), `scroll-fx.js` (GSAP + ScrollTrigger chargés à la demande quand une section animée approche), `carousels.js`, `product.js`, `facets.js`.
Three.js, GSAP, ScrollTrigger et Lenis sont inclus dans `assets/` (servis par le CDN Shopify).

---

## 4. Tests réalisés

| Test | Résultat |
|---|---|
| `shopify theme check` (CLI Shopify) | **97 fichiers, 0 erreur, 0 avertissement** |
| Rendu de tous les modèles (accueil, collection, produit, panier, recherche, pages, blog, article, 404, comptes, mot de passe, carte cadeau) | OK, aucune erreur console |
| Ajout au panier AJAX → carte qui vole → tiroir, quantités, badge | OK |
| Statuts produits (5 cas) et variantes (variante épuisée désactivée, prix et URL mis à jour) | OK |
| Desktop (1100 → 1920 px) et mobile (360, 390, 768 px) : pas de débordement horizontal | OK |
| `prefers-reduced-motion` : pas de 3D, pas d’animations, état final affiché | OK |
| Lighthouse mobile — accueil | **Performance 93–95 · Accessibilité 100 · Bonnes pratiques 100 · SEO 100** |
| Lighthouse mobile — produit / collection / panier / page | Performance 93–98 · Accessibilité 100 |

**Limite à connaître** : je n’avais pas accès à votre boutique Shopify. `shopify theme dev` et la prévisualisation du thème non publié n’ont donc pas pu être lancés.
Les tests ci-dessus ont été faits avec la vraie CLI Shopify (`theme check`) et un **émulateur local** (moteur Liquid + objets Shopify simulés : panier AJAX, recherche prédictive, retrait en boutique, metaobjects) dans Chromium.
À faire de votre côté : `shopify theme push --unpublished`, puis vérifier l’aperçu (les vraies données, le checkout, les marchés et langues). Les scores Lighthouse réels dépendront de vos photos.

---

## 5. Performances et accessibilité (choix faits)

- Three.js n’est chargé que sur la page qui contient le hero, en différé ; sur mobile il attend le premier geste (réglable : « 3D sur mobile ») et utilise moins de cartes, moins de particules et une résolution réduite ; la scène se met en pause hors écran et quand l’onglet est caché.
- GSAP n’est chargé que lorsqu’une section animée approche de l’écran ; Lenis seulement sur ordinateur (souris).
- Aucune animation continue coûteuse : dégradés holo fixes (sauf le titre du hero), effets lourds limités au survol.
- Images Shopify via `image_url` + `image_tag` (tailles responsives, `loading="lazy"` sauf au-dessus de la ligne de flottaison).
- `prefers-reduced-motion` respecté partout ; navigation clavier, focus visibles, libellés ARIA, contrastes vérifiés.
- Aucun personnage ni logo Pokémon / One Piece / Bandai : les cartes 3D, le booster et les illustrations sont des créations ChocoCards génériques.

---

## 6. Licences des éléments inclus

| Élément | Fichier(s) | Licence |
|---|---|---|
| Bricolage Grotesque (Mathieu Triay / The Bricolage Grotesque Project Authors) | `assets/bricolage-grotesque-*.woff2` | [SIL Open Font License 1.1](https://openfontlicense.org/) |
| Three.js r160 | `assets/vendor-three.module.min.js` | MIT |
| GSAP 3.12.5 + ScrollTrigger | `assets/vendor-gsap.min.js`, `assets/vendor-scrolltrigger.min.js` | [Licence standard GSAP](https://gsap.com/standard-license) (gratuite, usage commercial autorisé) |
| Lenis 1.1.13 | `assets/vendor-lenis.min.js` | MIT |

Les illustrations du thème (cartes 3D, booster, carte stylisée, icônes) sont des créations ChocoCards génériques : aucun personnage, logo ou visuel officiel Pokémon, One Piece ou Bandai.
