import {readFile,mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {launch,open24,settle} from './lib/mission-24-browser.mjs';import {indexNativeWebM} from './lib/native-webm.mjs';
const out='docs/mission-25-evidence';await mkdir(out,{recursive:true});await mkdir('work/mission-25/raw',{recursive:true});
const source=await readFile('scripts/validate-mission-25-runtime.mjs','utf8'),inspection=source.split('append:`')[1].split('`});')[0]+`
window.p25.findCamp=()=>{for(let z=-300;z<300;z+=10)for(let x=-620;x<-220;x+=10){const r=playerWorld.camp({x,z},0);if(r.ok&&groundActions.seatAt(r.layout.origin,playerWorld))return r.layout.origin;}return null;};
window.p25.profile=v=>setLifeProfile(v);window.p25.resetExposure=()=>{exposure.wetness=0;};
window.p25.restore=()=>{activity.reset();boat.reset();aquatic.provider=null;groundActions.sit=0;groundActions.flight=null;camp.clear();};
window.p25.traces=()=>window.cFrames.map(f=>f);
window.p25.begin=()=>{window.c15.native(true);const old=scene.onAfterRender;scene.onAfterRender=(...a)=>{old.apply(scene,a);const f=window.cFrames.at(-1);Object.assign(f,{player:activity.state,depth:aquatic.last?.depth,waterSource:aquatic.last?.source,boat:{active:boat.active,visible:boat.visible,speed:boat.speed,scale:boat.scale,stroke:boat.stroke},exposure:{...exposure},groundMarks:{...groundMarks.metrics},camp:{...camp.metrics}})};window.c15.record();};`;
const b=await launch(),result={base:'c73ee0748cb51911e919d4f672010ce3e75df360',method:'Native canvas/AudioContext MediaRecorder, real-time keyboard/click/touch. Explicit diagnostic scene placement/climate only; no reconstructed frames or animation time dilation. Software SwiftShader.',videos:[],errors:[],shots:[],environments:[]};
const save=()=>writeFile(out+'/captures.json',JSON.stringify(result,null,2));
async function shot(p,name){await p.screenshot({path:out+'/'+name+'.png'});result.shots.push(name+'.png');}
async function movie(p,name,action,kind){await p.evaluate(()=>window.p25?.begin?window.p25.begin():(window.c15.native(true),window.c15.record()));await action();const bytes=await p.evaluate(()=>window.c15.stop()),frames=await p.evaluate(()=>{const f=window.cFrames;window.c15.native(false);return f;});await writeFile(out+'/'+name+'.webm',Buffer.from(bytes));const media=await indexNativeWebM(out+'/'+name+'.webm','work/mission-25/raw/'+name+'.webm');await writeFile(out+'/'+name+'.json',JSON.stringify({kind,frames},null,2));result.videos.push({name,file:name+'.webm',trace:name+'.json',kind,media,frames:frames.length});await save();console.log('VIDEO',name,frames.length);return frames;}
try{
 const stage=process.argv[2]??'water';
 if(stage==='locomotion'){
  for(const [version,port]of [['before',5361],['after',5360]]){const g=await open24(b,port,{viewport:{width:800,height:520},append:version==='after'?inspection:''});const p=g.page;result.environments.push({version,...g.environment});
   for(const [angle,offset,keys]of [['rear',0,['w']],['profile',Math.PI/2,['d']],['front',Math.PI,['s']],['three-quarter',Math.PI/4,['w','d']]]){
    await p.evaluate(a=>window.c15.setup(...a),[['run',-620,-300,.7+offset,.08,3.3,'third',.7+Math.PI],'balanced','2026-06-21']);await settle(p);await p.evaluate(()=>window.c15.render());await shot(p,version+'-'+angle);
    await movie(p,version+'-run-'+angle,async()=>{for(const k of keys)await p.keyboard.down(k);await p.waitForTimeout(2300);await p.keyboard.down('Shift');await p.waitForTimeout(6000);await p.keyboard.up('Shift');await p.waitForTimeout(2000);for(const k of keys)await p.keyboard.up(k);await p.waitForTimeout(2000);await p.keyboard.down(keys[0]==='s'?'w':'s');await p.waitForTimeout(1500);await p.keyboard.up(keys[0]==='s'?'w':'s');await p.waitForTimeout(1500);},version+' paired real pilot ground; same camera, input, date and profile');
   }result.errors.push(...g.errors);await p.close();
  }
 }else{
  const g=await open24(b,5360,{viewport:{width:800,height:520},append:inspection});const p=g.page;result.environments.push(g.environment);const water=await p.evaluate(()=>window.p25.test());assert.ok(water.every(r=>r.swimming&&r.exit==='walking'));result.water=water;
  result.cycles=await p.evaluate(s=>window.p25.boatTest(s),water[1].site);assert.ok(result.cycles.every(c=>c.start.ok&&c.dock.ok&&c.end==='walking'&&!c.visible));await writeFile(out+'/runtime-checks.json',JSON.stringify({water,cycles:result.cycles},null,2));
  if(stage==='water'){
   for(let i=0;i<water.length;i++){
    await p.evaluate(s=>window.p25.bank(s),water[i].site);await settle(p);
    const frames=await movie(p,'anglin-'+(i+1),async()=>{await p.keyboard.down('w');await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='swimming',{},{timeout:120000});await p.waitForTimeout(1700);await p.keyboard.up('w');await p.waitForTimeout(1000);await shot(p,'anglin-'+(i+1)+'-swimming');await p.keyboard.down('s');await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking',{},{timeout:120000});await p.keyboard.up('s');await p.waitForTimeout(1000);},'Actual OSM Anglin outline, estimated bed, native entry/swim/turn/exit');assert.ok(frames.some(f=>f.player==='swimming'));assert.equal(frames.at(-1).player,'walking');
   }
   await p.evaluate(s=>window.p25.bank(s),water[1].site);
   await movie(p,'packraft',async()=>{await p.waitForTimeout(800);await p.locator('#action-boat').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='boating');await shot(p,'packraft-boarded');await p.keyboard.down('w');await p.waitForTimeout(3000);await p.keyboard.down('d');await p.waitForTimeout(1000);await p.keyboard.up('d');await p.keyboard.up('w');await p.waitForTimeout(1200);await shot(p,'packraft-paddling');await p.locator('#action-recover').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking',{},{timeout:120000});await p.waitForTimeout(700);await shot(p,'packraft-packed');},'Native contextual launch, paddling/steering/drift, visible assisted docking/packing; no bridge passage claimed');
  }else if(stage==='interactions'){
   const site=await p.evaluate(()=>window.p25.findCamp());assert.ok(site);result.campSite=site;
   await p.evaluate(s=>{window.p25.restore();window.c15.setup(['rest',s.x,s.z,.7,.1,3.5,'third',0],'balanced','2026-06-21')},site);
   await movie(p,'ground-interactions',async()=>{await p.waitForTimeout(600);await p.locator('#action-seat').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='sitting');await p.waitForTimeout(1500);await shot(p,'sitting');await p.locator('#action-seat').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking');await p.locator('#action-jump').click();await p.waitForTimeout(300);await shot(p,'jump');await p.waitForTimeout(1800);await p.keyboard.down('w');await p.waitForTimeout(1800);await p.keyboard.up('w');},'Verified real pilot stable ground: sit/stand, limited jump, walking restart; benches/rocks not claimed');
   await p.evaluate(s=>{window.p25.restore();window.c15.setup(['camp',s.x,s.z,.7,.1,4.8,'third',0],'balanced','2026-06-21')},site);await p.locator('canvas').click({position:{x:700,y:220}});await p.evaluate(()=>window.p25.audio());await p.waitForTimeout(1200);
   result.campCycles=[];
   await movie(p,'camp-audio',async()=>{for(let i=0;i<10;i++){await p.locator('#action-camp').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='camping');await p.waitForTimeout(i===0?3500:300);if(i===0)await shot(p,'camp-audible');const active=await p.evaluate(()=>window.endlessDiagnostics.audio);if(i%3===0)await p.evaluate(i=>window.p25.profile(i%2?'eco':'balanced'),i);await p.locator('#action-camp').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking');await p.waitForTimeout(500);result.campCycles.push({i,active,packed:await p.evaluate(()=>({player:window.endlessPlayerDiagnostics,audio:window.endlessDiagnostics.audio}))});console.log('CAMP',i+1);}},'Existing CC0 campfire chain, real output AudioContext captured, ten cycles and profile changes');
   await p.evaluate(s=>{window.p25.restore();window.c15.setup(['rain',s.x,s.z,.7,.08,2.5,'third',0],'balanced','2026-06-21');window.p25.resetExposure();},site).catch(()=>{});
   await movie(p,'rain-clothes',async()=>{await p.evaluate(()=>{const s=document.querySelector('select[aria-label="Météo simulée"]');s.value='rain';s.dispatchEvent(new Event('change'))});await p.waitForTimeout(14000);await shot(p,'wet-clothes');await p.evaluate(()=>{const s=document.querySelector('select[aria-label="Météo simulée"]');s.value='clear';s.dispatchEvent(new Event('change'))});await p.waitForTimeout(5000);},'Shared simulated rain, gradual wet appearance. Full drying validated automatically, not claimed visible within this short film.');
  }
  result.errors.push(...g.errors);await p.close();
 }
 await writeFile(out+'/captures-'+(process.argv[2]??'water')+'.json',JSON.stringify(result,null,2));console.log('DONE',result.errors);
}catch(e){result.failure=String(e);await save();throw e;}finally{await b.close()}
