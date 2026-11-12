import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {launch,openGame,settle,views} from './lib/mission-15-browser.mjs';
const out='docs/mission-15-evidence',b=await launch(),rows=[];await mkdir(out,{recursive:true});
try{
 const games={};for(const [key,port]of [['m14',5179],['15a',5173],['volume',5173]]){
  const options=key==='volume'?{query:'&canopy=volume'}:{};
  games[key]=await openGame(b,port,options);await mkdir(out+'/'+key,{recursive:true});
 }
 const poses={};
 const flowerState=await games['15a'].page.evaluate(()=>window.m15.state());
 const flowers=await games['15a'].page.evaluate(recipes=>recipes.filter(r=>[1,2,3,4].every(d=>window.m15.canWalk(r.x+r.nx*d,r.z+r.nz*d))).sort((a,b)=>Math.hypot(a.x+12,a.z+32)-Math.hypot(b.x+12,b.z+32)),flowerState.flowers.recipes);
 assert.ok(flowers.length>=2);await writeFile(out+'/flowers.json',JSON.stringify(flowerState.flowers.recipes,null,2)+'\n');
 const garden=flowers[0],garden2=flowers.find(f=>Math.hypot(f.x-garden.x,f.z-garden.z)>25)??flowers[1];
 const gardenView=(r,id)=>[id,r.x+r.nx*3.5,r.z+r.nz*3.5,Math.atan2(r.nx,r.nz),0,0,'first'];
 const scenes=[...views,gardenView(garden,'jardinieres'),gardenView(garden2,'fleurs-ruelle')];
 for(const v of scenes){for(const g of Object.values(games))await g.page.evaluate(v=>window.m15.setup(v),v);poses[v[0]]=(await games['15a'].page.evaluate(()=>window.m15.state())).camera}
 for(const v of scenes)for(const id of ['m14','15a',...(['bois','silhouettes'].includes(v[0])?['volume']:[])]){
  const g=games[id],p=g.page;await p.evaluate(({v,pose})=>window.m15.setup(v,'balanced','2026-06-21','clear',pose),{v,pose:poses[v[0]]});await settle(p);await p.evaluate(()=>window.m15.render());const state=await p.evaluate(()=>window.m15.state());
  if(state.flowers){state.flowers.count=state.flowers.recipes.length;delete state.flowers.recipes}const prior=rows.find(r=>r.id===v[0]);if(prior){assert.deepEqual(state.camera,prior.state.camera);assert.deepEqual(state.climate,prior.state.climate)}
  const file=`${id}/${v[0]}.jpg`;await p.screenshot({path:out+'/'+file,type:'jpeg',quality:90});rows.push({id:v[0],variant:id,station:v,file,state});console.log(id,v[0]);
 }
 for(const [id,date,weather]of [['printemps','2026-04-21','clear'],['automne','2026-10-21','clear'],['hiver','2026-01-21','clear'],['vent-moyen','2026-06-21','cloudy'],['vent-fort','2026-06-21','storm']])for(const variant of ['m14','15a']){
  const g=games[variant],p=g.page;await p.evaluate(({v,date,weather,pose})=>window.m15.setup(v,'balanced',date,weather,pose),{v:views[0],date,weather,pose:poses.bois});await settle(p);await p.evaluate(()=>window.m15.render());const file=`${variant}/${id}.jpg`,state=await p.evaluate(()=>window.m15.state());if(state.flowers){state.flowers.count=state.flowers.recipes.length;delete state.flowers.recipes}const prior=rows.find(r=>r.id===id);if(prior){assert.deepEqual(state.camera,prior.state.camera);assert.deepEqual(state.climate,prior.state.climate)}await p.screenshot({path:out+'/'+file,type:'jpeg',quality:90});rows.push({id,variant,file,state});console.log(variant,id)
 }
 for(const [id,date]of [['fleurs-printemps','2026-04-21'],['fleurs-hiver','2026-01-21']]){const g=games['15a'],p=g.page;await p.evaluate(({v,date,pose})=>window.m15.setup(v,'balanced',date,'clear',pose),{v:scenes.at(-2),date,pose:poses.jardinieres});await settle(p);await p.evaluate(()=>window.m15.render());const file=`15a/${id}.jpg`;await p.screenshot({path:out+'/'+file,type:'jpeg',quality:90});rows.push({id,variant:'15a',file,state:await p.evaluate(()=>{const s=window.m15.state();s.flowers.count=s.flowers.recipes.length;delete s.flowers.recipes;return s})})}
 for(const g of Object.values(games)){assert.deepEqual(g.errors,[]);assert.deepEqual(g.warnings,[])}
 await writeFile(out+'/captures.json',JSON.stringify({method:'Real Three.js game screenshots, 960x640 DPR1, identical absolute cameras and full climate/wind asserted for each pair. Diagnostic fixed comparison stations, not an accessible continuous journey. Volume is a tested candidate, not Mission 14. UI controls temporarily hidden for image comparison only; source/licence badge retained.',gardens:[garden,garden2],environment:games['15a'].environment,rows},null,2)+'\n');
}finally{await b.close()}
