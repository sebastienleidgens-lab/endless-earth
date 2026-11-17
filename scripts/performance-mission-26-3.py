import json,pathlib,math
r=pathlib.Path('docs/mission-26-3-evidence')
def load(p,d=None):
 try:return json.loads((r/p).read_text())
 except FileNotFoundError:return d
benches=[];tasks=[]
for label in ['reference','candidate']:
 d=load(label+'-benchmarks.json',{});cases=[]
 for c in d.get('cases',[]):
  b,a=c.get('before',{}),c.get('after',{});known={(t['t'],t['ms'])for t in b.get('longTasks',[])};delta=[t for t in a.get('longTasks',[])if(t['t'],t['ms'])not in known]
  tasks.extend(dict(label=label,scene=c['scene'],profile=c['profile'],sourceSHA=d.get('sourceSHA'),**t)for t in delta if t['ms']>50)
  cases.append(dict(scene=c['scene'],profile=c['profile'],sourceSHA=d.get('sourceSHA'),functionalSuccess=c.get('functionalSuccess',False),failure=c.get('failure'),frameMs=c.get('frameMs'),averageFps=c.get('averageFps'),actualBuffer=b.get('buffer'),audioEnabledBefore=b.get('audioEnabled'),audioEnabledAfter=a.get('audioEnabled'),beforeState=b.get('diagnosticState'),afterState=a.get('diagnosticState'),rootBefore=b.get('position'),rootAfter=a.get('position'),loadedBefore=b.get('planet',{}).get('stream',{}).get('loaded'),loadedAfter=a.get('planet',{}).get('stream',{}).get('loaded'),residentBytes=a.get('planet',{}).get('stream',{}).get('residentBytes'),longTasksDuringSample=delta,sourceFile=label+'-benchmarks.json'))
 benches.append(dict(label=label,sourceSHA=d.get('sourceSHA'),method=d.get('method'),functionalSuccess=d.get('functionalSuccess',False),failure=d.get('failure'),cases=cases))
comparisons=[]
ref={(c['profile'],c['scene']):c for c in benches[0]['cases']}
for c in benches[1]['cases']:
 a=ref.get((c['profile'],c['scene']));
 if not a:continue
 s=a.get('beforeState')or{};t=c.get('beforeState')or{};cameraEqual=s.get('camera')==t.get('camera')and bool(s.get('camera'));timeEqual=(s.get('climate')or{}).get('time')==(t.get('climate')or{}).get('time')and bool(s.get('climate'))
 comparisons.append(dict(scene=c['scene'],profile=c['profile'],framebufferEqual=a.get('actualBuffer')==c.get('actualBuffer')==[640,420],cameraExactlyEqual=cameraEqual,climateTimeExactlyEqual=timeEqual,actualDateEqual=(s.get('climate')or{}).get('date')==(t.get('climate')or{}).get('date'),comparisonValidForFivePercent=False,reason='Small software-rendered sample; camera/light/phase and cold-warm state are not all strictly matched. Raw percent changes are not acceptance.'))
endurance=[]
for file in ['endurance.json','endurance-recovery.json']:
 d=load(file,{});stream=d.get('after',{}).get('planet',{}).get('stream',{});heaps=[s['heap']for s in d.get('samples',[])if isinstance(s.get('heap'),(float,int))]
 endurance.append(dict(sourceFile=file,sourceSHA=d.get('sourceSHA'),method=d.get('method'),completed=d.get('completed'),wallSeconds=d.get('wallSeconds'),stations=len(d.get('stations',[])),loaded=stream.get('loaded'),evicted=stream.get('unloaded'),residentBytes=stream.get('residentBytes'),errors=stream.get('errors'),heapMin=min(heaps,default=None),heapMax=max(heaps,default=None),geographicallyContinuous=False,nativeThirtyMinutes=False,audioAcceptance=False,audioLimit='Early harness used a missing audio.enabled property and toggled audio at successive stations. Actual snapshots are retained; this cannot certify audio endurance.'))
