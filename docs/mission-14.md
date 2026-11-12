# Mission 14 — Les paysages remarquables de France

## 14A livré pour validation — les jalons B, C et D ne sont pas commencés

Le relief de l’éperon utilise maintenant des maillages locaux préparés depuis le MNT LiDAR HD. **330 cellules de 10 m, soit 3,30 ha**, sont affinées dans le pilote de 400 ha. Sur ces cellules, l’écart absolu moyen au raster passe de **0,765 à 0,195 m** (−74,6 %). Le coût total du terrain est de **120 128 → 130 196 triangles proches** (+8,4 %). Le gain est visible sur les ruptures et le pied de falaise ; il reste discret ou masqué depuis certains angles. **La qualité artistique attend votre validation.**

[Galerie locale de revue](mission-14-evidence/index.html) · [Planche directement lisible sur GitHub](mission-14-evidence/comparison.jpg) · [Carte des zones](mission-14-evidence/relief-map.png).

![Mission 13 / 14A : vues appariées et témoin forestier](mission-14-evidence/comparison.jpg)

Branche `mission/14-paysages-remarquables-france`, issue du dernier `main` vérifié **`03d963fb1afeea9e2f209800748bfde5d1fab5f8`**. Mission 13 confirmée fusionnée par la **PR #22**, le 12 novembre 2026 à 08 h 26 (Europe/Brussels). Le checkout initial était encore sur Mission 12 ; `main` a été récupéré avant le travail. Instructions `AGENTS.md` et rapports 08.5, 11, 12, 13 examinés. **Budget : 0 €. Aucune fusion, aucun déploiement, aucun changement Living Paintings / LP-01.**

## Sources réellement exploitées et précision

Une seule dalle de Mission 08.5 a été récupérée à nouveau : `LHD_FXX_0538_6624_MNT_O_0M50_LAMB93_IGN69.tif`, **16 000 513 octets**, depuis l’URL officielle IGN déjà épinglée. SHA-256 brut identique : `e6caa7bea6438f02b300cd5361cb9195e64540b2cf20dd2cf8ed3ddc7a96b572`. Les huit autres dalles, les nuages LAZ et les MNS/MNH n’ont pas été téléchargés. Le raster suffit à cette amélioration de surface de hauteur ; aucun surplomb ou vide rocheux n’est inventé.

| Attribut | Source et statut |
| --- | --- |
| Sol | IGN LiDAR HD **MNT**, natif **0,5 m**, acquisition **9 avril 2023**, édition **24 janvier 2025**, Licence Ouverte 2.0. |
| Référentiels | Lambert-93 / **IGN69**. Même inverse du repère local X est / Z sud de `geo.ts`, sans décalage ni changement d’échelle. Limite métrique héritée d’environ 0,2 %. |
| Normalisation | Outil 08.5 conservé : contrôle des paramètres Lambert, produit, datum, nodata, orientation et SHA ; correction connue de la sérialisation WMS du CRS **sans changer de pixel ni rééchantillonner**. |
| Échantillonnage | Pixel natif le plus proche ; hauteurs arrondies à deux décimales comme la grille existante. Les décimales ne sont pas une précision d’observation. |
| Routes / bâti / eau | Extrait OSM existant, **8 novembre 2026**, © OpenStreetMap contributors / ODbL 1.0. Axes, emprises, permissions et largeurs inchangés. |
| Habitats / matières | IGN/ASP normalisés et données de Mission 13 conservés. Aucune nouvelle mesure géologique ni texture photographique. |

[Acquisition / contrôle du cache](mission-14-evidence/source-acquisition.json) · [Métadonnées, URL complète et transformations distribuées](../public/data/angles-relief.json) · [Licences du dérivé](../public/data/angles-relief.LICENSE.md). Les fichiers bruts restent dans `work/`, pas dans Git ; les scripts permettent une nouvelle acquisition avec refus si l’empreinte fournisseur change. La vérification actuelle du cache n’est pas présentée comme un nouvel échange HTTP journalisé.

**Résolution et précision absolue sont distinctes.** Le MNT est lui-même un produit classé et interpolé ; aucun contrôle terrestre indépendant n’a été réalisé. Les écarts ci-dessous mesurent la proximité au raster épinglé, pas la vérité centimétrique du site. Les photographies patrimoniales de Mission 13 restent leurs références documentaires ; aucune photo non calibrée n’a servi à fabriquer une nouvelle altitude.

