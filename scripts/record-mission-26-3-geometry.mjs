import {writeFile} from 'node:fs/promises';
import {openMission} from './lib/mission-26-3-browser.mjs';
const port=Number(process.argv[2]??5404),out=process.argv[3]??'docs/mission-26-3-evidence/reference',report={method:'Independent source-position diagnostics BEFORE any trial; no long-trip distance claimed. Same compiled rendered buffers and production admissions. Cross sections do not move the actor.',cases:[]};let browser,page;
try{
 ({browser,page,errors:report.errors}=await openMission(port,{width:320,height:210}));report.sourceSHA=await page.evaluate(()=>window.p262.source);
 for(const [name,gps,heading]of [['car-3883',{lat:46.57732004297148,lon:.6316443492300177},.9327610727780775]]){
  const c={name,gps,heading};c.prepared=await page.evaluate(g=>window.p263.prepare(g),gps);await page.waitForFunction(g=>{const p=window.p262.localPoint(g);return window.p263.support(p.x,p.z).fineReady;},gps,{timeout:300000});
  c.meshPatch=await page.evaluate(g=>{const p=window.p262.localPoint(g);return window.p263.meshPatch?.(p.x,p.z,7);},gps);
  c.result=await page.evaluate(({gps,heading})=>{const p=window.p262.localPoint(gps),q=window.p263.support(p.x,p.z);const thin=(x,z)=>{const a=window.p263.support(x,z);return {x,z,raw:a.raw,car:a.carAdmission,foot:a.admission,height:a.height,fineReady:a.fineReady,roads:a.render?.roads,terrain:a.render?.terrains.filter(t=>t.hit).map(t=>({id:t.id,...t.hit})),ray:window.p263.ray(x,z)};};const sections={along:[],across:[]};for(let i=-50;i<=50;i++){const d=i*.1;sections.along.push(thin(p.x+Math.sin(heading)*d,p.z+Math.cos(heading)*d));sections.across.push(thin(p.x+Math.cos(heading)*d,p.z-Math.sin(heading)*d));}const corners=[[0,0],[-.82,-1.6],[.82,-1.6],[-.82,1.6],[.82,1.6]].map(([u,v])=>({u,v,...thin(p.x+Math.cos(heading)*u+Math.sin(heading)*v,p.z-Math.sin(heading)*u+Math.cos(heading)*v)}));return {local:p,centre:q,sections,corners};},{gps,heading});
  report.cases.push(c);console.log(name,c.prepared,c.result.centre.height,c.result.centre.fineReady,c.result.centre.render.roads);await writeFile(out+'/car-support.json',JSON.stringify(report,null,2));
 }
}catch(e){report.failure=String(e);console.log(report.failure);}finally{await writeFile(out+'/car-support.json',JSON.stringify(report,null,2));await browser?.close();}
