# Mission 12A — galerie et preuves

Ouvrir [la galerie](index.html) depuis Vite : `http://localhost:5173/endless-earth/docs/mission-12-evidence/index.html`. [Rapport et procédure locale](../mission-12.md). Les six `compare-*.jpg` peuvent être ouverts directement sur GitHub.

- `before-*.jpg`, `after-*.jpg` : huit paires réellement capturées dans le moteur, 960 × 640, Équilibré, mêmes matrices et mêmes conditions. `before.json` / `after.json` conservent stations, états effectifs et mesures. Référence Mission 11 fusionnée `83d9258`.
- `before-promenade.webm`, `after-promenade.webm` : environ 32 secondes natives, canvas WebGL et audio post-limiteur ; mouvement OSM réel, sans accélération. `after-eau.webm` : environ 18 secondes, station séparée et commandes matin → soir/pluie. Les durées de fichier incluent les fractions avant/après les images mesurées. Protocoles et chronologies dans `before-walk.json` / `after-walk.json`.
- `summary.json` : synthèse ; `performance.json.gz` : 288 mesures complètes, quatre stations, trois profils, trois passages, ordre alterné. Rendu logiciel SwiftShader avec synchronisation/readback, pas des FPS GPU matériels. Une nouvelle mesure ciblée de Qualité suit sa dernière réduction de lectures ; Éco/Équilibré sont inchangés.
- `gallery.json` : décodage des 18 images, métadonnées des trois vidéos, filtres et mise en page mobile vérifiés ; galerie ouverte dans Chromium partagé.
- `runtime.json` : retours au rendu de secours, 18 cycles de profil/météo, stabilité à 1/255 près et six cycles de vie des textures.
- `preservation.json` : données/cartographie/indices/chunks, génération végétale, navigation, architecture, audio et workflows protégés. Un seul hash de générateur change dans le manifeste des décorations ; tous ses contenus géométriques restent identiques.
- `preparation.json` : deux reconstructions offline identiques. `asset-photo.jpg`, `asset-procedural.jpg`, `asset-comparison.json` : étude de matière dans le vrai moteur, mêmes conditions. `resources.json` : consultation effective des autres bibliothèques.
- `tests.txt`, `build.txt`, `browser-compiled.txt.gz` : sorties des validations techniques ; la procédure et les résultats lisibles restent dans le rapport.

Les images ne sont pas retouchées. Les planches `compare-*.jpg` juxtaposent les deux captures originales avec un titre. Aucune illustration générée. Le mouvement a également été examiné via des planches extraites des clips, conservées dans `work/` pour ne pas multiplier les copies dans Git.

**Aucune approbation artistique humaine revendiquée. B, C et D non commencés. Aucun merge, déploiement public, changement Living Paintings / LP-01 ou workflow de production.**
