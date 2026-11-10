# Preuves Mission 10.1

Base : `8cefef9` (fusion de #17), branche de correction séparée. Les preuves 10 et 09.1 restent historiques. Aucun workflow, jeu de données, animation ou moteur graphique modifié.

## Écouter

Télécharger le dossier et ouvrir [ecoute.html](ecoute.html), ou servir le dépôt avec Vite et visiter `/endless-earth/docs/mission-10-1-evidence/ecoute.html`. Le visualiseur GitHub ne lance pas le lecteur HTML. Un seul lecteur joue à la fois ; commencer à volume modéré. Les FLAC évitent une nouvelle compression avec perte ; la source Freesound HQ MP3 reste lossy et ne doit pas être décrite comme le WAV original.

- `before/` : cinq références Mission 10 de 35 s, dont air, bois et eau isolés. Audit des contextes réels du pilote dans `audit.json`. La marche isolant les anciennes textures utilise deux contacts par seconde, comme la démonstration corrigée.
- `after/` : village immobile et rue au sol renseigné (120 s), forêt matin et fin de journée (180 s chacun), approche d’eau (120 s), couches isolées. `demonstrations.json` conserve contexte, matériau/preuve, graines de visite déterministes, événements, positions, couches, gains natifs, transitions et signal. La trajectoire d’approche est une inspection acoustique à partir de la ligne d’eau cartographiée, pas une route de marche validée dans le lit du cours d’eau.
- `session-15min.webm`, `session-15min.json`, `session-15min-trace.json.gz` : session **réellement écoulée**, non accélérée, avec capture native en Opus. Village, 120 s de marche automatique réelle, forêt matin/soir, rivière. Code audio empreinté avant/après, budgets surveillés et nettoyage final. La capture ajoute le coût de MediaRecorder ; ses mesures ne sont pas mélangées au benchmark comparatif.
- `acoustic-analysis.json` : RMS, crête, saturation, fraction spectrale <200 Hz, secondes calmes et répétitions adjacentes mesurées. Les silences ne sont pas comptés comme des boucles. Les fichiers sont analysés à fréquence commune 16 kHz ; métriques sur PCM original et chronologies aussi dans les démonstrations. Aucune mesure de signal ne valide la qualité perceptive, l’identification d’une espèce ou le confort d’écoute.
- `spatial.json` : même phrase réelle complète (fenêtre 8 s) pour rotations, éloignement et obstruction fournie ; budgets saturés et nettoyage. La fenêtre historique de 2 s était inadaptée à des phrases de 6,5 s ; le contrôle porte maintenant sur leur durée entière.
- `selection-rejections.json` : candidats écartés pour bruits parasites déclarés, dérivation artificielle, boucle courte ou preuves de droits insuffisantes. Les captations indépendantes sont les **33 sources**, pas les 82 découpes.
- `performance-raw.json` / `performance-summary.json` : trois passages alternés, avant/après, son coupé/activé, mêmes stations, profil et adapter EarthLife, CPU préparation et audio, rendu logiciel synchronisé, CPU processus, heap/RSS, voix, cache et chargements. Tous les échantillons et extrêmes conservés.
- `production/` et `checks/` : build propre, identité Mission 10.1, quatre formats et journaux des suites exécutées.
- `regression/` : profils/modes shader réels, LOD/matrices/mémoire graphique, 19 cas dégradés, caméra et cinq obstacles pendant la marche. Les destinations historiques ne sont pas écrasées.

## Reproduire

Installer les dépendances NPM, Chromium et FFmpeg. Préparation/analyse audio : Python avec `scripts/audio-requirements.txt`. Le manifeste `public/audio/sources.json` contient les URL publiques et SHA des fichiers reçus ; `--download` reproduit l’acquisition sans compte ni paiement et refuse un changement d’empreinte.

```sh
python scripts/prepare-audio-naturalist.py --download
npm test
npm run build
```

Servir l’état courant sur 5173. Créer un worktree détaché `8cefef9` avec ses dépendances et son propre serveur sur **5189**. Ne pas modifier les sources audio pendant les captures. Un seul harnais navigateur à la fois pour les mesures comparatives.

```sh
node scripts/browser-audio-audit-101.mjs
node scripts/browser-audio-naturalist.mjs
node scripts/browser-audio-spatial.mjs
node scripts/browser-audio-soak-101.mjs
node scripts/benchmark-audio-naturalist.mjs
node scripts/browser-audio-regression-101.mjs
python scripts/analyse-audio-naturalist.py
EARTHLIFE_WAIT_WORLD=1 npm run test:build-identity
```

Ces scripts injectent leurs sondes par routage Playwright ; aucune interface de test ne fait partie du jeu. La session de quinze minutes est un test automatisé de navigateur cloud, **pas une écoute humaine**. Les performances utilisent SwiftShader logiciel, pas un GPU matériel ou un Android physique. Les quantiles sont l’indice borné `floor(n*p)` d’une série triée. Le cache décodé utilise la taille réelle des AudioBuffer ; le heap ne comprend pas toute la mémoire native et la somme RSS recompte des pages partagées. Le benchmark inclut finish/readPixels dans le rendu, pas dans le CPU de préparation.
