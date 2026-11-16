# Mission 26.3 — Voyages débloqués, livraison encore partielle

## 1. Verdict simple

**La Vienne reste partiellement jouable.** Deux blocages majeurs de marche sont franchis : **21 034,73 m depuis Chauvigny jusqu’à l’arrivée**, et **4 737,88 m depuis le vrai spawn d’Angles à travers trois tuiles**. La voiture accomplit **40 425,42 m jusqu’à une arrivée déclarée**, puis stationne et laisse le joueur marcher **205,13 m**.

Plus grand essai archivé : 60677.00 m, sans arrivée ; ne valide pas 80 km. Le nouveau packraft fonctionne sur le Clain : **886,04 m suivis**, prise manuelle, arrêt, retour et débarquement, puis marche. **Le corridor≥1 km demandé n’est pas démontré.** La démarche, les oiseaux et les ombres ne reçoivent aucune validation perceptive sur ce GPU logiciel. Les objectifs essentiels ouverts maintiennent **la PR38 en brouillon, non prête à fusionner**.

[Galerie autonome](mission-26-3-evidence/index.html) · [V01–V12 machine](mission-26-3-evidence/acceptance.json) · [Reproduction](mission-26-3-evidence/REPRODUCTION.md) · [Architecture](mission-26-3-architecture.md).

## 2. Comparaison M26.2 → M26.3

|Constat de référence|Cause et correction réelle|Résultat mesuré|
|---|---|---|
|Rapport : marche arrêtée à12966,98 m ; nouvelle exécution du programme58ba :11902,92 m|Le contact attend une tuile ; le délai réseau pouvait expirer pendant l’attente de l’installateur. Générations, délais séparés, états bornés, priorités physiques et bouton de reprise.|Arrivée à21034,73 m,7 tuiles. Les différences de distance d’arrêt des reprises asynchrones sont conservées.|
|Voiture annoncée à3882,77 m ; reprise58ba à3904,83 m, même voie927245732|Au point46,577320 /0,631644, absence de triangle routier : retour au terrain, puis saut d’environ15 cm vers la chaussée voisine. Sections mitrées et phase source commune avant découpage par tuile.|Contact/raycast sur chaussée corrigée ; parcours historique dépassé et40 km achevés. Tolérances de coque inchangées.|
|25/27 bandes de sortie|La seule pente normale du dévers fermait toutes les directions. La marche sur route admise réutilise le contrôle directionnel et les atterrissages du même contrôleur.|27/27 aller-retour ; seuil de pente0,7 et marche18 cm conservés ; eau/rail/privé/inconnu restent fermés.|
|Préparation lente et banques d’eau vides|Priorité−2 au détail requis,−1 au contact acteur ; copie/projection de terrain réutilisée ; cache aquatique lié à la révision de contact, support sec lié à la chaussée réellement admise.|Buffers terrain strictement identiques sur6 comparaisons ; projections65541→16646. Le Clain devient lançable, navigable et débarquable. Pas de réussite générale≤8 ms.|
|Trafic arrêté aux fins d’horizons ; oscillation de casters|Prolongation sur liens sources, cycles distingués des impasses ; hystérésis8 m des identités de casters.|Tests ciblés verts ; conflits de circulation et qualité d’ombre globale restent ouverts.|

Les essais échoués sont [tous conservés](mission-26-3-evidence/journeys.json), avec refus et versions. Un défaut du conducteur de preuve est distingué d’une correction du moteur : commandes anticipées, nœuds dépassés, manœuvres sur une copie du contrôleur, puis réexécution physique. Aucune position calculée par une sonde n’est appliquée au vrai acteur.

## 3. Table V01–V12

