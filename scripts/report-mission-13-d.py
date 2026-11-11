"""Assemble final evidence from actual browser captures, without rewriting 13A-C."""
from pathlib import Path
import gzip, hashlib, html, json, statistics, subprocess, re
from PIL import Image, ImageDraw, ImageChops, ImageStat

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/mission-13-evidence/optimization'
PREVIOUS=ROOT/'docs/mission-13-evidence/integration'
BASE='56a8ed20daba952e22daaaf07da4e77a6a9e2b38'
PHASES=['before','prior','after'];LABELS=['Mission 12','13C avant optimisation','13D retenu']
TITLES=dict(rue='Rue',facade='Façade proche',toitures='Toitures',chemin='Chemin',sol='Sol naturel',falaise='Falaise partiellement masquée',berge='Berge',village='Village',matin='Matin',soir='Soir',pluie='Soir pluvieux',nuit='Nuit')
sha=lambda b:hashlib.sha256(b).hexdigest()
def read(path):
    path=Path(path);return json.loads(gzip.decompress(path.read_bytes()) if path.suffix=='.gz' else path.read_text())
def write(name,value):(OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def imagecheck(file,size=None):
    with Image.open(file) as im:
        if size:assert im.size==size
        im.verify()
def figures(items):
    return '<div class="grid">'+''.join(f'<figure><a href="{file}"><img loading="lazy" src="{file}" alt="{html.escape(re.sub(r"<[^>]+>","",label))}"></a><figcaption>{label}</figcaption></figure>' for file,label in items)+'</div>'

captures={p:read(OUT/(p+'.json.gz')) for p in PHASES};conditions=[]
for i,ref in enumerate(captures['before']['rows']):
    rows=[captures[p]['rows'][i] for p in PHASES];states=[r['state'] for r in rows]
    for s in states[1:]:
        for k in ['camera','matrix','projection']:assert s[k]==states[0][k],(ref['id'],k)
        assert s['climate']['date']==states[0]['climate']['date']
        assert s['climate']['weather']==states[0]['climate']['weather']
        assert s['life']['profile']==states[0]['life']['profile']=='balanced'
    assert len({(r['samples'][0]['calls'],r['samples'][0]['triangles']) for r in rows})==1
    for r in rows:imagecheck(OUT/r['file'],(960,640))
    with Image.open(OUT/rows[1]['file']) as a,Image.open(OUT/rows[2]['file']) as b:
        mean=statistics.mean(ImageStat.Stat(ImageChops.difference(a.crop((0,130,960,620)),b.crop((0,130,960,620)))).mean)/255
    conditions.append({'id':ref['id'],'geo':ref['geo'],'date':states[0]['climate']['date'],'weather':states[0]['climate']['weather'],'resolution':[960,640],'profile':'balanced','cameraProjectionAndDrawsIdentical':True,'meanAbsoluteRgbDifference13Cto13D':mean,'differenceScope':'Central/lower scene crop x0..960,y130..620, excluding HUD/credits. JPEG error included; not a beauty score.'})

perf=read(OUT/'performance-summary.json');assert perf['renders']==324 and not perf['errors'];perfrows=[]
for profile in ['eco','balanced','quality']:
    for station in ['rue','falaise','village']:
        rs=[next(r for r in perf['summary'] if r['phase']==p and r['profile']==profile and r['station']==station) for p in PHASES]
        assert len({(r['calls'],r['triangles'],r['programs']) for r in rs})==1
        perfrows.append({'profile':profile,'station':station,'medianMs':[r['medianMs'] for r in rs],'p95Ms':[r['p95Ms'] for r in rs],'maxMs':[r['maxMs'] for r in rs],'change13Dvs12Pct':(rs[2]['medianMs']/rs[0]['medianMs']-1)*100,'change13Dvs13CPct':(rs[2]['medianMs']/rs[1]['medianMs']-1)*100,'calls':rs[0]['calls'],'triangles':rs[0]['triangles'],'textures':[r['textures'] for r in rs]})

raw=OUT/'after-walk.json'
if raw.exists():(OUT/'after-walk.json.gz').write_bytes(gzip.compress(raw.read_bytes(),compresslevel=9,mtime=0));raw.unlink()
walks={'before':read(PREVIOUS/'before-walk.json.gz'),'after':read(OUT/'after-walk.json.gz')};assert walks['before']['route']==walks['after']['route'];walkrows=[]
for phase,w in walks.items():
    folder=PREVIOUS if phase=='before' else OUT;frames=read(folder/(phase+'-walk-frames.json.gz'));assert not w['errors'] and w['metres']>449 and all(f['valid'] and f['stepM']<.4 for f in frames)
    file=folder/(phase+'-promenade.webm');probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]));assert {s['codec_type'] for s in probe['streams']}=={'video','audio'}
    xs=sorted(f['intervalMs'] for f in frames[1:]);walkrows.append({'phase':phase,'source':'Mission 12 reference recorded in 13C' if phase=='before' else 'Native final 13D recording','metres':w['metres'],'seconds':float(probe['format']['duration']),'frames':len(frames),'medianIntervalMs':statistics.median(xs),'p95IntervalMs':xs[int(.95*(len(xs)-1))],'maxIntervalMs':max(xs),'allPositionsValid':True,'maxStepM':max(f['stepM'] for f in frames),'initialHeap':w['initialHeap'],'finalHeap':w['finalHeap'],'maxAudioCacheBytes':w['maxAudioCacheBytes'],'maxAudioVoices':w['maxAudioVoices'],'maxGeometries':w['maxGeometries'],'maxTextures':w['maxTextures'],'maxPrograms':w['maxPrograms'],'bytes':file.stat().st_size})

