import {readFile,writeFile} from 'node:fs/promises';
import {inside} from '../src/planet/surface.mjs';
import {inverseLambert93} from '../src/planet/coordinates.mjs';
import {openMission} from './lib/mission-26-3-browser.mjs';
const out='docs/mission-26-3-evidence/offroad.json',report={method:'Known OSM access=yes area; source tags are a gameplay inference, not a legal survey. Independent initial placements declared. Full production frame with normal input, dt .25. No repositioning during a traverse.',cases:[],errors:[]};let browser,page;
try{({browser,page,errors:report.errors}=await openMission(Number(process.argv[2]??5414)));
report.sourceSHA=await page.evaluate(()=>window.p262.source);
for(const f of JSON.parse(await readFile('docs/mission-26-2-evidence/audit.json')).explicitAreaCandidates.filter(f=>f.id.endsWith('42169715')||f.id.endsWith('56158336'))){
 const xs=f.points.map(p=>p[0]),ys=f.points.map(p=>p[1]),c={id:f.id,tags:f.tags,attempts:[]},plans=[];
 for(let x=Math.min(...xs)+20;x<Math.max(...xs)-20;x+=70)for(let y=Math.min(...ys)+20;y<Math.max(...ys)-20;y+=70)for(const a of [0,Math.PI/4,Math.PI/2,3*Math.PI/4]){const end={x:x+Math.cos(a)*310,y:y+Math.sin(a)*310};if(Array.from({length:63},(_,i)=>inside({x:x+(end.x-x)*i/62,y:y+(end.y-y)*i/62},f.points)).every(Boolean))plans.push({start:{x,y},end});}
 for(const plan of plans.slice(0,8)){const a={plan};try{
  a.placement=await page.evaluate(g=>window.p262.areaPlace(g),inverseLambert93(plan.start));
  const gps=inverseLambert93(plan.end),target=await page.evaluate(g=>window.p262.localPoint(g),gps);
  a.travel=await page.evaluate(async target=>{let distance=0,last=window.p262.position(),still=0;const trace=[],start=performance.now();for(let i=0;i<2000;i++){const p=window.p262.position(),dx=target.x-p[0],dz=target.z-p[2],d=Math.hypot(dx,dz);if(d<.4)break;const yaw=window.p262.yaw();window.p262.carControls(-(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d,(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d);window.p262.step(.25,i%120===0);const q=window.p262.telemetry(),m=Math.hypot(q.position[0]-last[0],q.position[2]-last[2]);if(m>.801)throw Error('Nonphysical jump');distance+=m;still=m<1e-6?still+1:0;last=q.position;if(i%20===0){trace.push({...q,distanceM:distance,simulationSeconds:(i+1)*.25});await new Promise(r=>setTimeout(r,0));}if(still>16)break;}window.p252.input();return {distanceM:distance,wallSeconds:(performance.now()-start)/1000,trace,end:window.p262.telemetry(),completed:Math.hypot(last[0]-target.x,last[2]-target.z)<.5};},target);
 }catch(e){a.failure=String(e);}c.attempts.push(a);console.log(f.id,a.travel?.distanceM,a.failure??'');if(a.travel?.completed&&a.travel.distanceM>300)break;}
 report.cases.push(c);await writeFile(out,JSON.stringify(report,null,2));
}
}catch(e){report.failure=String(e);}finally{await writeFile(out,JSON.stringify(report,null,2));await browser?.close();}
