# Preuves Mission 09.1

Références : `f11f165` (08.6), `c3f4b7c` (09), code optimisé `2712c3e` (09.1). Les commits suivants ajoutent uniquement les preuves, harnais et documentation. Les données antérieures dans `mission-09-captures` restent intactes.

- `isolation.json` : diagnostic avant modification ; deux références encadrent neuf ablations. Ne pas additionner ces écarts.
- `benchmark.json` : trois passages alternés par version, 36 rendus synchronisés par station/version, tous échantillons conservés. `screening.json` est un essai préliminaire distinct.
- `summary.json` : quantiles reconstruits depuis les traces brutes ; `numerical-report.md` : tables lisibles.
- `audit-browser-09.json`, `audit-browser-091.json`, `cpu-*.cpuprofile.gz` : audit CPU instrumenté séparé, ouverture du profil décompressé dans Chrome DevTools.
- `before.json`, `after.json`, 24 WebP et PNG : douze paires animées, caméras/temps identiques ; Équilibré ordinateur et Éco mobile. Séquences de revue artistique, pas FPS en temps réel.
- `comparaison.html` : galerie locale des WebP et vidéos. Ouvrir après téléchargement du dossier ; GitHub n’exécute pas la page HTML de son navigateur de fichiers.
- `motion-pixels.json`, `visual-equivalence.json`, planches JPEG : différences réellement rendues et inspection visuelle. Les variations de pixels n’établissent pas seules la qualité artistique.
- `runtime-validation.json` : profils, compilation sans effets, préférences, budgets, faune réelle, LOD, audio et douze démontages.
- `preparation.json` : régénération des décorations, sans changement des données préparées.
- `memory-validation.json`, `data-validation.json`, `walk-after/`, `realtime-video.json`, `production/` : audits complémentaires réussis ; le rapport précise leur protocole et leurs limites.

## Reproduction

Installer les dépendances NPM et Chromium ; Python utilise numpy/rasterio/pyproj pour les deux tests MNT, Pillow pour les planches ; FFmpeg pour les séquences. Les scripts navigateur emploient `/usr/bin/chromium` et ANGLE/SwiftShader. Créer des worktrees des deux références, avec leurs serveurs Vite et caches distincts sur 5176 (08.6), 5179 (09), puis servir 09.1 sur 5173. Ne lancer qu’un harnais navigateur à la fois.

```sh
node scripts/profile-earthlife-091.mjs
node scripts/profile-earthlife-cpu-091.mjs 09
node scripts/profile-earthlife-cpu-091.mjs 091
node scripts/browser-earthlife-091.mjs before
node scripts/browser-earthlife-091.mjs after
node scripts/benchmark-earthlife-091.mjs
node scripts/browser-earthlife-runtime-091.mjs
node scripts/browser-earthlife-walk-091.mjs after
node scripts/browser-earthlife-memory-091.mjs
node scripts/browser-earthlife-data-091.mjs
node scripts/browser-earthlife-video-091.mjs
node scripts/report-earthlife-091.mjs
python3 scripts/audit-earthlife-motion-091.py
python3 scripts/report-earthlife-details-091.py
EARTHLIFE_WAIT_WORLD=1 npm run test:build-identity
```

Les scripts de diagnostic injectent leurs sondes par routage Playwright et ne font pas partie du bundle livré. Les quantiles utilisent l’indice `floor(n*p)` dans la série triée, borné au dernier élément. Mémoire : tableaux retenus et textures source estimées, pas VRAM ou RSS. Les coûts SwiftShader incluent pilote logiciel et synchronisation ; aucun résultat matériel/Android n’est revendiqué.

Géographie et attributions dans toutes les scènes : © OpenStreetMap contributors, ODbL ; IGN / ASP, Licence Ouverte 2.0. Le vent, la météo, le courant et les oiseaux sont des simulations/interprétations artistiques ; aucune observation d’espèce ou donnée hydrologique nouvelle n’est inventée.
