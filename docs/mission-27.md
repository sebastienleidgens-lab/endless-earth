# Mission 27 — La Vienne magnifique

## 1. Verdict

**PARTIEL.** Une chaîne déterministe ajoute des plans de façades/toitures et de petits détails contextuels aux tuiles départementales, avec chargement vérifié et réemploi du vent existant. La richesse équivalente à Angles partout, les transitions imperceptibles et la parité immersive mondiale ne sont pas démontrées. Les 532 442 plans de bâtiments ne sont pas 532 442 bâtiments détaillés observés à l’écran.

[Galerie autonome](mission-27-evidence/index.html) · [architecture](mission-27-architecture.md) · [sources et licences](mission-27-data-and-licenses.md) · [direction artistique et grille humaine](mission-27-art-direction.md).

## 2. État Git et version exécutée

Base réelle contenant M26.4 : `1d330cab93847a4026194088c60d378c71c0b8f7`, fusion de la PR #38 dans `main`. Tête locale lors de cet assemblage : `7845dcb8bbecbe4a5e57ebb13256559d622eb08d`, branche `mission/27-world-enrichment`; arbre de travail sale=true. SHA du code exécuté déclaré par les reçus finaux : `7845dcb8bbecbe4a5e57ebb13256559d622eb08d`. Le `sourceCommit` des reçus de génération décrit leur référence propre et ne remplace pas ce SHA runtime.

PR finale : État final de la PR non fourni à cet assemblage; aucune PR n’est créée ou modifiée par ce script.

[git-state.json](mission-27-evidence/git-state.json) · [validation.json](mission-27-evidence/validation.json). Ce script n’effectue aucune fusion, publication ni mise en production et ne modifie aucun workflow.

## 3. Couverture réelle

499/499 artefacts générés et inventoriés; 497 avec contenu, 2 artefacts vides selon le reçu courant. La couverture artistique de surface reste non mesurée. L’audit hors ligne conserve renderObserved=0; les observations navigateur éventuelles sont des preuves séparées, pas une promotion automatique de toutes les tuiles.

265/265 centres communaux sont dans une tuile avec artefact. Cette mesure ne couvre pas artistiquement les polygones communaux. 22 stations source sélectionnées sur 22 et 32 tuiles échantillonnées; sélection ≠ visite ou accès admis.

[coverage-tiles.json](mission-27-evidence/coverage-tiles.json) · [coverage-communes.json](mission-27-evidence/coverage-communes.json) · [carte de couverture](mission-27-evidence/coverage.geojson) · [visual-stations.json](mission-27-evidence/visual-stations.json). Les habitats inconnus, exclusions et détails absents restent visibles dans [richness-audit.json](mission-27-evidence/richness-audit.json).

## 4. Sources, provenance et coûts

Corpus historique IGN/OSM conservé : 499 packs fins 2 m épinglés au commit de données `acb0a73b396229bf90731b90a558a8d5d072a9ec`, 1 407 876 165 octets compressés. Leur récupération Git n’est pas une nouvelle acquisition LiDAR M27. Nouveaux rasters acquis : 0 octets; nouveaux vecteurs : 0 octets; assets tiers nouveaux : 0 octets.

Métadonnées et licences officielles consultées ne démontrent pas une couverture 50 cm départementale. Aucun raster nouveau issu des catalogues LiDAR n’est revendiqué. Façades, types de toits et petits détails sont inférés/procéduraux selon attributs et packs, avec provenance explicite. Coût commercial consigné : 0 €; aucun nouveau service récurrent ni dépendance ajouté par le pipeline. [source-manifest.json](mission-27-evidence/source-manifest.json) · [licenses-and-assets.json](mission-27-evidence/licenses-and-assets.json).

## 5. Architecture effectivement réalisée

Préparation hors ligne par manifeste et pack régional, artefacts gzip/SHA256 séparés des sources physiques, vérification dans le worker, plans transmis avec les features, géométrie de façade regroupée et petites familles instanciées. Les détails réemploient l’horloge et le vent/depth existants. L’enrichissement ne possède ni appui, ni droit d’accès, ni navigation. Deux générations identiques par tuile sont attestées. Taille comprimée des artefacts : 30 564 766 octets; JSON décodé : 555 214 421 octets, distinct du heap/VRAM. [generation.json](mission-27-evidence/generation.json).

