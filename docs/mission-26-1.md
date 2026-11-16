# Mission 26.1 — Continuité et fidélité de la Vienne

**Livraison consolidée partielle — PR #38 en brouillon, fusion non prête.** Aucun merge, déploiement, changement de workflow de production ou achat. Ce rapport est l’unique synthèse propriétaire ; la [galerie HTML autonome](mission-26-1-evidence/index.html), la [matrice par exigence](mission-26-1-evidence/acceptance.json), l’[architecture](mission-26-1-architecture.md) et les [sources](mission-26-1-data.md) en donnent le détail.

## Résumé exécutif

Le pilote historique reste disponible avec ses activités. La Vienne possède maintenant un dérivé IGN effectif à 2 m chargé à la demande, des préparations coopératives/worker, des supports issus des triangles affichés, une origine de rendu et de son intégrée, du routage sur les vrais nœuds OSM et des sauvegardes canoniques enrichies. Un voyage natif de 24 min 32 s a quitté Angles par la route de Vicq puis est revenu : 2.397 km enregistrés, sans repositionnement ni erreur JavaScript/shader. Il franchit l’ancien propriétaire pilote mais reste dans une seule tuile départementale de 4 km. Le contrôleur accéléré fournit une preuve indépendante, distincte.

**Cela ne constitue pas encore le Travel Simulator départemental demandé.** Les traversées intercommunales complètes, trois nouvelles navigations, la locomotion perceptivement corrigée, les transports comme services et la fluidité matérielle restent ouverts. La politique hors pilote admet surtout les couloirs routiers publics ; elle n’implémente pas encore une liberté générale sur les terrains publics. Les forêts et bâtiments départementaux restent des reconstructions simples. L’absence actuelle d’accès aquatique n’est pas une preuve d’impossibilité des sources ou du territoire.

## Base Git, consolidation et version exécutée

La référence exécutable M26 est `de3958c6c55b9ef9856d5809b14ef3d41ed8e4b5`. Le code final effectivement compilé et testé est `1f676fb4aaf1824d15b8c04a83d95af0f11055be` ; les données fines sont épinglées à `acb0a73b396229bf90731b90a558a8d5d072a9ec`. Les [bundles réellement exécutés](mission-26-1-evidence/builds/candidate-final/receipt.json) sont archivés avec leurs SHA. Les commits ultérieurs d’outillage/documentation n’autorisent pas à attribuer rétroactivement les films à une autre version.

`origin/main` vérifié vaut `01e791be64cefae2eb1e90ab465f9bf0b848c33e`. #36 est fusionnée dans main. #37 est aussi fusionnée, mais dans la branche M25.1 : son merge `5fe6e792f34369926854b649a5b631426b7037c4` et sa tête M25.2 `110b4548aa32297e837874cb6a9a6353c4d1f94b` sont ancêtres de cette branche, absents de main. La PR consolidée apporte donc aussi M25.2. [Preuve d’ascendance](mission-26-1-evidence/git-ancestry.json). La même branche `mission/26-vienne-planet-engine` et la même PR #38 sont conservées.

Les premières prises corrigées portent `4acde98`, les reprises de course et le contrôleur de sortie `78b6ef6`, les contrôles aquatiques/origine/reprise `9d6d0d6`, les reprises bateau/carte et le voyage natif `1f676fb`. Les dernières corrections concernent le graphe sans berge, la fermeture manquante du fragment shader de rides/sillage et le dessin de carte (emprise visible, simplification d’affichage sous 0,8 px, cibles 44 px et défilement). Elles ne changent ni le rig, ni le mouvement terrestre, ni les triangles des films terrestres antérieurs. Chaque fichier conserve sa version exacte. Les premières tentatives à shaders invalides ou streaming incomplet sont conservées dans `failed-attempts`. Le film de référence bateau qui montre le défaut historique reste explicitement marqué en échec dans la galerie ; il ne valide aucun critère visuel positif.

## Résultats par chantier : M26 → M26.1

