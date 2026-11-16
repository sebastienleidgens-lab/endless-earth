# Mission 26.2 — Reproduire les preuves

Exécuter depuis la racine du dépôt. La mission est **PARTIELLE** : consulter `acceptance.json` avant d'interpréter un fichier comme une réussite. Chaque essai possède son `sourceSHA`. Les anciens essais conservés ne sont pas rebaptisés « version finale ».

## Installation et contrôles

```sh
npm ci
npm test
npm run build
npm run test:mission-26-2
```

Les dépendances sont celles du verrou existant. Aucun achat, aucune publication et aucune fusion ne font partie de ces commandes. Les logs livrés dans `checks/` correspondent aux exécutions, pas à des résultats reconstitués.

## Données et téléchargement lourd

```sh
python scripts/acquire-planet-contact.py --dry-run
node scripts/audit-mission-26-1-contact.mjs
node scripts/audit-mission-26-2.mjs
node scripts/select-mission-26-2-routes.mjs
node scripts/select-mission-26-2-long.mjs
```

Le premier appel n'acquiert rien. Ne pas relancer une acquisition réelle en écrasant les sources historiques. Les 499 packs et leurs SHA sont déjà dans le dépôt. La base de téléchargement du relief est épinglée à `acb0a73b396229bf90731b90a558a8d5d072a9ec`. Les routes calculées ne sont pas des kilomètres parcourus. Les préfixes 21 km / 40,5 km et la sélection d'aller-retour sont conservés dans `routes-selection.json` avec leur méthode ; conserver ce fichier pour rejouer exactement cette sélection.

## Construire les versions exactes

Référence de programme : `d6a906cd7546a4cd8e85226efff64436e53ea200`. Candidat exécuté : voir `builds/candidate-final/receipt.json`. Les commits ultérieurs de livraison ne modifient que les scripts et documents ; contrôler ce fait dans l'audit Git.

Pour la référence, exporter ses `src`, configuration, package, verrou, `index.html` et documents avec `git archive`, installer les dépendances communes par lien vers le `node_modules` verrouillé, puis partager uniquement les assets publics dont les octets sont identiques. Extraire ses propres `navigation/land.*` et sa fixture, qui diffèrent du candidat. Copier `scripts/lib/mission-26-2-input.mjs` dans le dossier exporté : il s'agit de l'instrumentation commune, pas d'une correction du programme de référence. L'absence de `.git` dans cette exportation donne volontairement un commit HUD nul ; le SHA réel provient du reçu source, sans falsifier l'identité de build.

```sh
node scripts/build-mission-26-2.mjs . work/mission-26-2/compiled-final-evidence
node scripts/build-mission-26-2.mjs work/mission-26-2/reference work/mission-26-2/reference-compiled d6a906cd7546a4cd8e85226efff64436e53ea200
node scripts/archive-mission-26-2-build.mjs work/mission-26-2/compiled-final-evidence candidate-reproduction
```

Servir les deux dossiers avec le préfixe `/endless-earth/` (le serveur de prévisualisation Vite convient) aux ports 5401 et 5398. Les reçus archivent les HTML, JS, CSS et workers exécutés, plus les SHA du programme et des manifestes. Les grands assets sont communs et ne sont pas dupliqués par essai. Les copies de l'instrumentation utilisée sont également livrées.

## Fonctionnel et trajets

```sh
node scripts/traverse-mission-26-2.mjs spawn Vicq-return foot 5401
node scripts/traverse-mission-26-2.mjs Chauvigny foot-21km foot 5401
M262_MAX_WALL_SECONDS=600 node scripts/traverse-mission-26-2.mjs Vallee car-40km car 5401
node scripts/check-mission-26-2-access.mjs 5401
node scripts/check-mission-26-2-water.mjs 5401
node scripts/check-mission-26-2-seams.mjs 5401
node scripts/check-mission-26-2-fixture.mjs 5401
node scripts/check-mission-26-2-journeys.mjs 5401
node scripts/check-mission-26-2-map-ui.mjs 5401
```

