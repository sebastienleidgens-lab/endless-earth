# Mission 07 — La Terre véritable

## Ce qui progresse, et ce qui ne progresse pas encore

Le sol distingue les deux forêts réellement présentes dans l’extrait OSM ; les voies dont le revêtement est renseigné distinguent asphalte, pavés et terre. Les routes suivent désormais les **triangles exacts du relief IGN**, y compris entre leurs sommets. Les ruines ne présentent plus des pics indépendants tous les cinq mètres, et leurs fondations suivent le terrain. Leur géométrie est regroupée pour réduire les appels de rendu.

Le terrain devient un ensemble borné de 25 tuiles, avec culling et deux niveaux de détail préparés hors navigateur. Le terrain près du joueur conserve intégralement les altitudes et triangles précédents. Le niveau éloigné conserve les sommets de bordure et n’est accepté que si son écart à la surface source reste inférieur à 25 cm. Les 921 bâtiments, les empreintes de collision, les trois caméras, les exclusions OSM, le graphe de promenade, l’heure, la météo, les oiseaux et l’audio sont conservés.

**La résolution géographique reste 10 m. Aucun LiDAR HD n’a été importé.** Le catalogue officiel est consultable, mais le téléchargement et l’interrogation spatiale de Géoplateforme sont bloqués dans cet environnement. Une disponibilité nationale annoncée ne prouve pas la livraison des dalles d’Angles-sur-l’Anglin. Ce travail améliore la restitution des données locales, pas leur précision de levé. Le résultat reste stylisé et n’atteint pas encore une reconnaissance photographique du village.

Base : `cc7cf2cd17eadb6a240830e9877dc5a2c6fad86a`, dernier `origin/main` au départ. La fusion de la PR #10 est vérifiée via GitHub (`merged: true`, 9 novembre 2026) et par l’historique Git. Travail sur `mission/07-terre-veritable`, livraison uniquement en PR en brouillon. Aucun workflow de déploiement ou d’import sur `main` n’est lancé.

## Données effectivement utilisées

| Élément | Donnée locale et qualité connue | Limite |
| --- | --- | --- |
| Relief | IGN RGE ALTI via API `ign_rge_alti_wld`, extraction du 8 novembre 2026 ; 201 × 201 nœuds, pas d’échantillonnage 10 m ; emprise locale de −1 000 à +1 000 m sur les deux axes | Date de vol et résolution du produit sous-jacent non fournies par cette extraction. **10 m désigne le pas de notre grille**, pas la précision altimétrique certifiée. |
| Altitudes | 63,93 à 126,37 m ; origine verticale relative : altitude IGN interpolée au centre du village | Le champ de datum existant dit « IGN normal elevations » sans référence détaillée. Aucune conversion verticale supplémentaire n’est inventée. |
| Bâtiments | 921 empreintes OSM ; 916 `yes`, deux `service`, une église, une chapelle, un toit | 920 hauteurs inférées par l’architecture existante. Les ouvertures et toitures restent procédurales. Les dates cadastrales des objets sont hétérogènes. |
| Voies | 138 lignes OSM : rues, chemins, pistes et six escaliers | 79 revêtements inconnus ; 30 asphaltés, huit `sett`, dix non revêtus, autres tags moins fréquents. Largeurs existantes de 2,5 / 5,5 m interprétées, pas mesurées. |
| Eau | Cinq polygones `natural=water`, une ligne de rivière et deux seuils `weir` | Niveaux déduits du relief et largeurs de lignes schématiques. Pas de bathymétrie ni de niveau hydrométrique daté. |
| Bois | Deux polygones `landuse=forest` ; un `leaf_type=broadleaved`, un `leaf_type=mixed` | Limites OSM, sans inventaire individuel des arbres. Aucun polygone de culture, prairie, haie ou zone humide dans cet extrait. |
| Château | Périmètre OSM `961675973`, source cadastrale indiquant 2021 et identification patrimoniale | Hauteurs et état des murs non levés ; ni tours exactes ni modèle patrimonial 3D. |

L’extrait OSM porte l’emprise `[0.8735,46.6872,0.8953,46.7034]` et une extraction du 8 novembre 2026. Cela ne garantit pas l’exhaustivité d’OSM sur la commune. Les grands espaces non renseignés restent un sol de fond interprété ; ils ne sont pas déclarés « prairie ».

### Coordonnées et échelle