## Comparaison et choix du maillage

Zone d’étude locale : **X −220 à +120 m, Z +40 à +420 m**. Une cellule devient candidate lorsque son dénivelé dans le MNT atteint 6 m et que le résidu maximal de la grille 10 m atteint 1 m, puis une couronne de transition est ajoutée. Ces seuils sélectionnent un budget de travail, pas une définition géologique de falaise.

Le premier candidat couvrait 479 cellules : 77 points d’axes OSM perdaient leur admissibilité et 43 en gagnaient. Il est **écarté**. Sans relevé de chaussée permettant d’interpréter sûrement ces variations, on conserve l’approximation antérieure des couloirs déjà praticables. Le script utilise le vrai prédicat de collision et `validPoint` de Mission 13, tous les 25 cm au plus, avec une marge de 1,25 m. **149 cellules candidates restent donc à 10 m**. Aucun seuil de pente n’est relâché et aucun chemin n’est créé. [Candidat initial et motif de rejet](mission-14-evidence/candidate-unprotected-summary.json).

Comparaison finale sur les **mêmes 330 cellules**, avec raccords à leur périmètre. **132 000 points de validation**, aux décalages 0,25 / 0,75 / … / 9,75 m, distincts des nœuds candidats de 1 m. Ce sont des pas locaux cousus à la grille ; aucune grille de 1 m n’est imposée au monde entier.

| Solution | Triangles locaux avant découpe routes/eau | Moyenne absolue (m) | RMSE (m) | P95 absolu (m) | Maximum absolu (m) |
| --- | ---: | ---: | ---: | ---: | ---: |
| 10 m local | 660 | 0.765 | 1.316 | 2.769 | 14.107 |
| 5 m local | 2300 | 0.485 | 0.918 | 1.829 | 13.796 |
| 2 m local | 15140 | 0.232 | 0.478 | 0.896 | 11.195 |
| 1 m local | 62940 | 0.168 | 0.352 | 0.677 | 9.750 |
| Adaptatif retenu | 9684 | 0.195 | 0.361 | 0.675 | 9.293 |

Le candidat à 5 m reste trop simplifié. Celui à 2 m coûte plus que l’adaptatif pour un résidu moyen supérieur. Le candidat à 1 m apporte un gain moyen supplémentaire de 2,6 cm, pour **6,5 fois plus de triangles locaux**. L’adaptatif est retenu. Le **maximum de 9,293 m reste important** : les transitions conservées et les abrupts sous le pas candidat limitent la fidélité. Aucune borne générale de 40 cm face au MNT n’est revendiquée. [Audit et chiffres complets](mission-14-evidence/terrain-comparison.json).

Les bords partagés sont simplifiés avec un seuil de 25 cm sur leur profil ; des points intérieurs sont insérés par erreur supérieure à 40 cm aux nœuds candidats, jusqu’à la limite de 1 m. Ces critères guident la préparation. Les cellules ont des triangulations de Delaunay déterministes, avec les mêmes points de bord des deux côtés. Le périmètre extérieur conserve les arêtes de la grille 10 m. Les hauteurs des nœuds historiques restent fixes.

## Intégration dans le vrai moteur

`terrain-refinement.mjs` porte un contrat générique de petits TIN locaux et une recherche bornée par cellule. Il ne contient aucune coordonnée d’Angles ni géométrie patrimoniale. Le relief local reste une donnée ; les palettes et shaders Mission 13 restent le style régional. `sampleGrid`, la préparation des surfaces, l’ancrage et la marche interrogent les mêmes triangles.

La partition unique sol / routes / eau est redécoupée sur le nouveau relief. Il n’y a ni surcouche rocheuse flottante, ni collision parallèle, ni nouvelle passe. Les **25 tuiles** et leurs mécanismes existants sont conservés. Les triangles affinés restent identiques aux LOD proche et lointain : la falaise ne s’écrase pas lors d’un changement de LOD. Les autres cellules gardent leur simplification antérieure, à 25 cm vis-à-vis de leur surface source de jeu (ce n’est pas une borne face au raster IGN).

