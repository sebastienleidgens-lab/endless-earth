# Mission 24 — livraison groupée pour validation finale

PR [#34](https://github.com/sebastienleidgens-lab/endless-earth/pull/34), branche `mission/24-monde-vivant-voyageur`, **brouillon, sans fusion ni déploiement**. Budget supplémentaire **0 €**. Les phases A–F sont réunies dans cette livraison ; les réserves ci-dessous restent à valider. **La nage dans l’Anglin réel n’est pas livrée : aucune bathymétrie exploitable ne permet de valider trois accès.** Le moteur aquatique est implémenté, testé et filmé sur trois rampes synthétiques clairement désignées.

[Galerie autonome](mission-24-evidence/index.html) · [preuves finales](mission-24-evidence/final/captures.json) · [état du premier jalon conservé](mission-24-jalon1.md). Le premier jalon et ses mesures restent archivés, ils ne sont pas présentés comme les résultats de cette version.

## Base et conservation de M23

La PR M23 #33 est fusionnée, statut vérifié avant création de la branche. Base `9716fbb40f59a213107e18c699f4b317da86edf3`, dernier commit M23 `17c45488e7e8eb46ebfc039d0362286e2f72662e` et ses six commits vérifiés dans l’ascendance. AGENTS.md, ADN et contrats/rapports M10–M23 ont guidé l’audit.

L’[audit final](mission-24-evidence/final/preservation.json) conserve **628 fichiers protégés identiques**, détaille 12 modifications intentionnelles et lie les sources exécutées à leurs SHA-256. Les packs terrain, routes, eaux, ponts, implantations d’arbres et empreintes bâties ne changent pas. Le [graphe régénéré](mission-24-evidence/final/graph-regeneration.json) reste identique octet par octet : **916 nœuds, 893 segments**. 2898 requêtes et 20 déplacements natifs sont identiques à M23. Les stations sèches de raccord, talus et pont sont reprises sans camouflage.

Les défauts M23 restent ouverts : raccords Rue du Pont jusqu’à **0,996 m**, talus bâtis, erreurs locales de relief jusqu’à **11,833 m** dans la comparaison réservée M23. Son bilan historique reste **+9,11 % médian, +16,93 % au pire**, cinq scènes Équilibré sur huit au-delà de +5 %. Aucun succès M24 ne ferme ces réserves. Living Paintings / LP-01, dépendances et workflows de production ne changent pas.

## A–B : hiver, empreintes, cheminées et vent

**Branches.** L’ordre des triangles solides contredisait les normales radiales ; le masque double face retournait alors certains dessous vers le ciel. La correction conserve chaque attribut de sommet et corrige uniquement le winding nécessaire ; seules les feuilles minces gardent le retournement double face. Gravité −Y monde, dépôt +Y monde, exposition et saison partagées. L’audit initial compare 177 172 triangles et 75 679 réorientations. La sonde finale reprend cinq familles au-dessus/dessous : dessous blanchi inférieur à **0,2 %**, dépôt supérieur encore présent, silhouettes inchangées au calme. [Raster final](mission-24-evidence/final/branch-raster.json). **Limite : dépôt de couleur et relief optique fin, sans nouvelle couche volumétrique ; gros plans isolés des rubans LOD 2/3 initiaux non concluants.** Ils ne prouvent pas toutes les transitions ni un dépôt individuel sur chaque aiguille.

**Empreintes.** Le rig publie les contacts après IK, confirme le support et subdivise les pas à faible FPS. Le renderer projette une grille de **15 points** sur le support visible M23, avec talon, avant-pied, bande de roulement, compression et bord clair. Deux pieds, orientation et appui réels ; refus sur eau, support incertain, rupture, neige insuffisante ou pente excessive. Le [film natif](mission-24-evidence/final/winter-footprints.webm) contient **10 traces**, 10 contacts exportés. Pas de minuterie décorative. La profondeur de neige est une échelle artistique dérivée du même dépôt, **pas une mesure météorologique** ; compression plafonnée à environ 14 mm, sans déformer le terrain.

Pool maximal 384, plafonds Éco 96 / Équilibré 256 / Qualité 384 ; **244,224 octets** de tableaux et indices, un appel si visible. Conservation proche jusqu’à 85 m et 330 s, fondu par âge, fonte et nouvel enneigement. Téléportations diagnostiques et changements de profil ne produisent pas de traînée. La semelle est procédurale et stylisée ; l’appréciation « très réaliste » reste au propriétaire. Les sons neigeux existants sont conservés sur les contacts de locomotion.

**Cheminées.** 238 sorties géométriques inventoriées, **170 bâtiments éligibles**, dont 170 résidences inférées à partir des bâtiments génériques, taille et sortie existante : aucune observation d’occupation réelle revendiquée. Un foyer logique déterministe par bâtiment, heure et température ; 59 actifs dans la prise hivernale, **0** dans sa comparaison estivale. Le froid plus marqué active une proportion plus élevée, testée indépendamment. Les panaches partent du pot géométrique, montent, s’inclinent avec le même vent et se dissipent. [Gros plan natif](mission-24-evidence/final/chimney-outlet-close.webm), caméra d’inspection au-dessus du toit réel. Une sonde on/off à caméra et climat figés confirme 6 421 pixels modifiés de plus de deux niveaux RGB, maximum 25 niveaux ; un appel de rendu pour six panaches. [Contribution raster](mission-24-evidence/final/smoke-raster.json).

Un seul lot instancié, aucun système par maison. Budget global inchangé 4/8/16 particules ; la sélection proche/visible réserve deux places aux autres effets, soit au plus 2/6/14 panaches. La prise hivernale termine avec 4 visibles ; les maisons actives hors champ restent logiques. L’émission est volontairement légère, les caps et pots restent des interprétations architecturales.

**Vent.** Le champ M11 garde ses propriétaires, direction spatiale corrélée, réponse amortie et cache GPU. Les accalmies temporelles sont plus marquées, les charpentières/branches fines plus réactives ; les essences déjà très flexibles sont limitées par la constante CPU/GPU commune **1,38**, pour conserver l’enveloppe **3,8 m** et l’ancrage des racines. Aucun déplacement de collision. Films au même atelier sur deux familles : calme, brise, rafale et fort vent. Les scénarios de neige, fumée et camp consomment le même `scene.userData.climate` et son temps, sans seconde météo.

## C : voyageur et locomotion

Création originale, grand sac, bretelles avant/arrière, attaches, poches, équipement roulé, col, barbe et visage stylisé. Aucun asset de Joel ni modèle tiers. **2656 triangles, 17 os, un SkinnedMesh/appel, zéro texture image**, 1088 octets de données d’os. Le sac suit le torse et possède un mouvement secondaire discret. Le modèle posé au camp provient du même sac, cloné sans muter le corps ; le sac porté est masqué pendant le camp.

La cadence reste liée à la distance autorisée par le contrôleur. Les corrections IK M23, phases de course et contacts talon/pointe restent en place ; les grands pas de temps sont subdivisés avant publication des contacts. Quatre vues avant/après appariées, marche/course/virage/arrêt, pente et escalier OSM natifs, plus tests 4/8/30/60 Hz. Les marches individuelles de l’escalier ne sont pas levées dans le MNT : le film vérifie l’axe OSM admis et son support visible, sans inventer des contremarches.

## D : interaction aquatique et blocage géographique explicite

`PlayerActivity` possède marche, immersion, nage, camp et transition. `AquaticController` exige fond/niveau dans un même repère, provenance, permission, continuité, absence d’obstacle et route connectée jusqu’à une sortie peu profonde praticable. Entrée peu profonde, vitesse bornée, hystérésis immersion/nage, orientation et flottabilité, rig de nage et rides de surface plafonnées. AutoWalk ne reçoit aucune admission automatique. Les refus piétons M23 restent intacts ; seul un corridor validé peut utiliser le contrôle aquatique plus étroit, qui conserve murs, bâtiments, restrictions et ouvrages.

**Zéro corridor réel chargé.** Le [dossier des sources](mission-24-evidence/final/aquatic-data.json) distingue les niveaux de station HydroPortail de la profondeur spatiale. Le guide PPRI officiel avertit que la triangulation LiDAR entre berges ne représente pas le fond réel. Aucun fond n’a été inventé. Les trois films de rampes synthétiques montrent marche immergée, nage, virage et retour avec les composants de production ; ce sont des tests du moteur, **pas trois entrées/sorties acceptées dans l’Anglin**. Il faut des levés de fond géoréférencés sous licence et leurs corridors pour ouvrir cette partie. Aucun courant non mesuré ni mécanisme de survie ajouté.

## E : Camper de bout en bout

Une action accessible, traduite FR/EN, clavier et tactile, cible confortable et refus explicites. Validation de tout le site sur support visible : environ 90 échantillons, pente ≤0,14, exclusions route et marge 2,2 m, rive 10 m, arbre 2,4 m, obstacles et accès privés. Chaque ancrage de tente est échantillonné, sans déplacer le terrain.

Transaction de 0,9 s avec commit au milieu du fondu, revalidation et rollback ; entrées verrouillées, double clic ignoré. Tente, petit foyer, sac posé, personnage assis bas avec genoux repliés ; second clic retire le camp et restaure le sac et la marche au même endroit. Le rig reste un seul personnage. La caméra tient compte de la tente. Le sol est revalidé au maximum chaque seconde ; s’il devient invalide, le camp est retiré, le refus affiché et les collisions ordinaires reprennent, **sans téléportation**. Le monde géographique reste immuable pendant la session normale.

Flammes et braises procédurales, lumière locale active hors Éco, fumée dans le budget partagé, vent/climat communs. Camp actif : **878 triangles de props/effets, 3 composants physiques**, un point lumineux hors Éco. [Film complet](mission-24-evidence/final/camp-complete.webm), son réellement capturé après activation ; le renderer audio existant borne voix et HRTF. Enregistrement **Campfire.wav — Defaultv, CC0-1.0**, extrait mono 32 kHz FLAC de 18 s, 438 737 octets. Préécoute HQ MP3 du fournisseur, aucune captation locale revendiquée ; [droits, empreintes et transformations](mission-24-evidence/final/audio-source.json). Une seule voix de feu, arrêt en fondu au rangement, aucune AudioContext avant activation du son.

**Dix cycles natifs** plus dix cycles unitaires, profils alternés et perte de focus : aucune duplication ; zéro objet/lumière de camp après rangement. Géométries résidentes après rangement : **136–136** pendant les dix cycles. Les variations de textures/programmes liées aux profils et à l’initialisation audio sont conservées dans les traces ; ce test court ne prouve pas l’absence de fuite sur plusieurs heures. Rechargement/HMR/pagehide disposent explicitement des effets. Pas de sauvegarde ou inventaire ajouté. L’ombre solaire de la tente n’est pas ajoutée à l’atlas statique du terrain ; sa présentation reste stylisée.

## F : validation, performances et limites

**360 tests réussis**, TypeScript strict/Vite réussis. Avertissement Vite sur le chunk >500 kB conservé. Contrôles compilés : marche et regard par vrais événements tactiles CDP, menu, mois, profils, position stable et absence de débordement. Camp tactile Éco filmé séparément. Chromium/SwiftShader logiciel : **émulation mobile, aucun Android physique ni vrai GPU disponible**. Les films de faible FPS ne sont pas des promesses de fluidité matérielle.

Les 23 films finaux plus le film tactile compilé couvrent les sept chantiers ; les captures de l’ancien jalon restent séparées. Zéro erreur JS/WebGL nouvelle dans les passes retenues. La validation aquatique réelle reste bloquée, les rubans LOD lointains conservent la réserve visuelle initiale, et l’aspect artistique final exige l’examen du propriétaire.

Benchmark apparié M23/M24 : 24 cas, trois profils, huit scènes, 20 échantillons chauds alternés par version/cas, caméra/date/temps météo/neige identiques, `gl.finish` et CPU des signes de vie inclus, **480×320, SwiftShader**, aucune charge graphique concurrente. Les appels et triangles sont natifs. Le tas inclut l’instrumentation ; allocations GL logiques ≠ VRAM physique. Les scripts et échantillons bruts sont [livrés](mission-24-evidence/final/performance.json).

| Scène | M23 médiane | M24 médiane | M24 P95 | Écart | Appels M23→M24 | Triangles M23→M24 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| village | 385.60 ms | 385.40 ms | 458.70 ms | -0.05 % | 106→107 | 218636→219056 |
| pont | 273.70 ms | 251.50 ms | 285.30 ms | -8.11 % | 88→88 | 169561→157129 |
| foret | 199.80 ms | 212.10 ms | 245.20 ms | +6.16 % | 46→46 | 160542→160950 |
| rive | 403.60 ms | 408.80 ms | 506.40 ms | +1.29 % | 168→169 | 311759→312177 |
| terrain | 214.40 ms | 214.80 ms | 255.40 ms | +0.19 % | 90→91 | 171171→171581 |
| route | 287.50 ms | 295.90 ms | 371.40 ms | +2.92 % | 98→99 | 190510→190930 |
| nuit | 322.60 ms | 316.90 ms | 363.20 ms | -1.77 % | 102→103 | 252096→252108 |
| neige | 214.10 ms | 217.60 ms | 281.10 ms | +1.63 % | 46→46 | 160542→160950 |

| Scène Équilibré | Buffers Mio M23→M24 | Textures Mio M23→M24 | Tas M24 Mio | CPU signes M24 | Soumission JS M24 |
| --- | ---: | ---: | ---: | ---: | ---: |
| village | 42.84→42.86 | 25.96→25.96 | 219.8 | 0.10 ms | 1.80 ms |
| pont | 44.68→43.42 | 25.96→25.96 | 224.5 | 0.10 ms | 1.70 ms |
| foret | 45.34→44.08 | 25.96→25.96 | 221.0 | 0.00 ms | 1.40 ms |
| rive | 45.50→44.24 | 25.96→25.96 | 216.1 | 0.10 ms | 2.10 ms |
| terrain | 46.01→44.75 | 25.96→25.96 | 217.2 | 0.00 ms | 1.70 ms |
| route | 46.45→45.19 | 25.96→25.96 | 231.2 | 0.10 ms | 2.10 ms |
| nuit | 49.55→48.29 | 25.96→25.96 | 228.0 | 0.00 ms | 1.70 ms |
| neige | 49.81→48.55 | 25.96→25.96 | 236.0 | 0.00 ms | 1.60 ms |

Les durées CPU sont quantifiées par `performance.now` ; une valeur nulle indique un coût inférieur à sa résolution. La soumission JS ne sépare pas le travail du pilote graphique.

En Équilibré : médiane des écarts **+0.74 %**, pire **+6.16 %** ; **1/8** scènes dépassent l’objectif +5 %. Une [première passe avant calibration des fumées](mission-24-evidence/final/performance-pre-smoke-calibration.json) est conservée séparément ; les mesures ne sont pas fusionnées. Ces exceptions restent ouvertes : foret. La dispersion logicielle et l’absence de GPU matériel limitent la généralisation.

Coût des interactions mesuré séparément dans M24, scène/caméra/climat figés :

| Effet Équilibré | Sans → actif, médiane | Écart | Appels supplémentaires | CPU effets actif |
| --- | ---: | ---: | ---: | ---: |
| footprints | 206.30 → 214.80 ms | +4.12 % | 1 | 0.000 ms |
| camp | 159.50 → 168.30 ms | +5.52 % | 4 | 0.000 ms |

[Échantillons et allocations des effets](mission-24-evidence/final/effects-performance.json). Les empreintes de cette mesure reprennent les contacts réels enregistrés, uniquement pour mesurer le rendu ; ce n’est pas une preuve de nouvelle marche native. Le coût du feu avec point lumineux peut dépasser le budget ordinaire ; Éco retire cette lumière. Les coûts actifs ne sont pas confondus avec les scènes M23 sans interaction.

Bundle JS : **1,033,119 → 1,065,649 octets**, gzip **315,413 → 327,500**. Une nouvelle ressource audio ; pas de modèle, texture image, dépendance, service payant ou clé ajouté. Les 53 enregistrements et 118 assets audio précédents restent exacts. [Hashes de conservation](mission-24-evidence/final/preservation.json) · [inventaire de tous les fichiers modifiés depuis M23](mission-24-evidence/final/file-inventory.json).

La PR reste en brouillon pour votre validation finale. Aucun jalon supplémentaire n’est demandé séparément ; les limites mesurées et le blocage de bathymétrie sont réunis ici.
