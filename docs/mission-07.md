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

3. **Passe 3** : la capture du chemin rural révèle une bande d’eau verticale à la limite du pilote. La ligne de rivière complète dépasse largement notre grille et utilisait localement l’altitude zéro lorsque le relief manquait. Les segments sont maintenant coupés à l’emprise du MNT ; aucune altitude de secours n’est injectée dans l’eau. Un test couvre les lignes entrant, sortant et restant hors du relief. Nouvelle série finale de captures et nouvelle promenade après correction.

Les [planches 1](mission-07-captures/planche-1.jpg), [2](mission-07-captures/planche-2.jpg) et [3](mission-07-captures/planche-3.jpg) présentent douze paires. La [planche 4](mission-07-captures/planche-4.jpg) conserve le diagnostic EXIF obstrué ; elle n’est pas comptée comme une vue réussie. Les captures sont assemblées avec leurs couleurs intactes, réduites pour la lecture. Les positions, orientations et mesures complètes restent dans [before.json](mission-07-captures/before.json), [after.json](mission-07-captures/after.json) et [comparison.json](mission-07-captures/comparison.json). Deux exemples de la première passe restent conservés : [forêt](mission-07-captures/pass1-foret.png), [aérienne](mission-07-captures/pass1-aerienne.png).

## Mesures et validation

Les résultats finaux, la promenade complète et les limites de mesure sont consignés avec les artefacts de cette mission. Les FPS historiques de Mission 06 sous quota/affinité différents ne servent pas de référence comparative. Les tests unitaires et synthétiques ne constituent pas un profil matériel.

## Limites et prochaine mission

Cette mission n’importe ni LiDAR, ni orthophoto, ni BD TOPO, ni BD Forêt, ni OCS GE/RPG/Copernicus/TOPAGE. Le relief source, les cours d’eau, les ponts et les constructions conservent les limites déclarées ci-dessus. Le monde gagne en cohérence et en coût de dessin mais reste visiblement procédural. Aucun habitant n’a évalué le « waouh local » ; il ne serait pas honnête de le déclarer acquis.

La prochaine étape est d’autoriser l’accès aux services officiels, vérifier les dalles exactes et leur acquisition, importer un vrai MNT avec un manifeste complet, puis valider une migration commune du repère métrique. Ensuite : occupation des sols récente, pont documenté, modèle patrimonial vérifié pour quelques éléments du château, puis mesure sur téléphone et GPU matériel. Garder les photos et leurs incertitudes comme contrôle externe, et refaire les 450 m après toute modification altimétrique.