Le chargeur vérifie datum, emprise, dimensions, budget, topologie, sources et empreintes avant d’activer ensemble surface affichée et sol physique. Il charge le pack raffiné **à la place** de l’ancien ; le pack 10 m n’est demandé qu’en repli. Si les données locales manquent, sont corrompues ou périmées, la surface Mission 13 complète reprend. Si le décor préparé manque, les générateurs déterministes utilisent le terrain actif.

Les **2 500 arbres gardent exactement X/Z, identité, essence générique, échelle et statut cartographié** ; **22** reçoivent une correction de Y. **55 bâtiments** ont des ancrages ou panneaux dépendant du sol réévalués, sans déplacement d’empreinte. Les anciennes règles d’exclusion d’ouvertures schématiques changent le nombre de panneaux sur cinq façades ; ce ne sont pas des fenêtres nouvellement observées. Les deltas et identifiants sont dans l’audit. Les hauteurs, ornements et ruines restent les interprétations antérieures ; le château et le pont ne sont pas reconstruits en 14A.

Le décor utilise un manifeste de remplacement, les mêmes limites de streaming/cache, **300 packs partagés sur 317** et seulement 17 packs de détail modifiés, plus le lot statique. Aucun gros nuage de points n’arrive dans le navigateur. Deux préparations complètes produisent les mêmes dérivés octet pour octet : [déterminisme et SHA](mission-14-evidence/determinism.json). Un garde-fou refuse la préparation raffinée dans le dossier des packs d’origine.

## Captures et audit physique

Les dix vues demandées sont conservées **avant et après** : château depuis le pont ; rive opposée ; falaise depuis la vallée ; village/pont ; rue du château ; pose sur le pont ; zone haute accessible ; vue aérienne ; berge/eau ; forêt avec relief. Les poses, position absolue de caméra, quaternion, matrice, FOV, résolution, profil, date simulée, météo, sources et commit de référence figurent dans [before.json](mission-14-evidence/before.json) et [after.json](mission-14-evidence/after.json).

Référence : vrai checkout détaché, propre, de `03d963f`, jamais la branche courante renommée « avant ». Après : sources 14A modifiées à partir de cette base ; le badge le dit. Caméras fixes **960 × 640, FOV 55°, Équilibré**, 21 juin 2026, après-midi clair. Les commandes, matières et lumières habituelles restent la référence. La végétation n’est pas déplacée pour dégager le château.

Certaines vues restent masquées par l’architecture schématique existante. Les stations du pont et la pose rapprochée de falaise sont **des inspections non praticables**, déjà non praticables avant. La zone haute retenue, X 80 / Z 90, passe le prédicat de navigation. Le témoin forestier est hors zone affinée ; on ne lui attribue aucun gain de relief. La galerie conserve les vues faibles et la vue aérienne où la différence est plus discrète.

- Maillage source : aucune arête ouverte intérieure ni T-junction ; seuls les **800 segments du bord du monde** restent ouverts.
- **23 240 centres de triangles** sol / route / eau, LOD proche et lointain : résidu maximal rendu / support physique **0,000023 m** environ. Tolérance numérique, pas précision géographique.
- Déplacements testés sur les cellules raffinées : refus des pentes excessives et maintien des pas acceptés sur la même surface ; aucune descente à travers la falaise.
- Audit final : **2 117 échantillons** des axes autorisés, **zéro changement d’admissibilité**, **920 → 920 nœuds**, **896 → 896 arêtes**, même parcours de **450 m**.
- Six scénarios navigateur : normal, raffinement absent/invalide, mauvais datum, surface périmée, pack corrompu et décor absent. Replis navigables ; trois profils, 18 changements de station/profil, LOD et viewport 390 × 844 contrôlés.

[Audit chemins, ancrages et graphe](mission-14-evidence/collision-audit.json) · [Tests de chargement et LOD](mission-14-evidence/runtime.json) · [Mobile](mission-14-evidence/mobile.jpg). Le pont existant n’a pas de tablier altimétrique vérifié : il reste exclu de la navigation, sans liaison piétonne inventée.

## Coûts mesurés, y compris les régressions

**216 rendus synchronisés avec lecture complète des pixels**, Chromium 156 / **SwiftShader logiciel**, 960 × 640, trois profils, trois vues, trois passages à ordre alterné et quatre images mesurées par passage. Même caméra absolue, date et météo ; simulation tenue pendant ces comparaisons. Aucun autre rendu de test n’était lancé en parallèle. Ces chiffres ne sont pas des FPS sur GPU physique ou Android.

