import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('work/visual',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760}});page.setDefaultTimeout(60000);
 const errors=[],httpErrors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)httpErrors.push(`${r.status()} ${r.url()}`)});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Log.enable');
 cdp.on('Log.entryAdded',({entry})=>{if(entry.level==='error')errors.push(`${entry.text} ${entry.url??''}`)});
 await page.addInitScript(()=>{
  window.audioCreations={contexts:0,loops:0,resumes:0,suspends:0};const Native=window.AudioContext;
  window.AudioContext=class extends Native {constructor(...args){super(...args);window.audioCreations.contexts++;}createBufferSource(){const source=super.createBufferSource();const start=source.start.bind(source);source.start=(...args)=>{if(source.loop)window.audioCreations.loops++;return start(...args);};return source;}async resume(){await super.resume();window.audioCreations.resumes++;}async suspend(){await super.suspend();window.audioCreations.suspends++;}};
 });
 await page.goto('http://localhost:5173/endless-earth/?perf=1');
 await page.waitForFunction(()=>window.endlessDiagnostics?.ready);
 await page.waitForFunction(()=>!document.querySelector('#auto-walk').disabled);
 const state=()=>page.evaluate(()=>window.endlessDiagnostics);
 console.log('START',await state());assert.ok((await state()).natureAnchors>0,'birds and calls have vegetation anchors');
 await page.locator('#sound').click();assert.equal((await state()).sound,true);
 await page.locator('#auto-walk').click();assert.equal((await state()).autoWalk,true);
 const before=await state();await page.waitForFunction(p=>{const s=window.endlessDiagnostics;return Math.hypot(s.position[0]-p[0],s.position[2]-p[2])>.5},before.position,{timeout:90000});const after=await state();
 assert.ok(Math.hypot(after.position[0]-before.position[0],after.position[2]-before.position[2])>.5);
 console.log('WALK',after);
 for(const mode of ['first','aerial','third']){await page.keyboard.press('v');await page.waitForTimeout(1200);assert.equal((await state()).mode,mode);await page.screenshot({path:`work/visual/living-${mode}.png`});}
 await page.keyboard.down('d');await page.waitForFunction(()=>window.endlessDiagnostics.autoWalk===false);await page.keyboard.up('d');assert.equal((await state()).autoWalk,false);assert.match((await state()).walkMessage,/manuel/);
 await page.locator('#sound').click();await page.waitForFunction(()=>window.endlessDiagnostics.soundState==='suspended');
 for(let i=0;i<5;i++){
  await page.locator('#sound').click();await page.waitForFunction(()=>window.endlessDiagnostics.sound&&window.endlessDiagnostics.soundState==='running');
  await page.locator('#sound').click();await page.waitForFunction(()=>!window.endlessDiagnostics.sound&&window.endlessDiagnostics.soundState==='suspended');
 }
 // Dispatch a burst without waiting for resume/suspend promises in between.
 await page.evaluate(()=>{for(let i=0;i<12;i++)document.querySelector('#sound').click();});
 await page.waitForFunction(()=>!window.endlessDiagnostics.sound&&window.endlessDiagnostics.soundState==='suspended'&&document.querySelector('#sound').textContent==='Activer le son');
 await page.waitForFunction(()=>window.audioCreations.resumes===12&&window.audioCreations.suspends===12);
 assert.deepEqual(await page.evaluate(()=>window.audioCreations),{contexts:1,loops:2,resumes:12,suspends:12});
 console.log('AUDIO PASS: six full cycles + 12 rapid toggles, one context, two ambient sources');
 await page.locator('#auto-walk').click();await page.waitForTimeout(100);await page.locator('#auto-walk').click();assert.equal((await state()).autoWalk,false);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);await page.screenshot({path:'work/visual/living-mobile.png'});
 console.log('PERF',await page.locator('.perf-panel').innerText());
 console.log('GPU',await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown';}));
 assert.deepEqual(httpErrors,[]);assert.deepEqual(errors,[]);console.log('PASS: auto movement, three views, manual takeover, sound on/off, stop button, mobile, no JS errors');
}finally{await browser.close();}
