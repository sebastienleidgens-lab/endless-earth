# ENDLESS EARTH — planetary architecture, foundation v1

## Goal
A single reusable geographic engine for Angles-sur-l'Anglin, France, Europe and eventually the planet. The current village scene is still an illustrative prototype; this document describes the intended production architecture, not completed features.

## Addressing and scale
- Global tile identity: Web Mercator z/x/y, stable across borders and dateline; zoom 0–22. Web Mercator is for indexing and distribution, **not** the final 3D coordinate reference system.
- Store geographic features with stable source IDs and provenance. Deduplicate features crossing tile boundaries, clip geometry in the offline build, and preserve continuity at tile edges.
- For local 3D rendering, use a floating origin / camera-relative coordinates to avoid floating-point jitter. High-latitude regions need special handling beyond Mercator's 85.051° cutoff.
- Dynamic tile loading, cancellation, LOD and memory budgets are next steps; the initial loader provides only bounded caching and in-flight deduplication.

## Data pipeline (offline, never per player)
1. Obtain country/region extracts (OSM PBF or other licensed data), DEM and land-cover datasets from distributable sources; record source dates and licenses.
2. Normalize roads, building footprints, rivers, forests and elevation into an intermediate geographic schema.
3. Partition by global tile IDs; precompute mesh LOD, deterministic vegetation and material variants using stable seeds.
4. Publish immutable, versioned tile bundles to object storage/CDN with a manifest. Never load all of France in a browser.
5. Validate geometry, seam continuity, attribution, file size and load time before publication.

## First milestones
- **M0:** World tile address/key/bounds utilities, test suite, bounded JSON loader (this change).
- **M1:** Convert one verified Angles extract into tiles, build a manifest and render tiles near the camera.
- **M2:** Add authoritative elevation with terrain draping, seamless edges and river alignment.
- **M3:** Stream tiles around player with LOD, memory limits, abort/cancel, profiling on Android.
- **M4:** Batch a department, then region, then country from downloadable PBF/DEM sources. Benchmark throughput and cost.

## Non-goals for M0
No claim of full France coverage, real DEM, live OSM updates, global 3D coordinates or photorealistic buildings. Tile JSON schema is provisional and should be versioned before large-scale generation.
