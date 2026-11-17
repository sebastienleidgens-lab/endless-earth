# Mission 26.4 — Rapport final consolidé

## 1. Verdict simple

**Verdict global : PARTIEL.** La voiture atteint la destination du trajet≥80km. Un nouveau corridor dépasse1km de progression physique et se termine par débarquement et marche. Les corrections du personnage, des oiseaux et des ombres sont techniques ; leur naturel et leur qualité temporelle restent **NON VALIDÉS sur matériel physique**. Les budgets de préparation≤8 ms / aucune tâche>50 ms ne sont pas atteints. La PR38 reste en brouillon, non prête à fusionner.

[Galerie autonome locale](mission-26-4-evidence/index.html) · [A01–A14](mission-26-4-evidence/acceptance.json) · [Reproduction et revue GPU locale](mission-26-4-evidence/REPRODUCTION.md) · [Architecture](mission-26-4-architecture.md). Aucun déploiement/publication, merge, achat ou workflow de production modifié.

## 2. M26.3 → M26.4 : causes, corrections et résultats

|Défaut reproduit|Cause et correction|Résultat et limite|
|---|---|---|
|D749 : `steep-support` à46.446650 /0.674111|Au coin avant gauche, avance1mm : face physique176, pente0,450938>0,45 ; la grande demi-largeur triangulée transmet le talus à la voie. Échantillonnage transversal≤2m, même MNT/largeur et seuils. Phase longitudinale4m conservée après une régression réelle à2m.|Même point : pente0,251986, accord support/raycast exporté. Relief du talus conservé. Le seul centre à3,5% ne décrivait pas le coin refusé. [Triangles](mission-26-4-evidence/geometry-comparison.svg).|
|Départs/appuis du voyageur|Redémarrage à toe-off depuis le contact posé, levée du premier appui avant dépassement de portée, clairance de semelle avant bassin/IK, stabilisation de l'arrêt.|Rig31os/7880triangles conservé ; 16 séquences physiques≥180s, contacts synthétiques à précision numérique. Pics d'accélération articulaire encore élevés, parfois aggravés au démarrage. Aucun succès artistique déduit.|
|Ailes/orientation d'oiseaux discontinues|Transitions quintiques C2 pour l'énergie des ailes, virage/inclinaison et visibilité, même âge de vol ; priorité aux identités de perchoirs déjà sélectionnées.|Tests de continuité réussis ; les trajectoires analytiques existaient déjà en M26.3. Films à faible cadence et visibilité non forcée, naturel ouvert.|
|Tronc grossier et ombre fine en désaccord avec le vent|Le tronc visible grossier reçoit la même rotation de racine que le tronc fin/caster.|Cause précise traitée ; lecture atlas/champs supplémentaire comptée dans le coût. Pas de hausse de résolution/PCF, pas de suppression d'ombres. Shimmer mondial encore ouvert.|
|Pale visible et poussée dans deux repères|Bob déplacé vers la coque enfant, repère partagé entre pale visible et physique.|Test de coordonnées monde exact. Pool48marques et deux sillages hérités réutilisés.|
|Gartempe : suivi immobile à555,39m malgré réseau prêt|L'eau rendue sous la pale est≈33cm plus basse qu'au centre. La pose supposait un plan horizontal et n'immergeait plus la pale. Articulation de shaft bornée à0,4rad, portée latérale de pale conservée, lecture du contact local réel partagée avec le rendu.|Tests : l'eau proche devient atteignable ; une chute de5m ne produit aucune poussée. Aucun aplanissement d'eau, accès, profondeur ou collision modifié. Rejeu au même endroit conservé.|
|Ajustement de pagaie non répétable en91|La seconde évaluation réutilisait une coordonnée latérale déjà ajustée et changeait l'enveloppe du coup. Le poids vient désormais de `authoredX`, la phase initiale immuable.|Test d'idempotence rouge puis vert ; même limite0,4rad, deux évaluations, mêmes surfaces/collisions. Rejeu complet sur le programme final.|
|Coûts de requête répétés|Cache borné512cellules, tableaux figés/ordre identique, invalidation à chaque mutation/yield. Prédicat aquatique rayon zéro par même parité sans distances d'arête inutiles.|Égalité vérifiée ; `walking.mjs` reste identique pour préserver le hash de graphe. [Banc isolé](mission-26-4-evidence/performance.json). Aucun succès global≤50ms.|

