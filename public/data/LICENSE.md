# Geographic data

- `angles-terrain.json`: IGN RGE ALTI, extracted via Géoplateforme on 8 November 2026. [Licence Ouverte 2.0](https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf). Extraction date is not the acquisition date, which is not supplied by the existing grid.
- `angles-terrain-lod.bin`: derived triangulation of that same IGN grid. Same source attribution. No new measured heights.
- `angles-osm.geojson`: © OpenStreetMap contributors, extracted 8 November 2026, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Retain the attribution and make the derived database available under ODbL when redistributing it.
- `angles-landcover.png`: raster derivative of the two explicit OSM forest polygons, distributed with its source database under ODbL 1.0. Material colors are an original interpretation, not an orthophotograph. Raster spacing of 2 m is not positional accuracy.
- `angles-surface.pack` and `angles-surface.json`: compressed, triangulated partition of the OSM road emprises and IGN terrain, redistributed with both source databases and their attributions. The OSM-derived database is available under ODbL 1.0; IGN source heights retain Licence Ouverte 2.0 attribution. Width estimates and procedural material colors are interpretations, not surveyed road boundaries.
- `angles-earth.json`: checksums, offsets and provenance of these derivatives. It does not certify data availability or acquisition years beyond the supplied metadata.

Rebuild derivatives using `node scripts/prepare-earth.mjs` and `npm run geo:roads`. Do not add proprietary tiles or imagery without checking their individual rights. Application code and original procedural assets are separate from the geographic databases. See `docs/mission-07.md` in the source repository for the source audit and remaining limitations.
