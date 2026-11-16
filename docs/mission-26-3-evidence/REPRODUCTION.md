# Reproduire M26.3

Toutes les preuves sont locales à cette PR en brouillon. Rien n'est déployé. Depuis le dépôt : `python -m http.server 5420 --bind 127.0.0.1`, puis ouvrir `http://127.0.0.1:5420/docs/mission-26-3-evidence/index.html`. Le HTML contient sa carte et ses tableaux ; les médias et traces sont des fichiers relatifs. Un simple double clic permet aussi de consulter la galerie sans service externe. Les vidéos doivent être téléchargées avec le dossier pour une consultation hors ligne.

## Versions et données

- Programme M26.2 filmé historiquement : `58ba496050f7541a63599c28a1a553f7f0b453e9`.
- Tête de livraison M26.2 : `0e51a60a95d65dbc1dccc647dfe2a40da7493636`. Les arbres `src` et `public` sont identiques au programme précédent ; les métadonnées de rapport/build diffèrent. La nouvelle référence appariée utilise cette tête, sans correction rétroactive du programme.
- Chaque essai indique son `sourceSHA`. Les reçus `builds/` identifient les arbres et les hashes de l'instrumentation de chaque compilation. Les archives exécutables de ces builds conservent HTML, JS, CSS et workers, sans dupliquer les données publiques.
- Relief fin existant : 499 packs, 1 407 876 165 octets, source immuable `acb0a73b396229bf90731b90a558a8d5d072a9ec`. Les manifestes donnent SHA, tailles, résolution et source ; `preservation.json` inventorie les fichiers locaux et licences. Aucun pack n'a été acquis pour M26.3.