L'écart de0,612m au centre D749 était celui de l'ancien trajet ; la nouvelle sonde fine à l'arrêt mesure un autre état de LOD/focus. Il n'est pas présenté comme une mesure identique ni comme la cause universelle. Tous les prototypes, régressions et erreurs de protocole sont conservés. Le conducteur de preuve et le moteur restent distingués : aucun résultat de sonde/clône n'est appliqué à la position du vrai véhicule.

## 3. Table A01–A14

|ID|Critère|Statut|Preuve et défaut ouvert|
|---|---|---|---|
|A01|Voiture80km et D749|**ATTEINT**|[Preuve](mission-26-4-evidence/water-final-80km/Vallee-source-roundtrip-car-80km-car.json) · Arrivée et marche enregistrées ; aucun kilomètre déduit du graphe.|
|A02|Voiture40km, sortie/marche et carrefour|**ATTEINT**|[Preuve](mission-26-4-evidence/authored-regression/Vallee-stop-car-40km-car.json) · Le refus local du carrefour de Chauvigny reste ouvert.|
|A03|Nouvelle rivière>=1km dans un sens|**ATTEINT**|[Preuve](mission-26-4-evidence/river-5-authored.json) · Aller seulement pour le seuil ; retour exclu, hauteurs libres inconnues fermées.|
|A04|Pagaie, remous et sillage|**PARTIEL**|[Preuve](mission-26-4-evidence/visual-regressions/candidate-authored-native.json) · Contact numérique corrigé ; mains, effets, virages et LOD à revoir à cadence lisible.|
|A05|Marche naturelle|**PARTIEL**|[Preuve](mission-26-4-evidence/visual-regressions/final-physical-gait.json) · Naturel perceptif non validé ; pics articulaires encore présents au départ.|
|A06|Course naturelle|**PARTIEL**|[Preuve](mission-26-4-evidence/visual-regressions/final-physical-gait.json) · Amélioration en régime établi, pics de démarrage parfois aggravés.|
|A07|Oiseaux vivants|**PARTIEL**|[Preuve](mission-26-4-evidence/visual-regressions/reference-matched-native.json) · Continuité corrigée ; naturel et visibilité du vol non validés.|
|A08|Ombres des troncs et du sol|**PARTIEL**|[Preuve](mission-26-4-evidence/visual-regressions/reference-matched-native.json) · Vent grossier/fin cohérent ; shimmer et qualité temporelle encore ouverts.|
|A09|Ombres du monde et coût|**PARTIEL**|[Preuve](mission-26-4-evidence/performance.json) · Scènes et profils mesurés ; aucune validation globale des ombres ou du coût≤5%.|
|A10|Streaming et chargements|**PARTIEL**|[Preuve](mission-26-4-evidence/streaming-network-corrected.json) · Attente/retry vérifiés ; étapes>8ms et>50ms encore présentes.|
|A11|Performance et endurance|**PARTIEL**|[Preuve](mission-26-4-evidence/performance.json) · 30min réelles, voiture/pied/carte ; zéro éviction observée et aucun GPU matériel.|
|A12|Acquis pédestres M26.3|**ATTEINT**|[Preuve](mission-26-4-evidence/final-travel/Chauvigny-foot-21km-foot.json) · 21km, vrai spawn et27coutures rejoués ; essais intermédiaires conservés.|
|A13|Activités, interface et préservation|**PARTIEL**|[Preuve](mission-26-4-evidence/fixture.json) · Interface/reload/réseau vérifiés ; activités natives et Android non exhaustifs.|
|A14|Livraison et Git|**PARTIEL**|[Preuve](mission-26-4-evidence/verification.json) · Livraison et Git vérifiés séparément ; aucun merge/déploiement et aucun verdict global déduit.|

## 4. Voyages réellement accomplis

