import {writeFile} from 'node:fs/promises';
import {launch,open251,settle} from './lib/mission-25-1-browser.mjs';
const browser=await launch(),rows=[];
try{
 const g=await open251(browser,5367,{viewport:{width:480,height:320},append:`
 window.states251={
  foot(site,profile){window.p251.restore();window.p25.bank(site);window.c15.setup(['state-bench',site.dry.x,site.dry.z,Math.atan2(site.normal.x,site.normal.z),.18,4.2,'third'],profile,'2026-06-21');this.pose('walking')},
  pose(kind){boatRender.update(boat,scene.userData.climate.elapsedSeconds);avatar.rotation.y=boat.visible?boat.heading:avatar.rotation.y;walkerModel.update(0,.2,walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z)),{kind,boatPose:boat.pose??0,profile:lifeSettings.name,handTargets:boatRender.hands});},
  launch(){const result=boat.launch(avatar.position,avatar.rotation.y,scene.userData.aquaticProvider,playerWaterClear);for(let i=0;i<26;i++)boat.update(.2,avatar.position,{forward:0,strafe:0},scene.userData.aquaticProvider,playerWaterClear);this.pose('boating');return result},
  pack(){const result=boat.dock(avatar.position,scene.userData.aquaticProvider,playerWaterClear);for(let i=0;i<26;i++)boat.update(.2,avatar.position,{forward:0,strafe:0},scene.userData.aquaticProvider,playerWaterClear);this.pose('walking');return result},
  sample(){return {render:window.c15.render(),position:avatar.position.toArray(),state:activity.state,visible:boat.visible,camera:camera.position.toArray()}}
 };`}),p=g.page;
 const site=await p.evaluate(()=>window.p25.test()[1].site);await p.evaluate(()=>window.p251.network());
 for(const profile of ['eco','balanced','quality']){
  await p.evaluate(a=>window.states251.foot(...a),[site,profile]);await settle(p);
  for(const mode of ['foot','active','packed']){
   const action=mode==='active'?await p.evaluate(()=>window.states251.launch()):mode==='packed'?await p.evaluate(()=>window.states251.pack()):null;
   if(action&&!action.ok)throw Error('State transition refused '+JSON.stringify(action));
   for(let i=0;i<3;i++)await p.evaluate(()=>window.states251.sample());
   const samples=[];for(let i=0;i<8;i++)samples.push(await p.evaluate(()=>window.states251.sample()));
   const ms=samples.map(s=>s.render.ms).sort((a,b)=>a-b);rows.push({profile,mode,medianMs:ms[4],p95Ms:ms[7],samples});
  }
 }
 await writeFile('docs/mission-25-1-evidence/boat-states-performance.json',JSON.stringify({method:'8 hot gl.finish render samples per actual foot / launched / docked-and-packed state, three profiles, same fixed world camera. Player correctly changes position at the bank: these are not the same walking/boating itinerary and must not be used as an isolated +5% comparison. See active-performance.json for geometry-only cost with identical seated avatar.',rows,errors:g.errors,environment:g.environment},null,2));console.log('PASS foot / active / packed state benchmarks');
}finally{await browser.close()}
