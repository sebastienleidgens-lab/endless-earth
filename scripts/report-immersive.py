"""Measured milestone-D results; software rendering is never hardware FPS."""
from pathlib import Path
import json,gzip,statistics,os,math
import numpy as np
from PIL import Image
os.environ.setdefault('MPLCONFIGDIR',str(Path('work/mission-11-d/mpl').resolve()))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=Path('docs/mission-11-evidence/optimization')
raw=p/'matrix.json'
if raw.exists():
 matrix=json.loads(raw.read_text());(p/'matrix.json.gz').write_bytes(gzip.compress(json.dumps(matrix,separators=(',',':')).encode()));raw.unlink()
else:matrix=json.loads(gzip.decompress((p/'matrix.json.gz').read_bytes()))
def stats(values):
 values=list(values)
 return {'count':len(values),'median':float(np.median(values)),'mean':float(np.mean(values)),'p95':float(np.quantile(values,.95)),'max':float(max(values))} if values else None
before,after=matrix['runs'];summary={'baseline':'95bc4b3 (milestone C)','method':matrix['method'],'profiles':[],'conditions':[],'frames':[],'pixels':[],'graphicsEnvironment':before['gpu'],'limits':'Shared software renderer, two alternating rounds, eight synchronized samples per condition/version/round. Relative completion timings, not physical GPU time or Android FPS. Native RAF summaries exclude the first two intervals after each deliberate harness pause. GPU timers are a separate small sequential software trial, with all raw values/disjoint flags retained.'}
for profile in ['eco','balanced','quality']:
 rows=[]
 for run in [before,after]:
  rr=[r for r in run['rows'] if r['profile']==profile]
  rows.append({'render':stats(s['synchronizedMs'] for r in rr for s in r['samples']),'atmosphereCpu':stats(v for r in rr for v in r['cpu']),'maxVoices':max((r['state']['audio'].get('voices') or 0) for r in rr),'maxCacheBytes':max((r['state']['audio'].get('cacheBytes') or 0) for r in rr),'maxPrograms':max(r['state']['render']['programs'] for r in rr),'maxTextures':max(r['state']['render']['textures'] for r in rr)})
 summary['profiles'].append({'profile':profile,'before':rows[0],'after':rows[1],'medianRenderChangePercent':100*(rows[1]['render']['median']/rows[0]['render']['median']-1)})
 for enabled in [False,True]:
  for name in ['morning-clear','afternoon-overcast','evening-rain','night-clear','night-storm']:
   ss=[]
   for run in [before,after]:
    rr=[r for r in run['rows'] if r['profile']==profile and r['name']==name and r['enabled']==enabled];ss.append(stats(s['synchronizedMs'] for r in rr for s in r['samples']))
   summary['conditions'].append({'profile':profile,'name':name,'sound':enabled,'before':ss[0],'after':ss[1],'changePercent':100*(ss[1]['median']/ss[0]['median']-1)})
   if name in ['morning-clear','night-storm']:
    for run in [before,after]:
     ff=[f for r in run['rows'] if r['profile']==profile and r['name']==name and r['enabled']==enabled for f in r['frames'][2:]]
     summary['frames'].append({'phase':run['phase'],'profile':profile,'name':name,'sound':enabled,'intervalMs':stats(f['intervalMs'] for f in ff),'cpuSubmitMs':stats(f['cpuSubmitMs'] for f in ff),'atmosphereMs':stats(f['atmosphereMs'] for f in ff)})
 for f in sorted(p.glob(f'before-{profile}-*.png')):
  a=np.asarray(Image.open(f)).astype(np.int16);b=np.asarray(Image.open(p/f.name.replace('before-','after-',1))).astype(np.int16);e=abs(a-b)
  summary['pixels'].append({'profile':profile,'scene':f.stem[len('before-')+len(profile)+1:],'meanAbsoluteByteError':float(e.mean()),'p99AbsoluteByteError':float(np.quantile(e,.99)),'maxAbsoluteByteError':int(e.max()),'fractionChannelsChangedByMoreThan1':float(np.mean(e>1))})
summary['pixelComparison']='Native rendered canvas PNGs, same camera/LOD/world clock and wind phase. Error per 8-bit RGBA channel, no generated/retouched evidence.'
# Preserve every raw GPU query: small samples and sequential order limit inference.
summary['graphicsTimers']=json.loads((p/'timers.json').read_text()) if (p/'timers.json').exists() else None
if (p/'session-15min.json').exists():
 session=json.loads((p/'session-15min.json').read_text());trace=json.loads(gzip.decompress((p/'session-trace.json.gz').read_bytes()));rows=trace['rows'];frames=trace['frames'];summary['session']={k:session[k] for k in ['wallSeconds','walkDistance','restarts','chapters','maxVoices','maxCacheBytes','maxPrograms','maxGeometries','loads','decodes','deferred','steps','heardBirds','roadEvents','initialHeap','finalHeap','errors']};summary['session']['frameIntervalsMs']=stats(f['intervalMs'] for f in frames);summary['session']['cpuSubmissionMs']=stats(f['cpuSubmitMs'] for f in frames)
 fig,ax=plt.subplots(2,1,figsize=(10,5.6),sharex=True);t=[r['seconds']/60 for r in rows];ax[0].plot(t,[r['audio']['cacheBytes']/1048576 for r in rows],color='#317458',label='Cache audio décodé');ax[0].axhline(24,color='#a34a32',ls='--',label='Limite 24 MiB');ax[0].set(ylabel='MiB',title='Session réelle avec rendu 3D et audio actifs');ax[0].legend(loc='lower right');ax[1].plot(t,[r['render']['geometries'] for r in rows],label='Géométries GPU',color='#536d9c');other=ax[1].twinx();other.plot(t,[r['render']['programs'] for r in rows],label='Programmes',color='#b47530');ax[1].set(xlabel='Minutes réelles',ylabel='Géométries');other.set_ylabel('Programmes');fig.tight_layout();fig.savefig(p/'session-stability.svg');plt.close(fig)
fig,ax=plt.subplots(figsize=(9,4));x=np.arange(3);width=.33;ax.bar(x-width/2,[r['before']['render']['median'] for r in summary['profiles']],width,label='C · avant',color='#aab7ad');ax.bar(x+width/2,[r['after']['render']['median'] for r in summary['profiles']],width,label='D · après',color='#337253');ax.set(xticks=x,xticklabels=['Éco','Équilibré','Qualité'],ylabel='Millisecondes par rendu synchronisé',title='Comparaison C → D · SwiftShader · 800 × 600');ax.set_ylim(bottom=0);ax.legend();ax.grid(axis='y',alpha=.2);ax.set_axisbelow(True);fig.tight_layout();fig.savefig(p/'render-comparison.svg');plt.close(fig)
for f in p.glob('*.svg'):f.write_text('\n'.join(line.rstrip() for line in f.read_text().splitlines())+'\n')
(p/'summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
for r in summary['profiles']:print(r['profile'],r['before']['render']['median'],r['after']['render']['median'],r['medianRenderChangePercent'])
print('Image error max',max(r['maxAbsoluteByteError'] for r in summary['pixels']),'P99 max',max(r['p99AbsoluteByteError'] for r in summary['pixels']))
