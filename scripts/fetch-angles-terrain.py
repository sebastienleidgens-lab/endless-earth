#!/usr/bin/env python3
"""Offline IGN RGE ALTI sampling for Angles-sur-l'Anglin.
One-time GitHub Actions import. Never call IGN from a visitor's browser.
API reference: https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json
"""
import json
import math
import pathlib
import urllib.request
from datetime import datetime, timezone

LAT, LON = 46.6953, 0.8844
STEP = 20.0
SIZE = 101  # 2 km square, centered on the village
HALF = (SIZE - 1) // 2
CHUNK = 2000  # IGN accepts at most 5000 points per call
URL = "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json"
HEADERS = {
    "User-Agent": "EndlessEarthResearch/0.1 (github.com/sebastienleidgens-lab/endless-earth)",
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def sample_grid():
    points = []
    for row in range(SIZE):
        z = (row - HALF) * STEP
        for col in range(SIZE):
            x = (col - HALF) * STEP
            lon = LON + x / (111320 * math.cos(math.radians(LAT)))
            lat = LAT - z / 111320
            points.append((lon, lat))
    values = []
    for offset in range(0, len(points), CHUNK):
        part = points[offset:offset + CHUNK]
        body = json.dumps({
            "lon": "|".join(f"{lon:.8f}" for lon, _ in part),
            "lat": "|".join(f"{lat:.8f}" for _, lat in part),
            "resource": "ign_rge_alti_wld",
            "delimiter": "|",
            "indent": "false",
            "measures": "false",
            "zonly": "true",
        }).encode("utf-8")
        req = urllib.request.Request(URL, data=body, headers=HEADERS, method="POST")
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.load(response)
        chunk = result.get("elevations")
        if not isinstance(chunk, list) or len(chunk) != len(part):
            raise ValueError(f"IGN returned invalid batch size at {offset}")
        for height in chunk:
            if not isinstance(height, (int, float)) or not math.isfinite(height) or height <= -99900:
                raise ValueError(f"IGN returned invalid or nodata altitude at {offset}")
        values.extend(round(float(v), 2) for v in chunk)
        print(f"IGN elevations: {len(values)}/{len(points)}", flush=True)
    if max(values) - min(values) < 1:
        raise ValueError("Suspiciously flat terrain; refusing publication")
    return {
        "schema": "endless-earth-terrain-v1",
        "origin_x_m": -HALF * STEP,
        "origin_z_m": -HALF * STEP,
        "step_m": STEP,
        "width": SIZE,
        "height": SIZE,
        "elevations_m": values,
        "source": "IGN RGE ALTI via Géoplateforme altitude API",
        "vertical_datum": "IGN normal elevations (see RGE ALTI metadata)",
        "provenance": {
            "resource": "ign_rge_alti_wld",
            "license": "Licence Ouverte / Open Licence 2.0",
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "center_lat": LAT,
            "center_lon": LON,
            "sample_spacing_m": STEP,
            "min_m": min(values),
            "max_m": max(values),
        },
    }


def main():
    terrain = sample_grid()
    path = pathlib.Path("public/data/angles-terrain.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(terrain, separators=(",", ":")), encoding="utf-8")
    print(f"Saved real IGN terrain: {terrain['width']}x{terrain['height']} samples")


if __name__ == "__main__":
    main()
