import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {launch,openGame,settle,views} from './lib/mission-15-browser.mjs';
const out='docs/mission-15-evidence',b=await launch(),rows=[];
try{
 // Compare the same collision grid and actual movement attempts before/after.
 const collision=[];for(const [id,port]of [['m14',5179],['15a',5173]]){const g=await openGame(b,port),p=g.page;const data=await p.evaluate(()=>{const grid=[];for(let x=-240;x<=120;x+=8)for(let z=-120;z<=380;z+=8)grid.push(window.m15.canWalk(x,z));const moves=[];for(const [x,z]of [[-12.277392682727118,-32.416383999943434],[-430,340],[-55,70],[-185,155],[-202,160]])for(const [dx,dz]of [[.2,0],[-.2,0],[0,.2],[0,-.2]])moves.push(window.m15.move(x,z,dx,dz));return {grid,moves}});collision.push({id,data});assert.deepEqual(g.errors,[]);await p.close()};assert.deepEqual(collision[0].data,collision[1].data);
 for(const scenario of ['normal','perforated','stale-canopy-light','corrupt-light','missing-decorations']){
  const route=async p=>{
   if(scenario==='stale-canopy-light')await p.route('**/data/angles-lighting.json',async r=>{const response=await r.fetch(),j=await response.json();delete j.bindings.canopy;await r.fulfill({response,json:j})});
   if(scenario==='corrupt-light')await p.route('**/data/angles-lighting.pack',r=>r.fulfill({status:200,body:'corrupt gzip'}));
   if(scenario==='missing-decorations')await p.route('**/data/angles-relief-decorations/manifest.json',r=>r.fulfill({status:200,json:null}));
  };
  const g=await openGame(b,5173,{route,query:scenario==='perforated'?'&canopy=perforated':''}),p=g.page,states=[];
  if(scenario==='normal'){
   const captures=JSON.parse(await (await import('node:fs/promises')).readFile(out+'/captures.json'));const garden=captures.rows.find(r=>r.id==='jardinieres'&&r.variant==='15a').station;
   for(let i=0;i<18;i++){
    const v=[views[0],views[3],garden,views[4],views[5],views[2]][i%6],profile=['eco','balanced','quality'][Math.floor(i/6)],date=['2026-06-21','2026-04-21','2026-01-21'][Math.floor(i/6)];
    await p.evaluate(({v,profile,date})=>window.m15.setup(v,profile,date),{v,profile,date});await settle(p);await p.evaluate(()=>window.m15.render());const s=await p.evaluate(()=>window.m15.state());delete s.flowers.recipes;assert.equal(s.lighting.state,'ready');assert.equal(s.art.canopy,'generous-canopy-v2');assert.ok(s.flowers.resident<=s.flowers.visible+4);if(date.includes('01-21'))assert.equal(s.flowers.season[1],0);states.push(s);
   }
   await p.setViewportSize({width:390,height:844});await p.evaluate(v=>window.m15.setup(v,'eco'),garden);await settle(p);await p.evaluate(()=>window.m15.render());await p.screenshot({path:out+'/mobile.jpg',type:'jpeg',quality:88});
   // Return repeatedly to the same pose. The second/third visits reuse a
   // bounded cache; texture and material disposal is also covered in Node.
   const cycles=[];for(let i=0;i<3;i++){await p.evaluate(v=>window.m15.setup(v,'balanced'),garden);await settle(p);await p.evaluate(()=>window.m15.render());await p.evaluate(()=>globalThis.gc?.());const s=await p.evaluate(()=>window.m15.state());cycles.push({gpu:s.gpu,heap:s.heap,flowers:{resident:s.flowers.resident,builds:s.flowers.builds},nature:s.nature})}assert.deepEqual(cycles[1].gpu,cycles[2].gpu);states.push({cycles});
  }else{await p.evaluate(v=>window.m15.setup(v),views[0]);await settle(p);await p.evaluate(()=>window.m15.render());const s=await p.evaluate(()=>window.m15.state());assert.equal(s.lighting.state,scenario==='perforated'?'ready':'fallback');if(scenario==='perforated')assert.equal(s.art.approach,'perforated');assert.equal(s.art.canopy,'generous-canopy-v2');assert.ok(s.flowers.recipes.length>0);delete s.flowers.recipes;states.push(s)}
  assert.deepEqual(g.errors,[]);rows.push({scenario,states,warnings:g.warnings});await p.close();console.log('PASS',scenario)
 }
 await writeFile(out+'/runtime.json',JSON.stringify({method:'Actual Chromium WebGL shaders. 2898 collision probes and 20 native collision-kernel movement attempts match Mission 14 exactly. 18 scene/profile/season changes, three warm returns, mobile Eco, stale lighting, corrupt lighting, missing optional decoration fallback.',collision,rows},null,2)+'\n');
}finally{await b.close()}