|ID|Critère|Statut|Observation et preuve|
|---|---|---|---|
|V01|Chauvigny ≥20 km et reprise|**ATTEINT**|21034.73 m, arrivée, 7 tuiles ; retour 60.03 m ; reprise du point sauvegardé pendant le voyage. [Preuve](mission-26-3-evidence/travel/Chauvigny-foot-21km-foot.json)|
|V02|Vrai spawn Angles →3 tuiles|**ATTEINT**|4737.88 m, 3 tuiles canoniques, arrivée depuis le spawn intact. [Preuve](mission-26-3-evidence/travel/spawn-east-dense-avoid-water-foot.json)|
|V03|Coutures et hors chaussée|**PARTIEL**|27/27 bandes aller-retour ; traversée totale de 310.49 m, dont 304.33 m hors chaussée mesurés à chaque pas. [Preuve](mission-26-3-evidence/seam-strips.json)|
|V04|Raccord automobile 3,883 km|**ATTEINT**|Même corridor historique dépassé jusqu’à l’arrivée du 40 km ; trou de chaussée corrigé, quatre coins de coque et triangles visibles exportés. [Preuve](mission-26-3-evidence/geometry-comparison.json)|
|V05|Voiture ≥40 km puis ≥200 m à pied|**ATTEINT**|40425.42 m jusqu’à l’arrivée ; parking, sortie et 205.13 m à pied. [Preuve](mission-26-3-evidence/predictive/Vallee-stop-car-40km-car.json)|
|V06|Voiture ≥80 km jusqu’à l’arrivée|**NON ATTEINT**|Plus grand essai archivé : 60677.00 m, sans arrivée ; ne valide pas 80 km. [Preuve](mission-26-3-evidence/guidance/Vallee-source-roundtrip-car-80km-car.json)|
|V07|Nouveau packraft ≥1 km|**PARTIEL**|Clain : suivi physique 886.04 m, retour à la berge 957.86 m, débarquement et marche 2.13 m. [Preuve](mission-26-3-evidence/river-1-priority.json)|
|V08|Streaming borné et reprise|**PARTIEL**|HTTP503 retardé : arrêt devant la tuile manquante, clic de reprise sans déplacement, franchissement par le même acteur. [Preuve](mission-26-3-evidence/streaming-network-corrected.json)|
|V09|Démarche/course, plat/pente,4 vues|**PARTIEL**|16/16 reprises atteignent 180 s simulées réellement consécutives. Films natifs disponibles, perceptif NON VALIDÉ. [Preuve](mission-26-3-evidence/visual-regressions/candidate-physical-gait.json)|
|V10|Oiseaux et quatre familles d’ombres|**PARTIEL**|Hystérésis de casters8 m testée ; films natifs Éco/Équilibré/Qualité et états initiaux appariés. [Preuve](mission-26-3-evidence/visual-regressions/candidate-checked-native.json)|
|V11|Performances et endurance|**PARTIEL**|Benchmarks isolés et intervalles bruts ; deux sessions murales >30 min sur versions intermédiaires. [Preuve](mission-26-3-evidence/performance.json)|
|V12|Conservation, tests et reproduction|**ATTEINT**|457 tests réussis ; données/anciens rapports conservés ; reload réel conduite et marche ; PR38 en brouillon. [Preuve](mission-26-3-evidence/verification.json)|

## 4. Voyages réellement accomplis

**Chauvigny → Vouneuil-sur-Vienne.** Départ46.571055 N / 0.649116 E, arrivée46.737559 N / 0.553731 E. API Geo confirme des points réellement parcourus à Chauvigny, Bonnes, Bellefonds, Bonneuil-Matours et Vouneuil-sur-Vienne. 7 tuiles, 21 034,73 m, 1 116,52 s murales, 14 715,25 s simulées. Sauvegarde créée après10 km ; retour physique de60,03 m ; reprise normale avec erreur de position1.23e-10 m et dérive relâchée0 m. Ce test de reprise reste distinct du vrai reload de page effectué séparément.

**Angles, spawn historique intact.** Départ46.695423 N / 0.879768 E, arrivée46.689416 N / 0.916036 E. Tuiles131:1617, 132:1616, 132:1617. Le corridor évite la sortie Saint-Pierre problématique par des voies sources réellement marchées. Les tuiles canoniques ne sont pas des communes : un échantillon intermédiaire est classé Lurais/Indre, près de la frontière ; l’arrivée exacte est classée Angles-sur-l’Anglin. Aucun agrandissement de données n’en découle.

