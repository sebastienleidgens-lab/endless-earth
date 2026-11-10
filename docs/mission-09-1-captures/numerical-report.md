## Résultats reproductibles

Trois passages par état, ordre alterné/rotatif, un seul navigateur de test, mêmes sept caméras et date solaire du 21 juin. Références immuables : 08.6 `f11f165`, 09 `c3f4b7c` ; code optimisé `2712c3e`. 36 rendus synchronisés par station et état, après chargement des détails. La soumission CPU, `finish/readPixels` et la boucle normale sont distingués. Tous les échantillons, y compris les pics, sont conservés. Équilibré n’existait pas en 08.6 : cette colonne emploie son ancien mode haut.

| Station / profil | 08.6 | 09 | 09.1 | Écart 09.1 / 09 |
| --- | ---: | ---: | ---: | ---: |
| Village · Qualité | 421.4 ms | 454.9 ms | 454.9 ms | +0.0 % |
| Forêt · Qualité | 244.7 ms | 337.2 ms | 264.6 ms | -21.5 % |
| Rivière · Qualité | 214.1 ms | 306.3 ms | 247.8 ms | -19.1 % |
| Aérienne · Qualité | 430.0 ms | 506.5 ms | 435.2 ms | -14.1 % |
| Forêt · Équilibré | 258.9 ms | 284.0 ms | 271.6 ms | -4.4 % |
| Éco ordinateur | 235.3 ms | 269.3 ms | 224.8 ms | -16.5 % |
| Mobile Éco émulé | 124.8 ms | 142.9 ms | 122.4 ms | -14.3 % |

Le gain est démontré sur ces rendus logiciels pour six stations, particulièrement Éco et mobile. Le village ne progresse pas. L’écart Équilibré reste faible au regard de la dispersion. Le mobile revient près du niveau 08.6 avec les fonctions de vie conservées ; ce résultat ne prouve aucun gain sur GPU matériel ou Android physique. Les premières mesures de dépistage (`screening.json`) sont séparées et ne remplacent pas les trois passages finaux.

| Boucle normale mobile · p50 / p95 / p99 / max | 08.6 | 09 | 09.1 |
| --- | ---: | ---: | ---: |
| Intervalle (ms) | 126.8 / 264.6 / 346.0 / 495.5 | 149.4 / 280.3 / 317.1 / 370.8 | 122.7 / 243.9 / 315.4 / 503.0 |
| CPU avant soumission (ms) | 8.0 / 22.5 / 40.1 / 159.6 | 8.5 / 24.8 / 35.1 / 39.4 | 8.5 / 13.8 / 27.8 / 28.0 |
| Soumission GL CPU (ms) | 1.6 / 4.5 / 20.4 / 45.2 | 1.6 / 4.7 / 19.5 / 20.2 | 1.6 / 4.1 / 16.3 / 18.6 |

120 images par état (40 × 3, après dix d’échauffement). Le maximum d’intervalle mobile augmente de 370,8 à 503,0 ms : les médianes et p95 meilleurs ne suppriment pas tous les à-coups. CPU médian inchangé à 8,5 ms. Ces courts passages ne démontrent pas une amélioration de chaque quantile ou de chaque session.

| Chargement local | 08.6 | 09 | 09.1 |
| --- | ---: | ---: | ---: |
| Médiane / maximum (ms) | 8272 / 8400 | 8296 / 11392 | 7970 / 8534 |

| Station | Draw calls 09 → 09.1 | Triangles 09 → 09.1 | CPU atmosphère p95 / max 09 → 09.1 (ms) |
| --- | ---: | ---: | ---: |
| Village · Qualité | 124 → 124 | 245971 → 245971 | 0.3 / 1.5 → 0.2 / 1.2 |
| Forêt · Qualité | 80 → 80 | 147212 → 147212 | 0.1 / 0.5 → 0.1 / 0.8 |
| Rivière · Qualité | 102 → 102 | 169780 → 169780 | 0.2 / 2.3 → 0.1 / 0.7 |
| Aérienne · Qualité | 161 → 161 | 271075 → 271075 | 0.2 / 4.7 → 0.1 / 2.3 |
| Forêt · Équilibré | 80 → 80 | 147212 → 147212 | 0.1 / 1.0 → 0.1 / 1.0 |
| Éco ordinateur | 98 → 98 | 158706 → 158706 | 0.1 / 1.5 → 0.1 / 3.5 |
| Mobile Éco émulé | 54 → 54 | 114453 → 114453 | 0.1 / 0.7 → 0.1 / 0.2 |

