"""Summarize observed browser traces; never substitute traces for listening."""
import json, math, subprocess
from pathlib import Path
from datetime import datetime
p=Path('docs/mission-11-evidence/coherence')
def time_ms(e): return e.get('worldTimeMs',datetime.fromisoformat(e['date'].replace('Z','+00:00')).timestamp()*1000)
def stats(name):
 d=json.loads((p/f'{name}.json').read_text()); rows=d['rows']
 return {'observations':len(rows),'maxClockDifferenceMs':max(abs(time_ms(r['environment'])-r['audio']['worldTimeMs']) for r in rows),'maxWindDifference':max(abs(r['environment']['wind']['speed']-r['audio']['weather']['wind']) for r in rows),'sameEnvironmentAll':all(r['sharedObject'] for r in rows),'sameWeatherReferenceAll':all(r['weatherReference'] for r in rows),'maxVoices':max(r['audio']['voices'] for r in rows),'maxCacheBytes':max(r['audio']['cacheBytes'] for r in rows),'errors':d['errors']}
summary={'before':stats('before'),'after':stats('after')}
if (p/'realtime.json').exists():
 d=json.loads((p/'realtime.json').read_text()); rows=d['rows']; commands=d['commands']; origin=commands[0]['audioTime']; summary['realtime']=stats('realtime')
 summary['chapters']=[{'name':c['label'],'seconds':round(c['audioTime']-origin,3),'moment':c['moment'],'weather':c['weather']} for c in commands]
 summary['transitions']=[]
 for i,c in enumerate(commands):
  if i==0:continue
  start=c['wallMs']; end=commands[i+1]['wallMs'] if i+1<len(commands) else math.inf
  section=[r for r in rows if start<r['wallMs']<end]
  def first(predicate):
   return next((round((r['wallMs']-start)/1000,3) for r in section if predicate(r)),None)
  row={'name':c['label'],'rainVisibleAtSeconds':first(lambda r:r['environment']['weather']['rain']>.05 and r['rain']['visible']),'rainSourceAtSeconds':first(lambda r:any(v['asset'].startswith('rain-') and v['gain']>.4 and v['retirementGain']>.9 for v in r['audio']['activeSources'])),'noRainSourceAtSeconds':first(lambda r:not any(v['asset'].startswith('rain-') for v in r['audio']['activeSources'])),'rainSettledAtSeconds':first(lambda r:abs(r['environment']['weather']['rain']-({'rain':.6,'storm':1}.get(c['weather'],0)))<.02),'solarAtEnd':section[-1]['environment']['solar']['altitude'],'birdVoicesAtEnd':sum(v['asset'].startswith('bird-') for v in section[-1]['audio']['activeSources'])}
  summary['transitions'].append(row)
 summary['realtime']['frames']=rows[-1]['frames']-rows[0]['frames'];summary['realtime']['audioSeconds']=round(rows[-1]['audioTime']-rows[0]['audioTime'],3);summary['realtime']['birdsAccepted']=rows[-1]['audio']['heardBirds']-rows[0]['audio']['heardBirds'];summary['realtime']['maxRealtimeClockErrorMs']=max(abs(r['environment']['worldTimeMs']-r['wallMs']) for r in rows if r['label']=='temps-reel' and r['wallMs']>commands[-1]['wallMs']+4000)
 # Plot an actual shared gust segment: same x-axis for rendered GPU uniform,
 # local wind passed to audio and native audio bus gain. No waveform synthesis.
 import os
 os.environ.setdefault('MPLCONFIGDIR',str(Path('work/mission-11-c/mpl').resolve()))
 import matplotlib
 matplotlib.use('Agg')
 import matplotlib.pyplot as plt
 chapter=commands[1]; end=commands[2]['wallMs']; segment=[r for r in rows if chapter['wallMs']<=r['wallMs']<=end]
 t=[(r['wallMs']-chapter['wallMs'])/1000 for r in segment]
 fig,ax=plt.subplots(figsize=(10,3.5));ax.plot(t,[r['environment']['wind']['speed'] for r in segment],label='Vent local partagé',color='#276f53');ax.plot(t,[math.hypot(*r['uniforms']['wind']) for r in segment],label='Uniforme végétation Éco (norme)',ls=':',color='#173b65');ax.plot(t,[next((l['actualBusGain'] for l in r['audio']['layers'] if l['id']=='foliage'),0) for r in segment],label='Gain réel du bus feuillage',color='#b36a31');ax.set(xlabel='Secondes depuis la commande après-midi venteux',ylabel='Valeurs simulées / gain linéaire',title='Une rafale partagée, avec le lissage natif du son');ax.legend(loc='upper left');ax.grid(alpha=.2);fig.tight_layout();fig.savefig(p/'gust-coherence.svg');plt.close(fig)
 for f in [p/'gust-coherence.svg']:f.write_text('\n'.join(s.rstrip() for s in f.read_text().splitlines())+'\n')
if (p/'ambiances.webm').exists():
 import numpy as np
 media=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height,sample_rate,channels','-of','json',str(p/'ambiances.webm')],text=True))
 (p/'media.json').write_text(json.dumps(media,indent=2)+'\n')
 samples=np.frombuffer(subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p/'ambiances.webm'),'-vn','-f','f32le','-ar','32000','-ac','2','pipe:1']),dtype=np.float32).reshape(-1,2)
 levels={'method':'Decode canonical VP8/Opus AV capture to 32 kHz float stereo without gain filter or normalization. RMS includes both channels; chapter levels skip the first 4 seconds of each transition. Lossy codec samples, not a separate sound mix.','durationSeconds':len(samples)/32000,'peak':float(abs(samples).max()),'rms':float(np.sqrt(np.mean(samples.astype(np.float64)**2))),'clippedSamples':int(np.count_nonzero(abs(samples)>=1)),'chapters':[]}
 for i,c in enumerate(summary['chapters']):
  start=c['seconds']+4;end=summary['chapters'][i+1]['seconds'] if i+1<len(summary['chapters']) else len(samples)/32000
  a=samples[int(start*32000):int(end*32000)].astype(np.float64);rms=float(np.sqrt(np.mean(a*a)))
  levels['chapters'].append({'name':c['name'],'rms':rms,'rmsDbFS':20*math.log10(max(rms,1e-12)),'peak':float(abs(a).max())})
 (p/'levels.json').write_text(json.dumps(levels,indent=2)+'\n')
summary['limits']='Clock/wind equality refers to shared state at sampled frames. Audio beds retain their bounded 2/4 Hz mix cadence and native smoothing; samples are real recordings, not a physical leaf-by-leaf sound model. Timing observations are bracketed by roughly .45–.8 s polling plus browser/UI cost. SwiftShader AV recording is not physical GPU/Android validation. No human listening or aesthetic acceptance claimed.'
(p/'summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(summary,indent=2,ensure_ascii=False))
