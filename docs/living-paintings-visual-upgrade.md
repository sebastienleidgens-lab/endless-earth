# Living Paintings — amélioration visuelle du 10 novembre 2026

La demande était d'améliorer considérablement les graphismes vers une promenade plus belle, authentique et réaliste, dans l'esprit des RPG à décors précalculés comme Baldur's Gate 1 et Diablo 1. Cette révision remplace le rasteriseur de faces Canvas du premier essai par un véritable précalcul Three.js. Le jeu reste une promenade 2D à images fixes avec éléments animés : aucun rendu WebGL de scène n'est ajouté au navigateur du joueur.

[Tester la version privée](https://endless-earth-living-paintings-lp01.spicy-zebra-0777.chatgpt.site). La qualité artistique reste soumise à la revue du propriétaire ; il s'agit d'une direction plus détaillée, pas d'une reproduction de la finition ou des ressources de ces jeux.

## Changements visibles

- Toitures à deux pans découpées dans les empreintes OSM, pignons fermés, tuiles ou ardoises détaillées ; suppression des anciens toits en éventail.
- Façades de pierre et d'enduit vieilli, textures normales, encadrements, appuis, volets, portes, cheminées, pierres d'angle et quelques plantes grimpantes.
- Relief continu avec textures de sol et de litière, végétation volumétrique, branches, feuillage découpé, rochers et petits groupes de plantes de berge.
- Lumière directionnelle chaude, environnement et ombres précalculées ; étalonnage moins saturé. Les cartes de profondeur et d'eau sont rendues depuis la même scène et la même caméra, en tenant compte des silhouettes alpha du feuillage.
- Profil de soutien à arches pour le pont existant. C'est une interprétation artistique du profil, pas un relevé ni une validation de son nombre réel d'arches.
- Voyageur original d'environ 1,75 m, rendu en atlas transparent : huit directions, huit phases de marche, repos et clignement. Son éclairage est corrigé vers sRGB avant export.
- Vue rapprochée par défaut, cadrage qui suit la marche, bouton « Vue large » / « Vue rapprochée ». L'angle de projection reste fixe ; le changement de cadrage ne change ni les distances ni la vitesse.

## Géographie et limites d'authenticité

`public/world.json`, les tracés, la navigation et les données de production ne sont pas modifiés. Le village, le pont et la rue Sainte-Croix restent ceux de l'étude LP-01, avec les mêmes coordonnées et passages. La caméra est abaissée de façon fixe pour mieux percevoir les façades ; les masques sont recalculés avec cette caméra.

Les matériaux évoquent le calcaire, les enduits, la terre cuite et l'ardoise d'un village régional. Les toitures, ouvertures, volets, lierre, arbres, ombres et arches ne sont pas architecturalement relevés. Le pavement est une convention visuelle de l'étude, pas une affirmation sur le revêtement actuel des rues. Les emprises OSM sont cartographiées ; leur habillage reste une reconstruction. Le relief conserve la précision de la source IGN existante, pas celle d'un relevé de chaque seuil.

## Pipeline et ressources

`src/art-materials.ts` prépare les matériaux ; `src/art-geometry.ts` génère les volumes ; `src/baker.ts` produit les trois peintures et masques ; `src/art-traveller.ts` produit l'atlas. Les graines des arbres dépendent d'une grille géographique commune, afin que les zones partagées entre vues restent cohérentes. La génération est réalisée hors ligne ; le navigateur charge les images et l'atlas.

Sept matériaux photographiques Poly Haven sont employés, avec albedo et normales OpenGL : `medieval_wall_02`, `mossy_cobblestone`, `roof_slates_02`, `clay_roof_tiles_02`, `plaster_stone_wall_01`, `forest_floor`, `grass_ground`. [Licence CC0 vérifiée](https://polyhaven.com/license), URLs exactes et SHA-256 dans [sources.json](../experiments/living-paintings/art/materials/sources.json). Les textures de travail sont conservées dans `art/materials/`, hors du répertoire `public/` : elles ne sont pas distribuées inutilement dans le build du jeu.

Les modèles, feuilles et le voyageur sont créés par code dans le projet. Aucune image générée par IA, aucune photo d'Angles-sur-l'Anglin et aucun asset de jeu commercial n'est utilisé. Les attributions OSM/IGN et la notice MIT de Three.js restent distribuées ; les crédits Poly Haven sont ajoutés à l'interface et à `ATTRIBUTION.txt`.

Pour reconstruire, lancer le serveur de développement du prototype, puis `npm run art:prepare` dans un second terminal. `LP_ART_URL` permet de fournir l'URL du serveur existant au précalcul. Chromium logiciel calcule les sorties, avec les dépendances verrouillées. Le précalcul est plus coûteux que celui de LP-01 initial et doit rester hors du parcours de chargement du joueur.

## Vérification et preuves

[Captures et mesures de cette révision](living-paintings-v2-evidence/README.md). Le build TypeScript/Vite et les 7 tests géométriques passent. La vérification du navigateur porte sur le zoom, les 80 cellules non vides de l'atlas, le déplacement réel, l'affichage étroit et l'aller-retour complet à 1,38 m/s. Les valeurs finales de chargement, poids, heap et transitions sont conservées dans les JSON et la synthèse de cette révision.

Les nouvelles textures et cartes de profondeur plus détaillées augmentent le téléchargement. La mémoire des cartes reste au même format ; l'atlas ajoute un tampon RGBA. Les mesures de heap ne sont pas une mesure de la mémoire totale du navigateur. Le mobile est émulé, aucun appareil physique n'a été testé.

La prévisualisation interne gérée par Sites a signalé un délai d'attente de son relais. Le précalcul et les contrôles automatisés ont utilisé le serveur de travail déjà existant ; aucune réussite de cette infrastructure de relais n'est revendiquée. La publication est validée par l'état retourné par Sites.

## Isolation et livraison

La branche et la PR #19 restent dédiées au prototype. Aucun changement de `main`, des données de production ou du workflow Pages. La publication met à jour uniquement le Site privé déjà créé, à la même URL, avec les mêmes droits d'accès. Les métadonnées d'hébergement et les identifiants temporaires restent hors du dépôt GitHub de production.
