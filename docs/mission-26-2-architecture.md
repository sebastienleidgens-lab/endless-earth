# Mission 26.2 — Architecture et limites

La version de programme exécutée et les versions intermédiaires sont identifiées dans [acceptance.json](mission-26-2-evidence/acceptance.json) et les reçus `builds/*/receipt.json`. Les modifications restent sur la branche de la PR brouillon 38. Cette architecture améliore une livraison partielle ; elle ne démontre pas une Vienne entièrement traversable.

## Coordonnées, pilote et surfaces

Les positions physiques restent canoniques. Le décalage de rendu flottant n'est pas un déplacement du personnage. Les conversions WGS84 / Lambert 93 sont conservées. Le pilote historique garde ses propres propriétaires et données ; le département charge les cellules de 4 096 m. Un changement de propriétaire visuel conserve les contrôles d'admission et les contacts. Les hauteurs du jeu sont relatives à la base du terrain du pilote : un champ `datum: IGN69` ne transforme pas le `position.y` local en altitude absolue. Les nouvelles télémétries exportent la base et le référentiel ; les anciennes traces gardent explicitement leur Y local. Les GeoJSON de cette mission restent en deux dimensions.

Les surfaces de route et le terrain visible sont les supports interrogés. La triangulation et les normales incrémentales reproduisent les normales pondérées de Three.js sur les mêmes sommets et indices, sans lancer un calcul global synchrone à la fin. Le contact exact est mémorisé uniquement pendant la frame et la révision de préparation courantes. Un raffinement, chargement ou retrait invalide le cache. Les occupants mobiles et les arbres conservent leurs propres requêtes ; ils ne deviennent pas des contacts statiques mémorisés.

## Admission et obstacles

`access.mjs` distingue permis, refusé et inconnu. Les polygones hors route exigent une permission explicite disponible dans les sources. Une forêt ou une prairie n'accorde aucun droit par son seul habitat. Les conditions d'accès non résolues restent inconnues. Les classes publiques du réseau routier relèvent d'une politique régionale déclarée, avec les restrictions explicites conservées. Les données ne constituent ni un cadastre ni une garantie juridique exhaustive.

Le contrôle de capsule et les obstacles restent actifs. Une route contenant réellement la capsule peut être sélectionnée même si une voie étroite passe plus près. Les arbres inférés ne sont pas implantés sur les routes, rails et pistes cartographiés. Leurs colliders sont indexés par cellules de 32 m et réancrés au support réellement rendu lors du remplacement du mesh.

Une ligne `railway=razed` ou `dismantled` ne forme plus un obstacle ferroviaire actuel. Cette correction ne lui accorde aucun accès : le terrain ou la route traversée doit déjà être admis. Les voies actives, incertaines, privées et les franchissements sans justification restent contrôlés. Les ponts et tunnels de tous types signalés sont exclus du graphe lorsqu'ils ne sont pas vérifiés. Aucun pont réel n'a été reconstruit pour faire passer un test.

## Préparation, streaming et mémoire

La file de préparation expose les étapes nommées, temps cumulés, maximums, passages de 8/50 ms et un historique borné. Le LOD évite de reconstruire un horizon identique et accepte un raffinement demandé encore utile lorsqu'il arrive. Les propriétaires de cellules restent vérifiés. Les lots statiques ne sont plus systématiquement refaits à chaque déplacement de 64 m. Les matériaux de couronnes partagés sont libérés.

La limite de 96 MiB concerne les données géographiques décodées résidentes. Elle exclut le pic du worker, le graphe, les géométries, les autres propriétaires, le tas JavaScript et le GPU. Les relevés de tas, buffers et compteurs WebGL sont donc présentés séparément ; aucune mémoire totale GPU n'est déduite de cette limite. Une attente de contact fin affiche un message au joueur et suspend le déplacement concerné. Ce refus de bouger ne replace pas le joueur et ne prouve pas l'absence de gels.

## Graphe et contrôleurs

Le graphe binaire conserve les nœuds OSM sources. Les masques sont régénérés depuis le même corpus, avec restrictions de structures et d'accès. Les exclusions par identifiant de source peuvent être transmises au worker ou au graphe local. Une réponse de routage est un projet de voyage : le contrôleur doit encore suivre les voies, rencontrer les occupants, les obstacles, les tuiles et les supports.

Le trafic utilise un décalage de voie droite simulé lorsque la largeur le permet. Les voies étroites restent centrées. Les contacts emploient les empreintes orientées des véhicules et les capsules piétonnes, et seuls les véhicules effectivement visibles chargés deviennent des obstacles. Les altitudes rendues restent finies même lorsqu'une nouvelle admission attend sa préparation. Les carrefours difficiles restent un défaut mesuré ; cette évolution ne valide pas les traversées de 40/80 km.

## Animation, oiseaux et eau

Les courbes cycliques de marche/course partagent leurs tangentes aux clés et à la fermeture de cycle. L'enveloppe spatiale du bassin adoucit l'alternance des limites de portée des jambes ; elle ne filtre pas temporellement l'entrée du joueur. Les mesures numériques isolent le rig et imposent sa vitesse racine : elles ne comptent pas comme voyages.

Les transferts d'oiseaux entre branches ont une position et une vitesse continues aux extrémités. La dérivée verticale analytique renseigne l'inclinaison et le son. Cela corrige une discontinuité identifiable ; aucune appréciation humaine de fluidité à cadence suffisante n'est acquise par ces calculs.

La préparation fluviale borne son travail aux polygones pertinents, conserve une marge excluant les bords de découpe et distingue les refus de support, pente, accès et hauteur. Le fond reste estimé. Le nombre d'entrées calculées ne prouve ni approche physique ni navigation. Les essais départementaux n'ont ouvert aucun nouveau corridor certifié.

## Reprises et extension

Une reprise attend le support du joueur et celui de la voiture garée, y compris éloignée. Les refus d'activité non prise en charge restent visibles et sans relocalisation silencieuse. Des sauvegardes indépendantes sont testées ; cela ne remplace pas le voyage intermodal complet demandé.

Les stations, aperçus et graphes globaux sont optionnels dans le contrat régional. La fixture synthétique à 47° N, 71° O réemploie le runtime, loader, rendu, graphe, contacts et sauvegarde. Son passage physique de 2,5 km prouve le contrat ciblé hors France ; ce n'est pas une acquisition de données québécoises ni une validation du monde entier.

## Instrumentation et validation

L'instrumentation n'est injectée que dans les builds de preuve. Le mode accéléré appelle toute la frame originale avec un pas explicite au plus égal au plafond de production et les entrées normales. Il ne réaffecte pas les positions pendant un parcours. Les hooks dépendant d'un dessin sont échantillonnés aux checkpoints : ce mode ne certifie donc ni le rendu natif ni l'endurance météo/faune. Les films et bancs de performance utilisent la boucle native, sans ce pas manuel. Les placements de stations ont lieu avant chaque essai indépendant et sont déclarés.

Les tests vérifient notamment permissions, conditions, structures, contacts, empreintes, courbes, normales, cache et préparation. Ils ne remplacent pas les trajets ni la revue perceptive. Le [rapport propriétaire](mission-26-2.md) fait autorité sur le statut restant partiel.

L'installation coopérative reste une amélioration incomplète : le banc final observe encore des étapes CPU dépassant 50 ms, dont plus de 200 ms lors d'une installation de rendu à Poitiers. Les générateurs n'assurent donc pas encore une borne stricte par étape ; les grosses opérations internes et les allocations doivent être redécoupées et profilées. Les compteurs étiquetés sont des observations, pas une garantie d'ordonnancement.
