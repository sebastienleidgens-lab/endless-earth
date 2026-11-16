import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {openMission} from './lib/mission-26-3-browser.mjs';
const port=Number(process.argv[2]??5397),label=process.argv[3]??'candidate',seconds=Number(process.env.M262_BENCH_SECONDS??20);
while(existsSync('work/mission-26-3/benchmark-pause')||execFileSync('ps',['-eo','args']).toString().split('\n').some(s=>/^node scripts\/(traverse-mission-26-3|record-mission-26-3|check-mission-26-3-(fixture|map-ui|streaming))/.test(s)))await new Promise(r=>setTimeout(r,5000));
const report={label,method:'Isolated browser, NO video encoder. Active game frame with audio, chosen full profile, fixed 640x420 DPR1. SwiftShader software. Raw intervals retained; small samples do not validate hardware or robust P99.',cases:[],errors:[],functionalSuccess:false};let browser,page;
const stats=values=>{const a=values.toSorted((a,b)=>a-b),at=p=>a[Math.min(a.length-1,Math.floor(p*a.length))];return {samples:a.length,p50:at(.5),p95:at(.95),p99:at(.99),max:a.at(-1)};};
try{
 ({browser,page,errors:report.errors}=await openMission(port,{width:640,height:420}));report.sourceSHA=await page.evaluate(()=>window.p262.source);await page.evaluate(()=>{if(!window.endlessDiagnostics.sound)window.p252.audio();});await page.waitForTimeout(3000);
 for(const profile of ['eco','balanced','quality'])for(const scene of ['forest','bridge','river','Poitiers','car','boat','map']){
  const c={profile,scene,errorsBefore:report.errors.length};
  try{
   await page.evaluate(()=>window.p252.input());
   if(['Poitiers','map'].includes(scene)){await page.evaluate(async profile=>{const q=await window.q26.regionPlace({lat:46.5802,lon:.3404},'foot',profile);window.p262.match({...q,profile,zoom:5.5,date:'2026-06-21',weather:'clear'});window.p252.hold(true);},profile);}
   else await page.evaluate(({scene,profile})=>{const pos=scene==='forest'?{x:-620,z:-300}:scene==='bridge'?{x:15,z:180}:scene==='river'?{x:-135,z:210}:{x:-620,z:-300};window.p262.match({...pos,profile,zoom:5.5,date:'2026-06-21',weather:'clear'});}, {scene,profile});
   if(scene==='map')await page.locator('#planet-map-button').click();
   if(scene==='car'){
    const q=await page.evaluate(()=>window.q26.regionPlace({lat:46.692,lon:.872},'car',window.p252.state().profile));
    c.placed=await page.evaluate(q=>window.q26.carPlace(q),q);
    await page.evaluate(()=>{window.p262.driving(true);window.p252.hold(false);});
    await page.waitForFunction(()=>window.p262.car().active,null,{timeout:30000});await page.evaluate(()=>window.p262.carControls(.35,0));
   }
   if(scene==='boat'){
    const {readFile}=await import('node:fs/promises');const site=JSON.parse(await readFile('docs/mission-25-1-evidence/swim-accesses.json'))[0].site;
    await page.evaluate(({site,profile})=>{window.p252.bank(site);window.p252.profile(profile);window.p252.action('boat');window.p252.hold(false);},{site,profile});
    await page.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='boating',null,{timeout:60000});await page.evaluate(()=>window.p252.input(.6,0));
   }
   await page.evaluate(()=>window.p252.hold(false));await page.waitForTimeout(2000);
   c.before=await page.evaluate(()=>({...window.p262.snapshot(),diagnosticState:window.p252.state()}));await page.evaluate(()=>{if(!window.endlessDiagnostics.sound)window.p252.audio();});
   c.frames=await page.evaluate(seconds=>new Promise(done=>{const frames=[],start=performance.now();let previous=null;function collect(t){if(previous!==null)frames.push({t,ms:t-previous,position:window.p262.position(),activity:window.p262.activity()});previous=t;if(performance.now()-start>=seconds*1000)done(frames);else requestAnimationFrame(collect);}requestAnimationFrame(collect);}),seconds);
   c.after=await page.evaluate(()=>{window.p252.hold(true);return {...window.p262.snapshot(),diagnosticState:window.p252.state()};});
   c.frameMs=stats(c.frames.map(f=>f.ms));c.averageFps=c.frames.length*1000/c.frames.reduce((sum,f)=>sum+f.ms,0);c.functionalSuccess=c.frames.length>1&&report.errors.length===c.errorsBefore&&c.after.buffer[0]===640&&c.after.buffer[1]===420;
   if(scene==='car')c.functionalSuccess&&=c.frames.some(f=>f.activity==='driving');if(scene==='boat')c.functionalSuccess&&=c.frames.some(f=>f.activity==='boating');
   if(scene==='map')await page.locator('.planet-map [data-close]').click();
  }catch(e){c.failure=String(e);c.functionalSuccess=false;}
  report.cases.push(c);console.log(label,profile,scene,c.functionalSuccess,c.frameMs?.p50,c.failure??'');await writeFile(`docs/mission-26-3-evidence/${label}-benchmarks.json`,JSON.stringify(report,null,2));
 }
 report.functionalSuccess=report.cases.length===21&&report.cases.every(c=>c.functionalSuccess);
}catch(e){report.failure=String(e);}finally{await writeFile(`docs/mission-26-3-evidence/${label}-benchmarks.json`,JSON.stringify(report,null,2));await browser?.close();}