Le provider ECEF/ENU et l’adressage angulaire ont des tests numériques (308 conversions; erreur ECEF maximale 3.250391045874771e-9 m). Ils **ne sont pas intégrés comme nouvelle géodésie de déplacement du jeu** : la Vienne conserve son adaptateur historique Lambert93/IGN69. Deux fixtures synthétiques montagne/tropicale changent de pack et réemploient la chaîne; elles ne sont pas des territoires réels de production. [geodesy-audit.json](mission-27-evidence/geodesy-audit.json) · [international-fixtures.json](mission-27-evidence/international-fixtures.json) · [fixtures-runtime.json](mission-27-evidence/fixtures-runtime.json) · [planet-portability-audit.json](mission-27-evidence/planet-portability-audit.json).

## 6. Qualité artistique

Les quatre captures initiales d’Angles sont conservées. Les vues première personne et aérienne affichent le message « paysage suivant indisponible · déplacement arrêté »; elles documentent cet état au lieu de fournir une baseline saine exhaustive. Comparaisons multi-saisons/heures, Poitiers/Châtellerault/Chauvigny/rivières/forêts/hameaux et revue stratifiée ne sont pas closes par quelques captures. La grille humaine A56 est fournie, sans notes inventées. Contrôle corrigé du jeu compilé : Chauvigny, Poitiers, Montmorillon, à des positions admises et avec attente explicite de la reconstruction des bâtiments. Le premier protocole attendait seulement le support : ses images prématurées sont conservées dans browser-premature-readiness.json et les fichiers premature-*, non admis comme preuve artistique. Les noms de stations décrivent des cibles ; ils ne prouvent pas un centre historique. Le smoke de production sans hooks vérifie clavier, audio, trois profils et tactile émulé (production-smoke.json). La séquence native finale est stationnaire, environ12s, vidéo seule, 7,441 images rendues/s sous SwiftShader à384×240 (viewport640×400, résolution adaptative non contrôlée), sans conclusion de fluidité. [browser-gameplay.json](mission-27-evidence/browser-gameplay.json) · [direction artistique](mission-27-art-direction.md).

## 7. Bâtiments et monuments

532 442 références de plans de bâtiments, 529 287 identités uniques selon le reçu; ouvertures opaques, palettes et toits dans les cas pris en charge. Les empreintes source restent les autorités physiques. Bâtiments techniques, formes complexes, trous et monuments exigent des replis tracés; aucun intérieur visitable ou monument authentique nouveau n’est attesté par la grammaire. Le reçu inventorie 529115 hauteurs inférées,324149 toits plats et372 repères patrimoniaux de repli. Une façade partiellement enfouie est observée à Chauvigny et géolocalisée dans les défauts résiduels. Taux de volumes encore génériques/vides visuellement : **non mesuré à l’échelle départementale**. Les compteurs hors ligne et les triangles ne prouvent pas un volume fermé correctement rendu. [richness-audit.json](mission-27-evidence/richness-audit.json) · [geometry-physical-audit.json](mission-27-evidence/geometry-physical-audit.json) · [browser-gameplay.json](mission-27-evidence/browser-gameplay.json).

## 8. Rivières, ponts et voirie

Sources, supports, collisions, corridors et refus historiques conservés. La nouvelle décoration ne crée ni pont, ni passage public, ni largeur navigable ni hauteur libre. L’eau départementale conserve une représentation plus simple que le shader aquatique du pilote; berges et infrastructures détaillées à l’échelle départementale restent partielles. Pas de campagne M27 exhaustive dessus/dessous/joints routiers. [immersive-parity-inventory.json](mission-27-evidence/immersive-parity-inventory.json) · [geometry-physical-audit.json](mission-27-evidence/geometry-physical-audit.json).

## 9. Streaming, LOD et popping

Le sidecar réutilise le gestionnaire, le worker et la file de préparation historiques; son absence ou corruption doit rester explicite et ne retire pas l’autorité physique source. La capacité de 12 tuiles/96 Mio historique ne couvre pas tout le heap, le worker et le GPU. L’identité stable des plans n’atteste pas l’absence de popping. A25–A31 restent ouverts sur leurs campagnes complètes: frontières, demi-tours, voiture, rivière, réseau et budgets. [streaming-traces.json](mission-27-evidence/streaming-traces.json) · [popping-audit.json](mission-27-evidence/popping-audit.json) · [browser-gameplay.json](mission-27-evidence/browser-gameplay.json).

