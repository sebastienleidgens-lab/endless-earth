# Mission 13 — Les matières authentiques de France

**13A livré pour validation. Arrêt avant 13B.** Recherche et audit uniquement : aucun changement du moteur, des matériaux du jeu ou de la géographie. Budget : **0 €**.

Ouvrir la **[galerie illustrée : photos / jeu actuel / candidates](mission-13-evidence/index.html)**. Elle présente huit familles, les huit vues de référence du moteur et le catalogue avec crédits, droits, dimensions et empreintes. Les candidates sont des diffuses brutes consultées, pas des captures d’un rendu Mission 13.

## Ce que l’étude propose

1. **Pierre et enduits d’abord.** Les vues ordinaires montrent des moellons irréguliers, des encadrements plus réguliers et plusieurs degrés de couverture d’enduit. Les façades actuelles ont une palette cohérente mais des assises trop uniformes. Un mélange photographique adouci et procédural paraît la piste la plus utile en promenade.
2. **Le dessin des toitures avant leur résolution.** C09/C22 montrent de petits éléments rectangulaires, des rangs serrés et des nuances brun-roux/sombres. Roof Tiles 14 est une piste plus proche que les couvertures largement ondulées examinées ; son vieillissement reste trop marqué. L’identification précise de chaque toit demeure inconnue.
3. **Sols et roche ensuite, avec des témoins conservés.** La roche de Mission 12 utilise déjà une source photographique CC0 harmonisée. Son remplacement doit prouver son avantage. Conserver initialement herbe, litière, bois, pavage et eau procéduraux ; ne pas transformer un chemin inconnu en gravier ou en pavés.

| Photo locale effectivement examinée | Jeu actuel, même famille | Candidate CC0 examinée |
| --- | --- | --- |
| ![Façades ordinaires, C18](mission-13-evidence/references/C18.jpg) | ![Façade Mission 12](mission-13-evidence/baseline/facade-balanced.jpg) | ![Old Stone Wall, diffuse brute](mission-13-evidence/references/P-old_stone_wall.jpg) |
| ![Enduit usé, C10](mission-13-evidence/references/C10.jpg) | ![Rue Mission 12](mission-13-evidence/baseline/rue-balanced.jpg) | ![Plaster Stone Wall 01, diffuse brute](mission-13-evidence/references/P-plaster_stone_wall_01.jpg) |
| ![Toitures, C09](mission-13-evidence/references/C09.jpg) | ![Toitures Mission 12](mission-13-evidence/baseline/toitures-balanced.jpg) | ![Roof Tiles 14, diffuse brute](mission-13-evidence/references/P-roof_tiles_14.jpg) |

