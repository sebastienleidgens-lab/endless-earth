import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {launch,open251,settle} from './lib/mission-25-1-browser.mjs';
import {indexNativeWebM} from './lib/native-webm.mjs';
const out='docs/mission-25-1-evidence',stage=process.argv[2]??'locomotion',videos=[],candidatePort=Number(process.env.M251_PORT??5367);
await mkdir('work/mission-25-1/raw',{recursive:true});const browser=await launch();
async function movie(p,name,action,details={}){
 await p.evaluate(()=>window.p251.begin());await action();
 const bytes=await p.evaluate(()=>window.c15.stop()),frames=await p.evaluate(()=>{window.c15.native(false);return window.cFrames;});
 await writeFile(out+'/'+name+'.webm',Buffer.from(bytes));const media=await indexNativeWebM(out+'/'+name+'.webm','work/mission-25-1/raw/'+name+'.webm');
 await writeFile(out+'/'+name+'.json',JSON.stringify({details,frames},null,2));videos.push({name,file:name+'.webm',trace:name+'.json',media,...details});console.log('VIDEO',name,frames.length);
}
try{
 if(stage==='locomotion'){
  for(const [version,port]of [['before',5361],['after',candidatePort]]){
   const game=await open251(browser,port,{viewport:{width:800,height:520},append:`window.p251.steer=t=>{yaw=Math.atan2(avatar.position.x-t.x,avatar.position.z-t.z)};`}),p=game.page;
   for(const [angle,offset,keys]of [['rear',0,['w']],['profile',Math.PI/2,['d']],['front',Math.PI,['s']],['three-quarter',Math.PI/4,['w','d']]]){
    await p.evaluate(a=>window.c15.setup(...a),[['run',-620,-300,.7+offset,.08,3.1,'third',.7+Math.PI],'balanced','2026-06-21']);await settle(p);
    await p.evaluate(()=>window.c15.render());await p.screenshot({path:out+'/'+version+'-'+angle+'.png'});
    await movie(p,version+'-run-'+angle,async()=>{
     for(const k of keys)await p.keyboard.down(k);await p.waitForTimeout(1500);await p.keyboard.down('Shift');await p.waitForTimeout(4000);await p.keyboard.up('Shift');await p.waitForTimeout(1200);
     for(const k of keys)await p.keyboard.up(k);await p.keyboard.down('d');await p.waitForTimeout(1800);await p.keyboard.up('d');await p.keyboard.down('a');await p.waitForTimeout(1800);await p.keyboard.up('a');await p.waitForTimeout(1800);
    },{version,angle,cases:['start','acceleration','run','braking','lateral turn','180 turn','stop'],method:'Native wall-clock keyboard sequence, same initial real pilot position/date/profile/camera per pair. Actual admitted speeds/trajectories are in traces; low software FPS can change total covered distance.'});
   }
   const routes=JSON.parse(await readFile('docs/mission-23-evidence/routes-native.json','utf8'));
   for(const name of ['pente-marche-course','escalier-documente']){
    const r=routes.reports.find(r=>r.name===name),heading=Math.atan2(r.initial.x-r.turn.x,r.initial.z-r.turn.z);
    await p.evaluate(a=>window.c15.setup(...a),[[name,r.initial.x,r.initial.z,heading,.14,3.7,'third'],'balanced','2026-06-21']);await settle(p);
    await movie(p,version+'-'+name,async()=>{
     await p.keyboard.down('w');for(let i=0;i<16;i++){await p.evaluate(target=>window.p251.steer(target),i<8?r.turn:r.initial).catch(()=>{});await p.waitForTimeout(800)}await p.keyboard.up('w');await p.waitForTimeout(1500);
    },{version,source:r.source,method:'Real documented M23 axis. Individual stair risers remain unsurveyed; no synthetic stair geometry.'});
   }
   await writeFile(out+'/errors-'+version+'.json',JSON.stringify(game.errors));await p.close();
  }
 }else{
  const game=await open251(browser,candidatePort,{viewport:{width:800,height:520},append:`window.p251.steer=t=>{yaw=Math.atan2(avatar.position.x-t.x,avatar.position.z-t.z)};window.p251.auto=()=>walker.start(routeAt(avatar.position,activeTerrain));`}),p=game.page;
  if(stage==='water'){
   const water=await p.evaluate(()=>window.p25.test());await writeFile(out+'/swim-accesses.json',JSON.stringify(water,null,2));
   for(let i=0;i<water.length;i++){
    await p.evaluate(s=>window.p25.bank(s),water[i].site);await settle(p);
    if(i===0){await p.locator('canvas').click({position:{x:700,y:200}});await p.evaluate(()=>window.p25.audio());}
    await movie(p,'swim-'+(i+1),async()=>{await p.keyboard.down('w');await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='swimming',{},{timeout:120000});await p.waitForTimeout(2200);await p.keyboard.up('w');await p.waitForTimeout(700);await p.screenshot({path:out+'/swim-'+(i+1)+'.png'});await p.keyboard.down('s');await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking',{},{timeout:120000});await p.keyboard.up('s');await p.waitForTimeout(700)},{site:water[i].site.id,method:'True Anglin access, game-estimated bed; native mix from AudioContext. Initial dry-bank placement only.'});
   }
  }else if(stage==='atmosphere'){
   await p.evaluate(()=>{window.c15.setup(['forest',-426.723088216,346.512916,.785,.12,5,'third'],'balanced','2026-06-21');window.m24.wind(.65)});await settle(p);await p.locator('canvas').click({position:{x:700,y:200}});await p.evaluate(()=>window.p25.audio());
   await movie(p,'forest-wind-native',async()=>{for(let i=0;i<185;i++){await p.waitForTimeout(1000);if(i%30===0)console.log('WIND',i);}}, {method:'185 native wall-clock seconds, stationary camera; diagnostic shared mean wind 0.65 selected before capture, no weather/time acceleration during capture; shared simulated wind and native stereo mix.'});
   await movie(p,'living-walk-native',async()=>{await p.evaluate(()=>window.p251.auto());for(let i=0;i<310;i++){await p.waitForTimeout(1000);if(i%30===0)console.log('WALK',i);}}, {method:'310 native seconds from real forest start, existing AutoWalk route and physics. Trace determines actual movement/habitats; no guarantee of three habitats or an uninterrupted route.'});
  }
  if(stage==='atmosphere'){
   const site=JSON.parse(await readFile(out+'/swim-accesses.json','utf8'))[1].site;
   await p.evaluate(s=>{window.p251.restore();window.p25.bank(s);window.c15.setup(['autumn-bank',s.dry.x,s.dry.z,Math.atan2(s.normal.x,s.normal.z),.18,4.2,'third'],'balanced','2026-11-15');},site);await settle(p);await p.evaluate(()=>window.c15.native(true));await p.locator('#action-boat').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='boating');await p.evaluate(()=>{window.c15.native(false);window.p251.sky()});
   await movie(p,'birds-autumn-native',async()=>{for(let i=0;i<200;i++){await p.waitForTimeout(1000);if(i%30===0)console.log('AUTUMN',i)}},{method:'200 native seconds in a real bank-launched boat, November scenario, free upward camera. Family/individual counts in trace determine what actually appeared; no flock is manually spawned and no goose recording is invented.'});
  }
  await writeFile(out+'/errors-'+stage+'.json',JSON.stringify(game.errors));
 }
 await writeFile(out+'/captures-'+stage+'.json',JSON.stringify({videos},null,2));
}finally{await browser.close()}
