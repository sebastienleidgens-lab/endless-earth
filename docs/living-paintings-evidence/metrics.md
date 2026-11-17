# Mesures LP-01

Mesures locales Chromium, 10 novembre 2026. Le test mobile utilise l'émulation tactile ; aucun appareil physique testé. Les mesures 3D utilisent SwiftShader logiciel.

| Mesure | Résultat |
|---|---:|
| Fichiers nécessaires au premier tableau, sans compression HTTP | 1.41 Mio (1480340 octets) |
| Tous les tableaux et code, préchargement inclus | 2.56 Mio (2681937 octets) |
| Cache décodé estimé, trois tableaux | 52.50 Mio |
| Marche réelle aller-retour | 572.24 m |
| Détection de fin, sondage toutes les 10 s | 422.46 s |
| Intervalles de frames en marche, médiane / p95 | 16.70 / 16.70 ms |
| Transitions préchargées | 1.40 / 0.90 / 1.10 / 0.90 ms |
| Heap JS en fin de marche | 32.46 Mio |
| Mobile émulé, ouverture incluant 1,5 s de stabilisation | 1654.79 ms |
| Mobile émulé, médiane / p95 | 16.70 / 16.80 ms |

Le poids initial est une somme de fichiers, pas un forfait réseau. Le cache décodé est une borne basse ; il exclut les buffers du navigateur et les pointes de décodage. La heap Chromium est une mesure JS, pas la mémoire totale du processus ni celle d'un téléphone. La fin de marche est détectée à la prochaine interrogation de 10 s : ne pas traiter cette durée comme un chronométrage précis à la milliseconde.

## Comparaison locale à la 3D

| Build | Prêt | Intervalles médiane / p95 au repos | Heap JS | Corps de ressources chargées |
|---|---:|---:|---:|---:|
| lp01 | 276.36 ms | 33.30 / 50.00 ms | 57.08 Mio | 2.55 Mio |
| 3d-main | 3859.67 ms | 383.20 / 666.70 ms | 114.57 Mio | 12.67 Mio |

Pages fraîches successives à 1440 × 1080, DPR 1 ; 180 intervalles requestAnimationFrame au repos. Le build 3D provient d'un worktree détaché propre au commit 0f699fa (Mission 10.1) ; aucun code de production modifié. Les lieux/caméras et les périmètres rendus diffèrent. La mesure n'est pas un gain universel ni un test apparié sur GPU matériel. Les préchargements locaux et la charge de l'environnement peuvent modifier les résultats.

Animation : sur 1,2 seconde, 410 pixels changés dans la région d'eau et 1275 dans les régions de feuillage, avec seuil RGB > 9. L'arrêt des animations produit 0 octet de pixel différent après 0,5 seconde. Le passage secondaire a été atteint dans le navigateur par clic et marche normale.

Sources : [desktop.json](desktop.json), [walk-progress.json](walk-progress.json), [mobile.json](mobile.json), [comparison.json](comparison.json), [visual-check.json](visual-check.json), [metrics.json](metrics.json).
