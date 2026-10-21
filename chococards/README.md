# ChocoCards — refonte de la page d’accueil (prototype statique)

Maquette fonctionnelle de la page d’accueil de [chococards.be](https://chococards.be/) : même structure, même contenu, nouvel emballage (3D, holo, animations).
Le thème Shopify complet se trouve dans [`../chococards-theme`](../chococards-theme).

## Lancer en local

```bash
cd chococards
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/
```

Aucune étape de build. Les bibliothèques sont chargées depuis les CDN :
GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 et Three.js 0.160.0 (jsdelivr, chargé à la demande).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page (les 15 blocs de l’original, dans le même ordre) |
| `style.css` | Design : palette chocolat / crème, effets holo, verre dépoli, responsive |
| `main.js` | Interactions : 3D, animations, carrousels, recherche, panier… |
| `data.js` | **Le contenu à modifier** : produits, prix, statuts, sorties, tournois, menu |
| `assets/images/` | Images de remplacement (à remplacer par vos photos) |

## Modifier le contenu

Tout se passe dans `data.js` :

- **Produits** : `nom`, `prix`, `statut`, `categorie`, `langue`, `image`.
  Statuts : `disponible`, `precommande`, `bientot`, `rupture`, `boutique` (non disponible en ligne).
- **Précommande mise en avant** (`precommandeVedette`) : date de sortie du compte à rebours.
- **Sorties TCG** et **tournois** : les dates passées disparaissent toutes seules.
- **Menu** : catégories et sous-catégories du méga-menu.

## Remplacer les images

Chaque image affiche son propre nom de fichier (« Photo à remplacer · assets/images/… »).
Déposez votre photo **avec exactement le même nom** dans le même dossier : rien d’autre à changer.

| Dossier | Format conseillé |
|---|---|
| `produits/` | carré, 1000 × 1000 px |
| `categories/` | portrait 4:5, 800 × 1000 px |
| `autres-tcg/` | portrait 3:4, 600 × 800 px |
| `bannieres/` | paysage, 1400 × 900 px |
| `instagram/` | carré, 600 × 600 px |
| `boutique/` | portrait 4:5, 800 × 1000 px |

## Effets (activables en haut de `main.js`)

```js
const OPTIONS = { hero3d: true, holo: true, curseur: true, scrollFluide: true };
```

- Hero Three.js : cartes au dos ChocoCards (aucun personnage ni logo officiel), reflet holographique qui suit la souris ou le gyroscope, paillettes dorées. Pause automatique hors écran ; sur mobile, version allégée chargée au premier geste (des cartes CSS holographiques s’affichent en attendant).
- Cartes holo : tilt 3D + reflet irisé au survol.
- Booster qui se déchire au scroll (section épinglée sur desktop, animation unique sur mobile).
- Apparitions au scroll, compteurs, compte à rebours, boutons magnétiques, curseur discret, bandeau défilant.
- Ajout au panier : la carte vole jusqu’au panier, le badge rebondit (panier gardé dans le navigateur).
- `prefers-reduced-motion` : pas de 3D, pas de scroll fluide, animations coupées, état final affiché.

## Tests réalisés

- Chromium, desktop (1024 → 1440 px) et mobile (360, 390, 768 px) : rendu vérifié section par section, aucune erreur console, aucun débordement horizontal.
- Interactions : méga-menu, recherche instantanée, pays/langue, carte qui vole vers le panier, tiroir panier, carrousel 3D, booster épinglé au scroll, menu mobile.
- Lighthouse mobile (bibliothèques servies localement, compression activée) : **Performance 99–100 · Accessibilité 100 · Bonnes pratiques 100 · SEO 100**.

Les animations au scroll (GSAP) ne sont créées qu’à l’approche de leur section, Lenis n’est utilisé qu’à la souris, et aucun dégradé n’est animé en continu hors du titre du hero : la page reste fluide même sur un petit téléphone.
