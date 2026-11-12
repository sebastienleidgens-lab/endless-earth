# 15C — Le promeneur et l’interface immersive

[Rapport](../../mission-15.md) · [Comparatif réel](comparison.jpg) · [Galerie locale](index.html).

Référence 15B : `acf05c3ae66e7cfab391998bc93a774ed462d412`. Le propriétaire a validé 15B et autorisé 15C. Arrêt avant 15D ; aucune fusion, publication ou modification GitHub Pages/LP-01.

Le personnage et ses animations sont originaux, sans modèle ou enregistrement extérieur importé. Les deux références CC0 de Quaternius sont étudiées et citées dans `audit.json`, avec les empreintes des pages ; leurs chiffres publiés ne constituent pas un benchmark d’actifs importés.

Les photos sont issues du vrai moteur. Les poses d’inspection rapprochées, forêt, pente et vues première/aérienne sont séparées. Les films utilisent une station diagnostique de départ puis les commandes et la boucle ordinaires, sans accélération ni trajet forcé. Le canevas enregistré exclut les contrôles HTML ; les captures du menu montrent l’interface réelle. Les versions avant/après ont les mêmes caméras, date, soleil, vent et nuages dans les comparaisons tenues.

La marche/course sonore utilise l’asphalte documenté du Quai du Premier Président Pérevier ; les compteurs augmentent en marche et en course, puis restent fixes au repos final. Sur la pente à matière acoustique inconnue, le silence des contacts conserve la politique audio existante.

La série `starts.json` compte 112 ouvertures complètes sans mode `perf` : 100 graines, six répétitions, six ouvertures ordinaires sans graine. Chaque position passe le vrai inspecteur, et une première image est rendue. Deux pages indépendantes partagent la machine : leurs durées de chargement ne sont pas un benchmark matériel ou Internet. Le chargement des sources tient les frames par une injection annoncée ; la sélection et la physique ne sont pas remplacées.

Le graphe de marche est préparé par le moteur, identique au `buildGraph` d’origine, lié aux données et aux générateurs physiques. Le premier calcul à la demande provoquait une pause d’environ 14 s ; le dérivé de 38,7 ko l’évite. Sa licence conserve IGN/OSM. Cache absent, périmé ou corrompu : marche libre disponible et AutoWalk désactivé, sans recalcul lourd masqué derrière le bouton.

## Reproduire

1. Checkout propre du commit 15B, serveur Vite sur **5308** ; branche 15C sur **5303**. Préfixe `/endless-earth/`.
2. `node scripts/prepare-walk-graph.mjs` exporte le graphe physique réel en mode explicitement diagnostique. Répéter doit produire des octets identiques de manifeste et de pack. Ne pas régénérer pendant une observation native : Vite peut recharger la page.
3. `node scripts/freeze-mission-15c.mjs` fige les sources, puis `node scripts/browser-mission-15c-starts.mjs` lance les 112 ouvertures. Son checkpoint est lié aux empreintes des sources et peut reprendre après une interruption d’environnement.
4. `node scripts/browser-mission-15c-captures.mjs` puis `node scripts/benchmark-mission-15c.mjs`. La mesure doit tourner seule, sans autre navigateur ou travail graphique. `benchmark-mission-15c-animation.mjs` isole ensuite le CPU avec des distances synthétiques ; ce n’est pas une preuve de marche.
5. `node scripts/browser-mission-15c-runtime.mjs` et `node scripts/browser-mission-15c-ui.mjs` : collisions, ressources, contact bloqué, replis, clavier, quatre formats et gestes CDP natifs.
6. `node scripts/browser-mission-15c-motion.mjs before route`, `after route`, `before run`, `after run`, `after slope` : observations natives. Activer le vrai audio par son bouton. Les films restent VP9/Opus, puis sont indexés par copie de paquets.
7. `npm test`, `npm run build`. Sur le preview local : `TEST_URL='http://localhost:5300/endless-earth/?perf=1&spawnSeed=12345&moment=afternoon&weather=snow&date=2026-01-21T12:00:00Z' npm run test:browser` ; `EARTHLIFE_WAIT_WORLD=1 npm run test:build-identity`.
8. `node scripts/verify-mission-15c-media.mjs` décode intégralement et compare les paquets/temps natifs. `node scripts/benchmark-mission-15c-alternative.mjs`, seul après fermeture des autres navigateurs, compare en plus 24 rendus avec/sans ombres locales reçues par le personnage. `python3 scripts/report-mission-15c.py` rassemble la galerie et le rapport.

Les outils de preuves demandent Chromium/Playwright, FFmpeg et Python/Pillow déjà installés. Mesures SwiftShader logiciel, aucun GPU physique ou Android revendiqué. La validation artistique reste humaine. Les limites M14 d’accès au pont/ruines sont conservées ; aucune station d’inspection n’est présentée comme la preuve d’un itinéraire accessible entre toutes les poses.

La campagne finale Équilibré atteint **+10,5 % en forêt**, au-delà du seuil de 10 %. L’alternative ne gagne que **2,4 %** dans sa comparaison dédiée ; l’éclairage commun est conservé pour sa cohérence avec le sous-bois. Le compromis reste proposé à la validation humaine.
