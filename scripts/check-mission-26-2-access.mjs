import {readFile,writeFile} from 'node:fs/promises';
import {areaAccess} from '../src/planet/access.mjs';
import {inside} from '../src/planet/surface.mjs';
import {inverseLambert93} from '../src/planet/coordinates.mjs';
import {openMission} from './lib/mission-26-2-browser.mjs';
const audit=JSON.parse(await readFile('docs/mission-26-2-evidence/audit.json')),report={method:'Documented OSM area permissions, followed by independent continuous physical walks using normal inputs and the production frame. Diagnostic placement only BEFORE each walk. Permission polygon area is not a measured walkable surface area.',errors:[],cases:[],functionalSuccess:false};let browser,page;
try{({browser,page,errors:report.errors}=await openMission(Number(process.argv[2]??5399)));report.sourceSHA=await page.evaluate(()=>window.p262.source);
 for(const f of audit.explicitAreaCandidates.filter(f=>areaAccess(f).state==='known-allowed')){
  const c={id:f.id,tags:f.tags,points:f.points,attempts:[],functionalSuccess:false};
  const xs=f.points.map(p=>p[0]),ys=f.points.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,candidates=[];
  for(const [dx,dy]of [[0,0],[5,0],[-5,0],[0,5],[0,-5]])if(inside({x:cx+dx,y:cy+dy},f.points))candidates.push(inverseLambert93({x:cx+dx,y:cy+dy}));
  for(const gps of candidates){try{
   c.placement=await page.evaluate(g=>window.p262.areaPlace(g),gps);
   c.walk=await page.evaluate(async()=>{
    const initial=window.p262.telemetry(),p=initial.position;let target=null;
    for(const [dx,dz]of [[8,0],[-8,0],[0,8],[0,-8],[6,6],[-6,-6]]){
     let valid=true;for(let i=0;i<=40;i++){const s=window.p262.inspect(p[0]+dx*i/40,p[2]+dz*i/40);if(!s.clear||!s.admission.ok||s.admission.road){valid=false;break;}}
     if(valid){target={x:p[0]+dx,z:p[2]+dz};break;}
    }
    if(!target)return {completed:false,reason:'No verified >=8m off-road line from this starting point',initial};
    let distanceM=0,last=p;const trace=[];
    for(let i=0;i<200;i++){const s=window.p262.telemetry(),q=s.position,dx=target.x-q[0],dz=target.z-q[2],d=Math.hypot(dx,dz),yaw=window.endlessDiagnostics.yaw;if(d<.1)break;const gain=Math.min(1,d/.8);window.p262.carControls(-(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*gain,(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*gain);window.p262.step(.25,i===0);const z=window.p262.telemetry();distanceM+=Math.hypot(z.position[0]-last[0],z.position[2]-last[2]);last=z.position;if(i%4===0)trace.push(z);if(i%20===0)await new Promise(r=>setTimeout(r,0));}
    window.p252.input();window.p262.step(.25,true);const end=window.p262.telemetry();return {completed:Math.hypot(end.position[0]-target.x,end.position[2]-target.z)<.2,distanceM,target,initial,end,trace};
   });c.functionalSuccess=c.walk.completed&&c.walk.distanceM>=7.5;c.attempts.push({gps,placed:true,walkSuccess:c.functionalSuccess});if(c.functionalSuccess){await page.screenshot({path:`docs/mission-26-2-evidence/area-${f.id.split(':').at(-1)}.png`});break;}
  }catch(e){c.attempts.push({gps,failure:String(e)});}}
  report.cases.push(c);console.log(f.id,f.tags.name??f.tags.landuse??f.tags.natural,c.functionalSuccess,c.walk?.distanceM,c.attempts.at(-1)?.failure??'');await writeFile('docs/mission-26-2-evidence/access.json',JSON.stringify(report,null,2));
 }report.functionalSuccess=report.cases.some(c=>c.functionalSuccess);
}catch(e){report.failure=String(e);}finally{await writeFile('docs/mission-26-2-evidence/access.json',JSON.stringify(report,null,2));await browser?.close();}
