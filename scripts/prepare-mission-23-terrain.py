"""Source-confronted local TIN repairs, preserving original grid and road cells."""
import pathlib,json,math,time
import numpy as np
import rasterio
from pyproj import Transformer
from scipy.spatial import Delaunay
from shapely.geometry import Polygon,LineString,box
from shapely.ops import unary_union
root=pathlib.Path('work/mission-23');out=pathlib.Path('docs/mission-23-evidence');started=time.perf_counter()
g=json.load(open('public/data/angles-terrain.json'));ref=json.load(open('public/data/angles-relief.json'));osm=json.load(open('public/data/angles-osm.geojson'))
crs=Transformer.from_crs(4326,2154,always_xy=True);datasets=[rasterio.open(p) for p in sorted((root/'mnt').glob('*.tif'))]
def native(x,z):
 x,z=np.broadcast_arrays(np.asarray(x,dtype=float),np.asarray(z,dtype=float));e,n=crs.transform(.8844+x/(111320*math.cos(math.radians(46.6953))),46.6953-z/111320);v=np.full(x.shape,np.nan)
 for ds in datasets:
  b=ds.bounds;mask=(e>=b.left)&(e<b.right)&(n>b.bottom)&(n<=b.top)
  if mask.any():
   r,c=rasterio.transform.rowcol(ds.transform,np.asarray(e)[mask],np.asarray(n)[mask]);v[mask]=ds.read(1)[np.asarray(r),np.asarray(c)]
 if not np.isfinite(v).all() or (v==-9999).any():raise ValueError('Missing native IGN MNT support')
 return np.round(v,2)
heights=np.asarray(g['elevations_m']);w=g['width'];step=g['step_m']
def base(x,z):
 x,z=np.broadcast_arrays(np.asarray(x,dtype=float),np.asarray(z,dtype=float));fx=(x-g['origin_x_m'])/step;fz=(z-g['origin_z_m'])/step;c=np.minimum(w-2,np.floor(fx).astype(int));r=np.minimum(g['height']-2,np.floor(fz).astype(int));tx=fx-c;tz=fz-r;i=r*w+c;a=heights[i];b=heights[i+1];c=heights[i+w];d=heights[i+w+1]
 return np.where(abs(a-d)<abs(b-c),np.where(tx>=tz,a+(b-a)*tx+(d-b)*tz,a+(c-a)*tz+(d-c)*tx),np.where(tx+tz<=1,a+(b-a)*tx+(c-a)*tz,d+(c-d)*(1-tx)+(b-d)*(1-tz)))
existing={(c['x'],c['z']):c for c in ref['cells']}
def old(x,z):
 cx=min(w-2,int(math.floor((x-g['origin_x_m'])/step)));cz=min(g['height']-2,int(math.floor((z-g['origin_z_m'])/step)));c=existing.get((cx,cz))
 if c:
  p=np.asarray(c['vertices']).reshape(-1,3)
  for tri in np.asarray(c['indices']).reshape(-1,3):
   a,b,d=p[tri];den=(b[2]-d[2])*(a[0]-d[0])+(d[0]-b[0])*(a[2]-d[2]);u=((b[2]-d[2])*(x-d[0])+(d[0]-b[0])*(z-d[2]))/den;v=((d[2]-a[2])*(x-d[0])+(a[0]-d[0])*(z-d[2]))/den
   if min(u,v,1-u-v)>=-1e-8:return u*a[1]+v*b[1]+(1-u-v)*d[1]
 return float(base(x,z))
local=lambda p:((p[0]-.8844)*111320*math.cos(math.radians(46.6953)),-(p[1]-46.6953)*111320)
protected=[]
for f in osm['features']:
 tags=f.get('properties',{});geom=f.get('geometry') or {};coords=geom.get('coordinates')
 if geom.get('type')=='LineString' and (tags.get('highway') or tags.get('barrier')):
  try:width=float(str(tags.get('width',5.5)).replace('m','').strip())
  except ValueError:width=5.5
  protected.append(LineString([local(p) for p in coords]).buffer(max(1.25,width/2)+2))
 elif geom.get('type')=='Polygon' and (tags.get('building') or tags.get('natural')=='water' or tags.get('historic')):protected.append(Polygon([local(p) for p in coords[0]]).buffer(1))
protected=unary_union(protected)
# Source comparison at 16 held sample locations per 10m cell, entire pilot.
q=np.asarray([(x,z) for z in [1,3.5,6.5,9] for x in [1,3.5,6.5,9]])
audit=[];seeds=set();blocked=0
for cz in range(g['height']-1):
 z=g['origin_z_m']+cz*step;xs=np.arange(w-1)*step+g['origin_x_m'];px=(xs[:,None]+q[:,0]).ravel();pz=np.broadcast_to(z+q[:,1],(w-1,len(q))).ravel();h=native(px,pz).reshape(-1,len(q));b=base(px,pz).reshape(-1,len(q));err=np.max(abs(h-b),axis=1);span=np.ptp(h,axis=1)
 for cx in range(w-1):
  if span[cx]<6 or err[cx]<1:continue
  x=xs[cx];reason='existing-local-refinement' if (cx,cz) in existing else 'protected-mapped-road-building-water' if protected.intersects(box(x,z,x+step,z+step)) else 'native-source-residual'
  audit.append({'cell':[cx,cz],'x':float(x),'z':z,'nativeSpanM':float(span[cx]),'baseMaxResidualM':float(err[cx]),'classification':reason})
  if reason=='native-source-residual':seeds.add((cx,cz))
  elif reason.startswith('protected'):blocked+=1
