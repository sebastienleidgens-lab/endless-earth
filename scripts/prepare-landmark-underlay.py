#!/usr/bin/env python3
"""Reclassify only old road faces below the supported deck, preserving heights.

GEOS constrained triangulation retains the exact mapped water outline. All
other tiles, original vertex buffers and nonintersecting faces are retained.
"""
import pathlib,json,gzip,hashlib,math,time
import numpy as np
from shapely.geometry import Polygon,LineString
from shapely import constrained_delaunay_triangles
from shapely.ops import unary_union
root=pathlib.Path('public/data');out=pathlib.Path('docs/mission-14-evidence/heritage');started=time.perf_counter()
m=json.loads((root/'angles-relief-surface.json').read_text());data=gzip.decompress((root/'angles-relief-surface.pack').read_bytes());lmText=(root/'angles-landmarks.json').read_bytes();lm=json.loads(lmText);obs=json.loads(pathlib.Path('work/mission-14B/observations.json').read_text());osm=json.loads((root/'angles-osm.geojson').read_text())
dtype={'f32':'<f4','i16':'<i2','u8':'u1','u16':'<u2','u32':'<u4'}
def array(t,key):
 d=t[key];return np.frombuffer(data,dtype=dtype[d['type']],count=d['length'],offset=d['offset']).copy()
local=lambda cs:[((p[0]-.8844)*111320*math.cos(math.radians(46.6953)),-(p[1]-46.6953)*111320) for p in cs]
water=unary_union([Polygon(local(f['geometry']['coordinates'][0]),[local(r) for r in f['geometry']['coordinates'][1:]]) for f in osm['features'] if f.get('geometry',{}).get('type')=='Polygon' and (f.get('properties',{}).get('natural')=='water' or f.get('properties',{}).get('water'))])
corridor=LineString(obs['bridge']['axisXZ']).buffer(obs['bridge']['width']/2,cap_style=2,join_style=2)
tiles=[];changed=0;newWater=0.;removedRoad=0.
for descriptor in m['tiles']:
 arrays={k:array(descriptor,k) for k in ['position','normal','color','earthRoad','earthWater','fine','far']};p=arrays['position'].reshape(-1,3);n=arrays['normal'].reshape(-1,3);c=arrays['color'].reshape(-1,3);roads=arrays['earthRoad'];wet=arrays['earthWater'];fine=arrays['fine'].reshape(-1,3);originalCount=len(p)
 positions=p.tolist();normals=n.tolist();colors=c.tolist();r=roads.tolist();w=wet.tolist();faces={};indices=[]
 for tri in fine:
  coords=p[tri][:,[0,2]].astype(float);poly=Polygon(coords);key=tuple(sorted(map(int,tri)))
  if roads[tri[0]]==0 or not poly.intersects(corridor) or poly.intersection(corridor).area<1e-9:indices.extend(map(int,tri));continue
  inside=poly.intersection(corridor);outside=poly.difference(corridor);land=inside.difference(water);river=inside.intersection(water);removedRoad+=inside.area;newWater+=river.area;changed+=1;emitted=[]
  a,b,d=coords;den=(b[1]-d[1])*(a[0]-d[0])+(d[0]-b[0])*(a[1]-d[1])
  for shape,style,isWet in [(outside,int(roads[tri[0]]),0),(land,0,0),(river,0,1)]:
   if shape.is_empty:continue
   parts=list(shape.geoms) if shape.geom_type in ['MultiPolygon','GeometryCollection'] else [shape]
   for part in parts:
    if part.geom_type!='Polygon' or part.area<1e-9:continue
    for t in constrained_delaunay_triangles(part).geoms:
     q=list(t.exterior.coords)[:3]
     # Upward Three.js faces have negative area in local X/Z.
     if (q[1][0]-q[0][0])*(q[2][1]-q[0][1])-(q[1][1]-q[0][1])*(q[2][0]-q[0][0])>0:q[1],q[2]=q[2],q[1]
     for xx,zz in q:
      x,z=map(float,np.array([round(xx,6),round(zz,6)],dtype=np.float32));u=((b[1]-d[1])*(x-d[0])+(d[0]-b[0])*(z-d[1]))/den;v=((d[1]-a[1])*(x-d[0])+(a[0]-d[0])*(z-d[1]))/den;weights=np.array([u,v,1-u-v]);height=float(weights@p[tri,1]);normal=np.rint(weights@n[tri]).clip(-32767,32767).astype(int).tolist();color=np.rint(weights@c[tri]).clip(0,255).astype(int).tolist() if style else [68,84,48]
      idx=len(positions);positions.append([x,height,z]);normals.append(normal);colors.append(color);r.append(style);w.append(isWet);emitted.append(idx)
  faces[key]=emitted;indices.extend(emitted)
 if faces:
  far=[]
  for tri in arrays['far'].reshape(-1,3):far.extend(faces.get(tuple(sorted(map(int,tri))),list(map(int,tri))))
  indexType='<u2' if len(positions)<65536 else '<u4'
  arrays.update(position=np.asarray(positions,dtype='<f4').ravel(),normal=np.asarray(normals,dtype='<i2').ravel(),color=np.asarray(colors,dtype='u1').ravel(),earthRoad=np.array(r,dtype='u1'),earthWater=np.array(w,dtype='u1'),fine=np.array(indices,dtype=indexType),far=np.array(far,dtype=indexType))
 tiles.append((descriptor,arrays))
chunks=[];offset=0;descriptors=[];types={'<f4':'f32','<i2':'i16','|u1':'u8','<u2':'u16','<u4':'u32'}
for old,arrays in tiles:
 d={k:v for k,v in old.items() if k not in arrays}
 for key,a in arrays.items():
  padding=(-offset)%4;chunks.append(bytes(padding));offset+=padding;d[key]={'offset':offset,'length':a.size,'type':types[a.dtype.str]};b=a.tobytes();chunks.append(b);offset+=len(b)
 descriptors.append(d)
raw=b''.join(chunks);packed=gzip.compress(raw,compresslevel=9,mtime=0)
m.update(tiles=descriptors,binaryBytes=len(raw),binarySha256=hashlib.sha256(raw).hexdigest(),compressedBytes=len(packed),landmarksSha256=hashlib.sha256(lmText).hexdigest())
m['stats']['fineTriangles']=sum(a['fine'].size//3 for _,a in tiles);m['stats']['farTriangles']=sum(a['far'].size//3 for _,a in tiles);m['stats']['vertices']=sum(a['earthRoad'].size for _,a in tiles);m['stats']['roadAreaM2']-=removedRoad;m['stats']['waterAreaM2']+=newWater
(root/'angles-landmark-surface.pack').write_bytes(packed);(root/'angles-landmark-surface.json').write_text(json.dumps(m,indent=2)+'\n')
(out/'underlay.json').write_text(json.dumps({'changedRoadTriangles':changed,'restoredWaterM2':newWater,'reclassifiedRoadM2':removedRoad,'binaryBytes':len(raw),'compressedBytes':len(packed),'preparationSeconds':time.perf_counter()-started,'method':'Existing 14A faces clipped with GEOS below the documented deck footprint; source surface heights interpolated on those same faces. No road-axis or water-polygon movement. Unchanged triangles/vertex buffers retained.'},indent=2)+'\n')
print('Prepared bridge underlay',changed,'old faces changed; no source heights changed')
