import {readFile,writeFile} from 'node:fs/promises';
import {inverseLambert93} from '../src/planet/coordinates.mjs';
import {openMission} from './lib/mission-26-2-browser.mjs';
const selection=JSON.parse(await readFile('docs/mission-26-2-evidence/routes-selection.json'));
const maxWallSeconds=Number(process.env.M262_MAX_WALL_SECONDS??2700);
const from=process.argv[2]??'spawn',to=process.argv[3]??'SaintPierre',mode=process.argv[4]??'foot',port=Number(process.argv[5]??5397);
const chosen=selection.cases.find(c=>c.from===from&&c.to===to&&c.mode===mode);
const report={method:'Accelerated COMPLETE production frame, explicit dt .25 s, normal input vector, real controllers/collisions/streaming/audio/rig. Rendering only at checkpoints; not a native film or FPS test. Diagnostic source-road placement only BEFORE traversal except spawn which is untouched. No position assignment or collider alteration during travel.',chosen,maxWallSeconds,errors:[],functionalSuccess:false};let browser,page,progressTimer,placement;
try{
 ({browser,page,errors:report.errors}=await openMission(port));report.before=await page.evaluate(()=>window.p262.snapshot());report.sourceSHA=report.before.source;
 if(!chosen?.route.complete)throw Error('No admitted source route; no invented connector');
 if(from!=='spawn'){
  const point=inverseLambert93(chosen.route.points[0]);placement=await page.evaluate(async({point,mode})=>{const p=await window.q26.regionPlace(point,mode);window.p252.hold(true);return p;},{point,mode});
 }
 if(mode==='car'){const points=chosen.route.localPoints;placement.heading=Math.atan2(points[1].x-points[0].x,points[1].z-points[0].z);report.vehiclePlacement=await page.evaluate(p=>window.q26.carPlace(p),placement);if(!report.vehiclePlacement.clear.ok)throw Error('Source car hull placement refused');await page.evaluate(()=>{window.p262.driving(true);for(let i=0;i<8;i++)window.p262.step(.125);});if(!(await page.evaluate(()=>window.p262.car().active)))throw Error('Could not enter the actual car');}
 await page.evaluate(()=>{window.p252.hold(true);if(!window.p262.snapshot().audio.enabled)window.p252.audio();});
 await page.evaluate(()=>{const s=document.querySelector('select[aria-label="Vue du personnage"]');s.value='first';s.dispatchEvent(new Event('change'));});report.view='first-person';
 report.start=await page.evaluate(()=>window.p262.snapshot());
 progressTimer=setInterval(async()=>{try{const q=await page.evaluate(()=>window.p262.telemetry());console.log('progress',q.position,q.canonicalTile,q.admission?.reason??q.activity);}catch{}},15000);
 report.travel=await page.evaluate(async({points,mode,maxWallSeconds})=>{
  const trace=[],dt=.25,start=performance.now();window.__mission262Trace=trace;let cursor=0,distance=0,steps=0,still=0,waitMs=0,lastCursor=-1,bestRemaining=Infinity,progressAge=0,last=window.p262.telemetry().position,completed=false,detourPath=null,detourCursor=0,detourAttempts=0,maxStepM=0;const detours=[];
  const tracePoint=(before,after,command)=>{const a=after.admission;return {step:steps,simulationSeconds:steps*dt,wallMs:performance.now()-start,position:after.position,gps:after.gps,datum:'IGN69',localYIsRelative:true,altitudeM:after.position[1]+after.heightBaseM,owner:a?.road??a?.source??a?.tile,tile:a?.tile,normal:a?.normal,slope:a?.slope,supportHeight:a?.height,reason:a?.reason,activity:after.activity,canonicalTile:after.canonicalTile,command,distanceM:distance,stream:after.stream,origin:after.origin,car:mode==='car'?window.p262.car():undefined};};
  window.p252.walk(points,false);
  while(steps<240000){
   const current=window.p262.telemetry(),p=current.position;
   while(cursor<points.length-1&&Math.hypot(points[cursor].x-p[0],points[cursor].z-p[2])<(mode==='car'?2.2:.5))cursor++;
   if(cursor!==lastCursor){lastCursor=cursor;bestRemaining=Infinity;progressAge=0;}
   if(detourPath&&Math.hypot(detourPath[detourCursor].x-p[0],detourPath[detourCursor].z-p[2])<.16){if(detourCursor===detourPath.length-1){detourPath=null;detourCursor=0;}else detourCursor++;bestRemaining=Infinity;progressAge=0;}
   const target=detourPath?detourPath[detourCursor]:points[cursor],remaining=Math.hypot(target.x-p[0],target.z-p[2]);if(remaining<bestRemaining-.05){bestRemaining=remaining;progressAge=0;}else progressAge+=dt;const preparing=current.stream?.active||current.stream?.queued||current.admission?.reason==='tile-loading'||current.movement?.obstruction?.reason==='tile-loading'||(mode==='car'&&window.p262.car().reason==='tile-loading');if(preparing)progressAge=0;else if(progressAge>120)break;
   if(cursor===points.length-1&&remaining<(mode==='car'?2.5:.6)){completed=true;break;}
   let command={forward:1,strafe:0};
   if(mode==='foot'){const dx=target.x-p[0],dz=target.z-p[2],d=Math.hypot(dx,dz)||1,yaw=window.p262.yaw();const gain=detourPath?Math.min(1,d/.8):Math.min(1,d/.5);command={forward:-(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*gain,strafe:(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*gain};window.p262.carControls(command.forward,command.strafe);}
   if(mode==='car'){
    const car=window.p262.car();let d=window.p262.carRouteInput(points,car.position,car.heading,car.speed,cursor,car.ground?.width??4.8);if(!window.p262.carCorridorClear(d.target,d.laneHeading))d=window.p262.carRouteInput(points,car.position,car.heading,car.speed,cursor,0);cursor=d.cursor;command={forward:d.forward,strafe:d.strafe,brake:d.brake};window.p262.carControls(command.forward,command.strafe,command.brake);
   }
   window.p262.step(dt,steps%120===0);steps++;
   const after=window.p262.telemetry(),d=Math.hypot(after.position[0]-last[0],after.position[2]-last[2]);maxStepM=Math.max(maxStepM,d);if(d>(mode==='car'?9.001:.801))throw Error('Nonphysical positional jump; test invalid');distance+=d;still=d<.00001?still+1:0;last=after.position;
   if(steps%20===0||still===1)trace.push(tracePoint(current,after,command));
   if(still>3){const state=after.stream,car=mode==='car'?window.p262.car():null;if(state?.active||state?.queued||car?.reason==='tile-loading'||after.admission?.reason==='tile-loading'||after.movement?.obstruction?.reason==='tile-loading'){
     const t=performance.now();await new Promise(r=>setTimeout(r,100));waitMs+=performance.now()-t;if(waitMs>600000)break;
    }else if(mode==='foot'&&still>8&&!detourPath&&detourAttempts++<12){
     const a=points[Math.max(0,cursor-1)],b=points[cursor],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)||1,t=Math.max(0,Math.min(1,((last[0]-a.x)*dx+(last[2]-a.z)*dz)/(length*length))),along=Math.min(length,t*length+6),goal={x:a.x+dx/length*along,z:a.z+dz/length*along},plan=await window.p262.detour(goal);
     detours.push({step:steps,from:[...last],goal,...plan});if(plan.route?.length>1){detourPath=plan.route;detourCursor=1;still=0;progressAge=0;bestRemaining=Infinity;}
    }else if(still>32)break;}
   if(steps%20===0)await new Promise(r=>setTimeout(r,0));
   if(performance.now()-start>maxWallSeconds*1000)break;
  }
  const failureState=mode==='car'?window.p262.car():null;window.p252.input();if(mode==='car')window.p262.carControls(0,0,true);window.p262.step(dt,true);
  return {completed,steps,cursor,detours,maxStepM,failureState,distanceM:distance,simulatedSeconds:steps*dt,wallSeconds:(performance.now()-start)/1000,waitMs,trace,end:window.p262.snapshot(),stop:window.p262.inspect(last[0],last[2]),car:mode==='car'?window.p262.car():null,target:points[cursor],nextInspection:window.p262.inspect(points[cursor].x,points[cursor].z),forwardInspection:window.p262.inspect(last[0]+(points[cursor].x-last[0])/Math.hypot(points[cursor].x-last[0],points[cursor].z-last[2])*.15,last[2]+(points[cursor].z-last[2])/Math.hypot(points[cursor].x-last[0],points[cursor].z-last[2])*.15)};
 },{points:chosen.route.localPoints,mode,maxWallSeconds});
 report.functionalSuccess=report.travel.completed&&report.errors.length===0;
 await page.screenshot({path:`docs/mission-26-2-evidence/${from}-${to}-${mode}-stop.png`});
 console.log({from,to,mode,success:report.functionalSuccess,distance:report.travel.distanceM,steps:report.travel.steps,stop:report.travel.stop,car:report.travel.car});
}catch(e){report.failure=String(e);console.log(report.failure);}finally{clearInterval(progressTimer);await writeFile(`docs/mission-26-2-evidence/${from}-${to}-${mode}.json`,JSON.stringify(report,null,2));await browser?.close();}
