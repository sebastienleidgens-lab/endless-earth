# Mission 08.6 — La fluidité des paysages réels

Travail sur la branche `mission/08-5-donnees-geographiques`, dans la PR #15 restée ouverte et en brouillon. Référence 08.5 : `6c7cdb9f0e9bceb101aa9e196101ff8627cf820a`. Aucun changement de `main`, aucune fusion, aucun déploiement.

## Diagnostic effectué avant modification

L'audit CPU sépare le travail géographique, les générateurs artistiques, les LOD et les appels GL. Il précède les modifications de produit : [audit Node](mission-08-6-captures/audit-cpu-before.json), [audit navigateur](mission-08-6-captures/audit-browser-before.json), [profil CDP](mission-08-6-captures/cpu-before.cpuprofile.gz). Les compteurs imbriqués sont inclusifs : leurs durées ne s'additionnent pas. L'instrumentation ajoute son propre coût.

Dans l'audit hors navigateur, lecture/parsing OSM 5,34 ms, environnement 8,91 ms, terrain 2,64 ms, validation/fusion 9,08 ms. La génération écologique atteint 557,73 ms. Les requêtes d'habitat sont répétées 62 618 fois sur les deux générations et les détails instrumentés ; les recherches d'eau/exclusions et de pente dominent ensuite. Les 228 684 échantillons de sol totalisent environ 30 ms. Le problème principal est de refaire des calculs stables, davantage que de simplement lire 878 polygones.

Dans Chromium instrumenté, `addNature` bloque 805,7 ms ; les 921 appels d'ajout de bâtiments totalisent 416,5 ms, leur finalisation 78,9 ms. Les géométries de détails, normales et sphères englobantes ajoutent d'autres tâches indivisibles. Un LOD architectural atteint 47,1 ms. Les destructions du profil CPU initial sont faibles (1,39 ms au total) ; rien ne permet d'attribuer tous les pics à la collecte mémoire.

`GL.bufferData` mesure le retour CPU de l'appel au pilote, pas une durée GPU matérielle : maximum 14,1 ms dans cet audit. `renderer.render` mesure la soumission, qui peut aussi attendre le pilote. `gl.finish` + `readPixels` synchronise le rendu logiciel. L'intervalle entre deux images inclut attente, ordonnanceur, rendu logiciel et travail extérieur au code instrumenté. Ces quatre valeurs restent séparées dans les preuves.

## Optimisations retenues

La préparation stable est déplacée hors navigateur avec `npm run geo:decorations`. Le même générateur produit les mêmes résultats, une fois pour les sources et le code versionnés : les 2 500 recettes d'arbres, les géométries de base des 921 bâtiments et les détails locaux. Les buffers, normales et sphères englobantes sont préparés à l'avance, compressés et contrôlés par SHA-256.

Le navigateur instancie les arbres avec les matériaux, couleurs, matrices et LOD existants. Il hydrate les bâtiments de base sans reconstruire leur géométrie. Les 250 cellules naturelles et 67 cellules architecturales de détails se chargent progressivement. Deux requêtes au maximum, deux résultats prêts ou en vol, une installation par image ; priorité à la proximité et marge de préchargement selon profil/vitesse. Les résultats périmés sont annulés ou détruits, jamais installés. Les quatre places de cache naturel invisible et douze places architecturales sont réservées aussi pendant le préchargement, pour empêcher les rechargements en boucle.

Les cibles d'installation sont de 0,5 / 0,8 / 1,2 / 0,8 ms pour Éco / Équilibré / Qualité / Personnalisé, abaissées à 0,25 ms après une image de plus de 50 ms. Ce sont des cibles souples ; la création d'un objet ou le parcours de la file reste indivisible. Les maxima réellement mesurés sont publiés, sans prétendre garantir ces cibles. Les profils futurs ont leur politique séparée, sans nouveau panneau de réglages.

Le [contrat de préparation](decoration-import.md) décrit le conteneur, l'invalidation, le repli et l'extension par zones. Données géographiques statiques, recettes d'instances, état environnemental partagé, animation visuelle et chargement restent séparés. Aucune nouvelle simulation individuelle par arbre et aucun nouvel effet de Mission 09 ne sont ajoutés.

## Fidélité et apparence

