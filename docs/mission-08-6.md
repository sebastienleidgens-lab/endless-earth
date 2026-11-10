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

## Audit navigateur comparatif

L'audit navigateur après optimisation mesure `addNature` à 65,5 ms, soit −91,9 % par rapport au même audit avant. Aucun appel aux constructeurs de bâtiments ni à `fineDetails`/`buildDetail` n'est nécessaire dans ce parcours normal. Les maxima LOD nature passent de 11,1 à 6,8 ms, architecture de 47,1 à 3,5 ms. Le décodage CPU des blocs atteint 0,4 ms, l'installation 0,3 ms, la file complète 2,2 ms. Ces maxima proviennent de ce parcours instrumenté, pas d'une garantie universelle.

Le p95 CPU avant soumission passe de 26,2 à 8,2 ms dans cet audit, mais le maximum reste 55,6 → 57,3 ms. La soumission GL maximale monte de 771 à 851 ms et l'intervalle maximal reste 5,34 s au démarrage (7,15 s avant). Les pauses SwiftShader ne sont donc pas résolues par la seule suppression des générateurs. Les preuves après sont [JSON](mission-08-6-captures/audit-browser-after.json) et [profil CDP](mission-08-6-captures/cpu-after.cpuprofile.gz).

## Benchmark final

Trois passages alternés par version, huit stations, 45 rendus synchronisés par station/version. Les distributions complètes, p50/p95/p99/max, sont dans la [synthèse](mission-08-6-captures/summary.json) et les [données brutes](mission-08-6-captures/benchmark.json). Protocole et commandes : [README des preuves](mission-08-6-captures/README.md). Aucun test de rendu concurrent.

| Préparation initiale (3 passages) | 08.5 p50 / max | 08.6 p50 / max |
|---|---:|---:|
| État jouable local, ms | 8057.0 / 8667.0 | 6162.0 / 6317.0 |
| Écologie seule, ms | 612.2 / 701.2 | aucun appel, recettes précalculées |
| addNature, écologie + instances, ms | 642.0 / 738.1 | 27.9 / 28.1 |

Le chargement local médian baisse de 23.5 %. L'appel initial naturel baisse de 95.7 %. Le travail est déplacé hors navigateur, pas rendu gratuit : la préparation complète est conservée dans les preuves. Les p95 des trois durées initiales sont leurs maxima ; trois observations ne suffisent pas à caractériser une longue distribution de chargement.

| Station | Rendu logiciel p50 avant → après, ms | p95 avant → après, ms | max avant → après, ms | Draw calls avant → après | Triangles avant → après |
|---|---:|---:|---:|---:|---:|
| village | 372.8 → 368.4 | 416.6 → 398.2 | 534.2 → 403.0 | 125 → 125 | 246163 → 246163 |
| foret-dense | 216.6 → 215.5 | 234.5 → 252.7 | 253.6 → 287.2 | 80 → 80 | 147404 → 147404 |
| boisement-reel | 379.6 → 363.6 | 407.7 → 418.5 | 440.0 → 589.4 | 183 → 183 | 300428 → 300424 |
| prairie | 185.7 → 179.4 | 203.5 → 201.2 | 211.7 → 281.9 | 102 → 102 | 107157 → 107157 |
| riviere | 201.7 → 208.7 | 227.8 → 449.3 | 243.8 → 479.0 | 103 → 103 | 171412 → 171412 |
| aerienne | 374.0 → 383.5 | 389.6 → 416.2 | 401.4 → 441.8 | 161 → 161 | 271269 → 271267 |
| eco | 195.8 → 191.8 | 306.8 → 200.5 | 369.4 → 204.7 | 98 → 98 | 159954 → 159954 |
| mobile | 106.6 → 103.2 | 129.5 → 123.0 | 149.8 → 124.3 | 54 → 54 | 115701 → 115701 |

Le coût de rendu reste voisin, avec des régressions de longue traîne, notamment à la rivière et au boisement. Les médianes ne permettent pas de masquer ces pics. La densité et les draw calls n'ont pas été artificiellement réduits. Ce test mesure le travail logiciel synchronisé, pas un GPU physique ni une promesse de FPS.

## Promenades complètes et latence

Les deux promenades parcourent 450 m à moins de 0,000 001 m d'écart numérique, sans accélération de l'horloge : 394.1 s avant et 379.6 s après. Le graphe conserve 920 nœuds et 896 arêtes, un parcours exploratoire maximal trouvé de 3 787,53 m, les mêmes points du trajet validé, les 921 bâtiments et leurs ancrages.

