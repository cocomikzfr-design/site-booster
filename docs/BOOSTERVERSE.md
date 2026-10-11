# BoosterVerse — description complète du projet

> Nom provisoire. Style des créatures retenu pour le prototype : **mignon et rond**.

## 1. Le concept en une phrase

BoosterVerse est un jeu de cartes à collectionner en ligne et gratuit. Chaque joueur ouvre des boosters pour découvrir des créatures uniques, générées à partir de milliers de combinaisons possibles. Il y a plus de 100 000 cartes différentes, l'univers est 100 % original et il n'y a rien à télécharger : tout se joue dans le navigateur, sur téléphone comme sur ordinateur.

## 2. Le problème que le jeu résout

Ouvrir un booster est l'un des mécanismes les plus addictifs du jeu vidéo et du collectionnisme : la tension, la révélation carte par carte, l'espoir de tomber sur une rareté. Mais les jeux qui l'exploitent bien (TCG Pocket, Wikimaster et d'autres) reposent soit sur une licence appartenant à un grand éditeur, soit sur du contenu qu'on ne peut pas réutiliser librement.

BoosterVerse reprend cette boucle de jeu avec un univers qui appartient entièrement à son créateur. On peut donc faire évoluer le jeu librement, ajouter des cosmétiques, vendre des extensions et ne dépendre d'aucun ayant droit.

## 3. Comment fonctionnent les cartes

### La génération par combinaison

Au lieu de dessiner 100 000 cartes à la main, on dessine un petit nombre de pièces que le jeu assemble automatiquement.

| Pièce        | Version complète | Prototype (`booster.html`) |
|--------------|------------------|----------------------------|
| Corps        | ~40              | 5 (Boule, Poire, Mochi, Haricot, Nuage) |
| Têtes        | ~30              | 5 (Ours, Chat, Lapin, Antennes, Cornes) |
| Palettes     | 20               | 6 (Pêche, Menthe, Lavande, Ciel, Bonbon, Aurore) |
| Éléments     | 12               | 4 (Feu, Eau, Plante, Foudre) |
| Accessoires  | 10               | 6 (Aucun, Nœud, Lunettes, Écharpe, Ailes, Couronne) |
| Yeux         | —                | 4 (Points, Joyeux, Endormis, Étoiles) |
| Bouches      | —                | 3 (Sourire, Ô, Croc) |
| Motifs       | —                | 4 (Uni, Ventre, Taches, Rayures) |

La version complète donne plus de deux millions de combinaisons. Le prototype en offre déjà **172 800**, ce qui suffit pour 100 000 cartes toutes différentes. Chaque carte reçoit un numéro unique (par exemple « n° 48 213 / 100 000 »).

### Un rendu léger

Les créatures sont dessinées en **SVG** directement par le navigateur. Il n'y a aucun fichier image à stocker : le jeu reste rapide et ne coûte presque rien à héberger.

### Les noms et les statistiques

- **Nom** : trois syllabes assemblées (« Mokibu », « Flarnix », « Tessala »…). 47 syllabes donnent 103 823 noms possibles, donc un nom unique par numéro de carte.
- **Statistiques** (PV, ATK, DEF, puissance) : calculées à partir des pièces. Un corps Mochi donne plus de défense, l'élément Feu augmente l'attaque, un accessoire rare ajoute un bonus et la rareté multiplie le tout.

## 4. Le système de rareté

La rareté est naturelle : elle dépend des pièces qui composent la créature. Chaque pièce a un niveau de rareté de 0 à 3, et le score d'une créature est la somme des carrés de ces niveaux (un niveau 3 vaut 12). Les pièces rares pèsent donc beaucoup plus que les autres. Les 100 000 cartes sont ensuite classées par score.

| Rareté      | Part   | Nombre de cartes | Exemplaires par carte | Effet visuel |
|-------------|--------|------------------|-----------------------|--------------|
| Commune     | ~60 %  | 60 000           | 1 000                 | Cadre argenté mat |
| Rare        | ~25 %  | 25 000           | 250                   | Cadre bleu lumineux |
| Épique      | ~12 %  | 12 000           | 50                    | Cadre irisé + reflet holographique |
| Légendaire  | ~3 %   | 3 000            | 10                    | Bordure dorée animée, étincelles, animation spéciale à l'ouverture |

Les joueurs comprennent la rareté d'un coup d'œil : plus la carte brille, plus elle est rare. Dans le prototype, aucune Commune ne porte de couronne ni la palette Aurore, et presque toutes les Légendaires ont l'une des deux.

## 5. La boucle de jeu

