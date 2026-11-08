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
