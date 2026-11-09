# Lire et reproduire les preuves

- `planche-1.jpg` à `planche-3.jpg` : douze paires, mêmes caméras/profils/date, couleurs non retouchées ; réduction de taille et légendes uniquement.
- `planche-4.jpg` : pose EXIF obstruée, conservée comme diagnostic et non comme concordance photo.
- `before.json`, `after.json`, `comparison.json` : paramètres, mémoire et cinq lectures RGBA par station.
- `before-r2.json`, `after-r2.json`, `repeated-comparison.json` : seconde rotation dans l’ordre inverse, pour exposer la variabilité.
- `pass1-foret.png`, `pass1-aerienne.png` : exemples de la première passe artistique.
- `equivalence.json` : mêmes données source et mêmes 1 650 placements/échelles/racines qu’au commit de base.
- `data-validation.json` : sommets routiers/fondations et échecs contrôlés des dérivés préparés.
- `nature-cpu.json` : génération et préparation des cellules sous Node, sans rendu.
- `walk.json`, `walk-cpu.json.gz`, `walk-survey.json`, `walk-*.png` : promenade finale, trace CPU bornée comprimée sans perte et arrivée mobile. La trace inclut le démarrage et le sondage de graphe par le harnais ; elle ne doit pas être interprétée comme une trace exclusivement GPU ou exclusivement en marche.
- `network.json` : accès officiel bloqué et limites de disponibilité locale.
- `validation.json` : commandes réellement exécutées et résultats.

Reproduction depuis la racine du dépôt, avec le commit de référence disponible dans l’historique : servir un checkout isolé de `cc7cf2c` sur le port 5174 et la branche Mission 07 sur 5173. Installer les dépendances dans chaque checkout pour éviter de partager le cache d’optimisation Vite. Puis :

```sh
node scripts/browser-earth.mjs before
node scripts/browser-earth.mjs after
TEST_PORT=5173 node scripts/browser-earth.mjs after-r2
TEST_PORT=5174 node scripts/browser-earth.mjs before-r2
python scripts/earth-compare.py
python scripts/earth-boards.py
node scripts/earth-equivalence.mjs
node scripts/earth-nature-cpu.mjs
node scripts/browser-earth-data.mjs
node scripts/browser-earth-walk.mjs
python scripts/earth-pack-walk.py
```

`earth-boards.py` demande Pillow et la police DejaVu ; les captures originales sont régénérées par les deux premières commandes. Seule une sélection d’originaux rejoint le dépôt, en plus des planches couvrant toutes les vues. Les chronomètres ne sont pas accélérés. Les scripts injectent leurs commandes de pose et de mesure dans les modules servis au navigateur de test ; aucune téléportation n’est ajoutée à l’application publiée.

Les données IGN et OSM conservent leurs attributions et licences indiquées dans `public/data/LICENSE.md`. Aucune photo externe et aucun GeoTIFF brut ne sont inclus dans ces images ou fichiers. Le GPU observé est SwiftShader ; les mesures ne certifient pas la fluidité d’un téléphone réel.