selected=set()
for cx,cz in seeds:
 for dz in [-1,0,1]:
  for dx in [-1,0,1]:
   c=(cx+dx,cz+dz);x=g['origin_x_m']+c[0]*step;z=g['origin_z_m']+c[1]*step
   if 0<=c[0]<w-1 and 0<=c[1]<g['height']-1 and c not in existing and not protected.intersects(box(x,z,x+step,z+step)):selected.add(c)
if len(selected)>2048:raise ValueError('Bounded repair cell budget exceeded')
def corner_height(x,z):
 cx=int(round((x-g['origin_x_m'])/step));cz=int(round((z-g['origin_z_m'])/step))
 # Replace a coarse-grid corner only when all four incident cells participate.
 # The native MNT is the reference here; the stored API grid remains untouched.
 if all(c in selected for c in [(cx-1,cz-1),(cx,cz-1),(cx-1,cz),(cx,cz)]):return float(native(np.asarray([x]),np.asarray([z]))[0])
 return old(x,z)
def edge_nodes(p,h,tolerance):
 # Canonical orientation gives both incident cells exactly the same split
 # points, including ties. Flat transition edges need only their endpoints.
 if tuple(p[0])>tuple(p[-1]):p=p[::-1];h=h[::-1]
 selected_nodes={0,len(p)-1}
 def split(lo,hi):
  if hi-lo<2:return
  error=abs(h[lo:hi+1]-np.linspace(h[lo],h[hi],hi-lo+1));i=lo+int(error.argmax())
  if error.max()>tolerance:selected_nodes.add(i);split(lo,i);split(i,hi)
 split(0,len(p)-1);ids=sorted(selected_nodes);return p[ids],h[ids]
print('source candidates',len(audit),'new seeds',len(seeds),'selected',len(selected),'protected',blocked,flush=True)
cells=[];errorsBefore=[];errorsAfter=[]
for cx,cz in sorted(selected,key=lambda c:(c[1],c[0])):
 x=g['origin_x_m']+cx*step;z=g['origin_z_m']+cz*step;corners=[(x,z),(x+step,z),(x+step,z+step),(x,z+step)];neighbors=[(cx,cz-1),(cx+1,cz),(cx,cz+1),(cx-1,cz)];pts={}
 for j,a in enumerate(corners):
  b=corners[(j+1)%4];p=np.asarray([np.asarray(a)+(np.asarray(b)-a)*t/10 for t in range(11)]);h=native(p[:,0],p[:,1]) if neighbors[j] in selected else np.asarray([old(*v) for v in p]);h[0]=corner_height(*a);h[-1]=corner_height(*b)
  p,h=edge_nodes(p,h,.25 if neighbors[j] in selected else 1e-7)
  for v,hh in zip(p,h):pts[tuple(v)]=float(hh)
 candidates=np.asarray([(x+dx,z+dz) for dz in range(1,10) for dx in range(1,10)]);target=native(candidates[:,0],candidates[:,1])
 for _ in range(82):
  p=np.asarray(list(pts));h=np.asarray(list(pts.values()));tri=Delaunay(p);s=tri.find_simplex(candidates,tol=1e-8);bc=np.einsum('ijk,ik->ij',tri.transform[s,:2],candidates-tri.transform[s,2]);weights=np.column_stack((bc,1-bc.sum(axis=1)));err=abs((h[tri.simplices[s]]*weights).sum(axis=1)-target);err[np.asarray([tuple(v) in pts for v in candidates])]=-1;i=int(err.argmax())
  if err[i]<=.4:break
  pts[tuple(candidates[i])]=float(target[i])
 p=np.asarray(list(pts));h=np.asarray(list(pts.values()));tri=Delaunay(p);test=np.asarray([(x+dx,z+dz) for dz in np.arange(.25,10,.5) for dx in np.arange(.25,10,.5)]);s=tri.find_simplex(test,tol=1e-8);bc=np.einsum('ijk,ik->ij',tri.transform[s,:2],test-tri.transform[s,2]);weights=np.column_stack((bc,1-bc.sum(axis=1)));truth=native(test[:,0],test[:,1]);errorsBefore.extend(base(test[:,0],test[:,1])-truth);errorsAfter.extend((h[tri.simplices[s]]*weights).sum(axis=1)-truth)
 cells.append({'x':cx,'z':cz,'vertices':np.column_stack((p[:,0],h,p[:,1])).ravel().tolist(),'indices':tri.simplices.ravel().tolist()})
def stats(a):
 a=np.abs(a);return {'meanAbsoluteM':float(np.mean(a)),'p95AbsoluteM':float(np.quantile(a,.95)),'maxAbsoluteM':float(np.max(a))}
result={'schema':'endless-earth-terrain-refinement-v1','verticalDatum':g['vertical_datum'],'baseSpacingM':step,'provenance':{'license':'Licence Ouverte 2.0','sourceUrl':json.load(open('docs/mission-08-5-sources.json'))['mnt']['source_url'],'method':'Pinned IGN LiDAR HD native 0.5m MNT, same Lambert93/IGN69 and geographic frame. Adaptive 1m candidate nodes at >0.4m residual. Shared 1m edges, source-verified interior corners, original perimeter heights. No overhang or independent survey accuracy claimed.'},'cells':cells}
(root/'terrain-repairs.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
(out/'source-audit.json').write_text(json.dumps({'cellsTested':(g['height']-1)*(w-1),'nativeSamplesPerCell':len(q),'candidates':audit,'seedCells':len(seeds),'repairedCells':len(cells),'protectedCandidates':blocked,'before':stats(errorsBefore),'after':stats(errorsAfter),'validation':'Held-out .25/.75m samples, distinct from 1m training nodes; perimeter continuity can retain larger errors. Native resolution is not absolute accuracy.','seconds':time.perf_counter()-started},indent=2)+'\n')
print('DONE',len(cells),stats(errorsBefore),stats(errorsAfter),flush=True)
