"""Standalone audit figures, using the receipts rather than inferred outcomes."""
import gzip,json,pathlib,os
os.environ.setdefault('MPLCONFIGDIR','/tmp/endless-earth-m261-matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/mission-26-1-evidence'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'svg.fonttype':'none','svg.hashsalt':'mission-26-1','axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'#f2f1e7','axes.facecolor':'#fafaf4','text.color':'#243c35','axes.labelcolor':'#243c35','xtick.color':'#53645b','ytick.color':'#53645b'})
def load(name,default=None):
 p=OUT/name
 return json.loads(p.read_text()) if p.exists() else default
def save(fig,name):
 fig.savefig(OUT/name,bbox_inches='tight',metadata={'Date':None,'Creator':'Endless Earth · audit Mission 26.1'});plt.close(fig)

candidate,reference=load('candidate-benchmark.json',{}),load('reference-benchmark.json',{})
labels=[];before=[];after=[]
for profile in ['eco','balanced','quality']:
 for scene in ['forest','bridge','river']:
  a=next((c for c in candidate.get('cases',[]) if c['name']==scene and c['profile']==profile and c.get('valid')),None)
  b=next((c for c in reference.get('cases',[]) if c['name']==scene and c['profile']==profile and c.get('valid')),None)
  if a and b:labels.append(scene+' · '+profile);before.append(b['stats']['p50']);after.append(a['stats']['p50'])
if labels:
 fig,ax=plt.subplots(figsize=(9,6));y=list(range(len(labels)))
 ax.barh([i-.18 for i in y],before,height=.34,color='#aeb8a2',label='M26 · de3958c')
 ax.barh([i+.18 for i in y],after,height=.34,color='#346f60',label='M26.1 · scènes terrestres inchangées depuis 9d6d0d6')
 ax.set_yticks(y,labels);ax.invert_yaxis();ax.set_xlabel('Médiane de l’intervalle de frame (ms) · plus petit est meilleur');ax.set_title('Rendu actif isolé · 640 × 420, DPR 1, son actif',loc='left',pad=16);ax.legend(loc='lower right',fontsize=8);ax.grid(axis='x',alpha=.15);ax.set_axisbelow(True)
 fig.text(.12,-.015,'Chromium / SwiftShader : logiciel, pas un GPU matériel. Échantillons courts ; aucun objectif 60/30 FPS certifié.',fontsize=9);save(fig,'performance.svg')

fig,ax=plt.subplots(figsize=(7,8));ax.add_patch(Rectangle((-1000,-1000),2000,2000,fill=False,edgecolor='#a17b40',linewidth=1.4,linestyle='--',label='Ancienne limite du propriétaire pilote'))
west=load('angles-west-final.json',{})
for key,color,label,style in [('outward','#5d8b64','Contrôleur accéléré · aller','-'),('return','#7ea6a0','Contrôleur accéléré · retour',':')]:
 points=[q['position'] for q in west.get(key,{}).get('trace',[])]
 if points:ax.plot([p[0] for p in points],[p[2] for p in points],color=color,linewidth=2,linestyle=style,label=label)
old=load('previous-runtime-4acde98/angles-west-controller.json',{})
if old.get('outward',{}).get('end'):
 p=old['outward']['end'];ax.scatter(p[0],p[2],marker='x',s=75,color='#a54d3c',label='Ancien arrêt au raccord · 1 159,73 m',zorder=5)
native=load('angles-native-departure.json',{})
frames=native.get('frames',[])
if native.get('framesFile'):
 with gzip.open(OUT/native['framesFile'],'rt') as f:frames=json.load(f)
if frames:
 ax.plot([f['position'][0] for f in frames],[f['position'][2] for f in frames],color='#315e99',linewidth=1.1,label='Trace native réelle'+(' · complète' if native.get('completed') else ' · interrompue'),alpha=.9)
if west.get('outward',{}).get('start'):
 p=west['outward']['start'];ax.scatter(p[0],p[2],s=38,color='#243c35',label='Vrai départ seedé',zorder=6)
ax.set(xlim=(-1100,1100),ylim=(1100,-1300),xlabel='X Est · repère historique local (m)',ylabel='Z Sud · repère historique local (m)');ax.set_aspect('equal');ax.grid(alpha=.15);ax.set_title('Angles : propriété du terrain et traces réellement produites',loc='left',pad=15);ax.legend(fontsize=8,loc='lower right');fig.text(.12,-.015,'Schéma du jeu, sans fond cartographique. Les parcours courts ne prouvent pas une traversée du département.',fontsize=8);save(fig,'journey-map.svg')

record=load('candidate-capture.json',{})
clips=[c for c in record.get('cases',[]) if c.get('frames')]
if clips:
 start=min(c['frames'][0]['t'] for c in clips)
 fig,(ax,objects)=plt.subplots(2,1,figsize=(10,6),sharex=True,gridspec_kw={'height_ratios':[2,1]})
 for c in clips:
  f=c['frames'];t=[(q['t']-start)/60000 for q in f];ax.plot(t,[q.get('heap',0)/1048576 for q in f],color='#346f60',linewidth=1);objects.plot(t,[q.get('memory',{}).get('geometries',0) for q in f],color='#8b7658',linewidth=1)
 ax.set_title('Même contexte natif · fenêtres observées de la campagne 4acde98',loc='left',pad=14);ax.set_ylabel('Heap JS estimé (MiB)');objects.set_ylabel('Géométries');objects.set_xlabel('Minutes depuis la première frame enregistrée');ax.grid(alpha=.15);objects.grid(alpha=.15)
 fig.text(.12,-.015,'Placements diagnostiques entre clips ; gaps non interpolés. Hors mémoire GPU/driver et hors capture stockée côté hôte.',fontsize=9);save(fig,'memory.svg')
print('Standalone figures generated from existing receipts.')
