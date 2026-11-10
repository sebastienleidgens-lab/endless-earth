"""Build real, independent recordings, with conservative offline trimming.
Requirements: Python/numpy and FFmpeg. --download fetches only documented public
files; source HQ MP3 previews are labelled honestly, never called original WAVs.
Output FLAC (PCM16/32 kHz) avoids another perceptual-codec generation.
"""
import pathlib,json,subprocess,hashlib,argparse,html,math
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'public/audio';W=ROOT/'work/mission-10-1';ORIG=W/'originals';ORIG.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--download',action='store_true');args=parser.parse_args()
sources=json.load(open(OUT/'sources.json'));assets={};selections=[]
def decode(p):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ac','1','-ar','32000','-f','f32le','-']),dtype='<f4').copy()
def select_windows(a,kind):
 rate=32000
 if kind.startswith('step-'):
  # Independent transients from each recording, not time/pitch variants.
  block=160;env=np.sqrt(np.mean(np.pad(a,(0,(-len(a))%block)).reshape(-1,block)**2,axis=1));peaks=[]
  for i in np.argsort(env)[::-1]:
   if i<6 or i*block>len(a)-int(.25*rate):continue
   if all(abs(i-j)*block>.52*rate for j in peaks):peaks.append(int(i))
   if len(peaks)>=3:break
  windows=[]
  for i in sorted(peaks):
   start=i*block-int(.065*rate);end=min(len(a),i*block+int(.23*rate));windows.append((max(0,start)/rate,(end-max(0,start))/rate))
  return windows
 if kind.startswith('bird-'):
  # Pick separated high-SNR phrases; retain source-relative timing in manifest.
  length=min(6.5,len(a)/rate);hop=int(.5*rate);size=int(length*rate)
  candidate=[(float(np.mean(a[start:start+size]**2)),start) for start in range(0,max(1,len(a)-size+1),hop)];chosen=[]
  for _,start in sorted(candidate,reverse=True):
   if all(abs(start-q)>=size*1.5 for q in chosen):chosen.append(start)
   if len(chosen)>=3:break
  return [(q/rate,length) for q in sorted(chosen)]
 return [(min(1,max(0,len(a)/rate-25)),min(38,max(.1,len(a)/rate-1)))]
for source in sources:
 p=ORIG/source['originalFile']
 if args.download:subprocess.run(['curl','-fLsS','--max-time','120',source['url'],'-o',str(p)],check=True)
 if hashlib.sha256(p.read_bytes()).hexdigest()!=source['sha256']:raise ValueError('Source checksum changed: '+source['id'])
 a=decode(p);kind=source['group'];windows=select_windows(a,kind)
 for index,(start,duration) in enumerate(windows):
  ident=f"{kind}-{source['id']}-{index+1}";raw=a[int(start*32000):int((start+duration)*32000)].copy()
  # Remove DC/handling rumble with conservative filters, no heavy denoise,
  # dynamic compressor or loudness levelling that raises a noise floor.
  hp=500 if kind.startswith('bird-') else 130 if kind.startswith('step-') else 170 if kind=='water' else 160
  filtered=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar','32000','-ac','1','-i','-','-af',f'highpass=f={hp},lowpass=f=11000','-f','f32le','-'],input=raw.astype('<f4').tobytes()),dtype='<f4').copy()
  peak=float(np.max(np.abs(filtered))) if len(filtered) else 0;rms=float(np.sqrt(np.mean(filtered**2))) if len(filtered) else 0
  if peak<.0001 or rms<.00001:raise ValueError('Silent/low-level candidate: '+ident)
  target=.30 if kind.startswith('step-') else .36 if kind.startswith('bird-') else .28
  scale=min(target/peak,6);filtered*=scale
  fade=min(int(.008*32000) if kind.startswith('step-') else int(.08*32000) if kind.startswith('bird-') else int(1.2*32000),len(filtered)//4)
  if fade:filtered[:fade]*=np.sin(np.linspace(0,np.pi/2,fade))**2;filtered[-fade:]*=np.sin(np.linspace(np.pi/2,0,fade))**2
  file=ident+'.flac';subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar','32000','-ac','1','-i','-','-c:a','flac','-sample_fmt','s16',str(OUT/file)],input=filtered.astype('<f4').tobytes(),check=True)
  transformations={'startSeconds':round(start,5),'durationSeconds':round(len(filtered)/32000,5),'highpassHz':hp,'lowpassHz':11000,'linearGain':scale,'peakBeforeGain':peak,'rmsBeforeGain':rms,'fadeSeconds':fade/32000,'sampleRate':32000,'channels':1,'codec':'FLAC PCM16; no dynamic compression; source HQ MP3 remains lossy where documented'}
  data=(OUT/file).read_bytes();assets[ident]=dict(file=file,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),duration=len(filtered)/32000,channels=1,sampleRate=32000,source=source['id'],provisional=False,license=source['license'],group=kind,transformations=transformations,review='rights/metadata/signal screened; owner listening pending')
  selections.append({'asset':ident,'recording':source['id'],**transformations})
