#!/usr/bin/env python3
"""Offline comparison of local height-field TINs against the pinned IGN MNT.

Uses the existing 08.5 normalizer first. Does not download point clouds or
claim independent survey accuracy. Run from the repository root.
"""
import json, pathlib, hashlib, time
import numpy as np
import rasterio
from scipy.spatial import Delaunay
from pyproj import Transformer

root=pathlib.Path('work/mission-14');out=pathlib.Path('docs/mission-14-evidence');out.mkdir(parents=True,exist_ok=True)
g=json.loads(pathlib.Path('public/data/angles-terrain.json').read_text())
meta=json.loads((root/'normalized/mnt-manifest.json').read_text());item=meta['files'][0]
path=root/'normalized'/item['path'];assert hashlib.sha256(path.read_bytes()).hexdigest()==item['sha256']
ds=rasterio.open(path);raster=ds.read(1);transform=Transformer.from_crs(4326,2154,always_xy=True)
assert ds.crs==rasterio.crs.CRS.from_epsg(2154) and ds.res==(.5,.5)
heights=np.array(g['elevations_m']);w=g['width']
def source(x,z):
 e,n=transform.transform(.8844+np.asarray(x)/(111320*np.cos(np.radians(46.6953))),46.6953-np.asarray(z)/111320)
 r,c=rasterio.transform.rowcol(ds.transform,e,n);r=np.asarray(r,dtype=int);c=np.asarray(c,dtype=int)
 assert (r>=0).all() and (r<ds.height).all() and (c>=0).all() and (c<ds.width).all()
 values=raster[r,c].astype(float);assert np.isfinite(values).all() and (values!=-9999).all()
 return np.round(values,2)
def base(x,z):
 fx=(np.asarray(x)+1000)/10;fz=(np.asarray(z)+1000)/10;c=np.floor(fx).astype(int);r=np.floor(fz).astype(int);tx=fx-c;tz=fz-r;i=r*w+c
 a=heights[i];b=heights[i+1];c=heights[i+w];d=heights[i+w+1]
 return np.where(abs(a-d)<abs(b-c),np.where(tx>=tz,a+(b-a)*tx+(d-b)*tz,a+(c-a)*tz+(d-c)*tx),np.where(tx+tz<=1,a+(b-a)*tx+(c-a)*tz,d+(c-d)*(1-tx)+(b-d)*(1-tz)))
def predict(tri,h,p):
 s=tri.find_simplex(p,tol=1e-8);assert (s>=0).all()
 b=np.einsum('ijk,ik->ij',tri.transform[s,:2],p-tri.transform[s,2]);weights=np.column_stack((b,1-b.sum(axis=1)))
 return (h[tri.simplices[s]]*weights).sum(axis=1)
def stats(a):
 return dict(meanAbsoluteM=float(abs(a).mean()),rmseM=float(np.sqrt((a*a).mean())),p95AbsoluteM=float(np.quantile(abs(a),.95)),maxAbsoluteM=float(abs(a).max()))
# Geographic pilot configuration; no site name/coordinates enter the engine.
bounds=[-220,40,120,420];seeds=set();audit=[]
q=np.array([(x,z) for z in np.arange(.25,10,.5) for x in np.arange(.25,10,.5)])
for z in range(bounds[1],bounds[3],10):
 for x in range(bounds[0],bounds[2],10):
  p=q+[x,z];h=source(p[:,0],p[:,1]);err=stats(base(p[:,0],p[:,1])-h);span=float(h.max()-h.min())
  audit.append(dict(x=x,z=z,spanM=span,**err))
  if span>=6 and err['maxAbsoluteM']>=1:seeds.add((x,z))
