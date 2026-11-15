import {readFile,writeFile} from 'node:fs/promises';
import {launch,open251,settle} from './lib/mission-25-1-browser.mjs';
import {indexNativeWebM} from './lib/native-webm.mjs';
const browser=await launch(),out='docs/mission-25-1-evidence',videos=[];
try{
 const game=await open251(browser,5367,{viewport:{width:800,height:520},append:`
 window.p251.bankRunway=sites=>sites.map(site=>{
  const p=new THREE.Vector3(site.dry.x,site.dry.y,site.dry.z);let length=0;
  for(let i=0;i<100;i++){const old=p.clone();moveWithCollision(p,{x:site.normal.x*.2,z:site.normal.z*.2},(x,z)=>activeTerrain.relativeHeight(x,z),false,.14);if(Math.hypot(p.x-old.x,p.z-old.z)<.15)break;length+=.2;}
  return {site,length};
 }).sort((a,b)=>b.length-a.length)[0];
 `}),p=game.page,sites=JSON.parse(await readFile(out+'/swim-accesses.json','utf8')).map(a=>a.site),runway=await p.evaluate(sites=>window.p251.bankRunway(sites),sites);
 await p.evaluate(s=>window.p25.bank(s),runway.site);await settle(p);await p.locator('canvas').click({position:{x:700,y:200}});await p.evaluate(()=>window.p25.audio());
 async function record(name,action,details){await p.evaluate(()=>window.p251.begin());await action();const bytes=await p.evaluate(()=>window.c15.stop()),frames=await p.evaluate(()=>{window.c15.native(false);return window.cFrames});await writeFile(out+'/'+name+'.webm',Buffer.from(bytes));const media=await indexNativeWebM(out+'/'+name+'.webm','work/mission-25-1/raw/'+name+'.webm');await writeFile(out+'/'+name+'.json',JSON.stringify({details,frames,sourceSnapshot:'final',errors:game.errors},null,2));videos.push({name,file:name+'.webm',trace:name+'.json',details,media});console.log('VIDEO',name,frames.length);}
 const seconds=Math.min(12,Math.max(3,runway.length/1.6));
 await record('river-approach-recede-native',async()=>{await p.keyboard.down('s');await p.waitForTimeout(seconds*1000);await p.keyboard.up('s');await p.waitForTimeout(1000);await p.keyboard.down('w');await p.waitForTimeout((seconds-1)*1000);await p.keyboard.up('w');await p.waitForTimeout(1500);},{method:'Actual S then W input along a real bank normal, after a diagnostic sweep using the existing land collision authority. No position assignments during recording. Audio is captured from the existing mix, listener/source positions in trace.',runway});
 await p.evaluate(s=>window.p25.bank(s),runway.site);await settle(p);
 await record('final-paddle-and-dock',async()=>{await p.locator('#action-boat').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='boating');await p.keyboard.down('w');await p.waitForTimeout(2200);await p.mouse.move(220,200);await p.mouse.down();await p.mouse.move(440,200,{steps:8});await p.mouse.up();await p.waitForTimeout(1800);await p.keyboard.up('w');await p.waitForTimeout(700);await p.screenshot({path:out+'/final-paddle.png'});await p.locator('#action-recover').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking',{},{timeout:120000});await p.waitForTimeout(800)},{method:'Final clavicle-frame grip solver and segmented bank corridor. Native launch, keyboard paddling, mouse camera orbit and assisted docking/packing on the loaded pilot. Dedicated hand-target test verifies <3.5 cm joint error at the tested paddle phases.'});
 await writeFile(out+'/captures-river-final.json',JSON.stringify({videos,errors:game.errors,environment:game.environment},null,2));
}finally{await browser.close()}
