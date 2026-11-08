import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('work/visual',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760}});page.setDefaultTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5173/endless-earth/?perf=1');
 await page.waitForFunction(()=>window.endlessDiagnostics?.ready);
 await page.waitForFunction(()=>!document.querySelector('#auto-walk').disabled);
 const state=()=>page.evaluate(()=>window.endlessDiagnostics);
 console.log('START',await state());
 await page.locator('#sound').click();assert.equal((await state()).sound,true);
 await page.locator('#auto-walk').click();assert.equal((await state()).autoWalk,true);
 const before=await state();await page.waitForTimeout(6000);const after=await state();
 assert.ok(Math.hypot(after.position[0]-before.position[0],after.position[2]-before.position[2])>.5);
 console.log('WALK',after);
 for(const mode of ['third','first','aerial']){await page.keyboard.press('v');await page.waitForTimeout(1200);assert.equal((await state()).mode,mode);await page.screenshot({path:`work/visual/living-${mode}.png`});}
 await page.keyboard.down('d');await page.waitForTimeout(100);await page.keyboard.up('d');assert.equal((await state()).autoWalk,false);assert.match((await state()).walkMessage,/manuel/);
 await page.locator('#sound').click();assert.equal((await state()).sound,false);
 await page.locator('#auto-walk').click();await page.waitForTimeout(100);await page.locator('#auto-walk').click();assert.equal((await state()).autoWalk,false);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);await page.screenshot({path:'work/visual/living-mobile.png'});
 console.log('PERF',await page.locator('.perf-panel').innerText());
 console.log('GPU',await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown';}));
 assert.deepEqual(errors,[]);console.log('PASS: auto movement, three views, manual takeover, sound on/off, stop button, mobile, no JS errors');
}finally{await browser.close();}
