// Research baseline only. No renderer or world file is changed by this script.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {injection} from './lib/browser-road-fixture.mjs';
const dir='docs/mission-13-evidence',port=process.env.TEST_PORT??5173;
const views=[
 ['rue',-12.277392682727118,-32.416383999943434,.65,.12,5,'third'],
 ['facade',-7.6,-27.66,1.5,-.08,0,'first'],
 ['toitures',-12,-30,.8,.5,65,'aerial'],
 ['chemin',-211.3,-184.27,-.27792784240234414,.12,0,'first'],
 ['sol',-420,-320,1,.30,0,'first'],
 ['falaise',-80,210,-.75,-.28,0,'first'],
 ['berge',-150,245,-1.1,.12,0,'first'],
 ['village',-100,155,.5,.5,210,'aerial']
];
await mkdir(dir+'/baseline',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[];
 page.setDefaultTimeout(180000);
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);
 await page.route('**/src/main.ts*',async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');
  assert.ok(body.includes('if(window.earthHold)return;'));
  await route.fulfill({response,body:body+injection+`
   window.m13={step(dt){updateAtmosphere(dt,quality==='low');scene.userData.decorationStream?.tick(quality==='low',16,0)},profile(n){setLifeProfile(n)},state(){const materials=new Set(),textures=new Map();scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.set(m.map.uuid,{name:m.map.name,width:m.map.image?.width,height:m.map.image?.height})}});return {position:avatar.position.toArray(),camera:camera.position.toArray(),matrix:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),climate:scene.userData.climate,life:scene.userData.earthLife,terrain:activeTerrain.metrics,nature:natureMemory(scene),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length,materials:materials.size,mappedTextures:[...textures.values()],heap:performance.memory?.usedJSHeapSize}}};`});
 });
 await page.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);
 await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,viewport:[innerWidth,innerHeight],devicePixelRatio,buffer:[gl.drawingBufferWidth,gl.drawingBufferHeight]}});
 await page.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 const results=[];
 for(const [view,profile] of [...views.map(v=>[v,'balanced']),[views[0],'eco'],[views[0],'quality']]){
  await page.evaluate(({view,profile})=>{window.earthTest.setup(view);window.m13.profile(profile);for(let i=0;i<240;i++)window.m13.step(1);window.earthTest.lod()},{view,profile});
  for(let i=0;i<50;i++){await page.evaluate(()=>{window.m13.step(0);window.earthTest.lod()});await page.waitForTimeout(30)}
  await page.evaluate(()=>window.earthTest.render());
  const samples=[];
  for(let i=0;i<6;i++)samples.push(await page.evaluate(()=>{const start=performance.now();const render=window.earthTest.render();return {synchronizedMs:performance.now()-start,...render}}));
  const file=`baseline/${view[0]}-${profile}.jpg`;
  await page.screenshot({path:`${dir}/${file}`,type:'jpeg',quality:88});
  const state=await page.evaluate(()=>window.m13.state());
  const x=view[1],z=view[2];
  results.push({id:view[0],profile,file,station:view,geo:{lat:46.6953-z/111320,lon:.8844+x/(111320*Math.cos(46.6953*Math.PI/180)),frame:'inverse existing local tangent plane, approximate WGS84'},state,samples});
  console.log(view[0],profile,Math.round(samples.at(-1).synchronizedMs)+'ms');
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${dir}/baseline.json`,JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),rendererChanges:false,method:'Browser response instrumentation pauses simulation and exposes existing camera/LOD/render functions; source files unchanged. Six synchronized render/readback samples per station; no FPS or hardware-GPU claim.',date:'2026-06-21T12:00:00Z',environment,results,errors},null,2)+'\n');
}finally{await browser.close()}