## 10. Lumière et ombres

Les nouvelles plantes et leur profondeur réemploient le même champ de vent; les chemins historiques sont conservés. Ni la compilation des shaders, ni une capture fixe ne prouvent la disparition du shimmer, des sauts de caster ou des défauts de feuillage sur tronc. La matrice appariée mouvement/soleil/saisons/profils reste incomplète. [popping-audit.json](mission-27-evidence/popping-audit.json) · [performance.json](mission-27-evidence/performance.json).

## 11. Personnage, animaux, vent et audio

Le moteur météo/vent et le Soundscape sont partagés. Le contrôle habitat du département est branché, mais les perchoirs `userData.forest`, indices acoustiques eau/obstacles/feuillage, exposition neige et plusieurs sémantiques dépendent toujours du pilote. Le camp hors pilote demeure explicitement refusé; aucune nouvelle permission n’est déduite du décor. Les arbres départementaux simples ne sont pas la forêt articulée complète d’Angles. [immersive-parity-inventory.json](mission-27-evidence/immersive-parity-inventory.json) · [department-immersive-parity-audit.json](mission-27-evidence/department-immersive-parity-audit.json). L’inventaire des 499 tuiles n’est pas une mesure de mouvement, son ou saison réellement observés sur chacune.

## 12. Voyages réels et conservation historique

Les voyages historiques ci-dessous sont conservés, pas rejoués intégralement par M27. Ils ne valident ni les nouveaux détails, ni leur streaming. Les éventuels déplacements courts de diagnostic restent décrits par les reçus navigateur, séparés des voyages natifs.

M26.4 documente 21 034,73 m à pied Chauvigny–Vouneuil; 4 737,88 m depuis le spawn d’Angles sur trois tuiles; 80 605,09 m en voiture avec 205,13 m de marche; 40 354,34 m sur la régression finale du voyage historique (le repère M26.3 était 40,425 km); 1 000,12 m sur la Gartempe et 886,07 m sur le Clain. Ce sont des preuves historiques avec leurs SHA et méthodes, pas des kilomètres nouvellement accomplis par M27. Voir [rapport M26.4](mission-26-4.md) et [journeys.json](mission-27-evidence/journeys.json). Aucune session native M27 de 30–60 minutes ou voyage multimodal complet n’est déduite de ces archives.

## 13. Performances et appareils

Vérification finale : 493/493 tests déclarés dans le reçu; réussis=493; build réussi selon validation.json. La baseline initiale échouait à 446/449 à cause de `polygon-clipping`, dépendance déjà déclarée manquante dans l’installation. Après `npm ci`, 466/466 tests et build baseline réussis. Cette réparation ne constitue pas un nouvel ajout de dépendance.

[validation.json](mission-27-evidence/validation.json) · [performance.json](mission-27-evidence/performance.json) · [browser-gameplay.json](mission-27-evidence/browser-gameplay.json). Conserver les vrais P50/P95/P99/max et les échecs lorsqu’ils existent; reçu absent = non mesuré. Les tailles comprimées/JSON ne mesurent pas la mémoire CPU/GPU. Bench boucle totale, énergie, plafond de tâches et endurance native ne sont pas acquis par génération hors ligne. **A32 : NON_VALIDÉ_SUR_MATÉRIEL**; SwiftShader/émulation tactile ne prouvent ni 60 FPS physiques ni 30 FPS Android.

## 14. Matrice d’acceptation A01–A56

Les 56 critères du référentiel central sont conservés, malgré les anciennes mentions A01–A36 du format de document. [Matrice machine](mission-27-evidence/acceptance.json). ATTEINT est limité à l’exigence précise; les critères bloquants ouverts interdisent d’annoncer la mission complète.