Toutes les couches conservent le repère existant : centre WGS84 **46,6953 N / 0,8844 E**, X vers l’est, Z vers le sud ; une unité de rendu représente un mètre local. La conversion historique utilise 111 320 m/degré et le cosinus de la latitude centrale. Elle est partagée par l’import IGN précédent, OSM, les collisions et la préparation des dérivés.

La comparaison avec les rayons de courbure de l’ellipsoïde WGS84 borne l’erreur d’échelle des axes à moins de **0,2 %** autour de ce centre, soit moins de 2 m par kilomètre sur un axe. Ce repère est une approximation locale, **pas Lambert-93**. Aucun recalage isolé des bâtiments ne vient déplacer une couche par rapport aux autres. Une migration commune vers ENU/Lambert-93 reste recommandée avec le futur MNT ; la qualifier aujourd’hui de précision centimétrique serait faux.

La fonction d’altitude commune conserve le choix de diagonale selon les différences d’altitude. Les tests effectuent des tirs verticaux sur le maillage réellement construit et comparent les intersections aux collisions. Les sommets/normales communs aux tuiles sont identiques. Les racines gardent leur altitude source, sans rééchantillonnage aléatoire.

## Sources étudiées le 9 novembre 2026

Les liens ci-dessous sont les sources consultées. Les dates de mise à jour d’un catalogue ne sont pas des dates de vol. « Non vérifié localement » signifie qu’aucune extraction spatiale probante n’a pu être obtenue pour notre emprise ; ce n’est pas une déclaration d’absence de données.

