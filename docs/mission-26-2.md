# Mission 26.2 — Vienne réellement jouable : bilan partiel

## 1. Verdict en langage simple

**PARTIEL — PR brouillon non prête à fusionner.** La nouvelle marche la plus longue mesure **12,97 km**, sur **5 tuiles**, depuis Chauvigny. Elle ne termine pas le trajet de 21 km. L’aller-retour sélectionné depuis Angles mesure **2,377 km** et réussit ; il reste dans une seule tuile globale. Aucun voyage automobile complet de 40/80 km et aucun nouveau corridor fluvial de 1 km ne sont certifiés.

Les trajets sont pilotés par les entrées normales du jeu et les collisions restent actives. Les nouveaux essais sont accélérés avec des rendus espacés : ils ne démontrent pas la fluidité native. Le premier essai Saint-Pierre dessine chaque pas manuel, comme son champ méthode le précise ; il ne sert pas de mesure de FPS comparable. Les clips natifs et les mesures de performance sont séparés. Leur horloge d’environnement est distincte du temps du contrôleur : [l’analyse temporelle](mission-26-2-evidence/native-timing-analysis.json) publie une borne supérieure du temps physique, sans inventer le dt natif non exporté. Le moteur corrige plusieurs causes réelles, mais les critères majeurs de liberté, voyage et perception restent ouverts.

[Ouvrir la galerie autonome](mission-26-2-evidence/index.html) · [Acceptance complète](mission-26-2-evidence/acceptance.json) · [Reproduction](mission-26-2-evidence/REPRODUCTION.md)

## 2. M26.1 → M26.2

| Problème | Cause observée | Correction | Preuve et statut |
| --- | --- | --- | --- |
| Marche hors des chaussées | Politique limitée aux voies | Permissions explicites des polygones, inconnus et privés conservés | [7 marches courtes / 8 candidats](mission-26-2-evidence/access.json) ; PARTIEL |
| Voie étroite voisine bloquant une route | Sélection par proximité sans capsule contenue | Sélection du corridor contenant réellement la capsule | [Tests](mission-26-2-evidence/checks/tests.txt) ; pas une validation de toutes les jonctions |
| Obstacle ferroviaire fantôme à 5,64 km | `railway=razed` pris pour rail actuel | État démantelé distingué, accès et rails actifs toujours contrôlés | [Échec initial](mission-26-2-evidence/failed-attempts/razed-rail-5km.json), [nouveau trajet](mission-26-2-evidence/Chauvigny-foot-21km-foot.json) dépasse le point ; corrigé localement |
| Préparation et reconstruction | Normales synchrones, lots statiques et LOD lointains reconstruits | Normales exactes incrémentales, réutilisation de LOD, cache de contact par frame/révision, mesures par étape | [Bancs et limites](mission-26-2-evidence/performance-summary.json) ; absence de gel non certifiée |
| Arbres flottants / colliders incohérents | Ancien support lors du raffinement et arbres inférés sur voies | Réancrage au mesh courant, exclusions des infrastructures, index spatial ; matériau libéré | [Tests](mission-26-2-evidence/checks/tests.txt), film de forêt ; perception PARTIELLE |
| Trafic bloquant les deux sens | Positions centrales et approximation circulaire | Voies à droite si largeur suffisante, empreintes complètes et support rendu fini | [Essais auto](mission-26-2-evidence/journey-summary.json) ; longs trajets encore non atteints |
| Tremblement / vol qui se recale | Tangentes différentes aux clés et vitesse finale non nulle entre perchoirs | Courbes périodiques et transfert à vitesse finale nulle ; dérivées analytiques | [Métriques](mission-26-2-evidence/candidate-motion.json) et films natifs ; perception non acquise |
| Reprise avant chargement | Support du joueur / véhicule garé pas encore prêt | Attente des deux supports, statut terrain explicite | [Reprises](mission-26-2-evidence/journeys.json) ; voyage intermodal complet ouvert |
| Aucun nouveau parcours aquatique | Admission de berge/support, sélection de station parfois impossible | Diagnostics distincts et calcul local borné, aucun droit ni fond mesuré inventé | [Quatre secteurs](mission-26-2-evidence/department-water.json) ; NON ATTEINT |

