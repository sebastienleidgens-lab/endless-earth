# Mission 26.3 — Architecture de continuité et de reprise

Ce document décrit les correctifs du moteur existant. Les résultats d’acceptation, leurs versions exécutées et leurs limites figurent dans [le rapport propriétaire](mission-26-3.md) et dans [la galerie](mission-26-3-evidence/index.html). Un graphe source, une admission locale et un voyage terminé sont trois preuves différentes.

## Chaussée, terrain et propriétaire du contact

`src/planet/road-ribbon.mjs` construit des sections communes aux segments successifs d’une même voie OSM. La ligne centrale source est conservée. Les sections mitrées ferment les coins laissés par les anciens rectangles indépendants. Les subdivisions suivent le segment source entier, avant son découpage par tuile : deux propriétaires voisins ne choisissent plus chacun une phase différente. Le rendu et l’index de contacts utilisent les mêmes triangles Float32. Les largeurs restent celles des tags ou des règles d’inférence déjà présentes ; aucune autorisation supplémentaire n’en découle.

Le diagnostic de référence au point automobile de 3,883 km montre un passage temporaire du propriétaire chaussée au propriétaire terrain, environ 15 cm plus bas. Les coupes et les raycasts sont conservés dans les preuves. La correction porte sur le maillage, sans augmenter les tolérances de la voiture.

Le runtime reconnaît explicitement un contact `surface: road` issu du maillage rendu et d’un propriétaire résident. Cette chaussée prête ne dépend plus du raffinement d’un terrain voisin. Hors chaussée, le sol de contact fin reste nécessaire ; une surface absente conserve une hauteur nulle au sens « indisponible », jamais un plan de secours.

Pour le piéton sur voie admise, le dévers ne ferme plus toutes les directions par sa seule normale. La politique rejoint celle du pilote : le contrôleur existant vérifie chaque sous-pas, sa pente directionnelle, son atterrissage et ses ruptures verticales. Les limites de pente du contrôleur, la marche de 18 cm, les refus d’eau, de bâtiments, de barrières, de propriété et de rail sont conservés. Le hors chaussée et la voiture gardent leurs limites de normale.

## Préparation et résidence

`WorldTileManager` borne les résidents par capacité et octets, les chargements concurrents et les demandes. Chaque requête porte une génération, une phase et un état observable. Les phases distinguent le réseau/décodage, l’attente de l’installateur sérialisé et l’installation. Le délai réseau est arrêté dès que les données sont décodées ; il ne peut plus expirer à la place du délai de la file d’installation. L’installation reçoit son propre AbortSignal et un délai borné. Une réponse périmée ne devient pas résidente.

Un échec de la tuile requise apparaît comme `tile-unavailable` / `RETRYABLE_BLOCKED`, avec la tuile et l’erreur. Il n’est plus présenté comme un chargement indéfini. Le bouton existant « Recharger le paysage » relance les demandes. Les essais enregistrent chaque utilisation de ce bouton, gardent la position physique et limitent les reprises. Les compteurs de non-progression physique et d’attente explicite sont distincts. Une activité de fond quelconque ne suffit pas à excuser une collision.

L’installation commence par une représentation lointaine du terrain, puis les voies et leurs contacts. Le raffinement fin se prépare ensuite. La file coopérative donne priorité à l’installation physique, puis aux lots statiques, puis au raffinement facultatif. Cette priorité évite qu’une tuile indispensable attende derrière des travaux de détail d’autres propriétaires. Le sol hors route reste fermé pendant cette préparation.

Le détail fin explicitement requis par `preparePoint`/une reprise reçoit la priorité −2, le contact de l'acteur −1 et un raffinement extérieur 20. Un travail déjà en file peut être repriorisé. Cela corrige notamment le cas d'une berge dont la tuile était résidente mais dont le contact fin attendait des installations urbaines voisines. Une tuile résidente n'est donc pas confondue avec un contact fin prêt.

Le calcul de terrain réutilise les échantillons projetés et les identités des sommets. Les lignes fines sont découpées en groupes de huit cellules ; les copies finales des buffers sont aussi découpées. Le contrôle d’équivalence conserve les buffers de positions, couleurs, indices et couture exactement identiques sur les cas comparés. Cela ne constitue pas une garantie que toute allocation ou GC reste sous 8 ms : les dépassements mesurés sont publiés.

Les 499 packs de relief 2 m restent versionnés et demandés à proximité du voyage. Leur pin est `acb0a73b396229bf90731b90a558a8d5d072a9ec`. Ils ne sont pas ajoutés au bundle et ne sont pas tous téléchargés au lancement. Les vérifications SHA, les limites de décompression et les règles de publication des propriétaires restent actives.

## Trafic et navigation physique

Le trafic décoratif continuait auparavant jusqu’au bout d’un horizon artificiel d’environ 1,8 km, puis restait arrêté au milieu de la route. Il peut désormais prolonger cet horizon par des liens du graphe source effectivement chargé. Le préfixe déjà parcouru est conservé pendant la prolongation ; l’historique et le préfixe inutile sont bornés. Une vraie fin de voie, un accès refusé ou un support manquant arrête toujours l’agent. Les véhicules ne sont ni effacés devant le joueur ni privés de leur coque.

L'exclusion topologique de prolongation conserve les deux derniers nœuds, pour éviter le demi-tour immédiat. L'historique complet de 256 identités ne ferme plus une boucle routière réelle déjà parcourue. Le test du triangle dirigé distingue ce cycle d'une vraie impasse. Ce correctif ne résout pas tous les arrêts d'IA sur support ou les conflits de circulation : leurs échecs restent dans le registre.

