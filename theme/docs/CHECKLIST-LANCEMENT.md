# Checklist de lancement

À cocher **avant** de publier le thème (`shopify theme push --unpublished`, puis Publier dans l'admin).

## Identité
- [ ] Nom choisi et saisi dans Thème > Réglages > Marque > **Nom de la boutique** (remplace `NOM_BOUTIQUE`).
- [ ] Vérifier aussi : nom Shopify (Paramètres > Infos sur la boutique), `Vendor` des produits, auteur du thème (`config/settings_schema.json`, facultatif).
- [ ] Ligne sous le logo, promesse, favicon, image de partage 1200 × 630.

## Juridique (France et Belgique)
- [ ] Politiques Shopify générées et relues : remboursement, confidentialité, conditions de vente, expédition, coordonnées, mentions légales (Paramètres > Politiques).
- [ ] Mentions légales du pied de page : raison sociale, numéro d'entreprise (BCE), adresse (réglage Prix et mentions).
- [ ] Mention TVA validée avec le comptable (franchise ou non) ; colonne `Charge tax` cohérente.
- [ ] Page « Livraison et retours » (template `page.livraison`) : adresse et frais de retour, suivi ; tous les `[À VÉRIFIER]` remplacés.
- [ ] Droit de rétractation de 14 jours et garantie légale de conformité de 2 ans présents dans les politiques.
- [ ] Aucun prix barré sauf s'il respecte la directive Omnibus.

## Cookies et mesure
- [ ] Bannière de consentement activée (Paramètres > Confidentialité des clients > Bannière de cookies) pour l'UE.
- [ ] Mesure d'audience uniquement via des applications Shopify (aucun script en dur dans le thème).

## Livraison et paiement
- [ ] Zones d'expédition France et Belgique, tarifs, et **livraison offerte dès 39 €** configurée (même seuil que le réglage Livraison du thème).
- [ ] Délais min/max du thème = délais constatés avec les échantillons.
- [ ] Moyens de paiement activés (cartes, Bancontact pour la Belgique, etc.).

## Catalogue
- [ ] Métachamps créés (voir `PRODUITS.md`), dimensions intérieures **mesurées** et au format `L × l × h mm`.
- [ ] Tous les `[À VÉRIFIER]` des fiches remplacés ou supprimés (`grep -r "À VÉRIFIER"` dans un export CSV).
- [ ] Images sans logo, personnage ni nom de jeu ; textes alternatifs remplis.
- [ ] Collections automatiques créées ; collection Vitrine choisie dans la section Vitrine ; template `product.kit` assigné au kit.
- [ ] Carte cadeau 20 / 40 / 60 €.
- [ ] Produits passés de Brouillon à Actif.

## DSers
- [ ] Chaque variante mappée ; lot de 3 = quantité 3 ; kit = Bundle.
- [ ] Synchronisation des numéros de suivi active.
- [ ] Échantillons reçus et contrôlés (rayures, film, fermeture, délais).

## Thème
- [ ] FAQ relue (réponses, repères `[jours_min]`, `[seuil]`… affichent les bonnes valeurs).
- [ ] E-mail de contact et délai de réponse (réglage Contact et réseaux) ; plus de `[À VÉRIFIER]` dans l'e-mail.
- [ ] Réseaux sociaux renseignés ou laissés vides.
- [ ] Application d'avis installée **ou** section Avis laissée vide (elle ne s'affiche pas sans application).
- [ ] `shopify theme check` sans erreur ; Lighthouse mobile ≥ 85 (performance) et ≥ 95 (accessibilité) sur l'accueil et une fiche.
- [ ] Test sur iPhone, Android, Chrome, Safari, Firefox ; test avec « réduire les animations » activé.

## Commande test de bout en bout
- [ ] Passer en mode test du paiement (ou commande réelle remboursée ensuite).
- [ ] Ajouter un produit depuis la vitrine, une carte et la fiche ; modifier les quantités dans le tiroir ; atteindre le seuil de livraison offerte.
- [ ] Payer, vérifier l'e-mail de confirmation, la commande dans DSers, puis le suivi.
- [ ] Faire un retour fictif pour valider le parcours (adresse, délai, remboursement).