| Chantier | Référence M26 | Édition consolidée | État |
|---|---|---|---|
| Relief départemental | Contact généralement à 128 m | 499 dérivés à 2 m, lacunes explicites, parent 16/128 m | PARTIEL pour la fidélité globale |
| Couture | Départ/retour non démontrés | Intersections exactes du pilote, support du triangle routier affiché, 24/27 passages courts aller-retour | PARTIEL |
| Préparation | Lots urbains jusqu’à environ 2,06 s rapportés | Décodage worker, accusés de lots, file cible 3 ms, graphe pilote sérialisé | PARTIEL : des lots >50 ms subsistent |
| Coordonnées | Origine surtout isolée | Rendu/audio intégrés, physique Float64 et saves WGS84 | PARTIEL : repère métrique régional hérité |
| Navigation/carte | Outil local incomplet | Index source compact, distances réelles, mode marche/voiture, gares et couverture | PARTIEL |
| Reprise | Bateau/camp/voiture partiels | Cas indépendants marche, voiture garée/occupée, camp et bateau pilote réussis | PARTIEL : chaîne complète non démontrée |
| Eau nouvelle | Hydrographie visible, pas de corridor | Trois secteurs inspectés, zéro accès admis ; refus et coûts exportés | NON ATTEINT pour les trois parcours |
| Transports | Incomplets | Gares officielles, agents source, arrêts synthétiques, circuit aérien | PARTIEL, aucun service passager livré |

## Les cinq bugs P0

| Bug | Cause observée / correction | Preuve | État |
|---|---|---|---|
| Oiseaux | Échantillonnage analytique M26 conservé ; préparation réduite autour | Films appariés et tests de phase, très bas FPS | PARTIEL ; fluidité non confirmée |
| Voyageur | Pics numériques résiduels ; les filtrages dégradant le pied planté ont été retirés. Rig/gait inchangés face à M26 | 4/8/30/60/120 Hz et dt irréguliers simulés, films de course | NON ATTEINT pour la correction perceptive |
| Troncs / clipping | Caster commun : vrai tronc détaillé, branches intermédiaires et feuillage conservés | Test de géométrie, images et films appariés | PARTIEL |
| Ombres globales | Composition idempotente des shaders clonés et repère canonique corrigés ; politique de filtrage M26 conservée | Trois profils et rebases, films fixes | PARTIEL ; soleil/saisons/GPU physique incomplets |
| Packraft | Physique et contacts historiques conservés ; fragment shader des rides/sillage réparé, cache et reprise du pilote | Reprise, films bateau et benchmark actif pilote | PARTIEL ; aucun nouveau suivi prolongé |

Les diagnostics de rotations/contacts ne remplacent pas une revue humaine. Les films à quelques images par seconde ne permettent pas d’affirmer « naturel » ou « fluide ». Le profil Éco conserve sa politique historique sans ombre solaire ; aucun nouvel effet n’a été retiré pour faire passer les chiffres.

## Vérité du département

| Mesure | Résultat et portée |
|---|---|
| Couverture de base | 499 tuiles, 265 communes, emprise préparée M26 ~7 025,633 km² ; pas une certification de chaque lieu |
| Relief fin acquis | 499 packs, 1,407,876,165 octets compressés ; pas effectif 2 m |
| Valeurs fines disponibles | 98.4408 % des échantillons des carrés complets, marges comprises ; **pas un pourcentage de superficie détaillée de la Vienne** |
| Lacunes et bords | 0 pack absent ; 938 bords communs, maximum 0.010 m, 0 échec de seuil |
| Précision | Quantification ≤0,005 m, différente de l’erreur du relevé. Dates du pilote non extrapolées au département |
| Axes source dans l’union des tuiles | 29974.676 km de lignes source dédupliquées et clippées ; routes, pistes et sentiers, emprise et marges. Inventaire préparé, pas un compte des images affichées |
| Rail source dans l’union des tuiles | 987.620 km, actifs/inactifs compris avant politique |
| Longueur admise par politique topologique | Marche 26586.677 km ; voiture 15060.777 km ; rail 714.964 km. Chaque arête source clippée est comptée une fois, directions non doublées ; validation topologique, pas un certificat physique |
| Kilomètres effectivement visibles par frame | Non inventoriés ; ne pas remplacer cette mesure par le nombre de lignes du corpus |
| Physiquement parcouru | Voir les trajets ci-dessous ; les kilomètres de graphe ne sont jamais déclarés parcourus |
| Eau | Contours OSM et fond de jeu estimé, confiance faible ; 0 nouveau secteur navigué dans cette édition |
| Gares | 60 UIC uniques, 24 marqués voyageurs dans la source SNCF ; pas un service temps réel ni des quais certifiés |

