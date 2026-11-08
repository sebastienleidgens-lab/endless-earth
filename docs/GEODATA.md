# Angles-sur-l'Anglin: geographic data pipeline

This project uses OpenStreetMap Overpass for an **initial** 900-metre radius extract of roads, building footprints, waterways and water areas. Source: © OpenStreetMap contributors, ODbL 1.0.

Run `npm run geo:fetch` with network access to create `public/data/angles-osm.geojson`. Alternatively run the **Fetch Angles OSM geography** GitHub Action manually and download its artifact. Review data and licenses before committing the generated file. Overpass availability is not guaranteed.

The runtime loads the GeoJSON if present. If missing, it uses the illustrative demonstration. OSM data does not provide authoritative terrain heights, faithful facades, or complete building heights. Real terrain and water surfaces remain separate future tasks.

The extraction does **not** automatically establish a faithful geographic simulation. Validation against IGN and field imagery is required.

## One-click import and publication

Once the geodata feature has been merged into `main`, open GitHub → Actions → **Import Angles real OSM geography** → **Run workflow** (branch `main`). The workflow fetches a small OSM extract, validates that it is nonempty, commits the GeoJSON to `main`, and triggers GitHub Pages deployment. Do not schedule frequent Overpass requests. Public Overpass servers have strict fair-use constraints; use downloaded extracts and caching for the browser game.

The browser loads assets relative to the configured Vite base path (`/endless-earth/`), not the domain root. The live OSM extract is not present until the workflow succeeds.
