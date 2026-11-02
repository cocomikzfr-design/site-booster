# Noël en Façade — thème Shopify

## 1. À quoi sert ce dossier

Ce dossier contient un thème Shopify écrit sur mesure pour la boutique de Noël « Noël en Façade ».
Il affiche les 5 produits importés avec DSers, gère le panier (tiroir latéral) et mène jusqu'au paiement Shopify.
Le thème ne crée aucun produit, aucune collection, aucune page : tout cela se fait dans l'admin (voir la partie 3).

Le cahier des charges complet se trouve dans `PROMPT.md`. Garde-le : il sert de référence pour toute modification future.

Organisation des fichiers :

| Dossier | Contenu |
|---|---|
| `assets/` | Feuilles de style (CSS) et scripts (JavaScript) |
| `config/` | Réglages du thème (Paramètres du thème dans l'éditeur) |
| `layout/` | Gabarits de page (`theme.liquid`, `password.liquid`) |
| `locales/` | Tous les textes de l'interface, en français |
| `sections/` | Les blocs de page que tu déplaces dans l'éditeur |
| `snippets/` | Petits morceaux réutilisés (prix, carte produit, icônes…) |
| `templates/` | Modèles de page (accueil, fiches produits, panier…) |
| `content/` | Textes à coller dans l'admin (descriptions produits, textes légaux). Ce dossier n'est pas envoyé à Shopify. |

## 2. Les commandes utiles

Remplace `<adresse>` par l'adresse de ta boutique, au format `nom.myshopify.com`.
Lance ces commandes dans un terminal ouvert dans le dossier `boutique-noel`.

Aperçu en direct pendant les modifications (s'ouvre dans le navigateur, ne touche pas au thème en ligne) :

```bash
shopify theme dev --store <adresse>
```

Vérification du code :

```bash
shopify theme check
```

Envoi d'une nouvelle copie non publiée du thème :

```bash
shopify theme push --unpublished --store <adresse>
```

Liste des thèmes de la boutique :

```bash
shopify theme list --store <adresse>
```

Ne lance jamais `shopify theme publish` ni `shopify theme delete` : la publication se fait à la main, dans l'admin, quand tout est prêt.

## 3. Ce qu'il faut faire dans l'admin

Coche les cases au fur et à mesure.

### 3.1 Produits
- [ ] Importer les 5 produits avec DSers depuis AliExpress.
- [ ] Choisir des vendeurs AliExpress bien notés (au moins 95 % d'avis positifs) et lire les avis avec photos de clients.
- [ ] Pour le pack : créer le produit « Pack Façade de Noël » et le relier dans DSers aux deux articles (projecteur et guirlande), si possible chez le même vendeur.
- [ ] Saisir les prix : 44,90 € (pack), 29,90 € (projecteur), 34,90 € (couronne), 24,90 € (guirlande), 17,90 € (sapin).
- [ ] Ne pas renseigner de prix barré, sauf s'il correspond à un vrai prix pratiqué auparavant.
- [ ] Remplacer les titres et descriptions importés par ceux du dossier `content/produits/`.
- [ ] Renseigner le titre et la méta-description SEO de chaque produit (en tête de chaque fichier de `content/produits/`).
- [ ] Ajouter les photos et vidéos du vrai produit, avec leurs textes alternatifs (proposés dans `content/produits/`).
- [ ] Vérifier les handles (adresse du produit) : `pack-facade-de-noel`, `projecteur-de-noel-led`, `couronne-de-noel-lumineuse`, `guirlande-neige-qui-tombe`, `sapin-feutrine-enfant`.
- [ ] Désactiver le suivi des stocks (dropshipping).
- [ ] Choisir le modèle de page de chaque produit : `product.pack`, `product.projecteur`, `product.couronne`, `product.guirlande`, `product.sapin`.
- [ ] Ne publier le sapin en feutrine qu'après confirmation du marquage CE et de la norme EN 71 par le fournisseur (c'est un jouet).

### 3.2 Collection, menus et pages
- [ ] Créer la collection manuelle `noel` (« Décorations lumineuses de Noël ») avec les 5 produits, pack en premier (tri manuel).
- [ ] Menu `main-menu` : Accueil, Le pack Façade de Noël, Toutes les décorations, Livraison, Contact.
- [ ] Menu `footer` : Livraison, Retours et remboursements, Conditions générales de vente, Mentions légales, Confidentialité, Contact.
- [ ] Page « Livraison » (modèle `page`, adresse `livraison`) avec le texte de l'annexe D de `PROMPT.md`.
- [ ] Page « Contact » (modèle `page.contact`, adresse `contact`) avec le texte de l'annexe D.
- [ ] Page « À propos » (facultative) avec le texte de l'annexe D.

### 3.3 Politiques et informations légales
- [ ] Coller les textes de `content/legal/` dans les politiques de la boutique (Paramètres > Politiques) : remboursement, confidentialité, conditions d'utilisation, expédition, coordonnées, mentions légales.
  Astuce : ouvrez chaque fichier sur GitHub (affichage mis en forme) et copiez le texte affiché, pas le code avec les « # ».
- [ ] Remplacer tous les [À COMPLÉTER].
- [ ] Faire relire ces textes avant l'ouverture (guichet d'entreprises, juriste ou comptable).

### 3.4 Livraison
- [ ] Zone d'expédition « France et Belgique » avec un tarif « Livraison offerte » à 0 €.
- [ ] Supprimer ou désactiver les autres zones (aucune livraison hors France et Belgique).
- [ ] Vérifier que le délai affiché au paiement ne contredit pas les 7 à 12 jours.

### 3.5 Paiements et paiement final (checkout)
- [ ] Shopify Payments actif, compte bancaire vérifié, Bancontact activé pour la Belgique.
- [ ] Apple Pay et Google Pay activés si disponibles.
- [ ] Langue du paiement : français.
- [ ] Comptes clients : nouveaux comptes clients ou aucun compte (pas de création de compte obligatoire).
- [ ] Case d'inscription aux e-mails au paiement : décochée par défaut.

### 3.6 Marchés, taxes, conformité
- [ ] Marchés : France et Belgique, devise euro.
- [ ] Fuseau horaire de la boutique (Paramètres > Général) : Bruxelles. Le compte à rebours et les dates de livraison en dépendent.
- [ ] Taxes : réglage selon ton régime de TVA [À VÉRIFIER avec un comptable : franchise belge, ventes à distance dans l'UE, importations de petits colis].
- [ ] Bannière de cookies Shopify activée pour les visiteurs européens.
- [ ] Numéro d'entreprise (BCE) obtenu avant de vendre.
- [ ] Obligations de reprise des appareils électriques et des piles pour la vente aux clients français et belges [À VÉRIFIER : filières REP/DEEE en France, Recupel et Bebat en Belgique].
- [ ] Informations de sécurité produit (fabricant, personne responsable dans l'UE, avertissements) demandées aux vendeurs AliExpress pour chaque produit.
- [ ] Photos du marquage CE de chaque produit électrique conservées.

### 3.7 Applications et publicité
- [ ] DSers : commandes passées chez le fournisseur dès le paiement, suivi transmis à Shopify.
- [ ] Application officielle TikTok et application Facebook & Instagram pour les pixels (elles respectent le consentement aux cookies).
- [ ] Aucun pixel collé à la main dans le thème.
- [ ] Publicités générées par IA : montrer l'effet réel du produit ; signaler les vidéos IA réalistes comme telles sur TikTok.
- [ ] Plus tard, uniquement avec de vrais avis : une application d'avis (un emplacement « bloc d'application » est prévu sur la fiche produit).

### 3.8 Notifications
- [ ] Ajouter le texte de l'annexe C de `PROMPT.md` dans l'e-mail de confirmation de commande et dans l'e-mail d'expédition.

### 3.9 Réglages du thème à remplir (éditeur de thème > Paramètres du thème)
- [ ] Service client : e-mail affiché sur le site et nom légal de l'entreprise.
- [ ] Panier : produit proposé dans le panier (conseillé : la guirlande neige).
- [ ] Produits : produit pack (le pack Façade de Noël).
- [ ] Réseaux sociaux : liens TikTok, Instagram, Facebook, YouTube (seuls les liens remplis s'affichent).
- [ ] Logo et favicon (facultatif : sans logo, le nom de la boutique s'affiche en texte).
- [ ] Page d'accueil : vidéo et image d'attente du premier écran, visuel de la section « Idée cadeau ».

### 3.10 Mise en ligne
- [ ] Prévisualiser le thème « Noël en Façade v1 » sur téléphone et ordinateur.
- [ ] Passer une commande test (mode test de Shopify Payments), puis l'annuler.
- [ ] Publier le thème.
- [ ] Retirer la page mot de passe.
- [ ] Optionnel : relier un nom de domaine.

## 4. Modifier les textes

| Texte | Où le changer |
|---|---|
| Titres, accroches, FAQ, étapes, garanties, onglets des fiches produits | Éditeur de thème, dans la section ou le bloc concerné |
| Description d'un produit | Admin > Produits > le produit > Description |
| Textes légaux | Admin > Paramètres > Politiques |
| Petits textes de l'interface (boutons, panier, messages d'erreur) | `locales/fr.default.json` |
| Délai de livraison, pays, date limite de Noël | Éditeur de thème > Paramètres du thème > Livraison / Saison de Noël |

Les textes spécifiques à chaque fiche produit (sous-titre, points forts, onglets, FAQ) sont enregistrés dans le modèle de page du produit.
Pour les modifier : éditeur de thème > menu du haut > Produits > choisis le modèle (par exemple « projecteur »).

Couleurs : si tu changes une couleur dans les Paramètres du thème, la lisibilité devient ta responsabilité.
Vérifie que le texte reste bien lisible sur son fond (contraste d'au moins 4,5 pour 1).

Photos et vidéos :
- vidéos de moins de 10 Mo, en boucle courte de 6 à 12 secondes ;
- images de 2048 px de large au maximum ;
- montre toujours le vrai produit sur les fiches produits.

Idées d'articles de blog, utiles pour Google :
- « Comment illuminer sa façade pour Noël sans échelle »
- « Projecteur de Noël : à quelle distance du mur le placer ? »
- « 5 idées pour décorer sa porte d'entrée à Noël »

## 5. La date limite de Noël

Elle se règle dans l'éditeur de thème > Paramètres du thème > Saison de Noël :
- « Date limite pour recevoir avant Noël » au format AAAA-MM-JJ (par défaut 2026-12-08) ;
- « Heure limite » au format HH:MM, heure de Bruxelles (par défaut 23:59).

Le compte à rebours est le même pour tous les visiteurs : il compte jusqu'à cette vraie date, jamais un délai qui redémarre.
Après la date limite, le site affiche automatiquement « La date limite pour une livraison avant Noël est passée » et prévient que les commandes arriveront après Noël.
Le site continue de vendre normalement.

Les phrases « Pour recevoir avant Noël, commandez au plus tard le… » des blocs « Livraison et retours » et des FAQ des fiches produits sont construites automatiquement à partir de cette date (option « Ajouter la phrase sur la date limite de Noël » du bloc).
Elles se mettent à jour toutes seules si tu changes la date, et disparaissent hors saison.
Exception : la dernière phrase de la description du pack (champ Description de l'admin) est un texte fixe, à retirer après Noël.

Après les fêtes, passe le réglage « Mode » sur « Hors saison » : le compte à rebours, la section « Date limite de Noël » et les phrases automatiques disparaissent (voir l'annexe F de `PROMPT.md`).

## 6. Les règles à ne pas casser

- Pas de faux avis, pas de fausses notes, pas de faux témoignages.
- Pas de faux stocks (« plus que 3 en stock »), pas de faux visiteurs (« 27 personnes regardent ce produit »).
- Pas de faux comptes à rebours : seul celui de la vraie date limite de Noël est autorisé.
- Pas de prix barré inventé. Une réduction annoncée se calcule sur le prix le plus bas pratiqué dans les 30 jours précédents.
- Le badge de réduction est désactivé par défaut (Paramètres du thème > Produits). Ne l'active que si tes prix barrés respectent la règle des 30 jours.
- Délai de livraison réel affiché : 7 à 12 jours. Jamais « 48 h », jamais « expédié depuis la France ».
- Aucune caractéristique non vérifiée (étanchéité, indice IP, puissance, certification) : garde la mention [À VÉRIFIER] tant que le fournisseur n'a pas confirmé.
- Les mots « garantie », « satisfait ou remboursé » ou « retour gratuit » ne s'emploient que s'ils figurent dans tes politiques.
- Pubs IA fidèles au vrai produit.

## 7. Les mentions à compléter

Les textes contiennent des mentions [À COMPLÉTER] et [À VÉRIFIER].
Elles restent visibles sur le site tant que tu ne les as pas remplacées : c'est voulu, pour ne rien oublier.

Pour les retrouver toutes :

```bash
grep -rn "À COMPLÉTER\|À VÉRIFIER" content templates sections
```

Dans l'éditeur de thème, ces mentions apparaissent dans les réglages des blocs des fiches produits.

## 8. Vérifier le thème (tests automatiques)

Le dossier `tests/` contient une simulation locale de la boutique (5 faux produits, panier, pages) et 78 tests de navigateur :
affichage à 320, 375, 390, 768 et 1280 px, accessibilité, panier, variantes, compte à rebours, mode hors saison, fonctionnement sans JavaScript.
Ce n'est pas Shopify : c'est une imitation, utile pour vérifier le code après une modification. Le test final reste l'aperçu `shopify theme dev`.
Ce dossier n'est pas envoyé à Shopify.

Première fois :

```bash
cd tests && npm install && npx playwright install chromium
```

Lancer les tests :

```bash
cd tests && npm test
```

Voir la simulation dans ton navigateur (http://localhost:9393) :

```bash
cd tests && npm run simulation
```

## 9. En cas de problème

Voir le tableau de dépannage de l'annexe E de `PROMPT.md`.

## 10. Après Noël

Voir l'annexe F de `PROMPT.md`.