Le repli RGE 128 m reste déclaré aux nodata fins. La définition de 2 m est celle du dérivé du service numérique IGN ; elle ne certifie ni chaque façade, ni la couverture native à 0,5 m. Les 30 rasters natifs autour d’Angles, les neuf empreintes historiques et 49 métadonnées WFS sont des références locales conservées, pas des packs historiques réécrits.

## Trajets réels, refus et méthode

Le noyau réel de marche a effectué **1189.36 m à l’aller et 1174.84 m au retour** vers la sortie Route de Vicq. Simulation accélérée à pas explicite, collisions conservées, aucun changement direct de position pendant la traversée. La préparation et les détours sont exportés. Ce parcours montre une sortie/retour à l’ancienne frontière ; il ne montre pas une grande traversée du département. [Trace du contrôleur](mission-26-1-evidence/angles-west-final.json).

Le voyage natif est complété ; voir [film](mission-26-1-evidence/angles-native-departure.webm) et [trace](mission-26-1-evidence/angles-native-departure.json).

La trace native comprend 3712 frames, 1472.27 s observées et 2396.97 m locaux (2392.99 m en EPSG:2154). Le joueur franchit la limite protégée puis revient ; une seule tuile départementale canonique `131:1617` est parcourue. Il atteint le but du conducteur d’entrées, puis s’arrête naturellement à 0.226 m du départ après inertie, sans réparation de position. Le temps d’export/indexation est séparé dans `totalJobWallSeconds`. Le climat/saisons complets de toutes les variantes ne sont pas validés par ce seul voyage.

Le premier itinéraire source essayé s’arrêtait après 238,16 m. Un autre essai s’arrêtait à 1 159,73 m près de l’ancienne frontière : le refus utilisait la pente brute du raster, différente du triangle routier affiché. Le contrôle prend maintenant le même support affiché, sans aplanir le raster ni ouvrir les ouvrages. Les échecs antérieurs sont conservés. Les passages courts restant non complétés dans la dernière campagne sont : osm:way:58716176, osm:way:450089955, osm:way:757440678. Plusieurs sondes peuvent concerner la même voie ; ce ne sont pas 27 voyages distincts.

L’index départemental contient 770,632 nœuds, 1,587,630 arêtes dirigées et 74,765 voies source. Toutes ses longueurs d’arête correspondent à leurs extrémités métriques dans l’[audit](mission-26-1-evidence/routes-audit.json). Un itinéraire calculé Chauvigny–Châtellerault n’est pas une preuve que le contrôleur automobile l’a terminé. Les ponts/niveaux inconnus restent fermés. Aucun grand trajet A10 n’est déclaré atteint.

### Course native : durée réellement observée

Deux vrais segments source du pilote : `osm:way:35478466` (233,74 m, amplitude verticale 0,73 m) et `osm:way:1236532386` (202,63 m, amplitude 15,54 m). Voiture témoin garée sur une chaussée vérifiée avant l’enregistrement, collision conservée. Le runtime livré plafonne dt à 0,25 s : sous bas FPS, le temps simulé et la distance avancent moins vite que le temps mural. La durée de classification course reste native, sans changer ce runtime pour la preuve. Les comparaisons ont la même configuration initiale et le même parcours ; la progression différente interdit une comparaison image à image au même point. Les reprises de 220 s corrigent des fenêtres initiales dont les premières/dernières images ne couvraient pas 180 s. Aucun cumul de passages en marche n’est utilisé.

| Version | Surface | Vue | Plus longue course native observée |
|---|---|---|---|
| reference | run-flat | front | 180.88 s · 0.36 FPS · de3958c |
| reference | run-flat | rear | 182.13 s · 0.91 FPS · de3958c |
| reference | run-flat | left | 218.42 s · 0.38 FPS · de3958c |
| reference | run-flat | right | 181.83 s · 0.61 FPS · de3958c |
| reference | run-terrain | front | 180.79 s · 0.29 FPS · de3958c |
| reference | run-terrain | rear | 183.01 s · 1.06 FPS · de3958c |
| reference | run-terrain | left | 183.30 s · 0.75 FPS · de3958c |
| reference | run-terrain | right | 181.02 s · 0.25 FPS · de3958c |
| candidate | run-flat | front | 181.48 s · 0.72 FPS · 4acde98 |
| candidate | run-flat | rear | 183.41 s · 1.24 FPS · 4acde98 |
| candidate | run-flat | left | 212.61 s · 0.22 FPS · 78b6ef6 |
| candidate | run-flat | right | 182.40 s · 0.44 FPS · 4acde98 |
| candidate | run-terrain | front | 207.57 s · 0.26 FPS · 78b6ef6 |
| candidate | run-terrain | rear | 183.44 s · 0.89 FPS · 4acde98 |
| candidate | run-terrain | left | 181.15 s · 0.72 FPS · 4acde98 |
| candidate | run-terrain | right | 177.61 s · 0.26 FPS · 4acde98 |

