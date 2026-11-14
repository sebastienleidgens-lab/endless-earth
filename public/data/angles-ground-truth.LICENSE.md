# Source-confronted terrain repairs — Mission 23

Natural-ground repair cells derive from **IGN LiDAR HD MNT**, acquisition
9 April 2023, edition 24 January 2025, **Licence Ouverte / Open Licence 2.0**.
Attribution: IGN. Native raster spacing: 0.5 m, Lambert-93 / IGN69. This is not
an absolute positional accuracy claim. Nine unchanged official GeoTIFF
payloads pinned by Mission 08.5 were reacquired. URLs, SHA-256, dates and
metadata are preserved in `docs/mission-23-evidence/mnt-sources.json`.

The repair TIN uses adaptive 1 m candidate nodes, source-confronted selection,
shared edges simplified at 0.25 m vertical residual, and original perimeter
heights. Interior corners change only when all four incident cells are
reconstructed from the native reference. Roads, mapped buildings, heritage,
water and their protected margins are excluded. No cave or overhang is
invented; unreliable preserved boundaries remain explicitly documented.

The complete surface also retains the existing **© OpenStreetMap contributors,
ODbL 1.0** road/water database and previous IGN/ASP derivatives and original
procedural artwork. Parent manifests and licenses remain applicable. Historic
terrain, refinement, OSM and landmark files are unchanged. The repair manifest
binds the exact previous surface, terrain/refinement/OSM/landmark hashes and
the reproducible repair file. Lighting and snow are artistic derivatives of
the actual repaired mesh, not new geographic observations.