Les petits fichiers de sélection hérités `work/mission-26-1/{run-routes,exits}.json` sont nécessaires aux scripts concernés ; leurs copies légères sont dans `inputs/`. Les restaurer à ces chemins pour une reproduction depuis un clone propre. Les captures de stations sont préparées avant chaque essai indépendant. Pendant une traversée, seuls les vecteurs d'entrée usuels pilotent le personnage ou la voiture ; les positions après collision ne sont pas réassignées. Le pas manuel appelle toute la frame de production avec `dt=0,25 s`, sous le plafond existant ; le dessin est espacé aux checkpoints. Les hooks de faune/environnement liés au rendu ne tournent donc pas à une cadence native. Ne pas utiliser ces voyages comme test de FPS, film naturel ou endurance temporelle du monde.

Une trace montre les positions 2D réellement observées, GPS, support, propriétaire, admission, tuiles, rebases et compteurs de streaming. Les anciens `position[1]` et `supportHeight` sont relatifs au datum local du pilote, même lorsqu'un champ `datum=IGN69` est présent : sans base explicitement exportée, ils ne sont pas une altitude absolue. Les nouvelles télémétries exportent cette base ; le GeoJSON de vérité reste en longitude/latitude 2D pour éviter toute ambiguïté.

Les tests d'accès ne parcourent que de petites lignes dans les polygones, et les coutures sont des bandes indépendantes. Aucun de ces tests ne certifie toute une commune. La fixture hors France est synthétique et emploie le noyau de déplacement de production ; ce n'est pas une randonnée du contrôleur complet en Vienne.

## Comparaison de performance et films natifs

Exécuter **en série**, sans autre navigateur de mesure, acquisition, compilation ou analyse lourde simultanés :

```sh
node scripts/benchmark-mission-26-2.mjs 5398 reference
node scripts/benchmark-mission-26-2.mjs 5401 candidate
node scripts/record-mission-26-2.mjs reference 5398
node scripts/record-mission-26-2.mjs candidate 5401
```

Chromium utilise SwiftShader, sans `/dev/dri`, dans la même machine distante. Framebuffer 640×420, DPR 1 ; profils éco, balanced et quality ; même graine 12345, date fixée et mêmes commandes de préparation, effets et son actifs. Les horloges d’environnement et phases de démarrage ne sont pas vérifiées identiques. Les bancs ne font pas de vidéo. Les 20 secondes demandées par cas donnent peu d'échantillons lorsque la cadence est basse : les P99 ne prouvent pas une borne robuste. Les chemins mobiles sont des émulations, pas des téléphones physiques. Ni 60 FPS ordinateur ni 30 FPS Android ne sont validés par cette machine.

Les films enregistrent le canvas et le mixage stéréo AudioContext en temps réel, sans pas manuel après le début de l'enregistrement. Le conteneur est indexé par `ffmpeg -c copy` ; les paquets vidéo, PTS et empreintes sont comparés à l'original dans `raw/`. Aucune frame interpolée ou musique n'est ajoutée. Les captures initiales sont des rendus explicites de la station préparée. Les versions peuvent ensuite diverger en distance à cause de la cadence réelle : ce ne sont pas des trajectoires pixel à pixel identiques.

## Animation, audio et mémoire

```sh
node scripts/analyze-mission-26-2-motion.mjs work/mission-26-2/reference reference 180 d6a906cd7546a4cd8e85226efff64436e53ea200
node scripts/analyze-mission-26-2-motion.mjs . candidate 180
python scripts/finalize-mission-26-2.py
```

L'analyse numérique impose la vitesse de racine sur terrain synthétique plat ou pente 15 %, à 4/8/30/60/120 Hz et cadence irrégulière. Les accélérations et jerks rapportés sont des différences de **vitesse angulaire scalaire**, pas une accélération vectorielle signée ; l'analyse fréquentielle complète reste non réalisée. Elle ne mesure ni déplacement du contrôleur ni perception humaine.

Le script de consolidation vérifie les pistes audio originales, conserve les sommes de contrôle et les métriques mesurées, construit la carte et les comparaisons à partir des JSON présents. Une piste audio ou un oiseau absent n'est pas déclaré présent par convention. Aucune écoute humaine n'est revendiquée.

La mémoire décodée, le heap JS et les miroirs CPU de buffers sont des postes différents et non additionnables sans risque de double comptage. Le budget 96 MiB ne couvre ni l'index du worker, ni les pointes de décodage, ni toute la mémoire GPU/driver/browser. Les mesures matérielles et l'endurance 30–60 min dans un contexte unique restent à valider.

## Vérifier et consulter

```sh
python -m http.server 5403 --bind 127.0.0.1 --directory docs
```

