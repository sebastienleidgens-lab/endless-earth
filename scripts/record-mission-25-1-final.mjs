import {writeFile,mkdir} from 'node:fs/promises';
import {launch,open251,settle} from './lib/mission-25-1-browser.mjs';
import {indexNativeWebM} from './lib/native-webm.mjs';
const out='docs/mission-25-1-evidence',browser=await launch(),videos=[];
try{
 const g=await open251(browser,5367,{viewport:{width:640,height:420},append:`
 window.p251.bestWalk=()=>{
  let best=null,score=-Infinity;
  const pool=scene.userData.spawnPool.points;
  for(let i=0;i<pool.length;i+=Math.max(1,Math.floor(pool.length/48))){const p=pool[i],r=routeAt(p,activeTerrain);if(!r||r.length<40)continue;const habitats=new Set(r.points.filter((_,i)=>i%5===0).map(p=>scene.userData.lifeHabitat?.(p.x,p.z)??'unknown'));const value=habitats.size*10000+r.length;if(value>score){score=value;best={p,r,habitats:[...habitats]};}}
  if(!best)return null;
  const {p,r}=best,heading=Math.atan2(r.points[0].x-r.points[1].x,r.points[0].z-r.points[1].z);
  window.p251.restore();window.c15.setup(['mapped-sound-walk',p.x,p.z,heading,-.05,0,'first'],'balanced','2026-06-21');
  const points=[...r.points,...r.points.slice(0,-1).reverse(),...r.points.slice(1)];window.p251.walkRoute={...r,points,length:r.length*3};
  return {initial:p,source:r.name,oneWayLength:r.length,habitats:best.habitats,points};
 };
 window.p251.startWalk=()=>{walker.start(window.p251.walkRoute);return {active:walker.active,message:walker.message};};
 `}),p=g.page;
 await p.waitForFunction(()=>window.endlessDiagnostics.navigation.state==='ready');
 const route=await p.evaluate(()=>window.p251.bestWalk());if(!route)throw Error('No safe mapped walk found');
 await settle(p);await p.locator('canvas').click({position:{x:550,y:180}});await p.evaluate(()=>window.p25.audio());
 async function movie(name,action,details){await p.evaluate(()=>window.p251.begin());await action();const bytes=await p.evaluate(()=>window.c15.stop()),frames=await p.evaluate(()=>{window.c15.native(false);return window.cFrames});await writeFile(out+'/'+name+'.webm',Buffer.from(bytes));const media=await indexNativeWebM(out+'/'+name+'.webm','work/mission-25-1/raw/'+name+'.webm');await writeFile(out+'/'+name+'.json',JSON.stringify({details,frames,sourceSnapshot:'final',errors:g.errors},null,2));videos.push({name,file:name+'.webm',trace:name+'.json',media,details});console.log('VIDEO',name,frames.length);}
 console.log('ROUTE',route.source,route.oneWayLength,route.habitats);
 await movie('mapped-sound-walk-native',async()=>{const start=await p.evaluate(()=>window.p251.startWalk());console.log('START',start);for(let i=0;i<310;i++){await p.waitForTimeout(1000);if(i%30===0)console.log('WALK',i,await p.evaluate(()=>({p:window.endlessDiagnostics.position,active:window.endlessDiagnostics.autoWalk,message:window.endlessDiagnostics.walkMessage})));}},{method:'310 wall-clock native seconds on a prevalidated mapped public walking route, followed forward/back along its original checked edges. Initial diagnostic placement only. No synthetic river, path or collider; source positions, habitats and real motion in trace.',route});
 const water=await p.evaluate(()=>window.p25.test());await p.evaluate(s=>window.p25.bank(s),water[1].site);await settle(p);
 await movie('final-bank-corridor',async()=>{await p.locator('#action-boat').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='boating');await p.keyboard.down('w');await p.waitForTimeout(2500);await p.keyboard.down('d');await p.waitForTimeout(1000);await p.keyboard.up('d');await p.keyboard.up('w');await p.waitForTimeout(700);await p.locator('#action-recover').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking',{},{timeout:120000});await p.waitForTimeout(800);},{method:'Final segmented docking implementation, real M25 bank, native keyboard propulsion/turn, existing assisted return and pack-up. Long-voyage films have separate pinned source versions.'});
 await writeFile(out+'/captures-final.json',JSON.stringify({videos,errors:g.errors,environment:g.environment},null,2));
}finally{await browser.close()}
