"""Reproducible isolated contacts from two verified CC0 publisher previews.
No synthesized snow, compression/normalisation of existing assets, or paid API.
"""
import json,hashlib,re,subprocess,pathlib,datetime
import numpy as np
root=pathlib.Path('.'); work=root/'work/mission-19'; out=root/'public/audio'
sha=lambda b:hashlib.sha256(b).hexdigest()
manifest=json.loads((out/'manifest.json').read_text());sources=json.loads((out/'sources.json').read_text());groups={};assets={};evidence=[]
for label,sid,author,page in [('soft','380041','edschaefer','https://freesound.org/people/edschaefer/sounds/380041/'),('firm','841736','studiogreenhill','https://freesound.org/people/studiogreenhill/sounds/841736/')]:
 html=(work/f'snow-{label}.html').read_text();lic=re.search(r'<a[^>]*href="([^\"]*publicdomain/zero[^\"]*)"[^>]*>Creative Commons 0</a>',html);assert lic
 url=re.search(r'https://cdn.freesound.org[^\s"<>]+hq.mp3',html)[0];raw=(work/f'snow-{label}.mp3').read_bytes()
 pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(work/f'snow-{label}.mp3'),'-ac','1','-ar','32000','-af','highpass=f=80,lowpass=f=11000','-f','f32le','-'])
 x=np.frombuffer(pcm,dtype='<f4'); win=640;rms=np.sqrt(np.mean(x[:len(x)//win*win].reshape(-1,win)**2,axis=1));peaks=[]
 for n in np.argsort(rms)[::-1]:
  t=float(n*win/32000)
  if t<.2 or t>len(x)/32000-.65 or any(abs(t-p)<.7 for p in peaks):continue
  peaks.append(t)
  if len(peaks)==6:break
 assert len(peaks)==6
 gid='step-snow-'+label;groups[gid]=[]
 for i,t in enumerate(sorted(peaks)):
  start=max(0,t-.09);clip=x[int(start*32000):int((start+.56)*32000)].copy();peak=float(np.max(np.abs(clip)));gain=min(3.,.32/max(.001,peak));clip*=gain;fade=160;clip[:fade]*=np.linspace(0,1,fade);clip[-fade:]*=np.linspace(1,0,fade)
  aid=f'{gid}-fs-{sid}-{i+1}';file=aid+'.flac';subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','32000','-ac','1','-i','-','-c:a','flac',str(out/file)],input=clip.astype('<f4').tobytes(),check=True)
  data=(out/file).read_bytes();meta={'file':file,'bytes':len(data),'sha256':sha(data),'duration':len(clip)/32000,'channels':1,'sampleRate':32000,'source':'fs-'+sid,'provisional':False,'license':'CC0-1.0','group':gid,'transformations':{'startSeconds':start,'durationSeconds':len(clip)/32000,'highpassHz':80,'lowpassHz':11000,'linearGain':gain,'fadeSeconds':.005,'sampleRate':32000,'notes':'mono downmix from publisher HQ MP3 preview; six isolated energy peaks separated by at least .7 s'}}
  manifest['assets'][aid]=meta;assets[aid]={k:meta[k] for k in ['file','source','duration','bytes']};groups[gid].append(aid)
 sources=[s for s in sources if s['id']!='fs-'+sid];sources.append({'id':'fs-'+sid,'mission':'19','group':gid,'title':f'Snow footsteps ({label})','author':author,'page':page,'url':url,'license':'CC0-1.0','licenseUrl':lic[1],'attributionRequired':False,'sourceFormat':'publisher-provided HQ MP3 preview, not original WAV','sha256':sha(raw),'originalFile':f'snow-{label}.mp3','description':'Frozen snow, various speeds' if label=='firm' else 'Snow footsteps, source EQ removed wind; soft contact interpretation','verification':{'dateUTC':datetime.datetime.fromtimestamp((work/f'snow-{label}.html').stat().st_mtime,datetime.timezone.utc).isoformat(),'pageSha256':sha(html.encode()),'licenseEvidence':lic[0]}})
 evidence.append({'source':sid,'author':author,'page':page,'license':'CC0-1.0','previewSha256':sha(raw),'pageSha256':sha(html.encode()),'peaksSeconds':sorted(peaks),'bytes':sum(manifest['assets'][a]['bytes'] for a in groups[gid])})
manifest['independentRecordings']=len(sources);(out/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n');(out/'sources.json').write_text(json.dumps(sources,indent=2,ensure_ascii=False)+'\n')
p=root/'src/audio/catalog.mjs';s=p.read_text();s=s.split('// Mission 19 CC0 snow contacts.')[0];s+='\n// Mission 19 CC0 snow contacts.\nObject.assign(AUDIO_GROUPS,'+json.dumps(groups)+');\nObject.assign(AUDIO_ASSETS,'+json.dumps(assets)+');\n';p.write_text(s)
credits=out/'credits.html';s=re.sub(r'<!-- mission19 -->.*?<!-- /mission19 -->\s*','',credits.read_text(),flags=re.S)
block='<!-- mission19 -->\n<h2>Pas sur neige — Mission 19</h2><p>Deux enregistrements CC0, extraits des préécoutes HQ MP3 publiées par Freesound ; mono 32 kHz, filtrage léger, gain et fondus de 5 ms. Les états de neige sont des interprétations sonores.</p>'
for row in evidence:block+=f'<p><a href="{row["page"]}">{row["author"]} — {row["source"]}</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0-1.0</a></p>'
block+='\n<!-- /mission19 -->\n';s=s.replace('</body>',block+'</body>') if '</body>' in s else s+block
credits.write_text(s);(root/'docs/mission-19-evidence/audio-sources.json').write_text(json.dumps(evidence,indent=2)+'\n');print(json.dumps(evidence,indent=2))
