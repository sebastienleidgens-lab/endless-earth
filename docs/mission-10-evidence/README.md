# Preuves Mission 10

Base complète 09.1 : `447f891` (arbre identique à `27dcdc3`). Aucun fichier de workflow de publication modifié. Données/artefacts des anciennes missions conservés.

- `production/` : build propre `d822e27`, quatre résolutions, identité embarquée et jeu chargé ; les captures remplacent le premier aperçu de développement.
- `runtime.json` : activation clavier, aucun contexte avant action, bascules rapides, reprise, profils, douze créations/destructions, erreurs HTTP/décodage gérées. `mobile.png` : viewport 390×844, pas Android réel.
- `offline.json` : cinq rendus PCM de 42 s (le cinquième reproduit le quatrième), RMS/crête/différence d’échantillons, reproduction avec tolérance native. `spatial.json` : inversion de l’énergie stéréo après rotation, atténuation avec distance, obstruction fournie et saturation des budgets.
- Quatre fichiers Ogg et `ecoute.html` : véritables extraits d’écoute à télécharger ensemble ; le lecteur est utilisable localement ou via Vite `/endless-earth/docs/mission-10-evidence/ecoute.html`. Le visualiseur GitHub n’exécute pas le HTML. PCM intermédiaires dans `work/mission-10/renders` lors de la reproduction ; Ogg encodés à partir de ces PCM, mesures prises avant compression. Audio mixé sous CC BY-SA 4.0 ; attributions dans le lecteur et `public/audio/credits.html`.
- `performance-raw.json` / `performance-summary.json` : comparaison finale avant/après, trois passages alternés, trois stations, deux profils, son coupé/activé ; CPU processus, heap, RSS, voix/cache/chargements et tous les échantillons. Aucun rejet des extrêmes défavorables.
- `performance-initial-failed.*` : premier passage interrompu par conflit d’automation Web Audio, conservé séparément. **Ne pas le mêler à la comparaison finale.** `offline-initial-quiet.json` et `offline-level-calibration.json` : calibrations précédentes ; faible niveau puis garde-fou transitoire dépassé sans clipping.
- `loading.json` : démarrage froid, fréquence audio, buffers, huit Ogg et timings locaux (la trace contient aussi les six chargements de modules/manifeste).
- `regression/` : anciens harnais réutilisés avec nouvelle destination, 19 cas dégradés, mémoire avant/après, runtime complet, caméra et collisions. La synchronisation du test historique attend les transitions UI asynchrones.
- `walk.json` : six promenades OSM réelles de 12 m depuis le même départ ; trois paires son coupé/activé, vues troisième/première/aérienne. Ce n’est pas la promenade complète de 450 m.

## Reproduire

`npm ci`, Chromium et FFmpeg requis. `python scripts/prepare-audio.py --download` vérifie les originaux et reproduit les ressources (droits et SHA dans `public/audio/sources.json`). Pas de téléchargement ni génération pendant la partie.

Servir Mission 10 sur 5173 (`npm run dev`). Créer un worktree détaché `447f891`, y installer ou lier les dépendances, servir cette base sur 5179. Un seul navigateur/harness de mesure à la fois, sans édition des sources pendant les captures.

```sh
npm test
npm run build
node scripts/browser-audio.mjs
node scripts/browser-audio-spatial.mjs
node scripts/benchmark-audio.mjs
node scripts/profile-audio-loading.mjs
node scripts/browser-audio-walk.mjs
node scripts/browser-audio-regression.mjs
```

Les scripts injectent les sondes via Playwright, sans interface ou crochet de test ajouté au produit. Quantiles : série triée, indice `floor(n*p)` borné au dernier élément. Cache décodé compté à partir des vrais AudioBuffer, pas seulement du heap JS. RSS somme des processus Chromium : inclut des pages partagées comptées plusieurs fois. CPU navigateur partagé : inclut aussi SwiftShader, ne représente pas à lui seul le thread audio. Durée de rendu synchronisée inclut finish/readPixels ; les durées de marche en boucle réelle n’ont pas cette synchronisation explicite.

Aucune mesure GPU matériel, appareil Android physique, écoute humaine ou qualité acoustique finale validée. Les fixtures sont des contextes, pas de nouveaux lieux géographiques.
