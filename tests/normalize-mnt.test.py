"""Synthetic tests of the specific WMS CRS defect, not observations of Angles."""
import importlib.util,pathlib,tempfile,json,hashlib,unittest
import numpy as np,rasterio
from pyproj import CRS
from rasterio.transform import from_origin
spec=importlib.util.spec_from_file_location('normalizer','scripts/normalize-ign-wms-mnt.py');normalizer=importlib.util.module_from_spec(spec);spec.loader.exec_module(normalizer)
class NormalizationTests(unittest.TestCase):
 def test_repair_is_lossless_and_rejects_mismatched_projection_and_source(self):
  with tempfile.TemporaryDirectory() as directory:
   root=pathlib.Path(directory);path=root/'input.tif'
   crs=CRS.from_proj4('+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +datum=WGS84 +units=m +no_defs').to_wkt().replace('PROJCRS["unknown"','PROJCRS["EPSG:2154"',1)
   a=np.arange(400,dtype='float32').reshape(20,20)/100+70
   def write(crs):
    with rasterio.open(path,'w',driver='GTiff',width=20,height=20,count=1,dtype='float32',crs=crs,transform=from_origin(538000,6624000,.5,.5),nodata=-9999) as dst:dst.write(a,1)
   write(crs)
   url='https://data.geopf.fr/wms-r?CRS=EPSG:2154&LAYERS=IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93'
   meta={'files':[{'path':'input.tif','url':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'metadata':{'systeme_planimetrique':'LAMB93','systeme_altimetrique':'IGN69'}}]}
   manifest=root/'manifest.json';manifest.write_text(json.dumps(meta));normalized=normalizer.normalize(manifest,root/'out')
   with rasterio.open(root/'out/input.tif') as ds:np.testing.assert_array_equal(ds.read(1),a);self.assertEqual(ds.crs,rasterio.crs.CRS.from_epsg(2154));self.assertEqual(ds.res,(.5,.5))
   self.assertEqual(normalized['files'][0]['raw_sha256'],meta['files'][0]['sha256'])
   meta['files'][0]['metadata']['systeme_planimetrique']='WGS84';manifest.write_text(json.dumps(meta))
   with self.assertRaises(ValueError):normalizer.normalize(manifest,root/'bad')
   meta['files'][0]['metadata']['systeme_planimetrique']='LAMB93';write(crs.replace('700000','699000'));meta['files'][0]['sha256']=hashlib.sha256(path.read_bytes()).hexdigest();manifest.write_text(json.dumps(meta))
   with self.assertRaises(ValueError):normalizer.normalize(manifest,root/'bad')
if __name__=='__main__':unittest.main()
