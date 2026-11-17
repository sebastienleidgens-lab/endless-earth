import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {openMission} from './lib/mission-26-3-browser.mjs';
const port=Number(process.argv[2]??5414),label=process.argv[3]??'candidate-long',out='docs/mission-26-4-evidence/visual-regressions',scenes=JSON.parse(await readFile('docs/mission-26-3-evidence/gait-scenes.json'));
const report={label,method:'Actual full production frame, normal world-direction controls, dt .25, collisions active. Prior successful trace provides steering targets only. Independent initial placement before each trial. Consecutive activity AND physical speed tested. Render checkpoints are not native fluidity evidence.',cases:[],errors:[],perceptualStatus:'NON_VALIDE'};let browser,page;
try{({browser,page,errors:report.errors}=await openMission(port,{width:640,height:420}));report.sourceSHA=await page.evaluate(()=>window.p262.source);
for(const terrain of ['flat','slope']){
 const route=scenes[terrain],first=route.points[0];
 await page.evaluate(g=>window.q26.regionPlace(g,'foot','eco'),route.startGPS);
 await page.evaluate(g=>window.p263.prepare(g),route.startGPS);
 await page.waitForFunction(p=>{const s=window.p263.support(p.x,p.z);return s.height!==null&&s.admission.ok&&s.fineReady;},first,{timeout:660000});
 for(const run of [false,true])for(const [view,angle]of [['front',0],['back',Math.PI],['left',Math.PI/2],['right',-Math.PI/2]]){
  const name=`${label}-${terrain}-${run?'run':'walk'}-${view}`,heading=Math.atan2(route.points[1].x-first.x,route.points[1].z-first.z);console.log(name);
  await page.evaluate(o=>{window.p262.match(o);if(!window.p262.snapshot().audioEnabled)window.p252.audio();},{...first,heading,yaw:heading+angle,zoom:8.5,profile:'balanced',date:'2026-06-21',weather:'clear'});
  const trial=await page.evaluate(async({points,run,angle})=>{let cursor=1,last=window.p262.position(),distance=0,span=0,longest=0,maxStepM=0,still=0,detour=null,dc=0;const trace=[],detours=[],start=performance.now();window.p252.walk(points,run);
   for(let i=0;i<2400&&longest<180;i++){
    const p=window.p262.position();while(cursor<points.length-1&&Math.hypot(points[cursor].x-p[0],points[cursor].z-p[2])<.6)cursor++;
    if(detour&&Math.hypot(detour[dc].x-p[0],detour[dc].z-p[2])<.2){if(dc===detour.length-1)detour=null;else dc++;}
    const target=detour?detour[dc]:points[cursor],dx=target.x-p[0],dz=target.z-p[2],d=Math.hypot(dx,dz)||1;
    if(cursor===points.length-1&&d<.6)break;
    window.p252.camera(window.q26.world().heading+angle,.08);const yaw=window.p262.yaw(),gain=detour?Math.min(1,d/.8):1;window.p262.carControls(-(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*gain,(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*gain);window.p262.step(.25,i%60===0);
    const q=window.p262.telemetry(),m=Math.hypot(q.position[0]-last[0],q.position[2]-last[2]);if(m>.801)throw Error('Nonphysical jump');distance+=m;maxStepM=Math.max(maxStepM,m);last=q.position;still=m<1e-6?still+1:0;const active=q.activity===(run?'running':'walking')&&m/.25>(run?1.65:.1);span=active?span+.25:0;longest=Math.max(longest,span);
    if(i%4===0)trace.push({step:i,dt:.25,simulationSeconds:(i+1)*.25,distanceM:distance,speedMps:m/.25,consecutiveSeconds:span,state:q,pose:window.p263.pose()});
    if(still>8&&!detour&&detours.length<5){const goal=points[Math.min(points.length-1,cursor+2)],plan=await window.p262.detour(goal);detours.push({step:i,...plan});if(plan.route?.length>1){detour=plan.route;dc=1;cursor=Math.min(points.length-1,cursor+2);still=0;}else break;}
    if(still>32)break;if(i%20===0)await new Promise(r=>setTimeout(r,0));
   }window.p252.input();window.p262.step(.25,true);return {distanceM:distance,maxStepM,longestConsecutiveMovingSeconds:longest,wallSeconds:(performance.now()-start)/1000,trace,detours,end:window.p262.snapshot(),completed:longest>=180};
  },{points:route.points,run,angle});
  await writeFile(`${out}/${name}.json.gz`,gzipSync(JSON.stringify(trial),{mtime:0}));
  const c={name,terrain,run,view,sourceHeightRangeM:route.heightRangeM,distanceM:trial.distanceM,longestConsecutiveMovingSeconds:trial.longestConsecutiveMovingSeconds,functionalSuccess:trial.completed,wallSeconds:trial.wallSeconds,trace:name+'.json.gz',perceptualStatus:'NON_VALIDE'};
  try{await page.screenshot({path:`${out}/${name}.png`,timeout:10000});c.image=name+'.png';}catch(e){c.captureError=String(e);}
  report.cases.push(c);await writeFile(`${out}/${label}-gait.json`,JSON.stringify(report,null,2));
 }
}
}catch(e){report.failure=String(e);}finally{await writeFile(`${out}/${label}-gait.json`,JSON.stringify(report,null,2));await browser?.close();}
