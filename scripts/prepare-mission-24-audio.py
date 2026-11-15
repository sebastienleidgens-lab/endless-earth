"""Append one verified CC0 campfire recording; preserve prior source metadata."""
import pathlib,json,hashlib,datetime,subprocess,re,urllib.request
root=pathlib.Path('.');out=root/'work/mission-24/audio';out.mkdir(parents=True,exist_ok=True)
page='https://freesound.org/people/Defaultv/sounds/536935/';url='https://cdn.freesound.org/previews/536/536935_11867884-hq.mp3'
for file,uri in [('fire-source.html',page),('fire-source.mp3',url)]:
 p=out/file
 if not p.exists():p.write_bytes(urllib.request.urlopen(uri).read())
html=(out/'fire-source.html').read_text();assert re.search(r'creativecommons.org/publicdomain/zero/1.0',html)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=dict(id='fs-536935',group='camp-fire',title='Campfire.wav',author='Defaultv',page=page,url=url,license='CC0-1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',attributionRequired=False,sourceFormat='Publisher HQ MP3 preview, not original WAV',sha256=sha(out/'fire-source.mp3'),originalFile='fire-source.mp3',description='Recorded campfire, used artistically; no local Angles recording claimed.',mission='24',verification=dict(dateUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),pageSha256=sha(out/'fire-source.html'),licenseEvidence='Author page explicitly links Creative Commons 0 / publicdomain/zero/1.0'))
asset='campfire-fs-536935-m24';file=asset+'.flac';filters='highpass=f=90,lowpass=f=9000,volume=0.8,afade=t=in:d=0.12,afade=t=out:st=17.88:d=0.12'
subprocess.run(['ffmpeg','-y','-v','error','-ss','3','-i',str(out/'fire-source.mp3'),'-t','18','-ac','1','-ar','32000','-sample_fmt','s16','-af',filters,'public/audio/'+file],check=True)
p=root/'public/audio'/file;duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)]));assert duration==18
sources=json.loads((root/'public/audio/sources.json').read_text());sources=[s for s in sources if s['id']!=source['id']]+[source]
manifest=json.loads((root/'public/audio/manifest.json').read_text());entry=dict(file=file,source=source['id'],group='camp-fire',duration=duration,bytes=p.stat().st_size,sampleRate=32000,channels=1,provisional=False,license='CC0-1.0',sha256=sha(p),transformations=dict(startSeconds=3,durationSeconds=18,ffmpegFilters=filters,codec='mono 32kHz FLAC PCM16 from lossy publisher HQ MP3; no synthesized fire'),review='Rights/metadata checked; owner listening pending')
manifest['assets'][asset]=entry;manifest['independentRecordings']=len(sources)
(root/'public/audio/sources.json').write_text(json.dumps(sources,indent=2)+'\n');(root/'public/audio/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
p=root/'src/audio/catalog.mjs';catalog=p.read_text();groups=json.loads(catalog.split('export const AUDIO_GROUPS=')[1].split(';\nexport const AUDIO_ASSETS=')[0]);groups['camp-fire']=[asset];p.write_text('// Generated from verified recorded sources, not synthesized loops.\nexport const AUDIO_GROUPS='+json.dumps(groups,indent=2)+';\nexport const AUDIO_ASSETS='+json.dumps({k:{q:a[q] for q in ['file','source','duration','bytes']} for k,a in manifest['assets'].items()},separators=(',',':'))+';\n')
p=root/'public/audio/credits.html';s=p.read_text();credit='<h2>Mission 24 — feu de camp</h2><p><a href="'+page+'">Campfire.wav</a> — Defaultv, <a href="'+source['licenseUrl']+'">CC0</a>. Préécoute HQ mono filtrée, aucune prise locale revendiquée.</p>'
if 'Mission 24 — feu' not in s:p.write_text(s.replace('</body>',credit+'</body>') if '</body>' in s else s+'\n'+credit+'\n')
(root/'docs/mission-24-evidence/final').mkdir(parents=True,exist_ok=True);(root/'docs/mission-24-evidence/final/audio-source.json').write_text(json.dumps(dict(source=source,asset=entry),indent=2)+'\n')
print(json.dumps(dict(recordings=len(sources),bytes=entry['bytes'],duration=duration)))