## 3. Les 22 scénarios d’acceptation

Les preuves gardent leur SHA propre ; une réussite partielle ou un test de noyau ne vaut pas satisfaction du scénario complet.

| ID | Statut | Résultat et limites | Preuves |
| --- | --- | --- | --- |
| T01 — Angles → limite historique → retour | ATTEINT | Aller-retour sélectionné de 2,377 km via le contrôleur complet accéléré ; franchit la frontière du pilote mais reste dans une seule tuile globale. Les autres sorties ne sont pas toutes réparées. | [spawn-Vicq-return-foot.json](mission-26-2-evidence/spawn-Vicq-return-foot.json) · [seam-strips.json](mission-26-2-evidence/seam-strips.json) |
| T02 — Angles → trois tuiles départementales | NON_ATTEINT | Aucune sortie depuis le vrai spawn vers trois tuiles validée. Le parcours Chauvigny ne remplace pas ce départ. | [spawn-SaintPierre-foot.json](mission-26-2-evidence/spawn-SaintPierre-foot.json) · [blockage-probe.json](mission-26-2-evidence/blockage-probe.json) |
| T03 — Marche intercommunale ≥20 km | PARTIEL | 12 966,98 m mesurés, 5 tuiles. Le seuil de 20 km et l'arrivée complète ne sont pas validés ; arrêt du banc pendant une attente de support. | [Chauvigny-foot-21km-foot.json](mission-26-2-evidence/Chauvigny-foot-21km-foot.json) · [journey-summary.json](mission-26-2-evidence/journey-summary.json) |
| T04 — Hors route et cinq refus | PARTIEL | Sept petites marches de 8,07 m sur huit candidats explicitement ouverts ; plage sans placement admis. Refus privés/inconnus/rail/autoroute/conditionnels testés au niveau unitaire, pas cinq promenades filmées. | [access.json](mission-26-2-evidence/access.json) · [tests.txt](mission-26-2-evidence/checks/tests.txt) |
| T05 — Voiture ≥40 km et sortie à pied | NON_ATTEINT | Maximum automobile mesuré : 3 882,77 m. Aucun voyage complet de 40 km avec sortie et marche validé. | [Vallee-car-40km-car.json](mission-26-2-evidence/Vallee-car-40km-car.json) · [Chauvigny-furthest-connected-source-car.json](mission-26-2-evidence/Chauvigny-furthest-connected-source-car.json) |
| T06 — Voiture ≥80 km | NON_ATTEINT | Aucune traversée automobile de 80 km exécutée avec succès ; les longueurs de graphe ne sont pas comptées. | [routes-selection.json](mission-26-2-evidence/routes-selection.json) · [journey-summary.json](mission-26-2-evidence/journey-summary.json) |
| T07 — Voiture + marche native multi-tuile | NON_ATTEINT | Pas de film natif continu de ce scénario. Les clips indépendants et trajets accélérés ne s’additionnent pas pour le satisfaire. | [candidate-native.json](mission-26-2-evidence/candidate-native.json) · [journey-summary.json](mission-26-2-evidence/journey-summary.json) |
| T08 — Nouveau packraft 1 | NON_ATTEINT | Aucun nouveau corridor départemental avec approche, ≥1 km, sortie et fond admis validé. | [department-water.json](mission-26-2-evidence/department-water.json) |
| T09 — Nouveau packraft 2 | NON_ATTEINT | Aucun deuxième secteur et suivi automatique départemental complet validé. | [department-water.json](mission-26-2-evidence/department-water.json) |
| T10 — Nouveau packraft 3 | NON_ATTEINT | Aucun troisième secteur, rebase et sauvegarde fluviale départementale validé. | [department-water.json](mission-26-2-evidence/department-water.json) |
| T11 — Marche naturelle 180 s | PARTIEL | Courbes et appuis mesurés sur 180 s synthétiques. Les racines imposées du banc ne sont pas un parcours. Pas de revue humaine suffisante des changements de terrain. | [reference-motion.json](mission-26-2-evidence/reference-motion.json) · [candidate-motion.json](mission-26-2-evidence/candidate-motion.json) · [candidate-native.json](mission-26-2-evidence/candidate-native.json) |
| T12 — Course consécutive 180 s, plat/pente, quatre angles | PARTIEL | Métriques numériques plat/pente et clip natif frontal conservés avec durée de course réellement observée. Les quatre angles, la pente native et l’acceptation perceptive restent incomplets. | [reference-motion.json](mission-26-2-evidence/reference-motion.json) · [candidate-motion.json](mission-26-2-evidence/candidate-motion.json) · [reference-native.json](mission-26-2-evidence/reference-native.json) · [candidate-native.json](mission-26-2-evidence/candidate-native.json) |
| T13 — Oiseaux et son, proche/loin, caméra fixe/mobile | PARTIEL | Transfert C1 entre perchoirs et dérivées analytiques corrigés. Film de station et audio natifs, sans validation humaine ni cadence matérielle significative. | [candidate-native.json](mission-26-2-evidence/candidate-native.json) · [audio-analysis.json](mission-26-2-evidence/audio-analysis.json) · [tests.txt](mission-26-2-evidence/checks/tests.txt) |
| T14 — Troncs, ombres, saisons et vent | PARTIEL | Arbres réancrés et ressources nettoyées ; pas de campagne complète d’approche et de revue perceptive des ombres/LOD. | [candidate-native.json](mission-26-2-evidence/candidate-native.json) · [tests.txt](mission-26-2-evidence/checks/tests.txt) |
| T15 — Performance des trois profils avec streaming | PARTIEL | Bancs logiciels comparables et cas ratés publiés. Ni absence de gel long, ni borne de non-régression ≤5 %, ni objectifs matériels 60/30 validés. | [reference-benchmarks.json](mission-26-2-evidence/reference-benchmarks.json) · [candidate-benchmarks.json](mission-26-2-evidence/candidate-benchmarks.json) · [performance-summary.json](mission-26-2-evidence/performance-summary.json) |
| T16 — Train multi-tuile et arrêt | NON_ATTEINT | Aucun nouveau cycle natif multi-tuile et arrêt certifié. Les modèles historiques conservés ne remplacent pas cet essai. | [audit.json](mission-26-2-evidence/audit.json) |
| T17 — Avion près de Poitiers-Biard | NON_ATTEINT | Aucun cycle natif significatif piste/altitude/son recertifié. | [audit.json](mission-26-2-evidence/audit.json) |
| T18 — Carte et route en déplacement | PARTIEL | 2/2 contrôles UI réussis, desktop et émulation tactile, worker et route source. Le voyage mobile complet avec rebase et reprise reste ouvert. | [map-ui.json](mission-26-2-evidence/map-ui.json) · [routes-audit.json](mission-26-2-evidence/routes-audit.json) |
| T19 — Voyage intermodal et reprises | PARTIEL | 6/6 cas indépendants réussis : reprises, rechargements réels et refus contrôlé. Pas de voyage intermodal continu complet. | [journeys.json](mission-26-2-evidence/journeys.json) · [fixture.json](mission-26-2-evidence/fixture.json) |
| T20 — Endurance et évictions 30–60 min | NON_ATTEINT | Des évictions sont observées pendant la marche accélérée ; pas de session native continue de 30–60 minutes avec tous les sous-systèmes à cadence native. | [journey-summary.json](mission-26-2-evidence/journey-summary.json) · [candidate-benchmarks.json](mission-26-2-evidence/candidate-benchmarks.json) |
| T21 — Fixture hors France | ATTEINT | Fixture synthétique 47° N/−71°, même runtime/loader/rendu/contact/graphe/reprise : 2,5 km, frontière et support exact. Ce n’est pas une randonnée réelle ni un film natif. | [fixture.json](mission-26-2-evidence/fixture.json) · [fixture.png](mission-26-2-evidence/fixture.png) |
| T22 — Préservation M23–M26.1 | PARTIEL | 437 tests et compilation ; audit des sources protégées. Les activités historiques sont conservées mais la totalité des essais natifs antérieurs n’est pas rejouée. | [tests.txt](mission-26-2-evidence/checks/tests.txt) · [build.txt](mission-26-2-evidence/checks/build.txt) · [audit.json](mission-26-2-evidence/audit.json) · [baseline-inventory.json](mission-26-2-evidence/baseline-inventory.json) |

