import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import PathPatch
from matplotlib.path import Path
import json,pathlib
from PIL import Image
from pyproj import Transformer
import numpy as np
root=pathlib.Path('work/mission-08-5/raw');d=json.loads(pathlib.Path('public/data/angles-environment.json').read_text());extent=[537276,539434,6622779,6624931];transform=Transformer.from_crs(4326,2154,always_xy=True)
fig,axes=plt.subplots(1,2,figsize=(13,6),layout='constrained')
axes[0].imshow(Image.open(root/'ortho-reference.body'),extent=extent,origin='upper');axes[0].set_title('IGN BD ORTHO 2023 — référence à ~2 m\nsource 20 cm, pas une texture du jeu')
colors={'wood':'#788959','scrub':'#98a46b','farmland':'#bbab76','meadow':'#a5ba7b','open':'#c7d396','built':'#b49d8b','bare':'#d7d0bc'}
for f in sorted(d['features'],key=lambda f:f['properties']['priority']):
 rings=[]
 for i,ring in enumerate(f['geometry']['coordinates']):
  a=np.array(ring);x,y=transform.transform(a[:,0],a[:,1]);v=np.column_stack([x,y]);area=np.sum(x[:-1]*y[1:]-x[1:]*y[:-1]);
  if (area>0)!=(i==0):v=v[::-1]
  rings.append(Path(v,[Path.MOVETO]+[Path.LINETO]*(len(v)-2)+[Path.CLOSEPOLY]))
 axes[1].add_patch(PathPatch(Path.make_compound_path(*rings),facecolor=colors.get(f['properties']['class'],'#e5e1cf'),edgecolor='none'))
axes[1].set_title('Classes importées OCS GE / RPG / IGN\npriorité documentée ; palettes illustratives')
for ax in axes:ax.set_xlim(extent[:2]);ax.set_ylim(extent[2:]);ax.set_aspect('equal');ax.set_xlabel('Lambert-93 E (m)');ax.set_ylabel('Lambert-93 N (m)');ax.ticklabel_format(style='plain',useOffset=False)
fig.savefig('docs/mission-08-5-captures/geographic-coverage.jpg',dpi=120)