| Profil / vue | Médiane M13 → 14A (ms) | Évolution | P95 M13 → 14A (ms) | Pic 14A (ms) |
| --- | ---: | ---: | ---: | ---: |
| eco / rue-chateau | 239.4 → 238.9 | -0.2 % | 256.3 → 262.8 | 272.6 |
| eco / falaise-vallee | 243.1 → 264.9 | +9.0 % | 259.4 → 306.6 | 315.4 |
| eco / village-pont | 241.9 → 255.1 | +5.4 % | 264.2 → 266.2 | 266.5 |
| balanced / rue-chateau | 287.7 → 300.6 | +4.5 % | 333.9 → 330.6 | 338.9 |
| balanced / falaise-vallee | 287.2 → 300.8 | +4.7 % | 294.8 → 315.3 | 323.2 |
| balanced / village-pont | 285.6 → 303.3 | +6.2 % | 290.4 → 326.6 | 328.2 |
| quality / rue-chateau | 284.2 → 292.8 | +3.0 % | 290.6 → 310.4 | 323.1 |
| quality / falaise-vallee | 295.0 → 309.7 | +5.0 % | 314.1 → 319.4 | 319.6 |
| quality / village-pont | 293.0 → 295.0 | +0.7 % | 338.7 → 324.1 | 334.9 |

Les appels de rendu restent **116 / 164 / 167** pour les trois vues en Équilibré. Les buffers géométriques inventoriés de la scène gagnent environ **0,19 à 0,24 Mo** ; ils n’incluent ni tout le heap JS ni une mesure de VRAM. Le compte des textures et les shaders de matières sont conservés. [Synthèse avec triangles, mémoire et démarrage](mission-14-evidence/performance-summary.json) · [Trace complète compressée](mission-14-evidence/performance.json.gz).

| Ressource terrain préparée | Mission 13 | 14A |
| --- | ---: | ---: |
| Triangles proches, toute la surface | 120 128 | 130 196 |
| Triangles lointains, toute la surface | 111 104 | 121 172 |
| Buffers terrain décompressés | 3 354 192 o | 3 603 480 o |
| Pack terrain gzip | 1 643 444 o | 1 817 612 o |
| TIN local JSON / support physique | absent | 217 953 o |

Préparation hors navigateur : environ **17,1 s** pour la surface intégrée et **9,5 s** pour l’overlay de décor sur cet hôte. Les temps ne font pas partie des fichiers déterministes. [Inventaire](mission-14-evidence/preparation.json) · [Décors](mission-14-evidence/decorations/preparation.json).

Les démarrages locaux observés dans la paire du benchmark sont **4,862 / 4,260 s**. Une ouverture par version ne permet pas d’affirmer un chargement accéléré. Les entrées HTTP de développement observées représentent environ **10,37 / 11,33 Mo** de corps reçus à l’instant du relevé ; ce n’est pas un test de réseau mobile ni la taille du build. L’ancien pack terrain n’est pas téléchargé dans le cas nominal raffiné ; les anciens dérivés demeurent distribués pour le repli.

Le profil Équilibré coûte **+4,5 à +6,2 % de médiane** dans ces vues. Aucune accélération uniforme n’est annoncée. La surface locale persistante est bornée par les mêmes 25 tuiles, les cellules ont un budget validé, et la file de décor conserve ses limites. La validation matérielle et le plaisir de promenade restent à faire par le propriétaire.

## Promenade native de non-régression

**450,000 m** parcourus avec la commande AutoWalk ordinaire, vue subjective Éco **640 × 360**, 21 juin, après-midi clair, puis douze secondes d’arrêt. **351.591 s** entre première et dernière image, **3455 images**, aucun déplacement initial forcé, rejeu, changement de vitesse ou accélération de simulation. Toutes les positions enregistrées passent le prédicat de collision ; plus grand pas observé **0.317 m**. Aucun message d’erreur JavaScript.

Intervalles réels incluant l’enregistrement : médiane **93.0 ms**, P95 **153.0 ms**, pic **337.7 ms**. Ce sont des observations SwiftShader, pas une validation de fluidité matérielle. Heap V8 après GC : **88.08 → 88.97 Mo** ; backing storage **46.10 → 46.41 Mo**. Pics : **205 géométries / 9 textures / 16 programmes**, **3 voix audio**, cache maximal **23,582,716 octets** (sous 24 MiB). Ce test fini ne prouve pas une absence de fuite pour toute durée.

