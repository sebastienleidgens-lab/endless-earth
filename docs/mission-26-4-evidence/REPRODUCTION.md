# Reproduire M26.4

Le rapport [mission-26-4.md](../mission-26-4.md) est le bilan d'acceptation. Les scripts ci-dessous ne fusionnent et ne déploient rien. Node, npm, Chromium, Playwright et ffmpeg/ffprobe sont nécessaires. `npm ci` installe les dépendances déjà verrouillées ; aucune dépendance payante. Les sources OSM/IGN et les assets historiques sont ceux de `public`, avec leurs licences. Les 499 packs IGN 2 m se chargent à la demande au pin `acb0a73b396229bf90731b90a558a8d5d072a9ec` ; ne pas lancer une nouvelle acquisition départementale.

## Références et builds

Programme de référence : `b5a4f98c87d4adf130342bc05cfa732a70056502`. Programme final de la campagne : `d162a653785d656e1a6652c4ca406889a1b55c28`. Les commits ultérieurs peuvent ajouter tests, scripts, identité de rapport, documents et reçus ; `src` doit être identique à celui du reçu indiqué. Les archives [builds/index.json](builds/index.json) comprennent les JS/CSS/workers réellement exécutés et les reçus de source/données/instrumentation. Elles ne dupliquent pas 1,6 Go d'assets publics. Les builds marqués compilés seulement n'ont pas de revendication d'exécution.

Depuis la racine du dépôt, après `npm ci` :

```sh
git worktree add --detach work/mission-26-4/reference-source b5a4f98c87d4adf130342bc05cfa732a70056502
ln -s ../../../node_modules work/mission-26-4/reference-source/node_modules
node scripts/build-mission-26-4.mjs work/mission-26-4/reference-source work/mission-26-4/local-reference b5a4f98c87d4adf130342bc05cfa732a70056502
git worktree add --detach work/mission-26-4/local-candidate-source d162a653785d656e1a6652c4ca406889a1b55c28
ln -s ../../../node_modules work/mission-26-4/local-candidate-source/node_modules
node scripts/build-mission-26-4.mjs work/mission-26-4/local-candidate-source work/mission-26-4/local-candidate d162a653785d656e1a6652c4ca406889a1b55c28
```

Prérequis : Node compatible avec le lockfile (`npm ci`), Chromium installé en `/usr/bin/chromium`, ffmpeg/ffprobe et Python3. Aucun service payant. Les données publiques du dépôt et leur pin distant restent les mêmes.

Le builder refuse une divergence de `src`/`public` avec le SHA déclaré. Si le checkout de travail a évolué, créer aussi un worktree détaché au SHA candidat. Une nouvelle compilation avec l'instrumentation courante n'est pas présentée comme l'ancien fichier compilé : comparer les reçus et hashes. Les premiers prototypes de rig ne sont pas des reproductions exactes ; voir [early-diagnostics-limit.json](early-diagnostics-limit.json).

Pour servir un build avec le préfixe attendu (dans deux terminaux séparés) :

```sh
mkdir -p work/mission-26-4/serve-reference work/mission-26-4/serve-candidate
ln -s ../local-reference work/mission-26-4/serve-reference/endless-earth
ln -s ../local-candidate work/mission-26-4/serve-candidate/endless-earth
python3 -m http.server 5437 --directory work/mission-26-4/serve-reference
python3 -m http.server 5438 --directory work/mission-26-4/serve-candidate
```

Ne pas relancer ces commandes sur des dossiers existants en cours de capture. Dans la campagne archivée, 5434 = référence b5, 5433 = intermédiaire f4, 5435 = phase ff8, 5436 = étape30d3bc, 5439 = intermédiaire91f4f53 ; 5437/5438 = paire référence/30d3bc avec le shim climatique commun ; le build91 utilise ce même shim ; 5441 = finald162a65. Les reçus font foi.

## Tests fonctionnels et voyages

```sh
npm test
npm run build
node scripts/probe-mission-26-4-d749.mjs 5437 local-reference
node scripts/probe-mission-26-4-d749.mjs 5438 local-candidate
M262_MAX_WALL_SECONDS=7200 node scripts/traverse-mission-26-4.mjs Vallee-source-roundtrip car-80km car 5438 local-80km
node scripts/traverse-mission-26-4.mjs Vallee-stop car-40km car 5438 local-regressions
node scripts/traverse-mission-26-4.mjs Chauvigny foot-21km foot 5438 local-regressions
node scripts/traverse-mission-26-4.mjs spawn east-dense-avoid-water foot 5438 local-regressions
node scripts/traverse-mission-26-4.mjs Chauvigny-junction local-600m car 5438 local-junction
node scripts/check-mission-26-4-seams.mjs 5438
node scripts/check-mission-26-4-offroad.mjs 5438
node scripts/verify-mission-26-4-gait.mjs 5438 local-physical
```

