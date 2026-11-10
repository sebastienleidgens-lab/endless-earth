#!/usr/bin/env python3
"""Repair the known IGN WMS GeoTIFF CRS serialization, never reproject samples.

Only accepts the official MNT URL, a matching WFS LAMB93/IGN69 declaration,
all Lambert-93 conversion parameters, the service's exact EPSG:2154 name and
WGS84 fallback ellipsoid. Original bytes and both hashes remain auditable.
"""
import hashlib,json,pathlib,argparse

def normalize(manifest_path,output_dir):
 import rasterio
 from pyproj import CRS
 from urllib.parse import urlparse,parse_qs
 manifest_path=pathlib.Path(manifest_path);out=pathlib.Path(output_dir);out.mkdir(parents=True,exist_ok=True)
 meta=json.loads(manifest_path.read_text());records=[]
 expected=CRS(2154)
 for item in meta['files']:
  source=manifest_path.parent/item['path']
  if hashlib.sha256(source.read_bytes()).hexdigest()!=item['sha256']:raise ValueError('Raw checksum mismatch')
  url=urlparse(item['url']);query=parse_qs(url.query);m=item['metadata']
  if url.scheme!='https' or url.netloc!='data.geopf.fr' or url.path!='/wms-r' or query.get('CRS')!=['EPSG:2154'] or query.get('LAYERS')!=['IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93'] or m.get('systeme_planimetrique')!='LAMB93' or m.get('systeme_altimetrique')!='IGN69':raise ValueError('Unverified source CRS/product declaration')
  target=out/source.name
  with rasterio.open(source) as ds:
   actual=CRS(ds.crs)
   if actual!=expected:
    a=actual.coordinate_operation;b=expected.coordinate_operation
    if actual.name!='EPSG:2154' or a is None or a.method_name!=b.method_name or [(p.name,p.value,p.unit_name) for p in a.params]!=[(p.name,p.value,p.unit_name) for p in b.params] or abs(actual.ellipsoid.semi_major_metre-6378137)>1e-7 or abs(actual.ellipsoid.inverse_flattening-298.257223563)>1e-9:raise ValueError('Unexpected CRS; no repair allowed')
   if ds.count!=1 or ds.res!=(.5,.5) or ds.dtypes!=('float32',) or ds.nodata!=-9999:raise ValueError('Unexpected MNT grid')
   profile=ds.profile;profile.update(crs='EPSG:2154',compress='deflate',tiled=True,blockxsize=256,blockysize=256)
   values=ds.read()
   with rasterio.open(target,'w',**profile) as dst:dst.write(values);dst.update_tags(**ds.tags())
   with rasterio.open(target) as check:
    import numpy as np
    if not np.array_equal(values,check.read()) or ds.transform!=check.transform:raise ValueError('Normalization changed samples or grid')
   records.append({**item,'path':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'raw_sha256':item['sha256'],'raw_bytes':item['bytes'],'bytes':target.stat().st_size,'original_crs_wkt':ds.crs.to_wkt(),'crs_normalization':'WFS declares LAMB93; exact conversion parameters checked; replace invalid WMS datum serialization with EPSG:2154; no resampling'})
 meta['files']=records;(out/'mnt-manifest.json').write_text(json.dumps(meta,indent=2));return meta
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('manifest');p.add_argument('output_dir');a=p.parse_args();normalize(a.manifest,a.output_dir)