## 4. Les cinq P0 historiques

| P0 | Statut | Avant / après et acceptation |
| --- | --- | --- |
| Tremblement humain | PARTIEL | Tangentes périodiques communes et enveloppe de portée adoucie ; gains numériques localisés, acceptation humaine non acquise. [reference-motion.json](mission-26-2-evidence/reference-motion.json) · [candidate-motion.json](mission-26-2-evidence/candidate-motion.json) · [candidate-native.json](mission-26-2-evidence/candidate-native.json) |
| Oiseaux | PARTIEL | Vitesse nulle aux extrémités des transferts et dérivées analytiques ; pas de preuve de fluidité matérielle. [candidate-native.json](mission-26-2-evidence/candidate-native.json) · [tests.txt](mission-26-2-evidence/checks/tests.txt) |
| Troncs / popping | PARTIEL | Réancrage des arbres et suppression de reconstructions lointaines inutiles ; approche perceptive complète non validée. [candidate-native.json](mission-26-2-evidence/candidate-native.json) · [tests.txt](mission-26-2-evidence/checks/tests.txt) |
| Ombres | NON_ATTEINT | Aucune correction perceptive des quatre défauts d’ombres certifiée ; comportement hérité et films de station conservés. [reference-native.json](mission-26-2-evidence/reference-native.json) · [candidate-native.json](mission-26-2-evidence/candidate-native.json) |
| Suivi de rivière | NON_ATTEINT | Diagnostic des berges amélioré ; aucun nouveau voyage départemental complet. [department-water.json](mission-26-2-evidence/department-water.json) |