**80km, Bonnes → Moulismes → Bonnes, aller-retour cohérent sur les mêmes voies sources.** **80 605,09 m**, arrivée=oui, statut=COMPLETED. Programme `91f4f53b2832b387a196430121367989214f4f36`. 12 tuiles canoniques ; 3 428,76 s murales / 9 996,75 s simulées ; plus grand pas=3,08 m. GPS départ=46.606508, 0.605312, fin=46.606516, 0.605324. [Trace](mission-26-4-evidence/water-final-80km/Vallee-source-roundtrip-car-80km-car.json). L'itinéraire comprend un demi-tour physique déclaré et le retour incluant la N147 ; ni boucle artificielle ni kilométrage de graphe. L'essai intermédiaire f4, avant retour à la phase longitudinale4m, est archivé séparément et ne remplace pas le résultat final. Parking/marche réellement enregistrés après cette arrivée : 205,13 m. Une omission initiale du driver limitait cette séquence au40km ; le driver corrigé ne l'attribue pas rétroactivement aux anciens essais.

**40km historique, Bonnes → Moulismes.** **40 354,34 m**, arrivée=oui, statut=COMPLETED. Programme `d162a653785d656e1a6652c4ca406889a1b55c28`. 12 tuiles canoniques ; 1 288,25 s murales / 5 009,75 s simulées ; plus grand pas=3,08 m. GPS départ=46.606508, 0.605312, fin=46.322181, 0.840870. [Trace](mission-26-4-evidence/authored-regression/Vallee-stop-car-40km-car.json). Marche après stationnement et sortie normale : 205,13 m. Le carrefour de Chauvigny est vérifié séparément : le rejeu91 (modules de conduite identiques au final) s'arrête à145,24m avec refus `unknown-land-access`. Un support au centre admis ne prouve pas que tous les coins de coque appartiennent à une voie autorisée. Cette jonction n'est pas déclarée réparée parce qu'un autre trajet réussit.

**Chauvigny → Vouneuil.** **21 034,73 m**, arrivée=oui, statut=COMPLETED. Programme `30d3bcdeb96961ee66ee722b94ef3ac3505435cf`. 7 tuiles canoniques ; 2 985,52 s murales / 15 054,00 s simulées ; plus grand pas=0,36 m. GPS départ=46.571055, 0.649116, fin=46.737559, 0.553731. [Trace](mission-26-4-evidence/final-travel/Chauvigny-foot-21km-foot.json). [Identité exacte des modules actifs entre ces programmes et le final](mission-26-4-evidence/active-module-equivalence.json). Le succès requiert≥21km et arrivée ; un essai intermédiaire avec la phase routière2m s'arrête réellement à14395,97m et reste visible. **Angles, vrai spawn intact.** **4 737,88 m**, arrivée=oui, statut=COMPLETED. Programme `91f4f53b2832b387a196430121367989214f4f36`. 3 tuiles canoniques ; 221,40 s murales / 3 348,00 s simulées ; plus grand pas=0,36 m. GPS départ=46.695423, 0.879768, fin=46.689416, 0.916036. [Trace](mission-26-4-evidence/warmed-spawn/spawn-east-dense-avoid-water-foot.json). Les trois tuiles canoniques sont un critère de continuité, pas trois communes. Les27bandes de couture sont rejouées après le retour à la phase longitudinale4m ; leur SHA exact figure dans la preuve et le module routier est identique au final.

**Gartempe près de Vicq, nouveau packraft**, source `osm:relation:722055:0`. **1 000,12 m**, arrivée=oui, statut=COMPLETED. Programme `d162a653785d656e1a6652c4ca406889a1b55c28`. 2 tuiles canoniques ; 150,93 s murales / 1 280,25 à 1 285,00 (bornes de trace) s simulées ; plus grand pas=0,23 m. GPS départ=46.732343, 0.877986, fin=46.725667, 0.869684. [Trace](mission-26-4-evidence/river-5-authored.json). Progression signée sur le suivi : 1 000,74 m ; déplacement net : 976,77 m ; retour normal de909,82m séparé, débarquement puis2,13m à pied. Une sauvegarde est réellement effectuée en bateau ; la commande de reprise pendant cette activité est explicitement refusée : « Revenez à une berge avant de changer de voyage. » Le déplacement associé est exclu de la mesure. La plus grande composante préparée ne compte jamais comme voyage. Les sélections initiales et finales sont gardées avec le secteur/OSM : un indice de script seul n'est pas une identité. Lussac suit578,86m ; Saint-Benoît et Dissay ne fournissent pas le corridor vérifié demandé dans les accès essayés. Sur le Clain historique, le terminal reste dans la même relation hydrographique ; les ouvrages rail/passerelle à proximité ont une hauteur libre inconnue. Leur exclusion est conservée, sans union spéculative ou franchissement inventé. Régression physique finale du Clain historique :886,07m vers l’avant,957,10m de retour normal, débarquement et2,13m à pied ; même berge fraîchement admise et même relation source, limite de corridor conservée. [Trace finale Clain](mission-26-4-evidence/clain-legacy-final.json).

