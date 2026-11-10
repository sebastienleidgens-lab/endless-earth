# Real terrain — committed source and import contract

The application supports a regular grid of real-world elevations stored as `public/data/angles-terrain.json`. **The committed pilot grid contains real IGN RGE ALTI API samples, retrieved on 8 November 2026, at 10 m spacing over 2 × 2 km. No new LiDAR MNT has been imported.**

Schema: `endless-earth-terrain-v1`. Fields: `origin_x_m`, `origin_z_m` (northwest corner: local minimum X and Z, since +Z points south), `step_m` (positive grid spacing), `width`, `height`, `elevations_m` (row-major absolute elevations, rows toward local +Z), `source` (required provenance), optional `vertical_datum`.

Coordinates must use the exact `toLocal` convention in `src/world/geo.ts`, where positive Z points south. The height at local (0,0) becomes the Three.js zero baseline.

**Required before replacing the current grid:** obtain a licensed elevation dataset (for example an appropriate IGN elevation product), document source, resolution, coordinate reference system, vertical datum, conversion and attribution. Reproject source points into local coordinates and sample the rectangular grid. Validate cliffs and riverbanks against the actual source. Do not use arbitrary random terrain as a substitute.

The loader rejects malformed dimensions and missing provenance. The terrain mesh is only activated when a valid file is present. The existing unified terrain/road/water surface uses the same source triangle interpolation as collisions. Its visual water is draped on the DEM and is not a measured level. Road widths, ordinary building heights and vegetation individuals remain inferred where the source is silent. See [Mission 08](mission-08.md) and its [data request](mission-08-data-request.json) for provenance, resolution limits, and the future MNT import checks.