Les comparaisons numériques portent sur 24 cas de rig (six cadences, marche/course, plat/pente) de 180 s. Les racines y sont imposées ; ces distances ne sont jamais ajoutées aux voyages. Les dérivées d’accélération/jerk sont des différences finies de vitesse angulaire scalaire, pas des vecteurs signés. Aucun spectre fréquentiel complet ni jugement humain de disparition du tremblement n’est revendiqué.

## 5. Carte de vérité du département

[Carte SVG](mission-26-2-evidence/truth-map.svg) · [GeoJSON 2D](mission-26-2-evidence/truth.geojson) · [Sources et droits](mission-26-2-data.md). Les 499 packs fins (1 407 876 165 octets) et les données historiques sont conservés. Leur couverture n’est pas une permission de passage. Le bleu gris montre la couverture de données, l’ambre les permissions candidates, les pointillés les plans de routes, le vert uniquement les déplacements mesurés et le rouge les arrêts. Le violet signale les secteurs fluviaux non validés. **Aucune nouvelle tranche de rivière n’est peinte comme navigable.**

Sept marches de huit mètres ne certifient pas toute la surface des polygones ouverts. Les accès inconnus, privés et ouvrages non vérifiés restent contrôlés. La complétude légale des tags conditionnels/barrières du corpus n’est pas garantie. Les données source, règles inférées et objets de simulation sont décrits séparément dans le document de données.

## 6. Voyages réellement effectués

| Essai | Distance physique | Temps mur / simulé | Tuiles distinctes | Résultat |
| --- | --- | --- | --- | --- |
| [spawn-Vicq-return-foot](mission-26-2-evidence/spawn-Vicq-return-foot.json) (58ba496050f7) | 2 376,82 m | 100,98 s / 1 653,00 s | 131:1617 | terminé |
| [spawn-SaintPierre-foot](mission-26-2-evidence/spawn-SaintPierre-foot.json) (86f29a947850) | 961,60 m | 732,83 s / 672,25 s | 131:1617 | incomplet |
| [Chauvigny-foot-21km-foot](mission-26-2-evidence/Chauvigny-foot-21km-foot.json) (58ba496050f7) | 12 966,98 m | 1 294,25 s / 10 604,50 s | 125:1615, 125:1616, 126:1613, 126:1614, 126:1615 | incomplet |
| [Chauvigny-furthest-connected-source-car](mission-26-2-evidence/Chauvigny-furthest-connected-source-car.json) (edf0ab1caee5) | 145,01 m | 22,30 s / 61,75 s | 126:1613 | incomplet |
| [Vallee-car-40km-car](mission-26-2-evidence/Vallee-car-40km-car.json) (58ba496050f7) | 3 882,77 m | 194,07 s / 746,75 s | 126:1614 | incomplet |

