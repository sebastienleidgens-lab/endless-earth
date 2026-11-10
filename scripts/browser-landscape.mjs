// Fixed, held-frame stations: identical geographic cameras before and after.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2]??'after',port=process.env.TEST_PORT??'5173';
const dir='docs/mission-08-captures';await mkdir(dir,{recursive:true});
const views=[
 ['village',-12.277392682727118,-32.416383999943434,.65,.12,5,'third'],
 ['vallee',-160,170,1.4,.10,0,'first'],
 ['riviere',-120,245,.9,.15,15,'third'],
 ['foret',-430,340,1,.22,8,'third'],
 ['ouvert',330,-400,1,.22,15,'third'],
 ['chemin-rural',26.074189061896412,367.2947740004058,-2.8931015790254264,.10,0,'first'],
 ['pente',-172.5553946702061,-160.01693399931483,.837,.17,0,'first'],
 ['sol',-430,340,1,.85,0,'first'],
 ['aerienne',-100,155,.5,.5,210,'aerial'],
 ['lointaine',140,-210,.6,.1,0,'first'],
 ['eco',-120,245,.9,.15,15,'third'],
 ['mobile',-120,245,.9,.15,15,'third'],
 ['chateau',-100,155,.5,.5,110,'aerial'],
 ['pont',-228,185,-1.0114,-.06,0,'first'],
 ['repere-photo',(.881419-.8844)*111320*Math.cos(46.6953*Math.PI/180),-(46.693642-46.6953)*111320,-57.949554397175*Math.PI/180,-.06,0,'first']
];
const injection=`
window.earthTest={
 setup(v){const [name,x,z,y,p,k,mode]=v;walker.stop();qualityAuto=false;applyQuality(['eco','mobile'].includes(name)?'low':'high');viewMode=mode;avatar.visible=mode!=='first';avatar.position.set(x,activeTerrain.relativeHeight(x,z),z);yaw=y;pitch=p;zoom=k;const eye=avatar.position.clone();eye.y+=1.65;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 if(mode==='first'){camera.position.copy(eye);camera.lookAt(eye.x-Math.sin(y)*Math.cos(p),eye.y-Math.sin(p),eye.z-Math.cos(y)*Math.cos(p))}
 else {camera.position.copy(eye).add(mode==='aerial'?new THREE.Vector3(Math.sin(y)*k,k*.78,Math.cos(y)*k):new THREE.Vector3(Math.sin(y)*Math.cos(p)*k,Math.sin(p)*k+.5,Math.cos(y)*Math.cos(p)*k));camera.lookAt(eye)}
 updateAtmosphere(0,quality==='low');camera.updateMatrixWorld();walkStatus.textContent='Station de comparaison · simulation en pause';viewButton.textContent='◉ '+viewNames[mode]+' · changer (V)';
 },
 lod(){const t=performance.now();updateVegetationLOD(scene,camera,quality==='low');updateArchitectureLOD(scene,camera,quality==='low');if(typeof updateTerrainLOD==='function')updateTerrainLOD(scene,camera.position,avatar.position,quality==='low');return performance.now()-t},
 render(){renderer.render(scene,camera);const gl=renderer.getContext(),n=gl.drawingBufferWidth*gl.drawingBufferHeight*4;window.earthReadback??=new Uint8Array(n);if(window.earthReadback.length!==n)window.earthReadback=new Uint8Array(n);gl.finish();gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,window.earthReadback);return {...renderer.info.render,textures:renderer.info.memory.textures}},
 memory(){const seen=new Set(),arrays=new Set(),textures=new Set();let geometryBytes=0,textureBytes=0;
 const account=g=>{if(seen.has(g))return;seen.add(g);for(const a of [...Object.values(g.attributes),...(g.index?[g.index]:[])])if(!arrays.has(a.array)){arrays.add(a.array);geometryBytes+=a.array.byteLength}};
 scene.traverse(o=>{for(const g of [...(o.userData.terrainResources?.geometries??[]),...(o.userData.natureResources?.geometries??[])])account(g);if(o.geometry)account(o.geometry);const tex=o.userData.terrainTexture;if(tex)textures.add(tex)});for(const tex of textures){const i=tex.image;textureBytes+=i.width*i.height*4*4/3}return {geometryBytes,terrainTextureBytesWithMipmaps:textureBytes,geometries:seen.size}},
 terrainCpu(){const samples=[];for(let i=0;i<3;i++){const start=performance.now(),g=activeTerrain.createMesh();samples.push(performance.now()-start);const geom=new Set(),mat=new Set();g.traverse(o=>{for(const a of o.userData.terrainResources?.geometries??[])geom.add(a);if(o.geometry){geom.add(o.geometry);mat.add(o.material)}});geom.forEach(g=>g.dispose());mat.forEach(m=>m.dispose())}return samples},
 terrain(){return activeTerrain.metrics??null}
};`;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await route.fulfill({response,body:body+injection})});
 const start=Date.now();await page.goto(`http://localhost:${port}/endless-earth/?perf=1&date=2026-06-21T12:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);const loadMs=Date.now()-start;
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency}});
 const terrainCpuMs=await page.evaluate(()=>window.earthTest.terrainCpu());const results={};
 for(const v of views.filter(v=>!process.env.TEST_VIEWS||process.env.TEST_VIEWS.split(',').includes(v[0]))){const name=v[0];await page.setViewportSize(name==='mobile'?{width:390,height:844}:{width:800,height:600});await page.evaluate(v=>window.earthTest.setup(v),v);
  const lodMs=await page.evaluate(()=>Array.from({length:100},()=>window.earthTest.lod()));
  await page.evaluate(()=>window.earthTest.render());await page.evaluate(()=>window.earthTest.render());
  const samples=[];for(let i=0;i<9;i++)samples.push(await page.evaluate(()=>{const t=performance.now();const render=window.earthTest.render();return {ms:performance.now()-t,render}}));
  results[name]={station:v,state:await page.evaluate(()=>window.endlessDiagnostics),memory:await page.evaluate(()=>window.earthTest.memory()),terrain:await page.evaluate(()=>window.earthTest.terrain()),lodMs,samples};
  await page.addStyleTag({content:'.perf-panel{visibility:hidden}'});await page.screenshot({path:`${dir}/${phase}-${name}.png`});
  await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,loadMs,terrainCpuMs,environment,results,errors},null,2));console.log(phase,name,samples.at(-1).render);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