(OUT/'manifest.json').write_text(json.dumps({'version':2,'independentRecordings':len(sources),'review':'No human listening claimed; perceptual approval pending','assets':assets},indent=2)+'\n')
credits='<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sons et licences · Mission 10.1</title><style>body{max-width:900px;margin:2rem auto;padding:1rem;font:16px/1.6 system-ui;color:#243a2e;background:#eef1e8}li{margin:1rem 0}a{color:#285b49}</style><h1>Bibliothèque naturaliste</h1><p>Budget 0 €. '+str(len(sources))+' captations indépendantes ; les découpes ne sont pas comptées comme nouvelles prises. Aucune observation d’espèce à Angles n’est revendiquée. Validation perceptive par le propriétaire à effectuer. Les sources Freesound sont les aperçus HQ MP3 publics du fournisseur, pas les WAV originaux ; encodage final FLAC sans compression perceptuelle supplémentaire.</p><ul>'
for s in sources:credits+='<li><a href="'+html.escape(s['page'],quote=True)+'">'+html.escape(s['title'])+'</a> — '+html.escape(s['author'])+' · <a href="'+html.escape(s['licenseUrl'],quote=True)+'">'+s['license']+'</a>. '+('Attribution requise.' if s['attributionRequired'] else 'CC0, attribution conservée volontairement.')+' Coupes, filtres doux, gain linéaire borné, fondus, mono 32 kHz ; aucune IA. Vérifié le '+s['verification']['dateUTC'][:10]+'.</li>'
credits+='</ul><p><a href="sources.json">Preuves des droits, dates et SHA des sources</a> · <a href="manifest.json">Transformations exactes et empreintes des ressources</a> · <a href="legacy/credits.html">Bibliothèque Mission 10 archivée, inactive</a></p></html>'
(OUT/'credits.html').write_text(credits+'\n');print(len(sources),'independent recordings;',len(assets),'prepared assets;',sum(a['bytes'] for a in assets.values()),'bytes')
groups={}
for ident,a in assets.items():groups.setdefault(a['group'],[]).append(ident)
(ROOT/'src/audio/catalog.mjs').write_text('// Generated from verified sources; arrays contain actual recorded contacts/phrases.\nexport const AUDIO_GROUPS='+json.dumps(groups,indent=2)+';\n')

for path in OUT.glob('*.flac'):
 if path.name not in {a['file'] for a in assets.values()}:path.unlink()

with (ROOT/'src/audio/catalog.mjs').open('a') as catalog:
 catalog.write('\nexport const AUDIO_ASSETS='+json.dumps({id:{k:a[k] for k in ['file','source','duration','bytes']} for id,a in assets.items()},separators=(',',':'))+';\n')
