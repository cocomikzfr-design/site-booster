# site-booster

Deux pages statiques autonomes (HTML, CSS et JS dans un seul fichier, sans build ni bibliothèque externe).

| Fichier | Contenu |
|---------|---------|
| `index.html` | **Planet Jumping** : expérience spatiale immersive. Préchargement vidéo vers Mars, portail en canvas avec faux 3D qui suit la souris, voyages Mars → Terre → Vénus. Le bouton « Menu » mène à BoosterVerse. |
| `booster.html` | **BoosterVerse** : prototype jouable du jeu de cartes à collectionner (100 000 créatures générées en SVG, ouverture de boosters, raretés, collection, booster gratuit toutes les heures). Il reprend la même base visuelle que Planet Jumping. |
| `alchimie-chauffage/` | **L'Alchimie du Chauffage** : site vitrine démo pour un chauffagiste de Nivelles. Intro d'allumage, flamme 3D en shader (three.js) avec repli CSS/SVG, thermostat piloté par le scroll, cartes de services empilées, radar des communes, GSAP + ScrollTrigger, Lenis. Les infos à compléter sont dans l'objet `CONFIG` en haut de `main.js`. Ajouter `?3d=1` à l'adresse force la flamme 3D. |
| `docs/BOOSTERVERSE.md` | Description complète du projet BoosterVerse : concept, raretés, boucle de jeu, feuille de route, modèle économique, risques. |

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/, http://localhost:8000/booster.html
# ou http://localhost:8000/alchimie-chauffage/
```

Les vidéos, l'image et le logo sont chargés depuis le CDN CloudFront indiqué dans le cahier des charges.

## Astuces BoosterVerse

- `booster.html?dev=1` : boosters illimités, pour tester sans attendre une heure.
- L'équilibrage (chances, délai, carte rare garantie, exemplaires) se règle dans l'objet `CONFIG` en haut du script.
- La collection est sauvegardée dans le navigateur (`localStorage`, clé `boosterverse:v1`).
