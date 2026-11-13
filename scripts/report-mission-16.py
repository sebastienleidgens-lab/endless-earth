import json,pathlib,gzip,statistics,subprocess
from PIL import Image,ImageDraw
root=pathlib.Path('docs/mission-16-evidence');plots=root/'summary';plots.mkdir(exist_ok=True)
facades=json.loads((root/'facades/measurements.json').read_text());rows=[]
for stage in ['M15','M16']:
 for profile in ['eco','balanced','quality']:
  for f in [1,2,3]:
   r=[x for x in facades['rows'] if x['stage']==stage and x['profile']==profile and x['face']==f];L=[x['sample']['luminance'] for x in r];rows.append({'stage':stage,'profile':profile,'face':f,'luminance':L,'rangePercent':(max(L)/min(L)-1)*100,'nearFarPercent':(L[0]/L[-1]-1)*100})
(root/'facade-summary.json').write_text(json.dumps({'method':facades['method'],'rows':rows},indent=2)+'\n')
# Native screenshots arranged for review; source files remain unedited.
pairs=['facade','fenetres','route-pente','entree-pont','pont','randonneur-dos','randonneur-face','temps-nuit','courant-moulin']
w,h=960,640;sheet=Image.new('RGB',(w*2,(h+38)*len(pairs)),(20,27,25));draw=ImageDraw.Draw(sheet)
for i,name in enumerate(pairs):
 for j,stage in enumerate(['M15','M16']):
  p=root/'scenes'/f'{stage}-{name}.jpg'
  if p.exists():sheet.paste(Image.open(p),(j*w,i*(h+38)+38));draw.text((j*w+14,i*(h+38)+12),stage+' - '+name,fill='white')
sheet.thumbnail((1280,6000));sheet.save(plots/'comparison.jpg',quality=86)
try:
 import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
 fig,ax=plt.subplots(figsize=(8,4))
 for s,c in [('M15','#9c7a57'),('M16','#376d61')]:
  for f in [1,2,3]:
   r=next(x for x in rows if x['stage']==s and x['profile']=='balanced' and x['face']==f);v=r['luminance'];ax.plot([5,10,20,40,80,120],[100*z/v[-1] for z in v],label=f'{s} facade {f}',color=c,linestyle=['-','--',':'][f-1])
 ax.set(xlabel='Distance camera (m)',ylabel='Luminance / valeur a 120 m (%)',title='Vraies facades - meme empreinte de mesure, meme soleil');ax.legend(ncol=2);ax.grid(alpha=.2);fig.tight_layout();fig.savefig(plots/'facades.png',dpi=160);plt.close(fig)
 profiles=json.loads(gzip.decompress((root/'road-profiles.json.gz').read_bytes()));r=next(x for x in profiles if x['id']==900319308)['samples'];fig,ax=plt.subplots(figsize=(8,3));ax.plot([x['chain'] for x in r],[x['before'] for x in r],label='M15');ax.plot([x['chain'] for x in r],[x['after'] for x in r],label='M16');ax.set(xlabel='Distance sur la Rue du Pont (m)',ylabel='Hauteur relative du jeu (m)',title='Meme support que le maillage affiche - reconstruction declaree');ax.legend();ax.grid(alpha=.2);fig.tight_layout();fig.savefig(plots/'road-profile.png',dpi=160);plt.close(fig)
except ImportError: pass
if (root/'after-bridge-native.json').exists():
 frames=json.loads(gzip.decompress((root/'after-bridge-trace.json.gz').read_bytes()));first=frames[0]['t']
 for mode in ['walk','run']:
  selected=[f for f in frames if f['gait'] and f['gait']['mode']==mode and f['gait']['speed']>.8];f=selected[len(selected)//2];seconds=max(0,(f['t']-first)/1000);subprocess.run(['ffmpeg','-v','error','-y','-ss',str(seconds),'-i',str(root/'after-bridge-native.webm'),'-frames:v','1',str(plots/f'native-walker-{mode}.jpg')],check=True)
 print('Native gait images extracted from unretimed film')
print('Review contact sheet, measured facade plot and road profile prepared')