Les appels et triangles sont identiques entre 09 et 09.1 dans les sept vues. Le chronomètre CPU est quantifié vers 0,1 ms : aucun gain de quelques microsecondes n’est affirmé. Les mesures d’atmosphère comprennent le ciel historique et EarthLife ; les spans imbriqués ne sont pas additionnables. Les quantiles de soumission et rendu synchronisé, par station et par passage, sont dans `summary.json` et `benchmark.json`.

## Coûts isolés avant optimisation

| Variante diagnostique 09 | Forêt | Rivière | Mobile | Scène active automnale |
| --- | ---: | ---: | ---: | ---: |
| full-start | 327.4 ms | 339.1 ms | 246.2 ms | 421.4 ms |
| trees | 270.7 ms | 241.5 ms | 126.0 ms | 428.8 ms |
| grass | 367.1 ms | 355.4 ms | 253.5 ms | 524.9 ms |
| branches | 264.4 ms | 253.0 ms | 142.6 ms | 470.7 ms |
| water | 238.7 ms | 217.2 ms | 115.0 ms | 403.9 ms |
| clouds | 462.9 ms | 261.0 ms | 130.0 ms | 454.9 ms |
| shadows | 257.4 ms | 244.2 ms | 119.6 ms | 454.2 ms |
| birds | 260.3 ms | 234.0 ms | 135.6 ms | 731.6 ms |
| events | 311.9 ms | 316.4 ms | 158.1 ms | 590.9 ms |
| cpu | 407.6 ms | 268.2 ms | 176.7 ms | 1023.9 ms |
| full-end | 281.0 ms | 274.9 ms | 135.7 ms | 456.0 ms |

Six rendus par case ; références complètes encadrantes. Les suppressions sont expérimentales, non livrées. La forte dérive entre début et fin interdit d’en déduire neuf coûts causaux indépendants. Les scènes oiseaux/événements contiennent réellement six oiseaux et un événement ; leurs suppressions parfois plus lentes ne sont pas présentées comme un gain. Les branches, le champ spatial et l’eau justifient des expériences de simplification algébrique, vérifiées ensuite par les passages alternés complets. Les champs de nuages visibles et projetés utilisent le même GLSL ; densité, fréquence, projection solaire et grilles restent identiques. Aucun coût précis des ombres n’est établi par ces seules ablations.

## Pics CPU extérieurs et compromis au chargement

| Audit instrumenté | 09 | 09.1 |
| --- | ---: | ---: |
| Mise à jour atmosphère, max | 15.4 ms | 2.4 ms |
| Construction graphe, max | 3292.9 ms | 3625.8 ms |
| Construction nature, max | 45.1 ms | 73.1 ms |
| LOD nature, max | 2.9 ms | 4.2 ms |
| LOD architecture, max | 1.9 ms | 3.8 ms |
| Envoi buffers GL, max | 1.7 ms | 4.0 ms |

Audit séparé : CDP CPU, tâches longues et spans de startup puis quatre fenêtres de mouvement. Le graphe absorbe environ 3,3–3,6 secondes au chargement ; le réduire est hors du périmètre EarthLife. Les longues tâches incluent aussi rendu logiciel, construction initiale et mises à jour de visibilité. Nature démarre ici plus lentement (45,1 → 73,1 ms) : le précalcul statique déplace une petite charge à l’initialisation. 981 → 1 156 appels bufferData et 11 → 17 programmes liés dans cet audit instrumenté : les variantes économisent du travail actif au prix de compilation/VAO supplémentaires. Ces observations ne sont pas mélangées aux rendus synchronisés. Profils CDP compressés et tous les spans bruts sont conservés.

Douze créations/destructions de la couche atmosphérique : création médiane/max 3.05/5.40 ms ; destruction 0.15/1.50 ms. Nombre d’objets et contrôles identique après démontage. Les matériaux se désinscrivent à dispose ; les tests unitaires vérifient le registre. Les caches de LOD restent bornés, les matrices d’arbres inchangées après déplacements et retours.
