# Mission 12 complète — Preuves finales

[Galerie accessible](index.html) · [Rapport complet](../../mission-12.md) ·
[ADN artistique](../../art-dna.md).

Les images et vidéos proviennent du vrai moteur. Aucune illustration générée
ne remplace une capture. Les prises précèdent le commit D ; leur badge montre
la base C et des modifications locales. La prévisualisation compilée est
reconstruite depuis le commit livré.

- `before.json` et `before-*.jpg` : Mission 11 `83d9258`, checkout distinct.
- `prior.json` et `prior-*.jpg` : C `3cd692e`, référence de l’harmonie D.
- `after.json`, `after-*.jpg`, `compare-*.jpg` : Mission 12 complète, douze vues
  à mêmes matrices, dates, météo, profil et résolution. La galerie permet de
  changer la référence entre Mission 11 et C.
- `before-promenade.webm`, `after-promenade.webm` : même parcours OSM continu de
  **450 m**, commandes ordinaires, première personne, Éco, 640 × 360, vrai son
  post-limiteur. Aucune téléportation ou accélération. Les films conservent leurs
  horodatages ; ils ne sont pas synchronisés image par image.
- `*-walk.json`, `*-walk-frames.json.gz` : positions/collisions, intervalles,
  soumission, budgets, mémoire JS après GC et inventaires de la longue marche.
  Les intervalles incluent l’enregistrement, sur SwiftShader.
- `after-vent.webm`, `after-riviere.webm`, `after-still-life.json` : deux poses
  diagnostiques compatibles avec les collisions. Ces inspections ne constituent
  pas une liaison piétonne avec le parcours de 450 m.
- `route.svg`, `route-audit.json` : carte de protocole construite depuis les
  sources et audit des classes/contact. La carte est une visualisation de données,
  pas une capture de jeu. Le parcours nord-ouest reste à plus de 200 m de l’eau
  dans l’échantillonnage ; la station de berge est distincte.
- `fixture-*.jpg`, `regional-fixtures.json` : deux terrains **synthétiques**,
  trois styles, vues larges/proches, stabilité des identités et des ressources.
  Aucune reproduction de ville réelle ou validation de toute la France.
- `performance.json.gz`, `summary.json` : 432 rendus synchronisés, quatre vues,
  trois profils, trois versions et trois passages alternés. Ce ne sont pas des
  FPS matériels ; les instantanés de heap du benchmark ne sont pas une mesure GPU.
- `families.json.gz` : sous-ensembles de rendu, non additifs et parfois couplés.
  Terrain, sols, routes et eau partagent leur surface ; les effets coupés sont
  un groupe de réglages, pas un coût hydrologique isolé.
- `zone-cycles.json` : vrai pilote déchargé/rechargé trois fois, contrôles et
  budgets conservés, registre stabilisé à 2500 ancrages, 125 géométries,
  8 textures et 10 programmes à la pose de test. Les instantanés JS après GC
  et les tailles HTTP cumulées restent dans la trace, sans les confondre avec
  une mémoire GPU mesurée ou un budget réseau du jeu compilé.
- `preservation.json` : géographie et dimensions protégées, buffers physiques
  naturels identiques à C ; leurs couleurs sont harmonisées volontairement.
- `preparation.json.gz`, `tests.txt`, `build.txt`, `browser-compiled.txt.gz`,
  `gallery.json` : préparation et validation de livraison.

Les ressources A/B/C, licences et attributions restent conservées. Le contrat
et les configurations D sont originaux, budget **0 €**. GPU physique et Android
restent à valider. Les limites du MNT à 10 m, bâtiments estimés et ruines
illustratives restent visibles.

Arrêt pour validation artistique finale du propriétaire. PR en brouillon,
aucun merge ni déploiement public.
