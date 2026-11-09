import {Script} from 'node:vm';
import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const label=process.argv[2]??'initial',port=process.env.TEST_PORT??(label.startsWith('m05')?'5174':label.startsWith('initial')?'5175':'5173');
const dir='docs/mission-06-1';await mkdir(dir,{recursive:true});
const fixtures=JSON.parse(await readFile('docs/mission-06-captures/final.json','utf8')).results;
const injection=String.raw`
window.natureReadback=new Uint8Array(innerWidth*innerHeight*4);
window.natureBench={
 makeGroup(){return new THREE.Group()},
 configure(r,name,neutral=true){
  walker.stop();qualityAuto=false;applyQuality(r.quality);viewMode=r.mode;avatar.visible=r.mode!=='first';avatar.position.fromArray(r.position);camera.position.fromArray(r.camera);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  const eye=avatar.position.clone();eye.y+=1.65;
  if(r.mode==='first')camera.lookAt(eye.x-Math.sin(r.yaw)*Math.cos(.85),eye.y-Math.sin(.85),eye.z-Math.cos(r.yaw)*Math.cos(.85));else camera.lookAt(eye);
  window.dispatchEvent(new CustomEvent('nature-test-date',{detail:name==='nuit'?'2026-06-21T23:00:00Z':name==='aurore'?'2026-06-21T04:00:00Z':'2026-06-21T12:00:00Z'}));
  updateAtmosphere(0,quality==='low');
  if(neutral){const night=name==='nuit',dawn=name==='aurore';const hemi=scene.children.find(o=>o.isHemisphereLight);hemi.color.set(0xffffff);hemi.groundColor.set(0x707961);hemi.intensity=night?.18:dawn?.45:1.63;sun.color.set(night?0xc8d2e0:dawn?0xf1b17d:0xfff3dc);sun.intensity=night?0:dawn?.15:1.9;sun.position.set(avatar.position.x-60,avatar.position.y+100,avatar.position.z+55);sun.target.position.copy(avatar.position);sun.target.updateMatrixWorld();scene.fog.color.set(night?0x1b293e:0xcbd7d6);scene.fog.near=320;scene.fog.far=1450;if(scene.background?.isColor)scene.background.copy(scene.fog.color);}
  camera.updateMatrixWorld();
 },
 lod(){const t=performance.now();updateVegetationLOD(scene,camera,quality==='low');updateArchitectureLOD(scene,camera,quality==='low');return performance.now()-t},
 render(){renderer.render(scene,camera);window.natureBench.finish();return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}},
 finish(){const gl=renderer.getContext(),n=gl.drawingBufferWidth*gl.drawingBufferHeight*4;if(window.natureReadback.length!==n)window.natureReadback=new Uint8Array(n);gl.finish();gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,window.natureReadback)},
 sample(n){const result=[];const gl=renderer.getContext();window.natureBench.finish();for(let i=0;i<n;i++){const t=performance.now();renderer.render(scene,camera);const submitted=performance.now();window.natureBench.finish();result.push({submitMs:submitted-t,completeMs:performance.now()-t})}return result},
 cpu(n){const a=[],l=[];for(let i=0;i<n;i++){let t=performance.now();updateAtmosphere(1/60,quality==='low');a.push(performance.now()-t);t=performance.now();updateVegetationLOD(scene,camera,quality==='low');updateArchitectureLOD(scene,camera,quality==='low');l.push(performance.now()-t)}return {atmosphere:a,lod:l}},
 memory(){const seen=new Set(),instances=new Set();let bytes=0,triangles=0,instanceBytes=0;scene.traverse(o=>{for(const g of o.userData.natureResources?.geometries??[]){if(!seen.has(g)){seen.add(g);for(const a of Object.values(g.attributes))bytes+=a.array.byteLength;bytes+=g.index?.array.byteLength??0;triangles+=(g.index?.count??g.attributes.position.count)/3}}if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;bytes+=o.geometry.index?.array.byteLength??0;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}if(o.instanceMatrix&&!instances.has(o)){instances.add(o);instanceBytes+=o.instanceMatrix.array.byteLength+(o.instanceColor?.array.byteLength??0)}});return {geometryBytes:bytes,uniqueTriangles:triangles,instanceBytes,architecture:architectureMemory(scene)}},
 ablate(kind){const restore=[];const seen=new Set();scene.traverse(o=>{if(kind==='skyOrder'&&o.isMesh&&o.material.isShaderMaterial&&o.material.vertexShader.includes('elevation')){const order=o.renderOrder,vertex=o.material.vertexShader;o.renderOrder=-10;o.material.vertexShader=vertex.replace('gl_Position.z=gl_Position.w;','');o.material.needsUpdate=true;restore.push(()=>{o.renderOrder=order;o.material.vertexShader=vertex;o.material.needsUpdate=true})}if(kind==='trees'&&(o.userData.natureTreeCell||o.userData.vegetationCell)||kind==='atmosphere'&&o.parent===scene&&(o.isInstancedMesh||o.isMesh&&o.material.isShaderMaterial||o.isGroup&&o.children.some(c=>c.isLine))){const v=o.visible;o.visible=false;restore.push(()=>o.visible=v)}if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(seen.has(m))continue;seen.add(m);const key=m.customProgramCacheKey();if(kind==='ground'&&key.includes('nature-ground')||kind==='water'&&key.includes('anglin')||kind==='foliage'&&key.includes('living-foliage')){const fn=m.onBeforeCompile,cache=m.customProgramCacheKey;m.onBeforeCompile=kind==='foliage'?(shader=>{fn.call(m,shader);shader.vertexShader=shader.vertexShader.replace(/transformed\.[xz]\s*\+=\s*sin\(livingTime[^;]+;/g,'')}):()=>{};m.customProgramCacheKey=()=> 'benchmark-unmodified';m.needsUpdate=true;restore.push(()=>{m.onBeforeCompile=fn;m.customProgramCacheKey=cache;m.needsUpdate=true})}}});window.natureBench.restore=()=>restore.forEach(f=>f())}
};`;
new Script(injection);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600},deviceScaleFactor:1});page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.log('ERROR',String(e))});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>window.natureBenchHold=true);
 await page.route('**/src/main.ts*',async route=>{const r=await route.fetch();let body=await r.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.natureBenchHold)return;');assert.ok(body.includes('if(window.natureBenchHold)return;'));await route.fulfill({response:r,body:body+injection})});
 await page.goto(`http://localhost:${port}/endless-earth/?perf=1&date=2026-06-21T12:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const cpuBefore=await readFile('/sys/fs/cgroup/cpu.stat','utf8');const results={},outer=[];const environment=await page.evaluate(()=>({userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,gpu:(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null})()}));
 const names=process.env.VIEWS?.split(',')??Object.keys(fixtures);
 for(const name of names){
  const r=fixtures[name].state;await page.setViewportSize(name==='mobile'?{width:390,height:844}:{width:800,height:600});
  await page.evaluate(({r,name})=>window.natureBench.configure(r,name),{r,name});const lod=await page.evaluate(()=>Array.from({length:80},()=>window.natureBench.lod()));
  for(let i=0;i<3;i++)await page.evaluate(()=>window.natureBench.render());
  const samples=[];for(let round=0;round<Number(process.env.ROUNDS??3);round++){const t=Date.now();const sample=await page.evaluate(()=>window.natureBench.sample(5));samples.push(sample);outer.push({view:name,round,wallMs:Date.now()-t});/*(await page.evaluate(()=>window.natureBench.sample(5)));*/await page.waitForTimeout(100)}
  results[name]={camera:await page.evaluate(()=>({p:window.endlessDiagnostics.camera,mode:window.endlessDiagnostics.mode})),render:await page.evaluate(()=>window.natureBench.render()),memory:await page.evaluate(()=>window.natureBench.memory()),samples,lodMs:lod,cpu:await page.evaluate(()=>window.natureBench.cpu(60))};
  if(process.env.ABLATE==='1'){
   results[name].ablations={};
   for(const kind of process.env.SKY_ONLY==='1'?['skyOrder']:['ground','trees','foliage','water','atmosphere']){
    await page.evaluate(k=>window.natureBench.ablate(k),kind);for(let i=0;i<2;i++)await page.evaluate(()=>window.natureBench.render());await page.evaluate(()=>window.natureBench.restore());for(let i=0;i<2;i++)await page.evaluate(()=>window.natureBench.render());
    const pairs=[];for(let round=0;round<3;round++){
     const order=round%2?['off','full']:['full','off'];const pair={};
     for(const state of order){if(state==='off')await page.evaluate(k=>window.natureBench.ablate(k),kind);pair[state]=await page.evaluate(()=>window.natureBench.sample(2));if(state==='off')await page.evaluate(()=>window.natureBench.restore());}
     pairs.push(pair);
    }
    results[name].ablations[kind]={pairs};
   }
  }
  console.log(label,name,JSON.stringify(results[name].render));await writeFile(`${dir}/${label}-profile.json`,JSON.stringify({label,parameters:{viewport:[800,600],mobile:[390,844],pixelRatio:1,lighting:'shared fixed lights',rounds:Number(process.env.ROUNDS??3),samplesPerRound:5,completion:'gl.finish + full RGBA readback',animation:'held during drawing; CPU sampled separately'},results,outer,environment,errors},null,2));
 }
 const generation=await page.evaluate(async()=>{const data=await(await fetch('/endless-earth/data/angles-osm.geojson')).json(),t=await import('/endless-earth/src/world/terrain.ts'),geo=await import('/endless-earth/src/world/geodata.ts'),living=await import('/endless-earth/src/living/geography.ts'),terrain=await t.fetchTerrain(),samples=[];for(let i=0;i<3;i++){const count=living.nature.length,group=window.natureBench.makeGroup(),start=performance.now();geo.renderGeoFeatures(group,data.features,terrain);samples.push({ms:performance.now()-start,architecture:group.userData.architecture,nature:group.userData.nature});living.nature.splice(count);const geometries=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const g of o.userData.natureResources?.geometries??[])geometries.add(g)});geometries.forEach(g=>g.dispose());group.clear();}return samples});
 await writeFile(`${dir}/${label}-profile.json`,JSON.stringify({label,parameters:{viewport:[800,600],mobile:[390,844],pixelRatio:1,lighting:'shared fixed lights',rounds:Number(process.env.ROUNDS??3),samplesPerRound:5,completion:'gl.finish + full RGBA readback',animation:'held during drawing; CPU sampled separately',affinity:'0,1',quota:'2 CPU'},results,outer,environment,generation,cpuBefore,cpuAfter:await readFile('/sys/fs/cgroup/cpu.stat','utf8'),errors},null,2));
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
