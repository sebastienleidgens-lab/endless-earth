import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {launch,openGame,settle,views} from './lib/browser-landmarks.mjs';
const dir='docs/mission-14-evidence/heritage',browser=await launch(),raw=await readFile('public/data/angles-landmarks.json','utf8'),rows=[];
try{
 for(const scenario of ['normal','absent-model','corrupt-model','bad-binding','bad-normals','absent-underlay','bad-underlay-hash']){
  const route=async page=>{
   if(scenario==='absent-model'||scenario==='corrupt-model')await page.route('**/data/angles-landmarks.pack',r=>r.fulfill({status:200,body:scenario==='absent-model'?'':'not gzip'}));
   if(['bad-binding','bad-normals'].includes(scenario))await page.route('**/data/angles-landmarks.pack',r=>{const data=JSON.parse(raw);if(scenario==='bad-binding')data.bindings.terrain='stale';else data.objects[0].parts[0].normal[0]=40000;return r.fulfill({status:200,body:gzipSync(JSON.stringify(data))})});
   if(scenario==='absent-underlay')await page.route('**/data/angles-landmark-surface.pack',r=>r.fulfill({status:200,body:'corrupt gzip'}));
   if(scenario==='bad-underlay-hash')await page.route('**/data/angles-landmark-surface.json',async r=>{const response=await r.fetch(),data=await response.json();data.landmarksSha256='0'.repeat(64);await r.fulfill({response,json:data})});
  };
  const game=await openGame(browser,5173,{route}),p=game.page;
  await p.evaluate(v=>window.m14b.setup(v),views[0]);await settle(p);await p.evaluate(()=>window.earthTest.render());let state=await p.evaluate(()=>window.m14b.state());assert.equal(state.landmarks.length,scenario==='normal'?2:0);assert.equal(state.terrain.reliefCells,330);
  const bridge=await p.evaluate(()=>({walkable:window.m14b.walkable(-185,156),height:window.m14b.landmarkSupport(-185,156)}));assert.equal(bridge.walkable,scenario==='normal');assert.equal(bridge.height===null,scenario!=='normal');
  if(scenario==='normal'){
   for(let i=0;i<18;i++){await p.evaluate(({v,profile})=>window.m14b.setup(v,profile),{v:views[i%views.length],profile:['eco','balanced','quality'][i%3]});await settle(p);await p.evaluate(()=>window.earthTest.render())}
   await p.setViewportSize({width:390,height:844});await p.evaluate(v=>window.m14b.setup(v,'eco'),views[8]);await settle(p);await p.evaluate(()=>window.earthTest.render());await p.screenshot({path:dir+'/mobile.jpg',type:'jpeg',quality:88});state=await p.evaluate(()=>window.m14b.state());
  }
  assert.deepEqual(game.errors,[]);rows.push({scenario,state,bridge,warnings:game.warnings});await p.close();console.log('PASS',scenario);
 }
 await writeFile(dir+'/runtime.json',JSON.stringify({rows},null,2)+'\n');
}finally{await browser.close()}
