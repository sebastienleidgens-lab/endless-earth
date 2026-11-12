import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,openGame,settle,views} from './lib/mission-14-browser.mjs';
const browser=await launch(),rows=[];
try{
 for(const scenario of ['normal','missing-refinement','bad-datum','stale-surface','corrupt-pack','missing-decorations']){
  const route=async page=>{
   if(scenario==='missing-refinement')await page.route('**/data/angles-relief.json',r=>r.fulfill({status:200,contentType:'application/json',body:'null'}));
   if(scenario==='bad-datum')await page.route('**/data/angles-relief.json',async r=>{const response=await r.fetch(),data=await response.json();data.verticalDatum='ellipsoid';await r.fulfill({response,json:data})});
   if(scenario==='stale-surface')await page.route('**/data/angles-relief-surface.json',async r=>{const response=await r.fetch(),data=await response.json();data.refinementSha256='0'.repeat(64);await r.fulfill({response,json:data})});
   if(scenario==='corrupt-pack')await page.route('**/data/angles-relief-surface.pack',r=>r.fulfill({status:200,body:'corrupt gzip'}));
   if(scenario==='missing-decorations')await page.route('**/data/angles-relief-decorations/manifest.json',r=>r.fulfill({status:200,contentType:'application/json',body:'null'}));
  };
  const game=await openGame(browser,5173,{route}),p=game.page;
  await p.evaluate(v=>window.m14.setup(v),views[4]);await settle(p);await p.evaluate(()=>window.earthTest.render());const state=await p.evaluate(()=>window.m14.state());
  const active=['normal','missing-decorations'].includes(scenario);assert.equal(!!state.relief,active);assert.equal(state.terrain.reliefCells,active?330:0);assert.equal(state.terrain.surface,'integrated');
  const movement=await p.evaluate(()=>{const d=window.m14.move(-12.277392682727118,-32.416383999943434,.2,0);return {p:d,y:window.m14.sample(d[0],d[2])}});assert.ok(Math.abs(movement.p[1]-movement.y)<1e-8);
  if(scenario==='normal'){
   for(let i=0;i<18;i++){await p.evaluate(({v,profile})=>window.m14.setup(v,profile),{v:views[i%views.length],profile:['eco','balanced','quality'][i%3]});await settle(p);await p.evaluate(()=>window.earthTest.render())}
   const lod=await p.evaluate(()=>{window.m14.lod(10000,10000);const far=window.m14.state().terrain.farTiles;window.m14.lod(-50,200);const near=window.m14.state().terrain.farTiles;return {far,near}});assert.ok(lod.far>lod.near);
   await p.setViewportSize({width:390,height:844});await p.evaluate(v=>window.m14.setup(v,'eco'),views[4]);await settle(p);await p.evaluate(()=>window.earthTest.render());await p.screenshot({path:'docs/mission-14-evidence/mobile.jpg',type:'jpeg',quality:88});state.lodTest=lod;
  }
  assert.deepEqual(game.errors,[]);rows.push({scenario,state,movement,warnings:game.warnings,startupMs:game.startupMs});await p.close();console.log('PASS',scenario);
 }
 await writeFile('docs/mission-14-evidence/runtime.json',JSON.stringify({rows},null,2)+'\n');
}finally{await browser.close()}
