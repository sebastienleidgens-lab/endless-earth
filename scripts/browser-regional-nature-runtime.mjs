import {chromium} from 'playwright';import assert from 'node:assert/strict';import {writeFile,readFile} from 'node:fs/promises';
import {injection} from './lib/browser-road-fixture.mjs';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),errors=[],rows=[];
try{
 for(const mode of ['normal','corrupt-chunk','stale-chunks']){
  const p=await b.newPage({viewport:{width:640,height:480}});p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  if(mode==='corrupt-chunk')await p.route('**/data/angles-decorations/nature/*.pack',r=>r.fulfill({status:200,body:Buffer.from('invalid'),contentType:'application/octet-stream'}));
  if(mode==='stale-chunks')await p.route('**/data/angles-decorations/manifest.json',async r=>{const response=await r.fetch(),m=await response.json();m.natureArtVersion='stale';await r.fulfill({response,json:m})});
  await p.addInitScript(()=>window.earthHold=true);
  await p.route('**/src/main.ts*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');await r.fulfill({response,body:body+injection+`
  window.archTest={async cycles(){const {addNature,disposeNatureZone}=await import('/endless-earth/src/nature/render.ts'),cycles=[];for(let i=0;i<3;i++){const zone=new THREE.Group(),before=renderer.info.memory.textures;addNature(zone,[{tags:{natural:'wood'},rings:[[{x:-32,z:-32},{x:32,z:-32},{x:32,z:32},{x:-32,z:32}]]}],()=>0);renderer.initTexture(zone.userData.natureLeafTexture);const loaded=renderer.info.memory.textures;disposeNatureZone(zone);cycles.push([before,loaded,renderer.info.memory.textures]);}return cycles;},setup(v,profile='balanced'){window.earthTest.setup(v);applyQuality(profile==='eco'?'low':'high');setLifeProfile(profile);for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low')},tick(){window.earthTest.lod();scene.userData.decorationStream?.tick(quality==='low',16,0)},state(){let cached=0,hidden=0,kindErrors=0,calendars=[],art=[];scene.traverse(o=>{if(o.userData.natureCell?.detail){cached++;if(!o.userData.natureCell.detail.visible)hidden++}if(o.name==='nature-detail'&&!o.geometry.attributes.natureKind)kindErrors++;if(o.userData.natureCalendar)calendars.push(o.userData.natureCalendar.value.toArray());if(o.userData.natureArt)art.push(o.userData.natureArt)});return {ready:geographyReady,cached,hidden,kindErrors,calendars,art,nature:natureMemory(scene),stream:scene.userData.decorationStream?.metrics,render:{...renderer.info.render},textures:renderer.info.memory.textures,programs:renderer.info.programs.length}}};`})});
  await p.goto('http://localhost:5173/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z');await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
  const stations=JSON.parse(await readFile('docs/mission-12-evidence/nature/before.json','utf8')).results.slice(0,6).map(r=>r.station),states=[];
  for(let i=0;i<(mode==='normal'?18:1);i++){
   await p.evaluate(({v,profile,date})=>{window.dispatchEvent(new CustomEvent('nature-test-date',{detail:date+'T12:00:00Z'}));window.archTest.setup(v,profile)},{date:['2026-06-21','2026-06-21','2026-10-21','2026-01-21','2026-04-21','2026-06-21'][i%6],v:stations[i%stations.length],profile:['eco','balanced','quality'][Math.floor(i/6)%3]});
   for(let j=0;j<40;j++){await p.evaluate(()=>window.archTest.tick());await p.waitForTimeout(25)}
   await p.evaluate(()=>window.earthTest.render());const s=await p.evaluate(()=>window.archTest.state());assert.ok(s.ready);assert.equal(s.kindErrors,0);assert.ok(s.hidden<=4);assert.equal(s.art[0].version,'temperate-nature-v1');assert.ok(s.calendars.every(c=>c.every(Number.isFinite)));if(mode==='corrupt-chunk')assert.ok(s.stream.failed>0);if(i%6===3)assert.ok(s.calendars[0][0]<.06);if(i%6===0)assert.ok(s.calendars[0][0]>.98);states.push(s);
  }
  let textureCycles;
  if(mode==='normal')textureCycles=await p.evaluate(()=>window.archTest.cycles());
  if(textureCycles)for(const [before,loaded,freed] of textureCycles){assert.equal(loaded,before+1);assert.equal(freed,before)}
  rows.push({mode,states,textureCycles});await p.close();console.log('PASS',mode,states.length);
 }
 assert.deepEqual(errors,[]);await writeFile('docs/mission-12-evidence/nature/runtime.json',JSON.stringify({method:'Actual shaders in Chromium SwiftShader. Eighteen diagnostic station/profile changes exercise ordinary nature streaming and the four-invisible-cell limit. Corrupt optional nature chunks leave static geography and trees available. A stale nature manifest invokes deterministic source builders. Camera station changes are diagnostics, not a continuous walk.',rows,errors},null,2));
}finally{await b.close()}
