# 15B — Neige et ciel vivant

[Rapport](../../mission-15.md) · [Planche réelle](comparison.jpg) · [Galerie locale](index.html) · [Historique 15A](../index.html).

La référence est le commit 15A `62be56993d7f7ec69a45406f57d298a1885daea9`, accepté par le propriétaire avec « go ». Le jalon 15B reste soumis à son appréciation artistique. Arrêt avant 15C ; aucune fusion ou mise en ligne.

Toutes les images viennent du moteur. Les niveaux 0 / 0,18 / 0,85 des comparaisons sont diagnostiques, avec la même pose/date/soleil/phase du vent. Les couches nuageuses changent intentionnellement. Les stations du pont et de son dessous ne représentent pas un trajet continu. Les fichiers `captures.json` donnent les caméras et états complets.

Les films sont natifs, sans accélération. `snow-walk` commence à zéro et utilise le bouton AutoWalk de 30 à 110 s. `melt` amorce 0,24 par diagnostic puis laisse fondre naturellement pendant cinq minutes. `light` et `heavy` gardent un dépôt diagnostique 0,3 et inspectent les intensités 0,15 / 1. Ces quatre films enregistrent le vrai bus après limiteur. Les deux films de nuages sont des préfixes natifs de 120 s ; les observations et cinq captures espacées couvrent quatre minutes par version. Les traces contiennent les intervalles du moteur, y compris les pauses. `video-validation.json` contrôle paquets, temps, pistes et décodage.

## Reproduction

Node et les dépendances npm du dépôt sont nécessaires ; Chromium, FFmpeg et Python/Pillow pour les preuves. Aucun service payant ni nouvel actif externe.

1. Préparer un checkout propre de 15A, avec son serveur Vite sur le port 5185. Servir la branche 15B sur 5173. Les scripts attendent le préfixe `/endless-earth/`.
2. `node scripts/prepare-snow-exposure.mjs` régénère uniquement le masque d’abri. Sa répétition dans un répertoire de travail séparé doit produire les mêmes octets de manifeste et de pack.
3. `node scripts/browser-mission-15b-clouds.mjs before`, puis `after`, observent chacun quatre minutes réelles.
4. `node scripts/browser-mission-15b-captures.mjs` produit les paires ; `python3 scripts/verify-mission-15b-surfaces.py` vérifie les régions de matière retenues.
5. Exécuter séparément `node scripts/benchmark-mission-15b.mjs`, puis `node scripts/benchmark-mission-15b-alternatives.mjs`. Aucun autre navigateur ou travail graphique simultané. La seconde campagne injecte seulement ses variantes de shader dans le navigateur, sans modifier le réglage livré ; sources conservées compressées.
6. `node scripts/browser-mission-15b-runtime.mjs` compare collisions, profils, ressources, audio et erreurs de données.
7. `node scripts/browser-mission-15b-motion.mjs MODE`, avec `snow-walk`, `melt`, `light`, `heavy`, filme les observations natives.
8. `node scripts/benchmark-mission-15b-cpu.mjs` mesure le propriétaire d’atmosphère complet, boucle de rendu tenue ; `node scripts/verify-mission-15b-media.mjs` contrôle les films.
9. `npm test`, `npm run build`, puis `TEST_URL='http://localhost:5180/endless-earth/?perf=1&weather=snow&date=2026-01-21T12:00:00Z' npm run test:browser` sur le serveur preview du build. `npm run test:build-identity` contrôle l’identité compilée.
10. Les scripts `report-mission-15b.py` et `write-mission-15b-report.py` réassemblent galerie et rapport à partir des données finales.

Les tests utilisent SwiftShader logiciel, 960 × 640 DPR 1, sauf films 800 × 540 et format mobile explicités. Les résultats ne sont pas des FPS sur GPU physique ou Android. Les temps de chargement locaux sont des observations isolées, pas une mesure Internet. Les estimations d’allocations WebGL ne sont pas de la VRAM physique. Les 12 échantillons par case ne garantissent pas une borne haute statistique.

Le masque d’abri garde les licences et attributions des données IGN/OSM. Flocons, grain, géométrie et shaders sont originaux au projet. Les sons existants gardent leur catalogue et leurs licences ; aucun nouveau son de pas sur neige n’est revendiqué. Voir `audit.json` et `public/data/angles-snow-exposure.LICENSE.md`.
