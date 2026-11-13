# Run with /usr/bin/python3 (GDAL, NumPy). Raw IGN raster stays in work/.
import json,math,hashlib,datetime
import numpy as np
from osgeo import gdal,osr
gdal.UseExceptions();r=gdal.Open('work/mission-17b/mnh-ign.tif');a=r.ReadAsArray();gt=r.GetGeoTransform();src=osr.SpatialReference();src.ImportFromEPSG(4326);src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER);dst=osr.SpatialReference();dst.ImportFromEPSG(2154);t=osr.CoordinateTransformation(src,dst)
cells=json.load(open('work/mission-17b/density-cells.json'));samples=[]
for p in cells:
 lon=.8844+p['x']/(111320*math.cos(math.radians(46.6953)));lat=46.6953-p['z']/111320;x,y,_=t.TransformPoint(lon,lat);col=int((x-gt[0])/gt[1]);row=int((y-gt[3])/gt[5]);v=float(a[row,col]) if 0<=row<a.shape[0] and 0<=col<a.shape[1] else -9999
 p['mnh']=round(v,2) if 0<=v<100 else None
 if p['mnh'] is not None:samples.append(v)
n=np.array(samples);result={'source':'IGN LiDAR HD MNH','url':open('work/mission-17b/mnh-url.txt').read(),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'http':200,'sha256':hashlib.sha256(open('work/mission-17b/mnh-ign.tif','rb').read()).hexdigest(),'license':'Licence Ouverte 2.0, IGN','acquisition':'2023-04-09, local tiles metadata retained from Mission 08.5','nativeResolutionM':.5,'requestedSampleM':2,'rasterSize':[r.RasterXSize,r.RasterYSize],'bbox2154':[537276,6622779,539434,6624931],'studyGridM':8,'mappedWoodSamples':len(cells),'validSamples':len(n),'woodHeightQuantilesM':dict(zip(['p50','p75','p90','p95','p99'],map(float,np.percentile(n,[50,75,90,95,99])))),'woodAbove2mFraction':float(np.mean(n>2)),'decision':'Use as a stand-level plausibility and openness reference in this milestone, not as an individual tree inventory or species map. Spring leaf-off acquisition, resampled WMS, terrain/normalization errors and temporal differences prevent interpreting every low pixel as a permanent clearing. Existing mapped exclusions remain authoritative. No new height measurements assigned to individual inferred trees.'}
try:
 import pathlib
 p=pathlib.Path('work/mission-17b/mnh-metadata.json');meta=json.loads(p.read_text());result['currentMetadata']={'url':open('work/mission-17b/mnh-metadata-url.txt').read(),'http':200,'checkedAt':datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'tiles':len(meta['features']),'acquisitionDates':sorted(set(f['properties']['date_debut_acquisition'] for f in meta['features']))}
except FileNotFoundError:pass
json.dump(result,open('docs/mission-17-evidence/forest/mnh-study.json','w'),ensure_ascii=False,indent=2);json.dump(cells,open('work/mission-17b/density-cells.json','w'));print(result['woodHeightQuantilesM'],result['woodAbove2mFraction'])
