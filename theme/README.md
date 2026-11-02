# La Galerie : thème Shopify pour accessoires de cartes à collectionner

Thème Online Store 2.0 écrit de zéro, sans framework, sans bibliothèque JavaScript et sans build.
Une galerie de musée fermée, la nuit : la page d'accueil est une **vitrine** où les produits tournent sur un
plateau de feutrine cerclé de laiton, sous un projecteur, avec des poussières dans le faisceau.

Le nom de la boutique n'est pas choisi : il vaut `NOM_BOUTIQUE` et se change dans **un seul réglage**
(Thème > Personnaliser > Réglages du thème > Marque > Nom de la boutique).

## Démarrer

```bash
npm install -g @shopify/cli@latest
```

```bash
cd theme
shopify theme dev --store TA-BOUTIQUE.myshopify.com
```

Quand tout est prêt (voir `docs/CHECKLIST-LANCEMENT.md`) :

```bash
shopify theme check
```

```bash
shopify theme push --unpublished
```

Le thème est dans le dossier `theme/` du dépôt (le reste du dépôt contient d'autres prototypes). Avec
l'intégration GitHub de Shopify, choisis ce dossier comme racine du thème.

## Documentation

| Fichier | Contenu |
|---|---|
| `docs/PRODUITS.md` | Métachamps à créer, import CSV, carte cadeau, images, collections, DSers, vérifications |
| `docs/products-import.csv` | Les 7 produits de démonstration (brouillons, valeurs techniques `[À VÉRIFIER]`) |
| `docs/IMAGES-PROMPTS.md` | Prompts d'images (boîtiers vides ou coffrets fictifs, sans logo) |
| `docs/REGLES-IP.md` | Règles de propriété intellectuelle |
| `docs/CHECKLIST-LANCEMENT.md` | Tout ce qu'il faut valider avant de publier |

## Architecture

```
assets/     theme.css + un CSS par groupe de sections ; modules ES ; polices WOFF2 ; placeholder-case.svg
config/     réglages du thème (libellés en français)
layout/     theme.liquid, password.liquid
locales/    fr (par défaut), en, nl
sections/   groupes header/footer, vitrine, sections d'accueil, pages principales
snippets/   brand-name, logo, icon, price, product-card, cart-item, cart-contents, facets…
templates/  JSON (index, product, product.kit, collection, page.faq, page.contact, page.livraison…) + gift_card.liquid
docs/       documentation (ignorée par shopify theme push, voir .shopifyignore)
```

- **Modules ES et carte d'import** : `theme.liquid` déclare une `importmap` (`motion-core`, `ui`, `masked-text`,
  `chips`, `dust`, `price-tag`, `page-transitions`, `predictive-search`) avec les URL versionnées des assets.
  Chaque section charge son propre module (`vitrine.js`, `kit.js`, `product-form.js`…).
- **Une seule boucle d'animation** : `motion-core.js`. Les modules s'y abonnent et se désabonnent dès que rien ne
  bouge ; la boucle s'arrête quand l'onglet est caché.
- **Aucun `@keyframes`** sauf le spinner de secours des boutons ; les animations ponctuelles passent par la
  Web Animations API, les apparitions par masques, `clip-path` ou transformations (jamais par fondu d'opacité).
- **Données** : aucune donnée produit en dur dans le JS. La vitrine lit un `<script type="application/json">`
  rendu par Liquid ; le panier, les variantes et les filtres utilisent la Section Rendering API.
- **Sans JS** : la vitrine devient une rangée défilante de cartes, les filtres s'affichent en ligne avec un bouton
  Appliquer, la page panier fonctionne avec `updates[]`, la pagination est dans un `<noscript>`.
- **Mouvement réduit** : plateau qui saute d'un produit à l'autre, pas d'autoplay ni de pendule, 25 particules fixes,
  pas de curseur, d'écran d'ouverture, de transitions de page, de vol vers le panier ni de sticky pour le kit.

## Polices (licence SIL Open Font License 1.1)

Fraunces (© The Fraunces Project Authors), Inter Tight (© The Inter Project Authors), JetBrains Mono
(© The JetBrains Mono Project Authors). Fichiers WOFF2 sous-ensemble latin (accents français, « », ’, €),
auto-hébergés dans `assets/`. Total : 146 Ko.

## Écarts justifiés par rapport au cahier des charges

- **Axes de Fraunces** : avec tous les axes variables, les deux fichiers Fraunces pèsent 250 Ko, au-delà du
  budget de 160 Ko. Le romain garde `wght` (300–600) et `opsz` variables, avec `SOFT` figé à 50 (la valeur des titres)
  et `WONK` à 0 ; l'italique garde `wght` (300–500), avec `opsz` 72 et `SOFT` 100 (les valeurs du logo).
  Les `font-variation-settings` restent écrites dans le CSS : une police complète les appliquerait telles quelles.
- **Vitrine, bureau** : le centre de la scène est à 50 % de hauteur (au lieu de 52 %) et la coupe en biseau de 3°
  remonte vers la gauche. Sinon, à 1440 × 900, la flèche droite chevauchait « Défiler » et le bouton pause.
- **Tablette en portrait** : `--V` vaut `min(38vh, 46vw)` pour que la scène occupe la hauteur.
- **Sommeil de la vitrine** : la rotation lente du produit actif garde la boucle éveillée tant que la vitrine est
  à l'écran ; elle dort hors écran, onglet caché, ou à l'arrêt en mouvement réduit.
- **Voile du tiroir et des calques** : le voile sombre derrière le tiroir apparaît en opacité (ce n'est pas du contenu).
- **Bandeau d'annonce** : un petit bouton pause s'ajoute à la pause au survol et au focus (critère WCAG 2.2.2).
- **Contrastes** : trois couleurs du cahier des charges ne passaient pas 4,5:1 en petit texte sur papier.
  `--muted` passe de `#6B6E75` à `#62656C` ; la valeur par défaut du laiton foncé passe de `#94712B` à `#80611F` ;
  les petits textes rouges et la pastille du panier utilisent `--signal-ink`, un rouge assombri calculé à partir
  du réglage Signal (`color-mix`). Le nom géant du pied de page reste volontairement peu contrasté (texte décoratif,
  masqué aux lecteurs d'écran).
- **Fiche produit** : la logique de la fiche (variantes, livraison estimée, barre collante, recommandations) est dans
  `product-info.js`, pour que `product-form.js` (ajout au panier, chargé sur l'accueil) reste léger : 75 Ko de JS
  sur l'accueil, sous le budget de 80 Ko.
- **CSV** : le centre d'aide Shopify n'était pas joignable pendant la génération ; les en-têtes suivent le modèle
  2024-2025 (voir `docs/PRODUITS.md` pour la marche à suivre si l'import refuse une colonne).
