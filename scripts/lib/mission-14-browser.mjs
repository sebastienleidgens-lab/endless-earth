import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {injection} from './browser-road-fixture.mjs';
export const views=[
 ['chateau-pont',-184,154,-1.12,-.35,0,'first'],
 ['chateau-rive',-222,204,-.91,-.28,0,'first'],
 ['falaise-vallee',-80,210,-.75,-.28,0,'first'],
 ['village-pont',-100,155,.5,.5,210,'aerial'],
 ['rue-chateau',-55,70,.85,-.05,0,'first'],
 ['sur-pont',-185,155,-.15,0,0,'first'],
 ['zone-haute',80,90,1,.08,0,'first'],
 ['aerienne',-70,200,.5,.5,310,'aerial'],
 ['berges',-150,245,-1.1,.25,0,'first'],
 ['foret-relief',-430,340,1,-.12,0,'first']
];
export async function launch(){return chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})}
export async function openGame(browser,port,options={}){
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[],warnings=[];page.setDefaultTimeout(180000);
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);
 if(options.route)await options.route(page);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();
 body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));
 await route.fulfill({response,body:body+injection+`
 window.m14={
 tick(){window.earthTest.lod();scene.userData.decorationStream?.tick(quality==='low',16,0)},
 setup(v,profile='balanced',pose){window.earthTest.setup(v);setLifeProfile(profile);for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low');if(pose){camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);camera.fov=pose.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld()}},
 state(){return {camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov,matrix:camera.matrixWorld.toArray()},climate:scene.userData.climate,terrain:activeTerrain.metrics,relief:activeTerrain.relief??null,stream:scene.userData.decorationStream?.metrics,nature:natureMemory(scene),memory:window.earthTest.memory(),walkable:canWalk(avatar.position.x,avatar.position.z),build:document.querySelector('.build-badge')?.textContent}},
 sample(x,z){return activeTerrain.relativeHeight(x,z)},canWalk(x,z){return canWalk(x,z)},
 move(x,z,dx,dz){const p=new THREE.Vector3(x,activeTerrain.relativeHeight(x,z),z);moveWithCollision(p,{x:dx,z:dz},(x,z)=>activeTerrain.relativeHeight(x,z),false);return p.toArray()},
 lod(x,z){updateTerrainLOD(scene,{x,z},{x,z},quality==='low')},
 meshes(){const out=[];scene.traverse(o=>{if(o.userData.earthTile){const p=o.geometry.attributes.position;out.push({position:Array.from(p.array),index:Array.from(o.geometry.index.array),far:o.userData.earthTile.far})}});return out}
 };`});});
 const started=performance.now();await page.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);
 await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const startupMs=performance.now()-started;
 await page.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,resolution:[innerWidth,innerHeight],dpr:devicePixelRatio}});
 return {page,errors,warnings,startupMs,environment};
}
export async function settle(page){for(let i=0;i<55;i++){await page.evaluate(()=>window.m14.tick());await page.waitForTimeout(25)}}
