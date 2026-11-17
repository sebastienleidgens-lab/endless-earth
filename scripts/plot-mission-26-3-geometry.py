import json,math,pathlib
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
r=pathlib.Path('docs/mission-26-3-evidence');fig=plt.figure(figsize=(12,9));colors={'reference':'#ad4d36','candidate':'#08785d'}
for n,label in enumerate(['reference','candidate']):
 d=json.load(open(r/f'geometry-{label}-3d/car-support.json'));c=d['cases'][0];p=c['result']['local'];h=c['heading'];ax=fig.add_subplot(2,2,n+1,projection='3d')
 def transform(v):
  x,z=v[0]-p['x'],v[2]-p['z'];return [x*math.cos(h)-z*math.sin(h),x*math.sin(h)+z*math.cos(h),v[1]]
 for kind,color in [('terrain','#a7b08c'),('road','#737a7d')]:
  polys=[list(map(transform,t['vertices']))for m in c['meshPatch']['meshes']if m['kind']==kind for t in m['triangles']];ax.add_collection3d(Poly3DCollection(polys,alpha=.75,facecolor=color,edgecolor='#303934',linewidth=.15))
 q=c['result']['corners'];ax.scatter([a['u']for a in q],[a['v']for a in q],[a['car']['height']for a in q],color='#164dce',s=22,depthshade=False)
 ax.set(xlim=(-5,5),ylim=(-5,5),zlim=(-35.85,-34.8),xlabel='Transversal (m)',ylabel='Sens de conduite (m)',zlabel='Y relatif IGN69 (m)',title=f'{label} — {d["sourceSHA"][:10]}')
 ax.view_init(elev=25,azim=-58)
for i,axis in enumerate(['along','across']):
 ax=fig.add_subplot(2,2,i+3)
 for label in ['reference','candidate']:
  d=json.load(open(r/f'geometry-{label}-3d/car-support.json'));c=d['cases'][0];a=c['result']['sections'][axis];x=[(k-50)*.1 for k in range(len(a))];ax.plot(x,[q['car'].get('height')for q in a],label=label,color=colors[label],lw=1.8)
 ax.set(xlabel='Distance au point signalé (m)',ylabel='Contact Y relatif IGN69 (m)',title='Coupe '+('longitudinale'if axis=='along'else'transversale'));ax.grid(alpha=.2);ax.legend();ax.axvline(0,color='#303030',alpha=.3,lw=.5)
fig.suptitle('Raccord 3,883 km — maillages réellement affichés et cinq appuis de coque\n46,577320 N · 0,631644 E · OSM way927245732 · tuile126:1614',fontsize=13)
fig.text(.03,.015,'Triangles Float32 visibles non modifiés ; coupes à pas0,1m. Y relatif : ajouter101,2m pour IGN69. IGN/OSM, licences historiques conservées.',fontsize=8)
fig.tight_layout(rect=(0,.035,1,.925));fig.savefig(r/'geometry-comparison.svg');plt.close(fig)
