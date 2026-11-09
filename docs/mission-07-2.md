# Mission 07.2 — Les routes du monde réel

## Audit préalable (avant modification)

Base : `cb7325239f836defefc08ef0d5c4f12c6aeab7d9`, dernier `origin/main` vérifié après fusion de la PR #12. Branche : `mission/07-2-routes-matieres`. Captures des missions 07 et 07.1 examinées : aérienne et rue rasante. Les intersections sont continues ; les surfaces semblent peintes, sans profondeur de matière, et les bords restent tranchants.

Le sol et les routes partagent 25 maillages et un MeshLambertMaterial. Les six classes ont des couleurs fixes, stockées dans le dérivé géométrique. Le même atlas de bruit 64², sans anisotropie explicite, donne à toutes les classes une variation presque identique. Le grain répète à 0,59 m ; le pavage shader est une grille régulière 32 × 20 cm, très peu contrastée. Les motifs sont déjà exprimés en mètres, mais l'échelle et l'amplitude du bruit n'évoquent aucun granulat particulier. Le détail disparaît entre 8 et 65 m : au loin, il ne reste que la silhouette et la couleur uniforme.

Il n'y a ni normale de matière ni réponse de rugosité : Lambert est entièrement diffus. L'ajout de spéculaire permanent serait incorrect pour des routes sèches. Une refonte PBR générale n'est pas justifiée ; évaluer un petit relief de normale, filtré, sur ce modèle diffus existant. L'éclairage, la météo et l'atmosphère restent ceux du moteur. Les profils partagent le shader terrain ; Éco réduit résolution/ombres et change les rayons LOD, sans matière spécifique.

La coupure `earthRoadType` exclut la chaussée de la carte d'occupation du sol. Aucune information de distance au bord ne vient adoucir cette séparation. Les grandes faces ne permettent pas une simple interpolation de couleur d'accotement sans risques de triangles visibles : évaluer un champ de distance compact hors ligne, indépendant du maillage.

## Sources et fidélité

Le fichier OSM déjà livré (extraction du 8 novembre 2026, ODbL) contient 138 voies : 30 `asphalt`, 2 `concrete`, 8 `sett`, 1 `unhewn_cobblestone`, 10 `unpaved`, 3 `grass`, 1 `compacted`, 1 `dirt`, 2 `gravel`, 1 `ground` et **79 sans surface**. Ce sont des tags contributifs, pas une inspection physique récente. `concrete` reste groupé avec les surfaces scellées du système existant ; `unpaved` et `grass` sont des sols non scellés interprétés, pas des relevés de terre nue.

Exemples documentés : Rue de la Cueille (203459882), Place Aimé Octobre (239209736) et Rue de l'Arceau : `sett` ; sentier 1421393085 : `gravel`, largeur 2 m ; piste 657662319 : `dirt`. La voie gravillonnée 1149746205 est privée et ne doit pas devenir une destination de promenade. Aucun inconnu ne sera converti en pavé. Aucune nouvelle orthophoto ni photographie locale vérifiée n'a été obtenue ; palette, pierres, grain et patine sont des interprétations procédurales originales. IGN et OSM, coordonnées, hauteurs, largeurs et accès ne sont pas modifiés.

## Réalisation et validation

En cours : première passe de matériaux, comparaisons reproductibles, seconde passe artistique, séquences en mouvement et validation fonctionnelle. Les mesures et résultats seront renseignés après exécution, sans confondre SwiftShader et GPU matériel.