regional=read(OUT/'regional-fixtures.json.gz');assert not regional['errors'] and len(regional['rows'])==6
for fixture in ['atlantic-village','mediterranean-rock']:
    rs=[r for r in regional['rows'] if r['fixture']==fixture];assert len({r['physicalSha256'] for r in rs})==len({r['treeSha256'] for r in rs})==1
    for region in ['poitou','atlantic','mediterranean']:
        for suffix in ['', '-close','-material']:imagecheck(OUT/f'fixture-{fixture}-{region}{suffix}.jpg',(960,640))
assert all(c['cache']['resident']<=2 and c['cache']['gpuBytesEstimate']<=829356 for c in regional['cycles'])
catalog=read(ROOT/'public/materials/france/catalog.json');p=next(p for p in catalog['packs'] if p['id']=='poitou')
allowed={'docs/mission-13.md','public/data/angles-decorations/manifest.json','public/materials/authentic/credits.html','src/architecture/appearance.mjs','src/architecture/material.ts','src/fixtures/regional.ts','src/materials/world.ts','src/world/road-material.ts','src/world/surface-material.ts'}
tracked=git('ls-tree','-r','--name-only',BASE).decode().splitlines();changed=[f for f in git('diff','--name-only',BASE).decode().splitlines() if f in tracked];assert not set(changed)-allowed,set(changed)-allowed
old=json.loads(git('show',BASE+':public/data/angles-decorations/manifest.json'));now=read(ROOT/'public/data/angles-decorations/manifest.json');generatorChanges={}
for file in ['src/architecture/material.ts','src/architecture/appearance.mjs']:
    if file in old['generators']:
        value=sha((ROOT/file).read_bytes());assert now['generators'][file]==value;generatorChanges[file]={'before':old['generators'][file],'after':value};old['generators'][file]=value
assert old==now
protected=[f for f in tracked if (f.startswith('src/') or f.startswith('public/') or f.startswith('.github/')) and f not in allowed];assert not git('diff',BASE,'--',*protected)
renderers=[f for f in changed if f.startswith('src/')]+['src/materials/france.ts','src/materials/france-model.mjs','src/materials/france-style.mjs']
write('preservation.json',{'baseline13C':BASE,'capturesCode':'13C baseline 56a8ed2; final worktree based on that commit, modified badge shown honestly. Exact renderer hashes below.','rendererSha256':{f:sha((ROOT/f).read_bytes()) for f in renderers},'protectedTrackedFilesUnchanged':len(protected),'changedExistingFiles':changed,'manifestGeneratorHashChangesOnly':generatorChanges,'allGeographyPacksAnchorsAndProvenanceUnchanged':True,'realPilotPositionNormalUvIndexBuffersChanged':False,'syntheticPhysicalAndTreeHashes':[{k:r[k] for k in ['fixture','region','physicalSha256','treeSha256']} for r in regional['rows']],'noExtraPassDrawCallOrTriangle':True,'sameNative450mRoute':True,'legacy13BLibraryUnchangedExceptAuthorCreditHtml':True,'activePoitouPackBytes':p['bytes'],'activeGpuTexelsEstimate':p['gpuBytesWithMipmapsEstimate'],'maxTwoContextGpuTexelsEstimate':829356,'poolBound':2,'profilesSkyAudioWaterAnimationsStreamingLP01Unchanged':True})
write('summary.json',{'conditions':conditions,'performance':perfrows,'walks':walkrows,'packs':catalog['packs'],'poolCycles':regional['cycles'],'regionalHeapBefore':regional['heapBefore'],'regionalHeapAfter':regional['heapAfter'],'startup':perf['startup'],'heapAfterBench':perf['heaps'],'limits':['SwiftShader only; no physical GPU or Android performance claim','two synthetic landscapes do not validate actual French regions','photographic/PBR rejection examples remain the actual 13B/13C evidence','128px grain is softer at very close range; neutral warmth and two-channel Lambert compromise','unchanged 10m DEM and partly masked cliff; geography/estimated heights stay original','native videos are not frame synchronized and include recording overhead; original Mission12 clip had brief preparation concurrency']})