**La vue droite sur pente ne passe pas le critère** : 177,61 s dans la première campagne, 98,78 s et 24,91 m avant arrêt dans la reprise. Le blocage n’est pas isolé ; le scénario reste en échec, sans suppression de collision ni cumul de marche. Le SHA est indiqué pour chaque prise. Les séquences sont des enregistrements natifs du canvas et de l’AudioContext. Le [résumé](mission-26-1-evidence/native-summary.json) distingue distances locales physiques et distances recalculées en EPSG:2154. Les traces WGS84 sont dérivées exactement du repère historique ; aucune frame manquante n’est reconstruite.

### Nouveaux secteurs aquatiques inspectés

Placements diagnostiques sur routes source **avant** inspection ; aucun kilomètre de bateau déduit de ces placements. Préparation d’au moins une vraie frame avant de laisser travailler les files. Le graphe attend désormais la fin de découverte des berges et devient explicitement vide s’il n’existe aucune sortie vérifiée. Il ne passe plus plus de 100 s CPU à relier une eau inutilisable sans berge, comme dans une tentative antérieure.

| Secteur | Coordonnées demandées | Accès admis | Candidats refusés | Résultat |
|---|---|---|---|---|
| Chauvigny · Vienne | {'lat': 46.565, 'lon': 0.641} | 0 | 2840 | no-verified-bank-access |
| Chatellerault · Vienne | {'lat': 46.815, 'lon': 0.541} | 0 | 1961 | no-verified-bank-access |
| La Roche-Posay · Creuse | {'lat': 46.786, 'lon': 0.815} | 0 | 1604 | no-verified-bank-access |

Les accès, la cohérence de rive et les supports restent limitants dans cette implémentation. Aucun pont inconnu n’a été ouvert et aucune bathymétrie mesurée n’est prétendue. Les portails entre tuiles/bassins et la navigation départementale prolongée restent à construire/valider.

## Sauvegardes et session

Les saves v2 gardent WGS84/IGN69, cap, activité, véhicule garé/occupé, camp, état du bateau, profil, climat, caméra, carte et route. La migration v1 conserve le document original et son repère déclaré. Les tuiles et activités sont vérifiées avant restitution ; un refus ne relocalise pas le joueur. Les couches de carte sont comparées comme un ensemble, leur ordre d’insertion n’étant pas un changement d’état.

| Cas indépendant compilé | Résultat |
|---|---|
| walking-map-profile-reload | réussi dans la portée du cas |
| parked-car | réussi dans la portée du cas |
| occupied-car-reload | réussi dans la portée du cas |
| camp-reload | réussi dans la portée du cas |
| boat-reload | réussi dans la portée du cas |
| unsupported-activity-controlled-refusal | réussi dans la portée du cas |

[Reçus de reprise](mission-26-1-evidence/journeys.json). Ces cas utilisent de vrais reloads lorsqu’indiqués. Ils ne constituent pas la chaîne native géographiquement continue marche → voiture → camp → bateau → reprise, ni une validation exhaustive de tous les champs, de la nage, du suivi actif et du hors-ligne. La reprise assise non prise en charge est explicitement refusée.

## Performances : résultats logiciels et limites

Bench séquentiel isolé, sans MediaRecorder ni profiler CPU, viewport et **framebuffer réels 640 × 420, DPR 1**, son actif, seed/date/profil/caméra contrôlés. Les périodes de démarrage sont séparées. Les films ont leur coût de capture et ont aussi subi la contention des campagnes parallèles : leurs FPS ne sont pas substitués au bench isolé. Les temps CPU observés incluent les appels driver ; l’extension de timer GPU est détectée, mais aucun temps GPU séparé fiable n’est publié. Ce point reste non vérifié.

