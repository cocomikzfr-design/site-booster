# Règles de propriété intellectuelle

> Ce fichier est le **seul** endroit du thème où les noms de jeux sous licence peuvent apparaître :
> ils y sont cités uniquement pour dire qu'ils sont interdits.

## Le paragraphe de référence

**Propriété intellectuelle.** Accessoires génériques, sans licence. Interdit partout (code, images, textes,
noms de fichiers, SEO) : les noms de jeux de cartes comme titre de produit, collection ou marque (Pokémon,
One Piece Card Game, Magic: The Gathering, Yu-Gi-Oh!, Lorcana…), leurs logos, polices, personnages, illustrations,
dos de cartes, la forme de la Poké Ball, et toute photo de coffret officiel dans un boîtier.
Autorisé : des termes de format neutres toujours accompagnés des dimensions (« pour coffrets au format ETB standard,
dimensions intérieures : … ») et des cartes ou coffrets **fictifs** à motifs abstraits.

## En pratique

| Situation | Oui | Non |
|---|---|---|
| Titre produit | « Boîtier acrylique pour coffret format ETB » | « Boîtier ETB Pokémon » |
| Description | « Dimensions intérieures : 000 × 000 × 000 mm » (mesurées) | « Compatible avec tous les coffrets [marque] » |
| Photos | Boîtier vide, ou coffret fictif à motifs abstraits | Photo d'un coffret officiel dans le boîtier |
| Tags, SEO, URL, noms de fichiers | `boitier-acrylique-coffret-etb` | Tout nom de jeu ou de personnage |
| Publicité, réseaux | « Protège tes coffrets scellés » | Logos, personnages, dos de cartes |

- Un terme de format (ETB, display, UPC) est toujours suivi des dimensions intérieures mesurées.
- Les métachamps `dimensions_interieures` doivent être remplis avant publication (voir `CHECKLIST-LANCEMENT.md`).
- La FAQ dit clairement que les produits sont génériques et non affiliés.

## Vérification automatique

Depuis le dossier `theme/` :

```bash
grep -riE "pok[eé]mon|pikachu|one piece|yu-?gi-?oh|lorcana|magic: the gathering" . --exclude=REGLES-IP.md
```

La commande ne doit rien trouver.
