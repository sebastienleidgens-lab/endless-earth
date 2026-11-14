import urllib.request,re,json,pathlib,hashlib,subprocess,os
os.chdir(pathlib.Path(__file__).resolve().parents[1])
class Response:
 def __init__(self,url):
  self.content=urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=45).read();self.text=self.content.decode("utf-8",errors="replace")
 def raise_for_status(self):pass
class requests:
 @staticmethod
 def get(url,timeout=40):return Response(url)
out=pathlib.Path('docs/mission-22-evidence');work=pathlib.Path('work/mission-22/audio');work.mkdir(parents=True,exist_ok=True)
sources=json.load(open('public/audio/sources.json'));manifest=json.load(open('public/audio/manifest.json'));catalog=pathlib.Path('src/audio/catalog.mjs').read_text(); groups=json.loads(catalog.split('export const AUDIO_GROUPS=')[1].split(';\nexport const AUDIO_ASSETS=')[0]);assets=json.loads(catalog.split('export const AUDIO_ASSETS=')[1].rstrip(';\n'))
rows=[]
for author,number,group,offset,duration in [('Sadiquecat',850823,'village-dog',0,.54),('morganveilleux',389993,'village-conversation',1,3.2),('Rudmer_Rotteveel',719482,'village-cycle',1,2.8)]:
 url=f'https://freesound.org/people/{author}/sounds/{number}/'; response=requests.get(url,timeout=40);response.raise_for_status();page=response.text
 assert re.search(r'creativecommons.org/(?:publicdomain/zero/1.0)',page), 'CC0 must be explicit'
 preview=re.search(r'https://cdn.freesound.org/previews/[^"\s]+-hq.mp3',page).group(0);raw=requests.get(preview,timeout=40);raw.raise_for_status();(work/f'{number}.mp3').write_bytes(raw.content);(work/f'{number}.html').write_text(page)
 source={'id':f'fs-{number}','author':author,'title':re.search(r'<title>(.*?)</title>',page,re.S).group(1).strip(),'page':url,'url':preview,'license':'CC0-1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','sha256':hashlib.sha256(raw.content).hexdigest(),'pageSha256':hashlib.sha256(response.content).hexdigest(),'attributionRequired':False,'mission':'22','verification':{'dateUTC':'2026-11-14','licenseEvidence':'Provider page explicitly links Creative Commons publicdomain/zero/1.0; HQ preview used, not original WAV.'}}
 sources=[s for s in sources if s['id']!=source['id']]+[source];groups[group]=[]
 for take in range(2 if group=='village-conversation' else 1):
  id=f'{group}-fs-{number}-{take+1}';file=f'{id}.flac';filters='highpass=f=180,lowpass=f=1700,volume=0.32' if 'conversation' in group else 'highpass=f=100,lowpass=f=6000,volume=0.5';filters+=',afade=t=in:st=0:d=0.03,afade=t=out:st='+str(duration-.08)+':d=0.08'
  subprocess.run(['ffmpeg','-y','-v','error','-ss',str(offset+take*4),'-i',str(work/f'{number}.mp3'),'-t',str(duration),'-ac','1','-ar','32000','-af',filters,'public/audio/'+file],check=True)
  data=pathlib.Path('public/audio/'+file).read_bytes();entry={'file':file,'source':source['id'],'group':group,'duration':duration,'bytes':len(data),'sampleRate':32000,'channels':1,'provisional':False,'sha256':hashlib.sha256(data).hexdigest(),'transformations':{'source':'provider HQ MP3 preview','offset':offset+take*4,'duration':duration,'ffmpegFilters':filters,'channelPolicy':'mono 32000 Hz; no intelligible dialogue intended'}};manifest['assets'][id]=entry;assets[id]={k:entry[k] for k in ['file','source','duration','bytes']};groups[group].append(id)
 rows.append(source)
manifest['independentRecordings']=len(sources);pathlib.Path('public/audio/sources.json').write_text(json.dumps(sources,indent=2)+'\n');pathlib.Path('public/audio/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');pathlib.Path('src/audio/catalog.mjs').write_text('// Generated from verified recorded sources, not synthesized loops.\nexport const AUDIO_GROUPS='+json.dumps(groups,indent=2)+';\nexport const AUDIO_ASSETS='+json.dumps(assets,separators=(',',':'))+';\n');(out/'audio-sources.json').write_text(json.dumps(rows,indent=2)+'\n')
p=pathlib.Path('public/audio/credits.html');s=p.read_text();s=s.replace('</body>','<h2>Mission 22 — vie interprétée</h2>'+''.join(f'<p><a href="{r["page"]}">{r["title"]}</a> — {r["author"]}, CC0. Préécoute HQ, extraits filtrés mono. Aucune prise locale revendiquée.</p>' for r in rows)+'</body>');p.write_text(s)
