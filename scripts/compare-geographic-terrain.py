import json,numpy as np,pathlib,rasterio
from pyproj import Transformer
root=pathlib.Path('work/mission-08-5')
grids={n:json.loads((root/f'terrain-{n}.json').read_text()) for n in ['before','5m','10m']}
def sample(g,x,z):
 fx=(x-g['origin_x_m'])/g['step_m'];fz=(z-g['origin_z_m'])/g['step_m'];col=np.minimum(np.floor(fx).astype(int),g['width']-2);row=np.minimum(np.floor(fz).astype(int),g['height']-2);tx=fx-col;tz=fz-row;h=np.array(g['elevations_m']);i=row*g['width']+col;a=h[i];b=h[i+1];c=h[i+g['width']];d=h[i+g['width']+1]
 return np.where(abs(a-d)<abs(b-c),np.where(tx>=tz,a+(b-a)*tx+(d-b)*tz,a+(c-a)*tz+(d-c)*tx),np.where(tx+tz<=1,a+(b-a)*tx+(c-a)*tz,d+(c-d)*(1-tx)+(b-d)*(1-tz)))
x,z=np.meshgrid(np.arange(-997.5,1000,10),np.arange(-997.5,1000,10));x=x.ravel();z=z.ravel()
lon=.8844+x/(111320*np.cos(np.radians(46.6953)));lat=46.6953-z/111320
e,n=Transformer.from_crs(4326,2154,always_xy=True).transform(lon,lat);ref=np.full(len(x),np.nan)
for p in (root/'normalized').glob('*.tif'):
 with rasterio.open(p) as ds:
  b=ds.bounds;mask=(e>=b.left)&(e<b.right)&(n>b.bottom)&(n<=b.top);ref[mask]=np.array(list(ds.sample(list(zip(e[mask],n[mask])))))[:,0]
assert np.isfinite(ref).all()
def stats(d):return {'mean_signed_m':float(d.mean()),'mean_absolute_m':float(abs(d).mean()),'rmse_m':float(np.sqrt((d*d).mean())),'p95_absolute_m':float(np.quantile(abs(d),.95)),'max_absolute_m':float(abs(d).max()),'min_signed_m':float(d.min()),'max_signed_m':float(d.max())}
out={'reference':'Nearest native 0.5 m MNT pixel, same inverse game frame and EPSG:2154; not independent ground truth','sample_count':len(ref),'sample_positions':'200×200 cell-offset points: x,z=-997.5 + i*10 m','interpolation_error':{name:stats(sample(g,x,z)-ref) for name,g in grids.items()},'shared_node_difference':stats(np.array(grids['10m']['elevations_m'])-np.array(grids['before']['elevations_m']))}
pathlib.Path('docs/mission-08-5-captures/terrain-comparison.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
fig,axes=plt.subplots(1,3,figsize=(15,5),layout='constrained')
for ax,name in zip(axes,['before','5m','10m']):
 a=(sample(grids[name],x,z)-ref).reshape(200,200);im=ax.imshow(a,extent=[-1000,1000,1000,-1000],cmap='RdBu_r',vmin=-3,vmax=3);ax.set_title({'before':'Mission 08 : grille 10 m','5m':'LiDAR HD : grille 5 m','10m':'LiDAR HD : grille 10 m'}[name]);ax.set_xlabel('X local (m)');ax.set_ylabel('Z local (m)')
fig.colorbar(im,ax=axes,label='Écart au pixel source MNT (m), échelle limitée à ±3 m');fig.savefig('docs/mission-08-5-captures/terrain-errors.png',dpi=120)
