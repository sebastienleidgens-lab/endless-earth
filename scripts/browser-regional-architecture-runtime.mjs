import {chromium} from 'playwright';import assert from 'node:assert/strict';import {writeFile,readFile} from 'node:fs/promises';
import {injection} from './lib/browser-road-fixture.mjs';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),errors=[],rows=[];
try{
 for(const mode of ['normal','corrupt-atlas','stale-chunks']){
  const p=await b.newPage({viewport:{width:640,height:480}});p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  if(mode==='corrupt-atlas')await p.route('**/materials/architecture/atlas.png',r=>r.fulfill({status:200,body:Buffer.from('invalid'),contentType:'image/png'}));
  if(mode==='stale-chunks')await p.route('**/data/angles-decorations/manifest.json',async r=>{const response=await r.fetch(),m=await response.json();m.architectureMaterialVersion='stale';await r.fulfill({response,json:m})});
  await p.addInitScript(()=>window.earthHold=true);
  await p.route('**/src/main.ts*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');await r.fulfill({response,body:body+injection+`
  window.archTest={setup(v,profile='balanced'){window.earthTest.setup(v);applyQuality(profile==='eco'?'low':'high');setLifeProfile(profile);for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low')},tick(){window.earthTest.lod();scene.userData.decorationStream?.tick(quality==='low',16,0)},state(){let atlas,cached=0,hidden=0,materialErrors=0;scene.traverse(o=>{if(o.name==='architecture-shell')atlas=[o.material.map.image.width,o.material.map.image.height];if(o.userData.architectureDetail&&o.children.length){cached++;if(!o.visible)hidden++}if(o.name.startsWith('architecture-')&&o.geometry&&!o.geometry.attributes.architectureMaterial)materialErrors++});return {ready:geographyReady,atlas,cached,hidden,materialErrors,memory:architectureMemory(scene),stream:scene.userData.decorationStream?.metrics,render:{...renderer.info.render},textures:renderer.info.memory.textures,programs:renderer.info.programs.length}}};`})});
  await p.goto('http://localhost:5173/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z');await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
  const stations=JSON.parse(await readFile('docs/mission-12-evidence/architecture/before.json','utf8')).results.slice(0,6).map(r=>r.station),states=[];
  for(let i=0;i<(mode==='normal'?18:1);i++){
   await p.evaluate(({v,profile})=>window.archTest.setup(v,profile),{v:stations[i%stations.length],profile:['eco','balanced','quality'][Math.floor(i/6)%3]});
   for(let j=0;j<40;j++){await p.evaluate(()=>window.archTest.tick());await p.waitForTimeout(25)}
   await p.evaluate(()=>window.earthTest.render());const s=await p.evaluate(()=>window.archTest.state());assert.ok(s.ready);assert.equal(s.materialErrors,0);assert.ok(s.hidden<=12);assert.deepEqual(s.atlas,mode==='corrupt-atlas'?[60,40]:[864,576]);states.push(s);
  }
  rows.push({mode,states});await p.close();console.log('PASS',mode,states.length);
 }
 assert.deepEqual(errors,[]);await writeFile('docs/mission-12-evidence/architecture/runtime.json',JSON.stringify({method:'Actual shaders/loaded atlas in Chromium SwiftShader. Eighteen diagnostic station/profile changes exercise ordinary architecture streaming and the existing twelve-invisible-cell limit. Separate corrupt atlas and stale prepared-data fixtures preserve loading and deterministic source fallbacks. Camera station changes are diagnostics, not a continuous walk.',rows,errors},null,2));
}finally{await b.close()}
