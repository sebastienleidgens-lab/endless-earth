# M26.4 — Architecture et limites de la correction

Le runtime de preuve final est `d162a653785d656e1a6652c4ca406889a1b55c28`. Les replays précédents sur30d3bc restent identifiés séparément ; la dernière correction ne touche que la pagaie/son rendu. La référence exécutée est `b5a4f98c87d4adf130342bc05cfa732a70056502` ; le point de départ documentaire est `7b78222b7d93b99926ce4a3a1f5bd91ca2eafb94`. Les reçus de chaque build instrumenté figurent dans [builds/index.json](mission-26-4-evidence/builds/index.json). Ils distinguent le programme, les scripts de diagnostic et les données.

## Contacts et coordonnées

Le pipeline reste WGS84 → Lambert93 canonique → coordonnées locales de rendu avec origine flottante. Les altitudes sources restent IGN69. Le rebase de rendu ne déplace ni les contrôleurs, ni les sources, ni le son. Le relief IGN 2 m, ses 499 packs et son pin distant restent inchangés. Aucun nouveau département, asset ou droit d'accès n'est ajouté.

`road-ribbon.mjs` échantillonne désormais aussi les demi-largeurs routières par bandes d'au plus 2 m. Il utilise le même MNT, la même largeur source et les mêmes joints. Le dévers du bord ne se propage plus sur une demi-chaussée entière par une seule grande face. Les mêmes triangles alimentent le support physique et le rendu. La phase longitudinale d'origine, 4 m, est conservée : l'essai à 2 m a provoqué une régression réelle sur une couture étroite et a été abandonné. Ce retour est archivé, sans ajustement de seuil de collision.

La sonde D749 appelle le vrai `CarController.clearAt`, exporte ses évaluations jusqu'au premier refus et, séparément, les cinq supports indépendants et raycasts visibles. L'overlay cyan sert au diagnostic à l'arrêt : il ne positionne pas la voiture pendant un voyage et ne constitue pas une animation jouée. Le seuil normal automobile 0,45, les dimensions de coque, les accès privés/inconnus, le rail, les passages d'eau et la hauteur libre sous ouvrage restent appliqués.

## Personnage et oiseaux

Le rig v10 conserve ses 31 os et 7 880 triangles. Le redémarrage initialise le pied de swing au contact puis au toe-off ; il n'impose plus un état à mi-vol. La première phase de support peut finir avant le dépassement de portée de jambe. La clairance du pied intervient avant la résolution du bassin/IK ; elle tend vers zéro aux extrémités. L'arrêt règle un appui devenu inaccessible et les grands dt d'attente utilisent aussi les sous-pas. Aucun filtre global des os ne masque les contacts. Les contrôleurs de marche et leur graphe lié au hash source sont conservés.

Les oiseaux conservent leurs trajectoires analytiques déterministes. L'enveloppe de virage/inclinaison, l'énergie d'ailes et la visibilité des événements utilisent maintenant des transitions quintiques C2 et le même âge de vol. La sélection de perchoirs favorise les identités déjà sélectionnées. Il s'agit d'une correction de continuité ; ses tests ne prouvent pas le naturel perceptif du vol.

## Ombres et eau

Le tronc grossier visible réutilise la rotation de vent à la racine du tronc fin/caster. L'ancien décalage entre tronc grossier courbé et ombre de tronc fin est traité à cette cause. La fonction de vent nécessite une lecture des champs/atlas sur le tronc grossier ; son coût doit rester dans les mesures. Les ombres du soleil, leurs tailles par profil, les casters stables et l'hystérésis héritée restent actifs. Cette modification ne prétend pas résoudre tout shimmer, toute pixellisation ou le réglage artistique mondial des ombres.

La racine du packraft ne reçoit plus le bob vertical : le bob appartient à sa coque enfant. Mains et pale suivent donc le même repère que la vraie poussée/contact `paddlePose`. Le contact à555m sur la Gartempe a ensuite révélé une eau locale≈33cm plus basse sous la pale. Le shaft reçoit une articulation bornée à0,4rad et un décalage latéral compensateur pour conserver la portée de la pale hors coque ; la même pose finale alimente le rendu, les cibles des mains et la poussée. Deux évaluations bornées lisent le vrai niveau local après rotation. Leur enveloppe utilise `authoredX`, la phase initiale immuable, pour que répéter une lecture de la même eau donne exactement la même pose ; le prototype91 réutilisait une coordonnée déjà corrigée et pouvait empêcher tout contact au retour. Une chute de5m reste hors de portée et ne génère aucune poussée. La géométrie d’eau, la bathymétrie, la coque et ses collisions restent inchangées. La qualité des poignets/prises doit encore être jugée à cadence lisible.

Les deux sillages et le pool de 48 marques d'eau existants sont réutilisés ; aucun effet supplémentaire ni bathymétrie mesurée inventée.

Les limites d'ouvrages du Clain historique restent fermées lorsque la hauteur libre est inconnue. Les nouvelles rivières sont choisies dans les polygones OSM étiquetés rivière ; les graphes servent à sélectionner des essais, jamais à déclarer des kilomètres parcourus. La preuve de navigation donne séparément odomètre à chaque pas, progression signée projetée sur le suivi, déplacement net et retour au débarquement.

## Coût et durée de vie

`PlanetSurface` garde un cache borné de 512 cellules de requête : tableaux figés, ordre identique, invalidation à chaque mutation `add`/`remove`, y compris entre deux yields du générateur et lors du vidage. Les tests couvrent les owners partagés et les requêtes pendant l'installation.

`water-polygon.mjs` spécialise le prédicat rayon zéro par la même parité de rayons que l'ancien test de disque. Il évite de calculer des distances aux arêtes dont le résultat était inutilisé. Aucun élargissement de berge n'en résulte. `walking.mjs` est restauré à l'identique afin de conserver l'authentification du graphe pédestre existant. Les budgets coopératifs d'origine restent appliqués ; un budget demandé de 3–4 ms ne garantit pas que chaque `next()` soit borné. Les dépassements mesurés restent des défauts ouverts.

## Instrumentation et trois horloges

Les helpers M26.4 sont réservés aux builds de preuve. Le pas accéléré appelle la frame de production entière avec dt explicite, commandes normales et collisions actives ; le rendu n'est demandé qu'aux points de contrôle. Il n'est ni un film natif ni un benchmark FPS. Une session native et les films utilisent uniquement RAF et l'horloge réelle, sans ces pas. Les bancs isolés excluent les autres campagnes et l'encodeur.

Le shim commun aux captures appariées prépare, avant chaque scène indépendante, date/heure/climat/seed/caméra/profil demandés identiques et remet le cache des perchoirs au même état. Le climat et les animations avancent ensuite normalement. La brume sensible, certaines matrices solaires et les historiques de cache restent différents ; aucune égalité complète de climat ni régression≤5% n’est déduite de ces prises. Les états complets avant/après, matrices de soleil, framebuffer et paramètres de profil sont exportés ; toute différence réelle reste vérifiable. La touche F8 du mode `review=1`, uniquement dans le build instrumenté, affiche les diagnostics et permet un export local. Ce mode ne prouve aucune revue matérielle : celle-ci reste à effectuer selon [REPRODUCTION.md](mission-26-4-evidence/REPRODUCTION.md).
