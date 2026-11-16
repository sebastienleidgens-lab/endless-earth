# Mission 26.1 — Continuité et fidélité de la Vienne

Rapport consolidé unique, complété par la campagne sur compilation figée. **La mission complète et la fusion ne sont pas déclarées prêtes.** Les preuves natives, les échecs de parcours et les limites du matériel sont distingués dans la matrice structurée.

## Résumé exécutif

Le pilote d’Angles conserve ses données historiques. Le moteur prépare les tuiles progressivement, vérifie un relief IGN effectif à 2 m, utilise des cellules de rendu locales et une origine flottante commune au rendu et au son. La carte calcule des routes sur les vrais nœuds OSM ; leur admission géométrique reste vérifiée pendant le déplacement. Les profondeurs restent une estimation de jeu.

## Base Git et périmètre

La référence M26 est `de3958c6c55b9ef9856d5809b14ef3d41ed8e4b5`. La PR #38 est ouverte et brouillon, vers `main` (`01e791be64cefae2eb1e90ab465f9bf0b848c33e` lors de la vérification). La même branche `mission/26-vienne-planet-engine` est conservée. Les acquis M25.2 absents de main restent dans cette ascendance. Aucun merge, déploiement ou achat n’est réalisé.

## Résultats par chantier

Les résultats définitifs seront issus des fichiers réellement produits par les scripts de validation. L’existence d’une fonction ou d’un jeu de données ne remplace pas sa validation native. Voir [architecture](mission-26-1-architecture.md), [sources](mission-26-1-data.md) et [matrice](mission-26-1-evidence/acceptance.json).

## Cinq bugs P0

Le chargement et la préparation coûteuse du graphe aquatique ont des correctifs techniques. Le tronc utilise un caster stable avec bois détaillé et feuillage conservé. Les essais de changement de locomotion qui dégradaient le pied planté ont été retirés ; les pics résiduels restent ouverts. Les oiseaux et le packraft exigent une validation perceptive native, en plus des contrôles numériques.

## Vérité du département

499 tuiles et 265 communes sont des couvertures de données. Les 499 dérivés IGN effectifs à 2 m totalisent 1 407 876 165 octets compressés. 98,4408 % des échantillons de leurs carrés complets, marges comprises, sont valides. Ce pourcentage n’est pas une mesure de superficie détaillée des seules communes. Le repli RGE à 128 m reste explicite aux lacunes. Les anciens packs ne sont pas réécrits.

## Trajets réels et contrôleurs

Une route calculée, un placement d’inspection, une simulation accélérée du contrôleur et un voyage natif sont quatre preuves différentes. Les essais incomplets restent des échecs, même si le script a écrit son résultat sans erreur système.

## Performances et mobilité

Les comparaisons utilisent un framebuffer réellement verrouillé et le son actif. Chromium dispose de SwiftShader ; aucune certification 60/30 FPS, Android physique ou régression ≤5 % n’est déduite de ce matériel logiciel.

## Sources, licences et préservation

IGN / API Geo : Licence Ouverte 2.0. OpenStreetMap et SNCF Réseau : ODbL. Aucun budget supplémentaire. Les données Living Paintings, LP01, world/living et les workflows de production restent protégés par l’audit de préservation.

## Défauts résiduels et décision

Les parcours longs, les nouveaux accès aquatiques, les activités restaurées et les corrections perceptives ne deviennent « atteints » qu’avec leurs preuves correspondantes. Les ouvrages et accès inconnus restent fermés. **Décision proposée : conserver la PR brouillon tant que les blocages de la matrice ne sont pas fermés.**
