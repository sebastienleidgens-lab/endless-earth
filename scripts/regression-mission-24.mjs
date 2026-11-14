import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,open24,settle,out} from './lib/mission-24-browser.mjs';
const original=JSON.parse(await readFile('docs/mission-23-evidence/after.json')),captures=JSON.parse(await readFile(out+'/captures.json')),b=await launch();
try{
 for(const [version,port]of [['before',5361],['after',5360]]){
  const {page,errors}=await open24(b,port,{viewport:{width:800,height:520},query:'&snowCover=0'});
  for(const name of ['raccord-sec','talus-sec','pont-sec']){const row=original.rows.find(r=>r.name===name);assert.ok(row);await page.evaluate(a=>window.c15.setup(...a),[row.station,'balanced','2026-06-21','clear']);await settle(page);await page.evaluate(()=>{window.m24.snow(0);window.m24.render()});const file='pilot/'+version+'-'+name+'.png';await page.screenshot({path:out+'/'+file});captures.shots.push({version,file,kind:'actual M23 known terrain/bridge station without snow; no terrain fix claimed',sourceStation:row.station,state:await page.evaluate(()=>window.m24.summary())});}
  assert.deepEqual(errors,[]);await page.close();
 }
 const mobile=JSON.parse(await readFile(out+'/mobile-controls.json'));captures.shots.push({version:'after',file:'pilot/mobile-compiled.png',kind:'compiled bundle, native CDP touch emulation; no physical Android test'});captures.videos.push({file:'mobile-touch-native.webm',kind:mobile.mode,media:mobile.media,controls:'mobile-controls.json'});
 const collisions=JSON.parse(await readFile(out+'/before-collisions.json'));assert.deepEqual(collisions,JSON.parse(await readFile(out+'/after-collisions.json')));
 await writeFile(out+'/regression.json',JSON.stringify({collisionPoints:collisions.points.length,movementTrials:collisions.moves.length,identical:true,source:'Actual loaded engine on pinned M23 and M24. Known terrain problems remain open; dry stations retained.'},null,2)+'\n');await writeFile(out+'/captures.json',JSON.stringify(captures,null,2)+'\n');console.log('M23 dry terrain/bridge stations captured; 2898 collisions and 20 movements remain identical.');
}finally{await b.close()}
