# Preuves reproductibles — Mission 08.6

Référence : commit `6c7cdb9f0e9bceb101aa9e196101ff8627cf820a`, servi sur le port 5178 dans un worktree détaché. Version optimisée : branche de la PR #15, port 5173. Les deux utilisent le même Chromium `/usr/bin/chromium`, Playwright 1.65.0, ANGLE/SwiftShader, et les mêmes données sources. Les mesures sont réalisées successivement, pas avec deux tests de rendu concurrents. Le navigateur local est logiciel ; aucun résultat n'est une mesure GPU matérielle.

Date figée : `2026-06-21T12:00:00Z`. Pas de changement d'heure accéléré pour raccourcir la promenade. Résolution des captures/benchmarks fixes : 800×600, mobile Éco 390×844. Audit et promenade : 640×480. Caméras et profils des stations : `before.json` / `after.json`. Le rendu synchronisé inclut `gl.finish` et `readPixels` ; la soumission CPU est mesurée séparément. Les chiffres des audits instrumentés ne sont pas interchangeables avec ceux des benchmarks non instrumentés.

Commandes, depuis la racine :

```sh
node scripts/audit-fluidity-cpu.mjs
TEST_PORT=5178 node scripts/browser-fluidity-audit.mjs before
TEST_PORT=5173 node scripts/browser-fluidity-audit.mjs after
TEST_PORT=5178 node scripts/browser-fluidity.mjs before
TEST_PORT=5173 node scripts/browser-fluidity.mjs after
node scripts/browser-fluidity-walk.mjs before
node scripts/browser-fluidity-walk.mjs after
node scripts/benchmark-fluidity.mjs
node scripts/browser-fluidity-motion.mjs before
node scripts/browser-fluidity-motion.mjs after
node scripts/experiment-fluidity.mjs
node scripts/browser-fluidity-data.mjs
node scripts/summarize-fluidity.mjs
work/geo-venv/bin/python scripts/fluidity-comparisons.py
```

Le benchmark fait trois passages par version, dans l'ordre avant/après, après/avant, avant/après, sur huit stations. Chaque distribution combine 45 rendus synchronisés (15 par passage), après installation des détails. Les temps de chargement comprennent le serveur de développement et le premier état jouable local ; ils ne simulent pas une connexion mobile distante. Les transferts de ressources sont conservés par requête. Les échecs et images lentes ne sont pas filtrés.

`walk-*/walk.json` contient chaque image depuis le démarrage, les vérifications de caméra et de graphe, puis la promenade. Le champ `autoWalk` permet de publier aussi la seule distribution en mouvement, sans effacer la distribution complète. La distance est accumulée image par image, indépendamment des échantillons de supervision à une seconde. Les fichiers peuvent être archivés `.gz` sans perte ; le script de synthèse accepte les deux formes.

`motion-*.json` mesure neuf trajectoires de caméra contrôlées, chacune en Qualité et Éco : marche lente/rapide représentée par des pas métriques, rotation, zoom, traversée/sortie de forêt, vue aérienne, transitions de cellules et retours répétés. Cette séquence suspend la boucle de simulation et mesure séparément LOD et rendu ; elle ne prétend pas produire des FPS de marche réelle. Les déplacements au clavier sont aussi exercés dans l'audit, les collisions dans les tests de sécurité, et la promenade utilise la boucle réelle. `reuse-*.json` vérifie qu'une position stabilisée ne déclenche pas de téléchargement supplémentaire, que les caches reviennent aux limites de quatre/douze cellules invisibles et que les octets géométriques restent stables. Deux collectes GC explicites, uniquement dans ce contrôle de rétention, rendent le heap de début et de fin plus comparable. Les benchmarks de rendu et les promenades ne forcent pas le GC.

`experiments.json` compare des tailles de cellules d'instances via interception temporaire du module, sans modifier les données ni le produit. Il mesure aussi le démarrage d'un Worker et des allers-retours de buffers transférables et clonés. Le heap d'un Worker n'est pas observable ici ; les champs mémoire de la page ne représentent pas sa mémoire totale.

`source-equivalence.json` conserve les empreintes des blocs produits par le code 08.5 d'origine, les ancrages complets d'arbres et la référence architecturale. Les tests vérifient cette preuve contre les fichiers livrés. `visual-equivalence.json` conserve les empreintes SHA-256 des framebuffers. `image-differences.json` quantifie les PNG hors interface ; ces masques sont une mesure auxiliaire, distincte des empreintes du framebuffer entier.
