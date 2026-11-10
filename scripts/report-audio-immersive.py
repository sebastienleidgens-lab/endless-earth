"""Report digital signal levels and the documented gain law; no audibility or
artistic approval is inferred from these measurements. Do not normalize files.
"""
import os,pathlib,json,math,csv,subprocess
os.environ.setdefault('MPLCONFIGDIR',str(pathlib.Path('work/mission-11-b/mpl').resolve()))
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
D=pathlib.Path('docs/mission-11-evidence/audio');B=json.load(open(D/'before.json'));A=json.load(open(D/'after.json'))
prior={r['scenario']['id']:r for r in B['rows']};rows=[]
def db(x):return 20*math.log10(x) if x>0 else None
for r in A['rows']:
 b=prior[r['scenario']['id']];row={'id':r['scenario']['id'],'durationSeconds':r['scenario']['duration'],'beforeRmsDbFS':db(b['signal']['rms']),'afterRmsDbFS':db(r['signal']['rms']),'rmsChangeDb':db(r['signal']['rms']/b['signal']['rms']) if b['signal']['rms']>0 else None,'beforePeakDbFS':db(b['signal']['peak']),'afterPeakDbFS':db(r['signal']['peak']),'beforeStartedEvents':sum(e['played'] for e in b['events']),'afterStartedEvents':sum(e['played'] for e in r['events']),'birdsStarted':r['stats']['heardBirds'],'roadPassesStarted':r['stats']['roadEvents'],'peakVoices':r['stats']['peakVoices'],'peakCacheBytes':r['stats']['peakBytes'],'waterBefore':b['original']['context'].get('water'),'waterAfter':r['original']['context'].get('water')};rows.append(row)
json.dump({'method':'Unnormalized float output of the actual AcousticRenderer graph; master .7; RMS over full scenario including natural silence, not acoustic dB SPL. Before/after are same mapped stations, date, weather and director seeds. Silence is null rather than a fabricated floor. Event counts mean accepted audio voices, not a claim of human hearing. Ogg review files use Opus 96 kbps without gain normalization.','rows':rows},open(D/'levels.json','w'),indent=2)
with open(D/'levels.csv','w') as f:
 w=csv.DictWriter(f,fieldnames=[k for k in rows[0] if not k.startswith('water')],lineterminator='\n');w.writeheader();w.writerows({k:v for k,v in r.items() if not k.startswith('water')} for r in rows)
smooth=lambda a,b,x: np.clip((x-a)/(b-a),0,1)**2*(3-2*np.clip((x-a)/(b-a),0,1))
d=np.linspace(0,160,641);gain=.56/(1+(d/18)**1.5)*(1-smooth(95,150,d))
with open(D/'river-gain.csv','w') as f:
 w=csv.writer(f,lineterminator="\n");w.writerow(['physical_distance_m','target_water_bus_gain','master_gain']);w.writerows(zip(d,gain,[.385]*len(d)))
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10})
fig,ax=plt.subplots(1,2,figsize=(13,4.7),layout='constrained');ax[0].plot(d,gain,color='#315e88',lw=2);ax[0].set(xlabel='Proximité physique estimée de l’eau (m)',ylabel='Gain cible du bus eau (linéaire)',title='Rivière : atténuation progressive, sans socle lointain',xlim=(0,160),ylim=(0,.6));ax[0].grid(alpha=.2)
a=next(r for r in A['rows'] if r['scenario']['id']=='river-walk');b=prior['river-walk'];ax[1].plot(b['signal']['secondsDbFS'],label='Avant · mix complet',color='#8b9b89',lw=1);ax[1].plot(a['signal']['secondsDbFS'],label='Après · mix complet',color='#315e88',lw=1);ax[1].set(xlabel='Temps de la promenade rejouée (s)',ylabel='RMS sur 1 seconde (dBFS)',title='Même promenade : approche, arrêt, éloignement',ylim=(-110,-25));ax[1].grid(alpha=.2);ax[1].legend(loc='lower left');fig.savefig(D/'river-gain-and-walk.svg');fig.savefig(D/'river-gain-and-walk.png',dpi=140);plt.close(fig)
# Short, seek-free excerpts cut from naturally scheduled actual renderer output.
traffic=next(r for r in A['rows'] if r['scenario']['id']=='village-traffic');first=next(e for e in traffic['events'] if e['played'] and e['id']=='traffic');start=max(0,first['time']-5)
for ident,start,length in [('village-traffic',start,40),('river-bank',20,30),('birds-isolated',5,65)]:
 stem='traffic-excerpt' if ident=='village-traffic' else 'river-bank-excerpt' if ident=='river-bank' else 'birds-excerpt'
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(start),'-i',f'work/mission-11-b/renders/after-{ident}.wav','-t',str(length),'-c:a','libopus','-b:a','96k',str(D/f'after-{stem}.ogg')],check=True)
json.dump({'traffic':{'original':'after-village-traffic.ogg','originalEventTimeSeconds':first['time'],'excerptStartSeconds':max(0,first['time']-5),'durationSeconds':40,'forcedEvent':False},'river':{'original':'after-river-bank.ogg','excerptStartSeconds':20,'durationSeconds':30},'birds':{'original':'after-birds-isolated.ogg','excerptStartSeconds':5,'durationSeconds':65},'normalization':False},open(D/'excerpts.json','w'),indent=2)
print('LEVELS',len(rows),'scenarios; natural traffic first pass',first['time'],'s; no normalization')

# Normalize generated vector/CSV text for the repository.
for name in ['levels.csv','river-gain.csv','river-gain-and-walk.svg']:
 p=D/name;p.write_text('\n'.join(line.rstrip() for line in p.read_text().splitlines())+'\n')
