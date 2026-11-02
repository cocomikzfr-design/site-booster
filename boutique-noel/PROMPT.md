# PROMPT CLAUDE CODE — Boutique Shopify de Noël « Noël en Façade »

> Version 1.0 — rédigée le 1er novembre 2026.
> Fichier à placer à la racine du projet sous le nom `PROMPT.md`.
> Langue des textes du site : français (vouvoiement du client).
> Langue du code (noms de fichiers, classes, variables, identifiants de réglages) : anglais.
> Les mentions [À COMPLÉTER] et [À VÉRIFIER] restent visibles tant que Corentin ne les a pas remplies.

---

## 0. Mode d'emploi (pour Corentin, pas pour Claude Code)

1. Crée un dossier vide sur ton ordinateur, par exemple `boutique-noel`.
2. Copie ce fichier dans ce dossier et nomme-le `PROMPT.md`.
3. Installe Node.js (version LTS) si ce n'est pas déjà fait.
4. Installe Shopify CLI dans un terminal : `npm install -g @shopify/cli@latest`
5. Vérifie l'installation : `shopify version`
6. Ouvre Claude Code dans le dossier `boutique-noel`.
7. Écris : « Lis PROMPT.md en entier, puis exécute-le phase par phase. »
8. Réponds aux questions de la phase 0 (adresse de ta boutique, nom, e-mail de contact).
9. Quand Claude Code lance `shopify theme dev`, connecte-toi à Shopify dans le navigateur qui s'ouvre.
10. Le thème est envoyé en « non publié » : tu le prévisualises, puis c'est toi qui le publies.
11. Remplis ensuite tout ce qui est marqué [À COMPLÉTER] et [À VÉRIFIER].
12. Les produits restent importés avec DSers : le thème ne crée pas les produits, il les affiche.
13. Pour chaque produit, choisis le bon modèle de page (template) dans la fiche produit de l'admin Shopify.
14. Colle les textes légaux du dossier `content/legal/` dans les politiques de ta boutique (Paramètres > Politiques).
15. Garde ce fichier : si tu modifies la boutique plus tard, Claude Code s'en servira comme référence.

---

## 1. Ton rôle

- Tu es un développeur Shopify senior, spécialiste des thèmes Online Store 2.0.
- Tu écris un thème Shopify complet, sur mesure, à partir de zéro.
- Tu ne copies pas Dawn ni un autre thème existant : chaque fichier est écrit pour ce projet.
- Tu travailles pour Corentin, un marchand débutant qui vend en dropshipping depuis la Belgique.
- Tu lui expliques ce que tu fais en français simple, en phrases courtes, sans jargon inutile.
- Tu avances phase par phase (section 4) et tu fais un commit git à la fin de chaque phase.
- Quand une information manque, tu poses la question au lieu d'inventer.
- Quand tu ne peux pas vérifier une affirmation sur un produit, tu écris [À VÉRIFIER : ...].
- Tu écris un code lisible, cohérent d'un fichier à l'autre, commenté avec parcimonie.
- Tu ne touches jamais au thème publié (en ligne) de la boutique.
- Tu ne prétends jamais avoir testé quelque chose que tu n'as pas réellement testé.

---

## 2. Contexte business

### 2.1 Le marchand
- Prénom : Corentin.
- Pays d'établissement : Belgique.
- Abonnement Shopify : Basic.
- Paiements : Shopify Payments (cartes bancaires, Bancontact pour la Belgique, Apple Pay et Google Pay si activés).
- Niveau : débutant en e-commerce, à l'aise avec l'informatique, a déjà fait des sites web.

### 2.2 Le modèle
- Dropshipping : aucun stock, aucune préparation de colis par Corentin.
- Fournisseurs : vendeurs AliExpress, commandes passées via l'application DSers.
- Les produits sont importés et reliés aux fournisseurs par DSers, pas par le thème.
- Le thème affiche les produits, gère le panier et mène jusqu'au checkout Shopify.
- Délai de livraison réel annoncé au client : 7 à 12 jours après la commande.
- Livraison offerte en France et en Belgique (tarif à configurer dans l'admin, voir section 17).
- Inventaire : non suivi dans Shopify (pas de gestion de stock), les produits restent toujours disponibles.

### 2.3 Le marché
- Pays : France et Belgique.
- Langue : français uniquement.
- Devise : euro.
- Cible : foyers qui décorent leur maison et leur jardin pour Noël, achat plaisir, souvent sur mobile.
- Trafic : vidéos TikTok organiques et publicités vidéo générées par IA (TikTok, Meta).
- Conséquence : plus de trois visites sur quatre viendront d'un téléphone. Le mobile est la priorité absolue.
- Le visiteur arrive souvent directement sur une fiche produit depuis une pub : chaque fiche doit se suffire à elle-même.

### 2.4 Le calendrier
- Mise en ligne visée : 10 novembre 2026.
- Date limite pour recevoir avant Noël : 8 décembre 2026 à 23 h 59 (réglable dans les paramètres du thème).
- Après cette date, le site continue de vendre avec un message honnête : livraison après Noël.
- Fin de saison : mi-janvier 2027. Le thème doit pouvoir passer en mode « hors saison » par un simple réglage.

### 2.5 Le catalogue (5 produits)

| # | Produit | Handle Shopify | Prix de vente | Modèle de page |
|---|---|---|---|---|
| 1 | Pack Façade de Noël (projecteur + guirlande neige) | `pack-facade-de-noel` | 44,90 € | `product.pack` |
| 2 | Projecteur de Noël LED 16 motifs | `projecteur-de-noel-led` | 29,90 € | `product.projecteur` |
| 3 | Couronne de Noël lumineuse 40 cm | `couronne-de-noel-lumineuse` | 34,90 € | `product.couronne` |
| 4 | Guirlande « neige qui tombe » 8 tubes | `guirlande-neige-qui-tombe` | 24,90 € | `product.guirlande` |
| 5 | Sapin de Noël en feutrine pour enfant, 100 cm | `sapin-feutrine-enfant` | 17,90 € | `product.sapin` |

- Le produit vedette est le pack : il double le panier moyen pour une seule publicité.
- Les prix sont saisis dans l'admin Shopify, jamais codés en dur dans le thème.
- Les handles servent aux réglages par défaut et aux liens internes ; ils restent modifiables par des réglages `product`.
- Collection principale : handle `noel`, titre « Décorations lumineuses de Noël », contenant les 5 produits.
- Le pack est un produit Shopify à part entière (un seul article dans le panier), pas un regroupement de deux lignes.

### 2.6 Objectifs mesurables du site
- Taux de conversion visé : 2 à 3 acheteurs pour 100 visiteurs.
- Contenu principal visible en moins de 2,5 secondes sur mobile en 4G.
- Lighthouse mobile : au moins 80 en performance, 95 en accessibilité, 95 en bonnes pratiques, 95 en SEO.
- Ajout au panier sans quitter la fiche produit (tiroir panier).
- Le pack visible sur la page d'accueil après au plus un écran de défilement sur mobile.
- Aucune erreur JavaScript dans la console sur les pages principales.

---

## 3. Règles absolues (à respecter dans chaque fichier)

### 3.1 Honnêteté envers le client (droit de la consommation européen)
- Aucun faux avis, aucune fausse note, aucun faux témoignage.
- Pas de section d'avis clients tant qu'il n'existe pas de vrais avis (prévoir seulement un emplacement d'application désactivé).
- Aucun faux compteur de stock (« plus que 3 en stock ») : il n'y a pas de stock.
- Aucun faux indicateur d'activité (« 27 personnes regardent ce produit », « Marie de Lyon vient d'acheter »).
- Aucun compte à rebours artificiel qui redémarre à chaque visite ou à chaque session.
- Le seul compte à rebours autorisé mène à la vraie date limite de livraison avant Noël, identique pour tout le monde.
- Aucun prix barré inventé : un prix barré ne s'affiche que si `compare_at_price` est renseigné dans l'admin.
- Le badge de réduction est désactivé par défaut (réglage `show_discount_badge`).
- Le README rappelle à Corentin qu'une réduction annoncée doit se calculer sur le prix le plus bas pratiqué dans les 30 jours précédents.
- Le délai de livraison affiché est toujours le délai réel (7 à 12 jours), jamais « 48 h » ni « express ».
- Ne jamais écrire « expédié depuis la France », « stock en Europe », « fabriqué en France » ou « artisanal ».
- Ne jamais promettre une caractéristique non vérifiée : étanchéité, indice IP, puissance, autonomie, durée de vie, certification.
- Toute caractéristique incertaine s'écrit [À VÉRIFIER : ...] dans les contenus et reste visible pour Corentin.
- Les photos et vidéos d'une fiche produit montrent le vrai produit.
- Les visuels d'ambiance générés par IA restent décoratifs et ne doivent pas faire croire à un effet que le produit ne produit pas.
- Le droit de rétractation de 14 jours est mentionné sur la fiche produit, dans le panier, dans le pied de page et dans les CGV.
- Les mentions « garantie », « satisfait ou remboursé » et « retour gratuit » ne s'emploient que si elles figurent dans les politiques réelles.

### 3.2 Sécurité de la boutique
- Interdit : `shopify theme publish`.
- Interdit : `shopify theme delete`.
- Interdit : toute commande qui modifie le thème publié.
- `shopify theme push` uniquement avec `--unpublished` (premier envoi), ou vers l'identifiant du thème non publié que tu as créé, après accord de Corentin.
- Interdit : stocker un mot de passe, un jeton d'API ou une clé dans le dépôt.
- Le `.gitignore` exclut au minimum `node_modules/`, `.env`, `.shopify/`, `*.log`, `.DS_Store`.
- Tu ne crées pas, ne modifies pas et ne supprimes pas de produits, collections, pages, menus ou commandes dans la boutique.
- Ce travail-là se fait dans l'admin par Corentin ; tu lui donnes la liste précise des actions (section 17).

### 3.3 Règles techniques
- Online Store 2.0 : modèles JSON, sections partout, groupes de sections pour l'en-tête et le pied de page.
- Liquid moderne : `render` (jamais `include`), `image_url` + `image_tag` (jamais `img_url`).
- JavaScript : vanilla ES2020, sans jQuery, sans framework, sans dépendance npm chargée sur le site.
- Composants avec un état : Web Components (`customElements.define`), un composant par responsabilité.
- Scripts chargés avec `defer` ; aucun script bloquant dans le `<head>` en dehors de `content_for_header`.
- CSS : fichiers dans `assets/`, variables CSS, approche mobile d'abord, pas de framework CSS.
- Aucun script ni feuille de style chargés depuis un CDN externe.
- Polices : uniquement via le sélecteur de polices Shopify (`font_picker`) et le filtre `font_face`.
- Tous les textes visibles par le client passent par `locales/fr.default.json` (filtre `t`) ou par des réglages de section.
- Toutes les URL internes utilisent l'objet `routes` (`routes.cart_url`, `routes.cart_add_url`, `routes.cart_change_url`, `routes.root_url`, `routes.search_url`, `routes.all_products_collection_url`).
- Chaque section a un `{% schema %}` complet, des libellés en français et un `presets` si elle doit pouvoir s'ajouter à une page.
- Identifiants de réglages en anglais, en snake_case.
- Classes CSS en kebab-case, préfixées par le nom du composant (`product-card__title`, `cart-drawer__footer`).
- `shopify theme check` doit terminer sans erreur ; les avertissements restants sont listés et justifiés dans le rapport final.

### 3.4 Règle des 3000 lignes
- Le thème final contient au moins 3000 lignes de code réel (Liquid, JSON, CSS, JavaScript), lignes vides exclues.
- Les fichiers de `content/` (textes à coller dans l'admin), `README.md` et ce `PROMPT.md` ne comptent pas.
- Interdit de gonfler : pas de code dupliqué, pas de commentaires de remplissage, pas de règles CSS inutilisées, pas de JSON mort.
- La spécification ci-dessous dépasse naturellement ce seuil ; si tu es en dessous, une partie manque : complète-la.
- Commande de contrôle, à lancer en phase 11 :

```bash
find assets config layout locales sections snippets templates -type f \
  \( -name "*.liquid" -o -name "*.json" -o -name "*.css" -o -name "*.js" \) \
  -exec grep -cv '^\s*$' {} + | awk -F: '{s+=$2} END {print s " lignes de code non vides"}'
```

---

## 4. Méthode de travail (phases)

Avance dans cet ordre. À la fin de chaque phase : résumé en trois lignes maximum, commit git, phase suivante.
Ne demande pas l'accord de Corentin entre les phases, sauf aux points marqués STOP.

### Phase 0 — Lecture et questions (STOP)
- Lis ce fichier en entier avant d'écrire la moindre ligne.
- Pose à Corentin, en un seul message, les questions suivantes :
  1. L'adresse de sa boutique (format `nom.myshopify.com`).
  2. Le nom de la boutique (valeur par défaut : « Noël en Façade »).
  3. L'e-mail du service client affiché sur le site.
  4. S'il a un logo (fichier image) ou s'il préfère un logo texte.
  5. S'il a déjà des vidéos et photos des produits (sinon : emplacements prévus, remplis plus tard dans l'éditeur).
- Si une réponse manque, utilise la valeur par défaut et note-le dans le rapport final.

### Phase 1 — Initialisation
- `git init`, création de `.gitignore` et `.shopifyignore` (ce dernier exclut `content/`, `README.md`, `PROMPT.md`).
- Création de toute l'arborescence de la section 5.
- Création de `README.md` en français : but du thème, commandes utiles, actions à faire dans l'admin, rappels légaux.
- Commit : `chore: initialisation du thème Noël en Façade`.

### Phase 2 — Configuration, gabarit et traductions
- `config/settings_schema.json` et `config/settings_data.json` (section 8).
- `layout/theme.liquid` et `layout/password.liquid` (section 7).
- `locales/fr.default.json` (section 9).
- Commit : `feat: configuration, gabarit et traductions`.

### Phase 3 — Design system CSS
- `assets/base.css` et `assets/components.css` (section 6).
- Commit : `style: design system`.

### Phase 4 — Snippets
- Tous les fichiers de `snippets/` (section 10).
- Commit : `feat: snippets`.

### Phase 5 — Sections globales
- `announcement-bar`, `header`, `footer`, `cart-drawer`, `cart-icon-bubble`, `header-group.json`, `footer-group.json` (section 11 et annexe A.4).
- Commit : `feat: en-tête, pied de page et tiroir panier`.

### Phase 6 — Page d'accueil
- Sections d'accueil (section 11) et `templates/index.json` (section 12).
- Commit : `feat: page d'accueil`.

### Phase 7 — Fiches produits
- `main-product`, `product-details`, `product-upsell`, `assets/section-product.css`, `assets/product.js`.
- Modèles `product.json`, `product.pack.json`, `product.projecteur.json`, `product.couronne.json`, `product.guirlande.json`, `product.sapin.json`.
- Textes repris de la section 14.
- Commit : `feat: fiches produits`.

### Phase 8 — Autres pages
- Collection, liste des collections, panier, recherche, page, contact, 404, blog, article, mot de passe, carte cadeau.
- Commit : `feat: pages secondaires`.

### Phase 9 — JavaScript
- `theme.js`, `cart.js`, `delivery.js`, `snow.js` (section 13), puis relecture de `product.js`.
- Commit : `feat: comportements JavaScript`.

### Phase 10 — Contenus à coller dans l'admin
- Dossier `content/` : descriptions produits (section 14) et textes légaux (section 15).
- Commit : `docs: contenus produits et textes légaux`.

### Phase 11 — Vérifications
- `shopify theme check` : zéro erreur.
- Comptage des lignes (règle 3.4).
- `shopify theme dev --store <adresse>` puis tests de la section 18, sur mobile (375 px) et sur ordinateur (1280 px).
- Corrige tout ce qui échoue, puis commit : `test: vérifications finales`.

### Phase 12 — Envoi en non publié (STOP)
- Demande l'accord de Corentin.
- `shopify theme push --unpublished --store <adresse>` ; nom du thème : « Noël en Façade v1 ».
- Rapport final (section 19).

### Messages de commit
- Format : `type: description courte en français`.
- Types autorisés : `chore`, `feat`, `style`, `fix`, `docs`, `test`.
- Au moins un commit par phase.

---

## 5. Arborescence et objectifs de taille

Les tailles sont indicatives (lignes non vides, plus ou moins 30 %). Elles servent à vérifier que rien n'a été oublié.

```text
boutique-noel/
├── PROMPT.md
├── README.md
├── .gitignore
├── .shopifyignore
├── assets/
│   ├── base.css
│   ├── components.css
│   ├── section-product.css
│   ├── section-cart.css
│   ├── section-collection.css
│   ├── theme.js
│   ├── cart.js
│   ├── product.js
│   ├── delivery.js
│   └── snow.js
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/
│   ├── theme.liquid
│   └── password.liquid
├── locales/
│   └── fr.default.json
├── sections/
│   ├── header-group.json
│   ├── footer-group.json
│   ├── announcement-bar.liquid
│   ├── header.liquid
│   ├── footer.liquid
│   ├── cart-drawer.liquid
│   ├── cart-icon-bubble.liquid
│   ├── hero-video.liquid
│   ├── featured-pack.liquid
│   ├── product-grid.liquid
│   ├── how-it-works.liquid
│   ├── delivery-deadline.liquid
│   ├── trust-badges.liquid
│   ├── image-with-text.liquid
│   ├── faq.liquid
│   ├── newsletter.liquid
│   ├── rich-text.liquid
│   ├── main-product.liquid
│   ├── product-details.liquid
│   ├── product-upsell.liquid
│   ├── main-collection.liquid
│   ├── main-list-collections.liquid
│   ├── main-cart.liquid
│   ├── main-search.liquid
│   ├── main-page.liquid
│   ├── contact-form.liquid
│   ├── main-404.liquid
│   ├── main-blog.liquid
│   ├── main-article.liquid
│   └── main-password.liquid
├── snippets/
│   ├── meta-tags.liquid
│   ├── icon.liquid
│   ├── responsive-image.liquid
│   ├── price.liquid
│   ├── product-card.liquid
│   ├── buy-buttons.liquid
│   ├── variant-picker.liquid
│   ├── quantity-input.liquid
│   ├── delivery-estimate.liquid
│   ├── deadline-countdown.liquid
│   ├── cart-item.liquid
│   ├── cart-icon-content.liquid
│   ├── trust-row.liquid
│   ├── pagination.liquid
│   ├── social-links.liquid
│   └── breadcrumbs.liquid
├── templates/
│   ├── index.json
│   ├── product.json
│   ├── product.pack.json
│   ├── product.projecteur.json
│   ├── product.couronne.json
│   ├── product.guirlande.json
│   ├── product.sapin.json
│   ├── collection.json
│   ├── list-collections.json
│   ├── cart.json
│   ├── search.json
│   ├── page.json
│   ├── page.contact.json
│   ├── 404.json
│   ├── blog.json
│   ├── article.json
│   ├── password.json
│   └── gift_card.liquid
└── content/
    ├── produits/
    │   ├── pack-facade-de-noel.html
    │   ├── projecteur-de-noel-led.html
    │   ├── couronne-de-noel-lumineuse.html
    │   ├── guirlande-neige-qui-tombe.html
    │   └── sapin-feutrine-enfant.html
    └── legal/
        ├── mentions-legales.md
        ├── cgv.md
        ├── retours.md
        ├── livraison.md
        ├── confidentialite.md
        └── contact.md
```

| Fichier | Rôle | Lignes visées |
|---|---|---|
| `assets/base.css` | Variables, reset, typographie, grille, utilitaires, animations | 400 |
| `assets/components.css` | Boutons, badges, cartes, formulaires, accordéons, tiroir, en-tête, pied de page | 450 |
| `assets/section-product.css` | Fiche produit, galerie, bouton collant, upsell | 250 |
| `assets/section-cart.css` | Page panier et tiroir panier | 150 |
| `assets/section-collection.css` | Collection, recherche, liste des collections | 90 |
| `assets/theme.js` | Utilitaires, menu mobile, accordéons, apparition au défilement | 180 |
| `assets/cart.js` | Tiroir panier, ajout et modification en AJAX | 220 |
| `assets/product.js` | Variantes, galerie, quantité, bouton collant | 230 |
| `assets/delivery.js` | Dates de livraison estimées et compte à rebours réel | 120 |
| `assets/snow.js` | Neige décorative légère | 70 |
| `config/settings_schema.json` | Réglages du thème | 350 |
| `config/settings_data.json` | Valeurs par défaut | 50 |
| `layout/theme.liquid` | Gabarit principal | 120 |
| `layout/password.liquid` | Gabarit de la page mot de passe | 60 |
| `locales/fr.default.json` | Tous les textes de l'interface | 200 |
| `sections/*.liquid` | 30 sections | 2600 |
| `snippets/*.liquid` | 16 snippets | 800 |
| `templates/*.json` | 17 modèles JSON + carte cadeau | 900 |

Total visé : environ 7000 lignes non vides, soit plus du double du minimum demandé.

---

## 6. Design system (`assets/base.css` et `assets/components.css`)

