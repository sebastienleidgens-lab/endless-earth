import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {injection} from './lib/browser-road-fixture.mjs';
const phase=process.argv[2]??'before',dir=process.env.EVIDENCE_DIR??'docs/mission-12-evidence',port=process.env.TEST_PORT??5173;
await mkdir(dir,{recursive:true});
const views=[
 ['mineral',-7.6,-27.66,-1.65,.35,0,'first'],
 ['nature',-420,-320,1,.30,0,'first'],
 ['roche',-80,210,-.75,-.28,0,'first'],
 ['berge',-150,245,-1.1,.12,0,'first'],
 ['eau',-150,245,-1.5,.42,0,'first'],
 ['riviere',-100,155,.5,.5,210,'aerial'],
 ['matin',-150,245,-1.5,.20,0,'first'],
 ['pluie-soir',-150,245,-1.5,.20,0,'first']
];
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage({viewport:{width:960,height:640}}),errors=[];p.setDefaultTimeout(180000);
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.addInitScript(()=>window.earthHold=true);
 await p.route('**/src/main.ts*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await r.fulfill({response,body:body+injection+`
 window.m12={step(dt){updateAtmosphere(dt,quality==='low');scene.userData.decorationStream?.tick(quality==='low',16,0)},profile(n){setLifeProfile(n)},state(){return {camera:camera.position.toArray(),matrix:camera.matrixWorld.toArray(),climate:scene.userData.climate,life:scene.userData.earthLife,terrain:activeTerrain.metrics,geometry:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length,heap:performance.memory?.usedJSHeapSize}}};`})});
 await p.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);
 await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const environment=await p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,cores:navigator.hardwareConcurrency,resolution:[960,640]}});
 await p.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 const results=[];
 for(const v of views.filter(v=>!process.env.TEST_VIEWS||process.env.TEST_VIEWS.split(',').includes(v[0]))){
  await p.evaluate(v=>{window.earthTest.setup(v);window.m12.profile('balanced');const moment=document.querySelector('[aria-label="Moment de la journée"]');moment.value=v[0]==='matin'?'morning':v[0]==='pluie-soir'?'evening':'afternoon';moment.dispatchEvent(new Event('change'));const weather=document.querySelector('[aria-label="Météo simulée"]');weather.value=v[0]==='pluie-soir'?'rain':'clear';weather.dispatchEvent(new Event('change'));for(let i=0;i<240;i++)window.m12.step(1);window.earthTest.lod()},v);
  for(let i=0;i<50;i++){await p.evaluate(()=>{window.m12.step(0);window.earthTest.lod()});await p.waitForTimeout(30)}
  await p.evaluate(()=>window.earthTest.render());
  const samples=[];for(let i=0;i<5;i++)samples.push(await p.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {ms:performance.now()-t,...render}}));
  await p.screenshot({path:`${dir}/${phase}-${v[0]}.jpg`,type:'jpeg',quality:92});
  results.push({id:v[0],station:v,state:await p.evaluate(()=>window.m12.state()),samples});
  await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,environment,results,errors},null,2));console.log(phase,v[0],samples.at(-1).ms);
 }
 assert.deepEqual(errors,[]);
}finally{await b.close()}