**Bonnes → Moulismes en voiture.** Départ46.606508 N / 0.605312 E, arrivée46.322181 N / 0.840870 E. Les échantillons administratifs confirment Bonnes, Valdivienne, Civaux, Lussac-les-Châteaux et Moulismes ; ce n’est pas un inventaire exhaustif de toutes les limites. 12 tuiles, 1 049,57 s murales et 4 751,75 s simulées. Parking, sortie,205,13 m à pied ; déplacement de1,16 m après sauvegarde, reprise avec erreur3.78e-10 m.

**Voiture80 km :** Plus grand essai archivé : 60677.00 m, sans arrivée ; ne valide pas 80 km. [Trace et méthode](mission-26-3-evidence/guidance/Vallee-source-roundtrip-car-80km-car.json). Les voies rapides ou ouvrages inconnus ne sont pas ouverts pour atteindre une distance. Les alternatives restent soumises aux sources, à la direction admise et à la coque.

**Arrêt final du80 km :** 46.446650 N / 0.674111 E, D749 Route de la Tour au Cognum, `osm:way:1214545135`, tuile127:1610. Après l’aller, un véritable demi-tour et le retour incluant la N147, la coque refuse `steep-support`. Le centre de chaussée a une pente de3,50% ; le coin exact refusé n’a pas été exporté dans cet essai. Au centre, le terrain et la route diffèrent de0,612 m : cet écart mesuré mérite un audit de cohérence, sans suffire à établir la cause du coin refusé. Vingt-quatre manœuvres bornées n’ont pas permis de repartir. Ce constat ne prouve pas que toute la D749 est infranchissable.

**Clain / Poitiers.** Embarquement46.573833 N / 0.337720 E. Suivi886,04 m, commande manuelle interrompant le suivi, arrêt, retour957,86 m, débarquement puis2,13 m à pied. Les957,86 m de retour ne transforment pas ce corridor en corridor≥1 km. Vauchiron, Chauvigny, Châtellerault et La Roche-Posay ont aussi des essais conservés ; composant court, accès refusé ou préparation non achevée sont distingués. Le double balayage du graphe du Clain est un calcul exploratoire, pas une borne supérieure ni une navigation.

La [carte](mission-26-3-evidence/index.html) sépare vert(fin physique du composant ou arrivée), rouge(critère ou parcours incomplet), gris pointillé(source calculée). Distances : somme des déplacements horizontaux de la racine à chaque pas ; GPS échantillonné et altitude IGN69 séparés. Les restaurations, transitions de porte et placements indépendants ne gonflent pas les odomètres. Pas explicite≤0,25 s, contrôleurs et collisions actifs ; ce n’est pas une expérience native en temps réel.

## 5. Animation et ombres

Les16 reprises marche/course, plat/pente, face/dos/profils, atteignent chacune180 s simulées consécutives avec activité et vitesse réelles. Leurs traces contiennent les appuis, poses et refus. **Le rig du personnage n’a pas été modifié** : les correctifs de support ne sont pas présentés comme la disparition perceptive du tremblement. L’ancien banc court, des erreurs d’initialisation diagnostique et des cadrages trop bas sont conservés. Le protocole natif corrigé cadre les pieds en800×600 et garde les originaux.

Films natifs avant/après, trois profils pour forêt/oiseaux/ombres : cadence logicielle de l’ordre de0,4–1,7 FPS selon les prises, temps simulé publié séparément. Les paramètres/matrices des états initiaux sont dans les preuves appariées ; le sous-ensemble climatique exporté ne certifie pas toute la météo réelle identique. Le nombre d’instances d’oiseaux ne prouve pas leur visibilité ou un vol naturel à l’écran. Aucune nouvelle correction du vol n’est revendiquée. L’hystérésis de casters traite une cause de popping ; shimmer, pixellisation et accord perceptif avec le vent restent non validés. La revue GPU pratique est décrite dans la reproduction ; aucun `ATTEINT` artistique.

## 6. Performances

