// Isolated alternation: no walk or other browser test may run concurrently.
import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {injection} from './lib/browser-road-fixture.mjs';
const dir='docs/mission-08-captures',reference=JSON.parse(await readFile(`${dir}/before.json`));
const names=['village','riviere','foret','aerienne','eco','mobile'];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const all=[];
try{
 for(const run of (process.env.BENCH_ROUNDS??'1,2,3').split(',').map(Number))for(const phase of run%2?['before','after']:['after','before']){
  const page=await browser.newPage({viewport:{width:800,height:600}});page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>window.earthHold=true);
  await page.route('**/src/main.ts*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await route.fulfill({response:r,body:body+injection})});
  const start=Date.now();await page.goto(`http://localhost:${phase==='before'?(process.env.BASELINE_PORT??5176):(process.env.TEST_PORT??5173)}/endless-earth/?perf=1&date=2026-06-21T12:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
  const result={run,phase,loadMs:Date.now()-start,results:{},errors};
  // renderer is module scoped; query through the DOM for environment evidence.
  result.environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');return {gpu:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL),agent:navigator.userAgent}});
  result.terrainCpuMs=await page.evaluate(()=>window.earthTest.terrainCpu());
  for(const name of names){
   const station=reference.results[name].station;await page.setViewportSize(name==='mobile'?{width:390,height:844}:{width:800,height:600});await page.evaluate(v=>window.earthTest.setup(v),station);
   const lod=await page.evaluate(()=>Array.from({length:120},()=>window.earthTest.lod()));
   await page.evaluate(()=>{window.earthTest.render();window.earthTest.render()});
   const samples=[];for(let i=0;i<21;i++)samples.push(await page.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {completeMs:performance.now()-t,...render}}));
   result.results[name]={station,lod,samples,memory:await page.evaluate(()=>window.earthTest.memory()),state:await page.evaluate(()=>window.endlessDiagnostics)};
  }
  assert.deepEqual(errors,[]);all.push(result);await writeFile(`${dir}/${process.env.BENCH_OUTPUT??'benchmark.json'}`,JSON.stringify({method:'Three alternating isolated rounds; 21 synchronized render/readback samples per station and round. SwiftShader software only. CPU submission is inside completion, not additive.',runs:all},null,2));console.log('PASS benchmark',run,phase);await page.close();
 }
}finally{await browser.close()}
