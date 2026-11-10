// Matched held-camera animation samples. Each image is rendered after advancing simulation.
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {windAtWorld} from '../src/earthlife/wind.mjs';
import {flockAt,birdPosition} from '../src/earthlife/fauna.mjs';
import {injection} from './lib/browser-road-fixture.mjs';
const phase=process.argv[2]??'after',port=phase==='before'?5179:5173,dir='docs/mission-09-1-captures';
await mkdir(dir,{recursive:true});await mkdir(`work/mission-09-1/life-${phase}`,{recursive:true});
const views=[['foret-calme',214.42,530.66,1,.22,8,'third'],['foret-rafale',214.42,530.66,1,.22,8,'third'],['arbres',214.42,530.66,1,-.16,0,'first'],['herbes',330,-400,1,.4,0,'first',.25],['oiseau-isole',-140,716,1.4,-.48,0,'first'],['oiseaux-groupe',-140,716,1.4,-.48,0,'first'],['riviere',-150,245,-1.57,.18,0,'first'],['berge',-155,245,-1.57,.35,0,'first'],['ciel',330,-400,.5,-.8,0,'first'],['ombres',-100,155,.5,.5,210,'aerial'],['aerienne',-100,155,.5,.5,210,'aerial'],['mobile',-155,245,-1.57,.15,15,'third']];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await route.fulfill({response,body:body+injection+`\nwindow.lifeBalanced=()=>{if(lifeSettings.name!=='eco')setLifeProfile('balanced')};window.lifeClock=0;window.lifeStep=(dt)=>{window.lifeClock+=dt;updateAtmosphere(dt,quality==='low');updateVegetationLOD(scene,camera,quality==='low');updateArchitectureLOD(scene,camera,quality==='low');scene.userData.decorationStream?.tick(quality==='low',16,0);};window.lifeAim=(aim)=>{camera.lookAt(...aim);camera.updateMatrixWorld()};window.lifeCeiling=()=>scene.userData.lifeCeiling??Math.max(...scene.children.filter(o=>o.type==='Group').map(o=>new THREE.Box3().setFromObject(o).max.y))+12;`})});
 const start=Date.now();await page.goto(`http://localhost:${port}/endless-earth/?perf=1&date=2026-06-21T12:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);const loadMs=Date.now()-start;
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent}});
 await page.addStyleTag({content:'.perf-panel{visibility:hidden}.life-clean .living-panel,.life-clean .quiet-control,.life-clean .nature-controls,.life-clean .joystick,.life-clean .help,.life-clean button{visibility:hidden}'});const results=process.env.TEST_VIEWS?await readFile(`${dir}/${phase}.json`,'utf8').then(t=>JSON.parse(t).results):{};
 for(const [index,v] of views.filter(v=>!process.env.TEST_VIEWS||process.env.TEST_VIEWS.split(',').includes(v[0])).entries()){
  const name=v[0];await page.evaluate(name=>{window.lifeName=name;document.body.classList.toggle('life-clean',name!=='mobile')},name);await page.setViewportSize(name==='mobile'?{width:390,height:844}:{width:800,height:600});
  await page.evaluate(v=>{window.earthTest.setup(v);window.lifeBalanced();const s=document.querySelector('[aria-label="Météo simulée"]');s.value=['ciel','ombres'].includes(v[0])?'overcast':'clear';s.dispatchEvent(new Event('change'));for(let i=0;i<240;i++)window.lifeStep(1);window.earthTest.lod()},v);
  // Choose natural windows; never force a spawn or change geographic eligibility.
  let target=await page.evaluate(()=>window.lifeClock),aim=null;
  if(name==='foret-rafale'||name==='foret-calme'){
   while((name==='foret-rafale'?windAtWorld(v[1],v[2],target).gust<.6:windAtWorld(v[1],v[2],target).gust>.02))target+=.5;
  }
  if(name.startsWith('oiseau')){
   const cx=Math.floor(v[1]/256),cz=Math.floor(v[2]/256),conditions={habitat:'wood',day:1,rain:0,wind:.35};let f;
   for(let i=0;i<4000;i++,target+=.5){f=flockAt(target,cx*73856093+cz*19349663,conditions);if(f.active&&f.age>4&&f.age<f.duration-8&&(name==='oiseau-isole'?f.count===1:f.count>=3))break;}
   assert.ok(f.active);const ceiling=await page.evaluate(()=>window.lifeCeiling()),point=birdPosition(f,0,{x:(cx+.5)*256,z:(cz+.5)*256},ceiling);aim=[point.x,point.y,point.z];
  }
  await page.evaluate(target=>{while(window.lifeClock<target)window.lifeStep(Math.min(1,target-window.lifeClock))},target);
  if(aim)await page.evaluate(aim=>window.lifeAim(aim),aim);
  // Allow progressive loading, keeping simulation frozen.
  for(let i=0;i<12;i++){await page.evaluate(()=>window.lifeStep(0));await page.waitForTimeout(80)}
  const frames=[];
  for(let i=0;i<8;i++){
   const sample=await page.evaluate(()=>{const t=performance.now();window.lifeStep(['ciel','ombres','aerienne'].includes(window.lifeName)?4:.5);const cpuMs=performance.now()-t;const render=window.earthTest.render();return {cpuMs,render,state:window.endlessDiagnostics}});
   await page.screenshot({path:`work/mission-09-1/life-${phase}/${name}-${i}.png`});frames.push(sample);
  }
  execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','2','-i',`work/mission-09-1/life-${phase}/${name}-%d.png`,'-loop','0',`${dir}/${phase}-${name}.webp`]);
  await page.screenshot({path:`${dir}/${phase}-${name}.png`});results[name]={station:v,aim,target,frames,memory:await page.evaluate(()=>window.earthTest.memory())};
  await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,loadMs,environment,results,errors,method:'8 rendered simulation frames at 0.5 s (cloud/air views: 4 s, playback ×8); balanced desktop / eco mobile; four-second animated WebP, held geographic camera; 240 s weather settling per station. Natural deterministic flight/gust windows selected without forced spawning. Interface hidden except build badge for desktop artistic review; mobile retains controls. Herb station uses a 25 cm inspection camera. Not a realtime FPS measurement.'},null,2));console.log('PASS',phase,index+1,name);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
