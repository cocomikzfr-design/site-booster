# site-booster

Deux pages statiques autonomes (HTML, CSS et JS dans un seul fichier, sans build ni bibliothèque externe).

| Fichier | Contenu |
|---------|---------|
| `index.html` | **Planet Jumping** : expérience spatiale immersive. Préchargement vidéo vers Mars, portail en canvas avec faux 3D qui suit la souris, voyages Mars → Terre → Vénus. Le bouton « Menu » mène à BoosterVerse. |
| `booster.html` | **BoosterVerse** : prototype jouable du jeu de cartes à collectionner (100 000 créatures générées en SVG, ouverture de boosters, raretés, collection, booster gratuit toutes les heures). Il reprend la même base visuelle que Planet Jumping. |
| `docs/BOOSTERVERSE.md` | Description complète du projet BoosterVerse : concept, raretés, boucle de jeu, feuille de route, modèle économique, risques. |

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/ ou http://localhost:8000/booster.html
```

Les vidéos, l'image et le logo sont chargés depuis le CDN CloudFront indiqué dans le cahier des charges.

## Astuces BoosterVerse

- `booster.html?dev=1` : boosters illimités, pour tester sans attendre une heure.
- L'équilibrage (chances, délai, carte rare garantie, exemplaires) se règle dans l'objet `CONFIG` en haut du script.
- La collection est sauvegardée dans le navigateur (`localStorage`, clé `boosterverse:v1`).
