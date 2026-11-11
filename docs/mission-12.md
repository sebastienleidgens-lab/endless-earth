# Mission 12 — La poésie des lieux

## État : Jalon C livré pour validation artistique

Les Jalons **A, B et C** sont livrés. Les demandes successives **« Continue »** ont ouvert B après A, puis C après B. **D n'est pas commencé** et exige un nouvel accord explicite. Aucun merge ni déploiement public.

Branche indépendante `mission/12-poesie-des-lieux`, créée depuis le main GitHub vérifié **83d9258587177593bc3debd681544d7704a68882**, fusion de la Mission 11 par la PR #20. Le checkout fourni était encore à `0f699fa` : il a été actualisé avant de capturer la référence. Living Paintings / LP-01 et les workflows de production sont hors périmètre.

Ouvrir [la galerie avant/après du Jalon C](mission-12-evidence/nature/index.html). Les galeries A et B restent conservées. Les captures et vidéos viennent du vrai moteur Three.js, sans illustration générée.

## Jalon C — Nature généreuse et vivante

Ouvrir **[la galerie du Jalon C](mission-12-evidence/nature/index.html)** : douze paires de vues, saisons, sélection de géométries, deux films de vent et une nouvelle promenade. Référence : B `96c824a2a2d5220d69d31c503dde82ed154e3db6`, servi dans un checkout distinct. Les preuves A et B restent conservées.

### Audit et choix des formes

La référence montre des couronnes faites de six volumes similaires, des fourches très simples, des détails bas peu lisibles et une coloration saisonnière commune aux feuillus et conifères. Les douze poses couvrent forêt proche/aérienne, lisière, sous-bois, végétation près de l'eau, **prairie réellement classée comme telle**, vent modéré, régime orageux, printemps, automne, hiver et conifères en hiver. Le premier emplacement envisagé pour la prairie était classé en broussailles : il a été remplacé après consultation des données, dans les deux versions.

Deux approches sont [comparées dans le moteur](mission-12-evidence/nature/approaches.json) : volumes procéduraux de 120 triangles proches, et bouquets ajourés de **84 triangles**. Le choix retenu est hybride : bouquets originaux proches, volumes partagés de **60 triangles** au loin et dans Éco. Les conifères gardent leurs étages coniques, **21 / 12 triangles**. Des branches principales et secondaires partagent un tronc de **40 triangles**, contre 32 avant. Aucune scène n'est remplacée par une illustration.

Les cartes restent orientées dans le monde, avec parallaxe ; elles ne tournent pas face à la caméra. Les imposteurs sont différés pour conserver une forme stable en marche et en vue aérienne. Instanciation et deux lots par cellule d'arbres sont conservés, sans objet ou animation CPU par arbre. Des traits déterministes varient largeur, ouverture et décalage saisonnier. Les ancrages, rotations et échelles précédents restent conservés ; aucun nouvel arbre n'est ajouté.