Chaque trace distingue dt explicite, secondes simulées, temps mural, GPS échantillonné, support et tuile. L'odomètre somme chaque pas de racine ; le GeoJSON échantillonné ne sert pas à calculer les distances. Placements initiaux indépendants, transitions de porte, sauvegardes et restaurations sont déclarés et exclus des compteurs. Collisions complètes et trafic restent actifs. Ces longs voyages sont des essais accélérés du jeu complet, pas une expérience native à60FPS.

## 5. Naturel du personnage et des oiseaux

Les16cas marche/course, plat/pente et face/dos/deux profils atteignent180s physiques consécutives. Certaines captures PNG échouent par timeout sous charge : les traces restent présentes, sans transformer un screenshot manquant en échec de locomotion ou en film valide. Les films natifs appariés et paramètres complets restent dans la galerie.

Le banc de rig impose une vitesse de racine synthétique pendant24s : il n'est pas un voyage. Les pieds posés restent à≈1e−15m dans ce sol mathématique, ce qui ne prouve pas la qualité du corps animé. À120Hz, le maximum global de genou au départ de course passe2461,72→3059,42rad/s² ; au régime établi après2s, le maximum des deux genoux passe620,23→474,84rad/s². La marche établie reste pratiquement identique sur cette métrique. Ces maxima, positifs et négatifs, sont publiés : le tremblement n'est pas déclaré éliminé. Les anciens prototypes avec arbre sale/SHA de fin ou dt résiduel quasi nul sont explicitement non admissibles comme comparaison exacte.

Les oiseaux conservent leurs identités, horaires et trajectoires analytiques. Les enveloppes C2 suppriment les commutations booléennes de la pose/énergie ; les tests ne prouvent ni visibilité de chaque oiseau à l'écran ni absence de saccade perceptive. Aucun oiseau n'est forcé visible pour embellir les prises. La revue GPU locale livrée couvre caméra fixe/mobile, proche/loin, décollage/perchoir/atterrissage.

## 6. Ombres et eau

Les prises couvrent forêt, approche de tronc, berge/rivière et village, avec profils Éco/Équilibré/Qualité selon scène, états avant/après, matrice du soleil, caméra, météo complète et framebuffer. Le shim commun initialise le climat et le cache de découverte avant chaque prise indépendante ; aucune horloge n'est forcée pendant le film. L'appariement n'est pas parfait : la sensibilité/brume conserve une histoire différente et certaines matrices solaires diffèrent. Les états réels sont conservés dans l'audit, sans prétendre à une comparaison entièrement contrôlée. Les clips vides (en-tête WebM absent) sont gardés et rejoués avec un pré-roll de trois frames natives ; ce pré-roll reste dans les originaux et les durées.

La rotation de racine commune du tronc traite le désaccord de vent grossier/fin. Les casters stables et leur hystérésis héritée ne sont pas des corrections nouvelles revendiquées. Éco conserve sa politique d'ombres propre ; Équilibré/Qualité gardent leurs tailles natives, sans retirer silencieusement les récepteurs. Shimmer en déplacement, feuillage sur tronc, pixellisation, qualité de bâtiments/personnage/voiture et comparaison de coût restent partiels sur ce matériel logiciel.

La pale et les mains utilisent les mêmes transformations que la poussée, y compris l'articulation vers le niveau d'eau local. Le premier prototype de cette articulation déplaçait latéralement la pale ; il a échoué au test puis a été corrigé pour conserver sa portée hors coque. Le poids de contact est calculé depuis la pose initiale immuable, et ne dépend plus du nombre de passes du solveur. La correction n'accorde aucune propulsion lorsqu'une pale ne touche pas de surface fiable. Les effets existants suivent le vrai point de contact ; la qualité des remous, des mains et des silhouettes reste à juger à cadence lisible.

