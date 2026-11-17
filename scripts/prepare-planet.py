"""Deterministic, tile/sector/department open-data compiler (offline only).

PYTHONPATH=work/mission-26/python python scripts/prepare-planet.py --dry-run
... --resume | --tile 142:1538 | --sector xmin,ymin,xmax,ymax
The raw OSM database, caches and DEM are never copied to public/.
"""
import argparse, gzip, hashlib, json, math, sys, time
from collections import Counter, defaultdict
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work/mission-26/python'))
import numpy as np
import osmium
from shapely import prepare
from pyproj import Transformer
from shapely.geometry import shape, box, Polygon, LineString, Point, mapping
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree

p=argparse.ArgumentParser();p.add_argument('--dry-run',action='store_true');p.add_argument('--resume',action='store_true');p.add_argument('--tile');p.add_argument('--sector');p.add_argument('--cache',default='work/mission-26/sources');p.add_argument('--out',default='public/planet/fr-86');p.add_argument('--max-mib',type=int,default=96);a=p.parse_args()
cache=Path(a.cache);out=Path(a.out);SIZE=4096;STEP=128;VERSION='planet-compiler-1.0.0';project=Transformer.from_crs(4326,2154,always_xy=True).transform;inverse=Transformer.from_crs(2154,4326,always_xy=True).transform
def encode(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'),sort_keys=True,allow_nan=False).encode()
def digest(b):return hashlib.sha256(b).hexdigest()
admin_file=cache/'communes-86.json';admin=json.loads(admin_file.read_text());geos=[transform(project,shape(f['geometry'])) for f in admin['features']];boundary=unary_union(geos);xmin,ymin,xmax,ymax=boundary.bounds
prepare(boundary)
tiles=[]
for y in range(math.floor(ymin/SIZE),math.floor(ymax/SIZE)+1):
 for x in range(math.floor(xmin/SIZE),math.floor(xmax/SIZE)+1):
  bounds=[x*SIZE,y*SIZE,(x+1)*SIZE,(y+1)*SIZE];area=boundary.intersection(box(*bounds)).area
  if area>1e-6:tiles.append(dict(id=f'{x}:{y}',x=x,y=y,bounds=bounds,coverageM2=round(area,4)))
plan=dict(region='FR-86',communes=len(admin['features']),areaM2=boundary.area,expectedTiles=len(tiles),tileSize=SIZE,sampleStep=STEP,source='IGN RGE ALTI 128 m sampling; OSM France departmental extract',output=str(out))
print('PLAN',json.dumps(plan),flush=True)
if a.dry_run:raise SystemExit()
out.mkdir(parents=True,exist_ok=True);(out/'tiles').mkdir(exist_ok=True)
source_records=json.loads((cache/'acquisition.json').read_text());osm_file=cache/'vienne.osm.pbf';osm_sha=digest(osm_file.read_bytes());feature_cache=cache/'features-projected-v1.json.gz'
tags_keep={'name','ref','highway','railway','waterway','water','natural','landuse','building','building:levels','height','min_height','roof:shape','roof:material','access','foot','vehicle','motor_vehicle','oneway','oneway:foot','maxspeed','width','lanes','surface','bridge','tunnel','layer','barrier','aeroway','aerodrome:type','iata','icao','service','junction','construction','proposed','disused','abandoned','electrified','gauge','usage','boat','seasonal','intermittent','leaf_type','leaf_cycle'}
def kind(tags):
 if tags.get('building'):return 'building'
 if tags.get('highway'):return 'road'
 if tags.get('railway'):return 'rail'
 if tags.get('aeroway'):return 'aviation'
 if tags.get('waterway') or tags.get('water') or tags.get('natural')=='water':return 'hydro'
 if tags.get('barrier'):return 'barrier'
 if tags.get('natural') or tags.get('landuse'):return 'landcover'
 return None
features=[];shapes=[];counter=Counter();lengths=defaultdict(float)
def append_feature(identifier,tags,coords,polygon=False,nodes=None,holes=None):
 if len(coords)<(3 if polygon else 1):return
 x,y=project([q[0] for q in coords],[q[1] for q in coords]);points=[[round(xx,3),round(yy,3)] for xx,yy in zip(x,y)]
 geometry=Polygon(points) if polygon else LineString(points) if len(points)>1 else Point(points[0])
 if geometry.is_empty or not boundary.intersects(geometry):return
 if not geometry.is_valid:geometry=geometry.buffer(0) if polygon else geometry
 if geometry.is_empty:return
 f={'id':identifier,'kind':kind(tags),'tags':tags,'points':points,'polygon':polygon}
 if nodes:f['nodes']=nodes
 if holes:
  rings=[]
  for ring in holes:
   hx,hy=project([q[0] for q in ring],[q[1] for q in ring]);rings.append([[round(xx,3),round(yy,3)] for xx,yy in zip(hx,hy)])
  f['holes']=rings;geometry=Polygon(points,rings)
 features.append(f);shapes.append(geometry);counter[f['kind']]+=1
 if not polygon and len(points)>1:lengths[f['kind']]+=geometry.length if boundary.contains(geometry) else geometry.intersection(boundary).length
 if len(features)%25000==0:print('IMPORTED',len(features),dict(counter),flush=True)

if feature_cache.exists():
 loaded=json.loads(gzip.decompress(feature_cache.read_bytes()))
 if loaded.get('sourceSha256')==osm_sha:
  features=loaded['features'];shapes=[Polygon(f['points'],f.get('holes')) if f['polygon'] else LineString(f['points']) if len(f['points'])>1 else Point(f['points'][0]) for f in features];counter=Counter(f['kind'] for f in features)
  for f,g in zip(features,shapes):
   if not f['polygon'] and len(f['points'])>1:lengths[f['kind']]+=g.length if boundary.contains(g) else g.intersection(boundary).length
if not features:
 class Handler(osmium.SimpleHandler):
  def node(self,n):
   t={t.k:t.v for t in n.tags if t.k in tags_keep}
   if t.get('railway') not in ['station','halt'] and t.get('aeroway') not in ['aerodrome','helipad']:return
   append_feature(f'osm:node:{n.id}',t,[[n.location.lon,n.location.lat]])
  def way(self,w):
   t={t.k:t.v for t in w.tags if t.k in tags_keep}
   if not kind(t):return
   coords=[[n.lon,n.lat] for n in w.nodes if n.location.valid()]
   if len(coords)!=len(w.nodes):return
   polygon=w.is_closed() and kind(t) in ['building','landcover','hydro','aviation'] and len(coords)>3
   append_feature(f'osm:way:{w.id}',t,coords,polygon,[str(n.ref) for n in w.nodes] if not polygon else None)
  def area(self,area):
   if area.from_way():return
   t={t.k:t.v for t in area.tags if t.k in tags_keep}
   if not kind(t):return
   for i,outer in enumerate(area.outer_rings()):
    coords=[[n.lon,n.lat] for n in outer];holes=[[[n.lon,n.lat] for n in ring] for ring in area.inner_rings(outer)]
    append_feature(f'osm:relation:{area.orig_id()}:{i}',t,coords,True,holes=holes)
 Handler().apply_file(str(osm_file),locations=True,idx='flex_mem')
 feature_cache.write_bytes(gzip.compress(encode({'sourceSha256':osm_sha,'features':features}),mtime=0))
print('FEATURES',dict(counter),'SOURCE_KM',{k:round(v/1000,3) for k,v in lengths.items()},flush=True)
grid_file=cache/f'ign-{STEP}m.json'
if not grid_file.exists():raise SystemExit('IGN lattice not complete; raw feature cache retained. Resume after acquisition.')
grid=json.loads(grid_file.read_text());assert grid['projection']=='EPSG:2154';heights=np.asarray(grid['elevations']).reshape(grid['height'],grid['width']);assert len(grid['elevations'])==grid['height']*grid['width']
tree=STRtree(shapes);entries=[];source_hashes={'admin':digest(admin_file.read_bytes()),'osm':osm_sha,'elevation':digest(grid_file.read_bytes())};total_bytes=0;nodata=0
for i,t in enumerate(tiles):
 file=out/'tiles'/f'{t["x"]}-{t["y"]}.tile';selected=not a.tile or a.tile==t['id']
 if a.sector:selected=selected and box(*map(float,a.sector.split(','))).intersects(box(*t['bounds']))
 def existing():
  b=file.read_bytes();raw=gzip.decompress(b);obj=json.loads(raw)
  if obj.get('sources')!=source_hashes:raise ValueError('Stale tile: '+t['id'])
  return dict(t,url='tiles/'+file.name,sha256=digest(b),bytes=len(b),decodedBytes=len(raw),quality='sampled-128m-IGN69 / OSM / inferred heights')
 if (not selected or a.resume) and file.exists():entry=existing()
 elif not selected:continue
 else:
  n=SIZE//STEP+1;ox=int((t['bounds'][0]-grid['origin'][0])/STEP);oy=int((t['bounds'][1]-grid['origin'][1])/STEP);z=heights[oy:oy+n,ox:ox+n]
  if z.shape!=(n,n) or not np.isfinite(z).all():raise ValueError('Missing terrain support in '+t['id'])
  ids=tree.query(box(*t['bounds']),predicate='intersects');data={'schema':'planet-tile-v1','id':t['id'],'bounds':t['bounds'],'sources':source_hashes,'grid':{'size':n,'step':STEP,'datum':'IGN69','heights':z.flatten().tolist()},'features':sorted([features[int(k)] for k in ids],key=lambda f:f['id'])}
  raw=encode(data);b=gzip.compress(raw,mtime=0);file.write_bytes(b);entry=dict(t,url='tiles/'+file.name,sha256=digest(b),bytes=len(b),decodedBytes=len(raw),quality='sampled-128m-IGN69 / OSM / inferred heights')
 entries.append(entry);total_bytes+=entry['bytes']
 if total_bytes>a.max_mib*1024*1024:raise ValueError('Distributed tile budget exceeded; do not publish an oversized manifest')
 if i%25==0:print('TILES',i+1,'/',len(tiles),'MiB',round(total_bytes/1048576,2),flush=True)
communes=[]
for f,g in zip(admin['features'],geos):
 center=g.representative_point();lon,lat=inverse(center.x,center.y);communes.append({'code':f['properties']['code'],'name':f['properties']['nom'],'lon':round(lon,7),'lat':round(lat,7)})
coverage=sum(t['coverageM2'] for t in entries);sources={
 'admin':{'source':'API Geo / IGN administrative contours, 265 communes returned; not a locally audited COG release','url':source_records['communes-86.json']['url'],'license':'Licence Ouverte 2.0','sha256':source_hashes['admin'],'retrievedAt':source_records['communes-86.json']['retrievedAt'],'precisionM':None,'confidence':'medium','inferred':False},
 'elevation':{'source':grid['source'],'url':grid['url'],'license':grid['license'],'sha256':source_hashes['elevation'],'retrievedAt':grid['batches'][-1]['retrievedAt'],'precisionM':STEP,'confidence':'medium','inferred':False,'verticalDatum':'IGN69','sampling':'128 m lattice; mesh interpolation is inferred between samples; no new LiDAR-HD coverage asserted'},
 'osm':{'source':'OpenStreetMap France Vienne extract','url':source_records[osm_file.name]['url'],'license':'ODbL 1.0','sha256':osm_sha,'retrievedAt':source_records[osm_file.name]['retrievedAt'],'precisionM':None,'confidence':'medium','inferred':False}}
manifest={'schema':'planet-region-v1','id':'FR-86','name':'Vienne','compiler':VERSION,'projection':{'type':'lambert93','code':'EPSG:2154'},'verticalDatum':'IGN69','tileSize':SIZE,'sampleStep':STEP,'bounds':[xmin,ymin,xmax,ymax],'boundary':mapping(transform(inverse,boundary.simplify(15,preserve_topology=True))),'communes':sorted(communes,key=lambda c:c['code']),'tiles':entries,'sources':sources,'accessDefaults':{'publicRoadClasses':True,'unknownLand':'blocked','unknownBridge':'blocked','unknownWaterClearance':'blocked'},'coverage':{'areaM2':round(boundary.area,4),'preparedM2':round(coverage,4),'fraction':min(1,coverage/boundary.area),'nodata':nodata},'budgets':{'maxResidentTiles':16,'decodedTileBytes':33554432,'concurrentRequests':2,'rawSourceBytesInBrowser':0},'limitations':['Terrain sampled at 128 m, not native 0.5 m LiDAR.','OSM completeness and vertical structures unverified; buildings use tagged or inferred heights.','Water polygons do not supply surveyed depth or bridge clearance.','Administrative coverage is distinct from playable network continuity.']}
(out/'manifest.json').write_bytes(encode(manifest)+b'\n')
overview=[]
for f,g in zip(features,shapes):
 if f['kind']=='road' and f['tags'].get('highway') not in ['motorway','trunk','primary','secondary','tertiary']:continue
 if f['kind'] not in ['road','rail','hydro','aviation']:continue
 if f['kind']=='hydro' and f['tags'].get('waterway') not in ['river','canal'] and not f['polygon']:continue
 if len(f['points'])==1:points=f['points']
 else:
  s=g.simplify(25,preserve_topology=True);points=list(s.exterior.coords) if s.geom_type=='Polygon' else list(s.coords) if s.geom_type=='LineString' else f['points']
 overview.append({'id':f['id'],'kind':f['kind'],'tags':{k:v for k,v in f['tags'].items() if k in ['name','ref','highway','railway','waterway','aeroway']},'points':[[round(p[0],2),round(p[1],2)] for p in points],'polygon':f['polygon']})
(out/'overview.pack').write_bytes(gzip.compress(encode(overview),mtime=0))
stats={**plan,'producedTiles':len(entries),'coverage':manifest['coverage'],'features':dict(counter),'sourceKm':{k:round(v/1000,3) for k,v in lengths.items()},'compressedTileBytes':total_bytes,'sourceHashes':source_hashes,'quality':'Administrative base coverage, not a claim of navigability or artistic completion.'}
Path('docs/mission-26-evidence').mkdir(exist_ok=True);Path('docs/mission-26-evidence/coverage.json').write_bytes(encode(stats)+b'\n');Path('docs/mission-26-evidence/sources.json').write_bytes(encode({'sources':sources,'rawAcquisition':source_records})+b'\n');print('COMPLETE',json.dumps(stats),flush=True)
