"""Source-sampled 2 m contact grid near the pilot; old visible boundary remains authoritative."""
import os,pathlib,json,hashlib,gzip,time
import numpy as np,rasterio
from pyproj import Transformer
root=pathlib.Path('work/mission-26-1');source=root/'sources/normalized';manifest=json.loads((source/'mnt-manifest.json').read_text());border=json.loads((root/'pilot-boundary.json').read_text())
assert not any(p['height'] is None for p in border['points']),'Unrepaired pilot hole on transition; cannot claim closed seam'
step=2;n=2049;axis=np.arange(n,dtype=np.float64)*step-2048;x,z=np.meshgrid(axis,axis);lon=.8844+x/(111320*np.cos(np.radians(46.6953)));lat=46.6953-z/111320;e,north=Transformer.from_crs(4326,2154,always_xy=True).transform(lon,lat);height=np.full(x.shape,np.nan,dtype=np.float32)
for f in manifest['files']:
 p=source/f['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
 with rasterio.open(p) as ds:
  mask=(e>=ds.bounds.left)&(e<ds.bounds.right)&(north>ds.bounds.bottom)&(north<=ds.bounds.top)
  rr,cc=rasterio.transform.rowcol(ds.transform,e[mask],north[mask]);values=ds.read(1)[np.asarray(rr),np.asarray(cc)];values[values==ds.nodata]=np.nan;height[mask]=values
 print(f['path'],int(mask.sum()),flush=True)
# Shared inner vertices are from the actual unchanged rendered pilot triangles,
# not a hidden DEM or a broad smoothing ramp. All other samples remain IGN.
before=[]
for p in border['points']:
 i=round((p['x']+2048)/step);j=round((p['z']+2048)/step);before.append(float(height[j,i]-p['height']));height[j,i]=p['height']
assert np.isfinite(height).all(),'Missing source cells must remain explicit, no filling'
raw=height.astype('<f4').tobytes();packed=gzip.compress(raw,compresslevel=9,mtime=0);out=pathlib.Path('public/planet/fr-86/contact');out.mkdir(exist_ok=True)
(out/'pilot.pack').write_bytes(packed)
m={'schema':'planet-contact-grid-v1','frame':{'type':'legacy-tangent','origin':{'lat':46.6953,'lon':.8844},'metresPerDegree':111320},'bounds':[-2048,-2048,2048,2048],'step':step,'size':2049,'datum':'IGN69','source':'IGN LiDAR HD MNT, native 0.5 m, sampled nearest source pixel on a 2 m local grid','license':'Licence Ouverte 2.0','surfaceBinding':border['surface'],'innerOwner':[-1000,-1000,1000,1000],'url':'pilot.pack','bytes':len(packed),'decodedBytes':len(raw),'sha256':hashlib.sha256(packed).hexdigest(),'sources':[{'path':f['path'],'sha256':f['sha256'],'rawSha256':f['raw_sha256'],'url':f['url']} for f in manifest['files']],'boundary':{'points':len(border['points']),'maxDifferenceBeforeM':max(abs(v) for v in before),'maxDifferenceAfterM':0,'method':'Exact existing visible pilot edge vertices inserted; no modification of any historical mesh.'},'min':float(height.min()),'max':float(height.max()),'nodata':0}
(out/'pilot.json').write_text(json.dumps(m,indent=2));print(json.dumps({k:m[k] for k in ['bytes','decodedBytes','min','max','boundary']}),flush=True)