Les commandes de coutures/hors chaussée écrivent les noms canoniques : sauvegarder le dossier de preuve avant de les réexécuter. Les longs voyages appellent la frame complète avec dt explicite≤0,25 s et les contrôleurs normaux ; ils placent seulement la station initiale déclarée, sauf Angles qui part du vrai spawn intact. L'odomètre somme chaque déplacement horizontal réel ; l'arrivée, les accès, attentes et collisions restent des critères indépendants. Les reprises de sauvegarde sont explicitement exclues du kilométrage. Le compteur du graphe n'est jamais un odomètre.

Le premier driver M26.4 n'appelait la séquence parking/marche qu'après le 40 km. Son archive est `builds/instrumentation/traverse-before-80-posttrip.mjs`. Le driver courant l'applique également au 80 km ; ne pas attribuer rétroactivement cette séquence aux anciennes exécutions.

Rivières : [bank-source-candidates.json](bank-source-candidates.json) contient la sélection actuelle de polygones classés rivière. [bank-source-candidates-initial-expanded.json](bank-source-candidates-initial-expanded.json) garde la sélection antérieure : ses indices3/4 étaient Saint-Georges/Lussac. Un indice seul sans secteur/source ne suffit pas à identifier un test.

```sh
node scripts/scan-mission-26-4-banks.mjs
node scripts/traverse-mission-26-4-river.mjs 5 5438 local-river
```

L'approche vérifie un couloir terrestre existant ; aucun droit d'accès n'est créé. Le graphe est chargé avant le lancement. La réussite≥1 km exige odomètre ET progression signée le long du suivi≥1 000 m, puis prise manuelle, récupération, débarquement et marche. Les retours/détours/reprises ne complètent jamais la progression exigée. Bathymétrie, courant et niveau sont des reconstructions de jeu, pas des mesures de sécurité nautique réelle.

Autres régressions :

```sh
node scripts/check-mission-26-4-fixture.mjs 5438
node scripts/check-mission-26-4-map-ui.mjs 5438
node scripts/record-mission-26-4-reload-corrected.mjs 5438
node scripts/check-mission-26-4-streaming-corrected.mjs 5438
```

La fixture est synthétique hors France, pas une nouvelle région géographique. Le test carte utilise un vrai DOM/worker et du tactile CDP, pas un téléphone physique. Le reload est une vraie navigation de page à une station indépendante choisie dans l'ancien trajet ; il ne prouve pas rétroactivement un reload au milieu d'un trajet déjà enregistré. Le test 503 intercepte une tuile de géométrie et vérifie attente/retry/reprise du même acteur.

## Films natifs, banc isolé et endurance

```sh
node scripts/record-mission-26-4.mjs local-reference 5437
node scripts/record-mission-26-4.mjs local-candidate 5438
node scripts/soak-mission-26-4.mjs 5438 docs/mission-26-4-evidence/local-endurance.json
```

Un seul encodeur à la fois. Les films n'utilisent ni pas manuel ni position imposée après début de prise. Les quatre vues sont chronométrées ; date/climat/seed/profil sont initialisés avant capture puis avancent normalement. Les états complets et matrices permettent de vérifier l'appariement. La cadence logicielle réelle, la durée murale et les secondes effectivement simulées sont distinctes. L'indexation WebM est une copie de codec ; les originaux sont dans `visual-regressions/raw`, les paquets vidéo ET audio et leurs PTS sont comparés. Aucun réencodage/interpolation n'améliore artificiellement le mouvement.

**Arrêter toutes les autres campagnes et les encodeurs** avant :

```sh
node scripts/benchmark-mission-26-4-cpu.mjs
node scripts/benchmark-mission-26-4.mjs local-reference 5437 8
node scripts/benchmark-mission-26-4.mjs local-candidate 5438 8
```

