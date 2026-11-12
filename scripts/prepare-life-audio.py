"""Append a verified CC0 flyover; retain every earlier recording/asset unchanged."""
import pathlib,json,urllib.request,hashlib,re,datetime,subprocess,html
import numpy as np
root=pathlib.Path(__file__).resolve().parents[1];work=root/'work/mission15d';out=root/'public/audio';work.mkdir(parents=True,exist_ok=True)
page='https://freesound.org/people/SoundsLikeYukon/sounds/820324/';url='https://cdn.freesound.org/previews/820/820324_1544275-hq.mp3';licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/'
p=work/'aircraft-source.html'
if not p.exists():p.write_bytes(urllib.request.urlopen(page,timeout=30).read())
text=p.read_text();assert 'creativecommons.org/publicdomain/zero/1.0' in text
original=work/'fs-820324.mp3'
if not original.exists():original.write_bytes(urllib.request.urlopen(url,timeout=30).read())
sha=lambda b:hashlib.sha256(b).hexdigest()
a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(original),'-ss','15','-t','24','-ar','32000','-ac','1','-af','highpass=f=75,lowpass=f=8000','-f','f32le','-']),dtype='<f4').copy()
peak=float(np.max(np.abs(a)));rms=float(np.sqrt(np.mean(a*a)));gain=min(.09/max(rms,1e-8),.5/max(peak,1e-8),4);a*=gain
n=32000;fade=np.sin(np.linspace(0,np.pi/2,n))**2;a[:n]*=fade;a[-n:]*=fade[::-1]
file='aircraft-fs-820324-m15.flac';subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','32000','-ac','1','-i','-','-c:a','flac','-sample_fmt','s16',str(out/file)],input=a.astype('<f4').tobytes(),check=True)
sources=json.loads((out/'sources.json').read_text());sources=[s for s in sources if s.get('id')!='fs-820324'];source=dict(id='fs-820324',group='aircraft',title='Small plane flyover 1',author='SoundsLikeYukon',page=page,url=url,license='CC0-1.0',licenseUrl=licenseUrl,attributionRequired=False,sourceFormat='Publisher HQ MP3 preview; not original WAV',sha256=sha(original.read_bytes()),originalFile=original.name,description='Small propeller plane flyover recorded outdoors in Whitehorse, Canada. Reused artistically; no claim of a recording at Angles.',mission='15-D',verification=dict(dateUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),pageSha256=sha(p.read_bytes()),licenseEvidence='Author page links Creative Commons 0 / publicdomain/zero/1.0'))
sources.append(source);m=json.loads((out/'manifest.json').read_text());m['assets']['aircraft-fs-820324-m15']=dict(file=file,bytes=(out/file).stat().st_size,sha256=sha((out/file).read_bytes()),duration=len(a)/32000,channels=1,sampleRate=32000,source=source['id'],provisional=False,license='CC0-1.0',group='aircraft',mission='15-D',transformations=dict(startSeconds=15,durationSeconds=len(a)/32000,highpassHz=75,lowpassHz=8000,linearGain=gain,peakBeforeGain=peak,rmsBeforeGain=rms,fadeSeconds=1,sampleRate=32000,channels=1,codec='FLAC PCM16; lossy MP3 source remains lossy, no synthesized audio, no dynamic compression'),review='Rights and signal screened; owner listening pending')
m['independentRecordings']=len(sources);(out/'sources.json').write_text(json.dumps(sources,indent=2,ensure_ascii=False)+'\n');(out/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
groups={}
for k,a in m['assets'].items():groups.setdefault(a['group'],[]).append(k)
(root/'src/audio/catalog.mjs').write_text('// Generated from verified recorded sources, not synthesized loops.\nexport const AUDIO_GROUPS='+json.dumps(groups,indent=2)+';\nexport const AUDIO_ASSETS='+json.dumps({k:{q:a[q] for q in ['file','source','duration','bytes']} for k,a in m['assets'].items()},separators=(',',':'))+';\n')
c=(out/'credits.html').read_text();marker='<li data-mission="15-D">';c=re.sub(marker+'.*?</li>','',c);entry=marker+'<a href="'+page+'">Small plane flyover 1</a> — SoundsLikeYukon · <a href="'+licenseUrl+'">CC0-1.0</a>. Passage enregistré, réemploi artistique. Coupe 15–39 s, filtres 75/8 000 Hz, gain linéaire borné, fondus, mono 32 kHz ; aperçu HQ MP3, sortie FLAC. Aucun trafic réel à Angles revendiqué.</li>'
c=c.replace('</ul>',entry+'</ul>').replace('40 captations indépendantes','41 captations indépendantes');(out/'credits.html').write_text(c)
print('Prepared CC0 flyover',m['assets']['aircraft-fs-820324-m15']['bytes'],'bytes;24s,one demand-only voice')