| Mesure, promenade active seulement | 08.5 p50 / p95 / p99 / max, ms | 08.6 p50 / p95 / p99 / max, ms |
|---|---:|---:|
| cpuMs | 5.7 / 17.3 / 27.7 / 179.5 | 5.6 / 14.5 / 26.1 / 247.7 |
| submitMs | 1.7 / 6.9 / 18.1 / 604.5 | 1.6 / 6.9 / 18.4 / 971.0 |
| intervalMs | 157.5 / 449.0 / 745.9 / 2442.6 | 182.0 / 388.3 / 638.8 / 1045.9 |

La médiane des intervalles augmente et le maximum CPU augmente : ces régressions sont conservées. À l'image du pic CPU de 247,7 ms, les compteurs de requêtes/installations sont inchangés, la file n'a ni tâche active ni résultat prêt. Cela exclut une nouvelle construction synchrone de détail à cet instant ; cela n'identifie pas la cause exacte et n'exclut pas un GC indirect ou une attente du navigateur. Le maximum de soumission monte également à 971 ms.

| Toutes les images, démarrage et vérifications compris | 08.5 p50 / p95 / p99 / max, ms | 08.6 p50 / p95 / p99 / max, ms |
|---|---:|---:|
| cpuMs | 5.7 / 17.7 / 28.7 / 179.5 | 5.5 / 14.5 / 26.1 / 247.7 |
| submitMs | 1.7 / 7.0 / 18.4 / 604.5 | 1.6 / 7.0 / 18.5 / 971.0 |
| intervalMs | 157.6 / 449.4 / 747.0 / 7757.3 | 184.9 / 389.2 / 645.6 / 7085.2 |

Sur la promenade optimisée : 23 requêtes, 23 blocs terminés, 23 installations, aucune erreur ni résultat périmé installé ; 2.98 Mo de détails demandés. Le compteur d'annulation (15) inclut aussi les travaux en attente jamais téléchargés. Maximum décodage CPU de détail 2.5 ms, installation 1.0 ms, tick complet 5.1 ms. Le temps réseau/décompression/digest maximal est 102.2 ms de durée écoulée, pas de CPU bloquant. Le tick dépasse parfois les cibles : elles restent des cibles souples mesurées. Les anciennes tranches de recettes n'existent plus dans le chemin normal.

Les traces sont conservées intégralement en [avant](mission-08-6-captures/walk-before/walk.json.gz) et [après](mission-08-6-captures/walk-after/walk.json.gz). Les pics ne sont ni supprimés ni tronqués.

## Mémoire et chargement

| Station | Géométries estimées, Mio avant → après | Heap page observé, Mio avant (min–max) | après (min–max) |
|---|---:|---:|---:|
| village | 30.0 → 35.9 | 184.3–185.4 | 146.6–147.6 |
| foret-dense | 31.3 → 31.1 | 188.5–189.7 | 178.3–179.3 |
| boisement-reel | 33.2 → 29.8 | 139.3–180.6 | 187.5–188.6 |
| prairie | 32.7 → 27.0 | 142.1–144.0 | 194.6–195.7 |
| riviere | 35.1 → 30.5 | 142.9–150.7 | 208.3–209.3 |
| aerienne | 34.6 → 30.3 | 140.8–147.8 | 204.1–229.1 |
| eco | 33.1 → 28.3 | 140.4–147.0 | 114.9–223.9 |
| mobile | 33.1 → 28.3 | 142.4–147.2 | 114.8–218.0 |

Les textures terrain/routes estimées avec mipmaps restent à 11.3 Mio. Ce sont des estimations d'attributs et de textures, pas une mesure de mémoire GPU. Le heap n'est pas collecté de force pendant les benchmarks : sa hausse avant GC est visible, puis il retombe ; elle ne doit pas être confondue avec la mémoire retenue après GC. Sur la promenade, le pic heap augmente de 165.4 à 184.3 Mio. Les caches préchargent davantage de détails proches, avec un coût mémoire à assumer.


## Expérimentations et choix écartés

Les requêtes spatiales et exclusions sont conservées dans le générateur canonique, mais exécutées hors navigateur pour les données stables. Remplacer encore l'index spatial n'apporterait pas de gain au chemin normal désormais sans génération écologique. Le repli historique reste plus coûteux ; ce travail n'est pas présenté comme une accélération de l'algorithme de secours.

L'instancing existant est conservé : 125 groupes d'arbres par cellules de 180 m, matériaux partagés, frustum culling des lots, couronnes proches/lointaines et hystérésis. Les distances de bascule des couronnes (350 m en Qualité, 220 m en Éco, marge de 40 m), les troncs/branches et les silhouettes ne changent pas. Les feuillages utilisent des géométries opaques ; aucun nouveau plan alpha ni matériau n'est introduit. L'overdraw physique et les temps GPU matériels n'ont pas été mesurés.

