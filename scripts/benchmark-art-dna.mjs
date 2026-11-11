import {chromium} from 'playwright';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {injection} from './lib/browser-road-fixture.mjs';
const out='docs/mission-12-evidence/final';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const profiles=(process.env.BENCH_PROFILES??'eco,balanced,quality').split(',');
const pages={},errors=[],rows=process.env.BENCH_PROFILES?JSON.parse(gunzipSync(await readFile(out+'/performance.json.gz')).toString()).rows.filter(r=>!profiles.includes(r.profile)):[];
const stations=JSON.parse(await readFile(out+'/before.json','utf8')).results.filter(r=>['rue','chateau','foret','riviere'].includes(r.id)).map(r=>r.station);
try{
 for(const phase of ['before','prior','after']){
  const p=await b.newPage({viewport:{width:800,height:600}});p.setDefaultTimeout(180000);pages[phase]=p;
  p.on('pageerror',e=>errors.push({phase,error:String(e)}));p.on('console',m=>{if(m.type()==='error')errors.push({phase,error:m.text()})});
  await p.route('**/src/nature/render.ts*',async r=>{const response=await r.fetch();let body=await response.text();assert.ok(/function addNature\([^\n]*\)\s*\{/.test(body));body=body.replace(/function addNature\([^\n]*\)\s*\{/,m=>m+'const natureTimingStart=performance.now();').replaceAll('return ecology.trees;','scene.userData.natureTimingMs=performance.now()-natureTimingStart;return ecology.trees;');await r.fulfill({response,body})});
  await p.addInitScript(()=>window.earthHold=true);
  await p.route('**/src/main.ts*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await r.fulfill({response,body:body+injection+`
  window.artBench={setup(v,profile){window.earthTest.setup(v);applyQuality(profile==='eco'?'low':'high');setLifeProfile(profile);for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low')},tick(){updateVegetationLOD(scene,camera,quality==='low');updateArchitectureLOD(scene,camera,quality==='low');updateTerrainLOD(scene,camera.position,avatar.position,quality==='low');scene.userData.decorationStream?.tick(quality==='low',16,0)},state(){let natureBuildMs;scene.traverse(o=>{if(o.userData.natureTimingMs!==undefined)natureBuildMs=o.userData.natureTimingMs});return {natureBuildMs,position:avatar.position.toArray(),camera:camera.matrixWorld.toArray(),terrain:activeTerrain.metrics,climate:scene.userData.climate,life:scene.userData.earthLife,nature:natureMemory(scene),memory:window.earthTest.memory(),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length,heapBytes:performance.memory?.usedJSHeapSize}}};`})});
  await p.goto(`http://localhost:${phase==='before'?5181:phase==='prior'?5179:5173}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);
  await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 }
 const environment=await pages.after.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,resolution:[800,600],dpr:devicePixelRatio}});
 for(const profile of profiles)for(const v of stations){
  for(const phase of ['before','prior','after']){
   const p=pages[phase];await p.evaluate(({v,profile})=>window.artBench.setup(v,profile),{v,profile});
   for(let i=0;i<50;i++){await p.evaluate(()=>window.artBench.tick());await p.waitForTimeout(30)}
   await p.evaluate(()=>window.earthTest.render());
  }
  for(let pass=0;pass<3;pass++)for(const phase of pass%2?['after','prior','before']:['before','prior','after']){
   const p=pages[phase],samples=[];
   for(let i=0;i<4;i++)samples.push(await p.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {ms:performance.now()-t,...render}}));
   rows.push({phase,profile,station:v[0],pass,samples,state:await p.evaluate(()=>window.artBench.state())});
  }
  const a=rows.findLast(r=>r.profile===profile&&r.station===v[0]&&r.phase==='before'),c=rows.findLast(r=>r.profile===profile&&r.station===v[0]&&r.phase==='after');
  assert.deepEqual(a.state.position,c.state.position);assert.deepEqual(a.state.camera,c.state.camera);
  const prior=rows.findLast(r=>r.profile===profile&&r.station===v[0]&&r.phase==='prior');assert.equal(prior.samples[0].calls,c.samples[0].calls);assert.equal(prior.samples[0].triangles,c.samples[0].triangles);assert.equal(a.state.climate.date,c.state.climate.date);assert.deepEqual(a.state.climate.weather,c.state.climate.weather);
  console.log(profile,v[0],a.samples.at(-1).ms,prior.samples.at(-1).ms,c.samples.at(-1).ms);
  await writeFile(out+'/performance.json.gz',gzipSync(JSON.stringify({environment,method:'Three checkouts: Mission 11 83d9258, Mission 12C 3cd692e, final Mission 12D. One Chromium/SwiftShader. Changed tree/detail geometry and LOD, preserved source data, exact camera and effective date, held simulation, 800×600 DPR1. Four stations × three profiles × three passes × four synchronous render/readback samples × three versions. Order alternates each pass. No simultaneous renderer, audio or video benchmark; not physical GPU FPS.',rows,errors},null,2),{level:9}));
 }
 assert.deepEqual(errors,[]);
}finally{await b.close()}
