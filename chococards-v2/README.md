# ChocoCards v2 — page d’accueil « Atelier Holo »

Nouvelle page d’accueil de ChocoCards (Nivelles), repartie de zéro : scène sombre aux couleurs
qui changent à chaque section, feuilles colorées, vraies photos de la boutique, reflets
holographiques, et bientôt la 3D (voir `DESIGN.md`, le cahier de conception complet).

## Lancer en local

```bash
cd chococards-v2
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/
```

Aucune étape de build. GSAP 3.13, Lenis 1.1.13 et Three.js 0.160 viennent du CDN jsDelivr
(versions exactes) ; les polices sont dans `assets/fonts`.

## Modifier le contenu : `js/data.js`

- **Produits** : nom, prix, statut (`disponible`, `precommande`, `bientot`, `rupture`, `boutique`),
  langue (FR / JP / EN), code du set, format, couleur.
- **Photos** : renseignez `image` (chemin dans `assets/img/…` ou adresse web). Sans photo,
  le site affiche une carte typographique holographique (code du set + format) — jamais un faux visuel.
  Photo détourée (fond transparent) : ajoutez `detoure: true`.
- **Précommande mise en avant**, **sorties TCG**, **tournois** (les dates passées disparaissent
  toutes seules), **catégories**, **Instagram**, **menu**, **horaires** (l’état « ouvert / fermé »
  est calculé à l’heure belge).

## Tester

Paramètres utiles dans l’adresse : `?nopreload` (sans préchargeur), `?motion=reduce`
(mouvement réduit), `?gl=0` (sans 3D), `?nolibs` (simule une panne du CDN),
`?today=2026-10-24` (simule une autre date).