**Crédits de cette planche :** C18, « Angles - vieilles batisses », Bachelier Jacky, [source](https://commons.wikimedia.org/wiki/File:Angles_-_vieilles_batisses.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). C10 et C09, Daniel Jolivet, [C10](https://commons.wikimedia.org/wiki/File:Angles-sur-l%27Anglin_(Vienne)_(24096695198).jpg), [C09](https://commons.wikimedia.org/wiki/File:Angles-sur-l%27Anglin_(Vienne)._-_Flickr_-_sybarite48.jpg), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Photos réduites proportionnellement et réencodées en JPEG, sous leur licence source. Old Stone Wall et Plaster Stone Wall 01 : Charlotte Baglioni ; Roof Tiles 14 : Rob Tuytel ; Poly Haven, CC0. [Sources et crédits exhaustifs](mission-13-evidence/credits.md). Captures : moteur réel, sources IGN/ASP/OSM et crédits Mission 12 conservés. Ces images ne constituent pas un recalage photographique.

## Audit de Mission 12 et préservation

Dernier `main` vérifié : **`a8ce9c950c4aa3ac1630add0f3d971d9068108c9`**, fusion de la [PR #21](https://github.com/sebastienleidgens-lab/endless-earth/pull/21), le 11 novembre 2026 à 14 h 44, heure de Bruxelles. Lecture de `AGENTS.md`, du rapport final et des quatre jalons : A `bb58c30`, B `96c824a`, C `3cd692e`, D `87035f6`, puis documentation `79dbaf8`.

Checkout initial propre. Branche indépendante **`mission/13-matieres-authentiques-france`** créée depuis ce `main`. Les commentaires historiques de `docs/mission-12.md` mentionnent encore les arrêts successifs ; l’état GitHub établit la fusion effective. Ces preuves historiques n’ont pas été réécrites.

Audit de `src/art/dna.mjs`, `public/art/dna.json`, `docs/art-dna.md`, styles et atlas d’architecture, catalogue des sols, shaders de routes/roche/eau et profils de végétation. L’ADN reste : **paysage calme, tactile, modérément stylisé ; silhouettes avant grain**. Palette minérale sourde, UV métriques, atlas partagés, détails atténués entre 24–110 m sur les façades et 18–100 m sur les sols. Normales discrètes et éclairage Mission 11 conservés.

Les six familles architecturales actuelles sont procédurales dans un atlas **864 × 576**, 1 194 098 octets. Les sols mêlent terre/herbe/litière procédurales et **Rock Face 03**, source 1K préparée en 256² dans l’atlas naturel. Les routes possèdent déjà grain, classes et transitions métriques. L’eau reflète le ciel analytique ; les arbres gardent une expression stylisée. Ajouter partout un PBR complet créerait un risque de discordance et de surcoût.

Dans l’extrait OSM audité en Mission 12, **921 matériaux de façade/toiture sont inconnus et 920 hauteurs sont estimées**. Les photos de cette étude n’ont pas été appariées aux identifiants individuels. Aucune observation n’a été injectée dans les données.

`src/`, `public/`, `fixtures/`, dépendances, configuration et `.github/` sont identiques à la base. Relief, altitudes, empreintes, dimensions et provenance, routes, collisions, navigation, eau, arbres, streaming, climat, audio, profils et budgets restent intégralement conservés. Living Paintings / LP-01 est inchangé. [Preuve par diff et arbres Git](mission-13-evidence/preservation.json).

## Références réelles et analyse locale

**38 entrées utiles : 15 photos Commons, 2 vues Panoramax, 21 textures CC0.** [Catalogue structuré](mission-13-evidence/catalog.json), [observations par famille](mission-13-evidence/findings.json), [rejets et accès](mission-13-evidence/rejected.json). Les fichiers ont été téléchargés puis réellement examinés ; gros plans supplémentaires consultés pour les murs, enduits, tuiles et roches. Les miniatures documentaires sont séparées des ressources du jeu.

| Famille | Observations étayées | Incertitudes à garder |
| --- | --- | --- |
| Pierre | C10/C18 : éléments irréguliers gris-beige, joints variables, enduit partiel ; encadrements plus réguliers. | Pas d’échelle absolue ni de roche exacte déduite. Tous les bâtiments ne partagent pas cette finition ; C24 montre aussi des pans de bois. |
| Enduit | C14/C25 : grains et teintes différents ; C10 : usure laissant voir la pierre. | Lumière chaude ou ombre dans les photos ; ni albédo mesuré ni enduit dégradé à généraliser. |
| Toitures | C09/C19/C22 : petits éléments superposés, variations rousses/brunes et zones sombres. | Forme exacte, matière des couvertures sombres et dimensions non certifiées par bâtiment. |
| Sols | C16 : pavage irrégulier d’une ruelle ; Panoramax : chaussées revêtues ; C15 : cour minérale. | Pas de mesure rapprochée fiable de la terre ou du gravier des chemins du jeu. |
| Roche | C05/C07/C08 : surfaces claires, fissures et grandes ruptures, végétation ponctuelle ; certaines lignes de structure visibles. | Une texture ne peut restituer les ruptures géométriques absentes du MNT à 10 m ; aucune identification géologique exacte. |
| Berges | C20 : rive herbeuse ; C08 : autre contact bâti/rocheux avec végétation et seuil. | Pas de substrat vaseux universel, profondeur ou débit déduit. |

Panoramax fournit une couverture locale effective : deux panoramas SD géolocalisés de rues, crédits conservés par image. Distorsion, véhicule et lumière restent visibles. Une autre image éblouie est rejetée. La [référence IGN BD ORTHO 2023 déjà présente](mission-08-5-captures/geographic-coverage.jpg) a été examinée avec son manifeste Mission 08.5 : utile pour les masses végétales et la répartition des surfaces, sans preuve de matériau de façade. Aucun nouveau téléchargement IGN n’est revendiqué.

## Droits et provenance

Les licences officielles [Poly Haven](https://polyhaven.com/license) et [ambientCG](https://docs.ambientcg.com/license/) autorisent l’usage, la transformation et la redistribution des assets CC0, y compris dans un jeu commercial. **Toutes les candidates de matériau proposées ici sont CC0.** Auteur, titre, URLs, date du contrôle, dimensions, format, portée du SHA-256, échelle disponible, usage et confiance figurent dans chaque entrée.

Pour Poly Haven, les empreintes couvrent les JPEG diffus 1K réellement téléchargés. Pour ambientCG, elles couvrent les ZIP 1K-JPG, avec inventaire et empreintes des cartes extraites. Les archives/originaux restent dans `work/`, hors Git. Les aperçus livrés possèdent leur propre SHA-256.

Les photos Commons sont CC BY 2.0 ou CC BY-SA 2.0/3.0/4.0 ; les panoramas sont CC BY-SA 4.0. Attribution, lien de licence et modifications des aperçus sont conservés. **Leur rôle est documentaire ; aucun pixel local n’est approuvé comme matériau du jeu.** Un futur matériau dérivé d’une photo BY-SA demanderait une analyse de compatibilité et de redistribution distincte. Les originaux photographiques non téléchargés n’ont pas de SHA-256 prétendument calculé : le catalogue indique explicitement les miniatures/SD effectivement consultés. [Contrôles juridiques et réponses HTTP](mission-13-evidence/license-checks.json).

Aucune ressource NC, ND transformée, payante ou à droits incertains retenue. Aucun contournement d’accès. La première requête ambientCG employait un paramètre ancien ignoré ; elle a été corrigée avant toute sélection. Kenney/Quaternius non approfondis : bénéfice probable faible pour cette étude limitée aux matières.

## Bibliothèque proposée pour 13B — pas encore fabriquée

| Famille | Référence à tester | Décision actuelle |
| --- | --- | --- |
| Pierre irrégulière | Poly Haven **Old Stone Wall** | Prioritaire ; joints à adoucir. |
| Pierre plus appareillée | ambientCG **Bricks099** | Réserve ; ne pas l’étiqueter calcaire local, la source mentionne sandstone. |
| Enduit fin | **White Plaster 02** | Prioritaire, grain à calibrer. |
| Enduit discontinu | **Plaster Stone Wall 01** | Prioritaire, lacunes à rendre moins reconnaissables. |
| Petite tuile | **Roof Tiles 14** | Essai conditionnel ; forme et mousse à comparer en promenade. |
| Gravier | **Gravel Floor** | Seulement dans les classes compatibles documentées. |
| Terre | **Brown Mud Dry** | Essai secondaire, faible contraste. |
| Contact humide | **Brown Mud** | Réserve, aucune vase généralisée. |
| Roche structurée | ambientCG **Rock023** | Alternative à tester ; échelle physique source absente. |
| Roche actuelle | **Rock Face 03** | Témoin conservé de Mission 12. |

Rejets artistiques visibles dans la galerie : Rustic Stone Wall trop ocré ; Plastered Stone Wall trop sombre ; plusieurs tuiles largement ondulées ou trop régulières ; RoofingTiles002 à dessin arrondi ; Gravel Road trop rouge ; Rock Face trop brun. Forest Floor à feuilles jaunes reste une réserve saisonnière, pas le sous-bois permanent du pilote. La validité CC0 ne suffit pas à justifier l’intégration.

En 13B, comparer **procédural / photographique / hybride** dans le même moteur. Commencer avec un atlas partagé et le moins de cartes utile ; 512–1K est une piste de test, pas une résolution déjà choisie. La mémoire RGBA8 avec mipmaps vaut environ 1,33 Mio par carte 512², 5,33 Mio par carte 1024² ; ce sont des estimations théoriques, pas une allocation GPU mesurée. Dix textures indépendantes avec plusieurs cartes seraient coûteuses. Préserver l’échelle métrique, la palette, les contrastes, les normales modérées et les replis Éco. Aucun nouveau shader, conversion PBR ou atlas Mission 13 n’a été fabriqué en 13A.

## Preuves, performances et limites

Huit captures fraîches du vrai navigateur : **rue, façade, toitures, chemin, sol, falaise, berge, village**. Pour chacune : coordonnées locales et conversion WGS84 approximative selon le repère existant, position/matrices de caméra, heure/météo effectives, profil, résolution et version. [Baseline complète](mission-13-evidence/baseline.json). La station falaise garde volontairement le bâtiment qui masque une partie de la pente ; ce défaut existant n’est pas retouché.

Chromium 156 / **SwiftShader**, 960 × 640, DPR 1, après-midi clair du 21 juin simulé, heure effective 15 h 57 à Angles. Six rendus synchronisés/readback par station : médianes Équilibré **253,9–580,8 ms**, huit textures. À la rue : Éco **461,9 ms**, Équilibré **517,6 ms**, Qualité **524,2 ms**. Ce sont des coûts logiciels descriptifs, sans cadence de marche, P95 robuste ou GPU physique revendiqués. La simulation est tenue pour les prises fixes.

Le code runtime étant identique, **aucun surcoût de matériau ou téléchargement de ces références pendant la promenade** : elles sont uniquement sous `docs/`, hors du build public du jeu. Aucun gain visuel ou de performance Mission 13 n’est encore mesuré. Mission 12 documente un surcoût logiciel de D/M11 de +10,3 à +50,6 % selon profil/vue : cet héritage devra servir au budget de 13B/C.

Contrôles fraîchement rejoués : **179 tests Node**, TypeScript/Vite ; build compilé avec chargement, déplacement, hauteur des yeux, relâchement sans dérive, trois vues, son et mobile 390 × 844 ; 18 changements de station/profil pour architecture et nature, atlas/chunks corrompus et périmés ; **3 déchargements/rechargements réels du pilote**, **30 changements météo/heure/profil**, **36 cycles de ciel**, **24 créations/libérations de contexte audio**. Aucun message d’erreur JavaScript/WebGL dans ces essais. Les tests Node couvrent navigation, collisions, relief, géographie, dimensions, déterminisme des bâtiments/matières et streaming.

Aux quatre instantanés du test de zone : **2 500 ancrages, 125 géométries, 8 textures, 10 programmes**. Heap après GC : **80,10 → 83,63 → 83,82 → 83,91 Mo**. Plateau des compteurs dans ce test fini ; aucune absence de fuite pour toute durée, fluidité Android ou validation matérielle prétendue. Avertissement Vite préexistant : bundle >500 ko. [Synthèse des vérifications](mission-13-evidence/checks/summary.json) et [protocole reproductible](mission-13-evidence/README.md).

Pas de nouvelle vidéo de marche en 13A, puisqu’aucune matière du jeu n’a changé. Les deux promenades Mission 12 de 450 m restent dans sa [galerie finale](mission-12-evidence/final/index.html). Les comparaisons M12/M13, nouveaux matériaux, intégration, optimisation et démonstrations régionales Mission 13 restent **non commencés** : ils appartiennent à B/C/D après leurs accords successifs.

## Prévisualisation et décision du propriétaire

```sh
git switch mission/13-matieres-authentiques-france
npm ci
npm run dev -- --port 5173
```

Galerie locale : `http://localhost:5173/endless-earth/docs/mission-13-evidence/index.html`. Jeu de référence : `http://localhost:5173/endless-earth/?moment=afternoon&weather=clear`. Le rapport Markdown et ses images sont également consultables directement sur la branche GitHub. Aucun hébergement public autonome revendiqué ; GitHub Pages principal et production inchangés. PR en brouillon uniquement.

**À valider :** les priorités pierre/enduit puis toiture, la piste des petits éléments rectangulaires, les ressources écartées et la conservation initiale des matières procédurales sobres. **Autorisez-vous le jalon 13B sur cette base ?** Les tests techniques ne valent pas validation artistique. **Arrêt obligatoire après 13A ; ne pas commencer 13B sans accord explicite.**
