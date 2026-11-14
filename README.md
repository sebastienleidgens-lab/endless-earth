# ENDLESS EARTH — France Alpha

An exploratory Three.js walking simulation, piloting **Angles-sur-l’Anglin (Vienne)**. The normal URL uses the committed OSM extract, 921 mapped building footprints and a real IGN elevation grid sampled every 10 m. Building heights, architecture, individual trees, materials, ruin heights and weather remain largely interpreted. This is a stylized geographic pilot, not a surveyed digital twin.

Mission 18 ajoute le choix des douze mois dans le menu de promenade, des sols saisonniers et humides et l’ombre du randonneur, en conservant le calendrier solaire et les arbres de Mission 17. [Rapport, contrôles et limites](docs/mission-18.md) · [Galerie locale des douze mois](docs/mission-18-evidence/index.html). La neige reste une météo volontaire, y compris en été.

Mission 23 réconcilie le support avec le maillage rendu, affine 758 cellules naturelles à partir du MNT LiDAR HD IGN et corrige les bordures et la pose au repos. **Validation globale partielle** : sept captures originales absentes, raccords hérités encore discontinus et objectif de performance dépassé dans certaines scènes. [Rapport, preuves et limites](docs/mission-23.md) · [Galerie locale avant/après](docs/mission-23-evidence/index.html).

## Run

Node.js 20.19+ or 22.12+:

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/endless-earth/`. `npm run build` creates a production bundle locally. Production deployment is a separate GitHub workflow on `main`; mission branches and draft PRs must not deploy or merge themselves.

## Explore

WASD / ZQSD / arrows walk; Shift runs. Drag rotates the camera, wheel/pinch adjusts third-person zoom, V cycles third-person, first-person and aerial views. Mobile has a touch joystick. Automatic walking follows a validated 450 m OSM route; manual input takes control. Sound is opt-in. Quality can switch automatically to Éco or be selected manually. Time uses the real solar position; weather is explicitly simulated.

Building footprints, water, walls, access restrictions, slopes and unknown-height bridges constrain walking. A mapped bridge is **not** assumed safe without a verified deck altitude. The visible source terrain and collision sampler use the same triangulation near the player.

## Geography and provenance

- `public/data/angles-terrain.json`: real IGN RGE ALTI elevations; 2 km local extent, 201² samples, extracted 8 November 2026. Acquisition date is not supplied. The original grid is unchanged. Mission 23 adds a source-bound derivative of 758 natural cells from nine pinned IGN LiDAR HD 0.5 m MNT tiles; this is not a full-pilot centimetric survey.
- `public/data/angles-osm.geojson`: OSM extract from 8 November 2026; roads, buildings, water, two forest polygons and the castle perimeter. Incomplete land-use tags do not justify inventing agricultural parcels.
- `npm run geo:prepare`: rebuilds checked, deterministic terrain LOD indices, mapped land-cover atlas and SHA-256 manifest offline. Source files remain unchanged. The browser falls back to the exact IGN grid if prepared assets are stale or missing.
- `npm run geo:roads`: rebuilds the unified OSM road/IGN ground partition offline. It replaces overlapping road ribbons without a depth offset. Missing/stale road derivatives omit visible roads with an explicit status; navigation still uses the source paths.
- `scripts/import-mnt.py`: future, explicit MNT GeoTIFF import with projected coordinates, checksums, datum and nodata validation. Tested with a synthetic raster; download access was blocked during Mission 07; Mission 23 separately reacquires the nine official pinned tiles with `scripts/fetch-mission-23-mnt.py`.
- [Data licences and attribution](public/data/LICENSE.md) · [Mission 07.1 road correction and evidence](docs/mission-07-1.md) · [Mission 07](docs/mission-07.md) · [Mission 06](docs/mission-06.md).

The local rendering frame is metric but approximate (under 0.2% axis scale error around the pilot). Source coordinates are retained in GeoJSON. A future projection migration must transform terrain, buildings, navigation and vegetation together.

## Validate

With the dev server running:

```sh
npm test
npm run build
npm run test:browser
node scripts/browser-camera.mjs
node scripts/browser-safety.mjs
node scripts/browser-living.mjs
node scripts/browser-earth-data.mjs
node scripts/browser-roads.mjs after
node scripts/browser-road-motion.mjs after
node scripts/browser-roads-walk.mjs
npm run test:build-identity
```

Browser scripts expect `/usr/bin/chromium` and Playwright. They use SwiftShader; software timings are not hardware GPU/Android performance. The complete walk can take several minutes. The optional importer test needs a Python virtual environment with `rasterio` and `pyproj`: `python tests/import-mnt.test.py`.

The permanent HTML header identifies the running build: active mission, actual Git commit and development/production status. Vite embeds these values in the JavaScript bundle; it never queries GitHub or a version endpoint in the browser. `package.json` explicitly selects the authoritative mission report, whose title supplies the number/name; it does not guess from branches or future mission documents. Missing Git shows “Commit indisponible”; missing/inconsistent mission data shows “Mission indisponible”. Local edits show a base commit marked “modifié”. Development identity refreshes with HMR/reloads; restart the dev server after changing Git refs without editing source files. A production build refuses a metadata change detected during compilation.

The renderer remains a bounded pilot loaded as one geographic zone, with culling, terrain LOD, instanced trees and progressively prepared/cached nearby details. National geographic streaming, high-resolution banks/cliffs, verified bridge reconstruction and a calibrated castle model remain future work. The older tile modules in `src/world/tiles.mjs`, `tile-loader.mjs` and `tile-stream.mjs` are foundations, not proof of national streaming in the normal game.

Mission 07.2 adds original metric road materials and a signed shoulder-distance field on the existing unified surface. See [the material audit, 16 comparisons, motion sequences and validation](docs/mission-07-2.md). Regenerate the optional finish with `npm run geo:road-materials`; geometry and IGN/OSM source data remain unchanged. Browser evidence uses `browser-road-materials.mjs`, `browser-road-material-motion.mjs`, `browser-road-material-data.mjs` and `browser-road-material-walk.mjs`.

Mission 07.3 optimizes the road finish while retaining the unified geometry and original shoulder field. See [the controlled ablations, three-version comparisons and measured limitations](docs/mission-07-3.md). Use `npm run test:road-optimization` for current screenshots; `npm run bench:roads` compares the three versions when their reference servers are available. The measured software improvement is partial; hardware GPU/Android profiling remains necessary.

Mission 10 apporte un moteur acoustique commun aux habitats : enregistrements autorisés, fondus, pas liés au déplacement, HRTF sélective, mémoire locale et budgets. [Architecture, droits et limites](docs/mission-10.md) · [Extraits et mesures](docs/mission-10-evidence/README.md). L’écoute reste volontaire ; les textures humaines/routières des fixtures sont provisoires. `npm run test:audio:browser` produit les extraits reproductibles avec Chromium/FFmpeg. Aucun workflow de publication n’est modifié.

Mission 10.1 corrige le fond artificiel, ancre les oiseaux dans le monde et utilise de vrais contacts au sol. [Diagnostic, 33 captations autorisées, limites et validation](docs/mission-10-1.md) · [Démonstrations longues et pistes isolées](docs/mission-10-1-evidence/ecoute.html). La validation perceptive définitive reste réservée au propriétaire ; aucun succès artistique n’est déduit des seuls tests.