## 7. Performances et endurance

[Mesures brutes et périmètres](mission-26-4-evidence/performance.json). Les films natifs tournent sous SwiftShader et charge fonctionnelle concurrente ; leurs FPS ne servent à aucune comparaison de régression. Les deux premières séries « isolated » sont sans encodeur/autre jeu, mais une génération de rapport a occupé le CPU pendant une partie de la référence ; elles restent un essai initial. Les séries « quiet » viennent ensuite, seules, sans génération de rapport ni calcul de hashes en parallèle, avec horodatages et inventaires de processus. Le sous-banc CPU utilise les mêmes tuiles/polygones/requêtes, ordre alterné et assertions d'égalité, en séparant froid/chaud. Il ne mesure pas tout le pipeline eau, worker, GC ou upload GPU.

Sous-banc CPU sur le vrai polygone du Clain à1764sommets :8325tests d’appartenance identiques avant/après ; chaque mesure de requête utilise50000appels, médiane de5répétitions par mode. Les maxima défavorables d’indexation restent publiés aussi. Un gain de prédicat/cache ne constitue pas une réduction démontrée de toute la préparation du monde.

|Campagne|Version|Requêtes froides ms|Chaudes ms|Prédicat eau ms|Max pas index ms|Pas>8 / >50ms|
|---|---|---:|---:|---:|---:|---:|
|cpu-isolated|reference|130,19|119,58|291,93|38,16|7 / 0|
|cpu-isolated|candidate|123,79|19,03|30,95|129,06|5 / 2|
|cpu-quiet|reference|143,04|124,42|311,08|42,95|5 / 0|
|cpu-quiet|candidate|100,45|29,86|34,69|41,82|3 / 0|

Les étapes individuelles>8ms et>50ms restent recensées. Le réseau de Gartempe initial montre notamment une tranche217,20ms sous charge ; d'autres préparations dépassent aussi50ms. Ces durées `performance.now()` incluent préemption et GC, ne sont pas du CPU exclusif, et ne sont pas excusées pour déclarer le seuil atteint. Budgets60FPS desktop/30FPS Android, zéro pause>50ms et médiane≤5% restent non démontrés.

Endurance finale : **1 800,76s murales**, 9 970,07m voiture, 32,46m à pied, 6198frames natives observées. Aucune relocalisation ni dt manuel après le départ. Sortie à pied, carte, retour à la voiture et reprise de conduite sont réellement enregistrés. Neuf tuiles chargées, zéro éviction observée : ce volet n'est pas validé. Heap JS 407,63→662,05MiB ; miroirs CPU d'attributs 202,05MiB, textures typées 2,41MiB. Le journal conserve seulement les2048dernières tâches longues ; maximum retenu 1 232,00ms. Les sessions antérieures f4 et30 sont conservées séparément. Heap JS, budget géographique96MiB, miroirs CPU des attributs/textures et mémoire GPU sont des périmètres différents ; aucune absence de fuite générale n'est déduite de cette seule session.

