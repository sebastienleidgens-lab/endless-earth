// Fixed, held-frame stations: identical geographic cameras before and after.
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2]??'073',port=process.env.TEST_PORT??({ '071':'5175','072':'5176','073':'5173'}[phase]);
const variant=process.env.TEST_VARIANT??'full';
const label=process.env.CAPTURE_LABEL??phase;
const dir=process.env.CAPTURE_DIR??'docs/mission-07-3-captures';await mkdir(dir,{recursive:true});
const views=[
 ['village',-12.277392682727118,-32.416383999943434,.65,.12,5,'third'],
 ['carrefour',28.341841814860743,-20.738915999527308,.5,.5,55,'aerial'],
 ['trois-voies',-98.58563079564878,47.622696000467215,1,.5,40,'aerial'],
 ['pente',-172.5553946702061,-160.01693399931483,.837,.17,0,'first'],
 ['rural',26.074189061896412,367.2947740004058,-2.8931015790254264,.10,0,'first'],
 ['rasante',-18.43135941299998,-38.63917199989373,.95,-.02,0,'first'],
 ['aerienne',20,10,.5,.5,210,'aerial'],
 ['raccord',-200,25.58133599995699,.8,.5,110,'aerial'],
 ['principale',162.18,-35.93,-1.13,.16,0,'first'],
 ['paves',-7.6,-27.66,-1.65,.5,0,'first'],
 ['gravier',-18,214,-1.84,.50,0,'first'],
 ['terre',-168.18,488.53,.36,.3,0,'first'],
 ['gros-plan',-7.6,-27.66,-1.65,.65,0,'first',.45],
 ['lointaine',20,10,.5,.5,460,'aerial'],
 ['eco',28.341841814860743,-20.738915999527308,.5,.5,55,'aerial'],
 ['mobile',-12.277392682727118,-32.416383999943434,.65,.12,5,'third']
];
import {ablateRoadModule} from './lib/road-ablations.mjs';
import {injection} from './lib/browser-road-fixture.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 if(variant!=='full')await page.route('**/src/world/road-material.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:ablateRoadModule(await response.text(),variant)})});
 if(process.env.TEST_EDGE_SIZE){
  const size=Number(process.env.TEST_EDGE_SIZE),root=size===2048?'work/mission-07-2-base/public/data':`work/field-${size}`;
  if(phase!=='073')await page.route('**/src/world/terrain.ts*',async route=>{const response=await route.fetch(),body=await response.text();const changed=body.replace('m.size !== 2048','![1024,1536,2048].includes(m.size)');assert.notEqual(changed,body);await route.fulfill({response,body:changed})});
  for(const ext of ['json','pack'])await page.route(`**/data/angles-road-edge.${ext}`,async route=>route.fulfill({status:200,body:await readFile(`${root}/angles-road-edge.${ext}`),contentType:ext==='json'?'application/json':'application/octet-stream'}));
 }
 await page.addInitScript(()=>window.earthHold=true);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await route.fulfill({response,body:body+injection+`
window.earthSubset=kind=>{window.earthOriginalIndices??=new WeakMap();scene.traverse(o=>{if(!o.userData.earthTile)return;const g=o.geometry;let index=window.earthOriginalIndices.get(g);if(!index){index=g.index;window.earthOriginalIndices.set(g,index)}const r=g.attributes.earthRoad.array,out=[];for(let i=0;i<index.count;i+=3)if((r[index.array[i]]>.5)===(kind==='roads'))out.push(...index.array.slice(i,i+3));g.setIndex(new THREE.BufferAttribute(new index.array.constructor(out),1));});};`})});
 const start=Date.now();await page.goto(`http://localhost:${port}/endless-earth/?perf=1&date=${process.env.TEST_DATE??'2026-06-21T12:00:00Z'}`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);const loadMs=Date.now()-start;if(true)assert.equal((await page.evaluate(()=>window.earthTest.terrain())).surface,'integrated','must capture the actual unified surface, never its fallback');
 if(process.env.TEST_WEATHER)await page.evaluate(mode=>window.earthTest.weather(mode),process.env.TEST_WEATHER);
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency}});
 const terrainCpuMs=await page.evaluate(()=>window.earthTest.terrainCpu());const results={};
 for(const v of views.filter(v=>!process.env.TEST_VIEWS||process.env.TEST_VIEWS.split(',').includes(v[0]))){const name=v[0];await page.setViewportSize(name==='mobile'?{width:390,height:844}:{width:800,height:600});await page.evaluate(v=>window.earthTest.setup(v),v);
  const lodMs=await page.evaluate(()=>Array.from({length:100},()=>window.earthTest.lod()));
  if(process.env.TEST_TERRAIN_ONLY||process.env.TEST_SURFACE_ONLY)await page.evaluate(()=>window.earthTest.terrainOnly(true));
  if(process.env.TEST_SURFACE_ONLY)await page.evaluate(kind=>window.earthSubset(kind),process.env.TEST_SURFACE_ONLY);
  await page.evaluate(()=>window.earthTest.render());await page.evaluate(()=>window.earthTest.render());
  const samples=[];for(let i=0;i<Number(process.env.TEST_SAMPLES??5);i++)samples.push(await page.evaluate(()=>{const t=performance.now();const render=window.earthTest.render();return {ms:performance.now()-t,render}}));
  results[name]={station:v,state:await page.evaluate(()=>window.endlessDiagnostics),memory:await page.evaluate(()=>window.earthTest.memory()),terrain:await page.evaluate(()=>window.earthTest.terrain()),lodMs,samples};
  await page.addStyleTag({content:'.perf-panel{visibility:hidden}'});if(!process.env.TEST_NO_SCREENSHOTS)await page.screenshot({path:`${dir}/${label}-${name}.png`});
  await writeFile(`${dir}/${label}.json`,JSON.stringify({phase,variant,edgeSize:process.env.TEST_EDGE_SIZE??null,loadMs,terrainCpuMs,terrainOnly:!!process.env.TEST_TERRAIN_ONLY,surfaceOnly:process.env.TEST_SURFACE_ONLY??null,environment,results,errors},null,2));console.log(phase,name,samples.at(-1).render);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