### 6.1 Direction artistique
- Ambiance : une maison illuminée par une nuit d'hiver.
- Fond bleu nuit profond, lumières dorées chaudes, rouge Noël réservé aux actions (boutons d'achat).
- Sobre et premium, pas de « déguisement » de Noël : pas de clip-art, pas de police fantaisie illisible.
- Les vidéos et photos de nuit des produits sont les vraies stars : le design les encadre, il ne les concurrence pas.
- Alternance de sections sombres (nuit) et claires (crème) pour rythmer la page et reposer l'œil.
- Une seule touche festive animée : la neige légère du réglage `snow_enabled`, désactivable.
- Pictogrammes au trait fin (1,5 px), arrondis, cohérents entre eux (snippet `icon`).

### 6.2 Couleurs
Les couleurs viennent des réglages du thème (section 8) et sont injectées dans `:root` par `layout/theme.liquid`.

| Variable CSS | Réglage | Valeur par défaut | Usage |
|---|---|---|---|
| `--color-night` | `color_night` | `#0E1A2B` | Fond des sections sombres, en-tête |
| `--color-night-soft` | `color_night_soft` | `#15243A` | Cartes sur fond sombre, survols |
| `--color-cream` | `color_cream` | `#FBF7F0` | Fond des sections claires |
| `--color-surface` | `color_surface` | `#FFFFFF` | Cartes et champs sur fond clair |
| `--color-text-dark` | `color_text_dark` | `#1B2430` | Texte sur fond clair |
| `--color-text-light` | `color_text_light` | `#F7F4EE` | Texte sur fond sombre |
| `--color-muted-dark` | `color_muted_dark` | `#5B6575` | Texte secondaire sur fond clair |
| `--color-muted-light` | `color_muted_light` | `#A9B4C4` | Texte secondaire sur fond sombre |
| `--color-gold` | `color_gold` | `#E8B54A` | Accents, étoiles, lueurs, liens sur fond sombre |
| `--color-red` | `color_red` | `#C8312B` | Bouton d'achat, badges importants |
| `--color-red-hover` | calculée | `color-mix(in srgb, var(--color-red) 85%, black)` | Survol du bouton d'achat |
| `--color-green` | `color_green` | `#1F5E46` | Messages de succès, pictogrammes de confiance |
| `--color-border-dark` | calculée | `rgba(255,255,255,.12)` | Bordures sur fond sombre |
| `--color-border-light` | calculée | `rgba(27,36,48,.12)` | Bordures sur fond clair |
| `--color-overlay` | calculée | `rgba(8,14,24,.6)` | Fond derrière le tiroir panier et le menu |

Contrastes à respecter (WCAG AA, 4,5:1 pour le texte courant) :
- `--color-text-light` sur `--color-night` : environ 16:1.
- `--color-muted-light` sur `--color-night` : environ 8:1.
- `--color-gold` sur `--color-night` : environ 9:1.
- Texte blanc sur `--color-red` : environ 5,3:1.
- `--color-muted-dark` sur `--color-cream` : au moins 5:1.
- Si Corentin change une couleur dans l'éditeur, le contraste reste sa responsabilité : le dire dans le README.

Schémas de couleur de section (réglage `color_scheme` de chaque section) :
- `night` : fond `--color-night`, texte `--color-text-light`, secondaire `--color-muted-light`, liens `--color-gold`.
- `night-soft` : fond `--color-night-soft`, mêmes textes que `night`.
- `cream` : fond `--color-cream`, texte `--color-text-dark`, secondaire `--color-muted-dark`, liens `--color-red`.
- `white` : fond `--color-surface`, mêmes textes que `cream`.
- Implémentation : classes `.scheme-night`, `.scheme-night-soft`, `.scheme-cream`, `.scheme-white` qui redéfinissent `--bg`, `--fg`, `--fg-muted`, `--link`, `--border`.
- Tous les composants utilisent `--bg`, `--fg`, `--fg-muted`, `--link`, `--border` : jamais une couleur en dur.

### 6.3 Typographie
- Titres : réglage `type_heading_font` (défaut `playfair_display_n4`), graisse 400 à 700 selon le niveau.
- Texte : réglage `type_body_font` (défaut `assistant_n4`), avec la variante grasse générée par `font_modify: 'weight', 'bold'`.
- Si l'un de ces identifiants n'existe pas dans la bibliothèque de polices Shopify, `shopify theme check` le signalera : remplace par une police proche de la bibliothèque et note-le dans le rapport.
- Échelle fluide (multipliée par le réglage `heading_scale` en pourcentage) :
  - `--fs-h1` : `clamp(2rem, 1.4rem + 3vw, 3.5rem)`
  - `--fs-h2` : `clamp(1.6rem, 1.2rem + 2vw, 2.6rem)`
  - `--fs-h3` : `clamp(1.25rem, 1.05rem + 1vw, 1.75rem)`
  - `--fs-h4` : `1.125rem`
  - `--fs-body` : `1rem` (16 px minimum sur mobile, multiplié par `body_scale`)
  - `--fs-small` : `0.875rem`
  - `--fs-xs` : `0.75rem` (mentions légales, jamais pour une information importante)
- Interlignage : 1,15 pour les titres, 1,6 pour le texte courant.
- Longueur de ligne maximale du texte courant : 68 caractères (`max-width: 68ch`).
- Les prix utilisent la police du texte, graisse 700, chiffres tabulaires (`font-variant-numeric: tabular-nums`).
- Pas de texte en majuscules sur plus de 4 mots ; les petites étiquettes peuvent utiliser `text-transform: uppercase` avec `letter-spacing: .08em`.

### 6.4 Espacements, rayons, ombres
- Échelle d'espacement : `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 24px`, `--space-6: 32px`, `--space-7: 48px`, `--space-8: 64px`, `--space-9: 96px`.
- Marge verticale des sections : `--section-gap: clamp(48px, 8vw, 96px)`, réglable par section (`padding_top`, `padding_bottom`).
- Gouttière latérale : 16 px sur mobile, 24 px à partir de 750 px, 40 px à partir de 990 px.
- Largeur maximale du contenu : `--page-width: 1200px` ; variante étroite `--page-width-narrow: 760px`.
- Rayons : `--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 20px`, `--radius-pill: 999px`.
- Ombre des cartes claires : `0 8px 24px rgba(14,26,43,.08)`.
- Lueur dorée (cartes sur fond sombre, survol) : `0 0 0 1px rgba(232,181,74,.25), 0 0 32px rgba(232,181,74,.18)`.
- Échelle de superposition : `--z-header: 20`, `--z-sticky-atc: 30`, `--z-overlay: 40`, `--z-drawer: 50`, `--z-toast: 60`.

### 6.5 Points de rupture
- Mobile d'abord, sans media query.
- Tablette : `@media (min-width: 750px)`.
- Ordinateur : `@media (min-width: 990px)`.
- Grand écran : `@media (min-width: 1400px)` (uniquement pour élargir les marges).
- Tout doit fonctionner à 320 px de large sans défilement horizontal.

### 6.6 `base.css` — contenu attendu
- Déclarations `@font-face` : non, elles sont générées dans `theme.liquid` par `font_face`.
- Reset moderne : `box-sizing: border-box`, marges à zéro, images et vidéos en `max-width: 100%` et `height: auto`.
- `html` : `scroll-behavior: smooth` uniquement si `prefers-reduced-motion: no-preference`.
- `body` : fond `--bg`, couleur `--fg`, police du texte, `-webkit-font-smoothing: antialiased`.
- Titres `h1` à `h4` et classes équivalentes `.h1` à `.h4`.
- Liens : couleur `--link`, soulignement décalé (`text-underline-offset: 3px`), focus visible.
- Anneau de focus global : `:focus-visible { outline: 2px solid var(--color-gold); outline-offset: 3px; }`.
- Classe `.page-width` et `.page-width--narrow`.
- Grille utilitaire `.grid` avec variables `--grid-cols-mobile`, `--grid-cols-tablet`, `--grid-cols-desktop`, `--grid-gap`.
- Utilitaires : `.visually-hidden`, `.skip-link`, `.text-center`, `.text-muted`, `.stack` (gap vertical), `.cluster` (flex wrap avec gap), `.hidden-mobile`, `.hidden-desktop`.
- Schémas de couleur `.scheme-*` (section 6.2).
- Section générique `.section` avec `padding-block` piloté par les variables de section.
- Animations :
  - `@keyframes twinkle` (scintillement doux de l'opacité 0,6 → 1) pour les petites étoiles décoratives.
  - `@keyframes fade-up` (opacité 0 → 1, translation 16 px → 0) pour l'apparition au défilement.
  - Classe `.reveal` (état initial) et `.reveal.is-visible` (état final), pilotées par `theme.js`.
  - `@media (prefers-reduced-motion: reduce)` : toutes les animations et transitions réduites à 0,01 ms, `.reveal` visible d'emblée.
- Couche de neige `.snow-layer` : position fixe, `pointer-events: none`, `z-index` sous l'en-tête, `aria-hidden`.

### 6.7 `components.css` — composants attendus
Boutons :
- `.button` : hauteur minimale 48 px, padding horizontal 24 px, rayon `--radius-pill`, graisse 700, transition de couleur 150 ms.
- `.button--primary` : fond `--color-red`, texte blanc, survol `--color-red-hover`.
- `.button--secondary` : contour 1,5 px `--color-gold`, texte `--fg`, fond transparent.
- `.button--ghost` : sans fond ni bordure, souligné.
- `.button--full` : largeur 100 %.
- `.button[aria-busy="true"]` : texte masqué, petit indicateur de chargement centré (pseudo-élément animé).
- `.button[disabled]` : opacité 0,5, curseur interdit.
Badges :
- `.badge` : petite étiquette arrondie, `--fs-xs`, majuscules espacées.
- `.badge--gold` (Le plus choisi, Nouveau), `.badge--red` (réduction, seulement si prix barré réel), `.badge--green` (Livraison offerte).
Cartes :
- `.card` : fond `--color-surface` ou `--color-night-soft` selon le schéma, rayon `--radius-md`, débordement masqué.
- `.card__media` : ratio fixe via `aspect-ratio`, image en `object-fit: cover`.
- `.card__body`, `.card__title`, `.card__price`, `.card__cta`.
- Survol (ordinateur uniquement, `@media (hover: hover)`) : légère élévation et lueur dorée.
Formulaires :
- `.field` : libellé au-dessus du champ, jamais seulement un placeholder.
- `.field__input`, `.field__textarea`, `.field__select` : hauteur 48 px, bordure `--border`, rayon `--radius-sm`.
- `.field--error` : bordure rouge et message `.field__error` relié par `aria-describedby`.
- `.checkbox` personnalisée accessible (case native visible ou stylée sans être masquée aux lecteurs d'écran).
Accordéon :
- Basé sur `<details>` et `<summary>`, pictogramme plus/moins qui tourne, animation de hauteur désactivée en mouvement réduit.
Tiroir et superposition :
- `.drawer` : panneau à droite, largeur `min(420px, 100vw)`, translation pour l'ouverture, `--z-drawer`.
- `.overlay` : fond `--color-overlay`, `--z-overlay`, clic pour fermer.
- `body.is-locked` : `overflow: hidden` quand un tiroir est ouvert.
Notification :
- `.toast` : message bref en bas de l'écran, `role="status"`, disparaît après 4 secondes.
En-tête :
- `.header` : collant (`position: sticky; top: 0`), fond `--color-night` légèrement translucide avec `backdrop-filter: blur(8px)` si supporté.
- Hauteur 64 px sur mobile, 76 px sur ordinateur ; logo centré sur mobile, à gauche sur ordinateur.
- Pastille du nombre d'articles du panier sur l'icône panier.
Menu mobile :
- `.menu-drawer` : panneau à gauche, liens en grand (taille `--fs-h4`), cible tactile 48 px.
Pied de page :
- `.footer` : schéma `night`, colonnes empilées sur mobile, 4 colonnes sur ordinateur.
- Ligne des moyens de paiement avec `payment_type_svg_tag`.
Divers :
- `.price` et `.price--compare` (barré, `--fg-muted`).
- `.rating` : non utilisé tant qu'il n'y a pas d'avis réels (ne pas le créer).
- `.skeleton` : bloc gris animé pour le chargement du tiroir panier.
- `.sticky-atc` : barre d'achat collante en bas de l'écran sur mobile (détails section 11).
- `.countdown` : chiffres en police des titres, séparateurs dorés.

---

## 7. Gabarits (`layout/`)

### 7.1 `layout/theme.liquid`
Structure attendue, dans cet ordre :
1. `<!doctype html>` puis `<html lang="{{ request.locale.iso_code }}" class="no-js">`.
2. `<head>` :
   - `<meta charset="utf-8">`, `<meta http-equiv="X-UA-Compatible" content="IE=edge">`.
   - `<meta name="viewport" content="width=device-width, initial-scale=1">`.
   - `<meta name="theme-color" content="{{ settings.color_night }}">`.
   - `<link rel="canonical" href="{{ canonical_url }}">`.
   - Favicon si `settings.favicon` est renseigné (`image_url: width: 32, height: 32`).
   - `<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>`.
   - Titre : `page_title`, avec le numéro de page si `current_page > 1`, puis ` – {{ shop.name }}` si le titre ne le contient pas déjà.
   - `{% render 'meta-tags' %}`.
   - Préchargement de la police du texte uniquement (`font_url` avec `rel="preload"`), voir annexe A.1.
   - `{{ content_for_header }}`.
   - Bloc `<style>` : `font_face` (avec `font_display: 'swap'`) pour les titres et le texte, variante grasse du texte, puis `:root { ... }` avec toutes les variables de couleur, de police et d'échelle issues des réglages.
   - `{{ 'base.css' | asset_url | stylesheet_tag }}` et `{{ 'components.css' | asset_url | stylesheet_tag }}`.
   - Scripts en `defer` : `theme.js`, `cart.js`, `delivery.js` ; `snow.js` seulement si `settings.snow_enabled`.
   - Script inline minimal : remplacer la classe `no-js` par `js` sur `<html>`.
   - Objet de configuration `window.themeConfig` (voir 7.2) dans un `<script>` inline.
3. `<body class="template-{{ template.name }}{% if template.suffix %} template-{{ template.name }}--{{ template.suffix }}{% endif %}">` :
   - Lien d'évitement : `<a class="skip-link" href="#MainContent">` avec le texte `general.skip_to_content`.
   - `{% sections 'header-group' %}`.
   - `<main id="MainContent" class="main" role="main" tabindex="-1">{{ content_for_layout }}</main>`.
   - `{% sections 'footer-group' %}`.
   - `{% section 'cart-drawer' %}` uniquement si `settings.cart_type == 'drawer'`.
   - `<div class="snow-layer" aria-hidden="true" data-density="{{ settings.snow_density }}"></div>` si `settings.snow_enabled`.
   - Zone de notification `<div class="toast" role="status" aria-live="polite" hidden></div>`.
   - `<noscript>` : message discret indiquant que le panier fonctionne aussi sans JavaScript (formulaires classiques).

### 7.2 `window.themeConfig`
Objet sérialisé avec `json`, contenant :
- `routes` : `cart_url`, `cart_add_url`, `cart_change_url`, `cart_update_url`, `root_url`, `search_url`.
- `cartType` : valeur de `settings.cart_type`.
- `seasonMode` : valeur de `settings.season_mode`.
- `deadline` : `settings.delivery_deadline_date` et `settings.delivery_deadline_time`, combinés côté JavaScript en heure de Bruxelles.
- `delivery` : `settings.delivery_min_days`, `settings.delivery_max_days`, `settings.delivery_skip_sundays`.
- `strings` : les textes JavaScript traduits (`products.adding`, `products.added`, `cart.error_generic`, `cart.error_quantity`, `countdown.days`, `countdown.hours`, `countdown.minutes`, `countdown.deadline_passed`, `delivery.estimate`, `delivery.after_christmas`).
- `locale` : `request.locale.iso_code`, utilisé par `Intl.DateTimeFormat` pour les dates en français.
- `moneyFormat` : `shop.money_format`.

### 7.3 `layout/password.liquid`
- Même `<head>` que `theme.liquid` (factoriser ce qui peut l'être dans `meta-tags`), sans en-tête ni pied de page.
- `{{ content_for_layout }}` dans un conteneur centré, schéma `night`, avec la neige si activée.
- Lien discret « Accès propriétaire » vers `/admin`.

---

## 8. Réglages du thème (`config/settings_schema.json`)

Le premier objet du tableau est `theme_info` :
- `theme_name` : « Noël en Façade ».
- `theme_version` : « 1.0.0 ».
- `theme_author` : « Corentin ».
- `theme_documentation_url` et `theme_support_url` : `https://www.shopify.com` (aucune documentation publique).

Puis les groupes suivants, avec des libellés et des textes d'aide en français.

### 8.1 Groupe « Couleurs »
- `color_night` (color, `#0E1A2B`) — Bleu nuit des sections sombres.
- `color_night_soft` (color, `#15243A`) — Bleu nuit des cartes.
- `color_cream` (color, `#FBF7F0`) — Fond des sections claires.
- `color_surface` (color, `#FFFFFF`) — Fond des cartes claires.
- `color_text_dark` (color, `#1B2430`) — Texte sur fond clair.
- `color_text_light` (color, `#F7F4EE`) — Texte sur fond sombre.
- `color_muted_dark` (color, `#5B6575`) — Texte secondaire sur fond clair.
- `color_muted_light` (color, `#A9B4C4`) — Texte secondaire sur fond sombre.
- `color_gold` (color, `#E8B54A`) — Accent doré.
- `color_red` (color, `#C8312B`) — Bouton d'achat.
- `color_green` (color, `#1F5E46`) — Confirmations.
- Paragraphe d'aide : « Vérifiez la lisibilité après chaque changement de couleur. »

### 8.2 Groupe « Typographie »
- `type_heading_font` (font_picker, `playfair_display_n4`) — Police des titres.
- `type_body_font` (font_picker, `assistant_n4`) — Police du texte.
- `heading_scale` (range 100 à 130, pas de 5, unité %, défaut 105) — Taille des titres.
- `body_scale` (range 100 à 120, pas de 5, unité %, défaut 100) — Taille du texte.

### 8.3 Groupe « Logo et favicon »
- `logo` (image_picker) — Logo (laisser vide pour un logo texte avec le nom de la boutique).
- `logo_width` (range 60 à 240, pas de 10, unité px, défaut 140) — Largeur du logo sur ordinateur.
- `logo_width_mobile` (range 60 à 180, pas de 10, unité px, défaut 110) — Largeur du logo sur mobile.
- `favicon` (image_picker) — Favicon (32 × 32 px recommandé).

### 8.4 Groupe « Saison de Noël »
- `season_mode` (select, défaut `christmas`) :
  - `christmas` — « Noël : compte à rebours et livraison avant Noël ».
  - `off_season` — « Hors saison : aucun message lié à Noël ».
- `delivery_deadline_date` (text, défaut `2026-12-08`) — Date limite pour recevoir avant Noël, au format AAAA-MM-JJ.
- `delivery_deadline_time` (text, défaut `23:59`) — Heure limite, heure de Bruxelles.
- `christmas_date` (text, défaut `2026-12-24`) — Date de référence « avant Noël ».
- `show_countdown` (checkbox, `true`) — Afficher le compte à rebours jusqu'à la date limite.
- `snow_enabled` (checkbox, `true`) — Neige décorative animée.
- `snow_density` (range 10 à 60, pas de 5, défaut 25) — Nombre de flocons.
- Paragraphe d'aide : « Après la date limite, le site affiche automatiquement un message de livraison après Noël. »

### 8.5 Groupe « Livraison »
- `delivery_min_days` (range 3 à 20, défaut 7) — Délai minimum en jours.
- `delivery_max_days` (range 5 à 30, défaut 12) — Délai maximum en jours.
- `delivery_skip_sundays` (checkbox, `false`) — Ne pas compter les dimanches dans l'estimation.
- `free_shipping` (checkbox, `true`) — Afficher « Livraison offerte » (doit correspondre au tarif réglé dans l'admin).
- `shipping_countries_text` (text, « en France et en Belgique ») — Pays de livraison affichés.
- `show_delivery_estimate` (checkbox, `true`) — Afficher les dates estimées sur les fiches produits.

### 8.6 Groupe « Panier »
- `cart_type` (select, défaut `drawer`) : `drawer` — « Tiroir latéral » ; `page` — « Page panier ».
- `cart_upsell_product` (product) — Produit proposé dans le panier (conseillé : la guirlande neige).
- `cart_upsell_enabled` (checkbox, `true`) — Afficher la suggestion dans le panier.
- `show_cart_note` (checkbox, `false`) — Champ « Note pour la commande ».
- `show_withdrawal_notice` (checkbox, `true`) — Rappeler les 14 jours de rétractation dans le panier.

### 8.7 Groupe « Produits »
- `show_discount_badge` (checkbox, `false`) — Badge de réduction quand un prix barré réel existe.
- `discount_badge_style` (select, défaut `percent`) : `percent` — « Pourcentage » ; `amount` — « Montant ».
- `show_sticky_atc` (checkbox, `true`) — Barre d'achat collante sur mobile.
- `show_payment_icons` (checkbox, `true`) — Moyens de paiement sous le bouton d'achat.
- `card_image_ratio` (select, défaut `square`) : `square` — « Carré » ; `portrait` — « Portrait 4:5 » ; `landscape` — « Paysage 16:9 ».
- `card_show_secondary_image` (checkbox, `true`) — Deuxième image au survol (ordinateur).
- `pack_product` (product) — Produit pack (pour les liens « Voir le pack »).

### 8.8 Groupe « Service client »
- `support_email` (text, défaut vide) — E-mail affiché sur le site [À COMPLÉTER].
- `support_hours` (text, « Réponse sous 24 h, du lundi au samedi ») — Délai de réponse.
- `return_days` (number, défaut 14) — Jours de rétractation affichés.
- `legal_entity_name` (text, défaut vide) — Nom légal de l'entreprise, affiché dans le pied de page [À COMPLÉTER].

### 8.9 Groupe « Réseaux sociaux »
- `social_tiktok_link` (text) — Lien TikTok.
- `social_instagram_link` (text) — Lien Instagram.
- `social_facebook_link` (text) — Lien Facebook.
- `social_youtube_link` (text) — Lien YouTube.

### 8.10 `config/settings_data.json`
- `current` contient les valeurs par défaut ci-dessus.
- Pas de préréglages multiples (`presets` du thème) : un seul style, « Nuit de Noël ».

---

## 9. Traductions (`locales/fr.default.json`)

Écris ce fichier tel quel (tu peux ajouter des clés, jamais en supprimer).
Les clés `one` / `other` servent au pluriel Shopify (`count`).
Les variables entre doubles accolades sont passées avec le filtre `t`.

```json
{
  "general": {
    "skip_to_content": "Aller au contenu",
    "close": "Fermer",
    "open_menu": "Ouvrir le menu",
    "close_menu": "Fermer le menu",
    "menu": "Menu",
    "search": "Rechercher",
    "search_placeholder": "Rechercher une décoration",
    "loading": "Chargement…",
    "error": "Une erreur est survenue. Veuillez réessayer.",
    "back_to_home": "Retour à l'accueil",
    "continue_shopping": "Continuer mes achats",
    "view_all": "Tout voir",
    "learn_more": "En savoir plus",
    "required": "obligatoire",
    "home": "Accueil",
    "breadcrumbs": "Fil d'Ariane"
  },
  "accessibility": {
    "play_video": "Lire la vidéo",
    "pause_video": "Mettre la vidéo en pause",
    "new_window": "S'ouvre dans une nouvelle fenêtre",
    "previous_image": "Image précédente",
    "next_image": "Image suivante",
    "image_of": "Image {{ index }} sur {{ count }}",
    "social_link": "{{ network }} de {{ shop }}",
    "decorative": "Décoration"
  },
  "header": {
    "cart": "Panier",
    "cart_count": {
      "one": "{{ count }} article dans le panier",
      "other": "{{ count }} articles dans le panier"
    },
    "account": "Mon compte"
  },
  "announcement": {
    "default": "Livraison offerte en France et en Belgique"
  },
  "countdown": {
    "title": "Pour recevoir avant Noël",
    "intro": "Commandez avant le {{ date }}",
    "days": "j",
    "hours": "h",
    "minutes": "min",
    "days_long": "jours",
    "hours_long": "heures",
    "minutes_long": "minutes",
    "deadline_passed": "La date limite pour une livraison avant Noël est passée.",
    "remaining_label": "Temps restant avant la date limite de commande"
  },
  "delivery": {
    "estimate": "Livraison estimée entre le {{ start }} et le {{ end }}",
    "delay": "Livraison en {{ min }} à {{ max }} jours",
    "free": "Livraison offerte {{ countries }}",
    "before_christmas": "Commandé avant le {{ date }}, reçu avant Noël",
    "after_christmas": "Les commandes passées maintenant arriveront après Noël.",
    "tracking": "Numéro de suivi envoyé par e-mail dès l'expédition"
  },
  "products": {
    "add_to_cart": "Ajouter au panier",
    "adding": "Ajout en cours…",
    "added": "Ajouté au panier",
    "sold_out": "Épuisé",
    "unavailable": "Indisponible",
    "choose_option": "Choisir {{ option }}",
    "quantity": "Quantité",
    "increase_quantity": "Augmenter la quantité de {{ product }}",
    "decrease_quantity": "Diminuer la quantité de {{ product }}",
    "price": "Prix",
    "regular_price": "Prix habituel",
    "sale_price": "Prix réduit",
    "from_price": "À partir de {{ price }}",
    "save_percent": "−{{ percent }} %",
    "save_amount": "−{{ amount }}",
    "taxes_included": "Taxes incluses.",
    "withdrawal": "{{ days }} jours pour changer d'avis",
    "most_chosen": "Le plus choisi",
    "in_pack": "Inclus dans le pack",
    "see_pack": "Voir le pack",
    "see_product": "Voir le produit",
    "sticky_add": "Ajouter — {{ price }}",
    "description": "Description",
    "contents": "Contenu du colis",
    "specs": "Caractéristiques",
    "safety": "Sécurité et utilisation",
    "faq": "Questions fréquentes",
    "secure_payment": "Paiement sécurisé",
    "gallery": "Galerie de photos",
    "open_media": "Agrandir l'image {{ index }}",
    "video_label": "Vidéo du produit allumé"
  },
  "cart": {
    "title": "Votre panier",
    "empty": "Votre panier est vide.",
    "empty_cta": "Découvrir les décorations",
    "subtotal": "Sous-total",
    "checkout": "Passer commande",
    "note": "Note pour la commande",
    "remove": "Retirer",
    "remove_item": "Retirer {{ title }} du panier",
    "update": "Mettre à jour",
    "shipping_note": "Livraison offerte. Taxes et frais éventuels calculés à l'étape suivante.",
    "withdrawal": "Vous disposez de {{ days }} jours pour changer d'avis après réception.",
    "upsell_title": "Complétez votre façade",
    "upsell_add": "Ajouter",
    "error_generic": "Impossible de mettre à jour le panier. Veuillez réessayer.",
    "error_quantity": "Cette quantité n'est pas disponible.",
    "item_added": "{{ title }} a été ajouté au panier.",
    "view_cart": "Voir le panier",
    "items": {
      "one": "{{ count }} article",
      "other": "{{ count }} articles"
    },
    "discount": "Réduction"
  },
  "collection": {
    "empty": "Aucun produit dans cette collection pour le moment.",
    "products_count": {
      "one": "{{ count }} produit",
      "other": "{{ count }} produits"
    },
    "sort_by": "Trier par"
  },
  "search": {
    "title": "Recherche",
    "results_for": "Résultats pour « {{ terms }} »",
    "no_results": "Aucun résultat pour « {{ terms }} ». Essayez un autre mot, par exemple « guirlande ».",
    "submit": "Lancer la recherche",
    "results_count": {
      "one": "{{ count }} résultat",
      "other": "{{ count }} résultats"
    }
  },
  "contact": {
    "title": "Nous contacter",
    "name": "Nom",
    "email": "E-mail",
    "phone": "Téléphone (facultatif)",
    "order_number": "Numéro de commande (facultatif)",
    "message": "Message",
    "send": "Envoyer",
    "success": "Merci, votre message a bien été envoyé. Nous répondons sous 24 h ouvrées.",
    "error": "Veuillez corriger les champs signalés."
  },
  "newsletter": {
    "label": "Adresse e-mail",
    "placeholder": "vous@exemple.fr",
    "submit": "S'inscrire",
    "success": "Merci, votre inscription est confirmée.",
    "consent": "En vous inscrivant, vous acceptez de recevoir nos e-mails. Désinscription en un clic à tout moment."
  },
  "footer": {
    "payment_methods": "Moyens de paiement acceptés",
    "legal": "Informations légales",
    "help": "Aide",
    "copyright": "© {{ year }} {{ name }}",
    "withdrawal": "Rétractation : {{ days }} jours"
  },
  "blog": {
    "read_more": "Lire la suite",
    "published_on": "Publié le {{ date }}",
    "back_to_blog": "Retour au blog"
  },
  "not_found": {
    "title": "Page introuvable",
    "text": "La page que vous cherchez n'existe pas ou a été déplacée."
  },
  "password": {
    "title": "Ouverture prochaine",
    "enter_password": "Entrer avec le mot de passe",
    "password_label": "Mot de passe",
    "submit": "Entrer",
    "admin_login": "Accès propriétaire",
    "error": "Mot de passe incorrect."
  },
  "gift_card": {
    "title": "Votre carte cadeau",
    "code": "Code de la carte cadeau",
    "balance": "Solde : {{ value }}",
    "print": "Imprimer",
    "copy": "Copier le code",
    "copied": "Code copié"
  },
  "pagination": {
    "label": "Pagination",
    "previous": "Page précédente",
    "next": "Page suivante",
    "page": "Page {{ number }}"
  }
}
```

---

## 10. Snippets (`snippets/`)

Chaque snippet commence par un commentaire `{%- comment -%}` qui liste ses paramètres (« Accepte : »), puis le code.

### 10.1 `meta-tags.liquid`
- Accepte : rien (utilise les objets globaux).
- `<meta name="description">` avec `page_description` tronqué à 155 caractères, sinon `shop.description`.
- Open Graph : `og:site_name`, `og:url` (`canonical_url`), `og:title`, `og:type` (`product` sur une fiche produit, sinon `website`), `og:description`.
- `og:image` + `og:image:secure_url` + largeur et hauteur à partir de `page_image` (1200 px de large).
- Sur une fiche produit : `og:price:amount` (format `money_without_currency`, point décimal) et `og:price:currency`.
- Twitter : `twitter:card` = `summary_large_image`, `twitter:title`, `twitter:description`.
- Données structurées : sur une fiche produit, `<script type="application/ld+json">{{ product | structured_data }}</script>`.
- Sur l'accueil : JSON-LD `Organization` (nom, URL, logo si présent, liens sociaux non vides) et `WebSite` avec `potentialAction` de recherche.

### 10.2 `icon.liquid`
- Accepte : `icon` (nom), `size` (défaut 24), `class` (facultatif).
- Rend un `<svg>` inline, `aria-hidden="true"`, `focusable="false"`, `stroke="currentColor"`, `fill="none"`, `stroke-width="1.5"`.
- Icônes à fournir (chemins SVG dessinés par toi, viewBox 24 × 24) :
  - `menu`, `close`, `search`, `cart`, `account`, `chevron-left`, `chevron-right`, `chevron-down`.
  - `plus`, `minus`, `trash`, `check`, `play`, `pause`, `zoom`.
  - `truck` (livraison), `shield` (paiement sécurisé), `return` (rétractation), `mail` (service client), `clock` (délai).
  - `gift`, `star` (décoratif uniquement, jamais pour une note), `snowflake`, `bulb`, `plug`, `ruler`, `child`, `warning`.
  - `tiktok`, `instagram`, `facebook`, `youtube`.
- Implémentation : `{% case icon %}` avec un `{% when %}` par icône ; icône inconnue = rien.

### 10.3 `responsive-image.liquid`
- Accepte : `image` (obligatoire), `sizes` (défaut `100vw`), `widths` (défaut `360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048`), `loading` (défaut `lazy`), `fetchpriority` (facultatif), `class`, `alt` (facultatif, sinon `image.alt`, sinon chaîne vide si décorative).
- Utilise `image | image_url: width: 2048 | image_tag: widths:, sizes:, loading:, alt:, class:`.
- Ajoute `width` et `height` réels pour éviter les décalages de mise en page.
- Si `image` est vide : rend `{{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}` (ou `lifestyle-1` selon un paramètre `placeholder`).

### 10.4 `price.liquid`
- Accepte : `product` ou `variant` (l'un des deux), `show_badge` (booléen), `class`.
- Affiche le prix (`money`) ; si `compare_at_price > price`, affiche aussi le prix barré dans `<s>` avec les libellés `products.regular_price` et `products.sale_price` en `visually-hidden`.
- Sur une carte produit avec plusieurs prix de variantes : `products.from_price`.
- Badge de réduction seulement si `show_badge` **et** `settings.show_discount_badge` **et** prix barré réel.
- Calcul du pourcentage arrondi à l'entier : `(compare_at - price) * 100 / compare_at`.
- Contient un conteneur `data-price` que `product.js` met à jour au changement de variante.
- Mention `products.taxes_included` seulement si `shop.taxes_included`.

### 10.5 `product-card.liquid`
- Accepte : `product`, `show_badge` (booléen), `badge_text` (facultatif, par exemple « Le plus choisi »), `heading_level` (défaut `h3`), `image_sizes`.
- Structure : `<article class="card product-card">` → média (lien vers le produit) → corps (titre, prix, bouton).
- Ratio d'image selon `settings.card_image_ratio`.
- Deuxième image au survol si `settings.card_show_secondary_image` et si le produit a au moins deux médias de type image.
- Bouton « Ajouter au panier » direct si le produit n'a qu'une variante ; sinon bouton « Voir le produit ».
- L'ajout direct utilise un vrai `<form>` produit (fonctionne sans JavaScript) intercepté par `cart.js`.
- Un seul lien focusable vers le produit (le titre) pour éviter les doublons au clavier ; l'image a `tabindex="-1"` et `aria-hidden="true"` sur son lien.

### 10.6 `buy-buttons.liquid`
- Accepte : `product`, `section_id`, `block` (pour `shopify_attributes`).
- `{% form 'product', product, id: 'ProductForm-{{ section_id }}', class: 'product-form', novalidate: 'novalidate', data-type: 'add-to-cart-form' %}`.
- Champ caché `id` avec la variante sélectionnée (`product.selected_or_first_available_variant.id`).
- Quantité via `quantity-input` si le bloc l'active.
- Bouton principal `.button--primary.button--full`, `name="add"`, désactivé si la variante est indisponible.
- Message d'erreur `role="alert"` vide, rempli par `cart.js` en cas d'échec.
- Sous le bouton : `trust-row` (paiement sécurisé, livraison offerte, rétractation) et icônes de paiement si `settings.show_payment_icons` (`shop.enabled_payment_types` + `payment_type_svg_tag`).
- Pas de bouton de paiement accéléré dynamique au-dessus du bouton principal (il détourne du panier et de l'upsell) ; le prévoir comme option désactivée par défaut (`show_dynamic_checkout`, `{{ form | payment_button }}`).

### 10.7 `variant-picker.liquid`
- Accepte : `product`, `section_id`.
- Ne rend rien si `product.has_only_default_variant`.
- Une `<fieldset>` par option avec `<legend>` ; valeurs sous forme de boutons radio stylés en pastilles.
- Valeurs indisponibles barrées mais sélectionnables (elles affichent « Indisponible »).
- Données des variantes en `<script type="application/json" data-variants>{{ product.variants | json }}</script>`.
- Composant `<variant-picker>` défini dans `product.js`.

### 10.8 `quantity-input.liquid`
- Accepte : `id`, `name` (défaut `quantity`), `value` (défaut 1), `min` (défaut 1), `max` (facultatif), `product_title` (pour les libellés).
- Bouton moins, champ `type="number"` avec `inputmode="numeric"`, bouton plus.
- Libellés accessibles `products.decrease_quantity` et `products.increase_quantity`.
- Composant `<quantity-input>` défini dans `theme.js`.

### 10.9 `delivery-estimate.liquid`
- Accepte : `style` (`compact` ou `full`).
- Rendu serveur : texte de repli `delivery.delay` (« Livraison en 7 à 12 jours »), toujours vrai même sans JavaScript.
- Élément `<delivery-estimate>` que `delivery.js` remplace par `delivery.estimate` avec de vraies dates en français (« entre le jeu. 13 nov. et le mar. 18 nov. »).
- En mode `christmas`, après la date limite : ajoute `delivery.after_christmas` en gras.
- En mode `full` : ajoute la ligne `delivery.free` si `settings.free_shipping`, et `delivery.tracking`.
- Icône `truck`.

### 10.10 `deadline-countdown.liquid`
- Accepte : `style` (`inline` ou `blocks`).
- Ne rend rien si `settings.season_mode != 'christmas'` ou `settings.show_countdown == false`.
- Rendu serveur : texte `countdown.intro` avec la date limite écrite en français par Liquid (jour + nom du mois construits à la main, voir annexe A.7).
- Élément `<deadline-countdown data-deadline="...">` que `delivery.js` anime (jours, heures, minutes ; pas de secondes pour éviter l'agitation et les annonces répétées des lecteurs d'écran).
- Le conteneur des chiffres a `aria-hidden="true"` ; un texte `visually-hidden` résume le temps restant, mis à jour au plus une fois par minute.
- Après la date limite : affiche `countdown.deadline_passed` et rien d'autre.

### 10.11 `cart-item.liquid`
- Accepte : `item`, `index` (position, à partir de 1), `context` (`drawer` ou `page`).
- Image (`image_url: width: 160`), titre lié, options de variante (sauf « Default Title »), prix unitaire et prix de ligne.
- Réductions de ligne (`item.line_level_discount_allocations`) si présentes.
- `quantity-input` avec `data-index`, bouton « Retirer » (`cart.remove_item`).
- En `context: 'page'`, fonctionne aussi sans JavaScript (liens `item.url_to_remove` et formulaire de mise à jour).

### 10.12 `trust-row.liquid`
- Accepte : `layout` (`row` ou `stack`).
- Trois éléments courts avec icônes : « Paiement sécurisé », « Livraison offerte » (seulement si `settings.free_shipping`), « {{ return_days }} jours pour changer d'avis ».
- Ne contient aucune promesse absente des politiques de la boutique.

### 10.13 `pagination.liquid`
- Accepte : `paginate` (objet de pagination).
- `<nav aria-label="{{ 'pagination.label' | t }}">` avec précédent, numéros, suivant ; page courante avec `aria-current="page"`.

### 10.14 `social-links.liquid`
- Accepte : `class`.
- Liste des réseaux non vides parmi `settings.social_*_link`, icône + texte `visually-hidden` (`accessibility.social_link`).
- `target="_blank"` avec `rel="noopener"` et mention `accessibility.new_window`.

### 10.15 `breadcrumbs.liquid`
- Accepte : rien.
- Affiché sur les fiches produits et les collections : Accueil › Collection (si `collection` existe) › Produit.
- `<nav aria-label="{{ 'general.breadcrumbs' | t }}">` et `aria-current="page"` sur le dernier élément.
- Données structurées `BreadcrumbList` en JSON-LD.

### 10.16 `cart-icon-content.liquid`
- Accepte : rien (utilise l'objet `cart`).
- Contenu de l'icône panier : pictogramme, pastille du nombre d'articles, texte `visually-hidden`.
- Rendu à la fois par `header.liquid` (dans le lien `#cart-icon-bubble`) et par la section `cart-icon-bubble.liquid` (annexe A.4).

---

## 11. Sections (`sections/`)

Règles communes à toutes les sections :
- Réglages communs : `color_scheme` (select : `night`, `night-soft`, `cream`, `white`), `padding_top` et `padding_bottom` (range 0 à 120, pas de 8, unité px).
- Le conteneur racine porte `class="section section-{{ section.id }} scheme-{{ section.settings.color_scheme }}"` et applique les marges via un `<style>` scopé sur `.section-{{ section.id }}`.
- Tout texte affiché vient d'un réglage ou d'une clé de traduction.
- Les titres de section sont des `h2` (le `h1` est réservé au titre de la page, du produit ou au titre du hero d'accueil).
- Les blocs utilisent `{{ block.shopify_attributes }}` pour l'éditeur de thème.
- Les sections d'accueil se déclarent avec un `presets` en français.
- Les sections lourdes en CSS chargent leur feuille dédiée avec `{{ 'section-xxx.css' | asset_url | stylesheet_tag }}` en haut de la section.

### 11.1 `header-group.json` et `footer-group.json`
- `header-group.json` : `type: "header"`, nom « Groupe en-tête », sections `announcement-bar` puis `header`.
- `footer-group.json` : `type: "footer"`, nom « Groupe pied de page », section `footer`.
- Le réglage `enabled_on` / `disabled_on` des sections d'en-tête n'est pas utilisé (elles s'affichent partout).

### 11.2 `announcement-bar.liquid`
Rôle : bandeau fin en haut de chaque page.
Réglages :
- `color_scheme` (défaut `night-soft`).
- `link` (url) — lien facultatif sur tout le bandeau.
Blocs (`announcement`, maximum 3) :
- `text` (text, défaut « Livraison offerte en France et en Belgique »).
- `icon` (select : `none`, `truck`, `gift`, `clock`, `snowflake`).
- `show_countdown` (checkbox, défaut `false`) — remplace le texte par la ligne `deadline-countdown` en style `inline`.
Comportement :
- Une seule annonce : affichage fixe.
- Plusieurs annonces : défilement automatique toutes les 5 secondes, avec un bouton pause accessible (`accessibility.pause_video` adapté) ; pas de défilement si mouvement réduit.
- Hauteur 36 px, texte `--fs-small`, centré.
Contenu par défaut (dans `header-group.json`) :
- Bloc 1 : « Livraison offerte en France et en Belgique », icône `truck`.
- Bloc 2 : compte à rebours activé.
- Bloc 3 : « 14 jours pour changer d'avis », icône `gift`.

### 11.3 `header.liquid`
Rôle : en-tête collant de toutes les pages.
Réglages :
- `menu` (link_list, défaut `main-menu`).
- `logo_position_desktop` (select : `left`, `center` ; défaut `left`).
- `show_search` (checkbox, `true`).
- `sticky` (checkbox, `true`).
- `color_scheme` (défaut `night`).
Structure mobile (moins de 990 px) :
- À gauche : bouton menu (`aria-expanded`, `aria-controls="MenuDrawer"`).
- Au centre : logo (image avec largeur `settings.logo_width_mobile`, sinon nom de la boutique en police des titres).
- À droite : icône recherche (lien vers `routes.search_url`) et icône panier avec pastille.
Structure ordinateur :
- Logo à gauche, menu horizontal au centre, recherche et panier à droite.
- Sous-menus (deux niveaux maximum) en `<details>` avec ouverture au survol et au clavier.
Comportement :
- Le logo est un `h1` uniquement sur la page d'accueil ; ailleurs un simple lien (pour garder un seul `h1` par page).
- L'icône panier ouvre le tiroir si `settings.cart_type == 'drawer'`, sinon mène à `routes.cart_url` ; le lien reste un vrai lien `href` (fonctionne sans JavaScript).
- Le lien panier porte `id="cart-icon-bubble"` et rend le snippet `cart-icon-content` (pastille + texte `header.cart_count` en `visually-hidden`).
- `cart.js` met la pastille à jour grâce à la section `cart-icon-bubble` (annexe A.4), jamais en visant la section `header` (son identifiant change dans un groupe de sections).
- Ombre légère ajoutée quand la page défile (classe `.is-scrolled` posée par `theme.js`).
- Menu mobile `<menu-drawer id="MenuDrawer">` : liens du menu, sous-menus en accordéon, puis liens « Livraison », « Contact » et réseaux sociaux.
- Focus piégé dans le menu ouvert, fermeture par Échap, par le bouton fermer et par clic sur la superposition ; retour du focus au bouton d'ouverture.

### 11.4 `footer.liquid`
Rôle : pied de page de toutes les pages.
Réglages :
- `color_scheme` (défaut `night`).
- `show_payment_icons` (checkbox, `true`).
- `show_social` (checkbox, `true`).
- `show_policies` (checkbox, `true`).
Blocs :
- `brand` (maximum 1) : `heading` (text), `text` (richtext, défaut « Des décorations lumineuses pour une façade qui brille tout l'hiver. »).
- `menu` (maximum 2) : `heading` (text), `menu` (link_list).
- `contact` (maximum 1) : `heading` (text, défaut « Service client »), affiche `settings.support_email` (lien `mailto:`) et `settings.support_hours`.
- `newsletter` (maximum 1) : `heading` (text), formulaire `{% form 'customer' %}` compact avec `contact[tags]` = `newsletter` et le texte `newsletter.consent`.
Bas de page :
- Ligne `footer.copyright` avec l'année courante (`'now' | date: '%Y'`) et `settings.legal_entity_name` ou `shop.name`.
- Liens des politiques : boucle sur `shop.policies` (titre et URL) si `show_policies`.
- Rappel `footer.withdrawal` avec `settings.return_days`.
- Icônes de paiement : `shop.enabled_payment_types` avec `payment_type_svg_tag`, sous un titre `visually-hidden` `footer.payment_methods`.
Mobile :
- Colonnes `menu` en accordéon (`<details>` ouverts par défaut sur ordinateur via un attribut posé par `theme.js` au-delà de 990 px, ou simple liste sur ordinateur en CSS).
Contenu par défaut (dans `footer-group.json`) :
- `brand`, `menu` « Boutique » (`main-menu`), `menu` « Aide » (`footer`), `contact`, `newsletter`.

### 11.5 `cart-drawer.liquid`
Rôle : tiroir panier latéral, rendu côté serveur et rafraîchi par la Section Rendering API.
Structure :
- `<cart-drawer id="CartDrawer" class="drawer" role="dialog" aria-modal="true" aria-labelledby="CartDrawerTitle" hidden>`.
- À l'intérieur : une superposition `<div class="overlay" data-drawer-close>` et un panneau ; tout le contenu variable du panneau est dans un conteneur `[data-drawer-inner]`, remplacé d'un bloc par `cart.js` (annexe A.5).
- Le bouton fermer porte aussi `data-drawer-close`.
- En-tête : titre `cart.title` + nombre d'articles (`cart.items`), bouton fermer.
- Ligne de date limite (snippet `deadline-countdown`, style `inline`) si mode Noël.
- Liste : `cart-item` en `context: 'drawer'` pour chaque ligne.
- Suggestion : si `settings.cart_upsell_enabled` et que `settings.cart_upsell_product` n'est pas déjà dans le panier, mini-carte avec image, titre, prix et bouton `cart.upsell_add` (formulaire produit, une seule variante).
- Pied : sous-total (`cart.total_price`), réductions de commande (`cart.cart_level_discount_applications`), `cart.shipping_note`, bouton `cart.checkout` (`name="checkout"`, formulaire vers `routes.cart_url`), lien `cart.view_cart`, rappel `cart.withdrawal` si `settings.show_withdrawal_notice`.
- Panier vide : texte `cart.empty`, bouton `cart.empty_cta` vers la collection `noel` (ou `routes.all_products_collection_url`), et cartes des deux produits phares (pack et projecteur) via `settings.pack_product` et un réglage de section.
Réglages :
- `empty_product` (product) — produit montré quand le panier est vide (en plus du pack).
Comportement :
- Ouverture : `cart.js` retire `hidden`, ajoute `.is-open`, verrouille le défilement du `body`, place le focus sur le titre.
- Fermeture : Échap, bouton, clic sur la superposition ; focus rendu à l'élément qui a ouvert le tiroir.
- Pendant une mise à jour : `aria-busy="true"` sur la liste et classe `.skeleton` sur le sous-total.
- Le tiroir n'est pas inclus si `settings.cart_type == 'page'`.

### 11.6 `hero-video.liquid` (accueil)
Rôle : premier écran de l'accueil, montre une façade illuminée par le produit.
Réglages :
- `video` (video) — vidéo hébergée sur Shopify (boucle muette de 6 à 12 secondes).
- `poster` (image_picker) — image affichée avant la vidéo et si mouvement réduit.
- `mobile_poster` (image_picker) — image verticale pour mobile (facultatif).
- `overlay_opacity` (range 0 à 80, pas de 5, unité %, défaut 45).
- `eyebrow` (text, défaut « Collection Noël 2026 »).
- `heading` (text, défaut « Votre façade illuminée en 5 minutes »).
- `subheading` (text, défaut « Projecteurs et guirlandes LED prêts à brancher. Livraison offerte. »).
- `button_label` (text, défaut « Découvrir le pack »), `button_link` (url, sans défaut dans le schéma ; valeur fixée dans `index.json`).
- `secondary_label` (text, défaut « Voir toutes les décorations »), `secondary_link` (url).
- `show_countdown` (checkbox, `true`).
- `height_mobile` (select : `small` 60 svh, `medium` 75 svh, `full` 90 svh ; défaut `medium`).
- `color_scheme` (défaut `night`).
Comportement :
- Vidéo : `{{ section.settings.video | video_tag: autoplay: true, loop: true, muted: true, playsinline: true, controls: false, preload: 'metadata', image_size: '1600x' }}`.
- Si mouvement réduit : la vidéo ne démarre pas, le poster s'affiche, bouton lecture disponible.
- Bouton pause/lecture visible en bas à droite (`accessibility.pause_video` / `accessibility.play_video`), obligatoire pour une vidéo en lecture automatique.
- Le titre est le `h1` de l'accueil.
- Poster chargé avec `loading: 'eager'` et `fetchpriority: 'high'` (c'est l'élément le plus important pour la vitesse perçue).
- Petites étoiles dorées décoratives (`aria-hidden`) qui scintillent, désactivées en mouvement réduit.
- Compte à rebours en style `blocks` sous les boutons si `show_countdown` et mode Noël.
Mobile :
- Texte aligné en bas, dégradé sombre derrière le texte pour garantir la lisibilité.
- Boutons empilés, pleine largeur.

### 11.7 `featured-pack.liquid` (accueil)
Rôle : mettre le pack en avant avec un vrai bouton d'achat.
Réglages :
- `product` (product) — si vide, la section utilise `settings.pack_product` (`assign featured = section.settings.product | default: settings.pack_product`).
- `badge` (text, défaut « Le plus choisi »).
- `heading` (text, défaut « Le pack Façade de Noël »).
- `text` (richtext, défaut « Le projecteur de motifs et la guirlande neige : tout ce qu'il faut pour transformer votre façade, dans un seul colis. »).
- `included_heading` (text, défaut « Dans le pack »).
- `show_delivery` (checkbox, `true`).
- `image` (image_picker) — visuel d'ambiance facultatif ; sinon média principal du produit.
- `layout` (select : `image_left`, `image_right` ; défaut `image_left`).
- `color_scheme` (défaut `cream`).
Blocs (`included_item`, maximum 4) :
- `product` (product) — produit inclus (projecteur, guirlande).
- `label` (text) — texte de remplacement si aucun produit n'est choisi.
Comportement :
- Affiche titre, texte, prix (snippet `price`), liste des produits inclus avec miniatures, `buy-buttons` (ajout direct, une seule variante), `delivery-estimate` compact.
- Si le pack a un `compare_at_price` réel, le prix barré s'affiche ; sinon, aucune mention de réduction.
- Ne jamais afficher une « économie » calculée en additionnant les prix des produits séparés, sauf si Corentin active un réglage explicite `show_bundle_saving` (checkbox, défaut `false`) — dans ce cas le calcul utilise les prix réels des produits inclus.
Mobile : image au-dessus, contenu en dessous, bouton pleine largeur.

### 11.8 `product-grid.liquid` (accueil, collection)
Rôle : grille de produits.
Réglages :
- `heading` (text, défaut « Toutes nos décorations lumineuses »).
- `collection` (collection, défaut `noel`).
- `products_to_show` (range 2 à 12, défaut 6).
- `columns_desktop` (range 2 à 4, défaut 3).
- `columns_mobile` (select : `1`, `2` ; défaut `2`).
- `show_view_all` (checkbox, `true`).
- `highlight_product` (product) — produit qui reçoit le badge « Le plus choisi » (défaut le pack).
- `color_scheme` (défaut `white`).
Comportement :
- Boucle sur `collection.products limit: products_to_show`, rend `product-card`.
- Si la collection est vide ou non choisie (éditeur), affiche 4 cartes de démonstration avec `placeholder_svg_tag`.
- Bouton « Tout voir » vers la collection si elle contient plus de produits que `products_to_show`.

### 11.9 `how-it-works.liquid` (accueil, fiches produits)
Rôle : rassurer sur la simplicité d'installation.
Réglages : `heading` (text, défaut « Installé en 3 étapes »), `color_scheme` (défaut `night`).
Blocs (`step`, maximum 4) :
- `icon` (select : `plug`, `bulb`, `snowflake`, `clock`, `gift`, `ruler`).
- `title` (text).
- `text` (textarea).
Contenu par défaut :
1. `plug` — « Branchez » — « Une prise suffit. Pas d'outil, pas d'installation électrique. »
2. `ruler` — « Orientez » — « Posez le projecteur au sol ou piquez-le dans la pelouse, face à la façade. »
3. `bulb` — « Allumez » — « La façade s'illumine dès la tombée de la nuit. »
Comportement : étapes numérotées (liste `<ol>`), en ligne sur ordinateur, empilées sur mobile, apparition `.reveal`.
Note : ces textes doivent rester vrais pour les produits vendus ; si le projecteur n'a pas de piquet de sol, Corentin adapte l'étape 2 [À VÉRIFIER : piquet inclus].

### 11.10 `delivery-deadline.liquid` (accueil, panier)
Rôle : expliquer clairement quand commander pour recevoir avant Noël.
Réglages :
- `heading` (text, défaut « Recevez votre commande avant Noël »).
- `text` (richtext, défaut « Nos décorations sont livrées en 7 à 12 jours. Pour les recevoir à temps, commandez au plus tard le 8 décembre. »).
- `after_text` (richtext, défaut « Les commandes passées maintenant arriveront après Noël, juste à temps pour le Nouvel An. »).
- `color_scheme` (défaut `night-soft`).
Comportement :
- Mode Noël avant la date limite : titre, texte, compte à rebours `blocks`, frise simple « Aujourd'hui → expédition → livraison estimée » calculée par `delivery.js`.
- Mode Noël après la date limite : `after_text` à la place du compte à rebours (bascule faite côté JavaScript ; le rendu serveur compare aussi `'now' | date: '%s'` à la date limite pour éviter un flash).
- Mode hors saison : la section ne s'affiche pas (rendu vide).
- Le texte par défaut doit rester cohérent avec les réglages : construire la phrase à partir de `delivery_min_days`, `delivery_max_days` et `delivery_deadline_date` plutôt que de figer les chiffres, si le réglage `use_auto_text` (checkbox, défaut `true`) est activé.

### 11.11 `trust-badges.liquid` (accueil, fiches produits)
Rôle : 3 ou 4 garanties réelles, en ligne.
Réglages : `color_scheme` (défaut `cream`).
Blocs (`badge`, maximum 4) : `icon` (select), `title` (text), `text` (text).
Contenu par défaut :
- `truck` — « Livraison offerte » — « En France et en Belgique ».
- `shield` — « Paiement sécurisé » — « Carte, Bancontact, Apple Pay ».
- `return` — « 14 jours pour changer d'avis » — « Rétractation selon nos conditions ».
- `mail` — « Service client » — « Réponse sous 24 h ouvrées ».
Règle : aucune garantie qui ne figure pas dans les politiques de la boutique.

### 11.12 `image-with-text.liquid` (accueil, fiches produits)
Rôle : bloc visuel + texte (ambiance de façade, usage intérieur, idée cadeau).
Réglages : `image` (image_picker), `image_alt` (text), `video` (video, facultatif, prioritaire sur l'image), `layout` (`image_left` / `image_right`), `eyebrow` (text), `heading` (text), `text` (richtext), `button_label` (text), `button_link` (url), `color_scheme` (défaut `night`).
Comportement : ratio d'image 4:5 sur mobile, 1:1 sur ordinateur ; vidéo en boucle muette avec bouton pause.
Contenu par défaut sur l'accueil :
- Eyebrow « Idée cadeau », titre « Le cadeau qui illumine tout le quartier », texte « Offrez un Noël lumineux : simple à installer, magique dès la première nuit. », bouton « Voir le projecteur ».

### 11.13 `faq.liquid` (accueil, fiches produits, page contact)
Rôle : répondre aux objections avant l'achat.
Réglages : `heading` (text, défaut « Questions fréquentes »), `color_scheme` (défaut `white`), `open_first` (checkbox, `false`).
Blocs (`question`, maximum 12) : `question` (text), `answer` (richtext).
Comportement :
- Chaque question est un `<details>` / `<summary>` (accordéon natif accessible).
- Données structurées `FAQPage` en JSON-LD construites à partir des blocs (questions et réponses en texte brut via `strip_html`).
Contenu par défaut (accueil) :
- « Quand vais-je recevoir ma commande ? » — « Comptez 7 à 12 jours après votre commande. Vous recevez un numéro de suivi par e-mail dès l'expédition. »
- « Puis-je encore recevoir avant Noël ? » — « Oui, si vous commandez au plus tard le 8 décembre. Après cette date, la livraison peut arriver après Noël. »
- « La livraison est-elle payante ? » — « Non, la livraison est offerte en France et en Belgique. »
- « Et si le produit ne me plaît pas ? » — « Vous disposez de 14 jours après réception pour changer d'avis. Les conditions de retour sont détaillées dans notre politique de remboursement. »
- « Les produits fonctionnent-ils à l'extérieur ? » — « Chaque fiche produit indique où l'utiliser. [À VÉRIFIER : indices de protection de chaque produit] »
- « Comment vous contacter ? » — « Par e-mail via la page Contact. Nous répondons sous 24 h ouvrées. »

### 11.14 `newsletter.liquid` (accueil)
Rôle : récupérer des e-mails (relances pour Noël, soldes de janvier).
Réglages : `heading` (text, défaut « Les idées lumineuses de la saison »), `text` (richtext, défaut « Nouveautés et conseils de décoration, au maximum un e-mail par semaine. »), `color_scheme` (défaut `night-soft`).
Comportement :
- `{% form 'customer', id: 'NewsletterForm-{{ section.id }}' %}` avec `contact[tags]` = `newsletter` et `contact[email]`.
- Libellé visible (`newsletter.label`), message de succès `form.posted_successfully?`, erreurs `form.errors`.
- Texte `newsletter.consent` sous le champ ; aucune case pré-cochée.
- Pas de promesse de code promo si Corentin n'en a pas créé (réglage `incentive_text` facultatif, vide par défaut).

### 11.15 `rich-text.liquid`
Rôle : bloc de texte libre centré (pages, accueil).
Réglages : `color_scheme`, `width` (`narrow` / `normal`), `alignment` (`left` / `center`).
Blocs : `heading` (text, taille h2 ou h3), `text` (richtext), `button` (label + lien).

### 11.16 `main-product.liquid` (fiches produits)
Rôle : cœur de la conversion. Feuille `section-product.css`, script `product.js` (`defer`).
Structure ordinateur : galerie à gauche (environ 55 %), informations à droite (45 %) collantes au défilement.
Structure mobile : galerie en carrousel horizontal (défilement natif `scroll-snap`), informations en dessous.
Galerie :
- Tous les médias du produit (`product.media`) : images, vidéos Shopify (`video_tag`), vidéos externes et modèles 3D si présents (`media_tag`).
- Média sélectionné de la variante en premier.
- Mobile : points de pagination et compteur `accessibility.image_of`.
- Ordinateur : miniatures cliquables sous l'image principale.
- Premier média chargé en `eager`, les autres en `lazy`.
- Agrandissement au clic (dialogue `<dialog>` natif avec image en grand, fermeture Échap) — facultatif via réglage `enable_zoom` (défaut `true`).
Réglages de section :
- `gallery_layout` (select : `thumbnails`, `stacked` ; défaut `thumbnails`).
- `enable_zoom` (checkbox, `true`).
- `enable_video_looping` (checkbox, `true`).
- `show_breadcrumbs` (checkbox, `true`).
- `color_scheme` (défaut `white`).
Blocs (ordre libre dans l'éditeur, chacun au plus une fois sauf `text`, `collapsible` et `trust`) :
- `badge` : `text` (text, ex. « Le plus choisi »), `style` (`gold` / `green`).
- `title` : titre du produit en `h1`.
- `subtitle` : `text` (text) — promesse en une ligne, sous le titre.
- `price` : snippet `price` avec badge.
- `highlights` : jusqu'à 4 points forts (réglages `highlight_1` à `highlight_4`, text), chacun avec une coche dorée.
- `variant_picker` : snippet `variant-picker`.
- `quantity` : `quantity-input`.
- `buy_buttons` : snippet `buy-buttons` ; réglage `show_dynamic_checkout` (checkbox, `false`).
- `delivery` : snippet `delivery-estimate` en style `full`.
- `countdown` : snippet `deadline-countdown` en style `inline`.
- `pack_cta` : bloc « Encore mieux en pack » — réglages `pack_product` (product), `text` (text, défaut « Ajoutez la guirlande neige et économisez un colis : découvrez le pack. »), affiche la miniature et le prix du pack avec un lien `products.see_pack`. Ne s'affiche pas sur la fiche du pack lui-même.
- `text` : `text` (richtext) libre.
- `collapsible` : `heading` (text), `icon` (select), `content` (richtext), `page` (page, facultatif — remplace le contenu par celui d'une page).
- `trust` : snippet `trust-row` en `stack`.
- `share` : lien de partage natif (`navigator.share` si disponible, sinon copie du lien).
- `@app` : blocs d'application (pour un futur module d'avis réels).
Barre collante mobile (si `settings.show_sticky_atc`) :
- `<sticky-atc>` en bas de l'écran : miniature, titre court, prix, bouton `products.sticky_add`.
- Apparaît quand le bouton principal sort de l'écran (IntersectionObserver), disparaît quand il revient ou quand le pied de page est visible.
- Le bouton déclenche la soumission du formulaire principal (`form.requestSubmit()`), pas un second formulaire.
- Ne masque jamais le contenu : `padding-bottom` ajouté au `body` quand elle est visible.
Autres :
- `product.selected_or_first_available_variant` est la variante initiale ; l'URL `?variant=` est mise à jour au changement.
- Évènement personnalisé `variant:change` émis par `product.js` (écouté par `price`, la galerie et les boutons).

### 11.17 `product-details.liquid` (fiches produits)
Rôle : sections d'informations sous la fiche (description complète, contenu du colis, caractéristiques, sécurité).
Réglages : `color_scheme` (défaut `cream`), `layout` (`tabs` sur ordinateur / accordéon sur mobile, ou `accordion` partout ; défaut `tabs`).
Blocs (maximum 6) : `tab` — `title` (text), `icon` (select), `content` (richtext), `use_description` (checkbox — si coché, affiche `product.description`).
Contenu : défini par modèle produit (section 12).
Comportement onglets :
- Rôles ARIA `tablist`, `tab`, `tabpanel`, navigation au clavier avec les flèches, `aria-selected`.
- Sous 990 px : bascule automatique en accordéon `<details>`.

### 11.18 `product-upsell.liquid` (fiches produits)
Rôle : suggérer un produit complémentaire en dessous de la fiche.
Réglages : `heading` (text, défaut « Complétez votre décoration »), `products` (product_list, maximum 3), `color_scheme` (défaut `white`).
Comportement : cartes `product-card` avec ajout direct ; le produit en cours est exclu de la liste ; section masquée si la liste est vide après exclusion.

### 11.19 `main-collection.liquid`
Rôle : page de collection. Feuille `section-collection.css`.
Réglages : `products_per_page` (range 8 à 24, pas de 4, défaut 12), `columns_desktop` (2 à 4, défaut 3), `columns_mobile` (`1` / `2`, défaut `2`), `show_description` (checkbox, `true`), `show_sort` (checkbox, `true`), `show_banner` (checkbox, `true`), `color_scheme` (défaut `white`).
Comportement :
- Bannière : titre `h1`, description, image de la collection si présente.
- Tri : `<select>` avec `collection.sort_options`, soumission automatique en JavaScript, bouton visible sans JavaScript.
- Pas de filtres (5 produits seulement) ; prévoir le code de façon à pouvoir ajouter `collection.filters` plus tard.
- `{% paginate collection.products by section.settings.products_per_page %}` et snippet `pagination`.
- Nombre de produits (`collection.products_count`) affiché.
- Collection vide : `collection.empty` et lien vers l'accueil.

### 11.20 `main-list-collections.liquid`
Rôle : liste de toutes les collections (`/collections`).
Comportement : cartes avec image de la collection (ou du premier produit), titre, nombre de produits ; grille 2 colonnes mobile, 3 ordinateur.

### 11.21 `main-cart.liquid`
Rôle : page panier (utilisée aussi quand le tiroir est désactivé). Feuille `section-cart.css`.
Structure :
- Titre `h1` `cart.title`.
- Formulaire `<form action="{{ routes.cart_url }}" method="post" id="CartForm">` avec les lignes (`cart-item`, `context: 'page'`).
- Note de commande si `settings.show_cart_note`.
- Récapitulatif : sous-total, réductions, `cart.shipping_note`, bouton `cart.checkout` (`name="checkout"`), rappel rétractation.
- Suggestion (même logique que le tiroir).
- Panier vide : `cart.empty`, bouton vers la collection, grille de 3 produits.
Comportement : fonctionne entièrement sans JavaScript (bouton « Mettre à jour » visible dans `<noscript>`) ; avec JavaScript, mise à jour instantanée via `cart.js`.

### 11.22 `main-search.liquid`
Rôle : résultats de recherche.
Comportement :
- Formulaire `<form action="{{ routes.search_url }}" method="get" role="search">` avec `name="q"` et `type=product` caché.
- Résultats : `product-card` pour les produits, carte simple pour les pages et articles.
- `search.results_for` + `search.results_count`, ou `search.no_results`.
- Pagination.

### 11.23 `main-page.liquid`
Rôle : pages de contenu (livraison, FAQ, à propos).
Comportement : titre `h1`, `page.content` dans un conteneur `page-width--narrow`, typographie soignée pour les listes et tableaux.

### 11.24 `contact-form.liquid`
Rôle : formulaire de contact (modèle `page.contact`).
Réglages : `heading` (text), `text` (richtext, défaut « Une question sur une commande ou un produit ? Écrivez-nous, nous répondons sous 24 h ouvrées. »), `color_scheme`.
Comportement :
- `{% form 'contact', id: 'ContactForm' %}` avec nom, e-mail (obligatoire), téléphone (facultatif), numéro de commande (facultatif, `contact[order]`), message (obligatoire).
- Libellés visibles, `autocomplete` correct (`name`, `email`, `tel`), erreurs reliées par `aria-describedby`, message de succès avec `role="status"`.
- Affiche aussi `settings.support_email` et `settings.support_hours` à côté du formulaire.

### 11.25 `main-404.liquid`
Rôle : page introuvable. `not_found.title` en `h1`, `not_found.text`, bouton retour accueil, grille de 3 produits de la collection `noel`.

### 11.26 `main-blog.liquid` et `main-article.liquid`
Rôle : blog de conseils (utile pour le référencement : « comment décorer sa façade pour Noël »).
- `main-blog` : liste paginée des articles (image, titre, date `blog.published_on`, extrait, lien `blog.read_more`).
- `main-article` : titre `h1`, date, image, contenu, lien `blog.back_to_blog`, produits liés via un réglage `product_list` (facultatif).
- Pas de commentaires (désactivés).

### 11.27 `main-password.liquid`
Rôle : page d'attente avant l'ouverture.
Comportement : logo, `password.title`, message de la boutique (`shop.password_message`), formulaire newsletter, formulaire mot de passe dans un `<details>` (`{% form 'storefront_password' %}`), erreurs `password.error`.

---

## 12. Modèles (`templates/`)

Les réglages `product`, `collection` et `product_list` acceptent des handles dans les fichiers JSON.
Si un handle n'existe pas encore dans la boutique, l'éditeur affichera la section vide : c'est normal tant que Corentin n'a pas importé les produits.
Les réglages `url` utilisent le format de lien de ressource Shopify (`shopify://products/<handle>`, `shopify://collections/<handle>`), le seul que l'éditeur sait relier à une ressource.

### 12.1 `templates/index.json` (page d'accueil)
Écris ce fichier tel quel, puis ajuste uniquement si un réglage n'existe pas dans tes schémas.

```json
{
  "sections": {
    "hero": {
      "type": "hero-video",
      "settings": {
        "eyebrow": "Collection Noël 2026",
        "heading": "Votre façade illuminée en 5 minutes",
        "subheading": "Projecteurs et guirlandes LED prêts à brancher. Livraison offerte en France et en Belgique.",
        "button_label": "Découvrir le pack",
        "button_link": "shopify://products/pack-facade-de-noel",
        "secondary_label": "Voir toutes les décorations",
        "secondary_link": "shopify://collections/noel",
        "overlay_opacity": 45,
        "show_countdown": true,
        "height_mobile": "medium",
        "color_scheme": "night",
        "padding_top": 0,
        "padding_bottom": 0
      }
    },
    "pack": {
      "type": "featured-pack",
      "blocks": {
        "included-projector": {
          "type": "included_item",
          "settings": {
            "product": "projecteur-de-noel-led",
            "label": "Projecteur de Noël LED 16 motifs"
          }
        },
        "included-garland": {
          "type": "included_item",
          "settings": {
            "product": "guirlande-neige-qui-tombe",
            "label": "Guirlande « neige qui tombe » 8 tubes"
          }
        }
      },
      "block_order": ["included-projector", "included-garland"],
      "settings": {
        "product": "pack-facade-de-noel",
        "badge": "Le plus choisi",
        "heading": "Le pack Façade de Noël",
        "text": "<p>Le projecteur de motifs et la guirlande neige : tout ce qu'il faut pour transformer votre façade, dans un seul colis.</p>",
        "included_heading": "Dans le pack",
        "show_delivery": true,
        "show_bundle_saving": false,
        "layout": "image_left",
        "color_scheme": "cream",
        "padding_top": 64,
        "padding_bottom": 64
      }
    },
    "deadline": {
      "type": "delivery-deadline",
      "settings": {
        "heading": "Recevez votre commande avant Noël",
        "use_auto_text": true,
        "color_scheme": "night-soft",
        "padding_top": 48,
        "padding_bottom": 48
      }
    },
    "grid": {
      "type": "product-grid",
      "settings": {
        "heading": "Toutes nos décorations lumineuses",
        "collection": "noel",
        "products_to_show": 6,
        "columns_desktop": 3,
        "columns_mobile": "2",
        "show_view_all": true,
        "highlight_product": "pack-facade-de-noel",
        "color_scheme": "white",
        "padding_top": 64,
        "padding_bottom": 64
      }
    },
    "steps": {
      "type": "how-it-works",
      "blocks": {
        "step-1": {
          "type": "step",
          "settings": {
            "icon": "plug",
            "title": "Branchez",
            "text": "Une prise suffit. Pas d'outil, pas d'installation électrique."
          }
        },
        "step-2": {
          "type": "step",
          "settings": {
            "icon": "ruler",
            "title": "Orientez",
            "text": "Posez le projecteur face à la façade, à quelques mètres du mur."
          }
        },
        "step-3": {
          "type": "step",
          "settings": {
            "icon": "bulb",
            "title": "Allumez",
            "text": "La façade s'illumine dès la tombée de la nuit."
          }
        }
      },
      "block_order": ["step-1", "step-2", "step-3"],
      "settings": {
        "heading": "Installé en 3 étapes",
        "color_scheme": "night",
        "padding_top": 64,
        "padding_bottom": 64
      }
    },
    "gift": {
      "type": "image-with-text",
      "settings": {
        "eyebrow": "Idée cadeau",
        "heading": "Le cadeau qui illumine tout le quartier",
        "text": "<p>Offrez un Noël lumineux : simple à installer, magique dès la première nuit.</p>",
        "button_label": "Voir le projecteur",
        "button_link": "shopify://products/projecteur-de-noel-led",
        "layout": "image_right",
        "color_scheme": "night",
        "padding_top": 32,
        "padding_bottom": 64
      }
    },
    "trust": {
      "type": "trust-badges",
      "blocks": {
        "shipping": {
          "type": "badge",
          "settings": { "icon": "truck", "title": "Livraison offerte", "text": "En France et en Belgique" }
        },
        "payment": {
          "type": "badge",
          "settings": { "icon": "shield", "title": "Paiement sécurisé", "text": "Carte, Bancontact, Apple Pay" }
        },
        "returns": {
          "type": "badge",
          "settings": { "icon": "return", "title": "14 jours pour changer d'avis", "text": "Rétractation selon nos conditions" }
        },
        "support": {
          "type": "badge",
          "settings": { "icon": "mail", "title": "Service client", "text": "Réponse sous 24 h ouvrées" }
        }
      },
      "block_order": ["shipping", "payment", "returns", "support"],
      "settings": {
        "color_scheme": "cream",
        "padding_top": 48,
        "padding_bottom": 48
      }
    },
    "faq": {
      "type": "faq",
      "blocks": {
        "q1": {
          "type": "question",
          "settings": {
            "question": "Quand vais-je recevoir ma commande ?",
            "answer": "<p>Comptez 7 à 12 jours après votre commande. Vous recevez un numéro de suivi par e-mail dès l'expédition.</p>"
          }
        },
        "q2": {
          "type": "question",
          "settings": {
            "question": "Puis-je encore recevoir avant Noël ?",
            "answer": "<p>Oui, si vous commandez au plus tard le 8 décembre. Après cette date, la livraison peut arriver après Noël.</p>"
          }
        },
        "q3": {
          "type": "question",
          "settings": {
            "question": "La livraison est-elle payante ?",
            "answer": "<p>Non, la livraison est offerte en France et en Belgique.</p>"
          }
        },
        "q4": {
          "type": "question",
          "settings": {
            "question": "Et si le produit ne me plaît pas ?",
            "answer": "<p>Vous disposez de 14 jours après réception pour changer d'avis. Les conditions sont détaillées dans notre politique de remboursement.</p>"
          }
        },
        "q5": {
          "type": "question",
          "settings": {
            "question": "Comment vous contacter ?",
            "answer": "<p>Par e-mail, depuis la page Contact. Nous répondons sous 24 h ouvrées.</p>"
          }
        }
      },
      "block_order": ["q1", "q2", "q3", "q4", "q5"],
      "settings": {
        "heading": "Questions fréquentes",
        "open_first": false,
        "color_scheme": "white",
        "padding_top": 64,
        "padding_bottom": 64
      }
    },
    "newsletter": {
      "type": "newsletter",
      "settings": {
        "heading": "Les idées lumineuses de la saison",
        "text": "<p>Nouveautés et conseils de décoration, au maximum un e-mail par semaine.</p>",
        "color_scheme": "night-soft",
        "padding_top": 64,
        "padding_bottom": 64
      }
    }
  },
  "order": ["hero", "pack", "deadline", "grid", "steps", "gift", "trust", "faq", "newsletter"]
}
```

### 12.2 `templates/product.json` (modèle produit par défaut)
- Sections : `main` (`main-product`), `details` (`product-details`), `steps` (`how-it-works`), `trust` (`trust-badges`), `upsell` (`product-upsell`).
- Blocs de `main`, dans cet ordre : `title`, `price`, `variant_picker`, `quantity`, `buy_buttons`, `delivery`, `countdown`, `pack_cta`, `trust`, `collapsible` (« Livraison et retours », contenu générique).
- `details` : un onglet `use_description` coché (« Description »).
- `upsell` : liste `pack-facade-de-noel`, `projecteur-de-noel-led`, `guirlande-neige-qui-tombe`.

### 12.3 Modèles par produit
Les cinq modèles ont la même structure que `product.json`, enrichie avec les textes de la section 14.
Tous les textes produit (sous-titre, points forts, onglets, FAQ) sont saisis dans les réglages des blocs du modèle JSON.
Avantage pour Corentin : il n'a pas à créer de metafields ; il change un texte dans l'éditeur de thème.

`product.pack.json` :
- `main` : blocs `badge` (« Le plus choisi », `gold`), `title`, `subtitle` (14.1), `price`, `highlights` (4 points forts de 14.1), `buy_buttons`, `delivery`, `countdown`, `trust`, `collapsible` « Ce qui est inclus » (liste de 14.1), `collapsible` « Livraison et retours ».
- Pas de bloc `pack_cta` (c'est le pack lui-même).
- `details` : onglets « Description » (`use_description`), « Contenu du colis », « Caractéristiques », « Sécurité et utilisation » (textes 14.1).
- `steps` : les 3 étapes par défaut.
- `faq` : 5 questions de 14.1.
- `upsell` : `couronne-de-noel-lumineuse`, `sapin-feutrine-enfant`.

`product.projecteur.json` :
- `main` : `title`, `subtitle` (14.2), `price`, `highlights` (14.2), `buy_buttons`, `delivery`, `countdown`, `pack_cta` (pack, texte « Ajoutez la guirlande neige : découvrez le pack Façade de Noël. »), `trust`, `collapsible` « Livraison et retours ».
- `details`, `steps`, `faq` : textes 14.2.
- `upsell` : `guirlande-neige-qui-tombe`, `couronne-de-noel-lumineuse`.

`product.couronne.json` :
- `main` : `title`, `subtitle` (14.3), `price`, `highlights` (14.3), `buy_buttons`, `delivery`, `countdown`, `trust`, `collapsible` « Livraison et retours ».
- `pack_cta` : non (la couronne n'est pas dans le pack).
- `details`, `faq` : textes 14.3. Pas de section `steps` (remplacée par `image-with-text` « Sur la porte d'entrée »).
- `upsell` : `pack-facade-de-noel`, `projecteur-de-noel-led`.

`product.guirlande.json` :
- `main` : `title`, `subtitle` (14.4), `price`, `highlights` (14.4), `buy_buttons`, `delivery`, `countdown`, `pack_cta` (texte « Avec le projecteur, elle est encore plus belle : découvrez le pack. »), `trust`, `collapsible` « Livraison et retours ».
- `details`, `faq` : textes 14.4. Section `steps` adaptée : « Accrochez », « Branchez », « Admirez ».
- `upsell` : `projecteur-de-noel-led`, `couronne-de-noel-lumineuse`.

`product.sapin.json` :
- `main` : `title`, `subtitle` (14.5), `price`, `highlights` (14.5), `buy_buttons`, `delivery`, `countdown`, `trust`, `collapsible` « Livraison et retours ».
- `details`, `faq` : textes 14.5, dont l'onglet « Sécurité et utilisation » avec l'avertissement d'âge [À VÉRIFIER].
- Pas de section `steps` ; section `image-with-text` « Une activité de l'Avent pour les enfants ».
- `upsell` : `couronne-de-noel-lumineuse`, `pack-facade-de-noel`.

Bloc `collapsible` « Livraison et retours » (identique sur toutes les fiches) :
- « Livraison offerte en France et en Belgique. »
- « Délai : 7 à 12 jours après la commande. Numéro de suivi envoyé par e-mail. »
- « Pour recevoir avant Noël, commandez au plus tard le 8 décembre. »
- « 14 jours pour changer d'avis après réception, selon notre politique de remboursement. »

### 12.4 Autres modèles
- `collection.json` : `main-collection`, puis `trust-badges`.
- `list-collections.json` : `main-list-collections`.
- `cart.json` : `main-cart`, puis `delivery-deadline`.
- `search.json` : `main-search`.
- `page.json` : `main-page`.
- `page.contact.json` : `main-page` (titre et texte de la page), `contact-form`, `faq` (questions sur la livraison et les retours).
- `404.json` : `main-404`.
- `blog.json` : `main-blog`.
- `article.json` : `main-article`, `product-grid` (3 produits).
- `password.json` : `main-password` (avec `layout: "password"` dans le JSON).
- `gift_card.liquid` : page Liquid autonome (`{% layout none %}`), carte cadeau avec code (`gift_card.code | format_code`), solde, bouton copier (`gift_card.copy`), QR code (`gift_card.qr_identifier` si disponible), lien vers la boutique, mise en page imprimable.

---

## 13. JavaScript (`assets/`)

Règles communes :
- Chaque fichier est un module autonome chargé en `defer` ; pas de variable globale autre que `window.themeConfig` et `window.Theme` (espace de noms des utilitaires).
- Chaque composant vérifie `customElements.get(name)` avant `customElements.define`.
- Aucune erreur si un élément attendu est absent de la page (le composant ne fait rien).
- Gestion des erreurs réseau : message traduit (`themeConfig.strings`), jamais d'`alert()`.
- Pas de `console.log` dans la version finale.
- Respect de `prefers-reduced-motion` pour toute animation déclenchée en JavaScript.

### 13.1 `theme.js`
Contenu :
- `window.Theme` avec les utilitaires :
  - `debounce(fn, wait)`.
  - `trapFocus(container, elementToFocus)` et `removeTrapFocus(elementToFocusBack)`.
  - `lockScroll()` / `unlockScroll()` (classe `is-locked` sur `body`, compensation de la barre de défilement).
  - `formatMoney(cents)` à partir de `themeConfig.moneyFormat` (gère `{{amount}}`, `{{amount_with_comma_separator}}`, `{{amount_no_decimals}}`).
  - `showToast(message)` : remplit `.toast`, le rend visible 4 secondes.
  - `announce(message)` : écrit un message dans une zone `role="status"` invisible, pour les lecteurs d'écran.
  - `prefersReducedMotion()` : booléen.
- `<menu-drawer>` : ouverture / fermeture du menu mobile, focus piégé, Échap, clic sur la superposition, `aria-expanded` synchronisé.
- `<quantity-input>` : boutons plus / moins, respect de `min` et `max`, émet un évènement `change` sur le champ.
- Apparition au défilement : IntersectionObserver sur `.reveal`, ajoute `.is-visible` une seule fois ; désactivé en mouvement réduit (tout visible d'emblée).
- En-tête : ajoute `.is-scrolled` à `.header` après 8 px de défilement (écouteur passif, `requestAnimationFrame`).
- Bouton pause / lecture des vidéos décoratives (`[data-video-toggle]`) : met à jour l'icône et le libellé.
- Bandeau d'annonces multiples : rotation toutes les 5 secondes, pause au survol, au focus et via le bouton.
- Onglets accessibles de `product-details` (`<product-tabs>`) : flèches gauche / droite, Début / Fin, `aria-selected`, `tabindex`.
- Tri de collection : soumission automatique du formulaire au changement du `<select>`.
- Partage (`[data-share]`) : `navigator.share` sinon copie dans le presse-papiers + toast.

### 13.2 `cart.js`
Contenu :
- `<cart-drawer>` : méthodes `open(trigger)`, `close()`, `renderContents(parsedState)` ; focus piégé et rendu au déclencheur.
- Interception de tous les formulaires `form[data-type="add-to-cart-form"]` et des formulaires d'ajout des cartes produit :
  1. `event.preventDefault()`.
  2. Bouton en `aria-busy="true"` et désactivé.
  3. `fetch(routes.cart_add_url + '.js', { method: 'POST', headers: { 'Accept': 'application/json' }, body: FormData })` en ajoutant `sections=cart-drawer,cart-icon-bubble` et `sections_url=window.location.pathname` (annexe A.5).
  4. Succès : remplacer le contenu du tiroir et la pastille du panier avec le HTML renvoyé dans `sections`, ouvrir le tiroir (ou rediriger vers le panier si `cartType === 'page'`).
  5. Erreur (statut 422 ou `status` dans la réponse) : afficher `description` ou `cart.error_generic` dans la zone `role="alert"` du formulaire.
  6. Toujours : retirer `aria-busy`, réactiver le bouton.
- Modification des quantités dans le tiroir et sur la page panier :
  - `fetch(routes.cart_change_url + '.js')` avec `{ line, quantity, sections, sections_url }` en JSON.
  - Debounce de 300 ms sur la saisie de quantité.
  - Bouton « Retirer » = quantité 0.
  - Si la quantité demandée n'est pas acceptée : message `cart.error_quantity` sur la ligne concernée.
  - Mise à jour du sous-total, de la pastille et de la suggestion (masquée si le produit suggéré est déjà dans le panier).
- Annonce aux lecteurs d'écran : `cart.item_added` via la zone `role="status"`.
- Évènement `cart:updated` émis sur `document` avec le nouvel état du panier.
- Clic sur l'icône panier de l'en-tête : `preventDefault` et ouverture du tiroir si `cartType === 'drawer'`.
- Sans JavaScript : tous les formulaires fonctionnent normalement (soumission classique vers `/cart/add` et `/cart`).

### 13.3 `product.js`
Contenu :
- `<variant-picker>` :
  - Lit les variantes depuis `script[data-variants]`.
  - Au changement d'option : trouve la variante correspondante, met à jour le champ caché `id`, l'URL (`history.replaceState` avec `?variant=`), le prix (snippet `price` re-rendu via la Section Rendering API ou mise à jour directe), le bouton (disponible, épuisé, indisponible) et le média de la variante.
  - Émet `variant:change` avec `{ variant }`.
- `<product-gallery>` :
  - Mobile : défilement `scroll-snap`, mise à jour des points et du compteur avec IntersectionObserver.
  - Ordinateur : clic sur une miniature = affichage du média, `aria-current` sur la miniature active.
  - Écoute `variant:change` pour afficher le média de la variante.
  - Met en pause les vidéos qui sortent de l'écran.
  - Zoom : ouvre un `<dialog>` avec l'image en 2048 px, fermeture Échap et clic extérieur, focus géré.
- `<sticky-atc>` :
  - Observe le bouton principal ; affiche la barre quand il n'est plus visible et que le pied de page ne l'est pas.
  - Clic : `document.getElementById(formId).requestSubmit()`.
  - Met à jour le prix affiché à `variant:change`.
  - Ajoute / retire une classe sur `body` qui réserve l'espace en bas de page.
- Formatage des prix avec `Theme.formatMoney`.

### 13.4 `delivery.js`
Contenu :
- Fonction `nowInBrussels()` : date courante interprétée dans le fuseau `Europe/Brussels` (via `Intl.DateTimeFormat` avec `timeZone`).
- Fonction `deadlineDate()` : combine `themeConfig.deadline.date` et `themeConfig.deadline.time` en instant précis à Bruxelles ; renvoie `null` si le format est invalide (et rien ne s'affiche).
- Fonction `addDays(date, days, skipSundays)` : ajoute des jours calendaires, en sautant les dimanches si le réglage est actif.
- `<delivery-estimate>` :
  - Calcule `start = addDays(aujourd'hui, min)` et `end = addDays(aujourd'hui, max)`.
  - Affiche `delivery.estimate` avec des dates courtes en français (`Intl.DateTimeFormat('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' })`).
  - En mode Noël, si `end` dépasse le 24 décembre ou si la date limite est passée : ajoute `delivery.after_christmas`.
- `<deadline-countdown>` :
  - Calcule jours, heures, minutes restants jusqu'à `deadlineDate()`.
  - Mise à jour toutes les 30 secondes (pas de secondes affichées), suspendue quand l'onglet est masqué (`visibilitychange`).
  - Texte `visually-hidden` mis à jour au plus une fois par minute.
  - Une fois la date passée : remplace le contenu par `countdown.deadline_passed` et arrête le minuteur.
- Les deux composants affichent la même chose pour tous les visiteurs à un instant donné : aucune donnée liée à la visite (cookie, stockage local) n'intervient dans le calcul.

### 13.5 `snow.js`
Contenu :
- Ne fait rien si mouvement réduit, si l'onglet est masqué ou si `.snow-layer` est absente.
- Crée `data-density` flocons en `<span>` (taille 2 à 6 px, opacité 0,4 à 0,9), animés en CSS (`transform` uniquement, pas de `top`/`left`) avec durées et délais aléatoires.
- Moitié moins de flocons sous 750 px de large.
- Arrête l'animation (`animation-play-state: paused`) quand l'onglet est masqué.
- Poids cible : moins de 2 Ko.

---

## 14. Contenus produits (`content/produits/` et modèles produits)

Règles de rédaction :
- Vouvoiement, phrases courtes, verbes d'action, bénéfice d'abord, caractéristique ensuite.
- Pas de superlatifs invérifiables (« le meilleur », « le plus puissant », « qualité premium »).
- Chaque chiffre technique vient de la fiche du fournisseur ; s'il est incertain, il reste en [À VÉRIFIER].
- Chaque fichier `content/produits/<handle>.html` contient la description complète en HTML simple (`<p>`, `<ul>`, `<li>`, `<strong>`, `<h3>`), prête à coller dans le champ Description de l'admin.
- Les autres textes (sous-titre, points forts, onglets, FAQ) vont dans les réglages des blocs du modèle produit correspondant.
- Les textes alternatifs proposés sont à saisir par Corentin sur chaque image dans l'admin.
- Le bloc « Sécurité et utilisation » répond à l'obligation européenne d'informer sur la sécurité du produit (règlement GPSR) ; les champs [À COMPLÉTER] sont à demander au vendeur AliExpress.

### 14.1 Pack Façade de Noël (`pack-facade-de-noel`)
SEO :
- Titre SEO (60 caractères max) : « Pack Façade de Noël : projecteur LED + guirlande neige »
- Méta-description (155 caractères max) : « Projecteur de motifs de Noël et guirlande neige qui tombe dans un seul colis. Livraison offerte en France et en Belgique. »
Titre (h1) : « Pack Façade de Noël »
Sous-titre : « Le projecteur de motifs et la guirlande neige qui tombe, réunis dans un seul colis. »
Points forts :
1. « Deux effets lumineux complémentaires pour toute la façade »
2. « Prêts à brancher, sans outil »
3. « Un seul colis, une seule livraison offerte »
4. « 14 jours pour changer d'avis »
Description (fichier HTML) :
- Paragraphe 1 : « Le pack Façade de Noël réunit nos deux décorations les plus demandées. Le projecteur dessine des motifs de Noël sur votre mur, pendant que la guirlande fait tomber une pluie de lumière le long de la gouttière, d'un arbre ou d'une rambarde. »
- Paragraphe 2 : « Résultat : une façade qui attire le regard dès la tombée de la nuit, sans échelle ni installation compliquée. »
- Sous-titre h3 « Pourquoi choisir le pack ? » puis liste :
  - « Les deux produits sont pensés pour fonctionner ensemble. »
  - « Vous recevez tout en une seule livraison. »
  - « Vous n'avez qu'une commande à suivre. »
- Paragraphe final : « Livraison offerte en France et en Belgique, en 7 à 12 jours. Pour recevoir avant Noël, commandez au plus tard le 8 décembre. »
Onglet « Contenu du colis » :
- « 1 projecteur de Noël LED 16 motifs et son alimentation [À VÉRIFIER : type d'alimentation et prise européenne] »
- « 1 guirlande « neige qui tombe » de 8 tubes avec prise européenne [À VÉRIFIER] »
- « Notice du fabricant [À VÉRIFIER : langue de la notice] »
Onglet « Caractéristiques » :
- Renvoyer aux caractéristiques des deux produits (14.2 et 14.4), sous forme de deux listes titrées.
Onglet « Sécurité et utilisation » : reprendre les deux blocs sécurité de 14.2 et 14.4.
FAQ :
- « Le pack arrive-t-il en un seul colis ? » — « Nous faisons notre maximum pour que les deux produits voyagent ensemble. Selon le fournisseur, ils peuvent arriver en deux colis à quelques jours d'intervalle ; vous recevez alors un numéro de suivi pour chacun. »
- « Peut-on utiliser les deux produits séparément ? » — « Oui, chaque produit a sa propre alimentation et fonctionne seul. [À VÉRIFIER] »
- « Faut-il une prise extérieure ? » — « Il faut une prise électrique à portée de câble. Pour un usage dehors, utilisez une prise extérieure protégée et une rallonge prévue pour l'extérieur. »
- « Quand vais-je recevoir le pack ? » — « En 7 à 12 jours après votre commande. Commandez au plus tard le 8 décembre pour le recevoir avant Noël. »
- « Puis-je retourner le pack ? » — « Oui, vous disposez de 14 jours après réception pour changer d'avis, selon notre politique de remboursement. »
Textes alternatifs des images :
- « Façade de maison illuminée de motifs de Noël et d'une guirlande neige, la nuit »
- « Projecteur de Noël LED et guirlande neige posés côte à côte »

### 14.2 Projecteur de Noël LED 16 motifs (`projecteur-de-noel-led`)
SEO :
- Titre SEO : « Projecteur de Noël LED 16 motifs pour façade et intérieur »
- Méta-description : « Projetez 16 motifs de Noël sur votre façade ou vos murs. Simple à brancher, livraison offerte en France et en Belgique. »
Titre (h1) : « Projecteur de Noël LED 16 motifs »
Sous-titre : « 16 motifs de Noël projetés sur votre mur, en un seul branchement. »
Points forts :
1. « 16 motifs interchangeables : flocons, sapins, Père Noël, étoiles [À VÉRIFIER : liste exacte des motifs] »
2. « Projection de 1 à 5 mètres du mur »
3. « Éclairage LED, faible consommation »
4. « Utilisation intérieure, et extérieure abritée [À VÉRIFIER : indice IP] »
Description :
- Paragraphe 1 : « Transformez votre façade en décor de Noël en quelques secondes. Placez le projecteur face au mur, branchez-le, et 16 motifs de fête apparaissent : flocons, sapins, étoiles et personnages de Noël. »
- Paragraphe 2 : « À l'intérieur, il crée une ambiance magique dans une chambre d'enfant ou un salon. À l'extérieur, il illumine un mur, une porte de garage ou un pignon. »
- h3 « Ce que vous allez aimer » puis liste :
  - « Aucune installation : pas de crochets, pas d'échelle. »
  - « Changez de motif selon vos envies. [À VÉRIFIER : mode de changement des motifs] »
  - « Rangement facile après les fêtes. »
- h3 « Bon à savoir » puis liste :
  - « La taille de la projection dépend de la distance au mur : plus le projecteur est loin, plus les motifs sont grands et moins ils sont lumineux. »
  - « L'effet est le plus beau dans l'obscurité complète. »
  - « Le projecteur fonctionne sur secteur, sans piles ni télécommande. »
Onglet « Contenu du colis » :
- « 1 projecteur LED »
- « 1 alimentation [À VÉRIFIER : adaptateur avec prise européenne inclus] »
- « Disques ou lentilles de motifs, selon le modèle [À VÉRIFIER] »
- « 1 piquet de sol [À VÉRIFIER : inclus ou non] »
Onglet « Caractéristiques » :
- « Source lumineuse : LED »
- « Nombre de motifs : 16 »
- « Distance de projection : 1 à 5 m »
- « Alimentation : secteur via adaptateur [À VÉRIFIER : tension d'entrée et de sortie] »
- « Matériau du boîtier : plastique »
- « Indice de protection : [À VÉRIFIER] »
- « Longueur du câble : [À VÉRIFIER] »
- « Dimensions et poids : [À VÉRIFIER] »
Onglet « Sécurité et utilisation » :
- « Ne fixez pas directement la source lumineuse. »
- « N'utilisez que l'alimentation fournie. »
- « Dehors, branchez-le uniquement sur une prise extérieure protégée, avec une rallonge prévue pour l'extérieur. »
- « Ne le couvrez pas pendant le fonctionnement. Débranchez-le en cas d'orage et pendant le rangement. »
- « Ceci n'est pas un jouet : tenez-le hors de portée des jeunes enfants. »
- « Marquage CE : [À VÉRIFIER sur le produit et l'emballage] »
- « Fabricant : [À COMPLÉTER : nom, adresse postale et e-mail] »
- « Personne responsable dans l'UE : [À COMPLÉTER] »
- « Référence du modèle : [À COMPLÉTER] »
- « Fin de vie : ne jetez pas cet appareil avec les ordures ménagères ; déposez-le dans un point de collecte des équipements électriques. »
FAQ :
- « Le projecteur fonctionne-t-il dehors ? » — « Oui, à condition qu'il soit protégé de la pluie directe et branché sur une prise extérieure protégée. [À VÉRIFIER : indice IP] »
- « Quelle taille fait la projection ? » — « Elle dépend de la distance au mur. À environ 5 mètres, les motifs couvrent une large surface ; plus près, ils sont plus petits et plus lumineux. »
- « Y a-t-il une minuterie ? » — « [À VÉRIFIER : minuterie ou non]. Sinon, une prise programmable fait très bien l'affaire. »
- « Faut-il des piles ? » — « Non, il fonctionne sur secteur. »
- « Quand vais-je le recevoir ? » — « En 7 à 12 jours. Commandez au plus tard le 8 décembre pour le recevoir avant Noël. »
Textes alternatifs :
- « Mur de maison couvert de motifs de flocons projetés, la nuit »
- « Projecteur de Noël LED noir posé sur le sol »
- « Détail des motifs de Noël projetés sur un mur intérieur »

### 14.3 Couronne de Noël lumineuse 40 cm (`couronne-de-noel-lumineuse`)
SEO :
- Titre SEO : « Couronne de Noël lumineuse 40 cm pour porte d'entrée »
- Méta-description : « Couronne de Noël de 40 cm avec lumières LED et baies rouges, pour accueillir vos invités. Livraison offerte en France et en Belgique. »
Titre (h1) : « Couronne de Noël lumineuse 40 cm »
Sous-titre : « Une porte d'entrée qui souhaite la bienvenue à vos invités, jour et nuit. »
Points forts :
1. « Diamètre 40 cm, bien visible sur une porte »
2. « Lumières LED intégrées »
3. « Baies rouges et feuillage vert réalistes »
4. « Réutilisable d'année en année »
Description :
- Paragraphe 1 : « La couronne est le premier signe de Noël que voient vos invités. Celle-ci associe un feuillage vert fourni, des baies rouges et des lumières LED chaudes, pour une porte accueillante de jour comme de nuit. »
- Paragraphe 2 : « Accrochez-la sur la porte d'entrée, au-dessus d'une cheminée ou sur un mur. »
- h3 « Pourquoi elle plaît » puis liste :
  - « Prête à accrocher, rien à assembler. [À VÉRIFIER] »
  - « Feuillage synthétique qui ne perd pas d'aiguilles. »
  - « Se range à plat après les fêtes. »
Onglet « Contenu du colis » :
- « 1 couronne de 40 cm avec lumières intégrées »
- « Boîtier de piles ou alimentation [À VÉRIFIER : piles ou secteur, piles incluses ou non] »
- « Crochet de fixation [À VÉRIFIER : inclus ou non] »
Onglet « Caractéristiques » :
- « Diamètre : 40 cm »
- « Matériaux : feuillage en PVC, baies décoratives [À VÉRIFIER : matériau des baies] »
- « Éclairage : LED [À VÉRIFIER : nombre de LED et couleur] »
- « Alimentation : [À VÉRIFIER] »
- « Usage : intérieur [À VÉRIFIER : extérieur abrité possible ou non] »
- « Minuterie : [À VÉRIFIER] »
Onglet « Sécurité et utilisation » :
- « Ne pas placer près d'une flamme ou d'une source de chaleur. »
- « Si la couronne fonctionne avec des piles : tenez les piles hors de portée des enfants et retirez-les pendant le rangement. »
- « Ceci n'est pas un jouet. »
- « Marquage CE : [À VÉRIFIER] »
- « Fabricant : [À COMPLÉTER] »
- « Personne responsable dans l'UE : [À COMPLÉTER] »
- « Fin de vie : déposez l'appareil et ses piles dans un point de collecte adapté. »
FAQ :
- « Peut-on l'accrocher dehors ? » — « [À VÉRIFIER : usage extérieur]. En cas de doute, réservez-la à l'intérieur ou à une porte abritée. »
- « Les piles sont-elles fournies ? » — « [À VÉRIFIER] »
- « Comment l'accrocher ? » — « Avec un crochet de porte ou un ruban passé derrière la couronne. »
- « Quand vais-je la recevoir ? » — « En 7 à 12 jours. Commandez au plus tard le 8 décembre pour la recevoir avant Noël. »
Textes alternatifs :
- « Couronne de Noël verte avec baies rouges et lumières sur une porte d'entrée »
- « Gros plan sur les baies rouges et les LED de la couronne »

### 14.4 Guirlande « neige qui tombe » 8 tubes (`guirlande-neige-qui-tombe`)
SEO :
- Titre SEO : « Guirlande LED neige qui tombe, 8 tubes, effet chute de neige »
- Méta-description : « 8 tubes LED qui imitent une chute de neige. À suspendre à un arbre, une gouttière ou une rambarde. Livraison offerte. »
Titre (h1) : « Guirlande « neige qui tombe » 8 tubes »
Sous-titre : « Une pluie de lumière qui glisse le long des tubes, comme de la neige qui tombe. »
Points forts :
1. « 8 tubes de 30 cm, 192 LED au total »
2. « Effet lumineux de chute de neige »
3. « À suspendre à un arbre, une gouttière ou une rambarde »
4. « Prise européenne [À VÉRIFIER] »
Description :
- Paragraphe 1 : « La guirlande neige qui tombe donne l'illusion de flocons lumineux qui glissent du haut vers le bas. Suspendue à une branche, sous une gouttière ou le long d'une rambarde, elle anime la façade toute la soirée. »
- Paragraphe 2 : « Associée au projecteur, elle complète le décor : les motifs habillent le mur, la guirlande dessine le contour. »
- h3 « Idées d'installation » puis liste :
  - « Dans un arbre ou une haie, tubes à la verticale. »
  - « Sous l'avancée du toit, comme des stalactites. »
  - « Le long d'un balcon ou d'une rambarde. »
Onglet « Contenu du colis » :
- « 8 tubes LED de 30 cm reliés entre eux »
- « 1 câble d'alimentation avec prise européenne [À VÉRIFIER] »
- « Attaches [À VÉRIFIER : incluses ou non] »
Onglet « Caractéristiques » :
- « Nombre de tubes : 8 »
- « Longueur d'un tube : 30 cm »
- « Nombre de LED : 192 »
- « Alimentation : secteur 220–240 V [À VÉRIFIER : prise européenne] »
- « Couleur de la lumière : [À VÉRIFIER : blanc froid, blanc chaud ou multicolore selon la variante] »
- « Indice de protection : [À VÉRIFIER] »
- « Longueur totale et espacement des tubes : [À VÉRIFIER] »
Onglet « Sécurité et utilisation » :
- « Branchez la guirlande uniquement après l'avoir entièrement déroulée et installée. »
- « Dehors, utilisez une prise extérieure protégée et une rallonge prévue pour l'extérieur. »
- « N'utilisez pas une guirlande dont un tube ou le câble est abîmé. »
- « Débranchez-la en cas d'orage et pendant le rangement. »
- « Ceci n'est pas un jouet. »
- « Marquage CE : [À VÉRIFIER] »
- « Fabricant : [À COMPLÉTER] »
- « Personne responsable dans l'UE : [À COMPLÉTER] »
- « Fin de vie : point de collecte des équipements électriques. »
FAQ :
- « La guirlande résiste-t-elle à la pluie ? » — « [À VÉRIFIER : indice IP]. Utilisez-la de préférence à un endroit abrité et branchez-la sur une prise extérieure protégée. »
- « Peut-on relier plusieurs guirlandes ? » — « [À VÉRIFIER : connecteur de raccordement ou non] »
- « Quelle couleur choisir ? » — « Le blanc froid rappelle la neige, le blanc chaud donne une ambiance plus douce. [À VÉRIFIER : variantes disponibles] »
- « Quand vais-je la recevoir ? » — « En 7 à 12 jours. Commandez au plus tard le 8 décembre pour la recevoir avant Noël. »
Textes alternatifs :
- « Guirlande neige qui tombe suspendue sous un toit, la nuit »
- « Tubes LED lumineux suspendus dans un arbre »

### 14.5 Sapin de Noël en feutrine pour enfant, 100 cm (`sapin-feutrine-enfant`)
Attention : ce produit est destiné aux enfants. En Europe, un jouet doit porter le marquage CE et respecter la norme EN 71.
Tant que la conformité n'est pas confirmée par le fournisseur, Corentin ne doit pas le mettre en vente ; le README le rappelle.
SEO :
- Titre SEO : « Sapin de Noël en feutrine pour enfant, 100 cm, à décorer »
- Méta-description : « Sapin en feutrine de 100 cm à accrocher au mur, avec décorations amovibles. Une activité de Noël pour les enfants. Livraison offerte. »
Titre (h1) : « Sapin de Noël en feutrine pour enfant, 100 cm »
Sous-titre : « Le sapin que les enfants décorent eux-mêmes, encore et encore. »
Points forts :
1. « 100 cm de haut, à fixer au mur ou à une porte »
2. « Décorations amovibles à accrocher et décrocher [À VÉRIFIER : nombre de pièces] »
3. « Sans aiguilles, sans verre, sans branches qui piquent »
4. « Se plie et se range dans une enveloppe »
Description :
- Paragraphe 1 : « Avec ce sapin en feutrine, les enfants ont leur propre sapin de Noël. Ils accrochent, décrochent et réarrangent les décorations autant qu'ils le veulent. »
- Paragraphe 2 : « Fixé au mur de la chambre ou du salon, il devient une activité de l'Avent qui occupe les petites mains pendant tout le mois de décembre. »
- h3 « Les parents apprécient » puis liste :
  - « Pas de boules en verre qui se cassent. »
  - « Le grand sapin reste hors de portée des mains curieuses. »
  - « Il se range à plat d'une année sur l'autre. »
Onglet « Contenu du colis » :
- « 1 sapin en feutrine de 100 cm »
- « Décorations amovibles en feutrine [À VÉRIFIER : nombre exact] »
- « Moyen de fixation au mur [À VÉRIFIER : crochets adhésifs inclus ou non] »
- « Guirlande LED [À VÉRIFIER : uniquement si la variante choisie l'inclut] »
Onglet « Caractéristiques » :
- « Hauteur : 100 cm »
- « Matériau : feutrine [À VÉRIFIER : composition] »
- « Fixation des décorations : bandes auto-agrippantes [À VÉRIFIER] »
- « Âge conseillé : [À VÉRIFIER] »
Onglet « Sécurité et utilisation » :
- « Attention : ne convient pas aux enfants de moins de 3 ans, petits éléments, risque d'étouffement. [À VÉRIFIER : avertissement exact du fabricant] »
- « À utiliser sous la surveillance d'un adulte. »
- « Si une guirlande LED est incluse : elle ne fait pas partie du jeu ; elle est installée et manipulée par un adulte. »
- « Marquage CE et conformité EN 71 : [À VÉRIFIER — obligatoire avant la mise en vente] »
- « Fabricant : [À COMPLÉTER] »
- « Personne responsable dans l'UE : [À COMPLÉTER] »
FAQ :
- « À partir de quel âge ? » — « [À VÉRIFIER : âge indiqué par le fabricant]. »
- « Comment le fixer au mur ? » — « Avec des crochets adhésifs ou des punaises dans les coins prévus. [À VÉRIFIER : fixations incluses] »
- « Les décorations tiennent-elles bien ? » — « Elles s'accrochent par bandes auto-agrippantes et se retirent facilement. [À VÉRIFIER] »
- « Quand vais-je le recevoir ? » — « En 7 à 12 jours. Commandez au plus tard le 8 décembre pour le recevoir avant Noël. »
Textes alternatifs :
- « Sapin en feutrine accroché au mur d'une chambre d'enfant, avec décorations colorées »
- « Enfant qui accroche une étoile en feutrine sur le sapin » (seulement si la photo vient du fournisseur et montre bien ce produit)

---

## 15. Textes légaux (`content/legal/`)

Avertissement à recopier en tête de chaque fichier :
> Modèle rédigé pour aider Corentin à démarrer. Ce n'est pas un conseil juridique.
> Faites vérifier ces textes (guichet d'entreprises, juriste ou comptable) avant l'ouverture de la boutique.

Ces textes sont collés par Corentin dans les politiques Shopify ; le thème les affiche via `shop.policies` dans le pied de page.

### 15.1 `mentions-legales.md` (politique « Mentions légales »)
- Éditeur du site : [À COMPLÉTER : nom et prénom, ou nom de l'entreprise].
- Statut : [À COMPLÉTER : indépendant (personne physique) ou société, forme juridique].
- Adresse : [À COMPLÉTER : adresse postale complète en Belgique].
- Numéro d'entreprise (BCE) : [À COMPLÉTER].
- Numéro de TVA : [À COMPLÉTER : numéro, ou mention du régime de franchise des petites entreprises — À VÉRIFIER avec un comptable].
- E-mail : [À COMPLÉTER].
- Téléphone : [À COMPLÉTER, facultatif].
- Hébergement de la boutique : Shopify International Limited, Dublin, Irlande [À VÉRIFIER : adresse exacte dans les conditions de Shopify].
- Propriété intellectuelle : textes et visuels du site, sauf mention contraire, réservés ; photos des produits fournies par les fabricants.
- Litiges : coordonnées d'un service de médiation des litiges de consommation [À COMPLÉTER : par exemple le Service de médiation pour le consommateur en Belgique — À VÉRIFIER].

### 15.2 `cgv.md` (politique « Conditions d'utilisation » / conditions générales de vente)
Articles à rédiger, avec ces points précis :
1. Objet : vente en ligne de décorations de Noël aux consommateurs résidant en France et en Belgique.
2. Vendeur : renvoi aux mentions légales.
3. Produits : description sur chaque fiche ; photos aussi fidèles que possible ; seules les caractéristiques indiquées engagent le vendeur.
4. Prix : en euros, toutes taxes applicables comprises [À VÉRIFIER selon le régime de TVA] ; livraison offerte en France et en Belgique ; prix applicable = prix affiché au moment de la commande.
5. Commande : étapes (panier, coordonnées, paiement, confirmation par e-mail) ; le contrat est conclu à l'envoi de l'e-mail de confirmation.
6. Paiement : par les moyens proposés au paiement (Shopify Payments : cartes bancaires, Bancontact, Apple Pay, Google Pay selon disponibilité) ; débit au moment de la commande.
7. Livraison : délai indicatif de 7 à 12 jours ; numéro de suivi ; en cas de retard important, le client peut annuler selon la loi applicable ; détails dans la politique de livraison.
8. Droit de rétractation :
   - 14 jours à compter de la réception du produit (de la réception du dernier article pour une commande en plusieurs colis).
   - Le client informe le vendeur par e-mail ou avec le formulaire type ci-dessous, sans avoir à se justifier.
   - Retour du produit dans les 14 jours suivant cette information.
   - Frais de retour à la charge du client [À VÉRIFIER : choix de Corentin, à annoncer clairement avant l'achat].
   - Remboursement de toutes les sommes versées, frais de livraison initiaux compris, dans les 14 jours suivant l'information de rétractation ; le vendeur peut attendre la réception du retour ou la preuve d'expédition.
   - Le client répond de la dépréciation du produit résultant de manipulations autres que celles nécessaires pour vérifier sa nature et son bon fonctionnement.
9. Garanties légales : garantie légale de conformité de deux ans à compter de la livraison et garantie des vices cachés, selon le droit applicable au client [À VÉRIFIER : références des textes français et belges].
10. Produit défectueux ou non conforme : contact par e-mail avec photo ; remplacement ou remboursement, sans frais pour le client.
11. Responsabilité : utilisation conforme aux consignes de sécurité de chaque fiche produit.
12. Données personnelles : renvoi à la politique de confidentialité.
13. Litiges et médiation : réclamation d'abord par e-mail ; puis médiation [À COMPLÉTER] ; droit applicable [À VÉRIFIER].
Formulaire type de rétractation (à inclure en fin de CGV) :
- « À l'attention de [nom, adresse, e-mail du vendeur — À COMPLÉTER] :
- Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous :
- Commandé le / reçu le :
- Numéro de commande :
- Nom du consommateur :
- Adresse du consommateur :
- Signature du consommateur (uniquement en cas de notification sur papier) :
- Date : »

### 15.3 `retours.md` (politique « Remboursement »)
- Vous disposez de 14 jours après réception pour changer d'avis, sans avoir à vous justifier.
- Pour retourner un produit : écrivez-nous à [À COMPLÉTER : e-mail] avec votre numéro de commande.
- Nous vous indiquons l'adresse de retour [À COMPLÉTER : adresse de retour réelle — attention, ne jamais donner l'adresse du fournisseur sans accord].
- Le produit doit être renvoyé complet, dans un état permettant de le revendre.
- Frais de retour : [À VÉRIFIER : à votre charge ou à la nôtre].
- Remboursement sous 14 jours, par le moyen de paiement utilisé lors de la commande.
- Produit arrivé abîmé ou défectueux : envoyez-nous une photo dans les meilleurs délais ; nous vous remboursons ou vous renvoyons un produit, sans frais.

### 15.4 `livraison.md` (politique « Expédition »)
- Zones : France métropolitaine et Belgique [À VÉRIFIER : Corse, DOM-TOM exclus ou non].
- Prix : livraison offerte.
- Délai : 7 à 12 jours après la commande, à titre indicatif.
- Expédition : nos produits sont expédiés depuis les entrepôts de nos fournisseurs, situés pour la plupart hors de l'Union européenne.
- Droits et taxes d'importation : réglés par nos soins ; vous n'avez rien à payer à la livraison [À VÉRIFIER avec chaque fournisseur].
- Suivi : numéro de suivi envoyé par e-mail dès l'expédition.
- Noël : pour recevoir avant Noël, commandez au plus tard le 8 décembre.
- Commande en plusieurs colis : possible si les produits viennent de fournisseurs différents ; chaque colis a son numéro de suivi.
- Colis perdu ou très en retard : contactez-nous, nous trouvons une solution (renvoi ou remboursement).

### 15.5 `confidentialite.md` (politique « Confidentialité »)
- Responsable du traitement : [À COMPLÉTER : nom et coordonnées].
- Données collectées : identité, coordonnées, adresse de livraison, informations de commande, échanges avec le service client, données de navigation selon vos choix de cookies.
- Finalités : traitement des commandes, livraison, service client, obligations comptables, envoi d'e-mails si vous y avez consenti, mesure d'audience et publicité si vous y avez consenti.
- Bases légales : exécution du contrat, obligation légale, consentement, intérêt légitime (prévention de la fraude).
- Destinataires : Shopify (hébergement et paiement), fournisseurs et transporteurs (uniquement nom et adresse de livraison), outils publicitaires si vous avez accepté les cookies correspondants.
- Transferts hors UE : certains prestataires et fournisseurs sont situés hors de l'UE [À VÉRIFIER : garanties applicables].
- Durées de conservation : données de commande selon les obligations comptables [À VÉRIFIER : durée légale en Belgique] ; prospects : 3 ans après le dernier contact.
- Cookies : gérés par la bannière de consentement de Shopify ; vous pouvez modifier vos choix à tout moment.
- Vos droits : accès, rectification, effacement, limitation, opposition, portabilité, retrait du consentement, par e-mail à [À COMPLÉTER].
- Réclamation : auprès de l'Autorité de protection des données (Belgique) ou de l'autorité de votre pays de résidence.

### 15.6 `contact.md` (politique « Coordonnées »)
- Nom : [À COMPLÉTER].
- Adresse : [À COMPLÉTER].
- E-mail : [À COMPLÉTER].
- Numéro d'entreprise (BCE) : [À COMPLÉTER].
- Délai de réponse : 24 h ouvrées.

---

## 16. Référencement, performance, accessibilité

### 16.1 Référencement (SEO)
- Un seul `h1` par page : titre du hero sur l'accueil, titre du produit, de la collection, de la page ou de l'article ailleurs.
- Hiérarchie des titres respectée (`h2` pour les sections, `h3` dans les cartes et les blocs).
- Balise `canonical` sur toutes les pages (`canonical_url`).
- `<meta name="robots" content="noindex">` sur la page de recherche et sur la page mot de passe.
- Données structurées :
  - Produit : `{{ product | structured_data }}`.
  - Accueil : `Organization` et `WebSite`.
  - Fil d'Ariane : `BreadcrumbList`.
  - FAQ : `FAQPage`, construit à partir des blocs réellement affichés.
- Aucun avis ni note dans les données structurées (il n'y en a pas).
- Textes alternatifs : section 14 pour les produits ; réglage `image_alt` dans les sections d'image ; vide (`alt=""`) pour les images purement décoratives.
- URL propres : collection `noel`, handles des produits de la section 2.5.
- Ne pas personnaliser `robots.txt` (celui de Shopify convient).
- Le README propose trois articles de blog à écrire par Corentin, utiles pour Google :
  - « Comment illuminer sa façade pour Noël sans échelle »
  - « Projecteur de Noël : à quelle distance du mur le placer ? »
  - « 5 idées pour décorer sa porte d'entrée à Noël »

### 16.2 Performance
- Élément le plus important de l'accueil (LCP) : l'image d'attente de la vidéo du hero, en `loading="eager"` et `fetchpriority="high"`.
- Sur une fiche produit : le premier média, en `eager` ; tous les autres médias en `lazy`.
- Attribut `sizes` précis pour chaque image (exemple carte produit : `(min-width: 990px) 33vw, 50vw`).
- `width` et `height` sur toutes les images et vidéos pour éviter les décalages de mise en page.
- Espace réservé pour le compte à rebours, la barre collante et le bandeau d'annonce (pas de saut de contenu au chargement du JavaScript).
- Seule la police du texte est préchargée.
- Feuilles de style globales (`base.css` + `components.css`) : moins de 50 Ko au total ; feuilles de section chargées seulement par leur section.
- JavaScript total : moins de 40 Ko non compressés, tout en `defer`.
- Aucun script tiers dans le thème : les pixels publicitaires passent par les applications officielles (section 17).
- Vidéos : boucles courtes (6 à 12 secondes), `preload="metadata"`, image d'attente obligatoire.
- Le README conseille à Corentin des vidéos de moins de 10 Mo et des images de 2048 px de large au maximum.
- Pas de boucle `for` sur tous les produits de la boutique ; toujours une limite (`limit:`) ou une pagination.

### 16.3 Accessibilité (objectif WCAG 2.2 niveau AA)
- Navigation complète au clavier : menu, sous-menus, galerie, onglets, accordéons, tiroir panier, quantités, formulaires.
- Focus toujours visible (anneau doré, section 6.4) et jamais masqué par l'en-tête collant (`scroll-margin-top` sur les cibles d'ancre).
- Lien d'évitement vers `#MainContent` en premier élément focusable.
- Repères : `header`, `nav`, `main`, `footer` ; un seul `main`.
- Tiroirs et dialogues : `role="dialog"`, `aria-modal="true"`, titre relié, focus piégé, Échap, retour du focus.
- Zones dynamiques : panier et notifications en `aria-live="polite"` ; erreurs en `role="alert"`.
- Formulaires : libellé visible pour chaque champ, `autocomplete`, erreurs reliées par `aria-describedby`, champs obligatoires indiqués en texte (`general.required`).
- Cibles tactiles d'au moins 44 × 44 px pour tous les boutons et icônes cliquables.
- Vidéos en lecture automatique et bandeau défilant : bouton pause obligatoire.
- `prefers-reduced-motion` respecté partout (neige, apparitions, scintillement, carrousels, vidéos).
- Texte agrandi à 200 % sans perte d'information ni défilement horizontal.
- Langue de la page déclarée (`lang`).
- Contrastes de la section 6.2 respectés.
- Icônes décoratives en `aria-hidden="true"` ; boutons-icônes avec un libellé en `visually-hidden` ou `aria-label`.

---

## 17. Actions à faire dans l'admin Shopify (liste à recopier dans le README)

Claude Code ne fait aucune de ces actions : il les liste pour Corentin, dans cet ordre, avec des cases à cocher.

### 17.1 Produits
- [ ] Importer les 5 produits avec DSers depuis AliExpress.
- [ ] Choisir des vendeurs AliExpress bien notés (au moins 95 % d'avis positifs) et lire les avis avec photos de clients.
- [ ] Pour le pack : créer le produit « Pack Façade de Noël » et le relier dans DSers aux deux articles (projecteur et guirlande), si possible chez le même vendeur.
- [ ] Saisir les prix : 44,90 € (pack), 29,90 € (projecteur), 34,90 € (couronne), 24,90 € (guirlande), 17,90 € (sapin).
- [ ] Ne pas renseigner de prix barré, sauf s'il correspond à un vrai prix pratiqué auparavant.
- [ ] Remplacer les titres et descriptions importés par ceux du dossier `content/produits/`.
- [ ] Renseigner le titre et la méta-description SEO (section 14).
- [ ] Ajouter les photos et vidéos du vrai produit, avec leurs textes alternatifs.
- [ ] Désactiver le suivi des stocks (dropshipping).
- [ ] Choisir le modèle de page de chaque produit : `product.pack`, `product.projecteur`, `product.couronne`, `product.guirlande`, `product.sapin`.
- [ ] Ne publier le sapin en feutrine qu'après confirmation du marquage CE et de la norme EN 71 par le fournisseur.

### 17.2 Collection, menus et pages
- [ ] Créer la collection manuelle `noel` (« Décorations lumineuses de Noël ») avec les 5 produits, pack en premier (tri manuel).
- [ ] Menu `main-menu` : Accueil, Le pack Façade de Noël, Toutes les décorations, Livraison, Contact.
- [ ] Menu `footer` : Livraison, Retours et remboursements, Conditions générales de vente, Mentions légales, Confidentialité, Contact.
- [ ] Page « Livraison » (modèle `page`) avec le texte de l'annexe D.
- [ ] Page « Contact » (modèle `page.contact`) avec le texte de l'annexe D.
- [ ] Page « À propos » (facultative) avec le texte de l'annexe D.

### 17.3 Politiques et informations légales
- [ ] Coller les textes de `content/legal/` dans les politiques de la boutique : remboursement, confidentialité, conditions d'utilisation, expédition, coordonnées, mentions légales.
- [ ] Remplacer tous les [À COMPLÉTER].
- [ ] Faire relire ces textes avant l'ouverture.

### 17.4 Livraison
- [ ] Zone d'expédition « France et Belgique » avec un tarif « Livraison offerte » à 0 €.
- [ ] Supprimer ou désactiver les autres zones (aucune livraison hors France et Belgique).
- [ ] Vérifier que le délai affiché au paiement ne contredit pas les 7 à 12 jours.

### 17.5 Paiements et paiement final (checkout)
- [ ] Shopify Payments actif, compte bancaire vérifié, Bancontact activé pour la Belgique.
- [ ] Apple Pay et Google Pay activés si disponibles.
- [ ] Langue du paiement : français.
- [ ] Comptes clients : nouveaux comptes clients ou aucun compte (pas de création de compte obligatoire).
- [ ] Case d'inscription aux e-mails au paiement : décochée par défaut.

### 17.6 Marchés, taxes, conformité
- [ ] Marchés : France et Belgique, devise euro.
- [ ] Taxes : réglage selon le régime de TVA de Corentin [À VÉRIFIER avec un comptable : franchise belge, ventes à distance dans l'UE, importations de petits colis].
- [ ] Bannière de cookies Shopify activée pour les visiteurs européens.
- [ ] Numéro d'entreprise (BCE) obtenu avant de vendre.
- [ ] Obligations de reprise des appareils électriques et des piles pour la vente aux clients français et belges [À VÉRIFIER : filières REP/DEEE en France, Recupel et Bebat en Belgique].
- [ ] Informations de sécurité produit (fabricant, personne responsable dans l'UE, avertissements) demandées aux vendeurs AliExpress pour chaque produit.
- [ ] Photos du marquage CE de chaque produit électrique conservées.

### 17.7 Applications et publicité
- [ ] DSers : commandes passées chez le fournisseur dès le paiement, suivi transmis à Shopify.
- [ ] Application officielle TikTok et application Facebook & Instagram pour les pixels (elles respectent le consentement aux cookies).
- [ ] Aucun pixel collé à la main dans le thème.
- [ ] Publicités générées par IA : montrer l'effet réel du produit ; signaler les vidéos IA réalistes comme telles sur TikTok.
- [ ] Plus tard, uniquement avec de vrais avis : une application d'avis (bloc `@app` prévu sur la fiche produit).

### 17.8 Notifications
- [ ] Ajouter le texte de l'annexe C dans l'e-mail de confirmation de commande et dans l'e-mail d'expédition.

### 17.9 Mise en ligne
- [ ] Prévisualiser le thème « Noël en Façade v1 » sur téléphone et ordinateur.
- [ ] Passer une commande test (mode test de Shopify Payments), puis l'annuler.
- [ ] Publier le thème.
- [ ] Retirer la page mot de passe.
- [ ] Optionnel : relier un nom de domaine.

---

## 18. Tests à réaliser en phase 11

Pour chaque test : résultat attendu ; noter OK ou KO dans le rapport final, avec la correction apportée.
Tester avec `shopify theme dev` à 375 px (iPhone SE), 390 px, 768 px et 1280 px.
Si les produits n'existent pas encore dans la boutique de développement, le noter et tester avec les produits disponibles.

### 18.1 Contrôles automatiques
- [ ] `shopify theme check` : 0 erreur.
- [ ] Comptage des lignes (règle 3.4) : au moins 3000 lignes de code non vides.
- [ ] Aucun texte en dur hors traductions et réglages (recherche de mots français dans les fichiers `.liquid` hors `schema`).
- [ ] Aucun `img_url`, aucun `include`, aucun `jquery`, aucun `console.log` (`grep`).
- [ ] Aucun lien vers un CDN externe (`grep -E "https?://" assets layout sections snippets` hors `cdn.shopify.com` et liens de réglages).
- [ ] JSON valides : `config/*.json`, `locales/*.json`, `templates/*.json`, `sections/*-group.json`.

### 18.2 Accueil
- [ ] La vidéo du hero démarre muette, en boucle ; le bouton pause l'arrête.
- [ ] Avec « réduire les animations » activé dans le système : vidéo arrêtée, neige absente, contenu visible sans animation.
- [ ] Le titre du hero est le seul `h1` de la page.
- [ ] Le pack est visible après au plus un écran de défilement sur mobile.
- [ ] Le bouton d'achat du pack ajoute le pack au panier et ouvre le tiroir.
- [ ] Le compte à rebours affiche jours, heures et minutes cohérents avec le 8 décembre 2026 à 23 h 59 (heure de Bruxelles).
- [ ] En changeant `delivery_deadline_date` en une date passée : message « date limite passée » partout, sans compte à rebours.
- [ ] En mode `off_season` : aucun message lié à Noël sur tout le site.
- [ ] Les questions de la FAQ s'ouvrent au clic et au clavier (Entrée, Espace).

### 18.3 Fiche produit
- [ ] Le bon modèle s'applique à chaque produit (textes spécifiques visibles).
- [ ] Galerie mobile : défilement au doigt, points de pagination à jour.
- [ ] Galerie ordinateur : miniatures cliquables ; zoom ouvert et fermé avec Échap.
- [ ] Changement de variante (si le produit en a) : prix, image, bouton et URL mis à jour.
- [ ] Ajout au panier : bouton en chargement, tiroir ouvert, pastille mise à jour, annonce pour lecteur d'écran.
- [ ] Barre collante mobile : apparaît quand le bouton principal sort de l'écran, disparaît au pied de page, ajoute bien le produit.
- [ ] Dates de livraison estimées affichées en français, entre J+7 et J+12.
- [ ] Bloc « Encore mieux en pack » présent sur le projecteur et la guirlande, absent du pack.
- [ ] Les onglets d'informations fonctionnent au clavier (flèches) sur ordinateur et deviennent des accordéons sur mobile.
- [ ] Les mentions [À VÉRIFIER] sont visibles tant qu'elles n'ont pas été remplacées (normal en préproduction).
- [ ] Aucune réduction affichée si aucun prix barré n'est renseigné.

### 18.4 Panier
- [ ] Modifier une quantité dans le tiroir : sous-total et pastille à jour, sans rechargement.
- [ ] Retirer un article : ligne supprimée, panier vide géré.
- [ ] Suggestion de produit : visible, ajout fonctionnel, masquée si le produit est déjà dans le panier.
- [ ] Bouton « Passer commande » : redirige vers le paiement Shopify.
- [ ] Réglage `cart_type` sur `page` : l'ajout mène à la page panier, qui fonctionne aussi sans JavaScript.
- [ ] JavaScript désactivé dans le navigateur : ajout au panier et page panier fonctionnent avec des formulaires classiques.
- [ ] Rappel des 14 jours de rétractation visible.

### 18.5 Navigation et pages
- [ ] Menu mobile : ouverture, sous-menus, fermeture par Échap et par la superposition, focus rendu au bouton.
- [ ] En-tête collant avec ombre au défilement.
- [ ] Pied de page : politiques listées, icônes de paiement, réseaux sociaux uniquement si renseignés.
- [ ] Collection : tri fonctionnel, pagination, nombre de produits.
- [ ] Recherche : « guirlande » trouve la guirlande ; un mot absent affiche le message sans résultat.
- [ ] Contact : envoi d'un message de test ; erreurs affichées si e-mail vide.
- [ ] Newsletter : inscription de test, message de succès.
- [ ] Page 404 : `/page-qui-n-existe-pas` affiche la page introuvable et des produits.
- [ ] Page mot de passe : affichage correct, formulaire fonctionnel.

### 18.6 Accessibilité et qualité
- [ ] Parcours complet au clavier seul : accueil → fiche produit → ajout au panier → paiement.
- [ ] Lighthouse mobile sur l'accueil et une fiche produit : performance ≥ 80, accessibilité ≥ 95, bonnes pratiques ≥ 95, SEO ≥ 95 (noter les scores).
- [ ] Console du navigateur : aucune erreur JavaScript sur l'accueil, une fiche produit, la collection et le panier.
- [ ] Zoom du navigateur à 200 % : pas de contenu coupé.
- [ ] Largeur 320 px : pas de défilement horizontal.

---

## 19. Rapport final (à rendre à Corentin en fin de phase 12)

Format : message en français, court, structuré ainsi :
1. **Résultat** : le thème « Noël en Façade v1 » est envoyé en non publié (avec le lien d'aperçu fourni par Shopify CLI).
2. **Chiffres** : nombre de fichiers, nombre de lignes de code non vides, résultat de `shopify theme check`, scores Lighthouse.
3. **Tests** : liste des tests de la section 18 en KO ou non réalisés, avec la raison.
4. **Valeurs par défaut utilisées** : réponses manquantes de la phase 0.
5. **À faire par Corentin** : renvoi à la liste de la section 17 (copiée dans le README), et nombre de mentions [À COMPLÉTER] et [À VÉRIFIER] restantes.
6. **Points d'attention** : tout ce que tu n'as pas pu vérifier ou qui pourrait poser problème (conformité des produits, textes légaux à faire relire).
Pas de récapitulatif détaillé des étapes : Corentin a l'historique git.

---

## Annexe A — Squelettes de code de référence

Ces extraits fixent les conventions. Reprends-les, complète-les et adapte-les si `shopify theme check` le demande.
Ils ne remplacent pas la spécification : en cas de doute, la spécification des sections 6 à 13 l'emporte.

### A.1 `layout/theme.liquid` — début du `<head>`

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}" class="no-js">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="{{ settings.color_night }}">
    <link rel="canonical" href="{{ canonical_url }}">
    <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
    {%- if settings.favicon != blank -%}
      <link rel="icon" type="image/png" href="{{ settings.favicon | image_url: width: 32, height: 32 }}">
    {%- endif -%}
    <title>
      {{ page_title }}
      {%- if current_page != 1 %} – {{ 'pagination.page' | t: number: current_page }}{% endif -%}
      {%- unless page_title contains shop.name %} – {{ shop.name }}{% endunless -%}
    </title>
    {%- if template.name == 'search' -%}
      <meta name="robots" content="noindex">
    {%- endif -%}
    {% render 'meta-tags' %}
    <link rel="preload" as="font" href="{{ settings.type_body_font | font_url }}" type="font/woff2" crossorigin>
    {{ content_for_header }}
    {%- liquid
      assign body_font_bold = settings.type_body_font | font_modify: 'weight', 'bold'
    -%}
    <style>
      {{ settings.type_heading_font | font_face: font_display: 'swap' }}
      {{ settings.type_body_font | font_face: font_display: 'swap' }}
      {{ body_font_bold | font_face: font_display: 'swap' }}
      :root {
        --color-night: {{ settings.color_night }};
        --color-night-soft: {{ settings.color_night_soft }};
        --color-cream: {{ settings.color_cream }};
        --color-surface: {{ settings.color_surface }};
        --color-text-dark: {{ settings.color_text_dark }};
        --color-text-light: {{ settings.color_text_light }};
        --color-muted-dark: {{ settings.color_muted_dark }};
        --color-muted-light: {{ settings.color_muted_light }};
        --color-gold: {{ settings.color_gold }};
        --color-red: {{ settings.color_red }};
        --color-green: {{ settings.color_green }};
        --font-heading-family: {{ settings.type_heading_font.family }}, {{ settings.type_heading_font.fallback_families }};
        --font-heading-weight: {{ settings.type_heading_font.weight }};
        --font-body-family: {{ settings.type_body_font.family }}, {{ settings.type_body_font.fallback_families }};
        --font-body-weight: {{ settings.type_body_font.weight }};
        --heading-scale: {{ settings.heading_scale | divided_by: 100.0 }};
        --body-scale: {{ settings.body_scale | divided_by: 100.0 }};
      }
    </style>
    {{ 'base.css' | asset_url | stylesheet_tag }}
    {{ 'components.css' | asset_url | stylesheet_tag }}
    <script>document.documentElement.classList.replace('no-js', 'js');</script>
    <script>
      window.themeConfig = {
        routes: {
          cart_url: {{ routes.cart_url | json }},
          cart_add_url: {{ routes.cart_add_url | json }},
          cart_change_url: {{ routes.cart_change_url | json }},
          cart_update_url: {{ routes.cart_update_url | json }},
          root_url: {{ routes.root_url | json }},
          search_url: {{ routes.search_url | json }}
        },
        cartType: {{ settings.cart_type | json }},
        seasonMode: {{ settings.season_mode | json }},
        deadline: {
          date: {{ settings.delivery_deadline_date | json }},
          time: {{ settings.delivery_deadline_time | json }},
          christmas: {{ settings.christmas_date | json }}
        },
        delivery: {
          min: {{ settings.delivery_min_days | json }},
          max: {{ settings.delivery_max_days | json }},
          skipSundays: {{ settings.delivery_skip_sundays | json }}
        },
        moneyFormat: {{ shop.money_format | json }},
        locale: {{ request.locale.iso_code | json }},
        strings: {
          adding: {{ 'products.adding' | t | json }},
          added: {{ 'products.added' | t | json }},
          addToCart: {{ 'products.add_to_cart' | t | json }},
          soldOut: {{ 'products.sold_out' | t | json }},
          unavailable: {{ 'products.unavailable' | t | json }},
          cartError: {{ 'cart.error_generic' | t | json }},
          quantityError: {{ 'cart.error_quantity' | t | json }},
          itemAdded: {{ 'cart.item_added' | t: title: '[title]' | json }},
          days: {{ 'countdown.days' | t | json }},
          hours: {{ 'countdown.hours' | t | json }},
          minutes: {{ 'countdown.minutes' | t | json }},
          daysLong: {{ 'countdown.days_long' | t | json }},
          hoursLong: {{ 'countdown.hours_long' | t | json }},
          minutesLong: {{ 'countdown.minutes_long' | t | json }},
          deadlinePassed: {{ 'countdown.deadline_passed' | t | json }},
          estimate: {{ 'delivery.estimate' | t: start: '[start]', end: '[end]' | json }},
          afterChristmas: {{ 'delivery.after_christmas' | t | json }}
        }
      };
    </script>
    <script src="{{ 'theme.js' | asset_url }}" defer></script>
    <script src="{{ 'cart.js' | asset_url }}" defer></script>
    <script src="{{ 'delivery.js' | asset_url }}" defer></script>
    {%- if settings.snow_enabled -%}
      <script src="{{ 'snow.js' | asset_url }}" defer></script>
    {%- endif -%}
  </head>
```

Règle : les textes contenant des variables sont passés au JavaScript avec des jetons (`[start]`, `[end]`, `[title]`) que le JavaScript remplace.

### A.2 Section modèle complète : `sections/trust-badges.liquid`
Toutes les sections suivent cette forme (style scopé, conteneur racine, blocs, schéma complet en français, preset).

```liquid
{%- style -%}
  .section-{{ section.id }} {
    padding-top: {{ section.settings.padding_top }}px;
    padding-bottom: {{ section.settings.padding_bottom }}px;
  }
{%- endstyle -%}

<div class="section section-{{ section.id }} scheme-{{ section.settings.color_scheme }}">
  <div class="page-width">
    <ul class="trust-badges" role="list">
      {%- for block in section.blocks -%}
        <li class="trust-badges__item reveal" {{ block.shopify_attributes }}>
          {% render 'icon', icon: block.settings.icon, size: 32, class: 'trust-badges__icon' %}
          <p class="trust-badges__title">{{ block.settings.title | escape }}</p>
          {%- if block.settings.text != blank -%}
            <p class="trust-badges__text text-muted">{{ block.settings.text | escape }}</p>
          {%- endif -%}
        </li>
      {%- endfor -%}
    </ul>
  </div>
</div>

{% schema %}
{
  "name": "Garanties",
  "tag": "section",
  "class": "section-trust-badges",
  "max_blocks": 4,
  "settings": [
    {
      "type": "select",
      "id": "color_scheme",
      "label": "Couleurs",
      "options": [
        { "value": "night", "label": "Nuit" },
        { "value": "night-soft", "label": "Nuit douce" },
        { "value": "cream", "label": "Crème" },
        { "value": "white", "label": "Blanc" }
      ],
      "default": "cream"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Marge en haut",
      "min": 0,
      "max": 120,
      "step": 8,
      "unit": "px",
      "default": 48
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Marge en bas",
      "min": 0,
      "max": 120,
      "step": 8,
      "unit": "px",
      "default": 48
    }
  ],
  "blocks": [
    {
      "type": "badge",
      "name": "Garantie",
      "settings": [
        {
          "type": "select",
          "id": "icon",
          "label": "Icône",
          "options": [
            { "value": "truck", "label": "Camion" },
            { "value": "shield", "label": "Bouclier" },
            { "value": "return", "label": "Retour" },
            { "value": "mail", "label": "E-mail" },
            { "value": "clock", "label": "Horloge" },
            { "value": "gift", "label": "Cadeau" }
          ],
          "default": "truck"
        },
        {
          "type": "text",
          "id": "title",
          "label": "Titre",
          "default": "Livraison offerte"
        },
        {
          "type": "text",
          "id": "text",
          "label": "Texte",
          "default": "En France et en Belgique"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Garanties",
      "blocks": [
        { "type": "badge" },
        { "type": "badge" },
        { "type": "badge" }
      ]
    }
  ]
}
{% endschema %}
```

Contraintes des réglages `range` à respecter partout : au plus 101 crans entre `min` et `max`, et une valeur par défaut qui tombe sur un cran.

### A.3 Snippet `buy-buttons.liquid` — cœur du formulaire

```liquid
{%- liquid
  assign variant = product.selected_or_first_available_variant
  assign form_id = 'ProductForm-' | append: section_id
-%}
<div class="buy-buttons" {{ block.shopify_attributes }}>
  {%- form 'product', product, id: form_id, class: 'product-form', novalidate: 'novalidate', data-type: 'add-to-cart-form' -%}
    <input type="hidden" name="id" value="{{ variant.id }}" data-variant-id>
    <p class="product-form__error" role="alert" data-form-error></p>
    <button
      type="submit"
      name="add"
      class="button button--primary button--full"
      {% unless variant.available %}disabled{% endunless %}
    >
      {%- if variant.available -%}
        {{ 'products.add_to_cart' | t }}
      {%- else -%}
        {{ 'products.sold_out' | t }}
      {%- endif -%}
    </button>
    {%- if block.settings.show_dynamic_checkout -%}
      {{ form | payment_button }}
    {%- endif -%}
  {%- endform -%}

  {% render 'trust-row', layout: 'row' %}

  {%- if settings.show_payment_icons -%}
    <ul class="payment-icons" role="list">
      {%- for type in shop.enabled_payment_types -%}
        <li>{{ type | payment_type_svg_tag: class: 'payment-icons__icon' }}</li>
      {%- endfor -%}
    </ul>
  {%- endif -%}
</div>
```

Le bloc `quantity` est rendu hors du formulaire : son champ porte l'attribut `form="ProductForm-{{ section.id }}"` pour être envoyé avec lui.

### A.4 Pastille du panier : `sections/cart-icon-bubble.liquid` et `snippets/cart-icon-content.liquid`
La Section Rendering API ne peut pas viser directement une section placée dans un groupe (son identifiant change).
On utilise donc une petite section dédiée, demandée par son nom de fichier, dont le contenu est partagé avec l'en-tête par un snippet.

`snippets/cart-icon-content.liquid` :

```liquid
{% render 'icon', icon: 'cart', size: 24 %}
{%- if cart.item_count > 0 -%}
  <span class="cart-count" aria-hidden="true">{{ cart.item_count }}</span>
{%- endif -%}
<span class="visually-hidden">{{ 'header.cart_count' | t: count: cart.item_count }}</span>
```

`sections/cart-icon-bubble.liquid` :

```liquid
{% render 'cart-icon-content' %}

{% schema %}
{
  "name": "Pastille du panier"
}
{% endschema %}
```

Dans `header.liquid` :

```liquid
<a href="{{ routes.cart_url }}" id="cart-icon-bubble" class="header__icon" data-cart-trigger>
  {% render 'cart-icon-content' %}
</a>
```

### A.5 `assets/cart.js` — tiroir et ajout au panier

```js
const DRAWER_ANIMATION_MS = 250;

class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });
    this.addEventListener('click', (event) => {
      if (event.target.closest('[data-drawer-close]')) this.close();
    });
  }

  open(trigger) {
    this.trigger = trigger || document.activeElement;
    this.hidden = false;
    requestAnimationFrame(() => this.classList.add('is-open'));
    window.Theme.lockScroll();
    window.Theme.trapFocus(this, this.querySelector('#CartDrawerTitle'));
  }

  close() {
    if (this.hidden) return;
    this.classList.remove('is-open');
    window.Theme.unlockScroll();
    window.Theme.removeTrapFocus(this.trigger);
    const delay = window.Theme.prefersReducedMotion() ? 0 : DRAWER_ANIMATION_MS;
    window.setTimeout(() => { this.hidden = true; }, delay);
  }

  renderSections(sections = {}) {
    const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
    if (sections['cart-drawer']) {
      const fresh = parse(sections['cart-drawer']).querySelector('[data-drawer-inner]');
      const current = this.querySelector('[data-drawer-inner]');
      if (fresh && current) current.replaceWith(fresh);
    }
    if (sections['cart-icon-bubble']) {
      const bubble = document.getElementById('cart-icon-bubble');
      const fresh = parse(sections['cart-icon-bubble']).querySelector('.shopify-section');
      if (bubble && fresh) bubble.innerHTML = fresh.innerHTML;
    }
  }
}

if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);

async function addToCart(form, button) {
  const config = window.themeConfig;
  const drawer = document.querySelector('cart-drawer');
  const errorBox = form.querySelector('[data-form-error]');
  const formData = new FormData(form);
  formData.append('sections', drawer ? 'cart-drawer,cart-icon-bubble' : 'cart-icon-bubble');
  formData.append('sections_url', window.location.pathname);

  if (button) {
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
  }
  if (errorBox) errorBox.textContent = '';

  try {
    const response = await fetch(`${config.routes.cart_add_url}.js`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: formData
    });
    const data = await response.json();
    if (!response.ok || data.status) {
      throw new Error(data.description || data.message || config.strings.cartError);
    }
    if (config.cartType === 'page' || !drawer) {
      window.location.href = config.routes.cart_url;
      return;
    }
    drawer.renderSections(data.sections);
    drawer.open(button);
    window.Theme.announce(config.strings.itemAdded.replace('[title]', data.product_title));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { source: 'add', item: data } }));
  } catch (error) {
    if (errorBox) errorBox.textContent = error.message || config.strings.cartError;
  } finally {
    if (button) {
      button.removeAttribute('aria-busy');
      button.disabled = false;
    }
  }
}

document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-type="add-to-cart-form"]');
  if (!form) return;
  event.preventDefault();
  addToCart(form, event.submitter || form.querySelector('[name="add"]'));
});
```

À ajouter dans le même fichier :
- `changeLine(line, quantity)` : `fetch(config.routes.cart_change_url + '.js')`, corps JSON `{ line, quantity, sections, sections_url }`, avec `sections` = `cart-drawer`, `cart-icon-bubble` et, sur la page panier, l'identifiant `data-section-id` de la section `main-cart`.
- Écoute des évènements `change` des `quantity-input` portant `data-index`, avec debounce de 300 ms.
- Écoute des clics sur `[data-cart-remove]` (quantité 0).
- Écoute des clics sur `[data-cart-trigger]` : `preventDefault` puis `drawer.open(trigger)` si le tiroir existe.
- `window.Theme.announce(message)` est défini dans `theme.js` : il écrit dans la zone `role="status"`.

### A.6 `assets/delivery.js` — dates à l'heure de Bruxelles

```js
const TIME_ZONE = 'Europe/Brussels';

function partsInTimeZone(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])
  );
}

function zonedTimeToDate(year, month, day, hour, minute) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const p = partsInTimeZone(new Date(guess));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess - (asUtc - guess));
}

function deadlineDate() {
  const { date, time } = (window.themeConfig && window.themeConfig.deadline) || {};
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
  const t = /^(\d{2}):(\d{2})$/.exec(time || '23:59');
  if (!d || !t) return null;
  return zonedTimeToDate(Number(d[1]), Number(d[2]), Number(d[3]), Number(t[1]), Number(t[2]));
}

function addDays(start, days, skipSundays) {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (skipSundays && result.getDay() === 0) continue;
    added += 1;
  }
  return result;
}

const shortDate = new Intl.DateTimeFormat('fr-BE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: TIME_ZONE
});
```

À compléter dans le même fichier :
- `<delivery-estimate>` utilise `addDays(new Date(), min, skipSundays)` et `addDays(new Date(), max, skipSundays)`, puis `strings.estimate.replace('[start]', ...).replace('[end]', ...)`.
- `<deadline-countdown>` calcule `deadlineDate() - Date.now()`, découpe en jours, heures et minutes, et s'arrête à zéro.
- Si `deadlineDate()` renvoie `null` (date mal saisie), les deux composants gardent leur texte serveur.

### A.7 Snippet `deadline-countdown.liquid` — rendu serveur

```liquid
{%- if settings.season_mode == 'christmas' and settings.show_countdown -%}
  {%- liquid
    assign months = 'janvier,février,mars,avril,mai,juin,juillet,août,septembre,octobre,novembre,décembre' | split: ','
    assign month_index = settings.delivery_deadline_date | date: '%m' | plus: 0 | minus: 1
    assign day = settings.delivery_deadline_date | date: '%e' | strip
    if day == '1'
      assign day = '1er'
    endif
    assign deadline_text = day | append: ' ' | append: months[month_index]
    assign deadline_ts = settings.delivery_deadline_date | append: ' ' | append: settings.delivery_deadline_time | date: '%s' | plus: 0
    assign now_ts = 'now' | date: '%s' | plus: 0
  -%}
  <deadline-countdown class="countdown countdown--{{ style | default: 'inline' }}">
    {%- if now_ts < deadline_ts -%}
      <p class="countdown__intro">{{ 'countdown.intro' | t: date: deadline_text }}</p>
      <div class="countdown__digits" aria-hidden="true" data-countdown-digits></div>
      <p class="visually-hidden" data-countdown-summary></p>
    {%- else -%}
      <p class="countdown__passed">{{ 'countdown.deadline_passed' | t }}</p>
    {%- endif -%}
  </deadline-countdown>
{%- endif -%}
```

Remarques :
- Shopify met les pages en cache : l'heure côté serveur peut avoir quelques minutes de retard. Le JavaScript fait foi et corrige l'affichage.
- Le fuseau horaire de la boutique (Paramètres > Général) doit être réglé sur Bruxelles : à mettre dans la liste du README.

### A.8 Variables et classes de schéma de couleur (`base.css`)

```css
.scheme-night {
  --bg: var(--color-night);
  --fg: var(--color-text-light);
  --fg-muted: var(--color-muted-light);
  --link: var(--color-gold);
  --border: rgba(255, 255, 255, 0.12);
  --card-bg: var(--color-night-soft);
}

.scheme-night-soft {
  --bg: var(--color-night-soft);
  --fg: var(--color-text-light);
  --fg-muted: var(--color-muted-light);
  --link: var(--color-gold);
  --border: rgba(255, 255, 255, 0.12);
  --card-bg: var(--color-night);
}

.scheme-cream {
  --bg: var(--color-cream);
  --fg: var(--color-text-dark);
  --fg-muted: var(--color-muted-dark);
  --link: var(--color-red);
  --border: rgba(27, 36, 48, 0.12);
  --card-bg: var(--color-surface);
}

.scheme-white {
  --bg: var(--color-surface);
  --fg: var(--color-text-dark);
  --fg-muted: var(--color-muted-dark);
  --link: var(--color-red);
  --border: rgba(27, 36, 48, 0.12);
  --card-bg: var(--color-cream);
}

[class*='scheme-'] {
  background-color: var(--bg);
  color: var(--fg);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .reveal {
    opacity: 1;
    transform: none;
  }
}
```

### A.9 Rappel sur la pastille du panier
- `sections/cart-icon-bubble.liquid` et `snippets/cart-icon-content.liquid` figurent dans l'arborescence de la section 5.
- Ils font partie du thème et comptent dans les 3000 lignes.
- La section `cart-icon-bubble` n'a pas de `presets` : elle n'apparaît pas dans l'éditeur, elle sert uniquement à la Section Rendering API.

---

## Annexe B — Contenu attendu du `README.md`

Le README est écrit pour Corentin, en français simple, avec ces titres :
1. **À quoi sert ce dossier** — un thème Shopify sur mesure pour la boutique de Noël.
2. **Les commandes utiles** :
   - `shopify theme dev --store <adresse>` : aperçu en direct pendant les modifications.
   - `shopify theme check` : vérification du code.
   - `shopify theme push --unpublished --store <adresse>` : envoi d'une nouvelle copie non publiée.
   - `shopify theme list --store <adresse>` : liste des thèmes de la boutique.
3. **Ce qu'il faut faire dans l'admin** — la liste complète de la section 17, avec les cases à cocher.
4. **Modifier les textes** — où changer chaque texte : éditeur de thème (sections et blocs), fiches produits (descriptions), politiques (textes légaux), traductions (`locales/fr.default.json`).
5. **La date limite de Noël** — où la changer (Paramètres du thème > Saison de Noël) et ce qui se passe après.
6. **Les règles à ne pas casser** :
   - Pas de faux avis, pas de faux stocks, pas de faux comptes à rebours.
   - Pas de prix barré inventé : une réduction se calcule sur le prix le plus bas des 30 jours précédents.
   - Délai de livraison réel affiché (7 à 12 jours).
   - Pubs IA fidèles au vrai produit.
7. **Les mentions à compléter** — commande pour les retrouver : `grep -rn "À COMPLÉTER\|À VÉRIFIER" content templates sections`.
8. **En cas de problème** — renvoi vers l'annexe E de `PROMPT.md`.
9. **Après Noël** — renvoi vers l'annexe F de `PROMPT.md`.

---

## Annexe C — Textes pour les e-mails de notification Shopify

À coller par Corentin dans Paramètres > Notifications, sous le message d'introduction de chaque e-mail.

Confirmation de commande :
> Merci pour votre commande !
> Votre colis est préparé par notre fournisseur et vous sera livré en 7 à 12 jours.
> Vous recevrez un e-mail avec votre numéro de suivi dès l'expédition.
> Une question ? Répondez simplement à cet e-mail, nous vous répondons sous 24 h ouvrées.

Confirmation d'expédition :
> Bonne nouvelle, votre colis est en route !
> Le suivi peut mettre 24 à 48 h avant d'afficher les premières étapes : c'est normal.
> Si votre commande contient plusieurs produits, ils peuvent arriver dans des colis séparés.
> Une question ? Répondez simplement à cet e-mail.

Mise à jour d'expédition (retard) :
> Votre colis prend un peu plus de temps que prévu.
> Nous suivons la livraison de près et revenons vers vous si nécessaire.
> Vous pouvez à tout moment nous écrire en répondant à cet e-mail.

---

## Annexe D — Textes des pages à créer dans l'admin

### D.1 Page « Livraison » (modèle `page`)
- Titre : « Livraison »
- Texte :
  - « La livraison est offerte en France et en Belgique. »
  - « Vos décorations arrivent en 7 à 12 jours après votre commande. »
  - « Nos produits sont expédiés depuis les entrepôts de nos fournisseurs, situés pour la plupart hors de l'Union européenne. Les droits et taxes d'importation sont réglés par nos soins : vous n'avez rien à payer à la livraison. [À VÉRIFIER] »
  - « Dès l'expédition, vous recevez un numéro de suivi par e-mail. »
  - « Pour recevoir votre commande avant Noël, commandez au plus tard le 8 décembre. »
  - « Si votre commande contient plusieurs produits, ils peuvent arriver dans des colis séparés. »
  - « Un souci avec votre livraison ? Écrivez-nous depuis la page Contact. »

### D.2 Page « Contact » (modèle `page.contact`)
- Titre : « Contact »
- Texte : « Une question sur un produit, une commande ou une livraison ? Écrivez-nous avec le formulaire ci-dessous. Nous répondons sous 24 h ouvrées. Pour une commande, pensez à indiquer son numéro. »

### D.3 Page « À propos » (modèle `page`, facultative)
- Titre : « Qui sommes-nous ? »
- Texte :
  - « Noël en Façade est une petite boutique en ligne basée en Belgique. »
  - « Nous sélectionnons des décorations lumineuses simples à installer, pour que chacun puisse illuminer sa maison sans échelle ni électricien. »
  - « Nos produits sont fabriqués par des fournisseurs partenaires et expédiés directement chez vous. »
  - « Une question ? Nous sommes joignables par e-mail, et nous répondons sous 24 h ouvrées. »
- Pas de fausse histoire, pas de « atelier », pas de « fabrication artisanale ».

---

## Annexe E — Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| `shopify theme dev` demande sans cesse de se connecter | Session expirée ou mauvais compte | `shopify auth logout`, puis relancer la commande et se connecter avec le compte propriétaire |
| `theme check` signale une police inconnue | Identifiant absent de la bibliothèque Shopify | Choisir une autre police de la bibliothèque et mettre à jour le défaut du réglage |
| Une section d'accueil est vide dans l'aperçu | Le produit ou la collection du handle n'existe pas encore | Importer les produits, ou choisir le produit dans l'éditeur |
| Le tiroir panier ne s'ouvre pas | `cart_type` réglé sur `page`, ou erreur JavaScript | Vérifier le réglage, puis la console du navigateur |
| La pastille du panier ne se met pas à jour | Section `cart-icon-bubble` absente ou mal nommée | Vérifier le nom du fichier et la liste `sections` envoyée par `cart.js` |
| Le compte à rebours n'apparaît pas | Mode hors saison, réglage désactivé, ou date mal saisie | Vérifier `season_mode`, `show_countdown` et le format AAAA-MM-JJ |
| Les dates de livraison sont décalées d'un jour | Fuseau horaire de la boutique incorrect | Régler le fuseau sur Bruxelles dans les paramètres généraux |
| La vidéo ne démarre pas sur iPhone | Attributs manquants | Vérifier `muted`, `playsinline` et `autoplay` dans `video_tag` |
| Le push échoue : trop de thèmes | Bibliothèque de thèmes pleine | Corentin supprime lui-même d'anciens thèmes non publiés dans l'admin |
| Un texte reste en anglais | Clé de traduction absente | Ajouter la clé dans `locales/fr.default.json` |
| Le prix ne change pas avec la variante | Évènement `variant:change` non écouté | Vérifier `product.js` et l'attribut `data-price` du snippet `price` |

---

## Annexe F — Après la date limite et après Noël

- Du 9 au 24 décembre : rien à faire, le thème affiche automatiquement « livraison après Noël ».
- Le 26 décembre : passer `season_mode` sur `off_season`, changer le titre du hero (par exemple « Prolongez la magie de l'hiver ») et retirer le bloc compte à rebours du bandeau d'annonce.
- Janvier : garder les inscrits à la newsletter ; préparer une relance pour la saison suivante.
- Saison suivante : remettre `season_mode` sur `christmas`, mettre à jour `delivery_deadline_date` et `christmas_date`, vérifier les fournisseurs et les prix.
- Le thème reste réutilisable pour un autre produit : il suffit de changer les textes, les couleurs et les produits.

---


## Annexe G — `assets/theme.js` : utilitaires et composants de base

```js
(() => {
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'summary',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let trapHandler = null;

  const Theme = {
    debounce(fn, wait = 300) {
      let timer;
      return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), wait);
      };
    },

    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    trapFocus(container, elementToFocus = container) {
      Theme.removeTrapFocus();
      const elements = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      trapHandler = (event) => {
        if (event.key !== 'Tab' || !first) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', trapHandler);
      if (elementToFocus) {
        if (!elementToFocus.matches(FOCUSABLE)) elementToFocus.setAttribute('tabindex', '-1');
        elementToFocus.focus();
      }
    },

    removeTrapFocus(elementToFocus = null) {
      if (trapHandler) document.removeEventListener('keydown', trapHandler);
      trapHandler = null;
      if (elementToFocus) elementToFocus.focus();
    },

    lockScroll() {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
      document.body.classList.add('is-locked');
    },

    unlockScroll() {
      document.body.classList.remove('is-locked');
      document.body.style.paddingRight = '';
    },

    formatMoney(cents, format = window.themeConfig.moneyFormat) {
      const value = Number(cents) / 100;
      const delimit = (decimals, thousands, decimal) => {
        const [integer, fraction] = value.toFixed(decimals).split('.');
        const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
        return fraction ? `${grouped}${decimal}${fraction}` : grouped;
      };
      return format.replace(/\{\{\s*(\w+)\s*\}\}/, (match, key) => {
        switch (key) {
          case 'amount': return delimit(2, ',', '.');
          case 'amount_no_decimals': return delimit(0, ',', '.');
          case 'amount_with_comma_separator': return delimit(2, '.', ',');
          case 'amount_no_decimals_with_comma_separator': return delimit(0, '.', ',');
          case 'amount_with_space_separator': return delimit(2, ' ', ',');
          case 'amount_with_period_and_space_separator': return delimit(2, ' ', '.');
          default: return match;
        }
      });
    },

    announce(message) {
      const region = document.getElementById('ThemeAnnouncer');
      if (!region) return;
      region.textContent = '';
      window.setTimeout(() => { region.textContent = message; }, 50);
    },

    showToast(message) {
      const toast = document.querySelector('.toast');
      if (!toast) return;
      toast.textContent = message;
      toast.hidden = false;
      window.clearTimeout(Theme.toastTimer);
      Theme.toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4000);
    }
  };

  window.Theme = Theme;

  class QuantityInput extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input');
      this.querySelectorAll('button[name="plus"], button[name="minus"]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          const previous = this.input.value;
          if (button.name === 'plus') this.input.stepUp();
          else this.input.stepDown();
          if (previous !== this.input.value) {
            this.input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    }
  }

  class MenuDrawer extends HTMLElement {
    connectedCallback() {
      this.toggle = document.querySelector(`[aria-controls="${this.id}"]`);
      if (!this.toggle) return;
      this.toggle.addEventListener('click', () => (this.hidden ? this.open() : this.close()));
      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.close();
      });
      this.querySelectorAll('[data-menu-close]').forEach((element) => {
        element.addEventListener('click', () => this.close());
      });
    }

    open() {
      this.hidden = false;
      this.toggle.setAttribute('aria-expanded', 'true');
      Theme.lockScroll();
      Theme.trapFocus(this, this.querySelector('a, button'));
    }

    close() {
      if (this.hidden) return;
      this.hidden = true;
      this.toggle.setAttribute('aria-expanded', 'false');
      Theme.unlockScroll();
      Theme.removeTrapFocus(this.toggle);
    }
  }

  if (!customElements.get('quantity-input')) customElements.define('quantity-input', QuantityInput);
  if (!customElements.get('menu-drawer')) customElements.define('menu-drawer', MenuDrawer);

  function initReveal(root = document) {
    const items = root.querySelectorAll('.reveal:not(.is-visible)');
    if (!items.length) return;
    if (Theme.prefersReducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach((item) => observer.observe(item));
  }

  function initHeaderShadow() {
    const header = document.querySelector('.header');
    if (!header) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initHeaderShadow();
  });

  document.addEventListener('shopify:section:load', (event) => initReveal(event.target));
})();
```

À compléter dans le même fichier : pause des vidéos décoratives, rotation du bandeau d'annonces, `<product-tabs>`, tri automatique des collections, bouton de partage (section 13.1).
`layout/theme.liquid` doit contenir, juste après l'ouverture du `<body>` : `<div id="ThemeAnnouncer" class="visually-hidden" role="status" aria-live="polite"></div>`.
L'évènement `shopify:section:load` relance les comportements quand Corentin modifie une section dans l'éditeur de thème.

---

## Annexe H — `assets/product.js` : sélection de variante

```js
class VariantPicker extends HTMLElement {
  connectedCallback() {
    const data = this.querySelector('[data-variants]');
    if (!data) return;
    this.variants = JSON.parse(data.textContent);
    this.sectionId = this.dataset.section;
    this.addEventListener('change', () => this.onOptionChange());
  }

  selectedOptions() {
    return Array.from(this.querySelectorAll('fieldset')).map((fieldset) => {
      const checked = fieldset.querySelector('input:checked');
      return checked ? checked.value : null;
    });
  }

  onOptionChange() {
    const options = this.selectedOptions();
    const variant = this.variants.find((candidate) =>
      candidate.options.every((value, index) => value === options[index])
    );
    const form = document.getElementById(`ProductForm-${this.sectionId}`);
    const button = form ? form.querySelector('[name="add"]') : null;
    const strings = window.themeConfig.strings;

    if (!variant) {
      if (button) {
        button.disabled = true;
        button.textContent = strings.unavailable;
      }
      return;
    }

    if (form) form.querySelector('[data-variant-id]').value = variant.id;
    if (button) {
      button.disabled = !variant.available;
      button.textContent = variant.available ? strings.addToCart : strings.soldOut;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url.toString());

    this.updatePrice(variant);
    document.dispatchEvent(new CustomEvent('variant:change', {
      detail: { sectionId: this.sectionId, variant }
    }));
  }

  updatePrice(variant) {
    const section = document.getElementById(`MainProduct-${this.sectionId}`);
    if (!section) return;
    section.querySelectorAll('[data-price-current]').forEach((element) => {
      element.textContent = window.Theme.formatMoney(variant.price);
    });
    section.querySelectorAll('[data-price-compare]').forEach((element) => {
      const hasCompare = variant.compare_at_price && variant.compare_at_price > variant.price;
      element.hidden = !hasCompare;
      if (hasCompare) element.textContent = window.Theme.formatMoney(variant.compare_at_price);
    });
  }
}

if (!customElements.get('variant-picker')) customElements.define('variant-picker', VariantPicker);
```

Conventions liées :
- La section `main-product` porte `id="MainProduct-{{ section.id }}"`.
- Le snippet `price` marque le prix courant avec `data-price-current` et le prix barré avec `data-price-compare`.
- `window.themeConfig.strings` contient `addToCart`, `soldOut` et `unavailable` (annexe A.1).
- `<product-gallery>` et `<sticky-atc>` écoutent `variant:change` et filtrent sur `detail.sectionId`.

---

## Annexe I — CSS de référence : tiroir, fiche produit, barre collante

```css
/* Tiroir (components.css) */
.drawer {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
}

.drawer[hidden] {
  display: none;
}

.drawer .overlay {
  position: absolute;
  inset: 0;
  background: var(--color-overlay);
  opacity: 0;
  transition: opacity 250ms ease;
}

.drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  width: min(420px, 100vw);
  height: 100%;
  background: var(--bg);
  color: var(--fg);
  transform: translateX(100%);
  transition: transform 250ms ease;
}

.drawer.is-open .overlay {
  opacity: 1;
}

.drawer.is-open .drawer__panel {
  transform: translateX(0);
}

.drawer__body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-4);
}

.drawer__footer {
  border-top: 1px solid var(--border);
  padding: var(--space-4) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
}

/* Fiche produit (section-product.css) */
.product {
  display: grid;
  gap: var(--space-6);
}

.product__media-list {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.product__media-list::-webkit-scrollbar {
  display: none;
}

.product__media-item {
  flex: 0 0 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--card-bg);
  scroll-snap-align: start;
}

.product__media-item img,
.product__media-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (min-width: 990px) {
  .product {
    grid-template-columns: 55fr 45fr;
    align-items: start;
    gap: var(--space-8);
  }

  .product__info {
    position: sticky;
    top: calc(var(--header-height, 76px) + var(--space-5));
  }
}

/* Barre d'achat collante (section-product.css) */
.sticky-atc {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--z-sticky-atc);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom));
  background: var(--color-night);
  color: var(--color-text-light);
  box-shadow: 0 -8px 24px rgba(14, 26, 43, 0.25);
  transform: translateY(110%);
  transition: transform 200ms ease;
}

