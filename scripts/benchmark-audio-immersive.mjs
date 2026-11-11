import {chromium} from 'playwright';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {immersiveHook} from './lib/audio-immersive-fixture.mjs';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const rows=[];
try{
 for(const phase of ['before','after']){
  const p=await b.newPage({viewport:{width:800,height:600}}),errors=[];p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(String(e)));await p.addInitScript(()=>window.audioHold=true);
  await p.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/const updateAtmosphere\s*=\s*naturalSky/,'let updateAtmosphere=naturalSky').replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.audioHold)return;');await route.fulfill({response,body:body+immersiveHook+`\nwindow.audioProfile=name=>setLifeProfile(name);window.acousticSample=()=>{const started=performance.now();sound.nextContext=0;sound.update(avatar.position,0,0,yaw,scene.userData.acousticClimate,scene.userData.earthLife,scene.userData.lifeHabitat,lifeSettings.name,acousticAltitude,scene.userData.lifeSoundSources);return performance.now()-started};`})});
  await p.goto(`http://localhost:${phase==='before'?5177:5173}/endless-earth/?perf=1&moment=real&date=2026-05-10T06:00:00Z`);await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);await p.locator('#sound').click();
  for(const profile of ['eco','balanced','quality'])for(const [station,x,z,weather] of [['river',-150,245,'clear'],['forest',214.42,530.66,'overcast'],['village',-12.277,-32.416,'clear']]){
   await p.evaluate(({profile,x,z,weather})=>{window.immersiveHost.reset(x,z,'2026-05-10T06:00:00Z',weather);window.audioProfile(profile);window.immersiveHost.at({x,z},.1)},{profile,x,z,weather});await p.waitForTimeout(1200);
   for(const enabled of [false,true]){const row=await p.evaluate(async ({enabled,x,z})=>{const s=window.immersiveHost.sound;if(s.enabled!==enabled)await s.toggle();const samples=[];for(let i=0;i<60;i++){samples.push(window.acousticSample())}return {enabled,samples,stats:s.stats(),heap:performance.memory?.usedJSHeapSize??null}},{enabled,x,z});rows.push({phase,profile,station,...row});}
  }
  assert.deepEqual(errors,[]);await p.close();
 }
 await writeFile('docs/mission-11-evidence/audio/performance.json',JSON.stringify({method:'Sequential A vs B, three profiles and three identical mapped stations, sound off/on. Sixty forced acoustic context updates per condition: an upper-bound synchronous JS cost, not a normal per-frame cost or FPS/GPU benchmark. Game frame loop held; native audio runs. Source/voice/cache stats included; heap excludes native decoded memory. SwiftShader environment, no physical Android/GPU claims.',rows},null,2));console.log('PASS audio context CPU/budgets matrix');
}finally{await b.close()}