peaks=[]
for file in ['travel/Chauvigny-foot-21km-foot.json','predictive/Vallee-stop-car-40km-car.json','river-1-priority.json','river-2-warm.json','river-3-final.json','river-4-cycle.json']:
 d=load(file,{});sha=d.get('sourceSHA');gps=d.get('travel',{}).get('end',{}).get('gps')
 def visit(v,path):
  if isinstance(v,dict):
   for k,x in v.items():
    if k in ['maxSliceMs','maxInstallMs','maxCpuMs','maxBatchMs']and isinstance(x,(float,int)):peaks.append(dict(sourceFile=file,path=path+'.'+k,ms=x,above50=x>50,sourceSHA=sha,gps=gps,scope='Concurrent accelerated functional campaign; elapsed JS time includes preemption/GC and harness batches, not exclusive CPU or isolated native FPS.'))
    elif isinstance(x,dict):visit(x,path+'.'+k)
 for key in ['water','failedState','warmup']:visit(d.get(key,{}),key)
 visit(d.get('travel',{}).get('end',{}),'travel.end')
media=[]
for label in ['reference-checked','candidate-checked']:
 d=load('visual-regressions/'+label+'-native.json',{})
 for c in d.get('cases',[]):media.append(dict(label=label,name=c['name'],sourceSHA=d.get('sourceSHA'),captureValid=c.get('captureValid'),frames=c.get('frames'),wallSeconds=c.get('wallSeconds'),simulationSeconds=c.get('simulationSeconds'),averageRenderedFps=c.get('averageRenderedFps'),instancesDeclaredFrames=c.get('framesWithBirds'),sourceFile='visual-regressions/'+label+'-native.json',performanceComparable=False,limit='Native capture under software rendering and concurrent functional load; not an isolated benchmark or human perceptual validation. Instance metrics do not prove on-screen visibility.'))
report=dict(method='Separate functional acceleration, native films, isolated benchmarks and endurance. No fabricated hardware FPS, graph odometer or unqualified speedup.',hardware={'renderer':'ANGLE SwiftShader software Vulkan on Linux Chromium','physicalDesktopGPU':False,'physicalPhone':False,'desktop60FpsValidated':False,'phone30FpsValidated':False},benchmarks=benches,pairedComparisons=comparisons,nonRegressionFivePercentValidated=False,mainThreadEightMsValidated=False,noTasksOver50MsValidated=False,observedLongTasksOver50=tasks,maxObservedNativeBenchmarkLongTaskMs=max((t['ms']for t in tasks),default=None),taskCoverage='LongTask observer bounded to2048 entries. Differences of before/after snapshots cover observed sample tasks; an unreported task is not proved absent.',preparationPeaks=peaks,endurance=endurance,nativeFilms=media,terrainEquivalence='terrain-equivalence.json',coldWarmLimit='One browser per benchmark campaign with scene transitions and requested warmup; history/background refinement exported. No strictly paired cold and warm repetitions for every scene. Eight-second samples cannot establish robust P99 or ≤5%.')
(r/'performance.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print({'benchmarkCases':[len(b['cases'])for b in benches],'nativeFilms':len(media),'maxLongTask':report['maxObservedNativeBenchmarkLongTaskMs']})
# Parameter comparison of held initial poses; this does not judge motion.
a=load('visual-regressions/reference-paired-stills.json',{});b=load('visual-regressions/candidate-paired-stills.json',{});rows=[]
for x,y in zip(a.get('cases',[]),b.get('cases',[])):
 s=x['state'];t=y['state'];p=s['snapshot']['position'];q=t['snapshot']['position'];ca=s['diagnostic']['camera'];cb=t['diagnostic']['camera'];offset=lambda camera,root:[camera['position'][i]-root[i]for i in range(3)];u,v=offset(ca,p),offset(cb,q);ce=max(abs(c-d)for c,d in zip(u,v));rotation=max(abs(c-d)for c,d in zip(ca['quaternion'],cb['quaternion']));rows.append(dict(scene=x['scene'],profile=x['profile'],referenceImage=x['image'],candidateImage=y['image'],actualBufferEqual=s['snapshot']['buffer']==t['snapshot']['buffer']==[800,600],relativeCameraErrorM=ce,cameraQuaternionError=rotation,rootYDifferenceM=q[1]-p[1],climateEqual=s['diagnostic']['climate']==t['diagnostic']['climate'],sourceSHAs=[a.get('sourceSHA'),b.get('sourceSHA')],motionAcceptance=False))
(r/'visual-regressions/paired-comparison.json').write_text(json.dumps(dict(method='Actual initial parameter/matrix comparison of held poses. Relative camera is compared because corrected road contact can change root altitude. Static equality is not gait, flight or shadow stability acceptance.',cases=rows),indent=2,ensure_ascii=False)+'\n')
