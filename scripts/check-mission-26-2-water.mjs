import {readFile,writeFile} from 'node:fs/promises';
import {inverseLambert93} from '../src/planet/coordinates.mjs';
import {openMission} from './lib/mission-26-2-browser.mjs';
const report={method:'Compiled model, source-based diagnostic placement before each inspection. Bank admission reasons are recorded individually; a bank count is never a boat journey.',functionalSuccess:false,errors:[],cases:[]};let browser,page;
try{
 ({browser,page,errors:report.errors}=await openMission(Number(process.argv[2]??5397)));report.sourceSHA=await page.evaluate(()=>window.p262.source);
 const source=JSON.parse(await readFile('docs/mission-26-2-evidence/audit.json'));
 const beach=source.explicitAreaCandidates.find(f=>f.id==='osm:way:545900317');
 const p=beach.points.reduce((a,p)=>({x:a.x+p[0]/beach.points.length,y:a.y+p[1]/beach.points.length}),{x:0,y:0});
 const sectors=[['Chauvigny',46.565,.641],['Chatellerault',46.815,.541],['La Roche-Posay',46.786,.815],['Vauchiron plage explicite',inverseLambert93(p).lat,inverseLambert93(p).lon]];
 for(const [name,lat,lon]of sectors){const c={name,requested:{lat,lon},functionalSuccess:false};try{
  c.placement=await page.evaluate(point=>window.q26.regionPlace(point,'foot','eco'),{lat,lon});
  await page.evaluate(()=>{window.p252.hold(true);window.p262.step(.25,false);});
  await page.waitForFunction(()=>{const q=window.p262.water();return q.metrics&&!q.metrics.preparing&&q.network?.ready;},null,{timeout:180000});
  c.water=await page.evaluate(()=>window.p262.water());c.snapshot=await page.evaluate(()=>window.p262.snapshot());c.admittedAccesses=c.water.accesses?.length??0;c.functionalSuccess=c.admittedAccesses>0;
  c.status=c.functionalSuccess?'ACCESS_FOUND_NOT_TRAVERSED':'NO_ADMITTED_BANK';
  await page.evaluate(()=>window.p262.step(.25,true));await page.screenshot({path:`docs/mission-26-2-evidence/water-${report.cases.length}.png`});
 }catch(e){c.failure=String(e);c.state=await page.evaluate(()=>({water:window.p262.water(),planet:window.endlessPlanetDiagnostics.metrics}));}report.cases.push(c);console.log(name,c.status??c.failure,c.admittedAccesses);await writeFile('docs/mission-26-2-evidence/department-water.json',JSON.stringify(report,null,2));}
 report.functionalSuccess=report.cases.filter(c=>c.functionalSuccess).length>=3;
}catch(e){report.failure=String(e);}finally{await writeFile('docs/mission-26-2-evidence/department-water.json',JSON.stringify(report,null,2));await browser?.close();}
