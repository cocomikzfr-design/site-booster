# Produits, métachamps et collections

Ordre conseillé : **1. métachamps → 2. import CSV → 3. images → 4. collections → 5. DSers → 6. vérifications**.

## 1. Créer les métachamps produit

Admin > Paramètres > Données personnalisées > Produits > **Ajouter une définition**. Espace de noms et clé : `custom.<clé>`.
Coche « Accès au storefront » pour chacun.

| Clé | Nom affiché | Type | Utilisé par |
|---|---|---|---|
| `ligne_vitrine` | Ligne vitrine | Texte sur une ligne | Légende de la vitrine, cartes produit |
| `compatibilite` | Compatibilité | Texte sur une ligne | Fiche (ligne sous le prix), vitrine si `ligne_vitrine` vide |
| `dimensions_interieures` | Dimensions intérieures | Texte sur une ligne | Caractéristiques, schéma à l'échelle, guide des tailles |
| `dimensions_exterieures` | Dimensions extérieures | Texte sur une ligne | Caractéristiques |
| `epaisseur_mm` | Épaisseur (mm) | Nombre entier | Caractéristiques, schéma (épaisseur des parois) |
| `matiere` | Matière | Texte sur une ligne | Caractéristiques |
| `fermeture` | Fermeture | Texte sur une ligne | Caractéristiques |
| `protection_uv` | Protection UV | Texte sur une ligne | Caractéristiques (**seulement si le fabricant l'indique**) |
| `capacite` | Capacité | Texte sur une ligne | Caractéristiques |
| `contenu_pack` | Contenu du pack | Liste de textes sur une ligne | Caractéristiques |
| `image_vitrine` | Image vitrine | Fichier (images) | Vitrine : PNG détouré 1200 × 1500 |
| `forme_vitrine` | Forme vitrine | Texte sur une ligne, choix : `boitier`, `plat` | Vitrine : bloc 3D ou à plat |
| `profondeur_vitrine` | Profondeur vitrine | Décimal (0,05 à 1) | Vitrine : épaisseur du bloc 3D (défaut 0,34) |

**Format obligatoire de `dimensions_interieures`** pour que le schéma à l'échelle s'affiche : `L × l × h mm`,
par exemple `190 × 85 × 260 mm` (le `×` ou un `x` minuscule, décimales avec virgule acceptées).
Tant que la valeur contient `[À VÉRIFIER]`, le schéma ne s'affiche pas.

Un métachamp vide n'est jamais affiché. Ne remplis `protection_uv` que si la fiche fournisseur l'indique noir sur blanc.

## 2. Importer le catalogue

Admin > Produits > **Importer** > `docs/products-import.csv`.

- 7 produits en **brouillon**, stock non suivi, vente continue, `Charge tax` à `FALSE` (franchise de TVA :
  **à confirmer avec ton comptable** ; sinon passe la colonne à `TRUE`).
- Les prix sont des prix de départ : ajuste-les selon tes coûts réels (prix DSers + livraison + frais Shopify).
- Aucun prix barré n'est rempli : n'en ajoute un que s'il respecte la directive Omnibus (prix le plus bas des 30 derniers jours).
- Les colonnes de métachamps sont remplies avec `[À VÉRIFIER]` : remplace chaque valeur par les mesures réelles.
  Les métachamps numériques (`epaisseur_mm`, `profondeur_vitrine`), la liste `contenu_pack` et le fichier `image_vitrine`
  se remplissent dans l'admin, produit par produit.
- **En-têtes** : ils suivent le modèle CSV produit de Shopify (version 2024-2025 : `Title`, `URL handle`, `Charge tax`…).
  Le centre d'aide Shopify n'était pas accessible au moment de la génération : si l'import signale une colonne inconnue,
  télécharge le modèle depuis Admin > Produits > Importer > « Télécharger un exemple de CSV » et recopie les lignes
  dans ses colonnes.

## 3. Carte cadeau

Admin > Produits > Cartes cadeaux > **Ajouter un produit carte cadeau** : « Carte cadeau », valeurs 20 €, 40 € et 60 €.
Le thème affiche la carte avec `templates/gift_card.liquid` (montant, code à copier, QR code, impression).

## 4. Images

Voir `IMAGES-PROMPTS.md`. Pour chaque produit :
1. Photos produit (fond `#F3EFE7`), la première est l'image principale. Remplis le texte alternatif.
2. Image vitrine : PNG transparent 1200 × 1500 dans le métachamp `image_vitrine`.
3. Pour les variantes de couleur, associe une image à chaque variante (la galerie la montre au changement).

## 5. Collections automatiques

Admin > Produits > Collections > Créer une collection > **Automatisée** :

| Collection | Condition |
|---|---|
| Vitrine | Tag produit est égal à `vitrine` |
| Toute la collection | Prix est supérieur à 0 |
| Boîtiers | Type de produit est égal à `Boîtier coffret` **OU** `Boîtier display` (« n'importe quelle condition ») |
| Classeurs | Type de produit est égal à `Classeur` |
| Cartes gradées | Type de produit est égal à `Cartes gradées` |
| Kits | Type de produit est égal à `Kit` |

Dans l'éditeur de thème, choisis la collection **Vitrine** dans la section Vitrine, et assigne le template
`product.kit` au produit « Le Kit du Collectionneur » (Produit > Template du thème).
Pour les filtres de collection, installe l'application gratuite **Search & Discovery** et active les filtres
Type de produit, Couleur et Prix.

## 6. DSers (dropshipping)

- **Boîtiers, classeur, présentoir, protections** : un produit fournisseur = un produit Shopify. Vérifie que chaque
  variante Shopify pointe vers la bonne variante fournisseur (couleur du classeur).
- **Lot de 3** (boîtier ETB) : mappe la variante « Lot de 3 » sur la variante fournisseur « Unité » avec une
  **quantité de 3** (DSers > Mapping > Avancé ou réglage de quantité).
- **Le Kit du Collectionneur** : utilise la fonction **Bundle** de DSers (Mapping > Bundle) et ajoute les trois
  articles fournisseur : boîtier, classeur (de la couleur choisie) et kit de protections. Une variante du kit =
  un bundle (Ardoise, Forêt, Bordeaux).
- Synchronise les numéros de suivi (DSers > Paramètres > Suivi) pour que le client reçoive l'e-mail d'expédition
  de Shopify pour **chaque** colis.

## 7. Vérifications avant publication

- **Dimensions** : recopie les dimensions intérieures depuis la fiche fournisseur, puis **mesure un échantillon**.
  Un boîtier trop juste est le premier motif de retour.
- **Échantillons** : commande un exemplaire de chaque boîtier. Vérifie les rayures au transport, la présence du film
  de protection, la qualité de la fermeture et le délai réel de livraison en France et en Belgique.
- Mets à jour les réglages Livraison (délais min/max) avec les délais constatés.
- Relis chaque `[À VÉRIFIER]` (fiches, FAQ, page livraison, pied de page) : voir `CHECKLIST-LANCEMENT.md`.
