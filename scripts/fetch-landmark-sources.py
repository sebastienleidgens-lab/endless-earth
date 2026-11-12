#!/usr/bin/env python3
"""Small official WFS extracts and a COPC spatial query, never the full tile."""
import pathlib,json,urllib.request,urllib.parse,hashlib,datetime
import numpy as np
from pyproj import Transformer
from laspy.copc import CopcReader,Bounds
root=pathlib.Path('work/mission-14B/raw');root.mkdir(parents=True,exist_ok=True)
for layer in ['batiment','construction_lineaire','troncon_de_route','construction_surfacique']:
 params=dict(SERVICE='WFS',VERSION='2.0.0',REQUEST='GetFeature',TYPENAMES='BDTOPO_V3:'+layer,OUTPUTFORMAT='application/json',SRSNAME='EPSG:4326',BBOX='538080,6623550,538430,6623870,EPSG:2154',COUNT=2000)
 url='https://data.geopf.fr/wfs/ows?'+urllib.parse.urlencode(params);path=root/(layer+'.json')
 if not path.exists():
  with urllib.request.urlopen(url,timeout=90) as r:path.write_bytes(r.read())
 data=json.loads(path.read_text());assert len(data['features'])==data['numberMatched'],'Truncated WFS extraction'
 (root/(layer+'-source.json')).write_text(json.dumps({'url':url,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'license':'Licence Ouverte 2.0'},indent=2))
m=json.loads(pathlib.Path('docs/mission-08-5-sources.json').read_text())['mnt'];f=next(f for f in m['files'] if '0538_6624' in f['path']);url=f['metadata']['url_npl'];bounds=[538090,6623620,40,538335,6623815,140]
path=root/'landmark-points.npz'
if not path.exists():
 with CopcReader.open(url,http_num_threads=4) as reader:
  assert reader.header.parse_crs().to_epsg()==2154
  points=reader.query(bounds=Bounds(np.array(bounds[:3]),np.array(bounds[3:])))
  p=np.column_stack((np.asarray(points.x),np.asarray(points.y),np.asarray(points.z),np.asarray(points.classification)))
  np.savez_compressed(path,points=p);count=reader.header.point_count
else:
 p=np.load(path)['points'];count=json.loads((root/'copc-source.json').read_text())['nativePointCount']
order=np.lexsort((p[:,3],p[:,2],p[:,1],p[:,0]));ordered=p[order].astype('<f8');lon,lat=Transformer.from_crs(2154,4326,always_xy=True).transform(p[:,0],p[:,1]);local=np.column_stack(((lon-.8844)*111320*np.cos(np.radians(46.6953)),p[:,2],-(lat-46.6953)*111320,p[:,3]));np.savez_compressed(root/'local-points.npz',points=local)
record={'url':url,'boundsLambert93':bounds,'pointCount':len(p),'classes':{str(int(x)):int(n) for x,n in zip(*np.unique(p[:,3],return_counts=True))},'nativePointCount':count,'horizontalCRS':'EPSG:2154','verticalDatum':f['metadata']['systeme_altimetrique'],'license':m['license'],'acquiredAt':m['acquired_at'],'edition':m['edition'],'sortedExtractSha256':hashlib.sha256(ordered.tobytes()).hexdigest(),'method':'laspy COPC HTTP range query at full available detail, four request workers, points clipped to the stated bounds. Native point count is not the number downloaded; no transfer byte counter is claimed.'}
(root/'copc-source.json').write_text(json.dumps(record,indent=2));out=pathlib.Path('docs/mission-14-evidence/heritage');out.mkdir(parents=True,exist_ok=True);(out/'lidar-source.json').write_text(json.dumps(record,indent=2)+'\n')
selected=[]
for layer,ids in [('construction_lineaire',['CONSLINE0000000054297658']),('troncon_de_route',['TRONROUT0000000054544470'])]:
 data=json.loads((root/(layer+'.json')).read_text());selected.extend(f for f in data['features'] if f['properties']['cleabs'] in ids)
(out/'bridge-bdtopo.geojson').write_text(json.dumps({'type':'FeatureCollection','metadata':{'license':'Licence Ouverte 2.0','source':'IGN BD TOPO WFS; geometry Z is retained, point-cloud deck is the primary support source'},'features':selected},indent=2)+'\n')
print('Verified local point extract',len(p),'of native',count,'points')
