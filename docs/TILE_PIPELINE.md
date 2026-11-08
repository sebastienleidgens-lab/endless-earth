# Offline geographic tile builder (experimental)

Run `npm test` to check global tile indexing, caching and the offline conversion. Once a **real, verified and redistributable** GeoJSON extract exists, run:

```sh
node scripts/build-tiles.mjs public/data/angles-osm.geojson public/tiles 14
```

This writes `public/tiles/14/x/y.json` and `public/tiles/manifest.json`. The existing renderer **does not yet consume** these tiles. The pipeline is intentionally independent of Overpass and does not run on visitor devices.

**Important limitation:** this M1 prototype indexes geometries by vertex tile, not by clipping/intersection. A road crossing a tile without a vertex inside can be missing from that tile. Polygons and roads may be duplicated across tiles. Do not run at country scale until geometry clipping, antimeridian crossing, source ID reconciliation, simplification and deterministic seam handling are implemented. Tile payloads are plain GeoJSON and not yet compressed binary mesh/3D Tiles.

Do not commit source data with incompatible licenses; preserve OSM attribution and dataset provenance. The builder fails on an empty extract and never fabricates features.
