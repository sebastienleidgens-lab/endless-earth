# Revue 15A — protocole reproductible

La galerie `index.html`, les JPEG et les vidéos proviennent du vrai moteur Three.js. Les planches juxtaposent des captures sans modifier les scènes. Les images de photographies locales restent dans le dossier Mission 13 avec leurs licences ; elles sont documentaires.

## Ouvrir

Depuis le dépôt : `npm ci`, puis `npm run dev -- --port 5173`.

- Jeu : `http://localhost:5173/endless-earth/?moment=afternoon&weather=clear`
- Galerie : `http://localhost:5173/endless-earth/docs/mission-15-evidence/index.html`
- Candidat plus ajouré : ajouter `?perf=1&canopy=perforated&moment=afternoon&weather=clear` à l’URL du jeu.
- Volumes seuls : `?perf=1&canopy=volume&moment=afternoon&weather=clear`.

Les alternatives ne sont actives qu’avec le paramètre de diagnostic `perf`. Le menu ordinaire n’a pas changé. La galerie nécessite le serveur de développement, car `docs/` n’est pas copié dans le build public. Aucune publication externe n’est réalisée.

## Référence avant et séquence d’essais

Créer un checkout détaché **96a2687caf41fd8de9b778c681e7d693994093a6**, Mission 14 fusionnée, dans `work/mission15/baseline`. Installer les mêmes dépendances et le servir sur **5179**. Dans cet environnement, le checkout de référence partage `node_modules` par lien local ignoré par Git ; aucun fichier source de référence n’est modifié.

Les scripts utilisent Chromium `/usr/bin/chromium` avec **SwiftShader logiciel**, 960 × 640 et DPR 1, sauf les films 800 × 540 et le contrôle mobile 390 × 844. Aucun GPU physique disponible ni FPS Android revendiqué.

Exécuter séquentiellement, sans autre charge graphique :

```sh
node scripts/prepare-mission-15-nature.mjs
node scripts/prepare-remarkable-fixtures.mjs
npm test
npm run build
node scripts/benchmark-mission-15.mjs
node scripts/benchmark-mission-15-techniques.mjs
node scripts/browser-mission-15-captures.mjs
node scripts/browser-mission-15-checks.mjs
node scripts/browser-mission-15-motion.mjs
node scripts/audit-mission-15.mjs
python scripts/report-mission-15.py
node scripts/browser-mission-15-gallery.mjs
```

`prepare-mission-15-nature.mjs --from-export` réutilise seulement un export dont les empreintes des générateurs correspondent encore. L’export détaillé est intermédiaire dans `work/`, pas un nouveau jeu de données géographiques. La préparation des contacts et des ombres solaires statiques utilise les mêmes buffers Mission 14 ; seules les dimensions de couronnes modifient l’atténuation ambiante. Le binaire et son pack sont déterministes ; les durées du rapport ne le sont pas.

## Lire les preuves

- `captures.json` : poses, matrices, climat complet et phase de vent ; égalité vérifiée dans chaque paire.
- `performance-summary.json` / trace `.json.gz` : médiane, P95, pic, soumission, triangles, appels, textures, mémoire logique WebGL, tas JS, chargement local et streaming. 360 rendus + 24 rafraîchissements forcés des ombres.
- `techniques.json` : comparaison réelle de trois approches sur les vues boisées.
- `candidate-performance.json`, `candidate-sources.json.gz` et deux JPEG : premier candidat plus ajouré, avant optimisation. Ses sources exactes sont conservées et leurs empreintes sont vérifiées. Ce candidat n’est pas présenté comme la proposition allégée.
- `runtime.json` : même grille de collisions et mêmes déplacements avant/après, changements de profils/saisons, cache, mobile, ombres périmées/corrompues et décorations facultatives manquantes.
- `motion.json` / trace `.json.gz` : intervalles natifs, P95 et pics des films, capture comprise. Les deux observations appliquent les régimes clair/couvert/orage pendant 15 secondes chacun, sans accélération, montage ni mouvement de station. Les fichiers vidéo durent 44,633 / 44,573 s ; le remuxage ajoute les index et une durée finie, en conservant exactement les paquets VP9 et PTS/DTS (`video-index.json`).
- `flowers.json` : tous les placements décoratifs, explicitement interprétés ; aucun relevé de fleurs locales revendiqué.
- `audit.json` : fichiers protégés, ancrages, positions/indices statiques, contacts et canaux de couronne du dérivé d’éclairage.
- `hardware.json` : Chromium ordinaire identifie également SwiftShader, sans périphérique GPU physique exposé.
- `resources.json` : inventaire, origine et droits.

Les stations de forêt, de village et de fenêtre sont des inspections distinctes. Elles ne démontrent pas une liaison piétonne continue. Les limitations du pont et des pentes de Mission 14 sont conservées ; les fleurs n’ajoutent aucune collision. La revue humaine du naturel, des transitions de LOD et du plaisir sur le matériel du propriétaire reste nécessaire.
