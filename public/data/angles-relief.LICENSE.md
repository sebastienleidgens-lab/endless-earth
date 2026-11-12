# Local terrain refinement — Angles-sur-l’Anglin

Derivative of **IGN LiDAR HD MNT**, **Licence Ouverte / Open Licence 2.0**.
Attribution: IGN, acquisition 9 April 2023, edition 24 January 2025.

The single GeoTIFF used is the unchanged Mission 08.5 source tile
`LHD_FXX_0538_6624_MNT_O_0M50_LAMB93_IGN69.tif`, obtained again from the
official Géoplateforme WMS. Raw SHA-256:
`e6caa7bea6438f02b300cd5361cb9195e64540b2cf20dd2cf8ed3ddc7a96b572`.

Full URL, metadata and processing are in `angles-relief.json`. Native raster
spacing is 0.5 m; this is not an absolute positional accuracy claim. Same
local X-east/Z-south frame, Lambert-93 input and IGN69 height datum as the
existing pilot. No new point cloud, geology, cave or overhang is inferred.

The unified surface and anchored decoration overlay also derive from the
existing **© OpenStreetMap contributors, ODbL 1.0** database, IGN/ASP open
environment data, and original procedural artwork. Existing outlines,
road access rights, materials and source credits are retained. See the
parent `LICENSE.md`, original manifests and `docs/mission-14.md`.

The original 10 m surface is deliberately retained on the protected walkable
road corridors. These retained approximations and stitched boundaries are
not newly measured road surfaces or evidence of road-level survey accuracy.