Un essai isolé de 90/180/360 m conserve les 2 500 positions, mais change les regroupements et donc certaines bascules LOD :

| Cellule | Boisement : draw calls / triangles | Vue aérienne : draw calls / triangles | Rendu aérien p50, ms |
|---|---:|---:|---:|
| 180 m, référence | 183 / 300 424 | 160 / 260 247 | 386,2 |
| 90 m | 259 / 273 780 | 219 / 237 099 | 367,1 |
| 360 m | 153 / 315 532 | 135 / 332 423 | 508,7 |

Les empreintes du boisement et de la vue aérienne changent dans les deux variantes ; la forêt dense conserve la même image malgré davantage de géométrie hors champ dans les grands lots. Le 90 m augmente fortement les appels ; le 360 m dessine davantage de triangles et coûte plus cher en aérien logiciel. Ce seul essai n'établit pas un bénéfice sur GPU matériel. Les variantes sont écartées, avec leurs [mesures](mission-08-6-captures/experiments.json) et captures conservées.

Un Worker dédié sur une page vide isolée démarre en 40,2 ms dans cet environnement. Aller-retour transférable de 1 Mo : p50 0,1 ms ; de 16,9 Mo : p50 0,4 ms, max 2,9 ms. Avec clonage à l'aller et transfert au retour : 3,3 ms et 29,7 ms médians, max 52,2 ms pour le gros buffer. Le heap de la page augmente temporairement pendant ces allocations ; le heap du Worker n'est pas observable, donc aucun coût total mémoire de Worker n'est revendiqué. Le décodage résiduel étant déjà court, son déplacement ne justifie pas ici un thread, un protocole et un transfert supplémentaires. Aucun Worker n'est livré. Le double buffering n'est pas retenu non plus : les blocs sont immuables et installés progressivement, sans reconstruction continue à masquer.

## Mouvement, annulations et réutilisation

Les neuf trajectoires sont testées avant/après en Qualité et Éco : pas lents, rapides, rotation, zoom, traversée et sortie de forêt, aérien, transitions de cellules et retour au même endroit. Les séquences de caméra contrôlées mesurent les LOD et la file séparément du rendu ; elles ne remplacent pas le déplacement au clavier ni la promenade réelle. Les [captures de mouvement](mission-08-6-captures/mouvement.html) montrent le début et la fin de chaque trajectoire ; les traces détaillées sont dans `motion-before.json` / `motion-after.json` et la synthèse.

Le maximum de mise à jour LOD + file sur ces séquences passe de 25,0 à 8,4 ms en Qualité et de 14,2 à 4,7 ms en Éco. Certaines petites distributions Éco régressent ; elles restent dans les données. Les arbres de base existent dès l'état prêt ; aucun chargement individuel tardif d'arbre n'est introduit. Les détails au sol et de façade peuvent apparaître plus tard sous latence réseau, malgré le préchargement. Aucune mesure sur réseau mobile distant n'a été faite.

Le parcours de stress optimisé termine avec 209 requêtes, 209 décodages et 199 installations ; dix résultats terminés ont été annulés avant installation. Les 30 annulations comptent aussi les tâches en attente. Les 146 installations naturelles et 53 architecturales comprennent des retours après éviction : ce ne sont pas des créations supplémentaires d'arbres. Le maximum de destruction des résultats décodés annulés est 0,1 ms ; ce compteur n'inclut pas toutes les libérations différées du pilote GL. La destruction des cellules résidentes est incluse dans les durées des LOD.

Les caches invisibles observés culminent transitoirement à cinq cellules naturelles et treize architecturales ; entre deux mises à jour LOD, anciennes et nouvelles réservations peuvent se chevaucher. La borne théorique est huit/vingt-quatre pendant cette transition, puis quatre/douze après stabilisation. Les tests vérifient les deux bornes. La position finale stabilisée garde exactement les mêmes 29 568 849 octets géométriques sur les deux contrôles, avec 209 requêtes avant et après. Après GC explicite, le heap passe de 115 781 206 à 115 785 902 octets, sans reconstruction ni croissance géométrique. Cela établit une stabilité sur ce contrôle court, pas l'absence universelle de fuite. [Preuve de réutilisation](mission-08-6-captures/reuse-after.json).

## Validation