Les placements de départ hors Angles sont explicites avant chaque essai indépendant. Le départ sélectionné Angles conserve le véritable spawn. Aucun repositionnement après collision n’est utilisé pendant un voyage. Les coordonnées, commandes, refus, propriétaires physiques, streaming et rebases sont dans les traces brutes et le [résumé](mission-26-2-evidence/journey-summary.json). Leurs altitudes locales anciennes ne doivent pas être lues comme altitudes IGN69 absolues.

L’essai de 12,97 km est interrompu par la garde de non-progression du banc pendant une attente du support suivant (`tile-loading`) ; il n’atteint pas la limite cumulative de 600 s de chargement. Il ne démontre pas une impossibilité géographique. Le wrapper de reproduction distingue désormais cette attente du manque de progrès, mais aucun kilomètre supplémentaire n’est revendiqué sans nouvel essai. Le point d’arrêt exact, la voie, les tuiles et la première obstruction restent consultables.

Les 27 bandes de couture sont indépendantes et utilisent le noyau de déplacement au pas de 60 Hz : 25/27 réussissent dans la cohorte 58ba496050f7. Elles ne remplacent pas un voyage multi-tuile. L’audit historique de 938 bords fins porte sur les mêmes données conservées ; ce n’est pas 938 nouveaux franchissements physiques.

## 7. Performance honnête

Machine distante, Chromium/SwiftShader, aucun `/dev/dri`, aucun ordinateur à GPU physique et aucun Android physique testés. Les 60/30 FPS cibles restent **non validés**. Mesures natives sans encodeur, framebuffer 640×420 DPR 1, mêmes profils, graine, date et effets actifs avec audio. Les stations sont comparables ; les déplacements et l’historique de préparation peuvent diverger. Les matrices de caméra ne sont pas exportées dans ces snapshots ; des presets identiques ne constituent pas une identité stricte des scènes. Les échantillons de 20 s sont courts et ne certifient pas un P99 robuste ni une non-régression ≤5 %.

Plus grande durée de pas de préparation observée dans les snapshots du candidat : **820,30 ms**. Ces dépassements restent des défauts ouverts ; ils ne sont pas masqués par une moyenne de FPS.

