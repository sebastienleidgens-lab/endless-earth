// Real engine captures; deterministic camera/date, held simulation, no substitute art.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {momentDate,MOMENTS,WEATHER} from '../src/nature/climate.mjs';
import {injection} from './lib/browser-road-fixture.mjs';
const phase=process.argv[2]??'after',before=phase==='before',dir='docs/mission-11-evidence',reference='2026-06-21T12:00:00Z',site={lat:46.6953,lon:.8844,timeZone:'Europe/Paris'};
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await route.fulfill({response,body:body+injection+`\nwindow.m11={step(dt){updateAtmosphere(dt,quality==='low');scene.userData.decorationStream?.tick(quality==='low',16,0);},profile(name){setLifeProfile(name);},state(){return {climate:scene.userData.climate,acoustic:scene.userData.acousticClimate,life:scene.userData.earthLife,programs:renderer.info.programs.length,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}},dispose(){updateAtmosphere.dispose();renderer.render(scene,camera);return {geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,panels:document.querySelectorAll('.nature-controls').length}}};`})});
 await page.goto(`http://localhost:${before?5176:5173}/endless-earth/?perf=1&date=${reference}`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent}});
 const station=['quality',-150,245,-1.1,-.15,0,'first'];
 await page.evaluate(v=>{window.earthTest.setup(v);window.m11.profile('balanced')},station);
 for(let i=0;i<50;i++){await page.evaluate(()=>{window.m11.step(0);window.earthTest.lod()});await page.waitForTimeout(80)}
 await page.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 const results=[];
 const cases=[...Object.keys(MOMENTS).map(moment=>({id:moment,moment,weather:'clear'})),...Object.keys(WEATHER).filter(w=>w!=='clear').map(weather=>({id:weather,moment:'afternoon',weather})),{id:'aerial-cloudy',moment:'afternoon',weather:'cloudy',aerial:true},{id:'sky-cloudy',moment:'afternoon',weather:'cloudy',sky:true},{id:'sunset-west',moment:'evening',weather:'clear',west:true}];
 for(const c of cases){
  const date=momentDate(c.moment,reference,site).date.toISOString();
  await page.evaluate(({date,c,before})=>{
   window.earthTest.setup(c.aerial?['quality',-100,155,.5,.5,210,'aerial']:['quality',-150,245,c.west?1.1:-1.1,c.sky?-.8:-.15,0,'first']);window.m11.profile('balanced');
   dispatchEvent(new CustomEvent('nature-test-date',{detail:before?date:'2026-06-21T12:00:00Z'}));
   if(!before){const s=document.querySelector('[aria-label="Moment de la journée"]');s.value=c.moment;s.dispatchEvent(new Event('change'));}
   const w=document.querySelector('[aria-label="Météo simulée"]');w.value=before?({cloudy:'overcast',storm:'rain'}[c.weather]??c.weather):c.weather;w.dispatchEvent(new Event('change'));
   for(let i=0;i<240;i++)window.m11.step(1);window.earthTest.lod();
  },{date,c,before});
  const perf=[];for(let i=0;i<6;i++){const p=await page.evaluate(()=>{const t=performance.now();window.m11.step(.1);const updateMs=performance.now()-t;const start=performance.now(),render=window.earthTest.render();return {updateMs,...render,renderReadbackMs:performance.now()-start}});perf.push(p)}
  await page.screenshot({path:`${dir}/${phase}-${c.id}.jpg`,type:'jpeg',quality:90});
  results.push({...c,date,state:await page.evaluate(()=>window.m11.state()),perf});console.log('CAPTURE',phase,c.id);
 }
 const profileBench=[];
 for(const profile of ['eco','balanced','quality'])for(const weather of ['clear','overcast','rain']){
  await page.evaluate(({profile,weather})=>{window.earthTest.setup(['quality',-150,245,-1.1,-.15,0,'first']);window.m11.profile(profile);const w=document.querySelector('[aria-label="Météo simulée"]');w.value=weather;w.dispatchEvent(new Event('change'));for(let i=0;i<240;i++)window.m11.step(1);window.earthTest.lod();window.earthTest.render()}, {profile,weather});
  const samples=[];for(let i=0;i<8;i++)samples.push(await page.evaluate(()=>{const a=performance.now();window.m11.step(.1);const updateMs=performance.now()-a,b=performance.now(),render=window.earthTest.render();return {updateMs,...render,renderReadbackMs:performance.now()-b}}));
  profileBench.push({profile,weather,samples,state:await page.evaluate(()=>window.m11.state())});
 }
 let robustness=null;
 if(!before){
  const memory=[];
  for(let i=0;i<36;i++){
   await page.evaluate(i=>{window.m11.profile(['eco','balanced','quality'][i%3]);const w=document.querySelector('[aria-label="Météo simulée"]');w.value=['clear','cloudy','overcast','mist','rain','storm'][i%6];w.dispatchEvent(new Event('change'));const m=document.querySelector('[aria-label="Moment de la journée"]');m.value=['morning','afternoon','evening','night','real'][i%5];m.dispatchEvent(new Event('change'));for(let n=0;n<30;n++)window.m11.step(.1);window.earthTest.render()},i);
   memory.push(await page.evaluate(()=>window.m11.state()));
  }
  const geometryCounts=memory.map(m=>m.geometries);assert.ok(Math.max(...geometryCounts)-Math.min(...geometryCounts)<=2);
  const programs=memory.map(m=>m.programs);assert.ok(Math.max(...programs.slice(18))-Math.min(...programs.slice(18))<=2);
  const last=memory.at(-1),disposed=await page.evaluate(()=>window.m11.dispose());assert.equal(disposed.panels,0);assert.ok(disposed.geometries<last.geometries);
  robustness={cycles:36,memory,disposed,method:'36 weather/time/profile changes with three simulated seconds per cycle and real render/readback; bounded renderer resources; explicit sky/cloud/rain/fauna/events disposal. Not a prolonged walk or JS-heap leak proof.'};
 }
 await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,reference,station,environment,results,profileBench,robustness,errors,method:'960×640 Chromium SwiftShader, exact same station and effective UTC dates before/after; simulation held; 240×1s settling per case, 6 forced GPU readback samples per case. Submission/readback wall time is not hardware FPS. Baseline has no cloudy/storm modes: overcast/rain used explicitly.'},null,2));assert.deepEqual(errors,[]);
}finally{await browser.close()}