|Campagne|SHA|Scène|Profil|N|P50ms|P95ms|P99ms|Maxms|FPSréels|
|---|---|---|---|---:|---:|---:|---:|---:|---:|
|candidate-isolated|d162a653|forest|eco|22|383,40|816,60|933,40|933,40|2,68|
|candidate-isolated|d162a653|bridge|eco|11|766,70|816,60|816,60|816,60|1,29|
|candidate-isolated|d162a653|river|eco|11|733,30|800,00|800,00|800,00|1,36|
|candidate-isolated|d162a653|Poitiers|eco|24|316,70|466,60|666,70|666,70|2,93|
|candidate-isolated|d162a653|car|eco|7|1 000,00|1 649,90|1 649,90|1 649,90|0,83|
|candidate-isolated|d162a653|boat|eco|16|483,30|683,30|683,30|683,30|2,10|
|candidate-isolated|d162a653|map|eco|16|533,30|649,90|649,90|649,90|2,00|
|candidate-isolated|d162a653|forest|balanced|12|666,60|1 183,30|1 183,30|1 183,30|1,42|
|candidate-isolated|d162a653|bridge|balanced|6|1 283,30|2 083,30|2 083,30|2 083,30|0,67|
|candidate-isolated|d162a653|river|balanced|7|1 200,10|1 366,70|1 366,70|1 366,70|0,81|
|candidate-isolated|d162a653|Poitiers|balanced|18|449,90|716,70|716,70|716,70|2,13|
|candidate-isolated|d162a653|car|balanced|7|1 333,30|1 449,90|1 449,90|1 449,90|0,76|
|candidate-isolated|d162a653|boat|balanced|13|600,00|666,60|666,60|666,60|1,66|
|candidate-isolated|d162a653|map|balanced|12|633,30|833,30|833,30|833,30|1,59|
|candidate-isolated|d162a653|forest|quality|12|666,60|966,70|966,70|966,70|1,48|
|candidate-isolated|d162a653|bridge|quality|6|1 316,60|1 416,50|1 416,50|1 416,50|0,76|
|candidate-isolated|d162a653|river|quality|6|1 433,30|1 833,30|1 833,30|1 833,30|0,68|
|candidate-isolated|d162a653|Poitiers|quality|24|333,40|516,60|633,30|633,30|2,83|
|candidate-isolated|d162a653|car|quality|6|1 416,50|1 550,00|1 550,00|1 550,00|0,70|
|candidate-isolated|d162a653|boat|quality|12|700,00|816,50|816,50|816,50|1,42|
|candidate-isolated|d162a653|map|quality|10|883,30|1 216,60|1 216,60|1 216,60|1,20|
|candidate-quiet|d162a653|forest|eco|22|366,70|816,70|850,00|850,00|2,76|
|candidate-quiet|d162a653|bridge|eco|10|849,80|1 016,70|1 016,70|1 016,70|1,19|
|candidate-quiet|d162a653|river|eco|11|750,00|800,00|800,00|800,00|1,33|
|candidate-quiet|d162a653|Poitiers|eco|28|299,90|349,90|350,00|350,00|3,46|
|candidate-quiet|d162a653|car|eco|9|949,90|983,40|983,40|983,40|1,06|
|candidate-quiet|d162a653|boat|eco|19|416,60|450,00|450,00|450,00|2,40|
|candidate-quiet|d162a653|map|eco|15|549,90|849,90|849,90|849,90|1,88|
|candidate-quiet|d162a653|forest|balanced|13|616,70|816,60|816,60|816,60|1,57|
|candidate-quiet|d162a653|bridge|balanced|7|1 216,70|1 266,60|1 266,60|1 266,60|0,81|
|candidate-quiet|d162a653|river|balanced|3|2 199,90|3 283,30|3 283,30|3 283,30|0,42|
|candidate-quiet|d162a653|Poitiers|balanced|13|599,90|783,40|783,40|783,40|1,65|
|candidate-quiet|d162a653|car|balanced|5|1 350,10|1 783,20|1 783,20|1 783,20|0,70|
|candidate-quiet|d162a653|boat|balanced|10|650,10|1 316,60|1 316,60|1 316,60|1,34|
|candidate-quiet|d162a653|map|balanced|10|783,30|1 183,30|1 183,30|1 183,30|1,26|
|candidate-quiet|d162a653|forest|quality|13|650,00|783,30|783,30|783,30|1,50|
|candidate-quiet|d162a653|bridge|quality|7|1 300,00|1 399,90|1 399,90|1 399,90|0,77|
|candidate-quiet|d162a653|river|quality|7|1 266,60|1 350,00|1 350,00|1 350,00|0,78|
|candidate-quiet|d162a653|Poitiers|quality|23|333,40|383,20|383,40|383,40|2,92|
|candidate-quiet|d162a653|car|quality|6|1 383,30|1 516,60|1 516,60|1 516,60|0,73|
|candidate-quiet|d162a653|boat|quality|12|683,30|816,70|816,70|816,70|1,43|
|candidate-quiet|d162a653|map|quality|10|883,20|1 150,10|1 150,10|1 150,10|1,17|
|reference-isolated|b5a4f98c|forest|eco|10|716,60|1 649,90|1 649,90|1 649,90|1,37|
|reference-isolated|b5a4f98c|bridge|eco|8|966,70|1 516,60|1 516,60|1 516,60|1,08|
|reference-isolated|b5a4f98c|river|eco|6|1 000,00|1 783,30|1 783,30|1 783,30|0,97|
|reference-isolated|b5a4f98c|Poitiers|eco|29|233,40|516,60|516,60|516,60|3,78|
|reference-isolated|b5a4f98c|car|eco|9|966,70|1 866,50|1 866,50|1 866,50|1,03|
|reference-isolated|b5a4f98c|boat|eco|19|416,60|449,90|449,90|449,90|2,40|
|reference-isolated|b5a4f98c|map|eco|18|483,30|550,00|550,00|550,00|2,18|
|reference-isolated|b5a4f98c|forest|balanced|8|1 099,90|1 183,30|1 183,30|1 183,30|0,95|
|reference-isolated|b5a4f98c|bridge|balanced|3|2 766,60|2 833,10|2 833,10|2 833,10|0,37|
|reference-isolated|b5a4f98c|river|balanced|2|3 549,80|3 549,80|3 549,80|3 549,80|0,32|
|reference-isolated|b5a4f98c|Poitiers|balanced|15|433,40|1 133,30|1 133,30|1 133,30|1,83|
|reference-isolated|b5a4f98c|car|balanced|6|1 399,90|1 516,60|1 516,60|1 516,60|0,72|
|reference-isolated|b5a4f98c|boat|balanced|10|733,30|1 416,60|1 416,60|1 416,60|1,26|
|reference-isolated|b5a4f98c|map|balanced|12|650,00|1 083,20|1 083,20|1 083,20|1,52|
|reference-isolated|b5a4f98c|forest|quality|11|650,00|1 116,70|1 116,70|1 116,70|1,38|
|reference-isolated|b5a4f98c|bridge|quality|6|1 250,00|1 316,70|1 316,70|1 316,70|0,79|
|reference-isolated|b5a4f98c|river|quality|6|1 283,30|1 649,90|1 649,90|1 649,90|0,75|
|reference-isolated|b5a4f98c|Poitiers|quality|30|266,60|299,90|300,00|300,00|3,78|
|reference-isolated|b5a4f98c|car|quality|6|1 416,60|1 683,30|1 683,30|1 683,30|0,69|
|reference-isolated|b5a4f98c|boat|quality|12|683,30|750,00|750,00|750,00|1,45|
|reference-isolated|b5a4f98c|map|quality|16|533,30|833,30|833,30|833,30|1,83|
|reference-quiet|b5a4f98c|forest|eco|16|416,60|950,00|950,00|950,00|2,41|
|reference-quiet|b5a4f98c|bridge|eco|11|816,60|850,00|850,00|850,00|1,38|
|reference-quiet|b5a4f98c|river|eco|13|699,90|833,30|833,30|833,30|1,51|
|reference-quiet|b5a4f98c|Poitiers|eco|32|233,40|350,00|400,00|400,00|4,04|
|reference-quiet|b5a4f98c|car|eco|8|1 049,90|1 166,70|1 166,70|1 166,70|0,97|
|reference-quiet|b5a4f98c|boat|eco|19|416,60|500,00|500,00|500,00|2,41|
|reference-quiet|b5a4f98c|map|eco|18|466,60|566,60|566,60|566,60|2,24|
|reference-quiet|b5a4f98c|forest|balanced|13|600,00|750,00|750,00|750,00|1,57|
|reference-quiet|b5a4f98c|bridge|balanced|7|1 233,30|1 483,20|1 483,20|1 483,20|0,80|
|reference-quiet|b5a4f98c|river|balanced|6|1 333,30|1 866,60|1 866,60|1 866,60|0,74|
|reference-quiet|b5a4f98c|Poitiers|balanced|29|266,70|383,30|449,90|449,90|3,64|
|reference-quiet|b5a4f98c|car|balanced|6|1 533,30|1 666,60|1 666,60|1 666,60|0,68|
|reference-quiet|b5a4f98c|boat|balanced|12|650,00|983,20|983,20|983,20|1,48|
|reference-quiet|b5a4f98c|map|balanced|14|583,30|766,70|766,70|766,70|1,76|
|reference-quiet|b5a4f98c|forest|quality|12|649,90|916,70|916,70|916,70|1,49|
|reference-quiet|b5a4f98c|bridge|quality|5|1 316,70|2 249,90|2 249,90|2 249,90|0,63|
|reference-quiet|b5a4f98c|river|quality|6|1 466,50|1 666,60|1 666,60|1 666,60|0,70|
|reference-quiet|b5a4f98c|Poitiers|quality|30|266,80|300,00|300,00|300,00|3,74|
|reference-quiet|b5a4f98c|car|quality|6|1 549,90|1 699,90|1 699,90|1 699,90|0,67|
|reference-quiet|b5a4f98c|boat|quality|12|666,60|983,30|983,30|983,30|1,40|
|reference-quiet|b5a4f98c|map|quality|16|533,30|566,70|566,70|566,70|1,98|