| Profil / scène | P50 ms réf. → cand. | P95 ms réf. → cand. | P99 ms réf. → cand. | Max ms réf. → cand. | FPS réf. → cand. |
| --- | --- | --- | --- | --- | --- |
| eco / forest | 466,60 → 633,30 | 883,30 → 866,60 | 883,30 → 950,00 | 883,30 → 950,00 | 1,99 → 1,67 |
| eco / bridge | 949,90 → 983,20 | 1 816,70 → 1 516,60 | 1 816,70 → 1 516,60 | 1 816,70 → 1 516,60 | 1,04 → 0,98 |
| eco / river | 900,00 → 866,60 | 1 416,60 → 1 483,20 | 1 416,60 → 1 483,20 | 1 416,60 → 1 483,20 | 1,06 → 1,10 |
| eco / Poitiers | 216,60 → 216,60 | 350,00 → 566,80 | 399,90 → 816,60 | 399,90 → 816,60 | 4,39 → 3,97 |
| eco / car | 1 216,70 → 983,30 | 2 033,30 → 1 483,30 | 2 033,30 → 1 483,30 | 2 033,30 → 1 483,30 | 0,72 → 0,98 |
| eco / boat | 483,30 → 483,30 | 600,00 → 583,20 | 733,30 → 583,40 | 733,30 → 583,40 | 2,03 → 2,05 |
| eco / map | 599,90 → 516,70 | 933,20 → 849,90 | 983,40 → 916,60 | 983,40 → 916,60 | 1,63 → 1,86 |
| balanced / forest | 666,60 → 650,00 | 966,70 → 899,90 | 1 400,00 → 1 066,60 | 1 400,00 → 1 066,60 | 1,37 → 1,47 |
| balanced / bridge | 1 333,30 → 1 250,00 | 1 966,50 → 1 949,90 | 1 966,50 → 1 949,90 | 1 966,50 → 1 949,90 | 0,69 → 0,76 |
| balanced / river | 1 300,00 → 1 133,30 | 1 666,60 → 1 316,70 | 1 666,60 → 1 316,70 | 1 666,60 → 1 316,70 | 0,76 → 0,87 |
| balanced / Poitiers | 383,30 → 383,30 | 616,60 → 533,30 | 733,30 → 650,00 | 733,30 → 650,00 | 2,44 → 2,52 |
| balanced / car | 1 616,60 → 1 383,40 | 1 983,30 → 1 499,90 | 1 983,30 → 1 499,90 | 1 983,30 → 1 499,90 | 0,63 → 0,72 |
| balanced / boat | 666,70 → 683,30 | 716,70 → 883,30 | 750,00 → 1 016,60 | 750,00 → 1 016,60 | 1,48 → 1,42 |
| balanced / map | 683,30 → 700,00 | 1 050,10 → 833,30 | 1 099,90 → 1 049,80 | 1 099,90 → 1 049,80 | 1,41 → 1,41 |
| quality / forest | 699,90 → 666,70 | 1 033,30 → 1 016,70 | 1 133,30 → 1 099,90 | 1 133,30 → 1 099,90 | 1,33 → 1,39 |
| quality / bridge | 1 350,00 → 1 333,20 | 1 400,00 → 1 583,30 | 1 400,00 → 1 583,30 | 1 400,00 → 1 583,30 | 0,74 → 0,75 |
| quality / river | 1 366,50 → 1 433,20 | 2 016,60 → 2 766,50 | 2 016,60 → 2 766,50 | 2 016,60 → 2 766,50 | 0,71 → 0,57 |
| quality / Poitiers | 466,60 → 466,80 | 566,60 → 799,90 | 933,40 → 833,30 | 933,40 → 833,30 | 2,06 → 2,02 |
| quality / car | 1 866,60 → 1 483,30 | 2 616,50 → 1 799,90 | 2 616,50 → 1 799,90 | 2 616,50 → 1 799,90 | 0,53 → 0,66 |
| quality / boat | 683,30 → 716,60 | 966,60 → 899,90 | 1 050,00 → 900,00 | 1 050,00 → 900,00 | 1,38 → 1,36 |
| quality / map | 833,30 → 766,70 | 1 183,30 → 899,90 | 1 483,30 → 1 150,00 | 1 483,30 → 1 150,00 | 1,16 → 1,28 |

Les cas ratés restent dans les JSON ; une ligne sans mesure ne signifie pas 0 ms. Les [mesures brutes](mission-26-2-evidence/candidate-benchmarks.json) et le [résumé](mission-26-2-evidence/performance-summary.json) exposent aussi les tâches longues et étapes de préparation >8/>50 ms, les maxima, le heap et les miroirs CPU de géométrie. Le budget de 96 MiB ne compte que la géographie décodée. Il exclut GPU/pilote, pic worker, index de routage et objets du pilote. Ces compteurs se recouvrent et ne doivent pas être additionnés comme mémoire totale. Le temps d’attente d’une marche accélérée n’est pas un gel de frame natif.

Les [pics de préparation par étape](mission-26-2-evidence/preparation-peaks.json) conservent les dépassements >8/>50 ms sans additionner les compteurs cumulés répétés. Ces durées utilisent performance.now autour du pas du générateur ; elles incluent d’éventuels GC et délais d’ordonnancement et ne sont pas des compteurs de cycles CPU. Les attentes réseau, cadence logicielle et allocations non mesurées restent distinguées.

## 8. Fidélité artistique et sonore

Les films de marche/course, forêt, départ réel et bateau du pilote sont consultables côte à côte dans la galerie. Leur faible cadence logicielle reste visible. Le son vient du mixage stéréo original, sans musique ajoutée. Les paquets et SHA sont conservés ; [analyse audio](mission-26-2-evidence/audio-analysis.json). Une analyse numérique ne remplace pas l’écoute. Aucune revue humaine indépendante des paysages, arbres, ombres, oiseaux ou sons n’a été réalisée.

Le relief fin et le bâti source sont conservés ; largeur des routes, hauteurs sans tags, arbres et habitat restent inférés. Les stations couvertes sont celles des captures réellement produites, pas une certification des 265 communes. Pas de nouvelle série photographique de référence, de diversité complète des biomes, de service ferroviaire ou de cycle avion validé. Le fond des rivières reste une reconstruction de jeu de faible confiance, sans bathymétrie mesurée ni garantie de sécurité.

