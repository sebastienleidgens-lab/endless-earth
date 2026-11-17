import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {openMission} from './lib/mission-26-2-browser.mjs';
import {indexNativeWebM} from './lib/native-webm.mjs';
const label=process.argv[2]??'candidate',port=Number(process.argv[3]??5401),only=process.argv[4],out='docs/mission-26-2-evidence';
const routes=JSON.parse(await readFile('work/mission-26-1/run-routes.json')),departure=JSON.parse(await readFile(out+'/routes-selection.json')).cases.find(c=>c.to==='Vicq-return'),site=JSON.parse(await readFile('docs/mission-25-1-evidence/swim-accesses.json'))[0].site;
const report={method:'NATIVE real-time canvas + original stereo AudioContext, no manual stepping during recording, no interpolated/repeated frames added, no position assignment during any clip. Placements are explicit BEFORE independent station clips; departure keeps the true seeded spawn. Software rendering, no perceptual or hardware claim.',label,errors:[],cases:[]};
const scenes=[['run-flat-front',200],['departure',200],['forest-birds-shadows',90],['pilot-boat',90]].filter(([name])=>!only||name===only);
for(const [name,seconds]of scenes){let browser,page;const c={name,requestedSeconds:seconds,functionalSuccess:false};
 try{
  ({browser,page,errors:c.errors}=await openMission(port,{width:640,height:420}));c.sourceSHA=await page.evaluate(()=>window.p262.source);
  if(name==='run-flat-front')c.sourceWay=routes.flat.source;
  if(name==='run-flat-front')await page.evaluate(r=>{window.p262.match({...r.points[0],heading:r.heading,yaw:r.heading,profile:'balanced',zoom:5.5,date:'2026-06-21'});window.p252.walk(r.points,true);},routes.flat);
  if(name==='departure')await page.evaluate(points=>{window.p252.profile('balanced');window.p252.walk(points,false);},departure.route.localPoints);
  if(name==='forest-birds-shadows')await page.evaluate(()=>window.p262.match({x:-620,z:-300,profile:'balanced',zoom:4.2,date:'2026-06-21'}));
  if(name==='pilot-boat'){
   await page.evaluate(site=>{window.p262.match({profile:'balanced',date:'2026-06-21'});window.p252.bank(site);window.p252.profile('balanced');window.p252.action('boat');window.p252.hold(false);},site);
   await page.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='boating',null,{timeout:60000});await page.evaluate(()=>window.p252.input(.65,0));
  }
  await page.evaluate(()=>{window.p252.hold(true);if(!window.endlessDiagnostics.sound)window.p252.audio();});
  await page.evaluate(()=>window.p252.render());c.profile=await page.evaluate(()=>window.p252.state().profile);c.spawnSeed=12345;c.date='2026-06-21';c.before=await page.evaluate(()=>window.p262.snapshot());c.before.profile=c.profile;await page.screenshot({path:`${out}/${label}-${name}-before.png`});
  await page.evaluate(()=>window.q26.start());
  const started=performance.now();while(performance.now()-started<seconds*1000){await page.waitForTimeout(Math.min(10000,Math.max(100,seconds*1000-(performance.now()-started))));const q=await page.evaluate(()=>({position:window.p262.position(),activity:window.p262.activity()}));console.log(label,name,Math.round((performance.now()-started)/1000),q.activity,q.position);}
  const data=await page.evaluate(()=>window.q26.stop()),bytes=Buffer.from(data.base64,'base64'),stem=`${label}-${name}`,file=`${stem}.webm`;
  await mkdir(out+'/raw',{recursive:true});await writeFile(out+'/'+file,bytes);c.media=await indexNativeWebM(out+'/'+file,out+'/raw/'+file);c.video=file;c.original='raw/'+file;c.blobSHA=createHash('sha256').update(bytes).digest('hex');c.browserBlobSHA=data.sha256;c.blobHashVerified=c.blobSHA===data.sha256;if(!c.blobHashVerified)throw Error('Native media transport hash mismatch');c.framesFile=stem+'-frames.json.gz';c.transformsFile=stem+'-transforms.json.gz';
  await writeFile(out+'/'+c.framesFile,gzipSync(JSON.stringify(data.frames),{mtime:0}));await writeFile(out+'/'+c.transformsFile,gzipSync(JSON.stringify(data.transforms),{mtime:0}));
  c.frames=data.frames.length;c.observedWallSeconds=data.frames.length>1?(data.frames.at(-1).t-data.frames[0].t)/1000:0;c.averageRenderedFps=(data.frames.length-1)/c.observedWallSeconds;
  let distance=0,span=0,longest=0,birdFrames=0,boatDistance=0,maxStep=0;
  for(let i=0;i<data.frames.length;i++){const f=data.frames[i];birdFrames+=Number((f.birds?.individuals??0)>0);if(!i)continue;const p=data.frames[i-1],d=Math.hypot(f.position[0]-p.position[0],f.position[2]-p.position[2]);distance+=d;maxStep=Math.max(maxStep,d);if(f.activity==='boating'&&p.activity==='boating')boatDistance+=d;if(f.activity==='running'&&p.activity==='running'){span+=(f.t-p.t)/1000;longest=Math.max(longest,span);}else span=0;}
  let runSim=0,longestRunSim=0;for(let i=1;i<data.transforms.length;i++){const a=data.transforms[i-1],b=data.transforms[i];if(a.activity==='running'&&b.activity==='running'&&Number.isFinite(a.time)&&Number.isFinite(b.time)){runSim+=Math.max(0,b.time-a.time);longestRunSim=Math.max(longestRunSim,runSim);}else runSim=0;}c.simulationElapsedS=data.transforms.length>1?data.transforms.at(-1).time-data.transforms[0].time:null;c.longestConsecutiveRunSimulationS=longestRunSim;c.nativeLowFpsLimit='Production dt cap remains active: wall-clock recording duration can greatly exceed simulated game time. Wall run spans are not 180 simulated seconds.';
  Object.assign(c,{distanceM:distance,boatDistanceM:boatDistance,maxRenderedStepM:maxStep,longestConsecutiveObservedRunS:longest,framesWithBirds:birdFrames});
  c.after=await page.evaluate(()=>window.p262.snapshot());await page.screenshot({path:`${out}/${label}-${name}-after.png`});c.captureValid=c.frames>1&&c.errors.length===0&&c.media.packetPTSAndPayloadsIdentical;c.assertions={nativeCanvasAndAudio:c.captureValid,running180Observed:longest>=180,running180Simulation:longestRunSim>=180,birdsObserved:birdFrames>0,boatMotionObserved:boatDistance>.5};c.functionalSuccess=c.captureValid&&(name==='run-flat-front'?longest>=180&&longestRunSim>=180:name==='departure'?distance>10:name==='forest-birds-shadows'?birdFrames>0:boatDistance>.5);
  c.acceptanceLimit=name==='run-flat-front'?'One 233.735 m source-road station, one angle only. Wall and simulated run spans are separate; full 180 simulated seconds, flat/slope four-angle and human perceptual acceptance remain open.':name==='departure'?'Short real default-spawn excerpt; no multi-tile departure asserted.':name==='pilot-boat'?'Existing pilot only; no new departmental corridor or 1 km navigation asserted.':'Station clip; only actually observed birds count; low FPS cannot certify fluidity.';
 }catch(e){c.failure=String(e);console.log(label,name,c.failure);}finally{await browser?.close();report.cases.push(c);await writeFile(out+'/'+label+'-native.json',JSON.stringify(report,null,2));}
}
