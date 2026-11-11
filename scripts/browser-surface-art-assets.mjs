import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {injection} from './lib/browser-road-fixture.mjs';
const out='docs/mission-12-evidence',b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[],errors=[];
try{
 for(const variant of ['photo','procedural']){
  const p=await b.newPage({viewport:{width:960,height:640}});p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  if(variant==='procedural'){
   const bytes=await readFile('work/mission-12/assets/procedural-atlas.png'),hash=createHash('sha256').update(bytes).digest('hex');
   await p.route('**/materials/earth/surface-art.json',async r=>{const response=await r.fetch(),m=await response.json();m.hashes.atlas=hash;m.bytes.atlas=bytes.length;await r.fulfill({response,json:m})});
   await p.route('**/materials/earth/surface-atlas.png',r=>r.fulfill({status:200,body:bytes,contentType:'image/png'}));
  }
  await p.addInitScript(()=>window.earthHold=true);
  await p.route('**/src/main.ts*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');await r.fulfill({response,body:body+injection+`window.assetSetup=()=>{window.earthTest.setup(['quality',-80,210,-.75,-.28,0,'first']);setLifeProfile('balanced');for(let i=0;i<240;i++)updateAtmosphere(1,false);return {appearance:!!activeTerrain.surfaceAppearance,camera:camera.matrixWorld.toArray(),climate:scene.userData.climate}};window.assetTick=()=>{window.earthTest.lod();scene.userData.decorationStream?.tick(false,16,0)};`})});
  await p.goto('http://localhost:5173/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z');await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
  const state=await p.evaluate(()=>window.assetSetup());assert.ok(state.appearance);
  for(let i=0;i<50;i++){await p.evaluate(()=>window.assetTick());await p.waitForTimeout(30)}
  await p.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});await p.evaluate(()=>window.earthTest.render());
  await p.screenshot({path:out+'/asset-'+variant+'.jpg',type:'jpeg',quality:92});rows.push({variant,state});await p.close();
 }
 assert.deepEqual(rows[0].state.camera,rows[1].state.camera);assert.equal(rows[0].state.climate.date,rows[1].state.climate.date);assert.deepEqual(errors,[]);
 await writeFile(out+'/asset-comparison.json',JSON.stringify({method:'Same actual game shader and scene, 960×640 balanced. Only the rock quadrant of the packed atlas is replaced in the procedural fixture, with its explicit checksum updated. No fallback, recolouring of the screenshot or generated illustration. Photo retained for irregular relief and less regular bands; generic regional colour, no claim of a local geological observation.',rows,errors},null,2));console.log('PASS CC0 / procedural in-engine comparison');
}finally{await b.close()}
