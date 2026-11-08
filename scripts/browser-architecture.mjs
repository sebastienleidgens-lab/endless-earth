import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2]??'after',dir='docs/mission-05-captures';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:720}});page.setDefaultTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.TEST_URL??'http://localhost:5173/endless-earth/?perf=1');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const settle=()=>page.evaluate(()=>new Promise(resolve=>{let n=0;function tick(){if(++n===65)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)}));
 // Lock both runs to the same explicit quality, independent of adaptive software FPS.
 await page.getByRole('button',{name:/Qualité :/}).click();if((await page.evaluate(()=>window.endlessDiagnostics.quality))!=='high')await page.getByRole('button',{name:/Qualité :/}).click();
 const results={};
 const capture=async name=>{await settle();results[name]={state:await page.evaluate(()=>window.endlessDiagnostics),perf:await page.locator('.perf-panel').innerText()};await page.addStyleTag({content:'.perf-panel{visibility:hidden}'});await page.screenshot({path:`${dir}/${phase}-${name}.png`});await page.addStyleTag({content:'.perf-panel{visibility:visible}'});};
 await capture('rue');await page.mouse.move(500,300);await page.mouse.wheel(0,10000);await capture('troisieme');
 await page.keyboard.press('v');await page.keyboard.press('v');await page.getByRole('button',{name:/Forteresse/}).click();await capture('aerienne');
 await page.mouse.move(500,300);await page.mouse.wheel(0,-500);await capture('toitures');
 await page.getByRole('button',{name:/Qualité :/}).click();await capture('eco');
 await page.setViewportSize({width:390,height:844});await capture('mobile');
 const initialArchitecture=results.rue.state.architecture;
 if(phase==='after'||phase==='optimized'){
  assert.ok(initialArchitecture?.length&&initialArchitecture.every(s=>s.builds===1));
  assert.deepEqual(results.mobile.state.architecture,initialArchitecture,'camera and LOD never rebuild coarse architecture');
  const references=['before',...(phase==='optimized'?['pr-initial']:[])];
  for(const reference of references){const before=JSON.parse(await readFile(`${dir}/${reference}-measurements.json`,'utf8'));
  for(const [name,record] of Object.entries(results)){
   const old=before.results[name].state,now=record.state;
   assert.deepEqual(now.position,old.position,`${name}: same geographic viewpoint`);assert.equal(now.yaw,old.yaw);assert.equal(now.zoom,old.zoom);
   assert.ok(Math.hypot(...now.camera.map((n,i)=>n-old.camera[i]))<.025,`${name}: same camera angle and position`);
  }}
 }
 const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'});
 const generation=await page.evaluate(async()=>{
  const THREE=await import('/endless-earth/node_modules/.vite/deps/three.js');const geo=await import('/endless-earth/src/world/geodata.ts');const t=await import('/endless-earth/src/world/terrain.ts');const terrain=await t.fetchTerrain();const data=await (await fetch('/endless-earth/data/angles-osm.geojson')).json();const group=new THREE.Group();const start=performance.now();geo.renderGeoFeatures(group,data.features,terrain);const ms=performance.now()-start;let triangles=0,meshes=0,bytes=0;group.traverse(o=>{if(o.isMesh){meshes++;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;bytes+=o.geometry.index?.array.byteLength??0;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1)}});return {ms,triangles,meshes,bytes,architecture:group.userData.architecture??null};
 });
 assert.deepEqual(errors,[]);await writeFile(`${dir}/${phase}-measurements.json`,JSON.stringify({results,generation,gpu,errors},null,2));console.log(JSON.stringify({phase,generation,errors}));
}finally{await browser.close()}
