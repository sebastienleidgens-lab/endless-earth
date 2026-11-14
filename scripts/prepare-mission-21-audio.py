"""Append three independent CC0 thunder recordings. Preserve previous assets.
Input files and saved provider pages live in work/mission-21. Preview MP3s are
identified honestly; FLAC adds no new perceptual compression, never invents WAV.
"""
import json,pathlib,re,hashlib,subprocess,numpy as np,html
root=pathlib.Path(__file__).resolve().parents[1];work=root/'work/mission-21';out=root/'public/audio';manifest=json.loads((out/'manifest.json').read_text());sources=json.loads((out/'sources.json').read_text());evidence=[]
for ident,author in [(243782,'bastipictures'),(522025,'Nimlos'),(577846,'vilmuhametshin')]:
 p=work/f'thunder-{ident}.html';page=p.read_text();assert 'http://creativecommons.org/publicdomain/zero/1.0/' in page
 original=work/f'thunder-{ident}.mp3';url=re.findall(r'https://cdn.freesound.org/previews/[^"<> ]+-hq.mp3',page)[0]
 raw=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(original),'-ar','32000','-ac','1','-f','f32le','-']),dtype='<f4').copy()
 # Find the strongest low-frequency one-second window to isolate one peal.
 low=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(original),'-af','lowpass=f=220','-ar','8000','-ac','1','-f','f32le','-']),dtype='<f4')
 block=2000;power=[np.mean(low[i:i+block]**2) for i in range(0,len(low)-block,block)];peak=int(np.argmax(power))*.25;start=max(0,peak-1.2);length=min(18,len(raw)/32000-start);a=raw[int(start*32000):int((start+length)*32000)]
 a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar','32000','-ac','1','-i','-','-af','highpass=f=28,lowpass=f=4500','-f','f32le','-'],input=a.astype('<f4').tobytes()),dtype='<f4').copy();gain=min(.42/max(np.max(np.abs(a)),1e-8),.11/max(np.sqrt(np.mean(a*a)),1e-8),4);a*=gain
 fade=int(.20*32000);a[:fade]*=np.linspace(0,1,fade)**2;a[-32000:]*=np.linspace(1,0,32000)**2
 key=f'thunder-fs-{ident}-m21';file=key+'.flac';subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar','32000','-ac','1','-i','-','-c:a','flac','-sample_fmt','s16',str(out/file)],input=a.astype('<f4').tobytes(),check=True)
 data=(out/file).read_bytes();source=dict(id='fs-'+str(ident),author=author,title=html.unescape(re.search(r'<title>(.*?)</title>',page,re.S).group(1).replace('Freesound - ','')),page=f'https://freesound.org/people/{author}/sounds/{ident}/',url=url,license='CC0-1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',sha256=hashlib.sha256(original.read_bytes()).hexdigest(),pageSha256=hashlib.sha256(p.read_bytes()).hexdigest(),attributionRequired=False,mission='21',verification={'dateUTC':'2026-11-14','licenseEvidence':'Provider page explicitly links CC0 public-domain dedication; preview acquired from provider CDN'},originalFile=original.name)
 sources=[s for s in sources if s['id']!=source['id']]+[source];evidence.append(source)
 manifest['assets'][key]=dict(file=file,source=source['id'],bytes=len(data),duration=len(a)/32000,sha256=hashlib.sha256(data).hexdigest(),channels=1,sampleRate=32000,license='CC0-1.0',group='thunder',mission='21',provisional=False,transformations=dict(startSeconds=start,durationSeconds=len(a)/32000,highpassHz=28,lowpassHz=4500,linearGain=float(gain),entryFadeSeconds=.2,exitFadeSeconds=1,sourceFormat='Provider HQ MP3 preview; not original WAV',outputFormat='FLAC PCM16 mono 32000 Hz',selection='Strongest low-frequency quarter-second window, one peal excerpt; no synthesis or pitch variation'),review='Source metadata, rights and signal checked; owner perceptual listening pending')
manifest['independentRecordings']=len(sources);(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(out/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n');groups={}
for k,a in manifest['assets'].items():groups.setdefault(a['group'],[]).append(k)
(root/'src/audio/catalog.mjs').write_text('// Generated from verified recorded sources, not synthesized loops.\nexport const AUDIO_GROUPS='+json.dumps(groups,indent=2)+';\nexport const AUDIO_ASSETS='+json.dumps({k:{q:a[q] for q in ['file','source','duration','bytes']} for k,a in manifest['assets'].items()},separators=(',',':'))+';\n')
credits=(out/'credits.html').read_text();credits=credits.replace('</ul>', ''.join('<li><a href="'+e['page']+'">'+html.escape(e['title'])+'</a> — '+e['author']+' · <a href="'+e['licenseUrl']+'">CC0</a>. Mission 21 : extrait du preview HQ MP3, mono 32 kHz, filtres, gain linéaire et fondus. Captation hors Angles ; aucune synthèse.</li>' for e in evidence)+'</ul>');(out/'credits.html').write_text(credits)
(root/'docs/mission-21-evidence/audio-licenses.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n');print('Appended',len(evidence),'independent CC0 thunder recordings')