Les commandes suivantes supposent Node et Chromium/Playwright installés (`npm ci`, installation de Chromium selon l'environnement). Le profil de lancement est dans `scripts/lib/mission-26-browser.mjs`. Dans cet environnement il utilise Chromium Linux/ANGLE SwiftShader. Ce n'est pas un GPU physique ni un téléphone.

## Compilation et contrôles

```sh
npm test
npm run build
node scripts/build-mission-26-3.mjs . work/mission-26-3/reproduced
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5416 --strictPort --outDir work/mission-26-3/reproduced
```

La compilation diagnostique est séparée du bundle livré. Les hooks lisent les supports et appellent le corps entier de la frame de production. Les collisions, l'audio, les contrôleurs et le rig restent actifs. Les déplacements diagnostiques se font uniquement avant des essais indépendants ; le départ `spawn` garde le vrai joueur. Les réinstallations de sauvegardes et transitions de porte sont signalées et exclues des distances de déplacement.

Pour rejouer un SHA antérieur sans toucher au checkout courant, créer un worktree détaché de ce SHA, y rendre `node_modules` disponible et y copier les **mêmes helpers diagnostiques**. Passer son chemin et son SHA à `build-mission-26-3.mjs`. Les reçus d'archives exécutées font foi : reconstruire avec les helpers finaux ne recrée pas les anciennes versions du conducteur de preuve. Les tentatives anciennes restent des observations archivées, pas des passes attribuées au dernier build.

Pour exécuter exactement une archive, copier ses HTML/JS/CSS/worker vers un dossier de travail puis **ajouter les assets publics avec le plugin existant**, sans recompiler l’archive :

```sh
mkdir -p work/mission-26-3/frozen-replay
cp -R docs/mission-26-3-evidence/builds/candidate-guidance/. work/mission-26-3/frozen-replay/
node --input-type=module - <<'JS'
import {publicAssets} from './build/public-assets.mjs';
const assets=publicAssets();
assets.configResolved({root:process.cwd(),command:'build',build:{outDir:'work/mission-26-3/frozen-replay'}});
await assets.closeBundle();
JS
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5416 --strictPort --outDir work/mission-26-3/frozen-replay
```

Choisir le nom d’archive présent dans `builds/` correspondant au cas souhaité et contrôler son `receipt.json`. Les packs distants ne sont pas copiés ; leurs SHA restent ceux du manifeste. Les anciennes captures affichent parfois la mission26.2 dans les métadonnées HUD ; leur programme exact est celui des reçus, pas un titre de rapport remplacé après coup. Le build de livraison26.3 est contrôlé séparément. Des versions intermédiaires des anciens runners n’ont pas été committées individuellement ; les archives compilées, traces et hashes disponibles délimitent la reproductibilité, les helpers finaux ne garantissent pas une réplique bit à bit de leurs commandes.

## Parcours physiques

Utiliser un dossier de sortie **nouveau** pour conserver les échecs. Les sélections livrées sont des cibles de conduite/marche, jamais une preuve de parcours.

```sh
mkdir -p docs/mission-26-3-evidence/reproduced
M263_SELECTION=docs/mission-26-3-evidence/routes-selection.json node scripts/traverse-mission-26-3.mjs Chauvigny foot-21km foot 5416 reproduced
M263_SELECTION=docs/mission-26-3-evidence/routes-selection.json node scripts/traverse-mission-26-3.mjs spawn east-dense-avoid-water foot 5416 reproduced
M263_SELECTION=docs/mission-26-3-evidence/routes-selection.json node scripts/traverse-mission-26-3.mjs Vallee-stop car-40km car 5416 reproduced
M263_SELECTION=docs/mission-26-3-evidence/routes-selection.json node scripts/traverse-mission-26-3-replay.mjs Vallee-source-roundtrip car-80km car 5416 reproduced
node scripts/check-mission-26-3-seams.mjs 5416
node scripts/record-mission-26-3-offroad-complete.mjs 5416
node scripts/check-mission-26-3-streaming-corrected.mjs 5416
node scripts/verify-mission-26-3-gait.mjs 5416 reproduced
```

Attention : les scripts de coutures, hors chaussée et réseau réécrivent leur nom de résultat canonique ; utiliser une copie de travail/dossier de preuves pour une reproduction, conserver les fichiers de la PR. Les trajets longs appellent la frame complète avec `dt=.25`, la voiture subdivisant ce pas dans son contrôleur. Ils rendent des checkpoints, pas chaque frame. Les métriques de distance additionnent tous les déplacements horizontaux de la racine ; les traces GPS publiées sont échantillonnées. Leur polyligne ne remplace pas l'odomètre. Les champs de support donnent l'admission, propriétaire et triangle aux checkpoints ; ils ne constituent pas un enregistrement exhaustif des quatre appuis à chaque sous-pas.

Le conducteur final peut choisir un contournement piéton vérifié sur une copie ou des commandes automobiles de recul/virage testées sur une copie du même contrôleur. Ces sondes ne déplacent jamais le vrai acteur. La simulation réelle réexécute les commandes et conserve chaque refus. Les commandes de dépassement restent limitées par les tags connus, la chaussée, la coque et le trafic. Aucune permission inconnue n'est transformée en autorisation.

Les essais réseau injectent seulement une panne HTTP503 retardée sur une tuile existante. Ils retirent l'interception et utilisent le bouton normal de reprise, avec vérification que le clic n'a pas déplacé le joueur. Les tests unitaires couvrent aussi timeouts, annulation ignorée, réponses périmées, priorités et file d'installation.

## Eau

```sh
node scripts/traverse-mission-26-3-river.mjs 0 5416 reproduced
node scripts/traverse-mission-26-3-river.mjs 1 5416 reproduced
node scripts/traverse-mission-26-3-river.mjs 2 5416 reproduced
node scripts/traverse-mission-26-3-river.mjs 3 5416 reproduced
node scripts/traverse-mission-26-3-river.mjs 4 5416 reproduced
```

Les indices désignent Vauchiron, Clain/Poitiers, Vienne/Chauvigny, Vienne/Châtellerault, Creuse/La Roche-Posay. Chaque étape sépare terre admise, approche, berge, coque, composant connecté, suivi, prise manuelle, récupération par le véritable bouton et marche. Les placements avant approche sont déclarés. Les degrés de profondeur, courant et niveau sont estimés pour le jeu ; ouvrages inconnus et accès fermés restent refusés. Un composant calculé de 1 km ne suffirait pas : il faut le déplacement du contrôleur. Les traces originales avec invocation `action('recover')` inopérante ne valident pas un débarquement.

## Vidéos et performance

```sh
node scripts/record-mission-26-3.mjs reference 5417
node scripts/record-mission-26-3.mjs candidate 5416
node scripts/record-mission-26-3-car-junction-verified.mjs 5416
node scripts/record-mission-26-3-reload-corrected.mjs 5416
M262_BENCH_SECONDS=8 node scripts/benchmark-mission-26-3.mjs 5417 reference
M262_BENCH_SECONDS=8 node scripts/benchmark-mission-26-3.mjs 5416 candidate
```

Compiler le véritable worktree M26.2 sur 5417 pour la référence. Filmer **un seul encodeur à la fois**, puis fermer toutes les autres campagnes avant le benchmark. La campagne orchestrée attend leur fin. Les vidéos sont natives, canvas + mix audio stéréo existant ; aucun `step()` pendant l'enregistrement. Les quatre vues sont nommées dans la chronologie. Les captures natives récentes cadrent l'acteur entier en 800×600, avec le zoom déclaré. Certaines premières captures fonctionnelles en 640×420 coupent les pieds ; elles sont conservées comme limite, sans validation perceptive.

`raw/` contient les blobs d'origine. L'indexation WebM utilise `ffmpeg -c copy`, sans changement des images ni des timestamps. Vérifier séparément les paquets vidéo et audio avec ffprobe : les numéros de flux peuvent être renumérotés par le conteneur. L'ancienne assertion comparant leurs numéros est un échec du validateur, conservé. Un fichier vide ou un clip en erreur n'est pas une preuve valide. Le compteur de simulation additionne les dt réels ; la durée murale du film ne vaut pas 180 secondes simulées à faible cadence.

Les benchmarks utilisent 640×420 DPR1 fixe, les trois profils entiers, sons actifs, sans encodeur. Ils conservent les intervalles bruts et P50/P95/P99/max ; huit secondes donnent un petit échantillon. Un écart de lumière/phase/activité ou une erreur invalide une comparaison de non-régression. Ne pas déduire ≤5 %, 60 FPS desktop ou 30 FPS téléphone de SwiftShader. La session d'endurance conserve ses placements de stations, chargements, évictions et incidents ; elle ne prouve pas un trajet géographique continu de trente minutes.

Pour la revue perceptive propriétaire : GPU physique, résolution fixe, même seed/date/profil/caméra, pieds visibles ; exécuter les reprises marche/course plat/pente, puis les trois scènes d'oiseaux/ombres fixe et mobile. Contrôler contacts, transitions, feuillage sur troncs, approche/LOD, shimmer, pixel et phase du vent. Tant que cette revue n'est pas faite, statut perceptif **NON VALIDÉ**.

## Conservation et acquisition

```sh
node scripts/audit-mission-26-3.mjs
python scripts/summarize-mission-26-3.py
```

Aucune commande d'acquisition n'est nécessaire. Une future demande lourde doit commencer par le `--dry-run` de son script d'acquisition, publier sources/licences/octets/cache/SHA/CORS, puis respecter le périmètre autorisé. Ne pas télécharger les 499 packs au démarrage, ne pas les ajouter au bundle, ne pas lancer de merge ou de déploiement pour reproduire ces preuves.