| ID | Exigence | État | Preuve et limite |
|---|---|---|---|
| A01 | Conservation et ascendance vérifiées | **PARTIEL** | Base M26.4 et inventaire conservés; lire les reçus Git/préservation finaux. Les voyages historiques ne sont pas recertifiés par les tests unitaires. [preuve](mission-27-evidence/preservation.json) · [preuve](mission-27-evidence/git-state.json) · [preuve](mission-27-evidence/validation.json) |
| A02 | Sources, dates, licences et couverture | **PARTIEL** | Corpus acquis et documentation auditables; frontières ZICAD et couverture locale de tous les nouveaux produits non acquises. [preuve](mission-27-evidence/source-manifest.json) · [preuve](mission-27-evidence/licenses-and-assets.json) |
| A03 | LiDAR fin et fallback honnête | **PARTIEL** | 499 packs 2 m historiques conservés; aucune nouvelle couverture départementale 50 cm acquise ou rendue. [preuve](mission-27-evidence/source-manifest.json) |
| A04 | Architecture universelle cohérente | **PARTIEL** | Générateurs et packs paramétrables; le jeu complet reste attaché au point d’entrée historique du pilote. [preuve](mission-27-evidence/planet-portability-audit.json) · [preuve](mission-27-evidence/international-fixtures.json) · [preuve](mission-27-evidence/geodesy-audit.json) |
| A05 | Pipeline déterministe | **ATTEINT** | Deux générations identiques par tuile attestées; portée: artefacts et identités, sans conclusion perceptive. [preuve](mission-27-evidence/generation.json) |
| A06 | 499 tuiles enrichies | **PARTIEL** | 499/499 artefacts générés; contenu présent et rendu observé restent des dimensions séparées. Pas de validation artistique exhaustive. [preuve](mission-27-evidence/coverage-tiles.json) · [preuve](mission-27-evidence/generation.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A07 | 265 communes représentées | **PARTIEL** | 265/265 centres couverts par un artefact; ce n’est pas une couverture artistique de chaque polygone communal. [preuve](mission-27-evidence/coverage-communes.json) |
| A08 | Richesse perçue homogène | **NON_ATTEINT** | Équivalence à Angles non démontrée; baseline initiale limitée, comparaison stratifiée native encore ouverte. [preuve](mission-27-evidence/visual-stations.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A09 | Absence de zones pauvres injustifiées | **PARTIEL** | Audit hors ligne des habitats, exclusions et détails; les zones sans habitat ou sans détail ne sont pas closes par une revue départementale. [preuve](mission-27-evidence/richness-audit.json) · [preuve](mission-27-evidence/coverage-tiles.json) |
| A10 | Sols et micro-relief détaillés | **PARTIEL** | Petits détails visuels ancrés sur support existant; pas de nouvelle microtopographie ni campagne complète sols/pentes/saisons. [preuve](mission-27-evidence/richness-audit.json) · [preuve](mission-27-evidence/geometry-physical-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A11 | Forêts, lisières et sous-bois | **PARTIEL** | Nouvelle couche de petites familles; les arbres départementaux simples et la forêt articulée du pilote restent différents. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A12 | Prairies, haies, champs et bocage | **PARTIEL** | Placement contextuel borné; saisons, cultures, haies et quatre milieux non validés nativement dans leur ensemble. [preuve](mission-27-evidence/richness-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A13 | Bâtiments courants finis | **PARTIEL** | Plans de façades, ouvertures opaques et toits pris en charge; replis et formes complexes subsistent. Plans générés et volumes réellement rendus restent séparés. [preuve](mission-27-evidence/richness-audit.json) · [preuve](mission-27-evidence/geometry-physical-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A14 | Styles urbains contextualisés | **PARTIEL** | Pack régional et usages courants; pas de revue démontrant les identités urbaines distinctes de toutes les stations. [preuve](mission-27-evidence/richness-audit.json) · [preuve](mission-27-evidence/visual-stations.json) |
| A15 | Monuments et repères | **PARTIEL** | Monuments historiques préservés; replis génériques honnêtes, aucune nouvelle reproduction authentique départementale revendiquée. [preuve](mission-27-evidence/source-manifest.json) · [preuve](mission-27-evidence/preservation.json) · [preuve](mission-27-evidence/richness-audit.json) |
| A16 | Rivières détaillées et raccordées | **PARTIEL** | Eau et navigation historiques conservées; le shader aquatique, les berges et champs source du pilote ne sont pas intégralement étendus. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/geometry-physical-audit.json) |
| A17 | Ponts et géométrie | **PARTIEL** | Aucun nouvel accès ni hauteur libre inventée; campagne complète dessus/dessous et finitions départementales non démontrée. [preuve](mission-27-evidence/geometry-physical-audit.json) · [preuve](mission-27-evidence/preservation.json) |
| A18 | Voirie fidèle et détaillée | **PARTIEL** | Sources et supports historiques conservés; pas de campagne visuelle route rurale/ville/nationale/autoroute complète. [preuve](mission-27-evidence/preservation.json) · [preuve](mission-27-evidence/geometry-physical-audit.json) |
| A19 | Rails et aéroport | **PARTIEL** | Voies et transport hérités conservés; absence de rejeu natif exhaustif M27 des stations et infrastructures. [preuve](mission-27-evidence/preservation.json) · [preuve](mission-27-evidence/validation.json) |
| A20 | Détails de vie contextuels | **PARTIEL** | Petits végétaux, pierres et bois mort sélectionnés par habitat et exclusions; mobilier et vie locale généralisés non livrés. [preuve](mission-27-evidence/richness-audit.json) · [preuve](mission-27-evidence/immersive-parity-inventory.json) |
| A21 | Matériaux et textures | **PARTIEL** | Palettes et géométries originales, licences conservées; pas de nouvelle bibliothèque PBR départementale complète ni compression KTX2 revendiquée. [preuve](mission-27-evidence/licenses-and-assets.json) · [preuve](mission-27-evidence/source-manifest.json) |
| A22 | Lumière et ombres stables | **PARTIEL** | Mêmes horloges et vent/depth pour détails; l’absence de shimmer ou clignotement en mouvement n’est pas démontrée. [preuve](mission-27-evidence/popping-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) · [preuve](mission-27-evidence/immersive-parity-inventory.json) |
| A23 | Animations cohérentes | **PARTIEL** | Branchement commun du vent et préservation des corrections M26.4; naturel et absence de reset à toutes frontières non certifiés. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A24 | Sons spatialisés continus | **PARTIEL** | Soundscape partagé; indices eau/obstacles/feuillage encore liés au pilote, aucune écoute départementale complète certifiée. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A25 | LOD terrain sans couture | **PARTIEL** | Propriétaire physique historique conservé; audit exhaustif des bords et long parcours M27 non rejoués. [preuve](mission-27-evidence/geometry-physical-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A26 | LOD objets sans popping | **NON_ATTEINT** | Identité déterministe ne prouve pas absence de popping; silhouettes/casters et demi-tours natifs départementaux encore ouverts. [preuve](mission-27-evidence/popping-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A27 | Préchargement à pied | **PARTIEL** | Planificateur historique conservé; nouveau long voyage M27 et embranchements non démontrés par les plans. [preuve](mission-27-evidence/streaming-traces.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A28 | Préchargement voiture | **PARTIEL** | Streaming et voiture hérités; voyage M27 intercommunal avec sortie immédiate non recertifié. [preuve](mission-27-evidence/streaming-traces.json) · [preuve](mission-27-evidence/journeys.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A29 | Streaming rivière et packraft | **PARTIEL** | Corridors conservateurs hérités; nouveau parcours natif M27 eau/berges/ombres non démontré. [preuve](mission-27-evidence/streaming-traces.json) · [preuve](mission-27-evidence/journeys.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A30 | Incidents réseau sans vide ni téléportation | **PARTIEL** | Vérification, erreur et fallback de sidecar implémentés; campagne réseau complète en déplacement non démontrée. [preuve](mission-27-evidence/streaming-traces.json) · [preuve](mission-27-evidence/browser-gameplay.json) · [preuve](mission-27-evidence/validation.json) |
| A31 | Budget main thread | **NON_ATTEINT** | Aucune tâche streaming >50 ms et préparation ≤8 ms ne sont pas acquises; conserver les maxima réellement enregistrés. [preuve](mission-27-evidence/performance.json) · [preuve](mission-27-evidence/streaming-traces.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A32 | FPS et énergie desktop/mobile | **NON_VALIDÉ_SUR_MATÉRIEL** | Pas de GPU physique ni téléphone réel certifié. SwiftShader et émulation tactile restent distincts des performances matérielles. [preuve](mission-27-evidence/performance.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A33 | Mémoire longue session | **NON_ATTEINT** | Aucune session native finale de 30–60 minutes avec évictions et mesure CPU/GPU/audio complète certifiée. [preuve](mission-27-evidence/performance.json) · [preuve](mission-27-evidence/streaming-traces.json) |
| A34 | Save, reload, rebase et LOD | **PARTIEL** | Mécanismes hérités et tests techniques; consulter les checks runtime réellement fournis, sans extrapolation à tous modes/objets. [preuve](mission-27-evidence/validation.json) · [preuve](mission-27-evidence/fixtures-runtime.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A35 | Validation artistique départementale | **PARTIEL** | 22 stations et échantillon stratifié sélectionnés depuis sources; sélection ne signifie ni visite, ni revue complète. [preuve](mission-27-evidence/visual-stations.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A36 | Rapport honnête et conservation | **PARTIEL** | Rapport unique, preuves et écarts explicites; résultats finaux, intégrité et état de PR à vérifier dans leurs reçus. [preuve](mission-27-evidence/validation.json) · [preuve](mission-27-evidence/preservation.json) · [preuve](mission-27-evidence/git-state.json) |
| A37 | Indépendance administrative | **PARTIEL** | Nouvelle génération paramétrable par manifeste; runtime principal encore configuré pour fr-86/Angles. [preuve](mission-27-evidence/planet-portability-audit.json) · [preuve](mission-27-evidence/international-fixtures.json) |
| A38 | Géodésie mondiale robuste | **PARTIEL** | Provider numérique ECEF/ENU et cellules testés; pas de migration de la géodésie active, de la météo ni des supports entre repères du jeu. [preuve](mission-27-evidence/geodesy-audit.json) · [preuve](mission-27-evidence/planet-portability-audit.json) |
| A39 | Biomes et saisons mondiaux | **PARTIEL** | Packs de contenu distincts; climat, mousson, saisons et catalogues biologiques mondiaux complets non simulés par ces packs. [preuve](mission-27-evidence/international-fixtures.json) · [preuve](mission-27-evidence/immersive-parity-inventory.json) |
| A40 | Packs régionaux | **PARTIEL** | Schémas et variations déclaratifs actifs pour la nouvelle couche; pas de remplacement universel des bibliothèques historiques. [preuve](mission-27-evidence/international-fixtures.json) · [preuve](mission-27-evidence/planet-portability-audit.json) |
| A41 | Fournisseurs et provenance | **PARTIEL** | Provenance conservée et provider de coordonnées ajouté; aucune fusion mondiale de nouveaux fournisseurs terrain/vecteurs réellement intégrée. [preuve](mission-27-evidence/source-manifest.json) · [preuve](mission-27-evidence/geodesy-audit.json) · [preuve](mission-27-evidence/planet-portability-audit.json) |
| A42 | Production et distribution incrémentales | **PARTIEL** | Dépendances et réutilisation d’artefacts locales; diffusion multi-pays et capacité mondiale non démontrées en production. [preuve](mission-27-evidence/generation.json) · [preuve](mission-27-evidence/planet-portability-audit.json) |
| A43 | Test montagne | **PARTIEL** | Fixture explicitement synthétique sur même pipeline/runtime; elle ne prouve ni géographie réelle, ni audio/climat/activités complets. [preuve](mission-27-evidence/international-fixtures.json) · [preuve](mission-27-evidence/fixtures-runtime.json) |
| A44 | Test hors Europe | **PARTIEL** | Fixture tropicale explicitement synthétique avec autre pack; aucune production géographique hors Europe ni parité sensorielle complète. [preuve](mission-27-evidence/international-fixtures.json) · [preuve](mission-27-evidence/fixtures-runtime.json) |
| A45 | Audit de portabilité et échelle | **PARTIEL** | Dépendances et estimations documentées; limites d’intégration et de capacité terrestre encore ouvertes. [preuve](mission-27-evidence/planet-portability-audit.json) · [preuve](mission-27-evidence/geodesy-audit.json) |
| A46 | Inventaire de parité immersive | **ATTEINT** | Inventaire source des systèmes, dépendances et adaptations; sa présence ne valide pas les systèmes en mouvement sur toutes les tuiles. [preuve](mission-27-evidence/immersive-parity-inventory.json) |
| A47 | Vent, arbres et sols vivants | **PARTIEL** | Champ de vent partagé et détails animables; forêt départementale et observation d’animation de toute la couverture encore insuffisantes. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/department-immersive-parity-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A48 | Saisons, météo et éclairage | **PARTIEL** | Moteur partagé; matrice quatre saisons/jour-soir-nuit par milieu et exposition départementale non démontrées. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/department-immersive-parity-audit.json) |
| A49 | Eau, berges et effets | **PARTIEL** | Activités et contacts hérités conservés; parité aquatique visuelle départementale non livrée. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/department-immersive-parity-audit.json) |
| A50 | Faune et audio | **PARTIEL** | Contrôleurs communs, mais perchoirs, indices et catalogues gardent des dépendances au pilote; continuité native non certifiée. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/department-immersive-parity-audit.json) |
| A51 | Interactions et traces | **PARTIEL** | Supports admis réemployés; camp hors pilote refusé et sémantique d’interaction non généralisée. [preuve](mission-27-evidence/immersive-parity-inventory.json) · [preuve](mission-27-evidence/validation.json) |
| A52 | Audit immersif 499 tuiles | **PARTIEL** | Inventaire de disponibilité produit pour les tuiles; pas d’observation équivalente de tous les systèmes ni de campagne perceptive exhaustive. [preuve](mission-27-evidence/department-immersive-parity-audit.json) · [preuve](mission-27-evidence/browser-gameplay.json) |
| A53 | Référence Walk Simulator | **PARTIEL** | Marche reste la référence de conception; séquence native immersive complète encore à juger. [preuve](mission-27-evidence/browser-gameplay.json) · [preuve](mission-27-evidence/journeys.json) |
| A54 | Voyage multimodal continu | **PARTIEL** | Modes opérationnels hérités préservés; voyage M27 marche/voiture/bateau continu non démontré. Aucun train nouveau revendiqué. [preuve](mission-27-evidence/journeys.json) · [preuve](mission-27-evidence/immersive-parity-inventory.json) |
| A55 | Continuité sensorielle intermodale | **PARTIEL** | Horloge et identités partagées; preuve native soleil/vent/audio/objets sur transitions multimodales encore ouverte. [preuve](mission-27-evidence/journeys.json) · [preuve](mission-27-evidence/browser-gameplay.json) · [preuve](mission-27-evidence/immersive-parity-inventory.json) |
| A56 | Qualité poétique et naturelle | **NON_ATTEINT** | Grille humaine fournie dans direction artistique; aucune note ou validation perceptive fabriquée depuis plans ou captures fixes. [preuve](mission-27-evidence/browser-gameplay.json) |

## 15. Registre résiduel

[residual-defects.geojson](mission-27-evidence/residual-defects.geojson). Les positions non observées ne sont pas inventées : les couches de couverture/stations conservent leurs coordonnées source et leur statut de visite.

- P1 : parité artistique/immersive départementale non prouvée; eau, forêt, audio, exposition neige, interactions et camp encore incomplets hors pilote.
- P1 : popping/ombres, préparation >50 ms, réseau en déplacement et longs voyages M27 non clos. Les défauts historiques ne sont pas déclarés réparés sur une autre scène.
- P1 : géodésie runtime mondiale, fournisseurs et climats non entièrement découplés du pilote.
- P2 : revue des replis architecturaux, couverture fine des habitats, compression et validation de capacité multi-pays à poursuivre.

## 16. Préservation et reproduction

[preservation.json](mission-27-evidence/preservation.json) · [validation.json](mission-27-evidence/validation.json) · [commandes et prérequis](mission-27-evidence/REPRODUCTION.md). Les anciennes preuves restent historiques; aucune retouche de SHA ou de trajectoire n’est admise. La comparaison d’empreintes atteste les fichiers effectivement inclus dans son inventaire, pas un rejeu de toutes activités.

## 17. Décision proposée

**Ne pas accepter M27 comme entièrement achevée.** Conserver la PR consolidée en brouillon pour revue du code et des écarts. Le pipeline fonctionnel est une avancée partielle; couverture artistique, parité sensorielle, campagnes natives, matériel et portabilité du jeu complet demandent encore du travail. Aucune fusion, publication ou dépense n’est effectuée par cette remise.