| Version | Scène / profil | Frames | P50 / P95 / P99 ms | Max ms | FPS natifs | Contrôle |
|---|---|---|---|---|---|---|
| candidate | forest / eco | 34 | 550.1 / 1349.9 / 1433.2 | 1433.2 | 1.78 | valide dans sa portée |
| candidate | bridge / eco | 38 | 500.0 / 566.7 / 633.3 | 633.3 | 2.00 | valide dans sa portée |
| candidate | river / eco | 60 | 300.1 / 516.6 / 716.6 | 716.6 | 3.09 | valide dans sa portée |
| candidate | forest / balanced | 26 | 733.3 / 966.6 / 1050.0 | 1050.0 | 1.35 | valide dans sa portée |
| candidate | bridge / balanced | 26 | 733.2 / 950.0 / 966.6 | 966.6 | 1.37 | valide dans sa portée |
| candidate | river / balanced | 40 | 483.3 / 716.6 / 800.0 | 800.0 | 2.03 | valide dans sa portée |
| candidate | forest / quality | 25 | 766.7 / 833.3 / 849.9 | 849.9 | 1.34 | valide dans sa portée |
| candidate | bridge / quality | 24 | 783.4 / 983.3 / 1149.9 | 1149.9 | 1.28 | valide dans sa portée |
| candidate | river / quality | 38 | 500.0 / 583.3 / 750.0 | 750.0 | 2.00 | valide dans sa portée |
| candidate | active-car / eco | 54 | 333.3 / 516.7 / 566.6 | 566.6 | 2.83 | valide dans sa portée |
| candidate | active-car / balanced | 21 | 950.0 / 1450.0 / 1533.3 | 1533.3 | 1.14 | valide dans sa portée |
| candidate | active-car / quality | 33 | 550.1 / 766.6 / 799.9 | 799.9 | 1.77 | valide dans sa portée |
| candidate | Poitiers-urban / eco | 71 | 266.6 / 449.9 / 750.0 | 750.0 | 3.54 | valide dans sa portée |
| candidate | Poitiers-urban / balanced | 37 | 500.0 / 866.7 / 933.3 | 933.3 | 1.87 | valide dans sa portée |
| candidate | Poitiers-urban / quality | 33 | 566.6 / 816.6 / 850.0 | 850.0 | 1.66 | valide dans sa portée |
| candidate | active-boat / eco | 46 | 416.6 / 499.9 / 649.9 | 649.9 | 2.34 | valide dans sa portée |
| candidate | active-boat / balanced | 33 | 583.3 / 716.6 / 716.6 | 716.6 | 1.69 | valide dans sa portée |
| candidate | active-boat / quality | 31 | 633.2 / 733.3 / 816.6 | 816.6 | 1.56 | valide dans sa portée |
| candidate | Poitiers-map-open / eco | 35 | 533.3 / 866.6 / 883.3 | 883.3 | 1.84 | valide dans sa portée |
| candidate | Poitiers-map-open / balanced | 27 | 716.7 / 933.3 / 949.9 | 949.9 | 1.38 | valide dans sa portée |
| candidate | Poitiers-map-open / quality | 27 | 733.4 / 850.0 / 866.6 | 866.6 | 1.38 | valide dans sa portée |
| reference | forest / eco | 35 | 533.3 / 733.2 / 1383.2 | 1383.2 | 1.84 | valide dans sa portée |
| reference | bridge / eco | 40 | 483.3 / 966.7 / 983.4 | 983.4 | 2.05 | valide dans sa portée |
| reference | river / eco | 66 | 300.0 / 416.7 / 599.9 | 599.9 | 3.39 | valide dans sa portée |
| reference | forest / balanced | 26 | 733.3 / 816.6 / 950.0 | 950.0 | 1.40 | valide dans sa portée |
| reference | bridge / balanced | 27 | 683.4 / 849.9 / 966.6 | 966.6 | 1.44 | valide dans sa portée |
| reference | river / balanced | 46 | 433.3 / 466.6 / 466.7 | 466.7 | 2.39 | valide dans sa portée |
| reference | forest / quality | 27 | 733.4 / 866.6 / 1116.6 | 1116.6 | 1.40 | valide dans sa portée |
| reference | bridge / quality | 25 | 733.3 / 1433.3 / 1500.0 | 1500.0 | 1.35 | valide dans sa portée |
| reference | river / quality | 41 | 466.7 / 500.0 / 933.3 | 933.3 | 2.17 | valide dans sa portée |
| reference | active-car / eco | 64 | 300.0 / 400.0 / 516.6 | 516.6 | 3.38 | valide dans sa portée |
| reference | active-boat / eco | 50 | 383.2 / 549.9 / 600.0 | 600.0 | 2.53 | échec / incomplet |
| reference | active-car / balanced | 38 | 466.8 / 733.3 / 733.3 | 733.3 | 2.05 | valide dans sa portée |
| reference | active-boat / balanced | 35 | 550.0 / 616.6 / 650.0 | 650.0 | 1.78 | échec / incomplet |
| reference | active-car / quality | 35 | 516.6 / 700.0 / 766.6 | 766.6 | 1.88 | valide dans sa portée |
| reference | active-boat / quality | 35 | 550.0 / 633.4 / 699.9 | 699.9 | 1.79 | échec / incomplet |
| reference | Poitiers-urban / eco | 104 | 183.3 / 333.3 / 399.9 | 400.0 | 5.20 | valide dans sa portée |
| reference | Poitiers-map-open / eco | 23 | 816.6 / 966.6 / 983.2 | 983.2 | 1.18 | valide dans sa portée |
| reference | Poitiers-urban / balanced | 61 | 316.8 / 366.7 / 466.6 | 466.6 | 3.09 | valide dans sa portée |
| reference | Poitiers-map-open / balanced | 20 | 1016.7 / 1149.8 / 1250.0 | 1250.0 | 0.99 | valide dans sa portée |
| reference | Poitiers-urban / quality | 56 | 333.3 / 499.9 / 533.4 | 533.4 | 2.84 | valide dans sa portée |
| reference | Poitiers-map-open / quality | 20 | 1016.7 / 1149.9 / 1333.4 | 1333.4 | 1.03 | valide dans sa portée |

