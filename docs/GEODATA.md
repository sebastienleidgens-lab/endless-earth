# Angles-sur-l'Anglin: geographic data pipeline

This project uses OpenStreetMap Overpass for an **initial** 900-metre radius extract of roads, building footprints, waterways and water areas. Source: © OpenStreetMap contributors, ODbL 1.0.

Run `npm run geo:fetch` with network access to create `public/data/angles-osm.geojson`. Alternatively run the **Fetch Angles OSM geography** GitHub Action manually and download its artifact. Review data and licenses before committing the generated file. Overpass availability is not guaranteed.

The runtime loads the GeoJSON if present. If missing, it uses the illustrative demonstration. OSM data does not provide authoritative terrain heights, faithful facades, or complete building heights. Real terrain and water surfaces remain separate future tasks.

The extraction does **not** automatically establish a faithful geographic simulation. Validation against IGN and field imagery is required.