[Mesures et intervalles bruts](mission-26-3-evidence/performance.json). Benchmarks sans encodeur et sans autre campagne de rendu,640×420 DPR1, sons et effets du profil actifs : forêt, pont, berge, Poitiers, voiture, bateau et carte sous trois profils. P50/P95/P99/max et échecs sont publiés ; petits échantillons et phases/caméras non appariées interdisent de certifier≤5%.

L’équivalence terrain conserve positions/couleurs/indices/coutures sur les six cas. Les pas de générateur et copies sont découpés ; les dépassements>50 ms restent réels et recensés, notamment eau/préparation urbaine. `performance.now()` donne du temps écoulé, incluant préemption/GC, pas un CPU exclusif. Les coûts des bancs accélérés ne sont pas confondus avec la campagne native isolée.

Endurance :1820,62 s et1993,05 s murales sur versions intermédiaires, dans une même page par session, avec stations diagnostiques déclarées, chargements/évictions, carte et changements d’activité. La seconde charge14 tuiles et en évince5 ; des délais échouent. Son heap observé varie de406,11à1319,80Mo, le résident final vaut82,58Mo. Dans les benchmarks, les résidents observés vont de8,69à68,05Mo ; ces valeurs ne constituent pas une preuve d’absence de fuite. Ce n’est ni30 min de trajet géographique continu, ni un test natif matériel final. **≤8 ms, absence totale de>50 ms,60 FPS desktop et30 FPS téléphone restent non démontrés.**

|Version|Scène|Profil|N|P50 ms|P95 ms|P99 ms|Max ms|FPS moyen|
|---|---|---|---:|---:|---:|---:|---:|---:|
|reference|forest|eco|20|383.30|916.60|916.60|916.60|2.53|
|reference|bridge|eco|11|750.00|850.00|850.00|850.00|1.44|
|reference|river|eco|11|716.60|800.00|800.00|800.00|1.51|
|reference|Poitiers|eco|42|183.30|233.30|433.40|433.40|5.25|
|reference|car|eco|8|983.30|1016.70|1016.70|1016.70|1.03|
|reference|boat|eco|18|416.60|483.30|483.30|483.30|2.39|
|reference|map|eco|17|466.60|716.60|716.60|716.60|2.20|
|reference|forest|balanced|12|600.00|850.00|850.00|850.00|1.60|
|reference|bridge|balanced|6|1216.60|1300.00|1300.00|1300.00|0.84|
|reference|river|balanced|6|1133.40|1333.20|1333.20|1333.20|0.86|
|reference|Poitiers|balanced|22|333.40|416.70|449.90|449.90|2.97|
|reference|car|balanced|6|1266.60|1283.30|1283.30|1283.30|0.79|
|reference|boat|balanced|12|616.60|633.30|633.30|633.30|1.64|
|reference|map|balanced|12|650.00|966.70|966.70|966.70|1.48|
|reference|forest|quality|13|600.00|666.70|666.70|666.70|1.65|
|reference|bridge|quality|6|1233.30|1566.60|1566.60|1566.60|0.78|
|reference|river|quality|6|1166.60|1233.30|1233.30|1233.30|0.87|
|reference|Poitiers|quality|19|416.60|483.30|483.30|483.30|2.39|
|reference|car|quality|5|1433.20|1666.60|1666.60|1666.60|0.69|
|reference|boat|quality|12|616.70|699.90|699.90|699.90|1.58|
|reference|map|quality|11|683.40|750.10|750.10|750.10|1.48|
|candidate|forest|eco|22|350.10|783.30|850.00|850.00|2.82|
|candidate|bridge|eco|12|733.20|750.10|750.10|750.10|1.51|
|candidate|river|eco|12|666.70|850.00|850.00|850.00|1.58|
|candidate|Poitiers|eco|37|216.60|250.00|250.00|250.00|4.72|
|candidate|car|eco|8|883.30|1066.50|1066.50|1066.50|1.11|
|candidate|boat|eco|20|383.20|700.00|700.00|700.00|2.54|
|candidate|map|eco|18|450.00|566.60|566.60|566.60|2.30|
|candidate|forest|balanced|13|566.70|716.60|716.60|716.60|1.69|
|candidate|bridge|balanced|7|1116.60|1166.60|1166.60|1166.60|0.88|
|candidate|river|balanced|6|1133.20|1433.30|1433.30|1433.30|0.86|
|candidate|Poitiers|balanced|28|250.00|466.70|583.30|583.30|3.48|
|candidate|car|balanced|6|1233.30|1266.60|1266.60|1266.60|0.81|
|candidate|boat|balanced|12|583.20|966.60|966.60|966.60|1.62|
|candidate|map|balanced|14|550.00|683.30|683.30|683.30|1.83|
|candidate|forest|quality|13|583.30|766.70|766.70|766.70|1.70|
|candidate|bridge|quality|6|1216.60|1499.90|1499.90|1499.90|0.80|
|candidate|river|quality|7|1133.30|1533.20|1533.20|1533.20|0.84|
|candidate|Poitiers|quality|32|233.30|366.60|516.60|516.60|4.02|
|candidate|car|quality|6|1250.00|1550.00|1550.00|1550.00|0.77|
|candidate|boat|quality|13|599.90|650.00|650.00|650.00|1.68|
|candidate|map|quality|16|500.10|816.60|816.60|816.60|1.95|

