#!/usr/bin/env python3
"""Offline, fail-closed import of licensed IGN MNT GeoTIFFs.

Run in a Python environment containing rasterio and pyproj. The manifest must
identify every input, its checksum, acquisition date and vertical datum. This
tool neither fetches files nor accepts MNS/DSM as terrain. Publication is manual.
"""
import argparse
import hashlib
import json
import math
import pathlib
import tempfile


def import_mnt(manifest_path, output_path, step=5, half=1000):
    import rasterio
    from pyproj import Transformer
    from contextlib import ExitStack
    manifest_path = pathlib.Path(manifest_path)
    meta = json.loads(manifest_path.read_text())
    if meta.get('product') != 'IGN LiDAR HD MNT' or meta.get('vertical_datum') != 'IGN69':
        raise ValueError('Only explicitly identified IGN LiDAR HD MNT / IGN69 is accepted; never MNS')
    if meta.get('license') != 'Licence Ouverte 2.0' or not meta.get('acquired_at') or not meta.get('source_url'):
        raise ValueError('Verified licence, acquisition date and source URL are required')
    if step <= 0 or half <= 0 or (2 * half / step) % 1 or 2 * half / step + 1 > 2048:
        raise ValueError('Invalid or excessive output grid')
    if not meta.get('files'):
        raise ValueError('No source tiles')
    # Same inverse mapping as the committed IGN API grid. Changing projection
    # for buildings alone would introduce a shift; all layers share this frame.
    transform = Transformer.from_crs('EPSG:4326', 'EPSG:2154', always_xy=True)
    with ExitStack() as stack:
        sources = []
        for item in meta['files']:
            path = manifest_path.parent / item['path']
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest != item['sha256']:
                raise ValueError('Source SHA256 mismatch')
            ds = stack.enter_context(rasterio.open(path))
            if ds.crs != rasterio.crs.CRS.from_epsg(2154) or ds.count != 1:
                raise ValueError('Expected single-band Lambert-93 MNT in metres')
            if ds.transform.a <= 0 or ds.transform.e >= 0 or ds.transform.b or ds.transform.d:
                raise ValueError('Expected north-up raster; refusing orientation ambiguity')
            sources.append(ds)
        size = int(2 * half / step) + 1
        values = []
        for row in range(size):
            z = -half + row * step
            for col in range(size):
                x = -half + col * step
                lon = .8844 + x / (111320 * math.cos(math.radians(46.6953)))
                lat = 46.6953 - z / 111320
                east, north = transform.transform(lon, lat)
                ds = next((s for s in sources if s.bounds.left <= east < s.bounds.right and s.bounds.bottom < north <= s.bounds.top), None)
                if ds is None:
                    raise ValueError(f'Uncovered source position {lon},{lat}; no interpolated fallback')
                value = next(ds.sample([(east, north)], masked=True))[0]
                if getattr(value, 'mask', False) or not math.isfinite(float(value)) or not -500 < float(value) < 9000:
                    raise ValueError('Nodata or invalid elevation; refusing partial grid')
                values.append(round(float(value), 2))
    result = {
        'schema': 'endless-earth-terrain-v1', 'origin_x_m': -half, 'origin_z_m': -half,
        'step_m': step, 'width': size, 'height': size, 'elevations_m': values,
        'source': 'IGN LiDAR HD MNT, offline Lambert-93 sampling', 'vertical_datum': 'IGN69',
        'provenance': {**meta, 'sample_spacing_m': step, 'sampling': 'nearest source pixel; no height extrapolation',
                       'horizontal_frame': 'legacy local tangent plane; same inverse as fetch-angles-terrain.py',
                       'min_m': min(values), 'max_m': max(values)}
    }
    # Atomic replacement only after the entire footprint has passed validation.
    output = pathlib.Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', dir=output.parent, delete=False) as temporary:
        json.dump(result, temporary, separators=(',', ':'), ensure_ascii=False)
        name = temporary.name
    pathlib.Path(name).replace(output)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest')
    parser.add_argument('output', help='Use work/ first; validate before replacing public/data')
    parser.add_argument('--step', type=float, default=5)
    parser.add_argument('--half', type=float, default=1000)
    args = parser.parse_args()
    result = import_mnt(args.manifest, args.output, args.step, args.half)
    print(f"Prepared {result['width']}×{result['height']} real MNT samples")