Comparaison Équilibré disponible : forest : +0.0% sur la médiane de frame ; bridge : +7.3% sur la médiane de frame ; river : +11.5% sur la médiane de frame. Le seuil ≤5 % échoue dans cette campagne sur pont et berge. Les petits échantillons ne permettent aucune généralisation matérielle. Les benchmarks bateau M26 gardent leur échec de shader et sont inéligibles à une comparaison à effets équivalents ; les cas corrigés sont rejoués. Les cas terrestres inchangés conservent leur source `9d6d0d6`, les reprises bateau/carte leur source finale. P99 peut être le maximum avec quelques dizaines de frames. Les contrôles d’activité et de déplacement sont séparés du simple rendu ; un cas raté reste raté. Les scènes absentes, train en streaming, nouveau bateau départemental et nombreux franchissements ne sont pas validés par les seuls cas présents.

Le budget 96 MiB est un plafond comptable : octets JSON décodés déclarés et rasters U16. Il ne mesure pas le coût réel des objets JS issus de ce JSON. Le worker de routage, le tas JS, les buffers CPU/WebGL, textures, audio, captures et ressources du driver sont des budgets distincts. Une longue campagne native dans le même contexte a été enregistrée avec placements entre scènes ; une baisse ponctuelle de heap après GC ne prouve pas l’absence de fuite. L’endurance multi-tuiles 30–60 min avec toute la météo et tous les modes reste partielle.

**60 FPS desktop, 30 FPS sur téléphone et naturel perceptif : NON VALIDÉS sur matériel physique.** Aucun vrai GPU ou smartphone n’était disponible. SwiftShader ne sert pas d’estimation d’un Android réel.

Les contrôles de carte compilée réussissent sur desktop 1280 × 800 et en émulation 390 × 844 : route de 0,06 km via les boutons et le canvas, même route départementale calculée par le vrai worker, pinch, cibles ≥44 px, fenêtre compacte défilable, pas de débordement horizontal et réutilisation hors ligne des seules données déjà chargées. Le jeu est tenu après préparation pour ces contrôles fonctionnels. [Reçus](mission-26-1-evidence/map-ui.json), [desktop](mission-26-1-evidence/desktop-map.png), [mobile](mission-26-1-evidence/mobile-map.png). Ce n’est pas un test Android physique.

## Sources, licences, hébergement et préservation