- 116 tests JavaScript passent : géographie, altitudes, provenance, empreintes, import des blocs, types/bornes, équivalence 08.5, budgets, annulation et concurrence ; aucune erreur ni test ignoré.
- Deux tests Python passent, import et normalisation du MNT.
- TypeScript et build Vite de production passent. Bundle JS : 625,36 ko, 173,17 ko gzip ; l'avertissement Vite au-delà de 500 ko reste présent. Les blocs géographiques sont des ressources séparées et progressives, pas du JavaScript inclus dans ce bundle.
- Tests navigateur de chargement, déplacements, dégagement des yeux, trois caméras, zoom mémorisé, recentrage, rotation, Qualité/Éco et viewport mobile passent sans erreur JavaScript.
- Sécurité en direct : bâtiment, zone privée, eau, mur et ruines injectés après le début de la promenade ; chaque position échantillonnée reste légale, et la promenade s'arrête avant l'obstacle.
- Audio : six cycles complets et douze bascules rapides, un seul contexte et deux sources ambiantes ; météo/atmosphère et systèmes naturels existants passent.
- 19 scénarios de données normales/dégradées passent : contrats terrain, LOD, OSM, eau, routes, matériaux, environnement, nouveaux paquets. Les routes restent au contact du terrain à moins de 0,2 mm d'erreur numérique et les fondations gardent le même contrôle. [Résultats](mission-08-6-captures/data-validation.json).
- Deux promenades complètes de 450 m, les 36 combinaisons trajectoire/profil/version et les comparaisons fixes passent.
- Le contrôle de l'identité de production vérifie le vrai hash Git, le statut propre et la lisibilité à quatre résolutions ; la [preuve](mission-08-6-captures/build-identity-validation.json) identifie précisément le commit compilé. Les captures et mesures précédentes peuvent afficher « modifié » : elles ont été prises pendant le travail, sans falsifier l'identité.

Les journaux et la matrice de validation sont conservés dans [validation.json](mission-08-6-captures/validation.json). Deux erreurs de harnais ont été corrigées avant validation finale : l'URL de l'expérience sans `perf=1` et la liste d'attentes de couverture du sol non étendue aux nouveaux cas décoratifs. Elles ne provenaient pas du moteur. Aucun échec de produit n'est masqué par leur correction.



## Coûts et provenance

Les 318 blocs pèsent 32 592 486 octets compressés, auxquels s’ajoute le manifeste de 535 555 octets, soit 33 128 041 octets au total. La base et son manifeste ajoutent 3 751 502 octets au chargement initial. La préparation hors navigateur dure environ 10,45 s sur cet environnement ([preuve](mission-08-6-captures/preparation.json)). Répartition des blocs : base statique 3 215 947, détails naturels 23 773 488, détails architecturaux 5 603 051. Les détails sont chargés localement, pas tous au démarrage. Le plus gros bloc naturel pèse 216 230 octets et architectural 447 809. La base décompressée pèse 16 895 192 octets ; ses vues typées partagent le buffer. Le coût est un transfert initial supplémentaire et un stockage dérivé accru, contre la suppression du recalcul des géométries.

Les empreintes de tous les fichiers sont dans le [manifeste](../public/data/angles-decorations/manifest.json), avec les sources, millésimes, projection, emprise, résolution et statut d'interprétation. Les licences restent celles des entrées : Licence Ouverte 2.0 pour les données IGN/ASP concernées, ODbL et attribution OpenStreetMap pour les données OSM. Voir [licences des données](../public/data/LICENSE.md). Aucune archive LiDAR brute n'est ajoutée à Git.

## Limites et Mission 09

Le chargement statique, la création des matrices d'instances et l'installation des bâtiments de base restent des tâches de démarrage. Le repli sur les générateurs historiques retrouve leur coût si le manifeste ou la base manque/est périmé. Un détail absent préserve la géographie et les collisions de base mais laisse moins de décoration ; il émet un avertissement et ne boucle pas en réessais.

La file actuelle est associée à la zone pilote. Un monde entier demandera un budget global entre zones, un hébergement tuilé et une politique de cache réseau adaptée ; elle n'établit pas encore la viabilité d'un vol rapide sur un continent. Les imports normalisés et le format de blocs n'imposent aucun fournisseur français.

Trois priorités pour Mission 09 :

1. Mesurer sur téléphone et ordinateur à GPU matériel, avec traces des pics et de la mémoire, avant de modifier le rendu des forêts.
2. Profiler puis préparer/indexer la navigation stable sans changer ses règles. Le profil statistique CDP après optimisation attribue encore environ 4,16 s de feuilles échantillonnées à `createNavigation` et `nearest` au démarrage ; ce n'est pas un chronomètre exact, mais le principal blocage initial restant est identifié. Voir [analyse des profils](mission-08-6-captures/profile-analysis.json).
3. Ajouter la vie naturelle via état environnemental partagé et shaders instanciés, en conservant des budgets globaux entre zones. Extraire alors le chemin et la cardinalité de l'adaptateur pilote en paramètres de zone.

Les mesures SwiftShader n'établissent ni 60 FPS ni une durée GPU matérielle.
