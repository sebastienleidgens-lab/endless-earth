#!/usr/bin/env python3
"""Local, documented observations from classified IGN points; offline only."""
import json,pathlib,math,hashlib
import numpy as np
from scipy.spatial import cKDTree
from scipy import ndimage
from shapely.geometry import Polygon,box,mapping
from shapely.ops import unary_union
import rasterio
from pyproj import Transformer
root=pathlib.Path('work/mission-14B');out=pathlib.Path('docs/mission-14-evidence/heritage');out.mkdir(parents=True,exist_ok=True)
p=np.load(root/'raw/local-points.npz')['points'];p=p[np.lexsort((p[:,3],p[:,2],p[:,1],p[:,0]))]
osm=json.loads(pathlib.Path('public/data/angles-osm.geojson').read_text());g=json.loads(pathlib.Path('public/data/angles-terrain.json').read_text())
local=lambda a:np.column_stack(((a[:,0]-.8844)*111320*np.cos(np.radians(46.6953)),-(a[:,1]-46.6953)*111320))
ds=rasterio.open('work/mission-14/normalized/LHD_FXX_0538_6624_MNT_O_0M50_LAMB93_IGN69.tif');raster=ds.read(1);crs=Transformer.from_crs(4326,2154,always_xy=True)
def mnt(x,z):
 e,n=crs.transform(.8844+np.asarray(x)/(111320*np.cos(np.radians(46.6953))),46.6953-np.asarray(z)/111320);rr,cc=rasterio.transform.rowcol(ds.transform,e,n)
 return raster[np.asarray(rr,dtype=int),np.asarray(cc,dtype=int)].astype(float)
castle=next(f for f in osm['features'] if f['properties'].get('historic')=='castle');ring=local(np.array(castle['geometry']['coordinates'][0]))
solid=p[np.isin(p[:,3],[1,2,6])];tree=cKDTree(solid[:,[0,2]]);strong=p[np.isin(p[:,3],[1,6])];strongTree=cKDTree(strong[:,[0,2]]);panels=[];outer=[];unobserved=0
for a,b in zip(ring[:-1],ring[1:]):
 length=np.linalg.norm(b-a)
 if length<.15:continue
 n=max(1,math.ceil(length));samples=[];normal=np.array([-(b-a)[1],(b-a)[0]])/length
 for t in np.linspace(0,1,n+1):
  v=a+(b-a)*t;ids=tree.query_ball_point(v,1.2);base=float(max(mnt(*(v+normal*1.5)),mnt(*(v-normal*1.5)),mnt(*v)));crest=float(solid[ids,1].max()) if ids else base
  candidates=strongTree.query_ball_point(v,4)
  if candidates:crest=max(crest,float(strong[candidates,1].max()))
  samples.append([round(float(v[0]),4),round(min(base,crest),2),round(float(v[1]),4),round(crest,2)])
 for a,b in zip(samples[:-1],samples[1:]):outer.append({'a':a,'b':b,'width':1.25})
# Two prominent surviving donjon planes. Only classified non-ground returns
# are admitted; horizontal plane fits and small-gap closing are reconstructions.
d=p[(p[:,0]>-91)&(p[:,0]<-50)&(p[:,2]>149)&(p[:,2]<176)&np.isin(p[:,3],[1,6])&(p[:,1]>96)]
remaining=d.copy();fits=[]
for wall in range(2):
 best=None
 for deg in range(180):
  angle=deg*np.pi/180;u=np.array([np.cos(angle),np.sin(angle)]);normal=np.array([-u[1],u[0]]);values=remaining[:,[0,2]]@normal
  lo=np.floor(values.min()/.25)*.25;hist,edges=np.histogram(values,bins=np.arange(lo,values.max()+.5,.25));counts=np.convolve(hist,np.ones(4,dtype=int),'valid');j=int(counts.argmax());center=edges[j]+.5;mask=abs(values-center)<=.5;score=int(mask.sum())
  if best is None or score>best[0]:best=(score,u,normal,center,mask)
 count,u,normal,offset,mask=best;inliers=remaining[mask];remaining=remaining[~mask]
 along=inliers[:,[0,2]]@u;s0=math.floor(along.min()*2)/2;h0=math.floor(inliers[:,1].min()*2)/2
 # 0.5 m cells, no fill of large holes. Missing windows remain empty.
 shape=(int(np.ceil((inliers[:,1].max()-h0)*2))+3,int(np.ceil((along.max()-s0)*2))+3);mask2=np.zeros(shape,dtype=bool)
 cols=np.floor((along-s0)*2).astype(int)+1;rows=np.floor((inliers[:,1]-h0)*2).astype(int)+1;mask2[rows,cols]=True
 mask2=ndimage.binary_closing(mask2,structure=np.ones((3,3)))
 holes=ndimage.binary_fill_holes(mask2)&~mask2;labels,n=ndimage.label(holes)
 for label in range(1,n+1):
  if (labels==label).sum()<=2:mask2[labels==label]=True
 region=unary_union([box(s0+(c-1)*.5,h0+(r-1)*.5,s0+c*.5,h0+r*.5) for r,c in zip(*np.where(mask2))]).simplify(.12,preserve_topology=True)
 polygons=list(region.geoms) if region.geom_type=='MultiPolygon' else [region]
 for poly in polygons:
  if poly.area<4:continue
  # Ring coordinates are along-plane metres and absolute IGN69 height.
  panels.append({'originXZ':(normal*offset).tolist(),'axisXZ':u.tolist(),'width':1.25,'rings':[list(poly.exterior.coords)]+[list(r.coords) for r in poly.interiors]})
 fits.append({'returns':len(inliers),'axisXZ':u.tolist(),'normalOffsetM':float(offset),'heightRangeM':[float(inliers[:,1].min()),float(inliers[:,1].max())],'candidateRegionCount':len(polygons),'confidence':'reconstruction from class 1/6 LiDAR; 0.5 m occupancy, 3x3 closing, hole fill <=0.5 m2; width inherited, not measured'})