Les échantillons de quelques secondes ne rendent pas le P99 robuste et les phases/caméras/cache d'un véhicule ou bateau qui bouge ne deviennent pas identiques parce que le nom de scène est identique. Aucun GPU matériel ou téléphone physique n'a été évalué ; le mode F8 et le protocole local permettent cette revue ultérieure sans interrompre la mission.

## 8. Préservation, Git et licences

[Inventaire](mission-26-4-evidence/preservation.json) · [Reçus/builds](mission-26-4-evidence/builds/index.json) · [Vérification finale](mission-26-4-evidence/verification.json). Point de départ`7b78222b7d93b99926ce4a3a1f5bd91ca2eafb94`, référence exécutée`b5a4f98c87d4adf130342bc05cfa732a70056502`, runtime final`d162a653785d656e1a6652c4ca406889a1b55c28`. Chaque voyage/film conserve son SHA réel ; les preuves intermédiaires ne sont pas rebaptisées finales. Les changements ultérieurs de tests/documentation/identité de menu ne changent pas ces mesures.

Les647preuves/rapports M26.3 hashés avant modification restent inchangés ; données publiques et workflows aussi. Relief2m :499packs,1407876165octets, pin`acb0a73b396229bf90731b90a558a8d5d072a9ec`. IGN/OSM, licences, audio, textures et patrimoine du pilote sont conservés. Aucun dataset nouveau, département ajouté, acquisition massive ou coût. Les accès de jeu restent des politiques sources, pas des droits cadastraux ni des conseils nautiques.

