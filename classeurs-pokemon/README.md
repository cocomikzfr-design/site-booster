# Les Classeurs de Jack

Site vitrine pour des classeurs de cartes Pokémon (React, TypeScript, Tailwind CSS, Framer Motion, Lucide).

Sections : accueil avec classeur 3D aimanté, bandeau d'images qui défile au scroll, À propos (texte qui s'éclaire lettre par lettre), Avantages, Produits et Contact.

Le classeur vendu : zippé, 160 cartes, 4 pochettes par page, en 5 couleurs (rouge, vert, bleu marine, bleu, orange). Dans Produits, il s'ouvre en 3D quand on fait défiler la page : la tirette descend, la couverture pivote sur le dos, puis les cartes s'allument une par une. Les pastilles de couleur au-dessus changent le classeur, et « Ouvrir le classeur » sur chaque fiche lance l'ouverture de cette couleur.

## Modifier le contenu

Tout est dans `src/data.ts` : textes, nom de la boutique, adresse e-mail, produits, prix et liens.

- Prix, nom, caractéristiques et lien : `PRODUCT`.
- Couleurs et cartes rangées dans chaque classeur : `COLORS`.
- Adresse de contact : `CONTACT_EMAIL`.
- Photos produit : remplacer `public/images/p-<couleur>-a.webp`, `-b.webp` et `-c.webp` par tes photos, avec les mêmes noms.

## Lancer en local

```bash
cd classeurs-pokemon
npm install
npm run dev
```

`npm run build` génère le site statique dans `../classeurs/` (servi tel quel par GitHub Pages ou n'importe quel hébergeur).

## Régénérer les visuels

Trois sources d'images :

- **Tes photos produit** (AliExpress) : `studio/photos.py` remplace les cartes Magic du classeur ouvert par de vraies cartes Pokémon, remplace le fond blanc par un dégradé de la couleur, et découpe deux zooms (couverture, pages). Il faut numpy, scipy et Pillow.
- **Les vraies cartes** (en français, base [TCGdex](https://tcgdex.dev)) : la liste par couleur est dans `studio/cards.json`, et `studio/fetch-cards.py` les télécharge.
- **Les visuels 3D** (bandeau, classeur du haut de page, couvertures de l'animation) : dessinés en HTML/CSS dans `studio/studio.html`, puis photographiés avec Playwright.

```bash
./studio/fetch-art.sh
python3 studio/fetch-cards.py
mkdir -p studio/photos-src && for id in S632b52eb4176497187f1635a8223bb36A S194489cbcc4b4045901982cb5d3a707aM Se73ea99b928445baa804543e7f428e71D S430a76d932894e15818ac8d61d9b0c32F S0fa1ed68a6874e188206250cdfb2526fp; do curl -s -o studio/photos-src/$id.jpg https://ae01.alicdn.com/kf/$id.jpg; done
python3 studio/photos.py studio/photos-src public/images
node studio/render.cjs
```

Pokémon et les illustrations des cartes appartiennent à Nintendo, Creatures et GAME FREAK.