bridge=next(f for f in osm['features'] if f['properties'].get('bridge')=='yes');axis=local(np.array(bridge['geometry']['coordinates']));lengths=np.linalg.norm(np.diff(axis,axis=0),axis=1);cum=np.r_[0,np.cumsum(lengths)];length=float(cum[-1])
def at(s):
 i=min(len(lengths)-1,int(np.searchsorted(cum,s,side='right')-1));t=(s-cum[i])/lengths[i];return axis[i]+(axis[i+1]-axis[i])*t
deck=p[p[:,3]==17];u=(axis[1]-axis[0])/lengths[0];normal=np.array([-u[1],u[0]]);chain=(deck[:,[0,2]]-axis[0])@u;across=(deck[:,[0,2]]-axis[0])@normal
profile=[]
for s in np.arange(0,length+1,2):
 ss=min(float(s),length);mask=(abs(chain-ss)<3)&(abs(across)<1.5)&(deck[:,1]>71)
 if mask.sum()<5:
  near=(abs(chain-np.clip(ss,20,78))<4)&(abs(across)<1.5)&(deck[:,1]>71);y=float(np.median(deck[near,1]))
 else:y=float(np.median(deck[mask,1]))
 profile.append([ss,round(y,3)])
if profile[-1][0]!=length:profile.append([length,profile[-1][1]])
bridgeStats={'class17Returns':len(deck),'coreZQuantilesM':np.quantile(deck[(abs(across)<1.5)&(deck[:,1]>71),1],[.05,.5,.95]).tolist(),'observedChainageP01P99M':np.quantile(chain,[.01,.99]).tolist(),'osmLengthM':length,'widthM':5.5,'widthSource':'BD TOPO TRONROUT0000000054544470 largeur_de_chaussee=5.5; same OSM-derived default width','verticalCrossCheck':'BD TOPO 3D line Z 71.4–71.9 m, precision attribute 1.5 m; LiDAR road core around 72.2 m. Not centimetric independent truth.'}
# The observation extent is kept distinct from the mapped approaches.
bridgeSpec={'id':'pont','featureId':bridge['id'],'axisXZ':axis.tolist(),'profile':profile,'width':5.5,'parapetWidth':.35,'parapetHeight':1.05,'parapetBaseHeight':.25,'railSpacing':.5,'deckThickness':.45,'arches':[{'start':18+i*20.3+1.25,'end':18+(i+1)*20.3-1.25,'springM':66.8} for i in range(3)],'bedM':64.5,'confidence':{'axis':'documented OSM, unchanged','deck':'class 17 road-core median; approaches extrapolated outside observed returns','width':'documented BD TOPO carriageway','arches':'three principal arches documented; spans/springs and cutwater sections interpreted, not surveyed; relief arch omitted','railing':'metal railing on stone plinth documented by Floppy36 CC BY-SA photos; height, section and simplified 0.5 m spacing inferred','submergedParts':'buried support base interpreted; no measured bathymetry'}}
result={'schema':'endless-earth-landmarks-v1','verticalDatum':'IGN69','terrainSha256':hashlib.sha256(pathlib.Path('public/data/angles-terrain.json').read_bytes()).hexdigest(),'osmSha256':hashlib.sha256(pathlib.Path('public/data/angles-osm.geojson').read_bytes()).hexdigest(),'refinementSha256':hashlib.sha256(pathlib.Path('public/data/angles-relief.json').read_bytes()).hexdigest(),'castle':{'featureId':castle['id'],'outerWalls':outer,'panels':panels,'fits':fits,'confidence':{'plan':'OSM mapped outline unchanged','outerCrests':'class 1/2/6 maximum within 1.2 m; sparse class 1/6 crests propagated within 4 m on the mapped outline; reconstruction, not a surveyed continuous crown','donjon':'two LiDAR-derived wall planes with observed gaps; interpolation, not exact survey','thickness':'1.25 m inherited interpretation; outer wall beds use upper native MNT samples within 1.5 m; donjon ground-contact infill below observed panels is inferred','unknown':'No new roof, courtyard access, room or complete fortress'}},'bridge':bridgeSpec,'sources':{'lidar':json.loads((root/'raw/copc-source.json').read_text()),'bdTopo':[json.loads((root/'raw'/f'{name}-source.json').read_text()) for name in ['batiment','construction_lineaire','troncon_de_route']]}}
(root/'observations.json').write_text(json.dumps(result,separators=(',',':'))+'\n');(out/'observations.json').write_text(json.dumps({'castle':{'fits':fits,'outerSegments':len(outer),'panels':len(panels)},'bridge':bridgeStats,'notes':'No raw points in browser; interpolation and uncertain structure dimensions explicitly separated from observed positions.'},indent=2)+'\n')
print('Prepared',len(outer),'outer segments',len(panels),'wall polygons',bridgeStats)