Validation : **466 tests réussis, 0 échec** ; build de production=réussi, galerie=vérifiée. [Reçus exacts](mission-26-4-evidence/verification.json). La galerie fonctionne via serveur local sans dépendance Internet ; le protocole fichier `file://` est bloqué par le navigateur administré, refus archivé. Les tests de logique hérités couvrent transports, camp/nage/interactions, audio, sauvegardes et architecture ; les smokes compilés couvrent carte/tactile/reload/réseau et la fixture synthétique hors France. Cela ne vaut pas un rejeu natif exhaustif de train/avion/camp sur téléphone. L'historique M25.2 reste ancêtre de la branche et absent de main ; les SHA main/PR réels sont vérifiés à la livraison. Une seule PR38 brouillon, aucune fusion, aucun déploiement/publication et aucun changement de workflow.

## 9. Défauts résiduels et décision

La mission reste **PARTIELLE**. Les critères artistiques/perceptifs et les pauses de préparation ne sont pas clos par les nombres de tests. A01 et A03 sont atteints sur leurs critères physiques ; ils ne ferment pas les critères visuels et temporels A04–A11.

L'endurance de1807,62s sur91f4f53 reste un essai non validant pour l'exploration continue :797,93m de voiture,2,47m à pied puis une boucle de portes due à un état de conducteur de test périmé. Ce bug de harnais est corrigé dans le script ; l'essai est conservé, sans promouvoir sa durée en réussite. La session corrigée possède un verrou de sortie et un PID propriétaire pour prévenir les écritures concurrentes.

Les priorités résiduelles sont détaillées dans [residual-defects.json](mission-26-4-evidence/residual-defects.json) : jonction de Chauvigny, contacts/accélérations du voyageur, vol perceptif, shimmer global, budgets de préparation/streaming et revue GPU/Android. Le résultat est livré pour examen dans la PR existante, sans la déclarer prête à fusionner.