IGN / API Geo : Licence Ouverte 2.0. OpenStreetMap et SNCF Réseau : ODbL. Les sons/assets historiques conservent leurs licences. Acquisition autorisée, pas de clé commerciale, achat ou coût additionnel. [Données et reçus](mission-26-1-data.md).

Les 1,408 Go de relief fin ne sont pas copiés dans l’artefact du site. Ils sont vérifiés à la demande depuis une URL HTTPS épinglée au commit de données. L’artefact compilé reste d’environ 200 Mo, contre 179 Mo pour la référence. Un transfert navigateur réel, CORS et SHA ont été contrôlés. La capacité/latence du service gratuit pour une extension France/monde n’est pas garantie.

L’audit lit 1165 anciens fichiers : 1164 identiques, un manifeste régional modifié pour déclarer les nouvelles couches, aucun fichier absent. Les packs historiques, `src/world`, `src/living` et les workflows contrôlés restent identiques à M26. Les sources Living Paintings / LP01 n’ont pas été modifiées par cette mission. **421 tests passent** sur le code final, compilation TypeScript/Vite réussie. Cela ne ferme pas les critères perceptifs. [Préservation](mission-26-1-evidence/preservation.json).

## Défauts résiduels : gravité, position et reproduction

| Gravité | Défaut / position | Reproduction et correction encore nécessaire |
|---|---|---|
| P0 | Continuité non exhaustive ; sondes du fichier `seam-strips.json` | Rejouer les voies en échec, inspecter triangle/appui/obstacle ; ne pas supprimer une falaise légitime. Rue du Pont héritée toujours ouverte |
| P0 | Grande traversée et liberté hors couloirs | Choisir les extrémités de `routes-audit.json`, parcourir réellement les arêtes ; intégrer les terrains publics et ouvrages avec preuves de source |
| P0 | Course/gait et oiseaux | Ouvrir les films et mesures multi-cadences ; rig inchangé, naturel non confirmé. Une revue lisible sur GPU réel reste nécessaire |
| P0 | Eau nouvelle : Chauvigny, Châtellerault, La Roche-Posay | `department-water.json` donne GPS, placement, rejets et supports ; compléter admission des rives/portails sans inventer d’accès |
| P0 | Tâches >50 ms et rendu logiciel très lent | Rejouer les benchmarks avec les mêmes buffers/effets ; profiler les étapes atomiques et uploads/GC ; vérifier ensuite sur GPU/Android physiques |
| P0 | Voiture intercommunale / N10 / A10 | Aucun trajet long complet prouvé ; topologie, ouvrages, voies et trafic doivent être vérifiés par le contrôleur |
| P1 | Camp hors pilote et chaîne complète de reprise | La politique actuelle ne fournit pas de terrain public général hors route ; sauvegardes indépendantes réussies ne suffisent pas |
| P1 | Rail et aviation | Arrêts/circuit synthétiques ne livrent ni passager ni cycle natif complet avec niveaux, occupation, son et collisions validés |
| P1 | Ancrage des objets et LOD départemental | À la relecture, les objets sont ancrés au MNT fin et ne sont pas tous réancrés à chaque changement du maillage lointain ; risque de décalage visible à auditer sur pentes, non certifié par les films du pilote |
| P1 | Biomes et stations visuelles | Reconstructions départementales simples ; campagne de référence sur tous les lieux/saisons incomplète |
| P1 | Carte / offline / mobile | Routage source utile, mais étapes/couches et cache hors ligne limité ; aucune certification Android physique |
| P1 | Échelle mondiale et mémoire | Repère régional hérité et fixture non native complète ; budgets globaux, listeners et nombreuses évictions à éprouver |

## Reproduction et décision proposée

Les commandes sont dans [REPRODUCTION.md](mission-26-1-evidence/REPRODUCTION.md). Les scripts distinguent placement d’inspection, contrôleur accéléré, voyage natif, benchmark hors capture et émulation. Les acquisitions volumineuses possèdent un `--dry-run`. Les hashes et archives de builds permettent de retrouver les sources réellement filmées.

**Décision proposée : conserver la PR #38 en brouillon, non prête pour fusion.** Les progrès sont intégrés et révisables, mais l’acceptation complète de la mission n’est pas atteinte. Aucune validation intermédiaire n’est sollicitée et aucune fusion/publication n’est exécutée.
