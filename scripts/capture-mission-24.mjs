import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,openBranch24,open24,settle,out} from './lib/mission-24-browser.mjs';
import {indexNativeWebM} from './lib/native-webm.mjs';
await mkdir(out+'/branches',{recursive:true});await mkdir(out+'/pilot',{recursive:true});await mkdir('work/mission-24/raw',{recursive:true});
const b=await launch(),shots=[],videos=[],errors=[],environment=[];
try{
 for(const [version,port]of [['before',5361],['after',5360]]){
  const workshop=await openBranch24(b,port),page=workshop.page;environment.push({version,kind:'synthetic workshop',...workshop.environment});
  for(const family of ['spreading','high','pendant','young','needle'])for(const wind of [0,.9])for(const below of [false,true])for(const cover of [0,1]){
   const state=await page.evaluate(a=>window.b24.setup(...a),[family,cover,below,0,'balanced',wind]);assert.equal(state.glError,0);const name=`${version}-${family}-${wind?'wind':'calm'}-${below?'below':'above'}-${cover?'snow':'bare'}.png`;
   await page.screenshot({path:out+'/branches/'+name});shots.push({version,kind:'synthetic production-branch inspection',file:'branches/'+name,...state});
  }
  for(const lod of [1,2,3])for(const below of [false,true]){const state=await page.evaluate(a=>window.b24.setup(...a),['spreading',1,below,lod,'balanced',0]);assert.equal(state.glError,0);const name=`${version}-spreading-lod${lod}-${below?'below':'above'}.png`;await page.screenshot({path:out+'/branches/'+name});shots.push({version,kind:'synthetic LOD inspection; distant ribbon deliberately enlarged',file:'branches/'+name,...state});}
  if(version==='after'){
   for(const [name,wind]of [['branch-calm-native',0],['branch-wind-native',.9]]){
    await page.evaluate(a=>window.b24.setup(...a),['pendant',1,false,0,'balanced',wind,false]);await page.evaluate(()=>{window.b24.native(true);window.b24.record()});await page.waitForTimeout(6500);const bytes=await page.evaluate(()=>window.b24.stop()),frames=await page.evaluate(()=>window.b24.native(false));const file=out+'/'+name+'.webm';await writeFile(file,Buffer.from(bytes));const media=await indexNativeWebM(file,'work/mission-24/raw/'+name+'.webm');videos.push({file:name+'.webm',kind:'native synthetic workshop, real elapsed time, original M11 wind',frames,media});
   }
  }
  errors.push(...workshop.errors.map(message=>({version,kind:'workshop',message})));await page.close();
  // Real Angles geography, untouched exposure/shelter and actual forest instances.
  const pilot=await open24(b,port,{viewport:{width:800,height:520},query:'&snowCover=1'});environment.push({version,kind:'Angles pilot',...pilot.environment});
  await pilot.page.evaluate(()=>window.c15.setup(['foret',-426.723088216,346.512916,.785,.12,5,'third'],'balanced','2026-01-21','clear'));
  await pilot.page.waitForFunction(()=>window.endlessDiagnostics.snow?.exposure==='ready');
  for(let i=0;i<8;i++)await pilot.page.evaluate(()=>window.m24.advance());
  await settle(pilot.page);
  for(const family of ['spreading','high','pendant','young','needle'])for(const below of [false,true]){
   const pose=await pilot.page.evaluate(a=>window.m24.station(...a),[family,below]);if(!pose){shots.push({version,kind:'pilot family absent',family,below});continue;}
   await pilot.page.evaluate(()=>{window.m24.snow(1);window.c15.tick();window.m24.render()});const name=`${version}-${family}-${below?'below':'above'}.png`;await pilot.page.screenshot({path:out+'/pilot/'+name});shots.push({version,kind:'actual Angles pilot, diagnostic camera only',file:'pilot/'+name,pose,state:await pilot.page.evaluate(()=>window.m24.summary())});
  }
  await pilot.page.evaluate(()=>window.c15.setup(['foret',-426.723088216,346.512916,.785,.12,5,'third'],'balanced','2026-01-21','clear'));await settle(pilot.page);await pilot.page.evaluate(()=>window.m24.render());await pilot.page.screenshot({path:out+'/pilot/'+version+'-forest.png'});shots.push({version,file:'pilot/'+version+'-forest.png',kind:'Angles forest panorama'});
  const collisions=await pilot.page.evaluate(()=>window.c15.collisions());await writeFile(out+'/'+version+'-collisions.json',JSON.stringify(collisions));
  if(version==='after'){
   await pilot.page.setViewportSize({width:390,height:844});await pilot.page.evaluate(()=>window.c15.setup(['foret',-426.723088216,346.512916,.785,.12,5,'third'],'eco','2026-01-21','clear'));await settle(pilot.page);await pilot.page.evaluate(()=>window.m24.render());await pilot.page.screenshot({path:out+'/pilot/mobile-forest.png'});shots.push({version,file:'pilot/mobile-forest.png',kind:'mobile viewport emulation; not physical Android',state:await pilot.page.evaluate(()=>window.m24.summary())});
   await pilot.page.evaluate(()=>window.c15.setup(['foret',-426.723088216,346.512916,.785,.12,5,'third'],'balanced','2026-01-21','clear'));await pilot.page.evaluate(()=>{window.c15.native(true);window.c15.record()});await pilot.page.keyboard.down('w');await pilot.page.waitForTimeout(4500);await pilot.page.keyboard.up('w');await pilot.page.waitForTimeout(2000);const bytes=await pilot.page.evaluate(()=>window.c15.stop());await pilot.page.evaluate(()=>window.c15.native(false));const frames=await pilot.page.evaluate(()=>window.cFrames);const name='pilot-winter-native';await writeFile(out+'/'+name+'.webm',Buffer.from(bytes));const media=await indexNativeWebM(out+'/'+name+'.webm','work/mission-24/raw/'+name+'.webm');videos.push({file:name+'.webm',kind:'actual pilot, keyboard walking with real elapsed time; brief regression, not M24 footprint proof',frames,media});
  }
  errors.push(...pilot.errors.map(message=>({version,kind:'pilot',message})));await pilot.page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/captures.json',JSON.stringify({shots,videos,errors,environment},null,2)+'\n');console.log(JSON.stringify({shots:shots.length,videos:videos.length,errors}));
}finally{await b.close();}