def contact(file,ids,paths,labels):
    canvas=Image.new('RGB',(1440,len(ids)*350+34),'#14221c');draw=ImageDraw.Draw(canvas)
    for x,label in enumerate(labels):draw.text((x*480+10,10),label,fill='white')
    for y,key in enumerate(ids):
        for x,path in enumerate(paths):
            with Image.open(OUT/path.format(key=key)) as im:canvas.paste(im.resize((480,320),Image.Resampling.LANCZOS),(x*480,y*350+34))
        draw.text((10,y*350+358),key,fill='white')
    canvas.save(OUT/file,quality=89)
contact('comparison.jpg',['rue','facade','chemin','village'],[p+'/{key}.jpg' for p in PHASES],LABELS)
contact('regional-comparison.jpg',['atlantic-village','mediterranean-rock'],['fixture-{key}-'+r+'-material.jpg' for r in ['poitou','atlantic','mediterranean']],['Poitou / synthetic','Atlantic / synthetic','Southern / synthetic'])

sections=[]
for r in conditions:
    key=r['id'];sections.append(f'<section id="{key}"><h2>{TITLES[key]}</h2><p>{r["geo"]["lat"]:.6f}, {r["geo"]["lon"]:.6f} · {r["date"]} · équilibré · 960 × 640</p>'+figures([(f'{phase}/{key}.jpg',label) for phase,label in zip(PHASES,LABELS)])+'</section>')
regionhtml='<h2 id="regions">Deux scènes synthétiques, trois apparences</h2><p>Le granite et l’ardoise illustrent une famille atlantique ; l’enduit, la pierre claire et la tuile une famille méridionale. Les maillages et arbres sont identiques entre contextes, y compris les pentes de toit. Une toiture explicitement en ardoise reste en ardoise dans les trois variantes. Aucune reproduction d’un village réel ni géologie nationale déduite.</p>'
for fixture in ['atlantic-village','mediterranean-rock']:
    for suffix,label in [('', 'Ensemble'),('-close','Architecture'),('-material','Matière proche')]:regionhtml+=f'<h3>{fixture} · {label}</h3>'+figures([(f'fixture-{fixture}-{region}{suffix}.jpg',name) for region,name in zip(['poitou','atlantic','mediterranean'],['Poitou','Atlantique · granite / ardoise','Méridional · enduit / pierre / tuile'])])
for region in ['atlantic','mediterranean']:
    regionhtml+='<h3>'+region+' · autres lumières</h3>'+figures([(f'fixture-{region}-{moment}-{weather}.jpg',name) for moment,weather,name in [('morning','clear','Matin'),('evening','rain','Soir pluvieux'),('night','clear','Nuit')]])