Le CPU vérifie l'égalité exacte du prédicat aquatique et des requêtes sur les mêmes polygones/tuiles sources, puis publie les timings bruts. Ce sous-banc ne couvre ni l'upload GPU, ni toute la préparation hydrographique. Les 21 scènes/profils du navigateur gardent sons/effets, framebuffer640×420 DPR1, sans capture. Les petits échantillons SwiftShader ne certifient ni P99 robuste, ni 60/30 FPS sur matériel, ni≤5 % si les états comparés diffèrent.

## Revue locale sur GPU matériel, non effectuée par Codex

1. Utiliser le build candidat instrumenté dans Chrome sur un GPU physique, sans les options `--use-angle=swiftshader`. Relever modèle GPU, OS, pilote, navigateur, fréquence d'écran ; pour Android, modèle, version, température et alimentation. Vérifier le renderer WebGL réel et la résolution du canvas, pas seulement la taille de fenêtre.
2. Ouvrir `/endless-earth/?perf=1&evidence=1&review=1&fixedResolution=1&spawnSeed=12345`. F8 ouvre le panneau discret ; exporter ses mesures après chaque scène. Ne pas prétendre qu'une résolution dynamique plus petite valide la cible initiale. Faire une seconde passe avec la résolution dynamique normale clairement indiquée.
3. Reprendre les mêmes scènes, date21 juin claire, profils Éco/Équilibré/Qualité, sons actifs et toutes fonctions du profil. Marcher puis courir≥180 s sur plat/pente, vues face/dos/deux profils, départ/arrêt/reprise et virages. Observer pieds, bassin, genoux, tête et caméra à vitesse normale ; noter toute vibration/glissade/penetration visible.
4. Observer les oiseaux proche/loin, caméra fixe puis mobile, perchoirs/décollage/atterrissage, sans forcer leur visibilité. Approcher/reculer lentement des arbres : feuilles sur tronc, ombre au sol, vent et seuils LOD. Répéter rivière, village et personnage/voiture avec soleil et vent changeants. Consigner shimmer, popping, flou/pixels et coût par profil.
5. Lancer le packraft par un accès réellement admis. Observer mains/pale/contact/poussée, arrêt, virage, sillage et marques d'eau. Mesurer séparément suivi réel et retour, sans placement pendant le parcours.
6. Mesurer≥60 s par scène sans encodeur (P50/P95/P99/max et longues tâches) puis≥30 min de déplacement continu avec chargements/évictions, carte et modes différents. Relever heap, buffers/objets/sons/workers, budget géographique et allocations GPU avec leurs périmètres distincts. Vérifier tactile et audio sur le téléphone réel.

Le propriétaire peut ainsi évaluer le jeu sans modifier le programme de production. Cette procédure livrée n'est pas une validation perceptive ou matérielle déjà acquise.

Le voyage final de Gartempe est `river-5-authored.json` :1 000,12m vers l’avant,909,82m de retour séparés, débarquement et2,13m à pied. Le mode de retour manuel `manual-return` est un essai conservé, pas la réussite finale : le retour automatique normal fonctionne après correction du poids de phase immuable. La reprise pendant l’activité bateau est explicitement refusée par la règle existante ; le message visible est exporté.

Le départ Angles courant attend au vrai spawn que la voiture initiale soit normalement installée, sans affecter la position. L’ancien échec1539,90m reste archivé ; il n’est pas présenté comme une correction du moteur. Les dérives de protocole et prises invalides sont listées dans `protocol-failures.json`.

Le contrôle de compatibilité du court Clain historique se rejoue par `node scripts/regress-mission-26-4-clain.mjs 5438`. Il utilise une berge fraîchement admise à moins de2m de celle de M26.3, jamais une berge injectée depuis le journal ; sa distance ne remplace pas le nouveau seuil≥1km.

La série finale `quiet-execution.json` est produite par `node scripts/run-mission-26-4-quiet.mjs` avec les références gelées sur5437/5441. Elle refuse de démarrer tant qu’un propriétaire de campagne fonctionnelle est actif. Ne lancer ni génération de rapport, ni hash global, ni autre navigateur/encodeur pendant ses mesures. La première série `isolated` est conservée mais un travail CPU documentaire s’est superposé à une partie de sa référence.

Le reçu `builds/instrumentation-provenance.json` vérifie les textes d’instrumentation par leur contenu. Dix-huit entrées de helpers d’anciens prototypes ne disposent plus d’un texte exact retrouvé ; leurs programmes compilés et hashes restent conservés. Les builds appariés, le candidat final et leurs helpers sont disponibles exactement. Une recompilation moderne de ces anciens prototypes n’est jamais présentée comme leur binaire historique.
