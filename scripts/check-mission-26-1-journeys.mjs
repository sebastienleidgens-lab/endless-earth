import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {missionBrowserOptions,missionContextOptions} from './lib/mission-26-browser.mjs';
const port=Number(process.argv[2]??5390),out='docs/mission-26-1-evidence',report={method:'Actual compiled save/restore and UI handlers; diagnostic setup before each independent case. Reload is real. No distance or continuous journey inferred.',errors:[],cases:[]};
const tailOnly=process.argv[3]==='remaining';if(tailOnly){const prior=JSON.parse(await readFile(out+'/journeys.json'));report.cases=prior.cases.filter(c=>['walking-map-profile-reload','parked-car','occupied-car-reload'].includes(c.name));report.priorSession='Previous three independent cases retained; camp and boat run in a clean second browser session.';}const b=await chromium.launch(missionBrowserOptions());
try{
 const p=await b.newPage({...missionContextOptions,viewport:{width:640,height:420},deviceScaleFactor:1});
 p.on('pageerror',e=>report.errors.push(String(e)));
 const init=async()=>{await p.goto(`http://localhost:${port}/endless-earth/?perf=1&evidence=1&fixedResolution=1&spawnSeed=12345`);await p.waitForFunction(()=>window.p261);await p.evaluate(()=>{window.p252.profile('eco');window.p252.hold(false)});await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&window.endlessPlanetDiagnostics?.ready,null,{timeout:180000});await p.evaluate(()=>{window.p252.prepare();window.p252.hold(true)});await p.waitForFunction(()=>{const s=window.endlessPlanetDiagnostics.metrics.stream;return s.loaded>=2&&s.active===0&&s.queued===0&&!s.failures&&window.p252.state().network.ready},null,{timeout:240000});};
 await init();report.sourceSHA=await p.evaluate(()=>window.p261.source);
 const settle=async(state)=>{await p.evaluate(()=>window.p252.hold(false));await p.waitForFunction(s=>window.endlessPlayerDiagnostics.state===s,state,{timeout:120000});await p.waitForTimeout(700);await p.evaluate(()=>window.p252.hold(true));};
 const snapshot=()=>p.evaluate(()=>({snapshot:window.p261.snapshot(),car:structuredClone(window.endlessPlanetDiagnostics.car),status:document.querySelector('.planet-status').textContent,actions:document.querySelector('.action-status').textContent}));
 const saveRestore=async(name,reload=false)=>{
  const c={name,reload};try{
   c.before=await snapshot();c.saved=await p.evaluate(()=>{const ok=window.p261.journey('save');return {ok,value:JSON.parse(localStorage.getItem('endless-earth:journey:v1'))}});
   if(!c.saved.ok)throw Error('Save refused');
   if(reload)await init();else await p.evaluate(()=>window.p261.match({x:-620,z:-300,profile:'quality'}));
   c.restoreFrom=await snapshot();await p.evaluate(()=>window.p261.journey('resume'));c.after=await snapshot();
   const a=c.saved.value.position,z=c.after.snapshot.gps;c.horizontalErrorDegrees=Math.hypot(a.lat-z.lat,a.lon-z.lon);c.passed=c.horizontalErrorDegrees<1e-10&&c.after.snapshot.activity===c.saved.value.activity&&c.after.status==='Voyage repris au lieu sauvegardé.';
   c.extensions=await p.evaluate(()=>{window.p261.journey('save');return JSON.parse(localStorage.getItem('endless-earth:journey:v1'))});
  }catch(e){c.failure=String(e);c.passed=false;}report.cases.push(c);console.log(name,c.passed,c.failure??c.after?.status);await writeFile(out+'/journeys.json',JSON.stringify(report,null,2));return c;
 };
 if(!tailOnly){await p.evaluate(()=>window.p261.match({x:-650,z:-330,profile:'eco',zoom:4.2}));await settle('walking');
 await p.evaluate(()=>{document.querySelector('#planet-map-button').click();document.querySelector('.planet-map-layers input').click()});
 const walking=await saveRestore('walking-map-profile-reload',true);walking.mapLayersRestored=JSON.stringify([...walking.saved.value.map.layers].sort())===JSON.stringify([...walking.extensions.map.layers].sort());walking.cameraRestored=JSON.stringify(walking.saved?.value.extensions.camera)===JSON.stringify(walking.extensions?.extensions.camera);walking.passed&&=walking.mapLayersRestored&&walking.cameraRestored;
 await p.evaluate(()=>document.querySelector('.planet-map [data-close]').click());
 const route=JSON.parse(await readFile('work/mission-26-1/run-routes.json'));
 const parked=await p.evaluate(q=>window.q26.carPlace({...q,y:window.p261.inspect(q.x,q.z).height}),{...route.flat.points[1],heading:route.flat.heading});report.parkedSource=parked.clear;
 if(parked.clear.ok){await settle('walking');await saveRestore('parked-car');await p.evaluate(()=>document.querySelector('#planet-car').click());await settle('driving');await saveRestore('occupied-car-reload',true);}
 if(await p.evaluate(()=>window.endlessPlanetDiagnostics.car.active)){await p.evaluate(()=>{document.querySelector('#planet-car').click();window.p252.hold(false)});await settle('walking');}}
 await p.evaluate(()=>window.p261.match({x:-650,z:-330,profile:'eco'}));await settle('walking');await p.evaluate(()=>document.querySelector('#action-camp').click());
 try{await settle('camping');await saveRestore('camp-reload',true);}catch(e){report.cases.push({name:'camp-reload',passed:false,failure:String(e),after:await snapshot()});}
 const site=JSON.parse(await readFile('docs/mission-25-1-evidence/swim-accesses.json'))[0].site;
 await p.evaluate(s=>{window.p252.bank(s);window.p252.action('boat')},site);
 try{await settle('boating');await saveRestore('boat-reload',true);}catch(e){report.cases.push({name:'boat-reload',passed:false,failure:String(e),after:await snapshot()});}
 await p.evaluate(()=>window.p261.match({x:-650,z:-330,profile:'eco'}));await settle('walking');
 const invalid=await p.evaluate(()=>{window.p261.journey('save');const v=JSON.parse(localStorage.getItem('endless-earth:journey:v1'));v.activity='sitting';localStorage.setItem('endless-earth:journey:v1',JSON.stringify(v));return {position:window.p261.snapshot().position,saved:v}});
 await p.evaluate(()=>window.p261.journey('resume'));const rejected=await snapshot();report.cases.push({name:'unsupported-activity-controlled-refusal',before:invalid,after:rejected,passed:rejected.status.includes('Aucune relocalisation')&&JSON.stringify(invalid.position)===JSON.stringify(rejected.snapshot.position)});
 await p.screenshot({path:out+'/journey-refusal.png'});
}catch(e){report.failure=String(e);console.log(report.failure)}finally{await writeFile(out+'/journeys.json',JSON.stringify(report,null,2));await b.close();}
