import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {openMission} from './lib/mission-26-3-browser.mjs';
const port=Number(process.argv[2]??5430),label=process.argv[3]??'reference',out='docs/mission-26-4-evidence';await mkdir(out,{recursive:true});
const old=JSON.parse(await readFile('docs/mission-26-3-evidence/guidance/Vallee-source-roundtrip-car-80km-car.json')),stop=old.travel.failureState,gps=old.travel.end.gps,command=old.travel.trace.at(-1).command;
const report={method:'Independent declared diagnostic station at the exact retained D749 stop, before any local trial. Calls the unchanged CarController.clearAt and exports every sampled hull point, selected real visible support and raycast. No long journey claimed, no tolerance or collider changed.',gps,initial:stop,command,errors:[]};let browser,page;
try{
 ({browser,page,errors:report.errors}=await openMission(port,{width:800,height:600}));report.sourceSHA=await page.evaluate(()=>window.p262.source);report.prepared=await page.evaluate(g=>window.p263.prepare(g),gps);
 report.before=await page.evaluate(()=>window.p262.snapshot());
 report.probes=await page.evaluate(({stop,command})=>{
  const {x,z}=stop.position,heading=stop.heading,dx=Math.sin(heading),dz=Math.cos(heading),probes=[];
  for(const advance of [0,.001,.01,.05,.1,.25,.5,1,2,4]){
   const result=window.p264.atHull(x+dx*advance,z+dz*advance,heading);
   probes.push({advance,...result,points:result.points.map(p=>({...p,inspection:window.p263.support(p.x,p.z),ray:window.p263.ray(p.x,p.z)}))});
  }
  return probes;
 },{stop,command});
 report.allHullPoints=await page.evaluate(({stop})=>{const out=[];for(const advance of[0,.001,.05,4])for(const[u,v]of[[0,0],[-.82,-1.6],[.82,-1.6],[-.82,1.6],[.82,1.6]]){const h=stop.heading,x=stop.position.x+Math.sin(h)*advance+Math.cos(h)*u+Math.sin(h)*v,z=stop.position.z+Math.cos(h)*advance-Math.sin(h)*u+Math.cos(h)*v,q=window.p263.support(x,z),a=q.carAdmission,n=a.normal,terrain=q.render?.selected,tags=q.carRoad?.feature.tags;out.push({advance,u,v,x,z,gps:window.p262.inspect(x,z).gps,admission:a,longitudinalGrade:n?-(n.x*Math.sin(h)+n.z*Math.cos(h))/n.y:null,lateralGrade:n?-(n.x*Math.cos(h)-n.z*Math.sin(h))/n.y:null,roadTerrainDeltaM:Number.isFinite(a.height)&&terrain?a.height-terrain.height:null,tags,bridge:tags?.bridge??null,layer:tags?.layer??null,inspection:q,ray:window.p263.ray(x,z)});}return out;},{stop});
 report.mesh=await page.evaluate(p=>window.p263.meshPatch(p.x,p.z,12),stop.position);
 // Declared setup for the geographic view only, never a traversal repair.
 report.viewPlacement=await page.evaluate(g=>window.q26.regionPlace(g,'foot'),gps);
 await page.evaluate(()=>{window.p252.match?.({});window.p262.step(.016,true);});
 report.rawCamera=await page.evaluate(({p,h})=>window.p264.captureHull(p,h,false),{p:stop.position,h:stop.heading});await page.screenshot({path:out+'/'+label+'-d749.png'});report.overlayCamera=await page.evaluate(({p,h})=>window.p264.captureHull(p,h,true),{p:{x:stop.position.x+Math.sin(stop.heading)*.001,y:stop.position.y,z:stop.position.z+Math.cos(stop.heading)*.001},h:stop.heading});await page.screenshot({path:out+'/'+label+'-d749-overlay.png'});
 report.functionalSuccess=report.probes.some(p=>!p.result.ok);
}catch(e){report.failure=String(e)}finally{await writeFile(out+'/'+label+'-d749.json',JSON.stringify(report,null,2));await browser?.close()}
console.log({source:report.sourceSHA,prepared:report.prepared,probes:report.probes?.map(p=>({advance:p.advance,reason:p.result.reason,points:p.points.map(q=>({x:q.x,z:q.z,reason:q.support.reason,slope:q.support.slope,road:q.support.road,surface:q.support.surface}))})),failure:report.failure});