[Vidéo complète](mission-14-evidence/after-promenade.webm) · [Synthèse et relevés](mission-14-evidence/after-walk.json) · [Détail intégral compressé](mission-14-evidence/after-walk-detail.json.gz) · [Toutes les images instrumentées](mission-14-evidence/after-walk-frames.json.gz). Le fichier natif VP8/Opus de **12,080,898 octets** est conservé dans `work/mission-14/after-native.webm`. Pour limiter Git, la copie publique complète est encodée en VP9 : **5,302,368 octets**, mêmes temps et **paquets audio Opus identiques par SHA-256**, sans montage ni normalisation. Les captures fixes restent les originaux du moteur. [Encodage et empreintes](mission-14-evidence/video-publication.json).

Ce parcours ordinaire se situe principalement au nord du raffinement. Il valide la continuité et le streaming ; **il ne prouve pas une traversée de la falaise ni du pont**. Les inspections de la falaise et les tests de pentes sont distincts. Le témoin vidéo Mission 13D reste accessible dans sa galerie historique ; il n’est pas présenté comme un nouvel enregistrement synchronisé. Aucun essai de 30 minutes n’est revendiqué en 14A ; la campagne longue est prévue dans 14D, non autorisé à ce stade.

## Validation et reproduction

**194 tests Node réussis**, TypeScript/Vite et jeu compilé contrôlés : chargement, marche, hauteur des yeux, trois vues, arrêt sans dérive, audio, profil graphique et viewport mobile. Les contrôles du navigateur et de la galerie passent : 20 images appariées décodées, vidéo complète, liens locaux et largeurs 1280 / 390 px ; l’avertissement Vite historique de chunk >500 ko subsiste. Les tests ajoutés couvrent la topologie, la concordance rendu/support aux deux LOD, les datums/topologies invalides, les pentes et la préservation des arbres/packs.

**512 fichiers protégés** comparés octet pour octet à `main` : géographie, sources originales, matières, audio, systèmes Living/atmosphère et workflows inchangés. Le manifeste de décor 10 m ne change que trois empreintes de modules, sans modification de ses arbres ni de ses packs. Les silhouettes/positions de végétation restent les mêmes, avec recalage vertical documenté. [SHA de préservation](mission-14-evidence/preservation.json).

Jeu et galerie en local, sans publication :

```sh
npm ci
npm test
npm run build
npm run dev -- --port 5173
# Jeu : http://localhost:5173/endless-earth/
# Revue : http://localhost:5173/endless-earth/docs/mission-14-evidence/index.html
```

Les dérivés sont déjà versionnés. Pour reproduire leur préparation, avec Python 3.12 et Node 24 utilisés ici :

```sh
python -m venv work/geo-venv
. work/geo-venv/bin/activate
pip install -r scripts/relief-requirements.txt
python scripts/fetch-relief-source.py
python scripts/normalize-ign-wms-mnt.py work/mission-14/raw/mnt-manifest.json work/mission-14/normalized
npm run geo:relief
TERRAIN_REFINEMENT=public/data/angles-relief.json DECORATION_EVIDENCE_DIR=docs/mission-14-evidence/decorations node scripts/prepare-decorations.mjs public/data/angles-relief-decorations
node scripts/audit-mission-14.mjs
```

Pour les captures et mesures, servir le checkout détaché `03d963f` sur **5177** et la branche 14A sur **5173**, sans autre rendu de test simultané :

```sh
git worktree add --detach work/mission-14/baseline 03d963f
# Autre terminal : cd work/mission-14/baseline && npm run dev -- --port 5177
node scripts/browser-mission-14.mjs before
node scripts/browser-mission-14.mjs after
node scripts/benchmark-mission-14.mjs
node scripts/browser-mission-14-checks.mjs
node scripts/browser-mission-14-walk.mjs after
python scripts/report-mission-14.py
```

Aucun rendu d’illustration, API payante ou asset acheté. Aucun chantier d’ombres 14C ou d’ouvrage 14B ajouté indirectement. **Arrêt après le commit 14A et la PR en brouillon pour votre validation explicite.**
