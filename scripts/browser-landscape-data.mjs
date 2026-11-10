import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results={};
try{
 for(const failure of ['none','missing-manifest','bad-lod','stale-osm','missing-surface','bad-surface','stale-surface','missing-edge','bad-edge','stale-edge','missing-water-class']){
  const context=await browser.newContext({viewport:{width:640,height:480}}),page=await context.newPage();page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+`
   window.earthSurvey=()=>{let roads=0,maxRoadError=0,bottoms=0,maxFoundationError=0;scene.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;if(o.geometry.attributes.earthRoad)for(let i=0;i<a.count;i++){if(!o.geometry.attributes.earthRoad.getX(i))continue;const h=activeTerrain.relativeHeight(a.getX(i),a.getZ(i));if(h===null)continue;maxRoadError=Math.max(maxRoadError,Math.abs(a.getY(i)-h));roads++}if(o.name==='OSM ruins')for(let i=0;i<a.count;i++){const h=activeTerrain.relativeHeight(a.getX(i),a.getZ(i)),d=a.getY(i)-h;if(d<0){bottoms++;maxFoundationError=Math.max(maxFoundationError,Math.abs(d+.12))}}});return {roads,maxRoadError,bottoms,maxFoundationError,terrain:activeTerrain.metrics,hasCover:!!activeTerrain.landcover,hasEdges:!!activeTerrain.roadEdges}};`})});
  if(failure==='missing-manifest')await page.route('**/data/angles-earth.json',r=>r.fulfill({status:404,body:'missing'}));
  if(failure==='bad-lod')await page.route('**/data/angles-terrain-lod.bin',r=>r.fulfill({status:200,body:Buffer.from([0,0,1,0])}));
  if(failure==='stale-osm')await page.route('**/data/angles-earth.json',async r=>{const response=await r.fetch(),m=await response.json();m.osmSha256='wrong';await r.fulfill({response,json:m})});
  if(failure==='missing-water-class')await page.route('**/data/angles-surface.json',async r=>{const response=await r.fetch(),m=await response.json();delete m.tiles[0].earthWater;await r.fulfill({response,json:m})});
  if(failure==='missing-surface')await page.route('**/data/angles-surface.json',r=>r.fulfill({status:404,body:'missing'}));
  if(failure==='bad-surface')await page.route('**/data/angles-surface.pack',r=>r.fulfill({status:200,body:Buffer.from([0,1,2,3])}));
  if(failure==='stale-surface')await page.route('**/data/angles-surface.json',async r=>{const response=await r.fetch(),m=await response.json();m.osmSha256='wrong';await r.fulfill({response,json:m})});
  if(failure==='missing-edge')await page.route('**/data/angles-road-edge.json',r=>r.fulfill({status:404,body:'missing'}));
  if(failure==='bad-edge')await page.route('**/data/angles-road-edge.pack',r=>r.fulfill({status:200,body:Buffer.from([0,1,2,3])}));
  if(failure==='stale-edge')await page.route('**/data/angles-road-edge.json',async r=>{const response=await r.fetch(),m=await response.json();m.osmSha256='wrong';await r.fulfill({response,json:m})});
  await page.goto('http://localhost:5173/endless-earth/?perf=1&date=2026-06-21T12:00:00Z');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
  const survey=await page.evaluate(()=>window.earthSurvey());const missingRoads=['missing-surface','bad-surface','stale-surface','missing-water-class'].includes(failure);if(missingRoads){assert.equal(survey.roads,0);assert.match(await page.locator('.hud small').innerText(),/voies visuelles indisponibles/)}else assert.ok(survey.roads>1000);assert.ok(survey.maxRoadError<.0002,JSON.stringify(survey));assert.ok(survey.bottoms>100);assert.ok(survey.maxFoundationError<.0002);
  assert.equal(survey.terrain.tiles,25);assert.equal(survey.terrain.surface,missingRoads?'source':'integrated');assert.equal(survey.hasCover,['none','missing-surface','bad-surface','stale-surface','missing-edge','bad-edge','stale-edge','missing-water-class'].includes(failure));assert.equal(survey.hasEdges,!missingRoads&&!['missing-edge','bad-edge','stale-edge'].includes(failure));assert.deepEqual(errors,[]);results[failure]={...survey,errors};console.log('PASS Earth data',failure,survey.roads);await context.close();
 }
 await writeFile('docs/mission-08-captures/data-validation.json',JSON.stringify(results,null,2));
}finally{await browser.close()}
