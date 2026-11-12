import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {injection} from './browser-road-fixture.mjs';
export const views=[
 ['bois',-430,340,1,-.12,0,'first'],
 ['silhouettes',-300,340,1.4,.02,0,'first'],
 ['sous-bois',-426.72308821603656,346.51291632745415,.7853981633974483,.20,0,'first'],
 ['aerienne',-430,340,.5,.5,110,'aerial'],
 ['vallee',-100,155,.5,.5,210,'aerial'],
 ['rue',-55,70,.85,-.05,0,'first'],
];
export async function launch(){return chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--js-flags=--expose-gc']})}
export async function openGame(browser,port=5173,options={}){
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[],warnings=[];page.setDefaultTimeout(180000);
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);if(options.init)await page.addInitScript(options.init);if(options.route)await options.route(page);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));
  await route.fulfill({response,body:body+injection+`
  window.m15={
   setup(v,profile='balanced',date='2026-06-21',weather='clear',pose){window.earthTest.setup(v);applyQuality(profile==='eco'?'low':'high');setLifeProfile(profile);window.dispatchEvent(new CustomEvent('nature-test-date',{detail:date+'T12:00:00Z'}));for(const [label,value]of [['Moment de la journée','afternoon'],['Météo simulée',weather]]){const s=document.querySelector('select[aria-label="'+label+'"]');s.value=value;s.dispatchEvent(new Event('change'))}for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low');if(pose){camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);camera.fov=pose.fov;camera.updateProjectionMatrix()}camera.updateMatrixWorld()},
   tick(){window.earthTest.lod();scene.userData.decorationStream?.tick(quality==='low',16,0)},
   render(){return window.earthTest.render()},step(dt){updateAtmosphere(dt,quality==='low')},refresh(){landscapeLighting.invalidate()},
   native(start){if(start){window.m15Frames=[];window.m15PreviousAfter=scene.onAfterRender;let last=performance.now();scene.onAfterRender=(...args)=>{window.m15PreviousAfter.apply(scene,args);const t=performance.now();window.m15Frames.push({t,ms:t-last,position:avatar.position.toArray(),walkable:canWalk(avatar.position.x,avatar.position.z),shadow:scene.userData.landscapeLighting?.extraPasses,stream:scene.userData.decorationStream?.metrics?.active});last=t};clock.getDelta();window.earthHold=false}else{window.earthHold=true;scene.onAfterRender=window.m15PreviousAfter}},
   state(){let art,flowers;scene.traverse(o=>{if(o.userData.natureArt)art=o.userData.natureArt;if(o.userData.villageFlowers){const f=o.userData.villageFlowers;flowers={version:f.version,recipes:f.recipes,builds:f.builds,resident:f.cells.filter(c=>c.children.length).length,visible:f.cells.filter(c=>c.visible).length,season:f.season.value.toArray()}}});return {camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),matrix:camera.matrixWorld.toArray(),fov:camera.fov},climate:scene.userData.climate,lighting:scene.userData.landscapeLighting,nature:natureMemory(scene),art,flowers,memory:window.earthTest.memory(),gpu:{...renderer.info.memory,programs:renderer.info.programs.length},alloc:window.gpuAllocation?.snapshot(),stream:scene.userData.decorationStream?.metrics,position:avatar.position.toArray(),walkable:canWalk(avatar.position.x,avatar.position.z),heap:performance.memory?.usedJSHeapSize}},
   canWalk(x,z){return canWalk(x,z)},move(x,z,dx,dz){const p=new THREE.Vector3(x,activeTerrain.relativeHeight(x,z),z);moveWithCollision(p,{x:dx,z:dz},(x,z)=>activeTerrain.relativeHeight(x,z),false);return p.toArray()},
   export(){scene.updateMatrixWorld(true);const meshes=[],trees=[];scene.traverse(o=>{if(!o.isMesh)return;const tile=o.userData.earthTile;if(tile||o.name.startsWith('architecture-')&&o.name!=='architecture-detail'||o.name.startsWith('landmark-')||o.name==='mapped-linear-features'){if(o.isInstancedMesh)return;const g=tile?.fineGeometry??o.geometry,p=g.attributes.position,n=g.attributes.normal;meshes.push({name:o.name,position:Array.from(p.array),normal:Array.from({length:p.count},(_,i)=>[n.getX(i),n.getY(i),n.getZ(i)]).flat(),index:g.index?Array.from(g.index.array):null,matrix:o.matrixWorld.toArray(),water:g.attributes.earthWater?Array.from(g.attributes.earthWater.array):null})}});scene.traverse(o=>{if(!o.userData.natureTreeCell)return;const m=o.children[1],g=o.userData.natureTreeCell.farGeometry;g.computeBoundingBox();for(let i=0;i<m.count;i++){const q=new THREE.Matrix4();m.getMatrixAt(i,q);q.premultiply(m.matrixWorld);const box=g.boundingBox.clone().applyMatrix4(q),center=box.getCenter(new THREE.Vector3()),radius=box.getSize(new THREE.Vector3()).multiplyScalar(.5);trees.push({center:center.toArray(),radius:radius.toArray(),evergreen:m.geometry.attributes.natureTraits.getZ(i)})}});return {meshes,trees,baseline:activeTerrain.sample(0,0)}}
  };`});
 });
 const start=performance.now();await page.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z${options.query??''}`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 await page.waitForFunction(()=>!['loading','idle'].includes(window.m15.state().lighting.state));
 await page.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,resolution:[innerWidth,innerHeight],dpr:devicePixelRatio}});
 return {page,errors,warnings,startupMs:performance.now()-start,environment};
}
export async function settle(page){for(let i=0;i<55;i++){await page.evaluate(()=>window.m15.tick());await page.waitForTimeout(25)}}
