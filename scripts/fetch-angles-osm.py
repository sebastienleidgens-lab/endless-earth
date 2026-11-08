#!/usr/bin/env python3
"""One-time small-area OSM API bootstrap; NOT a country-scale extraction method.
For regional/national data, use licensed downloadable OSM PBF extracts.
"""
import json
import pathlib
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

# ~1.6 x 1.8 km around Angles-sur-l'Anglin; well below OSM API bbox limits.
BBOX = (0.8735, 46.6872, 0.8953, 46.7034)
URL = "https://api.openstreetmap.org/api/0.6/map?bbox=" + ",".join(map(str, BBOX))
HEADERS = {"User-Agent": "EndlessEarthResearch/0.1 (github.com/sebastienleidgens-lab/endless-earth)"}


def convert_osm_xml(raw):
    root = ET.fromstring(raw)
    if root.tag != "osm":
        raise ValueError("Expected OSM XML")
    nodes = {}
    ways = []
    tagged_nodes = []
    for el in root:
        if el.tag == "node":
            nodes[el.attrib["id"]] = [float(el.attrib["lon"]), float(el.attrib["lat"])]
            if any(tag.attrib.get("k") == "natural" and tag.attrib.get("v") == "tree" for tag in el.findall("tag")):
                tagged_nodes.append(el)
        elif el.tag == "way":
            ways.append(el)
    features = []
    for node in tagged_nodes:
        tags = {tag.attrib["k"]: tag.attrib["v"] for tag in node.findall("tag")}
        features.append({"type": "Feature", "id": "osm-node-" + node.attrib["id"],
                         "properties": {"osm_id": int(node.attrib["id"]), "source": "OpenStreetMap", **tags},
                         "geometry": {"type": "Point", "coordinates": nodes[node.attrib["id"]]}})
    for way in ways:
        tags = {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")}
        if not (tags.get("highway") or tags.get("building") or tags.get("waterway") or tags.get("natural") in ("water", "wood", "scrub") or tags.get("landuse") in ("forest", "orchard") or tags.get("leisure") == "park"):
            continue
        refs = [ref.attrib["ref"] for ref in way.findall("nd")]
        if len(refs) < 2 or any(ref not in nodes for ref in refs):
            continue
        coords = [nodes[ref] for ref in refs]
        polygon = bool(tags.get("building") or tags.get("natural") in ("water", "wood", "scrub") or tags.get("landuse") in ("forest", "orchard") or tags.get("leisure") == "park")
        if polygon:
            if len(coords) < 4 or coords[0] != coords[-1]:
                continue
        geometry = {"type": "Polygon", "coordinates": [coords]} if polygon else {"type": "LineString", "coordinates": coords}
        features.append({
            "type": "Feature",
            "id": "osm-way-" + way.attrib["id"],
            "properties": {"osm_id": int(way.attrib["id"]), "source": "OpenStreetMap", **tags},
            "geometry": geometry,
        })
    if len(features) < 5:
        raise ValueError("OSM extract contains fewer than five relevant features")
    return {"type": "FeatureCollection", "metadata": {
        "source": "© OpenStreetMap contributors", "license": "ODbL 1.0",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "bbox": BBOX, "method": "one-time OSM API bbox bootstrap",
        "warning": "Incomplete OSM tags; no authoritative elevation or building heights."
    }, "features": features}


def main():
    req = urllib.request.Request(URL, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=90) as response:
        raw = response.read(30_000_001)
    if len(raw) > 30_000_000:
        raise ValueError("OSM XML unexpectedly large")
    data = convert_osm_xml(raw)
    path = pathlib.Path("public/data/angles-osm.geojson")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Imported {len(data['features'])} verified OSM features")


if __name__ == "__main__":
    main()
