# Les Classeurs de Jack

Site vitrine pour des classeurs de cartes Pokémon (React, TypeScript, Tailwind CSS, Framer Motion, Lucide).

Sections : accueil avec classeur 3D aimanté, bandeau d'images qui défile au scroll, À propos (texte qui s'éclaire lettre par lettre), Avantages, Produits et Contact.

Dans Produits, un classeur en 3D s'ouvre quand on fait défiler la page : la tirette descend, la couverture pivote sur le dos, puis les cartes s'allument une par une. On choisit le classeur (Éclair ou Flamme) avec les boutons au-dessus, ou avec « Ouvrir le classeur » sur chaque fiche produit, qui fait défiler la page toute seule. Le réglage du classeur (couverture, couleurs, cartes rangées) est dans `binder` de chaque produit, dans `src/data.ts`.

## Modifier le contenu

Tout est dans `src/data.ts` : textes, nom de la boutique, adresse e-mail, produits, prix et liens.

- Prix du produit 02 : remplacer `price: null` par le prix, par exemple `'14,90 €'`.
- Adresse de contact : `CONTACT_EMAIL`.
- Photos produit : remplacer `public/images/p1-a.webp`, `p1-b.webp`, `p1-c.webp` (produit 01) et `p2-*.webp` (produit 02) par tes photos, avec les mêmes noms.

## Lancer en local

```bash
cd classeurs-pokemon
npm install
npm run dev
```

`npm run build` génère le site statique dans `../classeurs/` (servi tel quel par GitHub Pages ou n'importe quel hébergeur).

## Régénérer les visuels

Les visuels (classeurs, pages de cartes, couvertures) sont dessinés en HTML/CSS dans `studio/studio.html`, puis photographiés avec Playwright :

```bash
./studio/fetch-art.sh
node studio/render.cjs
```

Les illustrations Pokémon viennent du dépôt [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Pokémon est une marque de Nintendo, Creatures et GAME FREAK.
