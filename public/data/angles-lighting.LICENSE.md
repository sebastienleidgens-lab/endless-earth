# Landscape lighting derivative — provenance and rights

These files add interpreted radiance and shadow acceleration data to the exact
Mission 14B render geometry. They do not add geographic observations, change
collision surfaces or claim measured illumination.

Underlying sources and obligations remain: IGN LiDAR HD and BD TOPO under
[Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/),
© OpenStreetMap contributors under [ODbL 1.0](https://www.openstreetmap.org/copyright).
The derived geographic database is available under ODbL 1.0, retaining IGN source
attribution and terms. Existing artistic regional geometry retains its repository
terms. See `angles-landmarks.LICENSE.md`, `angles-relief.LICENSE.md` and the source
bindings in `angles-lighting.json`.

The ambient channels are bounded artistic approximations from short triangle
rays, existing crown bounds and tree anchors. The static shadow positions are
lossless Float32 copies of existing geometry; index delta coding is lossless.
The runtime sunlight is simulated by the existing Mission 11 environment.
Canopy shadow proxies use the existing coarse crown silhouettes and wind carrier,
not new botanical or light-meter observations. No image, model or texture was
bought or acquired for Mission 14C.
