"""Consolidate observed M26.2 evidence without promoting plans to journeys."""
import json, math, hashlib, html, subprocess, gzip, shutil, re
from pathlib import Path
from datetime import datetime, timezone
import sys
sys.path.insert(0,str(Path('work/mission-26-2/python').resolve()))
from pyproj import Transformer
E=Path('docs/mission-26-2-evidence'); E.mkdir(exist_ok=True)
subprocess.run(['node','scripts/normalize-mission-26-2-native.mjs'],check=True)
REF='d6a906cd7546a4cd8e85226efff64436e53ea200'
PROGRAM='58ba496050f7541a63599c28a1a553f7f0b453e9'
def read(name,default=None):
 p=E/name
 return json.loads(p.read_text()) if p.exists() else default

def write(name,obj): (E/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def short(sha): return (sha or 'non exporté')[:12]
def n(v,d=2): return 'non mesuré' if v is None else f'{v:,.{d}f}'.replace(',',' ').replace('.',',')
def link(p,label=None): return f'[{label or p}]({p})'
def git(*args): return subprocess.check_output(['git',*args]).decode().strip()
logRoot=Path('work/mission-26-2');logDest=E/'checks/trial-logs';logDest.mkdir(parents=True,exist_ok=True)
logIndex=[]
for p in sorted(logRoot.iterdir()):
 if not p.is_file()or p.suffix not in ['.log','.txt']or p.stem in ['gallery-server','report-final','gallery-final','verify-final']:continue
 content=p.read_bytes()
 if re.search(rb'(?:ghp_|github_pat_|sk-[A-Za-z0-9]{20}|Authorization: ?Bearer)',content):raise RuntimeError('Potential credential pattern in '+p.name)
 shutil.copyfile(p,logDest/p.name);logIndex.append({'file':'checks/trial-logs/'+p.name,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
write('trial-logs.json',{'scope':'Original local campaign logs, including failed wrapper/build attempts and intermediate cohorts. A successful process or file existence does not mean its game scenario passed. Durations come from monotonic counters, not file modification times.','records':logIndex})
changedProgram=[]
for row in git('diff','--name-status',REF,PROGRAM,'--','src','public','package.json','package-lock.json','scripts/prepare-planet-fixture.mjs','tests/mission-26-2.test.mjs').splitlines():
 status,path=row.split('\t');changedProgram.append({'status':status,'path':path,'candidateGitBlob':git('rev-parse',PROGRAM+':'+path),'candidateSHA256':hashlib.sha256(Path(path).read_bytes()).hexdigest()})
write('source-changes.json',{'referenceSHA':REF,'programSHA':PROGRAM,'scope':'Program/data/compiler/test changes, excluding the later documentation and evidence-only wrappers. No workflows changed. Full evidence inventory is in artifact-manifest.json.','files':changedProgram})
manifest=json.loads(Path('public/planet/fr-86/manifest.json').read_text())
audit=read('audit.json',{}); areas=read('access.json',{'cases':[]}); seams=read('seam-strips.json',{'cases':[]}); water=read('department-water.json',{'cases':[]}); fixture=read('fixture.json',{})
journeys=read('journeys.json',{'cases':[]}); mapui=read('map-ui.json',{'cases':[]})
trips=[]
for name in ['spawn-Vicq-return-foot','spawn-SaintPierre-foot','Chauvigny-foot-21km-foot','Chauvigny-furthest-connected-source-car','Vallee-car-40km-car']:
 d=read(name+'.json',{}); t=d.get('travel',{}); trace=t.get('trace',[])
 if not d: continue
 trips.append({'name':name,'file':name+'.json','sourceSHA':d.get('sourceSHA'),'mode':d.get('chosen',{}).get('mode'),'method':d.get('method'),'functionalSuccess':d.get('functionalSuccess',False),'distanceM':t.get('distanceM'),'wallSeconds':t.get('wallSeconds'),'simulatedSeconds':t.get('simulatedSeconds'),'waitMs':t.get('waitMs'),'tiles':sorted({q['canonicalTile']for q in trace if q.get('canonicalTile')}),'startGPS':d.get('start',{}).get('gps'),'endGPS':t.get('end',{}).get('gps'),'endStream':t.get('end',{}).get('planet',{}).get('stream'),'endOrigin':t.get('end',{}).get('origin'),'lastMovement':t.get('end',{}).get('movement'),'failure':d.get('failure'),'vehicleRefusal':t.get('failureState'),'forwardInspection':t.get('forwardInspection'),'nextInspection':t.get('nextInspection'),'maxStepM':t.get('maxStepM'),'detourCount':len(t.get('detours',[])) if 'detours'in t else None,'checkpointFramebuffer':t.get('end',{}).get('buffer',d.get('before',{}).get('buffer')),'positionAssignmentDuringTrip':False,'nativeFilm':False,'_trace':trace})
foot=next((t for t in trips if t['name']=='Chauvigny-foot-21km-foot'),{})
loop=next((t for t in trips if t['name']=='spawn-Vicq-return-foot'),{})
car=max([t for t in trips if t.get('mode')=='car' and t.get('distanceM') is not None],key=lambda t:t['distanceM'],default={})
write('journey-summary.json',{'method':'Actual accelerated complete-frame controller runs. Distances from consecutive physical horizontal positions, never source graph lengths. Per-case sources retained; no native/perceptual claim. Trace Y is local; GeoJSON is 2D.','cases':[{k:v for k,v in t.items()if k!='_trace'}for t in trips]})

# Fair-comparison receipts and observed intervals; no extrapolation to hardware.
perf=[]
for label in ['reference','candidate']:
 d=read(label+'-benchmarks.json',{'cases':[]})
 for c in d['cases']:
  frames=c.get('frames',[]); before=c.get('before',{}); after=c.get('after',{}); lo=frames[0]['t'] if frames else math.inf; hi=frames[-1]['t'] if frames else -math.inf
  lt=[x for x in after.get('longTasks',[])if lo<=x['t']<=hi]
  prep=after.get('planet',{}).get('preparation',{})
  perf.append({'label':label,'sourceSHA':d.get('sourceSHA'),'profile':c['profile'],'scene':c['scene'],'success':c.get('functionalSuccess',False),'frameMs':c.get('frameMs'),'fps':c.get('averageFps'),'framebuffer':after.get('buffer'),'audioEnabled':after.get('audioEnabled'),'longTasksInSample':len(lt),'maxLongTaskInSampleMs':max([x['ms']for x in lt],default=None),'heapBefore':before.get('heap'),'heapAfter':after.get('heap'),'decodedResidentBytes':after.get('planet',{}).get('stream',{}).get('residentBytes'),'geometryCPUBytes':after.get('buffers',{}).get('attributeBytes'),'textureTypedCPUBytes':after.get('buffers',{}).get('typedTextureBytes'),'GPUDriverBytes':None,'workerPeakBytes':None,'preparationCumulativeMaxStepMs':prep.get('maxStepMs'),'preparationStages':prep.get('stages'),'failure':c.get('failure')})
comparisons=[]
for c in [p for p in perf if p['label']=='candidate']:
 r=next((p for p in perf if p['label']=='reference'and p['profile']==c['profile']and p['scene']==c['scene']),None)
 comparisons.append({'profile':c['profile'],'scene':c['scene'],'referenceFps':r.get('fps')if r else None,'candidateFps':c['fps'],'fpsChangePercent':100*(c['fps']/r['fps']-1) if r and r.get('fps')and c.get('fps')else None,'referenceP95Ms':(r.get('frameMs')or{}).get('p95')if r else None,'candidateP95Ms':(c.get('frameMs')or{}).get('p95'),'matchedFunctionalCase':bool(r and r['success']and c['success']and r['audioEnabled']and c['audioEnabled']and r['framebuffer']==c['framebuffer']==[640,420]),'identicalTrajectory':False})
write('performance-summary.json',{'method':'Sequential isolated native-loop browsers; active selected effects/audio, fixed 640x420 DPR1; no encoder. SwiftShader. Short samples and CPU scheduling make P99 and small relative changes uncertain. Station setup matches, trajectories and warm-up history can differ. No hardware acceptance.','physicalDesktop':{'tested':False,'reason':'No physical GPU available (/dev/dri absent).'},'physicalAndroid':{'tested':False,'reason':'No physical phone; UI emulation only.'},'cases':perf,'comparisons':comparisons,'strictFivePercentNonRegressionValidated':False,'memoryScope':'96 MiB decoded geography is not browser memory. Heap, geometry CPU mirrors and decoded geography overlap and must not be summed as total. Worker peak and GPU/driver unknown.'})

for comparison in comparisons:
 pair={label:next((c for c in read(label+'-benchmarks.json',{'cases':[]})['cases']if c['profile']==comparison['profile']and c['scene']==comparison['scene']),{})for label in ['reference','candidate']}
 positions=[pair[label].get('before',{}).get('position')for label in ['reference','candidate']]
 comparison['positionDifferenceBeforeM']=math.dist(*positions)if all(positions)else None
 comparison['cameraTransformMeasured']=False
 comparison['strictMatchedSceneVerified']=False
 comparison['strictComparisonLimit']='Same preset inputs/profile/framebuffer; warm-up clocks and moving trajectories can diverge at low native FPS. Camera matrix not exported in these benchmark snapshots. This does not certify the <=5% requirement.'
write('performance-summary.json',{'method':'Sequential isolated native-loop browsers; full selected effects/audio, fixed 640x420 DPR1, no encoder. Same preset inputs and scene order, but not strict identical camera/phase/trajectory verification. Short 20 s samples do not validate robust P99, hardware or <=5% non-regression.','physicalDesktop':{'tested':False,'reason':'No physical GPU available (/dev/dri absent).'},'physicalAndroid':{'tested':False,'reason':'No physical phone; UI emulation only.'},'cases':perf,'comparisons':comparisons,'strictNonRegressionValidated':False,'memoryScope':'96 MiB decoded geography is not browser memory. Heap, geometry CPU mirrors and decoded geography overlap; worker peak and GPU/driver unknown.'})
stagePeaks={}
for c in perf:
 for name, stage in (c.get('preparationStages')or{}).items():
  key=(c['label'],name);old=stagePeaks.get(key,{})
  stagePeaks[key]={'label':c['label'],'stage':name,'maxStepMs':max(stage.get('maxStepMs',0),old.get('maxStepMs',0)),'over8CumulativeMax':max(stage.get('over8',0),old.get('over8CumulativeMax',0)),'over50CumulativeMax':max(stage.get('over50',0),old.get('over50CumulativeMax',0))}
write('preparation-peaks.json',{'method':'Maxima and largest cumulative counters per stage across snapshots, never a sum of repeated cumulative snapshots. Baseline without stage labels remains unmeasured, not zero. Excludes GPU work and worker peak.','stages':sorted(stagePeaks.values(),key=lambda s:s['maxStepMs'],reverse=True)})

# Truth map: administrative data != permissions != actual travel.
togeo=Transformer.from_crs(2154,4326,always_xy=True); toxy=Transformer.from_crs(4326,2154,always_xy=True)
def gpsxy(p): return list(togeo.transform(p[0],p[1]))
features=[]
def feature(kind,name,geom,**props): features.append({'type':'Feature','geometry':geom,'properties':{'kind':kind,'name':name,**props}})
for t in manifest['tiles']:
 x0,y0,x1,y1=t['bounds']; feature('data-coverage',str(t.get('id')),{'type':'Polygon','coordinates':[[gpsxy(p)for p in [(x0,y0),(x1,y0),(x1,y1),(x0,y1),(x0,y0)]]]},permission='not-certified',sourceSHA=t.get('sha256'))
feature('department-boundary','Vienne',manifest['boundary'],permission='not-an-access-right')
for a in audit.get('explicitAreaCandidates',[]):
 if len(a.get('points',[]))>=3:feature('permission-candidate',a['id'],{'type':'Polygon','coordinates':[[gpsxy(p)for p in a['points']]]},tags=a.get('tags'),walkableAreaMeasuredM2=None)
for category, entries in audit.get('accessSamples',{}).items():
 for a in entries:
  if a.get('points'):
   feature('source-access-sample',a['id'],{'type':'Point','coordinates':gpsxy(a['points'][len(a['points'])//2])},category=category,tags=a.get('tags'),physicallyTested=False,reason='Source-side restriction or unknown access; sample is not a controlled field journey.')
selection=read('routes-selection.json',{'cases':[]}); seen=set()
for c in selection['cases']:
 key=(c['from'],c['to'],c['mode'])
 if key in seen:continue
 seen.add(key); r=c.get('route',{})
 if r.get('complete')and len(r.get('points',[]))>1:feature('source-plan',' → '.join(key),{'type':'LineString','coordinates':[gpsxy([p['x'],p['y']])for p in r['points']]},distanceM=r.get('distance'),physicallyTravelled=False)
for t in trips:
 coords=[[q['gps']['lon'],q['gps']['lat']]for q in t['_trace']if q.get('gps')]
 if len(coords)>1:feature('actual-controller-trip',t['name'],{'type':'LineString','coordinates':coords},sourceSHA=t['sourceSHA'],distanceM=t['distanceM'],completed=t['functionalSuccess'],evidence=t['file'],capture='accelerated-complete-frame',native=False)
 if not t['functionalSuccess']and t.get('endGPS'):feature('trip-stop',t['name'],{'type':'Point','coordinates':[t['endGPS']['lon'],t['endGPS']['lat']]},evidence=t['file'],movement=t['lastMovement'],sourceSHA=t['sourceSHA'])
for c in areas['cases']:
 tr=c.get('walk',{}).get('trace',[]); coords=[[q['gps']['lon'],q['gps']['lat']]for q in tr if q.get('gps')]
 if len(coords)>1:feature('short-area-walk',c['id'],{'type':'LineString','coordinates':coords},evidence='access.json',sourceSHA=areas.get('sourceSHA'),distanceM=c['walk'].get('distanceM'))
for c in water['cases']:
 gps=c.get('placement',{}).get('position',c.get('requested'))
 if gps:feature('water-unvalidated',c['name'],{'type':'Point','coordinates':[gps['lon'],gps['lat']]},evidence='department-water.json',newNavigatedM=0,diagnosticSelectionFailure=c.get('failure'))
write('truth.geojson',{'type':'FeatureCollection','name':'M26.2 truth map','method':'2D WGS84. Source plans and permission polygons are not actual journeys. No newly validated departmental river slice.','features':features})
x0,y0,x1,y1=manifest['bounds']; pad=1500; W,H=760,860; scale=min(W/(x1-x0+pad*2),H/(y1-y0+pad*2))
def pt(p):
 x,y=toxy.transform(p[0],p[1]);return f'{(x-x0+pad)*scale:.2f},{(y1-y+pad)*scale:.2f}'
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 860" role="img" aria-label="Couverture, permissions candidates, plans et voyages réellement mesurés">','<rect width="760" height="860" fill="#101e28"/>']
styles={'data-coverage':('fill="#27444e" stroke="#45606b" stroke-width=".3"',''),'department-boundary':('fill="none" stroke="#bdd4dc" stroke-width="1.1"',''),'permission-candidate':('fill="#ffbf47" stroke="#ffbf47" stroke-width="2"',''),'source-plan':('fill="none" stroke="#8b9ba3" stroke-width=".8" stroke-dasharray="3 3"',''),'actual-controller-trip':('fill="none" stroke="#67e2a3" stroke-width="2.2"',''),'short-area-walk':('fill="none" stroke="#67e2a3" stroke-width="4"',''),'trip-stop':('fill="#ff6e78"',''),'water-unvalidated':('fill="#b49cff"',''),'source-access-sample':('fill="#e6a777"','')}
for f in features:
 kind=f['properties']['kind'];g=f['geometry'];attr=styles[kind][0];title=html.escape(f['properties']['name']);body=''
 if g['type']=='Point':body=f'<circle cx="{pt(g["coordinates"]).split(",")[0]}" cy="{pt(g["coordinates"]).split(",")[1]}" r="3" {attr}><title>{title}</title></circle>'
 elif g['type']=='LineString':body=f'<polyline points="{" ".join(pt(p)for p in g["coordinates"])}" {attr}><title>{title}</title></polyline>'
 elif g['type']=='Polygon':body=f'<polygon points="{" ".join(pt(p)for p in g["coordinates"][0])}" {attr}><title>{title}</title></polygon>'
 if body:svg.append(f'<g class="{kind}">{body}</g>')
svg.append('</svg>');(E/'truth-map.svg').write_text('\n'.join(svg))

# Acceptance is deliberately conservative; untested requirements remain present.
rows=[
('T01','Angles → limite historique → retour','ATTEINT'if loop.get('functionalSuccess')else'PARTIEL','Aller-retour sélectionné de 2,377 km via le contrôleur complet accéléré ; franchit la frontière du pilote mais reste dans une seule tuile globale. Les autres sorties ne sont pas toutes réparées.',['spawn-Vicq-return-foot.json','seam-strips.json']),
('T02','Angles → trois tuiles départementales','NON_ATTEINT','Aucune sortie depuis le vrai spawn vers trois tuiles validée. Le parcours Chauvigny ne remplace pas ce départ.',['spawn-SaintPierre-foot.json','blockage-probe.json']),
('T03','Marche intercommunale ≥20 km','ATTEINT'if foot.get('functionalSuccess')and(foot.get('distanceM')or 0)>=20000 and len(foot.get('tiles',[]))>1 else'PARTIEL',f"{n(foot.get('distanceM'))} m mesurés, {len(foot.get('tiles',[]))} tuiles. Le seuil de 20 km et l'arrivée complète ne sont pas validés ; arrêt du banc pendant une attente de support.",['Chauvigny-foot-21km-foot.json','journey-summary.json']),
('T04','Hors route et cinq refus','PARTIEL','Sept petites marches de 8,07 m sur huit candidats explicitement ouverts ; plage sans placement admis. Refus privés/inconnus/rail/autoroute/conditionnels testés au niveau unitaire, pas cinq promenades filmées.',['access.json','checks/tests.txt']),
('T05','Voiture ≥40 km et sortie à pied','PARTIEL'if(car.get('distanceM')or 0)>=40000 else'NON_ATTEINT',f"Maximum automobile mesuré : {n(car.get('distanceM'))} m. Aucun voyage complet de 40 km avec sortie et marche validé.",['Vallee-car-40km-car.json','Chauvigny-furthest-connected-source-car.json']),
('T06','Voiture ≥80 km','NON_ATTEINT','Aucune traversée automobile de 80 km exécutée avec succès ; les longueurs de graphe ne sont pas comptées.',['routes-selection.json','journey-summary.json']),
('T07','Voiture + marche native multi-tuile','NON_ATTEINT','Pas de film natif continu de ce scénario. Les clips indépendants et trajets accélérés ne s’additionnent pas pour le satisfaire.',['candidate-native.json','journey-summary.json']),
('T08','Nouveau packraft 1','NON_ATTEINT','Aucun nouveau corridor départemental avec approche, ≥1 km, sortie et fond admis validé.',['department-water.json']),
('T09','Nouveau packraft 2','NON_ATTEINT','Aucun deuxième secteur et suivi automatique départemental complet validé.',['department-water.json']),
('T10','Nouveau packraft 3','NON_ATTEINT','Aucun troisième secteur, rebase et sauvegarde fluviale départementale validé.',['department-water.json']),
('T11','Marche naturelle 180 s','PARTIEL','Courbes et appuis mesurés sur 180 s synthétiques. Les racines imposées du banc ne sont pas un parcours. Pas de revue humaine suffisante des changements de terrain.',['reference-motion.json','candidate-motion.json','candidate-native.json']),
('T12','Course consécutive 180 s, plat/pente, quatre angles','PARTIEL','Métriques numériques plat/pente et clip natif frontal conservés avec durée de course réellement observée. Les quatre angles, la pente native et l’acceptation perceptive restent incomplets.',['reference-motion.json','candidate-motion.json','reference-native.json','candidate-native.json']),
('T13','Oiseaux et son, proche/loin, caméra fixe/mobile','PARTIEL','Transfert C1 entre perchoirs et dérivées analytiques corrigés. Film de station et audio natifs, sans validation humaine ni cadence matérielle significative.',['candidate-native.json','audio-analysis.json','checks/tests.txt']),
('T14','Troncs, ombres, saisons et vent','PARTIEL','Arbres réancrés et ressources nettoyées ; pas de campagne complète d’approche et de revue perceptive des ombres/LOD.',['candidate-native.json','checks/tests.txt']),
('T15','Performance des trois profils avec streaming','PARTIEL','Bancs logiciels comparables et cas ratés publiés. Ni absence de gel long, ni borne de non-régression ≤5 %, ni objectifs matériels 60/30 validés.',['reference-benchmarks.json','candidate-benchmarks.json','performance-summary.json']),
('T16','Train multi-tuile et arrêt','NON_ATTEINT','Aucun nouveau cycle natif multi-tuile et arrêt certifié. Les modèles historiques conservés ne remplacent pas cet essai.',['audit.json']),
('T17','Avion près de Poitiers-Biard','NON_ATTEINT','Aucun cycle natif significatif piste/altitude/son recertifié.',['audit.json']),
('T18','Carte et route en déplacement','PARTIEL',f"{sum(c.get('passed',False)for c in mapui['cases'])}/{len(mapui['cases'])} contrôles UI réussis, desktop et émulation tactile, worker et route source. Le voyage mobile complet avec rebase et reprise reste ouvert.",['map-ui.json','routes-audit.json']),
('T19','Voyage intermodal et reprises','PARTIEL',f"{sum(c.get('passed',False)for c in journeys['cases'])}/{len(journeys['cases'])} cas indépendants réussis : reprises, rechargements réels et refus contrôlé. Pas de voyage intermodal continu complet.",['journeys.json','fixture.json']),
('T20','Endurance et évictions 30–60 min','NON_ATTEINT','Des évictions sont observées pendant la marche accélérée ; pas de session native continue de 30–60 minutes avec tous les sous-systèmes à cadence native.',['journey-summary.json','candidate-benchmarks.json']),
('T21','Fixture hors France','ATTEINT'if fixture.get('functionalSuccess')else'PARTIEL','Fixture synthétique 47° N/−71°, même runtime/loader/rendu/contact/graphe/reprise : 2,5 km, frontière et support exact. Ce n’est pas une randonnée réelle ni un film natif.',['fixture.json','fixture.png']),
('T22','Préservation M23–M26.1','PARTIEL','437 tests et compilation ; audit des sources protégées. Les activités historiques sont conservées mais la totalité des essais natifs antérieurs n’est pas rejouée.',['checks/tests.txt','checks/build.txt','audit.json','baseline-inventory.json'])]
p0=[('P0_HUMAIN','Tremblement humain','PARTIEL','Tangentes périodiques communes et enveloppe de portée adoucie ; gains numériques localisés, acceptation humaine non acquise.',['reference-motion.json','candidate-motion.json','candidate-native.json']),('P0_OISEAUX','Oiseaux','PARTIEL','Vitesse nulle aux extrémités des transferts et dérivées analytiques ; pas de preuve de fluidité matérielle.',['candidate-native.json','checks/tests.txt']),('P0_TRONCS','Troncs / popping','PARTIEL','Réancrage des arbres et suppression de reconstructions lointaines inutiles ; approche perceptive complète non validée.',['candidate-native.json','checks/tests.txt']),('P0_OMBRES','Ombres','NON_ATTEINT','Aucune correction perceptive des quatre défauts d’ombres certifiée ; comportement hérité et films de station conservés.',['reference-native.json','candidate-native.json']),('P0_RIVIERE','Suivi de rivière','NON_ATTEINT','Diagnostic des berges amélioré ; aucun nouveau voyage départemental complet.',['department-water.json'])]
def scenario(row):
 id,title,status,reason,evidence=row
 return {'id':id,'title':title,'status':status,'reason':reason,'evidence':evidence,'missingEvidence':[p for p in evidence if not(E/p).exists()],'sourceSHA':PROGRAM,'sourceScope':'Candidate program; individual historical and intermediate evidence files retain their own sourceSHA. Do not relabel them as final.','captureMode':'Per linked evidence: accelerated complete frame / kernel / numeric rig / native. Not interchangeable.','perceptualAcceptance':False,'physicalHardwareValidated':False}
accept={'schema':'mission-26-2-acceptance-v1','overall':'PARTIEL','mergeReady':False,'referenceSHA':REF,'executedProgramSHA':PROGRAM,'deliveryCommit':'See the head of draft PR 38; documentation-only commits follow the executed program.','dataPin':'acb0a73b396229bf90731b90a558a8d5d072a9ec','referenceBuild':'builds/reference-final/receipt.json','candidateBuild':'builds/candidate-final/receipt.json','fineTiles':499,'fineBytes':1407876165,'scenarioCount':22,'scenarios':[scenario(r)for r in rows],'historicalP0':[scenario(r)for r in p0],'noMerge':True,'noDeployment':True,'purchaseEUR':0,'humanReview':{'performed':False,'reason':'No independent human visual or listening review performed.'},'hardware':{'desktopGPU':False,'Android':False,'renderer':'Chromium SwiftShader; /dev/dri absent'},'metrics':'journey-summary.json','performance':'performance-summary.json','truthMap':'truth.geojson','retainedFailures':'failed-attempts/','limitations':['499 packs do not establish free access.','Route plans are not actual journeys.','Numeric rig roots are imposed and not travelled distances.','Short low-FPS native films do not establish fluidity.','Old trace local Y is not absolute IGN69 without its base.','Initial diagnostic placements occur before independent cases only.','M26.1 historical evidence remains intact, with its own source hashes.']}
byid={c['id']:c for c in accept['scenarios']}
byid['T01']['metrics']={'distanceM':loop.get('distanceM'),'distinctTiles':len(loop.get('tiles',[])),'sourceSHA':loop.get('sourceSHA'),'capture':'accelerated complete production frame'}
byid['T03']['metrics']={'distanceM':foot.get('distanceM'),'requiredM':20000,'distinctTiles':len(foot.get('tiles',[])),'wallSeconds':foot.get('wallSeconds'),'simulatedSeconds':foot.get('simulatedSeconds'),'loadingWaitMs':foot.get('waitMs'),'completed':foot.get('functionalSuccess')}
byid['T04']['metrics']={'candidateAreas':len(areas['cases']),'shortWalksPassed':sum(c.get('functionalSuccess',False)for c in areas['cases']),'distancesM':[c['walk']['distanceM']for c in areas['cases']if c.get('walk')],'fullyWalkableAreaM2':None,'reasonAreaUnknown':'Only short physical line walks, not exhaustive polygon coverage.'}
for id,required in [('T05',40000),('T06',80000)]:byid[id]['metrics']={'longestActualCarM':car.get('distanceM'),'requiredM':required,'completeJourneyWithExitAndWalk':False}
for id in ['T08','T09','T10']:byid[id]['metrics']={'newValidatedCorridors':0,'newBoatJourneyM':None,'reason':'No new departmental boat journey started and completed; bank diagnostics are not navigated distance.'}
for id in ['T11','T12']:byid[id]['metrics']={'numericRigCases':len(read('candidate-motion.json',{'cases':[]})['cases']),'numericDurationS':180,'rootImposed':True,'nativeDetails':'candidate-native.json','frequencySpectrumMeasured':False,'humanReviewPerformed':False}
byid['T15']['metrics']={'referenceCases':len(read('reference-benchmarks.json',{'cases':[]})['cases']),'candidateCases':len(read('candidate-benchmarks.json',{'cases':[]})['cases']),'rawDistributions':'performance-summary.json','framebuffer':[640,420],'DPR':1,'hardwareValidated':False}
byid['T18']['metrics']={'independentUICases':len(mapui['cases']),'passed':sum(c.get('passed',False)for c in mapui['cases']),'physicalPhone':False}
byid['T19']['metrics']={'independentStateCases':len(journeys['cases']),'passed':sum(c.get('passed',False)for c in journeys['cases']),'continuousIntermodalJourneyCompleted':False}
byid['T18']['metrics']={'functionalCasesPassed':sum(c.get('passed',False)for c in mapui['cases']),'cases':len(mapui['cases']),'physicalPhone':False,'failure':mapui.get('failure')}
byid['T19']['metrics']={'functionalCasesPassed':sum(c.get('passed',False)for c in journeys['cases']),'cases':[{'name':c['name'],'passed':c.get('passed',False),'reload':c.get('reload'),'horizontalErrorDegrees':c.get('horizontalErrorDegrees'),'failure':c.get('failure')}for c in journeys['cases']],'continuousIntermodalJourneyPassed':False,'failure':journeys.get('failure')}
byid['T21']['metrics']={'physicalM':fixture.get('physicalM'),'completed':fixture.get('functionalSuccess'),'fixtureSynthetic':True,'renderedPhysicalHeightErrorM':fixture.get('renderedSupport',0)-fixture.get('physicalSupport',0)if fixture.get('renderedSupport')is not None and fixture.get('physicalSupport')is not None else None,'sourceSHA':fixture.get('sourceSHA')}
byid['T22']['metrics']={'testsPassed':437,'testsFailed':0,'protectedFileAudit':'audit.json','fullNativeHistoricalActivitiesRecampaigned':False}
write('acceptance.json',accept)

# Residual defects, including exact diagnostics instead of geographic generalisations.
defects=[]
for t in trips:
 if not t['functionalSuccess']:defects.append({'priority':'P0','name':t['name'],'gps':t['endGPS'],'tiles':t['tiles'],'movement':t['lastMovement'],'vehicleRefusal':t.get('vehicleRefusal'),'forwardInspection':t.get('forwardInspection'),'evidence':t['file'],'cause':'See exact first refusal and forward inspection; source plan can exceed physical support/clearance.','consequence':'Selected journey incomplete.','reproduction':'See exact from/to/mode in the linked case chosen object; invoke traverse-mission-26-2.mjs with those values and port 5401.','possibleCorrection':'Inspect local source, rendered support and preparation ownership; no invented access or positional repair.'})
for defect in defects:
 if defect.get('vehicleRefusal'):
  vehicle=defect['vehicleRefusal'];defect['cause']=vehicle.get('reason')or 'Vehicle stopped; precise cause unresolved'
  defect['sourceRoad']=vehicle.get('ground',{}).get('road')
  defect['humanMovementDiagnosticIsVehicleCause']=False
for c in seams['cases']:
 if not c.get('functionalSuccess'):defects.append({'priority':'P0','name':c['source'],'gps':next((q.get('gps')for q in reversed(c.get('result',{}).get('outward',{}).get('trace',[]))if q.get('gps')),None),'localStart':c.get('start'),'evidence':'seam-strips.json','cause':c.get('failure')or c.get('result',{}).get('outward',{}).get('diagnostic'),'consequence':'Independent pilot boundary strip incomplete.','possibleCorrection':'Inspect exact forward support and inherited geometry; do not widen or remove obstacles to force a pass.'})
for stage in sorted(stagePeaks.values(),key=lambda q:q['maxStepMs'],reverse=True):
 if stage['label']!='candidate'or stage['maxStepMs']<=50:continue
 tile=stage['stage'].rsplit(':',2)[-2:];tileid=':'.join(tile)if len(tile)==2 and all(q.isdigit()for q in tile)else None
 sourceTile=next((t for t in manifest['tiles']if t['id']==tileid),None)
 bounds=sourceTile['bounds']if sourceTile else None
 gps=gpsxy([(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2])if bounds else None
 defects.append({'priority':'P0','name':'Preparation '+stage['stage'],'tile':tileid,'tileCentreGPS':{'lon':gps[0],'lat':gps[1]}if gps else None,'locationKind':'Derived tile centre, not exact camera location at the long step'if gps else 'Global preparation stage','cause':'Measured CPU step over 50 ms; internal operation cause requires further profiling.','maxStepMs':stage['maxStepMs'],'over50CumulativeMax':stage['over50CumulativeMax'],'consequence':'Long preparation pause remains possible.','evidence':'preparation-peaks.json','reproduction':'Run the sequential final candidate benchmark; inspect labelled preparation stages.','possibleCorrection':'Profile and subdivide the remaining large internal geometry/index/allocation operations without changing the rendered or physical sources.'})
for id,title,status,reason,ev in p0:
 if status!='ATTEINT':defects.append({'priority':'P0','name':id,'scope':'Perceptual / departmental requirement','evidence':ev,'cause':reason,'gps':None,'reasonGPSUnavailable':'Requirement concerns several scenes, not one newly surveyed point.'})
write('residual-defects.json',{'defects':defects,'footHarnessLimit':'The 12.97 km run stopped on its 120 simulated-second non-progression guard while forward support reported tile-loading. The 600 s cumulative loading limit was not reached. This is not proof that the location is impassable; the full 20 km remains unvalidated. Reproduction wrapper now excludes terrain preparation from that non-progression guard; this changed wrapper has not been used to invent additional travelled metres.'})

# Owner report: exactly the eleven requested topics.
lines=['# Mission 26.2 — Vienne réellement jouable : bilan partiel','',
'## 1. Verdict en langage simple','',f"**PARTIEL — PR brouillon non prête à fusionner.** La nouvelle marche la plus longue mesure **{n(foot.get('distanceM',0)/1000)} km**, sur **{len(foot.get('tiles',[]))} tuiles**, depuis Chauvigny. Elle ne termine pas le trajet de 21 km. L’aller-retour sélectionné depuis Angles mesure **2,377 km** et réussit ; il reste dans une seule tuile globale. Aucun voyage automobile complet de 40/80 km et aucun nouveau corridor fluvial de 1 km ne sont certifiés.",'',
'Les trajets sont pilotés par les entrées normales du jeu et les collisions restent actives. Les nouveaux essais sont accélérés avec des rendus espacés : ils ne démontrent pas la fluidité native. Le premier essai Saint-Pierre dessine chaque pas manuel, comme son champ méthode le précise ; il ne sert pas de mesure de FPS comparable. Les clips natifs et les mesures de performance sont séparés. Leur horloge d’environnement est distincte du temps du contrôleur : [l’analyse temporelle](mission-26-2-evidence/native-timing-analysis.json) publie une borne supérieure du temps physique, sans inventer le dt natif non exporté. Le moteur corrige plusieurs causes réelles, mais les critères majeurs de liberté, voyage et perception restent ouverts.','',
'[Ouvrir la galerie autonome](mission-26-2-evidence/index.html) · [Acceptance complète](mission-26-2-evidence/acceptance.json) · [Reproduction](mission-26-2-evidence/REPRODUCTION.md)','',
'## 2. M26.1 → M26.2','',
'| Problème | Cause observée | Correction | Preuve et statut |','| --- | --- | --- | --- |',
'| Marche hors des chaussées | Politique limitée aux voies | Permissions explicites des polygones, inconnus et privés conservés | [7 marches courtes / 8 candidats](mission-26-2-evidence/access.json) ; PARTIEL |',
'| Voie étroite voisine bloquant une route | Sélection par proximité sans capsule contenue | Sélection du corridor contenant réellement la capsule | [Tests](mission-26-2-evidence/checks/tests.txt) ; pas une validation de toutes les jonctions |',
'| Obstacle ferroviaire fantôme à 5,64 km | `railway=razed` pris pour rail actuel | État démantelé distingué, accès et rails actifs toujours contrôlés | [Échec initial](mission-26-2-evidence/failed-attempts/razed-rail-5km.json), [nouveau trajet](mission-26-2-evidence/Chauvigny-foot-21km-foot.json) dépasse le point ; corrigé localement |',
'| Préparation et reconstruction | Normales synchrones, lots statiques et LOD lointains reconstruits | Normales exactes incrémentales, réutilisation de LOD, cache de contact par frame/révision, mesures par étape | [Bancs et limites](mission-26-2-evidence/performance-summary.json) ; absence de gel non certifiée |',
'| Arbres flottants / colliders incohérents | Ancien support lors du raffinement et arbres inférés sur voies | Réancrage au mesh courant, exclusions des infrastructures, index spatial ; matériau libéré | [Tests](mission-26-2-evidence/checks/tests.txt), film de forêt ; perception PARTIELLE |',
'| Trafic bloquant les deux sens | Positions centrales et approximation circulaire | Voies à droite si largeur suffisante, empreintes complètes et support rendu fini | [Essais auto](mission-26-2-evidence/journey-summary.json) ; longs trajets encore non atteints |',
'| Tremblement / vol qui se recale | Tangentes différentes aux clés et vitesse finale non nulle entre perchoirs | Courbes périodiques et transfert à vitesse finale nulle ; dérivées analytiques | [Métriques](mission-26-2-evidence/candidate-motion.json) et films natifs ; perception non acquise |',
'| Reprise avant chargement | Support du joueur / véhicule garé pas encore prêt | Attente des deux supports, statut terrain explicite | [Reprises](mission-26-2-evidence/journeys.json) ; voyage intermodal complet ouvert |',
'| Aucun nouveau parcours aquatique | Admission de berge/support, sélection de station parfois impossible | Diagnostics distincts et calcul local borné, aucun droit ni fond mesuré inventé | [Quatre secteurs](mission-26-2-evidence/department-water.json) ; NON ATTEINT |','',
'## 3. Les 22 scénarios d’acceptation','',
'Les preuves gardent leur SHA propre ; une réussite partielle ou un test de noyau ne vaut pas satisfaction du scénario complet.','',
'| ID | Statut | Résultat et limites | Preuves |','| --- | --- | --- | --- |']
for id,title,status,reason,ev in rows:lines.append(f"| {id} — {title} | {status} | {reason} | "+' · '.join(link('mission-26-2-evidence/'+p,Path(p).name)for p in ev)+' |')
lines+=['','## 4. Les cinq P0 historiques','','| P0 | Statut | Avant / après et acceptation |','| --- | --- | --- |']
for id,title,status,reason,ev in p0:lines.append(f'| {title} | {status} | {reason} '+ ' · '.join(link('mission-26-2-evidence/'+p,Path(p).name)for p in ev)+' |')
lines+=['','Les comparaisons numériques portent sur 24 cas de rig (six cadences, marche/course, plat/pente) de 180 s. Les racines y sont imposées ; ces distances ne sont jamais ajoutées aux voyages. Les dérivées d’accélération/jerk sont des différences finies de vitesse angulaire scalaire, pas des vecteurs signés. Aucun spectre fréquentiel complet ni jugement humain de disparition du tremblement n’est revendiqué.','',
'## 5. Carte de vérité du département','','[Carte SVG](mission-26-2-evidence/truth-map.svg) · [GeoJSON 2D](mission-26-2-evidence/truth.geojson) · [Sources et droits](mission-26-2-data.md). Les 499 packs fins (1 407 876 165 octets) et les données historiques sont conservés. Leur couverture n’est pas une permission de passage. Le bleu gris montre la couverture de données, l’ambre les permissions candidates, les pointillés les plans de routes, le vert uniquement les déplacements mesurés et le rouge les arrêts. Le violet signale les secteurs fluviaux non validés. **Aucune nouvelle tranche de rivière n’est peinte comme navigable.**','',
'Sept marches de huit mètres ne certifient pas toute la surface des polygones ouverts. Les accès inconnus, privés et ouvrages non vérifiés restent contrôlés. La complétude légale des tags conditionnels/barrières du corpus n’est pas garantie. Les données source, règles inférées et objets de simulation sont décrits séparément dans le document de données.','',
'## 6. Voyages réellement effectués','','| Essai | Distance physique | Temps mur / simulé | Tuiles distinctes | Résultat |','| --- | --- | --- | --- | --- |']
for t in trips:lines.append(f"| {link('mission-26-2-evidence/'+t['file'],t['name'])} ({short(t['sourceSHA'])}) | {n(t['distanceM'])} m | {n(t['wallSeconds'])} s / {n(t['simulatedSeconds'])} s | {', '.join(t['tiles'])or 'non exportées'} | {'terminé'if t['functionalSuccess']else 'incomplet'} |")
lines+=['','Les placements de départ hors Angles sont explicites avant chaque essai indépendant. Le départ sélectionné Angles conserve le véritable spawn. Aucun repositionnement après collision n’est utilisé pendant un voyage. Les coordonnées, commandes, refus, propriétaires physiques, streaming et rebases sont dans les traces brutes et le [résumé](mission-26-2-evidence/journey-summary.json). Leurs altitudes locales anciennes ne doivent pas être lues comme altitudes IGN69 absolues.','',
'L’essai de 12,97 km est interrompu par la garde de non-progression du banc pendant une attente du support suivant (`tile-loading`) ; il n’atteint pas la limite cumulative de 600 s de chargement. Il ne démontre pas une impossibilité géographique. Le wrapper de reproduction distingue désormais cette attente du manque de progrès, mais aucun kilomètre supplémentaire n’est revendiqué sans nouvel essai. Le point d’arrêt exact, la voie, les tuiles et la première obstruction restent consultables.','',
'Les 27 bandes de couture sont indépendantes et utilisent le noyau de déplacement au pas de 60 Hz : '+str(sum(c.get('functionalSuccess',False)for c in seams['cases']))+'/27 réussissent dans la cohorte '+short(seams.get('sourceSHA'))+'. Elles ne remplacent pas un voyage multi-tuile. L’audit historique de 938 bords fins porte sur les mêmes données conservées ; ce n’est pas 938 nouveaux franchissements physiques.','',
'## 7. Performance honnête','','Machine distante, Chromium/SwiftShader, aucun `/dev/dri`, aucun ordinateur à GPU physique et aucun Android physique testés. Les 60/30 FPS cibles restent **non validés**. Mesures natives sans encodeur, framebuffer 640×420 DPR 1, mêmes profils, graine, date et effets actifs avec audio. Les stations sont comparables ; les déplacements et l’historique de préparation peuvent diverger. Les matrices de caméra ne sont pas exportées dans ces snapshots ; des presets identiques ne constituent pas une identité stricte des scènes. Les échantillons de 20 s sont courts et ne certifient pas un P99 robuste ni une non-régression ≤5 %.','',
f"Plus grande durée de pas de préparation observée dans les snapshots du candidat : **{n(max((p['maxStepMs']for p in stagePeaks.values()if p['label']=='candidate'),default=None))} ms**. Ces dépassements restent des défauts ouverts ; ils ne sont pas masqués par une moyenne de FPS.",'',
'| Profil / scène | P50 ms réf. → cand. | P95 ms réf. → cand. | P99 ms réf. → cand. | Max ms réf. → cand. | FPS réf. → cand. |','| --- | --- | --- | --- | --- | --- |']
for c in [p for p in perf if p['label']=='candidate']:
 r=next((p for p in perf if p['label']=='reference'and p['profile']==c['profile']and p['scene']==c['scene']),{});rf=r.get('frameMs')or{};cf=c.get('frameMs')or{};pair=lambda k:f"{n(rf.get(k))} → {n(cf.get(k))}"
 lines.append(f"| {c['profile']} / {c['scene']} | {pair('p50')} | {pair('p95')} | {pair('p99')} | {pair('max')} | {n(r.get('fps'))} → {n(c.get('fps'))} |")
lines+=['','Les cas ratés restent dans les JSON ; une ligne sans mesure ne signifie pas 0 ms. Les [mesures brutes](mission-26-2-evidence/candidate-benchmarks.json) et le [résumé](mission-26-2-evidence/performance-summary.json) exposent aussi les tâches longues et étapes de préparation >8/>50 ms, les maxima, le heap et les miroirs CPU de géométrie. Le budget de 96 MiB ne compte que la géographie décodée. Il exclut GPU/pilote, pic worker, index de routage et objets du pilote. Ces compteurs se recouvrent et ne doivent pas être additionnés comme mémoire totale. Le temps d’attente d’une marche accélérée n’est pas un gel de frame natif.','',
'Les [pics de préparation par étape](mission-26-2-evidence/preparation-peaks.json) conservent les dépassements >8/>50 ms sans additionner les compteurs cumulés répétés. Ces durées utilisent performance.now autour du pas du générateur ; elles incluent d’éventuels GC et délais d’ordonnancement et ne sont pas des compteurs de cycles CPU. Les attentes réseau, cadence logicielle et allocations non mesurées restent distinguées.','',
'## 8. Fidélité artistique et sonore','','Les films de marche/course, forêt, départ réel et bateau du pilote sont consultables côte à côte dans la galerie. Leur faible cadence logicielle reste visible. Le son vient du mixage stéréo original, sans musique ajoutée. Les paquets et SHA sont conservés ; [analyse audio](mission-26-2-evidence/audio-analysis.json). Une analyse numérique ne remplace pas l’écoute. Aucune revue humaine indépendante des paysages, arbres, ombres, oiseaux ou sons n’a été réalisée.','',
'Le relief fin et le bâti source sont conservés ; largeur des routes, hauteurs sans tags, arbres et habitat restent inférés. Les stations couvertes sont celles des captures réellement produites, pas une certification des 265 communes. Pas de nouvelle série photographique de référence, de diversité complète des biomes, de service ferroviaire ou de cycle avion validé. Le fond des rivières reste une reconstruction de jeu de faible confiance, sans bathymétrie mesurée ni garantie de sécurité.','',
'## 9. Préservation, licences et Git','','**437 tests passent**, TypeScript et Vite compilent. [Logs](mission-26-2-evidence/checks/tests.txt), [build](mission-26-2-evidence/checks/build.txt), [audit des fichiers protégés](mission-26-2-evidence/audit.json) et [fichiers de programme modifiés](mission-26-2-evidence/source-changes.json). Les modifications intentionnelles du corpus public concernent le graphe dérivé `land.pack`/`land.json` et le manifeste de fixture ; les 499 packs fins, les monuments, sources et assets du pilote sont conservés. Les workflows ne sont pas modifiés. Les preuves et échecs M26.1 restent consultables à leurs chemins d’origine.','',
'Référence : `'+REF+'`. Programme candidat exécuté : `'+PROGRAM+'`. Les [reçus exacts](mission-26-2-evidence/builds/candidate-final/receipt.json) conservent les bundles et les SHA code/données ; les commits de livraison ultérieurs concernent les scripts et documents. La référence exportée n’invente pas de SHA Git dans le HUD lorsqu’elle n’est pas dans un checkout Git ; le reçu fixe son origine.','',
'La même [PR brouillon 38](https://github.com/sebastienleidgens-lab/endless-earth/pull/38) consolide M25.2 + M26 + M26.1 + M26.2. Les têtes M25.2 et son merge sont ancêtres de la branche, mais absentes de `main` vérifié. `main` initial : `01e791be64cefae2eb1e90ab465f9bf0b848c33e`. Aucun merge, aucun déploiement et aucun achat ; coût ajouté **0 €**. IGN Licence Ouverte 2.0, OSM ODbL et attributions audio/matériaux historiques conservés. Les grands packs ne sont pas dupliqués par build ; les médias natifs livrés sont indexés sans réencoder les images.','',
'## 10. Registre des défauts résiduels','','[Registre structuré géolocalisé](mission-26-2-evidence/residual-defects.json) et points rouges de la carte. Priorités P0 : départ d’Angles vers trois tuiles, fin de la marche de 20 km, voiture longue distance, nouveaux corridors fluviaux, perception humain/oiseaux/troncs/ombres. Les blocages exacts sont liés aux traces, GPS, sources et tuiles disponibles ; les coordonnées absentes sont signalées, jamais inventées.','',
'La sortie Saint-Pierre bute près de l’eau cartographiée (46,702437 / 0,878446) ; l’essai automobile de Chauvigny s’arrête au premier carrefour (46,572314 / 0,649579). Le nouvel essai automobile en vallée s’arrête à 3,883 km (46,577320 / 0,631644), sur `osm:way:927245732`, avec le refus `road-height-discontinuity` ; la cause précise de la différence de support reste à résoudre, sans relever le seuil pour forcer le passage. Deux bandes restent incomplètes : `osm:way:450089955`, `osm:way:757440678`. Le refus final des deux bandes est `steep-support` : pente normale du support reconstruite à environ 84,5 % / 84,6 %, au-dessus du seuil de 70 %, même si la pente dans la direction du pas est moindre. Vérifier le raccord et sa géométrie source avant de modifier ce seuil ou le terrain. Inspecter aussi la source d’accès et la propriété du mesh. Les frontières historiques et les rues du pilote ne sont pas réécrites pour forcer la réussite.','',
'Les refus de berge de Chauvigny/Châtellerault sont diagnostiqués ; La Roche-Posay et Vauchiron ont aussi des échecs de sélection de départ. Ils ne prouvent pas l’inaccessibilité naturelle de toutes leurs berges. Les cinq critères P0 restent explicitement dans l’acceptance. P1 : campagne matérielle, endurance native 30–60 min, trajet mobile avec carte/rebase/reprise, revue artistique/audio et train/avion.','',
'## 11. Décision suggérée','','**Conserver la PR en brouillon, non prête à fusionner.** Les corrections et les preuves partielles sont livrées en un seul dossier ; les critères manquants restent ouverts. Aucun accord intermédiaire, fusion ou mise en production n’a été effectué.']
Path('docs/mission-26-2.md').write_text('\n'.join(lines)+'\n')
