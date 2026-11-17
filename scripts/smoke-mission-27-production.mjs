import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {missionBrowserOptions,missionContextOptions} from './lib/mission-26-browser.mjs';
const browser=await chromium.launch(missionBrowserOptions()),out='docs/mission-27-evidence',record={method:'Uninstrumented production build, local exact immutable contact bytes, keyboard and CDP touch emulation. Not physical Android or a benchmark.',errors:[]};
try{
 const page=await browser.newPage({...missionContextOptions,viewport:{width:640,height:400},hasTouch:true});
 page.on('pageerror',e=>record.errors.push(String(e)));
 await page.route(/^https:\/\/raw\.githubusercontent\.com\/.*\/contact-2m\/([0-9-]+\.pack)$/,async route=>route.fulfill({status:200,body:await readFile('public/planet/fr-86/contact-2m/'+route.request().url().split('/').at(-1)),headers:{'access-control-allow-origin':'*'}}));
 await page.goto(`http://localhost:${Number(process.argv[2]??5407)}/endless-earth/?perf=1&spawnSeed=12345`);
 await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&window.endlessPlanetDiagnostics?.metrics.render?.enrichment?.tiles>=1,null,{timeout:240000});
 record.initial=await page.evaluate(()=>({player:window.endlessDiagnostics,planet:window.endlessPlanetDiagnostics}));
 const before=record.initial.player.position;await page.keyboard.down('d');
 await page.waitForFunction(p=>Math.hypot(window.endlessDiagnostics.position[0]-p[0],window.endlessDiagnostics.position[2]-p[2])>.05,before,{timeout:60000});await page.keyboard.up('d');
 record.keyboardMovementM=await page.evaluate(p=>Math.hypot(window.endlessDiagnostics.position[0]-p[0],window.endlessDiagnostics.position[2]-p[2]),before);
 await page.locator('#walk-menu-toggle').click();await page.locator('#sound').click();
 record.audio=await page.locator('#sound').innerText();assert.match(record.audio,/Désactiver le son/);
 const select=page.locator('select[aria-label="Profil graphique"]');record.profileOptions=await select.locator('option').evaluateAll(opts=>opts.map(o=>({value:o.value,text:o.textContent})));
 record.profiles=[];for(const p of record.profileOptions.filter(o=>['eco','balanced','quality'].includes(o.value))){await select.selectOption(p.value);record.profiles.push(p);}
 await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});
 const cdp=await page.context().newCDPSession(page),start=await page.evaluate(()=>window.endlessDiagnostics.position);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:64,y:690,radiusX:6,radiusY:6,force:1,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:104,y:690,radiusX:6,radiusY:6,force:1,id:1}]});await page.waitForTimeout(2500);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const end=await page.evaluate(()=>window.endlessDiagnostics.position);record.emulatedTouch={start,end,movementM:Math.hypot(end[0]-start[0],end[2]-start[2]),nativePhone:false};
 await page.screenshot({path:out+'/gallery/production-mobile.png'});record.final=await page.evaluate(()=>({player:window.endlessDiagnostics,planet:window.endlessPlanetDiagnostics}));
 record.noEvidenceHooks=await page.evaluate(()=>!window.m27&&!window.p252);assert.ok(record.noEvidenceHooks);assert.deepEqual(record.errors,[]);record.passed=true;
}catch(error){record.failure=String(error);record.passed=false;process.exitCode=1;}finally{await writeFile(out+'/production-smoke.json',JSON.stringify(record,null,2));await browser.close();}
console.log(JSON.stringify({passed:record.passed,failure:record.failure,touchMovementM:record.emulatedTouch?.movementM}));
