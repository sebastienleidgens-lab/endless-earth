"""Mission 11 B: append vetted recordings without rebuilding any 10.1 contact.
Source previews remain honestly labelled MP3. No denoising, synthesis or dynamic
compression. Source/page hashes and exact linear transformations are retained.
"""
import pathlib,json,subprocess,hashlib,html,argparse
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1];W=ROOT/'work/mission-11-b';OUT=ROOT/'public/audio'
parser=argparse.ArgumentParser();parser.add_argument('--download',action='store_true');args=parser.parse_args();W.mkdir(parents=True,exist_ok=True);(W/'originals').mkdir(exist_ok=True)
sources=json.load(open(OUT/'sources.json'));new=[s for s in sources if s.get('mission')=='11-B'] or json.load(open(W/'candidates.json'));manifest=json.load(open(OUT/'manifest.json'));assets={k:v for k,v in manifest['assets'].items() if not v.get('mission')=='11-B'}
sources=[s for s in sources if s.get('mission')!='11-B']
for s in new:
 p=W/'originals'/s['originalFile']
 if args.download:subprocess.run(['curl','-fsSL','--max-time','60',s['url'],'-o',str(p)],check=True)
 assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']
 raw=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar','32000','-ac','1','-f','f32le','-']),dtype='<f4').copy();kind=s['group'];duration=len(raw)/32000
 windows=[(0,min(duration,28.2))] if kind=='traffic' else [(1,min(30,duration-2))]
 if duration>80 and kind!='traffic':windows.append((duration*.55,min(30,duration*.45-1)))
 for i,(start,length) in enumerate(windows):
  a=raw[int(start*32000):int((start+length)*32000)];hp=90 if kind.startswith('river') or kind=='water-turbulence' else 180 if kind=='wind-open' else 100;lp=6500 if kind=='traffic' else 9500
  a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar','32000','-ac','1','-i','-','-af',f'highpass=f={hp},lowpass=f={lp}','-f','f32le','-'],input=a.astype('<f4').tobytes()),dtype='<f4').copy()
  rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));target=.10 if kind.startswith('river') else .085 if kind=='water-turbulence' else .07 if kind=='wind-open' else .08;gain=min(target/max(rms,1e-8),.52/max(peak,1e-8),6);a*=gain
  fade=min(int((.5 if kind=='traffic' else 1.2)*32000),len(a)//4);a[:fade]*=np.sin(np.linspace(0,np.pi/2,fade))**2;a[-fade:]*=np.sin(np.linspace(np.pi/2,0,fade))**2
  ident=f'{kind}-{s["id"]}-m11-{i+1}';file=ident+'.flac';subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar','32000','-ac','1','-i','-','-c:a','flac','-sample_fmt','s16',str(OUT/file)],input=a.astype('<f4').tobytes(),check=True);data=(OUT/file).read_bytes()
  transforms={'startSeconds':round(start,5),'durationSeconds':len(a)/32000,'highpassHz':hp,'lowpassHz':lp,'linearGain':gain,'peakBeforeGain':peak,'rmsBeforeGain':rms,'fadeSeconds':fade/32000,'sampleRate':32000,'channels':1,'codec':'FLAC PCM16; source HQ MP3 preview remains lossy; no dynamic compression or generated audio'}
  assets[ident]=dict(file=file,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),duration=len(a)/32000,channels=1,sampleRate=32000,source=s['id'],provisional=False,license=s['license'],group=kind,mission='11-B',transformations=transforms,review='metadata, rights and signal screened; owner listening pending')
 sources.append(s)
(OUT/'sources.json').write_text(json.dumps(sources,indent=2,ensure_ascii=False)+'\n');(OUT/'manifest.json').write_text(json.dumps(dict(version=3,independentRecordings=len(sources),review='No human listening claimed; owner perceptual approval pending',assets=assets),indent=2)+'\n')
groups={}
for k,a in assets.items():groups.setdefault(a['group'],[]).append(k)
(ROOT/'src/audio/catalog.mjs').write_text('// Generated from verified recorded sources, not synthesized loops.\nexport const AUDIO_GROUPS='+json.dumps(groups,indent=2)+';\nexport const AUDIO_ASSETS='+json.dumps({k:{q:a[q] for q in ['file','source','duration','bytes']} for k,a in assets.items()},separators=(',',':'))+';\n')
credits='<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sons et licences · Mission 11</title><style>body{max-width:900px;margin:2rem auto;padding:1rem;font:16px/1.6 system-ui;color:#243a2e;background:#eef1e8}li{margin:1rem 0}a{color:#285b49}</style><h1>Bibliothèque naturaliste</h1><p>Budget 0 €. '+str(len(sources))+' captations indépendantes. Les découpes ne comptent pas comme nouvelles prises. Aucune espèce observée, débit, trafic réel ou captation locale à Angles ne sont revendiqués. Validation perceptive du propriétaire attendue. Sources Freesound : aperçus HQ MP3 du fournisseur, pas les WAV originaux ; sortie FLAC sans nouvelle compression perceptuelle. Les ressources 10.1 sont préservées.</p><ul>'
for s in sources:credits+='<li><a href="'+html.escape(s['page'],quote=True)+'">'+html.escape(s['title'])+'</a> — '+html.escape(s['author'])+' · <a href="'+html.escape(s['licenseUrl'],quote=True)+'">'+s['license']+'</a>. '+('Attribution requise.' if s['attributionRequired'] else 'CC0 ; attribution conservée.')+' Coupes, filtres, gain linéaire borné, fondus, mono 32 kHz. Aucune IA. Vérifié le '+s['verification']['dateUTC'][:10]+'.</li>'
credits+='</ul><p><a href="sources.json">Sources et preuves de droits</a> · <a href="manifest.json">Transformations et empreintes</a> · <a href="legacy/credits.html">Archive Mission 10 inactive</a></p>'
(OUT/'credits.html').write_text(credits+'\n');print(len(sources),'recordings',len(assets),'assets',sum(a['bytes'] for a in assets.values()),'bytes')
