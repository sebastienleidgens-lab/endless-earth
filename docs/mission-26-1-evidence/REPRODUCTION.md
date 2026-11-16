# Reproduire la Mission 26.1

Les SHA exécutés et les fichiers sont dans `builds/*/receipt.json` et `source-tree.json`. Le rapport unique est `../mission-26-1.md`. Aucune commande ci-dessous ne fusionne ou ne déploie le site. L’ouverture locale de la galerie ne nécessite aucun service externe.

## Compilation et sources

Depuis la racine du dépôt :

```sh
npm ci
npm test
npm run build
node scripts/build-mission-26-1.mjs . work/mission-26-1/compiled
npx vite preview --host 127.0.0.1 --port 5390 --outDir work/mission-26-1/compiled
```

Ouvrir `/endless-earth/?perf=1&evidence=1&fixedResolution=1&spawnSeed=12345`. Le paramètre de résolution est exclusivement un instrument de preuve. Les comparaisons enregistrent le framebuffer réel ; un viewport identique ne suffit pas.

La référence M26 est `de3958c6c55b9ef9856d5809b14ef3d41ed8e4b5`. Extraire son arbre avec `git archive` dans `work/mission-26-1/reference`, y relier `node_modules`, puis utiliser :

```sh
node scripts/build-mission-26-1.mjs work/mission-26-1/reference work/mission-26-1/reference-compiled de3958c6c55b9ef9856d5809b14ef3d41ed8e4b5
npx vite preview --host 127.0.0.1 --port 5391 --outDir work/mission-26-1/reference-compiled
```

L’instrumentation commune est archivée dans `builds/instrumentation`. Elle n’ajoute ni seconde scène ni physique de substitution. Le proxy optionnel du banc géré est dans `scripts/lib/mission-26-browser.mjs`, avec bypass localhost ; il ne devient pas une dépendance du jeu. Aucune valeur de proxy ou de secret ne doit être copiée dans les preuves.

## Intégrité, relief et préservation

```sh
python scripts/acquire-planet-contact.py --dry-run
node scripts/audit-mission-26-1-contact.mjs
node scripts/audit-mission-26-1-routes.mjs
python scripts/audit-mission-26-1-preservation.py
```

Les 499 packs sont déjà versionnés : l’audit n’a pas besoin de les acquérir de nouveau. La première commande affiche le plafond de transfert avant une acquisition volumineuse. Les originaux locaux ne sont pas écrasés sans validation de leurs reçus ; les transferts invalides sont conservés à part. L’environnement scientifique utilise Python système et les dépendances de `scripts/planet-requirements.txt`.

## Contrôleur et inspections

```sh
node scripts/find-mission-26-1-exits.mjs
node scripts/test-mission-26-1-seams.mjs 5390
node scripts/test-mission-26-1-departure.mjs osm:way:647696741 angles-west-final.json 5390
node scripts/check-mission-26-1-water.mjs 5390
node scripts/check-mission-26-1-journeys.mjs 5390
node scripts/check-mission-26-1-map-ui.mjs 5390
node scripts/check-mission-26-1-origin.mjs eco docs/mission-26-1-evidence/origin-eco.json 5390
```

Rejouer l’origine aussi en `balanced` et `quality`. Le contrôle de sortie utilise le vrai noyau grounded, accéléré, sans affectation de position pendant la traversée. Les sondes de couture sont des placements indépendants avant chaque passage de six mètres. L’inspection des trois rivières est un placement diagnostique, jamais un parcours nautique. Un résultat `completed:false` demeure un échec même si le programme sort avec le code 0.

## Films et benchmark

```sh
node scripts/capture-mission-26-1.mjs 5391 reference stills,run-flat,run-terrain,shadows,birds,startup
node scripts/capture-mission-26-1.mjs 5390 candidate stills,run-flat,run-terrain,shadows,birds,startup,soak,rebases
node scripts/capture-mission-26-1.mjs 5390 candidate-final run-flat left 220
node scripts/capture-mission-26-1.mjs 5390 candidate-final run-terrain front,right 220
node scripts/capture-mission-26-1.mjs 5390 candidate-final boat
node scripts/capture-mission-26-1-departure.mjs 5390
```

Le dernier script attend le vrai départ seedé, prépare une route depuis la trace du contrôleur, puis ne donne que des entrées de déplacement. Aucun placement ni réparation de position pendant le voyage. Il garde un arrêt contrôlé en cas de non-progression et une limite d’observation native de 45 minutes. Ce plafond ne transforme pas un parcours incomplet en réussite.

Les petites routes de course sont suffisantes pour les prises SwiftShader réalisées. Sur un GPU plus rapide, l’extrémité ou un virage peut interrompre la course avant 180 s. Le résultat doit alors rester un échec : choisir un autre long segment public vérifié, sans ralentir artificiellement le jeu ni modifier le film. Le runtime conserve son plafond normal de dt de 0,25 s.

Pour le benchmark, fermer toutes les autres campagnes de jeu, captures et compilations lourdes :

```sh
node scripts/benchmark-mission-26-1.mjs 5390 candidate
node scripts/benchmark-mission-26-1.mjs 5391 reference
```

L’option finale `boat-only` conserve les cas terrestres antérieurs et rejoue bateau/carte après les correctifs, avec source exacte dans chaque cas. Ne pas attribuer les anciens chiffres au nouveau commit. Le shader du sillage de la référence M26 est conservé cassé ; ses mesures de bateau ne passent pas un contrôle à effets équivalents.

## Consolidation locale

```sh
python scripts/analyze-mission-26-1-native.py
python scripts/audit-mission-26-1-audio.py
/usr/bin/python3 scripts/plot-mission-26-1.py
python scripts/report-mission-26-1.py
python scripts/gallery-mission-26-1.py
```

Les scripts lisent les fichiers présents et refusent les liens inventés. Les traces géographiques et transformations sont compressées sans perte. L’indexation WebM utilise une copie de codecs ; les paquets vidéo et audio et leurs timestamps sont comparés aux originaux. L’extension de timer GPU disponible n’est pas assimilée à une mesure de GPU physique.

Pour ouvrir la galerie sans publier : ouvrir `index.html` directement, ou servir localement ce répertoire avec `python -m http.server --bind 127.0.0.1 --directory docs 5396`.

Avec ce serveur local, ouvrir `http://localhost:5396/mission-26-1-evidence/index.html` ; servir `docs` permet aussi d’ouvrir les rapports parents.