La [preuve d'équivalence](mission-08-6-captures/source-equivalence.json) a été obtenue en exécutant le préprocesseur sur le code 08.5 non modifié, dans un worktree détaché. Les objets des 2 500 arbres et les ancrages architecturaux sont identiques ; les 318 blocs, attributs typés, indices et sphères englobantes ont les mêmes empreintes. Les tests réutilisent cette référence. Les neuf MNT LiDAR, les altitudes à 10 m, les 878 polygones, classes, priorités, exclusions et données source ne changent pas.

[Onze comparaisons fixes](mission-08-6-captures/comparaisons.html) couvrent village, forêt dense, boisement réel, lisière, prairie, chemin rural, rivière, château, vue aérienne, Éco et mobile Éco. Caméras géographiques, date du 21 juin 2026 à midi UTC, lumière, résolution et profils sont identiques. Les détails ont le temps de terminer leur chargement avant les mesures fixes.

Les empreintes du framebuffer sont identiques au village et dans la forêt dense. Les autres empreintes diffèrent : il serait faux de revendiquer une identité complète des images. Les différences RGB mesurées hors HUD restent très petites : au plus 0,031 % de pixels changés sur les vues quantifiées, moins de 0,003 % dépassant 8 niveaux RGB ; le château est identique hors interface. Quelques scènes comptent deux ou quatre triangles de moins, sur un total de 120 000 à 315 000. Aucun arbre, matériau ni silhouette n'a été supprimé pour accélérer le rendu. La chronologie du chargement des petits détails peut varier aux limites de visibilité. [Empreintes](mission-08-6-captures/visual-equivalence.json), [différences d'images](mission-08-6-captures/image-differences.json), [planche](mission-08-6-captures/overview.jpg).

Les arbres, herbes, ouvertures et toitures restent des interprétations procédurales. Les empreintes OSM, le relief et les classes géographiques conservent le statut et les limites documentés dans [Mission 08.5](mission-08-5.md). Le précalcul n'améliore pas leur précision géographique et ne les convertit pas en données mesurées.

## Mesures en cours de consolidation

L'audit navigateur après optimisation mesure `addNature` à 65,5 ms, soit −91,9 % par rapport au même audit avant. Aucun appel aux constructeurs de bâtiments ni à `fineDetails`/`buildDetail` n'est nécessaire dans ce parcours normal. Les maxima LOD nature passent de 11,1 à 6,8 ms, architecture de 47,1 à 3,5 ms. Le décodage CPU des blocs atteint 0,4 ms, l'installation 0,3 ms, la file complète 2,2 ms. Ces maxima proviennent de ce parcours instrumenté, pas d'une garantie universelle.

Le p95 CPU avant soumission passe de 26,2 à 8,2 ms dans cet audit, mais le maximum reste 55,6 → 57,3 ms. La soumission GL maximale monte de 771 à 851 ms et l'intervalle maximal reste 5,34 s au démarrage (7,15 s avant). Les pauses SwiftShader ne sont donc pas résolues par la seule suppression des générateurs. Les preuves après sont [JSON](mission-08-6-captures/audit-browser-after.json) et [profil CDP](mission-08-6-captures/cpu-after.cpuprofile.gz).

Les benchmarks alternés, parcours en mouvement, tests dégradés et promenade complète sont en cours de consolidation. Cette section sera complétée avant livraison.

## Coûts et provenance

Le nouveau produit pèse 32 592 486 octets compressés : base statique 3 215 947, détails naturels 23 773 488, détails architecturaux 5 603 051. Les détails sont chargés localement, pas tous au démarrage. Le plus gros bloc naturel pèse 216 230 octets et architectural 447 809. La base décompressée pèse 16 895 192 octets ; ses vues typées partagent le buffer. Le coût est un transfert initial supplémentaire et un stockage dérivé accru, contre la suppression du recalcul des géométries.

Les empreintes de tous les fichiers sont dans le [manifeste](../public/data/angles-decorations/manifest.json), avec les sources, millésimes, projection, emprise, résolution et statut d'interprétation. Les licences restent celles des entrées : Licence Ouverte 2.0 pour les données IGN/ASP concernées, ODbL et attribution OpenStreetMap pour les données OSM. Voir [licences des données](../public/data/LICENSE.md). Aucune archive LiDAR brute n'est ajoutée à Git.

## Limites et Mission 09

Le chargement statique, la création des matrices d'instances et l'installation des bâtiments de base restent des tâches de démarrage. Le repli sur les générateurs historiques retrouve leur coût si le manifeste ou la base manque/est périmé. Un détail absent préserve la géographie et les collisions de base mais laisse moins de décoration ; il émet un avertissement et ne boucle pas en réessais.

La file actuelle est associée à la zone pilote. Un monde entier demandera un budget global entre zones, un hébergement tuilé et une politique de cache réseau adaptée ; elle n'établit pas encore la viabilité d'un vol rapide sur un continent. Les imports normalisés et le format de blocs n'imposent aucun fournisseur français.

Pour Mission 09 : mesurer d'abord sur un téléphone et un ordinateur à GPU matériel ; conserver une animation par état environnemental partagé et shaders instanciés ; étendre ensuite le chargement par zones avec un plafond global de travail et de mémoire. Les mesures SwiftShader n'établissent ni 60 FPS ni une durée GPU matérielle.
