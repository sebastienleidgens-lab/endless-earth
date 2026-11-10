# Mission 09 — Le monde vivant

Version jouable livrée en PR brouillon sur la base fusionnée f11f165 (PR #15). Aucune fusion ni mise en production.

## Audit initial

Mission 08.6 possède déjà : feuillage proche en shader (deux sinusoïdes, phase par instance), lointain statique ; détails nature précalculés avec natureBend ; 2 500 arbres instanciés avec LOD/culling ; eau intégrée à la surface avec rides de couleur, sans courant vérifié ; 60 lobes de nuages mis à jour à 10 Hz, translation x avec rebouclage ; quatre oiseaux suivant un cycle identique de perchoir/vol ; soleil astronomique, météo interpolée sur 45 s, date et saison ; Soundscape synthétique unique avec vent, eau, pas et appels rares. Pas d'ombres de nuages. Deux réglages graphiques high/low. Les décorations progressives 08.6 ont des caches et une file bornés : ils sont conservés.

Les captures avant modification utilisent le worktree détaché f11f165, port 5176. Les shaders et effets ne modifient aucune donnée géographique.

## Architecture livrée

Les modules `src/earthlife/` séparent les modèles purs du rendu :

| Module | Responsabilité |
| --- | --- |
| `wind.mjs` | Champ continu, direction dominante, variations lentes, fronts de rafale, turbulence ; calcul CPU/GPU équivalent |
| `state.mjs` | Références d'uniformes partagées et composition des récepteurs d'ombre avec les shaders existants |
| `clouds.mjs`, `cloud-layer.ts` | Même champ de densité pour le ciel et sa projection solaire ; une grille de 48 × 48 quads (24 × 24 en Éco), sans texture |
| `fauna.mjs`, `fauna-render.ts` | Fenêtres déterministes, vol seul/couple/groupe, plané/traversée rapide, virage analytique, fondu et enveloppe de sécurité |
| `events.mjs`, `micro-events.ts` | Calendrier irrégulier, calme temporaire, feuilles automnales proches et annulation par distance |
| `habitat.mjs` | Index spatial des habitats cartographiés, priorités et trous conservés ; inconnu reste inconnu |
| `budget.mjs`, `preferences.ts` | Un budget pour le monde visible, libération par propriétaire, changement de profil, plafonds des réglages personnalisés |
| `water.mjs` | Courant visuel et éclats mobiles, rides entraînées par le vent, atténuation à distance |

`naturalSky` reste l'orchestrateur de l'heure, du soleil et de la météo déjà présents. Il fournit les mêmes références aux modules autonomes. `main.ts` raccorde les données chargées, le réglage existant et Soundscape. Il n'existe ni gestionnaire d'animation par arbre, ni boucle d'événements indépendante par tuile.

Le temps avance avec le temps de simulation existant (pas borné à 250 ms lors d'une image longue). La graine de rendu est fixée à 9 ; les modèles purs acceptent une graine explicite. Le vent utilise les coordonnées métriques continues, sans arrondi aux cellules. Les phases spatiales empêchent les arbres de bouger ensemble. Le vecteur est converti dans le repère de chaque instance avant déformation : orientations et échelles différentes conservent la même direction mondiale, sans animation CPU par arbre. Le feuillage proche reçoit le champ complet ; Éco utilise une sinusoïde simple sur les feuillages proches ; ses troncs et couronnes éloignées restent statiques. Les couronnes éloignées des autres profils emploient une sinusoïde simple. Les branches du maillage de tronc ont une faible flexion, nulle à la base. Les positions d'instances, ancrages et collisions restent stables. Les herbes et fougères utilisent les attributs existants : `natureBend` fixe les points d'attache ; la palette de fougère existante permet une réponse plus lente, sans ajouter un attribut à tous les blocs précalculés. Cette identification par palette est une limite à remplacer par une métadonnée explicite lors d'une prochaine version du format.

Les matériaux de terrain, végétation, eau et architecture composent leur personnalisation avec le récepteur d'ombre. Le champ est évalué aux sommets en coordonnées du monde, puis interpolé sur les triangles : son échelle lente permet d’éviter les sinus par pixel. L’opacité est appliquée après interpolation du champ brut, avec un simple smoothstep dans le fragment, ce qui limite les différences entre LOD fins et éloignés. Les frontières partagent leurs sommets, donc ne créent pas de raccord par tuile. La couche visible emploie une grille de 48 × 48 quads avec le même échantillonnage ; les ombres et les nuages ont une correspondance approchée, limitée par leur interpolation géométrique. La projection suit le soleil, tient compte de la hauteur du récepteur et s'éteint progressivement sous l'horizon. Les clones de matériaux sont traités individuellement via WeakSet. Aucune shadow map supplémentaire n'est calculée.

Les oiseaux sont des silhouettes, au-dessus de l'enveloppe maximale des bâtiments et du terrain chargés : une marge de 12 m est ajoutée à l'enveloppe, puis le vol commence au moins 12 m plus haut (24 m au total). Leur propriétaire spatial reste stable au franchissement d'une cellule ; un fondu à 240–350 m précède son remplacement à 360 m. Il n'y a pas de simulation physique ni de recherche de chemin par oiseau. Une période de vol peut rester vide. Les événements proches sont abandonnés après un déplacement de 45 m, et les propriétaires libèrent leurs allocations lors des changements de profil et du démontage.

## Réutilisation et provenance

Les neuf MNT LiDAR, les 878 polygones normalisés et leurs sources IGN/ASP/OSM sont inchangés. La régénération hors navigateur produit les mêmes 2 500 recettes d'arbres, ancrages architecturaux et 318 blocs (base statique comprise), avec les mêmes empreintes de buffers. Seules les empreintes du code générateur dans le manifeste sont mises à jour. Le rapport de préparation Mission 09 est séparé des preuves 08.6. Aucun téléchargement de nouvelle géographie ni nouvelle espèce n'a été introduit.

La latitude/longitude viennent du site fourni à `naturalSky`, la saison et l'heure du modèle solaire existant, les habitats des données fusionnées et leur index, l'altitude de l'enveloppe géométrique chargée. La météo et le vent sont simulés ; aucune station météo réelle n'est connectée. Aucun climat local n'est inféré faute de source. Les feuilles sont autorisées dans les boisements/ripisylves en automne, avec saisons inversées dans l'hémisphère sud. Les oiseaux sont réduits en hiver, absents la nuit, sous forte pluie ou en habitat inconnu. Les affinités d'habitat sont des interprétations artistiques, sans affirmation de présence d'une espèce.

La direction du courant `(0,38 ; −0,925)` dans le repère local est une approximation artistique non vérifiée. Elle ne représente ni débit, ni vitesse hydrologique, ni bathymétrie ou niveau mesuré. Les remous sont des déformations de bandes de couleur, sans détecteur de berges ni calcul d'écoulement. Les reflets sont des éclats de shader, sans réflexion de la scène ni rendu PBR. Les contours OSM/IGN et la surface unique restent inchangés : aucun sommet d'eau n'est déplacé et aucune surface concurrente n'est ajoutée.

Les nuages restent une couche simulée à 230 m dans le repère vertical local, avec un transport atmosphérique dominant cohérent avec celui du vent au sol. Il n'y a pas de volume, de précipitations géométriques ou de source météo réelle. Le relief et les façades ne deviennent pas des observations d'ombres réelles.

## Profils et budget mondial

| Plafond / paramètre | Éco | Équilibré | Qualité |
| --- | ---: | ---: | ---: |
| Amplitude végétale | 0,55 | 1 | 1 |
| Détail fin du feuillage | 0 | 0,45 | 1 |
| Intensité des détails d'eau | 0,5 | 0,8 | 1 |
| Opacité des nuages | 0,7 | 1 | 1 |
| Atténuation maximale des ombres | 0 | 10 % | 15 % |
| Oiseaux actifs maximum | 2 | 6 | 9 |
| Particules proches maximum | 0 | 8 | 16 |
| Événements maximum | 1 | 2 | 3 |
| Fréquence CPU faune/événements | 5 Hz | 10 Hz | 10 Hz |

Le gestionnaire borne l'ensemble des propriétaires du monde visible. L'implémentation actuelle exploite un seul groupe de vol et un seul événement proche simultané : les plafonds d'événements supérieurs sont une réserve, pas une promesse d'effets supplémentaires. Neuf objets Line et un tampon fixe de seize points sont réservés une fois. Les autres éléments sont animés analytiquement en shader. Le surcoût maximal est de onze draw calls (neuf oiseaux, une couche de nuages, un lot de feuilles), trois matériaux et zéro texture ; le plus souvent, seuls les nuages sont dessinés. Les anciens nuages et oiseaux sont remplacés, donc ces valeurs ne sont pas toutes un ajout net par rapport à 08.6. Aucun matériau supplémentaire par arbre ou par cellule.

Le profil Personnalisé réutilise le même contrôle graphique et propose végétation, courant, nuages, ombres, oiseaux et événements. Couper les nuages coupe aussi leurs ombres. La sélection manuelle désactive l'adaptation automatique existante ; le démarrage Équilibré peut basculer vers Éco ou Qualité après la fenêtre de mesure initiale. Les distances LOD et la géographie demeurent celles des réglages existants high/low. Éco utilise une eau à une seule onde, une grille de nuages réduite et omet le calcul des ombres. Les éclats et le courant détaillés sont réservés aux autres profils.

Soundscape conserve son contexte unique et ses synthèses originales (vent, eau, pas, appels rares). Le vent sonore suit maintenant le champ partagé et les calmes temporaires. Un volume d'ambiance complète l'activation et la coupure existantes, sans démarrage audio automatique et sans enregistrement externe. Les appels sonores existants ne constituent pas une vocalisation synchronisée avec chaque silhouette.

## Revue artistique et preuves

[Galerie interactive locale](mission-09-captures/comparaison.html) : deux colonnes avant/après, séquences animées ou images fixes. Les deux versions utilisent les mêmes caméras, date solaire (`2026-06-21T12:00:00Z`), fenêtres simulées, météo et paramètres de profil. Les caméras et instants sont vérifiés par `report-earthlife.mjs`, sans comparaison de pixels supposés identiques entre versions.

| Comparaison | Séquence 08.6 | Séquence 09 |
| --- | --- | --- |
| Forêt calme | [avant](mission-09-captures/before-foret-calme.webp) | [après](mission-09-captures/after-foret-calme.webp) |
| Rafale | [avant](mission-09-captures/before-foret-rafale.webp) | [après](mission-09-captures/after-foret-rafale.webp) |
| Arbres proches | [avant](mission-09-captures/before-arbres.webp) | [après](mission-09-captures/after-arbres.webp) |
| Herbes | [avant](mission-09-captures/before-herbes.webp) | [après](mission-09-captures/after-herbes.webp) |
| Oiseau isolé | [avant](mission-09-captures/before-oiseau-isole.webp) | [après](mission-09-captures/after-oiseau-isole.webp) |
| Petit groupe | [avant](mission-09-captures/before-oiseaux-groupe.webp) | [après](mission-09-captures/after-oiseaux-groupe.webp) |
| Rivière | [avant](mission-09-captures/before-riviere.webp) | [après](mission-09-captures/after-riviere.webp) |
| Berge | [avant](mission-09-captures/before-berge.webp) | [après](mission-09-captures/after-berge.webp) |
| Nuages | [avant](mission-09-captures/before-ciel.webp) | [après](mission-09-captures/after-ciel.webp) |
| Ombres | [avant](mission-09-captures/before-ombres.webp) | [après](mission-09-captures/after-ombres.webp) |
| Vue aérienne | [avant](mission-09-captures/before-aerienne.webp) | [après](mission-09-captures/after-aerienne.webp) |
| Mobile Éco | [avant](mission-09-captures/before-mobile.webp) | [après](mission-09-captures/after-mobile.webp) |

Chaque séquence contient huit rendus. La végétation, les oiseaux et l'eau couvrent quatre secondes simulées ; ciel, ombres et vue aérienne couvrent 32 secondes avec une lecture accélérée ×8 pour rendre le déplacement lent visible. Ce sont des échantillons de mouvement, pas un enregistrement temps réel ni une mesure de FPS. Les contrôles sont masqués pour l'art sur ordinateur, avec badge et attributions conservés, et reste visible pour la vue mobile. La station d'herbes est une caméra d'inspection à 25 cm du sol. Les fenêtres de rafale et de vol sont trouvées dans le calendrier naturel déterministe : aucune apparition forcée et aucun contournement d'habitat.

La revue a conduit à déplacer les cadrages masqués par des troncs ou le relief, réorienter la berge vers l'eau et renforcer légèrement les éclats proches. Le mouvement est volontairement faible et lointain simplifié ; les grands glissements d'ombre apportent davantage à l'ambiance que l'ajout d'objets. L'aspect polygonal des arbres et bâtiments demeure celui de 08.6. Les ombres lissent leur raccord grâce au champ mondial, mais restent une modulation artistique de toute la lumière reçue, sans séparation exacte lumière directe/indirecte.

## Validation fonctionnelle

- 126 tests JavaScript réussis : données/provenance, architecture, navigation et collisions, caches, LOD, streaming, déchargement, identité et dix tests EarthLife.
- Deux tests Python réels (`import-mnt.test.py`, `normalize-mnt.test.py`) réussis dans un environnement local contenant NumPy, rasterio et pyproj. La découverte générique unittest ne reconnaissait pas leurs noms ; les fichiers ont été exécutés directement.
- TypeScript strict et production Vite réussis. Le message existant sur la taille du bundle (>500 ko) reste présent.
- Les tests EarthLife vérifient la continuité et la détermination du vent, la projection des ombres, les périodes vides et trajectoires des oiseaux, l'éligibilité saisonnière, les plafonds entre 500 cellules, les clones de matériaux, les visites répétées et la libération des ressources réelles Three.js.
- Le navigateur compile les shaders réels, teste les quatre profils et le réglage personnalisé, observe vols seuls/couples/groupes et feuilles automnales, vérifie la hauteur de sécurité, l'immobilité des matrices d'arbres aux changements LOD, le volume zéro, la suspension audio et la conservation d'un contexte unique.
- Douze créations/destructions de la couche naturelle reviennent à dix objets racines et un contrôle d'atmosphère. Les listeners de test sont annulés au démontage. Les ressources de chaque module sont libérées ; les tests existants continuent de vérifier les évictions de détails.
- Dix-neuf scénarios de données absentes, périmées ou corrompues réussis : relief, surface, eau, environnement, bords et décorations. Les chemins dégradés restent explicites.
- Smoke navigateur : trois caméras, mouvement, stabilité à l'arrêt, hauteur d'œil, activation audio, ouverture des réglages et viewport mobile réussis ; les changements effectifs des quatre profils sont vérifiés par le test EarthLife distinct.
- Sécurité de promenade : cinq obstacles injectés pendant le déplacement (bâtiment, accès privé, eau, mur, ruine) arrêtent la marche avant franchissement ; chaque position échantillonnée est légale.
- `npm audit` : zéro vulnérabilité signalée, dépendances de développement comprises. Aucun secret, média téléchargé ni nouvel appel réseau n'est ajouté par EarthLife.

Les premiers relevés exploratoires ont été distingués des mesures finales. L’inspection des processus Chromium a montré des zombies inactifs : leur pourcentage CPU historique ne prouve aucune concurrence. Les timers GPU partiellement non résolus ont été retirés du protocole principal. Les premières tentatives locales ont rencontré des dépendances absentes, un cache Vite partagé entre worktrees et une erreur de terminaison de préambule GLSL ; elles ont été corrigées avant les preuves finales. Chaque worktree possède maintenant un cache Vite distinct. Les erreurs et mesures finales sont conservées dans les JSON de preuve ; les journaux de travail ne sont pas présentés comme résultats réussis.

## Mesures et promenade

Les valeurs finales sont détaillées dans `mission-09-captures/summary.json`, avec traces brutes dans `benchmark.json` et `walk-*/walk.json`. Le protocole compare trois passages isolés alternés avant/après, six stations, quinze rendus synchronisés par station et version. Les temps synchronisés incluent `finish/readPixels` et ne sont pas des durées GPU matérielles. Les mises à jour d'atmosphère sont mesurées séparément. Les intervalles et le CPU de la boucle réelle sont recueillis après échauffement sur le viewport mobile Éco.

| Station / profil | 08.6 médiane synchronisée | 09 médiane synchronisée | Écart |
| --- | ---: | ---: | ---: |
| Village · Qualité | 421.9 ms | 603.3 ms | +43.0 % |
| Forêt proche · Qualité | 249.5 ms | 346.5 ms | +38.9 % |
| Rivière · Qualité | 224.7 ms | 305.2 ms | +35.8 % |
| Vue aérienne · Qualité | 478.7 ms | 472.4 ms | -1.3 % |
| Éco ordinateur | 249.4 ms | 260.9 ms | +4.6 % |
| Mobile Éco émulé | 123.9 ms | 152.1 ms | +22.8 % |

Les chiffres regroupent 45 échantillons synchronisés par station et version (15 × 3 passages). Le rendu logiciel régresse sur plusieurs vues : ce coût n’est pas masqué par une réduction de géographie. Le déplacement des sinus vers les sommets et les chemins Éco simplifiés limitent le travail, sans démontrer un gain de FPS. Les passages présentent une forte dispersion. Les essais intermédiaires et de timer GPU sont conservés séparément et ne sont pas mélangés à ce tableau.

Chargement local médian : 9.003 → 8.720 s, trois pages neuves par version ; maxima 11.241 → 12.168 s. Cette différence n’établit pas un gain de démarrage en production.

| Boucle réelle · mobile Éco à l’arrêt | 08.6 | 09 |
| --- | ---: | ---: |
| Intervalle d’image p50 | 124.8 ms | 156.6 ms |
| Intervalle d’image p95 | 153.6 ms | 447.3 ms |
| Intervalle d’image p99 | 186.8 ms | 623.8 ms |
| Intervalle d’image max | 219.5 ms | 755.3 ms |
| CPU avant soumission p50 | 7.6 ms | 9.5 ms |
| CPU avant soumission p95 | 24.9 ms | 32.3 ms |
| CPU avant soumission p99 | 26.3 ms | 123.7 ms |
| CPU avant soumission max | 30.2 ms | 192.9 ms |
| Soumission CPU p50 | 1.5 ms | 1.8 ms |
| Soumission CPU p95 | 4.1 ms | 16.5 ms |
| Soumission CPU p99 | 17.7 ms | 29.6 ms |
| Soumission CPU max | 19.4 ms | 52.3 ms |

Cette courte trace comprend 120 images par version (40 × 3), après dix images d’échauffement. Elle conserve les pics, notamment les intervalles longs et le CPU p99 plus élevé de Mission 09. Les marches complètes ci-dessous constituent un scénario distinct et plus long.

La mise à jour entière d’atmosphère mesurée séparément a un p95 de 0,1–0,2 ms sur les stations ; plusieurs valeurs sont quantifiées à 0,1 ms par le navigateur. Le temps synchronisé comprend le rendu, le pilote logiciel et la lecture des pixels : il ne peut pas être attribué exclusivement à EarthLife ni assimilé au temps d’un GPU matériel. L’essai aérien sans ombres donne 471,0 ms médians, contre 472,4 ms avec ombres ; la dispersion ne permet pas d’en isoler précisément le coût. L’extension de timer GPU est annoncée par SwiftShader, mais plusieurs requêtes restent indisponibles : aucune estimation matérielle n’est publiée.

Les draw calls sont stables dans cinq stations (80, 102, 161, 98 et 54 selon la vue), et passent de 125 à 124 au village. Les triangles baissent de 192 dans les vues Qualité, et de 1 248 en Éco : seules les représentations atmosphériques ont changé. Les arbres, bâtiments, terrain et routes restent identiques. Les nombres actifs de faune et d’événements sont conservés dans les traces ; neuf objets CPU sont réservés en Éco, dix dans les autres profils, sans boucle CPU par arbre.

| Promenade réelle, même route | 08.6 | 09 |
| --- | ---: | ---: |
| Distance mesurée image par image | 450.000000 m | 450.000000 m |
| Durée murale de marche | 403.6 s | 458.2 s |
| Images mobiles dans la trace | 1679 | 1581 |
| CPU avant soumission p50 | 8.1 ms | 8.9 ms |
| CPU avant soumission p95 | 24.3 ms | 27.6 ms |
| CPU avant soumission p99 | 40.0 ms | 45.7 ms |
| CPU avant soumission max | 104.4 ms | 106.2 ms |
| Intervalle d’image p50 | 221.6 ms | 272.8 ms |
| Intervalle d’image p95 | 472.0 ms | 575.1 ms |
| Intervalle d’image p99 | 670.5 ms | 860.1 ms |
| Intervalle d’image max | 1039.1 ms | 1258.6 ms |
| Soumission CPU p50 | 1.8 ms | 1.9 ms |
| Soumission CPU p95 | 8.4 ms | 8.4 ms |
| Soumission CPU p99 | 19.4 ms | 18.8 ms |
| Soumission CPU max | 1029.7 ms | 1106.4 ms |

Les deux marches atteignent effectivement 450 m sans téléportation au lancement. Elles passent les gestes de zoom, le pincement et les trois caméras ; l’architecture est générée une seule fois. Le pincement est testé sur une zone du canvas dégagée du nouveau panneau de réglages. La limite de pas de simulation de 250 ms, conservée, explique qu’un rendu logiciel plus lent allonge la durée murale. Les mêmes 23 blocs sont demandés, décodés et installés dans les deux versions, avec les mêmes 2 978 046 octets demandés, 15 annulations, zéro échec et zéro résultat périmé.

Heap JavaScript maximal observé : 195.58 → 196.95 Mo. Ce n’est pas le RSS du navigateur ni une mesure de fuite sur plusieurs heures. Les pics de décodage CPU du streaming sont de 3,1 → 1,2 ms, d’installation 1,6 → 0,7 ms et de tick 2,5 → 2,3 ms ; le maximum de récupération/décodage mural passe en revanche de 126,5 à 324,3 ms. Ces variations ne sont pas attribuées à une optimisation du chargeur, qui est conservé. Aucun déchargement nécessaire n’a été observé sur ce trajet monotone : les tests de retour/éviction/démontage distincts restent indispensables.

| Mémoire retenue, scène et caches amorcés | 08.6 | 09 |
| --- | ---: | ---: |
| Géométrie + instances · village | 37.974 Mo | 38.094 Mo |
| Géométrie + instances · foret | 33.870 Mo | 33.990 Mo |
| Géométrie + instances · eco | 30.854 Mo | 30.974 Mo |
| Textures source + mipmaps estimées · forêt | 12.094 Mo | 12.094 Mo |
| Textures téléversées · forêt | 7 | 7 |

L’audit inclut les matrices/couleurs d’instances, les géométries retenues hors écran et les textures des matériaux et uniformes compilés. Il ne mesure pas la VRAM du pilote. Les tampons des deux grilles de nuages (48 et 24 quads par côté) restent bornés ; aucune texture nouvelle n’est ajoutée. Les valeurs détaillées par station, matériaux et résidences sont dans `memory-validation.json`.

Sur douze créations/destructions supplémentaires de la couche naturelle : création CPU médiane 3.15 ms, maximum 6.60 ms ; destruction CPU médiane 0.20 ms, maximum 1.30 ms. Ces cycles sans compilation GPU supplémentaire vérifient le démontage et les allocations CPU, pas la libération instantanée de VRAM.

Les quatre fichiers `realtime-*-foret.webm` et `realtime-*-mobile-eau.webm` contiennent six secondes murales de la boucle normale avant/après, après chargement. Aucun pas de simulation manuel ni interpolation d’image n’est utilisé. Ils complètent les échantillons WebP et montrent les limites du rendu logiciel.

Les mesures finales ont été recueillies sur le code `39d6381` ; les correctifs suivants concernent la coupure des effets personnalisés (eau zéro et nuage masqué) et ne changent pas les réglages comparés. Le test de pixels vérifie deux images identiques lorsque l’eau est coupée, puis deux images différentes après réactivation. Les résultats de timer GPU exploratoires ne sont pas utilisés dans les tableaux.

## Limites et extension mondiale

Pas de mesure sur GPU matériel ou véritable téléphone Android : SwiftShader est un moteur logiciel ; aucune promesse de 60 FPS. Les mesures de mémoire géométrique et texture comptent les buffers/atlases connus et ne sont pas une mesure de VRAM totale. L'API de timer GPU est signalée lorsqu'elle est disponible ; aucun temps GPU matériel n'est déduit du CPU.

Les papillons et un système distinct de feuilles détachées des couronnes ne sont pas ajoutés ; les points de feuilles sont une suggestion proche et saisonnière. Les remous ne connaissent pas la distance exacte aux berges. Les nuages sont une couche horizontale et les ombres une projection approximative. Le vent n'est pas une donnée météo mesurée. L'animation normale n'a pas été remplacée par les rendus de preuve.

Les modules ne dépendent pas d'Angles : ils consomment site, temps, état météo, classes d'habitat et repère métrique commun. Leur budget appartient au monde visible et permet plusieurs propriétaires géographiques sans multiplier les plafonds. Pour un globe avec changement d'origine et hauts reliefs, il faudra fournir un repère global stable/rebasé et une hauteur de couche nuageuse adaptée ; l'implémentation actuelle conserve le repère métrique et le datum vertical local du pilote. Les futurs véhicules pourront conserver les champs atmosphériques et l'eau, avec les détails proches soumis au même budget ; aucun mode voiture/avion jouable n'est annoncé ici.

## Reproduction et livraison

- Base : `f11f165783931ed8f631af7365d42ca3e6de94f7`, fusion de la PR #15 vérifiée via GitHub et Git.
- Branche : `mission/09-monde-vivant`. Une seule [PR en brouillon #16](https://github.com/sebastienleidgens-lab/endless-earth/pull/16), vers `main`.
- Démarrage : `npm ci`, `npm run dev -- --port 5173`. Baseline détachée au port 5176 avec son propre cache Vite.
- Vérification : `npm test`, les deux fichiers Python, `npm run build`, `node scripts/browser-earthlife-runtime.mjs`, `node scripts/browser-earthlife-data.mjs`, smoke et safety existants.
- Images : `node scripts/browser-earthlife.mjs before`, puis `after`. Mesures : `node scripts/benchmark-earthlife.mjs`. Marches : `node scripts/browser-earthlife-walk.mjs before`, puis `after`. Synthèse : `node scripts/report-earthlife.mjs`.
- Le rapport sélectionné dans `package.json` donne l'identité « ENDLESS EARTH — Mission 09 : Le monde vivant » ; le badge conserve le vrai commit Git et indique explicitement les sources modifiées et l'environnement. La production est vérifiée séparément sur quatre résolutions.

Aucune fusion, modification directe de `main` ou mise en production.
