import {readFile,writeFile} from 'node:fs/promises';
import {openMission} from './lib/mission-26-2-browser.mjs';
const prior=JSON.parse(await readFile('docs/mission-26-2-evidence/spawn-SaintPierre-foot.json')),q=prior.travel.end.position,target=prior.chosen.route.localPoints[prior.travel.cursor];
const report={method:'Independent diagnostic placement at an earlier stopped frame, BEFORE probes; not a continuation of the recorded journey.',errors:[]};let browser,page;
try{({browser,page,errors:report.errors}=await openMission(Number(process.argv[2]??5399)));report.sourceSHA=await page.evaluate(()=>window.p262.source);
 report.probes=await page.evaluate(({q,target})=>{window.p262.match({x:q[0],z:q[2],profile:'eco'});const length=Math.hypot(target.x-q[0],target.z-q[2]),u={x:(target.x-q[0])/length,z:(target.z-q[2])/length},samples=[];for(let d=-1;d<=2;d+=.1)samples.push({d,...window.p262.inspect(q[0]+u.x*d,q[2]+u.z*d)});return samples;},{q,target});
 report.before=await page.evaluate(()=>window.p262.snapshot());
 await page.evaluate(target=>{const p=window.p262.telemetry().position,dx=target.x-p[0],dz=target.z-p[2],n=Math.hypot(dx,dz),yaw=window.endlessDiagnostics.yaw;window.p262.carControls(-(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/n,(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/n);for(let i=0;i<8;i++)window.p262.step(1/30,i===7);},target);
 report.after=await page.evaluate(()=>window.p262.snapshot());await page.screenshot({path:'docs/mission-26-2-evidence/blockage-probe.png'});
}catch(e){report.failure=String(e);}finally{await writeFile('docs/mission-26-2-evidence/blockage-probe.json',JSON.stringify(report,null,2));await browser?.close();}
console.log({failure:report.failure,movement:report.after?.movement,position:report.after?.position,refusals:report.probes?.filter(p=>!p.clear).map(p=>({d:p.d,collision:p.collision,admission:p.admission}))});