cells=set((x+dx,z+dz) for x,z in seeds for dx in [-10,0,10] for dz in [-10,0,10] if bounds[0]<=x+dx<bounds[2] and bounds[1]<=z+dz<bounds[3])
protection=json.loads((root/'protected-cells.json').read_text())
protected=set(protection['keys']);initialCells=len(cells)
cells={c for c in cells if ((c[1]+1000)//10)*w+(c[0]+1000)//10 not in protected}
def edge(a,b,mode):
 if tuple(a)>tuple(b):a,b=b,a
 p=np.array([np.array(a)+(np.array(b)-a)*i/10 for i in range(11)]);h=source(p[:,0],p[:,1]);h[0]=base(*a);h[-1]=base(*b)
 if mode!='adaptive':return p[::int(mode)],h[::int(mode)]
 selected={0,10}
 def split(lo,hi):
  if hi-lo<2:return
  error=abs(h[lo:hi+1]-np.linspace(h[lo],h[hi],hi-lo+1));i=lo+int(error.argmax())
  if error.max()>.25:selected.add(i);split(lo,i);split(i,hi)
 split(0,10);ids=sorted(selected);return p[ids],h[ids]
interior=np.array([(x,z) for z in range(1,10) for x in range(1,10)])
def mesh(x,z,mode):
 corners=[(x,z),(x+10,z),(x+10,z+10),(x,z+10)];neighbors=[(x,z-10),(x+10,z),(x,z+10),(x-10,z)];pts={}
 for j,a in enumerate(corners):
  b=corners[(j+1)%4]
  if neighbors[j] in cells:p,h=edge(a,b,mode)
  else:p=np.array([a,b]);h=base(p[:,0],p[:,1])
  for v,hh in zip(p,h):pts[tuple(v)]=float(hh)
 candidates=interior+[x,z];candidateH=source(candidates[:,0],candidates[:,1])
 if mode!='adaptive':
  step=int(mode)
  for p,h in zip(candidates,candidateH):
   if (p[0]-x)%step==0 and (p[1]-z)%step==0:pts[tuple(p)]=float(h)
 else:
  for _ in range(82):
   p=np.array(list(pts));h=np.array(list(pts.values()));tri=Delaunay(p)
   err=abs(predict(tri,h,candidates)-candidateH);missing=np.array([tuple(v) not in pts for v in candidates]);err[~missing]=-1
   i=int(err.argmax())
   if err[i]<=.4:break
   pts[tuple(candidates[i])]=float(candidateH[i])
 p=np.array(list(pts));h=np.array(list(pts.values()));tri=Delaunay(p)
 return p,h,tri
results={};chosen=[]
for mode in ['5','2','1','adaptive']:
 started=time.perf_counter();errors=[];totalTriangles=0;vertices=0;allErrors=[]
 for x,z in sorted(cells,key=lambda c:(c[1],c[0])):
  p,h,tri=mesh(x,z,mode);test=q+[x,z];err=predict(tri,h,test)-source(test[:,0],test[:,1]);errors.extend(err);vertices+=len(p);totalTriangles+=len(tri.simplices)
  if mode=='adaptive':
   flat=np.column_stack((p[:,0],h,p[:,1])).ravel().tolist();indices=tri.simplices.ravel().tolist()
   chosen.append(dict(x=(x+1000)//10,z=(z+1000)//10,vertices=flat,indices=indices))
 # Held-out points at .25/.75 offsets, distinct from 1 m training nodes.
 results[mode]=dict(cells=len(cells),verticesWithCellDuplicates=vertices,triangles=totalTriangles,preparationSeconds=time.perf_counter()-started,error=stats(np.array(errors)))
 print(mode,json.dumps(results[mode]),flush=True)
baselineErrors=[]
for x,z in sorted(cells):
 p=q+[x,z];baselineErrors.extend(base(p[:,0],p[:,1])-source(p[:,0],p[:,1]))
results['10']=dict(cells=len(cells),triangles=len(cells)*2,error=stats(np.array(baselineErrors)))
result=dict(schema='endless-earth-terrain-refinement-v1',baseTerrainSha256=hashlib.sha256(pathlib.Path('public/data/angles-terrain.json').read_bytes()).hexdigest(),baseSpacingM=g['step_m'],verticalDatum=g['vertical_datum'],boundsM=bounds,cells=chosen,
 provenance=dict(product='IGN LiDAR HD MNT',license=meta['license'],sourceUrl=meta['source_url'],acquiredAt=meta['acquired_at'],edition=meta['edition'],nativeSpacingM=.5,horizontalCRS='EPSG:2154',horizontalFrame='legacy local X east, Z south; inverse geo.ts',files=meta['files'],method='Nearest native pixel, 2-decimal metre elevations; 1 m candidate nodes; Delaunay insertion at >0.4 m node residual; shared edges simplified at 0.25 m; coarse perimeter retained. No overhangs.'),
 selection=dict(seedCells=len(seeds),rule='within pilot bounds, source span >=6 m and 10 m max residual >=1 m; one-cell transition ring; preserve existing walkable road corridor cells',protectedCandidateCells=initialCells-len(cells),roadProtection=protection['method'],candidateNodeThresholdM=.4,sharedEdgeThresholdM=.25,minCandidateSpacingM=1))
pathlib.Path('public/data/angles-relief.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
(out/'terrain-comparison.json').write_text(json.dumps(dict(reference='Pinned native MNT, not independent ground truth or absolute survey accuracy',validation='400 held-out samples per selected 10 m cell at offsets 0.25,0.75,...,9.75 m',boundsM=bounds,seedCells=len(seeds),refinedCells=len(cells),protectedCandidateCells=initialCells-len(cells),candidates=results,audit=audit),indent=2)+'\n')
print('selected',len(cells),'cells')
