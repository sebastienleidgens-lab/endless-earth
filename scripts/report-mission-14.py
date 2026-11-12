"""Maps and paired engine contact sheet. No generated or retouched scenery."""
import json,pathlib,os,math
root=pathlib.Path('work/mission-14');os.environ['MPLCONFIGDIR']=str(root/'mpl')
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle,Patch
import numpy as np
from PIL import Image,ImageDraw,ImageFont
out=pathlib.Path('docs/mission-14-evidence')
g=json.loads(pathlib.Path('public/data/angles-terrain.json').read_text());r=json.loads(pathlib.Path('public/data/angles-relief.json').read_text());osm=json.loads(pathlib.Path('public/data/angles-osm.geojson').read_text());p=json.loads((root/'protected-cells.json').read_text())
def local(c):return [((lon-.8844)*111320*math.cos(math.radians(46.6953)),-(lat-46.6953)*111320) for lon,lat,*_ in c]
fig,axes=plt.subplots(1,2,figsize=(12,7),layout='constrained')
for ax in axes:
 ax.imshow(np.array(g['elevations_m']).reshape(201,201),extent=[-1000,1000,1000,-1000],cmap='gist_earth',alpha=.45)
 for key in p['keys']:
  z,x=divmod(key,201);xx=-1000+x*10;zz=-1000+z*10
  if -220<=xx<120 and 40<=zz<420:ax.add_patch(Rectangle((xx,zz),10,10,facecolor='#6a777e',alpha=.5,lw=0))
 for c in r['cells']:ax.add_patch(Rectangle((-1000+c['x']*10,-1000+c['z']*10),10,10,facecolor='#e49c24',edgecolor='#784400',lw=.15))
 for f in osm['features']:
  t=f.get('properties',{});geom=f.get('geometry',{})
  if geom.get('type')=='LineString' and t.get('highway'):
   q=np.array(local(geom['coordinates']));ax.plot(q[:,0],q[:,1],color='#52595a',lw=.4,alpha=.7)
  if geom.get('type')=='Polygon' and t.get('natural')=='water':
   q=np.array(local(geom['coordinates'][0]));ax.fill(q[:,0],q[:,1],color='#86b8c9',alpha=.75)
 ax.set_xlabel('X local est (m)');ax.set_ylabel('Z local sud (m)');ax.set_aspect('equal')
axes[0].set_xlim(-1000,1000);axes[0].set_ylim(1000,-1000);axes[0].set_title('Pilote 2 × 2 km — même référentiel')
axes[0].add_patch(Rectangle((-220,40),340,380,fill=False,edgecolor='#a4510e',lw=1.5))
axes[1].set_xlim(-240,140);axes[1].set_ylim(440,20);axes[1].set_title('Éperon : 330 cellules affinées (3,30 ha)')
axes[1].legend(handles=[Patch(facecolor='#e49c24',label='TIN local issu du MNT'),Patch(facecolor='#6a777e',label='Couloirs existants conservés à 10 m'),Patch(facecolor='#86b8c9',label='Eau cartographiée OSM')],loc='lower left',fontsize=8)
fig.suptitle('Mission 14A — IGN LiDAR HD / OSM\nLe pas natif de 0,5 m ne décrit pas la précision absolue du terrain.',fontsize=12)
fig.savefig(out/'relief-map.png',dpi=140);plt.close(fig)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
ids=['chateau-rive','falaise-vallee','village-pont','foret-relief'];width=1200;image=Image.new('RGB',(width,4*430+50),'#f0ede5');draw=ImageDraw.Draw(image)
draw.text((18,12),'Mission 13 — main 03d963f',fill='#243c36',font=font);draw.text((620,12),'Mission 14A — mêmes caméras',fill='#243c36',font=font)
for row,id in enumerate(ids):
 y=50+row*430
 for col,phase in enumerate(['before','after']):
  capture=Image.open(out/phase/(id+'.jpg'));capture.thumbnail((600,400));image.paste(capture,(col*600,y))
 draw.text((15,y+403),id+(' · témoin hors raffinement' if id=='foret-relief' else ''),fill='#243c36',font=font)
image.save(out/'comparison.jpg',quality=89)
