import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {missionBrowserOptions,missionContextOptions} from './lib/mission-26-browser.mjs';

const port=Number(process.argv[2]??5408),mode=process.argv[3]??'all',base=`http://localhost:${port}/endless-earth/`,out='docs/mission-27-evidence';
await mkdir(out+'/gallery',{recursive:true});
const browser=await chromium.launch(missionBrowserOptions());
const terrainRequests=[],failures=[];
const context=await browser.newContext({...missionContextOptions,viewport:{width:640,height:400},deviceScaleFactor:1});
// The exact source bytes have already been acquired and hashed. Only the test
// transport is local: the production worker still checks the immutable SHA.
await context.route(/^https:\/\/raw\.githubusercontent\.com\/sebastienleidgens-lab\/endless-earth\/acb0a73b396229bf90731b90a558a8d5d072a9ec\/public\/planet\/fr-86\/contact-2m\/([0-9-]+\.pack)$/,async route=>{
 const url=route.request().url(),name=url.split('/').at(-1),bytes=await readFile('public/planet/fr-86/contact-2m/'+name);
 terrainRequests.push({url,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),transport:'local exact historical bytes; production checksum validation retained'});
 await route.fulfill({status:200,body:bytes,contentType:'application/octet-stream',headers:{'access-control-allow-origin':'*'}});
});
try{
 if(mode==='all'||mode==='fixtures'){
  const results=[];
  for(const region of ['validation-m27-mountain','validation-m27-tropical']){
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const record={region,synthetic:true,errors,hardware:'SwiftShader software rendering; no physical GPU or smartphone'};
   try{
    await page.goto(base+'fixtures/mission-27.html?region='+region);
    await page.waitForFunction(()=>window.enrichmentFixture?.ready,null,{timeout:180000});
    record.initial=await page.evaluate(()=>window.enrichmentFixture.state());
    record.verification=await page.evaluate(()=>window.enrichmentFixture.verify());
    record.profiles=[];
    for(const profile of ['eco','balanced','quality']){
     await page.evaluate(p=>window.enrichmentFixture.profile(p),profile);await page.waitForTimeout(1000);
     const state=await page.evaluate(()=>window.enrichmentFixture.state());record.profiles.push({profile,state});
     await page.screenshot({path:`${out}/gallery/${region}-${profile}.png`});
    }
    record.passed=errors.length===0&&record.verification.saved&&record.verification.resumeErrorM<.001&&record.initial.metrics.render.enrichment.buildings>0;
   }catch(error){record.failure=String(error);record.passed=false;failures.push(record.failure);}
   results.push(record);await writeFile(out+'/fixtures-runtime.json',JSON.stringify({method:'Same createPlanetRuntime on two explicitly synthetic regional datasets. Not production geographic coverage or complete immersive parity.',results},null,2));await page.close();
  }
 }
 if(mode==='all'||mode==='gameplay'){
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const record={hardware:'SwiftShader software rendering; no physical GPU or smartphone',errors,scenes:[],terrainRequests,method:'Compiled game with existing diagnostic inspection shim. Diagnostic scene placements are excluded from journeys. Native short sequence uses real RAF and rendered timestamps; low cadence is not a fluidity proof.'};
  try{
   await page.goto(base+'?perf=1&evidence=1&spawnSeed=12345&fixedResolution=1');
   await page.waitForFunction(()=>window.m27,null,{timeout:60000});
   await page.evaluate(()=>{window.p252.profile('eco');window.p252.hold(false);});
   await page.waitForFunction(()=>window.m27.ready()&&window.endlessPlanetDiagnostics.metrics.stream?.loaded>=1,null,{timeout:240000});
   record.sourceCommit=await page.evaluate(()=>window.m27.source);
   record.initial=await page.evaluate(()=>window.m27.state());
   await page.screenshot({path:out+'/gallery/angles-after.png'});
   const stations=JSON.parse(await readFile(out+'/visual-stations.json','utf8'));
   const list=stations.stations??stations.visualStations??[];
   for(const label of ['Chauvigny','Poitiers','Montmorillon']){
    const station=list.find(s=>JSON.stringify(s).includes(label));
    const scene={label,station,diagnosticPlacement:true,journeyDistanceM:0};
    try{
     const point=station?.candidate?.geo??station?.position??station?.geo??station?.coordinates??station?.location;
     let geo=Array.isArray(point)?{lon:point[0],lat:point[1]}:point;
     if(!geo?.lat)geo={lat:station?.latitude??station?.lat,lon:station?.longitude??station?.lon};
     if(!Number.isFinite(geo.lat)||!Number.isFinite(geo.lon))throw Error('No source-derived station coordinates');
     scene.placement=await page.evaluate(g=>window.q26.regionPlace(g,'foot','eco'),geo);
     await page.waitForFunction(()=>window.endlessPlanetDiagnostics.metrics.render?.enrichment?.buildings>0,null,{timeout:180000});
     await page.waitForTimeout(1200);scene.state=await page.evaluate(()=>window.m27.state());
     await page.evaluate(()=>window.p252.hold(true));
     await page.evaluate(()=>window.p252.render());
     await page.screenshot({path:`${out}/gallery/${label.toLowerCase()}-after.png`});
     scene.passed=true;
    }catch(error){scene.failure=String(error);scene.passed=false;}
    record.scenes.push(scene);await writeFile(out+'/browser-gameplay.json',JSON.stringify(record,null,2));
   }
   await page.evaluate(()=>{window.p252.input(0,0);window.p252.record();});
   await page.waitForTimeout(12000);
   const media=await page.evaluate(()=>window.p252.stop({base64:true}));
   await writeFile(out+'/gallery/native-observation.webm',Buffer.from(media.base64,'base64'));
   record.native={sha256:media.sha256,frames:media.frames,captureRequestedFPS:30,realRenderedFrames:media.frames.length,scope:'Native stationary observation at last admitted diagnostic scene. No reposition during this sequence; no native long journey claimed.'};
   record.final=await page.evaluate(()=>window.m27.state());
   record.passed=errors.length===0&&record.initial.planet.enrichment?.state==='available'&&record.scenes.some(s=>s.passed);
  }catch(error){record.failure=String(error);record.passed=false;failures.push(record.failure);}
  await writeFile(out+'/browser-gameplay.json',JSON.stringify(record,null,2));await page.close();
 }
}finally{await browser.close();}
console.log(JSON.stringify({mode,failures,localHistoricalTerrainRequests:terrainRequests.length}));
if(failures.length)process.exitCode=1;
