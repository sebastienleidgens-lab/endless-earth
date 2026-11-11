// Identical source cameras across the baseline checkout and integrated approaches.
import {chromium} from 'playwright';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {gzipSync} from 'node:zlib';
import {injection} from './lib/browser-road-fixture.mjs';
const phase=process.argv[2]??'hybrid',port=phase==='before'?5182:5173,dir='docs/mission-13-evidence/integration';await mkdir(dir+'/'+phase,{recursive:true});
const views=[
 ['rue',-12.277392682727118,-32.416383999943434,.65,.12,5,'third'],['facade',-7.6,-27.66,1.5,-.08,0,'first'],
 ['toitures',-12,-30,.8,.5,65,'aerial'],['chemin',-211.3,-184.27,-.27792784240234414,.12,0,'first'],
 ['sol',-420,-320,1,.30,0,'first'],['falaise',-80,210,-.75,-.28,0,'first'],['berge',-150,245,-1.1,.12,0,'first'],['village',-100,155,.5,.5,210,'aerial'],
 ['matin',-12.277392682727118,-32.416383999943434,.65,.12,5,'third'],['soir',-12.277392682727118,-32.416383999943434,.65,.12,5,'third'],
 ['pluie',-12.277392682727118,-32.416383999943434,.65,.12,5,'third'],['nuit',-12.277392682727118,-32.416383999943434,.65,.12,5,'third']
];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await browser.newPage({viewport:{width:960,height:640}}),errors=[],requests=[];p.setDefaultTimeout(180000);
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('request',r=>{if(r.url().includes('/materials/'))requests.push(r.url())});
 await p.addInitScript(()=>window.earthHold=true);
 await p.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));
 await route.fulfill({response,body:body+injection+`
 window.m13c={step(dt){updateAtmosphere(dt,quality==='low');scene.userData.decorationStream?.tick(quality==='low',16,0)},profile(n){setLifeProfile(n)},state(){return {camera:camera.position.toArray(),matrix:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),climate:scene.userData.climate,life:scene.userData.earthLife,terrain:activeTerrain.metrics,nature:natureMemory(scene),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length,authentic:window.endlessDiagnostics.authentic??{active:'mission12'},stream:scene.userData.decorationStream.metrics}}};`});});
 await p.goto(`http://localhost:${port}/endless-earth/?perf=1&materials=${phase==='before'?'mission12':phase==='photo'?'photographic':'hybrid'}&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);
 await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const environment=await p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,resolution:[960,640],dpr:devicePixelRatio}});
 await p.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 const rows=[];
 for(const v of views){
  await p.evaluate(v=>{window.earthTest.setup(v);window.m13c.profile('balanced');for(const [label,value] of [['Moment de la journée',v[0]==='matin'?'morning':['soir','pluie'].includes(v[0])?'evening':v[0]==='nuit'?'night':'afternoon'],['Météo simulée',v[0]==='pluie'?'rain':'clear']]){const s=document.querySelector('[aria-label="'+label+'"]');s.value=value;s.dispatchEvent(new Event('change'))}for(let i=0;i<240;i++)window.m13c.step(1);window.earthTest.lod()},v);
  for(let i=0;i<50;i++){await p.evaluate(()=>{window.m13c.step(0);window.earthTest.lod()});await p.waitForTimeout(30)}
  await p.evaluate(()=>window.earthTest.render());const samples=[];
  for(let i=0;i<4;i++)samples.push(await p.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {ms:performance.now()-t,...render}}));
  const file=`${phase}/${v[0]}.jpg`;await p.screenshot({path:`${dir}/${file}`,type:'jpeg',quality:90});rows.push({id:v[0],station:v,geo:{lat:46.6953-v[2]/111320,lon:.8844+v[1]/(111320*Math.cos(46.6953*Math.PI/180)),frame:'inverse existing local tangent plane; approximate WGS84'},file,state:await p.evaluate(()=>window.m13c.state()),samples});console.log(phase,v[0],samples.at(-1).ms);
 }
 assert.deepEqual(errors,[]);await writeFile(`${dir}/${phase}.json.gz`,gzipSync(JSON.stringify({phase,environment,rows,errors,requests}),{level:9,mtime:0}));
}finally{await browser.close()}