Ouvrir `/mission-26-2-evidence/index.html`. Le HTML intègre ses résultats et sa carte sans service externe ; médias et JSON restent des fichiers locaux voisins. `artifact-manifest.json` fixe leurs SHA. Les liens historiques pointent vers les dossiers M26.1 existants et ne sont pas copiés en Go. Les échecs de harnais et de programme restent dans `failed-attempts/`, explicitement distingués.

Pour reconstruire *octet pour octet le même programme identifié* après le commit documentaire final, utiliser un checkout isolé du SHA exécuté (et son contexte Git réel) ; ne pas simplement forcer une étiquette SHA sur un autre checkout. Les dossiers exportés de référence gardent volontairement un HUD Git nul. `runtime-build.json` identifie la source exportée, tandis que les bundles archivés font foi pour les octets effectivement exécutés. Les horodatages de build peuvent différer lors d'une nouvelle compilation.

```sh
git worktree add --detach work/mission-26-2/replay-candidate 58ba496050f7541a63599c28a1a553f7f0b453e9
```

Ce checkout est facultatif pour consulter les preuves. Il partage les dépendances installées via un lien local et peut partager les assets publics immuables après contrôle des SHA ; copier uniquement les dérivés de navigation et la fixture propres à la version. L'instrumentation livrée appelle le même programme, sans remplacer sa physique. `python scripts/analyze-mission-26-2-audio.py` compare aussi les paquets audio de l'original et de l'indexation, puis mesure RMS/pics/stéréo. `python scripts/report-mission-26-2.py`, `python scripts/gallery-mission-26-2.py` et `python scripts/verify-mission-26-2-evidence.py` consolident et contrôlent le dossier après la campagne.

À faible cadence native, le plafond de `dt` de production reste actif. Les résultats consolidés séparent secondes murales, horloge d’environnement et borne supérieure du temps du contrôleur. Le dt cumulé exact du contrôleur natif n’a pas été exporté et reste null ; il ne doit pas être assimilé au temps de l’environnement. Le film frontal utilise la station source `osm:way:35478466` (233,735 m), sans prolonger la route ni fabriquer une boucle de voyage ; s'il atteint son extrémité ou n'accumule pas 180 s simulées, la réussite fonctionnelle de cette épreuve n'est pas accordée. Un conteneur vidéo de 200 s n'est jamais assimilé à 180 s de course simulée naturelle.

```sh
node scripts/normalize-mission-26-2-native.mjs
```

Exécuter cette normalisation après les deux séries de films. Le script conserve les rapports tels qu'enregistrés dans `prior-cohorts/*-native-recorded.json`, corrige les anciens champs qui nommaient l'horloge d'environnement « simulation », et publie la borne `nombre de frames × 0,25 s` du contrôleur. Cette borne n'est pas une mesure exacte de dt et n'accorde jamais les 180 s de course. Les films, PTS, frames et transformations sont inchangés. La consolidation du rapport appelle également cette normalisation de manière idempotente.

Les scripts de sélection recalculent des plans généraux et peuvent remplacer les sélections de travail. Pour rejouer **les mêmes** trajets, conserver/restaurer les `routes-selection.json`, `routes-audit.json` et `inputs/` versionnés de cette livraison ; ils sont inclus dans le manifeste d'empreintes. Les préfixes et l'aller-retour retenus ne sont pas reconstruits implicitement par le simple recalcul des paires de communes.

Dans un checkout du SHA de programme antérieur au commit documentaire, copier aussi le helper de diagnostic nécessaire à l'import injecté (ce fichier est hors du programme de production et ses SHA sont dans les reçus) :

```sh
mkdir -p work/mission-26-2/replay-candidate/scripts/lib
cp docs/mission-26-2-evidence/instrumentation/lib/mission-26-2-input.mjs work/mission-26-2/replay-candidate/scripts/lib/
```

Les analyses cartographiques/audio utilisent les dépendances scientifiques déjà prévues par `scripts/planet-requirements.txt`, installées ici dans un dossier de travail ignoré par Git. Elles ne sont pas des dépendances du jeu :

```sh
python -m pip install --target work/mission-26-2/python numpy==2.5.5 pyproj==3.8.0 certifi==2026.10.23
```

Les scripts d'analyse et de consolidation recherchent d'abord ce dossier local. Aucune installation globale ni modification du verrou npm n'est nécessaire.
