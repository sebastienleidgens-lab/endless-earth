# Preuves navigateur · LP-01

Voir [le rapport](../living-paintings-lp01.md), [les mesures](metrics.md) et [la commande de lancement](../../experiments/living-paintings/README.md).

Les PNG ci-dessous sont des captures du navigateur exécutant le prototype. Les peintures WebP de `experiments/living-paintings/public/` sont des sorties de précalcul, distinctes de ces captures. La 3D de référence utilise le commit revérifié `0f699fa` (Mission 10.1, `main` ayant avancé pendant LP-01), construit dans un worktree détaché propre, avec SwiftShader logiciel.

| Moment | Capture |
|---|---|
| Village, première étape réelle | [walk-1-0.png](walk-1-0.png) |
| Pont, aller | [walk-2-1.png](walk-2-1.png) |
| Sainte-Croix, aller | [walk-3-2.png](walk-3-2.png) |
| Pont, retour | [walk-4-1.png](walk-4-1.png) |
| Village, retour | [walk-5-0.png](walk-5-0.png) |
| Fin de promenade | [walk-return.png](walk-return.png) |
| Appui tactile émulé réel, 390 × 844 | [touch-390.png](touch-390.png) |
| Mobile tactile émulé, 390 × 844 | [mobile-390.png](mobile-390.png) |
| Écran 320 × 568 | [mobile-320.png](mobile-320.png) |
| Paysage 844 × 390 | [mobile-844.png](mobile-844.png) |
| LP-01, comparaison | [comparison-lp01.png](comparison-lp01.png) |
| 3D actuelle, comparaison | [comparison-3d-main.png](comparison-3d-main.png) |

`validate.mjs` pilote le bouton public d'aller-retour à 1,38 m/s, sans téléportation ni accélération du temps, puis teste le toucher émulé et les trois formats mobiles. `visual-check.mjs` mesure les pixels d'eau et de feuillage animés, l'arrêt stable des animations et un accès secondaire par clic. `compare-3d.mjs` ouvre deux pages fraîches successives ; ce n'est pas un parcours 3D apparié ni un test de GPU matériel.

`touch-check.mjs` utilise de vrais événements tactiles émulés (CDP touchStart/touchEnd, appui de deux secondes) ; voir [touch.json](touch.json).

Aucun téléphone physique testé. La validation artistique appartient au propriétaire : ouvrir le jeu et parcourir les trois tableaux. Les images et métriques seules ne remplacent pas cette revue.