.sticky-atc.is-visible {
  transform: translateY(0);
}

body.has-sticky-atc {
  padding-bottom: 80px;
}

@media (min-width: 990px) {
  .sticky-atc {
    display: none;
  }
}
```

---

## Annexe J — Extrait de `config/settings_schema.json` : groupe « Saison de Noël »

```json
{
  "name": "Saison de Noël",
  "settings": [
    {
      "type": "select",
      "id": "season_mode",
      "label": "Mode",
      "options": [
        { "value": "christmas", "label": "Noël : compte à rebours et livraison avant Noël" },
        { "value": "off_season", "label": "Hors saison : aucun message lié à Noël" }
      ],
      "default": "christmas"
    },
    {
      "type": "text",
      "id": "delivery_deadline_date",
      "label": "Date limite pour recevoir avant Noël",
      "info": "Format AAAA-MM-JJ, par exemple 2026-12-08.",
      "default": "2026-12-08"
    },
    {
      "type": "text",
      "id": "delivery_deadline_time",
      "label": "Heure limite (heure de Bruxelles)",
      "info": "Format HH:MM, par exemple 23:59.",
      "default": "23:59"
    },
    {
      "type": "text",
      "id": "christmas_date",
      "label": "Date de Noël utilisée pour les calculs",
      "default": "2026-12-24"
    },
    {
      "type": "checkbox",
      "id": "show_countdown",
      "label": "Afficher le compte à rebours",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "snow_enabled",
      "label": "Neige décorative animée",
      "default": true
    },
    {
      "type": "range",
      "id": "snow_density",
      "label": "Nombre de flocons",
      "min": 10,
      "max": 60,
      "step": 5,
      "default": 25
    },
    {
      "type": "paragraph",
      "content": "Après la date limite, le site affiche automatiquement un message de livraison après Noël."
    }
  ]
}
```

---

## Annexe K — Modèle produit complet : `templates/product.projecteur.json`

Les quatre autres modèles produits suivent exactement cette forme, avec leurs propres textes (section 14).

```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "blocks": {
        "title": { "type": "title", "settings": {} },
        "subtitle": {
          "type": "subtitle",
          "settings": { "text": "16 motifs de Noël projetés sur votre mur, en un seul branchement." }
        },
        "price": { "type": "price", "settings": {} },
        "highlights": {
          "type": "highlights",
          "settings": {
            "highlight_1": "16 motifs interchangeables [À VÉRIFIER : liste exacte]",
            "highlight_2": "Projection de 1 à 5 mètres du mur",
            "highlight_3": "Éclairage LED, faible consommation",
            "highlight_4": "Intérieur, et extérieur abrité [À VÉRIFIER : indice IP]"
          }
        },
        "buy_buttons": {
          "type": "buy_buttons",
          "settings": { "show_dynamic_checkout": false }
        },
        "delivery": { "type": "delivery", "settings": {} },
        "countdown": { "type": "countdown", "settings": {} },
        "pack_cta": {
          "type": "pack_cta",
          "settings": {
            "pack_product": "pack-facade-de-noel",
            "text": "Ajoutez la guirlande neige : découvrez le pack Façade de Noël."
          }
        },
        "trust": { "type": "trust", "settings": {} },
        "shipping": {
          "type": "collapsible",
          "settings": {
            "heading": "Livraison et retours",
            "icon": "truck",
            "content": "<p>Livraison offerte en France et en Belgique.</p><p>Délai : 7 à 12 jours après la commande. Numéro de suivi envoyé par e-mail.</p><p>Pour recevoir avant Noël, commandez au plus tard le 8 décembre.</p><p>14 jours pour changer d'avis après réception, selon notre politique de remboursement.</p>"
          }
        }
      },
      "block_order": ["title", "subtitle", "price", "highlights", "buy_buttons", "delivery", "countdown", "pack_cta", "trust", "shipping"],
      "settings": {
        "gallery_layout": "thumbnails",
        "enable_zoom": true,
        "enable_video_looping": true,
        "show_breadcrumbs": true,
        "color_scheme": "white",
        "padding_top": 24,
        "padding_bottom": 48
      }
    },
    "details": {
      "type": "product-details",
      "blocks": {
        "description": {
          "type": "tab",
          "settings": { "title": "Description", "icon": "bulb", "use_description": true }
        },
        "contents": {
          "type": "tab",
          "settings": {
            "title": "Contenu du colis",
            "icon": "gift",
            "use_description": false,
            "content": "<p>1 projecteur LED.</p><p>1 alimentation [À VÉRIFIER : adaptateur avec prise européenne].</p><p>Motifs selon le modèle [À VÉRIFIER].</p><p>1 piquet de sol [À VÉRIFIER : inclus ou non].</p>"
          }
        },
        "specs": {
          "type": "tab",
          "settings": {
            "title": "Caractéristiques",
            "icon": "ruler",
            "use_description": false,
            "content": "<p>Source lumineuse : LED.</p><p>Nombre de motifs : 16.</p><p>Distance de projection : 1 à 5 m.</p><p>Alimentation : secteur via adaptateur [À VÉRIFIER].</p><p>Boîtier : plastique.</p><p>Indice de protection : [À VÉRIFIER].</p><p>Longueur du câble : [À VÉRIFIER].</p>"
          }
        },
        "safety": {
          "type": "tab",
          "settings": {
            "title": "Sécurité et utilisation",
            "icon": "warning",
            "use_description": false,
            "content": "<p>Ne fixez pas directement la source lumineuse.</p><p>N'utilisez que l'alimentation fournie.</p><p>Dehors, branchez-le uniquement sur une prise extérieure protégée, avec une rallonge prévue pour l'extérieur.</p><p>Débranchez-le en cas d'orage et pendant le rangement.</p><p>Ceci n'est pas un jouet.</p><p>Fabricant : [À COMPLÉTER]. Personne responsable dans l'UE : [À COMPLÉTER].</p>"
          }
        }
      },
      "block_order": ["description", "contents", "specs", "safety"],
      "settings": {
        "layout": "tabs",
        "color_scheme": "cream",
        "padding_top": 48,
        "padding_bottom": 48
      }
    },
    "steps": {
      "type": "how-it-works",
      "blocks": {
        "step-1": { "type": "step", "settings": { "icon": "plug", "title": "Branchez", "text": "Une prise suffit. Pas d'outil, pas d'installation électrique." } },
        "step-2": { "type": "step", "settings": { "icon": "ruler", "title": "Orientez", "text": "Posez le projecteur face à la façade, à quelques mètres du mur." } },
        "step-3": { "type": "step", "settings": { "icon": "bulb", "title": "Allumez", "text": "La façade s'illumine dès la tombée de la nuit." } }
      },
      "block_order": ["step-1", "step-2", "step-3"],
      "settings": { "heading": "Installé en 3 étapes", "color_scheme": "night", "padding_top": 64, "padding_bottom": 64 }
    },
    "faq": {
      "type": "faq",
      "blocks": {
        "q1": { "type": "question", "settings": { "question": "Le projecteur fonctionne-t-il dehors ?", "answer": "<p>Oui, s'il est protégé de la pluie directe et branché sur une prise extérieure protégée. [À VÉRIFIER : indice IP]</p>" } },
        "q2": { "type": "question", "settings": { "question": "Quelle taille fait la projection ?", "answer": "<p>Elle dépend de la distance au mur : plus loin, les motifs sont plus grands ; plus près, ils sont plus lumineux.</p>" } },
        "q3": { "type": "question", "settings": { "question": "Faut-il des piles ?", "answer": "<p>Non, il fonctionne sur secteur.</p>" } },
        "q4": { "type": "question", "settings": { "question": "Quand vais-je le recevoir ?", "answer": "<p>En 7 à 12 jours. Commandez au plus tard le 8 décembre pour le recevoir avant Noël.</p>" } }
      },
      "block_order": ["q1", "q2", "q3", "q4"],
      "settings": { "heading": "Questions fréquentes", "open_first": false, "color_scheme": "white", "padding_top": 64, "padding_bottom": 64 }
    },
    "trust": {
      "type": "trust-badges",
      "blocks": {
        "shipping": { "type": "badge", "settings": { "icon": "truck", "title": "Livraison offerte", "text": "En France et en Belgique" } },
        "payment": { "type": "badge", "settings": { "icon": "shield", "title": "Paiement sécurisé", "text": "Carte, Bancontact, Apple Pay" } },
        "returns": { "type": "badge", "settings": { "icon": "return", "title": "14 jours pour changer d'avis", "text": "Rétractation selon nos conditions" } },
        "support": { "type": "badge", "settings": { "icon": "mail", "title": "Service client", "text": "Réponse sous 24 h ouvrées" } }
      },
      "block_order": ["shipping", "payment", "returns", "support"],
      "settings": { "color_scheme": "cream", "padding_top": 48, "padding_bottom": 48 }
    },
    "upsell": {
      "type": "product-upsell",
      "settings": {
        "heading": "Complétez votre décoration",
        "products": ["guirlande-neige-qui-tombe", "couronne-de-noel-lumineuse"],
        "color_scheme": "white",
        "padding_top": 48,
        "padding_bottom": 64
      }
    }
  },
  "order": ["main", "details", "steps", "faq", "trust", "upsell"]
}
```

Remarques sur ce modèle :
- Les blocs de `trust-badges` sont repris de l'accueil (12.1) : une section sans blocs dans un modèle JSON n'affiche rien.
- La marge `padding_top` de 24 doit être un cran valide du réglage (pas de 8 : 24 est valide).
- Les valeurs `richtext` sont des paragraphes `<p>` simples : c'est le format le plus sûr pour ce type de réglage.

---

## Dernière consigne

Commence maintenant par la phase 0 : lis tout, puis pose tes questions à Corentin en un seul message.
