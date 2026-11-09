"""Synthetic import tests, never presented as Angles geographic observations."""
import hashlib
import importlib.util
import json
import pathlib
import tempfile
import unittest
import numpy as np
import rasterio
from rasterio.transform import from_origin
from pyproj import Transformer

spec = importlib.util.spec_from_file_location('mnt', 'scripts/import-mnt.py')
mnt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mnt)


class ImportTests(unittest.TestCase):
    def test_projection_orientation_nodata_and_atomic_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            x, y = Transformer.from_crs(4326, 2154, always_xy=True).transform(.8844, 46.6953)
            a = np.fromfunction(lambda row, col: 100 + row * .1 + col * .2, (200, 200), dtype=float).astype('float32')
            source = root / 'synthetic-MNT.tif'
            with rasterio.open(source, 'w', driver='GTiff', width=200, height=200, count=1,
                               dtype='float32', crs='EPSG:2154', transform=from_origin(x-100, y+100, 1, 1), nodata=-9999) as dst:
                dst.write(a, 1)
            meta = {'product': 'IGN LiDAR HD MNT', 'vertical_datum': 'IGN69', 'license': 'Licence Ouverte 2.0',
                    'acquired_at': 'synthetic test only', 'source_url': 'https://example.invalid/synthetic',
                    'files': [{'path': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}]}
            manifest = root / 'manifest.json'
            manifest.write_text(json.dumps(meta))
            target = root / 'grid.json'
            out = mnt.import_mnt(manifest, target, step=10, half=20)
            # Rows toward south move down the north-up raster, east moves right.
            assert out['elevations_m'][0] < out['elevations_m'][4]
            assert out['elevations_m'][0] < out['elevations_m'][20]
            first = target.read_bytes()
            mnt.import_mnt(manifest, target, step=10, half=20)
            assert target.read_bytes() == first
            meta['product'] = 'IGN LiDAR HD MNS'
            manifest.write_text(json.dumps(meta))
            with self.assertRaises(ValueError):
                mnt.import_mnt(manifest, target, step=10, half=20)
            assert target.read_bytes() == first
            meta['product'] = 'IGN LiDAR HD MNT'
            meta['files'][0]['sha256'] = 'wrong'
            manifest.write_text(json.dumps(meta))
            with self.assertRaises(ValueError):
                mnt.import_mnt(manifest, target, step=10, half=20)
            assert target.read_bytes() == first
            with rasterio.open(source, 'r+') as dst:
                dst.write(np.full_like(a, -9999), 1)
            meta['files'][0]['sha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
            manifest.write_text(json.dumps(meta))
            with self.assertRaises(ValueError):
                mnt.import_mnt(manifest, target, step=10, half=20)
            assert target.read_bytes() == first


if __name__ == '__main__':
    unittest.main()