table=''.join('<tr><td>'+r['profile']+' / '+r['station']+'</td>'+''.join(f'<td>{a:.1f} / {b:.1f}</td>' for a,b in zip(r['medianMs'],r['p95Ms']))+f'<td>{r["change13Dvs13CPct"]:+.1f} %</td></tr>' for r in perfrows)
videohtml='<div class="videos">'+''.join(f'<figure><video controls playsinline preload="metadata" src="{file}"></video><figcaption>{label} · 450 m · {r["seconds"]:.1f} s</figcaption></figure>' for r,file,label in [(walkrows[0],'../integration/before-promenade.webm','Mission 12, témoin enregistré en 13C'),(walkrows[1],'after-promenade.webm','13D, promenade native finale')])+'</div>'
css='body{margin:0;background:#14211f;color:#e8ede4;font:16px/1.6 system-ui}main{max-width:1500px;margin:auto;padding:24px}h1,h2{line-height:1.2}h2{margin-top:2.3em}a{color:#c5d5ad}nav{display:flex;gap:15px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.videos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;min-width:0}img,video{display:block;width:100%;height:auto;background:#111}figcaption{padding:8px 0;color:#c5d5c9}section>p{font-size:.85rem;color:#b7c4ba}.table{overflow:auto}table{border-collapse:collapse;white-space:nowrap}td,th{padding:9px;border-bottom:1px solid #3c5149;text-align:right}td:first-child,th:first-child{text-align:left}.note{border-left:3px solid #a5b88e;padding:12px 20px;background:#1e302a}@media(max-width:700px){main{padding:14px}.grid,.videos{grid-template-columns:1fr}}'
intro='<p>ENDLESS EARTH · MISSION 13D · PR EN BROUILLON</p><h1>Des matières partagées, un paysage calme</h1><p>Le jeu conserve la pierre hybride de 13C dans un atlas plus petit. Les grandes silhouettes, la géographie et les dimensions sont préservées. Les gains proches restent subtils ; les grandes vues et les lumières moins flatteuses font partie des preuves.</p><p class="note">Ces images viennent du vrai navigateur. Le témoin photographique brut et le PBR Standard sont conservés dans leurs essais historiques ; aucune image IA ou photographie locale ne sert de texture au village.</p>'
nav='<nav>'+''.join(f'<a href="#{k}">{v}</a>' for k,v in TITLES.items())+'<a href="#regions">Régions synthétiques</a><a href="#promenades">Promenades</a><a href="#cout">Coût</a><a href="#references">Références</a></nav>'
cost='<h2 id="cout">Coût mesuré</h2><p>324 rendus avec lecture complète des pixels, Chromium 156 / SwiftShader, 800 × 600. Douze valeurs par combinaison. Médiane / P95 en ms ; appels, triangles et programmes identiques dans chaque triplet. La dernière colonne compare 13D à 13C.</p><div class="table"><table><tr><th>Profil / vue</th><th>Mission 12</th><th>13C</th><th>13D</th><th>Écart / 13C</th></tr>'+table+'</table></div><p class="note">Aucun FPS de GPU physique ni d’Android revendiqué. Le nouveau pack Poitou pèse 173 289 octets et environ 0,32 Mio de texels avec mipmaps, contre 1 578 189 octets et 5,06 Mio en 13C. Deux contextes au plus restent en cache ; le PNG d’un autre contexte est chargé à la demande. Les timings de démarrage locaux sont des observations uniques, sans simulation de réseau mobile.</p>'
refs='<h2 id="references">Références et choix écartés</h2>'+figures([('../references/C18.jpg','Photo locale C18, Bachelier Jacky, <a href="https://commons.wikimedia.org/wiki/File:Angles_-_vieilles_batisses.jpg">Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. JPEG documentaire réduit en 13A, sans nouveau traitement.'),('../integration/photo/facade.jpg','Diagnostic photographique 13C, éclairage Lambert : dominante brune et contraste trop forts pour le paysage. Variante non retenue.'),('granite-reference.jpg','Granite Wall, Dimitrios Savva, <a href="https://polyhaven.com/a/granite_wall">Poly Haven</a>, CC0. Aperçu de la source réellement examinée, utilisé seulement comme grain régional harmonisé dans la scène synthétique.')])+'<p>La photo du village permet une comparaison approximative des joints, patines et familles de matières ; aucun recalage géométrique ou photométrique. Le granite ne prouve aucune géologie locale. <a href="granite-reference.json">Provenance, droits, dimensions et empreintes du granite</a> · <a href="../materials/index.html">Comparaison PBR Standard / procédural / hybride de 13B</a> · <a href="../index.html">Toutes les références 13A</a>.</p>'
end='<h2>Essayer et juger</h2><p><a href="../../mission-13.md">Rapport complet</a> · <a href="README.md">Procédure locale</a> · <a href="summary.json">Mesures et conditions</a> · <a href="preservation.json">Préservation</a> · <a href="../../../materials/authentic/credits.html">Auteurs CC0</a>. Les captures du moteur conservent leurs crédits IGN/ASP/OSM.</p><p>Le MNT à 10 m, la falaise masquée, les hauteurs estimées et les inconnues restent tels quels. Le grain à 128 pixels est plus doux de très près ; la texture ne corrige pas la géométrie. Deux scènes synthétiques ne valident pas la France entière. Le prototype affiche un contexte régional à la fois ; une frontière entre contextes simultanément visibles n’est pas démontrée.</p><p>Arrêt après 13D pour validation artistique finale. PR en brouillon, aucune fusion ni publication.</p>'
(OUT/'index.html').write_text(f'<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mission 13D — Matières françaises</title><style>{css}</style><main>{intro}{nav}{"".join(sections)}{regionhtml}<h2 id="promenades">Promenades réelles</h2><p>Même route OSM, déplacement natif de 450 m, vue subjective Éco 640 × 360, juin, après-midi clair. Son post-limiteur, sans téléportation, accélération ou montage ; remux seulement. Les vidéos ont leurs temps propres et incluent le coût de capture logiciel. Le témoin Mission 12 provient de 13C et a connu une brève concurrence de préparation. <a href="../integration/after-promenade.webm">Promenade 13C avant optimisation</a>.</p>{videohtml}{cost}{refs}{end}</main></html>')
print('PASS final gallery: 36 matched game captures, two native walks, identical synthetic physical buffers, three-version benchmark and bounded packs')
