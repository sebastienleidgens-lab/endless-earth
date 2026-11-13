import os,pathlib
os.environ.setdefault('MPLCONFIGDIR',str(pathlib.Path('work/mission-19/matplotlib').resolve()))
os.environ['XDG_CACHE_HOME']=str(pathlib.Path('work/mission-19/cache').resolve())
pathlib.Path(os.environ['XDG_CACHE_HOME']).mkdir(parents=True,exist_ok=True)
import json,gzip,pathlib,math,statistics
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=pathlib.Path('docs/mission-19-evidence');s=json.loads((p/'soak.json').read_text());trace=json.loads(gzip.decompress((p/'soak-trace.json.gz').read_bytes()));frames=trace['frames'];rows=[r for r in trace['rows'] if 'audio' in r];t0=frames[0]['t'];time=[(f['t']-t0)/1000 for f in frames]
q=lambda a,t:sorted(a)[math.ceil((len(a)-1)*t)]
chapters=[]
for i,c in enumerate(s['chapters']):
 end=s['chapters'][i+1]['seconds'] if i+1<len(s['chapters']) else s['wallSeconds'];a=[f for f,t in zip(frames,time) if c['seconds']<=t<end];chapters.append({**c,'endSeconds':end,'frames':len(a),'metres':sum(f['step'] for f in a),'frameMedianMs':q([f['ms'] for f in a],.5),'frameP95Ms':q([f['ms'] for f in a],.95),'geometryRange':[min(f['gpu']['geometries'] for f in a),max(f['gpu']['geometries'] for f in a)]})
idle=peak_idle=0
for f in frames:
 idle=idle+f['ms']/1000 if f['step']<.00001 else 0;peak_idle=max(peak_idle,idle)
summary={'protocol':'Analysis of the untouched continuous native trace. Frame intervals are native; chart quantiles use 30-second bins, not smoothed or reconstructed video. GPU allocation is logical storage, not physical VRAM. GC heap samples span different places, seasons and profiles; no hardware leak guarantee inferred.','durationSeconds':s['nativeSeconds'],'allSixChaptersHaveActualTravel':len(chapters)==6 and all(c['metres']>10 for c in chapters),'chapters':chapters,'longestConsecutiveStationarySeconds':peak_idle,'arrivals':len(s['arrivals']),'routeStarts':len(s['routeStarts']),'terminalRestarts':s['stalls'],'maxInstallsInOneFrame':max(f['stream'].get('installsThisFrame',0) for f in frames),'maxInstallCpuMs':max(f['stream'].get('installCpuMs',0) for f in frames),'maxForestSelectionCpuMs':max(f['forest']['cpuMs'] for f in frames),'maxWindCacheCpuMs':max(f['forest'].get('windCacheCpuMs',0) for f in frames),'maxActorShadowCpuMs':max(f['actorShadow'].get('lastCpuMs',0) for f in frames),'maxAudioCpuMs':max(r['audio'].get('cpuMs',0) for r in rows),'maxAudioVoices':max(r['audio'].get('voices',0) for r in rows),'maxDecodedAudioBytes':max(r['audio'].get('cacheBytes',0) for r in rows),'heapAfterGCBytesRange':[min(x['heapAfterGC'] for x in s['samples']),max(x['heapAfterGC'] for x in s['samples'])],'logicalGpuBufferBytesRange':[min(x['alloc']['bufferBytes'] for x in s['samples']),max(x['alloc']['bufferBytes'] for x in s['samples'])],'jsErrors':s['errors'],'warnings':s['warnings']}
(p/'soak-analysis.json').write_text(json.dumps(summary,indent=2)+'\n')
plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'white','axes.facecolor':'#f5f7f5','svg.fonttype':'none','svg.hashsalt':'mission19-native-soak'})
fig,axes=plt.subplots(3,1,figsize=(13,9),sharex=True,layout='constrained');metres=[];d=0
for f in frames:d+=f['step'];metres.append(d)
axes[0].plot([t/60 for t in time],metres,color='#28694d',linewidth=1.5);axes[0].set_ylim(0,max(metres)*1.20);axes[0].set_ylabel('Distance native (m)');axes[0].set_title('Mission 19 · séance continue, sans relocalisation',loc='left',fontweight='bold')
bins=[];med=[];p95=[]
for start in range(0,math.ceil(s['wallSeconds']),30):
 a=[f['ms'] for f,t in zip(frames,time) if start<=t<start+30]
 if a:bins.append((start+15)/60);med.append(q(a,.5));p95.append(q(a,.95))
axes[1].plot(bins,med,label='Médiane / tranche de 30 s',color='#28694d');axes[1].plot(bins,p95,label='P95 / tranche de 30 s',color='#b57932');axes[1].set_ylabel('Intervalle natif (ms)');axes[1].legend(loc='upper right');axes[1].set_title('Chromium / SwiftShader logiciel · aucune revendication de FPS matériels',loc='left',fontsize=10)
samples=s['samples'];mt=[r['seconds']/60 for r in samples];axes[2].plot(mt,[r['heapAfterGC']/1048576 for r in samples],marker='.',label='Heap JS après GC');axes[2].plot(mt,[r['alloc']['bufferBytes']/1048576 for r in samples],marker='.',label='Buffers GPU logiques');axes[2].plot(mt,[r['alloc']['textureBytesEstimate']/1048576 for r in samples],marker='.',label='Textures GPU estimées');axes[2].set_ylabel('Mémoire suivie (Mio)');axes[2].set_xlabel('Temps réel (minutes)');axes[2].legend(loc='best')
labels=['Équilibré · juillet','Éco · janvier / neige','Qualité · octobre','Équilibré · janvier','Qualité · avril / pluie','Équilibré · juillet']
for ax in axes:
 ax.grid(alpha=.2);ax.set_xlim(0,s['wallSeconds']/60)
 for i,c in enumerate(s['chapters']):
  start=c['seconds']/60;end=(s['chapters'][i+1]['seconds'] if i+1<len(s['chapters']) else s['wallSeconds'])/60
  if i%2:ax.axvspan(start,end,color='#d6ded8',alpha=.3,zorder=-5)
  ax.axvline(start,color='#8f9b91',linewidth=.5)
for i,c in enumerate(s['chapters']):axes[0].text(c['seconds']/60+.12,.93,labels[i],transform=axes[0].get_xaxis_transform(),fontsize=8,rotation=0)
fig.savefig(p/'soak-timeline.svg',metadata={'Date':None,'Creator':'Mission 19 native trace analysis'});fig.savefig('work/mission-19/soak-timeline.png',dpi=110);plt.close(fig)
svg=p/'soak-timeline.svg';svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
print('Native analysis:',summary['allSixChaptersHaveActualTravel'],'chapters',len(chapters),'longest stationary',round(peak_idle,2),'seconds')
