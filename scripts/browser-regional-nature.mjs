import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {injection} from './lib/browser-road-fixture.mjs';
const phase=process.argv[2]??'before',dir=process.env.EVIDENCE_DIR??'docs/mission-12-evidence/nature',port=process.env.TEST_PORT??5173;
await mkdir(dir,{recursive:true});
export const views=[
 ['bois',-430,340,1,-.12,0,'first'],
 ['aerienne',-430,340,.5,.5,110,'aerial'],
 ['lisiere',-300,340,1.4,.02,0,'first'],
 ['sous-bois',-426.72308821603656,346.51291632745415,.7853981633974483,.48,0,'first'],
 ['berge',-100,300,.6,-.08,0,'first'],
 ['prairie',320,-40,-1.2,.24,0,'first'],
 ['vent-modere',-430,340,1,-.12,0,'first'],
 ['rafales',-430,340,1,-.12,0,'first'],
 ['printemps',-430,340,1,-.12,0,'first'],
 ['automne',-430,340,1,-.12,0,'first'],
 ['hiver',-430,340,1,-.12,0,'first'],
 ['persistants',521,269,1.4,-.12,0,'first']
];
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage({viewport:{width:960,height:640}}),errors=[];p.setDefaultTimeout(180000);
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 if(process.env.ART_APPROACH==='volume')await p.route('**/src/nature/render.ts*',async r=>{const response=await r.fetch(),body=(await response.text()).replace('createTreeArt()',"createTreeArt('volume')");await r.fulfill({response,body})});
 await p.addInitScript(()=>window.earthHold=true);
 await p.route('**/src/main.ts*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await r.fulfill({response,body:body+injection+`
 window.m12={step(dt){updateAtmosphere(dt,quality==='low');scene.userData.decorationStream?.tick(quality==='low',16,0)},profile(n){setLifeProfile(n)},state(){let art;scene.traverse(o=>{if(o.userData.natureArt)art=o.userData.natureArt});return {art,nature:natureMemory(scene),camera:camera.position.toArray(),matrix:camera.matrixWorld.toArray(),climate:scene.userData.climate,life:scene.userData.earthLife,terrain:activeTerrain.metrics,geometry:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length,heap:performance.memory?.usedJSHeapSize}}};`})});
 await p.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);
 await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const environment=await p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,cores:navigator.hardwareConcurrency,resolution:[960,640]}});
 await p.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 const results=[];
 for(const v of views.filter(v=>!process.env.TEST_VIEWS||process.env.TEST_VIEWS.split(',').includes(v[0]))){
  await p.evaluate(v=>{window.earthTest.setup(v);window.m12.profile('balanced');const moment=document.querySelector('[aria-label="Moment de la journée"]');window.dispatchEvent(new CustomEvent('nature-test-date',{detail:({printemps:'2026-04-21',automne:'2026-10-21',hiver:'2026-01-21',persistants:'2026-01-21'}[v[0]]??'2026-06-21')+'T12:00:00Z'}));moment.value='afternoon';moment.dispatchEvent(new Event('change'));const weather=document.querySelector('[aria-label="Météo simulée"]');weather.value=v[0]==='rafales'?'storm':v[0]==='vent-modere'?'cloudy':'clear';weather.dispatchEvent(new Event('change'));for(let i=0;i<240;i++)window.m12.step(1);window.earthTest.lod()},v);
  for(let i=0;i<50;i++){await p.evaluate(()=>{window.m12.step(0);window.earthTest.lod()});await p.waitForTimeout(30)}
  await p.evaluate(()=>window.earthTest.render());
  const samples=[];for(let i=0;i<2;i++)samples.push(await p.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {ms:performance.now()-t,...render}}));
  await p.screenshot({path:`${dir}/${phase}-${v[0]}.jpg`,type:'jpeg',quality:92});
  results.push({id:v[0],station:v,state:await p.evaluate(()=>window.m12.state()),samples});
  await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,environment,results,errors},null,2));console.log(phase,v[0],samples.at(-1).ms);
 }
 assert.deepEqual(errors,[]);
}finally{await b.close()}