La plus longue tâche observée dans ces benchmarks est de2746 ms (référence, berge, Équilibré). Les21cas de chaque version terminent sans erreur. Les coûts de préparation détaillés et leurs coordonnées sont dans le JSON ; ils ne sont pas des temps CPU exclusifs.

## 7. Préservation, données, licences et Git

[Inventaire et hashes](mission-26-3-evidence/preservation.json), [versions gelées](mission-26-3-evidence/builds/) et [audit](mission-26-3-evidence/verification.json). Les anciens rapports et preuves sont inchangés. Les données/sons/textures/bâtiments d’Angles,499packs de relief2 m et leurs licences restent conservés ; pin`acb0a73b396229bf90731b90a558a8d5d072a9ec`,1407876165 octets. Le staging existant exclut ces packs de l’artefact du site et le runtime les demande avec SHA à proximité ; aucune acquisition nouvelle.

Référence exécutée58ba496050f7541a63599c28a1a553f7f0b453e9 ; livraison antérieure0e51a60a95d65dbc1dccc647dfe2a40da7493636(src/public équivalents). Chaque essai indique le SHA exécuté ; les commits de documentation/métadonnées ne changent pas rétroactivement ce programme. Sources : IGN/MNT et OSM selon les [licences conservées](../public/planet/fr-86/LICENSE.md), API Geo/Licence Ouverte2.0 pour les communes. Relief fin dérivé et profondeurs de jeu ne sont pas des mesures de sécurité réelle.

457 tests réussis, compilation et contrôles navigateur documentés. Carte desktop/tactile, mémoire source, activités, sauvegardes et vrai reload conduite/marche sont vérifiés dans leur périmètre. Les fumées de région synthétique ne comptent pas comme des kilomètres de Vienne. Trains/avions gardent le socle existant, sans nouveau service passager.

Branche`mission/26-vienne-planet-engine`, PR38 ouverte et en brouillon. `main` observé à`01e791be64cefae2eb1e90ab465f9bf0b848c33e`. M25.2(tête110b4548 et merge5fe6e792) reste ancêtre de cette branche, absent de main. **Aucun achat, abonnement, merge, déploiement ni workflow de production modifié.**

## 8. Défauts restants et décision

[Registre géolocalisé](mission-26-3-evidence/residual-defects.json). Le80 km non arrivé reste un P0 ; le nouveau corridor fluvial≥1 km, la validation perceptive et les budgets de préparation/performance empêchent de déclarer la mission pleinement réussie. Le premier carrefour de Chauvigny et Rue du Pont restent identifiés tant que leur propre reprise ne les ferme pas ; une réussite sur une autre route ne les efface pas.

**Décision : livraison corrective partielle, PR maintenue en brouillon.** Les voyages accomplis sont consultables, les échecs restent visibles, et aucune fusion automatique n’est effectuée. Les limites non testées ou non atteintes ne sont pas remplacées par une distance de graphe, un compteur vert ou une vidéo accélérée.