## 9. Préservation, licences et Git

**437 tests passent**, TypeScript et Vite compilent. [Logs](mission-26-2-evidence/checks/tests.txt), [build](mission-26-2-evidence/checks/build.txt), [audit des fichiers protégés](mission-26-2-evidence/audit.json) et [fichiers de programme modifiés](mission-26-2-evidence/source-changes.json). Les modifications intentionnelles du corpus public concernent le graphe dérivé `land.pack`/`land.json` et le manifeste de fixture ; les 499 packs fins, les monuments, sources et assets du pilote sont conservés. Les workflows ne sont pas modifiés. Les preuves et échecs M26.1 restent consultables à leurs chemins d’origine.

Référence : `d6a906cd7546a4cd8e85226efff64436e53ea200`. Programme candidat exécuté : `58ba496050f7541a63599c28a1a553f7f0b453e9`. Les [reçus exacts](mission-26-2-evidence/builds/candidate-final/receipt.json) conservent les bundles et les SHA code/données ; les commits de livraison ultérieurs concernent les scripts et documents. La référence exportée n’invente pas de SHA Git dans le HUD lorsqu’elle n’est pas dans un checkout Git ; le reçu fixe son origine.

La même [PR brouillon 38](https://github.com/sebastienleidgens-lab/endless-earth/pull/38) consolide M25.2 + M26 + M26.1 + M26.2. Les têtes M25.2 et son merge sont ancêtres de la branche, mais absentes de `main` vérifié. `main` initial : `01e791be64cefae2eb1e90ab465f9bf0b848c33e`. Aucun merge, aucun déploiement et aucun achat ; coût ajouté **0 €**. IGN Licence Ouverte 2.0, OSM ODbL et attributions audio/matériaux historiques conservés. Les grands packs ne sont pas dupliqués par build ; les médias natifs livrés sont indexés sans réencoder les images.

## 10. Registre des défauts résiduels

[Registre structuré géolocalisé](mission-26-2-evidence/residual-defects.json) et points rouges de la carte. Priorités P0 : départ d’Angles vers trois tuiles, fin de la marche de 20 km, voiture longue distance, nouveaux corridors fluviaux, perception humain/oiseaux/troncs/ombres. Les blocages exacts sont liés aux traces, GPS, sources et tuiles disponibles ; les coordonnées absentes sont signalées, jamais inventées.

La sortie Saint-Pierre bute près de l’eau cartographiée (46,702437 / 0,878446) ; l’essai automobile de Chauvigny s’arrête au premier carrefour (46,572314 / 0,649579). Le nouvel essai automobile en vallée s’arrête à 3,883 km (46,577320 / 0,631644), sur `osm:way:927245732`, avec le refus `road-height-discontinuity` ; la cause précise de la différence de support reste à résoudre, sans relever le seuil pour forcer le passage. Deux bandes restent incomplètes : `osm:way:450089955`, `osm:way:757440678`. Le refus final des deux bandes est `steep-support` : pente normale du support reconstruite à environ 84,5 % / 84,6 %, au-dessus du seuil de 70 %, même si la pente dans la direction du pas est moindre. Vérifier le raccord et sa géométrie source avant de modifier ce seuil ou le terrain. Inspecter aussi la source d’accès et la propriété du mesh. Les frontières historiques et les rues du pilote ne sont pas réécrites pour forcer la réussite.

Les refus de berge de Chauvigny/Châtellerault sont diagnostiqués ; La Roche-Posay et Vauchiron ont aussi des échecs de sélection de départ. Ils ne prouvent pas l’inaccessibilité naturelle de toutes leurs berges. Les cinq critères P0 restent explicitement dans l’acceptance. P1 : campagne matérielle, endurance native 30–60 min, trajet mobile avec carte/rebase/reprise, revue artistique/audio et train/avion.

## 11. Décision suggérée

**Conserver la PR en brouillon, non prête à fusionner.** Les corrections et les preuves partielles sont livrées en un seul dossier ; les critères manquants restent ouverts. Aucun accord intermédiaire, fusion ou mise en production n’a été effectué.
