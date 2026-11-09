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

## Matériaux et coût retenu

Le modèle Lambert existant reste diffus : pas de reflet permanent, pas de nouvelle passe PBR ou de pipeline d'éclairage. Un relief de normale dérivé de la hauteur filtrée évoque une surface sèche : amplitude interprétée de 1,8 mm pour l'asphalte, 6 mm pour les pavés et le gravier, 3 mm pour les sols. Il ne déplace aucun sommet et ne participe pas aux collisions. Les inconnus urbains ont un relief deux fois plus faible, sans joints.

L'atlas original est généré de façon déterministe au démarrage : quatre régions de 256² texels, séparées par des marges périodiques de 16 pixels (image totale 576² RGBA8). Canaux : ton minéral, hauteur, variation de pierre, opaque. L'asphalte répète à 2 m mais se combine à une seconde échelle tournée de facteur 3,71 ; les autres classes utilisent 4 m. Les pavés font environ 20 × 24–31 cm, avec déphasage et nombre de pierres différents selon les rangs, joints légèrement déformés et patine modérée. Le gravier combine cellules de 2–8 cm et matrice fine ; la terre combine plusieurs fréquences, sans ornières ni fissures inventées.

Les UV viennent des coordonnées locales métriques, jamais d'un numéro de sommet. Les dérivées des UV sont prises avant `fract` avec `textureGrad` pour ne pas produire de sauts de mipmap à chaque répétition. Mipmaps trilinéaires, filtre linéaire et anisotropie plafonnée à 8 selon le renderer. La variation de grande échelle reprend le bruit du terrain voisin. Le microdétail et son relief s'effacent progressivement entre 12 et 75 m selon la distance réelle à la caméra ; la couleur, les nuances lentes et l'intégration des bords subsistent.

Coût supplémentaire : deux lectures d'atlas près du joueur, une lecture du champ de distance pour l'intégration. Le grain naturel ancien n'est plus échantillonné sur la route. Les normales utilisent les dérivées de la hauteur déjà lue, sans troisième lecture de matière et sans trigonométrie par fragment. Au loin, les lectures de microdétail sont supprimées. Aucun appel de rendu ou triangle ajouté.

L'atlas coûte environ 1,77 Mo avec mipmaps ; le champ R8 2048², environ 5,59 Mo. Cette carte géographique supplémentaire est justifiée par la continuité des accotements aux carrefours, indépendamment de la tessellation. Elle représente une interprétation douce sur des emprises souvent estimées, pas un relevé de bordure. Un dérivé absent, corrompu ou périmé désactive seulement cette finition : chaussées unifiées, grain et navigation restent utilisables. Le terrain n'est jamais remplacé par des rectangles superposés.

## Passes artistiques

1. Atlas de grain et relief diffus, palette différenciée, premier champ de distance aux frontières externes. Captures `pass1-*.png`. La vue de gravier initiale regardait hors de l'axe du chemin ; le cadrage retenu a été corrigé puis repris à l'identique avant et après.
2. Revue des gros plans et de l'aérien : pierres trop grandes, fins traits parasites aux limites de l'atlas, accotements trop peu visibles. Réduction du module des pavés, joints plus doux, ajout de marges périodiques et atténuation du relief. Les images de la première passe sont conservées comme trace de ces corrections.
