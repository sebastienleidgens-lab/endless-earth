import {chromium} from 'playwright';import {readFile,writeFile} from 'node:fs/promises';import {gunzipSync,gzipSync} from 'node:zlib';import assert from 'node:assert/strict';import {injection} from './lib/browser-road-fixture.mjs';
const out='docs/mission-13-evidence/integration',reference=JSON.parse(gunzipSync(await readFile(out+'/before.json.gz'))),stations=['rue','falaise','village'].map(id=>reference.rows.find(r=>r.id===id).station);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const pages={},rows=[],errors=[];
 for(const phase of ['before','photo','hybrid']){
  const p=await browser.newPage({viewport:{width:800,height:600}});p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.addInitScript(()=>window.earthHold=true);
  await p.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');await route.fulfill({response,body:body+injection+`
  window.m13bench={setup(v,profile){window.earthTest.setup(v);applyQuality(profile==='eco'?'low':'high');setLifeProfile(profile);for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low')},tick(){window.earthTest.lod();scene.userData.decorationStream?.tick(quality==='low',16,0)},state(){return {camera:camera.matrixWorld.toArray(),climate:scene.userData.climate.date,weather:scene.userData.climate.weather,profile:scene.userData.earthLife.profile,memory:{...renderer.info.memory},programs:renderer.info.programs.length,authentic:window.endlessDiagnostics.authentic??{active:'mission12'}}}};`});});
  await p.goto(`http://localhost:${phase==='before'?5182:5173}/endless-earth/?perf=1&materials=${phase==='photo'?'photographic':phase==='before'?'mission12':'hybrid'}&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);pages[phase]=p;
 }
 for(const profile of ['eco','balanced','quality'])for(const station of stations)for(let round=0;round<3;round++){
  for(const phase of round%2?['hybrid','photo','before']:['before','photo','hybrid']){
   const p=pages[phase];await p.evaluate(({station,profile})=>window.m13bench.setup(station,profile),{station,profile});
   for(let i=0;i<50;i++){await p.evaluate(()=>window.m13bench.tick());await p.waitForTimeout(25)}
   await p.evaluate(()=>window.earthTest.render());const samples=[];
   for(let i=0;i<4;i++)samples.push(await p.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {ms:performance.now()-t,...render}}));
   rows.push({phase,profile,station:station[0],round,samples,state:await p.evaluate(()=>window.m13bench.state())});
  }
  const current=rows.slice(-3),base=current.find(r=>r.phase==='before');
  for(const r of current){assert.deepEqual(r.state.camera,base.state.camera);assert.equal(r.state.climate,base.state.climate);assert.deepEqual(r.state.weather,base.state.weather);assert.equal(r.samples[0].calls,base.samples[0].calls);assert.equal(r.samples[0].triangles,base.samples[0].triangles)}
  console.log('PASS paired',profile,station[0],round);
 }
 const q=(xs,p)=>{const a=[...xs].sort((a,b)=>a-b),x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.ceil(x)]-a[i])*(x-i)},summary=[];
 for(const profile of ['eco','balanced','quality'])for(const station of stations)for(const phase of ['before','photo','hybrid']){const rs=rows.filter(r=>r.phase===phase&&r.profile===profile&&r.station===station[0]),samples=rs.flatMap(r=>r.samples),ms=samples.map(s=>s.ms);summary.push({phase,profile,station:station[0],n:ms.length,medianMs:q(ms,.5),p95Ms:q(ms,.95),maxMs:Math.max(...ms),calls:samples[0].calls,triangles:samples[0].triangles,textures:rs.at(-1).state.memory.textures,programs:rs.at(-1).state.programs})}
 assert.deepEqual(errors,[]);await writeFile(out+'/performance.json.gz',gzipSync(JSON.stringify({method:'Same real pilot, alternating versions, held simulation, 800x600, full synchronized readback, three profiles, three stations, three rounds, four samples. SwiftShader only.',rows,errors}),{level:9,mtime:0}));await writeFile(out+'/performance-summary.json',JSON.stringify({renders:rows.reduce((n,r)=>n+r.samples.length,0),summary,errors},null,2)+'\n');
}finally{await browser.close()}
