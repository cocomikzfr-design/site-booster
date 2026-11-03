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

Les visuels (classeurs, pages de cartes, couvertures) sont dessinés en HTML/CSS dans `studio/studio.html`, puis photographiés avec Playwright :

```bash
./studio/fetch-art.sh
node studio/render.cjs
```

Les illustrations Pokémon viennent du dépôt [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Pokémon est une marque de Nintendo, Creatures et GAME FREAK.