Les pages officielles [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) et [Quaternius Ultimate Nature Pack](https://quaternius.com/packs/ultimatenature.html) ont été consultées : HTTP 200 et CC0 affiché, respectivement 330 fichiers et 150 modèles. Elles sont étudiées comme solutions de modèles réutilisables ; aucun modèle individuel n'est importé et aucun coût ou LOD individuel n'est supposé. Les formes originales permettent de conserver les lots et enveloppes métriques précédents. [Journal de sélection](mission-12-evidence/nature/resources.json).

### Bibliothèque, habitats et saisons

Huit familles génériques dans `src/nature/library.mjs` : feuillu étalé, forme de milieu humide, jeune arbre, conifère, herbe, fougère, petit buisson et herbe dressée de milieu humide. Métadonnées : forme, dimensions plausibles, habitat, climat, persistance, saisonnalité, pente, exposition, humidité, variantes, LOD et confiance. Ces métadonnées décrivent des **interprétations**, pas une observation botanique locale. Les 2 500 individus sont déjà inférés dans les habitats cartographiés ; ils gardent exactement leurs coordonnées, tailles, classes et identité. Douze sont issus de la classe en aiguilles/mixte, sans identification d'espèce. Le comportement persistant des conifères est une hypothèse tempérée par défaut.

Les recettes de détail introduisent des plages irrégulières déterministes, des fougères à frondes croisées, de petits buissons, des herbes de hauteurs variées et des formes dressées près de l'eau lorsque l'habitat végétalisé et la distance le permettent. Les positions restent soumises aux exclusions existantes : eau, bâtiments, marges routières, terrain absent et pentes trop fortes. Pas de forêt ajoutée dans les classes inconnues ou sur toute roche. Les fleurs pâles restent rares et moins nombreuses dans la sélection ; aucune décoration florale uniforme.

Le calendrier est lu depuis **l'environnement Mission 11** : pousse printanière, nuances et pertes automnales échelonnées, feuillus dégarnis au cœur de l'hiver, conifères conservés, végétation basse réduite/séchée. La variation entre individus évite un automne uniformément orange. La fonction accepte l'hémisphère, mais ne prétend pas prédire une phénologie locale précise. Aucune neige automatique liée à une température ou une date. Les saisons n'altèrent ni relief ni collisions.

### Mouvement et promenades réelles

Le mouvement réutilise `lifeWind`, les ancrages et bases d'instance de Mission 11. L'amplitude est graduée entre couvert proche, volumes lointains et plantes basses ; phases et flutter diffèrent entre bouquets. Le tronc conserve son ancrage et le faible mouvement antérieur. Les profils et commandes de désactivation gardent leur budget existant. Aucun second vent, nouvelle faune, événement périodique ou source sonore n'est ajouté ; les événements existants sont conservés.

Deux films natifs à **800 × 600, Équilibré**, station forestière compatible avec le prédicat de collision : Ensoleillé → Nuageux → Orageux, onze secondes par régime via les commandes ordinaires. **32,854 s / 214 images avant ; 32,926 s / 181 images après** entre les premières/dernières frames, sans accélération. Les vitesses simulées enregistrées vont d'environ 0,20 à 0,77, avec une composante de rafale ; ces valeurs normalisées ne sont pas des mesures en m/s. Son réel post-limiteur, sans modification de gain ou normalisation.

Une promenade automatique distincte parcourt **24,910 m en 32,916 s**, **80 images** réellement rendues. Toutes les positions enregistrées passent les collisions existantes ; audio et cache restent dans leurs budgets. La référence de promenade est celle de B. Films non synchronisés image par image ; aucun trajet continu entre le village et la pose forestière n'est revendiqué. Le timestep plafonné et SwiftShader affectent la distance et la cadence : ce n'est pas une validation de fluidité matérielle. [Traces et médias](mission-12-evidence/nature/README.md).

### Performance et budgets C

**174 tests Node**, TypeScript/Vite, vrai navigateur, galerie mobile et build compilé. Sources IGN/ASP/OSM, terrain/sols/eau A, architecture B, navigation, collisions, audio, météo, budgets EarthLife, Living Paintings / LP-01 et workflows de production vérifiés inchangés. Les **67 packs de détails architecturaux**, leur pack statique, ancrages et dimensions sont identiques à B. Les 250 packs naturels changent volontairement. [Preuve de préservation](mission-12-evidence/nature/preservation.json).

**288 rendus / 144 paires**, mêmes caméras, vent et profils, quatre stations, trois profils, trois passages alternés et quatre échantillons par version/station/passage, **800 × 600**. Les temps synchronisés/readback sont ceux de **SwiftShader**, sans extrapolation à un GPU physique ou Android. Les intervalles interquartiles et inventaires complets restent dans [la synthèse](mission-12-evidence/nature/summary.json) et [la trace](mission-12-evidence/nature/performance.json.gz).

| Profil | Forêt proche | Forêt aérienne | Sous-bois | Prairie documentée |
| --- | --- | --- | --- | --- |
| Éco | 125.2 → 129.8 ms (+3.6 %) | 164.3 → 169.4 ms (+3.0 %) | 156.2 → 151.0 ms (-3.3 %) | 117.4 → 125.5 ms (+6.9 %) |
| Équilibré | 156.6 → 156.2 ms (-0.3 %) | 181.3 → 203.3 ms (+12.1 %) | 173.8 → 194.3 ms (+11.8 %) | 133.7 → 149.4 ms (+11.8 %) |
| Qualité | 120.5 → 122.0 ms (+1.2 %) | 174.4 → 179.7 ms (+3.0 %) | 154.2 → 158.3 ms (+2.7 %) | 137.6 → 133.6 ms (-2.9 %) |

Écarts médians selon la vue : **Éco -3,3 % à +6,9 % ; Équilibré -0,3 % à +12,1 % ; Qualité -2,9 % à +3,0 %**. Pas de gain uniforme de FPS revendiqué. Les triangles soumis diminuent dans ces stations. Les appels restent identiques pour trois vues ; la prairie passe de **45 à 46** avec la marge de culling couvrant le nouveau mouvement. GPU physique et Android restent à valider.

Éco n'échantillonne pas les bouquets texturés. Équilibré et Qualité sélectionnent le détail à **75 / 110 m de la sphère de lot**, avec hystérésis de 18 m : il ne s'agit pas d'un seuil exact par arbre. Les distances de détails bas et leur cache de **quatre cellules invisibles** restent conservés. Dix-huit changements de station/profil/saison passent. Des chunks corrompus laissent les arbres et la géographie disponibles ; un manifeste périmé déclenche les constructeurs source déterministes. Trois cycles GPU de texture de zone donnent **8 → 9 → 8**, libération incluse, sans accumulation constatée dans cet essai court.

Une texture originale partagée **256² RGBA8**, PNG de **15 907 octets**, au maximum **0,33 Mio** supplémentaires estimés avec mipmaps ; les scènes proches passent de 7 à 8 textures. Les traits des 2 500 instances ajoutent **40 000 octets**. Les couleurs des détails utilisent des octets normalisés, avec arrondi de canal borné à 0,5/255 en espace linéaire. Somme de tous les buffers de nature possibles : **74 727 360 → 58 112 736 octets** ; tous les détails ne sont pas résidents ensemble. Packs naturels compressés : **23 773 488 → 26 316 177 octets** ; ensemble des décorations : **32 737 387 → 35 280 076 octets**. Ces comptes CPU et estimations de textures ne sont pas des allocations GPU matérielles mesurées. [Inventaire](mission-12-evidence/nature/buffers.json).

Dernière préparation complète : **12,59 s**, dont **1,23 s** pour la génération initiale ; elle reste hors promenade. Les chunks livrés sont contrôlés par empreinte avant décodage. Budget financier **0 €** : texture et formes originales, catalogue auteur/source/transformation/empreintes, aucune ressource externe ou service payant supplémentaire. [Catalogue et familles](../public/materials/nature/catalog.json).

### Reproduction et appréciation

Préparer : `npm run geo:nature-art`. Vérifier : `npm test`, `npm run build`, puis `npm run preview -- --port 5180`. Jeu compilé isolé : `http://localhost:5180/endless-earth/?moment=afternoon&weather=clear`. Galerie C sur Vite : `http://localhost:5173/endless-earth/docs/mission-12-evidence/nature/index.html`. Aucun hébergement public de prévisualisation n'est revendiqué.

Référence B dans un checkout distinct servi sur 5178 : `TEST_PORT=5178 node scripts/browser-regional-nature.mjs before`. C : `node scripts/browser-regional-nature.mjs after`. Puis `node scripts/benchmark-regional-nature.mjs`, `node scripts/browser-regional-nature-motion.mjs before` et `after`, `node scripts/browser-regional-nature-runtime.mjs`, `node scripts/report-nature-buffers.mjs`, `node scripts/verify-regional-nature.mjs`. Variante de sélection : `ART_APPROACH=volume TEST_VIEWS=bois EVIDENCE_DIR=work/mission-12C/approaches node scripts/browser-regional-nature.mjs volume`, puis `python scripts/report-regional-nature.py` et `node scripts/browser-regional-nature-gallery.mjs`. Ne pas réécrire les preuves A/B depuis C.

Les familles, nouvelles géométries, shaders, saisons et recettes sont **implémentés** et **fonctionnels** dans les essais. Les couronnes ajourées et la perte du feuillage hivernal sont **perceptibles** dans les comparatifs et le mouvement. Le caractère **artistiquement convaincant** reste à votre appréciation. La ramification reste stylisée, les densités d'arbres antérieures restent conservées, les détails de sous-bois restent sobres, et le MNT à 10 m reste visible. Aucun inventaire botanique, modèle exact de forêt, longue marche ou validation matérielle Android n'est revendiqué.

**Arrêt après C. Attendre l'accord explicite du propriétaire avant D, qui n'est pas commencé.**

## Référence et livraison du Jalon B — Architecture régionale

Ouvrir **[la galerie du Jalon B](mission-12-evidence/architecture/index.html)**. La [galerie A](mission-12-evidence/index.html) reste conservée. La même branche et la PR #21 restent en brouillon, avec un commit identifiable par jalon.

Huit vues ont été enregistrées avant les changements : rue, façade proche, série de toitures, village, château, ensemble aérien, matin et pluie. Référence : A `bb58c30601e98ca29f3ffaa020554951bfd37ed6`, dans un checkout séparé. **Les 921 façades et toitures sont inconnues dans l'extrait OSM ; 920 hauteurs sur 921 sont estimées.** Les variations proposées sont des interprétations régionales et les estimations géométriques précédentes sont conservées.

### Changements visibles et réutilisables

La configuration `POITOU` devient `poitou-v2` : palettes coordonnées, échelles physiques des matières, proportions des encadrements, largeur des volets, couleurs des portes et vitrages, patine, variation et distances de détail. La **graine géométrique `poitou-v1` est conservée séparément** : changer l'apparence ne change pas les volumes, hauteurs ni positions des ouvertures principales. La sélection décorative reste déterministe à partir de l'identifiant géographique stable.

Un atlas procédural original partagé remplace les trois petites textures antérieures. Pierre aux joints et blocs irréguliers, enduit fin, tuiles variées, ardoise lorsqu'elle est renseignée, bois peint et matériau secondaire générique. Les tags documentés restent prioritaires ; les matériaux inconnus restent marqués comme interprétés. Dans cet extrait, la tuile est une hypothèse régionale, jamais une observation de chaque toit. Les UV et teintes varient entre bâtiments sans varier au rechargement.

Les portes, volets, encadrements et vitrages possèdent des nuances stables. Les volets et cadres restent dans les ouvertures et **dans les emprises existantes** ; aucune porte ne devient praticable. Une légère réponse des vitrages au ciel ne représente pas un intérieur documenté. La patine de pied de mur reste discrète, sans nouveau dénivelé ou obstacle. Aucun objet personnel, commerce, mobilier ou végétation de rue supplémentaire n'est inventé.

Les ruines reçoivent une matière de pierre continue en coordonnées mondiales et suivent la lumière existante. **Leur emprise, leur silhouette et leurs hauteurs illustratives sont inchangées** : aucun relevé historique ou reconstruction exacte n'est revendiqué. Aucun asset patrimonial externe non vérifié n'est importé.

### Données et non-régressions

Les **258 maillages principaux** conservent exactement les octets de positions, normales et indices du Jalon A. Les 921 bâtiments passent les tests d'emprise, de dégénérescence et d'occlusion des cours. Les détails fins changent de largeur à l'intérieur des limites antérieures. Les ancrages de bâtiments/portes, les 2 500 arbres et les **250 chunks naturels** sont identiques. IGN/ASP/OSM, terrain/sols/eau de A, navigation, collisions, audio et météo de Mission 11, Living Paintings et workflows de production sont inchangés. [Preuves](mission-12-evidence/architecture/preservation.json).

Le rendu utilise toujours les lots et caches précédents : mêmes appels et triangles dans les **144 paires** mesurées. Un attribut compact indique la famille de matériau sans créer d'objet par maison ; les UV des ouvertures permettent de partager le même atlas. Les nouvelles données sont préparées hors ligne, puis hydratées par le streaming existant. Dix-huit changements de station/profil gardent au maximum douze cellules architecturales invisibles en cache. Atlas corrompu : matière procédurale compacte de secours ; chunks périmés : génération source déterministe, sans perte de géographie. Aucune erreur JavaScript/WebGL dans ces essais.

### Coût et validations

**170 tests Node**, TypeScript/Vite, comparaisons de données et tests du vrai navigateur réussis. Les huit paires utilisent la même caméra, heure, météo, résolution **960 × 640** et profil Équilibré. Une promenade native supplémentaire conserve les contrôles ordinaires, collisions et son : **31,323 m en 32,881 s**, 99 images réellement rendues. La vidéo avant réutilise l'extrait livré au Jalon A ; les films ne sont pas synchronisés image par image. Le plafonnement du timestep et le rendu logiciel affectent la distance parcourue : cette capture n'est pas une validation de fluidité matérielle.

Mesures indépendantes : 288 rendus synchronisés/readback, quatre stations, trois profils, trois passages alternés, **800 × 600**. Surcoût médian de rendu logiciel selon la vue : **Éco +8,4 à +24,0 % ; Équilibré +13,9 à +24,4 % ; Qualité +15,7 à +30,3 %**. Ce ne sont pas des FPS sur GPU physique. Les normales de détail sont retirées en Éco ; GPU physique et Android restent à valider. [Table complète](mission-12-evidence/architecture/summary.json), [trace compressée](mission-12-evidence/architecture/performance.json.gz).

Les textures passent de **9 à 7** dans ces scènes. Atlas **864 × 576 RGBA8**, **1 194 098 octets** de PNG ; stockage supplémentaire estimé avec mipmaps **2,28 Mio**, distinct d'une allocation GPU mesurée. Buffers statiques : **16 755 350 → 18 863 289 octets**. Somme de tous les détails possibles : **29 243 916 → 35 992 512 octets** ; ils ne sont pas tous chargés simultanément. Les packs compressés n'augmentent que de **144 901 octets**, nature inchangée. La dernière préparation complète prend **8,46 s**, dont **1,24 s** de génération ; elle ne s'exécute pas pendant une promenade. [Inventaire de buffers](mission-12-evidence/architecture/buffers.json).

### Ressources et reproduction B

Budget **0 €**. Les six matières de l'atlas sont des créations procédurales originales pour Endless Earth ; aucune ressource externe, licence tierce ou API payante ajoutée. [Catalogue : auteur, dimensions, transformations et empreintes](../public/materials/architecture/catalog.json). Les licences IGN/ASP/OSM des géométries dérivées et tous les crédits antérieurs restent conservés. Les matières originales restent distinctes des observations cartographiques.

Préparer : `npm run geo:architecture-art`. Tester : `npm test`, `npm run build`, puis `npm run preview -- --port 5180`. Jeu compilé : `http://localhost:5180/endless-earth/?moment=afternoon&weather=clear`. Galerie sur Vite : `http://localhost:5173/endless-earth/docs/mission-12-evidence/architecture/index.html`. Les serveurs sont locaux et indépendants de la production.

Les preuves B se rejouent depuis le commit B `96c824a`, dans un checkout distinct. Reproduire les preuves B : `node scripts/browser-regional-architecture.mjs after`, `node scripts/benchmark-regional-architecture.mjs` (checkout A sur 5177), `node scripts/browser-regional-architecture-runtime.mjs`, `node scripts/browser-regional-architecture-walk.mjs after`, `node scripts/verify-regional-architecture.mjs`, `python scripts/report-regional-architecture.py`. Les scripts et preuves **A** se rejouent depuis le commit A `bb58c30`, sans réécrire leurs images depuis B.

### Évaluation artistique attendue

Les matières, variations, cadres et vitrages sont implémentés et fonctionnels ; leur différence est perceptible dans les comparatifs et le mouvement. L'harmonie, le caractère du village et la discrétion des joints/patines restent à votre appréciation. Les silhouettes et hauteurs estimées antérieures, certaines maisons sur pente et le MNT à 10 m restent des limites visibles. Une configuration alternative simple est testée sans conditions géographiques ; les deux fixtures régionales complètes du Jalon D ne sont pas commencées.

**Arrêt après le commit B. Attendre l'accord explicite du propriétaire avant le Jalon C.**

## Référence et livraison du Jalon A

## Audit avant modification

Lecture de `world/terrain.ts`, `landcover.mjs`, `environment.mjs`, `surface-mesh.mjs`, `road-material.ts`, `road-texture.mjs`, `geodata.ts`, `decoration-stream.mjs`, `ruins.mjs`, `nature/surfaces.ts`, `render.ts`, `ecology.mjs`, `architecture/style.mjs`, `plan.mjs`, `render.ts`, `living/atmosphere.ts`, modules EarthLife, atmosphère Mission 11, profils et générateurs hors ligne.

Huit stations enregistrées **avant toute modification du rendu**, avec matrices de caméra, position, date effective, météo, profil et résolution. Référence initiale : **163 tests réussis**, build TypeScript/Vite réussi. Les données actuelles sont déjà issues du LiDAR HD, mais échantillonnées à **10 m** dans le navigateur ; aucune acquisition ni amélioration altimétrique n'est revendiquée.

Trois défauts prioritaires visibles dans cette référence :

1. Sols naturels presque uniformes, même au premier plan ; même grain générique pour plusieurs habitats.
2. Pentes minérales peu lisibles, aplats verts ou beiges, projection horizontale inadaptée aux faces raides.
3. Rivière peu sensible au ciel, ondulations peu lisibles, contact terre/eau très net et uniforme.

La station roche révèle aussi les limites antérieures du DEM à 10 m et des bâtiments posés sur ces pentes. Cette mission ne corrige pas ces géométries en secret.

## Changements du Jalon A

- Atlas local partagé : terre générique, herbe dans les habitats documentés, litière interprétée dans les bois, roche. Échelles métriques, gutters périodiques, mipmaps, filtrage anisotrope borné et atténuation progressive avec la distance.
- Champ préparé hors ligne : poids des classes IGN/ASP/OSM et distance à **l'union des polygones d'eau existants**, y compris les îles. Pas de ligne de berge au raccord de deux polygones superposés. Source inconnue : matière générique, sans nouvelle attribution de prairie.
- Roche : mélange sur les normales du relief existant, projection sur les plans mondiaux dominants (raccord latéral adouci à proximité en Qualité) et relief de normales uniquement. Les couleurs minérales sont une interprétation artistique ; aucun relevé géologique local ajouté.
- Routes : mêmes classes, atlas, largeurs et indices ; joints/grains un peu plus lisibles et accotement moins uniforme. Aucun pavage, trottoir ou escalier supplémentaire.
- Eau : normales de surface oscillantes sans déplacement des sommets, Fresnel, réflexion analytique des couleurs du ciel Mission 11 et éclat solaire. Pluie et vent modulent le détail. Aucun débit ou sens de courant vérifié n'est déduit.
- Berges : teinte humide/minérale discrète dans le matériau existant et transition de couleur côté eau. Aucun ruban géométrique ni nouvelle végétation ajoutée.

Les nouveaux matériaux d'eau réutilisent l'heure, le soleil, les palettes et la pluie de Mission 11. Les reflets représentent le **ciel analytique**, sans reflet exact des maisons, des arbres ou des nuages individuels. Pas de profondeur mesurée ni de transparence bathymétrique.

## Ressources gratuites et licences

[Catalogue versionné](../public/materials/earth/catalog.json), [CC0 légal](../public/materials/earth/LICENSE-CC0.txt), [attribution géographique](../public/data/LICENSE.md). Budget : **0 €**.

**Poly Haven — Rock Face 03**, Dario Barresi (photographie), Rico Cilliers (traitement), [fiche](https://polyhaven.com/a/rock_face_03), [licence CC0](https://polyhaven.com/license), vérifiée le 11 novembre 2026. Réemploi commercial et redistribution autorisés. Diffuse et déplacement JPEG 1k téléchargés hors ligne, empreintes conservées, préparés en 256² et intégrés à un atlas de 576². Teinte désaturée et harmonisée ; déplacement employé pour l'éclairage uniquement. Échelle annoncée par la bibliothèque : **27 m**, aucune affirmation d'une photographie prise à Angles.

Terre, herbe et litière : matières procédurales originales, code versionné. Atlas minéral routier antérieur conservé. Aucun coût ou appel à un fournisseur de textures pendant la promenade.

Étude de sélection : Poly Haven fournit ici la roche photographique et son relief, [comparés dans le moteur](mission-12-evidence/asset-comparison.json) à une variante procédurale. La matière photographique est retenue pour ses ruptures moins régulières, après harmonisation de sa teinte. Les pages officielles d'ambientCG, Kenney et Quaternius ont été effectivement consultées, avec réponse HTTP 200 et indication CC0 : [journal de sélection](mission-12-evidence/resources.json). ambientCG reste une option de textures PBR sans import supplémentaire ; Kenney et Quaternius sont surtout pertinents pour des modèles stylisés, hors priorité A. Aucun droit individuel n'est supposé pour un asset non retenu, aucune collection n'est importée en bloc.

## Protocole de comparaison et mesures

Stations : rue minérale, prairie, pente, berge, eau proche, rivière éloignée, eau du matin, eau sous pluie du soir. Chromium/SwiftShader **960 × 640**, profil Équilibré, référence civile 21 juin 2026. Les instants effectifs sont calculés par le même moteur Mission 11 dans les deux versions. Simulation arrêtée pour les captures fixes ; mêmes pas de stabilisation et de chargement, caméra et LOD.

Les mesures complémentaires comparent trois profils, plusieurs stations et plusieurs passages sur la même machine. Les temps avec synchronisation/readback de SwiftShader mesurent un rendu logiciel ; **ce ne sont pas des FPS sur GPU physique**. Les nombres de textures et leur estimation de stockage sont distingués d'une mesure de mémoire GPU matérielle.

**288 rendus mesurés, soit 144 paires**, quatre stations, trois profils et trois passages, douze échantillons par version et station. Les caméras, appels de rendu et triangles sont identiques dans chaque paire. [Synthèse lisible](mission-12-evidence/summary.json), [trace complète compressée](mission-12-evidence/performance.json.gz).

| Profil | Rue : avant → après | Prairie : avant → après | Roche : avant → après | Eau : avant → après |
| --- | --- | --- | --- | --- |
| Éco | 205,6 → 219,3 ms (+6,7 %) | 111,6 → 135,0 ms (+20,9 %) | 193,2 → 208,9 ms (+8,2 %) | 106,4 → 125,8 ms (+18,2 %) |
| Équilibré | 250,4 → 261,2 ms (+4,3 %) | 104,8 → 131,6 ms (+25,6 %) | 227,3 → 262,0 ms (+15,2 %) | 112,4 → 139,3 ms (+24,0 %) |
| Qualité | 238,5 → 257,5 ms (+8,0 %) | 111,2 → 151,7 ms (+36,4 %) | 200,0 → 255,5 ms (+27,7 %) | 117,3 → 144,9 ms (+23,5 %) |

Le surcoût reste mesurable : **aucune amélioration uniforme des FPS, fluidité matérielle garantie ou réussite Android n'est revendiquée**. Éco retire le relief des normales naturelles et simplifie la réflexion de l'eau ; Équilibré utilise une projection rocheuse dominante et un échantillon de sol ; Qualité adoucit les raccords proches et perturbe légèrement les UV avec le bruit déjà disponible. Les détails ne déplacent jamais les sommets. Les derniers changements propres à Qualité ont fait l'objet d'une nouvelle mesure ciblée ; les branches GLSL Éco/Équilibré sont inchangées.

Deux textures partagées en plus : **7 → 9** textures dans ces scènes. PNG livrés : **744 527 octets**, hors petits manifestes ; stockage RGBA8 avec mipmaps estimé : **7,02 Mio** supplémentaires, distinct d'une mesure d'allocation GPU réelle. Deux reconstructions hors ligne : **4,10 s et 4,01 s**, empreintes identiques. Le navigateur charge les dérivés prêts à l'emploi, sans exécuter cette préparation.

## Promenades et non-régressions

- Promenade automatique réellement enregistrée, mêmes contrôles et mêmes voies existantes : **40,713 m en 32,368 s** avant, **40,167 m en 32,402 s** après, mesurés entre les images ; 131 et 127 images rendues. Vidéos natives avec leur durée réelle, son post-limiteur du jeu, sans normalisation. Le timestep plafonné et la charge logicielle expliquent que la distance ne soit pas parfaitement identique. Ces clips ne sont pas des comparaisons synchronisées image par image.
- Séquence distincte près de l'eau : **17,729 s** entre images, matin clair puis soir pluvieux par les commandes ordinaires. Aucun déplacement ; cette station d'inspection n'est pas présentée comme une liaison piétonne au parcours précédent.
- Toutes les positions enregistrées passent le prédicat terrain/collisions existant. Les fichiers du contrôleur et de la navigation sont inchangés. Les règles de largeur, la partition routière, les indices proche/lointain et les coordonnées sont conservés.
- Audio Mission 11 inchangé ; quatre voix au pic sur ces extraits et cache maximal observé **24 730 140 octets**, sous 24 Mio. Aucune erreur de ressource audio dans ces clips. Cette vérification courte ne remplace pas l'audit sonore de Mission 11.
- **167 tests Node réussis**, également rejoués sans cache dans un checkout propre, TypeScript/Vite réussi. Les chargeurs de tests suivent toutes les dépendances sans importer de fichier temporaire préexistant. Le build compilé est testé avec chargement, déplacement, hauteur des yeux, trois caméras, audio et viewport mobile 390 × 844 ; aucune erreur JavaScript. Avertissement Vite préexistant >500 ko : bundle désormais **714,71 ko**, **202,19 ko gzip**. Les valeurs de rendu logiciel ne sont pas des FPS mobiles réels.
- Dix-huit cycles profil/météo dans WebGL, dérivés périmés et corrompus : source géographique toujours disponible et ancien rendu en secours. Huit comparaisons fixes sans dynamiques : différence maximale **1/255**, au plus 16 canaux modifiés sur 1 228 800 (arrondi logiciel visible dans les mesures, pas une identité pixel stricte).
- Six chargements/libérations indépendants des textures : **9 → 11 → 9** à chaque cycle. Les bitmaps sont fermés avec leur propriétaire ; pas d'accumulation de textures constatée dans ce test.
- IGN/ASP/OSM, relief, polygones d'eau, atlas routier, navigation, architecture, audio, Living Paintings et workflows protégés vérifiés. La régénération du manifeste des décorations ne change **que l'empreinte de la fonction de libération** ; arbres, ancrages et tous les chunks sont identiques. [Preuve de préservation](mission-12-evidence/preservation.json).

Les trois clips et des planches extraites du mouvement ont été examinés. Les grains restent ancrés dans le monde ; aucun déplacement de matière ou apparition de géométrie nouvelle n'est introduit par ce jalon. Cette inspection courte ne garantit pas tous les parcours ou tous les GPU.

## Implémenté, fonctionnel, perceptible, convaincant

Les matières, le mélange sur pente, les transitions de berge et la réflexion du ciel sont **implémentés** et **fonctionnels** dans les tests du vrai moteur. Les comparaisons montrent une différence **perceptible**, surtout sur les premiers plans naturels, les pentes et l'eau du matin. Le gain routier reste plus discret, le rendu minéral de Mission 11 étant déjà travaillé.

Le caractère **artistiquement convaincant** reste à votre appréciation. Les limites du MNT échantillonné à 10 m, les facettes, certaines maisons sur pente, les ruines illustratives et les silhouettes végétales antérieures restent visibles. Pas de bathymétrie, de vrais reflets des bâtiments, de nouveau niveau d'eau ou de courant hydrologique. Pas de longue marche ni de validation GPU physique/Android supplémentaire dans ce Jalon A. Les fixtures régionales et la validation d'une bibliothèque française complète appartiennent au Jalon D, non commencé.

Comparaisons directement consultables sur GitHub : [rue](mission-12-evidence/compare-mineral.jpg), [prairie](mission-12-evidence/compare-nature.jpg), [pente](mission-12-evidence/compare-roche.jpg), [berge](mission-12-evidence/compare-berge.jpg), [eau proche](mission-12-evidence/compare-eau.jpg), [rivière éloignée](mission-12-evidence/compare-riviere.jpg).

## Reproduction et prévisualisation isolée

```sh
git checkout mission/12-poesie-des-lieux
npm ci
npm test
npm run build
npm run dev -- --port 5173
```

Jeu : `http://localhost:5173/endless-earth/?moment=afternoon&weather=clear`. Galerie : `http://localhost:5173/endless-earth/docs/mission-12-evidence/index.html`. Les contrôles ordinaires restent disponibles : marche automatique, ZQSD/WASD/flèches, trois vues avec V, réglages graphiques et heure/météo.

Pour le build compilé : `npm run preview -- --port 5180`, puis `http://localhost:5180/endless-earth/`. Le serveur de développement sert aussi la documentation ; le build de jeu ne prétend pas publier la galerie.

Préparation des matières : `python scripts/prepare-surface-rock.py` (Pillow nécessaire ; sources CC0 téléchargées une fois dans `work/`), puis `node scripts/prepare-surface-art.mjs`. Les dérivés livrés sont déjà versionnés. Capture reproductible : `node scripts/browser-surface-art.mjs after`. La référence exige un checkout distinct du commit `83d9258` servi sur un autre port, puis `TEST_PORT=5176 node scripts/browser-surface-art.mjs before` ; ne pas capturer la branche actuelle sous l'étiquette « avant ».

Le script de préparation vérifie les empreintes des deux JPEG sources. Versions de génération utilisées : Node 24, Pillow 13 (déjà référencé dans `scripts/geography-requirements.txt`). Autres contrôles : `node scripts/browser-surface-art-runtime.mjs`, `node scripts/benchmark-surface-art.mjs` (référence sur 5176), `node scripts/browser-surface-art-walk.mjs before`, puis `after`, `node scripts/browser-surface-art-assets.mjs`, `node scripts/verify-surface-art.mjs`, `python scripts/report-surface-art.py`, `node scripts/browser-surface-art-gallery.mjs`.

Les captures précèdent le commit de livraison : leur badge indique la base `83d9258` et « modifié ». Le build compilé de prévisualisation est ensuite reconstruit depuis le commit livré. La galerie locale est indépendante de l'hébergement public ; aucune URL publique de prévisualisation n'est inventée.

## Jalons suivants

- B — Architecture régionale : **livré, poursuite acceptée**.
- C — Nature vivante : **livré, validation artistique attendue**.
- D — Art DNA et optimisation générale : **non commencé**.

L'évaluation courante porte sur les silhouettes, le feuillage, les détails bas, les saisons et la qualité du mouvement. Les poursuites après A puis B ont été demandées par **« Continue »**. **Arrêt courant après C ; attendre l'accord explicite du propriétaire avant D.**
