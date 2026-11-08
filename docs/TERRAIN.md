# Real terrain — data contract (not yet populated)

The application supports a regular grid of real-world elevations stored as `public/data/angles-terrain.json`. **No elevations have been fabricated or committed.**

Schema: `endless-earth-terrain-v1`. Fields: `origin_x_m`, `origin_z_m` (southwest/local minimum coordinates in the local frame), `step_m` (positive grid spacing), `width`, `height`, `elevations_m` (row-major absolute elevations, rows toward local +Z), `source` (required provenance), optional `vertical_datum`.

Coordinates must use the exact `toLocal` convention in `src/world/geo.ts`, where positive Z points south. The height at local (0,0) becomes the Three.js zero baseline.

**Required before activation:** obtain a licensed elevation dataset (for example an appropriate IGN elevation product), document source, resolution, coordinate reference system, vertical datum, conversion and attribution. Reproject source points into local coordinates and sample the rectangular grid. Validate cliffs and riverbanks against the actual source. Do not use arbitrary random terrain as a substitute.

The loader rejects malformed dimensions and missing provenance. The terrain mesh is only activated when a valid file is present. Until roads/buildings are correctly draped onto elevations, the app must not display them as if aligned with the terrain.