1. **Ouvrir un booster** : un booster gratuit toutes les heures. On touche le paquet, il se déchire, et 5 cartes apparaissent.
2. **Découvrir** : chaque carte se retourne avec un effet adapté à sa rareté. Le dos d'une carte rare, épique ou légendaire brille déjà avant d'être retourné. Les légendaires déclenchent un flash doré, des rayons et une explosion de particules.
3. **Collectionner** : tout va dans « Ma collection », avec ce qu'on possède et ce qui manque.
4. **Revenir** : un compte à rebours annonce le prochain booster gratuit.

## 6. La première version (le prototype livré)

Elle est dans le fichier `booster.html`.

- Page d'accueil avec le booster en 3D (il suit la souris) et le bouton « Ouvrir un booster ».
- Ouverture animée : le paquet se déchire, 5 cartes sont révélées une par une (ou toutes d'un coup avec « Tout révéler »), puis un récapitulatif avec les badges « NOUVEAU ».
- Page « Ma collection » : progression sur 100 000, progression par rareté, filtres par rareté et par élément, tri (récentes, rareté, numéro), doublons (×2…).
- Fiche détaillée de chaque carte, avec un bouton **Partager** (partage natif sur mobile, sinon copie du texte).
- Compte à rebours avant le prochain booster gratuit.
- Sauvegarde dans le navigateur (`localStorage`), sans compte à créer.
- Mode test : ajouter `?dev=1` à l'adresse pour ouvrir des boosters sans attendre.

Tout l'équilibrage se règle dans l'objet `CONFIG`, en haut du script : délai entre boosters, chances par rareté, carte rare garantie en 5e position, nombre d'exemplaires.

## 7. Les fonctions prévues ensuite

- Comptes joueurs pour retrouver sa collection sur plusieurs appareils.
- Échanges entre joueurs.
- Combats simples utilisant les statistiques et les éléments (Feu > Plante > Eau > Feu, Foudre > Eau…).
- Classement des plus belles collections et des cartes les plus rares.
- Défis quotidiens et succès (« Collectionne 10 créatures de feu »).
- Extensions saisonnières : chaque saison est une planète (Saison 1 : Mars, puis Terre, Vénus…), avec de nouvelles pièces et des événements limités. Cela fait le lien avec l'expérience Planet Jumping (`index.html`).

## 8. Le public visé

- Joueurs de jeux de cartes à collectionner et de jeux mobiles.
- Fans de collection au sens large.
- Adolescents et jeunes adultes qui aiment partager leurs trouvailles.
- Joueurs occasionnels qui veulent une session de quelques minutes.

Comme le jeu tourne dans le navigateur, il suffit d'un lien pour le partager.

## 9. Ce qui le rend différent

- **Univers original** : aucune licence, donc aucun risque de retrait et une vraie liberté commerciale.
- **Échelle** : 100 000 cartes dès le départ.
- **Légèreté** : tout est généré dans le navigateur, avec un coût d'hébergement proche de zéro.
- **Rareté lisible** : la valeur d'une carte se voit tout de suite.
- **Évolutivité** : chaque nouvelle pièce multiplie le nombre de combinaisons.

## 10. Le modèle économique possible

Le jeu reste gratuit. Les revenus viennent d'options facultatives :

- boosters supplémentaires, à l'unité ou en pack ;
- cosmétiques (cadres, dos de cartes, animations d'ouverture) ;
- abonnement qui donne plus de boosters gratuits par jour ;
- publicité légère (un booster bonus contre une pub regardée).

L'objectif de la première phase est de prouver que les joueurs reviennent, avant de chercher à gagner de l'argent.

## 11. Les risques et comment les gérer

| Risque | Réponse |
|--------|---------|
| Les créatures se ressemblent trop | Soigner la diversité et l'harmonie des pièces, tester avec quelques joueurs avant d'en produire beaucoup. |
| Pas de communauté au début | Cibler quelques groupes Discord et Facebook de joueurs de cartes, miser sur le partage des cartes rares. |
| Les joueurs s'ennuient | Donner des objectifs : séries à compléter, défis, événements. |
| Tirages mal équilibrés | Régler les probabilités dans `CONFIG` après les premiers tests. |

## 12. Le plan de lancement

1. **Semaine 1** : prototype jouable (ouverture de booster et collection). ✅ Livré.
2. **Semaine 2** : test avec une dizaine de personnes, retours sur le style, le rythme et les raretés.
3. **Semaines 3 et 4** : nouvelles pièces, animation des légendaires enrichie, partage de cartes en image, puis mise en ligne publique.
4. **Ensuite** : mesurer combien de joueurs reviennent le lendemain et la semaine suivante. Si le chiffre est bon, ajouter les comptes, les échanges et la monétisation.

## 13. Le critère de réussite

Un seul chiffre compte au début : **quel pourcentage de joueurs revient le lendemain ?** Si au moins un joueur sur quatre revient (25 % de rétention à J+1), le jeu tient quelque chose et ça vaut la peine d'investir. Sinon, on ajuste le concept avant d'aller plus loin.