| Source officielle | Couverture d’Angles et résolution établies | Millésime local | Licence et redistribution publique |
| --- | --- | --- | --- |
| [IGN LiDAR HD MNT](https://www.data.gouv.fr/datasets/mnt-lidar-hd), [documentation IGN](https://cartes.gouv.fr/aide/fr/partenaires/ign/observations-regulieres-territoire/relief/mnt-lidar-hd/) | Catalogue : dalles 1 km, grille 50 cm. Couverture complète annoncée à terme ; **dalles d’Angles non vérifiées**. MNT sol/eau/points virtuels ; MNS exclu comme terrain. | Non établi pour notre emprise | Licence Ouverte 2.0 ; réutilisation et redistribution avec source et date de mise à jour. Respect des nodata/ZICAD. |
| [IGN BD ORTHO](https://www.data.gouv.fr/datasets/bd-ortho-r) | Couverture métropolitaine annoncée, sauf restrictions ; résolution produit 20 cm. Aucun pixel local téléchargé. | Non établi ; le cycle national ne date pas notre tuile | Licence Ouverte 2.0 ; attribution IGN, produit et date du lot effectivement utilisé. Peut devenir référence, pas texture téléchargée au démarrage. |
| [IGN BD TOPO](https://www.data.gouv.fr/datasets/bd-topo-r) | Référentiel vectoriel 3D de précision métrique. Extraction locale et hauteurs de notre village non vérifiées. | Non établi ; Express hebdomadaire ne date pas chaque objet | Licence Ouverte 2.0 ; redistribution avec attribution IGN/date du lot. |
| [IGN BD Forêt V2](https://www.data.gouv.fr/datasets/bd-foret-r) | Catalogue : toute la métropole, donc département 86 inclus ; formations d’au moins 5 000 m². Polygones d’Angles non téléchargés. | V2 élaborée de 2007 à 2018 ; année du département non vérifiée ici | Licence Ouverte 2.0 ; attribution IGN et millésime du lot. Une formation dominante ne localise pas une essence arbre par arbre. |
| [IGN OCS GE](https://www.data.gouv.fr/datasets/ocs-ge) | Catalogue actuel : couverture nationale en deux millésimes. Donnée vectorielle ; seuil géométrique dépendant de classe/version non vérifié dans cette session. | Millésimes propres à Angles non établis | Licence Ouverte 2.0 ; attribution IGN/date. Aucune surface importée ou présentée comme OCS GE dans le jeu. |
| [RPG / ASP / IGN](https://www.data.gouv.fr/datasets/rpg) | Parcelles PAC vectorielles, couverture des déclarants seulement ; pas de résolution raster à annoncer. Parcelles d’Angles non extraites. | Édition locale non choisie ; contenu et catégories à vérifier avant import | Licence Ouverte 2.0 pour la diffusion publique anonymisée ; attribution ASP/IGN, édition. Ne pas confondre culture annuelle et prairie permanente. |
| [Copernicus TCD](https://land.copernicus.eu/en/products/high-resolution-layer-forests-and-tree-cover?tab=tree_cover_density), [documentation](https://cis2.eea.europa.eu/data/547/) | Europe, densité de couvert à 10 m pour les références 2018–2023 documentées ; pixel valide d’Angles non interrogé. La densité n’indique pas une essence. | Non sélectionné localement | [Politique CLMS](https://land.copernicus.eu/en/data-policy) : accès ouvert, source, modifications indiquées, aucune approbation officielle suggérée. Attribution du produit et DOI lors d’un import. |
| [BD TOPAGE / Sandre](https://www.data.gouv.fr/datasets/bd-topage-r-metropole-2025) | Référentiel hydrographique métropolitain vectoriel ; précision dépendant des objets, non assimilable à un MNT. Tronçons/surfaces locaux non téléchargés. | Catalogue métropole 2025 consulté ; pas de lot local validé | Licence Ouverte 2.0 ; attribution producteurs et édition du lot. |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Extrait local réel présent dans le dépôt ; coordonnées vectorielles, qualité et complétude variables | Extraction 2026-11-08 ; objets plus anciens | ODbL 1.0 : attribution et obligations de partage de la base dérivée. L’atlas et sa source sont redistribués ensemble, avec [notice](../public/data/LICENSE.md). Le code reste distinct de la base. |

La licence ouverte autorise la réutilisation commerciale sous ses conditions ; elle ne dispense pas d’identifier la source et les dates connues. Les catalogues peuvent évoluer : conserver les métadonnées exactes de chaque futur téléchargement plutôt que recopier les dates de ce tableau.

### Obstacle réseau vérifié

L’environnement applique une liste d’hôtes autorisés. `data.geopf.fr`, `services.sandre.eaufrance.fr` et `land.copernicus.eu` ne sont pas autorisés pour le téléchargement depuis l’exécuteur. Les trois probes `curl --max-time 20` renvoient **CONNECT 403 Forbidden** ; ce n’est pas un « aucune dalle trouvée ». La recherche web permet de lire les catalogues, mais n’a pas permis d’obtenir la réponse WFS d’emprise. Aucune capacité de modification de cette politique n’était disponible parmi les outils de cette session.

La requête prioritaire tentée est documentée dans [network.json](mission-07-captures/network.json). Elle cible `IGNF_LIDAR-HD_TA:mnt-dalle`, un rectangle de marge autour du pilote, et demande du GeoJSON. Comme la requête n’atteint pas le service, ni le nombre de dalles ni le millésime local ne sont établis. Il n’y a aucun téléchargement massif, aucun contournement du proxy et aucun faux LiDAR de substitution.

## Préparation du terrain et de l’occupation des sols

`npm run geo:prepare` est entièrement hors ligne et déterministe. Il produit :

- `angles-terrain-lod.bin` : indices de 25 tuiles de 400 m, Uint16 little-endian ; aucun point du nuage LiDAR.
- `angles-landcover.png` : masque/couleur interprétée des polygones OSM explicites, échantillonné à 2 m, avec transparence pour les usages inconnus. Ce pas n’est pas une nouvelle précision de source.
- `angles-earth.json` : provenance, SHA-256 des entrées et sorties, emprise, nombre de triangles et tolérance géométrique.

Le navigateur vérifie les empreintes du relief, d’OSM et des dérivés. Un fichier absent, corrompu ou périmé provoque le retour au maillage IGN exact, sans atlas ; le jeu reste praticable. Des tests navigateur couvrent ces trois échecs. Les données préparées sont chargées au démarrage ; **ce n’est pas encore du streaming géographique national**. La préparation végétale progressive et les caches bornés existants restent actifs.

Le maillage fin compte 80 000 triangles avant culling, le niveau lointain 62 656. La simplification teste les intersections entre les nouveaux triangles et les triangles source : tester uniquement les nœuds IGN manquerait certains écarts entre diagonales. Le bord de chaque bloc/tuiles garde tous les sommets de 10 m. Pas de jupe masquant une fissure, pas d’altitude inventée, normales communes inchangées.

Le choix de LOD utilise la distance minimale à la tuile depuis **le joueur et la caméra** : fin jusqu’à 340 m (240 m en Éco), retour au fin à ce seuil, passage au lointain au-delà de 60 m supplémentaires. Près du joueur, collisions et surface affichée restent identiques. L’écart maximal éloigné de 25 cm est inférieur au pixel aux distances usuelles du protocole ; aucune promesse universelle n’est faite pour un futur champ de vision ou un affichage géant. Les deux géométries possèdent leurs index et sont libérées au déchargement, avec les matériaux et la texture/bitmap du terrain.

### Routes, sols et végétation

Les bandes de route sont découpées à chaque cellule et diagonale IGN traversées. Le sol routier se situe à **4,5 cm** au-dessus du terrain source, au lieu de rubans dont seuls les centres suivent le relief à +19 cm. Cette marge évite le z-fighting et reste petite pour les pieds ; elle ne crée ni nouveau tablier de pont ni collision distincte.

Les revêtements OSM connus pilotent des matériaux partagés. Les tags manquants conservent un matériau générique ; « voie secondaire » ne devient pas automatiquement « asphalte vérifié ». Le modèle garde les largeurs existantes.

La hiérarchie du masque actuel est sémantique et explicite, sans mélange de sources : un terrain cultivé reste agricole, une clairière trouée reste vide, l’eau et les bâtiments sont exclus du coloriage d’habitat. Le pipeline sait traiter prairie, culture, verger, jardin, zone humide, roche et espaces artificialisés **si des polygones les renseignent**. Dans les fichiers actuels, seule la forêt contribue : 107 651 pixels, soit environ 0,431 km² dans notre emprise. Ne pas lire cette surface raster comme une mesure cadastrale.

Le couvert feuillu explicite conserve ses silhouettes feuillues. Le tag mixte autorise une proportion procédurale de silhouettes de conifères : **35 % est un choix artistique**, pas une statistique de peuplement ; la sélection individuelle ne provient pas d’un relevé. Les positions, échelles, exclusions et racines des 1 650 arbres restent inchangées. Les arbres riverains gardent leur interprétation précédente. Les palettes de fond sont légèrement moins saturées, sans transformer une zone inconnue en prairie identifiable.

Pour croiser les futures sources : choisir d’abord un MNT documenté pour Z ; comparer BD TOPO aux empreintes/voies OSM pour chaque objet ; prendre l’OCS GE pour couverture/usage et le RPG pour la déclaration agricole de son année ; préférer BD Forêt pour les formations au couvert satellitaire plus général. Résolution, date et définition doivent être comparées **par attribut**, pas par un score universel. Garder les désaccords et provenance séparés ; ne pas écraser silencieusement un jardin OSM par une classe de couvert à 10 m.

## Pipeline préparé pour le MNT LiDAR

`scripts/import-mnt.py` accepte des GeoTIFFs **MNT**, bande unique, Lambert-93 EPSG:2154, nord en haut, IGN69 explicitement identifié, avec SHA-256, date d’acquisition, URL et licence. Il refuse MNS, nodata, couverture partielle et changements d’orientation ambigus. Il reprojette les coordonnées d’échantillonnage avec PyProj puis écrit la grille entière atomiquement. Le pas proposé est 5 m : compromis à mesurer, pas une obligation d’afficher les 50 cm du produit source. Le navigateur ne reçoit jamais ces GeoTIFFs bruts.

Ce pipeline a été exécuté **sur un raster synthétique de test**, avec orientation, projection, checksum, nodata, déterminisme et préservation du fichier précédent lors d’un échec. Ce test n’est pas une preuve de couverture LiDAR réelle. L’import utilise le pixel source le plus proche et le repère local existant ; vérifier les raccords, datum et erreurs de rééchantillonnage avant d’activer une vraie nouvelle grille. Exécuter d’abord vers `work/`, reconstruire les dérivés, puis refaire les tests d’alignement et la promenade.

## Reconnaissance du lieu et références réelles

Deux photos libres sont documentées dans [mission-07-references.json](mission-07-references.json), avec auteur, licence, date et coordonnées. Elles sont liées et non embarquées comme textures : [Floppy36, pont/château, 5 octobre 2024, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Anglin_-_Angles-sur-l%27Anglin_(86)_-_Pont_et_Ch%C3%A2teau.jpg) ; [Pom’, rivière/château, 27 juillet 2023, CC BY-SA 2.0](https://commons.wikimedia.org/wiki/File:Angles-sur-l%27Anglin,_Vienne,_France_-_Flickr_-_pom%27..jpg). Toute redistribution d’une photo demanderait crédit, lien de licence, mention des transformations et respect du partage à l’identique applicable.

La première fournit un cap EXIF de 57,95°. **Sa position GPS tombe dans l’empreinte OSM du bâtiment 89222727** : la capture diagnostique depuis ces coordonnées est donc obstruée. Ce constat peut venir de l’incertitude du GPS, de l’empreinte cadastrale ancienne (tag 2010), ou de la scène ; il ne prouve pas à lui seul un décalage global. Aucune caméra n’a été déplacée discrètement pour faire croire à un alignement exact. La seconde ne fournit pas de cap validé. L’altitude EXIF n’est pas convertie arbitrairement en IGN69, et la hauteur de l’œil/focale/cadrage ne sont pas calibrés.

| Secteur / vue reproductible | Éléments, relief, échelle et couvert | Écart réel restant / appréciation visuelle |
| --- | --- | --- |
| Village | Empreintes et positions conservées ; rue mieux lisible grâce au revêtement connu | Façades, ouvertures, hauteurs et seuils largement interprétés ; reconnaissance d’une rue précise non validée par photographie. |
| Vallée | Même versant IGN et même horizon géométrique proche ; moins de géométrie hors champ | Talus et ruptures de pente lissés par 10 m ; pas de comparaison de caméra réelle calibrée. |
| Rivière | Contours d’eau OSM et relief conservés ; aucune forêt ajoutée sur l’eau | Berges simples, eau plane et pont non reconstruit ; le regroupement village/falaise/rivière reste insuffisant pour une équivalence photo. |
| Bois | Contours OSM, sol forestier différencié et racines au contact | Espacement et formes individuels interprétés ; sous-bois encore sobre, absence de référence locale géolocalisée à cette station. |
| Espace ouvert / chemin rural | Même relief et routes OSM ; sol de fond peu saturé | Usage agricole inconnu dans l’extrait : aucune prairie fleurie ajoutée. Manque des parcelles/haies. |
| Chemin en pente | Drapage exact aux triangles IGN ; marge de 4,5 cm | Largeur et microrelief/escaliers non mesurés. La station de capture ne certifie pas toute la voie praticable. |
| Sol proche | Matériau de forêt sans seconde surface concurrente ; détails existants conservés | Pas de nouvelle précision du terrain ni d’inventaire botanique. |
| Vue en hauteur / aérienne | Promontoire et empreinte du château conservés ; silhouette moins dentelée | Hauteurs de ruine illustratives entre 4,2 et 9,4 m ; tours et archères réelles non modélisées. Le pont à arches manque. |
| Lointain | Volumes source conservés à la tolérance LOD documentée ; limites de tuiles communes | Hors des 2 km, paysage national non chargé ; brume et végétation restent des interprétations. |
| Éco / mobile | Même géographie et contrôles, textures et ressources mutualisées | Interface historique encore encombrante ; aucune preuve Android/GPU physique. |
| Repère EXIF | Position/cap enregistrés sans correction cachée | Vue obstruée : preuve d’une incompatibilité de référence, **pas** une comparaison photographique réussie. |

Priorités des écarts : relief des falaises/berges à 10 m ; pont et ses arches ; état/hauteurs du château ; parcelles agricoles et haies absentes ; hauteurs de maisons ; microrelief des accès. Les corrections traitées ici concernent le contact des surfaces, les matériaux documentés, la silhouette illustrative trop dentelée et le coût du rendu. Les arches et hauteurs manquantes ne sont pas inventées pour embellir une capture.

## Passes artistiques et comparaisons

1. **Passe 1**, `pass1-*` : atlas d’habitat, routes et terrain tuilé. Inspection de la forêt, des pentes, de l’aérienne et de la rue. La première station de rue tombait contre une façade : station corrigée au départ de promenade existant puis références avant/après reprises. Le faible gain du LOD à 8 cm et les ruines trop dentelées restent visibles.
2. **Passe 2**, `after-*` : tolérance distante à 25 cm, palettes plus sobres, prise en compte du tag mixte et ressources de LOD correctement libérées. Correction du contact des fondations des ruines et profil spatial continu ; regroupement des murs pour enlever leur coût en appels. Inspection de la vue aérienne finale et du repère EXIF obstrué. Aucun ajout de décoration pour masquer le relief manquant.

Les comparaisons portent sur douze vues utiles et une station diagnostique EXIF. Le chemin rural est placé sur le segment OSM `450089955` ; la rue en pente sur `148936368` (environ 4,4 % sur le segment retenu), au lieu de positions simplement proches de voies. Le protocole [browser-earth.mjs](../scripts/browser-earth.mjs) fixe positions, yaw, pitch, zoom, mode, profil et date (21 juin 2026, midi UTC), suspend les images d’animation puis prépare les caches de détail selon le même ordre. Il n’ajoute aucune téléportation au produit. Les caméras et la géographie sont comparées dans les JSON ; ce n’est pas un test de pixels de végétation animée. Les chronomètres logiciels imposent une lecture RGBA complète après rendu pour attendre effectivement la fin des commandes.

3. **Passe 3** : la capture du chemin rural révèle une bande d’eau verticale à la limite du pilote. La ligne de rivière complète dépasse largement notre grille et utilisait localement l’altitude zéro lorsque le relief manquait. Les segments sont maintenant coupés à l’emprise du MNT ; aucune altitude de secours n’est injectée dans l’eau. Un test couvre les lignes entrant, sortant et restant hors du relief. Le coût du masque de sols est ensuite limité aux 12 tuiles contenant un habitat cartographié ou sa marge de filtrage de 16 m ; les 13 autres n’effectuent aucune lecture de l’atlas. Nouvelle série finale de captures et nouvelle promenade après correction.

Les [planches 1](mission-07-captures/planche-1.jpg), [2](mission-07-captures/planche-2.jpg) et [3](mission-07-captures/planche-3.jpg) présentent douze paires. La [planche 4](mission-07-captures/planche-4.jpg) conserve le diagnostic EXIF obstrué ; elle n’est pas comptée comme une vue réussie. Les captures sont assemblées avec leurs couleurs intactes, réduites pour la lecture. Les positions, orientations et mesures complètes restent dans [before.json](mission-07-captures/before.json), [after.json](mission-07-captures/after.json) et [comparison.json](mission-07-captures/comparison.json). Deux exemples de la première passe restent conservés : [forêt](mission-07-captures/pass1-foret.png), [aérienne](mission-07-captures/pass1-aerienne.png).

## Mesures et validation

Environnement : Chromium 156 / ANGLE / Vulkan / **SwiftShader Subzero**, 800 × 600 et 390 × 844, ratio 1 ; quota de quatre CPU, affinité autorisée 0–4. Aucun périphérique `/dev/dri` ou NVIDIA n’est exposé. Le rendu logiciel est imposé aux scénarios reproductibles ; **aucun profil GPU matériel ou Android physique n’est revendiqué**. Les FPS historiques de Mission 06 sous quota/affinité différents ne servent pas de référence comparative.

### Dessin et temps logiciels, caméras identiques

| Vue | Appels avant → après | Triangles dessinés avant → après | Médiane de fin de dessin logiciel, ms |
| --- | ---: | ---: | ---: |
| Village | 113 → 123 | 293 117 → 264 057 | 239,1 → 228,0 |
| Vallée | 39 → 49 | 193 570 → 163 950 | 106,2 → 106,2 |
| Rivière | 93 → 105 | 232 672 → 207 532 | 138,7 → 146,0 |
| Forêt | 35 → 41 | 174 057 → 136 657 | 96,6 → 97,7 |
| Ouvert | 86 → 94 | 151 511 → 120 063 | 78,6 → 83,0 |
| Chemin rural | 28 → 42 | 124 530 → 81 572 | 73,8 → 67,3 |
| Rue en pente | 77 → 85 | 211 220 → 179 324 | 102,8 → 109,2 |
| Sol proche | 18 → 23 | 147 757 → 107 653 | 50,9 → 45,6 |
| Aérienne | 285 → 154 | 296 995 → 273 663 | 185,2 → 198,4 |
| Lointaine | 79 → 88 | 200 750 → 170 758 | 109,0 → 104,3 |
| Éco | 92 → 104 | 213 050 → 187 910 | 120,8 → 120,0 |
| Mobile | 46 → 55 | 168 851 → 137 375 | 71,2 → 67,9 |

Les triangles diminuent de **7 à 34,5 %**, selon la vue, diagnostic EXIF compris. Les appels diminuent fortement devant le château (regroupement des ruines), mais augmentent ailleurs de 5 à 14, notamment à cause des tuiles et des silhouettes mixtes. Les compteurs architecturaux et les octets de leurs buffers sont **identiques dans les treize paires** ; les 1 650 placements végétaux sont également vérifiés identiques par [équivalence des données](mission-07-captures/equivalence.json), erreur de racine nulle.

Ces treize paires utilisent cinq lectures RGBA complètes par station après deux rendus de préparation, une rotation avant puis après. Cela mesure la fin des commandes de dessin logiciel, pas seulement leur soumission JavaScript. **Il n’y a pas de gain uniforme de vitesse** : rivière, forêt, ouvert, pente et aérienne sont défavorables dans cette rotation ; l’aérienne est environ 7 % plus lente malgré ses appels réduits. L’exécution reste sensible à SwiftShader, à la compilation et à la charge. Le tableau n’établit ni une amélioration statistique de FPS ni une cadence de 60 FPS sur matériel. Les mesures brutes et le script [earth-compare.py](../scripts/earth-compare.py) permettent de refaire les comparaisons.

Une **seconde rotation, dans l’ordre après puis avant**, conserve les positions/profils et l’égalité des buffers architecturaux. Elle confirme la variabilité : l’aérienne est défavorable d’environ **0,7 à 7,1 %** selon la rotation, la forêt d’environ **1,1 à 5,4 %** ; plusieurs autres écarts changent de signe. Le coût logiciel supplémentaire de certaines vues reste donc une limite, malgré la réduction des triangles. [Résumé des deux rotations](mission-07-captures/repeated-comparison.json), [avant seconde rotation](mission-07-captures/before-r2.json), [après seconde rotation](mission-07-captures/after-r2.json). Cette répétition améliore la traçabilité, sans suffire à une conclusion statistique sur GPU matériel.

### Chargement, préparation, cellules et mémoire

- Chargement local jusqu’aux données prêtes : **7,963 s avant / 5,823 s après**, une seule mesure par version, compilation et cache compris. La mesure initiale coïncide avec des vérifications de développement ; **aucun gain de chargement n’est attribué au code**.
- Trois constructions CPU de terrain dans le navigateur : avant **23,4 / 15,4 / 19,3 ms**, après **29,6 / 36,0 / 17,2 ms** ; médianes **19,3 → 29,6 ms**. La préparation des tuiles coûte davantage au démarrage ; les buffers sont ensuite réutilisés, pas reconstruits à l’approche.
- Dans la rue, géométries uniques retenues : **30,50 → 32,71 Mo**. Ce compteur inclut les attributs/index possédés des deux LOD, sans compter deux fois les tableaux partagés. Il exclut matrices d’instances, tas JavaScript et mémoire du pilote. L’architecture représente 27,62 Mo et reste identique dans cette vue.
- L’atlas ajoute au maximum **5,33 Mo RGBA avec mipmaps** lorsqu’il est chargé sur le GPU ; son PNG ne pèse que **8 387 octets**. C’est une estimation de texture, pas toute la mémoire du processus. Les textures existantes ne sont pas incluses dans ce delta. Les trois dérivés réseau ajoutent environ 389 ko, dont 375 936 octets d’indices.
- Préparation combinée des détails et LOD lors des stations : maximum **26 ms** dans cette rotation, dont des constructions de cache. Ce compteur inclut architecture et nature ; il n’isole pas le seul terrain.
- [Mesure CPU de nature séparée](mission-07-captures/nature-cpu.json), sous Node 24.22.1 : trois générations par version, mêmes données/altitudes. Médiane **205,85 → 179,13 ms**, avec ordre avant puis après et effet de chauffe ; aucun gain statistique n’en est déduit. Pour les cellules proches de la station forestière : préparation par tranche, maximum **2,28 → 3,60 ms** ; dernière construction de buffer et mise à jour LOD, maximum **9,29 → 10,80 ms**. Ce sont des mesures CPU hors navigateur, sans rendu GPU.

Le benchmark de cellules [earth-nature-cpu.mjs](../scripts/earth-nature-cpu.mjs) mesure le vrai code de génération, sans le remplacer par une réplique. Les tests de cache vérifient absence de reconstruction au repos, hystérésis, éviction bornée et destruction des ressources. Les index lointains sont préparés hors navigateur ; la géométrie de terrain reste un ensemble fixe, pas un cache national extensible.

### Déplacements et contrôles

Les tests finaux comprennent les **73 tests Node**, la compilation de production, le test synthétique Python de l’import MNT, le chargement navigateur, les trois caméras et le zoom, le balayage devant les murs, les collisions dynamiques et la reprise manuelle. Les scénarios de vivant vérifient aussi l’audio (six cycles et douze bascules rapides), le profil Éco et le format mobile. Les captures finales ne relèvent aucune erreur JavaScript ou de compilation WebGL.

[Index des validations exécutées](mission-07-captures/validation.json). L’import synthétique a été vérifié avec Rasterio 1.5.2 et PyProj 3.8.0 ; ces dépendances restent hors du bundle du jeu.

[data-validation.json](mission-07-captures/data-validation.json) vérifie dans la vraie scène **102 174 sommets de route** : écart maximal au décalage attendu de 4,5 cm, **0,033 mm** (arrondi). Les 1 728 sommets bas des ruines suivent leur niveau de fondation à moins de 0,001 mm dans cette mesure Float32. Ces précisions décrivent la cohérence numérique avec la grille, **pas la précision du relevé IGN**. Les cas sans manifeste, index corrompu et source OSM périmée retrouvent chacun le terrain exact, sans atlas et sans erreur JavaScript.

Les ponts à altitude de tablier inconnue restent bloqués ; les tests de navigation avec tablier vérifié utilisent des cas synthétiques et ne valident pas le pont réel du village. Les surfaces et usages non renseignés n’obtiennent pas de nouvelle autorisation de passage.

**Promenade finale : 450,000 m planimétriques cumulés à chaque image, en 341,3876 s (5 min 41,39 s), 3 132 images observées en marche.** Chronomètre externe : 343,018 s ; arrêt normal « Fin du parcours OSM validé ». Le relevé une fois par seconde donne 449,751 m et sous-estime les virages ; c’est le cumul par image qui valide les 450 m. Les vitesses, le contrôleur et le plafonnement du delta à 250 ms sont inchangés. Les durées historiques sous d’autres quotas CPU ne sont pas utilisées pour revendiquer une accélération.

Le graphe conserve **939 sommets / 918 segments**. Le parcours calculé le plus long trouvé par le sondage fait 3 787,53 m ; il n’a pas été parcouru et ne doit pas être confondu avec les 450 m réellement réalisés. À l’arrivée, les compteurs architecturaux sont strictement conservés : 921 bâtiments, 10 723 ouvertures, 69 cellules, `builds: 1`.

La trace bornée contient **3 219 images**, sans atteindre sa limite de 8 192 : de l’initialisation à l’arrivée, y compris le sondage du graphe et les tests de caméra. Le temps CPU de mise à jour avant soumission a pour médiane **3,9 ms**, p95 **8,7 ms**, p99 **23,6 ms**, maximum **30,5 ms**. La soumission du rendu, qui peut attendre le logiciel graphique, a un maximum de **285,4 ms**. La médiane d’intervalle entre images est **101,3 ms**, p95 **186,5 ms**, p99 **273,7 ms** ; **20 intervalles dépassent 300 ms**, maximum **5 173,4 ms** dans cette trace incluant le démarrage et le harnais. Même en retirant les 100 premières images, le maximum reste **429,3 ms**. Le moteur logiciel n’est donc pas présenté comme une promenade fluide à 60 FPS. Le coût CPU de mise à jour est distinct de l’attente de rendu, et l’absence de blocage GPU matériel n’est pas démontrée.

La promenade traverse au plus quatre cellules végétales résidentes dans cette trace ; les index de terrain changent de niveau sans reconstruction. Les tests séparés vérifient l’hystérésis et l’éviction lors de déplacements plus larges que ce parcours. Preuves : [mesure et percentiles](mission-07-captures/walk.json), [trace complète JSON comprimée sans perte](mission-07-captures/walk-cpu.json.gz), [graphe](mission-07-captures/walk-survey.json), [début](mission-07-captures/walk-60.png), [milieu](mission-07-captures/walk-180.png), [fin de trajet](mission-07-captures/walk-300.png), [arrivée mobile](mission-07-captures/walk-arrivee-mobile.png). Les captures de promenade sont prises pendant le fonctionnement normal, sans suspendre ni accélérer le temps.

La compilation finale produit un bundle d’environ **599 ko / 164 ko gzip** ; l’avertissement Vite au-dessus de 500 ko préexistait. Les scénarios navigateur finaux repassent après la dernière correction des lignes d’eau et des matériaux. Les vérifications de cette mission restent locales ; aucune publication de production n’a été effectuée.

## Limites et prochaine mission

Cette mission n’importe ni LiDAR, ni orthophoto, ni BD TOPO, ni BD Forêt, ni OCS GE/RPG/Copernicus/TOPAGE. Le relief source, les cours d’eau, les ponts et les constructions conservent les limites déclarées ci-dessus. Le monde gagne en cohérence et en coût de dessin mais reste visiblement procédural. Aucun habitant n’a évalué le « waouh local » ; il ne serait pas honnête de le déclarer acquis.

La prochaine étape est d’autoriser l’accès aux services officiels, vérifier les dalles exactes et leur acquisition, importer un vrai MNT avec un manifeste complet, puis valider une migration commune du repère métrique. Ensuite : occupation des sols récente, pont documenté, modèle patrimonial vérifié pour quelques éléments du château, puis mesure sur téléphone et GPU matériel. Garder les photos et leurs incertitudes comme contrôle externe, et refaire les 450 m après toute modification altimétrique.