Le conducteur de preuve est distinct du produit. Il ne produit que des commandes de conduite. Il anticipe les virages et suit les segments sources effectivement dépassés au lieu de revenir vers un petit nœud OSM raté au milieu d’un virage arrondi. Les refus du contrôleur, du trafic et des quatre coins de coque restent autoritaires. Les tests de ce conducteur ne certifient pas un voyage de 40 ou 80 km : seule une arrivée physique, avec odométrie mesurée, peut le faire.

Le conducteur final mesure son horizon depuis la projection actuelle sur le segment source, jusqu’au début du segment suivant. Un raccord OSM de5m suivi d’une arête de104m ne cache plus la sortie derrière la longueur de cette arête. Les deux régressions du banc couvrent ce cas et un sommet approché en virage arrondi sur une arête longue. Cela a permis de dépasser la panne de guidage sur la N147 à43,6km ; l’essai suivant s’arrête plus loin, à60,68km, sur un refus physique distinct. Ce changement reste dans le banc, sans relâcher une admission du produit.

Les dernières reprises du conducteur peuvent sonder une copie indépendante du même `CarController`, avec les mêmes admissions et occupants, puis exécuter un recul/virage par les commandes normales. L'original ne reçoit jamais la position calculée de la copie. Les métriques et la position de la copie sont indépendantes. Une anticipation de coque et une manœuvre bornée évitent de confondre une mauvaise commande du banc d'essai avec une correction du moteur. Elles ne rendent pas admissible un passage inconnu ou une barrière ; seules les reprises qui arrivent effectivement peuvent satisfaire les distances.

Pour les départs d’Angles, le graphe historique vérifié du pilote sert à sélectionner une approche depuis le vrai spawn. Il est relié à un segment de sortie source puis au réseau départemental. Les points d’approche sont des cibles de direction ; tout raccord doit encore être franchi par le contrôleur. Les bandes de couture initialisées séparément sont identifiées comme telles et ne remplacent jamais cette preuve depuis le spawn.

## Eau et activités

La sélection de berge vérifie séparément la présence hydrographique, le maillage d’eau, le support terrestre, son accès, le raccord à la berge, la coque et le réseau connecté. Les candidats terrestres proviennent des surfaces explicitement admises ou des corridors routiers existants. Un inventaire de candidats ne donne aucun droit d’accès réel et n’est pas une navigation.

La révision du contact rendu entre dans l'identité du cache aquatique. Une découverte de berges calculée avant publication du détail fin ne reste plus figée jusqu'à un chargement/déchargement de tuile. Sur chaussée admise, le support sec de berge utilise la hauteur de cette chaussée rendue ; ailleurs il exige le terrain visible et l'admission terrestre. Les accès fermés, y compris `agricultural` et `forestry`, restent fermés. Les limites des composants sont publiées, sans additionner des boucles pour fabriquer un corridor de 1 km.

La bathymétrie, le courant et le niveau sont des approximations de jeu. Les ouvrages inconnus, barrages et restrictions restent refusés. Le contrôle des ponts couvre les valeurs de bridge autres que `no`, pas seulement `yes`. Le suivi utilise le véritable contrôleur de packraft et la prise d’eau de la pale. Une zone morte entre le rayon de freinage et celui d’arrivée pouvait le laisser immobile à environ 1,8 m de son objectif : une faible commande de pagaie conserve maintenant l’approche jusqu’au rayon d’arrivée, sans imposer une position.

Les essais de débarquement activent le véritable bouton de récupération. Une première version du banc d’essai appelait une action générique inexistante ; cette invocation ne pouvait pas valider la récupération. L’échec original et cette correction méthodologique sont conservés.

## Animation, oiseaux et ombres

Les contacts des pieds bénéficient de la même propriété de chaussée et des raccords physiques que la marche. Aucune nouvelle courbe de gait n’est présentée comme la résolution perceptive du tremblement. Les reprises, vues, durées physiques et limitations de cadence sont séparées dans les preuves.

La sélection des arbres qui projettent une ombre utilise une hystérésis spatiale de huit mètres autour de la limite de budget. Elle réduit l’alternance des identités de casters sous de petits déplacements. Elle conserve les modèles sources et le vent partagé, et ne change pas la géographie. Ce correctif ne certifie ni la disparition du shimmer, ni celle de la pixellisation, ni la qualité perceptive générale. Les trois profils et les limites de leur budget restent identifiés.

## Bancs de preuve et reproductibilité

Les builds diagnostiques ajoutent des lectures du support, du rendu, des files, du rig et de la coque. Ils conservent le corps complet de la frame, les contrôleurs et les collisions. Un pas manuel est explicite et plafonné à 0,25 s comme la production. Les longs parcours accélérés rendent des checkpoints ; ce ne sont ni des films natifs, ni des mesures de FPS. Les déplacements diagnostiques précèdent les essais indépendants. Le cas spawn ne les utilise pas.

Les captures natives proviennent du canvas et du mix audio existant. Le compteur de simulation additionne les véritables dt de la boucle. L’horloge environnementale ne sert pas à reconstituer une durée physique. Les fichiers, builds, versions et hashes sont liés dans l’index des preuves ; les tentatives échouées restent consultables.

Les coordonnées de simulation restent en Float64 dans le repère historique ; les coordonnées EPSG:2154, WGS84 et le datum IGN69 sont conservés séparément. L’origine flottante n’est pas une relocalisation du joueur. Une sauvegarde/reprise explicitement testée est distinguée d’une correction de position interdite pendant le voyage.
