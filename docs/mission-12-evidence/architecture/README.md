# Preuves du Jalon B — Architecture régionale

[Galerie interactive](index.html) et [rapport de mission](../../mission-12.md).
Les images proviennent du vrai moteur Three.js, sans image générée.

- `before.json` : huit stations sur A `bb58c30`, dans un checkout distinct.
- `after.json` : mêmes matrices, date, météo, profil et résolution sur B.
- `compare-*.jpg` : six planches avant/après consultables sur GitHub.
- `after-promenade.webm` et `after-walk.json` : promenade native avec son et
  collisions ; le film avant réutilise `../after-promenade.webm` du Jalon A.
  Les deux promenades ne sont pas synchronisées image par image.
- `performance.json.gz` et `summary.json` : 288 rendus SwiftShader synchronisés,
  soit 144 paires, quatre vues, trois profils et trois passages. Les temps ne
  représentent pas des FPS sur GPU physique ou Android.
- `geometry-reference.json.gz` : empreintes des positions, normales et indices
  des 258 maillages principaux du commit A, vérifiées par les tests B.
- `preservation.json` : sources, arbres, ancrages et nature conservés.
- `buffers.json` : tailles CPU des buffers décodés et packs compressés ; la
  somme des détails possibles ne représente pas leur résidence simultanée.
- `preparation.json.gz` : durée de préparation hors ligne et vérification
  des attributs de chacun des 318 packs dérivés.
- `runtime.json` : changements de station/profil, atlas corrompu et chunks
  périmés ; `gallery.json` : médias, filtres et viewport mobile.
- `tests.txt`, `build.txt`, `browser-compiled.txt.gz` : validation de livraison.

Les captures précèdent le commit B : leur badge indique le commit A et des
modifications locales. La prévisualisation compilée est reconstruite après le
commit de livraison. Matériaux et détails sont interprétés, les hauteurs
antérieures restent estimées et les ruines illustratives restent inchangées.

Le Jalon B attend l'appréciation artistique du propriétaire. C et D ne sont pas
commencés. Aucun merge ni déploiement public.
