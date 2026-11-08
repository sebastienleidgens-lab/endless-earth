# ENDLESS EARTH — France Alpha

A long-term browser-based 3D walking simulation of France, starting with **Angles-sur-l'Anglin** (Vienne).

> **Status: architectural prototype.** The current scenery is illustrative, **not** a faithful reconstruction of Angles-sur-l'Anglin. Real IGN/OSM roads, buildings, terrain, and river data have not yet been imported.

## Run locally

Requires Node.js 20.19+ or 22.12+ (for Vite 7).

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Build with `npm run build`.

## Controls

WASD / ZQSD / arrows: walk. Drag: rotate view. Mouse wheel: zoom. Touch joystick: bottom left on mobile. Drag elsewhere to rotate the camera. Basic collisions prevent walking through illustrative houses. Terrain, water and tree collisions are not implemented yet.

## Architecture

- `src/main.ts`: renderer, lighting, camera, basic keyboard movement.
- `src/world/geo.ts`: Angles-sur-l'Anglin anchor and local coordinate conversion.
- `src/world/demo.ts`: temporary illustrative scenery.
- `AGENTS.md`: development rules for AI agents.

## Next priorities

1. Real geospatial data pipeline and source licensing.
2. Terrain-aware paths, river and buildings.
3. Extend collisions to terrain, water and trees; add automated visual tests.
4. Tile streaming and deterministic procedural detail.

This repository is the long-lived source of truth; standalone HTML experiments are not the production architecture.

## Validation

GitHub Actions runs `npm install` and `npm run build` for pushes and pull requests. This is compilation validation, **not** a WebGL/Android runtime test.

## Geographic data import (experimental)

Run `npm run geo:fetch` with network access, or use the manual GitHub Action **Fetch Angles OSM geography** to obtain `angles-osm.geojson`. Place it at `public/data/angles-osm.geojson`. The runtime loads actual OSM road lines and building footprints if present; otherwise it shows the illustrative scene. The terrain is still flat and buildings are extruded approximations. See [docs/GEODATA.md](docs/GEODATA.md).

**Collision note:** when real OSM footprints are loaded, the avatar cannot cross the interiors of mapped buildings; road, river, cliff and terrain collision remain future work. Building clearance is approximate and not yet tested in a browser.

## Terrain preview (experimental)

A validated elevation grid can be placed at `public/data/angles-terrain.json`. Open the app with `?terrain=1` to preview terrain **without roads and buildings**, because those have not yet been draped to real elevations. Without a real grid, the demo remains illustrative. See [docs/TERRAIN.md](docs/TERRAIN.md) for the data contract and provenance requirements.

## Planetary-scale foundation

Global z/x/y tile addressing, a bounded tile cache and automated unit tests are available in `src/world/tiles.mjs` and `src/world/tile-loader.mjs`. These are not connected to the current village renderer yet. See [docs/WORLD_ARCHITECTURE.md](docs/WORLD_ARCHITECTURE.md) for the offline data pipeline, streaming, LOD and floating-origin roadmap.
